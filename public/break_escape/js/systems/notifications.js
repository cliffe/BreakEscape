import { displayDashes } from '../utils/display-dashes.js';
import { registerModal } from '../ui/modal-stack.js';
import { fullScreenPanelOpen } from '../utils/overlay-open.js';
// Notification System
// Handles showing and managing notifications in the game

// Initialize the notification system
export function initializeNotifications() {
    // System is initialized through CSS and HTML structure
    console.log('Notification system initialized');
}

// Info and success toasts ("Task Complete", "Item Acquired", new aims) raised while
// a conversation, another minigame or a workstation popup is open wait until it
// closes: they stacked over the NPC portrait, the close button and the CyberChef
// panel (engine regression 2026-10-16: m04 F7, m05 E8, m08 R5). Warnings and
// errors are feedback on what the player just did, so they still show at once.
const HOLDABLE_TYPES = new Set(['info', 'success']);
const HOLD_POLL_MS = 300;
const heldNotifications = [];
let holdTimer = null;

export function shouldHoldNotification(type, panelOpen) {
    return !!panelOpen && HOLDABLE_TYPES.has(type);
}

// A panel the caller knows is about to open (a container that auto-opens 500 ms after
// the unlock toast). Info and success toasts raised in that window wait for the panel
// instead of being shown, pulled back when it opens and shown again when it closes: that
// glimpse-then-replay was the "Password Accepted", "Task Complete" and "has been noted"
// toasts appearing twice (m10 blind playtest F13, engine F24).
let panelExpectedUntil = 0;

export function expectPanelWithin(ms, now = Date.now()) {
    panelExpectedUntil = Math.max(panelExpectedUntil, now + ms);
}

export function panelExpected(now = Date.now()) {
    return now < panelExpectedUntil;
}

export function clearExpectedPanel() {
    panelExpectedUntil = 0;
}

/**
 * An unlocked container opens by itself 500 ms after the unlock toast (unlockTarget).
 * Call before that toast so it waits for the container instead of showing, being pulled
 * back when the container opens and showing again when it closes. Doors and locks with
 * nothing inside open no panel. Returns true when a panel is expected.
 */
export function expectContainerAfterUnlock(lockable, type) {
    if (type === 'door' || lockable?.doorProperties) return false;
    const contents = lockable?.scenarioData ? lockable.scenarioData.contents : lockable?.contents;
    if (!contents) return false;
    expectPanelWithin(1500);
    return true;
}

// A panel that closes often hands straight over to another one a tick later: a share or
// a desktop reopening the network screen it came from, a folder its desktop, the view
// its trip (container-minigame.js reportNetworkExit, network-links.js resume and landed).
// The release poll could fire in that gap when the close was slow, show the held toasts,
// and the reopened panel then pulled them back as a glimpse and replayed them at the end:
// every task toast twice (test_access_networks game 1750: P2, P3, N2, N3). The framework
// calls this when a minigame ends, and again once its close work is done, so held toasts
// wait until the screen has stayed clear this long. Starting a panel clears it at once.
export const PANEL_SETTLE_MS = 400;

export function settleAfterPanelClose(now = Date.now()) {
    expectPanelWithin(PANEL_SETTLE_MS, now);
}

if (typeof window !== 'undefined') {
    window.modalDialogOpened = modalDialogOpened;
    window.modalDialogClosed = modalDialogClosed;
    window.expectContainerAfterUnlock = expectContainerAfterUnlock;
    window.expectPanelWithin = expectPanelWithin;
    window.clearExpectedPanel = clearExpectedPanel;
    window.settleAfterPanelClose = settleAfterPanelClose;
}

// gameDisplay and gameConfirm dim the whole game with an overlay but are not minigames, so
// fullScreenPanelOpen() never saw them: a toast raised with or just before a note ("Note
// Added") or a once-only hint played out under the dimmed overlay and could expire unseen.
// They hold toasts the way a minigame does (same types, same hold queue and poll): info and
// success toasts wait until the last of them closes and then show for their full time, a toast
// barely on screen when one opens is pulled back, and older ones pause and carry on after.
// Errors and warnings are feedback on what the player just did, so they still show at once.
// Read from the page, not counted: an overlay removed by anything other than its own close
// (a test or a scene teardown wiping the body) must never leave toasts held for good.
export function modalDialogOpen() {
    return typeof document !== 'undefined' && typeof document.querySelector === 'function'
        && !!document.querySelector('.game-confirm-overlay');
}

function anyPanelOpen() {
    return fullScreenPanelOpen() || modalDialogOpen();
}

function setModalHold(on) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('notification-container');
    if (!container) return;
    container.querySelectorAll('.notification').forEach((el) => {
        if (!el._toast || el._toast.closing || !HOLDABLE_TYPES.has(el._toast.type)) return;
        setHold(el, '_modalHeld', on);
    });
}

// Backstop for the hold: while toasts are paused for a modal, look at the page every
// HOLD_POLL_MS and let them go once no .game-confirm-overlay is left, whichever code removed
// the last one (an overlay with that class that never calls the close hook, a teardown).
let modalPoll = null;

function modalDialogCount() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return 0;
    return document.querySelectorAll('.game-confirm-overlay').length;
}

function armModalPoll() {
    if (modalPoll || typeof setInterval !== 'function') return;
    modalPoll = setInterval(modalDialogClosed, HOLD_POLL_MS);
    if (modalPoll && typeof modalPoll.unref === 'function') modalPoll.unref();   // never keep a node test process alive
}

// The ending check (ending-check.js) has no imports and calls these two through window.
export function modalDialogOpened() {
    if (typeof document === 'undefined') return;
    armModalPoll();
    if (modalDialogCount() !== 1) return;   // already held by another
    holdRecentNotifications(Date.now(), { dismissStale: false });
    setModalHold(true);
}

export function modalDialogClosed() {
    if (modalDialogOpen()) return;   // another is still up: keep holding
    setModalHold(false);
    if (modalPoll) { clearInterval(modalPoll); modalPoll = null; }
}

function releaseHeldNotifications() {
    if (anyPanelOpen() || panelExpected()) return;
    clearInterval(holdTimer);
    holdTimer = null;
    heldNotifications.splice(0).forEach((args) => renderNotification(...args));
}

// A toast raised just before a minigame opens (the task that completes on an unlock,
// then the container opening 500 ms later) slipped past the hold and sat over the
// panel (m07 confirmation N1, Cascade Control). When a minigame starts, info and
// success toasts that have barely been on screen (under RECENT_TOAST_MS) go back into
// the held queue, once. Older ones were on screen long enough to read, so they are
// dismissed at once: left to fade, a room's task and objective toasts sat over the
// portrait of a conversation opened 1.5 to 2 s after entering (m06 confirmation F2,
// Satoshi).
//
// The window used to be 1.5 s and a toast could be pulled back again each time it was
// shown, so a task, objective or unlock toast the player had already read came back
// after the next panel closed (m09/m10 phase 5: "fires twice", "three times"). Now only
// a glimpse is replayed, and a toast that has been replayed once is never held again.
//
// A glimpse is now under 0.3 s (m07 blind playtest: relay closed, the NFS "Task Complete"
// toast slid in, the phone opened 0.3 to 0.7 s later, the toast vanished and came back when
// the phone closed). A toast that has been up for 0.3 s has finished sliding in and its title
// has been read, so one that old is dismissed when a panel opens, never replayed. Only a toast
// the panel covered before it could be read is shown again.
export const RECENT_TOAST_MS = 300;

/** Shown info/success toasts not to hold again: dismissed when a panel opens. */
export function pickStaleHoldable(entries, now, windowMs = RECENT_TOAST_MS) {
    return entries.filter((e) => e && HOLDABLE_TYPES.has(e.type)
        && (e.seen === true || (typeof e.shownAt === 'number' && now - e.shownAt >= windowMs)));
}

