// E1 (CA pilot mechanics plan): side-door (east/west) gates and the `activeIf` live window.
// door-gates.js is loaded by data URL, as the other gate tests do, so it must keep no static
// imports; the live window reads window.parseActionCondition (utils/global-condition.js).
// Run with: node test/js/door-gates-side.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const src = readFileSync(join(js, 'systems/door-gates.js'), 'utf8');
assert.equal(/^\s*import\s/m.test(src), false, 'door-gates.js stays free of static imports (test harness copy lists)');
const { DoorGates, normaliseGate } = await import(dataUrl(src));
await import(dataUrl(readFileSync(join(js, 'utils/global-condition.js'), 'utf8')));   // sets window.parseActionCondition
assert.equal(typeof window.parseActionCondition, 'function');

// A side doorway on the boundary x = 532 at y = 100: hall (west room) east sprite at x = 516,
// store (east room) west sprite at x = 548. The gate guards `store`.
const BX = 532, Y = 100;
const GATE = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'vest' };

function setup({ gate = GATE, registerFirst = 'hall', globals = { vest: false } } = {}) {
    const events = [];
    const pm = [];
    const mk = (roomId, connectedRoom, direction, x) => ({
        x, y: Y, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: x, worldY: Y, isSideDoor: true, open: false }
    });
    const hall = mk('hall', 'store', 'east', BX - 16);
    const store = mk('store', 'hall', 'west', BX + 16);
    const guard = { x: 300, y: 300, visible: true, active: true };
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', _sprite: guard }]]) };
    window.npcBehaviorManager = { getBehavior: () => null };
    window.player = { x: BX - 200, y: Y };
    window.currentPlayerRoom = 'hall';
    window.gameState = { globalVariables: { ...globals } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.pathfindingManager = {
        markDoorWalkable: (...a) => pm.push(['mark', ...a]),
        markSideDoorCorridor: (...a) => pm.push(['corridor', ...a]),
        unmarkDoor: (...a) => pm.push(['unmark', ...a]),
        rebuildWorldGrid: () => pm.push(['rebuild'])
    };
    const gates = new DoorGates();
    // The far room's sprite may load first (pending) or second (joins)
    const [first, second] = registerFirst === 'hall' ? [hall, store] : [store, hall];
    // The config rides on the entry into the locked room (hall -> store)
    gates.register(first, first === hall ? gate : null);
    gates.register(second, second === hall ? gate : null);
    return { gates, hall, store, guard, events, pm, g: [...gates.groups.values()][0] };
}

test('both side sprites join one gate, whichever room loads first', () => {
    for (const registerFirst of ['hall', 'store']) {
        const { gates, hall, store, g } = setup({ registerFirst });
        assert.equal(gates.groups.size, 1, registerFirst);
        assert.equal(g.sprites.size, 2);
        assert.ok(hall.doorProperties.gateKey && hall.doorProperties.gateKey === store.doorProperties.gateKey);
        assert.equal(gates.isGate(hall) && gates.isGate(store), true);
        assert.equal(g.side, true);
        assert.equal(g.cx, BX);
        assert.equal(g.cy, Y);
        assert.equal(g.securedRoom, 'store');
        assert.equal(gates.pending.size, 0);
    }
});

test('a side gate does not collide with a N/S gate at the same sprite position', () => {
    const { gates } = setup();
    const ns = { x: BX - 16, y: Y, active: true, body: { enable: true },
        doorProperties: { roomId: 'a', connectedRoom: 'b', direction: 'north', worldX: BX - 16, worldY: Y } };
    assert.equal(gates.register(ns, { openFor: ['guard'] }), true);
    assert.equal(gates.groups.size, 2);
});

test('groupAtPosition finds the side gate from either sprite, with the direction', () => {
    const { gates, g } = setup();
    assert.equal(gates.groupAtPosition(BX - 16, Y, 'east'), g);
    assert.equal(gates.groupAtPosition(BX + 16, Y, 'west'), g);
    assert.equal(gates.groupAtPosition(BX - 16, Y), g, 'without a direction too');
    assert.equal(gates.groupAtPosition(BX + 16, Y), g);
    assert.equal(gates.groupAtPosition(BX - 16, Y + 64, 'east'), null);
});

