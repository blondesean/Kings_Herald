/* Boss roster for the daily encounter (see commands/passive/encounter.js).
 *
 * BOSSES has one list per voteable difficulty, Easy to Max, in the same order
 * as RARITIES in shopCatalog.js: a boss from tier i drops gear of rarity i
 * (two pieces per win; see DROPS_PER_WIN). The boss is hidden until the
 * battle — the party's averaged difficulty vote picks the tier, then a random
 * boss from that tier is revealed in the result. `epithet` is a short flavor
 * tag shown with the name.
 *
 * RAID is a separate, grander tier for the most storied lore bosses, fought
 * by a raid rather than a party: no party cap, so the boss is measured at the
 * Epic threshold per entrant (THRESHOLD_TIER), since a big raid naturally
 * brings members with less gear. It drops Legendary gear. It is NOT reachable
 * yet — it isn't in the difficulty vote or the daily lineup — and is defined
 * here so it can be wired in later.
 *
 * Drawn from the same franchises as the shop catalog; like the catalog, this
 * is a fan list for flavor, not game data. Tiers are rough fan judgment of how
 * fearsome each boss is, not exact in-game difficulty.
 */

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Extreme', 'Max'];

const BOSSES = [
    // Easy (drops Common)
    [
        { name: 'Hogger', franchise: 'WoW', epithet: 'terror of Elwynn Forest' },
        { name: 'Mutanus the Devourer', franchise: 'WoW', epithet: 'nightmare of the Wailing Caverns' },
        { name: 'Obor', franchise: 'RuneScape', epithet: 'the hill giant boss' },
        { name: 'Bryophyta', franchise: 'RuneScape', epithet: 'the moss giant boss' },
        { name: 'King Slime', franchise: 'Terraria', epithet: 'the crowned gelatin' },
        { name: 'the Eye of Cthulhu', franchise: 'Terraria', epithet: 'watcher in the night sky' },
        { name: 'the Asylum Demon', franchise: 'Dark Souls', epithet: 'warden of the Undead Asylum' },
        { name: 'the Taurus Demon', franchise: 'Dark Souls', epithet: 'brute of the Undead Burg' },
        { name: 'the Mountain Troll', franchise: 'Harry Potter', epithet: 'lurker of the girls\' lavatory' },
        { name: 'Queen Gohma', franchise: 'The Legend of Zelda', epithet: 'parasite of the Deku Tree' },
        { name: 'the Guard Scorpion', franchise: 'Final Fantasy', epithet: 'Shinra\'s mechanical sentry' },
        { name: 'the Shadow Behemoth', franchise: 'Guild Wars', epithet: 'horror of Queensdale' },
        { name: 'the White Orchard Griffin', franchise: 'The Witcher', epithet: 'scourge of the orchard' },
        { name: 'the Soldier of Godrick', franchise: 'Elden Ring', epithet: 'first foe of the Tarnished' },
        { name: 'the Intellect Devourer', franchise: 'Baldur\'s Gate', epithet: 'brain on four legs' },
    ],
    // Medium (drops Uncommon)
    [
        { name: 'Edwin VanCleef', franchise: 'WoW', epithet: 'master of the Defias' },
        { name: 'Archmage Arugal', franchise: 'WoW', epithet: 'lord of Shadowfang Keep' },
        { name: 'the Giant Mole', franchise: 'RuneScape', epithet: 'burrower beneath Falador' },
        { name: 'the King Black Dragon', franchise: 'RuneScape', epithet: 'three-headed lord of the Wilderness' },
        { name: 'Skeletron', franchise: 'Terraria', epithet: 'curse of the dungeon' },
        { name: 'the Queen Bee', franchise: 'Terraria', epithet: 'matriarch of the jungle hive' },
        { name: 'the Basilisk', franchise: 'Harry Potter', epithet: 'serpent of the Chamber' },
        { name: 'the Hungarian Horntail', franchise: 'Harry Potter', epithet: 'fiercest of the Triwizard dragons' },
        { name: 'King Dodongo', franchise: 'The Legend of Zelda', epithet: 'gorger of Dodongo\'s Cavern' },
        { name: 'the Bell Gargoyles', franchise: 'Dark Souls', epithet: 'guardians of the Undead Parish' },
        { name: 'the Capra Demon', franchise: 'Dark Souls', epithet: 'butcher of the Lower Burg' },
        { name: 'the Elder Guardian', franchise: 'Minecraft', epithet: 'warden of the ocean monument' },
        { name: 'the Watcher in the Water', franchise: 'Lord of the Rings', epithet: 'terror at the gates of Moria' },
        { name: 'Ifrit', franchise: 'Final Fantasy', epithet: 'lord of hellfire' },
        { name: 'the Fire Elemental', franchise: 'Guild Wars', epithet: 'creation of Metrica\'s Thaumanova reactor' },
        { name: 'the Toad Prince', franchise: 'The Witcher', epithet: 'cursed lord of the Oxenfurt sewers' },
        { name: 'Margit, the Fell Omen', franchise: 'Elden Ring', epithet: 'gatekeeper of Stormveil' },
        { name: 'Commander Zhalk', franchise: 'Baldur\'s Gate', epithet: 'cambion of the nautiloid' },
        { name: 'the Owlbear', franchise: 'Baldur\'s Gate', epithet: 'mother of the cave' },
    ],
    // Hard (drops Rare)
    [
        { name: 'Ragnaros', franchise: 'WoW', epithet: 'the Firelord' },
        { name: 'Onyxia', franchise: 'WoW', epithet: 'broodmother of the black dragonflight' },
        { name: 'Nefarian', franchise: 'WoW', epithet: 'lord of Blackwing Lair' },
        { name: 'General Graardor', franchise: 'RuneScape', epithet: 'Bandos\'s champion' },
        { name: 'Kree\'arra', franchise: 'RuneScape', epithet: 'Armadyl\'s avian general' },
        { name: 'the Corporeal Beast', franchise: 'RuneScape', epithet: 'the spirit made flesh' },
        { name: 'Ornstein and Smough', franchise: 'Dark Souls', epithet: 'the dragon slayer and the executioner' },
        { name: 'Great Grey Wolf Sif', franchise: 'Dark Souls', epithet: 'guardian of Artorias\'s grave' },
        { name: 'the Wither', franchise: 'Minecraft', epithet: 'three-headed bane of the Overworld' },
        { name: 'Imlerith', franchise: 'The Witcher', epithet: 'general of the Wild Hunt' },
        { name: 'Plantera', franchise: 'Terraria', epithet: 'bloom of the underground jungle' },
        { name: 'Ganondorf', franchise: 'The Legend of Zelda', epithet: 'King of Evil' },
        { name: 'the Shatterer', franchise: 'Guild Wars', epithet: 'Kralkatorrik\'s crystal champion' },
        { name: 'Bahamut', franchise: 'Final Fantasy', epithet: 'King of Dragons' },
        { name: 'Shelob', franchise: 'Lord of the Rings', epithet: 'spider of Cirith Ungol' },
        { name: 'Godrick the Grafted', franchise: 'Elden Ring', epithet: 'lord of Stormveil Castle' },
        { name: 'Rennala, Queen of the Full Moon', franchise: 'Elden Ring', epithet: 'mistress of the Academy of Raya Lucaria' },
        { name: 'Orin the Red', franchise: 'Baldur\'s Gate', epithet: 'Chosen of Bhaal' },
        { name: 'Ketheric Thorm', franchise: 'Baldur\'s Gate', epithet: 'Chosen of Myrkul' },
    ],
    // Extreme (drops Epic)
    [
        { name: 'Illidan Stormrage', franchise: 'WoW', epithet: 'the Betrayer' },
        { name: 'Kel\'Thuzad', franchise: 'WoW', epithet: 'archlich of Naxxramas' },
        { name: 'C\'Thun', franchise: 'WoW', epithet: 'the Old God beneath Ahn\'Qiraj' },
        { name: 'TzTok-Jad', franchise: 'RuneScape', epithet: 'master of the Fight Caves' },
        { name: 'Nex', franchise: 'RuneScape', epithet: 'Zaros\'s chosen general' },
        { name: 'Vorkath', franchise: 'RuneScape', epithet: 'the undead dragon of Ungael' },
        { name: 'the Moon Lord', franchise: 'Terraria', epithet: 'eldritch end of the world' },
        { name: 'Durin\'s Bane', franchise: 'Lord of the Rings', epithet: 'Balrog of Moria' },
        { name: 'Smaug the Golden', franchise: 'Lord of the Rings', epithet: 'terror of the Lonely Mountain' },
        { name: 'Miraak', franchise: 'Skyrim', epithet: 'the First Dragonborn' },
        { name: 'Gwyn, Lord of Cinder', franchise: 'Dark Souls', epithet: 'keeper of the First Flame' },
        { name: 'Eredin', franchise: 'The Witcher', epithet: 'King of the Wild Hunt' },
        { name: 'Sephiroth', franchise: 'Final Fantasy', epithet: 'the One-Winged Angel' },
        { name: 'the Ender Dragon', franchise: 'Minecraft', epithet: 'sovereign of the End' },
        { name: 'Lord Voldemort', franchise: 'Harry Potter', epithet: 'He-Who-Must-Not-Be-Named' },
        { name: 'Tequatl the Sunless', franchise: 'Guild Wars', epithet: 'Zhaitan\'s undead champion' },
        { name: 'Starscourge Radahn', franchise: 'Elden Ring', epithet: 'conqueror of the stars' },
        { name: 'Morgott, the Omen King', franchise: 'Elden Ring', epithet: 'last of the Golden Lineage' },
        { name: 'Ansur', franchise: 'Baldur\'s Gate', epithet: 'the slumbering bronze dragon' },
        { name: 'Lord Enver Gortash', franchise: 'Baldur\'s Gate', epithet: 'Chosen of Bane' },
    ],
    // Max (drops Legendary)
    [
        { name: 'Yogg-Saron', franchise: 'WoW', epithet: 'the Beast with a Thousand Maws' },
        { name: 'TzKal-Zuk', franchise: 'RuneScape', epithet: 'king of the Inferno' },
        { name: 'Sol Heredit', franchise: 'RuneScape', epithet: 'champion of the Fortis Colosseum' },
        { name: 'Telos', franchise: 'RuneScape', epithet: 'the Warden of the Anima Mundi' },
        { name: 'Omega Weapon', franchise: 'Final Fantasy', epithet: 'the ultimate superboss' },
        { name: 'Ultimecia', franchise: 'Final Fantasy', epithet: 'the sorceress who would compress time' },
        { name: 'Majora', franchise: 'The Legend of Zelda', epithet: 'the mask of doom' },
        { name: 'the Nameless King', franchise: 'Dark Souls', epithet: 'the forsaken firstborn' },
        { name: 'Darkeater Midir', franchise: 'Dark Souls', epithet: 'the dragon who devours the Abyss' },
        { name: 'Gaunter O\'Dimm', franchise: 'The Witcher', epithet: 'the Man of Glass' },
        { name: 'Kolmisilmä', franchise: 'Noita', epithet: 'the three-eyed one' },
        { name: 'Grima', franchise: 'Fire Emblem', epithet: 'the Fell Dragon' },
        { name: 'Malenia, Blade of Miquella', franchise: 'Elden Ring', epithet: 'the goddess of rot' },
        { name: 'Raphael', franchise: 'Baldur\'s Gate', epithet: 'the cambion of the House of Hope' },
    ],
];

