/**
 * PersonChatUI - UI Component for Person-Chat Minigame (Background Portrait Layout)
 * 
 * Handles rendering of conversation interface with:
 * - Portrait filling background
 * - Dialogue as caption subtitle at bottom 1/3
 * - Choices displayed below dialogue
 * - Continue button
 * - Pixel-art styling
 * 
 * @module person-chat-ui
 */

import PersonChatPortraits from './person-chat-portraits.js';
import { displayDashes } from '../../utils/display-dashes.js';

export default class PersonChatUI {
    /**
     * Create UI component
     * @param {HTMLElement} container - Container for UI
     * @param {Object} params - Configuration (game, npc, playerSprite, characters)
     * @param {NPCManager} npcManager - NPC manager for sprite access
     */
    constructor(container, params, npcManager) {
        this.container = container;
        this.params = params;
        this.npcManager = npcManager;
        this.game = params.game;
        this.npc = params.npc;
        this.playerSprite = params.playerSprite;
        this.playerData = params.playerData || {};
        this.characters = params.characters || {}; // Multi-character support
        this.background = params.background; // Optional background image path
        this.videoCall = params.videoCall || false; // Render as a framed video call with a self-view PiP
        
        // UI elements
        this.elements = {
            root: null,
            mainContent: null,
            portraitSection: null,
            portraitContainer: null,
            portraitLabel: null,
            captionArea: null,
            speakerName: null,
            dialogueBox: null,
            dialogueText: null,
            choicesContainer: null,
            continueButton: null
        };
        
        // Portrait renderer
        this.portraitRenderer = null;

        // Video-call extras (only used when this.videoCall is true)
        this.pipRenderer = null;        // Second portrait renderer showing the player's self-view
        this.callTimerInterval = null;  // Interval driving the mm:ss call timer in the status bar
        this.callStartTime = null;
        
        // State
        this.currentSpeaker = null; // Character ID
        this.hasContinued = false; // Track if user has clicked continue

        // Notification stack container (created on first use)
        this._notificationContainer = null;
        this.charactersWithParallax = new Set(); // Track which characters have already had parallax animation
        // The portrait opens hidden while the story loads, so a conversation that
        // opens on a scene shot (Background[...] / Narrator[none]) doesn't flash the
        // NPC first. The first line or choices bring the character in (revealPortrait).
        this.awaitingFirstContent = true;
        
        console.log('📱 PersonChatUI created');
    }
    
    /**
     * Render the complete UI structure
     */
    render() {
        try {
            this.container.innerHTML = '';
            
            // Create root container
            this.elements.root = document.createElement('div');
            this.elements.root.className = 'person-chat-root' + (this.videoCall ? ' video-call-mode' : '');

            // Create main content area (portrait fills background + caption at bottom)
            this.createMainContent();

            // Add to container
            this.container.appendChild(this.elements.root);

            // Initialize portrait renderer
            this.initializePortrait();

            // Video-call framing: status bar + self-view picture-in-picture
            if (this.videoCall) {
                this.initVideoCallOverlay();
            }

            console.log('✅ PersonChatUI rendered');
        } catch (error) {
            console.error('❌ Error rendering UI:', error);
        }
    }
    
