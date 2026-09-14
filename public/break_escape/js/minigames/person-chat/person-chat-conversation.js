/**
 * PersonChatConversation - Conversation Flow Manager
 * 
 * Manages Ink story progression for person-to-person conversations.
 * Handles:
 * - Story loading from NPCManager
 * - Current dialogue text
 * - Available choices
 * - Choice processing
 * - Ink tag handling (for actions like unlock_door, give_item)
 * - Conversation state tracking
 * 
 * @module person-chat-conversation
 */

export default class PersonChatConversation {
    /**
     * Create conversation manager
     * @param {Object} npc - NPC data with storyPath
     * @param {NPCManager} npcManager - NPC manager for story access
     */
    constructor(npc, npcManager) {
        this.npc = npc;
        this.npcManager = npcManager;
        
        // Ink engine instance (shared across all interfaces for this NPC)
        this.inkEngine = null;
        
        // State
        this.isActive = false;
        this.canContinue = false;
        this.currentText = '';
        this.currentChoices = [];
        this.currentTags = [];
        
        console.log(`💬 PersonChatConversation created for ${npc.id}`);
    }
    
    /**
     * Start conversation
     * Loads story from NPC manager and initializes Ink engine
     */
    async start() {
        try {
            if (!this.npcManager) {
                console.error('❌ NPCManager not available');
                return false;
            }
            
            // Get Ink engine from NPC manager
            // The NPC manager should have cached the engine per NPC
            this.inkEngine = await this.npcManager.getInkEngine(this.npc.id);
            
            if (!this.inkEngine) {
                console.error(`❌ Failed to load Ink engine for ${this.npc.id}`);
                return false;
            }
            
            // Set up external functions
            this.setupExternalFunctions();
            
            // Story is ready to start (no resetState() needed - it's initialized on loadStory)
            
            this.isActive = true;
            
            // Get initial dialogue
            this.advance();
            
            console.log(`✅ Conversation started for ${this.npc.id}`);
            return true;
        } catch (error) {
            console.error('❌ Error starting conversation:', error);
            return false;
        }
    }
    
    /**
     * Set up external functions for Ink story
     * These allow Ink to call game functions
     */
    setupExternalFunctions() {
        if (!this.inkEngine) return;

        // Store NPC metadata in global game state
        if (!window.gameState) {
            window.gameState = {};
        }
        if (!window.gameState.npcInteractions) {
            window.gameState.npcInteractions = {};
        }

        // Bind EXTERNAL functions that return values
        // These are called from ink scripts with parentheses: {player_name()}

        // Player name - return player's agent name or default
        this.inkEngine.bindExternalFunction('player_name', () => {
            return window.gameState?.playerName || 'Agent';
        });

        // Current mission ID - return active mission identifier
        this.inkEngine.bindExternalFunction('current_mission_id', () => {
            return window.gameState?.currentMissionId || 'mission_001';
        });

        // NPC location - where the conversation is happening
        this.inkEngine.bindExternalFunction('npc_location', () => {
            // Return location based on NPC or default
            if (this.npc.id === 'dr_chen') {
                return window.gameState?.npcLocation || 'lab';
            } else if (this.npc.id === 'director_netherton') {
                return window.gameState?.npcLocation || 'office';
            } else if (this.npc.id === 'haxolottle') {
                return window.gameState?.npcLocation || 'handler_station';
            }
            return window.gameState?.npcLocation || 'safehouse';
        });

        // Mission phase - what part of the mission we're in
        this.inkEngine.bindExternalFunction('mission_phase', () => {
            return window.gameState?.missionPhase || 'downtime';
        });

        // Operational stress level - for handler conversations
        this.inkEngine.bindExternalFunction('operational_stress_level', () => {
            return window.gameState?.operationalStressLevel || 'low';
        });

        // Equipment status - for Dr. Chen conversations
        this.inkEngine.bindExternalFunction('equipment_status', () => {
            return window.gameState?.equipmentStatus || 'nominal';
        });

        // Set variables in the Ink engine using setVariable instead of bindVariable
        this.inkEngine.setVariable('last_interaction_type', 'person');

        // Sync NPC items to Ink variables
        this.syncItemsToInk();

        // Set up event listener for item changes
        if (window.eventDispatcher) {
            this._itemsChangedListener = (data) => {
                if (data.npcId === this.npc.id) {
                    this.syncItemsToInk();
                }
            };
            window.eventDispatcher.on('npc_items_changed', this._itemsChangedListener);
        }
    }
    
