/**
 * Mail runner and ink jobs (SE design 00 §10 "The mail runner", S6, S7; 04 N6).
 * Packet P1-J.
 *
 * A character target's email reply is written by that character's email-channel
 * ink story, run HEADLESSLY once the scheduler's countdown (the ink job) elapses.
 * This module is that run, plus the `ink` delivery handler it registers on the
 * mail scheduler (mail-scheduler.js `registerKind`), plus the pure helpers the
 * send path needs to turn an EvalResult into the job.
 *
 * ── How it is wired (the contract with the mail bridge, P1-M/P1-F) ──────────
 * The composer/bridge judges a send and, for a target with a `character`, calls
 *
 *     scheduleInkReply(scheduler, { target, message, result, account, scenario })
 *
 * which builds the run-scoped email_* snapshot (`emailVarsFromResult`, 04 N6),
 * resolves the entry knot (emailKnots, §10a) and queues an `ink` job. The runner
 * is installed on the scheduler the first time a reply is scheduled, and also on
 * import when window.mailScheduler already exists, so a job restored from a save
 * after a reload still has a handler (a startup `import` of this module from
 * core/game.js guarantees that case; see the note at the foot of the file).
 *
 * ── The run (00 §10 step list, modelled on phone-chat-conversation.js
 *    _preloadOpeningOnce) ─────────────────────────────────────────────────────
 *  1. A private InkEngine per delivery (never getInkEngine: that returns the bark
 *     engine and needs a loaded room NPC). Story JSON from npcManager.storyCache
 *     or the ink endpoint.
 *  2. applySavedInkVariables (the record id's saved scalars); then, for a
 *     continuation or chaser that has a stored thread position, LoadJson it.
 *  3. syncGlobalVariablesToStory, then observeGlobalVariableChanges.
 *  4. The whole email_* set through applyEngineVariables({ values }) (P0-H): the
 *     bridge built it from the EvalResult, and setting the whole set each run
 *     overwrites any email_* left in memory by a saved state.
 *  5. Bind se_influence to THIS engine before the first Continue (00 §8; P0-F:
 *     the influence watcher cannot clamp back into a story it does not know, so
 *     the runner passes its private engine through the influence ctx). A fresh
 *     idempotency ledger per run, runId = the sent message id (S6).
 *  6. goToKnot(on_email) (or the continuation's ChooseChoiceIndex), continue to
 *     choices or the end, collecting lines and tags.
 *  7. Deliver the lines as one reply into the sending account's mailbox, then
 *     apply the game tags ui-less through processGameActionTags (window.
 *     NPCGameBridge must exist; give_item reads the record's itemsHeld, so the
 *     record must be loaded, S8, and window.currentConversationNPCId is set to
 *     the record id for the call). mail_later and compose_reply are mail-only
 *     tags handled here, not by the tag processor.
 *  8. Store the thread position and any reply choices / compose expectation,
 *     recordInkVariables (which drops email_* and so resets the run), end the run.
 *
 * Idempotency across a reload (T2-1): a delivery writes to two sync sections that
 * can persist independently — the reply into mailState, the influence and the game
 * tags' set_global effects into globalVariables. So each side keys on its own
 * section: the reply on its deterministic id (`reply_<jobId>`, held in mailState),
 * and the influence/tag side on `se_mail_applied` (a per-jobId marker in
 * globalVariables, beside the influence). A re-run re-delivers only a reply that
 * vanished (mailState dropped, globalVariables kept) and re-applies influence only
 * when it vanished (the reverse), so neither can be committed twice. An unopened
 * run produces no reply and no influence and is safe to re-run.
 *
 * This file touches `window` only through injectable dependencies (so the whole
 * run is unit-testable without a DOM) and never imports the mail bridge: the
 * dependency runs one way, bridge → runner.
 */

import InkEngineDefault from './ink/ink-engine.js';
import {
    splitPlainRun, splitMailTags, plainThreadKey, parsePlainThreadKey, queuePlainEmail,
    contactForNpc, contactAddress, replyDelaySeconds, newPlainJobId, replyTagsOfFirstLine
} from './mail-ink.js';

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const domainOf = (address) => (isStr(address) && address.includes('@') ? address.slice(address.indexOf('@') + 1) : '');

// T2-1 reload idempotency for the influence (and game-tag) side of a delivery.
// Influence, the game tags' set_global effects and this marker all live in
// gameState.globalVariables, so they share one sync fate: a save (or the pagehide
// keepalive) keeps them together or drops them together. The reply lives in
// mailState, a separate sync section the server can refuse over its cap
// (games_controller) or the keepalive can drop whole (state-sync.js), while
// globalVariables is kept. Keying the influence commit on this co-located marker
// (not on the reply, which can vanish on its own) stops a re-run doubling the
// influence. Only a job still pending in the scheduler can re-run, so dropping the
// oldest ids once their jobs are gone is safe.
const APPLIED_GLOBAL = 'se_mail_applied';
const APPLIED_CAP = 200;

// ───────────────────────────────────────────────── pure helpers (send path)

/**
 * The run-scoped email_* snapshot for one send (00 §10 "Variables the engine
 * writes before on_email"; 04 N6). The whole fixed-name set is always present
 * (defaults filled), plus email_slot_<id> and email_template_<part> for what the
 * message chose. applyEngineVariables only writes the VARs a story declares, so
 * the extra names are harmless to a story that does not read them.
 *
 * @param {Object} target   the phishTargets entry
 * @param {Object} message  the built message (slots, templates, to, fromAccount)
 * @param {Object} result   the EvalResult from phish-rules.evaluateMessage
 * @param {Object} [opts]    { account, inReplyTo }
 * @returns {Object} email_* values
 */
