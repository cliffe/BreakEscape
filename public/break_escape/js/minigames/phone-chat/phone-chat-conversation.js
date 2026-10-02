/**
 * PhoneChatConversation - Ink Story Management
 * 
 * Manages Ink story execution for NPC conversations, interfacing with InkEngine.
 * Handles story loading, continuation, choices, and state management.
 * 
 * @module phone-chat-conversation
 */

import { phoneStepLines } from './phone-chat-speaker.js';

export default class PhoneChatConversation {
    /**
     * Create a PhoneChatConversation instance
     * @param {string} npcId - NPC identifier
     * @param {Object} npcManager - NPCManager instance
     * @param {Object} inkEngine - InkEngine instance
     */
    constructor(npcId, npcManager, inkEngine) {
        if (!npcId) {
            throw new Error('PhoneChatConversation requires an npcId');
        }
        
        if (!npcManager) {
            throw new Error('PhoneChatConversation requires an npcManager instance');
        }
        
        if (!inkEngine) {
            throw new Error('PhoneChatConversation requires an inkEngine instance');
        }
        
        this.npcId = npcId;
        this.npcManager = npcManager;
        this.engine = inkEngine;
        this.storyLoaded = false;
        this.storyEnded = false;
        // Set false for throwaway preload runs so ink writes don't leak into window.gameState.globalVariables
        this.observeGlobals = true;
        
        console.log(`💬 PhoneChatConversation initialized for NPC: ${npcId}`);
    }
    
    /**
     * Load the Ink story for this NPC
     * @param {string|Object} storyPathOrJSON - Path to Ink JSON file OR direct JSON object
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadStory(storyPathOrJSON) {
        if (!storyPathOrJSON) {
            console.error('❌ No story path or JSON provided');
            return false;
        }
        
        try {
            let storyJson;
            
            // Check if we received a JSON object directly
            if (typeof storyPathOrJSON === 'object') {
                console.log(`📖 Loading story from inline JSON for ${this.npcId}`);
                storyJson = storyPathOrJSON;
            } else {
                // It's a path, fetch the JSON
                console.log(`📖 Loading story from: ${storyPathOrJSON}`);
                
                const response = await fetch(storyPathOrJSON);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                storyJson = await response.json();
            }
            
            // Load into InkEngine
            this.engine.loadStory(storyJson);
            
            // Note: We don't set npc_name variable here because it causes issues with state serialization.
            // The NPC display name is handled in the UI layer instead.

            this.storyLoaded = true;
            this.storyEnded = false;

            // Set up external functions
            this.setupExternalFunctions();

            // Sync NPC items to Ink variables
            this.syncItemsToInk();
            
            // Set up event listener for item changes
            if (window.eventDispatcher) {
                this._itemsChangedListener = (data) => {
                    if (data.npcId === this.npcId) {
                        this.syncItemsToInk();
                    }
                };
                window.eventDispatcher.on('npc_items_changed', this._itemsChangedListener);
            }
            
            // Set up global variable observer to sync changes back to window.gameState
            // This is critical for cross-NPC variable sharing
            if (window.npcConversationStateManager && this.engine.story) {
                window.npcConversationStateManager.discoverGlobalVariables(this.engine.story);
                window.npcConversationStateManager.syncGlobalVariablesToStory(this.engine.story);
                if (this.observeGlobals) {
                    window.npcConversationStateManager.observeGlobalVariableChanges(this.engine.story, this.npcId);
                    console.log(`🌐 Global variable observer set up for ${this.npcId}`);
                }
            }
            
            console.log(`✅ Story loaded successfully for ${this.npcId}`);
            
            return true;
        } catch (error) {
            console.error(`❌ Error loading story for ${this.npcId}:`, error);
            this.storyLoaded = false;
            return false;
        }
    }
    
    /**
     * Set up external functions for Ink story
     * These allow Ink to call game functions and get dynamic values
     */
    setupExternalFunctions() {
        if (!this.engine || !this.engine.story) return;

        // Bind EXTERNAL functions that return values
        // These are called from ink scripts with parentheses: {player_name()}

        // Player name - return player's agent name or default
        this.engine.bindExternalFunction('player_name', () => {
            return window.gameState?.playerName || 'Agent';
        });

        // Current mission ID - return active mission identifier
        this.engine.bindExternalFunction('current_mission_id', () => {
            return window.gameState?.currentMissionId || 'mission_001';
        });

        // NPC location - where the conversation is happening
        this.engine.bindExternalFunction('npc_location', () => {
            const npc = this.npcManager.getNPC(this.npcId);
            // Return location based on NPC or default
            if (this.npcId === 'dr_chen' || npc?.id === 'dr_chen') {
                return window.gameState?.npcLocation || 'lab';
            } else if (this.npcId === 'director_netherton' || npc?.id === 'director_netherton') {
                return window.gameState?.npcLocation || 'office';
            } else if (this.npcId === 'haxolottle' || npc?.id === 'haxolottle') {
                return window.gameState?.npcLocation || 'handler_station';
            }
            return window.gameState?.npcLocation || 'safehouse';
        });

        // Mission phase - what part of the mission we're in
        this.engine.bindExternalFunction('mission_phase', () => {
            return window.gameState?.missionPhase || 'downtime';
        });

        // Operational stress level - for handler conversations
        this.engine.bindExternalFunction('operational_stress_level', () => {
            return window.gameState?.operationalStressLevel || 'low';
        });

        // Equipment status - for Dr. Chen conversations
        this.engine.bindExternalFunction('equipment_status', () => {
            return window.gameState?.equipmentStatus || 'nominal';
        });

        console.log(`✅ External functions bound for ${this.npcId}`);
    }

