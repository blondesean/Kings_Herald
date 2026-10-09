/* Passive behavior: the daily birthday blessing.
 *
 * Every day at 9 AM Eastern the Herald checks a private birthday list. Each
 * row names a member and their birthdate; when today (Eastern) is that
 * member's birthday, they earn one point per year of age, announced in
 * character. The list is a CSV file kept out of git and out of the Docker
 * image (see .gitignore and .dockerignore), so it isn't in the repo.
 *
 * File format (header row optional), one member per line:
 *   name,birthdate
 *   Sean,1990-03-14
 * `name` is matched case-insensitively against the member's server nickname,
 * display name, username and global name. The birthdate is YYYY-MM-DD; only
 * the month and day decide whether it's today, and the year gives the age.
 * Lines that don't parse are skipped with a log line. Where two members match
 * one name, the first found wins.
 *
 * The file path comes from BIRTHDAYS_FILE, defaulting to
 * private/birthdays.csv. Birthdates are never posted; the announcement only
 * names the member and the age-based points.
 *
 * Points go onto the ledger through pointsStore.addPoints, like the other
 * awards. A manual /birthdays preview (commands/passive/preview) runs the same
 * check in the current channel without awarding points or pinging anyone.
 *
 * Exposes:
 *   scheduleBirthdays(client) - registers the daily cron job (call once, on ready)
 *   runBirthdays(client, opts) - runs one check; reused by the preview command
 *   parseBirthdays(text) - the CSV parser, exported for the tests
 *   ageOn(birthdate, today) - whole years between two { year, month, day } dates
 */

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { atEastern } = require('../../src/easternTime');
const flavor = require('../../flavor_text');

const CRON_EXPRESSION = '0 9 * * *';
const TIMEZONE = 'America/New_York';
const DEFAULT_FILE = path.join(__dirname, '..', '..', 'private', 'birthdays.csv');

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Today's calendar date in Eastern time, as { year, month, day }. The
// container clock is UTC, so this goes through Intl like the trivia does.
const easternToday = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { year: get('year'), month: get('month'), day: get('day') };
};

// Whole years from `birthdate` to `today`, both { year, month, day }. A
// birthdate after today gives 0.
const ageOn = (birthdate, today) => {
    let age = today.year - birthdate.year;
    if (today.month < birthdate.month || (today.month === birthdate.month && today.day < birthdate.day)) age -= 1;
    return Math.max(0, age);
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Parses the CSV text into [{ name, birthdate: { year, month, day } }].
// Splits on the last comma so a name containing a comma still works.
const parseBirthdays = (text, warn = console.log) => {
    const rows = [];
    text.split(/\r?\n/).forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const comma = trimmed.lastIndexOf(',');
        const name = comma === -1 ? '' : trimmed.slice(0, comma).trim();
        const dateText = comma === -1 ? '' : trimmed.slice(comma + 1).trim();
        if (index === 0 && name.toLowerCase() === 'name') return; // header row

        const match = DATE_PATTERN.exec(dateText);
        const month = match ? Number(match[2]) : 0;
        const day = match ? Number(match[3]) : 0;
        const valid = match && month >= 1 && month <= 12 && day >= 1 && day <= 31;
        if (!name || !valid) {
            warn(`Birthdays: skipping line ${index + 1} (expected "name,YYYY-MM-DD").`);
            return;
        }
        rows.push({ name, birthdate: { year: Number(match[1]), month, day } });
    });
    return rows;
};

