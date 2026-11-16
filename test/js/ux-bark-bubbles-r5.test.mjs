// UX feedback round slice 5, review round 5: a bark held through a conversation and released
// from its cleanup (the minigame still current, `_ending` set) goes to her bubble; an exchange or
// call line is voiced at once and never skipped for want of room (a silent toast, once); hints
// are kept as a list, so "H G" plus H never shows H twice; chatter from an NPC off camera in the
// player's room is voiced as before and not skipped.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/ux-bark-bubbles-r5.test.mjs
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
const { NpcWorldBubbles, pagesText, hintsBeyond, minigameOpenNow, MAX_BUBBLES } = await imp('systems/npc-world-bubbles.js');
const { createEngineWorld } = await imp('systems/npc-needs.js');

const LINE = 'Not with you behind me. Ask at reception.';
const H = 'Store B needs a staff badge. Reception issues them to visitors with an escort.';
const G = 'Store A is for the night shift only.';
const CHAT = 'Has anyone seen the stapler from the second floor?';
const EX = 'Did you sign off the change request yet?';

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

/** A minigame framework that holds barks as the real one does: an ending minigame is closed. */
function framework(current = null) {
    return { currentMinigame: current, holdsBarks() { return !!(this.currentMinigame && !this.currentMinigame._ending); } };
}

/** NPCs in the hall with the player; `talking` is the needs system's chatter, per NPC. */
function rig({ npcs = { dana: { x: 100, y: 100 } }, player = { x: 100, y: 200 }, view = null } = {}) {
    document.body.innerHTML = '';
    const scene = { add: {}, textures: { exists: () => true } };
    if (view) scene.cameras = { main: { worldView: view } };
    for (const k of ['text', 'image', 'graphics', 'container']) scene.add[k] = () => mk(scene, k);
    const sprites = {};
    for (const [id, n] of Object.entries(npcs)) {
        sprites[id] = { npcId: id, x: n.x, y: n.y, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
            getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    }
    window.rooms = { hall: { npcSprites: Object.values(sprites) } };
    window.currentPlayerRoom = 'hall';
    window.player = player;
    window.MinigameFramework = framework();
    window.currentConversationMinigameType = null;
    window.lightingSystem = null;
    const talking = new Map();
    window.npcNeedsSystem = { states: new Map(Object.keys(npcs).map(id => [id, {}])), getState: id => ({ talking: talking.get(id) || null }) };
    window.npcBehaviorManager = { getBehavior: id => (sprites[id] ? { sprite: sprites[id], roomId: 'hall' } : null) };
    const cancelled = [];
    const said = [];
    window.npcChatterVoice = { cancel: (id) => cancelled.push(id), say: (id, line) => said.push([id, line]) };
    let t = 0;
    const clock = { now: () => t, advance: (ms) => { t += ms; } };
    const bubbles = new NpcWorldBubbles({ now: clock.now, fontsReady: true });
    window.npcWorldBubbles = bubbles;
    return { scene, bubbles, clock, sprites, talking, cancelled, said };
}

function barkSystem() {
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id[0].toUpperCase() + id.slice(1), npcType: 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.playBarkSound = () => {};
    window.barkSystem = sys;
    return sys;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 6; i++) await tick(); };
const toasts = () => [...document.querySelectorAll('.npc-bark')].map(e => e.querySelector('.npc-bark-text').textContent);
const count = (s, sub) => s.split(sub).length - 1;
const FIVE = { a: { x: 0, y: 100 }, b: { x: 200, y: 100 }, c: { x: 400, y: 100 }, d: { x: 600, y: 100 }, grace: { x: 300, y: 300 } };

// ---- m1: a minigame that is ending counts as closed ----

test('R5 m1: minigameOpenNow is false for an ending minigame, true for an open one', () => {
    rig();
    assert.equal(minigameOpenNow(), false);
    window.MinigameFramework = framework({ _ending: false });
    assert.equal(minigameOpenNow(), true);
    window.MinigameFramework.currentMinigame._ending = true;
    assert.equal(minigameOpenNow(), false);
});