export function emailVarsFromResult(target, message, result, { account = null, inReplyTo = '' } = {}) {
    const msg = isObject(message) ? message : {};
    const res = isObject(result) ? result : {};
    const open = isObject(res.open) ? res.open : {};
    const advisory = isObject(res.advisory) ? res.advisory : {};
    const slots = isObject(msg.slots) ? msg.slots : {};
    const templates = isObject(msg.templates) ? msg.templates : {};
    const factorPass = (id) => {
        const f = arr(res.factors).find((x) => x && x.id === id);
        return f ? f.pass === true : false;
    };

    const vars = {
        email_msg_id: isStr(msg.id) ? msg.id : (isStr(res.msgId) ? res.msgId : ''),
        email_landed: res.landed === true,
        email_fail_count: Number.isFinite(res.failCount) ? res.failCount : 0,
        email_first_fail: isStr(res.firstFail) ? res.firstFail : '',
        email_ok_senderTrust: factorPass('senderTrust'),
        email_ok_addressedTo: factorPass('addressedTo'),
        email_ok_pretextRelevant: factorPass('pretextRelevant'),
        email_attachment: isStr(res.attachment) ? res.attachment : 'none',
        email_link: isStr(res.link) ? res.link : 'none',
        email_claimed_sender: isStr(res.claimedSender) ? res.claimedSender : '',
        email_urgency: isStr(advisory.urgency) ? advisory.urgency : 'low',
        email_auth: isStr(advisory.senderAuth) ? advisory.senderAuth : 'would-pass',
        email_account: account && isStr(account.id) ? account.id : (isStr(msg.fromAccount) ? msg.fromAccount : ''),
        email_account_kind: account && isStr(account.kind) ? account.kind : 'given',
        email_account_domain: account ? domainOf(account.address) : '',
        email_to: isStr(msg.to) ? msg.to : '',
        email_opened: open.opened !== false,
        email_open_via: isStr(open.via) ? open.via : 'none',
        email_subject_topic: isStr(open.subjectTopic) ? open.subjectTopic : '',
        email_in_reply_to: isStr(inReplyTo) ? inReplyTo : ''
    };

    const pairs = [];
    for (const [slotId, valueId] of Object.entries(slots)) {
        if (!isStr(slotId)) continue;
        const value = isStr(valueId) ? valueId : (valueId == null ? '' : String(valueId));
        vars[`email_slot_${slotId}`] = value;
        pairs.push(`${slotId}=${value}`);
    }
    vars.email_slots = pairs.join(',');
    for (const [part, templateId] of Object.entries(templates)) {
        if (isStr(part)) vars[`email_template_${part}`] = isStr(templateId) ? templateId : '';
    }
    return vars;
}

/** The entry knot for a character's account: emailKnots[accountId], else on_email (00 §10a). */
export function resolveEmailKnot(scenario, character, accountId) {
    const ek = scenario?.social?.characters?.[character]?.emailKnots;
    if (isObject(ek) && isStr(accountId) && isStr(ek[accountId])) return ek[accountId];
    return 'on_email';
}

/**
 * An ink job record for the scheduler (00 §10 "Timing and delivery"). jobId is
 * assigned by the scheduler. `thread` lets a chaser dedupe per thread.
 */
export function buildInkJob({ target, character, npcId, accountId, msgId, vars, knot = 'on_email', choice = null, inReplyTo = '' }) {
    const job = {
        kind: 'ink',
        character: isStr(character) ? character : (target && target.character) || null,
        npcId,
        accountId,
        msgId,
        knot: isStr(knot) ? knot : 'on_email',
        vars: isObject(vars) ? vars : {},
        thread: `${isStr(character) ? character : ((target && target.character) || npcId)}:${accountId}`
    };
    if (choice !== null && choice !== undefined) job.choice = choice;
    if (isStr(inReplyTo)) job.inReplyTo = inReplyTo;
    return job;
}

// ───────────────────────────────────────────────── the runner

export class MailRunner {
    /**
     * @param {Object} deps
     * @param {Object}   deps.scheduler     the MailScheduler (required at run time)
     * @param {Function} [deps.getNpc]      id -> record (default npcManager.getNPC)
     * @param {Function} [deps.storyFor]    async (record, npcId) -> story JSON
     * @param {Object}   [deps.stateManager] npcConversationStateManager
     * @param {Object}   [deps.influence]   the social influence service
     * @param {Function} [deps.InkEngine]   the InkEngine class
     * @param {Function} [deps.processTags] async (tags, options) -> any (ui-less)
     * @param {Function} [deps.encounter]   npcId -> void (first-delivery encounter)
     * @param {Function} [deps.emit]        (event, data) -> void (mail_delivered bus)
     * @param {number|Function} [deps.gameId]
     */
    constructor(deps = {}) {
        this.scheduler = deps.scheduler || (typeof window !== 'undefined' ? window.mailScheduler : null);
        this._getNpc = deps.getNpc || ((id) => (typeof window !== 'undefined' ? window.npcManager?.getNPC?.(id) : null) || null);
        this._storyFor = deps.storyFor || ((record, npcId) => this._defaultStoryFor(record, npcId));
        this._stateManager = deps.stateManager || null;
        this._influence = deps.influence || null;
        this.InkEngine = deps.InkEngine || InkEngineDefault;
        this._processTags = deps.processTags || ((tags, options) => this._defaultProcessTags(tags, options));
        this._encounterHook = deps.encounter || ((id) => MailRunner._defaultEncounter(id));
        this._emitHook = deps.emit || null;
        this._gameId = deps.gameId ?? null;

        this._states = new Map();      // jobId -> 'running' | 'done' | 'retry'
        this._encountered = new Set(); // record ids marked encountered this session
    }

    get stateManager() {
        return this._stateManager || (typeof window !== 'undefined' ? window.npcConversationStateManager : null) || null;
    }

    get influence() {
        return this._influence || (typeof window !== 'undefined' ? window.socialInfluence : null) || null;
    }

    _globals() {
        return (typeof window !== 'undefined') ? (window.gameState?.globalVariables || null) : null;
    }

    /** Has this job's influence (and game tags) already been committed to globalVariables? (T2-1) */
    _alreadyApplied(jobId) {
        const g = this._globals();
        if (!g || !isStr(jobId)) return false;
        const raw = g[APPLIED_GLOBAL];
        return typeof raw === 'string' && raw.split(',').includes(jobId);
    }

    /** Record that this job's influence side is committed, in the same section as the influence (T2-1). */
    _markApplied(jobId) {
        const g = this._globals();
        if (!g || !isStr(jobId)) return;
        const raw = typeof g[APPLIED_GLOBAL] === 'string' ? g[APPLIED_GLOBAL] : '';
        const ids = raw ? raw.split(',').filter(Boolean) : [];
        if (ids.includes(jobId)) return;
        ids.push(jobId);
        if (ids.length > APPLIED_CAP) ids.splice(0, ids.length - APPLIED_CAP);
        g[APPLIED_GLOBAL] = ids.join(',');
    }

