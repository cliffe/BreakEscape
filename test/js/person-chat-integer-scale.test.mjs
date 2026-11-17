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

test('the background shares the speaker scale and stays on whole pixels', () => {
    const { p, draws } = make(1280, 720);
    p.backgroundImage = { width: 400, height: 400 };
    p.visemeSheet = { image: { width: 896, height: 128 }, frameSize: 128, columnFor: { rest: 0 } };
    p._getCurrentVisemeColumn = () => 2;
    p.parallaxStartTime = Date.now() - 300; // mid-parallax: a fractional offset
    p.render();
    const bg = draws.find(d => d.a.length === 4);
    const sprite = draws.find(d => d.a.length === 8);
    assert.equal(bg.a[2] / 400, sprite.a[6] / sprite.a[2]);
    assert.ok(Number.isInteger(bg.a[0]) && Number.isInteger(bg.a[1]));
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
