// UX feedback round slice 5, review round 3: a gate's lockedHint in the guard's bubble is never
// lost (an early close shows it as a toast of its own; a replacing line of hers carries it), the
// bubbles sit above the room lighting, the HUD cache is cleared on resize, more HUD keep-outs,
// balanced pages, bubbles on screen placed before new ones, and knot-bark stories preloaded.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/ux-bark-bubbles-r3.test.mjs
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

const { default: NPCBarkSystem } = await imp('systems/npc-barks.js');
const B = await imp('systems/npc-world-bubbles.js');
const { NpcWorldBubbles, pageLine, pagesText, wrapLines, pickShown, followUpLeft, installNpcWorldBubbles, BUBBLE_DEPTH, HUD_SELECTORS,
    PAGE_LINES, LINE_CHARS } = B;
const { LIGHT_DEPTH } = await imp('utils/constants.js');
const { default: NPCManager } = await imp('systems/npc-manager.js');
const { default: NPCEventDispatcher } = await imp('systems/npc-events.js');

const LINE = 'Not with you behind me. Ask at reception.';
const HINT = 'Store B needs a staff badge. Reception issues them to visitors with an escort.';
const OTHER = 'Store A is for the night shift only.';

function mk(scene, kind) {
    const o = { kind, x: 0, y: 0, visible: true, data: {}, scene, text: '', depth: 0,
        get width() { return o.kind === 'text' ? Math.max(...String(o.text).split('\n').map(l => l.length), 0) * 7 : 16; },
        get height() { return o.kind === 'text' ? String(o.text).split('\n').length * 16 : 16; },
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture() { return o; }, setText(t) { o.text = t; return o; }, setDepth(d) { o.depth = d; return o; },
        setData(k, v) { o.data[k] = v; return o; }, getData(k) { return o.data[k]; } };
    for (const m of ['clear', 'fillStyle', 'lineStyle', 'fillRect', 'strokeRect']) o[m] = () => o;
    return o;
}

function rig({ npcs = { dana: { x: 100, y: 100 } }, player = { x: 100, y: 200 }, view = null } = {}) {
    document.body.innerHTML = '';
    const scene = { add: {}, textures: { exists: () => true } };
    if (view) scene.cameras = { main: { worldView: view } };
    for (const k of ['text', 'image', 'graphics', 'container']) scene.add[k] = () => mk(scene, k);
    const sprites = [];
    for (const [id, n] of Object.entries(npcs)) {
        sprites.push({ npcId: id, x: n.x, y: n.y, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
            getTopCenter() { return { x: this.x, y: this.y - 40 }; } });
    }
    window.rooms = { hall: { npcSprites: sprites } };
    window.currentPlayerRoom = 'hall';
    window.player = player;
    window.MinigameFramework = { currentMinigame: null };
    window.lightingSystem = null;
    window.npcNeedsSystem = null;
    window.npcBehaviorManager = null;
    let t = 0;
    const clock = { now: () => t, advance: (ms) => { t += ms; } };
    const bubbles = new NpcWorldBubbles({ now: clock.now, fontsReady: true });
    window.npcWorldBubbles = bubbles;
    return { scene, bubbles, clock };
}

function barkSystem() {
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id[0].toUpperCase() + id.slice(1), npcType: 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.playBarkSound = () => {};
    return sys;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 6; i++) await tick(); };
const toastEls = () => [...document.querySelectorAll('.npc-bark')];
const toasts = () => toastEls().map(e => e.querySelector('.npc-bark-text').textContent);
const count = (s, sub) => s.split(sub).length - 1;
/** Run the bubble's pages on until the first follow-up page is on screen. */
const toHintPage = (r, st) => {
    while (st.page < st.linePages) { r.clock.advance(st.times[st.page]); r.bubbles.update(); }
};

// ---- m1: stillValid or an early close ----

