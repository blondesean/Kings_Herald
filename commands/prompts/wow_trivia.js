/* /wow_trivia [questions] - a WoW-themed trivia session: whoever answers the
 * most questions correctly wins.
 *
 * adminOnly + hidden: registered with Discord but restricted to members with
 * Manage Server (Discord enforces this — the interaction never reaches the
 * bot for anyone else) and kept out of the generated /help, matching every
 * other adminOnly command in this codebase (see e.g. commands/prompts/
 * point_adjust.js). Whoever has that permission still runs the session for
 * everyone else to play in chat — only *starting* a round is restricted.
 *
 * Unlike the daily /trivia (multiple-choice buttons, everyone who answers
 * correctly within 5 minutes earns points), this one is free-text and
 * speed-based per question: the Herald posts a question drawn from a ported
 * WoW trivia bank (see flavor_text/wowTriviaQuestions.js), members type
 * their answer directly in the channel, and only whoever answers correctly
 * FIRST wins that question. Matching is exact after trimming and
 * lowercasing — no fuzzy/typo tolerance beyond whatever accepted-answer
 * variants the bank itself already lists for a question (e.g. "Ironforge" /
 * "IF").
 *
 * The `questions` option (default 1, capped at MAX_QUESTIONS) runs that many
 * questions back to back, drawn without repeats within the session. No
 * points change hands per question — instead, whoever wins the most
 * questions across the whole session is crowned champion at the end and
 * paid a flat CHAMPION_POINTS, win margin aside (ties share the crown and
 * are each paid the full amount). With `questions` left at the default, this
 * collapses to "whoever answers the one question wins."
 *
 * The bank spans vanilla through early Wrath-era WoW, so a few answers have
 * gone stale since (a "will be added in the next patch" question, say). The
 * Herald leans into this rather than hiding it: he drops into an orcish
 * voice for the whole session and frames it as a trip back to that era —
 * Thrall as Warchief of the Horde, Varian Wrynn as High King of the
 * Alliance — see flavor_text/wowTriviaFlavor.js.
 */

const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findWowTriviaRole } = require('../../src/wowTriviaRole');
const flavor = require('../../flavor_text');

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

const wowTrivia = async function (interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const totalQuestions = interaction.options.getInteger('questions') || 1;

    const allQuestions = flavor.wowTriviaQuestions();
    const roundQuestions = shuffle(allQuestions).slice(0, totalQuestions);

    // Ping whoever's signed up (/wow_trivia_signup), same as the daily
    // trivia pings its own role — content carries the mention since Discord
    // doesn't notify on mentions inside embeds.
    const role = findWowTriviaRole(guild);
    const introLine = pick(flavor.wowTriviaIntroLines());
    await interaction.editReply(role ? `<@&${role.id}> ${introLine}` : introLine);

    // userId -> { displayName, count } — how many questions each member won.
    const roundsWonBy = new Map();

    for (let i = 0; i < roundQuestions.length; i++) {
        const question = roundQuestions[i];
        console.log(`WoW trivia (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] "${question.question}" — accepted answers: ${question.answers.join(' | ')}`);

        const winnerMember = await runQuestion(channel, question, i + 1, roundQuestions.length);

        if (winnerMember) {
            const entry = roundsWonBy.get(winnerMember.id) || { displayName: winnerMember.displayName, count: 0 };
            entry.count += 1;
            entry.displayName = winnerMember.displayName;
            roundsWonBy.set(winnerMember.id, entry);
            console.log(`WoW trivia (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] winner ${winnerMember.displayName} (${winnerMember.id}).`);
        } else {
            console.log(`WoW trivia (guild ${guild.id}): [${i + 1}/${roundQuestions.length}] no correct answer within ${ANSWER_WINDOW_MS / 1000}s.`);
        }
    }

    const topCount = Math.max(0, ...[...roundsWonBy.values()].map((entry) => entry.count));

    if (topCount === 0) {
        console.log(`WoW trivia (guild ${guild.id}): session ended with no correct answers across ${roundQuestions.length} question(s).`);
        await channel.send(pick(flavor.wowTriviaNoChampionLines(roundQuestions.length)));
        return;
    }

    const champions = [...roundsWonBy.entries()].filter(([, entry]) => entry.count === topCount);
    const pointsEach = CHAMPION_POINTS;

    try {
        await pointsStore.addPoints(
            guild.id,
            champions.map(([userId, entry]) => ({ userId, displayName: entry.displayName, points: pointsEach }))
        );
    } catch (error) {
        console.error('wow_trivia: failed to persist champion points:', error.message);
    }

    console.log(`WoW trivia (guild ${guild.id}): champion(s) ${champions.map(([id, entry]) => `${entry.displayName} (${id})`).join(', ')} — ${topCount}/${roundQuestions.length} correct, ${pointsEach} points each.`);

    const namesText = joinMentions(champions.map(([userId]) => userId));
    await channel.send(pick(flavor.wowTriviaChampionLines(namesText, topCount, roundQuestions.length, pointsEach)));
};

module.exports = {
    description: 'A WoW-themed trivia session — whoever answers the most questions correctly wins',
    category: 'COURTLY GAMES',
    hidden: true, // out of the generated /help (matches every other adminOnly command)
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'questions',
            description: `How many questions to ask (default 1, max ${MAX_QUESTIONS})`,
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: MAX_QUESTIONS,
        },
    ],
    run: wowTrivia,
};
