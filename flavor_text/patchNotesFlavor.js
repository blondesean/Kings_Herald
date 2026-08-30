/* Flavor text for /patch_notes (see commands/prompts/patch_notes.js).
 *
 * The admin supplies only a change type and a short, non-technical `area`
 * name (e.g. "podium reaction counting") — never the mechanism or numbers
 * behind it. These templates dress that up as an in-character decree so the
 * announcement reads like the rest of the Herald's voice without anyone
 * having to hand-write prose each time.
 */

const titlesByType = {
    nerf: [
        'A Nerf Descends Upon the Realm',
        'By Royal Decree: Restraint Imposed',
        'The Court Reins Things In',
    ],
    buff: [
        'A Boon Bestowed',
        'By Royal Decree: Strength Granted',
        'The Court Rewards the Faithful',
    ],
    fix: [
        'A Fault Set Right',
        'By Royal Decree: Order Restored',
        'The Court Corrects Its Course',
    ],
    feature: [
        'A New Decree',
        'By Royal Decree: Something New',
        'The Court Unveils',
    ],
};

const bodyLinesByType = {
    nerf: (area) => [
        `Hear ye! The Herald has reined in **${area}** — let none exploit it as they once did.`,
        `By royal decree, **${area}** has been tempered. The days of running rampant are over.`,
        `The Court has cracked down upon **${area}**. Adjust thy schemes accordingly.`,
        `Word from the palace: **${area}** no longer bends so easily to clever subjects.`,
    ],
    buff: (area) => [
        `By royal decree, **${area}** has been strengthened! Let the realm rejoice.`,
        `The Herald bestows a boon upon **${area}** — greater glory awaits those who partake.`,
        `Hear ye! **${area}** now shines brighter than before.`,
        `The Court has seen fit to reward **${area}** more generously going forward.`,
    ],
    fix: (area) => [
        `The Herald has set right a fault in **${area}**. All should now behave as intended.`,
        `By royal decree, **${area}** has been mended — the confusion of before is no more.`,
        `Hear ye! A flaw in **${area}** has been corrected.`,
        `The Court's scribes have quietly repaired **${area}**.`,
    ],
    feature: (area) => [
        `Hear ye, hear ye! The Herald unveils a new decree: **${area}**.`,
        `By royal proclamation, **${area}** now graces the realm.`,
        `The Court is pleased to introduce **${area}**.`,
        `Word spreads through the halls of a new addition: **${area}**.`,
    ],
};

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Builds one announcement for a given type ('nerf' | 'buff' | 'fix' |
// 'feature') and area name. Falls back to 'feature' phrasing for an
// unrecognized type rather than throwing, since the type always comes from a
// fixed slash-command choice list and should never actually be unknown.
const patchNoteAnnouncement = (type, area) => {
    const key = bodyLinesByType[type] ? type : 'feature';
    return {
        title: pick(titlesByType[key]),
        body: pick(bodyLinesByType[key](area)),
    };
};

module.exports = { patchNoteAnnouncement };
