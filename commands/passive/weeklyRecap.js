/* Passive behavior: the Herald's weekly recap.
 *
 * Every Sunday at noon Eastern the Herald posts in #general (or the best
 * fallback channel — see findRecapChannel) celebrating the
 * three most-reacted messages of the past week. It links each post, pings its
 * author, and awards points toward a running leaderboard on four independent
 * scales: podium points (5/3/1 for the top posts), reaction points (1 per
 * REACTIONS_PER_POINT total reactions received across the week), chatter
 * points (5/3/1 for the most messages sent), and a voice podium (5/3/1 for
 * the most time spent in voice channels that week — see VOICE_POINTS_BY_RANK
 * and ../../src/pointsStore's weeklyVoiceSeconds). The voice podium is a
 * bonus on top of the continuous per-hour voice points members already
 * earned in real time (commands/passive/voiceTime.js) — that part can't wait
 * for the recap since Discord keeps no historical voice-presence record to
 * scan later, unlike messages and reactions. Podium ties share their rank
 * and consume the ranks below (competition ranking: two seconds means no
 * third), so a podium can hold more than three members. Points persist in
 * DynamoDB via ../../src/pointsStore.
 *
 * Exposes:
 *   scheduleWeeklyRecap(client) - registers the cron job (call once, on ready)
 *   runWeeklyRecap(client, opts) - runs one recap; reused by the !recap preview
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');

// Sunday at 12:00, interpreted in Eastern local time (DST-aware) so it stays at
// local noon year-round.
const CRON_EXPRESSION = '0 12 * * 0';
const TIMEZONE = 'America/New_York';

const WINDOW_DAYS = 7;
const LEADERBOARD_SIZE = 10;

// Points awarded to the authors of the 1st / 2nd / 3rd most-reacted posts.
const POINTS_BY_RANK = [5, 3, 1];
const RANK_WORDS = ['First', 'Second', 'Third'];

// Second, independent points scale: 1 point per this many total reactions
// received on a member's posts during the week (floored, remainder discarded).
// Stacks with the podium points above; both feed the same leaderboard.
const REACTIONS_PER_POINT = 10;

// Third, independent points scale: podium points for the members who sent the
// most messages during the week. Same shape as the reactions podium.
const MESSAGE_POINTS_BY_RANK = [5, 3, 1];

// Fourth, independent points scale: podium points for the members who spent
// the most time in voice channels during the week (weeklyVoiceSeconds,
// tallied continuously by commands/passive/voiceTime.js and reset here after
// each recap — see pointsStore.getWeeklyVoiceStats/resetWeeklyVoiceSeconds).
const VOICE_POINTS_BY_RANK = [5, 3, 1];

// How many members the display-only "most marks of favor received" section
// shows. Reaction points themselves are awarded to everyone (see
// REACTIONS_PER_POINT); this section just surfaces the biggest earners.
const TOP_REACTED_SIZE = 3;

const EMBED_COLOR = 0xd4af37; // heraldic gold

// ---- helpers ---------------------------------------------------------------

// Competition ranking ("1224"): entries must already be sorted best-first;
// every entry tied on `scoreOf` shares the rank of the first of them, and the
// tied group consumes the ranks below it (two seconds means no third). Returns
// copies of the entries with a 1-based `rank` added, keeping every entry whose
// rank lands within `maxRank` — so a tie straddling the cutoff is kept whole
// and the result can hold more than `maxRank` entries. Exported for the tests.
const rankWithTies = (sortedEntries, scoreOf, maxRank) => {
    const ranked = [];
    let index = 0;
    while (index < sortedEntries.length) {
        const rank = index + 1;
        if (rank > maxRank) break;
        const score = scoreOf(sortedEntries[index]);
        let end = index;
        while (end < sortedEntries.length && scoreOf(sortedEntries[end]) === score) {
            ranked.push({ ...sortedEntries[end], rank });
            end++;
        }
        index = end;
    }
    return ranked;
};

// Channel selection now lives in src/findAnnounceChannel.js, shared with the
// daily trivia behavior. Kept as a local alias since it's exported below for
// callers that imported it from this module.
const findRecapChannel = findAnnounceChannel;

// Scan the guild's readable text channels for messages created on or after
// `sinceDate` and return the top posts (by total reaction count), each author's
// total reactions received, and each author's message count across the window.
// Mirrors the batch-fetch pattern used by commands/prompts/reactions.js.
const collectWeeklyStats = async (guild, sinceDate) => {
    const channels = guild.channels.cache.filter((channel) =>
        channel.type === 0 &&
        channel.permissionsFor(guild.members.me)?.has('ViewChannel') &&
        channel.permissionsFor(guild.members.me)?.has('ReadMessageHistory')
    );

    const candidates = [];
    // userId -> { userId, displayName, count }: every non-bot message counts.
    const messagesByAuthor = new Map();

    for (const [, channel] of channels) {
        try {
            let lastMessageId = null;
            let messagesScanned = 0;

            // No message cap: the recap must cover the full week, so the only
            // bounds are the time window (pagination walks strictly backward,
            // so the window edge is always reached) and channel history running
            // out. Cost is 1 API call per 100 messages; discord.js queues
            // through rate limits, and the scheduled job has no deadline.
            for (;;) {
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

                    if (!msg.author.bot) {
                        // Message-count scale: every message counts.
                        const authorId = msg.author.id;
                        const counter = messagesByAuthor.get(authorId) || {
                            userId: authorId,
                            displayName: displayNameOf(msg),
                            count: 0,
                        };
                        counter.count += 1;
                        messagesByAuthor.set(authorId, counter);

                        // Reaction scales: only reacted posts matter.
                        if (msg.reactions.cache.size > 0) {
                            const totalReactions = msg.reactions.cache.reduce((sum, r) => sum + r.count, 0);
                            if (totalReactions > 0) {
                                candidates.push({ message: msg, channel, totalReactions });
                            }
                        }
                    }

                    lastMessageId = messageId;
                    messagesScanned++;
                }

                if (reachedWindowEdge) break;
            }

            console.log(`Weekly recap: scanned ${messagesScanned} messages in #${channel.name}.`);
        } catch (channelError) {
            console.error(`Weekly recap: error scanning #${channel.name}:`, channelError.message);
        }
    }

    // Most reactions first; equal counts tie for the same rank (see
    // rankWithTies), so the timestamp sort only fixes display order within a
    // tied group (oldest first) — it no longer decides who makes the podium.
    candidates.sort((a, b) => {
        if (b.totalReactions !== a.totalReactions) {
            return b.totalReactions - a.totalReactions;
        }
        return a.message.createdTimestamp - b.message.createdTimestamp;
    });

    // Total reactions received per author across the whole window (not just
    // the podium posts) — feeds the second points scale.
    const reactionsByAuthor = new Map();
    for (const candidate of candidates) {
        const authorId = candidate.message.author.id;
        const entry = reactionsByAuthor.get(authorId) || {
            userId: authorId,
            displayName: displayNameOf(candidate.message),
            reactions: 0,
        };
        entry.reactions += candidate.totalReactions;
        reactionsByAuthor.set(authorId, entry);
    }

    return {
        topPosts: rankWithTies(candidates, (c) => c.totalReactions, POINTS_BY_RANK.length),
        reactionsByAuthor,
        messagesByAuthor,
    };
};

// The week's top message senders with competition ranks; ties share a rank,
// so this can hold more than the podium size.
const topChattersOf = (messagesByAuthor) =>
    rankWithTies(
        [...messagesByAuthor.values()].sort((a, b) => b.count - a.count),
        (entry) => entry.count,
        MESSAGE_POINTS_BY_RANK.length
    );

// The week's top reaction receivers with competition ranks — display only;
// the reaction points scale already pays everyone (see computeAwards).
const topReactedOf = (reactionsByAuthor) =>
    rankWithTies(
        [...reactionsByAuthor.values()].sort((a, b) => b.reactions - a.reactions),
        (entry) => entry.reactions,
        TOP_REACTED_SIZE
    );

// The week's top time-in-voice with competition ranks; `voiceStats` is
// pointsStore.getWeeklyVoiceStats's [{ userId, displayName, weeklyVoiceSeconds }].
const topVoiceOf = (voiceStats) =>
    rankWithTies(
        [...voiceStats].sort((a, b) => b.weeklyVoiceSeconds - a.weeklyVoiceSeconds),
        (entry) => entry.weeklyVoiceSeconds,
        VOICE_POINTS_BY_RANK.length
    );

const formatHours = (seconds) => `${(seconds / 3600).toFixed(1)}h`;

const displayNameOf = (message) => message.member?.displayName || message.author.username;

/* Merge the four independent points scales into one award per member:
 *   - podium points (5/3/1) for authoring the week's most-reacted posts,
 *   - reaction points: floor(total reactions received / REACTIONS_PER_POINT),
 *   - chatter points (5/3/1) for sending the most messages,
 *   - voice podium points (5/3/1) for the most time spent in voice channels.
 * Podium entries carry a competition rank (see rankWithTies): tied members
 * each get that rank's full points, and the tie consumes the ranks below.
 * A member can earn from all four (or hold two podium spots); everything sums.
 * Members whose combined award is 0 are dropped. Exported for the tests.
 */
