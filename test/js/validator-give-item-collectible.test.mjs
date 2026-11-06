// scripts/validate_scenario.rb check_give_item_collectible (declared grants plan §4.3).
// A give_item whose item has an id (or opens_lock) on a path the engine runs is a
// declared grant: it needs no world object, but must be well formed and collide with
// nothing. A give_item with no id still needs a takeable world object with the same
// type and name (lab_physical_pentest F11).
// Run with: node test/js/validator-give-item-collectible.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function run(fn, scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = (scenario) => run('check_give_item_collectible', scenario);

const give = (item, extra = {}) => [{ id: 't', startOnGlobal: 'g', actions: [{ type: 'give_item', item }], ...extra }];
const scenario = (item, rooms, extra = {}) => ({ timers: give(item), rooms, ...extra });
const obj = (o) => ({ takeable: true, ...o });
const text = (name) => ({ type: 'text_file', name, text: 'x' });

// --- Declared grants -------------------------------------------------------------

test('a grant with an id needs no world object', { skip }, () => {
    assert.deepEqual(issues(scenario({ type: 'pc', id: 'remote', hasContents: true, contents: [text('a')] }, { a: { objects: [] } })), []);
});

test('a grant that declares hasContents with no contents errors', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 'remote', hasContents: true }, { a: {} }));
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR: 'timers\[0\]\/actions\[0\]' declares hasContents for 'pc\/remote'/);
});

test('grant contents: missing type, locked with no requires, locked container with no id', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 'r', hasContents: true, contents: [
        { name: 'no type' },
        { type: 'zip_archive', name: 'z', locked: true, lockType: 'password' },
        { type: 'zip_archive', name: 'y', locked: true, lockType: 'password', requires: 'pw', contents: [text('in')] }
    ] }, { a: {} }));
    assert.equal(out.length, 3, out.join('\n'));
    assert.match(out.join('\n'), /no string type/);
    assert.match(out.join('\n'), /locked 'z' \(password\) with no requires/);
    assert.match(out.join('\n'), /locked container 'y' with no id/);
});

test('the hidden twin left behind errors with the migration fix', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 's' }, { a: { objects: [obj({ type: 'pc', id: 's', active: false })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /still has its hidden twin in 'a'.*move the twin's contents into the grant's item and delete the twin/);
});

