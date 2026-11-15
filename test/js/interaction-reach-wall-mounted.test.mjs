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

test('reachY: unmarked objects, NPCs, doors and missing data keep sprite.y', () => {
    assert.equal(reachY(plain, 55), 16);
    assert.equal(reachY({ ...socket, _isNPC: true }, 55), 16);
    assert.equal(reachY({ ...socket, doorProperties: {} }, 55), 16);
    assert.equal(reachY({ ...socket, scenarioData: undefined }, 55), 16);
    assert.equal(reachY({ ...socket, scenarioData: { wallMounted: 'yes' } }, 55), 16, 'only true opts in');
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
    '../core/rooms.js': 'export const rooms={};',
    '../core/player.js': 'export function facePlayerToward(){}',
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
const { isObjectInInteractionRange } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const inRange = (obj, x, y) => { window.player = { x, y, direction: 'up' }; return isObjectInInteractionRange(obj); };

test('isObjectInInteractionRange: a wall-mounted socket is reached where a tap walk stops (below, left, right)', () => {
    // Player sprite centre at y 45-55 under a back wall; 38 pressed against it
    assert.equal(inRange(socket, 120, 55), true, 'below');
    assert.equal(inRange(socket, 120, 38), true, 'pressed to the wall');
    assert.equal(inRange(socket, 90, 50), true, 'from the left');
    assert.equal(inRange(socket, 160, 50), true, 'from the right');
});

test('isObjectInInteractionRange: the same sprite unmarked is out of reach from there, as before', () => {
    assert.equal(inRange(plain, 120, 55), false);
    assert.equal(inRange(plain, 160, 50), false);
});

test('isObjectInInteractionRange: a wall-mounted socket is still out of reach from afar', () => {
    assert.equal(inRange(socket, 120, 97), false, 'more than 32 px below the floor line');
    assert.equal(inRange(socket, 60, 50), false, 'more than 32 px to the left');
    assert.equal(inRange(socket, 120, 95), true, 'within 32 px of the floor line');
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

test('objectStandPoint: without reachY an unmarked object is judged by its top edge, as before', () => {
    const player = { x: 120, y: 160 };
    const findCell = (x, y) => ({ x, y });
    const a = objectStandPoint(plain, player, { range: 32, findCell });
    const b = objectStandPoint(plain, player, { range: 32, findCell, reachY: (o, y) => reachY(o, y) });
    assert.deepEqual(a, b, 'reachY changes nothing for an unmarked object');
});

// ---------------------------------------------------------------------------
// The test bridge mirrors the engine: every place it measures to reachX for an object's
// distance also measures to reachY (or the playtests would disagree with the game).
// ---------------------------------------------------------------------------
test('test bridge: state.js and index.js measure y with reachY wherever they measure x with reachX', () => {
    const state = readFileSync(join(js, 'systems/test-bridge/state.js'), 'utf8');
    const index = readFileSync(join(js, 'systems/test-bridge/index.js'), 'utf8');
    assert.match(state, /import \{ reachX, reachY, aimX \} from '\.\.\/interaction-reach\.js'/);
    assert.match(index, /import \{ reachX, reachY \} from '\.\.\/interaction-reach\.js'/);
    assert.match(state, /const ry = reachY\(sprite, py\);[\s\S]{0,80}const d = dist\(px, py, rx, ry\);/, 'describeObject');
    assert.match(state, /const ty = target \? reachY\(target, sy\) : targetY;/, 'solveStandingPointWhere');
    assert.match(state, /rivalY\(o, sy\)/, 'rivals');
    assert.match(index, /const ey = targetSprite \? reachY\(targetSprite, pk\.y\) : entity\.y;/, 'moveToNear nudges');
    assert.match(index, /targetSprite \? reachY\(targetSprite, p2\.y\) : after\.y/, 'moveToNear landing check');
});

test('engine: the range checks and the E key measure y with reachY, the facing angle keeps the top edge', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(src, /const dy = reachY\(obj, py\) - py;/, 'highlight');
    assert.match(src, /getInteractionDistance\(player, reachX\(sprite, player\.x\), reachY\(sprite, player\.y\)\)/, 'handleObjectInteraction');
    assert.match(src, /consider\(reachX\(obj, px\), reachY\(obj, py\), \(\) => handleObjectInteraction\(obj\), INTERACTION_RANGE_SQ, null, obj, aimX\(obj\), obj\.y\)/, 'E key');
    assert.match(src, /const dy = reachY\(sprite, player\.y\) - player\.y;/, 'isObjectInInteractionRange');
    const label = readFileSync(join(js, 'ui/info-label.js'), 'utf8');
    assert.match(label, /consider\(reachX\(obj, px\), reachY\(obj, py\), text, INTERACTION_RANGE_SQ, obj, aimX\(obj\), obj\.y\)/, 'info label');
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /reachY: \(o, y\) => reachY\(o, y\)/, 'walkToObjectThenUse passes reachY to objectStandPoint');
    assert.equal(typeof reachX, 'function');
});
