/* /wow_trivia_signup - toggle membership in the WoW-trivia-notification role.
 *
 * Signing up adds the "Those Buffed with Arcane Intellect" role (created on
 * first use, see ../../src/wowTriviaRole — named after the mage buff spell,
 * for the court's WoW know-it-alls); running the command again removes it.
 * The replies below name-drop the role via its own live mention rather than
 * restating "Arcane Intellect" in prose, since the role name already says it.
 * Starting a /wow_trivia session pings this role, so signed-up members get
 * notified the moment a session begins. Separate from /trivia_signup's role,
 * since the daily trivia and WoW trivia are different games.
 */

const { getOrCreateWowTriviaRole } = require('../../src/wowTriviaRole');

const wowTriviaSignup = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let role;
    try {
        role = await getOrCreateWowTriviaRole(guild);
    } catch (error) {
        console.error('wow_trivia_signup: could not find/create the WoW trivia role:', error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
        if (hasRole) {
            await member.roles.remove(role);
            await interaction.editReply(`Thou art struck from ${role}. Thou shalt be pinged no more when a WoW trivia session begins!`);
        } else {
            await member.roles.add(role);
            await interaction.editReply(`Thou art added to ${role}! Thou shalt be pinged the moment a WoW trivia session begins.`);
        }
    } catch (error) {
        console.error('wow_trivia_signup: could not update member roles:', error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Toggle: run once to be summoned when WoW trivia starts, run again to be removed',
    category: 'COURTLY GAMES',
    run: wowTriviaSignup,
};
