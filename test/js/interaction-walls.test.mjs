// No interacting through walls (interaction-walls.js), and NPCs don't turn to
// face a player they can't see (npc-behavior.js canSeePlayerToFace). Both use
// the occupancy grids of npc-sight-occlusion.js.
// The rooms copy m01: reception at (0,0) and the main office to the north at
// (0,-256), both 10x10 tiles, stacked so the main office's bottom two rows
// (y 0-64) overlap reception's back wall. Sarah stands at the reception desk
// just below that wall; the bug was talking to her from inside the main office.
// Run with: node --test test/js/interaction-walls.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
const silently = fn => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

const occMod = await import(dataUrl(readFileSync(join(js, 'systems/npc-sight-occlusion.js'), 'utf8')));
const walls = await import(dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8')));
const { SightOcclusion, buildRoomSightGrid, segmentClear } = occMod;
const { interactionLineClear, wallClearFrom, interactionTargetPoint, findClearStandPoint } = walls;

const dir = mkdtempSync(join(tmpdir(), 'interaction-walls-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
writeFileSync(join(dir, 'npc-behavior.mjs'), readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'"));
const { default: behaviorModule } = await silently(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;

// Wall rows as m01 has them: row 0 empty, row 1 the back wall (door gap at
// col 1), side columns from row 2, the south row full except the door gap.
function layer(rows, cols = 10) {
    return { layer: { data: rows.map(r => [...r].map(c => ({ index: c === '1' ? 1 : -1 }))) } };
}
const RECEPTION_WALLS = ['0000000000', '0011111110', ...Array(7).fill('1000000001'), '1111111111'];
const OFFICE_WALLS = ['0000000000', '0011111100', ...Array(6).fill('1000000001'), '0000000001', '1011111111'];
function room(x, y, rows, extra = {}) {
    return {
        position: { x, y },
        map: { width: 10, height: 10, tileWidth: 32, tileHeight: 32 },
        wallsLayers: [layer(rows)], objects: {}, npcSprites: [], doorSprites: [], collisionBodies: [], ...extra
    };
}
const npcSprite = (id, fx, fy) => ({
    _isNPC: true, npcId: id, x: fx, y: fy - 31, displayWidth: 40, displayHeight: 80, originX: 0.5, originY: 0.5,
    body: { center: { x: fx, y: fy } }
});
const objSprite = (id, x, y, w, h, extra = {}) => ({
    objectId: id, x, y, displayWidth: w, displayHeight: h, originX: 0.5, originY: 0.5, active: true, ...extra
});
const playerAt = (fx, fy) => ({ x: fx, y: fy - 31, body: { center: { x: fx, y: fy } } });

function m01({ doors = [] } = {}) {
    const reception = room(0, 0, RECEPTION_WALLS, { doorSprites: doors });
    const office = room(0, -256, OFFICE_WALLS);
    const sarah = npcSprite('sarah', 128, 72);
    reception.npcSprites.push(sarah);
    window.rooms = { reception_area: reception, main_office_area: office };
    const occ = new SightOcclusion();
    window.npcSightOcclusion = occ;
    return { reception, office, sarah, occ };
}

test('Sarah through the main office wall: no; from reception: yes', () => {
    const { sarah } = m01();
    // Player as close as the main office lets them get (feet y 50, wall foot 56-64)
    assert.equal(interactionLineClear(playerAt(128, 50), sarah), false, 'from inside the main office');
    assert.equal(interactionLineClear(playerAt(140, 44), sarah), false, 'diagonal from the main office');
    assert.equal(interactionLineClear(playerAt(128, 96), sarah), true, 'from in front of her desk');
    assert.equal(interactionLineClear(playerAt(100, 80), sarah), true, 'from beside her');
});

test('through the open doorway between the rooms: yes; through a closed door: no', () => {
    const { reception } = m01();
    const clerk = npcSprite('clerk', 48, 86);   // just south of the north door gap (col 1)
    reception.npcSprites.push(clerk);
    assert.equal(interactionLineClear(playerAt(48, 46), clerk), true, 'standing in the open doorway');
    const door = { x: 48, y: 48, displayWidth: 32, displayHeight: 32, originX: 0.5, originY: 0.5, active: true,
        doorProperties: { direction: 'north', open: false }, body: { enable: true, x: 32, y: 32, width: 32, height: 32 } };
    reception.doorSprites.push(door);
    window.npcSightOcclusion.invalidate();
    assert.equal(interactionLineClear(playerAt(48, 20), clerk), false, 'the closed door is in the way');
    assert.equal(interactionLineClear(playerAt(48, 20), door), true, 'the door itself is always usable');
});

test('a noticeboard on the back wall is used from the floor in front of it', () => {
    const { reception } = m01();
    // Hung on reception's back wall: sprite y 32-56, wholly over the wall tiles
    const board = objSprite('reception_notice', 200, 44, 32, 24, { roomId: 'reception_area', elevation: 20 });
    reception.objects.reception_notice = board;
    const p = interactionTargetPoint(board, { x: 200, y: 90 });
    assert.ok(p.y > 64 && p.y < 72, `pulled down to the floor line, got ${p.y}`);
    assert.equal(interactionLineClear(playerAt(200, 80), board), true, 'from in front, in reception');
    assert.equal(interactionLineClear(playerAt(200, 50), board), false, 'from the main office side');
});

test('a filing cabinet against the back wall, used from beside it; props never block', () => {
    const { reception } = m01();
    const cabinet = objSprite('cab', 240, 52, 32, 56, { roomId: 'reception_area', texture: { key: 'filing_cabinet' } });
    const rack = objSprite('rack', 180, 90, 32, 64, { roomId: 'reception_area', texture: { key: 'rack' }, body: { x: 164, y: 100, width: 32, height: 22 } });
    reception.objects.cab = cabinet;
    reception.objects.rack = rack;
    assert.equal(interactionLineClear(playerAt(210, 78), cabinet), true, 'from beside it');
    assert.equal(interactionLineClear(playerAt(240, 100), cabinet), true, 'from in front of it');
    const desk = objSprite('desk', 128, 100, 64, 32, { roomId: 'reception_area' });
    assert.equal(interactionLineClear(playerAt(128, 76), desk), true, 'a desk from behind it (above it on screen)');
});

test('an object on a side wall is reached from the floor beside it', () => {
    const { reception } = m01();
    // East wall column is x 288-320; a panel hanging half over it
    const panel = objSprite('panel', 292, 150, 24, 32, { roomId: 'reception_area' });
    reception.objects.panel = panel;
    assert.equal(interactionLineClear(playerAt(270, 170), panel), true);
});

test('wallClearFrom: no occlusion module loaded means the old distance-only answer', () => {
    const { sarah } = m01();
    delete window.npcSightOcclusion;
    assert.equal(wallClearFrom({ x: 128, y: 50 }, sarah), true);
    assert.equal(wallClearFrom({ x: 128, y: 50 }, { scenarioData: {}, name: 'temp' }), true, 'container temp sprite with no position');
});

test('clicking Sarah from the main office walks round to her side', () => {
    const { sarah } = m01();
    const player = playerAt(128, 50);
    // Pathfinder stub: everywhere is walkable except the wall's collision band
    // (the player's feet stop above y 52 in the main office and below y 66 in reception)
    const pfm = { findNearestWalkableWorldCell: (x, y) => (y > 52 && y < 66 ? null : { x, y }) };
    const stand = findClearStandPoint(sarah, player, pfm, 32);
    assert.ok(stand, 'found a stand point');
    assert.ok(stand.y > 64, `stand point is in reception (feet y ${stand.y})`);
    assert.equal(wallClearFrom(stand, sarah), true);
    assert.ok(Math.hypot(stand.x - 0 - sarah.x, stand.y - 31 - sarah.y) <= 28, 'and within reach');
});

test('sight grid: the back wall no longer hides someone at the foot of the room to the north', () => {
    const { reception, office, occ } = m01();
    // A guard in the main office looking at the player standing on its south row,
    // over reception's back wall face
    assert.equal(occ.isClearBetween({ x: 128, y: -40 }, { x: 128, y: 50 }), true);
    // Seen from inside reception the wall still stops a ray at its foot
    const [north] = occ.clipFan({ x: 128, y: 120 }, [-Math.PI / 2], 300);
    assert.ok(north >= 52 && north <= 60, `north ray ${north}`);
    // And the dividing wall still blocks sight between the rooms
    assert.equal(occ.isClearBetween({ x: 128, y: 50 }, { x: 128, y: 80 }), false);
    assert.equal(segmentClear([buildRoomSightGrid(reception, [], { thinBackWall: false })], 128, 50, 128, 20), false,
        'thinBackWall: false keeps the old full-tile wall');
    void office;
});

// NPC turning to face the player
function behaviour({ npcFeet, los = undefined }) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'sarah';
    b.direction = 'down';
    b.sprite = { x: npcFeet.x, y: npcFeet.y - 31, body: { center: { ...npcFeet }, setVelocity() {} } };
    b.config = silently(() => b.parseConfig({}));
    b.npcBodyPos = () => ({ ...npcFeet });
    b.playAnimation = () => {};
    b._stopOnArrival = false;
    window.npcManager = { getNPC: () => (los === undefined ? { id: 'sarah' } : { id: 'sarah', los }) };
    window.npcHostileSystem = { isNPCHostile: () => false, isNPCKO: () => false };
    return b;
}

test('an NPC does not turn to face a player on the other side of a wall', () => {
    m01();
    const b = behaviour({ npcFeet: { x: 128, y: 72 } });
    assert.equal(b.determineState({ x: 128, y: 50 }), 'idle', 'player in the main office, behind the wall');
    b._faceSightAt = undefined;
    b.direction = 'down';
    b.facePlayer({ x: 128, y: 50 });
    assert.equal(b.direction, 'down', 'facePlayer() itself refuses too');
    b._faceSightAt = undefined;
    assert.equal(b.determineState({ x: 128, y: 110 }), 'face_player', 'player in reception');
    b.facePlayer({ x: 90, y: 72 });
    assert.equal(b.direction, 'left');
});

test('an NPC with an los block uses its sight occlusion (props too); occlusion: false sees through', () => {
    const { reception } = m01();
    // A rack between guard and player, both in reception
    const rack = objSprite('rack', 160, 120, 32, 64, { texture: { key: 'rack' }, body: { x: 144, y: 136, width: 32, height: 16 } });
    reception.objects.rack = rack;
    const player = { x: 160, y: 190 };
    const guard = behaviour({ npcFeet: { x: 160, y: 100 }, los: { enabled: true, range: 200, angle: 120 } });
    assert.equal(guard.determineState(player), 'idle', 'the rack hides the player from a guard with los');
    const plain = behaviour({ npcFeet: { x: 160, y: 100 } });
    assert.equal(plain.determineState(player), 'face_player', 'without los only walls count');
    const xray = behaviour({ npcFeet: { x: 160, y: 100 }, los: { enabled: true, occlusion: false } });
    assert.equal(xray.determineState({ x: 128, y: 50 }), 'face_player', 'occlusion: false turns even through the wall');
});
