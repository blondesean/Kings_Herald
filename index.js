/* Author: Sean Duncan
 * Date: 9/26/2020
 * Purpose: This discord bot will simply announce peoples titles in the chat when they are @ed.
 */

//This will allow constact Discord to communicate with all of our node modules
const Discord = require('discord.js');

//Create new client that will appear in discord
const client = new Discord.Client();

//set the prefix, this lets the bot know when it is time to run a command
const prefix = '!';

//To use more files than index and neatly store commands we need to do the following
//require node script to read files from our computer
const fs = require('fs');

//create variable to store all of the commands that are scanned in from folder later
client.commands = new Discord.Collection();

//Read in the commands folder commands.js for all files that end in js, then create a command for each that requires that file to execute
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);

}

//Print in log that the client has come online
client.once('ready', () => {
    console.log('King\'s Herald Bot is online.');
});

//Client reacts whenever a message comes in 
client.on('message', message => {
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
});

//Login with Bot token
client.login('NzU5NDgwMDg5MDE2MjcwODc5.X2-G8w.0rdyjTc99aelrH1-PjSoCt3SBQ0');