// Lab UX (q53 interface items and q55 d, docs/achitechture/LAB_UX_UI_BUILD_LOG.md):
// - every world pickup says so ("Picked up <name>"), the few types with their own toast keep it,
//   and nothing is said twice (inventory.js pickupToast / announcePickup, interactions.js);
// - the objectives list shows a "more below" cue while it goes on past the panel's edge
//   (ui/objectives-panel.js hasMoreBelow / updateMoreBelow);
// - a click on an open gate the player may pass walks him through (door-gates.js walkThroughTarget);
// - an NPC walking away gives way to the object under the same tap or E press
//   (interaction-reach.js npcWalkingAway / withoutLeavingNpcsIfObjects, interactions.js).
// The text file returning to its container is in container-shares.test.mjs.
// Run with: node test/js/lab-ux-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { inventoryMenuUrl } from './fixtures/inventory-menu-url.mjs';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
// jsdom's window and the engine's timers keep the loop alive; the exit code is the runner's

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const dir = mkdtempSync(join(tmpdir(), 'lab-ux-ui-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;

// ── inventory.js, its imports stubbed (as inventory-tray.test.mjs does) ────────────
const stub = (out, code) => { writeFileSync(join(dir, out), code); };
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js', 'forced-minigame-guard.mjs');
copy('systems/consumables.js', 'consumables.mjs');
const inv = await import(copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
    ["'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'"],
    ["'./consumables.js'", "'./consumables.mjs'"],
]));
const windowAnnounce = window.announcePickup;   // set by inventory.js on load

let toasts = [];
function resetInventory() {
    toasts = [];
    document.getElementById('inventory-container').innerHTML = '';
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 77 };
    globalThis.fetch = async () => ({ json: async () => ({ success: true }) });
    window.lockRef = (item) => item?.opens_lock || item?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.addNote = () => null;
    window.gameAlert = (...a) => toasts.push(a);
    window.eventDispatcher = { emit() {} };
}
const worldSprite = (data) => ({ objectId: data.id, name: data.type, scenarioData: data, setVisible() {} });

test('pickupToast: a generic toast for any type, the own toasts kept, none for notes or the lockpick set', () => {
    assert.deepEqual(inv.pickupToast({ type: 'keycard', name: 'Staff keycard' }),
        { message: 'Picked up Staff keycard', type: 'info', title: '', duration: 2500 });
    assert.equal(inv.pickupToast({ type: 'rfid_cloner' }).message, 'Picked up rfid_cloner', 'no name: the type');
    assert.equal(inv.pickupToast({ type: 'workstation', name: 'Crypto Workstation' }).title, 'Item Acquired');
    assert.match(inv.pickupToast({ type: 'lab-workstation', name: 'Lab tablet' }).message, /^Lab tablet added to inventory\. You can now use it to access lab sheets\.$/);
    assert.equal(inv.pickupToast({ type: 'notes', name: 'Memo' }), null, 'notes say "Added to your notes"');
    assert.equal(inv.pickupToast({ type: 'notes3', name: 'Memo' }), null);
    assert.equal(inv.pickupToast({ type: 'lockpick', name: 'Lock Pick Kit' }), null, 'its branch has its own toast');
    assert.equal(inv.pickupToast(null), null);
});

test('announcePickup: one toast for a real add, none for already held, a refusal or no result', async () => {
    resetInventory();
    const data = { id: 'badge_1', type: 'id_badge', name: 'Visitor badge', takeable: true };
    const sprite = worldSprite(data);
    const res = await inv.addToInventory(sprite);
    assert.deepEqual(res, { ok: true, reason: 'added' });
    toasts.length = 0;
    assert.equal(inv.announcePickup(sprite, res), true);
    assert.deepEqual(toasts, [['Picked up Visitor badge', 'info', '', 2500]]);
    toasts.length = 0;
    assert.equal(inv.announcePickup(sprite, { ok: true, reason: 'already' }), false);
    assert.equal(inv.announcePickup(sprite, { ok: false, reason: 'rejected' }), false);
    assert.equal(inv.announcePickup(sprite, undefined), false);
    assert.deepEqual(toasts, []);
    assert.equal(windowAnnounce, inv.announcePickup, 'interactions.js reaches it through window');
});

