/**
 * Scenario config for phone calls: `ring` (an incoming call that rings) and `call`
 * (a contact the player can ring). Plan 3.1 and 3.2.
 *
 * Unknown or malformed input gets defaults and a warning, never a throw. The validator
 * (A7) is the place that rejects a scenario; the engine only has to carry on.
 *
 * No imports, so node tests load it on its own.
 */

const RING_KEYS = new Set(['onMissed', 'voicemailKnot', 'withheld', 'untilAnswered', 'callbackWhen']);
const CALL_KEYS = new Set(['knot', 'when', 'unavailable', 'button']);

function makeWarn(opts) {
    const fn = opts && typeof opts.warn === 'function' ? opts.warn : null;
    return (msg) => {
        try {
            if (fn) fn(msg);
            else if (typeof console !== 'undefined' && console.warn) console.warn(`[phone-ring-config] ${msg}`);
        } catch (e) { /* a warning must never throw */ }
    };
}

function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Normalise a mapping's or timedConversation's `ring` value.
 *
 * @param {*} raw - `true`, an object, or nothing
 * @param {{warn?: Function, forced?: boolean}} [opts] - forced: the call has disableClose
 * @returns {null | {onMissed: 'callback'|'voicemail', voicemailKnot: string|null,
 *                   withheld: boolean, untilAnswered: boolean}} null when there is no ring
 */
export function normaliseRing(raw, opts) {
    const warn = makeWarn(opts);
    const forced = !!(opts && opts.forced);
    if (raw === undefined || raw === null || raw === false) return null;

    let src;
    if (raw === true) {
        src = {};
    } else if (isPlainObject(raw)) {
        src = raw;
    } else {
        warn(`ring must be true or an object, got ${typeof raw}; using the defaults`);
        src = {};
    }

    for (const key of Object.keys(src)) {
        if (!RING_KEYS.has(key)) warn(`ring: unknown field "${key}" ignored`);
    }

    let onMissed = 'callback';
    if (src.onMissed !== undefined) {
        if (src.onMissed === 'callback' || src.onMissed === 'voicemail') onMissed = src.onMissed;
        else warn(`ring.onMissed must be "callback" or "voicemail", got ${JSON.stringify(src.onMissed)}; using "callback"`);
    }

    let voicemailKnot = null;
    if (src.voicemailKnot !== undefined && src.voicemailKnot !== null) {
        if (typeof src.voicemailKnot === 'string' && src.voicemailKnot.trim()) voicemailKnot = src.voicemailKnot.trim();
        else warn('ring.voicemailKnot must be a non-empty string; ignored');
    }
    if (onMissed === 'voicemail' && !voicemailKnot) {
        warn('ring.onMissed "voicemail" needs ring.voicemailKnot; using "callback"');
        onMissed = 'callback';
    }
    if (onMissed === 'voicemail' && forced) {
        warn('a forced call (disableClose) cannot be missed, so ring.onMissed "voicemail" has no effect');
    }

    let withheld = false;
    if (src.withheld !== undefined) {
        if (typeof src.withheld === 'boolean') withheld = src.withheld;
        else warn('ring.withheld must be true or false; using false');
    }
    if (withheld && onMissed !== 'voicemail' && !forced) {
        warn('a withheld call cannot be rung back, so it needs ring.onMissed "voicemail" (or disableClose)');
    }

    let untilAnswered = false;
    if (src.untilAnswered !== undefined) {
        if (typeof src.untilAnswered === 'boolean') untilAnswered = src.untilAnswered;
        else warn('ring.untilAnswered must be true or false; using false');
    }
    if (untilAnswered && forced) {
        warn('ring.untilAnswered has no effect on a forced call, which auto-answers');
    }

    // A condition (`globalVars.*`, && only, as `call.when`) under which a pending callback left by
    // this missed call is still worth placing. Re-checked when the "Call back" button is built and
    // as the callback dials; a failing condition clears the callback quietly, so an out-of-date
    // knot is never dialled. In-memory only: a reload does not carry it (the save is unchanged).
    let callbackWhen = null;
    if (src.callbackWhen !== undefined && src.callbackWhen !== null) {
        if (typeof src.callbackWhen === 'string' && src.callbackWhen.trim()) callbackWhen = src.callbackWhen.trim();
        else warn('ring.callbackWhen must be a non-empty string; ignored');
    }
    if (callbackWhen && onMissed !== 'callback') {
        warn('ring.callbackWhen has no effect unless ring.onMissed is "callback"');
    }

    return { onMissed, voicemailKnot, withheld, untilAnswered, callbackWhen };
}

