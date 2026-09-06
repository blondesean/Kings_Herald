/* Flavor text for /trivia's seasonal Halloween rounds (see
 * commands/passive/trivia.js). Fires only when a round draws from the
 * Halloween question bank (flavor_text/halloweenTriviaQuestions.js) — active
 * through September (a per-round chance) and October (every round) — for a
 * lightly spooky reskin of the Herald's usual courtly trivia voice.
 */

// Shown in place of the usual "Hear ye! A test of knowledge for the court:"
// opener when a round is seasonal.
const halloweenTriviaIntroLines = () => [
    'The torches gutter and dim as the Herald leans in, voice dropping to a conspiratorial hush: "Hear ye, if ye dare — a question from beyond the veil..."',
    'A chill wind stirs the banners of the court. The Herald grins, gap-toothed and gleeful: "Gather close, ye brave souls, for All Hallows\' trivia is upon us!"',
    'The Herald produces a jack-o\'-lantern from behind his podium, its candle guttering ominously: "A test of knowledge most macabre, for this haunted season!"',
    'Somewhere, a raven caws. The Herald smirks: "The spirits grow restless this time of year — as does thy trivia, good court!"',
    'The Herald dons a crooked witch\'s hat over his usual finery: "\'Tis the season of shadows and sweets — answer wisely, or face the Herald\'s spooky scorn!"',
];

// A short in-character sign-off appended after a seasonal round's results,
// once win/loss flavor has already been said.
const halloweenTriviaClosingLines = () => [
    "The Herald snuffs the jack-o'-lantern's candle with a wink. \"Until next we meet the dark...\"",
    'A distant howl answers as the Herald tips his crooked hat and steps back into the shadows.',
    "The torches flare back to their usual warmth as the Herald's spooky grin fades to his familiar smile.",
    'The Herald sweeps his witch\'s hat into a bow. "The veil thins again on the morrow, good court..."',
];

module.exports = { halloweenTriviaIntroLines, halloweenTriviaClosingLines };
