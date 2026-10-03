/* /return_title - send your title back to the merchant's shelves.
 *
 * Titles are unique (one copy each), so returning yours puts it back in
 * today's shop for someone else to buy. You're asked to confirm first. The
 * return only works while the shop is open, because the title goes back into
 * today's stock.
 *
 * Private: only you see the confirmation and the result.
 */

const pointsStore = require('../../src/pointsStore');
const { currentOpenShop } = require('../passive/shop');
const { askConfirm } = require('../../src/confirm');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const returnTitle = async function (interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.member.id;
    const name = interaction.member.displayName;

    try {
        const character = await pointsStore.getCharacter(guildId, userId);
        const title = character.title ? catalog.findEntry(character.title) : null;
        if (!title) {
            await interaction.editReply(pick(flavor.titleNotHeldLines()));
            return;
        }

        const record = await currentOpenShop(guildId);
        if (!record) {
            await interaction.editReply(pick(flavor.shopShutForReturnLines()));
            return;
        }

        await interaction.editReply('Thy request awaits thy word, in secret.');
        const confirmed = await askConfirm(interaction, pick(flavor.titleReturnPromptLines(title.name)));
        if (!confirmed) return;

        // Put the copy back first. If the shop has closed in the meantime,
        // nothing has changed yet.
        const restocked = await pointsStore.restockShopItem(guildId, record.day, title.id, Date.now());
        if (!restocked) {
            await interaction.followUp(pick(flavor.shopShutForReturnLines()));
            return;
        }

        const cleared = await pointsStore.clearTitle(guildId, userId, title.id);
        if (!cleared) {
            // The title changed under us: undo the restock so the shelf stays right.
            await pointsStore.returnShopStock(guildId, title.id);
            await interaction.followUp(pick(flavor.confirmExpiredLines()));
            return;
        }

        console.log(`Return title (guild ${guildId}): ${name} (${userId}) returned ${title.name}.`);
        await interaction.followUp(pick(flavor.titleReturnedLines(name, title.name)));
    } catch (error) {
        console.error('Error returning a title:', error);
        await interaction.followUp('Alack! The merchant\'s ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Send your title back to the merchant so someone else can buy it',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    run: returnTitle,
};
