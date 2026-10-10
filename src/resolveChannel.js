/* Shared: which channel a passive behavior should post its scheduled output
 * in, honoring an admin's /herald_channel override before falling back to
 * that behavior's built-in default (usually findAnnounceChannel).
 *
 * Only applies to the real scheduled run. A preview command always passes
 * its own targetChannel (the channel it was run in), which every passive
 * module already checks first — `targetChannel || resolveChannel(...)` — so
 * previews are never affected by an override; only a true scheduled post is.
 *
 * SCOPES lists every overridable behavior, with the label /herald_channel's
 * command choices and /herald_channel_list show. 'all' is a catch-all
 * default a guild can set once instead of (or underneath) per-scope ones.
 */
const SCOPES = {
    trivia: 'Daily trivia (and would-you-rather / ranking)',
    puzzle: 'Daily puzzle (Connections / Word Ladder)',
    shop: 'Daily shop',
    encounter: 'Daily boss encounter',
    recap: 'Weekly recap',
    wow_trivia: 'WoW Trivia Wednesdays',
    birthdays: 'Birthday blessing',
    treat: 'Halloween treat',
    all: 'Everything above with no more specific override',
};

// The channel for `scope` in `guild`: the admin's override if one is set and
// still valid, otherwise whatever `fallback(guild)` returns (sync or async).
const resolveChannel = async (guild, scope, fallback) => {
    const pointsStore = require('./pointsStore'); // required here to dodge a require cycle with passive modules
    let overrides = {};
    try {
        overrides = await pointsStore.getChannelOverrides(guild.id);
    } catch (error) {
        console.error(`resolveChannel: failed to read channel overrides for guild ${guild.id}:`, error.message);
    }

    const channelId = overrides[scope] || overrides.all;
    if (channelId) {
        const channel = guild.channels.cache.get(channelId);
        const perms = channel && channel.permissionsFor(guild.members.me);
        if (channel && channel.type === 0 && perms && perms.has('ViewChannel') && perms.has('SendMessages')) {
            return channel;
        }
        console.error(`resolveChannel: the "${scope}" override in guild ${guild.id} points to channel ${channelId}, which doesn't exist or isn't postable; falling back to the default.`);
    }

    return fallback(guild);
};

module.exports = { resolveChannel, SCOPES };
