/* Coordinates the scheduled games that share the announce channel and a
 * random daily time slot — trivia (and its subjective variants: would you
 * rather, ranking), the puzzle slot (Connections or Word Ladder) and the boss
 * encounter — so their open windows never land on top of each other. WoW
 * Trivia Wednesdays runs in its own channel and isn't part of this; duels,
 * confirmation prompts and Death Roll are member-initiated, not scheduled,
 * so they don't need coordinating either.
 *
 * The shop isn't placed: it opens on its own cron at noon Eastern (9 AM
 * Pacific) and closes on another at midnight Eastern, with an announcement.
 * The games keep clear of the noon slot (SHOP_SLOT), and of 9 AM for the
 * morning lore drops, so neither post
 * never lands on top of one of them.
 *
 * Each game's *kind* has to be decided here, before placement, because the
 * kind decides how long its window stays open (a would-you-rather round is
 * open for 3 hours, a factual question for 30 minutes, and so on) — and the
 * placement below needs to know every window's length to keep them apart.
 * A single 9 AM Eastern cron rolls the kinds, places their windows in the
 * shared 9 AM-9 PM span with a buffer between each, then a setTimeout
 * per game fires it at its chosen moment, passing the already-rolled kind so
 * the game doesn't roll it again.
 *
 * This replaces each game's own cron+timeout scheduler (the old
 * scheduleTrivia/scheduleConnectionsPuzzle/scheduleShop); their run*
 * functions (runTrivia, runConnectionsPuzzle, runWordLadder, openShopNow)
 * are unchanged and still used directly by their preview commands.
 *
 * Exposes:
 *   scheduleDailyLineup(client) - registers the daily crons (call once, on ready)
 * The daily boss encounter (commands/passive/encounter.js) is placed the
 * same way, reserving ENCOUNTER_WINDOW_MS: three hours to form the party plus a
 * quarter hour for the battle and loot rolls, and never before 9 AM Pacific
 * (ENCOUNTER_EARLIEST_SLOT).
 *
 *   getFireTime(game) - the Date 'trivia' | 'puzzle' | 'shop' | 'encounter' is armed to
 *                        fire today, or null; backs /harold_time
 */

const cron = require('node-cron');
const { runTrivia, rollToday } = require('../commands/passive/trivia');
const { runConnectionsPuzzle } = require('../commands/puzzles/connections');
const { runWordLadder } = require('../commands/puzzles/wordLadder');
const { openShopNow, closeShopNow } = require('../commands/passive/shop');
const { runEncounter, JOIN_WINDOW_MS, LOOT_RESOLVE_MS } = require('../commands/passive/encounter');

// The shared window: 9 AM to 9 PM Eastern, 48 fifteen-minute slots.
const WINDOW_CRON = '0 9 * * *';
const TIMEZONE = 'America/New_York';
const WINDOW_HOURS = 12;
const SLOT_MINUTES = 15;
const SLOT_MS = SLOT_MINUTES * 60 * 1000;
const SLOT_COUNT = (WINDOW_HOURS * 60) / SLOT_MINUTES;

// The shop opens at noon Eastern, 9 AM Pacific, and closes at midnight
// Eastern. Noon is slot 12 of the window, and no game's window may touch it.
const SHOP_OPEN_CRON = '0 12 * * *';
const SHOP_CLOSE_CRON = '0 0 * * *';
const SHOP_SLOT = 12;

// The encounter starts after 9 AM Pacific, so the west coast is up for it:
// the slot after the shop's, 12:15 PM Eastern at the earliest.
const ENCOUNTER_EARLIEST_SLOT = SHOP_SLOT + 1;

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
const ENCOUNTER_WINDOW_MS = JOIN_WINDOW_MS + LOOT_RESOLVE_MS;

// The Date each game is armed to fire today, or null once it has fired (or
// before the window has opened). In memory only, like the old per-game
// versions — a restart loses today's placement, same as before.
const fireTimes = { trivia: null, puzzle: null, shop: null, encounter: null };
const getFireTime = (game) => fireTimes[game] || null;

// Slots no game may touch: 9 AM, when the morning lore drops post (see
// src/campaign.js), and noon, when the shop opens.
const RESERVED_SLOTS = [0, SHOP_SLOT];

// The reserved slot a game running over slots [start, end) would touch,
// counting a game that ends right on it, since its wrap-up posts then; or -1.
const reservedHit = (start, end) => RESERVED_SLOTS.find((slot) => start <= slot && slot <= end) ?? -1;

/* Picks a non-overlapping start slot (in SLOT_MINUTES units, 0-based) for
 * each duration in `durationsMs`, within a SLOT_COUNT-slot window, at least
 * BUFFER_SLOTS apart, clear of RESERVED_SLOTS, and no earlier than its entry in
 * `earliest` (a slot; missing means the window's start). Tries random placements first
 * (fast, and keeps every day's lineup differently shaped); if 500 random
 * tries all collide — very unlikely given how much slack the window has —
 * falls back to packing them back-to-back in a random order, stepping over
 * the shop's slot, which always fits unless the total duration plus buffers
 * exceeds the window (logged, not thrown, since a slightly-overrun trivia
 * round is a far smaller problem than a crashed scheduler).
 */