test('a grant sharing an identity with a gated holder errors, naming the gate (R2 M2)', { skip }, () => {
    const station = { type: 'flag-station', id: 'st', itemsHeld: [obj({ type: 'text_file', id: 'map' })] };
    let out = issues(scenario({ type: 'text_file', id: 'map' }, { a: { objects: [station] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /shares its type and id with the flag-station reward in 'a'/);

    out = issues(scenario({ type: 'text_file', id: 'note' }, { a: { npcs: [{ id: 'nina', itemsHeld: [obj({ type: 'text_file', id: 'note' })] }] } }));
    assert.match(out[0], /NPC 'nina''s itemsHeld/);

    out = issues(scenario({ type: 'key', opens_lock: 'vault' }, { b: { locked: true, objects: [obj({ type: 'key', opens_lock: 'vault' })] } }));
    assert.match(out.join('\n'), /shares its type and id with locked room 'b'/);

    out = issues(scenario({ type: 'pc', id: 'deep' }, { a: { objects: [{ type: 'safe', locked: true, contents: [{ type: 'box', contents: [obj({ type: 'pc', id: 'deep' })] }] }] } }));
    assert.match(out[0], /a locked container in 'a'/, 'holders at any depth');
});

test('a grant with the same type and name as an id-less holder or another grant errors (R2 m3)', { skip }, () => {
    let out = issues(scenario({ type: 'pc', id: 'r', name: 'Remote' }, { a: { objects: [obj({ type: 'pc', name: 'Remote' })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /same type and name as an id-less item/);

    const s = { timers: [...give({ type: 'pc', id: 'r1', name: 'Remote' }), ...give({ type: 'pc', id: 'r2', name: 'Remote' })], rooms: {} };
    out = issues(s);
    assert.equal(out.length, 1);
    assert.match(out[0], /both named 'Remote' with different ids/);
});

test('two grants with one identity but different fields error', { skip }, () => {
    const s = { timers: [...give({ type: 'pc', id: 'r', name: 'A' }), ...give({ type: 'pc', id: 'r', name: 'B' })], rooms: {} };
    assert.match(issues(s)[0], /with different fields/);
    const same = { timers: [...give({ type: 'pc', id: 'r', name: 'A' }), ...give({ type: 'pc', id: 'r', name: 'A' })], rooms: {} };
    assert.deepEqual(issues(same), []);
});

test('grant contents sharing an id with a room object error', { skip }, () => {
    const out = issues(scenario({ type: 'pc', id: 'r', hasContents: true, contents: [{ type: 'text_file', id: 'memo', text: 'x' }] },
        { a: { objects: [{ type: 'notes', id: 'memo' }] } }));
    assert.match(out[0], /contains 'memo', which a room object also uses/);
});

test('a key grant warns that it can be claimed at any time', { skip }, () => {
    const out = issues(scenario({ type: 'key', opens_lock: 'k1', name: 'Key' }, { a: {} }));
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING.*key or lock tool/);
});

test('a give in a timer with other actions or a setGlobal warns', { skip }, () => {
    const s = { timers: [{ id: 't', actions: [{ type: 'give_item', item: { type: 'pc', id: 'r' } }, { type: 'hint', message: 'x' }] }], rooms: {} };
    assert.match(issues(s)[0], /WARNING: timer 't' gives 'pc\/r' and also has other actions/);
    const s2 = { timers: give({ type: 'pc', id: 'r' }, { setGlobal: { x: true } }), rooms: {} };
    assert.match(issues(s2)[0], /also has other actions or a setGlobal/);
});

test('an eventMapping give_item is not run by the engine and errors (R2 m2)', { skip }, () => {
    const s = { rooms: { a: { objects: [], npcs: [{ id: 'n', eventMappings: [{ eventPattern: 'e', actions: [{ type: 'give_item', item: { type: 'pc', id: 'zz' } }] }] }] } } };
    const out = issues(s);
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR: 'rooms\/a\/npcs\[0\]\/eventMappings\[0\]\/actions\[0\]'.*never runs a give_item from there/);
});

test('triggerOnInteract, onInteract and confirm_action grants are grants', { skip }, () => {
    const s = { rooms: { a: { objects: [
        { type: 'notes', id: 'n1', triggerOnInteract: [{ type: 'give_item', item: { type: 'pc', id: 'g1' } }] },
        { type: 'notes', id: 'n2', onInteract: { actions: [{ type: 'confirm_action', onConfirm: [{ type: 'give_item', item: { type: 'pc', id: 'g2' } }] }] } }
    ] } } };
    assert.deepEqual(issues(s), []);
});

test('flagRewards are skipped in any form and on any parent (R2 m5)', { skip }, () => {
    const s = { rooms: { a: { objects: [
        { type: 'vm-launcher', id: 'v', flagRewards: [{ type: 'give_item', item: { type: 'pc', id: 'p1' } }] },
        { type: 'flag-station', id: 'f', flagRewards: { 'flag{x}': { type: 'give_item', item: { type: 'pc', name: 'no id' } } } }
    ] } } };
    assert.deepEqual(issues(s), []);
});

// --- give_items with no id: the world-object rule -------------------------------------

test('an id-less give_item with no matching world object errors and suggests an id', { skip }, () => {
    const out = issues(scenario({ type: 'note', name: 'Memo' }, { a: { objects: [obj({ type: 'note', name: 'Other' })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /ERROR: 'timers\[0\]\/actions\[0\]' is a give_item for 'note' with no id/);
    assert.match(out[0], /give the item an id; it is then a declared grant/);
});

test('an id-less give_item matching a takeable object passes with a nudge to add an id', { skip }, () => {
    const out = issues(scenario({ type: 'note', name: 'Memo' }, { a: { objects: [obj({ type: 'note', name: 'Memo' })] } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING.*has no id.*declared grant/);
});

test('an id-less give_item matching an object that is not takeable errors', { skip }, () => {
    const out = issues(scenario({ type: 'note', name: 'Memo' }, { a: { objects: [{ type: 'note', name: 'Memo' }] } }));
    assert.match(out[0], /ERROR.*not takeable/);
});

test('notepad and id-less start items are accepted', { skip }, () => {
    assert.deepEqual(issues(scenario({ type: 'notepad' }, { a: {} })), []);
    assert.deepEqual(issues(scenario({ type: 'note', name: 'Memo' }, { a: {} }, { startItemsInInventory: [{ type: 'note', name: 'Memo' }] })), []);
});

test('an id-less give_item matching only an object in a locked room warns', { skip }, () => {
    const out = issues(scenario({ type: 'note', name: 'Memo' }, { a: { objects: [] }, b: { locked: true, objects: [obj({ type: 'note', name: 'Memo' })] } }));
    assert.match(out[0], /WARNING.*locked room 'b'/);
});

// --- Grant item fields and sprites (R2 M1) -----------------------------------------

test('unknown fields inside a grant item and its contents are reported', { skip }, () => {
    const s = scenario({ type: 'pc', id: 'r', hasContents: true, contents: [{ type: 'text_file', name: 'a', bogusField: 1 }] }, { a: {} });
    const out = run('check_unknown_fields', s);
    assert.ok(out.some(w => /timers\[0\]\/actions\[0\]\/item\(r\)\/contents\[0\].*unknown field 'bogusField'/.test(w)), out.join('\n'));
});

test('a grant content type with no sprite is reported', { skip }, () => {
    const s = { ...scenario({ type: 'pc', id: 'r', hasContents: true, contents: [{ type: 'no_such_sprite_xyz', name: 'a' }] }, { a: { type: 'room_office', connections: {} } }), startRoom: 'a' };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_common_issues(JSON.parse(STDIN.read), %w[pc text_file]))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(s), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.ok(out.some(w => /timers\[0\]\/actions\[0\]\/item\/contents\[0\]' has type 'no_such_sprite_xyz'/.test(w)), out.join('\n'));
});
