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
const { layoutLockLabels, labelFontSize, segmentHitsRect, leaderRects, LockLabels, PIN_TOP, PIN_BOTTOM, PIN_HALF_WIDTH } = mod;
const src = (f) => readFileSync(join(here, '../../public/break_escape/js/minigames/lockpicking/' + f), 'utf8');

// VT323 is about 0.4em wide per character; the estimate is a little wider than that
const measure = (lines, font) => {
    const chars = Math.max(...lines.map((l) => l.length));
    return { w: Math.ceil(chars * font * 0.42) + 6, h: lines.length * Math.ceil(font * 1.25) + 2 };
};
const pinXsFor = (n) => {
    const spacing = 400 / (n + 1), margin = spacing * 0.75;
    return Array.from({ length: n }, (_, i) => 100 + margin + i * spacing);
};
const views = {
    portrait: { left: 0, top: 20, right: 580, bottom: 360 },
    landscape: { left: 0, top: 30, right: 580, bottom: 370 },
    desktop: { left: 0, top: 0, right: 600, bottom: 400 }
};
const named = { spring: 0, driver: 1, key: 2 };

for (const scale of [0.67, 1, 0.55]) {
    for (const n of [3, 4, 5, 6]) {
        for (const [vn, view] of Object.entries(views)) {
            if (vn === "desktop" && scale !== 1) continue;
            const tag = `scale ${scale}, ${n} pins, ${vn}`;
            const pinXs = pinXsFor(n);
            const r = layoutLockLabels({ scale, pinXs, view, measure });
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
                        if (named[id] === Math.min(p, n - 1) && named[id] !== undefined && p === Math.min(named[id], n - 1)) return;
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
                    // At 0.55 (30px type, outside the phone range) a label can sit off its pin: that leader is diagonal
                    if (scale >= 0.67) assert.ok(l.x1 === l.x2 || l.y1 === l.y2, `${id} leader axis-aligned, got ${JSON.stringify(l)}`);
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
    for (const [id, pin] of [['spring', 0], ['driver', 1], ['key', 2], ['shear', -1], ['wrench', -1], ['hook', -1]]) {
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

test('labels re-lay out on resize, and dispose releases the listener and timers', () => {
    const p = fakeParent();
    const ll = new LockLabels(p);
    ll.apply();
    ll.watch();
    assert.ok(typeof p.handlers.resize === 'function', 'resize listener added');
    ll.dispose();
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
