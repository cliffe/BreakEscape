// D219: lockpicking labels are at least 16px on screen at the phone scale and sit clear of
// each other and of every pin they do not name (leader lines excepted).
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/lockpicking/label-layout.js')).href);
const { layoutLockLabels, labelFontSize, segmentHitsRect, PIN_TOP, PIN_BOTTOM, PIN_HALF_WIDTH } = mod;

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
