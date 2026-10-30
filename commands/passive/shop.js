/* Passive behavior: the Herald's daily shop.
 *
 * Once a day at noon Eastern, 9 AM Pacific (src/dailyLineup.js keeps the
 * day's games clear of that slot), the Herald opens the shop and posts its stock:
 *   - 5 gear pieces, drawn at random from the catalog's SHOP_RARITIES: Rare,
 *     Epic and Legendary. Common and Uncommon gear is left to the fence,
 *     sellbacks and boss loot
 *   - 1 title, 1 class and 1 race. The title is one no member owns yet,
 *     so each title has one bearer; with every title owned, none is stocked
 *   - 1 pet, freshly generated (src/pets.js), for PET_PRICE. One buyer
 *     adopts it and names it
 * Gear and titles have 2 copies (titles: 1) shared by the whole server. Once
 * they're gone, that item is sold out until the next day. Callings and kindreds
 * never run out. The shop stays open until midnight Eastern, 9 PM Pacific,
 * when its stock resets and the Herald announces the closing (closeShopNow).
 *
 * Gear members sold back with /sell on an earlier day also goes on sale, in
 * a Discounts section shown only when there is some (see DISCOUNT below).
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
 *   pickDailyStock(random, ownedTitles) - the day's item ids, exported for the tests
 *   easternDay(date) - YYYY-MM-DD in Eastern time, exported for the tests
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findShopRole } = require('../../src/shopRole');
const catalog = require('./shopCatalog');
const { generatePet, petDescription, PET_PRICE } = require('../../src/pets');
const flavor = require('../../flavor_text');

const TIMEZONE = 'America/New_York';
const HOUR_MS = 60 * 60 * 1000;
const COPIES_PER_ITEM = 2;
// Titles are unique: one copy, so only one noble can bear each at a time.
const COPIES_PER_TITLE = 1;
const copiesFor = (id) => (catalog.TITLES.some((t) => t.id === id) ? COPIES_PER_TITLE : COPIES_PER_ITEM);
const GEAR_PER_DAY = 5;
// The rarities the daily shop stocks; the cheaper ones never appear.
const SHOP_RARITIES = ['Rare', 'Epic', 'Legendary'];
// The stock key for the day's pet; no catalog id looks like it.
const PET_STOCK_KEY = 'pet';

const EMBED_COLOR = 0xd4af37; // heraldic gold

// YYYY-MM-DD for the Eastern calendar day. Goes through Intl because the
// container clock is UTC.
const easternDay = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
};

// The first moment of the next Eastern day, when the shop closes and its
// stock resets. Starts from the wall-clock time left in the day, then steps by
// the hour to land exactly on the day change, which a DST shift can move by one.
const nextEasternMidnight = (now = Date.now()) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(now));
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    const elapsed = ((get('hour') * 60 + get('minute')) * 60 + get('second')) * 1000 + (now % 1000);
    const today = easternDay(new Date(now));
    let midnight = now + 24 * HOUR_MS - elapsed;
    while (easternDay(new Date(midnight - 1)) !== today) midnight -= HOUR_MS;
    while (easternDay(new Date(midnight)) === today) midnight += HOUR_MS;
    return midnight;
};

const pickOne = (list, random) => list[Math.floor(random() * list.length)];

// Draws the day's stock: GEAR_PER_DAY distinct gear pieces, then one title,
// one class (never the default peasant) and one race. Repeats across days
// are fine by design, except for titles: one already owned by a member,
// worn or stored, is never drawn. If every title is owned, there is none today.
const pickDailyStock = (random = Math.random, ownedTitles = new Set()) => {
    // Only gear with a real slot can be drawn; a slot-less item would be unequippable.
    const gearPool = catalog.GEAR.filter((e) => catalog.GEAR_SLOTS.includes(e.slot) && SHOP_RARITIES.includes(catalog.rarityFor(e.price)));
    const gear = [];
    for (let i = 0; i < GEAR_PER_DAY && gearPool.length; i++) {
        const [picked] = gearPool.splice(Math.floor(random() * gearPool.length), 1);
        gear.push(picked.id);
    }
    const titlePool = catalog.TITLES.filter((t) => !ownedTitles.has(t.id));
    return [
        ...gear,
        ...(titlePool.length ? [pickOne(titlePool, random).id] : []),
        pickOne(catalog.CLASSES, random).id,
        pickOne(catalog.RACES, random).id,
    ];
};

// The ids of every title a member of the guild owns, worn or in their cosmetics.
const ownedTitlesIn = async (guildId) => {
    const members = await pointsStore.getMembers(guildId);
    const isTitle = (id) => catalog.TITLES.some((t) => t.id === id);
    return new Set(members.flatMap((m) => [m.title, ...(m.cosmetics || [])]).filter(isTitle));
};

// Classes and races have no stock limit, so they get no stock entry.
const isLimited = (id) => {
    const entry = catalog.findEntry(id);
    return Boolean(entry) && kindOf(entry) !== 'class' && kindOf(entry) !== 'race';
};

const stockRecord = (now = Date.now(), random = Math.random, ownedTitles = new Set()) => {
    const items = pickDailyStock(random, ownedTitles);
    return {
        day: easternDay(new Date(now)),
        items,
        // The day's pet, unnamed until adopted. Its one copy is stocked as PET_STOCK_KEY.
        pet: generatePet(random),
        stock: { ...Object.fromEntries(items.filter(isLimited).map((id) => [id, copiesFor(id)])), [PET_STOCK_KEY]: 1 },
        openedAt: now,
        closesAt: nextEasternMidnight(now),
    };
};

// The kind of a catalog entry, from which list it came from.
const kindOf = (entry) => {
    if (catalog.TITLES.includes(entry)) return 'title';
    if (catalog.CLASSES.includes(entry)) return 'class';
    if (catalog.RACES.includes(entry)) return 'race';
    return 'gear';
};

/* Sellback discounts (see /sell in commands/prompts/sell.js). Gear listed on
 * one day goes on sale at the next shop to open on a later day, one copy,
 * at DISCOUNT off. A sale pays the seller what the buyer paid; a listing
 * still unsold when that shop closes pays the seller UNSOLD_REFUND of the
 * full price instead, and the piece leaves the realm.
 */
