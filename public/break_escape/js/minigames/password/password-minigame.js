import { MinigameScene } from '../framework/base-minigame.js';
import { ASSETS_PATH } from '../../config.js';
import { makeDraggable } from '../../utils/helpers.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { escapeHtml } from '../../utils/escape-html.js';
import { escapeHtmlKeepWords } from '../../utils/escape-html.js';
import { LOCK_SCOPE_REFUSAL_TEXT, lockScopeRefusal } from '../../utils/lock-scope-refusal.js';
import { isComputerType } from '../../utils/computer-keywords.js';
import { mountPcMonitor, cssZoomOf, pcPostitButtonHtml } from '../../utils/pc-monitor.js';
import { headshotCandidates, headshotKeys, noteMissingHeadshot, npcRecordFor, headshotSourceFor, applyHeadshotBox,
    SHORT_PORTRAIT_PX, TILE_PORTRAIT_PX, isTalkSheetSize, portraitCropOverride, headCropOffset, frameAlphaReader } from '../../utils/npc-headshot.js';
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
 * Draw a tile's picture into `el` as person-chat would: the portrait, else the avatar,
 * else the display name's initials. Every picture is at a whole scale (R4 m1 and n3):
 * - a talk sheet: a 64x64 head crop of its top-left frame (closed mouth) at scale 1, and
 *   a 32x32 crop for the short window (setShortPortrait);
 * - a 64x64 image at scale 1, with a 32x32 head crop of it for the short window;
 * - a 32x32 headshot at scale 2, and at scale 1 in the short window;
 * - any other size is skipped (the next source, else initials in the pixel font), since
 *   fitting it to the box would scale it down.
 * `ImageCtor` and `readAlpha` are injectable for tests.
 */
