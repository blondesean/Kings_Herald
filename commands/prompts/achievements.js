/* /achievements - see which achievements you have earned, and how far along
 * you are on the rest. Each one pays 10 points once (see src/achievements.js).
 *
 * Looking is itself an achievement, so the first look unlocks one. The list
 * is private, but an unlock is announced in the channel like any other.
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const achievements = require('../../src/achievements');

const EMBED_COLOR = 0xd4af37;

const showAchievements = async function (interaction) {
    const guildId = interaction.guild.id;
    const member = { userId: interaction.member.id, displayName: interaction.member.displayName };

    try {
        await achievements.grant(guildId, member, 'curious', interaction.channel);

        const [state, character, pose] = await Promise.all([
            pointsStore.getAchievements(guildId, member.userId),
            pointsStore.getCharacter(guildId, member.userId),
            pointsStore.getPose(guildId, member.userId),
        ]);
        const stats = achievements.statsFrom(character, pose);

        const earned = [];
        const locked = [];
        for (const a of achievements.ACHIEVEMENTS) {
            if (state.unlocked[a.id]) {
                earned.push(`**${a.name}**: ${a.description}`);
            } else {
                const progress = achievements.progressFor(a, state, stats);
                locked.push(`**${a.name}**: ${a.description}${progress ? `, ${progress}` : ''}`);
            }
        }

        const total = achievements.ACHIEVEMENTS.length;
        const sections = [];
        if (earned.length) sections.push(`__Earned__\n${earned.join('\n')}`);
        if (locked.length) sections.push(`__Yet to earn__\n${locked.join('\n')}`);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`${member.displayName}'s Achievements: ${earned.length} of ${total}`)
            .setDescription(`Each deed earns ${achievements.REWARD} points, once.\n\n${sections.join('\n\n')}`);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Error showing achievements:', error);
        await interaction.editReply('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'See your achievements and progress (visible only to you)',
    category: 'ROYAL CHRONICLES',
    ephemeral: true,
    run: showAchievements,
};
