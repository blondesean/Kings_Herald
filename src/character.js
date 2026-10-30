/* Shared: the character sheet (gear, title, class, race) and the pure rules
 * around it. No Discord or DynamoDB calls here, so it's easy to test.
 *
 * A character is stored on the member's points-ledger item:
 *   gear  - { [slot]: itemId } for equipped items (see GEAR_SLOTS)
 *   bag   - [itemId, ...] owned gear not currently equipped (duplicates allowed)
 *   title, class, race - a single catalog id each (class defaults to peasant)
 *   cosmetics - [itemId, ...] titles, classes and races owned but not worn
 *
 * Exposes:
 *   fitScore(gear) - total price of the equipped gear
 *   totalFit(gear, character, now) - fitScore plus the fit the member's pet
 *                                    lends (src/pets.js), never below 0: the
 *                                    figure shown, duelled and fought with
 *   bestKit(character) - { [slot]: itemId }, the finest owned piece per slot
 *   bagBySlot(bag) - { [slot]: [entry, ...] } for /bank
 *   renderSheet({ displayName, character }) - the /flex block, as a string,
 *                                            with the pet at the bottom
 *   equipPlan(character, itemId) - the new { gear, bag } if the item is equipped,
 *                                  or null if it isn't in the bag
 *   cosmeticField(entry) - 'title', 'class' or 'race' for those entries, else null
 *   stashFor(character, field) - the id a new title, class or race would put
 *                                into cosmetics, or null
 *   wearPlan(character, itemId) - { field, value, old, cosmetics } to wear a
 *                                 title, class or race from cosmetics, or null
 */

const { GEAR_SLOTS, DEFAULT_CLASS, TITLES, CLASSES, RACES, findEntry, rarityFor } = require('../commands/passive/shopCatalog');
const { POSES, poseLines } = require('./poses');
const { petBonus, petDescription, isHappy } = require('./pets');

const WIDTH = 32; // width of the /flex box, in characters (kept narrow for phones)

// The stick figure beside the box (poses live in src/poses.js). Its head sits
// on the Helm row, four rows below the top of the box.
// The figure's head sits on the Helm row, which moves down by one when the
// name and title take two rows, so the top offset is passed in.
const figureRows = (pose, top) => {
    const lines = poseLines(pose);
    return [...Array(top).fill(''), ...lines];
};
const FIGURE_WIDTH = Math.max(...POSES.flatMap((pose) => pose.lines.map((line) => line.length)));

const fitScore = (gear = {}) =>
    Object.values(gear)
        .map((id) => findEntry(id))
        .filter(Boolean)
        .reduce((total, entry) => total + entry.price, 0);

const totalFit = (gear = {}, character = {}, now = Date.now()) => Math.max(0, fitScore(gear) + petBonus(character, now));

const bagBySlot = (bag = []) => {
    const bySlot = {};
    for (const slot of GEAR_SLOTS) bySlot[slot] = [];
    for (const id of bag) {
        const entry = findEntry(id);
        if (entry && bySlot[entry.slot]) bySlot[entry.slot].push(entry);
    }
    return bySlot;
};

// The finest kit the member owns: in each slot, whichever is worth more of
// what they wear and what's in their bag. Used for the encounter's "suit up"
// choice; nothing is actually equipped.
const bestKit = (character = {}) => {
    const gear = { ...(character.gear || {}) };
    for (const id of character.bag || []) {
        const entry = findEntry(id);
        if (!entry || !GEAR_SLOTS.includes(entry.slot)) continue;
        const worn = findEntry(gear[entry.slot]);
        if (!worn || entry.price > worn.price) gear[entry.slot] = id;
    }
    return gear;
};

// Pads or cuts `text` to exactly `length` characters, so the box lines up.
const fit = (text, length) => (text.length > length ? `${text.slice(0, length - 1)}~` : text.padEnd(length));

// One boxed row, e.g. "| text ... |".
const row = (text) => `| ${fit(text, WIDTH - 4)} |`;

const rule = () => `+${'-'.repeat(WIDTH - 2)}+`;

/* The /flex block. `displayName` is the member's name; `character` is the
 * stored character (may be empty for a brand-new member).
 */
// Splits text into lines of at most `width` characters, breaking at spaces.
// A single word longer than the width is split across lines.
const wrapText = (text, width) => {
    const out = [];
    let current = '';
    for (const word of text.split(' ')) {
        if (!current) current = word;
        else if (`${current} ${word}`.length <= width) current += ` ${word}`;
        else {
            out.push(current);
            current = word;
        }
    }
    if (current) out.push(current);
    return out.flatMap((line) => (line.length <= width ? [line] : line.match(new RegExp(`.{1,${width}}`, 'g'))));
};

