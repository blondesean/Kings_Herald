/* Flavor text for the daily encounter (see commands/passive/encounter.js).
 * Each entry is a function returning its array of strings (some take
 * parameters to interpolate).
 */

// The opening post: the boss is hidden, so this only teases a threat.
const encounterTeaserLines = () => [
    'Hear ye! A shadow falls across the realm, and something terrible stirs beyond the walls. Who will ride out to meet it?',
    'The watchtower bells ring out! A great foe approaches, though none can yet name it. Brave nobles, form a party!',
    'Scouts return pale and shaking: a monstrous presence gathers its strength. The Herald calls for champions!',
    'The crows have gone silent and the hounds will not stop howling. Something wicked comes. Who will stand against it?',
    'A rider staggers through the gates with a tale of ruin in the borderlands. The court has need of heroes!',
    'An ill wind blows from the wilds, carrying the stench of something ancient and hungry. Steel thyselves, nobles!',
    'The seers\' candles gutter and die all at once. A dread power has woken. The realm calls for a party of the bold!',
    'Smoke on the horizon, and villagers fleeing toward the castle. Whatever drives them, it must be met. To arms!',
];

// The private prompt shown to a member who joins.
const encounterPromptLine = () =>
    'Thou hast joined the party! Thy destiny is thine own to choose: name how grand a challenge thou wouldst embark upon, from a humble skirmish to a legend-making trial, and how thou wilt meet it. The party\'s voices together decide the quest. Thy choices stay hidden until the battle, and thou mayest change them until then.';

// A member can't join because they're still recovering.
const encounterInjuredLines = (untilLabel) => [
    `Thou art still nursing thy wounds, good noble, and the healers forbid thee the field until after ${untilLabel}.`,
    `Rest, brave one. Thy injuries keep thee from battle until after ${untilLabel}.`,
    `The physicker bars the door: no fighting for thee until after ${untilLabel}. Mend first, then seek glory.`,
    `Thy bandages are still fresh. The party marches without thee until after ${untilLabel}.`,
];

// Nobody finished their choices in time.
const encounterNoPartyLines = () => [
    'No party mustered in time, and the threat slinks back into the dark. The realm breathes easy, for now.',
    'The call to arms went unanswered. Whatever stirred has moved on to trouble some other kingdom.',
    'No party rose to meet the challenge, and the threat slips away undefeated. Mark it well: it shall return another day.',
    'The realm\'s champions did not answer, and the foe withdraws unbowed into the shadows, biding its time to strike again.',
    'The banners were raised, but no one marched beneath them. The menace fades into the mist, unchallenged and unforgiving.',
    'Not a blade was drawn this day. The beast grows bolder for it, and the Herald fears its return.',
];

// The reveal at the start of the result post. `boss` is { name, epithet }.
const encounterRevealLines = (boss, difficulty) => [
    `The party rides out, and the foe reveals itself: **${boss.name}**, ${boss.epithet}! (${difficulty})`,
    `From the gloom emerges **${boss.name}**, ${boss.epithet}. A ${difficulty.toLowerCase()} trial indeed!`,
    `The ground shakes as **${boss.name}**, ${boss.epithet}, rises to meet the party. (${difficulty})`,
    `At the end of the long road waits **${boss.name}**, ${boss.epithet}. (${difficulty})`,
    `A terrible roar splits the air: it is **${boss.name}**, ${boss.epithet}! The party stands its ground. (${difficulty})`,
    `The mists part to reveal **${boss.name}**, ${boss.epithet}. There is no turning back now. (${difficulty})`,
];

// A member's line in a victory (stances stay secret on a win).
const encounterWinMemberLines = (name) => [
    `${name} fought with honor.`,
    `${name} stood firm through the fray.`,
    `${name} answered the call and did not falter.`,
    `${name} pressed the attack without flinching.`,
    `${name} held the line when it mattered most.`,
    `${name} fought as the songs say heroes do.`,
];

// The killing blow on a win. `killer` is a display name.
const encounterKillingBlowLines = (killer, boss) => [
    `It is **${killer}** who lands the killing blow, and ${boss.name} falls!`,
    `With a final, mighty strike, **${killer}** fells ${boss.name}! Songs will be sung of this.`,
    `${boss.name} staggers, and **${killer}** seizes the moment to end it!`,
    `**${killer}** finds the gap in ${boss.name}'s guard and drives the blow home!`,
    `The decisive strike belongs to **${killer}**, and ${boss.name} crashes to the earth!`,
    `As ${boss.name} rears for one last assault, **${killer}** strikes first and true. The hero of the day!`,
    `**${killer}** delivers the blow that ends it. Let the bards remember that name!`,
];

