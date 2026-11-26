// E4: an eventMapping's `actions` list (npc-manager.js), remove_world_item, start_patrol /
// resume_patrol and take_off (systems/apply-actions.js), and patrol.startDeferred /
// restartAuthoredPatrol (systems/npc-behavior.js).
// npc-manager.js and npc-behavior.js have relative imports and the repo has no "type": "module",
// so they are copied to a temp dir as .mjs (as npc-walk-mappings.test.mjs and
// npc-patrol-settle.test.mjs do). No static import was added by E4, so the copy lists are unchanged.
// Run with: node --test test/js/e4-mapping-actions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const sys = join(js, 'systems');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const quiet = async (fn) => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return await fn(); } finally { console.log = l; console.warn = w; }
};
const flush = () => new Promise(r => setImmediate(r));

globalThis.window = {
    gameState: { globalVariables: {} },
    lockRef: (item) => item?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit() {} }
};

// ---- apply-actions.js, with its helper imports stubbed (as apply-actions-hint-give does)
const { applyActions } = await quiet(() => import(dataUrl(readFileSync(join(sys, 'apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`))));

// ---- npc-manager.js
const dir = mkdtempSync(join(tmpdir(), 'e4-mapping-actions-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'), readFileSync(join(sys, 'npc-manager.js'), 'utf8')
    .replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
const { default: NPCManager } = await quiet(() => import(pathToFileURL(join(dir, 'npc-manager.mjs')).href));

// ---- npc-behavior.js
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(sys, 'npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(sys, 'fight-styles.js'), 'utf8'));
writeFileSync(join(dir, 'npc-behavior.mjs'), readFileSync(join(sys, 'npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'"));
const bmod = (await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href)));
const { NPCBehavior, NPCBehaviorManager } = bmod.default || bmod;

// ===================================================================== mapping `actions`
function makeManager() {
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    m.npcs.set('guard', { id: 'guard', npcType: 'person', currentKnot: 'start', displayName: 'Guard', roomId: 'hall' });
    return m;
}
function fire(m, mapping, idx = 0) {
    const config = m._buildMappingConfig({ eventPattern: 'room_entered:hall', ...mapping }, idx);
    m._handleEventMapping('guard', 'room_entered:hall', config, {});
    return config;
}
function captureActions() {
    const calls = [];
    window.applyActions = (list, opts) => { calls.push({ list, opts }); };
    return calls;
}

test('a mapping with actions copies them into its config and runs them once per firing', async () => {
    const m = makeManager();
    const calls = captureActions();
    const acts = [{ type: 'hint', message: 'Hi' }, { type: 'take_off', itemId: 'vest' }];
    const config = await quiet(() => fire(m, { actions: acts, cooldown: 0 }));
    assert.deepEqual(config.actions, acts);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].list, acts);
    assert.equal(calls[0].opts.source, 'event_mapping');
    // no cooldown, not once-only: a second firing runs them again, once
    await quiet(() => m._handleEventMapping('guard', 'room_entered:hall', config, {}));
    assert.equal(calls.length, 2);
    delete window.applyActions;
});

test('mapping actions honour onceOnly and the mapping condition', async () => {
    const m = makeManager();
    const calls = captureActions();
    const config = await quiet(() => fire(m, { onceOnly: true, actions: [{ type: 'hint', message: 'x' }] }));
    await quiet(() => m._handleEventMapping('guard', 'room_entered:hall', config, {}));
    assert.equal(calls.length, 1, 'once-only: the second firing runs nothing');

    const m2 = makeManager();
    window.gameState.globalVariables.go = false;
    const c2 = await quiet(() => fire(m2, { condition: 'globalVars.go', actions: [{ type: 'hint', message: 'x' }] }));
    assert.equal(calls.length, 1, 'condition false: not run');
    window.gameState.globalVariables.go = true;
    await quiet(() => m2._handleEventMapping('guard', 'room_entered:hall', c2, {}));
    assert.equal(calls.length, 2, 'condition true: run');
    window.gameState.globalVariables = {};
    delete window.applyActions;
});

test('a mapping without actions, or with an empty list, calls nothing', async () => {
    const m = makeManager();
    const calls = captureActions();
    await quiet(() => fire(m, {}));
    await quiet(() => fire(m, { actions: [] }));
    const c = m._buildMappingConfig({ eventPattern: 'x', actions: 'nope' }, 0);
    assert.equal(c.actions, null);
    assert.equal(calls.length, 0);
    delete window.applyActions;
});

test('a mapping with actions but no applyActions loaded warns and carries on', async () => {
    const m = makeManager();
    delete window.applyActions;
    const warns = [];
    const w = console.warn, l = console.log;
    console.warn = (...a) => warns.push(a.join(' ')); console.log = () => {};
    try { fire(m, { actions: [{ type: 'hint', message: 'x' }] }); } finally { console.warn = w; console.log = l; }
    assert.ok(warns.some(s => /applyActions is not loaded/.test(s)));
});

// ===================================================================== apply-actions
function sprite() {
    const s = { destroyed: 0, ghostDestroyed: 0 };
    s.destroy = () => { s.destroyed++; };
    s.proximityGhost = { destroy: () => { s.ghostDestroyed++; } };
    return s;
}
function withRooms(rooms, scenarioRooms) {
    const removed = [];
    window.rooms = rooms;
    window.gameScenario = { rooms: scenarioRooms };
    window.RoomStateSync = { removeItemFromRoom: (rid, id) => { removed.push([rid, id]); return Promise.resolve({ success: false }); } };
    return removed;
}
const cleanRooms = () => { delete window.rooms; delete window.gameScenario; delete window.RoomStateSync; };

test('remove_world_item removes a dropped item by id from the loaded room and tells the server', async () => {
    const stick = sprite();
    const other = sprite();
    const removed = withRooms({ open_plan: { objects: { stick, keep: other } }, lobby: { objects: {} } },
        { open_plan: {}, lobby: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'stick' }]));
    assert.equal(stick.destroyed, 1);
    assert.equal(stick.ghostDestroyed, 1);
    assert.equal(other.destroyed, 0);
    assert.equal(window.rooms.open_plan.objects.stick, undefined);
    assert.ok(window.rooms.open_plan.objects.keep);
    assert.deepEqual(removed, [['open_plan', 'stick'], ['lobby', 'stick']], 'no roomIds: every declared room');
    cleanRooms();
});

test('remove_world_item with roomId or roomIds only touches those rooms, and an unloaded room still goes to the server', async () => {
    const stick = sprite();
    let removed = withRooms({ a: { objects: { stick } } }, { a: {}, b: {}, c: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'stick', roomIds: ['b', 'c', 'b'] }]));
    assert.equal(stick.destroyed, 0, 'room a not named');
    assert.deepEqual(removed, [['b', 'stick'], ['c', 'stick']]);
    removed = withRooms({ a: { objects: { stick } } }, { a: {}, b: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'stick', roomId: 'a' }]));
    assert.equal(stick.destroyed, 1);
    assert.deepEqual(removed, [['a', 'stick']]);
    cleanRooms();
});

