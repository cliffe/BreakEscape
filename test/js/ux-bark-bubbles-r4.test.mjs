// UX feedback round slice 5, review round 4: a gate's hint never doubles when her bubble is on
// its last page (a refusal in her cooldown, her next refusal), a hint is handed on whole, the
// bubbles sit under the screen flash and the proximity ghost with lighting off, the knot-bark
// preload reads the room loader's cache, and a chatter line with no room is skipped (no voice),
// a chatter bubble a bark takes the place of has its voice stopped.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/ux-bark-bubbles-r4.test.mjs
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
const { NpcWorldBubbles, pagesText, followUpLeft, followUpBeyond, bubbleDepth, BUBBLE_DEPTH, BUBBLE_DEPTH_UNLIT, MAX_BUBBLES } = await imp('systems/npc-world-bubbles.js');
const { LIGHT_DEPTH, overlayDepth } = await imp('utils/constants.js');
const { default: NPCManager } = await imp('systems/npc-manager.js');
const { default: NPCEventDispatcher } = await imp('systems/npc-events.js');
const { createEngineWorld } = await imp('systems/npc-needs.js');

const LINE = 'Not with you behind me. Ask at reception.';
const HINT = 'Store B needs a staff badge. Reception issues them to visitors with an escort.';
const OTHER = 'Store A is for the night shift only.';
const CHAT = 'Has anyone seen the stapler from the second floor?';

function mk(scene, kind) {
    const o = { kind, x: 0, y: 0, visible: true, data: {}, scene, text: '', depth: 0,
        get width() { return o.kind === 'text' ? Math.max(...String(o.text).split('\n').map(l => l.length), 0) * 7 : 16; },
        get height() { return o.kind === 'text' ? String(o.text).split('\n').length * 16 : 16; },
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setAlpha(a) { o.alpha = a; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture() { return o; }, setText(t) { o.text = t; return o; }, setDepth(d) { o.depth = d; return o; },
        setData(k, v) { o.data[k] = v; return o; }, getData(k) { return o.data[k]; } };
    for (const m of ['clear', 'fillStyle', 'lineStyle', 'fillRect', 'strokeRect']) o[m] = () => o;
    return o;
}

/** NPCs in the hall with the player; `talking` is the needs system's chatter, per NPC. */
function rig({ npcs = { dana: { x: 100, y: 100 } }, player = { x: 100, y: 200 } } = {}) {
    document.body.innerHTML = '';
    const scene = { add: {}, textures: { exists: () => true } };
    for (const k of ['text', 'image', 'graphics', 'container']) scene.add[k] = () => mk(scene, k);
    const sprites = {};
    for (const [id, n] of Object.entries(npcs)) {
        sprites[id] = { npcId: id, x: n.x, y: n.y, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
            getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    }
    window.rooms = { hall: { npcSprites: Object.values(sprites) } };
    window.currentPlayerRoom = 'hall';
    window.player = player;
    window.MinigameFramework = { currentMinigame: null };
    window.lightingSystem = null;
    const talking = new Map();
    window.npcNeedsSystem = { states: new Map(Object.keys(npcs).map(id => [id, {}])), getState: id => ({ talking: talking.get(id) || null }) };
    window.npcBehaviorManager = { getBehavior: id => (sprites[id] ? { sprite: sprites[id], roomId: 'hall' } : null) };
    const cancelled = [];
    window.npcChatterVoice = { cancel: (id) => cancelled.push(id) };
    let t = 0;
    const clock = { now: () => t, advance: (ms) => { t += ms; } };
    const bubbles = new NpcWorldBubbles({ now: clock.now, fontsReady: true });
    window.npcWorldBubbles = bubbles;
    return { scene, bubbles, clock, sprites, talking, cancelled };
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
const toasts = () => [...document.querySelectorAll('.npc-bark')].map(e => e.querySelector('.npc-bark-text').textContent);
const count = (s, sub) => s.split(sub).length - 1;
/** Run the bubble's pages on until its last page (the hint's last page) is on screen. */
const toLastPage = (r, st) => {
    while (st.page < st.pages.length - 1) { r.clock.advance(st.times[st.page]); r.bubbles.update(); }
    assert.ok(st.page > st.linePages, 'a later hint page is on screen');
};

// ---- m1: the hint never doubles from its last page ----

test('R4 m1: a refusal in her cooldown with her bubble on the last hint page closes it quietly: no hint toast', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, eventPattern: 'door_gate_denied' });
    r.bubbles.update();
    toLastPage(r, r.bubbles.says.get('dana'));
    // doors.js: the door's notification carries the same hint
    r.bubbles.closeTagged('door_gate_denied', { followUp: HINT });
    await settle();
    assert.equal(r.bubbles.hasLine('dana'), false);
    assert.deepEqual(toasts(), [], 'the notification shows the hint; no second copy');
    assert.equal(r.bubbles.log.some(e => e.event === 'follow-up-lost'), false);
});

