/* Persistent points leaderboard backed by DynamoDB.
 *
 * Each guild keeps a running tally of points its members have earned from the
 * weekly recap (5 for the most-reacted post of the week, 3 for second, 1 for
 * third). The table is keyed (guildId, userId) so multiple servers stay
 * separate.
 *
 * The same table also holds two other kinds of item, still under `guildId`:
 *   - duelWins/duelLosses: extra attributes on a real user's own item (see
 *     recordDuelResult/getDuelStats).
 *   - duel history: one item per resolved /duel, keyed (guildId, "DUEL#...")
 *     — a synthetic sort key that can never collide with a real Discord user
 *     ID (always purely numeric), so it's safely excluded from
 *     getLeaderboard's results (see recordDuelHistory/getDuelHistory).
 *
 * A real user's item also carries totalVoiceSeconds (lifetime, never reset —
 * what voice points are computed from) and weeklyVoiceSeconds (reset after
 * each weekly recap — what the recap's voice podium ranks on). See
 * addVoiceSeconds/getWeeklyVoiceStats/resetWeeklyVoiceSeconds and
 * commands/passive/voiceTime.js.
 *
 * One more synthetic item, keyed (TRIVIA_STATE_PARTITION, "BAG") rather than
 * a real guildId — the daily trivia's shared no-repeat cycle isn't
 * guild-scoped (one scheduled run posts the same question to every guild),
 * so it doesn't fit the per-guild partitioning above. See
 * getUsedTriviaQuestions/setUsedTriviaQuestions and commands/passive/trivia.js.
 *
 * Configuration comes from the environment:
 *   POINTS_TABLE_NAME  - the DynamoDB table name (set by the CDK stack)
 *   AWS_REGION         - resolved automatically on Fargate; set it locally to
 *                        exercise the DynamoDB path during development
 *
 * If POINTS_TABLE_NAME is not set (e.g. local development without AWS), the
 * functions degrade gracefully: writes are skipped and reads return an empty
 * leaderboard, so the rest of the recap still works.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, QueryCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.POINTS_TABLE_NAME;

// Sort-key prefix for duel-history items, so they live in the same table
// and partition as real per-user items but are never mistaken for one
// (Discord user IDs are always purely numeric snowflakes).
const DUEL_HISTORY_PREFIX = 'DUEL#';

// Voice-chat points: awarded continuously as members spend time connected to
// a voice channel (see commands/passive/voiceTime.js), independent of the
// weekly recap's schedule. Expressed as seconds-per-point (rather than a
// fraction) so addVoiceSeconds can compute earned points with integer floor
// division against the running totalVoiceSeconds counter.
const VOICE_POINTS_PER_HOUR = 2;
const VOICE_SECONDS_PER_POINT = 3600 / VOICE_POINTS_PER_HOUR;

// Synthetic partition for the daily trivia's used-question state (see
// commands/passive/trivia.js). Not a real guildId — Discord guild IDs are
// always purely numeric snowflakes, so this value can never collide with
// one — and there's only ever one item in it, under a fixed sort key.
const TRIVIA_STATE_PARTITION = 'TRIVIA#STATE';
const TRIVIA_STATE_SORT_KEY = 'BAG';

// Lazily created so the bot can run locally without AWS credentials configured.
let docClient = null;
const getClient = () => {
    if (!docClient) {
        docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    }
    return docClient;
};

const isConfigured = () => Boolean(TABLE_NAME);

/* Add points to one or more members. `awards` is an array of
 * { userId, displayName, points }. Each is an atomic increment so concurrent
 * runs (or retries) can't clobber each other.
 */
const addPoints = async function (guildId, awards) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping points persistence.');
        return;
    }

    const client = getClient();

    for (const award of awards) {
        if (!award || !award.userId || !award.points) {
            continue;
        }

        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId: award.userId },
            UpdateExpression: 'SET #dn = :n ADD #pts :p',
            ExpressionAttributeNames: {
                '#dn': 'displayName',
                '#pts': 'points',
            },
            ExpressionAttributeValues: {
                ':n': award.displayName || 'a noble',
                ':p': award.points,
            },
        }));
    }
};

/* Return the top `limit` members for a guild as
 * [{ userId, displayName, points }], highest points first.
 */
