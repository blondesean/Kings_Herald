/* Passive behavior: the Herald celebrates popular messages.
 * When a non-bot message reaches the reaction threshold, the Herald replies
 * with a proclamation and pins it. Wired into the client's messageReactionAdd
 * event in src/index.js.
 */

// Number of total reactions a message needs before the Herald celebrates it.
const REACTION_THRESHOLD = 50;

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

    console.log(`Message "${message.content?.substring(0, 50)}..." now has ${totalReactions} total reactions`);

    // Celebrate when message hits the threshold
    if (totalReactions >= REACTION_THRESHOLD) {
        celebratedMessages.add(message.id);

        // Royal adjectives for celebrating popular posts
        const celebrationAdjectives = [
            "clever", "insightful", "intriguing", "witty", "profound", "brilliant",
            "astute", "wise", "eloquent", "thoughtful", "remarkable", "splendid",
            "marvelous", "excellent", "superb", "magnificent", "delightful", "charming"
        ];

        const randomAdjective = celebrationAdjectives[Math.floor(Math.random() * celebrationAdjectives.length)];
        const authorName = message.member?.displayName || message.author.username;

        // Multiple celebration message templates for variety
        const celebrationTemplates = [
            `Very ${randomAdjective}, Milord! Your patrons adore this comment and I tell tale of your wisdom!`,
            `Hark! Most ${randomAdjective} words, ${authorName}! The realm celebrates your eloquence!`,
            `By my troth! Such ${randomAdjective} discourse has won the hearts of many! Well spoken, good sir!`,
            `Behold! The ${randomAdjective} wisdom of ${authorName} has stirred the masses! Truly remarkable!`,
            `Magnificent! Your ${randomAdjective} words have earned great favor, Milord! The court is impressed!`,
            `Splendid! Most ${randomAdjective} indeed! Your wit has captured the admiration of all!`,
            `Verily! Such ${randomAdjective} insight deserves recognition! The people have spoken!`,
            `Forsooth! Your ${randomAdjective} commentary has won acclaim throughout the realm!`
        ];

        const celebrationMessage = celebrationTemplates[Math.floor(Math.random() * celebrationTemplates.length)];

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
