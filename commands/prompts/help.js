/* /help - the herald's scroll of services, generated from command metadata.
 *
 * Every loaded command exports { description, category, hidden, options, run }.
 * The scroll groups visible commands by category, so a new command shows up
 * here automatically — no hand-edited list to keep in sync. Commands with
 * hidden: true (preview commands, test utilities) are omitted on purpose.
 */

// Display order for known categories; anything new lands after these.
const CATEGORY_ORDER = ['NOBLE ANNOUNCEMENTS', 'ROYAL CHRONICLES', 'UTILITY'];

// Render a command's usage from its name and options: /whois <member>
const usageOf = (name, cmd) => {
    const opts = (cmd.options || [])
        .map((o) => (o.required ? ` <${o.name}>` : ` [${o.name}]`))
        .join('');
    return `/${name}${opts}`;
};

const help = async function (interaction, commands) {
    console.log("Herald providing assistance!");

    // Group visible commands by category, preserving load order within each.
    const byCategory = new Map();
    for (const [name, cmd] of Object.entries(commands)) {
        if (cmd.hidden) continue;
        const category = cmd.category || 'UTILITY';
        if (!byCategory.has(category)) byCategory.set(category, []);
        byCategory.get(category).push({ name, cmd });
    }

    const orderedCategories = [
        ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
        ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
    ];

    const sections = orderedCategories.map((category) => {
        const lines = byCategory
            .get(category)
            .map(({ name, cmd }) => `\`${usageOf(name, cmd)}\` - *${cmd.description}*`)
            .join('\n');
        return `**${category}**\n${lines}`;
    });

    const helpMessage = `**THE KING'S HERALD - ROYAL SERVICES**\n\n` +
        `*Greetings, noble sir! I am thy faithful herald, ready to serve the court with these royal proclamations:*\n\n` +
        sections.join('\n\n') + `\n\n` +

        `**AUTOMATIC ROYAL SERVICES**\n` +
        `*Royal acclaim for messages with fifty or more marks of favor*\n` +
        `*Each Sunday at noon, a chronicle of the week's most-celebrated posts and the standings of honor, proclaimed in the town square*\n\n` +

        `*"I remain thy humble servant, ready to herald thy greatness throughout the realm!"*`;

    await interaction.editReply(helpMessage);
};

module.exports = {
    description: 'Repeat this scroll of services',
    category: 'UTILITY',
    run: help,
};
