/* /adventurer_signup - toggle membership in the Adventurers role.
 *
 * Signing up adds the "Adventurers" role (created on first use, see
 * src/adventurerRole.js); running the command again removes it. The daily
 * boss encounter pings this role when it posts, so signed-up members can
 * answer the call before the party marches.
 */

const { getOrCreateAdventurerRole } = require('../../src/adventurerRole');

const adventurerSignup = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let role;
    try {
        role = await getOrCreateAdventurerRole(guild);
    } catch (error) {
        console.error('adventurer_signup: could not find/create the Adventurers role:', error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
        if (hasRole) {
            await member.roles.remove(role);
            await interaction.editReply('Thy name is struck from the adventurers\' roll. Thou shalt be summoned no more when a threat stirs.');
        } else {
            await member.roles.add(role);
            await interaction.editReply('Thy name is entered upon the adventurers\' roll! Thou shalt be summoned the moment a threat stirs.');
        }
    } catch (error) {
        console.error('adventurer_signup: could not update member roles:', error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Toggle: run once to be summoned for the daily boss encounter, run again to be removed',
    category: 'ROYAL CHRONICLES',
    run: adventurerSignup,
};
