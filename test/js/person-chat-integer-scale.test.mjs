// The speaking NPC's pixels used to be drawn at the canvas size over the frame size (5.625x on a
// 720 px canvas) on a backing store that the browser then stretched to its CSS box, so source
// pixels came out 5 and 6 px wide and the edges shimmered as the mouth frames changed. Every frame
// of a speaker is now drawn at one whole-number scale on a canvas sized to its CSS box times
// devicePixelRatio.
// Run with: bin/test-js test/js/person-chat-integer-scale.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'int-scale-'));
mkdirSync(join(dir, 'minigames/person-chat'), { recursive: true });
mkdirSync(join(dir, 'ui'), { recursive: true });
copyFileSync(join(js, 'config.js'), join(dir, 'config.js'));
for (const f of ['person-chat-portraits.js', 'lip-sync.js', 'person-chat-camera.js']) {
    copyFileSync(join(js, 'minigames/person-chat', f), join(dir, 'minigames/person-chat', f));
}
writeFileSync(join(dir, 'ui/pretext-chrome.js'), 'export function influenceTintFilter() { return ""; }\n');

globalThis.window = globalThis;
globalThis.document = { getElementById: () => null, querySelector: () => null };
console.log = () => {}; console.warn = () => {};
const Portraits = (await import(pathToFileURL(join(dir, 'minigames/person-chat/person-chat-portraits.js')))).default;
const { portraitRect, phonePortraitSize, PHONE_FRAME_PX } = await import(pathToFileURL(join(dir, 'minigames/person-chat/person-chat-camera.js')));

function fakeCtx(draws) {
    return {
        fillStyle: '', filter: 'none', imageSmoothingEnabled: true,
        fillRect() {}, save() {}, restore() {}, translate() {}, scale() {},
        drawImage(img, ...a) { draws.push({ img, a }); }
    };
}

function make(canvasW, canvasH, npc = { id: 'sam', spriteVisemes: 'x' }) {
    const draws = [];
    const p = new Portraits({}, npc, { clientWidth: canvasW, clientHeight: canvasH }, null);
    p.canvas = { width: canvasW, height: canvasH };
    p.ctx = fakeCtx(draws);
    p.flipped = true;
    p.view = { pan: 1, zoom: 1, shift: 0.2 };
    return { p, draws };
}

const SIZES = [[1280, 720], [1280, 680], [1366, 768], [390, 844], [1920, 1080]];

test('viseme columns and talk-sheet frames draw at one whole-number scale', () => {
    for (const [cw, ch] of SIZES) {
        const { p, draws } = make(cw, ch);
        p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
        for (let c = 0; c < 7; c++) p.drawPortraitFrame(p.visemeSheet.image, c * 128, 0, 128, 128);
        p.visemeSheet = null;
        p.spriteTalkImage = { width: 256, height: 256 };
        for (let f = 0; f < 4; f++) p.drawSpriteTalkImage(p.spriteTalkImage, f);
        const scales = draws.map(d => d.a[6] / d.a[2]);
        assert.equal(scales.length, 11);
        assert.ok(scales.every(s => s === scales[0]), `${cw}x${ch}: ${scales}`);
        assert.ok(Number.isInteger(scales[0]), `${cw}x${ch}: scale ${scales[0]}`);
        for (const d of draws) assert.ok(Number.isInteger(d.a[4]) && Number.isInteger(d.a[5]));
    }
});

test('a talk image of another size is drawn at the viseme sheet scale', () => {
    const { p, draws } = make(1280, 720);
    p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
    p.spriteTalkImage = { width: 120, height: 120 };
    p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
    p.drawPortraitFrame(p.spriteTalkImage, 0, 0, 120, 120);
    const [a, b] = draws.map(d => d.a[6] / d.a[2]);
    assert.equal(a, 5);
    assert.equal(b, a);
});

// Canvas sizes where the background's cover step and the speaker's contain fit could disagree
const SHARED_SIZES = [...SIZES, [390, 474], [390, 549], [768, 1024]];

