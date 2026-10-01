/**
 * ObjectivesManager
 * 
 * Tracks mission objectives (aims) and their sub-tasks.
 * Listens to game events and updates objective progress.
 * Syncs state with server for validation.
 * 
 * @module objectives-manager
 */

export class ObjectivesManager {
  constructor(eventDispatcher) {
    this.eventDispatcher = eventDispatcher;
    this.aims = [];           // Array of aim objects
    this.taskIndex = {};      // Quick lookup: taskId -> task object
    this.aimIndex = {};       // Quick lookup: aimId -> aim object
    this.listeners = [];      // UI update callbacks
    this.syncTimeouts = {};   // Debounced sync timers
    this.initialized = false;
    
    this.setupEventListeners();
  }
  
  /**
   * Initialize objectives from scenario data
   * @param {Array} objectivesData - Array of aim objects from scenario
   */
  initialize(objectivesData) {
    if (!objectivesData || !objectivesData.length) {
      console.log('📋 No objectives defined in scenario');
      return;
    }
    
    // Deep clone to avoid mutating scenario
    this.aims = JSON.parse(JSON.stringify(objectivesData));
    
    // Build indexes
    this.aims.forEach(aim => {
      this.aimIndex[aim.aimId] = aim;
      aim.tasks.forEach(task => {
        task.aimId = aim.aimId;
        // Ensure task has a status, default to 'active' if not specified
        if (!task.status) {
          task.status = 'active';
        }
        task.originalStatus = task.status; // Store for reset
        
        // Initialize submit_flags task properties
        if (task.type === 'submit_flags') {
          if (!task.submittedFlags) {
            task.submittedFlags = [];
          }
          if (task.targetCount === undefined && task.targetFlags) {
            task.targetCount = task.targetFlags.length;
          }
          if (task.currentCount === undefined) {
            task.currentCount = 0;
          }
          console.log(`📋 Initialized submit_flags task ${task.taskId}: status=${task.status}, targetFlags=${task.targetFlags?.join(', ') || 'none'}, targetCount=${task.targetCount}`);
        }
        
        // collect_items defaults to 1 item (server does the same)
        if (task.type === 'collect_items' && !task.targetCount) {
          task.targetCount = 1;
        }
        
        this.taskIndex[task.taskId] = task;
      });
    });
    
    // Sort by order
    this.aims.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Restore state from server if available
    this.restoreState();
    
    // Reconcile with current game state (handles items collected before objectives loaded)
    this.reconcileWithGameState();
    
    this.initialized = true;
    console.log(`📋 Objectives initialized: ${this.aims.length} aims, ${Object.keys(this.taskIndex).length} tasks`);
    this.notifyListeners();
  }
  
  /**
   * Restore objective state from player_state (passed from server via objectivesState)
   */
  restoreState() {
    const savedState = window.gameState?.objectives;
    if (!savedState) return;
    
    // Restore aim statuses
    Object.entries(savedState.aims || {}).forEach(([aimId, state]) => {
      if (this.aimIndex[aimId]) {
        this.aimIndex[aimId].status = state.status;
        this.aimIndex[aimId].completedAt = state.completedAt;
      }
    });
    
    // Restore task statuses and progress
    Object.entries(savedState.tasks || {}).forEach(([taskId, state]) => {
      if (this.taskIndex[taskId]) {
        // Only restore status if it exists in saved state, otherwise keep original
        if (state.status) {
          this.taskIndex[taskId].status = state.status;
        }
        this.taskIndex[taskId].currentCount = state.progress || 0;
        this.taskIndex[taskId].completedAt = state.completedAt;
        // Restore submittedFlags for submit_flags tasks
        if (state.submittedFlags) {
          this.taskIndex[taskId].submittedFlags = state.submittedFlags;
          // Update currentCount based on submittedFlags length for submit_flags tasks
          if (this.taskIndex[taskId].type === 'submit_flags') {
            this.taskIndex[taskId].currentCount = state.submittedFlags.length;
          }
        }
      }
    });
    
    // Ensure all tasks have a valid status (use originalStatus if status is undefined)
    Object.values(this.taskIndex).forEach(task => {
      if (!task.status) {
        task.status = task.originalStatus || 'active';
        console.log(`📋 Restored task ${task.taskId} status to ${task.status} (was undefined)`);
      }
      // Also ensure submit_flags tasks have proper initialization
      if (task.type === 'submit_flags') {
        if (!task.submittedFlags) {
          task.submittedFlags = [];
        }
        if (task.targetCount === undefined && task.targetFlags) {
          task.targetCount = task.targetFlags.length;
        }
      }
    });
    
    console.log('📋 Restored objectives state from server');
  }
  
