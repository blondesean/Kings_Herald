const activity = function (prefix, message) {
    const channel = message.channel;
    const guild = message.guild;

    console.log(`Analyzing activity for channel: ${channel.name}`);
    message.reply("🏰 Hark! I shall consult the royal ledgers to determine the most active nobles in this chamber... This may take a moment, good sir!");

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`Analyzing activity from ${thirtyDaysAgo.toISOString()} to now in ${channel.name}`);

    // Activity tracking objects
    const userStats = new Map(); // userId -> { posts, replies, reactionsGiven, reactionsReceived, displayName }

    const initializeUser = (userId, displayName) => {
        if (!userStats.has(userId)) {
            userStats.set(userId, {
                posts: 0,
                replies: 0,
                reactionsGiven: 0,
                reactionsReceived: 0,
                displayName: displayName
            });
        }
    };

    const analyzeChannel = async () => {
        try {
            let lastMessageId = null;
            let messagesAnalyzed = 0;
            const maxMessages = 2000; // Limit to prevent timeout

            console.log(`Starting analysis of ${channel.name}...`);

            while (messagesAnalyzed < maxMessages) {
                const fetchOptions = { limit: 100 };
                if (lastMessageId) {
                    fetchOptions.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(fetchOptions);
                if (messages.size === 0) break;

                let foundOldMessage = false;

                for (const [messageId, msg] of messages) {
                    // Stop if message is older than 30 days
                    if (msg.createdAt < thirtyDaysAgo) {
                        foundOldMessage = true;
                        break;
                    }

                    // Skip bot messages
                    if (msg.author.bot) continue;

                    const userId = msg.author.id;
                    const displayName = msg.member?.displayName || msg.author.username;
                    
                    initializeUser(userId, displayName);
                    const userStat = userStats.get(userId);

                    // Count posts vs replies
                    if (msg.reference && msg.reference.messageId) {
                        // This is a reply
                        userStat.replies++;
                    } else {
                        // This is a regular post
                        userStat.posts++;
                    }

                    // Count reactions received on this message
                    if (msg.reactions.cache.size > 0) {
                        for (const [emojiId, reaction] of msg.reactions.cache) {
                            userStat.reactionsReceived += reaction.count;
                            
                            // Count reactions given by each user
                            try {
                                const users = await reaction.users.fetch();
                                for (const [reactorId, reactor] of users) {
                                    if (!reactor.bot) {
                                        const reactorDisplayName = guild.members.cache.get(reactorId)?.displayName || reactor.username;
                                        initializeUser(reactorId, reactorDisplayName);
                                        userStats.get(reactorId).reactionsGiven++;
                                    }
                                }
                            } catch (reactionError) {
                                console.log('Error fetching reaction users:', reactionError.message);
                            }
                        }
                    }

                    lastMessageId = messageId;
                    messagesAnalyzed++;
                }

                if (foundOldMessage) break;
            }

            console.log(`Analysis complete. Analyzed ${messagesAnalyzed} messages, found ${userStats.size} active users`);

            // Generate the royal activity report
            generateActivityReport();

        } catch (error) {
            console.error('Error analyzing channel activity:', error);
            message.reply("Alack! The royal scribes have encountered difficulties reading the ancient scrolls. Pray try again later, Milord!");
        }
    };

    const generateActivityReport = () => {
        if (userStats.size === 0) {
            message.reply("Forsooth! This chamber appears to have been most quiet these past thirty days, good sir. Nary a soul has stirred!");
            return;
        }

        // Sort users by different categories
        const userArray = Array.from(userStats.entries()).map(([userId, stats]) => ({
            userId,
            ...stats,
            totalActivity: stats.posts + stats.replies
        }));

        const topPosters = [...userArray].sort((a, b) => b.posts - a.posts).slice(0, 3);
        const topRepliers = [...userArray].sort((a, b) => b.replies - a.replies).slice(0, 3);
        const topReactors = [...userArray].sort((a, b) => b.reactionsGiven - a.reactionsGiven).slice(0, 3);
        const topReacted = [...userArray].sort((a, b) => b.reactionsReceived - a.reactionsReceived).slice(0, 3);

        // Build the royal report
        let report = `🏰 **ROYAL ACTIVITY CHRONICLE** 🏰\n`;
        report += `*Herald's Report on the Noble Activities of #${channel.name}*\n`;
        report += `*Past Thirty Days of Court Proceedings*\n\n`;

        // Most Posts
        report += `📜 **CHAMPIONS OF DISCOURSE** 📜\n`;
        report += `*Those who have graced us with the most proclamations:*\n`;
        topPosters.forEach((user, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[index] || "🏅";
            const postText = user.posts === 1 ? "proclamation" : "proclamations";
            report += `${medal} **${user.displayName}** - ${user.posts} ${postText}\n`;
        });

        report += `\n⚔️ **MASTERS OF RESPONSE** ⚔️\n`;
        report += `*Those most skilled in the art of discourse:*\n`;
        topRepliers.forEach((user, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[index] || "🏅";
            const replyText = user.replies === 1 ? "response" : "responses";
            report += `${medal} **${user.displayName}** - ${user.replies} ${replyText}\n`;
        });

        report += `\n🎭 **GENEROUS SOULS OF APPROVAL** 🎭\n`;
        report += `*Those most liberal with their marks of favor:*\n`;
        topReactors.forEach((user, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[index] || "🏅";
            const reactionText = user.reactionsGiven === 1 ? "mark of favor" : "marks of favor";
            report += `${medal} **${user.displayName}** - ${user.reactionsGiven} ${reactionText} bestowed\n`;
        });

        report += `\n👑 **BELOVED OF THE COURT** 👑\n`;
        report += `*Those whose words have earned the most acclaim:*\n`;
        topReacted.forEach((user, index) => {
            const medals = ["🥇", "🥈", "🥉"];
            const medal = medals[index] || "🏅";
            const reactionText = user.reactionsReceived === 1 ? "mark of approval" : "marks of approval";
            report += `${medal} **${user.displayName}** - ${user.reactionsReceived} ${reactionText} received\n`;
        });

        const totalMessages = userArray.reduce((sum, user) => sum + user.totalActivity, 0);
        const totalReactions = userArray.reduce((sum, user) => sum + user.reactionsGiven, 0);

        report += `\n📊 **ROYAL STATISTICS** 📊\n`;
        report += `⚡ Total Messages: ${totalMessages}\n`;
        report += `🎭 Total Reactions: ${totalReactions}\n`;
        report += `👥 Active Nobles: ${userStats.size}\n`;
        report += `🏰 Chamber: #${channel.name}\n\n`;
        report += `*"Such are the chronicles of activity in our noble court! May these statistics bring great joy to all who dwell herein!"* 🎺📜`;

        message.reply(report);
    };

    // Start the analysis
    analyzeChannel();
};

module.exports = activity;