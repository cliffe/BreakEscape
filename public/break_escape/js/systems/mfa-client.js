/**
 * Multi-factor sign-in client state (ops layer S8a, unit 06).
 *
 * A leaf module with no imports. Memory only: nothing here is written to storage, and nothing is
 * sent to the server except through the injected request function.
 *
 * configure({ request, onSession, emit, now })
 *   request(method, path, payload) -> Promise<body>. `method` is 'GET' or 'POST', `path` is the
 *     member route name ('mfa/device', 'mfa/verify', 'mfa/prompt', 'mfa/phone', 'mfa/approve'),
 *     `payload` is the query (GET) or JSON body (POST). It resolves to the parsed body on a 2xx and
 *     rejects with an error carrying { status, body } otherwise.
 *   onSession(pcId, body)  receives a passing answer for a `pc` subject.
 *   emit(name, detail)     the event emitter.
 *   now()                  a clock in milliseconds.
 *
 * A subject is a key string, `pc:<pcId>` or `<kind>:<id>` for any other kind, or { kind, id }.
 * A PC subject posts `pc_id`; any other kind posts `target_type` and `target_id`.
 *
 * Results (never thrown for a refusal the player caused):
 *   { ok: true, passed: true, body }
 *   { ok: true, passed: false, waiting: true, body }                  prompt, not yet approved
 *   { ok: false, reason: 'wrong' | 'stale' | 'locked' | 'expired' | 'cancelled' | 'too_soon' |
 *                        'no_phone' | 'locked_out' | 'gone' | 'error', status, body, ... }
 *     'stale' carries `stale: 'used' | 'expired'`; 'locked' carries `retryIn`; 'too_soon' carries
 *     `retryAfterS`; 'wrong' carries `attemptsLeft`.
 *     'locked_out' is the login lockout (the account is locked on this PC); 'gone' is a bare 422 (the
 *     record is gone, or the account or route is no longer allowed): both drop the pending record.
 */

let cfg = { request: null, onSession: null, emit: null, now: () => Date.now() };

const pendingBySubject = new Map(); // key -> { kind, npcId, number?, ownPhone?, n }
const completedBySubject = new Map(); // key -> body, handed out once
const CODE_FRESH_MS = 60000; // a code lives for one 60 s step; the server takes this and the last
let lastRead = null; // { npcId, code, source: 'item', deviceId, at }

export function configure({ request, onSession, emit, now } = {}) {
    cfg = {
        request: typeof request === 'function' ? request : null,
        onSession: typeof onSession === 'function' ? onSession : null,
        emit: typeof emit === 'function' ? emit : null,
        now: typeof now === 'function' ? now : () => Date.now()
    };
}

/** Forget everything held in memory (a new game, or a test). */
export function reset() {
    pendingBySubject.clear();
    completedBySubject.clear();
    lastRead = null;
}

export function subjectKey(subject) {
    if (typeof subject === 'string') return subject;
    if (subject && typeof subject === 'object' && subject.kind && subject.id != null) return `${subject.kind}:${subject.id}`;
    return '';
}

function parseKey(subject) {
    const key = subjectKey(subject);
    const at = key.indexOf(':');
    if (at <= 0) return { key, kind: '', id: '' };
    return { key, kind: key.slice(0, at), id: key.slice(at + 1) };
}

/** The request fields that name the subject. */
function subjectFields(parsed) {
    return parsed.kind === 'pc'
        ? { pc_id: parsed.id }
        : { target_type: parsed.kind, target_id: parsed.id };
}

/** The event detail fields that name the subject. */
function subjectDetail(parsed) {
    return parsed.kind === 'pc'
        ? { pcId: parsed.id }
        : { targetType: parsed.kind, targetId: parsed.id };
}

function emitBoth(name, npcId, detail) {
    if (!cfg.emit) return;
    cfg.emit(name, detail);
    if (npcId != null && npcId !== '') cfg.emit(`${name}:${npcId}`, detail);
}

export function noteRequired(subject, body, route = '') {
    const parsed = parseKey(subject);
    if (!parsed.key) return null;
    const b = body || {};
    const entry = {
        kind: typeof b.mfa === 'string' ? b.mfa : (typeof b.kind === 'string' ? b.kind : ''),
        npcId: typeof b.npcId === 'string' ? b.npcId : '',
        // A first-step answer always opens a new server record, so the count starts afresh
        n: Number.isFinite(b.promptsSent) ? b.promptsSent : 0
    };
    // The way in the first step came by (a foothold id, a source PC id, or none at the keyboard)
    if (typeof route === 'string' && route) entry.route = route;
    if (b.number != null) entry.number = b.number;
    if (b.ownPhone === true) entry.ownPhone = true;
    pendingBySubject.set(parsed.key, entry);
    // A new first step starts afresh: a completion left from an earlier attempt is stale
    completedBySubject.delete(parsed.key);
    emitBoth('mfa_required', entry.npcId, { npcId: entry.npcId, kind: entry.kind, ...subjectDetail(parsed) });
    return entry;
}

