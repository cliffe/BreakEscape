import { ApiClient } from './api-client.js';
import { getApiBase, getCsrfToken } from './config.js';

// keepalive requests are capped at 64KB of body by browsers, counted over every
// keepalive in flight at once (a hidden flush still uploading, then a pagehide one)
const KEEPALIVE_BODY_LIMIT = 60000;
// UTF-8 bytes of a request body (the quota counts bytes, not string length)
const bodyBytes = s => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : s.length);

// When only elapsed time has moved, the clock is still sent this often, so a
// crash loses at most this much of it. Any other change carries the clock too.
const CLOCK_ONLY_INTERVAL_MS = 5 * 60 * 1000;

// Fired on a successful sync so the phish re-post queues (systems/se-landing-page-client.js) can
// re-post a build or send held while the server was unreachable. A plain window event, so this file
// takes no phish import and stays off their harness copy lists (chunk A review major 2).
const SYNC_OK_EVENT = 'break-escape:sync-ok';
function notifySyncOk() {
  try {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    if (typeof CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(SYNC_OK_EVENT));
  } catch (e) { /* a dispatch failure must never fail a sync */ }
}

// requestSoon() (a KO): requests this close together share one sync, and none waits
// longer than the cap after the first request of its window.
export const REQUEST_SOON_DEBOUNCE_MS = 750;
export const REQUEST_SOON_MAX_MS = 1500;

// The comparison key of a flush: what it would mark confirmed (the ack, without the
// elapsed clock time, which moves on its own), plus the phone threads and parts, which
// ride without an ack. Two flushes with the same key carry the same delta.
function flushKeyOf(changes, partNames) {
  const { clockElapsedMs, ...ack } = changes.ack;
  const parts = {};
  for (const name of partNames) if (changes.body[name] !== undefined) parts[name] = changes.body[name];
  return stableJson({ ack, phoneState: changes.body.phoneState, parts });
}

// Keyed sections: only changed keys are sent, and a key that has gone is sent
// as null (the server deletes it for globalVariables and ignores it elsewhere).
const KEYED_SECTIONS = ['globalVariables', 'npcVisibility', 'npcHostility', 'triggeredEvents', 'npcInkVariables', 'mailState'];

// Keys of a keyed section compared by something other than their whole value.
// mailState.jobs: remainingMs counts down every tick, so only which jobs exist
// (ids, account, message) is a change, as timedMessages diffs its pending ids;
// the current times ride along with anything else that is sent (00 S9).
const mailJobsChangeKey = jobs => stableJson((jobs || []).map(j =>
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
const LANDING_CHECK_KEYS = ['hostId', 'pretextId', 'urgencyId', 'stepsId'];
const LANDING_VICTIM_KEYS = ['visited', 'submitted', 'noticed'];
const LANDING_TELL_IDS = ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock', 'formOrigin', 'hoverMismatch'];

// Deterministic JSON: object keys sorted at every depth, arrays kept in order,
// undefined dropped as JSON.stringify drops it. A value stored in the jsonb
// player_state column comes back with its object keys reordered (jsonb sorts
// keys by length then bytes), so a plain JSON.stringify of the current value
// never matches the stored copy. Comparing stableJson of each makes the first
// sync after a reload send only what truly changed (SYNC_DELTAS_PLAN 2.1).
export function stableJson(value) {
  return JSON.stringify(value, function sortKeys(_key, val) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const sorted = {};
      for (const k of Object.keys(val).sort()) sorted[k] = val[k];
      return sorted;
    }
    return val;
  });
}

// Globals the server owns: the client never sends them and never seeds them from
// the bootstrap. se_captures is server-owned (sync deltas R2, 6a): a capture rides the
// `captures` sync part instead, and the mirror the client keeps for its readers is left
// out of the outgoing globals (buildSharedSections) and of the seed (SYNC_DELTAS_PLAN 3.2).
export const SERVER_OWNED_GLOBALS = new Set(['se_captures']);

// The synced fields of a note and a biometric sample, as one place both the seed
// (seedFromSaved) and the export (buildPlayerSections) read, so they cannot drift.
export function pickNote(n) {
  return { id: n.id, title: n.title, text: n.text, timestamp: n.timestamp, read: n.read, important: n.important };
}
export function pickSample(s) {
  return {
    id: s.id, type: s.type, owner: s.owner, ownerId: s.ownerId, ownerName: s.ownerName,
    quality: s.quality, rating: s.rating, pattern: s.pattern, identified: s.identified,
    sourceObjectId: s.sourceObjectId, sourceRoomId: s.sourceRoomId, sourceName: s.sourceName,
    surface: s.surface, collectedAt: s.collectedAt
  };
}

// The timed-texts and clock comparison keys, as buildChanges builds them, so the
// seed and the diff agree (SYNC_DELTAS_PLAN 3.2).
function timedMessagesKeyOf(timed) {
  return stableJson({ pending: (timed?.pending || []).map(m => m.id), delivered: timed?.delivered || [] });
}
function clockKeyOf(clock) {
  const t = clock?.timers || {};
  return stableJson({ fired: t.fired || [], cancelled: t.cancelled || [], started: Object.keys(t.started || {}).sort() });
}

