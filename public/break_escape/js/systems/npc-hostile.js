import { COMBAT_CONFIG } from '../config/combat-config.js';
import { roomIdAtFeet } from './interaction-walls.js';
import { CombatEvents } from '../events/combat-events.js';
import { getNPCDirection } from './npc-sprites.js';

const npcHostileStates = new Map();
const KO_FACINGS = new Set(['down', 'up', 'left', 'right', 'down-left', 'down-right', 'up-left', 'up-right']);

// Hostility and KO set this session or saved before a reload (E-B), so an NPC
// that turned on the player is still hostile after a reload and a knocked-out
// one stays down. npcId -> { hostile: bool, ko: bool }. Saved by state-sync.js
// (exportHostility), sent back as savedNpcHostility and restored in game.js
// before any room's NPCs load.
const hostilityRecord = new Map();
// Restored as hostile (and not KO'd): the NPC's behavior announces it once its
// sprite exists (takeRestoredHostility), so its tint and health bar come back.
const restoredPending = new Map();

// A hurt NPC (not KO'd) also records its HP, so a reload doesn't bring it back
// at full health (7.1g, m08 E12): { hostile, ko, hp, maxHP }.
function recordHostility(npcId, state) {
  const entry = { hostile: !!state.isHostile, ko: !!state.isKO };
  // The way it fell, so a reload lays it in that death animation's last frame
  // rather than facing down (m08 confirmation R4: ATHENA fell right, came back down)
  if (state.isKO && KO_FACINGS.has(state.koFacing)) entry.facing = state.koFacing;
  if (!state.isKO && state.currentHP > 0 && state.currentHP < state.maxHP) {
    entry.hp = state.currentHP;
    entry.maxHP = state.maxHP;
  }
  hostilityRecord.set(npcId, entry);
}

// The combat numbers a scenario can set per NPC in behavior.hostile (7.1e).
// Missing values fall back to combat-config.js in createHostileState.
const HOSTILE_STAT_KEYS = ['attackDamage', 'maxHP', 'attackCooldown', 'attackRange'];

/**
 * The NPC's configured combat numbers: its behavior's hostile config first
 * (npc-behavior.js parseConfig), then the config passed to setNPCHostile.
 * Only positive numbers count; anything else is left out.
 */
function configuredHostileStats(npcId, config) {
  const fromBehavior = window.npcBehaviorManager?.getBehavior?.(npcId)?.config?.hostile || {};
  const stats = {};
  for (const key of HOSTILE_STAT_KEYS) {
    const value = [fromBehavior[key], config?.[key]].find(v => typeof v === 'number' && v > 0);
    if (value !== undefined) stats[key] = value;
  }
  return stats;
}

/**
 * Apply configured combat numbers to a state that already exists (7.1f): a
 * getState() read before the NPC turned builds a default state, which used to
 * keep the default 10 damage. An unhurt NPC takes the new maxHP as its HP; a
 * hurt one keeps its HP, capped at the new maximum.
 */
function applyHostileStats(state, stats) {
  if (stats.attackDamage) state.attackDamage = stats.attackDamage;
  if (stats.attackCooldown) state.attackCooldown = stats.attackCooldown;
  if (stats.attackRange) state.attackRange = stats.attackRange;
  if (stats.maxHP && stats.maxHP !== state.maxHP && !state.isKO) {
    const unhurt = state.currentHP >= state.maxHP;
    state.maxHP = stats.maxHP;
    state.currentHP = unhurt ? stats.maxHP : Math.min(state.currentHP, stats.maxHP);
  }
}

function createHostileState(npcId, config = {}) {
  return {
    isHostile: false,
    currentHP: config.maxHP || COMBAT_CONFIG.npc.defaultMaxHP,
    maxHP: config.maxHP || COMBAT_CONFIG.npc.defaultMaxHP,
    isKO: false,
    attackDamage: config.attackDamage || COMBAT_CONFIG.npc.defaultPunchDamage,
    attackRange: config.attackRange || COMBAT_CONFIG.npc.defaultPunchRange,
    attackCooldown: config.attackCooldown || COMBAT_CONFIG.npc.defaultAttackCooldown,
    lastAttackTime: 0
  };
}

export function initNPCHostileSystem() {
  console.log('✅ NPC hostile system initialized');

  return {
    setNPCHostile: (npcId, isHostile, config) => setNPCHostile(npcId, isHostile, config),
    isNPCHostile: (npcId) => isNPCHostile(npcId),
    getState: (npcId) => getNPCHostileState(npcId),
    damageNPC: (npcId, amount) => damageNPC(npcId, amount),
    isNPCKO: (npcId) => isNPCKO(npcId),
    isNPCKOImmune: (npcId) => isNPCKOImmune(npcId),
    getKOFacing: (npcId) => getKOFacing(npcId),
    exportHostility: () => exportHostility(),
    restoreHostility: (saved) => restoreHostility(saved),
    takeRestoredHostility: (npcId) => takeRestoredHostility(npcId),
    announceRestoredHostile: (npcId, config) => announceRestoredHostile(npcId, config),
    resetHostilesForRespawn: () => resetHostilesForRespawn(),
    redropPending: (npcId) => redropPending(npcId)
  };
}

