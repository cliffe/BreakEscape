// Two adjacent objects (a filing cabinet beside a safe). A tap on A from two tiles away must end
// in A's interaction on arrival; E while the player is turned to A must pick A even when B scores
// better on the quantised facing. Uses the real interactions.js, interaction-reach.js and tap-pick.js.
//
// Run with: node test/js/tap-target-neighbour.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPendingTapUse, objectStandPoint } from '../../public/break_escape/js/systems/tap-pick.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

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
globalThis.window = {};
const { isObjectInInteractionRange, tryInteractWithNearest } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

const mk = (id, x, y) => ({ x, y, displayWidth: 0, originX: 0.5, active: true, interactable: true, visible: true,
    name: id, objectId: id, scenarioData: { id, name: id, type: 'safe' } });
const A = mk('cabinet', 100, 120);
const B = mk('safe', 130, 120);

// handleObjectInteraction logs "OBJECT INTERACTION" with the sprite name before anything else
function interactedWith(fn) {
    const seen = [];
    const orig = console.log;
    console.log = (...a) => { if (a[0] === 'OBJECT INTERACTION') seen.push(a[1].name); };
    try { fn(); } catch (e) { /* the interaction itself is mostly stubbed */ } finally { console.log = orig; }
    return seen;
}
function setRoom() {
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: { a: A, b: B } };
}

test('without an aim, E takes the neighbour that scores better on the quantised facing (the old behaviour)', () => {
    setRoom();
    window.player = { x: 124, y: 110, direction: 'down' };
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['safe']);
});

test('E while turned to A picks A even though B scores better on the facing', () => {
    setRoom();
    window.player = { x: 124, y: 110, direction: 'down', faceAim: { obj: A, dir: 'down', px: 124, py: 110 } };
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['cabinet']);
});

test('the aim lapses once the player has moved or turned', () => {
    setRoom();
    window.player = { x: 136, y: 110, direction: 'down', faceAim: { obj: A, dir: 'down', px: 124, py: 110 } };
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['safe'], 'moved 12 px');
    window.player = { x: 124, y: 110, direction: 'right', faceAim: { obj: A, dir: 'down', px: 124, py: 110 } };
    assert.notDeepEqual(interactedWith(tryInteractWithNearest), ['cabinet'], 'turned');
});

test('an aim at something out of reach does not pull E to it', () => {
    setRoom();
    const far = mk('far', 400, 400);
    window.player = { x: 124, y: 110, direction: 'down', faceAim: { obj: far, dir: 'down', px: 124, py: 110 } };
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['safe']);
});

test('a tap on A from two tiles away uses A on arrival, then E keeps A', () => {
    setRoom();
    window.player = { x: 124, y: 40, direction: 'down' };
    const player = window.player;
    const used = [];
    let moving = true;
    const pending = createPendingTapUse({
        inReach: (o) => isObjectInInteractionRange(o),
        isMoving: () => moving,
        // what game.js useObjectInReach does: turn to the object, remembering it, then use it
        use: (o) => { player.faceAim = { obj: o, dir: player.direction, px: player.x, py: player.y }; used.push(...interactedWith(() => window.handleObjectInteraction?.(o) ?? tryInteractWithNearest())); },
        busy: () => false
    });
    const stand = objectStandPoint(A, player, { range: 32 });
    pending.arm(A, 0);
    pending.update(10);
    assert.deepEqual(used, [], 'still walking');
    player.x = stand.x; player.y = stand.y; moving = false;
    assert.equal(isObjectInInteractionRange(A), true, 'the stand point is in reach of A');
    assert.equal(isObjectInInteractionRange(B), true, 'and of the neighbour too');
    pending.update(20);
    assert.equal(pending.get(), null);
    assert.deepEqual(used, ['cabinet'], 'the tapped object is used on arrival, not its neighbour');
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['cabinet'], 'E at the arrival spot opens the tapped one');
});

test('facePlayerToward records the object it turned to (source check)', () => {
    const p = readFileSync(join(js, 'core/player.js'), 'utf8');
    assert.match(p, /export function facePlayerToward\(targetX, targetY, targetObj = null\)/);
    assert.match(p, /player\.faceAim = targetObj \?/);
    const g = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(g, /facePlayerToward\(aimX\(obj\), obj\.y, obj\)/);
});
