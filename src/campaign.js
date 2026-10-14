/* The server's campaign: the climb through the encounter tiers to the lore
 * drops and the trials (see docs/the-last-proclamation.md).
 *
 *   - Easy, Medium and Hard are always open. The first Hard win opens
 *     Extreme, and the first Extreme win opens Max (see openTiers/recordWin).
 *   - The first Max win starts the lore drops: one each morning at 9 AM
 *     Eastern for seven days, from the next morning (flavor_text/loreDrops.js).
 *     The seventh opens the trials.
 *
 * Milestones live on one item per guild (pointsStore.getCampaign), each
 * written once, so only the first clear counts and a restart can't post a
 * drop twice. A guild that beat Hard or Extreme before the campaign existed is
 * backfilled from its members' win counters the first time it is read.
 *
 * Exposes:
 *   openTiers(guildId) - the tiers the daily encounter may roll
 *   recordWin(guildId, tier, now) - after a win: { opened } when it opened a
 *     tier, { loreBegins } when it was the first Max win, else null
 *   postLoreDrops(client, now) / scheduleLoreDrops(client)
 *   loreDayIndex(startDay, today), addDays(day, n) - pure, for the tests
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('./pointsStore');
const { resolveChannel } = require('./resolveChannel');
const { findAnnounceChannel } = require('./findAnnounceChannel');
const { easternDay } = require('../commands/passive/shop');
const loreDrops = require('../flavor_text/loreDrops');

const TIMEZONE = 'America/New_York';
const LORE_CRON = '0 9 * * *';
const LORE_HOUR = 9;
const EMBED_COLOR = 0xd4af37; // heraldic gold

const BASE_TIERS = [0, 1, 2];
const HARD = 2;
const EXTREME = 3;
const MAX = 4;
// What each tier's first win records, and the tier it opens.
const MILESTONES = {
    [HARD]: { field: 'hardClearedAt', opens: EXTREME, counter: 'win_hard' },
    [EXTREME]: { field: 'extremeClearedAt', opens: MAX, counter: 'win_extreme' },
    [MAX]: { field: 'maxClearedAt' },
};

// YYYY-MM-DD plus n days.
const addDays = (day, n) => {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + n);
    return date.toISOString().slice(0, 10);
};

// Which lore drop is due today, 0-based, or -1 if none.
const loreDayIndex = (startDay, today) => {
    if (!startDay) return -1;
    const index = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDay}T00:00:00Z`)) / 86400000);
    return index >= 0 && index < loreDrops.length ? index : -1;
};

const tiersFrom = (campaign) => [
    ...BASE_TIERS,
    ...(campaign.hardClearedAt ? [EXTREME] : []),
    ...(campaign.extremeClearedAt ? [MAX] : []),
];

// A guild that cleared Hard or Extreme before the campaign existed: any
// member with a win at that tier counts. Runs once per guild.
const backfill = async (guildId, campaign) => {
    const all = await pointsStore.getAllAchievements(guildId);
    const anyWin = (counter) => [...all.values()].some((state) => (state.counters[counter] || 0) > 0);
    for (const tier of [HARD, EXTREME]) {
        const { field, counter } = MILESTONES[tier];
        if (!campaign[field] && anyWin(counter) && await pointsStore.setCampaignOnce(guildId, field, 'backfilled')) {
            campaign[field] = 'backfilled';
            console.log(`Campaign (guild ${guildId}): backfilled ${field} from earlier wins.`);
        }
    }
    await pointsStore.setCampaignOnce(guildId, 'backfilledAt', new Date().toISOString());
    return campaign;
};

const openTiers = async function (guildId) {
    let campaign = await pointsStore.getCampaign(guildId);
    if (!campaign.backfilledAt) campaign = await backfill(guildId, campaign);
    return tiersFrom(campaign);
};

const recordWin = async function (guildId, tier, now = new Date()) {
    const milestone = MILESTONES[tier];
    if (!milestone || !await pointsStore.setCampaignOnce(guildId, milestone.field, now.toISOString())) return null;
    console.log(`Campaign (guild ${guildId}): first ${milestone.field.replace('ClearedAt', '')} win.`);
    if (tier === MAX) {
        await pointsStore.setCampaignOnce(guildId, 'loreStartDay', addDays(easternDay(now), 1));
        return { loreBegins: true };
    }
    return { opened: milestone.opens };
};

/* Posts today's lore drop in every guild that has one due and hasn't had it
 * yet. Each drop is marked as posted before it goes out, so it can only ever
 * go out once.
 */
const postLoreDrops = async function (client, now = new Date()) {
    const today = easternDay(now);
    for (const g of client.guilds.cache.values()) {
        try {
            const campaign = await pointsStore.getCampaign(g.id);
            const index = loreDayIndex(campaign.loreStartDay, today);
            if (index < 0) continue;
            if (!await pointsStore.setCampaignOnce(g.id, `loreDrop${index + 1}At`, now.toISOString())) continue;

            const channel = await resolveChannel(g, 'lore', findAnnounceChannel);
            if (!channel) {
                console.log(`Lore (guild ${g.id}): no channel to post day ${index + 1} in; skipped.`);
                continue;
            }
            const drop = loreDrops[index];
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle(`The Long Memory, day ${index + 1} of ${loreDrops.length}: ${drop.title}`)
                .setDescription(drop.text);
            await channel.send({ embeds: [embed] });
            console.log(`Lore (guild ${g.id}): posted day ${index + 1}, "${drop.title}".`);
        } catch (error) {
            console.error(`Lore drop failed for guild "${g.name}":`, error);
        }
    }
};

// The hour of `now` in Eastern time, 0-23.
const easternHour = (now) => Number(new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, hourCycle: 'h23', hour: '2-digit' }).format(now));

/* Posts each morning at 9 AM Eastern. A restart after 9 AM catches up on
 * today's drop shortly after startup, so a redeploy can't skip a day.
 */
const scheduleLoreDrops = function (client) {
    cron.schedule(LORE_CRON, () => {
        postLoreDrops(client).catch((error) => console.error('Scheduled lore drop failed:', error));
    }, { timezone: TIMEZONE });
    setTimeout(() => {
        if (easternHour(new Date()) >= LORE_HOUR) {
            postLoreDrops(client).catch((error) => console.error('Lore drop catch-up failed:', error));
        }
    }, 60 * 1000);
    console.log(`Lore drops scheduled: "${LORE_CRON}" (${TIMEZONE}), with a catch-up after startup.`);
};

module.exports = { openTiers, recordWin, postLoreDrops, scheduleLoreDrops, loreDayIndex, addDays, tiersFrom, MILESTONES };
