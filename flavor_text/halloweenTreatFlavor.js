/* Flavor text for the October daily treat (see
 * commands/passive/halloweenTreat.js): the Herald draws one member at random
 * and gifts them points. `mention` is the winner's <@id> mention; `points`
 * is the size of the gift. In character, with Halloween flair.
 */
const halloweenTreatLines = (mention, points) => [
    `The candles gutter, a chill wind rattles the shutters, and the Herald unrolls a cobwebbed scroll: "Hear ye! On this hallowed noon the spirits have chosen ${mention}, and bestow upon them ${points} points. A treat, and no trick!"`,
    `A raven caws from the rafters. "By the light of the pumpkin lanterns," the Herald intones, "${mention} is favored by the restless dead this day. Take ${points} points, and mind the ghosts on the stair."`,
    `The Herald rattles a cauldron and draws a single name from the bubbling brew: "${mention}! The witches' coven decrees that ${points} points be dropped into thy purse. A treat, good noble!"`,
    `Somewhere a wolf howls. The Herald lifts a flickering jack-o'-lantern high: "The moon hath spoken, and it names ${mention}. ${points} points, freely given by the haunted realm."`,
    `"Trick or treat!" the Herald cackles, tossing a sack of glinting coins toward ${mention}. "This day, no trick at all -- only a treat. ${points} points for thee!"`,
    `Mist curls across the floor as the Herald unseals a crypt-dark ledger: "The dead have drawn lots, and the lot falls to ${mention}. ${points} points, with the compliments of the graveyard."`,
];

// Shown after the winner line on a rehearsal run, matching the daily trivia's
// preview note.
const halloweenTreatRehearsalNote = () => '*(This be but a rehearsal — no points were truly bestowed.)*';

module.exports = { halloweenTreatLines, halloweenTreatRehearsalNote };
