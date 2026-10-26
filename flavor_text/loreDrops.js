/* The seven lore drops that herald the opening of the trials: one each
 * morning for a week, starting the morning after the court first slays a Max
 * boss. Each is a single embed; together they read as one page, so keep each
 * short.
 *
 * One story told forward, bookended by days 1 and 7. Days 2 to 6 are five
 * ages, each smaller than the last: gods, prophets, heroes, kings, then the
 * Hearth of common folk. The great arms come down with them toward ordinary
 * hands, and a herald stands at every age's last test and walks on to the
 * next. The drops say "heralds", plural; the Herald's reveal
 * (docs/the-last-proclamation.md) says there was only ever one. The relics
 * are hinted at, not listed; the full legends live with each unique in
 * flavor_text/uniqueTrials.js.
 *
 * No parentheses: this is herald dialogue.
 */

const loreDrops = [
    {
        title: 'What the World Forgot',
        text: [
            'Hear me, court of the King. Yesterday you felled a foe out of the oldest memory, and I have waited a very long time to tell you what that means.',
            '',
            'The world does not remember. It recalls. Every people rose like a wave, crested and broke, and each wave came in smaller than the last. The first are remembered as gods, the next as prophets, then heroes, then kings, then folk like you. **The great arms came down with them**, from the hands of heaven toward ordinary ones.',
            '',
            'And beside every wave, at its crest, there stood **a herald.**',
            '',
            'For seven mornings I will follow the arms down. Look for the staff and the horn.',
        ].join('\n'),
    },
    {
        title: 'The Age of Gods',
        text: [
            'In the first age, in the East, the powers that crested were so great we remember them as gods, and **they held the arms themselves.** The greatest was a wheel, which the preserver of the world earned with his own eye, and which always came back to his hand.',
            '',
            'That age ended in eighteen days of war at Kurukshetra, the last war in which a god drove a chariot. Another charioteer stood beside the blind old king and, given the sight of the whole field, told him every blow as his sons died in it, and did not soften a word.',
            '',
            'When it was over, the gods withdrew, and the wheel with them. The arms they left behind would have to be asked for. **The charioteer took up a staff and walked west.**',
        ].join('\n'),
    },
    {
        title: 'The Age of Prophets',
        text: [
            'In the second age, in the West, the people who crested were smaller than gods, but they still spoke with heaven, and **heaven lent them arms through its prophets**: a staff that parted a sea, a mantle that parted a river.',
            '',
            'When iron came against them, a shepherd boy felled the giant of Gath with a stone and took the giant\'s own sword. **It was the first great arm to change sides**, and it would not be the last.',
            '',
            'In a darker year their ark was lost in battle, and a runner came to Shiloh with earth on his head to tell the old priest the age had turned. No one wrote his name. When that wave broke in exile and its arms scattered, **the runner was already on the road to the sea**, where heroes were rising.',
        ].join('\n'),
    },
    {
        title: 'The Age of Heroes',
        text: [
            'In the third age, the Greeks crested. They were mortals, and **they took their arms from monsters by labor**: a lion\'s hide, a golden fleece, a Gorgon\'s head. Their crest was Troy.',
            '',
            'There, Ajax and Hector fought all day to a draw, and at dusk **two heralds** walked out between them with their staffs raised. No one in that world struck a herald. At their word the champions traded gifts, a belt for a sword, and the sword set out on a road longer than either of them.',
            '',
            'Troy burned. The heroes scattered, and most never reached home. **The heralds did. They always do.** Northward now, where kings were forging arms with curses in them.',
        ].join('\n'),
    },
    {
        title: 'The Age of Kings',
        text: [
            'In the fourth age, in the north, **the arms were made by smiths**, not given by gods, and every one had its price written in: a hammer with a handle too short, a sword that must kill each time it is drawn.',
            '',
            'At Tara a stranger knocked. **The doorkeeper** asked his one question, what skill do you bring, carried the answer in, and opened the gate to Lugh of the Long Arm, who won that age its war.',
            '',
            'And the north ended as it always knew it would. **A watchman blew a horn** to tell nine worlds their last test had come, and the arms sank into barrows and riverbeds, to wait for smaller hands.',
        ].join('\n'),
    },
    {
        title: 'The Age of the Hearth',
        text: [
            'In the fifth age, the waves were small enough to fit in a village. No gods, no empires, only common folk, and they had one invention of their own: **cunning.** They did not ask for arms or forge them. They tricked them away: a thief\'s candle that froze a house asleep, an ogre\'s seven-league boots that shrank to fit the smallest of seven brothers.',
            '',
            'That boy ran the king\'s word across the kingdom, faster than any horse: **the first herald of the Hearth.** And every tale of that age begins the same way, with a herald riding into the square to ask who will answer.',
            '',
            'Tomorrow, I will ask you.',
        ].join('\n'),
    },
    {
        title: 'The Waking',
        text: [
            'Seven mornings, court of the King. Gods, prophets, heroes, kings, and now folk like you. The arms have come all the way down. Here is what the heralds believe.',
            '',
            'Souls outlast their waves. They come back as **Echoes**, and the old arms know them. A relic does not choose a stranger. It recognizes someone.',
            '',
            'And **a wave does not know its own height.** So at every crest a last test comes, and in every age a herald carried it in.',
            '',
            'Thirty relics are awake, each waiting for its Echo, each guarded by something that remembers what it cost the last time. **The trials are open.** Hear five rumors, follow one down an old road, choose as the legend teaches, and face the guardian. One relic to an Echo. Begin with `/trial`.',
            '',
            'Every age before this one met its last test in a rival. This court has none, and so its age has not yet begun. Claim the arms, court of the King: they are the start of an era. When you are ready, the last challenge will come, and the new age with it. I will be the one to announce it. I always am.',
        ].join('\n'),
    },
];

module.exports = loreDrops;
