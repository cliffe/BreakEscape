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

const GAP = 2;

// Whole pixel font size that draws at least MIN_SCREEN_PX on screen at this canvas scale
export function labelFontSize(scale, base = BASE_FONT_PX) {
    const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return Math.max(base, Math.ceil(MIN_SCREEN_PX / s - 1e-9));
}

function overlaps(a, b, gap = GAP) {
    return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

// Does the segment pass through the rectangle (sampled every 2px; leaders are short)
export function segmentHitsRect(seg, r) {
    if (!seg) return false;
    const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 2));
    for (let i = 0; i <= n; i++) {
        const x = seg.x1 + dx * i / n, y = seg.y1 + dy * i / n;
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
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

 * @returns {{font:number, fallbacks:number, labels:Object<string,{x,y,w,h,lines:string[],leader:object|null}>}}
 */
export function layoutLockLabels({ scale, pinXs, view, measure }) {
    const font = labelFontSize(scale);
    const pinBoxes = pinXs.map((x) => ({ x: x - PIN_HALF_WIDTH, y: PIN_TOP, w: PIN_HALF_WIDTH * 2, h: PIN_BOTTOM - PIN_TOP }));
    const n = pinXs.length;
    const pinAt = (i) => pinXs[Math.min(Math.max(i, 0), n - 1)];
    const idxAt = (i) => Math.min(Math.max(i, 0), n - 1);
    const placed = {};
    let fallbacks = 0;
    const lo = view.left + 1;

    // A candidate is acceptable when its box misses every placed label, every pin it does not
    // name, and its leader (if any) passes through no placed label
    let blockers = [];
    function fits(box, leader, namedPin) {
        for (const b of blockers) if (overlaps(box, b, 0)) return false;
        if (box.x < lo || box.x + box.w > view.right - 1 || box.y < view.top || box.y + box.h > view.bottom - 1) return false;
        for (const id of Object.keys(placed)) {
            if (overlaps(box, placed[id])) return false;
            if (segmentHitsRect(leader, placed[id])) return false;
        }
        for (let i = 0; i < pinBoxes.length; i++) {
            if (i === namedPin) continue;
            if (overlaps(box, pinBoxes[i], 1)) return false;
            if (segmentHitsRect(leader, pinBoxes[i])) return false; // a leader never crosses a pin it does not name
        }
        return true;
    }

    function put(id, lines, size, leader) {
        placed[id] = { x: size.x, y: size.y, w: size.w, h: size.h, lines, leader };
    }

    // Try each (y, x) in order; leaderFor(box) gives the leader for a candidate box
    function place(id, lines, size, ys, xsFor, leaderFor, namedPin) {
        for (const y of ys) {
            for (const x of xsFor(size)) {
                const box = { x, y, w: size.w, h: size.h };
                const leader = leaderFor(box);
                if (fits(box, leader, namedPin)) { put(id, lines, box, leader); return true; }
            }
        }
        return false;
    }

    // Last resort (a very small canvas, so very large type): the first clear spot in the view,
    // keeping labels apart from each other even if it must cross a pin. A label that names a
    // pin (target tx) always spans that pin's column, so its leader stays straight and never
    // runs across another pin.
    function fallback(id, lines, size, leaderFor, tx, fromBottom) {
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
                if (Object.keys(placed).every((k) => !overlaps(box, placed[k]))) { put(id, lines, box, leaderFor(box)); return; }
            }
        }
        const box = { x: xs[0] ?? lo, y: view.top, w: size.w, h: size.h };
        put(id, lines, box, leaderFor(box));
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

    // 1. SHEAR LINE: beside the last pin, on the shear line (one line, or two when short of room)
    {
        const right = Math.round(pinAt(n - 1) + PIN_HALF_WIDTH + 8);
        const one = measure(['SHEAR LINE'], font);
        const two = measure(['SHEAR', 'LINE'], font);
        const tryIt = (lines, size) => place('shear', lines, size,
            [Math.round(SHEAR_Y - size.h / 2), ...range(Math.round(SHEAR_Y - size.h / 2) + 4, Math.round(SHEAR_Y + 60), 4)],
            (s) => range(right, view.right - s.w - 1, 4), () => null, -1);
        if (!tryIt(['SHEAR LINE'], one) && !tryIt(['SHEAR', 'LINE'], two)) fallback('shear', ['SHEAR', 'LINE'], two, () => null);
    }

    // 2. Tension Wrench: left of the wrench's upright, level with the middle of the lock
    {
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
        // The upright (plus a 4px gap for a leader) is an obstacle: a label too wide for the strip
        // left of it (below about 0.62) goes under its foot instead, with a leader up to it
        blockers = [{ ...WRENCH_UPRIGHT, h: WRENCH_UPRIGHT.h + 4 }];
        const ok = place('wrench', lines, size, ys, () => [x], leader, -1)
            || place('wrench', lines, size, range(foot + 4, view.bottom - size.h - 1, 4),
                () => range(lo, WRENCH_ARM_X + 3, 4), leader, -1);
        blockers = [];
        if (!ok) fallback('wrench', lines, size, leader);
    }

    // 3. Hook Pick: left of the lock, under the hook's bar, leader up to the bar
    {
        const lines = ['Hook', 'Pick'];
        const size = measure(lines, font);
        const x = Math.max(lo, WRENCH_ARM_X - 3 - size.w);
        const ys = range(HOOK_BAR_Y + 8, view.bottom - size.h - 1, 4);
        const leader = (box) => downTo({ x: Math.floor(box.x + box.w / 2), y: box.y }, { x: Math.floor(box.x + box.w / 2), y: HOOK_BAR_Y + 4 });
        // The bar runs from far off-screen to the last pin, so the label may slide right to clear the wrench label's leader
        if (!place('hook', lines, size, ys, () => [x, ...range(lo, Math.floor(pinAt(n - 1) - size.w / 2), 4)], leader, -1)) fallback('hook', lines, size, leader);
    }

    // 4. Spring: above the first pin's spring
    {
        const lines = ['Spring'];
        const size = measure(lines, font);
        const tx = pinAt(0), ty = PIN_TOP + 2;
        const ok = place('spring', lines, size, topRows(size.h),
            (s) => around(tx - s.w / 2, lo, view.right - s.w - 1), vertLeaderDown(tx, ty), 0);
        if (!ok) fallback('spring', lines, size, vertLeaderDown(tx, ty), tx);
    }

    // 5. Driver Pin: in the top row beside Spring, leader down to the second pin's driver pin
    {
        const lines = ['Driver Pin'];
        const size = measure(lines, font);
        const tx = pinAt(1), ty = SHEAR_Y + 8;
        const ok = place('driver', lines, size, topRows(size.h),
            (s) => around(tx - s.w / 2, lo, view.right - s.w - 1), vertLeaderDown(tx, ty), idxAt(1));
        if (!ok) fallback('driver', lines, size, vertLeaderDown(tx, ty), tx);
    }

    // 6. Key Pin: under the keyway, leader up to the foot of the third pin's key pin
    {
        const lines = ['Key Pin'];
        const size = measure(lines, font);
        const tx = pinAt(2), ty = PIN_BOTTOM - 2;
        const ok = place('key', lines, size, bottomRows(size.h),
            (s) => around(tx - s.w / 2, lo, view.right - s.w - 1), vertLeaderUp(tx, ty), idxAt(2));
        if (!ok) fallback('key', lines, size, vertLeaderUp(tx, ty), tx, true);
    }

    return { font, labels: placed, fallbacks };
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
        if (this._disposed) return null;
        const p = this.parent;
        const t = this.texts();
        if (!p.scene || !p.pins?.length || Object.values(t).some((x) => !x)) return null;
        const cam = p.scene.cameras?.main;
        const view = cam
            ? { left: cam.scrollX, top: cam.scrollY, right: cam.scrollX + cam.width, bottom: cam.scrollY + cam.height }
            : { left: 0, top: 0, right: 600, bottom: 400 };
        const scale = this.scale();
        const font = labelFontSize(scale);
        t.spring.setPadding(LABEL_PAD_X, LABEL_PAD_Y, LABEL_PAD_X, LABEL_PAD_Y);
        const measure = (lines, f) => {
            // Measure with the real font: set it on a probe label, read its size
            const probe = t.spring;
            probe.setFontSize(f + 'px');
            probe.setText(lines.join('\n'));
            return { w: Math.ceil(probe.width), h: Math.ceil(probe.height) };
        };
        const pinXs = p.pins.map((pin) => pin.container.x);
        const key = [font, view.left, view.top, view.right, view.bottom, pinXs.join(',')].join('|');
        if (key === this._last) return null;
        this._last = key;
        const result = layoutLockLabels({ scale, pinXs, view, measure });
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
        const t = this.texts();
        for (const id of Object.keys(t)) t[id]?.setVisible?.(false);
        this.syncLeaders();
    }

    dispose() {
        this._disposed = true;
        for (const id of this._timers || []) clearTimeout(id);
        this._timers = [];
        try { if (this._again) this.parent.game?.scale?.off?.('resize', this._again); } catch (e) { /* game gone */ }
    }

    // Lay out again whenever the canvas is rescaled (rotation, resize, layout change)
    watch() {
        const p = this.parent;
        const again = () => { try { this.apply(); } catch (e) { /* scene gone */ } };
        this._again = again;
        try { p.game?.scale?.on?.('resize', again); } catch (e) { /* no scale */ }
        // The FIT scale settles after the first frames
        this._timers = [150, 600].map((ms) => setTimeout(again, ms));
        // VT323 may load after the first layout: measure again with the real glyph widths
        try {
            const f = document.fonts;
            if (f?.load) f.load('24px VT323').then(() => { this._last = ''; again(); }, () => {});
        } catch (e) { /* no font API */ }
    }
}
