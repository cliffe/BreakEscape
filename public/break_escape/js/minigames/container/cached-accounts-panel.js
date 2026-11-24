// Collect panel (S5b, Ops S5bc unit 21): the "Cached accounts" control on a sign-in desktop.
// Part of the desktop, not an overlay scene. Shown only while the client holds an admin
// session at the PC (the server decides every collect). The button posts to
// POST /games/:id/harvest_credentials with the desktop's own route, then asks the keyring to
// refresh. The panel lists what the server says is held at this PC: headshot, name, username,
// the word "hash" and a Crack button that opens the S7 cracker. No password ever arrives here.
// Every server-sourced string is set by textContent.
import { applyHeadshotBox, SILHOUETTE_URL } from '../../utils/npc-headshot.js';
import { refusalText } from '../network-view/ops-model.js';

export const CACHED_ACCOUNTS_BUTTON_TEXT = 'Cached accounts';
export const CACHED_ACCOUNTS_NOTHING_NEW_TEXT = 'Nothing new is cached here.';
export const CACHED_ACCOUNTS_HASH_TEXT = 'hash';
export const CACHED_ACCOUNTS_CRACK_TEXT = 'Crack';
export const CACHED_ACCOUNTS_NOTE_TEXT = 'The password comes from cracking the hash.';
export const CACHED_ACCOUNTS_STYLE_ID = 'cached-accounts-style';

const STYLE = `
.cached-accounts { flex: 0 0 auto; padding: 4px 8px; background: #1c1c1c; border-bottom: 2px solid #3a3a3a; color: #e8f0e8; font-size: 12px; max-height: 45%; overflow: auto; }
.cached-accounts-bar { display: flex; align-items: center; gap: 8px; }
.cached-accounts-btn { border-radius: 0; border: 2px solid #8a8a8a; }
.cached-accounts-status { min-height: 14px; }
.cached-accounts-list { list-style: none; margin: 4px 0; padding: 0; }
.cached-account-row { display: flex; align-items: center; gap: 8px; padding: 2px 0; border-top: 2px solid #3a3a3a; }
.cached-account-headshot { flex: 0 0 32px; width: 32px; height: 32px; border: 2px solid #8a8a8a; box-sizing: content-box; image-rendering: pixelated; background-repeat: no-repeat; background-position: center; }
.cached-account-name { font-weight: bold; }
.cached-account-username { opacity: 0.8; }
.cached-account-tag { border: 2px solid #8a8a8a; padding: 0 4px; border-radius: 0; }
.cached-account-crack { margin-left: auto; border-radius: 0; border: 2px solid #8a8a8a; }
.cached-accounts-note { opacity: 0.8; }
`;

function ensureStyle(doc) {
    if (!doc?.head || doc.getElementById(CACHED_ACCOUNTS_STYLE_ID)) return;
    const s = doc.createElement('style');
    s.id = CACHED_ACCOUNTS_STYLE_ID;
    s.textContent = STYLE;
    doc.head.appendChild(s);
}

/** The query string a route names, as the desktop's own fetches write it ('' at the keyboard). */
export function cachedAccountsQuery(route) {
    if (route?.relay === true) return '?relay=1';
    if (typeof route?.foothold === 'string' && route.foothold) return `?foothold=${encodeURIComponent(route.foothold)}`;
    if (typeof route?.from === 'string' && route.from) return `?from=${encodeURIComponent(route.from)}`;
    return '';
}

function csrfToken() {
    return window.breakEscapeConfig?.csrfToken
        || document.querySelector?.('meta[name="csrf-token"]')?.content || '';
}

function el(doc, tag, cls, text) {
    const e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
}

function headshotBox(doc, row) {
    const box = el(doc, 'span', 'cached-account-headshot');
    box.setAttribute('aria-hidden', 'true');
    const silhouette = () => { box.hidden = false; box.dataset.frame = 'generic'; box.style.backgroundImage = `url("${SILHOUETTE_URL}")`; };
    silhouette();
    const portrait = typeof row.portrait === 'string' && row.portrait ? row.portrait : null;
    const avatar = typeof row.avatar === 'string' && row.avatar ? row.avatar : null;
    if (portrait || avatar) {
        try {
            applyHeadshotBox(box, { portrait, avatar }, { onResult: (r) => { if (!r) silhouette(); } });
        } catch (e) { silhouette(); }
    }
    return box;
}

