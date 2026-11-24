/**
 * The words a remote sign-in screen, the tray and the network view use for a host reached over
 * the network (credential keyring plan 8.5, "one phrasing per state"): one helper per state, so
 * the screens cannot drift apart. `host` is the host label the server answers (or the view
 * row's), never "This PC": the keyboard screen keeps its own "This PC ..." lines.
 *
 * No imports, so any engine module can take these without growing a test harness copy list
 * beyond this one file.
 */

const named = (host, fallback = 'That host') => (host ? String(host) : fallback);

/** A host whose own service is off, reached over the network (the view's row says "Powered down"). */
export const notRespondingMessage = (host) => `${named(host)} is not responding.`;

/** A held session that the server has ended (a 403 no_session on its desktop). */
export const sessionEndedMessage = (host) => `Your session on ${host || 'that host'} has ended.`;

/** A host that a remote screen or the view cannot reach through the link in play. */
export const unreachableMessage = (host) => `${named(host)} can't be reached over this link.`;

/** A host whose policy turns remote sign-in off (the view's row label stays "Remote sign-in off"). */
export const remoteOffMessage = (host) => `Remote sign-in is off on ${named(host, 'that host')}.`;

/** The remote-view line of a desktop opened on a technique session (core plan 5.4); the link part only when known. */
export const remoteViewLine = (account, link) => `Remote view: ${account || 'the account'}${link ? ` through ${link}` : ''}`;

/** A remote sign-in refused because the account is not admitted there (typed names too). */
export const remoteNotPermittedMessage = (host) => `That account can't sign in on ${named(host, 'that host')}.`;

/** A remote sign-in refused because the host has locked the account. */
export const remoteLockedOutMessage = (host) => `${named(host)} has locked this account.`;

/** A folder on a live remote assist that is really locked: the folder closes and the desktop says so. */
export const RELAY_FOLDER_UNAVAILABLE_TEXT = 'Folder unavailable.';

/**
 * The remote sign-in screen's state lines (keyring plan 5.2, K0), each at most two lines of
 * GNF 16px in the 306px message box at 390x844 with the longest host in play.
 */
export const REMOTE_CHECKING_TEXT = 'Checking...';
export const REMOTE_STILL_CHECKING_TEXT = 'Still checking for accounts...';
export const REMOTE_CAPTURES_FAILED_TEXT = 'Your captured sign-ins could not be loaded.';
export const remoteTypedLine = (host) => `${named(host)} lists no accounts until you sign in (NLA).`;
export const remoteHeadlessLine = (host) => `${named(host)} lists no accounts of its own.`;
export const remoteAccountsFailedLine = (host) => `${named(host)}'s accounts could not be loaded.`;
export const remoteBothFailedLine = (host) => `${named(host)}'s sign-in details could not be loaded.`;

/**
 * A tile's tags (plan 8.5): one line each, at most two shown; with three or more, the first and
 * then "+N" in place of the second. `full` is the full kind name for the tile's title and the
 * chosen line.
 */
export const TAG_TEXT = Object.freeze({
    captured: Object.freeze({ tag: 'Captured', full: 'Captured password', group: 'key' }),
    // Keyring K3a (8.5): a password in a file, a saved connection, a remote assist invite, a token
    in_file: Object.freeze({ tag: 'In file', full: 'Password in a file', group: 'key' }),
    saved_connection: Object.freeze({ tag: 'Saved', full: 'Saved connection', group: 'plug' }),
    assist_invite: Object.freeze({ tag: 'Assist', full: 'Remote assist', group: 'plug' }),
    token: Object.freeze({ tag: 'Token', full: 'Session token', group: 'plug' }),
    // S7: a hash record, and a password the player cracked from one
    hash: Object.freeze({ tag: 'Hash', full: 'Hash record', group: 'key' }),
    cracked: Object.freeze({ tag: 'Cracked', full: 'Cracked password', group: 'key' })
});

/**
 * The badge image per glyph group, in one place: the key badge for passwords, the plug badge
 * (D49) for connection files. An unknown group falls back to the key badge.
 */
export const BADGE_FILE = Object.freeze({ key: 'badge-key.png', plug: 'badge-plug.png' });

/** The badge image path for a glyph group. */
export function badgeSrc(group) {
    return `/break_escape/assets/icons/${BADGE_FILE[group] || BADGE_FILE.key}`;
}

/** The tags drawn on a tile for these kinds, in order: at most two, the second "+N" past two. */
export function tileTagLabels(kinds) {
    const tags = (Array.isArray(kinds) ? kinds : []).map(k => TAG_TEXT[k]?.tag || String(k));
    if (tags.length <= 2) return tags;
    return [tags[0], `+${tags.length - 1}`];
}

