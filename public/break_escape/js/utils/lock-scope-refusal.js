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

// Keyring K5 (plan 10): a lock on a PC reached by a session token that has run out answers
// 403 { reason: 'expired', message: '{label} has expired.' }. The line names the token, so it
// comes from the server's message, not this table. The fallback is only for an answer that
// somehow lacks one.
const EXPIRED_FALLBACK = 'This sign-in has expired.';
const MAX_SERVER_LINE = 160;

// S8c: a second step the player did not pass (denied, expired, or closed with the X) rejects the
// unlock with this reason. The pad closes as cancelled, counts no attempt and plays no reject
// sound; the line and tone come from window.lockStep.cancelFeedback, not from a table here.
export const SECOND_STEP_CANCELLED = 'second_step_cancelled';

/** The refusal reason ('off', 'not_responding', 'unreachable', 'expired' or 'second_step_cancelled') in an unlock error, or null. */
export function lockScopeRefusal(error) {
    const reason = error?.status === 403 ? error.body?.reason : null;
    if (reason === 'expired') return 'expired';
    if (reason === SECOND_STEP_CANCELLED) return SECOND_STEP_CANCELLED;
    return Object.prototype.hasOwnProperty.call(LOCK_SCOPE_REFUSAL_TEXT, reason) ? reason : null;
}

/**
 * The line a lock screen says for a scope refusal in an unlock error, or null when the error
 * is not one. Every lock minigame uses this one helper. For `expired` it is the server's own
 * "{label} has expired." (callers show it as text: textContent, or showFailure with plainText); the rest come from the table.
 */
export function lockScopeRefusalLine(error) {
    const reason = lockScopeRefusal(error);
    if (!reason) return null;
    if (reason === SECOND_STEP_CANCELLED) {
        // No line of its own: the one reject tone and "Not approved." (or nothing, for the
        // player's own X) are lockStep's, said once here. Returns '' so a pad shows no text.
        try { window.lockStep?.cancelFeedback?.(error); } catch (e) { /* feedback must not break the pad */ }
        return '';
    }
    if (reason === 'expired') {
        const message = error.body?.message;
        return typeof message === 'string' && message.trim() && message.length <= MAX_SERVER_LINE
            ? message.trim() : EXPIRED_FALLBACK;
    }
    return LOCK_SCOPE_REFUSAL_TEXT[reason];
}

// One shared object-unlock POST with the GATED_DOOR §3.6 route-room retry. Every object unlock
// (notifyServerUnlock's null-attempt methods, and the pin/password/combination/cryptex/flag
// minigames that post their own code) goes through this, so none of them is a copy of the retry.
// When the server refuses an object in a served-but-unearned route room (403
// { reason: 'room_not_reachable', retryable: true }) in the short window before the viaPass
// currentRoom sync promotes the room, flush one state sync and re-post once. Fires only on that
// reason-and-flag body, and never for a door (a door into a route room is the split itself, §3.5):
// any other refusal, or a door, is re-thrown unchanged so callers handle it exactly as before.
export async function unlockWithRouteRoomRetry(type, targetId, attempt, method, extra, opts) {
    const apiClient = window.ApiClient || window.APIClient;
    // Forward extra only when given, so a caller that posts four args keeps posting four (the
    // access-list card_ids path is the only one that passes extra).
    // opts (S8c: { fromDoor }) is forwarded only when given, for the same reason.
    const post = () => opts !== undefined
        ? apiClient.unlock(type, targetId, attempt, method, extra === undefined ? {} : extra, opts)
        : extra === undefined
            ? apiClient.unlock(type, targetId, attempt, method)
            : apiClient.unlock(type, targetId, attempt, method, extra);
    try {
        return await post();
    } catch (error) {
        const body = error && error.body;
        // A cancelled second step is the player's or the phone's answer, never a room-sync race
        const canRetry = type !== 'door' && body && body.reason !== SECOND_STEP_CANCELLED &&
            body.reason === 'room_not_reachable' && body.retryable === true;
        if (!canRetry) throw error;
        // Awaited for its ordering, never for its success: a rejecting (or absent) sync still
        // proceeds to the one re-post (§3.6, same tolerance as the pre-flush).
        try {
            await Promise.resolve(window.stateSync?.sync?.()).catch(() => false);
        } catch (syncError) { /* a synchronous throw must not swallow the re-post */ }
        // Re-post exactly once. A second refusal (the room never promoted, i.e. a forge) throws and
        // surfaces through the caller's own error handling; there is no further retry, so no loop.
        return await post();
    }
}
