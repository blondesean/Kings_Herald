/* Passive behavior: the Herald's daily Connections-style word puzzle.
 *
 * Once a day, the Herald posts sixteen words drawn from a hand-authored bank
 * (see connectionsPuzzles.js in this directory) that secretly split into
 * four groups of four. Unlike the daily trivia (private, per-user answers
 * via ephemeral button clicks) this game is fully public and collaborative:
 * anyone in the channel can call out a guess by typing four of the board's
 * words separated by commas (case-insensitive, whitespace trimmed), and the
 * whole guild shares one pool of STARTING_TRIES wrong guesses — a bad guess
 * from any one member costs everyone a chance, so solving it well means
 * actually talking it through together rather than everyone spamming
 * guesses independently.
 *
 * A correct guess reveals that group's category and awards the guesser
 * POINTS_PER_SOLVE points immediately (not batched to the end, since
 * different groups are typically solved by different people at different
 * times) — see pointsStore.addPuzzlePoints, which feeds both the regular
 * leaderboard and the weekly recap's display-only "puzzle podium"
 * (getWeeklyPuzzleStats/resetWeeklyPuzzlePoints), shared with any future
 * puzzle game in this directory, not just this one. Up to POINTS_PER_SOLVE *
 * 4 points are on the table per puzzle; a guess that's 3-of-4 right gets a
 * gentler "so close" hint (mirroring real Connections) but still costs a
 * chance like any other wrong guess. The puzzle ends the moment either all
 * four groups are found or the shared chances run out; otherwise it stays
 * open for GUESS_WINDOW_MS so people trickle in over the day.
 *
 * Like /trivia and /recap, a manual preview run defaults to persist: false
 * so admins can test the flow without inflating the leaderboard or
 * advancing the no-repeat cycle.
 *
 * The whole session's state (remaining groups, chances left, who's already
 * guessed what) lives only in memory for as long as the message collector
 * runs — same restart caveat as commands/passive/voiceTime.js and the daily
 * trivia's scheduledFireAt: a Fargate Spot reclaim mid-puzzle loses that
 * day's game entirely, with no resume. GUESS_WINDOW_MS is kept short (15
 * minutes, matching the daily trivia's own answer window — see
 * commands/passive/trivia.js) specifically to bound how much a reclaim
 * could lose, rather than trying to solve persistence for a "let's
 * experiment" feature.
 *
 * Scheduling mirrors the daily trivia exactly (see scheduleTrivia in
 * commands/passive/trivia.js): a cron job opens a daily window, then a
 * single random 15-minute-aligned slot within it is chosen fresh each day
 * and a timeout fires the actual puzzle at that moment — rather than
 * posting at the same clock time every day.
 *
 * Exposes:
 *   scheduleConnectionsPuzzle(client) - registers the daily randomized timer (call once, on ready)
 *   runConnectionsPuzzle(client, opts) - runs one puzzle; reused by the preview command
 *   getScheduledFireTime() - the Date today's puzzle is armed to fire, or null
 *                            if the window hasn't opened yet or already fired;
 *                            backs the /connections_time preview command
 */

const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const connectionsPuzzles = require('./connectionsPuzzles');
const flavor = require('../../flavor_text');

// Window start (Eastern local time) and length — identical window to the
// daily trivia's (commands/passive/trivia.js), so both games roll their
// random daily slot across the same 9 AM-to-midnight span.
const WINDOW_CRON = '0 9 * * *';
const WINDOW_HOURS = 15;
const TIMEZONE = 'America/New_York';

const SLOT_MINUTES = 15;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES; // 60 possible start times

const STARTING_TRIES = 3;
const POINTS_PER_SOLVE = 1;

// How long the puzzle stays open for guesses if it's neither fully solved
// nor out of chances first — see the module comment above for why this is
// deliberately short rather than "open most of the day."
const GUESS_WINDOW_MS = 15 * 60 * 1000;

// The Date today's puzzle is armed to fire, set when the window opens and
// cleared once it actually runs. In memory only — not persisted, so a
// restart loses it until the next window open (see scheduleConnectionsPuzzle).
let scheduledFireAt = null;
const getScheduledFireTime = () => scheduledFireAt;