const readBirthdays = () => {
    const file = process.env.BIRTHDAYS_FILE || DEFAULT_FILE;
    try {
        return parseBirthdays(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Birthdays: no list at ${file}; nothing to celebrate.`);
            return [];
        }
        throw error;
    }
};

// The member whose nickname, display name, username or global name matches
// `name` (case-insensitively), or null. Bots never count.
// A Discord user ID (17-20 digits) matches exactly. Anything else is matched by
// name, which is looser: names can change or clash.
const DISCORD_ID_PATTERN = /^\d{17,20}$/;
const findMember = (members, name) => {
    if (DISCORD_ID_PATTERN.test(name)) {
        return members.find((m) => !m.user.bot && m.id === name) || null;
    }
    const wanted = name.toLowerCase();
    return members.find((m) =>
        !m.user.bot && [m.nickname, m.displayName, m.user.username, m.user.globalName]
            .some((n) => n && n.toLowerCase() === wanted)
    ) || null;
};

/* Run one check.
 * options:
 *   guild         - a single guild to process (default: all guilds)
 *   targetChannel - where to post (default: each guild's announce channel)
 *   persist       - whether to award points and ping the member (default: false)
 *   today         - override today's date, { year, month, day } (for tests)
 *   rows          - override the birthday list (for tests)
 *   runLabel      - tags CloudWatch log lines (default: "scheduled" if
 *                   persist, else "preview")
 */
const runBirthdays = async function (client, options = {}) {
    const {
        guild,
        targetChannel,
        persist = false,
        today = easternToday(),
        rows = readBirthdays(),
        runLabel = persist ? 'scheduled' : 'preview',
    } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());

    const due = rows.filter((r) => r.birthdate.month === today.month && r.birthdate.day === today.day);
    if (!due.length) {
        console.log(`Birthdays [${runLabel}]: nobody's birthday today.`);
        return;
    }

    for (const g of guilds) {
        try {
            const channel = targetChannel || await resolveChannel(g, 'birthdays', findAnnounceChannel);
            if (!channel) {
                console.log(`Birthdays: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const members = Array.from((await g.members.fetch()).values());
            const awards = [];
            const awarded = new Set(); // one birthday per member, even with two rows
            for (const row of due) {
                const member = findMember(members, row.name);
                if (!member) {
                    console.log(`Birthdays (guild ${g.id}) [${runLabel}]: "${row.name}" is due today but is not a member here.`);
                    continue;
                }
                if (awarded.has(member.id)) continue;
                const age = ageOn(row.birthdate, today);
                if (age < 1) continue;
                awarded.add(member.id);
                awards.push({ userId: member.id, displayName: member.displayName, points: age, age });
            }
            if (!awards.length) continue;

            for (const award of awards) {
                console.log(`Birthdays (guild ${g.id}) [${runLabel}]: ${award.displayName} (${award.userId}) turns ${award.age}, ${award.points} points${persist ? '' : ' (not persisted)'}.`);
            }

            if (persist) {
                try {
                    await pointsStore.addPoints(g.id, awards.map(({ userId, displayName, points }) => ({ userId, displayName, points })));
                } catch (storeError) {
                    console.error('Birthdays: failed to persist points:', storeError.message);
                    continue;
                }
            }

            const lines = awards.map((a) => pick(flavor.birthdayLines(`<@${a.userId}>`, a.age, a.points)));
            const note = persist ? '' : `\n\n${flavor.birthdayRehearsalNote()}`;
            // A rehearsal shows the mentions but doesn't notify anyone.
            await channel.send({
                content: lines.join('\n') + note,
                allowedMentions: { users: persist ? awards.map((a) => a.userId) : [] },
            });
        } catch (guildError) {
            console.error(`Birthdays failed for guild "${g.name}":`, guildError);
        }
    }
};

/* Register the daily birthday check. Call once after the client is ready. */
const scheduleBirthdays = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Birthdays: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            console.log('Running scheduled birthday check...');
            runBirthdays(client, { persist: true }).catch((error) =>
                console.error('Scheduled birthday check failed:', error)
            );
        },
        { timezone: TIMEZONE }
    );

    console.log(`Birthdays scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}), 9 AM Eastern daily, points equal to age on each birthday.`);
};

// Today's 9 AM Eastern check as a Date, or null once it has passed. The cron
// re-arms it every day, so this reads the schedule rather than stored state.
const getScheduledFireTime = () => {
    const now = new Date();
    const fireAt = atEastern(easternToday(now), 9);
    return now < fireAt ? fireAt : null;
};

module.exports = { scheduleBirthdays, runBirthdays, parseBirthdays, ageOn, getScheduledFireTime };
