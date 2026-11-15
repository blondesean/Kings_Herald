/* Flavor text for the Final Blow, the post after the court beats the Herald
 * (src/heraldBattle.js): one line per member, each their part in bringing him
 * down, before the Fall in heraldWinLines. The lines lead up to him dropping
 * to one knee, so none of them should finish him off.
 *
 * `who` is the member's bolded name, e.g. "**Robin**"; each line goes on from
 * it. Members are they/them.
 *
 * heraldFinalBlowUniqueLines is keyed by unique id (shopCatalog.UNIQUES), each
 * drawn from that relic's legend. A unique without an entry falls back to its
 * slot's lines in heraldFinalBlowGearLines, which take the piece's name, for a
 * member whose finest piece is not a unique. heraldFinalBlowBareLines is for
 * a member who wears nothing at all.
 *
 * No parentheses: this is herald dialogue.
 */

const heraldFinalBlowIntroLines = () => [
    'The wheel comes back to the Herald\'s hand, slower now, and the court closes in. Every Echo has a part in what comes next.',
    'The Herald catches the wheel, and for the first time, he has to reach for it. The court sees it, and closes in.',
];

const heraldFinalBlowUniqueLines = {
    // Helm
    helm_of_darkness: (who) => [
        `${who} pulls on the Helm of Darkness and is simply gone. The wheel cuts the air where they stood, and the blow that answers it comes from nowhere at all.`,
        `${who} vanishes beneath the Helm of Darkness, as Perseus did fleeing the Gorgons, and the Herald, who has seen everything in the Long Memory, cannot see them coming.`,
    ],
    aegishjalmur: (who) => [
        `${who} lifts their eyes beneath Aegishjalmur and meets the Herald's. For one heartbeat, the oldest voice in the world forgets what it was about to say.`,
        `${who} strides forward under the Helm of Awe, and the Herald's arm falters mid-throw, as every foe of Fafnir's once did.`,
    ],
    tarnhelm: (who) => [
        `${who} whispers to the Tarnhelm and becomes a great serpent, coiling about the Herald's staff until he can no longer turn the wheel.`,
        `${who} wishes themselves elsewhere beneath the Tarnhelm, and is suddenly at the Herald's back.`,
    ],
    // Chest
    nemean_lions_pelt: (who) => [
        `${who} throws themselves before the wheel, and it rings off the Nemean Lion's Pelt like a blade off a mountain. No weapon ever pierced that hide, and the wheel does not either.`,
        `${who} pulls the Nemean Lion's Pelt over their head and charges, as Heracles charged into the lion's cave, and wrestles the Herald's staff down with bare hands.`,
    ],
    kavacha: (who) => [
        `${who} steps in front of the court, and the wheel strikes the Kavacha and falls away, as every weapon fell from Karna's golden armor.`,
        `${who} stands in the Kavacha, blazing like the sun that gave it, and the Herald must shield his eyes for the first time in all the ages.`,
    ],
    armor_of_achilles: (who) => [
        `${who} raises the great shield of Achilles, with the whole world hammered into it by Hephaestus, and the Herald, who has told the story of every age, stops for a heartbeat to read it.`,
        `${who} wades into the wheel's path in the Armor of Achilles, and the god-forged bronze turns it aside as it turned the spears at Troy.`,
    ],
    // Pants
    megingjord: (who) => [
        `${who} cinches Megingjord tight, and with Thor's strength doubled in their arms, seizes the Herald and lifts him clean off the ground.`,
        `${who} buckles Megingjord and hauls the Herald's staff to the floor, as Thor once hauled the World Serpent up from the deep.`,
    ],
    girdle_of_hippolyta: (who) => [
        `${who} tightens the Girdle of Hippolyta, the war belt of the Amazon queen, and leads the charge as she led hers, the court crashing in behind.`,
        `${who} wears the Girdle of Hippolyta, the gift of the god of war, and every blow they strike falls with the weight of Ares behind it.`,
    ],
    // Weapon
    mjolnir: (who) => [
        `${who} hurls Mjolnir, and thunder shakes the hall. It strikes the Herald and returns to their hand, as faithful as his wheel. He has met his match in that, at last.`,
        `${who} raises Mjolnir high, and lightning answers. The hammer comes down on the Herald's staff with the sound of a mountain splitting.`,
    ],
    gungnir: (who) => [
        `${who} hurls Gungnir, the spear that never misses its mark, and it does not miss.`,
        `${who} levels Gungnir, and the Herald knows at once what all of Odin's foes knew: there is no use dodging a spear that never misses.`,
    ],
    tyrfing: (who) => [
        `${who} draws Tyrfing, and the cursed blade will not return to its sheath without blood. It finds the Herald's arm, and will have to be content with that.`,
        `${who} swings Tyrfing, the sword that cuts iron and stone like cloth, and the Herald's guard proves no harder.`,
    ],
    staff_of_moses: (who) => [
        `${who} holds the Staff of Moses high, as Moses did above the battle with Amalek, and while it stays raised, the court cannot falter.`,
        `${who} brings the Staff of Moses down, and the ground beneath the Herald parts as the sea once did, and he stumbles into the gap.`,
    ],
    jawbone_of_samson: (who) => [
        `${who} swings the Jawbone of Samson, which struck down a thousand men in a single day, and lands the blow it was saving for the thousand and first.`,
        `${who} snatches up the Jawbone of Samson and lays into the Herald with the strength of Samson unshorn.`,
    ],
    sword_of_goliath: (who) => [
        `${who} draws the Sword of Goliath, of which David said there is none like it, and the Herald finds that he agrees.`,
        `${who} swings the Sword of Goliath, a giant's blade, and the Herald, who has watched giants fall before, gives ground for the first time.`,
    ],
    kusanagi_no_tsurugi: (who) => [
        `${who} sweeps Kusanagi-no-Tsurugi, the Grass-Cutting Sword, in a wide arc, and the very wind turns against the Herald, as it turned on the men who tried to burn Yamato Takeru.`,
        `${who} cuts through the Herald's guard with Kusanagi-no-Tsurugi as cleanly as Yamato Takeru cut through the burning grass.`,
    ],
    fragarach: (who) => [
        `${who} sets Fragarach at the Herald's throat and asks whether he can still win. No one can lie with the Answerer at their throat. "No," says the Herald, and he sounds glad.`,
        `${who} raises Fragarach, and the wind obeys the Answerer as it obeyed Manannan, howling down on the Herald and tearing the wheel off its course.`,
    ],
    gae_bolg: (who) => [
        `${who} looses the Gae Bolg from their foot, as Cu Chulainn learned on Scathach's island, and the barbed spear opens into thirty points the moment it strikes.`,
        `${who} hurls the Gae Bolg, and the Herald, who knows the end of every story, knows that no one has ever drawn that spear out cleanly.`,
    ],
    durendal: (who) => [
        `${who} brings Durendal down on the Herald's guard. Roland could not break that blade on the rocks of Roncevaux, and the Herald cannot break it either.`,
        `${who} strikes with Durendal, and the blow cleaves the ground behind the Herald, as Roland's once cleft the mountains of the Pyrenees.`,
    ],
    ruyi_jingu_bang: (who) => [
        `${who} plucks the Ruyi Jingu Bang from behind their ear, no bigger than a needle, and it grows to the size of a pillar in the time it takes the Herald to blink.`,
        `${who} swings the Ruyi Jingu Bang, grown as heavy as the tides it once held still, and the Herald's own staff bends beneath it.`,
    ],
    harpe_of_perseus: (who) => [
        `${who} watches the Herald only in a polished shield, as Perseus watched Medusa, and brings the Harpe around in one clean stroke.`,
        `${who} hooks the wheel out of the air with the curved blade of the Harpe, and for one moment, it does not come back to the Herald's hand.`,
    ],
    sudarshana_chakra: (who) => [
        `${who} looses the Sudarshana Chakra against the Herald's own wheel. Two wheels of the first age meet in the air, and it is his that shudders.`,
        `${who} sets the Sudarshana Chakra spinning on one finger, as Vishnu does, and sends it after the Herald. Like his own wheel, it always comes home, but it strikes him on the way.`,
    ],
    // Gloves
    airgetlam: (who) => [
        `${who} catches the wheel in Airgetlam, the Silver Hand, and the metal rings like a bell, but holds.`,
        `${who} strikes with Airgetlam, the silver hand that made Nuada whole enough to be king again, and the Herald reels from a blow no flesh could have thrown.`,
    ],
    jarngreipr: (who) => [
        `${who} snatches the wheel from the air in Jarngreipr. Iron gloves made to hold Mjolnir do not much mind a herald's wheel.`,
        `${who} closes Jarngreipr around the Herald's staff, the iron grip of Thor himself, and does not let go.`,
    ],
    hand_of_glory: (who) => [
        `${who} raises the Hand of Glory, and its pale candle flickers. All who see that light stand frozen, and the Herald, for one long heartbeat, is still.`,
        `${who} lights the Hand of Glory, and the Herald's arm stops mid-throw, held fast like a sleeping household under a thief's spell.`,
    ],
    // Cape
    golden_fleece: (who) => [
        `${who} flings the Golden Fleece wide, and the Herald's eyes follow the gold, as every king's have since Colchis. The court is already moving.`,
        `${who} draws the Golden Fleece about them, the prize of the Argonauts, and the court rallies to its gleam as the heroes of the Argo once did.`,
    ],
    coat_of_many_colors: (who) => [
        `${who}, who reads dreams as Joseph did, saw this very moment in the Herald's horn-dream, and is already standing where the wheel will not be.`,
        `${who} sweeps the Coat of Many Colors before the Herald, and its colors dazzle him for one moment too long.`,
    ],
    mantle_of_elijah: (who) => [
        `${who} rolls up the Mantle of Elijah and strikes with it, as Elisha struck the Jordan, and the Herald's guard parts like the river.`,
        `${who} catches the wheel in the folds of the Mantle of Elijah, and a double portion of the prophet's spirit drives them on.`,
    ],
    valshamr: (who) => [
        `${who} throws on Valshamr, Freyja's falcon cloak, takes wing over the wheel's arc, and dives on the Herald from the rafters like a hawk on a hare.`,
        `${who} sweeps down out of the rafters in Valshamr, as Loki flew to fetch back Thor's hammer, and the Herald must look up for once.`,
    ],
    // Boots
    seven_league_boots: (who) => [
        `${who} takes one stride in the Seven-League Boots and is across the hall before the wheel has left the Herald's hand.`,
        `${who} steps out of the wheel's path in the Seven-League Boots, seven leagues and back again, and lands a blow before the wheel returns.`,
    ],
    shoe_of_vidar: (who) => [
        `${who} plants the Shoe of Vidar on the Herald's staff, as Vidar will plant it on the wolf's jaw at Ragnarok, and pins it to the floor.`,
        `${who} stands firm in the Shoe of Vidar, stitched from every scrap of leather ever cut away, and the wheel strikes it and goes no further.`,
    ],
};

