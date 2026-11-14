// SIMS-4 (plan 5.4): the staff-room pair's eventMappings, read from test_needs_sims's own scenario
// and run through NPCManager's real mapping path (_setupEventMappings, _mappingWouldFire and the
// condition evaluator), so the conditions the scenario ships are the ones under test (S4 R2 m4).
// Run with: node test/js/npc-needs-sims-mappings.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-sims-mappings-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

// The scenario file has no ERB tags, so it parses as JSON.
const scenario = JSON.parse(readFileSync(join(here, '../../scenarios/test_needs_sims/scenario.json.erb'), 'utf8'));
const staffNpc = id => scenario.rooms.staff_room.npcs.find(n => n.id === id);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

// A manager carrying one NPC's real mappings; _handleEventMapping records each mapping that fires
// (by its index in the scenario list) and applies onceOnly bookkeeping as the real handler does.
function setup(npcId, globals = {}) {
    window.gameState.globalVariables = { ...globals };
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set(npcId, { id: npcId, npcType: 'person' });
    const mappings = staffNpc(npcId).eventMappings;
    const fired = [];
    m._handleEventMapping = (id, pattern, config, data) => {
        const check = m._mappingWouldFire(id, pattern, config, data);
        if (!check.fire) return;
        check.triggered.count++; check.triggered.lastTime = check.now; m.triggeredEvents.set(check.eventKey, check.triggered);
        fired.push(mappings.find(x => x.eventPattern === pattern && JSON.stringify(x.needs || x.setGlobal || x.completeTask) === JSON.stringify(config.needs || config.setGlobal || config.completeTask)) || { eventPattern: pattern });
    };
    m._setupEventMappings(npcId, mappings);
    return { m, fired, emit: (ev, data) => m.eventDispatcher.emit(ev, data) };
}

test("Jodie's boiler coupling fires on Keith's start only, with the scenario's own condition", () => {
    const t = setup('jodie');
    t.emit('npc_use_started:staff_boiler', { npcId: 'jodie', objectId: 'staff_boiler' });
    assert.equal(t.fired.length, 0, "her own boiler start does not bring her");
    t.emit('npc_use_started:staff_microwave', { npcId: 'keith', objectId: 'staff_microwave' });
    assert.equal(t.fired.length, 0, "Keith's microwave start is not the coupling's event");
    t.emit('npc_use_started:staff_boiler', { npcId: 'keith', objectId: 'staff_boiler' });
    assert.equal(t.fired.length, 1);
    assert.deepEqual(t.fired[0].needs, { set: { caffeine: 20 } }, 'the coupling sets only her caffeine');
});

test("Keith's cooler coupling fires on Jodie's start only", () => {
    const t = setup('keith');
    t.emit('npc_use_started:staff_cooler', { npcId: 'keith', objectId: 'staff_cooler' });
    assert.equal(t.fired.length, 0);
    t.emit('npc_use_started:staff_cooler', { npcId: 'jodie', objectId: 'staff_cooler' });
    assert.equal(t.fired.length, 1);
    assert.deepEqual(t.fired[0].needs, { set: { thirst: 20 } });
});

test('S4 R2 M2: the job-called exchange sends Jodie to the lockers, and only while the job is open', () => {
    const open = setup('jodie', { job_called: true });
    open.emit('npc_exchange_heard:exchange_job_called', { knot: 'exchange_job_called', complete: true });
    const needs = open.fired.filter(f => f.needs).map(f => f.needs);
    assert.deepEqual(needs, [{ set: { upkeep: 0 } }], 'upkeep drops to 0 once');
    assert.ok(open.fired.some(f => f.completeTask === 'hear_job_called'), 'and the task mapping fires as before');
    const done = setup('jodie', { job_called: true, job_cleared: true });
    done.emit('npc_exchange_heard:exchange_job_called', { knot: 'exchange_job_called', complete: true });
    assert.equal(done.fired.filter(f => f.needs).length, 0, 'a cleared job sends her nowhere');
});

test('S4 R2 M2: finishing at the lockers sets job_cleared and ticks see_light_fixed, for Jodie only', () => {
    const t = setup('jodie', { job_called: true, heard_exchange_job_called: true });
    t.emit('npc_used:staff_lockers', { npcId: 'keith', objectId: 'staff_lockers' });
    assert.equal(t.fired.length, 0);
    t.emit('npc_used:staff_lockers', { npcId: 'jodie', objectId: 'staff_lockers' });
    assert.equal(t.fired.length, 1);
    assert.deepEqual(t.fired[0].setGlobal, { job_cleared: true });
    assert.equal(t.fired[0].completeTask, 'see_light_fixed');
    t.emit('npc_used:staff_lockers', { npcId: 'jodie', objectId: 'staff_lockers' });
    assert.equal(t.fired.length, 1, 'onceOnly');
});

test('S4 R2 M2, reload: re-entering the staff room re-sends her only between the exchange and the fix', () => {
    const before = setup('jodie', { job_called: true });
    before.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(before.fired.filter(f => f.needs && f.needs.set.upkeep === 0).length, 0, 'not before the exchange');
    const between = setup('jodie', { job_called: true, heard_exchange_job_called: true });
    between.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(between.fired.filter(f => f.needs && f.needs.set.upkeep === 0).length, 1, 'between: she goes');
    const after = setup('jodie', { job_called: true, heard_exchange_job_called: true, job_cleared: true });
    after.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(after.fired.filter(f => f.needs && f.needs.set.upkeep === 0).length, 0, 'not after the fix');
});
