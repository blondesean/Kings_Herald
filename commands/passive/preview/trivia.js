/* /trivia - manually fire a trivia round in the current channel, for testing.
 *
 * Preview command for the scheduled `trivia` passive behavior: it lives
 * beside that behavior in commands/passive/preview. adminOnly: true registers
 * it with Discord but restricts it to members with the Manage Server
 * permission (Discord enforces this — the interaction never reaches the bot
 * for anyone else); hidden: true keeps it out of the generated /help. Runs
 * the same question/react/wait/tally logic as the scheduled daily round, but
 * posted to the channel where the command was used and WITHOUT persisting
 * any points — handy for checking the format and the reaction-tallying logic
 * without waiting for the random daily slot or inflating the leaderboard.
 *
 * The `seasonal` option overrides the Halloween-bank odds (see
 * SEASONAL_CHANCE_BY_MONTH in trivia.js) so the spooky reskin can be tested
 * any time of year, not just during its actual September/October window.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { runTrivia } = require('../trivia');

const triviaPreview = async function (interaction) {
    const seasonalOverride = interaction.options.getBoolean('seasonal');

    await interaction.editReply('Hark! I shall pose a question of trivia to test the waters, good sir!');

    try {
        await runTrivia(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
            ...(seasonalOverride === null ? {} : { seasonal: seasonalOverride }),
        });
    } catch (error) {
        console.error('Error running trivia preview:', error);
        await interaction.followUp('Alack! I could not pose a question at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Fire a trivia round in this channel for testing, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'seasonal',
            description: 'Force the Halloween-themed bank on/off (default: roll the odds for today)',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],
    run: triviaPreview,
};
