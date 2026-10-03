/* Shared helper: the role members can join via /shop_signup to be pinged when
 * the daily shop opens (commands/passive/shop.js). Looked up by name per guild
 * rather than stored anywhere; Discord persists the role itself, so nothing
 * needs to survive a bot restart. Mirrors src/puzzleRole.js.
 */

const SHOP_ROLE_NAME = 'shopaholics';
const SHOP_ROLE_COLOR = 0xd4af37; // heraldic gold, matching the shop embed

// Read-only lookup, no Manage Roles needed. If nobody has signed up yet the
// role doesn't exist, and the shop still opens, just without a ping.
const findShopRole = (guild) =>
    guild.roles.cache.find((role) => role.name === SHOP_ROLE_NAME) || null;

// Creates the role on first signup. Requires the Manage Roles permission.
const getOrCreateShopRole = async (guild) => {
    const existing = findShopRole(guild);
    if (existing) return existing;

    return guild.roles.create({
        name: SHOP_ROLE_NAME,
        mentionable: true,
        color: SHOP_ROLE_COLOR,
        reason: 'Auto-created for /shop_signup',
    });
};

module.exports = { SHOP_ROLE_NAME, findShopRole, getOrCreateShopRole };
