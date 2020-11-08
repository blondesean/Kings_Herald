module.exports = {
    name: 'ping',
    description: "this is a simple ping command for testing",
    execute(message) {
        message.channel.send('Ping received. Returning ping.')

    }
}