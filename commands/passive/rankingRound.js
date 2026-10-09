/* Passive behavior: the daily ranking round.
 *
 * The other half of the subjective daily slot (see RANKED_SHARE in
 * commands/passive/trivia.js; the other half is the would-you-rather round in
 * commands/passive/wouldYouRather.js). The Herald posts five things and a
 * "Rank these" button. Each member ranks them privately: the button opens an
 * ephemeral message that asks for their 1st pick, then their 2nd, and so on,
 * removing each chosen item from the buttons. The last item is forced, so a
 * full ranking is four taps. Tapping "Rank these" again starts a new ranking;
 * the earlier one stands until the new one is finished, and only the last
 * finished ranking counts.
 *
 * When the window closes, the group's consensus is each item's average
 * position across every finished ranking (a Borda count). Members are then
 * scored by how closely their ranking agrees with that consensus, using a
 * nonparametric pairwise measure (Kendall tau distance): for each of the 10
 * pairs of items, a member's ranking disagrees with the consensus when it puts
 * the pair in the opposite order. A pair the consensus itself cannot separate
 * (equal average) counts as half a disagreement for everyone. Fewer
 * disagreements is closer. Ranks are then shared on ties, the same way the
 * weekly recap ranks the leaderboard:
 *   - closest (rank 1): CLOSEST_POINTS (5), everyone tied for it
 *   - second closest (rank 2): NEXT_POINTS (2), everyone tied for it
 * so a tie for closest means nobody holds second place and no 2-point tier.
 * Nothing scores when fewer than MIN_PARTICIPANTS finished a ranking, or when
 * the rankings cancel out so exactly that the consensus has no order at all.
 *
 * Like the other games the round lives in memory only, so a restart mid-round
 * loses it. A manual preview (/trivia ranked:true) defaults to persist: false,
 * so it awards nothing.
 *
 * Exposes:
 *   runRankingRound(client, opts) - runs one round; called by runTrivia
 *   scoreRound(votes, itemCount) - the pure scoring step, exported for the tests
 */

const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findTriviaRole } = require('../../src/triviaRole');
const flavor = require('../../flavor_text');

// Same length as the daily trivia's answer window.
const ANSWER_WINDOW_MS = 30 * 60 * 1000;
const CLOSEST_POINTS = 5;
const NEXT_POINTS = 2;
// With two rankings both are always exactly as close to their own average as
// each other, so at least three are needed for "closest" to mean anything.
const MIN_PARTICIPANTS = 3;

// Keeps a huge server's name lists inside Discord's 2000-character message limit.
const MAX_NAMES_SHOWN = 20;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const displayNameFor = (guild, user) => guild.members.cache.get(user.id)?.displayName || user.username;

// ---- question selection -----------------------------------------------------

// Same restart-safe no-repeat cycle as the would-you-rather round (see
// nextQuestion in commands/passive/wouldYouRather.js), on its own persisted
// item. `null` means "not yet loaded from persistence".
let usedQuestions = null;

