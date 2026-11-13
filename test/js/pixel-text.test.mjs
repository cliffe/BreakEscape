// q105: text drawn in the Phaser canvas uses GNF as a bitmap font (utils/pixel-text.js), built at
// GNF's native 10.24 px by tools/fonts/build_gnf_bitmap.py, at whole-number scales on whole pixels.
// The helper runs against a fake scene whose cache holds the real gnf.xml and gnf-shadow.xml; the
// build check runs the Python script with --check (skipped when python3 or Pillow is missing).
// Assertions are about what the player sees (the drawn box, ink widths, whole pixels, colours,
// draw order), not the helper's internals (R1 m9).
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
    colourInt, pixelScale, preloadPixelFont, pixelFontReady, pixelFontUrls, setPixelColour, PIXEL_FONT, PIXEL_FONT_SHADOW,
    PIXEL_LINE_HEIGHT } = P;

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
const SHADOW = parseXml('gnf-shadow.xml');
const FONTS = { [PIXEL_FONT]: GNF, [PIXEL_FONT_SHADOW]: SHADOW };

// What a BitmapText from `key` draws for its text at its position, in screen px: the union of
// the glyph quads (as Phaser's BitmapText lays them out: pen + offset, times fontSize / size)
function drawnBox(o, at = { x: 0, y: 0 }) {
    const f = FONTS[o.key];
    const k = o.fontSize / f.size;
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    String(o.text).split('\n').forEach((line, row) => {
        let pen = 0;
        for (const ch of line) {
            const g = f.chars[ch.codePointAt(0)];
            if (!g) continue;
            if (g.width) {
                l = Math.min(l, pen + g.xOffset); r = Math.max(r, pen + g.xOffset + g.width);
                t = Math.min(t, row * f.lineHeight + g.yOffset); b = Math.max(b, row * f.lineHeight + g.yOffset + g.height);
            }
            pen += g.xAdvance;
        }
    });
    const x0 = at.x + o.x, y0 = at.y + o.y;
    return { left: x0 + l * k, right: x0 + r * k, top: y0 + t * k, bottom: y0 + b * k };
}

