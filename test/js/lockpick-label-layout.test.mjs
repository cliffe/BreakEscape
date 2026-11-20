// D219: lockpicking labels are at least 16px on screen at the phone scale and sit clear of
// each other and of every pin they do not name (leader lines excepted).
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/lockpicking/label-layout.js')).href);
const { layoutLockLabels, labelFontSize, layoutFontSize, clearLayoutMemo, MIN_LAYOUT_SCALE, leaderLegs, segmentHitsRect, leaderRects, LockLabels, PIN_TOP, PIN_BOTTOM, PIN_HALF_WIDTH, WRENCH_UPRIGHT } = mod;
const src = (f) => readFileSync(join(here, '../../public/break_escape/js/minigames/lockpicking/' + f), 'utf8');

// VT323 is about 0.4em wide per character; the estimate is a little wider than that
const measure = (lines, font) => {
    const chars = Math.max(...lines.map((l) => l.length));
    return { w: Math.ceil(chars * font * 0.42) + 6, h: lines.length * Math.ceil(font * 1.25) + 2 };
};
// VT323 as measured live: 0.4em advance, 1em line (the estimate above is a little wider)
const realMeasure = (lines, font) => ({ w: Math.ceil(Math.max(...lines.map((l) => l.length)) * font * 0.4) + 6, h: lines.length * font + 2 });
const pinXsFor = (n) => {
    const spacing = 400 / (n + 1), margin = spacing * 0.75;
    return Array.from({ length: n }, (_, i) => 100 + margin + i * spacing);
};
const views = {
    portrait: { left: 0, top: 20, right: 580, bottom: 360 },
    landscape: { left: 0, top: 30, right: 580, bottom: 370 },
    desktop: { left: 0, top: 0, right: 600, bottom: 400 }
};
// Spring, Driver Pin and Key Pin name a KIND of part (D219 R3, AC1): each may point at any pin of
// that kind, and records which one as `pin`. Every other label names no pin (-1).
const pinKind = new Set(['spring', 'driver', 'key']);
const namedPin = (r, id, n) => (pinKind.has(id) ? r.labels[id].pin : -1);

for (const scale of [0.67, 1, 0.56, 0.55, 0.47]) {
    for (const n of [3, 4, 5, 6]) {
        for (const [vn, view] of Object.entries(views)) {
            if (vn === "desktop" && scale !== 1) continue;
            const tag = `scale ${scale}, ${n} pins, ${vn}`;
            const pinXs = pinXsFor(n);
            // 0.47 and below only fit with the real glyph widths
            const r = layoutLockLabels({ scale, pinXs, view, measure: scale <= 0.5 ? realMeasure : measure });
            const ids = Object.keys(r.labels);

            test(`six labels, drawn at least 16px on screen (${tag})`, () => {
                assert.ok(ids.length === 6, 'six labels, got ' + ids.length);
                assert.ok(r.font * scale >= 16, `font ${r.font} x ${scale} >= 16`);
                assert.ok(Number.isInteger(r.font), 'whole pixel font');
            });

            test(`no label overlaps another or sits off the view (${tag})`, () => {
                for (let i = 0; i < ids.length; i++) {
                    const a = r.labels[ids[i]];
                    assert.ok(a.x >= view.left && a.x + a.w <= view.right && a.y >= view.top && a.y + a.h <= view.bottom,
                        `${ids[i]} inside the view`);
                    for (let j = i + 1; j < ids.length; j++) {
                        const b = r.labels[ids[j]];
                        const hit = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
                        assert.ok(!hit, `${ids[i]} and ${ids[j]} overlap`);
                    }
                }
            });

            test(`no label covers a pin it does not name (${tag})`, () => {
                for (const id of ids) {
                    const a = r.labels[id];
                    pinXs.forEach((x, p) => {
                        if (p === namedPin(r, id, n)) return;
                        const hit = a.x < x + PIN_HALF_WIDTH && x - PIN_HALF_WIDTH < a.x + a.w && a.y < PIN_BOTTOM && PIN_TOP < a.y + a.h;
                        assert.ok(!hit, `${id} covers pin ${p + 1}`);
                    });
                }
            });

            test(`positions are whole pixels and leaders are axis-aligned (${tag})`, () => {
                for (const id of ids) {
                    const a = r.labels[id];
                    assert.ok(Number.isInteger(a.x) && Number.isInteger(a.y), `${id} at whole pixels, got ${a.x},${a.y}`);
                    const l = a.leader;
                    if (!l) continue;
                    assert.ok([l.x1, l.y1, l.x2, l.y2].every(Number.isInteger), `${id} leader endpoints whole, got ${JSON.stringify(l)}`);
                    // 0.47 is a real phone scale (740x360 with the observations open): leaders stay straight
                    assert.ok(l.x1 === l.x2 || l.y1 === l.y2, `${id} leader axis-aligned, got ${JSON.stringify(l)}`);
                }
            });

            test(`no leader line runs through another label (${tag})`, () => {
                for (const id of ids) {
                    for (const other of ids) {
                        if (other === id) continue;
                        assert.ok(!segmentHitsRect(r.labels[id].leader, r.labels[other]), `${id} leader crosses ${other}`);
                    }
                }
            });
        }
    }
}

