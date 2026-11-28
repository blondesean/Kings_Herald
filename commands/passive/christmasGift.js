/* Passive behavior: the Christmas gift.
 *
 * On Christmas morning, 11 AM Eastern on December 25 (an hour before the shop
 * opens), the Herald dresses up as Santa, badly, and gives every member of the
 * server CHRISTMAS_POINTS points, pinging each of them by name. Every member
 * who isn't a bot counts, whether or not they're on the points ledger yet.
 *
 * The gift goes straight onto the running `points` ledger via
 * pointsStore.addPoints, like the October Halloween treat
 * (commands/passive/halloweenTreat.js), so it counts toward /nobility titles
 * and shows up in the recap's week-over-week figure.
 *
 * Scheduled with a date-restricted cron in Eastern time. Like the other
 * schedules it lives only in the running process: a restart at that minute
 * skips the gift.
 *
 * A manual /christmas_gift preview (commands/passive/preview) rehearses it in
 * the current channel without awarding points or pinging anyone.
 *
 * Exposes:
 *   scheduleChristmasGift(client) - registers the cron job (call once, on ready)
 *   runChristmasGift(client, opts) - gives the gift once; reused by the preview
 *   getScheduledFireTime() - today's fire time, for /harold_time
 */

const cron = require('node-cron');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { easternParts, atEastern } = require('../../src/easternTime');
const flavor = require('../../flavor_text');

// 11 AM on December 25, Eastern local time.
const CRON_EXPRESSION = '0 11 25 12 *';
const TIMEZONE = 'America/New_York';
const GIFT_HOUR = 11;
const CHRISTMAS_POINTS = 5;
const MESSAGE_LIMIT = 2000; // Discord's cap on one message's length

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// The speech, then every mention, split across as many messages as Discord's
// length cap needs. The first message carries the speech.
const packMessages = (speech, mentions) => {
    const messages = [];
    let current = `${speech}\n\n`;
    let fresh = true;
    for (const mention of mentions) {
        const piece = fresh ? mention : ` ${mention}`;
        if (current.length + piece.length > MESSAGE_LIMIT) {
            messages.push(current.trimEnd());
            current = mention;
        } else {
            current += piece;
        }
        fresh = false;
    }
    messages.push(current.trimEnd());
    return messages;
};

/* Give the gift once.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to actually award the points and ping everyone
 *                   (default: false)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 */
const runChristmasGift = async function (client, options = {}) {
    const { guild, targetChannel, persist = false, runLabel = persist ? 'scheduled' : 'preview' } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'treat', findAnnounceChannel);
            if (!channel) {
                console.log(`Christmas gift: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const members = Array.from((await g.members.fetch()).values()).filter((m) => !m.user.bot);
            if (!members.length) {
                console.log(`Christmas gift (guild ${g.id}) [${runLabel}]: no members to gift; skipping.`);
                continue;
            }

            // One member at a time, so a failed write leaves out only that
            // member, and only those whose gift landed are named.
            let gifted = members;
            if (persist) {
                gifted = [];
                for (const member of members) {
                    try {
                        await pointsStore.addPoints(g.id, [{ userId: member.id, displayName: member.displayName, points: CHRISTMAS_POINTS }], 'christmas');
                        gifted.push(member);
                    } catch (storeError) {
                        console.error(`Christmas gift: failed to give ${member.displayName} (${member.id}) points:`, storeError.message);
                    }
                }
                if (!gifted.length) continue;
            }

            console.log(`Christmas gift (guild ${g.id}) [${runLabel}]: ${CHRISTMAS_POINTS} points to ${gifted.length} of ${members.length} member(s)${persist ? '' : ' (not persisted)'}.`);

            const speech = pick(flavor.christmasGiftLines(CHRISTMAS_POINTS));
            const head = persist ? speech : `${speech}\n\n${flavor.christmasGiftRehearsalNote()}`;
            const messages = packMessages(head, gifted.map((m) => `<@${m.id}>`));
            // A rehearsal shows the mentions but notifies no one. Each message
            // allows only its own mentions: Discord takes at most 100 ids per
            // message, and the length cap keeps a message's mentions under that.
            for (const content of messages) {
                const ids = [...content.matchAll(/<@(\d+)>/g)].map((m) => m[1]);
                await channel.send({ content, allowedMentions: { users: persist ? ids : [] } });
            }
        } catch (guildError) {
            console.error(`Christmas gift failed for guild "${g.name}":`, guildError);
        }
    }
};

/* Register the Christmas morning gift. Call once after the client is ready. */
const scheduleChristmasGift = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Christmas gift: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            console.log('Running scheduled Christmas gift...');
            runChristmasGift(client, { persist: true }).catch((error) =>
                console.error('Scheduled Christmas gift failed:', error)
            );
        },
        { timezone: TIMEZONE }
    );

    console.log(`Christmas gift scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}), ${CHRISTMAS_POINTS} points to every member on Christmas morning.`);
};

// Today's gift time as a Date, or null on any day but Christmas or once it
// has passed. Like the Halloween treat's check, this reads the schedule, not
// stored state.
const getScheduledFireTime = () => {
    const now = new Date();
    const today = easternParts(now);
    if (today.month !== 12 || today.day !== 25) return null;
    const fireAt = atEastern(today, GIFT_HOUR);
    return now < fireAt ? fireAt : null;
};

module.exports = { scheduleChristmasGift, runChristmasGift, getScheduledFireTime, packMessages };
