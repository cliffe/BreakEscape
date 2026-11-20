/**
 * A forced minigame (opened with disableClose, e.g. the closing debrief or a scripted
 * cutscene conversation) must not be ended by starting something else from the
 * inventory. The full-screen minigame overlay normally covers the inventory bar, so a
 * real click can't reach it, but a click that does get through (a scripted DOM click
 * did, in m02 playtest M1, and skipped the debrief) is ignored rather than allowed to
 * replace the conversation.
 *
 * Kept free of imports so it can be tested in isolation.
 *
 * @param {object} [deps] - overridable for tests
 * @returns {boolean} true if inventory clicks should be ignored right now
 */
export function inventoryBlockedByForcedMinigame(deps = {}) {
  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;
  return current.params?.disableClose === true;
}
