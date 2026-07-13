/* /recap - manually preview the weekly recap in the current channel.
 *
 * Preview command for the scheduled `weeklyRecap` passive behavior: it lives
 * beside that behavior in commands/passive/preview and is admin-only in
 * Discord (hidden: true). Runs the same logic as the scheduled Sunday recap,
 * but scoped to this guild, posted to the channel where the command was used,
 * and WITHOUT writing any points. Handy for testing the format without
 * waiting for Sunday or inflating the leaderboard.
 */

const { runWeeklyRecap } = require('../weeklyRecap');

const recap = async function (interaction) {
    await interaction.editReply('Hark! I shall assemble a preview of the weekly chronicle. Grant me but a moment, good sir!');

    try {
        await runWeeklyRecap(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running recap preview:', error);
        await interaction.followUp('Alack! I could not assemble the chronicle at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Preview the weekly chronicle in this channel, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // preview command: admin-only in Discord, out of /help
    run: recap,
};
