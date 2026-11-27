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
import { displayPhoneLine, otherSpeaker } from './phone-chat-speaker.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { messageClockText } from '../../systems/game-clock.js';
import { hasHiddenChoicesBelow, numberedChoiceText } from './phone-chat-choices.js';
import { createBottomPin } from './phone-chat-scroll.js';
import { portraitFor } from '../../utils/portrait-variants.js';
import { ChatInfluence } from '../../ui/pretext-chrome.js';
import PhoneChatConversation from './phone-chat-conversation.js';
import { npcDmFields, onAccentColour } from './phone-app.js';
import { isPhoneCallMode, callLabelFor, formatCallDuration, callSubtitle, CALL_STATUS_HTML, CALL_SPEAKING_HTML, CALL_CONTROLS_HTML } from './phone-call-ui.js';

import InkEngine from '../../systems/ink/ink-engine.js';
import { escapeHtml as escHtml } from '../../utils/escape-html.js';

/** Touch screens say "Tap", others name the keys; Space and Enter both skip, as does a click. */
export function skipHintText() {
    try {
        const w = globalThis.window;
        if (w?.matchMedia?.('(pointer: coarse)')?.matches || w?.matchMedia?.('(hover: none)')?.matches) return 'Tap to skip';
    } catch (e) { /* fall through */ }
    return 'Space, Enter or click to skip';
}

/** Terminal typing speed: 28 ms a character, but a whole batch of lines types in about 12 s at most (never under 10 ms a character). */
export const TERMINAL_CHAR_DELAY_MS = 28;
export const TERMINAL_BLOCK_MAX_MS = 12000;
export function typewriterCharDelay(totalChars) {
    const n = Math.max(1, Number(totalChars) || 1);
    return Math.max(10, Math.min(TERMINAL_CHAR_DELAY_MS, Math.floor(TERMINAL_BLOCK_MAX_MS / n)));
}

/** A whole batch (typing plus the "typing" pauses and gaps between lines) aims to finish in about 15 s. */
export const TERMINAL_BATCH_TOTAL_MS = 15000;
/** The cursor blink after each terminal line: part of the pauses, so it shrinks with them. */
export const TERMINAL_BLINK_MS = 700;
/**
 * Factor to multiply the pauses by so a batch of `lines` lines and `totalChars` characters,
 * with `pauseMs` of pauses in all, fits the total budget. 1 for a short batch; never under 0.15,
 * so the "typing" indicator still shows for a moment.
 */
export function batchPauseScale(totalChars, pauseMs, typed = true) {
    const chars = Math.max(0, Number(totalChars) || 0);
    const pauses = Math.max(0, Number(pauseMs) || 0);
    if (!pauses) return 1;
    const typing = chars && typed ? typewriterCharDelay(chars) * chars : 0;
    if (typing + pauses <= TERMINAL_BATCH_TOTAL_MS) return 1;
    return Math.max(0.15, (TERMINAL_BATCH_TOTAL_MS - typing) / pauses);
}