/**
 * The player chose Restart after a knockout (7.1d; m05 D5, m07 U11): every
 * hostile NPC that isn't knocked out goes back to its start state, calm (or
 * hostile again if the scenario starts it hostile) and at full health. The
 * reload that follows puts it back at its post. A KO'd NPC stays down, so
 * what it dropped stays dropped; nothing here touches an NPC's itemsHeld, so
 * one that wasn't KO'd still holds its items. An NPC that goes hostile -> calm
 * emits NPC_HOSTILE_CHANGED { npcId, isHostile: false, reset: true } before it
 * is saved, so missions' mappings clear their hostile flags. No event when it
 * returns to hostile (startHostile): that is no change for a mapping to see.
 * @returns {string[]} the NPCs reset
 */
export function resetHostilesForRespawn() {
  const reset = [];
  for (const [npcId, state] of npcHostileStates) {
    if (!state.isHostile || state.isKO) continue;
    const behavior = window.npcBehaviorManager?.getBehavior?.(npcId);
    state.isHostile = behavior?.config?.hostile?.startHostile === true;
    state.currentHP = state.maxHP;
    if (behavior) behavior.hostile = state.isHostile;
    if (!state.isHostile) {
      window.eventDispatcher?.emit(CombatEvents.NPC_HOSTILE_CHANGED, { npcId, isHostile: false, reset: true });
    }
    recordHostility(npcId, state);
    reset.push(npcId);
  }
  if (reset.length) console.log(`⚔️ Respawn: reset hostility for ${reset.join(', ')}`);
  return reset;
}

/** The direction a knocked-out NPC fell facing, or null if not known. */
export function getKOFacing(npcId) {
  const state = npcHostileStates.get(npcId);
  return state?.isKO && KO_FACINGS.has(state.koFacing) ? state.koFacing : null;
}

/** { npcId: { hostile, ko, hp?, maxHP?, facing? } } for the server (state-sync.js). */
export function exportHostility() {
  return Object.fromEntries(hostilityRecord);
}

/**
 * Restore hostility and KO saved before a reload. Runs before any NPC
 * registers, so the state is in place when sprites and behaviors are made
 * (npc-sprites.js reads isNPCKO, npc-behavior.js reads takeRestoredHostility).
 * A change made this session wins. No event is emitted here: the NPC's
 * behavior announces a restored hostile once its sprite exists.
 * @param {Object} saved - { npcId: { hostile: bool, ko: bool, hp?, maxHP? } }
 */
export function restoreHostility(saved) {
  if (!saved || typeof saved !== 'object') return 0;
  let restored = 0;
  for (const [npcId, entry] of Object.entries(saved)) {
    if (!npcId || !entry || typeof entry !== 'object') continue;
    if (hostilityRecord.has(npcId)) continue;
    const hostile = entry.hostile === true;
    const ko = entry.ko === true;
    const state = getNPCHostileState(npcId);
    state.isHostile = hostile;
    if (ko) {
      state.isKO = true;
      state.currentHP = 0;
      if (KO_FACINGS.has(entry.facing)) state.koFacing = entry.facing;
    } else if (validSavedHP(entry)) {
      state.maxHP = entry.maxHP;
      state.currentHP = entry.hp;
    }
    recordHostility(npcId, state);
    restoredPending.set(npcId, { hostile, ko });
    restored++;
  }
  if (restored) console.log(`⚔️ Restored hostility for ${restored} NPC(s)`);
  return restored;
}

function validSavedHP(entry) {
  const { hp, maxHP } = entry;
  return Number.isFinite(hp) && Number.isFinite(maxHP) && hp > 0 && maxHP > 0 && hp <= maxHP;
}

/**
 * The saved entry for an NPC restored after a reload, once: { hostile, ko },
 * or null when nothing was restored for it. npc-behavior.js calls this when
 * the behavior is made, in place of its startHostile config.
 */
export function takeRestoredHostility(npcId) {
  const entry = restoredPending.get(npcId);
  if (!entry) return null;
  restoredPending.delete(npcId);
  return entry;
}

/**
 * A restored hostile NPC's sprite now exists: tell the rest of the game, as
 * setNPCHostile does when an NPC turns, so its health bar, the threat music
 * and hostility eventMappings come back. Picks up the behavior's combat numbers
 * (attackDamage, maxHP, attackCooldown, attackRange), which weren't known when
 * the state was restored.
 */
