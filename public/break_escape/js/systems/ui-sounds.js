/**
 * UI Sound Integration Helper
 * Provides convenience methods to attach sound effects to DOM elements and game interactions
 */

/**
 * Attach click sound to a DOM element
 * @param {HTMLElement} element - The element to add sound to
 * @param {string} soundType - Type: 'click', 'confirm', 'alert', 'reject', or specific sound name
 */
export function attachUISound(element, soundType = 'click') {
    if (!element) return;
    
    element.addEventListener('click', () => {
        playUISound(soundType);
    });
}

/**
 * Attach sounds to all buttons with a specific class
 * @param {string} className - The CSS class to target
 * @param {string} soundType - Type of sound to play
 */
export function attachUISoundsToClass(className, soundType = 'click') {
    const elements = document.querySelectorAll(`.${className}`);
    elements.forEach(element => {
        attachUISound(element, soundType);
    });
}

// The electric strike of a door that releases for a badge: every RFID lock that opens, and a
// gate door with an RFID lock, whoever opens it (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 2)
export const DOOR_RELEASE_SOUND = 'rfid_unlock';
export const DOOR_RELEASE_VOLUME = 0.9;

/**
 * Play an audio key the sound manager does not list, straight from the scene's
 * sound system, when the game has it loaded. Honours the manager's on/off switch
 * and master volume. Returns true when it played.
 */
export function playLoadedAudio(key, volume, soundManager = window.soundManager) {
    if (soundManager && soundManager.enabled === false) return false;
    const scene = window.game;
    const sound = scene?.sound;
    if (!sound || !scene.cache?.audio?.exists?.(key)) {
        console.warn(`Sound not found: ${key}`);
        return false;
    }
    const s = sound.get?.(key) || sound.add(key);
    s.play({ volume: volume * (soundManager?.masterVolume ?? 1) });
    return true;
}

/**
 * Play a UI sound
 * @param {string} soundType - Type: 'click', 'confirm', 'alert', 'reject', 'notification', 'interaction', etc.
 * @param {{volume?: number, key?: string}} [opts] - 'door_release' only: the volume (default
 *   DOOR_RELEASE_VOLUME) and another sound key in place of DOOR_RELEASE_SOUND
 */
export function playUISound(soundType = 'click', opts = {}) {
    const soundManager = window.soundManager;
    if (!soundManager) {
        console.warn('Sound Manager not initialized');
        return;
    }

    switch (soundType) {
        case 'click':
            soundManager.playUIClick();
            break;
        case 'confirm':
            soundManager.play('ui_confirm');
            break;
        case 'alert':
            soundManager.play('ui_alert_1');
            break;
        case 'reject':
            soundManager.play('ui_reject');
            break;
        case 'notification':
            soundManager.playUINotification();
            break;
        case 'item':
            soundManager.playItemInteract();
            break;
        case 'lock':
            soundManager.playLockInteract();
            break;
        case 'keypad':
            soundManager.play('keypad_beep', { volume: 0.25 });
            break;
        case 'card_scan':
            soundManager.play('card_scan');
            break;
        case 'hit':
            soundManager.play('hit_impact');
            break;
        case 'objective_complete':
            soundManager.play('ui_confirm');
            break;
        case 'door_release': {
            const key = opts?.key || DOOR_RELEASE_SOUND;
            const volume = Number.isFinite(opts?.volume) ? opts.volume : DOOR_RELEASE_VOLUME;
            // A gate's own "sound" can name any loaded audio key, not only the sound
            // manager's fixed list (sound-manager.js), as the old inline play could
            if (soundManager.sounds && !soundManager.sounds[key]) playLoadedAudio(key, volume, soundManager);
            else soundManager.play(key, { volume });
            break;
        }
        default:
            // Try to play as-is
            soundManager.play(soundType);
            break;
    }
}

// Expose globally for use in non-module contexts (e.g., objectives-manager, minigames)
window.playUISound = playUISound;

/**
 * Attach notification sound to an element
 */
export function attachNotificationSound(element) {
    if (!element) return;
    element.addEventListener('click', () => {
        playUISound('notification');
    });
}

/**
 * Attach item interaction sound
 */
export function attachItemSound(element) {
    if (!element) return;
    element.addEventListener('click', () => {
        playUISound('item');
    });
}

/**
 * Attach lock interaction sound
 */
export function attachLockSound(element) {
    if (!element) return;
    element.addEventListener('click', () => {
        playUISound('lock');
    });
}

/**
 * Attach confirm sound
 */
export function attachConfirmSound(element) {
    if (!element) return;
    element.addEventListener('click', () => {
        playUISound('confirm');
    });
}

/**
 * Attach reject/error sound
 */
export function attachRejectSound(element) {
    if (!element) return;
    element.addEventListener('click', () => {
        playUISound('reject');
    });
}

/**
 * Play special game sounds
 */
export function playGameSound(soundName) {
    const soundManager = window.soundManager;
    if (soundManager) {
        soundManager.play(soundName);
    }
}

/**
 * Play door knock sound
 */
export function playDoorKnock() {
    playGameSound('door_knock');
}

/**
 * Play chair roll sound
 */
export function playChairRoll() {
    playGameSound('chair_roll');
}

/**
 * Play message received sound
 */
export function playMessageReceived() {
    playGameSound('message_received');
}
