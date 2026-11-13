// UX feedback round slice 5: barks from a person NPC in view show as a speech bubble over them
// (npc-world-bubbles.js say()), with no pulsing talk icon and no toast; the toast stays for NPCs
// out of view and phone contacts. Long lines page (at most 3 lines a page) timed to the audio;
// leaving view sends the rest to the toast; at most MAX_BUBBLES bubbles, barks before chatter.
// The bubble is pixel art: GNF (bitmap sheet, q105), 2 px whole-pixel frame, no rounded rects.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/ux-bark-bubbles.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.gameState = { globalVariables: {} };
const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()), apply: () => inert(), set: () => true });
globalThis.AudioContext = window.AudioContext = function AudioContext() { return inert(); };
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const barksMod = await imp('systems/npc-barks.js');
const NPCBarkSystem = barksMod.default;
const { routeBark } = barksMod;
const B = await imp('systems/npc-world-bubbles.js');
const { NpcWorldBubbles, crispText, pageLine, pagesText, pageTimes, lineTotalMs, readingMs, wrapLines, onCamera, placeBubble,
    MAX_LIFT, HEAD_POINT_DY, hookCameraPass, followUpTimes, MAX_BUBBLES, PAGE_LINES, LINE_CHARS, PAGE_MIN_MS, AUDIO_TAIL_MS, SPEECH_FONT, SPEECH_FONT_SCALE, BORDER_PX, CAMERA_MARGIN, TEXT_RIGHT_SLACK } = B;
const { displayDashes } = await imp('utils/display-dashes.js');
const { npcIconAnchor } = await imp('systems/npc-office-visuals.js');

// A 150-character bark, the length of the longest authored one (test_bark_bubbles, Dana)
const LONG = "Badges on at all times past this point, please. If yours has stopped working, reception can print a new one. And don't wedge the fire door open again.";

// ---- a scene whose Graphics records every call ----
function mk(scene, kind) {
    const calls = [];
    const o = { kind, calls, x: 0, y: 0, visible: true, data: {}, scene, text: '', style: null,
        get width() { return o.kind === 'text' ? Math.max(...String(o.text).split('\n').map(l => l.length), 0) * 7 : 16; },
        get height() { return o.kind === 'text' ? String(o.text).split('\n').length * 16 : 16; },
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture(k) { o.textureKey = k; return o; }, setText(t) { o.text = t; return o; }, setDepth() { return o; },
        setData(k, v) { o.data[k] = v; return o; }, getData(k) { return o.data[k]; }, setScale(s) { calls.push(['setScale', s]); return o; } };
    for (const m of ['clear', 'fillStyle', 'lineStyle', 'fillRect', 'strokeRect', 'fillRoundedRect', 'strokeRoundedRect', 'fillTriangle', 'lineBetween']) {
        o[m] = (...a) => { calls.push([m, ...a]); return o; };
    }
    return o;
}

function rig({ playerRoom = 'hall', npcs = { sara: { x: 100, y: 100, room: 'hall' } }, player = { x: 100, y: 140 }, view = null } = {}) {
    const tweens = [];
    const scene = { add: {}, textures: { exists: () => true }, load: { image() {}, once() {}, isLoading: () => true, start() {} },
        tweens: { add: (t) => { tweens.push(t); return { stop() {} }; } } };
    // The main camera's world view (cameras.main.worldView); none means "no camera to ask"
    if (view) scene.cameras = { main: { worldView: view } };
    scene.add.text = (x, y, t, style) => { const o = mk(scene, 'text'); o.style = style; return o; };
    scene.add.image = () => mk(scene, 'image');
    scene.add.graphics = () => mk(scene, 'graphics');
    scene.add.container = () => mk(scene, 'container');
    const sprites = {};
    const rooms = {};
    for (const [id, n] of Object.entries(npcs)) {
        const s = { npcId: id, x: n.x, y: n.y, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
            getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
        sprites[id] = s;
        (rooms[n.room] ||= { npcSprites: [] }).npcSprites.push(s);
    }
    window.rooms = rooms;
    window.currentPlayerRoom = playerRoom;
    window.player = player;
    window.MinigameFramework = { currentMinigame: null };
    window.lightingSystem = null;
    window.npcNeedsSystem = null;
    window.npcBehaviorManager = null;
    let t = 0;
    const clock = { now: () => t, advance: (ms) => { t += ms; } };
    const bubbles = new NpcWorldBubbles({ now: clock.now, fontsReady: true });
    window.npcWorldBubbles = bubbles;
    return { scene, sprites, rooms, bubbles, clock, tweens };
}

function barkSystem(npcTypes = {}) {
    document.body.innerHTML = '';
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id[0].toUpperCase() + id.slice(1), npcType: npcTypes[id] || 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.playBarkSound = () => {};
    return sys;
}
const toasts = () => [...document.querySelectorAll('.npc-bark .npc-bark-text')].map(e => e.textContent);
const tick = () => new Promise((r) => setTimeout(r, 0));

// ---- routing ----

test('routeBark: in view gives bubble; out of view, dark room, phone NPC and open minigame give toast', () => {
    const base = { npcType: 'person', hasSprite: true, npcRoom: 'hall', playerRoom: 'hall', dark: false, minigameOpen: false };
    assert.equal(routeBark(base), 'bubble');
    assert.equal(routeBark({ ...base, playerRoom: 'lobby' }), 'toast');
    assert.equal(routeBark({ ...base, dark: true }), 'toast');
    assert.equal(routeBark({ ...base, npcType: 'phone' }), 'toast');
    assert.equal(routeBark({ ...base, minigameOpen: true }), 'toast');
    assert.equal(routeBark({ ...base, hasSprite: false }), 'toast');
    assert.equal(routeBark({ ...base, npcType: undefined }), 'bubble', 'a sprite NPC with no npcType is a person');
});

test('a bark in view shows a bubble and no toast; out of view it is a toast; a phone contact is always a toast', async () => {
    const r = rig({ npcs: { sara: { x: 100, y: 100, room: 'hall' }, len: { x: 0, y: 0, room: 'lobby' }, ruth: { x: 120, y: 100, room: 'hall' } } });
    const sys = barkSystem({ ruth: 'phone' });
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'Not with you behind me. Ask at reception.' });
    r.bubbles.update();
    assert.deepEqual(toasts(), []);
    const bb = r.bubbles.bubbles.get('sara');
    assert.ok(bb && bb.box.visible, 'bubble over Sara');
    assert.equal(bb.text.text.replace(/\n/g, ' '), 'Not with you behind me. Ask at reception.');
    assert.equal(r.tweens.length, 0, 'no tween (the old pulsing talk icon)');
    assert.equal(r.sprites.sara.barkIcon, undefined, 'no bark icon made');

    await sys._renderBark({ npcId: 'len', npcName: 'Len', message: 'Out of sight.' });
    assert.deepEqual(toasts(), ['Len: Out of sight.']);
    await sys._renderBark({ npcId: 'ruth', npcName: 'Ruth', message: 'Phone text.' });
    assert.deepEqual(toasts(), ['Len: Out of sight.', 'Ruth: Phone text.']);
    assert.equal(r.bubbles.hasLine('ruth'), false);
});

