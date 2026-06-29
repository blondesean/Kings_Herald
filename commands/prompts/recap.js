/* !recap - manually preview the weekly recap in the current channel.
 *
 * Runs the same logic as the scheduled Sunday recap, but scoped to this guild,
 * posted to the channel where the command was used, and WITHOUT writing any
 * points. Handy for testing the format without waiting for Sunday or inflating
 * the leaderboard.
 */

const { runWeeklyRecap } = require('../passive/weeklyRecap');

const recap = function (prefix, message) {
    message.reply('Hark! I shall assemble a preview of the weekly chronicle. Grant me but a moment, good sir!');

    runWeeklyRecap(message.client, {
        guild: message.guild,
        targetChannel: message.channel,
        persist: false,
    }).catch((error) => {
        console.error('Error running recap preview:', error);
        message.reply('Alack! I could not assemble the chronicle at this time, Milord. Pray try again anon!');
    });
};

module.exports = recap;
