/* Flavor text for the daily Word Ladder (see commands/puzzles/wordLadder.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate), except wordLadderFlourishLine, which returns a
 * single line, and wordLadderThemeName, which returns a theme's name or null.
 *
 * House style for every line: no parentheses and no emojis, the ladder's words
 * in bold, and players called by name, never "he" or "she". No line may reveal
 * or hint at a rung before the puzzle ends.
 */

// Opens the puzzle. `start`/`target` are uppercase, `maxSteps` is the word limit.
// Every line states the full rules: start, target, one letter per rung, the
// step limit with the target counted as the last step, and one word per noble.
const wordLadderIntroLines = (start, target, maxSteps) => [
    `Hear ye! The Herald sets a ladder before the court: climb from **${start}** to **${target}**, changing but one letter at a time, each rung a true word. The court may lay up to ${maxSteps} words, each one a step, the target counting as the last, and each noble may add but one word!`,
    `A puzzle of steps, good nobles! Carry the word **${start}** to **${target}** by altering one letter per rung, in no more than ${maxSteps} steps. Each new word is one step, the target counted as the last. Each noble may lay a single rung, so counsel one another!`,
    `The Herald presents a ladder of words: begin at **${start}**, end at **${target}**, one letter changed per rung, ${maxSteps} rungs at most, counting the target as the last. Only one word from each of you, so choose well!`,
    `Attend, good nobles! Today the court climbs from **${start}** to **${target}**, and each rung may change but a single letter. The ladder allows ${maxSteps} steps, the target itself counting as the last, and each noble may lay one word and no more.`,
    `Gather round, one and all! A ladder of letters rises before the court. Take **${start}**, change one letter at a time, and arrive at **${target}** within ${maxSteps} steps, the target being the last of them. Mark this: one word per noble, so the whole court must lend a hand!`,
    `The court is summoned to a raid of words! The pull begins at **${start}** and the boss is **${target}**. Change one letter per rung and finish within ${maxSteps} steps, the killing blow on the target counting as the last. Each noble lays but one word. To arms!`,
    `By decree of the crown, a ladder shall be built from **${start}** to **${target}**! Each rung differs from the one below by a single letter, and the court has ${maxSteps} steps to finish it, the target counting as the final step. One word to each noble, and not a word more!`,
    `Sharpen your wits, good nobles: **${start}** must become **${target}**, one letter changed per rung. Ye have ${maxSteps} steps, and the target itself is the last of them. Each noble may give but a single word, so confer before ye climb!`,
];

// A word was added to the ladder. `word` is uppercase. Also posted for the word
// that ends the puzzle, win or lose, so no line may promise the target is near.
const wordLadderAcceptedLines = (solverName, word) => [
    `A fine rung from ${solverName}: **${word}**!`,
    `${solverName} lays **${word}** upon the ladder. The Herald approves.`,
    `**${word}**, by ${solverName}'s hand! The ladder climbs on.`,
    `Well spotted, ${solverName}! **${word}** joins the ladder.`,
    `Hark! ${solverName} offers **${word}**, and the ladder rises.`,
    `**${word}**, from ${solverName}. A fair rung, fairly laid.`,
    `${solverName} hands up **${word}**, and the Herald hammers it in.`,
    `Huzzah! ${solverName} sets **${word}** in place, and another rung stands.`,
    `The scribe records it: **${word}**, courtesy of ${solverName}.`,
    `The ladder creaks and grows! ${solverName} adds **${word}**.`,
    `**${word}**! The Herald checks the rules... aye, ${solverName}, it passes.`,
    `${solverName} steps up with **${word}**. The bards are taking notes.`,
    `Thy word is good, ${solverName}: **${word}** takes its place.`,
    `Up goes **${word}**! Sturdy work, ${solverName}.`,
];

// A real word of the right length, but not one letter away from the last rung.
// It costs nothing: the member's turn is not spent.
const wordLadderNotOneLetterLines = (solverName, word, tail) => [
    `${solverName}, **${word}** is a true word, but it is not one letter from **${tail}**. The ladder needs exactly one letter changed.`,
    `Nay, ${solverName}: **${word}** cannot follow **${tail}**, for it changes more than one letter.`,
    `The Herald frowns at **${word}**, ${solverName}. From **${tail}**, change one letter and one only.`,
    `A fine word, ${solverName}, but **${word}** strays too far from **${tail}**. Change one letter only, and leave the rest where they stand.`,
    `Too great a leap, ${solverName}! **${word}** is more than one letter from **${tail}**. No harm done, for thy turn is not yet spent.`,
    `The Herald counts on his fingers, ${solverName}: **${tail}** to **${word}** is more than one letter. Try again!`,
    `The ladder wobbles at **${word}**, ${solverName}. Change but one letter of **${tail}**, keeping the others in their places.`,
];

// A word already on the ladder.
const wordLadderAlreadyUsedLines = (solverName, word) => [
    `${solverName}, **${word}** is already on the ladder. Each rung must be new.`,
    `Nay, ${solverName}: the ladder holds **${word}** already.`,
    `**${word}** again, ${solverName}? That rung is taken. The ladder wants a word it has not yet seen.`,
    `The Herald has heard **${word}** once already, ${solverName}, and once is plenty. Each rung must be fresh!`,
    `${solverName}, thou art walking in circles! **${word}** is already a rung on this ladder.`,
];

