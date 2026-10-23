/**
 * Pretext call driver (06 §6, N2, N3, N7–N9; 00 §8, S3, S5).
 *
 * Attaches to person-chat and phone-chat when the chat was opened with
 * `params.pretextCallId`. It is the engine half of a pretext call: it binds the
 * two ink externals the call uses (`pretext_say`, `pretext_ask`), reuses the
 * social-influence write path for every influence move, keeps a reload-safe
 * `PretextSession` at `gameState.globalVariables['pretext_<callId>_state']`,
 * fills the `pretext_*` choice VARs from the prepared card, and on the call's
 * close renders the debrief and completes the chat minigame with the outcome
 * payload and the per-call globals.
 *
 * It owns no scoring: the judge (systems/pretext-judge.js, P4-A) is pure and is
 * the only thing that turns a line into influence entries. This module applies
 * those entries through the service and records them on the session.
 *
 * The live bar and tells are the chat UI's (person-chat-ui.js / phone-chat-ui.js,
 * P4-E). This module tells that UI to mount them once the session exists, and
 * to refresh the tells after each line. It draws the end-of-call debrief (N7)
 * in its own element.
 *
 * A chat opened with no `pretextCallId` never reaches any of this, so person-chat
 * and phone-chat behave exactly as before for m01 to m08 (back-compat 2 to 8).
 *
 * ------------------------------------------------------------------ public API
 *
 *   PretextSession                       the per-call store (N2)
 *   makePretextExternals(opts)           -> { pretext_say, pretext_ask } (N3, N9)
 *   finalisePretext(opts)                -> payload; writes the per-call globals (N8)
 *   outcomeFor(session)                  -> 'got_it' | 'reported' | 'walked_away'
 *   fillPretextVars(story, blanks)       fills pretext_<fact>_name / _value
 *   attachPretext(minigame, opts)        the live integration (N3, N7, N8, N9)
 *   resolveJudge(injected?)              -> Promise<judge module>
 *
 * The judge contract this module relies on (P4-B ↔ P4-A, per 06 §4, §6 N1):
 *   judgeUtterance(spec, session, utteranceId, blanks, influence)
 *       -> { entries:[{delta, reason, line}], band, reported, reportReason,
 *            opens?:[factId], closes?:[factId] }
 *   judgeAsk(spec, session, askId, influence)
 *       -> { result:0|1|2, entries:[{delta, reason, line}], reported,
 *            reportReason, refused? }
 *   The judge READS session (openMismatches, refusals, grantedAsks) and never
 *   mutates it. This module applies entries, grants, reports and the session
 *   bookkeeping, inside one ledgered unit per call so a replay never doubles.
 */

import writeGlobalDefault from '../../systems/global-writer.js';
import { getSocialInfluence } from '../../systems/social-influence.js';
import { grantFact as grantFactDefault } from '../../systems/social-intel.js';

const LOG_LIMIT = 40;               // 00 §11: the session holds the last 40 entries only
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const stateKey = (callId) => `pretext_${callId}_state`;

// -------------------------------------------------------------- the session (N2)

/**
 * The per-call store. Holds ids and the last 40 log entries only — never
 * influence (that is the character's global) and never a DOM node. It is a plain
 * object under `gameState.globalVariables['pretext_<callId>_state']` so it rides
 * the normal save and comes back after a reload.
 */
export class PretextSession {
    constructor({ callId, character, npcId, channel = null } = {}) {
        this.callId = callId;
        this.character = character;
        this.npcId = npcId || null;
        this.channel = channel;
        this.turn = 0;
        this.refusals = 0;
        this.lowestInfluence = null;        // filled on the first write
        this.openMismatches = [];           // fact ids caught wrong, not yet repaired (the judge reads this)
        this.pendingVerification = [];      // fact ids an ask is waiting on
        this.pendingVerificationAsk = null; // the ask those facts belong to
        this.verified = {};                 // { <askId>: true } once its verification matched
        this.provenFacts = [];              // fact ids a claim has checked out this call (judge reads this)
        this.grantedAsks = [];              // ask ids granted during THIS call
        this.reportedThisCall = false;
        this.reportReason = null;
        this.blanks = {};                   // factId -> { value, label } (the card)
        this.log = [];                      // [{ turn, kind, id, entries, band, result }]
        this.open = true;                   // false once the call has been finalised
    }