/** Which shown toasts to pull back when a panel opens. entries: [{ type, shownAt, seen? }] */
export function pickRecentHoldable(entries, now, windowMs = RECENT_TOAST_MS) {
    return entries.filter((e) => e && HOLDABLE_TYPES.has(e.type) && e.seen !== true
        && typeof e.shownAt === 'number' && now - e.shownAt < windowMs);
}

/**
 * How a toast's text is drawn: html (built markup) or plain text, and in plain text
 * verbatim (no dash display) or not. Two toasts with the same words but a different
 * mode are not duplicates.
 */
export function toastRenderMode(options) {
    const html = options?.html === true;
    return { html, verbatim: !html && options?.verbatim === true };
}

function sameRenderMode(a, b) {
    return a.html === b.html && a.verbatim === b.verbatim;
}

/** True when an identical info/success toast (same text and render mode) is already waiting in the hold. */
export function isQueuedDuplicate(queue, message, type, title, options = {}) {
    const mode = toastRenderMode(options);
    return queue.some((q) => q[0] === message && q[1] === type && q[2] === title
        && sameRenderMode(toastRenderMode(q[5]), mode));
}

export function holdRecentNotifications(now = Date.now(), { dismissStale = true } = {}) {
    if (typeof document === 'undefined') return 0;
    const container = document.getElementById('notification-container');
    if (!container) return 0;
    const shown = [...container.querySelectorAll('.notification')]
        .filter((el) => el._toast && !el._toast.pulled)
        .map((el) => ({ el, ...el._toast }));
    const pulled = pickRecentHoldable(shown, now);
    pulled.forEach(({ el, message, type, title, duration, html, verbatim, whole, brief, immediate, action }) => {
        el._toast.pulled = true;
        if (el.parentNode) el.parentNode.removeChild(el);
        // seen = true: already on screen once, so it is replayed once and never pulled again
        // brief, whole and immediate go with it: a replayed toast keeps its styling and its place in the queue
        heldNotifications.push([message, type, title, duration, true, {
            html: html === true, verbatim: verbatim === true,
            whole: whole === true, brief: brief === true, immediate: immediate === true,
            ...(action ? { action } : {}),
        }]);
    });
    // Toasts still waiting for a place go behind the pulled ones now, so they keep their
    // order ahead of toasts raised while the panel is open (code review R1 n2).
    holdForPanel(takeWaiting());
    if (pulled.length && !holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
    if (dismissStale) pickStaleHoldable(shown, now).forEach(({ el }) => {
        el._toast.pulled = true;
        removeNotification(el);
    });
    return pulled.length;
}
if (typeof window !== 'undefined') window.holdRecentNotifications = holdRecentNotifications;

// An error never flashes: a timed error toast lasts at least this long, whatever its caller
// asked (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 7; the riser refusal read as gone too soon).
// A duration of 0 (stay until closed) and longer times are kept; other types are unchanged.
export const ERROR_TOAST_MIN_MS = 5000;

export function toastDuration(type, duration) {
    const d = Number(duration);
    if (type === 'error' && Number.isFinite(d) && d > 0 && d < ERROR_TOAST_MIN_MS) return ERROR_TOAST_MIN_MS;
    return duration;
}

// A toast that carries an action button (the "Crack" button on "Hash collected") stays at least this
// long, so the player can reach the button (playtest: it faded twice before it could be pressed). It
// still waits while the pointer is over it or focus is inside it. A duration of 0 (until closed) is kept.
export const ACTION_TOAST_MIN_MS = 12000;

export function actionToastDuration(duration, options = {}) {
    const d = Number(duration);
    if (validToastAction(options) && Number.isFinite(d) && d > 0 && d < ACTION_TOAST_MIN_MS) return ACTION_TOAST_MIN_MS;
    return duration;
}

// Show a notification instead of using alert()
// The title and message are plain text (textContent) by default: callers pass scenario
// names, observations, task titles and server text, none of which may become markup.
// options.html === true: the caller built the title and message as HTML on purpose and has
// escaped every piece of author text in it. options.plainText is accepted and changes nothing.
// options.immediate: skip the queue behind other toasts (action feedback that must not arrive late).
// options.whole: lift the phone's two-line limit for this toast and nothing else.
// options.action = { label, onPress }: one optional button after the message. label is a non-empty
// string (shown as text), onPress a function; it runs once on a press (errors caught) and the toast goes.
// options.verbatim: the message exactly as given, with no " -- " dash display,
// for text the player must copy character for character (an overheard password).
export function showNotification(message, type = 'info', title = '', duration = 5000, options = {}) {
    duration = toastDuration(type, duration);
    duration = actionToastDuration(duration, options);
    if (shouldHoldNotification(type, anyPanelOpen() || panelExpected())) {
        // Toasts still waiting for a place go into the hold first, so they stay ahead of
        // this one: a workstation popup (CyberChef, a lab sheet) holds toasts without
        // calling holdRecentNotifications (code review R2 n1).
        holdForPanel(takeWaiting());
        // The same toast raised twice while a panel is open (two code paths announcing one
        // event) shows once
        if (isQueuedDuplicate(heldNotifications, message, type, title, options)) return null;
        heldNotifications.push([message, type, title, duration, false, options]);
        if (!holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
        return null;
    }
    return renderNotification(message, type, title, duration, false, options);
}

/**
 * The toast still on screen with the same message, type, title and render mode, or null.
 * A toast that is on its way out (closing, or pulled back behind a panel) does not count.
 */
export function findShownDuplicate(container, message, type, title, options = {}) {
    return findSameToast(container, message, type, title, options, false);
}

// pending true: the same toast still waiting to show over a panel (toast-pending, plan 2.5)
function findSameToast(container, message, type, title, options, pending) {
    const mode = toastRenderMode(options);
    const shown = container?.querySelectorAll ? [...container.querySelectorAll('.notification')] : [];
    return shown.find((el) => el._toast && !el._toast.pulled && !el._toast.closing
        && (el._toast.pending === true) === pending
        && el._toast.message === message && el._toast.type === type && el._toast.title === title
        && sameRenderMode(toastRenderMode(el._toast), mode)) || null;
}

// Start (or restart) a toast's countdown: the progress bar and the removal timer.
// total: the length the bar was drawn for (a resumed countdown starts part way along it).
function startCountdown(notification, duration, total = duration) {
    clearTimeout(notification._hideTimer);
    notification._countdownAt = Date.now();
    notification._countdownMs = duration;
    notification._barTotal = total;
    const progress = notification.querySelector('.notification-progress');
    const pct = `${Math.max(0, Math.min(100, (duration / total) * 100))}%`;
    // Under the pointer or with keyboard focus inside: the time waits, nothing runs down
    // (WCAG 2.2.1). It starts when the pointer leaves or the focus goes (resumeCountdown).
    if (isHeld(notification)) {
        notification._pausedLeft = duration;
        if (progress?.style) {
            progress.style.transition = 'none';
            progress.style.width = pct;
        }
        return;
    }
    notification._pausedLeft = null;
    if (progress?.style) {
        progress.style.transition = 'none';
        progress.style.width = pct;
        void progress.offsetWidth;   // restart the bar from where it is
        progress.style.transition = `width ${duration}ms linear`;
        setTimeout(() => { progress.style.width = '0%'; }, 10);
    }
    notification._hideTimer = setTimeout(() => removeNotification(notification), duration);
}

// ---- Hover and focus pause (toast R1 B2) ----
// Every timed toast stops its countdown while the pointer is over it or focus is inside it,
// and carries on with the time it had left when both are gone.
function isHeld(notification) {
    return notification._hoverHeld === true || notification._focusHeld === true || notification._modalHeld === true;
}

function pauseCountdown(notification) {
    const t = notification._toast;
    if (!t || t.closing || !(t.duration > 0) || notification._pausedLeft != null) return;
    if (notification._yieldLeft != null || !notification._countdownAt) return;   // stepped aside / not started
    clearTimeout(notification._hideTimer);
    const total = notification._barTotal || notification._countdownMs || t.duration;
    const left = Math.max(0, (notification._countdownMs || t.duration) - (Date.now() - notification._countdownAt));
    notification._pausedLeft = left;
    const progress = notification.querySelector?.('.notification-progress');
    if (progress?.style) {
        progress.style.transition = 'none';
        progress.style.width = `${Math.max(0, Math.min(100, (left / total) * 100))}%`;
    }
}

function resumeCountdown(notification) {
    const left = notification._pausedLeft;
    if (left == null || isHeld(notification)) return;
    notification._pausedLeft = null;
    if (notification._toast?.closing) return;
    startCountdown(notification, Math.max(left, 500), notification._barTotal || left);
}

function setHold(notification, flag, on) {
    if ((notification[flag] === true) === on) return;
    notification[flag] = on;
    if (on) pauseCountdown(notification); else resumeCountdown(notification);
}

// A toast's body takes no pointer events (it is click-through, so it never blocks the game
// under it), which means mouseenter never fires over it. The pointer is tested against each
// toast's box instead, from one mousemove listener on the document.
export function updateHoverFromPointer(x, y, doc = (typeof document === 'undefined' ? null : document)) {
    const list = doc?.querySelectorAll ? [...doc.querySelectorAll('#notification-container .notification')] : [];
    list.forEach((el) => {
        if (!el._toast || el._toast.closing) return;
        const r = el.getBoundingClientRect();
        const inside = r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        setHold(el, '_hoverHeld', inside);
    });
}
let pointerWatched = false;
// Where the pointer last was. A toast above closing slides the rest up while the pointer
// stays still, so holds are worked out again from here after every layout change (R2 M1).
let lastPointerX = -1;
let lastPointerY = -1;
function refreshHover() {
    try { updateHoverFromPointer(lastPointerX, lastPointerY); } catch (e) { /* a hold must never break a toast */ }
}
function watchPointer() {
    if (pointerWatched || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
    pointerWatched = true;
    // A tap makes a compatibility mousemove on plain HTML, which must not set a hover point
    // (R3 m2): pointer events say what made the move, mousemove is the fallback without them.
    const hoverAt = (e) => {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        updateHoverFromPointer(lastPointerX, lastPointerY);
    };
    const hasPointerEvents = typeof window !== 'undefined' && typeof window.PointerEvent === 'function';
    if (hasPointerEvents) {
        document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') hoverAt(e); }, true);
    } else {
        document.addEventListener('mousemove', (e) => { if (!e.sourceCapabilities?.firesTouchEvents) hoverAt(e); }, true);
    }
    // mouseleave does not bubble: on the root element it fires only when the pointer leaves the page
    document.documentElement?.addEventListener?.('mouseleave', () => {
        lastPointerX = -1;
        lastPointerY = -1;
        updateHoverFromPointer(-1, -1);
    });
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('resize', refreshHover);
        window.addEventListener('scroll', refreshHover, true);
    }
}

function wireHoldHandlers(notification) {
    if (typeof notification.addEventListener !== 'function') return;   // a test stub
    watchPointer();
    const hold = (flag, on) => setHold(notification, flag, on);
    notification.addEventListener('focusin', () => hold('_focusHeld', true));
    notification.addEventListener('focusout', (e) => {
        // focus moving between the toast's own controls is not leaving it
        if (e?.relatedTarget && notification.contains?.(e.relatedTarget)) return;
        hold('_focusHeld', false);
    });
}

// A toast that steps aside for a finished-task line (ui/hud-lanes.js, review R2 M4) keeps the
// time it had left and gets it back when it shows again (at least TOAST_RESUME_MIN_MS).
export const TOAST_RESUME_MIN_MS = 1500;
function laneYieldHandler(notification) {
    return (hidden) => {
        const t = notification._toast;
        if (!t || t.closing || !(t.duration > 0)) return;
        if (hidden) {
            if (notification._yieldLeft != null) return;
            clearTimeout(notification._hideTimer);
            const used = Date.now() - (notification._countdownAt || Date.now());
            notification._yieldLeft = notification._pausedLeft != null ? notification._pausedLeft
                : Math.max(0, (notification._countdownMs || t.duration) - used);
            notification._pausedLeft = null;
        } else if (notification._yieldLeft != null) {
            const left = Math.max(TOAST_RESUME_MIN_MS, notification._yieldLeft);
            notification._yieldLeft = null;
            startCountdown(notification, left);
        }
    };
}

// ---- Warnings and errors over an open panel (toast plan 2.5 to 2.7) ----
// ui/hud-lanes.js alone can measure the panel, so it decides when a waiting warning or error
// shows (its answers come in through el._onReplace); this file owns every timer, so no toast
// waits on hud-lanes answering well. Without hud-lanes, toasts show at once as before.
export const TOAST_WATCHDOG_MS = 500;        // no answer at all by then: show it
export const TOAST_HARD_RELEASE_MS = 5500;   // shown by then whatever the answers (D6)
export const WARNING_WAIT_MS = 5000;         // a warning behind errors is answered again by then
const PANEL_TOAST_TYPES = new Set(['warning', 'error']);

function hudLanesActive() {
    return typeof window !== 'undefined' && typeof window.hudLanesRelayout === 'function' && !window.__hudLanesDisabled;
}

function relayoutLanes() {
    try { if (hudLanesActive()) window.hudLanesRelayout(); } catch (e) { /* the hard release stands behind it */ }
    refreshHover();
}

// Errors first: with hud-lanes present an error goes before the first toast in the container
// that is not an error (pending and closing ones included), so a cut at the bottom of the block
// never falls on an error. A toast already in the right place is not moved.
function placeInOrder(container, notification) {
    if (notification._toast?.type !== 'error' || typeof container?.insertBefore !== 'function') {
        if (notification.parentNode !== container) container.appendChild(notification);
        return;
    }
    const all = [...container.querySelectorAll('.notification')];
    const at = all.indexOf(notification);
    if (at >= 0 && all.slice(0, at).every((el) => el._toast?.type === 'error')) return;
    const firstOther = all.find((el) => el !== notification && el._toast?.type !== 'error');
    if (firstOther) container.insertBefore(notification, firstOther);
    else if (at < 0) container.appendChild(notification);
}

// Every shown error wakes the lanes when its floor is reached, so a toast told to wait behind
// it is answered again then (plan 2.6 item 6). Re-armed by a duplicate restart.
function armErrorFloor(notification) {
    clearTimeout(notification._floorTimer);
    notification._floorTimer = null;
    const t = notification._toast;
    if (!t || t.type !== 'error' || t.pending || !hudLanesActive()) return;
    const due = (t.shownAt || Date.now()) + ERROR_TOAST_MIN_MS - Date.now();
    notification._floorTimer = setTimeout(() => { notification._floorTimer = null; relayoutLanes(); }, Math.max(0, due));
}

function cancelSwap(notification) {
    clearTimeout(notification._swapTimer);
    notification._swapTimer = null;
    notification._swap = null;
}

function clearPendingTimers(notification) {
    for (const k of ['_watchdogTimer', '_hardTimer', '_deadlineTimer']) {
        clearTimeout(notification[k]);
        notification[k] = null;
    }
    cancelSwap(notification);
}

// When a shown toast may be replaced: up 1.5 s for a warning, 5 s for an error
function floorOf(older) {
    const o = older._toast;
    return (o.shownAt || 0) + (o.type === 'error' ? ERROR_TOAST_MIN_MS : TOAST_STAGGER_MS);
}

// A waiting toast shows: its countdown starts now, the lanes place it, and only then it slides in
function releaseToast(notification) {
    const t = notification._toast;
    if (!t || !t.pending || t.closing) return;
    clearPendingTimers(notification);
    t.pending = false;
    notification.classList.remove('toast-pending');
    if (notification.parentNode) placeInOrder(notification.parentNode, notification);
    t.shownAt = Date.now();
    if (t.duration > 0) startCountdown(notification, t.duration);
    armErrorFloor(notification);
    // The relayout's frame is queued first, so the toast is placed before its slide-in starts
    relayoutLanes();
    const show = () => { if (!t.closing) notification.classList.add('show'); };
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(show);
        // rAF does not run in a hidden tab: the backstop keeps the toast from expiring unseen (R1 n2)
        setTimeout(show, 50);
    } else setTimeout(show, 10);
}

// Replace `older` once it has been up its floor, keyed on the pair (older, floor time)
function scheduleSwap(notification, older) {
    const floor = floorOf(older);
    if (notification._swap && notification._swap.older === older && notification._swap.floor === floor) return;
    cancelSwap(notification);
    notification._swap = { older, floor };
    notification._swapTimer = setTimeout(() => runSwap(notification), Math.max(0, floor - Date.now()));
}

function runSwap(notification) {
    const swap = notification._swap;
    notification._swapTimer = null;
    if (!swap || !notification._toast?.pending) return;
    const { older } = swap;
    if (older._toast && !older._toast.closing) {
        // A duplicate restart moved its floor after the swap was set: wait for the new one
        if (floorOf(older) > Date.now()) {
            notification._swap = null;
            scheduleSwap(notification, older);
            return;
        }
        removeNotification(older);
    }
    notification._swap = null;
    releaseToast(notification);
}

// hud-lanes' answer for a waiting toast: 'stack' (show now), 'wait', or a shown toast to replace
function replaceHandler(notification) {
    return (answer) => {
        const t = notification._toast;
        if (!t || !t.pending || t.closing) return;
        clearTimeout(notification._watchdogTimer);
        notification._watchdogTimer = null;
        if (answer === 'stack') releaseToast(notification);
        else if (answer && typeof answer === 'object' && answer._toast) scheduleSwap(notification, answer);
        else cancelSwap(notification);
    };
}

// hud-lanes: two warnings shown over a panel with no clear place for both; the older one goes
// once it has been up TOAST_STAGGER_MS (plan 2.5, "Panel opens with toasts shown")
function supersedeHandler(notification) {
    return (on = true) => {
        const t = notification._toast;
        if (!on) {   // the panel closed or room appeared: the older warning stays (review R1 m2)
            clearTimeout(notification._supersedeTimer);
            notification._supersedeTimer = null;
            return;
        }
        if (!t || t.closing || t.pending || notification._supersedeTimer) return;
        notification._supersedeTimer = setTimeout(() => {
            notification._supersedeTimer = null;
            if (!t.closing) removeNotification(notification);
        }, Math.max(0, floorOf(notification) - Date.now()));
    };
}

// At most one warning waits: a newer one replaces it (it was announced when it arrived)
function dropWaitingWarnings(container, keep) {
    const all = container?.querySelectorAll ? [...container.querySelectorAll('.notification')] : [];
    all.forEach((el) => {
        const t = el._toast;
        if (el === keep || !t || !t.pending || t.closing || t.type !== 'warning') return;
        clearPendingTimers(el);
        t.pending = false;
        t.closing = true;
        if (el.parentNode) el.parentNode.removeChild(el);
    });
}

// Screen readers hear every toast once (plan 2.7): errors in an alert region, the rest in a
// polite one. The regions sit on body (never in the toast container, which the lanes measure)
// and are looked up by id on each use. Nothing here may break a toast.
//
// Toasts raised in one tick (the held queue after a panel, a burst of drops) used to overwrite
// each other in the region, so a screen reader heard only the last (R2 B1). Texts are now
// collected per region and written once, a tick later, joined: important ones first in the
// order raised, then low-priority ones, then dropped asides folded into one "Also: ..." line.
// The region is emptied first, so the same text twice is read twice.
// A screen reader has read the text long before ANNOUNCE_CLEAR_MS. Left in place it stays in
// the page text for the rest of the game (a "Fingerprint Reader" refusal was found long after
// its toast closed). Both regions are emptied that long after each write; a token stops an
// older timer wiping a newer announcement.
export const ANNOUNCE_CLEAR_MS = 8000;
export const ANNOUNCE_FALLBACK_MS = 100;   // flush anyway when no frame comes (hidden tab)
let announceSerial = 0;
const announceSerials = {};   // region id -> token of its latest write
const pendingAnnouncements = { 'toast-live-alert': [], 'toast-live-polite': [] };
const sentencePunct = (t) => (/[.!?]$/.test(t) ? t : `${t}.`);
// A verbatim item (a password, a code) is joined exactly as given, never with a full stop added.
const VERBATIM_SEP = ' \u2014 ';

export function composeAnnouncement(items) {
    if (items.length === 1) return items[0].text;   // one toast: its text exactly as spoken
    const main = items.filter((i) => !i.dropped);
    const ordered = [...main.filter((i) => !i.low), ...main.filter((i) => i.low)];
    const dropped = items.filter((i) => i.dropped).map((i) => i.text.replace(/[.!?]$/, ''));
    let out = '';
    ordered.forEach((i, n) => {
        const piece = i.verbatim ? i.text : sentencePunct(i.text);
        if (n === 0) out = piece;
        else out += (i.verbatim || ordered[n - 1].verbatim) ? VERBATIM_SEP + piece : ` ${piece}`;
    });
    if (dropped.length) {
        const tail = `Also: ${dropped.join('; ')}.`;
        out = main.length ? `${out} ${tail}` : dropped.join('; ') + '.';   // all asides: no "Also:" with nothing before it
    }
    return out;
}

function flushAnnouncements(id) {
    const items = pendingAnnouncements[id].splice(0);
    if (!items.length) return;
    try {
        const r = document.getElementById(id);
        if (r) r.textContent = composeAnnouncement(items);
    } catch (e) { /* not announced */ }
    const token = ++announceSerial;
    announceSerials[id] = token;
    setTimeout(() => {
        try {
            if (announceSerials[id] !== token) return;
            const r = document.getElementById(id);
            if (r) r.textContent = '';
        } catch (e) { /* nothing to clear */ }
    }, ANNOUNCE_CLEAR_MS);
}

export function announceToast(type, text, flags = {}) {
    try {
        if (typeof document === 'undefined') return;
        const body = document.body;
        if (!body?.appendChild) return;
        const id = type === 'error' ? 'toast-live-alert' : 'toast-live-polite';
        let region = typeof document.getElementById === 'function' ? document.getElementById(id) : null;
        if (!region) {
            region = document.createElement('div');
            region.id = id;
            region.className = 'toast-live-region';
            if (type === 'error') {
                region.setAttribute?.('role', 'alert');
            } else {
                region.setAttribute?.('aria-live', 'polite');
                region.setAttribute?.('aria-atomic', 'true');
            }
            body.appendChild(region);
        }
        const queue = pendingAnnouncements[id];
        queue.push({ text: String(text ?? ''), low: flags.low === true, dropped: flags.dropped === true, verbatim: flags.verbatim === true });
        if (queue.length === 1) region.textContent = '';
        // The flush waits two frames (then a tick), so announcements raised in separate tasks of
        // one frame join instead of overwriting each other (R3 m1). One flush per announcement
        // (a later one finds the queue already empty and does nothing), so a timer that never
        // ran cannot leave the queue stuck; a hidden tab never runs rAF, so a plain timer backs it.
        const flush = () => flushAnnouncements(id);
        const win = typeof window !== 'undefined' ? window : null;
        if (win && typeof win.requestAnimationFrame === 'function') {
            // two frames: the engine can render one toast a frame after the one before it
            win.requestAnimationFrame(() => win.requestAnimationFrame(() => setTimeout(flush, 0)));
            setTimeout(flush, ANNOUNCE_FALLBACK_MS);
        } else {
            setTimeout(flush, 0);
        }
    } catch (e) { /* not announced */ }
}

function spokenText(notification, title, message, plainText, verbatim) {
    const plainOf = (sel, raw) => {
        const t = notification?.querySelector?.(sel)?.textContent;
        return typeof t === 'string' && t ? t : String(raw).replace(/<[^>]*>/g, ' ');
    };
    const head = !title ? '' : (plainText ? displayDashes(title) : plainOf('.notification-title', title));
    const body = plainText ? (verbatim ? String(message) : displayDashes(message)) : plainOf('.notification-message', message);
    return (head ? `${head}: ${body}` : body).replace(/\s+/g, ' ').trim();
}

// Plain text into an element: textContent per line, a <br> element between lines.
function setPlainLines(el, text) {
    String(text).split('\n').forEach((line, i) => {
        if (i > 0) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(line));
    });
}

