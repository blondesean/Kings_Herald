/* Passive behavior: the Herald's daily Word Ladder puzzle.
 *
 * The daily puzzle slot (see scheduleConnectionsPuzzle in connections.js)
 * hands itself to this game on about one day in four (LADDER_CHANCE there)
 * instead of Connections. The Herald announces a start word and a target word
 * of the same length, e.g. COLD and WARM, and the whole channel builds a
 * ladder between them together: anyone can type a single word that changes
 * exactly one letter of the last word on the ladder, and it becomes the new
 * last word. Every rung must be a real word (the dictionary is
 * wordLadderWords.txt, see wordLadderGraph.js) that isn't already on the
 * ladder. The target must be reached within MAX_STEPS words, the target
 * itself counting as the last one.
 *
 * Every message is checked in this order before it can count (see the
 * 'collect' handler and applyWord):
 *   1. it is a single word (letters only, no spaces or punctuation),
 *   2. of the same length as the ladder's words,
 *   3. that is a real dictionary word,
 *   4. and differs from the last rung in exactly one position, i.e. n-1 of
 *      its n letters match the previous word in place.
 * Anything failing 1-3 is ordinary chat and is ignored. A real word of the
 * right length that fails 4 (or is already used, or comes from a member who
 * has had their turn) gets a gentle reply and costs nothing.
 *
 * Like Connections this is a team game, so each member can lay exactly one
 * rung per puzzle; a ladder of N steps needs N different people.
 *
 * Nothing can be taken back, so a wasted rung is possible. The puzzle bank
 * (wordLadderPuzzles.js) only holds puzzles solvable in 3 or 4 steps, so
 * MAX_STEPS (6) leaves room for a couple of them. After each rung the game
 * also checks (breadth-first, without reusing words) whether the target is
 * still reachable in the steps left, and ends the puzzle at once if it isn't.
 *
 * The puzzle ends when the target is reached, the steps run out, the target
 * becomes unreachable, or WINDOW_MS passes. Only a solve pays out (see
 * pointsStore.addPuzzlePoints, feeding the regular leaderboard and the recap's
 * puzzle podium): POINTS_PER_SOLVE to every member who laid a rung, the same
 * payout as Connections (all-or-nothing for the team). Otherwise the Herald
 * reveals one example route and nobody scores.
 *
 * A manual preview (/ladder) defaults to persist: false, so it awards nothing
 * and doesn't advance the no-repeat cycle. Like the other games, the session
 * lives in memory only: a restart mid-puzzle loses it (see connections.js for
 * the Fargate Spot reasoning behind the bounded window).
 *
 * Exposes:
 *   runWordLadder(client, opts) - runs one puzzle; called by the scheduler and /ladder
 *   createSession(puzzle), applyWord(session, word, user) - the pure game rules, exported for the tests
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { findPuzzleRole } = require('../../src/puzzleRole');
const wordLadderPuzzles = require('./wordLadderPuzzles');
const { isWord, differsByOneLetter, remainingDistance } = require('./wordLadderGraph');
const flavor = require('../../flavor_text');

// Words the court may add, counting the target as the last one.
const MAX_STEPS = 6;
const POINTS_PER_SOLVE = 1; // each contributor, on a full solve; same as Connections

// Same window as Connections.
const WINDOW_MS = 60 * 60 * 1000;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// ---- puzzle selection -------------------------------------------------------

const puzzleSignature = (puzzle) => `${puzzle.start}-${puzzle.target}`;

// Same no-repeat-cycle shape as commands/puzzles/connections.js's nextPuzzle,
// on its own persisted item. `null` means "not yet loaded from persistence".
let usedSignatures = null;

const nextPuzzle = async (consumeBag) => {
    const allPuzzles = wordLadderPuzzles();
    if (!consumeBag) {
        return allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
    }

    if (usedSignatures === null) {
        usedSignatures = await pointsStore.getUsedWordLadderPuzzles();
    }

    let candidates = allPuzzles.filter((p) => !usedSignatures.includes(puzzleSignature(p)));
    if (candidates.length === 0) {
        usedSignatures = [];
        candidates = allPuzzles;
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    usedSignatures.push(puzzleSignature(picked));

    try {
        await pointsStore.setUsedWordLadderPuzzles(usedSignatures);
    } catch (error) {
        console.error('Word ladder: failed to persist used-puzzle state:', error.message);
    }

    return picked;
};

// ---- game rules (pure) ----------------------------------------------------------

// Fresh state for one puzzle. Words are lowercase internally.
const createSession = (puzzle) => {
    const start = puzzle.start.toLowerCase();
    return {
        puzzle,
        start,
        target: puzzle.target.toLowerCase(),
        chain: [start],
        used: new Set([start]),
        // userId -> { displayName, word } for every member who laid a rung.
        contributors: new Map(),
        // Set once the puzzle is decided: 'solved', 'outOfSteps' or 'stuck'.
        // (A timeout is decided by the collector, not by a word.)
        result: null,
    };
};

const stepsUsed = (session) => session.chain.length - 1;

/* Apply one candidate word (already lowercase) from `user` ({ id, displayName })
 * to the session. Assumes the caller has already checked that it is a real
 * word of the right length. Returns { type, ... } where type is one of:
 *   'ended'              - the puzzle was already decided; nothing happens
 *   'alreadyContributed' - this member already laid a rung
 *   'alreadyUsed'        - the word is already on the ladder
 *   'notOneLetter'       - not exactly one letter away from the last rung
 *   'accepted'           - added to the ladder; `result` is the puzzle's new
 *                          result if this word decided it, else null
 * Everything is decided synchronously so two messages arriving close together
 * can't interleave.
 */
