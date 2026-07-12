/* Flavor text: full herald announcement templates for !whois.
 * Takes the member's nickname; the {adj} and {role} placeholders are filled in
 * by the caller for each selected role. */
const announcementTemplates = (nickname) => [
    {
        opening: "HEAR YE, HEAR YE!",
        intro: `Thou dost inquire about ${nickname}?`,
        titles: [
            "Behold! The {adj} {role}!",
            "Witness! The {adj} {role}!",
            "Marvel at the {adj} {role}!"
        ],
        closing: `Such is the {adj} ${nickname}, may their name echo through the ages!`
    },
    {
        opening: "BY ROYAL DECREE!",
        intro: `You seek knowledge of the esteemed ${nickname}?`,
        titles: [
            "Know them as the {adj} {role}!",
            "They are called the {adj} {role}!",
            "Renowned as the {adj} {role}!"
        ],
        closing: `Thus stands the {adj} ${nickname} before thee!`
    },
    {
        opening: "PROCLAMATION!",
        intro: `Ah! You would know of ${nickname}!`,
        titles: [
            "The realm knows them as the {adj} {role}!",
            "Far and wide, they're hailed as the {adj} {role}!",
            "In song and story, the {adj} {role}!"
        ],
        closing: `Verily, 'tis the {adj} ${nickname} of whom legends speak!`
    }
];

module.exports = announcementTemplates;
