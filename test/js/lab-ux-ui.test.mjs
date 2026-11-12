// Lab UX (q53 interface items and q55 d, docs/achitechture/LAB_UX_UI_BUILD_LOG.md):
// - every world pickup says so ("Picked up <name>"), the few types with their own toast keep it,
//   and nothing is said twice (inventory.js pickupToast / announcePickup, interactions.js);
// - the objectives list shows a "more below" cue while it goes on past the panel's edge
//   (ui/objectives-panel.js hasMoreBelow / updateMoreBelow);
// - a click on an open gate the player may pass walks him through (door-gates.js walkThroughTarget);
// - an NPC walking away gives way to the object under the same tap or E press
//   (interaction-reach.js npcWalkingAway / npcGivesWay / withoutLeavingNpcsIfObjects, interactions.js),
//   and an owner on the move from her own PC gives way to it (workstation-state.js leftBy);
// - a far click on an open gate is re-checked once in reach (pending-gate-walk.js);
// - a pickup toast waits for the tool the pickup opens (notifications.js expectPanelWithin).
// The text file returning to its container is in container-shares.test.mjs.
// Run with: node test/js/lab-ux-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
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
// The tracker interactions.js reads (its own copy of interaction-reach.js sets it on load;
// the copy loaded further down for the unit tests replaces window.walkAwayTracker)
const interactionsTracker = window.walkAwayTracker;
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
    // In front and a little to the right (23 degrees off the facing), so the faced NPC wins unless she gives way
    const pc = roomSprite({ id: 'pc1', type: 'pc', name: 'PC' }, 112, 128);
    const npc = { _isNPC: true, active: true, visible: true, npcId: 'owner', x: 100, y: 125, body: { velocity: { x: 0, y: 60 } } };
    globalThis.__rooms.r = { objects: { pc1: pc }, npcSprites: [npc] };
    // Half a second of walking away, sampled as game.js update() does
    const t = Date.now();
    const tracker = interactionsTracker;
    npc.y = 100 + 10; tracker.sample(window.player, [npc], t - 500);
    npc.y = 100 + 18; tracker.sample(window.player, [npc], t - 250);
    npc.y = 125; tracker.sample(window.player, [npc], t);
    window.player.direction = 'down';    // facing the NPC, not the PC
    window.MinigameFramework.startMinigame = (type) => got.push(type);
    let walkingChosen = false;
    window.npcManager = { getNPC: () => { walkingChosen = true; return null; } };
    tryInteractWithNearest();
    assert.equal(walkingChosen, false, 'walking away: the NPC branch did not run');
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