    /** Facts the player has an open, unrepaired mismatch on (judge reads this). */
    hasOpenMismatch(factId) {
        return this.openMismatches.includes(factId);
    }

    /** Apply the state changes the judge returns from one line (06 N1). */
    applyUtteranceChanges({ opens = [], repairs = [], proven = [], verificationCleared = [] } = {}) {
        for (const fact of opens) if (!this.openMismatches.includes(fact)) this.openMismatches.push(fact);
        for (const fact of proven) if (!this.provenFacts.includes(fact)) this.provenFacts.push(fact);
        if (repairs.length) this.openMismatches = this.openMismatches.filter(f => !repairs.includes(f));
        if (verificationCleared.length) this.pendingVerification = this.pendingVerification.filter(f => !verificationCleared.includes(f));
        if (this.pendingVerificationAsk && this.pendingVerification.length === 0) {
            this.verified[this.pendingVerificationAsk] = true;
            this.pendingVerificationAsk = null;
        }
    }

    addLog(entry) {
        this.log.push(entry);
        if (this.log.length > LOG_LIMIT) this.log.splice(0, this.log.length - LOG_LIMIT);
    }

    noteInfluence(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) return;
        this.lowestInfluence = (this.lowestInfluence === null) ? value : Math.min(this.lowestInfluence, value);
    }

    /** A JSON-safe snapshot, ids only (00 §11). */
    toJSON() {
        return {
            callId: this.callId,
            character: this.character,
            npcId: this.npcId,
            channel: this.channel,
            turn: this.turn,
            refusals: this.refusals,
            lowestInfluence: this.lowestInfluence,
            openMismatches: [...this.openMismatches],
            pendingVerification: [...this.pendingVerification],
            pendingVerificationAsk: this.pendingVerificationAsk,
            verified: { ...this.verified },
            provenFacts: [...this.provenFacts],
            grantedAsks: [...this.grantedAsks],
            reportedThisCall: this.reportedThisCall,
            reportReason: this.reportReason,
            blanks: this.blanks,
            log: this.log.slice(-LOG_LIMIT),
            open: this.open
        };
    }

    static fromJSON(raw) {
        if (!isObject(raw)) return null;
        const s = new PretextSession({ callId: raw.callId, character: raw.character, npcId: raw.npcId, channel: raw.channel });
        s.turn = Number.isFinite(raw.turn) ? raw.turn : 0;
        s.refusals = Number.isFinite(raw.refusals) ? raw.refusals : 0;
        s.lowestInfluence = typeof raw.lowestInfluence === 'number' ? raw.lowestInfluence : null;
        s.openMismatches = Array.isArray(raw.openMismatches) ? [...raw.openMismatches] : [];
        s.pendingVerification = Array.isArray(raw.pendingVerification) ? [...raw.pendingVerification] : [];
        s.pendingVerificationAsk = raw.pendingVerificationAsk ?? null;
        s.verified = isObject(raw.verified) ? { ...raw.verified } : {};
        s.provenFacts = Array.isArray(raw.provenFacts) ? [...raw.provenFacts] : [];
        s.grantedAsks = Array.isArray(raw.grantedAsks) ? [...raw.grantedAsks] : [];
        s.reportedThisCall = raw.reportedThisCall === true;
        s.reportReason = raw.reportReason ?? null;
        s.blanks = isObject(raw.blanks) ? { ...raw.blanks } : {};
        s.log = Array.isArray(raw.log) ? raw.log.slice(-LOG_LIMIT) : [];
        s.open = raw.open !== false;
        return s;
    }
}