const nextQuestion = async (consumeBag) => {
    const allQuestions = flavor.rankingQuestions();
    if (!consumeBag) {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }

    if (usedQuestions === null) {
        usedQuestions = await pointsStore.getUsedRanking();
    }

    let candidates = allQuestions.filter((q) => !usedQuestions.includes(q.question));
    if (candidates.length === 0) {
        usedQuestions = [];
        candidates = allQuestions;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedQuestions.push(picked.question);

    try {
        await pointsStore.setUsedRanking(usedQuestions);
    } catch (error) {
        console.error('Ranking: failed to persist used-question state:', error.message);
    }

    return picked;
};

// ---- scoring ------------------------------------------------------------------------

/* Pure scoring step. `votes` is collectRankings's Map of
 * userId -> { displayName, ranking }, where `ranking` is an array of item
 * indexes best-first (a full ranking) or null (never finished one). Returns
 *   { status, complete, consensus, winners }
 * where status is one of:
 *   'none'        - nobody finished a ranking
 *   'few'         - fewer than MIN_PARTICIPANTS finished one
 *   'noConsensus' - every pair of items is tied in the group's average, so no
 *                   one can be closer than anyone else
 *   'scored'      - closest and second-closest members were found
 * `complete` is [{ userId, displayName, ranking, distance }] (distance only
 * once scored); `consensus` is [{ item, rank, average }] best-first, with ties
 * sharing a rank; `winners` is [{ userId, displayName, points, distance }].
 */
const scoreRound = (votes, itemCount) => {
    const complete = [...votes.entries()]
        .filter(([, v]) => Array.isArray(v.ranking) && v.ranking.length === itemCount)
        .map(([userId, v]) => ({ userId, displayName: v.displayName, ranking: v.ranking, distance: null }));

    if (complete.length === 0) return { status: 'none', complete, consensus: [], winners: [] };
    if (complete.length < MIN_PARTICIPANTS) return { status: 'few', complete, consensus: [], winners: [] };

    // Position sums are integers, so ties in the average are detected exactly.
    const sums = new Array(itemCount).fill(0);
    complete.forEach((p) => p.ranking.forEach((item, position) => { sums[item] += position; }));

    const order = sums.map((sum, item) => ({ item, sum })).sort((a, b) => a.sum - b.sum || a.item - b.item);
    const consensus = order.map((entry, index) => ({
        item: entry.item,
        rank: index > 0 && order[index - 1].sum === entry.sum ? null : index + 1,
        average: entry.sum / complete.length + 1, // 1-based, for display
    }));
    consensus.forEach((entry, index) => { if (entry.rank === null) entry.rank = consensus[index - 1].rank; });

    // Kendall tau distance from each member's strict ranking to the consensus
    // weak ordering. Consensus ties cost every member the same 0.5.
    let separablePairs = 0;
    for (let i = 0; i < itemCount; i++) {
        for (let j = i + 1; j < itemCount; j++) if (sums[i] !== sums[j]) separablePairs += 1;
    }
    if (separablePairs === 0) return { status: 'noConsensus', complete, consensus, winners: [] };

    complete.forEach((p) => {
        const position = new Array(itemCount);
        p.ranking.forEach((item, index) => { position[item] = index; });
        let distance = 0;
        for (let i = 0; i < itemCount; i++) {
            for (let j = i + 1; j < itemCount; j++) {
                if (sums[i] === sums[j]) distance += 0.5;
                else if ((position[i] < position[j]) !== (sums[i] < sums[j])) distance += 1;
            }
        }
        p.distance = distance;
    });

    // Competition ranking: tied members share a rank and consume the ranks below.
    const byDistance = [...complete].sort((a, b) => a.distance - b.distance);
    const rankOf = new Map();
    byDistance.forEach((p, index) => {
        rankOf.set(p.userId, index > 0 && byDistance[index - 1].distance === p.distance ? rankOf.get(byDistance[index - 1].userId) : index + 1);
    });

    const winners = byDistance
        .filter((p) => rankOf.get(p.userId) <= 2)
        .map((p) => ({
            userId: p.userId,
            displayName: p.displayName,
            points: rankOf.get(p.userId) === 1 ? CLOSEST_POINTS : NEXT_POINTS,
            distance: p.distance,
        }));

    return { status: 'scored', complete, consensus, winners };
};

// ---- rendering ----------------------------------------------------------------

const START_ID = 'start';

const buildQuestionPost = (question, roundId) => {
    const itemLines = question.items.map((item) => `- ${item}`).join('\n');
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Ranking of the Court")
        .setDescription(`${pick(flavor.rankingIntroLines())}\n\n**${question.question}**\n\n${itemLines}`)
        .setFooter({ text: `Tap "Rank these" and pick thy 1st, 2nd, and so on; it stays secret 'til the round closes (${ANSWER_WINDOW_MS / 60000} minutes), and tapping again redoes it. Rank closest to the court's average and earn ${CLOSEST_POINTS} points, or ${NEXT_POINTS} for second closest.` })
        .setTimestamp();

    const startRow = (disabled) => new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`rank_${roundId}_${START_ID}`)
            .setLabel('Rank these')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled)
    );

    return { embeds: [embed], components: [startRow(false)], startRow };
};

const ordinalLines = (question, indexes) => indexes.map((item, i) => `${i + 1}. ${question.items[item]}`).join('\n');

// The private message for a member who is partway through ranking.
const buildPickPrompt = (question, roundId, entry) => {
    const step = entry.pending.length;
    const chosen = entry.pending.length ? `${ordinalLines(question, entry.pending)}\n\n` : '';
    const keepNote = step === 0 && entry.ranking ? ' Thy earlier ranking stands unless thou finish this one.' : '';
    const buttons = question.items
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => !entry.pending.includes(index))
        .map(({ item, index }) =>
            new ButtonBuilder()
                .setCustomId(`rank_${roundId}_${step}_${index}`)
                .setLabel(item)
                .setStyle(ButtonStyle.Primary)
        );

    return {
        content: `**${question.question}**\n${chosen}Pick thy number **${step + 1}** of ${question.items.length}:${keepNote}`,
        components: [new ActionRowBuilder().addComponents(buttons)],
    };
};

