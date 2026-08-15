/* /duel <opponent> <method> <wager> - challenge another court member to a
 * wager of points, settled by Coin Flip, Rock Paper Scissors, or Death Roll.
 *
 * The challenge posts publicly with three buttons — Accept, Decline with
 * Honor, and Scoff and Decline — so the whole court can watch, but only the
 * challenged member's click does anything; anyone else clicking is turned
 * away with a private note. Both decline buttons end the engagement
 * identically (no duel, no points move); they only flavor the public
 * announcement differently — neutral/respectful vs. dismissive. No response
 * within ACCEPT_WINDOW_MS and the challenge falls on deaf ears instead.
 *
 * Both duelists must already hold at least the wagered amount (checked at
 * challenge time and re-checked at acceptance, in case either side's
 * balance moved in between). Once resolved, the wager moves from loser to
 * winner via pointsStore — no separate "pot" is held server-side.
 *
 * Dueling yourself is blocked, except in a guild listed in the
 * TEST_GUILD_IDS env var — there it's allowed (points wash out net zero),
 * handy for testing the whole flow solo without needing a second account.
 */

const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags,
} = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const flavor = require('../../flavor_text');

// Comma-separated guild IDs where self-dueling is permitted (for testing).
// Unset in production, so self-duels stay blocked there.
const TEST_GUILD_IDS = new Set(
    (process.env.TEST_GUILD_IDS || '').split(',').map((id) => id.trim()).filter(Boolean)
);
const isTestGuild = (guildId) => TEST_GUILD_IDS.has(guildId);

const ACCEPT_WINDOW_MS = 5 * 60 * 1000;
const RPS_CHOICE_WINDOW_MS = 30 * 1000;
const DEATH_ROLL_START = 10000;
const DEATH_ROLL_DELAY_MS = 5 * 1000;

// Death Roll commentary thresholds (see rollCommentary below).
const DEATH_ROLL_LOW_ROLL = 5; // a roll under this is "a hair's breadth from oblivion"
const DEATH_ROLL_BIG_DROP_RATIO = 0.10; // a roll under (ceiling * this) is "a precipitous plunge"

// Every Nth consecutive Rock Paper Scissors tie earns escalating commentary.
const RPS_ESCALATING_TIE_EVERY = 3;

const EMBED_COLOR = 0xd4af37; // heraldic gold

const METHOD_COIN_FLIP = 'Coin Flip';
const METHOD_RPS = 'Rock Paper Scissors';
const METHOD_DEATH_ROLL = 'Death Roll';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const displayNameOf = (member) => member.displayName;
const pointsWord = (n) => (n === 1 ? 'point' : 'points');
const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// ---- challenge post -----------------------------------------------------

const buildChallengeEmbed = (challenger, target, method, wager) =>
    new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle('A Challenge Is Declared!')
        .setDescription(
            `Hear ye! **${displayNameOf(challenger)}** challenges **${displayNameOf(target)}** to a duel of **${method}**, wagering **${wager}** ${pointsWord(wager)}!\n\n` +
            `${displayNameOf(target)}, wilt thou accept? Thou hast ${ACCEPT_WINDOW_MS / 60000} minutes to answer.`
        )
        .setTimestamp();

const buildChallengeRow = (disabled = false) =>
    new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('duel_accept').setLabel('Accept Thy Challenge').setStyle(ButtonStyle.Success).setDisabled(disabled),
        new ButtonBuilder().setCustomId('duel_decline_respectful').setLabel('Decline with Honor').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('duel_decline_scoff').setLabel('Scoff and Decline').setStyle(ButtonStyle.Danger).setDisabled(disabled)
    );

// ---- Rock Paper Scissors --------------------------------------------------

const RPS_BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

const buildRpsRow = () =>
    new ActionRowBuilder().addComponents(
        Object.keys(RPS_BEATS).map((choice) =>
            new ButtonBuilder()
                .setCustomId(`duel_rps_${choice}`)
                .setLabel(choice[0].toUpperCase() + choice.slice(1))
                .setStyle(ButtonStyle.Secondary)
        )
    );

