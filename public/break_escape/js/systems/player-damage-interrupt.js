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

// When the player was last hit, on the performance clock (the phone ringer's clock, phone calls
// plan 2.3 rows 16, 22 and 26). Stamped on every hit, whether or not a minigame was open.
let lastPlayerHitAtMs = null;

// When the player was last hit (ms since the epoch), whether or not a minigame was open. Read by
// the container return (container-minigame.js containerReturnBlocked): a hit in the moment between
// a reader closing and its container reopening keeps the player in the world. The epoch is a
// different clock from lastPlayerHitAtMs above (the ringer's performance clock); both are stamped.
let lastHitAt = -Infinity;

/** Performance-clock time of the last hit on the player, or null if none this session. */
export function lastPlayerHitAt() {
  return lastPlayerHitAtMs;
}

/** Wall-clock (epoch ms) time of the last hit on the player, -Infinity if never. */
export function lastPlayerHitAtWall() {
  return lastHitAt;
}

/** How long after the last hit on the player a fight still counts as on (performance clock ms). */
export const COMBAT_QUIET_MS = 4000;
/** A chaser that stops chasing keeps the fight on this long (no flicker at the aggro edge). */
export const COMBAT_LINGER_MS = 1500;
/** A fight held only by a chaser that makes no progress (not in the player's room, not closing in) stops counting after this long: the hit window then rules. */
export const COMBAT_CHASE_CAP_MS = 20000;

let chaseRunStart = 0;     // when the current unbroken run of chaser sightings began (0: none)
let lastChaserAt = -Infinity;   // the last sample that saw a chaser
let bestDist = Infinity;        // the closest an other-room chaser has been in this run

/** Forget the chase run and the linger (a new game, or a test). */
export function resetCombatState() {
  chaseRunStart = 0;
  lastChaserAt = -Infinity;
  bestDist = Infinity;
}

/**
 * Finds a live hostile NPC chasing the player in a way that counts as a fight. It has to be awake,
 * not hidden by a mapping and not cowering (a cower hostile keeps its distance in chase state
 * without attacking; its hits count through the hit window instead). Returns
 * { kind: 'room' | 'reach', behavior } or null. 'room' is a chaser in the player's room. With
 * deps.anyRoom a chaser in another room also counts, but only as 'reach' and only if it can get to
 * the player (npcCombat.canReachPlayer, or a non-empty chasePath): a hostile held behind a locked
 * door never holds a call. Room-less (no deps.anyRoom) the other-room chaser is skipped.
 * @param {object} [deps] - overridable for tests: behaviors, hostileSystem, npcManager, playerRoom,
 *   anyRoom, canReach(behavior)
 */
function findChaser(deps = {}) {
  const w = typeof window !== 'undefined' ? window : {};
  const hostile = deps.hostileSystem ?? w.npcHostileSystem;
  const behaviors = deps.behaviors ?? w.npcBehaviorManager?.behaviors;
  if (!hostile || !behaviors) return null;
  const manager = deps.npcManager ?? w.npcManager;
  const playerRoom = deps.playerRoom ?? w.currentPlayerRoom;
  const list = typeof behaviors.values === 'function' ? behaviors.values() : behaviors;
  let found = null;
  for (const behavior of list) {
    if (!behavior || behavior.currentState !== 'chase') continue;
    const id = behavior.npcId;
    let kind = 'room';
    try {
      if (behavior.config?.hostile?.fightStyle === 'cower') continue;
      if (typeof playerRoom === 'string' && behavior.roomId && behavior.roomId !== playerRoom) {
        if (!deps.anyRoom) continue;
        kind = 'reach';
        let reach = Array.isArray(behavior.chasePath) && behavior.chasePath.length > 0;
        if (typeof deps.canReach === 'function') reach = reach || !!deps.canReach(behavior);
        else if (w.npcCombat?.canReachPlayer && behavior.sprite) reach = reach || !!w.npcCombat.canReachPlayer(behavior.sprite);
        if (!reach) continue;
      }
      if (!hostile.isNPCHostile?.(id) || hostile.isNPCKO?.(id)) continue;
      if (manager?.isHiddenByMapping?.(id)) continue;
    } catch (err) { continue; }
    if (kind === 'room') return { kind, behavior };
    found = found || { kind, behavior };
  }
  return found;
}

