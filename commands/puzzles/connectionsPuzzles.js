/* Puzzle bank for a future daily Connections-style puzzle (see the
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
 * Each puzzle is { groups: [ { category, difficulty, words } x4 ] } — 16
 * total words across 4 groups of 4, no word repeated within a puzzle.
 * `difficulty` follows the NYT-popularized yellow/green/blue/purple
 * convention (easiest to hardest; purple is usually wordplay-based rather
 * than a plain category) purely as a familiar shorthand for tuning — it's
 * not itself copyrightable, just a common difficulty-tier label.
 */
const connectionsPuzzles = () => [
    {
        groups: [
            { category: 'TYPES OF BREAD', difficulty: 'yellow', words: ['BAGUETTE', 'SOURDOUGH', 'RYE', 'BRIOCHE'] },
            { category: 'CHESS PIECES', difficulty: 'green', words: ['KNIGHT', 'BISHOP', 'ROOK', 'PAWN'] },
            { category: '___ STORM', difficulty: 'blue', words: ['BRAIN', 'SAND', 'THUNDER', 'HAIL'] },
            { category: 'HOMOPHONES OF NUMBERS', difficulty: 'purple', words: ['WON', 'FOR', 'ATE', 'TOO'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF DANCE', difficulty: 'yellow', words: ['TANGO', 'WALTZ', 'SALSA', 'FOXTROT'] },
            { category: 'KITCHEN APPLIANCES', difficulty: 'green', words: ['BLENDER', 'TOASTER', 'KETTLE', 'MIXER'] },
            { category: '___ RING', difficulty: 'blue', words: ['KEY', 'EAR', 'WEDDING', 'BOXING'] },
            { category: 'SILENT FIRST LETTER', difficulty: 'purple', words: ['KNOT', 'GNOME', 'PSALM', 'WRIST'] },
        ],
    },
    {
        groups: [
            { category: 'PLANETS', difficulty: 'yellow', words: ['VENUS', 'MARS', 'SATURN', 'NEPTUNE'] },
            { category: 'ROMAN GODDESSES', difficulty: 'green', words: ['JUNO', 'VESTA', 'CERES', 'MINERVA'] },
            { category: '___SCAPE', difficulty: 'blue', words: ['LAND', 'SEA', 'CITY', 'MOON'] },
            { category: 'HIDDEN COLOR', difficulty: 'purple', words: ['BLUEPRINT', 'GREENHOUSE', 'REDWOOD', 'BLACKSMITH'] },
        ],
    },
    {
        groups: [
            { category: 'FARM ANIMALS', difficulty: 'yellow', words: ['GOAT', 'SHEEP', 'PIG', 'HORSE'] },
            { category: 'CARD GAMES', difficulty: 'green', words: ['POKER', 'BRIDGE', 'RUMMY', 'EUCHRE'] },
            { category: '___HOUSE', difficulty: 'blue', words: ['GREEN', 'LIGHT', 'WARE', 'FARM'] },
            { category: 'SPELL A DIFFERENT WORD BACKWARDS', difficulty: 'purple', words: ['STRESSED', 'DRAWER', 'STOP', 'LOOT'] },
        ],
    },
    {
        groups: [
            { category: 'OCEANS', difficulty: 'yellow', words: ['PACIFIC', 'ATLANTIC', 'INDIAN', 'ARCTIC'] },
            { category: 'TYPES OF KNOT', difficulty: 'green', words: ['BOWLINE', 'GRANNY', 'SQUARE', 'SLIPKNOT'] },
            { category: '___ FALL', difficulty: 'blue', words: ['RAIN', 'WATER', 'NIGHT', 'DOWN'] },
            { category: 'HIDE A COMPASS DIRECTION', difficulty: 'purple', words: ['EASTER', 'WESTERN', 'NORTHERN', 'SOUTHERN'] },
        ],
    },
    {
        groups: [
            { category: 'MUSICAL INSTRUMENTS', difficulty: 'yellow', words: ['TRUMPET', 'VIOLIN', 'CLARINET', 'DRUMS'] },
            { category: 'TYPES OF PASTA', difficulty: 'green', words: ['PENNE', 'FUSILLI', 'LINGUINE', 'RIGATONI'] },
            { category: '___ BAND', difficulty: 'blue', words: ['RUBBER', 'ARM', 'HEAD', 'WRIST'] },
            { category: 'HIDE A SMALLER ANIMAL', difficulty: 'purple', words: ['CATASTROPHE', 'DOGMATIC', 'RATIONAL', 'COWARDLY'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF TEA', difficulty: 'yellow', words: ['CHAMOMILE', 'OOLONG', 'EARL GREY', 'MATCHA'] },
            { category: 'BOARD GAMES', difficulty: 'green', words: ['MONOPOLY', 'SCRABBLE', 'CLUEDO', 'RISK'] },
            { category: '___ WORK', difficulty: 'blue', words: ['HOME', 'NET', 'FRAME', 'ART'] },
            { category: 'ANAGRAM OF ANOTHER COMMON WORD', difficulty: 'purple', words: ['EARTH', 'NIGHT', 'STATE', 'MEAT'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF CLOUD', difficulty: 'yellow', words: ['CUMULUS', 'CIRRUS', 'STRATUS', 'NIMBUS'] },
            { category: 'GREEK LETTERS', difficulty: 'green', words: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'] },
            { category: '___ LIGHT', difficulty: 'blue', words: ['MOON', 'SUN', 'DAY', 'FLASH'] },
            { category: 'HOMOPHONES OF LETTERS', difficulty: 'purple', words: ['SEA', 'BEE', 'JAY', 'ARE'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF SANDWICH', difficulty: 'yellow', words: ['CLUB', 'REUBEN', 'GYRO', 'PANINI'] },
            { category: 'MARTIAL ARTS', difficulty: 'green', words: ['KARATE', 'JUDO', 'AIKIDO', 'TAEKWONDO'] },
            { category: '___ CAKE', difficulty: 'blue', words: ['CUP', 'PAN', 'FRUIT', 'CHEESE'] },
            { category: 'HIDE A NUMBER', difficulty: 'purple', words: ['ATTENTION', 'HONEST', 'TWOFOLD', 'CANINE'] },
        ],
    },
    {
        groups: [
            { category: 'PRECIOUS METALS', difficulty: 'yellow', words: ['GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM'] },
            { category: 'SHAKESPEARE PLAYS', difficulty: 'green', words: ['HAMLET', 'MACBETH', 'OTHELLO', 'TEMPEST'] },
            { category: '___ FISH', difficulty: 'blue', words: ['CAT', 'SWORD', 'JELLY', 'STAR'] },
            { category: 'ANAGRAM OF A DIFFERENT WORD', difficulty: 'purple', words: ['LEMON', 'STAPLE', 'SILENT', 'ANGERED'] },
        ],
    },
    {
        groups: [
            { category: 'SEASONS', difficulty: 'yellow', words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'] },
            { category: 'POKER HANDS', difficulty: 'green', words: ['FLUSH', 'STRAIGHT', 'PAIR', 'FULL HOUSE'] },
            { category: '___ TIME', difficulty: 'blue', words: ['BED', 'DAY', 'LIFE', 'OVER'] },
            { category: 'HOMOPHONES OF BODY PARTS', difficulty: 'purple', words: ['HEAL', 'NAVAL', 'HARE', 'MUSSEL'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF CITRUS FRUIT', difficulty: 'yellow', words: ['ORANGE', 'LIME', 'GRAPEFRUIT', 'TANGERINE'] },
            { category: 'TYPES OF DINOSAUR', difficulty: 'green', words: ['TRICERATOPS', 'STEGOSAURUS', 'VELOCIRAPTOR', 'BRONTOSAURUS'] },
            { category: '___ BOW', difficulty: 'blue', words: ['RAIN', 'EL', 'LONG', 'CROSS'] },
            { category: 'HIDE A FRUIT', difficulty: 'purple', words: ['GRAPEVINE', 'PLUMBER', 'IMPEACH', 'DATEBOOK'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF CHEESE', difficulty: 'yellow', words: ['CHEDDAR', 'GOUDA', 'BRIE', 'FETA'] },
            { category: 'CONSTELLATIONS', difficulty: 'green', words: ['ORION', 'PEGASUS', 'HERCULES', 'PERSEUS'] },
            { category: '___ SHOT', difficulty: 'blue', words: ['LONG', 'GUN', 'SNAP', 'MUG'] },
            { category: 'HIDE A DRINK', difficulty: 'purple', words: ['RUMOR', 'GINGER', 'PALER', 'SUPPORT'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF HAT', difficulty: 'yellow', words: ['FEDORA', 'BERET', 'SOMBRERO', 'BEANIE'] },
            { category: 'UNITS OF TIME', difficulty: 'green', words: ['SECOND', 'MINUTE', 'HOUR', 'DECADE'] },
            { category: '___ CAST', difficulty: 'blue', words: ['BROAD', 'FORE', 'POD', 'OVER'] },
            { category: 'HIDE A UNIT OF TIME', difficulty: 'purple', words: ['MINUTEMAN', 'SECONDARY', 'HOURGLASS', 'DECADENT'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF SHOE', difficulty: 'yellow', words: ['SNEAKER', 'LOAFER', 'SANDAL', 'BOOT'] },
            { category: 'CHEMICAL ELEMENTS', difficulty: 'green', words: ['OXYGEN', 'HYDROGEN', 'CARBON', 'NITROGEN'] },
            { category: '___ WORM', difficulty: 'blue', words: ['EARTH', 'BOOK', 'SILK', 'TAPE'] },
            { category: 'HIDE AN INSECT', difficulty: 'purple', words: ['ANTIQUE', 'BEETROOT', 'FLYWHEEL', 'MOTHBALL'] },
        ],
    },
    {
        groups: [
            { category: 'ICE CREAM FLAVORS', difficulty: 'yellow', words: ['VANILLA', 'CHOCOLATE', 'STRAWBERRY', 'PISTACHIO'] },
            { category: 'TYPES OF TRIANGLE', difficulty: 'green', words: ['EQUILATERAL', 'ISOSCELES', 'SCALENE', 'RIGHT'] },
            { category: '___ PRINT', difficulty: 'blue', words: ['FOOT', 'FINGER', 'BLUE', 'NEWS'] },
            { category: 'ANAGRAM OF A DIFFERENT WORD', difficulty: 'purple', words: ['DUSTY', 'ANGLE', 'TRIED', 'SPARE'] },
        ],
    },
    {
        groups: [
            { category: 'PIZZA TOPPINGS', difficulty: 'yellow', words: ['PEPPERONI', 'MUSHROOM', 'OLIVE', 'ANCHOVY'] },
            { category: 'ROOMS IN A HOUSE', difficulty: 'green', words: ['KITCHEN', 'ATTIC', 'CELLAR', 'PANTRY'] },
            { category: '___ ROOM', difficulty: 'blue', words: ['BATH', 'BED', 'CLASS', 'LOCKER'] },
            { category: 'CONTAINS A SILENT LETTER', difficulty: 'purple', words: ['DEBT', 'ISLAND', 'RECEIPT', 'AUTUMN'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF NUT', difficulty: 'yellow', words: ['ALMOND', 'CASHEW', 'PECAN', 'WALNUT'] },
            { category: 'ROCK CLIMBING TERMS', difficulty: 'green', words: ['BELAY', 'CARABINER', 'CRUX', 'ANCHOR'] },
            { category: '___ NUT', difficulty: 'blue', words: ['DOUGH', 'PEA', 'COCO', 'CHEST'] },
            { category: 'SPELLS A DIFFERENT WORD BACKWARDS', difficulty: 'purple', words: ['DENIM', 'REPAID', 'STRAW', 'DEVIL'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF BOAT', difficulty: 'yellow', words: ['CANOE', 'KAYAK', 'YACHT', 'SCHOONER'] },
            { category: 'PARTS OF A CASTLE', difficulty: 'green', words: ['TURRET', 'MOAT', 'DRAWBRIDGE', 'PARAPET'] },
            { category: '___ KEEPER', difficulty: 'blue', words: ['GATE', 'BEE', 'HOUSE', 'GOAL'] },
            { category: 'HIDE A ROYAL TITLE', difficulty: 'purple', words: ['KINGFISHER', 'DUKEDOM', 'PRINCESS', 'PEARLY'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF SOUP', difficulty: 'yellow', words: ['MINESTRONE', 'BISQUE', 'CHOWDER', 'GAZPACHO'] },
            { category: 'PARTS OF A TREE', difficulty: 'green', words: ['TRUNK', 'BRANCH', 'ROOT', 'CANOPY'] },
            { category: '___ STONE', difficulty: 'blue', words: ['LIME', 'MILE', 'KEY', 'CORNER'] },
            { category: 'HOMOPHONES OF TREES', difficulty: 'purple', words: ['BEACH', 'FUR', 'EWE', 'PLAIN'] },
        ],
    },
    {
        groups: [
            { category: 'KEYBOARD KEYS', difficulty: 'yellow', words: ['SHIFT', 'SPACE', 'ENTER', 'TAB'] },
            { category: 'WEATHER PHENOMENA', difficulty: 'green', words: ['DROUGHT', 'BLIZZARD', 'MONSOON', 'CYCLONE'] },
            { category: '___ BAR', difficulty: 'blue', words: ['CROW', 'SAND', 'HANDLE', 'SIDE'] },
            { category: 'ANAGRAM OF A DIFFERENT WORD', difficulty: 'purple', words: ['MASTER', 'NOTES', 'NAMED', 'NEAT'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF PIE', difficulty: 'yellow', words: ['PUMPKIN', 'PECAN', 'APPLE', 'CHERRY'] },
            { category: 'BASEBALL POSITIONS', difficulty: 'green', words: ['PITCHER', 'CATCHER', 'SHORTSTOP', 'OUTFIELDER'] },
            { category: '___ FIELD', difficulty: 'blue', words: ['BATTLE', 'OUT', 'MINE', 'AIR'] },
            { category: 'CONTAINS A SILENT LETTER', difficulty: 'purple', words: ['HONOR', 'LISTEN', 'CASTLE', 'CORPS'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF BICYCLE', difficulty: 'yellow', words: ['MOUNTAIN', 'ROAD', 'TANDEM', 'UNICYCLE'] },
            { category: 'PARTS OF A SHIP', difficulty: 'green', words: ['HULL', 'BOW', 'STERN', 'MAST'] },
            { category: '___ MATE', difficulty: 'blue', words: ['CLASS', 'ROOM', 'CHECK', 'SOUL'] },
            { category: 'HIDE A BODY PART', difficulty: 'purple', words: ['SHINE', 'EARNEST', 'HIPPOPOTAMUS', 'ARMISTICE'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF SALAD', difficulty: 'yellow', words: ['CAESAR', 'COBB', 'WALDORF', 'GREEK'] },
            { category: 'PARTS OF A FLOWER', difficulty: 'green', words: ['PETAL', 'STEM', 'STAMEN', 'PISTIL'] },
            { category: '___ POT', difficulty: 'blue', words: ['TEA', 'JACK', 'CROCK', 'HONEY'] },
            { category: 'HIDE A COUNTRY', difficulty: 'purple', words: ['MALICIOUS', 'PERUSE', 'INCUBATE', 'ICELANDIC'] },
        ],
    },
    {
        groups: [
            { category: 'DOG BREEDS', difficulty: 'yellow', words: ['LABRADOR', 'POODLE', 'BEAGLE', 'TERRIER'] },
            { category: 'UNITS OF LENGTH', difficulty: 'green', words: ['INCH', 'FOOT', 'YARD', 'MILE'] },
            { category: '___ STICK', difficulty: 'blue', words: ['CHOP', 'LIP', 'DRUM', 'MATCH'] },
            { category: 'HOMOPHONES OF LETTERS', difficulty: 'purple', words: ['WHY', 'EX', 'CUE', 'EYE'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF MUSHROOM', difficulty: 'yellow', words: ['PORTOBELLO', 'SHIITAKE', 'CREMINI', 'MOREL'] },
            { category: 'TYPES OF WHALE', difficulty: 'green', words: ['HUMPBACK', 'ORCA', 'BELUGA', 'SPERM'] },
            { category: '___ BACK', difficulty: 'blue', words: ['HORSE', 'PIGGY', 'DRAW', 'SET'] },
            { category: 'ANAGRAM OF A DIFFERENT WORD', difficulty: 'purple', words: ['SPACE', 'TEACH', 'LEAST', 'CRATE'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF GUITAR', difficulty: 'yellow', words: ['ACOUSTIC', 'ELECTRIC', 'BASS', 'CLASSICAL'] },
            { category: 'PUNCTUATION MARKS', difficulty: 'green', words: ['COMMA', 'PERIOD', 'SEMICOLON', 'HYPHEN'] },
            { category: '___ MARK', difficulty: 'blue', words: ['BOOK', 'BENCH', 'TRADE', 'HALL'] },
            { category: 'CONTAINS A SILENT LETTER', difficulty: 'purple', words: ['KNIFE', 'GNAT', 'WRECK', 'SIGN'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF BEAR', difficulty: 'yellow', words: ['GRIZZLY', 'POLAR', 'PANDA', 'KODIAK'] },
            { category: 'KITCHEN UTENSILS', difficulty: 'green', words: ['WHISK', 'SPATULA', 'LADLE', 'TONGS'] },
            { category: '___ TRAP', difficulty: 'blue', words: ['MOUSE', 'SAND', 'BOOBY', 'SPEED'] },
            { category: 'SPELLS A DIFFERENT WORD BACKWARDS', difficulty: 'purple', words: ['SPOTS', 'EMIT', 'KNITS', 'DEER'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF JACKET', difficulty: 'yellow', words: ['BLAZER', 'PARKA', 'ANORAK', 'WINDBREAKER'] },
            { category: 'PARTS OF A GUITAR', difficulty: 'green', words: ['FRET', 'BRIDGE', 'NECK', 'STRING'] },
            { category: '___ PIT', difficulty: 'blue', words: ['ARM', 'FIRE', 'MOSH', 'TAR'] },
            { category: 'HIDE A MUSIC GENRE', difficulty: 'purple', words: ['ROCKET', 'POPULAR', 'SOULFUL', 'JAZZY'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF BUTTERFLY OR MOTH', difficulty: 'yellow', words: ['MONARCH', 'SWALLOWTAIL', 'LUNA', 'PAINTED LADY'] },
            { category: 'ROYAL COURT ROLES', difficulty: 'green', words: ['HERALD', 'CHAMBERLAIN', 'STEWARD', 'CHANCELLOR'] },
            { category: '___ GUARD', difficulty: 'blue', words: ['BODY', 'LIFE', 'VAN', 'SAFE'] },
            { category: 'HIDE A CHESS PIECE', difficulty: 'purple', words: ['PAWNSHOP', 'BISHOPRIC', 'ROOKIE', 'KNIGHTHOOD'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF PEPPER', difficulty: 'yellow', words: ['JALAPENO', 'HABANERO', 'CAYENNE', 'POBLANO'] },
            { category: 'SEWING TERMS', difficulty: 'green', words: ['THIMBLE', 'BOBBIN', 'SEAM', 'HEM'] },
            { category: '___ LINE', difficulty: 'blue', words: ['HEAD', 'DEAD', 'BASE', 'HAIR'] },
            { category: 'ANAGRAM OF A DIFFERENT WORD', difficulty: 'purple', words: ['TONE', 'RATE', 'CARES', 'FILES'] },
        ],
    },
    {
        groups: [
            { category: 'TYPES OF DRUM', difficulty: 'yellow', words: ['SNARE', 'BONGO', 'TIMPANI', 'DJEMBE'] },
            { category: 'FENCING WEAPONS', difficulty: 'green', words: ['FOIL', 'EPEE', 'SABRE', 'RAPIER'] },
            { category: '___ FIGHT', difficulty: 'blue', words: ['CAT', 'GUN', 'FIRE', 'BULL'] },
            { category: 'HIDE A WEAPON', difficulty: 'purple', words: ['SWORDFISH', 'ARROWROOT', 'SPEARMINT', 'DAGGERBOARD'] },
        ],
    },
];

module.exports = connectionsPuzzles;
