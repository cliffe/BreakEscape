// One sound for the RFID door, whoever opens it (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md 2):
// a gate door with an RFID lock plays the door release on every open (guard or clone), heard
// only from the doorway's two rooms and falling to silence with distance; the RFID lock paths
// in unlock-system.js play the same sound through the shared ui-sounds.js helper.
// Run with: node test/js/door-gates-sound.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
globalThis.window = {};
const { DoorGates, normaliseGate, gateSoundVolume, gateSoundKey, GATE_SOUND_VOLUME } =
    await import(dataUrl(readFileSync(join(js, 'systems/door-gates.js'), 'utf8')));
const { playUISound, DOOR_RELEASE_SOUND, DOOR_RELEASE_VOLUME } = await import('../../public/break_escape/js/systems/ui-sounds.js');

/** A gate at (100, 100) between lobby and vault, an RFID lock on the vault, the guard far off. */
function setup(gate = { openFor: ['guard'], openRadius: 56, holdMs: 2500 }, { lockType = 'rfid' } = {}) {
    const played = [];
    const mk = (roomId, connectedRoom, direction, withLock) => ({
        x: 100, y: 100, active: true, body: { enable: true },
        doorProperties: { roomId, connectedRoom, direction, worldX: 100, worldY: 100, open: false,
            ...(withLock ? { lockType, requires: 'vault_badge' } : {}) }
    });
    const guard = { x: 400, y: 400, visible: true, active: true };
    window.npcManager = { npcs: new Map([['guard', { id: 'guard', _sprite: guard }]]) };
    window.npcBehaviorManager = { getBehavior: () => null };
    window.player = { x: 100, y: 160 };
    window.currentPlayerRoom = 'lobby';
    window.lastPlayerRoom = 'lobby';
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: () => {} };
    window.pathfindingManager = { markDoorWalkable() {}, unmarkDoor() {}, rebuildWorldGrid() {} };
    window.soundManager = { play: (key, opts) => played.push([key, opts?.volume]) };
    window.playUISound = playUISound;
    const gates = new DoorGates();
    gates.register(mk('lobby', 'vault', 'north', true), gate);
    gates.register(mk('vault', 'lobby', 'south', false), null);
    const g = [...gates.groups.values()][0];
    return { gates, g, guard, played };
}

test('gateSoundVolume: full within 96 px, linear to 0 at 384 px', () => {
    assert.equal(gateSoundVolume(0), 0.9);
    assert.equal(gateSoundVolume(96), 0.9);
    assert.ok(Math.abs(gateSoundVolume(240) - 0.45) < 1e-9);
    assert.equal(gateSoundVolume(384), 0);
    assert.equal(gateSoundVolume(400), 0);
    assert.equal(gateSoundVolume(NaN), 0);
    assert.equal(GATE_SOUND_VOLUME, DOOR_RELEASE_VOLUME);
});

test('gateSoundKey: rfid lock by default; the gate\'s own key wins; false silences; other lock types are silent', () => {
    assert.equal(gateSoundKey({ lockType: 'rfid', cfg: normaliseGate({ openFor: 'g' }) }), 'rfid_unlock');
    assert.equal(gateSoundKey({ lockType: 'key', cfg: normaliseGate({ openFor: 'g' }) }), null, 'any requires is not enough (review n7)');
    assert.equal(gateSoundKey({ lockType: null, cfg: normaliseGate({ openFor: 'g' }) }), null);
    assert.equal(gateSoundKey({ lockType: 'rfid', cfg: normaliseGate({ openFor: 'g', sound: false }) }), null);
    assert.equal(gateSoundKey({ lockType: 'key', cfg: normaliseGate({ openFor: 'g', sound: 'door_knock' }) }), 'door_knock');
    assert.equal(normaliseGate({ openFor: 'g', sound: '' }).sound, undefined);
    assert.equal(normaliseGate({ openFor: 'g', sound: true }).sound, undefined);
});

test('the guard opens the gate: one release per open, none on close, at the distance volume', () => {
    const { gates, g, guard, played } = setup();
    guard.x = 100; guard.y = 120;                     // inside the radius
    gates.update(1000);
    assert.equal(g.open, true);
    assert.deepEqual(played, [[DOOR_RELEASE_SOUND, 0.9]]);
    gates.update(1100);                               // still open: nothing more
    guard.x = 400; guard.y = 400;
    gates.update(1200);
    gates.update(1200 + 3000);                        // hold over: shuts, silently
    assert.equal(g.open, false);
    assert.equal(played.length, 1);
    // The player across the room hears it quieter
    window.player = { x: 100, y: 340 };               // 240 px away
    guard.x = 100; guard.y = 120;
    gates.update(9000);
    assert.equal(played.length, 2);
    assert.ok(Math.abs(played[1][1] - 0.45) < 1e-9);
    // Far away in the same room: nothing
    guard.x = 400; guard.y = 400;
    gates.update(9100); gates.update(20000);
    window.player = { x: 100, y: 600 };
    guard.x = 100; guard.y = 120;
    gates.update(30000);
    assert.equal(g.open, true);
    assert.equal(played.length, 2);
});

