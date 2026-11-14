// The phish send client (phish evidence plan, Route 2). Kept in systems/, imported dynamically by
// the mail client, so no mail-client test harness copy list has to carry a network module and the
// builder folder stays free of network calls (social-landing-page-render proves the latter).
//
// The mail client already judges the send and reveals the captured credential on its own; this
// module posts the send to the server as a second, server-owned record. The server computes
// `landed` from its own landing-page store (the lighter gate), ignoring anything the body asserts,
// so the body is only the composed message bounded to the mail client's own PENDING_MESSAGE_KEYS
// plus the target and kit. No free text and no verdict ever decide anything server-side.
//
// Ordering (plan section 11): linkCredible on the server reads the page's server-recorded
// meetsThreshold, so the send must not be judged before Route 1 has recorded the build. The send
// therefore awaits the build POST's own promise (pendingBuildPost) before posting, and on a
// `page_not_built_yet` answer re-awaits and re-posts once. If it still cannot land (offline, or the
// build has still not committed), it is held in a bounded, in-memory re-send queue keyed by
// targetId/kitId (one entry per target/kit, never grows per attempt) and drained on the browser
// `online` event. The server records are idempotent (first-wins on a landed send), so a drained
// duplicate never double-credits.

import { pendingBuildPost } from './se-landing-page-client.js';

// The keys the mail client persists on a sent record (mail-bridge.js PENDING_MESSAGE_KEYS). The
// send body is the composed message bounded to exactly these, plus targetId and kitId.
const PENDING_MESSAGE_KEYS = Object.freeze([
    'fromAccount', 'to', 'targetId', 'subject', 'headerFrom',
    'templates', 'slots', 'attachment', 'attachmentKind',
    'link', 'linkText', 'linkInfo', 'inReplyTo',
]);

/**
 * The POST body for a send: the composed message bounded to the known key set, plus the target and
 * kit. Pure, so a test can assert the allowed keys without a network call.
 */
export function phishSendBody({ message, targetId, kitId }) {
    const out = {};
    const m = (message && typeof message === 'object') ? message : {};
    for (const k of PENDING_MESSAGE_KEYS) {
        if (m[k] !== undefined) out[k] = m[k];
    }
    out.targetId = targetId;
    out.kitId = kitId;
    return out;
}

// One entry per targetId/kitId, so the queue holds at most one send per target/kit and cannot grow
// per attempt. Module-scoped: the browser loads this module once, so the queue and the online
// listener are shared across the session; tests pass their own deps and clear it between runs.
const sendQueue = new Map();
let onlineBound = false;

function windowOf(deps) {
    return deps.window ?? (typeof window !== 'undefined' ? window : null);
}

function configOf(deps) {
    const w = windowOf(deps);
    return (w && w.breakEscapeConfig) || null;
}

function fetchOf(deps) {
    if (typeof deps.fetch === 'function') return deps.fetch;
    return (typeof fetch === 'function') ? fetch : null;
}

function buildPostFor(pageId, deps) {
    const fn = deps.pendingBuildPost || pendingBuildPost;
    try { return fn(pageId); } catch (e) { return null; }
}

async function awaitBuild(pageId, deps) {
    const post = buildPostFor(pageId, deps);
    if (post && typeof post.then === 'function') {
        try { await post; } catch (e) { /* a failed build POST still lets the send try */ }
    }
}

// One POST attempt. Returns the parsed answer shape { landed, retryable, raw } on an HTTP answer,
// or null when there is no server to reach or the request failed (offline, network error).
async function attemptSend(body, deps) {
    const cfg = configOf(deps);
    const fetchFn = fetchOf(deps);
    if (!cfg || !cfg.apiBasePath || typeof fetchFn !== 'function') return null;

    const w = windowOf(deps);
    const token = cfg.csrfToken ||
        ((w && w.document) ? w.document.querySelector('meta[name="csrf-token"]')?.content : '') || '';
    try {
        const resp = await fetchFn(`${cfg.apiBasePath}/se/phish_send`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
            body: JSON.stringify(body),
        });
        if (!resp || typeof resp.json !== 'function') return null;
        const json = await resp.json().catch(() => null);
        if (!json || typeof json !== 'object') return null;
        return { landed: json.landed === true, retryable: json.retryable === true, raw: json };
    } catch (e) {
        return null;
    }
}

function enqueue(key, body, deps) {
    // Keep only the deps a later drain needs (fetch/window), never a live closure that could grow.
    sendQueue.set(key, { body, deps: { fetch: deps.fetch, window: deps.window, pendingBuildPost: deps.pendingBuildPost } });
    bindOnlineDrain(deps);
}

function bindOnlineDrain(deps) {
    if (onlineBound) return;
    const w = windowOf(deps);
    if (!w || typeof w.addEventListener !== 'function') return;
    onlineBound = true;
    w.addEventListener('online', () => { drainPhishSendQueue().catch(() => {}); });
}

/**
 * Post one phish send. Awaits the build POST first, retries once on `page_not_built_yet`, and
 * queues the send (bounded, keyed by targetId/kitId) when it is offline or still not built. Returns
 * the answer shape, or null when there was no server to reach. Never throws.
 */
export async function recordPhishSend({ message, targetId, kitId, pageId }, deps = {}) {
    const key = `${targetId}/${kitId}`;
    const body = phishSendBody({ message, targetId, kitId });

    await awaitBuild(pageId, deps);
    let res = await attemptSend(body, deps);

    if (res && res.retryable) {
        // The build POST had not committed when the send arrived; re-await it and re-post once.
        await awaitBuild(pageId, deps);
        res = await attemptSend(body, deps);
    }

    if (res === null || (res && res.retryable)) {
        // Offline, or still not built after the one re-post: hold it for the online/sync drain.
        enqueue(key, body, deps);
    }
    return res;
}

/**
 * Drain the offline re-send queue once, re-posting each held send through the normal route. A send
 * that lands or is a permanent miss (landed false, not retryable) is dropped; one still offline or
 * still not built stays for the next drain. Idempotent server-side, so a duplicate never
 * double-credits. Call on the `online` event (bound here) and after a successful sync.
 */
export async function drainPhishSendQueue(extraDeps = {}) {
    if (sendQueue.size === 0) return;
    for (const [key, item] of Array.from(sendQueue.entries())) {
        const res = await attemptSend(item.body, { ...item.deps, ...extraDeps });
        if (res && !res.retryable) sendQueue.delete(key); // landed, or a permanent below-threshold miss
    }
}

// Test-only: inspect/reset the module-scoped queue so one test run does not leak into the next.
export function _phishSendQueueSize() {
    return sendQueue.size;
}

export function _resetPhishSendClient() {
    sendQueue.clear();
    onlineBound = false;
}
