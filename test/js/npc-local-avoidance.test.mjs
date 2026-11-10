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
const { nearestBlockerAhead, avoidanceYieldsTo, AVOID_LOOKAHEAD_PX } = mod;

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
