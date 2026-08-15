/* /trivia_signup - toggle membership in the trivia-notification role.
 *
 * Signing up adds the "Hear Ye Trivia" role (created on first use, see
 * ../../src/triviaRole); running the command again removes it. The daily
 * trivia round (commands/passive/trivia.js) pings this role when it posts,
 * so signed-up members get notified the moment a question goes up.
 */

const { getOrCreateTriviaRole } = require('../../src/triviaRole');

const triviaSignup = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let role;
    try {
        role = await getOrCreateTriviaRole(guild);
    } catch (error) {
        console.error('trivia_signup: could not find/create the trivia role:', error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
        if (hasRole) {
            await member.roles.remove(role);
            await interaction.editReply('Thy name is struck from the trivia summons. Thou shalt be pinged no more for the daily question!');
        } else {
            await member.roles.add(role);
            await interaction.editReply('Thy name is entered into the trivia summons! Thou shalt be pinged the moment the daily question is posed.');
        }
    } catch (error) {
        console.error('trivia_signup: could not update member roles:', error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Sign up (or opt out) to be pinged when the daily trivia round posts',
    category: 'ROYAL CHRONICLES',
    run: triviaSignup,
};
