/* Passive behavior: the Herald's daily shop.
 *
 * Once a day, at a random 15-minute slot between 9 AM and 9 PM Eastern
 * (the same window and slot scheme as the daily trivia), the Herald opens the
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
 *   scheduleShop(client) - registers the daily cron job (call once, on ready)
 *   openShopNow(client, opts) - opens the shop immediately; the scheduler uses it
 *   pickDailyStock(random) - the day's item ids, exported for the tests
 *   easternDay(date) - YYYY-MM-DD in Eastern time, exported for the tests
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { findShopRole } = require('../../src/shopRole');
const catalog = require('./shopCatalog');
const flavor = require('../../flavor_text');

const CRON_EXPRESSION = '0 9 * * *';
const TIMEZONE = 'America/New_York';
// The shop opens between 9 AM and 9 PM, so the three-hour window always ends
// before midnight, when the stock resets.
const WINDOW_HOURS = 12;
const SLOT_MINUTES = 15;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES;
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

// Callings and kindreds have no stock limit, so they get no stock entry.
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
        .map((entry) => `${entry.slot ? `[${entry.slot[0].toUpperCase()}${entry.slot.slice(1)}] ` : ''}**${entry.name}** — ${entry.price} points`);

    const sections = [
        ['=== Armour and Arms ===', linesFor('gear')],
        ['=== Titles ===', linesFor('title')],
        ['=== Callings ===', linesFor('class')],
        ['=== Kindreds ===', linesFor('race')],
    ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Shop")
        .setDescription(`${flavor.shopOpenLines()[0]}\n\nBuy with \`/buy <name>\`, then show off thy fit with \`/flex\`. Today, gear has ${COPIES_PER_ITEM} copies for the whole realm and titles have one. Callings and kindreds are always available. The merchant packs his wares once the hour hand has made three full turns of the dial.`);
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
 */
const openShopNow = async function (client, options = {}) {
    const { guild, targetChannel, persist = false } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    for (const g of guilds) {
        try {
            const channel = targetChannel || findAnnounceChannel(g);
            if (!channel) {
                console.log(`Shop: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const record = stockRecord();
            if (persist) await pointsStore.openShop(g.id, record);
            // Only the real opening pings the shopaholics; a test shop doesn't.
            const role = persist ? findShopRole(g) : null;
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

/* Register the daily shop opening. Call once after the client is ready.
 * Fires at 9 AM Eastern, then waits a random 15-minute slot before opening,
 * like the daily trivia.
 */
const scheduleShop = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Shop: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            const delayMs = Math.floor(Math.random() * SLOT_COUNT) * SLOT_MINUTES * 60 * 1000;
            console.log(`Shop: today's shop will open in ${Math.round(delayMs / 60000)} minutes.`);
            setTimeout(() => {
                openShopNow(client, { persist: true }).catch((error) =>
                    console.error('Scheduled shop opening failed:', error)
                );
            }, delayMs);
        },
        { timezone: TIMEZONE }
    );

    console.log(`Shop scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}), opens in a random ${SLOT_MINUTES}-minute slot each day, open ${OPEN_MS / 60000} minutes.`);
};

// Today's open shop for a guild, or null if it hasn't opened yet, has closed,
// or was opened on an earlier day.
const currentOpenShop = async function (guildId, now = Date.now()) {
    const record = await pointsStore.getShop(guildId);
    if (!record || record.day !== easternDay(new Date(now)) || now >= record.closesAt) return null;
    return record;
};

module.exports = { scheduleShop, openShopNow, pickDailyStock, easternDay, stockRecord, shopEmbed, kindOf, currentOpenShop };
