// NPC local avoidance (npc-behavior.js _handleBlockerAhead): a walking NPC that
// meets the player or another NPC AHEAD on its path waits, then detours, then (if
// there is no way round) backs off / gently squeezes — it never shoves into the
// body. A body behind or beside is ignored (the tailgate lever). Tie-breaks are
// deterministic. Run with: node test/js/npc-local-avoidance.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-local-avoidance-'));
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

globalThis.window = { gameState: { globalVariables: {} } };
const quiet = fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
};
const mod = await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href));
const { NPCBehavior } = mod.default;
const { nearestBlockerAhead, nearestBlockerOnPath, avoidanceYieldsTo, AVOID_LOOKAHEAD_PX, AVOID_BACKOFF_MS } = mod;

// ── nearestBlockerOnPath: "ahead" follows the path for the look-ahead ──────────

test('path: a body straight ahead on a straight path still blocks', () => {
    const path = [{ x: 16, y: 0 }, { x: 32, y: 0 }, { x: 48, y: 0 }, { x: 64, y: 0 }];
    const hit = nearestBlockerOnPath({ x: 0, y: 0 }, path, [{ x: 30, y: 2, id: 'p' }]);
    assert.ok(hit, 'a body on the line ahead blocks');
    assert.equal(hit.id, 'p');
    assert.ok(Math.abs(hit.fwd - 30) < 1e-9);
});

test('path: a body ahead of a short first leg, where the path turns away, does not block (game 5443)', () => {
    // Marek 8 px from his next waypoint, which points at the player 33 px away;
    // the detour then turns up and away round the player.
    const pos = { x: 0, y: 0 };
    const path = [{ x: 8, y: 0 }, { x: 8, y: -16 }, { x: 8, y: -32 }, { x: 16, y: -48 }];
    const player = [{ x: 33, y: 0, id: 'player', isPlayer: true }];
    assert.ok(nearestBlockerAhead(pos, { x: 1, y: 0 }, player), 'the heading check alone would block');
    assert.equal(nearestBlockerOnPath(pos, path, player), null, 'the path check does not');
});

test('path: a body on a later segment within the look-ahead blocks', () => {
    const path = [{ x: 10, y: 0 }, { x: 10, y: -40 }];
    const hit = nearestBlockerOnPath({ x: 0, y: 0 }, path, [{ x: 12, y: -20, id: 'n' }]);
    assert.ok(hit, 'a body round the corner on the path blocks');
    assert.ok(Math.abs(hit.fwd - 30) < 1e-9, 'fwd is the distance along the path');
});

test('path: a body beyond the look-ahead along the path does not block', () => {
    // 10 px then 40 px up: 50 px of path to reach it, past the 42 px look-ahead,
    // although it is only about 41 px from the walker in a straight line.
    const path = [{ x: 10, y: 0 }, { x: 10, y: -60 }];
    assert.ok(AVOID_LOOKAHEAD_PX < 50);
    assert.equal(nearestBlockerOnPath({ x: 0, y: 0 }, path, [{ x: 10, y: -40, id: 'n' }]), null);
});

test('path: a body behind the walker never blocks, even on a path', () => {
    const path = [{ x: 16, y: 0 }, { x: 32, y: 0 }];
    assert.equal(nearestBlockerOnPath({ x: 0, y: 0 }, path, [{ x: -10, y: 0, id: 'p' }]), null);
});

test('path: a one-point path falls back to the heading check', () => {
    const one = [{ x: 8, y: 0 }];
    const body = [{ x: 33, y: 0, id: 'p' }];
    const hit = nearestBlockerOnPath({ x: 0, y: 0 }, one, body);
    assert.deepEqual(hit, nearestBlockerAhead({ x: 0, y: 0 }, { x: 8, y: 0 }, body));
    assert.ok(hit, 'past the single waypoint along the heading still blocks');
});

test('walker: a detour that bends away from the player is walked, not held', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 33, y: 0 } } };
    window.rooms = {};
    const b = walker();
    b.currentPath = [{ x: 8, y: 0 }, { x: 8, y: -16 }, { x: 8, y: -32 }, { x: 16, y: -48 }];
    b.pathIndex = 0;
    assert.equal(b._handleBlockerAhead(100000, b.currentPath[0]), false);
    assert.equal(b._avoid, null);
});

