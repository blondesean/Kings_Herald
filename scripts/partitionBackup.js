/* Save whole partitions of the points table to a JSON file, and put them back
 * exactly as saved: a quick undo for a one-off script such as
 * backfillAchievements.js, which only writes ACH#<guildId> and MYTH#<guildId>.
 *
 *   node scripts/partitionBackup.js save <guildId> <file> [PREFIX ...]
 *       Saves every item under PREFIX<guildId> (default ACH# and MYTH#).
 *   node scripts/partitionBackup.js restore <file> [--apply]
 *       Shows what would change, then with --apply makes each saved partition
 *       match the file again: items saved are put back as they were, and
 *       items that weren't there when it was saved are deleted.
 *
 * Both need POINTS_TABLE_NAME. Restoring replaces everything written since
 * the save, the bot's own writes included, and it never touches points. So
 * restore before deploying the code that unlocks and pays achievements, not
 * after.
 */

const fs = require('fs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.POINTS_TABLE_NAME;
const DEFAULT_PREFIXES = ['ACH#', 'MYTH#'];

const client = () => DynamoDBDocumentClient.from(new DynamoDBClient({}));

const readPartition = async (doc, partition) => {
    const items = [];
    let ExclusiveStartKey;
    do {
        const page = await doc.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'guildId = :p',
            ExpressionAttributeValues: { ':p': partition },
            ExclusiveStartKey,
        }));
        items.push(...(page.Items || []));
        ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
};

const save = async (doc, guildId, file, prefixes) => {
    const partitions = {};
    for (const prefix of prefixes) {
        const partition = `${prefix}${guildId}`;
        partitions[partition] = await readPartition(doc, partition);
        console.log(`${partition}: ${partitions[partition].length} item(s)`);
    }
    fs.writeFileSync(file, JSON.stringify({ table: TABLE_NAME, savedAt: new Date().toISOString(), partitions }, null, 2));
    console.log(`Saved to ${file}.`);
};

const restore = async (doc, file, apply) => {
    const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (backup.table !== TABLE_NAME) throw new Error(`The backup is of ${backup.table}, not ${TABLE_NAME}.`);
    console.log(`Backup of ${backup.table} taken ${backup.savedAt}.`);
    const same = (a, b) => JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort());
    for (const [partition, saved] of Object.entries(backup.partitions)) {
        const savedBy = new Map(saved.map((item) => [item.userId, item]));
        const current = await readPartition(doc, partition);
        const extra = current.filter((item) => !savedBy.has(item.userId));
        const changed = saved.filter((item) => {
            const now = current.find((c) => c.userId === item.userId);
            return !now || !same(now, item);
        });
        console.log(`${partition}: ${changed.length} to put back, ${extra.length} to delete`);
        for (const item of changed) console.log(`  put    ${item.userId}`);
        for (const item of extra) console.log(`  delete ${item.userId}`);
        if (!apply) continue;
        for (const item of changed) await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
        for (const item of extra) await doc.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { guildId: partition, userId: item.userId } }));
    }
    console.log(apply ? 'Restored.' : '\nDry run. Add --apply to restore.');
};

const main = async () => {
    const [action, ...args] = process.argv.slice(2);
    if (!TABLE_NAME) {
        console.error('POINTS_TABLE_NAME is not set.');
        process.exit(1);
    }
    if (action === 'save' && args.length >= 2) {
        const [guildId, file, ...prefixes] = args;
        if (fs.existsSync(file)) throw new Error(`${file} already exists; pick a new name so no backup is overwritten.`);
        await save(client(), guildId, file, prefixes.length ? prefixes : DEFAULT_PREFIXES);
    } else if (action === 'restore' && args.length >= 1) {
        await restore(client(), args[0], args[1] === '--apply');
    } else {
        console.error('Usage: node scripts/partitionBackup.js save <guildId> <file> [PREFIX ...]\n       node scripts/partitionBackup.js restore <file> [--apply]');
        process.exit(1);
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error(error.message || error);
        process.exit(1);
    });
}

module.exports = { save, restore, readPartition };