/** The account's name as the screen knew it at the first step, kept for a pane that opens again later. */
export function noteAccount(subject, account) {
    const entry = pendingBySubject.get(subjectKey(subject));
    if (!entry || !account) return;
    const name = account.displayName || account.username;
    if (name) entry.accountName = String(name);
}

export function pendingFor(subject) {
    return pendingBySubject.get(subjectKey(subject)) || null;
}

export function clear(subject) {
    const key = subjectKey(subject);
    pendingBySubject.delete(key);
    completedBySubject.delete(key);
}

function errorResult(err) {
    const status = Number.isFinite(err?.status) ? err.status : null;
    const body = err?.body && typeof err.body === 'object' ? err.body : {};
    return { ok: false, reason: 'error', status, body };
}

async function call(method, path, payload) {
    if (!cfg.request) return { ok: false, reason: 'error', status: null, body: {} };
    try {
        return { ok: true, body: await cfg.request(method, path, payload) };
    } catch (err) {
        return errorResult(err);
    }
}

export async function readDevice({ itemId } = {}) {
    const res = await call('GET', 'mfa/device', { item_id: itemId });
    if (!res.ok) {
        return { ok: false, reason: res.status === 403 || res.status === 404 ? 'no_device' : 'error', status: res.status, body: res.body };
    }
    const body = res.body || {};
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId : String(itemId ?? '');
    if (body.enrolled === false) {
        if (lastRead && lastRead.deviceId === deviceId) lastRead = null;
    } else if (!body.used && typeof body.code === 'string' && body.code) {
        lastRead = { npcId: body.npcId || '', code: body.code, source: 'item', deviceId, at: cfg.now() };
    }
    return { ok: true, ...body, deviceId };
}

/** The last read code when it belongs to this pending account and the right kind of device, else null. */
export function codeFor(pending) {
    if (!pending || !lastRead || !pending.npcId) return null;
    // A code read long ago has rolled over: do not offer it
    if (cfg.now() - lastRead.at > CODE_FRESH_MS) return null;
    if (lastRead.npcId !== pending.npcId) return null;
    if ((lastRead.source === 'own') !== (pending.ownPhone === true)) return null;
    return lastRead.code;
}

function passed(parsed, body, { keep }) {
    // R3-9: the way in the step began over stays with the completed answer, so only a screen with that way in takes it up
    const route = (pendingBySubject.get(parsed.key) || {}).route || '';
    pendingBySubject.delete(parsed.key);
    const npcId = (body && body.npcId) || '';
    // The code just used must not be offered again for the next sign-in
    if (lastRead && lastRead.npcId === npcId) lastRead = null;
    if (parsed.kind === 'pc') {
        if (keep) completedBySubject.set(parsed.key, { ...body, route });
        if (cfg.onSession) cfg.onSession(parsed.id, body);
    } else {
        completedBySubject.set(parsed.key, { ...body, route });
    }
    return npcId;
}

function failed(parsed, npcId, reason) {
    emitBoth('mfa_failed', npcId, { npcId, reason, ...subjectDetail(parsed) });
}

function refusalResult(parsed, err) {
    const status = err.status;
    const b = err.body;
    const npcId = (pendingBySubject.get(parsed.key) || {}).npcId || '';
    if (b.tooSoon === true) {
        return { ok: false, reason: 'too_soon', status, body: b, retryAfterS: Number.isFinite(b.retryAfterS) ? b.retryAfterS : null };
    }
    if (b.stale) {
        return { ok: false, reason: 'stale', status, body: b, stale: b.stale === 'used' ? 'used' : 'expired' };
    }
    if (b.codeLocked === true || b.closed === true) {
        pendingBySubject.delete(parsed.key);
        failed(parsed, npcId, 'locked');
        return { ok: false, reason: 'locked', status, body: b, retryIn: Number.isFinite(b.retryIn) ? b.retryIn : null };
    }
    if (b.cancelled === true) {
        pendingBySubject.delete(parsed.key);
        failed(parsed, npcId, 'cancelled');
        return { ok: false, reason: 'cancelled', status, body: b };
    }
    if (b.expired === true) {
        pendingBySubject.delete(parsed.key);
        failed(parsed, npcId, 'expired');
        return { ok: false, reason: 'expired', status, body: b };
    }
    if (b.mfaIncorrect === true) {
        failed(parsed, npcId, 'wrong');
        return { ok: false, reason: 'wrong', status, body: b, attemptsLeft: Number.isFinite(b.attemptsLeft) ? b.attemptsLeft : null };
    }
    if (b.noPhone === true) return { ok: false, reason: 'no_phone', status, body: b };
    if (b.lockedOut === true) {
        // The login lockout: wrong codes count against the PC's attempts too
        pendingBySubject.delete(parsed.key);
        failed(parsed, npcId, 'locked_out');
        return { ok: false, reason: 'locked_out', status, body: b, message: typeof b.message === 'string' ? b.message : null };
    }
    // A bare refusal (the record has gone, the account is no longer permitted, the route is closed):
    // the second step cannot go on, so the pending record goes too
    pendingBySubject.delete(parsed.key);
    return { ok: false, reason: 'gone', status, body: b, message: typeof b.message === 'string' ? b.message : null };
}

