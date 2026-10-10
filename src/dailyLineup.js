/* Coordinates the three scheduled games that share the announce channel and
 * a random daily time slot — trivia (and its subjective variants: would you
 * rather, ranking), the puzzle slot (Connections or Word Ladder), and the
 * shop — so their open windows never land on top of each other. WoW Trivia
 * Wednesdays runs in its own channel and isn't part of this; duels,
 * confirmation prompts and Death Roll are member-initiated, not scheduled,
 * so they don't need coordinating either.
 *
 * Each game's *kind* has to be decided here, before placement, because the
 * kind decides how long its window stays open (a would-you-rather round is
 * open for 3 hours, a factual question for 30 minutes, and so on) — and the
 * placement below needs to know every window's length to keep them apart.
 * A single 9 AM Eastern cron rolls all three kinds, places their windows in
 * the shared 9 AM-9 PM span with a buffer between each, then a setTimeout
 * per game fires it at its chosen moment, passing the already-rolled kind so
 * the game doesn't roll it again.
 *
 * This replaces each game's own cron+timeout scheduler (the old
 * scheduleTrivia/scheduleConnectionsPuzzle/scheduleShop); their run*
 * functions (runTrivia, runConnectionsPuzzle, runWordLadder, openShopNow)
 * are unchanged and still used directly by their preview commands.
 *
 * Exposes:
 *   scheduleDailyLineup(client) - registers the daily cron (call once, on ready)
 * The daily boss encounter (commands/passive/encounter.js) is placed the
 * same way, reserving ENCOUNTER_WINDOW_MS: an hour to form the party plus an
 * hour for need/greed/pass.
 *
 *   getFireTime(game) - the Date 'trivia' | 'puzzle' | 'shop' | 'encounter' is armed to
 *                        fire today, or null; backs /harold_time
 */

const cron = require('node-cron');
const { runTrivia, rollToday } = require('../commands/passive/trivia');
const { runConnectionsPuzzle } = require('../commands/puzzles/connections');
const { runWordLadder } = require('../commands/puzzles/wordLadder');
const { openShopNow } = require('../commands/passive/shop');
const { runEncounter, JOIN_WINDOW_MS, LOOT_WINDOW_MS } = require('../commands/passive/encounter');

// The shared window: 9 AM to 9 PM Eastern. Shop needs to fit inside this
// (its stock resets at midnight, and it's open for 3 hours), so the other two
// games use the same span rather than their old 9 AM-to-midnight window —
// simpler to reason about, and 48 fifteen-minute slots is still plenty of
// spread for a 12-hour day.
const WINDOW_CRON = '0 9 * * *';
const TIMEZONE = 'America/New_York';
const WINDOW_HOURS = 12;
const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES;

// At least one empty slot between any two games' windows, so a wrap-up
// message and the next game's opening post don't land in the same breath.
const BUFFER_SLOTS = 1;

// Mirrors trivia.js's own RANKED_SHARE and connections.js's own LADDER_CHANCE
// — kept here too since the kind has to be rolled before those modules run.
const RANKED_SHARE = 0.5;
const LADDER_CHANCE = 0.5;

const TRIVIA_WINDOW_MS = 30 * 60 * 1000;
const WYR_WINDOW_MS = 3 * 60 * 60 * 1000;
const RANKING_WINDOW_MS = 30 * 60 * 1000;
const PUZZLE_WINDOW_MS = 60 * 60 * 1000;
const SHOP_WINDOW_MS = 3 * 60 * 60 * 1000;
const ENCOUNTER_WINDOW_MS = JOIN_WINDOW_MS + LOOT_WINDOW_MS;

// The Date each game is armed to fire today, or null once it has fired (or
// before the window has opened). In memory only, like the old per-game
// versions — a restart loses today's placement, same as before.
const fireTimes = { trivia: null, puzzle: null, shop: null, encounter: null };
const getFireTime = (game) => fireTimes[game] || null;

/* Picks a non-overlapping start slot (in SLOT_MINUTES units, 0-based) for
 * each duration in `durationsMs`, within a SLOT_COUNT-slot window, at least
 * BUFFER_SLOTS apart. Tries random placements first (fast, and keeps every
 * day's lineup differently shaped); if 500 random tries all collide — very
 * unlikely given how much slack the window has — falls back to packing them
 * back-to-back in a random order, which always fits unless the total
 * duration plus buffers exceeds the window (logged, not thrown, since a
 * slightly-overrun shop or trivia round is a far smaller problem than a
 * crashed scheduler).
 */
