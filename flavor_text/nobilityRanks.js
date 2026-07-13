/* Flavor text: the ladder of nobility titles earned from weekly-recap points.
 *
 * Ordered ascending; each rung is 5 points above the last, starting at 5.
 * The ladder climbs through real-world precedence: commons and local office,
 * then the learned professions, the military, the court, the peerage, and
 * finally the sovereigns of the realm.
 *
 * Where several titles shared a real-world tier (King of Quips, Sultan of
 * Speech, Czar of Chatter...), the cooler phrase won and the rest were
 * retired. To add a rank, insert a rung at its rightful station and shift
 * the points of everything above it by 5 — the command derives everything
 * from this array, so no other change is needed.
 */
const nobilityRanks = () => [
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
    // The military
    { points: 50, title: 'Captain of Conversation' },
    { points: 55, title: 'Commander of Chatter' },
    { points: 60, title: 'Marshal of Mouth Music' },
    { points: 65, title: 'Admiral of Arguments' },
    // The court
    { points: 70, title: 'Chancellor of Chat' },
    // The peerage
    { points: 75, title: 'Lord of Loquacity' },
    { points: 80, title: 'Baron of Banter' },
    { points: 85, title: 'Bishop of Blabber' },
    { points: 90, title: 'Earl of Excessive Explanation' },
    { points: 95, title: 'Duke of Discourse' },
    { points: 100, title: 'Prince of Persuasion' },
    // The sovereigns
    { points: 105, title: 'Tyrant of Talk' },
    { points: 110, title: 'Sultan of Speech' },
    { points: 115, title: 'Emperor of Eloquence' },
    { points: 120, title: 'Pope of Palaver' },
];

module.exports = nobilityRanks;
