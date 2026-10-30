/* /trade <item> <player> <offer> - offer a piece of gear from your bag, or a
 * pet by its name, to another member, in exchange for a piece of gear from
 * their bag, one of their pets, or a number of points. A pet can be traded
 * from its owner's side or bank, keeps the item it holds, and goes to its new
 * owner's side if none is there, otherwise to their bank.
 *
 * The Herald checks both sides first: the piece is in your bag (not worn),
 * and the other member has the asked-for piece in their bag or enough
 * points. Then it posts the offer, pinging them, with Accept and Decline
 * buttons only they can use. The offer lapses after TRADE_WINDOW_MS.
 *
 * On Accept both sides are read and checked again, and the swap is one
 * transaction (pointsStore.tradeCharacters), so a bag that changed in the
 * meantime can't duplicate or lose anything. Each piece goes straight into
 * its slot if the new owner's slot is empty, otherwise into their bag.
 *
 * Public, so the deal happens in the open. Offers live in memory only, so a
 * restart drops any that are still waiting.
 */

const { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { matchEntry } = require('../../src/character');
const { matchPet, petKind } = require('../../src/pets');
const achievements = require('../../src/achievements');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

// Longer than the 15 minutes an interaction token lives, so once the offer is
// posted, the herald answers through the offer message and the clicks, not the command.
const TRADE_WINDOW_MS = 30 * 60 * 1000;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Only gear with a real slot can be traded.
const GEAR = catalog.GEAR.filter((entry) => catalog.GEAR_SLOTS.includes(entry.slot));

// Takes one copy of `id` out of `bag`. Returns false if there is none.
const removeOne = (bag, id) => {
    const index = bag.indexOf(id);
    if (index === -1) return false;
    bag.splice(index, 1);
    return true;
};

// Puts a piece into its slot if that slot is empty, otherwise into the bag.
// Returns true if it was equipped.
const place = (entry, gear, bag) => {
    if (!gear[entry.slot]) {
        gear[entry.slot] = entry.id;
        return true;
    }
    bag.push(entry.id);
    return false;
};

// Takes the pet with `id` from a member, from their side or their bank.
// Returns the pet, or null if they don't have it.
const takePet = (pets, id) => {
    if (pets.pet && pets.pet.id === id) {
        const taken = pets.pet;
        pets.pet = null;
        return taken;
    }
    const index = pets.pets.findIndex((p) => p.id === id);
    return index === -1 ? null : pets.pets.splice(index, 1)[0];
};

// Puts a pet at its new owner's side if none is there, otherwise in their
// bank. Returns true if it went to their side.
const placePet = (pet, pets) => {
    if (!pets.pet) {
        pets.pet = pet;
        return true;
    }
    pets.pets.push(pet);
    return false;
};

/* Works out the trade from both members' current characters. `offer` is
 * { fromId, fromName, toId, toName, give, want, points }, where give and want
 * are goods, { name, entry } for gear or { name, pet } for a pet (want is
 * null for a points offer). A pet may be traded from its owner's side or
 * bank, and keeps the item it holds. Returns { error } or
 * { sides, fromEquipped, toEquipped } ready for pointsStore.tradeCharacters.
 */
const planTrade = (offer, from, to) => {
    const fromBag = [...from.bag];
    const toBag = [...to.bag];
    const fromGear = { ...from.gear };
    const toGear = { ...to.gear };
    const fromPets = { pet: from.pet || null, pets: [...(from.pets || [])] };
    const toPets = { pet: to.pet || null, pets: [...(to.pets || [])] };
    const { give, want } = offer;

    const given = give.pet ? takePet(fromPets, give.pet.id) : removeOne(fromBag, give.entry.id);
    if (!given) return { error: 'giverMissing' };
    const wanted = want && (want.pet ? takePet(toPets, want.pet.id) : removeOne(toBag, want.entry.id));
    if (want && !wanted) return { error: 'receiverMissing' };
    if (offer.points && to.points < offer.points) return { error: 'receiverPoor' };

    const toEquipped = give.pet ? placePet(given, toPets) : place(give.entry, toGear, toBag);
    let fromEquipped = false;
    if (want) fromEquipped = want.pet ? placePet(wanted, fromPets) : place(want.entry, fromGear, fromBag);
    const points = offer.points || 0;
    // Pets are only written when one changes hands.
    const petsMove = Boolean(give.pet || (want && want.pet));
    const side = (id, name, before, bag, gear, pets, gain) => ({
        userId: id,
        displayName: name,
        before: { bag: before.bag, gear: before.gear, ...(petsMove && { pet: before.pet || null, pets: before.pets || [] }) },
        bag,
        gear,
        ...(petsMove && pets),
        points: gain,
    });
    return {
        sides: [
            side(offer.fromId, offer.fromName, from, fromBag, fromGear, fromPets, points),
            side(offer.toId, offer.toName, to, toBag, toGear, toPets, -points),
        ],
        fromEquipped,
        toEquipped,
    };
};

// What a member typed for one side of a trade, read against what they own:
// gear in their bag, or a pet at their side or in their bank, by name.
const goodsIn = (character, typed) => {
    const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
    const entry = matchEntry(inBag, typed);
    if (entry) return { name: entry.name, entry };
    const pet = matchPet([character.pet, ...character.pets].filter(Boolean), typed);
    return pet ? { name: `${pet.name} the ${petKind(pet)}`, pet } : null;
};

// The placement line for goods arriving with `who`.
const placedLine = (who, goods, equipped) => (goods.pet
    ? flavor.tradePetPlacedLine(who, goods.pet.name, equipped)
    : flavor.tradePlacedLine(who, goods.name, equipped));

// The reply for a plan that can't go ahead.
const errorLines = (error, offer) => {
    if (error === 'giverMissing') return flavor.tradeGiverMissingLines(offer.fromName, offer.give.name);
    if (error === 'receiverMissing') return flavor.tradeReceiverMissingLines(offer.toName, offer.want.name);
    return flavor.tradeReceiverPoorLines(offer.toName, offer.points);
};

const readPlan = async (guildId, offer) => {
    const [from, to] = await Promise.all([
        pointsStore.getCharacter(guildId, offer.fromId),
        pointsStore.getCharacter(guildId, offer.toId),
    ]);
    return planTrade(offer, from, to);
};

const buttons = (disabled) => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('trade_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId('trade_decline').setLabel('Decline').setStyle(ButtonStyle.Danger).setDisabled(disabled)
);

const trade = async function (interaction) {
    const guildId = interaction.guild.id;
    const giver = interaction.member;
    const receiver = interaction.options.getMember('player');
    const typedItem = interaction.options.getString('item');
    const typedOffer = interaction.options.getString('offer').trim();

    try {
        if (!receiver) {
            await interaction.editReply('The Herald cannot find that noble in this court.');
            return;
        }
        if (receiver.id === giver.id) {
            await interaction.editReply(pick(flavor.tradeSelfLines()));
            return;
        }
        if (receiver.user.bot) {
            await interaction.editReply(pick(flavor.tradeBotLines()));
            return;
        }

        const giverChar = await pointsStore.getCharacter(guildId, giver.id);
        const give = goodsIn(giverChar, typedItem);
        if (!give) {
            const worn = matchEntry(Object.values(giverChar.gear).map((id) => catalog.findEntry(id)).filter(Boolean), typedItem);
            await interaction.editReply(pick(worn ? flavor.tradeEquippedLines(worn.name) : flavor.notInBagLines(typedItem)));
            return;
        }

        // The offer is a whole number of points, or the name of a piece of
        // gear or a pet the other member owns.
        const receiverChar = await pointsStore.getCharacter(guildId, receiver.id);
        const points = /^\d+$/.test(typedOffer) ? Number(typedOffer) : null;
        let want = null;
        if (points === null) {
            const gear = matchEntry(GEAR, typedOffer);
            want = gear ? { name: gear.name, entry: gear } : goodsIn(receiverChar, typedOffer);
        }
        if (points === 0 || (points === null && !want)) {
            await interaction.editReply(pick(flavor.tradeBadOfferLines(typedOffer)));
            return;
        }

        const offer = {
            fromId: giver.id, fromName: giver.displayName,
            toId: receiver.id, toName: receiver.displayName,
            give, want, points,
        };
        const first = planTrade(offer, giverChar, receiverChar);
        if (first.error) {
            await interaction.editReply(pick(errorLines(first.error, offer)));
            return;
        }

        const message = await interaction.editReply({
            content: pick(flavor.tradeOfferLines(`${receiver}`, giver.displayName, give.name, want && want.name, points, TRADE_WINDOW_MS / 60000)),
            components: [buttons(false)],
            allowedMentions: { users: [receiver.id] },
        });
        console.log(`Trade (guild ${guildId}): ${giver.displayName} (${giver.id}) offered ${give.name} to ${receiver.displayName} (${receiver.id}) for ${want ? want.name : `${points} points`}.`);

        let answer = null;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: TRADE_WINDOW_MS });
        await new Promise((resolve) => {
            collector.on('collect', async (click) => {
                if (click.user.id !== receiver.id) {
                    const lines = click.user.id === giver.id ? flavor.tradeAwaitLines() : flavor.tradeNotForYouLines();
                    await click.reply({ content: pick(lines), flags: MessageFlags.Ephemeral }).catch(() => {});
                    return;
                }
                answer = click;
                collector.stop();
            });
            collector.on('end', resolve);
        });

        await message.edit({ components: [buttons(true)] }).catch(() => {});

        if (!answer) {
            await message.reply({ content: pick(flavor.tradeExpiredLines(receiver.displayName)), allowedMentions: { repliedUser: false } });
            return;
        }
        if (answer.customId === 'trade_decline') {
            console.log(`Trade (guild ${guildId}): ${receiver.displayName} declined.`);
            await answer.reply(pick(flavor.tradeDeclinedLines(receiver.displayName)));
            return;
        }

        // Both sides may have changed while the offer waited, so check again.
        await answer.deferReply();
        const plan = await readPlan(guildId, offer);
        if (plan.error) {
            await answer.editReply(pick(errorLines(plan.error, offer)));
            return;
        }
        if (!await pointsStore.tradeCharacters(guildId, plan.sides)) {
            await answer.editReply(pick(flavor.tradeChangedLines()));
            return;
        }

        console.log(`Trade (guild ${guildId}): ${receiver.displayName} accepted; ${give.name} for ${want ? want.name : `${points} points`}.`);
        const lines = [
            pick(flavor.tradeSealedLines(giver.displayName, receiver.displayName, give.name, want && want.name, points)),
            placedLine(receiver.displayName, give, plan.toEquipped),
        ];
        if (want) lines.push(placedLine(giver.displayName, want, plan.fromEquipped));
        await answer.editReply(lines.join('\n'));
        const traders = plan.sides.map((s) => ({ userId: s.userId, displayName: s.displayName }));
        await achievements.record(guildId, traders.map((t) => ({ ...t, counts: { trades: 1 } })), interaction.channel);
        await achievements.checkStats(guildId, traders, interaction.channel);
    } catch (error) {
        console.error('Error handling /trade:', error);
        await interaction.followUp('Alack! The ledger is sealed to mine eyes at present. Pray try again anon!').catch(() => {});
    }
};

module.exports = {
    description: 'Offer gear from your bag, or a pet, to another member for their gear, pet or points',
    category: 'SHOP',
    options: [
        {
            name: 'item',
            description: 'The exact name of the gear in your bag, or of your pet, to give',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'player',
            description: 'Who you are offering it to',
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'offer',
            description: 'What you want back: gear in their bag, their pet by name, or a number of points',
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    run: trade,
    planTrade,
    TRADE_WINDOW_MS,
};
