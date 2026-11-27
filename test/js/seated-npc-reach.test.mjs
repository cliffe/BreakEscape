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
const { tryInteractWithNearest, tryInteractWithNPC, isObjectInInteractionRange } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

// Player at (100, 100) facing down (both targets need a turn, so the aim shows in faceCalls). A chair spans x 110..140 (nearest edge 10 px away); Amara's centre is 60 px away.
const chair = (extra = {}) => ({ x: 110, y: 90, width: 30, height: 30, displayWidth: 30, displayHeight: 30, originX: 0, originY: 0,
    active: true, interactable: true, visible: true, scenarioData: { id: 'chair' }, ...extra });
const amara = (extra = {}) => ({ x: 160, y: 100, npcId: 'amara', _isNPC: true, active: true, visible: true, ...extra });

function setup({ seat, npc, seated = true, place = null, player = { x: 100, y: 100, direction: 'down' } }) {
    globalThis.__faceCalls = [];
    globalThis.__handled = [];
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: { c: seat }, npcSprites: [npc] };
    window.player = { ...player };
    window.seating = { isSeat: (o) => o === seat, currentSeat: () => null, trySit: () => false, standUp() { globalThis.__stood = true; } };
    window.npcBehaviorManager = { getBehavior: (id) => (id === 'amara' && seated ? { _seat: place === null ? { chair: seat } : { chair: seat, seat: { places: [[10, 0], [50, 0]] }, place } } : {}) };
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

// A 60 px sofa at x 110..170: place feet at (120,120) and (160,120). Amara sits on place 0.
const sofa = () => chair({ width: 60, displayWidth: 60, _places: { 0: 'amara' } });

test('E beside a two-place sofa near her place talks to her (m3)', () => {
    const seat = sofa();
    setup({ seat, npc: amara({ x: 120, y: 105 }), place: 0 });
    press();
    assert.deepEqual(aimed(), ['120,105'], 'aimed at Amara, not at the sofa: ' + aimed());
});

test('E beside the free place of a sofa with a sitter sits, even with her centre in reach (m3)', () => {
    const seat = sofa();
    setup({ seat, npc: amara({ x: 150, y: 100 }), place: 0, player: { x: 170, y: 110, direction: 'down' } });
    press();
    assert.equal(aimed().length, 1, aimed());
    assert.ok(!aimed().includes('150,100'), 'the sofa, not Amara: ' + aimed());
});

test('a sofa measures to her own place: its far end does not reach her (m2)', () => {
    const seat = sofa();
    const npc = amara({ x: 400, y: 100 });
    setup({ seat, npc, place: 0, player: { x: 180, y: 110, direction: 'down' } });
    assert.equal(tryInteractWithNPC(npc), false, '65 px from her place foot, 15 from the sofa edge (the old edge rule reached her)');
    setup({ seat, npc, place: 0, player: { x: 100, y: 110, direction: 'down' } });
    assert.equal(tryInteractWithNPC(npc), true, '20 px from her place');
});

test('the tap and the talk icon reach follow her place on a sofa, as E does (m2)', () => {
    const seat = sofa();
    const npc = amara({ x: 400, y: 100 });
    setup({ seat, npc, place: 0, player: { x: 180, y: 110, direction: 'down' } });
    assert.equal(isObjectInInteractionRange(npc), false, 'tap: 65 px from her place, 15 from the sofa edge');
    setup({ seat, npc, place: 0, player: { x: 100, y: 110, direction: 'down' } });
    assert.equal(isObjectInInteractionRange(npc), true, 'tap: 20 px from her place');
});

