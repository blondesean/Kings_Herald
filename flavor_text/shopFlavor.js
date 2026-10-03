/* Flavor text for the shop, /buy, /equip and /flex (see commands/passive/shop.js,
 * commands/prompts/buy.js, equip.js, flex.js). Each entry is a function
 * returning its array of strings (some take parameters to interpolate).
 */

const shopOpenLines = () => [
    'Hear ye! The traveling merchant has unpacked his wares. Be quick, for each treasure has but two copies in all the realm.',
    'The Herald flings wide the shop doors! Gear, titles, callings and kindreds await thy purse, but only two of each.',
];

const shopClosedLines = () => [
    'The shop lies shuttered, good noble. Return on the morrow, when the merchant unpacks anew.',
    'The merchant has packed his wares for the day. Come back when the Herald next opens the stalls.',
];

const notInShopLines = (name) => [
    `The merchant has no **${name}** on his shelves today.`,
    `**${name}** is not among today's wares, good noble.`,
];

const soldOutLines = (name) => [
    `**${name}** is sold out for today. The merchant's two copies have found their owners.`,
    `Alas, the last of the **${name}** has been bought. Try again on the morrow.`,
];

const cannotAffordLines = (name, price) => [
    `Thy purse is too light for **${name}**, which costs ${price} points.`,
    `The merchant shakes his head: **${name}** costs ${price} points, and thou hast fewer.`,
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
        `${buyer} takes up the calling of **${name}**, leaving the old one behind.`,
        `The Herald records a new calling for ${buyer}: **${name}**.`,
    ];
    return [
        `${buyer} is reborn as a **${name}**. The Herald records the change.`,
        `A new kindred for ${buyer}: **${name}**.`,
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

const bagChangedLines = () => [
    'Thy bag changed while the Herald was looking. Try again.',
];

// Asks the holder to confirm sending their title back to the shop.
const titleReturnPromptLines = (title) => [
    `Wilt thou send **${title}** back to the merchant? It will return to the shelves for another noble to claim.`,
];

// Asks whether to swap titles, with the new one's price.
const titleSwapPromptLines = (oldTitle, newTitle, price) => [
    `Thou already bearest **${oldTitle}**. Send it back to the merchant and take **${newTitle}** for ${price} points?`,
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

const confirmCancelledLines = () => [
    'Very well. Nothing has changed.',
];

const confirmExpiredLines = () => [
    'Thy answer came too late, so nothing has changed.',
];

module.exports = {
    titleReturnPromptLines,
    titleSwapPromptLines,
    titleReturnedLines,
    titleSwappedLines,
    titleNotHeldLines,
    shopShutForReturnLines,
    confirmCancelledLines,
    confirmExpiredLines,
    shopOpenLines,
    shopClosedLines,
    notInShopLines,
    soldOutLines,
    cannotAffordLines,
    purchasedLines,
    bankEmptyLines,
    equippedLines,
    notInBagLines,
    notGearLines,
    bagChangedLines,
};
