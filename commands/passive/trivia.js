/* Passive behavior: the Herald's daily trivia.
 *
 * Once a day, at a random moment inside an 18-hour window (9:00 AM Eastern to
 * 3:00 AM Eastern the next day — i.e. 6:00 AM to midnight Pacific), the Herald
 * posts a nerd pop-culture trivia question with four answers (A/B/C/D), seeded
 * with the corresponding regional-indicator reactions. Five minutes later it
 * closes the question: anyone who reacted with exactly one of the four option
 * emojis, and it was the correct one, earns TRIVIA_POINTS. Reacting with more
 * than one option (hedging) disqualifies that member for the round.
 *
 * The random start time only lands on a 15-minute boundary within the window
 * (9:00, 9:15, 9:30, ...), chosen fresh once a day.
 *
 * Exposes:
 *   scheduleTrivia(client) - registers the daily randomized timer (call once, on ready)
 *   runTrivia(client, opts) - runs one round; reused by the /trivia preview command
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const flavor = require('../../flavor_text');

// Window start (Eastern local time) and length. The window runs 9:00 AM to
// 3:00 AM the following day Eastern, which is 6:00 AM to midnight Pacific —
// an 18-hour span either way you name it.
const WINDOW_CRON = '0 9 * * *';
const WINDOW_HOURS = 18;
const TIMEZONE = 'America/New_York';

const SLOT_MINUTES = 15;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES; // 72 possible start times

const ANSWER_WINDOW_MS = 5 * 60 * 1000; // how long the question stays open
const TRIVIA_POINTS = 2;

const OPTION_EMOJIS = ['🇦', '🇧', '🇨', '🇩'];
const LETTERS = ['A', 'B', 'C', 'D'];
const LETTER_BY_EMOJI = Object.fromEntries(OPTION_EMOJIS.map((emoji, i) => [emoji, LETTERS[i]]));

const EMBED_COLOR = 0xd4af37; // heraldic gold

// ---- question selection -----------------------------------------------------

// Shuffle bag so scheduled rounds work through the whole question bank before
// any question repeats. Preview/test runs (see runTrivia's `consumeBag` option)
// pick straight from the full bank instead, so testing doesn't burn through
// the bag real play relies on.
let bag = [];
const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const nextQuestion = (consumeBag) => {
    const allQuestions = flavor.triviaQuestions();
    if (!consumeBag) {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }
    if (bag.length === 0) {
        bag = shuffle(allQuestions);
    }
    return bag.pop();
};

// ---- helpers ----------------------------------------------------------------

const displayNameFor = (guild, user) => guild.members.cache.get(user.id)?.displayName || user.username;

const buildQuestionPost = (question) => {
    const optionLines = LETTERS.map((letter) => `**${letter}.** ${question.options[letter]}`).join('\n');
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Daily Trivia")
        .setDescription(`Hear ye! A test of knowledge for the court:\n\n**${question.question}**\n\n${optionLines}`)
        .setFooter({ text: `React with the matching letter within ${ANSWER_WINDOW_MS / 60000} minutes. Choose only one — hedging thy bets earns no favor, and scrying the Great Web for answers is known to invite a curse upon thy house name!` })
        .setTimestamp();

    return { embeds: [embed] };
};

// Fetch each option reaction's users (minus the Herald's own seed reactions)
// and return { participants, winners } where participants is
// [{ userId, displayName, letters: ['A', 'B', ...] }] for everyone who reacted
// with at least one option emoji, and winners is the subset who reacted with
// exactly one emoji and got it right.
const tallyReactions = async (message, guild, correctLetter) => {
    const botId = message.client.user.id;
    const lettersByUser = new Map(); // userId -> { displayName, letters: Set }

    for (const emoji of OPTION_EMOJIS) {
        const reaction = message.reactions.cache.get(emoji);
        if (!reaction) continue;

        const users = await reaction.users.fetch();
        for (const user of users.values()) {
            if (user.id === botId) continue;

            const entry = lettersByUser.get(user.id) || {
                displayName: displayNameFor(guild, user),
                letters: new Set(),
            };
            entry.letters.add(LETTER_BY_EMOJI[emoji]);
            lettersByUser.set(user.id, entry);
        }
    }

    const participants = [...lettersByUser.entries()].map(([userId, entry]) => ({
        userId,
        displayName: entry.displayName,
        letters: [...entry.letters].sort(),
    }));

    const winners = participants
        .filter((p) => p.letters.length === 1 && p.letters[0] === correctLetter)
        .map((p) => ({ userId: p.userId, displayName: p.displayName, points: TRIVIA_POINTS }));

    return { participants, winners };
};

// Log exactly who participated, what they picked, and who won — so a round
// can be audited in CloudWatch without re-deriving it from Discord.
const logRoundBreakdown = (guildId, question, participants, winners, runLabel) => {
    const tag = `[${runLabel}] guild ${guildId}`;
    console.log(`Trivia round (${tag}): "${question.question}" — correct answer: ${question.correct}`);

    if (!participants.length) {
        console.log(`Trivia round (${tag}): no one reacted.`);
        return;
    }

    for (const p of participants) {
        const won = winners.some((w) => w.userId === p.userId);
        console.log(`  ${p.displayName} (${p.userId}): picked [${p.letters.join(', ')}] — ${won ? `+${TRIVIA_POINTS} correct` : 'no points'}`);
    }
    console.log(`Trivia round (${tag}): ${winners.length} of ${participants.length} participant(s) earned points.`);
};

const buildResultsPost = (question, winners, persist) => {
    const answerLine = `The correct answer was **${question.correct}. ${question.options[question.correct]}**.`;
    const previewNote = persist ? '' : '\n*(This be but a rehearsal — no points were truly bestowed.)*';

    if (winners.length === 0) {
        return `${answerLine}\n\nAlas, none of the court answered true and true alone. Sharper wits next time!${previewNote}`;
    }

    const mentions = winners.map((w) => `<@${w.userId}>`).join(', ');
    const nobleWord = winners.length === 1 ? 'noble' : 'nobles';
    return `${answerLine}\n\nLet it be proclaimed: ${mentions} — ${winners.length === 1 ? 'this' : 'these'} wise ${nobleWord} answered true and true alone, earning ${TRIVIA_POINTS} points apiece!${previewNote}`;
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
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                    persist, else "preview")
 */
