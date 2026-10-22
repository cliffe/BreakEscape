// The intel board's data, worked out from the scenario's `social` block and the
// persisted globals (SE contract 00 §1, §4, §5; design 03 "The loop").
//
// Pure: no DOM, no writes. The overlay calls buildBoardModel() on every open (N2)
// and draws what it returns. Readiness is not computed here: the board shows the
// `target_ready_<id>` and `osint_done` globals that evaluateReadiness sets (N3);
// the per-slot ticks are read from the held facts.

export const INTEL_PREFIX = 'se_intel_';
export const STATE_KEY = 'se_board_state';
export const NOT_IDENTIFIED = 'Not yet identified';
export const READY_TEXT = "Ready to approach — you have enough to craft something she'll believe.";

const isTrue = (v) => v === true;

export function isHeld(globals, factId) {
    return isTrue(globals?.[INTEL_PREFIX + factId]);
}

/**
 * Fact ids a pretext ask grants (`grants.intel`). Those are "From the call"
 * on the board (03 N1), not recon finds, and they are not readiness slots.
 */
export function callGrantedFactIds(social) {
    const ids = new Set();
    const calls = Array.isArray(social?.pretextNpcs) ? social.pretextNpcs : [];
    for (const call of calls) {
        const asks = call && call.asks && typeof call.asks === 'object' ? call.asks : null;
        if (!asks) continue;
        for (const ask of Object.values(asks)) {
            const intel = ask && ask.grants && ask.grants.intel;
            if (!Array.isArray(intel)) continue;
            for (const id of intel) if (typeof id === 'string' && id) ids.add(id);
        }
    }
    return ids;
}

/** A fact whose every blank value is stale (or one flagged `stale: true`). */
export function isStaleFact(fact) {
    if (!fact) return false;
    if (fact.stale === true) return true;
    const p = Array.isArray(fact.provides) ? fact.provides : [];
    return p.length > 0 && p.every((e) => e && e.kind === 'stale');
}

function personName(person) {
    const f = person?.forms || {};
    return f.full || f.first || person?.name || person?.id || '';
}

/** The person id a provides value belongs to: the longest id that prefixes `<id>_`. */
function personIdOf(value, people) {
    if (typeof value !== 'string') return null;
    let best = null;
    for (const p of people) {
        if (value.startsWith(p.id + '_') && (!best || p.id.length > best.length)) best = p.id;
    }
    return best;
}

/** What the player has already seen as ready, so a card ready since last time can say so. */
export function readBoardState(globals) {
    const raw = globals?.[STATE_KEY];
    const recon = raw && typeof raw === 'object' ? raw.recon : null;
    const seen = Array.isArray(recon?.seenReady) ? recon.seenReady.filter((s) => typeof s === 'string') : [];
    return { v: 1, ...(raw && typeof raw === 'object' ? raw : {}), recon: { ...(recon || {}), seenReady: seen } };
}

/**
 * The defender picks saved in se_board_state: { intel fact id: option id }. Ids only (00 §5).
 * Anything that is not a string-to-string entry is dropped.
 */
export function readDefenderPicks(globals) {
    const raw = readBoardState(globals).defender;
    const picks = raw && typeof raw === 'object' && raw.picks && typeof raw.picks === 'object' ? raw.picks : {};
    const out = {};
    for (const [k, v] of Object.entries(picks)) if (typeof v === 'string') out[k] = v;
    return out;
}

/** The indicator marks saved in se_board_state: { indicator id: 'block' | 'allow' }. Junk is dropped. */
export function readIndicatorMarks(globals) {
    const raw = readBoardState(globals).defender;
    const marks = raw && typeof raw === 'object' && raw.indicators && typeof raw.indicators === 'object' ? raw.indicators : {};
    const out = {};
    for (const [k, v] of Object.entries(marks)) if (v === 'block' || v === 'allow') out[k] = v;
    return out;
}

/**
 * The tells of what the player sent (00 §10a): for each tell id, the latest sent record carrying it.
 * Every mailbox's Sent folder is searched; seeded stubs and quick replies carry no tells and are skipped.
 * "Latest" is by gameTime, then by position. Pure.
 *
 * @returns {Map<string, { to: string, subject: string, targetId: string|null }>}
 */
