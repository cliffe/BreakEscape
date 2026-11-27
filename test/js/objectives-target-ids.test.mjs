// Friendface phone code review R5 M2: a collect_items task's targetItemIds entry
// names an item by its id, its lock ref or its name. Items get ids at game
// creation (NPC held items `<npc>_held_<n>`, container contents
// `<parent>_content_<n>`), and m01's find_derek_access lists "Lock Pick Kit" and
// "derek_office_key": the stamped id must not hide the name or the lock ref.
// The server's validate_collection matches the same way (game_test.rb).
// Run with: node --test test/js/objectives-target-ids.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };
window.gameAlert = () => {};
window.lockRef = (d) => d?.opens_lock ?? d?.key_id;

const { ObjectivesManager, targetIdMatches } =
    await import(dataUrl(readFileSync(join(js, 'systems/objectives-manager.js'), 'utf8')));

const TARGETS = ["Derek's Office Key", 'derek_office_key', 'Lock Pick Kit'];

function manager() {
    window.gameState = { globalVariables: {}, objectives: null };
    window.breakEscapeConfig = {};
    const m = new ObjectivesManager({ on() {}, emit() {} });
    m.initialize([{ aimId: 'build_the_case', title: 'Build the case', status: 'active', order: 0, tasks: [
        { taskId: 'find_derek_access', title: 'Find access', type: 'collect_items', targetItemIds: TARGETS,
          targetCount: 1, currentCount: 0, status: 'active' }
    ] }]);
    // Completion talks to the server; record it instead
    m.completed = [];
    m.completeTask = (id) => { m.completed.push(id); };
    return m;
}

test('targetIdMatches tries every candidate, skipping blanks', () => {
    assert.equal(targetIdMatches(TARGETS, 'kevin_park_held_0', undefined, 'Lock Pick Kit'), true);
    assert.equal(targetIdMatches(TARGETS, 'patricia_briefcase_content_0', 'derek_office_key'), true);
    assert.equal(targetIdMatches(TARGETS, 'other_id', null, ''), false);
    assert.equal(targetIdMatches([], 'Lock Pick Kit'), false);
    assert.equal(targetIdMatches(undefined, 'Lock Pick Kit'), false);
});

test("Kevin's lockpick with its stamped held id completes the task by name", () => {
    const m = manager();
    m.handleItemPickup({ itemType: 'lockpick', itemId: 'kevin_park_held_0', itemName: 'Lock Pick Kit' });
    assert.deepEqual(m.completed, ['find_derek_access']);
});

test("Derek's key with its stamped contents id completes the task by lock ref", () => {
    const m = manager();
    m.handleItemPickup({ itemType: 'key', itemId: 'patricia_briefcase_content_0', lockRef: 'derek_office_key',
                         itemName: 'Some other name' });
    assert.deepEqual(m.completed, ['find_derek_access']);
});

test('a key-ring pickup event (keyId) matches by lock ref', () => {
    const m = manager();
    m.handleItemPickup({ itemType: 'key', itemId: 'patricia_briefcase_content_0', keyId: 'derek_office_key',
                         itemName: 'Unknown Key' });
    assert.deepEqual(m.completed, ['find_derek_access']);
});

test('an item with no listed id, lock ref or name does not count', () => {
    const m = manager();
    m.handleItemPickup({ itemType: 'lockpick', itemId: 'kevin_park_held_1', itemName: 'Server Room Keycard',
                         lockRef: 'server_keycard' });
    assert.deepEqual(m.completed, []);
    assert.equal(m.taskIndex.find_derek_access.currentCount, 0);
});

test('reconcile counts a held item by name and a key-ring key by lock ref', () => {
    const m = manager();
    window.inventory = { items: [{ scenarioData: { type: 'lockpick', id: 'kevin_park_held_0', name: 'Lock Pick Kit' } }],
                         keyRing: { keys: [] } };
    m.reconcileWithGameState();
    assert.equal(m.taskIndex.find_derek_access.currentCount, 1);

    const k = manager();
    window.inventory = { items: [], keyRing: { keys: [{ scenarioData: { type: 'key', id: 'patricia_briefcase_content_0',
                                                                         name: 'x', opens_lock: 'derek_office_key' } }] } };
    k.reconcileWithGameState();
    assert.equal(k.taskIndex.find_derek_access.currentCount, 1);
    delete window.inventory;
});
