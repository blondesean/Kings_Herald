/* /signup <summons> - toggle one of the herald's summons roles, or list them.
 *
 * Each summons is a role the herald pings when its event posts, created on
 * first use by its helper in src/:
 *   trivia     - "Hear Ye Trivia", the daily trivia round (src/triviaRole.js)
 *   wow trivia - "Those Buffed with Arcane Intellect", WoW Trivia Wednesdays
 *                (src/wowTriviaRole.js)
 *   puzzle     - "Puzzle People", the daily Connections or Word Ladder
 *                (src/puzzleRole.js)
 *   shop       - "shopaholics", the daily shop opening (src/shopRole.js)
 *   encounter  - "Adventurers", the daily boss encounter (src/adventurerRole.js)
 * The choice names are short so `/signup encounter` reads the same in the
 * herald's notes as in the picker. Choosing one adds the role, or removes it
 * if already held; "mine" lists which summons the member holds. Replies are
 * ephemeral.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const { getOrCreateTriviaRole, findTriviaRole } = require('../../src/triviaRole');
const { getOrCreateWowTriviaRole, findWowTriviaRole } = require('../../src/wowTriviaRole');
const { getOrCreatePuzzleRole, findPuzzleRole } = require('../../src/puzzleRole');
const { getOrCreateShopRole, findShopRole } = require('../../src/shopRole');
const { getOrCreateAdventurerRole, findAdventurerRole } = require('../../src/adventurerRole');

// Keyed by option value; `choice` is the name shown in the picker.
const SUMMONS = {
    trivia: {
        choice: 'trivia',
        label: 'Daily trivia',
        getOrCreate: getOrCreateTriviaRole,
        find: findTriviaRole,
        joined: 'Thy name is entered into the trivia summons! Thou shalt be pinged the moment the daily question is posed.',
        left: 'Thy name is struck from the trivia summons. Thou shalt be pinged no more for the daily question!',
    },
    wow_trivia: {
        choice: 'wow trivia',
        label: 'WoW Trivia Wednesdays',
        getOrCreate: getOrCreateWowTriviaRole,
        find: findWowTriviaRole,
        joined: 'Thou art added to the WoW trivia summons! Thou shalt be pinged the moment a WoW trivia session begins.',
        left: 'Thou art struck from the WoW trivia summons. Thou shalt be pinged no more when a WoW trivia session begins!',
    },
    puzzle: {
        choice: 'puzzle',
        label: 'Daily puzzle',
        getOrCreate: getOrCreatePuzzleRole,
        find: findPuzzleRole,
        joined: 'Thy name is entered into the puzzle summons! Thou shalt be pinged the moment the daily puzzle is posed.',
        left: 'Thy name is struck from the puzzle summons. Thou shalt be pinged no more for the daily riddle!',
    },
    shop: {
        choice: 'shop',
        label: 'Daily shop',
        getOrCreate: getOrCreateShopRole,
        find: findShopRole,
        joined: 'Thy name is entered into the shopaholics\' summons! Thou shalt be pinged the moment the merchant opens his stalls.',
        left: 'Thy name is struck from the shopaholics\' summons. Thou shalt be pinged no more when the stalls open!',
    },
    encounter: {
        choice: 'encounter',
        label: 'Boss encounter',
        getOrCreate: getOrCreateAdventurerRole,
        find: findAdventurerRole,
        joined: 'Thy name is entered upon the adventurers\' roll! Thou shalt be summoned the moment a threat stirs.',
        left: 'Thy name is struck from the adventurers\' roll. Thou shalt be summoned no more when a threat stirs.',
    },
};

const listSummons = async (interaction) => {
    const lines = Object.values(SUMMONS).map((s) => {
        const role = s.find(interaction.guild);
        const held = role && interaction.member.roles.cache.has(role.id);
        return `${held ? '**Summoned**' : 'Not summoned'} - ${s.label}: \`/signup ${s.choice}\``;
    });
    await interaction.editReply(`Thy summons, good noble:\n\n${lines.join('\n')}\n\nChoose one again to toggle it.`);
};

const signup = async function (interaction) {
    const value = interaction.options.getString('summons');
    if (value === 'mine') {
        await listSummons(interaction);
        return;
    }
    const summons = SUMMONS[value];
    if (!summons) {
        await interaction.editReply('I know of no such summons, good noble.');
        return;
    }

    let role;
    try {
        role = await summons.getOrCreate(interaction.guild);
    } catch (error) {
        console.error(`signup (${value}): could not find/create the role:`, error);
        await interaction.editReply('Alack! I lack the authority to raise a summons role, Milord. Grant me the Manage Roles permission and try again.');
        return;
    }

    const member = interaction.member;
    try {
        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            await interaction.editReply(summons.left);
        } else {
            await member.roles.add(role);
            await interaction.editReply(summons.joined);
        }
    } catch (error) {
        console.error(`signup (${value}): could not update member roles:`, error);
        await interaction.editReply('Alack! I could not update thy summons at this time, Milord. Pray try again anon!');
    }
};

module.exports = {
    description: 'Be pinged when trivia, the puzzle, the shop or an encounter begins; choose again to stop',
    category: 'SUMMONS',
    ephemeral: true,
    options: [
        {
            name: 'summons',
            description: 'Which summons to toggle, or "mine" to see thine',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                ...Object.entries(SUMMONS).map(([value, s]) => ({ name: s.choice, value })),
                { name: 'mine', value: 'mine' },
            ],
        },
    ],
    run: signup,
    SUMMONS,
};
