/**
 * NPC Game Bridge
 * 
 * Provides a safe API for NPCs to influence game state through Ink stories.
 * NPCs can unlock doors, give items, set objectives, reveal secrets, and more.
 * 
 * This bridge is the primary interface between NPC dialogue (Ink) and game mechanics.
 */

export class NPCGameBridge {
  constructor() {
    this.actionLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Log an action for debugging and auditing
   */
  _logAction(action, params, result) {
    this.actionLog.push({
      timestamp: Date.now(),
      action,
      params,
      result,
      success: result.success !== false
    });
    
    // Keep log size manageable
    if (this.actionLog.length > this.maxLogSize) {
      this.actionLog.shift();
    }
    
    console.log(`🔗 [NPC Game Bridge] ${action}:`, params, '→', result);
  }

    /**
     * Unlock a door to a specific room
     * Calls server API to validate NPC unlock permission, then updates door sprites
     * @param {string} roomId - The ID of the room to unlock
     * @returns {Promise<Object>} Result object with success status
     */
    async unlockDoor(roomId) {
        if (!roomId) {
            const result = { success: false, error: 'No roomId provided' };
            this._logAction('unlockDoor', { roomId }, result);
            return result;
        }

        console.log(`🔓 NPCGameBridge: Attempting to unlock door to ${roomId}`);
        
        // Get the current NPC ID from conversation context
        const npcId = window.currentConversationNPCId;
        if (!npcId) {
            const result = { success: false, error: 'No NPC context available for unlock' };
            this._logAction('unlockDoor', { roomId, npcId }, result);
            return result;
        }

        // Call server API to validate NPC unlock permission
        const apiClient = window.ApiClient || window.APIClient;
        const gameId = window.breakEscapeConfig?.gameId;

        if (!apiClient || !gameId) {
            console.error('ApiClient or gameId not available for NPC unlock');
            const result = { success: false, error: 'API client not available' };
            this._logAction('unlockDoor', { roomId, npcId }, result);
            return result;
        }

        try {
            console.log(`� Calling server to validate NPC unlock: npcId=${npcId}, roomId=${roomId}`);
            const response = await apiClient.unlock('door', roomId, npcId, 'npc');

            if (response.success) {
                console.log(`✅ Server validated NPC unlock: ${npcId} can unlock ${roomId}`);
                
                // Update door sprites that lead to this room
                const doorSprites = this._findAllDoorSpritesForRoom(roomId);
                if (doorSprites.length > 0) {
                    console.log(`🚪 Found ${doorSprites.length} door sprite(s) to update`);
                    doorSprites.forEach(doorSprite => {
                        if (doorSprite.doorProperties) {
                            doorSprite.doorProperties.locked = false;
                            console.log(`✅ Unlocked door sprite to ${roomId}`);
                        }
                    });
                }

                // Update scenario and runtime data
                if (window.gameScenario && window.gameScenario.rooms && window.gameScenario.rooms[roomId]) {
                    window.gameScenario.rooms[roomId].locked = false;
                    console.log(`🔓 Unlocked room ${roomId} in gameScenario`);
                }

                if (window.rooms && window.rooms[roomId]) {
                    window.rooms[roomId].locked = false;
                    console.log(`🔓 Unlocked room ${roomId} in runtime rooms`);
                }

                // Emit event
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('door_unlocked_by_npc', { 
                        roomId,
                        npcId,
                        source: 'npc'
                    });
                }

                const result = { 
                    success: true, 
                    roomId,
                    npcId,
                    doorSpritesUpdated: doorSprites.length,
                    message: `Door to ${roomId} unlocked by ${npcId}`
                };
                this._logAction('unlockDoor', { roomId, npcId }, result);
                return result;
            } else {
                console.error('Server denied NPC unlock:', response);
                const result = { 
                    success: false, 
                    error: response.error || 'NPC does not have permission to unlock this door',
                    roomId,
                    npcId
                };
                this._logAction('unlockDoor', { roomId, npcId }, result);
                return result;
            }
        } catch (error) {
            console.error('Error calling server for NPC unlock:', error);
            const result = { 
                success: false, 
                error: error.message,
                roomId,
                npcId
            };
            this._logAction('unlockDoor', { roomId, npcId }, result);
            return result;
        }
    }

