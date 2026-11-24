// Ops cracker model (hash records, stage S7): the pure half of the `ops-cracker` scene.
// State in, view description and next request out. No DOM, no window, no imports.
//
// The server decides every outcome. This module only turns what the server sent (a keyring hash
// row, the earned fact ids in `crackFacts`, a `POST /crack` answer) into words and a request. It
// never holds a password, never sees a recipe, and sends fact ids only: no label, no token.

export const MAX_PICKS = 4;

/** Every word the scene shows for a status. Nothing here comes from a server string. */
export const STATUS_TEXT = Object.freeze({
    ready: 'Pick what you have learned about this account, then press Crack.',
    running: 'Working on it...',
    ready_to_finish: 'Ready to finish. Press Finish to see the result.',
    nomatch: 'No match',
    infeasible: 'This one will not fall to guessing. Try another way in.',
    cracked: 'Cracked',
    need_facts_none: 'You have not learned anything about this account yet. You can still press Crack.',
    no_row: 'This hash is not in your keyring.',
    not_found: 'You no longer hold this hash.'
});

export const KNOWN_STATUSES = Object.freeze(['ready', 'running', 'needMoreFacts', 'nomatch', 'infeasible', 'cracked']);

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/** The token in groups of four (a display nicety; the characters are the server's). */
export function groupToken(token) {
    return isStr(token) ? token.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ') : '';
}

/** "1 fact still missing" / "N facts still missing". */
export function missingText(n) {
    const c = Number.isInteger(n) && n > 0 ? n : 1;
    return c === 1 ? '1 fact still missing' : `${c} facts still missing`;
}

/** The pickable chips: only ids the server listed in `crackFacts`, labelled from social.intelFacts. */
export function chipsFor(crackFacts, intelFacts) {
    const facts = isObj(intelFacts) ? intelFacts : {};
    const seen = new Set();
    const out = [];
    for (const id of Array.isArray(crackFacts) ? crackFacts : []) {
        if (!isStr(id) || seen.has(id)) continue;
        seen.add(id);
        const f = facts[id];
        const label = isObj(f) && isStr(f.label) ? f.label : (isObj(f) && isStr(f.text) ? f.text : id);
        out.push({ id, label });
    }
    return out;
}

/** A fresh scene state for a hash row. */
export function initialState({ row = null, crackFacts = [], intelFacts = {} } = {}) {
    return {
        row: isObj(row) ? row : null,
        crackFacts: Array.isArray(crackFacts) ? crackFacts.filter(isStr) : [],
        intelFacts: isObj(intelFacts) ? intelFacts : {},
        picks: [],
        answer: null,           // the last accepted POST /crack answer
        refusal: null,          // the last refusal reason code, or null
        seq: 0,                 // the number of the last request sent
        accepted: 0,            // the number of the newest request whose answer was taken
        deadline: null,         // ms on the scene clock when a running wait ends, or null
        autoPosted: false       // the one automatic post for this wait has gone
    };
}

/** The current status word key: the newest answer wins over the keyring row. */
export function statusOf(state) {
    const a = state.answer;
    if (a && typeof a.status === 'string') return a.status;
    const s = state.row && state.row.status;
    return isStr(s) ? s : 'ready';
}

/** Toggle a pick. Only ids in crackFacts, never more than MAX_PICKS. Returns a new state. */
export function togglePick(state, id) {
    if (!state.crackFacts.includes(id)) return state;
    // a pick change clears an old refusal (R1-C9)
    if (state.picks.includes(id)) return { ...state, refusal: null, picks: state.picks.filter((p) => p !== id) };
    if (state.picks.length >= MAX_PICKS) return state;
    return { ...state, refusal: null, picks: [...state.picks, id] };
}

/** Whether a post is in flight (sent, answer not yet taken). */
export function isBusy(state) {
    return state.seq > state.accepted;
}

/**
 * Whether Crack may be pressed now. No pick is needed (the route takes 0 to 4 facts and three of
 * the four classes ignore the pick). Not with no row, an unknown status, a finished record, a
 * post in flight, or a wait that has not ended.
 */
export function canCrack(state, nowMs = 0) {
    if (!state.row || !isStr(state.row.id) || isBusy(state)) return false;
    const st = statusOf(state);
    if (!KNOWN_STATUSES.includes(st) || st === 'cracked' || st === 'infeasible') return false;
    if (st === 'running') return state.deadline !== null && nowMs >= state.deadline;
    return true;
}

/** Seconds left in a running wait on the scene clock, or null when nothing is running. */
export function secondsLeft(state, nowMs) {
    if (statusOf(state) !== 'running' || state.deadline === null) return null;
    return Math.max(0, Math.ceil((state.deadline - nowMs) / 1000));
}

/**
 * The request body for a post, and the state that records it was sent. `auto` is the scene's own
 * post at countdown end: no pick. Returns { state, seq, body }.
 */
export function buildRequest(state, { auto = false } = {}) {
    const hashId = state.row && state.row.id;
    const facts = auto ? [] : state.picks.filter((p) => state.crackFacts.includes(p)).slice(0, MAX_PICKS);
    const seq = state.seq + 1;
    return {
        seq,
        body: { hash_id: hashId, facts },
        state: { ...state, seq, autoPosted: auto ? true : state.autoPosted }
    };
}

