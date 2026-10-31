/**
 * Whether hostile NPCs may attack the player right now.
 *
 * Once the player is knocked out, NPCs stop: no new windup, and a windup already
 * running doesn't land. Without this a hostile NPC began a fresh attack windup
 * about 0.4 s after the player's KO, and a minigame could open over the KO screen
 * (m02 playtest CF-D).
 *
 * Kept free of imports so it can be tested in isolation.
 *
 * @param {object} [deps] - overridable for tests
 * @returns {boolean}
 */
export function playerCanBeAttacked(deps = {}) {
  const health = deps.playerHealth ?? (typeof window !== 'undefined' ? window.playerHealth : null);
  if (health && typeof health.isKO === 'function' && health.isKO()) {
    return false;
  }
  return true;
}

// Minigames that pause hostile NPC attacks (7.1b; m04 E2): a conversation and
// a cutscene (cutscenes are person-chat). A hit used to land from a windup that
// began before one opened, and the damage then closed it. Other minigames (a
// lock, a terminal) still get closed by a hit, so the player can run or fight.
//
// The phone is not here (m07 U12, 2026-10-17): pausing attacks while it was
// open made it a free shield, since the player can open it anywhere. Instead
// attacks carry on and a hit no longer closes it (player-damage-interrupt.js),
// so HaX's fight texts can be read at the cost of the hits taken meanwhile.
const PAUSING_SCENES = new Set(['person-chat', 'title-screen']);

// Minigames hostile NPCs keep attacking through (phone texts, not a cutscene).
const ATTACKABLE_SCENES = new Set(['phone-chat']);

// After a pausing minigame closes, attacks wait this long so the player can
// step away before the next windup.
export const ATTACK_RESUME_GRACE_MS = 800;

/**
 * R13: true while the player is on the VM (launcher, flag station, VM Controls
 * overlay, or the page hidden or out of focus): see vm-context-pause.js, which
 * sets window.isVmContextActive. Read through window so this file stays free of
 * imports. No attack starts then, and a windup already running doesn't land.
 * @param {object} [deps] - deps.vmContextActive overrides for tests
 */
function vmContextActive(deps) {
  if (typeof deps.vmContextActive === 'boolean') return deps.vmContextActive;
  if (typeof deps.vmContextActive === 'function') return !!deps.vmContextActive();
  if ('framework' in deps) return false; // a test that injects the framework only
  const fn = typeof window !== 'undefined' ? window.isVmContextActive : null;
  return typeof fn === 'function' ? !!fn() : false;
}

/**
 * True while a conversation or a cutscene is open: no hostile NPC starts a
 * windup, and a windup already running doesn't land.
 * @param {object} [deps] - overridable for tests
 * @returns {boolean}
 */
export function attacksPausedByUI(deps = {}) {
  if (vmContextActive(deps)) return true;
  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;
  return PAUSING_SCENES.has(current._sceneType) || current.params?.cutscene === true;
}

/**
 * True while an open minigame stops hostile NPCs starting an attack (npc-combat
 * canAttack): any minigame except the phone, unless the phone is a cutscene.
 * @param {object} [deps] - overridable for tests
 * @returns {boolean}
 */
export function minigameBlocksAttacks(deps = {}) {
  if (vmContextActive(deps)) return true;
  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current) return false;
  if (current.params?.cutscene === true) return true;
  return !ATTACKABLE_SCENES.has(current._sceneType);
}
