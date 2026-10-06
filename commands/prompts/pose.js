/* /pose [pose] - choose the stick figure pose shown beside your /flex sheet.
 *
 * The pose is picked from a list with autosuggest. Anyone can use it, for
 * free, and change it any time. The choice is private, so only you see the
 * reply; the figure shows up the next time you /flex.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { POSES, poseId } = require('../../src/poses');

const pose = async function (interaction) {
    const chosen = interaction.options.getString('pose');
    if (!chosen) return;

    const entry = POSES.find((p) => poseId(p) === chosen);
    try {
        await pointsStore.setPose(interaction.guild.id, interaction.member.id, poseId(entry));
        await interaction.editReply(`Thy figure now strikes the **${entry.name}** pose. Show it off with \`/flex\`.`);
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
            name: 'pose',
            description: 'The pose for your /flex figure',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: POSES.map((p) => ({ name: p.name, value: poseId(p) })),
        },
    ],
    run: pose,
};
