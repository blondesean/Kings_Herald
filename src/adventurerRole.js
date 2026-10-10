/* Shared helper: the role members can join via /adventurer_signup to be
 * pinged when the daily boss encounter posts (commands/passive/encounter.js).
 * Looked up by name per guild rather than stored anywhere; Discord persists
 * the role itself, so nothing needs to survive a bot restart. Mirrors
 * src/shopRole.js.
 */

const ADVENTURER_ROLE_NAME = 'Adventurers';
const ADVENTURER_ROLE_COLOR = 0xd4af37; // heraldic gold, matching the encounter embed

// Read-only lookup, no Manage Roles needed. If nobody has signed up yet the
// role doesn't exist, and the encounter still posts, just without a ping.
const findAdventurerRole = (guild) =>
    guild.roles.cache.find((role) => role.name === ADVENTURER_ROLE_NAME) || null;

// Creates the role on first signup. Requires the Manage Roles permission.
const getOrCreateAdventurerRole = async (guild) => {
    const existing = findAdventurerRole(guild);
    if (existing) return existing;

    return guild.roles.create({
        name: ADVENTURER_ROLE_NAME,
        mentionable: true,
        color: ADVENTURER_ROLE_COLOR,
        reason: 'Auto-created for /adventurer_signup',
    });
};

module.exports = { ADVENTURER_ROLE_NAME, findAdventurerRole, getOrCreateAdventurerRole };