export function announceRestoredHostile(npcId, config) {
  const state = npcHostileStates.get(npcId);
  if (!state || !state.isHostile || state.isKO) return false;
  applyHostileStats(state, configuredHostileStats(npcId, config));
  window.eventDispatcher?.emit(CombatEvents.NPC_HOSTILE_CHANGED, { npcId, isHostile: true, restored: true });
  return true;
}

function setNPCHostile(npcId, isHostile, config) {
  if (!npcId) {
    console.error('setNPCHostile: Invalid NPC ID');
    return false;
  }

  // Get or create state with config
  let state = npcHostileStates.get(npcId);
  if (!state) {
    // Combat numbers from the NPC's behavior.hostile (or the passed config):
    // attackDamage, maxHP, attackCooldown and attackRange (7.1e)
    state = createHostileState(npcId, configuredHostileStats(npcId, config));
    npcHostileStates.set(npcId, state);
  } else if (isHostile) {
    // A state can exist before the turn (any getState() call creates one with
    // defaults): turning hostile still applies the configured numbers (7.1f)
    applyHostileStats(state, configuredHostileStats(npcId, config));
  }

  const wasHostile = state.isHostile;
  state.isHostile = isHostile;
  if (wasHostile !== isHostile) recordHostility(npcId, state);

  console.log(`⚔️ NPC ${npcId} hostile: ${wasHostile} → ${isHostile}`);

  // Emit event if state changed
  if (wasHostile !== isHostile && window.eventDispatcher) {
    console.log(`⚔️ Emitting NPC_HOSTILE_CHANGED for ${npcId} (isHostile=${isHostile})`);
    window.eventDispatcher.emit(CombatEvents.NPC_HOSTILE_CHANGED, {
      npcId,
      isHostile
    });
  } else if (wasHostile === isHostile) {
    console.log(`⚔️ State unchanged for ${npcId} (already ${wasHostile}), skipping event`);
  } else {
    console.warn(`⚔️ Event dispatcher not found, cannot emit NPC_HOSTILE_CHANGED`);
  }

  return true;
}

function isNPCHostile(npcId) {
  const state = npcHostileStates.get(npcId);
  return state ? state.isHostile : false;
}

function getNPCHostileState(npcId) {
  let state = npcHostileStates.get(npcId);
  if (!state) {
    state = createHostileState(npcId);
    npcHostileStates.set(npcId, state);
  }
  return state;
}

/**
 * An NPC with "koImmune": true in the scenario can't be hurt or knocked out
 * (the finale's story-critical NPCs). Player punches pass over it without
 * turning it hostile (player-combat.js), and damageNPC refuses it, so no
 * npc_ko, globalVarOnKO, taskOnKO or item drop can come from it.
 */
export function isNPCKOImmune(npcId) {
  return window.npcManager?.getNPC?.(npcId)?.koImmune === true;
}

