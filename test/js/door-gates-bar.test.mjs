// Gate doors, the bar (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md section 3): a north or
// south gate is solid for a player it is not open to. The body rule and its one writer,
// the overlap exception, the narrowed doorway rule, the room test first in the barred
// rule, leaving (exit and leave), the far room's pending sprite, the bump, and doors.js
// asking clickOutcome once before the credential test.
// Run with: node test/js/door-gates-bar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const quiet = { log: console.log, warn: console.warn };
console.log = () => {};
const { DoorGates, GUARD_TURN_BACK_MS, BUMP_INTERVAL_MS } =
    await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

// Where the player stands. The gate is at (100, 100); its body is the strip y 124..132.
const FAR = { x: 400, y: 400 };                       // outside the radius, in the lobby
const NEAR = { x: 100, y: 150 };                      // within 56 px, not touching the strip
// On the strip: overlaps the body grown by 4 px
const ON_STRIP = { x: 100, y: 128, body: { left: 91, right: 109, top: 122, bottom: 134 } };
// Pressed on the strip from below, as a barred player at a solid door: touches the 4 px pad
const PRESSED = { x: 100, y: 140, body: { left: 91, right: 109, top: 133, bottom: 145 } };
const at = (p) => (p.body ? { ...p, body: { ...p.body } } : { ...p });

// A N/S doorway at (100, 100): lobby (south) and vault (north). The gate is on the
// lobby's door entry into vault, so vault is the secured room.
function setup({ gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'disguised' },
    farFirst = false, player = FAR, room = 'lobby' } = {}) {
    const events = [];
    const pmCalls = [];
    const sounds = [];
    const mk = (roomId, connectedRoom, direction, extra = {}) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false, ...extra }
    });
    const guard = { x: 300, y: 300, visible: true, active: true };
    const behaviour = {
        currentPath: [], pathIndex: 0, wantsCross: true, turnBacks: [],
        wantsToCrossGate() { return this.wantsCross; },
        turnBackFromGate(info) { if (!this.wantsCross) return false; this.turnBacks.push(info); this.wantsCross = false; return true; }
    };
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', _sprite: guard }]]) };
    window.npcBehaviorManager = { getBehavior: (id) => (id === 'guard' ? behaviour : null) };
    window.player = at(player);
    window.currentPlayerRoom = room;
    window.lastPlayerRoom = room;
    window.gameState = { globalVariables: { disguised: false } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.playUISound = (name, opts) => sounds.push(opts.key);
    window.pathfindingManager = {
        markDoorWalkable: (...a) => pmCalls.push(['mark', ...a]),
        unmarkDoor: (...a) => pmCalls.push(['unmark', ...a]),
        rebuildWorldGrid: () => pmCalls.push(['rebuild'])
    };
    const gates = new DoorGates();
    // `locked` is what the bootstrap turns false once a guard's route unlocks the room
    const a = mk('lobby', 'vault', 'north', { requires: 'vault_badge', lockType: 'rfid', locked: false });
    const b = mk('vault', 'lobby', 'south');
    if (farFirst) {
        assert.equal(gates.register(b, null), false, 'the far sprite waits');
        assert.equal(gates.register(a, gate), true);
    } else {
        assert.equal(gates.register(a, gate), true);
        assert.equal(gates.register(b, null), true);
    }
    const g = gates.groupsFor('vault')[0];
    return { gates, g, a, b, guard, behaviour, events, pmCalls, sounds };
}
const names = (events) => events.map(e => e[0]);
const stand = (p, room) => { window.player = at(p); if (room) { window.currentPlayerRoom = room; window.lastPlayerRoom = room; } };

test('securedRoom is the configured entry\'s connectedRoom, whatever `locked` says', () => {
    const { g, gates } = setup();
    assert.equal(g.securedRoom, 'vault');
    assert.equal(g.bodyOff, false, 'a new gate is shut: bodies on');
    const st = gates.state('vault')[0];
    assert.equal(st.securedRoom, 'vault');
    assert.equal(st.exitHoldUntil, 0);
    assert.equal(st.bodyOff, false);
});

