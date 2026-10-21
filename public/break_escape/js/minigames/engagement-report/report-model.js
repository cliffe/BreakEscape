// The engagement report's data, worked out from the scenario's `social.engagement.report`
// block and the records the other components keep (SE design 10 stage 6, N1, N2; 00 §11).
//
// Pure: no DOM, no writes. The overlay calls buildReportModel() on every open and draws
// what it returns. The report stores nothing of its own beyond the student's in-progress
// pairings in `se_report_state` (ids only); every result is read live:
//
//   - Mail, per target, from `mailState.metrics[targetId]` (00 §10a): sent, failed, landed,
//     firstTryLanded. Names resolve from the scenario's people/contacts/targets.
//   - Page, per `social.landingPages` entry, from `se_landing_pages[pageId].victim` (00 §11a):
//     visited / submitted / noticed. "no page sent" when no record carries a victim.
//   - Call, per `social.pretextNpcs` entry, from the pretext globals (06 N8): pretext_call_done,
//     the character's `<character>_reported`, and the latest call's `pretext_<callId>_outcome`
//     and `_lowest`.
//
// Completion follows the step-binding rule the board uses (03 N6; board-model.js):
// the `results` step is done when every `confirm` item bound to it has been pressed; the
// `findings` step is done when every finding bound to it has a correct root cause and a
// correct control chosen. A step's `onCompleteGlobal` is set when its items are done, and
// the block's `onCompleteGlobal` (report_filed) when every step is done.

export const STATE_KEY = 'se_report_state';

const isTrue = (v) => v === true;
const int = (v) => (Number.isFinite(v) ? v : 0);

function personName(person) {
    const f = person?.forms || {};
    return f.full || f.first || person?.name || person?.id || '';
}

/** A readable name for a metrics target id: the target's own, else a contact's, else the person's. */
function targetNameResolver(social) {
    const people = Array.isArray(social?.people) ? social.people : [];
    const byId = new Map(people.map((p) => [p.id, p]));
    const contacts = Array.isArray(social?.mailClient?.contacts) ? social.mailClient.contacts : [];
    const byTarget = new Map();
    for (const c of contacts) if (c && typeof c.targetId === 'string' && !byTarget.has(c.targetId)) byTarget.set(c.targetId, c);
    const targets = Array.isArray(social?.phishTargets) ? social.phishTargets : [];
    const targetById = new Map(targets.filter((t) => t && t.id).map((t) => [t.id, t]));
    return (targetId) => {
        const t = targetById.get(targetId);
        if (t && (t.name || t.displayName)) return t.name || t.displayName;
        const c = byTarget.get(targetId);
        if (c) {
            if (c.name) return c.name;
            if (c.person && byId.has(c.person)) return personName(byId.get(c.person));
        }
        if (byId.has(targetId)) return personName(byId.get(targetId));
        return targetId;
    };
}

/**
 * The report's in-progress pairings, ids only (00 §11). Anything else in the stored object is
 * dropped: `confirmed` is a list of confirm-item ids (a confirm item's id is its own `id` or,
 * when it has none, its `step`); `findings` maps a finding id to `{ cause?, control? }` option ids.
 */
export function readReportState(globals) {
    const raw = globals?.[STATE_KEY];
    const o = raw && typeof raw === 'object' ? raw : {};
    const confirmed = Array.isArray(o.confirmed) ? o.confirmed.filter((s) => typeof s === 'string') : [];
    const findingsRaw = o.findings && typeof o.findings === 'object' ? o.findings : {};
    const findings = {};
    for (const [k, v] of Object.entries(findingsRaw)) {
        if (!v || typeof v !== 'object') continue;
        const pair = {};
        if (typeof v.cause === 'string') pair.cause = v.cause;
        if (typeof v.control === 'string') pair.control = v.control;
        findings[k] = pair;
    }
    return { v: 1, confirmed, findings };
}

/** A confirm item's stable id: its authored `id`, or its `step` when it carries none. */
export function confirmId(item) {
    if (!item) return null;
    if (typeof item.id === 'string' && item.id) return item.id;
    if (typeof item.step === 'string' && item.step) return item.step;
    return null;
}

function optList(raw) {
    return (Array.isArray(raw) ? raw : []).filter((o) => o && typeof o.id === 'string').map((o) => ({
        id: o.id, text: o.text || '', correct: o.correct === true, blame: o.blame === true, why: o.why || ''
    }));
}

/**
 * @param {object} social     scenario.social
 * @param {object} globals    gameState.globalVariables
 * @param {object} mailState  the live mailState (window.mailState); its `metrics` is read
 * @returns {object} the model (see the keys below)
 */
