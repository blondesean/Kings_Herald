/* Passive behavior: the daily boss encounter.
 *
 * Once a day (placed by src/dailyLineup.js so it never overlaps the trivia,
 * puzzle or shop), the Herald announces that an unnamed threat stirs. Members
 * The difficulty is rolled when the threat is posted, weighted among the
 * tiers the server has opened (TIER_WEIGHTS): Easy 5%, Medium 15%, Hard and
 * Extreme 40% each to begin with, then Max after its first Extreme win,
 * taking half of Extreme's share (see
 * src/campaign.js, which also starts the lore drops on the first Max win),
 * and announced up front so members
 * can decide whether to answer. They click "Join the party" (up to
 * MAX_PARTY, 20) and are privately prompted for a stance: Aggressive (fit
 * x1.15), Balanced (x1), Defensive (x0.9) or Plunder (x0.8). It stays secret and can be
 * changed until the battle, which starts when JOIN_WINDOW_MS runs out, or as
 * soon as the party is full and everyone has chosen. Everyone who joined
 * fights; a stance left unchosen is Balanced. Fewer than MIN_PARTY (3) and
 * the threat passes with no battle.
 *
 * The battle:
 *   - A random boss from the rolled tier (encounterBosses.js) is revealed.
 *   - Boss fit = (the cheapest gear price of that tier's rarity in each slot,
 *     summed over all slots) x that tier's assumed kit coverage x party
 *     size. Coverage is 3/4 for Easy (three-quarters of the slots in Common),
 *     7/8 for Medium, a full kit for Hard and 85% of an Epic kit for Extreme
 *     (see TIER_COVERAGE), since players fill slots gradually. Max is the
 *     exception: a tenth of the way from a full Epic kit to a full Legendary
 *     one, so a party mostly in Epic gear has a fair shot and Legendary gear
 *     has the edge.
 *   - Party fit = each member's equipped fit (read at battle time) x their
 *     stance multiplier, summed. A member whose bags hold finer gear than
 *     they wear is offered "Suit up in my best" in their prompt; if chosen,
 *     they fight with the finest piece they own in each slot (bestKit), and
 *     the fight is recorded that way, but their equipped gear never changes.
 *   - Win chance comes from the ratio party/boss (see winChance): 80% at an
 *     even match, +5% per 10% over, -20% per 10% under (0% at 60%), so
 *     100% at 140%. From Hard up it's capped so there's always some risk
 *     (TIER_LOSS_FLOOR: Hard 99%, Extreme 97%, Max 95%); Easy and Medium
 *     have no cap.
 * On a win, one member lands the killing blow — weighted by each member's
 * effective (stance-adjusted) fit — and the boss drops one piece per
 * ADVENTURERS_PER_DROP (2.5) members, rounded down (2 for a party of 5),
 * different random pieces of gear of the tier's rarity. For each piece the
 * herald rolls for the whole party, asking no one (lootChoices): Need for
 * each member it would upgrade, finer than anything they own for the slot,
 * worn or bagged, and Greed for the rest. If anyone needs, only the needers
 * roll 1-100; otherwise everyone greeds; ties at the top re-roll. The winner gets the item the same way as a /buy — into an
 * empty slot, else the bag. Besides, each Plunder member makes off with a
 * random piece of the tier's rarity that isn't among the boss's drops,
 * granted the same way and announced publicly (which reveals their stance).
 * On a loss, the foe singles out INJURED_PER_LOSS (2) members, the less fit
 * the likelier (see pickTargets). A Balanced target sits out the next day, an
 * Aggressive or Plunder one the next two (restDays); a Defensive target fends the blow
 * off unhurt. Everyone else escapes unhurt. An injured member can't join an
 * encounter until it passes.
 *
 * Gear checks while the party forms:
 *   - A joiner whose fit alone, fighting Balanced, would give a party of their
 *     equals under JOIN_CHANCE (10%) is turned away, without being told the
 *     fit it takes (joinFitFor works it out, for the docs and tests).
 *   - Every CHECK_INTERVAL_MS (15 minutes) the herald reckons the party's
 *     odds from current gear and chosen stances; under WARN_CHANCE (75%) it
 *     posts a warning with a "Leave the party" button.
 * Injuries persist in DynamoDB (pointsStore.getInjury/setInjury); the
 * encounter itself lives in memory, like the other games.
 *
 * A manual /encounter_test defaults to persist: false: no injuries are
 * recorded, no loot is granted, and injuries don't block joining.
 *
 * Exposes:
 *   runEncounter(client, opts) - runs one encounter; called by src/dailyLineup.js
 *   and the pure rules, exported for the tests and the fairness table:
 *   bossFitPerEntrant(tier), winChance(ratio, tier), rollTier(random),
 *   pickKiller(members, random), rollLoot(choices, random), addDays(day, n)
 */

const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findAdventurerRole } = require('../../src/adventurerRole');
const { fitScore, totalFit, bestKit } = require('../../src/character');
const { petBonus } = require('../../src/pets');
const achievements = require('../../src/achievements');
const campaign = require('../../src/campaign');
const { recordHistory } = require('../../src/historyLog');
const catalog = require('./shopCatalog');
const { easternDay } = require('./shop');
const { DIFFICULTIES, BOSSES } = require('./encounterBosses');
const flavor = require('../../flavor_text');

