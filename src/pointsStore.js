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
 * A real user's item also carries totalVoiceSeconds (lifetime real seconds
 * spent in voice, never reset) and weeklyVoiceSeconds (same, reset after each
 * weekly recap — what the recap's voice podium ranks on), plus
 * totalWeightedVoiceSeconds (lifetime, never reset — what voice points are
 * actually computed from; see addVoiceSeconds). See
 * getWeeklyVoiceStats/resetWeeklyVoiceSeconds and commands/passive/voiceTime.js.
 *
 * One more per-guild item shape: pairings, keyed (guildId, "PAIR#<idA>#<idB>")
 * with the two lower/higher Discord user IDs sorted into the sort key so a
 * pair only ever has one item regardless of call order. Tracks
 * weeklyPairSeconds — how long two members have shared a voice channel this
 * week, reset after each recap — behind the recap's "Most Inseparable
 * Companions" display. See addPairSeconds/getWeeklyPairStats/
 * resetWeeklyPairSeconds and commands/passive/voiceTime.js.
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
// weekly recap's schedule. Anti-exploit: a lone member in a channel earns
// nothing, and the rate scales with how many (non-bot) members are actually
// there together — (occupancy - 1) points per hour, so a pair earns
// VOICE_POINTS_PER_HOUR, a call of 4 earns 3x that, etc. voiceTime.js does
// the per-second weighting and passes addVoiceSeconds the resulting
// "weighted seconds" (real seconds * (occupancy-1) at the time), separately
// from the real seconds used for totalVoiceSeconds/weeklyVoiceSeconds.
// Expressed as seconds-per-point (rather than a fraction) so addVoiceSeconds
// can compute earned points with integer floor division against the running
// totalWeightedVoiceSeconds counter.
const VOICE_POINTS_PER_HOUR = 1;
const VOICE_SECONDS_PER_POINT = 3600 / VOICE_POINTS_PER_HOUR;

// Sort-key prefix for pairing items — see the module comment above.
const PAIR_PREFIX = 'PAIR#';

// Synthetic partition for the daily trivia's used-question state (see
// commands/passive/trivia.js). Not a real guildId — Discord guild IDs are
// always purely numeric snowflakes, so this value can never collide with
// one — and there's only ever one item in it, under a fixed sort key.
const TRIVIA_STATE_PARTITION = 'TRIVIA#STATE';
const TRIVIA_STATE_SORT_KEY = 'BAG';

// Same shape as the trivia state above, for the daily Connections-style
// puzzle's no-repeat cycle (see commands/puzzles/connections.js).
const CONNECTIONS_STATE_PARTITION = 'CONNECTIONS#STATE';
const CONNECTIONS_STATE_SORT_KEY = 'BAG';

// Same again for the daily "would you rather" round's no-repeat cycle (see
// commands/passive/wouldYouRather.js). Kept separate from the trivia bag so
// exhausting this small bank can't reset the trivia cycle, and vice versa.
const WYR_STATE_PARTITION = 'WYR#STATE';
const WYR_STATE_SORT_KEY = 'BAG';
const RANK_STATE_PARTITION = 'RANK#STATE';
const RANK_STATE_SORT_KEY = 'BAG';
const LADDER_STATE_PARTITION = 'LADDER#STATE';
const LADDER_STATE_SORT_KEY = 'BAG';

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

        // A negative award (a duel loss, a /point_adjust take-away) also adds
        // to weeklyLost, so the recap can show losses separately from gains.
        const lost = award.points < 0 ? -award.points : 0;
        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId: award.userId },
            UpdateExpression: lost ? 'SET #dn = :n ADD #pts :p, #wl :lost' : 'SET #dn = :n ADD #pts :p',
            ExpressionAttributeNames: lost
                ? { '#dn': 'displayName', '#pts': 'points', '#wl': 'weeklyLost' }
                : { '#dn': 'displayName', '#pts': 'points' },
            ExpressionAttributeValues: lost
                ? { ':n': award.displayName || 'a noble', ':p': award.points, ':lost': lost }
                : { ':n': award.displayName || 'a noble', ':p': award.points },
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
        // Duel-history and pairing items live in the same partition under
        // synthetic sort keys rather than a real Discord user ID — DynamoDB
        // won't let a Query's FilterExpression reference a key attribute like
        // userId, so this exclusion has to happen client-side instead.
        .filter((item) => !String(item.userId).startsWith(DUEL_HISTORY_PREFIX) && !String(item.userId).startsWith(PAIR_PREFIX))
        .map((item) => ({
            userId: item.userId,
            displayName: item.displayName || 'a noble',
            points: item.points || 0,
            pointsAtLastRecap: item.pointsAtLastRecap || 0,
            gear: item.gear || {},
            weeklyLost: item.weeklyLost || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
};

/* Snapshot a member's current `points` total as of this recap, so next
 * week's recap can compute how many points they actually earned this week —
 * (their points now) minus (this snapshot) — as a single number covering
 * everything: continuous voice/puzzle accrual through the week, this week's
 * podium/reaction awards, and any manual /point_adjust in between. Called
 * once per leaderboard member at the end of each weekly recap
 * (see commands/passive/weeklyRecap.js), after that run's awards are
 * persisted, so the next snapshot always reflects the true end-of-week total.
 */
const setPointsSnapshot = async function (guildId, userId, points) {
    if (!isConfigured()) return;

    const client = getClient();

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
        UpdateExpression: 'SET #palr = :p, #wl = :zero',
        ExpressionAttributeNames: { '#palr': 'pointsAtLastRecap', '#wl': 'weeklyLost' },
        ExpressionAttributeValues: { ':p': points, ':zero': 0 },
    }));
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

