import { displayDashes } from '../utils/display-dashes.js';
// Notification System
// Handles showing and managing notifications in the game

// Initialize the notification system
export function initializeNotifications() {
    // System is initialized through CSS and HTML structure
    console.log('Notification system initialized');
}

// Show a notification instead of using alert()
export function showNotification(message, type = 'info', title = '', duration = 5000) {
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
                ${title ? `<div class="game-display-title">${displayDashes(title)}</div>` : ''}
                <div class="game-display-body">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">Close</button>
                </div>
            </div>`;

        const finish = () => { overlay.remove(); resolve(); };
        overlay.querySelector('.game-confirm-ok').addEventListener('click', finish);
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
                <div class="game-confirm-message">${displayDashes(message).replace(/\n/g, '<br>')}</div>
                <div class="game-confirm-buttons">
                    <button class="game-confirm-btn game-confirm-ok">${confirmLabel}</button>
                    <button class="game-confirm-btn game-confirm-cancel">${cancelLabel}</button>
                </div>
            </div>`;

        const finish = (result) => {
            overlay.remove();
            resolve(result);
        };

        overlay.querySelector('.game-confirm-ok').addEventListener('click', () => finish(true));
        overlay.querySelector('.game-confirm-cancel').addEventListener('click', () => finish(false));

        document.body.appendChild(overlay);
    });
}

// Export for global access
window.showNotification = showNotification;
window.gameAlert = gameAlert;
window.gameDisplay = gameDisplay;
window.gameConfirm = gameConfirm;