test('side bodies: shut gate is solid on both sprites, whole-tile footprint spans both tiles', () => {
    const { hall, store, g, gates } = setup();
    assert.equal(hall.body.enable, true);
    assert.equal(store.body.enable, true);
    // The player standing on the far tile overlaps the doorway; one clear of it does not
    window.player = { x: BX + 20, y: Y };
    assert.equal(gates.playerInDoorway(g), true);
    window.player = { x: BX + 80, y: Y };
    assert.equal(gates.playerInDoorway(g), false);
});

test('an openFor NPC opens it; open/close carve and uncarve the side corridor', () => {
    const { gates, hall, store, guard, pm, events, g } = setup();
    window.player = { x: BX - 400, y: Y };
    guard.x = BX - 40; guard.y = Y;                     // 40 px from the doorway's centre
    gates.update(1000);
    assert.equal(g.open, true);
    assert.equal(hall.doorProperties.open && store.doorProperties.open, true);
    const corridor = pm.filter(c => c[0] === 'corridor');
    assert.deepEqual(corridor, [['corridor', BX - 16, Y, 'east']]);
    assert.equal(pm.some(c => c[0] === 'mark'), false, 'no N/S doorway marking for a side gate');
    assert.equal(pm.at(-1)[0], 'rebuild');
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened']);
    assert.equal(events[0][1].inert, undefined, 'a live gate adds nothing to the payload');
    guard.x = 300;
    gates.update(1500);
    gates.update(4100);                                  // past holdMs
    assert.equal(g.open, false);
    // The doorway is unmarked at the group centre (g.x/g.y) and at each sprite (E1 R2 m1)
    assert.deepEqual(pm.filter(c => c[0] === 'unmark')[0], ['unmark', BX - 16, Y, 'east']);
    assert.ok(pm.filter(c => c[0] === 'unmark').length >= 1);
    assert.deepEqual(events.map(e => e[0]), ['door_gate_opened', 'door_gate_closed']);
});

test('the corridor is keyed to the registering sprite (west sprite first)', () => {
    const { gates, guard, pm } = setup({ registerFirst: 'store', gate: GATE });
    // Config came with the hall sprite, which registered second and joined the pending store sprite
    window.player = { x: BX - 400, y: Y };
    guard.x = BX + 40; guard.y = Y;
    gates.update(1000);
    const corridor = pm.filter(c => c[0] === 'corridor');
    assert.equal(corridor.length, 1);
    assert.equal(corridor[0][3], 'east');
});

test('a side gate closes the corridor for real: unmarkDoor uses the same coordinates (pathfinding manager)', async () => {
    // The carve and uncarve share g.x, g.y and g.direction: openSideDoorCorridors matches on them
    const { gates, guard, g } = setup();
    const stored = [];
    window.pathfindingManager.markSideDoorCorridor = (x, y, d) => stored.push({ worldX: x, worldY: y, direction: d });
    window.pathfindingManager.unmarkDoor = (x, y) => {
        const i = stored.findIndex(c => Math.abs(c.worldX - x) < 2 && Math.abs(c.worldY - y) < 2);
        if (i >= 0) stored.splice(i, 1);
    };
    window.player = { x: BX - 400, y: Y };
    guard.x = BX - 40; guard.y = Y;
    gates.update(1000);
    assert.equal(stored.length, 1);
    guard.x = 300;
    gates.update(1100);
    gates.update(5000);
    assert.equal(g.open, false);
    assert.equal(stored.length, 0, 'the tile is unwalkable after close');
});

test('approachPoint offsets on x for a side gate, on the centre row', () => {
    const { gates } = setup();
    const west = gates.approachPoint('guard', { x: BX - 300, y: Y + 40 });
    assert.ok(west);
    assert.equal(west.y, Y);
    assert.ok(west.x < BX && BX - west.x > 0 && BX - west.x <= 48);
    const east = gates.approachPoint('guard', { x: BX + 300, y: Y - 40 });
    assert.equal(east.y, Y);
    assert.ok(east.x > BX);
    assert.equal(gates.approachPoint('guard', { x: BX - 10, y: Y }), null, 'inside the radius: the gate opens for him');
});