function damageNPC(npcId, amount) {
  if (isNPCKOImmune(npcId)) {
    console.log(`🛡️ NPC ${npcId} is koImmune - no damage`);
    return false;
  }
  const state = getNPCHostileState(npcId);
  if (!state) return false;

  if (state.isKO) {
    console.log(`NPC ${npcId} already KO`);
    return false;
  }

  const oldHP = state.currentHP;
  state.currentHP = Math.max(0, state.currentHP - amount);

  console.log(`NPC ${npcId} HP: ${oldHP} → ${state.currentHP}`);
  if (state.currentHP > 0) recordHostility(npcId, state); // saved with hostility (7.1g)

  // Check for KO
  if (state.currentHP <= 0) {
    state.isKO = true;

    // Get NPC reference for death animation and server sync
    const npc = window.npcManager?.getNPC(npcId);
    const sprite = npc?._sprite || npc?.sprite;
    // The facing playNPCDeathAnimation reads below, saved with the KO
    if (sprite) {
      try { state.koFacing = getNPCDirection(npcId, sprite); } catch (e) { /* no facing */ }
    }
    recordHostility(npcId, state);
    
    // Sync NPC KO state to server for persistence. The drop below waits for it: the server
    // accepts a drop outside the NPC's own room only once the KO is recorded. Retried with a
    // bounded backoff (review R3 m2), so one failed request does not lose the drop.
    let koSynced = null;
    if (window.RoomStateSync && npc?.roomId) {
      koSynced = withSyncRetries(() => window.RoomStateSync.updateNpcState(npc.roomId, npcId, {
        isKO: true,
        currentHP: 0
      }, { reportRefusal: true }), 'NPC KO state').catch(err => {
        console.error('Failed to sync NPC KO state to server:', err);
      });
    }
    
    // Play death animation and disable physics after it completes
    if (sprite) {
      // Disable collisions immediately so player can walk through
      if (sprite.body) {
        sprite.body.setVelocity(0, 0);
        // Disable all collision checks but keep body enabled for animation
        sprite.body.checkCollision.none = true;
        console.log(`💀 Disabled collisions for ${npcId}, starting death animation`);
      }
      
      playNPCDeathAnimation(npcId, sprite);
      
      // Disable physics body completely after death animation completes
      // Use animationcomplete event to ensure all frames play
      sprite.once('animationcomplete', (anim) => {
        console.log(`💀 Animation complete event fired for ${npcId}, anim key: ${anim.key}`);
        if (anim.key.includes('death') && sprite && sprite.body && !sprite.destroyed) {
          sprite.body.enable = false; // Disable physics body entirely
          console.log(`💀 Disabled physics body for ${npcId} after animation complete`);
        }
      });
    }

    // Drop any items the NPC was holding
    dropNPCItems(npcId, koSynced);

    // Note: Item drops are synced to server in dropNPCItems via RoomStateSync

    // Play KO sounds: Wilhelm scream then body fall thud
    if (window.soundManager) {
      window.soundManager.play('wilhelm_scream');
      window.soundManager.play('body_fall', { delay: 400 });
    }

    if (window.eventDispatcher) {
      window.eventDispatcher.emit(CombatEvents.NPC_KO, { npcId });
      // Also emit a specific event for this NPC so scenario event mappings can target it directly
      window.eventDispatcher.emit(`${CombatEvents.NPC_KO}:${npcId}`, { npcId });
    }

    // If the NPC config declares a globalVarOnKO, set that global variable now
    // so the debrief and other systems can track it regardless of whether the
    // player opens the agent 0x99 bark notification.
    const npcRef = window.npcManager?.getNPC(npcId);
    if (npcRef?.globalVarOnKO && window.gameState?.globalVariables) {
      const koVarName = npcRef.globalVarOnKO;
      const koOldValue = window.gameState.globalVariables[koVarName];
      window.gameState.globalVariables[koVarName] = true;
      if (window.npcConversationStateManager) {
        window.npcConversationStateManager.broadcastGlobalVariableChange(
          koVarName, true, 'npc_hostile_system'
        );
      }
      // Fire the game-wide event so eventMappings keyed on the global fire too
      window.eventDispatcher?.emit(`global_variable_changed:${koVarName}`, {
        name: koVarName, value: true, oldValue: koOldValue
      });
      console.log(`🌐 Set global variable ${npcRef.globalVarOnKO} = true (NPC ${npcId} KO'd)`);
    }

    // If the NPC config declares a taskOnKO, auto-complete that task so the
    // objective system doesn't get stuck waiting for a conversation that can't happen.
    if (npcRef?.taskOnKO && window.eventDispatcher) {
      window.eventDispatcher.emit('task_completed_by_npc', {
        taskId: npcRef.taskOnKO,
        npcId: npcId
      });
      console.log(`📋 Auto-completed task ${npcRef.taskOnKO} (NPC ${npcId} KO'd)`);
    }
  }

  return true;
}

/**
 * Play death animation for NPC
 * @param {string} npcId - The NPC ID
 * @param {Phaser.GameObjects.Sprite} sprite - The NPC sprite
 */
function playNPCDeathAnimation(npcId, sprite) {
  if (!sprite || !sprite.scene) {
    console.warn(`⚠️ Cannot play death animation - invalid sprite for ${npcId}`);
    return;
  }

  // Get NPC's current facing direction
  const direction = getNPCDirection(npcId, sprite);
  
  // Build death animation key: npc-{npcId}-death-{direction}
  const deathAnimKey = `npc-${npcId}-death-${direction}`;
  
  if (sprite.scene.anims.exists(deathAnimKey)) {
    // Stop any current animation first
    if (sprite.anims.isPlaying) {
      sprite.anims.stop();
    }
    
    // Store original origin for restoration
    const originalOriginY = sprite.originY;
    
    // Add animation update listener to progressively shift visual display downward
    sprite.on('animationupdate', (anim, frame) => {
      if (anim.key === deathAnimKey) {
        // Calculate progress through animation (0 to 1)
        const totalFrames = anim.getTotalFrames();
        const currentFrame = frame.index;
        const progress = currentFrame / totalFrames;
        
        // Shift sprite's visual display downward by adjusting origin
        // This moves the texture down without changing sprite.y (keeps depth constant)
        // Decrease originY by ~0.5 to shift texture down by half sprite height (~40px for 80px sprite)
        const originOffset = progress * 0.5;
        sprite.setOrigin(sprite.originX, originalOriginY - originOffset);
      }
    });
    
    // Clean up listener when animation completes
    sprite.once('animationcomplete', (anim) => {
      if (anim.key === deathAnimKey) {
        sprite.off('animationupdate');
        // Origin stays shifted - defeated body appears lower visually but sprite.y unchanged
        // Depth remains constant, naturally rendering behind standing characters at same Y
      }
    });
    
    sprite.play(deathAnimKey);
    console.log(`💀 Playing NPC death animation: ${deathAnimKey}`);
  } else {
    console.warn(`⚠️ Death animation not found: ${deathAnimKey}`);
  }
}