test('announcePickup: a key is announced; an item filed in a holder is left to "Added to <holder>"', async () => {
    resetInventory();
    const key = worldSprite({ id: 'k1', type: 'key', name: 'Office key', key_id: 'office', takeable: true });
    const kres = await inv.addToInventory(key);
    toasts.length = 0;
    assert.equal(inv.announcePickup(key, kres), true);
    assert.equal(toasts[0][0], 'Picked up Office key');

    resetInventory();
    const off = inv.registerTrayRule((item) => (item.scenarioData?.id === 'cap_1' ? { holderId: 'log' } : null));
    try {
        const filed = worldSprite({ id: 'cap_1', type: 'capture', name: 'Captured hash', takeable: true });
        const fres = await inv.addToInventory(filed);
        toasts.length = 0;
        assert.equal(inv.announcePickup(filed, fres), false);
        assert.deepEqual(toasts, []);
    } finally { off?.(); }
});

// ── interactions.js, imports stubbed (as examine-minigame.test.mjs does) ─────────
const calls = [];
globalThis.__calls = calls;
// Held now: the next interaction (a phone opening a second later) uses it, as the tray copy would
const addStub = "export function addToInventory(s) { globalThis.__calls.push(['addToInventory', s?.scenarioData?.id]); if (s?.scenarioData) s.scenarioData.takeable = false; return Promise.resolve({ ok: true, reason: 'added' }); }";
const stubs = {
    '../utils/constants.js': dataUrl('export const INTERACTION_RANGE = 64, INTERACTION_RANGE_SQ = 4096, INTERACTION_CHECK_INTERVAL = 100, DOOR_INTERACTION_RANGE_SQ = 4096; export const overlayDepth = (d) => d;'),
    '../core/rooms.js': dataUrl('export const rooms = globalThis.__rooms = {};'),
    '../core/player.js': dataUrl('export function facePlayerToward() {}'),
    './unlock-system.js': dataUrl('export function handleUnlock() {}'),
    './doors.js': dataUrl('export function handleDoorInteraction() {}'),
    './biometrics.js': dataUrl('export function collectFingerprint() { return null; } export function handleBiometricScan() {}'),
    './inventory.js': dataUrl(addStub + ' export function createItemIdentifier(d) { return d?.id; }'),
    './ui-sounds.js': dataUrl('export function playUISound() {} export function playGameSound() {}'),
    './apply-actions.js': dataUrl('export function applyActions() {}'),
    '../utils/conditional-text.js': dataUrl(readFileSync(join(js, 'utils/conditional-text.js'), 'utf8')),
    '../utils/flag-lock.js': dataUrl(readFileSync(join(js, 'utils/flag-lock.js'), 'utf8')),
    './requires-item-hint.js': dataUrl('export function requiresItemHint() { return null; }'),
    './pc-policy.js': dataUrl(readFileSync(join(js, 'systems/pc-policy.js'), 'utf8')),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    './npc-reach.js': dataUrl('export function npcReachDistSq(p, s, sq) { return sq; }'),
    './examine.js': dataUrl('export function shouldExamine() { return false; } export function startExamine() { return false; }'),
    './combat-input.js': dataUrl(readFileSync(join(js, 'systems/combat-input.js'), 'utf8')),
    './consumables.js': dataUrl(readFileSync(join(js, 'systems/consumables.js'), 'utf8')),
    './interaction-walls.js': dataUrl('export function interactionLineClear() { return true; }'),
    './interaction-reach.js': dataUrl(readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8')),
    './minigame-registry.js': dataUrl('export const hasMinigameStarter = () => false; export const startRegisteredMinigame = () => false;'),
    './inventory-menu.js': inventoryMenuUrl
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) src = src.split(`'${spec}'`).join(`'${url}'`);
const announced = [];
function resetInteractions() {
    calls.length = 0; announced.length = 0;
    Object.assign(window, {
        MinigameFramework: { currentMinigame: null, registeredScenes: { 'text-file': class {} }, startMinigame() {} },
        inventory: { items: [] },
        player: { x: 100, y: 100, direction: 'down' },
        gameState: { globalVariables: {} },
        gameAlert: (...a) => calls.push(['gameAlert', a[0]]),
        gameDisplay: () => {},
        addNote: () => null,
        lockRef: () => null,
        npcManager: { getNPC: () => ({}) },
        announcePickup: (sprite, res) => announced.push([sprite.scenarioData.id, res?.reason])
    });
}
resetInteractions();
const { handleObjectInteraction, tryInteractWithNearest } = await import(dataUrl(src));
const roomSprite = (data, x = 100, y = 120) => ({ name: data.type, objectId: data.id, x, y, active: true, visible: true,
    interactable: true, scenarioData: data, texture: { key: data.type }, frame: { name: '__BASE', cutWidth: 32, cutHeight: 24 } });
const settle = () => new Promise(r => setTimeout(r, 0));

test('interactions: a plain takeable pickup is announced once its add answers', async () => {
    resetInteractions();
    handleObjectInteraction(roomSprite({ id: 'kc', type: 'keycard', name: 'Keycard', takeable: true }));
    await settle();
    assert.deepEqual(calls.filter(c => c[0] === 'addToInventory'), [['addToInventory', 'kc']]);
    assert.deepEqual(announced, [['kc', 'added']]);
});

test('interactions: a pick-up-then-open item (a phone) is announced too', async () => {
    resetInteractions();
    handleObjectInteraction(roomSprite({ id: 'ph', type: 'phone', name: 'Work phone', takeable: true, phoneId: 'p1' }));
    await settle();
    assert.deepEqual(announced, [['ph', 'added']]);
});

test('interactions: a takeable text file read in the world is announced (after the reader, held)', async () => {
    resetInteractions();
    handleObjectInteraction(roomSprite({ id: 'tf', type: 'text_file', name: 'notes.txt', takeable: true, readable: true, text: 'Hello.' }));
    await settle();
    assert.deepEqual(announced, [['tf', 'added']]);
});

test('interactions: the lockpick set keeps its own toast and is not announced again', async () => {
    resetInteractions();
    handleObjectInteraction(roomSprite({ id: 'lp', type: 'lockpick', name: 'Lock Pick Kit', takeable: true }));
    await settle();
    assert.deepEqual(announced, []);
    assert.ok(calls.some(c => c[0] === 'gameAlert' && /added to inventory\. You can now use it to pick locks/.test(c[1])));
});

test('E key: an object beats an NPC walking away; an NPC standing or approaching still wins when faced', () => {
    resetInteractions();
    const got = [];
    window.handleObjectInteraction = handleObjectInteraction;
    const pc = roomSprite({ id: 'pc1', type: 'pc', name: 'PC' }, 130, 100);   // to the right, 30 px
    const npc = { _isNPC: true, active: true, visible: true, npcId: 'owner', x: 100, y: 125, body: { velocity: { x: 0, y: 60 } } };
    globalThis.__rooms.r = { objects: { pc1: pc }, npcSprites: [npc] };
    // Half a second of walking away, sampled as game.js update() does
    const t = Date.now();
    const tracker = window.walkAwayTracker;
    npc.y = 100 + 10; tracker.sample(window.player, [npc], t - 500);
    npc.y = 100 + 18; tracker.sample(window.player, [npc], t - 250);
    npc.y = 125; tracker.sample(window.player, [npc], t);
    window.player.direction = 'down';    // facing the NPC, not the PC
    window.MinigameFramework.startMinigame = (type) => got.push(type);
    window.npcManager = { getNPC: () => null };
    tryInteractWithNearest();
    assert.ok(calls.length === 0 || !calls.some(c => c[0] === 'gameAlert' && /conversation/i.test(c[1])));
    // The PC's branch ran (a plain pc object shows its observation toast or examine), not the NPC's
    const npcHandled = got.includes('person-chat') || got.includes('phone-chat');
    assert.equal(npcHandled, false, 'walking away: the PC is used');

    // Standing still, the NPC the player faces is chosen
    npc.body.velocity = { x: 0, y: 0 };
    let chosenNpc = false;
    window.npcConversation = undefined;
    const orig = window.npcManager;
    window.npcManager = { getNPC: () => { chosenNpc = true; return null; } };
    tryInteractWithNearest();
    window.npcManager = orig;
    assert.equal(chosenNpc, true, 'standing: the faced NPC is chosen');
    delete globalThis.__rooms.r;
});

// ── interaction-reach.js ───────────────────────────────────────────────────────────
const reach = await import(dataUrl(readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8')));

// A walk sampled every 100 ms for 600 ms: positions of the player and the NPC at each step
function walk(tracker, player, npc, steps, t0 = 10000) {
    steps.forEach(([px, py, nx, ny], i) => {
        player.x = px; player.y = py; npc.x = nx; npc.y = ny;
        tracker.lastSampleAt = -Infinity;
        tracker.sample(player, [npc], t0 + i * 100);
    });
    return t0 + (steps.length - 1) * 100;
}
const line = (n, f) => Array.from({ length: n }, (_, i) => f(i));

test('npcWalkingAway: an owner walking off from a standing player counts', () => {
    const tracker = new reach.WalkAwayTracker();
    const player = { x: 100, y: 100, body: { velocity: { x: 0, y: 0 } } };
    const npc = { npcId: 'dana', x: 0, y: 0, body: { velocity: { x: 0, y: 60 } } };
    const now = walk(tracker, player, npc, line(7, i => [100, 100, 100, 110 + i * 6]));
    assert.equal(reach.npcWalkingAway(player, npc, now, tracker), true);
});

test('npcWalkingAway: a player following the NPC does not count, close behind or lagging', () => {
    const tracker = new reach.WalkAwayTracker();
    const player = { x: 0, y: 0, body: { velocity: { x: 0, y: 60 } } };
    const npc = { npcId: 'guard', x: 0, y: 0, body: { velocity: { x: 0, y: 60 } } };
    let now = walk(tracker, player, npc, line(7, i => [100, 100 + i * 6, 100, 130 + i * 6]));
    assert.equal(reach.npcWalkingAway(player, npc, now, tracker), false, 'same pace: the gap holds');
    const t2 = new reach.WalkAwayTracker();
    now = walk(t2, player, npc, line(7, i => [100, 100 + i * 3, 100, 130 + i * 6]));
    assert.equal(reach.npcWalkingAway(player, npc, now, t2), false, 'lagging: the gap grows, but the player is moving towards them');
    const t3 = new reach.WalkAwayTracker();
    player.body.velocity = { x: 0, y: 0 };
    now = walk(t3, player, npc, [...line(6, i => [100, 100 + i * 4, 100, 130 + i * 6]), [100, 120, 100, 166]]);
    assert.equal(reach.npcWalkingAway(player, npc, now, t3), false, 'just stopped after following: the window still shows the follow');
});

test('npcWalkingAway: a hostile NPC, or one in knockback, never counts', () => {
    const player = { x: 100, y: 100, body: { velocity: { x: 0, y: 0 } } };
    const npc = { npcId: 'thug', x: 0, y: 0, body: { velocity: { x: 0, y: 250 } } };
    const tracker = new reach.WalkAwayTracker();
    const now = walk(tracker, player, npc, line(7, i => [100, 100, 100, 110 + i * 8]));
    assert.equal(reach.npcWalkingAway(player, npc, now, tracker), true, 'the same walk counts for a friendly NPC');
    globalThis.window.npcHostileSystem = { isNPCHostile: (id) => id === 'thug' };
    try {
        assert.equal(reach.npcWalkingAway(player, npc, now, tracker), false, 'hostile');
    } finally {
        delete globalThis.window.npcHostileSystem;
    }
    npc.knockbackTimer = { remove() {} };
    assert.equal(reach.npcWalkingAway(player, npc, now, tracker), false, 'knocked back');
    delete npc.knockbackTimer;
});

test('npcWalkingAway: standing, approaching, too short a walk, or no samples do not count', () => {
    const player = { x: 100, y: 100, body: { velocity: { x: 0, y: 0 } } };
    const npc = { npcId: 'dana', x: 0, y: 0, body: { velocity: { x: 0, y: 0 } } };
    const t1 = new reach.WalkAwayTracker();
    let now = walk(t1, player, npc, line(7, () => [100, 100, 100, 130]));
    assert.equal(reach.npcWalkingAway(player, npc, now, t1), false, 'standing');
    const t2 = new reach.WalkAwayTracker();
    npc.body.velocity = { x: 0, y: -60 };
    now = walk(t2, player, npc, line(7, i => [100, 100, 100, 170 - i * 6]));
    assert.equal(reach.npcWalkingAway(player, npc, now, t2), false, 'approaching');
    const t3 = new reach.WalkAwayTracker();
    npc.body.velocity = { x: 0, y: 60 };
    now = walk(t3, player, npc, line(2, i => [100, 100, 100, 130 + i * 6]));
    assert.equal(reach.npcWalkingAway(player, npc, now, t3), false, 'only 100 ms of walk');
    assert.equal(reach.npcWalkingAway(player, npc, now, new reach.WalkAwayTracker()), false, 'no samples');
    assert.equal(reach.npcWalkingAway(player, { x: 1, y: 1 }, now, t3), false, 'no body');
    assert.equal(reach.npcWalkingAway(null, npc, now, t3), false);
});

test('withoutLeavingNpcsIfObjects: the leaving NPC is dropped beside an object, kept alone or beside a chair', () => {
    const pc = { label: 'PC', isObject: true };
    const chair = { label: 'Chair', isObject: true, isChair: true };
    const leaving = { label: 'Owner', leavingNpc: true };
    const staying = { label: 'Colleague', leavingNpc: false };
    assert.deepEqual(reach.withoutLeavingNpcsIfObjects([pc, leaving]), [pc]);
    assert.deepEqual(reach.withoutLeavingNpcsIfObjects([pc, leaving, staying]), [pc, staying], 'a menu still offers anyone staying');
    assert.deepEqual(reach.withoutLeavingNpcsIfObjects([leaving]), [leaving], 'nothing else: the NPC');
    assert.deepEqual(reach.withoutLeavingNpcsIfObjects([chair, leaving]), [chair, leaving], 'a chair is not what was tapped');
    assert.deepEqual(reach.withoutLeavingNpcsIfObjects([pc, staying]), [pc, staying], 'nobody leaving: unchanged');
});

// ── door-gates.js walkThroughTarget ──────────────────────────────────────────────────
const { DoorGates } = await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

function gateSetup(direction = 'north', gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'disguised' }) {
    const mk = (roomId, connectedRoom, dir) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction: dir, worldX: 100, worldY: 100, open: false }
    });
    window.npcManager = { npcs: new Map() };
    window.npcBehaviorManager = { getBehavior: () => null };
    window.player = { x: 100, y: 160 };
    window.gameState = { globalVariables: { disguised: false } };
    window.eventDispatcher = { emit() {} };
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {} };
    window.currentPlayerRoom = 'lobby';
    const gates = new DoorGates();
    const opposite = { north: 'south', south: 'north', east: 'west', west: 'east' }[direction];
    const a = mk('lobby', 'vault', direction);
    const b = mk('vault', 'lobby', opposite);
    gates.register(a, gate);
    gates.register(b, null);
    return { gates, a, b };
}

