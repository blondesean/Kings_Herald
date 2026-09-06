/* Flavor text for the daily Connections-style puzzle
 * (see commands/puzzles/connections.js). Each entry is a function returning
 * its array of strings (some take parameters to interpolate).
 */

const connectionsIntroLines = () => [
    'Hear ye! The Herald presents sixteen words, bound in four secret kinships. The court has but three false steps to spare — choose wisely, and choose together!',
    'A riddle of words for the whole court to puzzle over: sixteen terms, four hidden groupings, and only three mistakes allowed before the chance is lost!',
    'Gather round, good nobles — sixteen words await sorting into four true families. The court shares but three wrong guesses, so counsel one another well!',
    "The Herald lays sixteen words upon the table, four groups hidden among them. Guess as one, err thrice, and the day's puzzle is lost!",
];

// A group was correctly identified. `category` is the revealed category
// name, `words` its four words (for display alongside the praise).
const connectionsCorrectLines = (solverName, category, words) => [
    `Well reasoned, ${solverName}! The court sees it now: **${category}** — ${words.join(', ')}.`,
    `${solverName} speaks true! That kinship was **${category}** — ${words.join(', ')}.`,
    `"Aye, that is it!" the Herald declares, crediting ${solverName}. The group was **${category}** — ${words.join(', ')}.`,
    `A clever eye, ${solverName}! Behold **${category}** — ${words.join(', ')}.`,
];

// A guess was wrong (and not a near-miss — see connectionsCloseLines).
// `triesLeft` is how many mistakes the court has remaining after this one.
const connectionsWrongLines = (triesLeft) => {
    const triesWord = triesLeft === 1 ? 'chance' : 'chances';
    return [
        `Nay, those four do not belong together. The court has ${triesLeft} ${triesWord} left.`,
        `Alack, that grouping is false. ${triesLeft} ${triesWord} remain to the court.`,
        `The Herald shakes his head — not quite. ${triesLeft} ${triesWord} left ere the puzzle is lost.`,
        `Wrong kinship, I'm afraid. ${triesLeft} ${triesWord} remaining.`,
    ];
};

// A guess had exactly 3 of 4 words from the same still-unsolved group — a
// near miss, same as real Connections' "One away..." hint. Still costs a
// life (see connectionsWrongLines's triesLeft), just phrased more kindly.
const connectionsCloseLines = (triesLeft) => {
    const triesWord = triesLeft === 1 ? 'chance' : 'chances';
    return [
        `So close! Three of those four share a kinship — but not all four. ${triesLeft} ${triesWord} left.`,
        `Almost there — one word among those four strays from the rest. ${triesLeft} ${triesWord} remain.`,
        `The Herald winces sympathetically: "Nearly! One word is misplaced." ${triesLeft} ${triesWord} left.`,
    ];
};

// The whole puzzle was solved before the court ran out of chances.
const connectionsWinLines = () => [
    'The court has triumphed! Every kinship laid bare before the chances ran out. Well played, all!',
    'By royal decree, the puzzle stands solved! A fine display of wit from the whole court.',
    'The Herald applauds — all four kinships found! The day\'s puzzle yields to the court\'s cleverness.',
];

// Out of chances before the puzzle was fully solved. `unsolved` is the
// remaining groups, each { category, words }, revealed in defeat.
const connectionsLossLines = () => [
    'Alack, the court\'s chances are spent! Let the remaining kinships be revealed:',
    'The puzzle bests the court this day. Here is what remained hidden:',
    'Three missteps, and the puzzle is lost. The Herald reveals what was left unsolved:',
];

// The guessing window closed with time still unsolved (no more wrong
// guesses used than allowed, just nobody finished in time).
const connectionsTimeoutLines = () => [
    "The hour grows late, and the day's puzzle must close unfinished. Here is what remained:",
    "Time has run its course on this day's riddle. The Herald reveals the rest:",
    'The puzzle window closes with mysteries yet unsolved. Let it be revealed:',
];

module.exports = {
    connectionsIntroLines,
    connectionsCorrectLines,
    connectionsWrongLines,
    connectionsCloseLines,
    connectionsWinLines,
    connectionsLossLines,
    connectionsTimeoutLines,
};