const applyWord = (session, word, user) => {
    if (session.result) return { type: 'ended' };
    if (session.contributors.has(user.id)) return { type: 'alreadyContributed' };
    if (session.used.has(word)) return { type: 'alreadyUsed' };

    const tail = session.chain[session.chain.length - 1];
    if (!differsByOneLetter(word, tail)) return { type: 'notOneLetter', tail };

    session.chain.push(word);
    session.used.add(word);
    session.contributors.set(user.id, { displayName: user.displayName, word });

    if (word === session.target) {
        session.result = 'solved';
    } else if (stepsUsed(session) >= MAX_STEPS) {
        session.result = 'outOfSteps';
    } else if (remainingDistance(word, session.target, session.used) > MAX_STEPS - stepsUsed(session)) {
        session.result = 'stuck';
    }

    return { type: 'accepted', result: session.result };
};

// ---- rendering -----------------------------------------------------------

const upper = (words) => words.map((w) => w.toUpperCase());

const buildBoardEmbed = (session) =>
    new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("The Herald's Daily Puzzle: Word Ladder")
        .addFields(
            { name: 'Goal', value: `**${session.start.toUpperCase()}** to **${session.target.toUpperCase()}**` },
            { name: 'Ladder So Far', value: upper(session.chain).join(' > ') },
            { name: 'Steps', value: `${stepsUsed(session)} of ${MAX_STEPS} used`, inline: true }
        )
        .setFooter({ text: `Type one word that changes exactly one letter of the last word on the ladder. One rung per noble, and only real words count. Reach ${session.target.toUpperCase()} in ${MAX_STEPS} steps and each of you who laid a rung earns ${POINTS_PER_SOLVE} point.` })
        .setTimestamp();

// ---- one session --------------------------------------------------------------