test('R4 m1: her next refusal on the last hint page: the line, then the hint once', async () => {
    const r = rig();
    const sys = barkSystem();
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, eventPattern: 'door_gate_denied' });
    r.bubbles.update();
    toLastPage(r, r.bubbles.says.get('dana'));
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, eventPattern: 'door_gate_denied' });
    const st = r.bubbles.says.get('dana');
    assert.equal(pagesText(st.pages.slice(0, st.linePages)), LINE);
    assert.equal(pagesText(st.pages.slice(st.linePages)), HINT);
    assert.equal(count(pagesText(st.pages), 'escort'), 1);
    assert.equal(count(pagesText(st.pages), 'staff badge'), 1);
    await settle();
    assert.deepEqual(toasts(), []);
});

test('R4 m1: the same hint in another case and with dashes is the same hint', () => {
    assert.equal(followUpBeyond(HINT, HINT.toUpperCase()), '');
    assert.equal(followUpBeyond('Store B: staff badge only.', 'Store B - staff badge only'), '');
    assert.equal(followUpBeyond('issues them to visitors with an escort.', HINT), '', 'the new hint ends with it');
});

test('R4 m1: a follow-up that carried an older hint before this one keeps only the older part', () => {
    assert.equal(followUpBeyond(`${OTHER} ${HINT}`, HINT), OTHER);
    assert.equal(followUpBeyond(HINT, OTHER), HINT);
    assert.equal(followUpBeyond(HINT, ''), HINT);
    assert.equal(followUpBeyond('', HINT), '');
    const r = rig();
    r.bubbles.say('dana', LINE, { followUp: OTHER });
    r.bubbles.say('dana', LINE, { followUp: HINT });
    const st = r.bubbles.say('dana', LINE, { followUp: HINT }).state;
    assert.equal(pagesText(st.pages.slice(st.linePages)), `${OTHER} ${HINT}`, 'each hint once');
});

test('R4 m1: closeTagged with another gate\'s hint on the last page hands hers on whole', () => {
    const r = rig();
    const lost = [];
    const st = r.bubbles.say('dana', LINE, { followUp: HINT, tag: 'door_gate_denied', onFollowUpLost: (t) => lost.push(t) }).state;
    r.bubbles.update();
    toLastPage(r, st);
    r.bubbles.closeTagged('door_gate_denied', { followUp: OTHER });
    assert.deepEqual(lost, [HINT]);
});

// ---- n1: the whole hint, never a fragment ----

test('R4 n1: stillValid false on the last hint page: the whole hint as a toast, once', async () => {
    const r = rig();
    const sys = barkSystem();
    let valid = true;
    await sys._renderBark({ npcId: 'dana', npcName: 'Dana', message: LINE, followUp: HINT, stillValid: () => valid });
    r.bubbles.update();
    toLastPage(r, r.bubbles.says.get('dana'));
    valid = false;
    r.clock.advance(300);
    r.bubbles.update();
    await settle();
    assert.deepEqual(toasts(), [`Dana: ${HINT}`]);
});

test('R4 n1: leaving view on the last hint page hands on the whole hint, not its tail', () => {
    const r = rig();
    const rest = [];
    const st = r.bubbles.say('dana', LINE, { followUp: HINT, onRemainder: (t) => rest.push(t) }).state;
    r.bubbles.update();
    toLastPage(r, st);
    window.currentPlayerRoom = 'lobby';
    r.bubbles.update();
    assert.deepEqual(rest, [HINT]);
});

test('R4 n1: followUpLeft is the whole follow-up while any of it is unread, and empty once done', () => {
    const r = rig();
    const st = r.bubbles.say('dana', LINE, { followUp: HINT }).state;
    assert.equal(followUpLeft(st), HINT);
    r.bubbles.update();
    toLastPage(r, st);
    assert.equal(followUpLeft(st), HINT);
    r.clock.advance(st.times[st.page]);
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('dana'), false);
    assert.equal(followUpLeft(st), '');
    assert.equal(followUpLeft(r.bubbles.say('dana', LINE).state), '', 'no follow-up');
});

// ---- n2: depth with lighting off ----

test('R4 n2: with lighting off the bubbles sit under the screen flash and the proximity ghost, above the action icons', () => {
    const r = rig();
    window.lightingSystem = null;
    assert.equal(bubbleDepth(), BUBBLE_DEPTH_UNLIT);
    assert.ok(BUBBLE_DEPTH_UNLIT < overlayDepth(10000), 'screen flash (screen-effects.js) on top');
    assert.ok(BUBBLE_DEPTH_UNLIT < 9000, 'proximity ghost (interactions.js) on top');
    assert.ok(BUBBLE_DEPTH_UNLIT > 5000, 'above the action icons and carried-item labels');
    r.bubbles.say('dana', LINE);
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('dana').box.depth, BUBBLE_DEPTH_UNLIT);
});