// ── nearestBlockerAhead: only bodies AHEAD, in lane, closest first ───────────────

test('a body straight ahead within look-ahead blocks', () => {
    const hit = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 }, [{ x: 30, y: 0, id: 'p' }]);
    assert.ok(hit); assert.equal(hit.id, 'p');
});

test('a body behind the walker never blocks (tailgate lever)', () => {
    const hit = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 }, [{ x: -30, y: 0, id: 'p' }]);
    assert.equal(hit, null);
});

test('a body beside the walker (out of lane) never blocks', () => {
    const hit = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 }, [{ x: 20, y: 40, id: 'p' }]);
    assert.equal(hit, null);
});

test('a body further than look-ahead does not block', () => {
    const hit = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 },
        [{ x: AVOID_LOOKAHEAD_PX + 5, y: 0, id: 'p' }]);
    assert.equal(hit, null);
});

test('the forward-closest blocker wins, ties broken by id (deterministic)', () => {
    const near = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 },
        [{ x: 35, y: 0, id: 'far' }, { x: 20, y: 0, id: 'near' }]);
    assert.equal(near.id, 'near');
    const tie = nearestBlockerAhead({ x: 0, y: 0 }, { x: 1, y: 0 },
        [{ x: 20, y: 2, id: 'bbb' }, { x: 20, y: -2, id: 'aaa' }]);
    assert.equal(tie.id, 'aaa');
});

// ── avoidanceYieldsTo: deterministic head-on tie-break ───────────────────────────

test('an idle NPC yields to a busy one; the busy one keeps priority', () => {
    assert.equal(avoidanceYieldsTo('a', false, 'b', true), true);
    assert.equal(avoidanceYieldsTo('b', true, 'a', false), false);
});

test('between equals the higher id yields, so the two never both yield or both push', () => {
    assert.equal(avoidanceYieldsTo('zoe', false, 'amy', false), true);
    assert.equal(avoidanceYieldsTo('amy', false, 'zoe', false), false);
});

// ── _handleBlockerAhead: behaviour-level ─────────────────────────────────────────

function walker({ id = 'len', busy = false, target = { x: 400, y: 0 }, pathfinder = null } = {}) {
    const b = Object.create(NPCBehavior.prototype);
    const vel = { x: 0, y: 0 };
    const body = { enable: true, immovable: false, center: { x: 0, y: 0 },
        setVelocity(x, y) { vel.x = x; vel.y = y; } };
    b.npcId = id;
    b.scene = { time: { now: 100000 } };
    b.sprite = { x: 0, y: 0, body, npcId: id };
    b.direction = 'right';
    b.isMoving = true;
    b.config = { patrol: { enabled: true, speed: 90 } };
    b.patrolTarget = { x: target.x, y: target.y };
    b.currentPath = [{ x: target.x, y: target.y }];
    b.pathIndex = 0;
    b.pathFollowingActive = true;
    b._stopOnArrival = busy;
    b.pathfindingManager = pathfinder;
    b.playAnimation = () => {};
    b._vel = vel;
    return b;
}

test('the feature off-switch makes it a no-op', () => {
    window.__npcAvoidOff = true;
    window.player = { body: { enable: true, center: { x: 30, y: 0 } } };
    window.rooms = {};
    const b = walker();
    assert.equal(b._handleBlockerAhead(100000, { x: 400, y: 0 }), false);
    window.__npcAvoidOff = false;
});

test('the player ahead makes the NPC stop and wait instead of shoving', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const b = walker();
    const handled = b._handleBlockerAhead(100000, { x: 400, y: 0 });
    assert.equal(handled, true);
    assert.deepEqual(b._vel, { x: 0, y: 0 }, 'velocity zeroed while waiting (no shove)');
});

