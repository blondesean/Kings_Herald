/* Passive behavior: continuous voice-chat points.
 *
 * Unlike the weekly recap's message/reaction scales — which are computed by
 * scanning Discord's message history fresh each Sunday, because that history
 * persists — voice channel presence leaves no retroactive record. Discord
 * only reports a member's *current* voice state, not how long they were
 * connected last Tuesday. So voice points can't be reconstructed after the
 * fact; they're earned in real time instead, tracked from voiceStateUpdate
 * events as they happen, independent of the weekly recap's schedule.
 *
 * Rate: pointsStore.VOICE_POINTS_PER_HOUR points for every hour spent
 * connected to a voice channel, per (occupancy - 1) other non-bot members
 * also in that channel at the time — a member alone in a channel earns
 * nothing, a pair earns the base rate, a call of 4 earns 3x the base rate,
 * and so on. This exists to close an exploit: without it, one member could
 * sit alone in voice (or two members could just leave a channel open)
 * farming points with no real social cost, and the per-hour rate doesn't
 * reward "biggest crowd" so much as it makes solo/duo farming worthless
 * while a lively group call keeps earning well. The multiplier is
 * recalculated every time someone joins or leaves a tracked channel, so a
 * session's earned points reflect exactly how crowded the call was for each
 * stretch of it, not just the headcount at the moment it's flushed.
 * Switching channels doesn't reset the clock — only leaving voice entirely
 * does. The guild's configured AFK channel, if any, doesn't count, so
 * parking there muted doesn't farm points. Points post via
 * pointsStore.addVoiceSeconds, which carries fractional hours forward so
 * short sessions still add up.
 *
 * Two more counters ride alongside the same sessions, both keyed off real
 * (unweighted) elapsed time — the occupancy multiplier above only affects
 * points, not these:
 *   - weeklyVoiceSeconds: time since the last weekly recap, reset after it —
 *     see weeklyRecap.js's voice podium (5/3/1 for the week's most hours in
 *     voice), which reads and then clears it via
 *     pointsStore.getWeeklyVoiceStats/resetWeeklyVoiceSeconds.
 *   - weeklyPairSeconds: for every pair of members sharing a tracked channel
 *     at the same time, how long they overlapped this week — see
 *     weeklyRecap.js's "Most Inseparable Companions" display, which reads
 *     and then clears it via pointsStore.getWeeklyPairStats/
 *     resetWeeklyPairSeconds. Display-only; no points attached.
 *
 * Active sessions live only in memory (their start times), so — like the
 * daily trivia timer and the weekly recap's cron — a restart loses whatever
 * time was in progress. Fargate Spot can reclaim the task with as little as
 * a 2-minute warning (see infra/lib/kings-herald-stack.ts), so that's not
 * just a theoretical restart: active sessions are checkpointed every
 * CHECKPOINT_MINUTES, flushing partial credit and restarting the clock from
 * that moment, bounding the loss to one checkpoint interval rather than a
 * whole session. On startup, members already connected to voice are picked
 * up as new sessions starting from that moment (Discord doesn't report how
 * long they'd already been connected, so no credit for time before the bot
 * came online, and no pair credit for time together before then either).
 *
 * Exposes:
 *   trackVoiceStateUpdate(oldState, newState) - wire to the client's
 *     'voiceStateUpdate' event; call for every update, filters internally
 *   startVoiceTracking(client) - backfills already-connected members and
 *     registers the periodic checkpoint timer (call once, on ready)
 */

