import { ApiClient } from './api-client.js';
import { getApiBase, getCsrfToken } from './config.js';

// keepalive requests are capped at 64KB of body by browsers
const KEEPALIVE_BODY_LIMIT = 60000;

// When only elapsed time has moved, the clock is still sent this often, so a
// crash loses at most this much of it. Any other change carries the clock too.
const CLOCK_ONLY_INTERVAL_MS = 5 * 60 * 1000;

// Keyed sections: only changed keys are sent, and a key that has gone is sent
// as null (the server deletes it for globalVariables and ignores it elsewhere).
const KEYED_SECTIONS = ['globalVariables', 'npcVisibility', 'triggeredEvents', 'npcInkVariables'];

// Lists replaced whole when they change
const WHOLE_SECTIONS = ['commandBoardLog', 'biometricSamples'];

const json = v => JSON.stringify(v);

/**
 * Periodic state synchronisation with the server.
 *
 * Each sync sends only what has changed since the last save the server
 * confirmed (this.confirmed). The first sync after a page load has nothing
 * confirmed, so it sends a full snapshot; an idle player sends nothing.
 *
 * The payload is grouped for a future multiplayer game:
 *   shared by the team:  globalVariables, npcVisibility, scenarioClock,
 *                        commandBoardLog, triggeredEvents
 *   per player:          currentRoom, notes, phoneState, npcInkVariables,
 *                        biometricSamples, timedMessages
 * buildPayload() builds the two groups separately, in that order.
 *
 * Every request carries clientTs, which only increases within a page. The
 * server keeps the newest one it accepted and treats an older request as
 * stale (a flush from the old page landing after the new page has synced):
 * it then skips the last-write-wins sections and answers { stale: true }, and
 * nothing is marked confirmed here, so those sections are sent again.
 */
