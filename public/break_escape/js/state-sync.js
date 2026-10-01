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

  buildPayload() {
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

    const payload = { currentRoom, globalVariables, notes };
    if (npcInkVariables && Object.keys(npcInkVariables).length > 0) {
      payload.npcInkVariables = npcInkVariables;
    }
    if (triggeredEvents && Object.keys(triggeredEvents).length > 0) {
      payload.triggeredEvents = triggeredEvents;
    }
    return payload;
  }

  async sync() {
    try {
      // Sync to server
      await ApiClient.put('/sync_state', this.buildPayload());
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
      const payload = this.buildPayload();
      let body = JSON.stringify(payload);
      if (body.length > KEEPALIVE_BODY_LIMIT) {
        // Keep the reload-critical parts: globals and fired one-shot handlers
        body = JSON.stringify({ globalVariables: payload.globalVariables, triggeredEvents: payload.triggeredEvents });
        if (body.length > KEEPALIVE_BODY_LIMIT) return;
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