// Toasts on screen at once; info and success toasts past this wait (renderNotification).
export const MAX_SHOWN_TOASTS = 2;
// On a phone the toast lane holds one toast at a time (UI decision H1 option A); the rest queue.
// ui/hud-lanes.js marks the phone layout with body.hud-compact.
export const MAX_SHOWN_TOASTS_COMPACT = 1;
export function maxShownToasts(doc = (typeof document === 'undefined' ? null : document)) {
    const cl = doc?.body?.classList;
    return typeof cl?.contains === 'function' && cl.contains('hud-compact') ? MAX_SHOWN_TOASTS_COMPACT : MAX_SHOWN_TOASTS;
}
// The head of the waiting line shows after this long even if both places are still taken
// (going over the limit by one for a moment), so it never lands long after the event it is
// about. The rest follow it a TOAST_STAGGER_MS apart.
export const MAX_TOAST_WAIT_MS = 4000;
// (HARD_MAX_SHOWN_TOASTS, the backlog dwells and MAX_WAITING_TOASTS are with the pile-up code below)
const waitingToasts = [];

/**
 * Toasts on screen that count towards the limit: not closing, not pulled back behind a
 * panel, not waiting to show over one (toast-pending), and timed. A toast that stays until closed (duration 0: the Key Ring, the Mission
 * Brief fallback) is left out, or one the player leaves open would halve the limit for good.
 */