const computeAwards = (topPosts, reactionsByAuthor, messagesByAuthor = new Map(), voiceStats = []) => {
    const awards = new Map();

    // breakdown entries record *why* each point was awarded so the run can be
    // logged and audited later (see logAwardBreakdown) — the source scale,
    // the points from that scale alone, and a human-readable detail.
    const addAward = (userId, displayName, points, source, detail) => {
        if (points <= 0) return;
        const entry = awards.get(userId) || { userId, displayName, points: 0, breakdown: [] };
        entry.points += points;
        entry.breakdown.push({ source, points, detail });
        awards.set(userId, entry);
    };

    topPosts.forEach((post) => {
        addAward(
            post.message.author.id,
            displayNameOf(post.message),
            POINTS_BY_RANK[post.rank - 1],
            'podium',
            `rank ${post.rank} most-reacted post (${post.totalReactions} reactions)`
        );
    });

    for (const entry of reactionsByAuthor.values()) {
        addAward(
            entry.userId,
            entry.displayName,
            Math.floor(entry.reactions / REACTIONS_PER_POINT),
            'reactions',
            `${entry.reactions} total marks of favor across the week`
        );
    }

    topChattersOf(messagesByAuthor).forEach((entry) => {
        addAward(
            entry.userId,
            entry.displayName,
            MESSAGE_POINTS_BY_RANK[entry.rank - 1],
            'chatter',
            `rank ${entry.rank} most messages (${entry.count} sent)`
        );
    });

    topVoiceOf(voiceStats).forEach((entry) => {
        addAward(
            entry.userId,
            entry.displayName,
            VOICE_POINTS_BY_RANK[entry.rank - 1],
            'voice',
            `rank ${entry.rank} most time in voice (${formatHours(entry.weeklyVoiceSeconds)})`
        );
    });

    return [...awards.values()].filter((award) => award.points > 0);
};

