/* The Herald's reveal (see docs/the-last-proclamation.md). When the fifth
 * relic is claimed, the herald hails the five Echoes at once (revealHailLines),
 * then posts the three REVEAL_MORNINGS on the next three mornings at 9 AM
 * Eastern, alongside where the lore drops went (src/campaign.js). Short
 * posts, not the long lore drops: the herald's voice shifts from chronicler
 * to participant, one step at a time, until the third names him as the
 * court's last challenge. After it, /herald_challenge may name the day.
 *
 * No parentheses: this is herald dialogue.
 */

// `names` reads like "Robin, Sam, Ash, Kit and Wren".
const revealHailLines = (names) => [
    `Hear ye! Five Echoes of this age have walked old roads to their ends, and relics of the old waves have risen for them: ${names}. I have watched that happen more times than I can count, and it has never once failed to make my hands shake. Mark the day. Come and hear me in the morning.`,
];

const REVEAL_MORNINGS = [
    {
        title: 'The Staff',
        text: 'A question the scholars never thought to ask. Why did no one in the old world strike a herald? Not the Greeks, not the Trojans, not the giants of the north. It was not law. Laws break in wartime. It was that every army, in its heart, knew the herald was not on the other side. **The herald was on the side of the age.** Hold onto that. You will need it.',
    },
    {
        title: 'Many Names',
        text: 'I told you a charioteer saw a whole war and told it true to a blind king. I told you of a runner with earth on his head, and two heralds who held their staffs between champions at nightfall. I told you of a doorkeeper with one question, and a small boy who ran a king\'s word across a kingdom in boots too big for him. I told you to look for the staff and the horn.\n\nI wonder how many of you looked.',
    },
    {
        title: 'The Reveal and the Call',
        text: [
            '**There were never heralds, court of the King. There was a herald.**',
            '',
            'I told a blind king his war. I ran to Shiloh with earth on my head. I held my staff between Hector and Ajax, and handed a sword down a road I could not see the end of. I let Lugh in at Tara. I put on fairy boots and became the first herald of the Hearth. I have worn more names than any relic in your trials, and I have carried the last challenge to every age that ever crested.',
            '',
            'Every one of those ages had a rival to break against. You do not. So this time, I will not carry the challenge. **I am the challenge.**',
            '',
            'I do not want your kingdom. I do not want your relics. I want to know how high you can go. Five of you have already walked the old roads and come back changed. The rest of you have heard the rumors too: a hammer in a bride\'s lap, a fleece where nothing sleeps, a sword a dying man could not break. Follow them. Claim your own arms: they are the start of an era. Then come together, all of you, as one court, and meet me in a grand duel, as an age meets its last enemy. Defeat me, and usher in the new age.',
            '',
            'I will name the day. And if you win, I will tell you its name.',
        ].join('\n'),
    },
];

module.exports = { revealHailLines, REVEAL_MORNINGS };
