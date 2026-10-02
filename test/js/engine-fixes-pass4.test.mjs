// Pass-4 engine fixes: lockpick catches in the right room and only by the NPC who
// saw it, onPickup for keys and other slot items, the Mission Brief popup waiting
// for the opening cutscene, and the tutorial answer kept with the game.
// Run with: node --test test/js/engine-fixes-pass4.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'engine-fixes-pass4-'));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
const stub = (out, code) => { writeFileSync(join(dir, out), code); };

copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
const npcManagerUrl = copy('systems/npc-manager.js', 'npc-manager.mjs', [
    ["'./npc-los.js'", "'./npc-los.mjs'"],
    ["'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"],
]);
const catchUrl = copy('systems/lockpick-catch.js', 'lockpick-catch.mjs');

stub('rooms-stub.mjs', 'export const rooms = {};');
stub('ink-stub.mjs', 'export default class InkEngine {}');
stub('config-stub.mjs', "export const CSRF_TOKEN = 'x';");
stub('info-label-stub.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
const inventoryUrl = copy('systems/inventory.js', 'inventory.mjs', [
    ["'../core/rooms.js'", "'./rooms-stub.mjs'"],
    ["'./ink/ink-engine.js'", "'./ink-stub.mjs'"],
    ["'../config.js'", "'./config-stub.mjs'"],
    ["'../ui/info-label.js'", "'./info-label-stub.mjs'"],
]);
stub('notifications-stub.mjs', 'export function gameAlert() {}');
stub('crypto-stub.mjs', 'export function createCryptoWorkstation() {} export function openCryptoWorkstation() {} export function closeLaptop() {} export function openCryptoWorkstationInNewTab() {}');
stub('lab-stub.mjs', 'export function createLabWorkstation() {} export function openLabWorkstation() {} export function closeLabWorkstation() {} export function openLabWorkstationInNewTab() {}');
const helpersUrl = copy('utils/helpers.js', 'helpers.mjs', [
    ["'../systems/notifications.js'", "'./notifications-stub.mjs'"],
    ["'./crypto-workstation.js'", "'./crypto-stub.mjs'"],
    ["'./lab-workstation.js'", "'./lab-stub.mjs'"],
]);
const tutorialUrl = copy('systems/tutorial-manager.js', 'tutorial-manager.mjs');
stub('constants-stub.mjs', 'export const TILE_SIZE = 32;');
stub('pathfinding-stub.mjs', 'export class NPCPathfindingManager {}');
const behaviorUrl = copy('systems/npc-behavior.js', 'npc-behavior.mjs', [
    ["'../utils/constants.js'", "'./constants-stub.mjs'"],
    ["'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'"],
]);

const store = new Map();
globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
};
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null };
globalThis.navigator = { userAgent: 'node' };
window.innerWidth = 1400;

const { default: NPCManager } = await import(npcManagerUrl);
const { catchLockpickInView, lockpickWatchRooms } = await import(catchUrl);
const { applyPickupAction } = await import(inventoryUrl);
const { showBriefWhenClear, briefPopupBlocked } = await import(helpersUrl);
const { TutorialManager } = await import(tutorialUrl);
const { default: behaviorModule } = await import(behaviorUrl);
const { NPCBehavior } = behaviorModule;

// A dispatcher that really calls listeners, so the mapping handlers run.
function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        on(name, fn) { (listeners.get(name) || listeners.set(name, []).get(name)).push(fn); },
        off(name, fn) { const l = listeners.get(name); if (l) l.splice(l.indexOf(fn), 1); },
        emit(name, data) { emitted.push({ name, data }); (listeners.get(name) || []).slice().forEach(fn => fn(data)); },
    };
}

// m02's layout: Val watches the corridor, Gary sits in the IT office. Both have a
// lockpick_used_in_view person-chat mapping. LOS disabled = sees the whole room.
function m02(playerRoom) {
    const d = makeDispatcher();
    const m = new NPCManager(d, null);
    const mapping = knot => [{ eventPattern: 'lockpick_used_in_view', conversationMode: 'person-chat', targetKnot: knot, cooldown: 0 }];
    m.npcs.set('val', { id: 'val', npcType: 'person', roomId: 'office_corridor', x: 0, y: 0, los: { enabled: false }, eventMappings: mapping('on_lockpick_used') });
    m.npcs.set('gary', { id: 'gary', npcType: 'person', roomId: 'it_department', x: 0, y: 0, los: { enabled: false }, eventMappings: mapping('on_cabinet_picked') });
    m._setupEventMappings('val', m.npcs.get('val').eventMappings);
    m._setupEventMappings('gary', m.npcs.get('gary').eventMappings);
    window.npcManager = m;
    window.player = { x: 10, y: 10 };
    window.currentPlayerRoom = playerRoom;
    delete window.currentRoomId;
    return { m, d };
}
const fired = (m, npcId) => [...m.triggeredEvents.keys()].some(k => k.startsWith(`${npcId}:lockpick_used_in_view:`));

