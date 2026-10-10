/* /encounter_test [minutes] [party] - run a boss encounter in this channel,
 * for testing.
 *
 * Preview command for the daily encounter (commands/passive/encounter.js).
 * adminOnly + hidden like the other previews. Runs the full flow — join,
 * secret choices, battle, loot rolls — but as a rehearsal: no injuries are
 * recorded, injuries don't block joining, and loot isn't granted. `minutes`
 * shortens both the join window and the need/greed/pass window (default 2)
 * so a test doesn't take two hours; `party` changes the size cap (default 5).
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { runEncounter, DEFAULT_MAX_PARTY } = require('../encounter');

const encounterTest = async function (interaction) {
    const minutes = interaction.options.getInteger('minutes') ?? 2;
    const maxParty = interaction.options.getInteger('party') ?? DEFAULT_MAX_PARTY;

    await interaction.editReply(`Hark! A rehearsal encounter: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to form a party of up to ${maxParty}, and as long again for the loot.`);

    try {
        await runEncounter(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
            maxParty,
            joinWindowMs: minutes * 60 * 1000,
            lootWindowMs: minutes * 60 * 1000,
        });
    } catch (error) {
        console.error('Error running encounter test:', error);
        await interaction.followUp('Alack! The encounter could not be staged at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Run a rehearsal boss encounter in this channel (no injuries or loot)',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'minutes',
            description: 'Length of the join window and of the loot window (default 2)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 60,
        },
        {
            name: 'party',
            description: 'Most members who can join (default 5)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 20,
        },
    ],
    run: encounterTest,
};
