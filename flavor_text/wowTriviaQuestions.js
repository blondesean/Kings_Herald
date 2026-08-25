/* WoW trivia bank for /wow_trivia (commands/passive/wowTrivia.js).
 *
 * Each entry is { question, answers }, answers being every string that
 * counts as correct (matched case-insensitively, exact after trimming —
 * see wow_trivia.js). Ported from the free-text Q&A bank in
 * https://github.com/Road-block/TriviaBot (WoWQuestions.lua), which itself
 * spans vanilla through early Wrath-era content — hence the Herald's
 * in-character framing that the round is set in that era (see
 * flavor_text/wowTriviaFlavor.js).
 *
 * A handful of the source file's entries reused the same numeric index for
 * unrelated questions (a data-entry bug in the original — a later entry
 * silently overwrote an earlier one at that index) or mistyped an answer
 * line's index so it landed on the wrong question. This port fixes both:
 * every question the source ever defined is kept (none silently dropped),
 * and stray answer lines are attached to whichever question they're
 * physically adjacent to in the source, which is where authorial intent
 * clearly points in every case (verified by hand against the source file).
 */
const wowTriviaQuestions = () => [
    {
        question: "Who is the third boss in Blackwing Lair?",
        answers: ["Broodlord Lashlayer", "Broodlord"],
    },
    {
        question: "What is the minimum level requirement for artisan skills? (1-60)",
        answers: ["35", "thirtyfive", "thirty five"],
    },
    {
        question: "Which class can cast 'blessings'?",
        answers: ["Paladins", "Paladin"],
    },
    {
        question: "What is the zone north of Blasted Lands called? (full name)",
        answers: ["Swamp of Sorrows"],
    },
    {
        question: "What is the busiest Alliance city?",
        answers: ["Ironforge", "IF"],
    },
    {
        question: "In which instance does General Drakkisath reside?",
        answers: ["UBRS", "Upper Blackrock Spire"],
    },
    {
        question: "What is Leeroy's surname?",
        answers: ["Jenkins"],
    },
    {
        question: "What race has the 'Will of the Forsaken' racial ability?",
        answers: ["Undead", "Undeads", "The Forsaken", "Forsaken"],
    },
    {
        question: "What are low-leveled, buffed characters usually called?",
        answers: ["Twinks", "Twink", "Twinked"],
    },
    {
        question: "Where does each class-specific tier 0 (ex. Lightforge) leggings drop?",
        answers: ["Stratholme UD", "Stratholme", "strat"],
    },
    {
        question: "With whom must you reach exalted with to be able to buy 'The Unstoppable Force' (name one of the factions)?",
        answers: ["stormpike", "frostwolf"],
    },
    {
        question: "Who is the final boss in Molten Core?",
        answers: ["Ragnaros", "Ragnaros the Firelord"],
    },
    {
        question: "What does an orange-colored text on an item refer to?",
        answers: ["Legendary Quality", "legendary"],
    },
    {
        question: "What does a purple-colored text on an item refer to?",
        answers: ["Epic Quality", "epic"],
    },
    {
        question: "What does a blue-colored text on an item refer to?",
        answers: ["Rare Quality", "rare"],
    },
    {
        question: "What does a green-colored text on an item refer to?",
        answers: ["Uncommon Quality", "uncommon"],
    },
    {
        question: "Which of these pre-tbc end-game raiding instances is limited to 20 members? (UBRS, MC, AQ40, ZG, BWL",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "What is the lowest level requirement for an epic weapon?",
        answers: ["35", "thirty five"],
    },
    {
        question: "The Elements set corresponds to which class?",
        answers: ["Shaman", "Shammy"],
    },
    {
        question: "What is the tier 2 Priest set called?",
        answers: ["Vestments of Transcendence", "Transcendence"],
    },
    {
        question: "The Barrens was once a great forest under the protection of the Kaldorei's. (True/False)?",
        answers: ["True"],
    },
    {
        question: "The three bugs in AQ40 are called Vem, Kri and ...?",
        answers: ["Princess Yauj", "Yauj"],
    },
    {
        question: "The abbreviation 'Org' refers to?",
        answers: ["Orgrimmar"],
    },
    {
        question: "Duskbat Pelt drops in which zone?",
        answers: ["Tirisfal Glades", "Tirisfal"],
    },
    {
        question: "Lethtendris in Dire Maul is what race?",
        answers: ["Blood Elf"],
    },
    {
        question: "Which of these classes cannot duel-wield? (Warrior, Paladin, Rogue)",
        answers: ["Paladins", "Paladin"],
    },
    {
        question: "In which major city can the NPC Renzik 'The Shiv' be found?",
        answers: ["Stormwind", "SW"],
    },
    {
        question: "Negolash is found wandering off which zone's coast?",
        answers: ["Stranglethorn Vale", "STV"],
    },
    {
        question: "Which class can cast 'Unending Breath'?",
        answers: ["Warlocks", "Warlock"],
    },
    {
        question: "Goblin Rocket Fuel can be used for Cooking. (True/False)?",
        answers: ["true"],
    },
    {
        question: "For humans, the starting place is called?",
        answers: ["Northshire Valley", "northshire", "northshire abbey"],
    },
    {
        question: "The King of Ironforge is called?",
        answers: ["Magni Bronzebeard", "bronzebeard"],
    },
    {
        question: "Using the Seal of Ascension in UBRS summons which Dragon?",
        answers: ["Vaelastrasz", "Vaelastrasz the Red"],
    },
    {
        question: "Which enchanting dust is the highest ingame at the moment?",
        answers: ["Arcane", "Arcane Dust"],
    },
    {
        question: "The cooldown on making Mooncloth is ____ days",
        answers: ["Four", "4"],
    },
    {
        question: "The Emerald Dragons are Ysondre, Emeriss, Taerar and _____?",
        answers: ["Lethon"],
    },
    {
        question: "The first wow expansion is called? (full name)",
        answers: ["The Burning Crusade", "Burnign Crusade"],
    },
    {
        question: "Name a secondary trade skill.",
        answers: ["First Aid", "Fishing", "Cooking"],
    },
    {
        question: "How much reputation does it take to get from revered to exalted?",
        answers: ["21000", "21k", "21,000"],
    },
    {
        question: "To which zone can Druids teleport?",
        answers: ["Moonglade"],
    },
    {
        question: "Which AQ40 boss drops the tanking trinket The Burrower's Shell?",
        answers: ["Ouro"],
    },
    {
        question: "The enchant 'Enchant Chest - Major Mana' requires how many Lesser Eternal Essences?",
        answers: ["Zero", "0"],
    },
    {
        question: "The item 'Smite's Mighty Hammer' is what weapon-type?",
        answers: ["Mace", "a mace"],
    },
    {
        question: "_______ of Power consist of Zul'Gurub Coins, Bijous and Primal Hakkari items that can be obtained in Zul'Gurub.",
        answers: ["Paragons", "Paragon"],
    },
    {
        question: "The dungeon 'Maraudon' was released in which content patch?",
        answers: ["1.2"],
    },
    {
        question: "In order to summon the Avatar of Hakkar in the Sunken Temple, you need 4x of what item?",
        answers: ["Blood of Hakkar", "blood"],
    },
    {
        question: "Reginald Windsor plays a part in what major Alliance quest chain?",
        answers: ["Onyxia Key", "Onyxia", "Ony"],
    },
    {
        question: "Gnomes can purchase their mount just outside Ironforge, at _______'s Depot.",
        answers: ["Steelgrill's Depot", "Steelgrill", "Steelgrill's"],
    },
    {
        question: "Cured Medium Hide can be created by leatherworkers of what skill level?",
        answers: ["100", "one hundred"],
    },
    {
        question: "Which class can cast Moonfire?",
        answers: ["Druids", "Druid"],
    },
    {
        question: "By how much does a Priest's Inner Focus spell increase crit chance?",
        answers: ["25%", "25"],
    },
    {
        question: "Which class has a talent tree called 'protection'?",
        answers: ["Warriors", "Warrior"],
    },
    {
        question: "The first boss in AQ40 is called?",
        answers: ["The Prophet Skeram", "Prophet Skeram", "Skeram"],
    },
    {
        question: "Anubisath Defenders in AQ40 have 2 abilities they use close to death. Name one?",
        answers: ["Enrage or Explode", "Enrage", "Explode"],
    },
    {
        question: "Blackwing Lair was released in which content patch?",
        answers: ["1.6"],
    },
    {
        question: "To enter Blackwing Lair via the shortcut you need to touch an item called the _________?",
        answers: ["Orb of Command"],
    },
    {
        question: "Name one of the flying Dragons of Blackwing Lair.",
        answers: ["Ebonroc", "Flamegor", "Firemaw", "Nefarian"],
    },
    {
        question: "Chromaggus's Brood Affliction: Blue is what kind of debuff type?",
        answers: ["magic"],
    },
    {
        question: "The tier 2 shoulders drop from which boss?",
        answers: ["Chromaggus"],
    },
    {
        question: "Acronyms: What does ZF stand for?",
        answers: ["Zul'Farrak", "zulfarrak", "zul farrak"],
    },
    {
        question: "Acronyms: What does ZG stand for?",
        answers: ["Zul'Gurub", "zulgurub", "zul gurub"],
    },
    {
        question: "What being was supposedly created by the Old God, C'thun, as a mockery of life?",
        answers: ["Ouro", "Ouro the Sandworm"],
    },
    {
        question: "Acronyms: What does WTT stand for?",
        answers: ["Want To Trade"],
    },
    {
        question: "Acronyms: What does NPC stand for?",
        answers: ["Non-Player Character", "Non Player Character", "Non Playing Character"],
    },
    {
        question: "Acronyms: What does ML stand for?",
        answers: ["Master Looter", "Main Loot", "Masterloot", "Master Loot"],
    },
    {
        question: "Acronyms: What does DPS stand for?",
        answers: ["damage per second"],
    },
    {
        question: "Acronyms: What does PoM stand for?",
        answers: ["Presence of Mind"],
    },
    {
        question: "Completing the quest 'Imperial Qiraji Armaments' takes how many Elementium Ore's?",
        answers: ["Three", "3"],
    },
    {
        question: "The debuff 'Veil of Shadow' reduces healing by what percentage?",
        answers: ["75", "seventy-five"],
    },
    {
        question: "Guess The Zone: A Desert Zone with a Goblin town in it.",
        answers: ["Tanaris"],
    },
    {
        question: "Guess The Zone: A Tropical Zone, with lots of coastlines, and a Goblin Port.",
        answers: ["STV", "Stranglethorn Vale"],
    },
    {
        question: "Guess The Zone: Has volcanic terrain, and 'The Cauldron'.",
        answers: ["Searing Gorge"],
    },
    {
        question: "Guess The Zone: A Tropical Zone, which has a dark portal, and a mountain you can parachute off.",
        answers: ["Feralas"],
    },
    {
        question: "Guess The Zone: A Diseased wooded zone with special plants.",
        answers: ["Felwood"],
    },
    {
        question: "Guess The Zone: A Winter Zone which has hot springs.",
        answers: ["Winterspring"],
    },
    {
        question: "the PvP 'Grunts' rank were which rank?",
        answers: ["Two", "2"],
    },
    {
        question: "The Maker's Terrace can be found outside which instance?",
        answers: ["Uldaman", "Ulda"],
    },
    {
        question: "'Clam Chowder' grants a well fed buff with how much spirit and stamina?",
        answers: ["Zero", "0"],
    },
    {
        question: "'Tender Wolf Steak' grants a well fed buff with how much spirit and stamina?",
        answers: ["Twelve", "12"],
    },
    {
        question: "What is the cooldown of the 'Transmute: Arcanite' skill?",
        answers: ["48 hours", "2 days", "two days"],
    },
    {
        question: "How many primary and secondary professions are there all together?",
        answers: ["Fourteen", "14"],
    },
    {
        question: "How many copper bars are required to make 1x copper chain pants?",
        answers: ["Four", "4"],
    },
    {
        question: "How much does a linen bandage heal for (per second)?",
        answers: ["Eleven", "11"],
    },
    {
        question: "What is the only class totally devoid of healing effects?",
        answers: ["Mage", "Mages"],
    },
    {
        question: "Which Horde races cannot be a Shaman?",
        answers: ["Undeads and Blood Elves", "Blood Elves and Undeads"],
    },
    {
        question: "The Valley Of Trials is the starting area for which races (name at least one)?",
        answers: ["Orcs and Trolls", "Orcs", "Trolls"],
    },
    {
        question: "How many weapon types are there (like one-handed sword, two-handed sword, dagger etc.)?",
        answers: ["Sixteen", "16"],
    },
    {
        question: "What is the name of the zone that lies west of Tanaris?",
        answers: ["Un'Goro Crater", "Un'Goro", "UnGoro"],
    },
    {
        question: "How many combinations of races(8) and classes(9) can be made?",
        answers: ["Forty", "40"],
    },
    {
        question: "What continent in Azeroth has two Horde capital cities?",
        answers: ["Kalimdor"],
    },
    {
        question: "Attempting to swim the Great Sea will ultimatly lead to death by _____?",
        answers: ["Fatigue"],
    },
    {
        question: "Name one of the continents in Azeroth that actually is ingame and accessible?",
        answers: ["Eastern Kingdoms", "Kalimdor"],
    },
    {
        question: "What new profession came in the expansion? (full name)",
        answers: ["Jewelcrafting"],
    },
    {
        question: "Essence of the Red in the Vaelastrasz encounter restores how much energy per second?",
        answers: ["Fifty", "50"],
    },
    {
        question: "The transport mechanism between the southern Barrens and Thousand Needles is called?",
        answers: ["The Great Lift", "great lift"],
    },
    {
        question: "'Skull Rock' is found in which zone?",
        answers: ["Durotar"],
    },
    {
        question: "Sven and Lars can be found at which camp?",
        answers: ["Rebel Camp", "Rebel"],
    },
    {
        question: "Larion's companion in Un'Goro Crater is called?",
        answers: ["Muigin", "Muigi"],
    },
    {
        question: "Sten Stoutarm starts intrepid adventurers of which race(s) on their first quest?",
        answers: ["Gnomes and dwarves", "Gnomes", "dwarves"],
    },
    {
        question: "The Icebane set grants resistence to which school of magic?",
        answers: ["Frost"],
    },
    {
        question: "The 'Banner of Provocation' is used in which questline?",
        answers: ["tier 0.5", "t0.5"],
    },
    {
        question: "Sarltooth in the Wetlands is what type of beast?",
        answers: ["Raptor"],
    },
    {
        question: "Light Feathers are used as a reagent by which class(es)?",
        answers: ["Mage and Priest", "Mage", "Priest"],
    },
    {
        question: "To throw a 'Rough Dynamite' requires what skill level in Engineering?",
        answers: ["1", "One"],
    },
    {
        question: "Jaina Proudmoore's father is called?",
        answers: ["Daelin Proudmoore", "Daelin"],
    },
    {
        question: "Cooking a 'Herb Baked Egg' requires which type of spice?",
        answers: ["Mild Spices", "mild"],
    },
    {
        question: "Huhuran's Stinger grants how much extra agility?",
        answers: ["Eighteen", "18"],
    },
    {
        question: "The 'Soulforge' set can only be used by which class?",
        answers: ["Paladins", "Paladin"],
    },
    {
        question: "The Twilight Vale can be found in which zone?",
        answers: ["Darkshore"],
    },
    {
        question: "What is the duration on Prayer of Shadow Protection?",
        answers: ["20 Minutes", "20 min", "20 mins"],
    },
    {
        question: "How many tracks is there in The Burning Crusade soundtrack?",
        answers: ["22", "twenty two", "twenty-two"],
    },
    {
        question: "The Bramblewood set grants resistance to what?",
        answers: ["Nature", "NR"],
    },
    {
        question: "The Doom Touched Warriors are found in which instance?",
        answers: ["Naxxramas", "Naxx"],
    },
    {
        question: "What will undead NPC's not do?",
        answers: ["Swim", "swimming"],
    },
    {
        question: "What is the Wildbend River called further upstream?",
        answers: ["Bloodvenom River", "Bloodvenom"],
    },
    {
        question: "The NPC Donni Anthania sells which kind of non-combat pet?",
        answers: ["cats", "cat"],
    },
    {
        question: "What is the Rogue's tier 3 called?",
        answers: ["Boneschyte Armor"],
    },
    {
        question: "To get a pet chicken (Chicken Egg) players must complete which quest?",
        answers: ["CLUCK!", "cluck"],
    },
    {
        question: "Amberseal Keeper grants how much magical resistance to all?",
        answers: ["Five", "5"],
    },
    {
        question: "What is the biggest lake in Azeroth?",
        answers: ["Lordamere Lake", "Lordamere"],
    },
    {
        question: "Upon using an Orb of Deception, what race will a dwarf turn into?",
        answers: ["Darkspear Troll", "Troll"],
    },
    {
        question: "Who is the father of the dreaded Lord of Blackrock, Nefarian?",
        answers: ["Neltharion", "Deathwing", "The Earth-warder", "Neltharion the Earth-Warder"],
    },
    {
        question: "What is the name of the original World Tree?",
        answers: ["Nordrassil"],
    },
    {
        question: "How many people does it take to perform a Ritual of Summoning?",
        answers: ["Three", "3"],
    },
    {
        question: "In which patch was the honor system implemented?",
        answers: ["1.4"],
    },
    {
        question: "In which patch were the first battlegrounds added?",
        answers: ["1.5"],
    },
    {
        question: "In which patch were weather effects implemented?",
        answers: ["1.10"],
    },
    {
        question: "In which patch was the Druid talent review?",
        answers: ["1.8"],
    },
    {
        question: "In which patch was the Mage talent review?",
        answers: ["1.11"],
    },
    {
        question: "Which class(es) has a restoration talent tree? (name both or one of them)",
        answers: ["Druid", "Shaman", "Shamans", "Druids", "Druid and Shaman", "Druids and Shamans", "Shaman and Druid", "Shamans and Druids"],
    },
    {
        question: "To get 120 energy, Rogues must have 5 / 8 Nightslayer, and 31 points in which talent tree?",
        answers: ["Assassination"],
    },
    {
        question: "Which racial skill breaks fear effects?",
        answers: ["Will of the Forsaken", "wotf"],
    },
    {
        question: "What are Mages also known as (especially before a raid)?",
        answers: ["Vending Machine", "vendor", "water vendor"],
    },
    {
        question: "What is the duration of a Rogue's 5 point kidney shot? (__ sec)",
        answers: ["6 seconds", "6 secs", "6 sec", "6", "six"],
    },
    {
        question: "What is the hardest race to target in a Battleground?",
        answers: ["Gnome", "Gnomes"],
    },
    {
        question: "What color does a Rogue have on CT_Raid?",
        answers: ["Yellow"],
    },
    {
        question: "How many parts does the Temple of Ahn'Qiraj sets have? (hint: Tier 2.5)",
        answers: ["Five", "5"],
    },
    {
        question: "Which element slows Viscidus, and is needed in order to defeat him?",
        answers: ["Frost"],
    },
    {
        question: "How many bosses can drop tier 2 gloves in Blackwing Lair?",
        answers: ["Three", "3"],
    },
    {
        question: "Who is known as 'The Ashbringer'?",
        answers: ["Highlord Mograine", "Mograine"],
    },
    {
        question: "Which drop from Hakkar allows you to get 3 different epic trinkets? (full name)",
        answers: ["Heart of Hakkar"],
    },
    {
        question: "What level of reputation with Argent Dawn is needed in order to attune to Naxxramas?",
        answers: ["Honored"],
    },
    {
        question: "What herb is required for all the Greater Protection potions?",
        answers: ["Dreamfoil"],
    },
    {
        question: "Which instance is located in Silverpine Forest?",
        answers: ["Shadowfang Keep", "SFK"],
    },
    {
        question: "At what percentage of health does Princess Huhuran enrage?",
        answers: ["30%", "30", "thirty"],
    },
    {
        question: "How much spellcrit does the 'Rallying Cry of the Dragonslayer' buff give?",
        answers: ["10", "10%"],
    },
    {
        question: "Which Naxxramas boss has two helpers called Stalagg and Fuegan?",
        answers: ["Thaddius"],
    },
    {
        question: "Who drops the Hunter book 'Tranquilizing shot'?",
        answers: ["Lucifron"],
    },
    {
        question: "Which class is considered the 'purest' of the healing classes?",
        answers: ["Priest"],
    },
    {
        question: "How many tracks does the world of warcraft soundtrack have?",
        answers: ["30", "thirty"],
    },
    {
        question: "How much rage does the improved berserker rage talent (2/2) generate?",
        answers: ["10", "ten"],
    },
    {
        question: "How long does the unimproved Shield Wall last? ( ___ sec)",
        answers: ["10 seconds", "10", "ten", "ten secs", "ten sec", "10 sec"],
    },
    {
        question: "What tier is the Improved Berserker Stance talent on, as a Warrior, in the fury talent tree?",
        answers: ["8", "eight"],
    },
    {
        question: "How much damage does each point of rage convert into on the last rank of Execute?",
        answers: ["18", "eighteen"],
    },
    {
        question: "Switching Stances constantly as a Warrior is called?",
        answers: ["stance dance", "stance dancing", "stance-dancing", "stance-dance"],
    },
    {
        question: "The last rank of Sunder Armor reduces armor by how much?",
        answers: ["520", "Five hundred twenty"],
    },
    {
        question: "Piercing Howl reduces the movement speed of enemies by what percentage?",
        answers: ["50%", "50", "fifty"],
    },
    {
        question: "Overpower can only be used after the target does what?",
        answers: ["dodge", "dodges"],
    },
    {
        question: "The talent Blood Craze can be found in which talent tree?",
        answers: ["Fury"],
    },
    {
        question: "Rend (Rank 8) causes ___ damage over 21 secs.",
        answers: ["182", "One hundred eighty two"],
    },
    {
        question: "Which Warrior ability reduces healing effects by 50%?",
        answers: ["Mortal Strike", "MS"],
    },
    {
        question: "Which sword was too powerful to be included in the game? (hint: Southpark)",
        answers: ["The Sword of a Thousand Truths", "sword of a thousand truths", "sword of a 1000 truths"],
    },
    {
        question: "How much spell damage does the Zandalarian Hero Charm increase?",
        answers: ["204", "two hundred four"],
    },
    {
        question: "Which races can use a Mechanostrider Mount? (x and y)",
        answers: ["dwarves and Gnomes", "Dwarf and Gnome", "Gnomes and dwarves"],
    },
    {
        question: "How long cooldown does the Zandalarian Hero Charm have?",
        answers: ["2 minutes", "2 min", "2", "2 mins", "two minutes", "two min", "two", "two mins"],
    },
    {
        question: "How long cooldown does the Mage spell 'Blastwave' have?",
        answers: ["45 seconds", "45 sec", "45", "45 secs"],
    },
    {
        question: "What is Mages with talents mainly in Frost and Fire called?",
        answers: ["Elemental", "Elemental Mages"],
    },
    {
        question: "What two things can a Mage polymorph his foe into, besides a sheep? (x and y)",
        answers: ["Pig and Turtle", "Turtle and Pig"],
    },
    {
        question: "Which boss drops Ashkandi, greatsword of the Brotherhood?",
        answers: ["Nefarian"],
    },
    {
        question: "What beast is Grimclaw, which patrols Darkshore?",
        answers: ["Bear", "Icebear", "Ice-bear"],
    },
    {
        question: "How many people are there in a full party?",
        answers: ["5", "five"],
    },
    {
        question: "How many people are there in a full raid?",
        answers: ["40", "forty"],
    },
    {
        question: "Who can teach you how to use one handed swords in Stormwind?",
        answers: ["Wu Ping"],
    },
    {
        question: "Curse of agony ticks every ___ seconds?",
        answers: ["Two", "2"],
    },
    {
        question: "Curse of doom ticks for how much base damage?",
        answers: ["4200", "four thousand two hundred"],
    },
    {
        question: "How many statues is there outside Stormwind?",
        answers: ["6", "Six"],
    },
    {
        question: "Where is the Valley of Heroes?",
        answers: ["Stormwind", "SW"],
    },
    {
        question: "Where is the Valley of Kings?",
        answers: ["Loch Modan"],
    },
    {
        question: "Which class originally soloed Kazzak?",
        answers: ["Paladin", "Paladins"],
    },
    {
        question: "How many DoTs can a warlock have as abilities?",
        answers: ["5", "Five"],
    },
    {
        question: "Name a DoT which was added to the Warlock class in TBC?",
        answers: ["Unstable Affliction", "Seed of Corruption"],
    },
    {
        question: "What class besides a Warrior has a talent tree called protection?",
        answers: ["Paladin", "Paladins"],
    },
    {
        question: "Before the Paladin revamp, what was the top tier spell in the retribution tree of Paladins?",
        answers: ["Blessing of Kings", "BoK"],
    },
    {
        question: "How many capital cities is there ingame, including Shattrath?",
        answers: ["9", "Nine"],
    },
    {
        question: "On which boss in Naxxramas do you have to mind control a mob, but not use it for more than 5 seconds?",
        answers: ["Grand widow faerlina", "Faerlina"],
    },
    {
        question: "What is the Alliance equivelent to Will of the Forsaken? (gives a great advantage against a certain class)",
        answers: ["perception"],
    },
    {
        question: "Who originally dropped the lightforge gauntlets?",
        answers: ["Emperor Dagran Thaurissan", "Dagran Thaurissan"],
    },
    {
        question: "In which zone does most blindweed grow?",
        answers: ["Swamp of Sorrows"],
    },
    {
        question: "Which is the only zone where you can find gromsblood, mountain silversage and dreamfoil?",
        answers: ["Felwood"],
    },
    {
        question: "Which flask provides players with an extra 400 HP for 2 hours?",
        answers: ["Flask of the Titans", "titans", "titan"],
    },
    {
        question: "Loatheb usually requires many Greater ______ Protection Potions.",
        answers: ["Shadow"],
    },
    {
        question: "What is the name of the monument in Azshara that has been broken in half?",
        answers: ["Ravencrest Monument", "Ravencrest"],
    },
    {
        question: "What is the name of the last boss in Shadowfang Keep?",
        answers: ["Arugal", "Archmage Arugal"],
    },
    {
        question: "What is the ideal amount of Warriors for the 4 Horsemen fight in Naxxramas?",
        answers: ["8", "Eight"],
    },
    {
        question: "Blackwing Lair was introduced in which patch?",
        answers: ["1.6"],
    },
    {
        question: "Gothik the Harvester in Naxxramas has how many waves of adds?",
        answers: ["18", "Eighteen"],
    },
    {
        question: "What trinket allows you to kill yourself when equipped?",
        answers: ["Crystal of Zin-Malor", "Zin-Malor"],
    },
    {
        question: "What is the color of the rarest AQ40 mount that drops from trash mobs?",
        answers: ["red"],
    },
    {
        question: "What herb will sometimes spawn instead of grave moss in the SM graveyard?",
        answers: ["Kingsblood"],
    },
    {
        question: "What is the name of the raiding instance in Netherstorm? (full name)",
        answers: ["Tempest Keep"],
    },
    {
        question: "What debuff once allowed Horde players to attack NPCs of their own faction?",
        answers: ["Mark of Shame"],
    },
    {
        question: "Who is the final boss you have to kill for the tier 0.5 series of quests?",
        answers: ["Lord Valthalak", "Valthalak"],
    },
    {
        question: "Greater Shadow Protection potions require one dreamfoil, one __________, and one crystal vial.",
        answers: ["shadow oil"],
    },
    {
        question: "How long is the auto-release timer when you die outside of an instance?",
        answers: ["6 minutes", "6 min", "6 mins"],
    },
    {
        question: "Name one of the two bosses you must kill during the Thaddius fight before you face Thaddius himself.",
        answers: ["Stalagg", "Feugen"],
    },
    {
        question: "The 'Fungal Bloom' debuff in the Loatheb fight gives how much bonus to crit chance?",
        answers: ["60%", "60"],
    },
    {
        question: "The Pools of Vision are found in what main city? (full name)",
        answers: ["Thunder Bluff"],
    },
    {
        question: "What is the name of the lowest level zone in Outland?",
        answers: ["Hellfire Peninsula"],
    },
    {
        question: "Which zone do Druids gain a teleport to at level 10?",
        answers: ["Moonglade"],
    },
    {
        question: "Flasks can be crafted in two instances and one zone in the game. Name one?",
        answers: ["Blackwing Lair", "Scholomance", "Shattrath", "Shattrath City"],
    },
    {
        question: "What creature despawns at 20%, saying it is 'not his time yet'?",
        answers: ["Anachronos"],
    },
    {
        question: "Which zone contains the original World Tree? (full name)",
        answers: ["Mount Hyjal"],
    },
    {
        question: "What is the name of the elite Dragon who patrols the Blasted Lands?",
        answers: ["Teremus the Devourer", "Teremus"],
    },
    {
        question: "How many mini-bosses are there on the top-level of the Sunken Temple?",
        answers: ["6", "Six"],
    },
    {
        question: "What does Gluth eat to regain health?",
        answers: ["Zombie Chow", "zombies", "zombie"],
    },
    {
        question: "Maexxna enrages at what health percentage?",
        answers: ["30", "30%", "Thirty"],
    },
    {
        question: "Who is the most damaging boss in Naxxramas?",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "Which boss drops the tier 2 headpieces?",
        answers: ["Onyxia", "Ony"],
    },
    {
        question: "How many parts does the tier 3 armor set have?",
        answers: ["9", "Nine"],
    },
    {
        question: "The tunnel to Stonetalon Mountains from Ashenvale will deposit you near the road. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is the second last boss in Molten Core?",
        answers: ["Majordomo Executus", "Majordomo"],
    },
    {
        question: "In the AQ War Effort, what item was required in the greatest number?",
        answers: ["Linen bandages"],
    },
    {
        question: "What does Ragnaros summon when he submerges after 3 minutes of combat?",
        answers: ["Sons of Flame"],
    },
    {
        question: "What Rogue leggings does Ragnaros drop?",
        answers: ["Bloodfang Pants", "Bloodfang"],
    },
    {
        question: "Who is the 'Dad' in the Bug Family in AQ40?",
        answers: ["Lord Kri", "Kri"],
    },
    {
        question: "When the game was released, the mobs of which zone had no loot?",
        answers: ["Silithus"],
    },
    {
        question: "Which Blackwing Lair boss drops the tier 2 Bracers?",
        answers: ["Razorgore the Untamed", "Razorgore"],
    },
    {
        question: "What is the name of the bar in Blackrock Depths?",
        answers: ["The Grim Guzzler", "Grim Guzzler"],
    },
    {
        question: "How many bosses in AQ20 must be kited to kill them?",
        answers: ["2", "two"],
    },
    {
        question: "Who has the lowest health of all the bosses in Naxxramas?",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "How many optional encounters does AQ40 have?",
        answers: ["3", "Three"],
    },
    {
        question: "The Gurubashi Arena event takes place at ____-hourly intervals?",
        answers: ["3", "three"],
    },
    {
        question: "In what patch were the 4 world Dragons introduced?",
        answers: ["1.8"],
    },
    {
        question: "What is the lowest level instance in the game?",
        answers: ["Ragefire Chasm", "RFC"],
    },
    {
        question: "What is the name of the draenei capital city?",
        answers: ["The Exodar", "Exodar"],
    },
    {
        question: "Which Alliance race has +15 engineering as racial passive?",
        answers: ["Gnome", "Gnomes"],
    },
    {
        question: "Acronyms: What does ATP stand for?",
        answers: ["Attack Power"],
    },
    {
        question: "How many fears does the Warlock class have?",
        answers: ["2", "two"],
    },
    {
        question: "Druids can do Physical, Nature and ______ damage.",
        answers: ["Arcane damage", "arcane"],
    },
    {
        question: "What boss is a anagram for healbot?",
        answers: ["Loatheb"],
    },
    {
        question: "How many PvP ranks existed in the old honor system?",
        answers: ["14", "fourteen"],
    },
    {
        question: "At what PvP rank could you buy PvP mounts? (number)",
        answers: ["11", "eleven"],
    },
    {
        question: "Arcane Resilience will increase your armor by what % of your intellect?",
        answers: ["50%", "Fifty", "50"],
    },
    {
        question: "What instance is sometimes called 'UD'?",
        answers: ["Stratholme", "Strat"],
    },
    {
        question: "Name a faction that is part of the Steamwheedle Cartel.",
        answers: ["Booty Bay", "Everlook", "Ratchet", "Gadgetztan"],
    },
    {
        question: "What race has the racial skill 'Diplomacy'?",
        answers: ["Human", "Humans"],
    },
    {
        question: "Blizzard will do up to 1472 damage over ___ seconds?",
        answers: ["8", "eight"],
    },
    {
        question: "Evocation has a ___ min cooldown?",
        answers: ["8", "eight"],
    },
    {
        question: "Mages can Polymorph you into a goat. (True/False)?",
        answers: ["False"],
    },
    {
        question: "Which class can cast Fear?",
        answers: ["Warlock"],
    },
    {
        question: "The  tier 3 Mage set is called?",
        answers: ["Frostfire"],
    },
    {
        question: "Which is the most hated instance?",
        answers: ["Gnomeregan"],
    },
    {
        question: "Acronyms: What does DKP stand for?",
        answers: ["Dragon Kill Points"],
    },
    {
        question: "Who is being held captive by the Baron in Stratholme?",
        answers: ["Ysida Harmon", "Ysida"],
    },
    {
        question: "What epic sword set was 'Forged in the seething flames of hatred'?",
        answers: ["The Twin blades of Hakkari", "Twin blades of Hakkari"],
    },
    {
        question: "What is the name of the fruit vendor patrolling in Ironforge (The Mystic Ward)?",
        answers: ["Bimble Longberry", "Longberry", "Bimble"],
    },
    {
        question: "What is the name of the food you get from the Mage spell 'Conjure food (Rank 1)'?",
        answers: ["Muffin", "Muffins", "Conjured Muffins", "Conjured Muffin"],
    },
    {
        question: "Humanoids can drop linen cloth from level _.",
        answers: ["8", "eight"],
    },
    {
        question: "One area in Silverpine Forest is called '______ Isle'.",
        answers: ["Fenris"],
    },
    {
        question: "Where does most of the Blue Dragonflight reside?",
        answers: ["Northrend"],
    },
    {
        question: "Where does most of the Black Dragonflight reside?",
        answers: ["Blackrock Mountain", "Blackrock Spire", "Burning Steppes"],
    },
    {
        question: "Where does most of the Bronze Dragonflight reside?",
        answers: ["Caverns of Time", "Tanaris"],
    },
    {
        question: "Where does most of the Red Dragonflight reside?",
        answers: ["Grim Batol", "Wetlands"],
    },
    {
        question: "Where does most of the Green Dragonflight reside?",
        answers: ["The Emerald Dream", "Emerald Dream", "Swamp of Sorrows"],
    },
    {
        question: "Who is the leader of the Bronze Dragonflight?",
        answers: ["Nozdormu", "Nozdormu the Timeless one"],
    },
    {
        question: "Who is the leader of the Green Dragonflight?",
        answers: ["Ysera", "Ysera the Dreamer"],
    },
    {
        question: "Who is the leader of the Red Dragonflight?",
        answers: ["Alexstraza", "Alexstrasza the Life-Binder", "Alexstrasza the Life Binder"],
    },
    {
        question: "Who is the leader of the Blue Dragonflight?",
        answers: ["Malygos", "Malygos the Spell-Weaver", "Malygos the Spell Weaver"],
    },
    {
        question: "Who is the leader of the Black Dragonflight?",
        answers: ["Neltharion", "Deathwing", "Neltharion the Earth-Warder", "Deathwing the Destroyer"],
    },
    {
        question: "The Black Dragonflight was originally which color, before becoming corrupted?",
        answers: ["Brown"],
    },
    {
        question: "To where does the portals which the corrupted Emerald Dragons are guarding, lead?",
        answers: ["The Emerald Dream", "Emerald Dream"],
    },
    {
        question: "Name one of the two places where Eranikus can be found.",
        answers: ["Sunken Temple or Moonglade", "Sunken Temple", "Moonglade", "Moonglade or Sunken Temple"],
    },
    {
        question: "With the Genesis (t2.5) set bonus, what is the cooldown on Rebirth for Druids?",
        answers: ["20 minutes", "Twenty minutes", "Twenty mins"],
    },
    {
        question: "The only non-combat pet with an effect on gameplay is the _____.",
        answers: ["Disgusting Oozeling"],
    },
    {
        question: "What is the name of the mount you can obtain through the repeatable quests in Winterspring?",
        answers: ["Reins of the Winterspring Frostsaber", "Winterspring Frostsaber"],
    },
    {
        question: "What is the name of the dranei mount?",
        answers: ["Elekk"],
    },
    {
        question: "Who is the mighty Warrior you must defeat in the Upper Blackrock Spire in order to obtain the tier 0 Warrior shoulders?",
        answers: ["Rend", "Rend Blackhand", "Warchief Rend Blackhand"],
    },
    {
        question: "In the Upper Blackrock Spires is a giant hound named 'The ____'.",
        answers: ["Beast"],
    },
    {
        question: "What dragon drops the tier 2 headpieces? (the full name)",
        answers: ["Onyxia"],
    },
    {
        question: "How long does it take for a Rogues stealth to be ready after unstealthing (Without Talents)?",
        answers: ["10 seconds", "10 secs", "10 sec"],
    },
    {
        question: "The cooldown for Goblin Jumper Cables is ____ minutes?",
        answers: ["30", "30 mins", "30 minutes", "30 min"],
    },
    {
        question: "Who does the trinket Warmth of Forgiveness drop off?",
        answers: ["The Four Horsemen", "Four Horsemen"],
    },
    {
        question: "What is the Hunter's tier 3 called?",
        answers: ["Cryptstalker"],
    },
    {
        question: "What plate item collection from Naxxramas increases frost resistance?",
        answers: ["Icebane"],
    },
    {
        question: "Prince ______ is the Scourge Ambassador to the Vrykuls.",
        answers: ["Keleseth"],
    },
    {
        question: "What is the full name of the last boss in The Deadmines?",
        answers: ["Edwin Van Cleef"],
    },
    {
        question: "What rare spawn in Stratholme drops Piccolo of the Flaming Fire?",
        answers: ["Hearthsinger Forresten", "Forresten"],
    },
    {
        question: "What is the name of the zone that you'll teleport into after entering the dark portal at Blasted Lands?",
        answers: ["Hellfire Peninsula"],
    },
    {
        question: "Blizzard Entertainment is owned by which company?",
        answers: ["Vivendi Universal Games", "vivendi"],
    },
    {
        question: "What is the homeworld of the eredar called?",
        answers: ["Argus"],
    },
    {
        question: "What is the undead's starting place called?",
        answers: ["Deathknell"],
    },
    {
        question: "In which talent tree can the spell 'Dark Pact' be found?",
        answers: ["Affliction"],
    },
    {
        question: "In which talent tree can the spell 'Soul Link' be found?",
        answers: ["Demonology"],
    },
    {
        question: "What lvl of First Aid is required to learn Artisan First Aid?",
        answers: ["225"],
    },
    {
        question: "Which class(es) can breathe under water infinitely?",
        answers: ["Warlock", "Shaman", "Druid"],
    },
    {
        question: "In which zone can you find Donova Snowden",
        answers: ["Winterspring"],
    },
    {
        question: "How many items is there in a tier 3 set?",
        answers: ["9", "Nine"],
    },
    {
        question: "What were the Blood Elves originally called?",
        answers: ["high elfs", "high elves"],
    },
    {
        question: "What race has Escape Artist as their racial?",
        answers: ["Gnomes", "Gnome"],
    },
    {
        question: "What is the Warlocks second pet called?",
        answers: ["Voidwalker", "vw"],
    },
    {
        question: "What is the highest rank of Fireball?",
        answers: ["Rank 13", "13", "thirteen"],
    },
    {
        question: "How much resources do you need to win an Arathi Basin match?",
        answers: ["2000", "two thousand"],
    },
    {
        question: "What type of resistance do you need for the Sapphiron encounter?",
        answers: ["Frost"],
    },
    {
        question: "What kind of monster is Onyxia?",
        answers: ["Dragon", "Dragonkin"],
    },
    {
        question: "On which continent is Deadwind Pass found?",
        answers: ["eastern kingdoms"],
    },
    {
        question: "In what instance does Illidan the Betrayer reside in?",
        answers: ["The Black Temple", "black temple", "bt"],
    },
    {
        question: "What will Piccolo of the Flaming Fire make you do?",
        answers: ["Dance", "dancing"],
    },
    {
        question: "Which boss do you need to defeat in order to aquire 'Thunderfury, The Blessed Blade of the Windseeker', if you have the bindings?",
        answers: ["Prince Thunderaan", "thunderaan"],
    },
    {
        question: "Gnomes can be Druids. (True/False)??",
        answers: ["False"],
    },
    {
        question: "Blood elves cannot be Warriors. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Name the crafted engineering item that only affects beasts",
        answers: ["Flash Bomb"],
    },
    {
        question: "How many Elementium Ore does it take to make a bar?",
        answers: ["One", "1"],
    },
    {
        question: "The acronym 'WPL' refers to?",
        answers: ["Western Plaguelands"],
    },
    {
        question: "What is the name of the blood elves capital city?",
        answers: ["Silvermoon", "Silvermoon city", "The Silvermoon", "The Silvermoon City"],
    },
    {
        question: "What is the starting place for Orcs?",
        answers: ["Valley of Trials", "The Valley of Trials"],
    },
    {
        question: "In what zone lies Tempest Keep?",
        answers: ["Netherstorm", "The Netherstorm"],
    },
    {
        question: "In what zone is Razorfen Kraul in?",
        answers: ["The Barrens", "Barrens"],
    },
    {
        question: "In what zone does Gruul the Dragonslayer live?",
        answers: ["Blade's Edge Mountains", "Blades Edge Mountains"],
    },
    {
        question: "In what zone is Auchindoun in?",
        answers: ["Terokkar forest", "Terokkar"],
    },
    {
        question: "In what zone does Lady Vashj reside in?",
        answers: ["Zangarmarsh"],
    },
    {
        question: "In what zone can you fight the fel orc's of Kargath Bladefist?",
        answers: ["Hellfire Peninsula"],
    },
    {
        question: "What is the name of dranei's starting zone?",
        answers: ["Azuremyst Isle"],
    },
    {
        question: "What is the name of the blood elves starting zone?",
        answers: ["Eversong Woods"],
    },
    {
        question: "What is the name of zone that contains Zul'Aman?",
        answers: ["Ghostlands", "Ghostland"],
    },
    {
        question: "Acronyms: What does JC stand for?",
        answers: ["Jewelcrafter", "Jewelcrafting"],
    },
    {
        question: "What is the skill limit on proffesions?",
        answers: ["375", "Three hundred seventy five"],
    },
    {
        question: "Where is Caverns of Time?",
        answers: ["Tanaris"],
    },
    {
        question: "Where do you fight 'Epoch Hunter'?",
        answers: ["Durnholde", "Escape from Durnholde Keep", "CoT - Durnholde", "CoT - Escape from Durnholde Keep", "Escape from Durnholde", "CoT - Escape from Durnholde"],
    },
    {
        question: "What is the name of the zone where you protect Medivith? Its future name is the Blasted Lands.",
        answers: ["Black Morass"],
    },
    {
        question: "In what zone is Molten Core?",
        answers: ["Searing Gorge", "Burning Steppes"],
    },
    {
        question: "In what zone is Zul'Gurub?",
        answers: ["Stranglethorn Vale", "STV"],
    },
    {
        question: "In what zone is Naxxramas?",
        answers: ["Eastern Plaguelands", "EPL"],
    },
    {
        question: "What was the patch that came out before the expansion (tbc) called?",
        answers: ["Before the Storm"],
    },
    {
        question: "What is the name of the populare auctioning addon?",
        answers: ["Auctioneer"],
    },
    {
        question: "In the expansion, some of the heroic dungeons will offer new content, instead of just being harder. Such as new ______ and new areas. This is only for some of the new instances, though. The old heroic instances wont get this.",
        answers: ["bosses"],
    },
    {
        question: "What mob-type is the realm Daggerspine named after?",
        answers: ["naga", "nagas"],
    },
    {
        question: "What is the blood elves mount called?",
        answers: ["Hawkstrider"],
    },
    {
        question: "What guild is infamous for its raiding achievments, such as world first C'thun and Kel'Thuzad kill?",
        answers: ["Nihilum"],
    },
    {
        question: "What guild is considered to be the 'best' raiding guild in terms of first kills and that sort of things, on the US servers?",
        answers: ["DT", "Death & Taxes", "Death and Taxes"],
    },
    {
        question: "WCRadio.com is a wow-radio that plays online shows every now and then. (True/False)?",
        answers: ["True"],
    },
    {
        question: "What mob type is the realm Bloodfeather named after?",
        answers: ["Harpies", "Harpy"],
    },
    {
        question: "Al'Akir is a _________. (The race)",
        answers: ["Elemental"],
    },
    {
        question: "Aszune was a woman that was turned into a statue of living stone by the Oracle. What race was she?",
        answers: ["night elf", "Kaldorei"],
    },
    {
        question: "What is the nathrezim race also known as?",
        answers: ["Dreadlord", "Dreadlords"],
    },
    {
        question: "What is Bladefist's first name?",
        answers: ["Kargath"],
    },
    {
        question: "What is 'The Venture Co.' mostly made of?",
        answers: ["Goblin", "Goblins"],
    },
    {
        question: "Who became the first satyr?",
        answers: ["Xavius"],
    },
    {
        question: "Where is Uldum located?",
        answers: ["Tanaris"],
    },
    {
        question: "Who is C'thun?",
        answers: ["Old God", "an Old God"],
    },
    {
        question: "Who leads the orcish Dragonmaw clan?",
        answers: ["Zuluhed the Whacked", "Zuluhed"],
    },
    {
        question: "The acronym 'SW' refers to?",
        answers: ["Stormwind"],
    },
    {
        question: "The acronym 'UC' refers to?",
        answers: ["Undercity"],
    },
    {
        question: "The acronym 'SM' refers to?",
        answers: ["Scarlet Monastery"],
    },
    {
        question: "The acronym 'RFD' refers to?",
        answers: ["Razorfen downs"],
    },
    {
        question: "The abbreviation 'BFD' refers to?",
        answers: ["Blackfathom Deeps"],
    },
    {
        question: "Anetheron is a lich. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What zone lies north of Ashenvale?",
        answers: ["Felwood"],
    },
    {
        question: "The acronym 'WC' refers to (in wow)?",
        answers: ["Wailing Caverns"],
    },
    {
        question: "The acronym 'RFK' refers to?",
        answers: ["Razorfen Kraul"],
    },
    {
        question: "The acronym 'RFC' refers to?",
        answers: ["Ragefire Chasm"],
    },
    {
        question: "The acronym 'PST' refers to?",
        answers: ["Please send tell"],
    },
    {
        question: "The acronym 'Strat' refers to?",
        answers: ["Stratholme"],
    },
    {
        question: "The acronym 'ST' refers to?",
        answers: ["Sunken Temple", "The Temple of Atal'hakkar", "Temple of Atal'hakkar"],
    },
    {
        question: "The abbreviation 'Ony' refers to?",
        answers: ["Onyxia"],
    },
    {
        question: "The acronym 'IF' refers to?",
        answers: ["Ironforge"],
    },
    {
        question: "The abbreviation 'Uld' refers to?",
        answers: ["Uldaman"],
    },
    {
        question: "The acronym 'UBRS' refers to?",
        answers: ["Upper Blackrock Spire"],
    },
    {
        question: "The acronym 'BRS' refers to?",
        answers: ["Blackrock Spire"],
    },
    {
        question: "The acronym 'LBRS' refers to?",
        answers: ["Lower Blackrock Spire"],
    },
    {
        question: "The acronym 'DOT' refers to?",
        answers: ["Damage over Time"],
    },
    {
        question: "The acronym 'HOT' refers to?",
        answers: ["Healing over Time"],
    },
    {
        question: "The acronym 'WTB' refers to?",
        answers: ["Want to buy"],
    },
    {
        question: "The acronym 'WTS' refers to?",
        answers: ["Want to Sell"],
    },
    {
        question: "The acronym 'GZ' refers to? (not the city, the word)",
        answers: ["Congratulations"],
    },
    {
        question: "The abbreviation 'Scholo' refers to?",
        answers: ["Scholomance"],
    },
    {
        question: "The acronym 'XP' refers to?",
        answers: ["Experience Point", "Experience Points"],
    },
    {
        question: "The acronym 'DM' refers to what instance, in Feralas?",
        answers: ["Dire Maul"],
    },
    {
        question: "The acronym 'DM' refers to what instance, in Westfall?",
        answers: ["The Deadmines", "Deadmines"],
    },
    {
        question: "The acronym 'AV' refers to?",
        answers: ["Alterac valley"],
    },
    {
        question: "The acronym 'AB' refers to?",
        answers: ["Arathi Basin"],
    },
    {
        question: "The acronym 'WSG' refers to?",
        answers: ["Warsong Gulch"],
    },
    {
        question: "The acronym 'AOE' refers to?",
        answers: ["Area of Effect", "Area of Effects"],
    },
    {
        question: "The acronym 'LFM' refers to?",
        answers: ["Looking for More", "Looking for more people"],
    },
    {
        question: "The acronym 'LFG' refers to?",
        answers: ["Looking for Group"],
    },
    {
        question: "The acronym 'Mara' refers to?",
        answers: ["Maraudon"],
    },
    {
        question: "The acronym 'MT' refers to?",
        answers: ["Main Tank"],
    },
    {
        question: "The acronym 'OT' refers to?",
        answers: ["Off tank"],
    },
    {
        question: "The acronyms 'IRL/RL' refers to? (name one of them)",
        answers: ["In real life", "real life"],
    },
    {
        question: "The acronym 'GM' refers to? (name one of them)",
        answers: ["Game Master", "Guild Master"],
    },
    {
        question: "The acronym 'HFR' refers to?",
        answers: ["Hellfire Ramparts"],
    },
    {
        question: "The acronym 'SH' refers to?",
        answers: ["Shattered Halls", "The Shattered Halls"],
    },
    {
        question: "The acronym 'SP' refers to?",
        answers: ["Slave Pens", "The Slave Pens"],
    },
    {
        question: "The acronym 'UB' refers to?",
        answers: ["Underbog", "The underbog"],
    },
    {
        question: "The acronym 'SV' refers to?",
        answers: ["The Steamvault", "Steamvault"],
    },
    {
        question: "The acronym 'NE' refers to (not the direction, the race)?",
        answers: ["night elf"],
    },
    {
        question: "The acronym 'WOTLK' refers to?",
        answers: ["Wrath of the Lich King"],
    },
    {
        question: "The abbreviation 'Resto' refers to what? (hint: talent tree)",
        answers: ["Restoration"],
    },
    {
        question: "The abbreviation 'Mats' refers to?",
        answers: ["Materials"],
    },
    {
        question: "The acronym 'PUG' refers to?",
        answers: ["pick up group"],
    },
    {
        question: "The acronym 'CC' refers to?",
        answers: ["Crowd Control"],
    },
    {
        question: "The acronym 'AP' refers to?",
        answers: ["Attack power"],
    },
    {
        question: "The acronym 'LOS' refers to?",
        answers: ["line of sight"],
    },
    {
        question: "The acronym 'AQ20' refers to? (the full name)",
        answers: ["Ruins of Ahn'Qiraj", "The Ruins of Ahn'Qiraj"],
    },
    {
        question: "The acronym 'AQ40' refers to? (the full name)",
        answers: ["Temple of Ahn'Qiraj", "The Temple of Ahn'Qiraj"],
    },
    {
        question: "The acronym 'BEM' refers to?",
        answers: ["Blade's Edge Mountains", "Blades Edge Mountains"],
    },
    {
        question: "The acronym 'BWL' refers to?",
        answers: ["Blackwing Lair"],
    },
    {
        question: "The acronym 'KZ' refers to? (the full name)",
        answers: ["Karazhan"],
    },
    {
        question: "The acronym 'EPL' refers to?",
        answers: ["Eastern Plaguelands"],
    },
    {
        question: "The acronym 'CFR' refers to?",
        answers: ["Coilfang Reservoir"],
    },
    {
        question: "The acronym 'SL' refers to?",
        answers: ["Shadow Labyrinth"],
    },
    {
        question: "The acronymn 'SSC' refers to?",
        answers: ["Serpentshrine Cavern"],
    },
    {
        question: "The acronym 'SMV' refers to?",
        answers: ["Shadowmoon valley"],
    },
    {
        question: "The drop chance for Baron Rivendare's mount is how much? (about, in percents)",
        answers: ["0,01%", "0.01%", "0,01", "0.01"],
    },
    {
        question: "Where is Maraudon?",
        answers: ["Desolace"],
    },
    {
        question: "the Scourge was created by a being called ______________.",
        answers: ["The Lich King", "Lich King"],
    },
    {
        question: "The acronym 'DW' refers to?",
        answers: ["Dual wield"],
    },
    {
        question: "The acronym 'HS' refers to?",
        answers: ["Hearthstone"],
    },
    {
        question: "The acronym 'FR' refers to?",
        answers: ["Fire resistance"],
    },
    {
        question: "The acronym 'NR' refers to?",
        answers: ["Nature resistance"],
    },
    {
        question: "The acronym 'SR' refers to?",
        answers: ["Shadow resistance"],
    },
    {
        question: "The acronym 'XR' refers to?",
        answers: ["Crossroads"],
    },
    {
        question: "The acronym 'TM' refers to?",
        answers: ["Tarren Mill"],
    },
    {
        question: "The acronym 'TB' refers to?",
        answers: ["Thunder Bluff"],
    },
    {
        question: "The abbreviation 'Darn' refers to?",
        answers: ["Darnassus"],
    },
    {
        question: "The acronym 'CoE' refers to?",
        answers: ["Curse of Elements", "Curse of the Elements"],
    },
    {
        question: "The acronym 'CoS' refers to?",
        answers: ["Curse of Shadow"],
    },
    {
        question: "The acronym 'FW' refers to?",
        answers: ["Fear ward"],
    },
    {
        question: "The acronym 'VW' refers to?",
        answers: ["Voidwalker"],
    },
    {
        question: "What is the name of the capital city of the fallen nerubian empire?",
        answers: ["Azjol-Nerub"],
    },
    {
        question: "What is the Boulderfist clan made of?",
        answers: ["Ogres", "Ogre"],
    },
    {
        question: "Keeper Remulos is the son of Cenarius. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Cenarius is a Demigod. (True/False)?",
        answers: ["True"],
    },
    {
        question: "What is the name of the new World Tree?",
        answers: ["Teldrassil"],
    },
    {
        question: "What is Deathwing also known as?",
        answers: ["Neltharion", "Neltharion the Earth Warder", "Neltharion the Earth-Warder"],
    },
    {
        question: "The Bloodscalp tribe is what kind of trolls?",
        answers: ["Jungle", "Jungle Trolls"],
    },
    {
        question: "Who created the Twilight's Hammer?",
        answers: ["Cho'gall", "Chogall"],
    },
    {
        question: "Where does the Crushridge clan live?",
        answers: ["Alterac", "Alterac Mountains"],
    },
    {
        question: "Where can you find Chrommagus?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Dalaran is a city in the Hillsbrad Foothills. (True/False)?",
        answers: ["false"],
    },
    {
        question: "What is 'Darrowmere'? (ex. a city)",
        answers: ["Lake", "A lake"],
    },
    {
        question: "Who founded Quel'thalas?",
        answers: ["Dath'Remar", "Dath Remar", "Dath'Remar Sunstrider", "Dath'Remar Sunstrider"],
    },
    {
        question: "What is the the name of the organization that is causing Stormwind major trouble? The organization has taken over nearly all of westfall.",
        answers: ["Defias Brotherhood", "The Defias Brotherhood"],
    },
    {
        question: "What race is Detheroc?",
        answers: ["Dreadlord", "Nathrezim"],
    },
    {
        question: "What is Doomhammer's first name?",
        answers: ["Orgrim"],
    },
    {
        question: "Who is Thrall's mother?",
        answers: ["Draka"],
    },
    {
        question: "What was Outland's true name, before it was sundered?",
        answers: ["Draenor"],
    },
    {
        question: "Who is Thrall's advisor?",
        answers: ["Eitrigg"],
    },
    {
        question: "Howling Fjord is the place where the emerald dream is supposed to be accessable. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is Eonar? (ex. a naga)",
        answers: ["Titan", "Vanir Titan", "A titan", "A Vanir Titan"],
    },
    {
        question: "Frostmourne is the Lich King's weapon. (True/False)?",
        answers: ["True"],
    },
    {
        question: "The Firetree tribe, which is made of forest trolls, resides in?",
        answers: ["UBRS", "Upper Blackrock Spire"],
    },
    {
        question: "What rank was Garithos in the armies of Lordaeron before he was killed by Varimathras?",
        answers: ["Grand Marshall", "14"],
    },
    {
        question: "Genjuros was the _______ of the blackrock clan before he died.",
        answers: ["Blademaster"],
    },
    {
        question: "Gilneas is located in the _________ and is currently unaccessible. (hint: the continent)",
        answers: ["Eastern kingdoms"],
    },
    {
        question: "Who is the leader of Gilneas?",
        answers: ["Greymane", "Genn Graymane"],
    },
    {
        question: "The Gurubashi empire is made of ogres. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is Hakkar's fullname?",
        answers: ["Hakkar the Soulflayer"],
    },
    {
        question: "What was Hellscream's first name?",
        answers: ["Grom"],
    },
    {
        question: "Who lead the Warsong clan, before Thrall united all the orcs in Azeroth?",
        answers: ["Grom Hellscream"],
    },
    {
        question: "What is the largest glacier on Azeroth?",
        answers: ["Icecrown Glacier", "The Icecrown glacier", "The Icecrown", "Icecrown"],
    },
    {
        question: "Who is Malfurion Stormrage's brother?",
        answers: ["Illidan", "Illidan Stormrage"],
    },
    {
        question: "Kel'Thuzad was killed by adventurers who entered Naxxramas. (True/False)?",
        answers: ["False"],
    },
    {
        question: "Kirin Tor is a crime syndicate currently located in Gilneas. (True/False)?",
        answers: ["False"],
    },
    {
        question: "Rexxar is half orc, and half demon. (True/False)?",
        answers: ["False"],
    },
    {
        question: "In the tauren mythology, Elune is known as Mu'sha and is the left eye of the ___________.",
        answers: ["Earthmother", "the Earthmother"],
    },
    {
        question: "Rexxar helped Thrall when he founded Durotar. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Who is known as 'the Lightbringer'?",
        answers: ["Uther"],
    },
    {
        question: "Lethon was a Lieutenant of Ysera .(True/False)?",
        answers: ["True"],
    },
    {
        question: "Lord Anduin Lothar was the last descendant of the ______ royal bloodline, and was known as the 'Lion of Azeroth'.",
        answers: ["Arathi"],
    },
    {
        question: "The Maelstrom transformed some of the highborne's into naga's. (True/False)?",
        answers: ["True"],
    },
    {
        question: "__________ was the former leader of Outland.",
        answers: ["Magtheridon"],
    },
    {
        question: "__________ was the father of Cenarius.",
        answers: ["Malorne"],
    },
    {
        question: "Archimonde killed Cenarius father, Malorne, in the War of the Ancients. (True/False)?",
        answers: ["True"],
    },
    {
        question: "What was Cenarius father, Malorne, also known as?",
        answers: ["The white stag"],
    },
    {
        question: "The Earthen Ring is made of _________.",
        answers: ["Shamans"],
    },
    {
        question: "What is Malygos the Blue aspect over?",
        answers: ["Magic"],
    },
    {
        question: "_________ is the leader of the Blue Dragonflight.",
        answers: ["Malygos"],
    },
    {
        question: "Mannoroth quickly became one of the favoured Generals of Archimonde and Kil'Jaeden. (True/False)",
        answers: ["False"],
    },
    {
        question: "What was Mannoroth known as? (for ex. Archimonde the Defiler)",
        answers: ["Mannoroth the Destructor", "the Destructor"],
    },
    {
        question: "_________ opened the Dark Portal when he was possessed by Sargeras.",
        answers: ["Medivh"],
    },
    {
        question: "_______ the Tidehunter was a Elemental Lieutenant of the Old Gods.",
        answers: ["Neptulon"],
    },
    {
        question: "Ragnaros is a Elemental lieutenant of the Old Gods. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Ner'zhul was known as the elder _________ of the orcs, before he was transformed into the Lich King.",
        answers: ["shaman"],
    },
    {
        question: "___________ is a male Aesir Titan. Master of the arcane magic, knowledge, secrets, and mysteries.",
        answers: ["Norgannon"],
    },
    {
        question: "Lord ______ of Alterac betrayed the Alliance and attempted to assasinate lord Uther.",
        answers: ["Perenolde", "Aieden Perenolde"],
    },
    {
        question: "The Quel'dorei is a term meaning ________ in Thalassian.",
        answers: ["high elves", "high elfs"],
    },
    {
        question: "Lord Kur'talos ________ was the master of the Black Rook Hold.",
        answers: ["ravencrest"],
    },
    {
        question: "________ was the leader of the Darkspear tribe before he was killed by murlocs. A troll village in Durotar is named after him.",
        answers: ["Sen'jin", "Senjin"],
    },
    {
        question: "The Shadow Councill has their base in Hillsbrad Foothills, in the mountains close to Alterac. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is the name of the Archbishop who created the Paladin order of the Silver Hand, together with Uther.",
        answers: ["Alonsus Faol", "Archbishop Alonsus Faol"],
    },
    {
        question: "The domain of air is called The _______ on the Elemental Plane.",
        answers: ["Skywall"],
    },
    {
        question: "The domain of earth is called _______ on the Elemental Plane.",
        answers: ["Deephome"],
    },
    {
        question: "The domain of fire is called The ________ on the Elemental Plane.",
        answers: ["Firelands"],
    },
    {
        question: "The domain of water is called The ___________ on the Elemental Plane.",
        answers: ["Abyssal Maw"],
    },
    {
        question: "The ____________ Cartel is the largest and most successful of the Goblin Cartels in Undermine.",
        answers: ["Steamwheedle"],
    },
    {
        question: "_______________ the naga tribe, is currently dwelling in the northern Darkshore. (hint: This is also a realm name, in both the EU and the US)",
        answers: ["Stormscale"],
    },
    {
        question: "The 'oprah event' is in ___________.",
        answers: ["Kara", "Karazhan"],
    },
    {
        question: "Where can you find Garr?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Baron Geddon?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Agamaggan was an immortal giant _____ which legend say was among the first living creatures to roam Azeroth.",
        answers: ["Boar"],
    },
    {
        question: "Broodlord Lashlayer resides in ____________?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Mal'ganis was killed alongside with a large portion of the Scourge that thought they had achieved victory. (True/False)?",
        answers: ["False"],
    },
    {
        question: "The Lich King is controlled by Kil'Jaeden. (True/False)?",
        answers: ["false"],
    },
    {
        question: "The Lich King and Arthas were fused into a single entity. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Suramar was a keldorei city, which was destroyed by the _____________ during the War of the Ancients.",
        answers: ["Burning Legion"],
    },
    {
        question: "The World of Warcraft official soundtrack is only availible if you purchased the Collector's edition. (True/False)?",
        answers: ["False"],
    },
    {
        question: "The Sha'tar resides in _______________.",
        answers: ["Shattrath City", "Shattrath"],
    },
    {
        question: "The __________ clan in blade's edge mountain was killed by the Shadowmoon clan, who were led by Ner'zhul.",
        answers: ["Thunderlord"],
    },
    {
        question: "Vek'nilash is the third boss in SSC. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is the name of the populare addon which has a database of every thing you have picked, since you had the addon?",
        answers: ["Gatherer"],
    },
    {
        question: "Guess the Zone: This zone is very nature-looking, and has light-green crystals glowing all over the place.",
        answers: ["Terokkar", "Terokkar forest"],
    },
    {
        question: "The zone northwest of Terokkar Forest is known as ______________.",
        answers: ["Zangarmarsh"],
    },
    {
        question: "The shattered floating remnants of the red world is also known as __________.",
        answers: ["Outland", "The Outland"],
    },
    {
        question: "World of Warcraft has a total of _____ million subscribers at the moment.",
        answers: ["9", "nine"],
    },
    {
        question: "Guess the Zone: This zone is a giant farm land, and is nearly controlled solely by the Defias Brotherhood.",
        answers: ["Westfall"],
    },
    {
        question: "Guess the Zone: Gruul's son Durn patrols around the enormeous crystal in this zone.",
        answers: ["Nagrand"],
    },
    {
        question: "Guess the Zone: This zone has Eco Domes, and is known for its large population of blood elves. This zone features four instances.",
        answers: ["Netherstorm", "The Netherstorm"],
    },
    {
        question: "Guess the Zone: This zone is known for the Camp of Boom, and The Vortex Fields.",
        answers: ["Netherstorm"],
    },
    {
        question: "Guess the Zone: This zone contains the Pools of Aggonar, the Void ridge, and the Path of Glory. This zone features four instances.",
        answers: ["Hellfire peninsula"],
    },
    {
        question: "Guess the Zone: The first time you will probably meet the Mag'har. A zeppelin has crashed here. This is the best place to gather fel iron.",
        answers: ["Hellfire Peninsula"],
    },
    {
        question: "Guess the Zone: You can visit the legendary Archmage, Khadgar, here. This zone features four instances.",
        answers: ["Terokkar Forest", "Terokkar"],
    },
    {
        question: "Guess the Zone: The world pvp event in this zone is to capture two beacons and to flag the graveyard.",
        answers: ["Zangarmarsh"],
    },
    {
        question: "Guess the Zone: 'This zone is a grim spectacle of demonic magic run amok. Day and night, molten fel energy erupts from the land and lights the sky with bilious green flame'",
        answers: ["Shadowmoon", "Shadowmoon Valley"],
    },
    {
        question: "Guess the Zone: Felguards, infernal's and other demonic beings ravages this zone. You can encounter the Shadow Councill here.",
        answers: ["Shadowmoon", "Shadowmoon valley"],
    },
    {
        question: "Guess the Zone: Before TBC came out, this zone featured the populare stat potions, the ones which gives the player +25 to a stat. With the recent development with the guardian and battle elixirs, these potions is not used anymore.",
        answers: ["Blasted Lands"],
    },
    {
        question: "Guess the Zone: This zone was originally the Black Morass, but has changed name since then, due to the changes in the environment. This zone features a dragon which drops spheres, which in turn can be turned in for loot.",
        answers: ["Blasted Lands"],
    },
    {
        question: "Guess the Zone: This zone is located north of the Redridge Mountains, and features the two first 40man instances ever created by Blizzard.",
        answers: ["Burning Steppes"],
    },
    {
        question: "Guess the Zone: This zone features the Altar of Storms. This zone has plenty of dragon whelps and ogres. Herbers can find dreamfoil and black lotuses here.",
        answers: ["Burning Steppes"],
    },
    {
        question: "Guess the Zone: This zone features Karazhan, and is a relatively small zone. This place is known for its ogres that is perfect to grind, for both experience, and for runecoth.",
        answers: ["Deadwind Pass"],
    },
    {
        question: "Guess the Zone: The town in this zone is speculated to be Sunnyglade, but later renamed due to the events that has transpired in this zone. This zone features the Scourge, and a lot of worgens.",
        answers: ["Duskwood"],
    },
    {
        question: "Guess the Zone: This zone is 'famous' for the rumored 'Schythe of Elune'. The zone features an emerald dream portal, and is one of the four zones where the Emerald Dragons spawns in. (One in each of the four zones)",
        answers: ["Duskwood"],
    },
    {
        question: "Guess the Zone: This zone contains the Tower of Azora, and the Westbrook Garrison. The zone's inhabitants are mainly gnolls, bandits, and murlocs.",
        answers: ["Elwynn Forest", "Elwynn"],
    },
    {
        question: "Guess the Zone: This zone contains the capital city of one of the Alliance races. The zone features no instances, but has a famous gnoll named.. Hogger!",
        answers: ["Elwynn Forest", "Elwynn"],
    },
    {
        question: "Guess the Zone: This zone features the quest 'Hillary's necklace'. The zone's inhabitants are mostly orcs and gnolls. The alliance town in this region lies on the shores of Lake Everstill.",
        answers: ["Redridge Mountains", "Redridge"],
    },
    {
        question: "Guess the Zone: The Tower of Ilgalar is here, though it is currently controlled by the evil Mage, Morganth. Gnolls and spiders are just a small part of the many local inhabitants of the zone.",
        answers: ["Redridge Mountains", "Redridge"],
    },
    {
        question: "Guess the Zone: This zone was the primary center of the Gurubashi Empire, a long time ago. The zone is known to be a paradise for gankers. A lot of beasts live here.",
        answers: ["Stranglethorn Vale", "STV"],
    },
    {
        question: "Where is Rexxar, in Azeroth?",
        answers: ["Desolace"],
    },
    {
        question: "Guess the Zone: This zone features the 'Tiny Emerald Whelpling' pet. There is only one instance in this zone. This zone is actually quite similar to Black Morass.",
        answers: ["Swamp of Sorrows"],
    },
    {
        question: "Guess the Zone: Murlocs, crocolisks, spiders and lost one's occupies this zone. You can find much blindweed and goldthorn here, and therefor is a populare spot to grind the mats for arcane elixirs.",
        answers: ["Swamp of Sorrows"],
    },
    {
        question: "Guess the Zone: The zone lies south of Darkshore, and is the ancestral homeland of the night elves. They still remain in control of several holdings throughout the zone, such as Maestra's Post, and the Shrine of Aessina.",
        answers: ["Ashenvale"],
    },
    {
        question: "Guess the Zone: The Furbolgs, and satyrs are some of the local inhabitants of this zone. It was a populare world pvp zone before the expansion came out. This zone also features an Emerald Dream portal.",
        answers: ["Ashenvale"],
    },
    {
        question: "Guess the Zone: Nagas, ghosts, and satyrs are some of the local inhabitants in this zone. The zone was named after the former kaldorei Queen, which is now the leader of the naga's.",
        answers: ["Azshara"],
    },
    {
        question: "Guess the Zone: One of the best zones for farming Dreamfoil and Mountain Silversage. This zone also features the Hydraxian Waterlords faction. The zone is also known to be one of best-looking zones in World of Warcraft.",
        answers: ["Azshara"],
    },
    {
        question: "Guess the Zone: This zone is low on history due to being a out-of-the-way location, but the dranei capital city lies here. A quest chain named 'The Prophecy of Akida' in this zone is widely regarded to be one of the funniest quest chains in WoW.",
        answers: ["Azuremyst", "Azuremyst Isle", "The Azuremyst Isle"],
    },
    {
        question: "Guess the Zone: Several large kaldorei cities once stood in this zone. This zone has one instance, and is mostly about corrupted Druids. A quest chain in this zone wants you to hunt raptors all over the place becuase they stole some silver.",
        answers: ["Barrens", "The Barrens"],
    },
    {
        question: "Guess the Zone: The zone has some well known area's, such as the Fray Island, the Stagnant Oasis, and the Fields of Giants. This zone also features a lot of 'hunting' quests.",
        answers: ["Barrens", "The Barrens"],
    },
    {
        question: "Guess the Zone: This zone is filled with red glowing crystals. This place is also quite low on history, just like the Azuremyst Isle. The zone was formerly known as Silvergale.",
        answers: ["Bloodmyst", "Bloodmyst Isle", "The bloodmyst Isle"],
    },
    {
        question: "Guess the Zone: This zone has a micro-dungeon named 'The Vector Coil'. As the area suggest, The Vector Coil contains the vector coil of the dranei ship that crashed. An eredar here called Sionas, and is harvesting power from the coil itself.",
        answers: ["Bloodmyst", "Bloodmyst Isle", "The bloodmyst Isle"],
    },
    {
        question: "Guess the Zone: The night elfs controls this zone. The night elf sentinels patrols the road from Auberdine in this zone till Ashenvale to the south. A quest-chain here is to free the furbolgs from a satyr's corruption.",
        answers: ["Darkshore"],
    },
    {
        question: "Guess the Zone: The Twilight Hammer has plenty of people in this zone. The Cult of the Dark strand also operates here. An Old God is rumored to have fallen in the Master's Glaive area of this zone. Onu refers to it as a 'Old God of the earth'.",
        answers: ["Darkshore"],
    },
    {
        question: "Guess the Zone: This zone has been savaged by centaur's seaseless aggressions. The Kolkar, the Gelkis, the Magram, and the Maraudine centaurs fight each other as much as they do against the Horde and the Alliance of this zone.",
        answers: ["Desolace"],
    },
    {
        question: "Guess the Zone: The Burning Blade's in this zone increases the risk of a region-wide demonic infestation, due to all the demonic beings they have summoned. The naga presence in the northwest of this zone also causes concern.",
        answers: ["Desolace"],
    },
    {
        question: "Guess the Zone: This zone is named after Thrall's father, to honor him. The inhabitants of this zone is mostly harpies, makruras, quillboars, and tigers.",
        answers: ["Durotar"],
    },
    {
        question: "Guess the Zone: This place contains the stonemaul ogres. One of the famous characters in this zone is Jaina Proudmoore. The zone contains creatures such as nagas, turtles, crocolisks, and spiders.",
        answers: ["Dustwallow marsh"],
    },
    {
        question: "Guess the Zone: Sharks, dragonspawns, and raptors are some of the local inhabitants of this zone. This zone features a very popular pre-tbc instance, and the end boss of this instance has been 2manned.",
        answers: ["Dustwallow marsh"],
    },
    {
        question: "Guess the Zone: Lord Illidan Stormrage obtained the skull of gul'dan here. This place is known for its corruption, which were caused by the Burning Legion. The Shadow Councill has a base of operations in this zone.",
        answers: ["Felwood"],
    },
    {
        question: "Guess the Zone: This is the best zone to gather gromsblood in. You can also find lots of dreamfoil, and plaguebloom here. Some gold farmers farmed the angerclaw bears in this zone for money, pre-tbc due to their quick respawn.",
        answers: ["Felwood"],
    },
    {
        question: "Guess the Zone: This zone holds many ancient ruins. The zone is famous for its ancient night elf city, which is now a instance. The zone is also one of the four locations which contain an emerald portal.",
        answers: ["Feralas"],
    },
    {
        question: "Guess the Zone: Faeri dragons, and gnolls are two of the local inhabitants in this zone. The endgame guilds used to grind the raw meat of the Chimaeras in this zone in order to make the famous food, Dirge's Kickin' Chimaerok Chops.",
        answers: ["Feralas"],
    },
    {
        question: "Guess the Zone: This zone contains the old world tree, and is currently unaccessible without special means.",
        answers: ["Mount Hyjal"],
    },
    {
        question: "Guess the Zone: This zone is a haven for Druids and is the home of the Cenarion Circle. The conflict between the Alliance and the Horde is not tolerated by the protectors of this zone. This zone also features Omen during the Lunar Festival.",
        answers: ["Moonglade"],
    },
    {
        question: "Guess the Zone: This zone is known for its nature-loving tribe people. This zone features a huge variety of animals. The Venture Co and the dwarves has intruded into this zone.",
        answers: ["Mulgore"],
    },
    {
        question: "Guess the Zone: This zone contains the Bael'Dun Digsite, where dwarves scour the mountains for traces of their shrouded ancestry. Peacebloom and silverleaf is the local herbs around here. There is plenty of harpies in this zone.",
        answers: ["Mulgore"],
    },
    {
        question: "Guess the Zone: This zone contains two high-end instances and was the location of a server wide event, more commonly known as the AQ War Effort. This zone also features extremely many insects.",
        answers: ["Silithus"],
    },
    {
        question: "Guess the Zone: The wildlife here are mostly insects, snakes, and spiders. This zone has a world pvp event, and had many populare grinding places pre-tbc. The Cenarion Cirlce defends the local town here.",
        answers: ["Silithus"],
    },
    {
        question: "Guess the Zone: This zone has huge problems with 'The Venture Co', who is trying to harvest the local forest here for profit. The Alliance can get here via the Talondeep Path.",
        answers: ["Stonetalon Mountains"],
    },
    {
        question: "Guess the Zone: The inhabitants here are mostly harpies, goblins and fire elementals. You can mainly find copper veins here as a miner, with some occasional tin veins. One of the quests in this zone wants you to kill Besseleth, a huge spider.",
        answers: ["Stonetalon Mountains"],
    },
    {
        question: "Guess the Zone: This zone contains one of the most liked mid level instances. This zone also contains a unaccessible location known as Uldum (very similar to Uldaman).",
        answers: ["Tanaris"],
    },
    {
        question: "Guess the Zone: Furbolgs, grells, and nightsabers are some of the local inhabitants. This place is a nightmare for miners and for the Horde, as it's a hard zone to reach. This place is also the starting zone for one of the Alliance races.",
        answers: ["Teldrassil"],
    },
    {
        question: "Guess the Zone: Dolanaar, and Starbreeze Village are some of the villages in this zone. You can find up to swiftthistle here as a herbalist, but not even one copper vein here as miner.",
        answers: ["Teldrassil"],
    },
    {
        question: "Guess the Zone: A area in this zone is just as dangerous as Stranglethorn Vale, in terms of ganking, if not even more. Both the Alliance and the Horde goes here. This zone contains silithids, water elementals, turtles and wyverns.",
        answers: ["Thousand Needles"],
    },
    {
        question: "Guess the Zone: Kobolds, earth elementals, carrion birds and wind serpents live here. The zone also features the Grimtotem clan. Tanaris lies north of this zone.",
        answers: ["Thousand Needles"],
    },
    {
        question: "Guess the Zone: 'The night elf army was pushed back to this location. Something here prevented the Qiraji from being able to take the land. I do not quite understand this word but i belive it to mean 'God Lands'.'",
        answers: ["Un'Goro", "Un'Goro Crater"],
    },
    {
        question: "Guess the Zone: Dreamfoil, and mountain silersage can be gathered here, as a herbalist. The fire elementals in this region is a popular grinding place for fire essences. Stegodons, gorillas, and bloodpetals are some of the local inhabitants.",
        answers: ["Un'Goro", "Un'Goro Crater"],
    },
    {
        question: "Guess the Zone: Both the Steamwheedle Cartel and the night elfs has established a base in this region. The zone is rich on thorium veins for miners. The zone has quite a wildlife aswell, with its blue dragons, bears, and owls.",
        answers: ["Winterspring"],
    },
    {
        question: "Guess the Zone: The Eye of Shadow was grinded quite often in this zone, before the expansion came. As Alliance you can obtain the 'Reins of the Winterspring Frostsaber' in this zone.",
        answers: ["Winterspring"],
    },
    {
        question: "What is the highest speed you can obtain with a flying mount?",
        answers: ["492%", "492"],
    },
    {
        question: "The epic frost resistance gear for Warriors is called _________. Guilds usually create them for Naxxramas.",
        answers: ["Icebane"],
    },
    {
        question: "How many people can you enter Tempest Keep with?",
        answers: ["25"],
    },
    {
        question: "How many people can you enter Karazhan with?",
        answers: ["10", "ten"],
    },
    {
        question: "The famous '______ on a stick' is widely known by nearly everyone in World of Warcaft.",
        answers: ["Carrot"],
    },
    {
        question: "The rare trinket that is obtainable by doing quests with the Netherwing faction, is called '________ Whip'.",
        answers: ["Skybreaker"],
    },
    {
        question: "Where can you find Lucifron?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Magmadar?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Gehennas?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where is 'Edge of Madness'?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Shazzrah?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Golemagg the Incinerator?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Sulfuron Harbringer?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Majordomo Executus?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find the Old God's Lieutenant, Ragnaros?",
        answers: ["Molten Core", "MC"],
    },
    {
        question: "Where can you find Bloodlord Mandokir?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Gahz'ranka?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Thekal?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Venoxis?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Arlokk?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Jeklik?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Mar'li?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Jin'do the Hexxer?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Hakkar the Soulflayer?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Gri'lek?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Hazza'rah?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Where can you find Wushoolay?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "Name the infamous troll player which leveled to 70 without using weapons or armors.",
        answers: ["Gutrot"],
    },
    {
        question: "Where can you find Razorgore the Untamed?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Vaelastrasz the Corrupt?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Firemaw?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Ebonroc?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Flamegor?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Nefarian?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "Where can you find Master Elemental Shaper Krixix?",
        answers: ["Blackwing Lair", "BWL"],
    },
    {
        question: "In what zone lies The Ruins of Ahn'Qiraj?",
        answers: ["Silithus"],
    },
    {
        question: "In what zone lies The Temple of Ahn'Qiraj?",
        answers: ["Silithus"],
    },
    {
        question: "In what zone lies Blackwing Lair?",
        answers: ["Searing Gorge", "Burning steppes"],
    },
    {
        question: "Where can you find The Prophet Skeram?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find the 'Bug Family' (Kri, Yauj, Vem)?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find Battleguard Sartura?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find Fankriss the Unyielding?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find Viscidus?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find Princess Huhuran?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find the Twin Emperors?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Who is the brother of Vek'nilash?",
        answers: ["Vek'lor"],
    },
    {
        question: "Who is the brother of Vek'lor?",
        answers: ["Vek'nilash"],
    },
    {
        question: "Where can you find Ouro?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "Where can you find C'thun?",
        answers: ["The temple of Ahn'Qiraj", "AQ40", "AQ 40"],
    },
    {
        question: "The war between the Qiraji and the rest of kalimdor was called 'The war of the ______ ______'.",
        answers: ["Shifting sands"],
    },
    {
        question: "Where can you find Ayamiss the Hunter?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "Where can you find Buru the Gorger?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "Where can you find General Rajaxx?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "Where can you find Kurinaxx?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "Where can you find Moam?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "Where can you find Ossirian the Unscarred?",
        answers: ["Ruins of Ahn'Qiraj", "AQ20", "AQ 20"],
    },
    {
        question: "In what content patch was Ahn'Qiraj released?",
        answers: ["1.9"],
    },
    {
        question: "Northrend will certainly feature 'The Venture Co'. (True/False)?",
        answers: ["true"],
    },
    {
        question: "In what content patch was Naxxramas released?",
        answers: ["1.11"],
    },
    {
        question: "Where can you find Anub'Rekhan?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Grand Widow Faerlina?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Mr.Bigglesworth?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Maexxna?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Noth?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Heigan?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Loatheb?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Razuvious?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Gothik?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find The Four Horsemen?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Patchwerk?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Grobbulus?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Gluth?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Thaddius?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Sapphiron?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Where can you find Kel'Thuzad?",
        answers: ["Naxx", "Naxxramas"],
    },
    {
        question: "Who is Highlord Mograine's son?",
        answers: ["Renault", "Renault Mograine"],
    },
    {
        question: "You can find agents of Argent Dawn in Outland. (True/False)?",
        answers: ["False"],
    },
    {
        question: "What is the firstname of the Scarlet Crusade's Ambassador, which was sent to discuss the Scourge Invasion?",
        answers: ["Marjhan"],
    },
    {
        question: "How many Outland factions exists at the moment?",
        answers: ["15", "fifteen"],
    },
    {
        question: "How many Azeroth factions exists at the moment?",
        answers: ["29", "twentynine"],
    },
    {
        question: "The night elves were once called the ________.",
        answers: ["Kaldorei"],
    },
    {
        question: "Some of the kaldorei's were transformed into naga's during the accident with the ____________________",
        answers: ["well of eternity"],
    },
    {
        question: "The Well of Eternity left a permanent storm known as 'The __________'.",
        answers: ["Maelstrom"],
    },
    {
        question: "The makrura is rumored to have a city named _______.",
        answers: ["Mak'aru"],
    },
    {
        question: "The  _______ speaks in nerglish and are a race of humanoid lobsters who are constantly in war with the naga.",
        answers: ["Makrura"],
    },
    {
        question: "It is rumored that ______ are the offsprings of gronns.",
        answers: ["Ogre", "Ogres"],
    },
    {
        question: "What is the name of the radio who produces shows such as 'EPIC', 'Blue plz', 'vendor trash', and others?",
        answers: ["wcradio", "wowradio"],
    },
    {
        question: "______ did the world first on Azgalor the pitlord.",
        answers: ["Curse"],
    },
    {
        question: "What is the name of the guild which did the world first on Nefarian? (hint: Something that happens quite often in guilds is the guildname of this guild)",
        answers: ["Drama"],
    },
    {
        question: "Death & Taxes did the world first on _______ in Karazhan.",
        answers: ["Nightbane"],
    },
    {
        question: "Ascent did the world first on __________.",
        answers: ["Ragnaros"],
    },
    {
        question: "What guild did the world first on Kel'Thuzad?",
        answers: ["Nihilum"],
    },
    {
        question: "What guild did the world first on The Four Horsemen?",
        answers: ["Deathandtaxes", "Death & Taxes", "Death&Taxes"],
    },
    {
        question: "If you go where you are not supposed to (like, Mount Hyjal, which is not finished) you get a debuff called _______________ which teleports you away.",
        answers: ["no mans land", "no man's land"],
    },
    {
        question: "There is ______ holiday events in world of warcraft.",
        answers: ["ten", "10"],
    },
    {
        question: "What is the name of the player which got to 1-60 in 4 days and 20 hours before TBC came, and made a guide about it?",
        answers: ["Joana"],
    },
    {
        question: "What is the name of the player who is famous for his leveling guides? (from 20-60 on both factions)",
        answers: ["Jame"],
    },
    {
        question: "How many characters can you have per realm?",
        answers: ["ten", "10"],
    },
    {
        question: "The homeland of the goblins is called what?",
        answers: ["Kezan"],
    },
    {
        question: "The goblin's capital city is called?",
        answers: ["Undermine", "The Undermine"],
    },
    {
        question: "How many troll empires has been known to exists?",
        answers: ["three", "3"],
    },
    {
        question: "How many troll tribes is known to exists?",
        answers: ["18", "eighteen"],
    },
    {
        question: "Where can you find Attunmen & Midnight?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Maiden of Virtue?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Curator?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Terestian Illhoof?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find the shade of Aran?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Netherspite?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Nightbane?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Hyakiss the Lurker?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Rokad the Ravager?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Shadikith the Glider?",
        answers: ["Karazhan", "KZ", "Kara"],
    },
    {
        question: "Where can you find Hydross?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "Where can you find 'The Lurker Below'?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "Where can you find Leotheras?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "Where can you find Karathress?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "Where can you find Morogrim Tidewalker?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "Where can you find Vashj?",
        answers: ["Serpentshrine Cavern", "SSC"],
    },
    {
        question: "When does the Harvest Festival start, in September?",
        answers: ["September 24th", "24th september", "24th", "24"],
    },
    {
        question: "When does the Feast of Winter Veil start, in December?",
        answers: ["December 22th", "22th December", "22th", "22"],
    },
    {
        question: "When does the Lunar Festival start, in February?",
        answers: ["February 16th", "16th February", "16th", "16"],
    },
    {
        question: "When does 'Love is in the Air' start, in February?",
        answers: ["February 11th", "11th February", "11th", "11"],
    },
    {
        question: "When does Noblegarden start, in April?",
        answers: ["April 15th", "15th April", "15th", "15"],
    },
    {
        question: "When does the Children's Week start, in May?",
        answers: ["May 22th", "22th May", "22th", "22"],
    },
    {
        question: "When does the Midsummer Fire Festival start, in June?",
        answers: ["June 21th", "21th June", "21th", "21"],
    },
    {
        question: "Where can you find Rage Winterchill?",
        answers: ["Battle for Mount Hyjal", "Hyjal", "Hyjal Summit"],
    },
    {
        question: "Where can you find Anetheron?",
        answers: ["Battle for Mount Hyjal", "Hyjal", "Hyjal Summit"],
    },
    {
        question: "Where can you find Kaz'rogal?",
        answers: ["Battle for Mount Hyjal", "Hyjal", "Hyjal Summit"],
    },
    {
        question: "Where can you find Azgalor?",
        answers: ["Battle for Mount Hyjal", "Hyjal", "Hyjal Summit"],
    },
    {
        question: "Where can you find Archimonde?",
        answers: ["Battle for Mount Hyjal", "Hyjal", "Hyjal Summit"],
    },
    {
        question: "Where can you find Al'ar?",
        answers: ["The Eye", "Tempest keep"],
    },
    {
        question: "Where can you find Void Reaver?",
        answers: ["The Eye", "Tempest keep"],
    },
    {
        question: "Where can you find Solarian?",
        answers: ["The Eye", "Tempest keep"],
    },
    {
        question: "Where can you find Kael'thas Sundstrider?",
        answers: ["The Eye", "Tempest keep"],
    },
    {
        question: "Where can you find Naj'entus?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find Supremus?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find the Shade of Akama?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find Teron Gorefiend?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find Gurtogg Bloodboil?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find the Reqliquary of Souls?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find Mother Shahraz?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find the Illidari Council?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Where can you find Illidan Stormrage?",
        answers: ["Black Temple", "BT", "Black Temple"],
    },
    {
        question: "Guess the Zone: This zone has lava elementals, spiders, and incendosaurs as its inhabitants. One of the quests in this zone is called 'What the Flux?'.",
        answers: ["Searing Gorge"],
    },
    {
        question: "Guess the Zone: This zone has air elementals, crabs, blood elves, naga, and furbolgs as some of its inhabitants. Arcane storms strikes this peaceful zone, which lies west of darkshore.",
        answers: ["Azuremyst Isle", "Azuremyst"],
    },
    {
        question: "Guess the Zone: 'Here, young orcs, tauren, and trolls study Shamanism, Hunting, and the Ways of the Warrior'.",
        answers: ["Durotar"],
    },
    {
        question: "Guess the Zone: The zone has the famous Serpent Lake, where four instances lies. The zone is also famous for one of its inhabitants, the Sporelings.",
        answers: ["Zangarmarsh"],
    },
    {
        question: "Guess the Zone: This zone contains all kinds of elementals, from water to fire, from earth to air. When players try to explain this place, they often say its quite similar to Mulgore.",
        answers: ["Nagrand"],
    },
    {
        question: "Guess the Zone: The zone is known for its local inhabitants, the wild talbuks and clefthoofs especially. Alot of ogres and gronns also live here.",
        answers: ["Nagrand"],
    },
    {
        question: "Guess the Zone: This zone is known to be the 'Feralas of the Outland'. The local inhabitants in this zone are mainly the blood elves and the arrakoa. A NPC in this zone named Griftah is a well known scammer.",
        answers: ["Terokkar forest", "Terokkar"],
    },
    {
        question: "Guess the Zone: The Mok'Nathals live in this zone. The inhabitants here are mostly ogres, and etherals. The formula for +40 spell damage drops in this zone. ",
        answers: ["Blades Edge Mountains", "Blade's Edge Mountains"],
    },
    {
        question: "This zone has plenty of chimaeras, and ethereals as its inhabitants. There is one raid instance in this zone. You can find Rexxar in the Horde town of this place.",
        answers: ["Blades Edge Mountains", "Blade's Edge Mountains"],
    },
    {
        question: "When does Hallow's End start, in october?",
        answers: ["18", "eighteenth", "18th"],
    },
    {
        question: "Where can you find Renataki?",
        answers: ["Zul'Gurub", "ZG", "Zul Gurub"],
    },
    {
        question: "The trolls in Zul'Aman are obviusly from the Amani empire, right? (True/False)?",
        answers: ["True"],
    },
    {
        question: "What is Cenarius?",
        answers: ["A demigod", "Demigod", "A demi-god"],
    },
    {
        question: "Who sells Soap on a Rope, in Shattrath?",
        answers: ["Griftah"],
    },
    {
        question: "What foe will you face the most in the expansion? (ex. Amani Empire)",
        answers: ["Scourge", "the Scourge"],
    },
    {
        question: "How many new zones is comming with the expansion?",
        answers: ["10", "Ten"],
    },
    {
        question: "Guess the Zone: This zone will be revamped in patch 2.3, and will feature the new goblin town, Mudsprocket. 'The Missing Diplomat' quest-chain has been countinued aswell. A total of 60 new quests has been added to the zone.",
        answers: ["Dustwallow Marsh"],
    },
    {
        question: "In patch 2.3 the dragons outside Onyxia's lair will no longer be elite. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Sholazar Basin will be one of the largest zones in Northrend.",
        answers: ["false"],
    },
    {
        question: "The Borean Tundra and the ____________ will probably be the largest zones in Northrend.",
        answers: ["The Dragonblight", "Dragonblight"],
    },
    {
        question: "Lake Wintergrasp will feature a lot of ____________, because of the pvp-only uniqueness the zone has. (hint: Annother name of 'Outdoor PvP')",
        answers: ["world pvp"],
    },
    {
        question: "The Borean Tundra will feature the Riplash Ruins, which lies near the end of the zone to the south. It has nerubian architecture but is not occupied by them anymore. What group is currently inhabiting it?",
        answers: ["The naga", "The nagas", "naga", "nagas"],
    },
    {
        question: "What is the naga's also known as? (like, Archimonde the Defiler)",
        answers: ["The terror of the tides", "Terror of the tides", "The naga, Terror of the Tides"],
    },
    {
        question: "____________ watches over the Dragonblight together with his dragonflight, to make sure that the remains are undisturbed.",
        answers: ["Malygos", "Malygos the Spell-Weaver", "Malygos the Spell Weaver"],
    },
    {
        question: "The Grizzly Hills in Northrend has how many furbolg tribes?",
        answers: ["4", "four"],
    },
    {
        question: "What is the furbolg capital in The Grizzly Hills called?",
        answers: ["Grizzlemaw", "The Grizzlemaw"],
    },
    {
        question: "How many furbolg tribes are known to exist?",
        answers: ["14", "fourteen"],
    },
    {
        question: "What new proffesion will be introduced in the expansion?",
        answers: ["Inscription"],
    },
    {
        question: "What heroic class will be the first released?",
        answers: ["Death knight", "The Death Kngiht"],
    },
    {
        question: "What is the name of the undead settlement in Howling Fjord?",
        answers: ["New Agamand"],
    },
    {
        question: "The taunka's were thought to be lost untill they were discovered by ___________________ and his orcs when they landed in Northrend. (the full name)",
        answers: ["Garrosh Hellscream"],
    },
    {
        question: "The taunka are an ancient offshot of the _________.",
        answers: ["Tauren", "Taurens"],
    },
    {
        question: "The tuskarrs are a humanoid _______ race who live in Northrend.",
        answers: ["Walrus"],
    },
    {
        question: "A race of humanoid spiders, is also known as the __________.",
        answers: ["Nerubians"],
    },
    {
        question: "_________ was the former king of Azjol-Nerub. He now leads the undead nerubians.",
        answers: ["Anub'Arak"],
    },
    {
        question: "The 'Knights of the Silver Hand' will make their return in the expansion. They are lead by the previously exiled Highlord ______ Fordring, which you can encounter ingame in the Eastern Plaguelands.",
        answers: ["Tirion"],
    },
    {
        question: "In what zone lies Utgarde Keep?",
        answers: ["Howling Fjord"],
    },
    {
        question: "The inhabitants of Utgarde Keep is known as the _______ and are formidable warriors. They are bent on proving their strength to the Lich King, who will only raise the most worthy of their warriors to serve him beyond the grave.",
        answers: ["Vrykuls", "Vrykul's"],
    },
    {
        question: "It is expected that atleast one instance in the Utgarde Keep will feature some _________.",
        answers: ["Undeads", "Scourge"],
    },
    {
        question: "Alliance can expect to finally see ______ Bronzebeard, the famous explorer. He will be critical in order to uncover the real truth of Azeroth.",
        answers: ["Brann"],
    },
    {
        question: "The dwarves will discover the origin of life on Azeroth in the expansion. (True/False)?",
        answers: ["true"],
    },
    {
        question: "The second instance in Utgarde Keep is called 'Utgarde _______', and is planned to be a level 80 5-man instance.",
        answers: ["Pinnacle"],
    },
    {
        question: "Utgarde Keep will have a raiding instance that is similar to AQ in size. In here you will face the Utgarde Keep Champion, Gutrot Keleseth, as the last boss. He will fight with his fists just like the real Gutrot did, and wear no armor. (True/False)?",
        answers: ["False"],
    },
    {
        question: "Utgarde Keep will be quite similar to the Hellfire Citadel. (True/False)?",
        answers: ["True"],
    },
    {
        question: "The nexus has two 5man instances, and one 25man raid instance. In the raid instance you will face Malygos, also known as The Spell-Weaver. (True/False)?",
        answers: ["true"],
    },
    {
        question: "The nexus is located in __________, the home of Malygos.",
        answers: ["Coldarra"],
    },
    {
        question: "A scroll that was found in a Northrend ruin mentioned a spell that can remove the ________ from a huge number of undead creatures at the same time, putting the undead creatures permanently to rest.",
        answers: ["Undeath"],
    },
    {
        question: "A 5man instance in The Nexus is called '____ Caverns'.",
        answers: ["ice"],
    },
    {
        question: "The 25man raid instance in ____________ will be similar to Onyxia and Gruul. Here you will battle Malygos, the Dragon Aspect of Magic.",
        answers: ["The Nexus"],
    },
    {
        question: "Where is Ulduar located, in Northrend?",
        answers: ["The Storm Peaks"],
    },
    {
        question: "Ulduar is a titan ____.",
        answers: ["City"],
    },
    {
        question: "It is rumored that it's probably in ________ that dwarves will learn the truth about Azeroth. In short, very much lore in it.",
        answers: ["Ulduar"],
    },
    {
        question: "It is rumored that ________ has a great titan city, just like Ulduar.",
        answers: ["Uldum"],
    },
    {
        question: "One of Azjol'Nerubs many mystery's is the __________ Ones.",
        answers: ["faceless"],
    },
    {
        question: "It is not sure yet if ____________ will be killable or not.",
        answers: ["Lich King", "The Lich King"],
    },
    {
        question: "The seat of power of the Scourge, is the Frozen Throne. The Frozen Throne lies in the ________________.",
        answers: ["Icecrown glacier", "The Icecrown glacier"],
    },
    {
        question: "____________ is the new leader of Dalaran in the expansion.",
        answers: ["Rhonin"],
    },
    {
        question: "Dalaran has been 'transported' to Northend and is a ________ town, even to the Horde.",
        answers: ["neutral"],
    },
    {
        question: "________ in Northrend, will have one or two instances, just like Stormwind and Orgrimmar.",
        answers: ["Dalaran"],
    },
    {
        question: "_________ Runeweaver is the current leader of Dalaran.",
        answers: ["Ansirem"],
    },
    {
        question: "____________ will be retuned into a level 80 instance with appropiate loot, and be the entry-raid instance in the expansion. The attunement will be removed aswell.",
        answers: ["Naxxramas"],
    },
    {
        question: "Caverns of Time: Culling of _______  is the new instance in CoT that will be added in the expansion. It will be a level 80 5-man instance that will be centered around helping Prince Arthas purge the plague infected populace of this place.",
        answers: ["Stratholme"],
    },
    {
        question: "What is the name of the capital city that the ice trolls, also known as the Zul'Drak empire, has in Northrend?",
        answers: ["Gundrak"],
    },
    {
        question: "The Bloodmar is a community of magnataurs. They are currently building their numbers and gathering resources in preperation for war on the other races close to their border. They are led by the mighty Grom'Thar the _______.",
        answers: ["Thunderbringer"],
    },
    {
        question: "The Drak'Tharon Keep is a fort where Arthas stayed while searching for ______________, and is located in the Grizly Hills.",
        answers: ["Frostmourne"],
    },
    {
        question: "The Drak'Tharon Keep originally belonged to the _________ trolls, but the Scourge drove them out and took their possesions, aswell as the fort. The Scourge now have a garrison here, which is holding the mountain passes.",
        answers: ["Drakkari"],
    },
    {
        question: "The ____________ Keep is easily defended. It is said that the small group of scourge that is garrisoned there can easily hold the keep against forces ten times its size, especially since they dont need nourishment, like food or water.",
        answers: ["Drak'Tharon"],
    },
    {
        question: "The Death Knight will just be the first of several upcomming ______ class. The current plan is to release one  _____ class per expansion pack.",
        answers: ["hero"],
    },
    {
        question: "The Death Knight will start at a high level, around level __-60 is the current plan.",
        answers: ["55"],
    },
    {
        question: "The Death Knights cant use shields. (True/False)?",
        answers: ["true"],
    },
    {
        question: "The Death Knight uses ______ as their source of 'mana'. The _______ on their runeblades have charges, so they dont have unlimited mana precisely. Once thouse charges are out, they need to regenerate in order to get their abilities and spells back.",
        answers: ["runes"],
    },
    {
        question: "Proffesions will have _____ skill points as limit in the expansion.",
        answers: ["450", "four hundred fifty"],
    },
    {
        question: "The riding skills will be _______ skill points as limit in the expansion.",
        answers: ["375"],
    },
    {
        question: "In the expansion you are able to customize your characters with new hair styles and _______. Characters wont be able to have a 'plastic surgery', though. (hint: This can be 'triggered' by writing an emote)",
        answers: ["dances"],
    },
    {
        question: "Blizzard hopes to bring the pvp to annother level with the new zone in the expansion, Lake __________. It will be the only-pvp zone in wow.",
        answers: ["Wintergrasp"],
    },
    {
        question: "The expansion will introduce _____ weapons into the game, and atleast one new battleground.",
        answers: ["siege"],
    },
    {
        question: "The art of Outland is going to return to the 'classical' Warcraft, and that is, ______ fantasy. The Outland art was high fantasy.",
        answers: ["gothic"],
    },
    {
        question: "What is 'the roof of the world' refering to?",
        answers: ["Northrend"],
    },
    {
        question: "In which patch was the voice chat implemented?",
        answers: ["2.2"],
    },
    {
        question: "What is the name of the tuskar's capital city?",
        answers: ["Kaskala"],
    },
    {
        question: "What is the Horde fortress called in Borean Tundra? (hint: Gromm Hellscream's clan)",
        answers: ["Warsong Hold"],
    },
    {
        question: "The tuskarr have allied themselves with the Horde expedition, both because of their cultural similarities (__________ particulary) and to battle the naga who assaults them from the south.",
        answers: ["Shamanism"],
    },
    {
        question: "The tuskarr's considers it a mark of _______ to give help to other tuskarr villages.",
        answers: ["honor"],
    },
    {
        question: "The _____________ received its name because of the wind which races in from the sea on all three sides, producing a constant howl, like a maddened beast seeking its prey.",
        answers: ["Howling Fjord", "The Howling Fjord"],
    },
    {
        question: "Guess the Zone: Both the Horde and the Alliance are steadily assaulted in this zone, by the vrykuls. The ironforge prospectors in this zone has discovered a new race of iron dwarves which may hint to their own ancient origin.",
        answers: ["Howling Fjord", "The Howling Fjord"],
    },
    {
        question: "Guess the Zone: Sylvanas and the Forsaken in this zone has engineered a new plague, and is ready to strike at the Lich King. They have built a new town in this zone, named 'New Agamand'. It's there the testing beings.",
        answers: ["Howling Fjord", "The Howling Fjord"],
    },
    {
        question: "Guess the Zone: This zone is located at the far western edge of Northrend. The naga, and the Scourge are two of the local inhabitants. The Tuskarr are the dominant presence in this zone, and their capital city Kaskala is here aswell.",
        answers: ["Borean Tundra", "The Borean Tundra"],
    },
    {
        question: "Guess the Zone: The Drakkari Trolls, and the Blue Dragonflight occupies this zone, together with many other species. This zone is flat, wide, and cold. A solid sheet of ice covers the zone.",
        answers: ["Borean Tundra", "The Borean Tundra"],
    },
    {
        question: "Guess the Zone: This zone is perhaps the softest of all of the zones in Northrend. The trolls is only a minor nuisance and the Scourge comes here rarely. The Alliance Keep in this zone is called Justice Keep and the Horde town is called Warsong Hold.",
        answers: ["Borean Tundra", "The Borean Tundra"],
    },
    {
        question: "Guess the Zone: The humans of this zone was the first of all to fall victim to the plague. This zone is also a graveyard for dragons. Old dragon's come here in their final hours or days, to rest in peace.",
        answers: ["The Dragonblight"],
    },
    {
        question: "Guess the Zone: Malygos and his Blue Dragonflight guards this zone fiercly. Undead animals also roams this land, attacking any living thing in sight. Travelers should try their best to avoid them.",
        answers: ["The Dragonblight"],
    },
    {
        question: "Guess the Zone: The dragons of this zone, in the Wyrmrest temple, communicate regulary with their kin in Coldarra. This zone also features the Tauren outpost of Icemist village, which has been known for helping strangers in need.",
        answers: ["The Dragonblight"],
    },
    {
        question: "Guess the Zone: The survivors of the fall of Azjol-Nerub has fled to the Sundered Monolith, a nerubian fortress in this zone. No one knows what their role will be in Northrend.",
        answers: ["The Dragonblight"],
    },
    {
        question: "Guess the Zone: This zone is the home of the trolls of the Drakkari empire. Their capital city Gundrak lies is here, aswell. Most people avoids this zone, for good reasons.",
        answers: ["Zul'Drak"],
    },
    {
        question: "Guess the Zone: This zone has excellent wildlife compared to most of the other zones in Northrend. The Scourge has so far not penetrated this zone to any degree, but a war between the Drakkari trolls here and the Scourge might be inevitable.",
        answers: ["Zul'Drak"],
    },
    {
        question: "The leader of the drakkari tribes in Zul'Drak is called 'Frost King _____'.",
        answers: ["Malakk"],
    },
    {
        question: "Guess the Zone: It's in this zone here the grizzlemaw furbolg made their capital city, Grizzlemaw. The grizzlemaw furbolgs claims they where the first people in these hills, just like the Drakkari.",
        answers: ["Grizzly Hills", "The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: The dwarven settlement, Thor Modan, can be found in this zone. It is the ancient home of the iron dwarves. The furbolgs in this zone attacks this place frequently, because they think of the dwarves as graverobbers and trespassers.",
        answers: ["Grizzly Hills", "The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: Drak'Tharon keep lies here. It's origin is from the Drakkari, and is very close to the border of Zul'Drak. The Scourge now occupies this keep, and can easily defend it from intruders.",
        answers: ["Grizzly Hills", "The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: The furbolgs of this zone is not hostile unless someone enters their territory. The furbolgs are suprisingly friendly to travelers, aslong as they dont make any claims on anything in the hills. They are quite simple people actually.",
        answers: ["The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: The wendigo and the sasquatch are some of the local inhabitants in the zone. This zone is full of life, and has many animals, such as wolves, and foxes, and even snow owl's. The Drakkari hunts only rarely in this zone.",
        answers: ["Grizzly Hills", "The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: This zone has a low Scourge presence, only enough to block the northwest corner of the zone. The zone is described as 'It's not a easy land by any stretch, but its handsome and fierce, and full of life'.",
        answers: ["Grizzly Hills", "The Grizzly Hills"],
    },
    {
        question: "Guess the Zone: The Venture Co is deforesting the land in this zone, which is located in Northrend. The furbolgs in this zone probably has some quests regarding them, since they are a shamanistic people. This zone has many animals.",
        answers: ["The Grizzly Hills", "Grizzly Hills"],
    },
    {
        question: "Azjol-Nerub is located underground. (True/False)?",
        answers: ["true"],
    },
    {
        question: "Azjol-Nerub is also known as the ________ Kingdom.",
        answers: ["Spider"],
    },
    {
        question: "Guess the Zone: There is a small dwarven camp named Doorward, inside this zone. Some years ago Arthas attacked it, on his way to the Lich King. Most of the people there were not mortally wounded though. This zone is completly filled with the Scourge.",
        answers: ["Azjol-nerub"],
    },
    {
        question: "Guess the Zone: Brann Bronzebeard claims it might be possible for an Alliance with the surviving nerubians if one is willing to help them clear out the Scourge from their empire. This zone is also knwon as 'The Spider Kingdom'.",
        answers: ["Azjol-Nerub"],
    },
    {
        question: "Guess the Zone: It is said that this zone contains an Old God, and that the mysterius Forgotten Ones and the Faceless Ones and are his servants. Baelgun Flamebeard, the new leader of Doorward, fiercly belives in this and vows to stop them.",
        answers: ["Azjol-Nerub"],
    },
    {
        question: "Just like Un'Goro Crater, ___________ in Northrend is an anomoly.",
        answers: ["Sholazar Basin"],
    },
    {
        question: "Guess the Zone: This zone is a tropical jungle in the midst of Northrend. This zone is tropical, and no one knows why. This zone is quite small compared to other zones in Northrend. It's about the same size as the Crystalsong Forest.",
        answers: ["Sholazar Basin"],
    },
    {
        question: "Guess the Zone: This zone lies northwest of Borean Tundra. The zone contains very hot geysers and steam vents. So hot, that if you put your hands in one of them, your hands flesh would be incinerated instantly. The wildlife here is rich.",
        answers: ["Sholazar Basin"],
    },
    {
        question: "Guess the Zone: A high elf scholar belived that the Titans used the ________________ as a testing ground. If that's true, then some of their experiments might remain. The zone would be a tresure trove of knowledge and power if that is the case.",
        answers: ["Sholazar Basin"],
    },
    {
        question: "Guess the Zone: This zone is located in the north-east of Northrend. The mysterius storm giants live in the famous Titan city of Ulduar in this zone. The winds here are extremely violent and dangerous.",
        answers: ["The Storm Peaks", "Storm Peaks"],
    },
    {
        question: "Guess the Zone: It was here that Aegywynn, the Guardian of Tirisfal battled Sargeras, the lord of the Burning legion. The magnataurs and the wendigos are two of the local inhabitants in this zone.",
        answers: ["The Storm Peaks", "Storm Peaks"],
    },
    {
        question: "Guess the Zone: The Titans used to live here. They even created a city where they worked on their experiments. Many caves exists in this zone, and it is rumored that the titans themselves created them.",
        answers: ["The Storm Peaks", "Storm Peaks"],
    },
    {
        question: "Guess the Zone: This zone contains the largest glacier on Azeroth, and became infamous when Kil'jaeden hurled a certain being into the glacier.",
        answers: ["Icecrown Glacier", "The Icecrown Glacier"],
    },
    {
        question: "Guess the Zone: The Scarlet Crusade succeeded in approaching the stronghold in this zone once, but was in the end repelled by the Scourge. They lost countless men and women. In the end they only became scourge themselves, most probably.",
        answers: ["Icecrown Glacier", "The Icecrown Glacier"],
    },
    {
        question: "Guess the Zone: This zone has the largest scourge presence of them all, as this zone is the heart of the Scourge. Countless people have tried to destroy it from here, but were only added to their ranks in the end.",
        answers: ["Icecrown Glacier", "The Icecrown Glacier"],
    },
    {
        question: "Name the zone which is the only zone so far to be completly devoted to PvP, and nothing else.",
        answers: ["Lake Wintergrasp"],
    },
    {
        question: "Guess the Zone: This zone is basicly a large frozen lake. Sometimes, local taurens and taunka's cut holes in the lake to spear-fish. It is very dangerous to fall down in the lake, as you will be rendered unconscious by the cold within 3-10 minutes.",
        answers: ["Lake Wintergrasp"],
    },
    {
        question: "Dalaran has ties to the Old Horde. (True/False)?",
        answers: ["false"],
    },
    {
        question: "You cant use the flying mount before you are around level 75~ in __________.",
        answers: ["Northrend"],
    },
    {
        question: "The neutral town in Northrend is called __________. It was teleported to Northrend because of Malygos and and his war against magic users.",
        answers: ["Dalaran"],
    },
    {
        question: "___________ has moved to the new Forsaken town in Northrend, New Agamand. Its in New Agamand the testing of the new plague will begin.",
        answers: ["Sylvanas"],
    },
    {
        question: "In what patch will we see Zul'Aman?",
        answers: ["2.3"],
    },
    {
        question: "The blue dragonkin's in _________ can now drop an Azure Whelp, a blue dragon pet.",
        answers: ["Azshara"],
    },
    {
        question: "In the upcomming patch, quest givers availible with daily quests will now have a ______ exclamation point instead of a yellow one.",
        answers: ["blue"],
    },
    {
        question: "In the upcomming patch, the Sporregar faction will sell a ________ pet at exalted.",
        answers: ["sporebat"],
    },
    {
        question: "In the upcomming patch, how much vendor discount does exalted give, in percent?",
        answers: ["20%", "twenty percent"],
    },
    {
        question: "In the upcomming patch, the Alliance Brigadier Generals and the Horde Warbringers will give out ___________ daily quests.",
        answers: ["battleground", "bg"],
    },
    {
        question: "In the upcomming patch, __________________ will feature a major change. The Commanders and Lieutenants has left this battleground, in search for new battle opportunities. Also, the elite tag on most of the NPC's has been removed.",
        answers: ["The Alterac Valley", "Alterac Valley", "AV"],
    },
    {
        question: "In the upcomming patch, ____________ paladins will get seriusly revamped.",
        answers: ["Retribution", "ret"],
    },
    {
        question: "In the upcomming patch, the dressing room will feature a significant change. You can now see how you would look with items from __________.",
        answers: ["receipes"],
    },
    {
        question: "In the upcomming patch, engineers can create flying machines to have as flying mounts. (True/False)?",
        answers: ["true"],
    },
    {
        question: "In the upcomming patch, you can catch a fishing ________ which teaches you how to 'track fishing nodes' via fishing.",
        answers: ["journal"],
    },
    {
        question: "In the upcomming patch, all old world dungeons have had their loot revisited. One change in that all boss loot will now be of _________ quaility.",
        answers: ["superior"],
    },
    {
        question: "In the upcomming patch, the elite mobs outside the instances in _________ has been changed to non-elite. The trolls outside ZF will become non-elites, for example.",
        answers: ["Azeroth"],
    },
    {
        question: "In the upcommming patch, the heroic keys has been changed from revered to __________ as requirement before you can buy.",
        answers: ["honored"],
    },
    {
        question: "In the upcomming patch, a lot of the old world's dungeons has been changed. They have also made the instances narrower in level ranges. (True/False)?",
        answers: ["true"],
    },
    {
        question: "In the upcomming patch, you can get daily quests for fishing. (True/False)?",
        answers: ["false"],
    },
    {
        question: "In the upcomming patch, you can get ________________ for heroic and non-heroic dungeons in Outland.",
        answers: ["daily quests"],
    },
    {
        question: "In the upcomming patch, the ___________ has received some upgrades.",
        answers: ["Auction House", "AH"],
    },
    {
        question: "Naxxrammas was once an ancient ________ ziggurat, before it was pulled free from the ground by agents of the Lich King. It served as Kel'Thuzad's base of operations as he spread the plague. It's the home of Kel'Thuzad.",
        answers: ["nerubian"],
    },
    {
        question: "What is the name of the legendary caster staff, in Naxxramas?",
        answers: ["Atiesh, Greatstaff of the Guardian", "Atiesh"],
    },
    {
        question: "Kel'Thuzad was formerly a sorcerer of ________.",
        answers: ["Dalaran"],
    },
    {
        question: "No one have yet entered __________ and lived to tell the tale. (hint: The Dread Citadel)",
        answers: ["Naxxrammas", "Naxx"],
    },
    {
        question: "To enter Naxxramas you need to go into an open _________ in the middle of Plaguewood, which lies in the Eastern Plaguelands. From there you teleport yourself to Naxxramas, by standing on the main floor.",
        answers: ["ziggurat"],
    },
    {
        question: "Naxxramas will be retuned for level 80. (True/False)?",
        answers: ["true"],
    },
    {
        question: "Naxxramas has how many wings?",
        answers: ["4", "four", "four wings", "4 wings"],
    },
    {
        question: "Who is the last boss of the Spider Wing in Naxxramas?",
        answers: ["Maexxna"],
    },
    {
        question: "Who is the last boss of the Plague Wing in Naxxramas?",
        answers: ["Loatheb"],
    },
    {
        question: "What is the last bosses of the Deathknight wing called, in Naxxramas?",
        answers: ["The Four Horsemen"],
    },
    {
        question: "Who is the last boss of the Abomination Wing in Naxxramas?",
        answers: ["Thaddius"],
    },
    {
        question: "There is a night elf highborne inside Naxxramas, called _________ Tarsis Kir-Moldir.",
        answers: ["Archmage"],
    },
    {
        question: "What is the cat inside Naxxramas called? if you kill it, Kel'Thuzad will curse you and you're raid.",
        answers: ["Bigglesworth", "Mr. Bigglesworth"],
    },
    {
        question: "Players will need resistance in every element in order to complete Naxxramas. (True/False)?",
        answers: ["false"],
    },
    {
        question: "You need to clear every wing before you can enter ________ Lair, in Naxxramas.",
        answers: ["Frostwyrm"],
    },
    {
        question: "What dungeon tier drops in Naxxramas?",
        answers: ["Tier 3"],
    },
    {
        question: "What can you find on the walls of each boss chamber and varius other places, in Naxxramas?",
        answers: ["Frozen Runes", "Frozen Rune's"],
    },
    {
        question: "Defrosting a frozen rune in Naxxramas with 'Word of _______' yields around 3 to 6 tradeable frozen runes. They can be used as a Greater Frost Protection Potion, or to craft epic frost resistance gear.",
        answers: ["Thawing"],
    },
    {
        question: "You dont generally use the frozen rune's from Naxxramas, as it is considered too expensive. Instead, most guilds use them to create the epic _____ resistance gear for classes, which is needed for Sapphiron in Naxxramas.",
        answers: ["frost"],
    },
    {
        question: "The epic frost resistance collection for Rogues is called _______. Guilds usually create them for Naxxramas.",
        answers: ["polar"],
    },
    {
        question: "The epic frost resistance collection for Hunters is called ____________. Guilds usually create them for Naxxramas.",
        answers: ["Icy Scale"],
    },
    {
        question: "The epic frost resistance collection for Mages, Priests, Warlocks is called __________. Guilds usually create them for Naxxramas.",
        answers: ["Glacial"],
    },
    {
        question: "What boss is considered to be the easiest, in Naxxramas?",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "What boss in Naxxramas is considered a very hard 'gear check'?",
        answers: ["Patchwerk"],
    },
    {
        question: "What boss is considered to be the second hardest in Naxxramas?",
        answers: ["The Four Horsemen"],
    },
    {
        question: "What boss is considered to be the hardest of all in Naxxramas?",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "In what instance except Naxxramas, can Kel'Thuzad be found?",
        answers: ["Escape from Durnholde Keep", "Durnholde", "Escape from Durnholde", "Old hillsbrad", "Old hillsbrad foothills"],
    },
    {
        question: "In order to fight Sapphiron, you need to ring a bell inside Naxxramas. (True/False)?",
        answers: ["false"],
    },
    {
        question: "What resistance do you need 150-200 of, in order to kill Sapphiron in Naxxramas? (atleast it was so, pre-bc)",
        answers: ["frost"],
    },
    {
        question: "It is likely that the Ashbringer will be moved from Naxxramas till a instance in Utgarde Keep. (True/False)?",
        answers: ["true"],
    },
    {
        question: "What is the name of the boss which is considered 'free loot' by many people?",
        answers: ["Grobbulus"],
    },
    {
        question: "_____________ in Naxxramas you need to kite, in order to defeat him. He is known to get bugged sometimes.",
        answers: ["Anub'Rekhan"],
    },
    {
        question: "What is the mobs that spawns during the Anub'Rekhan fight called? (hint: the huge spiders, which you need to offtank and kill before you can countinue to DPS Anub'Rekhan)",
        answers: ["Crypt Guards", "Crypt Guard"],
    },
    {
        question: "What raiding instance is considered to be the 'best' ever created by Blizzard, atleast of the 40man instances?",
        answers: ["Naxxramas", "Naxx"],
    },
    {
        question: "What boss in Naxxramas casts Locust Swarm, the deadly 1200 dmg / 2sec dot which the tank must avoid at any cost?",
        answers: ["Anub'Rekhan"],
    },
    {
        question: "What boss in Naxxramas can create Corpse Scarabs from the remains of dead Crypt Guards and dead players? (hint: These scarabs can never be allowed to hit the MT, due to the 'daze' effect which is devestating)",
        answers: ["Anub'Rekhan"],
    },
    {
        question: "Quote: I hear little hearts beating. Yesss... beating faster now. Soon the beating will stop.",
        answers: ["Anub'Rekhan"],
    },
    {
        question: "What boss casts Poison Bolt Volley in Naxxramas?",
        answers: ["Grand Widow Faerlina", "Faerlina"],
    },
    {
        question: "What boss has worshippers as adds in Naxxramas?",
        answers: ["Grand Widow Faerlina", "Faerlina"],
    },
    {
        question: "Quote: Your old lives, your mortal desires, mean nothing. You are acolytes of the master now, and you will serve the cause without question! The greatest glory is to die in the master's service!",
        answers: ["Grand Widow Faerlina", "Faerlina"],
    },
    {
        question: "What boss will 'cocoon' players, in Naxxramas?",
        answers: ["Maexxna"],
    },
    {
        question: "What boss casts Web Sprays, in Naxxramas?",
        answers: ["Maexxna"],
    },
    {
        question: "What boss in Naxxramas drops the Wraith blade, a caster sword?",
        answers: ["Maexxna"],
    },
    {
        question: "What boss drops the epic T3 hands, in Naxxramas?",
        answers: ["Maexxna"],
    },
    {
        question: "Noth the Plaguebringer were once a notable wizard and ________ of Dalaran. (hint: proffesion in wow)",
        answers: ["alchemist"],
    },
    {
        question: "Kel'Thuzad froze ______________________'s heart in Naxxramas with cold magic, so that he would not have any feelings. This was needed, because of his guilt. He is now more undead then human.",
        answers: ["Noth the Plaguebringer", "Noth"],
    },
    {
        question: "What boss in Naxxramas casts Curse of the Plaguebringer, which must be decursed at all costs, otherwise the raid will most probably wipe?",
        answers: ["Noth the Plaguebringer", "Noth"],
    },
    {
        question: "Quote: Rise my soldiers! Rise, and fight once more!",
        answers: ["Noth the Plaguebringer", "Noth"],
    },
    {
        question: "Quote: Glory to the master!",
        answers: ["Noth the Plaguebringer", "Noth"],
    },
    {
        question: "What boss requires you to essentially 'dance' to avoid dying in Naxxramas?",
        answers: ["Heigan the Unclean", "Heigan"],
    },
    {
        question: "What boss in Naxxramas teleports three people to a tunnel occasionally?",
        answers: ["Heigan the Unclean", "Heigan"],
    },
    {
        question: "Quote: Close your eyes.. sleep",
        answers: ["Heigan the Unclean", "Heigan"],
    },
    {
        question: "Quote: The end is upon you.",
        answers: ["Heigan the Unclean", "Heigan"],
    },
    {
        question: "What boss in Naxxramas requires very good individual coordination from everyone?",
        answers: ["Heigan the Unclean", "Heigan"],
    },
    {
        question: "What boss in Naxxramas requires 3x Greater Shadow Protection Potions?",
        answers: ["Loatheb"],
    },
    {
        question: "What boss casts Corrupted Mind, which makes you able to only cast one healing spell per minute, in Naxxramas?",
        answers: ["Loatheb"],
    },
    {
        question: "What boss spawns spores, which upon killing grants five players the fungal bloom debuff? (increases you're crit and hit, and causes you to make no threat)",
        answers: ["Loatheb"],
    },
    {
        question: "What boss in Naxxramas casts Unbalancing Strike, which need to be taken by one of his adds?",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "What boss in Naxxramas casts Disrupting Shout, which reduces the mana of everyone it hits by up to 4000 and deals twice the mana burned this way in damage?",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "Quote: The time for practice is over! Show me what you've learned!",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "Quote: Show me what you've got!",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "Quote: An honorable... death..",
        answers: ["Instructor Razuvious", "Razuvious"],
    },
    {
        question: "The bosses in Naxxramas can sometimes drop ______ of Atiesh. Sapphiron and Kel'Thuzad will never drop one, though.",
        answers: ["Splinter"],
    },
    {
        question: "What boss in Naxxramas looks nearly identical to Heigan the Unclean?",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "What boss in Naxxramas will have you kill Spectral Trainee's, Unrelenting Riders and other undeads, before you can face him?",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "What boss in Naxxramas will casts Harvest Soul sometimes on the tank, which reduces stats by 10% and is stackable?",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "Quote: Foolishly you have sought your own demise. Brazenly you have disregarded powers beyond your understanding. You have fought hard to invade the realm of the harvester. Now there is only one way out - to walk the lonely path of the damned.",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "Quote: I have waited long enough! Now, you face the harvester of souls!",
        answers: ["Gothik the Harvester", "Gothik"],
    },
    {
        question: "The Four Horsemen are Highlord Mograine, Thane Korth'azz, Lady Blaumeux, and Sir _______. They are in service of the powerful lich, Kel'Thuzad.",
        answers: ["Zeliek"],
    },
    {
        question: "Highlord Mograine's special ability in Naxxramas, is the _____________. It deals 2160-2640 frontload damage and a 4800/8 sec damage DoT. It is identical to Ragnaros's Elemental Fire, and can be mitigated by fire resist.",
        answers: ["Righteous Fire"],
    },
    {
        question: "Thane Korth'azz's special ability in Naxxrams, is the ________. It deals roughly 14250-15750~ fire damage, which is shared between all people within 8 yards from where the meteor landed.",
        answers: ["Meteor"],
    },
    {
        question: "Sir Zeliek's special ability is called ______________. It will chain around everyone within 5 yards of the last hitted target, so it's important too not get to close. It wont loop however, but it deals twice the damage each hit.",
        answers: ["Holy Wrath"],
    },
    {
        question: "Lady Blaumeux's special ability in Naxxramas, is the ____________. It will summon an area of damage that deals shadow damage if you step into it. It has a small radius however, only 5~ yards. It lasts for 1 minute and 30 seconds.",
        answers: ["Void Zone"],
    },
    {
        question: "Who drops the Ashbringer, in Naxxramas?",
        answers: ["Highlord Mograine"],
    },
    {
        question: "You need to tank each of the horsemen seperately, in Naxxramas. (True/False)?",
        answers: ["True"],
    },
    {
        question: "Quote: Life is meaningless. It is in death that we are truly tested.",
        answers: ["Highlord Mograine", "Mograine"],
    },
    {
        question: "Quote: The first kill goes to me! Anyone care to wager?",
        answers: ["Lady Blaumeux", "Blaumeux"],
    },
    {
        question: "Quote: I'm gonna enjoy killin' these slack-jawed daffodils!",
        answers: ["Thane Korth'azz", "Thane Korthazz"],
    },
    {
        question: "Quote: Do not continue! Turn back while there's still time!",
        answers: ["Sir Zeliek", "Zeliek"],
    },
    {
        question: "This boss in Naxxramas is a major difficulty for healers especially. The healing needs to be perfect for this boss, and the same with the DPS. This boss is the first boss of the Abonimation Wing.",
        answers: ["Patchwerk"],
    },
    {
        question: "If this boss in Naxxramas enters a berserker rage, then the raid will have around 12 seconds max to kill him, before they are all dead.",
        answers: ["Patchwerk"],
    },
    {
        question: "This boss in Naxxramas is known for its difficulty. This boss is probably the hardest of the first ones in each wing. His special ability 'Hateful Strike', can be devestating for the MT. This encounter is hard for every class.",
        answers: ["Patchwerk"],
    },
    {
        question: "Patchwerk is an aggro-sensitive encounter. (True/False)?",
        answers: ["false"],
    },
    {
        question: "Quote: No more play?",
        answers: ["Patchwerk"],
    },
    {
        question: "Quote: _______ want to play.",
        answers: ["Patchwerk"],
    },
    {
        question: "Quote: Kel'Thuzad make _______ his avatar of war!",
        answers: ["Patchwerk"],
    },
    {
        question: "Quote: What happened to... Patch...",
        answers: ["Patchwerk"],
    },
    {
        question: "Grobbulus and _________ drops the tier 3 shoulders.",
        answers: ["Patchwerk"],
    },
    {
        question: "____________ in Naxxramas emits poision clouds which is 10 yards wide and deals a heavy ammount of nature damage if you stand in it. The MT for this boss needs to move steadily but slowly, to avoid them.",
        answers: ["Grobbulus"],
    },
    {
        question: "What boss in Naxxramas is required to be ranged down, whilsts the meele deals with the slimes from this boss, when they spawn? (the meele players also helps out with the ranged dps, when there are no slimes up)",
        answers: ["Grobbulus"],
    },
    {
        question: "What boss in Naxxramas drops The End of Dreams, a mace for druids?",
        answers: ["Grobbulus"],
    },
    {
        question: "What boss in Naxxramas has a ability called 'Decimate', which is needed in order to kill him?",
        answers: ["Gluth"],
    },
    {
        question: "What boss spawns a zombie every 10 seconds, which you need to kite for 105 seconds, together with the others that will spawn in that time?",
        answers: ["Gluth"],
    },
    {
        question: "What boss has Enrage, Mortal Wound, Frenzy, Decimate, Terrifying Roar, and Devour Zombie as abilities, in Naxxramas?",
        answers: ["Gluth"],
    },
    {
        question: "This boss will 'polarize' a raid group, making 50% negativily charged and 50% positively charged. They need to be seperated as fast as possible, otherwise they will deal 2k nature damage to all opposite-charged players within 10 yards.",
        answers: ["Thaddius"],
    },
    {
        question: "If no one is in meele range of this boss, in Naxxramas, this boss will throw 'Ball Lightning' on players, dealing around 8k nature damage on every throw.",
        answers: ["Thaddius"],
    },
    {
        question: "Only by splitting the raid in half can this boss in Naxxramas be killed. Some exceptions can probably be made, but not more then some few.",
        answers: ["Thaddius"],
    },
    {
        question: "Quote: You are too late... I... must... OBEY!",
        answers: ["Thaddius"],
    },
    {
        question: "Quote: Now YOU feel pain!",
        answers: ["Thaddius"],
    },
    {
        question: "Quote: You die now!",
        answers: ["Thaddius"],
    },
    {
        question: "What boss in Naxxramas drops the tier 3 headpieces?",
        answers: ["Thaddius"],
    },
    {
        question: "What boss in Naxxramas casts Frost Breath? The boss will take a deep breath sometimes and breathe a cloud of frost which will slowly fall to the ground and explode, dealing 75k-125k when it touches it, in a 70 yard radius.",
        answers: ["Sapphiron"],
    },
    {
        question: "On which boss in Naxxramas do you need to stay behind iceblocked individuals, to avoid dying?",
        answers: ["Sapphiron"],
    },
    {
        question: "Sapphiron in Naxxramas was originally a blue dragon that was protecting Northrend, untill he was killed by _________ and his forces. He was resurrected as a undead shortly after, by Arthas.",
        answers: ["Arthas"],
    },
    {
        question: "What boss drops 'The Face of Death', the best tanking shield availible pre-bc, in Naxxramas?",
        answers: ["Sapphiron"],
    },
    {
        question: "Kel'Thuzad is immune to frost attacks. (True/False)?",
        answers: ["false"],
    },
    {
        question: "The Four Horsemen drops the _______ of T3.",
        answers: ["chests"],
    },
    {
        question: "Where can you find Carrion Spinners?",
        answers: ["Naxxramas", "Naxx"],
    },
    {
        question: "Quote: Do not rejoice... your victory is a hollow one... for I shall return with powers beyond your imagining!",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "Quote: The dark void awaits you!",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "Quote: Very well... warriors of the frozen wastes, rise up, I command you to fight, kill, and die for your master. Let none survive...",
        answers: ["The lich king", "Lich king"],
    },
    {
        question: "Quote: Fools, you think yourselves triumphant? You have only taken one step closer to the abyss!",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "What boss drops the rings of T3?",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "What boss in Naxxramas drops Fists of the Unrelenting, a Fury Warrior gauntlet?",
        answers: ["Sapphiron"],
    },
    {
        question: "On stage three of this boss, this boss will summon five Guardians of Icecrown. They are tough and everytime they switch target, they gain a +15% more damage and +10% size buff. These buffs stacks, and remains throughout the encounter.",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "Who drops 'Might of Menethil', in Naxxramas?",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "You can find Archmage Tarsis Kir-Moldir in his tower, in Azshara. (True/False)?",
        answers: ["false"],
    },
    {
        question: "Quote: The end is upon you!",
        answers: ["Kel'Thuzad"],
    },
    {
        question: "What is the Warrior's tier 3 called?",
        answers: ["Dreadnaught"],
    },
    {
        question: "What is the Mage's tier 3 called?",
        answers: ["Frostfire Regalia", "Frostfire"],
    },
    {
        question: "What is the Priest's tier 3 called?",
        answers: ["Vestments of Faith"],
    },
    {
        question: "What is the Warlock's tier 3 called?",
        answers: ["Plagueheart Raiment", "Plagueheart"],
    },
    {
        question: "What is the Shaman's tier 3 called?",
        answers: ["The Earthshatterer", "Earthshatterer"],
    },
    {
        question: "What is the Paladin's tier 3 called?",
        answers: ["Redemption Armor", "Redemption"],
    },
    {
        question: "What is the Druid's tier 3 called?",
        answers: ["Dreamwalker Raiment", "Dreamwalker"],
    },
    {
        question: "Who drops the 'Misplaced Servo Arm' in Naxxramas? (hint: a term used a lot in instances)",
        answers: ["trash mobs", "trash"],
    },
    {
        question: "Which bosses in Naxxramas drops the T3 feets? (name both, or one of them)",
        answers: ["Razuvious and Gothik", "Instructor Razuvious and Gothik the Harvester", "Gothik and Razuvious", "Gothik the Harvester and Instructor Razuvious", "Gothik", "Gothik the Harvester", "Instructor Razuvious", "Razuvious"],
    },
    {
        question: "What boss drops the T3 leggings, in Naxxramas?",
        answers: ["Loatheb"],
    },
    {
        question: "Which bosses in Naxxramas drops the T3 waist? (name both, or one of them)",
        answers: ["Noth and Heigan", "Noth the Plaguebringer and Heigan the Unclean", "Heigan and Noth", "Heigan the Unclean and Noth the Plaguebringer", "Noth", "Heigan", "Noth the Plaguebringer", "Heigan the Unclean"],
    },
    {
        question: "What boss in Naxxramas drops the T3 headpieces?",
        answers: ["Thaddius"],
    },
    {
        question: "What boss in Naxxramas can drop the Feet/Waist/Shoulder/Wrist of T3?",
        answers: ["Gluth"],
    },
    {
        question: "Which bosses in Naxxramas drops the T3 shoulders? (name both)",
        answers: ["Patchwerk and Grobbulus", "Grobbulus and Patchwerk"],
    },
    {
        question: "Quote: Your fate is sealed!",
        answers: ["The Twin Emperors", "Twin Emperors"],
    },
    {
        question: "Quote: Your friends will abandon you.",
        answers: ["C'thun", "Cthun"],
    },
    {
        question: "Quote: Your heart will explode.",
        answers: ["C'thun", "Cthun"],
    },
    {
        question: "Quote: Death is close.",
        answers: ["C'thun", "Cthun"],
    },
    {
        question: "Quote: Tremble mortals, and despair! Doom has come to this world!",
        answers: ["Archimonde"],
    },
    {
        question: "Quote: This world will burn!",
        answers: ["Archimonde"],
    },
    {
        question: "Quote: I am the coming of the end ",
        answers: ["Archimonde"],
    },
    {
        question: "Quote: Abandon all hope! The legion has returned to finish what was begun so many years ago. This time there will be no escape!",
        answers: ["Azgalor"],
    },
    {
        question: "Quote: Cry for mercy! Your meaningless lives will soon be forfeit.",
        answers: ["Kaz'rogal"],
    },
    {
        question: "Quote: You are defenders of a doomed world. Flee here and perhaps you will prolong your pathetic lives.",
        answers: ["Anetheron"],
    },
    {
        question: "Quote: Succumb to the icy chill... of death!",
        answers: ["Rage Winterchill"],
    },
    {
        question: "Quote: Ashes to ashes, dust to dust.",
        answers: ["Rage Winterchill"],
    },
    {
        question: "Quote: My patience has run out! Die, die!",
        answers: ["High Warlord Naj'entus", "High Warlord Najentus", "Najentus"],
    },
    {
        question: "Quote: YOU WILL SHOW THE PROPER RESPECT!",
        answers: ["Teron Gorefiend"],
    },
    {
        question: "Quote: I'll rip the meat from your bones!",
        answers: ["Gurtogg Bloodboil"],
    },
    {
        question: "Quote: You can have anything you desire... for a price.",
        answers: ["Reliquary of Souls", "Reliquary", "Essence of Souls"],
    },
    {
        question: "Quote: So, business... or pleasure?",
        answers: ["Mother Shahraz", "Shahraz"],
    },
    {
        question: "Quote: You're not cut out for this!",
        answers: ["Illidari Council"],
    },
    {
        question: "Quote: Behold the flames of Azzinoth!",
        answers: ["Illidan Stormrage"],
    },
    {
        question: "Naxxramas will become a 25man in the expansion. (True/False)?",
        answers: ["true"],
    },
    {
        question: "The nerubian spiderlords are followers of the __________ in Northrend.",
        answers: ["Old Gods"],
    },
    {
        question: "Quote: Shhh... it will all be over soon.",
        answers: ["Anub'Rekhan"],
    },
];

module.exports = wowTriviaQuestions;