function fakeScene({ bitmap = true, container = true } = {}) {
    const made = [];
    const mk = (kind, key, size, style) => {
        const o = { kind, key, fontSize: size, style, x: 0, y: 0, text: '', tint: null, depth: null, visible: true, alphaSet: [],
            setText(t) { o.text = t; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
            setOrigin(x, y) { o.origin = [x, y]; return o; }, setTint(t) { o.tint = t; return o; },
            setFontSize(s) { o.fontSize = s; return o; }, setDepth(d) { o.depth = d; return o; },
            setVisible(v) { o.visible = v; return o; }, setAlpha(a) { o.alphaSet.push(a); return o; }, destroy() { o.destroyed = true; },
            setColor(c) { o.color = c; return o; },
            get width() { return String(o.text).length * 6; }, get height() { return 11; } };
        made.push(o);
        return o;
    };
    const cache = new Map(Object.entries(FONTS).map(([k, v]) => [k, { data: v }]));
    const scene = {
        made,
        add: { text: (x, y, t, style) => mk('text', null, null, style) },
        cache: { bitmapFont: { get: (k) => (bitmap ? cache.get(k) : undefined), exists: (k) => bitmap && cache.has(k) } }
    };
    if (bitmap) scene.add.bitmapText = (x, y, key, t, size) => mk('bitmap', key, size);
    if (container) scene.add.container = (x, y, list) => { const c = mk('container'); c.list = list; c.x = x; c.y = y; return c; };
    return scene;
}

// ---- the sheet ----

test('the sheet: GNF at one font pixel a screen pixel (A is 5x7 on a 6 px advance), 12 px lines, base 9', () => {
    assert.equal(GNF.lineHeight, PIXEL_LINE_HEIGHT);
    assert.equal(GNF.base, 9);
    const A = GNF.chars[65];
    assert.deepEqual([A.width, A.height, A.xOffset, A.yOffset, A.xAdvance], [5, 7, 0, 2, 6]);
    const g = GNF.chars['g'.charCodeAt(0)];
    assert.equal(g.yOffset + g.height, 11, 'descender ends at the line box bottom');
    for (const ch of 'abcXYZ0123456789£éÉàçñüö.,!?\'"-+()[]:;/') assert.ok(GNF.chars[ch.codePointAt(0)], `missing ${ch}`);
    // The shadow sheet: every glyph 1 px bigger on each side, same advances and line metrics, so
    // drawn at the same pen position it rings the plain glyph by exactly one font pixel
    assert.deepEqual([SHADOW.size, SHADOW.lineHeight, SHADOW.base], [GNF.size, GNF.lineHeight, GNF.base]);
    for (const [id, c] of Object.entries(GNF.chars)) {
        const o = SHADOW.chars[id];
        assert.equal(o.xAdvance, c.xAdvance);
        if (c.width) assert.deepEqual([o.width, o.height, o.xOffset, o.yOffset], [c.width + 2, c.height + 2, c.xOffset - 1, c.yOffset - 1]);
    }
});

test('the font build check: every glyph on the pixel grid, slivers under 7%, the committed sheets up to date', (t) => {
    const probe = spawnSync('python3', ['-I', '-c', 'import PIL'], { encoding: 'utf8' });
    if (probe.status !== 0) { t.skip('python3 with Pillow not available'); return; }
    const r = spawnSync('python3', ['-I', join(root, 'tools/fonts/build_gnf_bitmap.py'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /up to date and every glyph is on the pixel grid/);
    const sliver = r.stdout.match(/largest sliver accepted: ([\d.]+)% of a pixel .*limit 7%/);
    assert.ok(sliver, r.stdout);
    assert.ok(Number(sliver[1]) < 7);
});

test('MISSING.txt says what the helper does with the characters GNF lacks', () => {
    const txt = readFileSync(join(fontDir, 'MISSING.txt'), 'utf8');
    assert.match(txt, /pixel-text\.js draws these as the plain letter,\s+a stand-in or \?/);
    assert.ok(!/draws nothing/.test(txt));
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
    const o = measurePixelText(SHADOW.chars, '7', { outline: true });
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

test('pixelText: drawn from the sheet at a whole scale (box 11 px a line at x1, 22 at x2), tinted, on whole pixels', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 10, 20, 'Hi', { scale: 2, color: '#ff4444', depth: 7 });
    assert.equal(t.kind, 'bitmap');
    assert.equal(t.tint, 0xff4444);
    assert.equal(t.depth, 7);
    assert.deepEqual(pixelTextBox(t), { left: 0, top: 0, width: measurePixelText(GNF.chars, 'Hi').right * 2, height: 22 });
    const d = drawnBox(t);
    assert.deepEqual([d.left, d.right - d.left], [10, pixelTextBox(t).width], 'ink starts at the anchor, as wide as the box');
    assert.ok(d.top >= 20 && d.bottom <= 20 + 22, 'ink inside the line box');
    for (const v of [t.x, t.y]) assert.ok(Number.isInteger(v));
    assert.equal(pixelTextBox(pixelText(scene, 0, 0, 'Hi')).height, 11);
});

test('outlined pixelText: a shadow drawn first, the tinted fill on top at the same pen position, ringed by one font pixel', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 0, 0, '90', { outline: true, scale: 3, color: 0xff0000 });
    assert.equal(t.list.length, 2);
    const [back, front] = t.list;
    assert.equal(back.tint, null, 'the part behind is left black');
    assert.equal(front.tint, 0xff0000, 'the part in front carries the colour');
    assert.deepEqual([back.x, back.y], [front.x, front.y], 'same pen position');
    const b = drawnBox(back, t), f = drawnBox(front, t);
    assert.deepEqual([f.left - b.left, b.right - f.right, f.top - b.top, b.bottom - f.bottom], [3, 3, 3, 3], 'one font pixel (3 px at x3) all round');
    assert.deepEqual([b.left, t.y + 0], [0, t.y], 'the outline ring starts at the anchor');
    assert.equal(pixelTextBox(t).height, (11 + 2) * 3);
    // Colour changes reach the fill only
    setPixelColour(t, 0xffd000);
    assert.deepEqual([back.tint, front.tint], [null, 0xffd000]);
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
    // setPixelText with an anchor moves it there first
    setPixelText(t, 'A', { x: 20, y: 40 });
    assert.deepEqual([t.x, t.y], [Math.round(20 - 2.5), 40 - 11]);
});

test('pixelText: wrap is in screen pixels; missing glyphs swapped before drawing', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 0, 0, 'AAA AAA ś', { wrap: 30 });
    assert.equal(t.text, 'AAA\nAAA s');
});

