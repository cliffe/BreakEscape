// q105: text drawn in the Phaser canvas uses GNF as a bitmap font (utils/pixel-text.js), built at
// GNF's native 10.24 px by tools/fonts/build_gnf_bitmap.py, at whole-number scales on whole pixels.
// The helper runs against a fake scene whose cache holds the real gnf.xml; the build check runs
// the Python script with --check (skipped when python3 or Pillow is missing).
// Run with: bin/test-js test/js/pixel-text.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
globalThis.window ||= {};   // overlayDepth reads window.lightingSystem

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const fontDir = join(root, 'public/break_escape/assets/fonts/gnf-bitmap');
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const P = await imp('utils/pixel-text.js');
const { pixelText, setPixelText, placePixelText, pixelTextBox, setPixelScale, pixelSafe, measurePixelText, wrapPixelText,
    colourInt, pixelScale, preloadPixelFont, pixelFontReady, PIXEL_FONT, PIXEL_FONT_OUTLINE, PIXEL_FONT_SIZE, PIXEL_LINE_HEIGHT } = P;

// ---- the real font data, parsed as Phaser's ParseXMLBitmapFont does ----
function parseXml(name) {
    const xml = readFileSync(join(fontDir, name), 'utf8');
    const num = (s, k) => parseInt(s.match(new RegExp(`\\b${k}="(-?\\d+)"`))[1], 10);
    const common = xml.match(/<common [^>]*>/)[0];
    const info = xml.match(/<info [^>]*>/)[0];
    const chars = {};
    for (const m of xml.matchAll(/<char [^>]*>/g)) {
        const c = m[0];
        chars[num(c, 'id')] = { x: num(c, 'x'), y: num(c, 'y'), width: num(c, 'width'), height: num(c, 'height'),
            xOffset: num(c, 'xoffset'), yOffset: num(c, 'yoffset'), xAdvance: num(c, 'xadvance') };
    }
    return { size: num(info, 'size'), lineHeight: num(common, 'lineHeight'), base: num(common, 'base'), chars };
}
const GNF = parseXml('gnf.xml');
const GNF_OUT = parseXml('gnf-outline.xml');

