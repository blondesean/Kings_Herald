/* /wowplayers - the herald recites the court's WoW roster, for the asker
 * alone: one plain-text table per realm type, a row per character, with the
 * member first, then faction, race, class and spec. Characters are listed
 * with /implaying.
 *
 * Names are read live from the server where the member is still in it, so a
 * rename shows; otherwise the name saved with their last /implaying. A long
 * roster is split across messages under Discord's 2000 characters.
 */

const { MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const wow = require('../../src/wowCharacters');

const MESSAGE_LIMIT = 2000;

// The sections as messages: each realm's heading and table in a code block,
// a long table split by rows.
const toMessages = (intro, tables) => {
    const blocks = [];
    for (const { realm, count, text } of tables) {
        const heading = `**${realm} realms**, ${count === 1 ? '1 character' : `${count} characters`}`;
        const [head, rule, ...rows] = text.split('\n');
        let chunk = [];
        let first = true; // the heading goes on a realm's first block only
        const flush = () => {
            if (!chunk.length) return;
            blocks.push(`${first ? `${heading}\n` : ''}\`\`\`\n${[head, rule, ...chunk].join('\n')}\n\`\`\``);
            chunk = [];
            first = false;
        };
        for (const row of rows) {
            if ([head, rule, ...chunk, row].join('\n').length + heading.length + 20 > MESSAGE_LIMIT) flush();
            chunk.push(row);
        }
        flush();
    }

    const messages = [intro];
    for (const block of blocks) {
        const last = messages[messages.length - 1];
        if (last.length + block.length + 2 <= MESSAGE_LIMIT) messages[messages.length - 1] = `${last}\n\n${block}`;
        else messages.push(block);
    }
    return messages;
};

const wowplayers = async function (interaction) {
    try {
        const members = await pointsStore.getWowCharacters(interaction.guild.id);
        if (!members.length) {
            await interaction.editReply('The roster is empty, good noble. Be the first: tell the herald thy character with /implaying.');
            return;
        }

        const live = await interaction.guild.members.fetch({ user: members.map((m) => m.userId) }).catch(() => null);
        const rows = members.map((m) => ({
            name: (live && live.get(m.userId) && live.get(m.userId).displayName) || m.displayName || 'A departed noble',
            characters: m.characters,
        }));
        const tables = wow.rosterTables(rows);
        const total = tables.reduce((sum, t) => sum + t.count, 0);
        const intro = `Hear ye! The herald recites the court's roster: ${total === 1 ? 'one character' : `${total} characters`} among ${rows.length === 1 ? 'one noble' : `${rows.length} nobles`}. Add or change thine with /implaying.`;

        const [first, ...rest] = toMessages(intro, tables);
        await interaction.editReply(first);
        for (const content of rest) await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
    } catch (error) {
        console.error('Error handling /wowplayers:', error);
        await interaction.editReply('Alack! The herald\'s roster is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'See which WoW characters the court is playing, by realm type',
    category: 'WOW',
    ephemeral: true,
    run: wowplayers,
    toMessages,
};