/**
 * Is a live hostile NPC chasing the player in the player's room (the fighting pose, player-poses.js)?
 * With deps.anyRoom it also counts a chaser in another room that can reach the player (the combat
 * hold sets it, so a call never starts and is then pulled back when the player leaves the room
 * with the chaser still after them).
 * @param {object} [deps] - see findChaser
 */
export function playerHasChaser(deps = {}) {
  return !!findChaser(deps);
}

/** Straight-line distance from a chaser to the player, or null when positions are unknown. */
function chaserDistance(behavior, deps) {
  if (typeof deps.distanceOf === 'function') return deps.distanceOf(behavior);
  const w = typeof window !== 'undefined' ? window : {};
  const s = behavior?.sprite, p = deps.player ?? w.player;
  if (!s || !p || typeof s.x !== 'number' || typeof p.x !== 'number') return null;
  return Math.hypot(s.x - p.x, s.y - p.y);
}

/**
 * True while the player is in a fight: a live hostile NPC is chasing the player, in any room (its
 * chase state covers the attack swing) or the player took a hit in the last COMBAT_QUIET_MS.
 * Scripted phone chats and calls wait on this (npc-manager.js _queueScriptedConversation,
 * phone-ringer-dom.js ringBlocked): a popup that locks the world mid-fight leaves the player
 * unable to fight or flee (m04 playtest). Three limits keep a hold from outlasting the fight:
 * a chaser has to be hostile, awake and in chase state (a hostile that gave up stops counting), the chase term
 * lingers COMBAT_LINGER_MS after the last sighting so a leashed guard flipping at its edge does
 * not stutter the hold, and an unbroken chase with no hit stops counting after
 * COMBAT_CHASE_CAP_MS, leaving only the hit window. The player opening their own phone is never
 * asked about this.
 * @param {object} [deps] - overridable for tests: behaviors, hostileSystem, npcManager,
 *   playerRoom, now (performance clock ms)
 */
export function playerInCombat(deps = {}) {
  const t = typeof deps.now === 'number' ? deps.now
    : (typeof performance !== 'undefined' ? performance.now() : Date.now());
  // Sample the chase first, so a run keeps being tracked while a hit holds the fight on
  const chaser = findChaser({ ...deps, anyRoom: true });
  if (chaser) {
    if (!chaseRunStart || t - lastChaserAt > COMBAT_LINGER_MS) { chaseRunStart = t; bestDist = Infinity; }
    // The cap only times a chaser that is getting nowhere. One in the player's room, or one in
    // another room that is closing in, restarts it: kiting a chaser never ends the hold, so a call
    // cannot ring mid-chase and then be pulled back by the next hit.
    const d = chaser.kind === 'room' ? null : chaserDistance(chaser.behavior, deps);
    if (chaser.kind === 'room') chaseRunStart = t;
    else if (typeof d === 'number' && d < bestDist - 4) { if (bestDist !== Infinity) chaseRunStart = t; bestDist = d; }
    lastChaserAt = t;
  } else if (chaseRunStart && t - lastChaserAt > COMBAT_LINGER_MS) {
    chaseRunStart = 0;
  }
  if (playerHitWithin(COMBAT_QUIET_MS, deps.now)) return true;
  if (!chaseRunStart) return false;
  if (t - lastChaserAt > COMBAT_LINGER_MS) return false;
  // Capped: a chaser that has made no progress this long (behind a door it cannot open) is not a fight
  return t - chaseRunStart < COMBAT_CHASE_CAP_MS;
}

/**
 * True if the player was hit within the last `ms` milliseconds (performance clock).
 * @param {number} ms
 * @param {number} [now] - test seam
 */
