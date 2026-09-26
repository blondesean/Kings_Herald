/* Flavor text for the daily "would you rather" round (see
 * commands/passive/wouldYouRather.js). Each entry is a function returning its
 * array of strings (some take parameters to interpolate).
 */

// Opens the post. Explains, in voice, that each member answers twice.
const wouldYouRatherIntroLines = () => [
    'Hear ye! The Herald asks not what is true, but what is preferred. The court must answer twice: once for thine own heart, and once for the heart of the crowd.',
    'A matter of taste comes before the court this day! Name thine own choice, then wager on which way the whole hall will lean.',
    'The Herald sets two roads before the court and asks: which wouldst thou walk, and which will the crowd choose? Answer both, in secret.',
    'No wrong answers today, good nobles, only shrewd ones. Choose for thyself, then guess the court\'s mind.',
];

// The group's pick, revealed. `winnerText` is the winning option's text.
const wouldYouRatherMajorityLines = (winnerText, winnerVotes, loserVotes) => [
    `The court has spoken: **${winnerText}** carries the day, ${winnerVotes} votes to ${loserVotes}.`,
    `By the count of the hall, **${winnerText}** is the favorite, ${winnerVotes} to ${loserVotes}.`,
    `The votes are tallied, and **${winnerText}** wins the court's heart, ${winnerVotes} to ${loserVotes}.`,
];

// Even split: there is no crowd favorite to have predicted, so instead every
// member who answered in full gets a consolation point.
const wouldYouRatherTieLines = (votes) => [
    `The court is split clean down the middle, ${votes} votes apiece! With no favorite to foresee, the Herald rewards all who answered.`,
    `An even ${votes} to ${votes}! The hall cannot decide, so the Herald spreads his favor across every voice.`,
];

// Fewer people gave a full answer than it takes to read the court's mind.
const wouldYouRatherFewLines = () => [
    'Too few voices answered for the court\'s mind to be read. No points this day.',
    'The hall was too quiet to judge, so no points are awarded. Bring more voices next time!',
];

// Nobody gave a full answer at all.
const wouldYouRatherNoneLines = () => [
    'The hall stayed silent, and no full answer was given. The question fades unanswered.',
    'Not a soul answered fully this day. The Herald rolls up his scroll.',
];

// A clear crowd favorite, but nobody guessed it.
const wouldYouRatherNoWinnersLines = () => [
    'And yet not a soul foresaw it! No points this day.',
    'Not one among you read the crowd aright. No points are awarded.',
];

// Introduces the list of members who guessed right.
const wouldYouRatherWinnersLines = () => [
    'Sharp of mind, and rewarded for it:',
    'These nobles read the court aright:',
    'The crowd held no secrets from:',
];

module.exports = {
    wouldYouRatherIntroLines,
    wouldYouRatherMajorityLines,
    wouldYouRatherTieLines,
    wouldYouRatherFewLines,
    wouldYouRatherNoneLines,
    wouldYouRatherNoWinnersLines,
    wouldYouRatherWinnersLines,
};