    /**
     * Find all door sprites leading to a specific room (helper method)
     * @param {string} roomId - Room ID to find doors for
     * @returns {Array} Array of door sprites
     * @private
     */
    _findAllDoorSpritesForRoom(roomId) {
        if (!window.rooms) return [];

        const doors = [];
        
        // Iterate through all rooms to find doors leading to the target room
        Object.keys(window.rooms).forEach(sourceRoomId => {
            const room = window.rooms[sourceRoomId];
            if (room.doorSprites && Array.isArray(room.doorSprites)) {
                const matchingDoors = room.doorSprites.filter(doorSprite =>
                    doorSprite.doorProperties &&
                    doorSprite.doorProperties.connectedRoom === roomId
                );
                doors.push(...matchingDoors);
            }
        });

        return doors;
    }

  /**
   * Give an item from NPC's inventory to the player immediately
   * @param {string} npcId - NPC identifier
   * @param {string} itemType - Type of item to give (optional - gives first if null)
   * @returns {Object} Result with success status
   */
  async giveItem(npcId, itemType = null, itemSelector = null) {
    if (!npcId) {
      const result = { success: false, error: 'No npcId provided' };
      this._logAction('giveItem', { npcId, itemType }, result);
      return result;
    }

    // Get NPC from manager
    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) {
      const result = { success: false, error: `NPC ${npcId} not found` };
      this._logAction('giveItem', { npcId, itemType, itemSelector }, result);
      return result;
    }

    if (!npc.itemsHeld || npc.itemsHeld.length === 0) {
      const result = { success: false, error: `NPC ${npcId} has no items to give` };
      this._logAction('giveItem', { npcId, itemType, itemSelector }, result);
      return result;
    }

    // Find item in NPC's inventory
    let itemIndex = -1;
    if (itemType) {
      // Find the first item matching type and, if provided, selector.
      itemIndex = npc.itemsHeld.findIndex(item => {
        if (item.type !== itemType) {
          return false;
        }

        if (!itemSelector) {
          return true;
        }

        const selector = itemSelector.toLowerCase();
        // opens_lock is the lock this item opens; key_id is its pre-rename name,
        // kept so a mission started before the rename still resolves its selectors.
        return [item.id, item.opens_lock, item.key_id, item.name].some(value =>
          value && String(value).toLowerCase() === selector
        );
      });
      if (itemIndex === -1) {
        const result = { success: false, error: `NPC ${npcId} doesn't have ${itemType}${itemSelector ? ` (${itemSelector})` : ''}` };
        this._logAction('giveItem', { npcId, itemType, itemSelector }, result);
        return result;
      }
    } else {
      // Give first item
      itemIndex = 0;
    }

    const item = npc.itemsHeld[itemIndex];

    if (!window.addToInventory) {
      const result = { success: false, error: 'Inventory system not available' };
      this._logAction('giveItem', { npcId, itemType }, result);
      return result;
    }

