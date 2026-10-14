/* Achievements: one-time goals that each pay REWARD points when earned.
 *
 * There are three kinds:
 *   - counter goals (win 5 Easy bosses, 10 correct trivia answers, ...): the
 *     games call record() when something counts, which adds to the member's
 *     counters and unlocks any goal reached.
 *   - stat goals (10 duel wins, 100 fit, 100 points earned, a class, ...):
 *     read from data the bot already keeps. checkStats() looks at one member
 *     after something that could change them (a purchase, an equip, a duel).
 *   - direct goals (check /achievements): grant() unlocks it outright.
 *
 * An hourly sweep also checks every member against every goal, which catches
 * anything a hook missed (points earned from voice, say) and backfilled
 * history, and posts what it found as one summary.
 *
 * Unlocking is a single transaction with the payout (pointsStore.
 * unlockAchievement), so a goal can only ever be earned and paid once, no
 * matter how many hooks or sweeps notice it at the same time.
 *
 * Every hook here catches its own errors: an achievement failing must never
 * break the game that triggered it.
 *
 * Exposes:
 *   ACHIEVEMENTS, REWARD
 *   record(guildId, entries, channel) - entries: [{ userId, displayName, counts }]
 *   checkStats(guildId, members, channel) - members: [{ userId, displayName }]
 *   grant(guildId, member, id, channel)
 *   progressFor(achievement, state, stats) - "3/10" style progress, or null
 *   sweepGuild(guild) / scheduleAchievements(client)
 */

const { EmbedBuilder } = require('discord.js');
const pointsStore = require('./pointsStore');
const { totalFit } = require('./character');
const { resolveChannel } = require('./resolveChannel');
const { findAnnounceChannel } = require('./findAnnounceChannel');
const catalog = require('../commands/passive/shopCatalog');

const REWARD = 5;
const SWEEP_MS = 60 * 60 * 1000;
const FIRST_SWEEP_MS = 2 * 60 * 1000; // after startup, once the client has settled
const EMBED_COLOR = 0xd4af37;
// The duel method name stored in the duel history (see commands/prompts/duel.js).
const DEATH_ROLL = 'Death Roll';