const runTrivia = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        consumeBag = persist,
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const question = nextQuestion(consumeBag);

    for (const g of guilds) {
        try {
            const channel = targetChannel || findAnnounceChannel(g);
            if (!channel) {
                console.log(`Trivia: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const message = await channel.send(buildQuestionPost(question));
            for (const emoji of OPTION_EMOJIS) {
                await message.react(emoji);
            }
            console.log(`Trivia: posted round to #${channel.name} in "${g.name}" [${runLabel}]. Closes in ${ANSWER_WINDOW_MS / 60000} minutes.`);

            await new Promise((resolve) => setTimeout(resolve, ANSWER_WINDOW_MS));

            const { participants, winners } = await tallyReactions(message, g, question.correct);
            logRoundBreakdown(g.id, question, participants, winners, runLabel);

            if (persist && winners.length) {
                try {
                    await pointsStore.addPoints(g.id, winners);
                    console.log(`Trivia: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Trivia: failed to persist points:', storeError.message);
                }
            }

            await channel.send(buildResultsPost(question, winners, persist));
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

            console.log(`Trivia: today's round will fire at ~${fireAt.toISOString()} (slot ${slot + 1}/${SLOT_COUNT}).`);

            setTimeout(() => {
                console.log('Running scheduled trivia round...');
                runTrivia(client, { persist: true }).catch((error) =>
                    console.error('Scheduled trivia round failed:', error)
                );
            }, delayMs);
        },
        { timezone: TIMEZONE }
    );

    console.log(`Trivia scheduled: window opens "${WINDOW_CRON}" (${TIMEZONE}), random ${SLOT_MINUTES}-minute slot across ${WINDOW_HOURS}h.`);
};

module.exports = { scheduleTrivia, runTrivia };
