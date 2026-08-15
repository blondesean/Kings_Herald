/* Flavor text: variation pools for /duel (see commands/prompts/duel.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate).
 */

// Final victory announcement, once a winner is decided. Which pool is used
// depends on who won, not chance: the one who declared the duel draws from
// the "hunter succeeded" pool if they win; the one who was challenged draws
// from the "defended their honor" pool if they're the one who prevails. The
// caller (duel.js) still picks randomly within whichever pool applies.
const duelVictoryLinesForChallenger = (winnerName, loserName) => [
    `**${winnerName}** was successful in their endeavor to defeat **${loserName}**!`,
    `**${winnerName}**'s challenge proved true, and **${loserName}** falls before them!`,
    `As they vowed, **${winnerName}** has bested **${loserName}** in single combat!`,
    `The gauntlet thrown by **${winnerName}** finds its mark — **${loserName}** is vanquished!`,
    `**${winnerName}** set out to conquer, and conquer they have — **${loserName}** yields!`,
    `Boldly declared, boldly won! **${winnerName}** triumphs over **${loserName}**!`,
    `**${winnerName}**'s ambition is rewarded — **${loserName}** falls to their design!`,
    `The hunter becomes the victor! **${winnerName}** claims dominion over **${loserName}**!`,
    `**${winnerName}** proves their word as good as their blade, defeating **${loserName}**!`,
    `What **${winnerName}** started, **${winnerName}** finished — **${loserName}** is overcome!`,
];

const duelVictoryLinesForTarget = (winnerName, loserName) => [
    `**${winnerName}** defended their honor by prevailing in the treacherous duel against **${loserName}**!`,
    `Challenged and unbowed, **${winnerName}** turns the tables on **${loserName}**!`,
    `**${winnerName}** answers the call to arms and emerges the victor over **${loserName}**!`,
    `Though summoned to battle, **${winnerName}** proves the superior — **${loserName}** falls!`,
    `**${winnerName}**'s honor remains untarnished, as **${loserName}** discovers too late!`,
    `The challenged becomes the champion! **${winnerName}** bests **${loserName}**!`,
    `**${winnerName}** did not seek this fight, but wins it all the same over **${loserName}**!`,
    `Provoked but undaunted, **${winnerName}** delivers **${loserName}** a humbling defeat!`,
    `**${winnerName}** stands tall where **${loserName}** could not, honor intact!`,
    `The challenger's gambit fails — **${winnerName}** turns aside **${loserName}**'s ambition!`,
];

// Rock Paper Scissors: an ordinary tie (not the 3rd in a row).
const rpsTieLines = () => [
    'A tie! Choose again, quickly now...',
    'Evenly matched! Once more, in secret...',
    'The fates cannot decide betwixt thee! Choose anew...',
    'A stalemate! Try thy hand once more...',
    'Neither prevails! Choose again, in secret...',
    'The scales balance perfectly! Once more...',
    'A mirrored throw! Choose anew...',
    'Deadlock! The court awaits thy next choice...',
    'Matched blow for blow! Choose once more...',
    'Fortune shrugs! Try again, in secret...',
];

// Rock Paper Scissors: every 3rd consecutive tie earns extra flavor.
const rpsEscalatingTieLines = () => [
    'Thrice now the fates refuse to choose! The court grows restless — again!',
    'Another stalemate! Surely the heavens themselves are indecisive...',
    'Yet again, deadlocked! This rivalry runs deep...',
    'The court murmurs — how many ties can two duelists manage?!',
    'Once more a tie! The Herald grows weary of counting...',
    'A third stalemate in this stretch! Fate toys with thee both...',
    'The crowd grows impatient — choose, and choose decisively!',
    'Another even match! At this rate the sun shall set before a victor emerges...',
    'The tension mounts as neither will yield, even by chance!',
    'Round upon round, still no victor! Choose once more, with vigor!',
];

// Death Roll: the roll landed on the exact same number as the ceiling it
// was given — the range didn't shrink at all this turn.
const deathRollSameRollLines = () => [
    'By my troth, the very same number! Fate mocks us all!',
    'Struck the same mark twice — how peculiar!',
    'The wheel refuses to turn even a hair!',
    'An eerie echo of the last throw!',
    'The dice remember their former face!',
    'No ground lost, no ground gained — a curious repeat!',
    'The very same fortune, twice in a row!',
    'Uncanny! The number returns unchanged!',
    'A strange coincidence — the wheel favors repetition!',
    'Once more, the identical throw! The court gasps!',
];

// Death Roll: a roll under 5 but not 0 — a near-miss, not the end.
const deathRollLowRollLines = () => [
    "A hair's breadth from oblivion!",
    'The reaper draws near!',
    'Doom hangs by a single thread!',
    'A perilously narrow escape!',
    'The abyss yawns just beneath!',
    'One misstep from ruin!',
    "Death's door creaks ever so slightly open!",
    'A whisker from the end!',
    'The court holds its breath!',
    'Mere inches from the void!',
];

// Death Roll: a roll of exactly 0 — the round-ending roll itself.
const deathRollFatalLines = () => [
    'The wheel stops dead — utter oblivion!',
    'Naught! The end has come!',
    'Zero — fate delivers its final verdict!',
    'The reaper claims his due!',
    'It is finished — the wheel yields nothing!',
    'A fatal roll of naught! None survive such a throw!',
    'The abyss swallows all — zero, and it is over!',
    'Fate cuts the thread at last!',
    'The final number — none crueler than zero!',
    'Doom, delivered in full!',
];

// Death Roll: the roll dropped the range by more than 90% in one throw.
const deathRollBigDropLines = () => [
    'A precipitous plunge!',
    "Fortune's wheel spins viciously downward!",
    'A staggering fall from grace!',
    'The odds collapse in an instant!',
    'A brutal, bone-jarring drop!',
    'The numbers plummet like a stone!',
    'Calamity! The range shrinks near to nothing!',
    'A ruinous tumble!',
    "The wheel's favor evaporates!",
    'A catastrophic collapse of fortune!',
];

module.exports = {
    duelVictoryLinesForChallenger,
    duelVictoryLinesForTarget,
    rpsTieLines,
    rpsEscalatingTieLines,
    deathRollSameRollLines,
    deathRollLowRollLines,
    deathRollFatalLines,
    deathRollBigDropLines,
};
