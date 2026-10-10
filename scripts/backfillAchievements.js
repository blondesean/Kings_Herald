/* One-time backfill of achievement counters from the bot's CloudWatch logs,
 * for the goals whose history isn't stored anywhere else: correct daily
 * trivia answers, correct WoW trivia answers, Connections and Word Ladders
 * helped solve, final Connections groups solved, would-you-rather majorities
 * predicted, and weekly recap podium places. Only scheduled runs count, never previews. Stat
 * goals (duels, Death Rolls, fit, gear, points, class, race, title, pose) need no backfill: the
 * achievements sweep reads them straight from DynamoDB.
 *
 * Usage:
 *   1. Export the logs (CloudWatch keeps 30 days), tab-separated timestamp
 *      and message per line:
 *        aws logs filter-log-events --log-group-name /ecs/kings-herald \
 *          --query "events[].[timestamp,message]" --output text > logs.txt
 *   2. Dry run, printing the counts:   node scripts/backfillAchievements.js logs.txt
 *   3. Write them:  POINTS_TABLE_NAME=<table> node scripts/backfillAchievements.js logs.txt --apply
 *
 * Each member is written at most once (pointsStore.bumpCounters with
 * once=true), so running --apply again changes nothing. Run it before
 * deploying the achievements, so no event is counted by both the logs and
 * the live hooks; the first sweep after the deploy unlocks and pays out.
 */

const fs = require('fs');
const catalog = require('../commands/passive/shopCatalog');

const ID = /\((\d{15,20})\)/g;
const lastId = (text) => {
    const ids = [...text.matchAll(ID)];
    return ids.length ? ids[ids.length - 1][1] : null;
};
const nameBefore = (text, id) => text.slice(0, text.lastIndexOf(`(${id})`)).trim();

