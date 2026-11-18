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
/** A fight held only by a chaser that is getting nowhere (not reaching the player's room, not moving) stops counting after this long, and stays stopped for the rest of that run: the hit window then rules. */
export const COMBAT_CHASE_CAP_MS = 20000;
/** A chaser counts as moving once its sprite is more than this far (px) from where it was up to COMBAT_CHASE_WINDOW_MS ago (net movement, so a back-and-forth swing never counts). */
export const COMBAT_CHASE_MOVE_PX = 16;
/** How long a chaser's anchor position is kept before it is refreshed. */
export const COMBAT_CHASE_WINDOW_MS = 2000;

let chaseRunStart = 0;     // when the current stretch without chaser progress began (0: none)
let lastChaserAt = -Infinity;   // the last sample that saw a chaser
let cappedRun = false;     // the cap has fired in this run; only a new run (a gap over the linger), a chaser newly reaching the player's room, or a room chaser that is making progress clears it
const chaserAnchors = new Map();   // npcId -> { x, y, t } where that chaser's sprite was last anchored
let roomIds = new Set();   // npcIds that were 'room' chasers in the last sample

/** Forget the chase run, the linger, the latch and the anchors. Nothing in the game calls it (a new run clears them anyway, after any gap over the linger); it is for tests. */
export function resetCombatState() {
  chaseRunStart = 0;
  lastChaserAt = -Infinity;
  cappedRun = false;
  chaserAnchors.clear();
  roomIds = new Set();
}

/**
 * Every live hostile NPC chasing the player in a way that counts as a fight. Each has to be awake,
 * not hidden by a mapping and not cowering (a cower hostile keeps its distance in chase state
 * without attacking; its hits count through the hit window instead). Returns a list of
 * { kind: 'room' | 'stuck' | 'reach', behavior }. 'room' is a chaser in the player's room that can
 * get to the player; 'stuck' is one in the player's room that cannot (across a partition, wedged),
 * so it is timed like a 'reach'. With deps.anyRoom a chaser in another room also counts, as
 * 'reach', but only if it can get to the player (npcCombat.canReachPlayer, or a non-empty
 * chasePath): a hostile held behind a locked door never holds a call. Room-less (no deps.anyRoom)
 * the other-room chaser is skipped. In the player's room, a reach test that cannot be run (no
 * canReach and no npcCombat) counts as reachable.
 * @param {object} [deps] - overridable for tests: behaviors, hostileSystem, npcManager, playerRoom,
 *   anyRoom, canReach(behavior)
 */
function collectChasers(deps = {}) {
  const w = typeof window !== 'undefined' ? window : {};
  const hostile = deps.hostileSystem ?? w.npcHostileSystem;
  const behaviors = deps.behaviors ?? w.npcBehaviorManager?.behaviors;
  if (!hostile || !behaviors) return [];
  const manager = deps.npcManager ?? w.npcManager;
  const playerRoom = deps.playerRoom ?? w.currentPlayerRoom;
  const list = typeof behaviors.values === 'function' ? behaviors.values() : behaviors;
  const out = [];
  for (const behavior of list) {
    if (!behavior || behavior.currentState !== 'chase') continue;
    const id = behavior.npcId;
    try {
      if (behavior.config?.hostile?.fightStyle === 'cower') continue;
      if (!hostile.isNPCHostile?.(id) || hostile.isNPCKO?.(id)) continue;
      if (manager?.isHiddenByMapping?.(id)) continue;
      const otherRoom = typeof playerRoom === 'string' && behavior.roomId && behavior.roomId !== playerRoom;
      if (otherRoom && !deps.anyRoom) continue;
      // null: the test cannot be run
      let reach = Array.isArray(behavior.chasePath) && behavior.chasePath.length > 0 ? true : null;
      if (reach === null) {
        if (typeof deps.canReach === 'function') reach = !!deps.canReach(behavior);
        else if (w.npcCombat?.canReachPlayer && behavior.sprite) reach = !!w.npcCombat.canReachPlayer(behavior.sprite);
      }
      if (otherRoom) {
        if (!reach) continue;
        out.push({ kind: 'reach', behavior });
      } else {
        out.push({ kind: reach === false ? 'stuck' : 'room', behavior });
      }
    } catch (err) { continue; }
  }
  return out;
}

/** The chaser that matters most: one in the player's room first, then any other. */
function findChaser(deps = {}) {
  const all = collectChasers(deps);
  return all.find(c => c.kind === 'room') || all[0] || null;
}

/**
 * Is a live hostile NPC chasing the player in the player's room (the fighting pose, player-poses.js)?
 * With deps.anyRoom it also counts a chaser in another room that can reach the player (the combat
 * hold sets it, so a call never starts and is then pulled back when the player leaves the room
 * with the chaser still after them).
 * @param {object} [deps] - see collectChasers
 */
export function playerHasChaser(deps = {}) {
  return !!findChaser(deps);
}