test('R3 m1: stillValid closes her bubble on the line page: the whole hint shows as a toast of its own, once, with no stillValid', async () => {
    const r = rig();
    const sys = barkSystem();
    let valid = true;
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, stillValid: () => valid, eventPattern: 'door_gate_denied' });
    r.bubbles.update();
    assert.ok(r.bubbles.hasLine('dana'));
    assert.deepEqual(toasts(), []);
    valid = false;
    r.clock.advance(300);
    r.bubbles.update();
    await settle();
    assert.equal(r.bubbles.hasLine('dana'), false);
    assert.deepEqual(toasts(), [`Dana: ${HINT}`], 'the hint alone, not her line again');
    assert.equal(toastEls()[0]._stillValid, undefined, 'the failed check does not close the hint toast too');
    assert.ok(r.bubbles.log.some(e => e.event === 'stale'));
    // Later frames do not show it again
    r.clock.advance(5000);
    r.bubbles.update();
    await settle();
    assert.equal(toasts().length, 1);
});

test('R3 m1: stillValid closes her bubble on the hint\'s own page: the hint from that page on, once', async () => {
    const r = rig();
    const sys = barkSystem();
    let valid = true;
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, stillValid: () => valid });
    r.bubbles.update();
    const st = r.bubbles.says.get('dana');
    toHintPage(r, st);
    assert.equal(st.page, st.linePages, 'the first hint page is on screen');
    valid = false;
    r.clock.advance(300);
    r.bubbles.update();
    await settle();
    assert.deepEqual(toasts(), [`Dana: ${HINT}`]);
});

test('R3 m1: a bubble with no follow-up still closes quietly on stillValid', async () => {
    const r = rig();
    const sys = barkSystem();
    let valid = true;
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, stillValid: () => valid });
    r.bubbles.update();
    valid = false;
    r.clock.advance(300);
    r.bubbles.update();
    await settle();
    assert.deepEqual(toasts(), []);
});

test('R3 m1: close() on the handle hands the unread hint on; a finished bubble does not', () => {
    const r = rig();
    const lost = [];
    const h = r.bubbles.say('dana', LINE, { followUp: HINT, onFollowUpLost: (t) => lost.push(t) });
    h.close();
    assert.deepEqual(lost, [HINT]);
    const h2 = r.bubbles.say('dana', LINE, { followUp: HINT, onFollowUpLost: (t) => lost.push(t) });
    const st = h2.state;
    for (let i = 0; i < 20 && r.bubbles.hasLine('dana'); i++) { r.clock.advance(st.times[st.page] ?? 1000); r.bubbles.update(); }
    assert.equal(r.bubbles.hasLine('dana'), false);
    assert.deepEqual(lost, [HINT], 'read to the end: nothing handed on');
});

// ---- m1: another line of hers replaces it ----

test('R3 m1: another line of hers replaces the bubble on the line page: the hint comes after her new line, once', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT });
    r.bubbles.update();
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: 'Mind the cables there.' });
    const st = r.bubbles.says.get('dana');
    assert.equal(st.pages[0], 'Mind the cables there.');
    assert.equal(pagesText(st.pages.slice(st.linePages)), HINT);
    assert.equal(count(pagesText(st.pages), 'staff badge'), 1);
    assert.ok(r.bubbles.log.some(e => e.event === 'replaced'));
    await settle();
    assert.deepEqual(toasts(), [], 'no toast: the hint rides in her new bubble');
});

test('R3 m1: replaced while the hint page is on screen: the hint again after her new line, once', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT });
    r.bubbles.update();
    toHintPage(r, r.bubbles.says.get('dana'));
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: 'Mind the cables there.' });
    const st = r.bubbles.says.get('dana');
    assert.equal(pagesText(st.pages.slice(st.linePages)), HINT);
    await settle();
    assert.deepEqual(toasts(), []);
});

