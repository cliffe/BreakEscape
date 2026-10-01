// NPCManager with event → knot auto-mapping and conversation history
// OPTIMIZED: InkEngine caching, event listener cleanup, debug logging
// default export NPCManager
import { isInLineOfSight, drawLOSCone, clearLOSCone, getNPCFacingDirection } from './npc-los.js';

/**
 * Safe condition evaluator — replaces eval() for CSP compliance (unsafe-eval blocked).
 * Supports the condition patterns used in scenario eventMappings:
 *   "value === true"
 *   "value >= 4"
 *   "data.prop === 'string'"
 *   "data.prop && data.prop.includes('substring')"
 */
function safeEvaluateCondition(conditionStr, eventData) {
  const value = eventData?.value;
  const name  = eventData?.name;

  // Helper: parse a RHS literal token into a JS value
  function parseLiteral(token) {
    const t = token.trim();
    if (t === 'true')  return true;
    if (t === 'false') return false;
    if (t === 'null')  return null;
    if (t === 'undefined') return undefined;
    const n = Number(t);
    if (!isNaN(n) && t !== '') return n;
    const strMatch = t.match(/^['"](.*)['"]$/);
    if (strMatch) return strMatch[1];
    return t;
  }

  // Helper: resolve "value", "data.prop", or "globalVars.prop" from eventData
  function resolveLHS(token) {
    const t = token.trim();
    if (t === 'value') return value;
    if (t === 'name')  return name;
    const propMatch = t.match(/^data\.(\w+)$/);
    if (propMatch) return eventData?.[propMatch[1]];
    const globalMatch = t.match(/^globalVars\.(\w+)$/);
    if (globalMatch) return window.gameState?.globalVariables?.[globalMatch[1]];
    return undefined;
  }

  // Helper: apply a comparison operator
  function applyOp(lhs, op, rhs) {
    switch (op) {
      case '===': return lhs === rhs;
      case '!==': return lhs !== rhs;
      case '>=':  return lhs >= rhs;
      case '<=':  return lhs <= rhs;
      case '>':   return lhs > rhs;
      case '<':   return lhs < rhs;
      default:    return false;
    }
  }

  // Evaluate a single (non-&&) term. Supports:
  //   negation:   "!globalVars.X" / "!value"
  //   includes:   "data.prop.includes('sub')" / "globalVars.prop.includes('sub')"
  //   comparison: "value OP literal" / "data.prop OP literal" / "globalVars.prop OP literal"
  //   bare truthy:"value" / "data.prop" / "globalVars.prop"
  function evaluateSingle(expr) {
    expr = expr.trim();

    // Negation
    if (expr.startsWith('!')) {
      return !evaluateSingle(expr.slice(1).trim());
    }

    // "<lhs>.includes('substring')"
    const includesMatch = expr.match(/^(value|data\.\w+|globalVars\.\w+)\.includes\(['"]([^'"]*)['"]\)$/);
    if (includesMatch) {
      const lhs = resolveLHS(includesMatch[1]);
      return !!(lhs && typeof lhs === 'string' && lhs.includes(includesMatch[2]));
    }

    // "<lhs> OP literal"
    const compareMatch = expr.match(/^(value|name|data\.\w+|globalVars\.\w+)\s*(===|!==|>=|<=|>|<)\s*(.+)$/);
    if (compareMatch) {
      return applyOp(resolveLHS(compareMatch[1]), compareMatch[2], parseLiteral(compareMatch[3]));
    }

    // Bare truthy check on a recognised operand
    if (/^(value|name|data\.\w+|globalVars\.\w+)$/.test(expr)) {
      return !!resolveLHS(expr);
    }

    console.error(`❌ safeEvaluateCondition: unsupported condition term: "${expr}"`);
    return false;
  }

  // Compound conditions: every &&-separated term must pass. (Single terms fall through
  // to evaluateSingle unchanged, so existing "value === true" style conditions are
  // evaluated identically to before — this only makes previously-dead compound/negation
  // conditions work as their authors intended. Mirrors the timer/textVariant evaluators.)
  const s = conditionStr.trim();
  if (s.includes('&&')) {
    return s.split('&&').every(part => evaluateSingle(part));
  }
  return evaluateSingle(s);
}

export default class NPCManager {
  constructor(eventDispatcher, barkSystem = null) {
    this.eventDispatcher = eventDispatcher;
    this.barkSystem = barkSystem;
    this.npcs = new Map();
    this.eventListeners = new Map(); // Track registered listeners for cleanup
    this.triggeredEvents = new Map(); // Track which events have been triggered per NPC
    this.conversationHistory = new Map(); // Track conversation history per NPC: { npcId: [ {type, text, timestamp, choiceText} ] }
    this.timedMessages = []; // Scheduled messages: { npcId, text, triggerTime, delivered, phoneId, targetKnot }
    this.timedConversations = []; // Scheduled conversations: { npcId, targetKnot, triggerTime, delivered }
    this.gameStartTime = Date.now(); // Track when game started for timed messages
    this.timerInterval = null; // Timer for checking timed messages
    
    // OPTIMIZATION: Cache InkEngine instances and fetched stories
    this.inkEngineCache = new Map(); // { npcId: inkEngine }
    this.storyCache = new Map(); // { storyPath: storyJson }
    
    // LOS Visualization
    this.losVisualizations = new Map(); // { npcId: graphicsObject }
    this.losVisualizationEnabled = false; // Toggle LOS cone rendering
    this.losVisualizeAll = false; // true: debug mode, draw every NPC's cone; false: only NPCs with los.visualize
    
    // OPTIMIZATION: Debug mode (set via window.NPC_DEBUG = true)
    this.debug = false;
  }

  /**
   * OPTIMIZATION: Log helper with debug mode
   */
  _log(level, message, data = null) {
    if (!this.debug && level !== 'error' && level !== 'warn') return;
    
    const prefix = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    }[level] || '📍';
    
    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  // registerNPC(id, opts) or registerNPC({ id, ...opts })
  // opts: { 
  //   displayName, storyPath, avatar, currentKnot, 
  //   phoneId: 'player_phone' | 'office_phone' | null,  // Which phone this NPC uses
  //   npcType: 'phone' | 'sprite',  // Text-only phone NPC or in-world sprite
  //   eventMappings: { 'event_pattern': { knot, bark, once, cooldown } } 
  // }
  registerNPC(id, opts = {}) {
    // Accept either registerNPC(id, opts) or registerNPC({ id, ...opts })
    let realId = id;
    let realOpts = opts;
    if (typeof id === 'object' && id !== null) {
      realOpts = id;
      realId = id.id;
    }
    if (!realId) throw new Error('registerNPC requires an id');
    
    // Build entry with defaults, but only set phoneId for phone NPCs
    const entry = Object.assign({ 
      id: realId, 
      displayName: realId, 
      metadata: {},
      eventMappings: {},
      npcType: 'phone',  // Default to phone-based NPC
      itemsHeld: []  // Initialize empty inventory for NPC item giving
    }, realOpts);
    
    // Only set default phoneId for phone NPCs (not person NPCs)
    if (entry.npcType === 'phone' && !entry.phoneId) {
      entry.phoneId = 'player_phone';
    }
    
    // Normalize eventMapping (singular) to eventMappings (plural) for backward compatibility
    if (entry.eventMapping && !entry.eventMappings) {
      console.log(`🔧 Normalizing eventMapping → eventMappings for ${realId}`);
      entry.eventMappings = entry.eventMapping;
      delete entry.eventMapping; // Remove the incorrect property
    }
    
    // Carry runtime fields written by createNPCSprite over from an existing entry,
    // so re-registering (e.g. a later room load) doesn't orphan the live sprite.
    const existingEntry = this.npcs.get(realId);
    if (existingEntry) {
      if (entry._sprite === undefined && existingEntry._sprite !== undefined) {
        entry._sprite = existingEntry._sprite;
      }
      if (!entry.roomId && existingEntry.roomId) {
        entry.roomId = existingEntry.roomId;
      }
    }
    
    this.npcs.set(realId, entry);
    
    // Register in global character registry for speaker resolution
    if (window.characterRegistry) {
      window.characterRegistry.registerNPC(realId, entry);
    }
    
    // Initialize conversation history for this NPC
    if (!this.conversationHistory.has(realId)) {
      this.conversationHistory.set(realId, []);
    }
    
    // Set up event listeners for auto-mapping
    if (entry.eventMappings && this.eventDispatcher) {
      this._setupEventMappings(realId, entry.eventMappings);
    } else if (entry.eventMappings && !this.eventDispatcher) {
      console.error(`❌ ${realId} has eventMappings but eventDispatcher is not available!`);
    }
    
    // Schedule timed messages if any are defined
    if (entry.timedMessages && Array.isArray(entry.timedMessages)) {
      entry.timedMessages.forEach(msg => {
        this.scheduleTimedMessage({
          npcId: realId,
          text: msg.message,
          delay: msg.delay,
          phoneId: entry.phoneId,
          waitForEvent: msg.waitForEvent || null,
          skipIfGlobal: msg.skipIfGlobal || null
        });
      });
      console.log(`[NPCManager] Scheduled ${entry.timedMessages.length} timed messages for ${realId}`);
    }
    
    // Schedule timed conversations if any are defined
    if (entry.timedConversation) {
      this.scheduleTimedConversation({
        npcId: realId,
        targetKnot: entry.timedConversation.targetKnot,
        delay: entry.timedConversation.delay,
        background: entry.timedConversation.background, // Optional background image
        waitForEvent: entry.timedConversation.waitForEvent || null,
        skipIfGlobal: entry.timedConversation.skipIfGlobal || null,
        setGlobalOnStart: entry.timedConversation.setGlobalOnStart || null
      });
      console.log(`[NPCManager] Scheduled timed conversation for ${realId} to knot: ${entry.timedConversation.targetKnot}`);
    }
    
    return entry;
  }

  getNPC(id) {
    return this.npcs.get(id) || null;
  }

  /**
   * Check if any NPC in a room should trigger person-chat instead of lockpicking
   * Considers NPC line-of-sight and facing direction
   * Returns the NPC if one should handle lockpick_used_in_view with person-chat
   * Otherwise returns null
   */
  shouldInterruptLockpickingWithPersonChat(roomId, playerPosition = null) {
    if (!roomId) return null;
    
    console.log(`👁️ [LOS CHECK] shouldInterruptLockpickingWithPersonChat: roomId="${roomId}", playerPos=${playerPosition ? `(${playerPosition.x.toFixed(0)}, ${playerPosition.y.toFixed(0)})` : 'null'}`);
    
    for (const npc of this.npcs.values()) {
      // NPC must be in the specified room and be a 'person' type NPC
      if (npc.roomId !== roomId || npc.npcType !== 'person') continue;
      
      // Hidden or KO'd NPCs see nothing
      if (window.npcHostileSystem?.isNPCKO?.(npc.id)) continue;
      const losSprite = npc._sprite || npc.sprite;
      if (losSprite && (losSprite.visible === false || losSprite.active === false)) continue;
      if (npc.isVisible === false) continue;
      
      console.log(`👁️ [LOS CHECK] Checking NPC: "${npc.id}" (room: ${npc.roomId}, type: ${npc.npcType})`);
      
      // Check if NPC has lockpick_used_in_view event mapping with person-chat
      if (npc.eventMappings && Array.isArray(npc.eventMappings)) {
        const lockpickMapping = npc.eventMappings.find(mapping => 
          mapping.eventPattern === 'lockpick_used_in_view' && 
          mapping.conversationMode === 'person-chat'
        );
        
        if (!lockpickMapping) {
          console.log(`👁️ [LOS CHECK]   ✗ NPC has no lockpick_used_in_view mapping`);
          continue;
        }
        
        console.log(`👁️ [LOS CHECK]   ✓ NPC has lockpick_used_in_view→person-chat mapping`);
        
        // Check LOS configuration
        const losConfig = npc.los || {
          enabled: true,
          range: 300,    // Default detection range
          angle: 120     // Default 120° field of view
        };
        
        // If player position provided, check if player is in LOS
        if (playerPosition) {
          // Get detailed information for debugging
          // Try to get sprite from npc._sprite (how it's stored), then npc.sprite, then npc position
          const sprite = npc._sprite || npc.sprite;
          const npcPos = (sprite && typeof sprite.getCenter === 'function') ? 
            sprite.getCenter() : 
            { x: npc.x ?? 0, y: npc.y ?? 0 };
          
          console.log(`👁️ [LOS CHECK]   npcPos: ${npcPos ? `(${npcPos.x}, ${npcPos.y})` : 'NULL'}, losConfig: range=${losConfig.range}, angle=${losConfig.angle}`);
          
          // Ensure npcPos is valid before using
          if (npcPos && npcPos.x !== undefined && npcPos.y !== undefined && 
              !Number.isNaN(npcPos.x) && !Number.isNaN(npcPos.y)) {
            const distance = Math.sqrt(
              Math.pow(playerPosition.x - npcPos.x, 2) + 
              Math.pow(playerPosition.y - npcPos.y, 2)
            );
            
            // Calculate angle to player
            const angleRad = Math.atan2(playerPosition.y - npcPos.y, playerPosition.x - npcPos.x);
            const angleToPlayer = (angleRad * 180 / Math.PI + 360) % 360;
            
            // Get NPC facing direction for debugging
            const npcFacing = getNPCFacingDirection(npc);
            
            const inLOS = isInLineOfSight(npc, playerPosition, losConfig);
            console.log(`👁️ [LOS CHECK]   NPC Facing: ${npcFacing.toFixed(1)}°, Distance: ${distance.toFixed(1)}px (range: ${losConfig.range}), Angle: ${angleToPlayer.toFixed(1)}° (FOV: ${losConfig.angle}°), LOS: ${inLOS}`);
            
            if (!inLOS) {
              console.log(
                `👁️ NPC "${npc.id}" CANNOT see player\n` +
                `   Position: NPC(${npcPos.x.toFixed(0)}, ${npcPos.y.toFixed(0)}) → Player(${playerPosition.x.toFixed(0)}, ${playerPosition.y.toFixed(0)})\n` +
                `   Distance: ${distance.toFixed(1)}px (range: ${losConfig.range}px) ${distance > losConfig.range ? '❌ TOO FAR' : '✅ in range'}\n` +
                `   Angle to Player: ${angleToPlayer.toFixed(1)}° (FOV: ${losConfig.angle}°)`
              );
              continue;
            }
          } else {
            console.log(`👁️ [LOS CHECK]   Position invalid, checking LOS anyway...`);
            if (!isInLineOfSight(npc, playerPosition, losConfig)) {
              // Position unavailable but still check LOS detection
              continue;
            }
          }
        }
        
        console.log(`�🚫 INTERRUPTING LOCKPICKING: NPC "${npc.id}" in room "${roomId}" can see player and has person-chat mapped to lockpick event`);
        return npc;
      }
    }
    
    return null;
  }

  // Set bark system (can be set after construction)
  setBarkSystem(barkSystem) {
    this.barkSystem = barkSystem;
  }

  // Add a message to conversation history (internal method)
  addMessageToHistory(npcId, type, text) {
    if (!this.conversationHistory.has(npcId)) {
      this.conversationHistory.set(npcId, []);
    }
    this.conversationHistory.get(npcId).push({
      type,
      text,
      timestamp: Date.now(),
      choiceText: null
    });
    this._log('debug', `Added ${type} message to ${npcId} history:`, text);
  }

  // Public API: Add a message with full metadata (used by external systems)
  addMessage(npcId, type, text, metadata = {}) {
    if (!this.conversationHistory.has(npcId)) {
      this.conversationHistory.set(npcId, []);
    }
    this.conversationHistory.get(npcId).push({
      type,
      text,
      timestamp: Date.now(),
      read: type === 'player', // Player messages are automatically marked as read
      ...metadata
    });
    this._log('debug', `Added ${type} message to ${npcId}:`, text);
  }

  // Get conversation history for an NPC
  getConversationHistory(npcId) {
    return this.conversationHistory.get(npcId) || [];
  }

  // Clear conversation history for an NPC
  clearConversationHistory(npcId) {
    this.conversationHistory.set(npcId, []);
  }

  // Get all NPCs for a specific phone (only returns phone-type NPCs)
  getNPCsByPhone(phoneId) {
    return Array.from(this.npcs.values()).filter(npc => 
      npc.npcType === 'phone' && npc.phoneId === phoneId
    );
  }

  // Get total unread message count for a phone
  getTotalUnreadCount(phoneId, allowedNpcIds = null) {
    let npcs = this.getNPCsByPhone(phoneId);
    
    // Filter to only allowed NPCs if specified
    if (allowedNpcIds && allowedNpcIds.length > 0) {
      npcs = npcs.filter(npc => allowedNpcIds.includes(npc.id));
    }
    
    let totalUnread = 0;
    
    for (const npc of npcs) {
      const history = this.getConversationHistory(npc.id);
      const unreadCount = history.filter(msg => !msg.read && msg.type === 'npc').length;
      totalUnread += unreadCount;
    }
    
    return totalUnread;
  }

  // Set up event listeners for an NPC's event mappings
  _setupEventMappings(npcId, eventMappings) {
    if (!this.eventDispatcher) return;
    
    console.log(`📋 Setting up event mappings for ${npcId}:`, eventMappings);
    
    // Handle both array format (from JSON) and object format
    const mappingsArray = Array.isArray(eventMappings) 
      ? eventMappings 
      : Object.entries(eventMappings).map(([pattern, config]) => ({
          eventPattern: pattern,
          ...(typeof config === 'string' ? { targetKnot: config } : config)
        }));
    
    for (const [mappingIndex, mapping] of mappingsArray.entries()) {
      const eventPattern = mapping.eventPattern;
      const config = {
        handlerIndex: mappingIndex, // per-handler dedup discriminator (see _handleEventMapping)
        knot: mapping.targetKnot || mapping.knot,
        bark: mapping.bark,
        once: mapping.onceOnly || mapping.once,
        cooldown: mapping.cooldown,
        condition: mapping.condition,
        maxTriggers: mapping.maxTriggers,  // Add max trigger limit
        conversationMode: mapping.conversationMode,  // Add conversation mode (e.g., 'person-chat')
        changeStoryPath: mapping.changeStoryPath,  // Change the NPC's story file
        sendTimedMessage: mapping.sendTimedMessage,  // Send a timed message when event triggers
        setGlobal: mapping.setGlobal,        // { varName: value } — set global variables directly
        completeTask: mapping.completeTask,  // taskId or [taskId] — complete tasks directly
        unlockTask: mapping.unlockTask,      // taskId or [taskId] — unlock tasks directly
        unlockAim: mapping.unlockAim,        // aimId or [aimId] — unlock aims directly
        emitEvent:     mapping.emitEvent     || null,   // event name to emit when mapping fires
        emitEventData: mapping.emitEventData || {},     // optional payload for that event
        disableClose:  mapping.disableClose  || false,  // hide × and block Esc for this conversation
        background:    mapping.background    || null,    // optional background image path
        // NEW ACTION FIELDS [Phase 2-4]
        setVisible:         mapping.setVisible          ?? undefined,
        patrolOverride:     mapping.patrolOverride      || null,
        setPatrolSpeed:     mapping.setPatrolSpeed      ?? undefined,
        setDwellMultiplier: mapping.setDwellMultiplier  ?? undefined,
        navigateToPlayer:   mapping.navigateToPlayer    || false
      };
      
      console.log(`  📌 Registering listener for event: ${eventPattern} → ${config.knot}`);
      
      const listener = (eventData) => {
        this._handleEventMapping(npcId, eventPattern, config, eventData);
      };
      
      // Register listener with event dispatcher
      this.eventDispatcher.on(eventPattern, listener);
      
      // Track listener for cleanup
      if (!this.eventListeners.has(npcId)) {
        this.eventListeners.set(npcId, []);
      }
      this.eventListeners.get(npcId).push({ pattern: eventPattern, listener });
    }
    
    console.log(`✅ Registered ${mappingsArray.length} event mappings for ${npcId}`);
  }

  // Handle when a mapped event fires
  _handleEventMapping(npcId, eventPattern, config, eventData) {
    console.log(`🎯 Event triggered: ${eventPattern} for NPC: ${npcId}`, eventData);
    
    const npc = this.getNPC(npcId);
    if (!npc) {
      console.warn(`⚠️ NPC ${npcId} not found`);
      return;
    }
    
    // Check if event should be handled.
    // Dedup key is per-handler (npc + event pattern + this handler's index in the
    // NPC's eventMappings array) so that onceOnly means "this handler fires once",
    // not "the first handler on this (npc, pattern) pair wins and all siblings die".
    const eventKey = `${npcId}:${eventPattern}:${config.handlerIndex}`;
    const triggered = this.triggeredEvents.get(eventKey) || { count: 0, lastTime: 0 };
    
    // Check if this is a once-only event that's already triggered
    if (config.once && triggered.count > 0) {
      console.log(`⏭️ Skipping once-only event ${eventPattern} (already triggered)`);
      return;
    }
    
    // Check if max triggers reached
    if (config.maxTriggers && triggered.count >= config.maxTriggers) {
      console.log(`🚫 Event ${eventPattern} has reached max triggers (${config.maxTriggers})`);
      return;
    }
    
    // Check cooldown (in milliseconds, default 5000ms = 5s)
    // IMPORTANT: Use ?? instead of || to properly handle cooldown: 0
    const cooldown = config.cooldown !== undefined && config.cooldown !== null ? config.cooldown : 5000;
    const now = Date.now();
    if (triggered.lastTime && (now - triggered.lastTime < cooldown)) {
      const remainingMs = cooldown - (now - triggered.lastTime);
      console.log(`⏸️ Event ${eventPattern} on cooldown (${remainingMs}ms remaining)`);
      return;
    }
    
    // Check condition if provided (can be string or function)
    if (config.condition) {
      let conditionMet = false;
      
      console.log(`🔍 Evaluating condition for ${eventPattern}:`, config.condition);
      console.log(`   Event data:`, eventData);
      
      if (typeof config.condition === 'function') {
        conditionMet = config.condition(eventData, npc);
      } else if (typeof config.condition === 'string') {
        // Safely evaluate condition string without eval() (CSP: unsafe-eval is blocked)
        try {
          conditionMet = safeEvaluateCondition(config.condition, eventData);
          console.log(`   Condition result: ${conditionMet}`);
        } catch (error) {
          console.error(`❌ Error evaluating condition: ${config.condition}`, error);
          return;
        }
      }
      
      if (!conditionMet) {
        console.log(`🚫 Event ${eventPattern} condition not met:`, config.condition, `| data:`, eventData);
        return;
      }
    }
    
    console.log(`✅ Event ${eventPattern} conditions passed, triggering NPC reaction`);
    
    // Update triggered tracking
    triggered.count++;
    triggered.lastTime = now;
    // Handlers limited by onceOnly / maxTriggers are saved to the server
    // (exportTriggeredEvents, sent by state-sync.js) so a reload doesn't replay them.
    // A handler that opens a conversation is saved only once that conversation
    // closes (see _persistTriggerOnClose): a reload mid-scene must let it fire
    // again, or a mission whose progress is in that scene is stranded. In-session
    // dedup is unaffected either way (count is already incremented).
    const opensConversation =
      (config.conversationMode === 'person-chat' && npc.npcType === 'person') ||
      config.conversationMode === 'video-call' ||
      (config.conversationMode === 'phone-chat' && npc.npcType === 'phone');
    if ((config.once || config.maxTriggers) && !opensConversation) triggered.persist = true;
    this.triggeredEvents.set(eventKey, triggered);
    const persistOnClose = (config.once || config.maxTriggers) && opensConversation
      ? () => this._persistTriggerOnClose(npcId, eventKey)
      : () => {};
    
    // Set global variables if specified
    if (config.setGlobal && window.gameState?.globalVariables) {
      Object.entries(config.setGlobal).forEach(([varName, value]) => {
        const oldValue = window.gameState.globalVariables[varName];
        window.gameState.globalVariables[varName] = value;
        console.log(`🌐 Event setGlobal: ${varName} = ${value}`);
        if (window.npcConversationStateManager) {
          window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
        }
        if (window.eventDispatcher) {
          window.eventDispatcher.emit(`global_variable_changed:${varName}`, { name: varName, value, oldValue });
        }
      });
    }

    // Complete tasks directly (bypasses broken ink knot jumping)
    // Sequenced (not Promise.all/forEach) so each task's server round-trip
    // finishes before the next starts — two parallel completeTask requests
    // for the same game can otherwise race past each other server-side.
    if (config.completeTask) {
      const tasks = Array.isArray(config.completeTask) ? config.completeTask : [config.completeTask];
      (async () => {
        for (const taskId of tasks) {
          if (window.objectivesManager) {
            await window.objectivesManager.completeTask(taskId);
            console.log(`✅ Event completeTask: ${taskId}`);
          }
        }
      })();
    }

    // Unlock tasks directly
    if (config.unlockTask) {
      const tasks = Array.isArray(config.unlockTask) ? config.unlockTask : [config.unlockTask];
      tasks.forEach(taskId => {
        if (window.objectivesManager) {
          window.objectivesManager.unlockTask(taskId);
          console.log(`🔓 Event unlockTask: ${taskId}`);
        }
      });
    }

    // Unlock aims directly
    if (config.unlockAim) {
      const aims = Array.isArray(config.unlockAim) ? config.unlockAim : [config.unlockAim];
      aims.forEach(aimId => {
        if (window.objectivesManager) {
          window.objectivesManager.unlockAim(aimId);
          console.log(`🔓 Event unlockAim: ${aimId}`);
        }
      });
    }

    // Emit a custom event if specified (enables event chaining from NPC mappings)
    if (config.emitEvent) {
      const payload = config.emitEventData || {};
      window.eventDispatcher?.emit(config.emitEvent, payload);
      console.log(`📡 Event emitEvent: ${config.emitEvent}`, payload);
    }

    // [Phase 2] Handle NPC movement override (emergency responses: nurses abandon patrol)
    if (config.patrolOverride && window.npcBehaviorManager) {
      const override = config.patrolOverride;
      const targetTile = override.targetTile;
      const speed = override.speed || 80;  // default patrol speed if not specified
      
      if (targetTile && typeof targetTile.x === 'number' && typeof targetTile.y === 'number') {
        // Convert tile coordinates to world coordinates
        const room = window.rooms ? window.rooms[npc.roomId] : null;
        if (room && room.position) {
          const TILE_SIZE = 32;  // Match constants.js
          const worldX = room.position.x + (targetTile.x * TILE_SIZE);
          const worldY = room.position.y + (targetTile.y * TILE_SIZE);
          window.npcBehaviorManager.goToAndStay(npcId, worldX, worldY, speed);
          console.log(`🚶 patrolOverride: ${npcId} → tile(${targetTile.x},${targetTile.y}) = world(${worldX},${worldY}) @ ${speed}px/s`);
        } else {
          console.warn(`⚠️ patrolOverride: Could not resolve room ${npc.roomId} for ${npcId}`);
        }
      } else {
        console.warn(`⚠️ patrolOverride: Invalid targetTile for ${npcId}`, targetTile);
      }
    }

    // [Phase 3] Handle NPC visibility toggle (delayed NPC appearance)
    if (config.setVisible !== undefined && window.npcBehaviorManager) {
      const visible = config.setVisible === true || config.setVisible === 'true';
      window.npcBehaviorManager.setNPCVisible(npcId, visible);
      console.log(`👁️ setVisible: ${npcId} → ${visible ? 'VISIBLE' : 'HIDDEN'}`);
    }

    // [Phase 4] Handle patrol speed override (accelerate/decelerate during incidents)
    if (config.setPatrolSpeed !== undefined && window.npcBehaviorManager) {
      const speed = config.setPatrolSpeed;
      if (typeof speed === 'number' && speed > 0) {
        window.npcBehaviorManager.setBehaviorState(npcId, 'patrolSpeed', speed);
        console.log(`⚡ setPatrolSpeed: ${npcId} → ${speed}px/s`);
      } else {
        console.warn(`⚠️ setPatrolSpeed: Invalid speed value for ${npcId}`, speed);
      }
    }

    // [Phase 4] Handle waypoint dwell time override (reduce pause time at stations)
    if (config.setDwellMultiplier !== undefined && window.npcBehaviorManager) {
      const multiplier = config.setDwellMultiplier;
      if (typeof multiplier === 'number' && multiplier > 0) {
        window.npcBehaviorManager.setBehaviorState(npcId, 'dwellMultiplier', multiplier);
        console.log(`⏱️ setDwellMultiplier: ${npcId} → ${multiplier}x original dwell time`);
      } else {
        console.warn(`⚠️ setDwellMultiplier: Invalid multiplier for ${npcId}`, multiplier);
      }
    }

    // Update NPC's current knot if specified (use targetKnot or knot for backwards compatibility)
    const knotToSet = config.targetKnot || config.knot;
    if (knotToSet) {
      npc.currentKnot = knotToSet;
      console.log(`📍 Updated ${npcId} current knot to: ${knotToSet}`);
    }
    
    // Change NPC's story path if specified (switches conversation to different Ink file)
    if (config.changeStoryPath) {
      console.log(`📖 BEFORE changeStoryPath - npc.storyPath: ${npc.storyPath}, npc.storyJSON exists: ${!!npc.storyJSON}`);
      npc.storyPath = config.changeStoryPath;
      // Clear cached story state so new story loads fresh
      delete npc.storyState;
      delete npc.storyJSON;
      // Clear cached InkEngine so it reloads with new story
      if (this.inkEngineCache.has(npcId)) {
        this.inkEngineCache.delete(npcId);
      }
      // Clear ALL conversation history (new timed message will be added fresh)
      this.conversationHistory.set(npcId, []);
      console.log(`📖 AFTER changeStoryPath - npc.storyPath: ${npc.storyPath}, npc.storyJSON exists: ${!!npc.storyJSON}`);
      console.log(`📖 Changed ${npcId} story path to: ${config.changeStoryPath} (cleared all caches and history)`);
    }
    
    // Send timed message if specified
    if (config.sendTimedMessage) {
      const msgConfig = config.sendTimedMessage;
      this.scheduleTimedMessage({
        npcId: npcId,
        text: msgConfig.message,
        delay: msgConfig.delay || 0,
        phoneId: npc.phoneId,
        targetKnot: msgConfig.targetKnot || null
      });
      console.log(`📨 Scheduled timed message for ${npcId}: "${msgConfig.message}" (delay: ${msgConfig.delay}ms, targetKnot: ${msgConfig.targetKnot || 'default'})`);
    }
    
    // Debug: Log the full config to see what we're working with
    console.log(`🔍 Event config for ${eventPattern}:`, {
      conversationMode: config.conversationMode,
      npcType: npc.npcType,
      knot: config.knot,
      fullConfig: config
    });
    
    // A knocked-out NPC can't hold a conversation or play a cutscene. The rest of
    // the handler (setGlobal, completeTask, timed messages, ...) has already run
    // above, so missions that rely on KO handlers keep working. The NPC's own KO
    // event is exempt: m01 Derek and m05 Torres open their KO scene from it.
    if ((config.conversationMode === 'person-chat' || config.conversationMode === 'video-call') &&
        npc.npcType === 'person') {
      const ownKOEvent = eventPattern.startsWith('npc_ko') &&
        (eventPattern === `npc_ko:${npcId}` || eventData?.npcId === npcId);
      if (!ownKOEvent && window.npcHostileSystem?.isNPCKO?.(npcId)) {
        console.log(`💤 ${npcId} is knocked out - skipping ${config.conversationMode} for ${eventPattern}`);
        return;
      }
    }

    // Check if this event should trigger a full person-chat conversation
    // instead of just a bark (indicated by conversationMode: 'person-chat')
    if (config.conversationMode === 'person-chat' && npc.npcType === 'person') {
      console.log(`👤 Handling person-chat for event on NPC ${npcId}`);
      
      // CHECK: Is a conversation already active with this NPC?
      const currentConvNPCId = window.currentConversationNPCId;
      const activeMinigame = window.MinigameFramework?.currentMinigame;
      const isPersonChatActive = activeMinigame?.constructor?.name === 'PersonChatMinigame';
      const isConversationActive = currentConvNPCId === npcId;
      
      console.log(`🔍 Event jump check:`, {
        targetNpcId: npcId,
        currentConvNPCId: currentConvNPCId,
        isConversationActive: isConversationActive,
        activeMinigame: activeMinigame?.constructor?.name || 'none',
        isPersonChatActive: isPersonChatActive,
        hasJumpToKnot: typeof activeMinigame?.jumpToKnot === 'function'
      });
      
      if (isConversationActive && isPersonChatActive) {
        // JUMP TO KNOT in the active conversation instead of starting a new one
        console.log(`⚡ Active conversation detected with ${npcId}, attempting jump to knot: ${config.knot}`);
        
        if (typeof activeMinigame.jumpToKnot === 'function') {
          try {
            const jumpSuccess = activeMinigame.jumpToKnot(config.knot);
            if (jumpSuccess) {
              persistOnClose();
              console.log(`✅ Successfully jumped to knot ${config.knot} in active conversation`);
              return;  // Success - exit early
            } else {
              console.warn(`⚠️ Failed to jump to knot, falling back to new conversation`);
            }
          } catch (error) {
            console.error(`❌ Error during jumpToKnot: ${error.message}`);
          }
        } else {
          console.warn(`⚠️ jumpToKnot method not available on minigame`);
        }
      } else {
        console.log(`ℹ️ Not jumping: isConversationActive=${isConversationActive}, isPersonChatActive=${isPersonChatActive}`);
      }
      
      // Not in an active conversation OR jump failed - start a new person-chat minigame
      console.log(`👤 Starting new person-chat conversation for NPC ${npcId}`);
      
      // Close any currently running minigame (like lockpicking) first
      if (window.MinigameFramework && window.MinigameFramework.currentMinigame) {
        console.log(`🛑 Closing currently running minigame before starting person-chat`);
        window.MinigameFramework.endMinigame(false, null);
        console.log(`✅ Closed current minigame`);
      }
      
      // Start the person-chat minigame after a brief delay for cleanup.
      if (window.MinigameFramework) {
        // Capture NPC's home position now so it can be restored after the conversation.
        // Only needed when navigateToPlayer is set (NPC-initiated event cutscenes).
        let capturedHome = null;
        if (config.navigateToPlayer && window.npcBehaviorManager) {
          const behavior = window.npcBehaviorManager.getBehavior(npcId);
          capturedHome = behavior?.homePosition ? { ...behavior.homePosition } : null;
        }

        console.log(`⏳ Waiting 500ms before starting person-chat cutscene for ${npcId}`);
        setTimeout(() => {
          console.log(`✅ Starting person-chat minigame for ${npcId}`);
          const knotToUse = config.targetKnot || config.knot || npc.currentKnot;

          // Store home on NPC object so the #return_home Ink tag can access it.
          if (capturedHome) {
            npc._capturedHome = capturedHome;
          }

          window.MinigameFramework.startMinigame('person-chat', null, {
            npcId: npc.id,
            startKnot: knotToUse,
            background: config.background || null,
            scenario: window.gameScenario,
            disableClose: config.disableClose || false
          });
          persistOnClose();
          console.log(`[NPCManager] Event '${eventPattern}' triggered for NPC '${npcId}' → person-chat conversation`);

          // When the conversation closes, if the NPC is far from the player (they couldn't
          // have plausibly walked over in time), teleport them adjacent to the player first,
          // then walk them home — giving the visual impression of them leaving after the chat.
          // Skip this if #return_home already fired mid-conversation (npc._capturedHome cleared).
          if (config.navigateToPlayer && capturedHome && window.npcBehaviorManager) {
            const onConvClosed = () => {
              window.eventDispatcher?.off(`conversation_closed:${npcId}`, onConvClosed);
              delete npc._capturedHome;

              const behavior = window.npcBehaviorManager.getBehavior(npcId);
              if (!behavior?.sprite) return;

              const player = window.player;
              const playerX = player?.body?.center?.x ?? player?.x;
              const playerY = player?.body?.center?.y ?? player?.y;
              if (playerX === undefined) return;

              const npcX = behavior.sprite.x;
              const npcY = behavior.sprite.y;
              const dist = Math.sqrt((npcX - playerX) ** 2 + (npcY - playerY) ** 2);

              // If NPC is more than ~6 tiles away, teleport adjacent to player first
              // so it looks like they came over to talk before walking home.
              if (dist > 192) {
                console.log(`🪄 ${npcId} too far (${Math.round(dist)}px) — teleporting near player before walk-home`);
                behavior.sprite.setPosition(playerX + 48, playerY);
                if (behavior.sprite.body) behavior.sprite.body.reset(playerX + 48, playerY);
              }

              // Walk home.
              setTimeout(() => {
                window.npcBehaviorManager.goToAndStay(npcId, capturedHome.x, capturedHome.y, 80);
              }, 300);
            };
            window.eventDispatcher?.on(`conversation_closed:${npcId}`, onConvClosed);
          }
        }, 500);

        return;  // Exit early - person-chat will start after delay
      } else {
        console.warn(`⚠️ MinigameFramework not available for person-chat`);
      }
    }
    // Check if this event should auto-open a person-chat VIDEO CALL.
    // Works for any npcType (a "phone" NPC like Ghost can appear on a video call), because the
    // person-chat portrait renders off spriteTalk/spriteSheet rather than the NPC's world sprite.
    if (config.conversationMode === 'video-call') {
      if (window.MinigameFramework) {
        const knotToUse = config.targetKnot || config.knot || npc.currentKnot;

        // Close any currently running minigame first
        if (window.MinigameFramework.currentMinigame) {
          window.MinigameFramework.endMinigame(false, null);
        }

        setTimeout(() => {
          window.MinigameFramework.startMinigame('person-chat', null, {
            npcId: npc.id,
            startKnot: knotToUse,
            background: config.background || null,
            scenario: window.gameScenario,
            disableClose: config.disableClose || false,
            videoCall: true
          });
          persistOnClose();
          console.log(`[NPCManager] Event '${eventPattern}' triggered for NPC '${npcId}' → person-chat VIDEO CALL`);
        }, 500);

        return;
      } else {
        console.warn(`⚠️ MinigameFramework not available for video-call`);
      }
    }
    // Check if this event should auto-open a phone-chat conversation
    if (config.conversationMode === 'phone-chat' && npc.npcType === 'phone') {
      if (window.MinigameFramework) {
        const knotToUse = config.targetKnot || config.knot || npc.currentKnot;

        // Close any currently running minigame first
        if (window.MinigameFramework.currentMinigame) {
          window.MinigameFramework.endMinigame(false, null);
        }

        setTimeout(() => {
          window.MinigameFramework.startMinigame('phone-chat', null, {
            npcId: npc.id,
            phoneId: npc.phoneId || 'player_phone',
            startKnot: knotToUse,
            title: npc.displayName || 'Phone',
            theme: npc.phoneTheme,
            disableClose: config.disableClose || false
          });
          persistOnClose();
          console.log(`[NPCManager] Event '${eventPattern}' triggered for NPC '${npcId}' → phone-chat conversation`);
        }, 500);

        return;
      } else {
        console.warn(`⚠️ MinigameFramework not available for phone-chat`);
      }
    }

    // If bark text is provided, show it directly
    if (this.barkSystem && (config.bark || config.message)) {
      const barkText = config.bark || config.message;
      const barkDelay = config.barkDelay || 0;

      const fireBark = () => {
        // Add bark message to conversation history (marked as bark)
        this.addMessage(npcId, 'npc', barkText, {
          eventPattern,
          knot: config.knot,
          isBark: true  // Flag this as a bark, not full conversation
        });

        console.log(`💬 Showing bark with direct message: ${barkText}`);

        this.barkSystem.showBark({
          npcId: npc.id,
          npcName: npc.displayName,
          message: barkText,
          avatar: npc.avatar,
          inkStoryPath: npc.storyPath,
          startKnot: config.knot || npc.currentKnot,
          phoneId: npc.phoneId,
          useTTS: npc.npcType === 'person' && !!npc.voice
        });
      };

      if (barkDelay > 0) {
        setTimeout(fireBark, barkDelay);
      } else {
        fireBark();
      }
    }
    // Otherwise, if we have a knot, load the Ink story and get the text
    else if (this.barkSystem && config.knot && npc.storyPath) {
      console.log(`📖 Loading Ink story from knot: ${config.knot}`);

      // Load the Ink story and navigate to the knot
      this._showBarkFromKnot(npcId, npc, config.knot, eventPattern);
    }
    
    console.log(`[NPCManager] Event '${eventPattern}' triggered for NPC '${npcId}' → knot '${config.knot}'`);
  }
  
  // Load Ink story, navigate to knot, and show the text as a bark
  async _showBarkFromKnot(npcId, npc, knotName, eventPattern) {
    try {
      // OPTIMIZATION: Fetch story from cache or network
      let storyJson = this.storyCache.get(npc.storyPath);
      if (!storyJson) {
        // Use Rails API endpoint instead of direct file fetch
        const gameId = window.breakEscapeConfig?.gameId;
        const endpoint = gameId 
          ? `/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(npcId)}`
          : npc.storyPath;  // Fallback to storyPath if no gameId
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to load story: ${response.statusText}`);
        }
        storyJson = await response.json();
        // Cache for future use
        this.storyCache.set(npc.storyPath, storyJson);
      }
      
      // OPTIMIZATION: Reuse cached InkEngine or create new one
      let inkEngine = this.inkEngineCache.get(npcId);
      if (!inkEngine) {
        const { default: InkEngine } = await import('./ink/ink-engine.js');
        inkEngine = new InkEngine(npcId);
        inkEngine.loadStory(storyJson);
        this.inkEngineCache.set(npcId, inkEngine);
      }
      
      // Navigate to the knot
      inkEngine.goToKnot(knotName);
      
      // Get the text from the knot
      const result = inkEngine.continue();
      
      if (result.text) {
        
        // Add to conversation history (marked as bark)
        this.addMessage(npcId, 'npc', result.text, { 
          eventPattern,
          knot: knotName,
          isBark: true  // Flag this as a bark, not full conversation
        });
        
        // Show the bark
        this.barkSystem.showBark({
          npcId: npc.id,
          npcName: npc.displayName,
          message: result.text,
          avatar: npc.avatar,
          inkStoryPath: npc.storyPath,
          startKnot: knotName,
          phoneId: npc.phoneId,
          useTTS: npc.npcType === 'person' && !!npc.voice
        });
      } else {
        console.warn(`⚠️ No text found in knot: ${knotName}`);
      }
    } catch (error) {
      console.error(`❌ Error loading bark from knot ${knotName}:`, error);
    }
  }

  // Helper to emit events about an NPC
  emit(npcId, type, payload = {}) {
    const ev = Object.assign({ npcId, type }, payload);
    this.eventDispatcher && this.eventDispatcher.emit(type, ev);
  }

  // Get all NPCs
  getAllNPCs() {
    return Array.from(this.npcs.values());
  }

  /**
   * Mark a conversation-opening handler for saving once its conversation closes.
   * Registered after the scene has started, so a conversation_closed emitted for
   * an earlier conversation (or the one this event came from) doesn't count.
   */
  _persistTriggerOnClose(npcId, eventKey) {
    if (!this.eventDispatcher) return;
    const eventName = `conversation_closed:${npcId}`;
    const onClosed = () => {
      this.eventDispatcher.off(eventName, onClosed);
      const triggered = this.triggeredEvents.get(eventKey);
      if (triggered) triggered.persist = true;
    };
    this.eventDispatcher.on(eventName, onClosed);
  }

  /**
   * onceOnly / maxTriggers handlers that have fired, for the server (state-sync.js),
   * keyed like the dedup key: `${npcId}:${eventPattern}:${handlerIndex}`.
   * @returns {Object} { key: count }
   */
  exportTriggeredEvents() {
    const out = {};
    for (const [key, triggered] of this.triggeredEvents) {
      if (triggered.persist && triggered.count > 0) out[key] = triggered.count;
    }
    return out;
  }

  /**
   * Restore saved handler counts on load (game.js), before any mapping can fire,
   * so a onceOnly cutscene, bark or message doesn't replay after a reload.
   * Keeps the larger count if this session has already fired the handler.
   * @param {Object} saved - { key: count }
   */
  restoreTriggeredEvents(saved) {
    if (!saved || typeof saved !== 'object') return;
    for (const [key, count] of Object.entries(saved)) {
      if (!Number.isInteger(count) || count <= 0) continue;
      const existing = this.triggeredEvents.get(key) || { count: 0, lastTime: 0 };
      existing.count = Math.max(existing.count, count);
      existing.persist = true;
      this.triggeredEvents.set(key, existing);
    }
    console.log(`📋 Restored ${Object.keys(saved).length} fired onceOnly/maxTriggers handler(s)`);
  }

  // Check if an event has been triggered for an NPC
  hasTriggered(npcId, eventPattern) {
    // Keys are now per-handler (`${npcId}:${eventPattern}:${handlerIndex}`); this
    // keeps the original meaning — "did anything on this (npc, pattern) pair fire?" —
    // by matching any handler's key for that pair.
    const prefix = `${npcId}:${eventPattern}:`;
    for (const [key, triggered] of this.triggeredEvents) {
      if (key.startsWith(prefix) && triggered.count > 0) return true;
    }
    return false;
  }

  // Schedule a timed message to be delivered after a delay
  // opts: { npcId, text, triggerTime (ms from game start) OR delay (ms from now), phoneId, waitForEvent }
  // waitForEvent: Optional event name to wait for before delivering message (e.g., 'conversation_closed:briefing_cutscene')
  //               When set, the delay is applied AFTER the event fires, not from game start
  scheduleTimedMessage(opts) {
    const { npcId, text, triggerTime, delay, phoneId, targetKnot, waitForEvent, skipIfGlobal } = opts;

    if (!npcId || !text) {
      console.error('[NPCManager] scheduleTimedMessage requires npcId and text');
      return;
    }

    // Use triggerTime if provided, otherwise use delay (defaults to 0)
    const actualDelay = triggerTime !== undefined ? triggerTime : (delay || 0);

    const message = {
      npcId,
      text,
      delay: actualDelay, // Store delay separately for event-based triggering
      phoneId: phoneId || 'player_phone',
      targetKnot: targetKnot || null,
      delivered: false,
      waitForEvent: waitForEvent || null,
      skipIfGlobal: skipIfGlobal || null,
      triggerTime: waitForEvent ? null : actualDelay // Only set triggerTime if not waiting for event
    };

    this.timedMessages.push(message);

    if (waitForEvent) {
      console.log(`[NPCManager] Scheduled timed message from ${npcId} waiting for event '${waitForEvent}' (delay: ${actualDelay}ms):`, text);
      // Set up event listener for this message
      this._setupEventTriggeredMessage(message, waitForEvent);
    } else {
      console.log(`[NPCManager] Scheduled timed message from ${npcId} at ${actualDelay}ms:`, text);
    }
  }

  // Set up event listener for event-triggered timed message
  _setupEventTriggeredMessage(message, eventName) {
    if (!this.eventDispatcher) {
      console.warn(`[NPCManager] Cannot set up event-triggered message: eventDispatcher not available`);
      return;
    }

    const listener = (eventData) => {
      console.log(`[NPCManager] Event '${eventName}' fired, scheduling message delivery with ${message.delay}ms delay`);

      // Calculate trigger time as delay from now (when event fired)
      message.triggerTime = Date.now() - this.gameStartTime + message.delay;

      console.log(`[NPCManager] Message will be delivered at ${message.triggerTime}ms from game start`);

      // Remove event listener since it's one-time
      this.eventDispatcher.off(eventName, listener);
    };

    this.eventDispatcher.on(eventName, listener);
    console.log(`[NPCManager] Registered event listener for '${eventName}'`);
  }

  // Schedule a timed conversation to start after a delay
  // Similar to timedMessages but for person NPCs (opens person-chat minigame)
  //
  // opts: { npcId, targetKnot, triggerTime (ms from game start) OR delay (ms from now), waitForEvent }
  // waitForEvent: Optional event name to wait for before starting conversation (e.g., 'game_loaded')
  //               When set, the delay is applied AFTER the event fires, not from game start
  //
  // Example: After 3 seconds, automatically open a conversation with test_npc_back at the "group_meeting" knot
  //   scheduleTimedConversation({
  //     npcId: 'test_npc_back',
  //     targetKnot: 'group_meeting',
  //     delay: 3000
  //   })
  //
  // USAGE IN SCENARIO JSON:
  //   {
  //     "id": "test_npc_back",
  //     "displayName": "Back NPC",
  //     "npcType": "person",
  //     "storyPath": "scenarios/ink/test2.json",
  //     "currentKnot": "hub",
  //     "timedConversation": {
  //       "delay": 0,          // Start immediately after event
  //       "targetKnot": "group_meeting",
  //       "waitForEvent": "game_loaded"
  //     }
  //   }
  scheduleTimedConversation(opts) {
    const { npcId, targetKnot, triggerTime, delay, background, waitForEvent, skipIfGlobal, setGlobalOnStart } = opts;

    if (!npcId || !targetKnot) {
      console.error('[NPCManager] scheduleTimedConversation requires npcId and targetKnot');
      return;
    }

    // Use triggerTime if provided, otherwise use delay (defaults to 0)
    const actualDelay = triggerTime !== undefined ? triggerTime : (delay || 0);

    const conversation = {
      npcId,
      targetKnot,
      delay: actualDelay, // Store delay separately for event-based triggering
      background: background, // Optional background image path
      delivered: false,
      waitForEvent: waitForEvent || null,
      triggerTime: waitForEvent ? null : actualDelay, // Only set triggerTime if not waiting for event
      skipIfGlobal: skipIfGlobal || null,     // Skip if this global is already truthy
      setGlobalOnStart: setGlobalOnStart || null // Set this global to true when conversation fires
    };

    this.timedConversations.push(conversation);

    if (waitForEvent) {
      console.log(`[NPCManager] Scheduled timed conversation from ${npcId} waiting for event '${waitForEvent}' (delay: ${actualDelay}ms) to knot: ${targetKnot}`);
      // Set up event listener for this conversation
      this._setupEventTriggeredConversation(conversation, waitForEvent);
    } else {
      console.log(`[NPCManager] Scheduled timed conversation from ${npcId} at ${actualDelay}ms to knot: ${targetKnot}`);
    }
  }

  // Set up event listener for event-triggered timed conversation
  _setupEventTriggeredConversation(conversation, eventName) {
    if (!this.eventDispatcher) {
      console.warn(`[NPCManager] Cannot set up event-triggered conversation: eventDispatcher not available`);
      return;
    }

    const listener = (eventData) => {
      console.log(`[NPCManager] Event '${eventName}' fired, scheduling conversation delivery with ${conversation.delay}ms delay`);

      // Calculate trigger time as delay from now (when event fired)
      conversation.triggerTime = Date.now() - this.gameStartTime + conversation.delay;

      console.log(`[NPCManager] Conversation will be delivered at ${conversation.triggerTime}ms from game start`);

      // Remove event listener since it's one-time
      this.eventDispatcher.off(eventName, listener);
    };

    this.eventDispatcher.on(eventName, listener);
    console.log(`[NPCManager] Registered event listener for conversation '${eventName}'`);
  }

  // Start checking for timed messages (call this when game starts)
  startTimedMessages() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.gameStartTime = Date.now();
    
    // Check every second for messages that need to be delivered
    this.timerInterval = setInterval(() => {
      this._checkTimedMessages();
    }, 1000);
    
    console.log('[NPCManager] Started timed messages system');
  }

  // Stop checking for timed messages (cleanup)
  stopTimedMessages() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Check if any timed messages need to be delivered
  _checkTimedMessages() {
    const now = Date.now();
    const elapsed = now - this.gameStartTime;

    for (const message of this.timedMessages) {
      // Skip messages that haven't been triggered yet (waiting for event)
      if (message.triggerTime === null) {
        continue;
      }

      if (!message.delivered && elapsed >= message.triggerTime) {
        this._deliverTimedMessage(message);
        message.delivered = true;
      }
    }

    // Also check timed conversations
    for (const conversation of this.timedConversations) {
      // Skip conversations that haven't been triggered yet (waiting for event)
      if (conversation.triggerTime === null) {
        continue;
      }

      if (!conversation.delivered && elapsed >= conversation.triggerTime) {
        this._deliverTimedConversation(conversation);
        conversation.delivered = true;
      }
    }
  }

  // Deliver a timed message (add to history and show bark)
  _deliverTimedMessage(message) {
    const npc = this.getNPC(message.npcId);
    if (!npc) {
      console.warn(`[NPCManager] Cannot deliver timed message: NPC ${message.npcId} not found`);
      return;
    }

    // Skip if a guard global is already truthy (e.g. don't nag about ESD after it's been pressed).
    if (message.skipIfGlobal) {
      const globalValue = window.gameState?.globalVariables?.[message.skipIfGlobal];
      if (globalValue) {
        console.log(`[NPCManager] Skipping timed message from ${message.npcId}: global '${message.skipIfGlobal}' is already set`);
        return;
      }
    }
    
    // Add message to conversation history (represents the incoming mobile chat message)
    this.addMessage(message.npcId, 'npc', message.text, { 
      timed: true,
      phoneId: message.phoneId
    });
    
    // Update phone badge if updatePhoneBadge function exists
    if (window.updatePhoneBadge && message.phoneId) {
      window.updatePhoneBadge(message.phoneId);
    }
    
    // Show bark notification
    if (this.barkSystem) {
      this.barkSystem.showBark({
        npcId: npc.id,
        npcName: npc.displayName,
        message: message.text,
        avatar: npc.avatar,
        inkStoryPath: npc.storyPath,
        startKnot: message.targetKnot || npc.currentKnot,
        phoneId: message.phoneId,
        useTTS: npc.npcType === 'person' && !!npc.voice
      });
    }
    
    console.log(`[NPCManager] Delivered timed message from ${message.npcId}:`, message.text);
  }

  // Deliver a timed conversation (start person-chat or phone-chat minigame at specified knot)
  _deliverTimedConversation(conversation) {
    const npc = this.getNPC(conversation.npcId);
    if (!npc) {
      console.warn(`[NPCManager] Cannot deliver timed conversation: NPC ${conversation.npcId} not found`);
      return;
    }

    // Skip this conversation if a guard global variable is already truthy.
    // Used to prevent replaying one-shot cutscenes (e.g. opening briefing) on session resume.
    if (conversation.skipIfGlobal) {
      const globalValue = window.gameState?.globalVariables?.[conversation.skipIfGlobal];
      if (globalValue) {
        console.log(`[NPCManager] Skipping timed conversation for ${conversation.npcId}: global '${conversation.skipIfGlobal}' is already set`);
        return;
      }
    }

    // Mark the guard global immediately so that reloads during the cutscene also skip it.
    if (conversation.setGlobalOnStart && window.gameState?.globalVariables) {
      const startVarName = conversation.setGlobalOnStart;
      const startOldValue = window.gameState.globalVariables[startVarName];
      window.gameState.globalVariables[startVarName] = true;
      window.eventDispatcher?.emit(`global_variable_changed:${startVarName}`, {
        name: startVarName, value: true, oldValue: startOldValue
      });
      console.log(`[NPCManager] Set global '${conversation.setGlobalOnStart}' = true for ${conversation.npcId}`);
    }
    
    // Update NPC's current knot to the target knot
    npc.currentKnot = conversation.targetKnot;
    
    // Check if MinigameFramework is available to start the appropriate minigame
    if (window.MinigameFramework && typeof window.MinigameFramework.startMinigame === 'function') {
      // Determine which minigame type to start based on NPC type
      if (npc.npcType === 'phone') {
        console.log(`📱 Starting timed phone conversation for ${conversation.npcId} at knot: ${conversation.targetKnot}`);
        
        window.MinigameFramework.startMinigame('phone-chat', null, {
          npcId: conversation.npcId,
          phoneId: npc.phoneId || 'player_phone',
          title: 'Phone',
          theme: npc.phoneTheme
        });
      } else {
        console.log(`🎭 Starting timed person conversation for ${conversation.npcId} at knot: ${conversation.targetKnot}`);
        
        window.MinigameFramework.startMinigame('person-chat', null, {
          npcId: conversation.npcId,
          title: npc.displayName || conversation.npcId,
          background: conversation.background // Optional background image path
        });
      }
    } else {
      console.warn(`[NPCManager] MinigameFramework not available to start conversation for timed conversation`);
    }
    
    console.log(`[NPCManager] Delivered timed conversation from ${conversation.npcId} to knot: ${conversation.targetKnot}`);
  }

  // Load timed messages from scenario data
  // timedMessages: [ { npcId, text, triggerTime, phoneId } ]
  loadTimedMessages(timedMessages) {
    if (!Array.isArray(timedMessages)) return;
    
    timedMessages.forEach(msg => {
      this.scheduleTimedMessage(msg);
    });
    
    console.log(`[NPCManager] Loaded ${timedMessages.length} timed messages`);
  }

  /**
   * Clear conversation history for an NPC (useful for testing/debugging)
   * @param {string} npcId - The NPC to reset
   */
  clearNPCHistory(npcId) {
    if (!npcId) {
      console.warn('[NPCManager] clearNPCHistory requires npcId');
      return;
    }
    
    // Clear conversation history
    if (this.conversationHistory.has(npcId)) {
      this.conversationHistory.set(npcId, []);
      console.log(`[NPCManager] Cleared conversation history for ${npcId}`);
    }
    
    // Clear story state from localStorage
    const storyStateKey = `npc_story_state_${npcId}`;
    if (localStorage.getItem(storyStateKey)) {
      localStorage.removeItem(storyStateKey);
      console.log(`[NPCManager] Cleared saved story state for ${npcId}`);
    }
    
    console.log(`✅ Reset NPC: ${npcId}. Start a new conversation to see fresh state.`);
  }

  /**
   * OPTIMIZATION: Clean up event listeners for an NPC
   * Call this when removing an NPC or changing scenes
   */
  unregisterNPC(npcId) {
    if (!this.eventDispatcher) return;

    // Remove all event listeners for this NPC
    const listeners = this.eventListeners.get(npcId);
    if (listeners) {
      for (const { pattern, listener } of listeners) {
        this.eventDispatcher.off(pattern, listener);
      }
      this.eventListeners.delete(npcId);
      console.log(`[NPCManager] Cleaned up ${listeners.length} event listeners for ${npcId}`);
    }

    // Clear cached InkEngine
    if (this.inkEngineCache.has(npcId)) {
      this.inkEngineCache.delete(npcId);
      console.log(`[NPCManager] Cleared cached InkEngine for ${npcId}`);
    }

    // Remove NPC from registry
    this.npcs.delete(npcId);
    this.conversationHistory.delete(npcId);
    // Keys are composite (`${npcId}:${eventPattern}:${handlerIndex}`), so a bare
    // delete(npcId) never matched anything — delete every key for this NPC.
    const npcEventPrefix = `${npcId}:`;
    for (const key of this.triggeredEvents.keys()) {
      if (key.startsWith(npcEventPrefix)) this.triggeredEvents.delete(key);
    }

    console.log(`[NPCManager] Unregistered NPC: ${npcId}`);
  }

  /**
   * OPTIMIZATION: Clean up all NPCs (call on scene change)
   */
  unregisterAllNPCs() {
    const npcIds = Array.from(this.npcs.keys());
    for (const npcId of npcIds) {
      this.unregisterNPC(npcId);
    }
    console.log(`[NPCManager] Cleaned up all NPCs (${npcIds.length} total)`);
  }

  /**
   * Get or create Ink engine for an NPC
   * Fetches story from NPC data and initializes InkEngine
   * @param {string} npcId - NPC ID
   * @returns {Promise<InkEngine|null>} Ink engine instance or null
   */
  async getInkEngine(npcId) {
    try {
      const npc = this.getNPC(npcId);
      if (!npc) {
        console.error(`❌ NPC not found: ${npcId}`);
        return null;
      }

      // Check if already cached
      if (this.inkEngineCache.has(npcId)) {
        console.log(`📖 Using cached InkEngine for ${npcId}`);
        return this.inkEngineCache.get(npcId);
      }

      // Need to load story
      if (!npc.storyPath) {
        console.error(`❌ NPC ${npcId} has no storyPath`);
        return null;
      }

      // Fetch story from cache or network
      let storyJson = this.storyCache.get(npc.storyPath);
      if (!storyJson) {
        // Use Rails API endpoint instead of direct file fetch
        const gameId = window.breakEscapeConfig?.gameId;
        const endpoint = gameId 
          ? `/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(npcId)}`
          : npc.storyPath;  // Fallback to storyPath if no gameId
        
        console.log(`📚 Fetching story from ${endpoint}`);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to load story: ${response.statusText}`);
        }
        storyJson = await response.json();
        this.storyCache.set(npc.storyPath, storyJson);
      }

      // Create and cache InkEngine
      const { default: InkEngine } = await import('./ink/ink-engine.js');
      const inkEngine = new InkEngine(npcId);
      inkEngine.loadStory(storyJson);

      // Import npcConversationStateManager for global variable sync
      const { default: npcConversationStateManager } = await import('./npc-conversation-state.js');

      // Discover any global_* variables not in scenario JSON
      npcConversationStateManager.discoverGlobalVariables(inkEngine.story);

      // Sync global variables from window.gameState to story
      npcConversationStateManager.syncGlobalVariablesToStory(inkEngine.story);

      // Observe changes to sync back to window.gameState
      npcConversationStateManager.observeGlobalVariableChanges(inkEngine.story, npcId);

      this.inkEngineCache.set(npcId, inkEngine);

      console.log(`✅ InkEngine initialized for ${npcId}`);
      return inkEngine;
    } catch (error) {
      console.error(`❌ Error getting InkEngine for ${npcId}:`, error);
      return null;
    }
  }

  /**
   * OPTIMIZATION: Destroy InkEngine cache for a specific story
   * Useful when memory is tight or story changed
   */
  clearStoryCache(storyPath) {
    this.storyCache.delete(storyPath);
  }

  /**
   * OPTIMIZATION: Clear all caches
   */
  clearAllCaches() {
    this.inkEngineCache.clear();
    this.storyCache.clear();
    console.log(`[NPCManager] Cleared all caches`);
  }

  /**
   * Enable or disable LOS cone visualization for debugging
   * @param {boolean} enable - Whether to show LOS cones
   * @param {Phaser.Scene} scene - Phaser scene for drawing
   * @param {boolean} showAll - Draw every NPC's cone (debug). When false, only
   *   NPCs whose scenario sets los.visualize = true get a cone.
   */
  setLOSVisualization(enable, scene = null, showAll = true) {
    this.losVisualizationEnabled = enable;
    // Once debug mode has asked for every cone, a later per-NPC request must not narrow it
    this.losVisualizeAll = enable && (showAll || this.losVisualizeAll);
    
    if (enable && scene) {
      console.log('👁️ Enabling LOS visualization');
      this._updateLOSVisualizations(scene);
    } else if (!enable) {
      console.log('👁️ Disabling LOS visualization');
      this._clearLOSVisualizations();
    }
  }

  /**
   * Update LOS visualizations for all NPCs in a scene
   * Call this from the game loop (update method) if visualization is enabled
   * @param {Phaser.Scene} scene - Phaser scene for drawing
   */
  updateLOSVisualizations(scene) {
    if (!this.losVisualizationEnabled || !scene) return;
    
    this._updateLOSVisualizations(scene);
  }

  /**
   * Internal: Update or create LOS cone graphics
   */
  _updateLOSVisualizations(scene) {
    // console.log(`🎯 Updating LOS visualizations for ${this.npcs.size} NPCs`);
    let visualizedCount = 0;
    
    for (const npc of this.npcs.values()) {
      // Only visualize person-type NPCs with LOS config
      if (npc.npcType !== 'person') {
        // console.log(`   Skip "${npc.id}" - not person type (${npc.npcType})`);
        continue;
      }
      
      if (!npc.los || !npc.los.enabled || (!this.losVisualizeAll && npc.los.visualize !== true)) {
        // console.log(`   Skip "${npc.id}" - no LOS config, disabled, or not flagged for visualization`);
        if (this.losVisualizations.has(npc.id)) {
          clearLOSCone(this.losVisualizations.get(npc.id));
          this.losVisualizations.delete(npc.id);
        }
        continue;
      }
      
      // console.log(`   Processing "${npc.id}" - has LOS config`, npc.los);
      
      // Remove old visualization
      if (this.losVisualizations.has(npc.id)) {
        // console.log(`   Clearing old visualization for "${npc.id}"`);
        clearLOSCone(this.losVisualizations.get(npc.id));
      }
      
      // Draw new cone (depth is set inside drawLOSCone)
      const graphics = drawLOSCone(scene, npc, npc.los, 0x00ff00, 0.15);
      if (graphics) {
        this.losVisualizations.set(npc.id, graphics);
        // Graphics depth is already set inside drawLOSCone to -999
        // console.log(`   ✅ Created visualization for "${npc.id}"`);
        visualizedCount++;
      } else {
        console.log(`   ❌ Failed to create visualization for "${npc.id}"`);
      }
    }
    
    // console.log(`✅ LOS visualization update complete: ${visualizedCount}/${this.npcs.size} visualized`);
  }

  /**
   * Internal: Clear all LOS visualizations
   */
  _clearLOSVisualizations() {
    for (const graphics of this.losVisualizations.values()) {
      clearLOSCone(graphics);
    }
    this.losVisualizations.clear();
  }

  /**
   * Cleanup: destroy all LOS visualizations and event listeners
   */
  destroy() {
    this._clearLOSVisualizations();
    this.stopTimedMessages();
    
    // Clear all event listeners
    for (const listeners of this.eventListeners.values()) {
      listeners.forEach(({ listener }) => {
        if (this.eventDispatcher && typeof listener === 'function') {
          this.eventDispatcher.off('*', listener);
        }
      });
    }
    this.eventListeners.clear();
    
    console.log('[NPCManager] Destroyed');
  }
}

// Console helper for debugging
if (typeof window !== 'undefined') {
  window.clearNPCHistory = (npcId) => {
    if (!window.npcManager) {
      console.error('NPCManager not available');
      return;
    }
    window.npcManager.clearNPCHistory(npcId);
  };
}
