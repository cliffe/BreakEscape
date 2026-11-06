/**
 * Awareness measurement store (11 N4 and S5.2 "Recorded per item"; packet P7-C).
 *
 * One block per finished triage round, kept in the game global
 * `se_awareness_records` (an array of blocks). Local first: nothing here talks
 * to a server beyond the normal global sync.
 *
 *   key      "<stage>:<setId>", unique in the array. The first answer wins (11 S4.1):
 *            a key that is already present is never overwritten.
 *   nothing  is written for an aborted round or a read-only reopen.
 *   no free text is stored: only ids, enums, numbers, booleans and a timestamp.
 *   disc     (aw3) the discrimination figure for organisers: hits on phish against false
 *            alarms on genuine items, so a learner who reports everything is told apart
 *            from a careful one. Stored, never shown to the learner. See discrimination().
 *
 * buildBlock, readBlocks and toXapi are pure. toXapi keeps the block shaped
 * so that it maps to xAPI (actor, verb, object, result); the actor is passed
 * in by the caller (11 S6.3), so no learner identity lives in the block.
 */

import { writeGlobal as sharedWriteGlobal } from './global-writer.js';

export const RECORDS_GLOBAL = 'se_awareness_records';

const STAGES = ['pre', 'post', 'episode'];
const VARIANTS = ['full', 'defendOnly'];
const MAX_ID = 64;
const MAX_CHIPS = 12;

const XAPI_VERBS = {
    answered: { id: 'http://adlnet.gov/expapi/verbs/answered', display: { 'en-GB': 'answered' } },
    completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-GB': 'completed' } }
};
const XAPI_BASE = 'https://breakescape.example/xapi/awareness';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** An id-like string, trimmed and capped; anything else becomes ''. */
function idOf(v) {
    return (typeof v === 'string') ? v.trim().slice(0, MAX_ID) : '';
}

function num(v, { min = 0, max = Infinity, round = false } = {}) {
    let n = Number(v);
    if (!Number.isFinite(n)) n = 0;
    n = Math.min(max, Math.max(min, n));
    return round ? Math.round(n) : Math.round(n * 1000) / 1000;
}

function isoOf(now) {
    const d = (now instanceof Date) ? now : new Date(now === undefined || now === null ? Date.now() : now);
    return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

/** Build one block from a triage gameResult. Pure. */
export function buildBlock(result, ctx = {}) {
    const r = isObj(result) ? result : {};
    const setId = idOf(ctx.setId) || idOf(r.setId);
    const stage = STAGES.includes(ctx.stage) ? ctx.stage : 'episode';
    const variant = VARIANTS.includes(ctx.variant) ? ctx.variant : 'full';
    const answers = Array.isArray(r.answers) ? r.answers : [];
    const items = answers.filter(isObj).map((a) => {
        const item = {
            itemId: idOf(a.id),
            verdict: idOf(a.verdict),
            action: idOf(a.action),
            chips: (Array.isArray(a.flags) ? a.flags : []).map(idOf).filter(Boolean).slice(0, MAX_CHIPS),
            score: num(a.score, { min: 0, max: 100, round: true }),
            ms: num(a.ms, { min: 0, round: true })
        };
        // aw3: whether the item was a phish, when the result says (the triage minigame does).
        if (typeof a.isPhish === 'boolean') item.phish = a.isPhish;
        return item;
    });
    return {
        v: 1,
        key: `${stage}:${setId}`,
        setId,
        form: idOf(ctx.form),
        stage,
        episodeId: idOf(ctx.episodeId),
        variant,
        at: isoOf(ctx.now),
        percent: num(r.percent, { min: 0, max: 100, round: true }),
        reportRate: num(r.reportRate, { min: 0, max: 1 }),
        disc: discrimination(items),
        items
    };
}

/** A phish counts as caught on Report, Delete or Verify (as the scorer's phishCaught). */
const CAUGHT = new Set(['report', 'delete', 'verify']);
/** A genuine item is a false alarm on Report or Delete (as the scorer's falseAlarms). Verify is not. */
const FALSE_ALARM = new Set(['report', 'delete']);

const rate = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 1000 : null);

/**
 * aw3: the discrimination figure for one round, from items that carry `phish`. Pure.
 *   phish, genuine     how many of each the round had
 *   hits               phish caught (Report, Delete or Verify; a call's Escalate is Report,
 *                      Ring back is Verify)
 *   falseAlarms        genuine items Reported or Deleted (Verify on a genuine item is the
 *                      careful move, not a false alarm)
 *   hitRate            hits / phish, 0 to 1, or null with no phish
 *   falseAlarmRate     falseAlarms / genuine, 0 to 1, or null with no genuine item
 *   index              hitRate - falseAlarmRate, -1 to 1 (Youden's J): 1 is perfect
 *                      discrimination, 0 is no better than treating everything alike (reporting
 *                      everything scores 0), or null when either rate is null
 * Returns null when no item says whether it was a phish (an older result).
 */
