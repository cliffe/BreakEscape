// Sort drill: the pure model (ENG-11). A bank of situation cards, each sorted into one of two to
// four bins the author names, with the reason on screen. It knows nothing about episodes,
// awareness or any one product: a game can open it with any bins and cards.
//
//   normaliseConfig(raw)            a clean config from authored data (bad entries dropped)
//   sortText(key, config)           one line of wording: config.strings[key], else the default
//   answersOf(card)                 the bin ids a card accepts (answer is one id or a list)
//   applyOverrides(config, over)    a deployment's per-card changes; a locked card ignores them
//   drawCards(config, { overrides, rng })
//                                   the cards to show, in order: unconfirmed ones never,
//                                   `new` ones first, one of each answer when asked
//   scoreCard(config, card, binId)  { correct, caution, points, max } for one drop
//   scoreDrill(config, placements)  the whole drill's score, or an unscored summary
//
// Scoring (scored drills only): the right bin earns POINTS.correct. A cautious bin earns
// POINTS.caution instead of nothing (so playing safe is never punished to zero). Cautious bins come
// from the drill-level `acceptable` list (applied to every card), a per-card `acceptable` list
// (which overrides the drill default for that card, an empty list switching it off), and the legacy
// single `alwaysScoresBin`. Any other bin earns nothing. An unscored drill (`scored: false`) gives
// no points: it marks each drop only as fitting the author's answer or not. `scoreDrill` returns the
// placements.
//
// Every string the learner reads has a default in DEFAULT_TEXT and a data override in
// `config.strings`; bin labels and card text are data.

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;

export const POINTS = Object.freeze({ correct: 2, caution: 1, wrong: 0 });
export const MIN_BINS = 2;
export const MAX_BINS = 4;

/** The default wording; `config.strings` replaces any line. {n}, {total}, {bin}, {points}, {max} are filled in. */
export const DEFAULT_TEXT = Object.freeze({
    title: 'Sort drill',
    heading: 'Sort the cards',
    intro: 'Each card is a situation. Put it in the bin you think fits, and the reason shows straight after.',
    start: 'Start',
    counter: 'Card {n} of {total}',
    binsLabel: 'Bins',
    pickLabel: 'Where does this go?',
    binsBoardLabel: 'Sorted so far',
    emptyBin: 'Nothing here yet',
    newBadge: 'New',
    right: 'Right.',
    wrong: 'Not this one. It goes in {bin}.',
    caution: 'Playing safe is never wrong. The clear-cut answer is {bin}.',
    teach: 'Suggested: {bin}.',
    teachFits: 'That works.',
    next: 'Next card',
    finish: 'See where they went',
    summaryHeading: 'Where the cards went',
    reloadNote: 'If you close or reload, the cards start again from the top.',
    // The summary's one-word verdict per card, in words as well as colour.
    summaryRight: 'Right',
    summaryAcceptable: 'Safe choice — never marked wrong',
    summaryWrong: 'Best answer: {bin}',
    summaryFits: 'That works',
    summarySuggest: 'Better: {bin}',
    scoreLine: 'You put {correct} of {total} in the right bin.',
    doneLine: 'You sorted {total} cards.',
    // Unscored drill, when a pick did not match the author's answer: the summary line falls back to
    // this instead of a doneLine that claims every card matched (E15 F-E15-9). {fit}/{total} tokens.
    doneMissLine: 'You sorted {total} cards; {fit} went to the suggested place.',
    done: 'Done',
    noCards: 'There are no cards to sort.',
    closeAsk: "Close now and your sorting so far won't be kept.",
    keepGoing: 'Keep going',
    closeAnyway: 'Close anyway'
});

/** One line of wording with {tokens} filled in. */
export function sortText(key, config = null, tokens = null) {
    const own = isObj(config?.strings) ? config.strings[key] : null;
    let text = isStr(own) ? own : (DEFAULT_TEXT[key] ?? '');
    if (tokens) for (const [k, v] of Object.entries(tokens)) text = text.split(`{${k}}`).join(String(v));
    return text;
}

/** The bin ids a card accepts: `answer` is one id or a list of ids. */
export function answersOf(card) {
    const a = card?.answer;
    return (Array.isArray(a) ? a : [a]).filter(isStr);
}