/** The badge glyph groups for these kinds in the short window: one glyph per group, in order. */
export function tileBadgeGroups(kinds) {
    const out = [];
    for (const k of Array.isArray(kinds) ? kinds : []) {
        const g = TAG_TEXT[k]?.group || 'key';
        if (!out.includes(g)) out.push(g);
    }
    return out;
}

/** The full kind names of these kinds, for a tile's title and the chosen line (plan 8.5). */
export function tileFullNames(kinds) {
    return (Array.isArray(kinds) ? kinds : []).map(k => TAG_TEXT[k]?.full || String(k));
}

/**
 * The chosen account's line (D50): "Lena Fox (lfox)", then the full names of the kinds of
 * knowledge held for it ("Lena Fox (lfox), Captured password"). One wording for the keyboard
 * screen and the remote screen. Empty with no tile.
 */
export function chosenAccountLine(tile) {
    if (!tile) return '';
    const kinds = Array.isArray(tile.kinds) && tile.kinds.length ? `, ${tileFullNames(tile.kinds).join(', ')}` : '';
    return `${tile.displayName || tile.username} (${tile.username})${kinds}`;
}

/**
 * Host labels break at their hyphens ("HB-FIN-" over "02"). This returns the line as HTML-safe
 * markup with each hyphenated word in a no-wrap span, so the label stays on one line while the
 * element's text is still the plain line. `esc` is the caller's HTML escaper.
 */
export function nowrapHostsHtml(text, esc) {
    const out = [];
    let last = 0;
    const src = String(text ?? '');
    for (const m of src.matchAll(/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g)) {
        out.push(esc(src.slice(last, m.index)), `<span class="signin-nowrap">${esc(m[0])}</span>`);
        last = m.index + m[0].length;
    }
    out.push(esc(src.slice(last)));
    return out.join('');
}

/** The scroll cue's words for a remote tile row that outgrows its box. Same words as utils/more-below.js (a test pins them). */
export const REMOTE_MORE_BELOW_TEXT = 'More below';

// Keyring K3a (plan 8.5): credential lines on the sign-in screens. Every field is a template
// field filled from the entry or the PC, never free text; no pronoun for the account holder.
export const KEYRING_FAILED_TEXT = 'Your found sign-ins could not be loaded.';
export const KEYBOARD_BOTH_FAILED_TEXT = "This PC's sign-in details could not be loaded.";
export const FOUND_PASSWORD_LEAD_TEXT = 'Type the password from';
export const CONNECT_WITH_TEXT = 'Connect with';
// The slab on a locked session's sign-in screen (K-lock, plan 8.6). A credential session can come
// back with its saved connection as well as the password; any other kind only has the password.
export const lockedSlabText = (name, viaCredential) => viaCredential
    ? `Locked: ${name}. Enter the password or connect again`
    : `Locked: ${name}. Enter the password to unlock`;
export const WRONG_PC_TEXT = 'This connection is for another PC.';
export const kindRefusedMessage = (kind, host) => {
    if (kind === 'assist_invite') return `${named(host)} does not allow remote assistance.`;
    if (kind === 'token') return `${named(host)} does not accept session tokens.`;
    return `${named(host)} always asks for the password, so a saved one is ignored.`;
};
/** The one-line short form under a greyed button (fits 306px of GNF 16px with the longest host). */
export const kindRefusedShort = (host, kind) => (kind === 'token'
    ? `${named(host)}: no session tokens.` : `${named(host)}: type the password.`);
export const endedAssistMessage = (displayName) => `${displayName || 'The account holder'} ended the remote assist.`;
export const noLongerWorksMessage = (label) => `${label || 'That sign-in'} no longer works.`;
// Keyring K5 (8.5): a session token that has run out. pc-sessions.js keeps copies (it imports
// nothing); the equality test in test/js/pc-sessions.test.mjs keeps them equal.
export const tokenExpiredMessage = (label) => `${label || 'That session token'} has expired.`;
export const tokenExpiredEndedMessage = (label, host) =>
    `${label || 'That session token'} expired. Your session on ${host || 'that host'} ended.`;
// Connect from the tray (K3b, plan 8.2 and 8.5)
export const CONNECT_FAILED_TEXT = 'Connect could not reach the game server. Try again.';
export const trayUnreachableMessage = (host) => `${named(host)} can't be reached from here. You need a way onto its network.`;

// The find toasts (K3b, plan 8.2 and 8.5, the "no capture log" lines; K3d adds the capture
// log wording). Names, hosts and labels are the entry's, drawn as plain text by gameAlert.
const whoOf = (entry) => entry?.account?.displayName || entry?.account?.username || 'an account';
export const savedConnectionFoundMessage = ({ label, displayName, host } = {}) =>
    `Saved connection found: ${label || 'a file'} for ${displayName || 'an account'} on ${named(host, 'another PC')}.`;
