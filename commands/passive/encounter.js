/* Passive behavior: the daily boss encounter.
 *
 * Once a day (placed by src/dailyLineup.js so it never overlaps the trivia,
 * puzzle or shop), the Herald announces that an unnamed threat stirs. Members
 * click "Join the party" (up to maxParty, 5 by default) and are immediately
 * prompted, privately, for two choices:
 *   1. a difficulty vote: Easy, Medium, Hard, Extreme or Max, and
 *   2. a stance: Aggressive (fit x1.15), Balanced (x1) or Defensive (x0.85).
 * Both stay secret and can be changed until the battle, which starts as soon
 * as the party is full and everyone has chosen, or when JOIN_WINDOW_MS runs
 * out — then whoever has finished both choices fights; anyone who joined but
 * didn't finish is left behind.
 *
 * The battle:
 *   - The difficulty is the average of the votes (Easy=0 .. Max=4), rounded,
 *     and a random boss from that tier (encounterBosses.js) is revealed.
 *   - Boss fit = (the cheapest gear price of that tier's rarity in each slot,
 *     summed over all slots) x that tier's assumed kit coverage x party
 *     size. Coverage is 1/2 for Easy (half the slots in Common), 3/4 for
 *     Medium, and a full kit from Hard up (see TIER_COVERAGE), since players
 *     fill slots gradually.
 *   - Party fit = each member's equipped fit (read at battle time) x their
 *     stance multiplier, summed.
 *   - Win chance comes from the ratio party/boss (see winChance): 80% at an
 *     even match, +5% per 10% over, -20% per 10% under (0% at 60%), capped
 *     per tier so there's always some risk (TIER_LOSS_FLOOR: Easy 98%,
 *     Medium 97%, Hard 95%, Extreme 93%, Max 90%).
 * On a win, one member lands the killing blow — weighted by each member's
 * effective (stance-adjusted) fit — and the boss drops DROPS_PER_WIN (2)
 * different random pieces of gear of the tier's rarity. For each piece, party
 * members choose Need, Greed or Pass within LOOT_WINDOW_MS (or until all have
 * chosen): if anyone needs, only the
 * needers roll 1-100; otherwise the greeders do; passes never roll; ties at
 * the top re-roll. The winner gets the item the same way as a /buy — into an
 * empty slot, else the bag.
 * On a loss, each member's stance decides their injury: Defensive walks away
 * unhurt, Balanced must sit out the next day, Aggressive the next two
 * (REST_DAYS). An injured member can't join an encounter until it passes.
 * Injuries persist in DynamoDB (pointsStore.getInjury/setInjury); the
 * encounter itself lives in memory, like the other games.
 *
 * A manual /encounter_test defaults to persist: false: no injuries are
 * recorded, no loot is granted, and injuries don't block joining.
 *
 * Exposes:
 *   runEncounter(client, opts) - runs one encounter; called by src/dailyLineup.js
 *   and the pure rules, exported for the tests and the fairness table:
 *   bossFitPerEntrant(tier), winChance(ratio, tier), resolveTier(votes),
 *   pickKiller(members, random), rollLoot(choices, random), addDays(day, n)
 */

const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { findAdventurerRole } = require('../../src/adventurerRole');
const { fitScore } = require('../../src/character');
const catalog = require('./shopCatalog');
const { easternDay } = require('./shop');
const { DIFFICULTIES, BOSSES } = require('./encounterBosses');
const flavor = require('../../flavor_text');

const JOIN_WINDOW_MS = 60 * 60 * 1000;
const LOOT_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX_PARTY = 5;
const DROPS_PER_WIN = 2;

