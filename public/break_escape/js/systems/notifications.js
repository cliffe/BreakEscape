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

// Show a notification instead of using alert()
export function showNotification(message, type = 'info', title = '', duration = 5000) {
    if (shouldHoldNotification(type, fullScreenPanelOpen())) {
        heldNotifications.push([message, type, title, duration]);
        if (!holdTimer) holdTimer = setInterval(releaseHeldNotifications, HOLD_POLL_MS);
        return null;
    }
    return renderNotification(message, type, title, duration);
}

function renderNotification(message, type, title, duration) {
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