const globalsObj = () => (typeof window !== 'undefined' ? window.gameState?.globalVariables : null);

/** Write the session snapshot to its state key (object-valued global). */
export function persistSession(session) {
    const globals = globalsObj();
    if (!globals || !session?.callId) return;
    globals[stateKey(session.callId)] = session.toJSON();
    try { window.stateSync?.sync?.(); } catch (e) { /* the 30 s timer retries */ }
}

/** Read a persisted session for a callId, or null. */
export function loadSession(callId) {
    const globals = globalsObj();
    return globals ? PretextSession.fromJSON(globals[stateKey(callId)]) : null;
}

// -------------------------------------------------------------- the call spec

/** The social.pretextNpcs entry for a callId, or null. */
export function findCallSpec(scenario, callId) {
    const calls = scenario?.social?.pretextNpcs;
    return Array.isArray(calls) ? (calls.find(c => isObject(c) && c.callId === callId) || null) : null;
}

// -------------------------------------------------------------- the judge (N1 dep)

let injectedJudge = null;
/** Test seam: pin the judge module so no dynamic import runs. */
export function setJudge(judge) { injectedJudge = judge; }

/**
 * The pure judge (P4-A). Injected in tests; dynamically imported in the browser
 * so this module's static import graph never names the parallel packet's file.
 */
export async function resolveJudge(judge = injectedJudge) {
    if (judge) return judge;
    return import('../../systems/pretext-judge.js');
}

// -------------------------------------------------------------- grants

/**
 * Apply one ask's grants (00 §8 "Outputs are generic"): any number of `setGlobal`
 * flags and any number of `intel` facts, all through the shared writer so the open
 * conversation, the cached stories and the bar see them at once (S3).
 */
export function applyGrants(grants, ctx, { writeGlobal = writeGlobalDefault, grantFact = null } = {}) {
    if (!isObject(grants)) return;
    const w = { engine: ctx?.engine || null, npcId: ctx?.npcId || null };
    if (isObject(grants.setGlobal)) {
        for (const [name, value] of Object.entries(grants.setGlobal)) writeGlobal(name, value, w);
    }
    const intel = Array.isArray(grants.intel) ? grants.intel : [];
    if (intel.length) {
        const grant = grantFact || grantFactDefault;
        for (const id of intel) grant(id, { engine: w.engine, npcId: w.npcId, source: 'pretext' });
    }
}

// -------------------------------------------------------------- the spec (P4-B ↔ P4-A)

/**
 * The judge reads the call data merged with the character's influence config: the
 * `social.pretextNpcs` entry, plus the `social.characters` entry's `thresholds[]`
 * and `influence` { min, max, start, rearmMargin }. The binding assembles it from
 * the service's normalised character config so the judge imports nothing.
 */
export function mergeSpec(pretextEntry, charConfig) {
    const spec = { ...(pretextEntry || {}) };
    if (charConfig) {
        spec.thresholds = charConfig.thresholds || [];
        spec.influence = { min: charConfig.min, max: charConfig.max, start: charConfig.start, rearmMargin: charConfig.rearmMargin };
    }
    return spec;
}

// -------------------------------------------------------------- the externals (N3, N9)

/**
 * Build the two ink externals for one call. Both are idempotent per run through
 * the service ledger (00 §8): the same id on the same turn returns its stored
 * result and applies nothing twice. The judge is pure (it never mutates the
 * session); this applies its returned entries through the influence write path,
 * the session bookkeeping it returns (opens, repairs, verificationCleared), the
 * forced report and an ask's authored grants.
 *
 * `pretext_say` returns the band (0..4) ink branches on; `pretext_ask` returns the
 * ink result (1 granted, 0 refused, 2 needs verification), per 06 §5.
 *
 * @param {Object} opts
 * @param {Object} opts.service  the social-influence service (getSocialInfluence())
 * @param {Object} opts.spec     the MERGED call spec (see mergeSpec)
 * @param {PretextSession} opts.session
 * @param {Object} opts.ctx      { engine, npcId, channel, runId } for the writes
 * @param {Object} opts.judge    the resolved judge module
 * @param {Function} [opts.writeGlobal]  injectable (default: the shared writer)
 * @param {Function} [opts.grantFact]    injectable (default: social-intel grantFact)
 * @param {Function} [opts.onChange]     called after each applied line (for the UI)
 * @returns {{ pretext_say: Function, pretext_ask: Function }}
 */
