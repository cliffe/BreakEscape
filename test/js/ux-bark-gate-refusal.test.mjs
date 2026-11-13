// UX slice 5 review round 1, M2: a gate's refusal (doors.js refuseAtGate) emits door_gate_denied
// first, and shows its own notification only when no person NPC in view answered it. The NPC
// manager decides "answered in view" as the bark mapping fires (cooldown and condition just
// passed), and marks the event data; the bubble layer's view facts (same room, lit, on camera,
// no minigame) decide "in view". A gate's lockedHint is never lost: with the notification
// dropped it shows as a toast of its own.
// The real NPC manager, bark system, bubble layer and doors.js (its other imports stubbed).
// Run with: bin/test-js test/js/ux-bark-gate-refusal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const { default: NPCBarkSystem } = await imp('systems/npc-barks.js');
const { NpcWorldBubbles } = await imp('systems/npc-world-bubbles.js');
const { default: NPCManager } = await imp('systems/npc-manager.js');
const { default: NPCEventDispatcher } = await imp('systems/npc-events.js');

let doorsSrc = readFileSync(join(js, 'systems/doors.js'), 'utf8');
const stubs = {
    '../utils/constants.js': dataUrl('export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 320, GRID_UNIT_HEIGHT_PX = 288, DOOR_INTERACTION_RANGE = 64;'),
    './unlock-system.js': dataUrl('export const handleUnlock = () => {}, notifyServerUnlock = async () => ({}), playerHoldsRfidCredentialFor = () => false;'),
    '../utils/locked-hint.js': pathToFileURL(join(js, 'utils/locked-hint.js')).href,
    './interaction-repeat.js': dataUrl('export const isRepeatInteraction = () => false;'),
    './room-ready.js': dataUrl('export const waitForRoomReady = async () => ({ ready: true });')
};
for (const [spec, url] of Object.entries(stubs)) doorsSrc = doorsSrc.split(`'${spec}'`).join(`'${url}'`);
const { handleGateBump } = await import(dataUrl(doorsSrc));

const LINE = 'Not with you behind me. Ask at reception.';
const DENIED = /Access denied/;
const HINT = 'Store B needs a staff badge. Reception issues them to visitors with an escort.';

function mkObj(scene, kind) {
    const o = { kind, x: 0, y: 0, visible: true, data: {}, scene, text: '',
        get width() { return kind === 'text' ? Math.max(...String(o.text).split('\n').map(l => l.length), 0) * 7 : 16; },
        get height() { return kind === 'text' ? String(o.text).split('\n').length * 16 : 16; },
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture() { return o; }, setText(t) { o.text = t; return o; }, setDepth() { return o; }, setData(k, v) { o.data[k] = v; return o; } };
    for (const m of ['clear', 'fillStyle', 'fillRect', 'lineStyle']) o[m] = () => o;
    return o;
}

/**
 * Dana the guard (person, bark on door_gate_denied with a 4 s cooldown) and a gate she answers.
 * `danaRoom`, `dark`, `view` (the camera's world view) set where she is seen from.
 */