/** Where a chaser's sprite is, or null when unknown. */
function chaserPosition(behavior, deps) {
  if (typeof deps.positionOf === 'function') return deps.positionOf(behavior);
  const s = behavior?.sprite;
  if (!s || typeof s.x !== 'number' || typeof s.y !== 'number') return null;
  return { x: s.x, y: s.y };
}

/** Is the chaser within attack range of the player (counts as progress for a chaser in the player's room)? */
function inAttackRange(behavior, deps) {
  if (typeof deps.inAttackRange === 'function') return !!deps.inAttackRange(behavior);
  const w = typeof window !== 'undefined' ? window : {};
  const ps = w.player?.sprite ?? w.player;
  const pos = chaserPosition(behavior, deps);
  if (!pos || !ps || typeof ps.x !== 'number' || typeof ps.y !== 'number') return false;
  const range = w.npcHostileSystem?.getState?.(behavior.npcId)?.attackRange || 32;
  return Math.hypot(pos.x - ps.x, pos.y - ps.y) <= range;
}

/**
 * True while the player is in a fight: a live hostile NPC is chasing the player, in any room (its
 * chase state covers the attack swing) or the player took a hit in the last COMBAT_QUIET_MS.
 * Scripted phone chats and calls wait on this (npc-manager.js _queueScriptedConversation,
 * phone-ringer-dom.js ringBlocked): a popup that locks the world mid-fight leaves the player
 * unable to fight or flee (m04 playtest). Three limits keep a hold from outlasting the fight:
 * a chaser has to be hostile, awake and in chase state (a hostile that gave up stops counting), the chase term
 * lingers COMBAT_LINGER_MS after the last sighting so a leashed guard flipping at its edge does
 * not stutter the hold, and a chase that reaches the player (a chaser in the player's room that
 * can get to them) counts while it makes progress: it moves (net movement, see
 * COMBAT_CHASE_MOVE_PX), is within attack range, or has only just reached the room. Any chase
 * without progress (a reachable chaser in another room, one that cannot get to the player, or a
 * wedged one in the player's room) stops counting after COMBAT_CHASE_CAP_MS, and stays stopped until
 * a new run, so a held call that has rung is not pulled back by the chaser's later progress. Then
 * only the hit window holds. The player opening their own phone is never asked about this.
 * @param {object} [deps] - overridable for tests: behaviors, hostileSystem, npcManager,
 *   playerRoom, now (performance clock ms), canReach(behavior), positionOf(behavior),
 *   inAttackRange(behavior)
 */
export function playerInCombat(deps = {}) {
  const t = typeof deps.now === 'number' ? deps.now
    : (typeof performance !== 'undefined' ? performance.now() : Date.now());
  // Sample the chase first, so a run keeps being tracked while a hit holds the fight on
  const chasers = collectChasers({ ...deps, anyRoom: true });
  if (chasers.length) {
    if (!chaseRunStart || t - lastChaserAt > COMBAT_LINGER_MS) {
      chaseRunStart = t; cappedRun = false; chaserAnchors.clear(); roomIds = new Set();
    }
    const present = new Set(chasers.map(c => c.behavior.npcId));
    for (const id of [...chaserAnchors.keys()]) if (!present.has(id)) chaserAnchors.delete(id);
    let roomProgress = false;
    let reachProgress = false;
    const nowRoom = new Set();
    for (const { kind, behavior } of chasers) {
      const id = behavior.npcId;
      let moved = false;
      const pos = chaserPosition(behavior, deps);
      if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
        const a = chaserAnchors.get(id);
        if (!a) chaserAnchors.set(id, { x: pos.x, y: pos.y, t });
        else if (Math.hypot(pos.x - a.x, pos.y - a.y) > COMBAT_CHASE_MOVE_PX) {
          chaserAnchors.set(id, { x: pos.x, y: pos.y, t });
          moved = true;
        } else if (t - a.t >= COMBAT_CHASE_WINDOW_MS) {
          chaserAnchors.set(id, { x: pos.x, y: pos.y, t });
        }
      }
      if (kind === 'room') {
        nowRoom.add(id);
        if (!roomIds.has(id) || moved || inAttackRange(behavior, deps)) roomProgress = true;
      } else if (moved) {
        reachProgress = true;
      }
    }
    roomIds = nowRoom;
    // A chaser newly in the player's room, or one there that is closing or fighting, clears a latch
    if (roomProgress) { chaseRunStart = t; cappedRun = false; }
    else if (reachProgress && !cappedRun) chaseRunStart = t;
    if (t - chaseRunStart >= COMBAT_CHASE_CAP_MS) cappedRun = true;
    lastChaserAt = t;
  } else if (chaseRunStart && t - lastChaserAt > COMBAT_LINGER_MS) {
    chaseRunStart = 0;
  }
  if (playerHitWithin(COMBAT_QUIET_MS, deps.now)) return true;
  if (!chaseRunStart) return false;
  if (t - lastChaserAt > COMBAT_LINGER_MS) return false;
  // Capped: a chaser that has made no progress this long is not a fight, and stays not one
  return !cappedRun;
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
