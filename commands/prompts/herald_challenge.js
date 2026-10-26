/* /herald_challenge <date> [time] [cancel] - admin-only: name the day of the
 * Herald's battle (src/heraldBattle.js). The herald proclaims it in this
 * channel at once, reminds the court a week before, the day before and at
 * 9 AM Eastern that day, and at the hour posts the challenge here. Running it
 * again moves the day; cancel: true calls it off. It stays locked until the
 * Herald's last reveal morning has posted (campaign.revealDone), so the story
 * can't run out of order. adminOnly + hidden + ephemeral: the proclamation
 * is the only public trace.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const campaign = require('../../src/campaign');
const { atEastern } = require('../../src/easternTime');
const { setDuel, cancelDuel, getDuel, formatWhen, MIN_PARTY } = require('../../src/heraldBattle');
const flavor = require('../../flavor_text');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

// The Date for a YYYY-MM-DD and HH:MM in Eastern time, or null if either
// isn't a real date or time.
const parseWhen = (dateText, timeText) => {
    const d = DATE_PATTERN.exec(dateText.trim());
    const t = TIME_PATTERN.exec(timeText.trim());
    if (!d || !t) return null;
    const [year, month, day, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    if (hour > 23 || minute > 59) return null;
    return atEastern({ year, month, day }, hour, minute);
};

const heraldChallenge = async function (interaction) {
    const guildId = interaction.guild.id;
    const previous = getDuel(guildId);

    if (interaction.options.getBoolean('cancel')) {
        if (!previous) {
            await interaction.editReply('No challenge is named, Milord, so there is nothing to call off.');
            return;
        }
        await cancelDuel(guildId);
        await interaction.channel.send(pick(flavor.heraldChallengeCancelledLines()));
        console.log(`herald_challenge: ${interaction.user.username} called off the challenge.`);
        await interaction.editReply('The challenge is called off, Milord, and the court has been told.');
        return;
    }

    if (!previous && !await campaign.revealDone(guildId)) {
        await interaction.editReply(`Not yet, Milord. The herald has not revealed himself: that comes after ${campaign.REVEAL_AFTER} relics are claimed, over three mornings. Until then the court would not know why he challenges them. Rehearse with /herald_test meanwhile.`);
        return;
    }

    const dateText = interaction.options.getString('date');
    if (!dateText) {
        await interaction.editReply(previous
            ? `The challenge is named for **${formatWhen(previous.duelAt)}**, in <#${previous.channelId}>. Give a date to move it, or cancel: True to call it off.`
            : 'Give a date, Milord, as YYYY-MM-DD, and a time if not 21:00 Eastern.');
        return;
    }
    const duelAt = parseWhen(dateText, interaction.options.getString('time') || '21:00');
    if (!duelAt) {
        await interaction.editReply('That date or time cannot be read, Milord. Use YYYY-MM-DD for the date and HH:MM, Eastern and 24-hour, for the time, such as 2026-12-12 and 21:00.');
        return;
    }
    if (duelAt <= new Date(Date.now() + 60 * 60 * 1000)) {
        await interaction.editReply('Give the court at least an hour\'s warning, Milord: the day must be in the future.');
        return;
    }

    const duel = await setDuel(guildId, duelAt, interaction.channel.id);
    const when = formatWhen(duelAt);
    await interaction.channel.send(pick(previous ? flavor.heraldChallengeMovedLines(when) : flavor.heraldChallengeSetLines(when)));
    console.log(`herald_challenge: ${interaction.user.username} named the challenge for ${duelAt.toISOString()} in #${interaction.channel.name}.`);

    const relics = await pointsStore.getRelics(guildId).catch(() => ({ holders: new Map() }));
    const echoes = relics.holders.size;
    const reminders = duel.pending.filter((k) => k !== 'start');
    const labels = { week: 'a week before', day: 'the day before', morning: 'that morning at 9 AM' };
    await interaction.editReply([
        `It is proclaimed, Milord. The Herald's challenge is **${when}**, here in this channel.`,
        reminders.length ? `Reminders: ${reminders.map((k) => labels[k]).join(', ')}.` : 'It is too soon for any reminders.',
        `The court has ${echoes} ${echoes === 1 ? 'Echo' : 'Echoes'} today; at least ${MIN_PARTY} must answer for the battle to begin.`,
    ].join('\n'));
};

module.exports = {
    description: 'Name the day of the herald\'s challenge, in this channel',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    options: [
        {
            name: 'date',
            description: 'The day, as YYYY-MM-DD; leave out to see the current one',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'time',
            description: 'The hour, Eastern and 24-hour, as HH:MM (default 21:00)',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'cancel',
            description: 'Call off the named challenge',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],
    run: heraldChallenge,
    parseWhen,
};