test('a dark room or an open minigame sends the bark to the toast', async () => {
    const r = rig();
    const sys = barkSystem();
    window.lightingSystem = { rooms: new Map([['hall', {}]]), roomLevel: () => 0 };
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'In the dark.' });
    assert.deepEqual(toasts(), ['Sara: In the dark.']);
    window.lightingSystem = null;
    window.MinigameFramework.currentMinigame = { id: 'pin' };
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'Busy.' });
    assert.deepEqual(toasts(), ['Sara: In the dark.', 'Sara: Busy.']);
    assert.equal(r.bubbles.says.size, 0);
});

// ---- paging ----

test('a 150-character line pages into at most 3 lines a page, word for word', () => {
    assert.equal(LONG.length, 150);
    const pages = pageLine(LONG);
    assert.ok(pages.length >= 2, `pages: ${pages.length}`);
    for (const p of pages) {
        const lines = p.split('\n');
        assert.ok(lines.length <= PAGE_LINES, `page has ${lines.length} lines`);
        for (const l of lines) assert.ok(l.length <= LINE_CHARS, `line too long: ${l}`);
    }
    assert.equal(pagesText(pages), LONG);
    assert.deepEqual(wrapLines('one'), ['one']);
    assert.deepEqual(pageLine(''), []);
});

test('page times: share of the audio length plus 0.8 s by word count, at least 1.2 s; reading time without audio', () => {
    const pages = pageLine(LONG);
    const words = pages.map(p => p.split(/\s+/).length);
    const all = words.reduce((s, n) => s + n, 0);
    const share = (total) => words.map(n => Math.max(PAGE_MIN_MS, Math.round(total * n / all)));
    assert.deepEqual(pageTimes(pages, lineTotalMs({ audioMs: 9000, readingMs: 1 })), share(9000 + AUDIO_TAIL_MS));
    assert.deepEqual(pageTimes(pages, lineTotalMs({ audioMs: null, readingMs: readingMs(LONG) })), share(readingMs(LONG)));
    assert.equal(lineTotalMs({ audioMs: 9000, readingMs: 5 }), 9800);
    assert.equal(lineTotalMs({ audioMs: null, readingMs: 5 }), 5);
    assert.deepEqual(pageTimes(['a', 'b c d e f g h i j'], 1000), [PAGE_MIN_MS, PAGE_MIN_MS]);
});

test('the bubble pages through the line; when the audio length arrives the pages to come re-time to it', () => {
    const r = rig();
    const h = r.bubbles.say('sara', LONG);
    assert.ok(h);
    const st = h.state;
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('sara').text.text, st.pages[0]);
    const first = st.times[0];
    h.setAudioMs(12000);
    assert.equal(st.times[0], first, 'the page showing keeps its time');
    const want = pageTimes(st.pages, 12000 + AUDIO_TAIL_MS);
    for (let i = 1; i < st.pages.length; i++) assert.equal(st.times[i], want[i]);
    r.clock.advance(first);
    r.bubbles.update();
    assert.equal(st.page, 1);
    assert.equal(r.bubbles.bubbles.get('sara').text.text, st.pages[1]);
    r.clock.advance(st.times.slice(1).reduce((s, n) => s + n, 0));
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('sara'), false, 'done after the last page');
    assert.equal(r.bubbles.bubbles.get('sara').box.visible, false);
});

