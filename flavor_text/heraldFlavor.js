/* Flavor text for the Herald's battle (src/heraldBattle.js) and its
 * proclamations (commands/prompts/herald_challenge.js). The speeches follow
 * docs/the-last-proclamation.md.
 *
 * HERALD_QUESTIONS are the lore question of the first phase. Each is easy for
 * anyone who read the seven lore drops (flavor_text/loreDrops.js), and the
 * first choice is the right one; shuffle before showing. Keep each choice
 * under 80 characters, Discord's button label limit.
 *
 * No parentheses: this is herald dialogue.
 */

const HERALD_QUESTIONS = [
    { question: 'What was the first age of the world?', choices: ['The Age of Gods', 'The Age of Kings', 'The Age of Heroes', 'The Age of the Hearth'] },
    { question: 'What did the two heralds raise between Ajax and Hector at dusk?', choices: ['Their staffs', 'Their swords', 'A white banner', 'A horn'] },
    { question: 'What do the heralds call the reborn souls that the old arms recognize?', choices: ['Echoes', 'Shades', 'Heirs', 'Wraiths'] },
    { question: 'Whom did the shepherd boy fell with a stone from his sling?', choices: ['The giant of Gath', 'The one-eyed king', 'The Gorgon', 'A dragon'] },
    { question: 'How did the north end, as it always knew it would?', choices: ['A watchman blew a horn', 'A king broke his sword', 'The sea swallowed the forges', 'The sun went dark forever'] },
    { question: 'What did the smallest of seven brothers take from an ogre?', choices: ['Seven-league boots', 'A golden harp', 'A hen that laid golden eggs', 'A cloak of shadows'] },
    { question: 'What does the wheel of the first age always do?', choices: ['Return to the hand that throws it', 'Burn whatever it touches', 'Split into a hundred blades', 'Hide its wielder from sight'] },
    { question: 'How did the heroes of the third age take their arms?', choices: ['From monsters, by labor', 'As gifts from heaven', 'From smiths, at a price', 'By cunning and theft'] },
    { question: 'What was the fifth age called?', choices: ['The Age of the Hearth', 'The Age of Iron', 'The Age of Storms', 'The Age of Kings'] },
    { question: 'What is it that a wave does not know, the heralds say?', choices: ['Its own height', 'Its own name', 'Where it will break', 'How old it is'] },
];

// The proclamation when an admin sets the day. `when` reads like
// "Saturday, December 12 at 9:00 PM Eastern", and a reminder's `time` like
// "9:00 PM Eastern".
const heraldChallengeSetLines = (when) => [
    `Hear ye, hear ye! On **${when}**, the herald will lay down his scroll and take up his staff. Let every Echo come armed.`,
    `Hear ye, hear ye! The day is named: **${when}**. On that day the herald sets down his scroll, takes up his staff, and meets the court as its last challenge. Let every Echo come armed.`,
];

const heraldChallengeMovedLines = (when) => [
    `Hear ye! The herald has thought better of the hour. The challenge is now **${when}**. Let every Echo come armed.`,
];

const heraldChallengeCancelledLines = () => [
    'Hear ye! The herald rolls his scroll back up. The challenge will wait for another day, and he will name it when it comes.',
];

const heraldReminderLines = {
    week: (when) => [`Hear ye! One week remains. On **${when}**, the herald takes up his staff. Echoes, see to your arms.`],
    day: (when) => [`Hear ye! Tomorrow, **${when}**, the herald lays down his scroll. Rest well tonight, Echoes. You will want your strength.`],
    morning: (when, time) => [`Hear ye, hear ye! Today is the day. At **${time}**, the herald will stand before the court with his staff, and not his scroll. Let every Echo come armed.`],
};

// The challenge post. `minutes` is how long the court has to answer.
const heraldChallengeLines = () => [
    'The herald sets down his scroll. For the first time in the memory of this court, he does not read from it. He takes up a plain wooden staff instead, and walks to the center of the hall.\n\n"Every age before this one met its last test in a rival. You have none. So I have come myself. Echoes of the court, those of you who bear a relic, answer me."',
];

const heraldTooFewLines = (count, needed) => [
    `The herald waits, staff in hand, but only ${count} ${count === 1 ? 'Echo answers' : 'Echoes answer'}, and an age is not tested by ${count === 1 ? 'one' : 'a few'}. He needs at least ${needed}. "Not today, then," he says, and he is smiling. "Gather. I will come again."`,
];

const heraldNoOneLines = () => [
    'The herald waits a long while, staff in hand, and no Echo answers. "Ah," he says, gently. "Not yet, then." He picks up his scroll again.',
];

// Phase one: the Staff, and the lore question.
const heraldStaffLines = () => [
    'The Herald plants his staff and does not raise a weapon. For a long moment, no one in the party can bring themselves to swing.\n\n"Before you strike," he says, "tell me you were listening."',
];