  /**
   * Reconcile objectives with current game state
   * Handles case where player collected items BEFORE objectives system initialized
   */
  reconcileWithGameState() {
    console.log('📋 Reconciling objectives with current game state...');
    
    // Check inventory for items matching collect_items tasks
    const inventoryItems = window.inventory?.items || [];
    
    Object.values(this.taskIndex).forEach(task => {
      if (task.status !== 'active') return;
      
      switch (task.type) {
        case 'collect_items':
          const matchingItems = inventoryItems.filter(item => {
            const itemType = item.scenarioData?.type || item.getAttribute?.('data-type');
            const itemId = item.scenarioData?.id;
            const itemName = item.scenarioData?.name;
            
            let matches = false;
            
            // Type-based matching
            if (task.targetItems && task.targetItems.length > 0) {
              matches = task.targetItems.includes(itemType);
            }
            
            // ID-based matching (more specific)
            if (task.targetItemIds && task.targetItemIds.length > 0) {
              const identifier = itemId || itemName;
              matches = task.targetItemIds.includes(identifier);
            }
            
            // If both specified, match either
            if (task.targetItems && task.targetItems.length > 0 && 
                task.targetItemIds && task.targetItemIds.length > 0) {
              const typeMatch = task.targetItems.includes(itemType);
              const identifier = itemId || itemName;
              const idMatch = task.targetItemIds.includes(identifier);
              matches = typeMatch || idMatch;
            }
            
            return matches;
          });
          
          // Also count keys from keyRing
          const keyRingItems = window.inventory?.keyRing?.keys || [];
          const matchingKeys = keyRingItems.filter(key => {
            const keyType = key.scenarioData?.type;
            const keyId = window.lockRef(key.scenarioData) || key.scenarioData?.id;
            const keyName = key.scenarioData?.name;
            
            let matches = false;
            
            // Type-based matching
            if (task.targetItems && task.targetItems.length > 0) {
              matches = task.targetItems.includes(keyType) || task.targetItems.includes('key');
            }
            
            // ID-based matching
            if (task.targetItemIds && task.targetItemIds.length > 0) {
              const identifier = keyId || keyName;
              matches = task.targetItemIds.includes(identifier);
            }
            
            // If both specified, match either
            if (task.targetItems && task.targetItems.length > 0 && 
                task.targetItemIds && task.targetItemIds.length > 0) {
              const typeMatch = task.targetItems.includes(keyType) || task.targetItems.includes('key');
              const identifier = keyId || keyName;
              const idMatch = task.targetItemIds.includes(identifier);
              matches = typeMatch || idMatch;
            }
            
            return matches;
          });
          
          const totalCount = matchingItems.length + matchingKeys.length;
          
          if (totalCount > (task.currentCount || 0)) {
            task.currentCount = totalCount;
            console.log(`📋 Reconciled ${task.taskId}: ${totalCount}/${task.targetCount}`);
            
            if (totalCount >= task.targetCount) {
              this.completeTask(task.taskId);
            }
          }
          break;
          
        case 'unlock_object':
          // Auto-complete if the target object was already unlocked in a prior session
          if (window.gameState?.unlockedObjects?.includes(task.targetObject)) {
            console.log(`📋 Reconciled ${task.taskId}: object already unlocked`);
            this.completeTask(task.taskId);
          }
          break;

        case 'unlock_room':
          // Check if room is already unlocked
          const unlockedRooms = window.gameState?.unlockedRooms || [];
          const isUnlocked = unlockedRooms.includes(task.targetRoom) || 
                            window.discoveredRooms?.has(task.targetRoom);
          if (isUnlocked) {
            console.log(`📋 Reconciled ${task.taskId}: room already unlocked`);
            this.completeTask(task.taskId);
          }
          break;
          
        case 'enter_room':
          // Check if room was already visited
          if (window.discoveredRooms?.has(task.targetRoom)) {
            console.log(`📋 Reconciled ${task.taskId}: room already visited`);
            this.completeTask(task.taskId);
          }
          break;
      }
    });
  }
  