function fakeScene({ bitmap = true } = {}) {
    const made = [];
    const mk = (kind, key, size, style) => {
        const o = { kind, key, fontSize: size, style, x: 0, y: 0, text: '', tint: null, origin: null, depth: null, visible: true,
            setText(t) { o.text = t; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
            setOrigin(x, y) { o.origin = [x, y]; return o; }, setTint(t) { o.tint = t; return o; },
            setFontSize(s) { o.fontSize = s; return o; }, setDepth(d) { o.depth = d; return o; },
            setVisible(v) { o.visible = v; return o; }, setAlpha() { return o; }, destroy() {}, setColor(c) { o.color = c; return o; },
            get width() { return String(o.text).length * 6; }, get height() { return 11; } };
        made.push(o);
        return o;
    };
    const cache = new Map([[PIXEL_FONT, { data: GNF }], [PIXEL_FONT_OUTLINE, { data: GNF_OUT }]]);
    const scene = {
        made,
        add: { text: (x, y, t, style) => mk('text', null, null, style) },
        cache: { bitmapFont: { get: (k) => (bitmap ? cache.get(k) : undefined), exists: (k) => bitmap && cache.has(k) } }
    };
    if (bitmap) scene.add.bitmapText = (x, y, key, t, size) => mk('bitmap', key, size);
    return scene;
}

// ---- the sheet ----

test('the sheet: GNF at one font pixel a screen pixel (A is 5x7 on a 6 px advance), 12 px lines, base 9', () => {
    assert.equal(GNF.size, PIXEL_FONT_SIZE);
    assert.equal(GNF.lineHeight, PIXEL_LINE_HEIGHT);
    assert.equal(GNF.base, 9);
    const A = GNF.chars[65];
    assert.deepEqual([A.width, A.height, A.xOffset, A.yOffset, A.xAdvance], [5, 7, 0, 2, 6]);
    const g = GNF.chars['g'.charCodeAt(0)];
    assert.equal(g.yOffset + g.height, 11, 'descender ends at the line box bottom');
    for (const ch of 'abcXYZ0123456789£éÉàçñüö.,!?\'"-+()[]:;/') assert.ok(GNF.chars[ch.codePointAt(0)], `missing ${ch}`);
    // The outline sheet: every glyph 1 px bigger on each side, same advances
    for (const [id, c] of Object.entries(GNF.chars)) {
        const o = GNF_OUT.chars[id];
        assert.equal(o.xAdvance, c.xAdvance);
        if (c.width) assert.deepEqual([o.width, o.height, o.xOffset, o.yOffset], [c.width + 2, c.height + 2, c.xOffset - 1, c.yOffset - 1]);
    }
});

test('the font build check: every glyph on the pixel grid and the committed sheet up to date', (t) => {
    const probe = spawnSync('python3', ['-I', '-c', 'import PIL'], { encoding: 'utf8' });
    if (probe.status !== 0) { t.skip('python3 with Pillow not available'); return; }
    const r = spawnSync('python3', ['-I', join(root, 'tools/fonts/build_gnf_bitmap.py'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /up to date and every glyph is on the pixel grid/);
});

// ---- pure helpers ----

test('colourInt and pixelScale', () => {
    assert.equal(colourInt('#ff4444'), 0xff4444);
    assert.equal(colourInt('fff'), 0xffffff);
    assert.equal(colourInt(0x123456), 0x123456);
    assert.equal(colourInt(null), null);
    assert.equal(colourInt('red'), null);
    assert.deepEqual([pixelScale(1), pixelScale(2.4), pixelScale(0), pixelScale(undefined), pixelScale(3)], [1, 2, 1, 1, 3]);
});

test('pixelSafe: letters the font lacks become the plain letter or a stand-in, else ?', () => {
    assert.equal(pixelSafe('Café £5', GNF.chars), 'Café £5', 'kept');
    assert.equal(pixelSafe('Wiśniewski', GNF.chars), 'Wisniewski', 'ś has no glyph: s');
    assert.equal(pixelSafe('Paweł Æsir', GNF.chars), 'Pawel AEsir');
    assert.equal(pixelSafe('tea ☕', GNF.chars), 'tea ?');
    assert.equal(pixelSafe('a\nb', GNF.chars), 'a\nb');
    assert.equal(pixelSafe('x', null), 'x', 'no font data: unchanged');
});

test('measurePixelText: ink width, line box height, outline adds 1 each side', () => {
    const m = measurePixelText(GNF.chars, 'AA');
    assert.deepEqual([m.left, m.right, m.top, m.bottom], [0, 11, 0, 11]);   // 6 + 5 px of ink
    const two = measurePixelText(GNF.chars, 'A\nAAA');
    assert.equal(two.right, 17);
    assert.equal(two.bottom, PIXEL_LINE_HEIGHT + 11);
    const o = measurePixelText(GNF_OUT.chars, '7', { outline: true });
    assert.deepEqual([o.left, o.top, o.bottom], [-1, -1, 12]);
    assert.deepEqual(measurePixelText(GNF.chars, ''), { left: 0, right: 0, top: 0, bottom: 11, lines: 1 });
});

test('wrapPixelText: breaks at spaces by ink width at the scale; a long word gets its own line', () => {
    assert.equal(wrapPixelText(GNF.chars, 'AAA AAA AAA', 30), 'AAA\nAAA\nAAA');      // "AAA AAA" is 41 px
    assert.equal(wrapPixelText(GNF.chars, 'AAA AAA AAA', 41), 'AAA AAA\nAAA');
    assert.equal(wrapPixelText(GNF.chars, 'AAA AAA', 41, { scale: 2 }), 'AAA\nAAA', 'x2 halves the room');
    assert.equal(wrapPixelText(GNF.chars, 'AAAAAAAAAA b', 20), 'AAAAAAAAAA\nb');
    assert.equal(wrapPixelText(GNF.chars, 'a b\nc', 100), 'a b\nc');
});

// ---- pixelText on a scene ----

test('pixelText: BitmapText from the sheet, fontSize the native size times a whole scale, tinted, origin 0', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 10, 20, 'Hi', { scale: 2, color: '#ff4444', depth: 7 });
    assert.equal(t.kind, 'bitmap');
    assert.equal(t.key, PIXEL_FONT);
    assert.equal(t.fontSize, PIXEL_FONT_SIZE * 2);
    assert.equal(t.tint, 0xff4444);
    assert.deepEqual(t.origin, [0, 0]);
    assert.equal(t.depth, 7);
    assert.deepEqual([t.x, t.y], [10, 20]);
    const o = pixelText(scene, 0, 0, '9', { outline: true, scale: 3 });
    assert.equal(o.key, PIXEL_FONT_OUTLINE);
    assert.deepEqual([o.x, o.y], [3, 3], 'the outline ring starts at the anchor');
});

test('pixelText: a centred odd-width word lands on whole pixels; the anchor holds through setPixelText and placePixelText', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 100, 50, 'A', { origin: [0.5, 1] });   // 5 px wide, 11 px line box
    assert.deepEqual([t.x, t.y], [Math.round(100 - 2.5), 50 - 11]);
    for (const v of [t.x, t.y]) assert.ok(Number.isInteger(v));
    setPixelText(t, 'AA');                                           // 11 px wide
    assert.deepEqual([t.x, t.y], [Math.round(100 - 5.5), 39]);
    placePixelText(t, 60.4, 30.6);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    assert.deepEqual(pixelTextBox(t), { left: 0, top: 0, width: 11, height: 11 });
});

