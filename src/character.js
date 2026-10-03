/* Shared: the character sheet (gear, title, class, race) and the pure rules
 * around it. No Discord or DynamoDB calls here, so it's easy to test.
 *
 * A character is stored on the member's points-ledger item:
 *   gear  - { [slot]: itemId } for equipped items (see GEAR_SLOTS)
 *   bag   - [itemId, ...] owned gear not currently equipped (duplicates allowed)
 *   title, class, race - a single catalog id each (class defaults to peasant)
 *
 * Exposes:
 *   fitScore(gear) - total price of the equipped gear (the /nobility figure)
 *   bagBySlot(bag) - { [slot]: [entry, ...] } for /bank
 *   renderSheet({ displayName, character }) - the /flex block, as a string
 *   equipPlan(character, itemId) - the new { gear, bag } if the item is equipped,
 *                                  or null if it isn't in the bag
 */

const { GEAR_SLOTS, DEFAULT_CLASS, findEntry } = require('../commands/passive/shopCatalog');
const { POSES, poseLines } = require('./poses');

const WIDTH = 42; // inner width of the /flex box, in characters

// The stick figure beside the box (poses live in src/poses.js). Its head sits
// on the Helm row, four rows below the top of the box.
const FIGURE_TOP = 4;
const figureRows = (pose) => {
    const lines = poseLines(pose);
    return [...Array(FIGURE_TOP).fill(''), ...lines];
};
const FIGURE_WIDTH = Math.max(...POSES.flatMap((pose) => pose.lines.map((line) => line.length)));

const fitScore = (gear = {}) =>
    Object.values(gear)
        .map((id) => findEntry(id))
        .filter(Boolean)
        .reduce((total, entry) => total + entry.price, 0);

const bagBySlot = (bag = []) => {
    const bySlot = {};
    for (const slot of GEAR_SLOTS) bySlot[slot] = [];
    for (const id of bag) {
        const entry = findEntry(id);
        if (entry && bySlot[entry.slot]) bySlot[entry.slot].push(entry);
    }
    return bySlot;
};

// Pads or cuts `text` to exactly `length` characters, so the box lines up.
const fit = (text, length) => (text.length > length ? `${text.slice(0, length - 1)}~` : text.padEnd(length));

// One boxed row, e.g. "| text ... |".
const row = (text) => `| ${fit(text, WIDTH - 4)} |`;

const rule = () => `+${'-'.repeat(WIDTH - 2)}+`;

/* The /flex block. `displayName` is the member's name; `character` is the
 * stored character (may be empty for a brand-new member).
 */
const renderSheet = ({ displayName, character = {} }) => {
    const title = findEntry(character.title);
    const classEntry = findEntry(character.class) || DEFAULT_CLASS;
    const race = findEntry(character.race);

    const nameLine = title ? `${displayName}, ${title.name}` : displayName;
    const raceClassLine = `${race ? race.name : 'Unknown'}  |  ${classEntry.name}`;

    const lines = [rule(), row(nameLine), row(raceClassLine), rule()];
    for (const slot of GEAR_SLOTS) {
        const item = findEntry((character.gear || {})[slot]);
        const label = slot.charAt(0).toUpperCase() + slot.slice(1);
        lines.push(row(`${fit(label, 7)} ${item ? (item.short || item.name) : '(empty)'}`));
    }
    lines.push(rule());
    lines.push(row(`Fit score: ${fitScore(character.gear)}`));
    lines.push(rule());
    // The figure goes beside the box, one figure line per sheet line.
    const figure = figureRows(character.pose);
    return lines.map((line, i) => `${(figure[i] || '').padEnd(FIGURE_WIDTH)}  ${line}`).join('\n');
};

/* Equipping moves the item out of the bag into its slot. Whatever was in the
 * slot goes back into the bag, so nothing is lost. Returns null if the item
 * isn't in the bag or isn't gear.
 */
const equipPlan = (character = {}, itemId) => {
    const entry = findEntry(itemId);
    const bag = [...(character.bag || [])];
    const index = bag.indexOf(itemId);
    if (!entry || !GEAR_SLOTS.includes(entry.slot) || index === -1) return null;

    bag.splice(index, 1);
    const gear = { ...(character.gear || {}) };
    if (gear[entry.slot]) bag.push(gear[entry.slot]);
    gear[entry.slot] = itemId;
    return { gear, bag };
};

// The entry whose name (or id) matches what someone typed, ignoring case and
// surrounding spaces, or null. Items are matched by full name only, so typing
// "fire" won't guess "Fire Cape".
const matchEntry = (entries, typed) => {
    const wanted = String(typed || '').trim().toLowerCase();
    if (!wanted) return null;
    return entries.find((entry) =>
        entry.name.toLowerCase() === wanted || (entry.short && entry.short.toLowerCase() === wanted) || entry.id === wanted
    ) || null;
};

module.exports = { fitScore, bagBySlot, renderSheet, equipPlan, matchEntry, WIDTH };
