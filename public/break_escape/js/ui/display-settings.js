/**
 * Player display settings: UI theme override, HUD size and game zoom.
 *
 * Kept in localStorage, so they belong to this browser rather than the player
 * account. The mission's own theme (breakEscapeConfig.uiTheme, from its
 * mission.json) applies whenever the player hasn't picked one.
 *
 * Changing a setting dispatches 'be:display-settings-changed' on window; main.js
 * listens for it to re-run the pixel scaling.
 */

const STORAGE_KEY = 'be_display_settings';

export const UI_THEMES = [
    { id: 'general', label: 'General' },
    { id: 'spy', label: 'Spy' },
    { id: 'cyberpunk', label: 'Cyberpunk' },
    { id: 'crt', label: 'CRT terminal' },
    { id: 'eldritch', label: 'Eldritch runes' },
    { id: 'circuit', label: 'Circuit board' },
    { id: 'secops', label: 'Security ops' },
];

// Steps either side of the automatic choice, in whole pixel-scale units
export const SIZE_STEPS = [
    { value: -1, label: 'Smaller' },
    { value: 0, label: 'Auto' },
    { value: 1, label: 'Larger' },
    { value: 2, label: 'Largest' },
];

const DEFAULTS = { theme: null, hudStep: 0, zoomStep: 0 };

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch (e) {
        return { ...DEFAULTS };
    }
}

let settings = read();

export function getDisplaySettings() {
    return { ...settings };
}

export function missionTheme() {
    return window.breakEscapeConfig?.uiTheme || 'general';
}

function isTheme(id) {
    return UI_THEMES.some(t => t.id === id);
}

export function effectiveTheme() {
    // A ?ui_theme= preview (already applied server-side) beats the player's pick
    const preview = new URLSearchParams(window.location.search).get('ui_theme');
    if (isTheme(preview)) return preview;
    const picked = settings.theme;
    return isTheme(picked) ? picked : missionTheme();
}

export function applyTheme() {
    document.documentElement.dataset.uiTheme = effectiveTheme();
}

export function updateDisplaySettings(changes) {
    settings = { ...settings, ...changes };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        // Private windows and blocked storage: the change still applies this session
    }
    applyTheme();
    window.dispatchEvent(new CustomEvent('be:display-settings-changed', { detail: getDisplaySettings() }));
}
