/* /implaying - tell the court which WoW characters thou art playing, so
 * others can see the roster when making theirs (/wowplayers).
 *
 * The herald asks in one ephemeral message whose buttons only the member
 * sees, each answer replacing the question:
 *   New:    realm type, faction, race (by faction), class (by race),
 *           specialization (by class)
 *   Update: which character (if more than one), then Delete or the field to
 *           change. A new faction asks race, class and spec again; a new race
 *           asks class and spec again only if the old class can't be played
 *           by it; a new class always asks spec.
 * A member may list up to MAX_CHARACTERS, each combination once. The list is
 * read again just before saving, so two runs at once can't undo each other.
 * Data and the roster table live in src/wowCharacters.js.
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const wow = require('../../src/wowCharacters');

const STEP_WINDOW_MS = 2 * 60 * 1000;
const PER_ROW = 5;
const CANCEL = '__cancel';

// Buttons five to a row, with Cancel last.
const rowsOf = (buttons) => {
    const all = [
        ...buttons.map((b) => new ButtonBuilder().setCustomId(`wow_${b.key}`).setLabel(b.label).setStyle(b.style || ButtonStyle.Primary)),
        new ButtonBuilder().setCustomId(`wow_${CANCEL}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    ];
    const rows = [];
    for (let i = 0; i < all.length; i += PER_ROW) rows.push(new ActionRowBuilder().addComponents(all.slice(i, i + PER_ROW)));
    return rows;
};

// Thrown to end the questions early: on Cancel or no answer.
class Stop extends Error {
    constructor(content) {
        super(content);
        this.content = content;
    }
}

/* The questions run on one ephemeral message, the deferred reply, edited for
 * each question. Each click is acknowledged at once, so a slow read before
 * the next edit can't run out Discord's 3 seconds. ask() resolves with the
 * key of the button pressed.
 */
const conversation = (interaction) => {
    const show = (payload) => interaction.editReply(payload);
    return {
        async ask(content, buttons) {
            const message = await show({ content, components: rowsOf(buttons) });
            let click;
            try {
                click = await message.awaitMessageComponent({
                    componentType: ComponentType.Button,
                    time: STEP_WINDOW_MS,
                    filter: (i) => i.user.id === interaction.user.id,
                });
            } catch {
                throw new Stop('The herald\'s quill dries. Run /implaying again when thou art ready.');
            }
            await click.deferUpdate();
            const key = click.customId.slice('wow_'.length);
            if (key === CANCEL) throw new Stop('As thou wilt. The roster stands as it was.');
            return key;
        },
        finish: (content) => show({ content, components: [] }),
    };
};

const askRealm = (talk, intro = '') => talk.ask(`${intro}On what kind of realm dost thou play?`, wow.REALMS);
const askFaction = (talk) => talk.ask('For which banner dost thou fight?', wow.FACTIONS.map((f) => ({ ...f, style: f.key === 'horde' ? ButtonStyle.Danger : ButtonStyle.Primary })));
const askRace = (talk, faction) => talk.ask(`Which race of the ${wow.factionOf(faction).label}?`, wow.racesFor(faction));
const askClass = (talk, faction, race) => talk.ask(`And what calling for thy ${wow.raceOf(faction, race).name}?`, wow.classesFor(faction, race));
const askSpec = (talk, cls) => talk.ask(`Which specialization of the ${wow.classOf(cls).label}?`, wow.specsFor(cls));

const newCharacter = async (talk, intro) => {
    const realm = await askRealm(talk, intro);
    const faction = await askFaction(talk);
    const race = await askRace(talk, faction);
    const cls = await askClass(talk, faction, race);
    const spec = await askSpec(talk, cls);
    return { realm, faction, race, cls, spec };
};

// A class and its spec; the spec is asked again whenever the class is.
const askCalling = async (talk, faction, race) => {
    const cls = await askClass(talk, faction, race);
    return { cls, spec: await askSpec(talk, cls) };
};

// Asks for the field chosen and whatever it unsettles; returns the changed character.
const changeField = async (talk, field, c) => {
    if (field === 'realm') return { ...c, realm: await askRealm(talk) };
    if (field === 'spec') return { ...c, spec: await askSpec(talk, c.cls) };
    if (field === 'cls') return { ...c, ...await askCalling(talk, c.faction, c.race) };
    const faction = field === 'faction' ? await askFaction(talk) : c.faction;
    const race = await askRace(talk, faction);
    const keepClass = field === 'race' && wow.classesFor(faction, race).some((cls) => cls.key === c.cls);
    return { ...c, faction, race, ...(keepClass ? {} : await askCalling(talk, faction, race)) };
};