    /**
     * Sync NPC's held items to Ink variables
     * Sets has_<type> based on itemsHeld array
     * IMPORTANT: Also sets variables to false for items NOT in inventory
     */
    syncItemsToInk() {
        if (!this.inkEngine || !this.inkEngine.story) return;

        const npc = this.npc;
        if (!npc || !npc.itemsHeld) return;

        const varState = this.inkEngine.story.variablesState;
        if (!varState._defaultGlobalVariables) return;

        // Count items by type
        const itemCounts = {};
        npc.itemsHeld.forEach(item => {
            itemCounts[item.type] = (itemCounts[item.type] || 0) + 1;
        });

        // Get all declared has_* variables from the story
        const declaredVars = Array.from(varState._defaultGlobalVariables.keys());
        const hasItemVars = declaredVars.filter(varName => varName.startsWith('has_'));

        // Sync all has_* variables - set to true if NPC has item, false if not
        hasItemVars.forEach(varName => {
            // Extract item type from variable name (e.g., "has_lockpick" -> "lockpick")
            const itemType = varName.replace(/^has_/, '');
            const hasItem = (itemCounts[itemType] || 0) > 0;

            try {
                this.inkEngine.setVariable(varName, hasItem);
                console.log(`✅ Synced ${varName} = ${hasItem} for NPC ${npc.id} (${itemCounts[itemType] || 0} items)`);
            } catch (err) {
                console.warn(`⚠️ Could not sync ${varName}:`, err.message);
            }
        });

        // Also sync card protocol information
        this.syncCardProtocolsToInk();
    }

    /**
     * Sync RFID card protocol information to Ink variables
     * Allows Ink scripts to detect and respond to different card protocols
     */
    syncCardProtocolsToInk() {
        if (!this.inkEngine || !this.npc || !this.npc.itemsHeld) return;

        // Filter for keycards
        const keycards = this.npc.itemsHeld.filter(item => item.type === 'keycard');

        // Get RFID data manager if available
        const dataManager = window.rfidDataManager || (window.RFIDDataManager ? new window.RFIDDataManager() : null);

        keycards.forEach((card, index) => {
            const protocol = card.rfid_protocol || 'EM4100';
            const prefix = index === 0 ? 'card' : `card${index + 1}`;

            // Ensure rfid_data exists (generate if using card_id)
            if (!card.rfid_data && card.card_id && dataManager) {
                card.rfid_data = dataManager.generateRFIDDataFromCardId(card.card_id, protocol);
            }

            try {
                // Basic card info
                this.inkEngine.setVariable(`${prefix}_protocol`, protocol);
                this.inkEngine.setVariable(`${prefix}_name`, card.name || 'Card');
                this.inkEngine.setVariable(`${prefix}_card_id`, card.card_id || window.lockRef(card) || '');

                // Security level (low, medium, high)
                let security = 'low';
                if (protocol === 'MIFARE_Classic_Custom_Keys') {
                    security = 'medium';
                } else if (protocol === 'MIFARE_DESFire') {
                    security = 'high';
                }
                this.inkEngine.setVariable(`${prefix}_security`, security);

                // Simplified booleans for common checks
                const isInstantClone = protocol === 'EM4100' || protocol === 'MIFARE_Classic_Weak_Defaults';
                this.inkEngine.setVariable(`${prefix}_instant_clone`, isInstantClone);

                const needsAttack = protocol === 'MIFARE_Classic_Custom_Keys';
                this.inkEngine.setVariable(`${prefix}_needs_attack`, needsAttack);

                const isUIDOnly = protocol === 'MIFARE_DESFire';
                this.inkEngine.setVariable(`${prefix}_uid_only`, isUIDOnly);

                // Set UID or hex based on protocol
                if (card.rfid_data?.uid) {
                    this.inkEngine.setVariable(`${prefix}_uid`, card.rfid_data.uid);
                } else {
                    this.inkEngine.setVariable(`${prefix}_uid`, '');
                }

                if (card.rfid_data?.hex) {
                    this.inkEngine.setVariable(`${prefix}_hex`, card.rfid_data.hex);
                } else {
                    this.inkEngine.setVariable(`${prefix}_hex`, '');
                }

                console.log(`✅ Synced ${prefix}: ${protocol} (card_id: ${card.card_id || window.lockRef(card)})`);
            } catch (err) {
                console.warn(`⚠️ Could not sync card protocol for ${prefix}:`, err.message);
            }
        });
    }
    
