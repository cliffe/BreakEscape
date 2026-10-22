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

/**
 * The domain string a landing-page record chose, resolved from `choices.domainId`
 * against the page's brand domain menus (07 §4). Null when nothing was chosen or the
 * id is off the menu. Used so the report's page row names the look-alike the student
 * built, not the authored link text for the real portal (lab R1 F9).
 */
function resolveDomainById(pageDef, id) {
    if (typeof id !== 'string' || !id) return null;
    const brands = Array.isArray(pageDef?.brands) ? pageDef.brands : [];
    for (const brand of brands) {
        const domains = Array.isArray(brand?.domains) ? brand.domains : [];
        const opt = domains.find((d) => d && d.id === id);
        if (opt && typeof opt.domain === 'string' && opt.domain) return opt.domain;
    }
    return null;
}

function chosenPageDomain(pageDef, rec) {
    const id = rec && typeof rec === 'object' && rec.choices && typeof rec.choices === 'object'
        ? rec.choices.domainId : null;
    return resolveDomainById(pageDef, id);
}

function personName(person) {
    const f = person?.forms || {};
    return f.full || f.first || person?.name || person?.id || '';
}

/**
 * A readable label for a metrics target id: the target's own name, else a contact's, else the
 * person's. When `preferRole` is set (engagement.report.labelBy === "role"), the target's or
 * contact's `role` is used instead, so the results table names no individual — the no-blame
 * lesson the SE lab's report is built around (lab R4 D3/F8). A target with no role falls back
 * to the name as before, so a scenario that does not opt in is unaffected.
 */
function targetNameResolver(social, preferRole = false) {
    const people = Array.isArray(social?.people) ? social.people : [];
    const byId = new Map(people.map((p) => [p.id, p]));
    const contacts = Array.isArray(social?.mailClient?.contacts) ? social.mailClient.contacts : [];
    const byTarget = new Map();
    for (const c of contacts) if (c && typeof c.targetId === 'string' && !byTarget.has(c.targetId)) byTarget.set(c.targetId, c);
    const targets = Array.isArray(social?.phishTargets) ? social.phishTargets : [];
    const targetById = new Map(targets.filter((t) => t && t.id).map((t) => [t.id, t]));
    return (targetId) => {
        const t = targetById.get(targetId);
        const c = byTarget.get(targetId);
        if (preferRole) {
            if (t && t.role) return t.role;
            if (c && c.role) return c.role;
        }
        if (t && (t.name || t.displayName)) return t.name || t.displayName;
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
    const nameOf = targetNameResolver(social, block.labelBy === 'role');
    // Row order follows the scenario's phishTargets order, then any other metrics ids sorted,
    // so it does not depend on the key order of a restored (reloaded) metrics object.
    const targetOrder = (Array.isArray(social?.phishTargets) ? social.phishTargets : [])
        .map((t) => t && t.id).filter((id) => typeof id === 'string');
    const metricIds = Object.keys(metrics);
    const mailIds = [
        ...targetOrder.filter((id, i) => targetOrder.indexOf(id) === i && Object.prototype.hasOwnProperty.call(metrics, id)),
        ...metricIds.filter((id) => !targetOrder.includes(id)).sort()
    ];
    const mail = mailIds.map((targetId) => {
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
            // The domain of the page that actually landed (stored on the victim record),
            // not the last page attached (lab R1 F9 / F8-b). Falls back to the current
            // page's chosen domain, then the authored link text, then the id.
            const landedDomain = victim && typeof victim.domainId === 'string'
                ? resolveDomainById(p, victim.domainId) : null;
            return {
                pageId: p.id,
                label: landedDomain || chosenPageDomain(p, rec) || p.linkText || p.id,
                sent: !!victim, // a victim record is written on every send that carries the page (00 §11a)
                visited: !!victim && victim.visited === true,
                submitted: !!victim && victim.submitted === true,
                noticed: !!victim && victim.noticed === true
            };
        });

    // ── results: calls ──────────────────────────────────────────────────────
    const calls = (Array.isArray(social?.pretextNpcs) ? social.pretextNpcs : [])
        // The contract keys a call by `callId` (00 §11); `id` is accepted for older data.
        .map((c) => (c && typeof c === 'object' ? { ...c, id: typeof c.callId === 'string' ? c.callId : c.id } : c))
        .filter((c) => c && typeof c.id === 'string')
        .map((c) => {
            const character = typeof c.character === 'string' ? c.character : null;
            const outcome = g['pretext_' + c.id + '_outcome'];
            const lowest = g['pretext_' + c.id + '_lowest'];
            // Count of calls that ended without a grant (reported, refused or walked away);
            // finalisePretext bumps `_reports` on every such call (06 §4.5). With a final
            // outcome of got_it this tells the row a reported/failed earlier call also happened,
            // so the report reads as two calls rather than one contradictory one (lab R3 F7).
            const failedAttempts = Number(g['pretext_' + c.id + '_reports']);
            return {
                callId: c.id,
                character,
                done: isTrue(g.pretext_call_done),
                reported: character ? isTrue(g[character + '_reported']) : false,
                outcome: typeof outcome === 'string' ? outcome : null,
                lowest: typeof lowest === 'number' ? lowest : null,
                failedAttempts: Number.isFinite(failedAttempts) ? failedAttempts : 0
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
