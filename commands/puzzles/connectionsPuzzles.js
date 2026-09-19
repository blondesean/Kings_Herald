/* Puzzle bank for the Herald's daily Connections-style puzzle (see the
 * /puzzles experiments tracked alongside hangmanWords.js in this
 * directory). No game logic lives here yet — this is just the puzzle
 * content, split out early so difficulty/content can be reviewed
 * independently of how the game itself gets built.
 *
 * These are original puzzles, written for this project rather than pulled
 * from any existing Connections-style site (NYT's Connections, and clones
 * of it, are curated creative compilations — reusing someone else's actual
 * puzzles wholesale isn't something to build a feature on top of).
 *
 * Each puzzle is { groups: [ { category, difficulty, words } x6 ] } — 24
 * total words across 6 groups of 4, no word repeated within a puzzle.
 * `difficulty` follows the NYT-popularized yellow/green/blue/purple
 * convention (easiest to hardest; purple is usually wordplay-based rather
 * than a plain category) purely as a familiar shorthand for tuning — it's
 * not itself copyrightable, just a common difficulty-tier label. With six
 * groups instead of four, there's no requirement that a puzzle use all four
 * tiers or use each just once — some puzzles below lean purple-heavy,
 * others barely touch it, and that's fine.
 *
 * This bank was originally built as 32 puzzles of 4 groups each (16 words).
 * When the board grew to 6 groups (24 words), all 128 of those groups were
 * pooled and algorithmically repacked into new 6-group puzzles — same
 * categories and words verbatim, just recombined — rather than writing all
 * new content. 126 of the 128 original groups packed cleanly into 21 new
 * puzzles with zero within-puzzle word collisions; 2 groups ("Types of
 * Bread" and "Keyboard Keys") didn't fit anywhere without colliding and
 * were left unused rather than forcing an awkward puzzle around them.
 */
