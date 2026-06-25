const help = function (prefix, message) {
    console.log("Herald providing assistance!");

    const helpMessage = `**THE KING'S HERALD - ROYAL SERVICES**\n\n` +
        `*Greetings, noble sir! I am thy faithful herald, ready to serve the court with these royal proclamations:*\n\n` +
        
        `**NOBLE ANNOUNCEMENTS**\n` +
        `\`${prefix}whois [name]\` - *Proclaim the titles and roles of any court member*\n` +
        `\`${prefix}prophecy [name]\` - *Divine mystical fortunes through ancient cards*\n\n` +
        
        `**ROYAL CHRONICLES**\n` +
        `\`${prefix}reactions [name]\` - *Chronicle one's favorite marks of expression*\n` +
        `\`${prefix}activity\` - *Report the most active nobles in this chamber*\n\n` +
        
        `**GRAND CELEBRATIONS**\n` +
        `\`${prefix}feast\` - *Declare a magnificent royal banquet*\n` +
        `\`${prefix}pets\` - *Celebrate the noble creatures of the realm*\n` +
        `\`${prefix}news\` - *Share the most peculiar tidings of the day*\n\n` +
        
        `**AUTOMATIC ROYAL SERVICES**\n` +
        `*Feast announcements when food is mentioned*\n` +
        `*Pet celebrations for images in pet channels*\n` +
        `*Royal acclaim for messages with 10+ reactions*\n\n` +
        
        `*"I remain thy humble servant, ready to herald thy greatness throughout the realm!"*\n\n` +
        
        `*For detailed proclamations, simply speak the command and I shall serve thee well, Milord!*`;

    message.reply(helpMessage);
};

module.exports = help;