/* /bank - see the gear you own that isn't equipped, by slot. Private, so only
 * you see your bag.
 */

const pointsStore = require('../../src/pointsStore');
const { bagBySlot } = require('../../src/character');
const { GEAR_SLOTS } = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const bank = async function (interaction) {
    try {
        const character = await pointsStore.getCharacter(interaction.guild.id, interaction.member.id);
        if (!character.bag.length) {
            await interaction.editReply(pick(flavor.bankEmptyLines()));
            return;
        }

        const bySlot = bagBySlot(character.bag);
        const lines = GEAR_SLOTS
            .filter((slot) => bySlot[slot].length)
            .map((slot) => {
                const label = slot.charAt(0).toUpperCase() + slot.slice(1);
                return `**${label}:** ${bySlot[slot].map((entry) => entry.name).join(', ')}`;
            });

        await interaction.editReply(`**Thy bag**\n${lines.join('\n')}\n\nEquip one with \`/equip <name>\`.`);
    } catch (error) {
        console.error('Error showing the bag:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'See the gear in your bag that is not equipped (visible only to you)',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    run: bank,
};
