/* Shared: pets. The species list, the procedural generator, and the pure
 * rules for a pet's mood and the fit it lends. No Discord or DynamoDB calls
 * here, so it's easy to test.
 *
 * A pet is generated from its species: a color, and one trait with a
 * modifier, such as "stripes" made "thick" or "spots" made "four". The shop
 * stocks one each day (commands/passive/shop.js), and the buyer names it.
 * A pet is stored as
 *   { id, species, color, trait, mod, name, title, item, lastPetted, adoptedAt }
 * where `title` is the free-text title its owner gave it with /pettitle, if
 * any, and `item` is the gear id it holds (see /petequip), or null. The pet a
 * member keeps at their side is `pet` on their ledger item; the rest wait in
 * `pets`, shown in /bank.
 *
 * The pet at a member's side lends PET_HAPPY_BONUS fit while happy, and
 * PET_UNHAPPY_PENALTY while unhappy. A pet is happy for PET_HAPPY_MS after
 * its owner last used /pet; a bought pet starts happy. Pets in the bank lend
 * nothing and never grow restless. The item a pet holds adds no fit.
 *
 * Exposes:
 *   SPECIES - { [key]: { name, sound, colors, traits } }
 *   generatePet(random) - a fresh, unnamed pet
 *   petKind(pet) - "Ginger Cat"
 *   petTraitText(pet) - "thick stripes"
 *   petDescription(pet) - "Ginger Cat with thick stripes"
 *   isHappy(pet, now) - petted within PET_HAPPY_MS
 *   petBonus(character, now) - the fit the pet at their side lends, or 0
 *   cleanPetName(typed) - the name, tidied, or null if it isn't allowed
 *   cleanPetTitle(typed) - the title, tidied, or null if it isn't allowed
 *   petFullName(pet) - "Biscuit, the Destroyer", or "Biscuit" untitled
 *   matchPet(pets, typed) - the pet whose name matches, ignoring case, or null
 */

const PET_PRICE = 10;
const PET_HAPPY_MS = 7 * 24 * 60 * 60 * 1000;
const PET_HAPPY_BONUS = 15;
const PET_UNHAPPY_PENALTY = -10;
const PET_NAME_MAX = 20;
const PET_TITLE_MAX = 30;

// Traits, each a list of modifiers and how the pair reads.
const trait = (mods, text) => ({ mods, text });
const TRAITS = {
    stripes: trait(['thick', 'thin', 'faint', 'bold'], (m) => `${m} stripes`),
    spots: trait(['two', 'four', 'six', 'countless'], (m) => `${m} spots`),
    fur: trait(['fluffy', 'sleek', 'shaggy', 'silky'], (m) => `${m} fur`),
    eyes: trait(['green', 'amber', 'blue', 'mismatched'], (m) => `${m} eyes`),
    tail: trait(['bushy', 'stubby', 'crooked', 'very long'], (m) => `a ${m} tail`),
    ears: trait(['floppy', 'pointed', 'nicked', 'tufted'], (m) => `${m} ears`),
    whiskers: trait(['long', 'droopy', 'twitchy', 'curled'], (m) => `${m} whiskers`),
    feathers: trait(['glossy', 'ruffled', 'speckled', 'barred'], (m) => `${m} feathers`),
    wings: trait(['broad', 'swift', 'tattered', 'golden-tipped'], (m) => `${m} wings`),
    beak: trait(['hooked', 'chipped', 'bright yellow', 'tiny'], (m) => `a ${m} beak`),
    talons: trait(['razor-sharp', 'curved', 'gleaming', 'muddy'], (m) => `${m} talons`),
    scales: trait(['shiny', 'banded', 'diamond-patterned', 'dusty'], (m) => `${m} scales`),
    fangs: trait(['long', 'tiny', 'gleaming', 'crooked'], (m) => `${m} fangs`),
    legs: trait(['hairy', 'striped', 'spindly', 'stubby'], (m) => `${m} legs`),
    eyeCount: trait(['two', 'four', 'six', 'eight'], (m) => `${m} eyes`),
    antlers: trait(['six-point', 'ten-point', 'lopsided', 'velvet'], (m) => `${m} antlers`),
    horns: trait(['short', 'curved', 'long', 'crumpled'], (m) => `${m} horns`),
    tusks: trait(['curved', 'chipped', 'long', 'stubby'], (m) => `${m} tusks`),
    bristles: trait(['wiry', 'spiky', 'grizzled', 'coarse'], (m) => `${m} bristles`),
    mane: trait(['braided', 'flowing', 'cropped', 'tangled'], (m) => `a ${m} mane`),
    shell: trait(['banded', 'scratched', 'polished', 'mossy'], (m) => `a ${m} shell`),
    back: trait(['broad', 'scarred', 'grizzled', 'mighty'], (m) => `a ${m} back`),
    grin: trait(['toothy', 'cheeky', 'lopsided', 'wide'], (m) => `a ${m} grin`),
    cheeks: trait(['stuffed', 'chubby', 'puffy', 'round'], (m) => `${m} cheeks`),
    pouch: trait(['roomy', 'tiny', 'patched', 'deep'], (m) => `a ${m} pouch`),
    paws: trait(['oversized', 'muddy', 'dainty', 'speckled'], (m) => `${m} paws`),
    snout: trait(['long', 'pink', 'scarred', 'twitchy'], (m) => `a ${m} snout`),
};

