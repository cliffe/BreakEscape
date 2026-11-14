// Behaviour of the test bridge's click target and move checks (index.js),
// run against the real index.js and aim.js with the engine stubbed.
// Run with: bin/test-js test/js/test-bridge-click-target.test.mjs
//
// Covers: interact() clicks the aim point and reports what the engine picked;
// the claimant list (hidden objects, KO'd NPCs, the target door's far side,
// shut-door reach); moveTo/moveToNear telling a click the bridge sent apart
// from something the game started; and the no-click move's click guards.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bridgeSrc = join(here, '../../public/break_escape/js/systems/test-bridge');
const dir = mkdtempSync(join(tmpdir(), 'bridge-click-target-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const sysBridge = join(dir, 'systems/test-bridge');
mkdirSync(sysBridge, { recursive: true });
mkdirSync(join(dir, 'utils'), { recursive: true });
mkdirSync(join(dir, 'core'), { recursive: true });

// The real modules under test.
for (const f of ['index.js', 'aim.js']) writeFileSync(join(sysBridge, f), readFileSync(join(bridgeSrc, f), 'utf8'));

// Engine stubs, steered per test through globalThis.
const G = 'globalThis';
writeFileSync(join(sysBridge, 'state.js'),
    `export const detectBlockingUi = () => (${G}.__detect ? ${G}.__detect() : null);\n` +
    `export const activeMinigameSummary = () => ${G}.__mg || null;\n` +
    `export const interactionMenuState = () => ${G}.__menu || null;\n` +
    `export const scanNearby = () => ${G}.__scan || [];\n` +
    `export const engineInteractDistance = () => 0;\n` +
    'export const sessionOverlayShowing = () => false;\nexport const sessionOverlayButtons = () => [];\n' +
    ['getState', 'solveStandingPoint', 'plainNearestEntity', 'roomContents', 'doorways']
        .map(n => `export const ${n} = () => null;`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'input.js'),
    'export const sleepFrames = async () => {};\nexport const sleep = async () => {};\n' +
    `export const clickWorld = async (x, y) => { ${G}.__clicks.push([x, y]); if (${G}.__onClick) await ${G}.__onClick(x, y); return true; };\n` +
    'export const isWorldPointOnScreen = () => true;\nexport const getScene = () => null;\n' +
    ['pressKey', 'keyDown', 'keyUp', 'worldToClient', 'clickElement'].map(n => `export const ${n} = () => {};`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'wait.js'),
    `export const waitForMovementEnd = async () => { if (${G}.__duringMove) await ${G}.__duringMove(); return { ok: true, elapsedMs: 1 }; };\n` +
    ['waitUntil', 'waitForGlobal', 'waitForEvent', 'waitFrames', 'waitForMinigame', 'waitForMinigameClosed']
        .map(n => `export const ${n} = () => {};`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'log.js'),
    'export const logAction = () => {};\nexport const logNote = () => {};\nexport const installEventCapture = () => true;\n' +
    'export const currentSeq = () => 0;\nexport const eventsSince = () => [];\n' +
    ['drain', 'peek', 'clear'].map(n => `export const ${n} = () => null;`).join('\n') + '\n');
writeFileSync(join(sysBridge, 'minigames.js'), 'export const minigameBridge = {};\n');
writeFileSync(join(sysBridge, 'access.js'), 'export const accessBridge = {};\n');
writeFileSync(join(dir, 'utils/constants.js'), 'export const INTERACTION_RANGE = 32;\nexport const DOOR_INTERACTION_RANGE = 64;\n');
writeFileSync(join(dir, 'utils/overlay-open.js'), 'export const workstationPopupOpen = () => false;\n');
writeFileSync(join(dir, 'systems/interaction-reach.js'), 'export const reachX = (s) => s.x;\n');
writeFileSync(join(dir, 'systems/interaction-walls.js'), 'export const wallClearFrom = () => true;\nexport const sameRoomFrom = () => true;\n');
writeFileSync(join(dir, 'systems/tap-pick.js'), 'export const opaqueAt = () => true;\n');
writeFileSync(join(dir, 'core/player.js'), `export const movePlayerToPoint = (x, y) => { ${G}.__moves.push([x, y]); };\n`);

globalThis.document = { querySelector: () => null, elementsFromPoint: () => [], body: {} };
globalThis.window = globalThis;

const mod = await import(pathToFileURL(join(sysBridge, 'index.js')));
const bridge = mod.default;
const I = mod.__internals;

// Scene objects, with getBounds as Phaser gives it.
const obj = (id, left, top, w, h, extra = {}) => ({
    scenarioData: { id, name: id }, x: left, y: top, active: true, visible: true, interactable: true,
    getBounds: () => ({ left, top, right: left + w, bottom: top + h }), ...extra
});
const npc = (id, cx, cy, extra = {}) => ({
    npcId: id, _isNPC: true, x: cx, y: cy, visible: true,
    getBounds: () => ({ left: cx - 40, top: cy - 40, right: cx + 40, bottom: cy + 40 }), ...extra
});
const door = (roomId, connectedRoom, cx, cy, extra = {}) => ({
    x: cx, y: cy, active: true, scene: {}, doorProperties: { roomId, connectedRoom, open: false, ...extra },
    getBounds: () => ({ left: cx - 16, top: cy - 16, right: cx + 16, bottom: cy + 16 })
});

function reset({ player = { x: 150, y: 80 } } = {}) {
    Object.assign(globalThis, {
        __clicks: [], __moves: [], __mg: null, __menu: null, __scan: [], __detect: null,
        __onClick: null, __duringMove: null, preventPlayerMovement: false
    });
    window.player = { ...player, body: { center: { x: player.x, y: player.y + 31 }, halfHeight: 5 } };
    window.rooms = {};
    delete window.__pendingTapUse;
    delete window.MinigameFramework;
    // Engine handlers the recorder wraps; each test gets fresh ones.
    window.handleObjectInteraction = (s) => { globalThis.__mg = { id: 'mg-' + (s.scenarioData?.id || s.objectId) }; };
    window.tryInteractWithNPC = () => {};
    window.handleDoorInteraction = () => {};
    window.isObjectInInteractionRange = (s) => Math.hypot(s.x - window.player.x, s.y - window.player.y) <= 32;
    I.ensureTargetRecorder();
}

// sis02's control room, as measured live: HMI-OPS-01's top-left corner lies in the board.
function sis02Room() {
    const hmi = obj('hmi_ops_01', 144, 47, 28, 23);
    const board = obj('status_board', 67, 12, 184, 37);
    window.rooms = { scada: { objects: { hmi, board }, npcSprites: [], doorSprites: [] } };
    globalThis.__scan = [{ kind: 'object', id: 'hmi_ops_01', name: 'HMI', x: 144, y: 47, inRange: true, onScreen: true }];
    // The engine acts on whatever holds the click point, topmost first.
    globalThis.__onClick = (x, y) => {
        for (const s of [hmi, board]) {
            const b = s.getBounds();
            if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return window.handleObjectInteraction(s);
        }
    };
    return { hmi, board };
}

test('interact() clicks inside the target, clear of the board, and reports the engine\'s pick', async () => {
    reset({ player: { x: 150, y: 80 } });
    sis02Room();
    const r = await bridge.interact('hmi_ops_01');
    const [x, y] = globalThis.__clicks[0];
    assert.notDeepEqual([x, y], [144, 47], 'not the sprite origin');
    assert.ok(x > 144 && x < 172 && y > 49 && y < 70, `inside the HMI, below the board: ${x},${y}`);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual([r.picked.id, r.picked.matches], ['hmi_ops_01', true]);
    assert.equal(r.aim.clean, true);
});

test('picked says when the engine got something else, and null-matches a sprite with no id', () => {
    reset();
    I.setInteractStart(performance.now());
    window.handleObjectInteraction(obj('status_board', 0, 0, 1, 1));
    assert.equal(I.pickedTarget({ kind: 'object', id: 'hmi_ops_01' }).matches, false);
    reset();
    I.setInteractStart(performance.now());
    window.handleObjectInteraction({ getBounds: () => null });
    assert.equal(I.pickedTarget({ kind: 'object', id: 'hmi_ops_01' }).matches, null);
});

test('claimants skip hidden objects, KO\'d NPCs and the target door\'s far side; shut doors reach 64 px', () => {
    reset({ player: { x: 100, y: 100 } });
    const target = door('a', 'b', 100, 60);
    window.npcHostileSystem = { isNPCKO: (id) => id === 'ko' };
    window.rooms = {
        a: { objects: { near: obj('near', 110, 100, 8, 8), hidden: obj('hidden', 0, 0, 8, 8, { visible: false }) },
             npcSprites: [npc('ko', 0, 0), npc('awake', 300, 300)], doorSprites: [target, door('a', 'c', 150, 100)] },
        b: { objects: {}, npcSprites: [], doorSprites: [door('b', 'a', 100, 58), door('b', 'd', 300, 300, { open: true })] }
    };
    const c = I.otherClaimants(target);
    const by = Object.fromEntries(c.map(o => [o.id, o]));
    assert.deepEqual(Object.keys(by).sort(), ['awake', 'door:a->c', 'door:b->d', 'near']);
    assert.equal(by.near.inReach, true);
    assert.equal(by.awake.inReach, false);
    assert.equal(by['door:a->c'].inReach, true, 'shut, 50 px away');
    assert.equal(by['door:b->d'].inReach, false, 'open doors are never gathered');
    delete window.npcHostileSystem;
});

test('liveSpriteFor takes the live copy of an object id, not a hidden one listed first', () => {
    reset();
    const hiddenCopy = obj('item', 0, 0, 8, 8, { visible: false });
    const live = obj('item', 200, 200, 8, 8);
    window.rooms = { r1: { objects: { a: hiddenCopy } }, r2: { objects: { b: live } } };
    assert.equal(I.liveSpriteFor({ kind: 'object', id: 'item', x: 200, y: 200 }), live);
});

test('a handler call from a bridge click is move-triggered-interaction', async () => {
    reset();
    const pc = obj('trolley_pc', 160, 60, 40, 60);
    globalThis.__onClick = () => window.handleObjectInteraction(pc);
    const r = await bridge.moveTo(100, 100);
    assert.equal(r.reason, 'move-triggered-interaction', JSON.stringify(r));
    assert.equal(r.triggered.id, 'trolley_pc');
    assert.deepEqual([r.triggered.byClick.x, r.triggered.byClick.y], [100, 100]);
});

test('a far-tap use the click armed counts as the click\'s, even when it fires later', async () => {
    reset();
    const pc = obj('trolley_pc', 160, 60, 40, 60);
    globalThis.__onClick = () => { window.__pendingTapUse = () => ({ obj: pc }); };
    globalThis.__duringMove = async () => {
        await new Promise(r => setTimeout(r, 300));   // past the click's own window
        window.handleObjectInteraction(pc);
    };
    const r = await bridge.moveTo(100, 100);
    assert.equal(r.reason, 'move-triggered-interaction', JSON.stringify(r));
    assert.equal(r.triggered.byClick.armedTapUse, true);
});

test('something the game starts during a no-click walk is move-interrupted-by-game-event', async () => {
    reset();
    globalThis.__duringMove = () => { globalThis.__mg = { id: 'person-chat', title: 'Helen Marsh' }; };
    const r = await bridge.moveTo(100, 100, { pointer: false });
    assert.equal(globalThis.__clicks.length, 0, 'no click sent');
    assert.deepEqual(globalThis.__moves, [[100, 100]]);
    assert.equal(r.reason, 'move-interrupted-by-game-event', JSON.stringify(r));
    assert.equal(r.interrupted.opened.id, 'person-chat');
    assert.equal(r.triggered, undefined);
});

test('a handler call with no bridge click behind it is an interruption, not a triggered click', async () => {
    reset();
    const reader = obj('biometric_reader', 0, 0, 8, 8);
    // A delayed open from an earlier step fires mid-walk.
    globalThis.__duringMove = () => window.handleObjectInteraction(reader);
    const r = await bridge.moveTo(100, 100, { pointer: false });
    assert.equal(r.reason, 'move-interrupted-by-game-event');
    assert.equal(r.interrupted.id, 'biometric_reader');
});

test('a clean no-click walk is ok and drops the pending far-tap use and gate walk', async () => {
    reset();
    const dropped = [];
    window.__clearPendingTapUse = () => dropped.push('tap');
    window.__clearPendingGateWalk = () => dropped.push('gate');
    const r = await bridge.moveTo(100, 100, { pointer: false });
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.via, 'pathfinder-direct(no-click)');
    assert.deepEqual(dropped.sort(), ['gate', 'tap']);
    delete window.__clearPendingTapUse;
    delete window.__clearPendingGateWalk;
});

test('a no-click walk refuses an open interaction menu and preventPlayerMovement, as a click would', async () => {
    reset();
    globalThis.__menu = { items: ['A', 'B'] };
    const r1 = await bridge.moveTo(100, 100, { pointer: false });
    assert.equal(r1.reason, 'blocking-ui');
    globalThis.__menu = null;
    window.preventPlayerMovement = true;
    const r2 = await bridge.moveTo(100, 100, { pointer: false });
    assert.equal(r2.reason, 'movement-prevented');
    assert.deepEqual(globalThis.__moves, [], 'the player was not moved');
});

test('interact() hands back a pre-walk interruption instead of clicking into it', async () => {
    reset();
    sis02Room();
    globalThis.__scan = [{ kind: 'object', id: 'hmi_ops_01', name: 'HMI', x: 144, y: 47, inRange: false, onScreen: false }];
    globalThis.__onClick = null;
    globalThis.__duringMove = () => { globalThis.__mg = { id: 'phone-chat', title: 'Desk Phone' }; };
    const r = await bridge.interact('hmi_ops_01');
    assert.equal(r.phase, 'pre-walk', JSON.stringify(r));
    assert.equal(r.reason, 'move-interrupted-by-game-event');
    assert.equal(globalThis.__clicks.length, 1, 'only the walk into view clicked');
});