test('the background shares the speaker scale and stays on whole pixels', () => {
    for (const [cw, ch] of SHARED_SIZES) {
        const { p, draws } = make(cw, ch);
        p.backgroundImage = { width: 400, height: 400 };
        p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
        p._getCurrentVisemeColumn = () => 2;
        p.parallaxStartTime = Date.now() - 300; // mid-parallax: a fractional offset
        p.render();
        const bg = draws.find(d => d.a.length === 4);
        const sprite = draws.find(d => d.a.length === 8);
        assert.equal(bg.a[2] / 400, sprite.a[6] / sprite.a[2], `${cw}x${ch}`);
        assert.ok(Number.isInteger(bg.a[0]) && Number.isInteger(bg.a[1]), `${cw}x${ch}`);
    }
});

test('a Phaser walk sprite is drawn at one whole scale, standing on the canvas bottom', () => {
    for (const [cw, ch] of SHARED_SIZES) {
        const { p, draws } = make(cw, ch);
        const image = { width: 640, height: 80 };
        const frame = { cutX: 0, cutY: 0, cutWidth: 80, cutHeight: 80, source: { image } };
        p.game = { textures: { get: () => ({ key: 'walk', get: () => frame }) } };
        p.spriteSheet = 'walk';
        p.frameIndex = 0;
        p.backgroundImage = { width: 400, height: 400 };
        p.render();
        const sprite = draws.find(d => d.a.length === 8).a;
        const bg = draws.find(d => d.a.length === 4).a;
        const scale = sprite[6] / sprite[2];
        assert.equal(scale, Math.floor(ch > cw ? ch / 80 : Math.min(cw / 80, ch / 80)), `${cw}x${ch}`);
        assert.equal(sprite[5] + sprite[7], ch, `${cw}x${ch} bottom edge`);
        assert.equal(bg[2] / 400, scale, `${cw}x${ch} background`);
    }
});

test('the look-away shift shrinks when the speaker box is wider than the canvas', () => {
    // 768x1024: scale 8 at 128 px, so the box is 1024 px wide on a 768 px canvas
    const wide = portraitRect({ zoom: 1 }, 128, 128, 768, 1024, 0.2);
    assert.equal(wide.w, 1024);
    const full = Math.round((768 - 1024) / 2 - 768 * 0.2);
    assert.ok(wide.x > full, `x ${wide.x} is nearer the centre than the unscaled ${full}`);
    assert.equal(wide.x, Math.round((768 - 1024) / 2 - 768 * 0.2 * (768 / 1024)));
    // A box that fits the canvas keeps the full shift
    const fits = portraitRect({ zoom: 1 }, 128, 128, 1280, 720, 0.2);
    assert.equal(fits.x, Math.round((1280 - 640) / 2 - 1280 * 0.2));
});

test('init watches the device-pixel box and falls back to a plain observe without a window listener', () => {
    const saved = { RO: globalThis.ResizeObserver, createElement: document.createElement, add: globalThis.addEventListener };
    const calls = []; const added = [];
    globalThis.addEventListener = (n) => added.push(n);
    document.createElement = () => ({ style: {}, getContext: () => fakeCtx([]), width: 300, height: 150 });
    class FakeRO {
        constructor(cb) { this.cb = cb; }
        observe(el, opts) { calls.push(opts ? 'box' : 'plain'); if (opts) throw new TypeError('unknown box'); }
        disconnect() {}
    }
    globalThis.ResizeObserver = FakeRO;
    try {
        const box = { innerHTML: '', appendChild() {}, clientWidth: 390, clientHeight: 549 };
        const p = new Portraits({}, { id: 'sam' }, box, null);
        p.setupSpriteInfo = () => {};
        p.render = () => {};
        assert.ok(p.init());
        assert.deepEqual(calls, ['box', 'plain']);
        assert.ok(!p._resizeHandler);
        assert.ok(p._resizeObserver instanceof FakeRO);
        assert.deepEqual(added, []);
    } finally {
        globalThis.ResizeObserver = saved.RO;
        if (saved.RO === undefined) delete globalThis.ResizeObserver;
        document.createElement = saved.createElement;
        globalThis.addEventListener = saved.add;
        if (saved.createElement === undefined) delete document.createElement;
    }
});

