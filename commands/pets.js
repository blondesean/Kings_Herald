const pets = function (prefix, message) {
    // Royal pet adoration announcements with medieval flair
    const petAnnouncements = [
        {
            opening: "🐾 **BEHOLD! NOBLE CREATURES OF THE REALM!** 🐾",
            announcement: "By royal decree, we celebrate the magnificent beasts that grace our court! These loyal companions bring joy to all who dwell within these halls!",
            praises: [
                "🐕 Such noble hounds, loyal and true!",
                "🐱 Majestic felines, graceful and wise!",
                "🐦 Splendid birds, singers of sweet melodies!",
                "🐰 Gentle rabbits, soft as royal silk!",
                "🐹 Tiny creatures with hearts most grand!"
            ],
            closing: "May these blessed companions bring endless joy to our realm! 🏰✨"
        },
        {
            opening: "👑 **ROYAL MENAGERIE CELEBRATION!** 👑",
            announcement: "Hark! The royal court doth proclaim its love for all creatures great and small! These precious beings are treasures beyond gold!",
            praises: [
                "🦮 Faithful guardians of hearth and home!",
                "🐈 Elegant hunters with eyes like jewels!",
                "🕊️ Peaceful doves, symbols of serenity!",
                "🐢 Ancient tortoises, wise beyond years!",
                "🦔 Adorable hedgehogs, spiky yet sweet!"
            ],
            closing: "Long may these cherished companions reign in our hearts! 🎭🐾"
        },
        {
            opening: "⚔️ **CHAMPIONS OF CUTENESS DECLARED!** ⚔️",
            announcement: "Forsooth! No knight nor noble can match the valor of these adorable creatures! They have conquered our hearts with their charm!",
            praises: [
                "🐕‍🦺 Brave service hounds, heroes all!",
                "🐱‍👤 Stealthy cats, masters of mystery!",
                "🦜 Colorful parrots, jesters of joy!",
                "🐰 Fluffy bunnies, soft as clouds!",
                "🐾 All creatures, blessed and beloved!"
            ],
            closing: "Victory to these champions of our affections! Huzzah! 🏆🐾"
        },
        {
            opening: "🏰 **ROYAL BLESSING UPON ALL BEASTS!** 🏰",
            announcement: "By the grace of the crown, we bestow our highest honors upon these magnificent creatures! They are the true nobility of nature!",
            praises: [
                "🐕 Loyal dogs, knights of companionship!",
                "🐱 Regal cats, queens and kings of comfort!",
                "🐦 Melodious birds, court musicians divine!",
                "🐹 Tiny hamsters, jesters of delight!",
                "🦎 Exotic reptiles, dragons in miniature!"
            ],
            closing: "May their reign of adorableness be eternal! 🎺👑"
        }
    ];

    // Select a random pet announcement
    const selectedPet = petAnnouncements[Math.floor(Math.random() * petAnnouncements.length)];
    
    // Build the simplified announcement (max 3 sentences)
    let fullAnnouncement = selectedPet.opening + "\n\n";
    fullAnnouncement += selectedPet.announcement + " ";
    fullAnnouncement += selectedPet.closing;

    console.log("Herald celebrating pets!");
    message.channel.send(fullAnnouncement);
};

module.exports = pets;