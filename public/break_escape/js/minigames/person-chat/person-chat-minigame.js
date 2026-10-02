/**
 * PersonChatMinigame - Main Person-Chat Minigame Controller (Single Speaker Layout)
 * 
 * Extends MinigameScene to provide cinematic in-person conversation interface.
 * Orchestrates:
 * - Portrait rendering (single speaker at a time)
 * - Dialogue display
 * - Continue button for story progression
 * - Choice selection
 * - Ink story progression
 * 
 * @module person-chat-minigame
 */

import { MinigameScene } from '../framework/base-minigame.js';
import PersonChatUI from './person-chat-ui.js';
import PhoneChatConversation from '../phone-chat/phone-chat-conversation.js'; // Reuse phone-chat conversation logic
import InkEngine from '../../systems/ink/ink-engine.js';
import { processGameActionTags, determineSpeaker as determineSpeakerFromTags } from '../helpers/chat-helpers.js';
import npcConversationStateManager from '../../systems/npc-conversation-state.js';
import TTSManager from '../../systems/tts-manager.js';
import { rememberNpcLine, getRememberedNpcLine, reopenContextLine } from './person-chat-reopen.js';

// Configuration constants for dialogue auto-advance timing
const DIALOGUE_AUTO_ADVANCE_DELAY = 5000; // Default delay in milliseconds for new dialogue text (5 seconds)
const DIALOGUE_END_DELAY = 1000; // Delay in milliseconds for ending conversations (1 second)

export class PersonChatMinigame extends MinigameScene {
    /**
     * Create a PersonChatMinigame instance
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Configuration parameters
     */
    constructor(container, params) {
        super(container, params);
        
        // Get required globals
        if (!window.game || !window.npcManager) {
            throw new Error('PersonChatMinigame requires window.game and window.npcManager');
        }
        
        this.game = window.game;
        this.npcManager = window.npcManager;
        this.player = window.player;
        
        // Get scenario data for player and NPC sprites
        this.scenario = window.gameScenario || {};
        
        // Create InkEngine instance for this conversation
        this.inkEngine = new InkEngine(`person-chat-${params.npcId}`);
        
        // Parameters
        this.npcId = params.npcId;
        this.title = params.title || 'Conversation';
        this.background = params.background; // Optional background image path from timedConversation
        this.startKnot = params.startKnot; // Optional knot to jump to (used for event-triggered conversations)
        this.videoCall = params.videoCall || false; // Render as a framed video call with a player self-view PiP
        
        // Verify NPC exists
        const npc = this.npcManager.getNPC(this.npcId);
        if (!npc) {
            throw new Error(`NPC not found: ${this.npcId}`);
        }
        this.npc = npc;
        
        // Get player config from scenario
        this.playerData = this.scenario.player || {
            id: 'player',
            displayName: 'Agent 0x00',
            spriteSheet: 'hacker'
        };
        
        // Build character index for multi-character support
        this.characters = this.buildCharacterIndex();
        
        // Modules
        this.ui = null;
        this.conversation = null;
        
        // State
        this.isConversationActive = false;
        this.currentSpeaker = null; // Track current speaker ID ('player' or NPC id)
        this.lastResult = null; // Store last continue() result for choice handling
        this.isClickThroughMode = false; // If true, player must click to advance between dialogue lines (starts in AUTO mode)
        this.pendingContinueCallback = null; // Callback waiting for player click in click-through mode
        this.isProcessingDialogue = false; // PHASE 0: State locking to prevent race conditions during dialogue advancement
        this.pendingKnotJump = null; // Knot to jump to after current dialogue sequence completes
        this.isResumedConversation = false; // Saved story state restored this session (a reopen)

        // TTS Manager for voice synthesis
        this.ttsManager = new TTSManager();

        // Optional voice FX for this NPC (e.g. Ghost's masked encrypted-comms voice).
        // Driven by the scenario NPC's "voice": { ..., "fx": "voice-distortion" | {custom} } config.
        // Narrator/player lines are unaffected (they play under different speaker ids).
        if (this.npc?.voice?.fx) {
            this.ttsManager.setVoiceFX(this.npcId, this.npc.voice.fx);
        }

        console.log(`🎭 PersonChatMinigame created for NPC: ${this.npcId}`);
    }
    
    /**
     * Build index of all available characters (player + NPCs)
     * Uses global character registry populated as NPCs are registered
     * @returns {Object} Map of character ID to character data
     */
    buildCharacterIndex() {
        // Use global character registry if available
        if (window.characterRegistry) {
            const allCharacters = window.characterRegistry.getAllCharacters();
            console.log(`👥 Using global character registry with ${Object.keys(allCharacters).length} characters:`, Object.keys(allCharacters));
            return allCharacters;
        }
        
        // Fallback to legacy local building if registry not available
        const characters = {};
        
        // Add player
        characters['player'] = this.playerData;
        
        // Add main NPC
        characters[this.npc.id] = this.npc;
        
        // Add other NPCs from current room (NPCs are now per-room, not at scenario root)
        // Use npc.roomId first, fallback to window.currentRoom
        const currentRoom = this.npc.roomId || window.currentRoom;
        if (currentRoom && this.scenario.rooms && this.scenario.rooms[currentRoom]) {
            const roomNPCs = this.scenario.rooms[currentRoom].npcs || [];
            roomNPCs.forEach(npc => {
                if (npc.id !== this.npc.id) {
                    // Look up NPC data from npcManager for complete displayName and other properties
                    const npcData = window.npcManager?.getNPC(npc.id) || npc;
                    characters[npc.id] = npcData;
                }
            });
        }
        
        // Fallback to legacy root-level NPCs for backward compatibility
        if (Object.keys(characters).length <= 2 && this.scenario.npcs && Array.isArray(this.scenario.npcs)) {
            this.scenario.npcs.forEach(npc => {
                if (npc.id !== this.npc.id && !characters[npc.id]) {
                    characters[npc.id] = npc;
                }
            });
        }
        
        console.log(`👥 Built character index with ${Object.keys(characters).length} characters:`, Object.keys(characters));
        return characters;
    }
    
    /**
     * Get character data by ID
     * @param {string} characterId - Character ID (player, npc_id, etc.)
     * @returns {Object} Character data
     */
    getCharacterById(characterId) {
        if (!characterId) return this.npc; // Fallback to main NPC
        
        // Handle legacy speaker values
        if (characterId === 'npc') {
            return this.npc;
        }
        if (characterId === 'player') {
            return this.playerData;
        }
        
        // Look up by ID
        return this.characters[characterId] || this.npc;
    }
    
    /**
     * Initialize the minigame UI and components
     */
    init() {
        // Set up basic minigame structure (header, container, etc.)
        if (!this.params.cancelText) {
            this.params.cancelText = 'End Conversation';
        }
        super.init();
        
        // Initialize timer for auto-advance
        this.autoAdvanceTimer = null;
        
        // Customize header
        this.headerElement.innerHTML = `
            <h3>🎭 ${this.title}</h3>
            <p>Speaking with ${this.npc.displayName}</p>
        `;
        
        // Create UI, passing both NPC and player data
        this.ui = new PersonChatUI(this.gameContainer, {
            game: this.game,
            npc: this.npc,
            playerSprite: this.player,
            playerData: this.playerData,
            characters: this.characters,  // Pass multi-character support
            background: this.background,  // Optional background image path
            videoCall: this.videoCall     // Render as a framed video call with a self-view PiP
        }, this.npcManager);

        this.ui.render();

        // Pass TTSManager to the portrait renderer so mouth animation can be
        // driven by real audio amplitude (noise gate on TTS audio only –
        // Phaser game sounds are routed through a separate system and unaffected).
        if (this.ui.portraitRenderer) {
            this.ui.portraitRenderer.setTTSManager(this.ttsManager);
        }

        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ PersonChatMinigame initialized');
    }
    
