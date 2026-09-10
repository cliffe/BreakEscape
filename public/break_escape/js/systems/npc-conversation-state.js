/**
 * NPC Conversation State Manager
 * 
 * Persists NPC conversation state (Ink variables, choices, progress) across multiple conversations.
 * Stores serialized story state so NPCs remember their relationships and story progression.
 * 
 * @module npc-conversation-state
 */

class NPCConversationStateManager {
    constructor() {
        this.conversationStates = new Map(); // { npcId: { storyState, variables, ... } }
        console.log('🗂️ NPC Conversation State Manager initialized');
    }

    /**
     * Save the current state of an NPC's conversation
     * 
     * Important: When story has ended, we save ONLY the variables (not the story state/progress).
     * This preserves character relationships and earned rewards while allowing the story to restart fresh.
     * 
     * @param {string} npcId - NPC identifier
     * @param {Object} story - The Ink story object
     * @param {boolean} forceFullState - If true, save full state even if story has ended (for in-progress saves)
     */
    saveNPCState(npcId, story, forceFullState = false) {
        if (!npcId || !story) return;

        try {
            const state = {
                timestamp: Date.now(),
                hasEnded: story.state.hasEnded
            };

            // Always save the variables (favour, items earned, flags, etc.)
            // These persist across conversations even when story ends
            if (story.variablesState) {
                // Filter out has_* variables (derived from itemsHeld, will be re-synced on load)
                const filteredVariables = {};
                for (const [key, value] of Object.entries(story.variablesState)) {
                    // Skip dynamically-synced item inventory variables
                    if (!key.startsWith('has_lockpick') && 
                        !key.startsWith('has_workstation') && 
                        !key.startsWith('has_phone') && 
                        !key.startsWith('has_keycard')) {
                        filteredVariables[key] = value;
                    }
                }
                state.variables = filteredVariables;
                console.log(`💾 Saved variables for ${npcId}:`, state.variables);
            }

            // Save global variables snapshot for restoration
            state.globalVariablesSnapshot = { ...window.gameState.globalVariables };
            console.log(`💾 Saved global variables snapshot:`, state.globalVariablesSnapshot);

            // Only save full story state if story is still active OR if explicitly forced
            if (!story.state.hasEnded || forceFullState) {
                try {
                    state.storyState = story.state.ToJson();
                    console.log(`💾 Saved full story state for ${npcId} (active story)`);
                } catch (serializeError) {
                    // If serialization fails (due to dynamic variables), just save variables
                    console.warn(`⚠️ Could not serialize full story state for ${npcId}, saving variables only:`, serializeError.message);
                }
            } else {
                console.log(`💾 Saved variables only for ${npcId} (story ended - will restart fresh)`);
            }

            this.conversationStates.set(npcId, state);
            console.log(`✅ NPC state persisted for: ${npcId}`, {
                timestamp: new Date(state.timestamp).toLocaleTimeString(),
                hasEnded: state.hasEnded,
                hasVariables: !!state.variables,
                hasStoryState: !!state.storyState
            });
        } catch (error) {
            console.error(`❌ Error saving NPC state for ${npcId}:`, error);
        }
    }

