// q53 (g): the player's body no longer shoves a routed or patrolling NPC off its route
// (systems/npc-sprites.js). For the player pair only, such an NPC is unpushable for one
// separation (pin); with the player against or near a wall the pair does not separate and the
// player slides past (an unpushable NPC would press the player into the 8 px wall boxes).
// The live path (Len in lab_physical_pentest, test-npc-patrol) is proved headless at setFPS(20).
// Run with: node test/js/npc-player-push.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-player-push-'));
writeFileSync(join(dir, 'constants.mjs'), readFileSync(join(js, 'utils/constants.js'), 'utf8'));
writeFileSync(join(dir, 'npc-direction.mjs'), readFileSync(join(js, 'systems/npc-direction.js'), 'utf8'));
writeFileSync(join(dir, 'npc-sprite-style.mjs'), readFileSync(join(js, 'systems/npc-sprite-style.js'), 'utf8'));
writeFileSync(join(dir, 'npc-sprites.mjs'), readFileSync(join(js, 'systems/npc-sprites.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants.mjs'")
    .replace("'./npc-direction.js'", "'./npc-direction.mjs'")
    .replace("'./npc-sprite-style.js'", "'./npc-sprite-style.mjs'"));

globalThis.window = { rooms: {} };
globalThis.Phaser = { AUTO: 0, Scale: { NONE: 0, CENTER_BOTH: 0, FIT: 0 }, Geom: { Rectangle: class { constructor(x, y, w, h) { Object.assign(this, { x, y, width: w, height: h }); } static Overlaps(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; } } } };
const quiet = console.log;
console.log = () => {};
const mod = await import(pathToFileURL(join(dir, 'npc-sprites.mjs')).href);
console.log = quiet;
const { keepsRouteAgainstPlayer, bodyNearWall, playerPushMode, PLAYER_WALL_MARGIN_PX, createNPCCollision, staticRectsNear } = mod;

test('who keeps a route against the player: patrol on, not hostile, not KO', () => {
    const patrol = { config: { patrol: { enabled: true } } };
    assert.equal(keepsRouteAgainstPlayer(patrol, 'g'), true);
    assert.equal(keepsRouteAgainstPlayer({ config: { patrol: { enabled: false } } }, 'g'), false);
    assert.equal(keepsRouteAgainstPlayer(null, 'g'), false);
    window.npcHostileSystem = { isNPCHostile: id => id === 'h', isNPCKO: id => id === 'k' };
    assert.equal(keepsRouteAgainstPlayer(patrol, 'h'), false);
    assert.equal(keepsRouteAgainstPlayer(patrol, 'k'), false);
    delete window.npcHostileSystem;
});

test('near a wall: within the margin on any side counts, further off does not', () => {
    assert.equal(PLAYER_WALL_MARGIN_PX, 12);
    const wall = [{ l: 0, t: 0, r: 320, b: 8 }];            // a north wall box 8 px deep
    const body = (y) => ({ x: 100, y, width: 16, height: 10 });
    assert.equal(bodyNearWall(body(9), wall), true, 'touching');
    assert.equal(bodyNearWall(body(19), wall), true, '11 px off');
    assert.equal(bodyNearWall(body(21), wall), false, '13 px off');
    assert.equal(bodyNearWall(body(40), []), false);
});

test('the rule: a plain NPC separates as before; a routed one pins, or lets the player slide by a wall', () => {
    assert.equal(playerPushMode({ routed: false, playerNearWall: true }), 'separate');
    assert.equal(playerPushMode({ routed: false, playerNearWall: false }), 'separate');
    assert.equal(playerPushMode({ routed: true, playerNearWall: false }), 'pin');
    assert.equal(playerPushMode({ routed: true, playerNearWall: true }), 'slide');
});

// The real collider: createNPCCollision's process callback on a fake scene
// A fake arcade overlapRect over a list of static bodies { x, y, width, height }
const overlapRectOver = (statics) => (x, y, w, h, dyn, stat) => !stat ? [] :
    statics.filter(b => x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y);

function harness({ patrol = true, playerY = 100, playerX = 100, statics = null } = {}) {
    let process = null, collide = null;
    const handlers = {};
    const scene = { physics: { add: { collider: (a, b, c, p) => { collide = c; process = p; } }, world: { on: (ev, fn) => { handlers[ev] = fn; } } } };
    if (statics) scene.physics.overlapRect = overlapRectOver(statics);
    const npc = { npcId: 'guard', body: { x: 100, y: 120, width: 16, height: 10, pushable: true } };
    const player = { currentRoom: 'r', body: { x: playerX, y: playerY, width: 16, height: 10 } };
    window.rooms = { r: { wallCollisionBoxes: [{ body: { left: 0, top: 0, right: 320, bottom: 8 } }] } };
    window.player = player;
    window.npcBehaviorManager = { getBehavior: () => ({ roomId: 'r', config: { patrol: { enabled: patrol } } }) };
    console.log = () => {};
    createNPCCollision(scene, npc, player);
    console.log = quiet;
    return { npc, player, process: () => process(npc, player), step: () => handlers.worldstep?.() };
}

test('collider: a patrolling NPC is unpushable for the player pair, and pushable again after the step', () => {
    const h = harness({ playerY: 100 });
    assert.equal(h.process(), true, 'they still collide: the player stops against him');
    assert.equal(h.npc.body.pushable, false);
    h.step();
    assert.equal(h.npc.body.pushable, true, 'NPC-NPC collisions see a pushable body again');
});

test('collider: with the player by a wall the pair does not separate (the player slides past)', () => {
    const h = harness({ playerY: 12 });
    assert.equal(h.process(), false);
    assert.equal(h.npc.body.pushable, true, 'never pinned');
});

test('collider: an NPC that does not patrol is pushed as before', () => {
    const h = harness({ patrol: false, playerY: 100 });
    assert.equal(h.process(), true);
    assert.equal(h.npc.body.pushable, true);
});

// Review R1 (G2): a desk or other static body in the path counts as a wall. Without it a pinned
// NPC walking the player into a desk in open floor would press the player between an unpushable
// body and a static one.
test('near a wall includes static furniture: a desk within the margin is near, one further off is not', () => {
    const desk = { x: 120, y: 60, width: 64, height: 24, enable: true };     // right edge at 184
    const scene = { physics: { overlapRect: overlapRectOver([desk]) } };
    const player = (x) => ({ x, y: 64, width: 16, height: 10 });
    assert.deepEqual(staticRectsNear(scene, player(190)), [{ l: 120, t: 60, r: 184, b: 84 }], '6 px off the desk');
    assert.equal(staticRectsNear(scene, player(200)).length, 0, '16 px off the desk');
    assert.equal(staticRectsNear(scene, player(190)).length > 0 && bodyNearWall(player(190), staticRectsNear(scene, player(190))), true);
    assert.equal(staticRectsNear({ physics: { overlapRect: overlapRectOver([{ ...desk, enable: false }]) } }, player(190)).length, 0, 'a disabled body (an open gate) does not count');
    assert.deepEqual(staticRectsNear({}, player(190)), [], 'no physics: nothing');
});

test('collider: a patrolling NPC walking the player into a desk in open floor lets the player slide, never pins', () => {
    // open floor: the only wall box is the north one at y 0..8, far from the player at y 100
    const desk = { x: 60, y: 96, width: 36, height: 24, enable: true };      // desk just west of the player (right edge 96, player at 100)
    const h = harness({ playerX: 100, playerY: 100, statics: [desk] });
    assert.equal(h.process(), false, 'by the desk the pair do not separate');
    assert.equal(h.npc.body.pushable, true, 'never pinned against furniture');
    const far = harness({ playerX: 100, playerY: 100, statics: [{ ...desk, x: 20 }] });   // desk 44 px off
    assert.equal(far.process(), true, 'away from the desk the NPC holds as before');
    assert.equal(far.npc.body.pushable, false);
    far.step();
});