test('leaving view on page 2 sends pages 2 onwards to the toast, with the speaker\'s name', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: LONG });
    const st = r.bubbles.says.get('sara');
    r.bubbles.update();
    r.clock.advance(st.times[0]);
    r.bubbles.update();
    assert.equal(st.page, 1);
    window.currentPlayerRoom = 'lobby';
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('sara'), false);
    assert.deepEqual(toasts(), [`Sara: ${pagesText(st.pages.slice(1))}`]);
});

test('a minigame opening mid-bark sends the remainder to the toast, held until it closes', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: LONG });
    const st = r.bubbles.says.get('sara');
    r.bubbles.update();
    window.MinigameFramework.currentMinigame = { id: 'pin' };
    window.MinigameFramework.holdsBarks = () => true;
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('sara'), false);
    assert.deepEqual(toasts(), [], 'held while the minigame is open');
    assert.equal(sys.deferredBarkQueue.length, 1);
    assert.equal(sys.deferredBarkQueue[0].message, pagesText(st.pages));
    assert.equal(sys.deferredBarkQueue[0].forceToast, true);
    assert.equal(sys.deferredBarkQueue[0].useTTS, false, 'the remainder is not voiced again');
    delete window.MinigameFramework.holdsBarks;
});

// ---- capacity ----

test('a bark outranks needs chatter for a place', () => {
    const npcs = {};
    // Spaced so four bubbles fit side by side (R2: a bubble with no clear place shows no more)
    for (let i = 0; i < 5; i++) npcs[`n${i}`] = { x: 100 + i * 70, y: 100, room: 'hall' };
    const r = rig({ npcs, player: { x: 100, y: 100 } });
    // Chatter from the four nearest; the bark comes from the farthest
    const talking = new Map([0, 1, 2, 3].map(i => [`n${i}`, { line: 'Chat.', partnerId: null }]));
    window.npcNeedsSystem = { states: new Map(Object.keys(npcs).map(k => [k, {}])), getState: id => ({ talking: talking.get(id) || null }) };
    window.npcBehaviorManager = { getBehavior: id => (r.sprites[id] ? { sprite: r.sprites[id], roomId: 'hall' } : null) };
    r.bubbles.update();
    assert.equal([...r.bubbles.bubbles.values()].filter(b => b.box.visible).length, MAX_BUBBLES);
    assert.ok(r.bubbles.say('n4', 'A bark.'));
    r.bubbles.update();
    const shown = [...r.bubbles.bubbles].filter(([, b]) => b.box.visible).map(([id]) => id).sort();
    assert.deepEqual(shown, ['n0', 'n1', 'n2', 'n4'], 'the farthest chatter bubble (n3) gave way');
});

test('a fifth bark farther than all four goes to the toast; a nearer one takes the farthest bark\'s place', async () => {
    const npcs = {};
    for (let i = 0; i < 6; i++) npcs[`n${i}`] = { x: 100 + (i + 1) * 10, y: 100, room: 'hall' };
    const r = rig({ npcs, player: { x: 100, y: 100 } });
    const sys = barkSystem();
    for (const i of [1, 2, 3, 4]) await sys._renderBark({ npcId: `n${i}`, npcName: `N${i}`, message: `Line ${i}.` });
    assert.equal(r.bubbles.says.size, 4);
    await sys._renderBark({ npcId: 'n5', npcName: 'N5', message: 'Farthest.' });
    assert.deepEqual(toasts(), ['N5: Farthest.']);
    await sys._renderBark({ npcId: 'n0', npcName: 'N0', message: 'Nearest.' });
    await tick();
    assert.ok(r.bubbles.hasLine('n0'));
    assert.equal(r.bubbles.hasLine('n4'), false);
    assert.deepEqual(toasts(), ['N5: Farthest.', 'N4: Line 4.'], 'the pushed bark\'s remainder is a toast');
});

// ---- pixel art ----

test('pixel art: GNF at whole pixels, 2 px frame, no rounded rects, no scale, whole-pixel positions', () => {
    const r = rig({ npcs: { sara: { x: 100.4, y: 100.6, room: 'hall' } } });
    r.bubbles.say('sara', LONG);
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    // This rig has no bitmapText, so the helper's fallback canvas Text is used: GNF at its native size
    // (the bitmap path is tested in pixel-text.test.mjs)
    assert.ok(bb.text.pixelFallback);
    assert.equal(bb.text.style.fontFamily, SPEECH_FONT);
    assert.match(SPEECH_FONT, /GNF/);
    assert.equal(bb.text.style.fontSize, '10.24px');
    assert.ok(Number.isInteger(SPEECH_FONT_SCALE));
    const names = bb.g.calls.map(c => c[0]);
    for (const banned of ['fillRoundedRect', 'strokeRoundedRect', 'fillTriangle', 'lineBetween']) {
        assert.ok(!names.includes(banned), `${banned} called`);
    }
    const rects = bb.g.calls.filter(c => c[0] === 'fillRect');
    assert.ok(rects.length >= 5);
    for (const [, x, y, w, h] of rects) for (const v of [x, y, w, h]) assert.ok(Number.isInteger(v), `fractional rect ${[x, y, w, h]}`);
    // The four frame edges are BORDER_PX (2) thick
    assert.equal(BORDER_PX, 2);
    const edges = rects.slice(1, 5);
    assert.deepEqual(edges.map(([, , , w, h]) => Math.min(w, h)), [2, 2, 2, 2]);
    for (const lc of bb.g.calls.filter(c => c[0] === 'lineStyle')) assert.equal(lc[1], 2);
    assert.ok(Number.isInteger(bb.box.x) && Number.isInteger(bb.box.y));
    assert.ok(Number.isInteger(bb.text.x) && Number.isInteger(bb.text.y));
    assert.equal(bb.box.calls.filter(c => c[0] === 'setScale').length, 0);
});