    /**
     * Navigate to a specific knot in the story
     * @param {string} knotName - Name of the knot to navigate to
     * @returns {boolean} True if navigation successful
     */
    goToKnot(knotName) {
        if (!this.storyLoaded) {
            console.error('❌ Cannot navigate to knot: story not loaded');
            return false;
        }
        
        if (!knotName) {
            console.warn('⚠️ No knot name provided');
            return false;
        }
        
        try {
            this.engine.goToKnot(knotName);
            
            // Update NPC's current knot in manager
            const npc = this.npcManager.getNPC(this.npcId);
            if (npc) {
                npc.currentKnot = knotName;
                // Remembered separately so a later external change to currentKnot
                // (npc-manager setting the NPC's next knot) can be told apart
                npc.lastEnteredKnot = knotName;
            }
            
            console.log(`🎯 Navigated to knot: ${knotName}`);
            return true;
        } catch (error) {
            console.error(`❌ Error navigating to knot ${knotName}:`, error);
            return false;
        }
    }

    /**
     * The knot to enter a contact at for its first conversation. A scenario may set an
     * NPC's currentKnot to its intro knot (m01, m02 and m04 HaX: "first_call") while the
     * ink's own `start` knot is what records that the intro has happened (m02:
     * `{first_contact: ~ first_contact = false -> first_call}`). Entering the intro
     * directly skips that, so a later restart at `start` replays the intro.
     *
     * If running `start` produces exactly what running `knot` does (same lines, tags and
     * choices), the two are the same entry and `start` is used, so its routing state is
     * set. Otherwise the scenario's knot wins. Both runs are dry runs: the state is put
     * back and the global observer is detached while they run.
     * @param {string} knot - the knot the caller would enter at
     * @returns {string} 'start' or knot
     */
    resolveEntryKnot(knot) {
        const story = this.engine?.story;
        if (!this.storyLoaded || !story || !knot || knot === 'start') return knot;
        const saved = story.state.ToJson();
        const observer = story.variablesState.variableChangedEvent;
        story.variablesState.variableChangedEvent = null;
        const run = name => {
            story.state.LoadJson(saved);
            story.ChoosePathString(name);
            const steps = PhoneChatConversation.collectSteps(story);
            return { steps, choices: (story.currentChoices || []).map(c => c.text) };
        };
        try {
            const viaStart = run('start');
            const direct = run(knot);
            const same = viaStart.steps.length === direct.steps.length &&
                viaStart.steps.every((st, i) => PhoneChatConversation.sameStep(st, direct.steps[i])) &&
                JSON.stringify(viaStart.choices) === JSON.stringify(direct.choices);
            return same ? 'start' : knot;
        } catch (e) {
            return knot;     // no `start` knot, or it errors: keep the scenario's knot
        } finally {
            try { story.state.LoadJson(saved); } catch (e) { /* fresh story */ }
            story.variablesState.variableChangedEvent = observer;
        }
    }

