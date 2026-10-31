/* /pettitle <pet> [title] - give one of your pets a title of your own
 * choosing, shown after its name on /flex and in /bank, as in "Biscuit, the
 * Destroyer". Leaving out the title removes it. Works on the pet at your side
 * or one in your bank. The title is cosmetic, and stays with the pet if it is
 * traded.
 *
 * Public, so the court hears the proclamation. The write only lands if your
 * pets are still the ones read, so a pet traded or swapped meanwhile isn't
 * touched.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { cleanPetTitle, matchPet, PET_TITLE_MAX } = require('../../src/pets');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const pettitle = async function (interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;
    const typedPet = interaction.options.getString('pet');
    const typedTitle = interaction.options.getString('title');

    try {
        const character = await pointsStore.getCharacter(guildId, member.id);
        const chosen = matchPet([character.pet, ...character.pets].filter(Boolean), typedPet);
        if (!chosen) {
            await interaction.editReply(pick(flavor.petNotOwnedLines(typedPet)));
            return;
        }

        let title = null;
        if (typedTitle) {
            title = cleanPetTitle(typedTitle);
            if (!title) {
                await interaction.editReply(pick(flavor.petBadTitleLines(PET_TITLE_MAX)));
                return;
            }
        }

        // The titled pet replaces itself wherever it is, at the side or in the bank.
        const retitled = { ...chosen };
        if (title) retitled.title = title;
        else delete retitled.title;
        const atSide = character.pet && character.pet.id === chosen.id;
        const before = atSide ? { pet: character.pet } : { pets: character.pets };
        const after = atSide ? { pet: retitled } : { pets: character.pets.map((p) => (p.id === chosen.id ? retitled : p)) };
        if (!await pointsStore.setPets(guildId, member.id, before, after)) {
            await interaction.editReply(pick(flavor.bagChangedLines()));
            return;
        }

        console.log(`Pet (guild ${guildId}): ${member.displayName} (${member.id}) ${title ? `titled ${chosen.name} "${title}"` : `cleared ${chosen.name}'s title`}.`);
        await interaction.editReply({
            content: pick(title ? flavor.petTitledLines(`<@${member.id}>`, chosen.name, title) : flavor.petTitleClearedLines(chosen.name)),
            allowedMentions: { parse: [] },
        });
    } catch (error) {
        console.error('Error handling /pettitle:', error);
        await interaction.editReply('Alack! The kennels are shut to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Give one of your pets a title of your own, or leave the title out to remove it',
    category: 'CHARACTER',
    options: [
        {
            name: 'pet',
            description: 'The name of your pet, at your side or in your bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'title',
            description: `Its new title, such as "the Destroyer" (up to ${PET_TITLE_MAX} characters); leave out to remove`,
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: PET_TITLE_MAX,
        },
    ],
    run: pettitle,
};
