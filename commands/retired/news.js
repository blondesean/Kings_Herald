const https = require('https');

const news = function (prefix, message) {
    // First, try to fetch real news
    message.reply("🏰 Consulting the royal ravens for the latest tidings from distant lands... 📜");

    // Fetch real news from a free RSS feed (BBC News)
    const fetchRealNews = () => {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'feeds.bbci.co.uk',
                path: '/news/rss.xml',
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; KingsHerald/1.0)'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        // Simple XML parsing to extract titles
                        const titleMatches = data.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g);
                        if (titleMatches && titleMatches.length > 1) {
                            // Skip the first title (usually the feed title) and get random headline
                            const headlines = titleMatches.slice(1).map(match => 
                                match.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '')
                            );
                            const randomHeadline = headlines[Math.floor(Math.random() * Math.min(headlines.length, 10))];
                            resolve(randomHeadline);
                        } else {
                            reject(new Error('No headlines found'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    };

    // Try to get real news, fallback to absurd news if it fails
    fetchRealNews().then(realHeadline => {
        console.log(`Got real headline: ${realHeadline}`);
        deliverHeraldNews(realHeadline, true);
    }).catch(error => {
        console.log('Failed to fetch real news, using absurd news:', error.message);
        deliverHeraldNews(null, false);
    });

    function deliverHeraldNews(headline, isReal) {
        // Herald's absurdist interpretations of real news
        const heraldInterpretations = [
            "Verily, the distant realm reports that",
            "By my troth, word from foreign lands tells that", 
            "Forsooth, the royal ravens bring news that",
            "Hark! Intelligence from beyond our borders suggests",
            "The court's spies report most peculiarly that",
            "Strange tidings from across the seas declare that"
        ];

        const heraldReactions = [
            "The King has declared this 'most perplexing' and ordered the court wizard to investigate.",
            "Her Majesty has raised an eyebrow and requested more wine to process this information.",
            "The Royal Council has voted to pretend they understand what this means.",
            "Court scholars are frantically consulting ancient texts to determine if this is normal.",
            "The King's advisor has suggested this might be 'one of those modern things' and should be ignored.",
            "Royal mathematicians have calculated this has a 73% chance of being 'quite odd indeed.'"
        ];

        let newsReport;

        if (isReal && headline) {
            // Present real news with medieval flair
            const interpretation = heraldInterpretations[Math.floor(Math.random() * heraldInterpretations.length)];
            const reaction = heraldReactions[Math.floor(Math.random() * heraldReactions.length)];
            
            newsReport = `📰 **ROYAL HERALD'S FOREIGN DISPATCH** 📰\n\n`;
            newsReport += `${interpretation} **"${headline}"**\n\n`;
            newsReport += `${reaction}\n\n`;
            newsReport += `*The Herald notes this news comes from the mysterious realm known as "The Outside World" and may contain traces of reality.* 🎺🌍`;
        } else {
            // Fallback to absurd news
            generateAbsurdNews();
            return;
        }

        message.channel.send(newsReport);
    }

    function generateAbsurdNews() {
        // Fallback absurdist news components
        const newsSubjects = [
        "The Royal Geese", "A Mysterious Turnip", "The Court Jester", "Three Wandering Minstrels", 
        "The King's Favorite Spoon", "A Particularly Stubborn Donkey", "The Palace Cat", 
        "Seven Dancing Chickens", "A Magical Cabbage", "The Royal Baker's Apprentice",
        "An Enchanted Wheelbarrow", "The Village Blacksmith", "A Singing Potato", 
        "The Queen's Pet Dragon", "A Confused Merchant", "The Royal Sock Collection",
        "A Rebellious Cheese Wheel", "The Court Astronomer", "A Talking Mushroom",
        "The King's Lost Sandwich", "A Philosophical Pig", "The Royal Gardener's Shovel"
    ];

    const newsActions = [
        "has declared war on", "was spotted dancing with", "reportedly married", 
        "accidentally invented", "was caught stealing", "has formed an alliance with",
        "mysteriously transformed into", "was seen arguing with", "has challenged to a duel",
        "discovered the secret of", "was found hiding in", "has proclaimed themselves ruler of",
        "was observed teaching", "mysteriously vanished with", "has been accused of enchanting",
        "was caught red-handed eating", "has announced their candidacy for", "was seen fleeing from",
        "has declared their undying love for", "was found guilty of impersonating", "has invented a new dance involving"
    ];

    const newsObjects = [
        "the entire royal treasury", "a flock of rainbow sheep", "the concept of Tuesday",
        "all the kingdom's left shoes", "a giant wheel of cheese", "the royal throne (again)",
        "seventeen confused badgers", "the art of invisible juggling", "a conspiracy of turnips",
        "the kingdom's supply of purple ink", "a secret society of spoons", "the royal laundry",
        "all known varieties of soup", "a parliament of owls", "the ancient art of sock folding",
        "the kingdom's emergency pickle reserves", "a troupe of acrobatic vegetables", "the royal collection of funny hats",
        "the mysterious case of the missing Tuesday", "a rebellion of kitchen utensils", "the sacred art of backwards walking"
    ];

    const newsLocations = [
        "in the royal pantry", "atop the castle's highest tower", "beneath the moat",
        "inside a giant pumpkin", "during the weekly turnip inspection", "at the annual Cheese Festival",
        "in the Court of Confused Nobles", "within the Realm of Perpetual Breakfast", 
        "at the intersection of Nonsense and Absurdity", "in the Kingdom's Department of Silly Walks",
        "during the Great Spoon Shortage of Tuesday", "at the Royal Academy of Backwards Thinking",
        "in the legendary Land of Misplaced Socks", "during the Festival of Confused Vegetables",
        "at the Court of Appeals for Ridiculous Matters", "in the Royal Library of Unfinished Sentences",
        "during the Annual Convention of Talking Furniture", "at the Ministry of Unnecessary Complications"
    ];

    const newsConsequences = [
        "causing widespread confusion among the royal cows",
        "resulting in a kingdom-wide shortage of common sense",
        "leading to the Great Pickle Panic of this afternoon",
        "prompting the King to declare a national day of bewilderment",
        "causing all the kingdom's chickens to speak only in riddles",
        "resulting in the temporary banning of the color purple",
        "leading to a royal decree that all Tuesdays shall henceforth be Wednesdays",
        "causing the royal mathematicians to forget how to count past seven",
        "resulting in all the kingdom's bread to taste mysteriously of adventure",
        "prompting the formation of the Royal Committee for Absurd Affairs",
        "leading to the Great Confusion of Whether It's Morning or Evening",
        "causing the royal horses to demand better working conditions and dental coverage"
    ];

    // Generate absurd news
    const subject = newsSubjects[Math.floor(Math.random() * newsSubjects.length)];
    const action = newsActions[Math.floor(Math.random() * newsActions.length)];
    const object = newsObjects[Math.floor(Math.random() * newsObjects.length)];
    const location = newsLocations[Math.floor(Math.random() * newsLocations.length)];
    const consequence = newsConsequences[Math.floor(Math.random() * newsConsequences.length)];

    // Herald news opening phrases
    const newsOpenings = [
        "📰 **ROYAL HERALD'S DAILY CHRONICLE** 📰",
        "🏰 **BREAKING NEWS FROM THE REALM** 🏰", 
        "⚡ **URGENT DISPATCH FROM THE COURT** ⚡",
        "🎭 **THE HERALD'S MORNING PROCLAMATION** 🎭",
        "👑 **ROYAL NEWS OF UTMOST IMPORTANCE** 👑"
    ];

    const newsIntros = [
        "Hear ye! The most pressing matter of this day:",
        "By royal decree, it is proclaimed that:",
        "Hark! Word has reached the court that:",
        "Forsooth! The realm buzzes with news that:",
        "Verily! 'Tis reported throughout the land that:",
        "By my troth! Intelligence suggests that:"
    ];

    const newsClosings = [
        "The King has declared this 'moderately concerning' and has ordered the royal advisors to 'figure it out by teatime.'",
        "Royal investigators are baffled and have requested additional funding for 'more confusion research.'",
        "The Queen has reportedly shrugged and returned to her afternoon embroidery of philosophical cats.",
        "Court scholars are debating whether this constitutes a crisis or merely 'Tuesday being Tuesday again.'",
        "The Royal Council has voted to form a committee to discuss forming another committee about this matter.",
        "His Majesty has declared this 'perfectly normal for a Wednesday' despite it being clearly Thursday."
    ];

    // Build the absurd news report
    const opening = newsOpenings[Math.floor(Math.random() * newsOpenings.length)];
    const intro = newsIntros[Math.floor(Math.random() * newsIntros.length)];
    const closing = newsClosings[Math.floor(Math.random() * newsClosings.length)];

    const headline = `**${subject} ${action} ${object} ${location}, ${consequence}.**`;

        const fullNews = `${opening}\n\n${intro}\n\n${headline}\n\n${closing}\n\n*The Herald reminds all subjects that this news is absolutely, completely, and utterly factual.* 🎺📜`;

        console.log("Herald delivering absurd news!");
        message.channel.send(fullNews);
    }
};

module.exports = news;