const species = (name, sound, colors, traits) => ({ name, sound, colors, traits });
const SPECIES = {
    cat: species('Cat', 'meows', ['ginger', 'black', 'white', 'grey', 'calico', 'tortoiseshell', 'cream'], ['stripes', 'spots', 'fur', 'eyes', 'tail', 'whiskers']),
    dog: species('Dog', 'barks', ['brown', 'black', 'golden', 'white', 'brindle', 'grey'], ['spots', 'fur', 'ears', 'tail', 'eyes', 'paws']),
    bird: species('Bird', 'chirps', ['red', 'blue', 'yellow', 'green', 'brown'], ['feathers', 'beak', 'wings', 'tail']),
    falcon: species('Falcon', 'screeches', ['grey', 'brown', 'slate', 'cream'], ['feathers', 'talons', 'wings', 'beak']),
    eagle: species('Eagle', 'screams', ['brown', 'golden', 'dark', 'pale'], ['feathers', 'talons', 'wings', 'beak']),
    owl: species('Owl', 'hoots', ['snowy', 'brown', 'grey', 'tawny'], ['feathers', 'eyes', 'wings', 'talons']),
    chimpanzee: species('Chimpanzee', 'hollers', ['black', 'brown', 'greying'], ['grin', 'ears', 'fur', 'eyes']),
    gorilla: species('Gorilla', 'beats its chest', ['black', 'silver', 'grey'], ['back', 'fur', 'grin', 'eyes']),
    snake: species('Snake', 'hisses', ['green', 'black', 'crimson', 'golden'], ['scales', 'fangs', 'stripes', 'eyes']),
    spider: species('Spider', 'taps all eight feet', ['black', 'brown', 'red', 'grey'], ['legs', 'eyeCount', 'fangs', 'stripes']),
    wolf: species('Wolf', 'howls', ['grey', 'white', 'black', 'tawny'], ['fur', 'fangs', 'eyes', 'tail', 'ears']),
    boar: species('Boar', 'grunts', ['brown', 'black', 'russet'], ['tusks', 'bristles', 'snout', 'tail']),
    cow: species('Cow', 'moos', ['black', 'brown', 'white', 'cream'], ['spots', 'horns', 'eyes', 'tail']),
    horse: species('Horse', 'whinnies', ['chestnut', 'black', 'grey', 'palomino', 'bay', 'white'], ['mane', 'spots', 'tail', 'eyes']),
    fox: species('Fox', 'yips', ['red', 'silver', 'white', 'grey'], ['tail', 'ears', 'fur', 'paws']),
    squirrel: species('Squirrel', 'chatters', ['red', 'grey', 'black', 'brown'], ['tail', 'cheeks', 'ears', 'fur']),
    armadillo: species('Armadillo', 'snuffles', ['grey', 'tan', 'brown'], ['shell', 'snout', 'ears', 'tail']),
    kangaroo: species('Kangaroo', 'thumps its tail', ['red', 'grey', 'tan'], ['pouch', 'ears', 'tail', 'paws']),
    deer: species('Deer', 'bleats', ['tawny', 'brown', 'red', 'white'], ['antlers', 'spots', 'ears', 'tail']),
    mouse: species('Mouse', 'squeaks', ['grey', 'brown', 'white', 'black'], ['whiskers', 'ears', 'tail', 'paws']),
};

