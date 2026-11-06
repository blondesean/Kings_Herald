/* /patchnotes - the past week's changes to the herald, grouped by day, shown
 * only to whoever asked. The player-facing cousin of the admin-only
 * /patch_notes (commands/prompts/patch_notes.js), which posts a public
 * announcement instead.
 *
 * Like /patch_notes it reads UPDATELOG.md, the only changelog that ships in
 * the deployed image (see scripts/updatelog.js for the format parsed here),
 * so a change shows up once UPDATELOG.md has been regenerated at merge.
 */

const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const flavor = require('../../flavor_text');

const EMBED_COLOR = 0xd4af37; // heraldic gold
const WINDOW_DAYS = 7;
const UPDATELOG_PATH = path.join(__dirname, '..', '..', 'UPDATELOG.md');

// Pure repo bookkeeping, never worth showing to players.
const SKIP_SUBJECTS = new Set(['Regenerate UPDATELOG.md']);

// "## 2026-11-02" date headers and "- Fixed the thing (`abc1234`)" bullets.
const DATE_LINE = /^## (\d{4}-\d{2}-\d{2})$/;
const COMMIT_LINE = /^- (.+?) \(`[0-9a-f]+`\)$/;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Newest-first [{ date, subjects }] for dates on or after `cutoff`
// (YYYY-MM-DD, compared as strings). Returns null if the file couldn't be read.
const readChangesSince = (cutoff) => {
    let content;
    try {
        content = fs.readFileSync(UPDATELOG_PATH, 'utf8');
    } catch (error) {
        console.error('patchnotes: could not read UPDATELOG.md:', error.message);
        return null;
    }

    const days = [];
    let current = null;
    for (const line of content.split(/\r?\n/)) {
        const dateMatch = line.match(DATE_LINE);
        if (dateMatch) {
            current = dateMatch[1] >= cutoff ? { date: dateMatch[1], subjects: [] } : null;
            if (current) days.push(current);
            continue;
        }
        const commitMatch = line.match(COMMIT_LINE);
        if (current && commitMatch) {
            const subject = commitMatch[1].trim();
            if (!SKIP_SUBJECTS.has(subject)) current.subjects.push(subject);
        }
    }
    return days.filter((day) => day.subjects.length > 0);
};

// Discord caps embed descriptions at 4096 characters; drop trailing lines
// until it fits, noting how many were cut (same approach as patch_notes.js).
const DESCRIPTION_MAX = 4096;
const fitLines = (lines) => {
    for (let kept = lines.length; kept > 0; kept--) {
        const omitted = lines.length - kept;
        const suffix = omitted ? `\n...and ${omitted} more` : '';
        const text = lines.slice(0, kept).join('\n') + suffix;
        if (text.length <= DESCRIPTION_MAX) return text;
    }
    return lines[0].slice(0, DESCRIPTION_MAX);
};

const patchnotes = async function (interaction) {
    const member = interaction.member;
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const days = readChangesSince(cutoff);
    if (days === null) {
        await interaction.editReply("Alack! The royal scribes' ledger could not be read.");
        return;
    }
    if (days.length === 0) {
        console.log(`Patchnotes: ${member.displayName} (${member.id}) asked, but nothing changed since ${cutoff}.`);
        await interaction.editReply('Forsooth, the royal scribes have sealed no new decrees this past week.');
        return;
    }

    const lines = [];
    for (const day of days) {
        if (lines.length) lines.push('');
        lines.push(`**${day.date}**`);
        for (const subject of day.subjects) lines.push(`• ${subject}`);
    }
    const description = `${pick(flavor.patchNotesIntroLines())}\n\n${fitLines(lines)}`;

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setTitle("This Week's Decrees")
        .setDescription(description);

    const total = days.reduce((sum, day) => sum + day.subjects.length, 0);
    console.log(`Patchnotes: ${member.displayName} (${member.id}) read ${total} change(s) across ${days.length} day(s) since ${cutoff}.`);
    await interaction.editReply({ embeds: [embed] });
};

module.exports = {
    description: "See the past week's new additions to the Herald",
    category: 'UTILITY',
    ephemeral: true, // only whoever asked sees the list
    run: patchnotes,
};
