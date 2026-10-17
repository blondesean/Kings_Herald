/* The bot's long-term history, written to the CloudWatch logs (kept a year,
 * see infra/lib/kings-herald-stack.ts) as one JSON object per line, so Logs
 * Insights can query the fields directly:
 *
 *   filter history = 1 and type = "snapshot" and userId = "<id>"
 *   | fields day, points, fit, duelWins, shopSpent
 *   | sort day asc
 *
 * Kinds of record:
 *   points   - every change to a member's points, with why:
 *              { guildId, userId, delta, reason, ...details }
 *   snapshot - each member's standing at the end of each day
 *              (see src/snapshots.js)
 *   command  - every slash command: { guildId, channelId, userId, name,
 *              command, options } (options as a JSON string)
 *   button   - every button click: { ..., customId, messageId }
 *              (see the interactionCreate handler in src/index.js)
 *   encounter - every boss fight: boss, difficulty, odds, outcome, killer, and
 *              per member their vote, stance, fit, power, gear, suitedUp and injury
 *              (commands/passive/encounter.js)
 *   loot     - every loot roll: item, each member's need/greed/pass, the
 *              rolls and the winner, linked to its fight by encounterId
 *
 * The records also stream to S3 for good, queryable with Athena (see
 * infra/lib/history-archive.ts).
 *
 * Every record carries history: 1 to tell it apart from ordinary log lines,
 * and v, so the shape can change later without confusing old records.
 */

const VERSION = 1;

const recordHistory = (type, fields) => {
    console.log(JSON.stringify({ history: 1, v: VERSION, type, at: new Date().toISOString(), ...fields }));
};

// A points change. Zero changes are skipped.
const recordPoints = (guildId, userId, delta, reason, details = {}) => {
    if (!delta) return;
    recordHistory('points', { guildId, userId, delta, reason, ...details });
};

module.exports = { recordHistory, recordPoints };
