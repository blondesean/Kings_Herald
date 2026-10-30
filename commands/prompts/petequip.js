/* /petequip <item> - give the pet at your side a piece of gear from your bag
 * to hold. A pet holds one piece; the one it held goes back to your bag. The
 * piece is for show and adds no fit. It stays with the pet in your bank, and
 * goes with it if the pet is traded.
 *
 * Private, so only you see the reply. The pet is shown by /flex.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { matchEntry } = require('../../src/character');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const petequip = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const member = interaction.member;

    try {
        const character = await pointsStore.getCharacter(guildId, member.id);
        const companion = character.pet;
        if (!companion) {
            await interaction.editReply(pick(flavor.petNoPetLines()));
            return;
        }

        const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
        const entry = matchEntry(inBag, typed);
        if (!entry) {
            await interaction.editReply(pick(flavor.petNoItemLines(typed)));
            return;
        }

        const bag = [...character.bag];
        bag.splice(bag.indexOf(entry.id), 1);
        const displaced = catalog.findEntry(companion.item);
        if (companion.item) bag.push(companion.item);
        const holding = { ...companion, item: entry.id };
        if (!await pointsStore.setPets(guildId, member.id, { pet: companion, bag: character.bag }, { pet: holding, bag })) {
            await interaction.editReply(pick(flavor.bagChangedLines()));
            return;
        }
        console.log(`Pet (guild ${guildId}): ${member.displayName} (${member.id}) gave ${companion.name} ${entry.name}${displaced ? `, returned ${displaced.name}` : ''}.`);
        await interaction.editReply(pick(flavor.petEquippedLines(companion.name, entry.name, displaced ? displaced.name : null)));
    } catch (error) {
        console.error('Error handling /petequip:', error);
        await interaction.editReply('Alack! The kennels are shut to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Give the pet at your side a piece of gear from your bag to hold, for show (visible only to you)',
    category: 'CHARACTER',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'The exact name of the gear in your bag, as shown in /bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: petequip,
};
