/* Flavor text for the shop, /buy, /equip and /flex (see commands/passive/shop.js,
 * commands/prompts/buy.js, equip.js, flex.js). Each entry is a function
 * returning its array of strings (some take parameters to interpolate).
 */

const shopOpenLines = () => [
    'Hear ye! The merchant has unpacked his wares. Be quick, good nobles.',
    'The Herald flings wide the shop doors! Gear, titles, classes and races await thy purse.',
];

const shopClosedLines = () => [
    'The shop lies shuttered, good noble. Return on the morrow, when the merchant unpacks anew.',
    'The merchant has packed his wares for the day. Come back when the Herald next opens the stalls.',
];

// Posted at midnight Eastern, when the day's shop closes.
const shopClosingLines = () => [
    'Midnight tolls! The merchant draws the shutters and packs his wares. The stalls open anew at the ninth hour, Pacific.',
    'Hear ye! The shop is closed for the night. Whatever went unsold returns to the merchant\'s cart. Fresh wares come with the morrow.',
    'The candles gutter and the merchant locks his strongbox. The shop is shut until the morrow, good nobles.',
];

const notInShopLines = (name) => [
    `The merchant has no **${name}** on his shelves today.`,
    `**${name}** is not among today's wares, good noble.`,
];

// `unique` is true for titles, which have a single copy.
const soldOutLines = (name, unique = false) => [
    unique
        ? `**${name}** is sold out for today. The merchant's only copy has found its owner.`
        : `**${name}** is sold out for today. The merchant's copies have found their owners.`,
    `Alas, the last of the **${name}** has been bought. Try again on the morrow.`,
];

const cannotAffordLines = (name, price) => [
    `Thy purse is too light for **${name}**, which costs ${price} points.`,
    `The merchant shakes his head: **${name}** costs ${price} points, and thou hast fewer.`,
];

// Gear bought for an empty slot goes straight on, so it's worn already.
const purchasedEquippedLines = (buyer, name) => [
    `${buyer} hands over the coin, and **${name}** is buckled on at once.`,
    `**${name}** is now worn by ${buyer}. The sheet is all the better for it.`,
];

// The purchase went through. `kind` is gear, title, class or race.
const purchasedLines = (buyer, name, kind) => {
    if (kind === 'gear') return [
        `${buyer} hands over the coin and carries **${name}** to their bag.`,
        `**${name}** is ${buyer}'s now. Equip it with \`/equip\` when thou art ready.`,
    ];
    if (kind === 'title') return [
        `The Herald proclaims: ${buyer} is henceforth known as **${name}**!`,
        `A new title for ${buyer}: **${name}**. Let the realm take note.`,
    ];
    if (kind === 'class') return [
        `${buyer} takes up the class of **${name}**.`,
        `The Herald records a new class for ${buyer}: **${name}**.`,
    ];
    return [
        `${buyer} is reborn as a **${name}**. The Herald records the change.`,
        `A new race for ${buyer}: **${name}**.`,
    ];
};

const bankEmptyLines = () => [
    'Thy bag is empty, good noble. Buy gear from the shop to fill it.',
];

const equippedLines = (name, displaced) => [
    displaced
        ? `Thou hast equipped **${name}**. **${displaced}** returns to thy bag.`
        : `Thou hast equipped **${name}**.`,
];

const notInBagLines = (name) => [
    `Thou hast no **${name}** in thy bag, good noble. Check \`/bank\` for what thou owns.`,
];

const notGearLines = (name) => [
    `**${name}** is not a piece of gear, so it cannot be equipped.`,
];

// Titles, classes and races kept in the member's cosmetics (see /buy, /equip).
const cosmeticStoredLine = (name) => `*${name} is kept in their bank, to wear again with \`/equip\`.*`;

const cosmeticWornLines = (name, stored) => [
    stored
        ? `Thou now wearest **${name}**. **${stored}** goes back to thy bank.`
        : `Thou now wearest **${name}**.`,
];

