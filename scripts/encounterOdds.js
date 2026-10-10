/* Prints the encounter fairness tables, from the live rules and catalog in
 * commands/passive/encounter.js — rerun after any tuning:
 *
 *   npm run encounter-odds
 *
 * 1. Boss fit per entrant at each difficulty (each slot's cheapest item of
 *    that rarity, summed, times the tier's assumed kit coverage), the average
 *    member fit for 0% and 80% odds, and the tier's win cap.
 * 2. Win chance by party fit / boss fit for all-Balanced, all-Aggressive and
 *    all-Defensive parties (before each tier's cap).
 * 3. A grid: a party whose members average a given fit, against each
 *    difficulty (Balanced, tier caps applied).
 */

const { bossFitPerEntrant, winChance, STANCES, TIER_LOSS_FLOOR } = require('../commands/passive/encounter');
const { DIFFICULTIES, RAID } = require('../commands/passive/encounterBosses');
const { RARITIES } = require('../commands/passive/shopCatalog');

const pct = (x) => `${Math.round(x * 100)}%`;
const pad = (s, n) => String(s).padStart(n);

console.log('1. Boss fit (per entrant), the average fit each member needs, and the cap\n');
console.log('Difficulty  Drop        Boss/entrant   0% below   80% at   Max chance');
DIFFICULTIES.forEach((d, i) => {
    const b = bossFitPerEntrant(i);
    console.log(`${d.padEnd(12)}${RARITIES[i].padEnd(12)}${pad(b, 12)}${pad(Math.ceil(b * 0.6), 11)}${pad(b, 9)}${pad(pct(1 - TIER_LOSS_FLOOR[i]), 13)}`);
});
const raidFit = bossFitPerEntrant(RAID.THRESHOLD_TIER);
console.log(`${'Raid*'.padEnd(12)}${RAID.DROP_RARITY.padEnd(12)}${pad(raidFit, 12)}${pad(Math.ceil(raidFit * 0.6), 11)}${pad(raidFit, 9)}${pad('tbd', 13)}`);
console.log('* Raid: not reachable yet; no party cap, Epic threshold per entrant.');

console.log('\n2. Win chance by party fit / boss fit (whole party in one stance, before the cap)\n');
console.log('Ratio   Balanced   Aggressive   Defensive');
for (let r = 0.5; r <= 1.5001; r += 0.05) {
    console.log(`${pad(pct(r), 5)}${pad(pct(winChance(r)), 11)}${pad(pct(winChance(r * STANCES.aggressive.multiplier)), 13)}${pad(pct(winChance(r * STANCES.defensive.multiplier)), 12)}`);
}

console.log('\n3. Average member fit vs each difficulty (all Balanced, caps applied; party size cancels out)\n');
console.log(`Avg fit ${DIFFICULTIES.map((d, i) => pad(`${d}(${bossFitPerEntrant(i)})`, 14)).join('')}`);
for (const fit of [0, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 250, 300, 350, 400, 500]) {
    console.log(`${pad(fit, 7)} ${DIFFICULTIES.map((_, i) => pad(pct(winChance(fit / bossFitPerEntrant(i), i)), 14)).join('')}`);
}
