/* /sell <item> - sell gear from your bag back to the merchant, or give up a pet.
 *
 * The piece leaves your bag at once and goes on sale in the next day's shop,
 * in its Discounts section, one copy at 25% off. If another member buys it,
 * you're paid what they paid; if it's still unsold when that shop closes,
 * you're paid half its full price and the piece is gone for good. The rules
 * and payouts live in commands/passive/shop.js.
 *
 * A pet, at your side or in the bank, is named by its name or its full name
 * with its title. It goes on sale in the next day's shop, name and title and
 * all, for PET_RESALE_PRICE, and you're paid nothing, sold or not. Unsold, it
 * leaves the realm. The gear it holds comes back to your bag.
 *
 * Several things can be sold at once, separated by commas, up to SELL_MAX.
 * Some gear names have commas of their own ("Sulfuras, Hand of Ragnaros"), as
 * can a pet's title, so neighbouring pieces that together make a known name
 * are read as one. A gear name typed twice sells two copies. Names that can't
 * be sold are listed in the confirmation and left out; the rest are sold
 * together, or not at all. Gear in the bag is matched before a pet of the
 * same name.
 *
 * Only gear in the bag can be sold, not what you're wearing. You're asked to
 * confirm first. Private, so only you see the reply.
 */

const { ApplicationCommandOptionType } = require('discord.js');
const pointsStore = require('../../src/pointsStore');
const { matchEntry } = require('../../src/character');
const { askConfirm } = require('../../src/confirm');
const { easternDay, discountPrice, unsoldRefund } = require('../passive/shop');
const { petFullName, petKind, PET_RESALE_PRICE } = require('../../src/pets');
const catalog = require('../passive/shopCatalog');
const flavor = require('../../flavor_text');

const SELL_MAX = 15;
// Discord's limit on a message's length.
const MESSAGE_MAX = 2000;

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Builds a reply from `build(lines)`, folding the last of the refused lines
// into a count when they'd push it past MESSAGE_MAX.
const fitRefused = (build, refused) => {
    for (let shown = refused.length; shown > 0; shown--) {
        const hidden = refused.length - shown;
        const text = build(hidden ? [...refused.slice(0, shown), pick(flavor.sellMoreRefusedLines(hidden))] : refused);
        if (text.length <= MESSAGE_MAX) return text;
    }
    return build(refused.length ? [pick(flavor.sellMoreRefusedLines(refused.length))] : []);
};

/* Splits what was typed into names at its commas. Pieces are rejoined,
 * longest run first, when together they make a name in `known`, so
 * "Sulfuras, Hand of Ragnaros, Fire Cape" gives two names, not three.
 */
const splitNames = (typed, known) => {
    const pieces = String(typed || '').split(',').map((p) => p.trim());
    const names = [];
    for (let i = 0; i < pieces.length;) {
        let end = i + 1;
        for (let j = pieces.length; j > i + 1; j--) {
            if (matchEntry(known, pieces.slice(i, j).join(', '))) {
                end = j;
                break;
            }
        }
        names.push(pieces.slice(i, end).join(', '));
        i = end;
    }
    return names.filter(Boolean);
};

// Every pet the member has, at their side and in the bank.
const petsOf = (character) => [character.pet, ...(character.pets || [])].filter(Boolean);

// The pet whose name, or name with its title, matches what was typed, or null.
const matchOwnPet = (pets, typed) => {
    const wanted = String(typed || '').trim().toLowerCase();
    return pets.find((pet) => [pet.name, petFullName(pet)].some((name) => name.toLowerCase() === wanted)) || null;
};

/* Sorts the names into the gear to sell, [entry, ...] with one entry per
 * copy, the pets to give up, and a line for each name that can't be sold.
 * Copies are counted against the bag, so a name typed more often than it's
 * owned is refused for the extras.
 */
const sortSale = (names, character) => {
    const inBag = [...new Set(character.bag)].map((id) => catalog.findEntry(id)).filter(Boolean);
    const worn = Object.values(character.gear || {}).map((id) => catalog.findEntry(id)).filter(Boolean);
    const owned = petsOf(character);
    const left = {};
    for (const id of character.bag) left[id] = (left[id] || 0) + 1;
    const sold = [];
    const pets = [];
    const refused = [];
    for (const typed of names) {
        const entry = matchEntry(inBag, typed);
        const pet = !entry && matchOwnPet(owned, typed);
        if (pet) {
            // A pet named twice is still only one pet.
            if (!pets.includes(pet)) pets.push(pet);
        } else if (entry && entry.unique) {
            // A unique is one of a kind and never goes back to the merchant.
            refused.push(pick(flavor.uniqueNotSellableLines(entry.name)));
        } else if (entry && left[entry.id] > 0) {
            left[entry.id] -= 1;
            sold.push(entry);
        } else if (entry) {
            refused.push(pick(flavor.sellNotEnoughLines(entry.name, character.bag.filter((id) => id === entry.id).length)));
        } else {
            // Tell apart worn gear, things that aren't gear, and things not owned at all.
            const wornEntry = matchEntry(worn, typed);
            const known = matchEntry(catalog.ALL, typed);
            const reply = wornEntry ? flavor.sellEquippedLines(wornEntry.name)
                : known && !known.slot ? flavor.notSellableLines(known.name)
                    : flavor.notInBagLines(typed);
            refused.push(pick(reply));
        }
    }
    return { sold, pets, refused };
};

