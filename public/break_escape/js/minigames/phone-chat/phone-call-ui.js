/**
 * Phone call mode: how a voiced call (params.voiced, F17) looks.
 *
 * A voiced call is a call, not a text thread, so the phone shows a call screen: an
 * "ON CALL" bar with the call's running time, the contact's portrait large in the middle
 * with a speaking indicator, subtitles for the current line (and the one before it,
 * dimmed) instead of a scrolling thread of bubbles, the reply choices, and a red end-call
 * button in place of the back arrow (hidden on a forced call, as the back arrow is).
 *
 * The history is unchanged: every line is still recorded, so the notepad and a later
 * open of the thread outside a call show it as messages. The terminal theme keeps its own
 * look (its typeout is the point of it).
 *
 * No imports, so node tests can load it on its own.
 */

/** True when the phone should draw a call screen instead of a message thread. */
export function isPhoneCallMode(params) {
    return !!params && params.voiced === true && params.theme !== 'terminal';
}

/**
 * The caption under the caller's name: the call's own callLabel (an event mapping's or a
 * timed conversation's), else the contact's, else "Voice call". Scenario-authored, so a
 * SAFETYNET handler can read "SAFETYNET secure line" and a stranger "Unknown number".
 */
export function callLabelFor(params, contact) {
    const pick = v => (typeof v === 'string' && v.trim()) ? v.trim() : null;
    return pick(params?.callLabel) || pick(contact?.callLabel) || 'Voice call';
}

/** A call's running time: "0:07", "1:24", "1:02:05". */
export function formatCallDuration(ms) {
    const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/**
 * Who a subtitle names, and its text.
 * @param {string} type - 'npc', 'player' or 'narrator' (after displayPhoneLine)
 * @param {string} text - the line, the contact's own prefix already dropped
 * @param {{displayName?: string, id?: string}|null} contact - the thread's contact
 * @param {{name: string, text: string}|null} other - otherSpeaker() for this line, if any
 * @returns {{speaker: string|null, text: string}}
 */
export function callSubtitle(type, text, contact, other = null) {
    let body = String(text ?? '').trim();
    // A voice message's "voice:" marker means nothing on a call: the line is just spoken
    if (type === 'npc') body = body.replace(/^voice:\s*/i, '');
    if (type === 'player') return { speaker: 'You', text: body.replace(/^you:\s*/i, '') };
    if (type === 'narrator') return { speaker: null, text: body };
    if (other) return { speaker: other.name, text: other.text };
    return { speaker: contact?.displayName || contact?.id || null, text: body };
}

/** Markup for the call screen's extra parts, added to the conversation view. */
export const CALL_STATUS_HTML = `
    <div class="call-status-bar" id="call-status-bar">
        <span class="call-status-label"><span class="call-status-dot" aria-hidden="true"></span>ON CALL</span>
        <span class="call-timer" id="call-timer" aria-label="Call duration">0:00</span>
    </div>`;

export const CALL_SPEAKING_HTML = `
    <div class="call-caption" id="call-caption">Voice call</div>
    <div class="call-speaking" id="call-speaking" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
    </div>`;

export const CALL_CONTROLS_HTML = `
    <div class="call-controls" id="call-controls">
        <button type="button" class="call-end-button" id="call-end-button" aria-label="End call" title="End call">
            <img class="call-end-icon" src="/break_escape/assets/icons/call-end.png" alt="" width="32" height="32">
        </button>
    </div>`;