/* Credit a member with `seconds` of real voice-channel time and
 * `weightedSeconds` of exploit-adjusted time for points purposes (real
 * seconds * (occupancy-1) at the time — see voiceTime.js; defaults to
 * `seconds` if omitted, i.e. no weighting).
 *
 * `seconds` adds to totalVoiceSeconds (lifetime, never reset) and
 * weeklyVoiceSeconds (reset after each weekly recap — see
 * resetWeeklyVoiceSeconds — and used only to rank the recap's voice podium,
 * which cares about time spent, not the anti-exploit weighting).
 *
 * `weightedSeconds` adds to totalWeightedVoiceSeconds (lifetime, never
 * reset), and points are floor(newWeightedTotal / VOICE_SECONDS_PER_POINT) -
 * floor(priorWeightedTotal / VOICE_SECONDS_PER_POINT), so fractional time
 * always carries forward to the next call rather than being dropped.
 *
 * Not a single atomic DynamoDB update (needs a read first to compute the
 * points delta), but the bot only ever runs one task at a time, and a given
 * member's voice sessions are only ever flushed from one place in that one
 * process, so there's no concurrent writer to race against.
 */
const addVoiceSeconds = async function (guildId, userId, displayName, seconds, weightedSeconds = seconds) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping voice time persistence.');
        return;
    }
    if ((!seconds || seconds <= 0) && (!weightedSeconds || weightedSeconds <= 0)) return;

    const client = getClient();

    const existing = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
    }));
    const priorWeightedTotal = (existing.Item && existing.Item.totalWeightedVoiceSeconds) || 0;
    const newWeightedTotal = priorWeightedTotal + (weightedSeconds || 0);
    const pointsEarned = Math.floor(newWeightedTotal / VOICE_SECONDS_PER_POINT) - Math.floor(priorWeightedTotal / VOICE_SECONDS_PER_POINT);

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
        UpdateExpression: 'SET #dn = :n, #twvs = :newWeightedTotal ADD #tvs :s, #wvs :s, #pts :p',
        ExpressionAttributeNames: {
            '#dn': 'displayName',
            '#twvs': 'totalWeightedVoiceSeconds',
            '#tvs': 'totalVoiceSeconds',
            '#wvs': 'weeklyVoiceSeconds',
            '#pts': 'points',
        },
        ExpressionAttributeValues: {
            ':n': displayName || 'a noble',
            ':newWeightedTotal': newWeightedTotal,
            ':s': seconds || 0,
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
        .filter((item) => !String(item.userId).startsWith(DUEL_HISTORY_PREFIX) && !String(item.userId).startsWith(PAIR_PREFIX))
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

// Deterministic sort key for a pairing item — the two IDs sorted so the pair
// (A, B) and (B, A) always land on the same item.
const pairSortKey = (userIdA, userIdB) => {
    const [lo, hi] = userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
    return `${PAIR_PREFIX}${lo}#${hi}`;
};

/* Credit `seconds` of simultaneous voice-channel presence to the pairing of
 * userIdA and userIdB (order doesn't matter). Backs the weekly recap's "Most
 * Inseparable Companions" display — see getWeeklyPairStats/
 * resetWeeklyPairSeconds and commands/passive/voiceTime.js. Display-only, no
 * points attached.
 */
const addPairSeconds = async function (guildId, userIdA, displayNameA, userIdB, displayNameB, seconds) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping pair time persistence.');
        return;
    }
    if (!seconds || seconds <= 0 || userIdA === userIdB) return;

    const [loName, hiName] = userIdA < userIdB ? [displayNameA, displayNameB] : [displayNameB, displayNameA];
    const client = getClient();

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId: pairSortKey(userIdA, userIdB) },
        UpdateExpression: 'SET #a = :a, #b = :b ADD #wps :s',
        ExpressionAttributeNames: {
            '#a': 'userAName',
            '#b': 'userBName',
            '#wps': 'weeklyPairSeconds',
        },
        ExpressionAttributeValues: {
            ':a': loName || 'a noble',
            ':b': hiName || 'a noble',
            ':s': seconds,
        },
    }));
};