const short = (c) => `${wow.realmOf(c.realm).label}: ${wow.raceOf(c.faction, c.race).name} ${wow.specOf(c.cls, c.spec).label} ${wow.classOf(c.cls).label}`;

const implaying = async function (interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const displayName = (interaction.member && interaction.member.displayName) || interaction.user.username;
    const talk = conversation(interaction);
    const mine = async () => {
        const entry = (await pointsStore.getWowCharacters(guildId)).find((m) => m.userId === userId);
        return entry ? entry.characters.filter(wow.isValid) : [];
    };

    try {
        const characters = await mine();
        const mode = characters.length
            ? await talk.ask(`The herald has ${characters.length === 1 ? 'one character' : `${characters.length} characters`} written beside thy name. A new one, or a change?`, [
                { key: 'new', label: 'New character', style: ButtonStyle.Success },
                { key: 'update', label: 'Update or delete' },
            ])
            : 'new';

        if (mode === 'new') {
            if (characters.length >= wow.MAX_CHARACTERS) {
                await talk.finish(`Thou hast ${wow.MAX_CHARACTERS} characters written already, the most the roster holds. Delete one first with /implaying.`);
                return;
            }
            const character = await newCharacter(talk, characters.length ? '' : 'Well met! ');
            const fresh = await mine();
            if (fresh.some((c) => wow.sameCharacter(c, character))) {
                await talk.finish(`Thou art already written as a ${wow.describe(character)}. The roster stands as it was.`);
                return;
            }
            if (fresh.length >= wow.MAX_CHARACTERS) {
                await talk.finish(`Thou hast ${wow.MAX_CHARACTERS} characters written already, the most the roster holds.`);
                return;
            }
            await pointsStore.setWowCharacters(guildId, userId, displayName, [...fresh, character]);
            console.log(`implaying (guild ${guildId}): ${interaction.user.username} added ${wow.describe(character)}.`);
            await talk.finish(`It is written: **${displayName}**, ${wow.describe(character)}. The court may see it with /wowplayers.`);
            return;
        }

        const index = characters.length === 1
            ? 0
            : Number(await talk.ask('Which character?', characters.map((c, i) => ({ key: String(i), label: short(c) }))));
        const target = characters[index];
        const field = await talk.ask(`Thy ${wow.describe(target)}. What wouldst thou change?`, [
            { key: 'delete', label: 'Delete', style: ButtonStyle.Danger },
            { key: 'realm', label: 'Realm type' },
            { key: 'faction', label: 'Faction' },
            { key: 'race', label: 'Race' },
            { key: 'cls', label: 'Class' },
            { key: 'spec', label: 'Specialization' },
        ]);
        const changed = field === 'delete' ? null : await changeField(talk, field, target);

        const fresh = await mine();
        const at = fresh.findIndex((c) => wow.sameCharacter(c, target));
        if (at < 0) {
            await talk.finish('That character is no longer written beside thy name. The roster stands as it is.');
            return;
        }
        if (!changed) {
            await pointsStore.setWowCharacters(guildId, userId, displayName, fresh.filter((_, i) => i !== at));
            console.log(`implaying (guild ${guildId}): ${interaction.user.username} deleted ${wow.describe(target)}.`);
            await talk.finish(`Struck from the roster: thy ${wow.describe(target)}.`);
            return;
        }
        if (wow.sameCharacter(changed, target)) {
            await talk.finish(`Thy ${wow.describe(target)} stands unchanged.`);
            return;
        }
        if (fresh.some((c) => wow.sameCharacter(c, changed))) {
            await talk.finish(`Thou art already written as a ${wow.describe(changed)}. The roster stands as it was.`);
            return;
        }
        await pointsStore.setWowCharacters(guildId, userId, displayName, fresh.map((c, i) => (i === at ? changed : c)));
        console.log(`implaying (guild ${guildId}): ${interaction.user.username} changed ${wow.describe(target)} to ${wow.describe(changed)}.`);
        await talk.finish(`It is amended: **${displayName}**, ${wow.describe(changed)}.`);
    } catch (error) {
        if (error instanceof Stop) {
            await talk.finish(error.content).catch(() => {});
            return;
        }
        console.error('Error handling /implaying:', error);
        await talk.finish('Alack! The herald\'s roster is sealed to mine eyes at present. Pray try again anon!').catch(() => {});
    }
};

module.exports = {
    description: 'Tell the court which WoW characters thou art playing, or change them',
    category: 'WOW',
    ephemeral: true,
    run: implaying,
};