const JOIN_WINDOW_MS = 3 * 60 * 60 * 1000;
// The herald rolls the loot himself, with no window to wait on; this is the
// time the daily lineup sets aside after the join window for the battle and
// the roll posts.
const LOOT_RESOLVE_MS = 15 * 60 * 1000;
// Party size: at least MIN_PARTY to fight, at most MAX_PARTY. Boss fit scales
// with the party, so every size faces the same odds for the same average fit.
const MIN_PARTY = 3;
const MAX_PARTY = 20;
// The party size the Full Muster achievement asks for.
const FULL_PARTY = 5;
// A win drops one piece of loot per this many members, rounded down.
const ADVENTURERS_PER_DROP = 2.5;
const dropsFor = (partySize) => Math.floor(partySize / ADVENTURERS_PER_DROP);
// While the party forms, the herald checks its odds this often, and warns
// (with a way to leave) when they fall below WARN_CHANCE.
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const WARN_CHANCE = 0.75;
// A member whose fit alone, fighting Balanced, would give a party of their
// equals less than this chance is turned away at the door.
const JOIN_CHANCE = 0.10;
// How many members a defeat singles out, the less fit likelier; Balanced and
// Aggressive targets are injured, Defensive ones fend it off.
const INJURED_PER_LOSS = 2;
// The pause between each loot roll post, for a little suspense.
const ROLL_DELAY_MS = 2000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STANCES = {
    aggressive: { label: 'Aggressive', multiplier: 1.15, restDays: 2, style: ButtonStyle.Danger },
    balanced: { label: 'Balanced', multiplier: 1, restDays: 1, style: ButtonStyle.Primary },
    defensive: { label: 'Defensive', multiplier: 0.9, restDays: 0, style: ButtonStyle.Success },
    // Fights at -20%, but on a win also makes off with a random piece of the
    // tier's rarity besides the boss's drops (see plunderFor).
    plunder: { label: 'Plunder', multiplier: 0.8, restDays: 2, style: ButtonStyle.Secondary },
};

const EMBED_COLOR = 0xd4af37; // heraldic gold
const DEFEAT_COLOR = 0x8b0000; // dark red

const pick = (lines, random = Math.random) => lines[Math.floor(random() * lines.length)];

// ---- pure rules ---------------------------------------------------------------

// Sum over every slot of the cheapest item of the tier's rarity in that
// slot (falling back to the tier's floor price for a slot with no such
// item), scaled by how much of a kit a party at that tier is assumed to
// have. Players build up gear slot by slot, so the low tiers are a little
// lenient: Easy assumes three-quarters of the slots filled with Common,
// Medium seven-eighths with Uncommon, Hard a full kit, and Extreme 85% of
// an Epic kit, since Epic gear is slow to gather.
const TIER_FLOOR = [10, 15, 25, 35, 50];
const TIER_COVERAGE = [0.75, 0.875, 1, 0.85, 1];

// The chance a party always loses at each tier, however overgeared. Easy and
// Medium have none, so a strong enough party is sure of the win; from Hard up
// no fight is ever a sure thing, and the harder the boss the bigger the risk.
const TIER_LOSS_FLOOR = [0, 0, 0.01, 0.03, 0.05];
const EXTREME_TIER = 3;
const MAX_TIER = 4;
const fullKitFor = (tier) => {
    const rarity = catalog.RARITIES[tier];
    return catalog.GEAR_SLOTS.reduce((sum, slot) => {
        const prices = catalog.GEAR.filter((e) => e.slot === slot && catalog.rarityFor(e.price) === rarity).map((e) => e.price);
        return sum + (prices.length ? Math.min(...prices) : TIER_FLOOR[tier]);
    }, 0);
};
const kitFitFor = (tier) => Math.round(fullKitFor(tier) * TIER_COVERAGE[tier]);
// A fit `share` of the way from a full Epic kit to a full Legendary one.
const epicToLegendary = (share) => Math.round(fullKitFor(EXTREME_TIER) + share * (fullKitFor(MAX_TIER) - fullKitFor(EXTREME_TIER)));
// Max sits a tenth of the way from a full Epic kit to a full Legendary one,
// so a party mostly in Epic gear has a fair shot and Legendary gear has the
// edge. The Herald himself (HERALD_FIT_PER_ENTRANT) is a flat 300 per member,
// about halfway from Epic to Legendary, so he is harder on paper than any
// Guardian and a court in full Epic needs its dream blessings.
const bossFitPerEntrant = (tier) => (tier === MAX_TIER ? epicToLegendary(0.1) : kitFitFor(tier));
const HERALD_FIT_PER_ENTRANT = 300;

// Chance (0-1) of a win, from party fit / boss fit, capped by the tier's
// loss floor. Without a tier, the uncapped curve (reaching 100% at 140%).
const winChance = (ratio, tier = null) => {
    const raw = ratio >= 1 ? Math.min(1, 0.8 + 0.5 * (ratio - 1)) : Math.max(0, 0.8 - 2 * (1 - ratio));
    return tier === null ? raw : Math.min(raw, 1 - TIER_LOSS_FLOOR[tier]);
};

// The tiers every server can roll: Easy, Medium, Hard and Extreme. The first
// Extreme win opens Max (see src/campaign.js); the real encounter rolls from
// the server's open tiers, weighted by TIER_WEIGHTS (percent): the hard
// fights are the common ones, and Max, once open, takes half of Extreme's
// share. Easy and Medium stay rare either way.
const OPEN_TIERS = [0, 1, 2, 3];
const TIER_WEIGHTS = {
    beforeMax: [5, 15, 40, 40],
    withMax: [5, 15, 40, 20, 20],
};
const rollTier = (random = Math.random, tiers = OPEN_TIERS) => {
    const table = tiers.includes(MAX_TIER) ? TIER_WEIGHTS.withMax : TIER_WEIGHTS.beforeMax;
    const weights = tiers.map((t) => table[t] || 0);
    const total = weights.reduce((a, b) => a + b, 0);
    if (!total) return tiers[Math.floor(random() * tiers.length)];
    let roll = random() * total;
    for (const [i, w] of weights.entries()) {
        if (roll < w) return tiers[i];
        roll -= w;
    }
    return tiers[tiers.length - 1];
};

// The party's win chance at `tier` from each member's { fit, stance } (no
// stance yet counts as Balanced).
const partyChance = (members, tier) => {
    if (!members.length) return 0;
    const power = members.reduce((sum, m) => sum + m.fit * STANCES[m.stance || 'balanced'].multiplier, 0);
    return winChance(power / (bossFitPerEntrant(tier) * members.length), tier);
};