test('remove_world_item is a no-op when the item is absent, and survives a server that throws', async () => {
    const removed = withRooms({ a: { objects: {} } }, { a: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'ghost' }]));
    assert.deepEqual(removed, [['a', 'ghost']]);
    window.RoomStateSync.removeItemFromRoom = () => { throw new Error('offline'); };
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'ghost' }]));
    delete window.RoomStateSync;
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'ghost' }]));
    const noop = withRooms({}, {});
    await quiet(() => applyActions([{ type: 'remove_world_item' }, { type: 'remove_world_item', item: 3 }]));
    assert.deepEqual(noop, [], 'no item id: nothing sent');
    cleanRooms();
});

test('take_off still reads itemId, and takes off whatever is worn without one', async () => {
    const calls = [];
    window.wearables = { takeOff: (id) => { calls.push(id); return Promise.resolve(); } };
    await quiet(() => applyActions([{ type: 'take_off', itemId: 'ca12_hivis' }, { type: 'take_off' }]));
    assert.deepEqual(calls, ['ca12_hivis', null]);
    delete window.wearables;
});

test('start_patrol and resume_patrol go to the behaviour manager with the npc and speed', async () => {
    const calls = [];
    window.npcBehaviorManager = {
        startPatrol(npc, o) { calls.push(['start', npc, o.speed]); },
        resumePatrol(npc, o) { calls.push(['resume', npc, o.speed]); }
    };
    await quiet(() => applyActions([
        { type: 'start_patrol', npc: 'jun', speed: 60 },
        { type: 'resume_patrol', npc: 'yusuf' },
        { type: 'start_patrol' },
        { type: 'resume_patrol', npc: '' }
    ]));
    assert.deepEqual(calls, [['start', 'jun', 60], ['resume', 'yusuf', undefined]]);
    delete window.npcBehaviorManager;
    await quiet(() => applyActions([{ type: 'start_patrol', npc: 'jun' }]));   // no manager: a warning only
});