// For a member whose finest piece is not a unique, by that piece's slot.
// `item` is its name.
const heraldFinalBlowGearLines = {
    helm: (who, item) => [
        `${who} takes the wheel's edge on their ${item} and keeps coming.`,
        `${who} lowers their head and drives into the Herald, ${item} first.`,
    ],
    chest: (who, item) => [
        `${who} throws themselves in the wheel's path, and their ${item} takes the blow meant for the court.`,
        `${who} steps in front of a fallen friend, and the wheel breaks against their ${item}.`,
    ],
    pants: (who, item) => [
        `${who} plants their feet, sure in their ${item}, and the wheel's blow does not move them an inch.`,
        `${who} vaults the wheel's arc, nimble in their ${item}, and comes down hard on the Herald's guard.`,
    ],
    weapon: (who, item) => [
        `${who} brings their ${item} down on the Herald's guard with everything they have.`,
        `${who} finds the gap between throw and catch, and their ${item} finds the Herald.`,
    ],
    gloves: (who, item) => [
        `${who} catches the Herald's staff in their ${item} and wrenches it aside.`,
        `${who} seizes the Herald's arm mid-throw, their ${item} locked tight, and spoils his aim.`,
    ],
    cape: (who, item) => [
        `${who} swirls their ${item} across the Herald's sight, and the court strikes from behind it.`,
        `${who} throws their ${item} over the wheel as it flies and drags it off its course.`,
    ],
    boots: (who, item) => [
        `${who} darts in on their ${item}, faster than the wheel can turn, and lands a blow.`,
        `${who} ducks under the wheel and is behind the Herald in two quick strides of their ${item}.`,
    ],
};

const heraldFinalBlowBareLines = (who) => [
    `${who}, armed with nothing but nerve, tackles the Herald at the knees.`,
    `${who} has no arms to speak of, so they throw the only thing they have, themselves, straight at the Herald.`,
];

module.exports = {
    heraldFinalBlowIntroLines,
    heraldFinalBlowUniqueLines,
    heraldFinalBlowGearLines,
    heraldFinalBlowBareLines,
};