test('R3 m1: a new refusal with the same hint replacing her bubble shows the hint once, not twice', () => {
    const r = rig();
    r.bubbles.say('dana', LINE, { followUp: HINT });
    const st = r.bubbles.say('dana', LINE, { followUp: HINT }).state;
    assert.equal(count(pagesText(st.pages), 'staff badge'), 1);
});

test('R3 m1: replaced by a line with another hint: the old hint, then the new one', () => {
    const r = rig();
    r.bubbles.say('dana', LINE, { followUp: HINT });
    const st = r.bubbles.say('dana', LINE, { followUp: OTHER }).state;
    assert.equal(pagesText(st.pages.slice(st.linePages)), `${HINT} ${OTHER}`);
});

test('R3 m1 (R4 n1): a hint on its last page is carried into her next line whole, never from mid-sentence', () => {
    const r = rig();
    const st0 = r.bubbles.say('dana', LINE, { followUp: HINT }).state;
    // Past the line page and the first hint page: only the last hint page is unread
    toHintPage(r, st0);
    r.clock.advance(st0.times[st0.page]);
    r.bubbles.update();
    assert.equal(st0.page, st0.pages.length - 1, 'the last hint page is on screen');
    const left = followUpLeft(st0);
    const st = r.bubbles.say('dana', 'Mind the cables there.').state;
    assert.equal(pagesText(st.pages.slice(st.linePages)), left);
    assert.equal(left, HINT);
});

// ---- m1: closeTagged ----

test('R3 m1: closeTagged with the same hint closes quietly; with another gate\'s hint it hands hers on', () => {
    const r = rig();
    const lost = [];
    r.bubbles.say('dana', LINE, { followUp: HINT, tag: 'door_gate_denied', onFollowUpLost: (t) => lost.push(t) });
    r.bubbles.closeTagged('door_gate_denied', { followUp: HINT });
    assert.deepEqual(lost, []);
    r.bubbles.say('dana', LINE, { followUp: HINT, tag: 'door_gate_denied', onFollowUpLost: (t) => lost.push(t) });
    r.bubbles.closeTagged('door_gate_denied', { followUp: OTHER });
    assert.deepEqual(lost, [HINT]);
    r.bubbles.say('dana', LINE, { followUp: HINT, tag: 'door_gate_denied', onFollowUpLost: (t) => lost.push(t) });
    r.bubbles.closeTagged('door_gate_denied');
    assert.deepEqual(lost, [HINT, HINT], 'a notification with no hint: hers is handed on');
});

test('R3 m1: leaving view still sends line and hint together as the remainder (not twice)', () => {
    const r = rig();
    const lost = [], rest = [];
    r.bubbles.say('dana', LINE, { followUp: HINT, onFollowUpLost: (t) => lost.push(t), onRemainder: (t) => rest.push(t) });
    window.currentPlayerRoom = 'lobby';
    r.bubbles.update();
    assert.deepEqual(lost, []);
    assert.equal(rest.length, 1);
    assert.ok(rest[0].endsWith('escort.'));
});

// ---- m2: above the lighting ----

test('R3 m2: bubbles are drawn above the room lighting, below the overlay markers', () => {
    const r = rig();
    assert.equal(BUBBLE_DEPTH, LIGHT_DEPTH + 3);
    r.bubbles.say('dana', LINE);
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('dana').box.depth, LIGHT_DEPTH + 3);
    assert.ok(BUBBLE_DEPTH < LIGHT_DEPTH + 10, 'talk icons, health bars and damage numbers (overlayDepth) stay on top');
});

// ---- n1: resize ----

test('R3 n1: a window resize or a scale resize clears the HUD cache', () => {
    const r = rig();
    const handlers = {};
    const scene = { events: { on() {} }, scale: { on: (ev, f) => { handlers[ev] = f; } } };
    const inst = installNpcWorldBubbles(scene);
    assert.equal(inst, r.bubbles);
    inst._hud = { at: 0, rects: [], cw: 800, ch: 600 };
    window.dispatchEvent(new window.Event('resize'));
    assert.equal(inst._hud, null);
    inst._hud = { at: 0, rects: [], cw: 800, ch: 600 };
    handlers.resize();
    assert.equal(inst._hud, null);
});