    /**
     * Bind se_influence to an inert function for a recovery re-run whose influence
     * was already applied: the story still runs (to regenerate a lost reply) but
     * cannot move influence a second time. It returns the character's current band,
     * as the real external does, so a story that reads the return still branches.
     */
    _bindInertInfluence(engine, job) {
        const influence = this.influence;
        const fn = () => (influence?.getBand ? (influence.getBand(job.character) ?? 0) : 0);
        if (typeof engine?.bindExternalFunction === 'function') engine.bindExternalFunction('se_influence', fn);
        else engine?.BindExternalFunction?.('se_influence', fn);
    }

    /**
     * The scheduler handler for the `ink` kind. Synchronous, because the
     * scheduler tick is: it starts the async run and reports "not ready" (false)
     * until the run has finished, then "done" (true) so the scheduler removes the
     * job and emits mail_job_done. A run that cannot proceed yet (the record is
     * not registered, the story has not loaded) retries on the next tick, the
     * scheduler's own "NPC not registered, retry next tick" convention.
     */
    handle(job) {
        const state = this._states.get(job.jobId);
        if (state === 'done') { this._states.delete(job.jobId); return true; }
        if (state === 'running') return false;
        // undefined (first due tick) or 'retry' (a previous attempt could not proceed): (re)start
        this._states.set(job.jobId, 'running');
        Promise.resolve()
            .then(() => this._run(job))
            .then((outcome) => { this._states.set(job.jobId, outcome && outcome.retry ? 'retry' : 'done'); })
            .catch((e) => { console.error(`[MailRunner] ink job ${job.jobId} failed`, e); this._states.set(job.jobId, 'retry'); });
        return false;
    }

    _threadKey(job) {
        if (isStr(job.thread)) return job.thread;
        if (job.plain === true) return plainThreadKey(job.npcId, job.accountId);
        return `${isStr(job.character) ? job.character : job.npcId}:${job.accountId}`;
    }

    _emit(event, data) {
        if (typeof this._emitHook === 'function') { this._emitHook(event, data); return; }
        const s = this.scheduler;
        if (s && typeof s._emit === 'function') { s._emit(event, data); return; }
        if (typeof window !== 'undefined') window.eventDispatcher?.emit?.(event, data);
    }

    _encounter(npcId) {
        if (!isStr(npcId) || this._encountered.has(npcId)) return;
        this._encountered.add(npcId);
        try { this._encounterHook(npcId); } catch (e) { console.warn('[MailRunner] encounter hook failed', e); }
    }

    async _defaultStoryFor(record, npcId) {
        const nm = (typeof window !== 'undefined') ? window.npcManager : null;
        const path = record && record.storyPath;
        let json = path && nm?.storyCache?.get?.(path);
        if (json) return json;
        if (record && record.storyJSON) return record.storyJSON;
        const gameId = (typeof this._gameId === 'function' ? this._gameId() : this._gameId) ??
            (typeof window !== 'undefined' ? window.breakEscapeConfig?.gameId : null);
        if (!gameId || typeof fetch === 'undefined') return null;
        const resp = await fetch(`/break_escape/games/${gameId}/ink?npc=${encodeURIComponent(npcId)}`);
        if (!resp.ok) return null;
        json = await resp.json();
        if (path && nm?.storyCache?.set) nm.storyCache.set(path, json);
        return json;
    }

    async _defaultProcessTags(tags, options) {
        if (typeof window !== 'undefined' && !window.NPCGameBridge) {
            // P0-G: processGameActionTags returns early with no bridge. It self-installs on import.
            try { await import('./npc-game-bridge.js'); } catch (e) { /* non-browser test */ }
        }
        const mod = await import('../minigames/helpers/chat-helpers.js');
        return mod.processGameActionTags(tags, null, options); // ui null = ui-less (00 §10 step 6)
    }

    static _defaultEncounter(npcId) {
        // Client-side mirror only. The server now auto-encounters a headless email
        // record on the give path (games_controller `headless_email_record?` +
        // `encounter_npc!`), so a reply's `#give_item` passes the server-side
        // `encounteredNPCs` gate; this keeps window.gameState.encounteredNPCs in step.
        if (typeof window === 'undefined') return;
        const state = window.gameState;
        if (state) {
            if (!Array.isArray(state.encounteredNPCs)) state.encounteredNPCs = [];
            if (!state.encounteredNPCs.includes(npcId)) state.encounteredNPCs.push(npcId);
        }
    }

    _senderFor(job, sentMessage) {
        const record = this._getNpc(job.npcId);
        const name = (record && (record.displayName || record.name)) || job.character || job.npcId;
        // The reply comes from the address the player wrote to.
        const address = (sentMessage && isStr(sentMessage.to)) ? sentMessage.to : '';
        return { name, address };
    }

    /** Split the raw tags into the mail-only tags handled here and the game tags for the processor. */
    _splitTags(tags) {
        let mailLater = null;
        let composeReplyTarget = null;
        let subject = null;
        const gameTags = [];
        for (const raw of arr(tags)) {
            const tag = String(raw).trim();
            if (!tag) continue;
            const colon = tag.indexOf(':');
            const action = (colon === -1 ? tag : tag.slice(0, colon)).trim().toLowerCase();
            const param = colon === -1 ? '' : tag.slice(colon + 1).trim();
            if (action === 'mail_later') {
                // seconds:knot
                const sep = param.indexOf(':');
                const seconds = Number(sep === -1 ? param : param.slice(0, sep));
                const knot = sep === -1 ? '' : param.slice(sep + 1).trim();
                if (!mailLater && isStr(knot)) mailLater = { seconds: Number.isFinite(seconds) ? seconds : 0, knot };
                continue;
            }
            if (action === 'compose_reply') { if (isStr(param)) composeReplyTarget = param; continue; }
            if (action === 'subject') { if (isStr(param)) subject = param; continue; }
            gameTags.push(raw);
        }
        return { mailLater, composeReplyTarget, subject, gameTags };
    }

