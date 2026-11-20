// Pre/post comparison for inbox triage (SE design 05 N11; 11 section 5.2). Pure: no DOM,
// no globals written.
//
// After a round run at the `post` stage, the result step shows one small panel comparing
// the pre round's percent and report rate with this round's. The pre values are read from
// the pre round's result globals (`<prePrefix>percent`, `<prePrefix>reportRate`), which a
// post mission normally imports from the pre mission under those names. Per-factor counts
// are not carried between missions, so only the two headline numbers are compared.
//
// No-baseline gate: the comparison shows only when `<prePrefix>complete` is true and, when the
// set names one, the `comparison.requireGlobal` flag is true too (the mission's
// `pre_check_completed`). Otherwise the panel says there is no baseline and the round's own
// result stands alone.
//
// Set option:
//   "comparison": false                          no panel, even at the post stage
//   "comparison": { "prePrefix"?, "requireGlobal"? }
// With no `prePrefix`, a set whose `outcome.setGlobalPrefix` holds `{stage}` compares with
// the same prefix at `pre` (`triage_{stage}_` -> `triage_pre_`). A literal prefix with no
// `prePrefix` has no pre globals to read, so there is no panel.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The prefix the pre round wrote its globals under, or null when it cannot be known. */
export function prePrefixFor(set) {
    const cfg = isObj(set?.comparison) ? set.comparison : {};
    if (isStr(cfg.prePrefix)) return cfg.prePrefix;
    const raw = set?.outcome?.setGlobalPrefix;
    if (isStr(raw) && raw.includes('{stage}')) return raw.split('{stage}').join('pre');
    return null;
}

/**
 * The comparison for a finished (or reopened) round, or null when no panel is shown.
 *
 * @param {object} set      the triage set
 * @param {string} stage    the effective stage
 * @param {object} globals  gameState.globalVariables
 * @param {{percent:number, reportRate:number}} current  this round's result (or the stored one)
 * @returns {null | {baseline:false, reason:string, prePrefix:string}
 *                | {baseline:true, prePrefix:string, pre:{percent,reportRate}, post:{percent,reportRate},
 *                   change:{percent:number, reportRate:number}}}
 *          reportRate is a fraction (0 to 1); change.reportRate is in percentage points.
 */
export function comparisonFor(set, stage, globals, current) {
    if (stage !== 'post' || set?.comparison === false) return null;
    const prePrefix = prePrefixFor(set);
    if (!prePrefix) return null;
    const g = isObj(globals) ? globals : {};
    // The pre round records <prePrefix>complete (pre-rename saves hold <prePrefix>done; still read).
    if (g[`${prePrefix}complete`] !== true && g[`${prePrefix}done`] !== true) {
        return { baseline: false, reason: 'pre-not-done', prePrefix };
    }
    const flag = isObj(set.comparison) && isStr(set.comparison.requireGlobal) ? set.comparison.requireGlobal : null;
    if (flag && g[flag] !== true) return { baseline: false, reason: 'flag-not-set', prePrefix };

    const pre = { percent: num(g[`${prePrefix}percent`]) ?? 0, reportRate: num(g[`${prePrefix}reportRate`]) ?? 0 };
    const post = { percent: num(current?.percent) ?? 0, reportRate: num(current?.reportRate) ?? 0 };
    const pct = (r) => Math.round(r * 100);
    return {
        baseline: true,
        prePrefix,
        pre,
        post,
        change: { percent: post.percent - pre.percent, reportRate: pct(post.reportRate) - pct(pre.reportRate) }
    };
}

const signed = (n) => (n > 0 ? `+${n}` : String(n));

/** Plain-English lines for the panel: { heading, lines[] }. */
export function comparisonText(cmp) {
    if (!cmp) return null;
    if (!cmp.baseline) {
        return {
            heading: 'No baseline',
            lines: ["There's no first check to compare with, so this round's result stands on its own."]
        };
    }
    const pct = (r) => Math.round(r * 100);
    return {
        heading: 'Before and after',
        lines: [
            `Score: ${cmp.pre.percent}% before, ${cmp.post.percent}% now (${signed(cmp.change.percent)} points).`,
            `Report rate: ${pct(cmp.pre.reportRate)}% before, ${pct(cmp.post.reportRate)}% now (${signed(cmp.change.reportRate)} points).`
        ]
    };
}