const placeSlots = (durationsMs, random = Math.random) => {
    const lengths = durationsMs.map((ms) => Math.ceil(ms / SLOT_MS));
    const order = durationsMs.map((_, i) => i).sort(() => random() - 0.5);

    for (let attempt = 0; attempt < 500; attempt++) {
        const starts = new Array(durationsMs.length);
        const busy = []; // [start, end) in slots, buffer already folded in
        let ok = true;
        for (const i of order) {
            const length = lengths[i];
            const latestStart = SLOT_COUNT - length;
            if (latestStart < 0) { ok = false; break; }
            const start = Math.floor(random() * (latestStart + 1));
            const end = start + length;
            if (busy.some(([bs, be]) => start < be + BUFFER_SLOTS && bs < end + BUFFER_SLOTS)) {
                ok = false;
                break;
            }
            busy.push([start, end]);
            starts[i] = start;
        }
        if (ok) return starts;
    }

    // Fallback for a crowded day: lay the games out in a random order with the
    // spare slots split randomly between the gaps, so it still always fits
    // and still lands at different times each day.
    console.log('Daily lineup: random placement kept colliding; spreading the games out instead.');
    const used = lengths.reduce((a, b) => a + b, 0) + BUFFER_SLOTS * (lengths.length - 1);
    const slack = Math.max(0, SLOT_COUNT - used);
    if (used > SLOT_COUNT) {
        console.error('Daily lineup: the day\'s games do not fit the window even back-to-back — some will run past 9 PM.');
    }
    // n + 1 random cut points over the slack: the gap before each game.
    const cuts = Array.from({ length: lengths.length }, () => Math.floor(random() * (slack + 1))).sort((a, b) => a - b);
    let cursor = 0;
    let previousCut = 0;
    const starts = new Array(durationsMs.length);
    order.forEach((i, k) => {
        cursor += cuts[k] - previousCut;
        previousCut = cuts[k];
        starts[i] = cursor;
        cursor += lengths[i] + BUFFER_SLOTS;
    });
    return starts;
};

/* Register the daily lineup. Call once after the client is ready. Fires at
 * 9 AM Eastern: rolls each game's kind, places their windows, and arms three
 * setTimeouts. If the bot restarts between 9 AM and a chosen fire time, that
 * game is skipped for the day — no state persisted across restarts, same as
 * the schedulers this replaces.
 */
const scheduleDailyLineup = function (client) {
    if (!cron.validate(WINDOW_CRON)) {
        console.error(`Daily lineup: invalid cron expression "${WINDOW_CRON}"; not scheduled.`);
        return;
    }

    cron.schedule(
        WINDOW_CRON,
        () => {
            const roll = rollToday();
            const subjectiveKind = roll.subjective ? (Math.random() < RANKED_SHARE ? 'ranking' : 'wouldYouRather') : null;
            const triviaWindowMs = !roll.subjective ? TRIVIA_WINDOW_MS
                : subjectiveKind === 'ranking' ? RANKING_WINDOW_MS : WYR_WINDOW_MS;
            const ladder = Math.random() < LADDER_CHANCE;

            const [triviaSlot, puzzleSlot, shopSlot, encounterSlot] = placeSlots([triviaWindowMs, PUZZLE_WINDOW_MS, SHOP_WINDOW_MS, ENCOUNTER_WINDOW_MS]);
            const windowOpenedAt = Date.now();
            const slotTime = (slot) => windowOpenedAt + slot * SLOT_MS;

            fireTimes.trivia = new Date(slotTime(triviaSlot));
            fireTimes.puzzle = new Date(slotTime(puzzleSlot));
            fireTimes.shop = new Date(slotTime(shopSlot));
            fireTimes.encounter = new Date(slotTime(encounterSlot));

            const triviaKindLabel = !roll.subjective ? `factual${roll.seasonal ? ', seasonal' : ''}` : subjectiveKind;
            console.log(
                `Daily lineup: trivia (${triviaKindLabel}) at ~${fireTimes.trivia.toISOString()}, ` +
                `puzzle (${ladder ? 'Word Ladder' : 'Connections'}) at ~${fireTimes.puzzle.toISOString()}, ` +
                `shop at ~${fireTimes.shop.toISOString()}, encounter at ~${fireTimes.encounter.toISOString()}.`
            );

            setTimeout(() => {
                fireTimes.trivia = null;
                runTrivia(client, { persist: true, seasonal: roll.seasonal, subjective: roll.subjective, subjectiveKind }).catch((error) =>
                    console.error('Scheduled trivia round failed:', error)
                );
            }, slotTime(triviaSlot) - Date.now());

            setTimeout(() => {
                fireTimes.puzzle = null;
                const run = ladder ? runWordLadder : runConnectionsPuzzle;
                run(client, { persist: true }).catch((error) =>
                    console.error(`Scheduled ${ladder ? 'Word Ladder' : 'Connections'} puzzle failed:`, error)
                );
            }, slotTime(puzzleSlot) - Date.now());

            setTimeout(() => {
                fireTimes.shop = null;
                openShopNow(client, { persist: true }).catch((error) =>
                    console.error('Scheduled shop opening failed:', error)
                );
            }, slotTime(shopSlot) - Date.now());

            setTimeout(() => {
                fireTimes.encounter = null;
                runEncounter(client, { persist: true }).catch((error) =>
                    console.error('Scheduled encounter failed:', error)
                );
            }, slotTime(encounterSlot) - Date.now());
        },
        { timezone: TIMEZONE }
    );

    console.log(`Daily lineup scheduled: window opens "${WINDOW_CRON}" (${TIMEZONE}), trivia/puzzle/shop/encounter placed without overlap across ${WINDOW_HOURS}h.`);
};

module.exports = { scheduleDailyLineup, getFireTime, placeSlots, SLOT_COUNT, SLOT_MINUTES };