// The part of a flush's ack that its sent body really carried: a reduced body leaves
// sections out, and a part's flushKeep can send only some keys of a section.
function sentAckOf(ack, sent) {
  const out = {};
  for (const section of [...KEYED_SECTIONS]) {
    const keys = sent[section];
    if (!ack[section] || !keys || typeof keys !== 'object') continue;
    const part = {};
    for (const k of Object.keys(keys)) if (k in ack[section]) part[k] = ack[section][k];
    if (Object.keys(part).length) out[section] = part;
  }
  if (ack.notes && Array.isArray(sent.notes)) {
    const part = {};
    for (const note of sent.notes) if (note && note.id in ack.notes) part[note.id] = ack.notes[note.id];
    if (Object.keys(part).length) out.notes = part;
  }
  for (const key of [...WHOLE_SECTIONS, 'currentRoom', 'scenarioBriefShown']) {
    if (ack[key] !== undefined && sent[key] !== undefined) out[key] = ack[key];
  }
  if (sent.timedMessages !== undefined && ack.timedMessagesKey !== undefined) out.timedMessagesKey = ack.timedMessagesKey;
  if (sent.scenarioClock !== undefined) {
    if (ack.clockKey !== undefined) out.clockKey = ack.clockKey;
    if (ack.clockElapsedMs !== undefined) out.clockElapsedMs = ack.clockElapsedMs;
  }
  return out;
}

// A copy of `confirmed` with an ack laid over it, as confirm() would record it.
function layerAck(confirmed, ack) {
  const out = { ...confirmed };
  for (const section of [...KEYED_SECTIONS, 'notes']) {
    if (!ack[section]) continue;
    const kept = { ...(out[section] || {}) };
    for (const [key, s] of Object.entries(ack[section])) {
      if (s === null) delete kept[key]; else kept[key] = s;
    }
    out[section] = kept;
  }
  for (const key of [...WHOLE_SECTIONS, 'currentRoom', 'scenarioBriefShown', 'timedMessagesKey', 'clockKey', 'clockElapsedMs']) {
    if (ack[key] !== undefined) out[key] = ack[key];
  }
  return out;
}

/**
 * A `confirmed`-shaped object built from the bootstrap's saved blocks, every value
 * turned into its stableJson string (the same strings buildChanges compares), so
 * the first sync after a load sends only what truly changed (SYNC_DELTAS_PLAN 3.2).
 * Pure: `mailKeys` is the flattened savedMailState (flattenSavedMailState), passed
 * in so this module needs no import of mail-scheduler.js.
 */
export function seedFromSaved(saved, mailKeys = {}) {
  const confirmed = {};
  const put = (section, key, value) => { (confirmed[section] ||= {})[key] = stableJson(value); };

  const keyed = [
    ['globalVariables', 'savedGlobalVariables'],
    ['npcVisibility', 'savedNpcVisibility'],
    ['npcHostility', 'savedNpcHostility'],
    ['triggeredEvents', 'savedTriggeredEvents'],
    ['npcInkVariables', 'savedNpcInkVariables']
  ];
  for (const [section, field] of keyed) {
    const obj = saved?.[field];
    if (!obj || typeof obj !== 'object') continue;
    for (const [k, v] of Object.entries(obj)) {
      if (section === 'globalVariables' && SERVER_OWNED_GLOBALS.has(k)) continue;
      put(section, k, v);
    }
  }

  // Mail: the flattened keys. jobs compare by mailJobsChangeKey, as buildChanges does.
  for (const [k, v] of Object.entries(mailKeys || {})) {
    if (k === 'jobs') (confirmed.mailState ||= {}).jobs = mailJobsChangeKey(v);
    else put('mailState', k, v);
  }

  for (const note of Array.isArray(saved?.savedNotes) ? saved.savedNotes : []) {
    if (note && note.id !== undefined) put('notes', note.id, pickNote(note));
  }

  if (Array.isArray(saved?.savedCommandBoardLog)) confirmed.commandBoardLog = stableJson(saved.savedCommandBoardLog);
  if (Array.isArray(saved?.savedBiometricSamples)) confirmed.biometricSamples = stableJson(saved.savedBiometricSamples.map(pickSample));
  if (saved?.savedPlayerHealth) confirmed.playerHealth = stableJson(saved.savedPlayerHealth);
  if (saved?.scenarioBriefShown) confirmed.scenarioBriefShown = true;
  if (typeof saved?.savedCurrentRoom === 'string') confirmed.currentRoom = saved.savedCurrentRoom;
  if (saved?.savedTimedMessages) confirmed.timedMessagesKey = timedMessagesKeyOf(saved.savedTimedMessages);
  if (saved?.savedScenarioClock) {
    confirmed.clockKey = clockKeyOf(saved.savedScenarioClock);
    confirmed.clockElapsedMs = saved.savedScenarioClock.elapsedMs;
  }
  return confirmed;
}

const isPlainObject = v => v != null && typeof v === 'object' && !Array.isArray(v);
const pickKeys = (obj, keys) => {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
};

