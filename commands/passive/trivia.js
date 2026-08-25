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
 * last click before the window closes counts. Five minutes after posting,
 * the round closes and anyone whose final answer was correct earns
 * TRIVIA_POINTS.
 *
 * The random start time only lands on a 15-minute boundary within the window
 * (9:00, 9:15, 9:30, ...), chosen fresh once a day.
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

const ANSWER_WINDOW_MS = 5 * 60 * 1000; // how long the question stays open
const TRIVIA_POINTS = 2;

const LETTERS = ['A', 'B', 'C', 'D'];
const BUTTON_PREFIX = 'trivia_answer_';

// The Date today's round is armed to fire, set when the window opens and
// cleared once it actually runs. In memory only — not persisted, so a
// restart loses it until the next window open (see scheduleTrivia).
let scheduledFireAt = null;
const getScheduledFireTime = () => scheduledFireAt;

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

const buildQuestionPost = (question) => {
    const optionLines = LETTERS.map((letter) => `**${letter}.** ${question.options[letter]}`).join('\n');
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Daily Trivia")
        .setDescription(`Hear ye! A test of knowledge for the court:\n\n**${question.question}**\n\n${optionLines}`)
        .setFooter({ text: `Click the button matching thy answer within ${ANSWER_WINDOW_MS / 60000} minutes — thy choice stays secret 'til the round closes, and thou mayest change it 'til then. Scrying the Great Web for answers is known to invite a curse upon thy house name!` })
        .setTimestamp();

    return { embeds: [embed], components: [buildOptionRow(false)] };
};

// Collect answers via button clicks for `windowMs`, then resolve with
// { participants, winners }. participants is [{ userId, displayName, letter }]
// for everyone who clicked an answer button — only their final click before
// the window closes counts, so there's no reaction-style hedging to guard
// against. Each click gets an ephemeral reply (visible only to the clicker),
// so no one can see what anyone else picked.
const collectAnswers = (message, guild, correctLetter, windowMs) =>
    new Promise((resolve) => {
        const votesByUser = new Map(); // userId -> { displayName, letter }

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: windowMs,
        });

        collector.on('collect', async (buttonInteraction) => {
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

const buildResultsPost = (question, winners, persist) => {
    const answerLine = `The correct answer was **${question.correct}. ${question.options[question.correct]}**.`;
    const previewNote = persist ? '' : '\n*(This be but a rehearsal — no points were truly bestowed.)*';

    if (winners.length === 0) {
        return `${answerLine}\n\nAlas, none of the court answered true and true alone. Sharper wits next time!${previewNote}${SIGNUP_NOTE}`;
    }

    const mentions = winners.map((w) => `<@${w.userId}>`).join(', ');
    const nobleWord = winners.length === 1 ? 'noble' : 'nobles';
    return `${answerLine}\n\nLet it be proclaimed: ${mentions} — ${winners.length === 1 ? 'this' : 'these'} wise ${nobleWord} answered true and true alone, earning ${TRIVIA_POINTS} points apiece!${previewNote}${SIGNUP_NOTE}`;
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

            // Only the real scheduled round pings signed-up members
            // (/trivia_signup) — preview runs shouldn't spam them.
            const post = buildQuestionPost(question);
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
