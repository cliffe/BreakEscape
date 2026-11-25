// Capture rows and the secrets loader, shared by the landing page builder's captures view
// (view: "captures") and the capture log device (engine plan section 6).
//
// A row shows one se_captures entry: its role, address, host, the secret or the mask for a
// credential, and the note. The secret is never in the scenario bootstrap: the server serves it
// from GET /capture_secrets once its own record shows the capture was earned (and, for an account
// password, once a capture proof holds). loadCaptureSecrets() asks for it, after awaiting the
// state sync so a capture made a moment ago is on the server first.

import { captureList, capturesReveal, displaySecret, maskSecret, SECRET_LOADING_TEXT, SECRET_FAILED_TEXT } from '../../systems/captures.js';

export { captureList, capturesReveal };

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

/** The note above a list of captures: shown in full (reveal) or acknowledged only (awareness). */
export function captureBannerText(reveal, hasCracked = false) {
    if (reveal) return 'Passwords and PINs this engagement has recorded, shown in full here and masked in the report.';
    return hasCracked
        ? 'A sign-in was captured here. In a real attack this is the victim’s password; this exercise does not record captured passwords (a password you cracked yourself is shown).'
        : 'A sign-in was captured here. In a real attack this is the victim’s password; this exercise does not record it.';
}

/**
 * One capture row. Returns { row, secretNode }: secretNode is the element holding the secret
 * or the mask for a credential in a revealing scenario (fill it with applyCaptureSecrets),
 * else null.
 */
export function buildCaptureRow(entry, social, secretsById = null) {
    const row = el('li', 'lpb-captures-row');
    row.dataset.kind = entry.kind || 'credential';
    if (entry.targetId) row.dataset.targetId = entry.targetId;
    row.appendChild(el('div', 'lpb-captures-role', entry.roleLabel || 'Unknown role'));
    if (entry.address) row.appendChild(el('div', 'lpb-captures-address', entry.address));
    if (entry.kind === 'foothold') {
        const where = entry.host || 'unknown host';
        row.appendChild(el('div', 'lpb-captures-foothold',
            entry.note ? `Foothold on ${where}: ${entry.note}` : `Foothold on ${where}`));
        return { row, secretNode: null };
    }
    if (entry.host) row.appendChild(el('div', 'lpb-captures-host', entry.host));
    const secret = displaySecret(entry, social, secretsById);
    // A revealing scenario whose value has not arrived reads Loading..., never the bullets
    const waiting = secret == null && capturesReveal(social);
    const secretNode = el('div', 'lpb-captures-secret', waiting ? SECRET_LOADING_TEXT : (secret == null ? maskSecret() : secret));
    if (waiting) secretNode.dataset.secretState = 'loading';
    row.appendChild(secretNode);
    if (entry.note) row.appendChild(el('div', 'lpb-captures-note', entry.note));
    return { row, secretNode: capturesReveal(social) ? secretNode : null };
}

/** Fill each { targetId, node } from a { targetId: secret } map. */
export function applyCaptureSecrets(secretRows, secrets) {
    if (!secrets || typeof secrets !== 'object') return;
    for (const { targetId, node } of (secretRows || [])) {
        const s = secrets[targetId];
        if (typeof s === 'string' && s) { node.textContent = s; delete node.dataset.secretState; }
    }
}

/** Show the failure on every row still waiting for its value. */
export function failCaptureSecrets(secretRows) {
    for (const { node } of (secretRows || [])) {
        if (node.dataset.secretState === 'loading') {
            node.textContent = SECRET_FAILED_TEXT;
            node.dataset.secretState = 'failed';
        }
    }
}

/**
 * Fetch the secrets for the given rows, again a few times while a row is not in the answer yet
 * (its state sync may still be on the way). Rows read Loading... meanwhile and Could not load if
 * the attempts end without their value. `alive()` returning false stops it (the view closed).
 */
export async function watchCaptureSecrets(secretRows, { attempts = 4, retryMs = 1500, alive = () => true, deps = {}, onSecrets = null } = {}) {
    const waiting = () => (secretRows || []).some(({ node }) => node.dataset.secretState === 'loading');
    for (let i = 0; i < attempts && waiting(); i++) {
        if (i) await new Promise((r) => setTimeout(r, retryMs));
        if (!alive()) return;
        const secrets = await loadCaptureSecrets(deps);
        if (!alive()) return;
        if (secrets) { applyCaptureSecrets(secretRows, secrets); if (onSecrets) onSecrets(secrets); }
    }
    if (alive()) failCaptureSecrets(secretRows);
}

/**
 * GET /capture_secrets after the state sync is confirmed. Resolves to the { targetId: secret }
 * map, or null on any failure (the rows keep their mask). `deps` lets a test pass a stub
 * stateSync and ApiClient.
 */
export async function loadCaptureSecrets(deps = {}) {
    const stateSync = deps.stateSync !== undefined ? deps.stateSync
        : (typeof window !== 'undefined' ? window.stateSync : null);
    try { await stateSync?.syncConfirmed?.(); } catch { /* best effort: ask anyway */ }
    try {
        let api = deps.ApiClient;
        if (!api) ({ ApiClient: api } = await import('../../api-client.js'));
        const resp = await api.get('/capture_secrets');
        return resp && resp.secrets && typeof resp.secrets === 'object' ? resp.secrets : null;
    } catch (err) {
        console.warn('[captures] could not load capture secrets', err?.message || err);
        return null;
    }
}
