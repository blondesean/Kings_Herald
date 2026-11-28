/* /christmas_gift - manually rehearse the Christmas morning gift in the
 * current channel, for testing.
 *
 * Preview command for the scheduled `christmasGift` passive behavior: it
 * lives beside the other previews in commands/passive/preview. adminOnly:
 * true registers it with Discord but restricts it to members with the Manage
 * Server permission (Discord enforces this — the interaction never reaches
 * the bot for anyone else); hidden: true keeps it out of the generated
 * /help. Works any time of year, and posts the real speech and mention list
 * but WITHOUT awarding points or notifying anyone.
 */

const { runChristmasGift } = require('../christmasGift');

const christmasGiftPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald rummages for his false beard, for a rehearsal...');

    try {
        await runChristmasGift(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running Christmas gift preview:', error);
        await interaction.followUp('Alack! The beard came unhooked, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Rehearse the Christmas morning gift in this channel, awarding no points and pinging no one',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: christmasGiftPreview,
};