export function sentTells(mailState) {
    const best = new Map();
    const boxes = mailState && typeof mailState === 'object' && mailState.mailboxes && typeof mailState.mailboxes === 'object'
        ? mailState.mailboxes : {};
    let order = 0;
    for (const box of Object.values(boxes)) {
        for (const rec of Array.isArray(box?.messages) ? box.messages : []) {
            order += 1;
            if (!rec || typeof rec !== 'object' || rec.folder !== 'sent' || rec.seeded === true || rec.kind === 'quickReply') continue;
            const time = Number.isFinite(rec.gameTime) ? rec.gameTime : 0;
            for (const t of Array.isArray(rec.tells) ? rec.tells : []) {
                if (typeof t !== 'string' || !t) continue;
                const cur = best.get(t);
                if (cur && (cur.time > time || (cur.time === time && cur.order > order))) continue;
                best.set(t, { time, order, to: typeof rec.to === 'string' ? rec.to : '',
                    subject: typeof rec.subject === 'string' ? rec.subject : '',
                    targetId: typeof rec.targetId === 'string' ? rec.targetId : null });
            }
        }
    }
    const out = new Map();
    for (const [t, v] of best) out.set(t, { to: v.to, subject: v.subject, targetId: v.targetId });
    return out;
}

/**
 * The optional indicators step (03 "Defender mode"; off unless `engagement.defender.indicators` is
 * authored). Each entry is `{ id, tell, text, block, why, step? }`. An indicator is shown only when a
 * sent record carries its `tell`, so the list is read from what the player really sent. The player
 * marks each shown indicator Block or Let through; the mark matching `block` is right and locks, a
 * wrong one shows `why` and can be changed. Pure.
 */
export function buildIndicatorItems(block, globals, mailState) {
    const list = Array.isArray(block?.indicators) ? block.indicators : [];
    const marks = readIndicatorMarks(globals);
    const seen = sentTells(mailState);
    return list.filter((ind) => ind && typeof ind.id === 'string' && ind.id && typeof ind.tell === 'string')
        .map((ind) => {
            const right = ind.block === true ? 'block' : 'allow';
            const marked = marks[ind.id] || null;
            const sentIn = seen.get(ind.tell) || null;
            return {
                id: ind.id,
                tell: ind.tell,
                step: typeof ind.step === 'string' ? ind.step : null,
                text: ind.text || '',
                why: ind.why || '',
                right,
                marked,
                shown: !!sentIn,
                sentIn,
                done: marked === right
            };
        });
}

/**
 * Defender mode (03 "Defender mode"; 00 §11 "Engagement mode blocks"). Pure.
 *
 * One item per `engagement.defender.factMitigations` entry, in authored order: the fact's text, its
 * `reduceNote` (the "reduce this" prompt, 00 §1), the options, and the saved pick. An item is done
 * when the saved pick is an option with `good: true`. A wrong pick keeps its `why` on show.
 *
 * Completion follows the step-binding rule: an item may carry `step`; a declared step is done when
 * every item bound to it is done; the block is done when every declared step is done, or, with no
 * `steps[]`, when every item is. An empty list is never done. Which globals still need setting is
 * returned as `toSet` (names not already true), steps first, then the block's `onCompleteGlobal`.
 *
 * Indicators (`buildIndicatorItems`, from `mailState`) are not mitigation items. They gate nothing
 * unless one names a declared step: that step then waits for its shown indicators too. A hidden
 * indicator (no sent record carries its tell) is skipped. A step bound only to hidden ones is
 * `vacuous`: it does not hold up the block, and its own global is not set until one shows.
 */