// counter: progress kept in the member's achievement counters (see record).
// stat: a function of the member's ledger stats (see statsFrom).
const ACHIEVEMENTS = [
    { id: 'first_victory', name: 'First Blood', description: 'Win a boss encounter', counter: 'encounter_wins', goal: 1 },
    { id: 'hero', name: 'Hero of the Realm', description: 'Land the killing blow on a boss', counter: 'heroics', goal: 1 },
    { id: 'looter', name: 'Spoils of War', description: 'Win a piece of boss loot', counter: 'loot', goal: 1 },
    { id: 'easy_5', name: 'Pest Control', description: 'Beat 5 Easy bosses', counter: 'win_easy', goal: 5 },
    { id: 'medium_5', name: 'Monster Hunter', description: 'Beat 5 Medium bosses', counter: 'win_medium', goal: 5 },
    { id: 'hard_5', name: 'Giant Slayer', description: 'Beat 5 Hard bosses', counter: 'win_hard', goal: 5 },
    { id: 'extreme_5', name: 'Dragon Slayer', description: 'Beat 5 Extreme bosses', counter: 'win_extreme', goal: 5 },
    { id: 'max_5', name: 'Legend of the Realm', description: 'Beat 5 Max bosses', counter: 'win_max', goal: 5 },
    { id: 'raid_5', name: 'Raid Leader', description: 'Beat 5 Raid bosses', counter: 'win_raid', goal: 5 },
    { id: 'duelist', name: 'Duelist', description: 'Win 10 duels', stat: 'duelWins', goal: 10 },
    { id: 'wealthy', name: 'Coin in the Coffers', description: 'Earn 100 points in all', stat: 'earned', goal: 100 },
    { id: 'fit_100', name: 'Dressed to Kill', description: 'Wear 100 fit of gear', stat: 'fit', goal: 100 },
    { id: 'merchant', name: 'Shrewd Merchant', description: 'Sell a piece of gear to another noble with /sell', counter: 'sales', goal: 1 },
    { id: 'connections_10', name: 'Seeker of Kinships', description: 'Help solve 10 Connections puzzles', counter: 'connections', goal: 10 },
    { id: 'ladders_10', name: 'Ladder Climber', description: 'Help solve 10 Word Ladders', counter: 'ladders', goal: 10 },
    { id: 'trivia_10', name: 'Learned Scholar', description: 'Answer 10 daily trivia questions correctly', counter: 'trivia', goal: 10 },
    { id: 'wow_10', name: 'Lorekeeper', description: 'Answer 10 WoW trivia questions correctly', counter: 'wow_trivia', goal: 10 },
    { id: 'poser', name: 'Strike a Pose', description: 'Change thy /pose', stat: 'posed', goal: 1 },
    { id: 'curious', name: 'Know Thyself', description: 'Check thy /achievements' },
    { id: 'class', name: 'Called to Arms', description: 'Adopt a class', stat: 'hasClass', goal: 1 },
    { id: 'race', name: 'Born Anew', description: 'Choose a race', stat: 'hasRace', goal: 1 },
    { id: 'title', name: 'Titled Noble', description: 'Earn a title', stat: 'hasTitle', goal: 1 },
    { id: 'lucky_break', name: 'Lucky Break', description: 'Win an encounter thy party was outmatched in', counter: 'lucky_wins', goal: 1 },
    { id: 'full_muster', name: 'Full Muster', description: 'Win an encounter with a party of 5 or more', counter: 'full_party_wins', goal: 1 },
    { id: 'death_roller', name: 'Death Roller', description: 'Win a Death Roll duel', stat: 'deathRollWins', goal: 1 },
    { id: 'humbled', name: 'Humbled', description: 'Lose 10 duels', stat: 'duelLosses', goal: 10 },
    { id: 'mind_reader', name: 'Mind Reader', description: "Predict the group's would-you-rather pick 5 times", counter: 'wyr_predictions', goal: 5 },
    { id: 'clutch', name: 'Clutch', description: 'Solve the final group of a Connections puzzle', counter: 'clutch', goal: 1 },
    { id: 'podium', name: 'On the Podium', description: 'Place top 3 on a weekly recap podium', counter: 'podiums', goal: 1 },
    { id: 'full_kit', name: 'Full Kit', description: 'Wear something in every gear slot', stat: 'fullKit', goal: 1 },
    { id: 'legendary', name: 'Legendary', description: 'Wear a Legendary piece', stat: 'legendary', goal: 1 },
    { id: 'dealmaker', name: 'Dealmaker', description: 'Complete a /trade', counter: 'trades', goal: 1 },
    { id: 'tipper', name: 'A Coin for the Herald', description: 'Tip the herald with /tip', counter: 'tips', goal: 1 },
    { id: 'patron', name: 'Patron of the Herald', description: 'Tip the herald 25 points in all', counter: 'tipped', goal: 25 },
    { id: 'goblin_mode', name: 'Goblin Mode', description: "Plunder a piece from a boss's hoard", counter: 'plunders', goal: 1 },
    { id: 'red_handed', name: 'Caught Red-Handed', description: 'Be struck down while plundering in a lost encounter', counter: 'plunder_caught', goal: 1 },
    { id: 'adopter', name: 'A Friend for Life', description: 'Adopt a pet from the shop', counter: 'pets_adopted', goal: 1 },
    { id: 'good_owner', name: 'Who Is a Good Pet', description: 'Pet thy pet with /pet', counter: 'pets_petted', goal: 1 },
    { id: 'gambler', name: 'Roll the Bones', description: "Roll the herald's dice with /gamble", counter: 'gambles', goal: 1 },
    { id: 'lucky_roll', name: 'Fortune Favours the Bold', description: 'Win a Legendary piece with /gamble', counter: 'gamble_wins', goal: 1 },
    // Secret: not listed in /achievements until earned, so they spoil nothing.
    { id: 'echo', name: 'Echo of the Ages', description: 'Win a trial and claim a relic', counter: 'trials_won', goal: 1, secret: true },
    { id: 'age_named', name: 'The Age Is Named', description: 'Fight in the party that defeats the Herald', counter: 'herald_wins', goal: 1, secret: true },
];

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

// The encounter tier's counter key, e.g. 'Easy' -> 'win_easy'.
const tierCounter = (difficulty) => `win_${difficulty.toLowerCase()}`;

/* The stat values achievements read, from a ledger item or getCharacter()
 * (both carry the same fields), the member's pose, if known, and `extra`
 * values only the sweep works out (Death Roll wins, from the duel history).
 */
