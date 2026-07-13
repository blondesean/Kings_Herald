/* /nobility - proclaim the realm's nobles, highest station first.
 *
 * Reads the weekly-recap points ledger (DynamoDB via ../../src/pointsStore)
 * and lists every member with points, top to bottom, with their earned title
 * and current tally. Titles come from the ladder in
 * flavor_text/nobilityRanks.js: a new rank every 5 points starting at 5.
 * Members with points but below the first rung are listed as commoners still
 * earning their name.
 */

const pointsStore = require('../../src/pointsStore');
const nobilityRanks = require('../../flavor_text/nobilityRanks');

// How many nobles to proclaim at most (also keeps the reply under Discord's
// 2000-character message limit).
const MAX_NOBLES = 25;

// The highest rank whose threshold the member has reached, or null if they
// are still a commoner.
const titleFor = (points) => {
    const ranks = nobilityRanks();
    let earned = null;
    for (const rank of ranks) {
        if (points >= rank.points) earned = rank;
        else break;
    }
    return earned;
};

/* Placeholder: assign the member's earned title as a real Discord role.
 * Intentionally not implemented yet — when we're ready, this is where the
 * bot will create/find the role named after the rank and add the member to
 * it (and remove their previous rank's role).
 */
// eslint-disable-next-line no-unused-vars
const assignNobilityRole = async (guild, userId, rank) => {
    // TODO: role assignment on promotion. Requires the Manage Roles permission
    // and a role-hierarchy position below the bot's own role.
};

const nobility = function (interaction) {
    const guild = interaction.guild;

    return pointsStore.getLeaderboard(guild.id, MAX_NOBLES)
        .then((leaderboard) => {
            if (!leaderboard.length) {
                return interaction.editReply('Hark! The royal ledger names no nobles yet. Win the weekly chronicle to earn thy first station!');
            }

            const lines = leaderboard.map((entry, index) => {
                const rank = titleFor(entry.points);
                const points = entry.points === 1 ? 'point' : 'points';
                const station = rank
                    ? `**${rank.title}**`
                    : '*a commoner, yet earning their name*';
                return `${index + 1}. ${station} — ${entry.displayName} (${entry.points} ${points})`;
            });

            const header = `**THE PEERAGE OF THE REALM**\n\n` +
                `*Hear ye! The Herald proclaims the standing nobility, from the loftiest station to the humblest:*\n\n`;
            const footer = `\n\n*Rise in station through the weekly chronicle: podium finishes and marks of favor both earn points, and a new title awaits every 5.*`;

            // Discord caps messages at 2000 characters; a long peerage is split
            // across follow-up messages rather than truncated.
            const MAX_MESSAGE = 2000;
            const chunks = [];
            let current = header;
            for (const line of lines) {
                if ((current + line + footer).length + 1 > MAX_MESSAGE) {
                    chunks.push(current.trimEnd());
                    current = '';
                }
                current += line + '\n';
            }
            chunks.push(current.trimEnd() + footer);

            let sending = interaction.editReply(chunks[0]);
            for (const chunk of chunks.slice(1)) {
                sending = sending.then(() => interaction.followUp(chunk));
            }
            return sending;
        })
        .catch((error) => {
            console.error('Error proclaiming nobility:', error);
            return interaction.editReply('Alack! The royal ledger is sealed to mine eyes at present, Milord. Pray try again anon!');
        });
};

module.exports = {
    description: 'Proclaim the ranked nobility of the realm and their standings',
    category: 'NOBLE ANNOUNCEMENTS',
    run: nobility,
};