test('no blocker ahead → the NPC keeps walking normally', () => {
    window.player = { body: { enable: true, center: { x: -40, y: 0 } } }; // behind
    window.rooms = {};
    const b = walker();
    assert.equal(b._handleBlockerAhead(100000, { x: 400, y: 0 }), false);
    assert.equal(b._avoid, null);
});

test('with no detour available, the NPC gently squeezes past the player (bounded, not a shove)', () => {
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb(null) };   // never finds a detour
    const b = walker({ pathfinder: pf });
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });        // t0: start wait
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 }); // past wait → detour attempt (fails → gaveUp)
    t += 3000; const handled = b._handleBlockerAhead(t, { x: 400, y: 0 }); // past giveup → squeeze
    assert.equal(handled, true);
    const speed = Math.hypot(b._vel.x, b._vel.y);
    assert.ok(speed > 0 && speed < 90, `squeeze is slower than full patrol speed (got ${speed.toFixed(1)})`);
    assert.ok(b._vel.x > 0, 'squeeze is toward the waypoint');
});

test('a yielding NPC backs off from a head-on NPC when there is no way round', () => {
    window.player = undefined;
    // Other NPC "amy" stands just ahead of "zoe"; zoe (higher id, idle) yields.
    window.rooms = { r: { npcSprites: [
        { npcId: 'amy', body: { enable: true, immovable: false, center: { x: 28, y: 0 } } }
    ] } };
    window.npcBehaviorManager = { getBehavior: () => ({ _avoidIsBusy: () => false }) };
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb(null) };
    const b = walker({ id: 'zoe', pathfinder: pf });
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 });   // detour fails
    t += 3000; b._handleBlockerAhead(t, { x: 400, y: 0 });  // giveup → back off
    assert.ok(b._vel.x < 0, 'the yielder steps away from the blocker (−x), clearing the corridor');
});

// Sims tidy R6 M1 (games 6093 to 6104): two needs NPCs met head-on in the one-lane kitchen passage.
// The yielder's back-off lasted one update (about 2 px), then the whole wait and detour cycle ran
// again, so it gave ground at about 1 px a second and the pair stood nose to nose for 20 s.
function headOn({ self = 'zoe', other = 'amy', otherPinned = false, otherAt = 28 } = {}) {
    window.player = undefined;
    const otherBody = { enable: true, immovable: false, center: { x: otherAt, y: 0 } };
    window.rooms = { r: { npcSprites: [{ npcId: other, body: otherBody }] } };
    window.npcBehaviorManager = { getBehavior: () => ({ _avoidIsBusy: () => true, _avoidIsPinned: () => otherPinned }) };
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }), findWorldPath: (sx, sy, ex, ey, cb) => cb(null) };
    const b = walker({ id: self, busy: true, pathfinder: pf });
    return { b, otherBody };
}

test('R6 M1: a yielder backs off for a whole step, not one update', () => {
    const { b } = headOn();
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 });    // detour fails
    t += 2600; b._handleBlockerAhead(t, { x: 400, y: 0 });   // back-off starts
    assert.ok(b._vel.x < 0, 'the step is away from the blocker');
    b.sprite.body.center.x = -2;
    t += 50; b._handleBlockerAhead(t, { x: 400, y: 0 });     // the next update: still stepping back
    assert.ok(b._vel.x < 0, 'still backing off one update later (the old code stopped here)');
    t += AVOID_BACKOFF_MS - 100; b._handleBlockerAhead(t, { x: 400, y: 0 });
    assert.ok(b._vel.x < 0, 'still backing off near the end of the step');
});

test('R6 M1: with still no way round, the next back-off step follows at once', () => {
    const { b } = headOn();
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 2600; b._handleBlockerAhead(t, { x: 400, y: 0 });   // step 1
    b.sprite.body.center.x = -8;                              // it gained ground (still within the look-ahead)
    t += AVOID_BACKOFF_MS + 10; b._handleBlockerAhead(t, { x: 400, y: 0 });   // step over: detour retried, fails
    t += 50; b._handleBlockerAhead(t, { x: 400, y: 0 });     // no fresh 2.5 s wait: step 2 at once
    assert.ok(b._vel.x < 0, 'a second step without the long wait');
    assert.ok(!b._avoid.pinned, 'a step that gained ground is not pinned');
});

