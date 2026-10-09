/* /herald_channel_list - show every /herald_channel override currently set
 * for this server, and which scopes are still using their default channel.
 *
 * adminOnly + hidden, like /herald_channel; ephemeral since it's admin
 * bookkeeping, not something the whole server needs to see.
 */

const pointsStore = require('../../src/pointsStore');
const { SCOPES } = require('../../src/resolveChannel');

const heraldChannelList = async function (interaction) {
    try {
        const overrides = await pointsStore.getChannelOverrides(interaction.guild.id);

        const lines = Object.entries(SCOPES).map(([scope, label]) => {
            const channelId = overrides[scope];
            return `**${label}:** ${channelId ? `<#${channelId}>` : '_default_'}`;
        });

        await interaction.editReply(`**Channel overrides**\n${lines.join('\n')}\n\nSet one with \`/herald_channel\`.`);
    } catch (error) {
        console.error('Error listing channel overrides:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Show which channel each scheduled behavior posts to',
    category: 'ROYAL CHRONICLES',
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    ephemeral: true,
    run: heraldChannelList,
};