// The confirmation: one piece or one pet, with nothing refused, reads on its
// own; anything more is listed.
const promptFor = (sold, pets, refused) => {
    const held = (pet) => (catalog.findEntry(pet.item) || {}).name || null;
    if (sold.length === 1 && !pets.length && !refused.length) {
        return pick(flavor.sellPromptLines(sold[0].name, discountPrice(sold[0].price), unsoldRefund(sold[0].price)));
    }
    if (pets.length === 1 && !sold.length && !refused.length) {
        return pick(flavor.petGiveUpPromptLines(petFullName(pets[0]), petKind(pets[0]), PET_RESALE_PRICE, held(pets[0])));
    }
    const items = [
        ...sold.map((e) => ({ name: e.name, salePrice: discountPrice(e.price), refund: unsoldRefund(e.price) })),
        ...pets.map((pet) => ({ name: petFullName(pet), kind: petKind(pet), price: PET_RESALE_PRICE, held: held(pet), pet: true })),
    ];
    return fitRefused((lines) => pick(flavor.sellManyPromptLines(items, lines)), refused);
};

/* What the seller keeps, as `before` and `after` for createListings: the bag
 * without the gear sold but with whatever the pets given up were holding,
 * and their pets without those given up.
 */
const keptAfterSale = (character, sold, pets) => {
    const bag = [...character.bag];
    for (const entry of sold) bag.splice(bag.indexOf(entry.id), 1);
    for (const pet of pets) if (pet.item) bag.push(pet.item);
    const before = { bag: character.bag };
    const after = { bag };
    if (pets.length) {
        before.pet = character.pet || null;
        before.pets = character.pets || [];
        if (character.pet && pets.includes(character.pet)) after.pet = null;
        const banked = (character.pets || []).filter((pet) => !pets.includes(pet));
        if (banked.length !== before.pets.length) after.pets = banked;
    }
    return { before, after };
};

const sell = async function (interaction) {
    const typed = interaction.options.getString('item');
    const guildId = interaction.guild.id;
    const seller = interaction.member;

    try {
        const character = await pointsStore.getCharacter(guildId, seller.id);
        // Pet titles can hold commas too, so full pet names count as known.
        const known = [...catalog.ALL, ...petsOf(character).map((pet) => ({ name: petFullName(pet) }))];
        const names = splitNames(typed, known);
        if (names.length > SELL_MAX) {
            await interaction.editReply(pick(flavor.sellTooManyLines(SELL_MAX)));
            return;
        }
        const { sold, pets, refused } = sortSale(names, character);
        if (!sold.length && !pets.length) {
            await interaction.editReply(refused.length ? fitRefused((lines) => lines.join('\n'), refused) : pick(flavor.notInBagLines(typed)));
            return;
        }

        await interaction.editReply('Thy request awaits thy word, in secret.');
        const confirmed = await askConfirm(interaction, promptFor(sold, pets, refused));
        if (!confirmed) return;

        // Everything leaves together. The write only lands if the bag and pets
        // are unchanged since they were read above, so a piece can't be
        // equipped and sold at once, nor a pet traded and given up.
        const { before, after } = keptAfterSale(character, sold, pets);
        const listedDay = easternDay();
        const listings = [
            ...sold.map((entry) => ({ itemId: entry.id, price: entry.price, listedDay })),
            ...pets.map((pet) => ({ itemId: `pet:${pet.species}`, pet: { ...pet, item: null }, price: PET_RESALE_PRICE, listedDay })),
        ];
        const listingIds = await pointsStore.createListings(guildId, seller, listings, before, after);
        if (!listingIds) {
            await interaction.followUp(pick(flavor.bagChangedLines()));
            return;
        }

        const listedNames = [...sold.map((e) => e.name), ...pets.map((pet) => petFullName(pet))];
        console.log(`Sell (guild ${guildId}): ${seller.displayName} (${seller.id}) listed ${listedNames.map((name, i) => `${name} (${listingIds[i]})`).join(', ')}.`);
        let reply;
        if (listedNames.length > 1) reply = flavor.listedManyLines(listedNames);
        else if (pets.length) reply = flavor.petGivenUpLines(pets[0].name);
        else reply = flavor.listedLines(listedNames[0]);
        await interaction.followUp(pick(reply));
    } catch (error) {
        console.error('Error handling /sell:', error);
        await interaction.followUp('Alack! The merchant\'s ledger is sealed to mine eyes at present. Pray try again anon!');
    }
};

module.exports = {
    description: 'Sell gear from your bag or give up a pet, several separated by commas (visible only to you)',
    category: 'SHOP',
    ephemeral: true,
    options: [
        {
            name: 'item',
            description: 'Gear in your bag or a pet, as shown in /bank. Separate several with commas',
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1000,
        },
    ],
    run: sell,
    splitNames,
    sortSale,
    keptAfterSale,
    SELL_MAX,
};