test('setPixelScale: whole steps only, the box grows with it, anchor kept', () => {
    const scene = fakeScene();
    const t = pixelText(scene, 50, 50, '!', { scale: 3, outline: true, origin: [0.5, 0.5] });
    const before = pixelTextBox(t);
    setPixelScale(t, 4);
    const after = pixelTextBox(t);
    assert.equal(after.height, before.height / 3 * 4);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    const mid = [t.x + after.left + after.width / 2, t.y + after.top + after.height / 2];
    assert.ok(Math.abs(mid[0] - 50) <= 0.5 && Math.abs(mid[1] - 50) <= 0.5, 'still centred on the anchor');
    setPixelScale(t, 3.6);
    assert.equal(pixelTextBox(t).height, after.height, 'rounded to a whole scale (4)');
});

test('no sheet cached (or no bitmapText): a GNF canvas Text at the native size, flagged pixelFallback, wrap passed on', () => {
    const scene = fakeScene({ bitmap: false });
    assert.equal(pixelFontReady(scene), false);
    const t = pixelText(scene, 5.5, 6.5, 'Hi', { scale: 2, color: 0x44ff44, outline: true, origin: [0.5, 0.5], wrap: 90 });
    assert.equal(t.kind, 'text');
    assert.ok(t.pixelFallback);
    assert.match(t.style.fontFamily, /GNF/);
    assert.equal(t.style.fontSize, '20.48px');
    assert.equal(t.style.color, '#44ff44');
    assert.equal(t.style.stroke, '#000000');
    assert.deepEqual(t.style.wordWrap, { width: 90 }, 'wrap means the same on both paths');
    assert.deepEqual(t.origin, [0.5, 0.5]);
    assert.deepEqual([t.x, t.y], [6, 7]);
    setPixelColour(t, 0xff4444);
    assert.equal(t.color, '#ff4444');
    assert.equal(pixelFontReady(fakeScene()), true);
    assert.equal(pixelFontReady(fakeScene({ container: false }), true), false, 'outlined text needs a container');
});

test('preloadPixelFont: queues both sheets once, from fonts/gnf-bitmap/, versioned', () => {
    const queued = [];
    let started = 0;
    const scene = { cache: { bitmapFont: { exists: () => false } },
        load: { bitmapFont: (...a) => queued.push(a), isLoading: () => false, start: () => { started++; } } };
    assert.equal(preloadPixelFont(scene, { version: '42' }), true);
    assert.deepEqual(queued, [['gnf', 'fonts/gnf-bitmap/gnf.png?v=42', 'fonts/gnf-bitmap/gnf.xml?v=42'],
        ['gnf-shadow', 'fonts/gnf-bitmap/gnf-shadow.png?v=42', 'fonts/gnf-bitmap/gnf-shadow.xml?v=42']]);
    assert.equal(started, 0, 'in preload the loader runs by itself');
    preloadPixelFont(scene, { start: true });
    assert.equal(started, 1);
    const cached = { cache: { bitmapFont: { exists: () => true } }, load: { bitmapFont: () => assert.fail('already cached') } };
    assert.equal(preloadPixelFont(cached), false);
    // The version comes from the page's config when not given; both URLs carry the same one
    window.breakEscapeConfig = { assetsVersion: '7.1' };
    assert.deepEqual(pixelFontUrls('gnf'), ['fonts/gnf-bitmap/gnf.png?v=7.1', 'fonts/gnf-bitmap/gnf.xml?v=7.1']);
    delete window.breakEscapeConfig;
    assert.deepEqual(pixelFontUrls('gnf'), ['fonts/gnf-bitmap/gnf.png', 'fonts/gnf-bitmap/gnf.xml']);
});

// ---- converted call sites ----

test('damage numbers: one outline behind the whole number, tinted fill on top, rising on whole pixels', async () => {
    const { DamageNumbersSystem, DAMAGE_COLOURS } = await imp('systems/damage-numbers.js');
    const scene = fakeScene();
    const d = new DamageNumbersSystem(scene);
    const t = d.pool[d.pool.length - 1];
    d.show(100.3, 80.7, 12.4, 'heal');
    const [back, front] = t.list;
    assert.equal(front.text, '12');
    assert.equal(back.text, '12', 'the outline is drawn behind the whole string');
    assert.equal(front.tint, DAMAGE_COLOURS.heal);
    assert.equal(back.tint, null);
    const b = drawnBox(back, t), f = drawnBox(front, t);
    assert.deepEqual([f.left - b.left, b.right - f.right], [2, 2], 'a 2 px outline at x2');
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    d.active[0].startTime -= 333;
    d.update();
    assert.ok(Number.isInteger(t.y) && t.y < 80, 'risen, on a whole pixel');
    d.show(0, 0, 3, 'blocked');
    assert.equal(d.active[1].text.list[1].tint, DAMAGE_COLOURS.blocked);
});