    /**
     * Create main content area with portrait background and dialogue caption
     */
    createMainContent() {
        const mainContent = document.createElement('div');
        mainContent.className = 'person-chat-main-content';
        
        // Portrait section - fills background
        const portraitSection = document.createElement('div');
        portraitSection.className = 'person-chat-portrait-section';
        
        const portraitLabel = document.createElement('div');
        portraitLabel.className = 'person-chat-portrait-label';
        portraitLabel.textContent = this.npc?.displayName || 'NPC';
        
        const portraitContainer = document.createElement('div');
        portraitContainer.className = 'person-chat-portrait-canvas-container';
        portraitContainer.id = 'portrait-container';
        
        portraitSection.appendChild(portraitLabel);
        portraitSection.appendChild(portraitContainer);
        
        // Caption area - positioned at bottom with dialogue and choices
        const captionArea = document.createElement('div');
        captionArea.className = 'person-chat-caption-area';
        
        // Inner content wrapper - constrained to max-width
        const captionContent = document.createElement('div');
        captionContent.className = 'person-chat-caption-content';
        
        // Talk right area - speaker name + dialogue
        const talkRightArea = document.createElement('div');
        talkRightArea.className = 'person-chat-talk-right';
        
        const speakerName = document.createElement('div');
        speakerName.className = 'person-chat-speaker-name';
        
        // Dialogue box (spans full width below header)
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'person-chat-dialogue-box';
        
        const dialogueText = document.createElement('p');
        dialogueText.className = 'person-chat-dialogue-text';
        dialogueText.id = 'dialogue-text';
        
        dialogueBox.appendChild(dialogueText);
        
        // Assemble talk-right area
        talkRightArea.appendChild(speakerName);
        talkRightArea.appendChild(dialogueBox);
        
        // Controls area - continue button + choices
        const controlsArea = document.createElement('div');
        controlsArea.className = 'person-chat-controls-area';
        
        // Continue button
        const continueButton = document.createElement('button');
        continueButton.className = 'person-chat-continue-button';
        continueButton.innerHTML = `
          <span class="person-chat-continue-label">Skip</span>
          <span class="person-chat-continue-hint">[SPACE]</span>
        `;
        continueButton.id = 'continue-button';
        continueButton.style.display = 'inline-block'; // Always visible (hidden only when choices shown)
        
        controlsArea.appendChild(continueButton);
        
        // Choices container (in controls area, below continue button)
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'person-chat-choices-container';
        choicesContainer.id = 'choices-container';
        choicesContainer.style.display = 'none';
        
        controlsArea.appendChild(choicesContainer);
        
        // Assemble caption content: talk-right, controls
        captionContent.appendChild(talkRightArea);
        captionContent.appendChild(controlsArea);
        
        // Add content wrapper to caption area
        captionArea.appendChild(captionContent);
        
        // Assemble main content
        mainContent.appendChild(portraitSection);
        mainContent.appendChild(captionArea);
        
        this.elements.mainContent = mainContent;
        this.elements.portraitSection = portraitSection;
        this.elements.portraitContainer = portraitContainer;
        this.elements.portraitLabel = portraitLabel;
        this.elements.captionArea = captionArea;
        this.elements.talkRightArea = talkRightArea;
        this.elements.speakerName = speakerName;
        this.elements.dialogueBox = dialogueBox;
        this.elements.dialogueText = dialogueText;
        this.elements.controlsArea = controlsArea;
        this.elements.continueButton = continueButton;
        this.elements.choicesContainer = choicesContainer;
        
        this.elements.root.appendChild(mainContent);
    }
    
    /**
     * Initialize portrait renderer
     */
    initializePortrait() {
        try {
            if (!this.game || !this.npc) {
                console.warn('⚠️ Missing game or NPC, skipping portrait initialization');
                return;
            }
            
            // Pass the actual NPC object so it has all properties including spriteTalk
            this.portraitRenderer = new PersonChatPortraits(
                this.game,
                this.npc,
                this.elements.portraitContainer,
                this.background // Optional background image path
            );
            // Hidden until the first content (see awaitingFirstContent). Set before
            // init() so its first deferred render draws the background only.
            this.portraitRenderer._characterHidden = true;
            this.portraitRenderer.init();
            
            console.log('✅ Portrait initialized');
        } catch (error) {
            console.error('❌ Error initializing portrait:', error);
        }
    }