const DISCOUNT = 0.25;
const UNSOLD_REFUND = 0.5;
const discountPrice = (price) => Math.round(price * (1 - DISCOUNT));
const unsoldRefund = (price) => Math.round(price * UNSOLD_REFUND);

// The listings on sale (or already sold) in today's shop, oldest first.
const discountsFor = async function (guildId, day) {
    const listings = await pointsStore.getListings(guildId);
    return listings.filter((l) => l.saleDay === day && (l.status === 'onSale' || l.status === 'sold'));
};

// Pays out every listing whose shop has closed without it selling.
const settleListings = async function (guildId, now = Date.now()) {
    const listings = await pointsStore.getListings(guildId);
    for (const listing of listings) {
        if (listing.status !== 'onSale' || listing.closesAt > now) continue;
        const refund = unsoldRefund(listing.price);
        if (await pointsStore.expireListing(guildId, listing, refund)) {
            console.log(`Shop (guild ${guildId}): ${listing.sellerName}'s ${listing.itemId} went unsold; refunded ${refund}.`);
        }
    }
    return listings;
};

// Moves every listing from an earlier day onto this shop's shelves, and
// returns today's discounts. A rehearsal only shows what would go on sale.
const stockDiscounts = async function (guildId, record, persist) {
    const listings = persist ? await settleListings(guildId, record.openedAt) : await pointsStore.getListings(guildId);
    const ready = listings.filter((l) =>
        (l.status === 'listed' && l.listedDay < record.day) ||
        (l.status === 'onSale' && l.saleDay === record.day && l.closesAt > record.openedAt));
    const onSale = [];
    for (const listing of ready) {
        if (!persist || await pointsStore.putListingOnSale(guildId, listing.listingId, record.day, record.closesAt)) {
            onSale.push({ ...listing, status: 'onSale', saleDay: record.day, closesAt: record.closesAt });
        }
    }
    return onSale;
};

