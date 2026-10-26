/* The Herald's battle: the court's last challenge (see
 * docs/the-last-proclamation.md). An admin names the day with
 * /herald_challenge; the herald proclaims it, reminds the court a week
 * before, the day before and that morning, and at the hour posts the
 * challenge in the channel where it was named.
 *
 * Only Echoes, members who hold a relic (pointsStore.getRelics), may join,
 * with no cap, for JOIN_WINDOW_MS. Each fights in the finest gear they own
 * (bestKit) and picks one of the encounter's four stances privately,
 * Balanced if they choose none; the stance counts only against the Herald.
 * With fewer than MIN_PARTY the challenge passes. Then three
 * phases, each its own post, filled in a line every STEP_MS for drama:
 *
 *   1. The Staff - one lore question from HERALD_QUESTIONS for the whole
 *      party, answered privately with buttons in ANSWER_WINDOW_MS. A right
 *      answer adds LORE_BONUS to that member's dream duel only.
 *   2. The Horn  - each member's dream duel against their own relic's
 *      Guardian, solo at Max difficulty like a trial: fit, plus the lore
 *      bonus, against bossFitPerEntrant(Max). A win adds DREAM_BONUS to that
 *      member's power against the Herald; a loss costs nothing.
 *   3. The Wheel - the court against the Herald at HERALD_FIT_PER_ENTRANT per
 *      member: each member's fit, times their stance, times 1 + DREAM_BONUS
 *      if they won their dream, summed. On the encounter curve capped like
 *      Max, except that if every member won their dream, the win is certain.
 *
 * Unlike the daily encounter, every member's fit and power are shown: it is
 * the finale. A win names the age the first time (campaign field
 * heraldDefeatedAt), earns everyone The Age Is Named (counter herald_wins),
 * and drops Legendary gear, one piece per 2.5 members, rolled for like
 * encounter loot (rollForLoot); each Plunder member also makes off with a
 * Legendary piece of their own (plunderFor). A loss singles out two members,
 * the less fit likelier, and rests them by stance, as an encounter does
 * (pickTargets): Aggressive or Plunder two days, Balanced one, Defensive
 * none. The battle lives in memory, like the encounter.
 *
 * The named day lives on the campaign item: heraldDuelAt (ISO),
 * heraldDuelChannelId and heraldDuelPending, the steps still to come. A
 * minute ticker runs them, so a restart only delays a step; a reminder more
 * than REMINDER_GRACE_MS late is skipped, and so is a start more than
 * START_GRACE_MS late.
 *
 * Exposes:
 *   runHeraldBattle(guild, channel, opts) - one battle; persist: false is a
 *     rehearsal (/herald_test): anyone may join, a member without a relic
 *     dreams of a random one, and nothing is written
 *   setDuel / cancelDuel / getDuel - for /herald_challenge
 *   scheduleHeraldChallenge(client) - loads named days and starts the ticker
 *   and, pure, for the tests: dreamOdds, heraldOdds, duelSteps, stepTime,
 *   formatWhen
 */

const crypto = require('crypto');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('./pointsStore');
const achievements = require('./achievements');
const { recordHistory } = require('./historyLog');
const { findAdventurerRole } = require('./adventurerRole');
const { atEastern, easternParts } = require('./easternTime');
const catalog = require('../commands/passive/shopCatalog');
const {
    bossFitPerEntrant, winChance, HERALD_FIT_PER_ENTRANT, MAX_TIER, ROLL_DELAY_MS,
    dropsFor, kitsOf, fieldValue, minutesLabel, delay, rollForLoot, itemLabel,
    STANCES, pickTargets, plunderFor, addDays,
} = require('../commands/passive/encounter');
const { easternDay } = require('../commands/passive/shop');
const { uniqueTrials } = require('../flavor_text/uniqueTrials');
const flavor = require('../flavor_text');

const JOIN_WINDOW_MS = 60 * 60 * 1000;
const ANSWER_WINDOW_MS = 2 * 60 * 1000;
const STEP_MS = 5000;
const MIN_PARTY = 3;
const LORE_BONUS = 0.15;
const DREAM_BONUS = 0.15;
const AGE_NAME = 'Age of Adventurers';
const REMINDER_GRACE_MS = 3 * 60 * 60 * 1000;
const START_GRACE_MS = 60 * 60 * 1000;
const TICK_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Room for one more line before an embed description nears Discord's 4096.
const DESCRIPTION_ROOM = 3800;