    /**
     * Build the video-call chrome: a framed border, a top status bar (LIVE dot, secure-link
     * label, NPC name, running call timer) and a picture-in-picture self-view of the player.
     *
     * The self-view is a second PersonChatPortraits bound to the player's talk sprite. It has no
     * TTS wired to it, so it renders the first frame (mouth closed) statically — a "camera" of the
     * player listening. Placed TOP-LEFT: NPC portraits render shifted to the right of the canvas,
     * so the left corner is clear, and the caption owns the bottom third.
     */
    initVideoCallOverlay() {
        try {
            const npcName = this.npc?.displayName || 'CONTACT';

            // --- Status bar ---
            const statusBar = document.createElement('div');
            statusBar.className = 'person-chat-vc-statusbar';
            statusBar.innerHTML = `
                <span class="person-chat-vc-live"><span class="person-chat-vc-dot"></span>LIVE</span>
                <span class="person-chat-vc-link">SECURE VIDEO LINK</span>
                <span class="person-chat-vc-peer"></span>
                <span class="person-chat-vc-timer" id="vc-timer">00:00</span>
            `;
            // Set the (scenario-authored) peer name via textContent so a displayName containing
            // <, & or " can't break out of the markup.
            statusBar.querySelector('.person-chat-vc-peer').textContent = npcName;
            this.elements.root.appendChild(statusBar);
            this.elements.vcStatusBar = statusBar;
            this.elements.vcTimer = statusBar.querySelector('#vc-timer');

            // --- Picture-in-picture self-view (player) ---
            const pip = document.createElement('div');
            pip.className = 'person-chat-pip';

            const pipCanvasContainer = document.createElement('div');
            pipCanvasContainer.className = 'person-chat-pip-canvas';

            const pipLabel = document.createElement('div');
            pipLabel.className = 'person-chat-pip-label';
            pipLabel.textContent = 'YOU';

            pip.appendChild(pipCanvasContainer);
            pip.appendChild(pipLabel);
            this.elements.root.appendChild(pip);
            this.elements.pip = pip;

            // Player self-view renderer. Build a player-shaped NPC object for the renderer so it
            // resolves the player's talk sprite and stays static (frame 0) with the face centred.
            const playerNpc = {
                id: 'player',
                displayName: this.playerData.displayName || 'You',
                spriteSheet: this.playerData.spriteSheet || 'hacker',
                spriteTalk: this.playerData.spriteTalk || null,
                spriteConfig: this.playerData.spriteConfig || {}
            };
            this.pipRenderer = new PersonChatPortraits(
                this.game,
                playerNpc,
                pipCanvasContainer,
                null,                                  // no background in the PiP
                { noShift: true, sizeToContainer: true } // centre the face; size to the small box
            );
            this.pipRenderer.init();

            // --- Call timer ---
            this.callStartTime = Date.now();
            const tick = () => {
                if (!this.elements.vcTimer) return;
                const s = Math.floor((Date.now() - this.callStartTime) / 1000);
                const mm = String(Math.floor(s / 60)).padStart(2, '0');
                const ss = String(s % 60).padStart(2, '0');
                this.elements.vcTimer.textContent = `${mm}:${ss}`;
            };
            tick();
            this.callTimerInterval = setInterval(tick, 1000);

            console.log('📹 Video-call overlay initialised');
        } catch (error) {
            console.error('❌ Error initializing video-call overlay:', error);
        }
    }

