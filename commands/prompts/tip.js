/* /tip <amount> - give some of your points to the herald, to show your
 * appreciation. The points leave your purse for good. The herald thanks the
 * tipper, then tells his running total and what that member has given in
 * all; admins can see every giver with /balance_herald. Tipping counts toward
 * two achievements, a first tip and 25 points given in all.
 *
 * Public, so the herald's thanks is heard in the channel.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const achievements = require('../../src/achievements');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const tip = async function (interaction) {
    const guildId = interaction.guild.id;
    const tipper = interaction.member;
    const amount = interaction.options.getInteger('amount');

    try {
        const result = await pointsStore.tipHerald(guildId, tipper, amount);
        if (!result) {
            await interaction.editReply(pick(flavor.tipCannotAffordLines(amount)));
            return;
        }

        console.log(`Tip (guild ${guildId}): ${tipper.displayName} (${tipper.id}) tipped the herald ${amount}. Herald total: ${result.total}.`);
        await interaction.editReply(`${pick(flavor.tipThanksLines(`<@${tipper.id}>`, amount))}\n${flavor.tipTallyLine(result.total, result.given)}`);
        await achievements.record(guildId, [{ userId: tipper.id, displayName: tipper.displayName, counts: { tips: 1, tipped: amount } }], interaction.channel);
    } catch (error) {
        console.error('Error handling /tip:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Give some of your points to the herald, to show your appreciation',
    category: 'GLORY',
    options: [
        {
            name: 'amount',
            description: 'How many points to give the herald',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
        },
    ],
    run: tip,
};
