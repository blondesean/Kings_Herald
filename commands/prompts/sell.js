/* /sell <item> - sell a piece of gear from your bag back to the merchant.
 *
 * The piece leaves your bag at once and goes on sale in the next day's shop,
 * in its Discounts section, one copy at 25% off. If another member buys it,
 * you're paid what they paid; if it's still unsold when that shop closes,
 * you're paid half its full price and the piece is gone for good. The rules
 * and payouts live in commands/passive/shop.js.
 *
 * Only gear in the bag can be sold, not what you're wearing. You're asked to
 * confirm first. Private, so only you see the reply.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { matchEntry } = require('../../src/character');
const { askConfirm } = require('../../src/confirm');
const { easternDay, discountPrice, unsoldRefund } = require('../passive/shop');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const sell = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const seller = interaction.member;

    try {
        const character = await pointsStore.getCharacter(guildId, seller.id);
        const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
        const entry = matchEntry(inBag, typed);
        if (!entry) {
            // Tell apart worn gear, things that aren't gear, and things not owned at all.
            const worn = matchEntry(Object.values(character.gear || {}).map((id) => catalog.findEntry(id)).filter(Boolean), typed);
            const known = matchEntry(catalog.ALL, typed);
            const reply = worn ? flavor.sellEquippedLines(worn.name)
                : known && !known.slot ? flavor.notSellableLines(known.name)
                    : flavor.notInBagLines(typed);
            await interaction.editReply(pick(reply));
            return;
        }

        const salePrice = discountPrice(entry.price);
        await interaction.editReply('Thy request awaits thy word, in secret.');
        const confirmed = await askConfirm(interaction, pick(flavor.sellPromptLines(entry.name, salePrice, unsoldRefund(entry.price))));
        if (!confirmed) return;

        // One copy leaves the bag. The write only lands if the bag is unchanged
        // since it was read above, so the piece can't be equipped and sold at once.
        const bag = [...character.bag];
        bag.splice(bag.indexOf(entry.id), 1);
        const listing = { itemId: entry.id, price: entry.price, listedDay: easternDay() };
        const listingId = await pointsStore.createListing(guildId, seller, listing, character.bag, bag);
        if (!listingId) {
            await interaction.followUp(pick(flavor.bagChangedLines()));
            return;
        }

        console.log(`Sell (guild ${guildId}): ${seller.displayName} (${seller.id}) listed ${entry.name} (${listingId}).`);
        await interaction.followUp(pick(flavor.listedLines(entry.name)));
    } catch (error) {
        console.error('Error handling /sell:', error);
        await interaction.followUp('Alack! The merchant\'s ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Sell a piece of gear from your bag back to the merchant (visible only to you)',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'The exact name of the gear in your bag, as shown in /bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: sell,
};
