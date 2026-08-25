/* Flavor text: variation pools for /wow_trivia (see commands/prompts/wow_trivia.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate).
 *
 * In-character conceit: the Herald drops into a booming orcish voice for the
 * whole session (not just the intro) and explicitly frames it as a trip back
 * to the era the question bank actually covers (vanilla through early
 * Wrath) — Thrall as Warchief of the Horde, Varian Wrynn as High King of the
 * Alliance — so an answer that's since gone stale reads as "of that age,"
 * not as the bot being wrong. The voice only drops back to the Herald's
 * usual courtly tone once the whole session ends (see wowTriviaChampionLines/
 * wowTriviaNoChampionLines) — with multiple questions in a row, snapping in
 * and out of character every round would undercut the bit.
 */

// Session-opening announcement: the voice change plus the time-travel
// framing. Always names both Thrall and Varian, per that framing's whole
// point. Shown once, regardless of how many questions the session runs.
const wowTriviaIntroLines = () => [
    "The Herald clears his throat, and when he speaks again it is in a booming, guttural voice: \"KZAH! Hear this, ye court — we march back through the mists of time, to the age when THRALL stands Warchief of the Horde, and Varian Wrynn wears the crown as High King of the Alliance! Answer true, if ye dare!\"",
    "The Herald's posture shifts, shoulders squaring like a warchief's honor guard, and his voice drops into a low orcish rumble: \"Lok'tar! We journey to the days of Thrall's Horde and Varian Wrynn's Alliance — a simpler age, and a trickier trivia! Speak thy answer swift, or be left in the dust of history!\"",
    "The Herald plants his staff like a war-standard and bellows in a rough, orcish timbre: \"By the ancestors! Back we go to when Thrall leads the Horde and Varian Wrynn rules the Alliance from Stormwind's throne! Prove thy knowledge of that age, mortal!\"",
    "The Herald grins, cracks his knuckles, and lets his voice fall into a gravelly orcish growl: \"Che'senil! The court travels back to the age of Warchief Thrall and High King Varian Wrynn! Speak first, speak true, and claim thy glory!\"",
    "The Herald draws a breath and roars, orc-voiced and proud: \"For the Horde! For the Alliance! For BOTH, this day — we return to when Thrall commands the Horde and Varian Wrynn commands the Alliance! Let the trivia of that age begin!\"",
];

// A member answered a single question correctly and first. Still orc-voiced —
// no points are mentioned here, since only the session's overall champion
// (see wowTriviaChampionLines) is paid, once, at the end.
const wowTriviaRoundWinLines = (winnerName) => [
    `"LOK'TAR OGAR!" the Herald roars, still orc-voiced. "**${winnerName}** speaks truly and first!"`,
    `"Well struck, **${winnerName}**!" the Herald growls. "Thy wisdom of the old age is proven!"`,
    `"Victory!" the Herald bellows in his borrowed orcish voice, pointing to **${winnerName}**.`,
    `"Ancestors smile upon thee, **${winnerName}**!" the Herald grins fiercely, still in character.`,
    `"Che'senil! First and true!" the Herald growls, saluting **${winnerName}**.`,
];

// No one answered a single question correctly in time. Still orc-voiced.
const wowTriviaRoundTimeoutLines = () => [
    "\"Hrmph,\" grunts the Herald, still in his orcish growl. \"None answered true in time.\"",
    "The Herald shakes his head, orc-voiced still: \"The old age keeps this secret a while longer.\"",
    "\"None spoke rightly, nor swiftly enough,\" the Herald rumbles.",
    "\"The ancestors are unimpressed,\" the Herald intones, orcish and stern.",
];

// Session-closing announcement: the voice returns to normal, the champion(s)
// are named, and points are paid — the only point award in the whole
// session. namesText is a pre-joined mention string (one or more members, in
// case of a tie); roundsWon/totalQuestions/pointsEach are the same for every
// name in a tie.
const wowTriviaChampionLines = (namesText, roundsWon, totalQuestions, pointsEach) => [
    `The Herald's orcish growl fades, his own courtly voice returning: "The age yields its champion — ${namesText}, with ${roundsWon} of ${totalQuestions} answered true! ${pointsEach} points, well earned."`,
    `Slipping back into his familiar tongue, the Herald proclaims: "${namesText} bested the rest, ${roundsWon} of ${totalQuestions} true — ${pointsEach} points to the victor!"`,
    `The Herald clears his throat, voice settling back to normal: "Let it be recorded — ${namesText} claims mastery of the old age, ${roundsWon} of ${totalQuestions} correct, and ${pointsEach} points besides."`,
    `Returning to his usual courtly cadence, the Herald announces: "${namesText} stands unmatched this day, ${roundsWon} of ${totalQuestions} true — ${pointsEach} points awarded!"`,
    `The growl leaves his voice as quickly as it came: "${namesText}! ${roundsWon} of ${totalQuestions} answered rightly — thy age of glory earns thee ${pointsEach} points."`,
];

// Every question in the session went unanswered. No points change hands.
const wowTriviaNoChampionLines = (totalQuestions) => [
    `The Herald's orcish growl fades into his usual courtly voice, tinged with disappointment: "Not one of ${totalQuestions} question${totalQuestions === 1 ? '' : 's'} was answered true this day. No points change hands."`,
    `Slipping back to his familiar tongue, the Herald sighs: "The court's memory of that bygone age has utterly failed it — ${totalQuestions} question${totalQuestions === 1 ? '' : 's'}, and not one answered true. No points are earned."`,
    `The Herald's voice settles back to normal, wearily: "None among thee claimed even a single victory across ${totalQuestions} question${totalQuestions === 1 ? '' : 's'}. The old age keeps all its secrets."`,
];

module.exports = {
    wowTriviaIntroLines,
    wowTriviaRoundWinLines,
    wowTriviaRoundTimeoutLines,
    wowTriviaChampionLines,
    wowTriviaNoChampionLines,
};
