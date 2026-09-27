/* Flavor text for the daily ranking round (see
 * commands/passive/rankingRound.js). Each entry is a function returning its
 * array of strings.
 */

// Opens the post.
const rankingIntroLines = () => [
    'Hear ye! Five things stand before the court, and the Herald asks that each noble rank them in secret. Whoever ranks closest to the court\'s average earns the Herald\'s favor.',
    'A matter of judgment, good nobles! Order these five from first to last in private, and see whose ranking best matches the mind of the whole hall.',
    'Five choices, one court, no right answer. Rank them as thy heart dictates, and the Herald shall reveal whose taste runs closest to the crowd\'s.',
];

// Introduces the group's combined order.
const rankingConsensusLines = () => [
    'The court\'s combined order, by average rank:',
    'The Herald tallies every ranking, and the hall\'s order stands thus:',
    'By the average of all voices, the court ranks them thus:',
];

// Heading for the closest player(s) and for the runner-up(s).
const rankingClosestLines = () => [
    'Closest to the court\'s mind:',
    'Most in tune with the hall:',
    'Thinking most like the crowd:',
];
const rankingNextLines = () => [
    'Next closest:',
    'Not far behind:',
    'Nearly in step with the hall:',
];

// Fewer full rankings than it takes to read a consensus.
const rankingFewLines = () => [
    'Too few nobles finished their rankings for the court\'s mind to be read. No points this day.',
    'The hall was too quiet to find an average, so no points are awarded. Bring more voices next time!',
];

// Nobody finished a ranking.
const rankingNoneLines = () => [
    'No one finished a ranking, and the question fades unanswered.',
    'Not a soul completed their ranking this day. The Herald rolls up his scroll.',
];

// Everyone's rankings cancelled out to a flat average, so nobody can be closest.
const rankingNoConsensusLines = () => [
    'The rankings cancelled each other out perfectly, and the court has no order to speak of. No points this day.',
    'The hall is so evenly divided that no average can be found. The Herald awards no points.',
];

module.exports = {
    rankingIntroLines,
    rankingConsensusLines,
    rankingClosestLines,
    rankingNextLines,
    rankingFewLines,
    rankingNoneLines,
    rankingNoConsensusLines,
};
