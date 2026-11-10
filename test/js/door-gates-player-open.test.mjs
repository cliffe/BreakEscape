// Gate doors, player side: playerOpen (clone-as-entry) opens the gate for one holdMs
// window regardless of playerMayPassIf, holds it through the undisguised-shut rule,
// then lets that rule shut it; plus playerMayPassIf normalisation.
// Run with: node test/js/door-gates-player-open.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const { DoorGates, normaliseGate } = await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));

function setup(gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500, playerMayPassIf: 'disguised' }) {
    const events = [];
    const mk = (roomId, connectedRoom, direction) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false }
    });
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', _sprite: { x: 400, y: 400, visible: true, active: true } }]]) };
    window.npcBehaviorManager = { getBehavior: () => null };
    window.player = { x: 100, y: 130 };                       // 30px from the gate, undisguised
    window.gameState = { globalVariables: { disguised: false } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {} };
    const gates = new DoorGates();
    const a = mk('lobby', 'vault', 'north');
    const b = mk('vault', 'lobby', 'south');
    gates.register(a, gate);
    gates.register(b, null);
    return { gates, a, b, events };
}

test('playerOpen opens the gate and emits door_gate_player_opened, not door_gate_opened', () => {
    const { gates, a, b, events } = setup();
    assert.equal(gates.playerOpen('vault', { now: 1000 }), true);
    assert.equal(a.doorProperties.open, true);
    assert.equal(a.body.enable, false);
    assert.equal(b.body.enable, false);
    const names = events.map(e => e[0]);
    assert.ok(names.includes('door_gate_player_opened'));
    assert.ok(!names.includes('door_gate_opened'));
});

test('playerOpen on a plain door returns false and opens nothing', () => {
    const { gates, a } = setup();
    assert.equal(gates.playerOpen('nowhere', { now: 1000 }), false);
    assert.equal(a.doorProperties.open, false);
});

test('an undisguised player beside the gate would normally keep it shut, but the clone window holds it open', () => {
    const { gates, a } = setup();
    gates.playerOpen('vault', { now: 1000 });
    window.player = { x: 100, y: 150 };                        // beside the gate, not in the doorway
    gates.update(1000 + 2000);                                 // inside the 2500 ms window
    assert.equal(a.doorProperties.open, true);
});

test('once the window ends the undisguised-player rule shuts the gate', () => {
    const { gates, a, events } = setup();
    gates.playerOpen('vault', { now: 1000 });
    window.player = { x: 100, y: 150 };
    gates.update(1000 + 2600);
    assert.equal(a.doorProperties.open, false);
    assert.ok(events.map(e => e[0]).includes('door_gate_closed'));
});

test('a player standing in the doorway is never shut in, even after the window', () => {
    const { gates, a } = setup();
    gates.playerOpen('vault', { now: 1000 });
    window.player = { x: 100, y: 110, body: { left: 91, right: 109, top: 120, bottom: 130 } };   // in the doorway
    gates.update(1000 + 9000);
    assert.equal(a.doorProperties.open, true);
});

test('playerOpen while already open (an NPC passing) extends the hold and emits the player event', () => {
    const { gates, a, events } = setup();
    gates.open([...gates.groups.values()][0], 500);
    assert.equal(a.doorProperties.open, true);
    events.length = 0;
    assert.equal(gates.playerOpen('vault', { now: 1000 }), true);
    assert.deepEqual(events.map(e => e[0]), ['door_gate_player_opened']);
    window.player = { x: 100, y: 150 };
    gates.update(2000);
    assert.equal(a.doorProperties.open, true);
});

test('playerMayPassIf: a missing, empty or non-string value normalises to null (no player rule)', () => {
    assert.equal(normaliseGate({ openFor: 'g' }).playerMayPassIf, null);
    assert.equal(normaliseGate({ openFor: 'g', playerMayPassIf: '' }).playerMayPassIf, null);
    assert.equal(normaliseGate({ openFor: 'g', playerMayPassIf: 5 }).playerMayPassIf, null);
    assert.equal(normaliseGate({ openFor: 'g', playerMayPassIf: ['a'] }).playerMayPassIf, null);
    assert.equal(normaliseGate({ openFor: 'g', playerMayPassIf: 'disguised' }).playerMayPassIf, 'disguised');
});

test('with no playerMayPassIf the player is never barred, so the gate follows the guard only', () => {
    const { gates, a } = setup({ openFor: ['guard'], openRadius: 56, holdMs: 2500 });
    window.npcManager.npcs.get('guard')._sprite.x = 110;
    window.npcManager.npcs.get('guard')._sprite.y = 130;
    gates.update(1000);
    assert.equal(a.doorProperties.open, true);
});