test('R5 m1: a bark held during person-chat and released from its cleanup goes to her bubble', async () => {
    const r = rig();
    const sys = barkSystem();
    const chat = { _ending: false };
    window.MinigameFramework = framework(chat);
    window.currentConversationMinigameType = 'person-chat';
    sys.showBark({ npcId: 'dana', npcName: 'Dana', message: LINE });
    assert.equal(sys.deferredBarkQueue.length, 1, 'held while the conversation is open');
    // person-chat cleanup(): the framework still holds it as current, with _ending set
    chat._ending = true;
    window.currentConversationMinigameType = null;
    assert.equal(r.bubbles.viewFacts('dana').minigameOpen, false);
    sys.drainDeferredBarks();
    await settle();
    assert.deepEqual(sys.lastRoute, { npcId: 'dana', route: 'bubble' });
    assert.equal(r.bubbles.hasLine('dana'), true);
    assert.deepEqual(toasts(), []);
    // The frame update keeps it up while the framework still lists the ending minigame
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('dana'), true);
    assert.equal(r.bubbles.bubbles.get('dana').box.visible, true);
});

test('R5 m1: with the minigame still open (not ending) the bubble layer treats it as open', () => {
    const r = rig();
    r.bubbles.say('dana', LINE);
    window.MinigameFramework = framework({ _ending: false });
    assert.equal(r.bubbles.viewFacts('dana').minigameOpen, true);
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('dana'), false, 'left view');
});

test('R5 m1: chatter shows while the framework still lists an ending minigame', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    window.MinigameFramework = framework({ _ending: true });
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
});

// ---- m2: exchange and call lines are never skipped ----

test('R5 m2: an exchange line is voiced at once, not deferred, while the layer runs', () => {
    const r = rig({ npcs: { grace: { x: 100, y: 100 } } });
    r.bubbles.update();
    const world = createEngineWorld();
    world.speak('grace', EX, { knot: 'ex_change' });
    assert.deepEqual(r.said, [['grace', EX]], 'voiced at once');
    assert.equal(r.bubbles.chatterVoice.size, 0, 'nothing waiting');
    assert.equal(r.bubbles.chatterMust.get('grace'), EX);
    r.talking.set('grace', { line: EX, partnerId: null });
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true, 'in her bubble when it fits');
    assert.deepEqual(r.said, [['grace', EX]], 'voiced once');
    // A call line the same way
    world.speak('grace', CHAT, { call: true, knot: undefined });
    assert.equal(r.said.length, 2);
    assert.equal(r.bubbles.chatterVoice.size, 0);
});

test('R5 m2: an exchange line with no room is a silent toast, once, and still voiced once', async () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    const sys = barkSystem();
    let beeps = 0;
    sys.playBarkSound = () => { beeps++; };
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles.update();
    assert.equal(r.bubbles.says.size, MAX_BUBBLES);
    const world = createEngineWorld();
    world.speak('grace', EX, { knot: 'ex_change' });
    r.talking.set('grace', { line: EX, partnerId: null });
    r.bubbles.update();
    r.bubbles.update();
    await settle();
    assert.deepEqual(toasts(), [`grace: ${EX}`], 'shown as a toast');
    assert.equal(beeps, 0, 'silent: its voice is playing');
    assert.deepEqual(r.said, [['grace', EX]], 'voiced once');
    assert.deepEqual(r.cancelled, [], 'voice not stopped');
    assert.ok(r.bubbles.log.some(e => e.npcId === 'grace' && e.event === 'chatter-toast'));
    assert.equal(r.bubbles.log.some(e => e.npcId === 'grace' && e.event === 'chatter-skipped'), false);
    // The barks end: the line is not shown again in a bubble
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles._end(id, 'done');
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace')?.box.visible ?? false, false);
    await settle();
    assert.equal(toasts().length, 1, 'toasted once');
    // The line ends: the must mark goes with it (bounded)
    r.talking.delete('grace');
    r.bubbles.update();
    assert.equal(r.bubbles.chatterMust.size, 0);
});