/* Return every pairing with co-presence time logged since the last weekly
 * reset, as [{ pairKey, userIdA, displayNameA, userIdB, displayNameB,
 * weeklyPairSeconds }]. Backs the weekly recap (commands/passive/weeklyRecap.js).
 */
const getWeeklyPairStats = async function (guildId) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty pair stats.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#g = :g AND begins_with(#u, :pairPrefix)',
        ExpressionAttributeNames: { '#g': 'guildId', '#u': 'userId' },
        ExpressionAttributeValues: { ':g': guildId, ':pairPrefix': PAIR_PREFIX },
    }));

    return (result.Items || [])
        .filter((item) => (item.weeklyPairSeconds || 0) > 0)
        .map((item) => {
            const [, userIdA, userIdB] = item.userId.split('#');
            return {
                pairKey: item.userId,
                userIdA,
                displayNameA: item.userAName || 'a noble',
                userIdB,
                displayNameB: item.userBName || 'a noble',
                weeklyPairSeconds: item.weeklyPairSeconds,
            };
        });
};

/* Zero out weeklyPairSeconds for the given pairing items (by their pairKey,
 * i.e. the "PAIR#<idA>#<idB>" sort key). Called by the weekly recap right
 * after it reads and displays the pairing standings.
 */
const resetWeeklyPairSeconds = async function (guildId, pairKeys) {
    if (!isConfigured() || !pairKeys.length) return;

    const client = getClient();

    for (const pairKey of pairKeys) {
        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId: pairKey },
            UpdateExpression: 'SET #wps = :zero',
            ExpressionAttributeNames: { '#wps': 'weeklyPairSeconds' },
            ExpressionAttributeValues: { ':zero': 0 },
        }));
    }
};

/* Credit a member with `points` from a puzzle game (see commands/puzzles/) —
 * unlike voice/pair time, these points are real and awarded the moment
 * they're earned, not converted from a running counter at recap time. Adds
 * to both the running `points` total (immediately spendable/visible via
 * /nobility) and `weeklyPuzzlePoints` (reset after each weekly recap, purely
 * to power its display-only "puzzle podium" — see getWeeklyPuzzleStats/
 * resetWeeklyPuzzlePoints). Meant to be shared across every puzzle game
 * (Connections today, others later), so the recap's podium isn't tied to
 * any one of them specifically.
 */
