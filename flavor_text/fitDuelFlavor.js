/* Flavor text for the Fit Duel (see commands/prompts/duel.js). A Fit Duel is
 * settled by the fit scores of both duelists' equipped gear, so it's called
 * like a broadcast from the lists: part late-night sports desk for a sport
 * nobody asked for, part runway show, all in the herald's voice. The
 * better-dressed duelist is praised, and the lesser one wins through an
 * upset, a wardrobe malfunction, or luck.
 * Each entry is a function returning its array of strings.
 */

// Opens the broadcast. Names are display names, fits are the numbers.
const fitDuelOpenLines = (challenger, target) => [
    `Good evening, lords and ladies, and welcome to the lists! The Herald coming to thee live from the royal sand, where tonight **${challenger}** and **${target}** settle their quarrel not with dice, not with coin, but with **FASHION AND STEEL**!`,
    `Hear ye, hear ye, and welcome back to the court's finest late-night sporting event, the one the minstrels said would never last! Tonight's card: **${challenger}** versus **${target}**, in a **FIT DUEL**!`,
    `The torches are lit, the bards are seated, and the Duchess of Velvet has taken her place in the front row. Lords and ladies, this is the **FIT DUEL**: **${challenger}** against **${target}**, and the Herald has a good feeling about this one!`,
];

// The build-up between the opening and the result, one post per beat, each
// beat a few seconds after the last. A line is drawn from each beat in order:
// the challenger walks, the target walks, the clash, the hush before the end.
const fitDuelBuildupBeats = (challenger, target, challengerFit, targetFit) => [
    [
        `And here comes **${challenger}** down the runway! Look at the cut of that pauldron, lords and ladies, the drape of that cloak! Fit **${challengerFit}**, and wearing every point of it!`,
        `**${challenger}** takes the lists first, and oh, the stride! Fit **${challengerFit}**. The Herald is told the boots alone cost a small barony.`,
        `First to walk: **${challenger}**, fit **${challengerFit}**! A turn at the end of the sand, a glance over the shoulder, and the front row is weeping. Bold. Fearless. Possibly overdressed.`,
    ],
    [
        `And the answer from **${target}**! Fit **${targetFit}**, and strutting like they own the castle! That is a confident walk, lords and ladies, a very confident walk.`,
        `Now **${target}** emerges, fit **${targetFit}**, to gasps from the gallery! The Herald has not seen a silhouette like that since the Spring Tourney!`,
        `**${target}** answers on the runway, fit **${targetFit}**! The Duchess of Velvet is on her feet. The Duchess of Velvet is never on her feet!`,
    ],
    [
        'And they are ENGAGED! Steel on steel, silk on silk! Sparks across the sand! The crowd cannot believe what it is seeing!',
        'A lunge! A parry! A spin that shows off the full sweep of the cape! Lords and ladies, that is either swordplay or choreography, and the Herald does not care which!',
        'Oh, what a flurry! Blades flashing, capes billowing, a gauntlet flies into the third row! A souvenir for one lucky peasant!',
    ],
    [
        'Somebody is wobbling... the crowd is on its feet... the bards have stopped playing... this is it, lords and ladies, THIS IS IT...',
        'The dust is thick over the lists... the Herald cannot see a thing... wait... WAIT... one noble is still standing...',
        'A final blow, a final twirl, and the whole court holds its breath...',
    ],
];

// Shown above the victor's figure, in their /pose.
const fitDuelVictorPoseLine = (winner, poseName) =>
    `**${winner}** takes the end of the runway and strikes the **${poseName}** pose! THE CROWD GOES WILD!`;

// The better-fitted duelist wins: flatter their gear and strength.
const fitDuelFavoredLines = (winner, loser, winnerFit, loserFit) => [
    `Fit ${winnerFit} against ${loserFit}, and it showed! ${winner} was simply better dressed for the occasion, and ${loser} leaves the sand with nothing but regrets and a ruined hem.`,
    `What a performance from ${winner}! The finer kit carried the day, and the Herald suspects ${loser} will be having words with their tailor.`,
    `Lords and ladies, that is why thou investest in quality armour. ${winner}'s kit spoke for itself, and ${loser} could only admire it on the way down.`,
];

// The lesser-fitted duelist wins: an upset, an underdog, a wardrobe malfunction.
const fitDuelUpsetLines = (winner, loser, winnerFit, loserFit) => [
    `AN UPSET! ${loser} walked in at fit ${loserFit} against ${winnerFit}, and ${winner} found the chink in that very expensive armour! The bookmakers are weeping!`,
    `Unbelievable! The underdog ${winner} takes it! A wardrobe malfunction from ${loser}, one lucky thrust, and the gallery is in absolute shambles!`,
    `The court had every coin on the heavier kit, but ${winner} slipped past the plate like it was last season's fashion! Lords and ladies, ANYTHING can happen in the lists!`,
];

// Equal fit: no edge on paper, so the duel is decided on the field.
const fitDuelEvenLines = (winner, loser) => [
    `Dressed to the very same standard, and it came down to heart! ${winner} wanted it more, and ${loser} will be thinking about this one for a long time.`,
    `Not a point of fit between them, lords and ladies, and in the end ${winner} simply out-strutted ${loser}. What a night!`,
];

// A duelist with no gear at all (fit 0) against a geared one. The unarmoured
// duelist always loses; the lines describe how underprepared they were.
const fitDuelUnarmoredLines = (unarmored, geared) => [
    `${unarmored} walked the runway in plain cloth. Plain cloth, lords and ladies! ${geared} ran them through in full armour, and frankly the Herald is embarrassed for everyone involved.`,
    `A bold choice from ${unarmored} to arrive with no kit whatsoever. A losing choice, as it turns out. ${geared} barely broke a sweat.`,
    `The Herald winces: ${unarmored} had nothing to shield them but confidence, and confidence does not stop a blade. ${geared} wins at a canter.`,
];

// Both duelists have no gear: neither has an edge, so it's a coin toss.
const fitDuelBareHandedLines = (challenger, target) => [
    `Neither ${challenger} nor ${target} wore a stitch of armour, so that was less a duel and more a slap fight in nightshirts. The Herald loved every second of it.`,
    `Two nobles, zero armour, and absolutely no shame. ${challenger} and ${target} have given the court a scrap it will never forget, however hard it tries.`,
];

// The odds shown on the challenge post.
const fitDuelOddsLine = (challenger, challengerFit, target, targetFit) =>
    `**${challenger}** stands at fit ${challengerFit}, **${target}** at fit ${targetFit}. Thy kit decides it, not the dice.`;

module.exports = {
    fitDuelOpenLines,
    fitDuelBuildupBeats,
    fitDuelVictorPoseLine,
    fitDuelFavoredLines,
    fitDuelUpsetLines,
    fitDuelEvenLines,
    fitDuelUnarmoredLines,
    fitDuelBareHandedLines,
    fitDuelOddsLine,
};