const getLeaderboard = async function (guildId, limit = 10) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty leaderboard.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#g = :g',
        ExpressionAttributeNames: { '#g': 'guildId' },
        ExpressionAttributeValues: { ':g': guildId },
    }));

    const items = result.Items || [];
    return items
        // Duel-history items live in the same partition under a "DUEL#..."
        // sort key rather than a real Discord user ID — DynamoDB won't let a
        // Query's FilterExpression reference a key attribute like userId, so
        // this exclusion has to happen client-side instead.
        .filter((item) => !String(item.userId).startsWith(DUEL_HISTORY_PREFIX))
        .map((item) => ({
            userId: item.userId,
            displayName: item.displayName || 'a noble',
            points: item.points || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
};

/* Return a single member's point total (0 if they have none, or if the
 * table isn't configured).
 */
const getPoints = async function (guildId, userId) {
    if (!isConfigured()) {
        return 0;
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
    }));

    return (result.Item && result.Item.points) || 0;
};

/* Credit a member with `seconds` of voice-channel time: adds to their
 * running totalVoiceSeconds (never reset — this is what points are computed
 * from) and their weeklyVoiceSeconds (reset after each weekly recap — see
 * resetWeeklyVoiceSeconds — and used only to rank the recap's voice podium).
 * Points are floor(newTotal / VOICE_SECONDS_PER_POINT) -
 * floor(priorTotal / VOICE_SECONDS_PER_POINT), so fractional time always
 * carries forward to the next call rather than being dropped.
 *
 * Not a single atomic DynamoDB update (needs a read first to compute the
 * points delta), but the bot only ever runs one task at a time, and a given
 * member's voice sessions are only ever flushed from one place in that one
 * process, so there's no concurrent writer to race against.
 */
const addVoiceSeconds = async function (guildId, userId, displayName, seconds) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping voice time persistence.');
        return;
    }
    if (!seconds || seconds <= 0) return;

    const client = getClient();

    const existing = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
    }));
    const priorTotal = (existing.Item && existing.Item.totalVoiceSeconds) || 0;
    const newTotal = priorTotal + seconds;
    const pointsEarned = Math.floor(newTotal / VOICE_SECONDS_PER_POINT) - Math.floor(priorTotal / VOICE_SECONDS_PER_POINT);

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
        UpdateExpression: 'SET #dn = :n, #tvs = :newTotal ADD #wvs :s, #pts :p',
        ExpressionAttributeNames: {
            '#dn': 'displayName',
            '#tvs': 'totalVoiceSeconds',
            '#wvs': 'weeklyVoiceSeconds',
            '#pts': 'points',
        },
        ExpressionAttributeValues: {
            ':n': displayName || 'a noble',
            ':newTotal': newTotal,
            ':s': seconds,
            ':p': pointsEarned,
        },
    }));
};

/* Return every member of a guild with voice time logged since the last
 * weekly reset, as [{ userId, displayName, weeklyVoiceSeconds }]. Backs the
 * weekly recap's voice podium (commands/passive/weeklyRecap.js).
 */
const getWeeklyVoiceStats = async function (guildId) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty voice stats.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#g = :g',
        ExpressionAttributeNames: { '#g': 'guildId' },
        ExpressionAttributeValues: { ':g': guildId },
    }));

    const items = result.Items || [];
    return items
        .filter((item) => !String(item.userId).startsWith(DUEL_HISTORY_PREFIX))
        .filter((item) => (item.weeklyVoiceSeconds || 0) > 0)
        .map((item) => ({
            userId: item.userId,
            displayName: item.displayName || 'a noble',
            weeklyVoiceSeconds: item.weeklyVoiceSeconds,
        }));
};

/* Zero out weeklyVoiceSeconds for the given members (their totalVoiceSeconds
 * and points are untouched — this only resets the podium-ranking window).
 * Called by the weekly recap right after it reads and awards the voice
 * podium, so next week starts from zero.
 */
const resetWeeklyVoiceSeconds = async function (guildId, userIds) {
    if (!isConfigured() || !userIds.length) return;

    const client = getClient();

    for (const userId of userIds) {
        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId },
            UpdateExpression: 'SET #wvs = :zero',
            ExpressionAttributeNames: { '#wvs': 'weeklyVoiceSeconds' },
            ExpressionAttributeValues: { ':zero': 0 },
        }));
    }
};

