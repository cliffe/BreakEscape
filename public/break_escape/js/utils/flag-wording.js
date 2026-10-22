/**
 * Wording for a flag that did not work. A flag is a long string copied off a VM,
 * so a refusal says "flag" and points at the usual slip (copied short), not at a
 * password. Password and PIN locks keep their own wording.
 *
 * @module flag-wording
 */

export const FLAG_HINT = 'Check it was copied in full, with nothing missing at either end.';

/** True for a lock or station that takes a flag rather than a password or PIN. */
export function isFlagLockable(lockable, type) {
    const data = lockable?.scenarioData || lockable || {};
    const kind = String(data.type || '').replace('_', '-');
    return data.lockType === 'flag' || lockable?.lockType === 'flag'
        || kind === 'flag-station' || kind === 'launch-device'
        || type === 'flag-station' || type === 'launch-device';
}

/** The alert for a rejected password/PIN pad: flag wording on a flag lock, else the caller's. */
export function rejectionAlert(lockable, type, fallback) {
    if (isFlagLockable(lockable, type)) {
        return { message: FLAG_HINT, title: 'Flag not accepted' };
    }
    return fallback;
}

/**
 * The line under a flag field after the server refused a flag.
 * @param {string} [serverMessage] message from POST /games/:id/flags
 */
export function flagRefusalLine(serverMessage) {
    const m = String(serverMessage || '').trim();
    // Already counted: the server's own line says it best
    if (/already/i.test(m)) return `✗ ${m}`;
    // A real flag, but another machine's: not "copied short"
    if (/^incorrect flag/i.test(m)) {
        return '✗ Flag not accepted here. This station takes flags from a different machine.';
    }
    return `✗ Flag not accepted. ${FLAG_HINT}`;
}
