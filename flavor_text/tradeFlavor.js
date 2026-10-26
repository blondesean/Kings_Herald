/* Flavor text for /trade (see commands/prompts/trade.js). Each entry is a
 * function returning its array of strings.
 */

// What's on the table, e.g. "**Ashbringer**" or "25 points".
const offerText = (want, points) => (want ? `**${want}**` : `${points} point${points === 1 ? '' : 's'}`);

const tradeOfferLines = (to, from, give, want, points, minutes) => [
    `${to}, hear ye! ${from} offers thee **${give}** in exchange for ${offerText(want, points)}. Thou hast ${minutes} minutes to accept or decline.`,
    `${to}! ${from} would trade **${give}** for ${offerText(want, points)}. Answer within ${minutes} minutes.`,
];

const tradeSealedLines = (from, to, give, want, points) => [
    `The trade is sealed! ${from} hands **${give}** to ${to} for ${offerText(want, points)}.`,
    `Hands are shaken and goods change hands: **${give}** goes to ${to}, and ${offerText(want, points)} to ${from}.`,
];

// Where a traded piece ended up: worn at once, or in the bag.
const tradePlacedLine = (who, name, equipped) => (equipped
    ? `${who} buckles on **${name}** at once.`
    : `**${name}** goes to ${who}'s bag.`);

const tradeDeclinedLines = (to) => [
    `${to} declines the offer. No goods change hands.`,
    `${to} shakes their head. The trade is off.`,
];

const tradeExpiredLines = (to) => [
    `${to} gave no answer in time, so the offer lapses.`,
];

const tradeSelfLines = () => [
    'One cannot trade with oneself, good noble.',
];

const tradeBotLines = () => [
    'The Herald and its kin keep no bags, good noble.',
];

const tradeEquippedLines = (name) => [
    `Thou art wearing **${name}**. Only gear in thy bag can be traded: equip another piece in its place first.`,
];

const tradeBadOfferLines = (typed) => [
    `**${typed}** is neither a piece of gear, a pet, nor a number of points, good noble.`,
];

const tradeReceiverMissingLines = (to, name) => [
    `${to} has no **${name}** to trade.`,
];

const tradeReceiverPoorLines = (to, points) => [
    `${to} does not have ${points} points to give.`,
];

const tradeGiverMissingLines = (from, name) => [
    `${from} no longer has **${name}** to trade, so the trade cannot go ahead.`,
];

const tradeChangedLines = () => [
    'A bag or purse changed while the Herald was counting. The trade is off; try again.',
];

const tradeNotForYouLines = () => [
    'This offer does not concern thee, good noble.',
];

const tradeAwaitLines = () => [
    'Thy offer stands. Await their answer.',
];

// A relic won in a trial is bound to its Echo.
const tradeUniqueLines = (name) => [
    `**${name}** chose thee, and will not be handed on. A relic stays with its Echo.`,
    `Thou mayest not trade **${name}**. It answered thy call, not another's.`,
];

module.exports = {
    tradeUniqueLines,
    tradeOfferLines,
    tradeSealedLines,
    tradePlacedLine,
    tradeDeclinedLines,
    tradeExpiredLines,
    tradeSelfLines,
    tradeBotLines,
    tradeEquippedLines,
    tradeBadOfferLines,
    tradeReceiverMissingLines,
    tradeReceiverPoorLines,
    tradeGiverMissingLines,
    tradeChangedLines,
    tradeNotForYouLines,
    tradeAwaitLines,
};
