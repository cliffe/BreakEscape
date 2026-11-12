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
const { keepsRouteAgainstPlayer, bodyNearWall, playerPushMode, PLAYER_WALL_MARGIN_PX, createNPCCollision } = mod;

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
function harness({ patrol = true, playerY = 100 } = {}) {
    let process = null, collide = null;
    const handlers = {};
    const scene = { physics: { add: { collider: (a, b, c, p) => { collide = c; process = p; } }, world: { on: (ev, fn) => { handlers[ev] = fn; } } } };
    const npc = { npcId: 'guard', body: { x: 100, y: 120, width: 16, height: 10, pushable: true } };
    const player = { currentRoom: 'r', body: { x: 100, y: playerY, width: 16, height: 10 } };
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