// Runs one puzzle in one guild/channel until it ends. Only persists points
// when `persist` is true. Resolves once the session has fully ended.
const runWordLadderSession = (guild, channel, puzzle, persist, runLabel) => {
    const session = createSession(puzzle);
    const tag = `Word ladder (${runLabel}) (guild ${guild.id})`;

    return new Promise((resolve) => {
        const collector = channel.createMessageCollector({ time: WINDOW_MS });

        // Side effects for an outcome already fully decided in 'collect' below.
        const handleOutcome = async (message, solverName, word, outcome) => {
            if (outcome.type === 'alreadyContributed') {
                await channel.send(pick(flavor.wordLadderAlreadyContributedLines(solverName)));
            } else if (outcome.type === 'alreadyUsed') {
                await channel.send(pick(flavor.wordLadderAlreadyUsedLines(solverName, word.toUpperCase())));
            } else if (outcome.type === 'notOneLetter') {
                await channel.send(pick(flavor.wordLadderNotOneLetterLines(solverName, word.toUpperCase(), outcome.tail.toUpperCase())));
            } else if (outcome.type === 'accepted') {
                console.log(`${tag}: ${solverName} (${message.author.id}) added ${word.toUpperCase()} (step ${stepsUsed(session)}/${MAX_STEPS}).`);
                await channel.send(pick(flavor.wordLadderAcceptedLines(solverName, word.toUpperCase())));
                if (outcome.result) {
                    collector.stop(outcome.result);
                } else {
                    await channel.send({ embeds: [buildBoardEmbed(session)] });
                }
            }
        };

        collector.on('collect', (message) => {
            if (message.author.bot) return;

            // Only a single alphabetic word of the right length is an attempt;
            // anything else, including a non-word, is ordinary chat.
            const word = message.content.trim().toLowerCase();
            if (word.length !== session.start.length || !/^[a-z]+$/.test(word)) return;
            if (!isWord(word)) return;

            const solverName = message.member?.displayName || message.author.username;
            const outcome = applyWord(session, word, { id: message.author.id, displayName: solverName });
            if (outcome.type === 'ended') return;

            handleOutcome(message, solverName, word, outcome).catch((error) =>
                console.error(`${tag}: error handling a word:`, error)
            );
        });

        collector.on('end', async () => {
            const result = session.result || 'timeout';
            const solved = result === 'solved';

            try {
                if (solved) {
                    await channel.send(`${pick(flavor.wordLadderWinLines(stepsUsed(session)))}\n${upper(session.chain).join(' > ')}`);
                } else {
                    const intro = result === 'outOfSteps' ? flavor.wordLadderOutOfStepsLines()
                        : result === 'stuck' ? flavor.wordLadderStuckLines()
                            : flavor.wordLadderTimeoutLines();
                    await channel.send(`${pick(intro)}\n${pick(flavor.wordLadderRevealLines(puzzle.route))}`);
                }
            } catch (error) {
                console.error(`${tag}: failed to post the final message:`, error.message);
            }

            // Only a solve pays out; persist gates it the same way as every
            // other puzzle side effect (a preview never inflates anyone's total).
            if (solved && persist) {
                for (const [userId, { displayName }] of session.contributors) {
                    try {
                        await pointsStore.addPuzzlePoints(guild.id, userId, displayName, POINTS_PER_SOLVE);
                    } catch (error) {
                        console.error('Word ladder: failed to persist puzzle points:', error.message);
                    }
                }
            }

            console.log(`${tag}: ended (${result}) — ladder ${upper(session.chain).join(' > ')}, ${session.contributors.size} contributor(s)${solved ? `, awarded ${POINTS_PER_SOLVE} point each${persist ? '' : ' (preview: not persisted)'}` : ', no points awarded'}.`);
            resolve();
        });

        // Only the real scheduled puzzle pings signed-up members
        // (/puzzle_signup) — preview runs shouldn't spam them.
        const role = persist ? findPuzzleRole(guild) : null;
        const intro = pick(flavor.wordLadderIntroLines(session.start.toUpperCase(), session.target.toUpperCase(), MAX_STEPS));

        channel.send(role ? `<@&${role.id}> ${intro}` : intro)
            .then(() => channel.send({ embeds: [buildBoardEmbed(session)] }))
            .catch((error) => console.error(`${tag}: failed to post the puzzle:`, error.message));
    });
};

// ---- entry point ----------------------------------------------------------------

/* Run one puzzle.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to award points / advance the no-repeat cycle
 *                   (default: false)
 *   consumeBag    - whether this run draws from (and advances) the
 *                   no-repeat bag, vs. a plain random pick (default: same as
 *                   persist)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 *
 * Every guild's session runs concurrently, since one can stay open for an hour.
 */
const runWordLadder = async function (client, options = {}) {
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
                console.log(`Word ladder: no channel the herald can post in found in "${g.name}"; skipping.`);
                return;
            }
            await runWordLadderSession(g, channel, puzzle, persist, runLabel);
        } catch (guildError) {
            console.error(`Word ladder failed for guild "${g.name}":`, guildError);
        }
    }));
};

module.exports = { runWordLadder, createSession, applyWord, MAX_STEPS, POINTS_PER_SOLVE };
