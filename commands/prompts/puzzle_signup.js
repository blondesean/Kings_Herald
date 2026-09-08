/* /puzzle_signup - toggle membership in the puzzle-notification role.
 *
 * Signing up adds the "Puzzle People" role (created on first use, see
 * ../../src/puzzleRole); running the command again removes it. The daily
 * Connections puzzle (commands/puzzles/connections.js) pings this role when
 * it posts, so signed-up members get notified the moment a new puzzle goes
 * up.
 */

const { getOrCreatePuzzleRole } = require('../../src/puzzleRole');

const puzzleSignup = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let role;
    try {
        role = await getOrCreatePuzzleRole(guild);
    } catch (error) {
        console.error('puzzle_signup: could not find/create the puzzle role:', error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
        if (hasRole) {
            await member.roles.remove(role);
            await interaction.editReply('Thy name is struck from the puzzle summons. Thou shalt be pinged no more for the daily riddle!');
        } else {
            await member.roles.add(role);
            await interaction.editReply('Thy name is entered into the puzzle summons! Thou shalt be pinged the moment the daily puzzle is posed.');
        }
    } catch (error) {
        console.error('puzzle_signup: could not update member roles:', error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Toggle: run once to be summoned for the daily puzzle, run again to be removed',
    category: 'ROYAL CHRONICLES',
    run: puzzleSignup,
};
