/* Flavor text for /fence (commands/prompts/fence.js): a shady dealer who can
 * get any piece of gear in the realm, for a cut, once a day. Each entry is a
 * function returning its array of strings.
 */

// The private offer. `upgrade` describes what it does for the buyer's kit.
const fenceOfferLines = (item, price, fee, upgrade) => [
    `A hooded figure leans close. "**${item}**? I can get it. ${price} for the piece, ${fee} for my trouble, ${price + fee} in all." ${upgrade} Strike the bargain?`,
    `"**${item}**, eh? Not in the merchant's stalls, but I know a man." ${price} points for the piece and ${fee} for the fence, ${price + fee} in all. ${upgrade} Strike the bargain?`,
];

// Announced in the channel once the deal is done. `buyer` is a display name.
const fencedLines = (buyer, item, equipped) => [
    equipped
        ? `A cloaked figure slips **${item}** to **${buyer}**, who wears it at once. No one saw a thing.`
        : `**${buyer}** pays the fence, and **${item}** finds its way into their bag. Ask no questions.`,
    equipped
        ? `From the shadows of the market, **${buyer}** emerges wearing **${item}**. The fence counts his coin.`
        : `**${buyer}** has dealt with the fence. **${item}** waits in their bag, and its origins are best not discussed.`,
];

const alreadyFencedLines = () => [
    '"One deal a day, friend. Come back on the morrow." The fence melts back into the crowd.',
    'The fence shakes his head. "I already did thee a favour today. Tomorrow."',
];

const fenceCannotAffordLines = (item, total) => [
    `The fence eyes thy purse and laughs. **${item}** costs ${total} points with his cut, and thou hast fewer.`,
    `"${total} points for **${item}**, and not a copper less." Thy purse is too light.`,
];

const fenceUnknownLines = (typed) => [
    `The fence scratches his chin. "**${typed}**? Never heard of it." Pick a piece from the list as thou typest.`,
];

const fenceGearOnlyLines = (name) => [
    `"**${name}**? I deal in gear, friend. Titles, classes and races are the merchant's business."`,
];

module.exports = {
    fenceOfferLines,
    fencedLines,
    alreadyFencedLines,
    fenceCannotAffordLines,
    fenceUnknownLines,
    fenceGearOnlyLines,
};