export function buildReportModel(social, globals, mailState) {
    const g = globals || {};
    const block = social?.engagement?.report || {};
    const state = readReportState(g);

    // ── results: mail ───────────────────────────────────────────────────────
    const metrics = mailState && typeof mailState.metrics === 'object' && mailState.metrics ? mailState.metrics : {};
    const nameOf = targetNameResolver(social);
    const mail = Object.keys(metrics).map((targetId) => {
        const m = metrics[targetId] && typeof metrics[targetId] === 'object' ? metrics[targetId] : {};
        return {
            targetId,
            name: nameOf(targetId),
            sent: int(m.sent),
            failed: int(m.failed),
            landed: int(m.landed),
            firstTryLanded: m.firstTryLanded === true
        };
    });

    // ── results: pages ──────────────────────────────────────────────────────
    const pageRecords = g.se_landing_pages && typeof g.se_landing_pages === 'object' ? g.se_landing_pages : {};
    const pages = (Array.isArray(social?.landingPages) ? social.landingPages : [])
        .filter((p) => p && typeof p.id === 'string')
        .map((p) => {
            const rec = pageRecords[p.id];
            const victim = rec && typeof rec === 'object' && rec.victim && typeof rec.victim === 'object' ? rec.victim : null;
            return {
                pageId: p.id,
                label: p.linkText || p.id,
                sent: !!victim, // a victim record is written on every send that carries the page (00 §11a)
                visited: !!victim && victim.visited === true,
                submitted: !!victim && victim.submitted === true,
                noticed: !!victim && victim.noticed === true
            };
        });

    // ── results: calls ──────────────────────────────────────────────────────
    const calls = (Array.isArray(social?.pretextNpcs) ? social.pretextNpcs : [])
        .filter((c) => c && typeof c.id === 'string')
        .map((c) => {
            const character = typeof c.character === 'string' ? c.character : null;
            const outcome = g['pretext_' + c.id + '_outcome'];
            const lowest = g['pretext_' + c.id + '_lowest'];
            return {
                callId: c.id,
                character,
                done: isTrue(g.pretext_call_done),
                reported: character ? isTrue(g[character + '_reported']) : false,
                outcome: typeof outcome === 'string' ? outcome : null,
                lowest: typeof lowest === 'number' ? lowest : null
            };
        });

    // ── confirm items (the results step) ──────────────────────────────────────
    const items = (Array.isArray(block.items) ? block.items : [])
        .filter((i) => i && i.kind === 'confirm')
        .map((i) => {
            const id = confirmId(i);
            return { id, step: typeof i.step === 'string' ? i.step : null, text: i.text || '',
                confirmed: !!id && state.confirmed.includes(id) };
        });

    // ── findings (the findings step) ──────────────────────────────────────────
    const findings = (Array.isArray(block.findings) ? block.findings : [])
        .filter((f) => f && typeof f.id === 'string')
        .map((f) => {
            const saved = state.findings[f.id] || {};
            const rootCauses = optList(f.rootCauses);
            const controls = optList(f.controls);
            const pickedCause = rootCauses.find((o) => o.id === saved.cause) || null;
            const pickedControl = controls.find((o) => o.id === saved.control) || null;
            const causeDone = !!(pickedCause && pickedCause.correct);
            const controlDone = !!(pickedControl && pickedControl.correct);
            return {
                id: f.id,
                step: typeof f.step === 'string' ? f.step : null,
                text: f.text || '',
                rootCauses,
                controls,
                pickedCause,
                pickedControl,
                pickedCauseId: pickedCause ? pickedCause.id : null,
                pickedControlId: pickedControl ? pickedControl.id : null,
                causeDone,
                controlDone,
                done: causeDone && controlDone
            };
        });

    // ── steps and completion ──────────────────────────────────────────────────
    const stepDecls = Array.isArray(block.steps) ? block.steps.filter((s) => s && s.id) : [];
    const stepDone = (id) => {
        const confItems = items.filter((i) => i.step === id);
        const boundFindings = findings.filter((f) => f.step === id);
        if (!confItems.length && !boundFindings.length) return false; // an empty step is never done
        const confOk = confItems.length ? confItems.every((i) => i.confirmed) : true;
        const findOk = boundFindings.length ? boundFindings.every((f) => f.done) : true;
        return confOk && findOk;
    };
    const steps = stepDecls.map((s) => ({ id: s.id, onCompleteGlobal: s.onCompleteGlobal || null, done: stepDone(s.id) }));
    const complete = steps.length > 0 && steps.every((s) => s.done);

    const toSet = [];
    for (const s of steps) if (s.done && s.onCompleteGlobal && !isTrue(g[s.onCompleteGlobal])) toSet.push(s.onCompleteGlobal);
    if (complete && block.onCompleteGlobal && !isTrue(g[block.onCompleteGlobal])) toSet.push(block.onCompleteGlobal);

    return {
        title: block.title || 'Engagement report',
        intro: block.intro || '',
        results: {
            mail,
            pages,
            calls,
            // This test cannot see whether staff reported the attempts; a live engagement would add it (stage 6).
            unseenNote: block.unseenNote ||
                'This test cannot see whether staff reported the attempts. A live engagement would measure that too.'
        },
        items,
        findings,
        steps,
        complete,
        onCompleteGlobal: block.onCompleteGlobal || null,
        toSet
    };
}