test('container pick: the catch uses the player\'s live room (window.currentRoomId is never set)', () => {
    const { m, d } = m02('it_department');
    const cabinet = { scenarioData: { type: 'filing_cabinet' } }; // no doorProperties, no roomId
    const npc = catchLockpickInView(cabinet);
    assert.equal(npc?.id, 'gary');
    assert.equal(d.emitted.length, 1);
    assert.equal(d.emitted[0].data.roomId, 'it_department');
});

test('container pick: the sprite\'s own roomId counts too', () => {
    m02(undefined);
    assert.deepEqual(lockpickWatchRooms({ roomId: 'it_department' }), ['it_department']);
    assert.equal(catchLockpickInView({ roomId: 'it_department' })?.id, 'gary');
});

test('corridor door picked in Val\'s view: only Val reacts, Gary (another room, already loaded) does not', () => {
    const { m } = m02('office_corridor');
    const door = { doorProperties: { roomId: 'office_corridor', connectedRoom: 'security_office' } };
    assert.equal(catchLockpickInView(door)?.id, 'val');
    assert.equal(fired(m, 'val'), true);
    assert.equal(fired(m, 'gary'), false);
});

test('a lockpick_used_in_view event with no named catcher still reaches every mapping (old payloads)', () => {
    const { m, d } = m02('office_corridor');
    d.emit('lockpick_used_in_view', { roomId: 'office_corridor' });
    assert.equal(fired(m, 'val'), true);
    assert.equal(fired(m, 'gary'), true);
});

test('nobody watching in the player\'s or the lock\'s room: no catch', () => {
    const { d } = m02('staff_room');
    assert.equal(catchLockpickInView({ doorProperties: { roomId: 'staff_room', connectedRoom: 'ward_hall' } }), null);
    assert.equal(d.emitted.length, 0);
});

test('onPickup.setVariable applies on pickup, once, and never for an item restored on reload', () => {
    const d = makeDispatcher();
    window.eventDispatcher = d;
    window.npcConversationStateManager = null;
    window.gameState = { globalVariables: { maintenance_key_found: false } };
    const key = { scenarioData: { type: 'key', id: 'generator_maintenance_key', onPickup: { setVariable: { maintenance_key_found: true } } } };

    applyPickupAction({ ...key, _restoredFromSave: true });
    assert.equal(window.gameState.globalVariables.maintenance_key_found, false);

    applyPickupAction(key);
    assert.equal(window.gameState.globalVariables.maintenance_key_found, true);
    assert.equal(d.emitted.filter(e => e.name === 'global_variable_changed:maintenance_key_found').length, 1);

    // Already set (by a read, or by a mission's own item_picked_up mapping): no second event
    applyPickupAction(key);
    assert.equal(d.emitted.filter(e => e.name === 'global_variable_changed:maintenance_key_found').length, 1);

    applyPickupAction({ scenarioData: { type: 'key' } }); // no onPickup: nothing
});

test('opening cutscene pending: hasPendingOpeningConversation and the brief waits', async () => {
    const m = new NPCManager(makeDispatcher(), null);
    window.npcManager = m;
    window.MinigameFramework = { currentMinigame: null };
    window.gameState = { globalVariables: { briefing_played: false } };
    m.scheduleTimedConversation({ npcId: 'briefing_cutscene', targetKnot: 'start', delay: 0, skipIfGlobal: 'briefing_played', setGlobalOnStart: 'briefing_played' });
    assert.equal(m.hasPendingOpeningConversation(), true);
    assert.equal(briefPopupBlocked(), true);

    let shown = 0;
    showBriefWhenClear(() => { shown++; }, { firstDelay: 5, poll: 5, maxWait: 1000 });
    await new Promise(r => setTimeout(r, 30));
    assert.equal(shown, 0, 'brief must not open before the briefing');

    // Briefing starts: delivered, guard set, its minigame on screen
    m.timedConversations[0].delivered = true;
    window.gameState.globalVariables.briefing_played = true;
    window.MinigameFramework.currentMinigame = { kind: 'person-chat' };
    await new Promise(r => setTimeout(r, 30));
    assert.equal(shown, 0, 'brief must not displace the running briefing');

    window.MinigameFramework.currentMinigame = null; // briefing closed
    await new Promise(r => setTimeout(r, 30));
    assert.equal(shown, 1);
});

