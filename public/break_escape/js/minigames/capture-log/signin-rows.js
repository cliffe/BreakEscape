// The capture log's Sign-ins list (credential keyring plan 8.7, slice K3d): the rows, with no
// DOM in buildSignInRows, and a DOM builder beside capture-rows.js's buildCaptureRow.
//
// A row is one thing the player has captured or can sign in with. Credential rows (the
// sign-ins) go under "Sign-ins"; capture rows that are not credentials (a PIN, a foothold, a
// finding) go under "Captures". Sources:
//   - the se_captures global (display only: the server owns it), oldest first;
//   - GET /keyring's `captures` map { targetId: { tag, source, account? } }, the server's tag
//     and account join (the client never normalises an address);
//   - GET /keyring's registry entries (implicit capture entries add no row);
//   - GET /capture_secrets's { targetId: secret } map for a captured value.
// A hash record (S7) is a row of its own in a group of its own (group 'hash', listed after the
// rest): key `hash:<id>`, the account's username, the token in groups of four, a Salted marker,
// the status words, and a Crack button for a ready or running one. It never holds a password;
// once cracked the account's password row (source "cracked", value attached) shows beside it.
// Row keys: `account:<npcId>` (every source of that account's password), `capture:<targetId>`
// (a capture that names no account), `cred:<id>` (a connecting-kind registry entry). A row also
// carries `seenKeys`: its key plus each of its captures' old `capture:<targetId>` keys, so an
// old save's New mark still reads as seen (a read; nothing is rewritten).

import { captureList, capturesReveal, displaySecret, maskSecret, SECRET_LOADING_TEXT, SECRET_FAILED_TEXT } from '../../systems/captures.js';
import {
    rowKindName, SOURCE_TAG_TEXT, typeItFromLine, alsoInLine, connectFromInventoryLine,
    useOnSignInScreenLine, endedAssistMessage, expiredLine, moreNotesLine, footholdLine,
    findingLine, pinLine, tokenUseLine, hashTokenText, hashStatusText, CRACK_BUTTON_TEXT, HASH_SALTED_TEXT
} from '../../utils/remote-host-text.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

/** At most this many capture notes on one account row, then "and {n} more." */
export const MAX_ROW_NOTES = 2;

const CONNECTING_KINDS = ['saved_connection', 'assist_invite', 'token'];

/** A capture's tag before GET /keyring has answered: a guess from the entry's kind alone. */
function fallbackTag(entry) {
    return entry.kind === 'foothold' ? 'foothold' : 'password';
}

function sourceTagOfCapture(meta) {
    return meta?.source === 'phished' ? SOURCE_TAG_TEXT.phished : SOURCE_TAG_TEXT.recorded;
}

function sourceTagOfHow(how) {
    return SOURCE_TAG_TEXT[how] || SOURCE_TAG_TEXT.found;
}

function pushOnce(list, v) {
    if (v && !list.includes(v)) list.push(v);
}

/** The captures as a list, oldest first; accepts the globals-shaped map, a list, or the globals. */
function captureEntries(captures) {
    if (Array.isArray(captures)) return captures.filter((c) => isObj(c) && isStr(c.targetId)).sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.targetId).localeCompare(String(b.targetId)));
    if (isObj(captures) && isObj(captures.se_captures)) return captureList(captures);
    if (isObj(captures)) return captureList({ se_captures: captures });
    return [];
}

/** Whether a registry password's file has been opened (or the caller's own predicate says so). */
function makeVisible(keyring, openedFiles) {
    if (typeof keyring?.foundVisible === 'function') return (e) => keyring.foundVisible(e);
    const opened = typeof openedFiles === 'function' ? openedFiles
        : (openedFiles instanceof Set ? (id) => openedFiles.has(id) : () => false);
    return (e) => !isStr(e.foundIn) || opened(e.foundIn);
}

/**
 * The rows (plan 8.7). Returns { signins, captures }: credential rows and capture rows, each
 * oldest first (a capture by its `at`, a registry entry by the server's `gainedAt`, else when this page first got it, then by
 * key).
 *
 *   captures     se_captures (map or list) or the globals
 *   secrets      GET /capture_secrets's map, or null (values show the mask)
 *   keyring      the no-screen GET /keyring answer { entries, captures, firstSeen? } or null
 *                (before the first answer: capture rows from the globals only, tags guessed);
 *                `foundVisible(entry)` when given decides a registry password's file wait
 *   social       the scenario's social block (revealSecret)
 *   openedFiles  a Set or predicate of item ids opened in this page (used without foundVisible)
 *   linkNames    footholdId -> the held network link's name (a Map or object), for a token row
 * The keyring answer may carry `tokenSecondsLeft(credId)` (K5): a live token row names its minutes.
 */