test('E key: a player who has just walked up gets the PC its owner is on her way from (review R2 m1)', () => {
    resetInteractions();
    const got = [];
    const pc = roomSprite({ id: 'pc1', type: 'pc', name: 'PC' }, 112, 128);
    // A fresh sprite: no tracker samples, so walking away alone says no (as for an arrival)
    const npc = { _isNPC: true, active: true, visible: true, npcId: 'owner', x: 100, y: 125, body: { velocity: { x: 0, y: 60 } } };
    globalThis.__rooms.r = { objects: { pc1: pc }, npcSprites: [npc] };
    window.player.direction = 'down';    // facing her, not the PC
    window.MinigameFramework.startMinigame = (type) => got.push(type);
    let chosenNpc = false;
    window.npcManager = { getNPC: () => { chosenNpc = true; return null; } };
    try {
        window.workstationState = { leftBy: () => false };
        tryInteractWithNearest();
        assert.equal(chosenNpc, true, 'still at her post: the faced owner is chosen');
        chosenNpc = false;
        window.workstationState = { leftBy: (objectId, npcId) => objectId === 'pc1' && npcId === 'owner' };
        tryInteractWithNearest();
        assert.equal(chosenNpc, false, 'left her post and on the move: the PC is used');
    } finally {
        delete window.workstationState;
        delete globalThis.__rooms.r;
    }
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

// Review R2 m1: the player walks north to the desk at 150 px/s and stops there at 400 ms; the
// owner stands at her PC, then gets up and walks north at 90 px/s from 300 ms. Sampled every 80 ms.
const { WorkstationState } = await import(dataUrl(readFileSync(join(js, 'systems/workstation-state.js'), 'utf8')));
function arriveThenTap(stopAt = 400, until = 640) {
    const tracker = new reach.WalkAwayTracker();
    const player = { x: 100, y: 260, body: { velocity: { x: 0, y: 0 } } };
    const npc = { npcId: 'dana', x: 100, y: 170, body: { velocity: { x: 0, y: 0 } } };
    for (let t = 0; t <= until; t += 80) {
        player.y = t < stopAt ? 200 + (stopAt - t) * 0.15 : 200;
        player.body.velocity.y = t < stopAt ? -150 : 0;
        npc.y = t < 300 ? 170 : 170 - (t - 300) * 0.09;
        npc.body.velocity.y = t < 300 ? 0 : -90;
        tracker.sample(player, [npc], t);
    }
    return { tracker, player, npc, now: until };
}
function danaDesk() {
    const objects = [{ id: 'dana_pc', workstation: true, lockType: 'login' }, { id: 'ian_pc', workstation: true }];
    const env = {
        objects: () => objects,
        npcs: () => [{ id: 'dana', needsHome: 'dana_pc' }, { id: 'ian', needsHome: 'ian_pc' }],
        on() {}, emit() {}, setGlobal() {}, roll: () => 0
    };
    return new WorkstationState(env).install();
}

test('npcGivesWay: a player who has just walked up to the desk, then taps, gets the PC its owner is leaving (review R2 m1)', () => {
    const { tracker, player, npc, now } = arriveThenTap();
    // The tracker alone reads the arrival as following her: the case the review found
    assert.equal(reach.npcWalkingAway(player, npc, now, tracker), false, 'the tracker alone misses it');
    const ws = danaDesk();
    window.workstationState = ws;
    try {
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'still at her post: the tap is hers');
        ws.onLeft('dana', { expectedAwayMs: 30000 });      // npc_left_post, as she gets up
        assert.equal(ws.leftBy('dana_pc', 'dana'), true);
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), true, 'just arrived, tapped her PC: the PC');
        assert.equal(reach.npcGivesWay(player, npc, ['ian_pc'], now, tracker), false, 'somebody else\'s PC under the tap');
        assert.equal(reach.npcGivesWay(player, npc, [], now, tracker), false, 'no object under the tap');
        npc.body.velocity = { x: 0, y: 0 };
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'away but standing still: she can be talked to');
        npc.body.velocity = { x: 0, y: -90 };
        window.npcHostileSystem = { isNPCHostile: (id) => id === 'dana' };
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'hostile');
        delete window.npcHostileSystem;
        npc.knockbackTimer = {};
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'knocked back');
        delete npc.knockbackTimer;
        ws.onReturned('dana');
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'back at her post');
    } finally {
        delete window.workstationState;
        delete window.npcHostileSystem;
    }
});

test('npcGivesWay: the follower rule is unchanged for an NPC with no PC of her own under the tap (review R1 M3)', () => {
    const tracker = new reach.WalkAwayTracker();
    const player = { x: 0, y: 0, body: { velocity: { x: 0, y: 0 } } };
    const npc = { npcId: 'ian', x: 0, y: 0, body: { velocity: { x: 0, y: 60 } } };
    const now = walk(tracker, player, npc, [...line(6, i => [100, 100 + i * 4, 100, 130 + i * 6]), [100, 120, 100, 166]]);
    window.workstationState = danaDesk();
    try {
        assert.equal(reach.npcGivesWay(player, npc, ['dana_pc'], now, tracker), false, 'just stopped after following, not her PC');
    } finally { delete window.workstationState; }
});

test('workstation leftBy: the owner away, or the guest whose session is open; nothing for anybody else', () => {
    const ws = danaDesk();
    assert.equal(ws.leftBy('dana_pc', 'dana'), false, 'at her post');
    ws.onLeft('dana');
    assert.equal(ws.leftBy('dana_pc', 'dana'), true);
    assert.equal(ws.leftBy('dana_pc', 'ian'), false, 'not his');
    assert.equal(ws.leftBy('no_such_pc', 'dana'), false);
    assert.equal(ws.leftBy('dana_pc', null), false);
    ws.guests.set('ian_pc', { npcId: 'zoe' });
    assert.equal(ws.leftBy('ian_pc', 'zoe'), true, 'a guest who left the session open');
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
    assert.deepEqual(gates.walkThroughTarget(a, { x: 160, y: 116 }, { playerRoom: 'vault', now: 1000 }), { x: 52, y: 116 });
    assert.deepEqual(gates.walkThroughTarget(a, { x: 160, y: 116 }, { playerRoom: 'lobby', now: 1000 }), { x: 148, y: 116 }, 'in the doorway past the centre: on, not back');
});

