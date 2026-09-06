/* Word bank for a future daily Hangman-style puzzle (see the /puzzles
 * experiments tracked alongside connectionsPuzzles.js in this directory).
 * No game logic lives here yet — this is just the word list, split out
 * early so difficulty/content can be reviewed independently of how the game
 * itself gets built.
 *
 * Every entry is a single, common English dictionary word of at least 7
 * letters (no proper nouns, no spaces/hyphens) — originally compiled for
 * this project, not sourced from any external puzzle bank. Stored in
 * uppercase since that's how a hangman board conventionally reveals guessed
 * letters; the game layer can re-case for display however it wants.
 */
const hangmanWords = () => [
    'ELEPHANT', 'MOUNTAIN', 'CHAMPION', 'WHISTLE', 'CRYSTAL', 'JOURNEY', 'FESTIVAL',
    'UMBRELLA', 'SANDWICH', 'KEYBOARD', 'DOLPHIN', 'PYRAMID', 'VOLCANO', 'ASTRONAUT',
    'CHOCOLATE', 'ADVENTURE', 'TELESCOPE', 'BUTTERFLY', 'HURRICANE', 'LIGHTHOUSE',
    'WATERFALL', 'SNOWFLAKE', 'CARNIVAL', 'ORCHESTRA', 'LABYRINTH', 'SYMPHONY',
    'CATHEDRAL', 'DIAMOND', 'EMERALD', 'SAPPHIRE', 'TURQUOISE', 'PLATINUM',
    'MERCHANT', 'BLACKSMITH', 'CARPENTER', 'ALCHEMIST', 'WIZARDRY', 'KINGDOM',
    'FORTRESS', 'DRAGONFLY', 'CENTIPEDE', 'OCTOPUS', 'PENGUIN', 'GIRAFFE',
    'CROCODILE', 'CHAMELEON', 'HEDGEHOG', 'SQUIRREL', 'RACCOON', 'MEERKAT',
    'FLAMINGO', 'PELICAN', 'SEAHORSE', 'STARFISH', 'JELLYFISH', 'LOBSTER',
    'PISTACHIO', 'AVOCADO', 'PINEAPPLE', 'BLUEBERRY', 'STRAWBERRY', 'WATERMELON',
    'CANTALOUPE', 'APRICOT', 'ARTICHOKE', 'BROCCOLI', 'CAULIFLOWER', 'ASPARAGUS',
    'CUCUMBER', 'EGGPLANT', 'ZUCCHINI', 'PUMPKIN', 'CINNAMON', 'OREGANO',
    'ROSEMARY', 'LAVENDER', 'DAFFODIL', 'SUNFLOWER', 'MAGNOLIA', 'DANDELION',
    'BLIZZARD', 'TSUNAMI', 'EARTHQUAKE', 'AVALANCHE', 'MONSOON', 'THUNDER',
    'LIGHTNING', 'RAINBOW', 'HORIZON', 'ASTEROID', 'SATELLITE', 'COMPASS',
    'CATAPULT', 'TRIANGLE', 'HEXAGON', 'OCTAGON', 'PENTAGON', 'RECTANGLE',
    'CYLINDER', 'STADIUM', 'MARATHON', 'TOURNAMENT', 'CHAMPIONSHIP', 'REFEREE',
    'GOALKEEPER', 'BASKETBALL', 'VOLLEYBALL', 'BADMINTON', 'GYMNASTICS',
    'WRESTLING', 'SWIMMING', 'CYCLING', 'ARCHERY', 'FENCING', 'JAVELIN',
];

module.exports = hangmanWords;
