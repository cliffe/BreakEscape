/**
 * PhoneChatUI - UI Rendering and Management
 * 
 * Manages the phone chat UI, rendering contact lists, conversation views,
 * message bubbles, and choice buttons. Based on phone-messages minigame visual style.
 * 
 * @module phone-chat-ui
 */

import { ASSETS_PATH } from '../../config.js';
import TTSManager from '../../systems/tts-manager.js';
import MusicController from '../../music/music-controller.js';
import { displayPhoneLine } from './phone-chat-speaker.js';
import { displayDashes } from '../../utils/display-dashes.js';

export default class PhoneChatUI {
    /**
     * Create a PhoneChatUI instance
     * @param {HTMLElement} container - Container element for the UI
     * @param {Object} params - Configuration parameters
     * @param {Object} npcManager - NPCManager instance
     * @param {Array<string>} allowedNpcIds - Optional array of NPC IDs to show (filters contact list)
     */
    constructor(container, params, npcManager, allowedNpcIds = null) {
        if (!container) {
            throw new Error('PhoneChatUI requires a container element');
        }
        
        this.container = container;
        this.params = params || {};
        this.isTerminalTheme = this.params.theme === 'terminal';
        this._typewriterCancel = null;
        this.npcManager = npcManager;
        this.allowedNpcIds = allowedNpcIds;  // Filter contacts to only these NPCs if provided
        this.currentView = 'contact-list'; // 'contact-list' or 'conversation'
        this.currentNPCId = null;
        this.elements = {};
        
        // Server TTS (primary)
        this.ttsManager = new TTSManager();

        // Browser speech synthesis (fallback)
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.isPlaying = false;
        this.currentPlayButton = null;
        this.speechAvailable = !!this.speechSynthesis;
        this.selectedVoice = null;
        this.voiceSettings = {
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0
        };

        // Setup voice selection for fallback
        if (this.speechAvailable) {
            this.setupVoiceSelection();
        }
        
        console.log('📱 PhoneChatUI initialized', { allowedNpcIds });
    }
    