// The member already laid a rung and tries again.
const wordLadderAlreadyContributedLines = (solverName) => [
    `${solverName}, thou hast laid thy rung already! Let another noble take a turn.`,
    `One rung to a noble, ${solverName}. Thou hast had thy turn; the rest of the court must carry on.`,
    `The Herald raises a hand: ${solverName}, thy word is on the ladder. Leave the next to thy fellows.`,
    `Patience, ${solverName}! Thy rung is laid. Thou mayest still counsel thy fellows, but the next word must come from another.`,
    `Eager hands, ${solverName}! The ladder has had its word from thee already. Rally another noble to the next rung!`,
    `${solverName}, thou hast already rolled on this loot! One rung per noble, so let the rest of the court have theirs.`,
];

// The target was reached. `steps` is how many words the ladder took.
const wordLadderWinLines = (steps) => [
    `The court has triumphed! The ladder is complete in ${steps} steps. Well climbed, all!`,
    `By royal decree, the target is reached in ${steps} steps! A fine display of wit from the whole court.`,
    `The Herald applauds: ${steps} rungs, and the ladder stands! The day's puzzle yields.`,
    `Sound the trumpets! The ladder stands complete in ${steps} steps, and the summit is won.`,
    `The target falls in ${steps} steps! Every rung held and every hand did its part. Victory to the court!`,
    `Let the minstrels sing of it: a ladder of ${steps} steps, climbed by many hands and finished true!`,
    `A raid well led! The target is downed in ${steps} steps, and every noble who laid a rung shares the glory.`,
    `From the bottom rung to the top in ${steps} steps! The Herald could not be prouder of this court.`,
];

// The steps ran out before the target was reached.
const wordLadderOutOfStepsLines = () => [
    'Alack, the steps are spent and the target stands unreached! The ladder falls short.',
    'The final rung is laid, yet the target remains beyond reach. The puzzle bests the court this day.',
    'Every step is spent, good nobles, and still the target waits above. The ladder ends short of the summit.',
    'No steps remain! The court climbed bravely, but the target never joined the ladder. Alas!',
    'Out of steps and out of luck! The target stands unreached, and the court must try again another day.',
];

// The ladder is broken: the target cannot be reached in the steps left.
const wordLadderStuckLines = () => [
    'Alas, that rung leads nowhere: the target can no longer be reached in the steps that remain. The ladder is lost!',
    'The Herald shakes his head. From here, no path to the target fits in the steps left. The puzzle is lost!',
    'A wipe, good nobles! The Herald has walked every path from here, and none reaches the target in the steps left. The ladder cannot be finished.',
    'Alack, the ladder has wandered off course. Even with perfect rungs from here, the steps left are too few to reach the target. The puzzle is lost.',
    'The Herald counts the steps left and sighs: no road from this rung can reach the target in so few steps. The climb ends here.',
];

// The window closed with the ladder unfinished.
const wordLadderTimeoutLines = () => [
    'The hour is up, and the ladder stands unfinished. The puzzle slips away.',
    'Time has run out, good nobles, with the target still unreached.',
    'The hourglass runs dry! The hour is spent, and the target was never reached.',
    'The enrage timer strikes! The hour has run out with the target unreached, and the ladder is abandoned where it stands.',
    'The bells toll the end of the hour, and the target still sits above the last rung. The Herald calls an end to the climb.',
];

// Shown with one example solution. `route` is an uppercase array.
const wordLadderRevealLines = (route) => [
    `One way it could have been climbed: ${route.join(' > ')}.`,
    `The Herald reveals a route: ${route.join(' > ')}.`,
    `The Herald unrolls his scroll to show one way up: ${route.join(' > ')}.`,
    `Here is one road the court might have taken: ${route.join(' > ')}.`,
    `For the court's records, one ladder that would have served: ${route.join(' > ')}.`,
];

// Read out after the intro when the puzzle has a flourish: the herald's
// one-line framing of the day's start and target.
const wordLadderFlourishLine = (flourish) => `*${flourish}*`;

// The themes a puzzle in wordLadderPuzzles.js may carry, by their `theme` id.
const WORD_LADDER_THEMES = {
    court: 'The Court and the Castle',
    nature: 'Nature and Weather',
    food: 'Food, Drink and the Tavern',
};

// A theme's display name, or null for an unthemed puzzle.
const wordLadderThemeName = (theme) => WORD_LADDER_THEMES[theme] || null;

// Announced before the intro when the day's puzzle is themed. No line names a
// particular word, so none can give away a rung.
const wordLadderThemeLines = (theme) => ({
    court: [
        `**Hark, a themed ladder!** Today both words hail from within these very walls: **${WORD_LADDER_THEMES.court}**.`,
        `By royal command, today's ladder is a themed one, good nobles: **${WORD_LADDER_THEMES.court}**. Mind thy manners on every rung.`,
        `Trumpets, please! A themed ladder, straight from the throne room: **${WORD_LADDER_THEMES.court}**.`,
    ],
    nature: [
        `**Hark, a themed ladder!** Today the Herald takes the court out of doors: **${WORD_LADDER_THEMES.nature}**.`,
        `Fetch thy cloaks, good nobles, for today's ladder is a themed one: **${WORD_LADDER_THEMES.nature}**.`,
        `A themed ladder drifts in on the breeze: **${WORD_LADDER_THEMES.nature}**. Breathe deep, good nobles.`,
    ],
    food: [
        `**Hark, a themed ladder!** Pull up a stool, for today's theme is **${WORD_LADDER_THEMES.food}**.`,
        `The kitchens send up a themed ladder, good nobles: **${WORD_LADDER_THEMES.food}**. Climb it before supper.`,
        `A themed ladder, served piping hot: **${WORD_LADDER_THEMES.food}**. The Herald has tucked in his napkin.`,
    ],
}[theme] || []);

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
    wordLadderFlourishLine,
    wordLadderThemeName,
    wordLadderThemeLines,
};