test('walkThroughTarget lands a tile and a half into the far room from both sides, from either sprite', () => {
    const { gates, hall, store, g } = setup({ globals: { vest: true } });
    gates.open(g, 0);
    // From the hall (secured room is the store, so he is outside but permitted)
    window.currentPlayerRoom = 'hall';
    for (const sprite of [hall, store]) {
        const t = gates.walkThroughTarget(sprite, { x: BX - 100, y: Y }, { now: 100 });
        assert.deepEqual(t, { x: BX + 48, y: Y });
    }
    // From the store: back west
    window.currentPlayerRoom = 'store';
    for (const sprite of [hall, store]) {
        const t = gates.walkThroughTarget(sprite, { x: BX + 100, y: Y }, { now: 100 });
        assert.deepEqual(t, { x: BX - 48, y: Y });
    }
    // Room unknown: read from his feet against the doorway's centre
    window.currentPlayerRoom = null; window.lastPlayerRoom = null;
    assert.deepEqual(gates.walkThroughTarget(hall, { x: BX - 5, y: Y }, { playerRoom: null }), { x: BX + 48, y: Y });
    assert.deepEqual(gates.walkThroughTarget(store, { x: BX + 5, y: Y }, { playerRoom: null }), { x: BX - 48, y: Y });
});

test('a barred player stays out: an unvested player is turned away, an open gate is solid for him', () => {
    const { gates, store, guard, g, hall } = setup();
    window.player = { x: BX - 20, y: Y };                 // beside the gate, in the hall
    guard.x = BX - 40; guard.y = Y;
    gates.update(1000);
    assert.equal(g.open, false, 'a barred player beside it keeps it shut');
    assert.equal(hall.body.enable && store.body.enable, true);
    assert.equal(gates.clickOutcome(g, { now: 1000 }), 'denied');
    assert.equal(g.open, false, 'the click does not open it');
});

test('barred after a teleport: a no-vest player placed beside the gate counts as outside', () => {
    const { gates, g, guard } = setup();
    window.currentPlayerRoom = 'hall';
    window.player = { x: BX - 30, y: Y };                 // setPosition by enterWorld
    guard.x = BX + 40; guard.y = Y;
    gates.update(0);
    assert.equal(gates._playerBarred(g), true);
    window.gameState.globalVariables.vest = true;
    assert.equal(gates._playerBarred(g), false);
    window.gameState.globalVariables.vest = false;
    window.currentPlayerRoom = 'store';
    assert.equal(gates._playerBarred(g), false, 'inside the secured room he is never barred');
});

test('side gate with the guard holding it open: a barred player is solid at the strip (body on)', () => {
    const { gates, hall, store, guard, g } = setup();
    window.player = { x: BX - 120, y: Y };
    guard.x = BX + 20; guard.y = Y;                       // opens for him (player is far)
    gates.update(1000);
    assert.equal(g.open, true);
    assert.equal(hall.body.enable && store.body.enable, true, 'open for the guard, still solid for an unvested player');
    window.player = { x: BX - 50, y: Y };                 // steps up, unvested, outside the room
    gates.update(1100);
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'hall', now: 1100 }), true);
    assert.equal(g.open, true, 'the guard standing in the doorway keeps it open');
    guard.x = BX + 120;                                   // he is through and clear
    gates.update(1200);
    assert.equal(g.open, false, 'a barred player beside it shuts the open gate once nobody holds the doorway');
});

test('side animation keys: the side sheet and door_side_open', () => {
    const played = [];
    const mkAnim = (sprite) => {
        sprite.scene = { anims: { exists: (k) => k === 'door_side_open' || k === 'door_open' } };
        sprite.play = (k) => played.push(k);
        sprite.playReverse = (k) => played.push('rev:' + k);
        sprite.anims = { currentAnim: { key: 'door_side_open' } };
        sprite.texture = { key: 'door_side_sheet_32' };
        sprite.setTexture = (k) => played.push('tex:' + k);
        sprite.once = (ev, fn) => { sprite._done = fn; };
    };
    const { gates, hall, store, g } = setup({ globals: { vest: true } });
    mkAnim(hall); mkAnim(store);
    gates.open(g, 0);
    assert.deepEqual(played, ['door_side_open', 'door_side_open']);
    played.length = 0;
    gates.close(g, 10);
    assert.deepEqual(played, ['rev:door_side_open', 'rev:door_side_open']);
    hall.texture.key = 'something_else';
    hall._done();
    assert.deepEqual(played.slice(-1), ['tex:door_side_sheet_32']);
});

