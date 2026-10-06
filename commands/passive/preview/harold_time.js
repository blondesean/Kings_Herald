/* /harold_time <game> - report when a daily game is set to fire today.
 *
 * One admin command for all the daily timers that open in a random slot:
 * trivia, the puzzle slot (Connections or Word Ladder, whichever is armed),
 * and the shop. adminOnly + hidden, and ephemeral, so only the admin who ran
 * it sees the answer. The times are the in-memory fire times set at each
 * window open, so right after a restart they read as "not armed" until the
 * next window opens. That's what this is for: checking a deploy won't skip
 * today's game without you noticing.
 *
 * Reported in Eastern time, since every window is Eastern-anchored.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { getScheduledFireTime: getTriviaFireTime } = require('../trivia');
const { getScheduledFireTime: getPuzzleFireTime } = require('../../puzzles/connections');
const { getShopScheduledFireTime } = require('../shop');
const { getScheduledFireTime: getBirthdayFireTime } = require('../birthdays');
const { getScheduledFireTime: getTreatFireTime } = require('../halloweenTreat');

const TIMEZONE = 'America/New_York';

const GAMES = {
    trivia: { label: "today's trivia round", fireAt: getTriviaFireTime, unarmed: "No trivia round is armed at present" },
    puzzle: { label: "today's puzzle", fireAt: getPuzzleFireTime, unarmed: "No puzzle is armed at present" },
    shop: { label: "today's shop", fireAt: getShopScheduledFireTime, unarmed: "No shop is armed at present" },
    birthdays: { label: "today's birthday check", fireAt: getBirthdayFireTime, unarmed: "The birthday check has already run today" },
    treat: { label: "today's Halloween treat", fireAt: getTreatFireTime, unarmed: "No Halloween treat is armed at present (it runs at noon Eastern in October)" },
};

const formatEastern = (date) =>
    new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(date);

const haroldTime = async function (interaction) {
    const game = GAMES[interaction.options.getString('game')];
    const fireAt = game.fireAt();

    if (!fireAt) {
        await interaction.editReply(
            `${game.unarmed}, Milord. Either today's window hasn't opened yet (9 AM Eastern), or it has already run.`
        );
        return;
    }

    await interaction.editReply(`${game.label[0].toUpperCase()}${game.label.slice(1)} is armed to fire at ${formatEastern(fireAt)}.`);
};

module.exports = {
    description: "Report when today's trivia, puzzle, shop, birthday check or treat is set to fire (visible only to you)",
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    ephemeral: true, // visible only to whoever ran it
    options: [
        {
            name: 'game',
            description: 'Which daily game to check',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Trivia', value: 'trivia' },
                { name: 'Puzzle', value: 'puzzle' },
                { name: 'Shop', value: 'shop' },
                { name: 'Birthdays', value: 'birthdays' },
                { name: 'Halloween treat', value: 'treat' },
            ],
        },
    ],
    run: haroldTime,
};
