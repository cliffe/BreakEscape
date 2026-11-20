/**
 * Lockpicking labels: size and placement (D219).
 *
 * The lock is drawn on a 580x340 canvas (phones) or 600x400 (desktop) that the browser scales
 * down to fit, so a label's size on screen is its font size times the canvas scale. Each label
 * is drawn at the smallest whole pixel size that reads at least MIN_SCREEN_PX on screen, and is
 * placed in free space (above the springs, below the keyway, beside the lock) so it never
 * overlaps another label or covers a pin it does not name. Leader lines join each label to
 * the part it names.
 *
 * layoutLockLabels() is pure: it takes numbers and a measure function and returns boxes, so a
 * test can check overlaps at any scale. LockLabels applies the result to the Phaser texts.
 */

export const MIN_SCREEN_PX = 16;
export const BASE_FONT_PX = 18;
export const LABEL_PAD_X = 3;
export const LABEL_PAD_Y = 1;

// World geometry of the lock (see lock-graphics.js and pin-management.js)
export const PIN_TOP = 70;        // top of the springs (pinY 200 - 130)
export const PIN_BOTTOM = 226;    // foot of every key pin (driver + key length is always 75)
export const PIN_HALF_WIDTH = 14; // the channel is 26 wide, plus a pixel each side
export const SHEAR_Y = 155;
export const WRENCH_ARM_X = 80;   // left edge of the tension wrench's upright
export const HOOK_BAR_Y = 260;    // the hook pick's bar, 2/3 down the keyway
export const KEYWAY_BOTTOM = 290;
export const WRENCH_UPRIGHT = { x: 80, y: 40, w: 10, h: 170 }; // lock-graphics.js:44, :55

// Other drawn parts a label must stay off (0px touch counts): the wrench's arm and the hook's
// shaft and tip (the shaft runs from off-screen to the last pin, the tip rises there)
export const WRENCH_ARM = { x: 80, y: 200, w: 38, h: 10 };
export const HOOK_SHAFT_Y = 254, HOOK_SHAFT_H = 12;
export const LATE_ROW_Y = HOOK_BAR_Y + 8; // first row under the hook's bar

const GAP = 2;

// Below this canvas scale the label font stops growing (AC1 D219 R4): the layout of the 0.40
// scale is clean for every pin count, and larger type would not fit. Text may draw under 16px on
// screen there (13.6px at 0.34), which is the recorded trade-off.
export const MIN_LAYOUT_SCALE = 0.40;

// The font the layout uses at this scale: whole pixels, 16px on screen down to MIN_LAYOUT_SCALE,
// then held at that size
export function layoutFontSize(scale) {
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return labelFontSize(Math.max(s, MIN_LAYOUT_SCALE));
}

// Whole pixel font size that draws at least MIN_SCREEN_PX on screen at this canvas scale
export function labelFontSize(scale, base = BASE_FONT_PX) {
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return Math.max(base, Math.ceil(MIN_SCREEN_PX / s - 1e-9));
}

