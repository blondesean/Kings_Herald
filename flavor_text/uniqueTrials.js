/* The trial for each unique (see UNIQUES in commands/passive/shopCatalog.js),
 * keyed by its id. A trial runs in three rounds:
 *
 *   1. The Rumor - five unclaimed uniques are offered by slot and rumor only,
 *      never by name, and the player picks one to pursue.
 *   2. The Road  - a scene from the relic's legend and three choices. The
 *      first choice is the way the legend teaches; shuffle before showing.
 *   3. The Guardian - a fight against the relic's mythic owner or keeper.
 *
 * `age` names the chapter of The Ages of Arms (docs/the-ages-of-arms.md) the
 * relic belongs to. `legend` is its full story, shown to the one who wins it,
 * and links it to the other relics of its age where the myths cross.
 *
 * No parentheses in any of this text: it is read as herald dialogue.
 */

const AGES = {
    wheel: 'The Wheel and the First Fire',
    covenant: 'The Covenant and the Iron',
    labors: 'The Age of Labors',
    storm: 'Iron and Storm',
    tides: 'The Eastern Tides',
    oaths: 'Oaths and Hoards',
    hearth: 'The Hearth',
};

const uniqueTrials = {
    // ---- The Wheel and the First Fire ----
    sudarshana_chakra: {
        age: 'wheel',
        rumor: 'A wheel of a hundred and eight edges spins so fast it seems still, and it was paid for with an eye.',
        road: {
            scene: 'Thou kneelest at the altar with a thousand lotus flowers, one for each of the thousand names. At the last name, thy hand finds the basket empty. One flower is gone.',
            choices: [
                'Offer thine own eye in its place',
                'Halt the rite and search for the flower',
                'Speak the last name with no offering',
            ],
        },
        guardian: { name: 'Rahu', epithet: 'the severed head that swallows the sun' },
        legend: 'The first great arm in the Long Memory, and the only one given rather than taken. The preserver of the world offered the destroyer a thousand lotuses, and when one was hidden from him, he moved to give his own eye instead. For that willingness he received the Sudarshana Chakra. Its first great work was at the Churning of the Ocean, where a thousand years of balance between two powers ended in a single throw: the wheel took the head of Rahu, who had stolen a sip of deathlessness, and his head has hunted the Sun and Moon ever since. Every later arm in this chronicle that ended a stalemate, the helm and bolt of the Titan war, the spear of the north, the staff at the sea, walks in the path this wheel cut first. It is also the wheel of ages itself, turning, and so the heralds say it is the one relic that knows what age it is. It wakes for an Echo willing to pay before they are asked.',
    },
    kavacha: {
        age: 'wheel',
        rumor: 'Golden armor that was never forged, because it grew, and it was lost only because its wearer could not say no.',
        road: {
            scene: 'Thy prayers to the Sun are done, and thou hast sworn, as always, to refuse no one at this hour. A beggar priest holds out his hand and asks for the armor on thy body. Thou knowest exactly who he is.',
            choices: [
                'Cut the armor free and give it, asking nothing',
                'Refuse him; thine oath was made to men, not gods',
                'Give him gold instead and send him away',
            ],
        },
        guardian: { name: 'Karna', epithet: 'son of the Sun, who gave away his own skin' },
        legend: 'Karna was born wearing the Kavacha, golden armor grown from his skin, a gift of his father the Sun. While he wore it, no weapon in creation could kill him, and while he lived, the side he fought for at Kurukshetra could not lose. So Indra, king of the gods, came disguised as a beggar at the hour Karna refused no one, and Karna, though warned in a dream, cut the armor from his own body and gave it. Shamed, Indra gave him a spear of one throw in return; Karna spent it saving his army, and died unarmored three days later. His side lost, and in that people\'s own telling the wheel of ages turned to the age of iron. The heralds set this armor beside the Chakra for one reason: the wheel decided a war by where it struck, and the Kavacha decided one by where it was not. It wakes for an Echo who would give it away again.',
    },

    // ---- The Covenant and the Iron ----
    coat_of_many_colors: {
        age: 'covenant',
        rumor: 'A prince\'s robe on a shepherd\'s son, once dipped in a goat\'s blood, that saw seven years ahead.',
        road: {
            scene: 'Pharaoh has dreamed of seven fat cattle devoured by seven lean ones, and every wise man in Egypt has failed him. He turns to thee.',
            choices: [
                'Seven years of plenty, then seven of famine: store the grain',
                'Seven years of war: raise an army now',
                'A warning of seven plagues: free the slaves',
            ],
        },
        guardian: { name: 'the Seven Lean Kine', epithet: 'the famine made flesh' },
        legend: 'Jacob gave his favored son Joseph a long-sleeved robe of many colors, a prince\'s garment on a shepherd, and it made Joseph visible. His brothers stripped it from him, sold him to traders bound for Egypt, and dipped it in a goat\'s blood to fool their father. In Egypt, Joseph read Pharaoh\'s dream of the fat and lean cattle, saw seven years ahead, and filled the granaries; when famine came, every nation came to Egypt for bread, and Egypt became the mightiest power of its wave. The Long Memory counts the Coat among the great arms though it never struck a blow, because an empire was built on what its wearer saw. That same Egypt later forgot him, enslaved his people, and drowned its chariots chasing the Staff of Moses into the sea: one relic raised an empire, the next one broke it. The Coat wakes for an Echo who sees what others are too proud to see.',
    },
    staff_of_moses: {
        age: 'covenant',
        rumor: 'A shepherd\'s plain staff that became a serpent, ate the serpents of sorcerers, and drowned the finest army of its age.',
        road: {
            scene: 'The sea is before thee and the chariots of Egypt behind. The people look to thee and to the staff in thy hand.',
            choices: [
                'Stretch the staff out over the sea',
                'Strike the waters with the staff',
                'Cast the staff into the waves',
            ],
        },
        guardian: { name: 'Jannes and Jambres', epithet: 'sorcerers of Pharaoh\'s court' },
        legend: 'A plain shepherd\'s staff, carried in the wilderness, that became a serpent at the word of the voice in the burning bush. Before Pharaoh, the staff of Moses\' house met the staffs of Pharaoh\'s sorcerers, whom later tradition names Jannes and Jambres, in what the heralds count as the first duel of arms between empires held in full in the Long Memory, and the serpent of the shepherd\'s house swallowed theirs. At the sea, Moses did not strike the waters; he stretched the staff out over them, and they stood up like walls, and the chariots of Egypt, the finest war machines of the age, were lost when they fell. The heralds pair it with Ruyi Jingu Bang, the pillar that tamed the Eastern flood: two arms that commanded the sea, and two peoples who crossed water to found something new. The Mantle of Elijah later parted the Jordan in its echo. It wakes for an Echo who leads others through.',
    },
    jawbone_of_samson: {
        age: 'covenant',
        rumor: 'Bone against iron: something snatched from the dust of Lehi that struck down a thousand.',
        road: {
            scene: 'Thine own countrymen have bound thee with new ropes and handed thee to the iron-armed host. The ropes fall from thine arms like burnt flax. There is no blade within reach.',
            choices: [
                'Seize the fresh jawbone of an ass from the ground',
                'Take a sword from the first man thou fellest',
                'Flee to the hills and fight another day',
            ],
        },
        guardian: { name: 'the Thousand of Lehi', epithet: 'the iron-armed host of the Philistines' },
        legend: 'The Philistines came from the sea with iron and kept the secret so closely there was not a smith left in Israel. It was the first great invention of the challengers against the eldest peoples, and it nearly ended the Hebrew wave. Samson, bound by his own countrymen and handed over as a peace offering, broke the ropes, took up a fresh jawbone of an ass, and killed a thousand men with it at Lehi. Then, dying of thirst, he cried out, and a spring broke from the hollow ground to save him. The heralds hold the Jawbone as the old world\'s answer to the new: bone against iron, and bone won. Its twin in the Long Memory is the sling-stone that felled Goliath, and later the sling-stone of Lugh that put out Balor\'s eye: whenever a new power has risen, the oldest weapons have been the ones to answer it. It wakes for an Echo who fights with what is at hand.',
    },
    sword_of_goliath: {
        age: 'covenant',
        rumor: 'A giant\'s blade, wrapped in a cloth behind a priest\'s vestment, and there is none like it.',
        road: {
            scene: 'Thou art fleeing a jealous king, hungry and unarmed, and thou comest to the priests of Nob. The priest says there is no common weapon here.',
            choices: [
                'Ask for the sword wrapped in cloth behind the ephod',
                'Take the priest\'s knife from the altar',
                'Go on unarmed and trust to thy sling',
            ],
        },
        guardian: { name: 'Goliath', epithet: 'champion of Gath, the iron giant' },
        legend: 'Goliath of Gath was the champion of the new metal: a giant in scale armor with a spear-head of six hundred shekels of iron, and every soldier of Israel feared him. The shepherd boy David, too small for the king\'s armor, walked out against him with a sling, the oldest weapon there is, felled him with one stone, and took his head with the giant\'s own sword. The sword was laid up at Nob, wrapped in a cloth behind the ephod, a trophy of the day iron fell to stone. Years later David came there fleeing for his life, starving and unarmed, and the priest told him it was the only weapon in the place. David said there is none like that; give it me. The heralds note that the Sword of Goliath is an iron arm that served the people iron was meant to conquer: the first relic in the Long Memory to change sides. It wakes for an Echo who began as the smallest in the field.',
    },
    mantle_of_elijah: {
        age: 'covenant',
        rumor: 'A rough cloak of hair that fell from a chariot of fire, and a river still remembers it.',
        road: {
            scene: 'Thy master turns to thee on the far bank of the Jordan. Ask what I shall do for thee, he says, before I am taken from thee.',
            choices: [
                'A double portion of thy spirit',
                'Thy blessing on my house and children',
                'That thou wouldst stay a little longer',
            ],
        },
        guardian: { name: 'the Chariot of Fire', epithet: 'the whirlwind that carried the prophet away' },
        legend: 'Elijah called fire down from heaven on Mount Carmel, and with his mantle rolled up he struck the Jordan, and it parted, an echo of the Staff of Moses a wave before. When his disciple Elisha asked for a double portion of his spirit, Elijah said it was a hard thing, but it would be granted if Elisha saw him taken. Then a chariot of fire came between them, and Elijah went up in a whirlwind, and Elisha saw. The mantle fell. Elisha struck the river with it, and the river parted for him too. The heralds count this the birth of an idea that runs through the whole Long Memory: that a relic can choose an heir. Mjolnir found Thor\'s sons in the grass after Ragnarok; Durendal refused to break for its dying master; but the Mantle was the first. It wakes for an Echo who keeps watching when others look away.',
    },

    // ---- The Age of Labors ----
    helm_of_darkness: {
        age: 'labors',
        rumor: 'A helm forged in the pit by chained smiths, that ended a ten-year war, and no one has seen its wearer since.',
        road: {
            scene: 'Thou standest in the depths of Tartarus before the Cyclopes, master smiths in Titan chains. The war above has dragged on ten years.',
            choices: [
                'Break their chains and ask them for nothing',
                'Promise them freedom once they have forged for thee',
                'Leave them chained, lest they forge for the Titans',
            ],
        },
        guardian: { name: 'Hades', epithet: 'lord of the unseen' },
        legend: 'For ten years the young gods fought the Titans to a standstill. Then Zeus went down into Tartarus and freed the Cyclopes the Titans had chained there, and in gratitude they forged three arms: a thunderbolt for Zeus, a trident for Poseidon, and for Hades a helm that made its wearer unseen. Ten years the Titans had held; once the new arms were forged, they fell. The heralds set that day beside the Churning of the Ocean and the Red Sea, the third great stalemate ended by arms. The Helm of Darkness then passed, as the Greek wave\'s arms did, from god to mortal hand: the nymphs lent it to Perseus, who wore it with the Harpe to take Medusa\'s head unseen. It is the bridge between the war of gods and the age of heroes. It wakes for an Echo who does the work and does not need to be seen doing it.',
    },
    harpe_of_perseus: {
        age: 'labors',
        rumor: 'A sickle of adamant that some say overthrew the first king of heaven, and certainly took the Gorgon\'s head.',
        road: {
            scene: 'Thou standest in the Gorgon\'s lair, among statues that were once heroes. Her breathing is close. One look into her eyes will make thee stone.',
            choices: [
                'Look only at her reflection in a polished shield',
                'Close thine eyes and strike by sound alone',
                'Wait for her to sleep and strike at her throat',
            ],
        },
        guardian: { name: 'Medusa', epithet: 'the Gorgon whose gaze is stone' },
        legend: 'Before there were Olympians, the earth forged a great sickle of adamant and gave it to her son Cronus, and with it he overthrew his father, the first sky. Some keepers of the Long Memory hold that the Harpe Hermes gave Perseus was that very sickle; all agree it was the same unbreakable metal. With it, and with the Helm of Darkness lent by the nymphs and Athena\'s mirror-bright shield, Perseus crept unseen upon Medusa, watched her only in reflection, and took her head with one stroke. The heralds call that moment the passing of the gods\' arms into human hands: two relics of the Titan war, carried by one mortal against one monster. If the old keepers are right, the Harpe is the first overthrow-weapon in the world, the arm that began the very idea that an order can be cut down. It wakes for an Echo who will not look away, and will not look directly either.',
    },
    nemean_lions_pelt: {
        age: 'labors',
        rumor: 'A hide no blade could cut, taken by bare hands and flayed with its own claws.',
        road: {
            scene: 'The lion is cornered in its cave. Thine arrows lie broken at its feet and thy sword is bent double.',
            choices: [
                'Close with it and strangle it barehanded',
                'Seal the cave and starve it out',
                'Fetch fire and drive it into the open',
            ],
        },
        guardian: { name: 'the Nemean Lion', epithet: 'child of Typhon, whose hide turns every blade' },
        legend: 'The first labor of Heracles. The Nemean Lion was a child of Typhon, the last and greatest monster the old powers sent against the young gods, and its hide could not be cut. Heracles\' arrows bounced from it and his sword bent. So he cornered it in its own cave and strangled it, and when no blade would skin it, he used its own claws. He wore the pelt from then on, the lion\'s head as his helm, as he went on to take the Girdle of Hippolyta and to sail, for a while, with Jason on the Argo after the Golden Fleece. The heralds count the Pelt the clearest mark of the Greek wave\'s great invention: the eldest peoples were given their arms by heaven; the heroes took theirs from monsters, by labor. It wakes for an Echo who will do the hard thing with bare hands when every tool has failed.',
    },
    girdle_of_hippolyta: {
        age: 'labors',
        rumor: 'A war belt that its queen would have given freely, if a goddess had not whispered.',
        road: {
            scene: 'The Amazon queen has come down to thy ship, smiling, with the war belt of Ares in her hands. On the shore behind her, her warriors are murmuring.',
            choices: [
                'Take it with thanks and sail at once',
                'Seize the queen as surety and sail with her',
                'Go ashore to answer the warriors\' fears',
            ],
        },
        guardian: { name: 'Hippolyta', epithet: 'queen of the Amazons' },
        legend: 'The war belt of Hippolyta was a gift to her from Ares, god of war, and the sign of her rule over the Amazons. For his ninth labor Heracles was sent to bring it back, and the Long Memory is careful to record that she would have given it freely: she came down to his ship and offered it. But Hera, who hated Heracles, went among the Amazons disguised as one of them and whispered that the stranger had come to carry off their queen. The Amazons attacked, and in the confusion Hippolyta died, and the belt was taken in blood that never needed to be shed. Heracles wore the Nemean Lion\'s Pelt that day. The heralds teach this one to every apprentice: a relic offered freely is worth more than one won, and suspicion has broken more alliances than any sword. It wakes for an Echo who knows when to stop talking and leave.',
    },
    golden_fleece: {
        age: 'labors',
        rumor: 'Something golden hangs in a grove at the edge of the world, watched by eyes that never close.',
        road: {
            scene: 'The fire-bulls are yoked and the dragon\'s-teeth warriors lie dead in their furrows. Now only the dragon that never sleeps lies coiled around the oak where the Fleece hangs.',
            choices: [
                'Let the sorceress charm the dragon to sleep',
                'Fight the dragon in the dark of the grove',
                'Cut the Fleece down from the far side and run',
            ],
        },
        guardian: { name: 'the Colchian Dragon', epithet: 'the serpent that never sleeps' },
        legend: 'The fleece of a golden ram, hung in a grove of Ares at Colchis, at the edge of the known world, and guarded by a dragon that never slept. Whoever held it held the right to the throne of Iolcus, and so Jason sailed for it in the Argo with the greatest heroes of the age aboard, Heracles in his lion pelt among them for a time. Jason yoked fire-breathing bulls and survived the warriors that grew from sown dragon\'s teeth, but he did not take the Fleece by strength: the king\'s daughter Medea, a sorceress, sang the sleepless dragon to sleep. The Fleece made Jason a king and Medea a traitor to her own father, and both debts were paid later in terrible ways. The heralds file it as the first great arm of the Greek wave won by an alliance rather than a hero, and the first to show how an alliance can turn. It wakes for an Echo who does not try to do it alone.',
    },
    armor_of_achilles: {
        age: 'labors',
        rumor: 'Armor with the whole world wrought on its shield, and the friendship it broke is still remembered.',
        road: {
            scene: 'Thou standest at the forge of the smith of the gods, who asks what he should work upon the shield of the greatest warrior alive.',
            choices: [
                'The whole world: earth, sea, stars, peace and war',
                'The warrior\'s own victories, one by one',
                'The face of the enemy he means to kill',
            ],
        },
        guardian: { name: 'Ajax the Great', epithet: 'the shield-wall of the Greeks, who would not yield the armor' },
        legend: 'When Achilles refused to fight at Troy, Patroclus wore his armor into battle, and Hector killed him and stripped it. Thetis, the sea-nymph mother of Achilles, went to Hephaestus, and the smith of the gods made new armor, and on the shield he wrought the whole world: earth, sky and sea, sun, moon and stars, a city at peace and a city at war, and the river Ocean around it all. In it Achilles killed Hector. When Achilles fell, the armor was to go to the greatest hero left alive. Ajax claimed it by deeds and Odysseus by words, and words won. Ajax went mad with shame and fell on his own sword, a gift from Hector after their drawn duel years before. The heralds note that Hector\'s own sword did not stay in the dust: one keeper of songs swears it became Durendal. Troy burned soon after. It wakes for an Echo who carries the whole world into battle and does not forget it is there.',
    },

    // ---- Iron and Storm ----
    airgetlam: {
        age: 'storm',
        rumor: 'A hand of silver that moved like flesh, and took a throne back from a tyrant without a blow.',
        road: {
            scene: 'Thou hast won the battle and lost thy hand. The law says a blemished king may not rule, and a tyrant now sits on thy throne, starving thy people.',
            choices: [
                'Go to the physician Dian Cecht for a new hand',
                'Raise an army and take the throne by force',
                'Accept the law and serve the tyrant',
            ],
        },
        guardian: { name: 'Bres the Beautiful', epithet: 'the tyrant king, half Fomorian' },
        legend: 'Nuada, king of the Tuatha De Danann, lost his hand in the First Battle of Mag Tuired, and though his people won, their law said a blemished king could not rule. The throne went to Bres the Beautiful, half Fomorian, who taxed the land until no chimney smoked and was satirized until boils rose on his face. The physician Dian Cecht and the wright Credne made Nuada a hand of silver that moved like flesh, and with Airgetlam he was whole in the eyes of the law and took his throne back without a blow. Then Dian Cecht\'s son Miach grew Nuada a hand of real flesh, and Dian Cecht killed his own son in jealousy: even a healing-arm has a price, as the north always said. Bres raised the Fomorians in war, and at the Second Battle of Mag Tuired, Nuada fell to Balor\'s eye, and Lugh, bearing Fragarach, avenged him. It wakes for an Echo who wins without needing to strike.',
    },
    fragarach: {
        age: 'storm',
        rumor: 'A sword from across the sea that no armor stops, and no one at its point can lie.',
        road: {
            scene: 'The doorkeeper of Tara bars thy way. We have a smith, a harper, a warrior, a poet and a healer already, he says. What more canst thou bring?',
            choices: [
                'Ask if the king has one man with all those skills at once',
                'Challenge their champion to single combat',
                'Offer the sword itself as thy gift to the king',
            ],
        },
        guardian: { name: 'Balor of the Evil Eye', epithet: 'king of the Fomorians, whose gaze kills armies' },
        legend: 'Lugh of the Long Arm came to the gates of Tara and was told that every skill he named was already there, until he asked whether the king had one man who had all of them at once. He carried Fragarach, the Answerer, from Manannan mac Lir, lord of the waves, out of the Land of Promise across the sea: no armor stopped it, no wind blew against its bearer, and no one at its point could lie or move. In the Second Battle of Mag Tuired, the Fomorian king Balor opened his evil eye and killed Nuada of the Silver Hand with it, and Lugh put a sling-stone through that eye. The heralds note that it was again the oldest weapon in the world that felled the champion of a power, as at Lehi and in the valley of Elah; Fragarach is honored because its bearer knew when not to draw it. It wakes for an Echo who is many things, and tells the truth.',
    },
    gae_bolg: {
        age: 'storm',
        rumor: 'A barbed spear from a sea-beast\'s bone, cast from the water of a ford, that has never failed and never forgiven.',
        road: {
            scene: 'Thou hast trained a year and a day on the island of shadows, and now thou standest in the ford, hip-deep, and the spear lies on the stones before thee.',
            choices: [
                'Cast it with thy foot, from the water',
                'Throw it overhand from the bank',
                'Drive it home with both hands at close quarters',
            ],
        },
        guardian: { name: 'Scathach', epithet: 'mistress of the island of shadows' },
        legend: 'Scathach, the warrior-woman of the island of shadows, taught her students everything, but the Gae Bolg she taught to only one: Cu Chulainn of Ulster. It was made from the bone of a sea-beast that died fighting another sea-beast, and it was cast with the foot from the water of a ford, entering as one barb and opening into thirty. It never failed. With it Cu Chulainn held the ford alone against all the army of Connacht in the Cattle Raid of Cooley, and with it he killed Ferdiad, his foster-brother, forced to fight him in that ford, and Connla, his own son, whom he did not know until too late. The heralds file it with Tyrfing as the north and west\'s great lesson: an arm that cannot miss, in a hand that cannot stop, wins the war and takes everything else. It wakes for an Echo who knows the cost and holds the ford anyway.',
    },
    gungnir: {
        age: 'storm',
        rumor: 'A spear that never misses, forged on a trickster\'s errand, that began the first war in the world and failed at the last.',
        road: {
            scene: 'Two hosts face each other across the field before the first war in the world. The spear is in thy hand. The old custom is waiting.',
            choices: [
                'Cast it over the enemy host, giving them to Odin',
                'Hurl it at the enemy king',
                'Plant it in the earth as a sign of truce',
            ],
        },
        guardian: { name: 'the Grey Wanderer', epithet: 'one-eyed, in a broad hat, whom everyone knows and no one names' },
        legend: 'When Loki cut off Sif\'s golden hair, he saved his own life by having the dwarves called the sons of Ivaldi forge her new hair of real gold, and while their forge was hot they made a folding ship and Gungnir, a spear that never misses its mark. Odin cast it over the Vanir host to begin what the songs call the first war in the world, and men cast spears over armies in his name for a thousand years after. Loki then bet his head that no dwarves could do better, which is how Mjolnir was made: two forges, one wager. Disguised as a grey wanderer, Odin held out Gungnir in Sigmund\'s last battle and shattered the sword Gram upon it. But at Ragnarok it did not save him, and Fenrir swallowed him, and only the Shoe of Vidar avenged it. No arm is greater than its wave. It wakes for an Echo who chooses where the battle begins.',
    },
    mjolnir: {
        age: 'storm',
        rumor: 'A hammer with a handle too short, buried eight leagues down, and laid at last in a bride\'s lap.',
        road: {
            scene: 'The giant king Thrym holds the hammer eight leagues under the earth, and will give it back only for the goddess Freyja\'s hand in marriage. She has refused, in a rage that shook her halls.',
            choices: [
                'Go to the wedding thyself, veiled as the bride',
                'Storm Thrym\'s hall without the hammer',
                'Offer Thrym a hoard of gold in Freyja\'s place',
            ],
        },
        guardian: { name: 'Thrym', epithet: 'king of the frost giants, who stole the hammer' },
        legend: 'Loki bet his head that no dwarves could out-forge the sons of Ivaldi, who had made Gungnir. Brokkr and Eitri took the bet, and as they forged the last treasure, Loki, as a fly, bit Brokkr on the eyelid, and for a heartbeat he let go of the bellows. So Mjolnir\'s handle came out short, and it was still judged the finest of the six treasures, because it was the one thing that could hold back the giants. When Thrym stole it and demanded Freyja as his bride, Loki flew in her falcon cloak Valshamr to find it, and Thor went to the wedding veiled as the bride; when the hammer was laid in her lap to bless the marriage, the bride took it back. Thor bore it with the belt Megingjord and the gloves Jarngreipr. After Ragnarok, his sons found it in the grass. Even at the end of all things, the hammer found an heir. It wakes for an Echo found worthy.',
    },
    megingjord: {
        age: 'storm',
        rumor: 'A belt that doubles the strength of whoever buckles it, worn in a giant\'s hall where nothing was as it seemed.',
        road: {
            scene: 'In the hall of the giant king Utgarda-Loki, thou art set three tasks: to drain a horn, to lift a grey cat, to wrestle an old woman. Each seems impossible, and thou art failing.',
            choices: [
                'Strive with all thy strength; nothing here is what it seems',
                'Refuse the tasks as a trick and draw thy weapon',
                'Concede with good grace and ask for easier ones',
            ],
        },
        guardian: { name: 'Utgarda-Loki', epithet: 'the giant king of illusions' },
        legend: 'Thor buckled on Megingjord and his strength was doubled, and the songs say he never went to war without it, the hammer and the iron gloves. When he walked unarmed into the hall of Geirrod, it was the giantess Grid who lent him a belt of strength and the gloves, and so he lived. The heralds attach this belt to Utgarda-Loki\'s hall, where Thor failed three tasks: he could not drain the horn, which was the sea itself, and lowered the oceans; he could not lift the cat, which was the world-serpent, and raised one paw from the ground; he could not throw the old woman, who was old age, and only fell to one knee. The giant king confessed afterward that his whole hall had been terrified. Megingjord is the relic of effort that does not look like victory and is. It wakes for an Echo who strives at the impossible without knowing they are winning.',
    },
    jarngreipr: {
        age: 'storm',
        rumor: 'Iron gloves that caught a bolt of red-hot iron across a giant\'s hall and threw it back through a pillar.',
        road: {
            scene: 'Geirrod the fire giant takes up a lump of red-hot iron in his tongs and hurls it at thee across his hall.',
            choices: [
                'Catch it in the iron gloves and hurl it back',
                'Dive behind a pillar and wait',
                'Strike it from the air with thy weapon',
            ],
        },
        guardian: { name: 'Geirrod', epithet: 'the fire giant of the iron bolt' },
        legend: 'Loki, caught by the giant Geirrod in the shape of a hawk, bought his life by promising to bring Thor to Geirrod\'s hall without his hammer or his belt. On the road, the giantess Grid warned Thor of the trap and lent him her staff, a belt of strength, and Jarngreipr, a pair of iron gloves. In the hall, Geirrod seized a lump of red-hot iron in tongs and hurled it; Thor caught it in the gloves and threw it back through the pillar Geirrod hid behind, and through Geirrod. From then on Thor never went to war without hammer, belt and gloves, and the heralds note that Mjolnir, short in the handle and fierce in the forging, burns to hold without them. Jarngreipr is the relic of the one who makes the enemy\'s own weapon theirs. It wakes for an Echo who catches what is thrown at them.',
    },
    valshamr: {
        age: 'storm',
        rumor: 'A cloak of falcon feathers, borrowed more than once and returned less often than it should have been.',
        road: {
            scene: 'Idunn and her apples of youth are held in the hall of the giant Thiazi, and without them the gods grow old. Thou hast the falcon cloak, and a long flight home.',
            choices: [
                'Change Idunn into a nut and carry her in thy talons',
                'Steal the apples and leave Idunn behind',
                'Carry Idunn as she is and outfly the giant',
            ],
        },
        guardian: { name: 'Thiazi', epithet: 'the storm giant in eagle\'s shape' },
        legend: 'Valshamr was the falcon cloak of Freyja, who came to Asgard as a hostage when the first war in the world, the one Gungnir began, ended in truce. It was borrowed more often than it was worn. Loki flew in it to Thrym\'s hall to find the stolen Mjolnir, and again to the hall of Thiazi, who had stolen Idunn and her apples of youth so that the gods grew old. Loki changed Idunn into a nut, carried her home in his claws, and when Thiazi pursued in eagle shape, the gods lit fires on the walls of Asgard and burned his wings. The heralds call it the relic of the errand: it never won a battle itself, but it brought back the hammer that won all of them, and the youth of the gods besides. It wakes for an Echo who goes where others will not, and comes back.',
    },
    tyrfing: {
        age: 'storm',
        rumor: 'A golden-hilted blade that always wins and must kill each time it is drawn, cursed by the dwarves who were forced to make it.',
        road: {
            scene: 'Thou standest among the ghost-fires of the barrows on Samso and callest on the dead berserker for his sword. He warns thee from the grave that it will destroy thy line.',
            choices: [
                'Demand it still, knowing the curse',
                'Turn back and leave it with the dead',
                'Bargain for it to be uncursed first',
            ],
        },
        guardian: { name: 'Angantyr', epithet: 'the berserker in the barrow' },
        legend: 'King Svafrlami caught the dwarves Dvalinn and Durin outside their stone and would not free them until they forged a sword that never rusted, cut iron like cloth, and always won. As they handed Tyrfing over, they cursed it: it would kill a man each time it was drawn, do three great evils, and be his death. All three came true. It went into the barrow on Samso with the berserker Angantyr, and his daughter Hervor walked alone among the ghost-fires and called him up and would not leave without it, until the dead man threw it to her from the grave. Generations on, it decided the Battle of the Goths and the Huns, the greatest the north remembers, when a king killed his own half-brother with it. The heralds set it beside the Gae Bolg: the dwarves promised it would always win, and never said for whom. It wakes for an Echo who will carry a curse and still choose well.',
    },
    aegishjalmur: {
        age: 'storm',
        rumor: 'A dragon\'s helm that struck terror into all who saw it, taken from beneath by one who would not face it.',
        road: {
            scene: 'Fafnir wears the Helm of Awe, and none can stand before him. Every day he crawls the same path down to the water to drink.',
            choices: [
                'Dig a pit in his path and strike from beneath',
                'Face him in the open and endure the terror',
                'Poison the water he drinks',
            ],
        },
        guardian: { name: 'Fafnir', epithet: 'the dragon of the cursed hoard' },
        legend: 'Fafnir was a man who killed his own father for a hoard of cursed dwarf-gold, Andvari\'s gold, and became a dragon to guard it, and he wore Aegishjalmur, the Helm of Awe, so that no one could stand before him. The hero Sigurd carried Gram, the sword of his father Sigmund, which had shattered on Odin\'s spear Gungnir and been reforged. He did not face the terror. He dug a pit in the dragon\'s path to the water, hid in it, and struck upward, and on the advice of a one-eyed stranger he dug more trenches to drain the blood. He took the helm and the hoard, and with them the curse. The heralds note that this one relic ties the north to the west: the gold passed from Fafnir to Sigurd, to the Burgundian kings, to the bottom of the Rhine, and the Tarnhelm lay in the same hoard in the southern telling. It wakes for an Echo who is brave enough to be clever.',
    },
    shoe_of_vidar: {
        age: 'storm',
        rumor: 'A boot stitched from every scrap of leather ever thrown away, and a wolf\'s jaws have known its weight.',
        road: {
            scene: 'Ragnarok. The Allfather is gone, swallowed whole. The wolf turns toward thee, and his jaws gape from earth to sky.',
            choices: [
                'Plant thy foot on his lower jaw and tear the upper',
                'Drive thy sword down his throat',
                'Bind him again with the remains of his chain',
            ],
        },
        guardian: { name: 'Fenrir', epithet: 'the wolf who swallowed the Allfather' },
        legend: 'At Ragnarok, Odin rode out with Gungnir, the spear that never misses, and it did not save him: the wolf Fenrir swallowed him whole. No arm is greater than the wave it belongs to. But Odin\'s son Vidar, the silent god, wore on one foot a shoe of great thickness, stitched from every scrap of leather that every shoemaker since the beginning of the world had cut away and thrown out. He set that foot on the wolf\'s lower jaw, took the upper in his hands, and tore Fenrir apart. The heralds hold the Shoe of Vidar dear for a reason they rarely say aloud: of all the great arms of the north, it alone was made by no god and no dwarf, from nothing anyone wanted, and it was the one that answered the end of the world. It is the Hearth\'s relic, born early. It wakes for an Echo made of what others threw away.',
    },

    // ---- The Eastern Tides ----
    ruyi_jingu_bang: {
        age: 'tides',
        rumor: 'An iron pillar that measured a flood and anchors the tides, and answers to only one hand.',
        road: {
            scene: 'In the Dragon King\'s palace beneath the Eastern Sea, the pillar weighs thirteen thousand five hundred jin. It hums when thou touchest it, but it will not move.',
            choices: [
                'Command it to grow smaller',
                'Strain until it lifts or thou breakest',
                'Ask the Dragon King for a lighter weapon',
            ],
        },
        guardian: { name: 'Ao Guang', epithet: 'Dragon King of the Eastern Sea' },
        legend: 'When the great flood would not recede, Yu the Great worked thirteen years to tame it, passing his own door three times without going in, and sounded the waters with an iron pillar. When they were tamed, the pillar was left on the floor of the Eastern Sea to anchor the tides, and Yu founded the first dynasty of his land: an arm used for no war at all had founded an empire. Ages later the Monkey King, Sun Wukong, found it in the palace of Ao Guang, Dragon King of the Eastern Sea, and it answered him; he told it to shrink, and kept it as a needle behind his ear. With Ruyi Jingu Bang he fought all heaven to a standstill, until a palm stopped what no arm could. The heralds pair it with the Staff of Moses, and note that every wave remembers a flood: perhaps the same one. It wakes for an Echo who is told no, and asks it to be smaller.',
    },
    kusanagi_no_tsurugi: {
        age: 'tides',
        rumor: 'A sword found in a serpent\'s tail, given away as an apology, and taken by the sea.',
        road: {
            scene: 'The eight-headed serpent stretches over eight valleys and eight hills, and it is coming tonight for the last daughter. Thou hast a day to prepare.',
            choices: [
                'Brew eight vats of strong wine behind eight gates',
                'Meet it at the pass with the village\'s spears',
                'Hide the daughter and lay a false trail',
            ],
        },
        guardian: { name: 'Yamata no Orochi', epithet: 'the eight-headed serpent' },
        legend: 'Susanoo, the storm god, was banished from heaven for his violence against his sister Amaterasu, the sun. On earth he found an old couple weeping: Yamata no Orochi had eaten seven of their eight daughters. He set out eight vats of strong wine behind eight gates, and when the serpent drank itself to sleep, he cut it apart, and his sword chipped on something in its tail. He cut it open and found a sword too great to keep, and he gave it to his sister as an apology: a storm and the sun reconciled by a blade. Later Yamato Takeru, trapped in a burning field, cut the grass away with it and turned the wind, and it was named the Grass-Cutter. At Dan-no-ura, where the old ruling house fell, it went into the sea with the child emperor. The sea gave Ruyi Jingu Bang and took Kusanagi; it keeps nothing forever. It wakes for an Echo who makes amends.',
    },

    // ---- Oaths and Hoards ----
    tarnhelm: {
        age: 'oaths',
        rumor: 'A helm from the Nibelung hoard that lets its wearer be any shape, or none, and that undid its proud maker.',
        road: {
            scene: 'Alberich of the Nibelungs is wearing the Tarnhelm and boasting of it. He has just become a great serpent to show thee what it can do.',
            choices: [
                'Doubt aloud that he can become something small',
                'Strike at the serpent while he holds the shape',
                'Praise him and ask to try it on',
            ],
        },
        guardian: { name: 'Alberich', epithet: 'lord of the Nibelungs, keeper of the hoard' },
        legend: 'In the southern telling of the hoard that cursed Fafnir and Sigurd, the dwarf of the gold was Alberich, lord of the Nibelungs, and among his treasures was the Tarnhelm, a helm that let its wearer take any shape or none at all. He was proud of it, and that undid him: tricksters asked him to show them its power, and he became a great serpent; and when they wondered aloud whether he could do the opposite, he became a toad, and they set a foot on him. The heroes of that telling, the Nibelung kings, took the hoard and the helm, and the cursed gold ran through them as it ran through every hand, until the last of the Burgundian kings sank it in the Rhine and died rather than tell where. The heralds hold it beside Aegishjalmur: one helm from the hoard made its wearer terrible, the other made its wearer anything. It wakes for an Echo who does not need to show off.',
    },
    durendal: {
        age: 'oaths',
        rumor: 'An unbreakable sword with relics in its hilt and another age in its steel, still standing in a cliff.',
        road: {
            scene: 'The rearguard is surrounded at the pass, the enemy beyond counting. Thy friend Oliver begs thee to sound the horn and call the emperor\'s army back.',
            choices: [
                'Sound the Olifant now',
                'Refuse; calling for help would shame thee',
                'Hold the pass and send a rider instead',
            ],
        },
        guardian: { name: 'the Shade of Roland', epithet: 'paladin of Roncevaux, who could not break his sword' },
        legend: 'Durendal belonged to Roland, nephew of Charlemagne and greatest of his twelve peers. In its golden hilt were set relics of the Hebrew wave and after: a tooth of Saint Peter, blood of Saint Basil, hair of Saint Denis, a thread of the robe of Mary. And one Italian keeper of songs swears that before it was Roland\'s, it was the sword of Hector of Troy. If he is right, it carries the Greek wave and the Hebrew wave both, and the heralds call it the first braided relic. At Roncevaux, Roland was too proud to blow his horn until all around him were dying. Dying himself, he struck it on a rock ten times so no enemy would carry it: the rock split, the sword did not. A sword still stands in the cliff at Rocamadour that the people there call Durendal. Roncevaux was the last great clash of great arms the songs remember. It wakes for an Echo who will call for help in time.',
    },

    // ---- The Hearth ----
    hand_of_glory: {
        age: 'hearth',
        rumor: 'A hanged man\'s hand holding a candle of its own fat, whose light freezes all who see it.',
        road: {
            scene: 'The thieves\' candle burns in the dead hand, and the whole house sleeps that cannot wake. Water will not put it out.',
            choices: [
                'Pour milk on the flame',
                'Smother it with a cloak',
                'Blow it out with a held breath',
            ],
        },
        guardian: { name: 'the Hanged Man of the Crossroads', epithet: 'who wants his hand back' },
        legend: 'The Hand of Glory is the only great arm in the Long Memory made by someone with no power at all. You take the hand of a hanged man, cut from the gallows at midnight, and dry it and pickle it, and set in its fingers a candle made of the hanged man\'s own fat. When it burns, no one in the house wakes, and anyone who sees its light stands frozen where they are. Thieves carried them through the long age the heralds call the Hearth, when the gods were silent and the great arms lay in barrows and seabeds, and the common folk stepped into that silence with cunning. Only milk will put it out. It is a horrible thing, and the heralds keep it on the roll anyway, because it proves the Long Memory\'s hardest lesson: the arms do not care whose hand holds them. It wakes for an Echo who has had nothing, and made something anyway.',
    },
    seven_league_boots: {
        age: 'hearth',
        rumor: 'An ogre\'s boots that cross seven leagues in a stride, and shrink to fit the smallest thief.',
        road: {
            scene: 'The ogre has run himself tired chasing thee and thy brothers and sleeps on a rock. His great boots are on his feet. They are far too big for thee.',
            choices: [
                'Pull them off and put them on; they will fit',
                'Run while he sleeps and leave the boots',
                'Kill the ogre in his sleep',
            ],
        },
        guardian: { name: 'the Ogre', epithet: 'eater of children, sleeper on the rock' },
        legend: 'Hop-o\'-My-Thumb was the smallest of seven brothers, no bigger than a thumb at birth, abandoned in the forest by parents who could not feed them. He led his brothers to the house of an ogre who ate children, tricked the ogre into turning on his own, and got his brothers out. The ogre chased them in his Seven-League Boots, which crossed seven leagues in a single stride, and grew so tired he fell asleep on a rock. The boy crept up and pulled the boots from his feet and put them on. They were fairy boots, and they shrank to fit him, and a boy no bigger than a thumb crossed a kingdom in a morning. The heralds call it the truest relic of the Hearth, and the closest of all the great arms to this court: made for a monster, taken by the smallest, fitted to whoever dared. It wakes for an Echo who started as a peasant.',
    },
};

module.exports = { AGES, uniqueTrials };
