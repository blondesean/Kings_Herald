/* /inspect <member> - the same sheet as /wardrobe, but for another member of
 * the server. Private: only you see it, so looking someone up doesn't
 * announce it to the channel.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { renderSheet } = require('../../src/character');

const inspect = async function (interaction) {
    try {
        const target = interaction.options.getMember('member');
        if (!target) {
            await interaction.editReply('That noble could not be found in this court, Milord.');
            return;
        }
        if (target.user.bot) {
            await interaction.editReply('The Herald and its kin keep no wardrobe, Milord.');
            return;
        }

        const [character, pose] = await Promise.all([
            pointsStore.getCharacter(interaction.guild.id, target.id),
            pointsStore.getPose(interaction.guild.id, target.id),
        ]);
        const sheet = renderSheet({ displayName: target.displayName, character: { ...character, pose } });
        await interaction.editReply(`\`\`\`\n${sheet}\n\`\`\``);
    } catch (error) {
        console.error('Error inspecting a sheet:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: "Check another member's character sheet privately (visible only to you)",
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    options: [
        {
            name: 'member',
            description: 'The court member whose sheet to inspect',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: inspect,
};
