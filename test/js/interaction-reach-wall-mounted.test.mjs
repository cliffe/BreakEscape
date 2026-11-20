// reachY (systems/interaction-reach.js): the vertical counterpart of reachX, opt-in through
// "wallMounted": true on a scenario object. A back-wall power socket is 48 px tall (plate high
// on the wall, cable down to the floor line); reach used to be measured to its top edge only,
// so with the sprite's bottom on the skirting a tap walk stopped out of reach.
//
//   - reachY clamps the player's y into the sprite's vertical span, for wallMounted objects only.
//   - Unmarked objects (bookcases, vending machines), NPCs and doors keep sprite.y.
//   - isObjectInInteractionRange (the real interactions.js, real interaction-reach.js) reaches
//     the socket from below, the left and the right, and still refuses a far player.
//   - objectStandPoint judges stand points with the same measure when given deps.reachY.
//   - The test bridge (state.js, index.js) mirrors reachY wherever it mirrors reachX.
//
// Run with: node test/js/interaction-reach-wall-mounted.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { reachY, reachX } from '../../public/break_escape/js/systems/interaction-reach.js';
import { objectStandPoint } from '../../public/break_escape/js/systems/tap-pick.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// A back-wall socket as placed in cable_room: top-left (108, 16), 32x48, bottom on the floor line (64)
const socket = { x: 108, y: 16, displayWidth: 32, displayHeight: 48, originX: 0, originY: 0,
    scenarioData: { id: 'ian_socket', wallMounted: true } };
// The same sprite without the opt-in, as a bookcase or vending machine is
const plain = { ...socket, scenarioData: { id: 'bookcase' } };

test('reachY: inside the span the player y is used, outside it the nearest edge', () => {
    assert.equal(reachY(socket, 40), 40);
    assert.equal(reachY(socket, 55), 55);
    assert.equal(reachY(socket, 90), 64);
    assert.equal(reachY(socket, 0), 16);
});

test('reachY: an unmarked floor-standing object clamps too; NPCs, doors and missing data keep sprite.y', () => {
    assert.equal(reachY(plain, 55), 55, 'the wallMounted mark is no longer needed');
    assert.equal(reachY(plain, 90), 64);
    assert.equal(reachY({ ...socket, _isNPC: true }, 55), 16);
    assert.equal(reachY({ ...socket, doorProperties: {} }, 55), 16);
    assert.equal(reachY({ ...socket, scenarioData: undefined }, 55), 16);
    assert.equal(reachY({ ...socket, scenarioData: { wallMounted: 'yes' } }, 55), 55, 'the mark changes nothing');
    assert.equal(reachY({ ...socket, displayHeight: 0, height: 0 }, 55), 16);
    assert.equal(reachY(socket, NaN), 16);
    assert.equal(reachY({ ...socket, rotation: 1.57 }, 55), 16);
});

test('reachY: a centred origin is respected', () => {
    const o = { ...socket, y: 40, originY: 0.5 };
    assert.equal(reachY(o, 0), 16);
    assert.equal(reachY(o, 100), 64);
});

test('reachY only ever shortens a reach', () => {
    for (let y = -40; y <= 140; y += 3) {
        assert.ok(Math.abs(reachY(socket, y) - y) <= Math.abs(socket.y - y), `y ${y}`);
    }
});

