/* /duel_stats [member] - check a member's /duel win/loss record.
 *
 * The target arrives as a typed slash-command option (defaulting to whoever
 * ran the command), so there is no name parsing here. Reads the win/loss
 * counters written by pointsStore.recordDuelResult (commands/prompts/duel.js)
 * — a separate pair of attributes on the same points-table item, not a
 * second table.
 *
 * Net gains are summed from the duel history (pointsStore.getDuelHistory):
 * wagers won less wagers lost. The history only holds duels since it began
 * being recorded, so it can cover fewer duels than the win/loss counters.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

// How many recent duels to sum for net gains, matching /myths and achievements.
const HISTORY_LIMIT = 1000;

const pointsWord = (n) => (Math.abs(n) === 1 ? 'point' : 'points');

// Wagers won less wagers lost for one member across the given duel history.
const netGains = (history, userId) => history.reduce((net, duel) => {
    if (duel.winnerId === userId) net += duel.wager || 0;
    if (duel.loserId === userId) net -= duel.wager || 0;
    return net;
}, 0);

const duelStats = async function (interaction) {
    const guild = interaction.guild;
    const targetMember = interaction.options.getMember('member') || interaction.member;

    let stats;
    let history;
    try {
        [stats, history] = await Promise.all([
            pointsStore.getDuelStats(guild.id, targetMember.id),
            pointsStore.getDuelHistory(guild.id, HISTORY_LIMIT),
        ]);
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

    const net = netGains(history, targetMember.id);
    console.log(`duel_stats: ${targetMember.displayName} (${targetMember.id}) has ${wins} wins, ${losses} losses, net ${net} across ${history.length} recorded duels in guild ${guild.id}.`);

    let netLine;
    if (net > 0) netLine = `Hark! Their blade hath won them **${net}** ${pointsWord(net)} in all.`;
    else if (net < 0) netLine = `Alas! The dueling grounds have cost them **${-net}** ${pointsWord(net)} in all.`;
    else netLine = 'Their winnings and losses stand even, not a point gained nor lost.';

    const winRate = Math.round((wins / total) * 100);
    await interaction.editReply(
        `**${targetMember.displayName}**'s dueling record: **${wins}** win${wins === 1 ? '' : 's'}, **${losses}** loss${losses === 1 ? '' : 'es'} (${winRate}% victorious).\n${netLine}`
    );
};

module.exports = {
    description: "Check a member's dueling record and net gains (defaults to you)",
    category: 'DUELS',
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
