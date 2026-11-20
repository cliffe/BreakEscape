/**
 * Flag locks opened elsewhere. The server marks a flag lock with no 'requires'
 * as flagUnlockedRemotely (a flag-station reward opens it) and names the station
 * in flagUnlockedAt when it can. Such a lock gets this message instead of a
 * flag prompt that would reject every flag.
 *
 * @module flag-lock
 */

/** True when this locked object takes no flag where it stands. */
export function isRemoteFlagLock(data) {
    return !!data && data.locked === true && data.lockType === 'flag' && data.flagUnlockedRemotely === true;
}

/** The player-facing line saying where the lock opens. */
export function remoteFlagLockMessage(data) {
    const station = typeof data?.flagUnlockedAt === 'string' ? data.flagUnlockedAt.trim() : '';
    if (!station) {
        return "It doesn't take a flag here. It unlocks when the right flag is submitted at a flag station.";
    }
    const place = /^the\s/i.test(station) ? station : `the ${station}`;
    return `It doesn't take a flag here. It unlocks when the right flag is submitted at ${place}.`;
}