    /**
     * Advance story by one line/choice
     */
    advance() {
        if (!this.inkEngine) {
            console.warn('⚠️ Ink engine not initialized');
            return false;
        }
        
        try {
            // Check if we can continue (this is a property, not a method)
            // The InkEngine.continue() method returns an object with { text, choices, tags, canContinue }
            const result = this.inkEngine.continue();
            
            // Extract data from result
            this.currentText = result.text || '';
            this.currentTags = result.tags || [];
            this.canContinue = result.canContinue || false;
            
            // Process tags for any side effects
            this.processTags(this.currentTags);
            
            console.log(`📖 Story advance: "${this.currentText}"`);
            
            // Update choices from the result
            this.currentChoices = result.choices || [];
            
            return true;
        } catch (error) {
            console.error('❌ Error advancing story:', error);
            return false;
        }
    }
    
    /**
     * Get current dialogue text
     * @returns {string} Current line of dialogue
     */
    getCurrentText() {
        return this.currentText.trim();
    }
    
    /**
     * Get available choices
     * @returns {Array} Array of choice objects
     */
    getChoices() {
        return this.currentChoices;
    }
    
    /**
     * Update choices from Ink
     */
    updateChoices() {
        if (!this.inkEngine) {
            this.currentChoices = [];
            return;
        }
        
        try {
            // currentChoices is a property, not a method
            const inkChoices = this.inkEngine.currentChoices || [];
            
            // Format choices for UI
            this.currentChoices = inkChoices.map((choice, idx) => ({
                text: choice.text || `Choice ${idx + 1}`,
                index: choice.index !== undefined ? choice.index : idx,
                tags: choice.tags || []
            }));
            
            console.log(`✅ Updated choices: ${this.currentChoices.length} available`);
        } catch (error) {
            console.error('❌ Error updating choices:', error);
            this.currentChoices = [];
        }
    }
    
    /**
     * Select a choice and advance story
     * @param {number} choiceIndex - Index of choice to select
     */
    selectChoice(choiceIndex) {
        if (!this.inkEngine) {
            console.warn('⚠️ Ink engine not initialized');
            return false;
        }
        
        try {
            // currentChoices is a property, not a method
            const choices = this.inkEngine.currentChoices;
            
            if (choiceIndex < 0 || choiceIndex >= choices.length) {
                console.warn(`⚠️ Invalid choice index: ${choiceIndex}`);
                return false;
            }
            
            // Select choice in Ink (use choose method, not chooseChoiceIndex)
            this.inkEngine.choose(choiceIndex);
            
            console.log(`✅ Choice selected: ${choices[choiceIndex].text}`);
            
            // Advance to next story line
            this.advance();
            
            return true;
        } catch (error) {
            console.error('❌ Error selecting choice:', error);
            return false;
        }
    }
    
    /**
     * Process Ink tags for game actions
     * @param {Array} tags - Tags from current line
     */
    processTags(tags) {
        if (!tags || tags.length === 0) return;
        
        tags.forEach(tag => {
            console.log(`🏷️ Processing tag: ${tag}`);
            
            // Tag format: "action:param1:param2"
            const [action, ...params] = tag.split(':');
            
            switch (action.trim().toLowerCase()) {
                case 'unlock_door':
                    this.handleUnlockDoor(params[0]);
                    break;

                case 'give_item':
                    this.handleGiveItem(params[0]);
                    break;

                case 'complete_objective':
                    this.handleCompleteObjective(params[0]);
                    break;

                case 'trigger_event':
                    this.handleTriggerEvent(params[0]);
                    break;

                // NPC Behavior tags
                case 'hostile':
                    this.handleHostile(params[0]);
                    break;

                case 'influence':
                    this.handleInfluence(params[0]);
                    break;

                case 'influence_gained':
                case 'rapport_gained':
                case 'respect_gained':
                case 'friendship_gained':
                    this.handleInfluenceGained(params[0], action);
                    break;

                case 'influence_lost':
                case 'rapport_lost':
                case 'respect_lost':
                case 'friendship_lost':
                    this.handleInfluenceLost(params[0], action);
                    break;

                case 'patrol_mode':
                    this.handlePatrolMode(params[0]);
                    break;

                case 'personal_space':
                    this.handlePersonalSpace(params[0]);
                    break;

                case 'end_conversation':
                    this.handleEndConversation();
                    break;

                default:
                    console.log(`⚠️ Unknown tag: ${action}`);
            }
        });
    }
    
