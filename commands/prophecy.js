const prophecy = function (prefix, message) {
    // Get the target user (or default to the command sender)
    let targetUser = message.content.replace(`${prefix}prophecy `, "").trim();
    let targetMember = message.member;
    
    // If a user is specified, find them
    if (targetUser && targetUser !== `${prefix}fortune`) {
        // Handle Discord mention format <@123456789> or <@!123456789>
        const mentionMatch = targetUser.match(/^<@!?(\d+)>$/);
        if (mentionMatch) {
            const userId = mentionMatch[1];
            targetMember = message.guild.members.cache.get(userId);
        } else {
            // Remove @ symbol if present
            if (targetUser.startsWith('@')) {
                targetUser = targetUser.substring(1);
            }
            
            // Find by username or nickname
            targetMember = message.guild.members.cache.find(member => 
                member.user.username.toLowerCase() === targetUser.toLowerCase() || 
                member.displayName.toLowerCase() === targetUser.toLowerCase()
            );
        }
        
        if (!targetMember) {
            message.reply(`Forsooth! The name "${targetUser}" is unknown to the mystical forces, good sir. The ancient prophecies cannot divine their fate!`);
            return;
        }
    }

    const displayName = targetMember.displayName;
    const isForSelf = targetMember.id === message.author.id;

    console.log(`Reading prophecy for: ${displayName}`);

    // Tarot cards with medieval interpretations
    const tarotCards = [
        {
            name: "The Fool",
            symbol: "🃏",
            meanings: [
                "A new adventure awaits thee, though thou may stumble upon thine own feet",
                "Innocence and wonder shall guide thy path, but beware of cliff edges",
                "The universe beckons thee to take a leap of faith... preferably a small one"
            ]
        },
        {
            name: "The Magician", 
            symbol: "🎩",
            meanings: [
                "Thou possess great power to manifest thy desires, if thou can remember where thou left thy wand",
                "The elements bend to thy will, particularly the element of surprise",
                "Magic flows through thee like wine through a very enthusiastic monk"
            ]
        },
        {
            name: "The High Priestess",
            symbol: "🔮",
            meanings: [
                "Ancient wisdom whispers secrets in thy ear, though they speak rather quietly",
                "Intuition shall be thy guide, assuming thou can tell it apart from hunger",
                "The veil between worlds grows thin, much like the royal treasury"
            ]
        },
        {
            name: "The Emperor",
            symbol: "👑",
            meanings: [
                "Leadership and authority flow through thee like a majestic river of responsibility",
                "Thou art destined to rule... at least over thy own sock drawer",
                "The crown of wisdom sits upon thy brow, though it may be slightly crooked"
            ]
        },
        {
            name: "The Hierophant",
            symbol: "⛪",
            meanings: [
                "Sacred knowledge shall be revealed, probably when thou least expect it",
                "Tradition and wisdom guide thy steps, even when they lead to the tavern",
                "The divine speaks through thee, though sometimes it just asks for cheese"
            ]
        },
        {
            name: "The Lovers",
            symbol: "💕",
            meanings: [
                "Love and harmony surround thee like a warm, slightly awkward embrace",
                "Important choices in matters of the heart await, choose the one with better snacks",
                "Passion burns within thy soul, hopefully not literally"
            ]
        },
        {
            name: "The Chariot",
            symbol: "🏇",
            meanings: [
                "Victory and determination shall carry thee forward, assuming thy horse cooperates",
                "Thou art in control of thy destiny, much like a cart rolling downhill",
                "Success awaits those who can steer straight and avoid the potholes"
            ]
        },
        {
            name: "Strength",
            symbol: "🦁",
            meanings: [
                "Inner courage shall overcome all obstacles, including particularly stubborn jar lids",
                "Thou possess the strength of ten men, or at least one very determined badger",
                "Gentle power and fierce compassion are thy greatest weapons"
            ]
        },
        {
            name: "The Hermit",
            symbol: "🕯️",
            meanings: [
                "Solitude and reflection shall bring great wisdom, plus excellent reading time",
                "The light of truth guides thy path, though thou may need a bigger candle",
                "Inner knowledge awaits those who look within, preferably with good lighting"
            ]
        },
        {
            name: "Wheel of Fortune",
            symbol: "🎡",
            meanings: [
                "Fate spins thy destiny like a cosmic carnival ride, hold on tight",
                "Change comes whether thou art ready or not, much like unexpected visitors",
                "Fortune favors thee, though she may be fashionably late"
            ]
        },
        {
            name: "Justice",
            symbol: "⚖️",
            meanings: [
                "Balance and fairness shall prevail, assuming everyone plays nicely",
                "Truth and righteousness guide thy actions, even when inconvenient",
                "The scales of justice tip in thy favor, probably"
            ]
        },
        {
            name: "The Hanged Man",
            symbol: "🙃",
            meanings: [
                "A new perspective awaits when thou view the world upside down",
                "Sacrifice and patience shall bring enlightenment, eventually",
                "Sometimes the best view comes from hanging around doing nothing"
            ]
        },
        {
            name: "Death",
            symbol: "💀",
            meanings: [
                "Transformation and renewal approach, fear not the dramatic symbolism",
                "An ending brings a new beginning, like finishing thy vegetables before dessert",
                "Change sweeps through thy life like a very thorough cleaning lady"
            ]
        },
        {
            name: "Temperance",
            symbol: "🍷",
            meanings: [
                "Moderation and balance shall serve thee well, especially at royal feasts",
                "Patience and harmony bring success, assuming thou can wait that long",
                "The middle path leads to wisdom, and usually better parking"
            ]
        },
        {
            name: "The Devil",
            symbol: "😈",
            meanings: [
                "Temptation surrounds thee, particularly in the form of excellent pastries",
                "Break free from thy chains, metaphorical or otherwise",
                "Material desires may cloud thy judgment, especially shiny objects"
            ]
        },
        {
            name: "The Tower",
            symbol: "🏰",
            meanings: [
                "Sudden change shakes thy foundations, hopefully not literally",
                "Old structures crumble to make way for better ones, with improved plumbing",
                "Revelation strikes like lightning, illuminating and slightly startling"
            ]
        },
        {
            name: "The Star",
            symbol: "⭐",
            meanings: [
                "Hope and inspiration shine upon thee like celestial nightlights",
                "Thy wishes shall be granted, terms and conditions may apply",
                "Divine guidance lights thy path, assuming thou remember to look up"
            ]
        },
        {
            name: "The Moon",
            symbol: "🌙",
            meanings: [
                "Illusion and mystery cloud thy vision, much like morning fog",
                "Trust thy intuition when logic fails, which happens more often than expected",
                "Hidden truths shall be revealed by moonlight, or good detective work"
            ]
        },
        {
            name: "The Sun",
            symbol: "☀️",
            meanings: [
                "Joy and success shine upon thee like a particularly cheerful sunrise",
                "Happiness and vitality fill thy days, assuming good weather",
                "All shall be illuminated in the light of truth and possibly vitamin D"
            ]
        },
        {
            name: "Judgement",
            symbol: "📯",
            meanings: [
                "A calling from above beckons thee to higher purpose, answer if convenient",
                "Rebirth and renewal await those who heed the cosmic telephone",
                "The past shall be forgiven, the future embraced, the present slightly confused"
            ]
        },
        {
            name: "The World",
            symbol: "🌍",
            meanings: [
                "Completion and fulfillment crown thy efforts like a very satisfied hat",
                "The universe celebrates thy achievements with cosmic confetti",
                "All things come full circle, hopefully in a good way"
            ]
        }
    ];

    // Select random cards for a three-card reading
    const shuffledCards = [...tarotCards].sort(() => Math.random() - 0.5);
    const pastCard = shuffledCards[0];
    const presentCard = shuffledCards[1]; 
    const futureCard = shuffledCards[2];

    // Herald's mystical introductions
    const mysticalIntros = [
        "🔮 Behold! The ancient cards speak of thy destiny!",
        "✨ Hark! The mystical forces reveal their secrets!",
        "🎭 Forsooth! The cosmic tapestry unfolds before mine eyes!",
        "🌟 By my troth! The celestial powers whisper thy fate!",
        "🔯 Verily! The sacred cards dance with divine knowledge!"
    ];

    const cardPositions = [
        "**THY PAST** - *What has shaped thy journey*",
        "**THY PRESENT** - *What influences thee now*", 
        "**THY FUTURE** - *What awaits thee ahead*"
    ];

    // Create a cohesive narrative based on the three cards
    const generateCohesiveReading = (past, present, future) => {
        // Traditional tarot themes for narrative building
        const cardThemes = {
            "The Fool": { theme: "new beginnings", energy: "adventurous" },
            "The Magician": { theme: "manifestation", energy: "powerful" },
            "The High Priestess": { theme: "intuition", energy: "mysterious" },
            "The Emperor": { theme: "authority", energy: "structured" },
            "The Hierophant": { theme: "tradition", energy: "wise" },
            "The Lovers": { theme: "relationships", energy: "harmonious" },
            "The Chariot": { theme: "determination", energy: "victorious" },
            "Strength": { theme: "inner power", energy: "courageous" },
            "The Hermit": { theme: "soul searching", energy: "contemplative" },
            "Wheel of Fortune": { theme: "change", energy: "cyclical" },
            "Justice": { theme: "balance", energy: "fair" },
            "The Hanged Man": { theme: "sacrifice", energy: "patient" },
            "Death": { theme: "transformation", energy: "renewing" },
            "Temperance": { theme: "moderation", energy: "balanced" },
            "The Devil": { theme: "temptation", energy: "challenging" },
            "The Tower": { theme: "upheaval", energy: "shocking" },
            "The Star": { theme: "hope", energy: "inspiring" },
            "The Moon": { theme: "illusion", energy: "mysterious" },
            "The Sun": { theme: "joy", energy: "radiant" },
            "Judgement": { theme: "rebirth", energy: "transformative" },
            "The World": { theme: "completion", energy: "fulfilled" }
        };

        const pastTheme = cardThemes[past.name];
        const presentTheme = cardThemes[present.name];
        const futureTheme = cardThemes[future.name];

        // Generate narrative connecting the three cards
        const narrativeTemplates = [
            `The ${pastTheme.energy} energy of thy past through ${past.name} has shaped thee into one who now faces ${present.name}'s call for ${presentTheme.theme}. This journey leads toward ${future.name}, where ${futureTheme.theme} awaits to crown thy efforts.`,
            
            `From the ${pastTheme.theme} represented by ${past.name}, thou hast learned ${pastTheme.energy} wisdom. Now ${present.name} brings ${presentTheme.energy} challenges of ${presentTheme.theme}, preparing thee for ${future.name}'s promise of ${futureTheme.theme}.`,
            
            `The cosmic forces reveal that ${past.name}'s ${pastTheme.theme} has been thy foundation. ${present.name} now offers ${presentTheme.energy} opportunities in ${presentTheme.theme}, leading to ${future.name}'s ${futureTheme.energy} destiny of ${futureTheme.theme}.`,
            
            `Behold how ${past.name} brought ${pastTheme.energy} lessons of ${pastTheme.theme} to thy path! ${present.name} now challenges thee with ${presentTheme.theme}, while ${future.name} promises ${futureTheme.energy} fulfillment through ${futureTheme.theme}.`
        ];

        return narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];
    };

    // Build the enhanced fortune reading
    const intro = mysticalIntros[Math.floor(Math.random() * mysticalIntros.length)];
    const cards = [pastCard, presentCard, futureCard];
    
    let reading = `${intro}\n\n`;
    reading += `🏰 **ROYAL PROPHECY FOR ${displayName.toUpperCase()}** 🏰\n\n`;

    // Show individual cards with their meanings
    cards.forEach((card, index) => {
        const meaning = card.meanings[Math.floor(Math.random() * card.meanings.length)];
        reading += `${card.symbol} ${cardPositions[index]}\n`;
        reading += `**${card.name}**\n`;
        reading += `*${meaning}*\n\n`;
    });

    // Add the cohesive narrative interpretation
    reading += `🔮 **THE HERALD'S INTERPRETATION** 🔮\n`;
    reading += `*${generateCohesiveReading(pastCard, presentCard, futureCard)}*\n\n`;

    // Herald's closing wisdom
    const closingWisdom = [
        "Thus do the ancient cards weave thy tale! May their wisdom guide thee well, good sir!",
        "Such is the cosmic narrative revealed! Use this knowledge wisely, Milord!",
        "The mystical forces have spoken thy story! Go forth with confidence!",
        "By royal decree of the universe, thy destiny is thus proclaimed!",
        "The sacred cards have revealed thy path! May fortune smile upon thy journey!"
    ];

    const randomClosing = closingWisdom[Math.floor(Math.random() * closingWisdom.length)];
    reading += `🎺 *${randomClosing}* 🎺\n\n`;
    reading += `*The Royal Herald's Mystical Division reminds thee that prophecies are for entertainment and should not be used for major life decisions, such as declaring war or choosing dinner.*`;

    console.log(`Prophecy delivered for ${displayName}`);
    message.reply(reading);
};

module.exports = prophecy;