/**
 * Closes the open minigame (lockpicking, person-chat, terminals and so on) when
 * the player takes damage, so the player gets control back and can run or fight.
 *
 * It closes through the same path as Esc: the minigame's own complete(false),
 * which fires minigame_failed and runs endMinigame (cleanup, input restored,
 * onComplete(false)). A lockpick attempt is simply abandoned. If the instance has
 * no complete(), the framework's forceCloseMinigame() does the same end.
 *
 * Deliberately closes minigames opened with disableClose too: a forced scripted
 * conversation is no reason to leave the player defenceless. No scenario or
 * engine path damages the player on purpose except an attacking NPC.
 *
 * Kept free of imports so it can be tested in isolation.
 *
 * @param {number} amount - damage dealt (only amount > 0 counts)
 * @param {object} [deps] - overridable for tests
 * @returns {boolean} true if a minigame was closed
 */
export function closeMinigameOnDamage(amount, deps = {}) {
  if (typeof amount !== 'number' || !(amount > 0)) return false;

  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;

  const notify = deps.notify ?? (typeof window !== 'undefined' ? window.showNotification : null);

  try {
    if (typeof current.complete === 'function') {
      current.complete(false);
    } else {
      framework.forceCloseMinigame();
    }
  } catch (err) {
    console.error('Failed to close minigame on player damage:', err);
    // Last resort so the player is never stuck behind the minigame
    try { framework.forceCloseMinigame(); } catch (e) { /* nothing more to do */ }
  }

  try {
    if (typeof notify === 'function') {
      notify('You were attacked!', 'warning', '', 3000);
    }
  } catch (err) {
    console.warn('Damage notice failed:', err);
  }
  return true;
}
