/* Passive behavior: the daily "would you rather" round.
 *
 * On the days the daily trivia slot hands itself over to this game (see
 * SUBJECTIVE_CHANCE in commands/passive/trivia.js), the Herald posts a
 * this-or-that question with two rows of buttons instead of a factual
 * question. Every member answers twice, both in secret via ephemeral replies
 * (same approach as the daily trivia, so nobody can copy anyone):
 *   1. their own preference ("I choose A/B"), and
 *   2. their prediction of which side the group will choose most
 *      ("The court chooses A/B").
 * Either can be changed until the window closes; only the last click of each
 * kind counts. A member only counts if they gave BOTH answers.
 *
 * When the window closes, the group's pick is whichever option got more
 * preferences among the members who gave both answers. Only correct
 * predictions score:
 *   - PREDICT_POINTS (2) for predicting the group's pick, or
 *   - CONTRARIAN_POINTS (5) for predicting it when their own preference was
 *     the other side (so it was a genuine read of the room, not just
 *     agreeing with themselves). That is 5 in total, not 2 + 5.
 * An exact tie has no group pick to have predicted, so instead every member
 * who gave both answers earns TIE_POINTS (1). Nothing scores when fewer than
 * MIN_PARTICIPANTS members gave both answers.
 * Afterward the votes are revealed, grouped by option, so everyone can argue
 * about it.
 *
 * Points go straight onto the ledger via pointsStore.addPoints, the same way
 * the daily trivia pays out. A manual preview (/trivia subjective:true)
 * defaults to persist: false, so it awards nothing.
 *
 * Like the other games the round lives in memory only, so a restart mid-round
 * loses it.
 *
 * Exposes:
 *   runWouldYouRather(client, opts) - runs one round; called by runTrivia
 *   scoreRound(votes) - the pure scoring step, exported for the tests
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { findTriviaRole } = require('../../src/triviaRole');
const flavor = require('../../flavor_text');

// Same length as the daily trivia's answer window.
const ANSWER_WINDOW_MS = 30 * 60 * 1000;
const PREDICT_POINTS = 2;
const CONTRARIAN_POINTS = 5;
const TIE_POINTS = 1; // each full participant, when the vote splits exactly evenly
const MIN_PARTICIPANTS = 2;

const LETTERS = ['A', 'B'];
const PREF_PREFIX = 'wyr_pref_';
const PRED_PREFIX = 'wyr_pred_';

// Keeps a huge server's name lists inside Discord's 2000-character message limit.
const MAX_NAMES_SHOWN = 20;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const displayNameFor = (guild, user) => guild.members.cache.get(user.id)?.displayName || user.username;

// ---- question selection -----------------------------------------------------

// Same restart-safe no-repeat cycle as the daily trivia (see nextQuestion in
// commands/passive/trivia.js), on its own persisted item. `null` means "not yet
// loaded from persistence".
let usedQuestions = null;

const nextQuestion = async (consumeBag) => {
    const allQuestions = flavor.wouldYouRatherQuestions();
    if (!consumeBag) {
        return allQuestions[Math.floor(Math.random() * allQuestions.length)];
    }

    if (usedQuestions === null) {
        usedQuestions = await pointsStore.getUsedWouldYouRather();
    }

    let candidates = allQuestions.filter((q) => !usedQuestions.includes(q.question));
    if (candidates.length === 0) {
        usedQuestions = [];
        candidates = allQuestions;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedQuestions.push(picked.question);

    try {
        await pointsStore.setUsedWouldYouRather(usedQuestions);
    } catch (error) {
        console.error('Would you rather: failed to persist used-question state:', error.message);
    }

    return picked;
};

// ---- rendering ----------------------------------------------------------------

const buildRows = (disabled = false) => [
    new ActionRowBuilder().addComponents(
        LETTERS.map((letter) =>
            new ButtonBuilder()
                .setCustomId(`${PREF_PREFIX}${letter}`)
                .setLabel(`I choose ${letter}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled)
        )
    ),
    new ActionRowBuilder().addComponents(
        LETTERS.map((letter) =>
            new ButtonBuilder()
                .setCustomId(`${PRED_PREFIX}${letter}`)
                .setLabel(`The court chooses ${letter}`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled)
        )
    ),
];

const buildQuestionPost = (question) => {
    const optionLines = LETTERS.map((letter) => `**${letter}.** ${question.options[letter]}`).join('\n');
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Question of Preference")
        .setDescription(`${pick(flavor.wouldYouRatherIntroLines())}\n\n**${question.question}**\n\n${optionLines}`)
        .setFooter({ text: `Top row: what thou wouldst choose. Bottom row: what thou thinkest the court will choose most. Both are needed to count, both stay secret 'til the round closes (${ANSWER_WINDOW_MS / 60000} minutes), and either may be changed 'til then. Guess right and earn ${PREDICT_POINTS} points, or ${CONTRARIAN_POINTS} if thou guessed against thine own taste.` })
        .setTimestamp();

    return { embeds: [embed], components: buildRows(false) };
};

// ---- collecting votes ------------------------------------------------------------

// Collects button clicks for `windowMs` and resolves with a Map of
// userId -> { displayName, pref, pred } (each of pref/pred is 'A', 'B', or null
// if they never clicked that row). Bot clicks are ignored outright.
const collectVotes = (message, guild, question, windowMs) =>
    new Promise((resolve) => {
        const votes = new Map();

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: windowMs,
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.bot) return;

            const isPref = buttonInteraction.customId.startsWith(PREF_PREFIX);
            const isPred = buttonInteraction.customId.startsWith(PRED_PREFIX);
            if (!isPref && !isPred) return;

            const letter = buttonInteraction.customId.slice((isPref ? PREF_PREFIX : PRED_PREFIX).length);
            const entry = votes.get(buttonInteraction.user.id) || { displayName: '', pref: null, pred: null };
            entry.displayName = displayNameFor(guild, buttonInteraction.user);
            if (isPref) entry.pref = letter;
            else entry.pred = letter;
            votes.set(buttonInteraction.user.id, entry);

            const text = question.options[letter];
            let reply = isPref
                ? `Thine own choice, **${text}**, is recorded in secret!`
                : `Thy guess of the court, **${text}**, is recorded in secret!`;
            if (!entry.pref) reply += ' Now name thine own choice too, else thy guess shall not count.';
            else if (!entry.pred) reply += ' Now name what thou thinkest the court will choose most, else thy choice shall not count.';

            await buttonInteraction.reply({ content: reply, flags: MessageFlags.Ephemeral }).catch(() => {});
        });

        collector.on('end', () => resolve(votes));
    });

// ---- scoring ------------------------------------------------------------------------

/* Pure scoring step. `votes` is collectVotes's Map. Returns
 *   { status, complete, counts, majority, winners }
 * where status is one of:
 *   'none'      - nobody gave both answers
 *   'few'       - fewer than MIN_PARTICIPANTS gave both answers
 *   'tie'       - the preferences split exactly evenly (no group pick);
 *                 every complete participant is a winner at TIE_POINTS
 *   'noWinners' - a clear group pick, but nobody predicted it
 *   'scored'    - a clear group pick, and at least one correct prediction
 * `complete` is everyone who gave both answers; `counts` is preferences per
 * letter among them; `winners` is [{ userId, displayName, points, againstOwn }].
 */
