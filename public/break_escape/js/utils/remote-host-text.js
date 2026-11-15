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
    captured: Object.freeze({ tag: 'Captured', full: 'Captured password', group: 'key' })
});

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