/** One held account: `li.cached-account-row`. */
export function buildCachedAccountRow(doc, row, openCracker) {
    const li = el(doc, 'li', 'cached-account-row');
    if (typeof row.hashId === 'string') li.dataset.hashId = row.hashId;
    if (typeof row.npcId === 'string') li.dataset.npcId = row.npcId;
    li.appendChild(headshotBox(doc, row));
    li.appendChild(el(doc, 'span', 'cached-account-name', String(row.displayName ?? '')));
    li.appendChild(el(doc, 'span', 'cached-account-username', String(row.username ?? '')));
    li.appendChild(el(doc, 'span', 'cached-account-tag', CACHED_ACCOUNTS_HASH_TEXT));
    if (typeof row.hashId === 'string' && row.hashId) {
        const b = el(doc, 'button', 'minigame-button cached-account-crack', CACHED_ACCOUNTS_CRACK_TEXT);
        b.type = 'button';
        b.addEventListener('click', (e) => { e.preventDefault?.(); e.stopPropagation?.(); openCracker(row.hashId); });
        li.appendChild(b);
    }
    return li;
}

/**
 * Mounts the control into `host` (the sign-in desktop) and returns { el, collect, destroy }, or
 * null when `isAdmin()` is false (no control for a user session).
 *   pcId: the sign-in PC; route: {relay} | {foothold} | {from} | null; isAdmin: () => boolean;
 *   openCracker(hashId), refreshKeyring(), fetchFn and gameId are injectable.
 */
export function mountCachedAccountsPanel(host, { pcId, route = null, isAdmin = () => false, gameId = null,
    fetchFn = null, openCracker = null, refreshKeyring = null } = {}) {
    if (!host || typeof pcId !== 'string' || !pcId || !isAdmin()) return null;
    const doc = host.ownerDocument || document;
    ensureStyle(doc);
    const root = el(doc, 'div', 'cached-accounts');
    root.dataset.pcId = pcId;
    const bar = el(doc, 'div', 'cached-accounts-bar');
    const button = el(doc, 'button', 'minigame-button cached-accounts-btn', CACHED_ACCOUNTS_BUTTON_TEXT);
    button.type = 'button';
    button.id = 'cached-accounts-btn';
    const status = el(doc, 'div', 'cached-accounts-status', '');
    status.setAttribute('aria-live', 'polite');
    bar.appendChild(button);
    bar.appendChild(status);
    const list = el(doc, 'ul', 'cached-accounts-list');
    list.hidden = true;
    const note = el(doc, 'div', 'cached-accounts-note', CACHED_ACCOUNTS_NOTE_TEXT);
    note.hidden = true;
    root.append(bar, list, note);
    host.insertBefore(root, host.querySelector('.desktop-background') || null);

    const open = openCracker || ((hashId) => {
        try { window.MinigameFramework?.startMinigame?.('ops-cracker', null, { hashId }); } catch (e) { /* the scene could not open */ }
    });
    let busy = false;
    let gone = false;

    const showRows = (rows) => {
        list.replaceChildren();
        for (const r of (Array.isArray(rows) ? rows : [])) if (r && typeof r === 'object') list.appendChild(buildCachedAccountRow(doc, r, open));
        list.hidden = list.childElementCount === 0;
        note.hidden = list.hidden;
    };

    async function collect() {
        if (busy || gone) return null;
        busy = true;
        button.disabled = true;
        status.textContent = '';
        try {
            const gid = gameId || window.gameId || window.breakEscapeConfig?.gameId;
            const send = fetchFn || ((...a) => fetch(...a));
            const response = await send(`/break_escape/games/${gid}/harvest_credentials${cachedAccountsQuery(route)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': csrfToken() },
                body: JSON.stringify({ pc_id: pcId })
            });
            let body = null;
            try { body = await response.json(); } catch (e) { /* no body */ }
            if (gone) return body;
            if (!response.ok || !body || body.success !== true) {
                status.textContent = refusalText(body?.reason);
                return body;
            }
            showRows(body.held);
            status.textContent = Array.isArray(body.harvested) && body.harvested.length ? '' : CACHED_ACCOUNTS_NOTHING_NEW_TEXT;
            try { await (refreshKeyring ? refreshKeyring() : window.keyring?.refresh?.()); } catch (e) { /* the keyring asks again later */ }
            return body;
        } catch (e) {
            if (!gone) status.textContent = refusalText('unknown');
            return null;
        } finally {
            busy = false;
            if (!gone) button.disabled = false;
        }
    }
    button.addEventListener('click', (e) => { e.preventDefault?.(); e.stopPropagation?.(); collect(); });
    return { el: root, collect, destroy() { gone = true; root.remove(); } };
}