export function applyTilePortrait(el, tile, ImageCtor = (typeof Image !== 'undefined' ? Image : null), readAlpha = frameAlphaReader,
                                  { record = undefined, onMissing = noteMissingHeadshot } = {}) {
    // The character's own 32x32 headshot comes first (UX slice 2c): the talk sheet is cropped
    // only when no headshot file exists, and that key is logged once
    const rec = record === undefined ? npcRecordFor({ username: tile?.username }) : record;
    const headSource = headshotSourceFor(tile || {}, rec);
    const heads = headshotCandidates(headSource);
    const headKeys = headshotKeys(headSource);
    const sources = [...heads, ...[tile?.portrait, tile?.avatar].map(portraitUrl).filter(Boolean)]
        .filter((v, i, a) => a.indexOf(v) === i);
    let missingNoted = heads.length === 0;
    const noteMissing = (i) => {
        if (missingNoted || i < heads.length) return;
        missingNoted = true;
        // Every key tried, the world sprite's first (R1 m8)
        el.dataset.headshotMissing = headKeys.join(' ');
        onMissing?.(headKeys);
    };
    const initials = () => {
        el.style.backgroundImage = '';
        el.dataset.frame = 'initials';
        el.classList.add('signin-portrait-initials');
        el.textContent = tileInitials(tile?.displayName || tile?.username);
    };
    const tryAt = (i) => {
        noteMissing(i);
        if (i >= sources.length || !ImageCtor) { initials(); return; }
        const src = sources[i];
        const img = new ImageCtor();
        img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            const crop = (frameSize, box) => {
                const alpha = readAlpha ? readAlpha(img, frameSize) : null;
                return alpha ? headCropOffset(alpha, frameSize, box) : { left: frameSize / 2 - box / 2, top: 0 };
            };
            if (isTalkSheetSize(w, h)) {
                const frameSize = w / 2;
                const override = portraitCropOverride(src);
                setTilePortrait(el, { src, width: w, height: h, kind: 'talk-sheet',
                                      offset: override?.tile || crop(frameSize, TILE_PORTRAIT_PX) });
                setShortPortrait(el, { src, width: w, height: h, kind: 'head-crop',
                                       offset: override?.short || crop(frameSize, SHORT_PORTRAIT_PX) });
            } else if (w === TILE_PORTRAIT_PX && h === TILE_PORTRAIT_PX) {
                setTilePortrait(el, { src, width: w, height: h, kind: 'single' });
                setShortPortrait(el, { src, width: w, height: h, kind: 'head-crop', offset: crop(w, SHORT_PORTRAIT_PX) });
            } else if (w === SHORT_PORTRAIT_PX && h === SHORT_PORTRAIT_PX) {
                setTilePortrait(el, { src, width: w, height: h, kind: 'single', scale: TILE_PORTRAIT_PX / SHORT_PORTRAIT_PX });
                setShortPortrait(el, { src, width: w, height: h, kind: 'avatar' });
            } else {
                tryAt(i + 1);
                return;
            }
            el.textContent = '';
            el.classList.remove('signin-portrait-initials');
            el.dataset.src = src;
            if (i < heads.length) { el.dataset.headshot = headKeys[i]; return; }
            preferAvatar(src);
        };
        img.onerror = () => tryAt(i + 1);
        img.src = src;
    };
    // The avatar, when it is a 32x32 headshot, is the short window's picture
    const avatar = portraitUrl(tile?.avatar);
    const preferAvatar = (shown) => {
        if (!avatar || avatar === shown || !ImageCtor) return;
        const a = new ImageCtor();
        a.onload = () => {
            const w = a.naturalWidth || a.width;
            const h = a.naturalHeight || a.height;
            if (w === SHORT_PORTRAIT_PX && h === SHORT_PORTRAIT_PX) {
                setShortPortrait(el, { src: avatar, width: w, height: h, kind: 'avatar' });
            }
        };
        a.onerror = () => {};
        a.src = avatar;
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

/** The line under the form after a refused sign-in: the server's message and attemptsLeft. */
export function signInRefusalMessage(result) {
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
export function signInErrorMessage(result) {
    if (result?.serverReason === 'off') return 'This PC is off.';
    if (result?.serverReason === 'not_responding') return 'This PC is not responding.';
    if (result?.status === 403 || result?.status === 404) return "This PC can't be reached.";
    return 'Network error. Please try again.';
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
            capsLock: false,
            keyboardVisible: false
        };
        
        // Store the correct password for validation
        this.correctPassword = params.password || '';

        // Wi-Fi join mode (slice 9.3b sub-slice W, 5.3): { apId, apName }. The key field has
        // no attempt limit; submit calls ApiClient.networkJoin through networkLinks.join.
        this.join = params.join || null;

        // Sign-in mode: { pcId, pcName, picker, tiles, current } (unlock-system openLoginSignIn);
        // a remote screen (slice 9.3a, 4.4) adds remote: { footholdId, linkName } and captured
        this.signIn = params.signIn || null;
        if (this.signIn) {
            const picker = this.signIn.picker;
            const tiles = picker === false ? [] : (Array.isArray(this.signIn.tiles) ? this.signIn.tiles : []);
            this.signInState = {
                tiles,
                // null: no account chosen yet; '' with other: true: typing a username
                selected: null,
                other: picker === false,
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
                    tiles: st.tiles.map(t => ({ username: t.username, displayName: t.displayName })),
                    selected: st.selected,
                    otherUser: st.other,
                    current: this.signIn.current ? { username: this.signIn.current.username, displayName: this.signIn.current.displayName } : null,
                    message: st.message || null,
                    // A remote screen: its foothold and the captured sign-ins offered (no passwords)
                    ...(this.signIn.remote ? {
                        remote: { footholdId: this.signIn.remote.footholdId ?? null },
                        captured: (this.signIn.captured || []).map(c => ({ targetId: c.targetId, label: c.label, username: c.username, fillsPassword: !!c.password })),
                        capturedLoading: !!this.signIn.capturedLoading
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
        if (this.gameData.showPostit && this.gameData.postitNote) {
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
            if (text) this.showFailure(text, closeAfterMs > 0, closeAfterMs > 0 ? closeAfterMs : 1500);
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
                                    <strong>Hint:</strong> ${escapeHtml(displayDashes(this.gameData.passwordHint))}
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

        const enteredPassword = this.passwordField.value.trim();
        console.log('Entered password:', enteredPassword);

        if (!enteredPassword) {
            this.showScreenMessage('Please enter a password');
            return;
        }
        this.showScreenMessage('');

        this.gameData.attempts++;
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

            // Call server API for validation (use ApiClient with correct casing)
            const apiClient = window.ApiClient || window.APIClient;
            const response = await apiClient.unlock(targetType, targetId, enteredPassword, 'password');

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
                if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.gameData.attempts;
                this.cleanup();
                this.showScreenMessage(LOCK_SCOPE_REFUSAL_TEXT[refusal], { closeAfterMs: 2000 });
                this.gameResult = { success: false, reason: 'cancelled', cancelled: true, refused: refusal,
                                    attempts: this.gameData.attempts };
            } else if (error?.status === 422 || error?.message?.includes('422')) {
                this.passwordIncorrect({ caseMismatch: error?.body?.caseMismatch === true });
            } else {
                this.showScreenMessage('Network error. Please try again.');
                // Decrease attempts counter since this wasn't a real attempt
                this.gameData.attempts--;
                if (this.attemptsDisplay) this.attemptsDisplay.textContent = this.gameData.attempts;
            }
        }
    }
    
    passwordCorrect() {
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
        this.showScreenMessage(
            caseMismatch
                ? "Maximum attempts exceeded. Access denied. Passwords are case-sensitive."
                : "Maximum attempts exceeded. Access denied.",
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
                false
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
        // Call parent cleanup (handles event listeners)
        super.cleanup();
    }

    // ── Sign-in mode ─────────────────────────────────────────────────────────

    initSignIn() {
        const s = this.signIn;
        const st = this.signInState;
        this.headerElement.innerHTML = `<h3>${escapeHtml(displayDashes(`Sign in: ${s.pcName}`))}</h3>`;

        const tileHtml = (tile, i) => `
            <button type="button" class="signin-tile" data-tile-index="${i}" title="${escapeHtml(tile.displayName || tile.username)}">
                <span class="signin-portrait"></span>
                <span class="signin-name">${escapeHtml(tile.displayName || tile.username)}</span>
                <span class="signin-username">${escapeHtml(tile.username)}</span>
            </button>`;
        const tiles = s.picker === false ? '' : `
            <div class="signin-tiles" id="signin-tiles">
                ${st.tiles.map(tileHtml).join('')}
                <button type="button" class="signin-tile signin-other" data-tile-index="other" title="Other user">
                    <span class="signin-portrait signin-portrait-initials">?</span>
                    <span class="signin-name">Other user</span>
                    <span class="signin-username">type a name</span>
                </button>
            </div>`;
        const current = s.current
            ? `<div class="signin-current">Signed in now: ${escapeHtml(s.current.displayName || s.current.username)} (${escapeHtml(s.current.username)})</div>`
            : '';
        const remoteLine = s.remote
            ? `<div class="signin-remote">Remote sign-in${s.remote.linkName ? ` through ${escapeHtml(displayDashes(s.remote.linkName))}` : ''}</div>`
            : '';
        const capturedHtml = s.remote ? `
                        <div class="signin-captured" id="signin-captured">${this.capturedListHtml()}</div>` : '';

        const inMonitor = !!this.pcMonitor;
        this.gameContainer.innerHTML = `
            <div class="password-minigame-area signin-mode${inMonitor ? ' pc-screen-area' : ''}">
                <div class="${inMonitor ? 'pc-lock-screen' : 'monitor-bezel'}">
                    <div class="${inMonitor ? 'signin-screen' : 'monitor-screen signin-screen'}">
                        <div class="signin-title">${escapeHtml(displayDashes(s.pcName))}</div>
                        ${remoteLine}
                        ${current}
                        ${tiles}
                        <div class="signin-form" id="signin-form">
                            <div class="signin-selected-row">${inMonitor ? `
                                <span class="signin-selected-headshot" aria-hidden="true" hidden></span>` : ''}
                                <div class="signin-selected" id="signin-selected"></div>
                                <button type="button" class="signin-change${inMonitor ? ' pc-os-btn' : ''}" id="signin-change">Change</button>
                            </div>
                            <div class="signin-field-row" id="signin-username-row">
                                <label for="signin-username">Username:</label>
                                <input type="text" id="signin-username" class="password-field" placeholder="Username" maxlength="64" autocomplete="off" spellcheck="false">
                            </div>
                            <div class="signin-field-row" id="signin-password-row">
                                <label for="password-field">Password:</label>
                                <div class="password-field-wrapper">
                                    <input type="password" id="password-field" class="password-field" placeholder="Password" maxlength="64" autocomplete="off">
                                    <button type="button" class="toggle-password-btn${inMonitor ? ' pc-os-btn pc-os-icon-btn' : ''}" id="toggle-password">
                                        <img class="icon-small" src="/break_escape/assets/icons/hidden.png" alt="Toggle password visibility">
                                    </button>
                                </div>
                            </div>
                            <div class="hint-controls">
                                <button type="button" class="submit-btn${inMonitor ? ' pc-os-btn' : ''}" id="submit-password">Sign in</button>
                            </div>
                        </div>${capturedHtml}
                        <div class="signin-message" id="signin-message" aria-live="polite"></div>
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

        this.gameContainer.querySelectorAll('.signin-tile[data-tile-index]').forEach(el => {
            const idx = el.dataset.tileIndex;
            if (idx !== 'other') {
                applyTilePortrait(el.querySelector('.signin-portrait'), st.tiles[Number(idx)]);
            }
            this.addEventListener(el, 'click', () => this.selectSignInTile(idx));
        });
        this.bindCapturedSignIns();
        const change = this.gameContainer.querySelector('#signin-change');
        if (change) this.addEventListener(change, 'click', () => this.clearSignInChoice());

        if (this.gameData.showPostit && this.gameData.postitNote) {
            const postit = inMonitor ? null : this.gameContainer.querySelector('.postit-note');
            if (postit) makeDraggable(postit);
            const controls = this.ensureControlsRow();
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

        this.renderSignInForm();
    }

    /** Choose a tile (its index) or 'other' (type a username). */
    selectSignInTile(idx) {
        const st = this.signInState;
        if (idx === 'other') {
            st.selected = null;
            st.other = true;
        } else {
            const tile = st.tiles[Number(idx)];
            if (!tile) return;
            st.selected = tile.username;
            st.other = false;
        }
        this.passwordField.value = '';
        this.gameData.password = '';
        this.setSignInMessage('');
        this.renderSignInForm();
    }

    /** Back to the tiles (the Change button, shown in a short window once an account is chosen). */
    clearSignInChoice() {
        const st = this.signInState;
        if (!st || this.signIn?.picker === false) return;
        st.selected = null;
        st.other = false;
        this.passwordField.value = '';
        this.gameData.password = '';
        this.setSignInMessage('');
        this.renderSignInForm();
        this.gameContainer.querySelector('.signin-tile')?.focus?.();
    }

    renderSignInForm() {
        const st = this.signInState;
        const chosen = st.other || st.selected !== null;
        const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
        show(this.gameContainer.querySelector('#signin-form'), chosen);
        show(this.gameContainer.querySelector('#signin-username-row'), st.other);
        // In a short window the tile row folds away once an account is chosen, so the field,
        // Submit, the message line and the post-it fit together (UX slice 2a R3 m4); the
        // chosen account's line holds a Change button back to the tiles.
        const area = this.gameContainer.querySelector('.signin-mode');
        area?.classList.toggle('signin-chosen', chosen && this.signIn.picker !== false);
        const selectedEl = this.gameContainer.querySelector('#signin-selected');
        const tile = st.tiles.find(t => t.username === st.selected);
        if (selectedEl) {
            selectedEl.textContent = tile ? `${tile.displayName || tile.username} (${tile.username})` : '';
            show(selectedEl, !!tile);
        }
        this.applySelectedHeadshot(tile);
        this.gameContainer.querySelectorAll('.signin-tile').forEach(el => {
            const idx = el.dataset.tileIndex;
            const on = idx === 'other' ? (st.other && this.signIn.picker !== false) : (st.tiles[Number(idx)]?.username === st.selected && st.selected !== null);
            el.classList.toggle('selected', !!on);
        });
        if (!chosen) {
            this.setSignInMessage(st.message || 'Choose an account.');
        }
        const focus = st.other && !this.usernameField.value ? this.usernameField : this.passwordField;
        if (chosen && focus && typeof focus.focus === 'function') focus.focus();
        // Once an account is chosen, the form down to its message line (Submit, the attempts
        // left) scrolls into view in a short window (UX slice 2a R2 M2)
        if (chosen) revealInFrame(this.signInMessageEl?.textContent ? this.signInMessageEl : this.submitBtn);
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
        const record = npcRecordFor({ username: tile.username });
        const talk = typeof record?.spriteTalk === 'string' ? record.spriteTalk : '';
        const talkUrl = !talk ? null
            : (/^(\/|https?:|data:)/.test(talk) ? talk : `/break_escape/${talk.startsWith('assets/') ? '' : 'assets/'}${talk}`);
        applyHeadshotBox(box, headshotSourceFor(tile, record), { talkUrl });
    }

    /** The Captured sign-ins block's inner markup (a remote screen, 4.4). */
    capturedListHtml() {
        const s = this.signIn || {};
        const captured = Array.isArray(s.captured) ? s.captured : [];
        const body = captured.length
            ? captured.map((c, i) => `
                            <button type="button" class="signin-captured-item${this.pcMonitor ? ' pc-os-btn' : ''}" data-capture-index="${i}" data-target-id="${escapeHtml(c.targetId)}">${escapeHtml(c.label)} (${escapeHtml(c.username)})</button>`).join('')
            : (s.capturedLoading ? '<div class="signin-captured-empty">Checking...</div>' : '<div class="signin-captured-empty">None yet.</div>');
        return `
                            <div class="signin-captured-title">Captured sign-ins</div>${body}`;
    }

    bindCapturedSignIns() {
        this.gameContainer?.querySelectorAll('.signin-captured-item[data-capture-index]').forEach(el => {
            this.addEventListener(el, 'click', () => this.fillCapturedSignIn(Number(el.dataset.captureIndex)));
        });
    }

    /**
     * The Captured sign-ins arrive after the screen has opened (GET /capture_secrets), so
     * the view or desktop that opened it is replaced at once (review R1 minor 1).
     */
    setCapturedSignIns(list) {
        if (!this.signIn?.remote) return false;
        this.signIn.captured = Array.isArray(list) ? list : [];
        this.signIn.capturedLoading = false;
        const block = this.gameContainer?.querySelector('#signin-captured');
        if (!block) return false;
        block.innerHTML = this.capturedListHtml();
        this.bindCapturedSignIns();
        return true;
    }

    /**
     * Fill the form from a captured sign-in: the username always, the password only when
     * the server served it. The server's password check is the gate (4.4).
     */
    fillCapturedSignIn(index) {
        const c = (this.signIn?.captured || [])[index];
        if (!c || !this.gameState.isActive) return false;
        const st = this.signInState;
        st.other = true;
        st.selected = null;
        if (this.usernameField) this.usernameField.value = c.username;
        if (this.passwordField) this.passwordField.value = c.password || '';
        this.gameData.password = c.password || '';
        this.setSignInMessage('');
        this.renderSignInForm();
        this.passwordField?.focus?.();
        return true;
    }

    setSignInMessage(text, kind = 'info') {
        this.signInState.message = text;
        if (!this.signInMessageEl) return;
        this.signInMessageEl.textContent = text;
        this.signInMessageEl.dataset.kind = kind;
        // A result (a wrong password and the attempts left, a lockout) is always on screen,
        // even in a short window where the frame scrolls (UX slice 2a R2 M2)
        // The post-it holds the details the player is about to retype, so it comes into view
        // first and the line after it (both fit once the tile row has folded; R3 m4)
        if (text && kind !== 'info') {
            revealInFrame(this.gameContainer?.querySelector?.('.signin-mode.signin-chosen .postit-note'));
            revealInFrame(this.signInMessageEl);
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
        const result = foothold
            ? await sessions.signIn(this.signIn.pcId, username, password, { foothold })
            : await sessions.signIn(this.signIn.pcId, username, password);
        if (result.ok) {
            this.signInAccepted(result.session);
            return;
        }
        if (result.reason === 'locked_out') {
            this.signInLockedOut(result);
            return;
        }
        if (result.error) {
            this.setSignInMessage(signInErrorMessage(result), 'error');
            return;
        }
        if (window.playUISound) window.playUISound('reject');
        this.setSignInMessage(signInRefusalMessage(result), 'error');
        this.passwordField.value = '';
        this.gameData.password = '';
        this.passwordField.focus?.();
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
    signInLockedOut(result) {
        this.cleanup();
        if (window.playUISound) window.playUISound('reject');
        const message = signInRefusalMessage(result);
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
    }
}
