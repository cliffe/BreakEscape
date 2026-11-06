/**
 * Minigame starter registry: object type -> the function that opens that minigame.
 *
 * Three scenario routes open a minigame from this one table:
 *   1. an object of that `type` (systems/interactions.js),
 *   2. an ink tag `# trigger_minigame:<type>[|key=value...]` (minigames/helpers/chat-helpers.js),
 *   3. an event mapping `openMinigame` action (systems/npc-manager.js).
 *
 * Every entry takes an object-like and an options bag:
 *   start(obj, options)   obj = { scenarioData: { type, name, minigameData } }
 *                         (a bare { minigameData, name, setGlobalPrefix } is wrapped to that)
 *   options               { onComplete, returnTo, ... } as the starters already take them
 *
 * Entries named by `fn` look the starter up on `window` when called, so the registry loads
 * without the starters and tests can stub them. `unavailable` is the alert shown when that
 * starter is missing, the text interactions.js showed before the registry existed.
 */

import { startExerciseStation } from './exercise-station-starter.js';

const win = () => (typeof window !== 'undefined' ? window : {});
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const BUILT_IN = {
    'case-file':           { fn: 'startIntelBoardMinigame',     unavailable: 'Case file unavailable.' },
    'osint-workstation':   { fn: 'startOsintBrowserMinigame',   unavailable: 'Workstation unavailable.' },
    'triage-workstation':  { fn: 'startInboxTriageMinigame',    unavailable: 'Workstation unavailable.' },
    'authenticator-device': { fn: 'startAuthenticatorDevice',   unavailable: 'Authenticator unavailable.' },
    'kiosk':               { fn: 'startEpisodeRunner',          unavailable: 'Kiosk unavailable.' },
    'page-builder':        { fn: 'startLandingPageBuilder',     unavailable: 'Page builder unavailable.' },
    'report-workstation':  { fn: 'startEngagementReport',       unavailable: 'Report workstation unavailable.' },
    'mail_terminal':       { fn: 'startMailClientMinigame',     unavailable: 'Mail terminal unavailable.' },
    'exercise-station':    { start: startExerciseStation,        unavailable: 'Station unavailable.' }
};

const registry = new Map(Object.entries(BUILT_IN));

/** Add or replace an entry: { fn } (a window starter) or { start } (a function), plus unavailable. */
export function registerMinigameStarter(type, entry) {
    if (typeof type !== 'string' || !type || !isObj(entry) || (!entry.fn && typeof entry.start !== 'function')) return false;
    registry.set(type, entry);
    return true;
}

export function hasMinigameStarter(type) {
    return typeof type === 'string' && registry.has(type);
}

export function listMinigameTypes() {
    return [...registry.keys()];
}

/** Wrap a bare object-like so starters can read obj.scenarioData.minigameData. */
export function asObjectLike(type, obj) {
    if (isObj(obj?.scenarioData)) return obj;
    const { minigameData, name, ...rest } = isObj(obj) ? obj : {};
    return {
        name,
        scenarioData: { ...rest, type, name, minigameData: isObj(minigameData) ? minigameData : {} },
        minigameData: isObj(minigameData) ? minigameData : {}
    };
}

/**
 * Open the minigame registered for `type`. Returns false for an unknown type (nothing
 * happens), true once the starter was called (or its absence was alerted).
 */
export function startRegisteredMinigame(type, obj, options = {}) {
    const entry = registry.get(type);
    if (!entry) return false;
    const target = asObjectLike(type, obj);
    const start = typeof entry.start === 'function' ? entry.start : win()[entry.fn];
    if (typeof start !== 'function') {
        win().gameAlert?.(entry.unavailable || 'Unavailable.', 'error', 'Error', 3000);
        return true;
    }
    start(target, options);
    return true;
}