// Log exactly how each member's points for this run were derived — one line
// per source (podium / reactions / chatter) — so a run can be audited in
// CloudWatch after the fact without re-deriving it from Discord history.
// Called on every run, persisted or not, so `/recap` previews can be used to
// verify a week's math ad hoc without touching the stored leaderboard.
// `runLabel` (e.g. "scheduled" vs "preview") tags every line so the two are
// distinguishable in CloudWatch — both write to the same log stream, since
// scheduled runs and manual /recap previews happen inside the same task.
const logAwardBreakdown = (guildId, awards, runLabel) => {
    const tag = `[${runLabel}] guild ${guildId}`;
    if (!awards.length) {
        console.log(`Weekly recap breakdown (${tag}): no points awarded this run.`);
        return;
    }

    console.log(`Weekly recap breakdown (${tag}):`);
    for (const award of awards) {
        console.log(`  ${award.displayName} (${award.userId}): ${award.points} total`);
        for (const line of award.breakdown) {
            console.log(`    +${line.points} ${line.source} — ${line.detail}`);
        }
    }
};

const joinMentions = (ids) => {
    const mentions = ids.map((id) => `<@${id}>`);
    if (mentions.length === 0) return '';
    if (mentions.length === 1) return mentions[0];
    if (mentions.length === 2) return `${mentions[0]} and ${mentions[1]}`;
    return `${mentions.slice(0, -1).join(', ')}, and ${mentions[mentions.length - 1]}`;
};