const DIFFICULTY_EMOJI = { yellow: '🟨', green: '🟩', blue: '🟦', purple: '🟪' };
const WORDS_PER_ROW = 4;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const normalize = (text) => text.trim().toUpperCase();

const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// ---- puzzle selection -------------------------------------------------------

// Stable identity for a puzzle regardless of its position in the array (so
// appending new puzzles to connectionsPuzzles.js can't shift what an
// in-progress no-repeat cycle thinks is "already used") — the sorted set of
// category names is effectively unique per puzzle in this bank.
const puzzleSignature = (puzzle) => puzzle.groups.map((g) => g.category).slice().sort().join('|');

// Same no-repeat-cycle shape as commands/passive/trivia.js's nextQuestion —
// see that file's comment for the full rationale. `null` means "not yet
// loaded from persistence".
let usedSignatures = null;

const nextPuzzle = async (consumeBag) => {
    const allPuzzles = connectionsPuzzles();
    if (!consumeBag) {
        return allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
    }

    if (usedSignatures === null) {
        usedSignatures = await pointsStore.getUsedConnectionsPuzzles();
    }

    let candidates = allPuzzles.filter((p) => !usedSignatures.includes(puzzleSignature(p)));
    if (candidates.length === 0) {
        usedSignatures = [];
        candidates = allPuzzles;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedSignatures.push(puzzleSignature(picked));

    try {
        await pointsStore.setUsedConnectionsPuzzles(usedSignatures);
    } catch (error) {
        console.error('Connections: failed to persist used-puzzle state:', error.message);
    }

    return picked;
};

// ---- guess parsing -----------------------------------------------------------

// A guess is exactly 4 non-empty, comma-separated, trimmed tokens — anything
// else (normal chat, a 3-item list, whatever) isn't shaped like an attempt
// at all and is ignored outright, silently, rather than costing a chance.
const parseGuess = (content) => {
    const parts = content.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    return parts.length === 4 ? parts : null;
};

// ---- rendering -----------------------------------------------------------

const solvedLine = (group) => `${DIFFICULTY_EMOJI[group.difficulty] || '⬜'} **${group.category}** — ${group.words.join(', ')}`;

const buildRemainingGrid = (words) => {
    if (!words.length) return '*(nothing left — the board is clear!)*';
    const width = Math.max(...words.map((w) => w.length)) + 2;
    const rows = [];
    for (let i = 0; i < words.length; i += WORDS_PER_ROW) {
        rows.push(words.slice(i, i + WORDS_PER_ROW).map((w) => w.padEnd(width)).join(''));
    }
    return '```\n' + rows.join('\n') + '\n```';
};

const buildBoardEmbed = (session) => {
    const solvedText = session.solvedGroups.length
        ? session.solvedGroups.map(solvedLine).join('\n')
        : '*None yet.*';
    const remainingWords = session.displayOrder.filter((w) => session.remainingWordSet.has(normalize(w)));

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Daily Puzzle: Connections")
        .addFields(
            { name: 'Solved', value: solvedText },
            { name: 'Remaining Words', value: buildRemainingGrid(remainingWords) },
            { name: 'Chances Left', value: String(session.triesLeft), inline: true }
        )
        .setFooter({ text: 'Guess by naming 4 words from the board, separated by commas — e.g. WORD ONE, WORD TWO, WORD THREE, WORD FOUR' })
        .setTimestamp();
};

// ---- one session --------------------------------------------------------------

// Runs one full puzzle session in one guild/channel until it's solved, out
// of chances, or the guess window closes. Only persists points (and
// advances the no-repeat cycle upstream in nextPuzzle) when `persist` is
// true — matching /trivia and /recap, a preview run doesn't inflate the
// leaderboard. Resolves once the session has fully ended.
const runConnectionsSession = (guild, channel, puzzle, persist, runLabel) => {
    const words = shuffle(puzzle.groups.flatMap((g) => g.words));
    const session = {
        remainingGroups: puzzle.groups.map((g) => ({ ...g })),
        solvedGroups: [],
        displayOrder: words,
        remainingWordSet: new Set(words.map(normalize)),
        triesLeft: STARTING_TRIES,
    };

    return new Promise((resolve) => {
        const collector = channel.createMessageCollector({ time: GUESS_WINDOW_MS });

        // Side effects (points, channel messages, stopping the collector) for
        // an outcome already fully decided and committed synchronously in
        // 'collect' below — kept separate so those decisions never straddle
        // an `await`, which would otherwise let two guesses arriving close
        // together race on session.remainingGroups/triesLeft.
        const handleOutcome = async (message, outcome) => {
            const solverName = message.member?.displayName || message.author.username;

            if (outcome.type === 'correct') {
                console.log(`Connections (${runLabel}) (guild ${guild.id}): ${solverName} (${message.author.id}) solved "${outcome.group.category}".`);

                if (persist) {
                    try {
                        await pointsStore.addPuzzlePoints(guild.id, message.author.id, solverName, POINTS_PER_SOLVE);
                    } catch (error) {
                        console.error('Connections: failed to persist puzzle points:', error.message);
                    }
                }

                await channel.send(pick(flavor.connectionsCorrectLines(solverName, outcome.group.category, outcome.group.words)));

                if (outcome.solvedOut) {
                    collector.stop('solved');
                } else {
                    await channel.send({ embeds: [buildBoardEmbed(session)] });
                }
                return;
            }

            console.log(`Connections (${runLabel}) (guild ${guild.id}): wrong guess by ${solverName} (${message.author.id}) — ${outcome.triesLeft} chances left.`);
            await channel.send(pick(outcome.close ? flavor.connectionsCloseLines(outcome.triesLeft) : flavor.connectionsWrongLines(outcome.triesLeft)));

            if (outcome.outOfTries) {
                collector.stop('outOfTries');
            }
        };

        collector.on('collect', (message) => {
            if (message.author.bot) return;

            const guessWords = parseGuess(message.content);
            if (!guessWords) return;

            const normalizedGuess = guessWords.map(normalize);
            const uniqueNormalized = new Set(normalizedGuess);
            // Must be 4 distinct words that are still actually on the board —
            // anything referencing an already-solved or nonexistent word
            // isn't a real attempt at the current puzzle state, so it's
            // ignored rather than burning a chance.
            if (uniqueNormalized.size !== 4) return;
            if (![...uniqueNormalized].every((w) => session.remainingWordSet.has(w))) return;

            // ---- synchronous state resolution (no awaits above this point) ----
            const matchedGroup = session.remainingGroups.find((g) => {
                const groupSet = new Set(g.words.map(normalize));
                return groupSet.size === 4 && [...groupSet].every((w) => uniqueNormalized.has(w));
            });

            let outcome;
            if (matchedGroup) {
                session.remainingGroups = session.remainingGroups.filter((g) => g !== matchedGroup);
                matchedGroup.words.forEach((w) => session.remainingWordSet.delete(normalize(w)));
                session.solvedGroups.push(matchedGroup);
                outcome = { type: 'correct', group: matchedGroup, solvedOut: session.remainingGroups.length === 0 };
            } else {
                let bestOverlap = 0;
                for (const g of session.remainingGroups) {
                    const groupSet = new Set(g.words.map(normalize));
                    const overlap = [...uniqueNormalized].filter((w) => groupSet.has(w)).length;
                    if (overlap > bestOverlap) bestOverlap = overlap;
                }
                session.triesLeft -= 1;
                outcome = { type: 'wrong', close: bestOverlap === 3, triesLeft: session.triesLeft, outOfTries: session.triesLeft <= 0 };
            }
            // ---- end synchronous section ----

            handleOutcome(message, outcome).catch((error) =>
                console.error(`Connections (${runLabel}) (guild ${guild.id}): error handling a guess:`, error)
            );
        });

        collector.on('end', async () => {
            try {
                if (session.remainingGroups.length === 0) {
                    await channel.send(pick(flavor.connectionsWinLines()));
                } else {
                    const revealLines = session.remainingGroups.map(solvedLine).join('\n');
                    const intro = session.triesLeft <= 0 ? pick(flavor.connectionsLossLines()) : pick(flavor.connectionsTimeoutLines());
                    await channel.send(`${intro}\n${revealLines}`);
                }
            } catch (error) {
                console.error(`Connections (${runLabel}) (guild ${guild.id}): failed to post final reveal:`, error.message);
            }

            console.log(`Connections (${runLabel}) (guild ${guild.id}): session ended — ${session.solvedGroups.length}/4 solved, ${session.triesLeft} chance(s) remained.`);
            resolve();
        });

        channel.send(pick(flavor.connectionsIntroLines()))
            .then(() => channel.send({ embeds: [buildBoardEmbed(session)] }))
            .catch((error) => console.error(`Connections (${runLabel}) (guild ${guild.id}): failed to post the puzzle:`, error.message));
    });
};

// ---- entry points ----------------------------------------------------------

/* Run one puzzle.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to award points / advance the no-repeat cycle
 *                   (default: false)
 *   consumeBag    - whether this run draws from (and advances) the
 *                   no-repeat shuffle bag, vs. a plain random pick
 *                   (default: same as persist)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 *
 * Every guild's session runs concurrently (not one-after-another) since a
 * single session can stay open for hours — awaiting them sequentially would
 * mean a second guild's puzzle wouldn't even start until the first guild's
 * finished.
 */
const runConnectionsPuzzle = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        consumeBag = persist,
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const puzzle = await nextPuzzle(consumeBag);

    await Promise.all(guilds.map(async (g) => {
        try {
            const channel = targetChannel || findAnnounceChannel(g);
            if (!channel) {
                console.log(`Connections: no channel the herald can post in found in "${g.name}"; skipping.`);
                return;
            }
            await runConnectionsSession(g, channel, puzzle, persist, runLabel);
        } catch (guildError) {
            console.error(`Connections puzzle failed for guild "${g.name}":`, guildError);
        }
    }));
};