test('walkThroughTarget: a shut gate, or an open one that bars the player, keeps its present answer', () => {
    const { gates, a } = gateSetup();
    assert.equal(gates.walkThroughTarget(a, { x: 100, y: 160 }, { playerRoom: 'lobby', now: 1000 }), null, 'shut');
    const g = gates.groupAtPosition(100, 100);
    gates.open(g, 1000, 'door_gate_opened');
    assert.equal(gates.walkThroughTarget(a, { x: 100, y: 160 }, { playerRoom: 'lobby', now: 1000 }), null, 'open, undisguised');
    assert.equal(gates.walkThroughTarget({ x: 5, y: 5, doorProperties: { worldX: 5, worldY: 5 } }, { x: 0, y: 0 }), null, 'no gate here');
    assert.equal(gates.walkThroughTarget(a, null), null, 'no feet');
});

test('walkThroughTarget: open to the player, north or south, through to the far side; inside, always out', () => {
    const { gates, a, b } = gateSetup();
    const g = gates.groupAtPosition(100, 100);
    window.gameState.globalVariables.disguised = true;
    gates.open(g, 1000, 'door_gate_opened');
    assert.deepEqual(gates.walkThroughTarget(a, { x: 100, y: 160 }, { playerRoom: 'lobby', now: 1000 }), { x: 100, y: 36 }, 'south of it: north through');
    assert.deepEqual(gates.walkThroughTarget(b, { x: 100, y: 160 }, { playerRoom: 'lobby', now: 1000 }), { x: 100, y: 36 }, 'either room\'s sprite');
    window.gameState.globalVariables.disguised = false;
    assert.deepEqual(gates.walkThroughTarget(b, { x: 100, y: 40 }, { playerRoom: 'vault', now: 1000 }), { x: 100, y: 164 }, 'inside the secured room: out');
});

