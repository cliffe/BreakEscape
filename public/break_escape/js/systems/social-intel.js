/**
 * Intel facts and the readiness rule (00 §4, §5; 02 N2; implementation plan Phase 1a).
 *
 * grantFact(id) is the one award path for a fact, whether it comes from the OSINT
 * browser, a call grant (06), a mail highlight or a stand-in `grant_fact` action. It is
 * flip-only: a second grant of the same fact does nothing at all. On the first grant it
 *
 *   1. writes se_intel_<id> = true through the shared writer (global-writer.js),
 *   2. emits `intel_collected` (a live-UI flourish; the global is the source of truth),
 *   3. adds an evidence note with window.addNote,
 *   4. calls window.stateSync?.sync() so a reload straight after loses nothing,
 *   5. runs evaluateReadiness, which sets target_ready_<id> and osint_done.
 *
 * Writes go through writeGlobal, so cached ink stories and the open chat see them.
 */

import { writeGlobal } from './global-writer.js';

export const INTEL_PREFIX = 'se_intel_';
export const READY_PREFIX = 'target_ready_';

/** The global that holds a fact (docs write bare ids; the engine uses the prefixed name). */
export const intelGlobal = (id) => `${INTEL_PREFIX}${id}`;

const socialOf = (scenario) =>
    scenario || ((typeof window !== 'undefined') ? window.gameScenario : null) || null;

const globalsOf = () => ((typeof window !== 'undefined') ? window.gameState?.globalVariables : null) || null;

/** A slot is done when every fact it needs is held and every global it needs is true. */
export function slotDone(slot, globals) {
    const g = globals || {};
    const intel = Array.isArray(slot?.needsIntel) ? slot.needsIntel : [];
    const flags = Array.isArray(slot?.needsGlobal) ? slot.needsGlobal : [];
    return intel.every((id) => g[intelGlobal(id)] === true) && flags.every((name) => g[name] === true);
}

/**
 * Pure: which targets are ready, and whether the whole board is. A target with no
 * slots is not ready (an empty list would otherwise pass vacuously).
 *
 * @param {Object<string, Array>} readinessSlots  keyed by target id (00 §4)
 * @param {Object} globals                         gameState.globalVariables
 * @param {string[]} [people]                      intelBoard.people; osintDone needs every one ready
 * @returns {{ ready: Object<string, boolean>, osintDone: boolean }}
 */
export function computeReadiness(readinessSlots, globals, people = null) {
    const ready = {};
    for (const [id, slots] of Object.entries(readinessSlots || {})) {
        ready[id] = Array.isArray(slots) && slots.length > 0 && slots.every((slot) => slotDone(slot, globals));
    }
    const ids = Array.isArray(people) ? people : Object.keys(ready);
    const osintDone = ids.length > 0 && ids.every((id) => ready[id] === true);
    return { ready, osintDone };
}

/**
 * Set target_ready_<id> for each target whose slots are all done, and osint_done when
 * every id in intelBoard.people is ready. Each write happens once, on the false-to-true
 * flip; a flag never goes back to false here. Run after every fact grant.
 *
 * @param {Object<string, Array>} readinessSlots
 * @param {Object} [globals]   defaults to gameState.globalVariables
 * @param {Object} [opts]
 * @param {string[]} [opts.people]  intelBoard.people (defaults to every id in readinessSlots)
 * @param {Object} [opts.engine]    the calling story's engine, passed to the writer
 * @param {string} [opts.npcId]
 * @returns {{ newlyReady: string[], osintDone: boolean, osintDoneSet: boolean }}
 */
export function evaluateReadiness(readinessSlots, globals = globalsOf(), { people = null, engine = null, npcId = null } = {}) {
    const result = { newlyReady: [], osintDone: false, osintDoneSet: false };
    if (!readinessSlots || !globals) return result;
    const { ready, osintDone } = computeReadiness(readinessSlots, globals, people);
    const opts = { engine, npcId };
    for (const [id, isReady] of Object.entries(ready)) {
        const name = `${READY_PREFIX}${id}`;
        if (isReady && globals[name] !== true) {
            writeGlobal(name, true, opts);
            result.newlyReady.push(id);
        }
    }
    result.osintDone = osintDone || globals.osint_done === true;
    if (osintDone && globals.osint_done !== true) {
        writeGlobal('osint_done', true, opts);
        result.osintDoneSet = true;
    }
    return result;
}

