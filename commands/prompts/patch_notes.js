/* /patch_notes <notes> [title] [channel] - admin-only: post a public
 * announcement of recent changes/features (e.g. "nerf to duplicate reaction
 * emoji"), in the Herald's voice, to the guild's announce channel by default.
 *
 * There's no auto-generated changelog here on purpose: commit messages
 * (see scripts/updatelog.js) are written for developers, not players, and
 * read poorly as a feature announcement without editorializing. An admin
 * writes the notes; the Herald just delivers them with the right ceremony.
 *
 * adminOnly + hidden mirror the other admin utility commands (see
 * commands/prompts/point_adjust.js): Discord restricts it to members with
 * the Manage Server permission, and it's kept out of the generated /help.
 */

const { ApplicationCommandOptionType, ChannelType, EmbedBuilder } = require('discord.js');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');

const EMBED_COLOR = 0xd4af37; // heraldic gold
const DEFAULT_TITLE = "By Royal Decree: Improvements to the Realm";
const INTRO_LINE = "Hear ye, hear ye! The Herald has been hard at work behind the scenes. Let it be known that:";

// Discord caps embed descriptions at 4096 characters; leave room for the
// intro line and truncate the notes themselves if somehow still too long.
const DESCRIPTION_MAX = 4096;

const patchNotes = async function (interaction) {
    const guild = interaction.guild;
    const admin = interaction.member;
    const notes = interaction.options.getString('notes');
    const title = interaction.options.getString('title') || DEFAULT_TITLE;
    const requestedChannel = interaction.options.getChannel('channel');

    const channel = requestedChannel || findAnnounceChannel(guild);
    if (!channel) {
        await interaction.editReply("Alack! I find no chamber in which to post that decree, Milord.");
        return;
    }

    let description = `${INTRO_LINE}\n\n${notes}`;
    if (description.length > DESCRIPTION_MAX) {
        description = `${description.slice(0, DESCRIPTION_MAX - 3)}...`;
    }

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: `Proclaimed by ${admin.displayName}` })
        .setTimestamp();

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('patch_notes: failed to post announcement:', error);
        await interaction.editReply(`Alack! I could not deliver that decree to #${channel.name}, Milord.`);
        return;
    }

    console.log(`Patch notes (guild ${guild.id}): ${admin.displayName} (${admin.id}) posted "${title}" to #${channel.name}.`);
    await interaction.editReply(`By royal decree, thy proclamation has been posted in #${channel.name}.`);
};

module.exports = {
    description: "Post a public announcement of recent changes to the realm",
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'notes',
            description: 'The body of the announcement (what changed)',
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 3900,
        },
        {
            name: 'title',
            description: `Custom heading (default: "${DEFAULT_TITLE}")`,
            type: ApplicationCommandOptionType.String,
            required: false,
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
