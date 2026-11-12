/**
 * Scenario config for phone calls: `ring` (an incoming call that rings) and `call`
 * (a contact the player can ring). Plan 3.1 and 3.2.
 *
 * Unknown or malformed input gets defaults and a warning, never a throw. The validator
 * (A7) is the place that rejects a scenario; the engine only has to carry on.
 *
 * No imports, so node tests load it on its own.
 */

const RING_KEYS = new Set(['onMissed', 'voicemailKnot', 'withheld', 'untilAnswered']);
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

    return { onMissed, voicemailKnot, withheld, untilAnswered };
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
