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
const { clearPlayerOfNpc, blockPlayerIntoNpc, keepsRouteAgainstPlayer, bodyNearWall, playerPushMode, PLAYER_WALL_MARGIN_PX, createNPCCollision, staticRectsNear, npcIsMoving } = mod;

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

test('the rule: a plain NPC separates as before; a routed one pins, or blocks / passes the player by a wall', () => {
    assert.equal(playerPushMode({ routed: false, playerNearWall: true }), 'separate');
    assert.equal(playerPushMode({ routed: false, playerNearWall: false }), 'separate');
    assert.equal(playerPushMode({ routed: true, playerNearWall: false }), 'pin');
    assert.equal(playerPushMode({ routed: true, playerNearWall: true }), 'block');
    assert.equal(playerPushMode({ routed: true, playerNearWall: true, npcMoving: false }), 'slide', 'stopped NPC by a wall: never blocks');
    assert.equal(playerPushMode({ routed: true, playerNearWall: false, npcMoving: false }), 'pin');
});

// The real collider: createNPCCollision's process callback on a fake scene
// A fake arcade overlapRect over a list of static bodies { x, y, width, height }
// A fake arcade body whose x and y read through position, as Phaser's do
const fakeBody = (x, y, extra = {}) => { const position = { x, y }; return { get x() { return position.x; }, get y() { return position.y; }, width: 16, height: 10, position, ...extra }; };
const overlapRectOver = (statics) => (x, y, w, h, dyn, stat) => !stat ? [] :
    statics.filter(b => x < b.x + b.width && x + w > b.x && y < b.y + b.height && y + h > b.y);

