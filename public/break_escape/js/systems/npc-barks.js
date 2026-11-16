// Minimal NPCBarkSystem
// OPTIMIZED: Debouncing, bark limiting, efficient DOM updates
// default export class NPCBarkSystem

import { ASSETS_PATH } from '../config.js';
import TTSManager from './tts-manager.js';
import { phoneBarkText } from '../minigames/phone-chat/phone-chat-speaker.js';
import { displayDashes } from '../utils/display-dashes.js';
import { releaseHeldBarks, HELD_BARK_VOICE_CAP_MS } from './bark-release-policy.js';
import { workstationPopupOpen, phoneThreadOpenFor, openPhoneThread, threadTextKey } from '../utils/overlay-open.js';
import { barkLifetimeMs, barksToTrim, BARK_RESUME_MIN_MS } from './bark-lifetime.js';
import { inventoryBlockedByForcedMinigame } from './forced-minigame-guard.js';
import { barkSource, arrowDirection, startHudLanes, dialogLayerOpen } from '../ui/hud-lanes.js';
import { applyHeadshotBox } from '../utils/npc-headshot.js';

// The phone notification's icon (B2 option A): 16x16 pixel art at 1x
export const PHONE_ICON_URL = '/break_escape/assets/icons/npc-phone.png';

/**
 * Where a bark shows (UX feedback round slice 5, o-barks): the speech bubble over a person NPC
 * whose sprite is in the player's room and on camera, with the room lit and no minigame open;
 * the toast otherwise. Phone contacts always use the toast. The voice is the same either way.
 * @param {object} f  { npcType, hasSprite, npcRoom, playerRoom, dark, minigameOpen, onCamera }
 * @returns {'bubble'|'toast'}
 */
