// Concern form: the pure model (ENG-12). The learner builds a short report from fact chips (what,
// when, where, who) and may add a conclusion chip. The feedback favours a report made of facts and
// gently steers away from a verdict. It knows nothing about episodes, awareness or any one product:
// a game can open it with any chips and wording.
//
//   normaliseConfig(raw)             a clean config from authored data (bad entries dropped)
//   concernText(key, config, tokens) one line of wording: config.strings[key], else the default
//   kindLabel(kind, config)          the heading for a fact kind
//   assessReport(config, picks)      { tone, facts, conclusions, kinds } for a selection
//   concernRecord(config, picks)     the result record: counts and the tone, never a mark
//
// Tones (the feedback the learner reads):
//   empty          nothing picked yet
//   thin           some facts, fewer than `minFacts`, no conclusion
//   facts          `minFacts` or more facts and no conclusion: affirmed
//   facts_verdict  enough facts plus a conclusion: the facts are affirmed, the verdict is left out
//   verdict_only   a conclusion and no facts: "facts, not a verdict"
//   thin_verdict   a conclusion and some facts, fewer than `minFacts`
//
// This step is teaching only. Nothing here is a mark: no points, no percent, no right or wrong.
//
// Every string the learner reads has a default in DEFAULT_TEXT and a data override in
// `config.strings`; chip labels and the guidance are data.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const KINDS = Object.freeze(['what', 'when', 'where', 'who']);
export const DEFAULT_MIN_FACTS = 2;

/** The default wording; `config.strings` replaces any line. {n}, {min} are filled in. */
export const DEFAULT_TEXT = Object.freeze({
    title: 'Raise a concern',
    heading: 'Raise a concern',
    intro: 'Build a short report from what you saw yourself. Pick the facts to include. You can add a conclusion if you want to, and the feedback will say how it reads.',
    reloadNote: 'If you close or reload, your picks start again.',
    start: 'Start',
    factsHeading: 'What you noticed',
    conclusionsHeading: 'What you think it means (optional)',
    kindWhat: 'What happened',
    kindWhen: 'When',
    kindWhere: 'Where',
    kindWho: 'Who was involved',
    reportHeading: 'Your report',
    reportEmpty: 'Nothing picked yet.',
    reportFacts: 'Facts',
    reportConclusion: 'Conclusion',
    check: 'Check my report',
    changed: 'You have changed the report. Check it again.',
    done: 'Done',
    feedbackEmpty: 'Pick at least one fact to start the report.',
    feedbackThin: 'A start. Add {min} or more facts so whoever reads it can see what you saw.',
    feedbackFacts: 'Good. A report made of facts lets the right person look into it fairly.',
    feedbackFactsVerdict: 'Your facts are what matter here. Leave the conclusion out, and let whoever looks into it reach their own.',
    feedbackVerdictOnly: 'Facts, not a verdict. A conclusion without the facts behind it cannot be checked, and it can hurt someone who has done nothing wrong. Add what you saw.',
    feedbackThinVerdict: 'Add more facts and leave the conclusion out. What you saw is yours to report. What it means is for someone else to find out.',
    closeAsk: "Close now and your report so far won't be kept.",
    keepGoing: 'Keep going',
    closeAnyway: 'Close anyway'
});

/** One line of wording with {tokens} filled in. */
export function concernText(key, config = null, tokens = null) {
    const own = isObj(config?.strings) ? config.strings[key] : null;
    let text = isStr(own) ? own : (DEFAULT_TEXT[key] ?? '');
    if (tokens) for (const [k, v] of Object.entries(tokens)) text = text.split(`{${k}}`).join(String(v));
    return text;
}

/** The heading for a fact kind ("what" -> strings.kindWhat, default "What happened"). */
export function kindLabel(kind, config = null) {
    return concernText(`kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`, config);
}

function cleanFactChips(raw) {
    const seen = new Set();
    const out = [];
    for (const c of Array.isArray(raw) ? raw : []) {
        if (!isObj(c) || !isStr(c.id) || !isStr(c.label) || !KINDS.includes(c.kind) || seen.has(c.id)) continue;
        seen.add(c.id);
        out.push({ id: c.id, label: c.label, kind: c.kind });
    }
    return out;
}

function cleanConclusionChips(raw, taken) {
    const seen = new Set(taken);
    const out = [];
    for (const c of Array.isArray(raw) ? raw : []) {
        if (!isObj(c) || !isStr(c.id) || !isStr(c.label) || seen.has(c.id)) continue;
        seen.add(c.id);
        out.push({ id: c.id, label: c.label });
    }
    return out;
}

/** A clean config. Chips without an id, a label or (for facts) a known kind are dropped. */
export function normaliseConfig(raw) {
    const src = isObj(raw) ? raw : {};
    const factChips = cleanFactChips(src.factChips);
    const min = Number.isInteger(src.minFacts) && src.minFacts >= 1 ? src.minFacts : DEFAULT_MIN_FACTS;
    return {
        factChips,
        conclusionChips: cleanConclusionChips(src.conclusionChips, factChips.map((c) => c.id)),
        guidance: isStr(src.guidance) ? src.guidance : '',
        minFacts: Math.min(min, Math.max(1, factChips.length)),
        strings: isObj(src.strings) ? src.strings : {}
    };
}

/** The picked ids that name a chip, in the config's order, split into facts and conclusions. */
function resolve(config, picks) {
    const set = new Set(Array.isArray(picks) ? picks : []);
    return {
        facts: config.factChips.filter((c) => set.has(c.id)),
        conclusions: config.conclusionChips.filter((c) => set.has(c.id))
    };
}

/** What a selection amounts to: the chips picked and the tone of the feedback. */
export function assessReport(config, picks) {
    const { facts, conclusions } = resolve(config, picks);
    const enough = facts.length >= config.minFacts;
    let tone;
    if (!facts.length && !conclusions.length) tone = 'empty';
    else if (!conclusions.length) tone = enough ? 'facts' : 'thin';
    else if (!facts.length) tone = 'verdict_only';
    else tone = enough ? 'facts_verdict' : 'thin_verdict';
    return { tone, facts, conclusions, kinds: [...new Set(facts.map((c) => c.kind))] };
}

const TONE_KEY = Object.freeze({
    empty: 'feedbackEmpty', thin: 'feedbackThin', facts: 'feedbackFacts', facts_verdict: 'feedbackFactsVerdict',
    verdict_only: 'feedbackVerdictOnly', thin_verdict: 'feedbackThinVerdict'
});

/** The feedback line for a tone. */
export function feedbackFor(config, tone) {
    return concernText(TONE_KEY[tone] || TONE_KEY.empty, config, { min: config.minFacts });
}

/** The result record: what was built, as counts and a tone. No points, no percent, no mark. */
export function concernRecord(config, picks) {
    const a = assessReport(config, picks);
    return { done: true, facts: a.facts.length, conclusions: a.conclusions.length, kinds: a.kinds, tone: a.tone };
}
