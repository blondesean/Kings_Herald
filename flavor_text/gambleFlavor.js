/* Flavor text for the Saturday gamble (see commands/prompts/gamble.js).
 * Each entry is a function returning its array of strings. Players are called
 * by mention or name, never "he" or "she".
 */

const gambleClosedLines = () => [
    'The herald\'s dice stay in their pouch until Saturday, good noble. Come back then and try thy luck.',
    'Gambling is for Saturdays, by royal decree. The dice are resting.',
];

const gamblePoorLines = (cost) => [
    `A roll of the herald\'s dice costs ${cost} points, and thy purse falls short.`,
];

const gambleOwnsAllLines = () => [
    'Thou already ownest every Legendary piece in the realm. The dice have nothing left to offer thee.',
];

// A losing roll. `roll` is 1 to 100; a win needs `needed` or less.
const gambleLoseLines = (mention, roll, needed) => [
    `${mention} shakes the herald\'s cup and rolls a **${roll}**. Nothing above ${needed} wins. The dice keep their secrets.`,
    `The dice tumble across the table for ${mention}: **${roll}**. So close to glory, and yet so far. A ${needed} or under was needed.`,
    `${mention} rolls a **${roll}**. The herald pockets the points with a sympathetic smile. Only ${needed} or under wins.`,
    `Clatter, clatter... **${roll}** for ${mention}. Not this time. The Legendary waits for a roll of ${needed} or less.`,
];

// A winning roll. `item` is the label, `placed` 'equipped' or 'bagged'.
const gambleWinLines = (mention, roll, item, placed) => {
    const where = placed === 'equipped' ? 'It is equipped at once.' : 'It goes to their bag.';
    return [
        `**THE DICE SPEAK!** ${mention} rolls a **${roll}** and wins **${item}**! ${where}`,
        `A roll of **${roll}**! The hall erupts as ${mention} claims **${item}**! ${where}`,
        `${mention} throws the dice like a seasoned rogue: **${roll}**! Fortune hands over **${item}**. ${where}`,
    ];
};

module.exports = {
    gambleClosedLines,
    gamblePoorLines,
    gambleOwnsAllLines,
    gambleLoseLines,
    gambleWinLines,
};
