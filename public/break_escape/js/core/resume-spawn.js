// Where the player spawns after a reload (batch 13, E13 kiosk).
//
// A fresh game puts the player at the scenario's `startPosition` in `startRoom`, and so does a
// reload: the game has no saved player position. An awareness episode played at a kiosk wants a
// reloaded learner back by the kiosk, not at the room's entrance. A scenario opts in with a
// top-level key, in the same tile units as `startPosition`:
//
//   "resumeSpawn": { "x": 6, "y": 3.2, "whenGlobal": "episode_e13_ai_assistant_state" }
//
// It applies only to a resumed game (the server sent saved globals) and, when `whenGlobal` is
// named, only once that global is set (true, a non-zero number, a non-empty string or list, or an
// object with at least one key). The room is always `startRoom`. Without the key, or on a fresh
// game, nothing changes: missions m01-m10 never author it.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Whether a global's value counts as "set" for `whenGlobal`. */
export function globalIsSet(value) {
    if (value === true) return true;
    if (isNum(value)) return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (isObj(value)) return Object.keys(value).length > 0;
    return false;
}

/**
 * The tile position to spawn at after a reload, or null for the usual spawn.
 * @param {object} scenario  the bootstrap scenario (resumeSpawn, savedGlobalVariables)
 * @param {object} globals   the live globals after the saved ones were merged in
 * @returns {{x:number, y:number} | null}
 */
export function resumeSpawnFor(scenario, globals) {
    const spec = scenario?.resumeSpawn;
    if (!isObj(spec) || !isNum(spec.x) || !isNum(spec.y)) return null;
    const saved = scenario?.savedGlobalVariables;
    if (!isObj(saved) || Object.keys(saved).length === 0) return null; // a fresh game
    if (typeof spec.whenGlobal === 'string' && spec.whenGlobal) {
        const value = isObj(globals) && spec.whenGlobal in globals ? globals[spec.whenGlobal] : saved[spec.whenGlobal];
        if (!globalIsSet(value)) return null;
    }
    return { x: spec.x, y: spec.y };
}
