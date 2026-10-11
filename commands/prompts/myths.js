/* /myths - the court's all-time high scores.
 *
 * Read live from data the bot already keeps:
 *   - Most Duels Won: duelWins on the ledger
 *   - Biggest Spender: lifetime shop spending, the shop_spent achievement
 *     counter (src/achievements.js; /buy adds to it)
 *   - Finest Fit: the highest fit worn right now
 *   - Greatest Duel: the biggest wager won, from the duel history
 * Kept as records when they happen (pointsStore.setMythIfHigher):
 *   - Mightiest Party: the most power, meaning fit after stance multipliers,
 *     ever brought to an encounter, win or lose (commands/passive/encounter.js)
 *   - Longest Week in Voice: saved by the weekly recap before it resets the
 *     week's tally (commands/passive/weeklyRecap.js). A week still under way
 *     shows if it has already beaten the record.
 *
 * Ties share the record. Public, so the whole court sees the legends.
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { fitScore } = require('../../src/character');

const EMBED_COLOR = 0xd4af37;

const hours = (seconds) => `${(seconds / 3600).toFixed(1)} hours`;

// "A", "A and B", "A, B and C".
const joinNames = (names) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

// Everyone tied for the top value of `valueOf` (above zero), as { value, names }.
const leaders = (entries, valueOf, nameOf) => {
    const top = Math.max(0, ...entries.map(valueOf));
    if (!top) return null;
    return { value: top, names: entries.filter((e) => valueOf(e) === top).map(nameOf) };
};

const buildMyths = async (guildId) => {
    const [members, myths, achievements, duels] = await Promise.all([
        pointsStore.getMembers(guildId),
        pointsStore.getMyths(guildId),
        pointsStore.getAllAchievements(guildId),
        pointsStore.getDuelHistory(guildId, 1000),
    ]);
    const nameOf = (userId) => (members.find((m) => m.userId === userId) || {}).displayName || 'a forgotten noble';

    const fields = [];

    const party = myths.party;
    fields.push({
        name: 'Mightiest Party',
        value: party
            ? `**${party.value}** power: ${joinNames(party.members)}, against ${party.boss} on ${party.difficulty}, and they ${party.won ? 'won' : 'fell'}. ${party.day}`
            : 'No party has yet taken the field.',
    });

    const duelists = leaders(members, (m) => m.duelWins || 0, (m) => m.displayName || 'a noble');
    fields.push({
        name: 'Most Duels Won',
        value: duelists ? `**${duelists.value}** wins: ${joinNames(duelists.names)}` : 'No duel has yet been won.',
    });

    // A week still under way counts once it has passed the record.
    const record = myths.voice_week;
    const thisWeek = leaders(members, (m) => m.weeklyVoiceSeconds || 0, (m) => m.displayName || 'a noble');
    let voice = 'No week in voice has yet been recorded.';
    if (thisWeek && (!record || thisWeek.value > record.value)) {
        voice = `**${hours(thisWeek.value)}**: ${joinNames(thisWeek.names)}, this very week, and still counting`;
    } else if (record) {
        voice = `**${hours(record.value)}**: ${record.holderName}, the week ending ${record.day}`;
    }
    fields.push({ name: 'Longest Week in Voice', value: voice });

    const spenders = leaders([...achievements], ([, state]) => state.counters.shop_spent || 0, ([userId]) => nameOf(userId));
    fields.push({
        name: 'Biggest Spender',
        value: spenders ? `**${spenders.value}** points spent in the shop: ${joinNames(spenders.names)}` : 'The merchant has yet to make a sale.',
    });

    const fits = leaders(members, (m) => fitScore(m.gear || {}), (m) => m.displayName || 'a noble');
    fields.push({
        name: 'Finest Fit',
        value: fits ? `**${fits.value}** fit: ${joinNames(fits.names)}` : 'No noble wears a stitch of gear.',
    });

    const biggest = duels.reduce((best, d) => ((d.wager || 0) > ((best && best.wager) || 0) ? d : best), null);
    fields.push({
        name: 'Greatest Duel',
        value: biggest
            ? `**${biggest.wager}** points: ${biggest.winnerName} beat ${biggest.loserName} by ${biggest.method}, ${String(biggest.timestamp).slice(0, 10)}`
            : 'No wager has yet been won.',
    });

    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('Myths of the Court')
        .setDescription('The deeds the bards still sing of. Surpass one, and thy name replaces it.')
        .addFields(fields);
};

const showMyths = async function (interaction) {
    try {
        await interaction.editReply({ embeds: [await buildMyths(interaction.guild.id)] });
    } catch (error) {
        console.error('Error showing myths:', error);
        await interaction.editReply('Alack! The bards have lost their place at present. Pray try again anon!');
    }
};

module.exports = {
    description: "See the court's all-time records",
    category: 'GLORY',
    run: showMyths,
    buildMyths,
};