test('R4 n2: with lighting on the bubbles stay above the light map; a toggle moves them on the next frame', () => {
    const r = rig();
    window.lightingSystem = { rooms: new Map() };
    assert.equal(bubbleDepth(), LIGHT_DEPTH + 3);
    r.bubbles.say('dana', LINE);
    r.bubbles.update();
    const box = r.bubbles.bubbles.get('dana').box;
    assert.equal(box.depth, BUBBLE_DEPTH);
    assert.ok(box.depth < overlayDepth(0), 'talk icons and health bars stay on top');
    window.lightingSystem = null;
    r.bubbles.update();
    assert.equal(box.depth, BUBBLE_DEPTH_UNLIT);
    window.lightingSystem = { rooms: new Map() };
    r.bubbles.update();
    assert.equal(box.depth, BUBBLE_DEPTH);
    window.lightingSystem = null;
});

// ---- n3: the preload reads the room loader's cache ----

function knotManager() {
    const dispatcher = new NPCEventDispatcher();
    const manager = new NPCManager(dispatcher, null);
    manager.npcs.set('dana', { id: 'dana', displayName: 'Dana', npcType: 'person', storyPath: 'scenarios/x/ink/dana.json' });
    const fetches = [];
    globalThis.fetch = window.fetch = async (url) => { fetches.push(url); return { ok: true, json: async () => ({ inkVersion: 21 }) }; };
    return { manager, fetches };
}

test('R4 n3: a story the room loader already has is not fetched again by the knot-bark preload', async () => {
    const { manager, fetches } = knotManager();
    const story = { inkVersion: 21, fromLoader: true };
    window.breakEscapeConfig = { gameId: 7 };
    window.npcLazyLoader = { getCachedStory: (p) => (p === 'scenarios/x/ink/dana.json' ? story : null) };
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', knot: 'refused' }]);
    await settle();
    assert.deepEqual(fetches, []);
    assert.equal(manager.storyCache.get('scenarios/x/ink/dana.json'), story);
    delete window.npcLazyLoader;
    delete window.breakEscapeConfig;
});

test('R4 n3: with no preload, the first knot bark takes the room loader\'s copy too (no GET)', async () => {
    const lines = [LINE];
    let i = 0;
    globalThis.inkjs = { Story: class {
        constructor() { this.currentTags = []; this.currentChoices = []; this.hasEnded = false; }
        get canContinue() { return i < lines.length; }
        Continue() { return `${lines[i++]}\n`; }
        ChoosePathString() { i = 0; }
    } };
    const { manager, fetches } = knotManager();
    manager.preloadKnotBarks = false;
    window.npcLazyLoader = { getCachedStory: () => ({ inkVersion: 21 }) };
    const barks = [];
    manager.barkSystem = { showBark: (p) => barks.push(p), answersInView: () => true };
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', cooldown: 0, knot: 'refused' }]);
    manager.eventDispatcher.emit('door_gate_denied', {});
    await settle();
    assert.equal(barks.length, 1);
    assert.deepEqual(fetches, []);
    delete window.npcLazyLoader;
    delete globalThis.inkjs;
});

test('R4 n3: with neither cache holding it, the preload still fetches once', async () => {
    const { manager, fetches } = knotManager();
    window.npcLazyLoader = { getCachedStory: () => null };
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', knot: 'refused' }]);
    await settle();
    assert.equal(fetches.length, 1);
    delete window.npcLazyLoader;
});

// ---- n4: chatter with no room ----

/** Four barks in a row across the hall: the bubble cap is full. */
const FIVE = { a: { x: 0, y: 100 }, b: { x: 200, y: 100 }, c: { x: 400, y: 100 }, d: { x: 600, y: 100 }, grace: { x: 300, y: 300 } };

test('R4 n4: a chatter line placed on screen starts its voice on that frame, once', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    r.bubbles.update();
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    assert.equal(r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT)), true);
    assert.deepEqual(spoken, [], 'waits for the placement');
    r.bubbles.update();
    assert.deepEqual(spoken, [CHAT]);
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
    r.bubbles.update();
    assert.deepEqual(spoken, [CHAT], 'once');
    assert.equal(r.bubbles.chatterVoice.size, 0);
});