  /**
   * Setup event listeners for automatic objective tracking
   * NOTE: Event names match actual codebase implementation
   */
  setupEventListeners() {
    if (!this.eventDispatcher) {
      console.warn('📋 ObjectivesManager: No event dispatcher available');
      return;
    }
    
    // Item collection - wildcard pattern works with NPCEventDispatcher
    this.eventDispatcher.on('item_picked_up:*', (data) => {
      this.handleItemPickup(data);
    });
    
    // Room/door unlocks
    // NOTE: door_unlocked provides both 'roomId' and 'connectedRoom'
    // Use 'connectedRoom' for unlock_room tasks (the room being unlocked)
    this.eventDispatcher.on('door_unlocked', (data) => {
      this.handleRoomUnlock(data.connectedRoom);
    });
    
    this.eventDispatcher.on('door_unlocked_by_npc', (data) => {
      this.handleRoomUnlock(data.roomId);
    });
    
    // Object unlocks - NOTE: event is 'item_unlocked' (not 'object_unlocked')
    this.eventDispatcher.on('item_unlocked', (data) => {
      // data contains: { itemId, itemType, itemName, lockType }
      this.handleObjectUnlock(data.itemName, data.itemType, data.itemId);
    });
    
    // Room entry
    this.eventDispatcher.on('room_entered', (data) => {
      this.handleRoomEntered(data.roomId);
    });
    
    // NPC conversation completion (via ink tag)
    this.eventDispatcher.on('task_completed_by_npc', (data) => {
      this.completeTask(data.taskId);
    });
    
    // Flag submission — kept for other listeners (NPC eventMappings, music system, etc.)
    // Task completion is handled by flag_tasks_updated below, not here.
    this.eventDispatcher.on('flag_submitted', (data) => {
      this.handleFlagSubmission(data);
    });

    // Server-confirmed flag task outcomes — drives task/aim completion
    this.eventDispatcher.on('flag_tasks_updated', (data) => {
      this.handleFlagTasksUpdated(data);
    });

    console.log('📋 ObjectivesManager event listeners registered');
  }
  
  /**
   * Handle item pickup - check collect_items tasks
   * Supports both type-based matching (targetItems) and ID-based matching (targetItemIds)
   */
  handleItemPickup(data) {
    if (!this.initialized) return;
    
    const itemType = data.itemType;
    const itemId = data.itemId;
    const itemName = data.itemName;
    
    // Find all active collect_items tasks that target this item
    Object.values(this.taskIndex).forEach(task => {
      if (task.type !== 'collect_items') return;
      if (task.status === 'completing') {
        // A completion POST is in flight and may be rejected (it can beat the
        // inventory/collect POST). Keep the pickup and replay it after a revert.
        if (!task._pendingPickups) task._pendingPickups = [];
        task._pendingPickups.push(data);
        return;
      }
      if (task.status !== 'active') return;

      // Check if item matches task criteria
      let matches = false;

      // Group-based matching (targetGroup) — takes priority when present
      const collectionGroup = data.collectionGroup;
      if (task.targetGroup) {
        matches = !!(collectionGroup && task.targetGroup === collectionGroup);
      } else {
        // Type-based matching (targetItems array)
        if (task.targetItems && task.targetItems.length > 0) {
          matches = task.targetItems.includes(itemType);
        }

        // ID-based matching (targetItemIds array) - more specific, overrides type matching
        if (task.targetItemIds && task.targetItemIds.length > 0) {
          // Match by ID if available, fall back to name
          const identifier = itemId || itemName;
          matches = task.targetItemIds.includes(identifier);
        }

        // If both are specified, item must match at least one
        if (task.targetItems && task.targetItems.length > 0 &&
            task.targetItemIds && task.targetItemIds.length > 0) {
          const typeMatch = task.targetItems.includes(itemType);
          const identifier = itemId || itemName;
          const idMatch = task.targetItemIds.includes(identifier);
          matches = typeMatch || idMatch;
        }
      }

      if (!matches) return;

      // Don't count past the target (guard against server rejection + revert loops)
      if ((task.currentCount || 0) >= task.targetCount) return;

      // Dedup: track which specific items have already been counted for this task
      if (!task._collectedItemKeys) task._collectedItemKeys = new Set();
      const itemKey = itemId || itemName;
      if (itemKey && task._collectedItemKeys.has(itemKey)) return;
      if (itemKey) task._collectedItemKeys.add(itemKey);

      // Increment progress
      task.currentCount = (task.currentCount || 0) + 1;
      
      console.log(`📋 Task progress: ${task.title} (${task.currentCount}/${task.targetCount})`);
      
      // Check completion
      if (task.currentCount >= task.targetCount) {
        this.completeTask(task.taskId);
      } else {
        // Sync progress to server
        this.syncTaskProgress(task.taskId, task.currentCount);
        this.notifyListeners();
      }
    });
  }
  