    /**
     * Display dialogue text with speaker
     * @param {string} text - Dialogue text to display
     * @param {string} characterId - Character ID ('player', 'npc', or specific NPC ID)
     * @param {boolean} preserveChoices - If true, don't hide existing choices
     * @param {boolean} isNarrator - PHASE 4: If true, display as narrator mode (centered, no speaker name)
     * @param {string} narratorCharacter - PHASE 4: For Narrator[character]: format, character to show portrait of
     */
    showDialogue(text, characterId = 'npc', preserveChoices = false, isNarrator = false, narratorCharacter = null) {
        this.currentSpeaker = characterId;

        // An opening Narrator[none] keeps the scene shot; anything else brings the NPC in
        if (!(isNarrator && narratorCharacter === 'none')) {
            this.revealPortrait();
        } else {
            this.awaitingFirstContent = false;
        }
        
        console.log(`📝 showDialogue called with character: ${characterId}, text length: ${text?.length || 0}, narrator: ${isNarrator}`);
        
        // PHASE 4: Handle narrator mode
        if (isNarrator) {
            // Narrator mode - centered text, no speaker name
            this.elements.portraitSection.className = 'person-chat-portrait-section narrator-mode';
            this.elements.speakerName.className = 'person-chat-speaker-name narrator-speaker';
            this.elements.portraitLabel.textContent = ''; // No label in narrator mode
            this.elements.speakerName.textContent = 'Narrator'; // Hidden by CSS but available

            // Suppress mouth animation on current portrait
            if (this.portraitRenderer) {
                this.portraitRenderer.setNarratorMode(true);
            }

            // Narrator[none]: the background alone. Otherwise, if narratorCharacter
            // is specified, switch to that character's portrait
            if (narratorCharacter === 'none') {
                this.portraitRenderer?.setCharacterHidden(true);
            } else if (narratorCharacter) {
                const character = this.characters[narratorCharacter];
                if (character) {
                    this.updatePortraitForSpeaker(narratorCharacter, character);
                }
            }
            // Otherwise keep whatever is showing (a scene shot stays a scene shot)

            console.log(`📝 Narrator mode: character=${narratorCharacter}, portrait preserved=${!narratorCharacter}`);
        } else {
            // Normal dialogue mode — ensure narrator mode is cleared
            if (this.portraitRenderer) {
                this.portraitRenderer.setNarratorMode(false);
            }

            // Get character data
            let character = this.characters[characterId];
            if (!character) {
                // Fallback for legacy speaker values or main NPC ID
                if (characterId === 'player') {
                    character = this.playerData;
                } else if (characterId === 'npc' || !characterId) {
                    character = this.npc;
                } else if (characterId === this.npc?.id) {
                    // Main NPC passed by ID - use main NPC data
                    character = this.npc;
                }
            }
            
            // Determine display name
            // If no character found, use the character ID itself formatted as display name
            const displayName = character?.displayName || (characterId === 'player' ? 'You' : 
                characterId === 'npc' ? 'NPC' : 
                // Format character ID: convert snake_case or camelCase to Title Case
                characterId.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            
            const speakerType = characterId === 'player' ? 'player' : 'npc';
            
            this.elements.portraitLabel.textContent = displayName;
            this.elements.speakerName.textContent = displayName;
            
            console.log(`📝 Set speaker name to: ${displayName}`);
            
            // Update speaker styling
            this.elements.portraitSection.className = `person-chat-portrait-section speaker-${speakerType}`;
            this.elements.speakerName.className = `person-chat-speaker-name ${speakerType}-speaker`;
            
            // Reset portrait for new speaker
            this.updatePortraitForSpeaker(characterId, character);
        }
        
        // Update dialogue text
        // " -- " shows as an en dash; the caller's text (and TTS input) is unchanged
        this.elements.dialogueText.textContent = displayDashes(text);
        
        console.log(`📝 Set dialogue text, element content: "${this.elements.dialogueText.textContent}"`);
        
        // Hide choices only if not preserving them (i.e., when transitioning from choices back to text)
        if (!preserveChoices) {
            this.hideChoices();
        }
        
        // Reset continue button state
        this.hasContinued = false;
    }
    
    /**
     * Show the character held back while the conversation loaded. Only acts
     * once, on the first content; after that scene shots are driven by the ink.
     */
    revealPortrait() {
        if (!this.awaitingFirstContent) return;
        this.awaitingFirstContent = false;
        this.portraitRenderer?.setCharacterHidden(false);
    }

    /**
     * Update portrait for the current speaker
     * @param {string} characterId - Character ID
     * @param {Object} character - Character data
     */
    updatePortraitForSpeaker(characterId, character) {
        try {
            if (!this.portraitRenderer || !character) {
                return;
            }

            // A speaker brings a character back after a scene shot
            this.portraitRenderer.setCharacterHidden(false);

            // Video-call mode: the player never takes over the main frame — they live in the PiP
            // self-view. Keep the remote party (NPC) on-screen even while the player's line shows,
            // which is how a real video call looks and avoids two copies of the player's avatar.
            if (this.videoCall && (characterId === 'player' || character.id === 'player')) {
                return;
            }

            // Update sprite data for current speaker
            if (characterId === 'player' || character.id === 'player') {
                // Create player object for portrait rendering
                this.portraitRenderer.npc = {
                    id: 'player',
                    displayName: character.displayName || 'Agent 0x00',
                    spriteSheet: character.spriteSheet || 'hacker',
                    spriteTalk: character.spriteTalk || null,
                    spriteConfig: character.spriteConfig || {}
                };
            } else {
                // Use NPC character object
                this.portraitRenderer.npc = character;
            }
            
            this.portraitRenderer.setupSpriteInfo();
            
            // Reset parallax animation only for characters we haven't seen before
            const speakerId = characterId || character.id;
            if (this.portraitRenderer.backgroundImage && !this.charactersWithParallax.has(speakerId)) {
                this.portraitRenderer.resetParallaxAnimation();
                this.charactersWithParallax.add(speakerId);
            }
            
            this.portraitRenderer.render();
        } catch (error) {
            console.error('❌ Error updating portrait:', error);
        }
    }
    
    /**
     * Display choice buttons
     * @param {Array} choices - Array of choice objects {text, index}
     */
    showChoices(choices) {
        if (!this.elements.choicesContainer || !this.elements.continueButton) {
            return;
        }

        // A conversation that opens straight on choices still shows the NPC
        this.revealPortrait();
        
        // Clear existing choices
        this.elements.choicesContainer.innerHTML = '';
        
        if (!choices || choices.length === 0) {
            this.elements.choicesContainer.style.display = 'none';
            this.elements.continueButton.style.display = 'inline-block';
            return;
        }
        
        // Hide continue button and show choices
        this.elements.continueButton.style.display = 'none';
        this.elements.choicesContainer.style.display = 'flex';
        
        // Create button for each choice (up to 9 choices can have number shortcuts)
        choices.forEach((choice, idx) => {
            const choiceButton = document.createElement('button');
            choiceButton.className = 'person-chat-choice-button';
            choiceButton.dataset.index = idx;
            
            // Add number prefix for choices 1-9
            if (idx < 9) {
                choiceButton.textContent = `${idx + 1}. ${displayDashes(choice.text)}`;
            } else {
                choiceButton.textContent = displayDashes(choice.text);
            }
            
            this.elements.choicesContainer.appendChild(choiceButton);
        });
        
        console.log(`✅ Displayed ${choices.length} choices`);
    }
    
    /**
     * Hide choices and restore continue button
     */
    hideChoices() {
        if (this.elements.choicesContainer && this.elements.continueButton) {
            this.elements.choicesContainer.innerHTML = '';
            this.elements.choicesContainer.style.display = 'none';
            this.elements.continueButton.style.display = 'inline-block';
        }
    }
    
    /**
     * Get choice button elements for event binding
     * @returns {Array} Array of choice button elements
     */
    getChoiceButtons() {
        return Array.from(this.elements.choicesContainer?.querySelectorAll('.person-chat-choice-button') || []);
    }
    
    /**
     * Clear dialogue and reset UI
     */
    /**
     * Show the continue button to indicate player can advance
     * @param {Function} onContinueClick - Callback when continue button is clicked
     */
    showContinueButton(onContinueClick) {
        if (!this.elements.continueButton) {
            return;
        }
        
        this.elements.continueButton.style.display = 'inline-block';
        
        // Remove any existing listeners
        const newButton = this.elements.continueButton.cloneNode(true);
        this.elements.continueButton.parentNode.replaceChild(newButton, this.elements.continueButton);
        this.elements.continueButton = newButton;
        
        // Add click listener
        if (onContinueClick) {
            this.elements.continueButton.addEventListener('click', onContinueClick);
        }
    }
    
    /**
     * Hide the continue button
     */
    hideContinueButton() {
        if (this.elements.continueButton) {
            this.elements.continueButton.style.display = 'none';
        }
    }
    
    reset() {
        this.currentSpeaker = null;
        this.hasContinued = false;
        
        if (this.elements.dialogueText) {
            this.elements.dialogueText.textContent = '';
        }
        if (this.elements.choicesContainer) {
            this.elements.choicesContainer.innerHTML = '';
            this.elements.choicesContainer.style.display = 'none';
        }
    }
    
    /**
     * Tear down renderers, timers and listeners. Called from the minigame's cleanup() so the
     * portrait renderers (including the video-call PiP) release their resize listeners / rAF loops.
     */
    destroy() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
        if (this.pipRenderer) {
            this.pipRenderer.destroy();
            this.pipRenderer = null;
        }
        if (this.portraitRenderer) {
            this.portraitRenderer.destroy();
            this.portraitRenderer = null;
        }
    }

