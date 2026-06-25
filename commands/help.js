const help = function (prefix, message) {
    console.log("Herald providing assistance!");

    const helpMessage = `**THE KING'S HERALD - ROYAL SERVICES**\n\n` +
        `*Greetings, noble sir! I am thy faithful herald, ready to serve the court with these royal proclamations:*\n\n` +

        `**NOBLE ANNOUNCEMENTS**\n` +
        `\`${prefix}whois [name]\` - *Proclaim the titles and roles of any court member*\n\n` +

        `**ROYAL CHRONICLES**\n` +
        `\`${prefix}reactions [name]\` - *Chronicle one's favorite marks of expression*\n` +
        `\`${prefix}activity\` - *Report the most active nobles in this chamber*\n\n` +

        `**UTILITY**\n` +
        `\`${prefix}ping\` - *Confirm the herald yet draws breath*\n` +
        `\`${prefix}help\` - *Repeat this scroll of services*\n\n` +

        `**AUTOMATIC ROYAL SERVICES**\n` +
        `*Royal acclaim for messages with ten or more marks of favor*\n\n` +

        `*"I remain thy humble servant, ready to herald thy greatness throughout the realm!"*`;

    message.reply(helpMessage);
};

module.exports = help;