test('font size follows the canvas scale in whole pixels', () => {
    assert.ok(labelFontSize(0.67) === 24, '0.67 gives 24');
    assert.ok(labelFontSize(1) === 18, '1 keeps the 18px base');
    assert.ok(labelFontSize(0.5) === 32, '0.5 gives 32');
    assert.ok(labelFontSize(0) === 18 && labelFontSize(NaN) === 18, 'bad scale falls back');
});

test('driver and key labels no longer sit over pins 2 and 3 (the old layout did)', () => {
    // main drew "Driver Pin" at (pin 2 x, 165) and "Key Pin" at (pin 3 x, mid key pin): both over pins
    const pinXs = pinXsFor(5);
    const r = layoutLockLabels({ scale: 0.67, pinXs, view: views.portrait, measure });
    for (const id of ['driver', 'key']) {
        const a = r.labels[id];
        const inBand = a.y < PIN_BOTTOM && PIN_TOP < a.y + a.h;
        assert.ok(!inBand, `${id} is outside the pins' height band`);
    }
});

// A label must keep a pixel clear of every pin it does not name
function overlapsPin(a, pinXs, skip) {
    return pinXs.some((x, p) => p !== skip && a.x < x + PIN_HALF_WIDTH + 1 && x - PIN_HALF_WIDTH < a.x + a.w + 1 && a.y < PIN_BOTTOM && PIN_TOP < a.y + a.h);
}

test('the pin check decides placement when the top rows are gone (4 pins, view starts at y 45)', () => {
    // Rows above the springs do not fit, so Spring and Driver Pin are tried beside the pins
    const pinXs = pinXsFor(4);
    const r = layoutLockLabels({ scale: 0.67, pinXs, view: { left: 0, top: 45, right: 580, bottom: 360 }, measure });
    assert.ok(r.fallbacks === 0, 'no fallback, got ' + r.fallbacks);
    for (const id of ['spring', 'driver', 'key', 'shear', 'wrench', 'hook']) {
        const pin = pinKind.has(id) ? r.labels[id].pin : -1;
        assert.ok(!pinKind.has(id) || (pin >= 0 && pin < 4), `${id} names a real pin, got ${pin}`);
        assert.ok(!overlapsPin(r.labels[id], pinXs, pin), `${id} covers a pin it does not name`);
    }
});

test('a leader never runs through a placed label when space is tight (1 pin, view starts at y 90)', () => {
    const r = layoutLockLabels({ scale: 0.67, pinXs: pinXsFor(1), view: { left: 0, top: 90, right: 580, bottom: 360 }, measure });
    assert.ok(r.fallbacks === 0, 'no fallback, got ' + r.fallbacks);
    for (const id of Object.keys(r.labels)) {
        for (const other of Object.keys(r.labels)) {
            if (other !== id) assert.ok(!segmentHitsRect(r.labels[id].leader, r.labels[other]), `${id} leader crosses ${other}`);
        }
    }
});

test('the fallback is counted when a label has nowhere clear to go (8 pins, narrow view)', () => {
    const r = layoutLockLabels({ scale: 0.67, pinXs: pinXsFor(8), view: { left: 0, top: 20, right: 520, bottom: 360 }, measure });
    assert.ok(r.fallbacks === 1, 'one fallback, got ' + r.fallbacks);
    const ok = layoutLockLabels({ scale: 0.67, pinXs: pinXsFor(5), view: views.portrait, measure });
    assert.ok(ok.fallbacks === 0, 'the normal case has none');
});

test('leaders draw as crisp 2px rectangles', () => {
    const v = leaderRects({ x1: 100, y1: 40, x2: 100, y2: 90 });
    assert.ok(v.length === 1 && v[0].x === 99 && v[0].y === 40 && v[0].w === 2 && v[0].h === 50, 'vertical: ' + JSON.stringify(v));
    const h = leaderRects({ x1: 60, y1: 120, x2: 80, y2: 120 });
    assert.ok(h.length === 1 && h[0].x === 60 && h[0].y === 119 && h[0].w === 20 && h[0].h === 2, 'horizontal: ' + JSON.stringify(h));
    const d = leaderRects({ x1: 10, y1: 10, x2: 14, y2: 20 });
    assert.ok(d.length > 4 && d.every((r) => r.w === 2 && r.h === 2 && Number.isInteger(r.x) && Number.isInteger(r.y)), 'diagonal is stepped 2px squares');
});

