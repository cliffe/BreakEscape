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
 *   no free text is stored: only ids, enums, numbers and a timestamp.
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
        items
    };
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
            extensions: { [`${XAPI_BASE}/reportRate`]: block.reportRate }
        },
        context: { extensions: ctxExt },
        timestamp: block.at
    });
    return statements;
}
