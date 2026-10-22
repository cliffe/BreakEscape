/**
 * The simple success screen: `conclusionScreen: { "type": "success" }`.
 *
 * For short training episodes (the awareness shells) that end without the
 * credits. Story missions use `bond_visualiser` instead; see the ending
 * convention in README_scenario_design.md.
 *
 * What it does, and how it differs from the old `end_screen`:
 *   - shows a title, an optional short body (plain text) and two controls,
 *     "Return to missions" and "Close";
 *   - only ever opens from handleMissionConcluded (objectives-manager.js), so
 *     nothing about it can stand in the way before the mission has concluded;
 *   - waits until no minigame has been open for IDLE_MS, so it never covers a
 *     debrief or a result screen still on show when the mission concludes
 *     (an awareness shell concludes when the triage result saves, before the
 *     episode's own debrief);
 *   - opens at most once per page load, and Close (or Esc) dismisses it and
 *     gives the game back, the way the credits behave after a reload of a
 *     concluded game. A reload shows it once more, then it can be closed.
 *
 * Return to missions: in Hacktivity mode the game runs in its own tab, so it
 * focuses the opener and closes the tab; when the tab cannot close (or in
 * standalone mode) it goes to /break_escape/missions.
 *
 * Exposed as window.showSuccessScreen for objectives-manager.js, which has no
 * imports of its own.
 */
import { displayDashes } from '../utils/display-dashes.js';

export const SUCCESS_SCREEN_ID = 'scenario-success-screen';
export const DEFAULT_TITLE = 'Exercise complete';
export const DEFAULT_BUTTON = 'Return to missions';
export const MISSIONS_URL = '/break_escape/missions';
const IDLE_MS = 1000;   // a child overlay can close and the parent reopen in between
const POLL_MS = 250;

let shownThisLoad = false;
let pending = false;    // true while waiting for the game to go idle
let keyHandler = null;
let movementBefore = null;

const win = () => (typeof window !== 'undefined' ? window : null);

/** True while a minigame (conversation, kiosk, result screen...) is open. */
function busy() {
    const w = win();
    return !!(w?.MinigameFramework?.currentMinigame);
}

/**
 * Open the success screen once the game is idle. Returns true when it will
 * open (now or once idle), false when it has already been shown this load.
 *
 * @param {Object} [opts]  the conclusionScreen object
 * @param {string} [opts.title]       heading; default 'Exercise complete'
 * @param {string} [opts.body]        one or two plain-text sentences
 * @param {string} [opts.buttonText]  default 'Return to missions'
 * @param {Object} [deps]  test seams: { idleMs, pollMs, schedule, clear, navigate, closeTab }
 */
export function showSuccessScreen(opts = {}, deps = {}) {
    if (shownThisLoad || pending) return false;
    const doc = typeof document !== 'undefined' ? document : null;
    if (!doc || doc.getElementById(SUCCESS_SCREEN_ID)) return false;

    const idleMs = deps.idleMs ?? IDLE_MS;
    const pollMs = deps.pollMs ?? POLL_MS;
    const schedule = deps.schedule || ((fn, ms) => setTimeout(fn, ms));
    let idleFor = 0;

    const tick = () => {
        idleFor = busy() ? 0 : idleFor + pollMs;
        if (idleFor >= idleMs) {
            pending = false;
            openNow(opts, deps);
            return;
        }
        schedule(tick, pollMs);
    };
    pending = true;
    schedule(tick, 0);
    return true;
}

/** Close it and give the game back. Safe to call when it is not open. */
export function closeSuccessScreen() {
    const doc = typeof document !== 'undefined' ? document : null;
    const el = doc?.getElementById(SUCCESS_SCREEN_ID);
    if (el) el.remove();
    const w = win();
    if (keyHandler && w) {
        w.removeEventListener('keydown', keyHandler, true);
        keyHandler = null;
    }
    if (w?.player && movementBefore !== null) w.player.disableMovement = movementBefore;
    movementBefore = null;
}

export function isSuccessScreenOpen() {
    return typeof document !== 'undefined' && !!document.getElementById(SUCCESS_SCREEN_ID);
}