const scoreRound = (votes) => {
    const complete = [...votes.entries()]
        .filter(([, v]) => v.pref && v.pred)
        .map(([userId, v]) => ({ userId, displayName: v.displayName, pref: v.pref, pred: v.pred }));

    const counts = { A: 0, B: 0 };
    complete.forEach((p) => { counts[p.pref] += 1; });

    if (complete.length === 0) return { status: 'none', complete, counts, majority: null, winners: [] };
    if (complete.length < MIN_PARTICIPANTS) return { status: 'few', complete, counts, majority: null, winners: [] };
    if (counts.A === counts.B) {
        const winners = complete.map((p) => ({ userId: p.userId, displayName: p.displayName, points: TIE_POINTS, againstOwn: false }));
        return { status: 'tie', complete, counts, majority: null, winners };
    }

    const majority = counts.A > counts.B ? 'A' : 'B';
    const winners = complete
        .filter((p) => p.pred === majority)
        .map((p) => {
            const againstOwn = p.pref !== majority;
            return { userId: p.userId, displayName: p.displayName, points: againstOwn ? CONTRARIAN_POINTS : PREDICT_POINTS, againstOwn };
        });

    return { status: winners.length ? 'scored' : 'noWinners', complete, counts, majority, winners };
};

// ---- results ----------------------------------------------------------------------

const joinNames = (names) => {
    if (!names.length) return 'no one';
    if (names.length <= MAX_NAMES_SHOWN) return names.join(', ');
    return `${names.slice(0, MAX_NAMES_SHOWN).join(', ')}, and ${names.length - MAX_NAMES_SHOWN} more`;
};

const SIGNUP_NOTE = '\n\n*Wish to be summoned the instant future questions are posed? Use /trivia_signup!*';

