// Gate doors, noHold (ACCESS_MODEL_SLICE_9_1_PLAN.md 5.4, step 5): a guard whose
// holdsDoors habit is false will not open her gate with the player close by, and the
// open period she opened is not open to him. lastGuards follows who the gate opened for;
// the careful clause sits in _playerBarred and openToPlayer, so the door work's keep-shut,
// turn-back and skipped hold apply unchanged.
// Run with: node test/js/door-gates-no-hold.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
console.log = () => {};
const { DoorGates, normaliseGate, GUARD_TURN_BACK_MS } =
    await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

// The gate is at (100, 100), lobby to the south, store to the north (the secured room).
const FAR = { x: 400, y: 400 };      // outside the radius
const NEAR = { x: 100, y: 150 };     // within 56 px, off the strip
const AWAY = { x: 300, y: 300 };     // a guard out of the radius
const BY_DOOR = { x: 100, y: 140 };  // a guard within the radius, outside the doorway
const at = (p) => ({ ...p });

function setup({ gate = { openFor: ['sara', 'gary'], noHold: ['sara'], openRadius: 56, holdMs: 2500 },
    player = FAR, room = 'lobby' } = {}) {
    const events = [];
    const sprites = { sara: { ...AWAY, visible: true, active: true }, gary: { ...AWAY, visible: true, active: true } };
    const behaviours = {};
    for (const id of Object.keys(sprites)) {
        behaviours[id] = {
            currentPath: [], pathIndex: 0, wantsCross: true, turnBacks: [],
            wantsToCrossGate() { return this.wantsCross; },
            turnBackFromGate(info) { if (!this.wantsCross) return false; this.turnBacks.push(info); return true; }
        };
    }
    window.npcManager = { npcs: new Map(Object.entries(sprites).map(([id, s]) => [id, { id, _sprite: s }])) };
    window.npcBehaviorManager = { getBehavior: (id) => behaviours[id] || null };
    window.player = at(player);
    window.currentPlayerRoom = room;
    window.lastPlayerRoom = room;
    window.gameState = { globalVariables: { disguised: false } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.playUISound = () => {};
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {} };
    const gates = new DoorGates();
    const mk = (roomId, connectedRoom, direction) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false }
    });
    const a = mk('lobby', 'store', 'north');
    const b = mk('store', 'lobby', 'south');
    assert.equal(gates.register(a, gate), true);
    gates.register(b, null);
    const g = gates.groupsFor('store')[0];
    const put = (id, p) => Object.assign(sprites[id], p);
    return { gates, g, a, b, events, sprites, behaviours, put };
}
const stand = (p, room) => { window.player = at(p); if (room) { window.currentPlayerRoom = room; window.lastPlayerRoom = room; } };
const names = (events) => events.map(e => e[0]);
const lastGuards = (g) => [...g.lastGuards].sort();

test('normaliseGate keeps noHold: a list of strings, default empty', () => {
    assert.deepEqual(normaliseGate({ openFor: ['sara'], noHold: ['sara', 7, null] }).noHold, ['sara']);
    assert.deepEqual(normaliseGate({ openFor: ['sara'] }).noHold, []);
    assert.deepEqual(normaliseGate({ openFor: ['sara'], noHold: 'sara' }).noHold, []);
});

test('lastGuards: open() sets it to the guards near, ticks while open add, close() clears', () => {
    const { gates, g, put } = setup();
    put('sara', BY_DOOR);
    gates.update(0);
    assert.equal(g.open, true, 'opens for her with the player far away');
    assert.deepEqual(lastGuards(g), ['sara']);
    put('gary', BY_DOOR);
    gates.update(100);
    assert.deepEqual(lastGuards(g), ['gary', 'sara'], 'a guard near while open is added');
    put('sara', AWAY); put('gary', AWAY);
    gates.update(200);
    assert.deepEqual(lastGuards(g), ['gary', 'sara'], 'leaving the radius does not remove a guard');
    gates.close(g, 300);
    assert.deepEqual(lastGuards(g), [], 'close clears it');
});

test('a holding guard who stood near while the gate was held shut is not in lastGuards at the next opening', () => {
    const { gates, g, put } = setup();
    put('gary', BY_DOOR);
    gates.closeNow('store', { now: 0 });          // force-shut: held shut for at least 3 s
    gates.update(100);
    gates.update(1000);
    assert.equal(g.open, false, 'held shut');
    assert.deepEqual(lastGuards(g), [], 'never added to while shut');
    put('gary', AWAY);
    put('sara', BY_DOOR);
    gates.update(4000);
    assert.equal(g.open, true);
    assert.deepEqual(lastGuards(g), ['sara'], 'only who it opened for');
    assert.equal(gates.openToPlayer(g, 4000), false, 'so it is careful');
});

