// UX feedback round slice 5: barks from a person NPC in view show as a speech bubble over them
// (npc-world-bubbles.js say()), with no pulsing talk icon and no toast; the toast stays for NPCs
// out of view and phone contacts. Long lines page (at most 3 lines a page) timed to the audio;
// leaving view sends the rest to the toast; at most MAX_BUBBLES bubbles, barks before chatter.
// The bubble is pixel art: VT323, 2 px whole-pixel frame, no rounded rects.
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
const { NpcWorldBubbles, pageLine, pagesText, pageTimes, lineTotalMs, readingMs, wrapLines,
    MAX_BUBBLES, PAGE_LINES, LINE_CHARS, PAGE_MIN_MS, AUDIO_TAIL_MS, SPEECH_FONT, SPEECH_FONT_PX, BORDER_PX } = B;

// The longest authored bark (lab_physical_pentest, 150 characters)
const LONG = "That card's just a printed code — nothing runs from it. It only matters if someone scans it and signs in. The planted BadUSB is still your core route.";

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

function rig({ playerRoom = 'hall', npcs = { sara: { x: 100, y: 100, room: 'hall' } }, player = { x: 100, y: 140 } } = {}) {
    const tweens = [];
    const scene = { add: {}, textures: { exists: () => true }, load: { image() {}, once() {}, isLoading: () => true, start() {} },
        tweens: { add: (t) => { tweens.push(t); return { stop() {} }; } } };
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
    for (let i = 0; i < 5; i++) npcs[`n${i}`] = { x: 100 + i * 10, y: 100, room: 'hall' };
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

test('pixel art: VT323 at whole pixels, 2 px frame, no rounded rects, no scale, whole-pixel positions', () => {
    const r = rig({ npcs: { sara: { x: 100.4, y: 100.6, room: 'hall' } } });
    r.bubbles.say('sara', LONG);
    r.bubbles.update();
    const bb = r.bubbles.bubbles.get('sara');
    assert.equal(bb.text.style.fontFamily, SPEECH_FONT);
    assert.match(SPEECH_FONT, /VT323/);
    assert.equal(bb.text.style.fontSize, `${SPEECH_FONT_PX}px`);
    assert.ok(Number.isInteger(SPEECH_FONT_PX));
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
    assert.ok(!/_showBarkIcon|barkIcon|1\.25/.test(src));
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.ok(!/barkIcon/.test(inter));
});