// ===================================================================== npc-behavior patrol
function patroller(patrol, extra = {}) {
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'jun';
    b.roomId = 'hall';
    window.rooms = { hall: { position: { x: 0, y: 0 } } };
    b.sprite = { x: 100, y: 100, body: { setVelocity() {} } };
    b.scene = { time: { now: 1000 } };
    b.config = quietSync(() => b.parseConfig({ patrol, ...extra }));
    b._authoredPatrol = JSON.parse(JSON.stringify(b.config.patrol));
    b._patrolOverridden = false;
    b.cancelMove = () => { b._cancelled = (b._cancelled || 0) + 1; };
    return b;
}
function quietSync(fn) {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
}
const WAYPOINTS = [{ x: 4, y: 4 }, { x: 8, y: 4 }];

test('patrol.startDeferred: authored but standing still until start_patrol', () => {
    const b = patroller({ waypoints: WAYPOINTS, startDeferred: true, speed: 50 });
    assert.equal(b.config.patrol.enabled, false);
    assert.equal(b.config.patrol.startDeferred, true);
    assert.ok(b.config.patrol.waypoints.length >= 2, 'waypoints survive validation');
    const ok = quietSync(() => b.restartAuthoredPatrol({ why: 'start_patrol' }));
    assert.equal(ok, true);
    assert.equal(b.config.patrol.enabled, true);
    assert.equal(b.config.patrol.startDeferred, false);
    assert.equal(b.config.patrol.speed, 50);
    assert.equal(b._cancelled, 1);
});

test('start_patrol with a speed overrides the authored speed', () => {
    const b = patroller({ waypoints: WAYPOINTS, startDeferred: true, speed: 50 });
    quietSync(() => b.restartAuthoredPatrol({ speed: 90 }));
    assert.equal(b.config.patrol.speed, 90);
    quietSync(() => b.restartAuthoredPatrol({ speed: 'fast' }));
    assert.equal(b.config.patrol.speed, 50, 'a non-numeric speed falls back to the authored one');
});

test('setNPCVisible does not re-enable a deferred patrol, but does a normal one', () => {
    const mgr = new NPCBehaviorManager({}, {});
    const deferred = patroller({ waypoints: WAYPOINTS, startDeferred: true });
    const normal = patroller({ waypoints: WAYPOINTS, enabled: true });
    normal.config.patrol.enabled = false;
    for (const [id, b] of [['d', deferred], ['n', normal]]) {
        b.sprite.setVisible = () => {}; b.sprite.setAlpha = () => {}; b.sprite.body.enable = false;
        mgr.behaviors.set(id, b);
    }
    quietSync(() => mgr.setNPCVisible('d', true));
    quietSync(() => mgr.setNPCVisible('n', true));
    assert.equal(deferred.config.patrol.enabled, false);
    assert.equal(normal.config.patrol.enabled, true);
});

test('resume_patrol after a patrolOverride (goToAndStay by a script) restores the authored patrol', () => {
    const mgr = new NPCBehaviorManager({}, {});
    const b = patroller({ waypoints: WAYPOINTS, enabled: true, speed: 40 });
    mgr.behaviors.set('jun', b);
    // still on the patrol: a no-op
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), false);
    // a script walks it away: goToAndStay with no owner marks the override
    b.config.patrol.enabled = false;
    b._patrolOverridden = true;
    b.config.patrol.waypoints = [{ x: 1, y: 1 }];
    b.config.patrol.speed = 10;
    b.patrolTarget = { x: 1, y: 1 };
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), true);
    assert.equal(b.config.patrol.enabled, true);
    assert.equal(b.config.patrol.speed, 40);
    assert.deepEqual(b.config.patrol.waypoints.map(w => [w.x, w.y]), b._authoredPatrol.waypoints.map(w => [w.x, w.y]));
    assert.equal(b._patrolOverridden, false);
    assert.equal(b.patrolTarget, null);
    assert.equal(b.config.patrol.waypointIndex, 0);
});

