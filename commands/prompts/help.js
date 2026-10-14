/* /help [topic] - the herald's scroll of services, seen only by the asker.
 *
 * Without a topic it lists the commands, grouped by each module's category
 * and generated from command metadata, so a new command shows up here
 * automatically. Commands with hidden: true (preview commands, test
 * utilities) are always left out, and adminOnly ones are shown only to
 * members with Manage Server, who are the only ones who can run them. A
 * hand-written list of the herald's daily doings follows.
 *
 * With a topic it shows that guide from flavor_text/helpGuides.js.
 */

const { ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const guides = require('../../flavor_text/helpGuides');

const EMBED_COLOR = 0xd4af37;

// Display order and headings; anything new lands after these.
const CATEGORIES = [
    ['CHARACTER', 'Thy Character'],
    ['SHOP', 'Shop and Trading'],
    ['GLORY', 'Points and Glory'],
    ['DUELS', 'Duels'],
    ['SUMMONS', 'Summons'],
    ['UTILITY', 'Utility'],
];
const ADMIN_HEADING = 'For the Stewards';

const DAILY = [
    '**Trivia**, a puzzle and a boss encounter, each at its own hour between 9 AM and 9 PM Eastern, and **the shop** from 9 AM to 9 PM Pacific',
    '**Voice** pays points for every hour spent together',
    '**Sunday at noon**, the weekly recap and its podiums',
    '**Wednesday at 9 PM**, WoW trivia',
    '**Achievements** proclaimed as they are earned',
    '**Birthdays** honoured, and in October, a daily treat',
].join('\n');

// Render a command's usage from its name and options: /whois <member>
const usageOf = (name, cmd) => {
    const opts = (cmd.options || [])
        .map((o) => (o.required ? ` <${o.name}>` : ` [${o.name}]`))
        .join('');
    return `/${name}${opts}`;
};

// An embed field holds 1024 characters; a long group spills into more fields.
const groupFields = (heading, lines) => {
    const fields = [];
    for (const line of lines) {
        const last = fields[fields.length - 1];
        if (last && `${last.value}\n${line}`.length <= 1024) last.value += `\n${line}`;
        else fields.push({ name: fields.length ? `${heading}, continued` : heading, value: line });
    }
    return fields;
};

const overview = (interaction, commands) => {
    const isAdmin = Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
    const groups = new Map();
    for (const [name, cmd] of Object.entries(commands)) {
        if (cmd.hidden || (cmd.adminOnly && !isAdmin)) continue;
        const key = cmd.adminOnly ? ADMIN_HEADING : cmd.category || 'UTILITY';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(`\`${usageOf(name, cmd)}\` - ${cmd.description}`);
    }
    const headings = new Map(CATEGORIES);
    const order = [
        ...CATEGORIES.map(([key]) => key).filter((key) => groups.has(key)),
        ...[...groups.keys()].filter((key) => !headings.has(key) && key !== ADMIN_HEADING),
        ...(groups.has(ADMIN_HEADING) ? [ADMIN_HEADING] : []),
    ];
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('The King\'s Herald: Royal Services')
        .setDescription('Greetings, good noble! I am thy faithful herald. These are my services, and `/help topic` tells thee more of any of them.')
        .addFields(order.flatMap((key) => groupFields(headings.get(key) || key, groups.get(key))))
        .addFields({ name: 'Every Day in the Realm', value: DAILY })
        .setFooter({ text: `Topics: ${Object.values(guides).map((g) => g.label).join(', ')}` });
    return embed;
};

const help = async function (interaction, commands) {
    const topic = interaction.options.getString('topic');
    console.log(`Herald providing assistance${topic ? ` on ${topic}` : ''}!`);
    const guide = topic && guides[topic];
    const embed = guide
        ? new EmbedBuilder().setColor(EMBED_COLOR).setTitle(guide.title).setDescription(guide.text)
        : overview(interaction, commands);
    await interaction.editReply({ embeds: [embed] });
};

module.exports = {
    description: 'Learn what the herald can do, or more of one topic (visible only to you)',
    category: 'UTILITY',
    ephemeral: true,
    options: [
        {
            name: 'topic',
            description: 'A guide to one part of the realm',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: Object.entries(guides).map(([value, g]) => ({ name: g.label, value })),
        },
    ],
    run: help,
};