export const passwordInFileFoundMessage = ({ label, displayName } = {}) =>
    `${displayName || 'An account'}'s password is in ${label || 'a file'}.`;
export const assistInviteFoundMessage = ({ label, displayName } = {}) =>
    `${label || 'An invite'}: Connect it from your inventory to join ${displayName || 'an account'}'s session.`;
export const hashFoundMessage = () => 'Hash collected';
export const findMoreLine = (n) => `and ${n} more`;
// K5 (8.5): a token recorded by a foothold
export const tokenFoundMessage = ({ label, displayName, host } = {}) =>
    `Session token captured: ${label || 'a session token'} for ${displayName || 'an account'} on ${named(host, 'another PC')}.`;

// K3d (plan 8.2, D4 (d)): when the player holds a capture log, the toast points at it.
export const CAPTURE_LOG_FIND_LEAD = 'New in your capture log:';
export const captureLogFindMessage = ({ label, kind, displayName } = {}) =>
    `${CAPTURE_LOG_FIND_LEAD} ${label || 'a file'} (${(TAG_TEXT[kind]?.full || 'Sign-in').toLowerCase()} for ${displayName || 'an account'}).`;
export const captureLogPasswordFoundMessage = ({ label, displayName } = {}) =>
    `${CAPTURE_LOG_FIND_LEAD} ${displayName || 'An account'}'s password, in ${label || 'a file'}.`;

/**
 * One find's line by kind, or null for a kind with no find toast. With `captureLog` (the player
 * holds a capture log that lists captures) the line points at the capture log (K3d).
 */
// The capture check here is paired with findKindToasts in systems/keyring.js (a double guard).
export function findLine(entry, { captureLog = false } = {}) {
    if (!entry || typeof entry !== 'object' || entry.source === 'capture') return null;
    const fields = { label: entry.label, displayName: whoOf(entry), host: entry.host || entry.connectsTo, kind: entry.kind };
    if (entry.kind === 'hash') return hashFoundMessage();
    if (entry.kind === 'password' && entry.source === 'cracked') return null;
    if (captureLog) {
        if (entry.kind === 'password') return captureLogPasswordFoundMessage(fields);
        if (entry.kind === 'saved_connection' || entry.kind === 'assist_invite' || entry.kind === 'token') return captureLogFindMessage(fields);
        return null;
    }
    if (entry.kind === 'token') return tokenFoundMessage(fields);
    if (entry.kind === 'saved_connection') return savedConnectionFoundMessage(fields);
    if (entry.kind === 'password') return passwordInFileFoundMessage(fields);
    if (entry.kind === 'assist_invite') return assistInviteFoundMessage(fields);
    return null;
}

/**
 * The one toast for a set of finds: each line, or with more than two, two then "and N more".
 * `captureLog` is the held capture log (or any truthy value) when one lists captures (K3d).
 */
export function findToastText(entries, { captureLog = null } = {}) {
    const opts = { captureLog: !!captureLog };
    const lines = (Array.isArray(entries) ? entries : []).map(e => findLine(e, opts)).filter(Boolean);
    if (!lines.length) return null;
    if (lines.length > 2) return [lines[0], lines[1], findMoreLine(lines.length - 2)].join('\n');
    return lines.join('\n');
}

/** The teaching toast per kind, shown once per page after the first successful use (8.1). */
export function teachLine(kind, { displayName } = {}) {
    const who = displayName || 'the account holder';
    if (kind === 'in_file') return 'People save passwords in files. Anyone who reaches the file has the account. Keep passwords in a password manager, not a file.';
    if (kind === 'saved_connection') return `The password is saved inside this file, so opening it signs you in as ${who}. A policy that always asks for the password stops it.`;
    if (kind === 'assist_invite') return `${who} let you into the session. Check who is asking before you share access.`;
    if (kind === 'token') return 'A stolen session token signs in without the password until it expires. Short session lifetimes limit it.';
    return null;
}

/**
 * The error line for a credential sign-in's refusal (8.5), by pc-sessions' reason. A policy
 * refusal gets its full line here (a greyed button never posts, so none is shown twice).
 */
export function credentialRefusalLine(reason, { host, label, displayName, kind } = {}) {
    switch (reason) {
    case 'kind_refused': return kindRefusedMessage(kind, host);
    case 'wrong_pc': return WRONG_PC_TEXT;
    case 'not_permitted': return remoteNotPermittedMessage(host);
    case 'locked_out': return remoteLockedOutMessage(host);
    case 'remote_blocked': return remoteOffMessage(host);
    case 'ended': return endedAssistMessage(displayName);
    case 'no_longer_works': return noLongerWorksMessage(label);
    case 'expired': return tokenExpiredMessage(label);
    default: return null;
    }
}