// ---- A fake Phaser scene to drive LockLabels.apply / hide / dispose ----
function fakeParent(opts = {}) {
    const k = { glyph: 0.4 };
    class Txt {
        constructor() { this.visible = true; this.font = 18; this.text = ''; this.x = 0; this.y = 0; this.bg = null; this.origin = null; }
        setFontSize(f) { this.font = parseInt(f, 10); return this; }
        setText(t) { this.text = t; return this; }
        get width() { return Math.max(...this.text.split('\n').map((l) => l.length)) * this.font * k.glyph + 6; }
        get height() { return this.text.split('\n').length * this.font + 2; }
        setPadding() { return this; } setAlign() { return this; }
        setBackgroundColor(c) { this.bg = c; return this; }
        setOrigin(a, b) { this.origin = [a, b]; return this; }
        setPosition(x, y) { this.x = x; this.y = y; return this; }
        setVisible(v) { this.visible = v; return this; }
    }
    const g = { rects: [], visible: true, clear() { this.rects = []; }, fillStyle() {}, fillRect(x, y, w, h) { this.rects.push([x, y, w, h]); }, setVisible(v) { this.visible = v; }, setDepth() {} };
    const handlers = {};
    const p = {
        k, g, handlers, pinClicked: false,
        scene: { add: { graphics: () => g }, cameras: { main: { scrollX: 0, scrollY: opts.scrollY ?? 20, width: 580, height: 340 } } },
        pins: [0, 1, 2, 3, 4].map((i) => ({ container: { x: 100 + 400 / 6 * 0.75 + i * 400 / 6 + (i % 2) * 0.33 } })),
        tensionWrench: { x: 80, y: 160 },
        game: {
            canvas: { getBoundingClientRect: () => ({ width: opts.canvasW ?? 390 }) },
            scale: { gameSize: { width: 580 }, on: (e, f) => { handlers[e] = f; }, off: (e, f) => { if (handlers[e] === f) delete handlers[e]; } }
        }
    };
    for (const n of ['springLabel', 'driverPinLabel', 'keyPinLabel', 'shearLineText', 'wrenchText', 'hookPickLabel']) p[n] = new Txt();
    return p;
}

test('LockLabels.apply sets whole-pixel positions, wrench-local coordinates, dark backing and 24px type at 0.67', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    const r = ll.apply();
    assert.ok(r && r.font === 24, 'font 24, got ' + (r && r.font));
    for (const [n, t] of Object.entries({ spring: p.springLabel, driver: p.driverPinLabel, key: p.keyPinLabel, shear: p.shearLineText, wrench: p.wrenchText, hook: p.hookPickLabel })) {
        assert.ok(t.font === 24, `${n} font ${t.font}`);
        assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y), `${n} whole pixels, got ${t.x},${t.y}`);
        assert.ok(t.bg === '#0b0f0c', `${n} dark backing`);
        assert.ok(t.origin[0] === 0 && t.origin[1] === 0, `${n} top-left origin`);
    }
    assert.ok(p.wrenchText.x === r.labels.wrench.x - 80 && p.wrenchText.y === r.labels.wrench.y - 160, 'wrench label is in wrench-local space');
    assert.ok(p.hookPickLabel.x === r.labels.hook.x - 80 && p.hookPickLabel.y === r.labels.hook.y - 160, 'hook label is in wrench-local space');
    assert.ok(p.springLabel.x === r.labels.spring.x, 'spring label is in world space');
    assert.ok(p.g.rects.length >= 4 && p.g.rects.every((q) => q.every(Number.isInteger)), 'leaders drawn as whole-pixel rects');
});

test('the first pin press hides every label and every leader (pointer and keyboard paths)', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    p.lockLabels = ll;
    ll.apply();
    assert.ok(p.g.rects.length >= 4, 'leaders drawn before the press');
    ll.hideTeachingLabels();
    assert.ok(p.g.rects.length === 0, 'no leader left, got ' + p.g.rects.length);
    for (const n of ['springLabel', 'driverPinLabel', 'keyPinLabel', 'shearLineText', 'wrenchText', 'hookPickLabel']) assert.ok(p[n].visible === false, n + ' hidden');
    ll._last = '';
    ll.apply(); // a resize after the press
    assert.ok(p.g.rects.length === 0, 'a later re-layout does not bring leaders back');
    const pm = src('pin-management.js');
    const calls = pm.split('this.parent.lockLabels?.hideTeachingLabels()').length - 1;
    assert.ok(calls === 2, 'both first-press blocks call hideTeachingLabels, found ' + calls);
});

test('key mode: a hidden wrench or hook label has no leader stub', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    ll.apply();
    const before = p.g.rects.length;
    p.wrenchText.setVisible(false); p.hookPickLabel.setVisible(false);
    ll.syncLeaders();
    assert.ok(p.g.rects.length === before - 2, `two stubs gone: ${before} -> ${p.g.rects.length}`);
    p.wrenchText.setVisible(true); p.hookPickLabel.setVisible(true);
    ll.syncLeaders();
    assert.ok(p.g.rects.length === before, 'and they return with the labels');
    const tm = src('tool-manager.js');
    assert.ok(tm.split('lockLabels?.syncLeaders()').length - 1 === 4, 'tool-manager syncs leaders on all four show/hide paths');
});