    /**
     * Restore the state of an NPC's conversation
     * 
     * Strategy:
     * - If full story state exists (story was mid-conversation): restore it completely
     * - If only variables exist (story had ended): load variables but let story start fresh
     * 
     * @param {string} npcId - NPC identifier
     * @param {Object} story - The Ink story object to restore into
     * @returns {boolean} True if state was restored
     */
    restoreNPCState(npcId, story) {
        if (!npcId || !story) return false;

        const state = this.conversationStates.get(npcId);
        if (!state) {
            console.log(`ℹ️ No saved state for NPC: ${npcId} (first conversation)`);
            return false;
        }

        try {
            // NOTE: We no longer restore globalVariablesSnapshot here!
            // Global variables are the single source of truth in window.gameState.globalVariables
            // They should NOT be overwritten when restoring individual NPC states, because
            // other NPCs may have changed global variables since this state was saved.
            // Instead, we sync FROM window.gameState.globalVariables TO the story after loading.

            // If we have saved story state, restore it completely (mid-conversation state)
            // NOTE: After LoadJson, global variables inside the story may be stale.
            // The caller should call syncGlobalVariablesToStory() after this returns.
            if (state.storyState) {
                story.state.LoadJson(state.storyState);
                console.log(`✅ Restored full story state for NPC: ${npcId}`, {
                    savedAt: new Date(state.timestamp).toLocaleTimeString(),
                    reason: 'In-progress conversation (global vars will be re-synced)'
                });
                return true;
            }

            // If we only have variables (story ended), restore just the NPC-specific variables
            if (state.variables) {
                // Load NPC-specific variables into the story
                // Skip global variables - they will be synced separately from window.gameState.globalVariables
                for (const [key, value] of Object.entries(state.variables)) {
                    // Skip global variables - they're managed by window.gameState.globalVariables
                    if (this.isGlobalVariable(key)) {
                        console.log(`⏭️ Skipping global variable in NPC restore: ${key} (will sync from gameState)`);
                        continue;
                    }
                    story.variablesState[key] = value;
                }
                console.log(`✅ Restored NPC-specific variables for NPC: ${npcId}`, {
                    savedAt: new Date(state.timestamp).toLocaleTimeString(),
                    reason: 'Story ended - restarting fresh with saved variables'
                });
                return true;
            }

            console.log(`ℹ️ No saveable data for NPC: ${npcId}`);
            return false;
        } catch (error) {
            console.error(`❌ Error restoring NPC state for ${npcId}:`, error);
            return false;
        }
    }

    /**
     * Get the current state for an NPC (for debugging)
     * @param {string} npcId - NPC identifier
     * @returns {Object|null} Conversation state or null if not found
     */
    getNPCState(npcId) {
        return this.conversationStates.get(npcId) || null;
    }

    /**
     * Clear the state for an NPC (useful for resetting conversations)
     * @param {string} npcId - NPC identifier
     */
    clearNPCState(npcId) {
        if (this.conversationStates.has(npcId)) {
            this.conversationStates.delete(npcId);
            console.log(`🗑️ Cleared conversation state for NPC: ${npcId}`);
        }
    }

    /**
     * Clear all NPC states (useful for scenario reset)
     */
    clearAllStates() {
        const count = this.conversationStates.size;
        this.conversationStates.clear();
        console.log(`🗑️ Cleared all NPC conversation states (${count} NPCs)`);
    }

    /**
     * Get list of NPCs with saved state
     * @returns {Array<string>} Array of NPC IDs with persistent state
     */
    getSavedNPCs() {
        return Array.from(this.conversationStates.keys());
    }

    // ============================================================
    // GLOBAL VARIABLE MANAGEMENT (for cross-NPC narrative state)
    // ============================================================

    /**
     * Get list of global variable names from scenario
     * @returns {Array<string>} Names of global variables
     */
    getGlobalVariableNames() {
        const scenarioGlobals = window.gameScenario?.globalVariables || {};
        return Object.keys(scenarioGlobals);
    }

    /**
     * Check if a variable is global (either declared in scenario or uses global_ prefix)
     * @param {string} name - Variable name
     * @returns {boolean} True if variable is global
     */
    isGlobalVariable(name) {
        // Check scenario declaration
        if (window.gameState?.globalVariables?.hasOwnProperty(name)) {
            return true;
        }
        // Check naming convention
        if (name.startsWith('global_')) {
            return true;
        }
        return false;
    }

    /**
     * Auto-discover global_* variables from story and add to global store
     * @param {Object} story - Ink story object
     */
    discoverGlobalVariables(story) {
        if (!story?.variablesState?._defaultGlobalVariables) return;
        
        const declaredVars = Array.from(story.variablesState._defaultGlobalVariables.keys());
        const globalVars = declaredVars.filter(name => name.startsWith('global_'));
        
        // Add to window.gameState.globalVariables if not already present
        globalVars.forEach(name => {
            if (!window.gameState.globalVariables.hasOwnProperty(name)) {
                const value = story.variablesState[name];
                window.gameState.globalVariables[name] = value;
                console.log(`🔍 Auto-discovered global variable: ${name} = ${value}`);
            }
        });
    }