const statsFrom = (character, pose, extra = {}) => ({
    duelWins: character.duelWins || 0,
    duelLosses: character.duelLosses || 0,
    deathRollWins: extra.deathRollWins || 0,
    fullKit: catalog.GEAR_SLOTS.every((slot) => (character.gear || {})[slot]) ? 1 : 0,
    legendary: Object.values(character.gear || {}).some((id) => { const e = catalog.findEntry(id); return e && catalog.rarityFor(e.price) === 'Legendary'; }) ? 1 : 0,
    earned: (character.totalEarned || 0) + (character.earnedBaseline || 0),
    fit: totalFit(character.gear, character),
    posed: pose ? 1 : 0,
    hasClass: character.class && character.class !== catalog.DEFAULT_CLASS.id ? 1 : 0,
    hasRace: character.race ? 1 : 0,
    hasTitle: character.title ? 1 : 0,
});

// How far along an achievement is: its current value toward the goal.
const valueFor = (achievement, state, stats) => {
    if (achievement.counter) return (state.counters || {})[achievement.counter] || 0;
    if (achievement.stat && stats) return stats[achievement.stat] || 0;
    return 0;
};

// The ids due for a member and not yet unlocked. `stats` is optional; stat
// goals are only judged when it is given.
const dueFor = (state, stats) => ACHIEVEMENTS
    .filter((a) => !(state.unlocked || {})[a.id] && a.goal && (a.counter || stats))
    .filter((a) => valueFor(a, state, stats) >= a.goal)
    .map((a) => a.id);

// "3/10" for a multi-step goal not yet reached, otherwise null.
const progressFor = (achievement, state, stats) => {
    if (!achievement.goal || achievement.goal === 1) return null;
    if (achievement.stat && !stats) return null;
    return `${Math.min(valueFor(achievement, state, stats), achievement.goal)}/${achievement.goal}`;
};

/* Unlocks each { userId, displayName, ids } and returns what was newly
 * earned, as [{ userId, displayName, ids }].
 */
const unlockAll = async (guildId, wanted) => {
    const earned = [];
    for (const { userId, displayName, ids } of wanted) {
        const got = [];
        for (const id of ids) {
            if (await pointsStore.unlockAchievement(guildId, userId, displayName, id, REWARD)) got.push(id);
        }
        if (got.length) {
            console.log(`Achievements (guild ${guildId}): ${displayName} (${userId}) earned ${got.join(', ')}.`);
            earned.push({ userId, displayName, ids: got });
        }
    }
    return earned;
};

// One line per achievement, mentioning the member without pinging them.
const announceLines = (earned) => earned.flatMap(({ userId, ids }) => ids.map((id) => {
    const a = byId.get(id);
    return `Achievement earned! <@${userId}> is now **${a.name}**: ${a.description}. +${REWARD} points.`;
}));

const announce = async (channel, earned) => {
    if (!channel || !earned.length) return;
    // A message holds 2000 characters, so a long list goes out in several.
    let chunk = [];
    const send = async () => {
        if (chunk.length) await channel.send({ content: chunk.join('\n'), allowedMentions: { parse: [] } });
        chunk = [];
    };
    for (const line of announceLines(earned)) {
        if ([...chunk, line].join('\n').length > 2000) await send();
        chunk.push(line);
    }
    await send();
};

// Runs a hook body, logging instead of throwing.
const safely = async (label, body) => {
    try {
        return await body();
    } catch (error) {
        console.error(`Achievements: ${label} failed:`, error);
        return [];
    }
};

/* Something countable happened, e.g. record(guildId, [{ userId, displayName,
 * counts: { trivia: 1 } }], channel). Unlocks any counter goal reached and
 * announces it in `channel`.
 */
const record = (guildId, entries, channel) => safely('record', async () => {
    const wanted = [];
    for (const { userId, displayName, counts } of entries) {
        const state = await pointsStore.bumpCounters(guildId, userId, counts);
        const ids = dueFor(state);
        if (ids.length) wanted.push({ userId, displayName, ids });
    }
    const earned = await unlockAll(guildId, wanted);
    await announce(channel, earned);
    return earned;
});

/* Checks the stat goals (and any counter goal reached) for each member,
 * after something that could have changed their stats.
 */
const checkStats = (guildId, members, channel) => safely('checkStats', async () => {
    const wanted = [];
    for (const { userId, displayName } of members) {
        const [character, state, pose] = await Promise.all([
            pointsStore.getCharacter(guildId, userId),
            pointsStore.getAchievements(guildId, userId),
            pointsStore.getPose(guildId, userId),
        ]);
        const ids = dueFor(state, statsFrom(character, pose));
        if (ids.length) wanted.push({ userId, displayName, ids });
    }
    const earned = await unlockAll(guildId, wanted);
    await announce(channel, earned);
    return earned;
});

