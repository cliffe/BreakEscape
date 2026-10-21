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
 */
export function buildDefenderModel(social, globals) {
    const g = globals || {};
    const block = social?.engagement?.defender || {};
    const facts = social?.intelFacts || {};
    const picks = readDefenderPicks(g);
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
        return { id: s.id, onCompleteGlobal: s.onCompleteGlobal || null,
            done: bound.length > 0 && bound.every((i) => i.done) };
    });
    const complete = items.length > 0 && (steps.length ? steps.every((s) => s.done) : items.every((i) => i.done));

    const toSet = [];
    for (const s of steps) if (s.done && s.onCompleteGlobal && !isTrue(g[s.onCompleteGlobal])) toSet.push(s.onCompleteGlobal);
    if (complete && block.onCompleteGlobal && !isTrue(g[block.onCompleteGlobal])) toSet.push(block.onCompleteGlobal);

    return {
        title: block.title || 'Exposure review',
        intro: block.intro || '',
        items,
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