test('damage numbers fade in steps: full colour at half time, half brightness late, then hidden; alpha never set', async () => {
    const { DamageNumbersSystem, DAMAGE_COLOURS, damageFadeStep } = await imp('systems/damage-numbers.js');
    const scene = fakeScene();
    const d = new DamageNumbersSystem(scene);
    d.show(50, 50, 7, 'damage');
    const item = d.active[0];
    const t = item.text, fill = t.list[1];
    const at = (p) => { item.startTime = Date.now() - p * item.duration; d.update(); };
    at(0.5);
    assert.equal(t.visible, true);
    assert.equal(fill.tint, DAMAGE_COLOURS.damage, 'fully opaque, full colour at 50%');
    at(0.75);
    assert.equal(t.visible, true);
    assert.equal(fill.tint, 0x7f2222, 'half brightness');
    at(0.9);
    assert.equal(t.visible, false);
    assert.deepEqual(t.alphaSet, [], 'no smooth alpha');
    for (const o of scene.made) assert.deepEqual(o.alphaSet, []);
    assert.deepEqual(damageFadeStep(0.69, 0xd8d8d8), { visible: true, colour: 0xd8d8d8 });
    assert.deepEqual(damageFadeStep(0.7, 0xd8d8d8), { visible: true, colour: 0x6c6c6c });
    assert.equal(damageFadeStep(0.85, 0xd8d8d8).visible, false);
});

test('attack telegraph: an outlined ! at x3, centred on whole pixels, same size throughout, fill stepping red/amber', async () => {
    const { AttackTelegraphSystem, PULSE_MS, PULSE_COLOURS, telegraphColour } = await imp('systems/attack-telegraph.js');
    const tweens = [];
    const scene = fakeScene();
    scene.add.circle = () => ({ setStrokeStyle() {}, setDepth() {}, setPosition() {}, destroy() {} });
    scene.tweens = { add: (c) => tweens.push(c) };
    scene.time = { delayedCall() {} };
    const sys = new AttackTelegraphSystem(scene);
    const npc = { x: 200.5, y: 300.5, active: true };
    sys.show('n', npc, 500);
    const tel = sys.activeTelegraphs.get('n');
    const t = tel.indicator, fill = t.list[1];
    assert.equal(fill.tint, 0xff0000);
    const box = pixelTextBox(t);
    assert.equal(box.height, (11 + 2) * 3);
    assert.ok(Number.isInteger(t.x) && Number.isInteger(t.y));
    assert.ok(!tweens.some(c => c.targets === t), 'no smooth tween on the text');
    const pos = [t.x, t.y];
    tel.startTime -= PULSE_MS + 10;
    sys.update();
    assert.equal(fill.tint, 0xffd000);
    assert.deepEqual(pixelTextBox(t), box, 'same size');
    assert.deepEqual([t.x, t.y], pos, 'same place: no jitter');
    tel.startTime -= PULSE_MS;
    sys.update();
    assert.equal(fill.tint, 0xff0000);
    assert.deepEqual(PULSE_COLOURS, [0xff0000, 0xffd000]);
    assert.equal(telegraphColour(0), 0xff0000);
    assert.equal(telegraphColour(PULSE_MS), 0xffd000);
});

test('lock and phone stand-ins: the backing is sized from the text, 3 px each side and 2 px above and below, centred', async () => {
    const { standInBacking } = await imp('systems/npc-office-visuals.js');
    const scene = fakeScene();
    for (const s of ['L', 'U', 'Ph']) {
        const t = pixelText(scene, 0, -2, s, { origin: [0.5, 1] });
        const box = pixelTextBox(t);
        const b = standInBacking(box);
        const ink = drawnBox(t);
        assert.equal(ink.left - b.x, 3, `${s}: 3 px left`);
        assert.equal(b.x + b.w - ink.right, 3, `${s}: 3 px right`);
        // The rectangle's origin is its bottom left: bottom at b.y, top at b.y - b.h
        assert.equal(b.y - (t.y + box.height), 2, `${s}: 2 px below the line box`);
        assert.equal(t.y - (b.y - b.h), 2, `${s}: 2 px above`);
        assert.ok(Math.abs((b.x + b.w / 2)) <= 0.5, `${s}: centred on the anchor`);
    }
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
