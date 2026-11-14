// The landing-page build client (phish evidence plan, Route 1; moved out of the builder overlay
// so the builder folder stays free of any network API, which social-landing-page-render.test.mjs
// proves by construction).
//
// The builder MODELS a credential-harvest page and must never send what a player types. It types
// nothing in any case: every input is a choice from an authored list. This module posts only the
// closed-set build record (page id, target id and the raw choice ids) so the server recomputes
// the credibility verdict from the choices itself and ignores any client score. No free text and
// no score ever ride the body.
//
// It also holds the bounded in-memory build re-post queue (plan section 11, chunk A review
// major 1): a build POST that fails offline, with a 5xx or with a network error is kept here keyed
// by page id (the build body only, never in player_state) and re-posted on the browser `online`
// event and after a successful sync, builds before sends. The send client (systems/
// se-phish-send-client.js) registers its own drain through registerAfterBuildDrain so one combined
// drain always re-posts the builds first; it is the only module that imports this one, which is the
// single file the builder adds to each JS test harness copy list.

// The custom event the state sync dispatches on a successful sync, so a queued build or send is
// re-posted once the server is reachable again, not only on an offline-to-online transition.
const SYNC_OK_EVENT = 'break-escape:sync-ok';

/**
 * The POST body for a build: the closed set only (page id, target, raw choices). Kept as its own
 * pure function so a test can assert the allowed keys without a network call.
 */
export function landingPageBuildBody({ pageId, targetId, choices }) {
    return { pageId, targetId, choices };
}

// The latest in-flight (or settled) build POST per page id, resolving to { ok } (ok true only on a
// 2xx answer). The phish send client awaits this before it posts a send (plan section 11:
// linkCredible reads the server's own page meetsThreshold, which Route 1 must record first) and
// reads `ok` to tell a failed build that needs re-posting from a landed one. Keyed by page id, so
// it holds at most one promise per page and never grows.
const buildPosts = new Map();

// The bounded re-post queue: one entry per page id, { pageId, targetId, choices, deps }. In memory
// only (never player_state), so the sync size rule is untouched; one entry per page, so it cannot
// grow per attempt.
const buildQueue = new Map();

// The send client's drain, registered once it loads, so the combined drain re-posts builds then
// sends. Null until a send is ever recorded (a build-only session needs no send drain).
let afterBuildDrain = null;
let drainBound = false;

/**
 * The in-flight (or settled) build POST promise for a page id, or null when none was posted.
 */
export function pendingBuildPost(pageId) {
    return buildPosts.get(pageId) || null;
}

/** Register the send-queue drain, run after the build queue drains (builds before sends). */
export function registerAfterBuildDrain(fn) {
    afterBuildDrain = (typeof fn === 'function') ? fn : null;
}

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

// One build POST attempt. Returns { ok } on an HTTP answer (ok true only on a 2xx), or null when
// there is no server to reach (headless, no config), which must NOT queue. A thrown fetch (offline,
// network error) answers { ok: false } so it queues.
async function attemptBuild(body, deps) {
    const cfg = configOf(deps);
    const fetchFn = fetchOf(deps);
    if (!cfg || !cfg.apiBasePath || typeof fetchFn !== 'function') return null;

    const w = windowOf(deps);
    const token = cfg.csrfToken ||
        ((w && w.document) ? w.document.querySelector('meta[name="csrf-token"]')?.content : '') || '';
    try {
        const resp = await fetchFn(`${cfg.apiBasePath}/se/landing_page`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
            body: JSON.stringify(body),
        });
        return { ok: !!(resp && resp.ok) };
    } catch (e) {
        return { ok: false };
    }
}

function enqueueBuild({ pageId, targetId, choices }, deps) {
    if (typeof pageId !== 'string' || !pageId) return;
    // Keep only the deps a later drain needs (fetch/window), never a live closure that could grow.
    buildQueue.set(pageId, { pageId, targetId, choices, deps: { fetch: deps.fetch, window: deps.window } });
    ensurePhishDrainBound(deps);
}

/**
 * Bind the combined drain to the browser `online` event and the sync-ok event, once. Both queues
 * drain builds before sends. Called whenever either queue takes an entry, so a build-only or a
 * send-only session still re-posts on reconnect.
 */
export function ensurePhishDrainBound(deps = {}) {
    if (drainBound) return;
    const w = windowOf(deps);
    if (!w || typeof w.addEventListener !== 'function') return;
    drainBound = true;
    w.addEventListener('online', () => { drainPhishQueues().catch(() => {}); });
    w.addEventListener(SYNC_OK_EVENT, () => { drainPhishQueues().catch(() => {}); });
}

/**
 * Drain the build queue once, re-posting each held build through the normal route. A build that
 * lands (2xx) is dropped and its pending-post record refreshed to a landed one so a waiting send
 * awaits the recorded build; one still offline or erroring stays for the next drain. Idempotent
 * server-side (first-wins per page), so a duplicate never double-records.
 */
export async function drainBuildQueue(extraDeps = {}) {
    if (buildQueue.size === 0) return;
    for (const [pageId, item] of Array.from(buildQueue.entries())) {
        const deps = { ...item.deps, ...extraDeps };
        const res = await attemptBuild(landingPageBuildBody(item), deps);
        if (res && res.ok) {
            buildQueue.delete(pageId);
            buildPosts.set(pageId, Promise.resolve({ ok: true }));
        }
        // res null (no server) or { ok: false } (offline/5xx): keep it queued for the next drain.
    }
}

/** Drain the build queue, then the send queue (builds before sends, plan section 11). */
export async function drainPhishQueues(extraDeps = {}) {
    await drainBuildQueue(extraDeps);
    if (afterBuildDrain) await afterBuildDrain(extraDeps);
}

/**
 * POST the build to the server (phish evidence plan, Route 1). Returns a promise resolving to
 * { ok }, or null when there is no server to reach (headless tests, no config). Non-blocking: a
 * failure never stops the player attaching the page, so the UI is unchanged whether or not the
 * server answers. A failed POST (offline, 5xx, network error) is held in the bounded re-post queue.
 */
export function recordLandingPageBuild({ pageId, targetId, choices }, deps = {}) {
    try {
        const cfg = configOf(deps);
        const fetchFn = fetchOf(deps);
        if (!cfg || !cfg.apiBasePath || typeof fetchFn !== 'function') return null;
        const post = attemptBuild(landingPageBuildBody({ pageId, targetId, choices }), deps)
            .then((res) => {
                // res is never null here (config and fetch are present), so { ok } always.
                if (!res || res.ok !== true) enqueueBuild({ pageId, targetId, choices }, deps);
                return res || { ok: false };
            })
            .catch(() => { enqueueBuild({ pageId, targetId, choices }, deps); return { ok: false }; });
        if (typeof pageId === 'string' && pageId) buildPosts.set(pageId, post);
        return post;
    } catch (e) {
        return null;
    }
}

// Test-only: inspect/reset the module-scoped queues so one run does not leak into the next.
export function _buildQueueSize() {
    return buildQueue.size;
}

export function _resetLandingPageClient() {
    buildPosts.clear();
    buildQueue.clear();
    afterBuildDrain = null;
    drainBound = false;
}