// The least fit that lets a member join at `tier`: a party of their equals,
// all Balanced, would have at least JOIN_CHANCE. (A tiny epsilon keeps exactly
// 10% from rounding below it.)
const joinFitFor = (tier) => {
    const perEntrant = bossFitPerEntrant(tier);
    let fit = 0;
    while (winChance(fit / perEntrant, tier) < JOIN_CHANCE - 1e-9) fit++;
    return fit;
};

// After a loss, who the foe singles out: INJURED_PER_LOSS members, drawn
// without replacement with weight 1 / (fit + 10), so a member with half the
// fit of another is roughly twice as likely. The +10 keeps a fit of 0 from
// guaranteeing it. A Balanced or Aggressive target is injured; a Defensive
// one fends it off (restDays 0).
const pickTargets = (members, count = INJURED_PER_LOSS, random = Math.random) => {
    const pool = [...members];
    const targets = [];
    while (targets.length < count && pool.length) {
        const weights = pool.map((m) => 1 / (m.fit + 10));
        let roll = random() * weights.reduce((a, b) => a + b, 0);
        let k = 0;
        while (k < pool.length - 1 && (roll -= weights[k]) >= 0) k++;
        targets.push(pool.splice(k, 1)[0]);
    }
    return targets;
};

// The member who lands the killing blow, weighted by effective fit. If
// nobody has any fit, everyone has an equal chance.
// After a win, one random piece of `pool` (the tier's gear) per plunderer,
// never one of the boss's `drops`, and distinct from each other while the
// pool lasts. Returns [{ member, item }].
const plunderFor = (plunderers, pool, drops, random = Math.random) => {
    const fresh = pool.filter((e) => !drops.includes(e));
    if (!fresh.length) return [];
    let left = [...fresh];
    return plunderers.map((member) => {
        if (!left.length) left = [...fresh];
        return { member, item: left.splice(Math.floor(random() * left.length), 1)[0] };
    });
};

const pickKiller = (members, random = Math.random) => {
    const total = members.reduce((sum, m) => sum + m.effectiveFit, 0);
    if (total <= 0) return members[Math.floor(random() * members.length)];
    let roll = random() * total;
    for (const m of members) {
        roll -= m.effectiveFit;
        if (roll < 0) return m;
    }
    return members[members.length - 1];
};

/* Need/greed. `choices` is [{ userId, displayName, choice }] where choice
 * is 'need' or 'greed' (from lootChoices; 'pass' never rolls).
 * Returns { rounds: [[{ userId, displayName, choice, roll }]], winner } —
 * each round is one set of rolls; ties at the top re-roll among the tied —
 * or winner null if everyone passed.
 */
const rollLoot = (choices, random = Math.random) => {
    const needers = choices.filter((c) => c.choice === 'need');
    let contenders = needers.length ? needers : choices.filter((c) => c.choice === 'greed');
    if (!contenders.length) return { rounds: [], winner: null };

    const rounds = [];
    for (;;) {
        const round = contenders.map((c) => ({ ...c, roll: 1 + Math.floor(random() * 100) }));
        rounds.push(round);
        const top = Math.max(...round.map((r) => r.roll));
        const leaders = round.filter((r) => r.roll === top);
        if (leaders.length === 1) return { rounds, winner: leaders[0] };
        contenders = leaders;
    }
};

// YYYY-MM-DD plus n days.
const addDays = (day, n) => {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + n));
    return date.toISOString().slice(0, 10);
};

// "Saturday" for a YYYY-MM-DD.
const weekdayOf = (day) => {
    const [y, m, d] = day.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
};

const itemLabel = (item) => `[${catalog.rarityFor(item.price)}] ${item.name}`;
const percent = (chance) => `${Math.round(chance * 100)}%`;

// One line per member, cut short with "...and N more" past `limit` characters,
// so a big party stays inside Discord's limits: 1024 for a field, and 6000 for
// the whole result message.
const fieldValue = (lines, limit = 1024) => {
    let value = lines.join('\n');
    for (let shown = lines.length - 1; value.length > limit && shown > 0; shown--) {
        value = `${lines.slice(0, shown).join('\n')}\n*...and ${lines.length - shown} more*`;
    }
    return value;
};

// How each difficulty is described in the reveal: "a relatively ___ threat".
const THREAT_PHRASES = [
    'a relatively easy threat',
    'a moderate threat',
    'a formidable threat',
    'an extreme threat',
    'a threat of the very gravest kind',
];
const minutesLabel = (ms) => (ms % 3600000 === 0 ? `${ms / 3600000} hour${ms === 3600000 ? '' : 's'}` : `${Math.round(ms / 60000)} minutes`);

// ---- rendering ----------------------------------------------------------------

// "**Hard**, a formidable threat. Victory yields Rare loot."
const threatLine = (tier) => `**This day's threat: ${DIFFICULTIES[tier]}**, ${THREAT_PHRASES[tier]}. Victory yields ${catalog.RARITIES[tier]} loot.`;

const buildTeaserEmbed = (party, tier, maxParty, minParty, joinWindowMs, closed = false) => {
    const names = [...party.values()].map((m) => `${m.displayName}${m.stance ? ' - ready' : ''}`);
    const marches = [
        `${maxParty ? `Up to ${maxParty}` : 'All who wish'} may join, and the foe grows to match the party.`,
        minParty > 1 ? `At least ${minParty} must answer the call.` : '',
        maxParty ? `The party marches when ${maxParty} are ready, or after ${minutesLabel(joinWindowMs)}.` : `The party marches after ${minutesLabel(joinWindowMs)}.`,
    ].filter(Boolean).join(' ');
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(closed ? 'The Encounter: the party has marched' : 'The Encounter: a threat stirs')
        .setDescription(`${pick(flavor.encounterTeaserLines())}\n\n${threatLine(tier)}\n\nJoin the party and choose how thou wilt fight. ${marches} The foe's name is revealed only in battle.\n\n*Wish to be summoned the moment a threat stirs? Use /signup encounter!*`)
        .addFields({ name: `The Party (${party.size}${maxParty ? `/${maxParty}` : ''})`, value: names.length ? fieldValue(names) : '*No one yet.*' })
        .setTimestamp();
};

