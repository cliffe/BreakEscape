/**
 * Comparison features for the dusting compare step (pure; no DOM).
 *
 * Real comparison goes class characteristics first (the pattern, and for a loop the side it opens
 * to), then minutiae: where ridges end or fork, placed round the core. A print's features here are
 *   - `pattern`: 'loop' | 'whorl' | 'arch';
 *   - `opens`: for a loop, 'left' or 'right' (the side away from the delta), else null;
 *   - `marks`: a few minutiae near the reference point (core, whorl centre or top of the arch),
 *     each `{ type: 'ending'|'bifurcation', dx, dy }` in the upright card frame, so the cards and
 *     the lift can carry the same markers and the player can compare them by eye.
 *
 * The lift's marks are chosen from minutiae that also show on the owner's card, so the right card
 * carries the same marks in the same places. Each decoy's marks are chosen so at least one of the
 * lift's marks has no same-type mark near it on the decoy, so every decoy differs in a feature the
 * reason text can name. All choices are deterministic.
 *
 * Works in browsers and in node (ES module, no dependencies).
 * @module print-features
 */

/** Marks within this many canonical px of each other (same type) count as the same detail. */
export const SAME_SPOT = 9;
/** Marked minutiae keep at least this far apart, so the markers do not overlap at card size. */
const MIN_SEP = 14;
/** Marks sit in a ring round the reference point: not on top of the core marker, not at the rim. */
const MIN_R = 10;
const MAX_R = 40;
const MAX_R_WIDE = 50;
/** Canvas margin (px) a mark must keep, matching the numbered tags. */
const EDGE = 7;
/** Marks keep this far (canonical px) from a core or delta. */
const SINGULAR_CLEAR = 12;

export const TYPE_WORDS = { ending: 'a ridge ending', bifurcation: 'a fork' };
export const REF_WORDS = { loop: 'the core', whorl: 'the centre', arch: 'the top of the arch' };

/**
 * Where (dx, dy) lies from the reference point, in words, in the upright card frame (y down).
 * @param {number} dx
 * @param {number} dy
 * @returns {string} e.g. 'above and to the right of'
 */
export function spotWords(dx, dy) {
    const a = Math.atan2(-dy, dx) * 180 / Math.PI; // 0 = right, 90 = up
    const s = ((Math.round(a / 45) % 8) + 8) % 8;
    return ['to the right of', 'above and to the right of', 'above', 'above and to the left of',
        'to the left of', 'below and to the left of', 'below', 'below and to the right of'][s];
}

const canonOf = m => ({ x: m.ux ?? m.x, y: m.uy ?? m.y });

function insideFrame(p, m) {
    const N = p.size;
    if (!(m.x > EDGE && m.y > EDGE && m.x < N - EDGE && m.y < N - EDGE)) return false;
    return !p.mask || p.mask[Math.round(m.y) * N + Math.round(m.x)] > 0.5;
}

/**
 * Minutiae in rings round the reference point, nearest first, kept MIN_SEP apart.
 * @param {Object[]} pool minutiae with x, y (this print's frame) and ux, uy (canonical)
 * @param {{x:number,y:number}} centre canonical reference point
 * @param {number} count
 * @param {number} [skip=0] skip this many otherwise-eligible minutiae first (for alternative picks)
 * @returns {{type:string, dx:number, dy:number, ux:number, uy:number, x:number, y:number}[]}
 */
function ringPick(pool, centre, count, skip = 0, singular = []) {
    const scored = pool.map(m => {
        const c = canonOf(m);
        return { m, c, dx: c.x - centre.x, dy: c.y - centre.y, r: Math.hypot(c.x - centre.x, c.y - centre.y) };
    }).filter(o => o.r >= MIN_R && singular.every(s => Math.hypot(o.c.x - s.x, o.c.y - s.y) >= SINGULAR_CLEAR))
        .sort((a, b) => a.r - b.r || a.dx - b.dx || a.dy - b.dy);
    const mk = o => ({ type: o.m.type, dx: o.dx, dy: o.dy, ux: o.c.x, uy: o.c.y, x: o.m.x, y: o.m.y });
    const apart = (list, o) => list.every(q => Math.hypot(q.dx - o.dx, q.dy - o.dy) >= MIN_SEP);
    for (const maxR of [MAX_R, MAX_R_WIDE]) {
        const ring = scored.filter(o => o.r <= maxR);
        const out = [];
        let skipped = 0;
        for (const o of ring) {
            if (!apart(out, o)) continue;
            if (skipped < skip) { skipped++; continue; }
            out.push(o);
            if (out.length === count) break;
        }
        // Show both kinds where the ring has both: swap the outermost mark for the nearest fork
        // (or ending) that keeps clear of the others.
        if (out.length === count && count >= 2 && out.every(o => o.m.type === out[0].m.type)) {
            const other = ring.find(o => o.m.type !== out[0].m.type && apart(out.slice(0, -1), o));
            if (other) out[out.length - 1] = other;
        }
        if (maxR === MAX_R_WIDE || out.length === count) return out.map(mk);
    }
    return [];
}

/** Canonical cores and deltas: ridges end there by construction in every print of a class, so no mark sits on one. */
const singularOf = p => (p && p.canonical ? [...p.canonical.cores, ...p.canonical.deltas] : []);