  /**
   * Handle flag submission event.
   * Task completion is now server-authoritative and handled via handleFlagTasksUpdated.
   * This handler is kept because other systems (NPC eventMappings, music) listen to flag_submitted.
   * @param {Object} data - Event data containing flagId, flagKey, vmId, stationId
   */
  handleFlagSubmission(data) {
    // Task completion is driven by the flag_tasks_updated event (server-confirmed outcomes).
    // Nothing to do here for objectives tracking.
    console.log(`📋 flag_submitted received (task completion handled server-side):`, data.flagId);
  }

  /**
   * Handle server-confirmed flag task outcomes.
   * Called after the server has validated the flag AND persisted task/aim state.
   * Updates local UI state only — no serverCompleteTask round-trip needed.
   * @param {Object} data - { flagId, completedTasks: [...taskIds], updatedTasks: [...taskIds] }
   */
  handleFlagTasksUpdated(data) {
    if (!this.initialized) return;

    // Mark tasks completed (server already persisted this)
    (data.completedTasks || []).forEach(taskId => {
      const task = this.taskIndex[taskId];
      if (!task || task.status === 'completed') return;

      task.status      = 'completed';
      task.completedAt = new Date().toISOString();

      this.showTaskCompleteNotification(task);
      this.processTaskCompletion(task);   // handles onComplete.unlockTask / unlockAim

      // Auto-reveal locked parent aim (unless it has an unmet unlockCondition)
      this.revealAimForCompletedTask(task);

      this.checkAimCompletion(task.aimId);

      // Emit events for NPC eventMappings and other listeners
      this.eventDispatcher.emit('objective_task_completed', { taskId, aimId: task.aimId, task });
      this.eventDispatcher.emit(`objective_task_completed:${taskId}`, { taskId, aimId: task.aimId, task });

      console.log(`✅ Flag task completed (server-confirmed): ${task.title}`);
    });

    // Update progress counter for partially-submitted tasks
    (data.updatedTasks || []).forEach(taskId => {
      const task = this.taskIndex[taskId];
      if (!task || task.status !== 'active') return;
      task.currentCount = (task.currentCount || 0) + 1;
      console.log(`📋 Flag task progress updated: ${task.title} (${task.currentCount}/${task.targetCount})`);
    });

    this.notifyListeners();
  }

  /**
   * Handle room unlock - check unlock_room tasks
   */
  handleRoomUnlock(roomId) {
    if (!this.initialized) return;
    
    Object.values(this.taskIndex).forEach(task => {
      if (task.type !== 'unlock_room') return;
      if (task.status !== 'active') return;
      if (task.targetRoom !== roomId) return;
      
      this.completeTask(task.taskId);
    });
  }
  
  /**
   * Handle object unlock - check unlock_object tasks
   * Matches by object name or type (item_unlocked event provides itemName and itemType)
   */
  handleObjectUnlock(itemName, itemType, itemId) {
    if (!this.initialized) return;

    Object.values(this.taskIndex).forEach(task => {
      if (task.type !== 'unlock_object') return;
      if (task.status !== 'active') return;

      // Match by object ID (preferred), display name, or type
      const matches = (itemId && task.targetObject === itemId) ||
                      task.targetObject === itemName ||
                      task.targetObject === itemType;
      if (!matches) return;

      this.completeTask(task.taskId);
    });
  }
  
  /**
   * Handle room entry - check enter_room tasks
   */
  handleRoomEntered(roomId) {
    if (!this.initialized) return;
    
    Object.values(this.taskIndex).forEach(task => {
      if (task.type !== 'enter_room') return;
      if (task.status !== 'active') return;
      if (task.targetRoom !== roomId) return;
      
      this.completeTask(task.taskId);
    });
  }
  