    /**
     * Test bridge state (see MinigameScene.getTestState).
     *
     * Adds a `dialogue` block, which the main bridge lifts to the top level of
     * getState() because it is the single most acted-on thing in the game.
     * Choices are reported with the same 1-based numbers as their on-screen
     * labels, so __test.minigame.choose(n) matches what a watcher sees.
     */
    getTestState() {
        const base = super.getTestState();

        const choiceButtons = this.ui?.getChoiceButtons?.() || [];
        // Ink choice tags, where the author has added them, are the one handle
        // that survives a dialogue rewrite. Currently rare in the scenarios,
        // but pass them through so traces can prefer them when present.
        const inkChoices = this.conversation?.currentChoices || [];
        const choices = choiceButtons.map((btn, i) => ({
            number: i + 1,
            index: i,
            text: (btn.innerText || '').trim().replace(/^\s*\d+[\.)]\s*/, '').slice(0, 300),
            tags: Array.isArray(inkChoices[i]?.tags) ? inkChoices[i].tags.slice(0, 8) : []
        }));

        const continueBtn = this.ui?.elements?.continueButton;
        const continueVisible = !!continueBtn && continueBtn.style.display !== 'none';

        return {
            ...base,
            npcId: this.npcId || null,
            npcName: this.npc?.name || null,
            dialogue: {
                npcId: this.npcId || null,
                speaker: (this.ui?.elements?.speakerName?.innerText || '').trim() || null,
                text: (this.ui?.elements?.dialogueText?.innerText || '').trim(),
                choices,
                // When choices are showing, choose(n). When only continue is
                // showing, continue(). Both are key dispatches.
                canContinue: continueVisible && choices.length === 0,
                awaitingChoice: choices.length > 0,
                ended: !!this.conversation?.storyEnded
            }
        };
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Choice button clicks
        this.addEventListener(this.ui.elements.choicesContainer, 'click', (e) => {
            const choiceButton = e.target.closest('.person-chat-choice-button');
            if (choiceButton) {
                const choiceIndex = parseInt(choiceButton.dataset.index);
                this.handleChoice(choiceIndex);
            }
        });

