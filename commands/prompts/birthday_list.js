/* /birthday_list - admin-only: every birthday saved for this server (see
 * /birthday_add), soonest first. adminOnly + hidden + ephemeral, so the
 * dates are seen by the admin alone.
 */

const pointsStore = require('../../src/pointsStore');
const { parseDate, easternToday } = require('../passive/birthdays');
const { dayName } = require('./birthday_add');

// Days from today (Eastern, the check's clock) until the birthday, wrapping at the year's end.
const daysUntil = (date, now) => {
    const thisYear = Date.UTC(now.year, date.month - 1, date.day);
    const today = Date.UTC(now.year, now.month - 1, now.day);
    const next = thisYear >= today ? thisYear : Date.UTC(now.year + 1, date.month - 1, date.day);
    return Math.round((next - today) / 86400000);
};

const birthdayList = async function (interaction) {
    const guildId = interaction.guild.id;

    try {
        const saved = await pointsStore.getBirthdays(guildId);
        if (!saved.length) {
            await interaction.editReply('The herald\'s book of birthdays is empty, Milord. Add one with `/birthday_add`.');
            return;
        }

        const now = easternToday();
        const members = await interaction.guild.members.fetch({ user: saved.map((b) => b.userId) }).catch(() => new Map());
        const lines = saved
            .map((b) => ({ ...b, date: parseDate(b.birthdate) }))
            .filter((b) => b.date)
            .sort((a, b) => daysUntil(a.date, now) - daysUntil(b.date, now))
            .map((b) => {
                const name = (members.get(b.userId) || {}).displayName || b.displayName || b.userId;
                const days = daysUntil(b.date, now);
                const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
                return `${dayName(b.date)}, ${b.date.year} - **${name}**, ${when}`;
            });
        await interaction.editReply(`**The herald's book of birthdays**\n${lines.join('\n')}`);
    } catch (error) {
        console.error('Error handling /birthday_list:', error);
        await interaction.editReply('Alack! The herald\'s book is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'List the saved birthdays, soonest first',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    run: birthdayList,
};