const addPuzzlePoints = async function (guildId, userId, displayName, points) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping puzzle point persistence.');
        return;
    }
    if (!points || points <= 0) return;

    const client = getClient();

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
        UpdateExpression: 'SET #dn = :n ADD #pts :p, #wpp :p',
        ExpressionAttributeNames: {
            '#dn': 'displayName',
            '#pts': 'points',
            '#wpp': 'weeklyPuzzlePoints',
        },
        ExpressionAttributeValues: {
            ':n': displayName || 'a noble',
            ':p': points,
        },
    }));
};

/* Return every member with puzzle points logged since the last weekly
 * reset, as [{ userId, displayName, weeklyPuzzlePoints }]. Backs the weekly
 * recap's puzzle podium (commands/passive/weeklyRecap.js) — display only,
 * since the points themselves were already awarded in real time above.
 */
const getWeeklyPuzzleStats = async function (guildId) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty puzzle stats.');
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
        .filter((item) => !String(item.userId).startsWith(DUEL_HISTORY_PREFIX) && !String(item.userId).startsWith(PAIR_PREFIX))
        .filter((item) => (item.weeklyPuzzlePoints || 0) > 0)
        .map((item) => ({
            userId: item.userId,
            displayName: item.displayName || 'a noble',
            weeklyPuzzlePoints: item.weeklyPuzzlePoints,
        }));
};

/* Zero out weeklyPuzzlePoints for the given members (their running `points`
 * total is untouched — this only resets the podium-ranking window). Called
 * by the weekly recap right after it reads and displays the puzzle podium.
 */
const resetWeeklyPuzzlePoints = async function (guildId, userIds) {
    if (!isConfigured() || !userIds.length) return;

    const client = getClient();

    for (const userId of userIds) {
        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId },
            UpdateExpression: 'SET #wpp = :zero',
            ExpressionAttributeNames: { '#wpp': 'weeklyPuzzlePoints' },
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

/* Same as getUsedTriviaQuestions, but for the daily Connections-style
 * puzzle's no-repeat cycle — a string array of puzzle signatures already
 * used this cycle (see commands/puzzles/connections.js's puzzleSignature).
 */
const getUsedConnectionsPuzzles = async function () {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty connections bag state.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: CONNECTIONS_STATE_PARTITION, userId: CONNECTIONS_STATE_SORT_KEY },
    }));

    return (result.Item && result.Item.usedPuzzles) || [];
};

/* Overwrite the persisted set of used Connections puzzle signatures. Pass an
 * empty array to start a fresh cycle (called once the whole bank has been
 * used through — see commands/puzzles/connections.js).
 */
const setUsedConnectionsPuzzles = async function (usedPuzzles) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping connections bag persistence.');
        return;
    }

    const client = getClient();

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: CONNECTIONS_STATE_PARTITION, userId: CONNECTIONS_STATE_SORT_KEY, usedPuzzles },
    }));
};

/* Same as getUsedTriviaQuestions, but for the "would you rather" round's
 * no-repeat cycle — a string array of question texts already used this cycle.
 */
const getUsedWouldYouRather = async function () {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty would-you-rather bag state.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: WYR_STATE_PARTITION, userId: WYR_STATE_SORT_KEY },
    }));

    return (result.Item && result.Item.usedQuestions) || [];
};

/* Overwrite the persisted set of used would-you-rather question texts. Pass
 * an empty array to start a fresh cycle.
 */
const setUsedWouldYouRather = async function (usedQuestions) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping would-you-rather bag persistence.');
        return;
    }

    const client = getClient();

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: WYR_STATE_PARTITION, userId: WYR_STATE_SORT_KEY, usedQuestions },
    }));
};

/* Same as getUsedWouldYouRather, but for the ranking round's no-repeat cycle.
 */
const getUsedRanking = async function () {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty ranking bag state.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: RANK_STATE_PARTITION, userId: RANK_STATE_SORT_KEY },
    }));

    return (result.Item && result.Item.usedQuestions) || [];
};

/* Overwrite the persisted set of used ranking question texts. Pass an empty
 * array to start a fresh cycle.
 */