const buildResultsPost = (question, result, incompleteCount, persist) => {
    const { status, complete, counts, majority, winners } = result;
    const other = majority === 'A' ? 'B' : 'A';

    let headline;
    if (status === 'none') headline = pick(flavor.wouldYouRatherNoneLines());
    else if (status === 'few') headline = pick(flavor.wouldYouRatherFewLines());
    else if (status === 'tie') headline = pick(flavor.wouldYouRatherTieLines(counts.A));
    else headline = pick(flavor.wouldYouRatherMajorityLines(question.options[majority], counts[majority], counts[other]));

    // Reveal who chose what, grouped by option. Plain names, not mentions, so
    // a big reveal doesn't ping the whole room.
    const reveal = complete.length
        ? LETTERS.map((letter) => {
              const names = complete.filter((p) => p.pref === letter).map((p) => p.displayName);
              return `**${question.options[letter]}** (${counts[letter]}): ${joinNames(names)}`;
          }).join('\n')
        : '';

    let winnersBlock = '';
    if (status === 'tie') {
        // Everyone who answered fully gets it, so no need to ping the whole list.
        winnersBlock = `Every noble who answered in full earns ${TIE_POINTS} point.`;
    } else if (status === 'noWinners') {
        winnersBlock = pick(flavor.wouldYouRatherNoWinnersLines());
    } else if (status === 'scored') {
        const lines = winners.map((w) => `<@${w.userId}> (+${w.points}${w.againstOwn ? ', against their own taste' : ''})`);
        winnersBlock = `${pick(flavor.wouldYouRatherWinnersLines())} ${lines.join(', ')}`;
    }

    const incompleteNote = incompleteCount
        ? `*${incompleteCount} ${incompleteCount === 1 ? 'noble' : 'nobles'} answered only half and ${incompleteCount === 1 ? 'is' : 'are'} not counted.*`
        : '';
    const previewNote = persist ? '' : '*(This be but a rehearsal — no points were truly bestowed.)*';

    return [headline, reveal, winnersBlock, incompleteNote, previewNote].filter(Boolean).join('\n\n') + SIGNUP_NOTE;
};

// Log exactly who answered what and who scored, so a round can be audited in
// CloudWatch without re-deriving it from Discord.
const logRoundBreakdown = (guildId, question, votes, result, runLabel) => {
    const tag = `[${runLabel}] guild ${guildId}`;
    console.log(`Would you rather (${tag}): "${question.question}" — A: ${question.options.A} | B: ${question.options.B}`);
    for (const [userId, v] of votes) {
        console.log(`  ${v.displayName} (${userId}): prefers ${v.pref || '-'}, predicts ${v.pred || '-'}`);
    }
    console.log(`Would you rather (${tag}): status ${result.status}, prefs A=${result.counts.A} B=${result.counts.B}${result.majority ? `, group picked ${result.majority}` : ''}, ${result.winners.length} scored.`);
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
const runWouldYouRather = async function (client, options = {}) {
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
            const channel = targetChannel || findAnnounceChannel(g);
            if (!channel) {
                console.log(`Would you rather: no channel the herald can post in found in "${g.name}"; skipping.`);
                return;
            }

            // Only the real scheduled round pings signed-up members
            // (/trivia_signup) — preview runs shouldn't spam them.
            const post = buildQuestionPost(question);
            if (persist) {
                const role = findTriviaRole(g);
                if (role) post.content = `<@&${role.id}>`;
            }

            const message = await channel.send(post);
            console.log(`Would you rather: posted round to #${channel.name} in "${g.name}" [${runLabel}]. Closes in ${ANSWER_WINDOW_MS / 60000} minutes.`);

            const votes = await collectVotes(message, g, question, ANSWER_WINDOW_MS);
            await message.edit({ components: buildRows(true) }).catch((error) =>
                console.error(`Would you rather: could not disable buttons for guild "${g.name}":`, error.message)
            );

            const result = scoreRound(votes);
            logRoundBreakdown(g.id, question, votes, result, runLabel);

            if (persist && result.winners.length) {
                try {
                    await pointsStore.addPoints(g.id, result.winners.map((w) => ({ userId: w.userId, displayName: w.displayName, points: w.points })));
                    console.log(`Would you rather: persisted awards for guild ${g.id}.`);
                } catch (storeError) {
                    console.error('Would you rather: failed to persist points:', storeError.message);
                }
            }

            const incompleteCount = votes.size - result.complete.length;
            await channel.send(buildResultsPost(question, result, incompleteCount, persist));
        } catch (guildError) {
            console.error(`Would you rather round failed for guild "${g.name}":`, guildError);
        }
    }));
};

module.exports = { runWouldYouRather, scoreRound, PREDICT_POINTS, CONTRARIAN_POINTS, TIE_POINTS, MIN_PARTICIPANTS };
