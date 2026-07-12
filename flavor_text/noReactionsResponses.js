/* Flavor text: responses when a user has granted no reactions of late.
 * Takes the user's display name. */
const noReactionsResponses = (displayName) => [
    `By my troth! ${displayName} doth keep their expressions of favor most private, Milord. Nary a mark of approval have they left upon the scrolls.`,
    `Verily! ${displayName} appears most reserved in their gestures of acclaim this past moon, good sir.`,
    `Forsooth! The esteemed ${displayName} hath chosen silence over symbols of approval in these recent days, my lord.`,
    `'Tis most curious! ${displayName} seems to favor the spoken word over marks of expression, Milord.`
];

module.exports = noReactionsResponses;