    /**
     * Render the complete phone UI structure
     * Matches phone-messages-minigame.js structure
     */
    render() {
        this.container.innerHTML = `
            <div class="phone-messages-container">
                <div class="phone-screen">
                    <div class="phone-header">
                        <div class="signal-bars">
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                        </div>
                        <div class="battery">85%</div>
                    </div>
                    
                    <!-- Contact List View -->
                    <div class="contact-list-view" id="contact-list-view">
                        <div class="contact-list-header">
                            <h3>Messages</h3>
                        </div>
                        <div class="contact-list" id="contact-list">
                            <!-- Contacts will be populated here -->
                        </div>
                    </div>
                    
                    <!-- Conversation View -->
                    <div class="conversation-view" id="conversation-view" style="display: none;">
                        <div class="conversation-header" id="conversation-header">
                            <button class="back-button" id="back-button">←</button>
                            <div class="conversation-info">
                                <span class="npc-name" id="npc-name"></span>
                            </div>
                        </div>
                        <div class="messages-container" id="messages-container">
                            <!-- Message bubbles will be added here -->
                        </div>
                        <div class="typing-indicator" id="typing-indicator" style="display: none;">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div class="choices-container" id="choices-container">
                            <!-- Choice buttons will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (this.isTerminalTheme) {
            this.container.querySelector('.phone-messages-container')
                .classList.add('phone-terminal-theme');
        }

        // Store element references
        this.elements = {
            contactListView: document.getElementById('contact-list-view'),
            contactList: document.getElementById('contact-list'),
            conversationView: document.getElementById('conversation-view'),
            conversationHeader: document.getElementById('conversation-header'),
            npcName: document.getElementById('npc-name'),
            backButton: document.getElementById('back-button'),
            messagesContainer: document.getElementById('messages-container'),
            typingIndicator: document.getElementById('typing-indicator'),
            choicesContainer: document.getElementById('choices-container')
        };
        
        console.log('✅ Phone UI rendered');
    }
    
    /**
     * Setup voice selection for speech synthesis
     */
    setupVoiceSelection() {
        if (!this.speechSynthesis) return;
        
        const voices = this.speechSynthesis.getVoices();
        console.log('🎤 Initial voices count:', voices.length);
        
        if (voices.length === 0) {
            // Wait for voices to load
            this.speechSynthesis.addEventListener('voiceschanged', () => {
                console.log('🎤 Voices changed, count:', this.speechSynthesis.getVoices().length);
                this.selectBestVoice();
            });
            
            // Fallback: try again after a delay
            setTimeout(() => {
                const delayedVoices = this.speechSynthesis.getVoices();
                if (delayedVoices.length > 0) {
                    this.selectBestVoice();
                }
            }, 1000);
        } else {
            this.selectBestVoice();
        }
    }
    
    /**
     * Select the best available voice for speech synthesis
     */
    selectBestVoice() {
        if (!this.speechSynthesis) return;
        
        const voices = this.speechSynthesis.getVoices();
        console.log('🎤 Available voices:', voices.map(v => v.name));
        
        // Prefer natural-sounding voices
        const preferredVoices = [
            'Google UK English Female',
            'Google UK English Male',
            'Google US English',
            'Microsoft Zira Desktop',
            'Microsoft David Desktop',
            'en-US',
            'en-GB'
        ];
        
        for (const preferredName of preferredVoices) {
            const voice = voices.find(v => 
                v.name.includes(preferredName) || 
                v.lang.includes(preferredName)
            );
            if (voice) {
                this.selectedVoice = voice;
                console.log('🎤 Selected voice:', voice.name);
                return;
            }
        }
        
        // Fallback to first English voice
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            this.selectedVoice = englishVoice;
            console.log('🎤 Selected fallback voice:', englishVoice.name);
        }
    }
    
    /**
     * Play a voice message — tries server TTS first, falls back to browser speech synthesis
     * @param {string} text - Text to speak (already stripped of "voice:" prefix)
     * @param {HTMLElement} playButton - Play button element to update
     */
    async playVoiceMessage(text, playButton) {
        // If already playing, stop and return
        if (this.isPlaying) {
            this.stopVoiceMessage(playButton);
            return;
        }

        // --- Try server TTS first (only if NPC has a voice config) ---
        const npcId = this.currentNPCId;
        const npcData = npcId && this.npcManager.getNPC(npcId);
        const npcHasVoice = !!npcData?.voice;
        if (npcHasVoice) {
            // Apply this NPC's voice FX (e.g. Ghost's masked comms) so phone contacts match the video call.
            if (npcData.voice.fx) {
                this.ttsManager.setVoiceFX(npcId, npcData.voice.fx);
            }
            try {
                this.isPlaying = true;
                this.currentPlayButton = playButton;
                this.updatePlayButton(playButton, true);

                this.ttsManager.onEnded(() => {
                    this.isPlaying = false;
                    this.currentPlayButton = null;
                    this.updatePlayButton(playButton, false);
                });

                const duration = await this.ttsManager.play(npcId, text);
                if (duration !== null) {
                    console.log('🎤 Playing voice message via server TTS');
                    return;
                }
            } catch (e) {
                // fall through to speech synthesis
            }
            // TTS failed — reset state before fallback
            this.isPlaying = false;
            this.currentPlayButton = null;
            this.updatePlayButton(playButton, false);
        }


        // --- Fallback: browser speech synthesis ---
        if (!this.speechAvailable) {
            console.warn('🎤 Neither server TTS nor speech synthesis available');
            return;
        }

        this.speechSynthesis.cancel();

        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.rate = this.voiceSettings.rate;
        this.currentUtterance.pitch = this.voiceSettings.pitch;
        // Speech synthesis is outside Web Audio; approximate Voice × Master from music widget
        const st = MusicController.getState() || {};
        const vw = typeof st.voiceVolume === 'number' ? st.voiceVolume : 1;
        const mw = typeof st.masterVolume === 'number' ? st.masterVolume : 1;
        this.currentUtterance.volume = Math.max(0, Math.min(1, vw * mw * this.voiceSettings.volume));

        if (this.selectedVoice) {
            this.currentUtterance.voice = this.selectedVoice;
        }

        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
            this.currentPlayButton = playButton;
            this.updatePlayButton(playButton, true);
        };

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.currentPlayButton = null;
            this.updatePlayButton(playButton, false);
        };

        this.currentUtterance.onerror = (event) => {
            console.error('🎤 Speech synthesis error:', event);
            this.isPlaying = false;
            this.currentPlayButton = null;
            this.updatePlayButton(playButton, false);
        };

        try {
            this.speechSynthesis.speak(this.currentUtterance);
            console.log('🎤 Playing voice message via speech synthesis (fallback)');
        } catch (error) {
            console.error('🎤 Failed to start speech synthesis:', error);
            this.isPlaying = false;
            this.currentPlayButton = null;
            this.updatePlayButton(playButton, false);
        }
    }
    
    /**
     * Stop current voice message playback (TTS or speech synthesis)
     * @param {HTMLElement} playButton - Play button element to update
     */
    stopVoiceMessage(playButton) {
        this.ttsManager.stop();

        if (this.speechSynthesis && this.isPlaying) {
            this.speechSynthesis.cancel();
        }

        this.isPlaying = false;
        const btn = playButton || this.currentPlayButton;
        this.currentPlayButton = null;
        this.updatePlayButton(btn, false);
        console.log('🎤 Stopped voice message');
    }
    
    /**
     * Update play button appearance
     * @param {HTMLElement} playButton - Play button element
     * @param {boolean} playing - Whether message is playing
     */
    updatePlayButton(playButton, playing) {
        if (!playButton) return;
        
        if (playing) {
            // Show stop icon
            playButton.innerHTML = '<img src="/break_escape/assets/icons/stop.png" alt="Stop" class="icon">';
            playButton.title = 'Stop';
        } else {
            // Show play icon
            playButton.innerHTML = '<img src="/break_escape/assets/icons/play.png" alt="Play" class="icon">';
            playButton.title = 'Play';
        }
    }
    
    /**
     * Show the contact list view
     * @param {string} phoneId - Optional phone ID to filter contacts
     */
    showContactList(phoneId = null) {
        this.currentView = 'contact-list';
        this.currentNPCId = null;
        
        // Hide conversation, show contact list
        this.elements.conversationView.style.display = 'none';
        this.elements.contactListView.style.display = 'flex';
        
        // Populate contacts
        this.populateContactList(phoneId);
        
        console.log('📋 Showing contact list');
    }
    
    /**
     * Populate the contact list with NPCs
     * @param {string} phoneId - Optional phone ID to filter contacts
     */
    populateContactList(phoneId = null) {
        const contactList = this.elements.contactList;
        contactList.innerHTML = '';
        
        // Get NPCs for this phone
        let npcs;
        if (phoneId) {
            npcs = this.npcManager.getNPCsByPhone(phoneId);
        } else {
            // Get all NPCs (convert Map to array)
            npcs = Array.from(this.npcManager.npcs.values());
        }
        
        // Filter to only allowed NPCs if npcIds was specified
        if (this.allowedNpcIds && this.allowedNpcIds.length > 0) {
            console.log(`🔍 Filtering contacts: allowed NPCs = ${this.allowedNpcIds.join(', ')}`);
            npcs = npcs.filter(npc => {
                // Include if in allowed list
                if (this.allowedNpcIds.includes(npc.id)) {
                    return true;
                }
                // Include if has conversation history (i.e., has been activated by events)
                const history = this.npcManager.getConversationHistory(npc.id);
                return history && history.length > 0;
            });
            console.log(`✅ Filtered to ${npcs.length} contacts`);
        }
        
        if (!npcs || npcs.length === 0) {
            contactList.innerHTML = `
                <div class="no-contacts">
                    <p>No contacts available</p>
                </div>
            `;
            return;
        }
        
        // Create contact items
        npcs.forEach(npc => {
            const contactItem = this.createContactItem(npc);
            contactList.appendChild(contactItem);
        });
        
        console.log(`📋 Populated ${npcs.length} contacts`);
    }
    
    /**
     * Create a contact list item
     * @param {Object} npc - NPC data
     * @returns {HTMLElement} Contact item element
     */
    createContactItem(npc) {
        const history = this.npcManager.getConversationHistory(npc.id);
        // The preview is the last line that isn't narration ("Narrator: …" is no one's text)
        const isNarration = msg => displayPhoneLine(msg.type, msg.text, npc).type === 'narrator';
        let lastMessage = null;
        for (let i = history.length - 1; i >= 0; i--) {
            if (!isNarration(history[i])) { lastMessage = history[i]; break; }
        }
        const unreadCount = history.filter(msg => !msg.read && msg.type === 'npc').length;
        
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.dataset.npcId = npc.id;
        
        // Format last message preview
        let lastMessagePreview = 'No messages yet';
        let lastMessageTime = '';
        
        if (lastMessage) {
            const maxLength = 40;
            const line = displayPhoneLine(lastMessage.type, lastMessage.text, npc);
            const previewText = line.type === 'player' ? `You: ${line.text}` : line.text;
            lastMessagePreview = previewText.length > maxLength
                ? previewText.substring(0, maxLength) + '...'
                : previewText;
            lastMessageTime = this.formatTimestamp(lastMessage.timestamp);
        }
        
        // Resolve avatar path to full URL if relative
        let avatarSrc = npc.avatar;
        if (npc.avatar && !npc.avatar.startsWith('/') && !npc.avatar.startsWith('http')) {
            if (npc.avatar.startsWith('assets/')) {
                avatarSrc = `/break_escape/${npc.avatar}`;
            } else {
                avatarSrc = `${ASSETS_PATH}/${npc.avatar}`;
            }
        }

        contactItem.innerHTML = `
            <div class="contact-avatar">
                ${npc.avatar ? `<img src="${avatarSrc}" alt="${npc.displayName}">` : '👤'}
            </div>
            <div class="contact-info">
                <div class="contact-name">${npc.displayName || npc.id}</div>
                <div class="contact-last-message">${displayDashes(lastMessagePreview)}</div>
            </div>
            <div class="contact-meta">
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                <div class="contact-time">${lastMessageTime}</div>
            </div>
        `;
        
        return contactItem;
    }
    
    /**
     * Show conversation view with specific NPC
     * @param {string} npcId - NPC identifier
     */
    showConversation(npcId) {
        if (!npcId) {
            console.error('❌ No NPC ID provided');
            return;
        }
        
        const npc = this.npcManager.getNPC(npcId);
        if (!npc) {
            console.error(`❌ NPC not found: ${npcId}`);
            return;
        }
        
        this.currentView = 'conversation';
        this.currentNPCId = npcId;
        
        // Hide contact list, show conversation
        this.elements.contactListView.style.display = 'none';
        this.elements.conversationView.style.display = 'flex';
        
        // Update header with avatar
        this.updateHeader(npc.displayName || npc.id, npc.id);
        
        // Clear messages and choices
        this.elements.messagesContainer.innerHTML = '';
        this.elements.choicesContainer.innerHTML = '';
        
        console.log(`💬 Showing conversation with ${npc.displayName || npcId}`);
    }
    
    /**
     * Update the conversation header
     * @param {string} npcName - NPC display name
     * @param {string} npcId - NPC identifier
     */
    updateHeader(npcName, npcId) {
        const npc = this.npcManager.getNPC(npcId);
        
        // Clear and rebuild header content
        const conversationInfo = this.elements.conversationHeader.querySelector('.conversation-info');
        if (conversationInfo) {
            conversationInfo.innerHTML = '';
            
            // Add avatar if available
            if (npc?.avatar) {
                const avatarImg = document.createElement('img');
                // Resolve avatar path to full URL if relative
                let avatarSrc = npc.avatar;
                if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http')) {
                    if (avatarSrc.startsWith('assets/')) {
                        avatarSrc = `/break_escape/${avatarSrc}`;
                    } else {
                        avatarSrc = `${ASSETS_PATH}/${avatarSrc}`;
                    }
                }
                avatarImg.src = avatarSrc;
                avatarImg.alt = npcName;
                avatarImg.className = 'conversation-avatar';
                conversationInfo.appendChild(avatarImg);
            } else {
                // Placeholder avatar
                const avatarPlaceholder = document.createElement('div');
                avatarPlaceholder.className = 'conversation-avatar-placeholder';
                avatarPlaceholder.textContent = '👤';
                conversationInfo.appendChild(avatarPlaceholder);
            }
            
            // Add name
            const nameSpan = document.createElement('span');
            nameSpan.className = 'npc-name';
            nameSpan.textContent = npcName;
            conversationInfo.appendChild(nameSpan);
            
            // Update reference
            this.elements.npcName = nameSpan;
        } else {
            // Fallback to old method
            this.elements.npcName.textContent = npcName;
        }
    }
    
    /**
     * Add a message bubble to the conversation
     * @param {string} type - Message type ('npc' or 'player')
     * @param {string} text - Message text
     * @param {boolean} scrollToBottom - Whether to auto-scroll
     */
    addMessage(type, text, scrollToBottom = true) {
        if (!text || text.trim() === '') {
            return Promise.resolve();
        }

        // A "You: …" line is the player's bubble, prefix stripped (U3); the contact's own
        // "Name:" prefix is dropped from its lines (also before any voice: transcript)
        const contact = this.currentNPCId ? this.npcManager?.getNPC(this.currentNPCId) : null;
        ({ type, text } = displayPhoneLine(type, text.trim(), contact));
        const trimmedText = text.trim();
        // Only the NPC's lines are voice messages: a player line is never voiced in their voice
        const isVoiceMessage = type === 'npc' && trimmedText.toLowerCase().startsWith('voice:');

        if (this.isTerminalTheme && type === 'npc' && !isVoiceMessage) {
            return this._typewriterMessage(displayDashes(trimmedText), scrollToBottom);
        }

        if (type === 'narrator') {
            // Narration: centred, italic, muted; no bubble, tail, avatar, time or typeout
            const narration = document.createElement('div');
            narration.className = 'message-narration';
            narration.textContent = displayDashes(trimmedText);
            this.elements.messagesContainer.appendChild(narration);
            if (scrollToBottom) {
                this.scrollToBottom();
            }
            return Promise.resolve();
        }

        const messageBubble = document.createElement('div');
        messageBubble.className = `message-bubble ${type}`;

        if (isVoiceMessage) {
            // Extract transcript (remove "voice:" prefix)
            const transcript = trimmedText.substring(6).trim();
            
            // Create voice message display
            const voiceDisplay = document.createElement('div');
            voiceDisplay.className = 'voice-message-display';
            
            // Audio controls
            const audioControls = document.createElement('div');
            audioControls.className = 'audio-controls';
            audioControls.style.cursor = 'pointer';
            
            const playButton = document.createElement('div');
            playButton.className = 'play-button';
            const playIcon = document.createElement('img');
            playIcon.src = '/break_escape/assets/icons/play.png';
            playIcon.alt = 'Play';
            playIcon.className = 'icon';
            playButton.appendChild(playIcon);
            
            const audioSprite = document.createElement('img');
            audioSprite.src = '/break_escape/assets/mini-games/audio.png';
            audioSprite.alt = 'Audio';
            audioSprite.className = 'audio-sprite';
            
            audioControls.appendChild(playButton);
            audioControls.appendChild(audioSprite);
            
            // Add click handler to play/stop voice message
            audioControls.addEventListener('click', () => {
                this.playVoiceMessage(transcript, playButton);
            });
            
            // Transcript
            const transcriptDiv = document.createElement('div');
            transcriptDiv.className = 'transcript';
            transcriptDiv.innerHTML = `<strong>Transcript:</strong><br>${displayDashes(transcript)}`;
            
            voiceDisplay.appendChild(audioControls);
            voiceDisplay.appendChild(transcriptDiv);
            messageBubble.appendChild(voiceDisplay);
            
            console.log(`🎤 Added voice message: ${transcript.substring(0, 30)}...`);
        } else {
            // Regular text message
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            messageText.textContent = displayDashes(trimmedText);
            
            messageBubble.appendChild(messageText);
            
            console.log(`💬 Added ${type} message: ${trimmedText.substring(0, 30)}...`);
        }
        
        // Add timestamp
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        messageBubble.appendChild(messageTime);
        
        this.elements.messagesContainer.appendChild(messageBubble);
        
        if (scrollToBottom) {
            this.scrollToBottom();
        }

        return Promise.resolve();
    }

    _typewriterMessage(text, scrollToBottom) {
        const CHAR_DELAY = 28;
        const BLINK_DURATION = 700;

        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble npc';

        const messageText = document.createElement('span');
        messageText.className = 'message-text terminal-typing';

        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        cursor.textContent = '█';

        messageBubble.appendChild(messageText);
        messageBubble.appendChild(cursor);
        this.elements.messagesContainer.appendChild(messageBubble);

        const chars = [...text];
        let i = 0;
        let cancelled = false;

        return new Promise(resolve => {
            this._typewriterCancel = () => {
                cancelled = true;
                resolve();
            };

            const tick = () => {
                if (cancelled) return;
                if (i < chars.length) {
                    messageText.textContent += chars[i++];
                    if (scrollToBottom) this.scrollToBottom(false);
                    setTimeout(tick, CHAR_DELAY);
                } else {
                    messageText.classList.remove('terminal-typing');
                    cursor.classList.add('blink');
                    setTimeout(() => {
                        if (!cancelled) cursor.remove();
                        resolve();
                    }, BLINK_DURATION);
                }
            };
            setTimeout(tick, CHAR_DELAY);
        });
    }

    /**
     * Add multiple messages at once (for loading history)
     * @param {Array} messages - Array of message objects
     */
    addMessages(messages) {
        if (!messages || messages.length === 0) {
            return;
        }

        const savedTheme = this.isTerminalTheme;
        this.isTerminalTheme = false;
        messages.forEach(msg => {
            this.addMessage(msg.type, msg.text, false);
        });
        this.isTerminalTheme = savedTheme;

        this.scrollToBottom();
        console.log(`💬 Added ${messages.length} messages from history`);
    }
    
    /**
     * Clear all messages from the conversation
     */
    clearMessages() {
        this.elements.messagesContainer.innerHTML = '';
        console.log('🗑️ Cleared all messages');
    }
    
    /**
     * Add choice buttons to the conversation
     * @param {Array} choices - Array of choice objects from Ink
     */
    addChoices(choices) {
        if (!choices || choices.length === 0) {
            this.elements.choicesContainer.innerHTML = '';
            return;
        }
        
        this.elements.choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const choiceButton = document.createElement('button');
            choiceButton.className = 'choice-button';
            choiceButton.dataset.index = index;
            choiceButton.textContent = displayDashes(choice.text);
            
            this.elements.choicesContainer.appendChild(choiceButton);
        });
        
        this.scrollToBottom();
        console.log(`🔘 Added ${choices.length} choices`);
    }
    
    /**
     * Clear all choice buttons
     */
    clearChoices() {
        this.elements.choicesContainer.innerHTML = '';
    }
    
    /**
     * Show typing indicator (NPC is "typing")
     */
    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }
    
    /**
     * Scroll messages container to bottom
     * @param {boolean} smooth - Whether to use smooth scrolling
     */
    scrollToBottom(smooth = true) {
        const container = this.elements.messagesContainer;
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }
    
    /**
     * Get current time as formatted string
     * @returns {string} Time in HH:MM format
     */
    getCurrentTime() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${displayHours}:${displayMinutes}`;
    }
    
