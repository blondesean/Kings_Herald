/* /trial - follow a rumor down an old road and face a relic's Guardian, to
 * win one of the uniques. The whole run is in src/trial.js; this is only the
 * command. Ephemeral, so the rounds stay private; a claim is proclaimed in
 * the channel. Hidden from /help so the trials stay a secret until the lore
 * drops open them, and it answers only with a riddle until then.
 */

const { runTrial } = require('../../src/trial');

module.exports = {
    description: 'Follow a rumor down an old road',
    category: 'GLORY',
    hidden: true, // out of the generated /help until the trials are announced
    ephemeral: true,
    run: (interaction) => runTrial(interaction, { persist: true }),
};