test('labels re-lay out on resize, and dispose releases the listener and both timers', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    ll.apply();
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    const set = [], cleared = [];
    globalThis.setTimeout = (fn, ms) => { const id = 9000 + set.length; set.push(id); return id; };
    globalThis.clearTimeout = (id) => { cleared.push(id); };
    try {
        ll.watch();
        assert.ok(typeof p.handlers.resize === 'function', 'resize listener added');
        assert.ok(set.length === 2, 'two layout timers set, got ' + set.length);
        ll.dispose();
    } finally { globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear; }
    assert.ok(set.every((id) => cleared.includes(id)), `both timers cleared: set ${set}, cleared ${cleared}`);
    assert.ok(p.handlers.resize === undefined, 'resize listener removed');
    p.springLabel.x = -5;
    ll._last = '';
    assert.ok(ll.apply() === null && p.springLabel.x === -5, 'no layout after dispose');
});

test('a late font load is measured again', async () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    const saved = globalThis.document;
    let finish;
    globalThis.document = { fonts: { load: () => new Promise((res) => { finish = res; }) } };
    try {
        ll.apply();
        ll.watch();
        const wBefore = p.wrenchText.width;
        p.k.glyph = 0.5; // the real font arrives wider than the fallback
        finish();
        await new Promise((res) => setTimeout(res, 10));
        assert.ok(p.wrenchText.width !== wBefore, 'text re-measured');
        const box = ll._result.labels.wrench;
        assert.ok(box.w === Math.ceil(p.wrenchText.width), `box follows the new width: ${box.w} vs ${p.wrenchText.width}`);
    } finally {
        ll.dispose();
        globalThis.document = saved;
    }
});

