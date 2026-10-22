/**
 * Mail scheduler and the client side of mailState (00 S9, §10 "Timing and
 * delivery", §10a "mailState").
 *
 * Owns window.mailScheduler.state, the in-memory mailState:
 *   { mailboxes: { <id>: { messages: [...], unread } }, jobs: [...], threads: {},
 *     drafts: {}, metrics: {} }
 * The mail client reads and writes it through the helpers below; state-sync.js
 * reads it through exportMailState() as a keyed section.
 *
 * Jobs. A job waits for a wall-clock countdown and then delivers:
 *   text: { jobId, kind: "text", targetId, accountId, msgId, text, outcomeGlobal, remainingMs }
 *         appends `text` (if any) to the inbox of `accountId` as a reply, removes the
 *         job, then sets `outcomeGlobal` to true through the shared global writer.
 *         A silent text job (text "", outcomeGlobal null) appends and sets nothing.
 *   seed: { jobId, kind: "seed", messageId, mailbox, remainingMs | global }
 *         a seeded message held back by its deliverAt.
 *   ink:  { jobId, kind: "ink", character, npcId, accountId, msgId, vars, knot, remainingMs }
 *         stored and counted down here; delivered by the handler the mail runner
 *         registers with registerKind("ink", fn) (Phase 1b). A handler returning
 *         false means "not ready, try next tick" (the NPC manager's convention).
 *
 * The countdown is held as a wall-clock deadline (spike F3: a hidden tab's timers
 * can stop for minutes, so a ticked counter would drift). `remainingMs` is
 * computed from the deadline when exported, and turned back into a deadline on
 * restore, so the time a page is closed does not count. The tick comes from the
 * NPC manager's 1 s loop, plus one on visibilitychange so a reply that fell due
 * while the tab was hidden arrives as soon as the tab is shown.
 *
 * A mission with no mail (no social.mailClient, nothing restored, nothing written)
 * exports null, so state-sync sends no mailState key at all (R4).
 *
 * The saved section (00 §10a "Persistence"): one key per message
 * (mailboxes.<box>.<msgId>) and one per thread (threads.<character>:<accountId>),
 * so a read mark or a delivery sends one message. Seeded mail is scenario data:
 * it is saved as a stub { id, seeded: true, read, gameTime } and rebuilt from
 * social.mailClient.seededMessages on load. The unread count is derived, never saved.
 */
import { writeGlobal } from './global-writer.js';

// Fields the server keeps on a message (game.rb MAIL_MESSAGE_KEYS); others are dropped
// here so the client never holds state that would vanish on reload.
export const MAIL_MESSAGE_FIELDS = [
  'id', 'thread', 'mailbox', 'folder', 'fromAccount', 'from', 'to', 'targetId', 'subject',
  'templates', 'slots', 'body', 'attachment', 'link', 'landed', 'tells', 'time', 'gameTime',
  'read', 'kind', 'seeded', 'links', 'attachments', 'highlights', 'pendingMessage'
];

// Default reply delay when neither the character nor the target authors one (00 §10)
export const DEFAULT_REPLY_DELAY_SECONDS = 20;

const pick = (obj, fields) => {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
};

let idSeq = 0;
const newId = prefix => `${prefix}_${Date.now().toString(36)}_${(++idSeq).toString(36)}`;

function emptyState() {
  return { mailboxes: {}, jobs: [], threads: {}, drafts: {}, metrics: {} };
}

// What a seeded message saves: the player's state only (00 §10a). The text is
// rebuilt from the scenario on load.
function seededStub(m) {
  const stub = { id: m.id, seeded: true, read: m.read === true };
  if (Number.isFinite(m.gameTime)) stub.gameTime = m.gameTime;
  return stub;
}