test('no Text is made before the pixel font has loaded', async () => {
    const r = rig();
    let resolve;
    window.canvasFontsReady = new Promise(res => { resolve = res; });
    const b = new NpcWorldBubbles({ now: r.clock.now });
    window.npcWorldBubbles = b;
    let made = 0;
    const orig = r.scene.add.text;
    r.scene.add.text = (...a) => { made++; return orig(...a); };
    b.say('sara', 'Hello.');
    b.update();
    assert.equal(made, 0);
    resolve(true);
    await tick();
    b.update();
    assert.equal(made, 1);
    delete window.canvasFontsReady;
});

test('source: the pulsing talk icon and its 1.25 scale are gone from npc-barks', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    assert.ok(!/_showBarkIcon|barkIcon/.test(src));
    // The old icon's tween: scaleX/scaleY { from: 1, to: 1.25 } (any other 1.25 is allowed)
    assert.ok(!/scale[XY]?\s*:\s*\{[^}]*\bto\s*:\s*1\.25/.test(src), 'the 1.25 scale tween is back');
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.ok(!/barkIcon/.test(inter));
});

// ---- review round 1 ----

test('R1 M1: routeBark gives the toast for an NPC off camera', () => {
    const base = { npcType: 'person', hasSprite: true, npcRoom: 'hall', playerRoom: 'hall', dark: false, minigameOpen: false };
    assert.equal(routeBark({ ...base, onCamera: true }), 'bubble');
    assert.equal(routeBark({ ...base, onCamera: false }), 'toast');
    assert.equal(routeBark(base), 'bubble', 'no camera fact (no camera yet) counts as on camera');
});

test('R1 M1: onCamera wants the head anchor a margin inside the world view', () => {
    const view = { x: 0, y: 0, width: 320, height: 240 };
    assert.equal(onCamera({ x: 160, y: 120 }, view), true);
    assert.equal(onCamera({ x: CAMERA_MARGIN - 1, y: 120 }, view), false);
    assert.equal(onCamera({ x: 160, y: 240 - CAMERA_MARGIN + 1 }, view), false);
    assert.equal(onCamera({ x: 160, y: -50 }, view), false);
    assert.equal(onCamera({ x: 160, y: 120 }, null), true);
});

test('R1 M1: a bark from an NPC in the room but off camera is a toast; leaving the camera mid-line hands on the rest', async () => {
    const view = { x: 0, y: 0, width: 400, height: 300 };
    // Sara's head anchor sits at y 100 - 40 - 6 = 54, inside; Len is 600 px away, same room
    const r = rig({ npcs: { sara: { x: 100, y: 100, room: 'hall' }, len: { x: 700, y: 100, room: 'hall' } }, view });
    const sys = barkSystem();
    assert.equal(r.bubbles.viewFacts('len').onCamera, false);
    assert.equal(r.bubbles.viewFacts('sara').onCamera, true);
    await sys._renderBark({ npcId: 'len', npcName: 'Len', message: 'Over here.' });
    assert.deepEqual(toasts(), ['Len: Over here.']);
    assert.equal(r.bubbles.hasLine('len'), false);
    assert.equal(sys.lastRoute.route, 'toast');

    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: LONG });
    const st = r.bubbles.says.get('sara');
    r.bubbles.update();
    assert.ok(r.bubbles.bubbles.get('sara').box.visible);
    view.x = 500;   // the camera pans away; Sara stays in the room
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('sara'), false);
    assert.deepEqual(toasts(), ['Len: Over here.', `Sara: ${pagesText(st.pages)}`]);
});

test('R1 m1: the bubble shows authored " -- " as the toast does; the voice gets the raw text', async () => {
    const r = rig();
    const sys = barkSystem();
    const spoken = [];
    sys._speakBark = async (id, text) => { spoken.push(text); return null; };
    const raw = 'Badge first -- then the door.';
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: raw, useTTS: true });
    r.bubbles.update();
    const shown = r.bubbles.bubbles.get('sara').text.text.replace(/\n/g, ' ');
    assert.equal(shown, displayDashes(raw));
    assert.notEqual(shown, raw, 'displayDashes changed the line');
    assert.deepEqual(spoken, [raw]);
});

test('R1 m2: a voiced bark re-times its later pages to the audio length (_renderBark wires setAudioMs)', async () => {
    const r = rig();
    const sys = barkSystem();
    const calls = [];
    sys._speakBark = async (id, text) => { calls.push([id, text]); return 12000; };
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: LONG, useTTS: true });
    await tick();
    assert.deepEqual(calls, [['sara', LONG]], 'voiced once, the whole line');
    const st = r.bubbles.says.get('sara');
    assert.equal(st.audioMs, 12000);
    const want = pageTimes(st.pages, 12000 + AUDIO_TAIL_MS);
    for (let i = 1; i < st.pages.length; i++) assert.equal(st.times[i], want[i], `page ${i + 1} re-timed`);
});

