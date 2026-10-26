/* /trial: one member's hunt for a relic, the uniques of
 * commands/passive/shopCatalog.js. Three rounds, back to back with no waiting,
 * all in the member's private reply:
 *
 *   1. The Rumor    - RUMORS_OFFERED unclaimed relics, by slot and rumor only.
 *                     The offer is fixed per member per day (offerRumors), so
 *                     running /trial again doesn't reroll it. Picking one
 *                     spends the day's attempt.
 *   2. The Road     - a scene from the relic's legend and three choices, the
 *                     lore question. The legend's own choice adds ROAD_BONUS
 *                     (15%) to the member's power for the fight; any other
 *                     adds nothing, and the road goes on either way.
 *   3. The Guardian - a solo fight at Max difficulty (bossFitPerEntrant for
 *                     one), with the encounter's stances except Plunder, and
 *                     the same "Suit up in my best" choice. Choosing a stance
 *                     starts the fight at once; no choice in time fights
 *                     Balanced, as dressed.
 *
 * A win claims the relic (pointsStore.claimRelic: one owner per relic, one
 * relic per member), grants it like loot, counts toward the secret Echo of
 * the Ages achievement, and is proclaimed publicly with the relic's legend.
 * The first claim in a guild is recorded as the campaign's firstRelicAt, and
 * the fifth starts the Herald's reveal (campaign.beginReveal): the herald
 * hails the five Echoes at once, and the reveal mornings follow. A loss injures by stance, as an encounter does, which
 * keeps the member out of encounters and trials until it heals.
 *
 * Trials open with the seventh lore drop (campaign.trialsOpen). A rehearsal
 * (persist: false, /trial_test) skips every gate and writes nothing.
 */

const crypto = require('crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');
const pointsStore = require('./pointsStore');
const achievements = require('./achievements');
const campaign = require('./campaign');
const { recordHistory } = require('./historyLog');
const { fitScore, bestKit } = require('./character');
const catalog = require('../commands/passive/shopCatalog');
const { bossFitPerEntrant, winChance, STANCES, addDays } = require('../commands/passive/encounter');
const { easternDay } = require('../commands/passive/shop');
const { uniqueTrials, AGES } = require('../flavor_text/uniqueTrials');
const flavor = require('../flavor_text');

const GUARDIAN_TIER = 4; // Max
const RUMORS_OFFERED = 5;
const ROAD_BONUS = 0.15;
const STEP_MS = 2 * 60 * 1000; // each round's time to answer
const TRIAL_STANCES = ['aggressive', 'balanced', 'defensive']; // no Plunder: a Guardian keeps no hoard
const NUMERALS = ['I', 'II', 'III', 'IV', 'V'];
const EMBED_COLOR = 0xd4af37;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const capitalized = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const weekdayOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

// The relics offered to `userId` on `day`: the first `count` of `unclaimed`
// ids in an order hashed from the member, the day and the id. Fixed for the
// day, so asking again shows the same rumors; a relic claimed meanwhile just
// drops out and the next one takes its place.
const offerRumors = (unclaimed, userId, day, count = RUMORS_OFFERED) =>
    unclaimed
        .map((id) => [crypto.createHash('sha256').update(`${userId}:${day}:${id}`).digest('hex'), id])
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .slice(0, count)
        .map(([, id]) => id);

// The fight: the member's power against one Guardian. Returns
// { power, guardianFit, chance }.
const trialOdds = (fit, stance, roadRight) => {
    const power = fit * STANCES[stance].multiplier * (roadRight ? 1 + ROAD_BONUS : 1);
    const guardianFit = bossFitPerEntrant(GUARDIAN_TIER);
    return { power, guardianFit, chance: winChance(power / guardianFit, GUARDIAN_TIER) };
};

// Fisher-Yates, so the legend's choice isn't always first.
const shuffled = (items, random = Math.random) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

// Waits for the member's next click on `message`, or null on timeout.
const nextClick = (message, userId) => message.awaitMessageComponent({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === userId,
    time: STEP_MS,
}).catch(() => null);

