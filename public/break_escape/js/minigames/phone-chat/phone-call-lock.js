/**
 * A forced phone call: phone-chat opened with disableClose (an event mapping's or a
 * timed conversation's `disableClose: true`). The base minigame already hides the x
 * and the Close button; the phone also had its own Esc handler and a back arrow, so
 * Esc went back to the contact list and a second Esc closed the phone (finale F14).
 *
 * No imports, so node tests can load it on its own.
 */

/** Milliseconds a forced call stays up after its story ends without #exit_conversation. */
export const FORCED_CALL_END_CLOSE_MS = 2000;

/** True when the player may not close or leave this phone conversation. */
export function phoneCloseLocked(params) {
    return params?.disableClose === true;
}

/**
 * What Esc does on the phone: 'back' to the contact list from a thread, 'close' from
 * the list, 'none' on a forced call.
 * @param {string} view - 'conversation' or 'contacts'
 * @param {object} params - the minigame params
 */
export function phoneEscapeAction(view, params) {
    if (phoneCloseLocked(params)) return 'none';
    return view === 'conversation' ? 'back' : 'close';
}
