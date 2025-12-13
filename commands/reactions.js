const reactions = function (prefix, message) {
    const guild = message.guild;
    
    // Get the target user (or default to the command sender)
    let targetUser = message.content.replace(`${prefix}reactions `, "").trim();
    
    // If no user specified, analyze the person who sent the command
    if (!targetUser || targetUser === `${prefix}reactions`) {
        targetUser = message.author.username;
    }
    
    // Handle Discord mention format <@123456789> or <@!123456789>
    const mentionMatch = targetUser.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
        const userId = mentionMatch[1];
        const mentionedMember = guild.members.cache.get(userId);
        if (mentionedMember) {
            targetUser = mentionedMember.user.username;
            console.log(`Converted mention ${mentionMatch[0]} to username: ${targetUser}`);
        }
    }
    
    // Remove @ symbol if user included it
    if (targetUser.startsWith('@')) {
        targetUser = targetUser.substring(1);
    }

    console.log(`Analyzing reactions for user: ${targetUser}`);
    message.reply("🏰 Hark! I shall consult the royal scrolls to divine thy patterns of expression... Pray, grant me but a moment, good sir!");

    // Find the target member
    guild.members.fetch().then(async (members) => {
        const userPairs = members.map((member) => ({
            username: member.user.username,
            nickname: member.displayName,
            userId: member.user.id,
            member: member
        }));

        const matchingUser = userPairs.find((userPair) => {
            return userPair.username.toLowerCase() === targetUser.toLowerCase() || 
                   userPair.nickname.toLowerCase() === targetUser.toLowerCase();
        });

        if (!matchingUser) {
            message.reply(`Forsooth! The name "${targetUser}" doth not appear in mine ledgers, Milord. I cannot divine their expressions of favor.`);
            return;
        }

        const targetUserId = matchingUser.userId;
        const displayName = matchingUser.nickname;
        console.log(`Found user: ${matchingUser.username} (${displayName}) - ID: ${targetUserId}`);

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
                const noReactionsResponses = [
                    `By my troth! ${displayName} doth keep their expressions of favor most private, Milord. Nary a mark of approval have they left upon the scrolls.`,
                    `Verily! ${displayName} appears most reserved in their gestures of acclaim this past moon, good sir.`,
                    `Forsooth! The esteemed ${displayName} hath chosen silence over symbols of approval in these recent days, my lord.`,
                    `'Tis most curious! ${displayName} seems to favor the spoken word over marks of expression, Milord.`
                ];
                const randomResponse = noReactionsResponses[Math.floor(Math.random() * noReactionsResponses.length)];
                message.reply(randomResponse);
                return;
            }

            // Build the royal report
            let report = `🏰 **ROYAL DECREE OF EXPRESSIONS** 🏰\n`;
            report += `*Mine Herald's Chronicle of ${displayName}'s Marks of Favor*\n\n`;
            report += `🎭 **Most Favored Symbols of Approval (This Past Moon):**\n`;

            const rankTitles = [
                "🏆 **Most Cherished Mark:**",
                "⚔️ **Second in Favor:**", 
                "🛡️ **Third Most Beloved:**",
                "👑 **Fourth in Grace:**",
                "✨ **Fifth in Esteem:**"
            ];
            
            sortedEmojis.forEach((emoji, index) => {
                const [emojiName, count] = emoji;
                const rankTitle = rankTitles[index] || "📜 **Also Favored:**";
                const countText = count === 1 ? "once" : count === 2 ? "twice" : count === 3 ? "thrice" : `${count} times`;
                report += `${rankTitle} ${emojiName} - *Bestowed ${countText}*\n`;
            });

            report += `\n⚡ **Total Marks of Favor Granted:** ${totalReactionsGiven}`;
            report += `\n🏰 **Royal Chambers Surveyed:** ${channelsScanned}`;
            report += `\n\n*"Behold! Such are the patterns of expression favored by the noble ${displayName}! May their gestures of approval continue to grace our realm!"* 🎺👑`;

            message.reply(report);

        } catch (error) {
            console.error('Error analyzing reactions:', error);
            message.reply("Alack! The ancient scrolls appear to be in great disarray, Milord! Mine scribes cannot decipher the marks at this time. Pray, try again anon!");
        }

    }).catch((error) => {
        console.error('Error fetching members:', error);
        message.reply("By my troth! The royal registry appears sealed to mine eyes, good sir! I cannot access the records of our noble subjects at this time!");
    });
};

module.exports = reactions;