/* The WoW character roster behind /implaying and /wowplayers: which realm
 * types, factions, races and classes the court can pick from, and the roster
 * table the herald recites.
 *
 * Each member keeps a list of characters, each { realm, faction, race, cls,
 * spec } by key (see pointsStore.getWowCharacters). Skyborne is a race of
 * both factions with a different order on each side, so a race is looked up
 * by faction and key together.
 *
 * Exposes:
 *   REALMS, FACTIONS, CLASSES, RACES, SPECS - the choices, in button order
 *   racesFor(faction) - the races of a faction
 *   classesFor(faction, race) - the classes that race may play
 *   specsFor(cls) - that class's specializations
 *   isValid(character) - whether every field fits together
 *   describe(character) - "Undead Holy Paladin of the Horde, on a Roleplay-PvP realm"
 *   sameCharacter(a, b)
 *   rosterTables(rows) - the recited roster: [{ realm, text }] per realm type
 *     with anyone on it, each a plain-text table
 *   MAX_CHARACTERS - how many one member may list
 */

const MAX_CHARACTERS = 10;

const REALMS = [
    { key: 'normal', label: 'Normal' },
    { key: 'pvp', label: 'PvP' },
    { key: 'rp', label: 'Roleplaying' },
    { key: 'rppvp', label: 'Roleplay-PvP' },
];

const FACTIONS = [
    { key: 'alliance', label: 'Alliance' },
    { key: 'horde', label: 'Horde' },
];

const CLASSES = [
    { key: 'druid', label: 'Druid' },
    { key: 'hunter', label: 'Hunter' },
    { key: 'mage', label: 'Mage' },
    { key: 'paladin', label: 'Paladin' },
    { key: 'priest', label: 'Priest' },
    { key: 'rogue', label: 'Rogue' },
    { key: 'shaman', label: 'Shaman' },
    { key: 'warlock', label: 'Warlock' },
    { key: 'warrior', label: 'Warrior' },
];

/* Each class's specializations, from Icy Veins' WoW Forever class guides.
 * Feral is one spec there that both tanks and deals melee damage; it is
 * split here so the roster shows which.
 */
const SPECS = {
    druid: [
        { key: 'balance', label: 'Balance' },
        { key: 'feraltank', label: 'Feral Tank' },
        { key: 'feraldps', label: 'Feral DPS' },
        { key: 'restoration', label: 'Restoration' },
    ],
    hunter: [
        { key: 'beastmastery', label: 'Beast Mastery' },
        { key: 'marksmanship', label: 'Marksmanship' },
        { key: 'survival', label: 'Survival' },
    ],
    mage: [
        { key: 'arcane', label: 'Arcane' },
        { key: 'fire', label: 'Fire' },
        { key: 'frost', label: 'Frost' },
    ],
    paladin: [
        { key: 'holy', label: 'Holy' },
        { key: 'protection', label: 'Protection' },
        { key: 'retribution', label: 'Retribution' },
    ],
    priest: [
        { key: 'discipline', label: 'Discipline' },
        { key: 'holy', label: 'Holy' },
        { key: 'shadow', label: 'Shadow' },
    ],
    rogue: [
        { key: 'assassination', label: 'Assassination' },
        { key: 'combat', label: 'Combat' },
        { key: 'subtlety', label: 'Subtlety' },
    ],
    shaman: [
        { key: 'elemental', label: 'Elemental' },
        { key: 'enhancement', label: 'Enhancement' },
        { key: 'restoration', label: 'Restoration' },
    ],
    warlock: [
        { key: 'affliction', label: 'Affliction' },
        { key: 'demonology', label: 'Demonology' },
        { key: 'destruction', label: 'Destruction' },
    ],
    warrior: [
        { key: 'arms', label: 'Arms' },
        { key: 'fury', label: 'Fury' },
        { key: 'protection', label: 'Protection' },
    ],
};