test('R1 m2: an odd measured width is rounded up to even, so the frame sits on whole pixels', () => {
    const r = rig();
    // Mock width: 7 px a character. "abc" = 21, + slack, padding and border: odd before rounding
    const raw = 21 + TEXT_RIGHT_SLACK + 4 * 2 + BORDER_PX * 2;
    assert.equal(raw % 2, 1, 'the fixture must give an odd width');
    r.bubbles.say('sara', 'abc');
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    assert.equal(bb.w, raw + 1);
    for (const [, x, y, w, h] of bb.g.calls.filter(c => c[0] === 'fillRect')) {
        for (const v of [x, y, w, h]) assert.ok(Number.isInteger(v), `fractional rect ${[x, y, w, h]}`);
    }
    assert.ok(Number.isInteger(bb.text.x));
});

test('R1 n1: the measured text width gets the right-hand slack, so both side gaps match', () => {
    const r = rig();
    r.bubbles.say('sara', 'abcd');   // 28 px of mock text: even, no rounding
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    assert.ok(TEXT_RIGHT_SLACK > 0);
    assert.equal(bb.w, 28 + TEXT_RIGHT_SLACK + 4 * 2 + BORDER_PX * 2);
});

test('R1 m3: a bubble plays no phone sound, voiced or not; a toast still does', async () => {
    const r = rig({ npcs: { sara: { x: 100, y: 100, room: 'hall' }, len: { x: 0, y: 0, room: 'lobby' } } });
    const sys = barkSystem();
    let beeps = 0;
    sys.playBarkSound = () => { beeps++; };
    sys.ttsManagers.set('sara', { play: async () => null, stop() {} });   // no audio (keyless)
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'No voice.' });
    assert.ok(r.bubbles.hasLine('sara'));
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'Voice failed.', useTTS: true });
    assert.equal(beeps, 0, 'no phone sound over a bubble');
    await sys._renderBark({ npcId: 'len', npcName: 'Len', message: 'From the lobby.' });
    assert.equal(beeps, 1, 'the toast keeps its sound');
});

test('R1 n5: a bark bubble whose stillValid() stops holding closes, with no remainder toast', async () => {
    const r = rig();
    const sys = barkSystem();
    let valid = true;
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: LONG, stillValid: () => valid });
    r.bubbles.update();
    assert.ok(r.bubbles.hasLine('sara'));
    valid = false;
    r.clock.advance(300);
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('sara'), false);
    assert.equal(r.bubbles.bubbles.get('sara').box.visible, false);
    assert.deepEqual(toasts(), []);
    assert.equal(r.bubbles.log.at(-1).event, 'stale');
});

const rectOf = (bb) => ({ x: bb.box.x + bb.layout.dx - bb.w / 2, y: bb.box.y - bb.layout.lift - 4 - bb.h, w: bb.w, h: bb.h + 4 });
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('R1 n4: two NPCs a tile apart: their bubbles do not overlap, and neither covers the player\'s head', () => {
    // The player stands just above Dana, so a centred bubble over Dana would cover his head
    const r = rig({ npcs: { dana: { x: 100, y: 100, room: 'hall' }, lee: { x: 132, y: 100, room: 'hall' } }, player: { x: 100, y: 60 } });
    r.bubbles.say('dana', 'Not with you behind me. Ask at reception.');
    r.bubbles.say('lee', "Morning. Printer's jammed again.");
    r.bubbles.update();
    const a = r.bubbles.bubbles.get('dana'), b = r.bubbles.bubbles.get('lee');
    assert.ok(a.box.visible && b.box.visible);
    const ra = rectOf(a), rb = rectOf(b);
    assert.equal(hit(ra, rb), false, `bubbles overlap: ${JSON.stringify([ra, rb])}`);
    const head = r.bubbles._playerHead();
    assert.equal(hit(ra, head), false, 'Dana\'s bubble covers the player\'s head');
    assert.equal(hit(rb, head), false, 'Lee\'s bubble covers the player\'s head');
    // The tail still points at each head: the container sits at the anchor, the body slides
    for (const [bb, x] of [[a, 100], [b, 132]]) assert.equal(bb.box.x, x);
    // Whole pixels after the move, and a lifted bubble draws its stem in whole pixels too
    for (const bb of [a, b]) for (const [, x, y, w, h] of bb.g.calls.filter(c => c[0] === 'fillRect')) {
        for (const v of [x, y, w, h]) assert.ok(Number.isInteger(v));
    }
    // Stable: the next frame keeps the same places
    const before = [a.layout, b.layout].map(l => ({ ...l }));
    r.bubbles.update();
    assert.deepEqual([a.layout, b.layout], before);
});

