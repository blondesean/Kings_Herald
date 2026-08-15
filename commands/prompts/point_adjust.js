/* /point_adjust <member> <amount> - admin-only: manually grant or deduct a
 * member's ledger points (e.g. to correct a mistake, or reward something
 * off the books). adminOnly + hidden mirror the preview commands' pattern
 * (see commands/passive/preview): Discord only shows/allows this to members
 * with the Manage Server permission (enforced by Discord itself via
 * defaultMemberPermissions — the interaction never reaches the bot for
 * anyone else), and it's kept out of the generated /help.
 *
 * Every adjustment is logged to CloudWatch — who adjusted whom, by how
 * much, and the resulting balance — so it can be audited later.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');

const pointAdjust = async function (interaction) {
    const guild = interaction.guild;
    const admin = interaction.member;
    const target = interaction.options.getMember('member');
    const amount = interaction.options.getInteger('amount');

    if (amount === 0) {
        await interaction.editReply('An adjustment of zero changes nothing, Milord.');
        return;
    }
    if (target.user.bot) {
        await interaction.editReply('The Herald and its kin hold no points to adjust, Milord.');
        return;
    }

    let currentPoints;
    try {
        currentPoints = await pointsStore.getPoints(guild.id, target.id);
    } catch (error) {
        console.error('point_adjust: could not read current balance:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        return;
    }

    const newTotal = currentPoints + amount;
    if (newTotal < 0) {
        await interaction.editReply(`That would drop ${target.displayName} to ${newTotal} points, Milord — the ledger cannot go below zero. Their current balance is ${currentPoints}.`);
        return;
    }

    try {
        await pointsStore.addPoints(guild.id, [{ userId: target.id, displayName: target.displayName, points: amount }]);
    } catch (error) {
        console.error('point_adjust: failed to write adjustment:', error);
        await interaction.editReply('Alack! I could not inscribe that adjustment in the ledger, Milord. Pray try again anon!');
        return;
    }

    console.log(`Point adjustment (guild ${guild.id}): ${admin.displayName} (${admin.id}) adjusted ${target.displayName} (${target.id}) by ${amount > 0 ? '+' : ''}${amount}. New balance: ${newTotal}.`);

    const verb = amount > 0 ? 'granted to' : 'stripped from';
    const amountWord = Math.abs(amount) === 1 ? 'point' : 'points';
    await interaction.editReply(`By royal decree, ${Math.abs(amount)} ${amountWord} ${verb} ${target.displayName}. New balance: ${newTotal}.`);
};

module.exports = {
    description: "Grant or deduct a member's ledger points by a set amount",
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    options: [
        {
            name: 'member',
            description: 'The court member whose points shall be adjusted',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'amount',
            description: 'Points to add (positive) or remove (negative)',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: pointAdjust,
};