function harness({ patrol = true, playerY = 100, playerX = 100, statics = null, behavior = null, npcX = 100, npcY = 120, prev = null, moving = true, doors = [], others = [] } = {}) {
    let process = null, collide = null;
    const handlers = {};
    const scene = { physics: { add: { collider: (a, b, c, p) => { collide = c; process = p; } }, world: { on: (ev, fn) => { handlers[ev] = fn; } } } };
    if (statics) scene.physics.overlapRect = overlapRectOver(statics);
    const npc = { npcId: 'guard', body: { x: npcX, y: npcY, width: 16, height: 10, pushable: true, velocity: { x: 0, y: moving ? -40 : 0 } } };
    const player = { currentRoom: 'r', body: fakeBody(playerX, playerY, { prev: prev || { x: playerX, y: playerY }, velocity: { x: 0, y: 0 } }) };
    window.rooms = { r: {
        wallCollisionBoxes: [{ body: { left: 0, top: 0, right: 320, bottom: 8 } }],
        doorSprites: doors.map(d => ({ doorInfo: { connectedRoom: 'r2' }, body: { enable: true, ...d } })),
        npcSprites: others.map(o => ({ npcId: 'other', body: { enable: true, width: 16, height: 10, ...o } })),
    }, r2: { wallCollisionBoxes: [{ body: { left: 0, top: 200, right: 320, bottom: 208 } }] } };
    window.player = player;
    window.npcBehaviorManager = { getBehavior: () => behavior || ({ roomId: 'r', config: { patrol: { enabled: patrol } } }) };
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

test('collider: with the player by a wall the pair does not separate (no push)', () => {
    const h = harness({ playerY: 12 });
    assert.equal(h.process(), false);
    assert.equal(h.npc.body.pushable, true, 'never pinned');
});

// q53 wall case: the old no-separation rule let the player walk straight through the NPC by a wall.
const stepInto = (extra = {}) => harness({ playerX: 100, playerY: 18, npcX: 100, npcY: 22, prev: { x: 100, y: 34 }, ...extra });
test('collider: by a wall the player is blocked by the NPC, never passed through', () => {
    // player walked up from y 34 to y 18 into an NPC at y 22 (body rects overlap); the wall is at y 0..8
    const h = stepInto();
    assert.equal(h.process(), false, 'no separation: nothing presses the player into the wall');
    assert.equal(h.player.body.position.y, 34, 'the step into the NPC is undone');
    assert.equal(h.player.body.velocity.y, 0);
    assert.equal(h.npc.body.y, 22, 'the NPC is not moved');
    assert.equal(h.npc.body.pushable, true);
});

test('blockPlayerIntoNpc: closes in only is undone; stepping away or along is left alone', () => {
    const npc = { x: 100, y: 24, width: 16, height: 10 };
    const body = (x, y, px, py) => ({ x, y, width: 16, height: 10, prev: { x: px, y: py }, velocity: { x: 5, y: 5 }, position: { x, y } });
    const away = body(100, 40, 100, 30);
    assert.equal(blockPlayerIntoNpc(away, npc), false, 'moving away');
    assert.equal(away.position.y, 40);
    const diag = body(96, 30, 110, 40);                         // closing on both axes
    assert.equal(blockPlayerIntoNpc(diag, npc), true);
    const slideAlong = body(112, 30, 100, 30);                  // the x spans already overlapped before the step, so no axis closed in: left alone
    assert.equal(blockPlayerIntoNpc(slideAlong, npc), false);
    const noPrev = { x: 1, y: 1, width: 16, height: 10 };
    assert.equal(blockPlayerIntoNpc(noPrev, npc), false);
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
    assert.equal(staticRectsNear({ physics: { overlapRect: overlapRectOver([{ ...desk, enable: false }]) } }, player(190)).length, 0, 'a disabled body does not count');
    assert.deepEqual(staticRectsNear({}, player(190)), [], 'no physics: nothing');
});

test('collider: a patrolling NPC walking the player into a desk in open floor lets the player pass, never pins', () => {
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

// Code review R2 (M1), the user's q53 call: "the player not shoving routed NPCs". A needs errand
// and the walk home after a push both go through goToAndStay, which turns patrol on for the walk
// and off on arrival, so they are routed NPCs too. Accepted on purpose: while an office NPC walks
// an errand the player stops against it in open floor and passes through it by a wall or desk;
// standing still at its spot it is pushed as before.
test('goToAndStay turns patrol on for the walk (needs errands and the walk home use it)', () => {
    const src = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8');
    const body = src.slice(src.indexOf('goToAndStay(worldX, worldY, speed, opts = {}) {'));
    assert.ok(body.length > 0, 'goToAndStay found');
    const head = body.slice(0, body.indexOf('this._stopOnArrival = true'));
    assert.match(head, /this\.config\.patrol\.enabled = true;\s*$/, 'patrol is enabled just before the stop-on-arrival flag');
    const needs = readFileSync(join(js, 'systems/npc-needs.js'), 'utf8');
    assert.match(needs, /goToAndStay\(id, x, y, speed, \{ owner: 'needs'/, 'needs errands walk through goToAndStay');
});

test('collider: a needs errand walker is held like a patrol: pin in open floor, pass by a desk, pushed once arrived', () => {
    // the shape goToAndStay leaves on a needs errand (npc-behavior.js)
    const walking = () => ({ roomId: 'r', _moveOwner: 'needs', _stopOnArrival: true, config: { patrol: { enabled: true, waypoints: [{ tileX: 3, tileY: 3 }] } } });
    const open = harness({ playerY: 100, behavior: walking() });
    assert.equal(open.process(), true, 'open floor: they collide, the player stops against the walker');
    assert.equal(open.npc.body.pushable, false, 'the walker keeps its line');
    open.step();
    assert.equal(open.npc.body.pushable, true);

    const desk = { x: 60, y: 96, width: 36, height: 24, enable: true };
    const byDesk = harness({ playerX: 100, playerY: 100, statics: [desk], behavior: walking() });
    assert.equal(byDesk.process(), false, 'by a desk the player passes through the walker: never trapped');
    assert.equal(byDesk.npc.body.pushable, true);

    const byWall = harness({ playerY: 12, behavior: walking() });
    assert.equal(byWall.process(), false, 'by a wall the pair do not separate');

    const arrived = walking();
    arrived.config.patrol.enabled = false; arrived._stopOnArrival = false; arrived._moveOwner = undefined;
    const still = harness({ playerY: 100, behavior: arrived });
    assert.equal(still.process(), true);
    assert.equal(still.npc.body.pushable, true, 'arrived: pushed as before');
});

// The NPC walks into a player who stands still beside a wall: pushed out the free way, never into the wall
test('clearPlayerOfNpc: the player is moved clear of the NPC by the shortest way that hits no wall', () => {
    const wall = [{ l: 0, t: 0, r: 320, b: 8 }];
    const npc = { x: 100, y: 20, width: 16, height: 10 };
    const up = fakeBody(100, 12);   // overlaps; clear-above would be y -0.5 (in the wall)
    assert.equal(clearPlayerOfNpc(up, npc, wall), true);
    assert.ok(up.position.y >= 8, 'not pressed into the wall box');
    assert.equal(up.position.y + up.height <= npc.y || up.position.x + up.width <= npc.x || up.position.x >= npc.x + npc.width || up.position.y >= npc.y + npc.height, true, 'clear of the NPC');
    const apart = fakeBody(200, 40);
    assert.equal(clearPlayerOfNpc(apart, npc, wall), false, 'not overlapping: untouched');
    const boxed = fakeBody(100, 12);
    const box = wall.concat([{ l: 60, t: 0, r: 100, b: 100 }, { l: 116, t: 0, r: 160, b: 100 }, { l: 0, t: 30, r: 320, b: 100 }, { l: 0, t: 8, r: 320, b: 11 }]);
    assert.equal(clearPlayerOfNpc(boxed, npc, box), false, 'no free way out: nothing moves');
    assert.equal(boxed.position.y, 12);
});

// USB foothold fix (lab_physical_pentest games 8412 to 8420): an NPC squeezing past the player
// (npc-behavior.js isPassingPlayer) neither separates from the player nor settles on the contact.
test('collider: an NPC squeezing past the player does not collide with the player at all', () => {
    const passing = { roomId: 'r', config: { patrol: { enabled: true } }, isPassingPlayer: () => true };
    const h = harness({ playerY: 100, behavior: passing });
    assert.equal(h.process(), false, 'no separation while passing');
    assert.equal(h.npc.body.pushable, true, 'not pinned either');
    const done = { roomId: 'r', config: { patrol: { enabled: true } }, isPassingPlayer: () => false };
    const after = harness({ playerY: 100, behavior: done });
    assert.equal(after.process(), true, 'clear of the player: the body block is back');
});

// Review R1 fixes (M1, M3, m1, m3, R2)
const clear = (b, o) => !(b.position.x < o.x + o.width && b.position.x + b.width > o.x && b.position.y < o.y + o.height && b.position.y + b.height > o.y);

test('collider: an NPC walking into a standing player by a wall moves him out of the way, by at most the overlap depth, never into the wall box', () => {
    // player 12..22 stands still (prev = now); the NPC at y 20 walks into him: 2 px deep in y, 16 in x
    const h = harness({ playerX: 100, playerY: 12, npcX: 100, npcY: 20 });
    assert.equal(h.process(), false);
    const b = h.player.body;
    assert.equal(clear(b, h.npc.body), true, 'clear of the NPC');
    assert.ok(b.position.y >= 8, 'not in the north wall box (0..8)');
    assert.ok(Math.abs(b.position.y - 12) <= 2.2 && b.position.x === 100, 'moved the overlap depth, away from the NPC, no teleport past it');
    assert.equal(h.npc.body.y, 20, 'the NPC is not moved');
});

test('collider: no far-side move: with the near way blocked the player stays put rather than jumping through the NPC', () => {
    // wall right above (box 0..11) and the NPC overlapping 2 deep in y: only a x move of 16 px would clear it; that is a candidate too, so block it with a door
    const h = harness({ playerX: 100, playerY: 12, npcX: 100, npcY: 20, doors: [{ x: 70, y: 12, width: 28, height: 10 }, { x: 118, y: 12, width: 20, height: 10 }] });
    window.rooms.r.wallCollisionBoxes = [{ body: { left: 0, top: 0, right: 320, bottom: 11 } }];
    h.process();
    assert.deepEqual([h.player.body.position.x, h.player.body.position.y], [100, 12], 'nothing clear: overlap is the accepted fallback');
});

test('collider: a closed door beside the player is never moved into', () => {
    // player 92..108 x 60..70, NPC 100..116 x 62..72; the nearest way out (left 8.1 px) is a closed door
    const h = harness({ playerX: 92, playerY: 60, npcX: 100, npcY: 62, doors: [{ x: 70, y: 40, width: 20, height: 50 }] });
    h.process();
    const b = h.player.body;
    assert.equal(clear(b, { x: 70, y: 40, width: 20, height: 50 }), true, 'not in the door');
    assert.equal(clear(b, h.npc.body), true, 'clear of the NPC');
    assert.deepEqual([b.position.x, b.position.y < 60], [92, true], 'went the other free way (up), not through the door');
});

test('collider: a second NPC beside the player is never moved into', () => {
    const other = { x: 92, y: 50, width: 16, height: 10 };            // directly above the player: blocks the up way
    const h = harness({ playerX: 92, playerY: 60, npcX: 100, npcY: 62, doors: [{ x: 70, y: 40, width: 20, height: 50 }], others: [other] });
    h.process();
    assert.deepEqual([h.player.body.position.x, h.player.body.position.y], [92, 60], 'every way out blocked: nothing moves');
});

test('collider: the next room\'s walls count at a doorway (m3)', () => {
    // the player is 5 px above r2's wall box (y 200..208); the NPC walks into him from below... near-wall must see r2
    const h = harness({ playerX: 100, playerY: 190, npcX: 100, npcY: 198, prev: { x: 100, y: 180 }, doors: [{ x: 300, y: 0, width: 10, height: 10 }] });
    h.process();
    assert.equal(h.player.body.position.y, 180, 'by the neighbouring room\'s wall the block applies: the step into the NPC is undone');
});

test('collider: a paused patrol in a corridor lets the player pass (never a soft-lock)', () => {
    const h = stepInto({ moving: false });
    assert.equal(h.process(), false);
    assert.equal(h.player.body.position.y, 18, 'step not undone');
    const walking = stepInto({ moving: true });
    walking.process();
    assert.equal(walking.player.body.position.y, 34, 'the same step against a walking NPC is blocked');
});

test('npcIsMoving: velocity, isMoving or an active path walk; a paused or dwelling NPC is not moving', () => {
    assert.equal(npcIsMoving({ velocity: { x: 0, y: -40 } }, null), true);
    assert.equal(npcIsMoving({ velocity: { x: 0, y: 0 } }, { isMoving: true }), true);
    assert.equal(npcIsMoving({ velocity: { x: 0, y: 0 } }, { isMoving: false, _avoidIsWalking: () => true }), true, 'stopped by its own look-ahead mid-walk');
    assert.equal(npcIsMoving({ velocity: { x: 0, y: 0 } }, { isMoving: false, _avoidIsWalking: () => false }), false, 'face_player, dwelling');
    assert.equal(npcIsMoving({ velocity: { x: 0, y: 0 } }, null), false);
});

test('blockPlayerIntoNpc: a sideways move alongside the NPC is not undone; running into it is (m1)', () => {
    const npc = { x: 100, y: 24, width: 16, height: 10 };
    const body = (x, y, px, py) => ({ x, y, width: 16, height: 10, prev: { x: px, y: py }, velocity: { x: 5, y: 5 }, position: { x, y } });
    // already overlapping in x and y before the step, moving toward the NPC's centre line: old centre-distance test undid it
    const alongside = body(92, 30, 88, 30);
    assert.equal(blockPlayerIntoNpc(alongside, npc), false);
    assert.deepEqual([alongside.position.x, alongside.position.y], [92, 30]);
    // touching below (y gap 0), x spans overlapping, then moves 1 px up and 6 px left: only y ran in
    const ran = body(104, 33, 110, 34);
    assert.equal(blockPlayerIntoNpc(ran, npc), true);
    assert.deepEqual([ran.position.x, ran.position.y], [104, 34], 'y undone, the sideways x move kept');
});

test('R2: a passing (squeeze-past) NPC with the player by a wall neither blocks nor clears the player', () => {
    const passing = { roomId: 'r', config: { patrol: { enabled: true } }, isPassingPlayer: () => true };
    // would be undone if blockPlayerIntoNpc ran (prev y 34), and would be moved if clearPlayerOfNpc ran
    const h = harness({ playerX: 100, playerY: 18, npcX: 100, npcY: 22, prev: { x: 100, y: 34 }, behavior: passing });
    h.player.body.velocity = { x: 3, y: -50 };
    assert.equal(h.process(), false);
    assert.deepEqual([h.player.body.position.x, h.player.body.position.y], [100, 18], 'position unchanged');
    assert.deepEqual(h.player.body.velocity, { x: 3, y: -50 }, 'velocity unchanged');
    const standing = harness({ playerX: 100, playerY: 12, npcX: 100, npcY: 20, behavior: passing });
    assert.equal(standing.process(), false);
    assert.deepEqual([standing.player.body.position.x, standing.player.body.position.y], [100, 12], 'not popped out either');
});
