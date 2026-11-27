/**
 * Scenario costume actions: `set_costume` / `clear_costume` (apply-actions.js).
 *
 * A scenario declares an open map of costumes at its top level:
 *
 *   "disguises": { "alpha": { "sprite": "<atlas key>", "talk": "<optional talk png>" }, ... }
 *
 * `set_costume: "<id>"` puts the named costume on the player's avatar (utils/player-costume.js)
 * and writes the persisted global `pp_disguise` = the id. `clear_costume` takes it off and
 * writes `pp_disguise` = "". player-costume.js keeps what is being worn in module-local state
 * that a reload loses, so `reapplyPersistedCostume()` re-dresses the avatar from the global once
 * the player sprite exists (core/game.js calls it right after createPlayer).
 *
 * Generic on purpose: the module neither knows nor cares what a costume means to the story.
 * Anything that reacts to it reads `globalVars.pp_disguise` or listens for
 * `global_variable_changed:pp_disguise`.
 *
 * Test seams (second argument): `scenario`, `globals`, `applyCostume`, `removeCostume`,
 * `write` (replaces writeGlobal), `costumeDeps` (forwarded to player-costume.js).
 */
import { writeGlobal } from './global-writer.js';

export const DISGUISE_KEY = 'pp_disguise';

const win = () => (typeof window !== 'undefined' ? window : {});
const isStr = (v) => typeof v === 'string' && v.length > 0;

async function costumeModule() {
    return import('../utils/player-costume.js');
}

/** The registry entry for an id, or null. */
export function disguiseFor(id, scenario = win().gameScenario) {
    if (!isStr(id)) return null;
    const map = scenario?.disguises;
    if (!map || typeof map !== 'object') return null;
    const entry = map[id];
    return entry && typeof entry === 'object' && isStr(entry.sprite) ? entry : null;
}

function record(id, deps) {
    const write = deps.write ?? ((k, v) => writeGlobal(k, v, { emitAlways: false, openChat: false }));
    write(DISGUISE_KEY, id);
    // Flush now rather than wait for the 30 s sync, so a quick reload still finds it.
    try { win().stateSync?.sync?.(); } catch (e) { /* sync is best effort */ }
}

/** Put the named costume on and remember it. Returns true when the sprite was swapped. */
export async function setCostume(id, deps = {}) {
    const entry = disguiseFor(id, deps.scenario);
    if (!entry) {
        console.warn('[costume] set_costume: no such costume in scenario.disguises:', id);
        return false;
    }
    const apply = deps.applyCostume ?? (await costumeModule()).applyCostume;
    const ok = await apply({ sprite: entry.sprite, talk: entry.talk }, deps.costumeDeps);
    if (!ok) return false;
    record(id, deps);
    console.log('[costume] set_costume', id);
    return true;
}

/** Take the costume off and clear the global. Returns true when a costume was removed. */
export async function clearCostume(deps = {}) {
    const remove = deps.removeCostume ?? (await costumeModule()).removeCostume;
    const ok = await remove(deps.costumeDeps);
    record('', deps); // cleared even if nothing was on, so the global never lies
    if (ok) console.log('[costume] clear_costume');
    return ok;
}

/**
 * After a reload: re-apply the costume named by the restored `pp_disguise` global. Does nothing
 * when it is empty or names a costume the scenario no longer has. Returns true when re-applied.
 */
export async function reapplyPersistedCostume(deps = {}) {
    const globals = deps.globals ?? win().gameState?.globalVariables;
    const id = globals?.[DISGUISE_KEY];
    if (!isStr(id)) return false;
    const entry = disguiseFor(id, deps.scenario);
    if (!entry) return false;
    const apply = deps.applyCostume ?? (await costumeModule()).applyCostume;
    const ok = await apply({ sprite: entry.sprite, talk: entry.talk }, deps.costumeDeps);
    if (ok) console.log('[costume] re-applied persisted costume', id);
    return ok;
}

if (typeof window !== 'undefined') {
    window.costumeActions = { setCostume, clearCostume, reapplyPersistedCostume, disguiseFor };
}