// Unlocks one achievement outright.
const grant = (guildId, member, id, channel) => safely('grant', async () => {
    const earned = await unlockAll(guildId, [{ ...member, ids: [id] }]);
    await announce(channel, earned);
    return earned;
});

/* What a member is estimated to have earned before totalEarned existed:
 * their points now, plus what they have spent on what they own, plus what
 * they lost in duels, less what totalEarned has already counted.
 */
const estimateBaseline = (item, duelLosses) => {
    const priceOf = (id) => (catalog.findEntry(id) || { price: 0 }).price;
    const owned = [...Object.values(item.gear || {}), ...(item.bag || []), ...(item.cosmetics || []), item.title, item.class, item.race]
        .filter(Boolean)
        .reduce((sum, id) => sum + priceOf(id), 0);
    return Math.max(0, (item.points || 0) + owned + duelLosses - (item.totalEarned || 0));
};

/* Checks every member of a guild against every goal and posts anything new
 * as one summary. The first run after this ships doubles as the backfill.
 */
const sweepGuild = async function (guild) {
    const [members, allStates, poses, history] = await Promise.all([
        pointsStore.getMembers(guild.id),
        pointsStore.getAllAchievements(guild.id),
        pointsStore.getPoses(guild.id),
        pointsStore.getDuelHistory(guild.id, 1000),
    ]);

    const duelLosses = {};
    const deathRollWins = {};
    for (const duel of history) {
        duelLosses[duel.loserId] = (duelLosses[duel.loserId] || 0) + (duel.wager || 0);
        if (duel.method === DEATH_ROLL) deathRollWins[duel.winnerId] = (deathRollWins[duel.winnerId] || 0) + 1;
    }

    const wanted = [];
    for (const item of members) {
        if (item.earnedBaseline === undefined) {
            item.earnedBaseline = estimateBaseline(item, duelLosses[item.userId] || 0);
            await pointsStore.setEarnedBaseline(guild.id, item.userId, item.earnedBaseline);
        }
        const state = allStates.get(item.userId) || { unlocked: {}, counters: {} };
        const ids = dueFor(state, statsFrom(item, poses[item.userId], { deathRollWins: deathRollWins[item.userId] }));
        if (ids.length) wanted.push({ userId: item.userId, displayName: item.displayName || 'a noble', ids });
    }
    // Counter goals for someone with no ledger item yet (rare, but possible).
    for (const [userId, state] of allStates) {
        if (members.some((m) => m.userId === userId)) continue;
        const ids = dueFor(state);
        if (ids.length) wanted.push({ userId, displayName: 'a noble', ids });
    }

    const earned = await unlockAll(guild.id, wanted);
    if (!earned.length) return earned;

    const channel = await resolveChannel(guild, 'achievements', findAnnounceChannel);
    if (!channel) return earned;
    const lines = earned.map(({ userId, ids }) =>
        `<@${userId}>: ${ids.map((id) => `**${byId.get(id).name}**`).join(', ')}. +${ids.length * REWARD} points.`);
    // An embed description holds 4096 characters.
    const pages = [];
    for (const line of lines) {
        if (pages.length && `${pages[pages.length - 1]}\n${line}`.length <= 4096) pages[pages.length - 1] += `\n${line}`;
        else pages.push(line);
    }
    for (const page of pages) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Achievements Earned')
            .setDescription(`Hear ye! The Herald records these deeds, each worth ${REWARD} points:\n\n${page}\n\nSee thine own with \`/achievements\`.`);
        await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    }
    return earned;
};

const sweepAll = async (client) => {
    for (const guild of client.guilds.cache.values()) {
        await sweepGuild(guild).catch((error) => console.error(`Achievements: sweep failed for guild "${guild.name}":`, error));
    }
};

// Call once on ready: sweeps shortly after startup, then hourly.
const scheduleAchievements = function (client) {
    setTimeout(() => sweepAll(client), FIRST_SWEEP_MS);
    setInterval(() => sweepAll(client), SWEEP_MS);
    console.log(`Achievements: sweeping every ${SWEEP_MS / 60000} minutes, first in ${FIRST_SWEEP_MS / 60000}.`);
};

module.exports = {
    ACHIEVEMENTS,
    REWARD,
    tierCounter,
    statsFrom,
    dueFor,
    progressFor,
    estimateBaseline,
    record,
    checkStats,
    grant,
    sweepGuild,
    scheduleAchievements,
};
