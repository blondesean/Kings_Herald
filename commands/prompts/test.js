const test = async function (interaction) {
    await interaction.editReply('Test Output');
};

module.exports = {
    description: 'Return a fixed string to verify the dispatcher',
    category: 'UTILITY',
    hidden: true, // admin-only in Discord; maintenance affordance, not a feature
    run: test,
};