test('R6 M1: a yielder that cannot back off is pinned and stops yielding; the other side yields to it', () => {
    const { b } = headOn();
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 2600; b._handleBlockerAhead(t, { x: 400, y: 0 });   // step 1, but a body behind holds it
    t += AVOID_BACKOFF_MS + 10; b._handleBlockerAhead(t, { x: 400, y: 0 });
    assert.equal(b._avoid.pinned, true);
    assert.equal(b._avoidIsPinned(), true);
    t += 50; b._handleBlockerAhead(t, { x: 400, y: 0 });
    assert.ok(b._vel.x >= 0, 'a pinned NPC no longer steps back');
    // amy (the lower id, who would keep priority) meets zoe, who is pinned: amy yields and backs off
    const { b: amy } = headOn({ self: 'amy', other: 'zoe', otherPinned: true });
    let u = 200000;
    amy._handleBlockerAhead(u, { x: 400, y: 0 });
    u += 700; amy._handleBlockerAhead(u, { x: 400, y: 0 });
    u += 2600; amy._handleBlockerAhead(u, { x: 400, y: 0 });
    assert.ok(amy._vel.x < 0, 'the NPC with room behind backs off');
    // without the pin amy keeps priority and squeezes forward, as before
    const { b: amy2 } = headOn({ self: 'amy', other: 'zoe', otherPinned: false });
    u = 300000;
    amy2._handleBlockerAhead(u, { x: 400, y: 0 });
    u += 700; amy2._handleBlockerAhead(u, { x: 400, y: 0 });
    u += 2600; amy2._handleBlockerAhead(u, { x: 400, y: 0 });   // its own detour try (fails)
    u += 50; amy2._handleBlockerAhead(u, { x: 400, y: 0 });
    assert.ok(amy2._vel.x > 0, 'unpinned, the priority NPC squeezes on');
});

test('R6 M1: blockers carry the pinned flag', () => {
    headOn({ otherPinned: true });
    const b = walker({ id: 'zoe' });
    const hit = b._dynamicBlockers().find(o => o.id === 'amy');
    assert.equal(hit.pinned, true);
});

test('a detour that is found is adopted, and avoidance state clears', () => {
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const detour = [{ x: 50, y: 60 }, { x: 400, y: 0 }];
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb(detour) };
    const b = walker({ pathfinder: pf });
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });        // wait
    t += 700; const handled = b._handleBlockerAhead(t, { x: 400, y: 0 }); // detour adopted
    assert.equal(handled, true);
    assert.equal(b.currentPath, detour);
    assert.equal(b._avoid, null);
});

// ── mustReach: a scripted route action must never be stalled by avoidance ─────────
// Regression: a route NPC (e.g. Len) heading for a waypoint that carries an action
// (unlockRoom) treated the player standing just beyond the action cell as a blocker
// and yielded for ever, so the path never completed and the action never fired
// (secure_area never unlocked). On the final approach to an action waypoint the yield
// is time-boxed, then the NPC squeezes through to the cell so the action runs.
test('mustReach: after a brief wait the NPC squeezes toward the action cell (never a sustained hold)', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } }; // beyond the action cell
    window.rooms = {};
    // No pathfinder → a plain yield would give up and keep holding until the long
    // give-up timer; mustReach must move the NPC forward regardless.
    const b = walker();
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 }, true);                 // brief wait first
    assert.deepEqual(b._vel, { x: 0, y: 0 }, 'a brief wait before squeezing (no shove)');
    t += 700;                                                        // just past AVOID_WAIT_MS
    const handled = b._handleBlockerAhead(t, { x: 400, y: 0 }, true);
    assert.equal(handled, true);
    const speed = Math.hypot(b._vel.x, b._vel.y);
    assert.ok(speed > 0 && speed < 90, `bounded squeeze toward the cell, not a full shove (got ${speed.toFixed(1)})`);
    assert.ok(b._vel.x > 0, 'moving toward the action cell, not backing off or holding');
});