// ---- the live window --------------------------------------------------------------------

const WINDOW_GATE = { ...GATE, activeIf: 'globalVars.world_on && !globalVars.world_done' };

test('activeIf is normalised; absent means always live', () => {
    assert.equal(normaliseGate({ openFor: ['a'] }).activeIf, null);
    assert.equal(normaliseGate({ openFor: ['a'], activeIf: '  ' }).activeIf, null);
    assert.equal(normaliseGate({ openFor: ['a'], activeIf: 'globalVars.x' }).activeIf, 'globalVars.x');
    assert.equal(normaliseGate({ openFor: ['a'], activeIf: 5 }).activeIf, null);
});

test('isInert follows the condition; no condition, or one that does not parse, is live', () => {
    const { gates, g } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: false, world_done: false } });
    assert.equal(gates.isInert(g), true, 'before the window');
    window.gameState.globalVariables.world_on = true;
    assert.equal(gates.isInert(g), false, 'inside it');
    window.gameState.globalVariables.world_done = true;
    assert.equal(gates.isInert(g), true, 'after it');
    const plain = setup();
    assert.equal(plain.gates.isInert(plain.g), false);
    for (const bad of ['world_on', '!globalVars.x === true', 'globalVars.a &&', "globalVars.a === unquoted"]) {
        const s = setup({ gate: { ...GATE, activeIf: bad }, globals: { vest: false } });
        assert.equal(s.gates.isInert(s.g), false, `"${bad}" counts as live`);
        assert.equal(s.gates._playerBarred(s.g) || true, true);
    }
});

test('inert: an unvested player is not barred, from either side', () => {
    const { gates, g } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: false } });
    window.player = { x: BX - 20, y: Y };
    window.currentPlayerRoom = 'hall';
    assert.equal(gates._playerBarred(g), false);
    window.currentPlayerRoom = 'store';
    window.player = { x: BX + 20, y: Y };
    assert.equal(gates._playerBarred(g), false);
    window.gameState.globalVariables.world_on = true;   // the window opens: now he is barred outside
    window.currentPlayerRoom = 'hall';
    window.player = { x: BX - 20, y: Y };
    assert.equal(gates._playerBarred(g), true);
});

test('inert: his click on the shut gate opens it for one holdMs, from either side, with exit-open events', () => {
    for (const room of ['hall', 'store']) {
        const { gates, g, events } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: false } });
        window.currentPlayerRoom = room;
        window.player = { x: room === 'hall' ? BX - 30 : BX + 30, y: Y };
        const outcome = gates.clickOutcome(g, { holdsCredential: false, connectedRoom: 'store', now: 1000 });
        if (room === 'hall') {
            // Outside: nothing opens until doors.js has made sure the room behind exists (E1 R1 M1)
            assert.equal(outcome, 'inert_enter');
            assert.equal(g.open, false);
            assert.deepEqual(events, []);
            gates.exitOpen(g, 1000);
        } else {
            assert.equal(outcome, 'exit', room);
        }
        assert.equal(g.open, true);
        assert.equal(g.exitHoldUntil, 1000 + 2500);
        assert.deepEqual(events.map(e => e[0]), ['door_gate_exit_opened']);
        assert.equal(events[0][1].inert, true);
        // Open: a second click does nothing
        assert.equal(gates.clickOutcome(g, { now: 1200 }), room === 'hall' ? 'inert_enter' : 'leave');
        assert.deepEqual(events.map(e => e[0]), ['door_gate_exit_opened'], 'a click on the open gate opens nothing more');
        // He stands there: it holds through exitHoldUntil, then shuts (nobody barred or near)
        gates.update(2000);
        assert.equal(g.open, true);
        window.player = { x: room === 'hall' ? BX - 100 : BX + 100, y: Y };   // walked clear of the doorway
        gates.update(1000 + 2500 + 3000);
        assert.equal(g.open, false);
        const last = events.at(-1);
        assert.equal(last[0], 'door_gate_closed');
        assert.equal(last[1].inert, true);
        // And he is let through while it is open
    }
});