const EMBED_COLOR = 0xd4af37; // heraldic gold
const DEFEAT_COLOR = 0x8b0000; // dark red
const LETTERS = ['A', 'B', 'C', 'D'];

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const num = (n) => Math.round(n).toLocaleString('en-US');

// ---- pure rules ---------------------------------------------------------------

// A member's dream duel against their Guardian: fit, plus the lore bonus.
const dreamOdds = (fit, loreRight) => {
    const power = fit * (loreRight ? 1 + LORE_BONUS : 1);
    const guardianFit = bossFitPerEntrant(MAX_TIER);
    return { power, guardianFit, chance: winChance(power / guardianFit, MAX_TIER) };
};

// A member's power against the Herald: fit, times stance, times the dream's blessing.
const powerOf = (m) => m.fit * STANCES[m.stance || 'balanced'].multiplier * (m.dreamWon ? 1 + DREAM_BONUS : 1);

// The court against the Herald, from each member's { fit, stance, dreamWon }.
const heraldOdds = (members) => {
    const power = members.reduce((sum, m) => sum + powerOf(m), 0);
    const heraldFit = HERALD_FIT_PER_ENTRANT * members.length;
    const perfect = members.length > 0 && members.every((m) => m.dreamWon);
    return { power, heraldFit, perfect, chance: perfect ? 1 : winChance(power / heraldFit, MAX_TIER) };
};

// When each step of a named day falls: reminders a week and a day before,
// one at 9 AM Eastern on the day, and the battle itself.
const STEP_KEYS = ['week', 'day', 'morning', 'start'];
const stepTime = (key, duelAt) => {
    if (key === 'week') return new Date(duelAt.getTime() - 7 * DAY_MS);
    if (key === 'day') return new Date(duelAt.getTime() - DAY_MS);
    if (key === 'morning') return atEastern(easternParts(duelAt), 9);
    return duelAt;
};
// The steps still ahead of `now`; a morning reminder at or after the hour is dropped.
const duelSteps = (duelAt, now = new Date()) => STEP_KEYS.filter((key) => {
    const at = stepTime(key, duelAt);
    return at > now && (key !== 'morning' || at < duelAt);
});

// "Saturday, December 12 at 9:00 PM Eastern"
const formatWhen = (date) => `${new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
}).format(date).replace(/, (\d{1,2}:\d{2})/, ' at $1')} Eastern`;

// "9:00 PM Eastern"
const formatTime = (date) => `${new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(date)} Eastern`;

const shuffled = (items) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

// ---- posting --------------------------------------------------------------------

// A phase post that grows a line at a time, carried on into a new post if it
// would outgrow one embed.
const livePost = async (channel, title, intro, color = EMBED_COLOR) => {
    let lines = [intro];
    let part = 1;
    const embedFor = () => new EmbedBuilder().setColor(color).setTitle(part === 1 ? title : `${title}, continued`).setDescription(lines.join('\n\n'));
    let message = await channel.send({ embeds: [embedFor()] });
    return {
        add: async (line) => {
            if ([...lines, line].join('\n\n').length > DESCRIPTION_ROOM) {
                part += 1;
                lines = [line];
                message = await channel.send({ embeds: [embedFor()] });
                return;
            }
            lines.push(line);
            await message.edit({ embeds: [embedFor()] }).catch(() => {});
        },
    };
};

const challengeEmbed = (party, joinWindowMs, minParty, intro, closed = false) => new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(closed ? 'The Last Challenge: the court has answered' : 'The Last Challenge')
    .setDescription(`${intro}\n\nOnly Echoes, those who bear a relic, may answer. Each fights in the finest arms they own, in a stance of their choosing. ${minParty > 1 ? `At least ${minParty} must answer. ` : ''}The court marches in ${minutesLabel(joinWindowMs)}.`)
    .addFields({ name: `The Court (${party.size})`, value: party.size ? fieldValue([...party.values()].map((m) => `${m.displayName}${m.stance ? ' - ready' : ''}`)) : '*No one yet.*' })
    .setTimestamp();

