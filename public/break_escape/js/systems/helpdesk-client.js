/**
 * Helpdesk request client (ops layer S8b, unit 08).
 *
 * A leaf module with no imports. Memory only: nothing here is written to storage. The password a
 * grant returns goes to the caller (the form) and to `onGranted`, and nowhere else: it is not
 * kept in module state, in a global or in an event.
 *
 * configure({ request, emit, setGlobal, forms, onGranted })
 *   request(path, payload) -> Promise<body>  resolves to the parsed body on a 2xx and rejects with
 *     an error carrying { status, body } otherwise (the shape ApiClient.post throws).
 *   emit(name, detail)     the event emitter.
 *   setGlobal(name, value) writes a story global.
 *   forms                  the desk forms object, or a function returning it.
 *   onGranted(body)        called with the answer body when a request is granted.
 * Anything not configured is found lazily on `window`:
 *   request    window.ApiClient (or window.APIClient) .post('/helpdesk/request', payload)
 *   emit       window.eventDispatcher.emit
 *   setGlobal  window.stateSync.writeGlobal (the shared global writer), else
 *              window.gameState.globalVariables plus a global_variable_changed:<name> event
 *   forms      window.gameScenario.helpdeskForms
 *   onGranted  window.keyring.refresh(), then window.npcReports.seedLockouts(body.lockoutPcIds)
 *
 * send resolves { result, body }. result: 'granted' | 'refused' | 'blocked' | 'unavailable' |
 * 'error' (bad_request, not_found, a network failure or an unreadable answer).
 */

let cfg = { request: null, emit: null, setGlobal: null, forms: null, onGranted: null };

const win = () => (typeof window !== 'undefined' ? window : null);

export function configure({ request, emit, setGlobal, forms, onGranted } = {}) {
    cfg = {
        request: typeof request === 'function' ? request : null,
        emit: typeof emit === 'function' ? emit : null,
        setGlobal: typeof setGlobal === 'function' ? setGlobal : null,
        forms: forms && (typeof forms === 'object' || typeof forms === 'function') ? forms : null,
        onGranted: typeof onGranted === 'function' ? onGranted : null
    };
}

/** Forget the configuration (a new game, or a test). */
export function reset() {
    cfg = { request: null, emit: null, setGlobal: null, forms: null, onGranted: null };
}

function defaultRequest(path, payload) {
    const w = win();
    const api = w && (w.ApiClient || w.APIClient);
    if (!api || typeof api.post !== 'function') {
        return Promise.reject(Object.assign(new Error('No api client'), { status: null, body: {} }));
    }
    return api.post(`/${path}`, payload || {});
}

function defaultEmit(name, detail) {
    const d = win()?.eventDispatcher;
    if (d && typeof d.emit === 'function') {
        try { d.emit(name, detail); } catch (e) { console.warn(`[helpdesk-client] ${name} listeners threw`, e); }
    }
}

function defaultSetGlobal(name, value) {
    const w = win();
    if (!w) return;
    if (typeof w.stateSync?.writeGlobal === 'function') {
        w.stateSync.writeGlobal(name, value, { openChat: true });
        return;
    }
    if (w.gameState?.globalVariables) w.gameState.globalVariables[name] = value;
    defaultEmit(`global_variable_changed:${name}`, { name, value });
}

function defaultOnGranted(body) {
    const w = win();
    if (!w) return;
    try { w.keyring?.refresh?.(); } catch (e) { /* the next keyring ask still runs */ }
    if (body && Array.isArray(body.lockoutPcIds)) {
        try { w.npcReports?.seedLockouts?.(body.lockoutPcIds); } catch (e) { /* the 30 s check still runs */ }
    }
}

function formsObject() {
    const f = typeof cfg.forms === 'function' ? cfg.forms() : cfg.forms;
    if (f && typeof f === 'object') return f;
    const g = win()?.gameScenario?.helpdeskForms;
    return g && typeof g === 'object' ? g : null;
}

/** The desk's form, { npc, resets, questionLabels }, or null when there is none. */
export function formFor(deskId) {
    const all = formsObject();
    if (!all || typeof deskId !== 'string' || !Object.prototype.hasOwnProperty.call(all, deskId)) return null;
    const f = all[deskId];
    if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
    return {
        npc: typeof f.npc === 'string' ? f.npc : '',
        resets: Array.isArray(f.resets) ? f.resets.filter(r => typeof r === 'string') : [],
        questionLabels: f.questionLabels && typeof f.questionLabels === 'object' && !Array.isArray(f.questionLabels)
            ? { ...f.questionLabels } : {}
    };
}

function resultOf(status, body) {
    const reason = body && typeof body.reason === 'string' ? body.reason : '';
    if (status === 200 && body && body.granted === true) return 'granted';
    if (status === 422 && (reason === 'refused' || reason === 'blocked' || reason === 'unavailable')) return reason;
    return 'error';
}

/**
 * Ask the desk. { deskId, username, what, answers, pcId }; pcId is left out of the request when
 * not given. Never rejects.
 */
export async function send({ deskId, username, what, answers, pcId } = {}) {
    const payload = { desk_id: deskId, username, what, answers: answers && typeof answers === 'object' ? answers : {} };
    if (typeof pcId === 'string' && pcId) payload.pc_id = pcId;
    const request = cfg.request || defaultRequest;
    let status = null;
    let body = {};
    try {
        const out = await request('helpdesk/request', payload);
        status = 200;
        body = out && typeof out === 'object' ? out : {};
    } catch (err) {
        status = Number.isFinite(err?.status) ? err.status : null;
        body = err?.body && typeof err.body === 'object' ? err.body : {};
    }
    const result = resultOf(status, body);
    const setGlobal = cfg.setGlobal || defaultSetGlobal;
    const emit = cfg.emit || defaultEmit;
    if (typeof deskId === 'string' && deskId) {
        try { setGlobal(`helpdesk_${deskId}_result`, result); } catch (e) { console.warn('[helpdesk-client] global not written', e); }
        const detail = { deskId, result };
        emit('helpdesk_answered', detail);
        emit(`helpdesk_answered:${deskId}`, detail);
    }
    if (result === 'granted') {
        try { (cfg.onGranted || defaultOnGranted)(body); } catch (e) { console.warn('[helpdesk-client] onGranted threw', e); }
    }
    return { result, body };
}
