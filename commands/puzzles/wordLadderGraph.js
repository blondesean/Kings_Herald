/* Word-ladder helpers: the dictionary and the "one letter apart" graph over it.
 *
 * The dictionary is wordLadderWords.txt in this directory: every word of 3-7
 * letters from ENABLE ("Enhanced North American Benchmark Lexicon", the
 * public-domain Scrabble-style word list), lowercase, one per line, no proper
 * nouns or abbreviations. It is read once on first use and indexed by length,
 * since a ladder never changes a word's length.
 *
 * Exposes:
 *   isWord(word)                          - is it in the dictionary
 *   differsByOneLetter(a, b)              - same length, exactly one position differs
 *   shortestPath(start, target, blocked)  - a shortest ladder, array of words
 *                                           (start and target included), or null
 *   remainingDistance(tail, target, used) - fewest words still needed from
 *                                           `tail` to reach `target` without
 *                                           reusing anything in `used`, or Infinity
 *   countShortestPaths(start, target)     - how many distinct shortest ladders
 *                                           exist (for vetting puzzles)
 * All words go in and come out lowercase.
 */

const fs = require('fs');
const path = require('path');

const WORDS_FILE = path.join(__dirname, 'wordLadderWords.txt');
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

let wordsByLength = null;

const load = () => {
    if (wordsByLength) return wordsByLength;
    wordsByLength = new Map();
    for (const word of fs.readFileSync(WORDS_FILE, 'utf8').split(/\r?\n/)) {
        if (!word) continue;
        if (!wordsByLength.has(word.length)) wordsByLength.set(word.length, new Set());
        wordsByLength.get(word.length).add(word);
    }
    return wordsByLength;
};

const wordsOfLength = (length) => load().get(length) || new Set();

const isWord = (word) => wordsOfLength(word.length).has(word);

const differsByOneLetter = (a, b) => {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) diff += 1;
        if (diff > 1) return false;
    }
    return diff === 1;
};

// Every dictionary word one letter away from `word`.
const neighbors = (word) => {
    const dictionary = wordsOfLength(word.length);
    const found = [];
    for (let i = 0; i < word.length; i++) {
        for (const letter of ALPHABET) {
            if (letter === word[i]) continue;
            const candidate = word.slice(0, i) + letter + word.slice(i + 1);
            if (dictionary.has(candidate)) found.push(candidate);
        }
    }
    return found;
};

// Breadth-first distances from `source` to every reachable word, never
// stepping onto anything in `blocked`.
const distancesFrom = (source, blocked = new Set()) => {
    const dist = new Map([[source, 0]]);
    const queue = [source];
    for (let head = 0; head < queue.length; head++) {
        const word = queue[head];
        for (const next of neighbors(word)) {
            if (dist.has(next) || blocked.has(next)) continue;
            dist.set(next, dist.get(word) + 1);
            queue.push(next);
        }
    }
    return dist;
};

const shortestPath = (start, target, blocked = new Set()) => {
    // Search backward from the target so the path can be read off forward.
    const dist = distancesFrom(target, blocked);
    if (!dist.has(start)) return null;
    const ladder = [start];
    let current = start;
    while (current !== target) {
        current = neighbors(current)
            .filter((n) => dist.has(n) && dist.get(n) === dist.get(current) - 1)
            .sort()[0];
        ladder.push(current);
    }
    return ladder;
};

// Words still to be added to reach `target` from `tail`, staying off `used`
// (the chain so far, which includes `tail`). 0 means tail is the target.
const remainingDistance = (tail, target, used) => {
    if (tail === target) return 0;
    const dist = distancesFrom(target, used);
    let best = Infinity;
    for (const n of neighbors(tail)) {
        if (dist.has(n)) best = Math.min(best, dist.get(n) + 1);
    }
    return best;
};

const countShortestPaths = (start, target) => {
    const dist = distancesFrom(target);
    if (!dist.has(start)) return 0;
    const counts = new Map([[start, 1]]);
    let frontier = [start];
    while (frontier.length && !frontier.includes(target)) {
        const nextCounts = new Map();
        for (const word of frontier) {
            for (const n of neighbors(word)) {
                if (dist.get(n) === dist.get(word) - 1) nextCounts.set(n, (nextCounts.get(n) || 0) + counts.get(word));
            }
        }
        nextCounts.forEach((v, k) => counts.set(k, v));
        frontier = [...nextCounts.keys()];
    }
    return counts.get(target) || 0;
};

module.exports = { isWord, differsByOneLetter, shortestPath, remainingDistance, countShortestPaths };
