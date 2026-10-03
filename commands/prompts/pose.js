/* /pose [number] - choose the stick figure pose shown beside your /flex sheet.
 *
 * With no number it lists the poses with their numbers. With one it sets your
 * pose. Anyone can use it, for free, and change it any time. The choice is
 * private, so only you see the reply; the figure shows up the next time you
 * /flex.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { POSES } = require('../../src/poses');

const listing = () => POSES.map((pose, i) => `${i + 1}. ${pose.name}`).join('\n');

const pose = async function (interaction) {
    const number = interaction.options.getInteger('number');

    if (number === null) {
        await interaction.editReply(`**Thy poses**, to be chosen with \`/pose <number>\`:\n${listing()}`);
        return;
    }

    try {
        await pointsStore.setPose(interaction.guild.id, interaction.member.id, number);
        await interaction.editReply(`Thy figure now strikes pose **${number}**: ${POSES[number - 1].name}. Show it off with \`/flex\`.`);
    } catch (error) {
        console.error('Error setting a pose:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Choose the stick figure pose shown beside your /flex sheet',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    options: [
        {
            name: 'number',
            description: 'The pose number from /pose with no number (leave empty to list them)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: POSES.length,
        },
    ],
    run: pose,
};