/**
 * What a captured value reads as. The served secret when there is one; else, in a scenario that
 * reveals secrets, a loading or failed notice (secretsState 'loading' or 'failed') so the row
 * never shows bullets as if they were the value; else the mask (awareness labs, or no state given).
 */
function valueFor(c, social, secrets, secretsState) {
    const v = displaySecret(c, social, secrets);
    if (v != null) return { value: v, valueState: null };
    if (capturesReveal(social) && c?.kind === 'credential') {
        if (secretsState === 'loading') return { value: SECRET_LOADING_TEXT, valueState: 'loading' };
        if (secretsState === 'failed') return { value: SECRET_FAILED_TEXT, valueState: 'failed' };
    }
    return { value: maskSecret(), valueState: null };
}

export function buildSignInRows({ captures, secrets = null, secretsState = null, keyring = null, social = {}, openedFiles = null, linkNames = null } = {}) {
    const meta = isObj(keyring?.captures) ? keyring.captures : {};
    const entries = Array.isArray(keyring?.entries) ? keyring.entries.filter((e) => isObj(e) && isStr(e.id)) : [];
    const firstSeen = keyring?.firstSeen;
    const seenAt = (id) => {
        const v = firstSeen instanceof Map ? firstSeen.get(id) : (isObj(firstSeen) ? firstSeen[id] : null);
        return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER;
    };
    // The server's gained time (stable across a reload); this page's first sight when it has none
    const gainedAt = (e) => (Number.isFinite(e.gainedAt) ? e.gainedAt : seenAt(e.id));
    const visible = makeVisible(keyring, openedFiles);
    const linkNameOf = (id) => {
        const v = linkNames instanceof Map ? linkNames.get(id) : (isObj(linkNames) ? linkNames[id] : null);
        return isStr(v) ? v : null;
    };

    const byKey = new Map();
    const accountRow = (npcId) => {
        const key = `account:${npcId}`;
        if (!byKey.has(key)) {
            byKey.set(key, {
                key, type: 'credential', npcId, kinds: [], sources: [], captures: [], password: null,
                seenKeys: [key], order: Number.MAX_SAFE_INTEGER
            });
        }
        return byKey.get(key);
    };

    // 1. captures, oldest first (the server's tag and account join when it has answered). Once
    // an answer exists, a capture it does not list yet (recorded since that answer, or one the
    // server skips) is held back until the next answer: guessing a tag for it would draw a second
    // row for an account the join has not reached, and count it in the badge.
    const answered = isObj(keyring?.captures);
    for (const c of captureEntries(captures)) {
        const m = isObj(meta[c.targetId]) ? meta[c.targetId] : null;
        if (answered && !m) continue;
        const tag = m?.tag || fallbackTag(c);
        const at = Number.isFinite(c.at) ? c.at : 0;
        const oldKey = `capture:${c.targetId}`;
        if (tag === 'password') {
            if (isStr(m?.account)) {
                const row = accountRow(m.account);
                row.captures.push(c);
                pushOnce(row.kinds, 'captured');
                pushOnce(row.sources, sourceTagOfCapture(m));
                pushOnce(row.seenKeys, oldKey);
                row.order = Math.min(row.order, at);
            } else {
                byKey.set(oldKey, {
                    key: oldKey, type: 'credential', kinds: ['captured'], sources: [sourceTagOfCapture(m)],
                    captures: [c], seenKeys: [oldKey], order: at
                });
            }
            continue;
        }
        // A PIN, a foothold or a finding: a capture row, no source tag (its note says how)
        const row = { key: oldKey, type: 'capture', kinds: [tag], sources: [], captures: [c], seenKeys: [oldKey], order: at,
            title: c.roleLabel || null, subtitle: c.address || null, note: c.note || null };
        if (tag === 'pin') {
            const got = valueFor(c, social, secrets, secretsState);
            row.value = got.value;
            row.valueState = got.valueState;
            row.valueTargetId = c.targetId;
            row.use = pinLine(c.host, row.value);
            if (row.note) row.lines = [row.note];
        } else if (tag === 'foothold') {
            row.use = footholdLine(c.host, c.note);
        } else {
            row.use = findingLine(c.host, c.note) || null;
        }
        byKey.set(oldKey, row);
    }

    // 2. registry entries (implicit capture entries add no row)
    for (const e of entries) {
        if (e.source === 'capture') continue;
        const who = e.account?.displayName || e.account?.username || null;
        if (e.kind === 'password') {
            if (!visible(e)) continue;
            const npcId = e.account?.npcId;
            if (!isStr(npcId)) continue;
            const row = accountRow(npcId);
            row.password = e;
            pushOnce(row.kinds, e.source === 'cracked' ? 'cracked' : 'in_file');
            pushOnce(row.sources, e.source === 'cracked' ? SOURCE_TAG_TEXT.cracked : sourceTagOfHow(e.how));
            row.order = Math.min(row.order, gainedAt(e));
            continue;
        }
        if (e.kind === 'hash') {
            const key = `hash:${e.id}`;
            const status = ['ready', 'running', 'infeasible', 'cracked'].includes(e.status) ? e.status : 'ready';
            let secs = null;
            if (status === 'running') {
                const live = typeof keyring?.crackSecondsLeft === 'function' ? keyring.crackSecondsLeft(e.id) : null;
                secs = Number.isFinite(live) ? live : (Number.isFinite(e.readyInSeconds) ? Math.max(0, e.readyInSeconds) : 0);
            }
            byKey.set(key, { key, type: 'credential', group: 'hash', kinds: ['hash'], sources: [], captures: [], seenKeys: [key],
                order: gainedAt(e), entry: e, hashId: e.id, title: who, subtitle: e.account?.username || null, label: e.label || null,
                token: hashTokenText(e.token), salted: e.salted === true, status, secondsLeft: secs,
                canCrack: status === 'ready' || status === 'running', use: hashStatusText(status, secs) });
            continue;
        }
        if (!CONNECTING_KINDS.includes(e.kind)) continue;
        const key = `cred:${e.id}`;
        const row = { key, type: 'credential', kinds: [e.kind], sources: [], captures: [], seenKeys: [key],
            order: gainedAt(e), entry: e, title: who, subtitle: e.account?.username || null, label: e.label || null };
        if (e.kind === 'token') {
            // K5 (plan 10): where to use it, through the link that recorded it, and the minutes left
            pushOnce(row.sources, SOURCE_TAG_TEXT.recorded);
            const left = typeof keyring?.tokenSecondsLeft === 'function' ? keyring.tokenSecondsLeft(e.id) : null;
            // Run out by the page's own clock (K5 R1 m2): grey it now, without waiting for a GET;
            // the server refuses it either way
            if (e.expired === true || left === 0) { row.greyed = true; row.use = expiredLine(e.label); }
            else {
                const proof = Array.isArray(e.routes) ? e.routes.find((r) => isObj(r) && isStr(r.foothold))?.foothold : null;
                const secs = typeof keyring?.tokenSecondsLeft === 'function' ? keyring.tokenSecondsLeft(e.id) : null;
                row.use = tokenUseLine(e.host || e.connectsTo, proof ? linkNameOf(proof) : null, secs);
                row.timed = Number.isFinite(secs);
            }
        } else {
            pushOnce(row.sources, sourceTagOfHow(e.how));
            if (e.kind === 'assist_invite' && e.ended === true) {
                row.greyed = true;
                row.use = endedAssistMessage(who);
            } else if (isStr(e.heldItem) || e.kind === 'assist_invite') {
                row.use = connectFromInventoryLine(e.label);
            } else {
                // A saved connection a foothold recorded: no tray item, so no Connect
                row.use = useOnSignInScreenLine(e.host || e.connectsTo);
            }
        }
        byKey.set(key, row);
    }

    // 3. the account rows' text: the oldest capture gives role, address and note
    for (const row of byKey.values()) {
        if (!row.key.startsWith('account:') && !(row.type === 'credential' && row.captures.length && !row.entry)) continue;
        if (row.group === 'hash') continue;
        const caps = row.captures;
        const first = caps[0] || null;
        const named = isStr(row.npcId) ? entries.find((e) => e.account?.npcId === row.npcId && (e.account.displayName || e.account.username)) : null;
        row.title = named?.account?.displayName || first?.roleLabel || named?.account?.username || null;
        row.subtitle = first?.address || named?.account?.username || null;
        row.lines = [];
        if (caps.length) {
            // The value: the one served for the oldest capture that has one; with none, the mask
            let got = null;
            let valueTargetId = first.targetId;
            for (const c of caps) {
                const v = displaySecret(c, social, secrets);
                if (v != null) { got = { value: v, valueState: null }; valueTargetId = c.targetId; break; }
            }
            if (!got) got = valueFor(first, social, secrets, secretsState);
            row.value = got.value;
            row.valueState = got.valueState;
            row.valueTargetId = valueTargetId;
            row.use = row.value;
            // A cracked password always shows in full: the player earned it, and this row has to type it
            if (row.password?.source === 'cracked' && isStr(row.password.password)) {
                row.value = row.password.password;
                row.valueState = null;
                row.valueTargetId = null;
                row.use = row.value;
            }
            if (row.password) row.lines.push(alsoInLine(row.password.label));
            const notes = caps.map((c) => c.note).filter(isStr);
            row.lines.push(...notes.slice(0, MAX_ROW_NOTES));
            if (notes.length > MAX_ROW_NOTES) row.lines.push(moreNotesLine(notes.length - MAX_ROW_NOTES));
        } else if (row.password?.source === 'cracked' && isStr(row.password.password)) {
            row.value = row.password.password;
            row.valueState = null;
            row.use = row.value;
        } else if (row.password) {
            // A password in a file alone: never the value
            row.use = typeItFromLine(row.password.label);
        }
    }

    const rows = [...byKey.values()].sort((a, b) => ((a.group === 'hash') - (b.group === 'hash')) || (a.order - b.order) || a.key.localeCompare(b.key));
    const signins = rows.filter((r) => r.type === 'credential');
    const capturesOut = rows.filter((r) => r.type === 'capture');
    return { signins, captures: capturesOut };
}

