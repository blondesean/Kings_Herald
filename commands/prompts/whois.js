// Simple rate limiting - track last fetch time per guild
const lastFetchTimes = new Map();

const whois = function (prefix, message) {
    // Identify the server we are checking
    const guild = message.guild;

    // Get the name of the user (remove the command prefix and @ symbol if present)
    let targetUser = message.content.replace(`${prefix}whois `, "").trim();
    
    // Handle Discord mention format <@123456789> or <@!123456789>
    const mentionMatch = targetUser.match(/^<@!?(\d+)>$/);
    if (mentionMatch) {
        const userId = mentionMatch[1];
        const mentionedMember = guild.members.cache.get(userId);
        if (mentionedMember) {
            targetUser = mentionedMember.displayName;
            console.log(`Converted mention ${mentionMatch[0]} to display name: ${targetUser}`);
        }
    }
    
    // Remove @ symbol if user included it (e.g., "@username" becomes "username")
    if (targetUser.startsWith('@')) {
        targetUser = targetUser.substring(1);
    }

    // Check if the user specified someone
    if (!targetUser || targetUser === `${prefix}whois`) {
        message.reply("Pray tell, good sir, whom dost thou wish to know about? Specify a name, if you please!");
        return;
    }

    // Use cached members if available, otherwise fetch with timeout
    console.log(`Starting whois for ${targetUser} at ${new Date().toISOString()}`);
    
    const processMembers = (members) => {
        console.log(`Processing ${members.size} members (${guild.members.cache.size} cached)`);
        // Create a map of usernames and display names
        const userPairs = members.map((member) => ({
            username: member.user.username,
            nickname: member.displayName,
            member: member
        }));

        console.log(`Searching for user: ${targetUser}`);
        console.log(`Available users: ${userPairs.map(u => `${u.username}(${u.nickname})`).join(', ')}`);

        // Special case for the Herald bot itself
        if (targetUser.toLowerCase() === 'herald') {
            message.reply("Just a humble servant at your service, Milord!");
            return;
        }

        // Find the matching user (case-insensitive with fuzzy matching)
        const matchingUser = userPairs.find((userPair) => {
            const targetLower = targetUser.toLowerCase();
            const usernameLower = userPair.username.toLowerCase();
            const nicknameLower = userPair.nickname.toLowerCase();
            
            // Exact matches
            const usernameMatch = usernameLower === targetLower;
            const nicknameMatch = nicknameLower === targetLower;
            
            // Fuzzy matches - handle common variations
            const targetNormalized = targetLower.replace(/[,._-]/g, ' ').replace(/\s+/g, ' ').trim();
            const nicknameNormalized = nicknameLower.replace(/[,._-]/g, ' ').replace(/\s+/g, ' ').trim();
            const usernameNormalized = usernameLower.replace(/[,._-]/g, ' ').replace(/\s+/g, ' ').trim();
            
            const fuzzyNicknameMatch = nicknameNormalized === targetNormalized;
            const fuzzyUsernameMatch = usernameNormalized === targetNormalized;
            
            console.log(`Checking ${userPair.username}/${userPair.nickname} against ${targetUser}:`);
            console.log(`  Exact: username=${usernameMatch}, nickname=${nicknameMatch}`);
            console.log(`  Fuzzy: username=${fuzzyUsernameMatch}, nickname=${fuzzyNicknameMatch}`);
            console.log(`  Normalized: "${targetNormalized}" vs "${nicknameNormalized}"`);
            
            return usernameMatch || nicknameMatch || fuzzyUsernameMatch || fuzzyNicknameMatch;
        });

        // Handle user not found
        if (!matchingUser) {
            const heraldResponses = [
                `Alas! The name "${targetUser}" is unknown to me, good sir. Perhaps they have fled the realm?`,
                `By my troth! No soul by the name "${targetUser}" dwells in these halls, my lord.`,
                `Forsooth! "${targetUser}" remains a mystery to this humble herald. Mayhap check thy spelling?`
            ];
            const randomResponse = heraldResponses[Math.floor(Math.random() * heraldResponses.length)];
            message.reply(randomResponse);
            return;
        }

        const member = matchingUser.member;
        console.log(`Found user: ${matchingUser.username}`);

        // Get user roles, excluding @everyone and bot roles
        const allRoles = member.roles.cache.map((role) => role.name);
        const userRoles = allRoles.filter(role => 
            role !== '@everyone' && 
            !role.toLowerCase().includes('bot') &&
            !role.toLowerCase().includes('muted')
        );

        console.log(`${targetUser} has ${userRoles.length} roles: ${userRoles.join(', ')}`);

        // If no meaningful roles, give a basic announcement
        if (userRoles.length === 0) {
            const basicAnnouncements = [
                `Ah yes, I know of ${matchingUser.nickname}... though they appear quite unremarkable, my lord.`,
                `Indeed, ${matchingUser.nickname} dwells among us, but they appear rather unremarkable, good sir.`,
                `Verily, I am acquainted with ${matchingUser.nickname}, yet they seem most unremarkable to these eyes.`,
                `'Tis true, ${matchingUser.nickname} walks these halls, though they appear unremarkable in deed and title.`
            ];
            let randomAnnouncement = basicAnnouncements[Math.floor(Math.random() * basicAnnouncements.length)];
            
            // Check if user has admin permissions even with no visible roles
            const isAdmin = member.permissions.has('Administrator') || 
                           member.roles.cache.some(role => 
                               role.name.toLowerCase().includes('admin') || 
                               role.permissions.has('Administrator')
                           );

            if (isAdmin) {
                randomAnnouncement += "\n\n**...and they're also an Admin, Milord!**";
            }

            message.reply(randomAnnouncement);
            return;
        }

        // Select up to 3 random roles
        const selectedRoles = [];
        const maxRoles = Math.min(userRoles.length, 3);
        const usedIndices = new Set();
        
        while (selectedRoles.length < maxRoles) {
            const randomIndex = Math.floor(Math.random() * userRoles.length);
            if (!usedIndices.has(randomIndex)) {
                selectedRoles.push(userRoles[randomIndex]);
                usedIndices.add(randomIndex);
            }
        }

        // Royal adjectives for flair
        const royalAdjectives = [
            "magnificent", "illustrious", "noble", "distinguished", "esteemed", "renowned", 
            "celebrated", "exalted", "glorious", "majestic", "splendid", "resplendent",
            "venerable", "honorable", "acclaimed", "revered", "legendary", "fabled",
            "mighty", "valiant", "gallant", "stalwart", "steadfast", "unwavering",
            "gracious", "benevolent", "wise", "learned", "scholarly", "astute",
            "radiant", "luminous", "brilliant", "dazzling", "extraordinary", "remarkable"
        ];

        // Herald announcement templates
        const announcementTemplates = [
            {
                opening: "HEAR YE, HEAR YE!",
                intro: `Thou dost inquire about ${matchingUser.nickname}?`,
                titles: [
                    "Behold! The {adj} {role}!",
                    "Witness! The {adj} {role}!",
                    "Marvel at the {adj} {role}!"
                ],
                closing: `Such is the {adj} ${matchingUser.nickname}, may their name echo through the ages!`
            },
            {
                opening: "BY ROYAL DECREE!",
                intro: `You seek knowledge of the esteemed ${matchingUser.nickname}?`,
                titles: [
                    "Know them as the {adj} {role}!",
                    "They are called the {adj} {role}!",
                    "Renowned as the {adj} {role}!"
                ],
                closing: `Thus stands the {adj} ${matchingUser.nickname} before thee!`
            },
            {
                opening: "PROCLAMATION!",
                intro: `Ah! You would know of ${matchingUser.nickname}!`,
                titles: [
                    "The realm knows them as the {adj} {role}!",
                    "Far and wide, they're hailed as the {adj} {role}!",
                    "In song and story, the {adj} {role}!"
                ],
                closing: `Verily, 'tis the {adj} ${matchingUser.nickname} of whom legends speak!`
            }
        ];

        // Select random template
        const template = announcementTemplates[Math.floor(Math.random() * announcementTemplates.length)];
        
        // Build the announcement
        let announcement = template.opening + "\n" + template.intro + "\n\n";
        
        // Add the three titles with random adjectives
        for (let i = 0; i < selectedRoles.length; i++) {
            const randomAdj = royalAdjectives[Math.floor(Math.random() * royalAdjectives.length)];
            const titleTemplate = template.titles[i % template.titles.length];
            announcement += titleTemplate.replace("{adj}", randomAdj).replace("{role}", selectedRoles[i]) + "\n";
        }
        
        // Add closing with final adjective
        const finalAdj = royalAdjectives[Math.floor(Math.random() * royalAdjectives.length)];
        announcement += "\n" + template.closing.replace("{adj}", finalAdj);

        // Check if user has admin permissions
        const isAdmin = member.permissions.has('Administrator') || 
                       member.roles.cache.some(role => 
                           role.name.toLowerCase().includes('admin') || 
                           role.permissions.has('Administrator')
                       );

        // Add admin announcement if they're an admin
        if (isAdmin) {
            announcement += "\n\n**...and they're also an Admin, Milord!**";
        }

        console.log("Herald announcement:", announcement);
        console.log(`Responding at ${new Date().toISOString()}`);
        message.reply(announcement);
    };

    // Smart rate limiting - only fetch if we haven't fetched recently
    const now = Date.now();
    const lastFetch = lastFetchTimes.get(guild.id) || 0;
    const timeSinceLastFetch = now - lastFetch;
    const FETCH_COOLDOWN = 10000; // 10 seconds cooldown
    
    if (timeSinceLastFetch < FETCH_COOLDOWN && guild.members.cache.size > 2) {
        console.log(`Using cached members (${guild.members.cache.size} available, last fetch ${Math.round(timeSinceLastFetch/1000)}s ago)`);
        processMembers(guild.members.cache);
    } else {
        console.log(`Fetching fresh member list (last fetch ${Math.round(timeSinceLastFetch/1000)}s ago)...`);
        lastFetchTimes.set(guild.id, now);
        
        // Add timeout to prevent hanging
        const fetchPromise = guild.members.fetch();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Member fetch timeout')), 8000)
        );
        
        Promise.race([fetchPromise, timeoutPromise]).then((members) => {
            console.log(`Successfully fetched ${members.size} members`);
            processMembers(members);
        }).catch((error) => {
            console.error('Error fetching members:', error);
            // Fallback to cache if fetch fails
            if (guild.members.cache.size > 0) {
                console.log('Falling back to cached members due to fetch error');
                processMembers(guild.members.cache);
            } else {
                message.reply("Alas! The royal archives seem to be in disarray. Pray try again, good sir!");
            }
        });
    }
};

module.exports = whois;