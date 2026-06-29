/* Passive behavior: the Herald's weekly recap.
 *
 * Every Sunday at noon Eastern the Herald posts in #general celebrating the
 * three most-reacted messages of the past week. It links each post, pings its
 * author, and awards points toward a running leaderboard (5 for first, 3 for
 * second, 1 for third). Points persist in DynamoDB via ../../src/pointsStore.
 *
 * Exposes:
 *   scheduleWeeklyRecap(client) - registers the cron job (call once, on ready)
 *   runWeeklyRecap(client, opts) - runs one recap; reused by the !recap preview
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

// Sunday at 12:00, interpreted in Eastern local time (DST-aware) so it stays at
// local noon year-round.
const CRON_EXPRESSION = '0 12 * * 0';
const TIMEZONE = 'America/New_York';

const WINDOW_DAYS = 7;
const MAX_MESSAGES_PER_CHANNEL = 500;
const LEADERBOARD_SIZE = 10;

// Points awarded to the authors of the 1st / 2nd / 3rd most-reacted posts.
const POINTS_BY_RANK = [5, 3, 1];
const RANK_WORDS = ['First', 'Second', 'Third'];

const EMBED_COLOR = 0xd4af37; // heraldic gold

// ---- helpers ---------------------------------------------------------------

// A text channel literally named "general" that the bot can read and post in.
const findGeneralChannel = (guild) => {
    return guild.channels.cache.find((channel) => {
        if (channel.type !== 0 || channel.name.toLowerCase() !== 'general') {
            return false;
        }
        const perms = channel.permissionsFor(guild.members.me);
        return perms && perms.has('ViewChannel') && perms.has('SendMessages');
    });
};

// Scan the guild's readable text channels and return the top posts (by total
// reaction count) created on or after `sinceDate`. Mirrors the batch-fetch
// pattern used by commands/activity.js and commands/reactions.js.
const collectTopPosts = async (guild, sinceDate) => {
    const channels = guild.channels.cache.filter((channel) =>
        channel.type === 0 &&
        channel.permissionsFor(guild.members.me)?.has('ViewChannel') &&
        channel.permissionsFor(guild.members.me)?.has('ReadMessageHistory')
    );

    const candidates = [];

    for (const [, channel] of channels) {
        try {
            let lastMessageId = null;
            let messagesScanned = 0;

            while (messagesScanned < MAX_MESSAGES_PER_CHANNEL) {
                const fetchOptions = { limit: 100 };
                if (lastMessageId) {
                    fetchOptions.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(fetchOptions);
                if (messages.size === 0) break;

                let reachedWindowEdge = false;

                for (const [messageId, msg] of messages) {
                    if (msg.createdAt < sinceDate) {
                        reachedWindowEdge = true;
                        break;
                    }

                    if (!msg.author.bot && msg.reactions.cache.size > 0) {
                        const totalReactions = msg.reactions.cache.reduce((sum, r) => sum + r.count, 0);
                        if (totalReactions > 0) {
                            candidates.push({ message: msg, channel, totalReactions });
                        }
                    }

                    lastMessageId = messageId;
                    messagesScanned++;
                }

                if (reachedWindowEdge) break;
            }
        } catch (channelError) {
            console.error(`Weekly recap: error scanning #${channel.name}:`, channelError.message);
        }
    }

    candidates.sort((a, b) => {
        if (b.totalReactions !== a.totalReactions) {
            return b.totalReactions - a.totalReactions;
        }
        return a.message.createdTimestamp - b.message.createdTimestamp;
    });

    return candidates.slice(0, POINTS_BY_RANK.length);
};

const displayNameOf = (message) => message.member?.displayName || message.author.username;

// Map the ranked posts to point awards. The same author can appear twice (e.g.
// they hold both first and second place); pointsStore adds atomically so the
// totals stack correctly.
const buildAwards = (topPosts) =>
    topPosts.map((post, index) => ({
        userId: post.message.author.id,
        displayName: displayNameOf(post.message),
        points: POINTS_BY_RANK[index],
    }));

const joinMentions = (ids) => {
    const mentions = ids.map((id) => `<@${id}>`);
    if (mentions.length === 0) return '';
    if (mentions.length === 1) return mentions[0];
    if (mentions.length === 2) return `${mentions[0]} and ${mentions[1]}`;
    return `${mentions.slice(0, -1).join(', ')}, and ${mentions[mentions.length - 1]}`;
};

// A short, link-safe snippet of a post's content for the masked link text.
const snippetOf = (message) => {
    const raw = (message.content || '').replace(/\s+/g, ' ').replace(/[[\]]/g, '').trim();
    if (!raw) {
        return message.attachments?.size ? 'a wordless offering of images' : 'a wordless proclamation';
    }
    return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
};

const buildRecapPost = (topPosts, leaderboard) => {
    const winnerIds = [...new Set(topPosts.map((post) => post.message.author.id))];

    const content = winnerIds.length
        ? `Hear ye, hear ye! Let the realm give praise unto ${joinMentions(winnerIds)}, whose words have most stirred the court this past sennight!`
        : 'Hear ye! The Herald brings tidings of the past sennight.';

    const postsText = topPosts.length
        ? topPosts
              .map((post, index) => {
                  const rank = RANK_WORDS[index] || `Rank ${index + 1}`;
                  const marks = post.totalReactions === 1 ? 'mark of favor' : 'marks of favor';
                  return `**${rank}:** [${snippetOf(post.message)}](${post.message.url}) — <@${post.message.author.id}> (${post.totalReactions} ${marks})`;
              })
              .join('\n')
        : 'No proclamation earned the people\'s favor this past sennight.';

    const boardText = leaderboard.length
        ? leaderboard
              .map((entry, index) => {
                  const points = entry.points === 1 ? 'point' : 'points';
                  return `${index + 1}. ${entry.displayName} — ${entry.points} ${points}`;
              })
              .join('\n')
        : 'The royal ledger is yet unwritten.';

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The King's Weekly Herald")
        .setDescription('A chronicle of the realm\'s most celebrated words this past sennight, and the standings of honor.')
        .addFields(
            { name: 'Most Celebrated Proclamations', value: postsText },
            { name: 'Running Tally of Honor', value: boardText }
        )
        .setFooter({ text: 'Points: 5 for first, 3 for second, 1 for third. Awarded each Sunday.' })
        .setTimestamp();

    return {
        content,
        embeds: [embed],
        allowedMentions: { users: winnerIds },
    };
};

// ---- entry points ----------------------------------------------------------

/* Run one recap.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's #general)
 *   persist       - whether to write points to DynamoDB (default: false)
 */