export function shownToasts(container) {
    const all = container?.querySelectorAll ? [...container.querySelectorAll('.notification')] : [];
    return all.filter((el) => el._toast && !el._toast.pulled && !el._toast.closing && !el._toast.pending && el._toast.duration > 0);
}

/** Forget every toast waiting for a place (tests only: nothing in the engine calls it). */
export function clearWaitingToasts() { takeWaiting(); }

/** Number of info and success toasts waiting for a free place. */
export function waitingToastCount() { return waitingToasts.length; }

// After one waiting toast has gone over the limit, the next may follow no sooner than this.
export const TOAST_STAGGER_MS = 1500;
let lastOverLimitAt = 0;

// Put a toast in the waiting line. Only the head of the line has a timer (armHead), so a
// burst goes over the limit one toast at a time instead of all at once at 4 s (code
// review R2 m1: six toasts raised together put six on screen at 4.1 s).
function addWaiting(args) {
    args.waitingSince = Date.now();
    waitingToasts.push(args);
    dropLowPriorityWaiting();
    speedUpShown();
    armHead();
}

// ---- Pile-up control (m09 blind run: four or five toasts stacked over the view) ----
// A soft ceiling on timed toasts on screen, counting the ones that skip the waiting line
// (brief task lines, immediate feedback). The waiting line limit is MAX_SHOWN_TOASTS (above);
// a toast that skips it may take the count to this. Only a toast raised with options.low
// (an aside: "Dropped X", "Someone's in the way") is ever closed early, dropped from the
// line or given a shorter dwell. Teaching lines, hints, verbatim and whole toasts, titled
// toasts, errors, warnings and toasts that stay until closed always get their full time and
// wait their turn instead. Warnings, errors and a fresh toast can still pass the ceiling, so
// it is soft.
export const HARD_MAX_SHOWN_TOASTS = 3;
// A toast is not evicted before it has been on screen this long.
export const TOAST_MIN_READ_MS = 1500;
// With this many toasts waiting, the ones on screen and the ones raised now get a shorter dwell.
export const BACKLOG_SHORT = 2;
export const BACKLOG_LONG = 4;
export const SHORT_DWELL_MS = 2500;
export const SHORTEST_DWELL_MS = 2000;
// More than this many waiting: the oldest low-priority ones are dropped.
export const MAX_WAITING_TOASTS = 4;

