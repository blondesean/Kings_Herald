/* Author: Sean Duncan
 * Date: 10/16/2023
 * Purpose: This discord bot will simply announce peoples titles in the chat when they are @ed.
 */


//This will allow constact Discord to communicate with all of our node modules
const { Client, GatewayIntentBits } = require('discord.js')

//Create new client that will appear in discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

//set the prefix, this lets the bot know when it is time to run a command
const prefix = '!';

//To use more files than index and neatly store commands we need to do the following
//require node script to read files from our computer
const fs = require('fs');

//Read in the commands folder commands.js for all files that end in js, then create a command for each that requires that file to execute
const folderPath = './commands/';
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
fs.readdir(folderPath, (err, files) => {
    files.forEach(file => {
        console.log('Importing Command : ' + file);

        const command = require(`./../commands/${file}`);
        client.commands.set(command.name, command);
    });
});

//Print in log that the client has come online
client.on('ready', (c) => {
    console.log(`King's ${client.user.tag} is online.`);
});

//Client reacts whenever a message comes in 
client.on('messageCreate', message => {

    //show message was received
    console.log('Message was : ' + message.content + ' : ' + message.author.username);

    //if the message does not start with prefix do nothing, OR ignore messages sent by bot
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    //capture commands and split out, shift to lower case
    const args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase();

    //print the debug info to the console
    console.log('Message was :' + message.content)
    console.log('command is ' + command);
    console.log('args are ' + args);

    if (command === 'ping') {
        client.commands.get('ping').execute(message);
    } else if (command === 'whois') {
        client.commands.get('whois').execute(message, args);
    }

    else (content.log(message.content + ' | This is not an actionable message'))
});


//Login with Bot token
client.login('NzU5NDgwMDg5MDE2MjcwODc5.GoSmyz.l9Y8v02GI_0pACEE2CWl5GuWl6HNQwIHZEXAsI');