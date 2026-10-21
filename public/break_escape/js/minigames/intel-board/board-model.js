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
    const provided = (ids, type) => ids.flatMap((id) =>
        (facts[id].provides || []).filter((e) => e && e.type === type && e.kind !== 'stale'));

    const patternHeld = provided(heldLive, 'address').some((e) => e.rule);

    const targets = targetIds.map((id) => {
        const person = byId.get(id) || { id };
        const subjectFacts = heldIds.filter((f) => facts[f].subject === id);
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
            factIds: subjectFacts,
            facts: subjectFacts.map((f) => ({ id: f, text: facts[f].text || '', stale: isStaleFact(facts[f]) })),
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

    const companyIds = heldIds.filter((f) => facts[f].subject === 'company');
    const company = {
        factIds: companyIds.filter((f) => !isStaleFact(facts[f])),
        staleIds: companyIds.filter((f) => isStaleFact(facts[f]))
    };
    company.facts = company.factIds.map((f) => ({ id: f, text: facts[f].text || '' }));
    company.stale = company.staleIds.map((f) => ({ id: f, text: facts[f].text || '' }));

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