export function buildDefenderModel(social, globals, mailState = null) {
    const g = globals || {};
    const block = social?.engagement?.defender || {};
    const facts = social?.intelFacts || {};
    const picks = readDefenderPicks(g);
    const indicators = buildIndicatorItems(block, g, mailState);
    const list = Array.isArray(block.factMitigations) ? block.factMitigations : [];

    const items = list.filter((fm) => fm && typeof fm.intel === 'string').map((fm) => {
        const fact = facts[fm.intel] || {};
        const options = (Array.isArray(fm.options) ? fm.options : []).map((o) => ({
            id: o.id, text: o.text || '', good: o.good === true, why: o.why || ''
        }));
        const picked = options.find((o) => o.id === picks[fm.intel]) || null;
        return {
            intel: fm.intel,
            step: typeof fm.step === 'string' ? fm.step : null,
            text: fact.text || '',
            reduceNote: fact.reduceNote || '',
            options,
            pickedId: picked ? picked.id : null,
            picked,
            done: !!(picked && picked.good)
        };
    });

    const stepDecls = Array.isArray(block.steps) ? block.steps.filter((s) => s && s.id) : [];
    const steps = stepDecls.map((s) => {
        const bound = items.filter((i) => i.step === s.id);
        const boundInd = indicators.filter((i) => i.step === s.id);
        const live = [...bound, ...boundInd.filter((i) => i.shown)];
        // Bound only to hidden indicators: nothing to judge yet. The step does not hold up the
        // block, but its own global waits until an indicator shows and is marked (no early latch).
        const vacuous = bound.length === 0 && boundInd.length > 0 && live.length === 0;
        return { id: s.id, onCompleteGlobal: s.onCompleteGlobal || null, vacuous,
            done: live.length > 0 && live.every((i) => i.done) };
    });
    const complete = items.length > 0 && (steps.length ? steps.every((s) => s.done || s.vacuous) : items.every((i) => i.done));

    const toSet = [];
    for (const s of steps) if (s.done && s.onCompleteGlobal && !isTrue(g[s.onCompleteGlobal])) toSet.push(s.onCompleteGlobal);
    if (complete && block.onCompleteGlobal && !isTrue(g[block.onCompleteGlobal])) toSet.push(block.onCompleteGlobal);

    const shownInd = indicators.filter((i) => i.shown);
    return {
        title: block.title || 'Exposure review',
        intro: block.intro || '',
        items,
        indicators,
        indicatorsIntro: typeof block.indicatorsIntro === 'string' ? block.indicatorsIntro : '',
        indicatorsDone: shownInd.filter((i) => i.done).length,
        indicatorsShown: shownInd.length,
        steps,
        complete,
        doneCount: items.filter((i) => i.done).length,
        total: items.length,
        toSet
    };
}

/**
 * @param {object} social   scenario.social
 * @param {object} globals  gameState.globalVariables
 * @returns {object} the model (see the keys below)
 */
export function buildBoardModel(social, globals) {
    const g = globals || {};
    const facts = social?.intelFacts || {};
    const board = social?.intelBoard || {};
    const peopleDir = Array.isArray(social?.people) ? social.people : [];
    const byId = new Map(peopleDir.map((p) => [p.id, p]));
    const targetIds = Array.isArray(board.people) ? board.people : [];
    const slotMap = board.readinessSlots || {};
    const state = readBoardState(g);

    const heldIds = Object.keys(facts).filter((id) => isHeld(g, id));
    const heldLive = heldIds.filter((id) => !isStaleFact(facts[id]));
    const callFacts = callGrantedFactIds(social);
    const provided = (ids, type) => ids.flatMap((id) =>
        (facts[id].provides || []).filter((e) => e && e.type === type && e.kind !== 'stale'));

    const patternHeld = provided(heldLive, 'address').some((e) => e.rule);

    const targets = targetIds.map((id) => {
        const person = byId.get(id) || { id };
        const subjectFacts = heldIds.filter((f) => facts[f].subject === id);
        const fromCallIds = subjectFacts.filter((f) => callFacts.has(f));
        const foundIds = subjectFacts.filter((f) => !callFacts.has(f));
        // Role and address still read call facts: the player holds them.
        // Only the card's lists are split, so a call fact is not also a recon find.
        const subjectLive = subjectFacts.filter((f) => !isStaleFact(facts[f]));

        const namedBy = heldLive.some((f) => (facts[f].provides || []).some(
            (e) => e && e.type === 'name' && e.kind !== 'stale' && personIdOf(e.value, peopleDir) === id));
        const ready = isTrue(g['target_ready_' + id]);
        // A target flagged ready is known by definition (its slots include a name fact)
        const identified = namedBy || subjectFacts.length > 0 || ready;

        const teamEntry = provided(subjectLive, 'team')[0];
        const roleKnown = namedBy || !!teamEntry || provided(subjectLive, 'role').length > 0;
        const role = roleKnown ? (person.role || teamEntry?.label || provided(subjectLive, 'role')[0]?.label || null) : null;

        const fixedAddress = provided(subjectLive, 'address').some((e) => e.value);
        const address = person.address && (patternHeld || fixedAddress) ? person.address : null;

        const slots = (Array.isArray(slotMap[id]) ? slotMap[id] : []).map((s) => {
            const needsIntel = Array.isArray(s.needsIntel) ? s.needsIntel : [];
            const needsGlobal = Array.isArray(s.needsGlobal) ? s.needsGlobal : [];
            const done = needsIntel.every((f) => isHeld(g, f)) && needsGlobal.every((n) => isTrue(g[n]));
            return { label: s.label || '', done, goalString: s.goalString || '', doneString: s.doneString || '',
                needsIntel, needsGlobal };
        });

        return {
            id,
            name: identified ? personName(person) : NOT_IDENTIFIED,
            identified,
            role,
            address,
            factIds: foundIds,
            facts: foundIds.map((f) => ({ id: f, text: facts[f].text || '', stale: isStaleFact(facts[f]) })),
            fromCall: fromCallIds.map((f) => ({ id: f, text: facts[f].text || '' })),
            slots,
            emptySlots: slots.filter((s) => !s.done).map((s) => s.label),
            ready,
            status: ready ? 'ready' : 'not_ready',
            newlyReady: ready && !state.recon.seenReady.includes(id)
        };
    });

    // People named by a held fact's provides who are not themselves targets.
    const contactMap = new Map();
    for (const f of heldLive) {
        for (const e of facts[f].provides || []) {
            if (!e || (e.type !== 'name' && e.type !== 'address') || e.kind === 'stale') continue;
            const pid = personIdOf(e.value, peopleDir);
            if (!pid || targetIds.includes(pid) || contactMap.has(pid)) continue;
            const person = byId.get(pid);
            contactMap.set(pid, {
                id: pid,
                name: personName(person),
                address: e.type === 'address' && e.value ? person?.address || null : null,
                via: f
            });
        }
    }
    const contacts = [...contactMap.values()];

    const companyIds = heldIds.filter((f) => facts[f].subject === 'company' && !callFacts.has(f));
    const companyCallIds = heldIds.filter((f) => facts[f].subject === 'company' && callFacts.has(f));
    const company = {
        factIds: companyIds.filter((f) => !isStaleFact(facts[f])),
        staleIds: companyIds.filter((f) => isStaleFact(facts[f])),
        fromCallIds: companyCallIds
    };
    company.facts = company.factIds.map((f) => ({ id: f, text: facts[f].text || '' }));
    company.stale = company.staleIds.map((f) => ({ id: f, text: facts[f].text || '' }));
    company.fromCall = companyCallIds.map((f) => ({ id: f, text: facts[f].text || '' }));

    const ready = targets.filter((t) => t.ready).map((t) => t.id);
    return {
        title: board.title || 'Case file',
        scopeNote: social?.engagement?.scopeNote || '',
        targets,
        contacts,
        company,
        ready,
        newlyReady: targets.filter((t) => t.newlyReady).map((t) => t.id),
        osintDone: isTrue(g.osint_done),
        total: targets.length
    };
}