    /**
     * Sync global variables from window.gameState to Ink story
     * @param {Object} story - Ink story object
     */
    syncGlobalVariablesToStory(story) {
        if (!story || !window.gameState?.globalVariables) return;
        
        // Sync all global variables to this story
        Object.entries(window.gameState.globalVariables).forEach(([name, value]) => {
            // Only sync if variable exists in this story
            if (story.variablesState.GlobalVariableExistsWithName(name)) {
                try {
                    story.variablesState[name] = value;
                    console.log(`✅ Synced ${name} = ${value} to story`);
                } catch (err) {
                    console.warn(`⚠️ Could not sync ${name}:`, err.message);
                }
            }
        });
    }

    /**
     * Sync global variables from Ink story back to window.gameState
     * @param {Object} story - Ink story object
     * @returns {Array} Array of changed variables
     */
    syncGlobalVariablesFromStory(story) {
        if (!story || !window.gameState?.globalVariables) return [];

        // Push back ONLY what this story actually changed.
        //
        // Every ink file declares its own `VAR cover_burned = false`, so a
        // loaded story holds a full copy of the globals it names. Scanning all
        // of them and copying any that differ means a story that never touched
        // a variable still overwrites it -- with whatever its own copy happens
        // to hold. Closing Dr Kim's dialogue reset cover_burned to false after
        // Agent 0x99 had set it true, which silently skipped Val Okonkwo's
        // cover-challenge confrontation. Nothing errored; the beat just never
        // happened.
        //
        // observeGlobalVariableChanges records the names this story assigned,
        // and writes each through as it happens, so this is a safety net rather
        // than the main path. The set is cleared afterwards so a value changed
        // once cannot be re-pushed later, by which time someone else may
        // legitimately own it.
        //
        // When the set is absent the observer never attached, and we have no
        // information about what this story touched -- fall back to the old
        // full scan rather than silently syncing nothing.
        const touched = story.__beChangedGlobals;
        const names = touched ? Array.from(touched) : Object.keys(window.gameState.globalVariables);

        const changed = [];
        names.forEach(name => {
            if (!(name in window.gameState.globalVariables)) return;
            if (story.variablesState.GlobalVariableExistsWithName(name)) {
                // Use the indexer which automatically unwraps Ink's Value objects
                // According to Ink source: this[variableName] returns (varContents as Runtime.Value).valueObject
                const newValue = story.variablesState[name];
                
                // Compare and update if changed
                const oldValue = window.gameState.globalVariables[name];
                if (oldValue !== newValue) {
                    window.gameState.globalVariables[name] = newValue;
                    changed.push({ name, value: newValue });
                    console.log(`🔄 Global variable ${name} changed from ${oldValue} to ${newValue}`);
                }
            }
        });

        touched?.clear();

        return changed;
    }

    /**
     * Observe changes to global variables in Ink and sync back to window.gameState
     * @param {Object} story - Ink story object
     * @param {string} npcId - NPC ID for logging
     */
    observeGlobalVariableChanges(story, npcId) {
        if (!story?.variablesState) return;

        // Names this story has assigned. Its presence also tells
        // syncGlobalVariablesFromStory that the observer attached, so an
        // empty set means "changed nothing" rather than "unknown".
        story.__beChangedGlobals = story.__beChangedGlobals || new Set();

        // Use Ink's built-in variable change observer
        story.variablesState.variableChangedEvent = (variableName, newValue) => {
            // Check if this is a global variable
            if (this.isGlobalVariable(variableName)) {
                story.__beChangedGlobals.add(variableName);
                console.log(`🌐 Global variable changed: ${variableName} = ${newValue} (from ${npcId})`);
                
                // Update window.gameState
                const unwrappedValue = newValue?.valueObject ?? newValue;
                window.gameState.globalVariables[variableName] = unwrappedValue;
                
                // Broadcast to other loaded stories
                this.broadcastGlobalVariableChange(variableName, unwrappedValue, npcId);

                // Fire the game-wide event so timers, SIEM, and other systems react
                window.eventDispatcher?.emit(`global_variable_changed:${variableName}`, {
                    name: variableName,
                    value: unwrappedValue
                });
            }
        };
    }