test('Phaser glue: layout re-runs after the fit switch sets the camera scroll, and cleanup disposes', () => {
    const g = src('lockpicking-game-phaser.js');
    const scroll = g.indexOf('setScroll?.(off ? off.x : 0');
    const again = g.indexOf('this.lockLabels?.apply()', scroll);
    assert.ok(scroll > 0 && again > scroll && again - scroll < 400, 'apply follows setScroll');
    assert.ok(/cleanup\(\) \{[\s\S]{0,120}this\.lockLabels\?\.dispose\(\)/.test(g), 'cleanup disposes the labels');
});

// ---- The whole phone range of canvas scales (0.40 to 1.0) with real VT323 metrics (0.4em advance, 1em line) ----
const hits = (seg, r) => segmentHitsRect(seg, r);

// Every leg of every leader as a box padded by 3px: two leaders whose boxes meet are less than 6px
// apart (the solver keeps leaders 6px apart so they never read as one line)
function legRects(l) {
    return leaderLegs(l).map((g) => ({ x: Math.min(g.x1, g.x2) - 3, y: Math.min(g.y1, g.y2) - 3, w: Math.abs(g.x2 - g.x1) + 6, h: Math.abs(g.y2 - g.y1) + 6 }));
}
const rectsHit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

let maxNodes = 0, maxNodes45 = 0;
const checked = new Set();
test('across scales 0.24 to 1.0, 1 to 8 pins, both views: clean at 0.40 and above, the 0.40 layout below (D219 R4 M2)', () => {
    let cases = 0;
    for (let k = 24; k <= 100; k++) {
        const scale = k / 100;
        for (let n = 1; n <= 8; n++) {
            for (const view of [views.portrait, views.landscape]) {
                const pinXs = pinXsFor(n);
                // Scale reaches the solver only through the font, so scales sharing a font share one
                // solve (the memo); each distinct font is still solved fresh the first time
                const r = layoutLockLabels({ scale, pinXs, view, measure: realMeasure });
                maxNodes = Math.max(maxNodes, r.nodes);
                if (n === 4 || n === 5) maxNodes45 = Math.max(maxNodes45, r.nodes);
                if (checked.has(r)) {
                    // The same layout object as an earlier scale: only the scale-dependent checks differ
                    if (scale >= MIN_LAYOUT_SCALE - 1e-9) assert.ok(r.font * scale >= 16 - 1e-9, `font ${r.font} x ${scale} >= 16 (${n} pins)`);
                    cases++;
                    continue;
                }
                checked.add(r);
                const tag = `scale ${scale}, ${n} pins, view top ${view.top}`;
                for (const id of Object.keys(r.labels)) {
                    const l = r.labels[id].leader;
                    if (!l) continue;
                    pinXs.forEach((x, p) => {
                        if (p === namedPin(r, id, n)) return;
                        const pinBox = { x: x - PIN_HALF_WIDTH, y: PIN_TOP, w: PIN_HALF_WIDTH * 2, h: PIN_BOTTOM - PIN_TOP };
                        assert.ok(!hits(l, pinBox), `${id} leader crosses pin ${p + 1} (${tag}): ${JSON.stringify(l)}`);
                    });
                }
                // 0.40 and above: 16px on screen. Below: the font holds at its 0.40 size (and the layout
                // is the 0.40 one), so the text may draw under 16px there and nowhere else
                if (scale >= MIN_LAYOUT_SCALE - 1e-9) assert.ok(r.font * scale >= 16 - 1e-9, `font ${r.font} x ${scale} >= 16 (${tag})`);
                else assert.ok(r.font === labelFontSize(MIN_LAYOUT_SCALE) && r.font === 40, `font capped at 40, got ${r.font} (${tag})`);
                assert.ok(r.fallbacks === 0 && r.solved === true, `no fallback (${tag}), got ${r.fallbacks}`);
                // No label touching another label, an unnamed pin or a drawn part (a 0px touch counts),
                // every pin label has a leader
                const touch = (a, b) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
                const lastX = pinXs[n - 1];
                const drawn = [WRENCH_UPRIGHT, { x: 80, y: 200, w: 38, h: 10 }, { x: -300, y: 254, w: lastX + 6 + 300, h: 12 }, { x: lastX - 20, y: 215, w: 30, h: 39 }];
                const ids = Object.keys(r.labels);
                ids.forEach((id, i) => {
                    const a = r.labels[id];
                    if (pinKind.has(id)) assert.ok(Number.isInteger(a.pin) && a.pin >= 0 && a.pin < n, `${id} has a valid pin (${tag}), got ${a.pin}`);
                    if (id !== 'shear') assert.ok(!!a.leader, `${id} has a leader (${tag})`);
                    pinXs.forEach((x, p) => {
                        if (p === namedPin(r, id, n)) return;
                        assert.ok(!touch(a, { x: x - PIN_HALF_WIDTH, y: PIN_TOP, w: PIN_HALF_WIDTH * 2, h: PIN_BOTTOM - PIN_TOP }), `${id} touches pin ${p + 1} (${tag})`);
                    });
                    for (const b of drawn) assert.ok(!touch(a, b), `${id} touches a drawn part (${tag}): ${JSON.stringify(b)}`);
                    for (const o of ids.slice(i + 1)) {
                        assert.ok(!touch(a, r.labels[o]), `${id} and ${o} touch (${tag})`);
                        // No two leaders within a pixel of each other (they would read as one line)
                        if (a.leader && r.labels[o].leader) {
                            const close = legRects(a.leader).some((p) => legRects(r.labels[o].leader).some((q) => rectsHit(p, q)));
                            assert.ok(!close, `${id} and ${o} leaders run together (${tag})`);
                        }
                    }
                });
                const w = r.labels.wrench;
                const onUpright = w.x < WRENCH_UPRIGHT.x + WRENCH_UPRIGHT.w && WRENCH_UPRIGHT.x < w.x + w.w
                    && w.y < WRENCH_UPRIGHT.y + WRENCH_UPRIGHT.h && WRENCH_UPRIGHT.y < w.y + w.h;
                assert.ok(!onUpright, `wrench label covers the upright (${tag}): ${JSON.stringify(w)}`);
                // Up to 6 pins keep every pin leader near-straight (first leg within 10px of vertical;
                // a gap leader's elbow is its second leg)
                if (n <= 6) {
                    for (const id of Object.keys(r.labels)) {
                        const l = r.labels[id].leader;
                        if (l) assert.ok(Math.abs(l.x2 - l.x1) <= 10 || l.y1 === l.y2, `${id} leader straight (${tag})`);
                    }
                }
                cases++;
            }
        }
    }
    assert.ok(cases === 77 * 8 * 2, 'grid size ' + cases);
});

test('leaders stay 6px apart, even with pins placed so that two would line up (D219 R4 m1)', () => {
    // Pins at 60, 105, 150, 195 (not the usual spread), 0.5: without the spacing rule two leaders land side by side
    for (const [pinXs, scale] of [[[60, 105, 150, 195], 0.5], [[60, 105], 0.5]]) {
        const r = layoutLockLabels({ scale, pinXs, view: views.landscape, measure: realMeasure });
        const ids = Object.keys(r.labels).filter((id) => r.labels[id].leader);
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
            const close = legRects(r.labels[ids[i]].leader).some((p) => legRects(r.labels[ids[j]].leader).some((q) => rectsHit(p, q)));
            assert.ok(!close, `${ids[i]} and ${ids[j]} leaders run together (${pinXs.length} pins)`);
        }
        assert.ok(r.solved && r.fallbacks === 0, 'solved cleanly');
    }
});

test('layout cost: search node counts stay bounded at every scale (deterministic, no wall clock; D219 R5 m2)', () => {
    // R4 measured 81,644 nodes at the worst grid point (12 pins) and a few thousand at 4 and 5 pins
    assert.ok(maxNodes45 < 30000, `worst 4 or 5 pin solve used ${maxNodes45} nodes`);
    assert.ok(maxNodes < 250000, `worst solve used ${maxNodes} nodes (budget 250000)`);
});

