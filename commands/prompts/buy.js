/* /buy <item> - buy an item from today's shop with points.
 *
 * Checks, in order: the shop is open, the item is on today's shelves, it still
 * has a copy left, and the buyer can pay. The copy is taken first and given
 * back if the payment fails, so a sold-out item can't be charged for and a
 * charged item can't go unfilled.
 *
 * Gear goes to the bag; classes and races take effect at once, replacing the
 * old one. A title is unique: buying one while already bearing another asks
 * for confirmation first, then sends the old title back to the shelves.
 *
 * Public, so the purchase is announced in the channel, in character. Any
 * confirmation is private.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { currentOpenShop, easternDay, kindOf } = require('../passive/shop');
const { matchEntry } = require('../../src/character');
const { askConfirm } = require('../../src/confirm');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Which character field a non-gear entry sets. Gear goes to the bag instead.
const FIELD_FOR_KIND = { title: 'title', class: 'class', race: 'race' };

// Takes the copy, charges the points and grants the item. Returns the kind on
// success, or null (after giving the copy back) if the purchase didn't go through.
const purchase = async (guildId, day, buyer, entry, kind, character) => {
    // Callings and kindreds have no stock limit, so only the rest take a copy.
    const limited = kind === 'gear' || kind === 'title';
    const taken = limited ? await pointsStore.takeShopStock(guildId, day, entry.id, Date.now()) : true;
    if (!taken) return { ok: false, reason: 'soldOut' };

    let grant;
    if (kind === 'gear') {
        // An empty slot takes the piece straight away; otherwise it goes to the bag.
        const slotEmpty = !(character.gear || {})[entry.slot];
        grant = slotEmpty
            ? { equip: { slot: entry.slot, itemId: entry.id, gear: character.gear || {} } }
            : { bag: entry.id };
    } else {
        grant = { field: FIELD_FOR_KIND[kind], value: entry.id };
    }
    const paid = await pointsStore.buyWithPoints(guildId, buyer.id, buyer.displayName, entry.price, grant);
    if (!paid) {
        if (limited) await pointsStore.returnShopStock(guildId, entry.id);
        return { ok: false, reason: 'cannotAfford' };
    }
    return { ok: true, equipped: grant.equip !== undefined };
};

const buy = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const buyer = interaction.member;

    try {
        const record = await currentOpenShop(guildId);
        if (!record) {
            await interaction.editReply(pick(flavor.shopClosedLines()));
            return;
        }

        const onShelf = record.items.map((id) => catalog.findEntry(id)).filter(Boolean);
        const entry = matchEntry(onShelf, typed);
        if (!entry) {
            await interaction.editReply(pick(flavor.notInShopLines(typed)));
            return;
        }

        const kind = kindOf(entry);
        const character = await pointsStore.getCharacter(guildId, buyer.id);

        // A second title: confirm the swap before anything is taken.
        if (kind === 'title' && character.title) {
            if (character.title === entry.id) {
                await interaction.editReply(`Thou already bearest **${entry.name}**, good noble.`);
                return;
            }
            const held = catalog.findEntry(character.title);
            await interaction.editReply('Thy request awaits thy word, in secret.');
            const confirmed = await askConfirm(interaction, pick(flavor.titleSwapPromptLines(held.name, entry.name, entry.price)));
            if (!confirmed) return;

            const result = await purchase(guildId, record.day, buyer, entry, kind, character);
            if (!result.ok) {
                const lines = result.reason === 'soldOut' ? flavor.soldOutLines(entry.name) : flavor.cannotAffordLines(entry.name, entry.price);
                await interaction.followUp(pick(lines));
                return;
            }

            // The old title goes back on the shelf only once the new one is paid for.
            // Its copy can't be refused: the shop is still open, checked above.
            await pointsStore.restockShopItem(guildId, record.day, held.id, Date.now());
            console.log(`Shop (guild ${guildId}): ${buyer.displayName} (${buyer.id}) swapped ${held.name} for ${entry.name} (${easternDay()}).`);
            await interaction.editReply(pick(flavor.titleSwappedLines(`<@${buyer.id}>`, held.name, entry.name)));
            return;
        }

        const result = await purchase(guildId, record.day, buyer, entry, kind, character);
        if (!result.ok) {
            const lines = result.reason === 'soldOut' ? flavor.soldOutLines(entry.name) : flavor.cannotAffordLines(entry.name, entry.price);
            await interaction.editReply(pick(lines));
            return;
        }

        console.log(`Shop (guild ${guildId}): ${buyer.displayName} (${buyer.id}) bought ${entry.name} for ${entry.price}${result.equipped ? ', equipped' : ''} (${easternDay()}).`);
        const line = result.equipped
            ? pick(flavor.purchasedEquippedLines(`<@${buyer.id}>`, entry.name))
            : pick(flavor.purchasedLines(`<@${buyer.id}>`, entry.name, kind));
        await interaction.editReply(line);
    } catch (error) {
        console.error('Error handling /buy:', error);
        await interaction.editReply('Alack! The merchant\'s ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: "Buy an item from today's shop with points",
    category: 'ROYAL CHRONICLES',
    options: [
        {
            name: 'item',
            description: 'The exact name of the item, as shown in /shop',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: buy,
};