test('pixelText: wrap is in screen pixels; missing glyphs swapped before drawing', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 0, 0, 'AAA AAA ś', { wrap: 30 });
    assert.equal(t.text, 'AAA\nAAA s');
});

test('setPixelScale: whole steps only, anchor kept', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 50, 50, '!', { scale: 3, outline: true, origin: [0.5, 0.5] });
    const before = pixelTextBox(t);
    setPixelScale(t, 4);
    assert.equal(t.fontSize, PIXEL_FONT_SIZE * 4);
    const after = pixelTextBox(t);
    assert.equal(after.height, before.height / 3 * 4);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    setPixelScale(t, 3.6);
    assert.equal(t.pixelOpts.scale, 4, 'rounded to a whole scale');
});

test('no sheet cached (or no bitmapText): a GNF canvas Text at the native size, flagged pixelFallback', () => {
    const scene = fakeScene({ bitmap: false });
    assert.equal(pixelFontReady(scene), false);
    const t = pixelText(scene, 5.5, 6.5, 'Hi', { scale: 2, color: 0x44ff44, outline: true, origin: [0.5, 0.5] });
    assert.equal(t.kind, 'text');
    assert.ok(t.pixelFallback);
    assert.match(t.style.fontFamily, /GNF/);
    assert.equal(t.style.fontSize, '20.48px');
    assert.equal(t.style.color, '#44ff44');
    assert.equal(t.style.stroke, '#000000');
    assert.deepEqual(t.origin, [0.5, 0.5]);
    assert.deepEqual([t.x, t.y], [6, 7]);
    assert.equal(pixelFontReady(fakeScene()), true);
});

test('preloadPixelFont: queues both sheets once, from fonts/gnf-bitmap/', () => {
    const queued = [];
    let started = 0;
    const scene = { cache: { bitmapFont: { exists: () => false } },
        load: { bitmapFont: (...a) => queued.push(a), isLoading: () => false, start: () => { started++; } } };
    assert.equal(preloadPixelFont(scene), true);
    assert.deepEqual(queued, [['gnf', 'fonts/gnf-bitmap/gnf.png', 'fonts/gnf-bitmap/gnf.xml'],
        ['gnf-outline', 'fonts/gnf-bitmap/gnf-outline.png', 'fonts/gnf-bitmap/gnf-outline.xml']]);
    assert.equal(started, 0, 'in preload the loader runs by itself');
    preloadPixelFont(scene, { start: true });
    assert.equal(started, 1);
    const cached = { cache: { bitmapFont: { exists: () => true } }, load: { bitmapFont: () => assert.fail('already cached') } };
    assert.equal(preloadPixelFont(cached), false);
});