test('blocksPlayer: shut, open and permitted, open and barred outside or inside, clone hold, exit hold', () => {
    const { gates, g } = setup();
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 0 }), true, 'shut');
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'vault', now: 0 }), true, 'shut, even from inside');
    gates.open(g, 0);
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 0 }), true, 'open for the guard, barred outside');
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'vault', now: 0 }), false, 'barred but inside: never blocked');
    window.gameState.globalVariables.disguised = true;
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 0 }), false, 'permitted');
    window.gameState.globalVariables.disguised = false;
    g.playerHoldUntil = 1000;
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 500 }), false, 'clone hold');
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 1000 }), true, 'clone hold over');
    g.exitHoldUntil = 5000;
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 2000 }), true, 'an exit hold does not let an outside player in');
    // The default room is the game's
    stand(FAR, 'vault');
    assert.equal(gates.blocksPlayer(g, { now: 2000 }), false);
});

test('the one writer: open() applies the rule before it returns, close() switches the bodies on', () => {
    let s = setup();
    s.gates.open(s.g, 0);
    assert.equal(s.a.body.enable, true, 'barred outside: solid with no tick between');
    assert.equal(s.b.body.enable, true);
    s.gates.close(s.g);
    assert.equal(s.a.body.enable, true);
    s = setup();
    window.gameState.globalVariables.disguised = true;
    s.gates.open(s.g, 0);
    assert.equal(s.a.body.enable, false, 'permitted: off at once');
    assert.equal(s.b.body.enable, false);
    assert.equal(s.g.bodyOff, true);
    s.gates.close(s.g);
    assert.equal(s.a.body.enable, true, 'shut: on');
    assert.equal(s.g.bodyOff, false);
});

test('playerOpen() on a gate already open for a guard switches the clone holder\'s body off at once', () => {
    const { gates, g, a, b } = setup();
    gates.open(g, 0);
    assert.equal(a.body.enable, true);
    gates.playerOpen('vault', { now: 100 });
    assert.equal(a.body.enable, false);
    assert.equal(b.body.enable, false);
});

test('overlap exception: a clone hold that runs out on the strip keeps the body off and the gate open until he steps off', () => {
    const { gates, g, a, events } = setup({ player: NEAR });
    gates.playerOpen('vault', { now: 1000 });
    assert.equal(a.body.enable, false);
    stand(ON_STRIP);
    gates.update(1000 + 2600);                      // the hold is over, he is on the strip
    assert.equal(g.open, true, 'held open: he holds the doorway');
    assert.equal(a.body.enable, false, 'not switched on under him');
    gates.update(1000 + 2700);
    assert.equal(a.body.enable, false);
    stand(NEAR);                                    // steps back off the strip, still near
    gates.update(1000 + 2800);
    assert.equal(a.body.enable, true, 'on once he is off');
    assert.equal(g.open, false, 'and the barred player shuts it');
    assert.ok(names(events).includes('door_gate_closed'));
});

test('overlap exception: the vest taken off on the strip', () => {
    const { gates, g, a, guard } = setup({ player: NEAR });
    window.gameState.globalVariables.disguised = true;
    guard.x = 100; guard.y = 140;
    gates.update(0);
    assert.equal(g.open, true);
    assert.equal(a.body.enable, false);
    stand(ON_STRIP);
    guard.x = 300; guard.y = 300;
    window.gameState.globalVariables.disguised = false;
    gates.update(100);
    assert.equal(g.open, true);
    assert.equal(a.body.enable, false);
    stand(NEAR);
    gates.update(200);
    assert.equal(a.body.enable, true);
    assert.equal(g.open, false);
});

test('a barred player pressed on the solid strip does not hold the doorway, in update() or closeNow()', () => {
    let s = setup();
    s.guard.x = 100; s.guard.y = 150;               // near, not in the doorway
    s.gates.update(0);
    assert.equal(s.g.open, true);
    stand(PRESSED);
    assert.equal(s.gates.playerInDoorway(s.g), true, 'he touches the pad');
    assert.equal(s.gates.playerHoldsDoorway(s.g), false, 'but the body is on');
    s.gates.update(100);
    assert.equal(s.g.open, false, 'shut at once');
    s = setup();
    s.guard.x = 100; s.guard.y = 150;
    s.gates.update(0);
    stand(PRESSED);
    assert.equal(s.gates.closeNow('vault', { force: true, now: 100 }), true);
    assert.equal(s.g.open, false);
});

test('the dash: a guard in the doorway, a barred player runs in from outside the radius', () => {
    const { gates, g, a, b, guard, events } = setup();
    guard.x = 100; guard.y = 140;
    gates.update(0);                                // opens for the guard, player far
    assert.equal(g.open, true);
    assert.equal(a.body.enable, true, 'solid from the tick it opened');
    guard.y = 100;                                  // in the doorway
    stand(PRESSED);                                 // ran in, stopped at the strip
    gates.update(100);
    assert.equal(g.open, true, 'the guard is still in the doorway');
    assert.equal(a.body.enable, true);
    assert.equal(b.body.enable, true);
    guard.y = 40;                                   // through
    gates.update(200);
    assert.equal(g.open, false, 'shut on the first tick the guard is clear');
    assert.ok(!names(events).includes('door_gate_player_opened'));
});