test('without mustReach the same early frame is still a hold — so mustReach is what frees the route', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const b = walker();                 // no pathfinder → detour gives up immediately
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 }, false);
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 }, false);     // past wait, before give-up squeeze
    assert.deepEqual(b._vel, { x: 0, y: 0 }, 'a plain yield is still stopped here (the regression that stranded the route)');
});

// ── needs pickup: the player standing on the item's cell must not strand the errand ──
// Regression (lab_physical_pentest, games 1099–1124): a needs-driven NPC (Sofia) sent
// to collect the BadUSB the player just dropped treated the player — standing on the
// pickup cell — as a blocker and yielded/detoured for seconds (leg ~29 vs ~17 units),
// a detour the player sees. The pickup only fires at the cell, so on the final approach
// a needs errand squeezes up to a player at its target, exactly as a route action does.
test('needs pickup: a player on the target cell makes the NPC squeeze up to it (not a sustained hold)', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const b = walker({ target: { x: 30, y: 0 } });   // no pathfinder: a plain yield would hold for ever
    b._moveOwner = 'needs';                           // a needs errand, not a wander
    let t = 100000;
    b._handleBlockerAhead(t, { x: 30, y: 0 });
    assert.deepEqual(b._vel, { x: 0, y: 0 }, 'a brief wait first (no shove)');
    t += 700;                                         // just past AVOID_WAIT_MS
    const handled = b._handleBlockerAhead(t, { x: 30, y: 0 });
    assert.equal(handled, true);
    const speed = Math.hypot(b._vel.x, b._vel.y);
    assert.ok(speed > 0 && speed < 90, `bounded squeeze toward the item, not a shove (got ${speed.toFixed(1)})`);
    assert.ok(b._vel.x > 0, 'moving toward the pickup cell, not holding or detouring');
});

test('needs errand: a player far from the target (mid-path) is still a normal yield, not a squeeze', () => {
    window.__npcAvoidOff = false;
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const b = walker({ target: { x: 400, y: 0 } });  // target far from the blocker → not the "at my cell" case
    b._moveOwner = 'needs';
    let t = 100000;
    b._handleBlockerAhead(t, { x: 400, y: 0 });
    t += 700; b._handleBlockerAhead(t, { x: 400, y: 0 });  // past wait, before give-up squeeze
    assert.deepEqual(b._vel, { x: 0, y: 0 }, 'a mid-path player is still a plain hold — the squeeze is scoped to the pickup cell');
});

// ── Code review R1 (OFFICE_LIFE_STUCK_RETURN_REVIEW_R1.md) ───────────────────────

test('M1: a needs detour that finds nothing round held bodies retries the plain detour before giving up', () => {
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const detour = [{ x: 50, y: 60 }, { x: 400, y: 0 }];
    const seen = [];
    // Tucked-in chairs close the only aisle when held bodies count: that search finds nothing
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb, _w, opts) => {
            const held = !!opts?.avoidDynamic?.includeHeld;
            seen.push(held);
            cb(held ? null : detour);
        } };
    const b = walker({ busy: true, pathfinder: pf });
    b._moveOwner = 'needs';
    let t = 100000;
    quiet(() => b._handleBlockerAhead(t, { x: 400, y: 0 }));
    t += 700; quiet(() => b._handleBlockerAhead(t, { x: 400, y: 0 }));
    assert.deepEqual(seen, [true, false], 'held-aware first, then the plain detour');
    assert.equal(b.currentPath, detour, 'the plain detour is adopted');
    assert.equal(b._avoid, null, 'and it did not give up');
});

test('M1: with both searches empty the needs walker still gives up as before', () => {
    window.player = { body: { enable: true, center: { x: 28, y: 0 } } };
    window.rooms = {};
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb(null) };
    const b = walker({ busy: true, pathfinder: pf });
    b._moveOwner = 'needs';
    let t = 100000;
    quiet(() => b._handleBlockerAhead(t, { x: 400, y: 0 }));
    t += 700; quiet(() => b._handleBlockerAhead(t, { x: 400, y: 0 }));
    assert.equal(b._avoid?.gaveUp, true);
    assert.equal(b._avoid?.pending, false);
});

