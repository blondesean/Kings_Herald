const feast = function (prefix, message) {
    // Royal feast announcements with medieval flair
    const feastAnnouncements = [
        {
            opening: "🍖 **HEAR YE! ROYAL FEAST DECLARED!** 🍖",
            announcement: "By royal decree, a grand banquet is hereby proclaimed! All nobles of the realm are cordially invited to partake in the magnificent feast!",
            details: [
                "🍗 Roasted fowl and succulent meats await!",
                "🍷 The finest wines and ales flow freely!",
                "🥖 Fresh bread and honeyed cakes abound!",
                "🧀 Aged cheeses from the royal cellars!",
                "🍎 Sweet fruits from the castle orchards!"
            ],
            closing: "Come one, come all! Let us dine as befits the noble court! 🏰✨"
        },
        {
            opening: "🏰 **ROYAL BANQUET SUMMONED!** 🏰",
            announcement: "Hark! The royal kitchens have prepared a feast most magnificent! All subjects of the realm are bidden to join the celebration!",
            details: [
                "🥩 Prime cuts of beef and lamb!",
                "🍺 Frothy ale and mead aplenty!",
                "🥧 Savory pies and tarts galore!",
                "🍯 Honeyed delicacies and sweets!",
                "🥕 Fresh vegetables from the royal gardens!"
            ],
            closing: "Gather 'round the great hall! Let merriment and good cheer reign! 🎭🍾"
        },
        {
            opening: "⚔️ **VICTORY FEAST PROCLAIMED!** ⚔️",
            announcement: "Rejoice! In honor of our noble fellowship, a grand feast is called forth! Let all partake in this celebration of camaraderie!",
            details: [
                "🍖 Hearty stews and roasted game!",
                "🍷 Vintage wines from distant lands!",
                "🍞 Warm bread with butter and jam!",
                "🧄 Savory herbs and royal seasonings!",
                "🍓 Berry tarts and cream delights!"
            ],
            closing: "May this feast strengthen the bonds of our fellowship! Huzzah! 🎺👑"
        },
        {
            opening: "🎭 **GRAND CELEBRATION FEAST!** 🎭",
            announcement: "By the grace of the crown, a spectacular banquet is ordained! All members of our esteemed court shall feast like royalty!",
            details: [
                "🦆 Roasted duck with royal stuffing!",
                "🍻 Barrels of the finest brewery!",
                "🥨 Pretzels and artisan breads!",
                "🍇 Grapes and exotic delicacies!",
                "🎂 Magnificent cakes and pastries!"
            ],
            closing: "Let joy and abundance fill our hearts and bellies! Long live the feast! 🏆🍽️"
        }
    ];

    // Select a random feast announcement
    const selectedFeast = feastAnnouncements[Math.floor(Math.random() * feastAnnouncements.length)];
    
    // Build the simplified announcement (max 3 sentences)
    let fullAnnouncement = selectedFeast.opening + "\n\n";
    fullAnnouncement += selectedFeast.announcement + " ";
    fullAnnouncement += selectedFeast.closing;

    console.log("Herald announcing feast!");
    message.channel.send(fullAnnouncement);
};

module.exports = feast;