export class StateSync {
  constructor(interval = 30000) { // 30 seconds
    this.interval = interval;
    this.timer = null;
    this.onPageHide = () => this.flush();
    // Last values the server acknowledged. Keyed sections hold { key: JSON },
    // whole sections and the clock/timed-text keys hold one JSON string.
    // Phone threads are tracked by npcManager (markPhoneStateSynced).
    this.confirmed = {};
    this.clockConfirmedAt = 0; // Date.now() when a clock was last acknowledged
    this.lastClientTs = 0;
    this._running = null; // the sync in flight
    this._next = null; // the one sync queued behind it
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

  /** Sections a multiplayer game would share across the team. */
  buildSharedSections() {
    const out = {};
    // Shallow copy, so a later change to a global doesn't alter what was built
    out.globalVariables = { ...(window.gameState?.globalVariables || {}) };

    // NPCs shown or hidden by setVisible, so a reveal survives a reload (N2)
    const npcVisibility = window.npcManager?.exportNpcVisibility?.();
    if (npcVisibility && Object.keys(npcVisibility).length > 0) out.npcVisibility = npcVisibility;

    // Elapsed game time and the scenario timers' state, so a reload resumes the clock and
    // timers instead of restarting them (D14)
    const scenarioClock = window.gameClock?.exportState?.();
    if (scenarioClock) {
      const timers = window.scenarioTimerDispatcher?.exportState?.();
      if (timers) scenarioClock.timers = timers;
      out.scenarioClock = scenarioClock;
    }

    // Command board entries ({ id, t }), only in scenarios with a board
    const commandBoardLog = window.commandBoardRecorder?.exportLog?.();
    if (commandBoardLog && commandBoardLog.length > 0) out.commandBoardLog = commandBoardLog;

    // onceOnly / maxTriggers eventMapping handlers that have fired
    const triggeredEvents = window.npcManager?.exportTriggeredEvents?.();
    if (triggeredEvents && Object.keys(triggeredEvents).length > 0) out.triggeredEvents = triggeredEvents;
    return out;
  }

  /** Sections that belong to one player. */
  buildPlayerSections({ onlyChanged = false } = {}) {
    const out = {};
    out.currentRoom = window.currentRoom?.name;

    // Notes, so observations survive page reloads. Plain data only (no sprites).
    out.notes = (window.gameState?.notes || []).map(n => ({
      id: n.id,
      title: n.title,
      text: n.text,
      timestamp: n.timestamp,
      read: n.read,
      important: n.important
    }));

    // Phone threads: texts, read state and story position per contact. With
    // onlyChanged, only contacts changed since the last confirmed sync.
    const phoneState = window.npcManager?.exportPhoneState?.({ onlyChanged });
    if (phoneState && Object.keys(phoneState).length > 0) out.phoneState = phoneState;

    // NPC-local ink variables (met_x, first_meeting, ...) so intros don't replay
    const npcInkVariables = window.npcConversationStateManager?.exportNpcInkVariables?.();
    if (npcInkVariables && Object.keys(npcInkVariables).length > 0) out.npcInkVariables = npcInkVariables;

    // Lifted fingerprints, plain fields only, so they survive a reload.
    const biometricSamples = (window.gameState?.biometricSamples || []).map(s => ({
      id: s.id, type: s.type, owner: s.owner, ownerId: s.ownerId, ownerName: s.ownerName,
      quality: s.quality, rating: s.rating, pattern: s.pattern, identified: s.identified,
      sourceObjectId: s.sourceObjectId, sourceRoomId: s.sourceRoomId, sourceName: s.sourceName,
      surface: s.surface, collectedAt: s.collectedAt
    }));
    if (biometricSamples.length > 0) out.biometricSamples = biometricSamples;

    // Timed texts already counting down (and NPC-level ones already delivered), so
    // a reload between an event and its delayed text keeps the text
    const timedMessages = window.npcManager?.exportTimedMessages?.();
    if (timedMessages) out.timedMessages = timedMessages;
    return out;
  }

  /** The full current state, shared sections first. */
  buildPayload({ onlyChanged = false } = {}) {
    return { ...this.buildSharedSections(), ...this.buildPlayerSections({ onlyChanged }) };
  }

  /**
   * What has changed since this.confirmed, as a request body, and what to
   * record as confirmed once the server accepts it. Null when nothing has
   * changed.
   * @param {Object} [opts]
   * @param {boolean} [opts.forceClock] - send the clock even if only elapsed time
   *   moved (the unload flush)
   * @param {number} [opts.now]
   * @returns {{ body: Object, ack: Object }|null}
   */
  buildChanges({ forceClock = false, now = Date.now() } = {}) {
    const full = this.buildPayload({ onlyChanged: true });
    const body = {};
    const ack = {};

    for (const section of KEYED_SECTIONS) {
      const current = full[section] || {};
      const confirmed = this.confirmed[section] || {};
      const changes = {};
      const acked = {};
      for (const [key, value] of Object.entries(current)) {
        if (value === undefined) continue;
        const s = json(value);
        if (confirmed[key] !== s) { changes[key] = value; acked[key] = s; }
      }
      for (const key of Object.keys(confirmed)) {
        if (current[key] === undefined) { changes[key] = null; acked[key] = null; }
      }
      if (Object.keys(changes).length > 0) { body[section] = changes; ack[section] = acked; }
    }

    // Notes: new or changed ones, by id (the server merges by id)
    const confirmedNotes = this.confirmed.notes || {};
    const notes = [];
    const ackedNotes = {};
    for (const note of full.notes || []) {
      const s = json(note);
      if (confirmedNotes[note.id] !== s) { notes.push(note); ackedNotes[note.id] = s; }
    }
    if (notes.length > 0) { body.notes = notes; ack.notes = ackedNotes; }

    for (const section of WHOLE_SECTIONS) {
      if (full[section] === undefined) continue;
      const s = json(full[section]);
      if (this.confirmed[section] !== s) { body[section] = full[section]; ack[section] = s; }
    }

    if (full.currentRoom && full.currentRoom !== this.confirmed.currentRoom) {
      body.currentRoom = full.currentRoom;
      ack.currentRoom = full.currentRoom;
    }

    // Phone threads come pre-filtered (exportPhoneState onlyChanged)
    if (full.phoneState) body.phoneState = full.phoneState;

    // Timed texts: remainingMs counts down every tick, so like the clock only a
    // change in which texts are pending or delivered counts as a change; the
    // current times ride along with anything else that is sent.
    let timedKey = null;
    if (full.timedMessages) {
      timedKey = json({
        pending: (full.timedMessages.pending || []).map(m => m.id),
        delivered: full.timedMessages.delivered || []
      });
      if (timedKey !== this.confirmed.timedMessagesKey) ack.timedMessagesKey = timedKey;
    }

    // Clock: elapsed time alone is not a change. Timer state is.
    let clockKey = null;
    if (full.scenarioClock) {
      const t = full.scenarioClock.timers || {};
      clockKey = json({ fired: t.fired || [], cancelled: t.cancelled || [], started: Object.keys(t.started || {}).sort() });
    }
    const clockStateChanged = clockKey !== null && clockKey !== this.confirmed.clockKey;
    const somethingElse = Object.keys(body).length > 0 || ack.timedMessagesKey !== undefined;
    const clockDue = full.scenarioClock &&
      full.scenarioClock.elapsedMs !== this.confirmed.clockElapsedMs &&
      now - this.clockConfirmedAt >= CLOCK_ONLY_INTERVAL_MS;

    if (!somethingElse && !clockStateChanged && !clockDue && !forceClock) return null;

    if (full.scenarioClock) {
      body.scenarioClock = full.scenarioClock;
      ack.clockKey = clockKey;
      ack.clockElapsedMs = full.scenarioClock.elapsedMs;
    }
    if (full.timedMessages) {
      body.timedMessages = full.timedMessages;
      ack.timedMessagesKey = timedKey;
    }
    if (Object.keys(body).length === 0) return null;
    return { body, ack };
  }

  /** Record what the server now holds, after a 2xx answer that wasn't stale. */
  confirm({ body, ack }, now = Date.now()) {
    for (const section of [...KEYED_SECTIONS, 'notes']) {
      if (!ack[section]) continue;
      const kept = { ...(this.confirmed[section] || {}) };
      for (const [key, s] of Object.entries(ack[section])) {
        if (s === null) delete kept[key]; else kept[key] = s;
      }
      this.confirmed[section] = kept;
    }
    for (const key of [...WHOLE_SECTIONS, 'currentRoom', 'timedMessagesKey', 'clockKey', 'clockElapsedMs']) {
      if (ack[key] !== undefined) this.confirmed[key] = ack[key];
    }
    if (body.scenarioClock) this.clockConfirmedAt = now;
    if (body.phoneState) window.npcManager?.markPhoneStateSynced?.(body.phoneState);
  }

  /**
   * Date.now(), raised if needed so it is always greater than the last value
   * sent from this page. If the system clock is set back between a reload's
   * old and new page, the new page's syncs are stale until the clock passes
   * the old value; the server caps that at 10 minutes.
   */
  nextClientTs() {
    this.lastClientTs = Math.max(Date.now(), this.lastClientTs + 1);
    return this.lastClientTs;
  }

  /**
   * Send what changed. Only one sync runs at a time per page: a sync asked for
   * while one is in flight (including forced stateSync.sync() calls) runs
   * straight after it, and every caller that asked meanwhile shares that run.
   */
  sync() {
    if (this._running) {
      if (!this._next) {
        this._next = this._running.then(() => {
          this._next = null;
          return this.sync();
        });
      }
      return this._next;
    }
    this._running = this._syncOnce().finally(() => { this._running = null; });
    return this._running;
  }

  async _syncOnce() {
    try {
      const changes = this.buildChanges();
      if (!changes) return;
      const body = { ...changes.body, clientTs: this.nextClientTs() };
      const response = await ApiClient.put('/sync_state', body);
      if (response?.stale) {
        console.warn('State sync answered stale; resending with the next sync');
        return;
      }
      this.confirm(changes);
      console.log('✓ State synced to server');
    } catch (error) {
      // Nothing is marked confirmed, so the next sync sends it again
      console.error('State sync failed:', error);
    }
  }

  /**
   * Best-effort sync while the page unloads: the changes since the last
   * confirmed sync, with the clock. keepalive lets the request outlive the
   * page; it can't be awaited, and its body is size-capped, so an oversized
   * body falls back to the reload-critical sections.
   */
  flush() {
    try {
      const changes = this.buildChanges({ forceClock: true });
      if (!changes) return;
      const payload = { ...changes.body, clientTs: this.nextClientTs() };
      let body = JSON.stringify(payload);
      if (body.length > KEEPALIVE_BODY_LIMIT) {
        // Keep the reload-critical parts: globals, fired one-shot handlers, the timed
        // texts they scheduled, and the phone threads changed since the last sync
        const { globalVariables, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, commandBoardLog, clientTs } = payload;
        body = JSON.stringify({ globalVariables, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, commandBoardLog, clientTs });
        if (body.length > KEEPALIVE_BODY_LIMIT) {
          body = JSON.stringify({ globalVariables, triggeredEvents, timedMessages, scenarioClock, npcVisibility, commandBoardLog, clientTs });
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