    /**
     * Handle unlock_door tag
     * @param {string} doorId - Door to unlock
     */
    async handleUnlockDoor(doorId) {
        if (!doorId) return;

        console.log(`🔓 NPC unlocking door: ${doorId}`);

        // SECURITY: Call server API with NPC unlock method
        // Server will validate NPC has been encountered and has permission
        const apiClient = window.ApiClient || window.APIClient;
        const gameId = window.breakEscapeConfig?.gameId;

        if (!apiClient || !gameId) {
            console.error('ApiClient or gameId not available for NPC unlock');
            window.gameAlert('Failed to unlock door', 'error', 'Error', 3000);
            return;
        }

        try {
            const response = await apiClient.unlock('door', doorId, this.npc.id, 'npc');

            if (response.success) {
                console.log(`✅ NPC ${this.npc.id} successfully unlocked door ${doorId}`);
                window.gameAlert(`Door unlocked!`, 'success', 'Access Granted', 3000);

                // Trigger door unlock visual update for ALL door sprites leading to this room
                // This handles the case where the room is already loaded
                const doorSprites = this.findAllDoorSprites(doorId);
                if (doorSprites.length > 0 && window.unlockDoor) {
                    console.log(`📍 Found ${doorSprites.length} door sprite(s) to update`);
                    doorSprites.forEach(doorSprite => {
                        window.unlockDoor(doorSprite, response.roomData);
                    });
                } else {
                    console.log(`📍 No door sprites found for ${doorId}, will be unlocked when room loads`);
                }
            } else {
                console.error('NPC unlock failed:', response);
                window.gameAlert('Failed to unlock door', 'error', 'Error', 3000);
            }
        } catch (error) {
            console.error('NPC unlock error:', error);
            window.gameAlert('Failed to unlock door', 'error', 'Error', 3000);
        }
    }

    /**
     * Find all door sprites leading to the given room ID
     * @param {string} roomId - Room ID to find doors for
     * @returns {Array} Array of door sprites leading to the room
     */
    findAllDoorSprites(roomId) {
        // Door sprites are stored in window.rooms[sourceRoomId].doorSprites
        // Find all doors from any room that lead to the target room
        if (!window.rooms) return [];

        const doors = [];
        
        // Iterate through all rooms
        Object.keys(window.rooms).forEach(sourceRoomId => {
            const room = window.rooms[sourceRoomId];
            if (room.doorSprites && Array.isArray(room.doorSprites)) {
                // Find doors in this room that lead to the target room
                const matchingDoors = room.doorSprites.filter(doorSprite =>
                    doorSprite.doorProperties &&
                    doorSprite.doorProperties.connectedRoom === roomId
                );
                doors.push(...matchingDoors);
            }
        });

        console.log(`🚪 Found ${doors.length} door sprite(s) leading to ${roomId}:`, doors);
        return doors;
    }

    /**
     * Find door sprite by room ID (legacy, returns first match)
     * @param {string} roomId - Room ID to find door for
     */
    findDoorSprite(roomId) {
        const doors = this.findAllDoorSprites(roomId);
        return doors.length > 0 ? doors[0] : null;
    }
    