test('the talk icon, the tap and E share one decision for a free place that wins (R3 n1)', () => {
    const seat = sofa();
    const npc = amara({ x: 150, y: 100 });
    setup({ seat, npc, place: 0, player: { x: 170, y: 110, direction: 'down' } });
    assert.equal(isObjectInInteractionRange(npc), false, 'clearly nearer the free place: not her');
    assert.equal(tryInteractWithNPC(npc), false);
    setup({ seat, npc, place: 0, player: { x: 140, y: 110, direction: 'down' } }); // 20 from hers, 20 from free: inside the margin
    assert.equal(isObjectInInteractionRange(npc), true, 'inside the margin: her');
    // The talk icon (checkObjectInteractions) goes through the same function, not the bare NPC reach
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(src, /const distanceSq = seatedNpcReachDistSq\(player, sprite, npcReachDistSq\(/, 'icon reach is the shared one');
});

test('standing on her figure or just below her, E talks to her; the free place needs a clear margin', () => {
    const seat = sofa();
    const her = { x: 120, y: 105 };
    for (const [x, y] of [[120, 105], [125, 117], [128, 112]]) {
        setup({ seat, npc: amara(her), place: 0, player: { x, y, direction: 'down' } });
        press();
        assert.deepEqual(aimed(), ['120,105'], `at ${x},${y}: aimed at Amara: ${aimed()}`);
    }
    // Facing the sofa's far side, her centre is 146 degrees off and the sofa 79: the plain chair penalty (30000) would hand E to the sofa
    setup({ seat, npc: amara(her), place: 0, player: { x: 135, y: 115, direction: 'right' } });
    press();
    assert.deepEqual(aimed(), ['120,105'], 'facing away from her: still her, the sofa yields: ' + aimed());
    setup({ seat, npc: amara(her), place: 0, player: { x: 160, y: 110, direction: 'down' } });
    press();
    assert.ok(!aimed().includes('120,105'), 'at the free place foot: the sofa: ' + aimed());
});

test('the free-place test measures the foot point (body centre), not the sprite centre', () => {
    const seat = sofa();
    const npc = amara({ x: 120, y: 105 });
    // Sprite centre nearer her place (26.9 against 39 px), but the feet (body centre) are 8 px from the free place's foot, 32 from hers
    setup({ seat, npc, place: 0, player: { x: 130, y: 95, direction: 'down', body: { center: { x: 152, y: 120 } } } });
    assert.equal(isObjectInInteractionRange(npc), false, 'feet by the free place: not her');
    window.player = { x: 130, y: 95, direction: 'down' };
    assert.equal(isObjectInInteractionRange(npc), true, 'with no body the sprite point stands in: hers');
});

test('a three-place bench: the free place wins only against every sitter (n2)', () => {
    const seat = chair({ width: 90, displayWidth: 90, _places: { 0: 'amara', 1: 'bo' } });
    const npc = amara({ x: 120, y: 105 });
    setup({ seat, npc, place: 0, player: { x: 100, y: 110, direction: 'down' } });
    window.npcBehaviorManager.getBehavior = (id) => (id === 'amara' ? { _seat: { chair: seat, seat: { places: [[10, 0], [50, 0], [80, 0]] }, place: 0 } } : { _seat: { chair: seat, seat: { places: [[10, 0], [50, 0], [80, 0]] }, place: 1 } });
    seat._places = { 0: 'amara', 1: 'bo' };
    // Player by the free end (x 190 = place 2's foot) is nearer it than both sitters
    window.player = { x: 190, y: 120, direction: 'down' };
    assert.equal(isObjectInInteractionRange(npc), false, 'beyond both sitters: free end');
});

test('a three-place bench, sitters on places 0 and 1: beside place 1, E talks to that sitter though free place 2 is nearer than place 0 (R4 m1)', () => {
    const seat = chair({ width: 90, displayWidth: 90, _places: { 0: 'amara', 1: 'bo' } });
    const npc = amara({ x: 120, y: 105 });
    const bo = amara({ x: 160, y: 105, npcId: 'bo' });
    setup({ seat, npc, place: 0, player: { x: 165, y: 100, direction: 'up' } });
    globalThis.__testRooms.r.npcSprites = [npc, bo];
    const places = [[10, 0], [50, 0], [80, 0]];
    window.npcBehaviorManager.getBehavior = (id) => ({ _seat: { chair: seat, seat: { places }, place: id === 'amara' ? 0 : 1 } });
    // x 165: 5 px from place 1's foot (160), 25 from free place 2 (190), 45 from place 0 (120)
    press();
    assert.deepEqual(aimed(), ['160,105'], 'aimed at the place-1 sitter, not the bench: ' + aimed());
});

test('the tap path reaches a seated NPC through her seat, as E does (m1)', () => {
    const seat = chair({ seatedBy: 'amara' });
    const npc = amara();
    setup({ seat, npc });
    assert.equal(isObjectInInteractionRange(npc), true, 'seat in reach, centre 60 px away');
    setup({ seat, npc, seated: false });
    assert.equal(isObjectInInteractionRange(npc), false, 'not on the seat');
});

test('a full sofa with both sitters on it is skipped; E picks a sitter (n1)', () => {
    const seat = chair({ width: 60, displayWidth: 60, seatedBy: 'full', _places: { 0: 'amara', 1: 'bo' } });
    setup({ seat, npc: amara({ x: 120, y: 105 }), place: 0 });
    press();
    assert.deepEqual(aimed(), ['120,105']);
});

test('a reserved chair stays an ordinary chair for E: it is aimed at, not skipped', () => {
    const seat = chair({ seatedBy: 'amara' });
    setup({ seat, npc: amara({ x: 400, y: 100 }), seated: false });
    press();
    assert.equal(aimed().length, 1, 'the chair is the one target: ' + aimed());
    assert.ok(!aimed().includes('400,100'));
});

test('a knocked-out sitter is not reached and does not hide her chair (n1)', () => {
    const seat = chair({ seatedBy: 'amara' });
    setup({ seat, npc: amara() });
    window.npcHostileSystem.isNPCKO = () => true;
    press();
    assert.ok(!aimed().includes('160,100'), 'not aimed at the KO sitter: ' + aimed());
});

test('a hostile sitter reached through her seat is struck, not talked to (n1)', () => {
    const seat = chair({ seatedBy: 'amara' });
    const npc = amara();
    setup({ seat, npc });
    window.npcHostileSystem.isNPCHostile = () => true;
    globalThis.__hits = 0;
    window.playerCombat = { attack() { globalThis.__hits++; } };
    assert.equal(tryInteractWithNPC(npc), true);
    assert.equal(globalThis.__hits, 1);
});
