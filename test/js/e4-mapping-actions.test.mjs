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