const placeSlots = (durationsMs, random = Math.random, earliest = []) => {
    const lengths = durationsMs.map((ms) => Math.ceil(ms / SLOT_MS));
    const firstSlot = (i) => earliest[i] || 0;
    const order = durationsMs.map((_, i) => i).sort(() => random() - 0.5);

    for (let attempt = 0; attempt < 500; attempt++) {
        const starts = new Array(durationsMs.length);
        const busy = []; // [start, end) in slots, buffer already folded in
        let ok = true;
        for (const i of order) {
            const length = lengths[i];
            const latestStart = SLOT_COUNT - length;
            if (latestStart < firstSlot(i)) { ok = false; break; }
            const start = firstSlot(i) + Math.floor(random() * (latestStart - firstSlot(i) + 1));
            const end = start + length;
            if (reservedHit(start, end) >= 0 || busy.some(([bs, be]) => start < be + BUFFER_SLOTS && bs < end + BUFFER_SLOTS)) {
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
    const used = lengths.reduce((a, b) => a + b, 0) + BUFFER_SLOTS * (lengths.length - 1) + RESERVED_SLOTS.length;
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
        cursor = Math.max(cursor, firstSlot(i));
        for (let hit = reservedHit(cursor, cursor + lengths[i]); hit >= 0; hit = reservedHit(cursor, cursor + lengths[i])) cursor = hit + 1;
        starts[i] = cursor;
        cursor += lengths[i] + BUFFER_SLOTS;
    });
    return starts;
};

/* Register the daily lineup. Call once after the client is ready. Fires at
 * 9 AM Eastern: rolls each game's kind, places their windows, and arms a
 * setTimeout for each. If the bot restarts between 9 AM and a chosen fire
 * time, that game is skipped for the day — no state persisted across
 * restarts, same as the schedulers this replaces. Two more crons open the
 * shop at noon and close it at midnight Eastern.
 */
const scheduleDailyLineup = function (client) {
    for (const expression of [WINDOW_CRON, SHOP_OPEN_CRON, SHOP_CLOSE_CRON]) {
        if (!cron.validate(expression)) {
            console.error(`Daily lineup: invalid cron expression "${expression}"; not scheduled.`);
            return;
        }
    }

    cron.schedule(
        WINDOW_CRON,
        () => {
            const roll = rollToday();
            const subjectiveKind = roll.subjective ? (Math.random() < RANKED_SHARE ? 'ranking' : 'wouldYouRather') : null;
            const triviaWindowMs = !roll.subjective ? TRIVIA_WINDOW_MS
                : subjectiveKind === 'ranking' ? RANKING_WINDOW_MS : WYR_WINDOW_MS;
            const ladder = Math.random() < LADDER_CHANCE;

            const [triviaSlot, puzzleSlot, encounterSlot] = placeSlots(
                [triviaWindowMs, PUZZLE_WINDOW_MS, ENCOUNTER_WINDOW_MS],
                Math.random,
                [0, 0, ENCOUNTER_EARLIEST_SLOT]
            );
            const windowOpenedAt = Date.now();
            const slotTime = (slot) => windowOpenedAt + slot * SLOT_MS;

            fireTimes.trivia = new Date(slotTime(triviaSlot));
            fireTimes.puzzle = new Date(slotTime(puzzleSlot));
            fireTimes.shop = new Date(slotTime(SHOP_SLOT));
            fireTimes.encounter = new Date(slotTime(encounterSlot));

            const triviaKindLabel = !roll.subjective ? `factual${roll.seasonal ? ', seasonal' : ''}` : subjectiveKind;
            console.log(
                `Daily lineup: trivia (${triviaKindLabel}) at ~${fireTimes.trivia.toISOString()}, ` +
                `puzzle (${ladder ? 'Word Ladder' : 'Connections'}) at ~${fireTimes.puzzle.toISOString()}, ` +
                `encounter at ~${fireTimes.encounter.toISOString()}.`
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
                fireTimes.encounter = null;
                runEncounter(client, { persist: true }).catch((error) =>
                    console.error('Scheduled encounter failed:', error)
                );
            }, slotTime(encounterSlot) - Date.now());
        },
        { timezone: TIMEZONE }
    );

    cron.schedule(
        SHOP_OPEN_CRON,
        () => {
            fireTimes.shop = null;
            openShopNow(client, { persist: true }).catch((error) => console.error('Scheduled shop opening failed:', error));
        },
        { timezone: TIMEZONE }
    );

    cron.schedule(
        SHOP_CLOSE_CRON,
        () => {
            closeShopNow(client).catch((error) => console.error('Scheduled shop closing failed:', error));
        },
        { timezone: TIMEZONE }
    );

    console.log(`Daily lineup scheduled: window opens "${WINDOW_CRON}" (${TIMEZONE}), trivia/puzzle/encounter placed without overlap across ${WINDOW_HOURS}h, clear of the shop, which opens "${SHOP_OPEN_CRON}" and closes "${SHOP_CLOSE_CRON}".`);
};

module.exports = { scheduleDailyLineup, getFireTime, placeSlots, SLOT_COUNT, SLOT_MINUTES, SHOP_SLOT, ENCOUNTER_EARLIEST_SLOT, RESERVED_SLOTS };
