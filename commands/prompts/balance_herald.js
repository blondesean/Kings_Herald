/* /balance_herald - admin-only: see how many points the herald has been
 * tipped with /tip, and by whom. The herald never says this in public.
 * adminOnly + hidden + ephemeral, like /point_adjust: only members with
 * Manage Server can see or run it, it stays out of /help, and only the
 * admin who ran it sees the reply.
 */

const pointsStore = require('../../src/pointsStore');

// Givers listed by name, biggest first; the rest are summed into one line.
const MAX_LISTED = 15;

const pointsText = (n) => `${n} point${n === 1 ? '' : 's'}`;

const balanceHerald = async function (interaction) {
    let tips;
    try {
        tips = await pointsStore.getHeraldTips(interaction.guild.id);
    } catch (error) {
        console.error('balance_herald: could not read tips:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        return;
    }

    if (!tips.count) {
        await interaction.editReply('No one has tipped the herald yet, Milord. His purse is empty.');
        return;
    }

    const lines = [`The herald's purse holds **${pointsText(tips.total)}**, from ${tips.count} tip${tips.count === 1 ? '' : 's'}.`, ''];
    tips.tippers.slice(0, MAX_LISTED).forEach((t, i) => lines.push(`${i + 1}. ${t.displayName}: ${pointsText(t.given)}`));
    const rest = tips.tippers.slice(MAX_LISTED);
    if (rest.length) lines.push(`...and ${rest.length} more, ${pointsText(rest.reduce((sum, t) => sum + t.given, 0))} between them.`);

    await interaction.editReply(lines.join('\n'));
};

module.exports = {
    description: 'See how many points the herald has been tipped, and by whom',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    run: balanceHerald,
};
