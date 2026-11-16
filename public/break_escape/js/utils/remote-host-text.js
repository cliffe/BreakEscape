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

/** A host that a remote screen or the view cannot reach through the link in play. */
export const unreachableMessage = (host) => `${named(host)} can't be reached over this link.`;

/** A host whose policy turns remote sign-in off (the view's row label stays "Remote sign-in off"). */
export const remoteOffMessage = (host) => `Remote sign-in is off on ${named(host, 'that host')}.`;

/** A remote sign-in refused because the account is not admitted there (typed names too). */
export const remoteNotPermittedMessage = (host) => `That account can't sign in on ${named(host, 'that host')}.`;

/** A remote sign-in refused because the host has locked the account. */
export const remoteLockedOutMessage = (host) => `${named(host)} has locked this account.`;

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
    token: Object.freeze({ tag: 'Token', full: 'Session token', group: 'plug' })
});

/**
 * The badge image per glyph group, in one place. The plug glyph's own art (badge-plug.png) is
 * not drawn yet, so the plug group reuses the key badge until it is.
 */
export const BADGE_FILE = Object.freeze({ key: 'badge-key.png', plug: 'badge-key.png' });

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
export const WRONG_PC_TEXT = 'This connection is for another PC.';
export const kindRefusedMessage = (kind, host) => {
    if (kind === 'assist_invite') return `${named(host)} does not allow remote assistance.`;
    return `${named(host)} always asks for the password, so a saved one is ignored.`;
};
/** The one-line short form under a greyed button (fits 306px of GNF 16px with the longest host). */
export const kindRefusedShort = (host) => `${named(host)}: type the password.`;
export const endedAssistMessage = (displayName) => `${displayName || 'The account holder'} ended the remote assist.`;
export const noLongerWorksMessage = (label) => `${label || 'That sign-in'} no longer works.`;
// Connect from the tray (K3b, plan 8.2 and 8.5)
export const CONNECT_FAILED_TEXT = 'Connect could not reach the game server. Try again.';
export const trayUnreachableMessage = (host) => `${named(host)} can't be reached from here. You need a way onto its network.`;

/** The teaching toast per kind, shown once per page after the first successful use (8.1). */
export function teachLine(kind, { displayName } = {}) {
    const who = displayName || 'the account holder';
    if (kind === 'in_file') return 'People save passwords in files. Anyone who reaches the file has the account. Keep passwords in a password manager, not a file.';
    if (kind === 'saved_connection') return `The password is saved inside this file, so opening it signs you in as ${who}. A policy that always asks for the password stops it.`;
    if (kind === 'assist_invite') return `${who} let you into the session. Check who is asking before you share access.`;
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
    default: return null;
    }
}