        // Continue button click handler
        if (this.ui.elements.continueButton) {
            this.addEventListener(this.ui.elements.continueButton, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleContinueButtonClick();
            });
        }

        // Keyboard handler for spacebar (continue) and number keys (choices)
        this.addEventListener(window, 'keydown', (e) => {
            // Only handle keyboard input when minigame is active
            if (!this.gameState.isActive) {
                return;
            }
            
            // Don't trigger if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Handle spacebar for continue button
            if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                this.handleContinueButtonClick();
                return;
            }
            
            // Handle number keys (1-9) for choice selection
            // Only allow if choices are actually visible in the UI (not just pending in lastResult)
            const visibleChoiceButtons = this.ui.getChoiceButtons();
            if (visibleChoiceButtons.length > 0) {
                const key = e.key;
                const numKey = parseInt(key);

                // Check if it's a valid number key (1-9) and within the visible choices range
                if (!isNaN(numKey) && numKey >= 1 && numKey <= 9 && numKey <= visibleChoiceButtons.length) {
                    e.preventDefault();
                    e.stopPropagation();

                    // numKey is 1-based, but choice index is 0-based
                    const choiceIndex = numKey - 1;
                    console.log(`🔢 Number key ${numKey} pressed, selecting choice ${choiceIndex}`);
                    this.handleChoice(choiceIndex);
                }
            }
        });

        // Listen for conversation end event from the conversation handler
        this.addEventListener(window, 'npc-conversation-ended', (e) => {
            console.log(`👋 Received npc-conversation-ended event for ${e.detail.npcId}`);

            // Verify this event is for our current conversation
            if (e.detail.npcId === this.npcId) {
                console.log(`✅ Ending minigame - conversation state preserved at mission_hub`);

                // Save state before exiting
                if (this.inkEngine && this.inkEngine.story) {
                    npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                }

                // End the minigame and return to game
                if (window.MinigameFramework) {
                    window.MinigameFramework.endMinigame(true, { conversationEnded: true });
                }
            }
        });
    }
    
    /**
     * Handle continue button click — skip current line and advance immediately.
     * Auto-advance (audio-based timing) remains active for subsequent lines.
     */
    handleContinueButtonClick() {
        // Stop TTS for the current line
        if (this.ttsManager) this.ttsManager.stop();

        // Cancel any pending auto-advance timer
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }

        // Execute the pending callback immediately (advance to next line)
        if (this.pendingContinueCallback && typeof this.pendingContinueCallback === 'function') {
            const callback = this.pendingContinueCallback;
            this.pendingContinueCallback = null;
            callback();
        }
    }    /**
     * Toggle between automatic timing and click-through mode
     */
    toggleClickThroughMode() {
        this.isClickThroughMode = !this.isClickThroughMode;
        
        if (this.isClickThroughMode) {
            console.log('📋 Switched to CLICK-THROUGH mode');
            this.ui.elements.continueButton.textContent = 'Continue';
            // Cancel any pending automatic advances (timer only, keep the callback!)
            if (this.autoAdvanceTimer) {
                clearTimeout(this.autoAdvanceTimer);
                this.autoAdvanceTimer = null;
            }
        } else {
            console.log('📋 Switched to AUTOMATIC mode');
            this.ui.elements.continueButton.textContent = 'Auto';
            // Resume automatic advancement
            this.showCurrentDialogue();
        }
    }
    
    /**
     * Schedule the next dialogue advancement, respecting click-through mode
     * @param {Function} callback - Function to call to advance dialogue
     * @param {number} delay - Delay in milliseconds (ignored in click-through mode)
     */
    scheduleDialogueAdvance(callback, delay = DIALOGUE_AUTO_ADVANCE_DELAY) {
        // Always store the callback function itself
        this.pendingContinueCallback = callback;
        
        if (this.isClickThroughMode) {
            // In click-through mode, wait for button click to execute callback
            console.log(`⏱️ scheduleDialogueAdvance: Stored callback for click-through mode`);
        } else {
            // In automatic mode, schedule execution after delay
            console.log(`⏱️ scheduleDialogueAdvance: Will auto-advance after ${delay}ms`);
            // Clear any existing timeout
            if (this.autoAdvanceTimer) {
                clearTimeout(this.autoAdvanceTimer);
            }
            // Set new timeout that will call handleContinueButtonClick
            this.autoAdvanceTimer = setTimeout(() => {
                if (this.pendingContinueCallback && typeof this.pendingContinueCallback === 'function') {
                    const callback = this.pendingContinueCallback;
                    this.pendingContinueCallback = null;
                    callback();
                }
            }, delay);
        }
    }
    
    /**
     * Start the minigame
     * Initializes conversation flow
     */
    start() {
        super.start();
        
        console.log('🎭 PersonChatMinigame started');
        
        // Track NPC context for tag processing and minigame return flow
        window.currentConversationNPCId = this.npcId;
        window.currentConversationMinigameType = 'person-chat';
        
        // Start conversation with Ink
        this.startConversation();
    }
    
    /**
     * Start conversation with NPC
     * Loads Ink story and shows initial dialogue
     */
    async startConversation() {
        try {
            // Create conversation manager using PhoneChatConversation (reused logic)
            this.conversation = new PhoneChatConversation(this.npcId, this.npcManager, this.inkEngine);
            
            // Load story from NPC's storyJSON (pre-cached) or via Rails API
            let storySource = this.npc.storyJSON;
            
            // If no pre-cached JSON but storyPath exists, use Rails API endpoint
            if (!storySource && this.npc.storyPath) {
                const gameId = window.breakEscapeConfig?.gameId;
                if (gameId) {
                    storySource = `/break_escape/games/${gameId}/ink?npc=${this.npcId}`;
                    console.log(`📖 Using Rails API for story: ${storySource}`);
                } else {
                    console.warn('⚠️  No gameId available, story loading may fail');
                }
            }
            
            const loaded = await this.conversation.loadStory(storySource);
            
            if (!loaded) {
                console.error('❌ Failed to load conversation story');
                this.showError('Failed to load conversation');
                return;
            }
            
            // If a startKnot was provided (event-triggered conversation), jump directly to it
            // This skips state restoration and goes straight to the event response
            if (this.startKnot) {
                console.log(`⚡ Event-triggered conversation: jumping directly to knot: ${this.startKnot}`);
                this.conversation.goToKnot(this.startKnot);
            } else {
                // Otherwise, restore previous conversation state if it exists
                const stateRestored = npcConversationStateManager.restoreNPCState(
                    this.npcId, 
                    this.inkEngine.story
                );
                
                if (stateRestored) {
                    // A reopen: if the resumed story prints nothing before its choices,
                    // showCurrentDialogue re-displays the NPC's last line (person-chat-reopen.js).
                    this.isResumedConversation = true;
                    // If we restored state, reset the story ended flag in case it was marked as ended before
                    this.conversation.storyEnded = false;
                    // A story that ran to DONE/END has no position: restoring it (full state) or only
                    // its variables leaves nothing to show but "(End of conversation)". Restart at the
                    // NPC's start knot instead (see PhoneChatConversation.restartAfterEnd).
                    const restoredStory = this.inkEngine.story;
                    // NPC config "restartOnRetalk": false opts out, for one-shot scenes (e.g. a final
                    // choice with rewards) that must not replay once resolved.
                    const storyIsFinished = this.npc.restartOnRetalk !== false && (stateRestored === 'variables-only' ||
                        (!restoredStory.canContinue && !(restoredStory.currentChoices?.length > 0)));
                    if (storyIsFinished && this.conversation.restartAfterEnd()) {
                        console.log(`🔁 Previous conversation had ended - restarting ${this.npcId} at knot: ${this.npc.currentKnot}`);
                    } else {
                        console.log(`🔄 Continuing previous conversation with ${this.npcId}`);
                    }
                } else {
                    // First time conversation - navigate to start knot
                    const startKnot = this.npc.currentKnot || 'start';
                    this.conversation.goToKnot(startKnot);
                    console.log(`🆕 Starting new conversation with ${this.npcId}`);
                }
            }
            
            // Always sync global variables to ensure they're up to date
            // This is important because other NPCs may have changed global variables
            if (this.inkEngine && this.inkEngine.story) {
                npcConversationStateManager.syncGlobalVariablesToStory(this.inkEngine.story);
                // Also sync inventory-based variables on initial load
                npcConversationStateManager.syncInventoryVariablesToStory(this.inkEngine.story, this.npc);
                
                // CRITICAL: Restored state includes snapshotted choices evaluated with OLD global
                // variable values. Re-navigate to the same knot so Ink re-evaluates all conditionals
                // with the current synced globals. Detect the knot from the first choice's sourcePath
                // (e.g. "hub.c-0" → "hub", "warn_kevin_direct.0.c-0" → "warn_kevin_direct").
                // currentPathString is null at choice points so we can't use that.
                const story = this.inkEngine.story;
                if (story.currentChoices && story.currentChoices.length > 0) {
                    const firstChoice = story.currentChoices[0];
                    const sourcePath = firstChoice.sourcePath || (firstChoice._sourcePath && firstChoice._sourcePath.toString());
                    const currentKnot = sourcePath ? sourcePath.split('.')[0] : null;
                    if (currentKnot) {
                        try {
                            console.log(`🔄 Re-navigating to current knot "${currentKnot}" to re-evaluate choices with updated globals`);
                            story.ChoosePathString(currentKnot);
                        } catch (e) {
                            console.warn(`⚠️ Could not re-navigate to "${currentKnot}":`, e.message);
                        }
                    } else {
                        console.warn(`⚠️ Could not detect current knot from choices — stale choices may be shown`);
                    }
                }
            }

            
            // Re-sync global variables right before showing dialogue to ensure conditionals are evaluated with current values
            // This is critical because Ink evaluates conditionals when continue() is called
            if (this.inkEngine && this.inkEngine.story) {
                npcConversationStateManager.syncGlobalVariablesToStory(this.inkEngine.story);
                // Also sync inventory-based variables (has_keycard, has_rfid_cloner, card protocols, etc.)
                npcConversationStateManager.syncInventoryVariablesToStory(this.inkEngine.story, this.npc);
                console.log('🔄 Re-synced global and inventory variables before showing dialogue');
            }
            
            this.isConversationActive = true;

            // Clear any stale choices from a previous conversation before showing new dialogue
            this.ui.hideChoices();

            // Show initial dialogue
            this.showCurrentDialogue();
            
            console.log('✅ Conversation started');
        } catch (error) {
            console.error('❌ Error starting conversation:', error);
            this.showError('An error occurred during conversation');
        }
    }
    
    /**
     * Display current dialogue (without advancing yet)
     */
    showCurrentDialogue() {
        if (!this.conversation) return;

        try {
            // Get current content without advancing
            const result = this.conversation.continue();
            // Only the first display after a reopen may need the context line
            const isReopen = this.isResumedConversation;
            this.isResumedConversation = false;

            // Store result for later use
            this.lastResult = result;

            // Check if story has ended
            if (result.hasEnded) {
                // Check if this is a graceful conversation end (with #end_conversation tag)
                const hasEndConversationTag = result.tags?.some(tag =>
                    tag.trim().toLowerCase() === 'end_conversation'
                );

                if (hasEndConversationTag) {
                    // Graceful end - the npc-conversation-ended event will handle closing
                    console.log('👋 Graceful conversation end detected - waiting for event handler');
                    return;
                }

                // Otherwise, it's an unexpected END - save state and show manual exit message
                // Player should press ESC to exit and return to hub
                if (this.inkEngine && this.inkEngine.story) {
                    npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                }
                // Via the helper so a disableClose scene (no Esc, no x) still closes itself.
                // Reached on re-talk to a restartOnRetalk:false NPC whose story had ended,
                // including after a reload, when its saved ink variables are restored.
                this.showConversationOverMessage('(End of conversation - press ESC to exit)');
                console.log('🏁 Story has reached an end point');
                return;
            }
            
            // Determine who is speaking based on tags
            const speaker = this.determineSpeaker(result);
            this.currentSpeaker = speaker;
            
            console.log(`🗣️ showCurrentDialogue - result.text: "${result.text?.substring(0, 50)}..." (${result.text?.length || 0} chars)`);
            console.log(`🗣️ showCurrentDialogue - result.canContinue: ${result.canContinue}`);
            console.log(`🗣️ showCurrentDialogue - result.hasEnded: ${result.hasEnded}`);
            console.log(`🗣️ showCurrentDialogue - result.choices.length: ${result.choices?.length || 0}`);
            console.log(`🗣️ showCurrentDialogue - this.ui exists:`, !!this.ui);
            console.log(`🗣️ showCurrentDialogue - this.ui.showDialogue exists:`, typeof this.ui?.showDialogue);
            
            // Display choices if available (check this first, before text)
            if (result.choices && result.choices.length > 0) {
                console.log(`📋 ${result.choices.length} choices available`);
                
                // Check if we have accompanying text
                if (result.text && result.text.trim()) {
                    // Check if we have multiple lines/speakers (accumulated dialogue)
                    const hasMultipleLines = result.text.includes('\n');
                    const hasMultipleSpeakers = result.tags && result.tags.filter(t => t.includes('speaker:')).length > 1;
                    
                    if (hasMultipleLines || hasMultipleSpeakers) {
                        // Multiple dialogue lines - display them sequentially, choices shown at end
                        console.log(`🗣️ Initial dialogue has multiple lines/speakers - using block display`);
                        this.displayAccumulatedDialogue(result);
                    } else {
                        // Single line - display immediately with choices
                        console.log(`🗣️ Single line dialogue - showing with choices immediately`);
                        this.ui.showChoices(result.choices);
                        this.ui.showDialogue(result.text, speaker, true); // preserveChoices=true
                        rememberNpcLine(this.npcId, { text: result.text, speaker });
                    }
                } else {
                    // No text, just choices - show them immediately
                    this.ui.showChoices(result.choices);
                    // Reopened at a hub: continuing printed nothing, so show the NPC's last
                    // line again rather than a blank box. Display only: no tags, no TTS.
                    const context = reopenContextLine({
                        isReopen,
                        result,
                        remembered: getRememberedNpcLine(this.npcId)
                    });
                    if (context) {
                        this.ui.showDialogue(context.text, context.speaker, true); // preserveChoices=true
                        console.log(`📋 Reopened at a choice point - re-showing last line from ${context.speaker}`);
                    } else {
                        console.log(`📋 No text, just showing choices`);
                    }
                }
            } else if (result.text && result.text.trim()) {
                // Have text but no choices - use displayAccumulatedDialogue for proper speaker parsing
                // This ensures line prefix format (Speaker: text) is handled correctly
                console.log(`🗣️ Single line dialogue without choices - using block display for speaker parsing`);
                this.displayAccumulatedDialogue(result);
            } else {
                // No text and no choices - story has ended
                console.log('🏁 No text and no choices - story ended');
                this.endConversation();
            }
        } catch (error) {
            console.error('❌ Error showing dialogue:', error);
            this.showError('An error occurred during conversation');
        }
    }
    
    /**
     * Determine who is speaking based on Ink tags
     * 
     * SPEAKER TAG FORMATS:
     * - # speaker:player          → Player is speaking
     * - # speaker:npc             → Main NPC being talked to
     * - # speaker:npc:sprite_id   → Specific character (multi-character conversations)
     * 
     * If no speaker tag is present, dialogue DEFAULTS to the main NPC
     * This allows simple single-NPC conversations to omit the tag
     * 
     * @param {Object} result - Result from conversation.continue()
     * @returns {string} Character ID of speaker (player, npc_id, or main NPC id)
     */
    determineSpeaker(result) {
        if (!result.tags || result.tags.length === 0) {
            return this.npc.id; // Default to main NPC
        }
        
        // Check tags in reverse order to find the last speaker tag (current speaker)
        for (let i = result.tags.length - 1; i >= 0; i--) {
            const tag = result.tags[i].trim().toLowerCase();
            
            // Handle multi-part speaker tags like "speaker:npc:test_npc_back"
            if (tag.startsWith('speaker:')) {
                const parts = tag.split(':');
                
                if (parts.length === 2) {
                    // Simple speaker tag: speaker:player or speaker:npc
                    const speaker = parts[1];
                    if (speaker === 'player') return 'player';
                    if (speaker === 'npc') return this.npc.id; // Default NPC
                } else if (parts.length === 3) {
                    // Specific character tag: speaker:npc:character_id
                    const characterId = parts[2];
                    return this.characters[characterId] ? characterId : this.npc.id;
                } else if (parts.length > 3) {
                    // Handle IDs with colons like speaker:npc:test_npc_back
                    const characterId = parts.slice(2).join(':');
                    return this.characters[characterId] ? characterId : this.npc.id;
                }
            }
            
            // Fallback for non-speaker: tags
            if (tag === 'player') return 'player';
            if (tag === 'npc') return this.npc.id;
        }
        
        // No speaker tag found - default to main NPC
        return this.npc.id;
    }
    
    /**
     * PHASE 1: Parse a dialogue line for speaker prefix format
     * 
     * Validates that dialogue text is not empty (ignores "Speaker: " lines)
     * Case-insensitive speaker IDs ("Player:", "player:", "PLAYER:" all work)
     * First colon is delimiter ("Speaker: Text: with: colons" → speaker="Speaker", text="Text: with: colons")
     * Rejects prefixes where speaker ID doesn't exist in character index
     * Handles Narrator[character_id]: syntax for narrator with character portrait
     * 
     * @param {string} line - Dialogue line to parse
     * @returns {Object|null} Object with {speaker, text, isNarrator, narratorCharacter} or null if no prefix
     */
    parseDialogueLine(line) {
        if (!line || typeof line !== 'string') {
            return null;
        }
        
        line = line.trim();
        if (!line) {
            return null;
        }
        
        // Check for Narrator[character]: pattern first (highest priority)
        const narratorMatch = line.match(/^Narrator\s*\[\s*([^\]]*)\s*\]\s*:\s*(.+)$/i);
        if (narratorMatch) {
            const characterId = narratorMatch[1].trim();
            const text = narratorMatch[2].trim();
            
            // Must have non-empty text
            if (!text) {
                return null;
            }
            
            // If character ID is provided, validate it exists
            if (characterId && !this.characters[characterId]) {
                console.warn(`⚠️ parseDialogueLine: Unknown character in Narrator[${characterId}], treating as unprefixed`);
                return null;
            }
            
            return {
                speaker: 'narrator',
                text: text,
                isNarrator: true,
                narratorCharacter: characterId || null
            };
        }
        
        // Check for basic Narrator: pattern
        const basicNarratorMatch = line.match(/^Narrator\s*:\s*(.+)$/i);
        if (basicNarratorMatch) {
            const text = basicNarratorMatch[1].trim();
            
            // Must have non-empty text
            if (!text) {
                return null;
            }
            
            return {
                speaker: 'narrator',
                text: text,
                isNarrator: true,
                narratorCharacter: null
            };
        }
        
        // Check for regular Speaker: pattern
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            // No colon - not a prefixed line
            return null;
        }
        
        const speakerId = line.substring(0, colonIndex).trim();
        const text = line.substring(colonIndex + 1).trim();
        
        // Speaker ID must not be empty
        if (!speakerId) {
            return null;
        }
        
        // Text must not be empty (reject lines like "Speaker: ")
        if (!text) {
            return null;
        }
        
        // Validate speaker exists in characters
        const normalizedSpeaker = this.normalizeSpeakerId(speakerId);
        if (!normalizedSpeaker) {
            // Speaker not found - treat as unprefixed line
            return null;
        }
        
        return {
            speaker: normalizedSpeaker,
            text: text,
            isNarrator: false,
            narratorCharacter: null
        };
    }
    
    /**
     * PHASE 1: Normalize speaker ID for consistent lookup
     * 
     * Converts raw speaker ID to canonical form and validates existence
     * Returns null if speaker ID doesn't exist in character index
     * 
     * @param {string} speakerId - Raw speaker ID from dialogue line
     * @returns {string|null} Normalized speaker ID or null if invalid
     */
    normalizeSpeakerId(speakerId) {
        if (!speakerId || typeof speakerId !== 'string') {
            return null;
        }
        
        const normalized = speakerId.toLowerCase().trim();
        
        if (!normalized) {
            return null;
        }
        
        // Handle special cases
        if (normalized === 'player') {
            return this.characters['player'] ? 'player' : null;
        }
        
        if (normalized === 'npc') {
            return this.npc.id;
        }
        
        // Look up by ID or displayName (case-insensitive)
        for (const [id, character] of Object.entries(this.characters)) {
            if (id.toLowerCase() === normalized) {
                return id; // Return original casing
            }
            if (character.displayName && character.displayName.toLowerCase() === normalized) {
                return id;
            }
        }

        // "You:" is the documented way to write a player-spoken line (see
        // README_ink_best_practices.md), and it is used several hundred times across
        // the shipped scenarios. Without this alias the prefix fails to resolve, the
        // line is treated as unprefixed, and the literal text "You: ..." gets appended
        // to whichever NPC spoke last — i.e. the player's words appear inside the NPC's
        // speech bubble. Resolved AFTER the exact id/displayName scan so a character
        // genuinely named "You" would still win.
        if (normalized === 'you') {
            return this.characters['player'] ? 'player' : null;
        }

        // Not found
        return null;
    }
    
    /**
     * PHASE 4.5: Parse a background change line
     * 
     * Background syntax: Background[filename]: optional text after (ignored)
     * Example: "Background[scary-room.png]: The room transforms..."
     * 
     * @param {string} line - Dialogue line to parse
     * @returns {string|null} Background filename if valid, null otherwise
     */
    parseBackgroundLine(line) {
        if (!line || typeof line !== 'string') {
            return null;
        }
        
        line = line.trim();
        if (!line) {
            return null;
        }
        
        // Match Background[filename]: optional text pattern
        const bgMatch = line.match(/^Background\s*\[\s*([^\]]+)\s*\]\s*(?::\s*(.*))?$/i);
        if (!bgMatch) {
            return null;
        }
        
        const filename = bgMatch[1].trim();
        
        // Background filename must not be empty
        if (!filename) {
            return null;
        }
        
        console.log(`🎨 PHASE 4.5: Parsed background change to: ${filename}`);
        return filename;
    }
    
    /**
     * Handle choice selection
     * @param {number} choiceIndex - Index of selected choice
     */
    handleChoice(choiceIndex) {
        if (!this.conversation || !this.lastResult) return;
        if (!this.lastResult.choices || choiceIndex >= this.lastResult.choices.length) {
            console.warn(`⚠️ Choice ${choiceIndex} out of range (${this.lastResult.choices?.length ?? 0} available) — ignoring stale click`);
            return;
        }

        try {
            console.log(`📝 Choice selected: ${choiceIndex}`);
            
            // Get the choice object to check for tags
            const choice = this.lastResult.choices[choiceIndex];
            const choiceText = choice?.text || '';
            
            // Clear choice buttons immediately
            this.ui.hideChoices();
            
            // Make choice in conversation (this also calls continue() internally)
            const result = this.conversation.makeChoice(choiceIndex);
            
            // Sync global variables from story to window.gameState after choice
            // This ensures variable changes (like player_joined_organization) are captured
            if (this.inkEngine && this.inkEngine.story) {
                const changed = npcConversationStateManager.syncGlobalVariablesFromStory(this.inkEngine.story);
                if (changed.length > 0) {
                    console.log(`🌐 Synced ${changed.length} global variable(s) after choice:`, changed);
                    // Broadcast changes to other loaded stories
                    changed.forEach(({ name, value }) => {
                        npcConversationStateManager.broadcastGlobalVariableChange(name, value, this.npcId);
                    });
                }
            }
            
            // Save state immediately after making a choice
            // This ensures variables (favour, items earned, etc.) are persisted
            if (this.inkEngine && this.inkEngine.story) {
                npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
            }
            
            // First, display the player's choice as dialogue
            if (choiceText) {
                this.ui.showDialogue(choiceText, 'player');
            }
            
            // Check if the story output contains the exit_conversation tag
            // This tag appears in the story response AFTER making the choice
            const shouldExit = result?.tags?.some(tag => tag.includes('exit_conversation'));
            
            // If this was an exit choice, show the NPC's response then close.
            // displayAccumulatedDialogue (via displayDialogueBlocksSequentially) detects
            // the exit_conversation tag and calls complete(true) after showing the text.
            if (shouldExit) {
                console.log('🚪 Exit conversation tag detected - showing response then closing minigame');
                this.scheduleDialogueAdvance(() => {
                    this.displayAccumulatedDialogue(result);
                }, 1500);
                return;
            }
            
            // Normal dialogue flow: display the result (dialogue blocks) after a small delay
            console.log(`🎯 After choice: scheduling displayAccumulatedDialogue with result.text length: ${result?.text?.length || 0}`);
            this.scheduleDialogueAdvance(() => {
                // Process accumulated dialogue by splitting into individual speaker blocks
                console.log(`🎯 Inside scheduled callback: calling displayAccumulatedDialogue`);
                this.displayAccumulatedDialogue(result);
            }, 1500);

        } catch (error) {
            console.error('❌ Error handling choice:', error);
            this.showError('An error occurred when processing your choice');
        }
    }
    
    /**
     * Display accumulated dialogue by splitting into individual speaker blocks
     * @param {Object} result - Result with potentially multiple lines and tags
     */
    displayAccumulatedDialogue(result) {
        // PHASE 0: State locking to prevent race conditions during rapid dialogue advancement
        if (this.isProcessingDialogue) {
            console.log('⏳ Already processing dialogue, ignoring call');
            return;
        }
        this.isProcessingDialogue = true;
        
        try {
            // Process any game action tags (give_item, unlock_door, exit_conversation, etc.) FIRST
            // This ensures tags are processed even if there's no visible text
            if (result.tags && result.tags.length > 0) {
                console.log('🏷️ Processing action tags from accumulated dialogue:', result.tags);
                processGameActionTags(result.tags, this.ui);
                
                // Check for exit_conversation tag
                const shouldExit = result.tags.some(tag => tag.includes('exit_conversation'));
                if (shouldExit && (!result.text || !result.text.trim())) {
                    // No text — just the exit tag. Close immediately.
                    console.log('🚪 Exit conversation tag with no text — closing minigame');
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.scheduleDialogueAdvance(() => {
                        this.complete(true);
                    }, 1000);
                    return;
                }
                // If there IS text alongside the exit tag, fall through to display it.
                // displayDialogueBlocksSequentially will detect the tag and close after showing the text.
            }
            
            if (!result.text) {
                // No text content to display
                if (result.hasEnded) {
                    // Story ended - save state and show message
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                    console.log('🏁 Story has reached an end point');
                } else if (result.canContinue) {
                    // No text but more content available - get next line
                    console.log('📖 No text in result, getting next line...');
                    const nextLine = this.conversation.continue();
                    this.lastResult = nextLine;
                    this.displayAccumulatedDialogue(nextLine);
                } else if (result.choices && result.choices.length > 0) {
                    // Choices available with no preceding text (e.g. a conditional that
                    // produced an empty string on first visit, like {hub > 1: ...})
                    console.log(`📋 No text, showing ${result.choices.length} choices`);
                    this.ui.showChoices(result.choices);
                    this.lastResult = result;
                }
                return;
            }
            
            // Split text into lines
            const lines = result.text.split('\n').filter(line => line.trim());
            
            // We have lines and tags - pair them up
            // Each tag corresponds to a line (or group of lines before the next tag)
            if (lines.length === 0) {
                // Text was only whitespace - tags already processed above
                if (result.hasEnded) {
                    // Story ended - save state and show message
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                    console.log('🏁 Story has reached an end point');
                } else if (result.canContinue) {
                    // No visible text but more content available - get next line
                    console.log('📖 No visible lines, getting next line...');
                    const nextLine = this.conversation.continue();
                    this.lastResult = nextLine;
                    this.displayAccumulatedDialogue(nextLine);
                } else if (result.choices && result.choices.length > 0) {
                    // Choices available
                    console.log(`📋 No visible lines, showing ${result.choices.length} choices`);
                    this.ui.showChoices(result.choices);
                }
                return;
            }
            
            // Create dialogue blocks: each block is one or more consecutive lines with the same speaker
            // PHASE 0: Pass result object so createDialogueBlocks can use determineSpeaker() for tag-based fallback
            const dialogueBlocks = this.createDialogueBlocks(lines, result.tags, result);
            
            // Display blocks sequentially with delays
            this.displayDialogueBlocksSequentially(dialogueBlocks, result, 0);
        } finally {
            // PHASE 0: Unlock state on all exit paths (including errors)
            this.isProcessingDialogue = false;
        }
    }
    
    /**
     * Create dialogue blocks from lines and speaker tags
     * 
     * PHASE 3: Enhanced to support line prefix format
     * PHASE 4.5: Enhanced to detect and extract background changes
     * - First checks if line is background change (Background[...])
     * - Then tries to parse line prefix format using parseDialogueLine()
     * - Falls back to tag-based grouping if no prefix found
     * - Handles speaker changes mid-dialogue
     * - Groups consecutive lines from same speaker into single block
     * 
     * @param {Array<string>} lines - Text lines
     * @param {Array<string>} tags - Speaker tags (for fallback)
     * @param {Object} result - Result object for tag-based fallback
     * @returns {Array<Object>} Array of {speaker, text, isNarrator, narratorCharacter, backgroundChange} blocks
     */
    createDialogueBlocks(lines, tags, result) {
        const blocks = [];
        let currentSpeaker = null;
        let currentText = '';
        let currentIsNarrator = false;
        let currentNarratorCharacter = null;
        let currentBackgroundChange = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // PHASE 4.5: Check for background change first
            const bgChange = this.parseBackgroundLine(line);
            if (bgChange) {
                // Save current block if we have one
                if (currentSpeaker !== null && currentText.trim()) {
                    blocks.push({
                        speaker: currentSpeaker,
                        text: currentText.trim(),
                        isNarrator: currentIsNarrator,
                        narratorCharacter: currentNarratorCharacter,
                        backgroundChange: currentBackgroundChange
                    });
                }
                
                // Create background-only block
                blocks.push({
                    speaker: null,
                    text: '',
                    isNarrator: false,
                    narratorCharacter: null,
                    backgroundChange: bgChange
                });
                
                // Reset for next speaker
                currentSpeaker = null;
                currentText = '';
                currentIsNarrator = false;
                currentNarratorCharacter = null;
                currentBackgroundChange = null;
                continue;
            }
            
            // Try to parse line prefix format
            const parsed = this.parseDialogueLine(line);
            console.log(`🔍 parseDialogueLine("${line.substring(0, 50)}...") =>`, parsed);
            
            if (parsed) {
                // This line has a prefix - speaker changed!
                // First, save current block if we have one
                if (currentSpeaker !== null && currentText.trim()) {
                    blocks.push({
                        speaker: currentSpeaker,
                        text: currentText.trim(),
                        isNarrator: currentIsNarrator,
                        narratorCharacter: currentNarratorCharacter,
                        backgroundChange: currentBackgroundChange
                    });
                }
                
                // Start new block with parsed line
                currentSpeaker = parsed.speaker;
                currentText = parsed.text;
                currentIsNarrator = parsed.isNarrator;
                currentNarratorCharacter = parsed.narratorCharacter;
                currentBackgroundChange = null;
            } else {
                // No prefix - continues current speaker
                if (currentSpeaker === null) {
                    // First line without prefix - use tag-based or default speaker
                    currentSpeaker = this.determineSpeaker(result);
                    currentIsNarrator = false;
                    currentNarratorCharacter = null;
                    currentBackgroundChange = null;
                }
                
                // Add to current text (newline-separated)
                currentText += (currentText ? '\n' : '') + line;
            }
        }
        
        // Don't forget the last block!
        if (currentSpeaker !== null && currentText.trim()) {
            blocks.push({
                speaker: currentSpeaker,
                text: currentText.trim(),
                isNarrator: currentIsNarrator,
                narratorCharacter: currentNarratorCharacter,
                backgroundChange: currentBackgroundChange
            });
        }
        
        console.log(`📝 PHASE 3: createDialogueBlocks created ${blocks.length} blocks from ${lines.length} lines`);
        return blocks;
    }
    
    /**
     * Display dialogue blocks sequentially
     * @param {Array<Object>} blocks - Array of dialogue blocks
     * @param {Object} originalResult - Original result from Ink
     * @param {number} blockIndex - Current block index
     * @param {number} lineIndex - Current line index within the block (default 0)
     * @param {string} accumulatedText - Text accumulated so far for current speaker
     */
    async displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex = 0, accumulatedText = '') {
        if (blockIndex >= blocks.length) {
            // If a jumpToKnot was deferred while dialogue was in progress, execute it now.
            if (this.pendingKnotJump) {
                const knotName = this.pendingKnotJump;
                this.pendingKnotJump = null;
                console.log(`🎯 Executing deferred knot jump: ${knotName}`);
                this.jumpToKnot(knotName);
                return;
            }

            // All blocks displayed. Check for exit_conversation first — NPC said farewell, now close.
            const hasExitTag = originalResult.tags && originalResult.tags.some(t => t.includes('exit_conversation'));
            if (hasExitTag) {
                console.log('🚪 exit_conversation: all blocks shown, closing minigame');
                if (this.inkEngine && this.inkEngine.story) {
                    npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                }
                this.scheduleDialogueAdvance(() => {
                    this.complete(true);
                }, 1000);
                return;
            }

            // All blocks displayed, check if story has ended or if there are choices
            if (originalResult.hasEnded) {
                // Story ended - save state and show message
                this.scheduleDialogueAdvance(() => {
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                    console.log('🏁 Story has reached an end point');
                }, 1000);
            } else if (originalResult.choices && originalResult.choices.length > 0) {
                // Choices available - show them directly without needing another click
                console.log(`📋 All dialogue blocks done, showing ${originalResult.choices.length} choices`);
                // Cancel any pending auto-advance timer — we're waiting for user input now,
                // and letting it fire would call continue() and consume the choices state.
                if (this.autoAdvanceTimer) {
                    clearTimeout(this.autoAdvanceTimer);
                    this.autoAdvanceTimer = null;
                }
                this.pendingContinueCallback = null;
                // Update lastResult so choice handler has the correct choices
                this.lastResult = originalResult;
                this.ui.showChoices(originalResult.choices);
            } else {
                // More dialogue available - get next line immediately (no extra click needed)
                // The user already clicked to see the last line of current block
                console.log('⏸️ Blocks finished, getting next line immediately...');
                const nextLine = this.conversation.continue();
                
                // Store for choice handling
                this.lastResult = nextLine;
                
                // Check for exit_conversation tag FIRST (may come with empty text)
                if (nextLine.tags && nextLine.tags.some(tag => tag.includes('exit_conversation'))) {
                    console.log('🚪 Exit conversation tag detected after blocks - closing minigame');
                    // Process game action tags (set_global, give_item, remove_npc, etc.) before closing.
                    // PhoneChatConversation.processTags() fires exit_conversation synchronously during
                    // continue(), ending the minigame before displayAccumulatedDialogue can process them.
                    // Restore NPC context since the minigame teardown already cleared it.
                    if (nextLine.tags.length > 0) {
                        const prevNpcId = window.currentConversationNPCId;
                        window.currentConversationNPCId = this.npcId;
                        await processGameActionTags(nextLine.tags, this.ui);
                        window.currentConversationNPCId = prevNpcId;
                    }
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.scheduleDialogueAdvance(() => {
                        this.complete(true);
                    }, 1000);
                } else if (nextLine.text && nextLine.text.trim()) {
                    this.displayAccumulatedDialogue(nextLine);
                } else if (nextLine.choices && nextLine.choices.length > 0) {
                    // Back to choices - display them. Tags written after a knot's last
                    // line (give_item, complete_task...) arrive here with no text, and
                    // displayAccumulatedDialogue never sees them, so run them first.
                    if (nextLine.tags && nextLine.tags.length > 0) {
                        await processGameActionTags(nextLine.tags, this.ui);
                    }
                    console.log(`📋 Back to choices: ${nextLine.choices.length} options available`);
                    this.ui.showChoices(nextLine.choices);
                } else if (nextLine.hasEnded) {
                    if (nextLine.tags && nextLine.tags.length > 0) {
                        await processGameActionTags(nextLine.tags, this.ui);
                    }
                    // Story ended - save state and show message
                    if (this.inkEngine && this.inkEngine.story) {
                        npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                    }
                    this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                    console.log('🏁 Story has reached an end point');
                }
            }
            return;
        }
        
        // Display current block's lines one at a time with accumulation
        const block = blocks[blockIndex];
        
        // PHASE 4.5: Handle background changes before displaying dialogue
        if (block.backgroundChange) {
            console.log(`🎨 Background change block detected: ${block.backgroundChange}`);
            
            // Change background and move to next block
            this.changeBackground(block.backgroundChange);
            
            this.scheduleDialogueAdvance(() => {
                this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
            }, DIALOGUE_AUTO_ADVANCE_DELAY);
            return;
        }
        
        // Skip empty dialogue blocks
        if (!block.text || !block.text.trim()) {
            this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
            return;
        }
        
        const lines = block.text.split('\n').filter(line => line.trim());
        
        if (lineIndex >= lines.length) {
            // All lines in this block displayed, move to next block with reset accumulation
            this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex + 1, 0, '');
            return;
        }
        
        // Add current line to accumulated text
        const line = lines[lineIndex];
        const newAccumulatedText = accumulatedText ? accumulatedText + '\n' + line : line;
        
        console.log(`📋 Displaying line ${lineIndex + 1}/${lines.length} from block ${blockIndex + 1}/${blocks.length}: ${block.speaker}`);
        
        // PHASE 4: Show accumulated text with narrator support
        this.ui.showDialogue(
            newAccumulatedText,
            block.speaker,
            false, // preserveChoices
            block.isNarrator || false, // isNarrator
            block.narratorCharacter || null // narratorCharacter
        );
        rememberNpcLine(this.npcId, { text: line, speaker: block.speaker, isNarrator: block.isNarrator });

        // Determine auto-advance delay — use TTS audio duration if available
        let advanceDelay = DIALOGUE_AUTO_ADVANCE_DELAY;

        // Play TTS for NPC speakers (not player, not system)
        if (this.ttsManager && block.speaker && block.speaker !== 'player' && block.speaker !== 'system') {
            // Strip any "Character Name: " prefix — Ink lines may retain display-name prefixes
            // when parseDialogueLine couldn't match the speaker ID.
            // Require at least two capitalised words so single words like "Two:" or "Note:"
            // are not mistaken for speaker names (all NPC names here are multi-word).
            const stripSpeakerPrefix = s => /^(?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+:\s/.test(s) ? s.replace(/^[^:]+:\s*/, '') : s;
            const ttsText = stripSpeakerPrefix(line);
            // Narrator lines use the 'narrator' voice. Other lines normally use the
            // conversation's own NPC — but a multi-NPC conversation (line-prefix format,
            // several registered speakers in one ink) must voice each speaker in their
            // own voice. Guard: only override when the parsed speaker resolves to a
            // registered NPC that actually has a voice block; otherwise fall back to the
            // trigger NPC, so single-NPC scenarios (m01/m02/m07) are unchanged.
            // Two NPCs can share a display name (m05: Patricia in person and her phone
            // contact). A prefix parsed to the other one would be sent with the wrong id
            // and the server would refuse the text, so prefer the conversation's own NPC.
            const parsedSpeaker = this.characters[block.speaker];
            const isOwnNpcByName = parsedSpeaker && this.npc?.displayName &&
                parsedSpeaker.displayName === this.npc.displayName;
            const ttsSpeakerId = block.isNarrator
                ? 'narrator'
                : (block.speaker && block.speaker !== 'player' && !isOwnNpcByName && parsedSpeaker?.voice
                    ? block.speaker
                    : this.npcId);
            const audioDuration = await this.ttsManager.play(ttsSpeakerId, ttsText);
            if (audioDuration && audioDuration > 0) {
                // Use audio duration + buffer as advance delay
                advanceDelay = audioDuration + 500;
            }

            // Preload next line while current plays. Resolve its speaker the same way
            // so multi-NPC conversations preload against the correct voice.
            const nextLineIndex = lineIndex + 1;
            if (nextLineIndex < lines.length) {
                const nextTtsText = stripSpeakerPrefix(lines[nextLineIndex]);
                const nextParsed = this.parseDialogueLine(lines[nextLineIndex]);
                const nextSpeakerId = nextParsed && !nextParsed.isNarrator
                    && nextParsed.speaker && nextParsed.speaker !== 'player'
                    && this.characters[nextParsed.speaker]?.voice
                    && this.characters[nextParsed.speaker].displayName !== this.npc?.displayName
                    ? nextParsed.speaker
                    : this.npcId;
                this.ttsManager.preload(nextSpeakerId, nextTtsText);
            }
        }

        // Display next line after delay
        this.scheduleDialogueAdvance(() => {
            this.displayDialogueBlocksSequentially(blocks, originalResult, blockIndex, lineIndex + 1, newAccumulatedText);
        }, advanceDelay);
    }
    
    /**
     * Display dialogue from a result object (without calling continue() again)
     * @param {Object} result - Story result from conversation.continue()
     */
    displayDialogueResult(result) {
        try {
            // Check if story has ended
            if (result.hasEnded) {
                // Story ended - save state and show message
                if (this.inkEngine && this.inkEngine.story) {
                    npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                }
                this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                console.log('🏁 Story has reached an end point');
                return;
            }
            
            // Process any game action tags (give_item, unlock_door, etc.)
            if (result.tags && result.tags.length > 0) {
                console.log('🏷️ Processing tags from story:', result.tags);
                processGameActionTags(result.tags, this.ui);
            }
            
            // Determine who is speaking based on tags
            const speaker = this.determineSpeaker(result);
            this.currentSpeaker = speaker;
            
            console.log(`🗣️ displayDialogueResult - result.text: "${result.text?.substring(0, 50)}..." (${result.text?.length || 0} chars)`);
            console.log(`🗣️ displayDialogueResult - result.canContinue: ${result.canContinue}`);
            console.log(`🗣️ displayDialogueResult - result.choices.length: ${result.choices?.length || 0}`);
            
            // Display dialogue text with speaker (only if there's actual text)
            if (result.text && result.text.trim()) {
                console.log(`🗣️ Calling showDialogue with speaker: ${speaker}`);
                this.ui.showDialogue(result.text, speaker);
                rememberNpcLine(this.npcId, { text: result.text, speaker });
            } else {
                console.log(`⚠️ Skipping showDialogue - no text or text is empty`);
            }
            
            // Display choices if available
            if (result.choices && result.choices.length > 0) {
                this.ui.showChoices(result.choices);
                console.log(`📋 ${result.choices.length} choices available`);
            } else if (result.canContinue) {
                // No choices but can continue - auto-advance after delay
                console.log(`⏳ Auto-continuing in ${DIALOGUE_AUTO_ADVANCE_DELAY / 1000} seconds...`);
                this.scheduleDialogueAdvance(() => this.showCurrentDialogue(), DIALOGUE_AUTO_ADVANCE_DELAY);
            } else {
                // No choices and can't continue - check if there's more content
                // Try to continue anyway (for linear scripted conversations)
                console.log('⏸️ No more choices, attempting to continue for next line...');
                this.scheduleDialogueAdvance(() => {
                    const nextLine = this.conversation.continue();
                    if (nextLine.text && nextLine.text.trim()) {
                        // There's more dialogue to show
                        this.displayDialogueResult(nextLine);
                    } else if (nextLine.hasEnded) {
                        // Story reached an end - save state and show message
                        if (this.inkEngine && this.inkEngine.story) {
                            npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                        }
                        this.showConversationOverMessage('(Conversation ended - press ESC to close)');
                        console.log('🏁 Story has reached an end point');
                    } else {
                        // No text but story isn't ended - wait a bit and show message
                        console.log('✓ No more dialogue - conversation paused');
                        if (this.inkEngine && this.inkEngine.story) {
                            npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
                        }
                        this.showConversationOverMessage('(No more dialogue available - press ESC to close)');
                    }
                }, DIALOGUE_AUTO_ADVANCE_DELAY);
            }
        } catch (error) {
            console.error('❌ Error displaying dialogue:', error);
            this.showError('An error occurred during conversation');
        }
    }
    
    /**
     * Show the "conversation over" line. Normally the player closes with Esc, the x or End
     * Conversation, but disableClose removes all three, so a story that ends without
     * #exit_conversation would trap the player; close it for them after the message is read.
     * @param {string} message - Text to show
     */
    showConversationOverMessage(message) {
        this.ui.showDialogue(message, 'system');
        if (this.params.disableClose === true) {
            setTimeout(() => {
                if (this.gameState.isActive) this.complete(true);
            }, 2000);
        }
    }
    
    /**
     * End conversation and clean up
     */
    endConversation() {
        console.log('🎭 Conversation ended');
        
        this.isConversationActive = false;
        
        // Save the conversation state before ending
        // The state manager intelligently saves:
        // - Full state if conversation is still active
        // - Variables only if story has ended (so next conversation restarts fresh)
        if (this.inkEngine && this.inkEngine.story) {
            npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
        }
        
        // Show completion message
        if (this.ui.elements.dialogueText) {
            this.ui.elements.dialogueText.textContent = 'Conversation ended.';
        }
        
        // Hide controls
        this.ui.reset();
        
        // Close minigame after a delay
        this.scheduleDialogueAdvance(() => {
            this.complete(true);
        }, 1000);
    }
    
    /**
     * Jump to a specific knot in the conversation while keeping the minigame active
     * Called when an event (like lockpicking) is detected during an active conversation
     * @param {string} knotName - Name of the knot to jump to
     */
    jumpToKnot(knotName) {
        if (!knotName) {
            console.warn('jumpToKnot: No knot name provided');
            return false;
        }

        if (!this.conversation || !this.conversation.engine || !this.conversation.engine.story) {
            console.warn('jumpToKnot: Conversation engine not initialized', {
                hasConversation: !!this.conversation,
                hasEngine: !!this.conversation?.engine,
                hasStory: !!this.conversation?.engine?.story
            });
            return false;
        }

        // If we're currently displaying dialogue, defer the jump to avoid advancing the
        // story's internal state while a result's choices are still being shown.
        if (this.isProcessingDialogue) {
            console.log(`⏳ jumpToKnot deferred (dialogue in progress): ${knotName}`);
            this.pendingKnotJump = knotName;
            return true;
        }

        try {
            console.log(`🎯 PersonChatMinigame.jumpToKnot() - Starting jump to: ${knotName}`);
            console.log(`   Current NPC: ${this.npcId}`);
            console.log(`   Current knot before jump: ${this.conversation.engine.story.state?.currentPathString}`);
            
            // Use the conversation's goToKnot method instead of directly calling inkEngine
            // This ensures NPC state is updated properly
            const jumpSuccess = this.conversation.goToKnot(knotName);
            
            if (!jumpSuccess) {
                console.error(`❌ conversation.goToKnot() returned false for knot: ${knotName}`);
                return false;
            }
            
            console.log(`   Knot after jump: ${this.conversation.engine.story.state?.currentPathString}`);
            
            // Clear any pending callbacks since we're changing the story
            if (this.autoAdvanceTimer) {
                clearTimeout(this.autoAdvanceTimer);
                this.autoAdvanceTimer = null;
                console.log(`   Cleared auto-advance timer`);
            }
            this.pendingContinueCallback = null;
            
            // Clear the UI before showing new content
            this.ui.hideChoices();
            console.log(`   Hidden choice buttons`);
            
            console.log(`🎯 About to call showCurrentDialogue() to fetch new content...`);
            
            // Show the new dialogue at the target knot
            // This will call conversation.continue() to get the content at the new knot
            this.showCurrentDialogue();
            
            console.log(`✅ Successfully jumped to knot: ${knotName}`);
            return true;
        } catch (error) {
            console.error(`❌ Error jumping to knot ${knotName}:`, error);
            return false;
        }
    }
    
    /**
     * Override cleanup to ensure conversation state is saved
     * This is called by the base class before the minigame is removed
     */
    cleanup() {
        // Stop and destroy TTS
        if (this.ttsManager) {
            this.ttsManager.stop();
            this.ttsManager.destroy();
            this.ttsManager = null;
        }

        // Save conversation state before cleanup
        // The state manager intelligently handles:
        // - Saving full state for in-progress conversations
        // - Saving variables only for ended conversations
        if (this.isConversationActive && this.inkEngine && this.inkEngine.story) {
            console.log(`💾 Saving NPC state on cleanup for ${this.npcId}`);
            npcConversationStateManager.saveNPCState(this.npcId, this.inkEngine.story);
        }

        // Emit event when conversation closes (for triggering timed messages or other events)
        // cleanup() can be reached from more than one teardown path; emit once per instance
        if (window.eventDispatcher && !this._conversationClosedEmitted) {
            this._conversationClosedEmitted = true;
            const eventName = `conversation_closed:${this.npcId}`;
            window.eventDispatcher.emit(eventName, {
                npcId: this.npcId,
                timestamp: Date.now()
            });
            console.log(`📢 Emitted event: ${eventName}`);
        }

        // Tear down UI renderers/timers (portrait + video-call PiP) so their resize listeners
        // and animation loops are released.
        if (this.ui && typeof this.ui.destroy === 'function') {
            this.ui.destroy();
        }

        // Clear NPC context
        window.currentConversationNPCId = null;
        window.currentConversationMinigameType = null;

        // Play any barks that were deferred while the conversation was open
        if (window.barkSystem) {
            window.barkSystem.drainDeferredBarks();
        }

        // Call parent cleanup
        super.cleanup();
    }
    
    /**
     * PHASE 4.5: Change background image for current portrait
     * 
     * Updates the portrait renderer's background image and re-renders
     * 
     * @param {string} backgroundFilename - Filename of new background image
     * @returns {Promise<void>}
     */
    async changeBackground(backgroundFilename) {
        if (!backgroundFilename || !this.ui || !this.ui.portraitRenderer) {
            console.warn(`⚠️ changeBackground: Invalid background or portrait renderer`);
            return;
        }
        
        try {
            console.log(`🎨 Changing background to: ${backgroundFilename}`);
            
            // Call setBackground to load and render the new background
            this.ui.portraitRenderer.setBackground(backgroundFilename);
            
            console.log(`✅ Background changed successfully`);
        } catch (error) {
            console.error(`❌ Error changing background: ${error.message}`);
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        console.error(`❌ ${message}`);
        
        if (this.ui.elements.dialogueText) {
            this.ui.elements.dialogueText.innerHTML = `
                <span style="color: #ff6b6b;">⚠️ Error</span><br/>
                ${message}
            `;
        }
    }
}

// Register this minigame
if (window.MinigameFramework) {
    window.MinigameFramework.registerScene('person-chat-minigame', PersonChatMinigame);
    console.log('✅ PersonChatMinigame registered');
}

export default PersonChatMinigame;
