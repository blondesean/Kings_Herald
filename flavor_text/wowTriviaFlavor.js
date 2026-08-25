/* Flavor text: variation pools for /wow_trivia (see commands/prompts/wow_trivia.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate).
 *
 * In-character conceit: the Herald drops into a booming orcish voice for the
 * round, and explicitly frames it as a trip back to the era the question
 * bank actually covers (vanilla through early Wrath) — Thrall as Warchief of
 * the Horde, Varian Wrynn as High King of the Alliance — so an answer that's
 * since gone stale reads as "of that age," not as the bot being wrong.
 */

// Round-opening announcement: the voice change plus the time-travel framing.
// Always names both Thrall and Varian, per that framing's whole point.
const wowTriviaIntroLines = () => [
    "The Herald clears his throat, and when he speaks again it is in a booming, guttural voice: \"KZAH! Hear this, ye court — we march back through the mists of time, to the age when THRALL stands Warchief of the Horde, and Varian Wrynn wears the crown as High King of the Alliance! Answer true, if ye dare!\"",
    "The Herald's posture shifts, shoulders squaring like a warchief's honor guard, and his voice drops into a low orcish rumble: \"Lok'tar! We journey to the days of Thrall's Horde and Varian Wrynn's Alliance — a simpler age, and a trickier trivia! Speak thy answer swift, or be left in the dust of history!\"",
    "The Herald plants his staff like a war-standard and bellows in a rough, orcish timbre: \"By the ancestors! Back we go to when Thrall leads the Horde and Varian Wrynn rules the Alliance from Stormwind's throne! Prove thy knowledge of that age, mortal!\"",
    "The Herald grins, cracks his knuckles, and lets his voice fall into a gravelly orcish growl: \"Che'senil! The court travels back to the age of Warchief Thrall and High King Varian Wrynn! Speak first, speak true, and claim thy glory!\"",
    "The Herald draws a breath and roars, orc-voiced and proud: \"For the Horde! For the Alliance! For BOTH, this day — we return to when Thrall commands the Horde and Varian Wrynn commands the Alliance! Let the trivia of that age begin!\"",
];

// First correct answer wins the round. winnerName/points are interpolated.
const wowTriviaVictoryLines = (winnerName, points) => [
    `Still orc-voiced, the Herald roars: "LOK'TAR OGAR! **${winnerName}** speaks truly and first!" He clears his throat, and his own voice returns as he adds: **${winnerName}** earns **${points}** points.`,
    `The Herald, mid-growl, thumps his chest: "Well struck, **${winnerName}**! Thy wisdom of the old age is proven!" Then, courtly once more: **${winnerName}** earns **${points}** points.`,
    `"Victory!" the Herald bellows in his borrowed orcish voice, pointing to **${winnerName}**. Returning to his own tongue, he proclaims: **${winnerName}** earns **${points}** points.`,
    `The Herald grins fiercely, still in character: "Ancestors smile upon thee, **${winnerName}**!" His voice softens back to its usual courtly cadence: **${winnerName}** earns **${points}** points.`,
    `"Che'senil! First and true!" the Herald growls, saluting **${winnerName}**. Slipping back into his familiar voice, he notes: **${winnerName}** earns **${points}** points.`,
];

// No one answered correctly within the time limit.
const wowTriviaTimeoutLines = () => [
    "The Herald shakes his head, his orcish growl fading back to its familiar courtly tone: \"Alas, the court's wisdom of that bygone age falls short this day. No points are earned.\"",
    "\"Hrmph,\" grunts the Herald, still half in character, before his voice settles back to normal: \"None answered true in time. The old age keeps its secrets a while longer.\"",
    "The Herald's orcish bearing softens as the moment passes: \"None spoke rightly, nor swiftly enough. Perhaps the court's memory of Thrall and Varian's age has faded.\"",
    "\"The ancestors are unimpressed,\" the Herald intones, before dropping the voice entirely: \"No one answered correctly in time. No points change hands.\"",
];

module.exports = {
    wowTriviaIntroLines,
    wowTriviaVictoryLines,
    wowTriviaTimeoutLines,
};
