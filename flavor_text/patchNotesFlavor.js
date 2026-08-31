/* Flavor text for /patch_notes (see commands/prompts/patch_notes.js).
 * The command cites real commit subjects from UPDATELOG.md verbatim — this
 * just supplies the herald-voiced intro line wrapped around that list.
 */
const patchNotesIntroLines = () => [
    'Hear ye, hear ye! Word from the royal scribes of recent decrees:',
    'By royal decree, let it be known what has lately changed in the realm:',
    "Hark! The Herald bears tidings of the Court's latest work:",
    'From the scribes\' own ledger, these decrees were lately sealed:',
];

module.exports = { patchNotesIntroLines };