test('R5 m2: an exchange bubble a bark pushes out goes to a toast, its voice carries on', async () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    barkSystem();
    for (const id of ['a', 'b', 'c']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles.update();
    const world = createEngineWorld();
    world.speak('grace', EX, { knot: 'ex_change' });
    r.talking.set('grace', { line: EX, partnerId: null });
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
    r.bubbles.say('d', 'Line from d.');
    r.bubbles.update();
    await settle();
    assert.deepEqual(r.cancelled, []);
    assert.deepEqual(toasts(), [`grace: ${EX}`]);
});

test('R5 m2: plain chatter with no room is still skipped (no toast, no voice)', async () => {
    const r = rig({ npcs: FIVE, player: { x: 300, y: 200 } });
    barkSystem();
    for (const id of ['a', 'b', 'c', 'd']) r.bubbles.say(id, `Line from ${id}.`);
    r.bubbles.update();
    const world = createEngineWorld();
    world.speak('grace', CHAT, {});
    r.talking.set('grace', { line: CHAT, partnerId: null });
    r.bubbles.update();
    await settle();
    assert.deepEqual(r.said, []);
    assert.deepEqual(toasts(), []);
});

// ---- n1: hints as a list ----

test('R5 n1: hintsBeyond drops the new hint wherever it sits in the list, and repeats', () => {
    assert.deepEqual(hintsBeyond([H, G], H), [G]);
    assert.deepEqual(hintsBeyond([G, H], H), [G]);
    assert.deepEqual(hintsBeyond([H, G, H], ''), [H, G]);
    assert.deepEqual(hintsBeyond([H.toUpperCase()], H), []);
    assert.deepEqual(hintsBeyond(null, H), []);
});

test('R5 n1: "H G" plus a new H shows each hint once', () => {
    const r = rig();
    r.bubbles.say('dana', LINE, { followUp: G });
    r.bubbles.say('dana', LINE, { followUp: H });   // G then H
    let st = r.bubbles.say('dana', LINE, { followUp: G }).state;   // H then G
    assert.deepEqual(st.hints, [H, G]);
    st = r.bubbles.say('dana', LINE, { followUp: H }).state;
    const text = pagesText(st.pages.slice(st.linePages));
    assert.equal(count(text, 'staff badge'), 1);
    assert.equal(count(text, 'night shift'), 1);
    assert.deepEqual(st.hints, [G, H]);
});

test('R5 n1: closeTagged with H on an "H G" bubble hands on G alone', () => {
    const r = rig();
    const lost = [];
    r.bubbles.say('dana', LINE, { followUp: H, tag: 'door_gate_denied', onFollowUpLost: (t) => lost.push(t) });
    r.bubbles.say('dana', LINE, { followUp: G, tag: 'door_gate_denied' });
    r.bubbles.closeTagged('door_gate_denied', { followUp: H });
    assert.deepEqual(lost, [G]);
});

// ---- n2: off-camera chatter keeps its old behaviour ----

test('R5 n2: chatter from an NPC in the room but off camera is voiced, not skipped', () => {
    const view = { x: 0, y: 0, width: 400, height: 300 };
    const r = rig({ npcs: { grace: { x: 900, y: 900 } }, player: { x: 100, y: 100 }, view });
    r.bubbles.update();
    const spoken = [];
    r.talking.set('grace', { line: CHAT, partnerId: null });
    assert.equal(r.bubbles.deferChatterVoice('grace', CHAT, () => spoken.push(CHAT)), true);
    r.bubbles.update();
    assert.deepEqual(spoken, [CHAT], 'voiced as before');
    assert.equal(r.bubbles.chatterSkipped.has('grace'), false);
    assert.equal(r.bubbles.log.some(e => e.npcId === 'grace' && /chatter-(skipped|dropped)/.test(e.event)), false);
    // Back on camera later in the line: shown in her bubble, not voiced again
    r.sprites.grace.x = 200; r.sprites.grace.y = 200;
    r.bubbles.update();
    assert.equal(r.bubbles.bubbles.get('grace').box.visible, true);
    assert.deepEqual(spoken, [CHAT]);
});
