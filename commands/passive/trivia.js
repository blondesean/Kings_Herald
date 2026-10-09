/* Passive behavior: the Herald's daily trivia.
 *
 * Once a day, at a random moment inside the shared 9 AM-9 PM Eastern window
 * (see src/dailyLineup.js, which also schedules the daily puzzle and shop so
 * none of the three overlap), the Herald posts a nerd pop-culture trivia
 * question with four answer buttons (A/B/C/D).
 * Answering is done by clicking a button rather than reacting: Discord
 * reactions are public (anyone can see who reacted with what), which let
 * later answerers just copy whoever went first. A button click instead gets
 * an ephemeral reply that only the clicker sees, so choices stay secret until
 * the round closes. Clicking again changes the recorded answer — only the
 * last click before the window closes counts. Thirty minutes after posting
 * (half the daily Connections puzzle's 60-minute window — see
 * commands/puzzles/connections.js — since a single button click needs less
 * runway than a group talking out a 4-category puzzle), the round closes
 * and anyone whose final answer was correct earns
 * TRIVIA_POINTS. Anyone whose final answer was wrong gets lightly lambasted
 * by name in the results post (see flavor_text/triviaFlavor.js) - safe to do
 * once the round's over and answers are being revealed anyway, unlike
 * mid-round where they're kept secret.
 *
 * Seasonal reskin: during Halloween season, a round may draw from a separate
 * spooky question bank (flavor_text/halloweenTriviaQuestions.js) instead of
 * the usual one, with a matching in-character reskin of the question/results
 * posts (see flavor_text/halloweenTriviaFlavor.js and SEASONAL_CHANCE_BY_MONTH
 * below for the odds by month). Same rules, same points, just spookier.
 *
 * Subjective days: about half of all days (SUBJECTIVE_CHANCE), the slot goes
 * to a subjective round instead of a factual question: either a "would you
 * rather" (commands/passive/wouldYouRather.js) or a five-item ranking
 * (commands/passive/rankingRound.js), picked by a coin flip (RANKED_SHARE).
 * Those are different games with their own rules and scoring, so runTrivia
 * just hands off to them. This is rolled first,
 * so it applies in September and early October too; the Halloween-bank odds
 * below then only decide the other, factual, days. The exception is the last
 * stretch of October (SPOOKY_STRETCH_START_DAY through the 31st), which is
 * always the Halloween bank and never subjective — see rollToday.
 *
 * Exposes:
 *   runTrivia(client, opts) - runs one round; called by src/dailyLineup.js
 *                            and reused by the /trivia preview command
 *   rollToday(date) - today's { seasonal, subjective } roll; src/dailyLineup.js
 *                            rolls once and passes the result to runTrivia,
 *                            rather than letting runTrivia roll again
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findTriviaRole } = require('../../src/triviaRole');
const flavor = require('../../flavor_text');
const { runWouldYouRather } = require('./wouldYouRather');
const { runRankingRound } = require('./rankingRound');

const TIMEZONE = 'America/New_York';

const ANSWER_WINDOW_MS = 30 * 60 * 1000; // how long the question stays open — half the daily Connections puzzle's window (see commands/puzzles/connections.js)
const TRIVIA_POINTS = 2;

const LETTERS = ['A', 'B', 'C', 'D'];
const BUTTON_PREFIX = 'trivia_answer_';

const EMBED_COLOR = 0xd4af37; // heraldic gold
const HALLOWEEN_EMBED_COLOR = 0xff7518; // jack-o'-lantern orange

// Chance a factual round draws from the Halloween bank instead of the usual
// one, keyed by Date#getMonth() (0-indexed: 8 = September, 9 = October). Any
// month not listed here never rolls seasonal. This is rolled AFTER the
// subjective roll below, so it's the chance among the non-subjective days:
// September is roughly 33% of the factual half, October is all of it (except
// that the last stretch of the month skips the subjective roll entirely).
const SEASONAL_CHANCE_BY_MONTH = { 8: 0.33, 9: 1 };

// Chance a given day's round is a "would you rather" round instead of a
// factual question, in any month.
const SUBJECTIVE_CHANCE = 0.5;
// Chance that a subjective day is the ranking round rather than would-you-rather.
const RANKED_SHARE = 0.5;

// From this day of October through the 31st, every round is the Halloween
// bank: no subjective roll, no chance of a normal question.
const SPOOKY_STRETCH_START_DAY = 21;

// Month (1-12) and day of month in Eastern time. The daily window is
// Eastern-anchored but the container clock is UTC, whose date is already
// "tomorrow" for an evening round, which would shift the spooky stretch's edge.
const easternMonthDay = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, month: 'numeric', day: 'numeric' }).formatToParts(date);
    return {
        month: Number(parts.find((p) => p.type === 'month').value),
        day: Number(parts.find((p) => p.type === 'day').value),
    };
};

// Today's roll: { seasonal, subjective }. In the spooky stretch it's always a
// Halloween-bank factual round. Otherwise subjective is rolled first, and only
// a non-subjective day goes on to roll the Halloween bank. Takes the date so
// the odds can be tested for any day of the year.
const rollToday = (date = new Date()) => {
    const { month, day } = easternMonthDay(date);
    if (month === 10 && day >= SPOOKY_STRETCH_START_DAY) return { seasonal: true, subjective: false };

    const subjective = Math.random() < SUBJECTIVE_CHANCE;
    const seasonal = !subjective && Math.random() < (SEASONAL_CHANCE_BY_MONTH[month - 1] || 0);
    return { seasonal, subjective };
};

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// ---- question selection -----------------------------------------------------

// No-repeat cycle so scheduled rounds work through the whole question bank
// before any question repeats: each pick excludes whatever's already been
// asked since the last full cycle, and once nothing's left unasked, the
// cycle restarts. Preview/test runs (see runTrivia's `consumeBag` option)
// pick straight from the full bank instead, so testing doesn't burn through
// the cycle real play relies on.
//
// Tracked by question text via pointsStore.getUsedTriviaQuestions/
// setUsedTriviaQuestions (DynamoDB) rather than kept purely in memory, so a
// restart — Fargate Spot can reclaim the task with as little as a 2-minute
// warning — resumes the same cycle instead of starting over and risking an
// early repeat. Cached in memory once loaded so routine picks don't each
// cost a read; `null` means "not yet loaded from persistence".
let usedQuestions = null;

const nextQuestion = async (consumeBag, seasonal) => {
    const allQuestions = seasonal ? flavor.halloweenTriviaQuestions() : flavor.triviaQuestions();
    if (!consumeBag) {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }

    if (usedQuestions === null) {
        usedQuestions = await pointsStore.getUsedTriviaQuestions();
    }

    let candidates = allQuestions.filter((q) => !usedQuestions.includes(q.question));
    if (candidates.length === 0) {
        // Whole bank asked through since the last reset — start a fresh cycle.
        usedQuestions = [];
        candidates = allQuestions;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedQuestions.push(picked.question);

    try {
        await pointsStore.setUsedTriviaQuestions(usedQuestions);
    } catch (error) {
        console.error('Trivia: failed to persist used-question state:', error.message);
    }

    return picked;
};

// ---- helpers ----------------------------------------------------------------

const displayNameFor = (guild, user) => guild.members.cache.get(user.id)?.displayName || user.username;

// One row of A/B/C/D answer buttons. `disabled` is used to visually close
// voting once the round's answer window has ended.
const buildOptionRow = (disabled = false) =>
    new ActionRowBuilder().addComponents(
        LETTERS.map((letter) =>
            new ButtonBuilder()
                .setCustomId(`${BUTTON_PREFIX}${letter}`)
                .setLabel(letter)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled)
        )
    );

const buildQuestionPost = (question, seasonal) => {
    const optionLines = LETTERS.map((letter) => `**${letter}.** ${question.options[letter]}`).join('\n');
    const introLine = seasonal ? pick(flavor.halloweenTriviaIntroLines()) : 'Hear ye! A test of knowledge for the court:';
    const embed = new EmbedBuilder()
        .setColor(seasonal ? HALLOWEEN_EMBED_COLOR : EMBED_COLOR)
        .setTitle(seasonal ? "The Herald's All Hallows' Trivia" : "The Herald's Daily Trivia")
        .setDescription(`${introLine}\n\n**${question.question}**\n\n${optionLines}`)
        .setFooter({ text: `Click the button matching thy answer within ${ANSWER_WINDOW_MS / 60000} minutes — thy choice stays secret 'til the round closes, and thou mayest change it 'til then. Scrying the Great Web for answers is known to invite a curse upon thy house name!` })
        .setTimestamp();

    return { embeds: [embed], components: [buildOptionRow(false)] };
};

// Collect answers via button clicks for `windowMs`, then resolve with
// { participants, winners }. participants is [{ userId, displayName, letter }]
// for everyone who clicked an answer button — only their final click before
// the window closes counts, so there's no reaction-style hedging to guard
// against. Each click gets an ephemeral reply (visible only to the clicker),
// so no one can see what anyone else picked. Bot clicks are ignored outright
// (no reply, no recorded vote) — only real members can win trivia points.
const collectAnswers = (message, guild, correctLetter, windowMs) =>
    new Promise((resolve) => {
        const votesByUser = new Map(); // userId -> { displayName, letter }

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: windowMs,
        });

        collector.on('collect', async (buttonInteraction) => {
            // A bot account with permission to click buttons (another bot in
            // the server, say) shouldn't be able to win trivia points.
            if (buttonInteraction.user.bot) return;

            const letter = buttonInteraction.customId.slice(BUTTON_PREFIX.length);
            const changed = votesByUser.has(buttonInteraction.user.id);
            votesByUser.set(buttonInteraction.user.id, {
                displayName: displayNameFor(guild, buttonInteraction.user),
                letter,
            });

            const reply = changed
                ? `Thy answer is changed to **${letter}** — recorded in secret!`
                : `Thy answer, **${letter}**, is recorded in secret!`;
            await buttonInteraction.reply({ content: reply, flags: MessageFlags.Ephemeral }).catch(() => {});
        });

        collector.on('end', () => {
            const participants = [...votesByUser.entries()].map(([userId, { displayName, letter }]) => ({
                userId,
                displayName,
                letter,
            }));

            const winners = participants
                .filter((p) => p.letter === correctLetter)
                .map((p) => ({ userId: p.userId, displayName: p.displayName, points: TRIVIA_POINTS }));

            resolve({ participants, winners });
        });
    });

// Log exactly who participated, what they picked, and who won — so a round
// can be audited in CloudWatch without re-deriving it from Discord.
const logRoundBreakdown = (guildId, question, participants, winners, runLabel) => {
    const tag = `[${runLabel}] guild ${guildId}`;
    console.log(`Trivia round (${tag}): "${question.question}" — correct answer: ${question.correct}`);

    if (!participants.length) {
        console.log(`Trivia round (${tag}): no one answered.`);
        return;
    }

    for (const p of participants) {
        const won = winners.some((w) => w.userId === p.userId);
        console.log(`  ${p.displayName} (${p.userId}): picked ${p.letter} — ${won ? `+${TRIVIA_POINTS} correct` : 'no points'}`);
    }
    console.log(`Trivia round (${tag}): ${winners.length} of ${participants.length} participant(s) earned points.`);
};

const SIGNUP_NOTE = '\n\n*Wish to be summoned the instant future questions are posed? Use /trivia_signup!*';

// Lightly lambasts anyone who answered incorrectly — safe to name now that
// the round is over and everyone's final answer is already being revealed
// (unlike during the round, where answers stay secret; see collectAnswers).
const lambastFor = (participants, correctLetter) => {
    const losers = participants.filter((p) => p.letter !== correctLetter);
    if (!losers.length) return '';

    const mentions = losers.map((l) => `<@${l.userId}>`).join(', ');
    return `\n\n${pick(flavor.triviaLambastLines(mentions, losers.length))}`;
};

const buildResultsPost = (question, winners, participants, persist, seasonal) => {
    const answerLine = `The correct answer was **${question.correct}. ${question.options[question.correct]}**.`;
    const previewNote = persist ? '' : '\n*(This be but a rehearsal — no points were truly bestowed.)*';
    const lambastLine = lambastFor(participants, question.correct);
    const closingLine = seasonal ? `\n\n*${pick(flavor.halloweenTriviaClosingLines())}*` : '';

    if (winners.length === 0) {
        return `${answerLine}\n\nAlas, none of the court answered true and true alone. Sharper wits next time!${lambastLine}${previewNote}${closingLine}${SIGNUP_NOTE}`;
    }

    const mentions = winners.map((w) => `<@${w.userId}>`).join(', ');
    const nobleWord = winners.length === 1 ? 'noble' : 'nobles';
    return `${answerLine}\n\nLet it be proclaimed: ${mentions} — ${winners.length === 1 ? 'this' : 'these'} wise ${nobleWord} answered true and true alone, earning ${TRIVIA_POINTS} points apiece!${lambastLine}${previewNote}${closingLine}${SIGNUP_NOTE}`;
};

// ---- entry points -------------------------------------------------------------

/* Run one trivia round.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to write points to DynamoDB (default: false)
 *   consumeBag    - whether this round draws from (and advances) the
 *                    no-repeat shuffle bag, vs. a plain random pick
 *                    (default: same as persist)
 *   seasonal      - force this round to draw from the Halloween bank (true)
 *                    or the usual one (false); omit to use today's roll
 *   subjective    - force this to be a subjective round (true) or a factual
 *                    one (false); omit to use today's roll (see rollToday).
 *                    True wins over `seasonal` if both are forced.
 *   subjectiveKind - 'wouldYouRather' or 'ranking': which subjective game to
 *                    run; omit to flip a coin (RANKED_SHARE). Only matters
 *                    when the round is subjective.
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                    persist, else "preview")
 */
