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
    { name: 'shield up', lines: [' [O', ' [|\\', ' / \\'] },
    { name: 'casting', lines: ['  O *', ' /|/', ' / \\'] },
    { name: 'archer', lines: ['  O', ' /|)>', ' / \\'] },
    { name: 'flexing', lines: [' _O_', '(/|\\)', ' / \\'] },
    { name: 'dancing', lines: ['  O', ' <|>', ' / >'] },
    { name: 'thinking', lines: ['  O?', ' /|\\', ' / \\'] },
    { name: 'meditating', lines: ['  O', ' /|\\', '_/ \\_'] },
    { name: 'flag bearer', lines: ['  O|>', ' /||', ' / |'] },
];

const DEFAULT_POSE = 1;

// Each pose's stored key is its name with underscores, e.g. "arms_up". Older
// saves stored the pose number instead, so both still resolve.
const poseId = (pose) => pose.name.replace(/ /g, '_');

const findPose = (value) => {
    if (typeof value === 'number' || /^\d+$/.test(String(value))) {
        return POSES[Number(value) - 1] || null;
    }
    return POSES.find((pose) => poseId(pose) === value) || null;
};

const poseLines = (value) => {
    const pose = findPose(value) || POSES[DEFAULT_POSE - 1];
    return pose.lines;
};

module.exports = { POSES, DEFAULT_POSE, poseId, findPose, poseLines };