const joinRow = (prefix, disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${prefix}join`).setLabel('Join the party').setStyle(ButtonStyle.Success).setDisabled(disabled)
);

// A member's two kits: what they wear, and the finest they own (see bestKit).
// Both fits count the pet at their side (src/pets.js).
const kitsOf = (character = {}) => {
    const worn = character.gear || {};
    const best = bestKit(character);
    return { worn, best, wornFit: totalFit(worn, character), bestFit: totalFit(best, character), petFit: petBonus(character) };
};
// Whether the member fights in their best kit: only if they chose to, and it's
// actually finer than what they wear.
const suitsUp = (member) => Boolean(member.suitUp) && member.bestFit > member.wornFit;
const fightingFit = (member) => (suitsUp(member) ? member.bestFit : member.wornFit);

const buildPrompt = (prefix, member, tier) => {
    const stanceRow = new ActionRowBuilder().addComponents(
        Object.entries(STANCES).map(([key, s]) =>
            new ButtonBuilder().setCustomId(`${prefix}stance_${key}`).setLabel(`${s.label}${member.stance === key ? ' - chosen' : ''}`).setStyle(s.style)
        )
    );
    const stance = member.stance ? STANCES[member.stance].label : 'not chosen, so Balanced';
    const status = member.stance ? '\n\n**Thou art ready.** Change it until the battle begins.' : '';
    const components = [stanceRow];
    // Only offered when the bags hold something finer than what's worn. The
    // swap is for this fight alone: nothing is equipped, so the outfit a member
    // wears for show is never touched.
    let kitText = '';
    if (member.bestFit > member.wornFit) {
        const best = suitsUp(member);
        kitText = `\n\n**Thy gear:** ${best ? `thy finest, fit ${member.bestFit}` : `as thou art dressed, fit ${member.wornFit}`}\nThy bags hold finer arms than thou wearest. Shall the herald suit thee up in thy best for this fight, fit ${member.bestFit}? Thy wardrobe stays just as it is.`;
        components.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${prefix}kit_best`).setLabel(`Suit up in my best${best ? ' - chosen' : ''}`).setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`${prefix}kit_worn`).setLabel(`Fight as I am dressed${best ? '' : ' - chosen'}`).setStyle(ButtonStyle.Secondary),
        ));
    }
    return {
        content: `${flavor.encounterPromptLine()}\n\n${threatLine(tier)}\n**Thy stance:** ${stance}\nAggressive fights at +15% fit but risks two days' rest on a loss; Defensive at -10% but escapes unhurt; Balanced at thy true fit, one day's rest. Plunder fights at -20%, and on a victory thou makest off with a piece of the foe's hoard besides its drops, but if caught in a loss, two days' rest and nothing gained. If thou choosest nothing, thou fightest Balanced.${kitText}${status}`,
        components,
    };
};