test('R1 n4: placeBubble slides sideways first and lifts only when both sides are taken', () => {
    const at = { x: 100, y: 100 };
    assert.deepEqual(placeBubble(at, 60, 20, []).dx, 0);
    const left = placeBubble(at, 60, 20, [{ x: 115, y: 70, w: 20, h: 30 }]);   // in the way on the right
    assert.ok(left.dx < 0, 'slid left');
    assert.equal(left.lift, 0);
    // A small thing across the top of the tail: a short lift clears it
    const low = [{ x: 60, y: 92, w: 80, h: 6 }];
    const up = placeBubble(at, 60, 20, low);
    assert.ok(up.lift > 0 && up.lift <= MAX_LIFT && !up.beside, JSON.stringify(up));
    assert.equal(hit(up.rect, low[0]), false);
});

test('R2 n3: the lift is capped at MAX_LIFT; past it the bubble sits beside the head instead', () => {
    const at = { x: 100, y: 100 };
    const wall = [{ x: 0, y: 60, w: 300, h: 40 }];
    const p = placeBubble(at, 60, 20, wall);
    assert.equal(p.beside, true, 'beside, not a 42 px stem');
    assert.equal(hit(p.rect, wall[0]), false);
    // The player's head just above (2 px into the tail): never a lift past the cap
    const head = { x: 90, y: 62, w: 20, h: 22, soft: true };
    for (const w of [40, 60, 120]) {
        const q = placeBubble(at, w, 20, [head]);
        assert.ok(q.beside || q.lift <= MAX_LIFT, `w ${w}: ${JSON.stringify(q)}`);
    }
});

test('R2 m1: no place clear of other bubbles gives null; a soft rect (a head) is covered only as a last resort', () => {
    const at = { x: 100, y: 100 };
    const all = [{ x: -1000, y: -1000, w: 3000, h: 3000 }];
    assert.equal(placeBubble(at, 60, 20, all), null, 'every place covers a bubble: none');
    const soft = placeBubble(at, 60, 20, [{ ...all[0], soft: true }]);
    assert.ok(soft, 'a head everywhere: covered, since nothing better exists');
});

// A Text whose canvas holds smoothed glyph pixels: 4 wide, 2 high; ink in columns 1 and 2
function fakeText(alphas, w, h) {
    const data = new Uint8ClampedArray(w * h * 4);
    alphas.forEach((a, i) => { data[i * 4] = 9; data[i * 4 + 3] = a; });
    const uploads = [];
    const canvas = { width: w, height: h, getContext: () => ({ getImageData: () => ({ data }), putImageData() {} }) };
    return { data, uploads, t: { canvas, frame: { source: { glTexture: 'old' } },
        renderer: { gl: {}, canvasToTexture: (c, tex, flip) => { uploads.push([tex, flip]); return 'new'; } } } };
}

test('main-19: crispText leaves every text pixel clear or solid, re-uploads the texture and gives the ink bounds', () => {
    const { data, uploads, t } = fakeText([0, 200, 90, 0, 0, 255, 127, 0], 4, 2);
    const ink = crispText(t, 0x1b2a41);
    for (let i = 3; i < data.length; i += 4) assert.ok(data[i] === 0 || data[i] === 255, `alpha ${data[i]}`);
    assert.deepEqual([...data.slice(4, 8)], [0x1b, 0x2a, 0x41, 255], 'solid pixels take the text colour');
    assert.deepEqual(ink, { left: 1, right: 1, top: 0, bottom: 1 });
    assert.deepEqual(uploads, [['old', true]]);
    assert.equal(t.frame.glTexture, 'new');
    assert.equal(crispText({}), null, 'no canvas: nothing to do');
});

test('main-19 / R1 n1: with readable ink the frame pads from the glyphs, the same on both sides', () => {
    const r = rig();
    const orig = r.scene.add.text;
    r.scene.add.text = (...a) => {
        const o = orig(...a);
        // 40 px canvas; ink from column 1 to column 30 (the measured advance would say 40)
        const alphas = new Array(40 * 2).fill(0);
        alphas[1] = 255; alphas[30] = 255;
        Object.assign(o, fakeText(alphas, 40, 2).t);
        return o;
    };
    r.bubbles.say('sara', 'abc');
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    assert.equal(bb.w, 30 + 4 * 2 + BORDER_PX * 2);
    const bodyLeft = bb.layout.dx - bb.w / 2;
    const inkLeft = bb.text.x + 1, inkRight = bb.text.x + 30;
    assert.equal(inkLeft - (bodyLeft + BORDER_PX), 4, 'left gap');
    assert.equal((bodyLeft + bb.w - BORDER_PX) - (inkRight + 1), 4, 'right gap');
});

test('R1 M1: a bubble stays inside the camera view: slid in from a side edge, beside the head at the top edge', () => {
    const view = { x: 0, y: 0, width: 400, height: 300 };
    const inside = (r) => r.x >= 0 && r.x + r.w <= 400 && r.y >= 0 && r.y + r.h <= 300;
    // Near the left edge: centred would leave the view, so it slides right, tail still on the head
    const left = placeBubble({ x: 30, y: 150 }, 100, 40, [], { view });
    assert.ok(left.dx > 0 && inside(left.rect) && !left.beside);
    // Near the top: nothing above the head fits, so it sits beside it, lowered into the view
    const top = placeBubble({ x: 200, y: 30 }, 100, 40, [], { view });
    assert.equal(top.beside, true);
    assert.ok(inside(top.rect), JSON.stringify(top.rect));
    assert.ok(top.rect.x >= 200 + 10 || top.rect.x + top.rect.w <= 200 - 10, 'body and pointer clear of the NPC\'s head');
    assert.ok(top.side === -1 || top.side === 1);
    assert.equal(top.pointY, HEAD_POINT_DY);
});

