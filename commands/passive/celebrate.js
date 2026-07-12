/* Passive behavior: the Herald celebrates popular messages.
 * When a non-bot message reaches the reaction threshold, the Herald replies
 * with a proclamation and pins it. Wired into the client's messageReactionAdd
 * event in src/index.js.
 */

const flavor = require('../../flavor_text');

// Number of total reactions a message needs before the Herald celebrates it.
const REACTION_THRESHOLD = 25;

// Track messages that have already been celebrated to avoid spam.
const celebratedMessages = new Set();

const celebrate = async function (reaction, user) {
    // Handle partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    const message = reaction.message;

    // Don't celebrate bot messages or messages we've already celebrated
    if (message.author.bot || celebratedMessages.has(message.id)) {
        return;
    }

    // Count total reactions on the message
    const totalReactions = message.reactions.cache.reduce((total, r) => total + r.count, 0);

    console.log(`Message "${message.content?.substring(0, 25)}..." now has ${totalReactions} total reactions`);

    // Celebrate when message hits the threshold
    if (totalReactions >= REACTION_THRESHOLD) {
        celebratedMessages.add(message.id);

        const adjectives = flavor.celebrationAdjectives();
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const authorName = message.member?.displayName || message.author.username;

        const templates = flavor.celebrationTemplates(randomAdjective, authorName);
        const celebrationMessage = templates[Math.floor(Math.random() * templates.length)];

        try {
            // Reply to the popular message
            await message.reply(celebrationMessage);

            // Try to pin the message (requires manage messages permission)
            await message.pin();
            console.log(`Celebrated and pinned popular message from ${authorName} with ${totalReactions} reactions`);

        } catch (error) {
            console.error('Error celebrating message:', error);
            // If pinning fails, still send the celebration
            try {
                await message.reply(celebrationMessage);
                console.log(`Celebrated popular message from ${authorName} (pinning failed)`);
            } catch (replyError) {
                console.error('Error sending celebration message:', replyError);
            }
        }
    }
};

module.exports = celebrate;