export function playerHitWithin(ms, now = (typeof performance !== 'undefined' ? performance.now() : 0)) {
  if (typeof lastPlayerHitAtMs !== 'number') return false;
  const d = now - lastPlayerHitAtMs;
  return d >= 0 && d < ms;
}

export function closeMinigameOnDamage(amount, deps = {}) {
  if (typeof amount !== 'number' || !(amount > 0)) return false;
  lastHitAt = typeof deps.now === 'number' ? deps.now : Date.now();

  // Stamp first: the ringer reads it from inside the close below (a forced call's re-ring)
  lastPlayerHitAtMs = typeof deps.perfNow === 'number'
    ? deps.perfNow
    : (typeof performance !== 'undefined' ? performance.now() : null);

  // The knockout hit: the last "You're being hit! HP 1/100" notice goes now, not
  // 4 s later over the KO screen (m06 confirmation R4 M1)
  if (deps.ko === true) dismissPhoneHitNotice();

  const framework = deps.framework ?? (typeof window !== 'undefined' ? window.MinigameFramework : null);
  const current = framework?.currentMinigame;
  if (!current || current._ending) return false;

  const notify = deps.notify ?? (typeof window !== 'undefined' ? window.showNotification : null);

  // A forced call (disableClose) has no Esc, so it closes like any other minigame;
  // a re-ring mapping brings it back at the unanswered choice (finale F14)
  if (current._sceneType === 'phone-chat' && current.params?.cutscene !== true &&
      current.params?.disableClose !== true && deps.ko !== true) {
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

// The phone notice stays up this long after the latest hit. One notice at a time:
// each hit replaces the last with the new HP, so under a beating it stays on screen.
// It used to show for 2.5 s at most once every 3 s, so it was missing for about a
// third of a fight and a screenshot could easily miss it (m06 confirmation R3 N-6-2).
export const PHONE_HIT_NOTICE_MS = 4000;
let lastPhoneToast = null;

/**
 * Take down the phone hit notice, if one is showing. Called when the phone closes
 * (Esc to fight, or the knockout closing it) and when the KO screen shows: it said
 * "Close the phone to fight back", which is no longer true then (m06 R4 M1).
 * @returns {boolean} true if a notice was taken down
 */
export function dismissPhoneHitNotice() {
  const el = lastPhoneToast;
  lastPhoneToast = null;
  if (!el) return false;
  try {
    el.classList?.remove?.('show');
    const drop = () => { try { el.parentNode?.removeChild(el); } catch (e) { /* gone */ } };
    if (typeof setTimeout === 'function') setTimeout(drop, 300); else drop();
  } catch (err) { /* already gone */ }
  return true;
}

function notifyPhoneHit(notify, deps) {
  const health = deps.playerHealth ?? (typeof window !== 'undefined' ? window.playerHealth : null);
  const hp = deps.hp ?? health?.getHP?.();
  const maxHP = deps.maxHP ?? health?.getMaxHP?.();
  const left = Number.isFinite(hp) && Number.isFinite(maxHP) ? ` HP ${hp}/${maxHP}.` : '';
  try {
    if (lastPhoneToast?.parentNode) lastPhoneToast.parentNode.removeChild(lastPhoneToast);
  } catch (err) { /* already gone */ }
  lastPhoneToast = null;
  try {
    if (typeof notify === 'function') {
      const el = notify(`You're being hit!${left} Close the phone (Esc) to fight back.`, 'warning', '', PHONE_HIT_NOTICE_MS);
      lastPhoneToast = el && typeof el === 'object' ? el : null;
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
  dismissPhoneHitNotice();
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
  window.lastPlayerHitAt = lastPlayerHitAt;
  window.lastPlayerHitAtWall = lastPlayerHitAtWall;
  window.playerHitWithin = playerHitWithin;
  window.playerInCombat = playerInCombat;
  window.playerHasChaser = playerHasChaser;
  window.playerIsKnockedOut = playerIsKnockedOut;
  window.closeMinigameForKnockout = closeMinigameForKnockout;
  window.dismissPhoneHitNotice = dismissPhoneHitNotice;
}
