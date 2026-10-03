/* Flavor text for the Fit Duel (see commands/prompts/duel.js). A Fit Duel is
 * settled by the fit scores of both duelists' equipped gear, so the result
 * reads as a physical clash: the better-armoured duelist is praised, and the
 * lesser-armoured one wins through an upset, a chink in the armour, or luck.
 * Each entry is a function returning its array of strings.
 */

// Opens the clash. Names are display names, fits are the numbers.
const fitDuelOpenLines = (challenger, target) => [
    `No dice, no coin, no stones: the Herald weighs the armour of ${challenger} against ${target}, and the blades are drawn!`,
    `The court looks over the kit of both nobles, ${challenger} and ${target}. Steel will decide this one!`,
];

// The better-fitted duelist wins: flatter their gear and strength.
const fitDuelFavoredLines = (winner, loser, winnerFit, loserFit) => [
    `${winner} steps forward in gleaming gear (fit ${winnerFit} against ${loserFit}), and ${loser} simply cannot match such armour!`,
    `A flattering victory: ${winner}'s kit is simply the finer, and their strength carries the field over ${loser}.`,
    `The Herald nods: ${winner}'s equipment spoke for them, and ${loser} could only admire the armour as it fell.`,
];

// The lesser-fitted duelist wins: an upset, an underdog, a chink in the armour.
const fitDuelUpsetLines = (winner, loser, winnerFit, loserFit) => [
    `An upset! ${loser}'s armour was the finer (fit ${loserFit} to ${winnerFit}), yet ${winner} found a chink in it and struck true!`,
    `Against all odds, the underdog ${winner} wins: a gap in ${loser}'s harness, one lucky thrust, and the court gasps.`,
    `The court had bet on the heavier kit, but ${winner} slipped past the plate and found the weak point!`,
];

// Equal fit: no edge on paper, so the duel is decided on the field.
const fitDuelEvenLines = (winner, loser) => [
    `Evenly matched in kit, ${winner} and ${loser} trade blows until ${winner} finds the opening.`,
    `Neither noble's armour was any finer than the other's, and in the end ${winner} simply fought harder.`,
];

// A duelist with no gear at all (fit 0) against a geared one. The unarmoured
// duelist always loses; the lines describe how underprepared they were.
const fitDuelUnarmoredLines = (unarmored, geared) => [
    `${unarmored} stepped into the lists in plain cloth, with not a single piece of kit, and ${geared} ran them through in their full armour. A thoroughly unprepared showing.`,
    `${unarmored} came to meet a seasoned veteran with bare arms and no armour to speak of. ${geared} did not even need to try hard.`,
    `The Herald winces: ${unarmored} had nothing to shield them, and ${geared}'s veteran kit made the fight a formality.`,
];

// Both duelists have no gear: neither has an edge, so it's a coin toss.
const fitDuelBareHandedLines = (challenger, target) => [
    `Neither ${challenger} nor ${target} wears a stitch of armour, so the duel is a scrap of bare fists and luck. The coin of fate decides.`,
    `Two unarmoured nobles face off in plain cloth. With nothing to choose between them, the court waits for the outcome of the scuffle.`,
];

// The odds shown on the challenge post.
const fitDuelOddsLine = (challenger, challengerFit, challengerPct, target, targetFit, targetPct) =>
    `Odds: **${challenger}** ${challengerPct}% (fit ${challengerFit}), **${target}** ${targetPct}% (fit ${targetFit}). Thy kit decides it, not the dice.`;

module.exports = {
    fitDuelOpenLines,
    fitDuelFavoredLines,
    fitDuelUpsetLines,
    fitDuelEvenLines,
    fitDuelUnarmoredLines,
    fitDuelBareHandedLines,
    fitDuelOddsLine,
};
