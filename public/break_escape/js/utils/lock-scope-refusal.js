// A 403 from POST /unlock with one of these reasons refuses the PC a lock sits on, not the
// code typed (review R3 m1, R4 m2): the PC is off, not responding, or its route is down. The
// server gives a reason only for an object the player has already been shown. A lock screen
// that gets one says the line, closes as cancelled and counts no attempt, so a right code is
// never shown as wrong.
export const LOCK_SCOPE_REFUSAL_TEXT = Object.freeze({
    off: 'This PC is off.',
    not_responding: 'This PC is not responding.',
    unreachable: "This PC can't be reached."
});

/** The refusal reason ('off', 'not_responding' or 'unreachable') in an unlock error, or null. */
export function lockScopeRefusal(error) {
    const reason = error?.status === 403 ? error.body?.reason : null;
    return Object.prototype.hasOwnProperty.call(LOCK_SCOPE_REFUSAL_TEXT, reason) ? reason : null;
}
