/* The stick figure poses shown beside the /flex box (see src/character.js).
 * Members pick one with /pose <number>; the list order is the number they
 * type, so only append new poses to keep existing numbers meaning the same.
 *
 * Each pose is { name, lines }, where lines are the figure's rows from the
 * top. The first line is the head, which the sheet lines up with the Helm row.
 *
 * Exposes:
 *   POSES - the list of poses, in number order
 *   DEFAULT_POSE - the number a member starts with (standing)
 *   poseLines(number) - the rows for a pose number, falling back to standing
 */

const POSES = [
    { name: 'standing', lines: ['  O', ' /|\\', ' / \\'] },
    { name: 'waving', lines: ['  O/', ' /|', ' / \\'] },
    { name: 'arms up', lines: [' \\O/', '  |', ' / \\'] },
    { name: 'kneeling', lines: ['  O', ' /|', ' _/\\'] },
    { name: 'sword raised', lines: ['  O/', ' /|', ' / \\'] },
];

const DEFAULT_POSE = 1;

const poseLines = (number) => {
    const pose = POSES[(Number(number) || DEFAULT_POSE) - 1] || POSES[DEFAULT_POSE - 1];
    return pose.lines;
};

module.exports = { POSES, DEFAULT_POSE, poseLines };
