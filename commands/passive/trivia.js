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
 * Seasonal reskins: in some months a round draws from a seasonal question
 * bank instead of the usual one, with a matching in-character reskin of the
 * question/results posts (see SEASONS below). Halloween season has a spooky
 * bank (flavor_text/halloweenTriviaQuestions.js, odds by month in
 * SEASON_BY_MONTH), and December has a winter one
 * (flavor_text/winterTriviaQuestions.js). Same rules, same points.
 *
 * Subjective days: about half of all days (SUBJECTIVE_CHANCE), the slot goes
 * to a subjective round instead of a factual question: either a "would you
 * rather" (commands/passive/wouldYouRather.js) or a five-item ranking
 * (commands/passive/rankingRound.js), picked by a coin flip (RANKED_SHARE).
 * Those are different games with their own rules and scoring, so runTrivia
 * just hands off to them. This is rolled first,
 * so it applies in September and early October too; the Halloween-bank odds
 * below then only decide the other, factual, days. The exceptions are the
 * SEASONAL_STRETCHES (October 21-31 and all of December), which are always
 * their seasonal bank and never subjective — see rollToday.
 *
 * Exposes:
 *   runTrivia(client, opts) - runs one round; called by src/dailyLineup.js
 *                            and reused by the /trivia preview command
 *   rollToday(date) - today's { season, subjective } roll; src/dailyLineup.js
 *                            rolls once and passes the result to runTrivia,
 *                            rather than letting runTrivia roll again
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const achievements = require('../../src/achievements');
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

// The seasonal banks, by name: each swaps in its own questions and reskins
// the question and results posts.
const SEASONS = {
    halloween: {
        questions: () => flavor.halloweenTriviaQuestions(),
        introLines: () => flavor.halloweenTriviaIntroLines(),
        closingLines: () => flavor.halloweenTriviaClosingLines(),
        title: "The Herald's All Hallows' Trivia",
        color: 0xff7518, // jack-o'-lantern orange
    },
    winter: {
        questions: () => flavor.winterTriviaQuestions(),
        introLines: () => flavor.winterTriviaIntroLines(),
        closingLines: () => flavor.winterTriviaClosingLines(),
        title: "The Herald's Midwinter Trivia",
        color: 0x2e7d32, // evergreen
    },
};

// Chance a factual round draws from a seasonal bank instead of the usual
// one, keyed by Eastern month (1-12). Any month not listed here never rolls
// seasonal. This is rolled AFTER the subjective roll below, so it's the
// chance among the non-subjective days: September is roughly 33% of the
// factual half, October is all of it (except that the last stretch of the
// month skips the subjective roll entirely).
const SEASON_BY_MONTH = {
    9: { season: 'halloween', chance: 0.33 },
    10: { season: 'halloween', chance: 1 },
};

// Chance a given day's round is a "would you rather" round instead of a
// factual question, in any month.
const SUBJECTIVE_CHANCE = 0.5;
// Chance that a subjective day is the ranking round rather than would-you-rather.
const RANKED_SHARE = 0.5;

// From each stretch's start day through the end of its month, every round is
// that season's bank: no subjective roll, no chance of a normal question.
// The winter bank holds 31 questions, one for each day of December.
const SEASONAL_STRETCHES = [
    { month: 10, fromDay: 21, season: 'halloween' },
    { month: 12, fromDay: 1, season: 'winter' },
];

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