test('walkThroughTarget: an east or west gate walks across, to the doorway\'s floor', () => {
    const { gates, a } = gateSetup('east', { openFor: ['guard'], holdMs: 2500 });
    const g = gates.groupAtPosition(100, 100);
    gates.open(g, 1000, 'door_gate_opened');
    assert.deepEqual(gates.walkThroughTarget(a, { x: 40, y: 116 }, { playerRoom: 'lobby', now: 1000 }), { x: 148, y: 116 });
    assert.deepEqual(gates.walkThroughTarget(a, { x: 160, y: 116 }, { playerRoom: 'lobby', now: 1000 }), { x: 52, y: 116 });
});

// ── ui/objectives-panel.js ──────────────────────────────────────────────────────────
const panelSrc = readFileSync(join(js, 'ui/objectives-panel.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { ObjectivesPanel } = await import(dataUrl(panelSrc));

test('hasMoreBelow: only while the list goes on past the bottom, ignoring a pixel or two of rounding', () => {
    assert.equal(ObjectivesPanel.hasMoreBelow({ scrollTop: 0, scrollHeight: 800, clientHeight: 400 }), true);
    assert.equal(ObjectivesPanel.hasMoreBelow({ scrollTop: 400, scrollHeight: 800, clientHeight: 400 }), false, 'scrolled to the end');
    assert.equal(ObjectivesPanel.hasMoreBelow({ scrollTop: 399, scrollHeight: 800, clientHeight: 400 }), false, 'rounding');
    assert.equal(ObjectivesPanel.hasMoreBelow({ scrollTop: 0, scrollHeight: 300, clientHeight: 400 }), false, 'fits');
    assert.equal(ObjectivesPanel.hasMoreBelow(undefined), false);
});

test('the panel: the cue follows render, scrolling and collapse', () => {
    const manager = { listeners: [], addListener(fn) { this.listeners.push(fn); }, removeListener() {},
        getActiveAims: () => [] };
    const panel = new ObjectivesPanel(manager);
    const el = document.getElementById('objectives-panel');
    const c = panel.content;
    let h = 900;
    Object.defineProperty(c, 'scrollHeight', { get: () => h, configurable: true });
    Object.defineProperty(c, 'clientHeight', { get: () => 400, configurable: true });
    const aims = [{ aimId: 'a', title: 'A', status: 'active', tasks: [{ taskId: 't', title: 'T', status: 'active' }] }];
    panel.render(aims);
    assert.equal(el.classList.contains('has-more-below'), true, 'a long list');
    c.scrollTop = 500;
    c.dispatchEvent(new window.Event('scroll'));
    assert.equal(el.classList.contains('has-more-below'), false, 'scrolled to the end');
    c.scrollTop = 0;
    c.dispatchEvent(new window.Event('scroll'));
    assert.equal(el.classList.contains('has-more-below'), true);
    panel.toggleCollapse();
    assert.equal(el.classList.contains('has-more-below'), false, 'collapsed: no cue');
    panel.toggleCollapse();
    h = 300;
    panel.render(aims);
    assert.equal(el.classList.contains('has-more-below'), false, 'a short list');
    panel.destroy();
});
