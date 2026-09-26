/* /halloween_treat - manually run the October Halloween treat draw in the
 * current channel, for testing.
 *
 * Preview command for the scheduled `halloweenTreat` passive behavior: it
 * lives beside the other previews in commands/passive/preview. adminOnly:
 * true registers it with Discord but restricts it to members with the Manage
 * Server permission (Discord enforces this — the interaction never reaches
 * the bot for anyone else); hidden: true keeps it out of the generated
 * /help. Works any time of year, and does the real random draw and
 * announcement but WITHOUT awarding points or notifying the drawn member —
 * handy for checking the flavor text and the eligibility logic.
 */

const { runHalloweenTreat } = require('../halloweenTreat');

const halloweenTreatPreview = async function (interaction) {
    await interaction.editReply('Hark! The Herald stirs his cauldron for a rehearsal...');

    try {
        await runHalloweenTreat(interaction.client, {
            guild: interaction.guild,
            targetChannel: interaction.channel,
            persist: false,
        });
    } catch (error) {
        console.error('Error running Halloween treat preview:', error);
        await interaction.followUp('Alack! The cauldron boiled over, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Rehearse the October Halloween treat draw in this channel, awarding no points',
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    run: halloweenTreatPreview,
};
