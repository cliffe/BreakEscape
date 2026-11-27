// A tall floor-standing prop against the back wall (m01 derek_cabinet, filing_cabinet_locked2,
// 29x47 in the game, origin 0,0) is reached at its footprint, not its top edge. Reach used to be measured
// to the top: with the player's feet unable to go above y 69 the top was ~58 px away at best, so
// a tap walk stopped short ("Can't reach it from here.") and E opened the safe beside it instead.
// Uses the real interactions.js, interaction-reach.js, interaction-walls.js and tap-pick.js.
//
// Run with: node --max-old-space-size=2048 test/js/tap-target-floor-prop-reach.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPendingTapUse, objectStandPoint } from '../../public/break_escape/js/systems/tap-pick.js';
import { reachX, reachY } from '../../public/break_escape/js/systems/interaction-reach.js';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const dir = mkdtempSync(join(tmpdir(), 'floorprop-'));
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
    './interaction-walls.js': readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8'),
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
const occMod = await import(dataUrl(readFileSync(join(js, 'systems/npc-sight-occlusion.js'), 'utf8')));

// m01 geometry, room-relative, scenario origin (0,0): the cabinet 29x47 (the texture size rooms.js uses, not the
// 29x60 in the Tiled object) with its top at 10.75 (bottom 57.75), the safe beside it 24x30 at x 108.5-132.5, top 35.5
const mk = (id, x, y, w, h) => ({ x, y, displayWidth: w, displayHeight: h, originX: 0, originY: 0, active: true,
    interactable: true, visible: true, name: id, objectId: id, scenarioData: { id, name: id, type: 'safe' } });
const cabinet = mk('derek_cabinet', 79.5, 10.75, 29, 47);
const safe = mk('derek_safe', 108.5, 35.5, 24, 30);
// The player sprite is 31 px above the feet; the walkable floor starts at feet y 69 (the cabinet's footprint and the back wall)
const FOOT = 31;
const playerAtFeet = (fx, fy, direction = 'up') => ({ x: fx, y: fy - FOOT, direction, body: { center: { x: fx, y: fy } } });
// The walkable cells: feet y >= 69, on a 32 px grid whose first row below the base is feet y 80
const findCell = (x, y) => ({ x, y: Math.max(Math.round((y - 16) / 32) * 32 + 16, 80) });
const standDeps = (extra = {}) => ({ range: 32, findCell, reachX: (o, x) => reachX(o, x), reachY: (o, y) => reachY(o, y), ...extra });

function interactedWith(fn) {
    const seen = [];
    const orig = console.log;
    console.log = (...a) => { if (a[0] === 'OBJECT INTERACTION') seen.push(a[1].name); };
    try { fn(); } catch (e) { /* the interaction itself is mostly stubbed */ } finally { console.log = orig; }
    return seen;
}
function setRoom(...objs) {
    for (const k of Object.keys(globalThis.__testRooms)) delete globalThis.__testRooms[k];
    globalThis.__testRooms.r = { objects: Object.fromEntries(objs.map((o) => [o.objectId, o])) };
}

test('the cabinet is in reach from the first walkable row in front of it, at any x along its width', () => {
    for (const fx of [82, 94, 106]) {
        window.player = playerAtFeet(fx, 80);
        assert.equal(isObjectInInteractionRange(cabinet), true, `feet ${fx},80`);
    }
    window.player = playerAtFeet(94, 200);
    assert.equal(isObjectInInteractionRange(cabinet), false, 'still out of reach from afar');
});

test('a tap on the cabinet from the south finds a stand point and uses the cabinet on arrival', () => {
    setRoom(cabinet, safe);
    window.player = playerAtFeet(96, 200);
    const player = window.player;
    const stand = objectStandPoint(cabinet, player, standDeps());
    assert.ok(stand, 'a stand point');
    const used = [];
    let moving = true;
    const pending = createPendingTapUse({
        inReach: (o) => isObjectInInteractionRange(o),
        isMoving: () => moving,
        use: (o) => used.push(...interactedWith(() => window.handleObjectInteraction?.(o))),
        busy: () => false
    });
    pending.arm(cabinet, 0);
    pending.update(10);
    assert.deepEqual(used, [], 'still walking');
    // arrive at the stand point
    player.x = stand.x; player.y = stand.y - FOOT; player.body.center = { x: stand.x, y: stand.y }; moving = false;
    assert.equal(isObjectInInteractionRange(cabinet), true, `the stand point ${JSON.stringify(stand)} is in reach`);
    pending.update(20);
    assert.equal(pending.get(), null, 'the use was not dropped');
    assert.deepEqual(used, ['derek_cabinet']);
});

