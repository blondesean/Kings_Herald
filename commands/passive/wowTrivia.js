/* Passive behavior: WoW Trivia Wednesdays.
 *
 * Every Wednesday at 9 PM Eastern, the Herald automatically fires a WoW
 * trivia session in every guild's announce channel — the same game as the
 * admin-triggered /wow_trivia preview command, just on autopilot. Both entry
 * points share this module's runWowTrivia so the rules never drift between
 * "someone typed /wow_trivia" and "it's Wednesday."
 *
 * The game itself (see runWowTriviaSession below): free-text, speed-based
 * per question — members type their answer directly in the channel, and
 * only whoever answers correctly FIRST wins that question. Matching is
 * exact after trimming and lowercasing — no fuzzy/typo tolerance beyond
 * whatever accepted-answer variants the bank itself already lists (e.g.
 * "Ironforge" / "IF"). No points change hands per question — whoever wins
 * the most questions across the session is crowned champion at the end and
 * paid a flat CHAMPION_POINTS (ties share the crown, each paid in full).
 *
 * Like /trivia and /recap, a manual /wow_trivia run defaults to persist:
 * false, so admins can test the flow without inflating the leaderboard —
 * only the scheduled Wednesday run (persist: true) actually pays out.
 *
 * The bank spans vanilla through early Wrath-era WoW, so a few answers have
 * gone stale since (a "will be added in the next patch" question, say). The
 * Herald leans into this rather than hiding it: he drops into an orcish
 * voice for the whole session and frames it as a trip back to that era —
 * Thrall as Warchief of the Horde, Varian Wrynn as High King of the
 * Alliance — see flavor_text/wowTriviaFlavor.js.
 *
 * Exposes:
 *   scheduleWowTriviaWednesday(client) - registers the weekly timer (call once, on ready)
 *   runWowTrivia(client, opts) - runs one session; reused by the /wow_trivia preview command
 *   MAX_QUESTIONS - the option cap /wow_trivia's `questions` option is built against
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { findWowTriviaRole } = require('../../src/wowTriviaRole');
const flavor = require('../../flavor_text');

// Every Wednesday at 9:00 PM, interpreted in Eastern local time (DST-aware)
// so it stays at local 9 PM year-round, matching how the other schedules
// (weekly recap, daily trivia's window) treat "Eastern."
const CRON_EXPRESSION = '0 21 * * 3';
const TIMEZONE = 'America/New_York';
const WEDNESDAY_QUESTIONS = 5;

const ANSWER_WINDOW_MS = 30 * 1000;
const CHAMPION_POINTS = 2; // flat award to the session's champion, regardless of how many questions were asked
const MAX_QUESTIONS = 15; // 15 * 30s = 7.5 minutes worst case

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const normalize = (text) => text.trim().toLowerCase();

const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const joinMentions = (ids) => {
    const mentions = ids.map((id) => `<@${id}>`);
    if (mentions.length === 1) return mentions[0];
    if (mentions.length === 2) return `${mentions[0]} and ${mentions[1]}`;
    return `${mentions.slice(0, -1).join(', ')}, and ${mentions[mentions.length - 1]}`;
};

const buildQuestionEmbed = (question, roundNumber, totalRounds) =>
    new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(totalRounds > 1 ? `Trivia of the Old Realm — Question ${roundNumber} of ${totalRounds}` : 'Trivia of the Old Realm')
        .setDescription(question.question)
        .setFooter({ text: `Type thy answer plainly in this very hall — first true answer claims this question! Thou hast ${ANSWER_WINDOW_MS / 1000} seconds.` })
        .setTimestamp();

// Runs one question: posts it, collects chat answers for ANSWER_WINDOW_MS,
// and resolves with the winning GuildMember, or null if no one answered
// correctly in time.
const runQuestion = async (channel, question, roundNumber, totalRounds) => {
    const acceptedAnswers = question.answers.map(normalize);
    await channel.send({ embeds: [buildQuestionEmbed(question, roundNumber, totalRounds)] });

    let winnerFound = false;
    let winnerMember = null;

    const collector = channel.createMessageCollector({ time: ANSWER_WINDOW_MS });

    await new Promise((resolve) => {
        collector.on('collect', (message) => {
            // Checked synchronously before any await, so a second correct
            // answer arriving while this one's still being processed below
            // can't also be credited.
            if (winnerFound || message.author.bot) return;
            if (!acceptedAnswers.includes(normalize(message.content))) return;

            winnerFound = true;
            winnerMember = message.member;
            collector.stop('answered');
        });
        collector.on('end', resolve);
    });

    if (winnerMember) {
        await channel.send(pick(flavor.wowTriviaRoundWinLines(winnerMember.displayName)));
    } else {
        await channel.send(`${pick(flavor.wowTriviaRoundTimeoutLines())}\n\nThe answer was **${question.answers[0]}**.`);
    }

    return winnerMember;
};

// Runs one full session in one guild/channel: intro, each question in turn,
// then the champion announcement (or "no one triumphed" if nobody ever won
// a question). Only persists the champion's points when `persist` is true —
// matching /trivia and /recap, a manual run doesn't inflate the leaderboard.
const runWowTriviaSession = async (guild, channel, totalQuestions, persist, runLabel) => {
    const allQuestions = flavor.wowTriviaQuestions();
    const roundQuestions = shuffle(allQuestions).slice(0, totalQuestions);

    // Ping whoever's signed up (/wow_trivia_signup), same as the daily
    // trivia pings its own role — content carries the mention since Discord
    // doesn't notify on mentions inside embeds.
    const role = findWowTriviaRole(guild);
    const introLine = pick(flavor.wowTriviaIntroLines());
    await channel.send(role ? `<@&${role.id}> ${introLine}` : introLine);

    // userId -> { displayName, count } — how many questions each member won.
    const roundsWonBy = new Map();

    for (let i = 0; i < roundQuestions.length; i++) {
        const question = roundQuestions[i];
        console.log(`WoW trivia (${runLabel}) (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] "${question.question}" — accepted answers: ${question.answers.join(' | ')}`);

        const winnerMember = await runQuestion(channel, question, i + 1, roundQuestions.length);

        if (winnerMember) {
            const entry = roundsWonBy.get(winnerMember.id) || { displayName: winnerMember.displayName, count: 0 };
            entry.count += 1;
            entry.displayName = winnerMember.displayName;
            roundsWonBy.set(winnerMember.id, entry);
            console.log(`WoW trivia (${runLabel}) (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] winner ${winnerMember.displayName} (${winnerMember.id}).`);
        } else {
            console.log(`WoW trivia (${runLabel}) (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] no correct answer within ${ANSWER_WINDOW_MS / 1000}s.`);
        }
    }

    // Matches /trivia's buildResultsPost: a manual run still shows the same
    // flavor text, just with a note that no points actually moved.
    const previewNote = persist ? '' : '\n\n*(This be but a rehearsal — no points were truly bestowed.)*';

    const topCount = Math.max(0, ...[...roundsWonBy.values()].map((entry) => entry.count));

    if (topCount === 0) {
        console.log(`WoW trivia (${runLabel}) (guild ${guild.id}): session ended with no correct answers across ${roundQuestions.length} question(s).`);
        await channel.send(`${pick(flavor.wowTriviaNoChampionLines(roundQuestions.length))}${previewNote}`);
        return;
    }

    const champions = [...roundsWonBy.entries()].filter(([, entry]) => entry.count === topCount);
    const pointsEach = CHAMPION_POINTS;

    if (persist) {
        try {
            await pointsStore.addPoints(
                guild.id,
                champions.map(([userId, entry]) => ({ userId, displayName: entry.displayName, points: pointsEach }))
            );
        } catch (error) {
            console.error('WoW trivia: failed to persist champion points:', error.message);
        }
    }

    console.log(`WoW trivia (${runLabel}) (guild ${guild.id}): champion(s) ${champions.map(([id, entry]) => `${entry.displayName} (${id})`).join(', ')} — ${topCount}/${roundQuestions.length} correct, ${pointsEach} points each${persist ? '' : ' (not persisted)'}.`);

    const namesText = joinMentions(champions.map(([userId]) => userId));
    await channel.send(`${pick(flavor.wowTriviaChampionLines(namesText, topCount, roundQuestions.length, pointsEach))}${previewNote}`);
};

/* Run one session.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   questions     - how many questions to ask (default 1)
 *   persist       - whether to write the champion's points to DynamoDB
 *                   (default: false)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 */
const runWowTrivia = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        questions = 1,
        persist = false,
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    for (const g of guilds) {
        try {
            const channel = targetChannel || findAnnounceChannel(g);
            if (!channel) {
                console.log(`WoW trivia: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }
            await runWowTriviaSession(g, channel, questions, persist, runLabel);
        } catch (guildError) {
            console.error(`WoW trivia failed for guild "${g.name}":`, guildError);
        }
    }
};

/* Register the weekly WoW Trivia Wednesday timer. Call once after the
 * client is ready.
 */
const scheduleWowTriviaWednesday = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`WoW trivia: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            console.log('Running scheduled WoW Trivia Wednesday...');
            runWowTrivia(client, { questions: WEDNESDAY_QUESTIONS, persist: true }).catch((error) =>
                console.error('Scheduled WoW trivia failed:', error)
            );
        },
        { timezone: TIMEZONE }
    );

    console.log(`WoW Trivia Wednesdays scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}) — Wednesdays at 9 PM Eastern, ${WEDNESDAY_QUESTIONS} questions.`);
};

module.exports = { scheduleWowTriviaWednesday, runWowTrivia, MAX_QUESTIONS };