// savedMailState's messages per mailbox: { <box>: [message, ...] }. The server
// stores mailboxes nested; dotted keys (mailboxes.<box>.<msgId>, or a whole
// mailboxes.<box>) are accepted too.
function savedMailboxes(saved) {
  const boxes = {};
  const add = (id, list) => { boxes[id] = (boxes[id] || []).concat(list); };
  for (const [id, box] of Object.entries(saved.mailboxes || {})) {
    if (box && typeof box === 'object') add(id, Array.isArray(box.messages) ? box.messages : []);
  }
  for (const [key, value] of Object.entries(saved)) {
    if (!key.startsWith('mailboxes.') || !value || typeof value !== 'object') continue;
    const rest = key.slice('mailboxes.'.length);
    const dot = rest.indexOf('.');
    if (dot === -1) add(rest, Array.isArray(value.messages) ? value.messages : []);
    else add(rest.slice(0, dot), [{ ...value, id: value.id ?? rest.slice(dot + 1) }]);
  }
  return boxes;
}

export class MailScheduler {
  /**
   * @param {Object} [opts]
   * @param {function():number} [opts.now]   wall clock (tests pass a fake)
   * @param {function} [opts.writeGlobal]    the shared writer (tests pass a fake)
   * @param {Object} [opts.scenario]         defaults to window.gameScenario
   */
  constructor({ now = () => Date.now(), writeGlobal: writer = writeGlobal, scenario = null } = {}) {
    this.now = now;
    this.writeGlobal = writer;
    this._scenario = scenario;
    this.state = emptyState();
    this.active = false;          // the mission has mail, or mail state exists
    this._due = new Map();        // jobId -> wall-clock deadline (ms)
    this._handlers = new Map();   // job kind -> delivery handler
    this._listeners = new Set();  // fn(event, data)
    this._handlers.set('text', job => this._deliverText(job));
    this._handlers.set('seed', job => this._deliverSeed(job));
    this._onVisibility = () => { if (typeof document === 'undefined' || document.visibilityState === 'visible') this.tick(); };
  }

  get scenario() {
    return this._scenario || (typeof window !== 'undefined' ? window.gameScenario : null) || null;
  }

  get mailClientConfig() {
    return this.scenario?.social?.mailClient || null;
  }