const { ChannelType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

const CHECKPOINT_MINUTES = 15;

// "guildId:userId" -> { guildId, userId, displayName, channelId, since,
//   pendingReal, pendingWeighted }
// `since` is when this session was last "settled" (see settleChannel) —
// pendingReal/pendingWeighted hold real/occupancy-weighted seconds accrued
// since then that haven't yet been flushed to DynamoDB.
const activeSessions = new Map();
const sessionKey = (guildId, userId) => `${guildId}:${userId}`;

// "guildId:loId:hiId" -> { guildId, userIdA, displayNameA, userIdB,
//   displayNameB, pendingSeconds } — real seconds two members have shared a
// channel, accrued since the last flush to DynamoDB (see flushPair).
const pendingPairs = new Map();
const pairMapKey = (guildId, a, b) => {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    return `${guildId}:${lo}:${hi}`;
};

// A channel "counts" toward voice time if it exists and isn't the guild's
// designated AFK channel.
const isTrackedChannel = (guild, channelId) => {
    if (!channelId) return false;
    if (guild.afkChannelId && channelId === guild.afkChannelId) return false;
    return true;
};

const sessionsInChannel = (guildId, channelId) => {
    const result = [];
    for (const session of activeSessions.values()) {
        if (session.guildId === guildId && session.channelId === channelId) result.push(session);
    }
    return result;
};

// Adds this session's share of an elapsed interval to its pending totals,
// weighting the points-bound half by (occupancy - 1), then resets `since` to
// `at` so the next interval starts fresh.
const settleSession = (session, occupancy, at) => {
    const elapsedMs = Math.max(0, at - session.since);
    session.since = at;
    if (elapsedMs <= 0) return;

    const elapsedSeconds = elapsedMs / 1000;
    const multiplier = Math.max(0, occupancy - 1);
    session.pendingReal += elapsedSeconds;
    session.pendingWeighted += elapsedSeconds * multiplier;
};

const creditPair = (guildId, sessionA, sessionB, seconds) => {
    if (seconds <= 0) return;
    const [first, second] = sessionA.userId < sessionB.userId ? [sessionA, sessionB] : [sessionB, sessionA];
    const key = pairMapKey(guildId, first.userId, second.userId);
    const entry = pendingPairs.get(key) || {
        guildId,
        userIdA: first.userId,
        displayNameA: first.displayName,
        userIdB: second.userId,
        displayNameB: second.displayName,
        pendingSeconds: 0,
    };
    entry.displayNameA = first.displayName;
    entry.displayNameB = second.displayName;
    entry.pendingSeconds += seconds;
    pendingPairs.set(key, entry);
};

// Settles every session currently in guildId:channelId up to `at`, using the
// channel's headcount *before* whatever join/leave/switch triggered this call
// as the occupancy for the interval just elapsed (correct, since that's the
// headcount that actually applied during it) — then credits every pair of
// members who shared the channel during that same interval.
const settleChannel = (guildId, channelId, at) => {
    const sessions = sessionsInChannel(guildId, channelId);
    if (!sessions.length) return;

    const occupancy = sessions.length;
    const elapsedMs = Math.max(0, at - sessions[0].since);

    for (const session of sessions) settleSession(session, occupancy, at);

    if (elapsedMs > 0) {
        const elapsedSeconds = elapsedMs / 1000;
        for (let i = 0; i < sessions.length; i++) {
            for (let j = i + 1; j < sessions.length; j++) {
                creditPair(guildId, sessions[i], sessions[j], elapsedSeconds);
            }
        }
    }
};

const flushSession = (session) => {
    const realSeconds = Math.floor(session.pendingReal);
    const weightedSeconds = Math.floor(session.pendingWeighted);
    if (realSeconds <= 0 && weightedSeconds <= 0) return;

    session.pendingReal -= realSeconds;
    session.pendingWeighted -= weightedSeconds;
    pointsStore.addVoiceSeconds(session.guildId, session.userId, session.displayName, realSeconds, weightedSeconds).catch((error) =>
        console.error(`Voice time: failed to persist for ${session.displayName} (${session.userId}):`, error.message)
    );
};

const flushPair = (key) => {
    const entry = pendingPairs.get(key);
    if (!entry) return;

    const seconds = Math.floor(entry.pendingSeconds);
    if (seconds <= 0) return;

    entry.pendingSeconds -= seconds;
    pointsStore.addPairSeconds(entry.guildId, entry.userIdA, entry.displayNameA, entry.userIdB, entry.displayNameB, seconds).catch((error) =>
        console.error(`Voice time: failed to persist pair time for ${entry.displayNameA} & ${entry.displayNameB}:`, error.message)
    );
};

const flushPairsFor = (guildId, userId) => {
    for (const [key, entry] of pendingPairs) {
        if (entry.guildId === guildId && (entry.userIdA === userId || entry.userIdB === userId)) {
            flushPair(key);
        }
    }
};

const trackVoiceStateUpdate = function (oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild;
    const key = sessionKey(guild.id, member.id);
    const wasTracked = isTrackedChannel(guild, oldState.channelId);
    const nowTracked = isTrackedChannel(guild, newState.channelId);
    const at = Date.now();

    if (!wasTracked && nowTracked) {
        // Entered a tracked channel from outside voice (or from the AFK
        // channel) — settle whoever's already there (their rate is about to
        // change), then start this member's session.
        settleChannel(guild.id, newState.channelId, at);
        activeSessions.set(key, {
            guildId: guild.id,
            userId: member.id,
            displayName: member.displayName,
            channelId: newState.channelId,
            since: at,
            pendingReal: 0,
            pendingWeighted: 0,
        });
        return;
    }

    if (wasTracked && !nowTracked) {
        // Left voice entirely (or landed in the AFK channel) — settle this
        // member and whoever remains (their rate is about to change too),
        // then flush and end this member's session.
        settleChannel(guild.id, oldState.channelId, at);
        const session = activeSessions.get(key);
        activeSessions.delete(key);
        if (session) flushSession(session);
        flushPairsFor(guild.id, member.id);
        return;
    }

    if (wasTracked && nowTracked && oldState.channelId !== newState.channelId) {
        // Switched between two tracked channels — settle the old channel
        // (headcount about to drop) and the new one (about to rise)
        // separately, then move this member's session across. The old-channel
        // settle already resets this session's `since` to `at`.
        settleChannel(guild.id, oldState.channelId, at);
        settleChannel(guild.id, newState.channelId, at);
        const session = activeSessions.get(key);
        if (session) session.channelId = newState.channelId;
        return;
    }

    // Otherwise: same tracked channel (muted/deafened/etc.) or still outside
    // one entirely — nothing to start, stop, or move.
};

// On startup, credit members already connected to a tracked voice channel as
// sessions starting now — there's no way to know how long they'd already
// been there (or together), so no retroactive real/weighted/pair credit.
const backfillActiveSessions = (client) => {
    const now = Date.now();
    for (const guild of client.guilds.cache.values()) {
        for (const channel of guild.channels.cache.values()) {
            if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) continue;
            if (!isTrackedChannel(guild, channel.id)) continue;

            for (const member of channel.members.values()) {
                if (member.user.bot) continue;
                const key = sessionKey(guild.id, member.id);
                if (!activeSessions.has(key)) {
                    activeSessions.set(key, {
                        guildId: guild.id,
                        userId: member.id,
                        displayName: member.displayName,
                        channelId: channel.id,
                        since: now,
                        pendingReal: 0,
                        pendingWeighted: 0,
                    });
                }
            }
        }
    }
};

const startVoiceTracking = function (client) {
    backfillActiveSessions(client);

    setInterval(() => {
        const at = Date.now();

        const settledChannels = new Set();
        for (const session of activeSessions.values()) {
            const ck = `${session.guildId}:${session.channelId}`;
            if (settledChannels.has(ck)) continue;
            settledChannels.add(ck);
            settleChannel(session.guildId, session.channelId, at);
        }

        for (const session of activeSessions.values()) flushSession(session);
        for (const key of [...pendingPairs.keys()]) flushPair(key);
    }, CHECKPOINT_MINUTES * 60 * 1000);

    console.log(`Voice time: tracking started, checkpointing every ${CHECKPOINT_MINUTES} minutes (${pointsStore.VOICE_POINTS_PER_HOUR} point(s)/hour per other member in the call).`);
};

module.exports = { trackVoiceStateUpdate, startVoiceTracking };
