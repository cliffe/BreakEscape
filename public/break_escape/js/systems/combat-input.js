/**
 * Small rules for combat input (7.1i; m06, m05 M5).
 *
 * In fists mode (jab or cross) a click used to throw a punch wherever it
 * landed, so the player couldn't click to walk away until they pressed Q
 * again. Now a click punches only when it lands on an NPC or close to the
 * player; a click on open floor walks there.
 *
 * Interacting with a hostile NPC gave no feedback; it now shows a short toast.
 *
 * Kept free of imports so it can be tested in isolation.
 */

// A click within this distance (px) of the player's sprite centre punches.
export const FISTS_PUNCH_CLICK_RADIUS = 64;

/**
 * Whether a click in fists mode throws a punch (true) or walks (false).
 * @param {object} p
 * @param {number} p.dx - click x minus player x
 * @param {number} p.dy - click y minus player y
 * @param {boolean} p.onNPC - the click landed on an NPC sprite
 * @param {number} [p.radius]
 */
export function fistsClickPunches({ dx, dy, onNPC, radius = FISTS_PUNCH_CLICK_RADIUS }) {
  if (onNPC) return true;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * "He's past talking." for an NPC known to be male, "She's" for female,
 * "They're" when the NPC has no gender information. Uses npc.gender when set,
 * otherwise the male_/female_ sprite sheet prefix.
 * @param {object|null} npc - NPC entry from the NPC manager
 */
export function pastTalkingMessage(npc) {
  const gender = String(npc?.gender || '').toLowerCase();
  const sheet = String(npc?.spriteSheet || '');
  if (gender === 'female' || gender === 'f' || (!gender && sheet.startsWith('female_'))) return "She's past talking.";
  if (gender === 'male' || gender === 'm' || (!gender && sheet.startsWith('male_'))) return "He's past talking.";
  return "They're past talking.";
}

let lastToastAt = -Infinity;
const TOAST_GAP_MS = 3000;

/**
 * Show the "past talking" toast for a hostile NPC, at most once every 3 s.
 * @returns {boolean} true if shown
 */
export function showPastTalkingToast(npcId, deps = {}) {
  const now = typeof deps.now === 'number' ? deps.now : Date.now();
  if (now - lastToastAt < TOAST_GAP_MS) return false;
  const w = typeof window !== 'undefined' ? window : {};
  const notify = deps.notify ?? w.showNotification;
  if (typeof notify !== 'function') return false;
  const npc = deps.npc ?? w.npcManager?.getNPC?.(npcId) ?? null;
  lastToastAt = now;
  try {
    notify(pastTalkingMessage(npc), 'warning', '', 2500);
  } catch (err) {
    console.warn('Past-talking toast failed:', err);
  }
  return true;
}