// With no one right, no line may suggest anyone gained the lore's edge.
const heraldTriviaResultLines = (answer, right, total) => (right
    ? [`"${answer}," says the Herald. "Of course." **${right} of ${total}** answered true, and their hands are steadier for it.`]
    : [`"${answer}," says the Herald, almost gently. **None of ${total}** answered true. The dream must be won on steel alone.`]);

// Phase two: the Horn, and the dream duels.
const heraldHornLines = () => [
    'The Herald lifts a horn to his lips, and the hall goes dim. One by one, the party falls into a dream. Each Echo stands again at the end of an old road, before the Guardian who once barred it.',
];

const heraldDreamWinLines = (name) => [`*${name} wakes victorious.*`, `*${name} wakes with the Guardian's blessing.*`, `*${name} wakes, and the relic is warm in hand.*`];
const heraldDreamLossLines = (name) => [`*${name} wakes in a cold sweat.*`, `*${name} wakes, shaken but whole.*`, `*${name} wakes before the end of the dream.*`];

const heraldDreamSummaryLines = (won, total) => [
    `**${won} of ${total}** Echoes return from the dream blessed. The Herald lowers the horn.`,
];

// Phase three: the Wheel.
const heraldWheelLines = () => [
    'The Herald takes up the wheel, which has never once been lost. "Now," he says. "Show me." One by one, the court steps forward.',
];

// How each member takes on the Herald, by stance, as they step forward.
// `who` is the member's bolded name, with their title if they bear one, e.g.
// "**Robin**, Hand of the King,"; each line goes on from it.
const heraldStanceLines = {
    aggressive: (who) => [
        `${who} charges straight at the Herald, as if the wheel were not there at all.`,
        `${who} does not wait for an opening, and hacks one out of the Herald's guard.`,
        `${who} comes at the Herald like a storm off the northern sea, all edge and no guard.`,
    ],
    balanced: (who) => [
        `${who} squares up to the Herald, steady and patient, and gives no ground.`,
        `${who} keeps a level guard and watches the wheel, waiting for it to show its turn.`,
        `${who} meets the Herald as the old champions did, blow for blow and eye to eye.`,
    ],
    defensive: (who) => [
        `${who} raises a guard the wheel cannot find a way through, and holds the line for the rest.`,
        `${who} stands fast beside the least armored of the court and lets the Herald come.`,
        `${who} gives ground one step at a time, and makes every step cost the Herald dearly.`,
    ],
    plunder: (who) => [
        `${who} circles wide of the fight, eyes on the Herald's satchel more than the Herald.`,
        `${who} fights with one hand and reaches for the Herald's belt pouch with the other.`,
        `${who} slips around behind the Herald. Heralds carry more than news, after all.`,
    ],
};

const heraldPerfectLines = () => [
    'Every Echo came back blessed from the dream. The Herald looks along the line of them, and for the first time, he does not seem certain where to throw.',
];

const heraldThrowLines = () => [
    'The Herald throws the wheel, and it comes back to his hand, and he throws it again...',
];

// The Fall, after a win. `named` is the age's name, or null if it was named
// already in an earlier battle.
const heraldWinLines = (named) => [
    [
        'The wheel goes wide, for the first time in the Long Memory. The Herald drops to one knee in the dust, and laughs.',
        '',
        '"There. Do you feel it? That is what the top of a wave feels like. Every age I have known stood here for one moment and did not know it. You know it. That is my gift to you, and the only one I have ever been able to give.',
        '',
        '"I have to tell you the rest, because a herald tells it true. After the crest, the wave breaks. It always has. Perhaps you will be the first that does not. I have never been so glad to hope I am wrong.',
        '',
        named
            ? `"Now. By the oldest right I keep: hear ye, hear ye. Let the Long Memory record that the age of this court has been tested, and has met its test, and is named **the ${named}.** Gods, prophets, heroes, kings and folk, and now you: the ones who hear the call and answer it. It is the finest name I have ever given."`
            : '"Again you have met me, and again you have won. The age keeps its name, and wears it well."',
    ].join('\n'),
];

const heraldLossLines = () => [
    'The wheel finds its mark. The Herald lowers his staff and smiles, and there is no triumph in it at all.\n\n"Not yet. The crest is close, but you are still climbing. Rest. I will proclaim the challenge again when you are ready, and I will be glad to."',
];

module.exports = {
    HERALD_QUESTIONS,
    heraldChallengeSetLines,
    heraldChallengeMovedLines,
    heraldChallengeCancelledLines,
    heraldReminderLines,
    heraldChallengeLines,
    heraldTooFewLines,
    heraldNoOneLines,
    heraldStaffLines,
    heraldTriviaResultLines,
    heraldHornLines,
    heraldDreamWinLines,
    heraldDreamLossLines,
    heraldDreamSummaryLines,
    heraldWheelLines,
    heraldStanceLines,
    heraldPerfectLines,
    heraldThrowLines,
    heraldWinLines,
    heraldLossLines,
};