// ── scope and plan modes (03 "Modes", N4; 00 §11 "Engagement mode blocks") ─────────────────────────

export const ENGAGEMENT_MODES = ['scope', 'plan'];

/**
 * The answers saved in se_board_state for a scope or plan board: ids only (00 §5).
 *   sorted:    { sortingCardId: 'in' | 'out' }   only placements that were right; a wrong one goes back
 *   answers:   { questionCardId: optionId }
 *   picks:     { pickGroupId: optionId }
 *   confirmed: [ confirmItemId ]
 */
export function readEngagementState(globals, mode) {
    const raw = readBoardState(globals)[mode];
    const o = raw && typeof raw === 'object' ? raw : {};
    const strMap = (m) => {
        const out = {};
        if (m && typeof m === 'object') for (const [k, v] of Object.entries(m)) if (typeof v === 'string') out[k] = v;
        return out;
    };
    return {
        sorted: strMap(o.sorted),
        answers: strMap(o.answers),
        picks: strMap(o.picks),
        confirmed: Array.isArray(o.confirmed) ? o.confirmed.filter((s) => typeof s === 'string') : []
    };
}

function optionList(list) {
    return (Array.isArray(list) ? list : []).filter((o) => o && typeof o.id === 'string').map((o) => ({
        id: o.id, text: o.text || o.label || o.id, correct: o.correct === true, why: o.why || ''
    }));
}

/**
 * Scope or plan mode, from `social.engagement[mode]`. Pure.
 *
 * Items, in authored order:
 *  - `sort`    a scope card (`kind: "sort"`, or no kind but an `inScope` boolean). Done when saved in its right pile.
 *  - `question` a card with `options[{id,text,correct,why}]`. Done when its `correct` option is chosen.
 *  - `pick`    a single-select list. Plan authors `objectives[]` and `measures[]` (each option carries `step`),
 *              or `picks[{id, step, text, options[]}]`. Done when the chosen option has `correct: true`.
 *  - `confirm` `{ kind: "confirm", step, text }` in `items[]`. Done when pressed.
 *
 * Completion follows the step-binding rule (00 §11): a step is done when every item carrying its id is
 * done; the block is done when every declared step is done, or, with no `steps[]`, when every item is.
 * An empty block is never done. `toSet` lists the globals due and not yet true, steps first.
 */