const setUsedRanking = async function (usedQuestions) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping ranking bag persistence.');
        return;
    }

    const client = getClient();

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: RANK_STATE_PARTITION, userId: RANK_STATE_SORT_KEY, usedQuestions },
    }));
};

/* Same as getUsedConnectionsPuzzles, but for the Word Ladder's no-repeat
 * cycle — a string array of puzzle signatures ("START-TARGET") already used
 * this cycle (see commands/puzzles/wordLadder.js).
 */
const getUsedWordLadderPuzzles = async function () {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty word ladder bag state.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: LADDER_STATE_PARTITION, userId: LADDER_STATE_SORT_KEY },
    }));

    return (result.Item && result.Item.usedPuzzles) || [];
};

/* Overwrite the persisted set of used Word Ladder puzzle signatures. Pass an
 * empty array to start a fresh cycle.
 */
const setUsedWordLadderPuzzles = async function (usedPuzzles) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping word ladder bag persistence.');
        return;
    }

    const client = getClient();

    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: LADDER_STATE_PARTITION, userId: LADDER_STATE_SORT_KEY, usedPuzzles },
    }));
};

// ---- the shop and characters (see commands/passive/shop.js and src/character.js) ----
//
// Each guild's current shop lives under its own partition, SHOP#<guildId>, so
// it never shows up in the leaderboard query. Characters live on the member's
// ledger item (gear, bag, title, class, race), so buying and equipping never
// needs a second read of the points.

const SHOP_PREFIX = 'SHOP#';
const SHOP_SORT_KEY = 'CURRENT';

// Today's shop for a guild: { day, items, stock, closesAt, ... }, or null.
const getShop = async function (guildId) {
    if (!isConfigured()) return null;

    const result = await getClient().send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: SHOP_PREFIX + guildId, userId: SHOP_SORT_KEY },
    }));
    return result.Item || null;
};

// Replace the guild's shop with a new day's record.
const openShop = async function (guildId, record) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping shop persistence.');
        return;
    }

    await getClient().send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: SHOP_PREFIX + guildId, userId: SHOP_SORT_KEY, ...record },
    }));
};

// Take one copy of `itemId` from today's stock. Succeeds only while the shop
// is still open for `day` and that item has copies left. Returns false otherwise.
const takeShopStock = async function (guildId, day, itemId, now) {
    if (!isConfigured()) return false;

    try {
        await getClient().send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId: SHOP_PREFIX + guildId, userId: SHOP_SORT_KEY },
            UpdateExpression: 'SET #stock.#item = #stock.#item - :one',
            ConditionExpression: '#day = :day AND #closes > :now AND #stock.#item > :zero',
            ExpressionAttributeNames: { '#stock': 'stock', '#item': itemId, '#day': 'day', '#closes': 'closesAt' },
            ExpressionAttributeValues: { ':one': 1, ':zero': 0, ':day': day, ':now': now },
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
};

// Put one copy of `itemId` back on today's shelves: used when a title is
// returned, and when a purchase fails after the copy was taken. Only works
// while the shop is open for `day`. Adds the item to the list if it wasn't
// stocked today. Returns false if the shop is closed.
const restockShopItem = async function (guildId, day, itemId, now) {
    if (!isConfigured()) return false;

    const record = await getShop(guildId);
    if (!record || record.day !== day || now >= record.closesAt) return false;

    const names = { '#stock': 'stock', '#item': itemId, '#day': 'day', '#closes': 'closesAt' };
    const values = { ':one': 1, ':zero': 0, ':day': day, ':now': now };
    let update = 'SET #stock.#item = if_not_exists(#stock.#item, :zero) + :one';
    if (!(record.items || []).includes(itemId)) {
        names['#items'] = 'items';
        values[':new'] = [itemId];
        update += ', #items = list_append(#items, :new)';
    }

    try {
        await getClient().send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId: SHOP_PREFIX + guildId, userId: SHOP_SORT_KEY },
            UpdateExpression: update,
            ConditionExpression: '#day = :day AND #closes > :now',
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
};