test('R1 M1: live layer: an NPC at the top of the view gets a whole bubble on screen, with no tail', () => {
    const view = { x: 0, y: 40, width: 400, height: 300 };
    const r = rig({ npcs: { sara: { x: 200, y: 100, room: 'hall' } }, view, player: { x: 200, y: 250 } });
    r.bubbles.say('sara', 'Not with you behind me. Ask at reception.');
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    assert.ok(bb.box.visible);
    assert.equal(bb.layout.beside, true);
    const top = bb.box.y - bb.layout.lift - 4 - bb.h;
    assert.ok(top >= view.y, `bubble top ${top} above the view`);
    const rects = bb.g.calls.filter(c => c[0] === 'fillRect');
    // R2 m1: fill, four edges and the side pointer (seven whole-pixel pieces) at head height
    assert.equal(rects.length, 5 + 7);
    for (const [, x, y, w, h] of rects) for (const v of [x, y, w, h]) assert.ok(Number.isInteger(v));
    const pointer = rects.slice(5);
    const ys = pointer.flatMap(([, , y, , h]) => [y, y + h]);
    assert.ok(Math.min(...ys) >= HEAD_POINT_DY - 4 && Math.max(...ys) <= HEAD_POINT_DY + 4, 'the pointer sits at head height');
    const xs = pointer.flatMap(([, x, , w]) => [x, x + w]);
    const tip = bb.layout.side < 0 ? Math.max(...xs) : Math.min(...xs);
    assert.ok(Math.abs(tip) >= 10 && Math.abs(tip) <= 14, `the tip points at the head, stopping short of it: ${tip}`);
});

// ---- R2 ----

test('R2 m1: two speakers 40 px apart at the top of the view: no overlap, each pointer at its own head', () => {
    const view = { x: 0, y: 40, width: 400, height: 300 };
    const r = rig({ npcs: { dana: { x: 160, y: 100, room: 'hall' }, lee: { x: 200, y: 100, room: 'hall' } }, view, player: { x: 180, y: 260 } });
    r.bubbles.say('dana', 'Not with you behind me. Ask at reception.');
    r.bubbles.say('lee', "Morning. Printer's jammed again.");
    r.bubbles.update();
    const shown = ['dana', 'lee'].filter(id => r.bubbles.bubbles.get(id)?.box.visible);
    const toasted = ['dana', 'lee'].filter(id => !r.bubbles.hasLine(id));
    assert.equal(shown.length + toasted.length, 2, 'each line is a bubble or went to the toast');
    if (shown.length === 2) {
        const [a, b] = shown.map(id => r.bubbles.bubbles.get(id));
        assert.equal(hit(a.rect, b.rect), false, `bubbles overlap: ${JSON.stringify([a.rect, b.rect])}`);
    }
    for (const id of shown) {
        const bb = r.bubbles.bubbles.get(id);
        const headX = r.sprites[id].x;
        assert.ok(bb.rect.y >= view.y, `${id}: inside the view`);
        // The tail or pointer belongs to this NPC: the container sits on its head
        assert.equal(bb.box.x, headX);
        if (bb.layout.beside) {
            const bodyLeft = headX + bb.layout.dx - bb.w / 2;
            assert.ok(bb.layout.side < 0 ? bodyLeft + bb.w <= headX - 12 : bodyLeft >= headX + 12, `${id}: body clear of its head`);
        }
    }
    // No bubble hides the other speaker's head
    for (const id of shown) for (const other of ['dana', 'lee'].filter(o => o !== id)) {
        const a = npcIconAnchor(r.sprites[other]);
        const head = { x: a.x - 10, y: a.y, w: 20, h: 22 };
        assert.equal(hit(r.bubbles.bubbles.get(id).rect, head), false, `${id}'s bubble covers ${other}'s head`);
    }
    // Stable next frame
    const before = shown.map(id => ({ ...r.bubbles.bubbles.get(id).layout }));
    r.bubbles.update();
    assert.deepEqual(shown.map(id => r.bubbles.bubbles.get(id).layout), before);
});

test('R2 m1 retake: a bubble may cover the player\'s head but never another speaker\'s', () => {
    // Lee nearer the player, Dana 40 px to his left, both at the top; the player just right of Lee
    const view = { x: 0, y: 40, width: 400, height: 300 };
    const r = rig({ npcs: { dana: { x: 160, y: 100, room: 'hall' }, lee: { x: 200, y: 100, room: 'hall' } }, view, player: { x: 236, y: 100 } });
    r.bubbles.say('lee', "Morning. Printer's jammed again.");
    r.bubbles.say('dana', 'Not with you behind me. Ask at reception.');
    r.bubbles.update();
    const lee = r.bubbles.bubbles.get('lee');
    assert.ok(lee.box.visible);
    const a = npcIconAnchor(r.sprites.dana);
    assert.equal(hit(lee.rect, { x: a.x - 10, y: a.y, w: 20, h: 22 }), false, 'Lee\'s bubble leaves Dana\'s head clear');
    const dana = r.bubbles.bubbles.get('dana');
    if (dana?.box.visible) assert.equal(hit(dana.rect, lee.rect), false);
    else assert.equal(r.bubbles.hasLine('dana'), false, 'Dana\'s line went to the toast');
});

