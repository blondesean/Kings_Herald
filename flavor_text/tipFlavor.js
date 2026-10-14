/* Flavor text for /tip (see commands/prompts/tip.js). Each entry is a
 * function returning its array of strings.
 */

const pointsText = (n) => `${n} point${n === 1 ? '' : 's'}`;

// The herald's thanks, grander for a larger tip.
const tipThanksLines = (who, amount) => {
    if (amount >= 50) {
        return [
            `The herald nearly drops his scroll. ${who} lays **${pointsText(amount)}** at his feet! Such largesse shall be sung of in every hall of the realm, and the herald shall sing it loudest.`,
            `By the crown! ${who} gifts the herald **${pointsText(amount)}**. He bows so low his hat brushes the flagstones. Never was a herald so honored.`,
        ];
    }
    if (amount >= 10) {
        return [
            `${who} presses **${pointsText(amount)}** into the herald's hand. He bows deeply: a most generous gift, and it shall not be forgotten.`,
            `The herald accepts **${pointsText(amount)}** from ${who} with a sweeping bow. Thy kindness warms this old crier's heart, good noble.`,
        ];
    }
    return [
        `${who} tosses the herald **${pointsText(amount)}**. He catches it neatly and doffs his cap: many thanks, good noble!`,
        `The herald pockets **${pointsText(amount)}** from ${who} with a grateful nod. Every coin is a kindness, and this one is well remembered.`,
        `${who} slips the herald **${pointsText(amount)}**. He bows: thy herald is ever at thy service.`,
    ];
};

// The running tally, appended after the thanks.
const tipTallyLine = (total, given) =>
    `*The herald's purse now holds ${pointsText(total)}. Of these, thou hast given ${pointsText(given)}.*`;

const tipCannotAffordLines = (amount) => [
    `Thy purse cannot spare **${pointsText(amount)}**, good noble. The herald thanks thee for the thought all the same.`,
    `Alas, thou hast not **${pointsText(amount)}** to give. Keep thy coin, friend. The thought is gift enough.`,
];

module.exports = {
    tipThanksLines,
    tipTallyLine,
    tipCannotAffordLines,
};