// Put back a copy taken by takeShopStock, used when the purchase then fails.
const returnShopStock = async function (guildId, itemId) {
    if (!isConfigured()) return;

    await getClient().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId: SHOP_PREFIX + guildId, userId: SHOP_SORT_KEY },
        UpdateExpression: 'SET #stock.#item = #stock.#item + :one',
        ExpressionAttributeNames: { '#stock': 'stock', '#item': itemId },
        ExpressionAttributeValues: { ':one': 1 },
    }));
};

/* Charge `price` points and grant the item, in one conditional update: the
 * points must still cover the price when the write lands, so two purchases
 * racing each other can't overspend. `grant` is one of
 *   { bag: itemId }                    - gear, appended to the bag
 *   { equip: { slot, itemId, gear } }  - gear for an empty slot, equipped at once.
 *                                        `gear` is the member's current gear map,
 *                                        and the write only lands if it's unchanged
 *   { field, value }                   - title, class or race, replacing the old one
 * Returns true on success, false if the member can't afford it.
 */
const buyWithPoints = async function (guildId, userId, displayName, price, grant) {
    if (!isConfigured()) return false;

    const names = { '#dn': 'displayName', '#pts': 'points', '#wl': 'weeklyLost' };
    const values = { ':n': displayName || 'a noble', ':neg': -price, ':price': price, ':lost': price };
    let update;
    let condition = '#pts >= :price';
    if (grant.bag) {
        names['#bag'] = 'bag';
        values[':new'] = [grant.bag];
        values[':empty'] = [];
        update = 'SET #dn = :n, #bag = list_append(if_not_exists(#bag, :empty), :new) ADD #pts :neg, #wl :lost';
    } else if (grant.equip) {
        const { slot, itemId, gear } = grant.equip;
        names['#gear'] = 'gear';
        values[':newGear'] = { ...gear, [slot]: itemId };
        if (Object.keys(gear).length) {
            values[':oldGear'] = gear;
            condition += ' AND #gear = :oldGear';
        } else {
            condition += ' AND attribute_not_exists(#gear)';
        }
        update = 'SET #dn = :n, #gear = :newGear ADD #pts :neg, #wl :lost';
    } else {
        names['#field'] = grant.field;
        values[':value'] = grant.value;
        update = 'SET #dn = :n, #field = :value ADD #pts :neg, #wl :lost';
    }

    try {
        await getClient().send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId },
            UpdateExpression: update,
            ConditionExpression: condition,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
};

// A member's character and points: { points, displayName, gear, bag, title, class, race }.
const getCharacter = async function (guildId, userId) {
    const empty = { points: 0, displayName: null, gear: {}, bag: [], title: null, class: null, race: null };
    if (!isConfigured()) return empty;

    const result = await getClient().send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId, userId },
    }));
    const item = result.Item;
    if (!item) return empty;
    return {
        points: item.points || 0,
        displayName: item.displayName || null,
        gear: item.gear || {},
        bag: item.bag || [],
        title: item.title || null,
        class: item.class || null,
        race: item.race || null,
    };
};

/* Remove a title from a character, but only if it's still `expectedId` (so
 * a stale click can't clear a title the member has since swapped). Returns
 * false if the title doesn't match.
 */
const clearTitle = async function (guildId, userId, expectedId) {
    if (!isConfigured()) return false;

    try {
        await getClient().send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId },
            UpdateExpression: 'REMOVE #title',
            ConditionExpression: '#title = :expected',
            ExpressionAttributeNames: { '#title': 'title' },
            ExpressionAttributeValues: { ':expected': expectedId },
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
};

/* Poses live under their own partition, so anyone can choose one without
 * getting a ledger entry (which would show up on /nobility with zero points).
 */
const POSE_PREFIX = 'POSE#';

// The stick figure pose number a member chose, or null if they never chose one.
const getPose = async function (guildId, userId) {
    if (!isConfigured()) return null;

    const result = await getClient().send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: POSE_PREFIX + guildId, userId },
    }));
    return (result.Item && result.Item.pose) || null;
};