// On the herald's roster warning: anyone in the party may withdraw.
const leaveRow = (prefix, disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${prefix}leave`).setLabel('Leave the party').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
);

// ---- phases ---------------------------------------------------------------------

// Gathers the party. Resolves with the Map of userId -> member when the window
// closes, or, with a maxParty, once the party is full and ready.
// Every checkIntervalMs the herald reckons the party's odds, and below
// WARN_CHANCE posts a warning with a "Leave the party" button.
const gatherParty = (g, channel, message, prefix, opts) =>
    new Promise((resolve) => {
        const { tier, maxParty, minParty, joinWindowMs, checkIntervalMs, persist, tag } = opts;
        const party = new Map();
        const refresh = () => message.edit({ embeds: [buildTeaserEmbed(party, tier, maxParty, minParty, joinWindowMs)] }).catch(() => {});
        const allReady = () => Boolean(maxParty) && party.size >= maxParty && [...party.values()].every((m) => m.stance);
        // Re-reads a member's kits (gear may have changed) and sets their fit
        // from their suit-up choice.
        const refreshKits = async (member) => {
            const character = await pointsStore.getCharacter(g.id, member.userId).catch(() => ({}));
            Object.assign(member, kitsOf(character));
            member.fit = fightingFit(member);
        };

        const collector = channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId.startsWith(prefix),
            time: joinWindowMs,
        });

        // The roster checks, at each interval strictly inside the window.
        const checks = [];
        for (let at = checkIntervalMs; at < joinWindowMs; at += checkIntervalMs) {
            checks.push(setTimeout(async () => {
                if (!party.size) return;
                const members = [...party.values()];
                for (const m of members) await refreshKits(m);
                const chance = partyChance(members, tier);
                console.log(`${tag}: roster check, ${members.length} in the party, ${percent(chance)} odds.`);
                if (chance >= WARN_CHANCE) return;
                const warning = await channel.send({
                    content: pick(flavor.encounterOutmatchedLines()),
                    components: [leaveRow(prefix, false)],
                }).catch((error) => console.error(`${tag}: failed to post the roster warning:`, error.message));
                if (warning) warnings.push(warning);
            }, at));
        }
        const warnings = [];

        collector.on('collect', async (interaction) => {
            if (interaction.user.bot) return;
            const action = interaction.customId.slice(prefix.length);
            const userId = interaction.user.id;

            if (action === 'leave') {
                const leaving = party.get(userId);
                if (!leaving) {
                    await interaction.reply({ content: 'Thou art not in the party, good noble.', flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                party.delete(userId);
                await interaction.reply({ content: 'Thou hast left the party, no shame in it. Thou mayest join again before it marches.', flags: MessageFlags.Ephemeral }).catch(() => {});
                await refresh();
                return;
            }

            if (action === 'join') {
                const existing = party.get(userId);
                if (existing) {
                    await interaction.reply({ ...buildPrompt(prefix, existing, tier), flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                if (maxParty && party.size >= maxParty) {
                    await interaction.reply({ content: 'The party is already full, good noble. Perhaps tomorrow!', flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                // Reserve the place before any await, so two quick clicks can't overfill the party.
                const member = { userId, displayName: interaction.member?.displayName || interaction.user.username, stance: null, suitUp: false };
                party.set(userId, member);
                // discord.js 14.13's deferReply ignores flags; only ephemeral: true hides it.
                await interaction.deferReply({ ephemeral: true }).catch(() => {});

                if (persist) {
                    const injuredUntil = await pointsStore.getInjury(g.id, userId).catch(() => null);
                    if (injuredUntil && easternDay() <= injuredUntil) {
                        party.delete(userId);
                        await interaction.editReply({ content: pick(flavor.encounterInjuredLines(weekdayOf(injuredUntil))) }).catch(() => {});
                        return;
                    }
                }
                // Too little gear to help a party at this tier, even suited up
                // in their best: turned away.
                await refreshKits(member);
                if (partyChance([{ fit: member.bestFit }], tier) < JOIN_CHANCE - 1e-9) {
                    party.delete(userId);
                    await interaction.editReply({ content: pick(flavor.encounterTooWeakLines(member.bestFit, DIFFICULTIES[tier])) }).catch(() => {});
                    return;
                }
                await interaction.editReply(buildPrompt(prefix, member, tier)).catch(() => {});
                await refresh();
                return;
            }

            const member = party.get(userId);
            if (!member) {
                await interaction.reply({ content: 'Join the party first, good noble.', flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }
            const wasReady = Boolean(member.stance);
            if (action.startsWith('stance_')) member.stance = action.slice('stance_'.length);
            if (action.startsWith('kit_')) {
                // Deferred first: the gear read can outlast Discord's 3 seconds.
                await interaction.deferUpdate().catch(() => {});
                member.suitUp = action === 'kit_best';
                await refreshKits(member);
                await interaction.editReply(buildPrompt(prefix, member, tier)).catch(() => {});
                return;
            }
            await interaction.update(buildPrompt(prefix, member, tier)).catch(() => {});
            if (!wasReady && member.stance) await refresh();
            if (allReady()) collector.stop('ready');
        });

        collector.on('end', () => {
            checks.forEach(clearTimeout);
            // The party has marched: no more leaving.
            warnings.forEach((w) => w.edit({ components: [leaveRow(prefix, true)] }).catch(() => {}));
            resolve(party);
        });
    });

/* Need or greed on the dropped item, decided by the herald for each member:
 * Need if it would be an upgrade, Greed otherwise. An upgrade means finer
 * than anything they own for the slot, worn or bagged, so dressing down for
 * show doesn't earn a Need, and an empty slot is always an upgrade. Gear is
 * read when the piece is rolled, after any earlier piece was granted. If a
 * member's gear can't be read, they greed.
 */
const lootChoices = (guildId, members, item) => Promise.all(members.map(async (m) => {
    const character = await pointsStore.getCharacter(guildId, m.userId).catch(() => null);
    const owned = character ? catalog.findEntry(bestKit(character)[item.slot]) : null;
    const upgrade = Boolean(character) && (!owned || owned.price < item.price);
    return { userId: m.userId, displayName: m.displayName, choice: upgrade ? 'need' : 'greed' };
}));

/* Drops each of `items` for the party and rolls for it, the herald needing
 * or greeding for everyone (lootChoices), then grants it, one piece at a
 * time, so a member who wins the first is checked against it for the
 * second. Shared by the encounter and the Herald's battle
 * (src/heraldBattle.js). `members` is [{ userId, displayName }];
 * `sourceName` names who dropped it, as in "Loot dropped from <sourceName>".
 * Each roll gets its own post, a beat apart, for a little suspense; then the
 * result lands in an embed styled like the loot post.
 */
const rollForLoot = async (g, channel, { members, items, sourceName, roundId, persist, rollDelayMs = ROLL_DELAY_MS, tag }) => {
    for (const [k, item] of items.entries()) {
        await channel.send({ embeds: [new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`Loot dropped from ${sourceName}, ${k + 1} of ${items.length}`)
            .setDescription(`${pick(flavor.encounterLootLines(itemLabel(item)))}\n\nSlot: ${item.slot}. The herald rolls for the whole party: **Need** for each member it would be an upgrade for, finer than anything they own for the slot, worn or in their bags, and **Greed** for the rest. If anyone needs, only the needers roll.`)
            .setTimestamp()] });
        const choices = await lootChoices(g.id, members, item);
        const { rounds, winner } = rollLoot(choices);
        const recordLoot = (result) => recordHistory('loot', {
            guildId: g.id,
            encounterId: roundId,
            rehearsal: !persist,
            item: item.id,
            slot: item.slot,
            price: item.price,
            choices: choices.map((c) => ({ userId: c.userId, name: c.displayName, choice: c.choice })),
            rolls: JSON.stringify(rounds),
            winnerId: winner ? winner.userId : null,
            result,
        });

        if (rounds.length) {
            await channel.send(`The dice are cast for **${itemLabel(item)}**...`);
            for (let i = 0; i < rounds.length; i++) {
                if (i) {
                    await delay(rollDelayMs);
                    await channel.send(`A tie at the top! **Re-roll** between ${rounds[i].map((r) => r.displayName).join(' and ')}...`);
                }
                for (const r of rounds[i]) {
                    await delay(rollDelayMs);
                    await channel.send(`${r.displayName} rolls **${r.roll}** for ${r.choice === 'need' ? 'Need' : 'Greed'}.`);
                }
            }
            await delay(rollDelayMs);
        }

        // Who rolled what, needs first, skipping an empty group.
        const footnotes = [['need', 'Need'], ['greed', 'Greed']]
            .map(([key, label]) => [label, choices.filter((c) => c.choice === key).map((c) => c.displayName)])
            .filter(([, names]) => names.length)
            .map(([label, names]) => `**${label}:** ${names.join(', ')}`);
        if (footnotes.length) footnotes.unshift('');

        const resultEmbed = new EmbedBuilder().setColor(EMBED_COLOR).setTimestamp();

        if (!winner) {
            console.log(`${tag}: everyone passed on ${item.name}.`);
            recordLoot('passed');
            resultEmbed
                .setTitle(`Loot left behind: ${itemLabel(item)}`)
                .setDescription([pick(flavor.encounterLootAllPassedLines(itemLabel(item))), ...footnotes].join('\n'));
            await channel.send({ embeds: [resultEmbed] });
            continue;
        }

        let result = 'skipped';
        if (persist) {
            result = await pointsStore.grantGear(g.id, winner.userId, winner.displayName, item.id, item.slot).catch((error) => {
                console.error(`${tag}: failed to grant loot:`, error.message);
                return 'failed';
            });
        }
        console.log(`${tag}: ${winner.displayName} (${winner.userId}) won ${item.name} (${result}).`);
        const granted = result === 'equipped' || result === 'bagged';
        recordLoot(result);
        const note = !persist ? '*A rehearsal: the loot was not truly granted.*' : result === 'equipped' ? 'It is equipped at once.' : 'It goes to their bag.';
        resultEmbed
            .setTitle(`Loot awarded: ${itemLabel(item)}`)
            .setDescription([`${pick(flavor.encounterLootWonLines(winner.displayName, itemLabel(item)))} ${note}`, ...footnotes].join('\n'));
        await channel.send({ embeds: [resultEmbed] });
        if (granted) {
            const member = { userId: winner.userId, displayName: winner.displayName };
            await achievements.record(g.id, [{ ...member, counts: { loot: 1 } }], channel);
            await achievements.checkStats(g.id, [member], channel);
        }
    }
};

// ---- one encounter ------------------------------------------------------------

const runEncounterIn = async (g, channel, opts) => {
    const { maxParty, minParty, joinWindowMs, rollDelayMs, persist, runLabel } = opts;
    const tag = `Encounter (${runLabel}) (guild ${g.id})`;
    const roundId = crypto.randomBytes(4).toString('hex');
    const prefix = `enc_${roundId}_`;
    // Rolled up front and announced, so members choose whether to answer. The
    // real encounter rolls from the tiers this server has opened (src/campaign.js).
    let tier = opts.tier;
    if (tier === undefined || tier === null) {
        const open = persist ? await campaign.openTiers(g.id).catch((error) => {
            console.error(`${tag}: could not read the campaign; rolling the base tiers:`, error.message);
            return OPEN_TIERS;
        }) : OPEN_TIERS;
        tier = rollTier(Math.random, open);
    }

    // Only the real scheduled encounter pings the Adventurers; a rehearsal doesn't.
    const role = persist ? findAdventurerRole(g) : null;
    const message = await channel.send({
        content: role ? `<@&${role.id}> A threat stirs! To arms!` : undefined,
        embeds: [buildTeaserEmbed(new Map(), tier, maxParty, minParty, joinWindowMs)],
        components: [joinRow(prefix, false)],
        allowedMentions: { roles: role ? [role.id] : [] },
    });
    console.log(`${tag}: posted, ${DIFFICULTIES[tier]}, party ${maxParty ? `up to ${maxParty}` : 'unlimited'}, join window ${joinWindowMs / 60000}m.`);

    const party = await gatherParty(g, channel, message, prefix, { ...opts, tier, tag });
    await message.edit({ embeds: [buildTeaserEmbed(party, tier, maxParty, minParty, joinWindowMs, true)], components: [joinRow(prefix, true)] }).catch(() => {});

    // Everyone who joined fights. A stance left unchosen is Balanced.
    const ready = [...party.values()];
    for (const m of ready) {
        if (!m.stance) m.stance = 'balanced';
    }
    if (!ready.length) {
        console.log(`${tag}: no one joined; the threat passes.`);
        await channel.send(pick(flavor.encounterNoPartyLines()));
        return;
    }
    // Too few to march: no battle, no injuries.
    if (ready.length < minParty) {
        console.log(`${tag}: only ${ready.length} joined, fewer than ${minParty}; the threat passes.`);
        await channel.send({ content: pick(flavor.encounterTooFewLines(ready.map((m) => m.displayName), minParty)), allowedMentions: { parse: [] } });
        return;
    }

    // Fit is read at battle time, so gear changed during the join window counts.
    // A member who chose to suit up fights in their finest kit; their stored
    // gear is never changed, but the fight is recorded as if they wore it.
    for (const m of ready) {
        const character = await pointsStore.getCharacter(g.id, m.userId).catch(() => ({ gear: {} }));
        Object.assign(m, kitsOf(character));
        m.suitedUp = suitsUp(m);
        m.gear = m.suitedUp ? m.best : m.worn;
        m.title = (catalog.findEntry(character.title) || {}).name || null;
        m.className = (catalog.findEntry(character.class) || catalog.DEFAULT_CLASS).name;
        m.fit = Math.max(0, fitScore(m.gear) + m.petFit);
        m.effectiveFit = m.fit * STANCES[m.stance].multiplier;
    }

    const boss = pick(BOSSES[tier]);
    const bossFit = bossFitPerEntrant(tier) * ready.length;
    const partyFit = ready.reduce((sum, m) => sum + m.effectiveFit, 0);
    const chance = winChance(bossFit ? partyFit / bossFit : 1, tier);
    const won = Math.random() < chance;
    // A defeat singles out INJURED_PER_LOSS members, the less fit likelier;
    // the Defensive among them fend it off, the rest are injured.
    const targets = won ? [] : pickTargets(ready);
    const injured = targets.filter((m) => STANCES[m.stance].restDays > 0);
    console.log(`${tag}: ${ready.length} fought ${boss.name} (${DIFFICULTIES[tier]}), party ${Math.round(partyFit)} vs boss ${bossFit}, ${percent(chance)} odds, ${won ? 'won' : 'lost'}.`);

    // The mightiest party ever assembled, win or lose, is a myth (see /myths),
    // measured by average power per member so a big party doesn't win by
    // numbers alone. Kept under its own key: the old 'party' record held
    // total power, which isn't comparable.
    if (persist) {
        await pointsStore.setMythIfHigher(g.id, 'party_average', Math.round(partyFit / ready.length), {
            size: ready.length,
            power: Math.round(partyFit),
            members: ready.map((m) => m.displayName),
            boss: boss.name,
            difficulty: DIFFICULTIES[tier],
            won,
            day: easternDay(),
        }).catch((error) => console.error(`${tag}: failed to record the party myth:`, error.message));
    }

    // The result is two embeds in one message: the battle (who fought, and
    // how well equipped they were) and the outcome, with the party's total fit
    // and power, but not the boss's. The party is listed by name, title and
    // class. No one's own fit is shown. Stances are only revealed on a
    // loss, by the injuries; on a win they stay secret, though they still
    // count, since the killing blow is weighted by stance-adjusted fit.
    const lines = ready.map((m) => `**${m.displayName}**${m.title ? `, ${m.title}` : ''} - ${m.className}`);

    // How the party's plain gear (not stance-adjusted, so stances stay secret)
    // measured up against the boss.
    const gearRatio = bossFit ? ready.reduce((sum, m) => sum + m.fit, 0) / bossFit : 1;
    const matchup = gearRatio > 1.1 ? 'exceptional' : gearRatio >= 0.9 ? 'appropriate' : 'outmatched';

    // The whole fight goes into the history log (src/historyLog.js): the boss,
    // the odds and the outcome, and each member's stance, fit, power (fit
    // after the stance multiplier) and the gear they wore. Loot rolls are
    // recorded separately under the same encounterId. Records from before the
    // tier was rolled also carry each member's difficulty vote.
    const recordEncounter = (killer) => recordHistory('encounter', {
        guildId: g.id,
        encounterId: roundId,
        rehearsal: !persist,
        boss: boss.name,
        difficulty: DIFFICULTIES[tier],
        bossFit,
        partyFit: ready.reduce((sum, m) => sum + m.fit, 0),
        power: Math.round(partyFit),
        chance: Math.round(chance * 1000) / 1000,
        matchup,
        won,
        killerId: killer ? killer.userId : null,
        members: ready.map((m) => ({
            userId: m.userId,
            name: m.displayName,
            stance: m.stance,
            fit: m.fit,
            power: Math.round(m.effectiveFit),
            gear: m.gear,
            suitedUp: m.suitedUp,
            injuryDays: injured.includes(m) ? STANCES[m.stance].restDays : 0,
        })),
    });

    const battleEmbed = new EmbedBuilder()
        .setColor(won ? EMBED_COLOR : DEFEAT_COLOR)
        .setTitle(`The Encounter: ${boss.name}`)
        .setDescription(pick(flavor.encounterRevealLines(boss, THREAT_PHRASES[tier])))
        .addFields(
            { name: 'The Party', value: fieldValue(lines) },
            { name: 'The Odds', value: pick(flavor.encounterMatchupLines[matchup](boss)) }
        );

    // The party's totals. Only totals, so each member's stance stays secret
    // on a win, and never the boss's, so the foe's strength stays a mystery.
    const tally = [
        `**Party fit:** ${ready.reduce((sum, m) => sum + m.fit, 0)}`,
        `**Party power:** ${Math.round(partyFit)}`,
    ].join('\n');
    const outcomeEmbed = new EmbedBuilder()
        .setColor(won ? EMBED_COLOR : DEFEAT_COLOR)
        .addFields({ name: 'The Tally', value: tally })
        .setTimestamp();

    if (!won) {
        // The targets each get a line: the injured their wounds, a Defensive
        // target how they fended it off. Everyone else simply escapes, so
        // their stances stay secret.
        const injuries = [];
        for (const m of targets) {
            const days = STANCES[m.stance].restDays;
            injuries.push(pick(flavor.encounterInjuryLines[m.stance](m.displayName, days)));
            if (persist && days) {
                await pointsStore.setInjury(g.id, m.userId, addDays(easternDay(), days)).catch((error) =>
                    console.error(`${tag}: failed to record an injury:`, error.message)
                );
            }
        }
        const unhurt = ready.filter((m) => !targets.includes(m)).map((m) => m.displayName);
        if (unhurt.length) {
            const names = unhurt.length === 1 ? unhurt[0] : `${unhurt.slice(0, -1).join(', ')} and ${unhurt[unhurt.length - 1]}`;
            injuries.push(pick(flavor.encounterUnhurtLines(names)));
        }
        outcomeEmbed
            .setTitle('Defeat')
            // An exceptionally geared party that still lost was simply unlucky.
            .setDescription(`${pick(matchup === 'exceptional' ? flavor.encounterUnluckyLossLines(boss) : flavor.encounterDefeatLines(boss))}\n\n${fieldValue(injuries, 3000)}${persist ? '' : '\n\n*A rehearsal: no injuries were truly suffered.*'}`);
        recordEncounter(null);
        await channel.send({ embeds: [battleEmbed, outcomeEmbed] });
        // A plunderer the foe singled out was caught red-handed.
        const caught = targets.filter((m) => m.stance === 'plunder');
        if (persist && caught.length) {
            await achievements.record(g.id, caught.map((m) => ({ userId: m.userId, displayName: m.displayName, counts: { plunder_caught: 1 } })), channel);
        }
        return;
    }

    const killer = pickKiller(ready);
    recordEncounter(killer);
    outcomeEmbed
        .setTitle('Victory!')
        // An outmatched party that still won caught a lucky break.
        .setDescription(`${pick(matchup === 'outmatched' ? flavor.encounterLuckyWinLines(boss) : flavor.encounterVictoryLines())} ${pick(flavor.encounterKillingBlowLines(killer.displayName, boss))}`);
    await channel.send({ embeds: [battleEmbed, outcomeEmbed] });

    // Achievements: everyone in the party won at this tier, maybe as the
    // underdogs or as a full party; the killer was the hero.
    if (persist) {
        const shared = {
            encounter_wins: 1,
            [achievements.tierCounter(DIFFICULTIES[tier])]: 1,
            ...(matchup === 'outmatched' ? { lucky_wins: 1 } : {}),
            ...(ready.length >= FULL_PARTY ?{ full_party_wins: 1 } : {}),
        };
        await achievements.record(g.id, ready.map((m) => ({
            userId: m.userId,
            displayName: m.displayName,
            counts: { ...shared, ...(m === killer ? { heroics: 1 } : {}) },
        })), channel);

        // The server's first Extreme win opens Max, and its first Max win
        // starts the lore drops (src/campaign.js).
        const milestone = await campaign.recordWin(g.id, tier).catch((error) => {
            console.error(`${tag}: failed to record the campaign milestone:`, error.message);
            return null;
        });
        if (milestone && milestone.opened !== undefined) {
            await channel.send(pick(flavor.encounterTierOpenedLines(DIFFICULTIES[milestone.opened])));
        } else if (milestone && milestone.loreBegins) {
            await channel.send(pick(flavor.encounterFirstMaxLines()));
        }
    }

    // Loot: dropsFor(party size) distinct random pieces of the tier's rarity, each
    // rolled for separately but all open at once in the same loot window.
    const rarity = catalog.RARITIES[tier];
    const pool = catalog.GEAR.filter((e) => catalog.rarityFor(e.price) === rarity && catalog.GEAR_SLOTS.includes(e.slot));
    const items = [];
    const remaining = [...pool];
    for (let k = 0; k < dropsFor(ready.length) && remaining.length; k++) {
        items.push(remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]);
    }

    // Plunder: each Plunder member makes off with their own piece, announced
    // before the boss's drops are rolled for.
    const plunderers = ready.filter((m) => m.stance === 'plunder');
    const plundered = plunderFor(plunderers, pool, items);
    if (plundered.length) {
        const lines = [];
        for (const { member, item } of plundered) {
            let result = 'skipped';
            if (persist) {
                result = await pointsStore.grantGear(g.id, member.userId, member.displayName, item.id, item.slot).catch((error) => {
                    console.error(`${tag}: failed to grant plunder:`, error.message);
                    return 'failed';
                });
            }
            console.log(`${tag}: ${member.displayName} (${member.userId}) plundered ${item.name} (${result}).`);
            recordHistory('loot', {
                guildId: g.id,
                encounterId: roundId,
                rehearsal: !persist,
                item: item.id,
                slot: item.slot,
                price: item.price,
                plunder: true,
                winnerId: member.userId,
                result,
            });
            const note = !persist ? '' : result === 'equipped' ? ' It is equipped at once.' : result === 'bagged' ? ' It goes to their bag.' : '';
            lines.push(`${pick(flavor.encounterPlunderLines(member.displayName, itemLabel(item)))}${note}`);
            if (result === 'equipped' || result === 'bagged') {
                const entry = { userId: member.userId, displayName: member.displayName };
                await achievements.record(g.id, [{ ...entry, counts: { loot: 1, plunders: 1 } }], channel);
                await achievements.checkStats(g.id, [entry], channel);
            }
        }
        await channel.send({
            embeds: [new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle(`Plunder from ${boss.name}'s hoard`)
                .setDescription(`${fieldValue(lines, 3800)}${persist ? '' : '\n\n*A rehearsal: the plunder was not truly granted.*'}`)
                .setTimestamp()],
            allowedMentions: { parse: [] },
        });
    }

    await rollForLoot(g, channel, { members: ready, items, sourceName: boss.name, roundId, persist, rollDelayMs, tag });
};