// The private message once a ranking is finished (or shown again to a member
// who taps a stale button).
const buildDoneView = (question, entry) => {
    if (!entry.ranking) {
        return { content: 'Tap **Rank these** on the Herald\'s post to begin thy ranking.', components: [] };
    }
    return {
        content: `Thy ranking is recorded in secret:\n${ordinalLines(question, entry.ranking)}\n\nTap **Rank these** on the Herald's post again to redo it, 'til the round closes.`,
        components: [],
    };
};

// ---- collecting rankings ------------------------------------------------------------

// Collects button presses on `channel` for `windowMs` (a channel-level
// collector, because presses inside a member's ephemeral message never reach
// the public message's own collector) and resolves with a Map of
// userId -> { displayName, ranking, pending }. Only presses whose custom id
// carries this round's id are handled. Bot clicks are ignored outright.
const collectRankings = (channel, guild, question, roundId, windowMs) =>
    new Promise((resolve) => {
        const votes = new Map();
        const prefix = `rank_${roundId}_`;

        const collector = channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId.startsWith(prefix),
            time: windowMs,
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.bot) return;

            const entry = votes.get(buttonInteraction.user.id) || { displayName: '', ranking: null, pending: null };
            entry.displayName = displayNameFor(guild, buttonInteraction.user);
            votes.set(buttonInteraction.user.id, entry);

            const action = buttonInteraction.customId.slice(prefix.length);

            // State changes happen synchronously, before any await, so quick
            // repeated taps can't interleave.
            if (action === START_ID) {
                entry.pending = [];
                await buttonInteraction
                    .reply({ ...buildPickPrompt(question, roundId, entry), flags: MessageFlags.Ephemeral })
                    .catch(() => {});
                return;
            }

            const [stepText, itemText] = action.split('_');
            const step = Number(stepText);
            const item = Number(itemText);

            // A stale button (from an older prompt, or after finishing) or an
            // already-chosen item: just redraw the member's current state.
            const valid = entry.pending
                && step === entry.pending.length
                && Number.isInteger(item)
                && item >= 0 && item < question.items.length
                && !entry.pending.includes(item);
            if (!valid) {
                const view = entry.pending ? buildPickPrompt(question, roundId, entry) : buildDoneView(question, entry);
                await buttonInteraction.update(view).catch(() => {});
                return;
            }

            entry.pending.push(item);
            if (entry.pending.length === question.items.length - 1) {
                // One item left, so there is nothing to choose: it takes last place.
                const last = question.items.findIndex((_, index) => !entry.pending.includes(index));
                entry.pending.push(last);
                entry.ranking = entry.pending;
                entry.pending = null;
                await buttonInteraction.update(buildDoneView(question, entry)).catch(() => {});
                return;
            }

            await buttonInteraction.update(buildPickPrompt(question, roundId, entry)).catch(() => {});
        });

        collector.on('end', () => resolve(votes));
    });

// ---- results ----------------------------------------------------------------------

const joinNames = (names) => {
    if (!names.length) return 'no one';
    if (names.length <= MAX_NAMES_SHOWN) return names.join(', ');
    return `${names.slice(0, MAX_NAMES_SHOWN).join(', ')}, and ${names.length - MAX_NAMES_SHOWN} more`;
};

const formatDistance = (distance) => `${distance} of 10 pairs off`;

const SIGNUP_NOTE = '\n\n*Wish to be summoned the instant future questions are posed? Use /trivia_signup!*';

