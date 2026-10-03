/* /bank - see the gear you own that isn't equipped, by slot. Private, so only
 * you see your bag.
 */

const pointsStore = require('../../src/pointsStore');
const { bagBySlot } = require('../../src/character');
const { GEAR_SLOTS } = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Room left for the list after the heading and footer, under Discord's limit.
const MAX_LIST_CHARS = 1800;

const bank = async function (interaction) {
    try {
        const character = await pointsStore.getCharacter(interaction.guild.id, interaction.member.id);
        if (!character.bag.length) {
            await interaction.editReply(pick(flavor.bankEmptyLines()));
            return;
        }

        // Discord caps a message at 2000 characters, so the list stops once it
        // reaches MAX_LIST_CHARS and says how many items didn't fit.
        const bySlot = bagBySlot(character.bag);
        const lines = [];
        let shown = 0;
        let length = 0;
        for (const slot of GEAR_SLOTS) {
            if (!bySlot[slot].length) continue;
            const label = slot.charAt(0).toUpperCase() + slot.slice(1);
            const names = [];
            for (const entry of bySlot[slot]) {
                const next = length + entry.name.length + 2;
                if (next > MAX_LIST_CHARS) break;
                names.push(entry.name);
                length = next;
                shown += 1;
            }
            if (names.length) lines.push(`**${label}:** ${names.join(', ')}`);
        }

        const hidden = character.bag.length - shown;
        const more = hidden > 0 ? `\n*…and ${hidden} more not shown.*` : '';
        await interaction.editReply(`**Thy bag**\n${lines.join('\n')}${more}\n\nEquip one with \`/equip <name>\`.`);
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
