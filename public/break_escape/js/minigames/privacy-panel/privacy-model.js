// Privacy-settings panel: the pure model (ENG-13). A list of settings, each naming the found OSINT
// fact(s) it closes. Turning a setting to its tight position marks those facts closed in the
// panel's own view, which is a teaching effect: nothing here writes a global, so the intel board
// and every later stage read the same found-fact state as before. Unscored.
//
//   normaliseConfig(raw)            a clean config from authored data (bad entries dropped)
//   factKey(id)                     a fact id with any `se_intel_` prefix removed
//   buildView(config, social, globals, tight)
//                                   the panel's rows: settings, their facts, open or closed, counts
//   privacyText(key, config, tokens)  one line of wording: config.strings[key], else the default
//
// The facts come from `social.intelFacts` (the text a fact shows is the board's own). Whether a
// fact is also "on the board" is read from the `se_intel_<id>` globals, read-only; a defend-only
// shell has none held, and the panel still lists the facts it was authored to close.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const INTEL_PREFIX = 'se_intel_';
export const OPEN = 'open';
export const TIGHT = 'tight';

/** The default wording; `config.strings` replaces any line. {closed}, {total} are filled in. */
export const DEFAULT_TEXT = Object.freeze({
    title: 'Privacy settings',
    heading: 'Tighten the settings',
    intro: 'Each switch below is a setting on a profile. Turn one to tight and see which of the facts an attacker could find it closes.',
    switchOpen: 'Open',
    switchTight: 'Tight',
    factOpen: 'Still visible',
    factClosed: 'Closed',
    onBoard: 'On the board',
    leaveOff: 'Leave this off: ',
    counter: '{closed} of {total} facts closed',
    allClosed: 'Every fact on this page is closed.',
    done: 'Done',
    noSettings: 'There are no settings to change.'
});

/** One line of wording with {tokens} filled in. */
export function privacyText(key, config = null, tokens = null) {
    const own = isObj(config?.strings) ? config.strings[key] : null;
    let s = isStr(own) ? own : (DEFAULT_TEXT[key] ?? '');
    if (tokens) for (const [k, v] of Object.entries(tokens)) s = s.split(`{${k}}`).join(String(v));
    return s;
}

export function factKey(id) {
    return isStr(id) && id.startsWith(INTEL_PREFIX) ? id.slice(INTEL_PREFIX.length) : id;
}

/** The inline facts of a config: id (any se_intel_ prefix removed) -> { text, reduceNote? }. */
function inlineFacts(raw) {
    const out = {};
    if (!isObj(raw)) return out;
    for (const [id, f] of Object.entries(raw)) {
        if (!isObj(f) || !isStr(f.text)) continue;
        out[factKey(id)] = { text: f.text, ...(isStr(f.reduceNote) ? { reduceNote: f.reduceNote } : {}) };
    }
    return out;
}

/** A clean config: settings with unique ids, a label and at least one fact; null when none are usable. */
export function normaliseConfig(raw) {
    if (!isObj(raw) || !Array.isArray(raw.settings)) return null;
    const seen = new Set();
    const settings = [];
    for (const s of raw.settings) {
        if (!isObj(s) || !isStr(s.id) || !isStr(s.label) || seen.has(s.id)) continue;
        const closes = (Array.isArray(s.closesFacts) ? s.closesFacts : []).filter(isStr).map(factKey);
        if (!closes.length) continue;
        seen.add(s.id);
        settings.push({
            id: s.id,
            label: s.label,
            hint: isStr(s.hint) ? s.hint : '',
            section: isStr(s.section) ? s.section : '',
            closesFacts: [...new Set(closes)],
            default: s.default === TIGHT ? TIGHT : OPEN
        });
    }
    if (!settings.length) return null;
    return {
        settings,
        note: isStr(raw.note) ? raw.note : '',
        strings: isObj(raw.strings) ? raw.strings : {},
        // Inline fact text, so a mission with no social.intelFacts can name its own facts:
        // { <fact id>: { text, reduceNote? } }. Read before social.intelFacts.
        facts: inlineFacts(raw.facts)
    };
}

/** The settings that start tight (`default: "tight"`), as a Set of ids. */
export function initialTight(config) {
    return new Set((config?.settings || []).filter((s) => s.default === TIGHT).map((s) => s.id));
}

/**
 * The panel's rows for the settings now tight. A fact is closed when any tight setting names it.
 * Read-only: `social` and `globals` are never changed.
 */
export function buildView(config, social, globals, tight) {
    const board = isObj(social?.intelFacts) ? social.intelFacts : {};
    const own = isObj(config.facts) ? config.facts : {};
    const facts = {};
    for (const id of new Set([...Object.keys(board), ...Object.keys(own)])) {
        facts[id] = { ...(isObj(board[id]) ? board[id] : {}), ...(own[id] || {}) };
    }
    const g = isObj(globals) ? globals : {};
    const on = tight instanceof Set ? tight : new Set(tight || []);
    const closedIds = new Set();
    for (const s of config.settings) if (on.has(s.id)) for (const f of s.closesFacts) closedIds.add(f);

    const settings = config.settings.map((s) => ({
        id: s.id,
        label: s.label,
        hint: s.hint,
        section: s.section,
        tight: on.has(s.id),
        facts: s.closesFacts.map((f) => {
            const fact = isObj(facts[f]) ? facts[f] : {};
            return {
                id: f,
                text: isStr(fact.text) ? fact.text : f,
                reduceNote: isStr(fact.reduceNote) ? fact.reduceNote : '',
                onBoard: g[INTEL_PREFIX + f] === true,
                closed: closedIds.has(f)
            };
        })
    }));
    const all = [...new Set(config.settings.flatMap((s) => s.closesFacts))];
    return {
        settings,
        factsTotal: all.length,
        factsClosed: all.filter((f) => closedIds.has(f)).length,
        tightCount: settings.filter((s) => s.tight).length
    };
}

/** The record the runner keeps: counts only, so a reopen skips the panel. */
export function summarise(view) {
    return { done: true, settings: view.settings.length, tightened: view.tightCount, facts: view.factsTotal, closed: view.factsClosed };
}
