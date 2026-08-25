/* /wow_trivia - a WoW-themed trivia round: first correct answer wins.
 *
 * Unlike the daily /trivia (multiple-choice buttons, everyone who answers
 * correctly within 5 minutes earns points), this one is free-text and
 * speed-based: the Herald posts a question drawn from a ported WoW trivia
 * bank (see flavor_text/wowTriviaQuestions.js), members type their answer
 * directly in the channel, and only whoever answers correctly FIRST earns
 * points. Matching is exact after trimming and lowercasing — no fuzzy/typo
 * tolerance beyond whatever accepted-answer variants the bank itself already
 * lists for a question (e.g. "Ironforge" / "IF").
 *
 * The bank spans vanilla through early Wrath-era WoW, so a few answers have
 * gone stale since (a "will be added in the next patch" question, say). The
 * Herald leans into this rather than hiding it: he drops into an orcish
 * voice and frames the whole round as a trip back to that era — Thrall as
 * Warchief of the Horde, Varian Wrynn as High King of the Alliance — see
 * flavor_text/wowTriviaFlavor.js.
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const flavor = require('../../flavor_text');

const ANSWER_WINDOW_MS = 30 * 1000;
const WOW_TRIVIA_POINTS = 2;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const normalize = (text) => text.trim().toLowerCase();

const buildQuestionEmbed = (question) =>
    new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('Trivia of the Old Realm')
        .setDescription(question.question)
        .setFooter({ text: `Type thy answer plainly in this very hall — first true answer claims the glory! Thou hast ${ANSWER_WINDOW_MS / 1000} seconds.` })
        .setTimestamp();

const wowTrivia = async function (interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;

    const allQuestions = flavor.wowTriviaQuestions();
    const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    const acceptedAnswers = question.answers.map(normalize);

    await interaction.editReply(pick(flavor.wowTriviaIntroLines()));
    await interaction.followUp({ embeds: [buildQuestionEmbed(question)] });

    console.log(`WoW trivia (guild ${guild.id}): "${question.question}" — accepted answers: ${question.answers.join(' | ')}`);

    // winnerFound is checked synchronously before any await in the collect
    // handler below, so a second correct answer arriving while the first
    // winner's points are still being persisted can't also be credited.
    let winnerFound = false;
    let winnerMember = null;

    const collector = channel.createMessageCollector({ time: ANSWER_WINDOW_MS });

    await new Promise((resolve) => {
        collector.on('collect', (message) => {
            if (winnerFound || message.author.bot) return;
            if (!acceptedAnswers.includes(normalize(message.content))) return;

            winnerFound = true;
            winnerMember = message.member;
            collector.stop('answered');
        });
        collector.on('end', resolve);
    });

    if (!winnerMember) {
        console.log(`WoW trivia (guild ${guild.id}): no correct answer within ${ANSWER_WINDOW_MS / 1000}s.`);
        await channel.send(`${pick(flavor.wowTriviaTimeoutLines())}\n\nThe answer was **${question.answers[0]}**.`);
        return;
    }

    console.log(`WoW trivia (guild ${guild.id}): winner ${winnerMember.displayName} (${winnerMember.id}).`);

    try {
        await pointsStore.addPoints(guild.id, [
            { userId: winnerMember.id, displayName: winnerMember.displayName, points: WOW_TRIVIA_POINTS },
        ]);
    } catch (error) {
        console.error('wow_trivia: failed to persist points:', error.message);
    }

    await channel.send(pick(flavor.wowTriviaVictoryLines(winnerMember.displayName, WOW_TRIVIA_POINTS)));
};

module.exports = {
    description: 'A WoW-themed trivia round — first correct answer typed in chat wins the points',
    category: 'COURTLY GAMES',
    run: wowTrivia,
};