/* counts: { [guildId]: { [userId]: { displayName, counts: { key: n } } } } */
const parseLogs = (text) => {
    const counts = {};
    const myths = {}; // guildId -> the longest week in voice seen
    const bump = (guildId, userId, displayName, key, by = 1) => {
        const guild = counts[guildId] || (counts[guildId] = {});
        const member = guild[userId] || (guild[userId] = { displayName, counts: {} });
        member.counts[key] = (member.counts[key] || 0) + by;
    };

    const triviaHeaders = new Map(); // timestamp -> guildId, for scheduled rounds only
    const connections = new Map(); // guildId -> Map(userId -> name), this session's solvers
    const lastSolver = new Map(); // guildId -> [userId, name], who solved the latest group
    const ladders = new Map(); // guildId -> Map(userId -> name), this ladder's contributors
    const wyr = new Map(); // guildId -> [{ id, name, pred }], this round's answers

    // A recap breakdown runs over several lines: a header, then each member,
    // then that member's award lines. It ends at the first line of any other kind.
    let recap = null; // { guildId, current: [id, name], placed: Map(id -> name) }
    const endRecap = () => {
        if (recap) for (const [id, name] of recap.placed) bump(recap.guildId, id, name, 'podiums');
        recap = null;
    };

    const lines = text.split(/\r?\n/).filter(Boolean).map((line) => {
        const tab = line.indexOf('\t');
        return { ts: line.slice(0, tab), msg: line.slice(tab + 1) };
    }).sort((a, b) => Number(a.ts) - Number(b.ts));

    for (const { ts, msg } of lines) {
        let m;
        if (recap) {
            if ((m = msg.match(/^ {2}(\S.*): \d+ total$/))) {
                const id = lastId(m[1]);
                recap.current = id ? [id, nameBefore(m[1], id)] : null;
                continue;
            }
            if ((m = msg.match(/^ {4}\+\d+ (\w+) — /))) {
                if (recap.current && ['podium', 'chatter', 'voice', 'puzzle'].includes(m[1])) recap.placed.set(...recap.current);
                // The week's longest time in voice, for the /myths record.
                const hours = msg.match(/most time in voice \((\d+(?:\.\d+)?)h\)/);
                const seconds = hours && Math.round(Number(hours[1]) * 3600);
                const best = myths[recap.guildId];
                if (seconds && recap.current && (!best || seconds > best.value)) {
                    myths[recap.guildId] = { value: seconds, holderId: recap.current[0], holderName: recap.current[1], day: new Date(Number(ts)).toISOString().slice(0, 10) };
                }
                continue;
            }
            endRecap();
        }

        if ((m = msg.match(/^Weekly recap breakdown \(\[scheduled\] guild (\d+)\):$/))) {
            recap = { guildId: m[1], current: null, placed: new Map() };
        } else if ((m = msg.match(/^Would you rather \(\[scheduled\] guild (\d+)\): ".*" — A: /))) {
            wyr.set(m[1], []);
        } else if ((m = msg.match(/^ {2}(.+): prefers [AB-], predicts ([AB-])$/))) {
            // Answer lines carry no guild, so they join the round that is open.
            const id = lastId(m[1]);
            const open = [...wyr.values()].pop();
            if (id && open) open.push({ id, name: nameBefore(m[1], id), pred: m[2] });
        } else if ((m = msg.match(/^Would you rather \(\[scheduled\] guild (\d+)\): status \w+.*?(?:group picked ([AB]))?, \d+ scored\.$/))) {
            if (m[2]) for (const a of wyr.get(m[1]) || []) if (a.pred === m[2]) bump(m[1], a.id, a.name, 'wyr_predictions');
            wyr.delete(m[1]);
        } else if ((m = msg.match(/^Shop \(guild (\d+)\): (.+?) bought .+ for (\d+)/))) {
            const id = lastId(m[2]);
            if (id) bump(m[1], id, nameBefore(m[2], id), 'shop_spent', Number(m[3]));
        } else if ((m = msg.match(/^Shop \(guild (\d+)\): (.+?) swapped .+ for (.+) \(\d{4}-\d{2}-\d{2}\)\.$/))) {
            // A title swap logs no price, so it comes from the catalog.
            const id = lastId(m[2]);
            const title = catalog.ALL.find((e) => e.name === m[3]);
            if (id && title) bump(m[1], id, nameBefore(m[2], id), 'shop_spent', title.price);
        } else if ((m = msg.match(/^Trivia round \(\[scheduled\] guild (\d+)\): ".*" — correct answer/))) {
            triviaHeaders.set(ts, m[1]);
        } else if (/^ {2}.+: picked [A-D] — \+\d+ correct/.test(msg) && triviaHeaders.has(ts)) {
            const id = lastId(msg.split(': picked')[0]);
            if (id) bump(triviaHeaders.get(ts), id, nameBefore(msg, id), 'trivia');
        } else if ((m = msg.match(/^WoW trivia \(scheduled\) \(guild (\d+)\): \[\d+\/\d+\] winner (.+)\.$/))) {
            const id = lastId(m[2]);
            if (id) bump(m[1], id, nameBefore(m[2], id), 'wow_trivia');
        } else if ((m = msg.match(/^Connections \(scheduled\) \(guild (\d+)\): (.+) solved "/))) {
            const id = lastId(m[2]);
            if (!connections.has(m[1])) connections.set(m[1], new Map());
            if (id) {
                connections.get(m[1]).set(id, nameBefore(m[2], id));
                lastSolver.set(m[1], [id, nameBefore(m[2], id)]);
            }
        } else if ((m = msg.match(/^Connections \(scheduled\) \(guild (\d+)\): session ended — (\d+)\/(\d+) solved/))) {
            if (m[2] === m[3]) {
                for (const [id, name] of connections.get(m[1]) || []) bump(m[1], id, name, 'connections');
                if (lastSolver.has(m[1])) bump(m[1], ...lastSolver.get(m[1]), 'clutch');
            }
            connections.delete(m[1]);
            lastSolver.delete(m[1]);
        } else if ((m = msg.match(/^Word ladder \(scheduled\) \(guild (\d+)\): (.+) added [A-Z]+ \(step/))) {
            const id = lastId(m[2]);
            if (!ladders.has(m[1])) ladders.set(m[1], new Map());
            if (id) ladders.get(m[1]).set(id, nameBefore(m[2], id));
        } else if ((m = msg.match(/^Word ladder \(scheduled\) \(guild (\d+)\): ended \((\w+)\)/))) {
            if (m[2] === 'solved') {
                for (const [id, name] of ladders.get(m[1]) || []) bump(m[1], id, name, 'ladders');
            }
            ladders.delete(m[1]);
        }
    }
    endRecap();
    return { counts, myths };
};

const main = async () => {
    const [file, flag] = process.argv.slice(2);
    if (!file) {
        console.error('Usage: node scripts/backfillAchievements.js <logs.txt> [--apply]');
        process.exit(1);
    }
    const { counts, myths } = parseLogs(fs.readFileSync(file, 'utf8'));

    for (const [guildId, members] of Object.entries(counts)) {
        console.log(`Guild ${guildId}:`);
        const rows = Object.entries(members).sort((a, b) => a[1].displayName.localeCompare(b[1].displayName));
        for (const [userId, { displayName, counts: c }] of rows) {
            console.log(`  ${displayName.padEnd(28)} ${userId.padEnd(20)} ${Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ')}`);
        }
        const voice = myths[guildId];
        if (voice) console.log(`  Longest week in voice: ${voice.holderName}, ${(voice.value / 3600).toFixed(1)}h on ${voice.day}`);
    }

    if (flag !== '--apply') {
        console.log('\nDry run. Add --apply (with POINTS_TABLE_NAME set) to write these.');
        return;
    }
    if (!process.env.POINTS_TABLE_NAME) {
        console.error('POINTS_TABLE_NAME is not set; nothing written.');
        process.exit(1);
    }
    const pointsStore = require('../src/pointsStore');
    for (const [guildId, members] of Object.entries(counts)) {
        for (const [userId, { displayName, counts: c }] of Object.entries(members)) {
            const result = await pointsStore.bumpCounters(guildId, userId, c, true);
            console.log(`${result ? 'wrote' : 'already backfilled, skipped'}: ${displayName} (${userId})`);
        }
    }
    // A myth only replaces a smaller one, so writing it twice is harmless.
    for (const [guildId, { value, ...details }] of Object.entries(myths)) {
        const set = await pointsStore.setMythIfHigher(guildId, 'voice_week', value, details);
        console.log(`voice myth for guild ${guildId}: ${set ? 'written' : 'a longer week already stands'}`);
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { parseLogs };
