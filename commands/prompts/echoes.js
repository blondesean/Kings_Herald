/* /echoes - the herald's roll call of the Echoes, the members who hold a
 * relic (pointsStore.getRelics), in the order they claimed them, so the
 * court can see who may answer the Herald's challenge (src/heraldBattle.js).
 * Once the Herald has revealed himself it says so, with the day if one is
 * named and how many must answer; before that it never mentions the
 * challenge. Ends with how many relics still sleep.
 *
 * Public. Hidden from /help like /trial, and answers only with a riddle until
 * the trials open.
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const campaign = require('../../src/campaign');
const catalog = require('../passive/shopCatalog');
const { getDuel, formatWhen, MIN_PARTY } = require('../../src/heraldBattle');
const { uniqueTrials } = require('../../flavor_text/uniqueTrials');
const flavor = require('../../flavor_text');

const EMBED_COLOR = 0xd4af37;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const buildEchoes = async (guildId, relics) => {
    const [members, revealed] = await Promise.all([
        pointsStore.getMembers(guildId),
        campaign.revealDone(guildId),
    ]);
    const nameOf = (userId, fallback) => (members.find((m) => m.userId === userId) || {}).displayName || fallback || 'a forgotten noble';

    const echoes = [...relics.claimed]
        .sort(([, a], [, b]) => String(a.claimedAt).localeCompare(String(b.claimedAt)))
        .map(([relicId, claim]) => `**${nameOf(claim.ownerId, claim.displayName)}** bears **${(catalog.findEntry(relicId) || { name: relicId }).name}**`);
    const left = catalog.UNIQUES.filter((u) => uniqueTrials[u.id] && !relics.claimed.has(u.id)).length;

    const closing = [];
    if (revealed) {
        const duel = getDuel(guildId);
        closing.push(pick(flavor.heraldEchoesChallengeLines(echoes.length, MIN_PARTY, duel && formatWhen(duel.duelAt))));
    }
    closing.push(pick(left ? flavor.heraldEchoesLeftLines(left) : flavor.trialAllClaimedLines()));

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('The Echoes of the Court')
        .setDescription([pick(flavor.heraldEchoesIntroLines()), echoes.join('\n'), closing.join(' ')].join('\n\n'));
};

const showEchoes = async function (interaction) {
    const guildId = interaction.guild.id;
    try {
        if (!await campaign.trialsOpen(guildId)) {
            await interaction.editReply(pick(flavor.heraldEchoesClosedLines()));
            return;
        }
        const relics = await pointsStore.getRelics(guildId);
        if (!relics.claimed.size) {
            await interaction.editReply(pick(flavor.heraldEchoesNoneLines()));
            return;
        }
        await interaction.editReply({ embeds: [await buildEchoes(guildId, relics)] });
    } catch (error) {
        console.error('Error showing the Echoes:', error);
        await interaction.editReply('Alack! The herald has mislaid his scroll of names. Pray try again anon!');
    }
};

module.exports = {
    description: 'Hear the names of the Echoes, who bear the relics',
    category: 'GLORY',
    hidden: true, // out of the generated /help, like /trial
    run: showEchoes,
    buildEchoes,
};
