/* /ladder - manually fire the daily Word Ladder puzzle in the current
 * channel, for testing.
 *
 * Preview command for the scheduled Word Ladder (commands/puzzles/wordLadder.js),
 * beside /connections. adminOnly: true registers it with Discord but
 * restricts it to members with the Manage Server permission (Discord
 * enforces this — the interaction never reaches the bot for anyone else);
 * hidden: true keeps it out of the generated /help. Runs the same rules as
 * the scheduled puzzle, but posted to the channel where the command was used
 * and WITHOUT awarding points, pinging the puzzle role, or advancing the
 * no-repeat cycle.
 */

const { runWordLadder } = require('../wordLadder');

const ladderPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald sets up a ladder of words for testing...');

    try {
        await runWordLadder(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running Word Ladder preview:', error);
        await interaction.followUp('Alack! I could not set up the ladder at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Fire the daily Word Ladder puzzle in this channel for testing, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: ladderPreview,
};