    /**
     * Broadcast a global variable change to all other loaded Ink stories
     * @param {string} variableName - Variable name
     * @param {*} value - New value
     * @param {string} sourceNpcId - NPC ID that triggered the change (to avoid feedback loop)
     */
    broadcastGlobalVariableChange(variableName, value, sourceNpcId) {
        if (!window.npcManager?.inkEngineCache) return;
        
        // Sync to all loaded stories except the source
        window.npcManager.inkEngineCache.forEach((inkEngine, npcId) => {
            if (npcId !== sourceNpcId && inkEngine?.story) {
                const story = inkEngine.story;
                if (story.variablesState.GlobalVariableExistsWithName(variableName)) {
                    try {
                        // Temporarily disable event to prevent loops
                        const oldHandler = story.variablesState.variableChangedEvent;
                        story.variablesState.variableChangedEvent = null;
                        
                        story.variablesState[variableName] = value;
                        
                        // Re-enable event
                        story.variablesState.variableChangedEvent = oldHandler;
                        
                        console.log(`📡 Broadcasted ${variableName} = ${value} to ${npcId}`);
                    } catch (err) {
                        console.warn(`⚠️ Could not broadcast to ${npcId}:`, err.message);
                    }
                }
            }
        });
    }

    /**
     * Sync inventory-based variables to story (items player has, tools available, etc.)
     * This checks what the player has in inventory and sets corresponding Ink variables.
     * Only sets variables that are declared in the story to avoid StoryException errors.
     * @param {Object} story - Ink story object
     * @param {Object} npc - NPC data (may have rfidCard property)
     */
    syncInventoryVariablesToStory(story, npc = null) {
        if (!story || !window.inventory?.items) return;

        // Helper to safely set a variable only if it exists in the story
        const safeSetVariable = (varName, value) => {
            try {
                if (story.variablesState[varName] !== undefined) {
                    story.variablesState[varName] = value;
                    return true;
                }
            } catch (error) {
                // Variable doesn't exist in this story, skip it
            }
            return false;
        };

        try {
            // Check for RFID cloner in inventory
            const hasRFIDCloner = window.inventory.items.some(item =>
                item?.scenarioData?.type === 'rfid_cloner'
            );
            if (safeSetVariable('has_rfid_cloner', hasRFIDCloner)) {
                console.log(`📱 Synced has_rfid_cloner = ${hasRFIDCloner}`);
            }

            // Check for keycards/items in inventory
            const hasItems = window.inventory.items.length > 0;
            if (safeSetVariable('has_keycard', hasItems)) {
                console.log(`🔑 Synced has_keycard = ${hasItems}`);
            }

            // If NPC has RFID card info, sync card protocol details
            if (npc?.rfidCard) {
                if (safeSetVariable('card_protocol', npc.rfidCard.rfid_protocol || '')) {
                    console.log(`📡 Synced card_protocol = ${npc.rfidCard.rfid_protocol}`);
                }
                if (safeSetVariable('card_name', npc.rfidCard.name || '')) {
                    console.log(`📡 Synced card_name = ${npc.rfidCard.name}`);
                }
                if (safeSetVariable('card_card_id', npc.rfidCard.card_id || '')) {
                    console.log(`📡 Synced card_card_id = ${npc.rfidCard.card_id}`);
                }

                // Set protocol-specific flags
                const isInstantClone = npc.rfidCard.rfid_protocol === 'EM4100' ||
                    npc.rfidCard.rfid_protocol === 'MIFARE_Classic_Weak_Defaults';
                if (safeSetVariable('card_instant_clone', isInstantClone)) {
                    console.log(`⚡ Synced card_instant_clone = ${isInstantClone}`);
                }

                const needsAttack = npc.rfidCard.rfid_protocol === 'MIFARE_Classic_Custom_Keys';
                if (safeSetVariable('card_needs_attack', needsAttack)) {
                    console.log(`🔓 Synced card_needs_attack = ${needsAttack}`);
                }

                const isUIDOnly = npc.rfidCard.rfid_protocol === 'MIFARE_DESFire';
                if (safeSetVariable('card_uid_only', isUIDOnly)) {
                    console.log(`🛡️ Synced card_uid_only = ${isUIDOnly}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error syncing inventory variables to story:`, error);
        }
    }
}

// Create global instance
const npcConversationStateManager = new NPCConversationStateManager();

// Export for use in modules
export default npcConversationStateManager;

// Also attach to window for global access
if (typeof window !== 'undefined') {
    window.npcConversationStateManager = npcConversationStateManager;
}