test('the barred rule: a barred player inside the secured room keeps nothing shut and turns nobody back', () => {
    const { gates, g, guard, behaviour } = setup({ player: { x: 100, y: 60 }, room: 'vault' });
    guard.x = 100; guard.y = 60;                    // inside too, about to leave
    gates.update(0);
    assert.equal(g.open, true, 'opens for him with the player beside him');
    gates.close(g);
    gates.update(GUARD_TURN_BACK_MS + 10);
    gates.update(2 * GUARD_TURN_BACK_MS + 10);
    assert.equal(behaviour.turnBacks.length, 0);
});

test('the room test comes first: no later clause is consulted for a player inside', () => {
    const { gates, g } = setup({ player: { x: 100, y: 60 }, room: 'vault' });
    // A clause that would bar every player within the radius: a global that is always
    // false, and that records being read
    let read = 0;
    window.gameState.globalVariables = new Proxy({}, { get() { read++; return false; } });
    assert.equal(gates._playerBarred(g), false);
    assert.equal(read, 0, 'inside: answered by the room test');
    stand({ x: 100, y: 150 }, 'lobby');
    assert.equal(gates._playerBarred(g), true, 'outside, within the radius: barred');
    assert.ok(read > 0);
});

test('both branches of update() read the one barred value, computed once per tick', () => {
    const { gates, g, guard } = setup();
    let calls = 0;
    gates._playerBarred = () => { calls++; return true; };
    guard.x = 100; guard.y = 140;
    gates.update(0);
    assert.equal(calls, 1);
    assert.equal(g.open, false, 'keeps a shut gate shut');
    gates.open(g, 10);
    calls = 0;
    gates.update(20);
    assert.equal(calls, 1);
    assert.equal(g.open, false, 'shuts an open one at once');
});

test('the far room\'s sprite registered first joins the gate when the configured one registers', () => {
    const { gates, g, a, b, pmCalls, guard } = setup({ farFirst: true });
    assert.equal(g.sprites.size, 2);
    assert.equal(b.doorProperties.gateKey, g.key);
    assert.deepEqual(b.doorProperties.gate, g.cfg);
    assert.ok(pmCalls.some(c => c[0] === 'unmark' && c[1] === 100 && c[2] === 100), 'doorway unmarked while shut');
    assert.equal(gates.pending.size, 0);
    assert.equal(a.body.enable, true);
    assert.equal(b.body.enable, true);
    guard.x = 100; guard.y = 140;
    window.gameState.globalVariables.disguised = true;
    gates.update(0);
    assert.equal(a.body.enable, false);
    assert.equal(b.body.enable, false, 'the adopted sprite follows the rule');
    assert.equal(b.doorProperties.open, true);
});

test('a destroyed pending sprite is dropped, and reset() clears pending', () => {
    const gates = new DoorGates();
    const s = { x: 0, y: 0, active: true, body: { enable: true },
        doorProperties: { roomId: 'a', connectedRoom: 'b', direction: 'north', worldX: 0, worldY: 0 } };
    gates.register(s, null);
    assert.equal(gates.pending.size, 1);
    s.destroyed = true;
    gates.update(0);
    assert.equal(gates.pending.size, 0);
    s.destroyed = false;
    gates.register(s, null);
    gates.reset();
    assert.equal(gates.pending.size, 0);
});

test('clickOutcome: exit and leave for a player inside, pass and denied outside', () => {
    const { gates, g, events, sounds } = setup({ player: { x: 100, y: 60 }, room: 'vault' });
    assert.equal(gates.clickOutcome(g, { connectedRoom: 'vault', now: 1000 }), 'exit');
    assert.equal(g.open, true);
    assert.equal(g.exitHoldUntil, 1000 + 2500);
    assert.deepEqual(names(events), ['door_gate_exit_opened']);
    assert.deepEqual(sounds, ['rfid_unlock'], 'the release plays once');
    assert.equal(g.bodyOff, true, 'the body is off for him inside');
    assert.equal(gates.clickOutcome(g, { holdsCredential: true, connectedRoom: 'vault', now: 1100 }), 'leave',
        'inside answers before the credential');
    assert.deepEqual(names(events), ['door_gate_exit_opened'], 'leave does nothing');
    stand(NEAR, 'lobby');
    assert.equal(gates.clickOutcome(g, { connectedRoom: 'vault', now: 1200 }), 'denied');
    window.gameState.globalVariables.disguised = true;
    assert.equal(gates.clickOutcome(g, { connectedRoom: 'vault', now: 1200 }), 'pass');
    const st = gates.state('vault')[0];
    assert.equal(st.exitHoldUntil, 3500);
});

