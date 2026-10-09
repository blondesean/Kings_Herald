/* Passive behavior: the Herald's daily shop.
 *
 * Once a day, at a random 15-minute slot between 9 AM and 9 PM Eastern,
 * placed by src/dailyLineup.js so it doesn't overlap the daily trivia or
 * puzzle slot (both posted to the same channel), the Herald opens the
 * shop and posts its stock:
 *   - 5 gear pieces, drawn at random from the catalog
 *   - 1 title, 1 class and 1 race
 * Gear and titles have 2 copies (titles: 1) shared by the whole server. Once
 * they're gone, that item is sold out until the next day. Callings and kindreds
 * never run out. The shop stays open for OPEN_MS (180
 * minutes) after it posts, and its stock resets at midnight Eastern.
 *
 * Buying uses points from the ledger (see /buy in commands/prompts/buy.js).
 * Gear goes to the buyer's bag, and titles, classes and races take effect
 * right away, replacing the old one. Equipping gear and the fit score are
 * described in commands/prompts/equip.js and src/character.js.
 *
 * The shop's state lives in DynamoDB (pointsStore.openShop/getShop), so a
 * restart mid-day keeps today's stock and its open window. The timer that
 * opens the shop does not survive a restart, the same as the other daily games.
 *
 * Exposes:
 *   openShopNow(client, opts) - opens the shop immediately; called by
 *                            src/dailyLineup.js and the /shop_test preview command
 *   pickDailyStock(random) - the day's item ids, exported for the tests
 *   easternDay(date) - YYYY-MM-DD in Eastern time, exported for the tests
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findShopRole } = require('../../src/shopRole');
const catalog = require('./shopCatalog');
const flavor = require('../../flavor_text');

const TIMEZONE = 'America/New_York';
const OPEN_MS = 3 * 60 * 60 * 1000;
const COPIES_PER_ITEM = 2;
// Titles are unique: one copy, so only one noble can bear each at a time.
const COPIES_PER_TITLE = 1;
const copiesFor = (id) => (catalog.TITLES.some((t) => t.id === id) ? COPIES_PER_TITLE : COPIES_PER_ITEM);
const GEAR_PER_DAY = 5;

const EMBED_COLOR = 0xd4af37; // heraldic gold

// YYYY-MM-DD for the Eastern calendar day. Goes through Intl because the
// container clock is UTC.
const easternDay = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
};

const pickOne = (list, random) => list[Math.floor(random() * list.length)];

// Draws the day's stock: GEAR_PER_DAY distinct gear pieces, then one title,
// one class (never the default peasant) and one race. Repeats across days
// are fine by design.
const pickDailyStock = (random = Math.random) => {
    // Only gear with a real slot can be drawn; a slot-less item would be unequippable.
    const gearPool = catalog.GEAR.filter((e) => catalog.GEAR_SLOTS.includes(e.slot));
    const gear = [];
    for (let i = 0; i < GEAR_PER_DAY && gearPool.length; i++) {
        const [picked] = gearPool.splice(Math.floor(random() * gearPool.length), 1);
        gear.push(picked.id);
    }
    return [
        ...gear,
        pickOne(catalog.TITLES, random).id,
        pickOne(catalog.CLASSES, random).id,
        pickOne(catalog.RACES, random).id,
    ];
};

// Classes and races have no stock limit, so they get no stock entry.
const isLimited = (id) => {
    const entry = catalog.findEntry(id);
    return Boolean(entry) && kindOf(entry) !== 'class' && kindOf(entry) !== 'race';
};

const stockRecord = (now = Date.now(), random = Math.random) => {
    const items = pickDailyStock(random);
    return {
        day: easternDay(new Date(now)),
        items,
        stock: Object.fromEntries(items.filter(isLimited).map((id) => [id, copiesFor(id)])),
        openedAt: now,
        closesAt: now + OPEN_MS,
    };
};

// The kind of a catalog entry, from which list it came from.
const kindOf = (entry) => {
    if (catalog.TITLES.includes(entry)) return 'title';
    if (catalog.CLASSES.includes(entry)) return 'class';
    if (catalog.RACES.includes(entry)) return 'race';
    return 'gear';
};

const shopEmbed = (record) => {
    const linesFor = (kind) => record.items
        .map((id) => catalog.findEntry(id))
        .filter((entry) => entry && kindOf(entry) === kind)
        .map((entry) => {
            // Gear reads [Slot] [Rarity] Name; the rarity comes from the price.
            const tag = entry.slot
                ? `[${entry.slot[0].toUpperCase()}${entry.slot.slice(1)}] [${catalog.rarityFor(entry.price)}] `
                : '';
            return `${tag}**${entry.name}** — ${entry.price} pts`;
        });

    const sections = [
        [`=== Armor and Arms (${COPIES_PER_ITEM} in stock) ===`, linesFor('gear')],
        ['=== Titles (unique) ===', linesFor('title')],
        ['=== Classes (no limit) ===', linesFor('class')],
        ['=== Races (no limit) ===', linesFor('race')],
    ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Shop")
        .setDescription(`${flavor.shopOpenLines()[0]}\n\nBuy with \`/buy <name>\` and bear thy spoils proudly on \`/flex\`. Each piece lends thee fit, reckoned by its fame and, mostly, its weight in coin. Seek the rarest pieces, for the court's duels favor the best-armoured, and a full kit makes thy fit the envy of the realm. The merchant packs up after three turns of the hour hand.\n\n*Wish to be summoned the moment the stalls open? Use /shop_signup!*`);
    for (const [name, values] of sections) {
        if (values.length) embed.addFields({ name, value: values.join('\n') });
    }
    return embed;
};

/* Open today's shop for each guild and post it. options:
 *   guild         - a single guild (default: every guild)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to save the shop; a rehearsal still posts but
 *                   doesn't open anything for buying (default: false)
 *   ping          - whether to ping the shopaholics role (default: persist)
 */
const openShopNow = async function (client, options = {}) {
    const { guild, targetChannel, persist = false, ping = persist } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'shop', findAnnounceChannel);
            if (!channel) {
                console.log(`Shop: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const record = stockRecord();
            if (persist) await pointsStore.openShop(g.id, record);
            // Only the real opening pings the shopaholics; a test shop doesn't.
            const role = ping ? findShopRole(g) : null;
            await channel.send({
                content: role ? `<@&${role.id}> The merchant has thrown open his stalls!` : undefined,
                embeds: [shopEmbed(record)],
                allowedMentions: { roles: role ? [role.id] : [] },
            });
            console.log(`Shop (guild ${g.id}) opened${persist ? '' : ' (rehearsal, not saved)'}: ${record.items.join(', ')}.`);
        } catch (guildError) {
            console.error(`Shop failed to open for guild "${g.name}":`, guildError);
        }
    }
};

// Today's open shop for a guild, or null if it hasn't opened yet, has closed,
// or was opened on an earlier day.
const currentOpenShop = async function (guildId, now = Date.now()) {
    const record = await pointsStore.getShop(guildId);
    if (!record || record.day !== easternDay(new Date(now)) || now >= record.closesAt) return null;
    return record;
};

module.exports = { openShopNow, pickDailyStock, easternDay, stockRecord, shopEmbed, kindOf, currentOpenShop };