// ---- K3d: the capture log's Sign-ins list (plan 8.7) ----------------------------------------
// A row's kind tag is the full kind name of 8.5 (filled); its source tag is in outline. These
// are on-screen text only, never spoken.

/** The kind tags of capture rows (8.5): a PIN, a foothold, a physical finding. */
export const CAPTURE_TAG_TEXT = Object.freeze({
    pin: Object.freeze({ tag: 'PIN', full: 'Captured PIN' }),
    foothold: Object.freeze({ tag: 'Foothold', full: 'Foothold' }),
    finding: Object.freeze({ tag: 'Finding', full: 'Finding' })
});

/** A row's filled kind tag: a TAG_TEXT kind (captured, in_file, ...) or a capture tag (pin, ...). */
export const rowKindName = (kind) => TAG_TEXT[kind]?.full || CAPTURE_TAG_TEXT[kind]?.full || String(kind || '');

/** A credential row's outline source tag, by the capture's `source` or the entry's `how`. */
export const SOURCE_TAG_TEXT = Object.freeze({
    phished: 'Phished', recorded: 'Recorded', found: 'Found', given: 'Given', cracked: 'Cracked'
});

// S7: a hash record's row in the Sign-ins list. The words only; the server's status decides which.
export const CRACK_BUTTON_TEXT = 'Crack';
export const CRACK_OPEN_BUTTON_TEXT = 'Open';
export const CRACK_FINISH_BUTTON_TEXT = 'Finish';
export const HASH_SALTED_TEXT = 'Salted';
export const HASH_READY_TO_FINISH_TEXT = 'Ready to finish';
/** A hash token in groups of four. */
export function hashTokenText(token) {
    const t = typeof token === 'string' ? token : '';
    return (t.match(/.{1,4}/g) || []).join(' ');
}
/** A hash row's status words: ready, running (with a countdown), infeasible, cracked. */
export function hashStatusText(status, secondsLeft = null) {
    if (status === 'cracked') return 'Cracked';
    if (status === 'infeasible') return 'Not feasible';
    if (status === 'running') {
        return Number.isFinite(secondsLeft) && secondsLeft > 0 ? `Cracking, ${Math.ceil(secondsLeft)} s left` : HASH_READY_TO_FINISH_TEXT;
    }
    return 'Ready';
}

export const SIGNINS_HEADING = 'Sign-ins';
export const CAPTURES_HEADING = 'Captures';
export const HASHES_HEADING = 'Hashes';
export const HASHES_BANNER_TEXT = 'Hash records. A hash cannot sign in until it is cracked; open one to try.';
export const SIGNINS_BANNER_TEXT = 'Sign-ins captured or found. Shown in full here, masked in the report.';
export const CAPTURES_ROWS_BANNER_TEXT = 'PINs, footholds and findings this engagement has recorded.';

/** The use line of each row (8.7). Every field is a template field, never free text. */
export const typeItFromLine = (label) => `Type it from ${label || 'the file'}.`;
export const alsoInLine = (label) => `Also in ${label || 'a file'}.`;
export const connectFromInventoryLine = (label) => `Connect ${label || 'it'} from your inventory.`;
// A saved connection a foothold recorded (no tray item to Connect): used on the host's sign-in screen
export const useOnSignInScreenLine = (host) => `Use it on ${named(host, 'its host')}'s sign-in screen.`;
export const expiredLine = (label) => `${label || 'That sign-in'} has expired.`;
// K5 (plan 10, 8.5's rounding): a token's time left, in whole minutes rounded up
export const tokenMinutesLeft = (secs) => Math.max(1, Math.ceil(secs / 60));
export const tokenTimeLeftLine = (secs) => (secs < 60 ? 'Under a minute left.' : `About ${tokenMinutesLeft(secs)} min left.`);
/** The Sign-ins row of a live token: where to use it, through which link, and the minutes left. */
export function tokenUseLine(host, link, secs) {
    const where = link ? `Use it on ${named(host, 'its host')}'s sign-in screen, through ${link}.` : useOnSignInScreenLine(host);
    return Number.isFinite(secs) && secs >= 0 ? `${where} ${tokenTimeLeftLine(secs)}` : where;
}
export const moreNotesLine = (n) => `and ${n} more.`;
export const footholdLine = (host, note) => {
    const where = host || 'unknown host';
    return note ? `Foothold on ${where}: ${note}` : `Foothold on ${where}`;
};
/** A finding's line: "{host}: {note}", no "Foothold on". */
export const findingLine = (host, note) => [host, note].filter(Boolean).join(': ');
/** A captured PIN's line: "{host}: {value or mask}", or the value alone with no host. */
export const pinLine = (host, value) => (host ? `${host}: ${value}` : String(value));