test('an exit hold keeps the gate open, but solid for him once he is outside', () => {
    const { gates, g, a } = setup({ player: { x: 100, y: 60 }, room: 'vault' });
    gates.exitOpen(g, 0);
    stand(NEAR, 'lobby');                           // out, turned round, barred
    gates.update(1000);
    assert.equal(g.open, true, 'held open until exitHoldUntil');
    assert.equal(a.body.enable, true, 'and blocks him');
    gates.update(2600);
    assert.equal(g.open, false);
});

test('exitOpen on one of two gates off one room opens only that one', () => {
    const gates = new DoorGates();
    const events = [];
    const sounds = [];
    window.eventDispatcher = { emit: (n) => events.push(n) };
    window.playUISound = (n, o) => sounds.push(o.key);
    window.npcManager = { npcs: new Map() };
    window.player = { x: 100, y: 60 };
    window.currentPlayerRoom = 'hall';
    const mk = (x, into) => ({ x, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId: 'hall', connectedRoom: into, direction: 'north', worldX: x, worldY: 100, lockType: 'rfid' } });
    gates.register(mk(100, 'a'), { openFor: ['g1'] });
    gates.register(mk(400, 'b'), { openFor: ['g2'] });
    assert.equal(gates.groupsFor('hall').length, 2);
    window.currentPlayerRoom = 'a';
    const ga = gates.groupsFor('a')[0];
    const gb = gates.groupsFor('b')[0];
    gates.exitOpen(ga, 0);
    assert.equal(ga.open, true);
    assert.equal(gb.open, false);
    assert.deepEqual(events, ['door_gate_exit_opened']);
    assert.equal(sounds.length, 1);
});

test('bumpDue: at most once every BUMP_INTERVAL_MS per gate', () => {
    const { gates, g } = setup();
    assert.equal(gates.bumpDue(g, 1000), true);
    assert.equal(gates.bumpDue(g, 1000 + BUMP_INTERVAL_MS - 1), false);
    assert.equal(gates.bumpDue(g, 1000 + BUMP_INTERVAL_MS), true);
    assert.equal(gates.bumpDue(null, 0), false);
});

// ---- doors.js: the gate branch of handleDoorInteraction, and the bump ----

globalThis.__calls = { notify: [], holds: [] };
globalThis.__hasCredential = false;
const stubs = {
    '../utils/constants.js': dataUrl(
        'export const TILE_SIZE = 32, GRID_UNIT_WIDTH_PX = 320, GRID_UNIT_HEIGHT_PX = 288, DOOR_INTERACTION_RANGE = 64;'),
    './unlock-system.js': dataUrl(`
        export async function notifyServerUnlock(lockable, type, method) {
            globalThis.__calls.notify.push(method);
            return { success: true, roomData: { id: 'vault' } };
        }
        export function playerHoldsRfidCredentialFor(requires) {
            globalThis.__calls.holds.push(requires);
            return globalThis.__hasCredential;
        }
        export function handleUnlock() {}
    `),
    '../utils/locked-hint.js': pathToFileURL(join(js, 'utils/locked-hint.js')).href,
    './interaction-repeat.js': dataUrl('export function isRepeatInteraction() { return false; }'),
    './room-ready.js': dataUrl('export async function waitForRoomReady() { return { ready: true }; }')
};
let doorsSrc = readFileSync(join(js, 'systems/doors.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) doorsSrc = doorsSrc.split(`'${spec}'`).join(`'${url}'`);
const { handleDoorInteraction, handleGateBump } = await import(dataUrl(doorsSrc));
globalThis.Phaser = { Math: { Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) } } };

function clickSetup(opts) {
    const s = setup(opts);
    globalThis.__calls = { notify: [], holds: [] };
    const alerts = [];
    window.doorGates = s.gates;
    window.gameAlert = (msg, type) => alerts.push(type);
    window.rooms = { vault: {}, lobby: {} };
    window.roomDataCache = new Map();
    return { ...s, alerts };
}

