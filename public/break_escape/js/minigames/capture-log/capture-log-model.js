// The capture log's rules (engine plan section 6), with no DOM: which held items a holder files,
// the device's sections, the row keys and which rows are new. Since K3d (credential keyring plan
// 8.7) the captures are two sections: Sign-ins (credential rows) and Captures (PINs, footholds
// and findings), both from signin-rows.js.
//
// Filing is a view of the inventory, not a move: an item is filed in the held holder whose id
// equals its storeIn (and whose holds.items is on). The item stays in window.inventory.items;
// its tray slot is hidden by the tray rule.

import { buildSignInRows } from './signin-rows.js';

export const SEEN_GLOBAL = '__capture_log_seen';
// One global per seen row (R3): the row key appended to this prefix, value true. This replaces the
// whole-list write below, so each new row sends one key instead of the whole list. The legacy list
// is still read (readSeen) for an old save but never written again.
export const SEEN_PREFIX = '__capture_log_seen:';
export const HOLDER_TYPE = 'capture_log';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

const dataOf = (item) => (isObj(item?.scenarioData) ? item.scenarioData : (isObj(item) ? item : {}));

/** Whether a held item is a holder (it has a holds block). */
export function isHolder(item) {
    return isObj(dataOf(item).holds);
}

/** footholdId -> name of each held network link (K5: a token row names the link that recorded it). */
export function linkNames(items) {
    const out = new Map();
    for (const it of Array.isArray(items) ? items : []) {
        const d = dataOf(it);
        if (d.type === 'network_link' && isStr(d.footholdId) && isStr(d.name) && !out.has(d.footholdId)) out.set(d.footholdId, d.name);
    }
    return out;
}

/** The held holder that files items with this id, or null. */
export function heldHolder(items, holderId) {
    if (!isStr(holderId) || !Array.isArray(items)) return null;
    return items.find((it) => {
        const d = dataOf(it);
        return d.id === holderId && isObj(d.holds) && d.holds.items === true;
    }) || null;
}

/** The id of the held holder an item is filed in, or null (it stays in the tray). */
export function filedIn(item, items) {
    const d = dataOf(item);
    if (!isStr(d.storeIn) || d.storeIn === d.id) return null;
    return heldHolder(items, d.storeIn) ? d.storeIn : null;
}

/** The items filed in a holder, in inventory order. */
export function filedItems(items, holderId) {
    return (Array.isArray(items) ? items : []).filter((it) => it && filedIn(it, items) === holderId);
}

function firstLine(text) {
    return isStr(text) ? text.split('\n')[0].trim() : '';
}

/** Whether a filed item's click opens a view of contents (source 3). */
function opensContents(d) {
    return Array.isArray(d.contents) || d.hasContents === true;
}

/**
 * The device's sections from the held items, the globals, the keyring answer and (when 9.3a's
 * client is present) the remote sessions. Each row has a key: account:<npcId>, cred:<id>,
 * capture:<targetId>, item:<itemId> or session:<pcId>:<footholdId>. A Sign-ins or Captures row
 * also has seenKeys (its key plus its captures' old capture:<targetId> keys).
 *
 * sessionsSource: an array of pcSessions.list() entries, or null when the remote-session
 * source is not available (no window.pcSessions.list or no window.networkLinks.openSession).
 * keyring: the no-screen GET /keyring answer { entries, captures, firstSeen?, foundVisible? }, or
 * null before the first answer (capture rows from the globals only, tags guessed).
 * secrets: GET /capture_secrets's map, or null. social: the scenario's social block.
 */
