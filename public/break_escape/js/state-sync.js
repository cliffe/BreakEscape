import { ApiClient } from './api-client.js';
import { getApiBase, getCsrfToken } from './config.js';

// keepalive requests are capped at 64KB of body by browsers
const KEEPALIVE_BODY_LIMIT = 60000;

// When only elapsed time has moved, the clock is still sent this often, so a
// crash loses at most this much of it. Any other change carries the clock too.
const CLOCK_ONLY_INTERVAL_MS = 5 * 60 * 1000;

// Keyed sections: only changed keys are sent, and a key that has gone is sent
// as null (the server deletes it for globalVariables and ignores it elsewhere).
const KEYED_SECTIONS = ['globalVariables', 'npcVisibility', 'npcHostility', 'triggeredEvents', 'npcInkVariables', 'mailState'];

// Keys of a keyed section compared by something other than their whole value.
// mailState.jobs: remainingMs counts down every tick, so only which jobs exist
// (ids, account, message) is a change, as timedMessages diffs its pending ids;
// the current times ride along with anything else that is sent (00 S9).
const mailJobsChangeKey = jobs => json((jobs || []).map(j =>
  [j.jobId, j.kind, j.accountId ?? null, j.msgId ?? null, j.messageId ?? null]));
const CHANGE_KEYS = { mailState: { jobs: mailJobsChangeKey } };

// Lists replaced whole when they change
const WHOLE_SECTIONS = ['commandBoardLog', 'biometricSamples', 'playerHealth'];

// Landing-page builder state (07 §5; 00 §11a). Two object globals keyed by pageId:
// se_landing_pages holds one closed record per built page, se_landing_drafts one
// pre-Score choice set per page. The builder overlay already writes only closed keys
// (buildRecord/applyScore/setBuilt and _pick7 in landing-page-model.js), but the shape is
// enforced again here, at the sync boundary, so a hand-edited or older save can never push
// an unknown key to the server (defence in depth, N4). The closed key sets mirror
// landing-page-model.js's RECORD_KEYS, CHOICE_KEYS, victim keys and TELL_IDS; the
// social-landing-page-state test asserts they stay in step with that module. A mission with
// no landing state carries neither global, so guardLandingState leaves its payload untouched.
const LANDING_PAGES_KEY = 'se_landing_pages';
const LANDING_DRAFTS_KEY = 'se_landing_drafts';
const LANDING_RECORD_KEYS = ['pageId', 'targetId', 'choices', 'credibility', 'gatesPassed', 'meetsThreshold', 'tellsFound', 'victim', 'built'];
const LANDING_CHOICE_KEYS = ['brand', 'purpose', 'domainId', 'logo', 'wording', 'fields', 'padlock'];
const LANDING_VICTIM_KEYS = ['visited', 'submitted', 'noticed'];
const LANDING_TELL_IDS = ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock', 'formOrigin', 'hoverMismatch'];

const json = v => JSON.stringify(v);