function cleanBins(raw) {
    const seen = new Set();
    const out = [];
    for (const b of Array.isArray(raw) ? raw : []) {
        if (!isObj(b) || !isStr(b.id) || !isStr(b.label) || seen.has(b.id)) continue;
        seen.add(b.id);
        out.push({ id: b.id, label: b.label, ...(isStr(b.hint) ? { hint: b.hint } : {}) });
        if (out.length === MAX_BINS) break;
    }
    return out;
}

/** Keep the real-bin ids of a list, de-duplicated, dropping any already in `exclude`. */
function cleanBinList(raw, binIds, exclude = []) {
    return [...new Set((Array.isArray(raw) ? raw : [])
        .filter((a) => isStr(a) && binIds.includes(a) && !exclude.includes(a)))];
}

function cleanCards(raw, binIds, drillAcceptable = []) {
    const seen = new Set();
    const out = [];
    for (const c of Array.isArray(raw) ? raw : []) {
        if (!isObj(c) || !isStr(c.id) || !isStr(c.situation) || seen.has(c.id)) continue;
        const answer = answersOf(c).filter((a) => binIds.includes(a));
        if (!answer.length) continue;
        // `acceptable`: extra bins scored as caution (partly right, shown neutrally), not wrong.
        // A card that names its own list overrides the drill-level default (an empty list switches
        // it off for that card); a card that omits the key inherits the default. Real bins only,
        // and never a bin already in the answer (that is simply right).
        const hasOwnAcceptable = Object.prototype.hasOwnProperty.call(c, 'acceptable');
        const acceptable = cleanBinList(hasOwnAcceptable ? c.acceptable : drillAcceptable, binIds, answer);
        seen.add(c.id);
        out.push({
            id: c.id,
            situation: c.situation,
            answer: answer.length === 1 ? answer[0] : answer,
            reason: isStr(c.reason) ? c.reason : '',
            locked: c.locked === true,
            confirmed: c.confirmed !== false,
            new: c.new === true,
            ...(acceptable.length ? { acceptable } : {})
        });
    }
    return out;
}

/**
 * A clean config. `bins` (2 to 4) and `cards` are required for the drill to run; entries with a
 * missing id, text or unknown bin are dropped, so a bad card never reaches the screen. A scored
 * drill without bins/cards is still returned (the minigame shows its "no cards" line).
 */
export function normaliseConfig(raw) {
    const src = isObj(raw) ? raw : {};
    const bins = cleanBins(src.bins);
    const ids = bins.map((b) => b.id);
    const rules = isObj(src.drawRules) ? src.drawRules : {};
    // Drill-level `acceptable`: caution bins applied to every card, so a drill with one safe bin
    // (ask first) need not repeat it on 18 cards. A card can override or switch it off (cleanCards).
    const acceptable = cleanBinList(src.acceptable, ids);
    return {
        bins,
        scored: src.scored === true,
        answerKeyProfile: isStr(src.answerKeyProfile) ? src.answerKeyProfile : null,
        alwaysScoresBin: isStr(src.alwaysScoresBin) && ids.includes(src.alwaysScoresBin) ? src.alwaysScoresBin : null,
        acceptable,
        cards: cleanCards(src.cards, ids, acceptable),
        drawRules: { oneOfEachAnswer: rules.oneOfEachAnswer === true, newFirst: rules.newFirst === true },
        drawCount: Number.isInteger(src.drawCount) && src.drawCount > 0 ? src.drawCount : null,
        strings: isObj(src.strings) ? { ...src.strings } : {}
    };
}

/**
 * A deployment's changes to the bank, `{ <cardId>: { answer?, reason?, confirmed? } }`. A locked
 * card ignores every change: nobody can move it to a softer bin, and it cannot be left out.
 * An answer naming no bin is ignored. Returns a new cards array.
 */
export function applyOverrides(config, overrides) {
    const ids = (config?.bins || []).map((b) => b.id);
    const over = isObj(overrides) ? overrides : {};
    return (config?.cards || []).map((card) => {
        const o = over[card.id];
        if (card.locked || !isObj(o)) return card;
        const next = { ...card };
        const answer = answersOf(o).filter((a) => ids.includes(a));
        if (answer.length) next.answer = answer.length === 1 ? answer[0] : answer;
        if (isStr(o.reason)) next.reason = o.reason;
        if (typeof o.confirmed === 'boolean') next.confirmed = o.confirmed;
        return next;
    });
}

