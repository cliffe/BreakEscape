/**
 * Wording for a flag that did not work. A flag is a long string copied off a VM,
 * so a refusal says "flag" and points at the usual slip (copied short), not at a
 * password. Password and PIN locks keep their own wording.
 *
 * @module flag-wording
 */

export const FLAG_HINT = 'Check it was copied in full, with nothing missing at either end.';

/** Said when what was typed is not shaped like a flag at all. */
export const FLAG_FORMAT_HINT = 'Flags usually look like flag{...}. Check you copied all of it, including the braces.';

/** True when the text is shaped like a flag: flag{...} (any case, any inner text). */
export function looksLikeFlag(value) {
    return /^flag\{.+\}$/i.test(String(value ?? '').trim());
}

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

/** Why a flag was refused, as the flag_rejected event reports it (R9). */
export const REJECT_REASONS = ['invalid', 'wrong_station', 'already_submitted', 'flag_not_recorded', 'vm_released'];

/**
 * The refusal reason: the server's own `reason` when it sent a known one, else
 * read from its message (an older server, or the flag-lock path).
 * @param {string} [serverMessage]
 * @param {string} [reason]
 * @returns {'invalid'|'wrong_station'|'already_submitted'|'flag_not_recorded'|'vm_released'}
 */
export function flagRejectReason(serverMessage, reason) {
    if (REJECT_REASONS.includes(reason)) return reason;
    const m = String(serverMessage || '').trim();
    if (/already/i.test(m)) return 'already_submitted';
    if (/^incorrect flag/i.test(m)) return 'wrong_station';
    return 'invalid';
}

/**
 * The line under a flag field after the server refused a flag.
 * @param {string} [serverMessage] message from POST /games/:id/flags
 * @param {object} [opts]
 * @param {string} [opts.reason] the server's reason (invalid, wrong_station, already_submitted)
 * @param {string} [opts.flagValue] what the player typed; when it is not shaped like
 *   flag{...} the refusal says what a flag looks like instead of "copied short"
 * @param {string} [opts.ownerName] the station that takes this flag, when the player has
 *   found it (the server leaves it out otherwise)
 */
export function flagRefusalLine(serverMessage, opts = {}) {
    const m = String(serverMessage || '').trim();
    const reason = flagRejectReason(m, opts.reason);
    // The session's VMs were handed back (D144): the server's fixed sentence, not "Incorrect flag"
    if (reason === 'vm_released') return `${m || "This session's VMs have been released. Start the mission again to get fresh VMs."}`;
    // Already counted: the server's own line says it best
    if (reason === 'already_submitted') return `${m || 'Flag already submitted'}`;
    // The flag was fine but the server could not record it: say so, so the player retries
    if (reason === 'flag_not_recorded') return `${m || 'The flag could not be recorded. Try again.'}`;
    // A real flag, but another machine's: not "copied short"
    if (reason === 'wrong_station') {
        const owner = String(opts.ownerName || '').trim().replace(/\.+$/, '');
        if (owner) return `Flag not accepted here. Take it to: ${owner}.`;
        return 'Flag not accepted here. This station takes flags from a different machine.';
    }
    if (opts.flagValue !== undefined && !looksLikeFlag(opts.flagValue)) {
        return `Flag not accepted. ${FLAG_FORMAT_HINT}`;
    }
    return `Flag not accepted. ${FLAG_HINT}`;
}

/**
 * The submitted-flags list. `submitted` are flags this station consumed; `recognised` are
 * { flag, note } for key-type flags the station only recognises (hintOnlyFlags: a decryption
 * key, a launch code) and sends on to another device. Those show with an arrow and the
 * server's note instead of a tick, so a player can see the flag was valid and where it goes.
 * `esc` escapes plain text for HTML.
 */
export function flagHistoryHtml(submitted, recognised, esc) {
    const done = Array.isArray(submitted) ? submitted : [];
    const known = (Array.isArray(recognised) ? recognised : []).filter(r => r && r.flag && !done.includes(r.flag));
    if (done.length === 0 && known.length === 0) return '<li class="no-flags-yet">No flags submitted yet</li>';
    const rows = done.map(flag => `
            <li class="flag-history-item">
                <span class="flag-value">${esc(flag)}</span>
                <span class="flag-check">DONE</span>
            </li>
        `);
    for (const r of known) {
        rows.push(`
            <li class="flag-history-item flag-recognised" title="${esc(r.note || '')}">
                <span class="flag-value">${esc(r.flag)}</span>
                <span class="flag-check flag-recognised-tag">Valid key, use elsewhere</span>
            </li>
        `);
    }
    return rows.join('');
}
