/* /shop - show today's stock and how many copies are left.
 *
 * Public, so everyone can see the wares. Shows a closed message if the Herald
 * hasn't opened the shop yet today, or the window has passed. See
 * commands/passive/shop.js for how the stock is drawn and opened.
 */

const pointsStore = require('../../src/pointsStore');
const { currentOpenShop, shopEmbed } = require('../passive/shop');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const shop = async function (interaction) {
    try {
        const record = await currentOpenShop(interaction.guild.id);
        if (!record) {
            await interaction.editReply(pick(flavor.shopClosedLines()));
            return;
        }
        await interaction.editReply({ embeds: [shopEmbed(record)] });
    } catch (error) {
        console.error('Error showing the shop:', error);
        await interaction.editReply('Alack! The merchant\'s ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: "See today's shop and what is still for sale",
    category: 'ROYAL CHRONICLES',
    run: shop,
};
