/* Puzzle bank for the daily Word Ladder (see wordLadder.js in this
 * directory). Each entry is a start word, a target word of the same length,
 * and one `route` between them — the start, every word in between, and the
 * target — which the Herald reveals if the court fails. The route is only an
 * example: players can take any path through real words (see
 * wordLadderGraph.js), so any valid ladder counts.
 *
 * Every puzzle was vetted the same way: both words are ordinary (not
 * profanity, not a name, not an inflected form like "-s" or "-ed"), and a
 * route of 3 or 4 steps exists using only everyday words, with at least one
 * other everyday-word route too. That keeps the game's 6-step limit
 * comfortable even after a wasted word, and it means a puzzle can be won
 * without knowing obscure Scrabble words (the dictionary that judges guesses
 * is far more permissive than that). Words are uppercase for display.
 * Lengths run from 3 to 6 letters; a ladder never changes a word's length.
 *
 * To add one, check that both words are in wordLadderWords.txt, that the
 * shortest everyday route is 3 or 4 steps, and that every word of `route`
 * differs from its neighbor by exactly one letter.
 */
const wordLadderPuzzles = () => [
    { start: 'COLD', target: 'WARM', route: ['COLD', 'CORD', 'WORD', 'WARD', 'WARM'] },
    { start: 'CATCH', target: 'PUNCH', route: ['CATCH', 'PATCH', 'PITCH', 'PINCH', 'PUNCH'] },
    { start: 'CAT', target: 'ROD', route: ['CAT', 'RAT', 'ROT', 'ROD'] },
    { start: 'BANKER', target: 'LETTER', route: ['BANKER', 'BANTER', 'BATTER', 'BETTER', 'LETTER'] },
    { start: 'WIND', target: 'FIRE', route: ['WIND', 'FIND', 'FINE', 'FIRE'] },
    { start: 'CLOCK', target: 'SHACK', route: ['CLOCK', 'BLOCK', 'BLACK', 'SLACK', 'SHACK'] },
    { start: 'PEG', target: 'TIE', route: ['PEG', 'PIG', 'PIE', 'TIE'] },
    { start: 'MATTER', target: 'POSTER', route: ['MATTER', 'MASTER', 'FASTER', 'FOSTER', 'POSTER'] },
    { start: 'SAND', target: 'ROCK', route: ['SAND', 'SANK', 'SACK', 'RACK', 'ROCK'] },
    { start: 'SHORT', target: 'STAKE', route: ['SHORT', 'SHORE', 'SHARE', 'SHAKE', 'STAKE'] },
    { start: 'HIT', target: 'TOP', route: ['HIT', 'HOT', 'HOP', 'TOP'] },
    { start: 'BUTTER', target: 'MASTER', route: ['BUTTER', 'BATTER', 'MATTER', 'MASTER'] },
    { start: 'MILK', target: 'WINE', route: ['MILK', 'MILE', 'MINE', 'WINE'] },
    { start: 'LASER', target: 'RIVER', route: ['LASER', 'LOSER', 'LOVER', 'LIVER', 'RIVER'] },
    { start: 'BITTER', target: 'MISTER', route: ['BITTER', 'SITTER', 'SISTER', 'MISTER'] },
    { start: 'FARM', target: 'BARN', route: ['FARM', 'WARM', 'WARN', 'BARN'] },
    { start: 'COVER', target: 'DINER', route: ['COVER', 'LOVER', 'LIVER', 'DIVER', 'DINER'] },
    { start: 'SONG', target: 'BAND', route: ['SONG', 'SANG', 'SAND', 'BAND'] },
    { start: 'GRADE', target: 'TRUCK', route: ['GRADE', 'GRACE', 'TRACE', 'TRACK', 'TRUCK'] },
    { start: 'BALL', target: 'GAME', route: ['BALL', 'GALL', 'GALE', 'GAME'] },
    { start: 'STAGE', target: 'STOCK', route: ['STAGE', 'STARE', 'STARK', 'STACK', 'STOCK'] },
    { start: 'COIN', target: 'GOLD', route: ['COIN', 'CORN', 'CORD', 'COLD', 'GOLD'] },
    { start: 'BUNCH', target: 'WITCH', route: ['BUNCH', 'PUNCH', 'PINCH', 'PITCH', 'WITCH'] },
    { start: 'MATE', target: 'YARD', route: ['MATE', 'MARE', 'CARE', 'CARD', 'YARD'] },
    { start: 'SHARK', target: 'STONE', route: ['SHARK', 'SHARE', 'SHORE', 'STORE', 'STONE'] },
    { start: 'CANE', target: 'WIND', route: ['CANE', 'LANE', 'LINE', 'WINE', 'WIND'] },
    { start: 'BLACK', target: 'CHICK', route: ['BLACK', 'BLOCK', 'CLOCK', 'CLICK', 'CHICK'] },
    { start: 'HEEL', target: 'LEAN', route: ['HEEL', 'HEAL', 'HEAD', 'LEAD', 'LEAN'] },
    { start: 'DOUGH', target: 'PORCH', route: ['DOUGH', 'TOUGH', 'TOUCH', 'TORCH', 'PORCH'] },
    { start: 'FIVE', target: 'RATE', route: ['FIVE', 'GIVE', 'GAVE', 'GATE', 'RATE'] },
    { start: 'POOL', target: 'TALE', route: ['POOL', 'TOOL', 'TOLL', 'TALL', 'TALE'] },
    { start: 'MINE', target: 'PULL', route: ['MINE', 'MILE', 'PILE', 'PILL', 'PULL'] },
    { start: 'SIDE', target: 'WORN', route: ['SIDE', 'WIDE', 'WIRE', 'WORE', 'WORN'] },
    { start: 'CAST', target: 'POLE', route: ['CAST', 'PAST', 'POST', 'POSE', 'POLE'] },
    { start: 'PORT', target: 'WOOD', route: ['PORT', 'PORK', 'WORK', 'WORD', 'WOOD'] },
    { start: 'BORE', target: 'HAND', route: ['BORE', 'BONE', 'BOND', 'BAND', 'HAND'] },
    { start: 'HUNT', target: 'WEST', route: ['HUNT', 'RUNT', 'RENT', 'WENT', 'WEST'] },
    { start: 'HIRE', target: 'RING', route: ['HIRE', 'WIRE', 'WINE', 'WING', 'RING'] },
    { start: 'ROPE', target: 'WAKE', route: ['ROPE', 'COPE', 'COKE', 'CAKE', 'WAKE'] },
    { start: 'LOSE', target: 'MOLD', route: ['LOSE', 'LOVE', 'MOVE', 'MOLE', 'MOLD'] },
    { start: 'HERD', target: 'WIDE', route: ['HERD', 'HERE', 'WERE', 'WIRE', 'WIDE'] },
    { start: 'BASE', target: 'POKE', route: ['BASE', 'CASE', 'CAKE', 'COKE', 'POKE'] },
    { start: 'DATE', target: 'HOPE', route: ['DATE', 'DAME', 'DOME', 'HOME', 'HOPE'] },
    { start: 'DUST', target: 'ROLE', route: ['DUST', 'RUST', 'RUSE', 'ROSE', 'ROLE'] },
    { start: 'TEAR', target: 'WEEP', route: ['TEAR', 'WEAR', 'WEAK', 'WEEK', 'WEEP'] },
    { start: 'PILE', target: 'SICK', route: ['PILE', 'PINE', 'PINK', 'PICK', 'SICK'] },
    { start: 'LOCK', target: 'RARE', route: ['LOCK', 'ROCK', 'RACK', 'RACE', 'RARE'] },
    { start: 'FILE', target: 'LATE', route: ['FILE', 'FINE', 'LINE', 'LANE', 'LATE'] },
    { start: 'DULL', target: 'MELT', route: ['DULL', 'FULL', 'FELL', 'FELT', 'MELT'] },
    { start: 'BOLT', target: 'CORN', route: ['BOLT', 'BOLD', 'COLD', 'CORD', 'CORN'] },
    { start: 'FOOT', target: 'HOLD', route: ['FOOT', 'FOOD', 'HOOD', 'HOLD'] },
    { start: 'BAKE', target: 'MICE', route: ['BAKE', 'MAKE', 'MIKE', 'MICE'] },
    { start: 'BEND', target: 'REED', route: ['BEND', 'SEND', 'SEED', 'REED'] },
    { start: 'LAKE', target: 'RACK', route: ['LAKE', 'LACE', 'RACE', 'RACK'] },
    { start: 'LENS', target: 'REST', route: ['LENS', 'LENT', 'RENT', 'REST'] },
    { start: 'TONE', target: 'WINE', route: ['TONE', 'NONE', 'NINE', 'WINE'] },
    { start: 'SAFE', target: 'TAPE', route: ['SAFE', 'SAKE', 'TAKE', 'TAPE'] },
    { start: 'CROW', target: 'SLOW', route: ['CROW', 'CHOW', 'SHOW', 'SLOW'] },
    { start: 'FELL', target: 'TAIL', route: ['FELL', 'TELL', 'TALL', 'TAIL'] },
    { start: 'SALT', target: 'TALL', route: ['SALT', 'HALT', 'HALL', 'TALL'] },
    { start: 'BEAT', target: 'SEND', route: ['BEAT', 'SEAT', 'SENT', 'SEND'] },
    { start: 'PILL', target: 'SELL', route: ['PILL', 'WILL', 'WELL', 'SELL'] },
];

module.exports = wordLadderPuzzles;
