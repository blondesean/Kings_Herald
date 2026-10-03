/* Shared: a private yes/no question for the member who ran a command.
 *
 * The question goes out as an ephemeral follow-up, so only the member sees the
 * buttons, and the click is read from that message, filtered to the member.
 * Resolves true only on Yes. No, or no answer within CONFIRM_WINDOW_MS, is false.
 * The interaction must already be deferred or replied to.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const flavor = require('../flavor_text');

const CONFIRM_WINDOW_MS = 30 * 1000;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const askConfirm = async function (interaction, content) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('confirm_no').setLabel('No').setStyle(ButtonStyle.Danger)
    );

    const prompt = await interaction.followUp({ content, components: [row], flags: MessageFlags.Ephemeral });

    try {
        const click = await prompt.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: CONFIRM_WINDOW_MS,
            filter: (i) => i.user.id === interaction.user.id,
        });
        const yes = click.customId === 'confirm_yes';
        await click.update({ content: yes ? 'Confirmed.' : pick(flavor.confirmCancelledLines()), components: [] });
        return yes;
    } catch {
        await prompt.edit({ content: pick(flavor.confirmExpiredLines()), components: [] }).catch(() => {});
        return false;
    }
};

module.exports = { askConfirm, CONFIRM_WINDOW_MS };