    /**
     * Show a notification message with auto-fade
     * @param {string} message - Message to display
     * @param {string} type - Type of notification: 'info', 'success', 'warning', 'error'
     * @param {number} duration - Duration to show message (ms)
     */
    showNotification(message, type = 'info', duration = 2000) {
        // Create the shared stack container on first use
        if (!this._notificationContainer) {
            this._notificationContainer = document.createElement('div');
            this._notificationContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(this._notificationContainer);
        }

        const borderColor = type === 'success' ? '#27ae60'
                          : type === 'warning'  ? '#f39c12'
                          : type === 'error'    ? '#e74c3c'
                          : '#2980b9';

        const notification = document.createElement('div');
        notification.className = `person-chat-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            padding: 20px 40px;
            background: rgba(0, 0, 0, 0.9);
            color: ${borderColor};
            border: 2px solid ${borderColor};
            border-radius: 4px;
            font-family: 'VT323', monospace;
            font-size: 18px;
            text-align: center;
            max-width: 80vw;
            word-wrap: break-word;
            opacity: 0;
            transition: opacity 0.2s ease-in;
        `;

        // Prepend so new messages appear at the top, pushing older ones down
        this._notificationContainer.prepend(notification);

        // Fade in
        requestAnimationFrame(() => { notification.style.opacity = '1'; });

        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s ease-out';
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
                if (this._notificationContainer.children.length === 0) {
                    this._notificationContainer.remove();
                    this._notificationContainer = null;
                }
            }, 300);
        }, duration);
    }
}

