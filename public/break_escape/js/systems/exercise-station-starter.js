/**
 * Exercise station starter: one object type for five exercise scenes.
 *
 * An object `{ "type": "exercise-station", "minigameData": { ... } }` opens one of the
 * scenes the awareness episode runner also uses:
 *
 *   sort-drill, concern-form, privacy-panel, assistant-chat, password-guesser
 *
 * minigameData:
 *   scene           one of the five (optional when exerciseId names an entry that has one)
 *   exerciseId      an id in scenario.social.exercises[] ({ id, scene, config, setGlobalPrefix? })
 *   config          an inline config instead; an inline config wins when both are given, so a
 *                   station can override a shared exercise
 *   setGlobalPrefix prefix for the result globals (needed to gate anything on the station)
 *   skin            optional 'awareness' skin for the scene
 *
 * The config shapes are the scenes' own (the same blocks an episode carries under sortDrill,
 * concernForm, privacyPanel, assistant and guess).
 *
 * A finished run writes, through the shared writer (so ink and the listeners see them):
 *   <prefix>done      true, never cleared
 *   <prefix>percent   a scored scene's best percent (sort-drill with scoring on)
 * and emits `<scene>_completed` (hyphens as underscores: sort_drill_completed ...) with
 * { exerciseId, scene, prefix, percent?, result }, so doors, objectives and event mappings can
 * wait on either. The password guesser also writes its own config.landedGlobal.
 *
 * What counts as finished: a normal close of sort-drill, concern-form and privacy-panel (they
 * only close normally from Done); a normal close of assistant-chat; the password guesser once
 * every guess has been reached and the rig switched off (result.finished).
 */

import { writeGlobal } from './global-writer.js';
import { socialOverlayParams } from '../minigames/framework/social-overlay.js';

export const EXERCISE_SCENES = Object.freeze(['sort-drill', 'concern-form', 'privacy-panel', 'assistant-chat', 'password-guesser']);

const win = () => (typeof window !== 'undefined' ? window : {});
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const STATION_MISSING = 'This station has no exercise to run.';

/** The completion event for a scene: sort-drill -> sort_drill_completed. */
export function completedEventName(scene) {
    return `${String(scene).replace(/-/g, '_')}_completed`;
}

/**
 * Resolve a station's minigameData to { scene, config, exerciseId, prefix } or { error }.
 * An inline config wins; otherwise the config of social.exercises[exerciseId].
 */
export function resolveExercise(data, scenario = win().gameScenario) {
    const d = isObj(data) ? data : {};
    const list = Array.isArray(scenario?.social?.exercises) ? scenario.social.exercises : [];
    let entry = null;
    if (d.exerciseId !== undefined) {
        entry = list.find((e) => isObj(e) && e.id === d.exerciseId) || null;
        if (!entry) return { error: `exerciseId "${d.exerciseId}" is not in social.exercises` };
    }
    const scene = isStr(d.scene) ? d.scene : entry?.scene;
    if (!EXERCISE_SCENES.includes(scene)) return { error: `scene "${scene}" is not one of ${EXERCISE_SCENES.join(', ')}` };
    if (entry && isStr(d.scene) && isStr(entry.scene) && entry.scene !== d.scene) {
        return { error: `scene "${d.scene}" does not match exercise "${entry.id}" (${entry.scene})` };
    }
    const config = isObj(d.config) ? d.config : (entry && isObj(entry.config) ? entry.config : null);
    if (!config) return { error: 'no config (an inline config, or a social.exercises entry with one)' };
    const prefix = isStr(d.setGlobalPrefix) ? d.setGlobalPrefix : (isStr(entry?.setGlobalPrefix) ? entry.setGlobalPrefix : null);
    return { scene, config, exerciseId: entry ? entry.id : null, prefix };
}

/** Whether a scene's close counts as finishing the exercise. */
export function isFinished(scene, success, result) {
    if (success !== true || (result && result.aborted === true)) return false;
    if (scene === 'password-guesser') return result?.finished === true;
    return true;
}

/** The params the scene starts with. */
export function sceneParams(scene, resolved, data = {}) {
    const params = { config: resolved.config };
    if (isStr(data.skin)) params.skin = data.skin;
    if (scene === 'assistant-chat') params.episodeId = resolved.exerciseId;
    return params;
}

/**
 * Write the result globals and emit the completion event. Returns the names written.
 * Exported so tests can drive it without a browser.
 */
export function recordCompletion(resolved, result, deps = {}) {
    const w = win();
    const write = deps.write || writeGlobal;
    const emit = deps.emit || ((event, data) => w.eventDispatcher?.emit(event, data));
    const globals = deps.globals || w.gameState?.globalVariables || {};
    const written = [];
    const { scene, prefix, exerciseId } = resolved;
    let percent = null;
    if (prefix) {
        write(`${prefix}done`, true, { openChat: false });
        written.push(`${prefix}done`);
        if (typeof result?.percent === 'number' && Number.isFinite(result.percent)) {
            percent = Math.max(result.percent, Number(globals[`${prefix}percent`]) || 0);
            write(`${prefix}percent`, percent, { openChat: false });
            written.push(`${prefix}percent`);
        }
    }
    try { (deps.sync || (() => w.stateSync?.sync?.()))(); } catch (e) { console.warn('[exercise-station] sync failed:', e); }
    emit(completedEventName(scene), {
        exerciseId, scene, prefix,
        ...(percent !== null ? { percent } : {}),
        result: result ?? null
    });
    return written;
}

/**
 * Open the station's scene. `obj` is the object-like ({ scenarioData: { minigameData } }, or
 * { minigameData } straight from the registry). Returns the resolved launch, or null.
 */
export function startExerciseStation(obj, options = {}) {
    const w = win();
    const data = obj?.scenarioData?.minigameData || obj?.minigameData || {};
    const resolved = resolveExercise({ setGlobalPrefix: obj?.scenarioData?.setGlobalPrefix ?? obj?.setGlobalPrefix, ...data });
    if (resolved.error) {
        console.error(`[exercise-station] ${resolved.error}`);
        w.gameAlert?.(STATION_MISSING, 'error', 'Error', 3000);
        return null;
    }
    if (!w.MinigameFramework) {
        console.error('MinigameFramework not available');
        w.gameAlert?.('Station unavailable.', 'error', 'Error', 3000);
        return null;
    }
    if (!w.MinigameFramework.mainGameScene && w.game) w.MinigameFramework.init(w.game);
    const { scene } = resolved;
    const child = w.MinigameFramework.startMinigame(scene, null, socialOverlayParams({
        ...sceneParams(scene, resolved, data),
        ...(options.returnTo ? { returnTo: options.returnTo } : {}),
        onComplete: (success, result) => {
            if (isFinished(scene, success, result)) recordCompletion(resolved, result);
            if (typeof options.onComplete === 'function') options.onComplete(success, result);
        }
    }));
    return child ? resolved : null;
}