/**
 * Drop items around a defeated NPC
 * Items land on walkable floor round the body (koDropSpots), spread apart and clear
 * of furniture where possible.
 * Physics launches are intentionally avoided: when an NPC dies near a wall or
 * furniture, velocity-based drops collide with geometry and leave items in
 * unreachable positions. Instead each item is placed at a small static offset
 * so multiple drops are visually distinguishable while remaining pickupable.
 * @param {string} npcId - The NPC that was defeated
 */
// Review R3 m2: a KO sync or a KO drop that fails is tried again after each of these delays,
// then given up. Bounded: at most four requests per KO sync and per dropped item, nothing queued
// beyond them, nothing saved. The server makes a repeated drop a no-op, and a reload lists any
// drop that never landed (koDropPending) so it is sent again.
export const SYNC_RETRY_DELAYS_MS = [500, 1500, 4000];
let retryWait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Test seam: replace the wait between retries. Returns the previous one. */
export function setRetryWait(fn) {
  const prev = retryWait;
  retryWait = fn;
  return prev;
}

/** The answer room-state-sync.js gives a definite refusal (its SYNC_REFUSED; review R4 n1). */
export const SYNC_REFUSED = 'refused';

/**
 * Calls `send` (a function returning a promise of true on success) until it answers true or the
 * delays run out. A thrown error counts as a failure. A definite refusal (SYNC_REFUSED: a 4xx
 * such as "room not accessible" or "NPC not KO'd") is not retried (review R4 n1). Resolves to
 * true on success, false otherwise.
 */
export async function withSyncRetries(send, what = 'sync', delays = SYNC_RETRY_DELAYS_MS) {
  for (let attempt = 0; ; attempt++) {
    let answer = false;
    try {
      answer = await send();
    } catch (err) {
      console.warn(`${what} request failed:`, err);
    }
    if (answer === true) return true;
    if (answer === SYNC_REFUSED) {
      console.warn(`${what}: refused by the server, not retried`);
      return false;
    }
    if (attempt >= delays.length) {
      console.error(`${what}: gave up after ${attempt + 1} attempts`);
      return false;
    }
    await retryWait(delays[attempt]);
  }
}

/**
 * Review R3 m2: after a reload, drop again the held items of a KO'd NPC that the server says
 * never reached a room or the player (`koDropPending`, from GET /room). Called by
 * npc-sprites.js once the KO'd sprite is laid down. Returns the number of items dropped.
 */
function redropPending(npcId) {
  const npc = window.npcManager?.getNPC(npcId);
  const pending = Array.isArray(npc?.koDropPending) ? npc.koDropPending.filter(id => typeof id === 'string') : [];
  if (!npc || pending.length === 0 || !isNPCKO(npcId)) return 0;
  npc.koDropPending = [];
  return dropNPCItems(npcId, null, pending);
}

/**
 * The texture a dropped held item is drawn with. The same order as a reload (rooms.js draws a
 * stored object from `sprite || type`), so the drop looks the same before and after: the item's
 * own sprite, then its texture field, then its type's default picture. 'key' only when none of
 * them is a loaded texture (a USB stick used to show the key picture until a reload).
 */
export function dropTextureFor(item, exists) {
  const candidates = [item?.sprite, item?.texture, item?.type];
  for (const key of candidates) {
    if (typeof key === 'string' && key && exists(key)) return key;
  }
  return 'key';
}

/**
 * Where a KO'd NPC's items land (UX pass, 2026-11-12; backlog "KO item drops land on
 * top of each other"). The old 8 px ring put every item on the body, often under the
 * desk or chair the NPC fell by, where the player could not see it. Each spot here:
 *  - is a cell the player can walk to from the body without leaving the room
 *    (`reachable`, from koReachableCells: a flood fill over the world grid), so it is
 *    never inside a wall or furniture body, on the far side of a wall, in the next
 *    room or in a walled-off pocket (code review R2 M1);
 *  - is at least MIN_GAP from the body and from every other drop, when there is room;
 *  - draws clear of the shown room objects (obstacles: {x, y, w, h} rects), so a desk
 *    top or a chair does not hide it, when such a spot exists within reach: clear ring
 *    spots first, then any clear reached cell, and only then a hidden one (a desk top is
 *    often drawn over walkable floor).
 * With too few reached cells for the gap (a narrow corridor, many items), the rest
 * stack on the nearest reached cells. With no grid at all (`reachable` null or empty)
 * every item lands on the body, a few px apart, since nothing else is known to be safe.
 * Returns the centre of each spot; the caller places a sprite of size (w, h) there.
 * Pure, so it is tested in node.
 */