// A short, link-safe snippet of a post's content for the masked link text.
// URLs are stripped out first: Discord's markdown parser tries to auto-link a
// bare URL even inside a masked link's label text, which breaks the outer
// [text](url) link entirely and shows it as raw, unclickable text. A post
// that's just a link ends up with nothing left, same as a wordless one.
const URL_PATTERN = /https?:\/\/\S+/gi;
const snippetOf = (message) => {
    const hadUrl = URL_PATTERN.test(message.content || '');
    const raw = (message.content || '').replace(URL_PATTERN, '').replace(/\s+/g, ' ').replace(/[[\]]/g, '').trim();
    if (!raw) {
        if (message.attachments?.size) return 'a wordless offering of images';
        return hadUrl ? 'a proclamation of but a single link' : 'a wordless proclamation';
    }
    return raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
};

const rankWordOf = (rank) => RANK_WORDS[rank - 1] || `Rank ${rank}`;

// Discord rejects the whole message if any embed field value exceeds 1024
// characters. The podium sections are unbounded now that ties share a rank
// (an N-way tie keeps all N posts), so drop trailing lines until the field
// fits, noting how many were cut.
const EMBED_FIELD_MAX = 1024;
const fitFieldLines = (lines) => {
    for (let kept = lines.length; kept > 0; kept--) {
        const omitted = lines.length - kept;
        const suffix = omitted ? `\n...and ${omitted} more` : '';
        const text = lines.slice(0, kept).join('\n') + suffix;
        if (text.length <= EMBED_FIELD_MAX) return text;
    }
    return lines[0].slice(0, EMBED_FIELD_MAX);
};

