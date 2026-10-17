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
 * The phone is the exception (m07 U12, 2026-10-17): a hit leaves it open, with
 * a notice giving the HP left, so HaX's fight texts can be read mid-fight.
 * Hostile NPCs keep attacking while it is open (npc-attack-guard.js), so it is
 * no shield: the player pays for reading in hits, and Esc closes it to fight.
 * A knockout still closes it, so the KO screen isn't under the phone.
 *
 * @param {number} amount - damage dealt (only amount > 0 counts)
 * @param {object} [deps] - overridable for tests; deps.ko: this hit knocked
 *   the player out; deps.hp / deps.maxHP: HP left, for the phone notice
 * @returns {boolean} true if a minigame was closed
 */
// When the last damage close happened (ms). Read by minigameClosedByDamage() so the
// minigame's own failure toasts ("Pick Failed" and the like) can stay quiet: the
// player didn't fail the pick, they were hit (m02 playtest CF-F).
let lastDamageCloseAt = -Infinity;

/**
 * True if a minigame was closed by player damage within the last `withinMs`.
 * onComplete(false) runs synchronously inside the close, so a short window is enough.
 * @param {number} [withinMs=1500]
 * @param {number} [now]
 */
export function minigameClosedByDamage(withinMs = 1500, now = Date.now()) {
  return now - lastDamageCloseAt <= withinMs;
}

export function closeMinigameOnDamage(amount, deps = {}) {
  if (typeof amount !== 'number' || !(amount > 0)) return false;

  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;

  const notify = deps.notify ?? (typeof window !== 'undefined' ? window.showNotification : null);

  if (current._sceneType === 'phone-chat' && current.params?.cutscene !== true && deps.ko !== true) {
    notifyPhoneHit(notify, deps);
    return false;
  }

  // Mark before closing: the failure callbacks run inside complete(false).
  lastDamageCloseAt = typeof deps.now === 'number' ? deps.now : Date.now();

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

// The phone notice repeats at most this often (hits come every ~2 s).
export const PHONE_HIT_NOTICE_MS = 3000;
let lastPhoneNoticeAt = -Infinity;

function notifyPhoneHit(notify, deps) {
  const now = typeof deps.now === 'number' ? deps.now : Date.now();
  if (now - lastPhoneNoticeAt < PHONE_HIT_NOTICE_MS) return;
  lastPhoneNoticeAt = now;
  const health = deps.playerHealth ?? (typeof window !== 'undefined' ? window.playerHealth : null);
  const hp = deps.hp ?? health?.getHP?.();
  const maxHP = deps.maxHP ?? health?.getMaxHP?.();
  const left = Number.isFinite(hp) && Number.isFinite(maxHP) ? ` HP ${hp}/${maxHP}.` : '';
  try {
    if (typeof notify === 'function') {
      notify(`You're being hit!${left} Close the phone (Esc) to fight back.`, 'warning', '', 2500);
    }
  } catch (err) {
    console.warn('Damage notice failed:', err);
  }
}

/**
 * True while the player is knocked out. MinigameFramework.startMinigame refuses
 * to open anything then (m04 confirmation R2 N1): the KO screen comes up a second
 * after the knockout and movement is only locked then, so a phone opened in that
 * second, or by a delayed reopen (bark click, return from the notepad), sat
 * under the KNOCKED OUT screen. Restart resets HP before it reloads.
 * @param {object} [deps] - overridable for tests
 */
export function playerIsKnockedOut(deps = {}) {
  const health = deps.playerHealth ?? (typeof window !== 'undefined' ? window.playerHealth : null);
  try {
    return !!health?.isKO?.();
  } catch (err) {
    return false;
  }
}

/**
 * Close whatever minigame is open when the KO screen shows, whatever it is and
 * however it opened (the knockout hit closes the one open at that moment, but
 * one can open in the second before the screen). Same close path as a hit.
 * @param {object} [deps] - overridable for tests
 * @returns {boolean} true if a minigame was closed
 */
export function closeMinigameForKnockout(deps = {}) {
  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;
  try {
    if (typeof current.complete === 'function') current.complete(false);
    else framework.forceCloseMinigame();
  } catch (err) {
    console.error('Failed to close minigame on knockout:', err);
  }
  // complete() can leave it open (an override that waits, or throws): force it
  if (framework.currentMinigame === current && !current._ending) {
    try { framework.forceCloseMinigame(); } catch (e) { /* nothing more to do */ }
  }
  return true;
}

if (typeof window !== 'undefined') {
  window.minigameClosedByDamage = minigameClosedByDamage;
  window.playerIsKnockedOut = playerIsKnockedOut;
  window.closeMinigameForKnockout = closeMinigameForKnockout;
}
