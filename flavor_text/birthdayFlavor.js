/* Flavor text for the daily birthday blessing (see commands/passive/birthdays.js).
 * Each entry is a function returning its array of strings.
 */

// One birthday. `mention` is the member's Discord mention, `age` the years
// turned, `points` the award (equal to the age).
const birthdayLines = (mention, age, points) => [
    `Hear ye! ${mention} sees another turn of the sun, ${age} years now! The Herald bestows ${points} points upon the birthday noble.`,
    `A joyous day for ${mention}, who turns ${age} this morning! For such a milestone, the court grants ${points} points.`,
    `The Herald raises a goblet to ${mention}: ${age} years lived, and ${points} points gifted in honour of the day!`,
];

const birthdayRehearsalNote = () => '*(This be but a rehearsal, no points were truly bestowed.)*';

module.exports = { birthdayLines, birthdayRehearsalNote };
