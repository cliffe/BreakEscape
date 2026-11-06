// UI Panels System
// Handles generic panel utilities - specific panel functionality is handled by individual systems
import { playUISound } from '../systems/ui-sounds.js';

// Initialize UI panels (generic setup only)
export function initializeUI() {
    console.log('UI panels system initialized');
    
    // Note: Individual systems (notes.js, biometrics.js) handle their own panel setup
    // This file only provides utility functions for generic panel operations
}

// Generic panel utility functions
export function togglePanel(panel) {
    if (!panel) {
        console.warn('togglePanel: panel is null or undefined');
        return;
    }
    
    console.log('Toggling panel:', panel.id);
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    // Play sound
    if (!isVisible) {
        playUISound('notification');
    }
    
    // Add animation class for smooth transitions
    if (!isVisible) {
        panel.classList.add('panel-show');
        setTimeout(() => panel.classList.remove('panel-show'), 300);
    }
}

export function showPanel(panel) {
    if (!panel) return;
    console.log('Showing panel:', panel.id);
    playUISound('notification');
    panel.style.display = 'block';
    panel.classList.add('panel-show');
    setTimeout(() => panel.classList.remove('panel-show'), 300);
}

export function hidePanel(panel) {
    if (!panel) return;
    console.log('Hiding panel:', panel.id);
    panel.style.display = 'none';
}

export function hidePanelById(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        hidePanel(panel);
    }
}

// Export for global access (utility functions only)
window.togglePanel = togglePanel;
window.showPanel = showPanel;
window.hidePanel = hidePanel;
window.hidePanelById = hidePanelById; 