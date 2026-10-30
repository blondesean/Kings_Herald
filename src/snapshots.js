/* A daily snapshot of every member's standing, written to the history log
 * (src/historyLog.js) just before midnight Eastern, so points, fit, duels,
 * shop spending and the rest can be charted over time later. One record per
 * member per guild per day:
 *   { guildId, day, userId, name, points, earned, fit, duelWins, duelLosses,
 *     shopSpent, voiceHours, achievements, encounterWins, winsEasy ... winsRaid,
 *     killingBlows, lootWon }
 * Each fight itself is recorded by the encounter (type "encounter" and "loot").
 *
 * The snapshot only goes to the logs; nothing is written to DynamoDB. A
 * restart doesn't lose anything except a snapshot whose moment it was down for.
 */

const cron = require('node-cron');
const pointsStore = require('./pointsStore');
const { totalFit } = require('./character');
const { recordHistory } = require('./historyLog');
const { easternDay } = require('../commands/passive/shop');

const SNAPSHOT_CRON = '55 23 * * *';
const TIMEZONE = 'America/New_York';

const snapshotGuild = async function (guild, day = easternDay()) {
    const [members, achievements] = await Promise.all([
        pointsStore.getMembers(guild.id),
        pointsStore.getAllAchievements(guild.id),
    ]);
    for (const m of members) {
        const state = achievements.get(m.userId) || { unlocked: {}, counters: {} };
        const c = state.counters;
        recordHistory('snapshot', {
            guildId: guild.id,
            day,
            userId: m.userId,
            name: m.displayName || 'a noble',
            points: m.points || 0,
            earned: (m.totalEarned || 0) + (m.earnedBaseline || 0),
            fit: totalFit(m.gear, m),
            duelWins: m.duelWins || 0,
            duelLosses: m.duelLosses || 0,
            shopSpent: state.counters.shop_spent || 0,
            voiceHours: Math.round((m.totalVoiceSeconds || 0) / 360) / 10,
            achievements: Object.keys(state.unlocked).length,
            // Encounter totals, from the achievement counters (src/achievements.js).
            encounterWins: c.encounter_wins || 0,
            winsEasy: c.win_easy || 0,
            winsMedium: c.win_medium || 0,
            winsHard: c.win_hard || 0,
            winsExtreme: c.win_extreme || 0,
            winsMax: c.win_max || 0,
            winsRaid: c.win_raid || 0,
            killingBlows: c.heroics || 0,
            lootWon: c.loot || 0,
        });
    }
    return members.length;
};

// Call once on ready.
const scheduleSnapshots = function (client) {
    cron.schedule(SNAPSHOT_CRON, async () => {
        for (const guild of client.guilds.cache.values()) {
            try {
                const count = await snapshotGuild(guild);
                console.log(`Snapshots: recorded ${count} member(s) for guild ${guild.id}.`);
            } catch (error) {
                console.error(`Snapshots failed for guild "${guild.name}":`, error);
            }
        }
    }, { timezone: TIMEZONE });
    console.log(`Snapshots scheduled: "${SNAPSHOT_CRON}" (${TIMEZONE}).`);
};

module.exports = { snapshotGuild, scheduleSnapshots };