/** Cards that may be drawn: confirmed ones, and every locked one. */
export function eligibleCards(config, overrides = null) {
    return applyOverrides(config, overrides).filter((c) => c.locked || c.confirmed !== false);
}

/**
 * The cards to show, in order.
 *   - unconfirmed cards are never drawn (a locked card always is);
 *   - without `drawCount` every eligible card is drawn;
 *   - with `drawCount`, `drawRules.oneOfEachAnswer` first takes one card per answer bin (a `new`
 *     one when there is one), `newFirst` then takes the `new` cards, and the rest is random;
 *   - `newFirst` shows the `new` cards first, the rest in authored order.
 * `rng` (default Math.random) is the only source of chance, so a test passes its own.
 */
export function drawCards(config, { overrides = null, rng = Math.random } = {}) {
    const pool = eligibleCards(config, overrides);
    const { oneOfEachAnswer, newFirst } = config.drawRules;
    let chosen = pool;
    if (config.drawCount && config.drawCount < pool.length) {
        const picked = new Set();
        const pickFrom = (list) => {
            const open = list.filter((c) => !picked.has(c.id));
            if (!open.length) return;
            picked.add(open[Math.floor(rng() * open.length) % open.length].id);
        };
        const target = config.drawCount;
        if (oneOfEachAnswer) {
            for (const bin of config.bins) {
                const ofBin = pool.filter((c) => answersOf(c)[0] === bin.id);
                if (!ofBin.length || ofBin.some((c) => picked.has(c.id))) continue;
                const fresh = newFirst ? ofBin.filter((c) => c.new) : [];
                pickFrom(fresh.length ? fresh : ofBin);
            }
        }
        if (newFirst) {
            for (const c of pool) if (c.new && picked.size < target) picked.add(c.id);
        }
        while (picked.size < Math.max(target, 1) && picked.size < pool.length) pickFrom(pool);
        chosen = pool.filter((c) => picked.has(c.id));
    }
    if (newFirst) chosen = [...chosen.filter((c) => c.new), ...chosen.filter((c) => !c.new)];
    return chosen;
}

/** One drop's score. An unscored drill scores nothing (`points` 0, `max` 0, `correct` null). */
export function scoreCard(config, card, binId) {
    if (!config.scored) return { correct: null, caution: false, points: 0, max: 0 };
    const correct = answersOf(card).includes(binId);
    const accept = Array.isArray(card.acceptable) ? card.acceptable : [];
    const caution = !correct && ((isStr(config.alwaysScoresBin) && binId === config.alwaysScoresBin) || accept.includes(binId));
    return {
        correct,
        caution,
        points: correct ? POINTS.correct : caution ? POINTS.caution : POINTS.wrong,
        max: POINTS.correct
    };
}

/**
 * The drill's result from `placements` ([{ id, bin }]) over `cards`.
 * Scored: { scored: true, answerKeyProfile, total, placed, correct, points, max, percent, placements }.
 * Unscored: { scored: false, total, placed, placements } with no points, no percent and no
 * `correct` on any placement, so nothing in it can be shown as a mark.
 */
export function scoreDrill(config, cards, placements) {
    const byId = new Map((placements || []).map((p) => [p.id, p.bin]));
    const list = [];
    let correct = 0, points = 0, max = 0;
    for (const card of cards) {
        if (!byId.has(card.id)) continue;
        const bin = byId.get(card.id);
        if (!config.scored) { list.push({ id: card.id, bin }); continue; }
        const s = scoreCard(config, card, bin);
        if (s.correct) correct += 1;
        points += s.points;
        list.push({ id: card.id, bin, correct: s.correct, points: s.points });
    }
    if (!config.scored) {
        // How many placements landed on a bin the author counts as an answer. No mark is shown per
        // card beyond "fits / better", but the summary line needs this to avoid claiming every card
        // matched when one did not (E15 F-E15-9).
        const fit = list.filter((p) => {
            const card = cards.find((c) => c.id === p.id);
            return card && answersOf(card).includes(p.bin);
        }).length;
        return { scored: false, total: cards.length, placed: list.length, fit, placements: list };
    }
    max = cards.length * POINTS.correct;
    return {
        scored: true,
        answerKeyProfile: config.answerKeyProfile,
        total: cards.length,
        placed: list.length,
        correct,
        points,
        max,
        percent: max ? Math.round((points / max) * 100) : 0,
        placements: list
    };
}
