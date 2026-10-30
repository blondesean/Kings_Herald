/* /bank - see the gear you own that isn't equipped, by slot, the titles,
 * classes and races you own but aren't wearing, and the pets not at your
 * side. Private, so only you see it.
 */

const pointsStore = require('../../src/pointsStore');
const { bagBySlot, cosmeticField } = require('../../src/character');
const { GEAR_SLOTS, rarityFor, findEntry } = require('../passive/shopCatalog');
const { petDescription } = require('../../src/pets');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Room left for the list after the heading and footer, under Discord's limit.
const MAX_LIST_CHARS = 1800;

const COSMETIC_LABELS = [['title', 'Titles'], ['class', 'Classes'], ['race', 'Races']];

const bank = async function (interaction) {
    try {
        const character = await pointsStore.getCharacter(interaction.guild.id, interaction.member.id);
        if (!character.bag.length && !character.cosmetics.length && !character.pets.length) {
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
                const text = `[${rarityFor(entry.price)}] ${entry.name}`;
                const next = length + text.length + 2;
                if (next > MAX_LIST_CHARS) break;
                names.push(text);
                length = next;
                shown += 1;
            }
            if (names.length) lines.push(`**${label}:** ${names.join(', ')}`);
        }

        // Titles, classes and races owned but not worn, by kind.
        const cosmetics = [...new Set(character.cosmetics)].map((id) => findEntry(id)).filter(Boolean);
        const cosmeticLines = [];
        for (const [field, label] of COSMETIC_LABELS) {
            const names = cosmetics.filter((entry) => cosmeticField(entry) === field).map((entry) => entry.name);
            if (names.length) cosmeticLines.push(`**${label}:** ${names.join(', ')}`);
        }

        const hidden = character.bag.length - shown;
        const more = hidden > 0 ? `\n*…and ${hidden} more not shown.*` : '';
        const sections = [];
        if (lines.length) sections.push(`**Thy bag**\n${lines.join('\n')}${more}`);
        if (cosmeticLines.length) sections.push(`**Thy finery**\n${cosmeticLines.join('\n')}`);
        // Pets resting in the bank, each with what it holds.
        const petLines = character.pets.map((pet) => {
            const held = findEntry(pet.item);
            return `**${pet.name}**, ${petDescription(pet)}${held ? `, holding ${held.name}` : ''}`;
        });
        if (petLines.length) sections.push(`**Thy pets**\n${petLines.join('\n')}`);
        await interaction.editReply(`${sections.join('\n\n')}\n\nEquip one with \`/equip <name>\`.`);
    } catch (error) {
        console.error('Error showing the bag:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'See the gear, titles, classes, races and pets you own but are not using (visible only to you)',
    category: 'CHARACTER',
    ephemeral: true,
    run: bank,
};
