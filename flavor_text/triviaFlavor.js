/* Flavor text for /trivia's results post (see commands/passive/trivia.js).
 * Fires whenever at least one member answered but got it wrong — light,
 * good-natured ribbing in the Herald's usual courtly voice, never anything
 * sharper. Discord's "secret until the round closes" design only protects
 * answers *during* the round; once it's over and the correct answer is
 * revealed, who guessed wrong is fair game same as who guessed right.
 */
const triviaLambastLines = (mentions, count) => {
    const nobleWord = count === 1 ? 'noble' : 'nobles';
    const pronoun = count === 1 ? 'this' : 'these';

    return [
        `And let it be known: ${mentions} — ${pronoun} unfortunate ${nobleWord} answered boldly, and wrongly. A kindly jest at thy expense!`,
        `Spare a chuckle for ${mentions} — ${pronoun} ${nobleWord} guessed with a confidence the truth did not reward.`,
        `The court also notes, with gentle mirth, that ${mentions} strayed rather far from the truth this round.`,
        `Alack, ${mentions} — wisdom eluded thee this time. Sharper wits next round, perhaps!`,
        `A light jeer for ${mentions}, whose answer${count === 1 ? '' : 's'} missed the mark most memorably.`,
    ];
};

module.exports = { triviaLambastLines };