const pickOne = (list, random) => list[Math.floor(random() * list.length)];
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const generatePet = (random = Math.random) => {
    const key = pickOne(Object.keys(SPECIES), random);
    const kind = SPECIES[key];
    const traitKey = pickOne(kind.traits, random);
    const color = pickOne(kind.colors, random);
    // A modifier repeating the color, "Yellow Bird with a bright yellow beak", is skipped.
    const mods = TRAITS[traitKey].mods.filter((m) => !m.split(/[ -]/).includes(color));
    return { species: key, color, trait: traitKey, mod: pickOne(mods, random) };
};

const speciesName = (pet) => (SPECIES[pet.species] || { name: capitalize(pet.species) }).name;
const petKind = (pet) => `${capitalize(pet.color)} ${speciesName(pet)}`;
// Falls back to "mod trait" if a trait is ever retired, so an old pet still reads.
const petTraitText = (pet) => (TRAITS[pet.trait] ? TRAITS[pet.trait].text(pet.mod) : `${pet.mod} ${pet.trait}`);
const petDescription = (pet) => `${petKind(pet)} with ${petTraitText(pet)}`;
const petSound = (pet) => (SPECIES[pet.species] || { sound: 'grumbles' }).sound;

const isHappy = (pet, now = Date.now()) => Boolean(pet) && now - (pet.lastPetted || 0) <= PET_HAPPY_MS;

const petBonus = (character = {}, now = Date.now()) => {
    if (!character.pet) return 0;
    return isHappy(character.pet, now) ? PET_HAPPY_BONUS : PET_UNHAPPY_PENALTY;
};

// Letters, spaces, apostrophes and hyphens, starting with a letter. Spaces
// are squeezed, and the first letter of each word is capitalised.
const cleanPetName = (typed) => {
    const name = String(typed || '').trim().replace(/\s+/g, ' ');
    if (!name || name.length > PET_NAME_MAX || !/^[A-Za-z][A-Za-z' -]*$/.test(name)) return null;
    return name.replace(/(^|\s)([a-z])/g, (_, space, letter) => space + letter.toUpperCase());
};

// A pet's title: letters, digits, spaces, apostrophes, commas and hyphens,
// starting with a letter, kept as typed apart from squeezed spaces, so "the
// Destroyer" keeps its lowercase "the". Null if it isn't allowed.
const cleanPetTitle = (typed) => {
    const title = String(typed || '').trim().replace(/\s+/g, ' ');
    if (!title || title.length > PET_TITLE_MAX || !/^[A-Za-z][A-Za-z0-9' ,-]*$/.test(title)) return null;
    return title;
};

// "Biscuit, the Destroyer", or just "Biscuit" with no title.
const petFullName = (pet) => (pet.title ? `${pet.name}, ${pet.title}` : pet.name);

const matchPet = (pets = [], typed) => {
    const wanted = String(typed || '').trim().toLowerCase();
    if (!wanted) return null;
    return pets.find((pet) => pet.name.toLowerCase() === wanted) || null;
};

module.exports = {
    SPECIES, TRAITS, PET_PRICE, PET_HAPPY_MS, PET_HAPPY_BONUS, PET_UNHAPPY_PENALTY, PET_NAME_MAX, PET_TITLE_MAX,
    generatePet, speciesName, petKind, petTraitText, petDescription, petSound,
    isHappy, petBonus, cleanPetName, cleanPetTitle, petFullName, matchPet,
};
