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

//Passive behaviors live in commands/passive and are wired into client events directly (not slash commands).
const celebrate = require('./../commands/passive/celebrate');
const { scheduleWeeklyRecap } = require('./../commands/passive/weeklyRecap');

//Slash commands are auto-loaded by filename from commands/prompts (user-facing)
//and commands/passive/preview (manual triggers for scheduled passive behaviors,
//admin-only in Discord). Retired commands (commands/retired) are not loaded.
const promptsPath = path.join(__dirname, '..', 'commands', 'prompts');
const previewPath = path.join(__dirname, '..', 'commands', 'passive', 'preview');
var commands = {};

//Loaded synchronously so the command definitions are complete before the
//client's ready event registers them with Discord.
const loadCommandsFrom = (dir, label) => {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(`Could not read ${label} folder (${dir}):`, err);
        return;
    }
    files.forEach(file => {
        if (file.endsWith('.js')) {
            console.log(`Importing ${label} : ` + file);

            const command = require(path.join(dir, file));
            const command_real_name = file.substring(0, file.length - 3); // ".js" = 3

            //Every command module must export { description, category, hidden?, options?, run }.
            //The run function is the dispatch target; the rest builds the Discord
            //registration payload and the generated /help.
            if (typeof command.run !== 'function') {
                console.error(`Skipping ${file}: module does not export a run function.`);
                return;
            }
            commands[command_real_name] = command;

        }
        else {
            console.log('Skipping non-javascript entry: ' + file);
        }
    });
};

loadCommandsFrom(promptsPath, 'Command');
loadCommandsFrom(previewPath, 'Preview Command');

//Build the slash-command registration payload from the loaded metadata.
//hidden commands (preview, test utilities) are excluded entirely — they don't
//appear in the picker for anyone, including admins.
const commandDefinitions = () =>
    Object.entries(commands)
        .filter(([, cmd]) => !cmd.hidden)
        .map(([name, cmd]) => ({
            name,
            description: cmd.description.slice(0, 100), // Discord caps descriptions at 100 chars
            options: cmd.options || [],
        }));

//Register the commands with one guild, replacing whatever was there before.
const registerCommands = (guild) => {
    const definitions = commandDefinitions();
    return guild.commands.set(definitions)
        .then(() => console.log(`Registered ${definitions.length} slash commands in "${guild.name}"`))
        .catch((error) => console.error(`Failed to register commands in "${guild.name}":`, error));
};

//Print in log that the client has come online
client.on('ready', (c) => {
    console.log(`King's ${client.user.tag} is online.`);

    //Guild-scoped registration: updates show up in Discord immediately (global
    //registration can take up to an hour to propagate). Runs on every startup
    //so a deploy refreshes the definitions.
    client.guilds.cache.forEach(registerCommands);

    // Schedule the weekly recap now that the bot is connected.
    scheduleWeeklyRecap(client);
});

//Register commands when the bot is invited to a new server.
client.on('guildCreate', registerCommands);

//Client reacts whenever a slash command comes in
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    console.log("< ---------- \\/\\/  COMMAND   DECISIONING  \\/\\/ ---------- >");
    console.log(`Command /${interaction.commandName} from ${interaction.user.username}`);

    const cmd = commands[interaction.commandName];
    if (!cmd) {
        //Shouldn't happen (Discord only offers registered commands), but a
        //stale registration after a rename could get here.
        console.log("Unrecognized command from user.");
        await interaction.reply("This is not a valid command, sir.").catch(() => {});
        return;
    }

    try {
        //Acknowledge immediately: Discord requires a response within 3 seconds,
        //and several commands scan history for far longer. Commands send their
        //real answer with editReply (first message) and followUp (subsequent).
        await interaction.deferReply();
        await cmd.run(interaction, commands);
    } catch (error) {
        console.error(`Command ${interaction.commandName} threw:`, error);
        const apology = "Alack! Some misfortune befell that command, Milord. Pray try again anon!";
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(apology).catch(() => {});
        } else {
            await interaction.reply(apology).catch(() => {});
        }
    }

    console.log("< ---------- /\\/\\ END COMMAND DECISIONING /\\/\\ ---------- >\n");
});

// Herald celebrates popular messages (logic in commands/passive/celebrate.js)
client.on('messageReactionAdd', celebrate);
