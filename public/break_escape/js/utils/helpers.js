// Helper utility functions for the game
import { gameAlert } from '../systems/notifications.js';

// Introduce the scenario to the player
export function introduceScenario() {
    const gameScenario = window.gameScenario;
    if (!gameScenario) return;

    // "on_resume" means: skip the notes brief on a fresh start (the NPC briefing
    // cutscene handles it), and only show it when resuming a saved session.
    if (gameScenario.show_scenario_brief === 'on_resume' && !window.breakEscapeConfig?.hasProgress) {
        console.log('📋 Skipping scenario brief — first play, NPC briefing will handle it');
        return;
    }

    console.log(gameScenario.scenario_brief);
    
    // Add scenario brief as a regular note
    window.addNote("Mission Brief", gameScenario.scenario_brief, false);
    
    // Show mission brief via notes minigame if available, otherwise fallback to alert
    if (window.showMissionBrief) {
        // Delay slightly to ensure the game is fully loaded
        setTimeout(() => {
            window.showMissionBrief();
        }, 500);
    } else {
        // Fallback to old alert system
        gameAlert(gameScenario.scenario_brief, 'info', 'Mission Brief', 0);
    }
}

// Import crypto workstation functions 
import { createCryptoWorkstation, openCryptoWorkstation, closeLaptop, openCryptoWorkstationInNewTab } from './crypto-workstation.js';
import { createLabWorkstation, openLabWorkstation, closeLabWorkstation, openLabWorkstationInNewTab } from './lab-workstation.js';

// Re-export for other modules that import from helpers.js
export { createCryptoWorkstation };

// Generate fingerprint data for biometric samples
export function generateFingerprintData(item) {
    // Generate consistent fingerprint data based on item properties
    const itemId = item.scenarioData?.id || item.name || 'unknown';
    const owner = item.scenarioData?.fingerprintOwner || 'unknown';
    
    // Create a simple hash from the item and owner
    let hash = 0;
    const str = itemId + owner;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use the hash to generate consistent but seemingly random data
    const data = {
        minutiae: Math.abs(hash % 100) + 50, // 50-149 minutiae points
        ridgeCount: Math.abs(hash % 30) + 20, // 20-49 ridges
        pattern: ['loop', 'whorl', 'arch'][Math.abs(hash % 3)],
        quality: (Math.abs(hash % 40) + 60) / 100, // 0.6-0.99 quality
        hash: hash.toString(16)
    };
    
    return data;
}

// Format time for display
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate} ${formattedTime}`;
}

// Check if two positions are approximately equal (within threshold)
export function positionsEqual(pos1, pos2, threshold = 5) {
    return Math.abs(pos1.x - pos2.x) < threshold && Math.abs(pos1.y - pos2.y) < threshold;
}

// Calculate distance between two points
export function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Clamp a value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation between two values
export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Check if a point is within a rectangle
export function isPointInRect(point, rect) {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width && 
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
}

// Deep clone an object
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

// Debounce function calls
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make an element draggable by mouse and touch.
// Switches to absolute positioning on first drag so the note can move freely
// without disrupting surrounding layout.
export function makeDraggable(el) {
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';

    let startX, startY, initLeft, initTop;

    function onStart(e) {
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;

        if (getComputedStyle(el).position !== 'absolute') {
            const r = el.getBoundingClientRect();
            const pr = (el.offsetParent || document.body).getBoundingClientRect();
            el.style.position = 'absolute';
            el.style.margin = '0';
            el.style.left = (r.left - pr.left) + 'px';
            el.style.top = (r.top - pr.top) + 'px';
        }

        // Anchor by top/left only — leaving bottom/right set alongside top/left
        // stretches the element (e.g. a post-it dragged into an "infinitely long" note)
        el.style.bottom = 'auto';
        el.style.right = 'auto';

        initLeft = el.offsetLeft;
        initTop = el.offsetTop;
        startX = point.clientX;
        startY = point.clientY;

        el.style.cursor = 'grabbing';
        el.style.zIndex = '9999';

        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    function onMove(e) {
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        el.style.left = (initLeft + point.clientX - startX) + 'px';
        el.style.top = (initTop + point.clientY - startY) + 'px';
    }

    function onEnd() {
        el.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchend', onEnd);
    }

    el.addEventListener('mousedown', onStart);
    el.addEventListener('touchstart', onStart, { passive: false });
}

// Export functions to global scope for backward compatibility
window.openCryptoWorkstation = openCryptoWorkstation;
window.closeLaptop = closeLaptop;
window.openCryptoWorkstationInNewTab = openCryptoWorkstationInNewTab;
window.openLabWorkstation = openLabWorkstation;
window.closeLabWorkstation = closeLabWorkstation;
window.openLabWorkstationInNewTab = openLabWorkstationInNewTab; 
/**
 * Which lock does this item open?
 *
 * `opens_lock` names the LOCK, not the item -- it is a many-to-one reference, so
 * two spare keys to the same door share one `opens_lock` and keep distinct `id`s.
 * (`id` names the object, `type` names its class.)
 *
 * The `key_id` fallback is BACKWARD COMPATIBILITY ONLY. A game snapshots its
 * scenario_data when it is created (game.rb, before_create
 * :generate_scenario_data_with_context), so missions started before the rename
 * still carry the old field and must keep playing to the end.
 *
 * Scenario files must use `opens_lock`; the validator errors on `key_id`. Never
 * silence a validator error by leaning on this fallback. Once the last
 * pre-rename game has finished, drop the `?? data.key_id` and this note.
 */
export function lockRef(data) {
    return data?.opens_lock ?? data?.key_id;
}
window.lockRef = lockRef;
