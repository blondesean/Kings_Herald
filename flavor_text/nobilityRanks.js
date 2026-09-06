/* Flavor text: the ladder of nobility titles earned from weekly-recap points.
 *
 * Ordered ascending, climbing through real-world (then fantastical) precedence:
 * commons and local office, the learned professions, the military and peerage,
 * the sovereigns of the mortal realm, and finally the rulers of the cosmos.
 *
 * The step between rungs widens as the ladder climbs, so early points come
 * fast and the top is a long haul:
 *   -   0        : Peasant — the starting station, below the first real rung
 *   -   5 to  50: +5   per rung (10 rungs)
 *   -  50 to 100: +10  per rung (5 rungs)
 *   - 100 to 250: +25  per rung (6 rungs)
 *   - 250 to 500: +50  per rung (5 rungs)
 *   - 500 and up: +100 per rung (9 rungs) — the universe-ruling capstone titles
 * All 26 titles from the original ladder are kept, in their original order —
 * only the spacing changed, so the top of the ladder now sits at 1900 rather
 * than 500. Widening the steps rather than dropping titles was deliberate:
 * the climb takes longer, but nothing about the cast of titles does.
 *
 * Where several titles shared a real-world tier (King of Quips, Sultan of
 * Speech, Czar of Chatter...), the cooler phrase won and the rest were
 * retired. To add a rank, insert a rung at its rightful station — the
 * command derives everything from this array, so no other change is needed.
 * Points don't need to stay evenly spaced; pick whatever fits the
 * surrounding tier.
 */
const nobilityRanks = () => [
    // The starting station — anyone with points but below the first real rung
    { points: 0, title: 'Peasant' },
    // The commons and local office
    { points: 5, title: 'Sheriff of Small Talk' },
    { points: 10, title: 'Boss of Babble' },
    { points: 15, title: 'Chief of Chinwagging' },
    { points: 20, title: 'Mayor of Mouthiness' },
    { points: 25, title: 'Governor of Gab' },
    // The learned professions
    { points: 30, title: 'Dean of Discourse' },
    { points: 35, title: 'Master of Monologue' },
    { points: 40, title: 'Maestro of Messaging' },
    { points: 45, title: 'Wizard of Words' },
    { points: 50, title: 'Captain of Conversation' },
    // The military and peerage
    { points: 60, title: 'Marshal of Mouth Music' },
    { points: 70, title: 'Chancellor of Chat' },
    { points: 80, title: 'Baron of Banter' },
    { points: 90, title: 'Earl of Excessive Explanation' },
    { points: 100, title: 'Prince of Persuasion' },
    // The sovereigns of the mortal realm (+25 per rung from here)
    { points: 125, title: 'King of Kibitzing' },
    { points: 150, title: 'Tyrant of Talk' },
    { points: 175, title: 'Sultan of Speech' },
    { points: 200, title: 'Czar of Chatter' },
    { points: 225, title: 'Kaiser of Kvetching' },
    { points: 250, title: 'Khan of Klatsch' },
    // (+50 per rung from here)
    { points: 300, title: 'Pharaoh of Prattle' },
    { points: 350, title: 'Doge of Dialogue' },
    { points: 400, title: 'Shogun of Soliloquy' },
    { points: 450, title: 'Maharaja of Mutterings' },
    { points: 500, title: 'Emperor of Eloquence' },
    // The rulers of the cosmos (+100 per rung from here)
    { points: 600, title: 'Pope of Palaver' },
    { points: 700, title: 'High King of Hot Takes' },
    { points: 800, title: 'Grand Sultan of Gossip' },
    { points: 900, title: 'Supreme Sovereign of Speech' },
    { points: 1000, title: 'World Emperor of Wit' },
    { points: 1100, title: 'Celestial Czar of Chat' },
    { points: 1200, title: 'Divine Despot of Discourse' },
    { points: 1300, title: 'Almighty Autocrat of Answers' },
    { points: 1400, title: 'Eternal Emperor of Everything' },
    { points: 1500, title: 'Galactic Governor of Gab' },
    { points: 1600, title: 'Cosmic Chancellor of Chatter' },
    { points: 1700, title: 'Interstellar Sovereign of Speech' },
    { points: 1800, title: 'Universal Monarch of Mouths' },
    { points: 1900, title: 'Omnipotent Overlord of Everything' },
    { points: 2000, title: 'Multiversal Master of Mouthing' },
];

module.exports = nobilityRanks;