/** The player's OS asks for less motion: terminal lines appear whole. */
function prefersReducedMotion() {
    try { return globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch (e) { return false; }
}

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
        // The device's app block (title, accent, chrome), resolved by the minigame; null for
        // every phone that has none, which then renders exactly as before
        this.app = this.params.app || null;
        this.isSocialTheme = this.params.theme === 'social';
        this.appChrome = this.app?.chrome === 'app';
        // A voiced call draws a call screen with subtitles, not a message thread
        this.isCallMode = isPhoneCallMode(this.params);
        this._callTimer = null;
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
                    ${this.appChrome ? '' : `<div class="phone-header">
                        <div class="signal-bars">
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                        </div>
                        <div class="battery">85%</div>
                    </div>`}
                    
                    <!-- Contact List View -->
                    <div class="contact-list-view" id="contact-list-view">
                        <div class="contact-list-header">
                            ${this.appTitleHtml()}
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
                        <div class="choices-container" id="choices-container"></div>
                        <div class="choices-more-cue" id="choices-more-cue" aria-hidden="true">▼ more choices</div>
                    </div>
                </div>
            </div>
        `;
        
        if (this.isTerminalTheme) {
            this.container.querySelector('.phone-messages-container')
                .classList.add('phone-terminal-theme');
            this.container.querySelector('#messages-container')
                ?.setAttribute('title', skipHintText());
            // Visible skip hint, shown only while a line types or a pause runs (syncSkipHint)
            const hint = document.createElement('div');
            hint.className = 'phone-skip-hint';
            hint.id = 'phone-skip-hint';
            hint.setAttribute('aria-hidden', 'true');
            hint.hidden = true;
            hint.textContent = skipHintText();
            // Second line: says what the wait is for, so the player knows the choices are coming
            const cue = document.createElement('div');
            cue.className = 'phone-skip-hint-cue';
            cue.textContent = 'Your reply options follow';
            // aria-hidden with the pill: replies take focus when they arrive
            cue.hidden = true;
            hint.appendChild(cue);
            this.container.querySelector('.phone-screen')?.appendChild(hint);
        }
        if (this.isCallMode) this._renderCallChrome();
        if (this.isSocialTheme) {
            const shell = this.container.querySelector('.phone-messages-container');
            shell.classList.add('phone-social-theme');
            if (this.appChrome) shell.classList.add('phone-app-chrome');
            if (this.app?.accent) {
                shell.style.setProperty('--dm-accent', this.app.accent);
                shell.style.setProperty('--dm-on-accent', onAccentColour(this.app.accent));
            }
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
            choicesContainer: document.getElementById('choices-container'),
            choicesMoreCue: document.getElementById('choices-more-cue'),
            callTimer: document.getElementById('call-timer'),
            callEndButton: document.getElementById('call-end-button')
        };

        // The cue sits below the list, not over it (m08 R4: it covered the fourth choice)
        this.elements.choicesMoreCue?.addEventListener('click', (e) => {
            e.stopPropagation();
            const box = this.elements.choicesContainer;
            box?.scrollBy?.({ top: box.clientHeight, behavior: 'smooth' });
        });
        
        // Show or hide the "more choices" cue as the player scrolls the list
        this.elements.choicesContainer?.addEventListener('scroll', () => this.updateChoicesScrollCue());

        // Keep the last bubble above the choices as the panel fills in or changes
        // height, and when the window resizes (round 7, m06 M2)
        this._bottomPin?.destroy();
        this._bottomPin = createBottomPin(this.elements.messagesContainer, {
            watch: [this.elements.choicesContainer, this.elements.typingIndicator]
        });

        console.log('✅ Phone UI rendered');
    }
    
    /**
     * Turn the conversation view into a call screen: the ON CALL bar, the speaking
     * indicator under the portrait, and the end-call button below the choices.
     */
    _renderCallChrome() {
        const shell = this.container.querySelector('.phone-messages-container');
        shell?.classList.add('phone-call-mode');
        const view = this.container.querySelector('#conversation-view');
        const header = this.container.querySelector('#conversation-header');
        if (!view || !header) return;
        view.insertAdjacentHTML('afterbegin', CALL_STATUS_HTML);
        header.insertAdjacentHTML('beforeend', CALL_SPEAKING_HTML);
        view.insertAdjacentHTML('beforeend', CALL_CONTROLS_HTML);
        // Resolve the caption now, before the first paint: otherwise the static "Voice call" shows
        // for a frame or two until showConversation sets the real one (M1 R4/R5 n1). currentNPCId is
        // not set at first render, so read the contact from params.npcId (a call opens one contact).
        const caption = header.querySelector('#call-caption');
        if (caption) {
            const npc = this.params?.npcId ? this.npcManager?.getNPC?.(this.params.npcId) : null;
            caption.textContent = callLabelFor(this.params, npc);
        }
        const messages = view.querySelector('#messages-container');
        messages?.setAttribute('aria-live', 'polite');
        messages?.setAttribute('title', `${skipHintText()} the line`);
    }

    /** Start the call's running time from zero. */
    startCallTimer() {
        this.stopCallTimer();
        const el = this.elements?.callTimer;
        if (!el) return;
        const started = Date.now();
        el.textContent = formatCallDuration(0);
        this._callTimer = setInterval(() => {
            if (!this.elements?.callTimer) return this.stopCallTimer();
            this.elements.callTimer.textContent = formatCallDuration(Date.now() - started);
        }, 1000);
    }

    stopCallTimer() {
        if (this._callTimer) clearInterval(this._callTimer);
        this._callTimer = null;
    }

    /**
     * Freeze the call screen on "Call ended m:ss" (plan 2.5, Ending). Returns false when
     * there is no call screen (terminal look, thread view), so the caller closes at once.
     */
    showCallEnded() {
        const bar = document.getElementById('call-status-bar');
        const timer = this.elements?.callTimer;
        if (!this.isCallMode || !bar || !timer) return false;
        const shown = timer.textContent || '0:00';
        this.stopCallTimer();
        const label = bar.querySelector('.call-status-label');
        if (label) label.textContent = 'CALL ENDED';   // upper case, as the ON CALL bar it replaces (the dot goes with the text)
        timer.textContent = shown;
        bar.classList.add('call-ended');
        this.elements.choicesContainer && (this.elements.choicesContainer.innerHTML = '');
        // no replies left, so no "more choices" cue either
        this.elements.choicesMoreCue?.classList.remove('visible');
        return true;
    }

    /**
     * The call bar's state (plan 2.5): 'oncall' (the running time), 'calling' (an outgoing call
     * dialling: no timer, the bar reads CALLING and the caption keeps the callLabel), 'noanswer' (it rang out). A no-op without a call screen.
     */
    setCallStatus(mode) {
        if (!this.isCallMode) return;
        const bar = document.getElementById('call-status-bar');
        const timer = this.elements?.callTimer;
        if (!bar || !timer) return;
        const label = bar.querySelector('.call-status-label');
        const caption = this.container.querySelector('#call-caption');
        bar.classList.toggle('call-ended', mode === 'noanswer');
        bar.classList.toggle('call-dialling', mode === 'calling');
        if (mode === 'oncall') {
            if (label) label.innerHTML = '<span class="call-status-dot" aria-hidden="true"></span>ON CALL';
            return;
        }
        this.stopCallTimer();
        timer.textContent = '';
        if (label) label.textContent = mode === 'calling' ? 'CALLING' : 'NO ANSWER';
        // 'calling': the caption stays who is being rung (showConversation set it: the entry's or contact's callLabel, else "Voice call"); the bar says CALLING (A5 R1 m3)
        if (caption && mode === 'noanswer') caption.textContent = 'No answer';
    }

    /**
     * The header call button (plan 2.5): green phone, "Call" or "Call back". `state` is
     * `{ label, ariaLabel }` from phoneRinger.callButtonFor, or null to remove it. `onClick` runs on a press.
     */
    setCallButton(state, onClick) {
        const header = this.elements?.conversationHeader;
        if (!header) return;
        header.querySelector('.call-button')?.remove();
        // Kept for the missed row's own "Call back" button (A6)
        this._callState = state || null;
        this._callPress = onClick || null;
        this.refreshRowCallBack();
        if (!state) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'call-button';
        btn.setAttribute('aria-label', state.ariaLabel || state.label);
        btn.title = state.label;
        const glyph = document.createElement('span');
        glyph.className = 'call-button-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = '\u260E';
        btn.appendChild(glyph);
        const text = document.createElement('span');
        text.className = 'call-button-text';
        text.textContent = state.label;
        btn.appendChild(text);
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick?.(); });
        header.appendChild(btn);
    }

    /**
     * The latest "Missed call" row carries a small "Call back" button while the contact has a pending
     * callback (plan 2.6): the same call as the header button. Older missed rows have none.
     */
    refreshRowCallBack() {
        const box = this.elements?.messagesContainer;
        if (!box) return;
        box.querySelectorAll('.call-row-callback').forEach((b) => b.remove());
        const state = this._callState;
        if (!state || state.kind !== 'callback') return;
        const rows = box.querySelectorAll('.message-call-row.missed');
        const last = rows[rows.length - 1];
        if (!last) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'call-row-callback';
        btn.setAttribute('aria-label', state.ariaLabel || state.label);
        btn.textContent = 'Call back';
        btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._callPress?.(); });
        last.appendChild(btn);
    }

    /** The speaking indicator under the portrait: on while a call line plays. */
    setCallSpeaking(on) {
        this._clipPlaying = !!on;   // a click or Space skips the clip, so the skip hint stays up
        this.syncSkipHint();
        if (!this.isCallMode) return;
        this.elements?.conversationView?.classList.toggle('call-speaking-now', !!on);
    }

    /** One subtitle line of a call (replaces a bubble in call mode). */
    _addCallSubtitle(type, text, contact, scrollToBottom) {
        const other = type === 'npc' ? otherSpeaker(text, contact, this._knownSpeakerNames(), this._knownSpeakerIds()) : null;
        const sub = callSubtitle(type, text, contact, other);
        if (!sub.text) return Promise.resolve();
        const line = document.createElement('div');
        line.className = `call-subtitle ${type}`;
        if (sub.speaker) {
            const who = document.createElement('span');
            who.className = 'call-subtitle-speaker';
            who.textContent = `${displayDashes(sub.speaker)}:`;
            line.appendChild(who);
            line.appendChild(document.createTextNode(' '));
        }
        const body = document.createElement('span');
        body.className = 'call-subtitle-text';
        body.textContent = displayDashes(sub.text);
        line.appendChild(body);
        this.elements.messagesContainer.appendChild(line);
        if (scrollToBottom) this.scrollToBottom(false);
        return Promise.resolve();
    }

    /** The contact-list heading: "Messages", or the app's title (and logo). */
    appTitleHtml() {
        const title = this.app?.title;
        if (!title) return '<h3>Messages</h3>';
        const logo = this.app.logo
            ? `<img class="app-logo" src="/break_escape/assets/logos/${escHtml(this.app.logo)}" alt="">`
            : '';
        return `<h3 class="app-title">${logo}<span>${escHtml(title)}</span></h3>`;
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

                const playing = this.ttsManager.play(npcId, text);
                const seq = this.ttsManager.playSeq;
                const duration = await playing;
                // A later play() took over while this one loaded: the button state is its now,
                // and this message must not fall back to speech synthesis over it
                if (this.ttsManager.playSeq !== seq) return;
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
        // Torn down (the phone closed while a start was still awaiting): nothing to show
        if (!this.elements.contactListView || !this.elements.conversationView) {
            console.warn('⚠️ Phone UI torn down; not showing the contact list');
            return;
        }
        // Back from a thread opened with the keyboard returns focus to that contact's row
        const returnTo = this.currentView === 'conversation' && this._threadByKeyboard ? this.currentNPCId : null;
        this._threadByKeyboard = false;
        this.currentView = 'contact-list';
        this.currentNPCId = null;
        this.syncSkipHint();
        this.stopCallTimer();
        
        // Hide conversation, show contact list
        this.elements.conversationView.style.display = 'none';
        this.elements.contactListView.style.display = 'flex';
        this.elements.contactListView.setAttribute('role', 'region');
        this.elements.contactListView.setAttribute('aria-label', 'Messages');
        
        // Populate contacts
        this.populateContactList(phoneId);
        
        this.focusIntoPhone();
        if (returnTo) this.focusContactRow(returnTo);
        console.log('📋 Showing contact list');
    }

    /**
     * Put keyboard focus inside the phone: the visible view itself (tabindex -1), so the
     * first Tab reaches the view's first control instead of a toast behind the phone (A1).
     * Left alone when the player is typing in a field outside the phone, or focus is
     * already on a control inside the phone's visible view.
     */
    focusIntoPhone() {
        try {
            const view = this.currentView === 'conversation'
                ? this.elements.conversationView : this.elements.contactListView;
            const doc = this.container?.ownerDocument;
            if (!view || !doc || typeof view.focus !== 'function') return false;
            const active = doc.activeElement;
            const editable = (el) => !!el && (el.isContentEditable
                || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''));
            if (active && active !== doc.body && !this.container.contains(active) && editable(active)) return false;
            if (active && active !== view && view.contains(active)) return false;
            if (!view.hasAttribute('tabindex')) view.setAttribute('tabindex', '-1');
            view.style.outline = 'none';
            view.focus({ preventScroll: true });
            return doc.activeElement === view;
        } catch (e) { return false; }
    }
    
    /**
     * The contacts the list shows for this phone (remembered for the back button's count).
     * @param {string} phoneId - Optional phone ID to filter contacts
     * @returns {Object[]}
     */
    listContacts(phoneId = null, quiet = false) {
        this._listPhoneId = phoneId;
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
            if (!quiet) console.log(`🔍 Filtering contacts: allowed NPCs = ${this.allowedNpcIds.join(', ')}`);
            npcs = npcs.filter(npc => {
                // Include if in allowed list
                if (this.allowedNpcIds.includes(npc.id)) {
                    return true;
                }
                // Include if has conversation history (i.e., has been activated by events)
                const history = this.npcManager.getConversationHistory(npc.id);
                return history && history.length > 0;
            });
            if (!quiet) console.log(`✅ Filtered to ${npcs.length} contacts`);
        }
        
        return npcs || [];
    }

    /** Unread texts and missed calls in one contact's thread (the list's badge). */
    unreadCountFor(npcId) {
        const history = this.npcManager.getConversationHistory(npcId) || [];
        return history.filter(msg => msg && !msg.read &&
            (msg.type === 'npc' || (msg.type === 'call' && msg.callEvent === 'missed'))).length;
    }

    /**
     * The back button counts unread texts in the phone's other threads, so a text that came in
     * while a thread is open (held on a phone screen, review R2 M2) is not missed. Plain text.
     * @returns {number} the count shown
     */
    refreshBackUnread() {
        const btn = this.elements?.backButton;
        if (!btn || !btn.isConnected) return 0;
        let n = 0;
        try {
            for (const npc of this.listContacts(this._listPhoneId ?? this.params.phoneId ?? 'player_phone', true)) {
                if (npc && npc.id !== this.currentNPCId) n += this.unreadCountFor(npc.id);
            }
        } catch (e) { n = 0; }
        let badge = btn.querySelector('.back-unread');
        if (n > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'back-unread unread-badge';
                btn.appendChild(badge);
            }
            badge.textContent = String(n);
            btn.setAttribute('aria-label', `Back, ${n} unread`);
        } else {
            badge?.remove();
            btn.setAttribute('aria-label', 'Back');
        }
        return n;
    }
    
    /**
     * A text or call row arrived while the contact list is showing: bring each row's preview,
     * time and unread badge up to date in place (the rows keep their place and focus). A
     * contact the list has not shown yet rebuilds the whole list. Does nothing in a thread.
     * @returns {boolean} whether the list was refreshed
     */
    refreshContactList() {
        try {
            const list = this.elements?.contactList;
            if (this.currentView !== 'contact-list' || !list || !list.isConnected) return false;
            const npcs = this.listContacts(this._listPhoneId ?? this.params.phoneId ?? 'player_phone', true);
            const rows = Array.from(list.querySelectorAll('.contact-item'));
            const rowFor = (id) => rows.find(r => r.dataset.npcId === id);
            if (rows.length !== npcs.length || npcs.some(npc => !rowFor(npc.id))) {
                // A contact came or went: rebuild, keeping the scroll position
                const top = list.scrollTop;
                this.populateContactList(this._listPhoneId);
                list.scrollTop = top;
                return true;
            }
            for (const npc of npcs) {
                const row = rowFor(npc.id);
                const fresh = this.createContactItem(npc);
                const meta = row.querySelector('.contact-meta');
                const freshMeta = fresh.querySelector('.contact-meta');
                if (meta && freshMeta) meta.replaceWith(freshMeta);
                // The swapped meta may add or drop the unread badge: keep the description ids in step
                const freshDesc = fresh.getAttribute('aria-describedby');
                if (freshDesc) row.setAttribute('aria-describedby', freshDesc);
                else row.removeAttribute('aria-describedby');
                const last = row.querySelector('.contact-last-message');
                const freshLast = fresh.querySelector('.contact-last-message');
                if (!last || !freshLast) continue;
                if (npc.livePreview !== true) {
                    last.className = freshLast.className;
                    last.textContent = freshLast.textContent;
                } else {
                    // A livePreview row shows its own dry-run line; a new text in its thread
                    // makes that stale, so show the history line and run the dry run again
                    const length = String(this.npcManager.getConversationHistory(npc.id).length);
                    if (row.dataset.historyLength !== length) {
                        last.className = freshLast.className;
                        last.textContent = freshLast.textContent;
                        row.dataset.historyLength = length;
                        this.refreshLivePreview(npc, row).catch(() => {});
                    }
                }
            }
            return true;
        } catch (e) { return false; }
    }

    /**
     * Populate the contact list with NPCs
     * @param {string} phoneId - Optional phone ID to filter contacts
     */
    populateContactList(phoneId = null) {
        const contactList = this.elements.contactList;
        // A rebuild drops the focused row: remember it and focus its replacement
        const active = document.activeElement;
        const focusedId = active && contactList.contains(active) && active.classList?.contains('contact-item')
            ? active.dataset.npcId : null;
        contactList.innerHTML = '';
        const npcs = this.listContacts(phoneId);
        
        if (!npcs || npcs.length === 0) {
            contactList.innerHTML = `
                <div class="no-contacts">
                    <p>No contacts available</p>
                </div>
            `;
            // The focused contact left and none remain: keep focus inside the phone
            if (focusedId) this.focusIntoPhone();
            return;
        }
        
        // Create contact items
        npcs.forEach(npc => {
            const contactItem = this.createContactItem(npc);
            contactList.appendChild(contactItem);
            // Opt-in (NPC "livePreview": true, lab R5 F4): a looping hint contact
            // previews the line opening its thread would add now
            if (npc.livePreview === true) {
                contactItem.dataset.historyLength = String(this.npcManager.getConversationHistory(npc.id).length);
                this.refreshLivePreview(npc, contactItem);
            }
        });

        // The focused row's contact left the list: keep focus inside the phone
        if (focusedId && !this.focusContactRow(focusedId)) this.focusIntoPhone();
        console.log(`📋 Populated ${npcs.length} contacts`);
    }

    /**
     * Focus the contact row for an NPC, if the list has one.
     * @returns {boolean} whether a row took focus
     */
    focusContactRow(npcId) {
        try {
            const rows = Array.from(this.elements?.contactList?.querySelectorAll('.contact-item') || []);
            const row = rows.find(r => r.dataset.npcId === npcId);
            if (!row) return false;
            row.focus({ preventScroll: true });
            return true;
        } catch (e) { return false; }
    }

    /**
     * Replace an opted-in contact's preview with the line its thread would gain if
     * opened now (PhoneChatConversation.previewReopen). A dry run: the thread, the
     * unread count and the saved story are not touched. The row keeps its history
     * preview if the run adds nothing, fails, or the row or thread changed meanwhile.
     * @param {Object} npc - the NPC entry
     * @param {HTMLElement} contactItem - its row in the list
     * @returns {Promise<string|null>} the preview shown, or null
     */
    async refreshLivePreview(npc, contactItem) {
        const historyLength = this.npcManager.getConversationHistory(npc.id).length;
        const stateManager = typeof window !== 'undefined' ? window.npcConversationStateManager : null;
        const raw = await PhoneChatConversation.previewReopen(npc, this.npcManager, new InkEngine(`${npc.id}-preview`), {
            syncGlobals: story => {
                stateManager?.syncGlobalVariablesToStory?.(story);
                stateManager?.applyEngineVariables?.(npc.id, story, { channel: 'phone-chat' });
            }
        });
        if (!raw || !contactItem?.isConnected) return null;
        // The thread was opened (or texted) while the dry run ran: its own line stands
        if (this.npcManager.getConversationHistory(npc.id).length !== historyLength) return null;
        const el = contactItem.querySelector('.contact-last-message');
        if (!el) return null;
        const preview = this.previewText({ type: 'npc', text: raw }, npc);
        if (preview === null) return null;
        el.textContent = displayDashes(preview);
        el.classList.remove('missed');
        return preview;
    }

    /**
     * A message's text as the contact list previews it: the speaker prefix handled,
     * "You: " on the player's lines, cut to 40 characters. Null for narration.
     * @param {Object} message - { type, text }
     * @param {Object} npc - the contact
     * @returns {string|null}
     */
    previewText(message, npc) {
        const maxLength = 40;
        const line = displayPhoneLine(message.type, message.text, npc);
        if (line.type === 'narrator') return null;
        const previewText = line.type === 'player' ? `You: ${line.text}` : line.text;
        return previewText.length > maxLength
            ? previewText.substring(0, maxLength) + '...'
            : previewText;
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
        // A missed call counts as unread, like a text (plan 2.6)
        const unreadCount = this.unreadCountFor(npc.id);
        const lastIsMissedCall = !!lastMessage && lastMessage.type === 'call' && lastMessage.callEvent === 'missed';
        
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.dataset.npcId = npc.id;
        // Keyboard-operable row: Tab reaches it, Enter or Space opens the thread through the
        // same click path as the mouse. Its name is its text, which starts with the contact name.
        contactItem.setAttribute('role', 'button');
        contactItem.tabIndex = 0;
        contactItem.addEventListener('keydown', (e) => {
            if (e.target !== contactItem || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            // A thread opened this way gives focus back to its row on Back
            this._kbOpen = true;
            try { contactItem.click(); } finally { this._kbOpen = false; }
        });
        contactItem.addEventListener('click', () => { this._threadByKeyboard = !!this._kbOpen; });
        
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
        
        // Resolve avatar path to full URL if relative (portraitVariants may swap it)
        const avatar = portraitFor(npc)?.avatar;
        let avatarSrc = avatar;
        if (avatar && !avatar.startsWith('/') && !avatar.startsWith('http')) {
            if (avatar.startsWith('assets/')) {
                avatarSrc = `/break_escape/${avatar}`;
            } else {
                avatarSrc = `${ASSETS_PATH}/${avatar}`;
            }
        }

        const nameId = `contact-name-${String(npc.id).replace(/[^A-Za-z0-9_-]/g, '_')}`;
        contactItem.innerHTML = `
            <div class="contact-avatar">
                ${avatar ? `<img src="${escHtml(avatarSrc)}" alt="">` : '<span aria-hidden="true">👤</span>'}
            </div>
            <div class="contact-info">
                <div class="contact-name" id="${nameId}">${escHtml(npc.displayName || npc.id)}</div>
                ${npcDmFields(npc).handle ? `<div class="contact-handle" id="${nameId}-handle">${escHtml(npcDmFields(npc).handle)}</div>` : ''}
                <div class="contact-last-message${lastIsMissedCall ? ' missed' : ''}">${escHtml(displayDashes(lastMessagePreview))}</div>
            </div>
            <div class="contact-meta">
                ${unreadCount > 0 ? `<div class="unread-badge" id="${nameId}-unread">${unreadCount}<span class="contact-sr-only"> unread</span></div>` : ''}
                <div class="contact-time" id="${nameId}-time">${escHtml(lastMessageTime)}</div>
            </div>
        `;
        // Name = the contact name alone (the row's ::before "// " is not part of it);
        // the preview and time are the description
        contactItem.querySelector('.contact-last-message')?.setAttribute('id', `${nameId}-preview`);
        contactItem.setAttribute('aria-labelledby', nameId);
        // The role=button children are presentational, so the handle and the unread count
        // must be named here to be heard: "preview time handle N unread"
        const described = [`${nameId}-preview`, `${nameId}-time`];
        if (contactItem.querySelector(`#${nameId}-handle`)) described.push(`${nameId}-handle`);
        if (unreadCount > 0) described.push(`${nameId}-unread`);
        contactItem.setAttribute('aria-describedby', described.join(' '));
        
        return contactItem;
    }
    
    /**
     * Show conversation view with specific NPC
     * @param {string} npcId - NPC identifier
     */
    showConversation(npcId) {
        this._refocusChoices = false;
        if (!npcId) {
            console.error('❌ No NPC ID provided');
            return;
        }
        
        const npc = this.npcManager.getNPC(npcId);
        if (!npc) {
            console.error(`❌ NPC not found: ${npcId}`);
            return;
        }
        
        // Torn down (the phone closed while a start was still awaiting): nothing to show
        if (!this.elements.contactListView || !this.elements.conversationView) {
            console.warn(`⚠️ Phone UI torn down; not showing conversation with ${npcId}`);
            return;
        }

        this.currentView = 'conversation';
        this.currentNPCId = npcId;
        // Only a thread opened by a keyboard press on its row returns focus to that row on Back;
        // a bark or ring that opens a thread does not
        if (!this._kbOpen) this._threadByKeyboard = false;
        // The thread is cleared below and redrawn from the history once that loads; a text
        // that arrives in between is part of that draw (npc-barks _foldIntoOpenThread)
        this.historyDrawn = false;
        this.syncSkipHint();
        
        // Hide contact list, show conversation
        this.elements.contactListView.style.display = 'none';
        this.elements.conversationView.style.display = 'flex';
        this.elements.conversationView.setAttribute('role', 'region');
        this.elements.conversationView.setAttribute('aria-label', `Conversation with ${npc.displayName || npc.id}`);
        
        // Update header with avatar
        this.updateHeader(npc.displayName || npc.id, npc.id);
        this.refreshBackUnread();
        
        // Clear messages and choices
        this.elements.messagesContainer.innerHTML = '';
        this.elements.choicesContainer.innerHTML = '';
        this._bottomPin?.pin(false);
        if (this.isCallMode) {
            this.elements.conversationView.classList.remove('call-has-choices', 'call-speaking-now');
            const caption = this.elements.conversationView.querySelector('#call-caption');
            if (caption) caption.textContent = callLabelFor(this.params, npc);
            this.setCallStatus('oncall');
            this.startCallTimer();
        }
        
        this.focusIntoPhone();
        console.log(`💬 Showing conversation with ${npc.displayName || npcId}`);
    }
    
    /**
     * Update the conversation header
     * @param {string} npcName - NPC display name
     * @param {string} npcId - NPC identifier
     */
    updateHeader(npcName, npcId) {
        // portraitVariants may swap the avatar (a knocked-out headshot, say)
        const npc = portraitFor(this.npcManager.getNPC(npcId));
        
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
            const { handle, profile } = npcDmFields(this.npcManager.getNPC(npcId));
            if (handle || profile) {
                // Name, handle and the profile link stack beside the avatar
                const block = document.createElement('div');
                block.className = 'npc-id-block';
                block.appendChild(nameSpan);
                if (handle) {
                    const handleEl = document.createElement('span');
                    handleEl.className = 'npc-handle';
                    handleEl.textContent = handle;
                    block.appendChild(handleEl);
                }
                // No profile link in a judged chat: leaving it would close the call
                if (profile && !this.params.pretextCallId) {
                    const link = document.createElement('button');
                    link.type = 'button';
                    link.className = 'npc-profile-link';
                    link.dataset.siteId = profile.siteId;
                    link.dataset.person = profile.person;
                    link.textContent = 'View profile';
                    block.appendChild(link);
                }
                conversationInfo.appendChild(block);
            } else {
                conversationInfo.appendChild(nameSpan);
            }
            
            // Update reference
            this.elements.npcName = nameSpan;
        } else {
            // Fallback to old method
            this.elements.npcName.textContent = npcName;
        }
        this.mountInfluenceBar(npcId);
    }

    /**
     * Influence bar and tells for a social contact (06 N4, P4-E).
     * Tells also land in the thread as render-only bubbles, not history.
     * A non-social contact mounts nothing.
     */
    _social() {
        if (!this._chatInfluence) {
            this._chatInfluence = new ChatInfluence({
                parent: () => this.elements?.conversationHeader || null,
                messages: () => this.elements?.messagesContainer || null,
                mount: 'phone-chat',
                place: 'end',
                onBand: (band) => {
                    const header = this.elements?.conversationHeader;
                    if (!header) return;
                    header.dataset.band = String(band);
                    const img = header.querySelector('.conversation-avatar');
                    if (img) img.dataset.band = String(band);
                }
            });
        }
        return this._chatInfluence;
    }

    mountInfluenceBar(npcId) { return this._social().mountBar(npcId); }
    mountPretext(opts) { return this._social().mountPretext(opts); }
    refreshPretext() { return this._social().refresh(); }
    socialHeaderState() { return this._chatInfluence ? this._chatInfluence.state() : null; }
    
    /**
     * Add a message bubble to the conversation
     * @param {string} type - Message type ('npc' or 'player')
     * @param {string} text - Message text
     * @param {boolean} scrollToBottom - Whether to auto-scroll
     * @param {Object} [message] - the history entry being shown (its timestamp and
     *   gameTime give the time on the bubble); omitted for a line arriving now
     */
    addMessage(type, text, scrollToBottom = true, message = null) {
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

        // A thread row is not something the caller said: a call screen that replays the
        // thread (a legacy voiced call) leaves rows out (A4 R1 m3)
        if (this.isCallMode && type === 'call') return Promise.resolve();
        if (this.isCallMode) return this._addCallSubtitle(type, trimmedText, contact, scrollToBottom);

        if (type === 'call') return this._addCallRow(message, trimmedText, scrollToBottom);

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
            // The transcript is ink text: plain text after the label
            const transcriptLabel = document.createElement('span');
            transcriptLabel.className = 'mg-field-label';
            transcriptLabel.textContent = 'Transcript:';
            transcriptDiv.append(transcriptLabel, document.createElement('br'), displayDashes(transcript));
            
            voiceDisplay.appendChild(audioControls);
            voiceDisplay.appendChild(transcriptDiv);
            messageBubble.appendChild(voiceDisplay);
            
            console.log(`🎤 Added voice message: ${transcript.substring(0, 30)}...`);
        } else {
            // Regular text message
            const messageText = document.createElement('div');
            messageText.className = 'message-text';
            // Another character's line in this thread ("Name: …") gets their name over
            // the bubble, prefix dropped, instead of reading as the contact's own (F14)
            let bodyText = trimmedText;
            const other = type === 'npc' ? otherSpeaker(trimmedText, contact, this._knownSpeakerNames(), this._knownSpeakerIds()) : null;
            if (other) {
                const sender = document.createElement('div');
                sender.className = 'message-sender';
                sender.textContent = displayDashes(other.name);
                messageBubble.appendChild(sender);
                messageBubble.classList.add('other-speaker');
                bodyText = other.text;
            }
            // Terminal theme adds its own "> " prompt in CSS; skip it when the line already starts with one
            if (/^\s*>/.test(bodyText)) messageText.classList.add('has-own-prompt');
            messageText.textContent = displayDashes(bodyText);
            
            messageBubble.appendChild(messageText);
            
            console.log(`💬 Added ${type} message: ${trimmedText.substring(0, 30)}...`);
        }
        
        // Add timestamp, but only an in-world one. A scenario with a gameClock stamps each
        // bubble with the game time it arrived at. Without one the only time to show would be
        // the player's real clock ("12:29" in a mission set at night), so the bubble carries no
        // time and the thread's order is the only time cue (F18 item 5).
        if (typeof window !== 'undefined' && window.gameClock?.configured) {
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = message ? messageClockText(message) : this.getCurrentTime();
            messageBubble.appendChild(messageTime);
        }
        
        this.elements.messagesContainer.appendChild(messageBubble);
        
        if (scrollToBottom) {
            this.scrollToBottom();
        }

        return Promise.resolve();
    }

    /** Display names of every registered character, for otherSpeaker(). */
    _knownSpeakerNames() {
        const npcs = this.npcManager?.npcs;
        if (!npcs || typeof npcs.values !== 'function') return [];
        return Array.from(npcs.values()).map(n => n?.displayName).filter(Boolean);
    }

    /** Registered id -> display name of every character, for otherSpeaker() id prefixes (plan 2.10). */
    _knownSpeakerIds() {
        const npcs = this.npcManager?.npcs;
        const ids = new Map();
        if (!npcs || typeof npcs.values !== 'function') return ids;
        for (const n of npcs.values()) if (n?.id) ids.set(n.id, n.displayName || n.id);
        return ids;
    }

    /** True while a terminal line is typing out (or in its closing blink). */
    isTypewriting() {
        return typeof this._typewriterFinish === 'function';
    }

    /** A wait between story lines is running (set by the minigame's pace timer). */
    setPaceActive(on) {
        this._paceActive = !!on;
        this.syncSkipHint();
    }

    /** A panel over the thread (the pretext debrief) is up or gone: the hint hides while it is. */
    setOverlayOpen(on) {
        this._overlayOpen = !!on;
        this.syncSkipHint();
    }

    /** Show the skip hint while a line types or a pause runs; hidden otherwise (choices, idle). */
    syncSkipHint() {
        const hint = this.container?.querySelector?.('#phone-skip-hint');
        if (!hint) return;
        const choicesUp = !!this.elements?.choicesContainer?.querySelector?.('.choice-button');
        hint.hidden = !(this.isTerminalTheme && this.currentView === 'conversation' && !choicesUp
            && !this._overlayOpen && !this._incomingCallPanel
            && (this.isTypewriting() || this._paceActive || this._clipPlaying));
    }

    /** Finish the line being typed at once. Returns true if there was one. */
    skipTypewriter() {
        if (!this.isTypewriting()) return false;
        this._typewriterFinish();
        return true;
    }

    /** Characters in the batch about to type (0 clears), so the whole block shares one time budget. */
    setBlockChars(n, pauseMs = 0) {
        this._blockChars = Number(n) || 0;
        // Only the terminal types lines out (not a call screen), so only it shares a time budget;
        // under reduced motion the lines appear whole, so the pauses get the whole budget
        const terminal = this.isTerminalTheme && !this.isCallMode;
        this._pauseScale = this._blockChars && terminal
            ? batchPauseScale(this._blockChars, pauseMs, !prefersReducedMotion()) : 1;
    }

    /** A pause (typing indicator, gap between lines) shortened so the batch fits its total budget. */
    scalePause(ms) {
        return Math.round(ms * (this._pauseScale ?? 1));
    }

    /** Show the "reply options follow" cue only when choices will come after the lines. */
    setRepliesExpected(on) {
        const cue = this.container?.querySelector?.('.phone-skip-hint-cue');
        if (cue) cue.hidden = !on;
    }

    /** While on, terminal lines appear whole (the remaining queued lines after a second skip). */
    setInstantType(on) {
        this._instantType = !!on;
    }

    _typewriterMessage(text, scrollToBottom) {
        const CHAR_DELAY = typewriterCharDelay(this._blockChars || text.length);
        const BLINK_DURATION = this.scalePause(TERMINAL_BLINK_MS);

        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble npc';

        const messageText = document.createElement('span');
        messageText.className = 'message-text terminal-typing';
        if (/^\s*>/.test(text)) messageText.classList.add('has-own-prompt');

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
            const cancel = () => {
                cancelled = true;
                if (this._typewriterFinish === finish) this._typewriterFinish = null;
                if (this._typewriterCancel === cancel) this._typewriterCancel = null;
                this.syncSkipHint();
                resolve();
            };
            this._typewriterCancel = cancel;
            // Skip: the rest of the line appears at once, the cursor goes, and the line
            // resolves now. Text only: a voiced line's audio is a separate step that
            // starts after this promise resolves, so a skip never touches it.
            const finish = () => {
                if (cancelled) return;
                cancelled = true;
                if (this._typewriterFinish === finish) this._typewriterFinish = null;
                this.syncSkipHint();
                messageText.textContent = text;
                messageText.classList.remove('terminal-typing');
                cursor.remove();
                if (scrollToBottom) this.scrollToBottom(false);
                resolve();
            };
            this._typewriterFinish = finish;
            this.syncSkipHint();
            // Reduced motion: lines appear whole (no character-by-character typing)
            if (this._instantType || prefersReducedMotion()) { finish(); return; }

            // Timers run late (nested timeouts, a busy frame), so type by elapsed time: the line
            // takes chars x CHAR_DELAY however late each tick is, and the batch keeps its budget
            const startedAt = Date.now();
            const tick = () => {
                if (cancelled) return;
                if (i < chars.length) {
                    const due = Math.max(i + 1, Math.floor((Date.now() - startedAt) / CHAR_DELAY));
                    const upTo = Math.min(chars.length, due);
                    messageText.textContent += chars.slice(i, upTo).join('');
                    i = upTo;
                    if (scrollToBottom) this.scrollToBottom(false);
                    setTimeout(tick, CHAR_DELAY);
                } else {
                    messageText.classList.remove('terminal-typing');
                    cursor.classList.add('blink');
                    setTimeout(() => {
                        if (cancelled) return;
                        if (this._typewriterFinish === finish) this._typewriterFinish = null;
                        this.syncSkipHint();
                        cursor.remove();
                        resolve();
                    }, BLINK_DURATION);
                }
            };
            setTimeout(tick, CHAR_DELAY);
        });
    }

    /**
     * A call row (plan 2.6): "Missed call", "Incoming call, 1:24" and the like. Centred and muted
     * like narration, with a phone glyph; plain text only, never voiced or barked.
     */
    _addCallRow(message, text, scrollToBottom) {
        const row = document.createElement('div');
        const event = message && typeof message.callEvent === 'string' ? message.callEvent : '';
        row.className = `message-call-row${event === 'missed' ? ' missed' : ''}`;
        if (event) row.dataset.callEvent = event;
        const glyph = document.createElement('span');
        glyph.className = 'call-row-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = '\u260E';
        const label = document.createElement('span');
        label.className = 'call-row-text';
        label.textContent = displayDashes(text);
        row.append(glyph, label);
        this.elements.messagesContainer.appendChild(row);
        if (event === 'missed') this.refreshRowCallBack();
        if (scrollToBottom) this.scrollToBottom();
        return Promise.resolve();
    }

    /**
     * Add multiple messages at once (for loading history)
     * @param {Array} messages - Array of message objects
     */
    addMessages(messages, opts = {}) {
        if (!messages || messages.length === 0) {
            return;
        }

        const savedTheme = this.isTerminalTheme;

        // A terminal contact's preloaded first open types its lines out in order, like
        // live terminal output, instead of the instant history dump. Only on first open
        // (opts.typeTerminalOpening) and only for a terminal theme; everything else keeps
        // the instant draw below. Fire-and-forget: the caller does not await it, so the
        // choices and the rest of openConversation appear as usual while it types.
        if (opts.typeTerminalOpening && savedTheme) {
            (async () => {
                for (const msg of messages) {
                    await this.addMessage(msg.type, msg.text, true, msg);
                }
                this.scrollToBottom();
            })();
            console.log(`💬 Typing out ${messages.length} preloaded terminal opening line(s)`);
            return;
        }

        this.isTerminalTheme = false;
        messages.forEach(msg => {
            this.addMessage(msg.type, msg.text, false, msg);
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
            this.clearChoices();
            return;
        }
        if (this.isCallMode) this.elements.conversationView?.classList.add('call-has-choices');
        
        const box = this.elements.choicesContainer;
        // Honour the hand-off only while focus has not gone anywhere else since the pick
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        const focusFree = !active || active === document.body || box.contains(active);
        const refocus = this._refocusChoices && focusFree;
        this._refocusChoices = false;
        this.elements.choicesContainer.innerHTML = '';
        
        choices.forEach((choice, index) => {
            const choiceButton = document.createElement('button');
            choiceButton.className = 'choice-button';
            choiceButton.dataset.index = index;
            // Number prefix for choices 1-9, as person-chat shows (keys 1-9 pick them)
            // The plain text is kept for the player's message bubble
            choiceButton.dataset.text = displayDashes(choice.text);
            choiceButton.textContent = numberedChoiceText(choiceButton.dataset.text, index);
            
            this.elements.choicesContainer.appendChild(choiceButton);
        });

        // A new reply set starts at the top: the old set may have been scrolled to its last
        // reply, which would hide replies 1-3 and the "more choices" cue (call mode, short screens).
        // Reset after the buttons are in: Chromium restores the old offset on the emptied box
        // once content comes back, so a reset before the append is undone (live, 844x390)
        box.scrollTop = 0;
        if (refocus) box.querySelector('.choice-button')?.focus({ preventScroll: true });

        this.scrollToBottom();
        this.updateChoicesScrollCue();
        this.syncSkipHint();
        // Measure again once the buttons have laid out
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this.updateChoicesScrollCue());
        }
        console.log(`🔘 Added ${choices.length} choices`);
    }
    
    /**
     * Show the "more choices" cue only while choices are hidden below the fold
     */
    updateChoicesScrollCue() {
        const box = this.elements?.choicesContainer;
        const cue = this.elements?.choicesMoreCue;
        if (!box || !cue) return;
        cue.classList.toggle('visible', hasHiddenChoicesBelow(box));
    }

    /**
     * Clear all choice buttons
     */
    clearChoices() {
        // A reply picked from the keyboard leaves focus on a button that is about to go:
        // remember it so the next reply set takes focus instead of dropping it to BODY
        const box = this.elements.choicesContainer;
        // (keyboard picks only: a mouse pick keeps today's behaviour, where Space/Enter skip the typewriter)
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        if (box && active && box.contains(active)) {
            let keyboard = false;
            try { keyboard = active.matches(':focus-visible'); } catch { keyboard = false; }
            this._refocusChoices = keyboard;
        }
        this.elements.choicesContainer.innerHTML = '';
        this.elements.choicesMoreCue?.classList.remove('visible');
        if (this.isCallMode) this.elements.conversationView?.classList.remove('call-has-choices');
        this.syncSkipHint();
    }
    
    /**
     * Show typing indicator (NPC is "typing")
     */
    showTypingIndicator() {
        // The phone can be torn down under a typeout: a tag on the chosen line
        // (start_debrief_cutscene) closes it before the reply is typed (m06 N-6-1)
        const el = this.elements?.typingIndicator;
        if (!el) return;
        el.style.display = 'flex';
        this.scrollToBottom();
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const el = this.elements?.typingIndicator;
        if (el) el.style.display = 'none';
    }
    
    /**
     * Scroll messages container to bottom
     * @param {boolean} smooth - Whether to use smooth scrolling
     */
    scrollToBottom(smooth = true) {
        const container = this.elements?.messagesContainer;
        if (!container) return;
        if (this._bottomPin) {
            this._bottomPin.pin(smooth);
            return;
        }
        container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }
    
    /**
     * Get current time as formatted string
     * @returns {string} Time in HH:MM format
     */
    getCurrentTime() {
        // Game time when the scenario has an in-game clock, else the wall clock (h:mm)
        return messageClockText(null);
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
        // C-PH1: show the toast inside the phone screen, not as raw text on the backdrop below
        // the phone. Fall back to the container only if the screen is not rendered yet.
        const host = this.container.querySelector('.phone-screen') || this.container;
        host.appendChild(notification);
        
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
    /**
     * Row 10 (phone calls plan 2.4): an incoming call rings inside the phone, as a panel over its
     * content with the caller's avatar, name, caption and Answer / Decline buttons.
     * @param {{npcId, name, caption, avatar, withheld, forced, onAnswer, onDecline}} view
     */
    showIncomingCall(view) {
        this.hideIncomingCall();
        const host = this.container.querySelector('.phone-screen') || this.container;
        const panel = document.createElement('div');
        panel.className = 'phone-incoming-call';
        panel.dataset.npcId = view.npcId || '';
        panel.setAttribute('role', 'alertdialog');
        panel.setAttribute('aria-label', `Incoming call from ${view.name}`);
        const avatar = document.createElement('div');
        avatar.className = 'phone-incoming-call-avatar';
        if (view.avatar) {
            const img = document.createElement('img');
            img.alt = '';
            img.src = view.avatar;
            avatar.appendChild(img);
        } else {
            avatar.textContent = '\u260E';   // a plain handset glyph
        }
        panel.appendChild(avatar);
        const name = document.createElement('div');
        name.className = 'phone-incoming-call-name';
        name.textContent = view.name || '';
        panel.appendChild(name);
        if (view.caption) {
            const caption = document.createElement('div');
            caption.className = 'phone-incoming-call-caption';
            caption.textContent = view.caption;
            panel.appendChild(caption);
        }
        const status = document.createElement('div');
        status.className = 'phone-incoming-call-status';
        status.textContent = view.connecting ? 'Connecting\u2026' : 'Incoming call';
        panel.appendChild(status);
        const buttons = document.createElement('div');
        buttons.className = 'phone-incoming-call-buttons';
        if (view.connecting) {
            // Answered, not open yet: nothing to answer or decline (A3 R1 m3, m4)
            if (view.onHangUp) {
                const hang = document.createElement('button');
                hang.type = 'button';
                hang.className = 'phone-incoming-call-decline';
                hang.textContent = 'Hang up';
                hang.setAttribute('aria-label', 'Hang up');
                hang.addEventListener('click', () => view.onHangUp());
                buttons.appendChild(hang);
            }
            panel.appendChild(buttons);
            host.appendChild(panel);
            this._incomingCallPanel = panel;
            return;
        }
        const answer = document.createElement('button');
        answer.type = 'button';
        answer.className = 'phone-incoming-call-answer';
        answer.textContent = 'Answer';
        answer.setAttribute('aria-label', `Answer call from ${view.name}`);
        answer.addEventListener('click', () => view.onAnswer?.());
        buttons.appendChild(answer);
        if (!view.forced) {
            const decline = document.createElement('button');
            decline.type = 'button';
            decline.className = 'phone-incoming-call-decline';
            decline.textContent = 'Decline';
            decline.setAttribute('aria-label', 'Decline call');
            decline.addEventListener('click', () => view.onDecline?.());
            buttons.appendChild(decline);
        }
        panel.appendChild(buttons);
        host.appendChild(panel);
        this._incomingCallPanel = panel;
    }

    hideIncomingCall() {
        if (this._incomingCallPanel) {
            this._incomingCallPanel.remove();
            this._incomingCallPanel = null;
        }
    }

    incomingCallShowing() {
        return !!this._incomingCallPanel;
    }

    cleanup() {
        this.hideIncomingCall();
        this._refocusChoices = false;
        this.stopCallTimer();
        this._chatInfluence?.destroy();
        this._chatInfluence = null;
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
        this._bottomPin?.destroy();
        this._bottomPin = null;
        this.container.innerHTML = '';
        this.elements = {};
        this.currentView = 'contact-list';
        this.currentNPCId = null;
        console.log('🧹 Phone UI cleaned up');
    }
}