/**
 * Dwell for a low-priority (options.low) timed info or success toast given how many are waiting
 * for a place. Anything else is returned unchanged: errors, warnings, toasts that stay until
 * closed, hints, teaching lines and every toast not marked low. A shortened dwell is never less
 * than 250 ms a word of the message.
 */
export function dwellForBacklog(type, duration, backlog, low = false, message = '') {
    const d = Number(duration);
    if (low !== true || !HOLDABLE_TYPES.has(type) || !(d > 0) || !(backlog >= BACKLOG_SHORT)) return duration;
    const words = String(message || '').trim().split(/\s+/).filter(Boolean).length;
    const floor = words * 250;
    const target = backlog >= BACKLOG_LONG ? SHORTEST_DWELL_MS : SHORT_DWELL_MS;
    return Math.min(d, Math.max(target, floor));
}

/**
 * Low priority: only a plain info or success toast raised with options.low (an aside). Never
 * one that is brief, immediate, whole, verbatim, a hint (options.hint) or kept (options.keep),
 * whatever else is set: those carry something to read or copy and are not dropped, cut short
 * or closed early. (title is accepted for the old signature and not used.)
 */
/** The toast's action ({ label, onPress }) when both parts are valid, else null. */
export function validToastAction(options) {
    const a = options?.action;
    return a && typeof a.label === 'string' && a.label !== '' && typeof a.onPress === 'function' ? a : null;
}

export function isLowPriorityToast(type, title, options = {}) {
    if (!HOLDABLE_TYPES.has(type) || options?.low !== true) return false;
    return !(validToastAction(options) || options.brief === true || options.immediate === true || options.whole === true
        || options.verbatim === true || options.hint === true || options.keep === true);
}

/** Indexes (in a waiting line of toast args) to drop so at most `max` wait: oldest low-priority first. */
export function pickLowPriorityDrops(queue, max = MAX_WAITING_TOASTS) {
    const drops = [];
    for (let i = 0; i < queue.length && queue.length - drops.length > max; i++) {
        const q = queue[i];
        if (isLowPriorityToast(q[1], q[2], q[5])) drops.push(i);
    }
    return drops;
}

/**
 * The shown toast to close so one more fits under `cap`, or null. entries: [{ el?, type, shownAt,
 * duration, low, held?, yieldLeft? }] oldest first. Only a low-priority timed toast that has
 * been up TOAST_MIN_READ_MS goes, never one under the pointer or focus or one hud-lanes has
 * stepped aside (it is due back).
 */