/** True once, when a running wait has ended and no automatic post has gone for it. */
export function shouldAutoPost(state, nowMs) {
    return statusOf(state) === 'running' && state.deadline !== null && nowMs >= state.deadline && !state.autoPosted;
}

/** Take a server answer for request `seq`. A stale answer (older than one already taken) is dropped. */
export function acceptAnswer(state, seq, answer, nowMs = 0) {
    if (seq < state.accepted) return state;
    const base = { ...state, accepted: seq };
    if (!isObj(answer) || answer.success === false) {
        return { ...base, refusal: isObj(answer) && isStr(answer.reason) ? answer.reason : 'no_answer' };
    }
    const next = { ...base, answer, refusal: null };
    if (answer.status === 'running') {
        const s = Number.isFinite(answer.readyInSeconds) ? Math.max(0, answer.readyInSeconds) : 0;
        next.deadline = nowMs + s * 1000;
        if (s > 0) next.waitTotal = s;
        // a post that still says running with time left starts a wait that may auto-post once more
        next.autoPosted = s === 0 ? state.autoPosted : false;
    } else {
        next.deadline = null;
        next.autoPosted = false;
    }
    if (answer.status === 'cracked' || answer.status === 'nomatch') next.picks = [];
    return next;
}

/** A keyring row arrived (or changed): adopt it unless a newer answer already speaks for the run. */
export function adoptRow(state, row, crackFacts, nowMs = 0) {
    const next = { ...state, row: isObj(row) ? row : state.row };
    if (Array.isArray(crackFacts)) {
        next.crackFacts = crackFacts.filter(isStr);
        next.picks = state.picks.filter((p) => next.crackFacts.includes(p));
    }
    if (!state.answer && isObj(row) && row.status === 'running' && Number.isFinite(row.readyInSeconds)) {
        const secs = Math.max(0, row.readyInSeconds);
        next.deadline = nowMs + secs * 1000;
        // the total is not served; the time left at adoption keeps the bar from sitting at 0 (R1-C4)
        if (secs > 0 && !(state.waitTotal > 0)) next.waitTotal = secs;
    }
    return next;
}

/**
 * The view description. `refusalText` is passed in (it lives in network-view/ops-model.js) so
 * this module imports nothing.
 *   { title, username, token, salted, chips:[{id,label,picked,disabled}], message, tone,
 *     progress (0..1 or null), crackEnabled, crackLabel, passwordNote }
 */
export function viewOf(state, nowMs = 0, refusalText = () => 'That did not work.') {
    const row = state.row || {};
    const acct = isObj(row.account) ? row.account : {};
    const st = statusOf(state);
    const left = secondsLeft(state, nowMs);
    const a = state.answer || {};
    let message;
    let tone = 'info';
    if (!state.row) { message = STATUS_TEXT.no_row; tone = 'warn'; }
    else if (state.refusal && !(st === 'running' && left !== null && left > 0)) {
        message = state.refusal === 'not_found' ? STATUS_TEXT.not_found : refusalText(state.refusal);
        tone = 'warn';
    } else if (st === 'running') {
        message = left === 0 ? STATUS_TEXT.ready_to_finish : `${STATUS_TEXT.running} ${left === null ? '' : `${left}s`}`.trim();
    } else if (st === 'needMoreFacts') { message = missingText(a.missingCount); tone = 'warn'; }
    else if (st === 'nomatch') { message = STATUS_TEXT.nomatch; tone = 'warn'; }
    else if (st === 'infeasible') { message = STATUS_TEXT.infeasible; tone = 'warn'; }
    else if (st === 'cracked') { message = STATUS_TEXT.cracked; tone = 'good'; }
    else if (st === 'ready') { message = state.crackFacts.length ? STATUS_TEXT.ready : STATUS_TEXT.need_facts_none; }
    else { message = refusalText('unknown_status'); tone = 'warn'; }
    const chips = chipsFor(state.crackFacts, state.intelFacts).map((c) => ({
        ...c,
        picked: state.picks.includes(c.id),
        disabled: st === 'cracked' || st === 'infeasible' || (!state.picks.includes(c.id) && state.picks.length >= MAX_PICKS)
    }));
    let progress = null;
    if (st === 'running' && left !== null) {
        const total = Number.isFinite(state.waitTotal) && state.waitTotal > 0 ? state.waitTotal : null;
        progress = total ? Math.min(1, Math.max(0, 1 - left / total)) : (left === 0 ? 1 : 0);
    }
    return {
        title: isStr(acct.displayName) ? acct.displayName : (isStr(acct.username) ? acct.username : 'Account'),
        username: isStr(acct.username) ? acct.username : '',
        token: groupToken(row.token),
        salted: row.salted === true,
        chips,
        message,
        tone,
        progress,
        crackEnabled: canCrack(state, nowMs),
        crackLabel: st === 'running' && left === 0 ? 'Finish' : 'Crack',
        passwordNote: st === 'cracked' ? 'The password is now in your keyring.' : ''
    };
}