// Sends the chooser an ephemeral Rock/Paper/Scissors prompt (only they can
// see or click it) and resolves with their pick, or null if they didn't
// answer within RPS_CHOICE_WINDOW_MS.
const promptRpsChoice = async (repliable, foeName) => {
    const prompt = await repliable.followUp({
        content: `Choose thy weapon against ${foeName}, in secret:`,
        components: [buildRpsRow()],
        flags: MessageFlags.Ephemeral,
    });

    try {
        const choiceInteraction = await prompt.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: RPS_CHOICE_WINDOW_MS,
        });
        const choice = choiceInteraction.customId.replace('duel_rps_', '');
        await choiceInteraction.update({ content: `Thy weapon: **${choice}**. Await thy foe...`, components: [] });
        return choice;
    } catch {
        return null;
    }
};

// Resolves a full Rock Paper Scissors duel, replaying on ties, and returns
// [winner, loser] — or [null, null] if both sides dawdled and no contest
// took place.
const resolveRps = async (interaction, acceptInteraction, channel, challenger, target) => {
    let tieCount = 0;

    for (;;) {
        const [challengerChoice, targetChoice] = await Promise.all([
            promptRpsChoice(interaction, displayNameOf(target)),
            promptRpsChoice(acceptInteraction, displayNameOf(challenger)),
        ]);

        if (!challengerChoice && !targetChoice) {
            await channel.send('Both duelists dawdled and chose nothing — the duel ends in a shrug. No points change hands.');
            return [null, null];
        }
        if (!challengerChoice) {
            await channel.send(`**${displayNameOf(challenger)}** hesitated too long and forfeits the duel!`);
            return [target, challenger];
        }
        if (!targetChoice) {
            await channel.send(`**${displayNameOf(target)}** hesitated too long and forfeits the duel!`);
            return [challenger, target];
        }

        await channel.send(`**${displayNameOf(challenger)}** chose **${challengerChoice}**. **${displayNameOf(target)}** chose **${targetChoice}**.`);

        if (challengerChoice === targetChoice) {
            tieCount += 1;
            const tieLine = tieCount % RPS_ESCALATING_TIE_EVERY === 0
                ? pick(flavor.rpsEscalatingTieLines())
                : pick(flavor.rpsTieLines());
            await channel.send(tieLine);
            continue;
        }

        const challengerWins = RPS_BEATS[challengerChoice] === targetChoice;
        return challengerWins ? [challenger, target] : [target, challenger];
    }
};

// ---- Coin Flip ------------------------------------------------------------

const resolveCoinFlip = async (channel, challenger, target) => {
    await channel.send('The Herald tosses a coin high into the air...');
    const winner = Math.random() < 0.5 ? challenger : target;
    const loser = winner === challenger ? target : challenger;
    await channel.send(`...it lands in favor of **${displayNameOf(winner)}**!`);
    return [winner, loser];
};

// ---- Death Roll -------------------------------------------------------------

const rollBetween = (max) => Math.floor(Math.random() * (max + 1)); // 0..max inclusive

// Extra flavor for a notable roll: landing on the exact same number as the
// ceiling, the round-ending 0, a very low near-miss, or a huge (>90%) drop
// from the prior ceiling. A roll of 0 gets its own dedicated lines rather
// than the "near oblivion" ones, since for that roll oblivion isn't near —
// it's the game-ending roll itself. Same-roll can stack with any of the
// others since it's an independent coincidence.
const rollCommentary = (roll, ceiling) => {
    const notes = [];
    if (roll === ceiling) {
        notes.push(pick(flavor.deathRollSameRollLines()));
    }
    if (roll === 0) {
        notes.push(pick(flavor.deathRollFatalLines()));
    } else if (roll < DEATH_ROLL_LOW_ROLL) {
        notes.push(pick(flavor.deathRollLowRollLines()));
    } else if (roll <= ceiling * DEATH_ROLL_BIG_DROP_RATIO) {
        notes.push(pick(flavor.deathRollBigDropLines()));
    }
    return notes.length ? ` ${notes.join(' ')}` : '';
};

const resolveDeathRoll = async (channel, challenger, target) => {
    await channel.send(`The duel is joined! **DEATH ROLL!** The wheel of fate begins at **${DEATH_ROLL_START.toLocaleString()}**...`);

    let value = DEATH_ROLL_START;
    let current = challenger;
    let other = target;

    for (;;) {
        await delay(DEATH_ROLL_DELAY_MS);
        const roll = rollBetween(value);
        const commentary = rollCommentary(roll, value);
        await channel.send(`**${displayNameOf(current)}** rolls... **${roll.toLocaleString()}**!${commentary}`);

        if (roll === 0) {
            return [other, current];
        }
        value = roll;
        [current, other] = [other, current];
    }
};

