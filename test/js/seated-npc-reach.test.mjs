// E from beside a seated NPC's chair (interactions.js tryInteractWithNearest, tryInteractWithNPC):
//   - a seated NPC is reached from her seat (its nearest edge), so E talks to her and tryInteractWithNPC accepts her
//   - a seat with no free place and its sitter on it is skipped; a sofa with a free place is not
//   - a reserved-but-empty chair (she is walking over) gives her no seat reach and hides nothing
// Real interactions.js and interaction-reach.js, everything else stubbed (as interaction-reach-wall-mounted).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

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
const { tryInteractWithNearest, tryInteractWithNPC } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

// Player at (100, 100) facing down (both targets need a turn, so the aim shows in faceCalls). A chair spans x 110..140 (nearest edge 10 px away); Amara's centre is 60 px away.
const chair = (extra = {}) => ({ x: 110, y: 90, displayWidth: 30, displayHeight: 30, originX: 0, originY: 0,
    active: true, interactable: true, visible: true, scenarioData: { id: 'chair' }, ...extra });
const amara = (extra = {}) => ({ x: 160, y: 100, npcId: 'amara', _isNPC: true, active: true, visible: true, ...extra });

function setup({ seat, npc, seated = true }) {
    globalThis.__faceCalls = [];
    globalThis.__handled = [];
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: { c: seat }, npcSprites: [npc] };
    window.player = { x: 100, y: 100, direction: 'down' };
    window.seating = { isSeat: (o) => o === seat, currentSeat: () => null, trySit: () => false, standUp() { globalThis.__stood = true; } };
    window.npcBehaviorManager = { getBehavior: (id) => (id === 'amara' && seated ? { _seat: { chair: seat } } : {}) };
    window.npcHostileSystem = { isNPCKO: () => false, isNPCHostile: () => false };
    window.npcManager = { getNPC: () => null };
}
const aimed = () => globalThis.__faceCalls.map(([x, y]) => `${x},${y}`);
const press = () => { try { tryInteractWithNearest(); } catch (e) { /* the use itself is stubbed out */ } };

test('E beside her chair: she is reached from her seat, so E turns to her', () => {
    const seat = chair({ seatedBy: 'amara' });
    setup({ seat, npc: amara() });
    press();
    assert.deepEqual(aimed(), ['160,100'], 'aimed at Amara, not at the chair');
});

test('tryInteractWithNPC accepts a seated NPC measured to her seat, and refuses one not on it', () => {
    const seat = chair({ seatedBy: 'amara' });
    const npc = amara();
    setup({ seat, npc });
    assert.equal(tryInteractWithNPC(npc), true, 'seated, seat in reach');
    setup({ seat, npc, seated: false });
    assert.equal(tryInteractWithNPC(npc), false, 'standing 60 px off: out of range');
});

test('a reserved-but-empty chair does not route E to the NPC walking over to it', () => {
    const seat = chair({ seatedBy: 'amara' });   // reservation only: her behaviour holds no _seat
    setup({ seat, npc: amara(), seated: false });
    press();
    assert.equal(aimed().length, 1, 'the chair is the one target: ' + aimed());
    assert.ok(!aimed().includes('160,100'), 'she is not reached: ' + aimed());
});

test('E beside a two-place sofa with one sitter does not skip the sofa (a place is free)', () => {
    const seat = chair({ _places: { 0: 'amara' } });
    setup({ seat, npc: amara() });
    press();
    assert.deepEqual(aimed(), ['160,100'], 'she wins by score (the sofa carries the seat penalty) and is reachable from the sofa');
});

test('a reserved chair stays an ordinary chair for E: it is aimed at, not skipped', () => {
    const seat = chair({ seatedBy: 'amara' });
    setup({ seat, npc: amara({ x: 400, y: 100 }), seated: false });
    press();
    assert.equal(aimed().length, 1, 'the chair is the one target: ' + aimed());
    assert.ok(!aimed().includes('400,100'));
});
