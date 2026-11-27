// A goToAndStay walk that is bumped gets a temporary avoidance waypoint (npc-sprites.js). Reaching
// that sidestep point must not count as arriving: the walker used to stop there and emit
// npc_arrived with pathLeft 0, short of its real destination (CA0 ca12 proofs, game 10592: a worker
// hidden 3.6 tiles short of the door), and a needs worker would start its job at the sidestep.
// The walk now carries on to the destination, with its owner and move id, and arrives once there.
// Run with: node test/js/npc-bump-sidestep-arrival.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-bump-sidestep-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
const code = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'");
writeFileSync(join(dir, 'npc-behavior.mjs'), code);

const emits = [];
globalThis.window = { gameState: { globalVariables: {} }, seating: undefined,
    npcNeedsSystem: { onExternalMove() {} },
    eventDispatcher: { emit(name, data) { emits.push({ name, data }); } } };
const quiet = fn => { const l = console.log, w = console.warn; console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; } };
const { default: behaviorModule } = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = behaviorModule;
const { handleNPCCollision } = await quiet(() => import('../../public/break_escape/js/systems/npc-sprites.js'));

// A walker on a straight east-west corridor at y = 320. The fake pathfinder returns one node at the
// target; the fake body steps up to 60 px a frame towards the node it is following.
function walker(opts) {
    const pos = { x: 100, y: 320 };
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'walker'; b.roomId = 'room'; b.direction = 'right'; b.currentState = 'patrol';
    b.sprite = { npcId: 'walker', x: pos.x, y: pos.y, scene: { time: { now: 1000 } },
        body: { center: pos, setVelocity() {} } };
    b.validateWaypoints = () => {};
    b.config = quiet(() => b.parseConfig({ patrol: { waypoints: [{ x: 1, y: 1 }] } }));
    b.npcBodyPos = () => ({ x: pos.x, y: pos.y });
    b.playAnimation = () => {};
    b._clearPatrolPathDebug = () => {};
    b._drawPatrolPathDebug = () => {};
    b._handleBlockerAhead = () => false;
    b._checkPathStuck = () => false;
    b.clockNow = () => 1000;
    b.pathfindingManager = {
        findNearestWalkableWorldCell: (x, y) => ({ x, y }),
        findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb([{ x: ex, y: ey }]),
    };
    window.rooms = { room: { position: { x: 0, y: 0 } } };
    window.player = { currentRoom: 'room' };
    window.npcBehaviorManager = { getBehavior: () => b };
    quiet(() => b.goToAndStay(opts.dest.x, opts.dest.y, 80, { owner: 'needs', moveId: 77 }));
    // Run frames; each frame updatePatrol runs, then the body steps along the path.
    const frame = (t) => {
        quiet(() => b.updatePatrol(t, 16));
        const n = b.currentPath[b.pathIndex];
        if (n) {
            const dx = n.x - pos.x, dy = n.y - pos.y, d = Math.hypot(dx, dy) || 1, s = Math.min(d, 60);
            pos.x += dx / d * s; pos.y += dy / d * s; b.sprite.x = pos.x; b.sprite.y = pos.y;
        }
    };
    return { b, pos, frame, bump: () => quiet(() => handleNPCCollision(b.sprite, { npcId: 'other', x: 0, y: 0, body: { immovable: true } })) };
}

test('a bumped walk does not arrive at the sidestep point; it arrives once at the destination with owner and move id', () => {
    emits.length = 0;
    const w = walker({ dest: { x: 800, y: 320 } });
    for (let t = 0; t < 3; t++) w.frame(100 + t * 100);
    // Two bumps: the second selects the temporary waypoint as the target (the first re-picks the destination).
    w.bump(); w.bump();
    assert.ok(w.b.config.patrol.waypoints.some(wp => wp.isTemporary), 'a sidestep waypoint was inserted');
    for (let t = 0; t < 200 && w.b._stopOnArrival; t++) w.frame(1000 + t * 100);
    const arrivals = emits.filter(e => e.name === 'npc_arrived:walker');
    assert.equal(arrivals.length, 1, 'exactly one arrival');
    const a = arrivals[0].data;
    assert.ok(Math.abs(a.x - 800) < 32, `arrived at the destination, not the sidestep (x ${a.x})`);
    assert.equal(a.owner, 'needs', 'owner kept');
    assert.equal(a.moveId, 77, 'move id kept');
    assert.equal(w.b._stopOnArrival, false);
});

test('the sidestep point itself fires no arrival', () => {
    emits.length = 0;
    const w = walker({ dest: { x: 800, y: 320 } });
    for (let t = 0; t < 3; t++) w.frame(100 + t * 100);
    w.bump(); w.bump();
    // Step frames until the body has reached the sidestep node, then stop and look.
    const sidestep = w.b.config.patrol.waypoints.find(wp => wp.isTemporary);
    let reached = false;
    for (let t = 0; t < 60 && !reached; t++) {
        w.frame(1000 + t * 100);
        reached = Math.abs(w.pos.x - sidestep.worldX) < 1 && Math.abs(w.pos.y - sidestep.worldY) < 1;
    }
    assert.ok(reached, 'the walker reached the sidestep point');
    w.frame(5000);
    assert.equal(emits.filter(e => e.name === 'npc_arrived:walker').length, 0, 'no arrival at the sidestep');
    assert.equal(w.b._stopOnArrival, true, 'still walking to the destination');
    assert.equal(w.b._moveId, 77);
    assert.equal(w.b._moveOwner, 'needs');
});

test('an unbumped walk still arrives once at the destination', () => {
    emits.length = 0;
    const w = walker({ dest: { x: 800, y: 320 } });
    for (let t = 0; t < 200 && w.b._stopOnArrival; t++) w.frame(100 + t * 100);
    const arrivals = emits.filter(e => e.name === 'npc_arrived:walker');
    assert.equal(arrivals.length, 1);
    assert.equal(arrivals[0].data.moveId, 77);
});
