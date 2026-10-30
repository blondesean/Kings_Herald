/* /pet - pet the pet at your side. A pet stays happy for a week after it is
 * petted, lending its owner fit; left longer, it grows unhappy, costs fit,
 * and complains every morning until petted (see src/pets.js and
 * commands/passive/petCalls.js).
 *
 * Public, so the court sees the affection. The write only lands if the pet
 * is still the one read, so a pet traded or swapped meanwhile isn't touched.
 */

const pointsStore = require('../../src/pointsStore');
const { isHappy, petKind } = require('../../src/pets');
const achievements = require('../../src/achievements');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const pet = async function (interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;

    try {
        const character = await pointsStore.getCharacter(guildId, member.id);
        const companion = character.pet;
        if (!companion) {
            await interaction.editReply(pick(flavor.petNoPetLines()));
            return;
        }

        const wasUnhappy = !isHappy(companion);
        const petted = { ...companion, lastPetted: Date.now() };
        if (!await pointsStore.setPets(guildId, member.id, { pet: companion }, { pet: petted })) {
            await interaction.editReply(pick(flavor.bagChangedLines()));
            return;
        }
        console.log(`Pet (guild ${guildId}): ${member.displayName} (${member.id}) petted ${companion.name}${wasUnhappy ? ', no longer unhappy' : ''}.`);
        await interaction.editReply(pick(flavor.petPettedLines(companion.name, petKind(companion), wasUnhappy)));
        await achievements.record(guildId, [{ userId: member.id, displayName: member.displayName, counts: { pets_petted: 1 } }], interaction.channel);
    } catch (error) {
        console.error('Error handling /pet:', error);
        await interaction.editReply('Alack! The kennels are shut to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Pet the pet at your side, keeping it happy for a week',
    category: 'CHARACTER',
    run: pet,
};
