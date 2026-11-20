/**
 * A temporary costume over the learner's avatar (ENG-05b, awareness E12).
 *
 * aw9 (see player-avatar.js): the learner's chosen avatar always wins. A costume is therefore
 * never a new choice. `applyCostume` reads the avatar actually played (chosenPlayerSprite())
 * before it swaps anything and keeps it; `removeCostume` puts that avatar back, and syncs
 * `gameScenario.player` so person-chat's self-view and the HUD agree. It never falls back to
 * the scenario's own `player.spriteSheet`.
 *
 * This module only adds functions. core/player.js and utils/player-avatar.js are unchanged,
 * and nothing here runs unless an episode's `world.costume` asks for it.
 *
 * Costume shape: { sprite: 'aw_hivis_courier_v2', talk: 'assets/characters/aw_hivis_courier_talk.png' }
 * (`talk` optional: the usual `<key>_talk.png` derivation applies without it).
 *
 * Test seams: the second argument may replace `updatePlayerSprite`, `scenario`, `config`,
 * `registry` and `sync`. By default core/player.js is imported on first use, so loading this
 * module costs nothing.
 */
import { chosenPlayerSprite, syncScenarioPlayer } from './player-avatar.js';

const win = () => (typeof window !== 'undefined' ? window : {});
const isStr = (v) => typeof v === 'string' && v.length > 0;

// One costume at a time. null while the avatar is bare.
let worn = null;

async function swapper(deps) {
    if (typeof deps.updatePlayerSprite === 'function') return deps.updatePlayerSprite;
    const mod = await import('../core/player.js');
    return mod.updatePlayerSprite;
}

/** Whether a costume is on right now. */
export function costumeActive() {
    return worn !== null;
}

/** The avatar a costume will hand back to, or null when none is on. */
export function costumeRestoreKey() {
    return worn ? worn.chosen : null;
}

/**
 * Put the costume on. Returns true when the sprite was swapped. A second call while a costume
 * is on swaps to the new costume but keeps the first call's stored avatar, so the chosen avatar
 * is never lost to a costume stacked on a costume.
 */
export async function applyCostume(costume, deps = {}) {
    if (!costume || typeof costume !== 'object' || !isStr(costume.sprite)) return false;
    const w = win();
    const scenario = deps.scenario ?? w.gameScenario;
    const config = deps.config ?? w.breakEscapeConfig;
    const update = await swapper(deps);

    const keep = worn || {
        chosen: chosenPlayerSprite(config, scenario),
        talk: scenario?.player?.spriteTalk
    };
    const ok = await update(costume.sprite);
    if (!ok) return false;
    worn = keep;

    if (isStr(costume.talk)) {
        const p = scenario?.player;
        if (p && typeof p === 'object') p.spriteTalk = costume.talk;
        const registry = deps.registry ?? w.characterRegistry;
        if (registry?.player) registry.player.spriteTalk = costume.talk;
    }
    return true;
}

/**
 * Take the costume off and put the chosen avatar back. Returns true when a costume was on and
 * the avatar is restored. With no costume on it does nothing (so it is safe to call on every exit).
 */
export async function removeCostume(deps = {}) {
    if (!worn) return false;
    const w = win();
    const scenario = deps.scenario ?? w.gameScenario;
    const sync = deps.sync ?? syncScenarioPlayer;
    const { chosen, talk } = worn;
    const update = await swapper(deps);

    // Hand the original talk path back first: syncScenarioPlayer keeps a configured talk image
    // only when it belongs to the sprite played, so the costume's portrait cannot survive.
    if (scenario?.player && typeof scenario.player === 'object') scenario.player.spriteTalk = talk;
    const ok = await update(chosen);
    if (!ok) return false; // still dressed: a later call can retry
    worn = null;
    sync(scenario, chosen);
    const registry = deps.registry ?? w.characterRegistry;
    if (registry?.player) {
        registry.player.spriteSheet = chosen;
        registry.player.spriteTalk = scenario?.player?.spriteTalk ?? registry.player.spriteTalk;
    }
    return true;
}