/* Register the daily Connections puzzle timer. Call once after the client is
 * ready. Fires a cron job at the window's opening moment (9:00 AM Eastern),
 * which picks a random 15-minute-aligned slot within the window and sets a
 * single timeout to actually run the puzzle at that moment — identical
 * shape to commands/passive/trivia.js's scheduleTrivia. If the bot restarts
 * between the window opening and the chosen slot, that day's puzzle is
 * skipped — no state is persisted across restarts, matching trivia and the
 * weekly recap's cron.
 */
const scheduleConnectionsPuzzle = function (client) {
    if (!cron.validate(WINDOW_CRON)) {
        console.error(`Connections: invalid cron expression "${WINDOW_CRON}"; not scheduled.`);
        return;
    }

    cron.schedule(
        WINDOW_CRON,
        () => {
            const slot = Math.floor(Math.random() * SLOT_COUNT);
            const delayMs = slot * SLOT_MINUTES * 60 * 1000;
            const fireAt = new Date(Date.now() + delayMs);
            scheduledFireAt = fireAt;

            console.log(`Connections: today's puzzle will fire at ~${fireAt.toISOString()} (slot ${slot + 1}/${SLOT_COUNT}).`);

            setTimeout(() => {
                console.log('Running scheduled Connections puzzle...');
                scheduledFireAt = null;
                runConnectionsPuzzle(client, { persist: true }).catch((error) =>
                    console.error('Scheduled Connections puzzle failed:', error)
                );
            }, delayMs);
        },
        { timezone: TIMEZONE }
    );

    console.log(`Connections puzzle scheduled: window opens "${WINDOW_CRON}" (${TIMEZONE}), random ${SLOT_MINUTES}-minute slot across ${WINDOW_HOURS}h, ${STARTING_TRIES} shared chances, open up to ${GUESS_WINDOW_MS / 60000}m.`);
};

module.exports = { scheduleConnectionsPuzzle, runConnectionsPuzzle, getScheduledFireTime };