export function buildEngagementModel(social, globals, mode) {
    const g = globals || {};
    const block = (social?.engagement && social.engagement[mode]) || {};
    const st = readEngagementState(g, mode);
    const items = [];
    const stepOf = (x) => (typeof x?.step === 'string' ? x.step : null);

    for (const c of Array.isArray(block.cards) ? block.cards : []) {
        if (!c || typeof c.id !== 'string') continue;
        const kind = c.kind || (Array.isArray(c.options) ? 'question' : 'sort');
        if (kind === 'question') {
            const options = optionList(c.options);
            const picked = options.find((o) => o.id === st.answers[c.id]) || null;
            items.push({ kind: 'question', id: c.id, step: stepOf(c), text: c.text || '', options,
                pickedId: picked ? picked.id : null, picked, done: !!(picked && picked.correct) });
        } else if (kind === 'sort') {
            const right = c.inScope === true ? 'in' : 'out';
            const placed = st.sorted[c.id] || null;
            items.push({ kind: 'sort', id: c.id, step: stepOf(c), text: c.text || '', right, why: c.why || '',
                placed, done: placed === right });
        }
    }

    const groups = [];
    if (Array.isArray(block.objectives)) groups.push({ id: 'objectives', text: block.objectivesPrompt || '', list: block.objectives });
    if (Array.isArray(block.measures)) groups.push({ id: 'measures', text: block.measuresPrompt || '', list: block.measures });
    for (const p of Array.isArray(block.picks) ? block.picks : []) {
        if (p && typeof p.id === 'string') groups.push({ id: p.id, text: p.text || '', list: p.options, step: stepOf(p) });
    }
    for (const gr of groups) {
        const options = optionList(gr.list);
        const step = gr.step || stepOf((gr.list || []).find((o) => stepOf(o)) || null);
        const picked = options.find((o) => o.id === st.picks[gr.id]) || null;
        items.push({ kind: 'pick', id: gr.id, step, text: gr.text, options,
            pickedId: picked ? picked.id : null, picked, done: !!(picked && picked.correct) });
    }

    for (const c of Array.isArray(block.items) ? block.items : []) {
        if (!c || c.kind !== 'confirm') continue;
        const id = typeof c.id === 'string' ? c.id : `confirm_${stepOf(c) || items.length}`;
        items.push({ kind: 'confirm', id, step: stepOf(c), text: c.text || 'Confirm', done: st.confirmed.includes(id) });
    }

    const stepDecls = Array.isArray(block.steps) ? block.steps.filter((s) => s && s.id) : [];
    const steps = stepDecls.map((s) => {
        const bound = items.filter((i) => i.step === s.id);
        return { id: s.id, title: s.title || '', onCompleteGlobal: s.onCompleteGlobal || null,
            done: bound.length > 0 && bound.every((i) => i.done) };
    });
    const complete = items.length > 0 && (steps.length ? steps.every((s) => s.done) : items.every((i) => i.done));

    const toSet = [];
    for (const s of steps) if (s.done && s.onCompleteGlobal && !isTrue(g[s.onCompleteGlobal])) toSet.push(s.onCompleteGlobal);
    if (complete && block.onCompleteGlobal && !isTrue(g[block.onCompleteGlobal])) toSet.push(block.onCompleteGlobal);

    const roe = social?.engagement?.roe && typeof social.engagement.roe === 'object' ? social.engagement.roe : null;
    return {
        mode,
        title: block.title || (mode === 'scope' ? 'Rules of engagement' : 'Engagement plan'),
        intro: block.intro || block.brief || '',
        roe: roe && mode === 'scope' ? {
            inScope: Array.isArray(roe.inScope) ? roe.inScope.filter((s) => typeof s === 'string') : [],
            outScope: Array.isArray(roe.outScope) ? roe.outScope.filter((s) => typeof s === 'string') : [],
            stopContact: typeof roe.stopContact === 'string' ? roe.stopContact : ''
        } : null,
        items, steps, complete,
        doneCount: items.filter((i) => i.done).length,
        total: items.length,
        toSet
    };
}
