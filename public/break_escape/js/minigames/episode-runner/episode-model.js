// Awareness episode model (SE design 11 N1; PHASE7_PACKETS §2.1 to §2.3). Pure: no DOM,
// no globals written. The runner (episode-runner-minigame.js) and the starter
// (systems/episode-starter.js) build on it, and the Node tests load it alone.
//
//   stagesFor(episode)            the stage ids this episode runs, in order
//   nextStage(episode, state)     the first of those not yet done, or null when finished
//   stateKey(id)                  'episode_<id>_state', the runner's state global
//   defendPrefix(id)              'episode_<id>_defend_', the defend set's global prefix
//   readState(episode, raw)       a clean state from the stored global (or a fresh one)
//   completeStage(episode, state, stageId, patch)   the state after a stage ends
//   childLaunch(episode, stage)   what the stage opens: osint, mail, triage or nothing
//   sentFromRecord(rec, targetId) the ids the write stage holds for the flip
//   measurementCtx(episode, set, launchStage, now)   ctx for recordTriageResult

export const STAGE_IDS = Object.freeze(['brief', 'osint', 'write', 'flip', 'defend', 'debrief', 'check']);
export const ATTACK_STAGES = Object.freeze(['osint', 'write', 'flip']);
export const DEFAULT_STAGES = Object.freeze({
    full: Object.freeze(['brief', 'osint', 'write', 'flip', 'defend', 'debrief']),
    defendOnly: Object.freeze(['brief', 'defend', 'debrief']),
    check: Object.freeze(['check'])
});
export const STATE_VERSION = 1;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const stateKey = (id) => `episode_${id}_state`;
export const defendPrefix = (id) => `episode_${id}_defend_`;

/** 'full' or 'defendOnly' (anything else reads as 'full'). */
export function variantOf(episode) {
    return episode?.variant === 'defendOnly' ? 'defendOnly' : 'full';
}

/** A check mission: its stages list names 'check'. */
export function isCheck(episode) {
    return Array.isArray(episode?.stages) && episode.stages.includes('check');
}

/**
 * The stages this episode runs. A check mission runs ['check'] only. Otherwise
 * the authored list in order, keeping known ids once each; a defendOnly episode
 * never runs the attack stages, whatever is authored. With no usable list, the
 * variant's default.
 */
