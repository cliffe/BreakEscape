// eventMapping conditions with dotted paths (data.result.maxAttemptsReached) - m04 E1, m06 D5.
// Run with: node test/js/npc-condition-dotted-paths.test.mjs   (no dependencies; exits non-zero on failure)
//
// safeEvaluateCondition is module-private, so it is exercised through
// NPCManager._mappingWouldFire, which runs a mapping's condition without side effects.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-condition-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const m = new NPCManager(null, null);
m.npcs.set('guard', { id: 'guard', npcType: 'person' });
let idx = 0;
const holds = (condition, eventData) =>
    m._mappingWouldFire('guard', 'minigame_completed', { handlerIndex: idx++, condition, cooldown: 0 }, eventData).fire;

const silenced = (fn) => {
    const err = console.error;
    console.error = () => {};
    try { return fn(); } finally { console.error = err; }
};

test('a two-level data path compares the nested value', () => {
    assert.equal(holds('data.result.maxAttemptsReached === true', { result: { maxAttemptsReached: true } }), true);
    assert.equal(holds('data.result.maxAttemptsReached === true', { result: { maxAttemptsReached: false } }), false);
    assert.equal(holds('data.result.maxAttemptsReached', { result: { maxAttemptsReached: true } }), true);
    assert.equal(holds('!data.result.maxAttemptsReached', { result: {} }), true);
});

test('a missing link resolves to undefined instead of throwing', () => {
    const cond = 'data.result.maxAttemptsReached === true';
    assert.equal(silenced(() => holds(cond, { result: null })), false);
    assert.equal(silenced(() => holds(cond, {})), false);
    assert.equal(silenced(() => holds(cond, undefined)), false);
    assert.equal(holds('data.result.maxAttemptsReached === undefined', { result: null }), true);
    assert.equal(holds('!data.a.b.c', {}), true);
});

test('deeper paths, includes and && terms work with dotted operands', () => {
    assert.equal(holds("data.a.b.c === 'x'", { a: { b: { c: 'x' } } }), true);
    assert.equal(holds("data.result.code.includes('77')", { result: { code: 'A77B' } }), true);
    assert.equal(holds("data.result.code.includes('77')", { result: {} }), false);
    assert.equal(holds('data.success === false && data.result.maxAttemptsReached === true',
        { success: false, result: { maxAttemptsReached: true } }), true);
    assert.equal(holds('data.success === false && data.result.maxAttemptsReached === true',
        { success: false, result: { maxAttemptsReached: false } }), false);
});

test('dotted globalVars paths read nested global values', () => {
    window.gameState.globalVariables.door = { state: 'open' };
    assert.equal(holds("globalVars.door.state === 'open'", {}), true);
    assert.equal(holds("globalVars.missing.state === 'open'", {}), false);
});

test('single-level operands behave as before', () => {
    window.gameState.globalVariables.alarm = true;
    assert.equal(holds('value === true', { value: true }), true);
    assert.equal(holds("data.room === 'lab'", { room: 'lab' }), true);
    assert.equal(holds('globalVars.alarm', {}), true);
    assert.equal(holds('!globalVars.alarm', {}), false);
});

test('includes on a list tests membership (network_device_unplugged endedPcIds, slice 9.3a)', () => {
    assert.equal(holds("data.endedPcIds.includes('door_box')", { endedPcIds: ['lena_pc', 'door_box'] }), true);
    assert.equal(holds("data.endedPcIds.includes('door')", { endedPcIds: ['door_box'] }), false, 'whole ids only');
    assert.equal(holds("data.endedPcIds.includes('door_box')", { endedPcIds: [] }), false);
    assert.equal(holds("data.jackId === 'comms_port' && data.endedPcIds.includes('door_box')",
        { jackId: 'comms_port', endedPcIds: ['door_box'] }), true);
});

test('an operand on the right compares two values (npc_frustration_changed level against previous, slice 9.2)', () => {
    assert.equal(holds('data.level < data.previous', { level: 90, previous: 100 }), true);
    assert.equal(holds('data.level < data.previous', { level: 68, previous: 34 }), false);
    assert.equal(holds('data.level === data.previous', { level: 0, previous: 0 }), true);
    assert.equal(holds('data.a.b >= data.c', { a: { b: 5 }, c: 5 }), true);
    window.gameState.globalVariables.cap = 50;
    assert.equal(holds('data.level >= globalVars.cap', { level: 60 }), true);
    assert.equal(holds('data.level >= globalVars.cap', { level: 40 }), false);
    assert.equal(holds('data.level < data.previous && data.level <= 90', { level: 80, previous: 90 }), true);
    // A missing operand is undefined, so an ordering test with it is false
    assert.equal(holds('data.level < data.previous', { level: 90 }), false);
    // An unquoted bare word on the right is still a literal string, as before
    assert.equal(holds('data.who === lab', { who: 'lab' }), true);
    assert.equal(holds('data.who === value', { who: 'value', value: 'x' }), true);
});
