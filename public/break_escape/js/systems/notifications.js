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

function releaseHeldNotifications() {
    if (fullScreenPanelOpen()) return;
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

/** True when an identical info/success toast is already waiting in the hold. */
export function isQueuedDuplicate(queue, message, type, title) {
    return queue.some((q) => q[0] === message && q[1] === type && q[2] === title);
}

export function holdRecentNotifications(now = Date.now()) {
    if (typeof document === 'undefined') return 0;
    const container = document.getElementById('notification-container');
    if (!container) return 0;
    const shown = [...container.querySelectorAll('.notification')]
        .filter((el) => el._toast && !el._toast.pulled)
        .map((el) => ({ el, ...el._toast }));
    const pulled = pickRecentHoldable(shown, now);
    pulled.forEach(({ el, message, type, title, duration }) => {
        el._toast.pulled = true;
        if (el.parentNode) el.parentNode.removeChild(el);
        // seen = true: already on screen once, so it is replayed once and never pulled again
        heldNotifications.push([message, type, title, duration, true]);
    });
    if (pulled.length && !holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
    pickStaleHoldable(shown, now).forEach(({ el }) => {
        el._toast.pulled = true;
        removeNotification(el);
    });
    return pulled.length;
}
if (typeof window !== 'undefined') window.holdRecentNotifications = holdRecentNotifications;

// Show a notification instead of using alert()
export function showNotification(message, type = 'info', title = '', duration = 5000) {
    if (shouldHoldNotification(type, fullScreenPanelOpen())) {
        // The same toast raised twice while a panel is open (two code paths announcing one
        // event) shows once
        if (isQueuedDuplicate(heldNotifications, message, type, title)) return null;
        heldNotifications.push([message, type, title, duration]);
        if (!holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
        return null;
    }
    return renderNotification(message, type, title, duration);
}

function renderNotification(message, type, title, duration, seen = false) {
    const notificationContainer = document.getElementById('notification-container');
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create notification content
    let notificationContent = '';
    if (title) {
        notificationContent += `<div class="notification-title">${displayDashes(title)}</div>`;
    }
    notificationContent += `<div class="notification-message">${displayDashes(message).replace(/\n/g, "<br>")}</div>`;
    notificationContent += `<div class="notification-close">×</div>`;
    
    if (duration > 0) {
        notificationContent += `<div class="notification-progress"></div>`;
    }
    
    notification.innerHTML = notificationContent;
    notification._toast = { message, type, title, duration, shownAt: Date.now(), seen };
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add progress animation if duration is set
    if (duration > 0) {
        const progress = notification.querySelector('.notification-progress');
        progress.style.transition = `width ${duration}ms linear`;
        
        // Start progress animation
        setTimeout(() => {
            progress.style.width = '0%';
        }, 10);
        
        // Remove notification after duration
        setTimeout(() => {
            removeNotification(notification);
        }, duration);
    }
    
    // Add close button event listener
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    return notification;
}

// Remove a notification with animation
export function removeNotification(notification) {
    notification.classList.remove('show');
    
    // Remove from DOM after animation
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Replace alert with our custom notification system
export function gameAlert(message, type = 'info', title = '', duration = 5000) {
    return showNotification(message, type, title, duration);
}

// Show an in-game display modal with a title and scrollable body. Returns a Promise that resolves when closed.
export function gameDisplay(message, title = '') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        overlay.innerHTML = `
            <div class="game-confirm-dialog game-display-dialog">
                <button class="game-modal-close" aria-label="Close">&times;</button>
                ${title ? `<div class="game-display-title">${displayDashes(title)}</div>` : ''}
                <div class="game-display-body">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">Close</button>
                </div>
            </div>`;

        const unregister = registerModal(() => finish());
        const finish = () => { unregister(); overlay.remove(); resolve(); };
        overlay.querySelector('.game-confirm-ok').addEventListener('click', finish);
        overlay.querySelector('.game-modal-close').addEventListener('click', finish);
        document.body.appendChild(overlay);
    });
}

// Show an in-game confirmation modal. Returns a Promise that resolves true (confirm) or false (cancel).
export function gameConfirm(message, confirmLabel = 'Confirm', cancelLabel = 'Cancel') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'game-confirm-overlay';
        overlay.innerHTML = `
            <div class="game-confirm-dialog">
                <button class="game-modal-close" aria-label="Cancel">&times;</button>
                <div class="game-confirm-message">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">${confirmLabel}</button>
                    <button class="game-confirm-btn game-confirm-cancel">${cancelLabel}</button>
                </div>
            </div>`;

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