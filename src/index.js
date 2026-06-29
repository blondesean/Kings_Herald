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
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ]
});

//Login with Bot token from environment variable
require('dotenv').config();
client.login(process.env.DISCORD_BOT_TOKEN);

//To use more files than index and neatly store commands we need to do the following
//require node scripts to read files from our computer
const fs = require('fs');
const path = require('path');

//Passive behaviors live in commands/passive and are wired into client events directly (not the ! dispatcher).
const celebrate = require('./../commands/passive/celebrate');
const { scheduleWeeklyRecap } = require('./../commands/passive/weeklyRecap');

//Read in the commands/prompts folder for all files that end in js, then create a command for each that requires that file to execute.
//Prompt commands are the ones triggered by a "!" message. Passive behaviors (commands/passive) and retired commands (commands/retired) are not loaded here.
const promptsPath = path.join(__dirname, '..', 'commands', 'prompts');
var commands = {};
fs.readdir(promptsPath, (err, files) => {
    if (err) {
        console.error('Could not read prompt commands folder:', err);
        return;
    }
    files.forEach(file => {
        if (file.endsWith('.js')) {
            console.log('Importing Command : ' + file);

            const command = require(path.join(promptsPath, file));
            const command_real_name = file.substring(0, file.length - 3); // ".js" = 3
            commands[command_real_name] = command;

        }
        else {
            console.log('Skipping non-javascript entry: ' + file);
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

    // Schedule the weekly recap now that the bot is connected.
    scheduleWeeklyRecap(client);
});

//Client reacts whenever a message comes in
client.on('messageCreate', message => {

    //Store original message for reference
    const origMessage = message;

    //show message was received
    console.log("< ---------- \\/\\/  MESSAGE   DECISIONING  \\/\\/ ---------- >");
    console.log("Message was : '" + message.content + "' from " + message.author.username);

    //if the message does not start with prefix, ignore it
    if (!message.content.startsWith(prefix)) {
        console.log("\tThis is not an actionable message");
        console.log("< ---------- /\\/\\ END MESSAGE DECISIONING /\\/\\ ---------- >");
        return;
    }

    if (message.author.bot) {
        console.log("\tIgnoring bot message");
        console.log("< ---------- /\\/\\ END MESSAGE DECISIONING /\\/\\ ---------- >");
        return;
    }

    //capture commands and split out, shift to lower case
    const previewArgs = message.content.slice(prefix.length).split(/ +/)
    const command = previewArgs.shift().toLowerCase();

    //print the debug info to the console
    console.log('\tcommand is ' + command);
    console.log('\targs are ' + previewArgs);
    console.log("RESPONSE : ");

    if (command === "ping") {
        console.log("Executing Ping Command");
        commands.ping(message);
    } else if (command === "test") {
        console.log("Executing Test Command");
        message.reply(commands.test());
    } else if (command === "whois") {
        console.log("Executing Whois Command");
        commands.whois(prefix, origMessage);
    } else if (command === "reactions") {
        console.log("Executing Reactions Command");
        commands.reactions(prefix, origMessage);
    } else if (command === "activity") {
        console.log("Executing Activity Command");
        commands.activity(prefix, origMessage);
    } else if (command === "recap") {
        console.log("Executing Recap Command");
        commands.recap(prefix, origMessage);
    } else if (command === "complain") {
        console.log("Executing Complain Command");
        commands.complain(prefix, origMessage);
    } else if (command === "help") {
        console.log("Executing Help Command");
        commands.help(prefix, origMessage);
    } else {
        console.log("Unrecognized command from user.");
        message.reply("This is not a valid command, sir.");
    }

    //End and reset for next message
    console.log("< ---------- /\\/\\ END MESSAGE DECISIONING /\\/\\ ---------- >\n");

});

// Herald celebrates popular messages (logic in commands/passive/celebrate.js)
client.on('messageReactionAdd', celebrate);



