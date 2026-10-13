/* /encounter_test [minutes] [party] [min] [difficulty] - run a boss
 * encounter in this channel, for testing. `difficulty` picks the tier, any of
 * the five, Extreme and Max included (default: rolled like the real one).
 *
 * Preview command for the daily encounter (commands/passive/encounter.js).
 * adminOnly + hidden like the other previews. Runs the full flow — join,
 * secret choices, battle, loot rolls — but as a rehearsal: no injuries are
 * recorded, injuries don't block joining, and loot isn't granted. `minutes`
 * shortens both the join window and the need/greed/pass window (default 2)
 * so a test doesn't take two hours, and the roster checks come every quarter
 * of it; `party` changes the size cap (default
 * MAX_PARTY), and a full, ready party marches early; `min` is the fewest who
 * can fight (default 1, so one tester can run it alone; the real encounter
 * needs MIN_PARTY).
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { runEncounter, MAX_PARTY, MIN_PARTY } = require('../encounter');
const { DIFFICULTIES } = require('../encounterBosses');

const encounterTest = async function (interaction) {
    const minutes = interaction.options.getInteger('minutes') ?? 2;
    const maxParty = interaction.options.getInteger('party') ?? MAX_PARTY;
    const minParty = Math.min(interaction.options.getInteger('min') ?? 1, maxParty);
    const tier = interaction.options.getInteger('difficulty');

    await interaction.editReply(`Hark! A rehearsal encounter: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to form a party of ${minParty} to ${maxParty}, and as long again for the loot.`);

    try {
        await runEncounter(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
            tier,
            maxParty,
            minParty,
            joinWindowMs: minutes * 60 * 1000,
            // Four roster checks an hour in the real one; a quarter of the window here.
            checkIntervalMs: minutes * 15 * 1000,
            lootWindowMs: minutes * 60 * 1000,
        });
    } catch (error) {
        console.error('Error running encounter test:', error);
        await interaction.followUp('Alack! The encounter could not be staged at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Run a rehearsal boss encounter in this channel (no injuries or loot)',
    category: 'UTILITY',
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
            description: `Most members who can join; a full, ready party marches early (default ${MAX_PARTY})`,
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: MAX_PARTY,
        },
        {
            name: 'min',
            description: `Fewest who can fight (default 1; the real encounter needs ${MIN_PARTY})`,
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: MAX_PARTY,
        },
        {
            name: 'difficulty',
            description: 'The threat level (default: rolled like the daily one)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: DIFFICULTIES.map((name, value) => ({ name, value })),
        },
    ],
    run: encounterTest,
};