/**
 * The lift's marks, and the matching marks on the owner's card.
 * Only minutiae that show on both (same canonical point, both inside their frame) are used.
 * @param {Object} lift generatePrint result (the variant, possibly shifted on the surface)
 * @param {Object} card generatePrint result for the owner's upright reference card
 * @param {number} count
 * @returns {{lift:Object[], card:Object[]}} marks in each print's own frame (x, y) plus dx, dy, type
 */
export function pickLiftMarks(lift, card, count) {
    if (!count) return { lift: [], card: [] };
    const byCanon = new Map();
    for (const r of card.minutiae) if (insideFrame(card, r)) byCanon.set(`${Math.round(canonOf(r).x)},${Math.round(canonOf(r).y)}`, r);
    const pool = lift.minutiae.filter(m => insideFrame(lift, m) && byCanon.has(`${Math.round(canonOf(m).x)},${Math.round(canonOf(m).y)}`));
    const centre = (lift.canonical && lift.canonical.centre) || (card.canonical && card.canonical.centre);
    const liftMarks = ringPick(pool, centre, count, 0, singularOf(card));
    const cardMarks = liftMarks.map(l => {
        const r = byCanon.get(`${Math.round(l.ux)},${Math.round(l.uy)}`);
        return { ...l, x: r.x, y: r.y };
    });
    return { lift: liftMarks, card: cardMarks };
}

/**
 * Compare a card's features with the lift's. Class first, then minutiae.
 * @param {{pattern:string, opens:(string|null), marks:Object[]}} lift
 * @param {{pattern:string, opens:(string|null), marks:Object[]}} card
 * @returns {{match:true}|{match:false, feature:'pattern'|'opens'|'minutia', mark?:Object, there?:(Object|null)}}
 */
export function compareFeatures(lift, card) {
    if (lift.pattern !== card.pattern) return { match: false, feature: 'pattern' };
    if (lift.pattern === 'loop' && lift.opens && card.opens && lift.opens !== card.opens) return { match: false, feature: 'opens' };
    for (const l of lift.marks) {
        const same = card.marks.some(c => c.type === l.type && Math.hypot(c.dx - l.dx, c.dy - l.dy) < SAME_SPOT);
        if (!same) {
            const near = card.marks
                .filter(c => Math.hypot(c.dx - l.dx, c.dy - l.dy) < SAME_SPOT)
                .sort((a, b) => Math.hypot(a.dx - l.dx, a.dy - l.dy) - Math.hypot(b.dx - l.dx, b.dy - l.dy));
            return { match: false, feature: 'minutia', mark: l, there: near[0] || null };
        }
    }
    return { match: true };
}

/**
 * A decoy card's marks: its own minutiae round its own reference point, chosen (deterministically)
 * so the card differs from the lift in at least one feature. Where the class already differs any
 * pick will do; otherwise alternative picks are tried until one of the lift's marks has no
 * same-type mark near it.
 * @param {{pattern:string, opens:(string|null), marks:Object[]}} liftFeatures
 * @param {Object} decoy generatePrint result (upright card)
 * @param {number} count
 * @returns {Object[]}
 */
export function pickDecoyMarks(liftFeatures, decoy, count) {
    if (!count) return [];
    const pool = decoy.minutiae.filter(m => insideFrame(decoy, m));
    const centre = decoy.canonical.centre;
    let first = null;
    for (let skip = 0; skip < 8; skip++) {
        const marks = ringPick(pool, centre, count, skip, singularOf(decoy));
        if (!marks.length) break;
        if (!first) first = marks;
        const f = { pattern: decoy.pattern, opens: decoy.canonical.opens, marks };
        if (!compareFeatures(liftFeatures, f).match) return marks;
    }
    return first || [];
}

/** Features of a print and its chosen marks. */
export function featuresOf(print, marks) {
    return { pattern: print.pattern, opens: print.canonical ? print.canonical.opens : null, marks };
}

const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

/**
 * The wrong-pick sentence, naming the feature that differs (UK English, plain).
 * @param {ReturnType<typeof compareFeatures>} diff
 * @param {{pattern:string, opens:(string|null)}} lift
 * @param {{pattern:string, opens:(string|null)}} card
 * @returns {string}
 */
export function mismatchReason(diff, lift, card) {
    if (diff.match) return '';
    if (diff.feature === 'pattern') {
        return `No match: that card is ${an(card.pattern)} and your lift is ${an(lift.pattern)}. The pattern type is a class characteristic: check it first.`;
    }
    if (diff.feature === 'opens') {
        return `No match: both are loops, but that card's loop opens to the ${card.opens} and your lift's opens to the ${lift.opens}. Which way a loop opens is a class characteristic, like the pattern type.`;
    }
    const m = diff.mark;
    const where = `${spotWords(m.dx, m.dy)} ${REF_WORDS[lift.pattern] || 'the core'}`;
    const there = diff.there ? `that card has ${TYPE_WORDS[diff.there.type]} there` : 'that card has no marked detail there';
    return `No match: same pattern, but the minutiae differ. Your lift has ${TYPE_WORDS[m.type]} ${where}; ${there}.`;
}