test('goToAndStay marks the override for scripts but not for needs or walk moves', () => {
    const src = readFileSync(join(sys, 'npc-behavior.js'), 'utf8');
    assert.match(src, /if \(opts\?\.owner !== 'needs' && opts\?\.owner !== 'walk'\) this\._patrolOverridden = true;/);
});

test('start_patrol and resume_patrol on an unknown npc, or one with no authored patrol, return false', () => {
    const mgr = new NPCBehaviorManager({}, {});
    assert.equal(quietSync(() => mgr.startPatrol('nobody', {})), false);
    assert.equal(quietSync(() => mgr.resumePatrol('nobody', {})), false);
    const idle = patroller({});
    mgr.behaviors.set('idle', idle);
    assert.equal(quietSync(() => mgr.startPatrol('idle', {})), false);
});

// ===================================================================== round 1 fixes (E4 review R1)
// A route walker built without parseConfig's room checks (those need loaded rooms): the route is
// set on the config directly, as parseConfig would leave it for a valid one.
function routeWalker() {
    const b = patroller({ waypoints: WAYPOINTS, enabled: true, speed: 40 });
    Object.assign(b.config.patrol, {
        multiRoom: true,
        route: [{ room: 'hall', waypoints: [{ tileX: 2, tileY: 2 }] }, { room: 'lobby', waypoints: [{ tileX: 9, tileY: 2 }] }],
        currentSegmentIndex: 1
    });
    b._authoredPatrol = JSON.parse(JSON.stringify(b.config.patrol));
    b.npcBodyPos = () => ({ x: 100, y: 100 });
    b._resetAvoidForNewTarget = () => {};
    b.pathfindingManager = { findNearestWalkableWorldCell: () => null, findNearestWalkableStartCell: () => null };
    b._planned = [];
    b._planMovePath = (pfm, fx, fy, tx, ty) => { b._planned.push([tx, ty]); };
    b.chooseWaypointTargetMultiRoom = () => { b._routeChosen = (b._routeChosen || 0) + 1; };
    return b;
}

test('B1: a route walker sent by goToAndStay plans to the stop, not to the next route waypoint', () => {
    const b = routeWalker();
    b._pendingRouteAction = { action: 'useObject' };
    b._routeWait = { until: 1 }; b._routeUse = { until: 1 }; b._useHeld = { since: 1 };
    quietSync(() => b.goToAndStay(64, 96, 80, { owner: undefined }));
    assert.equal(b._pendingRouteAction, null, 'the route\'s pending action does not outlive the stop');
    assert.equal(b._routeWait, null); assert.equal(b._routeUse, null); assert.equal(b._useHeld, null);
    quietSync(() => b.chooseWaypointTarget(2000));
    assert.equal(b._routeChosen, undefined, 'the route branch is not taken while a move is in flight');
    assert.deepEqual(b._planned, [[64, 96]], 'the single waypoint is the stop');
    // once the move ends (arrival or cancel) the route branch is back
    b._stopOnArrival = false;
    quietSync(() => b.chooseWaypointTarget(3000));
    assert.equal(b._routeChosen, 1);
});

test('B1: a route walker on a move in flight does not want to cross a gate toward the route segment', () => {
    const b = routeWalker();
    b.roomId = 'hall';
    const gate = { roomId: 'hall', connectedRoom: 'lobby' };
    assert.equal(b.wantsToCrossGate(gate), true, 'on the route, segment is the lobby');
    b._stopOnArrival = true;
    assert.equal(b.wantsToCrossGate(gate), false, 'on a stop move, the route does not pull him through');
});

test('B1: resume_patrol after a route walker was stopped puts him on the segment of the room he stands in', () => {
    const mgr = new NPCBehaviorManager({}, {});
    const b = routeWalker();
    mgr.behaviors.set('jun', b);
    quietSync(() => b.goToAndStay(64, 96, 80, {}));
    b._stopOnArrival = false; b.config.patrol.enabled = false;   // arrived
    b.roomId = 'lobby';
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), true);
    assert.equal(b.config.patrol.currentSegmentIndex, 1, 'lobby segment');
    assert.equal(b.config.patrol.multiRoom, true);
});