test('below 0.40 the layout is the 0.40 layout: the same boxes and leaders (D219 R4 M2)', () => {
    assert.ok(layoutFontSize(0.3) === 40 && layoutFontSize(0.4) === 40 && layoutFontSize(0.5) === 32, 'font holds at 40 below 0.40');
    const a = layoutLockLabels({ scale: 0.4, pinXs: pinXsFor(4), view: views.landscape, measure: realMeasure });
    const b = layoutLockLabels({ scale: 0.3, pinXs: pinXsFor(4), view: views.landscape, measure: realMeasure });
    assert.ok(JSON.stringify(a.labels) === JSON.stringify(b.labels), 'the same layout at 0.30 and 0.40');
});

test('a layout is remembered by font, pins, view and measured sizes, so a repeat does no search (D219 R4 M1)', () => {
    clearLayoutMemo();
    let calls = 0;
    const counting = (lines, font) => { calls++; return realMeasure(lines, font); };
    const args = { scale: 0.6, pinXs: pinXsFor(4), view: views.landscape, measure: counting };
    const a = layoutLockLabels(args);
    const first = calls;
    const b = layoutLockLabels({ ...args, scale: 0.61 }); // the same font: free
    assert.ok(a === b, 'same layout object for the same font');
    assert.ok(calls - first <= 10, 'only the wording fingerprint is measured on a repeat, got ' + (calls - first));
    const wide = (lines, font) => ({ ...realMeasure(lines, font), w: realMeasure(lines, font).w + 4 });
    const c = layoutLockLabels({ ...args, measure: wide });
    assert.ok(c !== a, 'a changed glyph width (a late font load) is solved again');
    const d = layoutLockLabels({ ...args, pinXs: pinXsFor(5) });
    assert.ok(d !== a, 'a different pin count is solved again');
});

test('a layout is not re-solved when the labels are hidden (first pin press): resize does nothing', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    p.lockLabels = ll;
    ll.apply();
    ll.hideTeachingLabels();
    let touched = 0;
    for (const n of ['springLabel', 'driverPinLabel', 'keyPinLabel', 'shearLineText', 'wrenchText', 'hookPickLabel']) {
        const f = p[n].setFontSize.bind(p[n]);
        p[n].setFontSize = (v) => { touched++; return f(v); };
    }
    clearLayoutMemo();
    p.game.canvas.getBoundingClientRect = () => ({ width: 300 });
    assert.ok(ll.apply() === null, 'apply does nothing once hidden');
    assert.ok(touched === 0, 'no label measured or restyled, touched ' + touched);
    ll.watch(); // the handlers are the same path
    p.handlers.resize();
    ll.dispose();
    assert.ok(touched === 0, 'a resize after the press does no layout work');
});

test('labels keep their pin and row when the font changes by a step, if they still fit (D219 R4 m2)', () => {
    for (const n of [4, 5]) {
        const pinXs = pinXsFor(n);
        clearLayoutMemo();
        const fresh = layoutLockLabels({ scale: 0.665, pinXs, view: views.landscape, measure: realMeasure });
        const at635 = layoutLockLabels({ scale: 0.635, pinXs, view: views.landscape, measure: realMeasure, prev: fresh });
        const back = layoutLockLabels({ scale: 0.665, pinXs, view: views.landscape, measure: realMeasure, prev: at635 });
        for (const id of ['spring', 'driver', 'key']) {
            assert.ok(back.labels[id].pin === at635.labels[id].pin, `${id} keeps pin ${at635.labels[id].pin} going back to 0.665 (${n} pins)`);
        }
        for (const id of ['wrench', 'hook']) {
            assert.ok(Math.abs(back.labels[id].y - at635.labels[id].y) <= 40, `${id} keeps its row going back to 0.665 (${n} pins): ${at635.labels[id].y} -> ${back.labels[id].y}`);
        }
        assert.ok(back.fallbacks === 0 && back.solved, 'still clean');
    }
});

test('740x360 with the observations open (scale 0.47): a 4-pin lock puts Driver Pin over a pin of its kind with a straight leader', () => {
    const pinXs = pinXsFor(4);
    const r = layoutLockLabels({ scale: 0.47, pinXs, view: views.landscape, measure: realMeasure });
    const d = r.labels.driver;
    assert.ok(r.fallbacks === 0, 'no fallback, got ' + r.fallbacks);
    assert.ok(d.pin >= 0 && d.pin < 4, 'names a real pin, got ' + d.pin);
    const l = d.leader;
    const legs = [l, ...(l.more || [])];
    const end = legs[legs.length - 1];
    assert.ok(Math.abs(l.x2 - l.x1) <= 10 || l.more, 'near-straight leader: ' + JSON.stringify(l));
    assert.ok(Math.abs(end.x2 - pinXs[d.pin]) <= PIN_HALF_WIDTH + 1, 'ends on its own pin: ' + JSON.stringify(l));
});