test('the keep-shut and the turn-back: a careful guard will not open with the player near', () => {
    const { gates, g, put, events, behaviours } = setup({ player: NEAR });
    put('sara', BY_DOOR);
    gates.update(0);
    assert.equal(g.open, false, 'shut with the player within the radius');
    assert.equal(gates._playerBarred(g), true);
    gates.update(GUARD_TURN_BACK_MS - 1);
    assert.equal(behaviours.sara.turnBacks.length, 0);
    gates.update(GUARD_TURN_BACK_MS);
    assert.equal(g.open, false);
    assert.equal(behaviours.sara.turnBacks.length, 1, 'turnBackFromGate is called');
    const turned = events.filter(e => e[0] === 'door_gate_guard_turned_back');
    assert.equal(turned.length, 1);
    assert.equal(turned[0][1].npcId, 'sara');
    assert.deepEqual(lastGuards(g), [], 'a guard who turns back never opened it');
    assert.ok(!names(events).includes('door_gate_opened'));
    stand(FAR);
    gates.update(GUARD_TURN_BACK_MS + 100);
    assert.equal(g.open, true, 'with the player outside the radius it opens for her');
});

test('only a noHold guard in lastGuards: not open to the player, solid outside, not inside', () => {
    const { gates, g, put, a } = setup();
    put('sara', BY_DOOR);
    gates.update(0);
    assert.equal(g.open, true);
    assert.equal(gates.openToPlayer(g, 0), false);
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: 0 }), true);
    assert.equal(gates.blocksPlayer(g, { playerRoom: 'store', now: 0 }), false);
    assert.equal(a.body.enable, true, 'the body is on for the outside player from the opening tick');
    assert.equal(gates.clickOutcome(g, { playerRoom: 'lobby', now: 0 }), 'denied');
});

test('after the careful guard has left the radius, until close the gate is shut or solid for the outside player', () => {
    const { gates, g, put } = setup();
    put('sara', BY_DOOR);
    gates.update(0);
    put('sara', { x: 100, y: 40 });                   // through, beyond the radius
    // The player starts towards the door one second later and walks in
    const path = [FAR, { x: 300, y: 300 }, { x: 200, y: 220 }, { x: 140, y: 180 }, NEAR, { x: 100, y: 145 }];
    let t = 1000;
    let sawShut = false;
    for (const p of path) {
        stand(p);
        gates.update(t);
        if (g.open) assert.equal(gates.blocksPlayer(g, { playerRoom: 'lobby', now: t }), true, `open and passable at ${t}`);
        else sawShut = true;
        t += 100;
    }
    assert.ok(sawShut, 'shut once he is near');
});

test('the skipped hold: near and nobody in the doorway shuts it on that tick; far, it waits for holdMs', () => {
    let s = setup();
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    s.put('sara', AWAY);
    stand(NEAR);
    s.gates.update(100);
    assert.equal(s.g.open, false, 'shut at once');

    s = setup();
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    s.put('sara', AWAY);
    s.gates.update(100);
    s.gates.update(2000);
    assert.equal(s.g.open, true, 'the player far: lingers for holdMs');
    s.gates.update(2600);
    assert.equal(s.g.open, false);
});

test('the door work\'s answers stand: an exit opening, a holder, a mixed pair, no noHold, playerMayPassIf, a clone', () => {
    // lastGuards empty: an exit opening from inside
    let s = setup({ player: NEAR, room: 'store' });
    assert.equal(s.gates.clickOutcome(s.g, { playerRoom: 'store', now: 0 }), 'exit');
    assert.deepEqual(lastGuards(s.g), []);
    assert.equal(s.gates.openToPlayer(s.g, 0), true, 'nobody counts: not careful');

    // Closed, then opened for a guard who holds doors
    s = setup({ player: NEAR });
    s.put('gary', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.g.open, true, 'a holder opens beside the player');
    assert.equal(s.gates.openToPlayer(s.g, 0), true);

    // Both near: one holder is enough
    s = setup({ player: NEAR });
    s.put('gary', BY_DOOR); s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.g.open, true);
    assert.deepEqual(lastGuards(s.g), ['gary', 'sara']);
    assert.equal(s.gates.openToPlayer(s.g, 0), true);

    // A careful opening joined by a holder while open is not careful any more
    s = setup();
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.gates.openToPlayer(s.g, 0), false);
    s.put('gary', BY_DOOR);
    s.gates.update(100);
    assert.equal(s.gates.openToPlayer(s.g, 100), true);

    // No noHold: as the door work leaves it
    s = setup({ player: NEAR, gate: { openFor: ['sara'], openRadius: 56, holdMs: 2500 } });
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.g.open, true);
    assert.equal(s.gates.openToPlayer(s.g, 0), true);

    // playerMayPassIf ignores noHold
    s = setup({ player: NEAR, gate: { openFor: ['sara'], noHold: ['sara'], playerMayPassIf: 'disguised', openRadius: 56, holdMs: 2500 } });
    window.gameState.globalVariables.disguised = true;
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.g.open, true, 'disguised: opens beside him');
    assert.equal(s.gates.openToPlayer(s.g, 0), true);
    window.gameState.globalVariables.disguised = false;
    assert.equal(s.gates.openToPlayer(s.g, 0), false, 'and answers by its global alone');

    // A clone hold answers yes first
    s = setup({ player: NEAR });
    s.put('sara', BY_DOOR);
    stand(FAR);
    s.gates.update(0);
    assert.equal(s.gates.openToPlayer(s.g, 0), false);
    s.gates.playerOpen('store', { now: 100 });
    assert.equal(s.gates.openToPlayer(s.g, 200), true);
    assert.equal(s.gates.blocksPlayer(s.g, { playerRoom: 'lobby', now: 200 }), false);
});

