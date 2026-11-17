// SIMS-4 (plan 5.4): the staff-room pair's eventMappings, read from test_needs_sims's own scenario
// and run through NPCManager's real mapping path (_setupEventMappings, _handleEventMapping with its
// fire check, condition evaluator and action half), so the conditions and actions the scenario ships
// are the ones under test (S4 R2 m4, S4 R3 m4). Only the systems the actions reach are stubs:
// window.npcNeedsSystem.control and window.objectivesManager.completeTask record their calls, and
// setGlobal writes the real window.gameState.globalVariables.
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

// A manager carrying one NPC's real mappings. Each action the real handler takes is recorded:
// needs control calls ([npcId, config]), completed task ids, and the globals it writes.
function setup(npcId, globals = {}) {
    window.gameState.globalVariables = { ...globals };
    const needs = [], tasks = [];
    window.npcNeedsSystem = { control: (id, c) => needs.push([id, c]) };
    window.objectivesManager = { completeTask: async id => { tasks.push(id); } };
    window.eventDispatcher = null;
    window.npcConversationStateManager = null;
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set(npcId, { id: npcId, npcType: 'person' });
    m._setupEventMappings(npcId, staffNpc(npcId).eventMappings);
    return {
        m, needs, tasks, globals: () => window.gameState.globalVariables,
        persisted: () => [...m.triggeredEvents.values()].filter(t => t.persist).length,
        emit: async (ev, data) => { m.eventDispatcher.emit(ev, data); await new Promise(r => setImmediate(r)); }
    };
}

const quiet = console.log;
test.before(() => { console.log = () => {}; });
test.after(() => { console.log = quiet; });

test("Jodie's boiler coupling fires on Keith's start only, with the scenario's own condition", async () => {
    const t = setup('jodie');
    await t.emit('npc_use_started:staff_boiler', { npcId: 'jodie', objectId: 'staff_boiler' });
    assert.equal(t.needs.length, 0, "her own boiler start does not bring her");
    await t.emit('npc_use_started:staff_microwave', { npcId: 'keith', objectId: 'staff_microwave' });
    assert.equal(t.needs.length, 0, "Keith's microwave start is not the coupling's event");
    await t.emit('npc_use_started:staff_boiler', { npcId: 'keith', objectId: 'staff_boiler' });
    assert.deepEqual(t.needs, [['jodie', { set: { caffeine: 20 } }]], 'the coupling sets only her caffeine, through npcNeedsSystem.control');
});

test("Keith's cooler coupling fires on Jodie's start only", async () => {
    const t = setup('keith');
    await t.emit('npc_use_started:staff_cooler', { npcId: 'keith', objectId: 'staff_cooler' });
    assert.equal(t.needs.length, 0);
    await t.emit('npc_use_started:staff_cooler', { npcId: 'jodie', objectId: 'staff_cooler' });
    assert.deepEqual(t.needs, [['keith', { set: { thirst: 20 } }]]);
});

test('S4 R2 M2 / R3 m5: the job-called exchange ticks its task and sends Jodie to the lockers, once', async () => {
    const t = setup('jodie', { job_called: true });
    await t.emit('npc_exchange_heard:exchange_job_called', { knot: 'exchange_job_called', complete: true });
    assert.deepEqual(t.needs, [['jodie', { set: { upkeep: 0 } }]], 'upkeep drops to 0');
    assert.deepEqual(t.tasks, ['hear_job_called'], 'and the task ticks, from the same mapping');
    assert.equal(t.persisted(), 1, 'the onceOnly handler is saved so a reload does not replay it');
    await t.emit('npc_exchange_heard:exchange_job_called', { knot: 'exchange_job_called', complete: true });
    assert.equal(t.needs.length, 1, 'onceOnly');
    assert.equal(t.tasks.length, 1, 'onceOnly');
});

test('S4 R2 M2: finishing at the lockers sets job_cleared and ticks see_light_fixed, for Jodie only', async () => {
    const t = setup('jodie', { job_called: true, heard_exchange_job_called: true });
    await t.emit('npc_used:staff_lockers', { npcId: 'keith', objectId: 'staff_lockers' });
    assert.equal(t.globals().job_cleared, undefined);
    assert.equal(t.tasks.length, 0);
    await t.emit('npc_used:staff_lockers', { npcId: 'jodie', objectId: 'staff_lockers' });
    assert.equal(t.globals().job_cleared, true, 'setGlobal wrote gameState.globalVariables');
    assert.deepEqual(t.tasks, ['see_light_fixed']);
    assert.equal(t.persisted(), 1);
    t.globals().job_cleared = 'marker';
    await t.emit('npc_used:staff_lockers', { npcId: 'jodie', objectId: 'staff_lockers' });
    assert.equal(t.globals().job_cleared, 'marker', 'onceOnly: no second write');
    assert.equal(t.tasks.length, 1, 'onceOnly');
});

test('S4 R2 M2, reload: re-entering the staff room re-sends her only between the exchange and the fix', async () => {
    const sent = t => t.needs.filter(([, c]) => c.set && c.set.upkeep === 0).length;
    const before = setup('jodie', { job_called: true });
    await before.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(sent(before), 0, 'not before the exchange');
    const between = setup('jodie', { job_called: true, heard_exchange_job_called: true });
    await between.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(sent(between), 1, 'between: she goes');
    const after = setup('jodie', { job_called: true, heard_exchange_job_called: true, job_cleared: true });
    await after.emit('room_entered:staff_room', { roomId: 'staff_room' });
    assert.equal(sent(after), 0, 'not after the fix');
});
