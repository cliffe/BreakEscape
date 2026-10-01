// Minimal NPCBarkSystem
// OPTIMIZED: Debouncing, bark limiting, efficient DOM updates
// default export class NPCBarkSystem

import { ASSETS_PATH } from '../config.js';
import TTSManager from './tts-manager.js';

export default class NPCBarkSystem {
  constructor(npcManager) {
    this.npcManager = npcManager;
    this.container = null;
    this.barkSound = null;
    this.vibrateSound = null;
    this.soundEnabled = true; // Can be toggled via settings
    
    // One TTSManager per NPC so concurrent barks from different NPCs play
    // simultaneously without sharing (and corrupting) a single audio element.
    this.ttsManagers = new Map(); // npcId → TTSManager

    // OPTIMIZATION: Limit simultaneous barks
    this.maxSimultaneousBarks = 5;
    this.activeBarkCount = 0;

    // Popups close themselves after this long if the player ignores them
    this.barkAutoCloseMs = 60000;
    
    // OPTIMIZATION: Debounce rapid bark queuing
    this.barkQueue = [];
    this.isProcessingQueue = false;

    // Barks deferred while a person-chat conversation is open
    this.deferredBarkQueue = [];
    this.isDrainingDeferred = false;

    this.clearAllButton = null;
  }

  init() {
    // create a simple container for barks if missing
    if (!document) return;
    this.container = document.getElementById('npc-bark-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'npc-bark-container';
      document.body.appendChild(this.container);
    }
    
    // Preload bark notification sound
    this.loadBarkSound();

    // "Clear all" button — lives above the bark stack, hidden until barks exist
    this.clearAllButton = document.createElement('button');
    this.clearAllButton.className = 'npc-bark-clear-all';
    this.clearAllButton.textContent = 'Clear all';
    this.clearAllButton.style.display = 'none';
    this.clearAllButton.addEventListener('click', () => this._clearAllBarks());
    this.container.prepend(this.clearAllButton);
  }

  /**
   * Load the bark notification sound effect from Phaser
   */
  loadBarkSound() {
    try {
      // Access Phaser's global sound manager
      if (window.game && window.game.sound) {
        this.barkSound = window.game.sound.add('message_received');
        this.barkSound.setVolume(0.5); // 50% volume by default
        this.vibrateSound = window.game.sound.add('phone_vibrate');
        this.vibrateSound.setVolume(0.7);
        console.log('✅ NPC bark sound loaded from Phaser');
      } else {
        console.warn('⚠️ Phaser sound manager not available yet. Will try again on first bark.');
      }
    } catch (error) {
      console.warn('Failed to load bark sound:', error);
    }
  }

  /**
   * Play the bark notification sound
   */
  playBarkSound() {
    if (!this.soundEnabled) return;
    
    // Lazy load if not available during init
    if (!this.barkSound && window.game && window.game.sound) {
      this.loadBarkSound();
    }
    
    if (!this.barkSound) return;
    
    try {
      // Phaser handles sound pooling automatically
      this.barkSound.play();
      if (this.vibrateSound) {
        this.vibrateSound.play();
      }
    } catch (error) {
      console.warn('Error playing bark sound:', error);
    }
  }

  /**
   * Enable or disable bark sounds
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    if (!enabled) { for (const mgr of this.ttsManagers.values()) mgr.stop(); }
  }

  /**
   * Speak bark text via TTS for a specific NPC.
   * Each NPC gets its own TTSManager (and therefore its own <audio> element)
   * so multiple NPCs can bark simultaneously without sharing audio state.
   * Falls back to the phone beep if TTS is unavailable.
   *
   * @param {string} npcId
   * @param {string} text
   */
  async _speakBark(npcId, text) {
    if (!this.ttsManagers.has(npcId)) {
      this.ttsManagers.set(npcId, new TTSManager());
    }
    const mgr = this.ttsManagers.get(npcId);
    const duration = await mgr.play(npcId, text);
    if (!duration) {
      // TTS unavailable — fall back to the standard notification sound
      this.playBarkSound();
    }
  }

