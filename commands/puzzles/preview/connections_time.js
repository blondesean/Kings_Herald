/* /connections_time - report when today's scheduled Connections puzzle is
 * set to fire.
 *
 * Preview/admin command beside the scheduled `connections` passive
 * behavior. adminOnly + hidden, matching connections.js's own preview
 * command. ephemeral keeps the reply visible only to the admin who ran it.
 * Reports the in-memory fire time armed at the 9 AM Eastern window open
 * (see scheduleConnectionsPuzzle in ../connections.js) — that state isn't
 * persisted, so right after a restart it reads as "not yet armed" until the
 * next window opens, which is the main thing this command is for: checking
 * whether a deploy is safe to do without silently skipping today's puzzle.
 *
 * Reported in Eastern time (the window itself is Eastern-anchored) rather
 * than Discord's usual per-viewer local timestamp, so it always reads the
 * same regardless of who's asking.
 */

const { getScheduledFireTime } = require('../connections');

const TIMEZONE = 'America/New_York';

const formatEastern = (date) =>
    new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
    }).format(date);

const connectionsTime = async function (interaction) {
    const fireAt = getScheduledFireTime();

    if (!fireAt) {
        await interaction.editReply(
            "No Connections puzzle is armed at present, Milord — either today's window hasn't opened yet (9 AM Eastern), or today's puzzle has already run."
        );
        return;
    }

    await interaction.editReply(`Today's Connections puzzle is armed to fire at ${formatEastern(fireAt)}.`);
};

module.exports = {
    description: "Report when today's scheduled Connections puzzle is set to fire, in Eastern time (visible only to you)",
    category: 'ROYAL CHRONICLES',
    hidden: true, // out of the generated /help
    adminOnly: true, // registered with Discord, but only members with Manage Server can see/run it
    ephemeral: true, // visible only to whoever ran it
    run: connectionsTime,
};
