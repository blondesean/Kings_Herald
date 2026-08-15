/* Shared: the highest nobility title a member has earned, from the ladder in
 * flavor_text/nobilityRanks.js. Used by /nobility (the full peerage) and
 * /whois (a single member's current title).
 */

const nobilityRanks = require('../flavor_text/nobilityRanks');

// The highest rank whose threshold the member has reached, or null if they
// are still a commoner.
const titleFor = (points) => {
    const ranks = nobilityRanks();
    let earned = null;
    for (const rank of ranks) {
        if (points >= rank.points) earned = rank;
        else break;
    }
    return earned;
};

module.exports = { titleFor };