test('M1: patrol.startWhen starts a deferred patrol once its condition holds, and again after a reload', async () => {
    await quietSync(() => import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8'))));
    // the condition util sets window.* on the module's own `window`, which is this global
    assert.equal(typeof window.parseActionCondition, 'function');
    window.gameState = { globalVariables: { ca12_runner_go: false, ca12_world_done: false } };
    const mgr = new NPCBehaviorManager({}, {});
    const b = patroller({ waypoints: WAYPOINTS, speed: 50, startWhen: 'globalVars.ca12_runner_go && !globalVars.ca12_world_done' });
    assert.equal(b.config.patrol.startDeferred, true, 'startWhen implies startDeferred');
    assert.equal(b.config.patrol.enabled, false);
    mgr.behaviors.set('jun', b);
    quietSync(() => mgr._tickStartWhen());
    assert.equal(b.config.patrol.enabled, false, 'condition false: still');
    window.gameState.globalVariables.ca12_runner_go = true;
    quietSync(() => mgr._tickStartWhen());
    assert.equal(b.config.patrol.enabled, true);
    assert.equal(b.config.patrol.startDeferred, false);
    assert.equal(b._cancelled, 1);
    // one shot: a stop (patrolOverride) is not undone by the next tick
    b.config.patrol.enabled = false; b._patrolOverridden = true;
    quietSync(() => mgr._tickStartWhen());
    assert.equal(b.config.patrol.enabled, false);
    // a reload: a fresh behaviour, globals already restored: starts on the first tick
    const mgr2 = new NPCBehaviorManager({}, {});
    const again = patroller({ waypoints: WAYPOINTS, speed: 50, startWhen: 'globalVars.ca12_runner_go && !globalVars.ca12_world_done' });
    mgr2.behaviors.set('jun', again);
    quietSync(() => mgr2._tickStartWhen());
    assert.equal(again.config.patrol.enabled, true, 'restored global: the patrol resumes after a reload');
    // the world done: a reload leaves him standing
    window.gameState.globalVariables.ca12_world_done = true;
    const done = patroller({ waypoints: WAYPOINTS, startWhen: 'globalVars.ca12_runner_go && !globalVars.ca12_world_done' });
    mgr2.behaviors.set('jun', done);
    quietSync(() => mgr2._tickStartWhen());
    assert.equal(done.config.patrol.enabled, false);
    // a condition outside the grammar warns once and never starts
    const bad = patroller({ waypoints: WAYPOINTS, startWhen: 'this is not a condition ((' });
    mgr2.behaviors.clear(); mgr2.behaviors.set('jun', bad);
    quietSync(() => { mgr2._tickStartWhen(); mgr2._tickStartWhen(); });
    assert.equal(bad.config.patrol.enabled, false);
    assert.equal(bad._startWhenBad, true);
    delete window.gameState;
    window.gameState = { globalVariables: {} };
});

test('M2: restart tells the needs and seating systems, as goToAndStay does', () => {
    const calls = [];
    window.npcNeedsSystem = { onExternalMove: (id, owner) => calls.push(['needs', id, owner]) };
    window.seating = { cancelFetch: (b, why) => calls.push(['fetch', why]), unseatNPC: () => calls.push(['unseat']) };
    try {
        const b = patroller({ waypoints: WAYPOINTS, startDeferred: true });
        assert.equal(quietSync(() => b.restartAuthoredPatrol({ why: 'start_patrol' })), true);
        assert.deepEqual(calls, [['needs', 'jun', 'patrol'], ['fetch', 'move:start_patrol'], ['unseat']]);
    } finally { delete window.npcNeedsSystem; delete window.seating; }
});

test('M2: restart is refused during a walk-in or walk-out', () => {
    const b = patroller({ waypoints: WAYPOINTS, startDeferred: true });
    b._walk = { farRoom: 'lobby' };
    assert.equal(quietSync(() => b.restartAuthoredPatrol({ why: 'start_patrol' })), false);
    assert.equal(b.config.patrol.enabled, false);
    assert.equal(b._cancelled, undefined, 'the walk\'s move is left alone');
});

test('M2: resume_patrol sees a needs move as off the patrol; an untouched patrol still refuses', () => {
    const mgr = new NPCBehaviorManager({}, {});
    const b = patroller({ waypoints: WAYPOINTS, enabled: true, speed: 40 });
    mgr.behaviors.set('jun', b);
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), false);
    // a needs goToAndStay: patrol on with one waypoint, move in flight, not marked as an override
    b._stopOnArrival = true;
    b.config.patrol.waypoints = [{ x: 1, y: 1 }];
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), true);
    assert.equal(b.config.patrol.waypoints.length, 2);
});

