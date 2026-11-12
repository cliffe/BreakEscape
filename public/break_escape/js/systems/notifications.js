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
    window.expectContainerAfterUnlock = expectContainerAfterUnlock;
    window.expectPanelWithin = expectPanelWithin;
    window.clearExpectedPanel = clearExpectedPanel;
    window.settleAfterPanelClose = settleAfterPanelClose;
}

function releaseHeldNotifications() {
    if (fullScreenPanelOpen() || panelExpected()) return;
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
// a glimpse (under 0.7 s) is replayed, and a toast that has been replayed once is never
// held again.
export const RECENT_TOAST_MS = 700;

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

export function holdRecentNotifications(now = Date.now()) {
    if (typeof document === 'undefined') return 0;
    const container = document.getElementById('notification-container');
    if (!container) return 0;
    const shown = [...container.querySelectorAll('.notification')]
        .filter((el) => el._toast && !el._toast.pulled)
        .map((el) => ({ el, ...el._toast }));
    const pulled = pickRecentHoldable(shown, now);
    pulled.forEach(({ el, message, type, title, duration, html, verbatim }) => {
        el._toast.pulled = true;
        if (el.parentNode) el.parentNode.removeChild(el);
        // seen = true: already on screen once, so it is replayed once and never pulled again
        heldNotifications.push([message, type, title, duration, true, { html: html === true, verbatim: verbatim === true }]);
    });
    // Toasts still waiting for a place go behind the pulled ones now, so they keep their
    // order ahead of toasts raised while the panel is open (code review R1 n2).
    holdForPanel(takeWaiting());
    if (pulled.length && !holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
    pickStaleHoldable(shown, now).forEach(({ el }) => {
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

// Show a notification instead of using alert()
// The title and message are plain text (textContent) by default: callers pass scenario
// names, observations, task titles and server text, none of which may become markup.
// options.html === true: the caller built the title and message as HTML on purpose and has
// escaped every piece of author text in it. options.plainText is accepted and changes nothing.
// options.verbatim: the message exactly as given, with no " -- " dash display,
// for text the player must copy character for character (an overheard password).
export function showNotification(message, type = 'info', title = '', duration = 5000, options = {}) {
    duration = toastDuration(type, duration);
    if (shouldHoldNotification(type, fullScreenPanelOpen() || panelExpected())) {
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
    const mode = toastRenderMode(options);
    const shown = container?.querySelectorAll ? [...container.querySelectorAll('.notification')] : [];
    return shown.find((el) => el._toast && !el._toast.pulled && !el._toast.closing
        && el._toast.message === message && el._toast.type === type && el._toast.title === title
        && sameRenderMode(toastRenderMode(el._toast), mode)) || null;
}

// Start (or restart) a toast's countdown: the progress bar and the removal timer.
function startCountdown(notification, duration) {
    clearTimeout(notification._hideTimer);
    const progress = notification.querySelector('.notification-progress');
    if (progress?.style) {
        progress.style.transition = 'none';
        progress.style.width = '100%';
        void progress.offsetWidth;   // restart the bar from full
        progress.style.transition = `width ${duration}ms linear`;
        setTimeout(() => { progress.style.width = '0%'; }, 10);
    }
    notification._hideTimer = setTimeout(() => removeNotification(notification), duration);
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
// A waiting toast shows after this long even if both places are still taken (going over
// the limit for a moment), so it never lands long after the event it is about.
export const MAX_TOAST_WAIT_MS = 4000;
const waitingToasts = [];

/**
 * Toasts on screen that count towards the limit: not closing, not pulled back behind a
 * panel, and timed. A toast that stays until closed (duration 0: the Key Ring, the Mission
 * Brief fallback) is left out, or one the player leaves open would halve the limit for good.
 */
export function shownToasts(container) {
    const all = container?.querySelectorAll ? [...container.querySelectorAll('.notification')] : [];
    return all.filter((el) => el._toast && !el._toast.pulled && !el._toast.closing && el._toast.duration > 0);
}

/** Number of info and success toasts waiting for a free place. */
export function waitingToastCount() { return waitingToasts.length; }

// Put a toast in the waiting line, with a timer that shows it anyway once it has waited
// MAX_TOAST_WAIT_MS.
function addWaiting(args) {
    args.waitTimer = setTimeout(() => {
        const i = waitingToasts.indexOf(args);
        if (i < 0) return;
        waitingToasts.splice(i, 1);
        showWaitingToast(args, true);
    }, MAX_TOAST_WAIT_MS);
    waitingToasts.push(args);
}

// Take every waiting toast out of the line (timers cleared), in order.
function takeWaiting() {
    const all = waitingToasts.splice(0);
    all.forEach((args) => clearTimeout(args.waitTimer));
    return all;
}

// Show a toast taken from the waiting line, or hold it for a panel that is open.
// Returns false when it could not be shown and went back in the line.
function showWaitingToast(args, overLimit) {
    clearTimeout(args.waitTimer);
    if (shouldHoldNotification(args[1], fullScreenPanelOpen() || panelExpected())) {
        holdForPanel([args]);
        return true;
    }
    return !!renderNotification(args[0], args[1], args[2], args[3], args[4], args[5], overLimit);
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
    while (waitingToasts.length && shownToasts(container).length < MAX_SHOWN_TOASTS) {
        if (!showWaitingToast(waitingToasts.shift(), false)) break;
    }
}

function renderNotification(message, type, title, duration, seen = false, options = {}, overLimit = false) {
    const plainText = options?.html !== true;
    const verbatim = plainText && options?.verbatim === true;
    const notificationContainer = document.getElementById('notification-container');

    // The same toast raised again while it is still on screen (a refusal hint clicked
    // three times) restarts its countdown instead of stacking a copy.
    // (A timed toast and one that stays until closed are not the same toast.)
    const same = findShownDuplicate(notificationContainer, message, type, title, options);
    if (same && (duration > 0) === (same._toast.duration > 0)) {
        same._toast.shownAt = Date.now();
        if (duration > 0) {
            same._toast.duration = duration;
            startCountdown(same, duration);
        }
        return same;
    }

    // UX access R2 (finding 12): at most MAX_SHOWN_TOASTS on screen. A further info or
    // success toast waits its turn and shows as one goes; warnings and errors answer
    // what the player just did, so they still show at once.
    // A toast that stays until closed takes no place and never waits for one.
    if (!overLimit && HOLDABLE_TYPES.has(type) && duration > 0
        && shownToasts(notificationContainer).length >= MAX_SHOWN_TOASTS) {
        if (!isQueuedDuplicate(waitingToasts, message, type, title, options)) {
            addWaiting([message, type, title, duration, seen, options]);
        }
        return null;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create notification content
    let notificationContent = '';
    if (title) {
        notificationContent += plainText ? '<div class="notification-title"></div>'
            : `<div class="notification-title">${displayDashes(title)}</div>`;
    }
    notificationContent += plainText ? '<div class="notification-message"></div>'
        : `<div class="notification-message">${displayDashes(message).replace(/\n/g, "<br>")}</div>`;
    notificationContent += `<div class="notification-close">×</div>`;
    
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
    }
    notification._toast = { message, type, title, duration, shownAt: Date.now(), seen, html: !plainText, verbatim };
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Progress bar and removal after the duration, if one is set
    if (duration > 0) startCountdown(notification, duration);
    
    // Add close button event listener
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    return notification;
}

// Remove a notification with animation
export function removeNotification(notification) {
    clearTimeout(notification._hideTimer);
    if (notification._toast) notification._toast.closing = true;
    notification.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
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
                <div class="game-display-body">${html ? String(message).replace(/\n/g, '<br>') : ''}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">Close</button>
                </div>
            </div>`;
        if (!html) {
            // Author text in, plain text out: textContent, never innerHTML.
            if (title) overlay.querySelector('.game-display-title').textContent = displayDashes(title);
            setPlainLines(overlay.querySelector('.game-display-body'), displayDashes(message));
        }

        const unregister = registerModal(() => finish());
        const finish = () => { unregister(); overlay.remove(); resolve(); };
        overlay.querySelector('.game-confirm-ok').addEventListener('click', finish);
        overlay.querySelector('.game-modal-close').addEventListener('click', finish);
        document.body.appendChild(overlay);
    });
}

// Show an in-game confirmation modal. Returns a Promise that resolves true (confirm) or false (cancel).
// The message and both button labels are plain text (textContent) by default, newlines kept, so
// author-written scenario text (an interactionWarning, a confirm action's text) is never markup.
// options.html === true: all three were built as HTML on purpose, author text already escaped.
// options.plainText is accepted and changes nothing.
export function gameConfirm(message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', options = {}) {
    return new Promise(resolve => {
        const plainText = !(options && options.html === true);
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        if (plainText) {
            overlay.innerHTML = `
            <div class="game-confirm-dialog">
                <button class="game-modal-close" aria-label="Cancel">&times;</button>
                <div class="game-confirm-message" style="white-space: pre-wrap;"></div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok"></button>
                    <button class="game-confirm-btn game-confirm-cancel"></button>
                </div>
            </div>`;
            // Author text in, plain text out: textContent, never innerHTML.
            overlay.querySelector('.game-confirm-message').textContent = displayDashes(message);
            overlay.querySelector('.game-confirm-ok').textContent = confirmLabel;
            overlay.querySelector('.game-confirm-cancel').textContent = cancelLabel;
        } else {
            overlay.innerHTML = `
            <div class="game-confirm-dialog">
                <button class="game-modal-close" aria-label="Cancel">&times;</button>
                <div class="game-confirm-message">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">${confirmLabel}</button>
                    <button class="game-confirm-btn game-confirm-cancel">${cancelLabel}</button>
                </div>
            </div>`;
        }

        // Esc and the X both cancel (resolve false), same as the Cancel button.
        const unregister = registerModal(() => finish(false));
        const finish = (result) => {
            unregister();
            overlay.remove();
            resolve(result);
        };

        overlay.querySelector('.game-confirm-ok').addEventListener('click', () => finish(true));
        overlay.querySelector('.game-confirm-cancel').addEventListener('click', () => finish(false));
        overlay.querySelector('.game-modal-close').addEventListener('click', () => finish(false));

        document.body.appendChild(overlay);
    });
}

// Export for global access
window.showNotification = showNotification;
window.gameAlert = gameAlert;
window.gameDisplay = gameDisplay;
window.gameConfirm = gameConfirm;