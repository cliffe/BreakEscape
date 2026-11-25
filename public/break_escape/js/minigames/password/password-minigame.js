import { MinigameScene } from '../framework/base-minigame.js';
import { ASSETS_PATH } from '../../config.js';
import { makeDraggable } from '../../utils/helpers.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { escapeHtmlKeepWords } from '../../utils/escape-html.js';
import { lockScopeRefusal, lockScopeRefusalLine, unlockWithRouteRoomRetry } from '../../utils/lock-scope-refusal.js';
import { isComputerType } from '../../utils/computer-keywords.js';
import { mountPcMonitor, cssZoomOf, pcPostitButtonHtml } from '../../utils/pc-monitor.js';
import { headshotCandidates, headshotKeys, noteMissingHeadshot, npcRecordFor, headshotSourceFor, applyHeadshotBox, SILHOUETTE_URL,
    SHORT_PORTRAIT_PX, TILE_PORTRAIT_PX } from '../../utils/npc-headshot.js';
// The shared remote-host strings and tag helpers (credential keyring plan 8.5, K0): one phrasing
// per state, so the sign-in screen, the tray and the network view cannot drift apart. No imports
// of its own, so it only needs adding to a test harness copy list, never growing one further.
import {
    tileTagLabels, tileBadgeGroups, badgeSrc,
    REMOTE_CHECKING_TEXT, REMOTE_STILL_CHECKING_TEXT, REMOTE_CAPTURES_FAILED_TEXT,
    tileFullNames, nowrapHostsHtml, REMOTE_MORE_BELOW_TEXT,
    remoteTypedLine, remoteHeadlessLine, remoteAccountsFailedLine, remoteBothFailedLine,
    notRespondingMessage, unreachableMessage, remoteOffMessage, remoteNotPermittedMessage, remoteLockedOutMessage,
    KEYRING_FAILED_TEXT, KEYBOARD_BOTH_FAILED_TEXT, FOUND_PASSWORD_LEAD_TEXT, CONNECT_WITH_TEXT, lockedSlabText,
    kindRefusedMessage, kindRefusedShort, credentialRefusalLine, teachLine, chosenAccountLine, tokenExpiredMessage
} from '../../utils/remote-host-text.js';
// The portrait crop helpers live with the headshots (UX slice 2c R1 m8: the desktop bar
// falls back the same way as a tile); exported here too for the tests and callers that
// import them from the password screen
export { SHORT_PORTRAIT_PX, TILE_PORTRAIT_PX, isTalkSheetSize, PORTRAIT_CROP_OVERRIDES, portraitCropOverride, headCropOffset } from '../../utils/npc-headshot.js';

/**
 * The keypad's line after a wrong password. A near miss (right apart from letter
 * case, which only the server can tell) says passwords are case-sensitive.
 */
export function incorrectPasswordMessage(attemptsRemaining, caseMismatch = false) {
    const left = `${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`;
    return caseMismatch
        ? `Incorrect password. Passwords are case-sensitive. ${left}`
        : `Incorrect password. ${left}`;
}

/**
 * The line over the password field: the keypad title when it names the lock
 * ("Enter password: SCADA Control"), else the plain "Password:".
 */
export function passwordFieldLabel(title) {
    const t = typeof title === 'string' ? title.trim() : '';
    return t && t !== 'Enter password' && t !== 'Password Entry' ? t : 'Password:';
}

/**
 * Which face the classic password screen wears: 'screen' (a monitor with the desktop
 * wallpaper, for a computer's own lock) or 'prompt' (a plain panel). A Wi-Fi key and a
 * zip archive's password are not a computer signing in, and on the wallpaper they read
 * as one (UX access R2).
 */
export function passwordScreenKind({ join = null, lockable = null } = {}) {
    if (join) return 'prompt';
    // The type, then the sprite's own name (its texture key), on the keyword list the
    // container's desktop mode uses (utils/computer-keywords.js, code review R1 m3)
    const names = [lockable?.scenarioData?.type, lockable?.type, lockable?.texture?.key];
    return names.some((n) => isComputerType(n)) ? 'screen' : 'prompt';
}

/**
 * True for a container that is a bag or case rather than a device: its password
 * screen is drawn as a code lock on the case, not as a computer's sign-in screen.
 */
const SIGNIN_PROMPT = 'Choose an account.';
/** A tile's username line (GNF 16px on a 16px line): the spare height a short screen needs to show it */
export const SIGNIN_USERNAME_LINE = 16;
export const CASE_LOCK_TYPES = ['suitcase', 'briefcase', 'bag', 'bag1', 'backpack', 'satchel', 'holdall'];
export function isCaseLockTarget(data) {
    const type = String(data?.type || '').toLowerCase();
    return CASE_LOCK_TYPES.includes(type);
}

// ── Sign-in mode (access model 5.3, step 8) ──────────────────────────────────
// A sign-in PC's screen: account tiles (from the server, per the PC's loginPicker),
// Other user (type a username), the password field and the PC's post-it. It has no
// attempt limit of its own: it shows the server's answer and attemptsLeft, and stops
// only when the server reports a lockout for the username typed. It shows no
// letter-case hint (the server sends none for /login). Signs in through pc-sessions.js.


/** Initials for a tile whose portrait and avatar both failed: "Sam Okafor" -> "SO". */
export function tileInitials(name) {
    const words = String(name || '').trim().split(/[\s._-]+/).filter(Boolean);
    const letters = words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
    return letters || '?';
}

/** A portrait path from the server ("assets/characters/x_talk.png") as a URL. */
export function portraitUrl(path) {
    if (typeof path !== 'string' || !path) return null;
    if (path.startsWith('/') || path.startsWith('http') || path.startsWith('data:')) return path;
    return path.startsWith('assets/') ? `/break_escape/${path}` : `${ASSETS_PATH}/${path}`;
}

/**
 * The 64px tile's picture (UX slice 2a R4 m1): the image at a whole scale (`scale` 1, or 2
 * for a 32x32 headshot), cut at `offset`. Never `contain` or a percentage size, which shrank
 * the 128px talk frame to half.
 */
export function setTilePortrait(el, { src, width, height, kind, offset = null, scale = 1 }) {
    const left = offset ? offset.left * scale : 0;
    const top = offset ? offset.top * scale : 0;
    el.style.backgroundImage = `url("${src}")`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = `${width * scale}px ${height * scale}px`;
    el.style.backgroundPosition = `${left ? -left : 0}px ${top ? -top : 0}px`;
    el.dataset.frame = kind;
}

/**
 * The short window's portrait (UX slice 2a R3 n1), as custom properties the max-height:
 * 640px rule reads, so the 64px tile keeps its picture. A 32x32 avatar (the scenario's NPC
 * headshot, as the phone and the OSINT browser show it) at scale 1 comes first; else a 32x32
 * head crop of the talk sheet's first frame, at scale 1. Never a scaled-down frame.
 */
export function setShortPortrait(el, { src, width, height, kind, offset = null }) {
    if (!el?.style?.setProperty) return;
    el.style.setProperty('--signin-short-image', `url("${src}")`);
    el.style.setProperty('--signin-short-size', `${width}px ${height}px`);
    const left = offset ? offset.left : 0;
    const top = offset ? offset.top : 0;
    el.style.setProperty('--signin-short-position', `${left ? -left : 0}px ${top ? -top : 0}px`);
    el.dataset.short = kind;
}

/**
 * Draw a tile's picture into `el`: the character's authored 32x32 `<key>_headshot.png`, else
 * the pixel silhouette. Never a crop of the talk image, a dialogue bust or any other picture
 * (standing rule; UI PC polish item 3). Every picture is at a whole scale:
 * - the headshot at scale 2 in the 64px tile and scale 1 in the short window's 32px one;
 * - the silhouette (also 32x32) the same;
 * - initials in the pixel font only when there is no image machinery at all.
 * The keys tried are logged once when no headshot file exists. `ImageCtor` is injectable for
 * tests.
 */
export function applyTilePortrait(el, tile, ImageCtor = (typeof Image !== 'undefined' ? Image : null),
                                  { record = undefined, onMissing = noteMissingHeadshot } = {}) {
    const rec = record === undefined ? npcRecordFor({ username: tile?.username }) : record;
    const headSource = headshotSourceFor(tile || {}, rec);
    const heads = headshotCandidates(headSource);
    const headKeys = headshotKeys(headSource);
    const initials = () => {
        el.style.backgroundImage = '';
        el.dataset.frame = 'initials';
        el.classList.add('signin-portrait-initials');
        el.textContent = tileInitials(tile?.displayName || tile?.username);
    };
    const draw = (src, kind) => {
        setTilePortrait(el, { src, width: SHORT_PORTRAIT_PX, height: SHORT_PORTRAIT_PX, kind, scale: TILE_PORTRAIT_PX / SHORT_PORTRAIT_PX });
        setShortPortrait(el, { src, width: SHORT_PORTRAIT_PX, height: SHORT_PORTRAIT_PX, kind });
        el.textContent = '';
        el.classList.remove('signin-portrait-initials');
        el.dataset.src = src;
    };
    const silhouette = () => {
        if (headKeys.length) {
            el.dataset.headshotMissing = headKeys.join(' ');
            onMissing?.(headKeys);
        }
        if (!ImageCtor) { initials(); return; }
        draw(SILHOUETTE_URL, 'silhouette');
    };
    const tryAt = (i) => {
        if (i >= heads.length || !ImageCtor) { silhouette(); return; }
        const img = new ImageCtor();
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            if (w !== SHORT_PORTRAIT_PX || h !== SHORT_PORTRAIT_PX) { tryAt(i + 1); return; }
            draw(heads[i], 'single');
            el.dataset.headshot = headKeys[i];
        };
        img.onerror = () => tryAt(i + 1);
        img.src = heads[i];
    };
    tryAt(0);
}

/** The offset that moves a box onto whole device pixels: a box centred in a space of odd
 *  size, or under text with a fractional line height, sits part of a pixel off and its
 *  text and borders blend across two rows (UX slice 2a R3 m1; slice 3a's copier frame does
 *  the same). */
export function wholePixelOffset(rect, dpr = 1) {
    const snap = (v) => Math.round(v * dpr) / dpr - v;
    const x = snap(rect.left), y = snap(rect.top);
    // Round off float noise, so a box already on whole pixels gets exactly 0. Six places,
    // not four: Chrome lays out in 1/64px steps, and 0.0156 would lose the 0.015625 step (R4 m2)
    const tidy = (v) => (Math.abs(v) < 1e-6 ? 0 : Math.round(v * 1e6) / 1e6);
    return { x: tidy(x), y: tidy(y) };
}

/**
 * Put every visible box inside `root` on whole device pixels (UX slice 2a R4 m2): a box of
 * odd width centred in the frame (the field, Submit, a tile's name, the message line, Add to
 * Notepad) or one centred by a -50% transform (the eye toggle) sits half a pixel off even
 * when the frame is whole, and its text blends across two columns. Walks the boxes in
 * document order, so a box is measured after its parent has moved. An in-flow box gets a
 * relative left/top (added to any its rules give it); a positioned one (absolute, fixed,
 * sticky) gets a `translate`, which keeps its own anchors. Returns the boxes it moved with
 * their old inline values, for unsnapInnerBoxes.
 *
 * A box drawn scaled or rotated (a pressed control's `scale(0.95)` on :active) is skipped
 * with everything inside it, since its rect is not where it rests (R5 m1); `skipped` on the
 * returned array counts them, so the caller can snap again once the press ends. A pure
 * translate (the eye toggle's -50%) is measured as usual.
 *
 * Reads come before writes (R5 n1): one pass reads every rect, then writes every offset. A
 * box's rect after the writes is its old rect plus the moves of the boxes around it, so the
 * pass adds its ancestors' moves before rounding. A second pass then checks the result (a box
 * newly made relative can move an absolute child by a different amount) and is usually
 * empty, so a snap costs two layouts however many boxes move.
 */
export function snapInnerBoxes(root, dpr = 1, view = (typeof window !== 'undefined' ? window : null)) {
    const moved = [];
    // Not enumerable, so the list still compares as a plain list of moved boxes
    Object.defineProperty(moved, 'skipped', { value: 0, writable: true, enumerable: false });
    if (!root?.querySelectorAll || !view) return moved;
    const all = [...root.querySelectorAll('*')].filter(el => el.style && typeof el.getBoundingClientRect === 'function');
    const records = new Map();
    const tidy = (v) => Math.round(v * 1e6) / 1e6;
    const base = (v) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);
    for (let pass = 0; pass < 3; pass++) {
        // Read pass: every rect and computed style before any write
        const reads = all.map(el => ({ el, rect: el.getBoundingClientRect(), cs: view.getComputedStyle ? view.getComputedStyle(el) : null }));
        const skip = new Set();
        const shift = new Map();
        const writes = [];
        for (const { el, rect, cs } of reads) {
            const parent = el.parentElement;
            if ((parent && skip.has(parent)) || isScaledOrRotated(cs)) { skip.add(el); continue; }
            const inherited = (parent && shift.get(parent)) || { x: 0, y: 0 };
            let own = { x: 0, y: 0 };
            if (rect.width || rect.height) {
                own = wholePixelOffset({ left: rect.left + inherited.x, top: rect.top + inherited.y }, dpr);
                if (own.x || own.y) writes.push({ el, cs, x: own.x, y: own.y });
            }
            if (own.x || own.y || inherited.x || inherited.y) {
                shift.set(el, { x: inherited.x + own.x, y: inherited.y + own.y });
            }
        }
        if (pass === 0) moved.skipped = skip.size;
        if (!writes.length) break;
        // Write pass
        for (const { el, cs, x, y } of writes) {
            let rec = records.get(el);
            if (!rec) {
                const pos = cs?.position || 'static';
                rec = {
                    saved: { el, position: el.style.position, left: el.style.left, top: el.style.top, translate: el.style.translate },
                    mode: (pos === 'absolute' || pos === 'fixed' || pos === 'sticky') ? 'translate' : 'offset',
                    left: pos === 'relative' ? base(cs?.left) : 0,
                    top: pos === 'relative' ? base(cs?.top) : 0,
                    pos,
                    x: 0,
                    y: 0
                };
                records.set(el, rec);
                moved.push(rec.saved);
            }
            rec.x = tidy(rec.x + x);
            rec.y = tidy(rec.y + y);
            // The moves are measured on screen; inside the PC monitor's scaled screen (CSS
            // zoom, UX slice 2c R1 M2) a length on the box is drawn `zoom` times larger; the
            // zoom is measured where the browser has no currentCSSZoom (R2 m2)
            const z = cssZoomOf(el);
            const lx = tidy(rec.x / z), ly = tidy(rec.y / z);
            if (rec.mode === 'translate') {
                el.style.translate = `${lx}px ${ly}px`;
            } else {
                if (rec.pos !== 'relative') el.style.position = 'relative';
                if (rec.x) el.style.left = `${tidy(rec.left + lx)}px`;
                if (rec.y) el.style.top = `${tidy(rec.top + ly)}px`;
            }
        }
    }
    return moved;
}

/** True when a computed style draws the box scaled, rotated or skewed (not a pure translate). */
function isScaledOrRotated(cs) {
    if (!cs) return false;
    const t = cs.transform;
    if (t && t !== 'none') {
        const m = /^matrix\(([^)]*)\)$/.exec(t);
        // A browser gives a matrix; a declared value of translate functions only is a move
        if (!m) return !/^(\s*translate(?:X|Y|Z|3d)?\([^)]*\)\s*)+$/.test(t);
        const [a, b, c, d] = m[1].split(',').map(Number);
        if (Math.abs(a - 1) > 1e-6 || Math.abs(d - 1) > 1e-6 || Math.abs(b) > 1e-6 || Math.abs(c) > 1e-6) return true;
    }
    const scale = cs.scale;
    if (scale && scale !== 'none' && scale.split(' ').some(v => Math.abs(parseFloat(v) - 1) > 1e-6)) return true;
    const rotate = cs.rotate;
    if (rotate && rotate !== 'none' && parseFloat(rotate.split(' ').pop()) !== 0) return true;
    return false;
}

/** Undo snapInnerBoxes, last box first. */
export function unsnapInnerBoxes(moved) {
    for (let i = (moved?.length || 0) - 1; i >= 0; i--) {
        const { el, position, left, top, translate } = moved[i];
        el.style.position = position;
        el.style.left = left;
        el.style.top = top;
        el.style.translate = translate;
    }
}

/**
 * Scroll `el` into view inside the password frame's scroll area when the window is too short
 * to show it (UX slice 2a R2 M2): 'nearest', so nothing moves when it is already on screen.
 */
export function revealInFrame(el) {
    if (!el || typeof el.scrollIntoView !== 'function') return false;
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return true;
}

/**
 * The line under the form after a refused sign-in: the server's message and attemptsLeft.
 * On a remote screen (credential keyring 8.5) the host-named shared strings replace the
 * server's text for a lockout, a not-permitted account and a remote-off policy; a wrong
 * password keeps its count, since that is the password check, not the host.
 */
export function signInRefusalMessage(result, { remote = false, host } = {}) {
    if (remote) {
        if (result?.reason === 'locked_out') return remoteLockedOutMessage(host);
        if (result?.reason === 'not_permitted') return remoteNotPermittedMessage(host);
        if (result?.reason === 'remote_blocked') return remoteOffMessage(host);
    }
    const message = (result?.message || 'Incorrect username or password').replace(/\.$/, '');
    const left = result?.attemptsLeft;
    if (result?.reason !== 'wrong' || !Number.isFinite(left)) return `${message}.`;
    return `${message}. ${left} attempt${left === 1 ? '' : 's'} left.`;
}

/**
 * The line under the form when the sign-in got no usable answer (`result.error`): a PC that is
 * switched off says so at its keyboard ("This PC is off.", q72) and through a foothold ("This
 * PC is not responding.", as its row in the network view, 9.3b plan 5.2); any other 403 or
 * 404 is a PC that can't be reached; anything else a network error.
 */
export function signInErrorMessage(result, { remote = false, host } = {}) {
    if (remote) {
        // A remote screen names the host, as its row in the network view does (8.5)
        // After a timed-out sync the line says the link may be behind (R2 n1)
        const late = result?.syncLate && result?.syncNote ? ` ${result.syncNote}` : '';
        if (result?.serverReason === 'not_responding') return notRespondingMessage(host) + late;
        if (result?.status === 403 || result?.status === 404) return unreachableMessage(host) + late;
        return 'Network error. Please try again.' + late;
    }
    if (result?.serverReason === 'off') return 'This PC is off.';
    if (result?.serverReason === 'not_responding') return 'This PC is not responding.';
    if (result?.status === 403 || result?.status === 404) return "This PC can't be reached.";
    return 'Network error. Please try again.';
}

/**
 * The merged tile row of a remote sign-in screen (credential keyring plan 5.2, 8.5): the PC's
 * own account tiles over the network and the player's captured sign-ins in one row, matched by
 * username so a captured account the PC also lists is one tile that gains the "captured" kind.
 * `picker`/`headless`/`remoteScreen` come from GET /login_accounts (never the lockable). Under
 * picker `accounts` a captured account the PC does not list is left out (the PC does not admit
 * it); under `known`/`false`, a typed (NLA) screen or a headless host, an unlisted captured
 * account shows tagged. Pure: the display name and headshot are resolved by the caller.
 */
