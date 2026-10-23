/* /birthday_remove <member> - admin-only: take a member's birthday out of
 * the herald's book (see /birthday_add). adminOnly + hidden + ephemeral.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

const birthdayRemove = async function (interaction) {
    const user = interaction.options.getUser('member');
    const guildId = interaction.guild.id;

    try {
        const removed = await pointsStore.removeBirthday(guildId, user.id);
        if (!removed) {
            await interaction.editReply(`The herald has no birthday written for **${user.username}**, Milord.`);
            return;
        }
        console.log(`Birthday remove (guild ${guildId}): ${interaction.user.username} removed the birthday for ${user.username} (${user.id}).`);
        await interaction.editReply(`It is struck from the book, Milord. The herald will no longer celebrate **${user.username}**.`);
    } catch (error) {
        console.error('Error handling /birthday_remove:', error);
        await interaction.editReply('Alack! The herald\'s book is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Remove a member\'s saved birthday',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    options: [
        {
            name: 'member',
            description: 'Whose birthday to remove',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: birthdayRemove,
};