function rig({ danaRoom = 'hall', dark = false, view = { x: 0, y: 0, width: 400, height: 300 }, danaAt = { x: 100, y: 100 }, lockedHint = null } = {}) {
    document.body.innerHTML = '';
    const scene = { add: {}, textures: { exists: () => true }, cameras: { main: { worldView: view } } };
    scene.add.text = () => mkObj(scene, 'text');
    scene.add.image = () => mkObj(scene, 'image');
    scene.add.graphics = () => mkObj(scene, 'graphics');
    scene.add.container = () => mkObj(scene, 'container');
    const sprite = { npcId: 'dana', x: danaAt.x, y: danaAt.y, active: true, visible: true, destroyed: false, scene,
        texture: { key: 'none' }, frame: null, getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    window.rooms = { [danaRoom]: { npcSprites: [sprite] } };
    window.currentPlayerRoom = 'hall';
    window.player = { x: 100, y: 200 };
    window.MinigameFramework = { currentMinigame: null };
    window.lightingSystem = dark ? { rooms: new Map([[danaRoom, {}]]), roomLevel: () => 0 } : null;
    window.npcNeedsSystem = null;
    window.npcBehaviorManager = null;
    window.npcWorldBubbles = new NpcWorldBubbles({ fontsReady: true });

    const dispatcher = new NPCEventDispatcher();
    window.eventDispatcher = dispatcher;
    const bark = new NPCBarkSystem(null);
    const manager = new NPCManager(dispatcher, bark);
    bark.npcManager = manager;
    bark.init();
    bark.playBarkSound = () => {};
    manager.npcs.set('dana', { id: 'dana', displayName: 'Dana Price', npcType: 'person', roomId: danaRoom });
    manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', cooldown: 4000, bark: LINE }]);

    const alerts = [];
    window.gameAlert = (msg, type, title) => alerts.push({ msg, type, title });
    const group = { open: true, bodyOff: false, requires: null, lockedHint };
    window.doorGates = { groups: new Map([['g', group]]), bumpDue: () => true };
    window.cancelClickToMove = () => {};
    const door = { doorProperties: { gateKey: 'g', roomId: 'hall', connectedRoom: 'store_b', direction: 'south' } };
    const events = [];
    dispatcher.on('door_gate_denied', (d) => events.push({ ...d, alertsBefore: alerts.length }));
    return { manager, bark, alerts, door, events };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const toasts = () => [...document.querySelectorAll('.npc-bark .npc-bark-text')].map(e => e.textContent);
const settle = async () => { for (let i = 0; i < 4; i++) await tick(); };

test('a guard in view answers the refusal: her bubble, and no door notification', async () => {
    const s = rig();
    assert.equal(handleGateBump(s.door), true);
    assert.equal(s.events.length, 1);
    assert.equal(s.events[0].alertsBefore, 0, 'door_gate_denied goes before any notification');
    await settle();
    assert.deepEqual(s.alerts, [], 'no notification over the bubble');
    assert.ok(window.npcWorldBubbles.hasLine('dana'), 'Dana says it in a bubble');
    assert.deepEqual(toasts(), []);
});

test('a refusal inside the mapping\'s cooldown gets no bark, so the notification shows', async () => {
    const s = rig();
    handleGateBump(s.door);
    await settle();
    assert.deepEqual(s.alerts, []);
    handleGateBump(s.door);   // straight away: Dana's 4 s cooldown
    await settle();
    assert.equal(s.alerts.length, 1);
    assert.match(s.alerts[0].msg, DENIED);
});

test('a guard in another room, in the dark or off camera: the notification shows (her answer is a toast)', async () => {
    for (const [label, opts] of [
        ['other room', { danaRoom: 'lobby' }],
        ['dark room', { dark: true }],
        ['off camera', { danaAt: { x: 900, y: 100 } }]
    ]) {
        const s = rig(opts);
        handleGateBump(s.door);
        await settle();
        assert.equal(s.alerts.length, 1, `${label}: one notification`);
        assert.match(s.alerts[0].msg, DENIED, label);
        assert.equal(window.npcWorldBubbles.hasLine('dana'), false, `${label}: no bubble`);
        assert.deepEqual(toasts(), [`Dana Price: ${LINE}`], `${label}: her answer is a toast`);
    }
});

test('no NPC answers: the notification shows, as before', async () => {
    const s = rig();
    s.manager.eventDispatcher.off('door_gate_denied');   // nobody listening
    handleGateBump(s.door);
    await settle();
    assert.equal(s.alerts.length, 1);
    assert.match(s.alerts[0].msg, DENIED);
});

test('a gate\'s lockedHint is never lost: with the notification dropped it shows on its own', async () => {
    const s = rig({ lockedHint: HINT });
    handleGateBump(s.door);
    await settle();
    assert.equal(s.alerts.length, 1, 'one toast: the hint');
    assert.equal(s.alerts[0].msg, HINT);
    assert.doesNotMatch(s.alerts[0].msg, DENIED, 'the generic line is not shown');
    assert.ok(window.npcWorldBubbles.hasLine('dana'));
});

test('a gate\'s lockedHint with no answer in view rides on the notification, as before', async () => {
    const s = rig({ lockedHint: HINT, danaRoom: 'lobby' });
    handleGateBump(s.door);
    await settle();
    assert.equal(s.alerts.length, 1);
    assert.match(s.alerts[0].msg, DENIED);
    assert.ok(s.alerts[0].msg.includes(HINT));
});

test('the mark is set at mapping time: a delayed mapping (delayMs) does not count as an answer', async () => {
    const s = rig();
    s.manager.eventDispatcher.off('door_gate_denied');
    s.manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', cooldown: 0, bark: LINE, delayMs: 50 }]);
    handleGateBump(s.door);
    assert.equal(s.alerts.length, 1, 'the notification shows: nothing answered yet');
    assert.match(s.alerts[0].msg, DENIED);
    await new Promise(r => setTimeout(r, 80));
    await settle();
    assert.ok(window.npcWorldBubbles.hasLine('dana'), 'the bark still comes, later');
});

test('answersInView follows the bubble layer\'s facts', () => {
    const s = rig();
    assert.equal(s.bark.answersInView('dana'), true);
    window.MinigameFramework.currentMinigame = { id: 'pin' };
    assert.equal(s.bark.answersInView('dana'), false, 'a minigame is open');
    window.MinigameFramework.currentMinigame = null;
    s.manager.npcs.get('dana').npcType = 'phone';
    assert.equal(s.bark.answersInView('dana'), false, 'a phone contact never answers in a bubble');
});

test('a knot bark answering in view counts too (marked before its ink loads)', async () => {
    const s = rig();
    s.manager.eventDispatcher.off('door_gate_denied');
    const npc = s.manager.npcs.get('dana');
    npc.storyPath = 'scenarios/x/ink/dana.json';
    const loads = [];
    s.manager._showBarkFromKnot = (id, n, knot) => { loads.push(knot); };
    s.manager._setupEventMappings('dana', [{ eventPattern: 'door_gate_denied', cooldown: 0, knot: 'refused' }]);
    handleGateBump(s.door);
    assert.deepEqual(loads, ['refused']);
    assert.deepEqual(s.alerts, [], 'no notification');
});