function overlaps(a, b, gap = GAP) {
    return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

// A leader is one segment, optionally followed by more segments in `more` (an elbow)
export function leaderLegs(l) {
    if (!l) return [];
    const { more, ...first } = l;
    return [first, ...(more || [])];
}

// Does the leader pass through the rectangle (sampled every 2px; leaders are short)
export function segmentHitsRect(seg, r) {
    if (!seg) return false;
    if (seg.more) return leaderLegs(seg).some((leg) => segmentHitsRect(leg, r));
    const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
    for (let i = 0; i <= n; i++) {
        const x = seg.x1 + dx * i / n, y = seg.y1 + dy * i / n;
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
    }
    return false;
}

function legBox(l, pad) {
    return { x: Math.min(l.x1, l.x2) - pad, y: Math.min(l.y1, l.y2) - pad, w: Math.abs(l.x2 - l.x1) + 2 * pad, h: Math.abs(l.y2 - l.y1) + 2 * pad };
}
// Two leaders drawn within 2px of each other would read as one line
function leadersClose(a, b) {
    for (const x of leaderLegs(a)) for (const y of leaderLegs(b)) {
        const p = legBox(x, 3), q = legBox(y, 3);
        if (p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) return true;
    }
    return false;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Start positions ordered by distance from a preferred one
function around(pref, lo, hi, step = 4) {
    const out = [];
    if (hi < lo) return [lo];
    const p = clamp(Math.round(pref), lo, hi);
    out.push(p);
    for (let d = step; p - d >= lo || p + d <= hi; d += step) {
        if (p + d <= hi) out.push(p + d);
        if (p - d >= lo) out.push(p - d);
    }
    return out;
}

function range(from, to, step) {
    const out = [];
    if (step > 0) for (let v = from; v <= to; v += step) out.push(v);
    else for (let v = from; v >= to; v += step) out.push(v);
    return out;
}

/**
 * @param {object} o
 * @param {number} o.scale        canvas scale on screen (1 = one canvas pixel per CSS pixel)
 * @param {number[]} o.pinXs      x of each pin, in canvas world pixels
 * @param {{left,top,right,bottom}} o.view   the visible window of the world
 * @param {(lines:string[], font:number)=>{w:number,h:number}} o.measure   box of a label, padding included
 * @param {{x,y,w,h}[]} [o.blocked]   world rects that page elements cover: no label goes there

 * @returns {{font:number, fallbacks:number, labels:Object<string,{x,y,w,h,lines:string[],leader:object|null}>}}
 */
export function layoutLockLabels({ scale, pinXs, view, measure, prev = null, blocked = [] }) {
    const font = layoutFontSize(scale);
    const memoKey = layoutKey(font, pinXs, view, measure, prev, blocked);
    const hit = LAYOUT_MEMO.get(memoKey);
    if (hit) return hit;
    const result = solveLayout({ font, pinXs, view, measure, prev, blocked });
    if (LAYOUT_MEMO.size >= MEMO_MAX) LAYOUT_MEMO.delete(LAYOUT_MEMO.keys().next().value);
    LAYOUT_MEMO.set(memoKey, result);
    return result;
}

// Layouts already solved, keyed by font (the only way scale enters), pin count and x, view, the
// measured size of every wording (so a late font load misses) and the previous layout's choices
const LAYOUT_MEMO = new Map();
const MEMO_MAX = 48;
const WORDINGS = [['SHEAR LINE'], ['SHEAR', 'LINE'], ['Tension', 'Wrench'], ['Tension Wrench'], ['Hook', 'Pick'], ['Hook Pick'],
    ['Spring'], ['Driver Pin'], ['Driver', 'Pin'], ['Key Pin']];
function prevSig(prev, font) {
    if (!prev || !prev.labels || prev.font === font) return '';
    return Object.keys(prev.labels).map((id) => { const l = prev.labels[id]; return id + ':' + l.lines.join('_') + ':' + l.pin + ':' + l.x + ':' + l.y; }).join(';');
}
function blockedSig(blocked) {
    return (blocked || []).map((r) => r.x + ',' + r.y + ',' + r.w + ',' + r.h).join(';');
}
function layoutKey(font, pinXs, view, measure, prev, blocked) {
    const m = WORDINGS.map((w) => { const b = measure(w, font); return b.w + 'x' + b.h; }).join(',');
    return [font, pinXs.length, pinXs.join(','), view.left, view.top, view.right, view.bottom, m, prevSig(prev, font), blockedSig(blocked)].join('|');
}
export function clearLayoutMemo() { LAYOUT_MEMO.clear(); }

function solveLayout({ font, pinXs, view, measure, prev, blocked = [] }) {
    const pinBoxes = pinXs.map((x) => ({ x: x - PIN_HALF_WIDTH, y: PIN_TOP, w: PIN_HALF_WIDTH * 2, h: PIN_BOTTOM - PIN_TOP }));
    const n = pinXs.length;
    const pinAt = (i) => pinXs[Math.min(Math.max(i, 0), n - 1)];
    const idxAt = (i) => Math.min(Math.max(i, 0), n - 1);
    const placed = {};
    let fallbacks = 0;
    const lo = view.left + 1;

    // A candidate is acceptable when its box misses every placed label, every pin it does not
    // name, and its leader (if any) passes through no placed label
    const lastX = pinAt(n - 1);
    const parts = [
        { ...WRENCH_UPRIGHT, h: WRENCH_UPRIGHT.h + 4 }, // plus a 4px gap for a leader
        WRENCH_ARM,
        { x: view.left - 200, y: HOOK_SHAFT_Y, w: lastX + 6 - (view.left - 200), h: HOOK_SHAFT_H },
        { x: lastX - 20, y: 215, w: 30, h: HOOK_SHAFT_Y - 215 },
        // Canvas areas a page element covers (the feedback box, a band over the top): no label there
        ...(blocked || [])
    ];
    // Checks that do not depend on the other labels: parts, the view, and every pin the label
    // does not name (the box and its leader). Run once per candidate, before the search.
    function staticOk(box, leader, namedPin) {
        for (const b of parts) if (overlaps(box, b, 1)) return false;
        if (box.x < lo || box.x + box.w > view.right - 1 || box.y < view.top || box.y + box.h > view.bottom - 1) return false;
        for (let i = 0; i < pinBoxes.length; i++) {
            if (i === namedPin) continue;
            if (overlaps(box, pinBoxes[i], 1)) return false;
            if (segmentHitsRect(leader, pinBoxes[i])) return false; // a leader never crosses a pin it does not name
        }
        return true;
    }
    // The checks against the labels already placed
    function clearOfPlaced(box, leader) {
        for (const id of Object.keys(placed)) {
            if (overlaps(box, placed[id])) return false;
            if (segmentHitsRect(leader, placed[id])) return false;
            if (segmentHitsRect(placed[id].leader, box)) return false;
            if (leader && placed[id].leader && leadersClose(leader, placed[id].leader)) return false;
        }
        return true;
    }

    function put(id, lines, size, leader, pin) {
        placed[id] = { x: size.x, y: size.y, w: size.w, h: size.h, lines, leader, pin: pin ?? -1 };
    }
    // Spring, Driver Pin and Key Pin teach a kind of part, so each may name ANY pin of that kind
    // (AC1 D219 R3). Candidates try pins leftmost first, starting from the preferred one.
    const pinOrder = (pref) => {
        const all = range(0, n - 1, 1);
        return [...all.filter((i) => i >= pref), ...all.filter((i) => i < pref)];
    };

    // A candidate spot: its box, wording and leader. A pin label needs a short, near-straight leader
    const straightEnough = (l) => !!l && Math.abs(l.x2 - l.x1) <= 10;
    const cands = (lines, size, ys, xsFor, leaderFor, named, out) => {
        for (const y of ys) for (const x of xsFor(size)) {
            const box = { x, y, w: size.w, h: size.h };
            const leader = leaderFor(box);
            if (named >= 0 && !straightEnough(leader)) continue;
            out.push({ lines, box, leader, named });
        }
        return out;
    };

    // Below about 0.5 the type is too tall for the strip above the springs. The free space is then
    // under the hook's bar (and the keyway), across the whole width: each wording, every row
    const lateRows = (h) => range(LATE_ROW_Y, view.bottom - h - 1, 2);
    const late = (variants, xsFor, leaderFor, named, out) => {
        for (const lines of variants) {
            const size = measure(lines, font);
            cands(lines, size, lateRows(size.h), xsFor, leaderFor, named, out);
        }
        return out;
    };
    // Spring and Driver Pin leaders run up the gap beside their pin and turn in to touch it
    const viaGap = (variants, gaps, pinIdx, ty, out) => {
        for (const lines of variants) {
            const size = measure(lines, font);
            for (const y of lateRows(size.h)) for (const g of gaps) {
                const gx = Math.round(g.x);
                const edge = Math.round(pinAt(pinIdx) + g.side * PIN_HALF_WIDTH);
                const from = Math.max(lo, gx - size.w + 3), to = Math.min(gx - 3, view.right - size.w - 1);
                for (const x of around(gx - size.w / 2, from, Math.max(from, to), 2)) {
                    const box = { x, y, w: size.w, h: size.h };
                    if (box.y <= ty) continue;
                    out.push({ lines, box, named: idxAt(pinIdx),
                        leader: { x1: gx, y1: box.y, x2: gx, y2: ty, more: [{ x1: gx, y1: ty, x2: edge, y2: ty }] } });
                }
            }
        }
        return out;
    };
    // The gap on each side of pin i: between two pins, or beside the outermost pin
    const gapsOf = (i, dx = 0) => {
        const out = [];
        out.push(i < n - 1 ? { x: Math.round((pinAt(i) + pinAt(i + 1)) / 2) + dx, side: 1 } : { x: Math.round(pinAt(i) + PIN_HALF_WIDTH + 4), side: 1 });
        out.push(i > 0 ? { x: Math.round((pinAt(i - 1) + pinAt(i)) / 2) + 3, side: -1 } : { x: Math.round(pinAt(i) - PIN_HALF_WIDTH - 4), side: -1 });
        return out;
    };

    // Last resort (a very small canvas, so very large type): the first clear spot in the view,
    // keeping labels apart from each other even if it must cross a pin. A label that names a
    // pin (target tx) always spans that pin's column, so its leader stays straight and never
    // runs across another pin.
    function fallback(id, lines, size, leaderFor, tx, fromBottom) {
        const fbPin = tx === undefined ? -1 : pinXs.indexOf(tx);
        fallbacks++;
        const xs = [];
        if (tx === undefined) for (let x = lo; x + size.w <= view.right - 1; x += 4) xs.push(x);
        else {
            const t = Math.round(tx);
            const from = Math.max(lo, t - size.w + 2), to = Math.min(t - 2, view.right - size.w - 1);
            for (const x of around(t - size.w / 2, from, Math.max(from, to), 4)) xs.push(x);
        }
        const ys = [];
        for (let y = view.top; y + size.h <= view.bottom - 1; y += 4) ys.push(y);
        if (fromBottom) ys.reverse();
        for (const y of ys) {
            for (const x of xs) {
                const box = { x, y, w: size.w, h: size.h };
                if (Object.keys(placed).every((k) => !overlaps(box, placed[k]))) { put(id, lines, box, leaderFor(box), fbPin); return; }
            }
        }
        const box = { x: xs[0] ?? lo, y: view.top, w: size.w, h: size.h };
        put(id, lines, box, leaderFor(box), fbPin);
    }

    const downTo = (a, b) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    const vertLeaderDown = (tx, ty) => (box) => {
        if (box.y + box.h >= ty) return null;
        return downTo({ x: clamp(Math.round(tx), box.x + 2, box.x + box.w - 2), y: box.y + box.h }, { x: Math.round(tx), y: ty });
    };
    const vertLeaderUp = (tx, ty) => (box) => {
        if (box.y <= ty) return null;
        return downTo({ x: clamp(Math.round(tx), box.x + 2, box.x + box.w - 2), y: box.y }, { x: Math.round(tx), y: ty });
    };

    // Rows above the springs: the label's foot sits just over the spring tops
    const topRows = (h) => {
        const first = Math.max(view.top, PIN_TOP - 4 - h);
        return [...range(first, view.top, -(h + GAP)), ...range(first + 4, PIN_BOTTOM, 4)];
    };
    // Rows under the keyway, inside the lock body
    const bottomRows = (h) => range(KEYWAY_BOTTOM + 4, view.bottom - h - 1, h + GAP);

    const steps = {};

    const specs = {};

    // 1. SHEAR LINE: beside the last pin, on the shear line (one line, or two when short of room)
    specs.shear = () => {
        const right = Math.round(pinAt(n - 1) + PIN_HALF_WIDTH + 8);
        const out = [];
        for (const lines of [['SHEAR LINE'], ['SHEAR', 'LINE']]) {
            const size = measure(lines, font);
            cands(lines, size,
                [Math.round(SHEAR_Y - size.h / 2), ...range(Math.round(SHEAR_Y - size.h / 2) + 4, Math.round(SHEAR_Y + 60), 4)],
                (s) => range(right, view.right - s.w - 1, 4), () => null, -1, out);
        }
        return { out, fb: () => fallback('shear', ['SHEAR', 'LINE'], measure(['SHEAR', 'LINE'], font), () => null) };
    };

    // 2. Tension Wrench: left of the wrench's upright, level with the middle of the lock
    specs.wrench = () => {
        const lines = ['Tension', 'Wrench'];
        const size = measure(lines, font);
        const x = Math.max(lo, WRENCH_ARM_X - 3 - size.w);
        const ys = around(150 - size.h / 2, view.top, KEYWAY_BOTTOM - size.h, 4);
        const foot = WRENCH_UPRIGHT.y + WRENCH_UPRIGHT.h;
        const leader = (box) => {
            if (box.x + box.w < WRENCH_ARM_X - 1) {
                return downTo({ x: box.x + box.w, y: Math.round(box.y + box.h / 2) }, { x: WRENCH_ARM_X, y: Math.round(box.y + box.h / 2) });
            }
            if (box.y <= foot) return null;
            const tx = clamp(WRENCH_ARM_X + 5, box.x + 2, box.x + box.w - 2);
            return tx > WRENCH_ARM_X && tx < WRENCH_ARM_X + 10 ? downTo({ x: tx, y: box.y }, { x: tx, y: foot }) : null;
        };
        // The upright is a part (see `parts`): a label too wide for the strip left of it (below
        // about 0.62) goes under its foot, or under the hook's bar, with a leader up to the upright
        const out = [];
        cands(lines, size, ys, () => [x], leader, -1, out);
        cands(lines, size, range(foot + 4, HOOK_SHAFT_Y - size.h - 2, 4), () => range(lo, WRENCH_ARM_X + 3, 4), leader, -1, out);
        late([['Tension Wrench'], lines], (s) => range(Math.max(lo, WRENCH_ARM_X + 5 - s.w + 3), WRENCH_ARM_X + 2, 2), leader, -1, out);
        return { out, fb: () => fallback('wrench', lines, size, leader) };
    };

    // 3. Hook Pick: left of the lock, under the hook's bar, leader up to the bar
    specs.hook = () => {
        const lines = ['Hook', 'Pick'];
        const size = measure(lines, font);
        const x = Math.max(lo, WRENCH_ARM_X - 3 - size.w);
        const ys = range(HOOK_BAR_Y + 8, view.bottom - size.h - 1, 4);
        const leader = (box) => downTo({ x: Math.floor(box.x + box.w / 2), y: box.y }, { x: Math.floor(box.x + box.w / 2), y: HOOK_BAR_Y + 4 });
        // The bar runs from far off-screen to the last pin, so the label may slide right
        const slide = (s) => range(lo, Math.floor(pinAt(n - 1) - s.w / 2), 4);
        const out = [];
        cands(lines, size, ys, () => [x, ...slide(size)], leader, -1, out);
        late([['Hook Pick'], lines], slide, leader, -1, out);
        return { out, fb: () => fallback('hook', lines, size, leader) };
    };

    // 4. Spring: above the first pin's spring, else under the keyway with a leader up the gap
    specs.spring = () => {
        const lines = ['Spring'];
        const size = measure(lines, font);
        const ty = PIN_TOP + 2;
        const tx = pinAt(0);
        const out = [];
        for (const i of pinOrder(0)) {
            cands(lines, size, topRows(size.h), (s) => around(pinAt(i) - s.w / 2, lo, view.right - s.w - 1), vertLeaderDown(pinAt(i), ty), i, out);
        }
        for (const i of pinOrder(0)) {
            viaGap([lines], gapsOf(i, -3), i, PIN_TOP + 30, out);
        }
        return { out, fb: () => fallback('spring', lines, size, vertLeaderDown(tx, ty), tx) };
    };

    // 5. Driver Pin: in the top row beside Spring, leader down to the second pin's driver pin
    specs.driver = () => {
        const lines = ['Driver Pin'];
        const size = measure(lines, font);
        const tx = pinAt(1), ty = SHEAR_Y + 8;
        const out = [];
        for (const i of pinOrder(1)) {
            cands(lines, size, topRows(size.h), (s) => around(pinAt(i) - s.w / 2, lo, view.right - s.w - 1), vertLeaderDown(pinAt(i), ty), i, out);
        }
        for (const i of pinOrder(1)) {
            viaGap([lines, ['Driver', 'Pin']], gapsOf(i), i, ty, out);
        }
        return { out, fb: () => fallback('driver', lines, size, vertLeaderDown(tx, ty), tx) };
    };

    // 6. Key Pin: under the keyway, leader up to the foot of the third pin's key pin
    specs.key = () => {
        const lines = ['Key Pin'];
        const size = measure(lines, font);
        const tx = pinAt(2), ty = PIN_BOTTOM - 2;
        const out = [];
        for (const i of pinOrder(2)) {
            cands(lines, size, bottomRows(size.h), (s) => around(pinAt(i) - s.w / 2, lo, view.right - s.w - 1), vertLeaderUp(pinAt(i), ty), i, out);
        }
        for (const i of pinOrder(2)) {
            const t = pinAt(i);
            late([lines], (s) => around(t - s.w / 2, Math.max(lo, Math.round(t) - s.w + 3), Math.min(view.right - s.w - 1, Math.round(t) - 3), 2), vertLeaderUp(t, ty), i, out);
        }
        return { out, fb: () => fallback('key', lines, size, vertLeaderUp(tx, ty), tx, true) };
    };

    // Depth-first over every label's candidate spots (first fit wins; backtracks when a later
    // label finds no room). Over budget, or with no solution: first fit per label, then a fallback
    const order = ['shear', 'wrench', 'hook', 'spring', 'driver', 'key'];
    const sp = {};
    for (const id of order) {
        sp[id] = specs[id]();
        sp[id].out = sp[id].out.filter((c) => staticOk(c.box, c.leader, c.named));
        // Hysteresis: a re-layout at a new font keeps what the player already saw (the same
        // wording, pin and row) when it still fits
        const pl = prev && prev.font !== font ? prev.labels?.[id] : null;
        if (pl) {
            const same = (c) => c.lines.join() === pl.lines.join() && c.named === pl.pin && Math.abs(c.box.y - pl.y) <= 40 && Math.abs(c.box.x - pl.x) <= 60;
            sp[id].out = [...sp[id].out.filter(same), ...sp[id].out.filter((c) => !same(c))];
        }
    }
    // Node budget: a solved layout is found within a few thousand nodes (the hardest, 8 pins at 0.40,
    // uses about 53,000), so the cap only bounds a pathological case
    const startBudget = 250000;
    let budget = startBudget;
    // The index of the last candidate that fit, per label: checked first by the forward check
    const support = {};
    const hasRoomForRest = (from) => {
        for (let j = from; j < order.length; j++) {
            const id = order[j], list = sp[id].out;
            const k = support[id];
            if (k !== undefined && clearOfPlaced(list[k].box, list[k].leader)) continue;
            let found = false;
            for (let q = 0; q < list.length; q++) {
                if (clearOfPlaced(list[q].box, list[q].leader)) { support[id] = q; found = true; break; }
            }
            if (!found) return false;
        }
        return true;
    };
    const rec = (i) => {
        if (i === order.length) return true;
        const id = order[i];
        const tried = new Set();
        let count = 0;
        for (const c of sp[id].out) {
            // Near-identical spots lead to the same dead end: try a spread, one per 20px cell
            const cell = c.lines.join() + '|' + c.named + '|' + Math.floor(c.box.x / 20) + '|' + Math.floor(c.box.y / 20);
            if (tried.has(cell)) continue;
            if (--budget < 0) return false;
            if (!clearOfPlaced(c.box, c.leader)) continue;
            tried.add(cell);
            count++;
            put(id, c.lines, c.box, c.leader, c.named);
            // Forward check: a later label with no clear spot left ends this branch at once.
            // (It only skips branches that cannot finish, so the first layout found is unchanged.)
            if (hasRoomForRest(i + 1) && rec(i + 1)) return true;
            delete placed[id];
            if (count >= 3000 || budget < 0) return false;
        }
        return false;
    };
    const solved = rec(0);
    if (!solved) {
        for (const id of order) delete placed[id];
        for (const id of order) {
            const c = sp[id].out.find((k) => clearOfPlaced(k.box, k.leader));
            if (c) put(id, c.lines, c.box, c.leader, c.named); else sp[id].fb();
        }
    }
    return { font, labels: placed, fallbacks, solved, nodes: startBudget - budget };
}

// A leader as crisp 2px rectangles (no antialiasing): axis-aligned in practice, a stepped
// line in the rare diagonal case
export function leaderRects(l) {
    const out = [];
    if (l.x1 === l.x2) out.push({ x: l.x1 - 1, y: Math.min(l.y1, l.y2), w: 2, h: Math.abs(l.y2 - l.y1) });
    else if (l.y1 === l.y2) out.push({ x: Math.min(l.x1, l.x2), y: l.y1 - 1, w: Math.abs(l.x2 - l.x1), h: 2 });
    else {
        const steps = Math.max(Math.abs(l.x2 - l.x1), Math.abs(l.y2 - l.y1));
        for (let i = 0; i <= steps; i++) {
            out.push({ x: Math.round(l.x1 + (l.x2 - l.x1) * i / steps) - 1, y: Math.round(l.y1 + (l.y2 - l.y1) * i / steps) - 1, w: 2, h: 2 });
        }
    }
    return out;
}

/**
 * Applies the layout to the live lock's Phaser texts and draws the leader lines. Positions are
 * world positions; the wrench's and the hook's labels live inside the wrench container, so
 * they are converted to its local space.
 */
export class LockLabels {
    constructor(parent) {
        this.parent = parent;
        this._last = '';
        this._result = null;
        this._disposed = false;
        this._hidden = false; // the first pin press hid the labels for good: never lay out again
    }

    scale() {
        const p = this.parent;
        try {
            const canvas = p.game?.canvas;
            const baseW = p.game?.scale?.gameSize?.width || p.game?.config?.width;
            const w = canvas?.getBoundingClientRect?.().width;
            if (w > 0 && baseW > 0) return w / baseW;
        } catch (e) { /* no canvas yet */ }
        return 1;
    }

    texts() {
        const p = this.parent;
        return {
            spring: p.springLabel, driver: p.driverPinLabel, key: p.keyPinLabel,
            shear: p.shearLineText, wrench: p.wrenchText, hook: p.hookPickLabel
        };
    }

    apply() {
        if (this._disposed || this._hidden) return null;
        const p = this.parent;
        const t = this.texts();
        if (!p.scene || !p.pins?.length || Object.values(t).some((x) => !x)) return null;
        const cam = p.scene.cameras?.main;
        const view = cam
            ? { left: cam.scrollX, top: cam.scrollY, right: cam.scrollX + cam.width, bottom: cam.scrollY + cam.height }
            : { left: 0, top: 0, right: 600, bottom: 400 };
        const scale = this.scale();
        const font = layoutFontSize(scale);
        t.spring.setPadding(LABEL_PAD_X, LABEL_PAD_Y, LABEL_PAD_X, LABEL_PAD_Y);
        const measure = (lines, f) => {
            // Measure with the real font: set it on a probe label, read its size
            const probe = t.spring;
            probe.setFontSize(f + 'px');
            probe.setText(lines.join('\n'));
            return { w: Math.ceil(probe.width), h: Math.ceil(probe.height) };
        };
        const pinXs = p.pins.map((pin) => pin.container.x);
        const blocked = this.coveredRects(view);
        const key = [font, view.left, view.top, view.right, view.bottom, pinXs.join(','), blockedSig(blocked)].join('|');
        if (key === this._last) return null;
        this._last = key;
        const result = layoutLockLabels({ scale, pinXs, view, measure, prev: this._result, blocked });
        const wc = p.tensionWrench;
        const offX = wc ? wc.x : 0, offY = wc ? wc.y : 0;
        for (const id of Object.keys(t)) {
            const box = result.labels[id];
            const txt = t[id];
            txt.setFontSize(result.font + 'px');
            txt.setText(box.lines.join('\n'));
            txt.setAlign('center');
            txt.setPadding(LABEL_PAD_X, LABEL_PAD_Y, LABEL_PAD_X, LABEL_PAD_Y);
            txt.setBackgroundColor('#0b0f0c');
            txt.setOrigin(0, 0);
            const inWrench = id === 'wrench' || id === 'hook';
            // Whole pixels, so the text is not resampled between canvas pixels
            txt.setPosition(Math.round(inWrench ? box.x - offX : box.x), Math.round(inWrench ? box.y - offY : box.y));
        }
        this.drawLeaders(result);
        return result;
    }

    // Canvas areas (world pixels) that a page element covers: the feedback box when it sits over
    // the foot of the canvas (the sticky box, in a game area that has scrolled). No label goes
    // there. The box is measured directly. The band that once showed over the top of the
    // canvas on a desktop window was the sticky box's own layer ghosting above a canvas that
    // ran past the window, not an element: the canvas now shrinks to fit (lockZoom), so no
    // page sampling is needed.
    coveredRects(view) {
        const p = this.parent;
        const out = [];
        try {
            const canvas = p.game?.canvas;
            const r = canvas?.getBoundingClientRect?.();
            if (!r || !(r.width > 0) || !(r.height > 0)) return out;
            const sx = (view.right - view.left) / r.width, sy = (view.bottom - view.top) / r.height;
            const toWorld = (b) => {
                const left = Math.max(b.left, r.left), right = Math.min(b.right, r.right);
                const top = Math.max(b.top, r.top), bottom = Math.min(b.bottom, r.bottom);
                if (!(right > left) || !(bottom > top)) return null;
                const x = Math.floor(view.left + (left - r.left) * sx), y = Math.floor(view.top + (top - r.top) * sy);
                return { x, y, w: Math.ceil(view.left + (right - r.left) * sx) - x, h: Math.ceil(view.top + (bottom - r.top) * sy) - y };
            };
            const fb = p.feedback?.getBoundingClientRect?.();
            if (fb && fb.height > 0 && p.feedback.offsetParent !== null) { const w = toWorld(fb); if (w) out.push(w); }
        } catch (e) { /* no page: nothing covers the canvas */ }
        return out;
    }

    // Leaders follow their label: a label that is hidden (first pin press, key mode) has no leader
    drawLeaders(result) {
        const p = this.parent;
        if (result) this._result = result;
        if (!this._result) return;
        if (!p.labelLeaders) {
            p.labelLeaders = p.scene.add.graphics();
            p.labelLeaders.setDepth(99); // under the labels (100), over the pins
        }
        const g = p.labelLeaders;
        const t = this.texts();
        g.clear();
        g.fillStyle(0x00ff00, 1);
        for (const id of Object.keys(this._result.labels)) {
            const l = this._result.labels[id].leader;
            if (!l || !t[id] || t[id].visible === false) continue;
            for (const r of leaderRects(l)) g.fillRect(r.x, r.y, r.w, r.h);
        }
        g.setVisible(true);
    }

    syncLeaders() {
        try { this.drawLeaders(null); } catch (e) { /* scene gone */ }
    }

    // First pin press: hide every teaching label and its leader together
    hideTeachingLabels() {
        this._hidden = true;
        const t = this.texts();
        for (const id of Object.keys(t)) t[id]?.setVisible?.(false);
        this.syncLeaders();
    }

    dispose() {
        this._disposed = true;
        for (const id of this._timers || []) clearTimeout(id);
        this._timers = [];
        try { if (this._again) this.parent.game?.scale?.off?.('resize', this._again); } catch (e) { /* game gone */ }
        try { this._feedbackObserver?.disconnect?.(); } catch (e) { /* observer gone */ }
    }

    // Lay out again whenever the canvas is rescaled (rotation, resize, layout change)
    watch() {
        const p = this.parent;
        const again = () => { try { this.apply(); } catch (e) { /* scene gone */ } };
        this._again = again;
        try { p.game?.scale?.on?.('resize', again); } catch (e) { /* no scale */ }
        // The feedback box grows and shrinks with its line count without the window resizing
        try {
            if (typeof ResizeObserver !== 'undefined' && p.feedback) {
                this._feedbackObserver = new ResizeObserver(again);
                this._feedbackObserver.observe(p.feedback);
            }
        } catch (e) { /* no observer */ }
        // The FIT scale settles after the first frames
        this._timers = [150, 600].map((ms) => setTimeout(again, ms));
        // VT323 may load after the first layout: measure again with the real glyph widths
        try {
            const f = document.fonts;
            if (f?.load) f.load('24px VT323').then(() => { this._last = ''; again(); }, () => {});
        } catch (e) { /* no font API */ }
    }
}