const runTrivia = async function (client, options = {}) {
    const roll = rollToday();
    const {
        guild,
        targetChannel,
        persist = false,
        consumeBag = persist,
        seasonal = roll.seasonal,
        subjective = roll.subjective,
        subjectiveKind = Math.random() < RANKED_SHARE ? 'ranking' : 'wouldYouRather',
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    if (subjective) {
        console.log(`Trivia: today's round is subjective (${subjectiveKind}) [${runLabel}].`);
        const runSubjective = subjectiveKind === 'ranking' ? runRankingRound : runWouldYouRather;
        await runSubjective(client, { guild, targetChannel, persist, consumeBag, runLabel });
        return;
    }

    const question = await nextQuestion(consumeBag, seasonal);
    if (seasonal) console.log(`Trivia: today's round is seasonal (Halloween bank) [${runLabel}].`);

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'trivia', findAnnounceChannel);
            if (!channel) {
                console.log(`Trivia: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            // Only the real scheduled round pings signed-up members
            // (/trivia_signup) — preview runs shouldn't spam them.
            const post = buildQuestionPost(question, seasonal);
            if (persist) {
                const role = findTriviaRole(g);
                if (role) post.content = `<@&${role.id}>`;
            }

            const message = await channel.send(post);
            console.log(`Trivia: posted round to #${channel.name} in "${g.name}" [${runLabel}]. Closes in ${ANSWER_WINDOW_MS / 60000} minutes.`);

            const { participants, winners } = await collectAnswers(message, g, question.correct, ANSWER_WINDOW_MS);
            await message.edit({ components: [buildOptionRow(true)] }).catch((error) =>
                console.error(`Trivia: could not disable buttons for guild "${g.name}":`, error.message)
            );
            logRoundBreakdown(g.id, question, participants, winners, runLabel);

            if (persist && winners.length) {
                try {
                    await pointsStore.addPoints(g.id, winners);
                    console.log(`Trivia: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Trivia: failed to persist points:', storeError.message);
                }
            }

            await channel.send(buildResultsPost(question, winners, participants, persist, seasonal));
        } catch (guildError) {
            console.error(`Trivia round failed for guild "${g.name}":`, guildError);
        }
    }
};

module.exports = { runTrivia, rollToday };
