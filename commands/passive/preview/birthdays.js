/* /birthdays - run the daily birthday check now, for testing.
 *
 * Preview command for commands/passive/birthdays.js. adminOnly: true registers
 * it with Discord but restricts it to members with the Manage Server
 * permission; hidden: true keeps it out of the generated /help. Posts to this
 * channel and awards no points, so it never inflates the ledger.
 */

const { runBirthdays } = require('../birthdays');

const birthdaysPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald consults the birthday list for testing...');

    try {
        await runBirthdays(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running birthdays preview:', error);
        await interaction.followUp('Alack! I could not consult the list at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Run the daily birthday check in this channel for testing, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: birthdaysPreview,
};