  /**
   * Set up for a scenario: build the seeded mail, the configured mailboxes and
   * the deliverAt seed jobs from the scenario, then apply the saved section on
   * top (restore). A scenario with no social.mailClient and no saved state stays
   * inactive and exports nothing.
   * @param {Object} [opts]
   * @param {Object} [opts.scenario]
   * @param {Object} [opts.saved] - savedMailState from the server (nested shape)
   */
  init({ scenario = null, saved = null } = {}) {
    if (scenario) this._scenario = scenario;
    this.state = emptyState();
    this._due.clear();
    const config = this.mailClientConfig;
    const hasSaved = saved && typeof saved === 'object' && Object.keys(saved).length > 0;
    this.active = !!config || !!hasSaved;
    if (!this.active) return this;
    if (config) this._loadSeeded(config);
    if (hasSaved) this.restore(saved);
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.removeEventListener('visibilitychange', this._onVisibility);
      document.addEventListener('visibilitychange', this._onVisibility);
    }
    return this;
  }

  // --- persistence -------------------------------------------------------

  /**
   * The keyed section for state-sync, or null for a mission with no mail:
   *   "mailboxes.<box>.<msgId>": one message (a seeded one as a stub),
   *   "threads.<character>:<accountId>": one thread's position,
   *   jobs, drafts, metrics: one key each.
   * Jobs carry remainingMs computed from their deadlines now. Mailbox ids hold
   * no dot (validator), so the server splits the key on the first dot.
   */
  exportMailState() {
    if (!this.active) return null;
    const out = {};
    const seeds = this._seedsById();
    for (const [boxId, box] of Object.entries(this.state.mailboxes)) {
      for (const m of box.messages || []) {
        if (!m || !m.id) continue;
        const seeded = m.seeded === true || seeds.get(m.id)?.mailbox === boxId;
        out[`mailboxes.${boxId}.${m.id}`] = seeded ? seededStub(m) : { ...m };
      }
    }
    out.jobs = this.exportJobs();
    for (const [key, thread] of Object.entries(this.state.threads)) out[`threads.${key}`] = thread;
    out.drafts = this.state.drafts;
    out.metrics = this.state.metrics;
    return out;
  }

  /** The scenario's seeded messages by id. */
  _seedsById() {
    const map = new Map();
    for (const m of this.mailClientConfig?.seededMessages || []) if (m?.id) map.set(m.id, m);
    return map;
  }

  /** Jobs with their current remainingMs (a seed job waiting on a global has none). */
  exportJobs() {
    const now = this.now();
    return this.state.jobs.map(job => {
      const out = { ...job };
      if (this._due.has(job.jobId)) out.remainingMs = Math.max(0, Math.round(this._due.get(job.jobId) - now));
      return out;
    });
  }

  /**
   * Apply savedMailState on top of the scenario-built state in this.state
   * (init builds it first; 00 §10a "Persistence"):
   *   - a seeded stub becomes the authored message with the stub's read and
   *     gameTime; a stub whose message has gone from the scenario is dropped;
   *   - the player's own messages, jobs, threads, drafts and metrics come from
   *     the save;
   *   - a deliverAt seed with a stub is delivered, one with a saved job is
   *     pending, and one with neither keeps the fresh job init gave it (the
   *     scenario gained it after the save);
   *   - mailboxes and immediate seeds the save lacks are kept, so a configured
   *     mailbox with no messages is there after a reload.
   * Each saved job's remainingMs becomes a deadline from now.
   */
  restore(saved) {
    if (!saved || typeof saved !== 'object') return;
    this.active = true;
    const fresh = this.state;
    const freshDue = new Map(this._due);
    const seeds = this._seedsById();
    const state = emptyState();
    const stubbed = new Set();
    for (const [id, list] of Object.entries(savedMailboxes(saved))) {
      const messages = [];
      for (const m of list) {
        if (!m || typeof m !== 'object' || !m.id) continue;
        if (m.seeded === true) {
          const authored = seeds.get(m.id);
          if (!authored) continue; // gone from the scenario
          stubbed.add(m.id);
          messages.push(this._fromStub(authored, m));
        } else {
          messages.push(pick(m, MAIL_MESSAGE_FIELDS));
        }
      }
      state.mailboxes[id] = { messages, unread: 0 };
    }
    for (const [id, box] of Object.entries(fresh.mailboxes || {})) {
      const target = state.mailboxes[id] || (state.mailboxes[id] = { messages: [], unread: 0 });
      for (const m of box.messages || []) {
        if (!stubbed.has(m.id) && !target.messages.some(x => x.id === m.id)) target.messages.push(m);
      }
    }
    for (const box of Object.values(state.mailboxes)) this._recount(box);

    const threads = {};
    if (saved.threads && typeof saved.threads === 'object' && !Array.isArray(saved.threads)) Object.assign(threads, saved.threads);
    for (const [key, value] of Object.entries(saved)) {
      if (key.startsWith('threads.') && value && typeof value === 'object') threads[key.slice('threads.'.length)] = value;
    }
    state.threads = threads;
    for (const key of ['drafts', 'metrics']) {
      if (saved[key] && typeof saved[key] === 'object' && !Array.isArray(saved[key])) state[key] = saved[key];
    }

    this.state = state;
    this._due.clear();
    const savedSeedJobs = new Set();
    for (const job of Array.isArray(saved.jobs) ? saved.jobs : []) {
      if (!job || !job.jobId || !job.kind) continue;
      const { remainingMs, ...rest } = job;
      this.state.jobs.push(rest);
      if (job.kind === 'seed' && job.messageId) savedSeedJobs.add(job.messageId);
      if (!(job.kind === 'seed' && job.global)) this._due.set(job.jobId, this.now() + Math.max(0, Number(remainingMs) || 0));
    }
    for (const job of fresh.jobs || []) {
      if (job.kind !== 'seed' || stubbed.has(job.messageId) || savedSeedJobs.has(job.messageId)) continue;
      if (this.state.jobs.some(j => j.jobId === job.jobId)) continue;
      this.state.jobs.push(job);
      if (freshDue.has(job.jobId)) this._due.set(job.jobId, freshDue.get(job.jobId));
    }
  }

  /** An authored seeded message rebuilt from its saved stub (read, gameTime). */
  _fromStub(authored, stub) {
    const rec = this.normaliseSeeded(authored);
    if (typeof stub.read === 'boolean') rec.read = stub.read;
    if (Number.isFinite(stub.gameTime)) {
      rec.gameTime = stub.gameTime;
      const clock = typeof window !== 'undefined' ? window.gameClock : null;
      if (!authored.time && clock?.configured && clock.formatClock) rec.time = clock.formatClock(stub.gameTime);
    }
    return rec;
  }

  // --- mailbox helpers (used by the mail client) -------------------------

  /** The mailbox record, created empty if missing. */
  ensureMailbox(id) {
    this.active = true;
    if (!this.state.mailboxes[id]) this.state.mailboxes[id] = { messages: [], unread: 0 };
    return this.state.mailboxes[id];
  }

  /**
   * Append a message record to a mailbox (its `mailbox` field is set). Fields the
   * server does not keep are dropped. Returns the stored record.
   */
  addMessage(mailboxId, record) {
    const box = this.ensureMailbox(mailboxId);
    const message = pick({ ...record, mailbox: mailboxId }, MAIL_MESSAGE_FIELDS);
    if (!message.id) message.id = newId('msg');
    // Stamp a time on any record that carries none (a Sent record from the bridge), so
    // the list row shows one like a reply or seeded mail does (P1-T T10). Replies and
    // seeded mail already set their own time, so this leaves them untouched.
    if (!message.time) {
      const stamp = this._clockStamp();
      message.time = stamp.time;
      if (message.gameTime == null) message.gameTime = stamp.gameTime;
    }
    box.messages.push(message);
    this._recount(box);
    return message;
  }

  /** Find a message by id in any mailbox. */
  findMessage(id) {
    for (const box of Object.values(this.state.mailboxes)) {
      const m = box.messages.find(x => x.id === id);
      if (m) return m;
    }
    return null;
  }

  markRead(mailboxId, messageId, read = true) {
    const box = this.state.mailboxes[mailboxId];
    const m = box?.messages.find(x => x.id === messageId);
    if (!m || m.read === read) return false;
    m.read = read;
    this._recount(box);
    return true;
  }

  /** One draft per account; null clears it. */
  setDraft(accountId, draft) {
    this.active = true;
    if (draft === null || draft === undefined) delete this.state.drafts[accountId];
    else this.state.drafts[accountId] = draft;
  }

  /** A thread's saved story position, choices and expects, keyed "<character>:<accountId>". */
  setThread(key, thread) {
    this.active = true;
    if (thread === null || thread === undefined) delete this.state.threads[key];
    else this.state.threads[key] = thread;
  }

  _recount(box) {
    // Agree with mail-data.recountUnread: anything not strictly read counts as unread, so a
    // restored message that lost its read flag is counted the same way in both (only strict
    // read === true is read).
    box.unread = box.messages.filter(m => m.folder !== 'sent' && m.read !== true).length;
  }

  /**
   * Drop messages the server trimmed to fit the 1 MB cap (00 §10a, P1-D).
   * state-sync calls this with the keys the server reported so the live state
   * matches what was saved.
   *
   * A key is either a [boxId, msgId] pair (unambiguous) or the server's dotted
   * string mailboxes.<box>.<msgId>. The validator forbids a dot in a mailbox id
   * (validate_social mail dotted_ids), so the dotted form is safe, but rather
   * than trust a first-dot split we resolve [box, msgId] against the live state:
   * each split point is tried and the first that names a box holding that message
   * is the one dropped. A dot in the box id therefore no longer misroutes the
   * drop (IMPL_REVIEW_MECHANICS minor 3).
   * @param {Array<string|[string,string]>} keys
   */
  dropMessages(keys) {
    if (!Array.isArray(keys)) return;
    for (const key of keys) {
      if (Array.isArray(key) && typeof key[0] === 'string' && typeof key[1] === 'string') {
        this._dropMessage(key[0], key[1]);
        continue;
      }
      if (typeof key !== 'string' || !key.startsWith('mailboxes.')) continue;
      const rest = key.slice('mailboxes.'.length);
      for (let dot = rest.indexOf('.'); dot >= 0; dot = rest.indexOf('.', dot + 1)) {
        if (this._dropMessage(rest.slice(0, dot), rest.slice(dot + 1))) break;
      }
    }
  }

  /** Remove one message by [boxId, msgId] from the live state. Returns true if it was there. */
  _dropMessage(boxId, msgId) {
    const box = this.state.mailboxes[boxId];
    if (!box || !Array.isArray(box.messages)) return false;
    const i = box.messages.findIndex(m => m && m.id === msgId);
    if (i < 0) return false;
    box.messages.splice(i, 1);
    this._recount(box);
    return true;
  }

  // --- jobs --------------------------------------------------------------

  /** Reply delay in ms for a target or character: emailReplyDelay seconds, default 20. */
  replyDelayMs({ targetId = null, character = null } = {}) {
    const social = this.scenario?.social || {};
    const fromChar = character ? social.characters?.[character]?.emailReplyDelay : undefined;
    const targets = Array.isArray(social.phishTargets) ? social.phishTargets : Object.values(social.phishTargets || {});
    const fromTarget = targetId ? targets.find(t => t?.id === targetId)?.emailReplyDelay : undefined;
    const seconds = [fromChar, fromTarget].find(v => Number.isFinite(v) && v >= 0);
    return (seconds ?? DEFAULT_REPLY_DELAY_SECONDS) * 1000;
  }

  /**
   * Queue a job. `delayMs` sets the countdown (omit it for a seed job that
   * waits on `global`). Returns the stored job.
   */
  addJob(job, delayMs = 0) {
    this.active = true;
    const { remainingMs, ...rest } = job;
    const stored = { jobId: job.jobId || newId('job'), ...rest };
    this.state.jobs.push(stored);
    if (!(stored.kind === 'seed' && stored.global)) {
      const ms = Number.isFinite(remainingMs) ? remainingMs : delayMs;
      this._due.set(stored.jobId, this.now() + Math.max(0, ms || 0));
    }
    return stored;
  }

  /**
   * A data-only target's reply (00 §10). `outcomeGlobal` is kept only when the
   * message landed, so the outcome is never set by a failed send. text "" with
   * outcomeGlobal null is the silent job of withReply mode.
   */
  scheduleTextJob({ targetId, accountId, msgId, text = '', outcomeGlobal = null, landed = false, delayMs }) {
    const delay = Number.isFinite(delayMs) ? delayMs : this.replyDelayMs({ targetId });
    return this.addJob({
      kind: 'text', targetId, accountId, msgId,
      text: typeof text === 'string' ? text : '',
      outcomeGlobal: landed && outcomeGlobal ? outcomeGlobal : null
    }, delay);
  }

  /** Delivery handler for a job kind: fn(job) -> false to retry next tick. */
  registerKind(kind, fn) {
    this._handlers.set(kind, fn);
  }

  /** Listen for 'mail_delivered' { mailbox, message, job } and 'mail_job_done' { job }. */
  onEvent(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data); } catch (e) { console.error('[MailScheduler] listener failed', e); }
    }
    if (typeof window !== 'undefined') window.eventDispatcher?.emit?.(event, data);
  }

  /** Is a job due? Countdown jobs by deadline; global-gated seed jobs by the global. */
  _isDue(job, now) {
    if (job.kind === 'seed' && job.global) return !!(typeof window !== 'undefined' && window.gameState?.globalVariables?.[job.global]);
    const due = this._due.get(job.jobId);
    return due !== undefined && now >= due;
  }

  /**
   * Deliver every job that is due. Called each second from the NPC manager's
   * loop. A delivery appends its message and removes its job in the same
   * synchronous step, so a sync never sees one without the other.
   * @returns {number} jobs completed
   */
  tick(now = this.now()) {
    if (!this.active || this.state.jobs.length === 0) return 0;
    let done = 0;
    for (const job of [...this.state.jobs]) {
      if (!this._isDue(job, now)) continue;
      const handler = this._handlers.get(job.kind);
      if (!handler) continue; // e.g. an ink job before the runner is registered
      let result;
      try { result = handler(job); } catch (e) {
        console.error(`[MailScheduler] job ${job.jobId} failed`, e);
        continue; // kept, retried next tick
      }
      if (result === false) continue;
      this._removeJob(job.jobId);
      done++;
      this._emit('mail_job_done', { job });
    }
    return done;
  }

  _removeJob(jobId) {
    this.state.jobs = this.state.jobs.filter(j => j.jobId !== jobId);
    this._due.delete(jobId);
  }

  /** Who a data-only target's reply comes from: its contact, else its target address. */
  _senderFor(targetId) {
    const mc = this.mailClientConfig || {};
    const contact = (mc.contacts || []).find(c => c?.targetId === targetId);
    const social = this.scenario?.social || {};
    const targets = Array.isArray(social.phishTargets) ? social.phishTargets : Object.values(social.phishTargets || {});
    const target = targets.find(t => t?.id === targetId);
    const address = target?.address || contact?.addresses?.[0] || '';
    return { name: contact?.name || target?.name || address || targetId, address };
  }

  _accountAddress(accountId) {
    const account = (this.mailClientConfig?.accounts || []).find(a => a?.id === accountId);
    if (!account) return '';
    // A created account's address is the chosen createMenu entry, not the static
    // record (A10: a data-only reply to a player-made account had an empty To).
    if (account.kind === 'created') {
      const globals = (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
      const choice = (account.createMenu || []).find(m => m && m.id === globals?.[`acct_${account.id}_choice`]);
      if (choice?.address) return choice.address;
    }
    return account.address || '';
  }

  /**
   * A scenario time ("HH:MM") for a scenario that does not run the game clock (the awareness
   * kiosk episodes, the SOC labs): the authored mailClient.clock, else the latest authored
   * seeded-message time, so a sent mail or a reply reads in scene time instead of the real wall
   * clock sitting beside the scenario's own 09:xx stamps (awareness E5-8/N9, m7). Null when the
   * scenario authors neither, in which case the wall clock stays as the last resort.
   */
  _scenarioClockTime() {
    const cfg = this.mailClientConfig;
    const asKey = (t) => {
      const m = typeof t === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(t.trim()) : null;
      if (!m) return null;
      const h = Number(m[1]); const min = Number(m[2]);
      return (h >= 0 && h < 24 && min >= 0 && min < 60) ? h * 60 + min : null;
    };
    if (cfg && typeof cfg.clock === 'string' && asKey(cfg.clock) != null) return cfg.clock;
    const seeds = Array.isArray(cfg?.seededMessages) ? cfg.seededMessages : [];
    let best = null; let bestKey = -1;
    for (const s of seeds) {
      const k = asKey(s && s.time);
      if (k != null && k >= bestKey) { bestKey = k; best = s.time; }
    }
    return best;
  }

  _clockStamp() {
    const clock = typeof window !== 'undefined' ? window.gameClock : null;
    const gameTime = clock?.elapsedMs ? clock.elapsedMs() : 0;
    let time;
    if (clock?.configured && clock.formatClock) time = clock.formatClock(gameTime);
    else {
      const scene = this._scenarioClockTime();
      if (scene) time = scene;
      else { const d = new Date(this.now()); time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
    }
    return { time, gameTime };
  }

  _deliverText(job) {
    if (job.text) {
      const sent = job.msgId ? this.findMessage(job.msgId) : null;
      const subject = sent?.subject ? (/^re:/i.test(sent.subject) ? sent.subject : `Re: ${sent.subject}`) : '';
      const message = this.addMessage(job.accountId, {
        id: newId('msg'),
        thread: `${job.targetId}:${job.accountId}`,
        folder: 'inbox',
        from: this._senderFor(job.targetId),
        to: this._accountAddress(job.accountId),
        targetId: null,
        subject,
        body: job.text,
        attachment: null,
        link: null,
        landed: null,
        tells: [],
        ...this._clockStamp(),
        read: false
      });
      this._removeJob(job.jobId); // message and job removal in one step
      this._emit('mail_delivered', { mailbox: job.accountId, message, job });
    }
    if (job.outcomeGlobal) this.writeGlobal(job.outcomeGlobal, true);
    return true;
  }

  _deliverSeed(job) {
    const authored = (this.mailClientConfig?.seededMessages || []).find(m => m?.id === job.messageId);
    if (!authored) return true; // gone from the scenario: drop the job
    const mailbox = job.mailbox || authored.mailbox;
    // A partial save can keep both the delivered message (as a stub) and its seed job. If the
    // message is already in the mailbox, drop the job without delivering a second copy.
    const existing = this.state.mailboxes[mailbox];
    if (existing && Array.isArray(existing.messages) && existing.messages.some(m => m && m.id === job.messageId)) {
      this._removeJob(job.jobId);
      return true;
    }
    const message = this.addMessage(mailbox, this.normaliseSeeded(authored));
    this._removeJob(job.jobId);
    this._emit('mail_delivered', { mailbox: message.mailbox, message, job });
    return true;
  }

  /** An authored seeded message as a stored record (00 §10a): read = !unread, seeded: true. */
  normaliseSeeded(authored) {
    const { unread, deliverAt, ...rest } = authored;
    const stamp = this._clockStamp();
    return pick({
      folder: 'inbox', tells: [], landed: null, targetId: null,
      ...rest,
      time: authored.time || stamp.time,
      gameTime: stamp.gameTime,
      read: !unread,
      seeded: true
    }, MAIL_MESSAGE_FIELDS);
  }

  _loadSeeded(config) {
    for (const m of config?.seededMessages || []) {
      if (!m?.id || !m.mailbox) continue;
      this.ensureMailbox(m.mailbox);
      const at = m.deliverAt;
      if (at && (Number.isFinite(at.afterSeconds) || at.global)) {
        this.addJob({ jobId: `seed_${m.id}`, kind: 'seed', messageId: m.id, mailbox: m.mailbox, ...(at.global ? { global: at.global } : {}) },
          Number.isFinite(at.afterSeconds) ? at.afterSeconds * 1000 : 0);
      } else {
        this.addMessage(m.mailbox, this.normaliseSeeded(m));
      }
    }
    for (const box of config?.mailboxes || []) if (box?.id) this.ensureMailbox(box.id);
  }
}

export const mailScheduler = new MailScheduler();
if (typeof window !== 'undefined') {
  window.mailScheduler = mailScheduler;
  // The mail client (mail-client-minigame.js) reads the live mailState from
  // window.mailState; it is always the scheduler's object. Assigning one adopts
  // it as the live state (in place, so the client's edits are what is synced).
  Object.defineProperty(window, 'mailState', {
    configurable: true,
    get: () => mailScheduler.state,
    set: value => {
      if (!value || typeof value !== 'object') return;
      for (const key of ['mailboxes', 'threads', 'drafts', 'metrics']) if (!value[key] || typeof value[key] !== 'object') value[key] = {};
      if (!Array.isArray(value.jobs)) value.jobs = [];
      mailScheduler.state = value;
      mailScheduler.active = true;
    }
  });
}
export default mailScheduler;
