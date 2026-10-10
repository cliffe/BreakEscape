import { COMBAT_CONFIG } from '../config/combat-config.js';
import { CombatEvents } from '../events/combat-events.js';
import { getNPCDirection } from './npc-sprites.js';

const npcHostileStates = new Map();

// Hostility and KO set this session or saved before a reload (E-B), so an NPC
// that turned on the player is still hostile after a reload and a knocked-out
// one stays down. npcId -> { hostile: bool, ko: bool }. Saved by state-sync.js
// (exportHostility), sent back as savedNpcHostility and restored in game.js
// before any room's NPCs load.
const hostilityRecord = new Map();
// Restored as hostile (and not KO'd): the NPC's behavior announces it once its
// sprite exists (takeRestoredHostility), so its tint and health bar come back.
const restoredPending = new Map();

function recordHostility(npcId, state) {
  hostilityRecord.set(npcId, { hostile: !!state.isHostile, ko: !!state.isKO });
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
    exportHostility: () => exportHostility(),
    restoreHostility: (saved) => restoreHostility(saved),
    takeRestoredHostility: (npcId) => takeRestoredHostility(npcId),
    announceRestoredHostile: (npcId, config) => announceRestoredHostile(npcId, config)
  };
}

/** { npcId: { hostile, ko } } for the server (state-sync.js). */
export function exportHostility() {
  return Object.fromEntries(hostilityRecord);
}

/**
 * Restore hostility and KO saved before a reload. Runs before any NPC
 * registers, so the state is in place when sprites and behaviors are made
 * (npc-sprites.js reads isNPCKO, npc-behavior.js reads takeRestoredHostility).
 * A change made this session wins. No event is emitted here: the NPC's
 * behavior announces a restored hostile once its sprite exists.
 * @param {Object} saved - { npcId: { hostile: bool, ko: bool } }
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
    }
    recordHostility(npcId, state);
    restoredPending.set(npcId, { hostile, ko });
    restored++;
  }
  if (restored) console.log(`⚔️ Restored hostility for ${restored} NPC(s)`);
  return restored;
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
 * and hostility eventMappings come back. Picks up the behavior's attackDamage,
 * which wasn't known when the state was restored.
 */
export function announceRestoredHostile(npcId, config) {
  const state = npcHostileStates.get(npcId);
  if (!state || !state.isHostile || state.isKO) return false;
  if (config?.attackDamage) state.attackDamage = config.attackDamage;
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
    // Get attack damage from NPC behavior config if available
    const npcBehavior = window.npcBehaviorManager?.getBehavior(npcId);
    const attackDamage = npcBehavior?.config?.hostile?.attackDamage || config?.attackDamage;
    state = createHostileState(npcId, { attackDamage });
    npcHostileStates.set(npcId, state);
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

function damageNPC(npcId, amount) {
  const state = getNPCHostileState(npcId);
  if (!state) return false;

  if (state.isKO) {
    console.log(`NPC ${npcId} already KO`);
    return false;
  }

  const oldHP = state.currentHP;
  state.currentHP = Math.max(0, state.currentHP - amount);

  console.log(`NPC ${npcId} HP: ${oldHP} → ${state.currentHP}`);

  // Check for KO
  if (state.currentHP <= 0) {
    state.isKO = true;
    recordHostility(npcId, state);

    // Get NPC reference for death animation and server sync
    const npc = window.npcManager?.getNPC(npcId);
    const sprite = npc?._sprite || npc?.sprite;
    
    // Sync NPC KO state to server for persistence
    if (window.RoomStateSync && npc?.roomId) {
      window.RoomStateSync.updateNpcState(npc.roomId, npcId, {
        isKO: true,
        currentHP: 0
      }).catch(err => {
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
    dropNPCItems(npcId);

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
 * Items spawn directly at the NPC's position (which is always player-accessible).
 * Physics launches are intentionally avoided: when an NPC dies near a wall or
 * furniture, velocity-based drops collide with geometry and leave items in
 * unreachable positions. Instead each item is placed at a small static offset
 * so multiple drops are visually distinguishable while remaining pickupable.
 * @param {string} npcId - The NPC that was defeated
 */
function dropNPCItems(npcId) {
  const npc = window.npcManager?.getNPC(npcId);
  let sprite = npc?._sprite || npc?.sprite;
  if (npc && !sprite && npc.roomId) {
    sprite = window.rooms?.[npc.roomId]?.npcSprites?.find(s => s.npcId === npcId);
  }
  if (!npc || !npc.itemsHeld || npc.itemsHeld.length === 0) {
    return;
  }

  // Use the sprite we already have and find its room
  if (!sprite) {
    console.warn(`⚠️ Cannot drop items - no sprite found for NPC: ${npcId}`);
    return;
  }

  // Find the NPC's room
  let npcRoomId = npc.roomId;

  if (!npcRoomId) {
    console.warn(`Could not find room for NPC ${npcId}`);
    return;
  }

  const room = window.rooms[npcRoomId];
  const gameRef = window.game;
  const itemCount = npc.itemsHeld.length;
  
  npc.itemsHeld.forEach((item, index) => {
    // Place items at the NPC's location with a small static offset per item so
    // they don't perfectly stack. Using a fixed ring radius (8px) keeps them
    // close together and always within the walkable area the NPC occupied.
    const angle = (index / itemCount) * Math.PI * 2;
    const SCATTER_RADIUS = 8; // px — small enough to stay away from walls

    const spawnX = Math.round(sprite.x + Math.cos(angle) * SCATTER_RADIUS);
    const spawnY = Math.round(sprite.y + Math.sin(angle) * SCATTER_RADIUS);

    // Create actual Phaser sprite for the dropped item
    // Try item.texture, then item.type, with fallback to 'key' if texture doesn't exist
    let texture = item.texture || item.type || 'key';
    
    console.log(`💧 Attempting to drop item: type="${item.type}", name="${item.name}", texture="${texture}"`);
    
    // Safety check: verify texture exists, fallback to 'key' if not
    if (!gameRef.textures.exists(texture)) {
      console.warn(`⚠️ Texture '${texture}' not found for dropped item '${item.name}', using fallback 'key'`);
      texture = 'key';
    } else {
      console.log(`✅ Texture '${texture}' exists for dropped item '${item.name}'`);
    }
    
    const spriteObj = gameRef.add.sprite(spawnX, spawnY, texture);
    
    // Set origin to match standard object creation
    spriteObj.setOrigin(0, 0);
    
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
      
      window.RoomStateSync.addItemToRoom(npcRoomId, itemForServer, {
        npcId: npcId,
        sourceType: 'npc_defeated'
      }).catch(err => {
        console.error('Failed to sync dropped item to server:', err);
      });
    }
  });

  // Clear the NPC's inventory
  npc.itemsHeld = [];
}

function isNPCKO(npcId) {
  const state = npcHostileStates.get(npcId);
  return state ? state.isKO : false;
}
