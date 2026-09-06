/* /connections - manually fire the daily Connections-style puzzle in the
 * current channel, for testing.
 *
 * Preview command for the scheduled `connections` passive behavior: it
 * lives beside that behavior in commands/puzzles/preview. adminOnly: true
 * registers it with Discord but restricts it to members with the Manage
 * Server permission (Discord enforces this — the interaction never reaches
 * the bot for anyone else); hidden: true keeps it out of the generated
 * /help. Runs the same board/guess/reveal logic as the scheduled puzzle,
 * but posted to the channel where the command was used and WITHOUT
 * awarding any points or advancing the no-repeat cycle — handy for
 * checking the format and the guess-parsing logic without waiting for the
 * daily post or inflating the leaderboard.
 */

const { runConnectionsPuzzle } = require('../connections');

const connectionsPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald lays out a puzzle for testing...');

    try {
        await runConnectionsPuzzle(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running Connections preview:', error);
        await interaction.followUp('Alack! I could not assemble the puzzle at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Fire the daily Connections puzzle in this channel for testing, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: connectionsPreview,
};
