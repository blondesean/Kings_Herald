/* Herald lines for /trial (src/trial.js): the three rounds and the outcome.
 * No parentheses: this is all herald dialogue.
 */

// Before the seventh lore drop opens the trials.
const trialClosedLines = () => [
    'Thou askest after old roads, but none are open. Not yet. Listen for the morning proclamations.',
    'The herald tilts his head. "Trials? There are tales, good noble, only tales. For now."',
    'No road answers thee today. The Long Memory is still sleeping.',
];

// Already holds a relic: one to an Echo.
const trialHeldLines = (relic) => [
    `Thou already bearest **${relic}**. One relic to an Echo; the rest wait for other hands.`,
    `**${relic}** stirs at thy side, jealous. One relic is all any Echo may carry.`,
];

const trialDoneTodayLines = () => [
    'Thou hast walked the old roads once today. They do not open twice between dawns. Return on the morrow.',
    'One trial a day, good noble. The roads need their rest, even if thou dost not.',
];

const trialInjuredLines = (weekday) => [
    `Thy wounds are still fresh. The old roads will wait for thee until ${weekday}.`,
    `No guardian would face thee as thou art. Heal, and return after ${weekday}.`,
];

const trialAllClaimedLines = () => [
    'Every relic has woken and found its Echo. The old roads are quiet now.',
];

// Round 1: the rumors.
const trialRumorIntroLines = () => [
    'Five rumors drift through the tavern tonight, each about a thing that should not exist. Follow one, and be sure of it: thou mayest walk only one road today.',
    'The herald leans close and lowers his voice. "I hear things. Five things, tonight. Choose the one that calls to thee, and choose once."',
    'Old men mutter, minstrels hum half-songs, and five rumors rise above the din. Which wilt thou follow? Only one road opens today.',
];

const trialRumorTimeoutLines = () => [
    'The rumors fade into the noise of the tavern. No road was taken, so today is not spent. Return when thou art ready.',
];

// Round 2: the road.
const trialRoadIntroLines = () => [
    'Thou followest the rumor down an old road, and the legend rises around thee. What wouldst thou do?',
    'The road bends into a story older than any kingdom, and thou art standing in it. Choose as the legend chose.',
];

const trialRoadRightLines = () => [
    'As the legend did, so didst thou. The relic\'s old memory knows thee now, and thou fightest the stronger for it.',
    'The right way, the old way. Something ancient takes thy measure and approves.',
    'The legend walked this exact step. The road remembers, and lends thee strength.',
];

const trialRoadWrongLines = () => [
    'The legend went another way. The road does not punish thee, but it lends thee nothing either.',
    'A reasonable choice, and not the legend\'s. Thou goest on with only thine own strength.',
    'The road shrugs. Not the old way, but a way. On to the guardian, unaided.',
];

const trialRoadTimeoutLines = () => [
    'Thou lingerest too long at the crossroads, and the road folds shut behind thee. Today\'s trial is spent; return on the morrow.',
];

// Round 3: the guardian.
const trialGuardianLines = (guardian) => [
    `At the road's end waits **${guardian.name}**, ${guardian.epithet}. The Guardian of the relic does not move aside.`,
    `Then **${guardian.name}**, ${guardian.epithet}, rises to bar the way. Every Guardian of a relic is a legend in their own right.`,
];

// The outcome. `relic` is the relic's name.
const trialWinLines = (guardianName, relic) => [
    `${guardianName} falls, and in the silence after, **${relic}** wakes and rises to thy hand.`,
    `The Guardian yields at last. ${guardianName} steps aside, and **${relic}** is thine.`,
    `${guardianName} is beaten, and the relic it guarded for an age chooses thee: **${relic}**.`,
];

const trialLossLines = (guardianName) => [
    `${guardianName} is unmoved, and thou art sent back down the old road, beaten.`,
    `The Guardian was too much for thee today. ${guardianName} watches thee limp away.`,
    `${guardianName} does not even look winded. The relic sleeps on, waiting for a worthier day.`,
];

// The relic was claimed by someone else in the moment between.
const trialSnatchedLines = (relic) => [
    `As thou reachest for **${relic}**, it stirs and is gone. Another Echo claimed it this very hour. The Guardian is beaten, at least, and today is spent.`,
];

// The public announcement of a claim. `lore` follows the holder's name.
const trialClaimedLine = (name, lore) => `Hear ye! **${name}** ${lore}.`;

module.exports = {
    trialClosedLines,
    trialHeldLines,
    trialDoneTodayLines,
    trialInjuredLines,
    trialAllClaimedLines,
    trialRumorIntroLines,
    trialRumorTimeoutLines,
    trialRoadIntroLines,
    trialRoadRightLines,
    trialRoadWrongLines,
    trialRoadTimeoutLines,
    trialGuardianLines,
    trialWinLines,
    trialLossLines,
    trialSnatchedLines,
    trialClaimedLine,
};