const joinRow = (prefix, disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${prefix}join`).setLabel('Answer the challenge').setStyle(ButtonStyle.Danger).setDisabled(disabled)
);

const STANCE_NOTE = "Thy stance counts against the Herald himself. Aggressive fights at +15% but risks two days' rest if the court loses; Balanced at thy true fit, one day's rest; Defensive at -10% and escapes unhurt. Plunder fights at -20%, and if the court wins thou makest off with a Legendary piece of thine own besides the drops, but two days' rest if caught in a loss. If thou choosest nothing, thou fightest Balanced.";

const stancePrompt = (prefix, member, persist) => {
    const relic = catalog.findEntry(member.relicId);
    const row = new ActionRowBuilder().addComponents(Object.entries(STANCES).map(([key, st]) =>
        new ButtonBuilder().setCustomId(`${prefix}stance_${key}`).setLabel(`${st.label}${member.stance === key ? ' - chosen' : ''}`).setStyle(st.style)
    ));
    const stance = member.stance ? STANCES[member.stance].label : 'not chosen, so Balanced';
    const ready = member.stance ? '\n\n**Thou art ready.** Change it until the court marches.' : '';
    const rehearsal = persist ? '' : '\n\n*A rehearsal: thy relic may be borrowed for the dream, and no wound is truly taken.*';
    return {
        content: `Thou standest with the court, bearing **${relic ? relic.name : 'thy relic'}**. Thou fightest in thy finest arms, fit ${member.bestFit}.\n\n**Thy stance:** ${stance}\n${STANCE_NOTE}${ready}${rehearsal}`,
        components: [row],
    };
};

// ---- the battle ------------------------------------------------------------------

// The relics that have trials, for a rehearsal member who holds none.
const trialRelics = () => catalog.UNIQUES.filter((u) => uniqueTrials[u.id]).map((u) => u.id);

const gatherCourt = (g, channel, message, prefix, { joinWindowMs, minParty, persist, intro, tag }) => new Promise((resolve) => {
    const party = new Map();
    const checking = new Set();
    const collector = channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId === `${prefix}join` || i.customId.startsWith(`${prefix}stance_`),
        time: joinWindowMs,
    });
    collector.on('collect', async (interaction) => {
        if (interaction.user.bot) return;
        const userId = interaction.user.id;
        if (interaction.customId.startsWith(`${prefix}stance_`)) {
            const member = party.get(userId);
            if (!member) {
                await interaction.reply({ content: 'Answer the challenge first, good noble.', flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }
            const wasReady = Boolean(member.stance);
            member.stance = interaction.customId.slice(`${prefix}stance_`.length);
            await interaction.update(stancePrompt(prefix, member, persist)).catch(() => {});
            if (!wasReady) await message.edit({ embeds: [challengeEmbed(party, joinWindowMs, minParty, intro)] }).catch(() => {});
            return;
        }
        if (party.has(userId)) {
            await interaction.reply({ ...stancePrompt(prefix, party.get(userId), persist), flags: MessageFlags.Ephemeral }).catch(() => {});
            return;
        }
        if (checking.has(userId)) return;
        // Held before any await, so a quick second click can't answer twice.
        checking.add(userId);
        await interaction.deferReply({ ephemeral: true }).catch(() => {});
        const relics = await pointsStore.getRelics(g.id).catch(() => ({ holders: new Map() }));
        let relicId = relics.holders.get(userId) || null;
        if (!relicId && persist) {
            checking.delete(userId);
            await interaction.editReply('Only an Echo may answer this challenge, one who bears a relic of the old waves. Walk the old roads first, with /trial.').catch(() => {});
            return;
        }
        if (!relicId) relicId = pick(trialRelics());
        const character = await pointsStore.getCharacter(g.id, userId).catch(() => ({}));
        const { bestFit } = kitsOf(character);
        const member = {
            userId,
            displayName: interaction.member?.displayName || interaction.user.username,
            relicId,
            bestFit,
            stance: null,
        };
        party.set(userId, member);
        checking.delete(userId);
        await interaction.editReply(stancePrompt(prefix, member, persist)).catch(() => {});
        await message.edit({ embeds: [challengeEmbed(party, joinWindowMs, minParty, intro)] }).catch(() => {});
        console.log(`${tag}: ${member.displayName} (${userId}) answered, ${relicId}, fit ${bestFit}.`);
    });
    collector.on('end', () => resolve(party));
});

// The lore question. Resolves with a Map of userId -> the chosen index.
const askQuestion = (channel, message, prefix, memberIds, answerWindowMs) => new Promise((resolve) => {
    const answers = new Map();
    const collector = channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.customId.startsWith(`${prefix}ans_`),
        time: answerWindowMs,
    });
    collector.on('collect', async (interaction) => {
        if (!memberIds.has(interaction.user.id)) {
            await interaction.reply({ content: 'Only the court that answered the challenge may answer the Herald.', flags: MessageFlags.Ephemeral }).catch(() => {});
            return;
        }
        const index = Number(interaction.customId.slice(`${prefix}ans_`.length));
        answers.set(interaction.user.id, index);
        await interaction.reply({ content: `Thine answer is sealed: **${LETTERS[index]}**. Thou mayest change it until the Herald speaks.`, flags: MessageFlags.Ephemeral }).catch(() => {});
        if (answers.size === memberIds.size) collector.stop('all');
    });
    collector.on('end', () => resolve(answers));
});

const runHeraldBattleIn = async (g, channel, opts) => {
    const { joinWindowMs, answerWindowMs, stepMs, minParty, rollDelayMs, persist, runLabel } = opts;
    const tag = `Herald (${runLabel}) (guild ${g.id})`;
    const roundId = crypto.randomBytes(4).toString('hex');
    const prefix = `herald_${roundId}_`;
    const intro = pick(flavor.heraldChallengeLines());

    // ---- the challenge ----
    const role = persist ? findAdventurerRole(g) : null;
    const message = await channel.send({
        content: role ? `<@&${role.id}> The last challenge is proclaimed!` : undefined,
        embeds: [challengeEmbed(new Map(), joinWindowMs, minParty, intro)],
        components: [joinRow(prefix, false)],
        allowedMentions: { roles: role ? [role.id] : [] },
    });
    console.log(`${tag}: posted, join window ${joinWindowMs / 60000}m.`);
    const party = await gatherCourt(g, channel, message, prefix, { joinWindowMs, minParty, persist, intro, tag });
    await message.edit({ embeds: [challengeEmbed(party, joinWindowMs, minParty, intro, true)], components: [joinRow(prefix, true)] }).catch(() => {});

    const court = [...party.values()];
    if (!court.length) {
        console.log(`${tag}: no one answered.`);
        await channel.send(pick(flavor.heraldNoOneLines()));
        return;
    }
    if (court.length < minParty) {
        console.log(`${tag}: only ${court.length} answered, fewer than ${minParty}.`);
        await channel.send(pick(flavor.heraldTooFewLines(court.length, minParty)));
        return;
    }

    // Gear is read now, so anything bought or won while the court gathered counts.
    for (const m of court) {
        if (!m.stance) m.stance = 'balanced';
        const character = await pointsStore.getCharacter(g.id, m.userId).catch(() => ({}));
        m.fit = kitsOf(character).bestFit;
        m.title = (catalog.findEntry(character.title) || {}).name || null;
        m.className = (catalog.findEntry(character.class) || catalog.DEFAULT_CLASS).name;
        m.guardian = (uniqueTrials[m.relicId] || {}).guardian || { name: 'a Guardian' };
    }

    // ---- 1. the Staff: the lore question ----
    const question = pick(flavor.HERALD_QUESTIONS);
    const choices = shuffled(question.choices);
    const rightIndex = choices.indexOf(question.choices[0]);
    const staffEmbed = (closed) => new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('The Staff')
        .setDescription(`${pick(flavor.heraldStaffLines())}\n\n**${question.question}**\n\n${choices.map((c, i) => `**${LETTERS[i]}.** ${c}`).join('\n')}\n\n${closed ? '*The Herald has heard enough.*' : `Members of the court, answer in secret within ${minutesLabel(answerWindowMs)}. A true answer steadies thy hand in the dream to come.`}`);
    const answerRow = (disabled) => new ActionRowBuilder().addComponents(choices.map((c, i) =>
        new ButtonBuilder().setCustomId(`${prefix}ans_${i}`).setLabel(LETTERS[i]).setStyle(ButtonStyle.Primary).setDisabled(disabled)
    ));
    const staffMessage = await channel.send({ embeds: [staffEmbed(false)], components: [answerRow(false)] });
    const answers = await askQuestion(channel, staffMessage, prefix, new Set(court.map((m) => m.userId)), answerWindowMs);
    await staffMessage.edit({ embeds: [staffEmbed(true)], components: [answerRow(true)] }).catch(() => {});
    for (const m of court) m.loreRight = answers.get(m.userId) === rightIndex;
    const knowers = court.filter((m) => m.loreRight);
    await delay(stepMs);
    await channel.send({
        content: `${pick(flavor.heraldTriviaResultLines(question.choices[0], knowers.length, court.length))}${knowers.length ? `\n${knowers.map((m) => m.displayName).join(', ')}` : ''}`,
        allowedMentions: { parse: [] },
    });
    console.log(`${tag}: lore question "${question.question}", ${knowers.length} of ${court.length} right.`);

    // ---- 2. the Horn: the dream duels ----
    await delay(stepMs);
    const horn = await livePost(channel, 'The Horn', pick(flavor.heraldHornLines()));
    for (const m of court) {
        await delay(stepMs);
        const { power, guardianFit, chance } = dreamOdds(m.fit, m.loreRight);
        m.dreamPower = power;
        m.dreamChance = chance;
        m.dreamWon = Math.random() < chance;
        const relic = catalog.findEntry(m.relicId);
        await horn.add(`**${m.displayName}** faces **${m.guardian.name}** on the road to ${relic ? relic.name : 'their relic'}. Fit ${m.fit}${m.loreRight ? ', +15% for the lore' : ''}: **${num(power)}** against ${guardianFit}. ${pick(m.dreamWon ? flavor.heraldDreamWinLines(m.displayName) : flavor.heraldDreamLossLines(m.displayName))}`);
    }
    const blessed = court.filter((m) => m.dreamWon).length;
    await delay(stepMs);
    await horn.add(pick(flavor.heraldDreamSummaryLines(blessed, court.length)));

    // ---- 3. the Wheel: the Herald ----
    await delay(stepMs);
    const wheel = await livePost(channel, 'The Wheel', pick(flavor.heraldWheelLines()));
    let running = 0;
    for (const m of court) {
        await delay(stepMs);
        m.power = powerOf(m);
        running += m.power;
        const who = `**${m.displayName}**${m.title ? `, ${m.title},` : ''}`;
        // How they take him on, by stance, then their numbers.
        await wheel.add(`${pick(flavor.heraldStanceLines[m.stance](who))}\n${m.className}. Fit ${m.fit}, ${STANCES[m.stance].label}${m.dreamWon ? ', dream-blessed' : ''}: **${num(m.power)}**. *The court: ${num(running)}*`);
    }
    const { power, heraldFit, perfect, chance } = heraldOdds(court);
    await delay(stepMs);
    await wheel.add(`**The court: ${num(power)}. The Herald: ${num(heraldFit)}.**${perfect ? `\n\n${pick(flavor.heraldPerfectLines())}` : ''}`);
    await delay(stepMs);
    await channel.send(pick(flavor.heraldThrowLines()));
    const won = Math.random() < chance;
    console.log(`${tag}: ${court.length} fought, ${blessed} dream-blessed, court ${num(power)} vs ${num(heraldFit)}, ${Math.round(chance * 100)}% odds${perfect ? ' (perfect)' : ''}, ${won ? 'won' : 'lost'}.`);

    recordHistory('herald', {
        guildId: g.id,
        battleId: roundId,
        rehearsal: !persist,
        question: question.question,
        power: Math.round(power),
        heraldFit,
        chance: Math.round(chance * 1000) / 1000,
        perfect,
        won,
        members: court.map((m) => ({
            userId: m.userId,
            name: m.displayName,
            relic: m.relicId,
            stance: m.stance,
            fit: m.fit,
            loreRight: m.loreRight,
            dreamPower: Math.round(m.dreamPower),
            dreamChance: Math.round(m.dreamChance * 1000) / 1000,
            dreamWon: m.dreamWon,
            power: Math.round(m.power),
        })),
    });

    await delay(stepMs * 2);
    if (!won) {
        // As in an encounter: two members singled out, the less fit likelier,
        // rested by stance; a Defensive one fends it off.
        const targets = pickTargets(court);
        const lines = [];
        for (const m of targets) {
            const days = STANCES[m.stance].restDays;
            lines.push(pick(flavor.encounterInjuryLines[m.stance](m.displayName, days)));
            if (persist && days) {
                await pointsStore.setInjury(g.id, m.userId, addDays(easternDay(), days)).catch((error) =>
                    console.error(`${tag}: failed to record an injury:`, error.message));
            }
        }
        const unhurt = court.filter((m) => !targets.includes(m)).map((m) => m.displayName);
        if (unhurt.length) {
            const names = unhurt.length === 1 ? unhurt[0] : `${unhurt.slice(0, -1).join(', ')} and ${unhurt[unhurt.length - 1]}`;
            lines.push(pick(flavor.encounterUnhurtLines(names)));
        }
        await channel.send({
            embeds: [new EmbedBuilder()
                .setColor(DEFEAT_COLOR)
                .setTitle('Not Yet')
                .setDescription(`${pick(flavor.heraldLossLines())}\n\n${fieldValue(lines, 3000)}${persist ? '' : '\n\n*A rehearsal: the Herald was only practicing, and no wound was truly taken.*'}`)
                .setTimestamp()],
            allowedMentions: { parse: [] },
        });
        const caught = targets.filter((m) => m.stance === 'plunder');
        if (persist && caught.length) {
            await achievements.record(g.id, caught.map((m) => ({ userId: m.userId, displayName: m.displayName, counts: { plunder_caught: 1 } })), channel);
        }
        return;
    }

    // The age is named only the first time the court wins.
    const named = persist
        ? (await pointsStore.setCampaignOnce(g.id, 'heraldDefeatedAt', new Date().toISOString()).catch(() => false) ? AGE_NAME : null)
        : AGE_NAME;
    await channel.send({ embeds: [new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle(named ? `The ${named}` : 'The Herald Falls')
        .setDescription(`${pick(flavor.heraldWinLines(named))}${persist ? '' : '\n\n*A rehearsal: nothing was truly named.*'}`)
        .setTimestamp()] });
    if (persist) {
        await achievements.record(g.id, court.map((m) => ({ userId: m.userId, displayName: m.displayName, counts: { herald_wins: 1 } })), channel);
    }

    // Loot: Legendary gear, one piece per 2.5 members.
    const pool = catalog.GEAR.filter((e) => catalog.rarityFor(e.price) === 'Legendary' && catalog.GEAR_SLOTS.includes(e.slot));
    const items = shuffled(pool).slice(0, dropsFor(court.length));

    // Plunder: each Plunder member makes off with a Legendary piece of their
    // own, never one of the drops, announced before the drops are rolled for.
    const plundered = plunderFor(court.filter((m) => m.stance === 'plunder'), pool, items);
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
            recordHistory('loot', { guildId: g.id, battleId: roundId, rehearsal: !persist, item: item.id, slot: item.slot, price: item.price, plunder: true, winnerId: member.userId, result });
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
                .setTitle('Plunder from the Herald')
                .setDescription(`${fieldValue(lines, 3800)}${persist ? '' : '\n\n*A rehearsal: the plunder was not truly granted.*'}`)
                .setTimestamp()],
            allowedMentions: { parse: [] },
        });
    }

    if (items.length) {
        await rollForLoot(g, channel, { members: court, items, sourceName: 'the Herald', roundId, persist, rollDelayMs, tag });
    }
};

/* Run one battle in `channel`.
 * options:
 *   persist        - require relics, name the age, grant achievements and loot (default: false)
 *   joinWindowMs   - how long the court can answer (default 1 hour)
 *   answerWindowMs - how long the lore question stays open (default 2 minutes)
 *   stepMs         - the pause between lines (default 5 seconds)
 *   minParty       - fewest who can fight (default MIN_PARTY, 3)
 *   rollDelayMs    - the pause between loot rolls, as the encounter's
 *   runLabel       - tags log lines (default: "scheduled" if persist, else "rehearsal")
 */
const running = new Set();
const runHeraldBattle = async function (guild, channel, options = {}) {
    const {
        persist = false,
        joinWindowMs = JOIN_WINDOW_MS,
        answerWindowMs = ANSWER_WINDOW_MS,
        stepMs = STEP_MS,
        minParty = MIN_PARTY,
        rollDelayMs = ROLL_DELAY_MS,
        runLabel = persist ? 'scheduled' : 'rehearsal',
    } = options;
    if (running.has(guild.id)) {
        console.log(`Herald (${runLabel}) (guild ${guild.id}): a battle is already under way; skipped.`);
        return false;
    }
    running.add(guild.id);
    try {
        await runHeraldBattleIn(guild, channel, { joinWindowMs, answerWindowMs, stepMs, minParty, rollDelayMs, persist, runLabel });
    } catch (error) {
        console.error(`Herald battle failed for guild "${guild.name}":`, error);
    } finally {
        running.delete(guild.id);
    }
    return true;
};

// ---- the named day ---------------------------------------------------------------

// guildId -> { duelAt: Date, channelId, pending: [step keys] }, mirrored from the campaign.
const duels = new Map();

const getDuel = (guildId) => duels.get(guildId) || null;

const setDuel = async function (guildId, duelAt, channelId, now = new Date()) {
    const duel = { duelAt, channelId, pending: duelSteps(duelAt, now) };
    await pointsStore.setCampaignFields(guildId, {
        heraldDuelAt: duelAt.toISOString(),
        heraldDuelChannelId: channelId,
        heraldDuelPending: duel.pending,
    });
    duels.set(guildId, duel);
    return duel;
};

const cancelDuel = async function (guildId) {
    await pointsStore.setCampaignFields(guildId, { heraldDuelAt: null, heraldDuelChannelId: null, heraldDuelPending: null });
    duels.delete(guildId);
};

// Runs every step that has come due, oldest first.
const tick = async (client, now = new Date()) => {
    for (const [guildId, duel] of duels) {
        const due = duel.pending.filter((key) => stepTime(key, duel.duelAt) <= now);
        if (!due.length) continue;
        const guild = client.guilds.cache.get(guildId);
        const channel = guild ? await guild.channels.fetch(duel.channelId).catch(() => null) : null;
        for (const key of due) {
            duel.pending = duel.pending.filter((k) => k !== key);
            const late = now - stepTime(key, duel.duelAt);
            if (key === 'start') {
                await cancelDuel(guildId).catch((error) => console.error(`Herald (guild ${guildId}): failed to clear the named day:`, error.message));
                if (!channel) {
                    console.log(`Herald (guild ${guildId}): the challenge channel is gone; the battle is skipped.`);
                } else if (late > START_GRACE_MS) {
                    console.log(`Herald (guild ${guildId}): the hour passed ${Math.round(late / 60000)} minutes ago, too late to begin; skipped.`);
                } else {
                    runHeraldBattle(guild, channel, { persist: true });
                }
                continue;
            }
            await pointsStore.setCampaignFields(guildId, { heraldDuelPending: duel.pending }).catch((error) =>
                console.error(`Herald (guild ${guildId}): failed to save the steps:`, error.message));
            if (!channel || late > REMINDER_GRACE_MS) {
                console.log(`Herald (guild ${guildId}): the ${key} reminder was skipped${channel ? ', too late' : ', no channel'}.`);
                continue;
            }
            await channel.send(pick(flavor.heraldReminderLines[key](formatWhen(duel.duelAt), formatTime(duel.duelAt)))).catch((error) =>
                console.error(`Herald (guild ${guildId}): failed to post the ${key} reminder:`, error.message));
            console.log(`Herald (guild ${guildId}): posted the ${key} reminder.`);
        }
    }
};

/* Loads every guild's named day and starts the minute ticker. Call once,
 * on ready.
 */
const scheduleHeraldChallenge = async function (client) {
    for (const g of client.guilds.cache.values()) {
        try {
            const campaign = await pointsStore.getCampaign(g.id);
            if (!campaign.heraldDuelAt) continue;
            duels.set(g.id, {
                duelAt: new Date(campaign.heraldDuelAt),
                channelId: campaign.heraldDuelChannelId,
                pending: campaign.heraldDuelPending || [],
            });
            console.log(`Herald (guild ${g.id}): the challenge is named for ${campaign.heraldDuelAt}.`);
        } catch (error) {
            console.error(`Herald (guild ${g.id}): could not read the named day:`, error.message);
        }
    }
    setInterval(() => tick(client).catch((error) => console.error('Herald tick failed:', error)), TICK_MS);
    console.log('Herald challenge ticker started.');
};

module.exports = {
    runHeraldBattle,
    setDuel,
    cancelDuel,
    getDuel,
    scheduleHeraldChallenge,
    tick,
    dreamOdds,
    heraldOdds,
    powerOf,
    duelSteps,
    stepTime,
    formatWhen,
    MIN_PARTY,
    AGE_NAME,
    LORE_BONUS,
    DREAM_BONUS,
};