export function pickEvictable(entries, now, cap = HARD_MAX_SHOWN_TOASTS) {
    if (entries.length < cap) return null;
    return entries.find((e) => e.low === true && HOLDABLE_TYPES.has(e.type) && e.duration > 0
        && !e.held && e.yieldLeft == null
        && typeof e.shownAt === 'number' && now - e.shownAt >= TOAST_MIN_READ_MS) || null;
}

function dropLowPriorityWaiting() {
    const drops = pickLowPriorityDrops(waitingToasts);
    for (let k = drops.length - 1; k >= 0; k--) {
        const [gone] = waitingToasts.splice(drops[k], 1);
        clearTimeout(gone.waitTimer);
        console.debug('[toasts] dropped, low priority and the line is long:', gone[0]);
        // Never shown, so it is announced here instead (once): a screen reader still hears it
        announceToast(gone[1], spokenText(null, gone[2], gone[0], gone[5]?.html !== true, gone[5]?.verbatim === true), { dropped: true });
    }
}

// With a backlog, shown low-priority toasts that would outstay SHORT_DWELL_MS close sooner.
function speedUpShown() {
    if (typeof document === 'undefined' || waitingToasts.length < BACKLOG_SHORT) return;
    const container = document.getElementById('notification-container');
    const target = waitingToasts.length >= BACKLOG_LONG ? SHORTEST_DWELL_MS : SHORT_DWELL_MS;
    shownToasts(container).forEach((el) => {
        const t = el._toast;
        if (t.low !== true || !HOLDABLE_TYPES.has(t.type) || el._yieldLeft != null || !el._countdownAt || isHeld(el)) return;
        const left = (el._countdownMs || t.duration) - (Date.now() - el._countdownAt);
        if (left > target) startCountdown(el, target);
    });
}

// Close the oldest readable low-priority toast so a toast that skips the waiting line fits.
function makeRoomForImmediate(container) {
    const shown = shownToasts(container);
    const pick = pickEvictable(shown.map((el) => ({ el, ...el._toast, held: isHeld(el), yieldLeft: el._yieldLeft })), Date.now());
    if (pick) removeNotification(pick.el);
}

// Arm the wait limit on the head of the line: due MAX_TOAST_WAIT_MS after it joined, and no
// sooner than TOAST_STAGGER_MS after the last toast shown over the limit.
function armHead(now = Date.now()) {
    const head = waitingToasts[0];
    if (!head || head.waitTimer) return;
    const due = Math.max(head.waitingSince + MAX_TOAST_WAIT_MS, lastOverLimitAt + TOAST_STAGGER_MS);
    head.waitTimer = setTimeout(headDue, Math.max(0, due - now));
}

// The head has waited its limit. It shows over the limit unless a toast is already over it,
// in which case it tries again a stagger later: at most MAX_SHOWN_TOASTS + 1 timed info or
// success toasts on screen.
function headDue() {
    const head = waitingToasts[0];
    if (!head) return;
    head.waitTimer = null;
    const container = typeof document === 'undefined' ? null : document.getElementById('notification-container');
    const shown = shownToasts(container).length;
    if (shown > maxShownToasts()) {
        head.waitTimer = setTimeout(headDue, TOAST_STAGGER_MS);
        return;
    }
    waitingToasts.shift();
    if (shown >= maxShownToasts()) lastOverLimitAt = Date.now();
    showWaitingToast(head, true);
    armHead();
}

// Take every waiting toast out of the line (timers cleared), in order.
function takeWaiting() {
    const all = waitingToasts.splice(0);
    all.forEach((args) => { clearTimeout(args.waitTimer); args.waitTimer = null; });
    return all;
}

// Show a toast taken from the waiting line, or hold it for a panel that is open.
// Returns false when it could not be shown and went back in the line.
function showWaitingToast(args, overLimit) {
    clearTimeout(args.waitTimer);
    args.waitTimer = null;
    if (shouldHoldNotification(args[1], anyPanelOpen() || panelExpected())) {
        holdForPanel([args]);
        return true;
    }
    return !!renderNotification(args[0], args[1], args[2], args[3], args[4], args[5], overLimit, true);
}

// Into the held queue (shown when the panel closes), skipping copies already there.
function holdForPanel(list) {
    list.forEach((args) => {
        if (!isQueuedDuplicate(heldNotifications, args[0], args[1], args[2], args[5])) {
            heldNotifications.push([args[0], args[1], args[2], args[3], args[4], args[5]]);
        }
    });
    if (heldNotifications.length && !holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
}

// Show the next waiting toast once a place is free. With a panel open it joins the held
// queue instead, like any info or success toast raised then.
function showNextWaiting() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('notification-container');
    while (waitingToasts.length && shownToasts(container).length < maxShownToasts()) {
        if (!showWaitingToast(waitingToasts.shift(), false)) break;
    }
    armHead();
}

