/* /herald_channel <scope> [channel] - choose which channel a scheduled
 * behavior posts to.
 *
 * `scope` is one of the games in src/resolveChannel.js's SCOPES, or `all` as
 * a catch-all default beneath the per-game ones. Giving `channel` sets the
 * override; leaving it out clears it, reverting that scope to its built-in
 * default channel (see each module's own fallback, usually findAnnounceChannel).
 *
 * This only changes where the real scheduled post lands. A preview command
 * (/trivia, /shop_test, /recap, ...) always posts in the channel it was run
 * in, regardless of any override — only prompts and passive behaviors
 * actually differ in where they belong: a prompt answers where it was asked,
 * a passive behavior has no "where it was asked" at all, so an admin has to
 * say where it belongs.
 *
 * adminOnly + hidden, like the other admin commands; ephemeral so the change
 * (and any mistake while finding the right channel) isn't broadcast.
 */

const { ApplicationCommandOptionType, ChannelType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { SCOPES } = require('../../src/resolveChannel');

const heraldChannel = async function (interaction) {
    const scope = interaction.options.getString('scope');
    const channel = interaction.options.getChannel('channel');

    try {
        if (!channel) {
            await pointsStore.clearChannelOverride(interaction.guild.id, scope);
            await interaction.editReply(`"${SCOPES[scope]}" now posts to its default channel again.`);
            return;
        }

        const perms = channel.permissionsFor(interaction.guild.members.me);
        if (!perms || !perms.has('ViewChannel') || !perms.has('SendMessages')) {
            await interaction.editReply(`I cannot post in ${channel}, Milord — grant me View Channel and Send Messages there first.`);
            return;
        }

        await pointsStore.setChannelOverride(interaction.guild.id, scope, channel.id);
        await interaction.editReply(`"${SCOPES[scope]}" will now post to ${channel}.`);
    } catch (error) {
        console.error('Error setting a channel override:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Choose which channel a scheduled behavior posts to (omit channel to reset)',
    category: 'ROYAL CHRONICLES',
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    ephemeral: true,
    options: [
        {
            name: 'scope',
            description: 'Which scheduled behavior to move',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: Object.entries(SCOPES).map(([value, label]) => ({ name: label.slice(0, 100), value })),
        },
        {
            name: 'channel',
            description: 'The channel to post to (omit to reset to the default)',
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false,
        },
    ],
    run: heraldChannel,
};
