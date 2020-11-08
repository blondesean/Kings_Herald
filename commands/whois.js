module.exports = {
    name: 'whois',
    description: "this command will make the herald list the roles of the person mentioned",
    execute(message, args) {
        //Select first user, print their roles
        const user = args[0];
        message.channel.send('It appears that you want to know about ' + user + '...')

        //seperate and print roles
        console.log('The user who made the request' + message.user);


    }
}