    /**
     * Handle give_item tag
     * @param {string} itemId - Item to give
     */
    handleGiveItem(itemId) {
        if (!itemId) return;
        
        console.log(`📦 Giving item: ${itemId}`);
        
        const event = new CustomEvent('ink-action', {
            detail: {
                action: 'give_item',
                itemId: itemId
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Handle complete_objective tag
     * @param {string} objectiveId - Objective to complete
     */
    handleCompleteObjective(objectiveId) {
        if (!objectiveId) return;
        
        console.log(`✅ Completing objective: ${objectiveId}`);
        
        const event = new CustomEvent('ink-action', {
            detail: {
                action: 'complete_objective',
                objectiveId: objectiveId
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Handle trigger_event tag
     * @param {string} eventName - Event to trigger
     */
    handleTriggerEvent(eventName) {
        if (!eventName) return;

        console.log(`🎯 Triggering event: ${eventName}`);

        const event = new CustomEvent('ink-action', {
            detail: {
                action: 'trigger_event',
                eventName: eventName
            }
        });
        window.dispatchEvent(event);
    }

    // ===== NPC BEHAVIOR TAG HANDLERS =====

    /**
     * Handle hostile tag - set NPC hostile state
     * Tags: #hostile (true), #hostile:false, #hostile:true
     * @param {string} value - Hostile state (optional, defaults to true)
     */
    handleHostile(value) {
        if (!this.npcId || !window.npcGameBridge) return;

        // Default to true if no value provided, otherwise parse the value
        const hostile = value === undefined || value === '' || value === 'true';

        window.npcGameBridge.setNPCHostile(this.npcId, hostile);
        console.log(`🔴 Set NPC ${this.npcId} hostile: ${hostile}`);
    }

    /**
     * Handle influence tag - set NPC influence score
     * Tag: #influence:25 or #influence:-50
     * @param {string} value - Influence value
     */
    handleInfluence(value) {
        if (!this.npcId || !window.npcGameBridge) return;

        const influence = parseInt(value, 10);
        if (isNaN(influence)) {
            console.warn(`⚠️ Invalid influence value: ${value}`);
            return;
        }

        window.npcGameBridge.setNPCInfluence(this.npcId, influence);
        console.log(`💯 Set NPC ${this.npcId} influence: ${influence}`);
    }

    /**
     * Handle influence gained tag - show visual feedback for positive influence change
     * Tags: #influence_gained:5, #rapport_gained:3, #respect_gained:10, #friendship_gained:8
     * @param {string} value - Amount of influence gained
     * @param {string} type - Type of influence (influence_gained, rapport_gained, etc.)
     */
    handleInfluenceGained(value, type) {
        const amount = parseInt(value, 10);
        if (isNaN(amount) || amount <= 0) {
            console.warn(`⚠️ Invalid influence gained value: ${value}`);
            return;
        }

        // Dispatch event for UI to show visual feedback
        const event = new CustomEvent('npc-influence-change', {
            detail: {
                npcId: this.npc.id,
                type: type.replace('_gained', ''),
                change: amount,
                direction: 'gained',
                message: this.getInfluenceMessage(type, amount, 'gained')
            }
        });
        window.dispatchEvent(event);

        console.log(`📈 ${this.npc.id} ${type}: +${amount}`);
    }

    /**
     * Handle influence lost tag - show visual feedback for negative influence change
     * Tags: #influence_lost:5, #rapport_lost:3, #respect_lost:10, #friendship_lost:8
     * @param {string} value - Amount of influence lost
     * @param {string} type - Type of influence (influence_lost, rapport_lost, etc.)
     */
    handleInfluenceLost(value, type) {
        const amount = parseInt(value, 10);
        if (isNaN(amount) || amount <= 0) {
            console.warn(`⚠️ Invalid influence lost value: ${value}`);
            return;
        }

        // Dispatch event for UI to show visual feedback
        const event = new CustomEvent('npc-influence-change', {
            detail: {
                npcId: this.npc.id,
                type: type.replace('_lost', ''),
                change: -amount,
                direction: 'lost',
                message: this.getInfluenceMessage(type, amount, 'lost')
            }
        });
        window.dispatchEvent(event);

        console.log(`📉 ${this.npc.id} ${type}: -${amount}`);
    }

    /**
     * Get appropriate message for influence change
     * @param {string} type - Type of influence change
     * @param {number} amount - Amount changed
     * @param {string} direction - 'gained' or 'lost'
     * @returns {string} Message to display
     */
    getInfluenceMessage(type, amount, direction) {
        const baseType = type.replace('_gained', '').replace('_lost', '');

        // Unified influence messages based on NPC and amount
        const npcId = this.npc.id;

        if (baseType === 'influence') {
            if (direction === 'gained') {
                if (npcId === 'dr_chen') {
                    return amount >= 10 ? 'Dr. Chen really likes that' : 'Dr. Chen appreciates that';
                } else if (npcId === 'director_netherton') {
                    return amount >= 10 ? 'Director Netherton is impressed' : 'Director Netherton approves';
                } else if (npcId === 'haxolottle') {
                    return amount >= 10 ? 'Haxolottle really appreciates that' : 'Haxolottle likes that';
                }
                return amount >= 10 ? 'Influence significantly increased' : 'Influence increased';
            } else {
                if (npcId === 'dr_chen') {
                    return amount >= 10 ? 'Dr. Chen is disappointed' : 'Dr. Chen seems uncertain';
                } else if (npcId === 'director_netherton') {
                    return amount >= 10 ? 'Director Netherton is displeased' : 'Director Netherton notes this';
                } else if (npcId === 'haxolottle') {
                    return amount >= 10 ? 'Haxolottle is hurt' : 'Haxolottle seems disappointed';
                }
                return amount >= 10 ? 'Influence significantly decreased' : 'Influence decreased';
            }
        }

        // Legacy support for old tag types (if any remain)
        const legacyMessages = {
            rapport: {
                gained: amount >= 10 ? 'Dr. Chen likes that' : 'Dr. Chen appreciates that',
                lost: amount >= 10 ? 'Dr. Chen is disappointed' : 'Dr. Chen is uncertain'
            },
            respect: {
                gained: amount >= 10 ? 'Director Netherton is impressed' : 'Director Netherton approves',
                lost: amount >= 10 ? 'Director Netherton is displeased' : 'Director Netherton notes this'
            },
            friendship: {
                gained: amount >= 10 ? 'Haxolottle really appreciates that' : 'Haxolottle likes that',
                lost: amount >= 10 ? 'Haxolottle is hurt' : 'Haxolottle seems disappointed'
            }
        };

        return legacyMessages[baseType]?.[direction] || `${baseType} ${direction}`;
    }

    /**
     * Handle patrol_mode tag - toggle NPC patrol behavior
     * Tags: #patrol_mode:on, #patrol_mode:off
     * @param {string} value - 'on' or 'off'
     */
    handlePatrolMode(value) {
        if (!this.npcId || !window.npcGameBridge) return;

        const enabled = value === 'on' || value === 'true';

        window.npcGameBridge.setNPCPatrol(this.npcId, enabled);
        console.log(`🚶 Set NPC ${this.npcId} patrol: ${enabled}`);
    }

    /**
     * Handle personal_space tag - set NPC personal space distance
     * Tag: #personal_space:64 (pixels)
     * @param {string} value - Distance in pixels
     */
    handlePersonalSpace(value) {
        if (!this.npcId || !window.npcGameBridge) return;

        const distance = parseInt(value, 10);
        if (isNaN(distance) || distance < 0) {
            console.warn(`⚠️ Invalid personal space distance: ${value}`);
            return;
        }

        window.npcGameBridge.setNPCPersonalSpace(this.npcId, distance);
        console.log(`↔️ Set NPC ${this.npcId} personal space: ${distance}px`);
    }

    /**
     * Handle end_conversation tag - signal conversation should close
     * Tag: #end_conversation
     * The ink script has already diverted to mission_hub, preserving state.
     * This signals the UI layer to close the conversation window.
     * Next time player talks to this NPC, it will resume from mission_hub.
     */
    handleEndConversation() {
        console.log(`👋 End conversation for ${this.npc.id} - conversation state preserved at mission_hub`);

        // Dispatch event for UI layer to close the conversation window
        const event = new CustomEvent('npc-conversation-ended', {
            detail: {
                npcId: this.npc.id,
                preservedAtHub: true
            }
        });
        window.dispatchEvent(event);

        console.log(`✅ Conversation ended, will resume from mission_hub on next interaction`);
    }

    /**
     * Check if conversation can continue
     * @returns {boolean} True if more dialogue/choices available
     */
    hasMore() {
        if (!this.inkEngine) return false;
        
        // Both canContinue and currentChoices are properties, not methods
        return this.canContinue || 
               (this.currentChoices && this.currentChoices.length > 0);
    }
    
    /**
     * End conversation and cleanup
     */
    end() {
        try {
            // Remove event listener
            if (window.eventDispatcher && this._itemsChangedListener) {
                window.eventDispatcher.off('npc_items_changed', this._itemsChangedListener);
            }
            
            if (this.inkEngine) {
                // Don't destroy - keep for history/dual identity
                this.inkEngine = null;
            }
            
            this.isActive = false;
            this.currentText = '';
            this.currentChoices = [];
            
            console.log(`✅ Conversation ended for ${this.npc.id}`);
        } catch (error) {
            console.error('❌ Error ending conversation:', error);
        }
    }
    
    /**
     * Get conversation metadata
     * @returns {Object} Metadata about conversation state
     */
    getMetadata() {
        return {
            npcId: this.npc.id,
            isActive: this.isActive,
            canContinue: this.canContinue,
            choicesAvailable: this.currentChoices.length,
            currentTags: this.currentTags
        };
    }
}
