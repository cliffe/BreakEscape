/**
 * PhoneChatMinigame - Main Controller
 * 
 * Extends MinigameScene to provide Phaser-based phone chat functionality.
 * Orchestrates UI, conversation, and history management for NPC interactions.
 * 
 * @module phone-chat-minigame
 */

import { MinigameScene } from '../framework/base-minigame.js';
import PhoneChatUI from './phone-chat-ui.js';
import PhoneChatConversation from './phone-chat-conversation.js';
import PhoneChatHistory from './phone-chat-history.js';
import InkEngine from '../../systems/ink/ink-engine.js';
import { processGameActionTags } from '../helpers/chat-helpers.js';
import { classifyPhoneLine, displayPhoneLine, phoneStepLines } from './phone-chat-speaker.js';

export class PhoneChatMinigame extends MinigameScene {
    /**
     * Create a PhoneChatMinigame instance
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Configuration parameters
     */
    constructor(container, params) {
        super(container, params);
        
        // Debug logging
        console.log('📱 PhoneChatMinigame constructor called with:', { container, params });
        console.log('📱 this.params after super():', this.params);
        
        // Ensure params exists (use this.params from parent)
        const safeParams = this.params || {};
        console.log('📱 safeParams:', safeParams);
        
        // Validate required params
        if (!safeParams.npcId && !safeParams.phoneId) {
            console.error('❌ Missing required params. npcId:', safeParams.npcId, 'phoneId:', safeParams.phoneId);
            throw new Error('PhoneChatMinigame requires either npcId or phoneId');
        }
        
        // Get NPC manager from window (set up by main.js)
        if (!window.npcManager) {
            throw new Error('NPCManager not found. Ensure main.js has initialized it.');
        }
        
        this.npcManager = window.npcManager;
        this.inkEngine = new InkEngine();
        
        // Initialize modules (will be set up in init())
        this.ui = null;
        this.conversation = null;
        this.history = null;
        
        // State
        this.currentNPCId = safeParams.npcId || null;
        this.phoneId = safeParams.phoneId || 'player_phone';
        this.allowedNpcIds = safeParams.npcIds || null;  // Filter contacts to only these NPCs if provided
        this.isConversationActive = false;
        
        console.log('📱 PhoneChatMinigame created', {
            npcId: this.currentNPCId,
            phoneId: this.phoneId,
            allowedNpcIds: this.allowedNpcIds
        });
    }
    