/* Return the trivia question texts already asked during the current
 * no-repeat cycle, as a string array (empty if no cycle is in progress, or
 * the table isn't configured — in which case the cycle tracks in-memory only
 * for the life of the process, same as before this existed). Backs
 * commands/passive/trivia.js's restart-safe no-repeat bag.
 */
const getUsedTriviaQuestions = async function () {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty trivia bag state.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: TRIVIA_STATE_PARTITION, userId: TRIVIA_STATE_SORT_KEY },
    }));

    return (result.Item && result.Item.usedQuestions) || [];
};

/* Overwrite the persisted set of trivia question texts asked this cycle.
 * Pass an empty array to start a fresh cycle (called once the whole bank
 * has been asked through — see commands/passive/trivia.js).
 */
const setUsedTriviaQuestions = async function (usedQuestions) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping trivia bag persistence.');
        return;
    }

    const client = getClient();

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: TRIVIA_STATE_PARTITION, userId: TRIVIA_STATE_SORT_KEY, usedQuestions },
    }));
};

/* Record a /duel outcome: increments the winner's duelWins and the loser's
 * duelLosses (separate attributes on the same points-table item, so no
 * second table is needed). `winner`/`loser` are { userId, displayName }.
 */
const recordDuelResult = async function (guildId, winner, loser) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping duel stat persistence.');
        return;
    }

    const client = getClient();

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId: winner.userId },
        UpdateExpression: 'SET #dn = :n ADD #w :one',
        ExpressionAttributeNames: { '#dn': 'displayName', '#w': 'duelWins' },
        ExpressionAttributeValues: { ':n': winner.displayName || 'a noble', ':one': 1 },
    }));

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId: loser.userId },
        UpdateExpression: 'SET #dn = :n ADD #l :one',
        ExpressionAttributeNames: { '#dn': 'displayName', '#l': 'duelLosses' },
        ExpressionAttributeValues: { ':n': loser.displayName || 'a noble', ':one': 1 },
    }));
};

/* Return a single member's duel record as { wins, losses } (both 0 if
 * they've never dueled, or if the table isn't configured).
 */
const getDuelStats = async function (guildId, userId) {
    if (!isConfigured()) {
        return { wins: 0, losses: 0 };
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
    }));

    return {
        wins: (result.Item && result.Item.duelWins) || 0,
        losses: (result.Item && result.Item.duelLosses) || 0,
    };
};

/* Record one resolved /duel as its own durable item — who challenged whom,
 * the method, the wager, and who won — independent of the running
 * duelWins/duelLosses counters (which only ever hold a tally, not the
 * events behind it) and independent of CloudWatch (whose log group only
 * retains a month). `entry` is
 *   { method, wager, challengerId, challengerName, targetId, targetName,
 *     winnerId, winnerName, loserId, loserName }
 */
const recordDuelHistory = async function (guildId, entry) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping duel history persistence.');
        return;
    }

    const client = getClient();
    const timestamp = new Date().toISOString();
    // Random suffix guards against two duels resolving in the same
    // millisecond in the same guild, which would otherwise collide.
    const sortKey = `${DUEL_HISTORY_PREFIX}${timestamp}#${Math.random().toString(36).slice(2, 8)}`;

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId, userId: sortKey, timestamp, ...entry },
    }));
};

/* Return the `limit` most recent resolved duels for a guild, newest first,
 * as entries shaped like recordDuelHistory's `entry` (plus `timestamp`).
 */
const getDuelHistory = async function (guildId, limit = 10) {
    if (!isConfigured()) {
        return [];
    }

    const client = getClient();

    const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#g = :g AND begins_with(#u, :duelPrefix)',
        ExpressionAttributeNames: { '#g': 'guildId', '#u': 'userId' },
        ExpressionAttributeValues: { ':g': guildId, ':duelPrefix': DUEL_HISTORY_PREFIX },
        ScanIndexForward: false, // newest first (sort key starts with an ISO timestamp)
        Limit: limit,
    }));

    return (result.Items || []).map(({ guildId: _g, userId: _u, ...entry }) => entry);
};

module.exports = {
    addPoints,
    getLeaderboard,
    getPoints,
    addVoiceSeconds,
    getWeeklyVoiceStats,
    resetWeeklyVoiceSeconds,
    VOICE_POINTS_PER_HOUR,
    getUsedTriviaQuestions,
    setUsedTriviaQuestions,
    recordDuelResult,
    getDuelStats,
    recordDuelHistory,
    getDuelHistory,
    isConfigured,
};
