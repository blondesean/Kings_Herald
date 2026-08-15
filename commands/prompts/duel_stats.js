/* /duel_stats [member] - check a member's /duel win/loss record.
 *
 * The target arrives as a typed slash-command option (defaulting to whoever
 * ran the command), so there is no name parsing here. Reads the win/loss
 * counters written by pointsStore.recordDuelResult (commands/prompts/duel.js)
 * — a separate pair of attributes on the same points-table item, not a
 * second table.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

const duelStats = async function (interaction) {
    const guild = interaction.guild;
    const targetMember = interaction.options.getMember('member') || interaction.member;

    let stats;
    try {
        stats = await pointsStore.getDuelStats(guild.id, targetMember.id);
    } catch (error) {
        console.error('duel_stats: could not read duel record:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        return;
    }

    const { wins, losses } = stats;
    const total = wins + losses;

    if (total === 0) {
        await interaction.editReply(`${targetMember.displayName} has yet to cross blades in the dueling grounds.`);
        return;
    }

    const winRate = Math.round((wins / total) * 100);
    await interaction.editReply(
        `**${targetMember.displayName}**'s dueling record: **${wins}** win${wins === 1 ? '' : 's'}, **${losses}** loss${losses === 1 ? '' : 'es'} (${winRate}% victorious).`
    );
};

module.exports = {
    description: "Check a member's dueling record (defaults to you)",
    category: 'COURTLY GAMES',
    options: [
        {
            name: 'member',
            description: 'The court member whose record to check',
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ],
    run: duelStats,
};