test('doors.js: a clone holder inside a shut gate gets exit: no request, toast or player event', async () => {
    const s = clickSetup({ player: { x: 100, y: 70 }, room: 'vault' });
    globalThis.__hasCredential = true;
    await handleDoorInteraction(s.b);
    assert.equal(s.g.open, true);
    assert.deepEqual(globalThis.__calls.notify, [], 'no unlock request');
    assert.deepEqual(globalThis.__calls.holds, [], 'the credential is never asked');
    assert.deepEqual(s.alerts, []);
    assert.deepEqual(names(s.events), ['door_gate_exit_opened']);
});

test('doors.js: inside, the gate open for a guard: leave, with or without the clone, and no refusal', async () => {
    for (const cred of [true, false]) {
        const s = clickSetup({ player: { x: 100, y: 70 }, room: 'vault' });
        globalThis.__hasCredential = cred;
        s.gates.open(s.g, Date.now());
        s.events.length = 0;
        await handleDoorInteraction(s.b);
        assert.deepEqual(globalThis.__calls.notify, []);
        assert.deepEqual(s.alerts, [], 'no toast');
        assert.deepEqual(names(s.events), [], 'no door_gate_player_opened, no door_gate_denied');
    }
});

test('doors.js: a clone holder outside still opens the gate with it, open or shut', async () => {
    for (const startOpen of [false, true]) {
        const s = clickSetup({ player: { x: 100, y: 150 }, room: 'lobby' });
        globalThis.__hasCredential = true;
        if (startOpen) s.gates.open(s.g, Date.now());
        s.events.length = 0;
        await handleDoorInteraction(s.a);
        assert.deepEqual(globalThis.__calls.notify, ['rfid']);
        assert.equal(s.g.open, true);
        assert.ok(names(s.events).includes('door_gate_player_opened'));
        assert.deepEqual(s.alerts, ['success']);
    }
});

test('doors.js: outside with no clone, the gate open for a guard: refused with door_gate_denied', async () => {
    const s = clickSetup({ player: { x: 100, y: 150 }, room: 'lobby' });
    globalThis.__hasCredential = false;
    s.gates.open(s.g, Date.now());
    s.events.length = 0;
    await handleDoorInteraction(s.a);
    assert.deepEqual(s.alerts, ['error']);
    assert.deepEqual(names(s.events), ['door_gate_denied']);
});

test('the bump: on an open gate that blocks him, cancel the walk and refuse at most once per interval', () => {
    const s = clickSetup({ player: PRESSED, room: 'lobby' });
    let cancels = 0;
    window.cancelClickToMove = () => { cancels++; };
    assert.equal(handleGateBump(s.a, 1000), false, 'a shut gate: silent');
    assert.equal(cancels, 0);
    s.gates.open(s.g, 1000);
    s.events.length = 0;
    assert.equal(handleGateBump(s.a, 1000), true);
    assert.equal(handleGateBump(s.a, 1500), false, 'not again so soon');
    assert.equal(cancels, 2, 'the walk is stopped on every bump');
    assert.deepEqual(s.alerts, ['error']);
    assert.deepEqual(names(s.events), ['door_gate_denied']);
    assert.equal(handleGateBump(s.a, 1000 + BUMP_INTERVAL_MS), true);
    window.gameState.globalVariables.disguised = true;
    s.gates.update(1000 + BUMP_INTERVAL_MS + 1);
    assert.equal(handleGateBump(s.a, 1000 + 3 * BUMP_INTERVAL_MS), false, 'not when it lets him through');
    delete window.cancelClickToMove;
});

test('the bump: a player holding a credential the gate accepts is not refused', () => {
    const s = clickSetup({ player: PRESSED, room: 'lobby' });
    window.cancelClickToMove = () => {};
    s.gates.open(s.g, 1000);
    s.events.length = 0;
    globalThis.__hasCredential = true;
    try {
        assert.equal(handleGateBump(s.a, 1000), false, 'no refusal for a clone holder');
        assert.deepEqual(s.alerts, []);
        assert.deepEqual(names(s.events), []);
    } finally {
        globalThis.__hasCredential = false;
        delete window.cancelClickToMove;
    }
});

test.after(() => { console.log = quiet.log; console.warn = quiet.warn; });

