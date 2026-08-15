/* Shared helper: the role members can join via /trivia_signup to be pinged
 * when the daily trivia round posts (commands/passive/trivia.js). Looked up
 * by name per guild rather than stored anywhere — Discord persists the role
 * itself, so nothing needs to survive a bot restart.
 */

const TRIVIA_ROLE_NAME = "Hear Ye Trivia";
const TRIVIA_ROLE_COLOR = 0xd4af37; // heraldic gold, matching the trivia embed

// Read-only lookup — does not require Manage Roles. Used when posting a
// round: if no one has ever signed up (so the role was never created),
// trivia should still post fine, just without a ping.
const findTriviaRole = (guild) =>
    guild.roles.cache.find((role) => role.name === TRIVIA_ROLE_NAME) || null;

// Creates the role on first signup. Requires the Manage Roles permission.
const getOrCreateTriviaRole = async (guild) => {
    const existing = findTriviaRole(guild);
    if (existing) return existing;

    return guild.roles.create({
        name: TRIVIA_ROLE_NAME,
        mentionable: true,
        color: TRIVIA_ROLE_COLOR,
        reason: 'Auto-created for /trivia_signup',
    });
};

module.exports = { TRIVIA_ROLE_NAME, findTriviaRole, getOrCreateTriviaRole };
