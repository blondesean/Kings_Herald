/* /shop_test - open today's shop now, in this channel, for testing.
 *
 * Preview command for the daily shop (commands/passive/shop.js). adminOnly:
 * true registers it with Discord but restricts it to members with the Manage
 * Server permission; hidden: true keeps it out of the generated /help.
 *
 * Unlike the other previews this one saves the shop, so /buy works in the
 * same channel. It replaces today's shop for the guild, including its stock,
 * so the real scheduled shop may still open later today with a new draw.
 */

const { openShopNow } = require('../shop');

const shopTest = async function (interaction) {
    await interaction.editReply('Hark! The merchant unpacks a test shop...');

    try {
        await openShopNow(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: true,
            ping: false,
        });
    } catch (error) {
        console.error('Error running shop test:', error);
        await interaction.followUp('Alack! The merchant could not unpack at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Open a test shop now in this channel, saved so /buy works (replaces today\'s shop)',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: shopTest,
};