// Review R1 minor 2: the end of a clone window on a careful gate.
const IN_DOORWAY = { x: 100, y: 128 };  // overlaps the door body (y 124 to 132)
const HOLD = 2500;

function cloneBesideSara() {
    // Shut with Sara by the door and the player near; he clones: open() takes Sara as
    // the guard this period belongs to, then she walks off
    const s = setup({ player: NEAR });
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.g.open, false, 'barred: shut');
    s.gates.playerOpen('store', { now: 100 });
    assert.equal(s.g.open, true);
    assert.deepEqual(lastGuards(s.g), ['sara']);
    s.put('sara', AWAY);
    s.gates.update(200);
    assert.equal(s.gates.openToPlayer(s.g, 200), true, 'open to him during the window');
    assert.equal(s.g.bodyOff, true);
    return s;
}

test('clone window ends on a careful gate with the player near: shuts on that tick', () => {
    const s = cloneBesideSara();
    s.gates.update(100 + HOLD - 1);
    assert.equal(s.g.open, true, 'held open through the window');
    s.gates.update(100 + HOLD);
    assert.equal(s.g.open, false, 'shut at once when the window ends');
    assert.equal(s.g.bodyOff, false, 'and solid');
});

test('clone window ends with the player in the doorway: stays open, body off until he steps off', () => {
    const s = cloneBesideSara();
    stand(IN_DOORWAY);
    s.gates.update(100 + HOLD);
    assert.equal(s.gates.openToPlayer(s.g, 100 + HOLD), false, 'the window is over and the period is careful');
    assert.equal(s.g.open, true, 'never shut on a player crossing');
    assert.equal(s.g.bodyOff, true, 'the body is not switched on under him');
    s.gates.update(100 + HOLD + 500);
    assert.equal(s.g.open, true);
    assert.equal(s.g.bodyOff, true);
    stand(NEAR);
    s.gates.update(100 + HOLD + 600);
    assert.equal(s.g.bodyOff, false, 'on once he has stepped back off');
    assert.equal(s.g.open, false, 'and shut on that tick');
});

test('clone window ends with nobody in lastGuards: not careful, the gate lingers as any gate', () => {
    const s = setup({ player: NEAR });
    // Gary is out of the radius but his path crosses the doorway, which keeps a gate open
    s.put('gary', AWAY);
    s.gates.playerOpen('store', { now: 100 });
    assert.deepEqual(lastGuards(s.g), [], 'nobody near at the click');
    s.behaviours.gary.currentPath = [{ x: 100, y: 200 }, { x: 100, y: 60 }];
    s.behaviours.gary.pathIndex = 1;
    s.gates.update(100 + HOLD);
    assert.equal(s.g.open, true, 'not shut at once: the player is not barred');
    assert.equal(s.gates._playerBarred(s.g), false);
    assert.equal(s.gates.openToPlayer(s.g, 100 + HOLD), true);
    assert.equal(s.g.bodyOff, true);
    s.behaviours.gary.currentPath = [];
    s.gates.update(100 + HOLD + 100);
    assert.equal(s.g.open, false, 'shuts by the usual rule once nothing holds it');
});

test('Sara opens, it closes, then Gary opens with the player near: open to the player', () => {
    const s = setup();
    s.put('sara', BY_DOOR);
    s.gates.update(0);
    assert.equal(s.gates.openToPlayer(s.g, 0), false, 'her period is careful');
    s.put('sara', AWAY);
    s.gates.update(100);
    s.gates.update(100 + HOLD);
    assert.equal(s.g.open, false, 'closed after holdMs');
    assert.deepEqual(lastGuards(s.g), []);
    stand(NEAR);
    s.put('gary', BY_DOOR);
    s.gates.update(100 + HOLD + 100);
    assert.equal(s.g.open, true, 'Gary holds doors: opens beside the player');
    assert.deepEqual(lastGuards(s.g), ['gary']);
    assert.equal(s.gates.openToPlayer(s.g, 100 + HOLD + 100), true);
    assert.equal(s.gates.blocksPlayer(s.g, { playerRoom: 'lobby', now: 100 + HOLD + 100 }), false);
});