test('walkThroughTarget: the far side is the other room, even for a player in the doorway past its centre line (review R1 n4)', () => {
    const { gates, a } = gateSetup();
    const g = gates.groupAtPosition(100, 100);
    window.gameState.globalVariables.disguised = true;
    gates.open(g, 1000, 'door_gate_opened');
    // Still in the lobby, feet just north of the centre line: on north, into the vault
    assert.deepEqual(gates.walkThroughTarget(a, { x: 100, y: 92 }, { playerRoom: 'lobby', now: 1000 }), { x: 100, y: 36 });
    // In the vault, feet just south of it: back south, into the lobby
    assert.deepEqual(gates.walkThroughTarget(a, { x: 100, y: 108 }, { playerRoom: 'vault', now: 1000 }), { x: 100, y: 164 });
    // A room that is neither (not known yet): read from the feet, as before
    assert.deepEqual(gates.walkThroughTarget(a, { x: 100, y: 92 }, { playerRoom: 'hall', now: 1000 }), { x: 100, y: 164 });
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

test('the panel: the cue also watches the rendered list, and destroy() lets go of its observer and resize listener (review m3)', () => {
    const observed = [];
    let disconnected = 0;
    const saved = { RO: window.ResizeObserver, gRO: globalThis.ResizeObserver };
    globalThis.ResizeObserver = window.ResizeObserver = class {
        constructor(cb) { this.cb = cb; }
        observe(el) { observed.push(el); }
        unobserve(el) { const i = observed.indexOf(el); if (i >= 0) observed.splice(i, 1); }
        disconnect() { disconnected++; observed.length = 0; }
    };
    const removed = [];
    const realRemove = window.removeEventListener.bind(window);
    window.removeEventListener = (type, fn, ...r) => { removed.push(type); return realRemove(type, fn, ...r); };
    try {
        const manager = { listeners: [], addListener(fn) { this.listeners.push(fn); }, removeListener() {}, getActiveAims: () => [] };
        const panel = new ObjectivesPanel(manager);
        assert.ok(observed.includes(panel.content), 'the list box');
        panel.render([{ aimId: 'a', title: 'A', status: 'active', tasks: [{ taskId: 't', title: 'T', status: 'active' }] }]);
        assert.ok(observed.includes(panel.content.firstElementChild), 'and the rendered list inside it');
        panel.destroy();
        assert.equal(disconnected, 1, 'the observer is disconnected');
        assert.ok(removed.includes('resize'), 'the resize listener is removed');
    } finally {
        globalThis.ResizeObserver = saved.gRO; window.ResizeObserver = saved.RO;
        window.removeEventListener = realRemove;
    }
});

// ── R1 m1: a pickup toast waits for the tool the pickup opens (interactions.js, notifications.js) ──
test('pick-up-then-open: the branch expects the panel before the add, for every type that opens one', async () => {
    resetInteractions();
    const order = [];
    window.expectPanelWithin = (ms) => order.push(['expect', ms]);
    const realPush = calls.push.bind(calls);
    calls.push = (c) => { order.push([c[0]]); return realPush(c); };
    try {
        for (const type of ['lab-workstation', 'workstation', 'phone', 'mail_terminal', 'vm-launcher']) {
            order.length = 0;
            handleObjectInteraction(roomSprite({ id: 'x_' + type, type, name: type, takeable: true, phoneId: 'p1' }));
            await settle();
            const iE = order.findIndex(o => o[0] === 'expect');
            const iA = order.findIndex(o => o[0] === 'addToInventory');
            assert.ok(iE >= 0 && iA > iE, `${type}: expectPanelWithin before addToInventory (${JSON.stringify(order)})`);
            assert.equal(order[iE][1], 1500);
        }
    } finally { calls.push = realPush; delete window.expectPanelWithin; }
});

// notifications.js, real, with its imports (copy list: keep in step with its import lines)
const notifDir = join(dir, 'notif');
for (const f of ['utils/display-dashes.js', 'utils/overlay-open.js', 'ui/modal-stack.js', 'systems/notifications.js']) {
    mkdirSync(dirname(join(notifDir, f)), { recursive: true });
    writeFileSync(join(notifDir, f), readFileSync(join(js, f), 'utf8'));
}
const notif = await import(pathToFileURL(join(notifDir, 'systems/notifications.js')).href);

test('pickup toast raised before the tool opens: hidden while it is open, shown once after it closes (fast and slow answers)', async () => {
    for (const answerMs of [50, 400]) {
        document.body.innerHTML = '<div id="notification-container"></div><div id="lab-popup" style="display:none"></div>';
        // startMinigame kept: the tools the previous test picked up open a moment after it ends
        window.MinigameFramework = { currentMinigame: null, startMinigame() {} };
        notif.clearExpectedPanel();
        const box = document.getElementById('notification-container');
        const seen = [];
        new window.MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.classList?.contains('notification') && seen.push([Date.now(), n.textContent])))).observe(box, { childList: true });
        const t0 = Date.now();
        notif.expectPanelWithin(1500);                        // interactions.js, before the add
        await new Promise(r => setTimeout(r, answerMs));
        notif.gameAlert('Lab tablet added to inventory.', 'success', 'Item Acquired', 5000);   // the add answers
        await new Promise(r => setTimeout(r, 1000 - answerMs));
        document.getElementById('lab-popup').style.display = 'block';   // the tool opens at 1 s
        notif.holdRecentNotifications();                     // as a panel opening does
        await new Promise(r => setTimeout(r, 1200));
        assert.equal(seen.length, 0, `answer ${answerMs} ms: nothing shown while the tool is open`);
        document.getElementById('lab-popup').style.display = 'none';
        const closedAt = Date.now();
        await new Promise(r => setTimeout(r, 700));
        assert.equal(seen.length, 1, `answer ${answerMs} ms: shown once after the close`);
        assert.ok(seen[0][0] >= closedAt, 'after the close, not before');
        assert.ok(seen[0][0] - t0 > 2000);
    }
});