const runWeeklyRecap = async function (client, options = {}) {
    const { guild, targetChannel, persist = false } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const sinceDate = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    for (const g of guilds) {
        try {
            const channel = targetChannel || findGeneralChannel(g);
            if (!channel) {
                console.log(`Weekly recap: no #general channel found in "${g.name}"; skipping.`);
                continue;
            }

            const topPosts = await collectTopPosts(g, sinceDate);

            if (persist && topPosts.length) {
                try {
                    await pointsStore.addPoints(g.id, buildAwards(topPosts));
                } catch (storeError) {
                    console.error('Weekly recap: failed to persist points:', storeError.message);
                }
            }

            let leaderboard = [];
            try {
                leaderboard = await pointsStore.getLeaderboard(g.id, LEADERBOARD_SIZE);
            } catch (storeError) {
                console.error('Weekly recap: failed to load leaderboard:', storeError.message);
            }

            await channel.send(buildRecapPost(topPosts, leaderboard));
            console.log(`Weekly recap posted to #${channel.name} in "${g.name}" (${topPosts.length} honored, persist=${persist}).`);
        } catch (guildError) {
            console.error(`Weekly recap failed for guild "${g.name}":`, guildError);
        }
    }
};

/* Register the weekly cron job. Call once after the client is ready. */
const scheduleWeeklyRecap = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Weekly recap: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            console.log('Running scheduled weekly recap...');
            runWeeklyRecap(client, { persist: true }).catch((error) =>
                console.error('Scheduled weekly recap failed:', error)
            );
        },
        { timezone: TIMEZONE }
    );

    console.log(`Weekly recap scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}) — Sundays at noon Eastern.`);
};

module.exports = { scheduleWeeklyRecap, runWeeklyRecap };