test('a player in a third room hears nothing, even close by; the last room counts in a doorway gap', () => {
    const { gates, guard, played } = setup();
    window.currentPlayerRoom = 'office';
    guard.x = 100; guard.y = 120;
    gates.update(1000);
    assert.deepEqual(played, []);
    const s2 = setup();
    window.currentPlayerRoom = '';
    window.lastPlayerRoom = 'vault';
    s2.guard.x = 100; s2.guard.y = 120;
    s2.gates.update(1000);
    assert.equal(s2.played.length, 1);
});

test('a clone presented at a shut gate and at a gate already open for the guard: one release each', () => {
    const { gates, g, guard, played } = setup();
    gates.playerOpen('vault', { now: 1000 });
    assert.equal(g.open, true);
    assert.deepEqual(played, [[DOOR_RELEASE_SOUND, 0.9]]);
    const s = setup();
    s.guard.x = 100; s.guard.y = 120;
    s.gates.update(1000);
    assert.equal(s.played.length, 1);
    s.gates.playerOpen('vault', { now: 1100 });
    assert.equal(s.played.length, 2, 'the reader releases for the clone even though the door was open');
});

test('"sound": false silences the gate; a gate with no rfid lock is silent', () => {
    const a = setup({ openFor: ['guard'], openRadius: 56, holdMs: 2500, sound: false });
    a.gates.playerOpen('vault', { now: 1000 });
    assert.deepEqual(a.played, []);
    const b = setup({ openFor: ['guard'] }, { lockType: 'key' });
    b.gates.playerOpen('vault', { now: 1000 });
    assert.deepEqual(b.played, []);
    const c = setup({ openFor: ['guard'], sound: 'door_knock' }, { lockType: null });
    c.gates.playerOpen('vault', { now: 1000 });
    assert.deepEqual(c.played, [['door_knock', 0.9]]);
});

test('a PIN or key locked gate is silent, for the guard and for a player let through', () => {
    for (const lockType of ['pin', 'key']) {
        const s = setup({ openFor: ['guard'] }, { lockType });
        s.guard.x = 100; s.guard.y = 120;
        s.gates.update(1000);
        assert.equal(s.g.open, true, `${lockType}: the guard opens it`);
        s.gates.playerOpen('vault', { now: 1100 });
        const t = setup({ openFor: ['guard'] }, { lockType });
        t.gates.playerOpen('vault', { now: 1000 });
        assert.equal(t.g.open, true);
        assert.deepEqual([...s.played, ...t.played], [], `${lockType}: no sound`);
    }
});

test('doors.js: the clone path at a gate plays no sound of its own (playerOpen sounds once)', () => {
    const src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    assert.doesNotMatch(src, /rfid_unlock/);
});

test('playUISound door_release plays rfid_unlock at 0.9 by default, through soundManager', () => {
    const played = [];
    window.soundManager = { play: (k, o) => played.push([k, o]) };
    playUISound('door_release');
    playUISound('door_release', { volume: 0.3 });
    assert.deepEqual(played, [['rfid_unlock', { volume: 0.9 }], ['rfid_unlock', { volume: 0.3 }]]);
});

// Code review R1 m5 (engine feedback changes): a gate's own "sound" key plays any audio the
// game has loaded, not only the names in the sound manager's fixed list
test('a gate sound key outside the sound manager\'s list plays from the scene\'s loaded audio', () => {
    const managed = [];
    const scenePlays = [];
    const added = [];
    const loaded = new Set(['door_knock']);
    window.soundManager = { enabled: true, masterVolume: 0.5, sounds: { rfid_unlock: {} }, play: (k, o) => managed.push([k, o]) };
    window.game = {
        cache: { audio: { exists: (k) => loaded.has(k) } },
        sound: {
            get: () => null,
            add: (k) => { added.push(k); return { play: (o) => scenePlays.push([k, o]) }; }
        }
    };
    playUISound('door_release', { key: 'door_knock', volume: 0.8 });
    assert.deepEqual(scenePlays, [['door_knock', { volume: 0.4 }]], 'at the master volume');
    assert.deepEqual(managed, []);
    // a listed key still goes through the manager
    playUISound('door_release', { key: 'rfid_unlock', volume: 0.6 });
    assert.deepEqual(managed, [['rfid_unlock', { volume: 0.6 }]]);
    // an audio key that is not loaded plays nothing (and throws nothing)
    playUISound('door_release', { key: 'no_such_sound' });
    assert.equal(scenePlays.length, 1);
    // sound off: nothing from the scene either
    window.soundManager.enabled = false;
    playUISound('door_release', { key: 'door_knock' });
    assert.equal(scenePlays.length, 1);
    delete window.game;
    // the schema and the README say so
    const schema = readFileSync(join(js, '../../../scripts/scenario-schema.json'), 'utf8');
    assert.match(schema, /A sound key plays that sound \(any audio key the game has loaded\)/);
    const readme = readFileSync(join(js, '../../../README_scenario_design.md'), 'utf8');
    assert.match(readme, /a sound key plays that sound \(any audio key the game has loaded/);
});

test('unlock-system.js: the three RFID success paths call the shared helper; no direct game.sound use is left', () => {
    const src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
    assert.equal(src.split('playRfidUnlockSound();').length - 1, 3);
    assert.match(src, /const playRfidUnlockSound = \(\) => \{\s*try \{ playUISound\('door_release'\); \} catch \(e\) \{\}\s*\};/);
    assert.doesNotMatch(src, /game\.sound\.(get|add)\('rfid_unlock'\)/);
});