const shopEmbed = (record, discounts = []) => {
    // Gear reads [Slot] [Rarity] Name; the rarity comes from the price.
    const tagFor = (entry) => (entry.slot
        ? `[${entry.slot[0].toUpperCase()}${entry.slot.slice(1)}] [${catalog.rarityFor(entry.price)}] `
        : '');
    const linesFor = (kind) => record.items
        .map((id) => catalog.findEntry(id))
        .filter((entry) => entry && kindOf(entry) === kind)
        .map((entry) => `${tagFor(entry)}**${entry.name}** — ${entry.price} pts`);

    const discountLines = discounts
        .map((listing) => ({ listing, entry: catalog.findEntry(listing.itemId) }))
        .filter(({ entry }) => entry)
        .map(({ listing, entry }) => {
            const price = listing.status === 'sold' ? 'sold' : `~~${entry.price}~~ ${discountPrice(entry.price)} pts`;
            return `${tagFor(entry)}**${entry.name}** — ${price}, from ${listing.sellerName}`;
        });

    // Shops opened before pets existed have none.
    const adopted = record.stock && record.stock[PET_STOCK_KEY] === 0;
    const petLines = record.pet
        ? [`**${petDescription(record.pet)}** — ${adopted ? 'adopted' : `${PET_PRICE} pts, \`/buy item:pet name:<name>\``}`]
        : [];

    const sections = [
        [`=== Armor and Arms (${COPIES_PER_ITEM} in stock) ===`, linesFor('gear')],
        [`=== Discounts (${DISCOUNT * 100}% off, 1 each) ===`, discountLines],
        ['=== Titles (unique) ===', linesFor('title')],
        ['=== Classes (no limit) ===', linesFor('class')],
        ['=== Races (no limit) ===', linesFor('race')],
        ['=== Pet (1 to adopt) ===', petLines],
    ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Shop")
        .setDescription(`${flavor.shopOpenLines()[0]}\n\nBuy with \`/buy <name>\` and bear thy spoils proudly on \`/flex\`. Each piece lends thee fit, reckoned by its fame and, mostly, its weight in coin. Seek the rarest pieces, for the court's duels favor the best-armoured, and a full kit makes thy fit the envy of the realm. The merchant packs up at the stroke of midnight.\n\n*Wish to be summoned the moment the stalls open? Use /signup shop!*`);
    for (const [name, values] of sections) {
        // A field holds 1024 characters, so a long section carries over into more.
        let chunk = [];
        let fieldName = name;
        for (const line of values) {
            if (chunk.length && [...chunk, line].join('\n').length > 1024) {
                embed.addFields({ name: fieldName, value: chunk.join('\n') });
                chunk = [];
                fieldName = '​';
            }
            chunk.push(line);
        }
        if (chunk.length) embed.addFields({ name: fieldName, value: chunk.join('\n') });
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

            const record = stockRecord(Date.now(), Math.random, await ownedTitlesIn(g.id));
            if (persist) await pointsStore.openShop(g.id, record);
            // Whatever is left unsold is paid out by closeShopNow at midnight.
            const discounts = await stockDiscounts(g.id, record, persist);
            // Only the real opening pings the shopaholics; a test shop doesn't.
            const role = ping ? findShopRole(g) : null;
            await channel.send({
                content: role ? `<@&${role.id}> The merchant has thrown open his stalls!` : undefined,
                embeds: [shopEmbed(record, discounts)],
                allowedMentions: { roles: role ? [role.id] : [] },
            });
            console.log(`Shop (guild ${g.id}) opened${persist ? '' : ' (rehearsal, not saved)'}: ${record.items.join(', ')}${discounts.length ? `; discounts: ${discounts.map((l) => l.itemId).join(', ')}` : ''}.`);
        } catch (guildError) {
            console.error(`Shop failed to open for guild "${g.name}":`, guildError);
        }
    }
};

/* Close the day's shop at midnight Eastern: pays out unsold discounts and
 * announces the closing, in each guild whose shop opened on the day that just
 * ended. Called by src/dailyLineup.js. A guild whose shop never opened that
 * day, say after a restart, gets no announcement.
 */
const closeShopNow = async function (client, now = Date.now()) {
    const endedDay = easternDay(new Date(now - 60 * 1000));
    for (const g of client.guilds.cache.values()) {
        try {
            const record = await pointsStore.getShop(g.id);
            if (!record || record.day !== endedDay) continue;

            // The cron can fire a hair before the recorded closing time.
            await settleListings(g.id, Math.max(now, record.closesAt));
            const channel = await resolveChannel(g, 'shop', findAnnounceChannel);
            if (!channel) continue;
            const lines = flavor.shopClosingLines();
            await channel.send(lines[Math.floor(Math.random() * lines.length)]);
            console.log(`Shop (guild ${g.id}) closed for ${endedDay}.`);
        } catch (guildError) {
            console.error(`Shop failed to close for guild "${g.name}":`, guildError);
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

module.exports = {
    openShopNow, closeShopNow, pickDailyStock, easternDay, nextEasternMidnight, stockRecord, shopEmbed, kindOf, currentOpenShop,
    discountsFor, settleListings, discountPrice, unsoldRefund, PET_STOCK_KEY,
};