    /**
     * Run one ink job to its reply. Returns { retry: true } to be tried again next
     * tick, or {} when the run completed (including an unopened run that delivers
     * nothing).
     */
    async _run(job) {
        if (job.plain === true) return this._runPlain(job);
        const scheduler = this.scheduler;
        if (!scheduler) return { retry: true };
        const replyId = `reply_${job.jobId}`;
        // The two sync sections idempotency keys on (T2-1): the reply lives in
        // mailState, the influence/game-tag commit in globalVariables. A reload can
        // persist one without the other, so each side is guarded on its own section.
        const alreadyDelivered = typeof scheduler.findMessage === 'function' && !!scheduler.findMessage(replyId);
        const alreadyApplied = this._alreadyApplied(job.jobId);
        // Both committed (a normal reload re-ran a settled job): nothing to do.
        if (alreadyDelivered && alreadyApplied) return {};
        // Otherwise one section dropped on its own: re-run to recover the missing
        // side, but gate each side so neither is committed twice.

        const record = this._getNpc(job.npcId);
        if (!record) return { retry: true }; // headless record not registered yet (S8)
        this._encounter(job.npcId);

        const storyJson = await this._storyFor(record, job.npcId);
        if (!storyJson) return { retry: true };

        const engine = new this.InkEngine(job.npcId);
        engine.loadStory(storyJson);
        const story = engine.story;
        const sm = this.stateManager;
        const key = this._threadKey(job);

        // 2. restore the record's saved scalars, then a stored position for a continuation / chaser
        sm?.applySavedInkVariables?.(job.npcId, story);
        const thread = scheduler.state?.threads?.[key] || null;
        const isContinuation = job.choice !== null && job.choice !== undefined;
        if ((isContinuation || job.loadPosition) && thread && isStr(thread.position)) {
            try { story.state.LoadJson(thread.position); } catch (e) { console.warn('[MailRunner] could not load thread position', e.message); }
        }

        // 3. globals
        sm?.syncGlobalVariablesToStory?.(story);
        sm?.observeGlobalVariableChanges?.(story, job.npcId);

        // 4. the whole email_* set (P0-H), after restore and sync (S7)
        sm?.applyEngineVariables?.(job.npcId, story, { channel: 'email', values: isObject(job.vars) ? job.vars : {} });

        // 5. bind se_influence to THIS engine before the first Continue (00 §8, P0-F)
        const influence = this.influence;
        const runId = job.msgId;
        let undoTrack = null;
        if (influence && isStr(job.character)) {
            influence.beginRun?.(runId);
            if (alreadyApplied) this._bindInertInfluence(engine, job); // recovery re-run: do not move influence again (T2-1)
            else influence.bindInfluenceExternals?.(engine, { npcId: job.npcId, characterId: job.character, channel: 'email', runId });
            undoTrack = influence.trackTurns?.(engine, runId) || null;
        }

        // 6. navigate and continue
        if (isContinuation) {
            try { story.ChooseChoiceIndex(job.choice); } catch (e) { console.warn('[MailRunner] could not choose', e.message); }
        } else {
            engine.goToKnot(job.knot || 'on_email');
        }
        const lines = [];
        const tags = [];
        for (let guard = 0; guard < 500; guard++) {
            const r = engine.continue();
            if (r.text && r.text.trim()) lines.push(r.text.trim());
            if (r.tags && r.tags.length) tags.push(...r.tags);
            if (r.hasEnded || (r.choices && r.choices.length > 0) || !r.canContinue) break;
        }
        const endChoices = engine.currentChoices || [];

        let position = null;
        try { position = story.state.ToJson(); } catch (e) { /* leave null */ }

        const { mailLater, composeReplyTarget, subject, gameTags } = this._splitTags(tags);

        // 7a. deliver the reply (a run that produced no text delivers nothing, 00 §10 step 7).
        // Skip when the reply is already in the box, so a recovery re-run never duplicates it.
        let message = null;
        if (lines.length > 0 && !alreadyDelivered) {
            const sent = job.msgId && typeof scheduler.findMessage === 'function' ? scheduler.findMessage(job.msgId) : null;
            let subjectText = isStr(subject) ? subject : '';
            if (!subjectText) {
                subjectText = sent && isStr(sent.subject) ? (/^re:/i.test(sent.subject) ? sent.subject : `Re: ${sent.subject}`) : '';
            }
            message = scheduler.addMessage(job.accountId, {
                id: replyId,
                thread: key,
                folder: 'inbox',
                from: this._senderFor(job, sent),
                to: this._accountAddress(job.accountId),
                targetId: null,
                subject: subjectText,
                body: lines.join('\n\n'),
                attachment: null,
                link: null,
                landed: null,
                tells: [],
                read: false
            });
            this._emit('mail_delivered', { mailbox: job.accountId, message, job });
        }

        // 7b. game tags, ui-less, with the record as the conversation NPC (give_item).
        // Their set_global effects live in globalVariables beside the influence, so
        // gate them on the same marker: a recovery re-run that already applied them
        // (globalVariables kept) does not fire them again (T2-1).
        if (gameTags.length > 0 && !alreadyApplied) await this._applyGameTags(gameTags, job, engine);

        // 8. thread position and the next-step expectation (00 §10 "Replies, reply choices and chasers")
        this._storeThread(scheduler, key, position, endChoices, composeReplyTarget);
        if (mailLater && !alreadyApplied) this._scheduleChaser(scheduler, job, key, mailLater);

        // Mark the influence/game-tag side committed, co-located with the influence,
        // once this run has done it (T2-1). A fresh run always reaches here.
        if (!alreadyApplied) this._markApplied(job.jobId);

        sm?.recordInkVariables?.(job.npcId, story); // drops email_*: resets the run (S7)
        if (influence && isStr(job.character)) { if (undoTrack) undoTrack(); influence.endRun?.(runId); }

        return { delivered: !!message };
    }

    // ───────────────────────────────────────── ink-driven plain email
    //
    // A plain thread is `npc:<npcId>:<accountId>`. Its stored position is the story state just
    // BEFORE the step that produced the pending choices (or, while a send waits for its reply,
    // just before the reply's first line). Resuming a position therefore regenerates the
    // choices from the current globals, so a suggested reply gated on `{found_log}` appears the
    // moment the global is set, not only when the NPC's email arrived.

    get _scenario() {
        return (typeof window !== 'undefined' ? window.gameScenario : null) || null;
    }