const renderSheet = ({ displayName, character = {} }) => {
    const title = findEntry(character.title);
    const classEntry = findEntry(character.class) || DEFAULT_CLASS;
    const race = findEntry(character.race);

    // "Name, Title" on one row when it fits; otherwise the title drops to its own row.
    const joined = title ? `${displayName}, ${title.name}` : displayName;
    // A long title wraps onto extra rows under the name, like a long gear name.
    const nameRows = title && joined.length > WIDTH - 4
        ? [displayName, ...wrapText(title.name, WIDTH - 4)]
        : [joined];
    // Name and title are centred. Race and class are each centred in their own
    // half of the box, with the divider on the middle column.
    const inner = WIDTH - 4;
    const centredIn = (text, width) => text.padStart(Math.floor((width + text.length) / 2)).padEnd(width);
    const centred = (text) => centredIn(text, inner);
    const leftHalf = Math.floor(inner / 2);
    const raceName = race ? race.name : 'Unknown';
    const raceClassLine = `${centredIn(raceName, leftHalf)}|${centredIn(classEntry.name, inner - leftHalf - 1)}`;

    const lines = [rule(), ...nameRows.map((text) => row(centred(text))), row(raceClassLine), rule()];
    const helmRow = lines.length;
    for (const slot of GEAR_SLOTS) {
        const item = findEntry((character.gear || {})[slot]);
        const label = slot.charAt(0).toUpperCase() + slot.slice(1);
        // The slot label is right-justified, so it sits right against the item name.
        // A long name wraps onto extra bordered rows under the same slot.
        // Rarity comes first, in brackets, then the full name.
        const text = item ? `[${rarityFor(item.price)}] ${item.name}` : '(empty)';
        const chunks = wrapText(text, WIDTH - 4 - 8);
        chunks.forEach((chunk, i) => {
            // The colon sits after the slot label on its first row only.
            const start = i === 0 ? `${label.padStart(6)}: ` : ' '.repeat(8);
            lines.push(row(`${start}${chunk}`));
        });
    }
    lines.push(rule());
    lines.push(row(`Fit score: ${totalFit(character.gear, character)}`));
    lines.push(rule());
    // The pet at the member's side, under the fit score.
    const pet = character.pet;
    if (pet) {
        const held = findEntry(pet.item);
        const bonus = petBonus(character);
        const rows = [
            `Pet: ${pet.name}`,
            ...wrapText(petDescription(pet), WIDTH - 4),
            ...wrapText(`Holds: ${held ? `[${rarityFor(held.price)}] ${held.name}` : 'nothing'}`, WIDTH - 4),
            `Mood: ${isHappy(pet) ? 'Happy' : 'Unhappy'}, ${bonus > 0 ? '+' : ''}${bonus} fit`,
        ];
        rows.forEach((text) => lines.push(row(text)));
        lines.push(rule());
    }
    // The figure goes beside the box, one figure line per sheet line.
    const figure = figureRows(character.pose, helmRow);
    // One space between the figure and the box keeps the sheet at 38 characters, phone-width.
    return lines.map((line, i) => `${(figure[i] || '').padEnd(FIGURE_WIDTH)} ${line}`).join('\n');
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

// The character field a title, class or race fills, or null for anything else.
const cosmeticField = (entry) => {
    if (TITLES.includes(entry)) return 'title';
    if (CLASSES.includes(entry)) return 'class';
    if (RACES.includes(entry)) return 'race';
    return null;
};

// What goes into the cosmetics list when `field` is replaced: the old id, or
// null if there was none (the default Peasant class isn't kept).
const stashFor = (character, field) => {
    const old = character[field];
    return old && old !== DEFAULT_CLASS.id ? old : null;
};

/* Wearing a title, class or race from the cosmetics list takes it out of the
 * list and puts the one it replaces in, so nothing is lost. Returns
 * { field, value, old, cosmetics }, or null if it isn't in the list.
 */
const wearPlan = (character = {}, itemId) => {
    const entry = findEntry(itemId);
    const field = entry && cosmeticField(entry);
    const cosmetics = [...(character.cosmetics || [])];
    const index = cosmetics.indexOf(itemId);
    if (!field || index === -1) return null;

    cosmetics.splice(index, 1);
    const old = stashFor(character, field);
    if (old) cosmetics.push(old);
    return { field, value: itemId, old: character[field] || null, cosmetics };
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

module.exports = { fitScore, totalFit, bestKit, bagBySlot, renderSheet, equipPlan, cosmeticField, stashFor, wearPlan, matchEntry, WIDTH };
