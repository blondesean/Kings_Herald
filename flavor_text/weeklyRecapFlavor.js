/* Flavor text for the weekly recap (see commands/passive/weeklyRecap.js).
 * Currently just the "closest companions" aside — a fun fact about who
 * spent the most time together in voice this week, not a real ranked
 * category, so it's framed as court gossip rather than an award.
 * `pairsText` is a pre-joined mention string (one pair, or several tied for
 * the top spot); `hoursText` is the pre-formatted time they shared.
 */
const buddyRumorLines = (pairsText, hoursText) => [
    `And word around the court: ${pairsText} spent more time together in voice than anyone else this week — ${hoursText}, by the Herald's count.`,
    `The court whispers that ${pairsText} were scarcely apart this week, sharing ${hoursText} together in voice.`,
    `Rumor has it ${pairsText} logged more hours side by side in voice than the rest of the realm combined — ${hoursText}, to be precise.`,
    `The Herald has heard tell that ${pairsText} could hardly be pulled apart this week — ${hoursText} spent together in voice.`,
    `Idle court gossip: ${pairsText} were practically joined at the hip this week, ${hoursText} together in voice and counting.`,
];

module.exports = { buddyRumorLines };