/** Test seam: forget that it was shown this load. */
export function _resetSuccessScreen() {
    closeSuccessScreen();
    shownThisLoad = false;
    pending = false;
}

function returnToMissions(deps) {
    const w = win();
    const navigate = deps.navigate || ((url) => { w.location.href = url; });
    const closeTab = deps.closeTab || (() => { w.close(); });
    if (w?.breakEscapeConfig?.hacktivityMode) {
        try { w.opener?.focus(); } catch (e) { /* cross-origin opener */ }
        closeTab();
        // A tab the player opened by hand cannot be closed by script
        (deps.schedule || ((fn, ms) => setTimeout(fn, ms)))(() => {
            if (!w.closed) navigate(MISSIONS_URL);
        }, 300);
        return;
    }
    navigate(MISSIONS_URL);
}

function openNow(opts, deps) {
    const doc = document;
    if (doc.getElementById(SUCCESS_SCREEN_ID)) return;
    shownThisLoad = true;

    const title = typeof opts.title === 'string' && opts.title.trim() ? opts.title : DEFAULT_TITLE;
    const body = typeof opts.body === 'string' ? opts.body.trim() : '';
    const buttonText = typeof opts.buttonText === 'string' && opts.buttonText.trim() ? opts.buttonText : DEFAULT_BUTTON;

    const overlay = doc.createElement('div');
    overlay.id = SUCCESS_SCREEN_ID;
    overlay.className = 'success-screen-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'success-screen-title');
    overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(0,0,0,0.88)',
        'display:flex', 'justify-content:center', 'align-items:center',
        'z-index:10000', 'flex-direction:column', 'gap:20px',
        'padding:16px', 'box-sizing:border-box',
        'font-family:"Press Start 2P",monospace'
    ].join(';');

    const titleEl = doc.createElement('h1');
    titleEl.id = 'success-screen-title';
    titleEl.textContent = displayDashes(title);
    titleEl.style.cssText = [
        'color:#22ff88', 'font-size:24px', 'font-weight:normal', 'margin:0',
        'text-align:center', 'max-width:820px', 'line-height:1.6',
        'text-shadow:0 0 18px rgba(34,255,136,0.45)'
    ].join(';');
    overlay.appendChild(titleEl);

    if (body) {
        const bodyEl = doc.createElement('p');
        bodyEl.className = 'success-screen-body';
        bodyEl.textContent = displayDashes(body);
        bodyEl.style.cssText = [
            'color:#cccccc', 'font-size:20px', 'font-family:"VT323",monospace',
            'margin:0', 'text-align:center', 'max-width:680px', 'line-height:1.6'
        ].join(';');
        overlay.appendChild(bodyEl);
    }

    const row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:12px';
    const button = (id, label, primary, onClick) => {
        const b = doc.createElement('button');
        b.id = id;
        b.type = 'button';
        b.textContent = label;
        b.style.cssText = [
            'padding:12px 24px', 'font-size:13px', 'font-family:"Press Start 2P",monospace',
            `background:${primary ? '#1d4d33' : '#333'}`, 'color:#dddddd',
            `border:2px solid ${primary ? '#22ff88' : '#666'}`, 'cursor:pointer'
        ].join(';');
        b.addEventListener('click', onClick);
        row.appendChild(b);
        return b;
    };
    const ret = button('success-screen-return', buttonText, true, () => returnToMissions(deps));
    button('success-screen-close', 'Close', false, () => closeSuccessScreen());
    overlay.appendChild(row);
    doc.body.appendChild(overlay);

    const w = win();
    if (w?.player) {
        movementBefore = !!w.player.disableMovement;
        w.player.disableMovement = true;
    }
    // Keys belong to the screen while it is up: Esc closes it, and nothing
    // reaches the game underneath (no walking or interacting behind it).
    keyHandler = (e) => {
        if (!isSuccessScreenOpen()) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closeSuccessScreen();
        }
        e.stopPropagation();
    };
    w?.addEventListener('keydown', keyHandler, true);
    try { ret.focus(); } catch (e) { /* jsdom without focus */ }
}

if (typeof window !== 'undefined') {
    window.showSuccessScreen = showSuccessScreen;
    window.closeSuccessScreen = closeSuccessScreen;
}