  /**
   * OPTIMIZATION: Queue bark for processing with debouncing.
   * If a person-chat conversation is currently open, defer the bark so it
   * plays (one at a time) after the conversation closes.
   */
  showBark(payload = {}) {
    if (!this.container) this.init();

    if (window.currentConversationMinigameType === 'person-chat') {
      console.log('💬 person-chat active — deferring bark:', payload.text || payload.message);
      this.deferredBarkQueue.push(payload);
      return null;
    }

    // OPTIMIZATION: Queue bark instead of rendering immediately
    this.barkQueue.push(payload);
    this._processBarkQueue();

    return null; // Return null since we're processing async
  }

  /**
   * Play deferred barks one at a time now that a person-chat has closed.
   * Each bark finishes (including TTS audio) before the next begins.
   */
  async drainDeferredBarks() {
    if (this.isDrainingDeferred || this.deferredBarkQueue.length === 0) return;
    this.isDrainingDeferred = true;

    console.log(`📣 Draining ${this.deferredBarkQueue.length} deferred bark(s)`);

    while (this.deferredBarkQueue.length > 0) {
      const payload = this.deferredBarkQueue.shift();
      const ttsPromise = await this._renderBark(payload);
      // Wait for TTS to finish (or a short minimum) before showing the next deferred bark
      await Promise.all([
        ttsPromise || Promise.resolve(),
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);
    }

    this.isDrainingDeferred = false;
  }

  /**
   * OPTIMIZATION: Process queued barks with limits
   */
  async _processBarkQueue() {
    if (this.isProcessingQueue || this.barkQueue.length === 0) return;
    
    if (this.activeBarkCount >= this.maxSimultaneousBarks) {
      // Wait before trying again
      setTimeout(() => this._processBarkQueue(), 100);
      return;
    }
    
    this.isProcessingQueue = true;
    const payload = this.barkQueue.shift();
    
    try {
      await this._renderBark(payload);
    } finally {
      this.isProcessingQueue = false;
      if (this.barkQueue.length > 0) {
        this._processBarkQueue();
      }
    }
  }

  /**
   * Find a Phaser NPC sprite by npcId, searching all loaded rooms.
   * @param {string} npcId
   * @returns {Phaser.GameObjects.Sprite|null}
   */
  _findNPCSprite(npcId) {
    const rooms = window.rooms;
    if (!rooms) return null;
    for (const room of Object.values(rooms)) {
      if (!room.npcSprites) continue;
      const sprite = room.npcSprites.find(s => s.npcId === npcId);
      if (sprite) return sprite;
    }
    return null;
  }

  /**
   * Show a pulsing talk icon above the NPC sprite for the duration of a bark.
   * Uses a dedicated sprite.barkIcon separate from the proximity interactionIndicator
   * so the two systems don't interfere with each other.
   * @param {string} npcId
   * @param {number} duration  ms to keep the icon visible
   */
  _showBarkIcon(npcId, duration) {
    const sprite = this._findNPCSprite(npcId);
    if (!sprite || !sprite.scene) return;

    const scene = sprite.scene;

    // Lazy-create a dedicated bark icon the first time it's needed
    if (!sprite.barkIcon) {
      sprite.barkIcon = scene.add.image(
        Math.round(sprite.x + 5),
        Math.round(sprite.y - 38),
        'talk'
      );
      sprite.barkIcon.setDepth(sprite.depth + 2); // above proximity indicator
      sprite.barkIcon.setVisible(false);
    }

    const icon = sprite.barkIcon;

    // Cancel any in-progress bark pulse
    if (sprite._barkTween) {
      sprite._barkTween.stop();
      sprite._barkTween = null;
    }
    if (sprite._barkHideTimer) {
      clearTimeout(sprite._barkHideTimer);
      sprite._barkHideTimer = null;
    }

    // Show and start pulsing
    icon.setVisible(true);
    icon.setScale(1);
    icon.setAlpha(1);

    sprite._barkTween = scene.tweens.add({
      targets: icon,
      scaleX: { from: 1, to: 1.25 },
      scaleY: { from: 1, to: 1.25 },
      alpha:  { from: 1, to: 0.55 },
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto-hide after duration
    sprite._barkHideTimer = setTimeout(() => {
      if (sprite._barkTween) {
        sprite._barkTween.stop();
        sprite._barkTween = null;
      }
      icon.setVisible(false);
      icon.setScale(1);
      icon.setAlpha(1);
      sprite._barkHideTimer = null;
    }, duration);
  }

  /**
   * Actually render the bark to DOM
   */
  async _renderBark(payload = {}) {
    const { npcId, npcName, avatar } = payload;
    const text = payload.text || payload.message || '';
    const duration = ('duration' in payload) ? payload.duration : 5000;
    const playSound = payload.playSound !== false; // Default true
    
    // Person NPCs with a voice config speak their bark via TTS; everyone else gets the phone beep
    let ttsPromise = null;
    if (playSound && payload.useTTS && npcId && text) {
      ttsPromise = this._speakBark(npcId, text);
    } else if (playSound) {
      this.playBarkSound();
    }

    // Flash a pulsing talk icon above the NPC's sprite for the bark duration
    if (npcId) {
      this._showBarkIcon(npcId, duration);
    }
    
    // Create bark element (using DocumentFragment for batch update)
    const el = document.createElement('div');
    el.className = 'npc-bark';
    
    // Add avatar if provided
    if (avatar) {
      const avatarImg = document.createElement('img');
      // Resolve avatar path to full URL if relative
      let avatarSrc = avatar;
      if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http')) {
        if (avatarSrc.startsWith('assets/')) {
          avatarSrc = `/break_escape/${avatarSrc}`;
        } else {
          avatarSrc = `${ASSETS_PATH}/${avatarSrc}`;
        }
      }
      avatarImg.src = avatarSrc;
      avatarImg.className = 'npc-bark-avatar';
      avatarImg.alt = npcName || npcId || 'NPC';
      el.appendChild(avatarImg);
    }
    
    // Add text content
    const textSpan = document.createElement('span');
    textSpan.className = 'npc-bark-text';
    const displayName = npcName || npcId || 'NPC';
    textSpan.textContent = `${displayName}: ${text}`;
    el.appendChild(textSpan);

    // Dismiss (×) button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'npc-bark-dismiss';
    dismissBtn.textContent = '×';
    dismissBtn.addEventListener('click', e => {
      e.stopPropagation();
      this._removeBark(el);
    });
    el.appendChild(dismissBtn);

    // Swipe-to-dismiss (before click handlers so capture listener fires first)
    this._addSwipeGesture(el);

    this.container.appendChild(el);
    this.activeBarkCount++;
    this._updateClearAllButton();
    this._trimBarkStackToFit();

    el._autoCloseTimer = setTimeout(() => this._removeBark(el), this.barkAutoCloseMs);

    // Handle clicks - either custom handler or auto-open phone
    if (typeof payload.onClick === 'function') {
      el.addEventListener('click', () => payload.onClick(el));
    } else if (payload.openPhone !== false && npcId) {
      // Default: clicking bark opens phone chat with this NPC
      el.addEventListener('click', () => {
        this.openPhoneChat(payload);
        this._removeBark(el);
      });
    }

    return ttsPromise;
  }

  /**
   * OPTIMIZATION: Remove bark with animation
   */
  _removeBark(el) {
    if (!el || !el.parentNode || el._removing) return;
    el._removing = true;
    clearTimeout(el._autoCloseTimer);

    const finish = () => {
      if (el.parentNode) el.parentNode.removeChild(el);
      this.activeBarkCount--;
      this._updateClearAllButton();
      if (this.barkQueue.length > 0) this._processBarkQueue();
    };

    // If already invisible (swiped away), remove immediately without re-animating
    if (el.style.opacity === '0') {
      finish();
      return;
    }

    el.style.animation = 'bark-slide-out 0.3s ease-out';
    setTimeout(finish, 300);
  }

  _updateClearAllButton() {
    if (!this.clearAllButton) return;
    const hasBarks = this.container.querySelectorAll('.npc-bark').length > 0;
    this.clearAllButton.style.display = hasBarks ? 'block' : 'none';
  }

  _clearAllBarks() {
    Array.from(this.container.querySelectorAll('.npc-bark')).forEach(el => this._removeBark(el));
  }

  _trimBarkStackToFit() {
    requestAnimationFrame(() => {
      // 80px bottom offset + 20px breathing room before the top of the screen
      const maxHeight = window.innerHeight - 100;
      const overflow = this.container.offsetHeight - maxHeight;
      if (overflow <= 0) return;

      // Oldest barks are first in DOM; always preserve at least the newest one
      const barks = Array.from(this.container.querySelectorAll('.npc-bark'));
      const candidates = barks.slice(0, -1);
      let freed = 0;
      for (const el of candidates) {
        if (freed >= overflow) break;
        freed += el.offsetHeight + 8; // 8px matches the container gap
        this._removeBark(el);
      }
    });
  }

  /**
   * Add swipe-to-dismiss gesture to a bark element.
   * Swiping left or right past a threshold dismisses it; releasing short snaps it back.
   */
  _addSwipeGesture(el) {
    let startX = null;
    let startY = null;
    let isDragging = false;
    let hasSwiped = false;
    const SWIPE_THRESHOLD = 80;
    const MAX_VERTICAL = 50;

    // Capture-phase click interceptor: cancel click if the pointer was dragged
    el.addEventListener('click', e => {
      if (hasSwiped) { e.stopImmediatePropagation(); hasSwiped = false; }
    }, true);

    const onStart = (clientX, clientY) => {
      startX = clientX;
      startY = clientY;
      isDragging = true;
      hasSwiped = false;
      el.style.transition = 'none';
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging || startX === null) return;
      if (Math.abs(clientY - startY) > MAX_VERTICAL) { isDragging = false; return; }
      const dx = clientX - startX;
      if (Math.abs(dx) > 5) hasSwiped = true;
      el.style.transform = `translateX(${dx}px)`;
      el.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / SWIPE_THRESHOLD));
    };