// Today's roll: { season, subjective }, season being a SEASONS name or null
// for the usual bank. In a seasonal stretch it's always that season's
// factual round. Otherwise subjective is rolled first, and only a
// non-subjective day goes on to roll the month's seasonal bank, if any.
// Takes the date so the odds can be tested for any day of the year.
const rollToday = (date = new Date()) => {
    const { month, day } = easternMonthDay(date);
    const stretch = SEASONAL_STRETCHES.find((s) => s.month === month && day >= s.fromDay);
    if (stretch) return { season: stretch.season, subjective: false };

    const subjective = Math.random() < SUBJECTIVE_CHANCE;
    const odds = SEASON_BY_MONTH[month];
    const season = !subjective && odds && Math.random() < odds.chance ? odds.season : null;
    return { season, subjective };
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

const nextQuestion = async (consumeBag, season) => {
    const allQuestions = season ? SEASONS[season].questions() : flavor.triviaQuestions();
    if (!consumeBag) {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }

    if (usedQuestions === null) {
        usedQuestions = await pointsStore.getUsedTriviaQuestions();
    }

    let candidates = allQuestions.filter((q) => !usedQuestions.includes(q.question));
    if (candidates.length === 0) {
        // This whole bank asked through since its last reset: start it on a
        // fresh cycle, leaving the other banks' cycles where they are. (The
        // winter bank runs out every December 31, which would otherwise
        // reset the main bank's cycle the next December.)
        const bank = new Set(allQuestions.map((q) => q.question));
        usedQuestions = usedQuestions.filter((q) => !bank.has(q));
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

const buildQuestionPost = (question, season) => {
    const theme = season ? SEASONS[season] : null;
    const optionLines = LETTERS.map((letter) => `**${letter}.** ${question.options[letter]}`).join('\n');
    const introLine = theme ? pick(theme.introLines()) : 'Hear ye! A test of knowledge for the court:';
    const embed = new EmbedBuilder()
        .setColor(theme ? theme.color : EMBED_COLOR)
        .setTitle(theme ? theme.title : "The Herald's Daily Trivia")
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

const SIGNUP_NOTE = '\n\n*Wish to be summoned the instant future questions are posed? Use /signup trivia!*';

// Lightly lambasts anyone who answered incorrectly — safe to name now that
// the round is over and everyone's final answer is already being revealed
// (unlike during the round, where answers stay secret; see collectAnswers).
const lambastFor = (participants, correctLetter) => {
    const losers = participants.filter((p) => p.letter !== correctLetter);
    if (!losers.length) return '';

    const mentions = losers.map((l) => `<@${l.userId}>`).join(', ');
    return `\n\n${pick(flavor.triviaLambastLines(mentions, losers.length))}`;
};

const buildResultsPost = (question, winners, participants, persist, season) => {
    const answerLine = `The correct answer was **${question.correct}. ${question.options[question.correct]}**.`;
    const previewNote = persist ? '' : '\n*(This be but a rehearsal — no points were truly bestowed.)*';
    const lambastLine = lambastFor(participants, question.correct);
    const closingLine = season ? `\n\n*${pick(SEASONS[season].closingLines())}*` : '';

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
 *   season        - force this round to draw from a seasonal bank (a SEASONS
 *                    name, e.g. 'winter') or the usual one (null); omit to
 *                    use today's roll
 *   subjective    - force this to be a subjective round (true) or a factual
 *                    one (false); omit to use today's roll (see rollToday).
 *                    True wins over `season` if both are forced.
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
        season = roll.season,
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

    const question = await nextQuestion(consumeBag, season);
    if (season) console.log(`Trivia: today's round is seasonal (${season} bank) [${runLabel}].`);

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'trivia', findAnnounceChannel);
            if (!channel) {
                console.log(`Trivia: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            // Only the real scheduled round pings signed-up members
            // (/signup trivia) — preview runs shouldn't spam them.
            const post = buildQuestionPost(question, season);
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
                    await pointsStore.addPoints(g.id, winners, 'trivia');
                    console.log(`Trivia: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Trivia: failed to persist points:', storeError.message);
                }
            }

            await channel.send(buildResultsPost(question, winners, participants, persist, season));
            if (persist && winners.length) {
                await achievements.record(g.id, winners.map((w) => ({ userId: w.userId, displayName: w.displayName, counts: { trivia: 1 } })), channel);
            }
        } catch (guildError) {
            console.error(`Trivia round failed for guild "${g.name}":`, guildError);
        }
    }
};

module.exports = { runTrivia, rollToday };