function renderNotification(message, type, title, duration, seen = false, options = {}, overLimit = false, waited = false) {
    const low = isLowPriorityToast(type, title, options);
    const plainText = options?.html !== true;
    const verbatim = plainText && options?.verbatim === true;
    const notificationContainer = document.getElementById('notification-container');

    // The same toast raised again while it is still on screen (a refusal hint clicked
    // three times) restarts its countdown instead of stacking a copy.
    // (A timed toast and one that stays until closed are not the same toast.)
    // A repeat of a toast still waiting over a panel only refreshes its time: its countdown has
    // not started (toast plan 2.5, "Duplicates")
    const waiting = findSameToast(notificationContainer, message, type, title, options, true);
    if (waiting && (duration > 0) === (waiting._toast.duration > 0)) {
        waiting._toast.duration = duration;
        return waiting;
    }
    const same = findShownDuplicate(notificationContainer, message, type, title, options);
    if (same && (duration > 0) === (same._toast.duration > 0)) {
        same._toast.shownAt = Date.now();
        // An error seen again keeps its 5 s floor from now; the lanes answer again with it
        armErrorFloor(same);
        relayoutLanes();
        if (duration > 0) {
            if (low && !waited) duration = dwellForBacklog(type, duration, waitingToasts.length, true, message);
            same._toast.duration = duration;
            if (same._yieldLeft != null) {
                // Stepped aside for a finished-task line: the fresh time waits with it (review R3 m3)
                same._yieldLeft = duration;
            } else {
                startCountdown(same, duration);
            }
        }
        return same;
    }

    // UX access R2 (finding 12): at most MAX_SHOWN_TOASTS on screen. A further info or
    // success toast waits its turn and shows as one goes; warnings and errors answer
    // what the player just did, so they still show at once.
    // A toast that stays until closed takes no place and never waits for one.
    // A finished task or aim (options.brief) does not wait: the pill blinks now, and the lanes
    // step the other toasts aside for it (review R2 M4). options.immediate does the same for
    // feedback on something the player just did ("Card copied"), without the brief styling.
    if (!overLimit && HOLDABLE_TYPES.has(type) && duration > 0 && options?.brief !== true
        && options?.immediate !== true
        && shownToasts(notificationContainer).length >= maxShownToasts()) {
        if (!isQueuedDuplicate(waitingToasts, message, type, title, options)) {
            addWaiting([message, type, title, duration, seen, options]);
        }
        return null;
    }

    // A long line shortens the dwell of a low-priority toast raised now, unless it has already
    // waited its turn (it would lose time twice)
    if (!waited) duration = dwellForBacklog(type, duration, waitingToasts.length, low, message);

    // Skipping the waiting line (brief, immediate) still keeps to the hard ceiling
    if (HOLDABLE_TYPES.has(type) && duration > 0 && (options?.brief === true || options?.immediate === true)) {
        makeRoomForImmediate(notificationContainer);
    }

    // A warning or error over an open panel waits, unshown, until hud-lanes has a place for it
    // or one of the timers below shows it (toast plan 2.6)
    const overPanel = PANEL_TOAST_TYPES.has(type) && hudLanesActive() && fullScreenPanelOpen();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = overPanel ? `notification ${type} toast-pending` : `notification ${type}`;
    
    // Create notification content
    let notificationContent = '';
    if (title) {
        notificationContent += plainText ? '<div class="notification-title"></div>'
            : `<div class="notification-title">${displayDashes(title)}</div>`;
    }
    notificationContent += plainText ? '<div class="notification-message"></div>'
        : `<div class="notification-message">${displayDashes(message).replace(/\n/g, "<br>")}</div>`;
    const action = validToastAction(options);
    if (action) notificationContent += '<button type="button" class="notification-action"></button>';
    notificationContent += `<button type="button" class="notification-close" aria-label="Close">×</button>`;
    
    if (duration > 0) {
        notificationContent += `<div class="notification-progress"></div>`;
    }
    
    notification.innerHTML = notificationContent;
    if (plainText) {
        // Author text in, plain text out: textContent, never innerHTML.
        if (title) notification.querySelector('.notification-title').textContent = displayDashes(title);
        setPlainLines(notification.querySelector('.notification-message'), verbatim ? message : displayDashes(message));
        // review R2 n1: a password's doubled, leading or trailing spaces are kept on screen
        if (verbatim) notification.querySelector('.notification-message').style.whiteSpace = 'pre-wrap';
        // Never cut short on a phone (the two-line limit, css/notifications.css): it is copied
        if (verbatim) notification.classList.add('verbatim');
    }
    // A short line with no title (a finished task on a phone, objectives-manager.js): its text
    // is never cut, so the task's name can always be read (review R1 M2)
    if (options?.brief === true) notification.classList.add('brief');
    // options.whole only lifts the phone's two-line limit: a long sentence (a keyring find, a
    // teaching line) is read whole, with none of brief's push-aside or skipped limit (K3b R1 m2)
    if (options?.whole === true) notification.classList.add('whole');
    notification._toast = { message, type, title, duration, shownAt: overPanel ? null : Date.now(), seen, html: !plainText, verbatim,
        whole: options?.whole === true, low, brief: options?.brief === true, immediate: options?.immediate === true,
        action: action || null };
    // Marks the toast for hud-lanes, which steps the others aside for it as for a brief one (no styling)
    if (options?.immediate === true) notification.classList.add('immediate');
    notification._onLaneYield = laneYieldHandler(notification);
    wireHoldHandlers(notification);
    if (hudLanesActive()) notification._onSupersede = supersedeHandler(notification);

    // Add to container: errors first while hud-lanes places the block, else at the end
    if (hudLanesActive()) placeInOrder(notificationContainer, notification);
    else notificationContainer.appendChild(notification);

    if (overPanel) {
        notification._toast.pending = true;
        notification._toast.arrivedAt = Date.now();
        if (type === 'warning') dropWaitingWarnings(notificationContainer, notification);
        notification._onReplace = replaceHandler(notification);
        notification._watchdogTimer = setTimeout(() => {
            notification._watchdogTimer = null;
            releaseToast(notification);
        }, TOAST_WATCHDOG_MS);
        notification._hardTimer = setTimeout(() => releaseToast(notification), TOAST_HARD_RELEASE_MS);
        if (type === 'warning') notification._deadlineTimer = setTimeout(relayoutLanes, WARNING_WAIT_MS);
        relayoutLanes();
    } else {
        // Show notification with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        // Progress bar and removal after the duration, if one is set
        if (duration > 0) startCountdown(notification, duration);
        armErrorFloor(notification);
    }
    announceToast(type, spokenText(notification, title, message, plainText, verbatim), { low: options?.low === true, verbatim });
    refreshHover();

    // The X is a real button. Enter and Space stop at it: the PIN pad's document handler
    // would cancel the click on Enter and submit the PIN. Click is added last (some test
    // stubs keep only the last listener) and takes no event.
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('keydown', (e) => {
        if (e?.key === 'Enter' || e?.key === ' ') e?.stopPropagation?.();
    });
    closeBtn.addEventListener('keyup', (e) => {
        if (e?.key === ' ') e?.stopPropagation?.();
    });
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });

    // The action button: same key handling as the X. A press runs onPress once (errors caught)
    // and the toast goes.
    const actionBtn = action ? notification.querySelector('.notification-action') : null;
    if (actionBtn) {
        actionBtn.textContent = action.label;
        actionBtn.addEventListener('keydown', (e) => {
            if (e?.key === 'Enter' || e?.key === ' ') e?.stopPropagation?.();
        });
        actionBtn.addEventListener('keyup', (e) => {
            if (e?.key === ' ') e?.stopPropagation?.();
        });
        let pressed = false;
        actionBtn.addEventListener('click', () => {
            if (pressed) return;
            pressed = true;
            try { action.onPress(); } catch (err) { console.error('[toasts] action failed:', err); }
            removeNotification(notification);
        });
    }

    return notification;
}

// Remove a notification with animation
export function removeNotification(notification) {
    clearTimeout(notification._hideTimer);
    clearTimeout(notification._floorTimer);
    clearTimeout(notification._supersedeTimer);
    clearPendingTimers(notification);
    if (notification._toast) {
        notification._toast.closing = true;
        notification._toast.pending = false;
    }
    notification.classList.remove('show');
    // The toast is whole or gone (no fade), so it leaves the stack flow at once: no empty slot
    // holds the toasts below for 300 ms. It also takes no click meant for a control under it
    // (the close X is pointer-events: auto in the stylesheet, so it needs its own).
    if (notification.style) {
        notification.style.pointerEvents = 'none';
        notification.style.display = 'none';
    }
    const closeBtn = notification.querySelector?.('.notification-close');
    if (closeBtn?.style) closeBtn.style.pointerEvents = 'none';
    const actionBtn = notification.querySelector?.('.notification-action');
    if (actionBtn?.style) actionBtn.style.pointerEvents = 'none';

    // Take the node out of the DOM after 300 ms; the timer now only paces refreshHover and
    // showNextWaiting, it is not an animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        refreshHover();
        showNextWaiting();
    }, 300);
}

// Replace alert with our custom notification system
export function gameAlert(message, type = 'info', title = '', duration = 5000, options = {}) {
    return showNotification(message, type, title, duration, options);
}

// Show an in-game display modal with a title and scrollable body. Returns a Promise that resolves when closed.
// The title and body are plain text by default, newlines kept. options.html === true: both
// were built as HTML on purpose, with every piece of author text already escaped and the
// " -- " dash display already applied to the text before the escape: the HTML is inserted
// as given (newlines become <br>), never rewritten.
export function gameDisplay(message, title = '', options = {}) {
    return new Promise(resolve => {
        const html = options?.html === true;
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        overlay.innerHTML = `
            <div class="game-confirm-dialog game-display-dialog">
                <button class="game-modal-close" aria-label="Close">&times;</button>
                ${title ? `<div class="game-display-title">${html ? title : ''}</div>` : ''}
                <div class="game-display-body pixel-scroll">${html ? String(message).replace(/\n/g, '<br>') : ''}</div>
            </div>`;
        if (!html) {
            // Author text in, plain text out: textContent, never innerHTML.
            if (title) overlay.querySelector('.game-display-title').textContent = displayDashes(title);
            setPlainLines(overlay.querySelector('.game-display-body'), displayDashes(message));
        }

        // The X is the only close control (UX design language: no Close button beside it),
        // and Esc closes through the modal stack. Focus starts on the X so Enter or Space
        // closes it from the keyboard, and goes back to whatever had it on close.
        const closeBtn = overlay.querySelector('.game-modal-close');
        const previousFocus = document.activeElement;
        let done = false;
        const unregister = registerModal(() => finish());
        const finish = () => {
            if (done) return;
            done = true;
            unregister();
            overlay.remove();
            try { modalDialogClosed(); } catch (e) { /* a hold fault must never keep a dialog open */ }
            try { if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus(); } catch (e) { /* best effort */ }
            resolve();
        };
        closeBtn.addEventListener('click', finish);
        document.body.appendChild(overlay);
        try { modalDialogOpened(); } catch (e) { /* a hold fault must never break the dialog */ }
        try { closeBtn.focus(); } catch (e) { /* best effort */ }
    });
}