    /**
     * goToKnot for a first entry (preload, first open): see resolveEntryKnot.
     * @returns {boolean} True if navigation successful
     */
    goToEntryKnot(knotName) {
        const entry = this.resolveEntryKnot(knotName);
        if (entry !== knotName) {
            console.log(`🚪 ${this.npcId}: entering via "${entry}" (same opening as "${knotName}")`);
        }
        return this.goToKnot(entry);
    }

    /**
     * Re-talk after the story ran to DONE/END: give the restored (position-less) story
     * somewhere to start. A knot the scenario set on the NPC since the last visit wins;
     * otherwise 'start' (an NPC whose currentKnot is just the knot it was last in, e.g. a
     * first_call intro, would replay that intro every time); otherwise currentKnot.
     * @returns {boolean} True if navigation succeeded
     */
    restartAfterEnd() {
        const npc = this.npcManager.getNPC(this.npcId);
        const current = npc?.currentKnot;
        const pending = current && current !== npc.lastEnteredKnot ? current : null;
        for (const knot of [pending, 'start', current]) {
            if (knot && this.goToKnot(knot)) {
                this.storyEnded = false;
                return true;
            }
        }
        return false;
    }
    
    /**
     * Sync NPC's held items to Ink variables
     * Sets has_<type> based on itemsHeld array
     * IMPORTANT: Also sets variables to false for items NOT in inventory
     */
    syncItemsToInk() {
        if (!this.engine || !this.engine.story) return;
        
        const npc = this.npcManager.getNPC(this.npcId);
        if (!npc || !npc.itemsHeld) return;
        
        const varState = this.engine.story.variablesState;
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
                this.engine.setVariable(varName, hasItem);
                console.log(`✅ Synced ${varName} = ${hasItem} for NPC ${npc.id} (${itemCounts[itemType] || 0} items)`);
            } catch (err) {
                console.warn(`⚠️ Could not sync ${varName}:`, err.message);
            }
        });
    }
    
    /**
     * Continue the story and get the next text/choices
     * @returns {Object} Story result { text, choices, tags, canContinue, hasEnded }
     */
    continue() {
        if (!this.storyLoaded) {
            console.error('❌ Cannot continue: story not loaded');
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
        
        if (this.storyEnded) {
            console.log('ℹ️ Story has ended');
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
        
        try {
            const result = this.engine.continue();

            // Process tags for side effects (like #exit_conversation)
            if (result.tags && result.tags.length > 0) {
                this.processTags(result.tags);
            }

            // Check if story has ended (no more content and no choices)
            if (!result.canContinue && (!result.choices || result.choices.length === 0)) {
                this.storyEnded = true;
                result.hasEnded = true;
                console.log('🏁 Story has ended');
            } else {
                result.hasEnded = false;
            }

            return result;
        } catch (error) {
            console.error('❌ Error continuing story:', error);
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
    }

    /**
     * Process conversation-specific Ink tags (like #exit_conversation)
     * Note: Game action tags (#set_global, #unlock_door, etc.) are processed
     * later by processGameActionTags in phone-chat-minigame.js
     * @param {Array} tags - Tags from current line
     */
    processTags(tags) {
        if (!tags || tags.length === 0) return;

        tags.forEach(tag => {
            // Tag format: "action:param1:param2"
            const [action, ...params] = tag.split(':');

            switch (action.trim().toLowerCase()) {
                case 'end_conversation':
                    // end_conversation: Ink-style graceful close (story already at hub).
                    // Dispatches npc-conversation-ended so the minigame layer closes cleanly.
                    console.log(`🏷️ Processing conversation tag: ${tag}`);
                    this.handleEndConversation();
                    break;

                // NOTE: exit_conversation is intentionally NOT handled here.
                // Both person-chat-minigame.js and phone-chat-minigame.js detect it in
                // their own shouldExit checks and close the minigame themselves.
                // Handling it here would fire endMinigame prematurely (mid-makeChoice),
                // tearing down the UI before the NPC's farewell text is shown.

                default:
                    // Other tags are game action tags - will be processed by minigame layer
                    // Don't log them here to avoid confusion
                    break;
            }
        });
    }

    /**
     * Handle end_conversation tag - signal conversation should close
     * Tag: #end_conversation
     * The ink script has already diverted to mission_hub, preserving state.
     * This signals the UI layer to close the conversation window.
     * Next time player talks to this NPC, it will resume from mission_hub.
     */
    handleEndConversation() {
        console.log(`👋 End conversation for ${this.npcId} - conversation state preserved at mission_hub`);

        // Dispatch event for UI layer to close the conversation window
        const event = new CustomEvent('npc-conversation-ended', {
            detail: {
                npcId: this.npcId,
                preservedAtHub: true
            }
        });
        window.dispatchEvent(event);

        console.log(`✅ Conversation ended, will resume from mission_hub on next interaction`);
    }
    
    /**
     * Make a choice and continue the story
     * @param {number} choiceIndex - Index of the choice to make
     * @returns {Object} Story result after choice
     */
    makeChoice(choiceIndex) {
        if (!this.storyLoaded) {
            console.error('❌ Cannot make choice: story not loaded');
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
        
        if (this.storyEnded) {
            console.log('ℹ️ Cannot make choice: story has ended');
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
        
        try {
            // Make the choice
            this.engine.choose(choiceIndex);
            console.log(`👆 Made choice ${choiceIndex}`);
            
            // Continue after choice
            return this.continue();
        } catch (error) {
            console.error(`❌ Error making choice ${choiceIndex}:`, error);
            return { text: '', choices: [], tags: [], canContinue: false, hasEnded: true };
        }
    }
    
    /**
     * Get current state without continuing (for reopening conversations)
     * @returns {Object} Current story state { choices, canContinue, hasEnded }
     */
    getCurrentState() {
        if (!this.storyLoaded) {
            console.error('❌ Cannot get state: story not loaded');
            return { choices: [], canContinue: false, hasEnded: true };
        }
        
        if (this.storyEnded) {
            return { choices: [], canContinue: false, hasEnded: true };
        }
        
        try {
            // Get current choices without continuing
            const choices = this.engine.currentChoices || [];
            const canContinue = this.engine.story?.canContinue || false;
            const hasEnded = !canContinue && choices.length === 0;
            
            return { choices, canContinue, hasEnded };
        } catch (error) {
            console.error('❌ Error getting current state:', error);
            return { choices: [], canContinue: false, hasEnded: true };
        }
    }
    
    /**
     * Get an Ink variable value
     * @param {string} name - Variable name
     * @returns {*} Variable value or null
     */
    getVariable(name) {
        if (!this.storyLoaded) {
            console.warn('⚠️ Cannot get variable: story not loaded');
            return null;
        }
        
        try {
            return this.engine.getVariable(name);
        } catch (error) {
            console.error(`❌ Error getting variable ${name}:`, error);
            return null;
        }
    }
    
    /**
     * Set an Ink variable value
     * @param {string} name - Variable name
     * @param {*} value - Variable value
     * @returns {boolean} True if set successfully
     */
    setVariable(name, value) {
        if (!this.storyLoaded) {
            console.warn('⚠️ Cannot set variable: story not loaded');
            return false;
        }
        
        try {
            this.engine.setVariable(name, value);
            console.log(`✅ Set variable ${name} = ${value}`);
            return true;
        } catch (error) {
            console.error(`❌ Error setting variable ${name}:`, error);
            return false;
        }
    }
    
    /**
     * Save the current story state
     * @returns {string|null} Serialized state or null on error
     */
    saveState() {
        if (!this.storyLoaded) {
            console.warn('⚠️ Cannot save state: story not loaded');
            return null;
        }
        
        try {
            const state = this.engine.story.state.ToJson();
            console.log('💾 Saved story state');
            return state;
        } catch (error) {
            console.error('❌ Error saving state:', error);
            return null;
        }
    }
    
    /**
     * Restore a previously saved story state
     * @param {string} state - Serialized state from saveState()
     * @returns {boolean} True if restored successfully
     */
    restoreState(state) {
        if (!this.storyLoaded) {
            console.warn('⚠️ Cannot restore state: story not loaded');
            return false;
        }
        
        if (!state) {
            console.warn('⚠️ No state provided');
            return false;
        }
        
        try {
            this.engine.story.state.LoadJson(state);
            this.storyEnded = false; // Reset ended flag
            console.log('📂 Restored story state');
            return true;
        } catch (error) {
            console.error('❌ Error restoring state:', error);
            return false;
        }
    }
    
    /**
     * Check if the story has ended
     * @returns {boolean} True if story has ended
     */
    hasEnded() {
        return this.storyEnded;
    }

    /**
     * Reopening a thread whose story was restored (E10/E13).
     *
     * A restored story's choices were evaluated with the globals of the time it was
     * saved. This syncs today's globals in; if any the story holds changed and it is
     * resting on choices, it re-runs the knot that owns the first choice (the
     * missions' resting knots re-check state at the top and divert), so the choices
     * and any new branch reflect the change.
     *
     * What the re-run prints is split in two. It is compared, step by step, with a
     * baseline run of the same knot from the same saved state under the OLD globals:
     * the common prefix is the knot's leading output that the player has already seen
     * (text and tags), and is dropped. From the first step that differs, the output is
     * new and is returned to be shown, with its tags, as a normal continue would.
     * The baseline runs with the global observer detached, so it writes nothing.
     *
     * @param {Function} syncGlobals - (story) => void, writes the current globals in
     * @returns {{ renavigated: boolean, knot?: string, messages?: string[], tags?: string[],
     *             replayedSteps?: number, result?: Object }}
     */
    reopenWithCurrentGlobals(syncGlobals) {
        const story = this.engine?.story;
        if (!this.storyLoaded || !story) return { renavigated: false };

        const savedState = story.state.ToJson();           // as saved: old globals
        const gameGlobals = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {};
        const globalsBefore = {};
        Object.keys(gameGlobals).forEach(name => {
            if (story.variablesState.GlobalVariableExistsWithName(name)) {
                globalsBefore[name] = story.variablesState[name];
            }
        });
        if (typeof syncGlobals === 'function') syncGlobals(story);
        const globalsChanged = Object.keys(globalsBefore)
            .some(name => story.variablesState[name] !== globalsBefore[name]);
        if (!globalsChanged || !(story.currentChoices?.length > 0)) {
            return { renavigated: false };
        }

        const firstChoice = story.currentChoices[0];
        const sourcePath = firstChoice.sourcePath ||
            (firstChoice._sourcePath && firstChoice._sourcePath.toString());
        const knot = sourcePath ? sourcePath.split('.')[0] : null;
        if (!knot) return { renavigated: false };

        const syncedState = story.state.ToJson();          // today's globals, not yet re-run

        // Baseline: the same knot from the saved state with the old globals
        let baseline = null;
        const observer = story.variablesState.variableChangedEvent;
        story.variablesState.variableChangedEvent = null;
        try {
            story.state.LoadJson(savedState);
            story.ChoosePathString(knot);
            baseline = PhoneChatConversation.collectSteps(story);
        } catch (e) {
            console.warn(`⚠️ Baseline run of "${knot}" failed; showing the whole re-run:`, e.message);
            baseline = [];
        } finally {
            story.state.LoadJson(syncedState);
            story.variablesState.variableChangedEvent = observer;
        }

        // The real re-run, with the observer attached as for any continue
        let steps;
        try {
            story.ChoosePathString(knot);
            steps = PhoneChatConversation.collectSteps(story);
        } catch (e) {
            console.warn(`⚠️ Could not re-navigate to "${knot}":`, e.message);
            try { story.state.LoadJson(syncedState); } catch (e2) { /* keep what we have */ }
            return { renavigated: false };
        }

        let replayed = 0;
        while (replayed < steps.length && replayed < baseline.length &&
               PhoneChatConversation.sameStep(steps[replayed], baseline[replayed])) {
            replayed++;
        }
        const fresh = steps.slice(replayed);
        const messages = [];
        const tags = [];
        fresh.forEach(step => {
            tags.push(...step.tags);
            messages.push(...phoneStepLines(step.text, step.tags));
        });
        if (tags.length > 0) this.processTags(tags);

        const choices = (story.currentChoices || []).map((c, i) => ({ text: c.text, index: i }));
        const hasEnded = !story.canContinue && choices.length === 0;
        if (hasEnded) this.storyEnded = true;
        console.log(`🔄 Re-navigated to "${knot}" with updated globals: ${replayed} step(s) already seen, ${fresh.length} new`);
        return {
            renavigated: true,
            knot,
            messages,
            tags,
            replayedSteps: replayed,
            result: { text: '', choices, tags, canContinue: false, hasEnded }
        };
    }

    /**
     * Preload a contact's opening into its thread, so the phone shows a waiting message
     * before the player opens it. Shared by the phone-chat minigame and the inventory
     * (when the phone is first added), so both record the same thing in the same order.
     *
     * A dry run: the global observer is off, and the intro's synced-global writes and
     * game-action tags are kept on the NPC (deferredGlobals / deferredTags) to apply
     * when the player first opens the thread. Runs the whole opening up to its choices
     * (or end), adds every line as a preloaded message, and saves the story position.
     * Only for a contact with no thread yet.
     * @param {Object} npc - the NPC entry
     * @param {Object} npcManager
     * @param {Object} inkEngine - an InkEngine to run it in (its story is replaced)
     * @returns {Promise<number>} lines preloaded
     */
    static async preloadOpening(npc, npcManager, inkEngine) {
        if (!npc || npcManager.getConversationHistory(npc.id).length > 0) return 0;
        if (!npc.storyPath && !npc.storyJSON) return 0;

        const tempConversation = new PhoneChatConversation(npc.id, npcManager, inkEngine);
        tempConversation.observeGlobals = false;

        // Load from storyJSON (pre-cached) or via Rails API
        let storySource = npc.storyJSON;
        if (!storySource && npc.storyPath) {
            const gameId = window.breakEscapeConfig?.gameId;
            if (gameId) storySource = `/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(npc.id)}`;
        }
        if (!storySource || !(await tempConversation.loadStory(storySource))) return 0;

        // After a reload: restore this contact's own ink flags (e.g. first_contact)
        // so its start knot skips an intro the player already read
        window.npcConversationStateManager?.applySavedInkVariables?.(npc.id, tempConversation.engine?.story);

        tempConversation.goToEntryKnot(npc.currentKnot || 'start');

        // Accumulate all intro messages and game action tags until we hit choices or end
        const allMessages = [];
        const allTags = [];
        for (let guard = 0; guard < 500; guard++) {
            const result = tempConversation.continue();
            allMessages.push(...phoneStepLines(result.text, result.tags));
            if (result.tags && result.tags.length > 0) allTags.push(...result.tags);
            if (result.hasEnded || (result.choices && result.choices.length > 0) || !result.canContinue) break;
        }
        if (allMessages.length === 0) return 0;

        allMessages.forEach(message => {
            npcManager.addMessage(npc.id, 'npc', message.trim(), {
                preloaded: true,
                timestamp: Date.now() - 3600000 // 1 hour ago
            });
        });

        // Save the story state after preloading, so the intro doesn't replay when opened
        npc.storyState = tempConversation.saveState();

        // The observer was off, so synced globals the intro assigned (~ x = true) were
        // not written. Keep them, and the tags, for when the player first opens the chat.
        const preloadStory = tempConversation.engine?.story;
        const globals = window.gameState?.globalVariables;
        if (preloadStory?.variablesState && globals) {
            const changed = {};
            Object.keys(globals).forEach(name => {
                if (!preloadStory.variablesState.GlobalVariableExistsWithName(name)) return;
                const value = preloadStory.variablesState[name];
                if (value !== globals[name]) changed[name] = value;
            });
            if (Object.keys(changed).length > 0) npc.deferredGlobals = changed;
        }
        if (allTags.length > 0) npc.deferredTags = allTags;

        console.log(`📝 Preloaded ${allMessages.length} intro message(s) for ${npc.id}`);
        return allMessages.length;
    }

    /**
     * Run the story to its next choice point, one line per step.
     * @returns {Array<{text: string, tags: string[]}>}
     */
    static collectSteps(story, limit = 500) {
        const steps = [];
        while (story.canContinue && steps.length < limit) {
            const text = story.Continue() || '';
            steps.push({ text, tags: [...(story.currentTags || [])] });
        }
        return steps;
    }

    static sameStep(a, b) {
        return a.text.trim() === b.text.trim() &&
            a.tags.length === b.tags.length && a.tags.every((t, i) => t === b.tags[i]);
    }

    /**
     * Reset the story (reload from beginning)
     * @param {string} storyPath - Path to Ink JSON file
     * @returns {Promise<boolean>} True if reset successfully
     */
    async reset(storyPath) {
        console.log('🔄 Resetting conversation...');
        this.storyLoaded = false;
        this.storyEnded = false;
        return await this.loadStory(storyPath);
    }
    
    /**
     * Get all available tags from the current story state
     * @returns {Array<string>} Array of tag strings
     */
    getCurrentTags() {
        if (!this.storyLoaded) {
            return [];
        }
        
        try {
            return this.engine.story.currentTags || [];
        } catch (error) {
            console.error('❌ Error getting tags:', error);
            return [];
        }
    }
    
    /**
     * Clean up resources (event listeners, etc.)
     */
    cleanup() {
        // Remove event listener
        if (window.eventDispatcher && this._itemsChangedListener) {
            window.eventDispatcher.off('npc_items_changed', this._itemsChangedListener);
        }
    }
    
    /**
     * Get conversation metadata (variables, state)
     * @returns {Object} Metadata about the conversation
     */
    getMetadata() {
        if (!this.storyLoaded) {
            return {
                loaded: false,
                ended: false,
                variables: {}
            };
        }
        
        // Try to get common variables
        const commonVars = ['trust_level', 'conversation_count', 'npc_name'];
        const variables = {};
        
        commonVars.forEach(varName => {
            try {
                const value = this.getVariable(varName);
                if (value !== null && value !== undefined) {
                    variables[varName] = value;
                }
            } catch (error) {
                // Variable doesn't exist, skip
            }
        });
        
        return {
            loaded: this.storyLoaded,
            ended: this.storyEnded,
            variables,
            tags: this.getCurrentTags()
        };
    }
}