export function makePretextExternals({ service, spec, session, ctx, judge, writeGlobal = writeGlobalDefault, grantFact = null, onChange = null } = {}) {
    const character = spec.character;
    const runId = ctx?.runId;

    const applyEntries = (entries, line) => {
        for (const e of (entries || [])) {
            if (!isObject(e) || typeof e.delta !== 'number' || e.delta === 0) continue;
            service.addInfluence(character, e.delta, e.reason ?? null, { ...ctx, line: e.line ?? line ?? null });
        }
        session.noteInfluence(service.getInfluence(character));
    };

    const fireReport = (judged, fallbackReason) => {
        if (!judged.reported) return;
        const reason = judged.reportReason || fallbackReason;
        service.report(character, reason, ctx);
        session.reportedThisCall = true;
        session.reportReason = reason;
    };

    const pretext_say = (utteranceId) => service.ledgerCall(runId, 'pretext_say', utteranceId, () => {
        const influence = service.getInfluence(character);
        session.noteInfluence(influence);
        const judged = judge.judgeUtterance(spec, session, utteranceId, session.blanks, influence) || {};
        applyEntries(judged.entries, utteranceId);
        session.applyUtteranceChanges(judged);
        fireReport(judged, 'threshold');
        const band = Number.isFinite(judged.band) ? judged.band : service.getBand(character);
        session.turn += 1;
        session.addLog({ turn: session.turn, kind: 'say', id: utteranceId, entries: judged.entries || [], band });
        persistSession(session);
        if (typeof onChange === 'function') onChange({ kind: 'say', id: utteranceId, judged, band });
        return band;
    });

    const pretext_ask = (askId) => service.ledgerCall(runId, 'pretext_ask', askId, () => {
        const askSpec = spec.asks?.[askId] || {};
        const influence = service.getInfluence(character);
        session.noteInfluence(influence);
        const judged = judge.judgeAsk(spec, session, askId, influence) || {};
        applyEntries(judged.entries, askId);
        const inkResult = (judged.inkResult === 0 || judged.inkResult === 1 || judged.inkResult === 2) ? judged.inkResult : 0;
        if (inkResult === 1) {
            // Grants are authored on the ask, not decided by the judge (00 §8).
            // Synchronous, and before the session is saved, so a reload cannot
            // miss a fact the ask just gave (grantFact is loaded with this module).
            try {
                applyGrants(askSpec.grants, ctx, { writeGlobal, grantFact });
            } catch (err) {
                console.warn('⚠️ [pretext] grant failed:', err?.message);
            }
            if (!session.grantedAsks.includes(askId)) session.grantedAsks.push(askId);
        } else if (inkResult === 2) {
            // Waiting on verification: record which facts, so the next line's matches
            // clear them and the re-ask then grants (06 §4.2, §4.4).
            session.pendingVerification = [...(judged.verificationNeeded || [])];
            session.pendingVerificationAsk = askId;
        } else {
            // A soft refusal counts toward maxRefusals (the judge read the count
            // before this increment and reported if the limit was already reached).
            session.refusals += 1;
        }
        fireReport(judged, 'maxRefusals');
        session.noteInfluence(service.getInfluence(character));
        const band = Number.isFinite(judged.band) ? judged.band : service.getBand(character);
        session.turn += 1;
        session.addLog({ turn: session.turn, kind: 'ask', id: askId, entries: judged.entries || [], band, result: inkResult });
        persistSession(session);
        if (typeof onChange === 'function') onChange({ kind: 'ask', id: askId, judged, band, result: inkResult });
        return inkResult;
    });

    return { pretext_say, pretext_ask };
}

