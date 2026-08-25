/* Shared helper: the role members can join via /wow_trivia_signup to be
 * pinged when a /wow_trivia session starts (commands/passive/wowTrivia.js).
 * Looked up by name per guild rather than stored anywhere — Discord persists
 * the role itself, so nothing needs to survive a bot restart. Mirrors
 * src/triviaRole.js exactly; kept as its own role (rather than reusing "Hear
 * Ye Trivia") since the daily trivia and WoW trivia are different games and
 * someone may want a ping for one but not the other. Named after the mage
 * buff spell, since this role is for the court's WoW know-it-alls.
 */

const WOW_TRIVIA_ROLE_NAME = 'Those Buffed with Arcane Intellect';
const WOW_TRIVIA_ROLE_COLOR = 0xd4af37; // heraldic gold, matching the trivia embed

// Read-only lookup — does not require Manage Roles. Used when starting a
// session: if no one has ever signed up (so the role was never created),
// the session should still start fine, just without a ping.
const findWowTriviaRole = (guild) =>
    guild.roles.cache.find((role) => role.name === WOW_TRIVIA_ROLE_NAME) || null;

// Creates the role on first signup. Requires the Manage Roles permission.
const getOrCreateWowTriviaRole = async (guild) => {
    const existing = findWowTriviaRole(guild);
    if (existing) return existing;

    return guild.roles.create({
        name: WOW_TRIVIA_ROLE_NAME,
        mentionable: true,
        color: WOW_TRIVIA_ROLE_COLOR,
        reason: 'Auto-created for /wow_trivia_signup',
    });
};

module.exports = { WOW_TRIVIA_ROLE_NAME, findWowTriviaRole, getOrCreateWowTriviaRole };