const buildResultsPost = (question, result, incompleteCount, persist) => {
    const { status, complete, consensus, winners } = result;

    let headline;
    if (status === 'none') headline = pick(flavor.rankingNoneLines());
    else if (status === 'few') headline = pick(flavor.rankingFewLines());
    else if (status === 'noConsensus') headline = pick(flavor.rankingNoConsensusLines());
    else headline = pick(flavor.rankingConsensusLines());

    const consensusBlock = consensus.length
        ? consensus.map((entry) => `${entry.rank}. **${question.items[entry.item]}** (average place ${entry.average.toFixed(1)})`).join('\n')
        : '';

    let winnersBlock = '';
    if (status === 'scored') {
        const tier = (points, heading) => {
            const members = winners.filter((w) => w.points === points);
            if (!members.length) return '';
            const lines = members.map((w) => `<@${w.userId}> (+${w.points}, ${formatDistance(w.distance)})`);
            return `${heading} ${lines.join(', ')}`;
        };
        winnersBlock = [
            tier(CLOSEST_POINTS, pick(flavor.rankingClosestLines())),
            tier(NEXT_POINTS, pick(flavor.rankingNextLines())),
        ].filter(Boolean).join('\n');
    }

    const counted = complete.length
        ? `*${complete.length} ${complete.length === 1 ? 'ranking' : 'rankings'} counted: ${joinNames(complete.map((p) => p.displayName))}.*`
        : '';
    const incompleteNote = incompleteCount
        ? `*${incompleteCount} ${incompleteCount === 1 ? 'noble' : 'nobles'} began but did not finish a ranking and ${incompleteCount === 1 ? 'is' : 'are'} not counted.*`
        : '';
    const previewNote = persist ? '' : '*(This be but a rehearsal — no points were truly bestowed.)*';

    return [headline, consensusBlock, winnersBlock, counted, incompleteNote, previewNote].filter(Boolean).join('\n\n') + SIGNUP_NOTE;
};

// Log exactly who ranked what and who scored, so a round can be audited in
// CloudWatch without re-deriving it from Discord.
const logRoundBreakdown = (guildId, question, votes, result, runLabel) => {
    const tag = `[${runLabel}] guild ${guildId}`;
    console.log(`Ranking (${tag}): "${question.question}" — ${question.items.join(' | ')}`);
    for (const [userId, v] of votes) {
        const ranking = v.ranking ? v.ranking.map((item) => question.items[item]).join(' > ') : '(no finished ranking)';
        console.log(`  ${v.displayName} (${userId}): ${ranking}`);
    }
    const consensus = result.consensus.map((entry) => question.items[entry.item]).join(' > ');
    console.log(`Ranking (${tag}): status ${result.status}${consensus ? `, consensus ${consensus}` : ''}, ${result.winners.length} scored.`);
};

// ---- entry point --------------------------------------------------------------------

/* Run one round.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to write points to DynamoDB (default: false)
 *   consumeBag    - whether this round draws from (and advances) the
 *                   no-repeat bag, vs. a plain random pick (default: same as
 *                   persist)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 *
 * Every guild's round runs concurrently: each holds a 30-minute window open,
 * so awaiting them one after another would delay every guild after the first.
 */
const runRankingRound = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        consumeBag = persist,
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const question = await nextQuestion(consumeBag);

    await Promise.all(guilds.map(async (g) => {
        try {
            const channel = targetChannel || await resolveChannel(g, 'trivia', findAnnounceChannel);
            if (!channel) {
                console.log(`Ranking: no channel the herald can post in found in "${g.name}"; skipping.`);
                return;
            }

            // Ties this round's buttons to its own collector, so two rounds in
            // one channel (e.g. a preview during the real one) don't mix.
            const roundId = crypto.randomBytes(4).toString('hex');

            // Only the real scheduled round pings signed-up members
            // (/trivia_signup) — preview runs shouldn't spam them.
            const { startRow, ...post } = buildQuestionPost(question, roundId);
            if (persist) {
                const role = findTriviaRole(g);
                if (role) post.content = `<@&${role.id}>`;
            }

            const message = await channel.send(post);
            console.log(`Ranking: posted round to #${channel.name} in "${g.name}" [${runLabel}]. Closes in ${ANSWER_WINDOW_MS / 60000} minutes.`);

            const votes = await collectRankings(channel, g, question, roundId, ANSWER_WINDOW_MS);
            await message.edit({ components: [startRow(true)] }).catch((error) =>
                console.error(`Ranking: could not disable button for guild "${g.name}":`, error.message)
            );

            const result = scoreRound(votes, question.items.length);
            logRoundBreakdown(g.id, question, votes, result, runLabel);

            if (persist && result.winners.length) {
                try {
                    await pointsStore.addPoints(g.id, result.winners.map((w) => ({ userId: w.userId, displayName: w.displayName, points: w.points })));
                    console.log(`Ranking: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Ranking: failed to persist points:', storeError.message);
                }
            }

            const incompleteCount = votes.size - result.complete.length;
            await channel.send(buildResultsPost(question, result, incompleteCount, persist));
        } catch (guildError) {
            console.error(`Ranking round failed for guild "${g.name}":`, guildError);
        }
    }));
};

module.exports = { runRankingRound, scoreRound, CLOSEST_POINTS, NEXT_POINTS, MIN_PARTICIPANTS };
