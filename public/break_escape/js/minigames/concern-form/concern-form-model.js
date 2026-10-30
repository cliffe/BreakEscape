// Concern form: the pure model (ENG-12). The learner builds a short report from fact chips (what,
// when, where, who) and may add a conclusion chip. The feedback favours a report made of facts and
// gently steers away from a verdict. It knows nothing about episodes, awareness or any one product:
// a game can open it with any chips and wording.
//
//   normaliseConfig(raw)             a clean config from authored data (bad entries dropped)
//   concernText(key, config, tokens) one line of wording: config.strings[key], else the default
//   kindLabel(kind, config)          the heading for a fact kind
//   assessReport(config, picks)      { tone, facts, conclusions, kinds } for a selection
//   concernRecord(config, picks)     the result record: counts, the tone and the picked ids, never a mark
//   shownTone(assess)                the tone the feedback shows: 'facts_missing' stands in for
//                                    'facts' while a required fact is still unpicked
//
// Tones (the feedback the learner reads):
//   empty          nothing picked yet
//   thin           some facts, fewer than `minFacts`, no conclusion
//   facts          `minFacts` or more facts and no conclusion: affirmed
//   facts_missing  (shown only) as `facts`, but a `required` fact is not picked: not praised yet
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
    // batch-12 item 4: shown under the conclusions when more than one is offered, so the learner
    // knows a second pick replaces the first rather than adding to it (E16 B3 finding 6).
    conclusionsNote: 'You can keep one of these. Picking another replaces it.',
    // batch-12 item 15: shown (and Done withheld) when a fact chip marked `required` is not picked,
    // so a report built around an offer cannot be finished without naming it (E16 B4 minor 1).
    // {missing} is the missing chips' labels, joined.
    feedbackRequired: 'Add the fact that matters most before you finish: {missing}.',
    check: 'Check my report',
    changed: 'You have changed the report. Check it again.',
    done: 'Done',
    feedbackEmpty: 'Pick at least one fact to start the report.',
    feedbackThin: 'A start. Add {min} or more facts so whoever reads it can see what you saw.',
    feedbackFacts: 'Good. A report made of facts lets the right person look into it fairly.',
    // batch-13 item 1: shown in place of feedbackFacts while a `required` fact is still unpicked, so
    // the praise never sits above a held-back Done (E16 C4). The cf-must-add line names the fact.
    feedbackFactsMissing: 'Nearly there. These are facts, but the one that matters most is still missing.',
    feedbackFactsVerdict: 'Your facts are what matter here. Leave the conclusion out, and let whoever looks into it reach their own.',
    feedbackVerdictOnly: 'Facts, not a verdict. A conclusion without the facts behind it cannot be checked, and it can hurt someone who has done nothing wrong. Add what you saw.',
    feedbackThinVerdict: 'Add more facts and leave the conclusion out. What you saw is yours to report. What it means is for someone else to find out.',
    mustRemoveConclusion: 'Take the conclusion out before you send this. A report is for what you saw, not what you think it means.',
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
        const chip = { id: c.id, label: c.label, kind: c.kind };
        // batch-12 item 15: a fact the report must include (the outside offer in E16). Opt-in.
        if (c.required === true) chip.required = true;
        out.push(chip);
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
        // E16 B1 row 7 (opt-in): require a verdict chip to be removed before Done is offered, so
        // the fact-not-verdict lesson is a gate, not a soft nudge. Default false → Done is offered
        // after any non-empty check as before.
        requireNoConclusion: src.requireNoConclusion === true,
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
    // batch-12 item 15: the `required` fact chips not yet picked. The minigame holds Done and names
    // them while any remain. Empty for a config with no required chips (the default), so nothing
    // changes there.
    const picked = new Set(Array.isArray(picks) ? picks : []);
    const missingRequired = config.factChips.filter((c) => c.required === true && !picked.has(c.id));
    return { tone, facts, conclusions, kinds: [...new Set(facts.map((c) => c.kind))], missingRequired };
}

const TONE_KEY = Object.freeze({
    empty: 'feedbackEmpty', thin: 'feedbackThin', facts: 'feedbackFacts', facts_verdict: 'feedbackFactsVerdict',
    verdict_only: 'feedbackVerdictOnly', thin_verdict: 'feedbackThinVerdict', facts_missing: 'feedbackFactsMissing'
});

/**
 * batch-13 item 1: the tone the feedback shows for an assessment. A report of enough facts reads
 * 'facts' (the praise line), but while a `required` fact is unpicked Done is held back, so the
 * praise would contradict the gate: 'facts_missing' stands in. Every other tone is unchanged, and
 * with no required chips this is always assess.tone.
 */
export function shownTone(assess) {
    const missing = Array.isArray(assess?.missingRequired) ? assess.missingRequired.length : 0;
    return assess?.tone === 'facts' && missing > 0 ? 'facts_missing' : assess?.tone;
}

/** The feedback line for a tone. */
export function feedbackFor(config, tone) {
    return concernText(TONE_KEY[tone] || TONE_KEY.empty, config, { min: config.minFacts });
}

/**
 * The result record: what was built, as counts and a tone. No points, no percent, no mark.
 * batch-13 item 2: it also names the chips, by id, so the debrief can recap the report: the facts
 * included (factIds, in the config's order), the conclusion left in (conclusionIds) and any
 * `required` fact that was not picked (missingRequired).
 */
export function concernRecord(config, picks) {
    const a = assessReport(config, picks);
    return { done: true, facts: a.facts.length, conclusions: a.conclusions.length, kinds: a.kinds, tone: a.tone,
        factIds: a.facts.map((c) => c.id), conclusionIds: a.conclusions.map((c) => c.id),
        missingRequired: a.missingRequired.map((c) => c.id) };
}
