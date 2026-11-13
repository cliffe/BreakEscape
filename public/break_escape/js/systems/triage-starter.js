/**
 * Inbox triage starter: result globals, sync then emit, reopen re-emit
 * (05 "Bridging", N6, N7; 00 S3 and section 11 "Sync, then emit").
 *
 * startInboxTriageMinigame(lockable, options) opens the `inbox-triage` overlay
 * for the set named by lockable.scenarioData.minigameData.triageSetId. The
 * shared-file block in systems/minigame-starters.js (P3-W) imports it from
 * here, re-exports it and puts it on window.
 *
 * A round's result is saved like this (persistTriageResult):
 *   1. write <prefix>percent, <prefix>reportRate, <prefix>complete (and
 *      <prefix>pass when the set's outcome.passPercent is above 0)
 *      through the shared writer with deferEmit, so nothing is emitted yet;
 *   2. await stateSync.syncConfirmed() (back-off, capped attempts, a 403 is
 *      final; a section the server refused counts as unconfirmed);
 *   3. only on true: emit global_variable_changed:<name> for the names whose
 *      value changed (complete last), then the done event inbox_triage_completed.
 * On false nothing is emitted. The held names are remembered, so the next
 * confirmed save of the same prefix (a "Try again" round) emits them even
 * though writing the same value again is not a change.
 *
 * <prefix>percent and <prefix>reportRate keep the best round's values
 * (a lower later round does not overwrite them). <prefix>complete means a round
 * was completed at any score. <prefix>pass means percent >= the pass mark and is
 * never cleared by a lower round; it is written only when the mark is above 0
 * (awareness sets, passPercent 0, no longer write it). The pass mark is the
 * host's after-check mark (window.breakEscapeConfig.awareness.passPercent) when
 * set, else the set's outcome.passPercent. Saves from before the 2026-10-31
 * rename hold <prefix>done instead of <prefix>complete; they still open
 * read-only, but nothing is re-emitted for them.
 *
 * Reopen: when <prefix>complete is already true and the conclusion task
 * (conclusionTaskId) is not completed, the starter awaits syncConfirmed() and
 * re-emits the complete events (and <prefix>pass when true), because the 30 s
 * timer or the pagehide flush may have carried them to the server before the tab
 * closed with nothing emitted. A pre or post set already complete opens
 * read-only (params.storedResult).
 *
 * What the minigame (P3-B) gets in its params:
 *   triageSetId, set, stage (effective), prefix, conclusionTaskId
 *   persistResult(result) -> Promise<{ confirmed, emitted }>
 *       call it when the result screen appears, so the notice shows there;
 *       if it is never called, the starter saves on complete(true) instead.
 *       Calling it again with the same result object does nothing new.
 *   storedResult  { percent, reportRate, headline, readOnly: true } or
 *       null: a pre/post reopen; show the result from it, no replay
 *   savingNotice  'Saving your result...'
 * and the starter calls minigame.setSavingState(state), when the minigame has
 * it and is still the open one, with 'saving' (show the notice), 'saved'
 * (hide it) or 'failed' (keep a line saying it will save on the next open).
 * When the overlay has closed, 'saving' falls back to a gameAlert.
 */

import { writeGlobal, emitGlobalEvents } from './global-writer.js';
import { bandFor } from '../minigames/inbox-triage/triage-scoring.js';

export const TRIAGE_DONE_EVENT = 'inbox_triage_completed';
export const SAVING_NOTICE = 'Saving your result...';
export const CHECK_STAGES = ['pre', 'post'];
// Result globals in emit order (complete last). pass is written only when the
// set's passPercent is above 0; percent, reportRate and complete are always written.
const EMIT_ORDER = ['percent', 'reportRate', 'pass', 'complete'];

// Per prefix: names whose change event an unconfirmed save is still holding
const held = new Map();
// Per prefix: the tail of the save queue, so rounds save in order
const queue = new Map();
// Per result object: its save, so persistResult and onComplete save once
const saved = new WeakMap();
// Per prefix: a reopen re-emit in progress
const reemits = new Map();

const win = () => (typeof window !== 'undefined' ? window : {});

/** The host's awareness settings (window.breakEscapeConfig.awareness), or {}. */
function hostAwareness() {
    const a = win().breakEscapeConfig?.awareness;
    return a && typeof a === 'object' ? a : {};
}