// label is the button; name is the roster table and the herald's sentences.
const RACES = {
    alliance: [
        { key: 'human', label: 'Human', name: 'Human', classes: ['warrior', 'hunter', 'mage', 'rogue', 'priest', 'warlock', 'paladin'] },
        { key: 'dwarf', label: 'Dwarf', name: 'Dwarf', classes: ['warrior', 'hunter', 'rogue', 'priest', 'paladin', 'shaman'] },
        { key: 'nightelf', label: 'Night Elf', name: 'Night Elf', classes: ['warrior', 'hunter', 'rogue', 'priest', 'druid'] },
        { key: 'gnome', label: 'Gnome', name: 'Gnome', classes: ['warrior', 'mage', 'rogue', 'priest', 'warlock'] },
        { key: 'skyborne', label: 'Skyborne (High Order)', name: 'Skyborne', classes: ['warrior', 'hunter', 'rogue', 'mage', 'druid'] },
    ],
    horde: [
        { key: 'orc', label: 'Orc', name: 'Orc', classes: ['warrior', 'hunter', 'rogue', 'shaman', 'mage', 'warlock'] },
        { key: 'undead', label: 'Undead', name: 'Undead', classes: ['warrior', 'paladin', 'rogue', 'priest', 'mage', 'warlock'] },
        { key: 'tauren', label: 'Tauren', name: 'Tauren', classes: ['warrior', 'hunter', 'shaman', 'druid'] },
        { key: 'troll', label: 'Troll', name: 'Troll', classes: ['warrior', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock'] },
        { key: 'skyborne', label: 'Skyborne (Windshaper)', name: 'Skyborne', classes: ['warrior', 'hunter', 'rogue', 'shaman', 'druid'] },
    ],
};

const find = (list, key) => list.find((entry) => entry.key === key) || null;

const realmOf = (key) => find(REALMS, key);
const factionOf = (key) => find(FACTIONS, key);
const classOf = (key) => find(CLASSES, key);
const raceOf = (faction, key) => find(RACES[faction] || [], key);

const racesFor = (faction) => RACES[faction] || [];

// In the class list's own order, so the buttons read the same for every race.
const classesFor = (faction, race) => {
    const entry = raceOf(faction, race);
    return entry ? CLASSES.filter((c) => entry.classes.includes(c.key)) : [];
};

const specsFor = (cls) => SPECS[cls] || [];
const specOf = (cls, key) => find(specsFor(cls), key);

const isValid = (c) => Boolean(c && realmOf(c.realm) && factionOf(c.faction)
    && classesFor(c.faction, c.race).some((cls) => cls.key === c.cls)
    && specOf(c.cls, c.spec));

const describe = (c) => {
    const race = raceOf(c.faction, c.race);
    const cls = classOf(c.cls);
    const spec = specOf(c.cls, c.spec);
    const faction = factionOf(c.faction);
    const realm = realmOf(c.realm);
    return `${race ? race.name : c.race} ${spec ? `${spec.label} ` : ''}${cls ? cls.label : c.cls} of the ${faction ? faction.label : c.faction}, on a ${realm ? realm.label : c.realm} realm`;
};

const sameCharacter = (a, b) => a.realm === b.realm && a.faction === b.faction && a.race === b.race && a.cls === b.cls && a.spec === b.spec;

// Plain-text table, columns padded to their widest cell.
const table = (header, rows) => {
    const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    const line = (cells) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd();
    return [line(header), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.map(line)].join('\n');
};

/* rows: [{ name, characters }]. One table per realm type that anyone plays
 * on, in REALMS order, sorted by member, then faction, race and class.
 */
const rosterTables = (rows) => REALMS.map((realm) => {
    const lines = [];
    for (const { name, characters } of rows) {
        for (const c of characters.filter((ch) => ch.realm === realm.key && isValid(ch))) {
            lines.push([name, factionOf(c.faction).label, raceOf(c.faction, c.race).name, classOf(c.cls).label, specOf(c.cls, c.spec).label]);
        }
    }
    lines.sort((a, b) => {
        for (let i = 0; i < a.length; i++) {
            const order = a[i].localeCompare(b[i], undefined, { numeric: true, sensitivity: 'base' });
            if (order) return order;
        }
        return 0;
    });
    return lines.length ? { realm: realm.label, count: lines.length, text: table(['Member', 'Faction', 'Race', 'Class', 'Spec'], lines) } : null;
}).filter(Boolean);

module.exports = {
    REALMS,
    FACTIONS,
    CLASSES,
    RACES,
    SPECS,
    MAX_CHARACTERS,
    realmOf,
    factionOf,
    classOf,
    raceOf,
    specOf,
    racesFor,
    classesFor,
    specsFor,
    isValid,
    describe,
    sameCharacter,
    rosterTables,
};