export function discrimination(items) {
    const known = (Array.isArray(items) ? items : []).filter((i) => isObj(i) && typeof i.phish === 'boolean');
    if (!known.length) return null;
    let phish = 0, genuine = 0, hits = 0, falseAlarms = 0;
    for (const i of known) {
        if (i.phish) {
            phish += 1;
            if (CAUGHT.has(i.verdict)) hits += 1;
        } else {
            genuine += 1;
            if (FALSE_ALARM.has(i.verdict)) falseAlarms += 1;
        }
    }
    const hitRate = rate(hits, phish);
    const falseAlarmRate = rate(falseAlarms, genuine);
    const index = hitRate === null || falseAlarmRate === null ? null : Math.round((hitRate - falseAlarmRate) * 1000) / 1000;
    return { phish, genuine, hits, falseAlarms, hitRate, falseAlarmRate, index };
}

/** The blocks held in a globals object (or a bare value). Pure; never throws. */
export function readBlocks(globals) {
    let raw = (isObj(globals) && Object.prototype.hasOwnProperty.call(globals, RECORDS_GLOBAL))
        ? globals[RECORDS_GLOBAL]
        : (Array.isArray(globals) || typeof globals === 'string' ? globals : undefined);
    if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = []; }
    }
    if (!Array.isArray(raw)) return [];
    return raw.filter((b) => isObj(b) && b.v === 1 && typeof b.key === 'string');
}

/**
 * Record a finished triage round. First answer only; nothing for an aborted
 * round or a read-only reopen.
 * deps: { writeGlobal, getGlobals } (both default to the live engine).
 * @returns {{written: boolean, reason?: 'already-recorded'|'read-only'|'aborted'}}
 */
export function recordTriageResult(result, ctx = {}, deps = {}) {
    if (!isObj(result) || result.aborted === true) return { written: false, reason: 'aborted' };
    if (result.reopened === true || !Array.isArray(result.answers)) return { written: false, reason: 'read-only' };

    const write = deps.writeGlobal || sharedWriteGlobal;
    const getGlobals = deps.getGlobals
        || (() => (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {});

    const block = buildBlock(result, ctx);
    const existing = readBlocks(getGlobals());
    if (existing.some((b) => b.key === block.key)) return { written: false, reason: 'already-recorded' };

    // Not deferred: nothing listens on this global (11 N4).
    write(RECORDS_GLOBAL, [...existing, block]);
    return { written: true };
}

/**
 * xAPI statements for one block: one per item and one for the round. Pure.
 * actor is supplied by the caller (11 S6.3). No timestamps are invented: they
 * all carry the block's own `at`.
 */
export function toXapi(block, actor) {
    if (!isObj(block)) return [];
    const base = `${XAPI_BASE}/${encodeURIComponent(block.setId || '')}`;
    const ctxExt = {
        [`${XAPI_BASE}/stage`]: block.stage,
        [`${XAPI_BASE}/variant`]: block.variant,
        [`${XAPI_BASE}/form`]: block.form,
        [`${XAPI_BASE}/episode`]: block.episodeId
    };
    const statements = (Array.isArray(block.items) ? block.items : []).map((item) => ({
        actor,
        verb: XAPI_VERBS.answered,
        object: { objectType: 'Activity', id: `${base}/items/${encodeURIComponent(item.itemId)}` },
        result: {
            response: item.action || item.verdict,
            score: { raw: item.score, min: 0, max: 100 },
            duration: `PT${(item.ms / 1000).toFixed(3)}S`,
            extensions: { [`${XAPI_BASE}/chips`]: item.chips, [`${XAPI_BASE}/verdict`]: item.verdict }
        },
        context: { extensions: ctxExt },
        timestamp: block.at
    }));
    statements.push({
        actor,
        verb: XAPI_VERBS.completed,
        object: { objectType: 'Activity', id: base },
        result: {
            completion: true,
            score: { scaled: block.percent / 100, raw: block.percent, min: 0, max: 100 },
            extensions: {
                [`${XAPI_BASE}/reportRate`]: block.reportRate,
                ...(isObj(block.disc) ? { [`${XAPI_BASE}/discrimination`]: block.disc } : {})
            }
        },
        context: { extensions: ctxExt },
        timestamp: block.at
    });
    return statements;
}
