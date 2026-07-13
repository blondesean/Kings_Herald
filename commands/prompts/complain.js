/* /complain <grievance> - records a user's comment as a GitHub issue.
 *
 * The Herald takes the grievance verbatim and files it as an issue in the repo,
 * titled "Request from <Discord tag> on <YYYY-MM-DD>", then replies in character
 * with a link to the issue.
 *
 * Auth: a GitHub token in GITHUB_TOKEN (a fine-grained PAT scoped to Issues:write
 * on the repo). The issue is authored by whoever owns that token. Repo defaults
 * to blondesean/Kings_Herald and can be overridden with GITHUB_REPO.
 */

const { ApplicationCommandOptionType } = require('discord.js');

const REPO = process.env.GITHUB_REPO || 'blondesean/Kings_Herald';

// Keep complaints reasonable: GitHub allows huge bodies, but we cap to stay sane.
const MAX_LENGTH = 4000;

// Per-user cooldown to curb accidental or spammy double-filing.
const COOLDOWN_MS = 60 * 1000;
const lastComplaintAt = new Map();

// YYYY-MM-DD in Eastern time, matching the weekly recap's timezone choice.
const easternDate = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());

// A clean handle for the user: "name#1234" for legacy accounts, "@name" otherwise.
const handleFor = (author) =>
    author.discriminator && author.discriminator !== '0'
        ? `${author.username}#${author.discriminator}`
        : `@${author.username}`;

const complain = async function (interaction) {
    // Required slash option, so it's always present; length is still ours to police.
    const grievance = interaction.options.getString('grievance').trim();

    if (!grievance) {
        await interaction.editReply('Pray, good sir, speak thy grievance!');
        return;
    }

    if (grievance.length > MAX_LENGTH) {
        await interaction.editReply(`Forsooth, thy petition is most verbose! Pray shorten it beneath ${MAX_LENGTH} characters, Milord.`);
        return;
    }

    if (!process.env.GITHUB_TOKEN) {
        console.error('GITHUB_TOKEN not set; cannot file complaint.');
        await interaction.editReply('Alack! The royal seal is missing and I cannot inscribe thy grievance in the ledger at this time.');
        return;
    }

    // Cooldown check
    const now = Date.now();
    const last = lastComplaintAt.get(interaction.user.id) || 0;
    if (now - last < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
        await interaction.editReply(`Patience, good sir! Thou must wait ${wait} more second(s) ere lodging another grievance.`);
        return;
    }

    const tag = handleFor(interaction.user);
    const title = `Request from ${tag} on ${easternDate()}`;

    // Body: an in-character preamble, the user's words verbatim in a blockquote,
    // then a small attribution footer for traceability.
    const quoted = grievance.split('\n').map((line) => `> ${line}`).join('\n');
    const guildName = interaction.guild?.name || 'the realm';
    const channelName = interaction.channel?.name ? `#${interaction.channel.name}` : 'the court';
    const body = [
        'Hear ye! A petition from the realm, transcribed faithfully by thy Herald:',
        '',
        quoted,
        '',
        '---',
        `*Filed by the King's Herald on behalf of \`${tag}\` from ${channelName} in ${guildName}.*`,
    ].join('\n');

    // Mark the cooldown before the request so rapid double-sends are blocked.
    lastComplaintAt.set(interaction.user.id, now);

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json',
                'User-Agent': 'Kings_Herald-bot',
            },
            body: JSON.stringify({ title, body }),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`GitHub issue creation failed (${response.status}): ${errText}`);
            lastComplaintAt.delete(interaction.user.id); // let them retry on our failure
            await interaction.editReply('Alack! The royal scribes could not record thy grievance at this time. Pray try again anon, Milord.');
            return;
        }

        const issue = await response.json();
        console.log(`Filed complaint as issue #${issue.number} for ${tag}`);
        await interaction.editReply(`Thy grievance hath been recorded in the royal ledger, good sir! Behold: ${issue.html_url}`);
    } catch (error) {
        console.error('Error filing complaint:', error);
        lastComplaintAt.delete(interaction.user.id);
        await interaction.editReply('By my troth! Some misfortune befell the royal post and thy grievance was not delivered. Pray try again, Milord.');
    }
};

module.exports = {
    description: 'Petition the crown; thy words are inscribed in the royal ledger',
    category: 'UTILITY',
    options: [
        {
            name: 'grievance',
            description: 'Thy complaint, recorded verbatim in the royal ledger',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: complain,
};
