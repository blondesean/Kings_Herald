/* Persistent points leaderboard backed by DynamoDB.
 *
 * Each guild keeps a running tally of points its members have earned from the
 * weekly recap (5 for the most-reacted post of the week, 3 for second, 1 for
 * third). The table is keyed (guildId, userId) so multiple servers stay
 * separate.
 *
 * Configuration comes from the environment:
 *   POINTS_TABLE_NAME  - the DynamoDB table name (set by the CDK stack)
 *   AWS_REGION         - resolved automatically on Fargate; set it locally to
 *                        exercise the DynamoDB path during development
 *
 * If POINTS_TABLE_NAME is not set (e.g. local development without AWS), the
 * functions degrade gracefully: writes are skipped and reads return an empty
 * leaderboard, so the rest of the recap still works.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.POINTS_TABLE_NAME;

// Lazily created so the bot can run locally without AWS credentials configured.
let docClient = null;
const getClient = () => {
    if (!docClient) {
        docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
    }
    return docClient;
};

const isConfigured = () => Boolean(TABLE_NAME);

/* Add points to one or more members. `awards` is an array of
 * { userId, displayName, points }. Each is an atomic increment so concurrent
 * runs (or retries) can't clobber each other.
 */
const addPoints = async function (guildId, awards) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; skipping points persistence.');
        return;
    }

    const client = getClient();

    for (const award of awards) {
        if (!award || !award.userId || !award.points) {
            continue;
        }

        await client.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { guildId, userId: award.userId },
            UpdateExpression: 'SET #dn = :n ADD #pts :p',
            ExpressionAttributeNames: {
                '#dn': 'displayName',
                '#pts': 'points',
            },
            ExpressionAttributeValues: {
                ':n': award.displayName || 'a noble',
                ':p': award.points,
            },
        }));
    }
};

/* Return the top `limit` members for a guild as
 * [{ userId, displayName, points }], highest points first.
 */
const getLeaderboard = async function (guildId, limit = 10) {
    if (!isConfigured()) {
        console.log('POINTS_TABLE_NAME not set; returning empty leaderboard.');
        return [];
    }

    const client = getClient();

    const result = await client.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: '#g = :g',
        ExpressionAttributeNames: { '#g': 'guildId' },
        ExpressionAttributeValues: { ':g': guildId },
    }));

    const items = result.Items || [];
    return items
        .map((item) => ({
            userId: item.userId,
            displayName: item.displayName || 'a noble',
            points: item.points || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);
};

module.exports = { addPoints, getLeaderboard, isConfigured };
