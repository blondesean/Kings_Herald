/* Flavor text for the daily Word Ladder (see commands/puzzles/wordLadder.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate).
 */

// Opens the puzzle. `start`/`target` are uppercase, `maxSteps` is the word limit.
const wordLadderIntroLines = (start, target, maxSteps) => [
    `Hear ye! The Herald sets a ladder before the court: climb from **${start}** to **${target}**, changing but one letter at a time, each rung a true word. The court has ${maxSteps} steps, and each noble may add but one word!`,
    `A puzzle of steps, good nobles! Carry the word **${start}** to **${target}** by altering one letter per rung, in no more than ${maxSteps} steps. Each noble may lay a single rung, so counsel one another!`,
    `The Herald presents a ladder of words: begin at **${start}**, end at **${target}**, one letter changed per rung, ${maxSteps} rungs at most. Only one word from each of you, so choose well!`,
];

// A word was added to the ladder. `word` is uppercase.
const wordLadderAcceptedLines = (solverName, word) => [
    `A fine rung from ${solverName}: **${word}**!`,
    `${solverName} lays **${word}** upon the ladder. The Herald approves.`,
    `**${word}**, by ${solverName}'s hand! The ladder climbs on.`,
    `Well spotted, ${solverName}! **${word}** joins the ladder.`,
];

// A real word of the right length, but not one letter away from the last rung.
const wordLadderNotOneLetterLines = (solverName, word, tail) => [
    `${solverName}, **${word}** is a true word, but it is not one letter from **${tail}**. The ladder needs exactly one letter changed.`,
    `Nay, ${solverName}: **${word}** cannot follow **${tail}**, for it changes more than one letter (or none at all).`,
    `The Herald frowns at **${word}**, ${solverName}. From **${tail}**, change one letter and one only.`,
];

// A word already on the ladder.
const wordLadderAlreadyUsedLines = (solverName, word) => [
    `${solverName}, **${word}** is already on the ladder. Each rung must be new.`,
    `Nay, ${solverName}: the ladder holds **${word}** already.`,
];

// The member already laid a rung and tries again.
const wordLadderAlreadyContributedLines = (solverName) => [
    `${solverName}, thou hast laid thy rung already! Let another noble take a turn.`,
    `One rung to a noble, ${solverName}. Thou hast had thy turn; the rest of the court must carry on.`,
    `The Herald raises a hand: ${solverName}, thy word is on the ladder. Leave the next to thy fellows.`,
];

// The target was reached. `steps` is how many words the ladder took.
const wordLadderWinLines = (steps) => [
    `The court has triumphed! The ladder is complete in ${steps} steps. Well climbed, all!`,
    `By royal decree, the target is reached in ${steps} steps! A fine display of wit from the whole court.`,
    `The Herald applauds: ${steps} rungs, and the ladder stands! The day's puzzle yields.`,
];

// The steps ran out before the target was reached.
const wordLadderOutOfStepsLines = () => [
    'Alack, the steps are spent and the target stands unreached! The ladder falls short.',
    'The final rung is laid, yet the target remains beyond reach. The puzzle bests the court this day.',
];

// The ladder is broken: the target cannot be reached in the steps left.
const wordLadderStuckLines = () => [
    'Alas, that rung leads nowhere: the target can no longer be reached in the steps that remain. The ladder is lost!',
    'The Herald shakes his head. From here, no path to the target fits in the steps left. The puzzle is lost!',
];

// The window closed with the ladder unfinished.
const wordLadderTimeoutLines = () => [
    'The hour is up, and the ladder stands unfinished. The puzzle slips away.',
    'Time has run out, good nobles, with the target still unreached.',
];

// Shown with one example solution. `route` is an uppercase array.
const wordLadderRevealLines = (route) => [
    `One way it could have been climbed: ${route.join(' > ')}.`,
    `The Herald reveals a route: ${route.join(' > ')}.`,
];

module.exports = {
    wordLadderIntroLines,
    wordLadderAcceptedLines,
    wordLadderNotOneLetterLines,
    wordLadderAlreadyUsedLines,
    wordLadderAlreadyContributedLines,
    wordLadderWinLines,
    wordLadderOutOfStepsLines,
    wordLadderStuckLines,
    wordLadderTimeoutLines,
    wordLadderRevealLines,
};
