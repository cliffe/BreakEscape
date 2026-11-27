/**
 * The event-mapping `openMinigame` action.
 *
 *   { "eventPattern": "global_variable_changed:intro_done", "onceOnly": true,
 *     "openMinigame": { "type": "exercise-station",
 *                       "minigameData": { "exerciseId": "phish_sort", "setGlobalPrefix": "drill_" } } }
 *
 * `openMinigame` is a registry type (systems/minigame-registry.js) or an object of
 * { type, minigameData?, name? }. The mapping's own onceOnly, maxTriggers, cooldown, condition
 * and delayMs decide whether and when it fires, exactly as for the conversation actions; this
 * only does the opening. It waits for any minigame that is open (a conversation closing, a
 * scripted call) and opens after it, giving up after about a minute. Unknown types warn and do
 * nothing.
 */

import { hasMinigameStarter, startRegisteredMinigame } from './minigame-registry.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const OPEN_DELAY_MS = 400;
export const RETRY_MS = 500;
export const MAX_ATTEMPTS = 120;

/** The { type, minigameData, name } a mapping's openMinigame names, or null. */
export function normaliseOpenMinigame(raw) {
    if (typeof raw === 'string' && raw) return { type: raw, minigameData: {} };
    if (isObj(raw) && typeof raw.type === 'string' && raw.type) {
        return {
            type: raw.type,
            minigameData: isObj(raw.minigameData) ? raw.minigameData : {},
            ...(typeof raw.name === 'string' ? { name: raw.name } : {})
        };
    }
    return null;
}

/**
 * Open the mapping's minigame once nothing else is open.
 * @param {*} raw the mapping's openMinigame value
 * @param {Object} [opts] { onNormalClose(), schedule(fn, ms), win }
 * @returns {boolean} false when the value or type is unusable (warned), else true
 */
export function openMinigameFromMapping(raw, opts = {}) {
    const w = opts.win || (typeof window !== 'undefined' ? window : {});
    const schedule = opts.schedule || ((fn, ms) => setTimeout(fn, ms));
    const spec = normaliseOpenMinigame(raw);
    if (!spec) {
        console.warn('[event mapping] openMinigame needs a type (a string, or { type, minigameData })', raw);
        return false;
    }
    if (!hasMinigameStarter(spec.type)) {
        console.warn(`[event mapping] openMinigame: unknown minigame type "${spec.type}"; nothing opened`);
        return false;
    }
    let attempts = 0;
    const attempt = () => {
        const fw = w.MinigameFramework;
        const busy = (fw?.currentMinigame && !fw.currentMinigame._ending) || w.playerIsKnockedOut?.();
        if (busy) {
            if (++attempts > MAX_ATTEMPTS) {
                console.warn(`[event mapping] openMinigame ${spec.type}: another minigame stayed open; gave up`);
                return;
            }
            schedule(attempt, RETRY_MS);
            return;
        }
        startRegisteredMinigame(spec.type, { name: spec.name, minigameData: spec.minigameData }, {
            onComplete: (success, result) => {
                if (success === true && !(result && result.aborted === true)) opts.onNormalClose?.();
            }
        });
    };
    schedule(attempt, OPEN_DELAY_MS);
    return true;
}

// npc-manager.js reaches this through window, so it loads without the registry.
if (typeof window !== 'undefined') window.openMinigameFromMapping = openMinigameFromMapping;
