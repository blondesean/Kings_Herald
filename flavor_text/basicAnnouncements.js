/* Flavor text: announcements for a member with no notable roles in /whois.
 * Takes the member's nickname and their current recap-ladder title (see
 * src/nobilityTitle.js). */
const basicAnnouncements = (nickname, title) => [
    `Ah yes, I know of the ${title} ${nickname}... though they appear quite unremarkable, my lord.`,
    `Indeed, the ${title} ${nickname} dwells among us, but they appear rather unremarkable, good sir.`,
    `Verily, I am acquainted with the ${title} ${nickname}, yet they seem most unremarkable to these eyes.`,
    `'Tis true, the ${title} ${nickname} walks these halls, though they appear unremarkable in deed and title.`
];

module.exports = basicAnnouncements;
