/* /equip <item> - put a piece of gear from your bag into its slot.
 *
 * Whatever was in that slot goes back to your bag, so nothing is lost. The
 * write is conditional on the bag being the one we read, so two quick
 * commands can't duplicate or lose an item.
 *
 * Private, so only you see the reply. Your sheet is shown by /flex.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { equipPlan, matchEntry } = require('../../src/character');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const equip = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const userId = interaction.member.id;

    try {
        const character = await pointsStore.getCharacter(guildId, userId);
        const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
        const entry = matchEntry(inBag, typed);
        if (!entry) {
            // Tell apart "not in the bag" from "not gear at all" for a clearer reply.
            const known = matchEntry(catalog.ALL, typed);
            const reply = known && !known.slot ? flavor.notGearLines(known.name) : flavor.notInBagLines(typed);
            await interaction.editReply(pick(reply));
            return;
        }

        const plan = equipPlan(character, entry.id);
        const displaced = character.gear[entry.slot] || null;
        const displacedName = displaced ? catalog.findEntry(displaced).name : null;

        const saved = await pointsStore.setEquipment(guildId, userId, character.bag, plan.gear, plan.bag);
        if (!saved) {
            await interaction.editReply(pick(flavor.bagChangedLines()));
            return;
        }

        console.log(`Equip (guild ${guildId}): ${interaction.member.displayName} (${userId}) equipped ${entry.name}${displacedName ? `, returned ${displacedName}` : ''}.`);
        await interaction.editReply(pick(flavor.equippedLines(entry.name, displacedName)));
    } catch (error) {
        console.error('Error handling /equip:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Equip a piece of gear from your bag (visible only to you)',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'The exact name of the gear in your bag, as shown in /bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: equip,
};