    get _mailConfig() {
        return this._scenario?.social?.mailClient || {};
    }

    /** A private engine on the correspondent's story with its saved scalars applied. */
    async _openPlain(npcId) {
        const record = this._getNpc(npcId);
        if (!record) return null;
        this._encounter(npcId);
        const storyJson = await this._storyFor(record, npcId);
        if (!storyJson) return null;
        const engine = new this.InkEngine(npcId);
        engine.loadStory(storyJson);
        const story = engine.story;
        const sm = this.stateManager;
        sm?.applySavedInkVariables?.(npcId, story);
        return { engine, story, record, sm };
    }

    /** Continue one step at a time to the next choices or the end; each step keeps the state before it. */
    _stepToChoices(story, { limit = 300 } = {}) {
        const steps = [];
        for (let guard = 0; guard < limit && story.canContinue; guard++) {
            let pre = null;
            try { pre = story.state.ToJson(); } catch (e) { /* leave null */ }
            const text = story.Continue();
            steps.push({ text: typeof text === 'string' ? text : '', tags: arr(story.currentTags).map(String), pre });
        }
        return steps;
    }

    _plainOptions(story) {
        return arr(story.currentChoices).map((c) => c.text);
    }

    /** Re-run a stored position up to its choices (no side effects: no observers, nothing written). */
    _resumeToChoices(story) {
        for (let guard = 0; guard < 50 && story.canContinue; guard++) story.Continue();
        return this._plainOptions(story);
    }

    /**
     * The choices a plain thread offers now. Resumes the stored position with the current
     * globals and, if the list changed, stores it. Returns the option texts, or null when the
     * thread has no pending choices.
     */
    async refreshPlainChoices(threadKey) {
        const scheduler = this.scheduler;
        const thread = scheduler?.state?.threads?.[threadKey];
        const parsed = parsePlainThreadKey(threadKey);
        if (!parsed || !thread || !thread.expects || thread.expects.mode !== 'choices' || !isStr(thread.position)) return null;
        const opened = await this._openPlain(parsed.npcId);
        if (!opened) return arr(thread.expects.options);
        const { story, sm } = opened;
        try {
            story.state.LoadJson(thread.position);
            sm?.syncGlobalVariablesToStory?.(story);
            const options = this._resumeToChoices(story);
            const same = options.length === arr(thread.expects.options).length && options.every((o, i) => o === thread.expects.options[i]);
            if (!same) {
                if (options.length) scheduler.setThread(threadKey, { ...thread, expects: { mode: 'choices', options } });
                else scheduler.setThread(threadKey, null);
            }
            return options;
        } catch (e) {
            console.warn('[MailRunner] could not refresh plain choices', e.message);
            return arr(thread.expects.options);
        }
    }

    /**
     * Compose to an ink contact: pending choices (refreshed) if the thread has them, "waiting"
     * while a send is awaiting its reply, else the contact's `on_compose` (or `composeKnot`)
     * knot run headless to its first choices. The knot must print nothing before the choices;
     * any text it does print is dropped.
     * @returns {{state:'choices'|'waiting'|'none', options:string[]}}
     */
    async prepareCompose({ npcId, accountId }) {
        const scheduler = this.scheduler;
        const key = plainThreadKey(npcId, accountId);
        const thread = scheduler?.state?.threads?.[key];
        if (thread && thread.expects && thread.expects.mode === 'waiting') return { state: 'waiting', options: [] };
        if (thread && thread.expects && thread.expects.mode === 'choices') {
            const options = await this.refreshPlainChoices(key);
            if (options && options.length) return { state: 'choices', options };
        }
        const contact = contactForNpc(this._mailConfig, npcId);
        const knot = contact && isStr(contact.composeKnot) ? contact.composeKnot : 'on_compose';
        const opened = await this._openPlain(npcId);
        if (!opened) return { state: 'none', options: [] };
        const { engine, story, sm } = opened;
        try {
            sm?.syncGlobalVariablesToStory?.(story);
            engine.goToKnot(knot);
        } catch (e) {
            return { state: 'none', options: [] };
        }
        let steps;
        try { steps = this._stepToChoices(story); } catch (e) { return { state: 'none', options: [] }; }
        const options = this._plainOptions(story);
        if (!options.length) return { state: 'none', options: [] };
        const pre = steps.length ? steps[steps.length - 1].pre : null;
        if (isStr(pre)) scheduler.setThread(key, { position: pre, expects: { mode: 'choices', options } });
        return { state: 'choices', options };
    }

    /** The mailbox a mail account writes to. */
    _mailboxOf(accountId) {
        const account = arr(this._mailConfig.accounts).find((a) => a && a.id === accountId);
        return account ? (account.mailbox || account.id) : accountId;
    }

    _attachmentOf(kitId) {
        const item = arr(this._mailConfig.payloadKit).find((k) => k && k.id === kitId);
        return { kitId, kind: item && isStr(item.kind) ? item.kind : 'document', label: item && isStr(item.label) ? item.label : kitId };
    }

    /** A received message by id in the mailbox, for `# forward:`. */
    _findInMailbox(mailboxId, messageId) {
        const list = this.scheduler?.state?.mailboxes?.[mailboxId]?.messages;
        return arr(list).find((m) => m && m.id === messageId && m.folder !== 'sent') || null;
    }

    _forwardBlock(original) {
        const from = original.from && typeof original.from === 'object' ? original.from : {};
        const who = [from.name, from.address ? `<${from.address}>` : ''].filter(Boolean).join(' ');
        return `---------- Forwarded message ----------\nFrom: ${who}\nSubject: ${original.subject || '(no subject)'}\n\n${original.body || ''}`;
    }

