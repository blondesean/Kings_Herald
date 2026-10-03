/* /shop_signup - toggle membership in the shopaholics role.
 *
 * Signing up adds the "shopaholics" role (created on first use, see
 * src/shopRole.js); running the command again removes it. The daily shop
 * pings this role when it opens, so signed-up members know the moment the
 * stalls are up.
 */

const { getOrCreateShopRole } = require('../../src/shopRole');

const shopSignup = async function (interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    let role;
    try {
        role = await getOrCreateShopRole(guild);
    } catch (error) {
        console.error('shop_signup: could not find/create the shopaholics role:', error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const hasRole = member.roles.cache.has(role.id);

    try {
        if (hasRole) {
            await member.roles.remove(role);
            await interaction.editReply('Thy name is struck from the shopaholics\' summons. Thou shalt be pinged no more when the stalls open!');
        } else {
            await member.roles.add(role);
            await interaction.editReply('Thy name is entered into the shopaholics\' summons! Thou shalt be pinged the moment the merchant opens his stalls.');
        }
    } catch (error) {
        console.error('shop_signup: could not update member roles:', error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Toggle: run once to be summoned when the daily shop opens, run again to be removed',
    category: 'ROYAL CHRONICLES',
    run: shopSignup,
};