/** The host after-check pass mark (1-100), or null when none is set. */
export function hostPassPercent() {
    const v = hostAwareness().passPercent;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/** Whether the host wants the result percent shown. Default yes; only a host false hides it. */
export function showResultSetting() {
    return hostAwareness().showResult !== false;
}

/**
 * The pass mark that applies to a set: the host's after-check mark when it is set
 * (it wins over the set's own), else the set's outcome.passPercent, else 0.
 */
export function effectivePassPercent(set) {
    const host = hostPassPercent();
    if (host !== null) return host;
    const own = set?.outcome?.passPercent;
    return typeof own === 'number' && Number.isFinite(own) ? own : 0;
}

function defaults(deps = {}) {
    const w = win();
    return {
        stateSync: deps.stateSync !== undefined ? deps.stateSync : w.stateSync,
        globals: deps.globals || w.gameState?.globalVariables || null,
        objectives: deps.objectives !== undefined ? deps.objectives : w.objectivesManager,
        emit: deps.emit || ((event, data) => w.eventDispatcher?.emit(event, data)),
        write: deps.write || writeGlobal,
        emitGlobals: deps.emitGlobals || emitGlobalEvents,
        onSaving: deps.onSaving || null
    };
}

/** The effective stage: the launch parameter, else the set's own, else mission. */
export function effectiveStage(set, stage) {
    return stage || set?.stage || 'mission';
}

/** outcome.setGlobalPrefix with {stage} replaced, or null when the set has none. */
export function resolvePrefix(set, stage) {
    const raw = set?.outcome?.setGlobalPrefix;
    if (typeof raw !== 'string' || !raw) return null;
    return raw.split('{stage}').join(effectiveStage(set, stage));
}

/**
 * The result global names for a prefix: percent, reportRate, complete always,
 * pass for the sets whose passPercent is above 0, plus the pre-rename `done`
 * name read for old saves.
 */
export function triageGlobalNames(prefix) {
    return {
        percent: `${prefix}percent`,
        reportRate: `${prefix}reportRate`,
        complete: `${prefix}complete`,
        pass: `${prefix}pass`,
        legacyDone: `${prefix}done`
    };
}

/** True when a round is recorded: <prefix>complete, or the pre-rename <prefix>done in an old save. */
function isRoundComplete(globals, n) {
    return globals[n.complete] === true || globals[n.legacyDone] === true;
}

/** The set with this id from scenario.social.triageSets, or null. */
export function findTriageSet(setId, scenario = win().gameScenario) {
    const sets = scenario?.social?.triageSets;
    if (!Array.isArray(sets) || !setId) return null;
    return sets.find(s => s?.id === setId) || null;
}

/** Whether the task is completed in the objectives manager (00 section 11). */
export function isTaskCompleted(taskId, objectives = win().objectivesManager) {
    return objectives?.taskIndex?.[taskId]?.status === 'completed';
}

/** The stored result for a reopen, built from the globals, or null when not done. */
export function readStoredResult(set, prefix, globals = win().gameState?.globalVariables) {
    if (!prefix || !globals) return null;
    const n = triageGlobalNames(prefix);
    if (!isRoundComplete(globals, n)) return null;
    const percent = typeof globals[n.percent] === 'number' ? globals[n.percent] : 0;
    const band = bandFor(percent, set?.bands);
    return {
        percent,
        reportRate: typeof globals[n.reportRate] === 'number' ? globals[n.reportRate] : 0,
        headline: band?.headline || '',
        readOnly: true
    };
}

function heldFor(prefix) {
    let names = held.get(prefix);
    if (!names) {
        names = new Set();
        held.set(prefix, names);
    }
    return names;
}

/**
 * Build the events to emit after a confirmed sync, in EMIT_ORDER, valued
 * from the globals as they are now. `extra` adds names regardless of a change
 * (a reopen, or a conclusion task still open).
 */
function eventsFor(prefix, globals, names) {
    const n = triageGlobalNames(prefix);
    const events = [];
    for (const f of EMIT_ORDER) {
        if (!names.has(n[f])) continue;
        events.push({ event: `global_variable_changed:${n[f]}`, data: { name: n[f], value: globals[n[f]] } });
    }
    return events;
}

/** The done globals a reopen re-emits: pass when it is true, then complete. */
function doneNames(prefix, globals) {
    const n = triageGlobalNames(prefix);
    const names = new Set();
    if (globals[n.pass] === true) names.add(n.pass);
    if (globals[n.complete] === true) names.add(n.complete);
    return names;
}

function doneEventData(ctx, prefix, globals, extra = {}) {
    const n = triageGlobalNames(prefix);
    return {
        setId: ctx.set?.id ?? null,
        stage: effectiveStage(ctx.set, ctx.stage),
        prefix,
        percent: globals[n.percent],
        reportRate: globals[n.reportRate],
        ...extra
    };
}

async function confirm(d, onRetry) {
    if (!d.stateSync || typeof d.stateSync.syncConfirmed !== 'function') {
        // No server to wait for (no stateSync on this page): nothing to gate
        console.warn('[triage] stateSync.syncConfirmed is not available; emitting without a confirmed save');
        return true;
    }
    try {
        return (await d.stateSync.syncConfirmed({ onRetry })) === true;
    } catch (e) {
        console.error('[triage] syncConfirmed failed:', e);
        return false;
    }
}

async function saveRound(result, ctx, d) {
    const prefix = ctx.prefix;
    const globals = d.globals;
    const n = triageGlobalNames(prefix);
    // The host's after-check pass mark wins over the set's own (05, Phase 6).
    const passPercent = effectivePassPercent(ctx.set);
    let percent = typeof result.percent === 'number' ? result.percent : 0;
    let reportRate = typeof result.reportRate === 'number' ? result.reportRate : 0;
    // A later round that scores lower keeps the best round's percent and reportRate
    // (a tie keeps the earlier round), as <prefix>pass is never cleared.
    if (isRoundComplete(globals, n) && typeof globals[n.percent] === 'number' && globals[n.percent] >= percent) {
        percent = globals[n.percent];
        if (typeof globals[n.reportRate] === 'number') reportRate = globals[n.reportRate];
    }

    const names = heldFor(prefix);
    const writes = [[n.percent, percent], [n.reportRate, reportRate]];
    // <prefix>pass only when a pass mark applies (above 0): the host's after-check mark
    // when set, else the set's own. With no mark a check has no pass/fail. Never cleared.
    if (passPercent > 0) writes.push([n.pass, globals[n.pass] === true || percent >= passPercent]);
    writes.push([n.complete, true]);
    for (const [name, value] of writes) {
        const r = d.write(name, value, { deferEmit: true });
        for (const ev of r?.events || []) names.add(ev.data?.name ?? name);
    }

    let notified = false;
    const onRetry = (i) => {
        if (!notified) d.onSaving?.('saving', i);
        notified = true;
    };
    const confirmed = await confirm(d, onRetry);
    if (!confirmed) {
        d.onSaving?.('failed');
        return { confirmed: false, emitted: [] };
    }

    // A conclusion task still open gets the done globals again, as a reopen would
    if (ctx.conclusionTaskId && !isTaskCompleted(ctx.conclusionTaskId, d.objectives)) {
        for (const name of doneNames(prefix, globals)) names.add(name);
    }
    const events = eventsFor(prefix, globals, names);
    names.clear();
    d.emitGlobals(events);
    d.emit(TRIAGE_DONE_EVENT, doneEventData(ctx, prefix, globals, { reemit: false }));
    if (notified) d.onSaving?.('saved');
    return { confirmed: true, emitted: events.map(e => e.data.name) };
}

/**
 * Save one completed round: write with deferEmit, await a confirmed sync, then
 * emit. Rounds of the same prefix save in order. The same result object saves
 * once, however many times this is called.
 *
 * @param {Object} result  The minigame's gameResult (percent, reportRate, ...)
 * @param {Object} ctx     { set, stage, prefix, conclusionTaskId }
 * @param {Object} [deps]  Test seams: stateSync, globals, objectives, emit,
 *                         write, emitGlobals, onSaving(state)
 * @returns {Promise<{confirmed:boolean, emitted:string[], skipped?:string}>}
 */
export function persistTriageResult(result, ctx = {}, deps = {}) {
    if (!result || typeof result !== 'object' || result.aborted) {
        return Promise.resolve({ confirmed: false, emitted: [], skipped: 'aborted' });
    }
    if (saved.has(result)) return saved.get(result);
    const d = defaults(deps);
    if (!ctx.prefix || !d.globals) {
        console.warn('[triage] No outcome.setGlobalPrefix or no gameState: the result is not saved');
        const none = Promise.resolve({ confirmed: false, emitted: [], skipped: 'no-prefix' });
        saved.set(result, none);
        return none;
    }
    const prev = queue.get(ctx.prefix) || Promise.resolve();
    const run = prev.catch(() => {}).then(() => saveRound(result, ctx, d));
    queue.set(ctx.prefix, run);
    run.finally(() => { if (queue.get(ctx.prefix) === run) queue.delete(ctx.prefix); }).catch(() => {});
    saved.set(result, run);
    return run;
}

/**
 * Reopen: when <prefix>complete is true and the conclusion task is not completed,
 * await a confirmed sync and re-emit the done globals (pass when true, then
 * complete) and the done event. One re-emit per prefix at a time.
 *
 * @returns {Promise<{confirmed:boolean, emitted:string[], skipped?:string}>}
 */
export function reemitTriageDone(ctx = {}, deps = {}) {
    const d = defaults(deps);
    const prefix = ctx.prefix;
    const globals = d.globals;
    if (!prefix || !globals) return Promise.resolve({ confirmed: false, emitted: [], skipped: 'no-prefix' });
    if (globals[triageGlobalNames(prefix).complete] !== true) {
        return Promise.resolve({ confirmed: false, emitted: [], skipped: 'not-done' });
    }
    if (!ctx.conclusionTaskId) return Promise.resolve({ confirmed: false, emitted: [], skipped: 'no-task' });
    if (isTaskCompleted(ctx.conclusionTaskId, d.objectives)) {
        return Promise.resolve({ confirmed: false, emitted: [], skipped: 'task-completed' });
    }
    if (reemits.has(prefix)) return reemits.get(prefix);

    const run = (async () => {
        let notified = false;
        const confirmed = await confirm(d, (i) => {
            if (!notified) d.onSaving?.('saving', i);
            notified = true;
        });
        if (!confirmed) {
            d.onSaving?.('failed');
            return { confirmed: false, emitted: [] };
        }
        // The task may have completed while the sync was retrying
        if (isTaskCompleted(ctx.conclusionTaskId, d.objectives)) {
            if (notified) d.onSaving?.('saved');
            return { confirmed: true, emitted: [], skipped: 'task-completed' };
        }
        const names = doneNames(prefix, globals);
        for (const name of names) heldFor(prefix).delete(name);
        const events = eventsFor(prefix, globals, names);
        d.emitGlobals(events);
        d.emit(TRIAGE_DONE_EVENT, doneEventData(ctx, prefix, globals, { reemit: true }));
        if (notified) d.onSaving?.('saved');
        return { confirmed: true, emitted: events.map(e => e.data.name) };
    })();
    reemits.set(prefix, run);
    run.finally(() => reemits.delete(prefix)).catch(() => {});
    return run;
}

/**
 * Tell the open triage overlay about the save, or fall back to an alert when
 * it has closed (the save outlives the overlay).
 */
function savingNotifier(params) {
    return (state) => {
        const w = win();
        const mg = w.MinigameFramework?.currentMinigame;
        if (mg && mg.params === params && typeof mg.setSavingState === 'function') {
            try { mg.setSavingState(state); } catch (e) { console.warn('[triage] setSavingState failed:', e); }
            return;
        }
        if (state === 'saving') w.gameAlert?.(SAVING_NOTICE, 'info', 'Inbox triage', 3000);
    };
}

/**
 * Open the inbox triage overlay (05 N7, modelled on startSiemMinigame).
 *
 * @param {Object} lockable  The triage-workstation sprite; its
 *                           scenarioData.minigameData holds triageSetId and,
 *                           for a shell, conclusionTaskId
 * @param {Object} [options] { stage, conclusionTaskId, triageSetId, set,
 *                           skin, debriefFollows, onComplete(success, result) }
 *                           set: a ready-made set object used in place of the lookup;
 *                           skin: 'awareness' gives the overlay the awareness skin
 *                           (the Report button's positive animation); a workstation can ask
 *                           for it with minigameData.skin, and options.skin wins
 */
export function startInboxTriageMinigame(lockable, options = {}) {
    const w = win();
    const callback = typeof options.onComplete === 'function' ? options.onComplete : null;
    if (!w.MinigameFramework) {
        console.error('MinigameFramework not available');
        w.gameAlert?.('Triage workstation unavailable.', 'error', 'Error', 3000);
        callback?.(false, { reason: 'framework_unavailable' });
        return null;
    }
    if (!w.MinigameFramework.mainGameScene) {
        w.MinigameFramework.init(w.game);
    }

    const data = lockable?.scenarioData?.minigameData || {};
    // options.set: a ready-made set (the episode runner's defend set with the role swap's
    // calls merged in, 11 N15). It is used as given; its id names the set.
    const given = options.set && typeof options.set === 'object' && !Array.isArray(options.set) ? options.set : null;
    const triageSetId = given?.id || options.triageSetId || data.triageSetId;
    const set = given || findTriageSet(triageSetId);
    if (!set) {
        console.error(`[triage] Unknown triageSetId "${triageSetId}"`);
        w.gameAlert?.('This workstation has no inbox to sort.', 'error', 'Error', 3000);
        callback?.(false, { reason: 'unknown_set' });
        return null;
    }
    const launchStage = options.stage || data.stage;
    const stage = effectiveStage(set, launchStage);
    const prefix = resolvePrefix(set, stage);
    const conclusionTaskId = options.conclusionTaskId || data.conclusionTaskId || null;
    const ctx = { set, stage, prefix, conclusionTaskId };
    // "Try the other set" (training) finishes a round of the paired set, which
    // has its own outcome: save under that set's prefix
    const ctxFor = (result) => {
        if (!result?.setId || result.setId === set.id) return ctx;
        const other = findTriageSet(result.setId);
        if (!other) return ctx;
        const otherStage = effectiveStage(other, launchStage);
        return { set: other, stage: otherStage, prefix: resolvePrefix(other, otherStage), conclusionTaskId };
    };

    const stored = readStoredResult(set, prefix);
    const readOnly = CHECK_STAGES.includes(stage) && !!stored; // first-attempt guard

    const params = {
        title: lockable?.scenarioData?.name || set.title || 'Inbox triage',
        lockable,
        requiresKeyboardInput: true, // socialOverlayParams' two keys, without its import chain
        disableClose: true,
        triageSetId,
        set,
        stage,
        prefix,
        conclusionTaskId,
        readOnly,
        storedResult: readOnly ? stored : null,
        savingNotice: SAVING_NOTICE,
        // Host awareness settings (Phase 6): the after-check pass mark (null when none) and whether
        // to show the result percent. The debrief reads both; the save path prefers the pass mark.
        hostPassPercent: hostPassPercent(),
        showResult: showResultSetting(),
        // The launcher's skin wins; otherwise the workstation's minigameData.skin ('awareness' is the
        // only skin). Neither set: no skin, as before.
        skin: (options.skin !== undefined ? options.skin : data.skin) === 'awareness' ? 'awareness' : null,
        // The episode runner: a debrief follows this round (inbox-triage-minigame.js _genuineSummary).
        debriefFollows: options.debriefFollows === true,
        // item 8: optional per-verdict save/restore so a reload mid-round resumes. Present only
        // when the launcher (the episode runner) supplies them; every other caller is unchanged.
        onProgress: typeof options.onProgress === 'function' ? options.onProgress : null,
        restoreAnswers: Array.isArray(options.restoreAnswers) ? options.restoreAnswers : null,
        onComplete: (success, result) => {
            if (!success || !result || result.aborted) {
                callback?.(false, result);
                return;
            }
            if (readOnly) { // nothing replayed, nothing overwritten
                callback?.(success, result);
                return;
            }
            persistTriageResult(result, ctxFor(result), { onSaving: notify });
            callback?.(success, result);
        }
    };
    const notify = savingNotifier(params);
    params.persistResult = (result) => persistTriageResult(result, ctxFor(result), { onSaving: notify });

    // Reopen re-emits: complete reached the server earlier, the task did not complete
    if (stored && conclusionTaskId && !isTaskCompleted(conclusionTaskId)) {
        reemitTriageDone(ctx, { onSaving: notify });
    }

    w.MinigameFramework.startMinigame('inbox-triage', null, params);
    return params;
}

/** Test seam: forget held names, queued saves and re-emits. */
export function _resetTriageStarterForTests() {
    held.clear();
    queue.clear();
    reemits.clear();
}

export default startInboxTriageMinigame;
