/* /whois <member> - proclaim the titles and roles of a court member.
 *
 * The member arrives as a typed slash-command option, so there is no name
 * parsing or member-list matching here — Discord's picker guarantees a real
 * guild member. The Herald announces up to three of their roles with royal
 * flair, or a basic announcement if they hold no meaningful roles. Also
 * appends their current recap-ladder title (see /nobility and
 * ../../src/nobilityTitle), if they've earned one.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const flavor = require('../../flavor_text');
const pointsStore = require('../../src/pointsStore');
const { titleFor } = require('../../src/nobilityTitle');

const whois = async function (interaction) {
    // A real GuildMember, resolved by Discord from the option.
    const member = interaction.options.getMember('member');
    const displayName = member.displayName;

    console.log(`Starting whois for ${displayName} at ${new Date().toISOString()}`);

    // Special case for the Herald bot itself
    if (member.id === interaction.client.user.id) {
        await interaction.editReply("Just a humble servant at your service, Milord!");
        return;
    }

    // Get user roles, excluding @everyone and bot roles
    const allRoles = member.roles.cache.map((role) => role.name);
    const userRoles = allRoles.filter(role =>
        role !== '@everyone' &&
        !role.toLowerCase().includes('bot') &&
        !role.toLowerCase().includes('muted')
    );

    console.log(`${displayName} has ${userRoles.length} roles: ${userRoles.join(', ')}`);

    // Check if user has admin permissions
    const isAdmin = member.permissions.has('Administrator') ||
                   member.roles.cache.some(role =>
                       role.name.toLowerCase().includes('admin') ||
                       role.permissions.has('Administrator')
                   );

    // Current recap title, if they've earned one (see /nobility).
    let nobilityTitle = null;
    try {
        const points = await pointsStore.getPoints(interaction.guild.id, member.id);
        nobilityTitle = titleFor(points);
    } catch (error) {
        console.error(`Could not look up recap title for ${displayName}:`, error);
    }
    const titleLine = nobilityTitle ? `\n\n**Their current station in the peerage: ${nobilityTitle.title}**` : '';

    // If no meaningful roles, give a basic announcement
    if (userRoles.length === 0) {
        const basicAnnouncements = flavor.basicAnnouncements(displayName);
        let randomAnnouncement = basicAnnouncements[Math.floor(Math.random() * basicAnnouncements.length)];

        if (isAdmin) {
            randomAnnouncement += "\n\n**...and they're also an Admin, Milord!**";
        }
        randomAnnouncement += titleLine;

        await interaction.editReply(randomAnnouncement);
        return;
    }

    // Select up to 3 random roles
    const selectedRoles = [];
    const maxRoles = Math.min(userRoles.length, 3);
    const usedIndices = new Set();

    while (selectedRoles.length < maxRoles) {
        const randomIndex = Math.floor(Math.random() * userRoles.length);
        if (!usedIndices.has(randomIndex)) {
            selectedRoles.push(userRoles[randomIndex]);
            usedIndices.add(randomIndex);
        }
    }

    // Royal adjectives for flair
    const royalAdjectives = flavor.royalAdjectives();

    // Herald announcement templates
    const announcementTemplates = flavor.announcementTemplates(displayName);

    // Select random template
    const template = announcementTemplates[Math.floor(Math.random() * announcementTemplates.length)];

    // Build the announcement
    let announcement = template.opening + "\n" + template.intro + "\n\n";

    // Add the three titles with random adjectives
    for (let i = 0; i < selectedRoles.length; i++) {
        const randomAdj = royalAdjectives[Math.floor(Math.random() * royalAdjectives.length)];
        const titleTemplate = template.titles[i % template.titles.length];
        announcement += titleTemplate.replace("{adj}", randomAdj).replace("{role}", selectedRoles[i]) + "\n";
    }

    // Add closing with final adjective
    const finalAdj = royalAdjectives[Math.floor(Math.random() * royalAdjectives.length)];
    announcement += "\n" + template.closing.replace("{adj}", finalAdj);

    // Add admin announcement if they're an admin
    if (isAdmin) {
        announcement += "\n\n**...and they're also an Admin, Milord!**";
    }
    announcement += titleLine;

    console.log("Herald announcement:", announcement);
    console.log(`Responding at ${new Date().toISOString()}`);
    await interaction.editReply(announcement);
};

module.exports = {
    description: 'Proclaim the titles and roles of any court member',
    category: 'NOBLE ANNOUNCEMENTS',
    options: [
        {
            name: 'member',
            description: 'The court member whose titles shall be proclaimed',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    run: whois,
};