const STANCES = {
    aggressive: { label: 'Aggressive', multiplier: 1.15, restDays: 2, style: ButtonStyle.Danger },
    balanced: { label: 'Balanced', multiplier: 1, restDays: 1, style: ButtonStyle.Primary },
    defensive: { label: 'Defensive', multiplier: 0.85, restDays: 0, style: ButtonStyle.Success },
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
// Medium seven-eighths with Uncommon, and from Hard up a full kit.
const TIER_FLOOR = [10, 15, 25, 35, 50];
const TIER_COVERAGE = [0.75, 0.875, 1, 1, 1];

// The chance a party always loses at each tier, however overgeared — so no
// fight is ever a sure thing, and the harder the boss the bigger the risk.
const TIER_LOSS_FLOOR = [0.02, 0.03, 0.05, 0.07, 0.10];
const bossFitPerEntrant = (tier) => {
    const rarity = catalog.RARITIES[tier];
    const fullKit = catalog.GEAR_SLOTS.reduce((sum, slot) => {
        const prices = catalog.GEAR.filter((e) => e.slot === slot && catalog.rarityFor(e.price) === rarity).map((e) => e.price);
        return sum + (prices.length ? Math.min(...prices) : TIER_FLOOR[tier]);
    }, 0);
    return Math.round(fullKit * TIER_COVERAGE[tier]);
};

// Chance (0-1) of a win, from party fit / boss fit, capped by the tier's
// loss floor. Without a tier, the uncapped curve (reaching 100% at 140%).
const winChance = (ratio, tier = null) => {
    const raw = ratio >= 1 ? Math.min(1, 0.8 + 0.5 * (ratio - 1)) : Math.max(0, 0.8 - 2 * (1 - ratio));
    return tier === null ? raw : Math.min(raw, 1 - TIER_LOSS_FLOOR[tier]);
};

// Average of the tier votes (0-4), rounded (a .5 rounds up, to the harder tier).
const resolveTier = (votes) => Math.round(votes.reduce((a, b) => a + b, 0) / votes.length);

// The member who lands the killing blow, weighted by effective fit. If
// nobody has any fit, everyone has an equal chance.
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

/* Need/greed/pass. `choices` is [{ userId, displayName, choice }] where choice
 * is 'need', 'greed' or 'pass' (missing choices should already be 'pass').
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
const minutesLabel = (ms) => (ms % 3600000 === 0 ? `${ms / 3600000} hour${ms === 3600000 ? '' : 's'}` : `${Math.round(ms / 60000)} minutes`);

// ---- rendering ----------------------------------------------------------------

const buildTeaserEmbed = (party, maxParty, joinWindowMs, closed = false) => {
    const names = [...party.values()].map((m) => `${m.displayName}${m.vote !== null && m.stance ? ' (ready)' : ''}`);
    return new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(closed ? 'The Encounter: the party has marched' : 'The Encounter: a threat stirs')
        .setDescription(`${pick(flavor.encounterTeaserLines())}\n\nJoin the party and choose thy destiny: how grand a challenge to embark upon, and how thou wilt fight it. The party marches when ${maxParty} are ready, or after ${minutesLabel(joinWindowMs)}. The foe's name is revealed only in battle.\n\n*Wish to be summoned the moment a threat stirs? Use /adventurer_signup!*`)
        .addFields({ name: `The Party (${party.size}/${maxParty})`, value: names.length ? names.join('\n') : '*No one yet.*' })
        .setTimestamp();
};

const joinRow = (prefix, disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${prefix}join`).setLabel('Join the party').setStyle(ButtonStyle.Success).setDisabled(disabled)
);

const buildPrompt = (prefix, member) => {
    const voteRow = new ActionRowBuilder().addComponents(
        DIFFICULTIES.map((label, i) =>
            new ButtonBuilder().setCustomId(`${prefix}vote_${i}`).setLabel(label).setStyle(member.vote === i ? ButtonStyle.Success : ButtonStyle.Primary)
        )
    );
    const stanceRow = new ActionRowBuilder().addComponents(
        Object.entries(STANCES).map(([key, s]) =>
            new ButtonBuilder().setCustomId(`${prefix}stance_${key}`).setLabel(`${s.label}${member.stance === key ? ' (chosen)' : ''}`).setStyle(s.style)
        )
    );
    const vote = member.vote === null ? 'not chosen' : DIFFICULTIES[member.vote];
    const stance = member.stance ? STANCES[member.stance].label : 'not chosen';
    const status = member.vote !== null && member.stance ? '\n\n**Thou art ready.** Change either until the battle begins.' : '';
    return {
        content: `${flavor.encounterPromptLine()}\n\n**Thy chosen challenge:** ${vote}\n**Stance:** ${stance}\nAggressive fights at +15% fit but risks two days' rest on a loss; Defensive at -15% but escapes unhurt; Balanced at thy true fit, one day's rest.${status}`,
        components: [voteRow, stanceRow],
    };
};

const lootRow = (prefix, disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${prefix}need`).setLabel('Need').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`${prefix}greed`).setLabel('Greed').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`${prefix}pass`).setLabel('Pass').setStyle(ButtonStyle.Danger).setDisabled(disabled),
);

// ---- phases ---------------------------------------------------------------------

// Gathers the party. Resolves with the Map of userId -> member once the party
// is full and ready, or the window closes.
const gatherParty = (g, channel, message, prefix, opts) =>
    new Promise((resolve) => {
        const { maxParty, joinWindowMs, persist } = opts;
        const party = new Map();
        const refresh = () => message.edit({ embeds: [buildTeaserEmbed(party, maxParty, joinWindowMs)] }).catch(() => {});
        const allReady = () => party.size >= maxParty && [...party.values()].every((m) => m.vote !== null && m.stance);

        const collector = channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.customId.startsWith(prefix),
            time: joinWindowMs,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.bot) return;
            const action = interaction.customId.slice(prefix.length);
            const userId = interaction.user.id;

            if (action === 'join') {
                const existing = party.get(userId);
                if (existing) {
                    await interaction.reply({ ...buildPrompt(prefix, existing), flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                if (party.size >= maxParty) {
                    await interaction.reply({ content: 'The party is already full, good noble. Perhaps tomorrow!', flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                // Reserve the place before any await, so two quick clicks can't overfill the party.
                const member = { userId, displayName: interaction.member?.displayName || interaction.user.username, vote: null, stance: null };
                party.set(userId, member);
                await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => {});

                if (persist) {
                    const injuredUntil = await pointsStore.getInjury(g.id, userId).catch(() => null);
                    if (injuredUntil && easternDay() <= injuredUntil) {
                        party.delete(userId);
                        await interaction.editReply({ content: pick(flavor.encounterInjuredLines(weekdayOf(injuredUntil))) }).catch(() => {});
                        return;
                    }
                }
                await interaction.editReply(buildPrompt(prefix, member)).catch(() => {});
                await refresh();
                return;
            }

            const member = party.get(userId);
            if (!member) {
                await interaction.reply({ content: 'Join the party first, good noble.', flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }
            const wasReady = member.vote !== null && member.stance;
            if (action.startsWith('vote_')) member.vote = Number(action.slice('vote_'.length));
            else if (action.startsWith('stance_')) member.stance = action.slice('stance_'.length);
            await interaction.update(buildPrompt(prefix, member)).catch(() => {});
            if (!wasReady && member.vote !== null && member.stance) await refresh();
            if (allReady()) collector.stop('ready');
        });

        collector.on('end', () => resolve(party));
    });

// Need/greed/pass on the dropped item. Resolves with the choices.
const collectLoot = (message, members, lootWindowMs, prefix) =>
    new Promise((resolve) => {
        const choices = new Map();
        const memberIds = new Set(members.map((m) => m.userId));
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: lootWindowMs });

        collector.on('collect', async (interaction) => {
            if (!memberIds.has(interaction.user.id)) {
                await interaction.reply({ content: 'These spoils belong to the party that won them.', flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }
            const choice = interaction.customId.slice(prefix.length);
            choices.set(interaction.user.id, choice);
            await interaction.reply({ content: `Thou hast chosen **${choice}**. Thou mayest change it until the rolls.`, flags: MessageFlags.Ephemeral }).catch(() => {});
            if (choices.size === memberIds.size) collector.stop('all');
        });

        collector.on('end', () => resolve(members.map((m) => ({ userId: m.userId, displayName: m.displayName, choice: choices.get(m.userId) || 'pass' }))));
    });

// ---- one encounter ------------------------------------------------------------

const runEncounterIn = async (g, channel, opts) => {
    const { maxParty, joinWindowMs, lootWindowMs, persist, runLabel } = opts;
    const tag = `Encounter (${runLabel}) (guild ${g.id})`;
    const roundId = crypto.randomBytes(4).toString('hex');
    const prefix = `enc_${roundId}_`;

    // Only the real scheduled encounter pings the Adventurers; a rehearsal doesn't.
    const role = persist ? findAdventurerRole(g) : null;
    const message = await channel.send({
        content: role ? `<@&${role.id}> A threat stirs! To arms!` : undefined,
        embeds: [buildTeaserEmbed(new Map(), maxParty, joinWindowMs)],
        components: [joinRow(prefix, false)],
        allowedMentions: { roles: role ? [role.id] : [] },
    });
    console.log(`${tag}: posted, party up to ${maxParty}, join window ${joinWindowMs / 60000}m.`);

    const party = await gatherParty(g, channel, message, prefix, opts);
    await message.edit({ embeds: [buildTeaserEmbed(party, maxParty, joinWindowMs, true)], components: [joinRow(prefix, true)] }).catch(() => {});

    const ready = [...party.values()].filter((m) => m.vote !== null && m.stance);
    if (!ready.length) {
        console.log(`${tag}: no one ready; the threat passes.`);
        await channel.send(pick(flavor.encounterNoPartyLines()));
        return;
    }

    // Fit is read at battle time, so gear changed during the join window counts.
    for (const m of ready) {
        const character = await pointsStore.getCharacter(g.id, m.userId).catch(() => ({ gear: {} }));
        m.fit = fitScore(character.gear);
        m.effectiveFit = m.fit * STANCES[m.stance].multiplier;
    }

    const tier = resolveTier(ready.map((m) => m.vote));
    const boss = pick(BOSSES[tier]);
    const bossFit = bossFitPerEntrant(tier) * ready.length;
    const partyFit = ready.reduce((sum, m) => sum + m.effectiveFit, 0);
    const chance = winChance(bossFit ? partyFit / bossFit : 1, tier);
    const won = Math.random() < chance;
    console.log(`${tag}: ${ready.length} fought ${boss.name} (${DIFFICULTIES[tier]}), party ${Math.round(partyFit)} vs boss ${bossFit}, ${percent(chance)} odds, ${won ? 'won' : 'lost'}.`);

    const left = party.size - ready.length;
    // Stances are only revealed on a loss, where they explain the injuries. On
    // a win they stay secret — but still count, since the killing blow is
    // weighted by stance-adjusted fit — so neither the stance nor the adjusted
    // fit (which would give it away) is shown.
    const lines = ready.map((m) => {
        if (won) return `${pick(flavor.encounterWinMemberLines(m.displayName))} *(fit ${m.fit}, voted ${DIFFICULTIES[m.vote]})*`;
        const stance = STANCES[m.stance];
        return `${pick(flavor.encounterStanceLines[m.stance](m.displayName))} *(${stance.label}, fit ${m.fit} → ${Math.round(m.effectiveFit)}, voted ${DIFFICULTIES[m.vote]})*`;
    });

    const embed = new EmbedBuilder()
        .setColor(won ? EMBED_COLOR : DEFEAT_COLOR)
        .setTitle(`The Encounter: ${boss.name} — ${won ? 'Victory!' : 'Defeat'}`)
        .setDescription(pick(flavor.encounterRevealLines(boss, DIFFICULTIES[tier])))
        .addFields(
            { name: 'The Party', value: lines.join('\n') },
            // On a win the stance-adjusted total and the exact odds would give
            // stances away, so only the plain gear total is shown.
            won
                ? { name: 'The Odds', value: `The party's gear (fit ${ready.reduce((sum, m) => sum + m.fit, 0)}) against ${boss.name}'s ${bossFit}.` }
                : { name: 'The Odds', value: `Party fit ${Math.round(partyFit)} against ${boss.name}'s ${bossFit}: a ${percent(chance)} chance.` }
        )
        .setTimestamp();
    if (left) embed.setFooter({ text: `${left} who joined did not finish their choices in time and stayed behind.` });

    if (!won) {
        const injuries = [];
        for (const m of ready) {
            const days = STANCES[m.stance].restDays;
            injuries.push(pick(days ? flavor.encounterInjuryLines[m.stance](m.displayName, days) : flavor.encounterInjuryLines.defensive(m.displayName)));
            if (persist && days) {
                await pointsStore.setInjury(g.id, m.userId, addDays(easternDay(), days)).catch((error) =>
                    console.error(`${tag}: failed to record an injury:`, error.message)
                );
            }
        }
        embed.addFields({ name: 'The Aftermath', value: `${pick(flavor.encounterDefeatLines(boss))}\n${injuries.join('\n')}${persist ? '' : '\n*(A rehearsal: no injuries were truly suffered.)*'}` });
        await channel.send({ embeds: [embed] });
        return;
    }

    const killer = pickKiller(ready);
    embed.addFields({ name: 'The Killing Blow', value: `${pick(flavor.encounterVictoryLines())} ${pick(flavor.encounterKillingBlowLines(killer.displayName, boss))}` });
    await channel.send({ embeds: [embed] });

    // Loot: DROPS_PER_WIN distinct random pieces of the tier's rarity, each
    // rolled for separately but all open at once in the same loot window.
    const rarity = catalog.RARITIES[tier];
    const pool = catalog.GEAR.filter((e) => catalog.rarityFor(e.price) === rarity && catalog.GEAR_SLOTS.includes(e.slot));
    const items = [];
    const remaining = [...pool];
    for (let k = 0; k < DROPS_PER_WIN && remaining.length; k++) {
        items.push(remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]);
    }

    const drops = await Promise.all(items.map(async (item, k) => {
        const lootPrefix = `encloot_${roundId}_${k}_`;
        const lootEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`The Spoils of ${boss.name} (${k + 1} of ${items.length})`)
            .setDescription(`${pick(flavor.encounterLootLines(itemLabel(item)))}\n\nSlot: ${item.slot}. Party members have ${minutesLabel(lootWindowMs)}: if anyone needs, only needers roll; otherwise greeders roll. Passes never roll.`)
            .setTimestamp();
        const lootMessage = await channel.send({ embeds: [lootEmbed], components: [lootRow(lootPrefix, false)] });
        const choices = await collectLoot(lootMessage, ready, lootWindowMs, lootPrefix);
        await lootMessage.edit({ components: [lootRow(lootPrefix, true)] }).catch(() => {});
        return { item, choices };
    }));

    // Resolved and granted one at a time, so a member who wins both pieces
    // gets the second checked against their gear after the first is in.
    for (const { item, choices } of drops) {
        const { rounds, winner } = rollLoot(choices);
        const rollLines = rounds.map((round, i) =>
            `${i ? '**Re-roll:** ' : ''}${round.map((r) => `${r.displayName} rolls **${r.roll}** (${r.choice === 'need' ? 'Need' : 'Greed'})`).join(', ')}`
        );
        const anyNeed = choices.some((c) => c.choice === 'need');
        const outranked = anyNeed ? choices.filter((c) => c.choice === 'greed').map((c) => c.displayName) : [];
        if (outranked.length) rollLines.push(`Greeded, but a Need comes first: ${outranked.join(', ')}`);
        const passers = choices.filter((c) => c.choice === 'pass').map((c) => c.displayName);
        if (passers.length) rollLines.push(`Passed: ${passers.join(', ')}`);
        const header = `**${itemLabel(item)}**`;

        if (!winner) {
            console.log(`${tag}: everyone passed on ${item.name}.`);
            await channel.send(`${header}\n${rollLines.join('\n')}\n${pick(flavor.encounterLootAllPassedLines(itemLabel(item)))}`);
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
        const note = !persist ? '\n*(A rehearsal: the spoils were not truly granted.)*' : result === 'equipped' ? ' It is equipped at once.' : ' It goes to their bag.';
        await channel.send(`${header}\n${rollLines.join('\n')}\n${pick(flavor.encounterLootWonLines(winner.displayName, itemLabel(item)))}${note}`);
    }
};

/* Run one encounter.
 * options:
 *   guild, targetChannel - as the other games (default: every guild, its channel)
 *   persist      - record injuries and grant loot (default: false)
 *   maxParty     - most members who can join (default 5)
 *   joinWindowMs - how long the party can form (default 1 hour)
 *   lootWindowMs - how long need/greed/pass stays open (default 1 hour)
 *   runLabel     - tags log lines (default: "scheduled" if persist, else "preview")
 */
const runEncounter = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        maxParty = DEFAULT_MAX_PARTY,
        joinWindowMs = JOIN_WINDOW_MS,
        lootWindowMs = LOOT_WINDOW_MS,
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
            await runEncounterIn(g, channel, { maxParty, joinWindowMs, lootWindowMs, persist, runLabel });
        } catch (error) {
            console.error(`Encounter failed for guild "${g.name}":`, error);
        }
    }));
};

module.exports = {
    runEncounter,
    bossFitPerEntrant,
    winChance,
    TIER_COVERAGE,
    TIER_LOSS_FLOOR,
    resolveTier,
    pickKiller,
    rollLoot,
    addDays,
    STANCES,
    JOIN_WINDOW_MS,
    LOOT_WINDOW_MS,
    DEFAULT_MAX_PARTY,
    DROPS_PER_WIN,
};