    try {
      // Create sprite using container pattern
      const tempSprite = {
        scenarioData: item,
        name: item.type,
        objectId: `npc_gift_${npcId}_${item.type}_${Date.now()}`,
        texture: { key: item.type }
      };

      // Await addToInventory so server inventory is confirmed before removing from NPC.
      // This prevents the race condition where validate_unlock is called before the
      // inventory POST /inventory request completes, causing a spurious 422.
      const addResult = await window.addToInventory(tempSprite);

      // Only the NPC still holds this item, so if it did not reach the
      // inventory it must stay with the NPC. Splicing regardless is what made
      // a refused give_item destroy the item outright: gone from the NPC, never
      // added to the player, and unobtainable for the rest of the run.
      // result.ok covers 'already' as well as 'added' -- both mean the player
      // has it and the NPC's copy is safe to drop.
      if (!addResult || !addResult.ok) {
        const reason = addResult ? addResult.reason : 'no result';
        console.error(`[NPCGameBridge] ${item.type} from ${npcId} was not added (${reason}) - leaving it with the NPC so it can be given again`);
        if (window.gameAlert) {
          window.gameAlert(`Could not take ${item.name || item.type}. Try asking again.`, 'error', 'Item Not Received');
        }
        return;
      }

      // Play item pickup sound (same as picking up world items or taking from containers)
      if (window.playUISound) window.playUISound('item');

      // Remove from NPC's inventory (after server confirms)
      npc.itemsHeld.splice(itemIndex, 1);

      // Emit event to update Ink variables
      if (window.eventDispatcher) {
        window.eventDispatcher.emit('npc_items_changed', { npcId });
      }

      const result = { success: true, item, npcId };
      this._logAction('giveItem', { npcId, itemType, itemSelector }, result);
      return result;
    } catch (error) {
      const result = { success: false, error: error.message };
      this._logAction('giveItem', { npcId, itemType, itemSelector }, result);
      return result;
    }
  }

    /**
     * Show NPC's inventory items in container UI
     * @param {string} npcId - NPC identifier
     * @param {string[]} filterTypes - Array of item types to show (null = all)
     * @returns {Object} Result with success status
     */
    showNPCInventory(npcId, filterTypes = null) {
        if (!npcId) {
            const result = { success: false, error: 'No npcId provided' };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        }

        const npc = window.npcManager?.getNPC(npcId);
        if (!npc) {
            const result = { success: false, error: `NPC ${npcId} not found` };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        }

        if (!npc.itemsHeld || npc.itemsHeld.length === 0) {
            const result = { success: false, error: `NPC ${npcId} has no items` };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        }

        // Filter items if types specified
        let itemsToShow = npc.itemsHeld;
        if (filterTypes && filterTypes.length > 0) {
            itemsToShow = npc.itemsHeld.filter(item => 
                filterTypes.includes(item.type)
            );
        }

        if (itemsToShow.length === 0) {
            const result = { success: false, error: 'No matching items to show' };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        }

        // Open container minigame in NPC mode
        if (window.startContainerMinigame) {
            // Create a pseudo-container item for the minigame
            // The minigame expects a containerItem with scenarioData
            const containerItem = {
                scenarioData: {
                    name: `${npc.displayName}'s Items`,
                    type: 'npc_inventory',
                    observations: `Equipment and items held by ${npc.displayName}`
                },
                name: 'NPC Inventory',
                texture: { key: 'generic' },
                objectId: `npc_container_${npcId}`
            };

            // Save the current conversation state so we can return to it
            // This will be used by returnToConversationAfterNPCInventory()
            window.pendingConversationReturn = {
                npcId: npcId,
                type: window.currentConversationMinigameType || 'person-chat' // 'person-chat' or 'phone-chat'
            };

            // Pass additional NPC context through the minigame
            window.startContainerMinigame(containerItem, itemsToShow, false, null, {
                mode: 'npc',
                npcId: npcId,
                npcDisplayName: npc.displayName,
                npcAvatar: npc.avatar
            });

            const result = { success: true, npcId, itemCount: itemsToShow.length };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        } else {
            const result = { success: false, error: 'Container minigame not available' };
            this._logAction('showNPCInventory', { npcId, filterTypes }, result);
            return result;
        }
    }

  /**
   * Set the current objective text
   * @param {string} text - Objective text to display
   * @returns {Object} Result object with success status
   */
  setObjective(text) {
    if (!text) {
      const result = { success: false, error: 'No objective text provided' };
      this._logAction('setObjective', { text }, result);
      return result;
    }

    if (!window.gameState) {
      window.gameState = {};
    }

    window.gameState.currentObjective = text;

    // Show notification if notification system exists
    if (window.showNotification) {
      window.showNotification(`New Objective: ${text}`, 'objective');
    } else {
      console.log(`📋 New Objective: ${text}`);
    }

    // Emit event
    if (window.eventDispatcher) {
      window.eventDispatcher.emit('objective_set', {
        objective: text,
        source: 'npc'
      });
    }

    const result = { success: true, objective: text };
    this._logAction('setObjective', { text }, result);
    return result;
  }

  /**
   * Reveal a secret or piece of information
   * @param {string} secretId - Unique identifier for the secret
   * @param {*} data - The secret data (string, object, etc.)
   * @returns {Object} Result object with success status
   */
  revealSecret(secretId, data) {
    if (!secretId) {
      const result = { success: false, error: 'No secretId provided' };
      this._logAction('revealSecret', { secretId, data }, result);
      return result;
    }

    if (!window.gameState) {
      window.gameState = {};
    }

    if (!window.gameState.revealedSecrets) {
      window.gameState.revealedSecrets = {};
    }

    window.gameState.revealedSecrets[secretId] = {
      data,
      timestamp: Date.now(),
      source: 'npc'
    };

    console.log(`🔍 Secret revealed: ${secretId}`, data);

    // Emit event
    if (window.eventDispatcher) {
      window.eventDispatcher.emit('secret_revealed', {
        secretId,
        data,
        source: 'npc'
      });
    }

    const result = { success: true, secretId, data };
    this._logAction('revealSecret', { secretId, data }, result);
    return result;
  }

  /**
   * Add a note to the player's notes
   * @param {string} title - Note title
   * @param {string} content - Note content
   * @returns {Object} Result object with success status
   */
  addNote(title, content) {
    if (!title || !content) {
      const result = { success: false, error: 'Title and content required' };
      this._logAction('addNote', { title, content }, result);
      return result;
    }

    if (!window.gameState) {
      window.gameState = {};
    }

    if (!window.gameState.notes) {
      window.gameState.notes = [];
    }

    const note = {
      title,
      content,
      timestamp: Date.now(),
      source: 'npc'
    };

    window.gameState.notes.push(note);

    // Show notification
    if (window.showNotification) {
      window.showNotification(`New Note: ${title}`, 'info');
    }

    // Emit event
    if (window.eventDispatcher) {
      window.eventDispatcher.emit('note_added', {
        title,
        source: 'npc'
      });
    }

    const result = { success: true, note };
    this._logAction('addNote', { title, content }, result);
    return result;
  }

  /**
   * Trigger a game event
   * @param {string} eventName - Name of the event
   * @param {Object} eventData - Event data
   * @returns {Object} Result object with success status
   */
  triggerEvent(eventName, eventData = {}) {
    if (!eventName) {
      const result = { success: false, error: 'No eventName provided' };
      this._logAction('triggerEvent', { eventName, eventData }, result);
      return result;
    }

    if (!window.eventDispatcher) {
      const result = { success: false, error: 'Event dispatcher not available' };
      this._logAction('triggerEvent', { eventName, eventData }, result);
      return result;
    }

    window.eventDispatcher.emit(eventName, {
      ...eventData,
      source: 'npc'
    });

    const result = { success: true, eventName, eventData };
    this._logAction('triggerEvent', { eventName, eventData }, result);
    return result;
  }

  /**
   * Mark a room as discovered
   * @param {string} roomId - Room ID to discover
   * @returns {Object} Result object with success status
   */
  discoverRoom(roomId) {
    if (!roomId) {
      const result = { success: false, error: 'No roomId provided' };
      this._logAction('discoverRoom', { roomId }, result);
      return result;
    }

    if (!window.discoveredRooms) {
      window.discoveredRooms = new Set();
    }

    window.discoveredRooms.add(roomId);

    // Emit event
    if (window.eventDispatcher) {
      window.eventDispatcher.emit('room_discovered', {
        roomId,
        source: 'npc'
      });
    }

    const result = { success: true, roomId };
    this._logAction('discoverRoom', { roomId }, result);
    return result;
  }

  /**
   * Get the action log for debugging
   * @returns {Array} Array of logged actions
   */
  getActionLog() {
    return this.actionLog;
  }

  /**
   * Clear the action log
   */
  clearActionLog() {
    this.actionLog = [];
  }

  // ===== NPC BEHAVIOR CONTROL METHODS =====

  /**
   * Set NPC hostile state
   * @param {string} npcId - NPC identifier
   * @param {boolean} hostile - Hostile state
   * @returns {Object} Result object with success status
   */
  setNPCHostile(npcId, hostile) {
    console.log(`🎮 npc-game-bridge.setNPCHostile called: ${npcId} → ${hostile}`);
    
    if (!window.npcBehaviorManager) {
      const result = { success: false, error: 'NPCBehaviorManager not initialized' };
      this._logAction('setNPCHostile', { npcId, hostile }, result);
      return result;
    }

    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('hostile', hostile);
      console.log(`🎮 Set behavior hostile for ${npcId}`);
      
      // Also update the hostile system to emit events and trigger health bars
      if (window.npcHostileSystem) {
        console.log(`🎮 Calling npcHostileSystem.setNPCHostile for ${npcId}`);
        // Pass behavior config so hostile system can get attackDamage
        window.npcHostileSystem.setNPCHostile(npcId, hostile, behavior.config?.hostile);
      } else {
        console.warn(`🎮 npcHostileSystem not found!`);
      }
      
      const result = { success: true, npcId, hostile };
      this._logAction('setNPCHostile', { npcId, hostile }, result);
      return result;
    } else {
      const result = { success: false, error: `Behavior not found for NPC: ${npcId}` };
      this._logAction('setNPCHostile', { npcId, hostile }, result);
      return result;
    }
  }

  /**
   * Set NPC influence score
   * @param {string} npcId - NPC identifier
   * @param {number} influence - Influence value
   * @returns {Object} Result object with success status
   */
  setNPCInfluence(npcId, influence) {
    if (!window.npcBehaviorManager) {
      const result = { success: false, error: 'NPCBehaviorManager not initialized' };
      this._logAction('setNPCInfluence', { npcId, influence }, result);
      return result;
    }

    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('influence', influence);

      // Check if influence change should trigger hostile state
      this._updateNPCBehaviorFromInfluence(npcId, influence);

      const result = { success: true, npcId, influence };
      this._logAction('setNPCInfluence', { npcId, influence }, result);
      return result;
    } else {
      const result = { success: false, error: `Behavior not found for NPC: ${npcId}` };
      this._logAction('setNPCInfluence', { npcId, influence }, result);
      return result;
    }
  }

  /**
   * Toggle NPC patrol mode
   * @param {string} npcId - NPC identifier
   * @param {boolean} enabled - Patrol enabled
   * @returns {Object} Result object with success status
   */
  setNPCPatrol(npcId, enabled) {
    if (!window.npcBehaviorManager) {
      const result = { success: false, error: 'NPCBehaviorManager not initialized' };
      this._logAction('setNPCPatrol', { npcId, enabled }, result);
      return result;
    }

    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('patrol', enabled);
      const result = { success: true, npcId, enabled };
      this._logAction('setNPCPatrol', { npcId, enabled }, result);
      return result;
    } else {
      const result = { success: false, error: `Behavior not found for NPC: ${npcId}` };
      this._logAction('setNPCPatrol', { npcId, enabled }, result);
      return result;
    }
  }

  /**
   * Set NPC personal space distance
   * @param {string} npcId - NPC identifier
   * @param {number} distance - Personal space distance in pixels
   * @returns {Object} Result object with success status
   */
  setNPCPersonalSpace(npcId, distance) {
    if (!window.npcBehaviorManager) {
      const result = { success: false, error: 'NPCBehaviorManager not initialized' };
      this._logAction('setNPCPersonalSpace', { npcId, distance }, result);
      return result;
    }

    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (behavior) {
      behavior.setState('personalSpaceDistance', distance);
      const result = { success: true, npcId, distance };
      this._logAction('setNPCPersonalSpace', { npcId, distance }, result);
      return result;
    } else {
      const result = { success: false, error: `Behavior not found for NPC: ${npcId}` };
      this._logAction('setNPCPersonalSpace', { npcId, distance }, result);
      return result;
    }
  }

  /**
   * Update NPC behavior based on influence value
   * (Internal method - called by setNPCInfluence)
   * @param {string} npcId - NPC identifier
   * @param {number} influence - Influence value
   * @private
   */

  /**
   * Remove an NPC from the scene (arrested, surrendered, escorted away).
   * Destroys the sprite immediately and persists the removal so the NPC
   * does not reappear after a browser refresh.
   * @param {string} npcId - NPC to remove
   * @returns {Promise<Object>} Result object with success status
   */
  async removeNpcFromScene(npcId) {
    if (!npcId) {
      const result = { success: false, error: 'No NPC ID provided' };
      this._logAction('removeNpcFromScene', { npcId }, result);
      return result;
    }

    const npc = window.npcManager?.getNPC(npcId);
    if (!npc) {
      const result = { success: false, error: `NPC ${npcId} not found` };
      this._logAction('removeNpcFromScene', { npcId }, result);
      return result;
    }

    const roomId = npc.roomId;

    // Destroy sprite immediately so the NPC disappears from the world
    const sprite = npc._sprite || npc.sprite;
    if (sprite && !sprite.destroyed) {
      sprite.destroy();
    }

    // Persist the removal server-side so the NPC stays gone after reload
    if (window.RoomStateSync && roomId) {
      window.RoomStateSync.removeNpcFromScene(roomId, npcId).catch(err => {
        console.error(`Failed to persist scene removal for NPC ${npcId}:`, err);
      });
    }

    console.log(`🚪 NPC ${npcId} removed from scene (room: ${roomId})`);
    const result = { success: true, npcId, roomId };
    this._logAction('removeNpcFromScene', { npcId }, result);
    return result;
  }

  _updateNPCBehaviorFromInfluence(npcId, influence) {
    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (!behavior) return;

    const threshold = behavior.config.hostile.influenceThreshold;

    // Auto-trigger hostile if influence drops below threshold
    if (influence < threshold && !behavior.hostile) {
      this.setNPCHostile(npcId, true);
      console.log(`⚠️ NPC ${npcId} became hostile due to low influence (${influence} < ${threshold})`);
    }
    // Auto-disable hostile if influence recovers
    else if (influence >= threshold && behavior.hostile) {
      this.setNPCHostile(npcId, false);
      console.log(`✅ NPC ${npcId} no longer hostile (influence: ${influence})`);
    }
  }
}