const encounterVictoryLines = () => [
    'Victory! The party stands triumphant over its fallen foe.',
    'The realm is saved, and the party returns in glory!',
    'The battle is won! Raise the banners and ready the feast.',
    'The dust settles, and the party alone remains standing. Victory!',
    'Against the odds and the dark, the party prevails!',
];

const encounterDefeatLines = (boss) => [
    `Alas! ${boss.name} proves too mighty, and the party is driven back in defeat.`,
    `The battle turns against the party, and ${boss.name} stands victorious.`,
    `Despite their courage, the party is overwhelmed by ${boss.name}.`,
    `${boss.name} shrugs off every blow, and the party is forced to flee.`,
    `The party breaks against ${boss.name} like waves upon a cliff. A bitter defeat.`,
    `Steel and courage were not enough. ${boss.name} sends the party reeling.`,
];

// How each member fought, revealed only after a loss. `name` is a display name.
const encounterStanceLines = {
    aggressive: (name) => [
        `${name} charged in headlong, blade first.`,
        `${name} fought with reckless fury.`,
        `${name} threw caution to the wind and went for the throat.`,
        `${name} pressed every attack with no thought for defense.`,
    ],
    balanced: (name) => [
        `${name} held a steady line.`,
        `${name} fought with measured skill.`,
        `${name} struck when the moment called for it and guarded when it did not.`,
        `${name} kept a cool head amid the chaos.`,
    ],
    defensive: (name) => [
        `${name} kept shield raised and footing sure.`,
        `${name} fought warily, guarding every step.`,
        `${name} hung back, waiting for an opening that never came.`,
        `${name} turned aside blow after blow, giving little ground and taking little risk.`,
    ],
};

// What became of each member after a loss.
const encounterInjuryLines = {
    defensive: (name) => [
        `${name}'s caution pays off: they walk away unhurt and may fight again tomorrow.`,
        `Shield held high, ${name} escapes without a scratch.`,
        `${name} retreats in good order, bruised in pride but nothing more.`,
        `${name} slips away from the rout unharmed, ready for another day.`,
    ],
    balanced: (name, days) => [
        `${name} limps away with minor wounds and must rest ${days} day${days === 1 ? '' : 's'}.`,
        `${name} takes a nasty cut, and must sit out ${days} day${days === 1 ? '' : 's'}.`,
        `${name} nurses a cracked rib and is ordered to rest ${days} day${days === 1 ? '' : 's'}.`,
        `${name} escapes with a sprained arm, out of action for ${days} day${days === 1 ? '' : 's'}.`,
    ],
    aggressive: (name, days) => [
        `${name}'s recklessness costs dearly: grave wounds keep them abed for ${days} days.`,
        `${name} is carried from the field, gravely hurt, and must rest ${days} days.`,
        `${name} charged too deep and paid for it. The healers give them ${days} days to mend.`,
        `${name} is dragged from the fray half-conscious, and will not stand again for ${days} days.`,
    ],
};

// The loot post. `item` is the label "[Rarity] Name".
const encounterLootLines = (item) => [
    `From the fallen foe, the party recovers **${item}**! Need, greed or pass.`,
    `Among the spoils lies **${item}**. Who claims it? Need, greed or pass.`,
    `Something glints in the wreckage: **${item}**! Need, greed or pass.`,
    `The victors search the lair and find **${item}**. Need, greed or pass.`,
    `A prize worthy of the fight: **${item}**! Need, greed or pass.`,
];

const encounterLootWonLines = (winner, item) => [
    `**${winner}** wins **${item}**! May it serve them well.`,
    `The dice favor **${winner}**, who claims **${item}**.`,
    `**${item}** goes to **${winner}**. Wear it with pride!`,
    `Fortune smiles on **${winner}**, new owner of **${item}**.`,
    `**${winner}** takes **${item}** from the hoard. A fine reward!`,
];

const encounterLootAllPassedLines = (item) => [
    `No one claims **${item}**, and it is left upon the field.`,
    `Every member passes on **${item}**. It gathers dust where it fell.`,
    `**${item}** finds no taker, and the party leaves it for the scavengers.`,
    `None in the party want **${item}**. Perhaps some lucky peasant will stumble upon it.`,
];

module.exports = {
    encounterTeaserLines,
    encounterPromptLine,
    encounterInjuredLines,
    encounterNoPartyLines,
    encounterRevealLines,
    encounterWinMemberLines,
    encounterKillingBlowLines,
    encounterVictoryLines,
    encounterDefeatLines,
    encounterStanceLines,
    encounterInjuryLines,
    encounterLootLines,
    encounterLootWonLines,
    encounterLootAllPassedLines,
};
