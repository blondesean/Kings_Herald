/* /gamble - Saturdays only (Eastern): pay GAMBLE_COST points for a roll of the
 * herald's dice, 1 to 100. A roll of WIN_AT_OR_UNDER or less (a GAMBLE_CHANCE
 * chance) wins a random Legendary piece the player doesn't already own, worn
 * or in the bag, granted like boss loot: into an empty slot, otherwise the
 * bag. Anyone may roll as often as their points allow. On average a Legendary
 * costs 50 points this way, the same as buying one in the shop.
 *
 * The points are taken before the roll, in one conditional update, so a quick
 * second roll can't overdraw. A player who owns every Legendary is turned away
 * before paying. Public, so the court sees every roll.
 */

const pointsStore = require('../../src/pointsStore');
const achievements = require('../../src/achievements');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const GAMBLE_COST = 5;
const GAMBLE_CHANCE = 0.10;
const WIN_AT_OR_UNDER = Math.round(GAMBLE_CHANCE * 100);
const TIMEZONE = 'America/New_York';

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Whether it's Saturday in Eastern time.
const isGambleDay = (now = new Date()) =>
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, weekday: 'short' }).format(now) === 'Sat';

// The Legendary gear the player doesn't own yet, worn or bagged.
const prizesFor = (character) => {
    const owned = new Set([...Object.values(character.gear || {}), ...(character.bag || [])]);
    return catalog.GEAR.filter((e) =>
        catalog.GEAR_SLOTS.includes(e.slot) && catalog.rarityFor(e.price) === 'Legendary' && !e.unique && !owned.has(e.id));
};

const gamble = async function (interaction) {
    const guildId = interaction.guild.id;
    const member = interaction.member;

    try {
        if (!isGambleDay()) {
            await interaction.editReply(pick(flavor.gambleClosedLines()));
            return;
        }
        const character = await pointsStore.getCharacter(guildId, member.id);
        const prizes = prizesFor(character);
        if (!prizes.length) {
            await interaction.editReply(pick(flavor.gambleOwnsAllLines()));
            return;
        }
        if (!await pointsStore.spendPoints(guildId, member.id, member.displayName, GAMBLE_COST, 'gamble')) {
            await interaction.editReply(pick(flavor.gamblePoorLines(GAMBLE_COST)));
            return;
        }

        const roll = 1 + Math.floor(Math.random() * 100);
        const mention = `<@${member.id}>`;
        if (roll > WIN_AT_OR_UNDER) {
            console.log(`Gamble (guild ${guildId}): ${member.displayName} (${member.id}) rolled ${roll}, lost ${GAMBLE_COST}.`);
            await interaction.editReply({ content: pick(flavor.gambleLoseLines(mention, roll, WIN_AT_OR_UNDER)), allowedMentions: { parse: [] } });
            await achievements.record(guildId, [{ userId: member.id, displayName: member.displayName, counts: { gambles: 1 } }], interaction.channel);
            return;
        }

        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        const label = `[${catalog.rarityFor(prize.price)}] ${prize.name}`;
        // The roll is paid and won, so a failed grant is logged in full for an admin to fix by hand.
        const placed = await pointsStore.grantGear(guildId, member.id, member.displayName, prize.id, prize.slot).catch((error) => {
            console.error(`Gamble (guild ${guildId}): ${member.displayName} (${member.id}) won ${prize.id} but the grant failed:`, error.message);
            return null;
        });
        // Rolling and winning count toward their achievements either way.
        const counted = [{ userId: member.id, displayName: member.displayName, counts: { gambles: 1, gamble_wins: 1 } }];
        if (!placed) {
            await interaction.editReply({ content: `${mention} rolls a **${roll}** and wins **${label}**, but the herald fumbles the handover. An admin will see it delivered.`, allowedMentions: { parse: [] } });
            await achievements.record(guildId, counted, interaction.channel);
            return;
        }
        console.log(`Gamble (guild ${guildId}): ${member.displayName} (${member.id}) rolled ${roll} and won ${prize.name} (${placed}).`);
        await interaction.editReply({ content: pick(flavor.gambleWinLines(mention, roll, label, placed)), allowedMentions: { parse: [] } });
        await achievements.record(guildId, counted, interaction.channel);
        await achievements.checkStats(guildId, [{ userId: member.id, displayName: member.displayName }], interaction.channel);
    } catch (error) {
        console.error('Error handling /gamble:', error);
        await interaction.editReply('Alack! The herald has dropped his dice under the table. Pray try again anon!').catch(() => {});
    }
};

module.exports = {
    description: `Saturdays only: ${GAMBLE_COST} points for a ${WIN_AT_OR_UNDER}% chance at a Legendary piece you don't own`,
    category: 'SHOP',
    run: gamble,
    isGambleDay,
    prizesFor,
    GAMBLE_COST,
    GAMBLE_CHANCE,
};
