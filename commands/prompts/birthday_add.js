/* /birthday_add <member> <date> - admin-only: save a member's birthday, so
 * the daily 9 AM check (commands/passive/birthdays.js) celebrates it. The
 * member is picked from Discord's list, so it's saved by user ID and a
 * rename can't break it. Adding a member again replaces their date.
 *
 * adminOnly + hidden + ephemeral: only members with Manage Server can see or
 * run it, it stays out of /help, and the reply is private. Birthdates live
 * in DynamoDB, never in the public repo.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { parseDate, ageOn, easternToday } = require('../passive/birthdays');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "November 1", for the replies.
const dayName = (date) => `${MONTHS[date.month - 1]} ${date.day}`;

const birthdayAdd = async function (interaction) {
    const member = interaction.options.getMember('member');
    const typed = interaction.options.getString('date');
    const guildId = interaction.guild.id;

    try {
        if (!member) {
            await interaction.editReply('The herald cannot find that noble in this court, Milord.');
            return;
        }
        if (member.user.bot) {
            await interaction.editReply('The herald keeps no birthdays for constructs and familiars, Milord.');
            return;
        }
        const date = parseDate(typed);
        if (!date || date.year < 1900 || ageOn(date, easternToday()) < 1) {
            await interaction.editReply(`The herald cannot read **${typed}** as a birthdate, Milord. Write it as year, month and day, like 1990-11-01.`);
            return;
        }

        const birthdate = typed.trim();
        const previous = (await pointsStore.getBirthdays(guildId)).find((b) => b.userId === member.id);
        await pointsStore.setBirthday(guildId, member.id, member.displayName, birthdate);
        console.log(`Birthday add (guild ${guildId}): ${interaction.user.username} saved a birthday for ${member.displayName} (${member.id})${previous ? ', replacing the old one' : ''}.`);

        const replaced = previous && previous.birthdate !== birthdate
            ? ` The old date, ${dayName(parseDate(previous.birthdate))}, is struck from the book.`
            : '';
        await interaction.editReply(`It is written, Milord. The herald will celebrate **${member.displayName}** every ${dayName(date)}.${replaced}`);
    } catch (error) {
        console.error('Error handling /birthday_add:', error);
        await interaction.editReply('Alack! The herald\'s book is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Save a member\'s birthday for the daily celebration',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true, // birthdates stay private
    options: [
        {
            name: 'member',
            description: 'Whose birthday it is',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'date',
            description: 'Their birthdate as YYYY-MM-DD, like 1990-11-01',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: birthdayAdd,
    dayName,
};