test('a wide wrench label goes under the upright foot with a leader up to it, and the hook label slides clear', () => {
    const r = layoutLockLabels({ scale: 0.5, pinXs: pinXsFor(4), view: views.portrait, measure: realMeasure });
    const w = r.labels.wrench, h = r.labels.hook;
    assert.ok(w.y > WRENCH_UPRIGHT.y + WRENCH_UPRIGHT.h, 'under the foot: ' + JSON.stringify(w));
    assert.ok(w.leader && w.leader.x1 === w.leader.x2 && w.leader.x1 > WRENCH_UPRIGHT.x && w.leader.x1 < WRENCH_UPRIGHT.x + WRENCH_UPRIGHT.w, 'leader lands on the upright');
    assert.ok(!segmentHitsRect(h.leader, w), 'hook leader does not run through the wrench label');
});

test('the tension wrench container draws above the hook pick, so the hook shaft never strikes through its label (D219 R3 M1)', () => {
    const g = src('lock-graphics.js');
    const i = g.indexOf('createTensionWrench()');
    const j = g.indexOf('createHookPick()');
    const body = g.slice(i, j);
    assert.ok(/this\.parent\.tensionWrench\.setDepth\(1\)/.test(body), 'wrench container has depth 1');
    assert.ok(!/hookGroup\.setDepth/.test(g), 'hook group stays at the default depth 0');
});

// ---- D219 R5: page elements over the canvas (the feedback box) are no-go areas ----
// Synthetic covered rects in world pixels: a strip over y 58-116 stands for any page element,
// the second for the feedback box over y 282-342 (the real band was the sticky feedback box over a
// scrolling game area, fixed by the zoom; the layout API still takes any rect)
const covered1280 = [{ x: 0, y: 58, w: 600, h: 58 }, { x: 0, y: 282, w: 600, h: 60 }];
const covered1024 = [{ x: 0, y: 10, w: 600, h: 50 }, { x: 0, y: 330, w: 600, h: 60 }];

for (const [name, blocked] of [['1280x720', covered1280], ['1024x768', covered1024]]) {
    test(`no label goes into an area a page element covers (desktop ${name}, 4 pins; D219 R5 M)`, () => {
        for (const n of [3, 4, 5]) {
            clearLayoutMemo();
            const r = layoutLockLabels({ scale: 1, pinXs: pinXsFor(n), view: views.desktop, measure: realMeasure, blocked });
            assert.ok(r.solved && r.fallbacks === 0, `solved cleanly (${n} pins), fallbacks ${r.fallbacks}`);
            // A blocked-rect solve stays inside the node budget (R7 m5; the grid test's 4 and 5 pin bound)
            assert.ok(r.nodes > 0 && r.nodes < 30000, `${name} ${n} pins used ${r.nodes} nodes`);
            for (const id of Object.keys(r.labels)) {
                for (const b of blocked) {
                    assert.ok(!rectsHit(r.labels[id], b), `${id} sits in a covered area (${name}, ${n} pins): ${r.labels[id].x},${r.labels[id].y} ${r.labels[id].w}x${r.labels[id].h}`);
                }
            }
        }
    });
}

test('the covered areas are part of the layout memo key: a different box or strip is solved again (D219 R5 M)', () => {
    clearLayoutMemo();
    const args = { scale: 1, pinXs: pinXsFor(4), view: views.desktop, measure: realMeasure };
    const open = layoutLockLabels(args);
    assert.ok(layoutLockLabels({ ...args, blocked: [] }) === open, 'no covered area is the same entry as the default');
    const a = layoutLockLabels({ ...args, blocked: covered1280 });
    assert.ok(a !== open, 'a covered area is solved again');
    assert.ok(layoutLockLabels({ ...args, blocked: covered1280.map((r) => ({ ...r })) }) === a, 'the same areas are remembered');
    const taller = [covered1280[0], { ...covered1280[1], y: 250, h: 92 }];
    const b = layoutLockLabels({ ...args, blocked: taller });
    assert.ok(b.nodes > 0 && b.nodes < 30000, `the taller-box solve used ${b.nodes} nodes`);
    assert.ok(b !== a, 'a taller feedback box (more lines) is solved again');
    for (const id of Object.keys(b.labels)) assert.ok(!rectsHit(b.labels[id], taller[1]), `${id} clear of the taller box`);
});