// The seven draft choice keys only (null everything else away).
// A fake-check page (ENG-03b) also carries a closed `check` block of four menu ids. It must
// survive the sync boundary, or a reload restores a record with no host and the replay shows
// the genuine one. Only the four ids are kept, each a string or null.
const sanitizeLandingCheck = check => {
  const out = {};
  for (const k of LANDING_CHECK_KEYS) {
    const v = isPlainObject(check) ? check[k] : null;
    out[k] = typeof v === 'string' ? v : null;
  }
  return out;
};
const sanitizeLandingChoices = choices => {
  if (!isPlainObject(choices)) return {};
  const out = pickKeys(choices, LANDING_CHOICE_KEYS);
  if (isPlainObject(choices.check)) out.check = sanitizeLandingCheck(choices.check);
  return out;
};

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
    this.onPageHide = () => this.flush({ reason: 'pagehide' });
    // A phone browser can kill a background tab without ever firing pagehide, so the
    // same flush also runs when the page is hidden. Back to visible clears the guard.
    this.onVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') this.flush({ reason: 'hidden' });
      else this._hiddenFlushKey = null;
    };
    // The change key (flushKeyOf) of the flush sent when the page was last hidden, or
    // null while visible. A pagehide that follows skips the same delta (no double send).
    this._hiddenFlushKey = null;
    // Bytes of this page's flush keepalives still in flight, so two flushes stay under
    // the browser's shared keepalive quota together.
    this._keepaliveInflight = 0;
    // The flushes still in flight: { clientTs, sentAck (what its body carried), sentAt }.
    // A flush behind one that cannot carry the whole delta sends only what changed since
    // (_changesSinceInFlight).
    this._flushesInFlight = new Set();
    // clientTs of the newest request whose answer was confirmed: an older request's
    // answer that lands later confirms nothing (its ack would overwrite a newer one).
    this._confirmedTs = 0;
    // stop() is final: a requestSoon() after it does nothing.
    this._stopped = false;
    // requestSoon(): the pending debounce timer, and when the first request in the
    // current window was made (the wait is capped at REQUEST_SOON_MAX_MS from it).
    this._soonTimer = null;
    this._soonFirstAt = 0;
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
    this._seeded = false; // seedFromBootstrap runs once per page
    // Keyed-section keys this page has ever held in its current state. A confirmed
    // key missing from the current state is only sent as null (a delete) when it is
    // held here, so a key the server holds that the client never showed this page is
    // left alone, as the first sync leaves it today (SYNC_DELTAS_PLAN 3.2, 3.3).
    this._held = {};
    // Named extra parts of the sync body (SYNC_DELTAS_PLAN 2.2). A capture (R2)
    // rides inside the sync body as a part; a part with a value counts as a change
    // and keeps syncConfirmed() false until the server has acknowledged it. Empty
    // until step 6a registers one.
    this._parts = new Map();
    // Requests that must settle before syncConfirmed()'s first run (a card clone,
    // P1). Each promise removes itself when it settles.
    this._tracked = new Set();
    // The shared global writer (systems/global-writer.js writeGlobal), set by main.js. Left
    // unset (a test harness), applyServerWrites writes gameState.globalVariables directly.
    this.writeGlobal = null;
  }

  /**
   * Apply what the server wrote during a request the client did not ask it to write (tailgate
   * sync): serverGlobals (a creditOnPass global such as kp_badge_tailgated) and
   * serverCompletedTasks (its completeTask), carried on the sync_state and door unlock answers.
   * Each global goes through the shared writer (gameState, ink, global_variable_changed) and is
   * marked confirmed at that value, so the next sync does not echo it back up (the server holds
   * credit globals read-only anyway). Each task completes locally with no POST.
   * An answer carries the clientTs of its request (a door unlock takes one from nextClientTs at
   * dispatch). A global an answer with a newer clientTs already wrote is not overwritten by an
   * older answer that lands late, so a late answer cannot revert a newer value. Tasks are
   * idempotent and need no guard.
   * @param {Object} answer
   * @param {number} [clientTs] the request's clientTs; omitted, no ordering is applied
   */
  applyServerWrites(answer, clientTs) {
    const globals = answer?.serverGlobals;
    if (globals && typeof globals === 'object' && !Array.isArray(globals)) {
      const confirmed = this.confirmed.globalVariables ||= {};
      const held = this._held.globalVariables ||= new Set();
      const writeTs = this._serverWriteTs ||= {};
      for (const [name, value] of Object.entries(globals)) {
        if (SERVER_OWNED_GLOBALS.has(name)) continue;
        if (typeof clientTs === 'number') {
          if (name in writeTs && clientTs < writeTs[name]) continue;
          writeTs[name] = clientTs;
        }
        confirmed[name] = stableJson(value);
        held.add(name);
        try {
          if (typeof this.writeGlobal === 'function') {
            this.writeGlobal(name, value, { openChat: true });
          } else if (typeof window !== 'undefined' && window.gameState?.globalVariables) {
            window.gameState.globalVariables[name] = value;
          }
        } catch (e) {
          console.warn(`State sync: could not apply the server's ${name}:`, e?.message || e);
        }
      }
    }
    const tasks = answer?.serverCompletedTasks;
    if (Array.isArray(tasks) && tasks.length) {
      const manager = typeof window !== 'undefined' ? window.objectivesManager : null;
      for (const taskId of tasks) {
        if (typeof taskId !== 'string' || !taskId) continue;
        try {
          manager?.applyServerCompletedTask?.(taskId);
        } catch (e) {
          console.warn(`State sync: could not apply the server's task ${taskId}:`, e?.message || e);
        }
      }
    }
    // A credit that concluded the mission: show the ending as a client completion would
    const concluded = answer?.serverMissionConcluded;
    if (typeof concluded === 'string' && concluded) {
      try {
        window.objectivesManager?.applyServerMissionConcluded?.(concluded);
      } catch (e) {
        console.warn("State sync: could not apply the server's mission conclusion:", e?.message || e);
      }
    }
  }

  /**
   * Register a named extra part of the sync body (SYNC_DELTAS_PLAN 2.2). Two kinds
   * of write now leave the keyed globals: a capture (R2), which travels inside the
   * sync body as a part, and a card (P1), which travels in its own tracked request.
   * @param {string} name - the body key the part sends under
   * @param {Object} part
   * @param {function():*} [part.build] - the value to send, or undefined for none.
   *   A non-undefined value counts as a change, so buildChanges() does not return
   *   null while the part has one.
   * @param {function(Object):void} [part.onAnswer] - called after every 2xx answer,
   *   stale or not, before the stale check returns; never on a refused (403) or
   *   failed sync, so a part's entries stay pending until a 2xx records them.
   * @param {function():number} [part.pendingCount] - entries the server has not yet
   *   acknowledged. syncConfirmed() stays false while any part has pending entries.
   * @param {function(Object):Object} [part.flushKeep] - extra keyed changes the
   *   pagehide flush must keep in its reduced fallback lists.
   */
  registerPart(name, part = {}) {
    this._parts.set(name, part);
  }

  /**
   * Keep a request (a card clone, P1) in flight until it settles, so
   * syncConfirmed() can wait for it before its first run. Returns the promise.
   */
  track(promise) {
    this._tracked.add(promise);
    Promise.resolve(promise).finally(() => this._tracked.delete(promise));
    return promise;
  }

  /** Part build values present now, as { name: value }. */
  _partBodies() {
    const out = {};
    for (const [name, part] of this._parts) {
      const value = part.build?.();
      if (value !== undefined) out[name] = value;
    }
    return out;
  }

  /** Extra keyed changes every part asks the pagehide flush to keep (flushKeep). */
  _flushKeep(changes) {
    let keep = {};
    for (const part of this._parts.values()) {
      const extra = part.flushKeep?.(changes);
      if (extra && typeof extra === 'object') keep = { ...keep, ...extra };
    }
    return keep;
  }

  /** True while any registered part has entries the server has not acknowledged. */
  _partsPending() {
    for (const part of this._parts.values()) {
      if ((part.pendingCount?.() || 0) > 0) return true;
    }
    return false;
  }

  /**
   * Seed `confirmed` from the bootstrap's saved blocks, once per page, so the first
   * sync after a load sends only what changed since the server saved it, not every
   * section whole (SYNC_DELTAS_PLAN 3.2). A value is set only where `confirmed` has
   * none yet, so a sync that ran before the seed keeps its acknowledgements.
   * @param {Object} scenario - the bootstrap (gameScenario)
   * @param {Object} [opts.mailKeys] - the flattened savedMailState (flattenSavedMailState)
   */
  seedFromBootstrap(scenario, { mailKeys = {} } = {}) {
    if (this._seeded) return;
    this._seeded = true;
    const seed = seedFromSaved(scenario, mailKeys);
    for (const [section, value] of Object.entries(seed)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const target = this.confirmed[section] ||= {};
        for (const [k, v] of Object.entries(value)) if (!(k in target)) target[k] = v;
      } else if (this.confirmed[section] === undefined) {
        this.confirmed[section] = value;
      }
    }
    // The page applies every saved global with Object.assign, so it holds them from
    // the start; a saved global the client then deletes must go up as null (3.2).
    const savedGlobals = scenario?.savedGlobalVariables;
    if (savedGlobals && typeof savedGlobals === 'object') {
      const held = this._held.globalVariables ||= new Set();
      for (const k of Object.keys(savedGlobals)) if (!SERVER_OWNED_GLOBALS.has(k)) held.add(k);
    }
    if (this.confirmed.clockKey !== undefined) this.clockConfirmedAt = Date.now();
  }

  start() {
    this._stopped = false;
    this.timer = setInterval(() => this.sync(), this.interval);
    // A reload inside the 30s window used to drop every global set since the
    // last sync, so re-entry guards (briefing_played, clone_call_done, ...)
    // replayed their scenes. Send one last sync as the page goes away.
    window.addEventListener('pagehide', this.onPageHide);
    // A background tab on a phone may be killed with no pagehide: save on hidden too.
    if (typeof document !== 'undefined') document.addEventListener?.('visibilitychange', this.onVisibilityChange);
    console.log('State sync started (every 30s, and on page hide or hidden)');
  }

  stop() {
    this._stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this._soonTimer) {
      clearTimeout(this._soonTimer);
      this._soonTimer = null;
    }
    window.removeEventListener('pagehide', this.onPageHide);
    if (typeof document !== 'undefined') document.removeEventListener?.('visibilitychange', this.onVisibilityChange);
  }

  /**
   * Ask for a sync soon, for a change that should not wait for the 30 s timer (an NPC
   * knocked out). Debounced: requests within REQUEST_SOON_DEBOUNCE_MS of each other share
   * one sync, and the wait from the first request is capped at REQUEST_SOON_MAX_MS, so a
   * multi-NPC fight sends one delta and a crash a few seconds after a KO still keeps it.
   * The sync it runs is the normal delta sync (sync()).
   */
  requestSoon() {
    if (this._stopped) return;
    const now = Date.now();
    if (!this._soonTimer) this._soonFirstAt = now;
    else clearTimeout(this._soonTimer);
    const wait = Math.max(0, Math.min(REQUEST_SOON_DEBOUNCE_MS, this._soonFirstAt + REQUEST_SOON_MAX_MS - now));
    this._soonTimer = setTimeout(() => {
      this._soonTimer = null;
      this.sync();
    }, wait);
  }

  /** Sections a multiplayer game would share across the team. */
  buildSharedSections() {
    const out = {};
    // Shallow copy, so a later change to a global doesn't alter what was built
    out.globalVariables = { ...(window.gameState?.globalVariables || {}) };
    // Server-owned globals (se_captures) never ride the sync: the client keeps a display mirror
    // but the record is server-owned and travels in the `captures` part (SYNC_DELTAS_PLAN 3.2, 6a)
    for (const k of SERVER_OWNED_GLOBALS) delete out.globalVariables[k];
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
    // The player's actual room is the detected room id (core/rooms.js sets both the module
    // `currentPlayerRoom` and window.currentPlayerRoom). window.currentRoom is a legacy global that
    // main.js sets to null and never assigns, so `window.currentRoom?.name` was always undefined and
    // currentRoom never synced (true on main too). Read currentPlayerRoom so the real room reaches
    // the server; an empty detection ('' before the first detect) collapses to undefined, so it is
    // not sent (the delta below only sends a truthy, changed room), and never a bare '' the guard
    // would refuse.
    out.currentRoom = window.currentPlayerRoom || undefined;

    // Notes, so observations survive page reloads. Plain data only (no sprites).
    out.notes = (window.gameState?.notes || []).map(pickNote);

    // Phone threads: texts, read state and story position per contact. With
    // onlyChanged, only contacts changed since the last confirmed sync.
    const phoneState = window.npcManager?.exportPhoneState?.({ onlyChanged, keyOf: stableJson });
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
    const biometricSamples = (window.gameState?.biometricSamples || []).map(pickSample);
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
   * @param {Object} [opts.base] - what to compare against (default this.confirmed); a
   *   pagehide behind a hidden flush still in flight lays that flush's sent values over it
   * @param {number} [opts.clockConfirmedAt] - when base's clock was sent (5-minute rule)
   * @returns {{ body: Object, ack: Object }|null}
   */
  buildChanges({ forceClock = false, now = Date.now(), base = this.confirmed, clockConfirmedAt = this.clockConfirmedAt } = {}) {
    const full = this.buildPayload({ onlyChanged: true });
    const body = {};
    const ack = {};

    for (const section of KEYED_SECTIONS) {
      const current = full[section] || {};
      const confirmed = base[section] || {};
      const changes = {};
      const acked = {};
      const changeKeys = CHANGE_KEYS[section] || {};
      const held = this._held[section] ||= new Set();
      for (const [key, value] of Object.entries(current)) {
        if (value === undefined) continue;
        held.add(key);
        const s = changeKeys[key] ? changeKeys[key](value) : stableJson(value);
        if (confirmed[key] !== s) { changes[key] = value; acked[key] = s; }
      }
      for (const key of Object.keys(confirmed)) {
        // Only delete a key this page held and then lost, never one the server holds
        // that the client never showed this page (SYNC_DELTAS_PLAN 3.3).
        if (current[key] === undefined && held.has(key)) { changes[key] = null; acked[key] = null; }
      }
      if (Object.keys(changes).length > 0) { body[section] = changes; ack[section] = acked; }
    }

    // Notes: new or changed ones, by id (the server merges by id)
    const confirmedNotes = base.notes || {};
    const notes = [];
    const ackedNotes = {};
    for (const note of full.notes || []) {
      const s = stableJson(note);
      if (confirmedNotes[note.id] !== s) { notes.push(note); ackedNotes[note.id] = s; }
    }
    if (notes.length > 0) { body.notes = notes; ack.notes = ackedNotes; }

    for (const section of WHOLE_SECTIONS) {
      if (full[section] === undefined) continue;
      const s = stableJson(full[section]);
      if (base[section] !== s) { body[section] = full[section]; ack[section] = s; }
    }

    if (full.currentRoom && full.currentRoom !== base.currentRoom) {
      body.currentRoom = full.currentRoom;
      ack.currentRoom = full.currentRoom;
    }

    if (full.scenarioBriefShown && !base.scenarioBriefShown) {
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
      timedKey = stableJson({
        pending: (full.timedMessages.pending || []).map(m => m.id),
        delivered: full.timedMessages.delivered || []
      });
      if (timedKey !== base.timedMessagesKey) ack.timedMessagesKey = timedKey;
    }

    // Clock: elapsed time alone is not a change. Timer state is.
    let clockKey = null;
    if (full.scenarioClock) {
      const t = full.scenarioClock.timers || {};
      clockKey = stableJson({ fired: t.fired || [], cancelled: t.cancelled || [], started: Object.keys(t.started || {}).sort() });
    }
    // Extra sync-body parts (a capture, R2). A part with a value counts as a
    // change, so a part alone keeps buildChanges() from returning null. Parts are
    // not confirmed by ack; they use onAnswer/pendingCount (SYNC_DELTAS_PLAN 2.2).
    const partBodies = this._partBodies();
    const hasParts = Object.keys(partBodies).length > 0;

    const clockStateChanged = clockKey !== null && clockKey !== base.clockKey;
    const somethingElse = Object.keys(body).length > 0 || ack.timedMessagesKey !== undefined;
    const clockDue = full.scenarioClock &&
      full.scenarioClock.elapsedMs !== base.clockElapsedMs &&
      now - clockConfirmedAt >= CLOCK_ONLY_INTERVAL_MS;

    if (!somethingElse && !clockStateChanged && !clockDue && !forceClock && !hasParts) return null;

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
    for (const [name, value] of Object.entries(partBodies)) body[name] = value;
    if (Object.keys(body).length === 0) return null;
    return { body, ack };
  }

  /**
   * Record what the server now holds, after a 2xx answer that wasn't stale.
   * Sections in notSaved (the server refused them over a cap and kept its
   * previous copy) are not confirmed, so they are sent again (00 §13).
   *
   * currentRoom is the exception: when the server refuses a currentRoom
   * (may_sync_current_room? rejected it, R4 MINOR 1) it names it in notSaved
   * too, but the room is still confirmed below. Re-sending the same refused
   * room on every sync is exactly the forever loop (SYNC SIZE) the server fix
   * avoids, so for currentRoom a notSaved means "the server kept its own room;
   * do not re-send this one" -- a new room is sent only when currentRoom
   * actually changes (buildChanges compares against this.confirmed.currentRoom).
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
    // currentRoom is confirmed even when refused (see the note above): a refusal
    // must not make the client re-send the same room forever.
    for (const key of [...WHOLE_SECTIONS, 'currentRoom', 'scenarioBriefShown', 'timedMessagesKey', 'clockKey', 'clockElapsedMs']) {
      if (ack[key] !== undefined) this.confirmed[key] = ack[key];
    }
    if (body.scenarioClock) this.clockConfirmedAt = now;
    if (body.phoneState && !refused.has('phoneState')) window.npcManager?.markPhoneStateSynced?.(body.phoneState, { keyOf: stableJson });
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
      const clientTs = this.nextClientTs();
      const body = { ...changes.body, clientTs };
      const response = await ApiClient.put('/sync_state', body);
      const { stale, notSaved } = this._applyAnswer(changes, clientTs, response);
      if (stale) {
        console.warn('State sync answered stale; resending with the next sync');
        this.lastError = null;
        return { ok: false, error: null };
      }
      this.lastError = null;
      console.log('✓ State synced to server');
      // A successful sync means the server is reachable again, so any phish build or send held in
      // the client re-post queues (systems/se-landing-page-client.js) can now be re-posted. A small
      // window event, not a static import, keeps the queue modules off this file's harness copy list
      // and this file free of a phish dependency (chunk A review major 2). Guarded so the headless
      // sync tests (no window.dispatchEvent / CustomEvent) are unaffected.
      notifySyncOk();
      // A run that left a capped section refused is not fully confirmed (N-4): the
      // saved sections are confirmed above, but syncConfirmed must not report success
      // while a section stays unsaved and is resent on every sync. Nor while a part
      // still has pending entries the server has not acknowledged (2.2).
      return { ok: notSaved.length === 0 && !this._partsPending(), error: null };
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
    // Wait for every tracked request (a card clone, P1) to settle first, so the
    // server holds everything before the first run reads pendingCount (2.2).
    if (this._tracked.size) await Promise.allSettled([...this._tracked]);
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
   * Best-effort sync while the page unloads or is hidden: the changes since the
   * last confirmed sync, with the clock. keepalive lets the request outlive the
   * page; it can't be awaited, and its body is size-capped, so an oversized
   * body falls back to the reload-critical sections.
   *
   * reason 'hidden' (visibilitychange): a phone may kill a background tab with no
   * pagehide, so the same delta goes up as the page is hidden. A hide with no
   * change sends nothing (the clock is not forced on a hide). A hidden flush that
   * does not land (non-2xx, network error, rejected, or answered stale) clears its
   * guard, so the pagehide after it sends the delta. A pagehide with a different
   * delta while a hidden flush is still in flight sends the whole delta if it fits
   * beside it, else only what changed since that flush (_changesSinceInFlight).
   * reason 'pagehide'
   * after a hidden flush, with the page not visible since, does not send that
   * delta again: when the hidden flush's answer has been confirmed, nothing is
   * left to send (the clock is not forced, it went with the hidden flush); when
   * it has not come back yet, a pagehide whose delta has the same key is skipped.
   * A full-body flush whose 2xx answer arrives is confirmed like a sync, so the
   * next periodic sync does not repeat it either (a refused currentRoom is
   * confirmed too, as confirm() does for the tailgating guard).
   */
  flush({ reason = 'pagehide' } = {}) {
    let key = null;
    try {
      // The clock is forced only on a pagehide with no hidden flush before it: a tab
      // switch with no change sends nothing (the clock follows the normal 5-minute rule;
      // GameClock is wall-clock based, so a hidden page's clock does not drift), and a
      // pagehide after a hidden flush that went up does not send the clock again.
      const afterHidden = reason === 'pagehide' && this._hiddenFlushKey !== null;
      let changes = this.buildChanges({ forceClock: reason === 'pagehide' && !afterHidden });
      if (!changes) return;
      key = flushKeyOf(changes, this._parts.keys());
      if (afterHidden && key === this._hiddenFlushKey) {
        console.log('State flush: the hidden-page flush already sent this delta');
        return;
      }
      let clientTs = this.nextClientTs();
      // The browser's keepalive quota is shared by every keepalive in flight, so this
      // body gets what the flushes still uploading leave.
      const budget = KEEPALIVE_BODY_LIMIT - this._keepaliveInflight;
      let sized = null;
      if (this._flushesInFlight.size === 0) {
        sized = this._sizeFlushBody(changes, clientTs, budget);
      } else {
        // Another flush is still uploading (a large hidden flush, then this pagehide).
        // The whole delta holds everything that flush carried, with newer values and a
        // newer clientTs, so it is safe whichever the server takes first: send it if it
        // fits. A reduced one is not: taken first, it would make the older flush stale
        // and the sections it left out would be lost.
        const whole = { ...changes.body, clientTs };
        const wholeBody = JSON.stringify(whole);
        if (bodyBytes(wholeBody) <= budget) {
          sized = { sent: whole, body: wholeBody, reduced: false };
        } else {
          // Send only what changed since the flushes in flight, with a clientTs just
          // below the oldest of them, so this body can never make them stale.
          const since = this._changesSinceInFlight();
          if (!since) {
            console.log('State flush: nothing new since the flush in flight, or no clientTs below it');
            return;
          }
          ({ changes, clientTs } = since);
          sized = this._sizeFlushBody(changes, clientTs, budget);
        }
      }
      // Too big even reduced: send nothing. Nothing is confirmed and no guard is set,
      // so the delta goes with the next sync or the pagehide.
      if (!sized) return;
      const { sent, body, reduced } = sized;
      // The guard is set only for a flush that is sent, and cleared again below when
      // it did not land, so a pagehide that follows still sends the delta.
      if (reason === 'hidden') this._hiddenFlushKey = key;
      const size = bodyBytes(body);
      const flight = { clientTs, sentAck: sentAckOf(changes.ack, sent), sentAt: Date.now() };
      this._keepaliveInflight += size;
      this._flushesInFlight.add(flight);
      let request;
      try {
        request = fetch(`${getApiBase()}/sync_state`, {
          method: 'PUT',
          keepalive: true,
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body
        });
      } catch (error) {
        request = Promise.reject(error);
      }
      Promise.resolve(request).then(response => {
        if (!response?.ok) return false;
        return response.json().then(answer => {
          // A stale answer saved none of the last-write-wins sections, so it has not
          // landed. A reduced body left sections out, so only a full one is confirmed.
          // A reduced body left sections out, but the server's own writes still apply
          if (reduced) {
            this.applyServerWrites(answer, clientTs);
            return !answer?.stale;
          }
          return !this._applyAnswer(changes, clientTs, answer).stale;
        });
      }).catch(() => false).then(landed => {
        this._keepaliveInflight = Math.max(0, this._keepaliveInflight - size);
        this._flushesInFlight.delete(flight);
        if (!landed) this._clearHiddenGuard(reason, key);
      });
    } catch (error) {
      this._clearHiddenGuard(reason, key);
      console.error('State flush failed:', error);
    }
  }

  /**
   * The flush body for `changes` within `budget` bytes: the whole delta, or, when it is
   * too big, the reload-critical parts: globals, the mail changed since the last sync (a
   * delivered reply and its job travel together), fired one-shot handlers, the timed
   * texts they scheduled, and the phone threads changed since the last sync. mailState
   * is dropped whole, never cut, in the second list (00 §10a "The pagehide flush has a
   * size budget"). Null when even that does not fit.
   * @returns {{ sent: Object, body: string, reduced: boolean }|null}
   */
  _sizeFlushBody(changes, clientTs, budget) {
    const payload = { ...changes.body, clientTs };
    let sent = payload;
    let body = JSON.stringify(payload);
    if (bodyBytes(body) <= budget) return { sent, body, reduced: false };
    const { globalVariables, mailState, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth } = payload;
    // Parts (a capture, R2) ride in each reduced list after clientTs; a part
    // also names extra keyed changes to keep through flushKeep (2.2).
    const parts = this._partBodies();
    const keep = this._flushKeep(changes);
    sent = { globalVariables, mailState, triggeredEvents, timedMessages, phoneState, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth, ...keep, ...parts, clientTs };
    body = JSON.stringify(sent);
    if (bodyBytes(body) <= budget) return { sent, body, reduced: true };
    sent = { globalVariables, triggeredEvents, timedMessages, scenarioClock, npcVisibility, npcHostility, commandBoardLog, playerHealth, ...keep, ...parts, clientTs };
    body = JSON.stringify(sent);
    if (bodyBytes(body) <= budget) return { sent, body, reduced: true };
    return null;
  }

  /**
   * What changed since the flushes still in flight: the delta against their sent values
   * laid over `confirmed`, stamped with a fresh clientTs above every flush in flight.
   * nextClientTs is max(Date.now(), last + 1) and `last` rose as each flush drew its
   * stamp, so this stamp is strictly above the newest of them, and the reduced body
   * carries the newest value for each key it holds. Taken after the flushes it is fresh
   * and applies. Taken before them it lands first as fresh, and when each older flush
   * then arrives stale-but-recent the server's ring skips the keys this body already
   * wrote while merging that flush's unique sections (the ones left out here), so no
   * section is lost in either order. The ring is what makes stamping above safe: without
   * it, an older flush landing second would look wholly stale and its unique sections
   * would be dropped. Null when nothing has changed since (a genuinely empty
   * difference), in which case no stamp is drawn.
   * @returns {{ changes: Object, clientTs: number }|null}
   */
  _changesSinceInFlight() {
    const flights = [...this._flushesInFlight].sort((a, b) => a.clientTs - b.clientTs);
    let base = this.confirmed;
    let clockConfirmedAt = this.clockConfirmedAt;
    for (const f of flights) {
      base = layerAck(base, f.sentAck);
      if (f.sentAck.clockKey !== undefined) clockConfirmedAt = Math.max(clockConfirmedAt, f.sentAt);
    }
    const changes = this.buildChanges({ base, clockConfirmedAt });
    if (!changes) return null;
    const clientTs = this.nextClientTs();
    return { changes, clientTs };
  }

  /** A hidden flush that did not land (non-2xx, network error, rejected) no longer blocks the pagehide. */
  _clearHiddenGuard(reason, key) {
    // Any failed hidden flush clears the guard, not only the newest one: a later hide
    // may have sent only the difference behind it (review R3 m1), so its key no longer
    // covers what the failed flush carried. The cost is at most one duplicate request.
    if (reason === 'hidden') this._hiddenFlushKey = null;
  }

  /**
   * Record a 2xx answer to a sync or a full-body flush. Every part sees every 2xx
   * answer, stale or not, before the stale check (a 403 or a failure never gets
   * here, so the part's entries stay pending, SYNC_DELTAS_PLAN 2.2). A stale answer
   * confirms nothing. An answer to a request older than the newest one already
   * confirmed confirms nothing either: the server applied the older request first
   * (and the newer request carried its changes, as it was built before this answer)
   * or answered it stale, so its ack would only overwrite a newer one.
   * @returns {{ stale: boolean, notSaved: string[] }}
   */
  _applyAnswer(changes, clientTs, answer) {
    for (const part of this._parts.values()) part.onAnswer?.(answer);
    // What the server wrote is its state after this request, so it applies on a stale answer too
    this.applyServerWrites(answer, clientTs);
    // A stale answer confirms nothing, so this request's sections are all resent on the
    // next sync. A stale-but-recent answer may now carry notSaved and mailTrimmed (the
    // server merged this request's pre-filtered sections and refused or trimmed some),
    // but the client acts on neither here: because nothing was confirmed, every refused
    // or trimmed key is still in the delta and goes up again on the next fresh sync, whose
    // answer carries the same notSaved and mailTrimmed and is handled below. A refused
    // currentRoom therefore reconciles (and is recorded, so it stops resending) one sync
    // later, and trimmed mail reconciles then; neither loops. The parts' onAnswer hooks
    // above read only their own capture fields, never notSaved or mailTrimmed, so a stale
    // answer leaves them unaffected too.
    if (answer?.stale) return { stale: true, notSaved: [] };
    const notSaved = Array.isArray(answer?.notSaved) ? answer.notSaved : [];
    for (const section of notSaved) {
      if (this._notSavedLogged.has(section)) continue;
      this._notSavedLogged.add(section);
      if (section === 'currentRoom') {
        // currentRoom is not capped: a notSaved means the server refused the room (it could not
        // vouch for it). confirm() records it anyway, so it is not resent with every sync; a new
        // room is sent only when currentRoom actually changes (R5 minor 1).
        console.warn('State sync: the server refused currentRoom; it will not be resent');
      } else {
        console.warn(`State sync: the server did not save ${section} (over a cap); resending it with each sync`);
      }
    }
    if (clientTs >= this._confirmedTs) {
      this.confirm(changes, Date.now(), notSaved);
      this._confirmedTs = clientTs;
    } else {
      console.log('State sync: an older request answered after a newer one; not confirmed');
    }
    // The server may have trimmed read mail to fit the 1 MB cap while still
    // saving (00 §10a, P1-D). It reports the dropped keys so we drop them here
    // too, rather than hold them as confirmed and lose them on reload. This is the
    // server's state after this request, so it applies even to an older answer.
    const mailTrimmed = Array.isArray(answer?.mailTrimmed) ? answer.mailTrimmed : [];
    if (mailTrimmed.length) this._reconcileTrimmedMail(mailTrimmed);
    return { stale: false, notSaved };
  }
}

// Exposed on the class so a caller holding window.stateSync can reach it as
// window.stateSync.constructor.stableJson without importing the module.
StateSync.stableJson = stableJson;
