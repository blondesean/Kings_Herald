/* /wow_trivia [questions] - manually fire a WoW trivia session in the
 * current channel, for testing.
 *
 * Preview command for the scheduled `wowTrivia` passive behavior (WoW Trivia
 * Wednesdays): it lives beside that behavior in commands/passive/preview.
 * adminOnly: true registers it with Discord but restricts it to members with
 * the Manage Server permission (Discord enforces this — the interaction
 * never reaches the bot for anyone else); hidden: true keeps it out of the
 * generated /help. Runs the same free-text/first-correct-answer/champion
 * logic as the scheduled Wednesday session, but posted to the channel where
 * the command was used and WITHOUT persisting any points — handy for
 * checking the question flow and answer collection without waiting for
 * Wednesday or inflating the leaderboard.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { runWowTrivia, MAX_QUESTIONS } = require('../wowTrivia');

const wowTriviaPreview = async function (interaction) {
    const totalQuestions = interaction.options.getInteger('questions') || 1;

    await interaction.editReply('Hark! The Herald summons a session of WoW trivia...');

    try {
        await runWowTrivia(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            questions: totalQuestions,
            persist: false,
        });
    } catch (error) {
        console.error('Error running wow trivia:', error);
        await interaction.followUp('Alack! Some misfortune befell the trivia, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Fire a WoW trivia session in this channel for testing, awarding no points',
    category: 'COURTLY GAMES',
    hidden: true, // out of the generated /help
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
    run: wowTriviaPreview,
};