/** Every global named by a readiness slot's needsGlobal, once each, in slot order. */
export function readinessGlobalNames(readinessSlots) {
    const names = new Set();
    for (const slots of Object.values(readinessSlots || {})) {
        for (const slot of Array.isArray(slots) ? slots : []) {
            for (const name of Array.isArray(slot?.needsGlobal) ? slot.needsGlobal : []) {
                if (typeof name === 'string' && name) names.add(name);
            }
        }
    }
    return [...names];
}

/**
 * A needsGlobal slot is re-checked when the global it names changes, not only when a fact
 * is granted. Subscribes one listener per named global to `global_variable_changed:<name>`
 * (once per dispatcher and name), and runs evaluateReadiness once now, so a value restored
 * from a save counts. A scenario with no needsGlobal slot (every shipped mission) gets no
 * listener and no write. A target that becomes ready from a change shows the same
 * "Ready to approach" toast as a fact grant. Called from game.js after the globals load.
 *
 * @param {Object} [opts]
 * @param {Object} [opts.scenario]    defaults to window.gameScenario
 * @param {Object} [opts.dispatcher]  defaults to window.eventDispatcher
 * @returns {string[]} the global names watched
 */
export function watchReadinessGlobals({ scenario = null, dispatcher = null } = {}) {
    const events = dispatcher || ((typeof window !== 'undefined') ? window.eventDispatcher : null);
    const names = readinessGlobalNames(socialOf(scenario)?.social?.intelBoard?.readinessSlots);
    if (!names.length || typeof events?.on !== 'function') return [];

    // Read the board at event time: the scenario object is the one loaded when the change lands.
    const recheck = ({ toast }) => {
        const board = socialOf(null)?.social?.intelBoard || socialOf(scenario)?.social?.intelBoard;
        const globals = globalsOf();
        if (!board?.readinessSlots || !globals) return null;
        const res = evaluateReadiness(board.readinessSlots, globals, { people: board.people });
        if (toast && res.newlyReady.length && typeof window !== 'undefined') {
            window.gameAlert?.(readyToastText(res.newlyReady), 'success', readyToastTitle(), 6000);
        }
        return res;
    };

    if (!events.__readinessWatched) events.__readinessWatched = new Set();
    for (const name of names) {
        if (events.__readinessWatched.has(name)) continue;
        events.__readinessWatched.add(name);
        events.on(`global_variable_changed:${name}`, () => recheck({ toast: true }));
    }
    recheck({ toast: false });
    return names;
}

/**
 * Display label for a fact: its own `label` if the scenario gives one, else its text.
 */
export function factLabel(fact, id) {
    return (fact && (fact.label || fact.text)) || id;
}

/**
 * The one naming rule (03 People cards): a person's display name once the player holds
 * a name form for them or any fact with them as subject (counting the fact being
 * granted now); otherwise a neutral label, never the cast id.
 */
export function subjectLabel(social, fact, grantedId, globals) {
    const subject = fact?.subject;
    if (!subject || subject === 'company') return 'the company';
    // A declared intelBoard.groups panel (a non-person subject) is named by its title.
    const group = (Array.isArray(social?.intelBoard?.groups) ? social.intelBoard.groups : []).find((g) => g?.subject === subject);
    if (group) return (typeof group.title === 'string' && group.title.trim()) ? group.title : subject;
    const person = (social?.people || []).find((p) => p.id === subject);
    const facts = social?.intelFacts || {};
    const held = (factId) => factId === grantedId || (globals || {})[intelGlobal(factId)] === true;
    const heldFacts = Object.keys(facts).filter(held).map((k) => facts[k]);
    const knowsName = heldFacts.some((f) =>
        f?.subject === subject ||
        (Array.isArray(f?.provides) && f.provides.some((p) => p?.type === 'name' && typeof p.value === 'string' && p.value.startsWith(`${subject}_`))));
    const name = person?.forms?.full || person?.name;
    return (knowsName && name) ? name : 'a colleague';
}

