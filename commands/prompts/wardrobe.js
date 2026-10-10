/* /wardrobe - the same sheet as /flex (title, race, class, the seven
 * equipped slots and your fit score, as a monospace box), but private: only
 * you see it. Handy for checking your own fit before deciding whether to
 * /flex it to the channel.
 */

const pointsStore = require('../../src/pointsStore');
const { renderSheet } = require('../../src/character');

const wardrobe = async function (interaction) {
    try {
        const member = interaction.member;
        const [character, pose] = await Promise.all([
            pointsStore.getCharacter(interaction.guild.id, member.id),
            pointsStore.getPose(interaction.guild.id, member.id),
        ]);
        const sheet = renderSheet({ displayName: member.displayName, character: { ...character, pose } });
        await interaction.editReply(`\`\`\`\n${sheet}\n\`\`\`\n*Use /pose to strike a new pose for thy figure.*`);
    } catch (error) {
        console.error('Error showing the sheet:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: "Check your own character sheet privately (visible only to you)",
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    run: wardrobe,
};
