/* /balance - check your own point balance, privately.
 *
 * ephemeral: true keeps the reply visible only to whoever ran the command
 * (src/index.js defers accordingly before dispatch, based on this flag).
 */

const pointsStore = require('../../src/pointsStore');
const { titleFor } = require('../../src/nobilityTitle');

const balance = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let points;
    try {
        points = await pointsStore.getPoints(guild.id, member.id);
    } catch (error) {
        console.error('balance: could not read point balance:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        return;
    }

    const rank = titleFor(points);
    const rankLine = rank ? ` Thy current station: **${rank.title}**.` : '';

    await interaction.editReply(`Thy purse holds **${points}** ${points === 1 ? 'point' : 'points'}.${rankLine}`);
};

module.exports = {
    description: 'Check your own point balance (visible only to you)',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    run: balance,
};