test('m2: resume_patrol does not start a deferred patrol that was never started', () => {
    const mgr = new NPCBehaviorManager({}, {});
    const b = patroller({ waypoints: WAYPOINTS, startDeferred: true });
    mgr.behaviors.set('jun', b);
    assert.equal(quietSync(() => mgr.resumePatrol('jun', {})), false);
    assert.equal(b.config.patrol.enabled, false);
    assert.equal(quietSync(() => mgr.startPatrol('jun', {})), true);
});

test('m1: a rejected route (multiRoom off, route left) does not count as an authored patrol', () => {
    const b = patroller({});
    b._authoredPatrol = { waypoints: [], route: [{ room: 'x' }], multiRoom: false, enabled: false };
    assert.equal(quietSync(() => b.restartAuthoredPatrol({})), false);
});

test('M2: mapping actions run after patrolOverride, setVisible and walkIn in the same mapping', () => {
    const m = makeManager();
    const order = [];
    window.npcBehaviorManager = {
        goToAndStay: () => order.push('override'),
        setNPCVisible: () => order.push('visible'),
        walkNPCIn: () => { order.push('walkIn'); return { immediate: true, then() {} }; }
    };
    window.rooms = { hall: { position: { x: 0, y: 0 } } };
    window.applyActions = () => order.push('actions');
    try {
        quietSync(() => fire(m, {
            patrolOverride: { targetTile: { x: 1, y: 1 } }, setVisible: true, walkIn: {},
            actions: [{ type: 'resume_patrol', npc: 'guard' }]
        }));
        assert.equal(order[order.length - 1], 'actions');
        assert.ok(order.indexOf('override') < order.indexOf('actions'));
        assert.ok(order.indexOf('walkIn') < order.indexOf('actions'));
    } finally { delete window.npcBehaviorManager; delete window.rooms; delete window.applyActions; }
});

test('M3: remove_world_item waits for a drop that is still being saved', async () => {
    let settle;
    const stick = sprite();
    stick._dropSync = new Promise((r) => { settle = r; });
    const removed = withRooms({ a: { objects: { stick } } }, { a: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'stick' }]));
    assert.equal(stick.destroyed, 0, 'not destroyed while the drop is saving');
    assert.deepEqual(removed, [], 'the removal is not sent before the add');
    settle(true);
    await flush(); await flush();
    assert.equal(stick.destroyed, 1);
    assert.deepEqual(removed, [['a', 'stick']]);
    cleanRooms();
});

test('M3: a drop whose save rejects is still taken back; one picked up meanwhile is not destroyed', async () => {
    const stick = sprite();
    stick._dropSync = Promise.reject(new Error('save failed'));
    let removed = withRooms({ a: { objects: { stick } } }, { a: {} });
    await quiet(async () => { applyActions([{ type: 'remove_world_item', item: 'stick' }]); await flush(); await flush(); });
    assert.equal(stick.destroyed, 1);
    const held = sprite();
    let settle;
    held._dropSync = new Promise((r) => { settle = r; });
    removed = withRooms({ a: { objects: { stick: held } } }, { a: {} });
    await quiet(() => applyActions([{ type: 'remove_world_item', item: 'stick' }]));
    delete window.rooms.a.objects.stick;   // picked up (and re-dropped as nothing) before the save settles
    settle(true);
    await flush(); await flush();
    assert.equal(held.destroyed, 0);
    assert.deepEqual(removed, [['a', 'stick']], 'the server is still told, idempotently');
    cleanRooms();
});
