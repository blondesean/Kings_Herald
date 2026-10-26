/* /herald_test [minutes] [min] [seconds] - stage a rehearsal of the Herald's
 * battle (src/heraldBattle.js) in this channel, for testing. Anyone may
 * answer, relic or not: a member without one dreams of a random relic's
 * Guardian. Nothing is written: no age named, no achievement, no loot
 * granted. It does post the win speech, the age's name included, so stage it
 * somewhere the court won't read it. `minutes` is the join window (default 2), `min` the fewest who can fight (default 1), and
 * `seconds` the pause between lines (default 5). adminOnly + hidden like the
 * other previews.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { runHeraldBattle } = require('../../../src/heraldBattle');

const heraldTest = async function (interaction) {
    const minutes = interaction.options.getInteger('minutes') ?? 2;
    const minParty = interaction.options.getInteger('min') ?? 1;
    const seconds = interaction.options.getInteger('seconds') ?? 5;
    await interaction.editReply(`A rehearsal of the Herald's challenge: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to answer, at least ${minParty}, ${seconds} seconds between lines. It posts the win speech in full, so mind who is watching.`);
    const started = await runHeraldBattle(interaction.guild, interaction.channel, {
        persist: false,
        joinWindowMs: minutes * 60 * 1000,
        minParty,
        stepMs: seconds * 1000,
    });
    if (!started) await interaction.followUp({ content: 'A battle is already under way here, Milord.', ephemeral: true }).catch(() => {});
};

module.exports = {
    description: 'Stage a rehearsal of the herald\'s challenge in this channel (nothing is kept)',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    options: [
        {
            name: 'minutes',
            description: 'Length of the join window in minutes (default 2)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 60,
        },
        {
            name: 'min',
            description: 'Fewest who can fight (default 1; the real one needs 3)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 30,
        },
        {
            name: 'seconds',
            description: 'Pause between lines (default 5)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 0,
            maxValue: 30,
        },
    ],
    run: heraldTest,
};
