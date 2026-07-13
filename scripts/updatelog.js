/* Regenerates UPDATELOG.md from git history: every commit grouped by date,
 * newest first. Run with `npm run updatelog` (or node scripts/updatelog.js)
 * after committing to refresh the log; commit the updated file alongside.
 *
 * The log is generated, not hand-edited — edits to UPDATELOG.md will be
 * overwritten on the next run. To improve an entry, write a better commit
 * message next time; history is the source of truth.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

// The format string is quoted so Windows cmd doesn't treat | as a pipe.
const log = execSync(
    'git log --no-merges "--pretty=format:%ad|%h|%s" --date=short',
    { cwd: repoRoot, encoding: 'utf8' }
);

// Group commit subjects by date, preserving git's newest-first order.
const byDate = new Map();
for (const line of log.split('\n')) {
    const [date, hash, ...subjectParts] = line.split('|');
    if (!date || !hash) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push({ hash, subject: subjectParts.join('|') });
}

const sections = [...byDate.entries()].map(([date, commits]) => {
    const lines = commits.map((c) => `- ${c.subject} (\`${c.hash}\`)`).join('\n');
    return `## ${date}\n\n${lines}`;
});

const content = `# UPDATELOG

A chronicle of the Herald's own history: every change to the realm, by date.

*Generated from git history by \`npm run updatelog\` — do not edit by hand.
Regenerate after committing and commit the refreshed file.*

${sections.join('\n\n')}
`;

fs.writeFileSync(path.join(repoRoot, 'UPDATELOG.md'), content);
console.log(`UPDATELOG.md regenerated: ${byDate.size} dates, ${log.split('\n').length} commits.`);