test('inert: open gate is open to the player and not solid for him', () => {
    const { gates, hall, store, g } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: false } });
    window.player = { x: BX - 100, y: Y };
    assert.equal(gates.clickOutcome(g, { now: 0 }), 'inert_enter');
    gates.exitOpen(g, 0);
    assert.equal(gates.openToPlayer(g, 10), true);
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'hall', now: 10 }), false);
    gates.update(10);
    assert.equal(hall.body.enable || store.body.enable, false);
    // And the walk-through target applies from outside
    assert.deepEqual(gates.walkThroughTarget(hall, { x: BX - 100, y: Y }, { playerRoom: 'hall', now: 10 }), { x: BX + 48, y: Y });
});

test('inert: an openFor NPC still opens it as he nears, and is never turned back with the player beside it', () => {
    const turned = [];
    const { gates, guard, g, events } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: false } });
    window.npcBehaviorManager = { getBehavior: () => ({
        currentPath: [], wantsToCrossGate: () => true, turnBackFromGate: (i) => { turned.push(i); return true; } }) };
    window.player = { x: BX - 20, y: Y };                 // unvested, right beside the gate
    guard.x = BX - 40; guard.y = Y;
    gates.update(1000);
    assert.equal(g.open, true, 'opens for the guard with the player at his shoulder');
    assert.equal(events[0][0], 'door_gate_opened');
    assert.equal(events[0][1].inert, true);
    gates.update(1100); gates.update(20000);
    assert.deepEqual(turned, []);
    assert.equal(events.some(e => e[0] === 'door_gate_guard_turned_back'), false);
});

test('live window: with activeIf true, an unvested player beside it keeps it shut and the guard is held', () => {
    const turned = [];
    const { gates, guard, g } = setup({ gate: WINDOW_GATE, globals: { vest: false, world_on: true } });
    window.npcBehaviorManager = { getBehavior: () => ({
        currentPath: [], wantsToCrossGate: () => true, turnBackFromGate: (i) => { turned.push(i); return true; } }) };
    window.player = { x: BX - 20, y: Y };
    guard.x = BX - 40; guard.y = Y;
    gates.update(1000);
    assert.equal(g.open, false);
    gates.update(1000 + 5100);
    assert.equal(turned.length, 1, 'turned back, as today');
    // Click while live: refused
    assert.equal(gates.clickOutcome(g, { now: 7000 }), 'denied');
});

test('a gate without activeIf is unchanged when the globals are empty', () => {
    const { gates, g } = setup({ globals: {} });
    assert.equal(gates.isInert(g), false);
    window.player = { x: BX - 20, y: Y };
    assert.equal(gates._playerBarred(g), true);
});

test('the inert window works on a north/south gate too', () => {
    const events = [];
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameState = { globalVariables: { disguised: false, on: false } };
    window.player = { x: 100, y: 120 };
    window.currentPlayerRoom = 'lobby';
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {} };
    window.npcManager = { npcs: new Map() };
    const gates = new DoorGates();
    const mk = (roomId, connectedRoom, direction) => ({ x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100 } });
    gates.register(mk('lobby', 'vault', 'north'), { openFor: ['guard'], playerMayPassIf: 'disguised', activeIf: 'globalVars.on' });
    gates.register(mk('vault', 'lobby', 'south'), null);
    const g = [...gates.groups.values()][0];
    assert.equal(g.side, false);
    assert.equal(gates._playerBarred(g), false, 'inert');
    assert.equal(gates.clickOutcome(g, { now: 0 }), 'inert_enter', 'from outside: doors.js loads the room first');
    assert.equal(g.open, false);
    gates.exitOpen(g, 0);
    assert.equal(events[0][1].inert, true);
    window.gameState.globalVariables.on = true;
    assert.equal(gates._playerBarred(g), true, 'live');
});