// ── R1 m2: a far click on an open gate, re-checked in reach (systems/pending-gate-walk.js) ──
const { createPendingGateWalk, PENDING_GATE_WALK_MS } = await import(dataUrl(readFileSync(join(js, 'systems/pending-gate-walk.js'), 'utf8')));
function gateWalkRig() {
    const env = { moves: [], moving: true, minigame: false, through: { x: 48, y: -32 }, player: { x: 48, y: 200 } };
    const g = createPendingGateWalk({
        player: () => env.player,
        walkThroughTarget: () => env.through,
        moveTo: (x, y) => env.moves.push([x, y]),
        isMoving: () => env.moving,
        feet: (p) => ({ x: p.x, y: p.y + 30 }),
        range: 64,
        minigameOpen: () => env.minigame
    });
    return { env, g };
}

test('pending gate walk: through only if the gate still lets him by once in reach', () => {
    const { env, g } = gateWalkRig();
    const door = { x: 48, y: 32 };
    const t = 100000;
    g.arm(door, t); g.update(t + 500);
    assert.deepEqual(env.moves, [], 'far: nothing yet'); assert.ok(g.get());
    env.player.y = 90; g.update(t + 1500);
    assert.deepEqual(env.moves, [[48, -32]], 'in reach, still open: on through'); assert.equal(g.get(), null);
    env.moves.length = 0; env.through = null; env.player.y = 200;
    g.arm(door, t); env.player.y = 90; g.update(t + 1500);
    assert.deepEqual(env.moves, [], 'in reach, shut now: stays on the near side'); assert.equal(g.get(), null);
});

test('pending gate walk: dropped when he stops short, after the time limit, for a destroyed door, or a new click', () => {
    const { env, g } = gateWalkRig();
    const door = { x: 48, y: 32 };
    const t = 100000;
    env.moving = false;
    g.arm(door, t); g.update(t + 300); assert.ok(g.get(), 'not before 400 ms');
    g.update(t + 500); assert.equal(g.get(), null, 'stopped short');
    env.moving = true;
    g.arm(door, t); g.update(t + PENDING_GATE_WALK_MS + 1); assert.equal(g.get(), null, 'time limit, even while moving');
    g.arm({ ...door, destroyed: true }, t); g.update(t + 100); assert.equal(g.get(), null, 'destroyed door');
    g.arm(door, t); g.clear(); assert.equal(g.get(), null, 'a new click');
    assert.deepEqual(env.moves, []);
});

test('pending gate walk: a minigame opening on the way drops it, so he does not walk through when it closes (review R2 n1)', () => {
    const { env, g } = gateWalkRig();
    const t = 100000;
    g.arm({ x: 48, y: 32 }, t);
    env.player.y = 90; env.minigame = true;          // a conversation opens with him already in reach
    g.update(t + 600);
    assert.equal(g.get(), null);
    env.minigame = false; g.update(t + 700);
    assert.deepEqual(env.moves, [], 'no walk under the panel, nor after it');
});
