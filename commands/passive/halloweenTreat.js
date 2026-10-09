/* Passive behavior: the October Halloween treat.
 *
 * Every day at noon Eastern, but only during October, the Herald picks one
 * member at random and gifts them TREAT_POINTS points, announced in
 * character with Halloween flair. The pick is uniform across every member who
 * currently has at least 1 point on the guild's ledger and is still in the
 * server (the ledger keeps people who have since left, so each candidate is
 * checked against the live member list before being drawn). There's no
 * weighting: someone with 1 point is exactly as likely as someone with 200,
 * and the same member can win on more than one day.
 *
 * The gift goes straight onto the running `points` ledger via
 * pointsStore.addPoints, so it counts toward /nobility titles and shows up in
 * the recap's week-over-week figure like any other change. No podium or
 * weekly counter is involved.
 *
 * Scheduled with a month-restricted cron (October only) in Eastern time, so
 * it stays at local noon through the DST change. Like the other schedules it
 * lives only in the running process: a restart at noon skips that day.
 *
 * A manual /halloween_treat preview (commands/passive/preview) rehearses the
 * draw in the current channel without awarding points or pinging the winner.
 *
 * Exposes:
 *   scheduleHalloweenTreat(client) - registers the cron job (call once, on ready)
 *   runHalloweenTreat(client, opts) - runs one draw; reused by the preview command
 */

const cron = require('node-cron');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { easternParts, atEastern } = require('../../src/easternTime');
const flavor = require('../../flavor_text');

// Noon, October only ("10" in the month field), Eastern local time.
const CRON_EXPRESSION = '0 12 * 10 *';
const TIMEZONE = 'America/New_York';
const TREAT_POINTS = 5;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

const shuffle = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// Uniform draw over candidates who are still in the guild: shuffle them, then
// take the first one that resolves to a live, non-bot member. Returns the
// GuildMember, or null if nobody qualifies.
const drawWinner = async (guild, candidates) => {
    for (const candidate of shuffle(candidates)) {
        const member = await guild.members.fetch(candidate.userId).catch(() => null);
        if (member && !member.user.bot) return member;
    }
    return null;
};

/* Run one draw.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to actually award the points and ping the winner
 *                   (default: false)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 */
const runHalloweenTreat = async function (client, options = {}) {
    const { guild, targetChannel, persist = false, runLabel = persist ? 'scheduled' : 'preview' } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'treat', findAnnounceChannel);
            if (!channel) {
                console.log(`Halloween treat: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const ledger = await pointsStore.getLeaderboard(g.id, Infinity);
            const candidates = ledger.filter((entry) => entry.points >= 1);
            const winner = await drawWinner(g, candidates);
            if (!winner) {
                console.log(`Halloween treat (guild ${g.id}) [${runLabel}]: no eligible member with at least 1 point; skipping.`);
                continue;
            }

            // Only announce a gift that actually landed.
            if (persist) {
                try {
                    await pointsStore.addPoints(g.id, [{ userId: winner.id, displayName: winner.displayName, points: TREAT_POINTS }]);
                } catch (storeError) {
                    console.error('Halloween treat: failed to persist points:', storeError.message);
                    continue;
                }
            }

            console.log(`Halloween treat (guild ${g.id}) [${runLabel}]: ${winner.displayName} (${winner.id}) drawn from ${candidates.length} ledger entr${candidates.length === 1 ? 'y' : 'ies'} with points,${TREAT_POINTS} points${persist ? '' : ' (not persisted)'}.`);

            const line = pick(flavor.halloweenTreatLines(`<@${winner.id}>`, TREAT_POINTS));
            const content = persist ? line : `${line}\n\n${flavor.halloweenTreatRehearsalNote()}`;
            // A rehearsal shows the mention but doesn't notify the winner.
            await channel.send({ content, allowedMentions: { users: persist ? [winner.id] : [] } });
        } catch (guildError) {
            console.error(`Halloween treat failed for guild "${g.name}":`, guildError);
        }
    }
};

/* Register the October daily draw. Call once after the client is ready. */
const scheduleHalloweenTreat = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Halloween treat: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            console.log('Running scheduled Halloween treat...');
            runHalloweenTreat(client, { persist: true }).catch((error) =>
                console.error('Scheduled Halloween treat failed:', error)
            );
        },
        { timezone: TIMEZONE }
    );

    console.log(`Halloween treat scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}) — noon Eastern every day in October, ${TREAT_POINTS} points to one random member with at least 1 point.`);
};

// Today's noon Eastern draw as a Date, or null outside October or once it has
// passed. Like the birthday check, this reads the schedule, not stored state.
const getScheduledFireTime = () => {
    const now = new Date();
    const today = easternParts(now);
    if (today.month !== 10) return null;
    const fireAt = atEastern(today, 12);
    return now < fireAt ? fireAt : null;
};

module.exports = { scheduleHalloweenTreat, runHalloweenTreat, getScheduledFireTime };
