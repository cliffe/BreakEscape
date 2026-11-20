/**
 * Small rules for combat input (7.1i; m06, m05 M5).
 *
 * Interacting with a hostile NPC gave no feedback; it now shows a short toast.
 * (The fists-mode click rule that lived here went with the mode toggle: click
 * and tap always move or interact, and punches have their own button and keys.)
 *
 * Kept free of imports so it can be tested in isolation.
 */

/**
 * "He's past talking." for an NPC known to be male, "She's" for female,
 * "They're" when the NPC has no gender information. Uses npc.gender when set,
 * otherwise the male_/female_ sprite sheet prefix.
 * @param {object|null} npc - NPC entry from the NPC manager
 */
export function pastTalkingMessage(npc) {
  return `${subjectContraction(npc)} past talking.`;
}

/** "He's", "She's" or "They're", by the same rule as pastTalkingMessage. */
function subjectContraction(npc) {
  const gender = String(npc?.gender || '').toLowerCase();
  const sheet = String(npc?.spriteSheet || '');
  if (gender === 'female' || gender === 'f' || (!gender && sheet.startsWith('female_'))) return "She's";
  if (gender === 'male' || gender === 'm' || (!gender && sheet.startsWith('male_'))) return "He's";
  return "They're";
}

/**
 * Toast text for an NPC turning hostile from an ink #hostile tag:
 * "Kemal Aydin turns on you. He's coming for you!" Uses the display name, never the raw id
 * (the id is only the last fallback when the NPC can't be found).
 * @param {object|null} npc - NPC entry from the NPC manager
 * @param {string} npcId
 */
export function hostileTurnMessage(npc, npcId) {
  const name = npc?.displayName || npc?.name || npcId;
  return `${name} turns on you. ${subjectContraction(npc)} coming for you!`;
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
