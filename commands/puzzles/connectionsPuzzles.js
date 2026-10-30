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
 *
 * The 23 puzzles after the revamp marker were written fresh, one difficulty
 * color at a time, to widen the bank beyond "___ WORD" blanks and anagrams.
 * They were packed so every board has at least one group of each color, no
 * word appears twice on a board, and closely related categories, such as
 * Norse gods and the gods behind the weekday names, never share one.
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
    // The revamp: see the header comment.
    {
        groups: [
            { category: "CAPITAL CITIES", difficulty: 'yellow', words: ["PARIS", "LONDON", "TOKYO", "ROME"] },
            { category: "GEMSTONES", difficulty: 'yellow', words: ["RUBY", "EMERALD", "SAPPHIRE", "TOPAZ"] },
            { category: "FRENCH SAUCES", difficulty: 'green', words: ["BECHAMEL", "HOLLANDAISE", "BEARNAISE", "VELOUTE"] },
            { category: "MOONS IN THE SOLAR SYSTEM", difficulty: 'green', words: ["TITAN", "EUROPA", "IO", "GANYMEDE"] },
            { category: "___ BREAKER", difficulty: 'blue', words: ["ICE", "TIE", "JAW", "HEART"] },
            { category: "ADD A LETTER TO THE FRONT TO MAKE A WEAPON", difficulty: 'purple', words: ["WORD", "PEAR", "ACE", "HIP"] },
        ],
    },
    {
        groups: [
            { category: "SCHOOL SUPPLIES", difficulty: 'yellow', words: ["PENCIL", "ERASER", "RULER", "BACKPACK"] },
            { category: "HOSPITAL JOBS", difficulty: 'yellow', words: ["NURSE", "SURGEON", "PARAMEDIC", "PHARMACIST"] },
            { category: "US STATE CAPITALS", difficulty: 'green', words: ["BOISE", "ALBANY", "AUSTIN", "DENVER"] },
            { category: "LANDLOCKED COUNTRIES", difficulty: 'blue', words: ["CHAD", "NEPAL", "BOLIVIA", "LAOS"] },
            { category: "HIDE A GREEK GOD", difficulty: 'purple', words: ["THERAPY", "SHADES", "SQUARES", "GENEROSITY"] },
            { category: "PALINDROMES", difficulty: 'purple', words: ["LEVEL", "REFER", "TENET", "STATS"] },
        ],
    },
    {
        groups: [
            { category: "AUSTRALIAN ANIMALS", difficulty: 'yellow', words: ["KANGAROO", "KOALA", "WOMBAT", "PLATYPUS"] },
            { category: "CARD SUITS", difficulty: 'yellow', words: ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"] },
            { category: "NOBLE GASES", difficulty: 'green', words: ["NEON", "ARGON", "XENON", "KRYPTON"] },
            { category: "PIECES OF ARMOR", difficulty: 'green', words: ["GAUNTLET", "VISOR", "GREAVES", "BREASTPLATE"] },
            { category: "BOWLING TERMS", difficulty: 'blue', words: ["TURKEY", "GUTTER", "SPLIT", "STRIKE"] },
            { category: "SOUNDS LIKE TWO LETTERS", difficulty: 'purple', words: ["ESSAY", "EXCEL", "CUTIE", "DECAY"] },
        ],
    },
    {
        groups: [
            { category: "WINTER OLYMPIC SPORTS", difficulty: 'yellow', words: ["BOBSLED", "CURLING", "LUGE", "BIATHLON"] },
            { category: "THINGS IN A GOLF BAG", difficulty: 'yellow', words: ["DRIVER", "PUTTER", "WEDGE", "TEE"] },
            { category: "FIRST GENERATION POKEMON", difficulty: 'green', words: ["PIKACHU", "BULBASAUR", "CHARMANDER", "SQUIRTLE"] },
            { category: "PAPER ___", difficulty: 'blue', words: ["CLIP", "TRAIL", "WEIGHT", "TIGER"] },
            { category: "SOUND LIKE DO RE MI NOTES", difficulty: 'purple', words: ["RAY", "FAR", "SEW", "ME"] },
            { category: "RHYMES WITH TWO", difficulty: 'purple', words: ["THROUGH", "GNU", "THREW", "ADIEU"] },
        ],
    },
    {
        groups: [
            { category: "CANDY BARS", difficulty: 'yellow', words: ["SNICKERS", "TWIX", "KITKAT", "BUTTERFINGER"] },
            { category: "SCIENCE LAB GEAR", difficulty: 'yellow', words: ["BEAKER", "MICROSCOPE", "GOGGLES", "PIPETTE"] },
            { category: "PARTS OF SPEECH", difficulty: 'green', words: ["NOUN", "VERB", "ADJECTIVE", "ADVERB"] },
            { category: "TENNIS TERMS", difficulty: 'green', words: ["DEUCE", "LOVE", "ACE", "VOLLEY"] },
            { category: "SLANG FOR MONEY", difficulty: 'blue', words: ["BREAD", "MOOLAH", "CLAMS", "SCRATCH"] },
            { category: "NATO ALPHABET WORDS", difficulty: 'purple', words: ["OSCAR", "LIMA", "UNIFORM", "WHISKEY"] },
        ],
    },
    {
        groups: [
            { category: "SHAPES", difficulty: 'yellow', words: ["CIRCLE", "OVAL", "HEXAGON", "PENTAGON"] },
            { category: "MARIO CHARACTERS", difficulty: 'yellow', words: ["LUIGI", "PEACH", "YOSHI", "BOWSER"] },
            { category: "AMERICAN MUSCLE CARS", difficulty: 'green', words: ["MUSTANG", "CORVETTE", "CAMARO", "CHARGER"] },
            { category: "SHADES OF RED", difficulty: 'blue', words: ["CARDINAL", "CRIMSON", "BURGUNDY", "MAROON"] },
            { category: "HIDE AN ANIMAL BACKWARDS", difficulty: 'purple', words: ["GUITAR", "TABLE", "PERFUME", "ATTACK"] },
            { category: "DROP THE FIRST LETTER TO FIND A TREE", difficulty: 'purple', words: ["HELM", "SOAK", "SPINE", "CASH"] },
        ],
    },
    {
        groups: [
            { category: "GREEK GODS", difficulty: 'yellow', words: ["ZEUS", "POSEIDON", "HADES", "APOLLO"] },
            { category: "SUPERHEROES", difficulty: 'yellow', words: ["BATMAN", "SUPERMAN", "SPIDERMAN", "WOLVERINE"] },
            { category: "WOW CAPITAL CITIES", difficulty: 'green', words: ["STORMWIND", "ORGRIMMAR", "IRONFORGE", "UNDERCITY"] },
            { category: "PARTS OF THE EAR", difficulty: 'blue', words: ["HAMMER", "ANVIL", "STIRRUP", "COCHLEA"] },
            { category: "WAYS TO SAY NONSENSE", difficulty: 'blue', words: ["BALDERDASH", "POPPYCOCK", "HOGWASH", "MALARKEY"] },
            { category: "STARTS WITH A FARM ANIMAL", difficulty: 'purple', words: ["PIGEON", "HENCHMAN", "GOATEE", "BULLETIN"] },
        ],
    },
    {
        groups: [
            { category: "MYTHICAL CREATURES", difficulty: 'yellow', words: ["DRAGON", "UNICORN", "GRIFFIN", "PHOENIX"] },
            { category: "STATES OF MATTER", difficulty: 'yellow', words: ["SOLID", "LIQUID", "GAS", "PLASMA"] },
            { category: "PEOPLE IN A COURTROOM", difficulty: 'green', words: ["JUDGE", "BAILIFF", "JUROR", "STENOGRAPHER"] },
            { category: "WORLD CURRENCIES", difficulty: 'green', words: ["PESO", "RUPEE", "YEN", "KRONA"] },
            { category: "___ CODE", difficulty: 'blue', words: ["MORSE", "ZIP", "DRESS", "CHEAT"] },
            { category: "NAMED AFTER A PERSON", difficulty: 'purple', words: ["CARDIGAN", "BOYCOTT", "LEOTARD", "SAXOPHONE"] },
        ],
    },
    {
        groups: [
            { category: "PLAYGROUND EQUIPMENT", difficulty: 'yellow', words: ["SWING", "SLIDE", "SEESAW", "SANDBOX"] },
            { category: "FURNITURE", difficulty: 'yellow', words: ["SOFA", "DRESSER", "BOOKSHELF", "RECLINER"] },
            { category: "ROMAN EMPERORS", difficulty: 'green', words: ["NERO", "CALIGULA", "AUGUSTUS", "HADRIAN"] },
            { category: "THINGS WITH SCALES", difficulty: 'green', words: ["PIANO", "MAP", "DRAGON", "PYTHON"] },
            { category: "FAMOUS HORSES", difficulty: 'blue', words: ["SECRETARIAT", "SEABISCUIT", "SHADOWFAX", "TRIGGER"] },
            { category: "INSTRUMENT PLUS ONE LETTER", difficulty: 'purple', words: ["SHARP", "BELLE", "THORN", "FLUTE"] },
        ],
    },
    {
        groups: [
            { category: "NFL TEAMS", difficulty: 'yellow', words: ["PATRIOTS", "COWBOYS", "PACKERS", "STEELERS"] },
            { category: "BIRTHDAY PARTY ITEMS", difficulty: 'yellow', words: ["BALLOON", "CANDLE", "PRESENT", "CONFETTI"] },
            { category: "GEN Z SLANG", difficulty: 'green', words: ["RIZZ", "BUSSIN", "SUS", "SKIBIDI"] },
            { category: "STAR WARS PLANETS", difficulty: 'blue', words: ["TATOOINE", "HOTH", "ENDOR", "NABOO"] },
            { category: "PARTS OF A BOOK", difficulty: 'blue', words: ["SPINE", "JACKET", "APPENDIX", "GLOSSARY"] },
            { category: "NO VOWELS", difficulty: 'purple', words: ["RHYTHM", "CRYPT", "NYMPH", "TRYST"] },
        ],
    },
    {
        groups: [
            { category: "MUSIC GENRES", difficulty: 'yellow', words: ["COUNTRY", "REGGAE", "BLUES", "DISCO"] },
            { category: "SEVEN DWARFS", difficulty: 'yellow', words: ["GRUMPY", "SLEEPY", "SNEEZY", "DOPEY"] },
            { category: "NOBLE TITLES", difficulty: 'green', words: ["BARON", "EARL", "VISCOUNT", "MARQUIS"] },
            { category: "BEATLES SONGS", difficulty: 'blue', words: ["YESTERDAY", "HELP", "SOMETHING", "MICHELLE"] },
            { category: "CONTAINS ALL FIVE VOWELS", difficulty: 'purple', words: ["SEQUOIA", "DIALOGUE", "EUPHORIA", "AUTHORIZE"] },
            { category: "LETTERS IN ALPHABETICAL ORDER", difficulty: 'purple', words: ["ALMOST", "BIOPSY", "CHINTZ", "GHOST"] },
        ],
    },
    {
        groups: [
            { category: "US STATES", difficulty: 'yellow', words: ["TEXAS", "OHIO", "FLORIDA", "MAINE"] },
            { category: "WAYS TO SAY GOODBYE", difficulty: 'yellow', words: ["ADIOS", "CIAO", "SAYONARA", "FAREWELL"] },
            { category: "THINGS WITH TEETH", difficulty: 'green', words: ["COMB", "SAW", "ZIPPER", "GEAR"] },
            { category: "OLD TRADES NOW SURNAMES", difficulty: 'blue', words: ["COOPER", "FLETCHER", "THATCHER", "TANNER"] },
            { category: "LETTERS IN REVERSE ALPHABETICAL ORDER", difficulty: 'purple', words: ["SPOON", "TROLLED", "WOLFED", "SPONGED"] },
            { category: "ALSO MEANS STEAL", difficulty: 'purple', words: ["NICK", "PINCH", "SWIPE", "POACH"] },
        ],
    },
    {
        groups: [
            { category: "HALLOWEEN MONSTERS", difficulty: 'yellow', words: ["VAMPIRE", "ZOMBIE", "WEREWOLF", "MUMMY"] },
            { category: "RESTAURANT JOBS", difficulty: 'yellow', words: ["CHEF", "WAITER", "BARTENDER", "DISHWASHER"] },
            { category: "EGYPTIAN GODS", difficulty: 'green', words: ["RA", "ANUBIS", "OSIRIS", "HORUS"] },
            { category: "FAMOUS SHIPS", difficulty: 'green', words: ["TITANIC", "MAYFLOWER", "BOUNTY", "LUSITANIA"] },
            { category: "FAMOUS FICTIONAL DOGS", difficulty: 'blue', words: ["PLUTO", "LASSIE", "ODIE", "TOTO"] },
            { category: "ADD A LETTER TO MAKE A COUNTRY", difficulty: 'purple', words: ["CAD", "CUB", "MALT", "RAN"] },
        ],
    },
    {
        groups: [
            { category: "CONTINENTS", difficulty: 'yellow', words: ["AFRICA", "ASIA", "EUROPE", "ANTARCTICA"] },
            { category: "BABY ANIMALS", difficulty: 'yellow', words: ["PUPPY", "KITTEN", "CUB", "DUCKLING"] },
            { category: "TYPES OF BREAD", difficulty: 'green', words: ["BAGUETTE", "CIABATTA", "BRIOCHE", "FOCACCIA"] },
            { category: "STATE CAPITALS THAT ARE FIRST NAMES", difficulty: 'blue', words: ["AUSTIN", "MADISON", "HELENA", "JACKSON"] },
            { category: "CLUE WEAPONS", difficulty: 'blue', words: ["CANDLESTICK", "REVOLVER", "WRENCH", "ROPE"] },
            { category: "ANAGRAM OF A COUNTRY", difficulty: 'purple', words: ["PURE", "PAINS", "MAIL", "MOAN"] },
        ],
    },
    {
        groups: [
            { category: "HOGWARTS HOUSES", difficulty: 'yellow', words: ["GRYFFINDOR", "SLYTHERIN", "HUFFLEPUFF", "RAVENCLAW"] },
            { category: "BREAKFAST FOODS", difficulty: 'yellow', words: ["PANCAKE", "WAFFLE", "OMELET", "BAGEL"] },
            { category: "TEMPO MARKINGS", difficulty: 'green', words: ["ALLEGRO", "ADAGIO", "ANDANTE", "PRESTO"] },
            { category: "MOUNTAIN RANGES", difficulty: 'green', words: ["ANDES", "ALPS", "HIMALAYAS", "ROCKIES"] },
            { category: "CHESS TACTICS", difficulty: 'blue', words: ["FORK", "PIN", "SKEWER", "GAMBIT"] },
            { category: "HOMOPHONES OF GREEK LETTERS", difficulty: 'purple', words: ["ROW", "PIE", "NEW", "SIGH"] },
        ],
    },
    {
        groups: [
            { category: "THINGS IN A TOOLBOX", difficulty: 'yellow', words: ["HAMMER", "WRENCH", "PLIERS", "SCREWDRIVER"] },
            { category: "COFFEE DRINKS", difficulty: 'yellow', words: ["LATTE", "MOCHA", "ESPRESSO", "CAPPUCCINO"] },
            { category: "ZODIAC SIGNS", difficulty: 'green', words: ["ARIES", "TAURUS", "GEMINI", "SCORPIO"] },
            { category: "KNIGHTS OF THE ROUND TABLE", difficulty: 'blue', words: ["LANCELOT", "GAWAIN", "GALAHAD", "PERCIVAL"] },
            { category: "WOW EXPANSIONS", difficulty: 'blue', words: ["LEGION", "CATACLYSM", "DRAGONFLIGHT", "SHADOWLANDS"] },
            { category: "ANIMALS THAT MEAN PESTER", difficulty: 'purple', words: ["BADGER", "HOUND", "BUG", "NAG"] },
        ],
    },
    {
        groups: [
            { category: "WOW CLASSES", difficulty: 'yellow', words: ["MAGE", "ROGUE", "DRUID", "WARLOCK"] },
            { category: "VIDEO GAME CONSOLES", difficulty: 'yellow', words: ["PLAYSTATION", "XBOX", "SWITCH", "GAMECUBE"] },
            { category: "COCKTAILS", difficulty: 'green', words: ["MOJITO", "MARGARITA", "DAIQUIRI", "NEGRONI"] },
            { category: "MYTHICAL MONSTERS", difficulty: 'blue', words: ["HYDRA", "CHIMERA", "CYCLOPS", "KRAKEN"] },
            { category: "TWO PRONUNCIATIONS TWO MEANINGS", difficulty: 'purple', words: ["DOVE", "WOUND", "TEAR", "DESERT"] },
            { category: "HOMOPHONES OF WEATHER", difficulty: 'purple', words: ["REIGN", "HALE", "MISSED", "WHETHER"] },
        ],
    },
    {
        groups: [
            { category: "WINTER ACCESSORIES", difficulty: 'yellow', words: ["SCARF", "MITTENS", "EARMUFFS", "GLOVES"] },
            { category: "SOCIAL MEDIA APPS", difficulty: 'yellow', words: ["INSTAGRAM", "TIKTOK", "FACEBOOK", "SNAPCHAT"] },
            { category: "GOLF SCORES", difficulty: 'green', words: ["BIRDIE", "EAGLE", "BOGEY", "ALBATROSS"] },
            { category: "FAMOUS SWORDS", difficulty: 'blue', words: ["EXCALIBUR", "FROSTMOURNE", "ANDURIL", "STING"] },
            { category: "STARTS WITH A BODY PART", difficulty: 'purple', words: ["LEGEND", "CHINCHILLA", "ARMADA", "SHINDIG"] },
            { category: "THINGS WITH SHELLS", difficulty: 'purple', words: ["TACO", "OYSTER", "EGG", "TORTOISE"] },
        ],
    },
    {
        groups: [
            { category: "TYPES OF BIRD", difficulty: 'yellow', words: ["EAGLE", "ROBIN", "SPARROW", "PELICAN"] },
            { category: "SOUTH AMERICAN CAPITALS", difficulty: 'green', words: ["LIMA", "QUITO", "SANTIAGO", "BOGOTA"] },
            { category: "BONES", difficulty: 'green', words: ["FEMUR", "TIBIA", "ULNA", "STERNUM"] },
            { category: "BOND FILMS", difficulty: 'blue', words: ["SKYFALL", "SPECTRE", "GOLDFINGER", "THUNDERBALL"] },
            { category: "FRIENDS CHARACTERS", difficulty: 'blue', words: ["CHANDLER", "PHOEBE", "MONICA", "JOEY"] },
            { category: "HIDE A CAR BRAND", difficulty: 'purple', words: ["AUDITION", "AFFORD", "MINISTER", "PROGRAM"] },
        ],
    },
    {
        groups: [
            { category: "CAR BRANDS", difficulty: 'yellow', words: ["TOYOTA", "HONDA", "FORD", "TESLA"] },
            { category: "BEATLES SURNAMES", difficulty: 'green', words: ["LENNON", "MCCARTNEY", "HARRISON", "STARR"] },
            { category: "THINGS WITH HORNS", difficulty: 'blue', words: ["RHINO", "UNICORN", "TRUCK", "IMPALA"] },
            { category: "THINGS WITH KEYS", difficulty: 'blue', words: ["PIANO", "TYPEWRITER", "FLORIDA", "LOCKSMITH"] },
            { category: "TWO SETS OF DOUBLE LETTERS", difficulty: 'purple', words: ["COFFEE", "BALLOON", "RACCOON", "SUCCESS"] },
            { category: "HIDE A WOW CLASS", difficulty: 'purple', words: ["DAMAGE", "MONKEY", "BROGUE", "HEADHUNTER"] },
        ],
    },
    {
        groups: [
            { category: "US COINS", difficulty: 'yellow', words: ["PENNY", "NICKEL", "DIME", "QUARTER"] },
            { category: "CAMPING GEAR", difficulty: 'yellow', words: ["TENT", "LANTERN", "COMPASS", "CANTEEN"] },
            { category: "SINGING VOICE TYPES", difficulty: 'green', words: ["SOPRANO", "ALTO", "TENOR", "BARITONE"] },
            { category: "STAR WARS CHARACTERS", difficulty: 'green', words: ["YODA", "CHEWBACCA", "LEIA", "VADER"] },
            { category: "PIXAR FILMS", difficulty: 'blue', words: ["UP", "CARS", "BRAVE", "ONWARD"] },
            { category: "SPELLED WITH ROMAN NUMERALS", difficulty: 'purple', words: ["MIMIC", "LIVID", "VIVID", "CIVIL"] },
        ],
    },
    {
        groups: [
            { category: "MONTHS", difficulty: 'yellow', words: ["MAY", "JUNE", "AUGUST", "MARCH"] },
            { category: "OLD COINS", difficulty: 'green', words: ["DOUBLOON", "DUCAT", "FARTHING", "SHILLING"] },
            { category: "SANTAS REINDEER", difficulty: 'green', words: ["DASHER", "DANCER", "PRANCER", "VIXEN"] },
            { category: "GODS BEHIND WEEKDAY NAMES", difficulty: 'blue', words: ["TYR", "WODEN", "THOR", "FRIGG"] },
            { category: "THINGS WITH NEEDLES", difficulty: 'blue', words: ["CACTUS", "COMPASS", "PORCUPINE", "PINE"] },
            { category: "ALSO MEANS COMPLAIN", difficulty: 'purple', words: ["CARP", "GROUSE", "BLEAT", "WHINE"] },
        ],
    },
    {
        groups: [
            { category: "THINGS IN A BATHROOM", difficulty: 'yellow', words: ["TOOTHBRUSH", "TOWEL", "SOAP", "BATHTUB"] },
            { category: "THE BEATLES", difficulty: 'yellow', words: ["JOHN", "PAUL", "GEORGE", "RINGO"] },
            { category: "GROUPS OF ANIMALS", difficulty: 'green', words: ["PRIDE", "MURDER", "GAGGLE", "PARLIAMENT"] },
            { category: "UNITS NAMED AFTER SCIENTISTS", difficulty: 'blue', words: ["NEWTON", "WATT", "KELVIN", "HERTZ"] },
            { category: "SOUNDS LIKE A PLURAL LETTER", difficulty: 'purple', words: ["SEIZE", "TEASE", "PEAS", "EASE"] },
            { category: "STARTS WITH A METAL", difficulty: 'purple', words: ["TINSEL", "IRONY", "LEADER", "NICKELODEON"] },
        ],
    },
];

module.exports = connectionsPuzzles;
