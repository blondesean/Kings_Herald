/* Flavor text for /trivia's seasonal winter rounds (see
 * commands/passive/trivia.js). Fires only when a round draws from the winter
 * question bank (flavor_text/winterTriviaQuestions.js), which is every round
 * in December, for a wintry, festive reskin of the Herald's usual courtly
 * trivia voice.
 */

// Shown in place of the usual "Hear ye! A test of knowledge for the court:"
// opener when a round is from the winter bank.
const winterTriviaIntroLines = () => [
    'The Herald stamps the snow from his boots and warms his hands at the hearth: "Hear ye, hear ye! A question for the long winter nights!"',
    'Holly hangs from every rafter and the Yule log crackles. The Herald raises a mug of mulled wine: "A test of midwinter wits, good court!"',
    'The Herald sweeps in wearing a fur-trimmed cloak, snowflakes caught in his beard: "The year grows old and the nights grow long, so gather close for winter trivia!"',
    'Bells jingle somewhere beyond the castle walls. The Herald unrolls a frost-rimed scroll: "From the frozen archives, a question most festive!"',
    'The Herald tosses another log on the great hearth and turns, eyes twinkling: "Candles in the windows, snow upon the battlements, and trivia for the court!"',
];

// A short in-character sign-off appended after a winter round's results,
// once win/loss flavor has already been said.
const winterTriviaClosingLines = () => [
    'The Herald banks the fire, tips his fur-trimmed hat, and vanishes into the swirling snow.',
    '"Warm thy hands and sharpen thy wits," the Herald calls over his shoulder. "The long nights hold more questions yet."',
    'The Herald drains his mulled wine and sets down the empty mug. "Another winter\'s riddle come the morrow, good court..."',
    'A cold gust snuffs the candles. When they flicker back to life, the Herald is gone, leaving only bootprints in the frost.',
];

module.exports = { winterTriviaIntroLines, winterTriviaClosingLines };