test('without a ResizeObserver init falls back to the window resize listener', () => {
    const saved = { createElement: document.createElement, add: globalThis.addEventListener };
    const added = [];
    globalThis.addEventListener = (n) => added.push(n);
    document.createElement = () => ({ style: {}, getContext: () => fakeCtx([]), width: 300, height: 150 });
    try {
        const box = { innerHTML: '', appendChild() {}, clientWidth: 390, clientHeight: 549 };
        const p = new Portraits({}, { id: 'sam' }, box, null);
        p.setupSpriteInfo = () => {};
        p.render = () => {};
        assert.ok(p.init());
        assert.deepEqual(added, ['resize']);
        assert.ok(!p._resizeObserver);
    } finally {
        document.createElement = saved.createElement;
        globalThis.addEventListener = saved.add;
        if (saved.createElement === undefined) delete document.createElement;
        if (saved.add === undefined) delete globalThis.addEventListener;
    }
});

test('the backing store is the CSS box times devicePixelRatio', () => {
    for (const dpr of [1, 2, 1.5]) {
        globalThis.devicePixelRatio = dpr;
        const { p } = make(10, 10);
        p.portraitContainer = { clientWidth: 1280, clientHeight: 680 };
        p.updateCanvasSize();
        assert.equal(p.canvas.width, Math.round(1280 * dpr));
        assert.equal(p.canvas.height, Math.round(680 * dpr));
    }
    delete globalThis.devicePixelRatio;
});

test('a fractional box at a fractional devicePixelRatio is sized from the rect or the device-pixel box', () => {
    for (const dpr of [1.25, 1.5]) {
        globalThis.devicePixelRatio = dpr;
        // no observer entry: getBoundingClientRect keeps the fractions clientWidth rounds off
        const { p } = make(10, 10);
        p.portraitContainer = { clientWidth: 390, clientHeight: 549, getBoundingClientRect: () => ({ width: 390.4, height: 548.6 }) };
        p.updateCanvasSize();
        assert.equal(p.canvas.width, Math.round(390.4 * dpr));
        assert.equal(p.canvas.height, Math.round(548.6 * dpr));
        // observer entry: the browser's own device pixel size wins
        const { p: q } = make(10, 10);
        q.portraitContainer = { clientWidth: 390, clientHeight: 549, getBoundingClientRect: () => ({ width: 390.4, height: 548.6 }) };
        q.updateCanvasSize({ devicePixelContentBoxSize: [{ inlineSize: 488, blockSize: 686 }] });
        assert.deepEqual([q.canvas.width, q.canvas.height], [488, 686]);
    }
    delete globalThis.devicePixelRatio;
});

test('a scene shot covers the frame at the exact scale, not a rounded-up one', () => {
    const { p, draws } = make(1280, 680);
    p.backgroundImage = { width: 400, height: 400 };
    p._characterHidden = true;
    p.parallaxStartTime = Date.now() - 5000;
    p.render();
    const bg = draws.find(d => d.a.length === 4);
    assert.ok(bg.a[2] < 1500, `1304/400 = 3.26x, not rounded up to 4x: ${bg.a[2]}`);
    assert.ok(bg.a[2] > 1303.9, `w ${bg.a[2]}`);
});

test('on a phone the viseme frame stands on the canvas bottom at the height-led scale', () => {
    for (const [cw, ch] of [[390, 474], [390, 513], [390, 549], [390, 585]]) {
        const { p, draws } = make(cw, ch);
        p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
        p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
        const a = draws[0].a;
        assert.equal(a[5] + a[7], ch, `${cw}x${ch} bottom edge`);
        assert.equal(a[6] / a[2], Math.floor(ch / 128));
    }
});

// --- Phone layout: the viewport, not the canvas height, decides the drawn scale ---------------
// The phone canvas grows and shrinks with the dialogue band. These drive the renderer itself
// (setFixedHeight -> _fixedFit -> every draw path) so a return to the canvas-height fit fails.

