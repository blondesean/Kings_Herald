/* /patch_notes <type> <area> [channel] - admin-only: post a public
 * announcement of a recent change, in the Herald's voice, to the guild's
 * announce channel by default.
 *
 * Deliberately not free-text: the admin only picks a change type (Nerf /
 * Buff / Fix / New Feature) and types a short, non-technical `area` name
 * (e.g. "podium reaction counting") — the Herald supplies the ceremony
 * (see flavor_text/patchNotesFlavor.js). No mechanism, numbers, or
 * implementation detail ever needs to be spelled out for players.
 *
 * There's no auto-generated changelog here on purpose: commit messages
 * (see scripts/updatelog.js) are written for developers, not players, and
 * read poorly as a feature announcement without editorializing.
 *
 * adminOnly + hidden mirror the other admin utility commands (see
 * commands/prompts/point_adjust.js): Discord restricts it to members with
 * the Manage Server permission, and it's kept out of the generated /help.
 */

const { ApplicationCommandOptionType, ChannelType, EmbedBuilder } = require('discord.js');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const flavor = require('../../flavor_text');

const EMBED_COLOR = 0xd4af37; // heraldic gold

const TYPE_CHOICES = [
    { name: 'Nerf', value: 'nerf' },
    { name: 'Buff', value: 'buff' },
    { name: 'Fix', value: 'fix' },
    { name: 'New Feature', value: 'feature' },
];

const patchNotes = async function (interaction) {
    const guild = interaction.guild;
    const admin = interaction.member;
    const type = interaction.options.getString('type');
    const area = interaction.options.getString('area');
    const requestedChannel = interaction.options.getChannel('channel');

    const channel = requestedChannel || findAnnounceChannel(guild);
    if (!channel) {
        await interaction.editReply("Alack! I find no chamber in which to post that decree, Milord.");
        return;
    }

    const { title, body } = flavor.patchNoteAnnouncement(type, area);

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(body)
        .setFooter({ text: `Proclaimed by ${admin.displayName}` })
        .setTimestamp();

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('patch_notes: failed to post announcement:', error);
        await interaction.editReply(`Alack! I could not deliver that decree to #${channel.name}, Milord.`);
        return;
    }

    console.log(`Patch notes (guild ${guild.id}): ${admin.displayName} (${admin.id}) posted a ${type} announcement about "${area}" to #${channel.name}.`);
    await interaction.editReply(`By royal decree, thy proclamation has been posted in #${channel.name}.`);
};

module.exports = {
    description: "Announce a recent change to the realm, in the Herald's voice",
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'type',
            description: 'What kind of change this is',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: TYPE_CHOICES,
        },
        {
            name: 'area',
            description: "Short, non-technical name for what changed (e.g. 'podium reaction counting')",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 100,
        },
        {
            name: 'channel',
            description: "Where to post (default: the guild's announce channel)",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
        },
    ],
    run: patchNotes,
};
