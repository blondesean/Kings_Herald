/* /pet_calls - post this morning's unhappy-pet calls now, for testing.
 *
 * Preview command for commands/passive/petCalls.js. adminOnly: true registers
 * it with Discord but restricts it to members with the Manage Server
 * permission; hidden: true keeps it out of the generated /help. Posts to this
 * channel and pings no one.
 */

const { runPetCalls } = require('../petCalls');

const petCallsPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald listens at the kennels for testing...');

    try {
        await runPetCalls(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running pet calls preview:', error);
        await interaction.followUp('Alack! The kennels are shut to mine eyes at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Post the unhappy-pet morning calls in this channel for testing, pinging no one',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: petCallsPreview,
};
