/* Passive behavior: the Herald's daily trivia.
 *
 * Once a day, at a random moment inside a 15-hour window (9:00 AM Eastern to
 * midnight Eastern — i.e. 6:00 AM to 9:00 PM Pacific), the Herald posts a
 * nerd pop-culture trivia question with four answer buttons (A/B/C/D).
 * Answering is done by clicking a button rather than reacting: Discord
 * reactions are public (anyone can see who reacted with what), which let
 * later answerers just copy whoever went first. A button click instead gets
 * an ephemeral reply that only the clicker sees, so choices stay secret until
 * the round closes. Clicking again changes the recorded answer — only the
 * last click before the window closes counts. Fifteen minutes after posting
 * (matching the daily Connections puzzle's window — see
 * commands/puzzles/connections.js — so the two line up), the round closes
 * and anyone whose final answer was correct earns
 * TRIVIA_POINTS. Anyone whose final answer was wrong gets lightly lambasted
 * by name in the results post (see flavor_text/triviaFlavor.js) - safe to do
 * once the round's over and answers are being revealed anyway, unlike
 * mid-round where they're kept secret.
 *
 * The random start time only lands on a 15-minute boundary within the window
 * (9:00, 9:15, 9:30, ...), chosen fresh once a day.
 *
 * Seasonal reskin: during Halloween season, a round may draw from a separate
 * spooky question bank (flavor_text/halloweenTriviaQuestions.js) instead of
 * the usual one, with a matching in-character reskin of the question/results
 * posts (see flavor_text/halloweenTriviaFlavor.js and SEASONAL_CHANCE_BY_MONTH
 * below for the odds by month). Same rules, same points, just spookier.
 *
 * Exposes:
 *   scheduleTrivia(client) - registers the daily randomized timer (call once, on ready)
 *   runTrivia(client, opts) - runs one round; reused by the /trivia preview command
 *   getScheduledFireTime() - the Date today's round is armed to fire, or null
 *                            if the window hasn't opened yet or already fired;
 *                            backs the /trivia_time preview command
 */

const cron = require('node-cron');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { findTriviaRole } = require('../../src/triviaRole');
const flavor = require('../../flavor_text');

// Window start (Eastern local time) and length. The window runs 9:00 AM to
// midnight Eastern, which is 6:00 AM to 9:00 PM Pacific — a 15-hour span
// either way you name it.
const WINDOW_CRON = '0 9 * * *';
const WINDOW_HOURS = 15;
const TIMEZONE = 'America/New_York';

const SLOT_MINUTES = 15;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES; // 60 possible start times

const ANSWER_WINDOW_MS = 15 * 60 * 1000; // how long the question stays open — matches the daily Connections puzzle's window (see commands/puzzles/connections.js)
const TRIVIA_POINTS = 2;

const LETTERS = ['A', 'B', 'C', 'D'];
const BUTTON_PREFIX = 'trivia_answer_';

// The Date today's round is armed to fire, set when the window opens and
// cleared once it actually runs. In memory only — not persisted, so a
// restart loses it until the next window open (see scheduleTrivia).
let scheduledFireAt = null;
const getScheduledFireTime = () => scheduledFireAt;

const EMBED_COLOR = 0xd4af37; // heraldic gold
const HALLOWEEN_EMBED_COLOR = 0xff7518; // jack-o'-lantern orange

// Chance a given day's round draws from the Halloween bank instead of the
// usual one, keyed by Date#getMonth() (0-indexed: 8 = September, 9 =
// October). Any month not listed here never rolls seasonal.
const SEASONAL_CHANCE_BY_MONTH = { 8: 0.33, 9: 1 };

const isSeasonalToday = () => Math.random() < (SEASONAL_CHANCE_BY_MONTH[new Date().getMonth()] || 0);

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
 *                    or the usual one (false); omit to roll the odds for
 *                    today per SEASONAL_CHANCE_BY_MONTH
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                    persist, else "preview")
 */
const runTrivia = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        consumeBag = persist,
        seasonal = isSeasonalToday(),
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const question = await nextQuestion(consumeBag, seasonal);
    if (seasonal) console.log(`Trivia: today's round is seasonal (Halloween bank) [${runLabel}].`);

    for (const g of guilds) {
        try {
            const channel = targetChannel || findAnnounceChannel(g);
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

/* Register the daily trivia timer. Call once after the client is ready.
 * Fires a cron job at the window's opening moment (9:00 AM Eastern), which
 * picks a random 15-minute-aligned slot within the window and sets a single
 * timeout to actually run trivia at that moment. If the bot restarts between
 * the window opening and the chosen slot, that day's round is skipped — no
 * state is persisted across restarts, matching the weekly recap's cron.
 */
const scheduleTrivia = function (client) {
    if (!cron.validate(WINDOW_CRON)) {
        console.error(`Trivia: invalid cron expression "${WINDOW_CRON}"; not scheduled.`);
        return;
    }

    cron.schedule(
        WINDOW_CRON,
        () => {
            const slot = Math.floor(Math.random() * SLOT_COUNT);
            const delayMs = slot * SLOT_MINUTES * 60 * 1000;
            const fireAt = new Date(Date.now() + delayMs);
            scheduledFireAt = fireAt;

            console.log(`Trivia: today's round will fire at ~${fireAt.toISOString()} (slot ${slot + 1}/${SLOT_COUNT}).`);

            setTimeout(() => {
                console.log('Running scheduled trivia round...');
                scheduledFireAt = null;
                runTrivia(client, { persist: true }).catch((error) =>
                    console.error('Scheduled trivia round failed:', error)
                );
            }, delayMs);
        },
        { timezone: TIMEZONE }
    );

    console.log(`Trivia scheduled: window opens "${WINDOW_CRON}" (${TIMEZONE}), random ${SLOT_MINUTES}-minute slot across ${WINDOW_HOURS}h.`);
};

module.exports = { scheduleTrivia, runTrivia, getScheduledFireTime };