const notInCosmeticsLines = (name) => [
    `Thou dost not own **${name}**, good noble. Check \`/bank\` for the titles, classes and races thou hast.`,
];

const alreadyWornLines = (name) => [
    `Thou already wearest **${name}**, good noble.`,
];

const alreadyOwnedLines = (name) => [
    `**${name}** is already thine, waiting in thy bank. Wear it with \`/equip\`.`,
];

const bagChangedLines = () => [
    'Thy bag changed while the Herald was looking. Try again.',
];

// Asks the holder to confirm sending their title back to the shop.
const titleReturnPromptLines = (title) => [
    `Wilt thou send **${title}** back to the merchant? It will return to the shelves for another noble to claim.`,
];

const titleReturnedLines = (name, title) => [
    `${name} returns **${title}** to the merchant's shelves. It is for sale again.`,
];

const titleSwappedLines = (buyer, oldTitle, newTitle) => [
    `${buyer} sets aside **${oldTitle}** and is henceforth known as **${newTitle}**!`,
];

const titleNotHeldLines = () => [
    'Thou bearest no title to return, good noble.',
];

const shopShutForReturnLines = () => [
    'The shop is shut, so the merchant cannot take a title back until the stalls reopen.',
];

// A discounted piece was bought from another member's listing.
const purchasedDiscountLines = (buyer, name, seller, equipped) => (equipped
    ? [
        `${buyer} snaps up **${name}** at a discount, once ${seller}'s, and buckles it on at once.`,
        `**${name}** passes from ${seller} to ${buyer} at a bargain, and is worn already.`,
    ]
    : [
        `${buyer} snaps up **${name}** at a discount, once ${seller}'s, and carries it to their bag.`,
        `**${name}** passes from ${seller} to ${buyer} at a bargain. Equip it with \`/equip\`.`,
    ]);

const ownListingLines = (name) => [
    `**${name}** is thine own ware, good noble. Thou canst not buy it back.`,
];

// Asks the seller to confirm listing a piece, with what each outcome pays.
const sellPromptLines = (name, salePrice, refund) => [
    `Sell **${name}** back to the merchant? It goes on sale in the next day's shop for ${salePrice} points. If another noble buys it, thou receivest ${salePrice}. If none does, the merchant pays thee ${refund} and keeps it.`,
];

const listedLines = (name) => [
    `**${name}** leaves thy bag for the merchant's cart. Look for it among the discounts in the next day's shop.`,
];

const sellEquippedLines = (name) => [
    `Thou art wearing **${name}**. Only gear in thy bag can be sold: equip another piece in its place first.`,
];

const notSellableLines = (name) => [
    `**${name}** is not a piece of gear, so the merchant will not buy it back.`,
];

// A unique is one of a kind, so the merchant will not take it.
const uniqueNotSellableLines = (name) => [
    `**${name}** is one of a kind. No merchant in the realm would dare put a price on it.`,
    `The merchant will not touch **${name}**. Such things are earned, not sold.`,
];

const confirmCancelledLines = () => [
    'Very well. Nothing has changed.',
];

const confirmExpiredLines = () => [
    'Thy answer came too late, so nothing has changed.',
];

module.exports = {
    purchasedDiscountLines,
    ownListingLines,
    sellPromptLines,
    listedLines,
    sellEquippedLines,
    notSellableLines,
    uniqueNotSellableLines,
    purchasedEquippedLines,
    titleReturnPromptLines,
    titleReturnedLines,
    titleSwappedLines,
    titleNotHeldLines,
    shopShutForReturnLines,
    confirmCancelledLines,
    confirmExpiredLines,
    shopOpenLines,
    shopClosedLines,
    shopClosingLines,
    notInShopLines,
    soldOutLines,
    cannotAffordLines,
    purchasedLines,
    bankEmptyLines,
    equippedLines,
    notInBagLines,
    notGearLines,
    cosmeticStoredLine,
    cosmeticWornLines,
    notInCosmeticsLines,
    alreadyWornLines,
    alreadyOwnedLines,
    bagChangedLines,
};