// ---- converted call sites ----

test('damage numbers: outlined GNF at x2, tinted by type, rising on whole pixels', async () => {
    const { DamageNumbersSystem } = await imp('systems/damage-numbers.js');
    const scene = fakeScene();
    const d = new DamageNumbersSystem(scene);
    const t = scene.made[scene.made.length - 1];
    assert.equal(t.key, PIXEL_FONT_OUTLINE);
    assert.equal(t.fontSize, PIXEL_FONT_SIZE * 2);
    d.show(100.3, 80.7, 12.4, 'heal');
    assert.equal(t.text, '12');
    assert.equal(t.tint, 0x44ff44);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    d.active[0].startTime -= 333;
    d.update();
    assert.ok(Number.isInteger(t.y) && t.y < 80, 'risen, on a whole pixel');
    d.show(0, 0, 3, 'blocked');
    assert.equal(scene.made[scene.made.length - 2].tint, 0xbbbbbb);
});

test('attack telegraph: an outlined red ! at x3, centred on whole pixels, pulsing x3/x4 with no scale tween', async () => {
    const { AttackTelegraphSystem } = await imp('systems/attack-telegraph.js');
    const tweens = [];
    const scene = fakeScene();
    scene.add.circle = () => ({ setStrokeStyle() {}, setDepth() {}, setPosition() {}, destroy() {} });
    scene.tweens = { add: (c) => tweens.push(c) };
    scene.time = { delayedCall() {} };
    const sys = new AttackTelegraphSystem(scene);
    const npc = { x: 200.5, y: 300.5, active: true };
    sys.show('n', npc, 500);
    const t = sys.activeTelegraphs.get('n').indicator;
    assert.equal(t.key, PIXEL_FONT_OUTLINE);
    assert.equal(t.tint, 0xff0000);
    assert.equal(t.fontSize, PIXEL_FONT_SIZE * 3);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    assert.ok(!tweens.some(c => c.targets === t), 'no smooth scale tween on the text');
    sys.activeTelegraphs.get('n').startTime -= 260;
    sys.update();
    assert.equal(t.fontSize, PIXEL_FONT_SIZE * 4);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
});

test('speech bubble: sized from the sheet glyphs, text placed on whole pixels inside the frame', async () => {
    const { NpcWorldBubbles, BORDER_PX } = await imp('systems/npc-world-bubbles.js');
    const scene = fakeScene();
    const parts = [];
    const stub = () => { const o = { calls: [], x: 0, y: 0, scene, setOrigin() { return o; }, setVisible() { return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture() { return o; }, setDepth() { return o; } };
        for (const m of ['clear', 'fillStyle', 'fillRect']) o[m] = (...a) => { o.calls.push([m, ...a]); return o; };
        parts.push(o); return o; };
    scene.add.graphics = stub; scene.add.image = stub; scene.add.container = stub;
    const w = new NpcWorldBubbles({ fontsReady: true });
    const bb = w._make(scene);
    assert.equal(bb.text.kind, 'bitmap');
    assert.equal(bb.text.tint, 0x1b2a41);
    w._render(bb, 'Hello there');
    const ink = measurePixelText(GNF.chars, 'Hello there');
    assert.equal(bb.w % 2, 0);
    assert.ok(bb.w >= ink.right - ink.left + 2 * BORDER_PX + 8 && bb.w <= ink.right - ink.left + 2 * BORDER_PX + 9);
    assert.equal(bb.h, 11 + 2 * 2 + 2 * BORDER_PX);
    w._layout(bb, { dx: 0, lift: 0 });
    assert.ok(Number.isInteger(bb.text.x) && Number.isInteger(bb.text.y));
    assert.equal(bb.text.x, -bb.w / 2 + BORDER_PX + 4);
});