export function buildSections({ holder, items, globals, sessionsSource = null, keyring = null, secrets = null, secretsState = null, social = {} }) {
    const hd = dataOf(holder);
    const holds = isObj(hd.holds) ? hd.holds : {};
    const out = { signins: [], hashes: [], captures: [], sessions: [], findings: [] };

    if (holds.captures === true) {
        const rows = buildSignInRows({ captures: isObj(globals?.se_captures) ? globals.se_captures : {}, secrets, secretsState, keyring, social,
            linkNames: linkNames(items) });
        // hash records get a section of their own: a hash is not a sign-in (R1-C15)
        out.signins = rows.signins.filter((r) => r.group !== 'hash');
        out.hashes = rows.signins.filter((r) => r.group === 'hash');
        out.captures = rows.captures;
    }
    if (holds.items !== true) return out;

    const filed = filedItems(items, hd.id);
    const links = [];
    const views = [];
    for (const item of filed) {
        const d = dataOf(item);
        const key = `item:${d.id}`;
        if (d.type === 'network_link') {
            links.push({ key, kind: 'link', item, name: d.name || 'Network link', line: firstLine(d.observations),
                footholdId: d.footholdId || null });
        } else if (opensContents(d)) {
            views.push({ key, kind: 'view', item, name: d.name || 'Session', line: firstLine(d.observations) });
        } else {
            out.findings.push({ key, kind: 'finding', item, name: d.name || 'Finding' });
        }
    }

    // Remote sessions, under the link item whose footholdId they carry; those whose link is not
    // filed go at the end of the section.
    const remote = Array.isArray(sessionsSource)
        ? sessionsSource.filter((s) => isObj(s) && s.remote === true && isStr(s.pcId))
        : [];
    const sessionRow = (s, link) => ({
        key: `session:${s.pcId}:${s.footholdId || ''}`, kind: 'session', session: s, pcId: s.pcId,
        name: s.displayName || s.username || 'Remote session', host: s.host || '',
        line: link ? `Remote session through ${link.name}`
            : (isStr(s.fromPcId) && !s.footholdId ? `Remote session from ${s.fromHost || s.host || 'another desktop'}` : 'Remote session')
    });
    const placed = new Set();
    for (const link of links) {
        out.sessions.push(link);
        for (const s of remote) {
            if (link.footholdId && s.footholdId === link.footholdId) {
                out.sessions.push(sessionRow(s, link));
                placed.add(s);
            }
        }
    }
    for (const s of remote) if (!placed.has(s)) out.sessions.push(sessionRow(s, null));
    out.sessions.push(...views);
    return out;
}

const SECTION_NAMES = ['signins', 'hashes', 'captures', 'sessions', 'findings'];

/** Every row in the sections, in section order. */
export function allRows(sections) {
    return SECTION_NAMES.flatMap((name) => (Array.isArray(sections?.[name]) ? sections[name] : []));
}

/** Every row key in the sections. */
export function rowKeys(sections) {
    return allRows(sections).map((r) => r.key);
}

/**
 * The saved seen set from the globals: the union of the legacy list (read only, for an old save)
 * and every per-row key (a global named SEEN_PREFIX + key whose value is true, R3).
 */
export function readSeen(globals) {
    if (!isObj(globals)) return [];
    const out = new Set();
    const legacy = globals[SEEN_GLOBAL];
    if (Array.isArray(legacy)) for (const k of legacy) if (isStr(k)) out.add(k);
    for (const name in globals) {
        if (name.startsWith(SEEN_PREFIX) && globals[name] === true) {
            const key = name.slice(SEEN_PREFIX.length);
            if (isStr(key)) out.add(key);
        }
    }
    return [...out];
}

/**
 * The keys among these sections that are new (not yet seen). A row counts as seen when any of
 * its seenKeys is (an account row whose capture was seen under its old capture:<targetId> key, in
 * a save from before K3d: a read, nothing is rewritten).
 */
export function newKeys(sections, seen) {
    const s = new Set(seen || []);
    return allRows(sections)
        .filter((r) => !s.has(r.key) && !(Array.isArray(r.seenKeys) && r.seenKeys.some((k) => s.has(k))))
        .map((r) => r.key);
}