/**
 * Grant one fact. Flip-only.
 *
 * @param {string} id   bare fact id (pierce_role), or the prefixed se_intel_ name
 * @param {Object} [opts]
 * @param {Object} [opts.scenario]  the scenario (defaults to window.gameScenario)
 * @param {Object} [opts.engine]    the calling story's engine (for the writer)
 * @param {string} [opts.npcId]
 * @param {string} [opts.source]    label for the intel_collected event
 * @returns {{ granted: boolean, id: string, label?: string, subject?: string,
 *            readiness?: Object }}
 */
export function grantFact(id, { scenario = null, engine = null, npcId = null, source = 'scenario' } = {}) {
    if (typeof id !== 'string' || !id) return { granted: false, id };
    const bare = id.startsWith(INTEL_PREFIX) ? id.slice(INTEL_PREFIX.length) : id;
    const globals = globalsOf();
    if (!globals) return { granted: false, id: bare };

    const social = socialOf(scenario)?.social || null;
    const facts = social?.intelFacts || null;
    const fact = facts ? facts[bare] : null;
    if (facts && !fact) {
        console.warn(`[social-intel] Unknown fact "${bare}": not granted`);
        return { granted: false, id: bare };
    }

    const name = intelGlobal(bare);
    if (globals[name] === true) return { granted: false, id: bare }; // flip-only: nothing else runs

    writeGlobal(name, true, { engine, npcId });

    const label = factLabel(fact, bare);
    const subject = subjectLabel(social, fact, bare, globals);
    window.eventDispatcher?.emit('intel_collected', { id: bare, fact: bare, label, subject, source });

    if (fact?.text && typeof window.addNote === 'function') {
        window.addNote(`Evidence: ${subject}`, fact.text, false);
    }
    try { window.stateSync?.sync?.(); } catch (e) { /* a failed save retries on the timer */ }

    const board = social?.intelBoard;
    const readiness = board?.readinessSlots
        ? evaluateReadiness(board.readinessSlots, globals, { people: board.people, engine, npcId })
        : null;
    return { granted: true, id: bare, label, subject, readiness };
}

// How to act on a ready target, per channel (the keys of social.characters.<id>.channels).
const READY_CHANNEL_TEXT = {
    email: 'write to them from a mail terminal',
    phone: 'call them',
    person: 'go and talk to them in person'
};

/** The ready toast's title: `intelBoard.labels.toastTitle`, else "Ready to approach". */
export function readyToastTitle(scenario = null) {
    const t = socialOf(scenario)?.social?.intelBoard?.labels?.toastTitle;
    return (typeof t === 'string' && t.trim()) ? t : 'Ready to approach';
}

/**
 * The body of the "Ready to approach" toast for the targets that have just become ready.
 * `social.intelBoard.readyToast` overrides it. Otherwise it is built from each target's
 * channels in social.characters (email, then phone, then person); a target with no character
 * entry is a phishTargets mail target, so it reads as email.
 *
 * @param {string[]} targetIds  readiness.newlyReady
 * @param {Object} [scenario]   the scenario (defaults to window.gameScenario)
 * @returns {string}
 */
export function readyToastText(targetIds, scenario = null) {
    const social = socialOf(scenario)?.social || null;
    const custom = social?.intelBoard?.readyToast;
    if (typeof custom === 'string' && custom.trim()) return custom;
    const chars = social?.characters || {};
    const used = new Set();
    for (const id of targetIds || []) {
        const channels = chars[id]?.channels;
        const keys = (channels && typeof channels === 'object')
            ? Object.keys(READY_CHANNEL_TEXT).filter((k) => channels[k])
            : ['email'];
        (keys.length ? keys : ['email']).forEach((k) => used.add(k));
    }
    if (!used.size) used.add('email');
    const ways = Object.keys(READY_CHANNEL_TEXT).filter((k) => used.has(k)).map((k) => READY_CHANNEL_TEXT[k]);
    return `You know enough to approach now — ${ways.join(', or ')}.`;
}
