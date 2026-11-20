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
    // No alternative differed: a card with fewer marks leaves some lift mark without a partner, so it can never match.
    for (let n = count - 1; n >= 0; n--) {
        const marks = n ? ringPick(pool, centre, n, 0, singularOf(decoy)) : [];
        if (!compareFeatures(liftFeatures, { pattern: decoy.pattern, opens: decoy.canonical.opens, marks }).match) return marks;
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

/**
 * Tags for a card's marks in the magnified compare view. The lift's marks are numbered 1..n. A card mark
 * takes the number of the lift mark it pairs with (same type, within SAME_SPOT in the core-relative frame,
 * the test compareFeatures uses), each lift mark pairing once; a mark with no partner is tagged 'X'. The
 * owner's card carries the lift's marks, so it gets 1..n in order; a decoy shows X where it differs.
 * @param {{type:string, dx:number, dy:number}[]} liftMarks
 * @param {{type:string, dx:number, dy:number}[]} cardMarks
 * @returns {{lift:string[], card:string[], paired:number}}
 */
export function pairMarkTags(liftMarks, cardMarks) {
    const taken = new Set();
    const card = cardMarks.map(c => {
        let best = -1, bd = SAME_SPOT;
        liftMarks.forEach((l, i) => {
            const d = Math.hypot(c.dx - l.dx, c.dy - l.dy);
            if (!taken.has(i) && l.type === c.type && d < bd) { bd = d; best = i; }
        });
        if (best < 0) return 'X';
        taken.add(best);
        return String(best + 1);
    });
    return { lift: liftMarks.map((_, i) => String(i + 1)), card, paired: taken.size };
}

/**
 * Square crop (canvas px, whole numbers) centred on a print's reference point, so both prints of a pair
 * line up round it. It may reach past the canvas edge when the reference point is near it; the caller clips.
 * @param {{x:number,y:number}} centre @param {number} side
 */
export function cropAround(centre, side) {
    return { x: Math.round(centre.x - side / 2), y: Math.round(centre.y - side / 2), side };
}

/**
 * Crop side that holds every mark of every print in the pair, each kept `pad` px inside, centred on that
 * print's reference point. Even, at least `min`; the max leaves room for the widest ring (MAX_R_WIDE).
 * @param {{marks:{x:number,y:number}[], centre:{x:number,y:number}}[]} sets
 */
export function cropSide(sets, pad = 10, min = 48, max = 120) {
    let need = 0;
    for (const { marks, centre } of sets) {
        for (const m of marks) need = Math.max(need, 2 * Math.max(Math.abs(m.x - centre.x), Math.abs(m.y - centre.y)));
    }
    return Math.max(min, Math.min(max, 2 * Math.ceil((need + 2 * pad) / 2)));
}

/**
 * A crop for a limited plan: the largest side up to `maxSide` (even), with its centre moved off the reference point to the
 * middle of the marks' bounding box, so every mark (glyph radius 3 plus `pad`) lies inside. If the marks still do not fit
 * `maxSide`, the side is widened to hold them: showing every mark the player is told to check beats a tidy layout.
 * The offset is the same for the lift and the cards (the upright frame), whole numbers.
 * @param {{marks:{x:number,y:number}[], centre:{x:number,y:number}}[]} sets @param {number} maxSide
 * @returns {{side:number, ox:number, oy:number}}
 */
export function fitCropToMarks(sets, maxSide, pad = 4) {
    let x0 = 0, x1 = 0, y0 = 0, y1 = 0, any = false;
    for (const { marks, centre } of sets) {
        for (const m of marks) {
            const dx = m.x - centre.x, dy = m.y - centre.y;
            if (!any) { x0 = x1 = dx; y0 = y1 = dy; any = true; }
            x0 = Math.min(x0, dx); x1 = Math.max(x1, dx); y0 = Math.min(y0, dy); y1 = Math.max(y1, dy);
        }
    }
    if (!any) return { side: maxSide, ox: 0, oy: 0 };
    const need = Math.max(x1 - x0, y1 - y0) + 2 * (pad + 3) + 1;   // +1: the centre offset is rounded
    const side = Math.max(maxSide, 2 * Math.ceil(need / 2));
    return { side, ox: Math.round((x0 + x1) / 2), oy: Math.round((y0 + y1) / 2) };
}

/**
 * A mark's place in the upright card frame: the reference point plus its core-relative offset (dx, dy). The lift is
 * rotated on the surface, so its own x, y are not comparable with a card's; these are.
 * @param {{dx:number, dy:number}[]} marks @param {{x:number,y:number}} centre
 */
export function uprightMarks(marks, centre) {
    return marks.map(m => ({ ...m, x: centre.x + m.dx, y: centre.y + m.dy }));
}

/**
 * Turn a lift upright: a copy of an n x n RGBA image rotated by -rotation (radians) about `centre`, the inverse of the
 * generator's canonical -> final turn, so a mark at centre + R(rotation)(dx, dy) lands at centre + (dx, dy). Nearest
 * neighbour by inverse mapping (no smoothing); pixels that fall outside the source take `bg` ([r, g, b]).
 * @param {Uint8ClampedArray|number[]} src @param {number} n @param {{x:number,y:number}} centre
 * @param {number} rotation @param {number[]} bg
 * @returns {Uint8ClampedArray}
 */
export function rotateUpright(src, n, centre, rotation, bg = [0, 0, 0]) {
    const out = new Uint8ClampedArray(n * n * 4);
    const cs = Math.cos(rotation), sn = Math.sin(rotation);
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const rx = x - centre.x, ry = y - centre.y;
            const sx = Math.round(centre.x + cs * rx - sn * ry), sy = Math.round(centre.y + sn * rx + cs * ry);
            const o = (y * n + x) * 4;
            if (sx < 0 || sy < 0 || sx >= n || sy >= n) { out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = 255; continue; }
            const i = (sy * n + sx) * 4;
            out[o] = src[i]; out[o + 1] = src[i + 1]; out[o + 2] = src[i + 2]; out[o + 3] = src[i + 3];
        }
    }
    return out;
}

/**
 * Pixel offsets of a mark glyph at 1x: a ring (radius 3) for a ridge ending, a 7 x 7 square outline for a fork.
 * Drawn with fillRect and scaled by a whole number, so the glyph is never antialiased.
 */
export function markGlyph(type) {
    const out = [];
    if (type === 'bifurcation') {
        for (let i = -3; i <= 3; i++) out.push([i, -3], [i, 3], [-3, i], [3, i]);
    } else {
        for (const [x, y] of [[-1, -3], [0, -3], [1, -3], [-1, 3], [0, 3], [1, 3], [-3, -1], [-3, 0], [-3, 1], [3, -1], [3, 0], [3, 1],
            [-2, -2], [2, -2], [-2, 2], [2, 2]]) out.push([x, y]);
    }
    return out;
}

/**
 * Spoken description of a print's marks for the magnified view: no counts and no verdict. With `numbered`
 * the lift's marks carry their tag numbers.
 * @returns {string} e.g. '1, a fork above and to the right of the centre; 2, a ridge ending below the centre'
 */
export function describeMarks(marks, pattern, numbered) {
    const ref = REF_WORDS[pattern] || 'the core';
    return marks.map((m, i) => `${numbered ? `${i + 1}, ` : ''}${TYPE_WORDS[m.type]} ${spotWords(m.dx, m.dy)} ${ref}`).join('; ');
}
