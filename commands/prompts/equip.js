/* /equip <item> - put a piece of gear from your bag into its slot, or wear a
 * title, class or race you own, or bring a pet from your bank to your side
 * by its name.
 *
 * Whatever was in that slot goes back to your bag, and a replaced title,
 * class or race back to your cosmetics, so nothing is lost. The write is
 * conditional on the bag (or cosmetics) being the one we read, so two quick
 * commands can't duplicate or lose an item.
 *
 * Private, so only you see the reply. Your sheet is shown by /flex.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { equipPlan, wearPlan, stashFor, cosmeticField, matchEntry } = require('../../src/character');
const { matchPet } = require('../../src/pets');
const achievements = require('../../src/achievements');
const { rarityFor } = require('../passive/shopCatalog');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Puts on a title, class or race from the member's cosmetics; the one it
// replaces goes into the cosmetics in its place.
const wearCosmetic = async (interaction, character, entry) => {
    const guildId = interaction.guild.id;
    const userId = interaction.member.id;
    const plan = wearPlan(character, entry.id);
    const saved = await pointsStore.wearCosmetic(guildId, userId, plan.field, plan.old, plan.value, character.cosmetics, plan.cosmetics);
    if (!saved) {
        await interaction.editReply(pick(flavor.bagChangedLines()));
        return;
    }
    const stored = stashFor(character, plan.field);
    const storedName = stored ? catalog.findEntry(stored).name : null;
    console.log(`Equip (guild ${guildId}): ${interaction.member.displayName} (${userId}) wore ${entry.name}${storedName ? `, stored ${storedName}` : ''}.`);
    await interaction.editReply(pick(flavor.cosmeticWornLines(entry.name, storedName)));
    await achievements.checkStats(guildId, [{ userId, displayName: interaction.member.displayName }], interaction.channel);
};

// Brings a pet from the bank to the member's side; the one there goes to the bank.
const swapPet = async (interaction, character, chosen) => {
    const guildId = interaction.guild.id;
    const userId = interaction.member.id;
    const pets = character.pets.filter((p) => p !== chosen);
    if (character.pet) pets.push(character.pet);
    const saved = await pointsStore.setPets(guildId, userId, { pet: character.pet, pets: character.pets }, { pet: chosen, pets });
    if (!saved) {
        await interaction.editReply(pick(flavor.bagChangedLines()));
        return;
    }
    const old = character.pet ? character.pet.name : null;
    console.log(`Equip (guild ${guildId}): ${interaction.member.displayName} (${userId}) brought ${chosen.name} to their side${old ? `, banked ${old}` : ''}.`);
    await interaction.editReply(pick(flavor.petSwappedLines(chosen.name, old)));
};

const equip = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const userId = interaction.member.id;

    try {
        const character = await pointsStore.getCharacter(guildId, userId);
        const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
        const entry = matchEntry(inBag, typed);
        if (!entry) {
            const owned = [...new Set(character.cosmetics)].map((id) => catalog.findEntry(id)).filter(Boolean);
            const cosmetic = matchEntry(owned, typed);
            if (cosmetic) {
                await wearCosmetic(interaction, character, cosmetic);
                return;
            }
            if (matchPet(character.pets, typed)) {
                await swapPet(interaction, character, matchPet(character.pets, typed));
                return;
            }
            if (character.pet && matchPet([character.pet], typed)) {
                await interaction.editReply(pick(flavor.petAlreadyAtSideLines(character.pet.name)));
                return;
            }
            // Tell apart "not in the bag" from "a title, class or race not owned" for a clearer reply.
            const known = matchEntry(catalog.ALL, typed);
            let reply = flavor.notInBagLines(typed);
            if (known && cosmeticField(known)) {
                reply = character[cosmeticField(known)] === known.id ? flavor.alreadyWornLines(known.name) : flavor.notInCosmeticsLines(known.name);
            } else if (known && !known.slot) {
                reply = flavor.notGearLines(known.name);
            }
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
        await interaction.editReply(pick(flavor.equippedLines(`[${rarityFor(entry.price)}] ${entry.name}`, displacedName)));
        await achievements.checkStats(guildId, [{ userId, displayName: interaction.member.displayName }], interaction.channel);
    } catch (error) {
        console.error('Error handling /equip:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Equip gear from your bag, a title, class or race you own, or a pet from your bank (visible only to you)',
    category: 'CHARACTER',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'The exact name of the gear, title, class, race or pet, as shown in /bank',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: equip,
};