// ---- n2: more HUD keep-outs ----

test('R3 n2: the open music panel, an incoming call, the talk prompt, VM controls, scanner panels and each toast are keep-outs', () => {
    const r = rig();
    const view = { x: 0, y: 0, width: 400, height: 300 };
    document.body.innerHTML = '<div id="music-widget-panel"></div><div id="phone-ring-layer"><div class="incoming-call"></div></div>'
        + '<div class="npc-interaction-prompt"></div><div id="vm-controls-overlay"></div><div class="panel-container"></div>'
        + '<div id="bluetooth-panel"></div><div id="biometrics-panel"></div>'
        + '<div id="npc-bark-container"><div class="npc-bark"></div></div><div id="notification-container"><div class="notification error"></div></div>';
    window.game = { canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) } };
    const els = [...document.body.querySelectorAll('*')];
    els.forEach((el, i) => { el.getBoundingClientRect = () => ({ left: 10 * i, top: 10, width: 40, height: 30 }); });
    // The containers themselves are not keep-outs (empty, or most of the screen)
    for (const id of ['phone-ring-layer', 'npc-bark-container', 'notification-container']) {
        document.getElementById(id).getBoundingClientRect = () => ({ left: 0, top: 0, width: 0, height: 0 });
    }
    const hud = r.bubbles._hudRects(view);
    assert.equal(hud.length, 9);
    for (const sel of ['#music-widget-panel', '#phone-ring-layer .incoming-call', '.npc-interaction-prompt', '#vm-controls-overlay',
        '.panel-container', '#bluetooth-panel', '#biometrics-panel', '#npc-bark-container .npc-bark', '#notification-container .notification']) {
        assert.ok(HUD_SELECTORS.split(', ').includes(sel), sel);
    }
    delete window.game;
});

// ---- n3: balanced pages ----

test('R3 n3: the last page is never a single word: the words are spread over the same pages', () => {
    const pages = pageLine(HINT);
    assert.equal(pages.length, 2);
    const words = pages.map(p => p.split(/\s+/).length);
    assert.ok(Math.min(...words) >= 5, JSON.stringify(pages));
    for (const p of pages) {
        assert.ok(p.split('\n').length <= PAGE_LINES);
        for (const l of p.split('\n')) assert.ok(l.length <= LINE_CHARS, l);
    }
    assert.equal(pagesText(pages), HINT, 'no word lost or moved');
    // A line whose pages are already even keeps them
    const even = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen';
    const plain = [];
    const lines = wrapLines(even);
    for (let i = 0; i < lines.length; i += PAGE_LINES) plain.push(lines.slice(i, i + PAGE_LINES).join('\n'));
    if (plain.at(-1).split(/\s+/).length * 2 >= even.split(' ').length / plain.length) assert.deepEqual(pageLine(even), plain);
    assert.deepEqual(pageLine('Short line.'), ['Short line.']);
});

// ---- n5: bubbles on screen first ----

test('R3 n5: barks on screen are placed before new ones, then nearest first; chatter last', () => {
    const order = pickShown([
        { npcId: 'near_new', distance: 10, bark: true },
        { npcId: 'far_held', distance: 200, bark: true, held: true },
        { npcId: 'chat', distance: 1, bark: false },
        { npcId: 'mid_new', distance: 50, bark: true }
    ]);
    assert.deepEqual(order, ['far_held', 'near_new', 'mid_new', 'chat']);
});

