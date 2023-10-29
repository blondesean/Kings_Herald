/* Author: Sean Duncan
 * Date: 10/16/2023
 * Purpose: This discord bot will simply announce peoples titles in the chat when they are @ed.
 */


//This will allow constact Discord to communicate with all of our node modules
const { Client, GatewayIntentBits, Partials } = require('discord.js');

//Create new client that will appear in discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

//Login with Bot token
client.login('NzU5NDgwMDg5MDE2MjcwODc5.G0geTH.-hFI9dtby80RTGSk2peqlsDBR-FiTREiCxT5DM');

//To use more files than index and neatly store commands we need to do the following
//require node script to read files from our computer
const fs = require('fs');

//Read in the commands folder commands.js for all files that end in js, then create a command for each that requires that file to execute
const folderPath = './commands/';
const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'))
var commands = {};
fs.readdir(folderPath, (err, files) => {
    files.forEach(file => {
        if (file.endsWith('.js')) {
            console.log('Importing Command : ' + file);

            const command = require('./../commands/'.concat(file));
            const command_real_name = file.substring(0, file.length - 3); // ".js" = 3
            commands[command_real_name] = command;

        }
        else {
            console.log('Cannot require file - it is not javascript');
        }

    });

    console.log("Loaded the following modules");
    console.log(commands);
})

//set the prefix, this lets the bot know when it is time to run a command
const prefix = '!';

//Print in log that the client has come online
client.on('ready', (c) => {
    console.log(`King's ${client.user.tag} is online.`);
});

//Client reacts whenever a message comes in 
client.on('messageCreate', message => {

    //show message was received
    console.log("< ---------- \\/\\/  MESSAGE   PROCESSING  \\/\\/ ---------- >");
    console.log('Message was : ' + message.content + ' from ' + message.author.username);

    //if the message does not start with prefix do nothing, OR ignore messages sent by bot
    if (!message.content.startsWith(prefix) || message.author.bot) {
        console.log("\tThis is not an actionable message");
        console.log("< ---------- /\\/\\ END MESSAGE PROCESSING /\\/\\ ---------- >");
        return;
    };

    //capture commands and split out, shift to lower case
    const args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase();
    
    //print the debug info to the console
    console.log('\tcommand is ' + command);
    console.log('\targs are ' + args);
    console.log("RESPONSE : ");

    if (command === 'ping') {
        console.log("Executing Ping Command");
        commands.ping(message);
    } else if (command === 'test') {
        console.log("Executing Test Command");
        message.reply(commands.test());
    } else if (command === 'whois') {
        console.log("Executing Whois Command");
        commands.whois(args);
    } else {
        console.log("Unrecognized command from user.");
        message.reply("This is not a valid command, sir.");
    }

    //End and reset for next message
    console.log("< ---------- /\\/\\ END MESSAGE PROCESSING /\\/\\ ---------- >\n");
   
});