const connectionsPuzzles = () => [
    {
        groups: [
            { category: "PARTS OF A CASTLE", difficulty: 'green', words: ["TURRET", "MOAT", "DRAWBRIDGE", "PARAPET"] },
            { category: "ANAGRAM OF A DIFFERENT WORD", difficulty: 'purple', words: ["LEMON", "STAPLE", "SILENT", "ANGERED"] },
            { category: "SPELLS A DIFFERENT WORD BACKWARDS", difficulty: 'purple', words: ["DENIM", "REPAID", "STRAW", "DEVIL"] },
            { category: "TYPES OF DINOSAUR", difficulty: 'green', words: ["TRICERATOPS", "STEGOSAURUS", "VELOCIRAPTOR", "BRONTOSAURUS"] },
            { category: "HIDE A COUNTRY", difficulty: 'purple', words: ["MALICIOUS", "PERUSE", "INCUBATE", "ICELANDIC"] },
            { category: "MARTIAL ARTS", difficulty: 'green', words: ["KARATE", "JUDO", "AIKIDO", "TAEKWONDO"] },
        ],
    },
    {
        groups: [
            { category: "WEATHER PHENOMENA", difficulty: 'green', words: ["DROUGHT", "BLIZZARD", "MONSOON", "CYCLONE"] },
            { category: "SEASONS", difficulty: 'yellow', words: ["SPRING", "SUMMER", "AUTUMN", "WINTER"] },
            { category: "TYPES OF PIE", difficulty: 'yellow', words: ["PUMPKIN", "PECAN", "APPLE", "CHERRY"] },
            { category: "UNITS OF LENGTH", difficulty: 'green', words: ["INCH", "FOOT", "YARD", "MILE"] },
            { category: "CHESS PIECES", difficulty: 'green', words: ["KNIGHT", "BISHOP", "ROOK", "PAWN"] },
            { category: "___ BACK", difficulty: 'blue', words: ["HORSE", "PIGGY", "DRAW", "SET"] },
        ],
    },
    {
        groups: [
            { category: "GREEK LETTERS", difficulty: 'green', words: ["ALPHA", "BETA", "GAMMA", "DELTA"] },
            { category: "HIDE A FRUIT", difficulty: 'purple', words: ["GRAPEVINE", "PLUMBER", "IMPEACH", "DATEBOOK"] },
            { category: "___HOUSE", difficulty: 'blue', words: ["GREEN", "LIGHT", "WARE", "FARM"] },
            { category: "TYPES OF JACKET", difficulty: 'yellow', words: ["BLAZER", "PARKA", "ANORAK", "WINDBREAKER"] },
            { category: "___ WORK", difficulty: 'blue', words: ["HOME", "NET", "FRAME", "ART"] },
            { category: "___ FIGHT", difficulty: 'blue', words: ["CAT", "GUN", "FIRE", "BULL"] },
        ],
    },
    {
        groups: [
            { category: "HIDE A MUSIC GENRE", difficulty: 'purple', words: ["ROCKET", "POPULAR", "SOULFUL", "JAZZY"] },
            { category: "TYPES OF BICYCLE", difficulty: 'yellow', words: ["MOUNTAIN", "ROAD", "TANDEM", "UNICYCLE"] },
            { category: "PARTS OF A FLOWER", difficulty: 'green', words: ["PETAL", "STEM", "STAMEN", "PISTIL"] },
            { category: "___ POT", difficulty: 'blue', words: ["TEA", "JACK", "CROCK", "HONEY"] },
            { category: "ANAGRAM OF ANOTHER COMMON WORD", difficulty: 'purple', words: ["EARTH", "NIGHT", "STATE", "MEAT"] },
            { category: "___ TIME", difficulty: 'blue', words: ["BED", "DAY", "LIFE", "OVER"] },
        ],
    },
    {
        groups: [
            { category: "BOARD GAMES", difficulty: 'green', words: ["MONOPOLY", "SCRABBLE", "CLUEDO", "RISK"] },
            { category: "BASEBALL POSITIONS", difficulty: 'green', words: ["PITCHER", "CATCHER", "SHORTSTOP", "OUTFIELDER"] },
            { category: "TYPES OF SANDWICH", difficulty: 'yellow', words: ["CLUB", "REUBEN", "GYRO", "PANINI"] },
            { category: "FENCING WEAPONS", difficulty: 'green', words: ["FOIL", "EPEE", "SABRE", "RAPIER"] },
            { category: "HIDE AN INSECT", difficulty: 'purple', words: ["ANTIQUE", "BEETROOT", "FLYWHEEL", "MOTHBALL"] },
            { category: "TYPES OF BUTTERFLY OR MOTH", difficulty: 'yellow', words: ["MONARCH", "SWALLOWTAIL", "LUNA", "PAINTED LADY"] },
        ],
    },
    {
        groups: [
            { category: "PIZZA TOPPINGS", difficulty: 'yellow', words: ["PEPPERONI", "MUSHROOM", "OLIVE", "ANCHOVY"] },
            { category: "PUNCTUATION MARKS", difficulty: 'green', words: ["COMMA", "PERIOD", "SEMICOLON", "HYPHEN"] },
            { category: "TYPES OF GUITAR", difficulty: 'yellow', words: ["ACOUSTIC", "ELECTRIC", "BASS", "CLASSICAL"] },
            { category: "SHAKESPEARE PLAYS", difficulty: 'green', words: ["HAMLET", "MACBETH", "OTHELLO", "TEMPEST"] },
            { category: "HIDE A COMPASS DIRECTION", difficulty: 'purple', words: ["EASTER", "WESTERN", "NORTHERN", "SOUTHERN"] },
            { category: "___ PIT", difficulty: 'blue', words: ["ARM", "FIRE", "MOSH", "TAR"] },
        ],
    },
    {
        groups: [
            { category: "___ SHOT", difficulty: 'blue', words: ["LONG", "GUN", "SNAP", "MUG"] },
            { category: "___ WORM", difficulty: 'blue', words: ["EARTH", "BOOK", "SILK", "TAPE"] },
            { category: "TYPES OF DRUM", difficulty: 'yellow', words: ["SNARE", "BONGO", "TIMPANI", "DJEMBE"] },
            { category: "FARM ANIMALS", difficulty: 'yellow', words: ["GOAT", "SHEEP", "PIG", "HORSE"] },
            { category: "___ RING", difficulty: 'blue', words: ["KEY", "EAR", "WEDDING", "BOXING"] },
            { category: "HIDDEN COLOR", difficulty: 'purple', words: ["BLUEPRINT", "GREENHOUSE", "REDWOOD", "BLACKSMITH"] },
        ],
    },
    {
        groups: [
            { category: "ANAGRAM OF A DIFFERENT WORD", difficulty: 'purple', words: ["TONE", "RATE", "CARES", "FILES"] },
            { category: "HIDE A NUMBER", difficulty: 'purple', words: ["ATTENTION", "HONEST", "TWOFOLD", "CANINE"] },
            { category: "HIDE A WEAPON", difficulty: 'purple', words: ["SWORDFISH", "ARROWROOT", "SPEARMINT", "DAGGERBOARD"] },
            { category: "TYPES OF TEA", difficulty: 'yellow', words: ["CHAMOMILE", "OOLONG", "EARL GREY", "MATCHA"] },
            { category: "HIDE A SMALLER ANIMAL", difficulty: 'purple', words: ["CATASTROPHE", "DOGMATIC", "RATIONAL", "COWARDLY"] },
            { category: "ICE CREAM FLAVORS", difficulty: 'yellow', words: ["VANILLA", "CHOCOLATE", "STRAWBERRY", "PISTACHIO"] },
        ],
    },
    {
        groups: [
            { category: "SPELL A DIFFERENT WORD BACKWARDS", difficulty: 'purple', words: ["STRESSED", "DRAWER", "STOP", "LOOT"] },
            { category: "HIDE A CHESS PIECE", difficulty: 'purple', words: ["PAWNSHOP", "BISHOPRIC", "ROOKIE", "KNIGHTHOOD"] },
            { category: "KITCHEN APPLIANCES", difficulty: 'green', words: ["BLENDER", "TOASTER", "KETTLE", "MIXER"] },
            { category: "TYPES OF MUSHROOM", difficulty: 'yellow', words: ["PORTOBELLO", "SHIITAKE", "CREMINI", "MOREL"] },
            { category: "PLANETS", difficulty: 'yellow', words: ["VENUS", "MARS", "SATURN", "NEPTUNE"] },
            { category: "TYPES OF HAT", difficulty: 'yellow', words: ["FEDORA", "BERET", "SOMBRERO", "BEANIE"] },
        ],
    },
    {
        groups: [
            { category: "___ NUT", difficulty: 'blue', words: ["DOUGH", "PEA", "COCO", "CHEST"] },
            { category: "ROYAL COURT ROLES", difficulty: 'green', words: ["HERALD", "CHAMBERLAIN", "STEWARD", "CHANCELLOR"] },
            { category: "___ FISH", difficulty: 'blue', words: ["CAT", "SWORD", "JELLY", "STAR"] },
            { category: "ROMAN GODDESSES", difficulty: 'green', words: ["JUNO", "VESTA", "CERES", "MINERVA"] },
            { category: "POKER HANDS", difficulty: 'green', words: ["FLUSH", "STRAIGHT", "PAIR", "FULL HOUSE"] },
            { category: "CONTAINS A SILENT LETTER", difficulty: 'purple', words: ["DEBT", "ISLAND", "RECEIPT", "AUTUMN"] },
        ],
    },
    {
        groups: [
            { category: "HOMOPHONES OF LETTERS", difficulty: 'purple', words: ["SEA", "BEE", "JAY", "ARE"] },
            { category: "HIDE A ROYAL TITLE", difficulty: 'purple', words: ["KINGFISHER", "DUKEDOM", "PRINCESS", "PEARLY"] },
            { category: "PARTS OF A TREE", difficulty: 'green', words: ["TRUNK", "BRANCH", "ROOT", "CANOPY"] },
            { category: "HIDE A UNIT OF TIME", difficulty: 'purple', words: ["MINUTEMAN", "SECONDARY", "HOURGLASS", "DECADENT"] },
            { category: "___ STORM", difficulty: 'blue', words: ["BRAIN", "SAND", "THUNDER", "HAIL"] },
            { category: "___ PRINT", difficulty: 'blue', words: ["FOOT", "FINGER", "BLUE", "NEWS"] },
        ],
    },
    {
        groups: [
            { category: "___ TRAP", difficulty: 'blue', words: ["MOUSE", "SAND", "BOOBY", "SPEED"] },
            { category: "TYPES OF SHOE", difficulty: 'yellow', words: ["SNEAKER", "LOAFER", "SANDAL", "BOOT"] },
            { category: "ANAGRAM OF A DIFFERENT WORD", difficulty: 'purple', words: ["DUSTY", "ANGLE", "TRIED", "SPARE"] },
            { category: "TYPES OF BEAR", difficulty: 'yellow', words: ["GRIZZLY", "POLAR", "PANDA", "KODIAK"] },
            { category: "HOMOPHONES OF LETTERS", difficulty: 'purple', words: ["WHY", "EX", "CUE", "EYE"] },
            { category: "___ STONE", difficulty: 'blue', words: ["LIME", "MILE", "KEY", "CORNER"] },
        ],
    },
    {
        groups: [
            { category: "HOMOPHONES OF TREES", difficulty: 'purple', words: ["BEACH", "FUR", "EWE", "PLAIN"] },
            { category: "HIDE A BODY PART", difficulty: 'purple', words: ["SHINE", "EARNEST", "HIPPOPOTAMUS", "ARMISTICE"] },
            { category: "TYPES OF WHALE", difficulty: 'green', words: ["HUMPBACK", "ORCA", "BELUGA", "SPERM"] },
            { category: "___ STICK", difficulty: 'blue', words: ["CHOP", "LIP", "DRUM", "MATCH"] },
            { category: "TYPES OF SOUP", difficulty: 'yellow', words: ["MINESTRONE", "BISQUE", "CHOWDER", "GAZPACHO"] },
            { category: "DOG BREEDS", difficulty: 'yellow', words: ["LABRADOR", "POODLE", "BEAGLE", "TERRIER"] },
        ],
    },
    {
        groups: [
            { category: "___ MATE", difficulty: 'blue', words: ["CLASS", "ROOM", "CHECK", "SOUL"] },
            { category: "CONSTELLATIONS", difficulty: 'green', words: ["ORION", "PEGASUS", "HERCULES", "PERSEUS"] },
            { category: "HOMOPHONES OF NUMBERS", difficulty: 'purple', words: ["WON", "FOR", "ATE", "TOO"] },
            { category: "___ FIELD", difficulty: 'blue', words: ["BATTLE", "OUT", "MINE", "AIR"] },
            { category: "___SCAPE", difficulty: 'blue', words: ["LAND", "SEA", "CITY", "MOON"] },
            { category: "TYPES OF CHEESE", difficulty: 'yellow', words: ["CHEDDAR", "GOUDA", "BRIE", "FETA"] },
        ],
    },
    {
        groups: [
            { category: "ANAGRAM OF A DIFFERENT WORD", difficulty: 'purple', words: ["SPACE", "TEACH", "LEAST", "CRATE"] },
            { category: "PARTS OF A SHIP", difficulty: 'green', words: ["HULL", "BOW", "STERN", "MAST"] },
            { category: "TYPES OF PASTA", difficulty: 'green', words: ["PENNE", "FUSILLI", "LINGUINE", "RIGATONI"] },
            { category: "PRECIOUS METALS", difficulty: 'yellow', words: ["GOLD", "SILVER", "PLATINUM", "PALLADIUM"] },
            { category: "PARTS OF A GUITAR", difficulty: 'green', words: ["FRET", "BRIDGE", "NECK", "STRING"] },
            { category: "TYPES OF NUT", difficulty: 'yellow', words: ["ALMOND", "CASHEW", "PECAN", "WALNUT"] },
        ],
    },
    {
        groups: [
            { category: "CARD GAMES", difficulty: 'green', words: ["POKER", "BRIDGE", "RUMMY", "EUCHRE"] },
            { category: "___ BAND", difficulty: 'blue', words: ["RUBBER", "ARM", "HEAD", "WRIST"] },
            { category: "TYPES OF SALAD", difficulty: 'yellow', words: ["CAESAR", "COBB", "WALDORF", "GREEK"] },
            { category: "TYPES OF BOAT", difficulty: 'yellow', words: ["CANOE", "KAYAK", "YACHT", "SCHOONER"] },
            { category: "KITCHEN UTENSILS", difficulty: 'green', words: ["WHISK", "SPATULA", "LADLE", "TONGS"] },
            { category: "ROCK CLIMBING TERMS", difficulty: 'green', words: ["BELAY", "CARABINER", "CRUX", "ANCHOR"] },
        ],
    },
    {
        groups: [
            { category: "___ FALL", difficulty: 'blue', words: ["RAIN", "WATER", "NIGHT", "DOWN"] },
            { category: "SEWING TERMS", difficulty: 'green', words: ["THIMBLE", "BOBBIN", "SEAM", "HEM"] },
            { category: "SPELLS A DIFFERENT WORD BACKWARDS", difficulty: 'purple', words: ["SPOTS", "EMIT", "KNITS", "DEER"] },
            { category: "ROOMS IN A HOUSE", difficulty: 'green', words: ["KITCHEN", "ATTIC", "CELLAR", "PANTRY"] },
            { category: "___ MARK", difficulty: 'blue', words: ["BOOK", "BENCH", "TRADE", "HALL"] },
            { category: "CONTAINS A SILENT LETTER", difficulty: 'purple', words: ["KNIFE", "GNAT", "WRECK", "SIGN"] },
        ],
    },
    {
        groups: [
            { category: "___ BAR", difficulty: 'blue', words: ["CROW", "SAND", "HANDLE", "SIDE"] },
            { category: "TYPES OF TRIANGLE", difficulty: 'green', words: ["EQUILATERAL", "ISOSCELES", "SCALENE", "RIGHT"] },
            { category: "TYPES OF CITRUS FRUIT", difficulty: 'yellow', words: ["ORANGE", "LIME", "GRAPEFRUIT", "TANGERINE"] },
            { category: "TYPES OF DANCE", difficulty: 'yellow', words: ["TANGO", "WALTZ", "SALSA", "FOXTROT"] },
            { category: "MUSICAL INSTRUMENTS", difficulty: 'yellow', words: ["TRUMPET", "VIOLIN", "CLARINET", "DRUMS"] },
            { category: "___ LIGHT", difficulty: 'blue', words: ["MOON", "SUN", "DAY", "FLASH"] },
        ],
    },
    {
        groups: [
            { category: "ANAGRAM OF A DIFFERENT WORD", difficulty: 'purple', words: ["MASTER", "NOTES", "NAMED", "NEAT"] },
            { category: "HOMOPHONES OF BODY PARTS", difficulty: 'purple', words: ["HEAL", "NAVAL", "HARE", "MUSSEL"] },
            { category: "SILENT FIRST LETTER", difficulty: 'purple', words: ["KNOT", "GNOME", "PSALM", "WRIST"] },
            { category: "___ CAST", difficulty: 'blue', words: ["BROAD", "FORE", "POD", "OVER"] },
            { category: "TYPES OF KNOT", difficulty: 'green', words: ["BOWLINE", "GRANNY", "SQUARE", "SLIPKNOT"] },
            { category: "TYPES OF CLOUD", difficulty: 'yellow', words: ["CUMULUS", "CIRRUS", "STRATUS", "NIMBUS"] },
        ],
    },
    {
        groups: [
            { category: "___ BOW", difficulty: 'blue', words: ["RAIN", "EL", "LONG", "CROSS"] },
            { category: "OCEANS", difficulty: 'yellow', words: ["PACIFIC", "ATLANTIC", "INDIAN", "ARCTIC"] },
            { category: "CHEMICAL ELEMENTS", difficulty: 'green', words: ["OXYGEN", "HYDROGEN", "CARBON", "NITROGEN"] },
            { category: "UNITS OF TIME", difficulty: 'green', words: ["SECOND", "MINUTE", "HOUR", "DECADE"] },
            { category: "___ GUARD", difficulty: 'blue', words: ["BODY", "LIFE", "VAN", "SAFE"] },
            { category: "HIDE A DRINK", difficulty: 'purple', words: ["RUMOR", "GINGER", "PALER", "SUPPORT"] },
        ],
    },
    {
        groups: [
            { category: "CONTAINS A SILENT LETTER", difficulty: 'purple', words: ["HONOR", "LISTEN", "CASTLE", "CORPS"] },
            { category: "___ KEEPER", difficulty: 'blue', words: ["GATE", "BEE", "HOUSE", "GOAL"] },
            { category: "___ CAKE", difficulty: 'blue', words: ["CUP", "PAN", "FRUIT", "CHEESE"] },
            { category: "TYPES OF PEPPER", difficulty: 'yellow', words: ["JALAPENO", "HABANERO", "CAYENNE", "POBLANO"] },
            { category: "___ LINE", difficulty: 'blue', words: ["HEAD", "DEAD", "BASE", "HAIR"] },
            { category: "___ ROOM", difficulty: 'blue', words: ["BATH", "BED", "CLASS", "LOCKER"] },
        ],
    },
];

module.exports = connectionsPuzzles;