    /**
     * What picking suggested reply `index` would send, without sending it: the full message
     * the composer shows (subject, body, attachments, forwarded original). Nothing is written.
     * @param {Object} o { threadKey, index, mailboxId }
     * @returns {Promise<Object>} { ok, chip, body, subject, attachments, forwardOf, boundary, replyAfter, gameTags, hasReply }
     *          or { ok:false, reason }
     */
    async planPlainChoice({ threadKey, index, mailboxId = null } = {}) {
        const scheduler = this.scheduler;
        const parsed = parsePlainThreadKey(threadKey);
        const thread = scheduler?.state?.threads?.[threadKey];
        if (!parsed || !thread || !thread.expects || thread.expects.mode !== 'choices' || !isStr(thread.position)) {
            return { ok: false, reason: 'no-choices' };
        }
        const opened = await this._openPlain(parsed.npcId);
        if (!opened) return { ok: false, reason: 'not-ready' };
        const { story, sm } = opened;
        let split; let chip;
        try {
            story.state.LoadJson(thread.position);
            sm?.syncGlobalVariablesToStory?.(story);
            const options = this._resumeToChoices(story);
            if (!Number.isInteger(index) || index < 0 || index >= options.length) return { ok: false, reason: 'gone' };
            chip = options[index];
            story.ChooseChoiceIndex(index);
            const raw = this._stepToChoices(story);
            split = splitPlainRun(raw, chip);
        } catch (e) {
            console.warn('[MailRunner] could not plan the reply', e.message);
            return { ok: false, reason: 'error' };
        }
        let body = split.body;
        const attachments = split.attach.map((id) => this._attachmentOf(id));
        let forwardOf = null;
        if (isStr(split.forward)) {
            const box = mailboxId || this._mailboxOf(parsed.accountId);
            const original = this._findInMailbox(box, split.forward);
            if (!original) return { ok: false, reason: 'forward-missing', chip };
            forwardOf = original.id;
            body = `${body}\n\n${this._forwardBlock(original)}`;
            for (const a of arr(original.attachments)) if (a && !attachments.some((x) => x.kitId === a.kitId)) attachments.push(a);
        }
        return {
            ok: true, chip, body, subject: split.subject, attachments, forwardOf,
            boundary: split.boundary, replyAfter: split.replyAfter, gameTags: split.gameTags,
            hasReply: split.hasReply, rule: split.rule
        };
    }

    /**
     * Send suggested reply `index`: write the player's message to Sent, apply the tags written
     * in the player's part, move the thread to "waiting" and queue the NPC's reply after
     * `# reply_after` seconds (else the contact's delay). Replays the story up to the boundary
     * with the global observers on, so ink assignments in the player's part reach the globals
     * exactly once; the reply part runs later from the saved boundary.
     * @param {Object} o { threadKey, index, accountId, mailboxId?, inReplyTo? }
     * @returns {Promise<Object>} { ok, sentId, jobId, record } or { ok:false, reason }
     */
    async sendPlainChoice({ threadKey, index, accountId = null, mailboxId = null, inReplyTo = null } = {}) {
        const scheduler = this.scheduler;
        const parsed = parsePlainThreadKey(threadKey);
        if (!scheduler || !parsed) return { ok: false, reason: 'bad-thread' };
        const acct = accountId || parsed.accountId;
        const box = mailboxId || this._mailboxOf(acct);
        const plan = await this.planPlainChoice({ threadKey, index, mailboxId: box });
        if (!plan.ok) return plan;
        const thread = scheduler.state.threads[threadKey];
        const opened = await this._openPlain(parsed.npcId);
        if (!opened) return { ok: false, reason: 'not-ready' };
        const { engine, story, sm } = opened;

        const jobId = newPlainJobId();
        const sentId = `sent_${jobId}`;
        let snapshot = null;
        try {
            story.state.LoadJson(thread.position);
            sm?.syncGlobalVariablesToStory?.(story);
            this._resumeToChoices(story);                   // regenerate the choices: no observers yet
            sm?.observeGlobalVariableChanges?.(story, parsed.npcId);
            story.ChooseChoiceIndex(index);
            for (let i = 0; i < plan.boundary && story.canContinue; i++) story.Continue();
            snapshot = story.state.ToJson();
        } catch (e) {
            console.warn('[MailRunner] could not replay the reply', e.message);
            return { ok: false, reason: 'error' };
        }

        const sendKey = `send_${jobId}`;
        if (plan.gameTags.length > 0 && !this._alreadyApplied(sendKey)) {
            await this._applyGameTags(plan.gameTags, { npcId: parsed.npcId, msgId: sentId }, engine);
        }
        this._markApplied(sendKey);

        const contact = contactForNpc(this._mailConfig, parsed.npcId);
        const account = arr(this._mailConfig.accounts).find((a) => a && a.id === acct) || null;
        const original = isStr(inReplyTo) ? this._findInMailbox(box, inReplyTo) : null;
        const lastSubject = this._threadSubject(threadKey, box);
        let subject = isStr(plan.subject) ? plan.subject : (original && original.subject) || lastSubject || '';
        if (!isStr(plan.subject) && subject && !/^(re|fwd?):/i.test(subject)) subject = plan.forwardOf ? `Fwd: ${subject}` : `Re: ${subject}`;
        const record = scheduler.addMessage(box, {
            id: sentId,
            kind: 'plain',
            thread: threadKey,
            folder: 'sent',
            fromAccount: acct,
            from: { name: account ? (account.displayName || account.address || '') : '', address: this._accountAddress(acct) },
            to: contact ? contactAddress(contact) : '',
            targetId: null,
            subject,
            templates: {}, slots: {},
            body: plan.body,
            attachment: null, link: null, landed: null, tells: [],
            ...(plan.attachments.length ? { attachments: plan.attachments } : {}),
            ...(plan.forwardOf ? { forwardOf: plan.forwardOf } : {}),
            read: true
        });
        scheduler.setThread(threadKey, { position: snapshot, expects: { mode: 'waiting' } });
        const delaySeconds = plan.replyAfter !== null && plan.replyAfter !== undefined ? plan.replyAfter : replyDelaySeconds(contact);
        scheduler.addJob({
            jobId, kind: 'ink', plain: true, afterSend: true, npcId: parsed.npcId, accountId: acct,
            thread: threadKey, msgId: sentId, knot: ''
        }, delaySeconds * 1000);
        const sentEvent = { npcId: parsed.npcId, contactId: contact ? contact.id : null, accountId: acct, msgId: sentId };
        this._emit('mail_sent', sentEvent);
        this._emit(`mail_sent:${parsed.npcId}`, sentEvent);
        return { ok: true, sentId, jobId, record, plan };
    }

