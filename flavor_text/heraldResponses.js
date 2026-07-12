/* Flavor text: responses when !whois cannot find the requested member.
 * Takes the searched-for name. */
const heraldResponses = (targetUser) => [
    `Alas! The name "${targetUser}" is unknown to me, good sir. Perhaps they have fled the realm?`,
    `By my troth! No soul by the name "${targetUser}" dwells in these halls, my lord.`,
    `Forsooth! "${targetUser}" remains a mystery to this humble herald. Mayhap check thy spelling?`
];

module.exports = heraldResponses;
