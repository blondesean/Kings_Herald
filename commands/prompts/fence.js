/* /fence [item] [slot] [rarity] - buy any piece of gear in the catalog, not
 * just today's shop, for its price plus FENCE_FEE, once per Eastern day.
 *
 * Without an item it browses: a private, paged list of the catalog's gear,
 * narrowed by slot and rarity if given. With an item (picked from the
 * autocomplete list, which follows the slot and rarity too) it shows the
 * offer, with what the piece would do for the buyer's kit, and asks for
 * confirmation. Paying, granting the piece and marking today's deal happen
 * in one conditional update (pointsStore.fenceWithPoints), so the daily limit
 * holds even for two quick purchases. The piece is equipped if its slot is
 * empty and goes to the bag otherwise, like /buy, and the deal is announced
 * in the channel without a ping.
 *
 * Gear only: titles are unique and pass between members through the shop,
 * and classes and races stay a shop surprise. Everything paid, fee included,
 * counts as shop spending (the Biggest Spender myth).
 */

const { ApplicationCommandOptionType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { easternDay } = require('../passive/shop');
const { matchEntry } = require('../../src/character');
const { askConfirm } = require('../../src/confirm');
const achievements = require('../../src/achievements');
const catalog = require('../passive/shopCatalog');
const { gearGrant, recordSpending } = require('./buy');
const flavor = require('../../flavor_text');

const FENCE_FEE = 50;
const PAGE_SIZE = 20;
const BROWSE_WINDOW_MS = 5 * 60 * 1000;
const EMBED_COLOR = 0xd4af37;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const rarityOf = (entry) => catalog.rarityFor(entry.price);
const label = (entry) => `[${rarityOf(entry)}] ${entry.name}`;
const totalOf = (entry) => entry.price + FENCE_FEE;

// Gear matching the slot and rarity filters, Legendary first, then by slot and name.
const filtered = (slot, rarity) => catalog.GEAR
    .filter((e) => (!slot || e.slot === slot) && (!rarity || rarityOf(e) === rarity))
    .sort((a, b) => b.price - a.price
        || catalog.GEAR_SLOTS.indexOf(a.slot) - catalog.GEAR_SLOTS.indexOf(b.slot)
        || a.name.localeCompare(b.name));

// ---- browsing --------------------------------------------------------------------

const browsePage = (entries, page, slot, rarity, prefix) => {
    const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    const lines = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
        .map((e) => `**${label(e)}**, ${e.slot}: ${e.price} + ${FENCE_FEE} = ${totalOf(e)}`);
    const filters = [rarity, slot].filter(Boolean).join(' ') || 'all gear';
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(`The Fence's Wares: ${filters}`)
        .setDescription(`${lines.join('\n') || '*Nothing of that sort.*'}\n\nAny piece in the realm, for its price and ${FENCE_FEE} for the fence. One deal a day. Buy with \`/fence item\`.`)
        .setFooter({ text: `Page ${page + 1} of ${pages}, ${entries.length} pieces` });
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${prefix}prev`).setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId(`${prefix}next`).setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(page >= pages - 1),
    );
    return { embeds: [embed], components: pages > 1 ? [row] : [] };
};

const browse = async (interaction, slot, rarity) => {
    const entries = filtered(slot, rarity);
    const prefix = `fence_${interaction.id}_`;
    let page = 0;
    const message = await interaction.editReply(browsePage(entries, page, slot, rarity, prefix));
    if (entries.length <= PAGE_SIZE) return;

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId.startsWith(prefix) && i.user.id === interaction.user.id,
        time: BROWSE_WINDOW_MS,
    });
    collector.on('collect', async (click) => {
        page += click.customId.endsWith('next') ? 1 : -1;
        await click.update(browsePage(entries, page, slot, rarity, prefix)).catch(() => {});
    });
    collector.on('end', () => interaction.editReply({ components: [] }).catch(() => {}));
};

// ---- buying ----------------------------------------------------------------------

// What the piece would do for the buyer's kit, for the offer.
const upgradeNote = (entry, character) => {
    const worn = catalog.findEntry((character.gear || {})[entry.slot]);
    if (!worn) return `It would fill thine empty ${entry.slot} slot at once, +${entry.price} fit.`;
    const change = entry.price - worn.price;
    if (change > 0) return `Over thy **${label(worn)}**, it would raise thy fit by ${change}. It goes to thy bag; \`/equip\` it.`;
    return `Thy **${label(worn)}** is already as fine or finer, so it would go to thy bag.`;
};

const buyFromFence = async (interaction, typed) => {
    const guildId = interaction.guild.id;
    const buyer = interaction.member;
    const entry = catalog.GEAR.find((e) => e.id === typed) || matchEntry(catalog.GEAR, typed);
    if (!entry) {
        const other = matchEntry(catalog.ALL, typed);
        await interaction.editReply(pick(other ? flavor.fenceGearOnlyLines(other.name) : flavor.fenceUnknownLines(typed)));
        return;
    }

    const day = easternDay();
    const total = totalOf(entry);
    const character = await pointsStore.getCharacter(guildId, buyer.id);
    if (character.fencedOn === day) {
        await interaction.editReply(pick(flavor.alreadyFencedLines()));
        return;
    }
    if (character.points < total) {
        await interaction.editReply(pick(flavor.fenceCannotAffordLines(label(entry), total)));
        return;
    }

    await interaction.editReply('The fence awaits thy word, in secret.');
    const confirmed = await askConfirm(interaction, pick(flavor.fenceOfferLines(label(entry), entry.price, FENCE_FEE, upgradeNote(entry, character))));
    if (!confirmed) {
        await interaction.editReply('No deal was struck.');
        return;
    }

    // Read again: gear may have changed while the offer stood.
    const fresh = await pointsStore.getCharacter(guildId, buyer.id);
    const grant = gearGrant(entry, fresh);
    const result = await pointsStore.fenceWithPoints(guildId, buyer.id, buyer.displayName, total, grant, day);
    if (!result.ok) {
        const reply = {
            alreadyFenced: () => pick(flavor.alreadyFencedLines()),
            cannotAfford: () => pick(flavor.fenceCannotAffordLines(label(entry), total)),
            changed: () => 'Thy gear shifted while the deal was struck, so nothing was taken. Pray try again.',
        }[result.reason]();
        await interaction.editReply(reply);
        return;
    }

    const equipped = grant.equip !== undefined;
    console.log(`Fence (guild ${guildId}): ${buyer.displayName} (${buyer.id}) bought ${entry.name} for ${total}${equipped ? ', equipped' : ''} (${day}).`);
    await interaction.editReply(`Done. **${label(entry)}** is thine, for ${total} points.`);
    await interaction.channel.send({ content: pick(flavor.fencedLines(buyer.displayName, label(entry), equipped)), allowedMentions: { parse: [] } });
    await recordSpending(guildId, buyer, total);
    await achievements.checkStats(guildId, [{ userId: buyer.id, displayName: buyer.displayName }], interaction.channel);
};

const fence = async function (interaction) {
    const typed = interaction.options.getString('item');
    try {
        if (typed) await buyFromFence(interaction, typed);
        else await browse(interaction, interaction.options.getString('slot'), interaction.options.getString('rarity'));
    } catch (error) {
        console.error('Error handling /fence:', error);
        await interaction.editReply('Alack! The fence has vanished into the crowd. Pray try again anon!');
    }
};

// Autocomplete for the item: every typed word must appear in the piece's name,
// short name, slot or rarity, within the slot and rarity filters if set.
const autocomplete = async function (interaction) {
    const words = interaction.options.getFocused().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = filtered(interaction.options.getString('slot'), interaction.options.getString('rarity'))
        .filter((e) => {
            const text = `${e.name} ${e.short || ''} ${e.slot} ${rarityOf(e)}`.toLowerCase();
            return words.every((w) => text.includes(w));
        })
        .slice(0, 25)
        .map((e) => ({ name: `${label(e)}, ${e.slot}, ${totalOf(e)} points`.slice(0, 100), value: e.id }));
    await interaction.respond(matches);
};

module.exports = {
    description: `Browse all gear, or buy a piece not in the shop for ${FENCE_FEE} extra, once a day (visible only to you)`,
    category: 'SHOP',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'The piece to buy; leave empty to browse',
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true,
        },
        {
            name: 'slot',
            description: 'Only this slot',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: catalog.GEAR_SLOTS.map((s) => ({ name: s, value: s })),
        },
        {
            name: 'rarity',
            description: 'Only this rarity',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: catalog.RARITIES.map((r) => ({ name: r, value: r })),
        },
    ],
    run: fence,
    autocomplete,
    FENCE_FEE,
};