// Playtest E2: a click on the records door while a member of staff held it open and the
// player wore the hi-vis still toasted "Access denied ... you have no badge".
test('openToPlayer: an open gate the player may pass is not refused; a shut or barred one is', () => {
    const { gates } = setup();
    const g = gates.groupsFor('vault')[0];
    assert.equal(gates.openToPlayer(g, 1000), false, 'shut gate');
    gates.open(g, 1000);
    assert.equal(gates.openToPlayer(g, 1000), false, 'open for the guard, player undisguised');
    window.gameState.globalVariables.disguised = true;
    assert.equal(gates.openToPlayer(g, 1000), true, 'open and the player is disguised');
    gates.close(g);
    assert.equal(gates.openToPlayer(g, 1000), false, 'disguised but the gate is shut');
});

test('openToPlayer: the clone window counts, and a gate with no playerMayPassIf lets anyone through while open', () => {
    const { gates } = setup();
    const g = gates.groupsFor('vault')[0];
    gates.playerOpen('vault', { now: 1000 });
    assert.equal(gates.openToPlayer(g, 2000), true, 'inside the clone window, undisguised');
    assert.equal(gates.openToPlayer(g, 1000 + 2600), false, 'window over, undisguised');
    const plain = setup({ openFor: ['guard'], openRadius: 56, holdMs: 2500 });
    const pg = plain.gates.groupsFor('vault')[0];
    plain.gates.open(pg, 1000);
    assert.equal(plain.gates.openToPlayer(pg, 1000), true);
    assert.equal(plain.gates.openToPlayer(null, 1000), false);
});

// Code review R2, E-m3: the three answers to a click, tested as behaviour
test('clickOutcome: a held credential is granted and opens the gate; an open passable gate passes; else denied', () => {
    let s = setup();
    let g = s.gates.groupsFor('vault')[0];
    assert.equal(s.gates.clickOutcome(g, { connectedRoom: 'vault', now: 1000 }), 'denied', 'shut, no credential');
    assert.equal(s.a.doorProperties.open, false);
    s.gates.open(g, 1000);
    assert.equal(s.gates.clickOutcome(g, { connectedRoom: 'vault', now: 1000 }), 'denied', 'open for the guard, player barred');
    window.gameState.globalVariables.disguised = true;
    assert.equal(s.gates.clickOutcome(g, { connectedRoom: 'vault', now: 1000 }), 'pass', 'open and the player may pass');
    assert.deepEqual(s.events.map(e => e[0]), ['door_gate_opened'], 'a pass opens nothing and emits nothing');
    // A credential answers first, even while the gate is open and passable
    assert.equal(s.gates.clickOutcome(g, { holdsCredential: true, connectedRoom: 'vault', now: 1000 }), 'granted');
    assert.deepEqual(s.events.map(e => e[0]), ['door_gate_opened', 'door_gate_player_opened']);
    // And opens a shut gate
    s = setup();
    g = s.gates.groupsFor('vault')[0];
    assert.equal(s.gates.clickOutcome(g, { holdsCredential: true, connectedRoom: 'vault', now: 1000 }), 'granted');
    assert.equal(s.a.doorProperties.open, true);
    // A credential for a door that is no gate grants nothing; an unknown group is denied
    console.warn = () => {};
    assert.equal(s.gates.clickOutcome(null, { holdsCredential: true, connectedRoom: 'cellar' }), 'denied');
    assert.equal(s.gates.clickOutcome(null, {}), 'denied');
});

test('doors.js asks openToPlayer before the gate refusal toast and the door_gate_denied event', () => {
    const d = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    const ask = d.indexOf("if (outcome === 'pass') return;");
    const refuse = d.indexOf("const denied = 'Access denied: this door only opens for authorised staff.';");
    const granted = d.indexOf("'Access granted: cloned staff badge accepted.'");
    assert.ok(ask > 0 && refuse > ask, 'the open-gate check comes before the refusal');
    assert.ok(granted > 0 && granted < ask, 'the clone entry still answers first');
    // The three outcomes come from one tested function, called with the clicked group
    assert.match(d, /const outcome = window\.doorGates\?\.clickOutcome\?\.\(gateGroup, \{\s*holdsCredential: playerHoldsRfidCredentialFor\(requires\), connectedRoom: props\.connectedRoom\s*\}\) \|\| 'denied';/);
    assert.match(d, /if \(outcome === 'granted'\) \{\s*window\.gameAlert\?\.\('Access granted: cloned staff badge accepted\.'/);
});