// ---------------------------------------------------------------------------
// The real isObjectInInteractionRange, with the real interaction-reach.js and the engine's
// 32 px range; everything else interactions.js imports is stubbed.
// ---------------------------------------------------------------------------
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const dir = mkdtempSync(join(tmpdir(), 'reachy-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=32, INTERACTION_RANGE_SQ=1024, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms = (globalThis.__testRooms = {});',
    '../core/player.js': 'export function facePlayerToward(x, y){ (globalThis.__faceCalls ||= []).push([x, y]); }',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    './apply-actions.js': 'export function applyActions(){}',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(p, s, d){return d;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(){ return ""; }',
    './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
    './interaction-reach.js': readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8'),
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    '../utils/display-dashes.js': 'export function displayDashes(s){ return s; }',
    '../utils/escape-html.js': 'export function escapeHtml(s){ return String(s ?? ""); }',
    './inventory-menu.js': 'export function hasTriggerOnInteract(){return false;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
    const before = src;
    src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    if (src === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'interactions.mjs'), src);
globalThis.window = {};
const { isObjectInInteractionRange, tryInteractWithNearest } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const inRange = (obj, x, y) => { window.player = { x, y, direction: 'up' }; return isObjectInInteractionRange(obj); };

test('isObjectInInteractionRange: a wall-mounted socket is reached where a tap walk stops (below, left, right)', () => {
    // Player sprite centre at y 45-55 under a back wall; 38 pressed against it
    assert.equal(inRange(socket, 120, 55), true, 'below');
    assert.equal(inRange(socket, 120, 38), true, 'pressed to the wall');
    assert.equal(inRange(socket, 90, 50), true, 'from the left');
    assert.equal(inRange(socket, 160, 50), true, 'from the right');
});

test('isObjectInInteractionRange: the same sprite unmarked is reached the same way (floor-standing props too)', () => {
    assert.equal(inRange(plain, 120, 55), true);
    assert.equal(inRange(plain, 160, 50), true);
    assert.equal(inRange(plain, 120, 97), false, 'still out of reach from afar');
});

test('isObjectInInteractionRange: a wall-mounted socket is still out of reach from afar', () => {
    assert.equal(inRange(socket, 120, 97), false, 'more than 32 px below the floor line');
    assert.equal(inRange(socket, 60, 50), false, 'more than 32 px to the left');
    assert.equal(inRange(socket, 120, 95), true, 'within 32 px of the floor line');
});

// Review R3 m1: scoring and the turn use the top edge (faceY), only the range uses reachY
test('E key: a player level with the cable, facing up, is not turned sideways towards the clamped point', () => {
    globalThis.__faceCalls = [];
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: { s: { ...socket, active: true, interactable: true, visible: true } } };
    window.player = { x: 124, y: 55, direction: 'up' };
    try { tryInteractWithNearest(); } catch (e) { /* the use itself is stubbed out; only the turn matters */ }
    const calls = globalThis.__faceCalls;
    // Aimed at the top edge (y 16) the socket is straight ahead: no turn. At the clamped point (y 55) it is level: a turn to y 55
    assert.deepEqual(calls.filter(([, y]) => y === 55), [], `turned towards the clamped point: ${JSON.stringify(calls)}`);
    assert.deepEqual(calls, [], 'facing up at a socket above needs no turn');
});

// ---------------------------------------------------------------------------
// objectStandPoint: with deps.reachY the stand points are judged as the arrival check judges them
// ---------------------------------------------------------------------------
test('objectStandPoint: with reachY a stand point under a back-wall socket counts as in reach', () => {
    const player = { x: 120, y: 160, body: { center: { x: 120, y: 191 } } };
    // Walkable floor starts at feet y 76 (sprite centre 45): every aim above it snaps down
    const findCell = (x, y) => ({ x, y: Math.max(y, 76) });
    const reachYDep = (o, y) => reachY(o, y);
    const t = objectStandPoint(socket, player, { range: 32, findCell, reachY: reachYDep });
    const cy = t.y - 31;
    const dx = socket.x - t.x, dy = reachY(socket, cy) - cy;
    assert.ok(Math.hypot(dx, dy) <= 28, `ends in reach by the arrival measure: ${JSON.stringify(t)}`);
    // The real check from the stand point (x is measured to the nearest part as well)
    assert.equal(inRange(socket, t.x, cy), true);
});

test('objectStandPoint: approaching a tall socket from the side, the cell level with its lower part is accepted only with reachY (deps given)', () => {
    const player = { x: 40, y: 70, body: { center: { x: 40, y: 101 } } };
    // Two walkable strips at sprite centre y 40-55 (feet 71-86): one 20 px left of the plate (sprite centre x 88),
    // one further along (x 100, a gap in the furniture). The aim (x 95.5) snaps to the first.
    const findCell = (x, y) => ({ x: x <= 96 ? 88 : 100, y: Math.min(Math.max(y, 71), 86) });
    const withY = objectStandPoint(socket, player, { range: 32, findCell, reachY: (o, y) => reachY(o, y) });
    const without = objectStandPoint(socket, player, { range: 32, findCell });
    // New measure: 20 px from the plate, inside the 28 px margin, so the aimed cell is returned as it is
    const scy = withY.y - 31;
    assert.ok(Math.hypot(socket.x - withY.x, reachY(socket, scy) - scy) <= 28, `ends in reach by the arrival measure: ${JSON.stringify(withY)}`);
    // Old top-edge measure: that cell is 31 px from the top-left corner, over the margin, so the walk settles on another cell
    assert.notDeepEqual(without, withY, 'the old top-edge measure rejects the aimed cell');
});

test('objectStandPoint: without reachX/reachY deps an object is judged by its position, as before', () => {
    const player = { x: 120, y: 160 };
    const findCell = (x, y) => ({ x, y });
    const a = objectStandPoint(plain, player, { range: 32, findCell });
    const b = objectStandPoint({ ...plain, scenarioData: undefined }, player, { range: 32, findCell, reachY: (o, y) => reachY(o, y), reachX: (o, x) => reachX(o, x) });
    assert.deepEqual(a, b, 'a sprite with no scenario data is measured to its position either way');
});

// ---------------------------------------------------------------------------
// The test bridge mirrors the engine: every place it measures to reachX for an object's
// distance also measures to reachY (or the playtests would disagree with the game).
// ---------------------------------------------------------------------------
test('test bridge: state.js and index.js measure y with reachY wherever they measure x with reachX', () => {
    const state = readFileSync(join(js, 'systems/test-bridge/state.js'), 'utf8');
    const index = readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8');
    assert.match(state, /import \{ reachX, reachY, aimX, TALL_PROP_PX \} from '\.\.\/interaction-reach\.js'/);
    assert.match(index, /import \{ reachX, reachY \} from '\.\.\/interaction-reach\.js'/);
    assert.match(state, /const ry = reachY\(sprite, py\);[\s\S]{0,80}const d = dist\(px, py, rx, ry\);/, 'describeObject');
    assert.match(state, /const ty = target \? reachY\(target, sy\) : targetY;/, 'solveStandingPointWhere');
    assert.match(state, /rivalY\(o, sy\)/, 'rivals');
    assert.match(index, /const ey = targetSprite \? reachY\(targetSprite, pk\.y\) : entity\.y;/, 'moveToNear nudges');
    assert.match(index, /targetSprite \? reachY\(targetSprite, p2\.y\) : after\.y/, 'moveToNear landing check');
});

test('engine: the range checks and the E key measure y with reachY, the facing angle aims at the centre (aimY)', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(src, /const dy = reachYSeated\(obj, player, window\.seating\?\.currentSeat\?\.\(\)\) - py;/, 'highlight');
    assert.match(src, /getInteractionDistance\(player, reachX\(sprite, player\.x\), reachYSeated\(sprite, player, window\.seating\?\.currentSeat\?\.\(\)\)\)/, 'handleObjectInteraction');
    const reach = readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8');
    assert.match(src, /pickInteractable\(player, /, 'E key uses the shared pick');
    assert.match(reach, /consider\('object', reachX\(obj, px\), reachYSeated\(obj, player, seatedOn\), INTERACTION_RANGE_SQ, null, obj, aimX\(obj\), aimY\(obj\)\)/, 'E key and info label (shared pick)');
    assert.match(src, /const dy = reachYSeated\(sprite, player, player === window\.player \? window\.seating\?\.currentSeat\?\.\(\) : null\) - player\.y;/, 'isObjectInInteractionRange');
    const label = readFileSync(join(js, 'ui/info-label.js'), 'utf8');
    assert.match(label, /pickInteractable\(player, /, 'info label uses the shared pick');
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /reachX: \(o, x\) => reachX\(o, x\),[\s\S]{0,120}reachY: \(o, y\) => reachY\(o, y\)/, 'walkToObjectThenUse passes reachY to objectStandPoint');
    assert.equal(typeof reachX, 'function');
});

// ---------------------------------------------------------------------------
// Behaviour: the real solveStandingPoint (test-bridge/state.js, its imports stubbed) samples
// stand points round every edge of a tall wall-mounted target, not only its top edge.
// ---------------------------------------------------------------------------
const stateStubs = {
    './input.js': 'export const isWorldPointOnScreen = () => true; export const getCanvas = () => null;',
    '../npc-reach.js': 'export const staticNpcBodyDistSq = () => 0;',
    '../interaction-walls.js': 'export const interactionLineClear = () => true; export const wallClearFrom = () => true; export const sameRoomFrom = () => true; export const playerFeet = (p) => p;',
    '../interaction-reach.js': readFileSync(join(js, 'systems/interaction-reach.js'), 'utf8'),
    '../doors.js': 'export const calculateDoorPositionsForRoom = () => [];',
    '../../utils/constants.js': 'export const TILE_SIZE = 32, INTERACTION_RANGE = 32, DOOR_INTERACTION_RANGE = 64;',
};
let stateSrc = readFileSync(join(js, 'systems/test-bridge/state.js'), 'utf8');
for (const [spec, body] of Object.entries(stateStubs)) {
    const before = stateSrc;
    stateSrc = stateSrc.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    if (stateSrc === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
writeFileSync(join(dir, 'bridge-state.mjs'), stateSrc);
const { solveStandingPoint } = await import(pathToFileURL(join(dir, 'bridge-state.mjs')).href);

// A tall fixture: top-left (200, 20), 32 wide, 96 tall (span y 20..116). Only the cells left of
// it and level with its lower part are walkable, 70 px or more below its top edge.
const tall = (wallMounted) => ({ x: 200, y: 20, displayWidth: 32, displayHeight: 96, originX: 0, originY: 0,
    scenarioData: { id: 'tall_fixture', ...(wallMounted ? { wallMounted: true } : {}) } });
function walkOnlyLeftOfLowerPart() {
    const step = 4, cols = 100, rows = 60, grid = [];
    for (let cy = 0; cy < rows; cy++) {
        grid.push(Array.from({ length: cols }, (_, cx) => (cx * step >= 150 && cx * step < 190 && cy * step >= 90 && cy * step < 130) ? 0 : 1));
    }
    window.pathfindingManager = { worldGrid: grid, worldGridBounds: { minX: 0, minY: 0, step } };
}

test('solveStandingPoint: a tall wall-mounted target is approached from beside its lower part', () => {
    walkOnlyLeftOfLowerPart();
    const t = tall(true);
    const p = solveStandingPoint(t.x, t.y, 170, 200, { x: 0, y: 0 }, t);
    assert.ok(p, 'a stand point is found');
    assert.ok(p.y >= 90 && p.x < 190, `stand point ${p.x},${p.y} is in the walkable cells beside the lower part`);
    assert.ok(p.predictedDistance <= 32 * 0.9, 'and in reach by the reachY measure');
});

test('solveStandingPoint: the same sprite unmarked is approached from beside its lower part too', () => {
    walkOnlyLeftOfLowerPart();
    const t = tall(false);
    const p = solveStandingPoint(t.x, t.y, 170, 200, { x: 0, y: 0 }, t);
    assert.ok(p && p.y >= 90 && p.x < 190, `chose ${p && p.x},${p && p.y}`);
    delete window.pathfindingManager;
});