// ---- DOM -----------------------------------------------------------------------------------

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

/**
 * One row as an <li>. Returns { row, secretNode }: secretNode holds a captured value or the mask
 * (fill it when GET /capture_secrets answers), else null. All text is set as textContent.
 */
export function buildSignInRow(r) {
    const row = el('li', 'signin-row');
    row.dataset.rowType = r.type;
    if (r.group === 'hash') return buildHashRow(r, row);
    if (r.greyed) row.classList.add('signin-row-greyed');
    if (r.timed) row.dataset.timed = 'true';
    const tags = el('div', 'signin-row-tags');
    for (const k of r.kinds || []) {
        const t = el('span', 'signin-row-tag signin-row-tag-kind', rowKindName(k));
        t.dataset.kind = k;
        tags.appendChild(t);
    }
    for (const s of r.sources || []) tags.appendChild(el('span', 'signin-row-tag signin-row-tag-source', s));
    row.appendChild(tags);
    if (r.title) row.appendChild(el('div', 'signin-row-title', r.title));
    if (r.subtitle && r.subtitle !== r.title) row.appendChild(el('div', 'signin-subtitle', r.subtitle));
    let secretNode = null;
    if (r.use != null && r.use !== '') {
        const use = el('div', 'signin-use', r.use);
        if (r.value != null && r.use === r.value) {
            use.classList.add('signin-secret', 'lpb-captures-secret');
            if (r.valueState) { use.classList.add(`signin-secret-${r.valueState}`); use.dataset.secretState = r.valueState; }
            secretNode = use;
        }
        row.appendChild(use);
    }
    for (const line of r.lines || []) row.appendChild(el('div', 'signin-line', line));
    return { row, secretNode };
}

