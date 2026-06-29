const help = function (prefix, message) {
    console.log("Herald providing assistance!");

    const helpMessage = `**THE KING'S HERALD - ROYAL SERVICES**\n\n` +
        `*Greetings, noble sir! I am thy faithful herald, ready to serve the court with these royal proclamations:*\n\n` +

        `**NOBLE ANNOUNCEMENTS**\n` +
        `\`${prefix}whois [name]\` - *Proclaim the titles and roles of any court member*\n\n` +

        `**ROYAL CHRONICLES**\n` +
        `\`${prefix}reactions [name]\` - *Chronicle one's favorite marks of expression*\n` +
        `\`${prefix}activity\` - *Report the most active nobles in this chamber*\n` +
        `\`${prefix}recap\` - *Preview the weekly chronicle of the most-celebrated posts*\n\n` +

        `**UTILITY**\n` +
        `\`${prefix}ping\` - *Confirm the herald yet draws breath*\n` +
        `\`${prefix}complain [grievance]\` - *Petition the crown; thy words are inscribed in the royal ledger*\n` +
        `\`${prefix}help\` - *Repeat this scroll of services*\n\n` +

        `**AUTOMATIC ROYAL SERVICES**\n` +
        `*Royal acclaim for messages with fifty or more marks of favor*\n` +
        `*Each Sunday at noon, a chronicle of the week's most-celebrated posts and the standings of honor, proclaimed in #general*\n\n` +

        `*"I remain thy humble servant, ready to herald thy greatness throughout the realm!"*`;

    message.reply(helpMessage);
};

module.exports = help;