test('a resumed game whose briefing already played does not hold the brief', () => {
    const m = new NPCManager(makeDispatcher(), null);
    window.npcManager = m;
    window.MinigameFramework = { currentMinigame: null };
    window.gameState = { globalVariables: { briefing_played: true } };
    m.scheduleTimedConversation({ npcId: 'briefing_cutscene', targetKnot: 'start', delay: 0, waitForEvent: 'game_loaded', skipIfGlobal: 'briefing_played' });
    assert.equal(m.hasPendingOpeningConversation(), false);
    assert.equal(briefPopupBlocked(), false);
});

test('tutorial decline is kept in the game\'s globals, so a fresh browser on the same game does not ask again', () => {
    store.clear();
    window.stateSync = { syncs: 0, sync() { this.syncs++; } };
    window.gameState = { globalVariables: {} };
    const t = new TutorialManager();
    assert.equal(t.hasDeclinedTutorial(), false);
    t.markDeclined();
    assert.equal(window.gameState.globalVariables.engine_tutorial_declined, true);
    assert.equal(window.stateSync.syncs, 1);

    store.clear(); // new browser profile: no localStorage, globals restored from the server
    assert.equal(new TutorialManager().hasDeclinedTutorial(), true);

    TutorialManager.resetTutorial();
    assert.equal(new TutorialManager().hasDeclinedTutorial(), false);
});

// A bare patrolling NPC walking a long leg: body at (x, y), path to a target far away.
function patroller({ waypoints, interval = 3000 }) {
    const b = Object.create(NPCBehavior.prototype);
    const body = { center: { x: 0, y: 0 }, setVelocity() {} };
    b.npcId = 'val';
    b.sprite = { x: 0, y: 0, body };
    b.config = { patrol: { enabled: true, speed: 40, changeDirectionInterval: interval, waypoints } };
    b.patrolTarget = { x: 400, y: 0, dwellTime: 4000 };
    b.currentPath = [{ x: 400, y: 0 }];
    b.pathIndex = 0;
    b.pathFollowingActive = true;
    b.lastPatrolChange = 0;
    b.patrolReachedTime = 0;
    b.retargets = 0;
    b.chooseNewPatrolTarget = function () { this.retargets++; this.lastPatrolChange = this._now; };
    b.playAnimation = () => {};
    b.calculateDirection = () => 'right';
    b._drawPatrolPathDebug = () => {};
    b._clearPatrolPathDebug = () => {};
    b.step = function (t, dx = 0) { body.center.x += dx; this._now = t; this.updatePatrol(t, 16); };
    return b;
}

test('a waypoint patrol keeps walking a leg longer than changeDirectionInterval', () => {
    const b = patroller({ waypoints: [{ worldX: 0, worldY: 0 }, { worldX: 400, worldY: 0 }] });
    for (let t = 100; t <= 9000; t += 100) b.step(t, 4); // 40 px/s, a 10 s leg
    assert.equal(b.retargets, 0);
});

test('...and works with a long interval set as a mission workaround (m02 Val, 60000)', () => {
    const b = patroller({ waypoints: [{ worldX: 0, worldY: 0 }, { worldX: 400, worldY: 0 }], interval: 60000 });
    for (let t = 100; t <= 9000; t += 100) b.step(t, 4);
    assert.equal(b.retargets, 0);
});

test('a waypoint patrol that stops moving re-targets after the interval (unstick)', () => {
    const b = patroller({ waypoints: [{ worldX: 0, worldY: 0 }, { worldX: 400, worldY: 0 }] });
    for (let t = 100; t <= 9000; t += 100) b.step(t, 0); // blocked
    assert.ok(b.retargets >= 1);
});

test('random wandering still re-targets every changeDirectionInterval', () => {
    const b = patroller({ waypoints: null });
    for (let t = 100; t <= 3500; t += 100) b.step(t, 4);
    assert.equal(b.retargets, 1);
});
