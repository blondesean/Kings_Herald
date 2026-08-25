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
 * Rate: pointsStore.VOICE_POINTS_PER_HOUR points for every hour a (non-bot)
 * member spends connected to a voice channel in a guild. Switching channels
 * doesn't reset the clock — only leaving voice entirely does. The guild's
 * configured AFK channel, if any, doesn't count, so parking there muted
 * doesn't farm points. Points post immediately via pointsStore.addVoiceSeconds,
 * which carries fractional hours forward so short sessions still add up.
 *
 * A second, independent counter (weeklyVoiceSeconds) tracks the same time
 * since the last weekly recap and resets after it — see weeklyRecap.js's
 * voice podium (5/3/1 for the week's most hours in voice), which reads and
 * then clears it via pointsStore.getWeeklyVoiceStats/resetWeeklyVoiceSeconds.
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
 * came online).
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

// "guildId:userId" -> { since, guildId, userId, displayName }
const activeSessions = new Map();
const sessionKey = (guildId, userId) => `${guildId}:${userId}`;

// A channel "counts" toward voice time if it exists and isn't the guild's
// designated AFK channel.
const isTrackedChannel = (guild, channelId) => {
    if (!channelId) return false;
    if (guild.afkChannelId && channelId === guild.afkChannelId) return false;
    return true;
};

const flushSession = (guildId, userId, displayName, since) => {
    const seconds = Math.floor((Date.now() - since) / 1000);
    if (seconds <= 0) return;
    pointsStore.addVoiceSeconds(guildId, userId, displayName, seconds).catch((error) =>
        console.error(`Voice time: failed to persist for ${displayName} (${userId}):`, error.message)
    );
};

const trackVoiceStateUpdate = function (oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild;
    const key = sessionKey(guild.id, member.id);
    const wasTracked = isTrackedChannel(guild, oldState.channelId);
    const nowTracked = isTrackedChannel(guild, newState.channelId);

    if (!wasTracked && nowTracked) {
        // Entered a tracked channel from outside voice (or from the AFK
        // channel) — start the clock.
        activeSessions.set(key, { since: Date.now(), guildId: guild.id, userId: member.id, displayName: member.displayName });
        return;
    }

    if (wasTracked && !nowTracked) {
        // Left voice entirely (or landed in the AFK channel) — stop the
        // clock and pay out whatever time was pending.
        const session = activeSessions.get(key);
        activeSessions.delete(key);
        if (session) flushSession(guild.id, member.id, member.displayName, session.since);
        return;
    }

    // Otherwise: still in a tracked channel (switched channels, muted,
    // deafened, etc.) or still outside one — nothing to start or stop.
};

// On startup, credit members already connected to a tracked voice channel as
// sessions starting now — there's no way to know how long they'd already
// been there.
const backfillActiveSessions = (client) => {
    for (const guild of client.guilds.cache.values()) {
        for (const channel of guild.channels.cache.values()) {
            if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) continue;
            if (!isTrackedChannel(guild, channel.id)) continue;

            for (const member of channel.members.values()) {
                if (member.user.bot) continue;
                const key = sessionKey(guild.id, member.id);
                if (!activeSessions.has(key)) {
                    activeSessions.set(key, { since: Date.now(), guildId: guild.id, userId: member.id, displayName: member.displayName });
                }
            }
        }
    }
};

const startVoiceTracking = function (client) {
    backfillActiveSessions(client);

    setInterval(() => {
        const now = Date.now();
        for (const [key, session] of activeSessions) {
            flushSession(session.guildId, session.userId, session.displayName, session.since);
            activeSessions.set(key, { ...session, since: now });
        }
    }, CHECKPOINT_MINUTES * 60 * 1000);

    console.log(`Voice time: tracking started, checkpointing every ${CHECKPOINT_MINUTES} minutes (${pointsStore.VOICE_POINTS_PER_HOUR} points/hour).`);
};

module.exports = { trackVoiceStateUpdate, startVoiceTracking };