const guardianPrompt = (prefix, trial, roadLine, kits, suitUp) => {
    const stanceRow = new ActionRowBuilder().addComponents(TRIAL_STANCES.map((key) =>
        new ButtonBuilder().setCustomId(`${prefix}stance_${key}`).setLabel(STANCES[key].label).setStyle(STANCES[key].style)
    ));
    const components = [stanceRow];
    let kitText = '';
    if (kits.bestFit > kits.wornFit) {
        kitText = `\n\n**Thy gear:** ${suitUp ? `thy finest, fit ${kits.bestFit}` : `as thou art dressed, fit ${kits.wornFit}`}\nThy bags hold finer arms than thou wearest. Shall the herald suit thee up in thy best for this fight? Thy wardrobe stays just as it is.`;
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${prefix}kit_best`).setLabel(`Suit up in my best${suitUp ? ' - chosen' : ''}`).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`${prefix}kit_worn`).setLabel(`Fight as I am dressed${suitUp ? '' : ' - chosen'}`).setStyle(ButtonStyle.Secondary),
        ));
    }
    return {
        content: `${roadLine}\n\n${pick(flavor.trialGuardianLines(trial.guardian))}\n\n${STANCE_NOTE}${kitText}\n\n**Choose thy stance to begin the fight.** If thou choosest nothing in ${STEP_MS / 60000} minutes, thou fightest Balanced, as thou art dressed.`,
        components,
    };
};

const STANCE_NOTE = 'Aggressive fights at +15% fit but risks two days\' rest on a loss; Balanced at thy true fit, one day\'s rest; Defensive at -10% and escapes unhurt.';

/* Runs one trial for the member behind `interaction`, which must already be
 * deferred privately. persist: false is a rehearsal.
 */
const runTrial = async function (interaction, { persist = true } = {}) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const displayName = interaction.member?.displayName || interaction.user.username;
    const today = easternDay();
    const tag = `Trial (${persist ? 'real' : 'rehearsal'}) (guild ${guildId}, ${displayName})`;
    const say = (content, components = []) => interaction.editReply({ content, components, embeds: [] });

    // ---- the gates ----
    const relics = persist ? await pointsStore.getRelics(guildId) : { claimed: new Map(), holders: new Map() };
    if (persist) {
        if (!await campaign.trialsOpen(guildId)) return say(pick(flavor.trialClosedLines()));
        const held = relics.holders.get(userId);
        if (held) return say(pick(flavor.trialHeldLines((catalog.findEntry(held) || { name: 'a relic' }).name)));
        const injuredUntil = await pointsStore.getInjury(guildId, userId).catch(() => null);
        if (injuredUntil && today <= injuredUntil) return say(pick(flavor.trialInjuredLines(weekdayOf(addDays(injuredUntil, 1)))));
        if (await pointsStore.getTrialDay(guildId, userId) === today) return say(pick(flavor.trialDoneTodayLines()));
    }
    const unclaimed = catalog.UNIQUES.filter((u) => !relics.claimed.has(u.id) && uniqueTrials[u.id]).map((u) => u.id);
    if (!unclaimed.length) return say(pick(flavor.trialAllClaimedLines()));

    const prefix = `trial_${crypto.randomBytes(4).toString('hex')}_`;

    // ---- 1. the rumor ----
    // A rehearsal draws fresh rumors each time, so a tester can see many.
    const offered = offerRumors(unclaimed, persist ? userId : crypto.randomBytes(4).toString('hex'), today);
    const rumorLines = offered.map((id, i) => `**${NUMERALS[i]}.** *${capitalized(catalog.findEntry(id).slot)}.* ${uniqueTrials[id].rumor}`);
    const rumorMessage = await say(
        `${pick(flavor.trialRumorIntroLines())}\n\n${rumorLines.join('\n\n')}`,
        [new ActionRowBuilder().addComponents(offered.map((id, i) =>
            new ButtonBuilder().setCustomId(`${prefix}rumor_${i}`).setLabel(NUMERALS[i]).setStyle(ButtonStyle.Primary)
        ))]
    );
    const rumorClick = await nextClick(rumorMessage, userId);
    if (!rumorClick) return say(pick(flavor.trialRumorTimeoutLines()));
    await rumorClick.deferUpdate().catch(() => {});
    const relicId = offered[Number(rumorClick.customId.slice(`${prefix}rumor_`.length))];
    const relic = catalog.findEntry(relicId);
    const trial = uniqueTrials[relicId];

    // Following a rumor spends the day.
    if (persist && !await pointsStore.takeTrialAttempt(guildId, userId, today)) return say(pick(flavor.trialDoneTodayLines()));

    // ---- 2. the road ----
    const rightChoice = trial.road.choices[0];
    const choices = shuffled(trial.road.choices);
    const roadMessage = await say(
        `${pick(flavor.trialRoadIntroLines())}\n\n*${trial.road.scene}*`,
        [new ActionRowBuilder().addComponents(choices.map((choice, i) =>
            new ButtonBuilder().setCustomId(`${prefix}road_${i}`).setLabel(choice).setStyle(ButtonStyle.Secondary)
        ))]
    );
    const roadClick = await nextClick(roadMessage, userId);
    if (!roadClick) return say(pick(flavor.trialRoadTimeoutLines()));
    await roadClick.deferUpdate().catch(() => {});
    const roadRight = choices[Number(roadClick.customId.slice(`${prefix}road_`.length))] === rightChoice;
    const roadLine = `*${pick(roadRight ? flavor.trialRoadRightLines() : flavor.trialRoadWrongLines())}*`;

    // ---- 3. the guardian ----
    const character = await pointsStore.getCharacter(guildId, userId).catch(() => ({}));
    const kits = { wornFit: fitScore(character.gear || {}), bestFit: fitScore(bestKit(character)) };
    let suitUp = false;
    let stance = null;
    let guardianMessage = await interaction.editReply({ ...guardianPrompt(prefix, trial, roadLine, kits, suitUp), embeds: [] });
    while (!stance) {
        const click = await nextClick(guardianMessage, userId);
        if (!click) {
            stance = 'balanced';
            suitUp = false;
            break;
        }
        await click.deferUpdate().catch(() => {});
        const action = click.customId.slice(prefix.length);
        if (action.startsWith('stance_')) {
            stance = action.slice('stance_'.length);
        } else {
            suitUp = action === 'kit_best';
            guardianMessage = await interaction.editReply({ ...guardianPrompt(prefix, trial, roadLine, kits, suitUp), embeds: [] });
        }
    }

    const suitedUp = suitUp && kits.bestFit > kits.wornFit;
    const fit = suitedUp ? kits.bestFit : kits.wornFit;
    const { power, guardianFit, chance } = trialOdds(fit, stance, roadRight);
    const won = Math.random() < chance;
    console.log(`${tag}: ${relic.name}, road ${roadRight ? 'right' : 'wrong'}, ${stance}${suitedUp ? ', suited up' : ''}, power ${Math.round(power)} vs ${guardianFit}, ${Math.round(chance * 100)}% odds, ${won ? 'won' : 'lost'}.`);

    const record = (result) => recordHistory('trial', {
        guildId,
        userId,
        name: displayName,
        rehearsal: !persist,
        relic: relicId,
        offered,
        roadRight,
        stance,
        suitedUp,
        fit,
        power: Math.round(power),
        guardianFit,
        chance: Math.round(chance * 1000) / 1000,
        won,
        result,
    });

    if (!won) {
        const days = STANCES[stance].restDays;
        if (persist && days) {
            await pointsStore.setInjury(guildId, userId, addDays(today, days)).catch((error) => console.error(`${tag}: failed to record an injury:`, error.message));
        }
        record('lost');
        // Injured through today + days, so the roads open the day after.
        const rest = days
            ? ` Thou must rest ${days} day${days === 1 ? '' : 's'}.${persist ? ` The roads open to thee again on ${weekdayOf(addDays(today, days + 1))}.` : ''}`
            : ` Thy guard held, and thou walkest away unhurt.${persist ? ' The roads open again on the morrow.' : ''}`;
        return say(`${roadLine}\n\n${capitalized(pick(flavor.trialLossLines(trial.guardian.name)))}${rest}${persist ? '' : '\n\n*A rehearsal: no wound was truly taken.*'}`);
    }

    if (!persist) {
        record('rehearsal');
        return say(`${roadLine}\n\n${capitalized(pick(flavor.trialWinLines(trial.guardian.name, relic.name)))}\n\n${trial.legend}\n\n*A rehearsal: the relic was not truly claimed.*`);
    }

    if (!await pointsStore.claimRelic(guildId, relicId, userId, displayName)) {
        record('snatched');
        return say(pick(flavor.trialSnatchedLines(relic.name)));
    }
    const granted = await pointsStore.grantGear(guildId, userId, displayName, relicId, relic.slot).catch((error) => {
        console.error(`${tag}: failed to grant the relic:`, error.message);
        return 'failed';
    });
    record(granted);
    const firstRelic = await pointsStore.setCampaignOnce(guildId, 'firstRelicAt', new Date().toISOString()).catch(() => false);
    if (firstRelic) console.log(`${tag}: the first relic in this guild.`);

    const where = granted === 'equipped' ? 'It is equipped at once.' : 'It waits in thy bag.';
    await say(`${roadLine}\n\n${capitalized(pick(flavor.trialWinLines(trial.guardian.name, relic.name)))} ${where}\n\n${trial.legend}`);

    // The court hears of it.
    await interaction.channel.send({
        embeds: [new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`A relic wakes: ${relic.name}`)
            .setDescription(`${flavor.trialClaimedLine(displayName, relic.lore)}\n\n${trial.legend}`)
            .setFooter({ text: AGES[trial.age] || 'The Long Memory' })
            .setTimestamp()],
        allowedMentions: { parse: [] },
    }).catch((error) => console.error(`${tag}: failed to proclaim the claim:`, error.message));

    // The fifth relic claimed: the herald hails the five, and his reveal
    // begins the next morning.
    const relicsNow = await pointsStore.getRelics(guildId).catch(() => null);
    if (relicsNow && await campaign.beginReveal(guildId, relicsNow.holders.size).catch(() => false)) {
        const names = [...relicsNow.claimed.values()].sort((a, b) => (a.claimedAt < b.claimedAt ? -1 : 1)).map((c) => c.displayName);
        const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names.join('');
        console.log(`${tag}: the fifth relic; the Herald's reveal begins tomorrow.`);
        await interaction.channel.send({ content: pick(flavor.revealHailLines(list)), allowedMentions: { parse: [] } })
            .catch((error) => console.error(`${tag}: failed to hail the five:`, error.message));
    }

    const member = { userId, displayName };
    await achievements.record(guildId, [{ ...member, counts: { trials_won: 1 } }], interaction.channel);
    await achievements.checkStats(guildId, [member], interaction.channel);
    return null;
};

module.exports = { runTrial, offerRumors, trialOdds, shuffled, GUARDIAN_TIER, ROAD_BONUS, RUMORS_OFFERED, TRIAL_STANCES };