function phoneMake(canvasH, fixed = 256) {
    const { p, draws } = make(390, canvasH);
    p._holdingForContent = true; p.setFixedHeight(fixed); p._holdingForContent = false;
    p.backgroundImage = { width: 400, height: 400 };
    return { p, draws };
}
const CANVAS_HEIGHTS = [256, 300, 372, 408];

test('on a phone the viewport fit holds the drawn scale while the canvas height changes', () => {
    const seen = new Set(), bgSeen = new Set();
    for (const h of CANVAS_HEIGHTS) {
        const { p, draws } = phoneMake(h);
        p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
        p.drawBackground(p.calculateSpriteTalkScale());
        p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
        bgSeen.add(draws[0].a[2] / 400); seen.add(draws[1].a[6] / draws[1].a[2]);
    }
    assert.deepEqual([...seen], [2]);
    assert.deepEqual([...bgSeen], [2]);
});

test('on a phone the talk sheet, a 120 px sheet and a 64 px bust each hold one scale across canvas heights', () => {
    const cases = [
        ['talk sheet', 128, 2, (p) => { p.spriteTalkImage = { width: 256, height: 256 }; p.drawSpriteTalkImage(p.spriteTalkImage, 1); }],
        ['120 px sheet', 120, 2, (p) => { p.visemeSheet = { image: { width: 840, height: 120 }, frameSize: 120, columnFor: { rest: 0 } }; p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 120, 120); }],
        ['64 px bust', 64, 4, (p) => { p.visemeSheet = { image: { width: 448, height: 64 }, frameSize: 64, columnFor: { rest: 0 } }; p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 64, 64); }]
    ];
    for (const [name, , expected, draw] of cases) {
        const seen = new Set();
        for (const h of CANVAS_HEIGHTS) {
            const { p, draws } = phoneMake(h);
            draw(p);
            const d = draws.find(x => x.a.length === 8);
            assert.ok(d, name);
            seen.add(d.a[6] / d.a[2]);
            assert.equal(d.a[5] + d.a[7], h, `${name} stands on the canvas bottom at ${h}`);
        }
        assert.deepEqual([...seen], [expected], name);
    }
});

test('a phone at 844 pins the 128 px frame at 3x and a 64 px bust at 6x', () => {
    const { p, draws } = phoneMake(549, 384);
    p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
    p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
    assert.equal(draws[0].a[6] / draws[0].a[2], 3);
    const { p: q, draws: d2 } = phoneMake(549, 384);
    q.visemeSheet = { image: { width: 448, height: 64 }, frameSize: 64, columnFor: { rest: 0 } };
    q.drawPortraitFrame(q.visemeSheet.image, 0, 0, 64, 64);
    assert.equal(d2[0].a[6] / d2[0].a[2], 6);
});

test('clearing the fixed height returns to the canvas-height fit', () => {
    const { p, draws } = phoneMake(408);
    p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
    p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
    assert.equal(draws[0].a[6] / draws[0].a[2], 2);
    p._holdingForContent = true; p.setFixedHeight(null); p._holdingForContent = false;
    assert.equal(p.fixedHeight, null);
    draws.length = 0;
    p.drawPortraitFrame(p.visemeSheet.image, 0, 0, 128, 128);
    assert.equal(draws[0].a[6] / draws[0].a[2], 3, '408 / 128 = 3.19, floored to 3');
});

test('a walk sprite on a phone holds its scale across canvas heights', () => {
    const seen = new Set(), bgSeen = new Set();
    for (const h of CANVAS_HEIGHTS) {
        const { p, draws } = phoneMake(h, 240);
        const image = { width: 640, height: 80 };
        const frame = { cutX: 0, cutY: 0, cutWidth: 80, cutHeight: 80, source: { image } };
        p.game = { textures: { get: () => ({ key: 'walk', get: () => frame }) } };
        p.spriteSheet = 'walk'; p.frameIndex = 0;
        p.render();
        const sprite = draws.find(d => d.a.length === 8).a;
        seen.add(sprite[6] / sprite[2]);
        bgSeen.add(draws.find(d => d.a.length === 4).a[2] / 400);
    }
    assert.deepEqual([...seen], [3]);
    assert.deepEqual([...bgSeen], [3]);
});

