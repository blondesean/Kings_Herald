/* Flavor text for pets (see src/pets.js, /buy, /pet, /petequip, /equip and
 * commands/passive/petCalls.js). Each entry is a function returning its array
 * of strings. `kind` is the pet's color and species, such as "Ginger Cat";
 * `description` adds its trait, such as "Ginger Cat with thick stripes".
 * Owners are called by name or mention, never "he" or "she".
 */

// A pet was bought and named. `atSide` is true when it went straight to the
// buyer's side, false when it went to their bank.
const petAdoptedLines = (mention, name, description, atSide) => {
    const where = atSide
        ? `${name} now stays at thy side and lends thee fit while happy.`
        : `${name} waits in thy bank; \`/equip ${name}\` brings it to thy side.`;
    return [
        `${mention} adopts a **${description}** and names it **${name}**! ${where}`,
        `Hark! The merchant hands ${mention} a **${description}**, henceforth known as **${name}**. ${where}`,
        `A new companion for ${mention}: **${name}**, a **${description}**. ${where}`,
    ];
};

const petNeedsNameLines = () => [
    'A pet must have a name before it goes home, good noble. Try `/buy item:pet name:<name>`.',
    'The merchant will not hand over a nameless beast. Give it a name with `/buy item:pet name:<name>`.',
];

const petBadNameLines = (max) => [
    `That name will not do. A pet's name is up to ${max} letters, and may hold spaces, apostrophes and hyphens, nothing more.`,
    `The scribe cannot write that on a collar. Keep it to ${max} letters, spaces, apostrophes and hyphens.`,
];

const petNameTakenLines = (name) => [
    `Thou already hast a pet called **${name}**. Two would never know which is being called.`,
];

const petAdoptedAlreadyLines = () => [
    'Alas, today\'s pet has already found a home. The merchant will have another tomorrow.',
    'Too slow, good noble! Another has already adopted today\'s pet.',
];

const petCannotAffordLines = (price) => [
    `A pet costs ${price} points, good noble, and thy purse falls short.`,
];

// /pet. `wasUnhappy` is true when the pet had grown restless.
const petPettedLines = (name, kind, wasUnhappy) => (wasUnhappy
    ? [
        `**${name}** the ${kind} forgives thee at once and is happy again. All is well in the kennels.`,
        `At long last! **${name}** leans into thy hand, and the sulking is over.`,
        `**${name}** pretends to be cross for a moment, then gives in completely. Happy once more!`,
    ]
    : [
        `**${name}** the ${kind} basks in the attention.`,
        `Thou givest **${name}** a fond scratch. Contentment all round.`,
        `**${name}** accepts the affection as is only proper for a pet of the court.`,
    ]);

const petNoPetLines = () => [
    'Thou hast no pet at thy side to pet, good noble. The merchant sells one each day.',
    'There is no pet at thy side. Bring one from thy bank with `/equip <name>`, or adopt one from the shop.',
];

// /petequip. `displaced` is the name of the item it held before, or null.
const petEquippedLines = (petName, itemName, displaced) => {
    const back = displaced ? ` The ${displaced} goes back to thy bag.` : '';
    return [
        `**${petName}** now carries the **${itemName}** proudly.${back}`,
        `**${petName}** takes the **${itemName}** and will not let go of it.${back}`,
    ];
};

const petNoItemLines = (typed) => [
    `There is no gear called "${typed}" in thy bag for thy pet to hold.`,
];

// /equip with a pet's name. `old` is the pet sent to the bank, or null.
const petSwappedLines = (name, old) => {
    const back = old ? ` **${old}** settles into thy bank for a rest.` : '';
    return [
        `**${name}** comes to thy side.${back}`,
        `**${name}** bounds over to join thee.${back}`,
    ];
};

// A traded pet arriving. `atSide` is true when it went to the new owner's side.
const tradePetPlacedLine = (who, name, atSide) => (atSide
    ? `**${name}** goes straight to ${who}'s side.`
    : `**${name}** settles into ${who}'s bank.`);

const petAlreadyAtSideLines = (name) => [
    `**${name}** is already at thy side, good noble.`,
];

// The morning call of a restless pet. `owner` is a mention, `sound` a verb
// phrase such as "meows" or "beats its chest".
const petMorningLines = (name, owner, kind, sound) => [
    `**${name}**, ${owner}'s ${kind}, ${sound} at the castle gates. It has not been petted in a week and is most unhappy.`,
    `The whole court hears it: **${name}** the ${kind} ${sound} for ${owner}. A week without a pat, and it shows.`,
    `${owner}, thy ${kind} **${name}** ${sound} at the foot of thy bed. It wants a pat, and it wants it now.`,
];

const petMorningFooterLines = () => [
    '*An unhappy pet costs its owner fit. Use `/pet` to set things right.*',
];

module.exports = {
    petAdoptedLines,
    petNeedsNameLines,
    petBadNameLines,
    petNameTakenLines,
    petAdoptedAlreadyLines,
    petCannotAffordLines,
    petPettedLines,
    petNoPetLines,
    petEquippedLines,
    petNoItemLines,
    petSwappedLines,
    tradePetPlacedLine,
    petAlreadyAtSideLines,
    petMorningLines,
    petMorningFooterLines,
};