test('LockLabels measures the feedback box in canvas pixels, does not sample the page, and lays labels out clear of it (D219 R5 M, R6)', () => {
    const p = fakeParent({ canvasW: 600, scrollY: 0 });
    p.scene.cameras.main.width = 600;
    p.scene.cameras.main.height = 400;
    // Canvas at page (340,354) 600x400; the feedback box is over its foot
    p.game.canvas.getBoundingClientRect = () => ({ left: 340, top: 354, right: 940, bottom: 754, width: 600, height: 400 });
    p.feedback = { offsetParent: {}, getBoundingClientRect: () => ({ left: 340, top: 636, right: 940, bottom: 696, width: 600, height: 60 }) };
    const saved = globalThis.document;
    let hitTests = 0;
    globalThis.document = { elementsFromPoint: () => { hitTests++; return [{ id: 'band' }]; } };
    try {
        const ll = new LockLabels(p);
        const cov = ll.coveredRects({ left: 0, top: 0, right: 600, bottom: 400 });
        assert.ok(cov.some((r) => r.x === 0 && r.w === 600 && r.y === 282 && r.h === 60), 'feedback box measured: ' + JSON.stringify(cov));
        assert.ok(cov.length === 1, 'only the feedback box is a covered area: ' + JSON.stringify(cov));
        assert.ok(hitTests === 0, 'no per-apply page hit tests (R6 m2): ' + hitTests);
        const res = ll.apply();
        assert.ok(!!res, 'laid out');
        for (const id of Object.keys(res.labels)) {
            for (const r of cov) assert.ok(!rectsHit(res.labels[id], r), `${id} clear of ${JSON.stringify(r)}`);
        }
        // The feedback box changing size changes the layout key, so the next apply lays out again
        p.feedback.getBoundingClientRect = () => ({ left: 340, top: 606, right: 940, bottom: 696, width: 600, height: 90 });
        const again = ll.apply();
        assert.ok(!!again && again !== res, 'a taller feedback box lays out again');
        ll.dispose();
    } finally {
        globalThis.document = saved;
    }
});

test('LockLabels observes the feedback box and stops on dispose (D219 R5 M)', () => {
    const p = fakeParent();
    p.feedback = {};
    const seen = [];
    const savedRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; seen.push(this); } observe(el) { this.el = el; } disconnect() { this.gone = true; } };
    try {
        const ll = new LockLabels(p);
        ll.watch();
        assert.ok(seen.length === 1 && seen[0].el === p.feedback, 'one observer on the feedback box');
        ll.dispose();
        assert.ok(seen[0].gone === true, 'disconnected on dispose');
    } finally {
        globalThis.ResizeObserver = savedRO;
    }
});

// ---- D219 R5 m1: the wrench and hook labels stay hidden after the first pin press ----
{
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const d = mkdtempSync(join(tmpdir(), 'label-hide-test-'));
    writeFileSync(join(d, 'tool-manager.mjs'), src('tool-manager.js'));
    const { ToolManager } = await import(pathToFileURL(join(d, 'tool-manager.mjs')).href);
    globalThis.Phaser = globalThis.Phaser || { Geom: { Rectangle: class {} } };
    globalThis.Phaser.Geom = globalThis.Phaser.Geom || { Rectangle: class {} };
    globalThis.Phaser.Geom.Rectangle = globalThis.Phaser.Geom.Rectangle || class {};
    globalThis.Phaser.Geom.Rectangle.Contains = globalThis.Phaser.Geom.Rectangle.Contains || (() => true);

    const toolParent = () => {
        const p = fakeParent();
        const vis = () => ({ visible: true, setVisible(v) { this.visible = v; return this; }, setInteractive() { return this; }, destroy() {} });
        p.tensionWrench = Object.assign(vis(), { x: 80, y: 160 });
        p.hookGroup = vis();
        p.pins = p.pins.map((q) => ({ ...q, container: Object.assign(vis(), q.container) }));
        p.lockConfig = { resetPinsToOriginalPositions() {} };
        p.keyInsertion = { updateFeedback() {} };
        p.lockLabels = new LockLabels(p);
        p.toolMgr = new ToolManager(p);
        return p;
    };

    test('after the first pin press the wrench and hook labels stay hidden through a pick/key switch and a resize (D219 R5 m1)', () => {
        const p = toolParent();
        p.lockLabels.apply();
        p.lockLabels.hideTeachingLabels();
        assert.ok(p.wrenchText.visible === false && p.hookPickLabel.visible === false, 'hidden by the press');
        p.toolMgr.showLockpickingTools();
        assert.ok(p.wrenchText.visible === false && p.hookPickLabel.visible === false, 'showLockpickingTools leaves them hidden');
        p.keyMode = true;
        p.toolMgr.switchToPickMode();
        assert.ok(p.wrenchText.visible === false && p.hookPickLabel.visible === false, 'switchToPickMode leaves them hidden');
        p.game.canvas.getBoundingClientRect = () => ({ width: 300 });
        assert.ok(p.lockLabels.apply() === null, 'a resize does no layout');
        assert.ok(p.wrenchText.visible === false && p.hookPickLabel.visible === false, 'still hidden after the resize');
        p.lockLabels.dispose();
    });

    test('before any pin press the mode switch still shows the wrench and hook labels (D219 R5 m1)', () => {
        const p = toolParent();
        p.lockLabels.apply();
        p.wrenchText.setVisible(false);
        p.hookPickLabel.setVisible(false);
        p.toolMgr.showLockpickingTools();
        assert.ok(p.wrenchText.visible === true && p.hookPickLabel.visible === true, 'shown again when nothing has been pressed');
        p.lockLabels.dispose();
    });
}