export function stagesFor(episode) {
    if (isCheck(episode)) return [...DEFAULT_STAGES.check];
    const variant = variantOf(episode);
    const authored = Array.isArray(episode?.stages) ? episode.stages : [];
    const seen = new Set();
    const out = [];
    for (const id of authored) {
        if (!STAGE_IDS.includes(id) || id === 'check' || seen.has(id)) continue;
        if (variant === 'defendOnly' && ATTACK_STAGES.includes(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out.length ? out : [...DEFAULT_STAGES[variant]];
}

/** The first stage of stagesFor(episode) not in state.done, or null when every one is done. */
export function nextStage(episode, state) {
    const done = Array.isArray(state?.done) ? state.done : [];
    return stagesFor(episode).find((s) => !done.includes(s)) ?? null;
}

function cleanSent(raw) {
    if (!isObj(raw)) return null;
    return {
        recordId: isStr(raw.recordId) ? raw.recordId : null,
        targetId: isStr(raw.targetId) ? raw.targetId : null,
        templateId: isStr(raw.templateId) ? raw.templateId : null,
        blankIds: Array.isArray(raw.blankIds) ? raw.blankIds.filter(isStr) : []
    };
}

function cleanDefend(raw) {
    if (!isObj(raw)) return null;
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    return { percent: num(raw.percent), reportRate: num(raw.reportRate), verifyCount: num(raw.verifyCount) };
}

/**
 * A clean state from the stored global. Unknown or out-of-list stage ids are
 * dropped, so a reopen always resumes at a stage this episode runs. A missing
 * or empty global gives a fresh state at the first stage.
 */
export function readState(episode, raw) {
    const stages = stagesFor(episode);
    const src = isObj(raw) ? raw : {};
    const done = [];
    for (const id of Array.isArray(src.done) ? src.done : []) {
        if (stages.includes(id) && !done.includes(id)) done.push(id);
    }
    const state = {
        v: STATE_VERSION,
        variant: variantOf(episode),
        stage: null,
        done,
        sent: cleanSent(src.sent),
        defend: cleanDefend(src.defend)
    };
    state.stage = nextStage(episode, state);
    return state;
}

/**
 * The state after `stageId` ends: it joins `done`, `stage` moves to the next
 * stage not done (null when finished), and `patch` (sent, defend) is merged.
 * The flip clears `sent`: it is held only to feed the flip (11 §5.2).
 */
export function completeStage(episode, state, stageId, patch = {}) {
    const base = readState(episode, state);
    const done = base.done.includes(stageId) || !stagesFor(episode).includes(stageId)
        ? base.done : [...base.done, stageId];
    const next = { ...base, done };
    if ('sent' in patch) next.sent = cleanSent(patch.sent);
    if ('defend' in patch) next.defend = cleanDefend(patch.defend);
    if (stageId === 'flip') next.sent = null;
    next.stage = nextStage(episode, next);
    return next;
}

/**
 * What a stage opens (§2.3). Every launch carries only this episode's own ids.
 *   { kind: 'osint', sceneType: 'osint-browser', params: { siteIds } }
 *   { kind: 'mail', sceneType: 'mail-client', params: { accountIds, defaultAccount, maxSends: 1, layout? } }
 *   { kind: 'triage', options: { triageSetId, stage?, conclusionTaskId } }
 *   null for brief, flip and debrief (drawn by the runner itself)
 */
export function childLaunch(episode, stage) {
    const attack = isObj(episode?.attack) ? episode.attack : {};
    const defend = isObj(episode?.defend) ? episode.defend : {};
    if (stage === 'osint') {
        return { kind: 'osint', sceneType: 'osint-browser',
                 params: { siteIds: Array.isArray(attack.siteIds) ? [...attack.siteIds] : [] } };
    }
    if (stage === 'write') {
        const params = {
            accountIds: Array.isArray(attack.accountIds) ? [...attack.accountIds] : [],
            defaultAccount: attack.defaultAccount ?? null,
            maxSends: 1
        };
        if (isStr(attack.layout)) params.layout = attack.layout;
        return { kind: 'mail', sceneType: 'mail-client', params };
    }
    if (stage === 'defend' || stage === 'check') {
        const options = { triageSetId: defend.setId ?? null, conclusionTaskId: episode?.conclusionTaskId ?? null };
        if (isStr(defend.stage)) options.stage = defend.stage;
        return { kind: 'triage', options };
    }
    return null;
}

/** The ids the write stage holds for the flip; never the message text (11 §5.2). */
export function sentFromRecord(rec, targetId = null) {
    if (!isObj(rec)) return null;
    const templates = isObj(rec.templates) ? Object.values(rec.templates).filter(isStr) : [];
    return {
        recordId: isStr(rec.id) ? rec.id : null,
        targetId: isStr(rec.targetId) ? rec.targetId : (isStr(targetId) ? targetId : null),
        templateId: templates[0] ?? null,
        blankIds: isObj(rec.slots) ? Object.keys(rec.slots) : []
    };
}

/**
 * The sent record the write stage produced. `sentIds` (the mail client's result
 * from P7-G on) wins: its newest id that is a sent record to the target. Without
 * it, the newest sent record to the target in mailState. Null when there is none.
 */
export function findSentRecord(mailState, targetId, sentIds = null) {
    const boxes = isObj(mailState?.mailboxes) ? mailState.mailboxes : {};
    const all = [];
    for (const box of Object.values(boxes)) {
        for (const rec of Array.isArray(box?.messages) ? box.messages : []) {
            if (!isObj(rec) || rec.folder !== 'sent' || rec.seeded === true || rec.kind === 'quickReply') continue;
            if (isStr(targetId) && rec.targetId !== targetId) continue;
            all.push(rec);
        }
    }
    if (Array.isArray(sentIds) && sentIds.length) {
        for (let i = sentIds.length - 1; i >= 0; i--) {
            const hit = all.find((r) => r.id === sentIds[i]);
            if (hit) return hit;
        }
    }
    if (!all.length) return null;
    const time = (r) => (Number.isFinite(r.gameTime) ? r.gameTime : 0);
    return all.reduce((best, r) => (time(r) >= time(best) ? r : best), all[0]);
}

/** The playerSent entry the flip replays: the defend set's own for the target, else a bare one. */
export function flipEntry(episode, set) {
    const target = episode?.attack?.target ?? null;
    const msgs = Array.isArray(set?.messages) ? set.messages : [];
    const own = msgs.find((m) => isObj(m) && m.kind === 'playerSent' && m.targetId === target);
    return own || { id: 'episode_flip', kind: 'playerSent', targetId: target };
}

/**
 * The ctx for recordTriageResult (§2.5). `launchStage` is the triage stage the
 * runner passed (defend.stage); a check records as 'pre' or 'post', anything
 * else as 'episode'.
 */
export function measurementCtx(episode, set, launchStage = null, now = Date.now()) {
    const stage = launchStage || set?.stage;
    return {
        setId: set?.id ?? episode?.defend?.setId ?? null,
        form: set?.id ?? episode?.defend?.setId ?? null,
        stage: stage === 'pre' || stage === 'post' ? stage : 'episode',
        episodeId: episode?.id ?? null,
        variant: variantOf(episode),
        now
    };
}

/** The defend summary kept in the state global: numbers only. */
export function defendSummary(result) {
    return cleanDefend(result) || { percent: 0, reportRate: 0, verifyCount: 0 };
}
