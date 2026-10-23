// Mock authenticator timeline (SE design 11 N11, packet P7-M).
//
// Pure helpers for the push-stream overlay. The overlay itself (authenticator-minigame.js)
// plays the timeline; this file turns the authored `pushes` and `approvesAt` into one ordered
// list of events so the order is decided in one place and is testable without a DOM.
//
// Times may be authored as "HH:MM" strings (06:45) or as plain numbers; both order correctly.
// On a tie the approval plays after the pushes that share its time (the target taps approve
// once the prompts have landed).

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/**
 * A numeric sort key for an authored time. "HH:MM" becomes minutes since midnight; a number is
 * used as-is; anything else sorts last (NaN pushed to the end). Returns a finite number or
 * Number.POSITIVE_INFINITY so the sort is stable and total.
 */
export function timeKey(t) {
    if (typeof t === 'number' && Number.isFinite(t)) return t;
    if (isStr(t)) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
        if (m) {
            const h = Number(m[1]);
            const min = Number(m[2]);
            if (h >= 0 && h < 24 && min >= 0 && min < 60) return h * 60 + min;
        }
        const n = Number(t);
        if (Number.isFinite(n)) return n;
    }
    return Number.POSITIVE_INFINITY;
}

/** The learner-facing time label: the authored string as typed, or the number as text. */
export function displayTime(t) {
    if (isStr(t)) return t;
    if (typeof t === 'number' && Number.isFinite(t)) return String(t);
    return '';
}

/**
 * Build the ordered event list from the params.
 *
 *   { pushes: [{ at, app, account, location, device }], approvesAt }
 *
 * Returns { events, pushCount }. Each push event is
 *   { type: 'push', id, order, at, display, app, account, location, device }
 * and the approval, when `approvesAt` is given, is
 *   { type: 'approve', id: 'approve', order, at, display }.
 * Pushes keep their authored order on a tie (secondary key = authored index); the approval
 * carries a secondary key of +Infinity so it follows pushes sharing its time.
 */
export function buildTimeline(params = {}) {
    const rawPushes = Array.isArray(params.pushes) ? params.pushes : [];
    const pushes = rawPushes.filter(isObj).map((p, i) => ({
        type: 'push',
        id: isStr(p.id) ? p.id : `push_${i + 1}`,
        seq: i,
        at: p.at,
        key: timeKey(p.at),
        display: displayTime(p.at),
        app: isStr(p.app) ? p.app : 'Authenticator',
        account: isStr(p.account) ? p.account : '',
        location: isStr(p.location) ? p.location : '',
        device: isStr(p.device) ? p.device : ''
    }));

    const events = pushes.slice();
    const hasApprove = params.approvesAt !== undefined && params.approvesAt !== null;
    if (hasApprove) {
        events.push({
            type: 'approve',
            id: 'approve',
            seq: Number.POSITIVE_INFINITY,
            at: params.approvesAt,
            key: timeKey(params.approvesAt),
            display: displayTime(params.approvesAt)
        });
    }

    events.sort((a, b) => (a.key - b.key) || (a.seq - b.seq));
    events.forEach((e, i) => { e.order = i; });

    return { events, pushCount: pushes.length };
}
