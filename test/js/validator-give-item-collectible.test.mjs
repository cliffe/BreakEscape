// scripts/validate_scenario.rb check_give_item_collectible: a scenario-side give_item
// only reaches the player if the server's validate_item_collectible can find a takeable
// world object with the same type and id (lab_physical_pentest F11).
// Run with: node --test test/js/validator-give-item-collectible.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_give_item_collectible(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const give = (item) => [{ trigger: 'x', actions: [{ type: 'give_item', item }] }];
const scenario = (item, rooms, extra = {}) => ({ timers: give(item), rooms, ...extra });
const obj = (o) => ({ takeable: true, active: false, ...o });

test('a give_item with no matching world object errors, naming action, item and fix', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 'sofia_remote' }, { a: { objects: [obj({ type: 'pc', id: 'other' })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR: 'timers\[0\]\/actions\[0\]' is a give_item for 'pc\/sofia_remote'/);
    assert.match(out[0], /add a takeable, active:false object with the same type and id/);
});

test('a matching takeable object in an open room passes', { skip }, () => {
    assert.deepEqual(issues(scenario({ type: 'pc', id: 's' }, { a: { objects: [obj({ type: 'pc', id: 's' })] } })), []);
});

test('a matching object that is not takeable errors', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 's' }, { a: { objects: [{ type: 'pc', id: 's' }] } }));
    assert.match(out[0], /ERROR.*not takeable/);
});

test('a key is matched by the lock it opens, a name-only object by name', { skip }, () => {
    assert.deepEqual(issues(scenario({ type: 'key', opens_lock: 'k1' }, { a: { objects: [obj({ type: 'key', opens_lock: 'k1' })] } })), []);
    assert.deepEqual(issues(scenario({ type: 'note', name: 'Memo' }, { a: { objects: [obj({ type: 'note', name: 'Memo' })] } })), []);
});

test('notepad, start items, decor cups and NPC itemsHeld are accepted', { skip }, () => {
    assert.deepEqual(issues(scenario({ type: 'notepad' }, { a: {} })), []);
    assert.deepEqual(issues(scenario({ type: 'pc', id: 's' }, { a: {} }, { startItemsInInventory: [{ type: 'pc', id: 's' }] })), []);
    assert.deepEqual(issues(scenario({ type: 'office-misc-cup', id: 'c1', decor: true }, { a: {} })), []);
    assert.deepEqual(issues(scenario({ type: 'pc', id: 's' }, { a: { npcs: [{ id: 'n', itemsHeld: [obj({ type: 'pc', id: 's' })] }] } })), []);
});

test('an eventMapping give_item is checked too', { skip }, () => {
    const s = { rooms: { a: { objects: [], npcs: [{ id: 'n', eventMappings: [{ eventPattern: 'e', actions: [{ type: 'give_item', item: { type: 'pc', id: 'zz' } }] }] }] } } };
    const out = issues(s);
    assert.equal(out.length, 1);
    assert.match(out[0], /rooms\/a\/npcs\[0\]\/eventMappings\[0\]\/actions\[0\]/);
});

test('an object only in a locked room warns', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 's' }, { a: { objects: [] }, b: { locked: true, objects: [obj({ type: 'pc', id: 's' })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING.*locked room 'b'/);
});