// -------------------------------------------------------------- outcome and payload (N8)

/** 00 §13 "Call outcome": reported wins, then any grant, else walked away. */
export function outcomeFor(session) {
    if (session.reportedThisCall) return 'reported';
    if (session.grantedAsks.length > 0) return 'got_it';
    return 'walked_away';
}

/**
 * Finalise the call: compute the outcome and payload, write the two declared
 * per-call globals (`pretext_<callId>_outcome`, `pretext_<callId>_lowest`) and any
 * `outcomes.<outcome>.setGlobal`, mark the session closed and persist it.
 * Returns the payload for `minigame_completed` (N8). `pretext_call_done` is NOT
 * written here: it comes from a granting ask's own `grants` (00 §8).
 */
export function finalisePretext({ session, spec, service, ctx, writeGlobal = writeGlobalDefault } = {}) {
    const outcome = outcomeFor(session);
    const influenceEnd = service ? service.getInfluence(session.character) : null;
    const lowest = (session.lowestInfluence === null) ? influenceEnd : session.lowestInfluence;
    const w = { engine: ctx?.engine || null, npcId: ctx?.npcId || null };

    // P6 (lab): `got_it` is sticky across calls. Once the engagement has got what it
    // came for, a later check-in or walk-away on the same callId must not downgrade the
    // recorded outcome: the report row and Tomasz's debrief both read this global, and
    // "the call ended without a result" over an earlier success is a lie. A call that
    // upgrades the outcome (a reported first call, then a got_it) still writes got_it.
    const outcomeKey = `pretext_${session.callId}_outcome`;
    const prevOutcome = (typeof window !== 'undefined') ? window.gameState?.globalVariables?.[outcomeKey] : undefined;
    const alreadyGotIt = prevOutcome === 'got_it';
    writeGlobal(outcomeKey, alreadyGotIt ? 'got_it' : outcome, w);
    // The report's pretext row shows the worst the engagement reached, so `_lowest` is a
    // running minimum across every call, not just the latest one (R2 F6-F10: a clean
    // call-back must not erase the -60 of a reported first call).
    const lowestKey = `pretext_${session.callId}_lowest`;
    const prevLowest = (typeof window !== 'undefined') ? Number(window.gameState?.globalVariables?.[lowestKey]) : NaN;
    const thisLowest = Number.isFinite(lowest) ? lowest : 0;
    const runningLowest = Number.isFinite(prevLowest) ? Math.min(prevLowest, thisLowest) : thisLowest;
    writeGlobal(lowestKey, runningLowest, w);
    // 06 §4.5: the hint ladder advances on any failed call, not only a report. A call
    // that is reported, refused, or walked away from with nothing granted all count as
    // a failed attempt; only `got_it` (the player left with a grant) does not advance it.
    // Once the engagement has already reached got_it (sticky, above), a later failed
    // call is a pointless check-in, not a meaningful earlier attempt, so it must not
    // advance the ladder either: otherwise failedAttempts > 0 with a got_it outcome
    // makes the report read as "an earlier call got nothing" when the earlier call is
    // the one that succeeded (P6). A failed call before any success still advances it.
    if (outcome !== 'got_it' && !alreadyGotIt) {
        const key = `pretext_${session.callId}_reports`;
        const globals = (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
        const prev = Number(globals?.[key]);
        writeGlobal(key, (Number.isFinite(prev) ? prev : 0) + 1, w);
    }

    const outcomeSpec = spec?.outcomes?.[outcome];
    if (isObject(outcomeSpec?.setGlobal)) {
        for (const [name, value] of Object.entries(outcomeSpec.setGlobal)) writeGlobal(name, value, w);
    }

    session.open = false;
    persistSession(session);

    return {
        callId: session.callId,
        character: session.character,
        npcId: session.npcId,
        outcome,
        asks: [...session.grantedAsks],
        influenceEnd,
        lowestInfluence: lowest,
        log: session.log.slice(-LOG_LIMIT)
    };
}

// -------------------------------------------------------------- the pretext VARs (N3)

/**
 * Fill the choice VARs from the prepared card. The VAR for a blank is named for
 * the FACT the blank feeds (06 §5): a line's `blanks: { name: manager }` reads
 * `pretext_manager_name` (the label, shown in the choice) and
 * `pretext_manager_value` (the value id, used to pick a fixed reaction). These
 * are story-local ink VARs, not scenario globals, so no sync touches them and the
 * fill order relative to the global sync does not matter. Only a declared VAR is
 * written; a missing one is skipped.
 *
 * @param {Object} story   the inkjs Story (engine.story)
 * @param {Object} blanks  { <factId>: { value, label } } from pretext-prep
 */
export function fillPretextVars(story, blanks) {
    const vs = story?.variablesState;
    if (!vs || !isObject(blanks)) return;
    const declares = (name) => !!vs._defaultGlobalVariables?.has?.(name);
    const set = (name, value) => { try { if (declares(name)) vs.$(name, value); } catch (e) { /* leave it */ } };
    for (const [factId, chosen] of Object.entries(blanks)) {
        if (!isObject(chosen)) continue;
        set(`pretext_${factId}_name`, String(chosen.label ?? ''));
        set(`pretext_${factId}_value`, String(chosen.value ?? ''));
    }
}

// -------------------------------------------------------------- the debrief (N7)

/** Technique/fact label from a log reason, kept plain (the panel is text). */
const reasonLabel = (reason) => (typeof reason === 'string' && reason ? reason.replace(/_/g, ' ') : 'line');

/**
 * Render the end-of-call debrief into the minigame's container. Reads the session
 * log (N7), one row per line with its delta, band and factor, then the defender
 * notes. Calls `onDone` when the player dismisses it. Pure DOM; no game state.
 */
export function renderDebrief(container, { session, spec, onDone } = {}) {
    if (!container || typeof document === 'undefined') { if (typeof onDone === 'function') onDone(); return null; }
    const BANDS = ['CALM', 'WARY', 'REFUSING', 'REPORTED', 'LOCKED'];

    const panel = document.createElement('div');
    panel.className = 'pretext-debrief';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Call debrief');

    const heading = document.createElement('h2');
    heading.className = 'pretext-debrief-title';
    heading.textContent = 'Call debrief';
    panel.appendChild(heading);

    const outcome = document.createElement('p');
    outcome.className = 'pretext-debrief-outcome';
    const outcomeText = { got_it: 'You got what you came for.', reported: 'The call was reported.', walked_away: 'You rang off.' };
    const outcomeKey = outcomeFor(session);
    // `got_it` means at least one ask was granted, but the call may also have had an
    // ask refused (an earlier grant, a later refusal). Saying "You got what you came
    // for." over a refused ask misleads (lab R5 F3). Word the partial case plainly.
    // The same goes for an ask that went pending and was never granted on this call
    // (lab R9 F3: the portal ask waited on the intern check, only the date was given).
    const askedIds = (Array.isArray(session.log) ? session.log : [])
        .filter((row) => row && row.kind === 'ask' && typeof row.id === 'string').map((row) => row.id);
    const ungranted = askedIds.some((id) => !(session.grantedAsks || []).includes(id));
    outcome.textContent = (outcomeKey === 'got_it' && (session.refusals > 0 || ungranted))
        ? 'You got some of what you came for.'
        : (outcomeText[outcomeKey] || '');
    panel.appendChild(outcome);

    const list = document.createElement('ol');
    list.className = 'pretext-debrief-lines';
    for (const row of session.log) {
        const li = document.createElement('li');
        const total = (row.entries || []).reduce((n, e) => n + (Number(e.delta) || 0), 0);
        const sign = total > 0 ? '+' : '';
        const band = BANDS[row.band] || '';
        const factor = (row.entries || []).map(e => reasonLabel(e.reason)).join(', ') || reasonLabel(row.id);
        li.textContent = `${sign}${total}  ${band}  ${factor}`;
        list.appendChild(li);
    }
    panel.appendChild(list);

    const notes = spec?.defenderNotes;
    if (isObject(notes)) {
        const dl = document.createElement('ul');
        dl.className = 'pretext-debrief-defender';
        for (const text of Object.values(notes)) {
            if (typeof text !== 'string' || !text) continue;
            const li = document.createElement('li');
            li.textContent = text;
            dl.appendChild(li);
        }
        if (dl.childNodes.length) panel.appendChild(dl);
    }

    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'pretext-debrief-done';
    done.textContent = 'Done';
    done.addEventListener('click', () => { panel.remove(); if (typeof onDone === 'function') onDone(); });
    panel.appendChild(done);

    container.appendChild(panel);
    try { done.focus(); } catch (e) { /* headless */ }
    return panel;
}

// -------------------------------------------------------------- live integration

/**
 * Attach the call to a live person-chat or phone-chat minigame. Called by the
 * loader right after the story is restored, synced and the engine VARs are set,
 * and before the first Continue, so the externals are bound in time and the
 * `pretext_*` VARs are read correctly.
 *
 * @param {Object} minigame  the chat minigame instance
 * @param {Object} opts
 * @param {'person'|'phone'} opts.chat   which chat opened the call
 * @param {Object} [opts.judge]          test seam (defaults to the real judge)
 * @returns {Promise<Object|null>} the attachment handle, or null when not a call
 */
export async function attachPretext(minigame, { chat, judge: injected = null } = {}) {
    const params = minigame?.params || {};
    const callId = params.pretextCallId;
    if (!callId) return null;

    const service = (typeof window !== 'undefined') ? (window.socialInfluence || getSocialInfluence()) : getSocialInfluence();
    const scenario = (typeof window !== 'undefined') ? window.gameScenario : null;
    const spec = findCallSpec(scenario, callId);
    const engine = minigame.inkEngine;
    const story = engine?.story;
    if (!service || !spec || !story) {
        console.warn(`⚠️ [pretext] cannot attach ${callId}: missing ${!service ? 'service' : !spec ? 'spec' : 'story'}`);
        return null;
    }

    const npcId = minigame.npcId ?? minigame.currentNPCId ?? null;
    const runId = minigame._socialRunId || `pretext:${callId}:${Date.now()}`;
    const ctx = { engine, npcId, channel: chat, runId };

    // Reload mid-call keeps the open session; a fresh call (the previous one ended,
    // or none) starts clean and overwrites the key (06 §6 "Calling again").
    const saved = loadSession(callId);
    const resuming = !!(saved && saved.open && saved.callId === callId);
    const session = resuming ? saved : new PretextSession({ callId, character: spec.character, npcId, channel: chat });
    session.npcId = npcId;
    session.channel = chat;
    if (isObject(params.blanks)) session.blanks = { ...params.blanks };
    persistSession(session);

    // Influence does NOT carry between calls: each new call (not a mid-call reload)
    // resets the character to its configured start, so a call-back is a fresh social
    // attempt (lab L4/L6 F4). The lesson "push too hard and you lose the line" is
    // carried by the report + channel lockout, which gate whether you may call back
    // at all, not by a quietly worse starting influence. A reload resumes unchanged.
    if (!resuming) {
        const cfg = service.getCharacterConfig?.(spec.character);
        if (cfg && Number.isFinite(cfg.start)) {
            try { service.setInfluence(spec.character, cfg.start, 'new_call', ctx); }
            catch (e) { console.warn('⚠️ [pretext] influence reset failed:', e?.message); }
        }
    }

    // Bind se_influence (the general write path) plus the two call externals, all
    // before the first Continue (00 S1, S5, N3). The loader has already begun the
    // run and wrapped ChooseChoiceIndex so the turn counter advances.
    service.bindInfluenceExternals?.(engine, { npcId, characterId: spec.character, channel: chat, runId });
    const resolved = await resolveJudge(injected);
    const mergedSpec = mergeSpec(spec, service.getCharacterConfig?.(spec.character));
    const { pretext_say, pretext_ask } = makePretextExternals({
        service, spec: mergedSpec, session, ctx, judge: resolved,
        onChange: () => minigame.ui?.refreshPretext?.()
    });
    engine.bindExternalFunction('pretext_say', pretext_say);
    engine.bindExternalFunction('pretext_ask', pretext_ask);

    // The card VARs, after restore and sync (they are story-local, so order is
    // immaterial; see fillPretextVars).
    fillPretextVars(story, session.blanks);

    // Intercept the close: show the debrief, set the payload, then complete (N7, N8).
    // Closing the chat is the end of the call (06: walked away, unless a grant
    // already made it got_it, or the call was reported). Esc, the ×, End
    // Conversation and a story that reaches END all come through here.
    const originalComplete = minigame.complete.bind(minigame);
    let finished = false;
    let debriefUp = false;
    const superseded = () => window.MinigameFramework && window.MinigameFramework.currentMinigame !== minigame;
    const handle = {
        session, spec, ctx, service,
        // True when this attach resumed an open session (a mid-call reload), false for a
        // fresh call. The phone loader reads it to decide whether to re-bake the opening
        // choices: a fresh call's opening was preloaded with the card VARs empty (M2 / F1).
        resuming,
        get finished() { return finished; },
        // Re-assert the card VARs after an ink restore (LoadJson overwrites story-local
        // VARs). Idempotent, last write wins; the loader calls it post-restore.
        fillVars: () => fillPretextVars(engine?.story, session.blanks),
        teardown: () => { /* set below */ },
        finish: () => {
            if (finished) {
                if (!debriefUp) originalComplete(true);
                return;
            }
            finished = true;
            const payload = finalisePretext({ session, spec, service, ctx });
            const prior = minigame.gameResult && minigame.gameResult.aborted ? {} : (minigame.gameResult || {});
            minigame.gameResult = { ...prior, ...payload };
            delete minigame.gameResult.aborted;
            // Speak the outcome's authored goodbye line (06 §13) before the debrief, so a
            // reported call's "I'll check this with my manager…" actually appears in the
            // chat rather than only in the debrief card (R2 F6-a). Only when authored.
            const outcomeLine = spec?.outcomes?.[payload.outcome]?.line;
            if (isStr(outcomeLine)) {
                try { minigame.ui?.addMessage?.('npc', outcomeLine); } catch (e) { /* headless */ }
                try { minigame.history?.addMessage?.('npc', outcomeLine, { read: true }); } catch (e) { /* no history */ }
            }
            const container = minigame.container || minigame.messageContainer || null;
            debriefUp = true;
            renderDebrief(container, {
                session, spec,
                onDone: () => { debriefUp = false; originalComplete(true); }
            });
        }
    };
    minigame.complete = (success) => {
        if (superseded()) { originalComplete(success); return; }
        // The debrief is already up: Esc or the × dismisses it as a normal end.
        if (debriefUp) { debriefUp = false; originalComplete(true); return; }
        if (finished) { originalComplete(success); return; }
        // Defensive only: a SocialOverlayScene's abort() sets { aborted: true } before
        // complete(false), and that is not the player ending the call, so it records
        // nothing. A phone/person chat extends MinigameScene and never sets `aborted`,
        // so for a chat this branch is dead and every complete(false) is a normal call
        // end (superseded() above already covers the hand-off to another minigame).
        if (success === false && minigame.gameResult?.aborted === true) { originalComplete(false); return; }
        handle.finish();
    };
    handle.teardown = () => { minigame.complete = originalComplete; };

    minigame._pretext = handle;
    minigame.ui?.mountPretext?.({ session, spec: mergedSpec, characterId: spec.character });
    return handle;
}

export default attachPretext;
