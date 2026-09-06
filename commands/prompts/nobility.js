/* /nobility - proclaim the realm's nobles, highest station first.
 *
 * Reads the weekly-recap points ledger (DynamoDB via ../../src/pointsStore)
 * and lists every member with points, top to bottom, with their earned title
 * and current tally. Titles come from the ladder in
 * flavor_text/nobilityRanks.js: Peasant at 0 points, then a new rank starting
 * at 5 points, with the step between rungs widening as the ladder climbs
 * (see that file for the breakdown).
 *
 * buildNobilityChunks is also called directly by weeklyRecap.js, which
 * proclaims the peerage right after posting each week's recap.
 */

const pointsStore = require('../../src/pointsStore');
const { titleFor } = require('../../src/nobilityTitle');

// How many nobles to proclaim at most (also keeps a reply under Discord's
// 2000-character message limit).
const MAX_NOBLES = 25;

// Discord caps messages at 2000 characters; a long peerage is split across
// multiple messages rather than truncated.
const MAX_MESSAGE = 2000;

/* Build the peerage proclamation as an array of message-ready chunks (each
 * under Discord's 2000-character limit), or null if the leaderboard is
 * empty. `leaderboard` is pointsStore.getLeaderboard's
 * [{ userId, displayName, points }].
 */
const buildNobilityChunks = (leaderboard) => {
    if (!leaderboard.length) return null;

    const lines = leaderboard.map((entry, index) => {
        const rank = titleFor(entry.points);
        const points = entry.points === 1 ? 'point' : 'points';
        return `${index + 1}. **${rank.title}** — ${entry.displayName} (${entry.points} ${points})`;
    });

    const header = `**THE PEERAGE OF THE REALM**\n\n` +
        `*Hear ye! The Herald proclaims the standing nobility, from the loftiest station to the humblest:*\n\n`;
    const footer = `\n\n*Rise in station through the weekly chronicle: podium finishes and marks of favor both earn points, and a new title awaits at every rung.*`;

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

    return chunks;
};

const nobility = function (interaction) {
    const guild = interaction.guild;

    return pointsStore.getLeaderboard(guild.id, MAX_NOBLES)
        .then((leaderboard) => {
            const chunks = buildNobilityChunks(leaderboard);
            if (!chunks) {
                return interaction.editReply('Hark! The royal ledger names no nobles yet. Win the weekly chronicle to earn thy first station!');
            }

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
    buildNobilityChunks,
    MAX_NOBLES,
};
