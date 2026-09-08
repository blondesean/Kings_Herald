/* Shared helper: the role members can join via /puzzle_signup to be pinged
 * when the daily Connections puzzle posts (commands/puzzles/connections.js).
 * Looked up by name per guild rather than stored anywhere — Discord persists
 * the role itself, so nothing needs to survive a bot restart. Mirrors
 * src/triviaRole.js and src/wowTriviaRole.js exactly; kept as its own role
 * since a puzzle-inclined member may want this ping without also wanting
 * the (unrelated) trivia ones.
 */

const PUZZLE_ROLE_NAME = 'Puzzle People';
const PUZZLE_ROLE_COLOR = 0xd4af37; // heraldic gold, matching the puzzle embed

// Read-only lookup — does not require Manage Roles. Used when posting a
// puzzle: if no one has ever signed up (so the role was never created), the
// puzzle should still post fine, just without a ping.
const findPuzzleRole = (guild) =>
    guild.roles.cache.find((role) => role.name === PUZZLE_ROLE_NAME) || null;

// Creates the role on first signup. Requires the Manage Roles permission.
const getOrCreatePuzzleRole = async (guild) => {
    const existing = findPuzzleRole(guild);
    if (existing) return existing;

    return guild.roles.create({
        name: PUZZLE_ROLE_NAME,
        mentionable: true,
        color: PUZZLE_ROLE_COLOR,
        reason: 'Auto-created for /puzzle_signup',
    });
};

module.exports = { PUZZLE_ROLE_NAME, findPuzzleRole, getOrCreatePuzzleRole };
