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
// No static imports: the builder adds exactly this one file to each JS test harness copy list.

/**
 * The POST body for a build: the closed set only (page id, target, raw choices). Kept as its own
 * pure function so a test can assert the allowed keys without a network call.
 */
export function landingPageBuildBody({ pageId, targetId, choices }) {
    return { pageId, targetId, choices };
}

// The latest in-flight (or last) build POST promise per page id, so the phish send client
// (systems/se-phish-send-client.js) can await the build being recorded before it posts a send
// (plan section 11: linkCredible reads the server's own page meetsThreshold, which Route 1 must
// record first). Keyed by page id, so it holds at most one promise per page and never grows.
const buildPosts = new Map();

/**
 * The in-flight (or settled) build POST promise for a page id, or null when none was posted.
 */
export function pendingBuildPost(pageId) {
    return buildPosts.get(pageId) || null;
}

/**
 * POST the build to the server (phish evidence plan, Route 1). Returns the fetch promise, or null
 * when there is no server to reach (headless tests, no config). Non-blocking: a failure never
 * stops the player attaching the page, so the UI is unchanged whether or not the server answers.
 */
export function recordLandingPageBuild({ pageId, targetId, choices }) {
    try {
        const cfg = (typeof window !== 'undefined') ? window.breakEscapeConfig : null;
        if (!cfg || !cfg.apiBasePath || typeof fetch !== 'function') return null;
        const token = cfg.csrfToken ||
            ((typeof document !== 'undefined') ? document.querySelector('meta[name="csrf-token"]')?.content : '') || '';
        const post = fetch(`${cfg.apiBasePath}/se/landing_page`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
            body: JSON.stringify(landingPageBuildBody({ pageId, targetId, choices }))
        }).catch(() => null);
        if (typeof pageId === 'string' && pageId) buildPosts.set(pageId, post);
        return post;
    } catch (e) {
        return null;
    }
}
