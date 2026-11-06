/* /petname <pet> <name> - give one of your pets a new name. Works on the pet
 * at your side or one in your bank. The new name follows the same rules as at
 * adoption, and can't be one another of your pets already has. Its title and
 * the gear it holds stay with it.
 *
 * Public, so the court hears the proclamation. The write only lands if your
 * pets are still the ones read, so a pet traded or swapped meanwhile isn't
 * touched.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { cleanPetName, matchPet, PET_NAME_MAX } = require('../../src/pets');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const petname = async function (interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;
    const typedPet = interaction.options.getString('pet');
    const typedName = interaction.options.getString('name');

    try {
        const character = await pointsStore.getCharacter(guildId, member.id);
        const owned = [character.pet, ...character.pets].filter(Boolean);
        const chosen = matchPet(owned, typedPet);
        if (!chosen) {
            await interaction.editReply(pick(flavor.petNotOwnedLines(typedPet)));
            return;
        }

        const name = cleanPetName(typedName);
        if (!name) {
            await interaction.editReply(pick(flavor.petBadNameLines(PET_NAME_MAX)));
            return;
        }
        // Only the owner's other pets count, so a pet can change the case of its own name.
        if (matchPet(owned.filter((p) => p.id !== chosen.id), name)) {
            await interaction.editReply(pick(flavor.petNameTakenLines(name)));
            return;
        }
        if (name === chosen.name) {
            await interaction.editReply(pick(flavor.petSameNameLines(name)));
            return;
        }

        // The renamed pet replaces itself wherever it is, at the side or in the bank.
        const renamed = { ...chosen, name };
        const atSide = character.pet && character.pet.id === chosen.id;
        const before = atSide ? { pet: character.pet } : { pets: character.pets };
        const after = atSide ? { pet: renamed } : { pets: character.pets.map((p) => (p.id === chosen.id ? renamed : p)) };
        if (!await pointsStore.setPets(guildId, member.id, before, after)) {
            await interaction.editReply(pick(flavor.bagChangedLines()));
            return;
        }

        console.log(`Pet (guild ${guildId}): ${member.displayName} (${member.id}) renamed ${chosen.name} to ${name}.`);
        await interaction.editReply({
            content: pick(flavor.petRenamedLines(`<@${member.id}>`, chosen.name, name)),
            allowedMentions: { parse: [] },
        });
    } catch (error) {
        console.error('Error handling /petname:', error);
        await interaction.editReply('Alack! The kennels are shut to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Give one of your pets a new name',
    category: 'CHARACTER',
    options: [
        {
            name: 'pet',
            description: 'The current name of your pet, at your side or in your bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'name',
            description: `Its new name (up to ${PET_NAME_MAX} letters, spaces, apostrophes and hyphens)`,
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: PET_NAME_MAX,
        },
    ],
    run: petname,
};
