/* /puppet <message> - admin-only: the herald says whatever is typed, in this
 * channel, as his own words. adminOnly + hidden + ephemeral, like
 * /balance_herald: only members with Manage Server can see or run it, it
 * stays out of /help, and the only public trace is the herald's message;
 * the admin's confirmation is visible to them alone.
 *
 * Member pings work, but @everyone, @here and role pings never do. Every use
 * is still on record: the history log keeps each command with its options,
 * and the line below goes to CloudWatch.
 */

const { ApplicationCommandOptionType } = require('discord.js');

const puppet = async function (interaction) {
    const message = interaction.options.getString('message');
    try {
        await interaction.channel.send({ content: message, allowedMentions: { parse: ['users'] } });
    } catch (error) {
        console.error('puppet: could not speak in this channel:', error.message);
        await interaction.editReply('Alack, Milord, the herald cannot speak in this channel.');
        return;
    }
    console.log(`puppet: ${interaction.user.username} (${interaction.user.id}) made the herald say: ${message}`);
    await interaction.editReply('The herald has spoken thy words, Milord.');
};

module.exports = {
    description: 'Make the herald say something in this channel',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true, // only the herald's message is public
    options: [
        {
            name: 'message',
            description: 'What the herald shall say',
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 2000, // Discord's message limit
        },
    ],
    run: puppet,
};
