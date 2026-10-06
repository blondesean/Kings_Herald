/* Shared: converting between Eastern wall-clock time and real Date objects.
 * The container clock is UTC, so anything tied to a clock time (9 AM
 * Eastern, noon Eastern) goes through here. Handles daylight saving time by
 * correcting the offset until the Eastern wall clock reads the target time.
 *
 * Exposes:
 *   easternParts(date) - { year, month, day, hour, minute } in Eastern time
 *   atEastern({ year, month, day }, hour, minute) - the Date for that Eastern
 *     wall-clock time
 */

const TIMEZONE = 'America/New_York';

const easternParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type).value);
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
};

const atEastern = ({ year, month, day }, hour, minute = 0) => {
    const target = Date.UTC(year, month - 1, day, hour, minute);
    let guess = target;
    // Two passes: the first corrects the offset, the second catches a DST edge.
    for (let i = 0; i < 2; i++) {
        const seen = easternParts(new Date(guess));
        guess += target - Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute);
    }
    return new Date(guess);
};

module.exports = { easternParts, atEastern };