test('R2 m1: a bark with no clear place goes to the toast from the page on screen', async () => {
    const r = rig();
    const sys = barkSystem();
    r.bubbles._hudRects = () => [{ x: -1000, y: -1000, w: 3000, h: 3000, hud: true }];
    await sys._renderBark({ npcId: 'sara', npcName: 'Sara', message: 'Not with you behind me.' });
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('sara'), false);
    assert.equal(r.bubbles.log.some(e => e.event === 'no-room'), true);
    assert.deepEqual(toasts(), ['Sara: Not with you behind me.']);
});

test('R2 m2: bubbles keep off the HUD panels (Objectives at the top left), read from the DOM through the camera', () => {
    const view = { x: 0, y: 0, width: 400, height: 300 };
    const r = rig({ npcs: { dana: { x: 60, y: 120, room: 'hall' } }, view, player: { x: 200, y: 260 } });
    document.body.innerHTML = '<div class="objectives-panel"></div><div id="inventory-container"></div>';
    const panel = document.querySelector('.objectives-panel');
    // The canvas is drawn at 2x: 800x600 on screen for a 400x300 view
    window.game = { canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) } };
    panel.getBoundingClientRect = () => ({ left: 20, top: 14, width: 200, height: 120 });   // world 10..110, 7..67
    document.querySelector('#inventory-container').getBoundingClientRect = () => ({ left: 0, top: 520, width: 800, height: 80 });
    const hud = r.bubbles._hudRects(view);
    assert.equal(hud.length, 2);
    assert.deepEqual(hud[0], { x: 8, y: 5, w: 104, h: 64, hud: true });
    r.bubbles.say('dana', 'Not with you behind me. Ask at reception.');
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('dana');
    assert.ok(bb.box.visible);
    for (const h of hud) assert.equal(hit(bb.rect, h), false, `under the HUD: ${JSON.stringify([bb.rect, h])}`);
    // A hidden panel is not in the way
    panel.style.display = 'none';
    r.clock.advance(500);
    assert.equal(r.bubbles._hudRects(view).length, 1);
    delete window.game;
});

test('R2 n2: the pass runs in the camera\'s preRender, after the camera has moved, once per stepped frame', () => {
    const r = rig({ view: { x: 0, y: 0, width: 400, height: 300 } });
    let passes = 0;
    const seen = [];
    r.bubbles.update = () => { passes++; seen.push(cam.worldView.x); };
    const cam = { worldView: { x: 0, y: 0, width: 400, height: 300 },
        preRender() { this.worldView = { ...this.worldView, x: this.worldView.x + 5 }; } };
    assert.equal(hookCameraPass(r.bubbles, cam), true);
    assert.equal(hookCameraPass(r.bubbles, cam), true, 'wrapped once');
    cam.preRender();
    assert.equal(passes, 0, 'no postupdate this frame (scene paused): no pass');
    r.bubbles._due = true;   // postupdate ran
    cam.preRender();
    assert.equal(passes, 1);
    assert.deepEqual(seen, [10], 'the pass saw this frame\'s view, after the camera moved');
    cam.preRender();
    assert.equal(passes, 1, 'once per frame');
    assert.equal(hookCameraPass(r.bubbles, null), false);
});

test('R2 m3: follow-up pages come after the line, timed for reading; the voice re-times only the line', () => {
    const r = rig();
    const HINT = 'Store B needs a staff badge. Reception issues them to visitors with an escort.';
    const h = r.bubbles.say('sara', 'Not with you behind me. Ask at reception.', { followUp: HINT, tag: 'door_gate_denied' });
    const st = h.state;
    assert.equal(st.linePages, 1);
    assert.deepEqual(st.pages.slice(1), pageLine(HINT));
    assert.deepEqual(st.times.slice(1), followUpTimes(pageLine(HINT)));
    const hintTimes = st.times.slice(1);
    h.setAudioMs(9000);
    assert.deepEqual(st.times.slice(1), hintTimes, 'the hint is not stretched to the audio');
    // Leaving view on the line's page hands the hint on too
    window.currentPlayerRoom = 'lobby';
    const rest = [];
    st.onRemainder = (t) => rest.push(t);
    r.bubbles.update();
    assert.equal(rest[0], pagesText(st.pages));
    assert.ok(rest[0].endsWith('escort.'));
});

test('R2 n1: closeTagged closes the bubbles answering that event, with no remainder', () => {
    const r = rig({ npcs: { dana: { x: 100, y: 100, room: 'hall' }, lee: { x: 220, y: 100, room: 'hall' } } });
    const rest = [];
    r.bubbles.say('dana', 'Not with you behind me.', { tag: 'door_gate_denied', onRemainder: (t) => rest.push(t) });
    r.bubbles.say('lee', 'Morning.', { tag: 'test_bark_short' });
    assert.deepEqual(r.bubbles.closeTagged('door_gate_denied'), ['dana']);
    assert.equal(r.bubbles.hasLine('dana'), false);
    assert.equal(r.bubbles.hasLine('lee'), true);
    assert.deepEqual(rest, []);
    assert.deepEqual(r.bubbles.closeTagged(null), []);
});
