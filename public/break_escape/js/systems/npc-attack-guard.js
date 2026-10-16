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

// Minigames that pause hostile NPC attacks (7.1b; m04 E2, m07 U12): the phone,
// a conversation and a cutscene (cutscenes are person-chat). A hit used to land
// from a windup that began before one opened, and the damage then closed it, so
// HaX's fight texts could not be read mid-fight. Other minigames (a lock, a
// terminal) still get closed by a hit, so the player can run or fight.
const PAUSING_SCENES = new Set(['phone-chat', 'person-chat', 'title-screen']);

// After a pausing minigame closes, attacks wait this long so the player can
// step away before the next windup.
export const ATTACK_RESUME_GRACE_MS = 800;

/**
 * True while the phone, a conversation or a cutscene is open: no hostile NPC
 * starts a windup, and a windup already running doesn't land.
 * @param {object} [deps] - overridable for tests
 * @returns {boolean}
 */
export function attacksPausedByUI(deps = {}) {
  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;
  return PAUSING_SCENES.has(current._sceneType) || current.params?.cutscene === true;
}