// The raid tier: the grandest lore bosses, fought by a raid with no party
// cap. Not reachable yet (see the header comment).
const RAID = {
    label: 'Raid',
    THRESHOLD_TIER: 3, // measured at the Epic threshold per entrant
    DROP_RARITY: 'Legendary',
    maxParty: null, // no cap
    bosses: [
        { name: 'the Lich King', franchise: 'WoW', epithet: 'lord of the Scourge, upon the Frozen Throne' },
        { name: 'Deathwing', franchise: 'WoW', epithet: 'the Destroyer, Aspect of Death' },
        { name: 'Sargeras', franchise: 'WoW', epithet: 'the Dark Titan, lord of the Burning Legion' },
        { name: 'Sauron', franchise: 'Lord of the Rings', epithet: 'the Dark Lord of Mordor' },
        { name: 'Morgoth', franchise: 'Lord of the Rings', epithet: 'the first Dark Lord' },
        { name: 'Calamity Ganon', franchise: 'The Legend of Zelda', epithet: 'the scourge that consumed Hyrule' },
        { name: 'Kralkatorrik', franchise: 'Guild Wars', epithet: 'Elder Dragon of crystal' },
        { name: 'Zhaitan', franchise: 'Guild Wars', epithet: 'Elder Dragon of death' },
        { name: 'Alduin', franchise: 'Skyrim', epithet: 'the World-Eater' },
        { name: 'the Elden Beast', franchise: 'Elden Ring', epithet: 'vassal of the Greater Will' },
        { name: 'the Netherbrain', franchise: 'Baldur\'s Gate', epithet: 'the Absolute' },
        { name: 'Safer Sephiroth', franchise: 'Final Fantasy', epithet: 'the god who would ride the Lifestream' },
        { name: 'Kefka Palazzo', franchise: 'Final Fantasy', epithet: 'the god of magic, ruler of the World of Ruin' },
    ],
};

module.exports = { DIFFICULTIES, BOSSES, RAID };
