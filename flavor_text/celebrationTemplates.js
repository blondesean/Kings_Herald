/* Flavor text: celebration message templates for popular posts.
 * Takes the chosen adjective and the author's display name. */
const celebrationTemplates = (adjective, authorName) => [
    `Very ${adjective}, Milord! Your patrons adore this comment and I tell tale of your wisdom!`,
    `Hark! Most ${adjective} words, ${authorName}! The realm celebrates your eloquence!`,
    `By my troth! Such ${adjective} discourse has won the hearts of many! Well spoken, good sir!`,
    `Behold! The ${adjective} wisdom of ${authorName} has stirred the masses! Truly remarkable!`,
    `Magnificent! Your ${adjective} words have earned great favor, Milord! The court is impressed!`,
    `Splendid! Most ${adjective} indeed! Your wit has captured the admiration of all!`,
    `Verily! Such ${adjective} insight deserves recognition! The people have spoken!`,
    `Forsooth! Your ${adjective} commentary has won acclaim throughout the realm!`
];

module.exports = celebrationTemplates;