// Save a member's pose number. Free, and anyone can change it at any time.
const setPose = async function (guildId, userId, pose) {
    if (!isConfigured()) return;

    await getClient().send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { guildId: POSE_PREFIX + guildId, userId },
        UpdateExpression: 'SET #pose = :pose',
        ExpressionAttributeNames: { '#pose': 'pose' },
        ExpressionAttributeValues: { ':pose': pose },
    }));
};

/* Per-guild channel overrides for where a passive behavior posts its
 * scheduled output (see src/resolveChannel.js) — one map per guild, keyed by
 * scope ('trivia', 'shop', 'all', ...). Own partition, same shape as poses.
 */
const CHANNEL_OVERRIDE_PREFIX = 'CHANNEL#';
const CHANNEL_OVERRIDE_SORT_KEY = 'OVERRIDES';

// { [scope]: channelId }, or {} if the guild has never set one.
const getChannelOverrides = async function (guildId) {
    if (!isConfigured()) return {};

    const result = await getClient().send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { guildId: CHANNEL_OVERRIDE_PREFIX + guildId, userId: CHANNEL_OVERRIDE_SORT_KEY },
    }));
    return (result.Item && result.Item.overrides) || {};
};

// Points `scope` at `channelId` for this guild, replacing whatever it was.
// Read-merge-write rather than a nested SET, since the very first override
// for a guild has no `overrides` map yet for a nested path to land in.
const setChannelOverride = async function (guildId, scope, channelId) {
    if (!isConfigured()) return;

    const overrides = { ...(await getChannelOverrides(guildId)), [scope]: channelId };
    await getClient().send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: CHANNEL_OVERRIDE_PREFIX + guildId, userId: CHANNEL_OVERRIDE_SORT_KEY, overrides },
    }));
};

// Removes `scope`'s override, reverting it to its built-in default channel.
const clearChannelOverride = async function (guildId, scope) {
    if (!isConfigured()) return;

    const overrides = { ...(await getChannelOverrides(guildId)) };
    delete overrides[scope];
    await getClient().send(new PutCommand({
        TableName: TABLE_NAME,
        Item: { guildId: CHANNEL_OVERRIDE_PREFIX + guildId, userId: CHANNEL_OVERRIDE_SORT_KEY, overrides },
    }));
};

/* Swap the equipped gear and bag in one write. `expectedBag` must match what's
 * stored now, so a stale read can't duplicate or lose an item. Returns false if
 * the bag changed under us.
 */
const setEquipment = async function (guildId, userId, expectedBag, gear, bag) {
    if (!isConfigured()) return false;

    try {
        await getClient().send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId },
            UpdateExpression: 'SET #gear = :gear, #bag = :bag',
            ConditionExpression: '#bag = :expected',
            ExpressionAttributeNames: { '#gear': 'gear', '#bag': 'bag' },
            ExpressionAttributeValues: { ':gear': gear, ':bag': bag, ':expected': expectedBag },
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
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
    setPointsSnapshot,
    getPoints,
    addVoiceSeconds,
    getWeeklyVoiceStats,
    resetWeeklyVoiceSeconds,
    addPairSeconds,
    getWeeklyPairStats,
    resetWeeklyPairSeconds,
    addPuzzlePoints,
    getWeeklyPuzzleStats,
    resetWeeklyPuzzlePoints,
    VOICE_POINTS_PER_HOUR,
    getUsedTriviaQuestions,
    setUsedTriviaQuestions,
    getUsedConnectionsPuzzles,
    setUsedConnectionsPuzzles,
    getUsedWouldYouRather,
    setUsedWouldYouRather,
    getUsedRanking,
    setUsedRanking,
    getUsedWordLadderPuzzles,
    setUsedWordLadderPuzzles,
    getShop,
    openShop,
    takeShopStock,
    returnShopStock,
    restockShopItem,
    clearTitle,
    buyWithPoints,
    getCharacter,
    setEquipment,
    getPose,
    setPose,
    getChannelOverrides,
    setChannelOverride,
    clearChannelOverride,
    recordDuelResult,
    getDuelStats,
    recordDuelHistory,
    getDuelHistory,
    isConfigured,
};