export const KO_DROP_MIN_GAP = 32;
export const KO_DROP_RADII = [KO_DROP_MIN_GAP, KO_DROP_MIN_GAP * 1.5, KO_DROP_MIN_GAP * 2, KO_DROP_MIN_GAP * 3];
const KO_DROP_ANGLES = [90, 45, 135, 0, 180, 270, 225, 315]; // below the body first, then round
export function koDropSpots(feet, count, { reachable = null, obstacles = [], size = { w: 32, h: 32 } } = {}) {
  const gap = KO_DROP_MIN_GAP;
  const spots = [];
  const d2 = (p, q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
  const far = (p, q, d) => d2(p, q) >= d * d;
  const clear = (p) => {
    const r = { x: p.x - size.w / 2, y: p.y - size.h / 2, w: size.w, h: size.h };
    return !obstacles.some(o => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
  };
  const cells = Array.isArray(reachable) ? reachable : [];
  if (cells.length === 0) {
    // Nothing is known to be walkable: on the body, a few px apart so each shows
    for (let i = 0; i < count; i++) {
      const a = (i / Math.max(count, 1)) * Math.PI * 2 + Math.PI / 2;
      const r = count > 1 ? 4 : 0;
      spots.push({ x: Math.round(feet.x + Math.cos(a) * r), y: Math.round(feet.y + Math.sin(a) * r) });
    }
    return spots;
  }
  // Ring points snapped to the nearest reached cell (within about one cell of the point)
  const candidates = [];
  for (const radius of KO_DROP_RADII) {
    for (const deg of KO_DROP_ANGLES) {
      const a = deg * Math.PI / 180;
      const raw = { x: feet.x + Math.cos(a) * radius, y: feet.y + Math.sin(a) * radius };
      let best = null, bestD = 12 * 12;
      for (const c of cells) { const d = d2(c, raw); if (d <= bestD) { bestD = d; best = c; } }
      if (best && !candidates.includes(best)) candidates.push(best);
    }
  }
  const byDistance = [...cells].sort((p, q) => d2(p, feet) - d2(q, feet));
  const pick = (list, needClear, minGap) => {
    for (const c of list) {
      if (spots.length >= count) return;
      if (spots.includes(c)) continue;
      if (minGap > 0 && !far(c, feet, minGap * 0.75)) continue;
      if (!spots.every(s => far(c, s, minGap))) continue;
      if (needClear && !clear(c)) continue;
      spots.push(c);
    }
  };
  pick(candidates, true, gap);
  pick(byDistance, true, gap);        // clear floor off the rings, before any hidden spot
  pick(candidates, false, gap);
  pick(byDistance, false, gap);       // off the rings, e.g. along a corridor
  pick(byDistance, false, gap / 2);   // tighter
  // Last resort: stack on the nearest reached cells, one 8 px cell apart, then on top
  for (let i = 0; spots.length < count; i++) {
    const c = byDistance[i % byDistance.length];
    if (i < byDistance.length && spots.includes(c)) continue;
    spots.push(c);
  }
  return spots.map(c => ({ x: Math.round(c.x), y: Math.round(c.y) }));
}

/**
 * The world-grid cells a KO drop may use (code review R2 M1): a 4-way flood fill from
 * the body's cell over walkable cells (grid value 0), out to maxDist px from the feet,
 * keeping only cells inRoom(x, y) accepts (the room the NPC fell in). Walls and
 * furniture stop the fill, so a cell behind a wall or in an enclosed pocket is never
 * reached, and a door gap into the next room is cut off by inRoom.
 * bounds is the pathfinder's {minX, minY, cols, rows, step}. Returns cell centres,
 * nearest first in fill order. Pure, so it is tested in node.
 */
export function koReachableCells(feet, { grid, bounds, maxDist = KO_DROP_RADII[KO_DROP_RADII.length - 1] + KO_DROP_MIN_GAP, inRoom = () => true } = {}) {
  if (!grid || !bounds || !feet) return [];
  const { minX, minY, cols, rows, step } = bounds;
  const centre = (cx, cy) => ({ x: minX + cx * step + step / 2, y: minY + cy * step + step / 2 });
  const ok = (cx, cy) => cx >= 0 && cy >= 0 && cx < cols && cy < rows && grid[cy]?.[cx] === 0;
  const within = (p) => (p.x - feet.x) ** 2 + (p.y - feet.y) ** 2 <= maxDist * maxDist;
  let sx = Math.floor((feet.x - minX) / step), sy = Math.floor((feet.y - minY) / step);
  if (!ok(sx, sy) || !inRoom(centre(sx, sy).x, centre(sx, sy).y)) {
    // The body's own cell is often blocked (clearance by a wall or desk): start from the
    // nearest walkable in-room cell next to it, never more than two cells away
    let found = null, bestD = Infinity;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const cx = sx + dx, cy = sy + dy;
      if (!ok(cx, cy)) continue;
      const c = centre(cx, cy);
      if (!inRoom(c.x, c.y)) continue;
      const d = (c.x - feet.x) ** 2 + (c.y - feet.y) ** 2;
      if (d < bestD) { bestD = d; found = [cx, cy]; }
    }
    if (!found) return [];
    [sx, sy] = found;
  }
  const seen = new Set([sy * cols + sx]);
  const queue = [[sx, sy]];
  const out = [];
  for (let qi = 0; qi < queue.length; qi++) {
    const [cx, cy] = queue[qi];
    out.push(centre(cx, cy));
    for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
      const k = ny * cols + nx;
      if (seen.has(k) || !ok(nx, ny)) continue;
      seen.add(k);
      const c = centre(nx, ny);
      if (!within(c) || !inRoom(c.x, c.y)) continue;
      queue.push([nx, ny]);
    }
  }
  return out;
}

