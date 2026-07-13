/* /reactions [member] - chronicle a member's most-used reaction emojis.
 *
 * The target arrives as a typed slash-command option (defaulting to whoever
 * ran the command), so there is no name parsing here. The Herald scans the
 * past month of messages across readable channels and reports the member's
 * top five reaction emojis.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const flavor = require('../../flavor_text');

const reactions = async function (interaction) {
    const guild = interaction.guild;

    // Optional option; default to the member who ran the command.
    const targetMember = interaction.options.getMember('member') || interaction.member;
    const targetUserId = targetMember.id;
    const displayName = targetMember.displayName;

    console.log(`Analyzing reactions for user: ${displayName} (${targetUserId})`);
    await interaction.editReply("Hark! I shall consult the royal scrolls to divine thy patterns of expression... Pray, grant me but a moment, good sir!");

    // Calculate date one month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    console.log(`Searching messages from ${oneMonthAgo.toISOString()} to now`);

    try {
        // Get all text channels in the guild
        const channels = guild.channels.cache.filter(channel =>
            channel.type === 0 && // Text channel
            channel.permissionsFor(guild.members.me).has('ViewChannel') &&
            channel.permissionsFor(guild.members.me).has('ReadMessageHistory')
        );

        console.log(`Scanning ${channels.size} channels for reactions...`);

        const emojiCounts = new Map();
        let totalReactionsGiven = 0;
        let channelsScanned = 0;

        // Scan each channel for messages with reactions
        for (const [channelId, channel] of channels) {
            try {
                console.log(`Scanning channel: ${channel.name}`);

                let lastMessageId = null;
                let messagesScanned = 0;
                const maxMessagesPerChannel = 500; // Limit to prevent timeout

                while (messagesScanned < maxMessagesPerChannel) {
                    const fetchOptions = { limit: 100 };
                    if (lastMessageId) {
                        fetchOptions.before = lastMessageId;
                    }

                    const messages = await channel.messages.fetch(fetchOptions);
                    if (messages.size === 0) break;

                    let foundOldMessage = false;

                    for (const [messageId, msg] of messages) {
                        // Stop if message is older than one month
                        if (msg.createdAt < oneMonthAgo) {
                            foundOldMessage = true;
                            break;
                        }

                        // Check if this message has reactions from our target user
                        if (msg.reactions.cache.size > 0) {
                            for (const [emojiId, reaction] of msg.reactions.cache) {
                                // Check if our target user reacted with this emoji
                                const users = await reaction.users.fetch();
                                if (users.has(targetUserId)) {
                                    const emojiName = reaction.emoji.name;
                                    emojiCounts.set(emojiName, (emojiCounts.get(emojiName) || 0) + 1);
                                    totalReactionsGiven++;
                                }
                            }
                        }

                        lastMessageId = messageId;
                        messagesScanned++;
                    }

                    if (foundOldMessage) break;
                }

                channelsScanned++;
                console.log(`Scanned ${messagesScanned} messages in ${channel.name}`);

            } catch (channelError) {
                console.error(`Error scanning channel ${channel.name}:`, channelError);
            }
        }

        console.log(`Analysis complete. Found ${totalReactionsGiven} total reactions from ${displayName}`);

        // Sort emojis by usage count and get top 5
        const sortedEmojis = Array.from(emojiCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Create the herald's response
        if (sortedEmojis.length === 0) {
            const noReactionsResponses = flavor.noReactionsResponses(displayName);
            const randomResponse = noReactionsResponses[Math.floor(Math.random() * noReactionsResponses.length)];
            await interaction.followUp(randomResponse);
            return;
        }

        // Build the royal report
        let report = `**ROYAL DECREE OF EXPRESSIONS**\n`;
        report += `*Mine Herald's Chronicle of ${displayName}'s Marks of Favor*\n\n`;
        report += `**Most Favored Symbols of Approval (This Past Moon):**\n`;

        const rankTitles = flavor.rankTitles();

        sortedEmojis.forEach((emoji, index) => {
            const [emojiName, count] = emoji;
            const rankTitle = rankTitles[index] || "**Also Favored:**";
            const countText = count === 1 ? "once" : count === 2 ? "twice" : count === 3 ? "thrice" : `${count} times`;
            report += `${rankTitle} ${emojiName} - *Bestowed ${countText}*\n`;
        });

        report += `\n**Total Marks of Favor Granted:** ${totalReactionsGiven}`;
        report += `\n**Royal Chambers Surveyed:** ${channelsScanned}`;
        report += `\n\n*"Behold! Such are the patterns of expression favored by the noble ${displayName}! May their gestures of approval continue to grace our realm!"*`;

        await interaction.followUp(report);

    } catch (error) {
        console.error('Error analyzing reactions:', error);
        await interaction.followUp("Alack! The ancient scrolls appear to be in great disarray, Milord! Mine scribes cannot decipher the marks at this time. Pray, try again anon!");
    }
};

module.exports = {
    description: "Chronicle one's favorite marks of expression",
    category: 'ROYAL CHRONICLES',
    options: [
        {
            name: 'member',
            description: 'Whose expressions to chronicle (defaults to thyself)',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: reactions,
};