// `weeklyPoints` maps userId -> points earned by THIS run (from computeAwards),
// shown as a (+X) delta beside each member's running total.
const buildRecapPost = (topPosts, leaderboard, topChatters = [], topReacted = [], weeklyPoints = new Map(), topVoice = []) => {
    // All four weekly categories crown winners — proclamations, voices,
    // favor, and time in voice chat alike — so everyone who topped any of
    // them gets pinged. Each is already @mentioned in their own podium line
    // below (see postsText / chattersText / favoredText / voiceText), so the
    // intro stays a short, generic ping — it doesn't re-narrate who won what.
    const winnerIds = [...new Set([
        ...topPosts.map((post) => post.message.author.id),
        ...topChatters.map((entry) => entry.userId),
        ...topReacted.map((entry) => entry.userId),
        ...topVoice.map((entry) => entry.userId),
    ])];

    const content = winnerIds.length
        ? `Hear ye, hear ye! Let the realm give praise unto ${joinMentions(winnerIds)}!`
        : 'Hear ye! The Herald brings tidings of the past sennight.';

    const postsText = topPosts.length
        ? fitFieldLines(
              topPosts.map((post) => {
                  const marks = post.totalReactions === 1 ? 'mark of favor' : 'marks of favor';
                  return `**${rankWordOf(post.rank)}:** [${snippetOf(post.message)}](${post.message.url}) — <@${post.message.author.id}> (${post.totalReactions} ${marks})`;
              })
          )
        : 'No proclamation earned the people\'s favor this past sennight.';

    const chattersText = topChatters.length
        ? fitFieldLines(
              topChatters.map((entry) => {
                  const messages = entry.count === 1 ? 'proclamation' : 'proclamations';
                  return `**${rankWordOf(entry.rank)}:** <@${entry.userId}> — ${entry.count} ${messages}`;
              })
          )
        : 'The court sat silent this past sennight.';

    const favoredText = topReacted.length
        ? fitFieldLines(
              topReacted.map((entry) => {
                  const marks = entry.reactions === 1 ? 'mark of favor' : 'marks of favor';
                  return `**${rankWordOf(entry.rank)}:** <@${entry.userId}> — ${entry.reactions} ${marks}`;
              })
          )
        : 'No marks of favor were bestowed this past sennight.';

    const voiceText = topVoice.length
        ? fitFieldLines(
              topVoice.map((entry) => `**${rankWordOf(entry.rank)}:** <@${entry.userId}> — ${formatHours(entry.weeklyVoiceSeconds)} in voice`)
          )
        : 'No one held court in voice this past sennight.';

    const boardText = leaderboard.length
        ? fitFieldLines(
              leaderboard.map((entry, index) => {
                  const points = entry.points === 1 ? 'point' : 'points';
                  const earned = weeklyPoints.get(entry.userId);
                  const delta = earned ? ` (+${earned})` : '';
                  return `${index + 1}. ${entry.displayName} — ${entry.points} ${points}${delta}`;
              })
          )
        : 'The royal ledger is yet unwritten.';

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The King's Weekly Herald")
        .setDescription('A chronicle of the realm\'s most celebrated words this past sennight, and the standings of honor.')
        .addFields(
            { name: 'Most Celebrated Proclamations', value: postsText },
            { name: 'Most Prolific Voices', value: chattersText },
            { name: 'Most Showered in Favor', value: favoredText },
            { name: 'Longest Time Spent in Council', value: voiceText },
            { name: 'Running Tally of Honor', value: boardText }
        )
        .setFooter({ text: `Points each Sunday: 5/3/1 for the top proclamations, 5/3/1 for the most messages, 5/3/1 for the most time in voice, plus 1 per ${REACTIONS_PER_POINT} marks of favor received. Voice chat itself earns ${pointsStore.VOICE_POINTS_PER_HOUR} points per hour as it happens. Ties share a rank and consume the next.` })
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
 *   targetChannel - where to post (default: each guild's #general or fallback)
 *   persist       - whether to write points to DynamoDB (default: false)
 *   runLabel      - tags CloudWatch log lines so scheduled runs and manual
 *                   /recap previews are distinguishable in the same log
 *                   stream (default: "scheduled" if persist, else "preview")
 */
const runWeeklyRecap = async function (client, options = {}) {
    const { guild, targetChannel, persist = false, runLabel = persist ? 'scheduled' : 'preview' } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const sinceDate = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    for (const g of guilds) {
        try {
            const channel = targetChannel || findRecapChannel(g);
            if (!channel) {
                console.log(`Weekly recap: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const { topPosts, reactionsByAuthor, messagesByAuthor } = await collectWeeklyStats(g, sinceDate);
            const topChatters = topChattersOf(messagesByAuthor);
            const topReacted = topReactedOf(reactionsByAuthor);

            let voiceStats = [];
            try {
                voiceStats = await pointsStore.getWeeklyVoiceStats(g.id);
            } catch (storeError) {
                console.error('Weekly recap: failed to load voice stats:', storeError.message);
            }
            const topVoice = topVoiceOf(voiceStats);

            const awards = computeAwards(topPosts, reactionsByAuthor, messagesByAuthor, voiceStats);
            logAwardBreakdown(g.id, awards, runLabel);

            // userId -> points earned this run, for the (+X) column beside the
            // running tally. On preview runs (persist=false) the running total
            // doesn't include these yet; on scheduled runs it does.
            const weeklyPoints = new Map(awards.map((award) => [award.userId, award.points]));

            if (persist && awards.length) {
                try {
                    await pointsStore.addPoints(g.id, awards);
                    console.log(`Weekly recap: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Weekly recap: failed to persist points:', storeError.message);
                }
            }

            // Reset the voice podium's window regardless of whether anyone
            // placed on it this run — weeklyVoiceSeconds only ever accumulates
            // between recaps (see commands/passive/voiceTime.js), so it must be
            // zeroed for everyone who logged time, not just the top 3.
            if (persist && voiceStats.length) {
                try {
                    await pointsStore.resetWeeklyVoiceSeconds(g.id, voiceStats.map((entry) => entry.userId));
                } catch (storeError) {
                    console.error('Weekly recap: failed to reset voice stats:', storeError.message);
                }
            }

            let leaderboard = [];
            try {
                leaderboard = await pointsStore.getLeaderboard(g.id, LEADERBOARD_SIZE);
            } catch (storeError) {
                console.error('Weekly recap: failed to load leaderboard:', storeError.message);
            }

            await channel.send(buildRecapPost(topPosts, leaderboard, topChatters, topReacted, weeklyPoints, topVoice));
            console.log(`Weekly recap posted to #${channel.name} in "${g.name}" [${runLabel}] (${topPosts.length} honored, persist=${persist}).`);
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

module.exports = { scheduleWeeklyRecap, runWeeklyRecap, computeAwards, findRecapChannel, rankWithTies, topVoiceOf };