/**
 * Normalise a contact's `call` value: one entry or a list, in order.
 *
 * @param {*} raw
 * @param {{warn?: Function, homeKnot?: string}} [opts] - homeKnot: an entry may not use it
 * @returns {Array<{knot: string, when: string|null, unavailable: 'no_answer'|'hidden', button: boolean}>}
 *          always an array; entries that cannot be used are dropped with a warning
 */
export function normaliseCall(raw, opts) {
    const warn = makeWarn(opts);
    if (raw === undefined || raw === null || raw === false) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    const out = [];
    list.forEach((entry, i) => {
        const where = Array.isArray(raw) ? `call[${i}]` : 'call';
        if (!isPlainObject(entry)) {
            warn(`${where} must be an object; ignored`);
            return;
        }
        for (const key of Object.keys(entry)) {
            if (!CALL_KEYS.has(key)) warn(`${where}: unknown field "${key}" ignored`);
        }
        if (typeof entry.knot !== 'string' || !entry.knot.trim()) {
            warn(`${where}.knot is required and must be a string; entry ignored`);
            return;
        }
        const knot = entry.knot.trim();
        if (opts && opts.homeKnot && knot === opts.homeKnot) {
            warn(`${where}.knot "${knot}" is the contact's home knot; entry ignored`);
            return;
        }
        let when = null;
        if (entry.when !== undefined && entry.when !== null) {
            if (typeof entry.when === 'string' && entry.when.trim()) when = entry.when.trim();
            else warn(`${where}.when must be a condition string; treated as always`);
        }
        let unavailable = 'no_answer';
        if (entry.unavailable !== undefined) {
            if (entry.unavailable === 'no_answer' || entry.unavailable === 'hidden') unavailable = entry.unavailable;
            else warn(`${where}.unavailable must be "no_answer" or "hidden"; using "no_answer"`);
        }
        let button = true;
        if (entry.button !== undefined) {
            if (typeof entry.button === 'boolean') button = entry.button;
            else warn(`${where}.button must be true or false; using true`);
        }
        out.push({ knot, when, unavailable, button });
    });
    return out;
}

/**
 * Which call the header button dials (plan 2.5, "What the button dials"), in order: a pending
 * callback (it connects at once, skipping `when`); else the first entry with `button` not false
 * whose `when` holds; else, if any button entry has `unavailable: "no_answer"`, a call that rings
 * out; else nothing, and the button is hidden. Entries with `button: false` are reached only by
 * {@link entryForKnot}.
 *
 * @param {Array} entries - normaliseCall() output
 * @param {(when: string) => boolean} holds - the mapping-grammar condition test
 * @param {{knot: string}|null} [callback] - the contact's pending callback, if any
 * @returns {{kind: 'callback'|'connect'|'no_answer', entry: Object}|null}
 */
export function pickButtonCall(entries, holds, callback) {
    if (callback && typeof callback.knot === 'string' && callback.knot) {
        return { kind: 'callback', entry: { knot: callback.knot, when: null, unavailable: 'no_answer', button: true } };
    }
    const list = Array.isArray(entries) ? entries.filter((e) => e && e.button !== false) : [];
    for (const e of list) {
        if (!e.when || safeHolds(holds, e.when)) return { kind: 'connect', entry: e };
    }
    const ringOut = list.find((e) => e.unavailable === 'no_answer');
    return ringOut ? { kind: 'no_answer', entry: ringOut } : null;
}

/**
 * What `#place_call` dials: with a knot, that entry (whatever its `button`), checked against its
 * `when` as the call connects; with no knot, what the button would dial. A knot that is not one of
 * the entries gives null.
 *
 * @returns {{kind: 'callback'|'connect'|'no_answer', entry: Object}|null}
 */
export function pickPlacedCall(entries, holds, knot, callback) {
    if (!knot) return pickButtonCall(entries, holds, callback);
    const entry = (Array.isArray(entries) ? entries : []).find((e) => e && e.knot === knot);
    // The callback's own knot dials even when the contact has no `call` entry for it (A6)
    if (callback && callback.knot === knot) {
        return { kind: 'callback', entry: entry || { knot, when: null, unavailable: 'no_answer', button: true } };
    }
    if (!entry) return null;
    return { kind: !entry.when || safeHolds(holds, entry.when) ? 'connect' : 'no_answer', entry };
}

/** A condition that cannot be evaluated does not hold. */
function safeHolds(holds, when) {
    try { return !!holds(when); } catch (e) { return false; }
}

/** The knot named by a `place_call` tag among a step's tags: `{ found, knot }`, knot null for the bare form. */
export function placeCallFromTags(tags) {
    for (const raw of (Array.isArray(tags) ? tags : [])) {
        const t = String(raw ?? '').trim();
        const m = t.match(/^place_call(?:\s*:\s*(\S+))?$/i);
        if (m) return { found: true, knot: m[1] ? m[1].split('.')[0] : null };
    }
    return { found: false, knot: null };
}