function dropNPCItems(npcId, afterSync = null, onlyIds = null) {
  const npc = window.npcManager?.getNPC(npcId);
  let sprite = npc?._sprite || npc?.sprite;
  if (npc && !sprite && npc.roomId) {
    sprite = window.rooms?.[npc.roomId]?.npcSprites?.find(s => s.npcId === npcId);
  }
  if (!npc || !npc.itemsHeld || npc.itemsHeld.length === 0) {
    return 0;
  }
  // A re-drop after a reload drops only the items still owed (review R3 m2)
  const toDrop = Array.isArray(onlyIds) ? npc.itemsHeld.filter(i => i && onlyIds.includes(i.id)) : npc.itemsHeld;
  if (toDrop.length === 0) return 0;

  // Use the sprite we already have and find its room
  if (!sprite) {
    console.warn(`⚠️ Cannot drop items - no sprite found for NPC: ${npcId}`);
    return 0;
  }

  // The room the NPC fell in, not its home room: hostile NPCs follow the player
  // through doors, and a drop registered in another room can't be picked up
  // (the same-room rule refuses it). Fall back to the home room.
  const bc = sprite.body?.center;
  const fellIn = bc ? roomIdAtFeet(bc.x, bc.y, window.rooms) : null;
  const npcRoomId = fellIn || npc.roomId;

  if (!npcRoomId || !window.rooms?.[npcRoomId]) {
    console.warn(`Could not find room for NPC ${npcId}`);
    return 0;
  }

  const room = window.rooms[npcRoomId];
  const gameRef = window.game;

  // Spread the drops round the body on walkable floor, clear of furniture and at
  // least KO_DROP_MIN_GAP apart (koDropSpots), so each one can be seen and picked.
  const feet = bc ? { x: bc.x, y: bc.y } : { x: sprite.x, y: sprite.y };
  const pm = window.pathfindingManager;
  const obstacles = [];
  for (const o of Object.values(room.objects || {})) {
    if (!o || o.destroyed || o.active === false || o.visible === false || o === sprite) continue;
    const w = o.displayWidth ?? o.width ?? 0, h = o.displayHeight ?? o.height ?? 0;
    if (!(w > 0) || !(h > 0)) continue;
    obstacles.push({ x: o.x - (o.originX ?? 0.5) * w, y: o.y - (o.originY ?? 0.5) * h, w, h });
  }
  // Only cells reached from the body inside this room (code review R2 M1): the world grid
  // spans every loaded room, so a plain nearest-walkable snap could land behind a wall
  const reachable = koReachableCells(feet, {
    grid: pm?.worldGrid,
    bounds: pm?.worldGridBounds,
    inRoom: (x, y) => roomIdAtFeet(x, y, window.rooms, 0) === npcRoomId
  });
  const spots = koDropSpots(feet, toDrop.length, { reachable, obstacles });

  toDrop.forEach((item, index) => {
    // Create actual Phaser sprite for the dropped item, drawn as a reload draws it
    // (dropTextureFor: its own sprite, then its type's picture, 'key' only as a last resort)
    const texture = dropTextureFor(item, (key) => gameRef.textures.exists(key));
    console.log(`💧 Dropping item: type="${item.type}", name="${item.name}", texture="${texture}"`);

    const spriteObj = gameRef.add.sprite(0, 0, texture);

    // Set origin to match standard object creation, then centre the picture on its spot
    spriteObj.setOrigin(0, 0);
    const spot = spots[index];
    const spawnX = Math.round(spot.x - (spriteObj.width || 32) / 2);
    const spawnY = Math.round(spot.y - (spriteObj.height || 32) / 2);
    spriteObj.x = spawnX;
    spriteObj.y = spawnY;
    
    // Create scenario data from the dropped item
    const droppedItemData = {
      ...item,
      type: item.type || 'dropped_item',
      name: item.name || 'Item',
      takeable: true,
      active: true,
      visible: true,
      interactable: true
    };
    
    // DEBUG: Log key properties if this is a key
    if (item.type === 'key') {
      console.log(`🔑 Dropped key "${item.name}":`, {
        source: 'npc-hostile.js dropNPCItems',
        item_opens_lock: item.opens_lock,
        item_keyPins: item.keyPins,
        droppedItemData_opens_lock: droppedItemData.opens_lock,
        droppedItemData_keyPins: droppedItemData.keyPins
      });
    }
    
    // Apply scenario properties to sprite
    spriteObj.scenarioData = droppedItemData;
    spriteObj.interactable = true;
    spriteObj.name = droppedItemData.name;
    // Use the item's scenario id so the room-state entry, pickup, flag-station
    // ownership and collect checks all see the original id (also after a reload).
    // Fall back to a generated unique id when the item has none.
    spriteObj.objectId = item.id || `dropped_${npcId}_${index}_${Date.now()}`;
    spriteObj.takeable = true;
    spriteObj.type = droppedItemData.type;
    
    // Copy over all properties from the item
    Object.keys(droppedItemData).forEach(key => {
      spriteObj[key] = droppedItemData[key];
    });
    
    spriteObj.roomId = npcRoomId; // after the copy: the room it fell in, whatever the item data says

    // IMPORTANT: Preserve texture information for inventory display
    // Phaser sprites have a complex texture object, but inventory expects
    // a simple object with a 'key' property (matching npc-game-bridge pattern)
    // Store both the original texture reference and a simple texture key object
    const phaserTexture = spriteObj.texture; // Preserve Phaser's texture object
    spriteObj.texture = {
      key: texture,  // Use the resolved texture name for inventory
      _phaserTexture: phaserTexture  // Keep reference to original Phaser texture
    };
    
    console.log(`💧 Dropped item sprite texture set: key="${spriteObj.texture.key}", name="${spriteObj.name}"`);
    
    // Make the sprite interactive
    spriteObj.setInteractive({ useHandCursor: true });
    
    // No physics launch — items are placed statically so they can never end up
    // inside wall or furniture geometry regardless of where the NPC died.

    // Set depth using the existing depth calculation method
    // depth = objectBottomY + 0.5
    const objectBottomY = spriteObj.y + (spriteObj.height || 0);
    const objectDepth = objectBottomY + 0.5;
    spriteObj.setDepth(objectDepth);
    
    // Update depth each frame to follow Y position
    const originalUpdate = spriteObj.update?.bind(spriteObj);
    spriteObj.update = function() {
      if (originalUpdate) originalUpdate();
      const newDepth = this.y + (this.height || 0) + 0.5;
      this.setDepth(newDepth);
    };
    
    // Store in room.objects
    if (!room.objects) room.objects = {};
    room.objects[spriteObj.objectId] = spriteObj;
    
    console.log(`💧 Dropped item ${droppedItemData.type} from ${npcId} at (${spawnX}, ${spawnY})`);
    
    // Sync dropped item to server for persistence
    if (window.RoomStateSync) {
      // Create item data for server (without Phaser-specific properties)
      const itemForServer = {
        id: spriteObj.objectId,
        type: droppedItemData.type,
        name: droppedItemData.name,
        texture: texture,
        x: spawnX,
        y: spawnY,
        // Room-relative tile position: this is what rooms.js uses to place the
        // object on reload (raw x/y are ignored), keeping the drop spot stable.
        position: room?.position ? {
          x: (spawnX - room.position.x) / 32,
          y: (spawnY - room.position.y) / 32
        } : undefined,
        takeable: true,
        interactable: true,
        scenarioData: droppedItemData
      };
      
      // Retried with a bounded backoff (review R3 m2); the server takes a repeat as a no-op
      Promise.resolve(afterSync).catch(() => {}).then(() => withSyncRetries(() => window.RoomStateSync.addItemToRoom(npcRoomId, itemForServer, {
        npcId: npcId,
        sourceType: 'npc_defeated',
        reportRefusal: true
      }), `Drop of ${itemForServer.id}`)).catch(err => {
        console.error('Failed to sync dropped item to server:', err);
      });
    }
  });

  // Clear the NPC's inventory (a re-drop clears only what it dropped)
  npc.itemsHeld = toDrop === npc.itemsHeld ? [] : npc.itemsHeld.filter(i => !toDrop.includes(i));
  return toDrop.length;
}

function isNPCKO(npcId) {
  const state = npcHostileStates.get(npcId);
  return state ? state.isKO : false;
}
