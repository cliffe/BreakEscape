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
const { layoutLockLabels, labelFontSize, segmentHitsRect, leaderRects, LockLabels, PIN_TOP, PIN_BOTTOM, PIN_HALF_WIDTH, WRENCH_UPRIGHT } = mod;
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

test('across scales 0.40 to 1.0 and 3 to 8 pins: no leader crosses a pin it does not name, the wrench label clears its upright', () => {
    let cases = 0;
    for (let k = 40; k <= 100; k++) {
        const scale = k / 100;
        for (let n = 3; n <= 8; n++) {
            for (const view of [views.portrait, views.landscape]) {
                const pinXs = pinXsFor(n);
                const r = layoutLockLabels({ scale, pinXs, view, measure: realMeasure });
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
                // Strict, whatever pin each teaching label chose: 16px on screen, no label touching
                // another label, an unnamed pin or a drawn part (a 0px touch counts), every pin label
                // has a leader, no fallback
                assert.ok(r.font * scale >= 16 - 1e-9, `font ${r.font} x ${scale} >= 16 (${tag})`);
                assert.ok(r.fallbacks === 0, `no fallback (${tag}), got ${r.fallbacks}`);
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
                    for (const o of ids.slice(i + 1)) assert.ok(!touch(a, r.labels[o]) , `${id} and ${o} touch (${tag})`);
                });
                const w = r.labels.wrench;
                const onUpright = w.x < WRENCH_UPRIGHT.x + WRENCH_UPRIGHT.w && WRENCH_UPRIGHT.x < w.x + w.w
                    && w.y < WRENCH_UPRIGHT.y + WRENCH_UPRIGHT.h && WRENCH_UPRIGHT.y < w.y + w.h;
                assert.ok(!onUpright, `wrench label covers the upright (${tag}): ${JSON.stringify(w)}`);
                // Where everything fits (no fallback), up to 6 pins keep every pin leader near-straight
                // (first leg within 10px of vertical; a gap leader's elbow is its second leg)
                if (r.fallbacks === 0 && n <= 6) {
                    for (const id of Object.keys(r.labels)) {
                        const l = r.labels[id].leader;
                        if (l) assert.ok(Math.abs(l.x2 - l.x1) <= 10 || l.y1 === l.y2, `${id} leader straight (${tag})`);
                    }
                }
                cases++;
            }
        }
    }
    assert.ok(cases === 61 * 6 * 2, 'grid size ' + cases);
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