export function mergeRemoteTiles({ picker, headless = false, remoteScreen, tiles, captured, keyring } = {}) {
    const typed = remoteScreen === 'typed';
    const pc = (picker === false || headless || typed) ? [] : (Array.isArray(tiles) ? tiles : []);
    const caps = Array.isArray(captured) ? captured : [];
    const out = [];
    const byUser = new Map();
    for (const t of pc) {
        if (!t || typeof t.username !== 'string' || !t.username) continue;
        if (byUser.has(t.username)) continue;
        const tile = { username: t.username, displayName: t.displayName || t.username,
            portrait: t.portrait ?? null, avatar: t.avatar ?? null, kinds: [], capture: null, targetId: null,
            credentials: [], found: [], keyPassword: null };
        out.push(tile); byUser.set(t.username, tile);
    }
    // Drop an unlisted captured account only where the PC enumerates its own accounts
    const dropUnlisted = picker === 'accounts' && !headless && !typed;
    for (const c of caps) {
        if (!c || typeof c.username !== 'string' || !c.username) continue;
        const existing = byUser.get(c.username);
        if (existing) {
            if (!existing.kinds.includes('captured')) existing.kinds.push('captured');
            existing.capture = c;
            existing.targetId = c.targetId ?? existing.targetId;
            continue;
        }
        if (dropUnlisted) continue;
        const tile = { username: c.username, displayName: c.label || c.username,
            portrait: null, avatar: null, kinds: ['captured'], capture: c, targetId: c.targetId ?? null,
            credentials: [], found: [], keyPassword: null };
        out.push(tile); byUser.set(c.username, tile);
    }
    // Keyring K3a (8.1): the screen's usable keyring entries, by account username, one tile per
    // account (never per entry), under the same inclusion rule as the captured sign-ins
    for (const e of Array.isArray(keyring) ? keyring : []) {
        const username = e?.account?.username;
        if (typeof username !== 'string' || !username) continue;
        const kind = keyringTagKind(e);
        if (!kind) continue;
        let tile = byUser.get(username);
        if (!tile) {
            if (dropUnlisted) continue;
            tile = { username, displayName: e.account.displayName || username,
                portrait: null, avatar: null, kinds: [], capture: null, targetId: e.account.npcId ?? null,
                credentials: [], found: [], keyPassword: null };
            out.push(tile); byUser.set(username, tile);
        }
        if (!tile.kinds.includes(kind)) tile.kinds.push(kind);
        if (!tile.targetId && e.account.npcId) tile.targetId = e.account.npcId;
        if (kind === 'cracked') {
            // S7-1: the player's own work fills like any held password. No file line, no credential
            // button. A captured value wins, whichever entry comes first.
            if (typeof e.password === 'string' && e.password && !tile.keyPassword) tile.keyPassword = e.password;
        } else if (kind === 'captured') {
            if (typeof e.password === 'string' && e.password) tile.keyPassword = e.password;
        } else if (kind === 'in_file') {
            if (!tile.found.some(f => f.id === e.id)) tile.found.push({ id: e.id, label: String(e.label || e.foundIn || '') });
        } else if (!tile.credentials.some(c => c.id === e.id)) {
            tile.credentials.push({ id: e.id, kind, label: credentialLabel(e, kind), accepted: e.accepted === true,
                expired: e.expired === true, host: typeof e.host === 'string' ? e.host : null });
        }
    }
    return out;
}

/**
 * The label a credential button shows: the author's label, else the 8.5 generic wording for
 * the kind ("Saved connection"). Never a PC id: an older answer that fell back to connectsTo
 * is treated as no label.
 */
export function credentialLabel(e, kind) {
    const label = typeof e?.label === 'string' ? e.label.trim() : '';
    if (label && label !== e?.connectsTo) return label;
    return tileFullNames([kind])[0];
}

/** The tag kind of a keyring entry (8.5): captured, in_file, cracked (S7), or the entry's own kind. */
export function keyringTagKind(entry) {
    if (!entry || typeof entry !== 'object') return null;
    if (entry.kind === 'password') {
        if (entry.source === 'capture') return 'captured';
        return entry.source === 'cracked' ? 'cracked' : 'in_file';
    }
    return typeof entry.kind === 'string' ? entry.kind : null;
}

/**
 * The keyboard screen's tiles with keyring tags (K3a, 8.1): passwords only reach this screen.
 * Tags go on the PC's own listed tiles; an unlisted account is added only under picker `known`
 * (a tile row that names accounts it learns); `accounts` and `false` keep their own rule.
 */
export function mergeKeyboardTiles({ picker, tiles, keyring } = {}) {
    if (picker === false) return [];
    const merged = mergeRemoteTiles({ picker: picker === 'known' ? 'known' : 'accounts', tiles, captured: [], keyring });
    const own = new Map((Array.isArray(tiles) ? tiles : []).filter(t => t && t.username).map(t => [t.username, t]));
    return merged.map(t => ({ ...(own.get(t.username) || {}), ...t, displayName: own.get(t.username)?.displayName || t.displayName }));
}

/** The full kind name and teaching line of a credential button, for its title (8.1, 8.5). */
export function credentialButtonTitle(cred, { displayName } = {}) {
    const full = tileFullNames([cred.kind])[0];
    const teach = teachLine(cred.kind, { displayName });
    return `${full}: ${cred.label}${teach ? `. ${teach}` : ''}`;
}

/**
 * The remote sign-in screen's Captured sign-ins (slice 9.3a, 4.4): the player's captures
 * (`se_captures`, as captures.js readCaptures returns it) whose target is in `accounts` of
 * GET /capture_secrets ({ targetId: username }), oldest first. Each fills the username;
 * the password only when `secrets` ({ targetId: secret }) has it. A landing-page capture
 * that is no account is never in `accounts`, so it is never offered.
 */
export function capturedSignIns(captures, accounts, secrets) {
    const map = captures && typeof captures === 'object' && !Array.isArray(captures) ? captures : {};
    const acc = accounts && typeof accounts === 'object' ? accounts : {};
    const sec = secrets && typeof secrets === 'object' ? secrets : {};
    return Object.values(map)
        .filter(e => e && typeof e === 'object' && typeof e.targetId === 'string' && e.kind !== 'foothold')
        .filter(e => typeof acc[e.targetId] === 'string' && acc[e.targetId])
        .sort((a, b) => (a.at || 0) - (b.at || 0) || String(a.targetId).localeCompare(String(b.targetId)))
        .map(e => ({
            targetId: e.targetId,
            label: e.roleLabel || e.address || e.targetId,
            username: acc[e.targetId],
            password: typeof sec[e.targetId] === 'string' && sec[e.targetId] ? sec[e.targetId] : null
        }));
}
if (typeof window !== 'undefined') window.capturedSignIns = capturedSignIns;

// Attempts that survive closing and reopening the window (opt-in per lock with
// `lockoutSeconds`). Without it a player could close the window to reset the counter and
// guess freely (m01 blind playtest). The limit is a client-side teaching device, as it
// always was: the server still checks every guess and keeps no count, so a reload resets
// this too. Keyed by the lock's id; at the limit the lock stays shut for lockoutSeconds,
// then the count starts again.
const passwordLocks = new Map();
export function clearPasswordLocks() { passwordLocks.clear(); }
export function passwordLockStatus(key, now = Date.now()) {
    const st = key ? passwordLocks.get(key) : null;
    if (!st) return { attempts: 0, lockedLeftSeconds: 0 };
    if (st.lockedUntil && now >= st.lockedUntil) { passwordLocks.delete(key); return { attempts: 0, lockedLeftSeconds: 0 }; }
    return { attempts: st.attempts, lockedLeftSeconds: st.lockedUntil ? Math.ceil((st.lockedUntil - now) / 1000) : 0 };
}
export function notePasswordAttempts(key, attempts, maxAttempts, lockoutSeconds, now = Date.now()) {
    if (!key) return;
    if (attempts <= 0) { passwordLocks.delete(key); return; }
    passwordLocks.set(key, { attempts, lockedUntil: attempts >= maxAttempts ? now + lockoutSeconds * 1000 : 0 });
}
export function passwordLockedMessage(seconds) {
    return `Too many wrong passwords. Locked for ${seconds} more second${seconds === 1 ? '' : 's'}.`;
}

export class PasswordMinigame extends MinigameScene {
    // No Cancel: the X and Esc close it (UX slice 2a removed the password Cancel), see MinigameScene.keepsCancelButton
    static keepsCancelButton = false;