/** A hash row's <li> (S7): username, token, Salted marker, status, and Crack for a ready or running one. */
function buildHashRow(r, row) {
    row.classList.add('signin-row-hash');
    row.dataset.hashId = r.hashId;
    row.dataset.status = r.status;
    const tags = el('div', 'signin-row-tags');
    const kind = el('span', 'signin-row-tag signin-row-tag-kind', rowKindName('hash'));
    kind.dataset.kind = 'hash';
    tags.appendChild(kind);
    if (r.salted) {
        const salt = el('span', 'signin-row-tag signin-row-tag-source signin-hash-salted', HASH_SALTED_TEXT);
        tags.appendChild(salt);
    }
    row.appendChild(tags);
    if (r.title) row.appendChild(el('div', 'signin-row-title', r.title));
    if (r.subtitle && r.subtitle !== r.title) row.appendChild(el('div', 'signin-subtitle', r.subtitle));
    if (r.token) row.appendChild(el('div', 'signin-hash-token', r.token));
    const status = el('div', 'signin-use signin-hash-status', r.use);
    row.appendChild(status);
    if (r.status === 'running' && Number.isFinite(r.secondsLeft) && r.secondsLeft > 0) {
        // Counts down on this page's clock from the served wait; at 0 it reads "Ready to finish"
        const endsAt = Date.now() + r.secondsLeft * 1000;
        let wasAttached = false;
        const timer = setInterval(() => {
            if (row.isConnected) wasAttached = true;
            else if (wasAttached) { clearInterval(timer); return; }
            const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            status.textContent = hashStatusText('running', left);
            if (left <= 0) clearInterval(timer);
        }, 1000);
        timer.unref?.();
    }
    if (r.canCrack) {
        const button = el('button', 'signin-crack', CRACK_BUTTON_TEXT);
        button.type = 'button';
        button.addEventListener('click', (e) => {
            e.preventDefault?.(); e.stopPropagation?.();
            try { window.MinigameFramework?.startMinigame?.('ops-cracker', null, { hashId: r.hashId }); } catch (err) { /* the scene could not open */ }
        });
        row.appendChild(button);
    }
    return { row, secretNode: null };
}
