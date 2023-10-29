const whois = function (prefix, message) {

    //Identify the server we are checking
    const guild = message.guild;

    //Get the name of the user
    //console.log("message is | " + message);
    const targetUser = message.content.replace("!whois ", "");

    //console.log("The Username is " + targetUser + "|");

    //check if the user is real
    if (targetUser == "!whois") {
        message.reply("Please specify who you would like to know about, sir.");
        return;
    } else {

        // Fetch all members in the guild and then map them to an array of usernames
        guild.members.fetch().then((members) => {

            //This gets a pairwise list of all user and display names on the server
            const userPairs = members.map((member) => {
                const globalName = member.user.username;
                const serverNickname = member.displayName;
                return { username: globalName, nickname: serverNickname };
            });

            //Listing Members
            console.log("List members...");
            console.log(userPairs);

            //this finds the users true user name, because the requester will probably specify a display name, but will also work for their username
            const matchingUser = userPairs.find((userPair) => {
                // Check if the targetUser matches the username or nickname in the array
                return userPair.username.toLowerCase() === targetUser.toLowerCase() || userPair.nickname.toLowerCase() === targetUser.toLowerCase();
            });

            //let the user know know user has that name
            if (typeof matchingUser === "undefined") {
                message.reply("The user " + targetUser + " is unknown to me, sir.");
            };

            console.log("The target user's true name is " + matchingUser.username);

            //list that user's roles
            const member = guild.members.cache.find((member) => member.user.tag === matchingUser.username);

            //get list of roles for this user
            if (member) {
                const userRoles = member.roles.cache.map((role) => role.name);
                //message.channel.send(`Roles of ${member.user.tag}: ${userRoles.join(', ')}`);

                console.log(targetUser + " has " + (userRoles.length - 1) + " roles");
                console.log("The roles are " + userRoles);

                //pick up to 3 roles to share
                const selectedRoleSlots = [];
                var maxSlots = Math.min(userRoles.length - 1, 3);
                var usedNumbers = [];
                while (selectedRoleSlots.length < maxSlots) {
                    const randomNumber = Math.floor(Math.random() * (userRoles.length - 1));

                    if (!usedNumbers.includes(randomNumber)) {
                        selectedRoleSlots.push(randomNumber);
                        usedNumbers.push(randomNumber);
                    }
                }

                console.log("Selected role slots are = " + selectedRoleSlots);

                //pick an equal number of adjectives to share
                const flairAdjectivesList = ["amazing", "incredible", "insane", "bonkers", "wonderful", "friendly", "friendly", "natural", "optimistic", "jubilant", "generous", "instantaneous", "good", "nurturing", "nutritious", "creative", "superb", "amazing", "quiet", "divine", "thriving", "honest", "handsome", "celebrated", "distinguished", "thrilling", "marvelous", "harmonious", "enthusiastic", "victory", "imaginative", "brave", "robust", "acclaimed", "popular", "meritorious", "genius", "instinctive", "heavenly", "novel", "independent", "inventive", "bountiful", "effervescent", "trustworthy", "efficient", "truthful", "calm", "seemly", "agreeable", "quick", "lucky", "lucid", "special", "energetic", "valued", "classic", "spirited", "cute", "supporting", "honorable", "ideal", "quality", "plentiful", "masterful", "genuine", "intellectual", "endorsed", "upstanding", "ethical", "vital", "paradise", "fetching", "worthy", "excellent", "vivacious", "charming", "soulful", "honored", "cool", "sunny", "glamorous", "innovative", "impressive", "intuitive", "hearty", "respected", "clean", "stirring", "pleasant", "electrifying", "unwavering", "constant", "successful", "nice", "composed", "stupendous", "meaningful", "intelligent", "gorgeous", "active", "principled", "lively", "luminous", "growing", "terrific", "accomplish", "positive", "classical", "spiritual", "familiar", "wholesome", "great", "fabulous", "learned", "champ", "skillful", "polished", "enchanting", "upbeat", "keen", "poised", "delightful", "thorough", "fun", "flourishing", "yummy", "tranquil", "earnest", "esteemed", "virtuous", "affirmative", "protected", "angelic", "ready", "adventurous", "prominent", "affluent", "proud", "pretty", "cheery", "sparkling", "fantastic", "wonderful", "healthy", "engaging", "victorious", "appealing", "reassuring", "moving", "giving", "refined", "funny", "brilliant", "adorable", "progress", "ecstatic", "prepared", "knowing", "aptitude", "refreshing", "attractive", "awesome", "reliable", "motivating", "miraculous", "lovely", "beautiful", "resounding", "beaming", "remarkable", "exciting", "champion", "restored", "graceful", "fine", "bubbly", "secure", "fortunate", "kind", "courageous", "super", "favorable", "wondrous", "essential", "vigorous", "famous", "willing", "free", "zealous", "energized", "vibrant", "stunning", "encouraging", "upright", "elegant", "dazzling", "surprising", "powerful", "happy", "exquisite", "phenomenal", "skilled", "fair", "glowing", "jovial", "knowledgeable", "effortless", "productive", "unreal", "fitting", "legendary"];
                const selectedAdjectiveSlots = [];
                maxSlots = Math.min(selectedRoleSlots.length, 3) + 1;
                usedNumbers = [];
                while (selectedAdjectiveSlots.length < maxSlots) {
                    const randomNumber = Math.floor(Math.random() * (flairAdjectivesList.length - 1));

                    if (!usedNumbers.includes(randomNumber)) {
                        selectedAdjectiveSlots.push(randomNumber);
                        usedNumbers.push(randomNumber);
                    }
                }
                //console.log("Selected adjective slots are = " + selectedAdjectiveSlots);

                //Compile the tell the user about their inquiry using the randomly selected adjective and roles!
                var announcement = "";
                announcement = "OH! You would like to know about " + targetUser + "!?";
                if (selectedAdjectiveSlots.length >= 1) { announcement = announcement + " The " + flairAdjectivesList[selectedAdjectiveSlots[0]] + " " + userRoles[selectedRoleSlots[0]] + "!"; }
                if (selectedAdjectiveSlots.length >= 1) { announcement = announcement + " Nay the " + flairAdjectivesList[selectedAdjectiveSlots[1]] + " " + userRoles[selectedRoleSlots[1]] + "!"; }
                if (selectedAdjectiveSlots.length >= 1) { announcement = announcement + " Perhaps better known as the " + flairAdjectivesList[selectedAdjectiveSlots[2]] + " " + userRoles[selectedRoleSlots[2]] + "!"; }
                announcement = announcement + " That is the " + flairAdjectivesList[selectedAdjectiveSlots[3]] + " " + targetUser + "!"; 

                //Send the final result
                console.log("The message is | " + announcement);
                message.reply(announcement);

            } 

        }).catch((error) => {
            console.error('Error fetching members:', error);
        });
    }

    return;

};

module.exports = whois;