export function routeBark({ npcType, hasSprite = false, npcRoom = null, playerRoom = null, dark = false, minigameOpen = false, onCamera = true } = {}) {
  if (npcType === 'phone') return 'toast';
  if (!hasSprite || minigameOpen || dark || onCamera === false) return 'toast';
  return (npcRoom && npcRoom === playerRoom) ? 'bubble' : 'toast';
}

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

    // Popups close themselves after a reading time that grows with their length
    // (bark-lifetime.js: 3 s + 300 ms a word, 5 to 20 s). Hovering one pauses it.
    
    // OPTIMIZATION: Debounce rapid bark queuing
    this.barkQueue = [];
    this.isProcessingQueue = false;

    // Barks deferred while a person-chat conversation is open
    this.deferredBarkQueue = [];
    this.isDrainingDeferred = false;

    this.clearAllButton = null;
    this.speechContainer = null;
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
    // Speech from someone in the building who is out of view has a lane of its own above the
    // caption (UI decisions H1 and B2): it is not a phone text, so it never looks like one
    this.speechContainer = document.getElementById('npc-speech-container');
    if (!this.speechContainer) {
      this.speechContainer = document.createElement('div');
      this.speechContainer.id = 'npc-speech-container';
      this.speechContainer.setAttribute('aria-live', 'polite');
      document.body.insertBefore(this.speechContainer, this.container);
    }
    // The lanes place both containers, the toasts and the caption between the top bar and dock
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        && typeof window.MutationObserver === 'function' && !window.__hudLanesDisabled) {
      try { startHudLanes(document, window); } catch (e) { console.debug('[hud-lanes] not started:', e); }
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
   * @param {{ beep?: boolean }} [opts]  beep: false for a speech bubble, which never plays the
   *   phone's sound when there is no voice (slice 5 R1 m3)
   */
  async _speakBark(npcId, text, { beep = true } = {}) {
    if (!this.ttsManagers.has(npcId)) {
      this.ttsManagers.set(npcId, new TTSManager());
    }
    const mgr = this.ttsManagers.get(npcId);
    const playing = mgr.play(npcId, text);
    const seq = mgr.playSeq;
    const duration = await playing;
    // A later play() on this manager took over while this one loaded: its null is not "no voice",
    // so no beep, and the newer clip's audio is not this bark's
    if (mgr.playSeq !== seq) return null;
    // A clip whose length reads NaN (no duration in its metadata) is still playing: Infinity
    // means "playing, length unknown", so the hold waits for its ended/pause/error event
    // (capped by the release policy) instead of counting it as silent
    if (!(duration > 0) && this._voicePlaying(mgr)) return Infinity;
    if (!duration && beep) {
      // TTS unavailable — fall back to the standard notification sound
      this.playBarkSound();
    }
    return duration || null;
  }

  /** Is this TTS manager's audio playing now (started, not paused, ended or failed)? */
  _voicePlaying(mgr) {
    const a = mgr && mgr.audio;
    return !!(a && mgr.playing !== false && !a.paused && !a.ended);
  }

  /**
   * Track one bark's voice: live() is true while it is still loading or playing; cancel() stops it
   * now, or as soon as it starts if it is still loading.
   * "Ours" is this play() call (the manager's playSeq when the tracker is made, just after
   * _speakBark called play()), not the text: a requeued line replays the same text on the same
   * manager, and a cancelled tracker must not stop the replay's voice (review R1 m2).
   */
  _voiceTracker(npcId, ttsPromise, text) {
    const mgrOf = () => this.ttsManagers.get(npcId);
    const token = ttsPromise ? mgrOf()?.playSeq : undefined;
    const ours = (m) => !!(m && m.currentText === text && m.playSeq === token);
    const stopIfOurs = () => { const m = mgrOf(); if (ours(m)) m.stop(); };
    const v = {
      state: ttsPromise ? 'pending' : 'none', cancelled: false, started: ttsPromise || null,
      live: () => {
        if (v.cancelled) return false;
        if (v.state === 'pending') return true;
        if (v.state !== 'playing') return false;
        const m = mgrOf();
        return ours(m) && this._voicePlaying(m);
      },
      cancel: () => { v.cancelled = true; stopIfOurs(); }
    };
    if (ttsPromise) {
      ttsPromise.then(ms => {
        if (v.cancelled) { stopIfOurs(); v.state = 'none'; return; }
        v.state = ms ? 'playing' : 'none';
      }, () => { v.state = 'none'; });
    }
    return v;
  }

  /**
   * OPTIMIZATION: Queue bark for processing with debouncing.
   * If a person-chat conversation is currently open, defer the bark so it
   * plays (one at a time) after the conversation closes.
   */
  showBark(payload = {}) {
    if (!this.container) this.init();
    // A text for another thread is already in its history: the open phone's back button counts it
    this._refreshPhoneUnread();

    // A bark repeating a line the open phone thread already shows adds nothing
    // (m06 confirmation R4 M2)
    if (this._shownInOpenThread(payload)) {
      console.debug('[barks] dropped, already in the open thread:', payload.text || payload.message);
      return null;
    }

    // HOLD POLICY (code in bark-release-policy.js; README_scenario_design.md "Bark notifications").
    // While a person-chat or another full-screen minigame is open, hold the bark (it covered
    // the panel, D5). On release: first in, first out; each bark's conditions are re-checked
    // (payload.stillValid) and stale ones dropped; one every ~2.5 s; more than 3 waiting drops
    // the oldest ones that also sit in a phone thread. Drops are logged with console.debug.
    // A bark arriving mid-release joins the end of the line, so it can't jump the queue.
    // The release lasts until the last held bark's voice ends (isDrainingDeferred), so a
    // bark due while that voice plays waits for it (and 0.3 s more) instead of talking over it.
    // A continuation (the rest of a bubble that lost its place, or its unread hint) belongs to
    // the line on screen now: only an open panel holds it, never the line it continues
    // (it was queued behind that line's own voice and showed after it ended).
    const queueHolds = !payload.continuation && (this.isDrainingDeferred || this.deferredBarkQueue.length > 0);
    if (this._shouldDefer(payload) || queueHolds) {
      console.log('💬 conversation/minigame open — deferring bark:', payload.text || payload.message);
      this.deferredBarkQueue.push(payload);
      if (!this._shouldDefer()) this.drainDeferredBarks();
      else this._watchDialogHold();
      return null;
    }

    // OPTIMIZATION: Queue bark instead of rendering immediately
    this.barkQueue.push(payload);
    this._processBarkQueue();

    return null; // Return null since we're processing async
  }

  _shouldDefer(payload) {
    if (window.currentConversationMinigameType === 'person-chat') return true;
    // The CyberChef and lab-sheet popups aren't minigames; a bark covered the
    // workstation's operations list (m04 F7). They drain the queue on close.
    if (workstationPopupOpen()) return true;
    if (window.MinigameFramework?.holdsBarks?.()) return true;
    // A dialog or modal (tutorial prompt, confirm, pause menu, password, preferences): every
    // bark waits until it closes, as for a minigame (review R1 M1). _watchDialogHold drains.
    if (dialogLayerOpen()) return true;
    // A ringer call is on the line (or opening): hold every bark, so a click on another
    // contact's toast cannot open a thread and end the call (phone calls plan 2.9).
    if (window.phoneRinger?.callActive?.()) return true;
    // Phone chat keeps phone texts from other contacts on top, but speech from someone in the
    // building is not a notification for a thread: it waits until the phone closes (R1 M1)
    if (window.MinigameFramework?.isOpen?.('phone-chat')) {
      // On the phone layout the notify lane runs across the open phone, where a text would
      // take a tap meant for its back button: every bark waits, and the back button counts the
      // other threads' unread texts (review R2 M2). Wide screens keep texts on top (m04).
      if (compactHud()) return true;
      if (payload ? this._isSpeech(payload) : this.deferredBarkQueue.some(p => this._isSpeech(p))) return true;
    }
    // The phone keeps other contacts' barks on top, but a bark from the contact whose
    // thread is open waits until the phone closes (m04 confirmation N1). With no
    // payload (the drain's check), hold while any queued bark is from that contact.
    if (payload) return phoneThreadOpenFor(payload.npcId);
    return this.deferredBarkQueue.some(p => phoneThreadOpenFor(p && p.npcId));
  }

  /**
   * Is this bark's text also in a phone thread the player can reopen? Only phone NPCs'
   * threads are saved and shown; a person NPC's bark has no copy that outlasts the toast.
   */
  /** True when the bark's text is a line drawn in the open phone thread. */
  _shownInOpenThread(payload, thread = openPhoneThread()) {
    if (!thread || thread.keys.size === 0) return false;
    const raw = String(payload?.text || payload?.message || '');
    const contact = (payload?.npcId && this.npcManager?.getNPC?.(payload.npcId))
      || { id: payload?.npcId, displayName: payload?.npcName };
    let stripped = raw;
    try { stripped = phoneBarkText(raw, contact); } catch (e) { /* keep raw */ }
    return [raw, stripped].some(t => {
      const k = threadTextKey(t);
      return !!k && thread.keys.has(k);
    });
  }

  /**
   * Close toasts already on screen that point at the thread just opened: any from
   * that contact, and any whose text the thread now shows. HaX's fight text barked
   * before the phone opened stayed beside her open thread (m06 confirmation R4 M2):
   * the hold only covers barks that arrive while the thread is open.
   */
  dismissBarksForOpenThread() {
    if (!this.container) return 0;
    const thread = openPhoneThread();
    if (!thread) return 0;
    let n = 0;
    // Only phone texts point at a thread; speech lines in the building have none
    for (const el of this.container.querySelectorAll('.npc-bark')) {
      if (el._removing) continue;
      if (el._npcId === thread.npcId
          || this._shownInOpenThread({ text: el._barkText, npcId: el._npcId }, thread)) {
        this._removeBark(el);
        n++;
      }
    }
    return n;
  }

  _hasPersistentCopy(payload) {
    // main.js builds the bark system before the NPC manager and never links them back,
    // so fall back to the global manager rather than waking the other this.npcManager paths
    const manager = this.npcManager || (typeof window !== 'undefined' ? window.npcManager : null);
    const npc = payload?.npcId && manager?.getNPC?.(payload.npcId);
    if (!npc || npc.npcType !== 'phone') return false;
    const text = String(payload.text || payload.message || '').trim();
    if (!text) return false;
    const history = manager.getConversationHistory?.(payload.npcId) || [];
    return history.some(m => m && typeof m.text === 'string' && m.text.trim() === text);
  }

  async drainDeferredBarks() {
    if (!this._shouldDefer()) this._dropStaleVisibleBarks();
    if (this.isDrainingDeferred || this.deferredBarkQueue.length === 0) return;
    // Another minigame opened (drained when it closes), or a dialog is open: a minigame that
    // closes under a dialog drains here, so the dialog's watch must start now or nothing
    // releases the queue when the dialog goes (review R2 M1)
    if (this._shouldDefer()) { this._watchDialogHold(); return; }
    this.isDrainingDeferred = true;
    console.log(`📣 Releasing ${this.deferredBarkQueue.length} held bark(s)`);
    try {
      await releaseHeldBarks(this.deferredBarkQueue, {
        shouldHold: () => this._shouldDefer(),
        render: (payload) => ({ voiceEnd: this._voiceEnd(payload.npcId, this._renderBark(payload)) }),
        hasPersistentCopy: (payload) => this._hasPersistentCopy(payload)
      });
    } finally {
      this.isDrainingDeferred = false;
    }
    // A bark that joined the queue after the policy's last look (its showBark call saw the
    // drain still running and returned) would wait for the next trigger: go round once more.
    // Each pass shows at least one bark or drops one, so this ends; the flag guards re-entry.
    if (this.deferredBarkQueue.length > 0 && !this._shouldDefer()) return this.drainDeferredBarks();
    // A dialog opened part way through: the rest go when it closes
    if (this.deferredBarkQueue.length > 0) this._watchDialogHold();
  }

  /**
   * Settles when a rendered bark's voice has finished: true if it played, false if there was
   * none (no TTS, a 503, a failed fetch). `started` is _renderBark's promise, which settles
   * with the clip length in ms once playback starts. The end is the audio element's
   * ended/pause/error/emptied event (stop() pauses it), or the clip length plus a second if no event
   * comes. The release policy also caps the whole wait.
   */
  async _voiceEnd(npcId, started) {
    let ms = null;
    try { ms = await started; } catch (e) { console.debug('[barks] held bark render failed:', e); return false; }
    if (!ms) return false;
    const audio = npcId && this.ttsManagers.get(npcId)?.audio;
    return new Promise(resolve => {
      const events = ['ended', 'pause', 'error', 'emptied'];
      let timer = null;
      const done = () => {
        clearTimeout(timer);
        if (audio) for (const ev of events) audio.removeEventListener(ev, done);
        resolve(true);
      };
      // An unknown or infinite length arms no timer: the events and the policy cap end the wait.
      if (Number.isFinite(ms) && ms > 0) timer = setTimeout(done, ms + 1000);
      if (!audio) return;
      if (audio.ended || audio.paused) { done(); return; }
      for (const ev of events) audio.addEventListener(ev, done);
    });
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
   * Actually render the bark to DOM
   */
  async _renderBark(payload = {}) {
    const { npcId, npcName, avatar } = payload;
    // The popup and its voice carry only the NPC's own words: no "You: …" line (U3) and no
    // "Name:" prefix naming the NPC, which the popup already shows and TTS would read out
    const contact = (npcId && this.npcManager?.getNPC?.(npcId)) || { id: npcId, displayName: npcName };
    const text = phoneBarkText(payload.text || payload.message || '', contact);
    if (!text) return null;
    // Checked again here: a queued or released bark can reach this after its thread opened
    if (this._shownInOpenThread(payload)) {
      console.debug('[barks] dropped, already in the open thread:', text);
      return null;
    }
    const playSound = payload.playSound !== false; // Default true
    const followUp = typeof payload.followUp === 'string' && payload.followUp.trim() ? payload.followUp.trim() : null;

    // A person NPC in view says it in a speech bubble over their head, in place of the toast
    // (slice 5). The rest of a line cut short by leaving view comes back here as a toast.
    // The bubble shows the line with authored " -- " as a dash, as the toast does; the voice
    // gets the raw text, so cached audio still matches (R1 m1).
    let handle = null;
    let voice = null;
    const voiced = !!(playSound && payload.useTTS && npcId && text);
    if (!payload.forceToast && this._routeFor(payload, contact) === 'bubble') {
      handle = window.npcWorldBubbles?.say?.(npcId, displayDashes(text), {
        onRemainder: (rest, info) => this._bubbleLeft(payload, rest, info, voice),
        // The last page stays up while the voice plays (a late start, or a length read as NaN)
        voiceLive: () => !!(voice && voice.live()),
        stillValid: typeof payload.stillValid === 'function' ? payload.stillValid : null,
        // A gate's lockedHint after the guard's refusal, in her bubble (R2 m3); never voiced
        followUp: followUp ? displayDashes(followUp) : null,
        tag: payload.eventPattern || null,
        // Her bubble ended before the hint was read (stillValid, closed, another gate's
        // notification): the hint as a toast of its own, so it is never lost (R3 m1)
        onFollowUpLost: (hint) => this._toastFollowUp(payload, hint)
      }) || null;
    }

    // Person NPCs with a voice config speak their bark via TTS; a toast without one gets the
    // phone's sound. A speech bubble never does: that sound belongs to phone contacts (R1 m3).
    let ttsPromise = null;
    if (voiced) {
      ttsPromise = this._speakBark(npcId, text, { beep: !handle });
    } else if (playSound && !handle) {
      this.playBarkSound();
    }
    if (handle) voice = this._voiceTracker(npcId, ttsPromise, text);

    if (handle) {
      this.lastRoute = { npcId, route: 'bubble' };
      // An unknown length (Infinity) leaves the reading times; voiceLive holds the last page
      if (ttsPromise) ttsPromise.then(ms => { if (Number.isFinite(ms) && ms > 0) handle.setAudioMs(ms); }, () => {});
      return ttsPromise;
    }
    // Phone text or speech in the building (B2 option A): two looks, two places
    const manager = this.npcManager || (typeof window !== 'undefined' ? window.npcManager : null);
    const npcDef = (npcId && manager?.getNPC?.(npcId)) || null;
    const speech = this._isSpeech(payload) && !!this.speechContainer;
    const host = speech ? this.speechContainer : this.container;
    this.lastRoute = { npcId, route: 'toast', source: speech ? 'speech' : 'phone' };

    const el = document.createElement('div');
    el.className = `npc-bark ${speech ? 'npc-bark--speech' : 'npc-bark--phone'}`;
    el.dataset.source = speech ? 'speech' : 'phone';

    // The sender's face: an avatar the caller gave, else the character's own 32x32 headshot
    if (avatar && !/_headshot\.png$/i.test(String(avatar).split(/[?#]/)[0])) {
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
    } else {
      const head = document.createElement('span');
      head.className = 'npc-bark-avatar npc-bark-head';
      head.setAttribute('aria-hidden', 'true');
      head.hidden = true;
      el.appendChild(head);
      const talk = npcDef?.spriteTalk || null;
      try {
        applyHeadshotBox(head, { avatar: avatar || npcDef?.avatar || null, spriteSheet: npcDef?.spriteSheet || null, portrait: talk },
          { talkUrl: talk ? (talk.startsWith('/') || talk.startsWith('http') ? talk : `${ASSETS_PATH}/${talk}`) : null });
      } catch (e) { head.hidden = true; }
    }

    // Add text content
    const textSpan = document.createElement('span');
    textSpan.className = 'npc-bark-text';
    const displayName = npcName || npcId || 'NPC';
    // A follow-up (a gate's lockedHint) that could not go in a bubble rides on the toast
    textSpan.textContent = `${displayName}: ${displayDashes(followUp ? `${text} ${followUp}` : text)}`;

    if (speech) {
      // Which way the speaker is from the player, as a pixel arrow (no text, nothing to voice)
      const arrow = document.createElement('span');
      arrow.className = 'npc-bark-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      const dir = this._speakerDirection(npcId);
      if (dir) arrow.dataset.dir = dir; else arrow.hidden = true;
      el.appendChild(textSpan);
      el.appendChild(arrow);
    } else {
      // A phone text: the phone icon says where it came from, and a tap opens the thread
      const icon = document.createElement('img');
      icon.className = 'npc-bark-phone-icon';
      icon.src = PHONE_ICON_URL;
      icon.alt = '';
      icon.setAttribute('aria-hidden', 'true');
      el.appendChild(icon);
      el.appendChild(textSpan);
      // Dismiss (x) button
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'npc-bark-dismiss';
      dismissBtn.textContent = '×';
      dismissBtn.setAttribute('aria-label', 'Dismiss');
      dismissBtn.addEventListener('click', e => {
        e.stopPropagation();
        this._removeBark(el);
      });
      el.appendChild(dismissBtn);
      // Swipe-to-dismiss (before click handlers so capture listener fires first)
      this._addSwipeGesture(el);
    }

    if (typeof payload.stillValid === 'function') el._stillValid = payload.stillValid;
    el._npcId = npcId || null;
    el._barkText = payload.text || payload.message || '';

    host.appendChild(el);
    this.activeBarkCount++;
    this._updateClearAllButton();
    this._trimBarkStackToFit(host);

    el._shownAt = Date.now();
    this._startAutoClose(el, barkLifetimeMs(textSpan.textContent));
    el._lifetime = el._autoCloseRemaining;
    // The toast stays while the voice it carries plays: its own, or (a continuation) the voice
    // of the bubble it took over from
    // (the bubble's voice may still be loading: then hold from when it starts)
    const carried = payload.continuation ? payload.continuationVoice : null;
    if (carried && carried.state === 'pending' && carried.started) {
      carried.started.then(() => { if (carried.live()) this._holdToastForVoice(el, npcId); }, () => {});
    } else if (payload.continuation) this._holdToastForVoice(el, npcId);
    else if (ttsPromise) ttsPromise.then(ms => { if (ms) this._holdToastForVoice(el, npcId); }, () => {});
    // A speech line has no click or hover (the voice hold above still keeps it up)
    if (speech) return ttsPromise;   // not clickable: it never takes a tap meant for Block or the room

    // A text that steps aside on a short screen (ui/hud-lanes.js) waits: its countdown pauses
    // while it is hidden and goes on when it shows again (review R1 m1)
    el._onLaneYield = (hidden) => {
      el._laneYielded = !!hidden;
      if (hidden) this._pauseAutoClose(el);
      else this._resumeAutoClose(el);
    };

    el.addEventListener('mouseenter', () => this._pauseAutoClose(el));
    el.addEventListener('mouseleave', () => this._resumeAutoClose(el));

    // Handle clicks - either custom handler or auto-open phone
    if (typeof payload.onClick === 'function') {
      el.addEventListener('click', () => payload.onClick(el));
    } else if (payload.openPhone !== false && npcId) {
      // Default: clicking bark opens phone chat with this NPC
      el.addEventListener('click', () => {
        // A forced call (disableClose) is not replaced by another contact's thread;
        // the text is in that thread for later (finale F14)
        if (inventoryBlockedByForcedMinigame()) return;
        this.openPhoneChat(payload);
        this._removeBark(el);
      });
    }

    return ttsPromise;
  }

  /**
   * Would a bark from this NPC, made now, show in a speech bubble? The NPC manager asks this
   * when an event mapping's bark fires, so the event's sender can tell an in-view NPC answered
   * it (a gate refusal drops its own notification then: doors.js refuseAtGate, R1 M2).
   */
  answersInView(npcId) {
    // A bark held now (a call opening, a panel) shows later, maybe in a toast: not an answer
    // in view (R2 n4)
    if (this._shouldDefer({ npcId }) || this.isDrainingDeferred || this.deferredBarkQueue.length > 0) return false;
    return this._routeFor({ npcId }, null) === 'bubble';
  }

  /** The bubble-or-toast decision for this bark, from the bubble layer's view of the NPC. */
  _routeFor(payload, contact) {
    const npcId = payload?.npcId;
    const bubbles = window.npcWorldBubbles;
    if (!npcId || !bubbles?.viewFacts) return 'toast';
    const manager = this.npcManager || window.npcManager;
    const npc = manager?.getNPC?.(npcId) || contact || {};
    let facts;
    try { facts = bubbles.viewFacts(npcId); } catch (e) { return 'toast'; }
    return routeBark({ npcType: npc.npcType, ...facts });
  }

  /**
   * The rest of a bubble line (the NPC left view, the room went dark, a minigame opened, or a
   * nearer bark took the bubble's place), as a toast with the speaker's name. Silent: the
   * audio carries on. Goes through showBark, so it is held while a panel is open.
   */
  _toastRemainder(payload, rest, voice = null) {
    if (!rest) return;
    // The rest already holds any follow-up pages still to come. continuationVoice: the bubble's
    // voice, which the toast stays up for (it may still be loading)
    this.showBark({ ...payload, message: rest, text: undefined, followUp: null, playSound: false, useTTS: false, forceToast: true,
      continuation: true, continuationVoice: voice });
  }

  /**
   * A bubble lost its place (onRemainder). A panel opening over it while its voice is still to
   * come or playing: the voice stops and the whole line is held, first in line, so it plays
   * with its voice when the panel closes (the hold policy). Otherwise the rest goes to a toast
   * at once, which stays until the voice ends.
   */
  _bubbleLeft(payload, rest, info, voice) {
    if (voice && voice.live() && this._shouldDefer(payload)) {
      voice.cancel();
      console.debug('[barks] panel opened over a speaking bubble; line held with its voice:', payload.text || payload.message);
      this.deferredBarkQueue.unshift(payload);
      // A minigame drains the queue when it closes; a dialog does not, so its watch releases it
      this._watchDialogHold();
      return;
    }
    this._toastRemainder(payload, rest, voice);
  }

  /**
   * Keep a toast up while this NPC's voice plays: no auto-close until the audio ends (or pauses,
   * fails, or HELD_BARK_VOICE_CAP_MS passes), then what is left of its reading time, at least
   * BARK_RESUME_MIN_MS. Returns true if it is holding.
   */
  _holdToastForVoice(el, npcId) {
    const mgr = npcId && this.ttsManagers.get(npcId);
    if (!el || el._removing || !this._voicePlaying(mgr)) return false;
    const audio = mgr.audio;
    const events = ['ended', 'pause', 'error', 'emptied'];
    let cap = null;
    const release = () => {
      clearTimeout(cap);
      for (const ev of events) audio.removeEventListener?.(ev, release);
      if (!el._voiceHold) return;
      el._voiceHold = false;
      if (el._removing || el._autoClosePaused) return;
      const left = (el._lifetime || 0) - (Date.now() - (el._shownAt || Date.now()));
      this._startAutoClose(el, Math.max(BARK_RESUME_MIN_MS, left));
    };
    el._voiceHold = true;
    clearTimeout(el._autoCloseTimer);
    for (const ev of events) audio.addEventListener?.(ev, release);
    cap = setTimeout(release, HELD_BARK_VOICE_CAP_MS);
    return true;
  }

  /**
   * A follow-up (a gate's lockedHint) whose bubble ended before it was read, as a toast of its
   * own. Silent, and with no stillValid: the check that closed her bubble would close it too
   * (R3 m1).
   */
  _toastFollowUp(payload, hint) {
    if (!hint) return;
    this.showBark({ ...payload, message: hint, text: undefined, followUp: null, playSound: false, useTTS: false,
      forceToast: true, stillValid: undefined, continuation: true });
  }

  _startAutoClose(el, ms) {
    clearTimeout(el._autoCloseTimer);
    el._autoCloseRemaining = ms;
    el._autoCloseStarted = Date.now();
    // Held for a voice (_holdToastForVoice): the timer starts when the voice ends
    if (el._voiceHold) return;
    el._autoCloseTimer = setTimeout(() => this._removeBark(el), ms);
  }

  _pauseAutoClose(el) {
    if (el._removing || el._autoClosePaused) return;
    clearTimeout(el._autoCloseTimer);
    el._autoCloseRemaining = Math.max(0, el._autoCloseRemaining - (Date.now() - el._autoCloseStarted));
    el._autoClosePaused = true;
  }

  _resumeAutoClose(el) {
    if (el._removing || !el._autoClosePaused || el._laneYielded) return;
    el._autoClosePaused = false;
    this._startAutoClose(el, Math.max(BARK_RESUME_MIN_MS, el._autoCloseRemaining));
  }

  /**
   * Close toasts already on screen whose conditions no longer hold (the same stillValid()
   * the hold queue checks). Run when a conversation or minigame closes, so a toast that sat
   * behind it doesn't come back out stale.
   */
  _dropStaleVisibleBarks() {
    if (!this.container) return;
    for (const el of this._barkEls()) {
      if (el._removing || typeof el._stillValid !== 'function') continue;
      let valid = true;
      try { valid = el._stillValid(); } catch (e) { valid = true; }
      if (!valid) {
        console.debug('[barks] closed stale toast:', el.textContent);
        this._removeBark(el);
      }
    }
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
    // Only phone texts can be cleared: speech lines are not clickable and close on their own
    // and only when there are two or more: one text has its own X
    const hasBarks = this.container.querySelectorAll('.npc-bark').length > 1;
    this.clearAllButton.style.display = hasBarks ? 'block' : 'none';
  }

  /** Every bark toast on screen: phone texts and speech lines, speech first (DOM order). */
  _barkEls() {
    const out = [];
    for (const c of [this.speechContainer, this.container]) {
      if (c) out.push(...c.querySelectorAll('.npc-bark'));
    }
    return out;
  }

  _clearAllBarks() {
    Array.from(this.container.querySelectorAll('.npc-bark')).forEach(el => this._removeBark(el));
  }

  /**
   * Keep a stack to MAX_VISIBLE_BARKS toasts and inside its lane: the oldest close early, the
   * newest always stays (bark-lifetime.js barksToTrim). The lanes (ui/hud-lanes.js) give each
   * container a max-height; without one (no lanes yet) the phone stack keeps clear of the
   * objectives panel as before.
   */
  _trimBarkStackToFit(host = this.container) {
    requestAnimationFrame(() => {
      if (!host) return;
      const containerRect = host.getBoundingClientRect();
      const gcs = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle(host) : null;
      const zoom = (gcs && parseFloat(gcs.zoom)) || 1;
      const laneMax = parseFloat(host.style.maxHeight);
      let available;
      const clearAll = (host === this.container && this.clearAllButton && this.clearAllButton.offsetHeight)
        ? this.clearAllButton.offsetHeight + 8 : 0;
      if (Number.isFinite(laneMax) && laneMax > 0) {
        available = laneMax - clearAll;          // CSS px of the container, as offsetHeight is
      } else {
        // The stack grows upward from its bottom edge (80px above the inventory bar)
        let top = 20;
        const panel = document.querySelector('.objectives-panel');
        // (the panel is position: fixed, so offsetParent can't tell whether it shows)
        if (panel && !document.body.classList.contains('minigame-active')) {
          const r = panel.getBoundingClientRect();
          const overlapsSideways = r.left < containerRect.right && r.right > containerRect.left;
          if (r.height > 0 && overlapsSideways) top = Math.max(top, r.bottom + 8);
        }
        available = (containerRect.bottom - top) / zoom - clearAll;
      }

      // Oldest barks are first in the DOM. Skip any already on their way out.
      const barks = Array.from(host.querySelectorAll('.npc-bark')).filter(el => !el._removing);
      // Phone texts placed by the lanes are not closed for want of room: the lanes step the
      // oldest aside, paused, until there is room (review R1 m1); only the count limit applies
      if (host === this.container && host.dataset.lane === 'notify') available = Infinity;
      const drop = barksToTrim(barks.map(el => ({ height: el.offsetHeight })), available);
      barks.slice(0, drop).forEach(el => this._removeBark(el));
    });
  }

  /**
   * Is this bark speech from someone in the building (the message lane) rather than a phone
   * text? Only registered phone contacts, timed messages (channel 'phone') and a caller's own
   * click handler make a phone text; anyone else is speech, registered or not (review R1 M4:
   * the client scenario has no NPC lists until a room loads).
   */
  _isSpeech(payload = {}) {
    const manager = this.npcManager || (typeof window !== 'undefined' ? window.npcManager : null);
    const npc = (payload.npcId && manager?.getNPC?.(payload.npcId)) || null;
    return barkSource({ npcType: npc?.npcType || null, channel: payload.channel || null,
      hasClickHandler: typeof payload.onClick === 'function' }) === 'speech';
  }

  /**
   * Dialogs are not minigames, so nothing calls drainDeferredBarks when one closes: while barks
   * are held behind one, look every DIALOG_HOLD_POLL_MS and release them once it has gone. The
   * release itself is the usual one (order, gaps and voice waits unchanged).
   */
  _watchDialogHold() {
    if (this._dialogHoldTimer || typeof setInterval !== 'function' || !dialogLayerOpen()) return;
    this._dialogHoldTimer = setInterval(() => {
      if (dialogLayerOpen()) return;
      clearInterval(this._dialogHoldTimer);
      this._dialogHoldTimer = null;
      if (this.deferredBarkQueue.length > 0 && !this._shouldDefer()) this.drainDeferredBarks();
    }, NPCBarkSystem.DIALOG_HOLD_POLL_MS);
  }

  /** The open phone's back button counts unread texts in its other threads (review R2 M2). */
  _refreshPhoneUnread() {
    try {
      const m = window.MinigameFramework?.currentMinigame;
      if (m && !m._ending && m._sceneType === 'phone-chat') m.ui?.refreshBackUnread?.();
    } catch (e) { /* the phone closed meanwhile */ }
  }

  /** Compass point from the player to a speaker's sprite (hud-lanes.js arrowDirection), or null. */
  _speakerDirection(npcId) {
    try {
      const sprite = window.npcWorldBubbles?._spriteAndRoom?.(npcId)?.sprite;
      const player = window.player;
      if (!sprite || !player) return null;
      return arrowDirection({ x: player.x, y: player.y }, { x: sprite.x, y: sprite.y });
    } catch (e) { return null; }
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
    
    // Get NPC data from manager if available. main.js builds the bark system before the
    // manager, so this.npcManager is unset in game; without the global fallback the NPC's
    // phoneTheme and phoneId were lost and a terminal device opened as the player's phone.
    let npcData = null;
    const manager = this.npcManager || (typeof window !== 'undefined' ? window.npcManager : null);
    if (manager) {
      npcData = manager.getNPC(npcId);
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
      phoneId: npcData?.phoneId,
      theme: npcData?.phoneTheme
    };
    
    console.log('📱 Final params for phone chat:', params);

    // Try MinigameFramework first (if in game with Phaser)
    if (window.MinigameFramework && typeof window.MinigameFramework.startMinigame === 'function') {
      const go = () => window.MinigameFramework.startMinigame('phone-chat', null, params);
      // The phone pose shows a moment before the phone opens (systems/player-poses.js)
      if (window.playerPoses?.openWithPhoneLead) window.playerPoses.openWithPhoneLead(go); else go();
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
    // The NPC name is author text: set as textContent below, never markup
    header.innerHTML = `
      <span style="color: white; font-weight: bold;"></span>
      <button id="phone-close" style="background: #d32f2f; color: white; border: none; padding: 4px 12px; cursor: pointer;">Close</button>
    `;

    header.querySelector('span').textContent = params.npcName || 'Chat';

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
          msgDiv.textContent = displayDashes(msg.text);
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
          playerMsg.textContent = displayDashes(playerChoiceText);
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
          msg.textContent = displayDashes(result.text.trim());
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
            btn.textContent = displayDashes(choice.text);
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
      // The error can quote ink text: plain text only
      const errEl = document.createElement('div');
      errEl.style.cssText = 'color: #f44; padding: 16px;';
      errEl.textContent = `Error loading story: ${err?.message ?? err}`;
      messagesContainer.replaceChildren(errEl);
    }
  }
}

// How often a bark held behind a dialog checks whether the dialog has closed (_watchDialogHold)
NPCBarkSystem.DIALOG_HOLD_POLL_MS = 250;

// The phone layout (ui/hud-lanes.js sets body.hud-compact; css/npc-barks.css uses the same class)
function compactHud() {
  try { return !!document?.body?.classList?.contains('hud-compact'); } catch (e) { return false; }
}
