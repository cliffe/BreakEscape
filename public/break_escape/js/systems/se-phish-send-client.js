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
// `page_not_built_yet` answer triggers a build re-post (if the build POST is missing or failed)
// then re-posts the send once. If it still cannot land (offline, or the build has still not
// committed), it is held in a bounded, in-memory re-send queue keyed by targetId/kitId (one entry
// per target/kit, never grows per attempt). The build client owns the combined drain on the browser
// `online` event and on a successful sync, builds before sends (registerAfterBuildDrain). The server
// records are idempotent (first-wins on a landed send), so a drained duplicate never double-credits.

import {
    pendingBuildPost, drainBuildQueue, registerAfterBuildDrain, ensurePhishDrainBound,
    recordLandingPageBuild,
} from './se-landing-page-client.js';

// The combined online/sync drain lives in the build client (one listener, builds before sends).
// Register the send-queue drain so it runs after the build queue drains. Hoisted, so this is safe
// before drainPhishSendQueue's textual definition below.
registerAfterBuildDrain((deps) => drainPhishSendQueue(deps));

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
// per attempt. Module-scoped: the browser loads this module once, so the queue is shared across the
// session; tests pass their own deps and clear it between runs.
const sendQueue = new Map();

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
    ensurePhishDrainBound(deps);
}

// Whether the build POST for this page is missing (none pending) or failed (settled to not-ok), so
// a retryable send should trigger a build re-post before it tries again (plan section 11).
async function pendingBuildFailed(pageId, deps) {
    const fn = deps.pendingBuildPost || pendingBuildPost;
    let post;
    try { post = fn(pageId); } catch (e) { return true; }
    if (!post || typeof post.then !== 'function') return true; // no build POST recorded
    try { const r = await post; return !(r && r.ok === true); } catch (e) { return true; }
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
        // The build had not committed when the send arrived. If its build POST is missing or
        // failed (offline, 5xx), re-post the queued build first (plan section 11, chunk A major 1),
        // then re-await the build and re-post the send once.
        if (await pendingBuildFailed(pageId, deps)) {
            // Drain with no overriding deps so each queued build re-posts through its OWN stored
            // fetch/window (the real browser falls back to the globals either way); the send's fetch
            // must not post a build.
            const drain = deps.drainBuildQueue || drainBuildQueue;
            try { await drain(); } catch (e) { /* a failed re-post leaves the send for the queue */ }
        }
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
 * double-credits. Run after the build queue drains (the build client's combined drain calls it on
 * the `online` event and after a successful sync); also callable directly.
 */
export async function drainPhishSendQueue(extraDeps = {}) {
    if (sendQueue.size === 0) return;
    for (const [key, item] of Array.from(sendQueue.entries())) {
        const res = await attemptSend(item.body, { ...item.deps, ...extraDeps });
        if (res && !res.retryable) sendQueue.delete(key); // landed, or a permanent below-threshold miss
    }
}

// The authored kind:'link' payload kit ids wired to each landing page, from the scenario's mail
// config. { pageId: [kitId, ...] }; used only to re-drive a reload (below).
function linkKitsByPage(scenario) {
    const out = {};
    const kits = scenario && scenario.social && scenario.social.mailClient &&
        scenario.social.mailClient.payloadKit;
    if (!Array.isArray(kits)) return out;
    for (const k of kits) {
        if (k && k.kind === 'link' && typeof k.landingPageId === 'string' && typeof k.id === 'string') {
            (out[k.landingPageId] || (out[k.landingPageId] = [])).push(k.id);
        }
    }
    return out;
}

/**
 * Re-drive the phish routes once after a reload (plan section 11; chunk A review minor 3). The
 * in-memory queues are lost on a reload, but the durable globalVariables.se_landing_pages keeps the
 * stored choices and victim marker, so on game load the client re-posts each page's build, and for
 * a page whose victim.submitted is set, re-posts the send for its authored target and (min) link
 * kit. Both routes are idempotent and first-wins, and the work is bounded by the authored pages, so
 * this never double-credits and closes the lost-queue-on-reload gap without putting the queue in
 * synced state. A page with no stored choices is skipped entirely: nothing is posted for it.
 */
export async function redrivePhishEvidence(scenario, globals, deps = {}) {
    const pages = globals && globals.se_landing_pages;
    if (!pages || typeof pages !== 'object') return;
    const kitsByPage = linkKitsByPage(scenario);

    for (const [pageId, rec] of Object.entries(pages)) {
        if (!rec || typeof rec !== 'object') continue;
        const choices = rec.choices;
        if (!choices || typeof choices !== 'object') continue; // no stored choices: send nothing

        const targetId = rec.targetId;
        // A+B R2 minor 1: mark the reload re-drive so the server refuses to replace a recorded
        // meetsThreshold build with a weaker one. An honest re-drive carries the same stored
        // choices, so the server recomputes the same verdict and replaces in place.
        const buildPost = recordLandingPageBuild({ pageId, targetId, choices, redrive: true }, deps);
        if (buildPost && typeof buildPost.then === 'function') {
            try { await buildPost; } catch (e) { /* a failed re-post is held in the build queue */ }
        }

        const submitted = rec.victim && rec.victim.submitted === true;
        if (!submitted) continue;
        const kitIds = kitsByPage[pageId] || [];
        if (!kitIds.length) continue;
        // The min kit id, matching the legacy migration's key so a re-drive never splits a row.
        const kitId = kitIds.slice().sort()[0];
        try {
            await recordPhishSend({ message: {}, targetId, kitId, pageId }, deps);
        } catch (e) { /* recordPhishSend never throws, but keep the loop bounded regardless */ }
    }
}

// Test-only: inspect/reset the module-scoped queue so one test run does not leak into the next.
export function _phishSendQueueSize() {
    return sendQueue.size;
}

export function _resetPhishSendClient() {
    sendQueue.clear();
}
