/* Shared helper: where should the Herald post an unprompted announcement
 * (weekly recap, daily trivia, ...) in a given guild? In order of preference:
 *   1. a text channel literally named "general",
 *   2. the guild's system channel (where Discord posts join messages),
 *   3. the topmost text channel the bot can post in.
 * Returns null only if the bot can't post anywhere in the guild.
 */
const findAnnounceChannel = (guild) => {
    const canPost = (channel) => {
        if (!channel || channel.type !== 0) return false;
        const perms = channel.permissionsFor(guild.members.me);
        return Boolean(perms && perms.has('ViewChannel') && perms.has('SendMessages'));
    };

    const general = guild.channels.cache.find(
        (channel) => channel.type === 0 && channel.name.toLowerCase() === 'general' && canPost(channel)
    );
    if (general) return general;

    if (canPost(guild.systemChannel)) return guild.systemChannel;

    let topmost = null;
    for (const channel of guild.channels.cache.values()) {
        if (!canPost(channel)) continue;
        if (!topmost || channel.rawPosition < topmost.rawPosition) topmost = channel;
    }
    return topmost;
};

module.exports = { findAnnounceChannel };