// Code review R2 (m4): heldShutAgainst, asked by NPCBehavior at a timed use (a PIN at the
// reader) just before a leg across the gate, so a held guard turns back without keying.
test('heldShutAgainst: a near guard at a shut gate with a barred player or a force-shut; null otherwise', () => {
    const { gates, g, guard } = setup({ player: NEAR });
    guard.x = 100; guard.y = 140;                                     // within 56 px of the gate
    const info = gates.heldShutAgainst('guard', 'lobby', 'vault', 0);
    assert.ok(info, 'barred player near: held');
    assert.equal(info.connectedRoom, 'vault');
    assert.ok(gates.heldShutAgainst('guard', 'vault', 'lobby', 0), 'either order of rooms');
    assert.equal(gates.heldShutAgainst('guard', 'lobby', 'other', 0), null, 'another pair of rooms');
    assert.equal(gates.heldShutAgainst('someone', 'lobby', 'vault', 0), null, 'not in openFor');
    window.gameState.globalVariables.disguised = true;
    assert.equal(gates.heldShutAgainst('guard', 'lobby', 'vault', 0), null, 'disguised: not barred, the gate will open');
    g.forcedUntil = 5000;
    assert.ok(gates.heldShutAgainst('guard', 'lobby', 'vault', 1000), 'a recent force-shut holds it');
    assert.equal(gates.heldShutAgainst('guard', 'lobby', 'vault', 6000), null, 'force-shut over');
    window.gameState.globalVariables.disguised = false;
    guard.x = 300; guard.y = 300;
    assert.equal(gates.heldShutAgainst('guard', 'lobby', 'vault', 0), null, 'guard not near');
    guard.x = 100; guard.y = 140;
    g.open = true;
    assert.equal(gates.heldShutAgainst('guard', 'lobby', 'vault', 0), null, 'open gate');
});

// Code review R3 (m1, n1): a guard who turned back (either form) does not open the gate as he
// walks away, and both forms of door_gate_guard_turned_back carry the same fields.
test('guardTurnedBack: one set of event fields; the gate does not open for the guard walking away', () => {
    const { gates, g, guard, behaviour, events } = setup({ player: NEAR });
    guard.x = 100; guard.y = 140;
    behaviour.wantsCross = false;                                     // the reader stop: not crossing yet
    const info = gates.heldShutAgainst('guard', 'lobby', 'vault', 0);
    assert.equal(gates.guardTurnedBack('guard', info, { beforeUse: true }), true);
    assert.deepEqual(events, [['door_gate_guard_turned_back',
        { roomId: 'lobby', connectedRoom: 'vault', direction: 'north', x: 100, y: 100, npcId: 'guard', beforeUse: true }]]);
    // The player steps away while he is still within the radius, walking off
    stand(FAR);
    gates.update(1000);
    guard.y = 150;
    gates.update(1100);
    assert.equal(g.open, false, 'not opened for a guard who has turned back');
    assert.ok(!names(events).includes('door_gate_opened'));
    // Out of the radius and back: he may open it again
    guard.y = 300;
    gates.update(1200);
    guard.y = 140;
    gates.update(1300);
    assert.equal(g.open, true, 'opens for him on his next approach');
});

test('guardTurnedBack: keying again or wanting to cross clears the mark', () => {
    let s = setup();
    s.guard.x = 100; s.guard.y = 140;
    s.behaviour.wantsCross = false;
    s.gates.guardTurnedBack('guard', s.gates._gateInfo(s.g));
    s.gates.update(0);
    assert.equal(s.g.open, false);
    s.gates.clearTurnedBack('guard');                                 // he keys at his reader
    s.gates.update(100);
    assert.equal(s.g.open, true);
    s = setup();
    s.guard.x = 100; s.guard.y = 140;
    s.behaviour.wantsCross = false;
    s.gates.guardTurnedBack('guard', s.gates._gateInfo(s.g));
    s.gates.update(0);
    assert.equal(s.g.open, false);
    s.behaviour.wantsCross = true;                                    // his route wants him across
    s.gates.update(100);
    assert.equal(s.g.open, true);
});

test('the timer form of door_gate_guard_turned_back carries the same fields, beforeUse false', () => {
    const { gates, g, guard, events } = setup({ player: NEAR });
    guard.x = 100; guard.y = 140;
    gates.update(1000);
    gates.update(1000 + GUARD_TURN_BACK_MS);
    assert.deepEqual(events, [['door_gate_guard_turned_back',
        { roomId: 'lobby', connectedRoom: 'vault', direction: 'north', x: 100, y: 100, npcId: 'guard', beforeUse: false }]]);
    // The player leaves while he is still near: the gate does not open behind his back
    stand(FAR);
    gates.update(1000 + GUARD_TURN_BACK_MS + 100);
    assert.equal(g.open, false);
});