test('R4 n4: a chatter line that finds no room is skipped: no voice, no waiting entry, never shown later, no toast', async () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles.update();
    assert.equal(r.bubbles.says.size, MAX_BUBBLES);
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();
    assert.deepEqual(spoken, [], 'not voiced');
    assert.equal(r.bubbles.chatterVoice.size, 0, 'no waiting voice');
    assert.equal(r.bubbles.bubbles.get('grace')?.box.visible ?? false, false);
    assert.ok(r.bubbles.log.some(e => e.npcId === 'grace' && e.event === 'chatter-skipped'));
    // The barks end; her line is still running on the needs clock but stays skipped
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles._end(id, 'done');
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace')?.box.visible ?? false, false, 'not shown later with no voice');
    assert.deepEqual(spoken, []);
    await settle();
    assert.deepEqual(toasts(), [], 'chatter is never turned into engine text');
    // It expires as before (the needs clock ends it); her next line shows and is voiced
    r.talking.delete('grace');
    r.bubbles.update();
    assert.equal(r.bubbles.chatterSkipped.has('grace'), false, 'the skip mark goes with the line');
    const next = 'The printer on three is jammed again.';
    r.talking.set('grace', { line: next, partnerId: null });
    r.bubbles.deferChatterVoice('grace', next, () => spoken.push(next));
    r.bubbles.update();
    assert.deepEqual(spoken, [next]);
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
});

test('R4 n4: a bark that takes a chatter bubble\'s place mid-line stops that chatter\'s voice', () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    for (const id of ['a', 'b', 'c']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles.update();
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();
    assert.deepEqual(spoken, [CHAT]);
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
    // A fourth bark: barks are placed before chatter, so hers loses its place
    r.bubbles.say('d', 'Line from d.');
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, false);
    assert.deepEqual(r.cancelled, ['grace'], 'her voice is stopped');
    assert.ok(r.bubbles.log.some(e => e.npcId === 'grace' && e.event === 'chatter-dropped'));
    // Not stopped again, and not shown again with no voice
    r.bubbles._end('d', 'done');
    r.bubbles.update();
    r.bubbles.update();
    assert.deepEqual(r.cancelled, ['grace']);
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, false);
});

test('R4 n4: a bark of her own takes her chatter line: not voiced, and her chatter bubble does not come back', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    r.bubbles.update();
    const spoken = [];
    r.bubbles.say('grace', 'Back in five.');
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();
    assert.deepEqual(spoken, []);
    assert.equal(r.bubbles.chatterVoice.size, 0);
    r.bubbles._end('grace', 'done');
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, false);
});

test('R4 n4: a chatter line with no bubble to place (off camera, other room, minigame) is voiced as before', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    r.bubbles.update();
    window.MinigameFramework = { currentMinigame: {} };
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();
    assert.deepEqual(spoken, [CHAT]);
    assert.equal(r.bubbles.chatterVoice.size, 0);
});

test('R4 n4: on a first frame with the font still loading, a chatter voice waits for the placement (a skipped line is never voiced)', async () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    r.bubbles.fontsReady = false;
    window.canvasFontsReady = Promise.resolve();
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles._updatedAt = r.clock.now();
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();   // fonts not ready: nothing placed
    assert.deepEqual(spoken, []);
    await settle();
    r.bubbles.update();   // fonts ready: the cap is full, her line is skipped
    assert.deepEqual(spoken, []);
    assert.equal(r.bubbles.chatterVoice.size, 0);
    delete window.canvasFontsReady;
});

test('R4 n4: a waiting voice whose line has ended is dropped, not spoken late', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    r.bubbles.update();
    const spoken = [];
    r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT));
    r.bubbles.update();   // the needs clock ended it before this frame
    assert.deepEqual(spoken, []);
    assert.equal(r.bubbles.chatterVoice.size, 0);
});

test('R4 n4: the needs world voices through the bubble layer when it runs, at once when it does not', () => {
    const said = [];
    window.npcChatterVoice = { say: (id, line) => said.push([id, line]) };
    const world = createEngineWorld();
    // No layer: at once
    delete window.npcWorldBubbles;
    world.speak('grace', CHAT, {});
    assert.deepEqual(said, [['grace', CHAT]]);
    // A layer that has not run a frame for a while: at once
    let t = 0;
    const layer = new NpcWorldBubbles({ now: () => t, fontsReady: true });
    window.npcWorldBubbles = layer;
    world.speak('grace', CHAT, {});
    assert.equal(said.length, 2);
    // A running layer: it waits for the placement
    layer._updatedAt = 0;
    t = 100;
    world.speak('grace', CHAT, {});
    assert.equal(said.length, 2);
    assert.equal(layer.chatterVoice.get('grace').line, CHAT);
    layer.chatterVoice.get('grace').speak();
    assert.equal(said.length, 3);
    delete window.npcWorldBubbles;
    delete window.npcChatterVoice;
});
