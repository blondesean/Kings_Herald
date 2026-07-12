/* Barrel for the Herald's flavor text. Each entry is a function that returns
 * its array of strings (some take parameters to interpolate). Commands can pull
 * what they need from here, e.g.:
 *
 *   const flavor = require('../../flavor_text');
 *   const lines = flavor.celebrationTemplates(adjective, authorName);
 *
 * or require a single file directly:
 *
 *   const rankTitles = require('../../flavor_text/rankTitles');
 */
module.exports = {
    celebrationAdjectives: require('./celebrationAdjectives'),
    celebrationTemplates: require('./celebrationTemplates'),
    rankTitles: require('./rankTitles'),
    noReactionsResponses: require('./noReactionsResponses'),
    royalAdjectives: require('./royalAdjectives'),
    heraldResponses: require('./heraldResponses'),
    basicAnnouncements: require('./basicAnnouncements'),
    announcementTemplates: require('./announcementTemplates'),
};