test('m5: nearestBlockerOnPath reads the path in place from startIndex, same answer as a copy', () => {
    const path = [{ x: -40, y: 0 }, { x: -20, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 30 }, { x: 8, y: 80 }];
    const blockers = [{ x: 30, y: 0, id: 'p', isPlayer: true }, { x: 8, y: 24, id: 'b' }];
    const pos = { x: 0, y: 0 };
    const inPlace = nearestBlockerOnPath(pos, path, blockers, AVOID_LOOKAHEAD_PX, 13, 2);
    const copied = nearestBlockerOnPath(pos, path.slice(2), blockers);
    assert.deepEqual(inPlace, copied);
    assert.equal(inPlace.id, 'b', 'the body past the turn, not the one straight ahead');
    assert.equal(nearestBlockerOnPath(pos, path, blockers, AVOID_LOOKAHEAD_PX, 13, 5), null, 'nothing left to walk');
});

test('m3: a needs re-route with nudge steps onto the nearest walkable cell first', () => {
    const pf = { findNearestWalkableStartCell: () => ({ x: 10, y: 0 }) };
    const b = walker({ pathfinder: pf });
    let reset = null;
    b.sprite.body.reset = (x, y) => { reset = { x, y }; };
    b.npcBodyPos = () => ({ x: 0, y: 0 });
    window.seating = null;
    window.player = null;
    window.rooms = {};
    quiet(() => b.goToAndStay(400, 0, 90, { owner: 'needs', reroute: true, nudge: true }));
    assert.deepEqual(reset, { x: 10, y: 0 }, 'nudged 10 px onto the walkable cell');
    reset = null;
    quiet(() => b.goToAndStay(400, 0, 90, { owner: 'needs', reroute: true }));
    assert.equal(reset, null, 'no nudge without the flag');
    quiet(() => b.goToAndStay(400, 0, 90, { owner: 'script', nudge: true }));
    assert.equal(reset, null, 'and never for a script move');
});

// Code review R2 m1: the needs nudge has the same player-beside guard as _checkPathStuck, only
// leaves a grid-blocked cell, and never lands on another moving body
test('R2 m1: no needs nudge with the player beside, from a walkable cell, or onto a moving body', () => {
    let cell = { x: 20, y: 0 };
    const pf = { findNearestWalkableStartCell: () => cell };
    const b = walker({ pathfinder: pf });
    let reset = null;
    b.sprite.body.reset = (x, y) => { reset = { x, y }; };
    b.npcBodyPos = () => ({ x: 0, y: 0 });
    window.seating = null;
    window.rooms = {};
    const go = () => { reset = null; quiet(() => b.goToAndStay(400, 0, 90, { owner: 'needs', reroute: true, nudge: true })); return reset; };
    window.player = { body: { enable: true, center: { x: -30, y: 0 } } };
    assert.equal(go(), null, 'the player beside: no nudge');
    window.player = { body: { enable: true, center: { x: -200, y: 0 } } };
    assert.deepEqual(go(), { x: 20, y: 0 }, 'the player well away: the nudge runs');
    cell = { x: 3, y: 3 };
    assert.equal(go(), null, 'a walkable cell of its own: only a re-centre, so no nudge');
    cell = { x: 20, y: 0 };
    const other = { npcId: 'tom', body: { enable: true, immovable: false, center: { x: 24, y: 2 } } };
    window.rooms = { office: { npcSprites: [other] } };
    assert.equal(go(), null, 'the cell under another moving body: no nudge');
    other.body.immovable = true;
    assert.deepEqual(go(), { x: 20, y: 0 }, 'a held body is the grid search\'s business, not this guard\'s');
    window.rooms = {};
    window.player = null;
});