test('a tap from the side also finds a stand point in reach of the cabinet', () => {
    for (const fx of [20, 250]) {
        window.player = playerAtFeet(fx, 130);
        const stand = objectStandPoint(cabinet, window.player, standDeps());
        window.player = playerAtFeet(stand.x, stand.y);
        assert.equal(isObjectInInteractionRange(cabinet), true, `from x ${fx}: ${JSON.stringify(stand)}`);
    }
});

test('E facing the cabinet from in front of it picks the cabinet', () => {
    setRoom(cabinet, safe);
    window.player = playerAtFeet(96, 80);
    assert.equal(isObjectInInteractionRange(safe), true, 'the safe is in reach too');
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['derek_cabinet']);
});

test('E facing the safe still picks the safe', () => {
    setRoom(cabinet, safe);
    window.player = playerAtFeet(122, 80);
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['derek_safe']);
    window.player = playerAtFeet(140, 80, 'left');
    assert.deepEqual(interactedWith(tryInteractWithNearest), ['derek_safe']);
});

test('wall-mounted objects behave as before (the mark is no longer needed, nothing else changes)', () => {
    const socket = { ...mk('socket', 108, 16, 32, 48), scenarioData: { id: 'socket', wallMounted: true } };
    assert.equal(reachY(socket, 40), 40);
    assert.equal(reachY(socket, 90), 64);
    assert.equal(reachY(socket, 0), 16);
    window.player = { x: 120, y: 55, direction: 'up' };
    assert.equal(isObjectInInteractionRange(socket), true);
    window.player = { x: 120, y: 97, direction: 'up' };
    assert.equal(isObjectInInteractionRange(socket), false);
    // NPCs and doors keep their own position
    assert.equal(reachY({ ...socket, _isNPC: true }, 55), 16);
    assert.equal(reachY({ ...socket, doorProperties: {} }, 55), 16);
});

// The m01 stack: reception at (0,0), the main office north at (0,-256), both 10x10 tiles, the office's
// bottom two rows overlapping reception's back wall (see interaction-walls.test.mjs)
test('nothing becomes reachable across a wall: a cabinet whose top pokes into the back wall is refused from the room behind', () => {
    const layer = (rows) => ({ layer: { data: rows.map(r => [...r].map(c => ({ index: c === '1' ? 1 : -1 }))) } });
    const RECEPTION = ['0000000000', '0011111110', ...Array(7).fill('1000000001'), '1111111111'];
    const OFFICE = ['0000000000', '0011111100', ...Array(6).fill('1000000001'), '0000000001', '1011111111'];
    const room = (x, y, rows) => ({ position: { x, y }, map: { width: 10, height: 10, tileWidth: 32, tileHeight: 32 },
        wallsLayers: [layer(rows)], objects: {}, npcSprites: [], doorSprites: [], collisionBodies: [] });
    const reception = room(0, 0, RECEPTION);
    const cab = { ...mk('wall_cab', 200, 10.75, 29, 47), roomId: 'reception_area', texture: { key: 'filing_cabinet' } };
    reception.objects.wall_cab = cab;
    window.rooms = { reception_area: reception, main_office_area: room(0, -256, OFFICE) };
    window.npcSightOcclusion = new occMod.SightOcclusion();
    try {
        // Feet in the main office just above its bottom wall: level with the cabinet's span, 0 px from it by reachY
        window.player = playerAtFeet(210, 50);
        assert.equal(Math.hypot(reachX(cab, 210) - 210, reachY(cab, 50 - FOOT) - (50 - FOOT)), 0, 'in reach by distance alone');
        assert.equal(isObjectInInteractionRange(cab), false, 'refused: the wall and the room boundary are between');
        // From in front of it in reception it is reachable
        window.player = playerAtFeet(210, 96);
        assert.equal(isObjectInInteractionRange(cab), true);
    } finally {
        delete window.rooms; delete window.npcSightOcclusion;
    }
});
