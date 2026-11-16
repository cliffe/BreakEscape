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
// Row keys: `account:<npcId>` (every source of that account's password), `capture:<targetId>`
// (a capture that names no account), `cred:<id>` (a connecting-kind registry entry). A row also
// carries `seenKeys`: its key plus each of its captures' old `capture:<targetId>` keys, so an
// old save's New mark still reads as seen (a read; nothing is rewritten).

import { captureList, displaySecret, maskSecret } from '../../systems/captures.js';
import {
    rowKindName, SOURCE_TAG_TEXT, typeItFromLine, alsoInLine, connectFromInventoryLine,
    useOnSignInScreenLine, endedAssistMessage, expiredLine, moreNotesLine, footholdLine,
    findingLine, pinLine
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
 * oldest first (a capture by its `at`, a registry entry by when this page first got it, then by
 * key).
 *
 *   captures     se_captures (map or list) or the globals
 *   secrets      GET /capture_secrets's map, or null (values show the mask)
 *   keyring      the no-screen GET /keyring answer { entries, captures, firstSeen? } or null
 *                (before the first answer: capture rows from the globals only, tags guessed);
 *                `foundVisible(entry)` when given decides a registry password's file wait
 *   social       the scenario's social block (revealSecret)
 *   openedFiles  a Set or predicate of item ids opened in this page (used without foundVisible)
 */
export function buildSignInRows({ captures, secrets = null, keyring = null, social = {}, openedFiles = null } = {}) {
    const meta = isObj(keyring?.captures) ? keyring.captures : {};
    const entries = Array.isArray(keyring?.entries) ? keyring.entries.filter((e) => isObj(e) && isStr(e.id)) : [];
    const firstSeen = keyring?.firstSeen;
    const seenAt = (id) => {
        const v = firstSeen instanceof Map ? firstSeen.get(id) : (isObj(firstSeen) ? firstSeen[id] : null);
        return Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER;
    };
    const visible = makeVisible(keyring, openedFiles);

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

    // 1. captures, oldest first (the server's tag and account join when it has answered)
    for (const c of captureEntries(captures)) {
        const m = isObj(meta[c.targetId]) ? meta[c.targetId] : null;
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
            const value = displaySecret(c, social, secrets);
            row.value = value == null ? maskSecret() : value;
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
            pushOnce(row.kinds, 'in_file');
            pushOnce(row.sources, sourceTagOfHow(e.how));
            row.order = Math.min(row.order, seenAt(e.id));
            continue;
        }
        if (!CONNECTING_KINDS.includes(e.kind)) continue;
        const key = `cred:${e.id}`;
        const row = { key, type: 'credential', kinds: [e.kind], sources: [], captures: [], seenKeys: [key],
            order: seenAt(e.id), entry: e, title: who, subtitle: e.account?.username || null, label: e.label || null };
        if (e.kind === 'token') {
            // K5 hook (plan 8.7, token row): K5 fills the "through {link}, about {n} min left" line
            // from its own fields; until then a token row is drawn with its tag and source only.
            pushOnce(row.sources, SOURCE_TAG_TEXT.recorded);
            if (e.expired === true) { row.greyed = true; row.use = expiredLine(e.label); }
            else row.use = useOnSignInScreenLine(e.host);
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
        const caps = row.captures;
        const first = caps[0] || null;
        const named = isStr(row.npcId) ? entries.find((e) => e.account?.npcId === row.npcId && (e.account.displayName || e.account.username)) : null;
        row.title = named?.account?.displayName || first?.roleLabel || named?.account?.username || null;
        row.subtitle = first?.address || named?.account?.username || null;
        row.lines = [];
        if (caps.length) {
            // The value: the one served for the oldest capture that has one; with none, the mask
            let value = null;
            let valueTargetId = first.targetId;
            for (const c of caps) {
                const v = displaySecret(c, social, secrets);
                if (v != null) { value = v; valueTargetId = c.targetId; break; }
            }
            row.value = value == null ? maskSecret() : value;
            row.valueTargetId = valueTargetId;
            row.use = row.value;
            if (row.password) row.lines.push(alsoInLine(row.password.label));
            const notes = caps.map((c) => c.note).filter(isStr);
            row.lines.push(...notes.slice(0, MAX_ROW_NOTES));
            if (notes.length > MAX_ROW_NOTES) row.lines.push(moreNotesLine(notes.length - MAX_ROW_NOTES));
        } else if (row.password) {
            // A password in a file alone: never the value
            row.use = typeItFromLine(row.password.label);
        }
    }

    const rows = [...byKey.values()].sort((a, b) => (a.order - b.order) || a.key.localeCompare(b.key));
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
    if (r.greyed) row.classList.add('signin-row-greyed');
    const tags = el('div', 'signin-tags');
    for (const k of r.kinds || []) {
        const t = el('span', 'signin-tag signin-tag-kind', rowKindName(k));
        t.dataset.kind = k;
        tags.appendChild(t);
    }
    for (const s of r.sources || []) tags.appendChild(el('span', 'signin-tag signin-tag-source', s));
    row.appendChild(tags);
    if (r.title) row.appendChild(el('div', 'signin-title', r.title));
    if (r.subtitle && r.subtitle !== r.title) row.appendChild(el('div', 'signin-subtitle', r.subtitle));
    let secretNode = null;
    if (r.use != null && r.use !== '') {
        const use = el('div', 'signin-use', r.use);
        if (r.value != null && r.use === r.value) {
            use.classList.add('signin-secret', 'lpb-captures-secret');
            secretNode = use;
        }
        row.appendChild(use);
    }
    for (const line of r.lines || []) row.appendChild(el('div', 'signin-line', line));
    return { row, secretNode };
}