// Create singleton instance
const bridge = new NPCGameBridge();

// Export default for ES6 modules
export default bridge;

// Also make available globally for Ink external functions
if (typeof window !== 'undefined') {
  window.NPCGameBridge = bridge;
  
  // Register convenience methods globally for Ink
  window.npcUnlockDoor = (roomId) => bridge.unlockDoor(roomId);
  window.npcGiveItem = (npcId, itemType, itemSelector) => bridge.giveItem(npcId, itemType, itemSelector);
  window.npcShowInventory = (npcId, filterTypes) => bridge.showNPCInventory(npcId, filterTypes);
  window.npcSetObjective = (text) => bridge.setObjective(text);
  window.npcRevealSecret = (secretId, data) => bridge.revealSecret(secretId, data);
  window.npcAddNote = (title, content) => bridge.addNote(title, content);
  window.npcTriggerEvent = (eventName, eventData) => bridge.triggerEvent(eventName, eventData);
  window.npcRemoveFromScene = (npcId) => bridge.removeNpcFromScene(npcId);
  window.npcDiscoverRoom = (roomId) => bridge.discoverRoom(roomId);

  // NPC Behavior control methods
  window.npcSetHostile = (npcId, hostile) => bridge.setNPCHostile(npcId, hostile);
  window.npcSetInfluence = (npcId, influence) => bridge.setNPCInfluence(npcId, influence);
  window.npcSetPatrol = (npcId, enabled) => bridge.setNPCPatrol(npcId, enabled);
  window.npcSetPersonalSpace = (npcId, distance) => bridge.setNPCPersonalSpace(npcId, distance);

  // Also expose bridge instance for direct access
  window.npcGameBridge = bridge;
}