    /**
     * Initialize the minigame UI and components
     */    /** Test bridge state (see MinigameScene.getTestState). */
    getTestState() {
        const base = super.getTestState();
        // The rendered buttons carry the plain '.choice-button' class (see
        // phone-chat-ui.js) — not '.phone-chat-choice-button'/'.person-chat-choice-button',
        // which never exist in the DOM and previously left choiceButtons always
        // empty, so awaitingChoice was always false and choose()/clickText()
        // could never select a phone conversation option.
        const choiceButtons = Array.from(
            this.container?.querySelectorAll('.choice-button') || []
        ).filter(el => el.offsetParent !== null);
        // The contact list is a separate stage before any dialogue exists: until
        // a contact is opened there are no choices and no text, so a test driver
        // sees an empty conversation and concludes the phone is broken. Expose
        // the list as selectable controls so it can open one.
        const contacts = Array.from(
            this.container?.querySelectorAll('.contact-item') || []
        ).filter(el => el.offsetParent !== null).map((el, i) => ({
            index: i,
            npcId: el.dataset.npcId || null,
            label: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 200)
        }));
        return {
            ...base,
            npcId: this.currentNPCId || null,
            phoneId: this.phoneId,
            contacts,
            awaitingContactSelection: contacts.length > 0 && !this.isConversationActive,
            conversationActive: !!this.isConversationActive,
            dialogue: {
                npcId: this.currentNPCId || null,
                text: (this.container?.querySelector('.phone-chat-dialogue-text, .person-chat-dialogue-text')?.innerText || '').trim(),
                choices: choiceButtons.map((btn, i) => ({
                    number: i + 1,
                    index: i,
                    text: (btn.innerText || '').trim().slice(0, 300)
                })),
                awaitingChoice: choiceButtons.length > 0,
                ended: !!this.conversation?.storyEnded
            }
        };
    }


    init() {
        // Set cancelText to "Close" before calling parent init
        if (!this.params.cancelText) {
            this.params.cancelText = 'Close';
        }
        
        // Call parent init to set up basic structure
        super.init();
        
        // Ensure params exists
        const safeParams = this.params || {};
        
        // Customize header
        this.headerElement.innerHTML = `
            <h3>${safeParams.title || 'Phone'}</h3>
            <p>Messages and conversations</p>
        `;
        
        // Initialize UI
        this.ui = new PhoneChatUI(this.gameContainer, safeParams, this.npcManager, this.allowedNpcIds);
        this.ui.render();
        
        // Add notebook button to minigame controls (before close button)
        if (this.controlsElement) {
            const notebookBtn = document.createElement('button');
            notebookBtn.className = 'minigame-button';
            notebookBtn.id = 'minigame-notebook';
            notebookBtn.innerHTML = '<img src="/break_escape/assets/icons/notes-sm.png" alt="Notepad" class="icon-small"> Add to Notepad';
            // Insert before the cancel/close button
            const cancelBtn = this.controlsElement.querySelector('#minigame-cancel');
            if (cancelBtn) {
                this.controlsElement.insertBefore(notebookBtn, cancelBtn);
            } else {
                this.controlsElement.appendChild(notebookBtn);
            }
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ PhoneChatMinigame initialized');
        
        // Call onInit callback if provided (used for returning from notes)
        if (safeParams.onInit && typeof safeParams.onInit === 'function') {
            safeParams.onInit(this);
        }
    }
    
    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Contact list item clicks
        this.addEventListener(this.ui.elements.contactList, 'click', (e) => {
            const contactItem = e.target.closest('.contact-item');
            if (contactItem) {
                const npcId = contactItem.dataset.npcId;
                this.openConversation(npcId);
            }
        });
        
        // Back button (return to contact list)
        this.addEventListener(this.ui.elements.backButton, 'click', () => {
            this.closeConversation();
        });
        
        // Notepad button (context-aware: saves contact list or conversation)
        const notebookBtn = document.getElementById('minigame-notebook');
        if (notebookBtn) {
            this.addEventListener(notebookBtn, 'click', () => {
                // Check which view is currently active
                const currentView = this.ui.getCurrentView();
                if (currentView === 'conversation' && this.currentNPCId) {
                    this.saveConversationToNotepad();
                } else {
                    this.saveContactListToNotepad();
                }
            });
        }
        
        // Choice button clicks
        this.addEventListener(this.ui.elements.choicesContainer, 'click', (e) => {
            const choiceButton = e.target.closest('.choice-button');
            if (choiceButton) {
                const choiceIndex = parseInt(choiceButton.dataset.index);
                // Play message sent sound
                try {
                    if (window.game && window.game.sound) {
                        const sound = window.game.sound.get('message_sent') || window.game.sound.add('message_sent');
                        sound.play({ volume: 0.7 });
                    }
                } catch (e) {
                    // Sound not available, ignore
                }
                this.handleChoice(choiceIndex);
            }
        });
        
        // Keyboard shortcuts
        this.addEventListener(document, 'keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    /**
     * Handle keyboard input
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyPress(event) {
        if (!this.gameState.isActive) return;
        
        switch(event.key) {
            case 'Escape':
                if (this.ui.getCurrentView() === 'conversation') {
                    // Go back to contact list
                    event.preventDefault();
                    this.closeConversation();
                } else {
                    // Close minigame
                    this.complete(false);
                }
                break;
                
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                // Quick choice selection (1-5)
                if (this.ui.getCurrentView() === 'conversation') {
                    const choiceIndex = parseInt(event.key) - 1;
                    const choices = this.ui.elements.choicesContainer.querySelectorAll('.choice-button');
                    if (choices[choiceIndex]) {
                        event.preventDefault();
                        this.handleChoice(choiceIndex);
                    }
                }
                break;
        }
    }
    
    /**
     * Start the minigame
     */
    async start() {
        super.start();
        
        // Preload intro messages for NPCs without history
        await this.preloadIntroMessages();
        
        // If NPC ID provided, open that conversation directly
        if (this.currentNPCId) {
            // Track NPC context for tag processing and minigame return flow
            window.currentConversationNPCId = this.currentNPCId;
            window.currentConversationMinigameType = 'phone-chat';
            this.openConversation(this.currentNPCId);
        } else {
            // Show contact list for this phone
            window.currentConversationMinigameType = 'phone-chat';
            this.ui.showContactList(this.phoneId);
        }
        
        console.log('✅ PhoneChatMinigame started');
    }
    
    /**
     * Preload intro messages for NPCs that have no conversation history
     * This makes it look like messages exist before opening the conversation
     * 
     * UPDATED: Now reads lines until choices appear, not just one line.
     */
    async preloadIntroMessages() {
        // Get all NPCs for this phone
        let npcs = this.phoneId 
            ? this.npcManager.getNPCsByPhone(this.phoneId)
            : Array.from(this.npcManager.npcs.values());
        
        // Filter to only allowed NPCs if npcIds was specified
        if (this.allowedNpcIds && this.allowedNpcIds.length > 0) {
            console.log(`🔍 Filtering NPCs for preload: allowed = ${this.allowedNpcIds.join(', ')}`);
            npcs = npcs.filter(npc => this.allowedNpcIds.includes(npc.id));
        }
        
        console.log('📱 Preloading intro messages for phone:', this.phoneId);
        console.log('📱 Found NPCs:', npcs.length, npcs.map(n => n.displayName));
        console.log('📱 All registered NPCs:', Array.from(this.npcManager.npcs.values()).map(n => ({ id: n.id, phoneId: n.phoneId, displayName: n.displayName })));
        
        for (const npc of npcs) {
            try {
                // Shared with the inventory's preload (PhoneChatConversation.preloadOpening)
                await PhoneChatConversation.preloadOpening(npc, this.npcManager, this.inkEngine);
            } catch (error) {
                console.warn(`⚠️ Could not preload intro for ${npc.id}:`, error);
            }
        }
        
        // Update phone badge after preloading messages
        if (window.updatePhoneBadge && this.phoneId) {
            window.updatePhoneBadge(this.phoneId);
        }
    }
    
    /**
     * Open a conversation with an NPC
     * @param {string} npcId - NPC identifier
     */
    async openConversation(npcId) {
        const npc = this.npcManager.getNPC(npcId);
        if (!npc) {
            console.error(`❌ NPC not found: ${npcId}`);
            this.ui.showNotification('Contact not found', 'error');
            return;
        }
        
        console.log(`💬 Opening conversation with ${npc.displayName || npcId}`);
        
        // Update current NPC
        this.currentNPCId = npcId;
        
        // Track NPC context for tag processing and minigame return flow
        window.currentConversationNPCId = npcId;
        window.currentConversationMinigameType = 'phone-chat';
        
        // Initialize conversation modules
        this.history = new PhoneChatHistory(npcId, this.npcManager);
        this.conversation = new PhoneChatConversation(npcId, this.npcManager, this.inkEngine);
        
        // Show conversation view
        this.ui.showConversation(npcId);
        
        // Load conversation history
        const history = this.history.loadHistory();
        
        // Determine target knot (needed before clearing history)
        const safeParams = this.params || {};
        // An explicit knot (an event-driven call, a text that names its knot) applies once,
        // to the NPC it was given for. Going back to the contact list and reopening the
        // thread, or opening another contact, is an ordinary reopen.
        let explicitStartKnot = null;
        if (safeParams.startKnot && !this._startKnotUsed &&
            (!safeParams.npcId || safeParams.npcId === npcId)) {
            explicitStartKnot = safeParams.startKnot;
            this._startKnotUsed = true;
        }
        const targetKnot = explicitStartKnot || npc.currentKnot || 'start';
        
        // An explicit knot (an event-driven call, a text naming its knot) adds to the
        // thread; it doesn't wipe it. This used to drop every line that wasn't a timed
        // text or bark, so the hub greeting and every earlier exchange vanished once a
        // scripted call landed (m03 pass-4 playtest). The thread is a log: what the
        // player has seen stays, and the call's lines are appended after it.
        
        // Filter out bark-only and timed messages to check if there's real conversation history
        // (timed messages are just notifications, not actual Ink dialogue)
        const conversationHistory = history.filter(msg => !msg.isBark && !msg.timed);
        const hasConversationHistory = conversationHistory.length > 0;
        
        // Show all history (including barks) in the UI
        if (history.length > 0) {
            this.ui.addMessages(history);
            // Mark messages as read, and update the HUD badge now rather than on close
            this.history.markAllRead();
            if (window.updatePhoneBadge && this.phoneId) window.updatePhoneBadge(this.phoneId);
        }
        
        // Load and start Ink story
        // Prefer Rails API endpoint if storyPath exists (ensures fresh story after path changes)
        console.log(`📱 openConversation - npc.storyJSON exists: ${!!npc.storyJSON}, npc.storyPath: ${npc.storyPath}, npc.inkStoryPath: ${npc.inkStoryPath}`);
        let storySource = null;
        
        // If storyPath exists, use Rails API endpoint (ensures fresh load after story path changes)
        if (npc.storyPath) {
            const gameId = window.breakEscapeConfig?.gameId;
            if (gameId) {
                storySource = `/break_escape/games/${gameId}/ink?npc=${npcId}`;
                console.log(`📖 Using Rails API for story: ${storySource}`);
            }
        }
        
        // Fallback to storyJSON or inkStoryPath
        if (!storySource) {
            storySource = npc.storyJSON || npc.inkStoryPath;
        }
        
        if (!storySource) {
            console.error(`❌ No story source found for ${npcId}`);
            this.ui.showNotification('No conversation available', 'error');
            return;
        }
        
        const loaded = await this.conversation.loadStory(storySource);
        if (!loaded) {
            this.ui.showNotification('Failed to load conversation', 'error');
            return;
        }
        
        // Set conversation as active
        this.isConversationActive = true;

        // Saved ink flags for this contact (from before a reload). A restored
        // npc.storyState below carries its own, newer values and overrides these.
        window.npcConversationStateManager?.applySavedInkVariables?.(npcId, this.conversation.engine?.story);
        
        // Check if we have saved story state to restore
        // BUT: if startKnot was explicitly provided (e.g., from timed message),
        // navigate to that knot instead of restoring old state.
        // A saved state that no longer loads (the ink changed since it was saved)
        // falls through to a fresh start at the NPC's knot.
        let restored = false;
        // An explicit knot (event call, a text naming its knot) still starts from the saved
        // story, so ink-local VARs and visit counts (once-only choices) carry over; it then
        // jumps to the knot below. A fresh story reset them (D2).
        let restoredForKnot = false;
        if (explicitStartKnot && npc.storyState) {
            restoredForKnot = this.conversation.restoreState(npc.storyState);
            if (restoredForKnot) {
                // The saved state holds the globals as they were; bring them up to date
                window.npcConversationStateManager?.syncGlobalVariablesToStory(this.conversation.engine?.story);
            } else {
                console.warn(`⚠️ Saved story state for ${npcId} could not be restored before knot ${explicitStartKnot}`);
            }
        }
        if (hasConversationHistory && npc.storyState && !explicitStartKnot) {
            restored = this.conversation.restoreState(npc.storyState);
            if (!restored) {
                console.warn(`⚠️ Saved story state for ${npcId} could not be restored; starting at its knot`);
                npc.storyState = null;
            }
        }

        if (restored) {
            // Restore previous story state (only if no explicit knot override)
            console.log('📚 Restoring story state from previous conversation');

            // Sync current globals into the restored story. If that changed a global the
            // saved story held, re-run the knot that owns the saved choices so Ink
            // re-evaluates them (resting knots re-check state at the top and divert).
            // The re-run shows only output the player hasn't seen: the knot's leading
            // text and tags, already in the thread, are not replayed (E10/E13; see
            // PhoneChatConversation.reopenWithCurrentGlobals).
            const reopen = this.conversation.reopenWithCurrentGlobals(story => {
                window.npcConversationStateManager?.syncGlobalVariablesToStory(story);
            });

            // If the saved story had ended (DONE/END), the restored story has no position and
            // would only show "Conversation ended". Restart at the NPC's knot instead. Skip when
            // the only history is the preload intro (NPC config "restartOnRetalk": false also opts out): that intro has already been shown and its
            // tags are still deferred, so replaying would duplicate both.
            const onlyPreloaded = conversationHistory.every(msg => msg.preloaded);
            if (reopen.renavigated) {
                this._presentOutput(reopen.messages, reopen.tags, reopen.result);
            } else if (npc.restartOnRetalk !== false && !onlyPreloaded &&
                this.conversation.getCurrentState().hasEnded &&
                this.conversation.restartAfterEnd()) {
                console.log(`🔁 Previous conversation had ended - restarting ${npcId} at knot: ${npc.currentKnot}`);
                this.continueStory();
            } else {
                // Show current choices without continuing
                this.showCurrentChoices();
            }

            // Process any game action tags that were collected during preload but deferred
            // until the player actually opens the conversation (e.g. complete_task, set_global)
            // A deferred global is applied only if nothing has set it since the preload
            if (npc.deferredGlobals) {
                PhoneChatConversation.applyDeferredGlobals(npc);
            }
            if (npc.deferredTags && npc.deferredTags.length > 0) {
                console.log(`📋 Processing ${npc.deferredTags.length} deferred tag(s) for ${npc.id}:`, npc.deferredTags);
                processGameActionTags(npc.deferredTags, this.ui);
                npc.deferredTags = null;
            }

            // The player has now opened the thread: record its position and ink flags
            // (first_contact etc.), so a reload resumes here rather than at the intro
            this.saveStoryState();
        } else {
            // Navigate to starting knot (either first time, or explicit navigation request)
            if (explicitStartKnot) {
                console.log(`📱 Explicit navigation to knot: ${explicitStartKnot}${restoredForKnot ? ' (from the saved story state)' : ''}`);
                this.conversation.goToKnot(targetKnot);
            } else {
                console.log(`📱 Navigating to knot: ${targetKnot}`);
                this.conversation.goToEntryKnot(targetKnot);
            }
            
            // This run plays (and applies the tags and globals of) the knot itself, so anything a
            // preload deferred for it would be a second copy
            npc.deferredGlobals = null;
            npc.deferredGlobalsBase = null;
            npc.deferredTags = null;
            
            // Continue story to get fresh content and choices
            this.continueStory();
        }
    }
    
    /**
     * Show current choices without continuing story (for reopening conversations)
     * 
     * UPDATED: If no choices are available but story can continue, 
     * keep reading until we get choices (same pattern as continueStory).
     */
    showCurrentChoices() {
        if (!this.conversation || !this.isConversationActive) {
            return;
        }
        
        // Get current state without continuing
        const result = this.conversation.getCurrentState();
        
        console.log('📋 showCurrentChoices - getCurrentState result:', {
            hasChoices: result.choices?.length > 0,
            canContinue: result.canContinue,
            hasEnded: result.hasEnded
        });
        
        if (result.choices && result.choices.length > 0) {
            this.ui.addChoices(result.choices);
        } else if (result.canContinue) {
            // No choices but can continue - need to read more content
            console.log('📖 No choices but canContinue=true, continuing story...');
            this.continueStory();
        } else if (result.hasEnded) {
            console.log('🏁 Story has ended');
            this.ui.showNotification('Conversation ended', 'info');
            this.isConversationActive = false;
        } else {
            console.log('ℹ️ No choices available in current state');
        }
    }
    
    /**
     * Continue the Ink story and display new content
     * 
     * UPDATED: Now reads one line at a time similar to person-chat.
     * Keeps calling continue() until choices appear, story ends, or we need player input.
     * Accumulates all NPC messages and displays them, then shows choices.
     */
    async continueStory() {
        if (!this.conversation || !this.isConversationActive) {
            return;
        }

        console.log('🎬 continueStory() called');
        console.trace('Call stack'); // This will show us where continueStory is being called from

        // Accumulate messages and tags until we hit choices or end
        const accumulatedMessages = [];
        const accumulatedTags = [];
        let lastResult = null;

        // Keep reading lines until we get choices or the story ends
        while (true) {
            const result = this.conversation.continue();
            lastResult = result;

            console.log('📖 Story continue result:', {
                text: result.text?.substring(0, 50),
                hasChoices: result.choices?.length > 0,
                canContinue: result.canContinue,
                hasEnded: result.hasEnded,
                tags: result.tags
            });

            // Collect tags
            if (result.tags && result.tags.length > 0) {
                accumulatedTags.push(...result.tags);
            }

            // Collect text (a line tagged #speaker:player comes back as "You: …")
            accumulatedMessages.push(...phoneStepLines(result.text, result.tags));

            // Stop conditions:
            // 1. Story has ended
            if (result.hasEnded) {
                console.log('🏁 Story ended while accumulating');
                break;
            }

            // 2. Choices are available
            if (result.choices && result.choices.length > 0) {
                console.log(`📋 Found ${result.choices.length} choices`);
                break;
            }

            // 3. No more content to continue
            if (!result.canContinue) {
                console.log('⏸️ Cannot continue, no choices');
                break;
            }

            // Otherwise, keep reading the next line
            console.log('📖 Reading next line...');
        }

        console.log('📖 Accumulated messages:', accumulatedMessages.length);
        console.log('🏷️ Accumulated tags:', accumulatedTags);
        console.log('📝 Messages detail:', accumulatedMessages);

        await this._presentOutput(accumulatedMessages, accumulatedTags, lastResult);
    }

    /**
     * Show a batch of story output: run its tags, type its messages into the thread,
     * then show the choices (or end). Shared by continueStory and a reopen's re-run.
     * @param {string[]} accumulatedMessages - NPC lines, in order
     * @param {string[]} accumulatedTags - tags from those lines
     * @param {Object} lastResult - { choices, canContinue, hasEnded } after the batch
     */
    async _presentOutput(accumulatedMessages, accumulatedTags, lastResult) {
        const TYPING_DELAY_MS  = 1000;
        const INTER_MESSAGE_MS = 400;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // If story has ended with no messages, end conversation immediately
        if (lastResult.hasEnded && accumulatedMessages.length === 0) {
            console.log('🏁 Conversation ended');
            this.ui.showNotification('Conversation ended', 'info');
            this.isConversationActive = false;
            return;
        }

        // Process accumulated game action tags BEFORE the typing animation.
        //
        // The loop below runs for as long as the text takes to type out — tens
        // of seconds on a long knot — and it returns early when the player
        // closes the conversation. Processing tags after it therefore dropped
        // every #give_item, #complete_task, #unlock_task and #set_global in the
        // batch whenever someone closed mid-typeout, silently and permanently.
        // person-chat-minigame.js has always processed tags first for exactly
        // this reason; this brings the two into line.
        //
        // The exit check stays AFTER the loop on purpose: a knot can carry
        // #exit_conversation alongside farewell text (m01's Agent HaX says
        // "Copy that. Call anytime." after its exit tag), and closing here
        // would cut that off.
        console.log('🔍 Checking for tags to process...', {
            hasTags: accumulatedTags.length > 0,
            tagsLength: accumulatedTags.length,
            tags: accumulatedTags
        });

        if (accumulatedTags.length > 0) {
            console.log('✅ Processing tags:', accumulatedTags);
            processGameActionTags(accumulatedTags, this.ui);
        } else {
            console.log('⚠️ No tags to process');
        }

        // Display accumulated NPC messages one at a time with typing indicator.
        // pendingNpcMessages is what has not reached the history yet: if the phone is closed
        // mid-typeout, _flushPendingMessages() keeps it (see there).
        this._pendingNpcMessages = accumulatedMessages.filter(m => m.trim()).map(m => m.trim());
        for (let i = 0; i < accumulatedMessages.length; i++) {
            const message = accumulatedMessages[i];
            if (!message.trim()) continue;
            if (!(await this._showStoryLine(message, TYPING_DELAY_MS))) return;
            this._pendingNpcMessages.shift();
            if (i < accumulatedMessages.length - 1) await delay(INTER_MESSAGE_MS);
        }
        this._pendingNpcMessages = [];

        // Display choices if available
        if (lastResult.choices && lastResult.choices.length > 0) {
            this.ui.addChoices(lastResult.choices);
        } else if (lastResult.hasEnded || !lastResult.canContinue) {
            // No more content and no choices - end conversation
            console.log('🏁 No more choices available');
            this.isConversationActive = false;
        }

        // Save story state after processing
        this.saveStoryState();
    }
    
    /**
     * Type one story line into the open thread and record it. A line written as the
     * player's ("You: …", or tagged #speaker:player) goes in as a player bubble with the
     * prefix stripped, with no "typing…" from the NPC (U3); phone texts are not voiced.
     * @param {string} raw - the line as the ink printed it
     * @param {number} typingDelayMs
     * @returns {Promise<boolean>} false if the conversation was closed meanwhile
     */
    async _showStoryLine(raw, typingDelayMs) {
        // A thread closed (or swapped for another contact) during the await is no longer
        // this typeout's: its untyped lines were flushed to the right history on close
        const run = this._typeoutRun;
        const stillOurs = () => this.isConversationActive && run === this._typeoutRun;
        const line = classifyPhoneLine('npc', raw.trim());
        if (line.type === 'npc') {
            this.ui.showTypingIndicator();
            this.ui.scrollToBottom();
            await new Promise(resolve => setTimeout(resolve, typingDelayMs));
            this.ui.hideTypingIndicator();
            if (!stillOurs()) return false;
        }
        await this.ui.addMessage(line.type, line.text);
        if (!stillOurs()) return false;
        // Typed into the open thread, so already read (else the badge sticks after closing)
        this.history.addMessage(line.type, line.text, { read: true });
        return true;
    }

    /**
     * Handle player choice selection
     * 
     * UPDATED: Now reads one line at a time similar to person-chat.
     * After making a choice, keeps calling continue() until choices appear or story ends.
     * 
     * @param {number} choiceIndex - Index of selected choice
     */
    async handleChoice(choiceIndex) {
        if (!this.conversation || !this.isConversationActive) {
            return;
        }

        const TYPING_DELAY_MS  = 1000;
        const INTER_MESSAGE_MS = 400;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // Get choice text before making choice
        const choices = this.ui.elements.choicesContainer.querySelectorAll('.choice-button');
        const choiceButton = choices[choiceIndex];
        if (!choiceButton) {
            console.error(`❌ Invalid choice index: ${choiceIndex}`);
            return;
        }

        const choiceText = choiceButton.textContent;

        console.log(`👆 Player chose: ${choiceText}`);

        // Display player's choice as a message
        this.ui.addMessage('player', choiceText);
        this.history.addMessage('player', choiceText, { choice: choiceIndex });

        // Clear choices
        this.ui.clearChoices();

        // Make choice in Ink story (this also continues and returns the first line)
        const firstResult = this.conversation.makeChoice(choiceIndex);

        // Save state immediately so closing mid-animation doesn't allow replaying the choice
        this.saveStoryState();

        // Accumulate messages and tags until we hit choices or end
        const accumulatedMessages = [];
        const accumulatedTags = [];
        let lastResult = firstResult;

        // Process the first result from makeChoice
        if (firstResult.tags && firstResult.tags.length > 0) {
            accumulatedTags.push(...firstResult.tags);
        }
        accumulatedMessages.push(...phoneStepLines(firstResult.text, firstResult.tags));

        // Keep reading lines until we get choices or the story ends
        while (lastResult.canContinue && (!lastResult.choices || lastResult.choices.length === 0)) {
            const result = this.conversation.continue();
            lastResult = result;

            console.log('📖 Story continue after choice:', {
                text: result.text?.substring(0, 50),
                hasChoices: result.choices?.length > 0,
                canContinue: result.canContinue,
                hasEnded: result.hasEnded
            });

            // Collect tags
            if (result.tags && result.tags.length > 0) {
                accumulatedTags.push(...result.tags);
            }

            // Collect text (a line tagged #speaker:player comes back as "You: …")
            accumulatedMessages.push(...phoneStepLines(result.text, result.tags));

            // Stop if story ended
            if (result.hasEnded) {
                break;
            }
        }

        // Process accumulated game action tags BEFORE the typing animation, for
        // the same reason as the continue path above: the loop returns early if
        // the player closes mid-typeout, and tags processed after it were then
        // lost outright. The exit check below still runs after the loop so
        // farewell text following #exit_conversation is not cut off.
        console.log('🔍 Checking for tags after choice...', {
            hasTags: accumulatedTags.length > 0,
            tagsLength: accumulatedTags.length,
            tags: accumulatedTags
        });

        if (accumulatedTags.length > 0) {
            console.log('✅ Processing tags after choice:', accumulatedTags);
            processGameActionTags(accumulatedTags, this.ui);
        } else {
            console.log('⚠️ No tags to process after choice');
        }

        // Display accumulated NPC messages one at a time with typing indicator. As in
        // _presentOutput, lines not yet typed are kept in _pendingNpcMessages, so closing
        // the phone mid-typeout puts them in the thread rather than losing them.
        this._pendingNpcMessages = accumulatedMessages.filter(m => m.trim()).map(m => m.trim());
        for (let i = 0; i < accumulatedMessages.length; i++) {
            const message = accumulatedMessages[i];
            if (!message.trim()) continue;
            if (!(await this._showStoryLine(message, TYPING_DELAY_MS))) return;
            this._pendingNpcMessages.shift();
            if (i < accumulatedMessages.length - 1) await delay(INTER_MESSAGE_MS);
        }
        this._pendingNpcMessages = [];

        // Check if the story output contains the exit_conversation tag
        const shouldExit = accumulatedTags.some(tag => tag.includes('exit_conversation'));

        // If this was an exit choice, close the minigame
        if (shouldExit) {
            console.log('🚪 Exit conversation tag detected - closing minigame');

            // Save state before closing
            this.saveStoryState();

            // Complete immediately - don't delay, as this might trigger an event-driven cutscene
            // that needs to start right after this minigame closes
            this.complete(true);
            return;
        }

        // Check if conversation ended AFTER displaying the final text
        if (lastResult.hasEnded) {
            console.log('🏁 Conversation ended');
            this.ui.showNotification('Conversation ended', 'info');
            this.isConversationActive = false;
            return;
        }

        // Display choices if available
        if (lastResult.choices && lastResult.choices.length > 0) {
            this.ui.addChoices(lastResult.choices);
        } else if (!lastResult.canContinue) {
            // No more content and no choices - end conversation
            console.log('🏁 No more choices available');
            this.isConversationActive = false;
        }

        // Save story state for resuming later
        this.saveStoryState();
    }
    
    /**
     * Save the current Ink story state to NPC data
     */
    saveStoryState() {
        if (!this.conversation || !this.currentNPCId) {
            return;
        }
        
        const npc = this.npcManager.getNPC(this.currentNPCId);
        if (npc) {
            const state = this.conversation.saveState();
            npc.storyState = state;
            // Only once the player has opened the chat (not at preload), so an
            // intro's deferred tags have run before its flags reach the server
            window.npcConversationStateManager?.recordInkVariables?.(this.currentNPCId, this.conversation.engine?.story);
            console.log('💾 Saved story state for', this.currentNPCId);
        }
    }
    
    /**
     * The story runs ahead of the typeout: its tags and global changes are applied before the
     * first message appears. If the phone is closed (or the contact list reopened) before the
     * messages have all been typed, put the rest in the thread and save the story position now.
     * Otherwise the player never sees them, and a reopen finds an empty history and runs the
     * knot again against the changed globals (m02: Ghost's "You found it." was replaced by his
     * return text, because the Planted Network Device pickup opens his phone twice in 500 ms).
     */
    _flushPendingMessages() {
        this._typeoutRun = (this._typeoutRun || 0) + 1;   // any typeout still running stops
        const pending = this._pendingNpcMessages;
        this._pendingNpcMessages = [];
        if (!pending || pending.length === 0 || !this.currentNPCId) return;
        pending.forEach(text => this.npcManager.addMessage(this.currentNPCId, 'npc', text));
        const npc = this.npcManager.getNPC(this.currentNPCId);
        if (npc && this.conversation) npc.storyState = this.conversation.saveState();
    }
    
    /**
     * Emit conversation_closed:<npcId>, matching person-chat, so timed messages and
     * event mappings keyed on it fire for phone contacts too.
     * @param {string|null} npcId - NPC whose conversation just closed
     */
    _emitConversationClosed(npcId) {
        if (!npcId || !this.conversation || !window.eventDispatcher) return;
        window.eventDispatcher.emit(`conversation_closed:${npcId}`, {
            npcId,
            timestamp: Date.now()
        });
        console.log(`📢 Emitted event: conversation_closed:${npcId}`);
    }
    
    /**
     * Close the current conversation and return to contact list
     */
    closeConversation() {
        console.log('🔙 Closing conversation');
        
        this._flushPendingMessages();
        this._emitConversationClosed(this.currentNPCId);
        this.isConversationActive = false;
        this.currentNPCId = null;
        this.conversation = null;
        this.history = null;
        
        // Show contact list
        this.ui.showContactList(this.phoneId);
    }
    
    /**
     * Save contact list to notepad
     */
    saveContactListToNotepad() {
        console.log('📝 Saving contact list to notepad');
        
        if (!this.npcManager || !window.startNotesMinigame) {
            console.warn('Cannot save to notepad: missing dependencies');
            return;
        }
        
        // Get all NPCs for this phone
        let npcs = this.npcManager.getNPCsByPhone(this.phoneId);
        
        // Filter to only allowed NPCs if specified
        if (this.allowedNpcIds && this.allowedNpcIds.length > 0) {
            npcs = npcs.filter(npc => this.allowedNpcIds.includes(npc.id));
        }
        
        if (!npcs || npcs.length === 0) {
            console.warn('No contacts to save');
            return;
        }
        
        // Format contact list
        let content = `CONTACTS\n`;
        content += `${'='.repeat(30)}\n\n`;
        
        npcs.forEach(npc => {
            const unreadCount = this.history ? this.history.getUnreadCount() : 0;
            const statusText = unreadCount > 0 ? ` (${unreadCount} unread)` : '';
            content += `• ${npc.displayName || npc.id}${statusText}\n`;
        });
        
        content += `\n${'='.repeat(30)}\n`;
        content += `Phone: ${this.params.title || 'Phone'}\n`;
        content += `Date: ${new Date().toLocaleString()}`;
        
        // Store phone state for return
        window.pendingPhoneReturn = {
            phoneId: this.phoneId,
            title: this.params.title,
            params: this.params
        };
        
        // Create note item
        const noteItem = {
            scenarioData: {
                type: 'note',
                name: 'Contact List',
                text: content,
                observations: `Contact list from ${this.params.title || 'phone'}.`
            }
        };
        
        // Start notes minigame
        window.startNotesMinigame(
            noteItem,
            content,
            `Contact list from ${this.params.title || 'phone'}.`,
            null,
            false,
            true
        );
    }
    
    /**
     * Save current conversation to notepad
     */
    saveConversationToNotepad() {
        console.log('📝 Saving conversation to notepad');
        
        if (!this.currentNPCId || !this.history || !window.startNotesMinigame) {
            console.warn('Cannot save conversation: no active conversation or missing dependencies');
            return;
        }
        
        const npc = this.npcManager.getNPC(this.currentNPCId);
        if (!npc) {
            console.warn('Cannot find NPC for conversation');
            return;
        }
        
        // Get conversation history
        const messages = this.history.loadHistory();
        
        if (!messages || messages.length === 0) {
            console.warn('No messages to save');
            return;
        }
        
        // Format conversation
        const npcName = npc.displayName || npc.id;
        let content = `CONVERSATION WITH ${npcName.toUpperCase()}\n`;
        content += `${'='.repeat(30)}\n\n`;
        
        messages.forEach(original => {
            const message = { ...original, ...displayPhoneLine(original.type, original.text, npc) };
            if (message.type === 'npc') {
                content += `${npcName}: ${message.text}\n\n`;
            } else if (message.type === 'player') {
                content += `You: ${message.text}\n\n`;
            } else if (message.type === 'narrator') {
                content += `[${message.text}]\n\n`;
            } else if (message.type === 'choice') {
                content += `> ${message.text}\n\n`;
            }
        });
        
        content += `${'='.repeat(30)}\n`;
        content += `Phone: ${this.params.title || 'Phone'}\n`;
        content += `Date: ${new Date().toLocaleString()}`;
        
        // Store phone state for return
        window.pendingPhoneReturn = {
            phoneId: this.phoneId,
            title: this.params.title,
            params: this.params,
            returnToNPC: this.currentNPCId // Remember which conversation to return to
        };
        
        // Create note item
        const noteItem = {
            scenarioData: {
                type: 'note',
                name: `Chat: ${npcName}`,
                text: content,
                observations: `Conversation history with ${npcName}.`
            }
        };
        
        // Start notes minigame
        window.startNotesMinigame(
            noteItem,
            content,
            `Conversation history with ${npcName}.`,
            null,
            false,
            true
        );
    }
    
    /**
     * Process game action tags from Ink story
     * Tags format: # unlock_door:ceo, # give_item:keycard, etc.
     * @param {Array<string>} tags - Array of tag strings from Ink
     */
    // Note: processGameActionTags has been moved to ../helpers/chat-helpers.js
    // and is now shared with person-chat-minigame.js to avoid code duplication
    
    /**
     * Complete the minigame
     * @param {boolean} success - Whether minigame was successful
     */
    complete(success) {
        console.log('📱 PhoneChatMinigame completing', { success });
        
        // Clean up conversation
        this.isConversationActive = false;
        
        // Update phone badge in inventory
        if (window.updatePhoneBadge && this.phoneId) {
            window.updatePhoneBadge(this.phoneId);
        }
        
        // Call parent complete
        super.complete(success);
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        console.log('🧹 PhoneChatMinigame cleaning up');
        
        // A conversation still open at teardown counts as closed (closeConversation()
        // clears currentNPCId/conversation, so this can't double-emit)
        this._flushPendingMessages();
        this._emitConversationClosed(this.currentNPCId);
        
        if (this.ui) {
            this.ui.cleanup();
        }
        
        this.isConversationActive = false;
        this.conversation = null;
        this.history = null;
        
        // Clear NPC context
        window.currentConversationNPCId = null;
        
        // Call parent cleanup
        super.cleanup();
    }
}

/**
 * Return to phone-chat after notes minigame
 * Called by notes minigame when user closes it and needs to return to phone
 */
export function returnToPhoneAfterNotes() {
    console.log('Returning to phone-chat after notes minigame');
    
    // Check if there's a pending phone return
    if (window.pendingPhoneReturn) {
        const phoneState = window.pendingPhoneReturn;
        
        // Clear the pending return state
        window.pendingPhoneReturn = null;
        
        // Restart the phone-chat minigame with the saved state
        if (window.MinigameFramework) {
            const params = { ...(phoneState.params || {
                phoneId: phoneState.phoneId || 'default_phone',
                title: phoneState.title || 'Phone'
            }) };
            // Coming back from the notepad is a reopen; don't jump to (and re-run) the knot
            // the phone was first opened at
            delete params.startKnot;
            
            // If we need to return to a specific conversation, add callback
            if (phoneState.returnToNPC) {
                params.onInit = (minigame) => {
                    // Wait a bit for UI to render, then open the conversation
                    setTimeout(() => {
                        minigame.openConversation(phoneState.returnToNPC);
                    }, 100);
                };
            }
            
            window.MinigameFramework.startMinigame('phone-chat', null, params);
        }
    }
}

// Export for module usage
export default PhoneChatMinigame;