const isPlainObject = v => v != null && typeof v === 'object' && !Array.isArray(v);
const pickKeys = (obj, keys) => {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

// The seven draft choice keys only (null everything else away).
const sanitizeLandingChoices = choices => (isPlainObject(choices) ? pickKeys(choices, LANDING_CHOICE_KEYS) : {});

// One closed landing-page record: the nine record keys, with choices and tellsFound and
// victim cleaned inside. A tellsFound id outside the nine, or a choice/victim key outside
// its set, is dropped. Non-object records become {} so nothing unexpected is sent.
const sanitizeLandingRecord = record => {
  if (!isPlainObject(record)) return {};
  const out = pickKeys(record, LANDING_RECORD_KEYS);
  if ('choices' in out) out.choices = sanitizeLandingChoices(out.choices);
  if ('tellsFound' in out) {
    out.tellsFound = Array.isArray(out.tellsFound) ? out.tellsFound.filter(id => LANDING_TELL_IDS.includes(id)) : [];
  }
  if ('victim' in out && isPlainObject(out.victim)) out.victim = pickKeys(out.victim, LANDING_VICTIM_KEYS);
  return out;
};

const sanitizeLandingMap = (map, perValue) => {
  if (!isPlainObject(map)) return {};
  const out = {};
  for (const [pageId, value] of Object.entries(map)) out[pageId] = perValue(value);
  return out;
};

/**
 * Enforce the closed landing-page record and draft shapes on the globals about to be sent
 * (N4; 07 §5; 00 §11a). Mutates the given shallow copy in place, never window.gameState: a
 * replaced key gets a fresh object, so the live global is left as the overlay wrote it. Only
 * keys that are present are touched, so a mission with no landing state is unchanged.
 */
function guardLandingState(globals) {
  if (Object.prototype.hasOwnProperty.call(globals, LANDING_PAGES_KEY)) {
    globals[LANDING_PAGES_KEY] = sanitizeLandingMap(globals[LANDING_PAGES_KEY], sanitizeLandingRecord);
  }
  if (Object.prototype.hasOwnProperty.call(globals, LANDING_DRAFTS_KEY)) {
    globals[LANDING_DRAFTS_KEY] = sanitizeLandingMap(globals[LANDING_DRAFTS_KEY], sanitizeLandingChoices);
  }
}

/**
 * Periodic state synchronisation with the server.
 *
 * Each sync sends only what has changed since the last save the server
 * confirmed (this.confirmed). The first sync after a page load has nothing
 * confirmed, so it sends a full snapshot; an idle player sends nothing.
 *
 * The payload is grouped for a future multiplayer game:
 *   shared by the team:  globalVariables, npcVisibility, npcHostility, scenarioClock,
 *                        commandBoardLog, triggeredEvents
 *   per player:          currentRoom, notes, phoneState, npcInkVariables,
 *                        biometricSamples, timedMessages, scenarioBriefShown,
 *                        playerHealth, mailState
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
    this.lastError = null; // error from the latest failed run (status set for HTTP errors)
    this._boolFor = new WeakMap(); // run promise -> the boolean promise sync() hands out
    this._notSavedLogged = new Set(); // sections already warned about on this page
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
    // Keep the landing-page globals to their closed shapes before they are synced or flushed (N4)
    guardLandingState(out.globalVariables);

    // NPCs shown or hidden by setVisible, so a reveal survives a reload (N2)
    const npcVisibility = window.npcManager?.exportNpcVisibility?.();
    if (npcVisibility && Object.keys(npcVisibility).length > 0) out.npcVisibility = npcVisibility;

    // NPCs turned hostile or knocked out, so they stay that way after a reload (E-B)
    const npcHostility = window.npcHostileSystem?.exportHostility?.();
    if (npcHostility && Object.keys(npcHostility).length > 0) out.npcHostility = npcHostility;

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

    // show_scenario_brief "once": the brief popup has been shown in this game
    if (window.gameState?.scenarioBriefShown) out.scenarioBriefShown = true;

    // The player's HP, so a reload mid-fight isn't a free full heal (m05 E6)
    const playerHealth = window.playerHealth?.exportState?.();
    if (playerHealth) out.playerHealth = playerHealth;

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

    // Mail (social missions only): keyed by mailboxes.<box>.<msgId>, jobs,
    // threads.<character>:<accountId>, drafts, metrics (00 §10a). Null for a
    // mission with no mail, so no mailState key is ever sent.
    const mailState = window.mailScheduler?.exportMailState?.();
    if (mailState) out.mailState = mailState;
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
      const changeKeys = CHANGE_KEYS[section] || {};
      for (const [key, value] of Object.entries(current)) {
        if (value === undefined) continue;
        const s = changeKeys[key] ? changeKeys[key](value) : json(value);
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

    if (full.scenarioBriefShown && !this.confirmed.scenarioBriefShown) {
      body.scenarioBriefShown = true;
      ack.scenarioBriefShown = true;
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
    // Mail jobs' current times ride along with anything else that is sent
    const mailJobs = full.mailState?.jobs;
    if (mailJobs && mailJobs.length > 0 && !body.mailState?.jobs && Object.keys(body).length > 0) {
      body.mailState = { ...(body.mailState || {}), jobs: mailJobs };
      ack.mailState = { ...(ack.mailState || {}), jobs: mailJobsChangeKey(mailJobs) };
    }
    if (Object.keys(body).length === 0) return null;
    return { body, ack };
  }

  /**
   * Record what the server now holds, after a 2xx answer that wasn't stale.
   * Sections in notSaved (the server refused them over a cap and kept its
   * previous copy) are not confirmed, so they are sent again (00 §13).
   */
  confirm({ body, ack }, now = Date.now(), notSaved = []) {
    const refused = new Set(Array.isArray(notSaved) ? notSaved : []);
    for (const section of [...KEYED_SECTIONS, 'notes']) {
      if (!ack[section] || refused.has(section)) continue;
      const kept = { ...(this.confirmed[section] || {}) };
      for (const [key, s] of Object.entries(ack[section])) {
        if (s === null) delete kept[key]; else kept[key] = s;
      }
      this.confirmed[section] = kept;
    }
    for (const key of [...WHOLE_SECTIONS, 'currentRoom', 'scenarioBriefShown', 'timedMessagesKey', 'clockKey', 'clockElapsedMs']) {
      if (ack[key] !== undefined) this.confirmed[key] = ack[key];
    }
    if (body.scenarioClock) this.clockConfirmedAt = now;
    if (body.phoneState && !refused.has('phoneState')) window.npcManager?.markPhoneStateSynced?.(body.phoneState);
  }

  /**
   * Reconcile the mail the server trimmed on a successful save (P1-D). The
   * client held these messages as confirmed; the server has dropped them to fit
   * the byte cap, so we drop them from the scheduler's live state (keeping the
   * client's view in step) and from this.confirmed.mailState (so they are
   * neither re-sent nor marked present), matching what the server now holds.
   * @param {string[]} keys  mailboxes.<box>.<msgId> keys
   */
  _reconcileTrimmedMail(keys) {
    const confirmedMail = this.confirmed.mailState;
    if (confirmedMail) for (const key of keys) delete confirmedMail[key];
    try { window.mailScheduler?.dropMessages?.(keys); } catch (err) { console.error('mail dropMessages failed:', err); }
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
    const run = this._syncRun();
    let ok = this._boolFor.get(run);
    if (!ok) {
      ok = run.then(r => r.ok);
      this._boolFor.set(run, ok);
    }
    return ok;
  }

  /** The shared run behind sync(), resolving to that run's { ok, error }. */
  _syncRun() {
    if (this._running) {
      if (!this._next) {
        this._next = this._running.then(() => {
          this._next = null;
          return this._syncRun();
        });
      }
      return this._next;
    }
    this._running = this._syncOnce().finally(() => { this._running = null; });
    return this._running;
  }

  /**
   * One sync run. Resolves { ok: true } when the server holds everything (or
   * there was nothing to send), { ok: false, error } on a stale answer (error
   * null) or a failure. The error travels with the run, so syncConfirmed reads
   * its own run's error and not a later run's (P0-R R-14); this.lastError keeps
   * the latest one for anything else that wants it.
   */
  async _syncOnce() {
    try {
      const changes = this.buildChanges();
      if (!changes) return { ok: true, error: null };
      const body = { ...changes.body, clientTs: this.nextClientTs() };
      const response = await ApiClient.put('/sync_state', body);
      if (response?.stale) {
        console.warn('State sync answered stale; resending with the next sync');
        this.lastError = null;
        return { ok: false, error: null };
      }
      const notSaved = Array.isArray(response?.notSaved) ? response.notSaved : [];
      for (const section of notSaved) {
        if (this._notSavedLogged.has(section)) continue;
        this._notSavedLogged.add(section);
        console.warn(`State sync: the server did not save ${section} (over a cap); resending it with each sync`);
      }
      this.confirm(changes, Date.now(), notSaved);
      // The server may have trimmed read mail to fit the 1 MB cap while still
      // saving (00 §10a, P1-D). It reports the dropped keys so we drop them here
      // too, rather than hold them as confirmed and lose them on reload.
      const mailTrimmed = Array.isArray(response?.mailTrimmed) ? response.mailTrimmed : [];
      if (mailTrimmed.length) this._reconcileTrimmedMail(mailTrimmed);
      this.lastError = null;
      console.log('✓ State synced to server');
      // A run that left a capped section refused is not fully confirmed (N-4): the
      // saved sections are confirmed above, but syncConfirmed must not report success
      // while a section stays unsaved and is resent on every sync.
      return { ok: notSaved.length === 0, error: null };
    } catch (error) {
      // Nothing is marked confirmed, so the next sync sends it again
      this.lastError = error;
      console.error('State sync failed:', error);
      return { ok: false, error };
    }
  }

  /**
   * Sync until the server confirms, for callers that must know the save landed.
   * Retries with back-off (250 ms doubling, capped at 4 s) up to `attempts`
   * runs; onRetry(i) is called before each wait. A 403 is a refusal, not a
   * blip, so it stops at once. Resolves true when confirmed, false otherwise.
   */
  async syncConfirmed({ attempts = 6, onRetry } = {}) {
    for (let i = 0; i < attempts; i++) {
      const { ok, error } = await this._syncRun();
      if (ok) return true;
      if (error?.status === 403) return false;
      if (i === attempts - 1) break;
      onRetry?.(i);
      await new Promise(r => setTimeout(r, Math.min(250 * 2 ** i, 4000)));
    }
    return false;
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
        // Keep the reload-critical parts: globals, the mail changed since the last
        // sync (a delivered reply and its job travel together), fired one-shot
        // handlers, the timed texts they scheduled, and the phone threads changed
        // since the last sync. mailState is dropped whole, never cut, in the
        // second list (00 §10a "The pagehide flush has a size budget").
        const { globalVariables, mailState, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth, clientTs } = payload;
        body = JSON.stringify({ globalVariables, mailState, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth, clientTs });
        if (body.length > KEEPALIVE_BODY_LIMIT) {
          body = JSON.stringify({ globalVariables, triggeredEvents, timedMessages, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth, clientTs });
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
