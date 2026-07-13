const ping = async function (interaction) {
    await interaction.editReply("Pong!");
    console.log("Replied with 'Pong!'");
};

module.exports = {
    description: 'Confirm the herald yet draws breath',
    category: 'UTILITY',
    run: ping,
};