test('on a phone the room moves down with the speaker as the canvas grows', () => {
    // Sprite bottom minus background top is the same at every canvas height (as long as the
    // image still covers), so the speaker does not slide against the wall between lines.
    for (const [fixed, heights] of [[256, [256, 300, 372, 408]], [384, [384, 450, 549]], [128, [128, 200, 260]]]) {
        const gaps = new Set();
        for (const h of heights) {
            const { p, draws } = phoneMake(h, fixed);
            p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
            p._getCurrentVisemeColumn = () => 0;
            p.render();
            const bg = draws.find(d => d.a.length === 4).a;
            const sprite = draws.find(d => d.a.length === 8).a;
            assert.ok(bg[1] <= 0 && bg[1] + bg[3] >= h, `background covers at ${fixed}/${h}`);
            gaps.add(sprite[5] + sprite[7] - bg[1]);
        }
        assert.equal(gaps.size, 1, `fixed ${fixed}: ${[...gaps]}`);
    }
});

test('a phone background still covers when the canvas outgrows the room slack', () => {
    for (const [fixed, scaleH] of [[256, 2], [384, 3], [512, 4]]) {
        for (const h of [fixed, fixed + 100, fixed + 400]) {
            const { p, draws } = phoneMake(h, fixed);
            p.drawBackground(fixed / 128);
            const bg = draws[0].a;
            assert.ok(bg[1] <= 0 && bg[1] + bg[3] >= h, `${fixed}/${h}: y ${bg[1]} h ${bg[3]}`);
            assert.ok(bg[2] / 400 >= scaleH);
        }
    }
});

test('desktop (no fixed height) and scene shots keep the centred background', () => {
    const { p, draws } = make(1280, 680);
    p.backgroundImage = { width: 400, height: 400 };
    p.drawBackground(5);
    assert.equal(draws[0].a[1], Math.round((680 - 2000) / 2));
    const { p: q, draws: d2 } = phoneMake(408);
    q.drawBackground(2, true);
    const h = d2[0].a[3];
    assert.equal(d2[0].a[1], h > 408 ? Math.round((408 - h) / 2) : 0);
});

test('the UI hands the renderer the viewport portrait height on phones and clears it above', () => {
    const src = readFileSync(new URL('../../public/break_escape/js/minigames/person-chat/person-chat-ui.js', import.meta.url), 'utf8');
    const grab = (sig) => {
        const i = src.indexOf(sig);
        assert.ok(i > 0, sig);
        const end = src.indexOf('\n    }\n', i);
        return src.slice(i + sig.length, end);
    };
    const upd = new Function('phonePortraitSize', 'PHONE_FRAME_PX', 'window', grab('updatePortraitHeight() {'));
    const app = new Function(grab('applyPhoneScale() {'));
    for (const [innerW, boxH, dpr, expect] of [[390, 647, 1, 256], [390, 824, 1, 384], [390, 895, 2, phonePortraitSize(895, 2).scale * PHONE_FRAME_PX], [1280, 680, 1, null], [390, 0, 1, null]]) {
        const got = [];
        const ctx = {
            elements: { mainContent: { getBoundingClientRect: () => ({ height: boxH }), style: { setProperty() {}, removeProperty() {} } }, portraitSection: {} },
            portraitRenderer: { setFixedHeight: (v) => got.push(v) },
            applyPhoneScale: app
        };
        upd.call(ctx, phonePortraitSize, PHONE_FRAME_PX, { innerWidth: innerW, devicePixelRatio: dpr });
        assert.deepEqual(got, [expect], `${innerW}x${boxH}@${dpr}`);
    }
    // initializePortrait sets the height before init(), for the path with no ResizeObserver
    const init = src.slice(src.indexOf('this.portraitRenderer._holdingForContent = true;'));
    assert.ok(init.indexOf('this.applyPhoneScale()') < init.indexOf('this.portraitRenderer.init()'));
});