test('R3 n5: a newcomer nearer the player does not push a line already on screen to the toast', () => {
    // A narrow view: room for one bubble only, above whoever is first
    const view = { x: 0, y: 0, width: 240, height: 200 };
    const r = rig({ npcs: { far: { x: 124, y: 100 }, near: { x: 116, y: 100 } }, view, player: { x: 116, y: 180 } });
    const rest = [];
    r.bubbles.say('far', 'Printer is jammed again, as ever.', { onRemainder: (t) => rest.push(['far', t]) });
    r.bubbles.update();
    assert.ok(r.bubbles.bubbles.get('far').box.visible);
    assert.equal(r.bubbles.bubbles.get('far').sayState, r.bubbles.says.get('far'));
    r.bubbles.say('near', 'Has anyone seen my stapler today?', { onRemainder: (t) => rest.push(['near', t]) });
    r.bubbles.update();
    assert.ok(r.bubbles.log.some(e => e.npcId === 'near' && e.event === 'no-room'), JSON.stringify(r.bubbles.log));
    assert.ok(r.bubbles.hasLine('far'), 'the line on screen keeps its bubble');
    assert.equal(rest.some(([id]) => id === 'far'), false);
});

// ---- n4: knot-bark stories preloaded ----

function knotManager({ fetchOk = true } = {}) {
    const dispatcher = new NPCEventDispatcher();
    const manager = new NPCManager(dispatcher, null);
    manager.npcs.set('dana', { id: 'dana', displayName: 'Dana', npcType: 'person', storyPath: 'scenarios/x/ink/dana.json' });
    manager.npcs.set('ghost', { id: 'ghost', displayName: 'Ghost', npcType: 'phone', storyPath: 'scenarios/x/ink/ghost.json' });
    const fetches = [];
    globalThis.fetch = window.fetch = async (url) => { fetches.push(url); return { ok: fetchOk, json: async () => ({ inkVersion: 21 }) }; };
    return { manager, fetches };
}

test('R3 n4: a knot-bark mapping preloads the person NPC\'s story and the ink engine class, once per story', async () => {
    const { manager, fetches } = knotManager();
    window.breakEscapeConfig = { gameId: 7 };
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', knot: 'refused' }, { eventPattern: 'other', knot: 'other' }]);
    await settle();
    assert.deepEqual(fetches, ['/break_escape/games/7/ink?npc=dana']);
    assert.deepEqual(manager.storyCache.get('scenarios/x/ink/dana.json'), { inkVersion: 21 });
    assert.equal(manager.inkEngineCache.has('dana'), false, 'the engine is still built on first use');
    delete window.breakEscapeConfig;
});

test('R3 n4: no preload for plain barks, conversations or phone contacts', async () => {
    const { manager, fetches } = knotManager();
    manager._setupEventMappings('dana', [{ eventPattern: 'a', bark: 'Hello.' }, { eventPattern: 'b', knot: 'talk', conversationMode: 'person-chat' }]);
    manager._setupEventMappings('ghost', [{ eventPattern: 'c', knot: 'ping' }]);
    await settle();
    assert.deepEqual(fetches, []);
});

test('R3 n4: with the story preloaded, the first knot bark marks the refusal answered in time (no await)', async () => {
    const lines = [LINE];
    let i = 0;
    globalThis.inkjs = { Story: class {
        constructor() { this.currentTags = []; this.currentChoices = []; this.hasEnded = false; }
        get canContinue() { return i < lines.length; }
        Continue() { return `${lines[i++]}\n`; }
        ChoosePathString() { i = 0; }
    } };
    const { manager } = knotManager();
    const barks = [];
    manager.barkSystem = { showBark: (p) => barks.push(p), answersInView: () => true };
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', cooldown: 0, knot: 'refused' }]);
    await settle();
    assert.equal(manager.inkEngineCache.has('dana'), false);
    const data = {};
    manager.eventDispatcher.emit('door_gate_denied', data);
    assert.equal(data.answeredInView, true, 'marked before emit returned');
    await settle();
    assert.equal(barks.length, 1);
    delete globalThis.inkjs;
});