  /**
   * Complete a task (called by event handlers or ink tags)
   * @param {string} taskId - The task ID to complete
   */
  /**
   * POST a completion, retrying while the failure looks transient.
   *
   * Write contention is bursty and short-lived -- several ink tags landing in
   * the same tick -- so a few spaced retries clear it. A genuine refusal
   * ("NPC not encountered") comes back with success:false and no transient
   * flag, and is returned on the first attempt without retrying.
   */
  async serverCompleteTaskWithRetry(taskId, attempts = 4) {
    let last = { success: false, error: 'No attempt made' };
    for (let i = 0; i < attempts; i++) {
      last = await this.serverCompleteTask(taskId);
      if (last.success || !last.transient) return last;
      const delay = 150 * Math.pow(2, i); // 150ms, 300, 600, 1200
      console.warn(`⏳ Transient failure completing ${taskId} (${last.error}); retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return last;
  }

  /**
   * Re-run pickups that arrived while a collect task was 'completing' and the
   * completion was then rejected/reverted. No-op if nothing was queued.
   */
  replayPendingPickups(task) {
    const pending = task._pendingPickups;
    task._pendingPickups = null;
    if (pending && pending.length) {
      pending.forEach(data => this.handleItemPickup(data));
    }
  }

  async completeTask(taskId) {
    const task = this.taskIndex[taskId];
    if (!task || task.status === 'completed' || task.status === 'completing') return;

    // Mark as completing immediately to block further event increments (race condition guard)
    task.status = 'completing';

    console.log(`✅ Completing task: ${task.title}`);

    // Server validation
    try {
      const response = await this.serverCompleteTaskWithRetry(taskId);
      if (!response.success) {
        console.warn(`⚠️ Server rejected task completion: ${response.error}`);
        task.status = 'active'; // Revert on server rejection
        this.replayPendingPickups(task);
        if (window.gameAlert) {
          window.gameAlert(response.error || 'Not yet…', 'warning', 'Objective Blocked');
        }
        return;
      }

      // Server confirmed conclusion — trigger end screen if configured
      if (response.missionConcluded) {
        const aim = this.aimIndex[task.aimId];
        this.handleMissionConcluded(aim);
      } else if (response.warning) {
        // Gate blocked conclusion — inform the player but keep the task completed
        console.warn(`⚠️ Mission conclusion blocked: ${response.warning}`);
        if (window.gameAlert) {
          window.gameAlert(response.warning, 'warning', 'Not Yet…');
        }
      }
    } catch (error) {
      // Completing locally after a failed sync is what stranded game 1021: the
      // player sees the task done, the server never records it, and any
      // conclusion gated on it can no longer be met. Leave the task active so a
      // later trigger can retry it, and say so plainly.
      console.error('Failed to sync task completion with server:', error);
      task.status = 'active';
      this.replayPendingPickups(task);
      if (window.gameAlert) {
        window.gameAlert('Could not save that objective. It will retry -- keep playing.',
                         'error', 'Sync Error');
      }
      return;
    }

    // Update local state
    task._pendingPickups = null;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    
    // Show notification
    this.showTaskCompleteNotification(task);

    // Process onComplete actions
    this.processTaskCompletion(task);

    // If the parent aim is locked, make it visible so the completed task shows up
    // (unless it has an unmet unlockCondition: then it stays hidden, see helper)
    this.revealAimForCompletedTask(task);

    // Check aim completion
    this.checkAimCompletion(task.aimId);
    
    // Emit both generic and specific events for NPC eventMappings
    // Generic event for wildcard listeners (objective_task_completed:*)
    this.eventDispatcher.emit('objective_task_completed', {
      taskId,
      aimId: task.aimId,
      task
    });
    
    // Specific event for NPC eventMappings (objective_task_completed:talk_to_alice)
    this.eventDispatcher.emit(`objective_task_completed:${taskId}`, {
      taskId,
      aimId: task.aimId,
      task
    });
    
    this.notifyListeners();
  }
  
  /**
   * Is an aim's unlockCondition satisfied right now?
   * Aims without a recognised condition return true.
   */
  isUnlockConditionMet(aim) {
    const cond = aim && aim.unlockCondition;
    if (!cond) return true;
    if (cond.aimCompleted) return this.aimIndex[cond.aimCompleted]?.status === 'completed';
    if (Array.isArray(cond.aimsCompleted)) {
      return cond.aimsCompleted.every(id => this.aimIndex[id]?.status === 'completed');
    }
    if (cond.globalVariable) {
      const expected = cond.equals === undefined ? true : cond.equals;
      const actual = window.gameState?.globalVariables?.[cond.globalVariable];
      return expected === true ? !!actual : actual === expected;
    }
    return true;
  }

  /**
   * A task finished while its aim may still be locked. Aims with an unlockCondition
   * stay hidden until that condition is met (the completed task is already recorded,
   * so it shows as done when the aim is later unlocked). Aims with no unlockCondition
   * keep the old behaviour: they are revealed by the completion.
   */
  revealAimForCompletedTask(task) {
    const parentAim = this.aimIndex[task.aimId];
    if (!parentAim || parentAim.status !== 'locked') return;
    if (parentAim.unlockCondition && !this.isUnlockConditionMet(parentAim)) {
      console.log(`🔒 Task done early; aim stays hidden until unlocked: ${parentAim.title}`);
      return;
    }
    parentAim.status = 'active';
    console.log(`🔓 Aim auto-revealed by task completion: ${parentAim.title}`);
    this.showAimUnlockedNotification(parentAim);
  }

  /**
   * Process task.onComplete actions (unlock next task/aim)
   */
  processTaskCompletion(task) {
    if (!task.onComplete) return;

    if (task.onComplete.unlockTask) {
      this.unlockTask(task.onComplete.unlockTask);
    }

    if (task.onComplete.unlockAim) {
      this.unlockAim(task.onComplete.unlockAim);
    }

    if (task.onComplete.setGlobal && window.gameState?.globalVariables) {
      Object.entries(task.onComplete.setGlobal).forEach(([varName, value]) => {
        const oldValue = window.gameState.globalVariables[varName];
        window.gameState.globalVariables[varName] = value;
        if (window.npcConversationStateManager) {
          window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
        }
        if (window.eventDispatcher) {
          window.eventDispatcher.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
        }
      });
    }
  }
  
  /**
   * Unlock a task (make it active)
   * @param {string} taskId - The task ID to unlock
   */
  unlockTask(taskId) {
    const task = this.taskIndex[taskId];
    if (!task || task.status !== 'locked') return;
    
    task.status = 'active';
    console.log(`🔓 Task unlocked: ${task.title}`);
    this.persistUnlock('task', taskId);
    
    this.showTaskUnlockedNotification(task);
    this.notifyListeners();
  }
  
  /**
   * Unlock an aim (make it active)
   * @param {string} aimId - The aim ID to unlock
   */
  unlockAim(aimId) {
    const aim = this.aimIndex[aimId];
    if (!aim || aim.status !== 'locked') return;
    
    aim.status = 'active';
    this.persistUnlock('aim', aimId);
    
    // Also activate first task
    const firstTask = aim.tasks[0];
    if (firstTask && firstTask.status === 'locked') {
      firstTask.status = 'active';
      this.persistUnlock('task', firstTask.taskId);
    }
    
    console.log(`🔓 Aim unlocked: ${aim.title}`);
    this.showAimUnlockedNotification(aim);
    this.notifyListeners();

    // Tasks may have been completed while the aim was hidden
    if (aim.tasks.some(t => t.status === 'completed')) this.checkAimCompletion(aimId);
  }
  
  /**
   * Record an unlock on the server so it survives a reload. The server already
   * records onComplete unlocks and derives unlockCondition ones on load; this
   * covers #unlock_aim / #unlock_task ink tags and eventMapping unlocks, which
   * were client-only. Fire-and-forget: the unlock already applies this session.
   */
  persistUnlock(kind, objectiveId) {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return;
    fetch(`/break_escape/games/${gameId}/objectives/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ kind, objective_id: objectiveId })
    }).catch(error => console.warn(`📋 Could not record ${kind} unlock ${objectiveId}:`, error));
  }

  /**
   * Check if all tasks in an aim are complete
   */
  checkAimCompletion(aimId) {
    const aim = this.aimIndex[aimId];
    if (!aim) return;

    // Hidden aim with an unmet unlockCondition: defer completion until it is unlocked
    if (aim.status === 'locked' && aim.unlockCondition && !this.isUnlockConditionMet(aim)) return;
    
    const allComplete = aim.tasks.every(task => task.optional || task.status === 'completed');
    
    if (allComplete && aim.status !== 'completed') {
      aim.status = 'completed';
      aim.completedAt = new Date().toISOString();
      
      console.log(`🏆 Aim completed: ${aim.title}`);
      this.showAimCompleteNotification(aim);
      
      // Check if aim completion unlocks another aim
      this.aims.forEach(otherAim => {
        const cond = otherAim.unlockCondition;
        if (!cond) return;
        if (cond.aimCompleted === aimId) {
          this.unlockAim(otherAim.aimId);
        } else if (Array.isArray(cond.aimsCompleted) && cond.aimsCompleted.includes(aimId)) {
          // All listed aims must be completed before unlocking
          const allDone = cond.aimsCompleted.every(id => this.aimIndex[id]?.status === 'completed');
          if (allDone) this.unlockAim(otherAim.aimId);
        }
      });
      
      // Emit both generic and specific events for NPC eventMappings
      // Generic event for wildcard listeners (objective_aim_completed:*)
      this.eventDispatcher.emit('objective_aim_completed', {
        aimId,
        aim
      });
      
      // Specific event for NPC eventMappings (objective_aim_completed:secret_mission)
      this.eventDispatcher.emit(`objective_aim_completed:${aimId}`, {
        aimId,
        aim
      });
    }
  }
  
  /**
   * Get active aims for UI display
   * @returns {Array} Array of active/completed aims
   */
  getActiveAims() {
    return this.aims.filter(aim => aim.status === 'active' || aim.status === 'completed');
  }
  
  /**
   * Get all aims (for debug/admin)
   * @returns {Array} All aims
   */
  getAllAims() {
    return this.aims;
  }
  
  /**
   * Get a specific task by ID
   * @param {string} taskId - The task ID
   * @returns {Object|null} The task or null
   */
  getTask(taskId) {
    return this.taskIndex[taskId] || null;
  }
  
  /**
   * Get a specific aim by ID
   * @param {string} aimId - The aim ID
   * @returns {Object|null} The aim or null
   */
  getAim(aimId) {
    return this.aimIndex[aimId] || null;
  }
  
  // === Server Communication ===
  
  async serverCompleteTask(taskId) {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return { success: true }; // Offline mode
    
    const task = this.taskIndex[taskId];
    const body = {};
    
    // For submit_flags tasks, include submittedFlags in the completion request
    // so server can validate against latest data
    if (task && task.type === 'submit_flags' && task.submittedFlags) {
      body.submittedFlags = task.submittedFlags;
      console.log(`📋 Including submittedFlags in completion request:`, task.submittedFlags);
    }

    // For collect_items tasks, send currentCount so server can trust it
    // (avoids async race where inventory POSTs haven't landed yet)
    if (task && task.type === 'collect_items' && task.currentCount !== undefined) {
      body.currentCount = task.currentCount;
    }
    
    try {
      // RESTful route: POST /break_escape/games/:id/objectives/tasks/:task_id
      const response = await fetch(`/break_escape/games/${gameId}/objectives/tasks/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      });
      
      // A 5xx is the server failing to record a completion it did not refuse --
      // most often SQLite write contention when an ink line fires several tags
      // at once. That is transient and must be retried, not treated as a
      // refusal: game 1021 lost talk_to_gary to a 500 and could never conclude.
      if (response.status >= 500) {
        return { success: false, transient: true, error: `Server error ${response.status}` };
      }

      return response.json();
    } catch (error) {
      // fetch() rejects only on network failure, and a malformed body means we
      // cannot tell what the server did. Both are retryable.
      console.error('Server task completion error:', error);
      return { success: false, transient: true, error: error.message };
    }
  }
  
  syncTaskProgress(taskId, progress) {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return;
    
    // Debounce sync by 1 second
    if (this.syncTimeouts[taskId]) {
      clearTimeout(this.syncTimeouts[taskId]);
    }
    
    this.syncTimeouts[taskId] = setTimeout(() => {
      // RESTful route: PUT /break_escape/games/:id/objectives/tasks/:task_id
      fetch(`/break_escape/games/${gameId}/objectives/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({ progress })
      }).catch(err => console.warn('Failed to sync progress:', err));
    }, 1000);
  }
  
  /**
   * Sync flag task progress to server (including submittedFlags array)
   * Debounced version for regular progress updates
   */
  syncFlagTaskProgress(taskId, progress, submittedFlags) {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return;
    
    // Debounce sync by 1 second
    if (this.syncTimeouts[taskId]) {
      clearTimeout(this.syncTimeouts[taskId]);
    }
    
    this.syncTimeouts[taskId] = setTimeout(() => {
      // RESTful route: PUT /break_escape/games/:id/objectives/tasks/:task_id
      fetch(`/break_escape/games/${gameId}/objectives/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({ progress, submittedFlags })
      }).catch(err => console.warn('Failed to sync flag progress:', err));
    }, 1000);
  }
  
  /**
   * Sync flag task progress immediately (no debounce) - returns a promise
   * Used when completing a task to ensure server has latest data
   */
  async syncFlagTaskProgressImmediate(taskId, progress, submittedFlags) {
    const gameId = window.breakEscapeConfig?.gameId;
    if (!gameId) return Promise.resolve();
    
    // Clear any pending debounced sync for this task
    if (this.syncTimeouts[taskId]) {
      clearTimeout(this.syncTimeouts[taskId]);
      delete this.syncTimeouts[taskId];
    }
    
    // RESTful route: PUT /break_escape/games/:id/objectives/tasks/:task_id
    const response = await fetch(`/break_escape/games/${gameId}/objectives/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ progress, submittedFlags })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync flag progress: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // === UI Notifications ===

  /**
   * Handle mission conclusion: emit event and trigger end screen if configured on the aim.
   * Called when the server confirms missionConcluded:true in a complete_task response,
   * and also from main.js on reload when breakEscapeConfig.missionConcludedAt is set.
   * @param {Object} aim - The aim object with missionConclusion:true
   */
  handleMissionConcluded(aim) {
    if (!aim) return;

    console.log(`🏁 Mission concluded via aim: ${aim.aimId}`);

    // Emit event for any listeners (music system, analytics, etc.)
    this.eventDispatcher.emit('mission_concluded', { aimId: aim.aimId, aim });

    const screen = aim.conclusionScreen;
    if (!screen) return;

    if (screen.type === 'end_screen') {
      // Trigger the generic end-screen overlay
      if (window.showEndScreen) {
        window.showEndScreen(screen);
      } else {
        console.warn('[ObjectivesManager] window.showEndScreen is not defined');
      }
    } else if (screen.type === 'bond_visualiser') {
      // Open the fullscreen bond visualiser (used for mission credits / victory sequence)
      if (window.BondVisualiser) {
        window.BondVisualiser.open(screen.bondVisualiserOpts || {});
      } else {
        console.warn('[ObjectivesManager] window.BondVisualiser is not defined');
      }
    }
  }

  showTaskCompleteNotification(task) {
    if (window.playUISound) {
      window.playUISound('objective_complete');
    }
    if (window.gameAlert) {
      window.gameAlert(`✓ ${task.title}`, 'success', 'Task Complete');
    }
  }
  
  showTaskUnlockedNotification(task) {
    if (window.gameAlert) {
      window.gameAlert(`New Task: ${task.title}`, 'info', 'Objective Updated');
    }
  }
  
  showAimCompleteNotification(aim) {
    if (window.playUISound) {
      window.playUISound('objective_complete');
    }
    if (window.gameAlert) {
      window.gameAlert(`🏆 ${aim.title}`, 'success', 'Objective Complete!');
    }
  }
  
  showAimUnlockedNotification(aim) {
    if (window.gameAlert) {
      window.gameAlert(`New Objective: ${aim.title}`, 'info', 'Mission Updated');
    }
  }
  
  // === Listener Pattern for UI Updates ===
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.getActiveAims()));
  }
  
  // === Debug Utilities ===
  
  /**
   * Get debug info for all objectives
   */
  getDebugInfo() {
    return {
      aims: this.aims.map(aim => ({
        aimId: aim.aimId,
        title: aim.title,
        status: aim.status,
        tasks: aim.tasks.map(task => ({
          taskId: task.taskId,
          title: task.title,
          status: task.status,
          type: task.type,
          progress: task.currentCount || 0,
          target: task.targetCount || 1
        }))
      }))
    };
  }
  
  /**
   * Reset all objectives to initial state
   */
  reset() {
    this.aims.forEach(aim => {
      aim.status = aim.originalStatus || 'active';
      aim.completedAt = null;
      aim.tasks.forEach(task => {
        task.status = task.originalStatus || 'active';
        task.currentCount = 0;
        task.completedAt = null;
      });
    });
    this.notifyListeners();
    console.log('📋 Objectives reset to initial state');
  }
}

// Export singleton accessor
let instance = null;
export function getObjectivesManager(eventDispatcher) {
  if (!instance && eventDispatcher) {
    instance = new ObjectivesManager(eventDispatcher);
  }
  return instance;
}

// Export for global debug access
window.debugObjectives = {
  showAll: () => {
    if (instance) {
      console.table(instance.getDebugInfo().aims);
      instance.aims.forEach(aim => {
        console.log(`\n📋 ${aim.title}:`);
        console.table(aim.tasks.map(t => ({
          taskId: t.taskId,
          title: t.title,
          status: t.status,
          type: t.type
        })));
      });
    }
  },
  reset: () => instance?.reset(),
  getManager: () => instance
};

export default ObjectivesManager;