async function post(path, subject, extra, { keep = false } = {}) {
    const parsed = parseKey(subject);
    const res = await call('POST', path, { ...subjectFields(parsed), ...extra });
    if (!res.ok) {
        // Only "no such phone" means the phone is not held; any other 403 (the PC is off, the route is
        // gone) keeps its own reason in the body for the caller
        if (res.status === 403 && path === 'mfa/approve' && res.body && res.body.error === 'no such phone') return { ...res, reason: 'no_phone' };
        if (res.status === 422) return refusalResult(parsed, res);
        return res;
    }
    const body = res.body || {};
    if (body.success === false) {
        // A 200 answer that did not sign in: a push request still waiting, or a step that has ended
        if (body.approved === false) {
            const entry = pendingBySubject.get(parsed.key);
            if (entry && Number.isFinite(body.promptsSent)) entry.n = body.promptsSent;
            return { ok: true, passed: false, waiting: true, body };
        }
        return refusalResult(parsed, { status: 200, body });
    }
    const npcId = passed(parsed, body, { keep });
    emitBoth('mfa_approved', npcId, { npcId, ...subjectDetail(parsed), by: typeof body.approvedBy === 'string' ? body.approvedBy : 'code' });
    return { ok: true, passed: true, body };
}

export function verify(subject, code) {
    return post('mfa/verify', subject, { code });
}

export async function prompt(subject) {
    const parsed = parseKey(subject);
    const result = await post('mfa/prompt', subject, {});
    if (result.ok && !result.passed && result.waiting) {
        const npcId = (pendingBySubject.get(parsed.key) || {}).npcId || '';
        const n = Number.isFinite(result.body.promptsSent) ? result.body.promptsSent : (pendingBySubject.get(parsed.key) || {}).n || 0;
        emitBoth('mfa_prompt_sent', npcId, { npcId, ...subjectDetail(parsed), n });
    } else if (result.ok && result.passed) {
        // The owner approved on this request: the request itself was sent first
        const npcId = result.body.npcId || '';
        emitBoth('mfa_prompt_sent', npcId, { npcId, ...subjectDetail(parsed), n: Number.isFinite(result.body.promptsSent) ? result.body.promptsSent : 0 });
    }
    return result;
}

export async function phone({ npcId } = {}) {
    const res = await call('GET', 'mfa/phone', { npc_id: npcId });
    if (!res.ok) return { ok: false, reason: res.status === 403 ? 'no_phone' : 'error', status: res.status, body: res.body };
    const body = res.body || {};
    return { ok: true, requests: Array.isArray(body.requests) ? body.requests : [] };
}

/** A tap on the held phone: { number } to approve a number match, { deny: true } to refuse. */
export function approve(subject, { number, deny } = {}) {
    const extra = {};
    if (number != null) extra.number = number;
    if (deny) extra.deny = true;
    return post('mfa/approve', subject, extra, { keep: true });
}

/** The completed answer a child scene left, left in place. Null when there is none. */
export function peekCompleted(subject) {
    return completedBySubject.get(subjectKey(subject)) || null;
}

/** The completed answer a child scene left, handed out once. Null when there is none. */
export function takeCompleted(subject) {
    const key = subjectKey(subject);
    if (!completedBySubject.has(key)) return null;
    const body = completedBySubject.get(key);
    completedBySubject.delete(key);
    return body;
}

/**
 * The pc_signin_failed reason for a refused second step, or null when nothing should be emitted
 * (a stale code, a waiting push, a too-soon request, a transport error, a passed step).
 */
export function failureReason(result) {
    if (!result || result.ok || result.passed) return null;
    switch (result.reason) {
        case 'wrong': return 'mfa_wrong_code';
        case 'locked': return 'mfa_code_locked';
        case 'cancelled': return 'mfa_cancelled';
        case 'expired': return 'mfa_expired';
        case 'locked_out': return 'locked_out';
        default: return null;
    }
}
