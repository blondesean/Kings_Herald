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
//require node script to read files from our computer
const fs = require('fs');

//Read in the commands folder for all files that end in js, then create a command for each that requires that file to execute.
//Subdirectories (e.g., commands/retired) are skipped because they do not end in .js.
const folderPath = './commands/';
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
    } else {
        console.log("Unrecognized command from user.");
        message.reply("This is not a valid command, sir.");
    }

    //End and reset for next message
    console.log("< ---------- /\\/\\ END MESSAGE DECISIONING /\\/\\ ---------- >\n");

});

// Track messages that have already been celebrated to avoid spam
const celebratedMessages = new Set();

// Herald celebrates popular messages with 10+ reactions
client.on('messageReactionAdd', async (reaction, user) => {
    // Handle partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message:', error);
            return;
        }
    }

    const message = reaction.message;

    // Don't celebrate bot messages or messages we've already celebrated
    if (message.author.bot || celebratedMessages.has(message.id)) {
        return;
    }

    // Count total reactions on the message
    const totalReactions = message.reactions.cache.reduce((total, r) => total + r.count, 0);

    console.log(`Message "${message.content?.substring(0, 50)}..." now has ${totalReactions} total reactions`);

    // Celebrate when message hits 10 reactions
    if (totalReactions >= 10) {
        celebratedMessages.add(message.id);

        // Royal adjectives for celebrating popular posts
        const celebrationAdjectives = [
            "clever", "insightful", "intriguing", "witty", "profound", "brilliant",
            "astute", "wise", "eloquent", "thoughtful", "remarkable", "splendid",
            "marvelous", "excellent", "superb", "magnificent", "delightful", "charming"
        ];

        const randomAdjective = celebrationAdjectives[Math.floor(Math.random() * celebrationAdjectives.length)];
        const authorName = message.member?.displayName || message.author.username;

        // Multiple celebration message templates for variety
        const celebrationTemplates = [
            `Very ${randomAdjective}, Milord! Your patrons adore this comment and I tell tale of your wisdom!`,
            `Hark! Most ${randomAdjective} words, ${authorName}! The realm celebrates your eloquence!`,
            `By my troth! Such ${randomAdjective} discourse has won the hearts of many! Well spoken, good sir!`,
            `Behold! The ${randomAdjective} wisdom of ${authorName} has stirred the masses! Truly remarkable!`,
            `Magnificent! Your ${randomAdjective} words have earned great favor, Milord! The court is impressed!`,
            `Splendid! Most ${randomAdjective} indeed! Your wit has captured the admiration of all!`,
            `Verily! Such ${randomAdjective} insight deserves recognition! The people have spoken!`,
            `Forsooth! Your ${randomAdjective} commentary has won acclaim throughout the realm!`
        ];

        const celebrationMessage = celebrationTemplates[Math.floor(Math.random() * celebrationTemplates.length)];

        try {
            // Reply to the popular message
            await message.reply(celebrationMessage);

            // Try to pin the message (requires manage messages permission)
            await message.pin();
            console.log(`Celebrated and pinned popular message from ${authorName} with ${totalReactions} reactions`);

        } catch (error) {
            console.error('Error celebrating message:', error);
            // If pinning fails, still send the celebration
            try {
                await message.reply(celebrationMessage);
                console.log(`Celebrated popular message from ${authorName} (pinning failed)`);
            } catch (replyError) {
                console.error('Error sending celebration message:', replyError);
            }
        }
    }
});