    /**
     * Format timestamp into human-readable string
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} Formatted time string
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h`;
        }
        
        // More than 24 hours - show time
        const date = new Date(timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        return `${displayHours}:${displayMinutes}`;
    }
    
    /**
     * Show a temporary message/notification
     * @param {string} message - Message to display
     * @param {string} type - Type ('info', 'success', 'error')
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 2000) {
        const notification = document.createElement('div');
        notification.className = `phone-notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
    
    /**
     * Get the current view
     * @returns {string} Current view ('contact-list' or 'conversation')
     */
    getCurrentView() {
        return this.currentView;
    }
    
    /**
     * Get the current NPC ID
     * @returns {string|null} Current NPC ID or null
     */
    getCurrentNPCId() {
        return this.currentNPCId;
    }
    
    /**
     * Cleanup and remove UI
     */
    cleanup() {
        // Stop and destroy TTS manager
        this.ttsManager.destroy();

        // Stop any browser speech synthesis
        if (this.speechSynthesis && this.isPlaying) {
            this.speechSynthesis.cancel();
        }

        this.isPlaying = false;
        this.currentPlayButton = null;
        if (this._typewriterCancel) {
            this._typewriterCancel();
            this._typewriterCancel = null;
        }
        this.container.innerHTML = '';
        this.elements = {};
        this.currentView = 'contact-list';
        this.currentNPCId = null;
        console.log('🧹 Phone UI cleaned up');
    }
}
