import { ApiClient } from './api-client.js';
import { getApiBase, getCsrfToken } from './config.js';

// keepalive requests are capped at 64KB of body by browsers
const KEEPALIVE_BODY_LIMIT = 60000;

/**
 * Periodic state synchronization with server
 */
export class StateSync {
  constructor(interval = 30000) { // 30 seconds
    this.interval = interval;
    this.timer = null;
    this.onPageHide = () => this.flush();
  }

  start() {
    this.timer = setInterval(() => this.sync(), this.interval);
    // A reload inside the 30s window used to drop every global set since the
    // last sync, so re-entry guards (briefing_played, clone_call_done, ...)
    // replayed their scenes. Send one last sync as the page goes away.
    window.addEventListener('pagehide', this.onPageHide);
    console.log('State sync started (every 30s, and on page hide)');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener('pagehide', this.onPageHide);
  }

  buildPayload({ onlyChanged = false } = {}) {
    // Get current game state
    const currentRoom = window.currentRoom?.name;
    const globalVariables = window.gameState?.globalVariables || {};
    // Include notes so observations survive page reloads.
    // Strip any Phaser sprite references — only persist plain data.
    const notes = (window.gameState?.notes || []).map(n => ({
      id: n.id,
      title: n.title,
      text: n.text,
      timestamp: n.timestamp,
      read: n.read,
      important: n.important
    }));
    // NPC-local ink variables (met_x, first_meeting, ...) so intros don't
    // replay after a reload. Absent until the conversation-state manager
    // provides exportNpcInkVariables.
    const npcInkVariables = window.npcConversationStateManager?.exportNpcInkVariables?.();

    // onceOnly / maxTriggers eventMapping handlers that have fired
    const triggeredEvents = window.npcManager?.exportTriggeredEvents?.();

    // Timed texts already counting down (and NPC-level ones already delivered), so
    // a reload between an event and its delayed text keeps the text
    const timedMessages = window.npcManager?.exportTimedMessages?.();

    // Phone threads: texts, read state and story position per contact. The unload
    // flush sends only contacts changed since the last confirmed sync.
    const phoneState = window.npcManager?.exportPhoneState?.({ onlyChanged });

    // Elapsed game time and the scenario timers' state, so a reload resumes the clock and
    // timers instead of restarting them (D14)
    const scenarioClock = window.gameClock?.exportState?.();
    if (scenarioClock) {
      const timers = window.scenarioTimerDispatcher?.exportState?.();
      if (timers) scenarioClock.timers = timers;
    }

    // NPCs shown or hidden by setVisible, so a reveal survives a reload (N2)
    const npcVisibility = window.npcManager?.exportNpcVisibility?.();

    // Command board entries ({ id, t }), only in scenarios with a board
    const commandBoardLog = window.commandBoardRecorder?.exportLog?.();

    const payload = { currentRoom, globalVariables, notes };
    // show_scenario_brief "once": the brief popup has been shown in this game
    if (window.gameState?.scenarioBriefShown) {
      payload.scenarioBriefShown = true;
    }
    if (scenarioClock) {
      payload.scenarioClock = scenarioClock;
    }
    if (npcVisibility && Object.keys(npcVisibility).length > 0) {
      payload.npcVisibility = npcVisibility;
    }
    if (commandBoardLog && commandBoardLog.length > 0) {
      payload.commandBoardLog = commandBoardLog;
    }
    // Lifted fingerprints, plain fields only, so they survive a reload.
    const biometricSamples = (window.gameState?.biometricSamples || []).map(s => ({
      id: s.id, type: s.type, owner: s.owner, ownerId: s.ownerId, ownerName: s.ownerName,
      quality: s.quality, rating: s.rating, pattern: s.pattern, identified: s.identified,
      sourceObjectId: s.sourceObjectId, sourceRoomId: s.sourceRoomId, sourceName: s.sourceName,
      surface: s.surface, collectedAt: s.collectedAt
    }));
    if (biometricSamples.length > 0) {
      payload.biometricSamples = biometricSamples;
    }
    if (npcInkVariables && Object.keys(npcInkVariables).length > 0) {
      payload.npcInkVariables = npcInkVariables;
    }
    if (triggeredEvents && Object.keys(triggeredEvents).length > 0) {
      payload.triggeredEvents = triggeredEvents;
    }
    if (timedMessages) {
      payload.timedMessages = timedMessages;
    }
    if (phoneState && Object.keys(phoneState).length > 0) {
      payload.phoneState = phoneState;
    }
    return payload;
  }

  async sync() {
    try {
      // Sync to server
      const payload = this.buildPayload();
      await ApiClient.put('/sync_state', payload);
      window.npcManager?.markPhoneStateSynced?.(payload.phoneState);
      console.log('✓ State synced to server');
    } catch (error) {
      console.error('State sync failed:', error);
    }
  }

  /**
   * Best-effort sync while the page unloads. keepalive lets the request
   * outlive the page; it can't be awaited, and its body is size-capped, so
   * an oversized payload falls back to globals and fired handlers alone.
   */
  flush() {
    try {
      const payload = this.buildPayload({ onlyChanged: true });
      let body = JSON.stringify(payload);
      if (body.length > KEEPALIVE_BODY_LIMIT) {
        // Keep the reload-critical parts: globals, fired one-shot handlers, the timed
        // texts they scheduled, and the phone threads changed since the last sync
        const { globalVariables, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, commandBoardLog } = payload;
        body = JSON.stringify({ globalVariables, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, commandBoardLog });
        if (body.length > KEEPALIVE_BODY_LIMIT) {
          body = JSON.stringify({ globalVariables, triggeredEvents, timedMessages, scenarioClock, npcVisibility, commandBoardLog });
          if (body.length > KEEPALIVE_BODY_LIMIT) return;
        }
      }
      fetch(`${getApiBase()}/sync_state`, {
        method: 'PUT',
        keepalive: true,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body
      }).catch(() => {});
    } catch (error) {
      console.error('State flush failed:', error);
    }
  }
}
