/* Passive behavior: the morning calls of unhappy pets.
 *
 * Every day at 9:30 AM Eastern, half an hour after the birthday blessing, the
 * Herald looks at the pet at each member's side. Each pet that has gone
 * unpetted for longer than PET_HAPPY_MS (src/pets.js) is unhappy and costs its
 * owner fit, and makes its displeasure known: a cat meows, a dog barks, and
 * so on, pinging its owner, every morning until petted with /pet. Pets in
 * the bank never complain. All of a guild's calls go in one post.
 *
 * A manual /pet_calls preview (commands/passive/preview) posts the same
 * calls in the current channel without pinging anyone.
 *
 * Exposes:
 *   schedulePetCalls(client) - registers the daily cron job (call once, on ready)
 *   runPetCalls(client, opts) - posts the calls now; used by the preview
 */

const cron = require('node-cron');
const pointsStore = require('../../src/pointsStore');
const { findAnnounceChannel } = require('../../src/findAnnounceChannel');
const { resolveChannel } = require('../../src/resolveChannel');
const { isHappy, petKind, petSound } = require('../../src/pets');
const flavor = require('../../flavor_text');

const CRON_EXPRESSION = '30 9 * * *';
const TIMEZONE = 'America/New_York';

const pick = (lines) => lines[Math.floor(Math.random() * lines.length)];

/* Posts each guild's unhappy-pet calls. options:
 *   guild         - a single guild (default: every guild)
 *   targetChannel - where to post (default: each guild's pets channel)
 *   persist       - true for the real run, which pings the owners (default: false)
 */
const runPetCalls = async function (client, options = {}) {
    const { guild, targetChannel, persist = false } = options;
    const guilds = guild ? [guild] : Array.from(client.guilds.cache.values());
    const runLabel = persist ? 'scheduled' : 'preview';

    for (const g of guilds) {
        try {
            const members = await pointsStore.getMembers(g.id);
            const now = Date.now();
            const unhappy = members.filter((m) => m.pet && !isHappy(m.pet, now));
            if (!unhappy.length) {
                console.log(`Pet calls (guild ${g.id}) [${runLabel}]: every pet is content.`);
                if (targetChannel) await targetChannel.send('Every pet at court is content this morning.');
                continue;
            }

            const channel = targetChannel || await resolveChannel(g, 'pets', findAnnounceChannel);
            if (!channel) {
                console.log(`Pet calls: no channel the herald can post in found in "${g.name}"; skipping.`);
                continue;
            }

            const lines = unhappy.map((m) => pick(flavor.petMorningLines(m.pet.name, `<@${m.userId}>`, petKind(m.pet).toLowerCase(), petSound(m.pet))));
            await channel.send({
                content: [...lines, '', pick(flavor.petMorningFooterLines())].join('\n'),
                allowedMentions: { users: persist ? unhappy.map((m) => m.userId) : [] },
            });
            console.log(`Pet calls (guild ${g.id}) [${runLabel}]: ${unhappy.map((m) => `${m.pet.name} (${m.userId})`).join(', ')}.`);
        } catch (error) {
            console.error(`Pet calls failed for guild "${g.name}":`, error);
        }
    }
};

const schedulePetCalls = function (client) {
    if (!cron.validate(CRON_EXPRESSION)) {
        console.error(`Pet calls: invalid cron expression "${CRON_EXPRESSION}"; not scheduled.`);
        return;
    }

    cron.schedule(
        CRON_EXPRESSION,
        () => {
            runPetCalls(client, { persist: true }).catch((error) => console.error('Scheduled pet calls failed:', error));
        },
        { timezone: TIMEZONE }
    );

    console.log(`Pet calls scheduled: "${CRON_EXPRESSION}" (${TIMEZONE}), 9:30 AM Eastern daily.`);
};

module.exports = { schedulePetCalls, runPetCalls };