// Sims tidy R6, three NPCs in a one-body lane (the kitchen passage). Before the yield hold, the
// yielder's step took it just past the look-ahead, its avoidance state cleared, it walked back in
// and met the same NPC after a fresh wait, over and over: nobody got through in 90 s, and two NPCs
// could both end up pinned and hold for ever. Drives the real _handleBlockerAhead for every NPC
// with a crude lane: |x| <= 100 is one body wide (y 0); beyond it each NPC has its own room offset,
// where a detour is found and bodies pass side by side.
function laneRun(spec, { laneHalf = 100, gap = 20, maxMs = 60000 } = {}) {
    const pf = { findNearestWalkableStartCell: (x, y) => ({ x, y }),
        findWorldPath: (sx, sy, ex, ey, cb) => cb(Math.abs(sx) > laneHalf ? [{ x: ex, y: ey }] : null) };
    const ws = spec.map(([id, x, tx], i) => {
        const off = 30 * (i + 1) * (i % 2 ? 1 : -1);
        const b = Object.create(NPCBehavior.prototype);
        const body = { enable: true, immovable: false, center: { x, y: 0 }, velocity: { x: 0, y: 0 },
            setVelocity(vx, vy) { this.velocity.x = vx; this.velocity.y = vy; } };
        Object.assign(b, { npcId: id, scene: { time: { now: 0 } }, sprite: { x, y: 0, body, npcId: id },
            direction: 'right', isMoving: true, config: { patrol: { enabled: true, speed: 90 } },
            patrolTarget: { x: tx, y: off }, _off: off, pathIndex: 0, pathFollowingActive: true,
            _stopOnArrival: true, pathfindingManager: pf, playAnimation: () => {} });
        b.currentPath = [b.patrolTarget];
        return b;
    });
    window.player = undefined;
    window.rooms = { r: { npcSprites: ws.map(w => w.sprite) } };
    window.npcBehaviorManager = { getBehavior: id => ws.find(w => w.npcId === id) };
    const dt = 50, log = { handovers: 0, maxPinned: 0, done: {} };
    let last = null;
    for (let t = 100000; t < 100000 + maxMs; t += dt) {
        for (const w of ws) {
            const c = w.sprite.body.center;
            if (Math.abs(c.x - w.patrolTarget.x) < 4) { w.sprite.body.setVelocity(0, 0); log.done[w.npcId] ??= t - 100000; continue; }
            w.currentPath = [w.patrolTarget]; w.pathIndex = 0;
            if (!w._handleBlockerAhead(t, w.patrolTarget)) w.sprite.body.setVelocity(Math.sign(w.patrolTarget.x - c.x) * 90, 0);
        }
        for (const w of ws) {
            const c = w.sprite.body.center, vx = w.sprite.body.velocity.x;
            let nx = c.x + vx * dt / 1000;
            for (const o of ws) {
                if (o === w) continue;
                const oc = o.sprite.body.center, ny = Math.abs(nx) > laneHalf ? w._off : 0;
                if (Math.abs(oc.y - ny) >= 16) continue;
                if (vx > 0 && oc.x > c.x && nx > oc.x - gap) nx = Math.max(c.x, oc.x - gap);
                if (vx < 0 && oc.x < c.x && nx < oc.x + gap) nx = Math.min(c.x, oc.x + gap);
            }
            c.x = nx; w.sprite.x = nx; c.y = Math.abs(nx) > laneHalf ? w._off : 0;
        }
        log.maxPinned = Math.max(log.maxPinned, ws.filter(w => w._avoid?.pinned).length);
        const backing = ws.filter(w => w._avoid?.backoffUntil > t).map(w => w.npcId).join(',');
        if (backing && backing !== last) { if (last) log.handovers++; last = backing; }
        if (Object.keys(log.done).length === ws.length) break;
    }
    return log;
}

test('R6: three NPCs in a one-body lane all get through, with a few yield handovers and no mutual pin', () => {
    const log = quiet(() => laneRun([['amy', -30, 300], ['bob', 10, -300], ['cat', 30, -300]]));
    assert.deepEqual(Object.keys(log.done).sort(), ['amy', 'bob', 'cat'],
        `every NPC reaches its target within 60 s (reached: ${JSON.stringify(log.done)})`);
    assert.ok(log.handovers <= 6, `the yield settles instead of oscillating (${log.handovers} handovers)`);
    assert.ok(log.maxPinned < 2, 'two NPCs are never both pinned');
    window.rooms = {};
    window.npcBehaviorManager = undefined;
});