    /** The newest subject on a thread in a mailbox, for a Re: fallback. */
    _threadSubject(threadKey, mailboxId) {
        const list = arr(this.scheduler?.state?.mailboxes?.[mailboxId]?.messages).filter((m) => m && m.thread === threadKey && isStr(m.subject));
        if (!list.length) return '';
        const last = list.reduce((a, b) => ((b.gameTime || 0) >= (a.gameTime || 0) ? b : a), list[0]);
        return last.subject.replace(/^(re|fwd?):\s*/i, '');
    }

    /**
     * The plain-thread run (NPC-started email, the NPC's reply after a send, or a chaser):
     * deliver the lines as one email, apply the game tags, store the next expectation and
     * queue any `# mail_later` chaser or `# send_email` follow-on.
     */
    async _runPlain(job) {
        const scheduler = this.scheduler;
        if (!scheduler) return { retry: true };
        const replyId = `reply_${job.jobId}`;
        const alreadyDelivered = typeof scheduler.findMessage === 'function' && !!scheduler.findMessage(replyId);
        const alreadyApplied = this._alreadyApplied(job.jobId);
        if (alreadyDelivered && alreadyApplied) return {};

        const key = this._threadKey(job);
        const opened = await this._openPlain(job.npcId);
        if (!opened) return { retry: true };
        const { engine, story, sm } = opened;

        const thread = scheduler.state?.threads?.[key] || null;
        if ((job.afterSend === true || job.loadPosition === true) && thread && isStr(thread.position)) {
            try { story.state.LoadJson(thread.position); } catch (e) { console.warn('[MailRunner] could not load thread position', e.message); }
        } else if (job.afterSend === true) {
            console.warn(`[MailRunner] plain job ${job.jobId} has no thread position; nothing to continue`);
            scheduler.setThread(key, null);
            return {};
        }
        sm?.syncGlobalVariablesToStory?.(story);
        sm?.observeGlobalVariableChanges?.(story, job.npcId);
        if (job.afterSend !== true && isStr(job.knot)) {
            try { engine.goToKnot(job.knot); } catch (e) { console.warn(`[MailRunner] ${job.npcId} has no knot "${job.knot}"`, e.message); return {}; }
        }

        let steps;
        try { steps = this._stepToChoices(story); } catch (e) { console.error('[MailRunner] plain run failed', e); return { retry: true }; }
        const options = this._plainOptions(story);
        if (job.afterSend === true && steps.length) steps[0].tags = replyTagsOfFirstLine(steps[0].tags);
        const prePosition = steps.length ? steps[steps.length - 1].pre : null;

        const lines = steps.map((st) => st.text.trim()).filter(Boolean);
        const split = splitMailTags(steps.flatMap((st) => st.tags));

        let message = null;
        if (lines.length > 0 && !alreadyDelivered) {
            const box = this._mailboxOf(job.accountId);
            const sent = job.msgId ? scheduler.findMessage(job.msgId) : null;
            let subject = split.subject;
            if (!isStr(subject)) {
                const base = (sent && sent.subject) || this._threadSubject(key, box);
                subject = base ? (/^re:/i.test(base) ? base : `Re: ${base}`) : '(no subject)';
            }
            const contact = contactForNpc(this._mailConfig, job.npcId);
            const record = this._getNpc(job.npcId);
            message = scheduler.addMessage(box, {
                id: replyId,
                thread: key,
                folder: 'inbox',
                from: { name: (contact && contact.name) || (record && (record.displayName || record.name)) || job.npcId, address: contactAddress(contact) },
                to: this._accountAddress(job.accountId),
                targetId: null,
                subject,
                body: lines.join('\n\n'),
                attachment: null, link: null, landed: null, tells: [],
                ...(split.attach.length ? { attachments: split.attach.map((id) => this._attachmentOf(id)) } : {}),
                read: false
            });
            this._emit('mail_delivered', { mailbox: box, message, job });
        }

        if (split.gameTags.length > 0 && !alreadyApplied) await this._applyGameTags(split.gameTags, job, engine);

        // The next expectation: pending choices (position = the state before the step that made
        // them, so they regenerate), a judged hand-off, or nothing.
        const thr = {};
        if (isStr(split.composeReply)) thr.expects = { mode: 'compose', targetId: split.composeReply };
        else if (options.length > 0) thr.expects = { mode: 'choices', options };
        if (thr.expects && isStr(prePosition)) thr.position = prePosition;
        scheduler.setThread(key, Object.keys(thr).length ? thr : null);

        if (!alreadyApplied) {
            if (split.mailLater) this._scheduleChaser(scheduler, job, key, split.mailLater);
            for (const next of split.sendEmail) {
                queuePlainEmail(scheduler, this._scenario, { npcId: next.npcId, knot: next.knot, delaySeconds: next.seconds });
            }
            this._markApplied(job.jobId);
        }
        sm?.recordInkVariables?.(job.npcId, story);
        return { delivered: !!message };
    }

