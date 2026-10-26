/* /trial_test - walk a rehearsal trial (src/trial.js), for testing. Runs all
 * three rounds, but skips every gate, whether the trials are open, a relic
 * already held, an injury or today's attempt, and writes nothing: no relic is
 * claimed, no wound taken, no day spent. Each run draws fresh rumors.
 * adminOnly + hidden + ephemeral like the other previews.
 */

const { runTrial } = require('../../../src/trial');

module.exports = {
    description: 'Walk a rehearsal trial (no relic claimed, no wounds)',
    category: 'UTILITY',
    hidden: true, // out of the generated /help
    adminOnly: true, // only members with Manage Server can see or run it
    ephemeral: true,
    run: (interaction) => runTrial(interaction, { persist: false }),
};