// ---- entry point -----------------------------------------------------------

// Every duel gets a "Duel result (...)" audit line, win/lose/no-contest
// alike, so CloudWatch has a complete record independent of the channel
// history (which anyone could delete).
const logDuel = (guildId, message) => console.log(`Duel (guild ${guildId}): ${message}`);

const duel = async function (interaction) {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const challengerMember = interaction.member;
    const targetMember = interaction.options.getMember('opponent');
    const method = interaction.options.getString('method');
    const wager = interaction.options.getInteger('wager');

    if (targetMember.id === challengerMember.id && !isTestGuild(guild.id)) {
        await interaction.editReply('One cannot duel oneself, Milord — pick a rival!');
        return;
    }
    if (targetMember.user.bot) {
        await interaction.editReply('The Herald and its kin do not partake in duels, Milord.');
        return;
    }

    let challengerPoints, targetPoints;
    try {
        [challengerPoints, targetPoints] = await Promise.all([
            pointsStore.getPoints(guild.id, challengerMember.id),
            pointsStore.getPoints(guild.id, targetMember.id),
        ]);
    } catch (error) {
        console.error('duel: could not check point balances:', error);
        await interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        return;
    }

    if (challengerPoints < wager) {
        await interaction.editReply(`Thou dost not have ${wager} ${pointsWord(wager)} to wager, Milord — thy purse holds but ${challengerPoints}.`);
        return;
    }
    if (targetPoints < wager) {
        await interaction.editReply(`${displayNameOf(targetMember)} cannot match a wager of ${wager} ${pointsWord(wager)} — they hold but ${targetPoints}.`);
        return;
    }

    const challengeMessage = await interaction.editReply({
        embeds: [buildChallengeEmbed(challengerMember, targetMember, method, wager)],
        components: [buildChallengeRow(false)],
    });

    logDuel(guild.id, `${displayNameOf(challengerMember)} (${challengerMember.id}) challenged ${displayNameOf(targetMember)} (${targetMember.id}) to ${method} for ${wager} ${pointsWord(wager)}.`);

    let response = null; // 'accept' | 'decline_respectful' | 'decline_scoff'
    let respondingInteraction = null;

    const collector = challengeMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: ACCEPT_WINDOW_MS,
    });

    await new Promise((resolve) => {
        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== targetMember.id) {
                await buttonInteraction.reply({ content: "This isn't thy duel to answer, Milord!", flags: MessageFlags.Ephemeral }).catch(() => {});
                return;
            }
            response = buttonInteraction.customId.replace('duel_', ''); // 'accept' | 'decline_respectful' | 'decline_scoff'
            respondingInteraction = buttonInteraction;
            collector.stop();
        });
        collector.on('end', resolve);
    });

    await challengeMessage.edit({ components: [buildChallengeRow(true)] }).catch(() => {});

    if (!response) {
        logDuel(guild.id, `Duel result: no answer from ${displayNameOf(targetMember)} — challenge timed out. No points change hands.`);
        await interaction.followUp(`Alas, ${displayNameOf(targetMember)} did not answer — the challenge has fallen on deaf ears.`);
        return;
    }

    if (response === 'decline_respectful') {
        logDuel(guild.id, `Duel result: ${displayNameOf(targetMember)} declined respectfully. No points change hands.`);
        await respondingInteraction.reply(`With honor and grace, ${displayNameOf(targetMember)} declines the challenge — no shame in choosing one's battles wisely.`).catch(() => {});
        return;
    }

    if (response === 'decline_scoff') {
        logDuel(guild.id, `Duel result: ${displayNameOf(targetMember)} scoffed and declined. No points change hands.`);
        await respondingInteraction.reply(`${displayNameOf(targetMember)} scoffs at the very notion and turns up their nose — the challenge is refused!`).catch(() => {});
        return;
    }

    if (method === METHOD_DEATH_ROLL) {
        // No separate "duel is joined" message for Death Roll — its own
        // opening line (below) folds that acknowledgment in. deferUpdate
        // still acknowledges the button click, just without posting anything.
        await respondingInteraction.deferUpdate().catch(() => {});
    } else {
        await respondingInteraction.reply(`The duel is joined! Let the ${method} commence!`).catch(() => {});
    }

    // Balances may have moved since the challenge was issued (another duel,
    // a fresh recap, ...); re-check before any points actually change hands.
    let freshChallengerPoints, freshTargetPoints;
    try {
        [freshChallengerPoints, freshTargetPoints] = await Promise.all([
            pointsStore.getPoints(guild.id, challengerMember.id),
            pointsStore.getPoints(guild.id, targetMember.id),
        ]);
    } catch (error) {
        console.error('duel: could not re-check point balances:', error);
        await channel.send('Alack! The royal ledger is sealed to mine eyes, Milord — the duel is called off.');
        return;
    }
    if (freshChallengerPoints < wager || freshTargetPoints < wager) {
        logDuel(guild.id, 'Duel result: called off — a side could no longer cover the wager at acceptance. No points change hands.');
        await channel.send('Alack! The stakes have shifted since the challenge was made, and one side can no longer cover the wager. The duel is called off.');
        return;
    }

    let winner, loser;
    try {
        if (method === METHOD_COIN_FLIP) {
            [winner, loser] = await resolveCoinFlip(channel, challengerMember, targetMember);
        } else if (method === METHOD_RPS) {
            [winner, loser] = await resolveRps(interaction, respondingInteraction, channel, challengerMember, targetMember);
        } else {
            [winner, loser] = await resolveDeathRoll(channel, challengerMember, targetMember);
        }
    } catch (error) {
        console.error('duel: resolution failed:', error);
        logDuel(guild.id, `Duel result: resolution of ${method} between ${displayNameOf(challengerMember)} and ${displayNameOf(targetMember)} errored out. No points change hands.`);
        await channel.send('Alack! The duel was interrupted by misfortune, Milord. No points change hands.');
        return;
    }

    if (!winner) {
        logDuel(guild.id, `Duel result: ${method} between ${displayNameOf(challengerMember)} and ${displayNameOf(targetMember)} — no contest. No points change hands.`);
        return; // no contest (e.g. both sides dawdled in Rock Paper Scissors); already announced
    }

    try {
        await pointsStore.addPoints(guild.id, [
            { userId: winner.id, displayName: displayNameOf(winner), points: wager },
            { userId: loser.id, displayName: displayNameOf(loser), points: -wager },
        ]);
    } catch (error) {
        console.error('duel: failed to transfer points:', error);
    }

    try {
        await pointsStore.recordDuelResult(
            guild.id,
            { userId: winner.id, displayName: displayNameOf(winner) },
            { userId: loser.id, displayName: displayNameOf(loser) }
        );
    } catch (error) {
        console.error('duel: failed to record duel stats:', error);
    }

    try {
        await pointsStore.recordDuelHistory(guild.id, {
            method,
            wager,
            challengerId: challengerMember.id,
            challengerName: displayNameOf(challengerMember),
            targetId: targetMember.id,
            targetName: displayNameOf(targetMember),
            winnerId: winner.id,
            winnerName: displayNameOf(winner),
            loserId: loser.id,
            loserName: displayNameOf(loser),
        });
    } catch (error) {
        console.error('duel: failed to record duel history:', error);
    }

    logDuel(guild.id, `Duel result: ${method} between ${displayNameOf(challengerMember)} (${challengerMember.id}) and ${displayNameOf(targetMember)} (${targetMember.id}) for ${wager} ${pointsWord(wager)} — winner: ${displayNameOf(winner)} (${winner.id}), loser: ${displayNameOf(loser)} (${loser.id}).`);

    const winnerIsChallenger = winner.id === challengerMember.id;
    const victoryLines = winnerIsChallenger
        ? flavor.duelVictoryLinesForChallenger(displayNameOf(winner), displayNameOf(loser))
        : flavor.duelVictoryLinesForTarget(displayNameOf(winner), displayNameOf(loser));
    await channel.send(`${pick(victoryLines)} **${wager}** ${pointsWord(wager)} change hands.`);
};

module.exports = {
    description: 'Challenge another court member to a wagered duel',
    category: 'COURTLY GAMES',
    options: [
        {
            name: 'opponent',
            description: 'The court member thou dost challenge',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'method',
            description: 'How the duel shall be settled',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: METHOD_COIN_FLIP, value: METHOD_COIN_FLIP },
                { name: METHOD_RPS, value: METHOD_RPS },
                { name: METHOD_DEATH_ROLL, value: METHOD_DEATH_ROLL },
            ],
        },
        {
            name: 'wager',
            description: 'How many points to stake',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            minValue: 1,
        },
    ],
    run: duel,
};
