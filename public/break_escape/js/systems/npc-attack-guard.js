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
