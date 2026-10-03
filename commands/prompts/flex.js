/* /flex - show off your character sheet to the channel: title, race, class,
 * the seven equipped slots and your fit score, as a monospace box.
 */

const pointsStore = require('../../src/pointsStore');
const { renderSheet } = require('../../src/character');

const flex = async function (interaction) {
    try {
        const member = interaction.member;
        const character = await pointsStore.getCharacter(interaction.guild.id, member.id);
        const sheet = renderSheet({ displayName: member.displayName, character });
        await interaction.editReply(`\`\`\`\n${sheet}\n\`\`\``);
    } catch (error) {
        console.error('Error showing the sheet:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: "Show off your character's gear, title, class and race",
    category: 'ROYAL CHRONICLES',
    run: flex,
};