/* Run one encounter.
 * options:
 *   guild, targetChannel - as the other games (default: every guild, its channel)
 *   persist      - record injuries and grant loot (default: false)
 *   tier         - the difficulty, 0 (Easy) to 4 (Max) (default: rolled from OPEN_TIERS)
 *   maxParty     - most members who can join (default MAX_PARTY, 20)
 *   minParty     - fewest who can fight (default MIN_PARTY, 3)
 *   joinWindowMs - how long the party can form (default 3 hours)
 *   checkIntervalMs - how often the forming party's odds are checked (default 15 minutes)
 *   rollDelayMs  - pause between loot roll posts (default 2 seconds)
 *   runLabel     - tags log lines (default: "scheduled" if persist, else "preview")
 */
const runEncounter = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        tier = null,
        maxParty = MAX_PARTY,
        minParty = MIN_PARTY,
        joinWindowMs = JOIN_WINDOW_MS,
        checkIntervalMs = CHECK_INTERVAL_MS,
        rollDelayMs = ROLL_DELAY_MS,
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    await Promise.all(guilds.map(async (g) => {
        try {
            const channel = targetChannel || await resolveChannel(g, 'encounter', findAnnounceChannel);
            if (!channel) {
                console.log(`Encounter: no channel the herald can post in found in "${g.name}"; skipping.`);
                return;
            }
            await runEncounterIn(g, channel, { tier, maxParty, minParty, joinWindowMs, checkIntervalMs, rollDelayMs, persist, runLabel });
        } catch (error) {
            console.error(`Encounter failed for guild "${g.name}":`, error);
        }
    }));
};

module.exports = {
    runEncounter,
    rollForLoot,
    kitsOf,
    fieldValue,
    itemLabel,
    minutesLabel,
    delay,
    MAX_TIER,
    ROLL_DELAY_MS,
    bossFitPerEntrant,
    HERALD_FIT_PER_ENTRANT,
    winChance,
    TIER_COVERAGE,
    TIER_LOSS_FLOOR,
    OPEN_TIERS,
    rollTier,
    plunderFor,
    partyChance,
    joinFitFor,
    pickTargets,
    WARN_CHANCE,
    JOIN_CHANCE,
    INJURED_PER_LOSS,
    pickKiller,
    rollLoot,
    lootChoices,
    addDays,
    STANCES,
    JOIN_WINDOW_MS,
    LOOT_RESOLVE_MS,
    MIN_PARTY,
    MAX_PARTY,
    FULL_PARTY,
    ADVENTURERS_PER_DROP,
    dropsFor,
};
