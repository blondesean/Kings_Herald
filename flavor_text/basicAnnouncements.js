/* Flavor text: announcements for a member with no notable roles in !whois.
 * Takes the member's nickname. */
const basicAnnouncements = (nickname) => [
    `Ah yes, I know of ${nickname}... though they appear quite unremarkable, my lord.`,
    `Indeed, ${nickname} dwells among us, but they appear rather unremarkable, good sir.`,
    `Verily, I am acquainted with ${nickname}, yet they seem most unremarkable to these eyes.`,
    `'Tis true, ${nickname} walks these halls, though they appear unremarkable in deed and title.`
];

module.exports = basicAnnouncements;