    const onEnd = (clientX) => {
      if (!isDragging) return;
      isDragging = false;
      const dx = clientX - startX;
      startX = null;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        hasSwiped = true;
        const dir = dx > 0 ? 1 : -1;
        el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        el.style.transform = `translateX(${dir * 300}px)`;
        el.style.opacity = '0';
        setTimeout(() => this._removeBark(el), 200);
      } else {
        hasSwiped = false;
        el.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        el.style.transform = '';
        el.style.opacity = '';
      }
    };

    el.addEventListener('touchstart', e => onStart(e.changedTouches[0].clientX, e.changedTouches[0].clientY), { passive: true });
    el.addEventListener('touchmove',  e => onMove(e.changedTouches[0].clientX,  e.changedTouches[0].clientY), { passive: true });
    el.addEventListener('touchend',   e => onEnd(e.changedTouches[0].clientX));

    el.addEventListener('mousedown', e => {
      onStart(e.clientX, e.clientY);
      const onMouseMove = ev => onMove(ev.clientX, ev.clientY);
      const onMouseUp   = ev => {
        onEnd(ev.clientX);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup',   onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup',   onMouseUp);
    });
  }
  
  async openPhoneChat(payload) {
    const { npcId, npcName, avatar, inkStoryPath, startKnot } = payload;
    
    console.log('📱 Opening phone chat for NPC:', npcId, 'with payload:', payload);
    
    // Get NPC data from manager if available
    let npcData = null;
    if (this.npcManager) {
      npcData = this.npcManager.getNPC(npcId);
      console.log('📋 NPC data from manager:', npcData);
    }

    // Build minigame params
    const params = {
      npcId: npcId,
      npcName: npcName || (npcData && npcData.displayName) || npcId,
      avatar: avatar || (npcData && npcData.avatar),
      inkStoryPath: inkStoryPath || (npcData && npcData.storyPath),
      // Only a knot the text itself names (sendTimedMessage.targetKnot, a mapping's knot).
      // Falling back to npc.currentKnot made every notification click an explicit jump:
      // phone-chat then cleared the thread and re-ran the last knot entered, instead of
      // reopening the saved conversation (E10/E13). Without a knot it reopens the thread.
      startKnot: startKnot || null,
      theme: npcData?.phoneTheme
    };
    
    console.log('📱 Final params for phone chat:', params);

    // Try MinigameFramework first (if in game with Phaser)
    if (window.MinigameFramework && typeof window.MinigameFramework.startMinigame === 'function') {
      window.MinigameFramework.startMinigame('phone-chat', null, params);
      console.log('✅ Opened phone chat via MinigameFramework');
      return;
    }
    
    // Try dynamic import as fallback
    try {
      const module = await import('../minigames/phone-chat/phone-chat-minigame.js');
      if (module.PhoneChatMinigame) {
        if (window.MinigameFramework && typeof window.MinigameFramework.startMinigame === 'function') {
          window.MinigameFramework.startMinigame('phone-chat', null, params);
          console.log('✅ Opened phone chat via dynamic import + MinigameFramework');
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not dynamically import phone-chat minigame:', error);
    }
    
    // Final fallback: create inline phone UI for testing environments without Phaser
    console.log('Using inline fallback phone UI (no Phaser/MinigameFramework)');
    this.createInlinePhoneUI(params);
  }

  createInlinePhoneUI(params) {
    // Create a simple phone-like chat UI inline
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
    `;

    const phone = document.createElement('div');
    phone.style.cssText = `
      width: 360px; height: 600px; background: #1a1a1a;
      border: 2px solid #333; display: flex; flex-direction: column;
      font-family: sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #2a2a2a; padding: 16px; border-bottom: 2px solid #333;
      display: flex; align-items: center; justify-content: space-between;
    `;
    header.innerHTML = `
      <span style="color: white; font-weight: bold;">${params.npcName || 'Chat'}</span>
      <button id="phone-close" style="background: #d32f2f; color: white; border: none; padding: 4px 12px; cursor: pointer;">Close</button>
    `;

    // Messages container
    const messages = document.createElement('div');
    messages.id = 'phone-messages';
    messages.style.cssText = `
      flex: 1; overflow-y: auto; padding: 16px; background: #0a0a0a;
    `;

    // Choices container
    const choices = document.createElement('div');
    choices.id = 'phone-choices';
    choices.style.cssText = `
      padding: 12px; background: #1a1a1a; border-top: 2px solid #333;
      display: flex; flex-direction: column; gap: 8px;
    `;

    phone.appendChild(header);
    phone.appendChild(messages);
    phone.appendChild(choices);
    overlay.appendChild(phone);
    document.body.appendChild(overlay);

    // Close handler
    header.querySelector('#phone-close').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Load and run Ink story
    if (params.inkStoryPath && window.InkEngine) {
      this.runInlineStory(params, messages, choices);
    } else {
      messages.innerHTML = '<div style="color: #999; text-align: center; margin-top: 50%;">No story path provided or InkEngine not loaded</div>';
    }
  }

  async runInlineStory(params, messagesContainer, choicesContainer) {
    try {
      // Fetch story JSON using Rails API endpoint
      const gameId = window.breakEscapeConfig?.gameId;
      const endpoint = gameId 
        ? `/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(params.npcId)}`
        : params.inkStoryPath;  // Fallback to provided path if no gameId
      
      const response = await fetch(endpoint);
      const storyJson = await response.json();

      // Create engine instance
      const engine = new window.InkEngine();
      engine.loadStory(storyJson);

      // Set NPC name variable if the story supports it
      try {
        engine.setVariable('npc_name', params.npcName || params.npcId);
        console.log('✅ Set npc_name variable to:', params.npcName || params.npcId);
      } catch (e) {
        console.log('⚠️ Story does not have npc_name variable (this is ok)');
      }

      console.log('📖 Story loaded, navigating to knot:', params.startKnot);

      // Navigate to start knot if specified
      if (params.startKnot) {
        engine.goToKnot(params.startKnot);
        console.log('✅ Navigated to knot:', params.startKnot);
      }

      // Display conversation history first
      if (this.npcManager) {
        const history = this.npcManager.getConversationHistory(params.npcId);
        console.log(`📜 Loading ${history.length} messages from history for NPC: ${params.npcId}`);
        console.log('History content:', history);
        
        history.forEach(msg => {
          const msgDiv = document.createElement('div');
          if (msg.type === 'player') {
            msgDiv.style.cssText = `
              background: #4a9eff; color: white; padding: 10px;
              border-radius: 8px; margin-bottom: 8px; max-width: 80%;
              margin-left: auto; text-align: right;
            `;
          } else {
            msgDiv.style.cssText = `
              background: #2a5a8a; color: white; padding: 10px;
              border-radius: 8px; margin-bottom: 8px; max-width: 80%;
            `;
          }
          msgDiv.textContent = msg.text;
          messagesContainer.appendChild(msgDiv);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }

      // Continue story and render
      const continueStory = (playerChoiceText = null) => {
        console.log('📖 Continuing story...');
        
        // If player made a choice, show it as a player message and record it
        if (playerChoiceText) {
          const playerMsg = document.createElement('div');
          playerMsg.style.cssText = `
            background: #4a9eff; color: white; padding: 10px;
            border-radius: 8px; margin-bottom: 8px; max-width: 80%;
            margin-left: auto; text-align: right;
          `;
          playerMsg.textContent = playerChoiceText;
          messagesContainer.appendChild(playerMsg);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // Record player choice in history
          if (this.npcManager) {
            this.npcManager.addMessage(params.npcId, 'player', playerChoiceText);
          }
        }
        
        const result = engine.continue();
        
        console.log('Story result:', {
          text: result.text,
          textLength: result.text ? result.text.length : 0,
          choicesCount: result.choices ? result.choices.length : 0,
          canContinue: result.canContinue
        });
        
        // Add NPC message if there's text and record it
        if (result.text && result.text.trim()) {
          const msg = document.createElement('div');
          msg.style.cssText = `
            background: #2a5a8a; color: white; padding: 10px;
            border-radius: 8px; margin-bottom: 8px; max-width: 80%;
          `;
          msg.textContent = result.text.trim();
          messagesContainer.appendChild(msg);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          console.log('✅ Message added:', result.text.trim().substring(0, 50) + '...');
          
          // Record NPC message in history
          if (this.npcManager) {
            this.npcManager.addMessage(params.npcId, 'npc', result.text.trim());
          }
        } else {
          console.warn('⚠️ No text in result');
        }

        // Clear and add choices
        choicesContainer.innerHTML = '';
        if (result.choices && result.choices.length > 0) {
          console.log('✅ Adding', result.choices.length, 'choices');
          result.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.style.cssText = `
              background: #4a9eff; color: white; border: 2px solid #6ab0ff;
              padding: 10px; cursor: pointer; font-size: 14px;
              transition: background 0.2s;
            `;
            btn.textContent = choice.text;
            btn.addEventListener('mouseenter', () => {
              btn.style.background = '#6ab0ff';
            });
            btn.addEventListener('mouseleave', () => {
              btn.style.background = '#4a9eff';
            });
            btn.addEventListener('click', () => {
              console.log('Choice selected:', index, choice.text);
              engine.choose(index);
              // Pass the choice text so it appears as a player message
              continueStory(choice.text);
            });
            choicesContainer.appendChild(btn);
          });
        } else if (!result.canContinue) {
          // Story ended
          console.log('📕 Story ended');
          const endMsg = document.createElement('div');
          endMsg.style.cssText = 'color: #999; text-align: center; padding: 12px; font-style: italic;';
          endMsg.textContent = '— End of conversation —';
          messagesContainer.appendChild(endMsg);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
          console.log('⚠️ No choices but story can continue');
        }
      };

      continueStory();
    } catch (err) {
      console.error('❌ Failed to run inline story:', err);
      messagesContainer.innerHTML = `<div style="color: #f44; padding: 16px;">Error loading story: ${err.message}</div>`;
    }
  }
}