    _accountAddress(accountId) {
        const scenario = (typeof window !== 'undefined') ? window.gameScenario : null;
        const accounts = scenario?.social?.mailClient?.accounts;
        const account = arr(accounts).find((a) => a && a.id === accountId);
        if (!account) return '';
        // A created account carries no static address; its address is the chosen
        // createMenu entry, named by the `acct_<id>_choice` global (A10: the reply's
        // To was empty for a player-made account).
        if (account.kind === 'created') {
            const globals = (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
            const choice = arr(account.createMenu).find((m) => m && m.id === globals?.[`acct_${account.id}_choice`]);
            if (choice && isStr(choice.address)) return choice.address;
        }
        return isStr(account.address) ? account.address : '';
    }

    async _applyGameTags(gameTags, job, engine) {
        const prev = (typeof window !== 'undefined') ? window.currentConversationNPCId : undefined;
        if (typeof window !== 'undefined') window.currentConversationNPCId = job.npcId;
        try {
            await this._processTags(gameTags, { npcId: job.npcId, engine, runId: job.msgId });
        } finally {
            if (typeof window !== 'undefined') window.currentConversationNPCId = prev;
        }
    }

    _storeThread(scheduler, key, position, endChoices, composeReplyTarget) {
        const thread = {};
        if (isStr(composeReplyTarget)) thread.expects = { mode: 'compose', targetId: composeReplyTarget };
        else if (arr(endChoices).length > 0) thread.expects = { mode: 'choices', options: endChoices.map((c) => c.text) };
        // The stored position is only ever read for a continuation or a compose
        // reply (mail-runner `_run` loads it gated on isContinuation/loadPosition),
        // so a terminal reply with no `expects` stores none: it would be a multi-KB
        // ink snapshot nothing consumes, growing mailState for no gain (T2-2).
        if (thread.expects && isStr(position)) thread.position = position;
        if (typeof scheduler.setThread === 'function') scheduler.setThread(key, Object.keys(thread).length ? thread : null);
    }

    _scheduleChaser(scheduler, job, key, mailLater) {
        // A thread holds at most one pending chaser (00 §10).
        const already = arr(scheduler.state?.jobs).some((j) => j && j.kind === 'ink' && j.chaser === true && j.thread === key);
        if (already) return;
        scheduler.addJob({
            kind: 'ink',
            character: job.character,
            npcId: job.npcId,
            accountId: job.accountId,
            msgId: job.msgId,
            knot: mailLater.knot,
            vars: isObject(job.vars) ? job.vars : {},
            thread: key,
            chaser: true,
            ...(job.plain === true ? { plain: true } : {})
        }, Math.max(0, (mailLater.seconds || 0) * 1000));
    }
}

// ───────────────────────────────────────────────── install / schedule

const INSTALLED = new WeakSet();
let CURRENT = null;

/**
 * Register the `ink` delivery handler on a scheduler (idempotent per scheduler).
 * @param {Object} [opts] { scenario-free deps; scheduler defaults to window.mailScheduler }
 * @returns {MailRunner} the runner installed on that scheduler
 */
export function installMailRunner(opts = {}) {
    const scheduler = opts.scheduler || (typeof window !== 'undefined' ? window.mailScheduler : null);
    if (!scheduler) return null;
    const runner = new MailRunner({ ...opts, scheduler });
    scheduler.registerKind('ink', (job) => runner.handle(job));
    INSTALLED.add(scheduler);
    CURRENT = runner;
    if (typeof window !== 'undefined') window.mailRunner = runner;
    return runner;
}

export function getMailRunner() {
    return CURRENT;
}

function ensureInstalled(scheduler) {
    if (scheduler && !INSTALLED.has(scheduler)) installMailRunner({ scheduler });
}

/**
 * Queue a character target's email reply (the bridge calls this on a send to a
 * target with a `character`, 00 §10 steps 2–4). Builds the email_* snapshot,
 * resolves the entry knot, installs the runner if needed, and adds the ink job
 * with the character's reply delay. Returns the stored job, or null for a
 * data-only target (those get a text job from the bridge instead).
 */
export function scheduleInkReply(scheduler, { target, message, result, account = null, scenario = null, inReplyTo = '' } = {}) {
    if (!scheduler || !isObject(target) || !isStr(target.character)) return null;
    const sc = scenario || (typeof window !== 'undefined' ? window.gameScenario : null) || null;
    const character = target.character;
    const npcId = sc?.social?.characters?.[character]?.channels?.email;
    if (!isStr(npcId)) {
        console.warn(`[MailRunner] character ${character} has no channels.email record; cannot schedule its reply`);
        return null;
    }
    ensureInstalled(scheduler);
    const vars = emailVarsFromResult(target, message, result, { account, inReplyTo });
    const knot = resolveEmailKnot(sc, character, account && account.id);
    const job = buildInkJob({
        target,
        character,
        npcId,
        accountId: account && account.id,
        msgId: message && message.id,
        vars,
        knot,
        inReplyTo
    });
    const delay = typeof scheduler.replyDelayMs === 'function' ? scheduler.replyDelayMs({ character }) : undefined;
    return scheduler.addJob(job, delay);
}

/**
 * Queue the continuation of a reply thread when the player picks one of the ink
 * reply options (01 N8 "Choose a reply"; 00 §10 "Replies, reply choices and
 * chasers"). The thread's stored position holds the choices; this runs the story
 * again from it, picking `choiceIndex`, after the character's reply delay. The
 * thread key is `<character>:<accountId>`, so the character and account are read
 * from it. Returns the stored job, or null when the thread names no known
 * character email record.
 *
 * @param {Object} scheduler
 * @param {Object} opts
 * @param {string}  opts.threadKey   "<character>:<accountId>"
 * @param {number}  opts.choiceIndex the index of the picked option
 * @param {string}  [opts.msgId]     the reply being continued (for Re: threading)
 * @param {Object}  [opts.scenario]  defaults to window.gameScenario
 */
export function scheduleChoiceReply(scheduler, { threadKey, choiceIndex, msgId = null, scenario = null } = {}) {
    if (!scheduler || !isStr(threadKey) || !Number.isInteger(choiceIndex) || choiceIndex < 0) return null;
    if (parsePlainThreadKey(threadKey)) {
        console.warn(`[MailRunner] ${threadKey} is an ink-email thread; send it with sendPlainChoice`);
        return null;
    }
    const colon = threadKey.lastIndexOf(':');
    if (colon <= 0) return null;
    const character = threadKey.slice(0, colon);
    const accountId = threadKey.slice(colon + 1);
    const sc = scenario || (typeof window !== 'undefined' ? window.gameScenario : null) || null;
    const npcId = sc?.social?.characters?.[character]?.channels?.email;
    if (!isStr(npcId)) {
        console.warn(`[MailRunner] thread ${threadKey} has no character email record; cannot continue it`);
        return null;
    }
    ensureInstalled(scheduler);
    const job = buildInkJob({ character, npcId, accountId, msgId, vars: {}, choice: choiceIndex });
    job.thread = threadKey; // keep the exact key so the stored position is loaded
    const delay = typeof scheduler.replyDelayMs === 'function' ? scheduler.replyDelayMs({ character }) : undefined;
    return scheduler.addJob(job, delay);
}

// Install against the live scheduler on import, so an ink job restored from a save
// after a reload has a handler before the mail client is ever opened. A one-line
// `import './systems/mail-runner.js'` at game start (core/game.js, P1-W wiring)
// makes this reliable; scheduleInkReply also installs lazily on first use.
if (typeof window !== 'undefined' && window.mailScheduler) {
    try { installMailRunner({ scheduler: window.mailScheduler }); } catch (e) { /* ignore */ }
}

export default MailRunner;