    constructor(container, params) {
        super(container, params);
        
        // Initialize password-specific state
        this.gameData = {
            password: params.password || '',
            passwordHint: params.passwordHint || '',
            showHint: params.showHint || false,
            showKeyboard: params.showKeyboard || false,
            maxAttempts: params.maxAttempts || 3,
            attempts: 0,
            showPassword: false,
            postitNote: params.postitNote || '',
            showPostit: params.showPostit || false,
            // A note-only view (ca09's Chidi): a submit shows this line, with no server check
            submitText: params.submitText || '',
            // No "Add to notepad" button: the note is a colleague's password, not the learner's to file
            hideNotepadButton: params.hideNotepadButton === true,
            capsLock: false,
            keyboardVisible: false
        };
        
        // Opt-in lockout that survives reopening (scenario lockoutSeconds on the lock)
        this.lockoutSeconds = Number(params.lockoutSeconds) > 0 ? Number(params.lockoutSeconds) : 0;
        const lockDoor = params.lockable?.doorProperties;
        const lockId = params.lockable?.scenarioData?.id || params.lockable?.objectId
            || lockDoor?.connectedRoom || lockDoor?.roomId || null; // a door keys on its room, as the server check does
        this.lockKey = this.lockoutSeconds && lockId ? `${params.type || 'object'}:${lockId}` : null;
        if (this.lockKey) this.gameData.attempts = passwordLockStatus(this.lockKey).attempts;

        // Store the correct password for validation
        this.correctPassword = params.password || '';

        // Wi-Fi join mode (slice 9.3b sub-slice W, 5.3): { apId, apName }. The key field has
        // no attempt limit; submit calls ApiClient.networkJoin through networkLinks.join.
        this.join = params.join || null;

        // Sign-in mode: { pcId, pcName, picker, tiles, current } (unlock-system openLoginSignIn);
        // a remote screen (slice 9.3a, 4.4) adds remote: { footholdId, linkName } and captured
        this.signIn = params.signIn || null;
        if (this.signIn) {
            const remote = !!this.signIn.remote;
            // A remote screen reads its picker, headless and remoteScreen from GET /login_accounts
            // (the server answer, never the lockable); they arrive through setRemoteAccounts, so they
            // start empty and the keyboard picker stays false (credential keyring plan 5.2, K0).
            if (remote) {
                this.signIn.remotePicker = this.signIn.remotePicker ?? null;
                this.signIn.headless = !!this.signIn.headless;
                this.signIn.remoteScreen = this.signIn.remoteScreen ?? null;
                this.signIn.host = this.signIn.host || this.signIn.pcName || '';
            }
            const picker = this.signIn.picker;
            const tiles = remote ? this.remoteTiles() : this.keyboardTiles();
            // A locked session (UI slice 6) pre-chooses its own account: start with that username
            // selected (a tile when it is shown, else the "Other user" field pre-filled), so the
            // player lands straight on the password. The server still checks the password.
            const preselect = typeof this.signIn.preselect === 'string' && this.signIn.preselect ? this.signIn.preselect : null;
            const presetTile = preselect ? tiles.find(t => t.username === preselect) : null;
            const presetOther = !!preselect && !presetTile;
            this.signInState = {
                tiles,
                // null: no account chosen yet; '' with other: true: typing a username
                // A locked session (UI slice 6) pre-selects its own account.
                selected: presetTile ? preselect : null,
                // A remote screen with captures starts on its tiles as the keyboard does, with
                // none on the typed form; while they load it shows neither (UX slice 2b0 R1 M2).
                // A pre-chosen account with no tile (presetOther) types its username instead.
                other: (picker === false && !(this.signIn.remote && (this.signIn.capturedLoading
                    || (Array.isArray(this.signIn.captured) && this.signIn.captured.length > 0)))) || presetOther,
                // The "Other user" field's pre-filled value, when the pre-chosen account has no tile
                presetUsername: presetOther ? preselect : null,
                message: ''
            };
        }
    }
        /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        if (this.join) {
            return {
                ...super.getTestState(),
                join: { apId: this.join.apId, message: this.joinMessage || null },
                hasPasswordField: !!document.getElementById('password-field'),
                entryHint: 'type(0, "<key>", { submit: true })'
            };
        }
        if (this.signIn) {
            const st = this.signInState;
            return {
                ...super.getTestState(),
                signIn: {
                    pcId: this.signIn.pcId,
                    picker: this.signIn.picker,
                    tiles: st.tiles.map(t => ({ username: t.username, displayName: t.displayName, kinds: Array.isArray(t.kinds) ? t.kinds : [], fillsPassword: !!t.password,
                        // Keyring K3a: the chosen line's ways in for this account
                        credentials: (t.credentials || []).map(c => ({ id: c.id, kind: c.kind, label: c.label, accepted: c.accepted, expired: c.expired === true })),
                        found: (t.found || []).map(f => f.label) })),
                    keyring: { entries: Array.isArray(this.signIn.keyring) ? this.signIn.keyring.length : 0, failed: !!this.signIn.keyringFailed },
                    selected: st.selected,
                    otherUser: st.other,
                    current: this.signIn.current ? { username: this.signIn.current.username, displayName: this.signIn.current.displayName } : null,
                    message: st.message || null,
                    // A remote screen: its foothold, the server picker/headless/screen it read, the
                    // captured sign-ins merged into the row, and the state line keyed off the host
                    ...(this.signIn.remote ? {
                        remote: { footholdId: this.signIn.remote.footholdId ?? null,
                            ...(this.signIn.remote.fromPcId ? { fromPcId: this.signIn.remote.fromPcId } : {}) },
                        remotePicker: this.signIn.remotePicker ?? null,
                        headless: !!this.signIn.headless,
                        remoteScreen: this.signIn.remoteScreen ?? null,
                        host: this.signInHost(),
                        captured: (this.signIn.captured || []).map(c => ({ targetId: c.targetId, label: c.label, username: c.username, fillsPassword: !!c.password })),
                        capturedLoading: !!this.signIn.capturedLoading,
                        stillChecking: !!this.signIn.stillChecking,
                        accountsFailed: !!this.signIn.accountsFailed,
                        capturedFailed: !!this.signIn.capturedFailed,
                        stateLine: this.remoteStateLine()
                    } : {})
                },
                // clickText('<display name>') or clickText('Other user') first; then the visible
                // fields are [username, password] for Other user, [password] for a tile.
                entryHint: 'clickText("<name>") then type(0, "<password>", { submit: true }); Other user: type(0, user) then type(1, pw, { submit: true })'
            };
        }
        return {
            ...super.getTestState(),
            // A PC's screen has no counter (R2 M1): the count comes from the game data
            attemptsText: (this.attemptsDisplay?.innerText || '').trim() || (this.pcMonitor && !this.join ? String(this.gameData.attempts) : null),
            hasPasswordField: !!document.getElementById('password-field'),
            // Type into field 0 then clickText('Submit'), or type(0, pw, {submit:true}).
            entryHint: 'type(0, "<password>", { submit: true })'
        };
    }


    init() {
        // No Cancel button in any mode (sign-in, prompt, plain): the X and Esc close the
        // screen (the user's UX notes on unlock-44 and unlock-53). The controls row is made
        // only when it has something to hold (Add to Notepad).
        this.params = { ...this.params, showCancel: false };
        // A screen reopened after its code-device child carries the wrapper the old instance put on
        // onComplete (second step, S8a): this instance is live again, so its own onComplete is the original
        if (typeof this.params.onComplete === 'function' && this.params.onComplete._mfaOriginal !== undefined) {
            this.params.onComplete = this.params.onComplete._mfaOriginal;
        }
        // Call parent init to set up basic UI structure
        super.init();
        // A computer's own screens (sign-in, a PC's password) sit in the one PC monitor frame
        // (UX slice 2c, utils/pc-monitor.js); a Wi-Fi key, an archive and a case lock keep
        // the password frame
        if (this.isPcScreen()) this.mountMonitor();
        else this.wrapInFrame();

        if (this.signIn) {
            this.initSignIn();
            return;
        }

        // Wi-Fi join mode (slice 9.3b W, 5.3): the key field, no attempt counter
        if (this.join) {
            this.headerElement.innerHTML = `
                <h3>${escapeHtml(displayDashes(`Join Wi-Fi: ${this.join.apName || ''}`))}</h3>
                <p>Enter the network key</p>
            `;
            this.setupPasswordInterface();
            this.setupEventListeners();
            return;
        }

        // Customize the header
        this.headerElement.innerHTML = `
            <h3>${escapeHtml(displayDashes(this.params.title || 'Password Entry'))}</h3>
            <p>Enter the correct password to proceed</p>
        `;
        
        // Set up the password interface
        this.setupPasswordInterface();
        
        // Add notebook button to minigame controls if postit note exists
        if (this.gameData.showPostit && this.gameData.postitNote && !this.gameData.hideNotepadButton) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook-postit';
            if (this.pcMonitor) {
                notebookBtn.innerHTML = pcPostitButtonHtml();
            } else {
                notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad';
            }
            this.ensureControlsRow()?.appendChild(notebookBtn);
        }
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /** True for a computer's own screen: a sign-in PC, or a computer's password lock. */
    isPcScreen() {
        if (this.signIn) return true;
        if (this.join) return false;
        const target = this.params.lockable || this.params.sprite;
        if (isCaseLockTarget(target?.scenarioData)) return false;
        return passwordScreenKind({ join: this.join, lockable: target }) === 'screen';
    }

    /** The PC's id, for the post-it height its frame keeps (utils/pc-monitor.js). */
    pcId() {
        if (this.signIn) return this.signIn.pcId || null;
        const target = this.params.lockable || this.params.sprite;
        return target?.scenarioData?.id || target?.objectId || null;
    }

    /** The PC's name for the monitor's top strip. */
    pcName() {
        if (this.signIn) return this.signIn.pcName || '';
        const target = this.params.lockable || this.params.sprite;
        return target?.scenarioData?.name || target?.name || this.params.deviceName || '';
    }

    /**
     * Put the screen in the PC monitor frame (UX slice 2c): the X in the bezel, Add to
     * Notepad in the chin, the post-it stuck on the chin. Boxes inside the screen still
     * snap to whole pixels; the frame itself is placed on whole pixels by its metrics.
     */
    mountMonitor() {
        const note = this.gameData.showPostit && this.gameData.postitNote
            ? escapeHtmlKeepWords(displayDashes(this.gameData.postitNote), { joinPunctuation: true }) : '';
        this.pcMonitor = mountPcMonitor(this, { name: displayDashes(this.pcName()), postitHtml: note, pcId: this.pcId() });
        if (!this.pcMonitor) { this.wrapInFrame(); return; }
        this.frameElement = this.pcMonitor.root;
        if (this.pcMonitor.postit) makeDraggable(this.pcMonitor.postit);
        this.snapFrameToPixels(this.pcMonitor.root, { moveFrame: false });
    }

    /**
     * The password screen's frame: a box that wraps the game area at every window size, with
     * the X inside its top-right corner (the user's UX notes: the frame wraps its content, and
     * the X sits inside the frame, clear of its border). The game area scrolls inside the frame
     * when the window is too short for it, so nothing in it can cover the controls row below.
     */
    wrapInFrame() {
        const area = this.gameContainer;
        if (!area?.parentNode || typeof document === 'undefined') return;
        const frame = document.createElement('div');
        frame.className = 'password-frame';
        area.parentNode.insertBefore(frame, area);
        frame.appendChild(area);
        const cross = this.container.querySelector('#minigame-close');
        if (cross) frame.appendChild(cross);
        this.frameElement = frame;
        this.snapFrameToPixels(frame);
    }

    /**
     * Keep the frame on whole pixels (UX slice 2a R3 m1): its flex centring puts it on a
     * half or quarter pixel when the window or its own height is odd, and every line of text
     * in it then sits off the pixel grid. A layout offset (the frame is position: relative),
     * not a transform, as slice 3a's copier frame does: Chrome draws a clip-path where layout
     * put it. Re-snapped after the first paint, on a window resize, and when the frame or
     * the overlay changes size (a message line, a chosen tile). The snap changes only
     * top/left, never a size, so it cannot retrigger itself.
     *
     * Then every box inside the frame is snapped the same way (R4 m2, snapInnerBoxes), and
     * again whenever the screen's content changes: new text changes a centred box's width
     * without changing the frame's size. A MutationObserver sees those changes; the records
     * of the snap's own style writes are dropped, so it does not run itself again.
     */
    snapFrameToPixels(frame, { moveFrame = true } = {}) {
        if (typeof window === 'undefined' || !frame || typeof frame.getBoundingClientRect !== 'function') return;
        this.stopFrameSnap();
        const snap = () => {
            if (!frame.isConnected) { this.stopFrameSnap(); return; }
            unsnapInnerBoxes(this._innerSnapped);
            this._innerSnapped = [];
            const dpr = window.devicePixelRatio || 1;
            // The PC monitor is placed by its metrics, already on whole pixels (moveFrame false)
            if (moveFrame) {
                frame.style.left = '';
                frame.style.top = '';
                const { x, y } = wholePixelOffset(frame.getBoundingClientRect(), dpr);
                if (x) frame.style.left = `${x}px`;
                if (y) frame.style.top = `${y}px`;
            }
            this._innerSnapped = snapInnerBoxes(frame, dpr, window);
            this._contentObserver?.takeRecords?.();
        };
        this._frameSnap = snap;
        snap();
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(snap);
        window.addEventListener('resize', snap);
        const RO = window.ResizeObserver;
        if (typeof RO === 'function') {
            this._frameObserver = new RO(() => snap());
            this._frameObserver.observe(frame);
            if (this.container?.nodeType === 1) this._frameObserver.observe(this.container);
        }
        const MO = window.MutationObserver;
        if (typeof MO === 'function') {
            this._contentObserver = new MO(() => snap());
            this._contentObserver.observe(frame, { subtree: true, childList: true, characterData: true, attributes: true });
        }
        // An image that finishes loading (the Add to Notepad icon) changes its line's layout
        // with no DOM change; load does not bubble, so listen in the capture phase
        frame.addEventListener('load', snap, true);
        // A pressed control (scale on :active) is left out of a snap made mid-press (R5 m1):
        // snap again when its transform transition ends, or on the next frame after the
        // release if it has none. Only when the last snap left a box out, so typing stays free.
        const afterPress = (e) => {
            if (!this._innerSnapped?.skipped) return;
            if (e.type === 'transitionend' || e.type === 'transitioncancel') {
                if (!/^(transform|scale|rotate)$/.test(e.propertyName || '')) return;
                snap();
                return;
            }
            if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => { if (this._frameSnap === snap) snap(); });
            else snap();
        };
        for (const type of ['transitionend', 'transitioncancel', 'pointerup', 'keyup']) frame.addEventListener(type, afterPress, true);
        this._frameAfterPress = afterPress;
        this._frameSnapHost = frame;
        // A pixel font that arrives late re-flows the text the same way
        const fonts = typeof document !== 'undefined' ? document.fonts : null;
        if (fonts?.addEventListener) fonts.addEventListener('loadingdone', snap);
        fonts?.ready?.then?.(() => { if (this._frameSnap === snap) snap(); });
    }

    /** Snap the frame and its boxes again now (a test or a caller that changed layout). */
    resnapFrame() {
        if (this._frameSnap) this._frameSnap();
    }

    stopFrameSnap() {
        if (this._frameSnap && typeof window !== 'undefined') window.removeEventListener('resize', this._frameSnap);
        if (this._frameSnap && this._frameSnapHost) this._frameSnapHost.removeEventListener('load', this._frameSnap, true);
        if (this._frameAfterPress && this._frameSnapHost) {
            for (const type of ['transitionend', 'transitioncancel', 'pointerup', 'keyup']) {
                this._frameSnapHost.removeEventListener(type, this._frameAfterPress, true);
            }
        }
        this._frameAfterPress = null;
        if (this._frameSnap && typeof document !== 'undefined') document.fonts?.removeEventListener?.('loadingdone', this._frameSnap);
        this._frameSnap = null;
        this._frameSnapHost = null;
        if (this._frameObserver) { this._frameObserver.disconnect(); this._frameObserver = null; }
        if (this._contentObserver) { this._contentObserver.disconnect(); this._contentObserver = null; }
    }

    complete(success) {
        this.stopFrameSnap();
        this.pcMonitor?.destroy?.();
        super.complete(success);
    }

    /**
     * The player's own close (the X, Esc, the on-screen Esc key) has its own result, so the
     * starter can tell it from a refusal and show no toast (UX slice 2a R3 m3). A result
     * already set (a lockout) is kept.
     */
    closeByPlayer() {
        if (!this.gameResult) {
            this.gameResult = { success: false, reason: 'closed', cancelled: true, closedByPlayer: true,
                                attempts: this.gameData?.attempts ?? 0 };
        }
        super.closeByPlayer();
    }

    /**
     * A message on a line inside the screen (UX slice 2a R3 m2), as the sign-in screen has:
     * the old box, fixed in the middle of the window, drew over the post-it in a short
     * window. With no line (a screen built without one) it falls back to that box.
     * closeAfterMs > 0 ends the screen after that long, as a failure. The line stays until
     * the next try, so it has no duration of its own (R4 n4).
     */
    showScreenMessage(text, { kind = 'error', closeAfterMs = 0 } = {}) {
        const line = this.passwordMessageEl;
        if (!line || line.isConnected === false) {
            if (text) this.showFailure(text, closeAfterMs > 0, closeAfterMs > 0 ? closeAfterMs : 1500, { plainText: true });
            return;
        }
        line.textContent = text || '';
        line.dataset.kind = kind;
        line.hidden = !text;
        // The post-it comes into view first and the line after it, as on the sign-in screen,
        // so a short window shows both (R4 n1: an empty Submit left the note half out of view)
        if (text) {
            revealInFrame(this.gameContainer?.querySelector?.('.postit-note'));
            revealInFrame(line);
        }
        if (closeAfterMs > 0) setTimeout(() => this.complete(false), closeAfterMs);
    }

    /**
     * The controls row (made on first use by the base ensureControlsRow, so there is none
     * when it would be empty) sits inside the frame, after the game area, as a fixed row that
     * does not scroll (the frame wraps all the content, the user's UX notes; UX slice 2a
     * R2 m3): the area scrolls above it, so the post-it cannot cover it.
     */
    controlsHost() {
        return this.pcMonitor?.controls || this.frameElement || null;
    }

    setupPasswordInterface() {
        // Create the password entry interface
        // Check if we can get the device image from sprite or params
        const getImageData = () => {
            // Try to get sprite data from params (from lockable object passed through minigame framework)
            const sprite = this.params.sprite || this.params.lockable;
            if (sprite && sprite.texture && sprite.scenarioData) {
                return {
                    imageFile: sprite.texture.key,
                    deviceName: sprite.scenarioData.name || sprite.name,
                    observations: sprite.scenarioData.observations || ''
                };
            }
            // Fallback to explicit params if provided
            if (this.params.deviceImage) {
                return {
                    imageFile: this.params.deviceImage,
                    deviceName: this.params.deviceName || this.params.title || 'Device',
                    observations: this.params.observations || ''
                };
            }
            return null;
        };
        
        const imageData = getImageData();

        // Name the lock over the field, as the PIN keypad does ("Enter PIN: Cable
        // Vault"); the framework hides the header, so it read just "Password:" (m07 #5)
        // In the PC monitor the bezel names the PC, so the label is the sign-in form's plain
        // "Password:" (UX slice 2c R2 M1)
        const fieldLabel = this.join ? 'Network key' : (this.pcMonitor ? 'Password:' : passwordFieldLabel(this.params.title));
        const kind = passwordScreenKind({ join: this.join, lockable: this.params.lockable || this.params.sprite });
        // The framework hides the header, so a Wi-Fi prompt names its network on the panel
        const promptTitle = this.join ? `Join Wi-Fi: ${this.join.apName || 'network'}` : '';
        
        // A carried case (a bag, briefcase or suitcase) has a code lock, not a computer
        // screen: it gets the case-lock look, with no desktop wallpaper (UX pass, 2026-11-12)
        const caseLock = isCaseLockTarget((this.params.lockable || this.params.sprite)?.scenarioData);
        // In the PC monitor (UX slice 2c) the monitor is the frame: no device picture above it,
        // no second bezel, and the post-it is on the monitor's chin (mountPcMonitor)
        const inMonitor = !!this.pcMonitor;
        const observations = imageData?.observations || '';
        // The PC's OS has one button look (R2 M1): the theme's thin skin (css/pc-monitor.css)
        const osBtn = inMonitor ? ' pc-os-btn' : '';
        const keyboardToggle = this.gameData.showKeyboard ? `
                        <button type="button" class="keyboard-toggle-btn${inMonitor ? ' pc-os-btn pc-os-icon-btn' : ''}" id="keyboard-toggle">
                            <img class="icon-keyboard" src="/break_escape/assets/objects/keyboard1.png" alt="Toggle keyboard">
                        </button>` : '';

        this.gameContainer.innerHTML = `
            <div class="password-minigame-area${kind === 'prompt' ? ' prompt-mode' : ''}${caseLock ? ' case-lock' : ''}${inMonitor ? ' pc-screen-area' : ''}">
                ${imageData && !inMonitor ? `
                    <div class="password-image-section">
                        <img src="/break_escape/assets/objects/${escapeHtml(imageData.imageFile)}.png" 
                             alt="${escapeHtml(imageData.deviceName)}" 
                             class="password-image">
                        <div class="password-info">
                            <h4>${escapeHtml(displayDashes(imageData.deviceName))}</h4>
                            <p>${escapeHtml(displayDashes(imageData.observations))}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="${inMonitor ? 'pc-lock-screen' : 'monitor-bezel'}">
                    <div class="${inMonitor ? 'pc-lock-panel' : 'monitor-screen'}">
                        ${inMonitor && observations ? `<div class="pc-screen-note">${escapeHtml(displayDashes(observations))}</div>` : ''}
                        <div class="password-input-container">
                            ${promptTitle ? `<div class="password-prompt-title">${escapeHtml(displayDashes(promptTitle))}</div>` : ''}
                            <label for="password-field">${escapeHtml(displayDashes(fieldLabel))}</label>
                            <div class="password-field-wrapper">
                                <input type="${this.gameData.showPassword ? 'text' : 'password'}" 
                                       id="password-field" 
                                       class="password-field"
                                       placeholder="${this.join ? 'Enter key...' : 'Enter password...'}"
                                       maxlength="50">
                                <button type="button" class="toggle-password-btn${inMonitor ? ' pc-os-btn pc-os-icon-btn' : ''}" id="toggle-password">
                                    <img class="icon-small" src="/break_escape/assets/icons/${this.gameData.showPassword ? 'visible.png' : 'hidden.png'}" alt="Toggle password visibility">
                                </button>${inMonitor ? keyboardToggle : ''}
                            </div>
                        </div>

                        <div class="hint-controls">
                            ${this.gameData.showHint ? `
                                <button type="button" class="hint-btn${osBtn}" id="show-hint">Show Hint</button>
                            ` : ''}
                            <button type="button" class="submit-btn${osBtn}" id="submit-password">Submit</button>
                        </div>
                        ${this.gameData.showHint ? `
                            <div class="password-hint-container">
                                <div class="password-hint" id="password-hint" style="display: none;">
                                    <span class="mg-field-label">Hint:</span> ${escapeHtml(displayDashes(this.gameData.passwordHint))}
                                </div>
                            </div>
                        ` : ''}
                        <div class="password-message" id="password-message" aria-live="polite" hidden></div>
                    </div>
                </div>
                
                ${this.gameData.showPostit && this.gameData.postitNote && !inMonitor ? `
                    <div class="postit-note">
                        ${escapeHtmlKeepWords(displayDashes(this.gameData.postitNote))}
                    </div>
                ` : ''}
                
                ${inMonitor ? '' : `<div class="password-controls">${keyboardToggle}
                </div>`}
                
                ${this.gameData.showKeyboard ? `
                    <div class="onscreen-keyboard" id="onscreen-keyboard" style="display: ${this.gameData.keyboardVisible ? 'flex' : 'none'}">
                        <div class="keyboard-row">
                            <button class="key" data-key="1">1</button>
                            <button class="key" data-key="2">2</button>
                            <button class="key" data-key="3">3</button>
                            <button class="key" data-key="4">4</button>
                            <button class="key" data-key="5">5</button>
                            <button class="key" data-key="6">6</button>
                            <button class="key" data-key="7">7</button>
                            <button class="key" data-key="8">8</button>
                            <button class="key" data-key="9">9</button>
                            <button class="key" data-key="0">0</button>
                            <button class="key key-backspace" data-key="Backspace">⌫</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key" data-key="q">Q</button>
                            <button class="key" data-key="w">W</button>
                            <button class="key" data-key="e">E</button>
                            <button class="key" data-key="r">R</button>
                            <button class="key" data-key="t">T</button>
                            <button class="key" data-key="y">Y</button>
                            <button class="key" data-key="u">U</button>
                            <button class="key" data-key="i">I</button>
                            <button class="key" data-key="o">O</button>
                            <button class="key" data-key="p">P</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key" data-key="a">A</button>
                            <button class="key" data-key="s">S</button>
                            <button class="key" data-key="d">D</button>
                            <button class="key" data-key="f">F</button>
                            <button class="key" data-key="g">G</button>
                            <button class="key" data-key="h">H</button>
                            <button class="key" data-key="j">J</button>
                            <button class="key" data-key="k">K</button>
                            <button class="key" data-key="l">L</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key key-shift" data-key="Shift" id="shift-key">Shift</button>
                            <button class="key" data-key="z">Z</button>
                            <button class="key" data-key="x">X</button>
                            <button class="key" data-key="c">C</button>
                            <button class="key" data-key="v">V</button>
                            <button class="key" data-key="b">B</button>
                            <button class="key" data-key="n">N</button>
                            <button class="key" data-key="m">M</button>
                            <button class="key key-space" data-key=" ">Space</button>
                        </div>
                        <div class="keyboard-row">
                            <button class="key key-special" data-key="Enter">Enter</button>
                            <button class="key key-special" data-key="Escape">Esc</button>
                        </div>
                    </div>
                ` : ''}
                
                ${(this.join || inMonitor) ? '' : `
                <div class="attempts-counter">
                    Attempts: <span id="attempts-display">${escapeHtml(this.gameData.attempts)}</span>/${escapeHtml(this.gameData.maxAttempts)}
                </div>
                `}
            </div>
        `;

        // Name the bare tags so the crisp-text rule in minigames-framework.css can list them
        // (classList only, the markup above is unchanged).
        const tagText = (selector, cls) => this.gameContainer.querySelector(selector)?.classList.add(cls);
        tagText('.password-info h4', 'password-info-name');
        tagText('.password-info p', 'password-info-text');
        tagText('.password-input-container label', 'password-field-label');

        // Get references to important elements
        this.passwordField = document.getElementById('password-field');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.submitBtn = document.getElementById('submit-password');
        this.keyboardToggleBtn = document.getElementById('keyboard-toggle');
        this.attemptsDisplay = document.getElementById('attempts-display');
        this.passwordMessageEl = this.gameContainer.querySelector('#password-message');

        // Make the post-it note draggable (rendered via HTML template above)
        if (this.gameData.showPostit && this.gameData.postitNote) {
            const postit = this.pcMonitor ? null : (this.gameContainer
                ? this.gameContainer.querySelector('.postit-note')
                : document.querySelector('.password-minigame-area .postit-note'));
            if (postit) {
                makeDraggable(postit);
            }
        }

        // Focus the password field
        if (this.passwordField) {
            this.passwordField.focus();
        }
    }
    
    setupEventListeners() {
        // Password field events
        if (this.passwordField) {
            this.addEventListener(this.passwordField, 'keydown', (event) => {
                this.handleKeyPress(event);
            });
            
            this.addEventListener(this.passwordField, 'input', (event) => {
                this.handlePasswordInput(event);
            });
        }
        
        // Toggle password visibility
        if (this.togglePasswordBtn) {
            this.addEventListener(this.togglePasswordBtn, 'click', () => {
                this.togglePasswordVisibility();
            });
        }
        
        // Submit button
        if (this.submitBtn) {
            this.addEventListener(this.submitBtn, 'click', () => {
                this.submitPassword();
            });
        }
        
        // Keyboard toggle button
        if (this.keyboardToggleBtn) {
            this.addEventListener(this.keyboardToggleBtn, 'click', () => {
                this.toggleKeyboardVisibility();
            });
        }
        
        // Hint button
        const hintBtn = document.getElementById('show-hint');
        if (hintBtn) {
            this.addEventListener(hintBtn, 'click', () => {
                this.toggleHint();
            });
        }
        
        // Onscreen keyboard
        const keyboard = document.getElementById('onscreen-keyboard');
        if (keyboard) {
            this.addEventListener(keyboard, 'click', (event) => {
                this.handleKeyboardClick(event);
            });
        }
        
        // Notebook button for postit (in minigame controls)
        const notebookBtn = document.getElementById('minigame-notebook-postit');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => {
                this.addPostitToNotebook();
            });
        }
    }
    
    start() {
        // Call parent start
        super.start();
        const left = this.lockKey ? passwordLockStatus(this.lockKey).lockedLeftSeconds : 0;
        if (left > 0) this.showScreenMessage(passwordLockedMessage(left));

        console.log("Password minigame started");
    }
    
    handleKeyPress(event) {
        if (!this.gameState.isActive) return;
        
        switch(event.key) {
            case 'Enter':
                event.preventDefault();
                this.submitPassword();
                break;
            case 'Escape':
                // The same close as the X, wherever the focus is (UX slice 2a R2 m1)
                event.preventDefault();
                event.stopPropagation();
                this.closeByPlayer();
                break;
        }
    }
    
    handlePasswordInput(event) {
        // Update the internal password state
        this.gameData.password = event.target.value;
    }
    
    togglePasswordVisibility() {
        this.gameData.showPassword = !this.gameData.showPassword;
        
        // Update input type
        this.passwordField.type = this.gameData.showPassword ? 'text' : 'password';
        
        // Update button image
        const img = this.togglePasswordBtn.querySelector('img');
        if (img) {
            const iconName = this.gameData.showPassword ? 'visible.png' : 'hidden.png';
            img.src = `${ASSETS_PATH}/icons/${iconName}`;
        }
    }
    
    toggleKeyboardVisibility() {
        this.gameData.keyboardVisible = !this.gameData.keyboardVisible;
        const keyboard = document.getElementById('onscreen-keyboard');
        if (keyboard) {
            keyboard.style.display = this.gameData.keyboardVisible ? 'flex' : 'none';
        }
    }
    
    toggleHint() {
        const hintElement = document.getElementById('password-hint');
        const hintBtn = document.getElementById('show-hint');
        
        if (hintElement && hintBtn) {
            if (hintElement.style.display === 'none') {
                hintElement.style.display = 'block';
                hintBtn.textContent = 'Hide Hint';
            } else {
                hintElement.style.display = 'none';
                hintBtn.textContent = 'Show Hint';
            }
        }
    }
    
    handleKeyboardClick(event) {
        if (!this.gameState.isActive) return;
        
        const key = event.target;
        if (!key.classList.contains('key')) return;
        
        const keyValue = key.dataset.key;
        
        if (keyValue === 'Enter') {
            this.submitPassword();
        } else if (keyValue === 'Escape') {
            this.closeByPlayer();
        } else if (keyValue === 'Shift') {
            this.toggleCapsLock();
        } else if (keyValue === 'Backspace') {
            this.passwordField.value = this.passwordField.value.slice(0, -1);
            this.gameData.password = this.passwordField.value;
        } else if (keyValue === ' ') {
            this.passwordField.value += ' ';
            this.gameData.password = this.passwordField.value;
        } else if (keyValue && keyValue.length === 1) {
            const char = this.gameData.capsLock ? keyValue.toUpperCase() : keyValue.toLowerCase();
            this.passwordField.value += char;
            this.gameData.password = this.passwordField.value;
        }
        
        // Keep focus on password field
        this.passwordField.focus();
    }
    
    toggleCapsLock() {
        this.gameData.capsLock = !this.gameData.capsLock;
        const shiftKey = document.getElementById('shift-key');
        if (shiftKey) {
            if (this.gameData.capsLock) {
                shiftKey.classList.add('active');
            } else {
                shiftKey.classList.remove('active');
            }
        }
    }
    
    async submitPassword() {
        // One check at a time: Enter plus a Submit click (or a fast double Enter) used
        // to count two attempts for one password (m02 playtest M2/M7; same guard as
        // the PIN minigame's checkPending).
        if (this.checkPending) return;
        this.checkPending = true;
        try {
            if (this.join) await this._submitJoinOnce();
            else if (this.signIn) await this._submitSignInOnce();
            else await this._submitPasswordOnce();
        } finally {
            this.checkPending = false;
        }
    }

    async _submitPasswordOnce() {
        const gameId = window.breakEscapeConfig?.gameId;
        console.log('submitPassword called', {
            isActive: this.gameState.isActive,
            correctPassword: this.correctPassword,
            hasApiClient: !!window.ApiClient,
            hasAPIClient: !!window.APIClient,
            gameId: gameId
        });

        if (!this.gameState.isActive) return;

        // The post-it path of a PC that is not the learner's to sign in to: say so, check nothing,
        // count nothing, and leave the view open.
        if (this.gameData.submitText) {
            if (!this.passwordField?.value?.trim()) return;
            this.showScreenMessage(this.gameData.submitText, { kind: 'info' });
            return;
        }

        if (this.lockKey) {
            const left = passwordLockStatus(this.lockKey).lockedLeftSeconds;
            if (left > 0) {
                this.showScreenMessage(passwordLockedMessage(left));
                return;
            }
            this.gameData.attempts = passwordLockStatus(this.lockKey).attempts;
        }

        const enteredPassword = this.passwordField.value.trim();
        console.log('Entered password:', enteredPassword);

        if (!enteredPassword) {
            this.showScreenMessage('Please enter a password');
            return;
        }
        this.showScreenMessage('');

        this.gameData.attempts++;
        this._saveLock();
        if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.gameData.attempts;
        // The counter is on screen after each try, even in a short window (UX slice 2a R2 M2).
        // A PC's screen has no counter: its message line carries the count and is revealed
        // when it is written (UX slice 2c R2 M1), so nothing is revealed here: the line was
        // just emptied (R3 m6)
        const counter = this.attemptsDisplay?.closest?.('.attempts-counter') || this.attemptsDisplay;
        if (counter) revealInFrame(counter);

        // SECURITY: ALWAYS use server-side validation for password attempts
        const apiClient = window.ApiClient || window.APIClient;
        if (apiClient && gameId) {
            console.log('Using server-side validation (security enforced)');
            await this.validatePasswordWithServer(enteredPassword);
        } else {
            console.error('SECURITY WARNING: API client not available, cannot validate password');
            // Fail securely - reject the attempt if we can't validate with server
            this.passwordIncorrect();
        }
    }

    // Wi-Fi join (slice 9.3b W, 5.3): the key goes to networkLinks.join, which posts
    // /network/join and applies the foothold. A wrong key is refused with no attempt count;
    // a success or already closes the minigame. The key is sent as typed (no trim), since a
    // Wi-Fi key may hold spaces, and is never stored on the scene.
    async _submitJoinOnce() {
        if (!this.gameState.isActive) return;
        const key = this.passwordField ? this.passwordField.value : '';
        if (!key) {
            this.showScreenMessage('Please enter the key');
            return;
        }
        this.showScreenMessage('');
        const links = window.networkLinks;
        const result = (links && typeof links.join === 'function') ? await links.join(this.join.apId, key) : { action: 'error' };
        if (result.action === 'joined' || result.action === 'already') {
            this.cleanup();
            if (window.playUISound) window.playUISound('confirm');
            this.showSuccess('Connected.', true, 900);
            this.gameResult = { success: true, join: result };
        } else if (result.action === 'wrong_key') {
            this.joinMessage = 'That key was not accepted.';
            if (window.playUISound) window.playUISound('reject');
            this.showScreenMessage(this.joinMessage);
            this.passwordField.value = '';
            this.passwordField.focus();
        } else {
            this.showScreenMessage('The network did not respond. Try again.');
        }
    }

    async validatePasswordWithServer(enteredPassword) {
        try {
            // Get lockable object and type from params
            const lockable = this.params.lockable || this.params.sprite;
            const targetType = this.params.type || 'object'; // 'door' or 'object'

            // Get target ID from lockable
            let targetId;
            if (targetType === 'door') {
                targetId = lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
            } else {
                targetId = lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
            }

            if (!targetId) {
                console.error('Could not determine targetId for unlock validation');
                this.passwordIncorrect();
                return;
            }

            console.log('Validating password with server:', { targetType, targetId, attempt: enteredPassword });

            // Call server API for validation, through the shared object-unlock retry so a correct
            // password on a route-room object is not refused during the pre-promotion window (§3.6).
            const response = await unlockWithRouteRoomRetry(targetType, targetId, enteredPassword, 'password');

            if (response.success) {
                // If server returned container contents, populate the lockable object
                if (response.hasContents && response.contents && lockable.scenarioData) {
                    console.log('Server returned container contents:', response.contents);
                    lockable.scenarioData.contents = response.contents;
                }
                // Store server response to pass through callback chain
                this.serverResponse = response;
                this.passwordCorrect();
            } else {
                this.passwordIncorrect({ caseMismatch: response?.caseMismatch === true });
            }
        } catch (error) {
            console.error('Server validation error:', error);
            // api-client sets err.status; a wrong password comes back 422 and is a real attempt.
            const refusal = lockScopeRefusal(error);
            if (refusal) {
                // The PC the lock sits on is off, not responding or out of reach (review R4
                // m2): not an attempt and not a wrong password, so say why and close as cancelled
                this.gameData.attempts--;
                this._saveLock();
                if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.gameData.attempts;
                this.cleanup();
                this.showScreenMessage(lockScopeRefusalLine(error), { closeAfterMs: 2000 });
                this.gameResult = { success: false, reason: 'cancelled', cancelled: true, refused: refusal,
                                    attempts: this.gameData.attempts };
            } else if (error?.status === 422 || error?.message?.includes('422')) {
                this.passwordIncorrect({ caseMismatch: error?.body?.caseMismatch === true });
            } else {
                this.showScreenMessage('Network error. Please try again.');
                // Decrease attempts counter since this wasn't a real attempt
                this.gameData.attempts--;
                this._saveLock();
                if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.gameData.attempts;
            }
        }
    }
    
    _saveLock() {
        if (this.lockKey) notePasswordAttempts(this.lockKey, this.gameData.attempts, this.gameData.maxAttempts, this.lockoutSeconds);
    }

    passwordCorrect() {
        if (this.lockKey) notePasswordAttempts(this.lockKey, 0, this.gameData.maxAttempts, this.lockoutSeconds);
        this.cleanup();
        if (window.playUISound) window.playUISound('confirm');
        this.showSuccess("Password accepted! Access granted.", true, 1000);

        // Set game result for the callback
        this.gameResult = {
            success: true,
            password: this.gameData.password,
            attempts: this.gameData.attempts,
            serverResponse: this.serverResponse // Include server response (roomData for doors, contents for containers)
        };
    }
    
    passwordIncorrect({ caseMismatch = false } = {}) {
        const remaining = this.gameData.maxAttempts - this.gameData.attempts;
        this.emitPasswordFailed(caseMismatch, Math.max(remaining, 0));
        if (this.gameData.attempts >= this.gameData.maxAttempts) {
            this.passwordFailed({ caseMismatch });
        } else {
            if (window.playUISound) window.playUISound('reject');
            this.showScreenMessage(incorrectPasswordMessage(remaining, caseMismatch));
            
            // Clear the password field
            this.passwordField.value = '';
            this.gameData.password = '';
            this.passwordField.focus();
        }
    }
    
    /**
     * Tell missions about a wrong password: password_failed (and
     * password_failed:<targetId>) for any target, and door_unlock_failed through the
     * unlock system's onRefused for a door. caseMismatch is true when the entry was
     * right apart from letter case.
     */
    emitPasswordFailed(caseMismatch, attemptsRemaining) {
        const lockable = this.params.lockable || this.params.sprite;
        const targetType = this.params.type || 'object';
        const targetId = targetType === 'door'
            ? (lockable?.doorProperties?.connectedRoom || lockable?.doorProperties?.roomId || null)
            : (lockable?.scenarioData?.id || lockable?.objectId || null);
        const payload = {
            targetType,
            targetId,
            name: lockable?.scenarioData?.name || null,
            lockType: 'password',
            caseMismatch,
            attemptsRemaining
        };
        try {
            window.eventDispatcher?.emit('password_failed', payload);
            if (targetId) window.eventDispatcher?.emit(`password_failed:${targetId}`, payload);
            if (typeof this.params.onRefused === 'function') {
                this.params.onRefused(caseMismatch ? 'wrong_password_case' : 'wrong_password');
            }
        } catch (e) {
            console.warn('password_failed listeners threw', e);
        }
    }

    passwordFailed({ caseMismatch = false } = {}) {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        const wait = this.lockKey ? ` Locked for ${this.lockoutSeconds} second${this.lockoutSeconds === 1 ? '' : 's'}.` : '';
        this.showScreenMessage(
            caseMismatch
                ? `Maximum attempts exceeded. Access denied.${wait} Passwords are case-sensitive.`
                : `Maximum attempts exceeded. Access denied.${wait}`,
            { closeAfterMs: caseMismatch ? 2500 : 1500 });
        
        this.gameResult = {
            success: false,
            reason: 'max_attempts_exceeded',
            attempts: this.gameData.attempts
        };
    }
    
    addPostitToNotebook() {
        if (!this.gameState.isActive) return;

        const postitNote = this.gameData.postitNote;
        if (!postitNote || postitNote.trim() === '') {
            this.showFailure("No postit note to add.", false, 2000);
            return;
        }

        // Get the device name from available sources
        const deviceName = this.params.deviceName || 
                          this.params.scenarioData?.name ||
                          this.params.title || 
                          'Unknown Device';

        // Create comprehensive notebook content
        const notebookTitle = `Postit Note - ${deviceName}`;
        let notebookContent = `Postit Note:\n${'-'.repeat(20)}\n\n${postitNote}`;
        notebookContent += `\n\n${'='.repeat(20)}\n`;
        notebookContent += `PASSWORD PROTECTED: ${deviceName}\n`;
        notebookContent += `${'='.repeat(20)}\n`;
        notebookContent += `Date: ${new Date().toLocaleString()}`;
        
        const notebookObservations = 'Postit note found during password entry.';

        // Check if notes minigame is available
        if (window.startNotesMinigame) {
            // Store the password state globally so we can return to it
            const passwordState = {
                password: this.gameData.password,
                passwordHint: this.gameData.passwordHint,
                showHint: this.gameData.showHint,
                showKeyboard: this.gameData.showKeyboard,
                maxAttempts: this.gameData.maxAttempts,
                attempts: this.gameData.attempts,
                showPassword: this.gameData.showPassword,
                postitNote: this.gameData.postitNote,
                showPostit: this.gameData.showPostit,
                capsLock: this.gameData.capsLock,
                keyboardVisible: this.gameData.keyboardVisible,
                params: this.params
            };

            window.pendingPasswordReturn = passwordState;

            // Create a postit item for the notes minigame
            const postitItem = {
                scenarioData: {
                    type: 'postit_note',
                    name: notebookTitle,
                    text: notebookContent,
                    observations: notebookObservations,
                    important: true
                }
            };

            // Start notes minigame
            window.startNotesMinigame(
                postitItem,
                notebookContent,
                notebookObservations,
                null,
                false,
                true // add to the Notepad (a filed item passes false)
            );

            this.showSuccess("Added postit note to notepad", false, 2000);
        } else {
            this.showFailure("Notepad not available", false, 2000);
        }
    }
    
    cleanup() {
        // Release the frame-snap observers and the PC monitor's chin ResizeObserver when the
        // game really ends (endMinigame sets _ending, then calls cleanup(); the X goes the same
        // way). Mid-flow cleanup() calls (lockout, accepted, wrong password) leave the screen up
        // with a message, so the snap and pc-view stay; both releases are idempotent
        if (this._ending) {
            this.stopFrameSnap?.();
            this.pcMonitor?.destroy?.();
        }
        this._clearKeyboardReveal?.();
        this.clearPushTimer?.();
        // Call parent cleanup (handles event listeners)
        super.cleanup();
    }

    // ── Sign-in mode ─────────────────────────────────────────────────────────

    initSignIn() {
        const s = this.signIn;
        const st = this.signInState;
        this.headerElement.innerHTML = `<h3>${escapeHtml(displayDashes(`Sign in: ${s.pcName}`))}</h3>`;

        const remote = !!s.remote;
        // The one tile row: the PC's own accounts at the keyboard, or the merged remote row of the
        // PC's accounts and the captured sign-ins (credential keyring plan 5.2). Keyboard markup is
        // unchanged; a remote tile adds data-username and its kind tags. A locked remote screen
        // has its account already (the held session's), so it drops the row (UI slice 6 R3 m1).
        const showTiles = remote ? (s.current?.locked !== true) : (s.picker !== false);
        const tiles = showTiles ? `
            <div class="signin-tiles" id="signin-tiles">${this.signInTilesInnerHtml()}</div>${remote ? `
            <div class="signin-tiles-more" id="signin-tiles-more" hidden aria-hidden="true"><span class="signin-tiles-more-arrow"></span><span>${REMOTE_MORE_BELOW_TEXT}</span></div>` : ''}` : '';
        // A remote Switch-user screen (a held, unlocked session) merges the "Signed in now" line
        // and the remote line into one slab (credential keyring plan 5.2 Fit): one line at x2,
        // two at 390x844. It wins back a line's height so the form fits .pc-monitor-area.
        const remoteHeld = s.remote && s.current && s.current.locked !== true;
        const headerSlabs = remoteHeld
            ? `<div class="signin-current signin-current-remote">${escapeHtml(s.current.displayName || s.current.username)} signed in${s.remote.fromHost ? `, from ${escapeHtml(displayDashes(s.remote.fromHost))}` : (s.remote.linkName ? `, through ${escapeHtml(displayDashes(s.remote.linkName))}` : '')}</div>`
            : `${s.remote ? `<div class="signin-remote">Remote sign-in${s.remote.fromHost ? ` from ${escapeHtml(displayDashes(s.remote.fromHost))}` : (s.remote.linkName ? ` through ${escapeHtml(displayDashes(s.remote.linkName))}` : '')}</div>` : ''}${s.current
                ? (s.current.locked === true
                    // A locked session (UI slice 6): it is held, but needs its password again
                    ? `<div class="signin-current signin-current-locked">${escapeHtml(lockedSlabText(s.current.displayName || s.current.username, !!s.remote && s.current.via === 'credential'))}</div>`
                    : `<div class="signin-current">Signed in now: ${escapeHtml(s.current.displayName || s.current.username)} (${escapeHtml(s.current.username)})</div>`)
                : ''}`;

        const inMonitor = !!this.pcMonitor;
        this.gameContainer.innerHTML = `
            <div class="password-minigame-area signin-mode${inMonitor ? ' pc-screen-area' : ''}${remote ? ' signin-remote-screen' : ''}">
                <div class="${inMonitor ? 'pc-lock-screen' : 'monitor-bezel'}">
                    <div class="${inMonitor ? 'signin-screen' : 'monitor-screen signin-screen'}">
                        <div class="signin-title">${escapeHtml(displayDashes(s.pcName))}</div>
                        ${headerSlabs}
                        ${tiles}${inMonitor ? `
                        <div class="signin-prompt" id="signin-prompt" aria-live="polite" hidden></div>
                        <div class="signin-card" id="signin-card">` : ''}
                        <div class="signin-second" id="signin-second" hidden></div>
                        <div class="signin-form" id="signin-form">
                            <div class="signin-selected-row">${inMonitor ? `
                                <span class="signin-selected-headshot" aria-hidden="true" hidden></span>` : ''}
                                <div class="signin-selected" id="signin-selected"></div>
                                <button type="button" class="signin-change${inMonitor ? ' pc-os-btn' : ''}" id="signin-change">Change</button>
                            </div>
                            <div class="signin-ways" id="signin-ways" hidden></div>
                            <div class="signin-ways-more" id="signin-ways-more" hidden aria-hidden="true"><span class="signin-tiles-more-arrow"></span><span>${REMOTE_MORE_BELOW_TEXT}</span></div>
                            <div class="signin-field-row" id="signin-username-row">
                                <label for="signin-username">Username:</label>
                                <input type="text" id="signin-username" class="password-field" placeholder="Username" aria-label="Username" maxlength="64" autocomplete="off" spellcheck="false">
                            </div>
                            <div class="signin-field-row" id="signin-password-row">
                                <label for="password-field">Password:</label>
                                <div class="password-field-wrapper">
                                    <input type="password" id="password-field" class="password-field" placeholder="Password" aria-label="Password" maxlength="64" autocomplete="off">
                                    <button type="button" class="toggle-password-btn${inMonitor ? ' pc-os-btn pc-os-icon-btn' : ''}" id="toggle-password">
                                        <img class="icon-small" src="/break_escape/assets/icons/hidden.png" alt="Toggle password visibility">
                                    </button>
                                </div>
                            </div>
                            <div class="hint-controls">
                                <button type="button" class="submit-btn${inMonitor ? ' pc-os-btn' : ''}" id="submit-password">Sign in</button>
                            </div>
                        </div>
                        <div class="signin-message" id="signin-message" aria-live="polite"></div>${inMonitor ? `
                        </div>` : ''}
                    </div>
                </div>
                ${this.gameData.showPostit && this.gameData.postitNote && !inMonitor ? `
                    <div class="postit-note">${escapeHtmlKeepWords(this.gameData.postitNote)}</div>
                ` : ''}
            </div>
        `;

        this.usernameField = this.gameContainer.querySelector('#signin-username');
        this.passwordField = this.gameContainer.querySelector('#password-field');
        this.togglePasswordBtn = this.gameContainer.querySelector('#toggle-password');
        this.submitBtn = this.gameContainer.querySelector('#submit-password');
        this.signInMessageEl = this.gameContainer.querySelector('#signin-message');
        // A locked session with no tile (UI slice 6): pre-fill the "Other user" field.
        if (this.signInState?.presetUsername && this.usernameField && !this.usernameField.value) {
            this.usernameField.value = this.signInState.presetUsername;
        }

        this.bindSignInTiles();
        const change = this.gameContainer.querySelector('#signin-change');
        if (change) this.addEventListener(change, 'click', () => this.clearSignInChoice());

        if (this.gameData.showPostit && this.gameData.postitNote) {
            const postit = inMonitor ? null : this.gameContainer.querySelector('.postit-note');
            if (postit) makeDraggable(postit);
            const controls = this.gameData.hideNotepadButton ? null : this.ensureControlsRow();
            if (controls) {
                const notebookBtn = document.createElement('button');
                notebookBtn.className = 'minigame-button';
                notebookBtn.id = 'minigame-notebook-postit';
                if (this.pcMonitor) {
                    notebookBtn.innerHTML = pcPostitButtonHtml();
                } else {
                    notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes.png" alt="Notepad" class="icon-small notepad-btn-icon"> Add to Notepad';
                }
                controls.appendChild(notebookBtn);
                this.addEventListener(notebookBtn, 'click', () => this.addPostitToNotebook());
            }
        }

        const onKey = (event) => {
            if (!this.gameState.isActive) return;
            // The same close as the X, wherever the focus is (UX slice 2a R2 m1)
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.closeByPlayer(); return; }
            if (event.key !== 'Enter') return;
            event.preventDefault();
            if (event.target === this.usernameField && !this.passwordField.value) {
                this.passwordField.focus();
            } else {
                this.submitPassword();
            }
        };
        this.addEventListener(this.usernameField, 'keydown', onKey);
        this.addEventListener(this.passwordField, 'keydown', onKey);
        this.addEventListener(this.passwordField, 'input', (e) => { this.gameData.password = e.target.value; });
        this.addEventListener(this.togglePasswordBtn, 'click', () => this.togglePasswordVisibility());
        this.addEventListener(this.submitBtn, 'click', () => this.submitPassword());

        if (remote) {
            const row = this.gameContainer.querySelector('#signin-tiles');
            if (row) this.addEventListener(row, 'scroll', () => this.updateSignInTilesMore());
            this.addEventListener(window, 'resize', () => this.fitSignInTiles());
        }
        const ways = this.gameContainer.querySelector('#signin-ways');
        if (ways) this.addEventListener(ways, 'scroll', () => this.updateSignInWaysMore());
        this.addEventListener(window, 'resize', () => this.fitSignInWays());
        // The frame's own resize handler sets data-short; measure the usernames now and once it has run
        this.addEventListener(window, 'resize', () => this.fitSignInUsernames({ again: true }));
        // Name lines change when the pixel font lands: measure once more then. Load the face itself
        // (as container-minigame does): fonts.ready can already be resolved before GNF is requested
        const fonts = window.document?.fonts;
        const landed = fonts?.load ? fonts.load('16px GNF') : fonts?.ready;
        landed?.then?.(() => {
            if (this.gameContainer?.isConnected) this.fitSignInUsernames();
        }, () => {});
        this.bindKeyboardReveal([this.usernameField, this.passwordField]);
        this.renderSignInForm();
        this.resumeSecondStep();
    }

    /**
     * The on-screen keyboard covers the lower part of the screen, and with it the message line and
     * the Sign in button. While the username or password field has focus and the visual viewport
     * is shrunk (a keyboard is up, and not a pinch-zoom), find the lower of the message line (when
     * it has text) and Sign in. If it sits below the keyboard edge (visualViewport offsetTop plus
     * height), size the panel's bottom padding to the panel's own part hidden under that edge (plus
     * 8px) and set scroll-padding to the same, so the panel's own scroll brings the target 8px
     * above the keyboard whether or not the browser pans the visual viewport. Each pass starts from
     * the saved base padding, so repeated resizes (a keyboard slides in over several events) do not
     * stack. Both values are divided by the panel's CSS zoom (--pc-ui-scale), because rects are in
     * drawn pixels and inline styles are in the panel's own. It runs in a requestAnimationFrame so a
     * layout the same resize changed is measured after it settles. A message set while the keyboard
     * is up re-runs it (setSignInMessage via _keyboardReveal). On browsers that resize the layout for
     * the keyboard (innerHeight shrinks with the visual viewport) the panel already has a scroll
     * range, so only the reveal runs, with no padding. When the keyboard closes, or on blur, the
     * padding goes and any window scroll drift is put back to 0. Bound on every device and a no-op
     * unless a keyboard is up, so a desktop is unaffected. The listeners go through
     * this.addEventListener, so cleanup() removes them.
     *
     * Sign-in always opens in the PC monitor (isPcScreen is true for it, and mountPcMonitor only
     * returns null with no container or no document), so the panel here is the monitor's scrolling
     * screen with a fixed height. The old password-frame fallback, where padding would grow the
     * frame instead of adding range, cannot be reached by a sign-in in a browser.
     */
    bindKeyboardReveal(fields) {
        if (typeof window === 'undefined') return;
        const list = (Array.isArray(fields) ? fields : [fields]).filter(Boolean);
        const panel = this.gameContainer;
        const vv = window.visualViewport;
        if (!list.length || !panel || !vv || typeof vv.addEventListener !== 'function') return;
        const raf = (cb) => (typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(cb) : cb());
        let applied = false;
        let saved = null;
        let dead = false;
        // A fresh error line won over the field: while the keyboard stays up, a viewport resize of any
        // size re-pins the line to the new edge instead of handing the win back to the field. Cleared
        // when the player types, on blur, when the keyboard goes down and at cleanup.
        let errorHeld = false;
        // The tallest innerHeight seen for each innerWidth while a field had focus. A rotation looks
        // the new width up, so rotating back keeps the baseline from before the keyboard shrank the layout.
        const tallest = new Map();
        let focusW = 0; // the innerWidth last seen while focused
        const noteHeight = () => {
            const w = window.innerWidth;
            tallest.set(w, Math.max(tallest.get(w) || 0, window.innerHeight));
        };
        const syncOrientation = () => {
            if (focusW !== window.innerWidth) { focusW = window.innerWidth; }
            noteHeight();
        };
        const keyboardUp = () => vv.scale === 1 && (window.innerHeight - vv.height) > 100;
        // A browser that resizes the layout for the keyboard: innerHeight itself has dropped
        const layoutShrunk = () => vv.scale === 1 && (tallest.get(window.innerWidth) || 0) > 0 && (tallest.get(window.innerWidth) - window.innerHeight) > 100;
        const focused = () => list.includes(document.activeElement);
        const clear = () => {
            if (applied) {
                panel.style.paddingBottom = saved.pad;
                panel.style.scrollPaddingBottom = saved.scrollPad;
                applied = false;
                saved = null;
            }
            if (window.scrollY !== 0) { try { window.scrollTo(0, 0); } catch (e) { /* no scrollTo: leave it */ } }
        };
        const lowestTarget = (errorWins) => {
            const msg = this.signInMessageEl;
            if (errorWins && msg?.textContent) return { el: msg, bottom: msg.getBoundingClientRect().bottom };
            const cands = [];
            if (msg?.textContent) cands.push(msg);
            if (this.submitBtn) cands.push(this.submitBtn);
            let lowest = null;
            let lowestBottom = -Infinity;
            for (const el of cands) {
                const bottom = el.getBoundingClientRect().bottom;
                if (bottom > lowestBottom) { lowest = el; lowestBottom = bottom; }
            }
            return lowest ? { el: lowest, bottom: lowestBottom } : null;
        };
        // The field being typed in wins over the message line: on a short landscape screen the reveal
        // can push it above the panel's top, so put it back at the top of the panel.
        const keepFieldInView = () => {
            const a = document.activeElement;
            if (!a || !list.includes(a) || typeof a.scrollIntoView !== 'function') return;
            if (a.getBoundingClientRect().top < panel.getBoundingClientRect().top) {
                a.scrollIntoView({ block: 'start', inline: 'nearest' });
            }
        };
        // errorWins: a fresh error or lockout line is put 8px above the keyboard even if that pushes
        // the field above the panel's top (the attempts left matter more than the field for that moment).
        // Focus and keyboard resizes leave it false, so the field wins there.
        const reveal = (errorWins) => {
            if (dead || !focused()) return;
            errorWins = errorWins === true;
            if (!keyboardUp()) {
                errorHeld = false;
                if (layoutShrunk()) {
                    const t = lowestTarget(errorWins);
                    if (t) { revealInFrame(t.el); if (!errorWins) keepFieldInView(); }
                }
                return;
            }
            const edge = vv.offsetTop + vv.height;
            const target = lowestTarget(errorWins);
            if (!target) return;
            if (errorWins) errorHeld = true;
            if (target.bottom > edge) {
                if (!applied) {
                    saved = { pad: panel.style.paddingBottom, scrollPad: panel.style.scrollPaddingBottom };
                    applied = true;
                }
                // How much of the panel is under the keyboard; the panel's own bottom, not the target's
                const hidden = Math.max(0, Math.ceil(panel.getBoundingClientRect().bottom - edge)) + 8;
                const z = cssZoomOf(panel) || 1;
                const base = parseFloat(saved.pad) || 0;
                panel.style.paddingBottom = `${base + hidden / z}px`;
                panel.style.scrollPaddingBottom = `${hidden / z}px`;
            }
            revealInFrame(target.el);
            if (!errorWins) keepFieldInView();
        };
        const onViewport = () => {
            if (vv.scale !== 1) return; // a pinch-zoom is not a keyboard
            if (focusW) syncOrientation(); // rotated while focused, or the layout grew taller
            // No keyboard: the padding always goes; a layout that is still shrunk then gets its reveal
            if (!keyboardUp()) { errorHeld = false; raf(() => { clear(); if (layoutShrunk()) reveal(); }); return; }
            raf(() => reveal(errorHeld));
        };
        for (const f of list) {
            this.addEventListener(f, 'focus', () => {
                errorHeld = false; // focus moving to a field (it never fires on the one already focused) means the player is typing again
                syncOrientation();
                if (keyboardUp()) raf(() => reveal());
            });
            // The player typing again hands the win back to the field (caret scroll takes over)
            const release = () => { errorHeld = false; };
            this.addEventListener(f, 'input', release);
            this.addEventListener(f, 'keydown', release);
            this.addEventListener(f, 'blur', () => raf(() => { if (!focused()) { errorHeld = false; clear(); tallest.clear(); focusW = 0; } }));
        }
        this.addEventListener(vv, 'resize', onViewport);
        this._keyboardReveal = (errorWins) => { if (!dead && focused()) raf(() => reveal(errorWins === true)); };
        this._keyboardRevealState = () => ({ tallest: tallest.size, focusW, errorHeld }); // read by tests
        this._clearKeyboardReveal = () => { dead = true; errorHeld = false; clear(); tallest.clear(); focusW = 0; this._keyboardReveal = null; };
    }

    /**
     * The merged tile row's inner markup: the PC's own accounts and the captured sign-ins in one
     * row, then Other user (credential keyring plan 5.2). The keyboard markup is unchanged; a
     * remote tile adds data-username and, for a tagged account, its kind tags and short-window
     * badges (8.5). Rebuilt in place by setRemoteAccounts when the server answer arrives.
     */
    signInTilesInnerHtml() {
        const remote = !!this.signIn?.remote;
        const st = this.signInState;
        const tagHtml = (tile) => {
            const kinds = Array.isArray(tile.kinds) ? tile.kinds : [];
            if (!kinds.length) return '';
            const labels = tileTagLabels(kinds).map(l => `<span class="signin-tag">${escapeHtml(l)}</span>`).join('');
            const badges = tileBadgeGroups(kinds).map(g => `<img class="signin-badge" src="${badgeSrc(g)}" alt="" aria-hidden="true">`).join('');
            // The short window shows only the badge, so it carries the full kind names as its text
            return `<span class="signin-tags">${labels}</span><span class="signin-badges" role="img" aria-label="${escapeHtml(tileFullNames(kinds).join(', '))}">${badges}</span>`;
        };
        // A tile's title: its name, then the full kind names (plan 8.5), for hover and screen readers
        const tagged = (tile) => remote || (Array.isArray(tile.kinds) && tile.kinds.length > 0);
        const titleFor = (tile) => {
            const full = tagged(tile) && Array.isArray(tile.kinds) && tile.kinds.length ? `, ${tileFullNames(tile.kinds).join(', ')}` : '';
            return `${tile.displayName || tile.username}${full}`;
        };
        const tileHtml = (tile, i) => `
                <button type="button" class="signin-tile${remote ? ' signin-remote-tile' : (tagged(tile) ? ' signin-keyring-tile' : '')}" data-tile-index="${i}"${tagged(tile) ? ` data-username="${escapeHtml(tile.username)}"` : ''} title="${escapeHtml(titleFor(tile))}">
                    <span class="signin-portrait"></span>
                    <span class="signin-name">${escapeHtml(tile.displayName || tile.username)}</span>
                    <span class="signin-username">${escapeHtml(tile.username)}</span>${tagged(tile) ? tagHtml(tile) : ''}
                </button>`;
        return `${st.tiles.map(tileHtml).join('')}
                <button type="button" class="signin-tile signin-other" data-tile-index="other" title="Other user">
                    <span class="signin-portrait signin-portrait-initials">?</span>
                    <span class="signin-name">Other user</span>
                    <span class="signin-username"><span class="signin-hint-long">type a name</span><span class="signin-hint-short">type name</span></span>
                </button>`;
    }

    /**
     * A remote row that outgrows the monitor area (plan 5.2 Fit): its box is capped to the height
     * left and scrolls inside, with a "More below" cue; the rest of the screen stays in view.
     * Run after each rebuild of the row and on resize. No layout (jsdom) or a folded row: no cap.
     */
    fitSignInTiles() {
        if (!this.signIn?.remote) return;
        const tilesEl = this.gameContainer?.querySelector?.('#signin-tiles');
        const more = this.gameContainer?.querySelector?.('#signin-tiles-more');
        if (!tilesEl) return;
        tilesEl.style.maxHeight = '';
        tilesEl.classList.remove('signin-tiles-scroll');
        if (more) more.hidden = true;
        const area = tilesEl.closest('.pc-monitor-area');
        const rowH = tilesEl.offsetHeight;
        if (!area || !rowH) return;
        // scrollHeight clamps up to clientHeight, so it is the content height only when it overflows
        const over = area.scrollHeight - area.clientHeight;
        if (over <= 0) return;
        const CUE = 28, MIN_ROW = 96;
        let cap = Math.max(MIN_ROW, rowH - over - CUE);
        tilesEl.style.maxHeight = `${cap}px`;
        tilesEl.classList.add('signin-tiles-scroll');
        this.updateSignInTilesMore();
        // The scrollbar narrows the row and the cue takes a line: trim what still overflows
        for (let i = 0; i < 3; i++) {
            const left = area.scrollHeight - area.clientHeight;
            if (left <= 0 || cap <= MIN_ROW) break;
            cap = Math.max(MIN_ROW, cap - left);
            tilesEl.style.maxHeight = `${cap}px`;
            this.updateSignInTilesMore();
        }
    }

    /**
     * A short PC screen (a landscape phone) keeps a tile's username line, one ellipsised GNF 16px
     * line, only where the tile has 16px of height to spare: the tiles stretch to the tallest one
     * in their row ("Sam Okafor" and "Other user" take two name lines), so a tile with a one-line
     * name has a spare line and the row stays as tall as it was. A tile with none keeps the line
     * hidden (css: .signin-tile[data-username-fits]). The baseline is measured with every flag
     * removed (so the answer never depends on the last one), all reads come before any write, and
     * only resize and a rebuild of the row run it, never a watcher of the tiles' own size, so it
     * cannot chase its own output. Not short, or no layout (jsdom): no flags.
     */
    fitSignInUsernames({ again = false } = {}) {
        const root = this.gameContainer?.querySelector?.('#signin-tiles');
        if (!root) return;
        const tiles = Array.from(root.querySelectorAll('.signin-tile'));
        for (const t of tiles) delete t.dataset.usernameFits;
        const frame = this.pcMonitor?.root;
        // Short means a screen under 560px high, which is always drawn at x1 (the layout is
        // 560x350 per step), so rects and computed lengths are in the same pixels: no zoom here
        if (frame?.hasAttribute?.('data-short')) {
            const fits = tiles.map((t) => {
                const tr = t.getBoundingClientRect?.();
                if (!tr || !(tr.height > 0)) return false;
                // Spare is measured under the last thing in the tile's flow (the name, or a
                // keyring tag row after it), never under the name alone. Hidden children have no
                // rect and absolute ones (remote badges) are out of the flow.
                let bottom = -Infinity;
                for (const c of Array.from(t.children || [])) {
                    const cr = c.getBoundingClientRect?.();
                    if (!cr || !(cr.height > 0)) continue;
                    if (window.getComputedStyle(c).position === 'absolute') continue;
                    bottom = Math.max(bottom, cr.bottom);
                }
                if (bottom === -Infinity) return false;
                const cs = window.getComputedStyle(t);
                const below = (parseFloat(cs.borderBottomWidth) || 0) + (parseFloat(cs.paddingBottom) || 0);
                return tr.bottom - below - bottom >= SIGNIN_USERNAME_LINE;
            });
            tiles.forEach((t, i) => { if (fits[i]) t.dataset.usernameFits = ''; });
        }
        if (again && typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => {
                if (this.gameContainer?.isConnected) this.fitSignInUsernames();
            });
        }
    }

    /** Show the "More below" cue while the capped row has rows left to scroll to. */
    updateSignInTilesMore() {
        const tilesEl = this.gameContainer?.querySelector?.('#signin-tiles');
        const more = this.gameContainer?.querySelector?.('#signin-tiles-more');
        if (!tilesEl || !more) return;
        const scrolls = tilesEl.classList.contains('signin-tiles-scroll');
        more.hidden = !(scrolls && (tilesEl.scrollHeight - tilesEl.clientHeight - tilesEl.scrollTop) > 2);
    }

    /** Bind every tile in the row (the PC's own and the captured ones alike) to its portrait and click. */
    bindSignInTiles() {
        const st = this.signInState;
        this.gameContainer.querySelectorAll('.signin-tile[data-tile-index]').forEach(el => {
            const idx = el.dataset.tileIndex;
            if (idx !== 'other') {
                const tile = st.tiles[Number(idx)];
                if (tile) applyTilePortrait(el.querySelector('.signin-portrait'), tile, undefined,
                    tile.record !== undefined ? { record: tile.record } : undefined);
            }
            this.addEventListener(el, 'click', () => this.selectSignInTile(idx));
        });
    }

    /** Choose a tile (its index) or 'other' (type a username). */
    selectSignInTile(idx) {
        const st = this.signInState;
        if (idx === 'other') {
            st.selected = null;
            st.other = true;
            st.otherPicked = true;
            if (this.passwordField) this.passwordField.value = '';
            this.gameData.password = '';
        } else {
            const tile = st.tiles[Number(idx)];
            if (!tile) return;
            st.selected = tile.username;
            st.other = false;
            st.otherPicked = false;
            if (this.usernameField) this.usernameField.value = '';
            // A captured sign-in fills the password the server served; the server still checks it (4.4)
            const pw = tile.password || '';
            if (this.passwordField) this.passwordField.value = pw;
            this.gameData.password = pw;
        }
        this.setSignInMessage('');
        this.renderSignInForm();
    }

    /** Back to the tiles (the Change button, shown in a short window once an account is chosen). */
    clearSignInChoice() {
        const st = this.signInState;
        if (!st) return;
        const remote = !!this.signIn?.remote;
        if (!remote && this.signIn?.picker === false) return;
        // A remote screen with no row to go back to (typed, headless, locked) keeps its form
        if (remote && !this.signInTilesOffered()) return;
        st.selected = null;
        st.other = false;
        st.otherPicked = false;
        this.passwordField.value = '';
        this.gameData.password = '';
        this.setSignInMessage('');
        this.renderSignInForm();
        this.gameContainer.querySelector('.signin-tile')?.focus?.();
    }

    /** Whether a tile is the chosen one. */
    signInTileSelected(el) {
        const st = this.signInState;
        const idx = el.dataset.tileIndex;
        if (idx === undefined) return false;
        if (idx === 'other') return !!st.other && this.signInTilesOffered();
        return st.selected !== null && st.tiles[Number(idx)]?.username === st.selected;
    }

    /** A remote screen still waiting for GET /login_accounts and GET /capture_secrets. */
    signInLoading() {
        return !!this.signIn?.remote && !!this.signIn.capturedLoading;
    }

    /** Whether this screen offers any tiles: the keyboard picker, or a remote row with tiles. */
    signInTilesOffered() {
        // A remote screen offers its row when it has tiles to choose and is not a locked session
        // (its account is chosen already, the row is not drawn)
        if (this.signIn?.remote) return this.signIn.current?.locked !== true && this.signInState.tiles.length > 0;
        return this.signIn?.picker !== false;
    }

    /** The account tile for a username. */
    signInTileFor(username) {
        if (username === null || username === undefined) return null;
        return this.signInState.tiles.find(t => t.username === username) || null;
    }

    /** The host label a remote screen names in its lines (the server answer's host, 8.5). */
    signInHost() {
        return this.signIn?.host || this.signIn?.pcName || '';
    }

    /**
     * The merged remote tile row as display tiles (credential keyring plan 5.2): the PC's own
     * accounts over the network and the captured sign-ins in one list, matched by username, with
     * the name and headshot resolved from the NPC record the client already holds. Nothing new is
     * asked of the server.
     */
    remoteTiles() {
        const s = this.signIn;
        if (!s?.remote) return [];
        const merged = mergeRemoteTiles({
            picker: s.remotePicker, headless: s.headless, remoteScreen: s.remoteScreen,
            tiles: Array.isArray(s.tiles) ? s.tiles : [], captured: s.captured, keyring: s.keyring
        });
        return merged.map(t => {
            const record = npcRecordFor({ npcId: t.targetId || undefined, username: t.username });
            return {
                username: t.username,
                // The NPC record the client holds names the tile, as the captured strip did; else the
                // server tile's own display name, else the capture's label, else the username
                displayName: record?.displayName || t.displayName || t.username,
                portrait: t.portrait,
                avatar: t.avatar,
                kinds: t.kinds,
                password: t.capture?.password || t.keyPassword || null,
                credentials: t.credentials || [],
                found: t.found || [],
                targetId: t.targetId,
                label: t.capture?.label || null,
                record
            };
        });
    }

    /**
     * The remote screen's state line (credential keyring 5.2, 8.5): one phrasing per state, keyed
     * off the server answer's host, never "This PC". It takes the place of "Choose an account."
     * until a refusal replaces it, and comes back on Change.
     */
    remoteStateLine() {
        const s = this.signIn;
        if (!s?.remote) return SIGNIN_PROMPT;
        if (s.capturedLoading) return REMOTE_CHECKING_TEXT;
        if (s.stillChecking) return REMOTE_STILL_CHECKING_TEXT;
        const host = this.signInHost();
        // Two or more failed lists give the one combined line (8.1)
        const failed = [s.accountsFailed, s.capturedFailed, s.keyringFailed].filter(Boolean).length;
        if (failed >= 2) return remoteBothFailedLine(host);
        if (s.accountsFailed) return remoteAccountsFailedLine(host);
        if (s.capturedFailed) return REMOTE_CAPTURES_FAILED_TEXT;
        if (s.keyringFailed) return KEYRING_FAILED_TEXT;
        if (s.headless) return remoteHeadlessLine(host);
        if (s.remoteScreen === 'typed') return remoteTypedLine(host);
        return SIGNIN_PROMPT;
    }

    /**
     * The server answer (credential keyring plan 5.2, K0): GET /login_accounts (picker, headless,
     * remoteScreen, the PC's tiles) and GET /capture_secrets (the captured sign-ins) merged into
     * one row and laid out once. `pending`: the pair cap passed before both answered, so the Other
     * user form shows with "Still checking for accounts..."; each late answer redraws in place,
     * without moving focus or clearing typed text.
     */
    setRemoteAccounts(info = {}) {
        if (!this.signIn?.remote) return false;
        const s = this.signIn;
        // A redraw after the first paint (the cap, or an answer landing after it) keeps focus
        const late = s.capturedLoading === false || !!s.stillChecking;
        // The picker is known only from a successful /login_accounts answer (a failed or pending one
        // sends none), so captured sign-ins stay on screen until the server actually says `accounts`
        if ('picker' in info && info.picker !== undefined) s.remotePicker = info.picker === null ? 'accounts' : info.picker;
        if ('headless' in info) s.headless = !!info.headless;
        if ('remoteScreen' in info) s.remoteScreen = info.remoteScreen || null;
        if ('host' in info && info.host) s.host = info.host;
        if ('tiles' in info) s.tiles = Array.isArray(info.tiles) ? info.tiles : [];
        if ('captured' in info) s.captured = Array.isArray(info.captured) ? info.captured : [];
        if ('keyring' in info) s.keyring = Array.isArray(info.keyring) ? info.keyring : [];
        s.accountsFailed = !!info.accountsFailed;
        s.capturedFailed = !!info.capturedFailed;
        s.keyringFailed = !!info.keyringFailed;
        const pending = !!info.pending;
        s.stillChecking = pending;
        // Loading ends at the cap or when both answer: only then does the form show
        s.capturedLoading = false;
        // Rebuild the merged row
        this.signInState.tiles = this.remoteTiles();
        const tilesEl = this.gameContainer?.querySelector?.('#signin-tiles');
        if (tilesEl) {
            tilesEl.innerHTML = this.signInTilesInnerHtml();
            this.bindSignInTiles();
        }
        // The row decides the screen once (as the keyboard does): its tiles, or with none the typed
        // form. A player already typing (a field holds text) keeps it; focus alone is not typing,
        // so a late answer returns the row to view (the cap focused the empty form for them).
        // A locked session keeps its form: its account is chosen already.
        const st = this.signInState;
        // A locked session opened before the keyring answered typed its username (no tile yet).
        // Once the row holds that account, choose its tile, so the credential's Connect button
        // shows (K-lock R1 M1). A player who picked Other user themselves keeps the form.
        if (s.current?.locked === true && st.other && !st.otherPicked && st.presetUsername
            && st.tiles.some(t => t.username === st.presetUsername)) {
            st.selected = st.presetUsername;
            st.other = false;
            st.presetUsername = null;
            // The "Checking..." line from before the answer would stay under a chosen account
            if (this.signInMessageEl?.dataset.kind !== 'error') this.setSignInMessage('', 'info');
        }
        // Other user clicked by the player is a choice too (N1): only the cap's own form returns.
        const typing = !!st.other && (!!st.otherPicked
            || !!(this.usernameField?.value || this.passwordField?.value));
        const locked = s.current?.locked === true;
        // The chosen account may not be in the rebuilt row (N2): back to the row, nothing hidden kept.
        // Not while a sign-in is in flight: the outcome decides (see _submitSignInOnce).
        if (!this._signingIn) this.dropChosenIfGone();
        const connectTile = this.takeConnectRefusalTile(pending);
        if (st.selected === null && !typing && !locked) st.other = !this.signInTilesOffered();
        this.renderSignInForm({ quiet: late });
        if (connectTile !== undefined) this.showConnectRefusal(connectTile);
        return true;
    }

    /**
     * A refused Connect (keyring K3b, plan 8.2 step 8) opened this screen: once the account's tile
     * carries the credential (or every list has answered), choose that account and answer the tile
     * (or null, the typed form keeping the pre-filled name). Undefined until then, and after.
     */
    takeConnectRefusalTile(pending) {
        const s = this.signIn;
        const r = s?.connectRefusal;
        if (!r || s.connectRefusalShown) return undefined;
        const tile = s.preselect ? this.signInTileFor(s.preselect) : null;
        const ready = tile && Array.isArray(tile.credentials) && tile.credentials.some(c => c.id === r.credentialId);
        if (!ready && pending) return undefined;
        s.connectRefusalShown = true;
        if (!tile) return null;
        const st = this.signInState;
        st.selected = tile.username;
        st.other = false;
        st.otherPicked = false;
        if (this.usernameField) this.usernameField.value = '';
        // The password the keyring already shows on this tile fills the field, as the tile click does (R5a)
        const pw = tile.password || '';
        if (this.passwordField) this.passwordField.value = pw;
        this.gameData.password = pw;
        return tile;
    }

    /** The refusal Connect met, shown as this screen shows its own (8.1): greyed button, lockout, line. */
    showConnectRefusal(tile) {
        const r = this.signIn?.connectRefusal;
        if (!r) return;
        const host = this.signInHost();
        if (r.reason === 'locked_out') {
            this.signInLockedOut({ ok: false, reason: 'locked_out', message: r.message, attemptsLeft: r.attemptsLeft });
            return;
        }
        const cred = (tile?.credentials || []).find(c => c.id === r.credentialId) || null;
        if (r.reason === 'kind_refused' && cred) {
            cred.accepted = false;
            const box = this.gameContainer?.querySelector?.('#signin-ways');
            if (box) delete box.dataset.for;
            this.renderSignInWays(tile);
        }
        const line = credentialRefusalLine(r.reason, {
            host: cred?.host || host, label: cred?.label, displayName: tile?.displayName, kind: r.kind || cred?.kind
        });
        if (line) this.setSignInMessage(line, 'error');
    }

    /** The chosen tile is no longer in the row (N2): forget it and the typed values. True if dropped. */
    dropChosenIfGone() {
        const st = this.signInState;
        if (st.selected === null || this.signInTileFor(st.selected)) return false;
        st.selected = null;
        st.other = false;
        st.otherPicked = false;
        if (this.passwordField) this.passwordField.value = '';
        if (this.usernameField) this.usernameField.value = '';
        this.gameData.password = '';
        return true;
    }

    /** After a failed sign-in: if a late answer dropped the account meanwhile, show the row with no stale message. */
    settleDroppedAccount() {
        if (!this.dropChosenIfGone()) return false;
        this.signInState.other = !this.signInTilesOffered();
        this.setSignInMessage('');
        this.renderSignInForm({ quiet: true });
        return true;
    }

    renderSignInForm({ quiet = false } = {}) {
        // A second-step pane owns the screen: a late account answer must not redraw the password form over it
        if (this.signInPane && this.signInPane !== 'password') return;
        const st = this.signInState;
        const chosen = st.other || st.selected !== null;
        const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
        show(this.gameContainer.querySelector('#signin-form'), chosen);
        show(this.gameContainer.querySelector('#signin-username-row'), st.other);
        this.syncSignInCard();
        // In a short window the tile row folds away once an account is chosen, so the field,
        // Submit, the message line and the post-it fit together (UX slice 2a R3 m4); the
        // chosen account's line holds a Change button back to the tiles.
        const area = this.gameContainer.querySelector('.signin-mode');
        // On a remote screen the tile row folds at every size once an account (or Other user) is
        // chosen (credential keyring plan 5.2 Fit), so the merged slab, the form and the message
        // fit .pc-monitor-area; the keyboard screen keeps its "tiles offered" rule unchanged.
        // `signin-chosen` is the keyboard rule (also what shows Change); the remote fold is its own
        // class, so a remote screen with no row to go back to (typed, headless, locked) has no Change.
        area?.classList.toggle('signin-chosen', chosen && this.signInTilesOffered());
        area?.classList.toggle('signin-remote-folded', !!this.signIn?.remote && chosen);
        // A locked screen has its account already: on a narrow screen the tiles fold as in a
        // short window, so the card and its message fit in view (fix round 1, m4)
        area?.classList.toggle('signin-locked', this.signIn?.current?.locked === true);
        const selectedEl = this.gameContainer.querySelector('#signin-selected');
        const tile = st.other ? null : this.signInTileFor(st.selected);
        if (selectedEl) {
            // A tagged tile names its kinds in full, at the keyboard and remotely alike (D50)
            selectedEl.textContent = chosenAccountLine(tile);
            show(selectedEl, !!tile);
        }
        this.applySelectedHeadshot(tile);
        this.renderSignInWays(chosen ? tile : null);
        // One pass over every tile in the one row, so the chosen edge has one owner
        this.gameContainer.querySelectorAll('.signin-tile').forEach(el => {
            el.classList.toggle('selected', this.signInTileSelected(el));
        });
        // While a remote screen waits for both answers, it shows only the tile row once chosen is
        // decided; the row itself is hidden until the answer arrives (plan 5.2: no form, no focus)
        const tilesEl = this.gameContainer.querySelector('#signin-tiles');
        if (tilesEl && this.signIn?.remote) show(tilesEl, !this.signInLoading());
        // The message line: a refusal (st.message) over the base line. A remote screen's base is
        // its state line keyed off the host, and it shows under the Other user form too (the NLA,
        // headless and failed lines), until a concrete account is picked; the keyboard keeps its
        // own rule (the prompt only before an account or the typed form is chosen).
        const showBase = this.signIn?.remote ? (st.selected === null && !this._signingIn) : !chosen;
        if (showBase) {
            let base = this.signIn?.remote ? this.remoteStateLine() : this.keyboardStateLine();
            // "Choose an account." is for the row; under a chosen form it is blank, as at the keyboard
            if (this.signIn?.remote && chosen && base === SIGNIN_PROMPT) base = '';
            // A refusal (kind 'error') persists until Change; the base/state line is recomputed each
            // render and never kept, so it can change (Checking... -> the row's line) as answers land
            const keepRefusal = !!st.message && this.signInMessageEl?.dataset.kind === 'error';
            this.setSignInMessage(keepRefusal ? st.message : base, keepRefusal ? 'error' : 'info');
        }
        const focus = st.other && !this.usernameField.value ? this.usernameField : this.passwordField;
        // quiet: a late Captured sign-ins list redraws without moving focus or scrolling (2b0 R2 m1)
        if (!quiet && chosen && focus && typeof focus.focus === 'function') focus.focus();
        // Once an account is chosen, the form down to its message line (Submit, the attempts
        // left) scrolls into view in a short window (UX slice 2a R2 M2)
        if (!quiet && chosen) revealInFrame(this.signInMessageEl?.textContent ? this.signInMessageEl : this.submitBtn);
        this.fitSignInUsernames({ again: true });
        this.fitSignInTiles();
        this.fitSignInWays();
    }

    /** The keyboard screen's tiles: the PC's own, tagged from the keyring when it has entries (K3a). */
    keyboardTiles() {
        const s = this.signIn;
        const own = s.picker === false ? [] : (Array.isArray(s.tiles) ? s.tiles : []);
        if (!Array.isArray(s.keyring) || s.keyring.length === 0 || s.picker === false) return own;
        return mergeKeyboardTiles({ picker: s.picker, tiles: own, keyring: s.keyring })
            .map(t => ({ ...t, password: t.keyPassword || t.password || null }));
    }

    /** The keyboard screen's base line (K3a 8.1): the failed lines, else "Choose an account." */
    keyboardStateLine() {
        const s = this.signIn;
        if (s?.keyringFailed && s?.accountsFailed) return KEYBOARD_BOTH_FAILED_TEXT;
        if (s?.keyringFailed) return KEYRING_FAILED_TEXT;
        return SIGNIN_PROMPT;
    }

    /**
     * The keyboard screen's keyring answer (K3a 8.1): passwords only, merged into the PC's own
     * tiles. A late answer redraws the row in place, keeping the choice, focus and typed text.
     */
    setKeyringEntries({ keyring = [], keyringFailed = false, accountsFailed = false } = {}) {
        if (!this.signIn || this.signIn.remote) return false;
        const s = this.signIn;
        s.keyring = Array.isArray(keyring) ? keyring.filter(e => e?.kind === 'password') : [];
        s.keyringFailed = !!keyringFailed;
        s.accountsFailed = !!accountsFailed;
        this.signInState.tiles = this.keyboardTiles();
        const tilesEl = this.gameContainer?.querySelector?.('#signin-tiles');
        if (tilesEl) {
            tilesEl.innerHTML = this.signInTilesInnerHtml();
            this.bindSignInTiles();
        }
        if (!this._signingIn) this.dropChosenIfGone();
        this.renderSignInForm({ quiet: true });
        return true;
    }

    /**
     * The chosen line's ways in (K3a 8.1), at the top of the form in their own box: one button
     * per usable credential for this PC ("Connect with" kept whole, the label cut with an
     * ellipsis; the full kind name and teaching line in its title), a refused one greyed with
     * aria-disabled and its short reason under it, then the found-password lines ("Type the
     * password from" over the file name alone). Scenario text goes in by textContent only.
     */
    renderSignInWays(tile) {
        const box = this.gameContainer?.querySelector?.('#signin-ways');
        if (!box) return;
        const creds = Array.isArray(tile?.credentials) ? tile.credentials : [];
        const found = Array.isArray(tile?.found) ? tile.found : [];
        const key = tile ? JSON.stringify([tile.username, creds, found]) : '';
        if (box.dataset.for === key && !!key === !box.hidden) return;
        box.dataset.for = key;
        box.replaceChildren();
        if (!tile || (!creds.length && !found.length)) {
            box.hidden = true;
            const more = this.gameContainer.querySelector('#signin-ways-more');
            if (more) more.hidden = true;
            return;
        }
        const doc = box.ownerDocument;
        const inMonitor = !!this.pcMonitor;
        for (const cred of creds) {
            const way = doc.createElement('div');
            way.className = 'signin-cred-way';
            const b = doc.createElement('button');
            b.type = 'button';
            b.className = `signin-cred ${inMonitor ? 'pc-os-btn' : 'minigame-button'}${cred.kind === 'token' ? ' signin-cred-token' : ''}`;
            b.dataset.credId = cred.id;
            const fixed = doc.createElement('span');
            fixed.className = 'signin-cred-fixed';
            fixed.textContent = CONNECT_WITH_TEXT;
            const label = doc.createElement('span');
            label.className = 'signin-cred-label';
            label.textContent = cred.label;
            b.append(fixed, doc.createTextNode(' '), label);
            b.title = credentialButtonTitle(cred, { displayName: tile.displayName });
            b.setAttribute('aria-label', `${CONNECT_WITH_TEXT} ${cred.label}, ${tileFullNames([cred.kind])[0]}`);
            way.appendChild(b);
            // A refused kind, or (K5) an expired session token: greyed, with its short line
            if (!cred.accepted || cred.expired === true) {
                b.setAttribute('aria-disabled', 'true');
                const why = doc.createElement('div');
                why.className = `signin-cred-refused${cred.expired === true ? ' signin-cred-expired' : ''}`;
                why.textContent = cred.expired === true ? tokenExpiredMessage(cred.label)
                    : kindRefusedShort(cred.host || this.signInHost(), cred.kind);
                way.appendChild(why);
            }
            this.addEventListener(b, 'click', () => this.useCredential(cred, tile));
            box.appendChild(way);
        }
        for (const f of found) {
            const row = doc.createElement('div');
            row.className = 'signin-found';
            const lead = doc.createElement('div');
            lead.className = 'signin-found-lead';
            lead.textContent = FOUND_PASSWORD_LEAD_TEXT;
            const name = doc.createElement('div');
            name.className = 'signin-found-label';
            name.textContent = f.label;
            name.title = f.label;
            row.append(lead, name);
            box.appendChild(row);
        }
        box.hidden = false;
    }

    /**
     * When the chosen state is too tall (8.1), only the ways-in box scrolls, with the pixel
     * scrollbar and "More below"; its first button stays in view and the Password field, Sign in
     * and the message line keep their place. No layout (jsdom): no cap.
     */
    fitSignInWays() {
        const box = this.gameContainer?.querySelector?.('#signin-ways');
        const more = this.gameContainer?.querySelector?.('#signin-ways-more');
        if (!box) return;
        box.style.maxHeight = '';
        box.classList.remove('signin-ways-scroll');
        if (more) more.hidden = true;
        if (box.hidden) return;
        const area = box.closest('.pc-monitor-area');
        const h = box.offsetHeight;
        if (!area || !h) return;
        const over = area.scrollHeight - area.clientHeight;
        if (over <= 0) return;
        const first = box.firstElementChild;
        const MIN = Math.max(24, first ? first.offsetHeight : 24);
        const CUE = 18;
        let cap = Math.max(MIN, h - over - CUE);
        box.style.maxHeight = `${cap}px`;
        box.classList.add('signin-ways-scroll');
        this.updateSignInWaysMore();
        for (let i = 0; i < 3; i++) {
            const left = area.scrollHeight - area.clientHeight;
            if (left <= 0 || cap <= MIN) break;
            cap = Math.max(MIN, cap - left);
            box.style.maxHeight = `${cap}px`;
            this.updateSignInWaysMore();
        }
    }

    /** The ways-in box's "More below" cue, while it has more to scroll to. */
    updateSignInWaysMore() {
        const box = this.gameContainer?.querySelector?.('#signin-ways');
        const more = this.gameContainer?.querySelector?.('#signin-ways-more');
        if (!box || !more) return;
        const scrolls = box.classList.contains('signin-ways-scroll');
        more.hidden = !(scrolls && (box.scrollHeight - box.clientHeight - box.scrollTop) > 2);
    }

    /** The teaching toast for a kind, once per page, after a successful sign-in with it (8.1). */
    teachAfter(kind, session) {
        const kr = typeof window !== 'undefined' ? window.keyring : null;
        if (!kr?.teachOnce?.(kind)) return;
        const line = teachLine(kind, { displayName: session?.displayName || session?.username });
        if (!line) return;
        try { window.gameAlert?.(line, 'info', '', 8000, { plainText: true, whole: true }); } catch (e) { /* no notification layer */ }
    }

    /**
     * Sign in with a keyring credential (K3a 8.1). A greyed (refused) one signs nothing in and
     * puts the full reason in the message line. A server refusal shows 8.5's line; a policy
     * refusal greys the button from then on.
     */
    async useCredential(cred, tile) {
        if (!this.gameState.isActive || this._signingIn) return;
        const host = cred.host || this.signInHost();
        if (cred.expired === true) {
            if (window.playUISound) window.playUISound('reject');
            this.setSignInMessage(tokenExpiredMessage(cred.label), 'error');
            return;
        }
        if (!cred.accepted) {
            if (window.playUISound) window.playUISound('reject');
            this.setSignInMessage(kindRefusedMessage(cred.kind, host), 'error');
            return;
        }
        const sessions = window.pcSessions;
        if (!sessions?.signInWithCredential) {
            this.setSignInMessage('Sign-in is not available.', 'error');
            return;
        }
        this.setSignInMessage('Signing in...');
        const foothold = this.signIn.remote?.footholdId || null;
        // K4: a screen reached from another desktop signs in by that desktop
        const from = !foothold ? (this.signIn.remote?.fromPcId || null) : null;
        this._signingIn = true;
        let result;
        try {
            result = await sessions.signInWithCredential(this.signIn.pcId, cred.id, foothold ? { foothold } : (from ? { from } : {}));
        } finally {
            this._signingIn = false;
        }
        if (result.ok) {
            this.teachAfter(cred.kind, result.session);
            this.signInAccepted(result.session);
            return;
        }
        if (result.reason === 'locked_out') {
            this.signInLockedOut(result);
            return;
        }
        if (result.error) {
            this.setSignInMessage(signInErrorMessage(result, this.signIn.remote ? { remote: true, host: this.signInHost() } : undefined), 'error');
            return;
        }
        if (result.reason === 'type_to_sign_in') {
            // The PC asks for a second step, or the password changed: a notice with its own line, not a refusal
            this.setSignInMessage(result.message || '', 'info');
            return;
        }
        if (window.playUISound) window.playUISound('reject');
        if (result.reason === 'kind_refused' || result.reason === 'expired') {
            // The PC's policy refused it, or (K5) the token ran out: grey the button now, with
            // its short reason under it
            if (result.reason === 'expired') cred.expired = true;
            else cred.accepted = false;
            const box = this.gameContainer?.querySelector?.('#signin-ways');
            if (box) delete box.dataset.for;
            this.renderSignInWays(tile);
        }
        const line = credentialRefusalLine(result.reason, {
            host, label: cred.label, displayName: tile?.displayName, kind: result.kind || cred.kind
        });
        this.setSignInMessage(line || signInRefusalMessage(result), 'error');
    }

    /**
     * The chosen account's headshot beside its name, in the monitor (R3 m1): once the tiles
     * fold away at x2 or in a short window, an NPC's identity still shows its face. The same
     * 32px box and fallback as the desktop's account bar; shown at every size, so the line
     * has one look. Hidden for Other user and with no tile chosen.
     */
    applySelectedHeadshot(tile) {
        const box = this.gameContainer?.querySelector?.('.signin-selected-headshot');
        if (!box) return;
        if (!tile) {
            box.hidden = true;
            box.style.backgroundImage = '';
            delete box.dataset.headshotFor;
            return;
        }
        if (box.dataset.headshotFor === tile.username && !box.hidden) return;
        box.dataset.headshotFor = tile.username;
        const record = tile.record !== undefined ? tile.record : npcRecordFor({ username: tile.username });
        // The authored headshot, else the pixel silhouette: never a crop of the talk image
        applyHeadshotBox(box, headshotSourceFor(tile, record), {
            onResult: (r) => {
                if (r) return;
                box.style.backgroundImage = `url("${SILHOUETTE_URL}")`;
                box.style.backgroundRepeat = 'no-repeat';
                box.style.backgroundSize = '32px 32px';
                box.style.backgroundPosition = '0px 0px';
                box.dataset.frame = 'silhouette';
                box.hidden = false;
            }
        });
    }

    /**
     * The sign-in card (in the monitor, UI PC 2 E06) is shown while it has something in it:
     * the form once an account is chosen, or a result message (a wrong password, a lockout).
     * The "Choose an account." prompt on the tiles is a plain line outside it, so the tiles
     * never sit above an empty frame (fix round 1, M1).
     */
    syncSignInCard() {
        const card = this.gameContainer?.querySelector?.('#signin-card');
        if (!card) return;
        const form = this.gameContainer.querySelector('#signin-form');
        const formShown = (!!form && form.style.display !== 'none') || (!!this.signInPane && this.signInPane !== 'password');
        const text = this.signInMessageEl?.textContent || '';
        const promptOnly = !formShown && text === SIGNIN_PROMPT && this.signInMessageEl?.dataset.kind !== 'error';
        card.hidden = !formShown && (!text || promptOnly);
        const prompt = this.gameContainer.querySelector('#signin-prompt');
        if (prompt) {
            prompt.textContent = promptOnly ? text : '';
            prompt.hidden = !promptOnly;
        }
    }

    setSignInMessage(text, kind = 'info') {
        this.signInState.message = text;
        if (!this.signInMessageEl) return;
        // A remote line names a host: the label stays on one line (a no-wrap span; the text is unchanged)
        if (this.signIn?.remote) this.signInMessageEl.innerHTML = nowrapHostsHtml(text, escapeHtml);
        else this.signInMessageEl.textContent = text;
        this.signInMessageEl.dataset.kind = kind;
        this.syncSignInCard();
        // A result (a wrong password and the attempts left, a lockout) is always on screen,
        // even in a short window where the frame scrolls (UX slice 2a R2 M2)
        // The post-it holds the details the player is about to retype, so it comes into view
        // first and the line after it (both fit once the tile row has folded; R3 m4)
        if (text && kind !== 'info') {
            revealInFrame(this.gameContainer?.querySelector?.('.signin-mode.signin-chosen .postit-note'));
            revealInFrame(this.signInMessageEl);
            // With the keyboard still up (Enter keeps the field focused) the padding was sized for
            // Sign in: run the keyboard reveal again so it covers this line
            this._keyboardReveal?.(true);
        }
    }

    async _submitSignInOnce() {
        if (!this.gameState.isActive) return;
        const st = this.signInState;
        const username = st.other ? (this.usernameField?.value || '').trim() : st.selected;
        const password = this.passwordField?.value || '';
        if (!username) { this.setSignInMessage(st.other ? 'Enter a username.' : 'Choose an account.', 'error'); return; }
        if (!password) { this.setSignInMessage('Enter the password.', 'error'); return; }

        const sessions = window.pcSessions;
        if (!sessions?.signIn) {
            this.setSignInMessage('Sign-in is not available.', 'error');
            return;
        }
        this.setSignInMessage('Signing in...');
        const foothold = this.signIn.remote?.footholdId || null;
        // A late /login_accounts answer must not swap "Signing in..." for the state line
        this._signingIn = true;
        let result;
        try {
            const from = !foothold ? (this.signIn.remote?.fromPcId || null) : null;
            result = foothold
                ? await sessions.signIn(this.signIn.pcId, username, password, { foothold })
                : (from ? await sessions.signIn(this.signIn.pcId, username, password, { from })
                    : await sessions.signIn(this.signIn.pcId, username, password));
        } finally {
            this._signingIn = false;
        }
        if (result.ok) {
            // A typed sign-in to an account with a password found in a file teaches that kind (8.1)
            const chosen = st.other ? null : this.signInTileFor(username);
            if (chosen && Array.isArray(chosen.kinds) && chosen.kinds.includes('in_file')) this.teachAfter('in_file', result.session);
            else if (chosen && Array.isArray(chosen.kinds) && chosen.kinds.includes('cracked')) this.teachAfter('cracked', result.session);
            this.signInAccepted(result.session);
            return;
        }
        if (result.reason === 'mfa_required') {
            // The password was right and a second step is owed: no error line and no reject sound
            const chosen = st.other ? null : this.signInTileFor(username);
            this.params.mfaAccount = { username, displayName: chosen?.displayName || null };
            this.mfaClientRef()?.noteAccount?.(this.mfaSubject(), this.params.mfaAccount);
            // The lesson noted at the first step is taught once the second step passes
            if (chosen && Array.isArray(chosen.kinds) && chosen.kinds.includes('in_file')) this.params.mfaTeach = 'in_file';
            else if (chosen && Array.isArray(chosen.kinds) && chosen.kinds.includes('cracked')) this.params.mfaTeach = 'cracked';
            else delete this.params.mfaTeach;
            this.passwordField.value = '';
            this.gameData.password = '';
            if (!this.showSecondStep(result.mfa || {})) {
                this.setSignInMessage('This account needs a second step that this screen cannot show.', 'error');
            }
            return;
        }
        if (result.reason === 'locked_out') {
            this.signInLockedOut(result);
            return;
        }
        const remoteOpts = this.signIn.remote ? { remote: true, host: this.signInHost() } : undefined;
        if (result.error) {
            this.setSignInMessage(signInErrorMessage(result, remoteOpts), 'error');
            this.settleDroppedAccount();
            return;
        }
        if (window.playUISound) window.playUISound('reject');
        this.setSignInMessage(signInRefusalMessage(result, remoteOpts), 'error');
        this.passwordField.value = '';
        this.gameData.password = '';
        if (this.settleDroppedAccount()) return;
        this.passwordField.focus?.();
    }

    // ── Second step (S8a) ────────────────────────────────────────────────────
    // After a right password on a PC that asks for more, the screen swaps to a second pane in the
    // same monitor frame. showSecondStep picks the pane by the kind the server named; a new kind adds
    // a case there and a builder passed to mountSecondPane, and nothing else moves.

    mfaSubject() {
        return `pc:${this.signIn.pcId}`;
    }

    /** The way in this screen signs in by, in the form mfa-client notes it. */
    secondStepRoute() {
        const remote = this.signIn?.remote;
        if (remote?.footholdId) return `foothold:${remote.footholdId}`;
        if (remote?.fromPcId) return `from:${remote.fromPcId}`;
        return '';
    }

    mfaClientRef() {
        const c = typeof window !== 'undefined' ? window.mfaClient : null;
        return c && typeof c.verify === 'function' ? c : null;
    }

    /** The pane for a pending second step; false when this screen has none for its kind. */
    showSecondStep(pending, { fill = false } = {}) {
        if (!this.mfaClientRef()) return false;
        if (pending && pending.kind === 'code') return this.showCodePane(pending, { fill });
        if (pending && (pending.kind === 'push' || pending.kind === 'push_number_match')) return this.showPushPane(pending, { fill });
        return false;
    }

    /** Put a pane in the second-step slot and hide the password form and the tiles. */
    mountSecondPane(name, build) {
        const host = this.gameContainer?.querySelector?.('#signin-second');
        if (!host) return false;
        host.replaceChildren();
        build(host);
        host.hidden = false;
        host.dataset.pane = name;
        this.signInPane = name;
        this.gameContainer.querySelector('.signin-mode')?.classList.add('signin-second-step');
        this.setSignInMessage('');
        return true;
    }

    /** Back to the password pane, with an optional line (the second step ended, or the player stepped back). */
    showPasswordPane({ message = '', kind = 'error' } = {}) {
        const host = this.gameContainer?.querySelector?.('#signin-second');
        if (host) { host.replaceChildren(); host.hidden = true; delete host.dataset.pane; }
        this.signInPane = 'password';
        this.gameContainer?.querySelector?.('.signin-mode')?.classList.remove('signin-second-step');
        this.setSignInMessage('');
        this.renderSignInForm();
        if (message) this.setSignInMessage(message, kind);
    }

    /** The account's name for the pane: what was typed at the first step, else its tile, else a plain word. */
    secondStepAccountName(pending) {
        const own = this.params.mfaAccount;
        if (own && (own.displayName || own.username)) return own.displayName || own.username;
        if (pending?.accountName) return pending.accountName;
        const tile = pending?.npcId ? this.signInState.tiles.find(t => t.targetId === pending.npcId) : null;
        return tile ? (tile.displayName || tile.username) : 'this account';
    }

    /** The owner's held `phone_friendface` item (never the player's own phone), or null. */
    heldOwnerPhone(npcId) {
        const items = typeof window !== 'undefined' ? window.inventory?.items : null;
        if (!npcId || !Array.isArray(items)) return null;
        for (const it of items) {
            const d = it && it.scenarioData ? it.scenarioData : it;
            if (d && d.type === 'phone_friendface' && d.owner === npcId) {
                return { id: d.id ?? null, name: typeof d.name === 'string' && d.name ? d.name : 'phone' };
            }
        }
        return null;
    }

    /** An inventory item that is a code device of the pending account's owner, or null. */
    heldCodeDevice(npcId) {
        const items = typeof window !== 'undefined' ? window.inventory?.items : null;
        if (!npcId || !Array.isArray(items)) return null;
        for (const it of items) {
            const d = it && it.scenarioData ? it.scenarioData : it;
            if (d && d.type === 'code_device' && d.owner === npcId && d.id != null) {
                return { id: d.id, name: typeof d.name === 'string' && d.name ? d.name : 'code device' };
            }
        }
        return null;
    }

    showCodePane(pending, { fill = false } = {}) {
        const client = this.mfaClientRef();
        const device = this.heldCodeDevice(pending.npcId);
        const made = this.mountSecondPane('code', (host) => {
            const mk = (tag, cls, text) => {
                const n = document.createElement(tag);
                if (cls) n.className = cls;
                if (text != null) n.textContent = text;
                return n;
            };
            const inMonitor = !!this.pcMonitor;
            host.appendChild(mk('div', 'signin-second-title', `Second step for ${this.secondStepAccountName(pending)}`));
            host.appendChild(mk('div', 'signin-second-help', 'Enter the six-digit code from the code device.'));
            const row = mk('div', 'signin-field-row signin-code-row');
            const label = mk('label', null, 'Code:');
            label.htmlFor = 'signin-code';
            const field = mk('input', 'password-field signin-code-field');
            field.type = 'text';
            field.id = 'signin-code';
            field.inputMode = 'numeric';
            field.maxLength = 6;
            field.autocomplete = 'off';
            field.spellcheck = false;
            field.placeholder = '000000';
            field.setAttribute('aria-label', 'Six-digit code');
            row.append(label, field);
            host.appendChild(row);
            const actions = mk('div', 'signin-second-actions');
            const verify = mk('button', `submit-btn${inMonitor ? ' pc-os-btn' : ''}`, 'Verify');
            verify.type = 'button';
            verify.id = 'signin-verify';
            actions.appendChild(verify);
            if (device) {
                const use = mk('button', `signin-use-device${inMonitor ? ' pc-os-btn' : ''}`, `Use ${device.name}`);
                use.type = 'button';
                use.id = 'signin-use-device';
                actions.appendChild(use);
                this.addEventListener(use, 'click', () => this.useCodeDevice(device));
            }
            const back = mk('button', `signin-second-back${inMonitor ? ' pc-os-btn' : ''}`, 'Use a different account');
            back.type = 'button';
            back.id = 'signin-second-back';
            actions.appendChild(back);
            host.appendChild(actions);
            this.codeField = field;
            this.addEventListener(field, 'input', () => {
                const digits = field.value.replace(/\D/g, '').slice(0, 6);
                if (digits !== field.value) field.value = digits;
            });
            this.addEventListener(field, 'keydown', (event) => {
                if (!this.gameState.isActive) return;
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.closeByPlayer(); return; }
                if (event.key === 'Enter') { event.preventDefault(); this.submitCode(); }
            });
            this.addEventListener(verify, 'click', () => this.submitCode());
            this.addEventListener(back, 'click', () => {
                client.clear(this.mfaSubject());
                this.showPasswordPane();
            });
        });
        if (!made) return false;
        // A code read from this account's device is filled in, never sent for the player
        if (fill) {
            const code = client.codeFor(pending);
            if (code && this.codeField) this.codeField.value = code;
        }
        // The keyboard on a phone must not cover Verify and the message line
        if (this.codeField) this.bindKeyboardReveal([this.codeField]);
        this.codeField?.focus?.();
        return true;
    }

    /** Open the held code device over this screen; the screen comes back as a new instance on its second pane. */
    useCodeDevice(device) {
        if (!this.gameState.isActive || typeof window.startCodeDevice !== 'function') return;
        const client = this.mfaClientRef();
        const key = this.mfaSubject();
        const original = this.params.onComplete;
        // A child forced shut releases this screen once, as (false, { aborted, viaChild }): a quiet
        // close, with the completed-answer note cleared and nothing else (no toast, no sound, no event)
        const wrapped = (success, result) => {
            if (result && result.aborted === true && result.viaChild === true) {
                try { client?.takeCompleted?.(key); } catch (e) { /* nothing to clear */ }
            }
            if (typeof original === 'function') return original(success, result);
            return undefined;
        };
        wrapped._mfaOriginal = original;
        this.params.onComplete = wrapped;
        this.params.suspended = true;
        window.startCodeDevice({ itemId: device.id, returnTo: { sceneType: 'password', params: {} } });
        // The child did not start: this screen is still the running one, so give it back as it was
        if (window.MinigameFramework?.currentMinigame === this && !this._ending) {
            this.params.suspended = false;
            this.params.onComplete = original;
        }
    }

    // ── Second step, push pane (S8a unit 21) ─────────────────────────────────

    /** The push pane: the request sent to the owner's phone, the number if one is shown, the count, Send again. */
    showPushPane(pending, { fill = false } = {}) {
        const client = this.mfaClientRef();
        if (typeof client.prompt !== 'function') return false;
        const phone = this.heldOwnerPhone(pending.npcId);
        const owner = this.secondStepAccountName(pending);
        const made = this.mountSecondPane('push', (host) => {
            const mk = (tag, cls, text) => {
                const n = document.createElement(tag);
                if (cls) n.className = cls;
                if (text != null) n.textContent = text;
                return n;
            };
            const inMonitor = !!this.pcMonitor;
            host.appendChild(mk('div', 'signin-second-title', `Second step for ${owner}`));
            this.pushStatusEl = mk('div', 'signin-second-help signin-push-status', `A request was sent to ${owner}'s phone.`);
            this.pushStatusEl.setAttribute('role', 'status');
            host.appendChild(this.pushStatusEl);
            this.pushNumberEl = mk('div', 'signin-push-number');
            this.pushNumberEl.hidden = true;
            host.appendChild(this.pushNumberEl);
            // The phone replaces this screen while it is open, so the number must be remembered first
            this.pushNumberNoteEl = mk('div', 'signin-second-help signin-push-number-note', 'Note this number before you open the phone.');
            this.pushNumberNoteEl.hidden = true;
            host.appendChild(this.pushNumberNoteEl);
            this.pushCountEl = mk('div', 'signin-second-help signin-push-count');
            host.appendChild(this.pushCountEl);
            const actions = mk('div', 'signin-second-actions');
            const again = mk('button', `submit-btn${inMonitor ? ' pc-os-btn' : ''}`, 'Send again');
            again.type = 'button';
            again.id = 'signin-send-again';
            actions.appendChild(again);
            if (phone) {
                const check = mk('button', `signin-use-device${inMonitor ? ' pc-os-btn' : ''}`, `Check ${owner}'s phone`);
                check.type = 'button';
                check.id = 'signin-check-phone';
                actions.appendChild(check);
                this.addEventListener(check, 'click', () => this.useLivePhone(pending.npcId));
            }
            const back = mk('button', `signin-second-back${inMonitor ? ' pc-os-btn' : ''}`, 'Use a different account');
            back.type = 'button';
            back.id = 'signin-second-back';
            actions.appendChild(back);
            host.appendChild(actions);
            this.pushAgainBtn = again;
            this.addEventListener(again, 'click', () => this.sendPush());
            this.addEventListener(back, 'click', () => {
                this.clearPushTimer();
                client.clear(this.mfaSubject());
                this.showPasswordPane();
            });
        });
        if (!made) return false;
        this.pushCountEl?.setAttribute('aria-live', 'polite');
        // Focus lands on the first thing to do, so it does not fall to the page
        (this.gameContainer.querySelector('#signin-check-phone') || this.gameContainer.querySelector('#signin-second-back'))?.focus?.();
        this.refreshPushPane(pending);
        // The first request goes out when the pane opens; a pane coming back to a request already sent does not send another
        if (!(Number.isFinite(pending.n) && pending.n >= 1)) this.sendPush();
        return true;
    }

    /** The number line and the count, from what the client holds now. */
    refreshPushPane(pending = null) {
        const client = this.mfaClientRef();
        const now = (client && client.pendingFor(this.mfaSubject())) || pending || {};
        if (this.pushNumberEl) {
            if (now.number != null && now.number !== '') {
                this.pushNumberEl.textContent = `Number: ${now.number}`;
                this.pushNumberEl.hidden = false;
                if (this.pushNumberNoteEl) this.pushNumberNoteEl.hidden = !this.heldOwnerPhone(now.npcId || pending?.npcId);
            } else {
                if (this.pushNumberNoteEl) this.pushNumberNoteEl.hidden = true;
                this.pushNumberEl.textContent = '';
                this.pushNumberEl.hidden = true;
            }
        }
        if (this.pushCountEl) {
            const n = Number.isFinite(now.n) ? now.n : 0;
            this.pushCountEl.textContent = `Requests sent: ${n}`;
        }
    }

    clearPushTimer() {
        if (this._pushTimer) { clearTimeout(this._pushTimer); this._pushTimer = null; }
        this._pushWaitUntil = 0;
    }

    /** Disable Send again for `seconds`, then enable it. */
    holdSendAgain(seconds) {
        this.clearPushTimer();
        const secs = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
        if (!this.pushAgainBtn) return;
        if (secs <= 0) { this.pushAgainBtn.disabled = false; return; }
        // A disabled button drops focus to the page: hand it to the back button first
        if (document.activeElement === this.pushAgainBtn) this.gameContainer?.querySelector?.('#signin-second-back')?.focus?.();
        this.pushAgainBtn.disabled = true;
        this._pushTimer = setTimeout(() => {
            this._pushTimer = null;
            if (this.pushAgainBtn) this.pushAgainBtn.disabled = false;
        }, Math.ceil(secs * 1000));
    }

    /** Send (or send again) the request to the owner's phone. */
    async sendPush() {
        if (!this.gameState.isActive || this._signingIn) return;
        const client = this.mfaClientRef();
        if (!client) return;
        this._signingIn = true;
        if (this.pushAgainBtn) {
            if (document.activeElement === this.pushAgainBtn) this.gameContainer?.querySelector?.('#signin-second-back')?.focus?.();
            this.pushAgainBtn.disabled = true;
        }
        let result;
        try {
            result = await client.prompt(this.mfaSubject());
        } finally {
            this._signingIn = false;
        }
        if (!this.gameState.isActive) return;
        // An approval that landed after the player stepped back still signed the PC in (the client has
        // recorded the session), so the screen follows it whatever pane it is on
        if (result.ok && result.passed) {
            const body = result.body || {};
            const held = window.pcSessions?.get?.(this.signIn.pcId);
            const session = held && held.npcId === body.npcId ? held : { username: body.username, displayName: body.displayName };
            if (this.params.mfaTeach) this.teachAfter(this.params.mfaTeach, session);
            this.signInAccepted(session);
            return;
        }
        if (this.signInPane !== 'push') return;
        if (result.ok && result.waiting) {
            this.refreshPushPane();
            this.holdSendAgain(2);
            this.setSignInMessage('');
            return;
        }
        switch (result.reason) {
            case 'too_soon':
                this.holdSendAgain(result.retryAfterS);
                this.setSignInMessage('Wait a moment before sending another request.', 'error');
                return;
            case 'cancelled':
                this.showPasswordPane({ message: 'Request cancelled.' });
                return;
            case 'expired':
                this.showPasswordPane({ message: 'That sign-in timed out. Sign in again.' });
                return;
            case 'locked_out':
                this.signInLockedOut({ ok: false, reason: 'locked_out', message: result.message });
                return;
            case 'gone':
                this.secondStepGone(result);
                return;
            default:
                if (this.pushAgainBtn) this.pushAgainBtn.disabled = false;
                this.setSignInMessage(result.reason === 'error'
                    ? signInErrorMessage({ status: result.status, serverReason: (result.body && result.body.reason) || null })
                    : 'That did not work. Try again.', 'error');
        }
    }

    /** Open the owner's held phone over this screen, as the code device is opened. */
    useLivePhone(npcId) {
        if (!this.gameState.isActive || typeof window.startAuthenticatorLive !== 'function') return;
        const client = this.mfaClientRef();
        const key = this.mfaSubject();
        const original = this.params.onComplete;
        const wrapped = (success, result) => {
            if (result && result.aborted === true && result.viaChild === true) {
                try { client?.takeCompleted?.(key); } catch (e) { /* nothing to clear */ }
            }
            if (typeof original === 'function') return original(success, result);
            return undefined;
        };
        wrapped._mfaOriginal = original;
        this.params.onComplete = wrapped;
        this.params.suspended = true;
        this.params.mfaPhoneOpened = true;
        delete this.params.mfaPhoneDenied;
        delete this.params.mfaPhoneLocked;
        // The phone's own result tells this screen, on its return, whether the request was refused
        const parentParams = this.params;
        window.startAuthenticatorLive({
            npcId,
            returnTo: { sceneType: 'password', params: {} },
            onComplete: (success, result) => {
                if (result && Number(result.denied) > 0) parentParams.mfaPhoneDenied = true;
                if (result && result.ended === 'locked_out') parentParams.mfaPhoneLocked = true;
            }
        });
        if (window.MinigameFramework?.currentMinigame === this && !this._ending) {
            this.params.suspended = false;
            this.params.onComplete = original;
            delete this.params.mfaPhoneOpened;
        }
    }

    /** A new instance asks MfaClient first: a completed second step, a pending one, else the password pane. */
    resumeSecondStep() {
        const client = this.mfaClientRef();
        if (!client || !this.signIn?.pcId) return false;
        const key = this.mfaSubject();
        // R3-9: a completed step begun over another way in is left for the screen with that way in
        const waiting = typeof client.peekCompleted === 'function' ? client.peekCompleted(key) : null;
        const done = waiting && (waiting.route || '') !== this.secondStepRoute() ? null : (typeof client.takeCompleted === 'function' ? client.takeCompleted(key) : null);
        if (done) {
            const held = window.pcSessions?.get?.(this.signIn.pcId);
            const session = held && held.npcId === done.npcId ? held : { username: done.username, displayName: done.displayName };
            if (this.params.mfaTeach) this.teachAfter(this.params.mfaTeach, session);
            this.signInAccepted(session);
            return true;
        }
        const pending = client.pendingFor(key);
        if (!pending) {
            // Back from the owner's phone with the request gone: it was refused, or it ran out
            if (this.params.mfaPhoneOpened) {
                const denied = this.params.mfaPhoneDenied === true;
                const locked = this.params.mfaPhoneLocked === true;
                delete this.params.mfaPhoneOpened;
                delete this.params.mfaPhoneDenied;
                delete this.params.mfaPhoneLocked;
                if (locked) { this.signInLockedOut({ ok: false, reason: 'locked_out', message: 'This account is locked on this PC' }); return true; }
                this.showPasswordPane({ message: denied ? 'Request cancelled.' : 'That sign-in timed out. Sign in again.' });
                return true;
            }
            return false;
        }
        // A step begun by another way in (a foothold, a source PC, or the keyboard) is not this screen's
        if ((pending.route || '') !== this.secondStepRoute()) { delete this.params.mfaPhoneOpened; return false; }
        delete this.params.mfaPhoneOpened;
        return this.showSecondStep(pending, { fill: true });
    }

    async submitCode() {
        if (!this.gameState.isActive || this._signingIn) return;
        const client = this.mfaClientRef();
        const code = (this.codeField?.value || '').trim();
        if (!client) { this.setSignInMessage('Sign-in is not available.', 'error'); return; }
        if (!/^\d{6}$/.test(code)) { this.setSignInMessage('Enter the six-digit code.', 'error'); return; }
        this.setSignInMessage('Checking...');
        this._signingIn = true;
        let result;
        try {
            result = await client.verify(this.mfaSubject(), code);
        } finally {
            this._signingIn = false;
        }
        if (!this.gameState.isActive) return;
        if (result.ok && result.passed) {
            const body = result.body || {};
            const held = window.pcSessions?.get?.(this.signIn.pcId);
            const session = held && held.npcId === body.npcId ? held : { username: body.username, displayName: body.displayName };
            // The lesson noted at the first step is taught now, once the second step has passed
            if (this.params.mfaTeach) this.teachAfter(this.params.mfaTeach, session);
            this.signInAccepted(session);
            return;
        }
        const refuse = () => { if (window.playUISound) window.playUISound('reject'); };
        switch (result.reason) {
            case 'wrong':
                refuse();
                this.setSignInMessage(signInRefusalMessage({
                    reason: 'wrong', message: 'Incorrect code', attemptsLeft: result.attemptsLeft
                }), 'error');
                break;
            case 'stale':
                refuse();
                this.setSignInMessage(result.stale === 'used'
                    ? 'That code has been used. Wait for the next one.'
                    : 'That code has expired.', 'error');
                break;
            case 'locked': {
                const wait = Number.isFinite(result.retryIn) && result.retryIn > 0
                    ? ` Try again in ${result.retryIn >= 90 ? `${Math.ceil(result.retryIn / 60)} minutes` : `${Math.ceil(result.retryIn)} seconds`}.`
                    : ' Try again later.';
                this.signInLockedOut({ ok: false, reason: 'locked_out' }, { line: `Too many wrong codes.${wait}` });
                return;
            }
            case 'locked_out':
                this.signInLockedOut({ ok: false, reason: 'locked_out', message: result.message });
                return;
            case 'gone':
                refuse();
                this.secondStepGone(result);
                return;
            case 'expired':
            case 'cancelled':
                // The second step has ended on the server: the password pane, to start again
                refuse();
                this.showPasswordPane({ message: result.reason === 'cancelled'
                    ? 'That sign-in was cancelled. Sign in again.'
                    : (result.body && result.body.mfaIncorrect === true
                        ? 'Too many wrong codes. Sign in again.'
                        : 'That sign-in timed out. Sign in again.') });
                return;
            default:
                if (result.reason === 'error') {
                    this.setSignInMessage(signInErrorMessage({ status: result.status, serverReason: (result.body && result.body.reason) || null }), 'error');
                } else {
                    refuse();
                    this.setSignInMessage('That did not work. Try again.', 'error');
                }
        }
        if (this.codeField) { this.codeField.value = ''; this.codeField.focus?.(); }
    }

    /** The server has no second step to go on with (a bare refusal): back to the password pane. */
    secondStepGone(result) {
        const said = result && typeof result.message === 'string' ? result.message : '';
        const generic = !said || said.replace(/\.$/, '') === 'Incorrect username or password';
        this.showPasswordPane({ message: generic ? 'That sign-in timed out. Sign in again.' : said });
    }

    signInAccepted(session) {
        this.cleanup();
        if (window.playUISound) window.playUISound('confirm');
        this.setSignInMessage(`Signed in as ${session?.displayName || session?.username}.`, 'success');
        this.gameResult = { success: true, signIn: session };
        this.showSuccess(escapeHtml(`Signed in as ${session?.displayName || session?.username}`), true, 800);
    }

    /**
     * A lockout: the server's message once, on the screen's own message line (no toast and
     * no failure box over it, which showed the same words three times and covered the PC
     * title) and the form disabled. The screen stays open until the player closes it, so the
     * reason (and any wait it names) can be read at any pace; it closed itself after 2.5 s
     * (code review R1 m2). The X and Esc close it (there is no Cancel button).
     */
    signInLockedOut(result, { line = null } = {}) {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        const message = line || signInRefusalMessage(result, this.signIn?.remote ? { remote: true, host: this.signInHost() } : undefined);
        this.setSignInMessage(message, 'error');
        this.gameResult = { success: false, reason: 'locked_out' };
        this.gameContainer?.querySelectorAll('.signin-mode input, .signin-mode button').forEach(el => { el.disabled = true; });
        // cleanup() took every listener, the closes too: put the player's closes back
        const closeByPlayer = (e) => { e?.preventDefault?.(); e?.stopPropagation?.(); this.closeByPlayer(); };
        const cross = document.getElementById('minigame-close');
        if (cross && this.params.disableClose !== true) {
            this.addEventListener(cross, 'click', closeByPlayer);
            cross.focus?.();
        }
        if (this.params.disableClose !== true) {
            this._fallbackCloseHandler = (e) => { if (e.key === 'Escape') this.closeByPlayer(); };
            document.addEventListener('keydown', this._fallbackCloseHandler);
        }
        this.addLockedBackButton();
    }

    /**
     * The way back from a locked-account screen, as the second-step panes have: "Use a different account" returns to the
     * account choice. Only where the screen has a choice to go back to (clearSignInChoice's own guards).
     */
    addLockedBackButton() {
        const mode = this.gameContainer?.querySelector?.('.signin-mode');
        const remote = !!this.signIn?.remote;
        if (!mode || !this.signInState || (!remote && this.signIn?.picker === false) || (remote && !this.signInTilesOffered())) return;
        // a second-step pane's own back button was disabled with the rest of the form: the new one replaces it
        this.gameContainer.querySelector('#signin-second-back')?.remove();
        const inMonitor = !!this.pcMonitor;
        const back = document.createElement('button');
        back.type = 'button';
        back.id = 'signin-locked-back';
        back.className = `signin-second-back${inMonitor ? ' pc-os-btn' : ''}`;
        back.textContent = 'Use a different account';
        mode.appendChild(back);
        this.addEventListener(back, 'click', () => {
            // cleanup() took every listener of the screen, so build it again (the way a fresh open does) with no account chosen
            const st = this.signInState;
            st.selected = null;
            st.other = false;
            st.otherPicked = false;
            this.gameData.password = '';
            this.gameResult = null;
            this.signInPane = 'password';
            this.initSignIn();
            this.gameContainer.querySelector('.signin-tile')?.focus?.();
        });
    }
}