// Show an in-game confirmation modal. Returns a Promise that resolves true (confirm) or false (cancel).
// By default no close X: the two named buttons answer it, and Esc picks the cancel choice (options.closeX below swaps in one named button plus the X). Callers name both
// buttons for what they do ("Switch off" and "Leave it"), never a bare Confirm or Cancel.
// The message and both button labels are plain text (textContent) by default, newlines kept, so
// author-written scenario text (an interactionWarning, a confirm action's text) is never markup.
// options.html === true: all three were built as HTML on purpose, author text already escaped.
// options.plainText is accepted and changes nothing.
// options.closeX === true: the confirm carries one named button (confirmLabel) and the corner X
// is the way out (resolves false); cancelLabel is ignored. For a confirm whose only other
// answer is "never mind", so the dialog follows the one-X rule (sis02 blind playtest m8).
export function gameConfirm(message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', options = {}) {
    return new Promise(resolve => {
        const plainText = !(options && options.html === true);
        const closeX = plainText && !!(options && options.closeX === true);
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        if (plainText) {
            overlay.innerHTML = closeX ? `
            <div class="game-confirm-dialog game-confirm-has-x">
                <button type="button" class="game-modal-close" aria-label="Close">&times;</button>
                <div class="game-confirm-message" style="white-space: pre-wrap;"></div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok"></button>
                </div>
            </div>` : `
            <div class="game-confirm-dialog">
                <div class="game-confirm-message" style="white-space: pre-wrap;"></div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok"></button>
                    <button class="game-confirm-btn game-confirm-cancel"></button>
                </div>
            </div>`;
            // Author text in, plain text out: textContent, never innerHTML.
            overlay.querySelector('.game-confirm-message').textContent = displayDashes(message);
            overlay.querySelector('.game-confirm-ok').textContent = confirmLabel;
            const cancelEl = overlay.querySelector('.game-confirm-cancel');
            if (cancelEl) cancelEl.textContent = cancelLabel;
        } else {
            overlay.innerHTML = `
            <div class="game-confirm-dialog">
                <div class="game-confirm-message">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">${confirmLabel}</button>
                    <button class="game-confirm-btn game-confirm-cancel">${cancelLabel}</button>
                </div>
            </div>`;
        }

        // No X unless options.closeX (UX q99): the two named buttons answer it, or with closeX
        // the one named button plus the X (the X is then the cancel control). Esc means the
        // cancel choice (resolve false), the safe one.
        const okBtn = overlay.querySelector('.game-confirm-ok');
        const cancelBtn = overlay.querySelector(closeX ? '.game-modal-close' : '.game-confirm-cancel') || okBtn;
        const previousFocus = document.activeElement;
        let done = false;
        // Keys already down when the dialog opened (an arrow the player was walking with):
        // their keydowns are swallowed until the key comes up, so a held arrow can't move
        // focus to the yes button (UX slice 16 R2 M1).
        const staleKeys = new Set(heldKeys);
        const onKeyUp = (e) => { staleKeys.delete(e.key); };
        let unregister = () => {};
        const finish = (result) => {
            if (done) return;
            done = true;
            openConfirms--;
            countText(message, -1);
            if (typeof window.removeEventListener === 'function') window.removeEventListener('keyup', onKeyUp, true);
            unregister();
            overlay.remove();
            try { modalDialogClosed(); } catch (e) { /* a hold fault must never break the dialog */ }
            // Give focus back to whatever had it (the game canvas, a minigame field).
            try { if (previousFocus && previousFocus.isConnected && previousFocus.focus) previousFocus.focus(); } catch (e) { /* best effort */ }
            resolve(result);
        };

        okBtn.addEventListener('click', () => finish(true));
        cancelBtn.addEventListener('click', () => finish(false));

        // Keyboard (UX slice 16 R1 m10): Enter or Space presses the focused button, Tab and the
        // arrows move between the two, and none of these keys reach the game underneath.
        // A repeat (a held key) or a key held since before the dialog opened does nothing: a
        // held arrow flipped focus on every repeat and left it on yes (R2 M1).
        overlay.addEventListener('keydown', (e) => {
            const key = e.key;
            if (e.repeat || staleKeys.has(key)) {
                if (key === 'Enter' || key === ' ' || key === 'Tab' || String(key).startsWith('Arrow')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return;
            }
            if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!e.repeat && (e.target === okBtn || e.target === cancelBtn)) e.target.click();
            } else if (key === 'Tab' || key === 'ArrowLeft' || key === 'ArrowRight' ||
                       key === 'ArrowUp' || key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                (document.activeElement === okBtn ? cancelBtn : okBtn).focus();
            }
        });

        // A click on the dimmed backdrop keeps focus on the buttons (R2 m2): without this the
        // click moved focus to body, Enter did nothing and Tab walked the HUD.
        overlay.addEventListener('mousedown', (e) => {
            if (!e.target.closest || !e.target.closest('.game-confirm-btn')) e.preventDefault();
        });
        if (typeof window.addEventListener === 'function') window.addEventListener('keyup', onKeyUp, true);

        // Count and register only once the dialog is wired, so a throw while building it
        // can't leave the open count stuck (R2 m3).
        unregister = registerModal(() => finish(false));
        openConfirms++;
        countText(message, 1);
        document.body.appendChild(overlay);
        try { modalDialogOpened(); } catch (e) { /* a hold fault must never break the dialog */ }
        // Focus the safe choice, so a stray Enter or Space never says yes.
        try { cancelBtn.focus(); } catch (e) { /* best effort */ }
    });
}

// How many gameConfirm dialogs are open. The interaction warning and confirm_action read it
// (window.gameConfirmOpen) so a second copy of a confirm never opens over the first.
// gameConfirmOpen(text) asks whether a confirm with that exact message is open, so
// confirm_action drops only a second copy of the same confirm, not a different one (R2 m3).
let openConfirms = 0;
const openTexts = new Map();
function countText(message, delta) {
    const key = String(message);
    const n = (openTexts.get(key) || 0) + delta;
    if (n > 0) openTexts.set(key, n); else openTexts.delete(key);
}
export function gameConfirmOpen(text) {
    if (text === undefined) return openConfirms > 0;
    return openTexts.has(String(text));
}

// Keys down right now, for the confirm's held-key guard. Capture phase on window, so a
// handler that stops propagation can't hide a key; a blur forgets them all (the keyup goes
// to another window).
const heldKeys = new Set();
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', (e) => { if (e.key) heldKeys.add(e.key); }, true);
    window.addEventListener('keyup', (e) => { heldKeys.delete(e.key); }, true);
    window.addEventListener('blur', () => heldKeys.clear());
}

// The bark lane (npc-barks.js) reads the count of timed toasts on screen through this
window.shownToastCount = () => shownToasts(document.getElementById('notification-container')).length;

// Export for global access
window.showNotification = showNotification;
window.gameAlert = gameAlert;
window.gameDisplay = gameDisplay;
window.gameConfirm = gameConfirm;
window.gameConfirmOpen = gameConfirmOpen;