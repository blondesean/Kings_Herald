/* Flavor text: the ladder of nobility titles earned from weekly-recap points.
 *
 * Ordered ascending, climbing through real-world (then fantastical) precedence:
 * commons and local office, the learned professions, the military and peerage,
 * the sovereigns of the mortal realm, and finally the rulers of the cosmos.
 *
 * The step between rungs widens as the ladder climbs, so early points come
 * fast and the top is a long haul:
 *   -   0        : Peasant — the starting station, below the first real rung
 *   -   5 to  50: +5  per rung (10 rungs)
 *   -  50 to 100: +10 per rung (5 rungs)
 *   - 100 to 400: +15 per rung (20 rungs)
 *   - 400 to 500: +20 per rung (5 rungs) — the universe-ruling capstone titles
 *
 * Where several titles shared a real-world tier (King of Quips, Sultan of
 * Speech, Czar of Chatter...), the cooler phrase won and the rest were
 * retired. To add a rank, insert a rung at its rightful station — the command
 * derives everything from this array, so no other change is needed. Points
 * don't need to stay evenly spaced; pick whatever fits the surrounding tier.
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
    // The sovereigns of the mortal realm
    { points: 115, title: 'King of Kibitzing' },
    { points: 130, title: 'Tyrant of Talk' },
    { points: 145, title: 'Sultan of Speech' },
    { points: 160, title: 'Czar of Chatter' },
    { points: 175, title: 'Kaiser of Kvetching' },
    { points: 190, title: 'Khan of Klatsch' },
    { points: 205, title: 'Pharaoh of Prattle' },
    { points: 220, title: 'Doge of Dialogue' },
    { points: 235, title: 'Shogun of Soliloquy' },
    { points: 250, title: 'Maharaja of Mutterings' },
    { points: 265, title: 'Emperor of Eloquence' },
    { points: 280, title: 'Pope of Palaver' },
    { points: 295, title: 'High King of Hot Takes' },
    { points: 310, title: 'Grand Sultan of Gossip' },
    { points: 325, title: 'Supreme Sovereign of Speech' },
    { points: 340, title: 'World Emperor of Wit' },
    { points: 355, title: 'Celestial Czar of Chat' },
    { points: 370, title: 'Divine Despot of Discourse' },
    { points: 385, title: 'Almighty Autocrat of Answers' },
    { points: 400, title: 'Eternal Emperor of Everything' },
    // The rulers of the cosmos
    { points: 420, title: 'Galactic Governor of Gab' },
    { points: 440, title: 'Cosmic Chancellor of Chatter' },
    { points: 460, title: 'Interstellar Sovereign of Speech' },
    { points: 480, title: 'Universal Monarch of Mouths' },
    { points: 500, title: 'Omnipotent Overlord of Everything' },
];

module.exports = nobilityRanks;
