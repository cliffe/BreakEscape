// scripts/validate_scenario.rb check_combination_cryptex_locks (unlock gaps build, 2026-11-12).
// The server checks a combination padlock or cryptex against `requires` only, so the validator
// errors on a lock the minigame can never open and warns on an answer left in the old client fields.
// Run with: node --test test/js/validator-combination-cryptex.test.mjs
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
      puts JSON.generate(check_combination_cryptex_locks(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const room = (objects) => ({ rooms: { lobby: { objects } } });
const lock = (fields) => ({ type: 'safe', name: 'Box', locked: true, ...fields });

test('three dials in range and a word that fits its wheels are fine', { skip }, () => {
    assert.deepEqual(issues(room([
        lock({ lockType: 'combination', requires: '12-30-5' }),
        lock({ lockType: 'combination', requires: [0, 39, 7] }),
        lock({ lockType: 'cryptex', requires: 'CIPHER', cryptexConfig: { wheelCount: 6 } }),
        lock({ lockType: 'cryptex', requires: 'magic' })
    ])), []);
});

test('a combination out of range, or not three numbers, is an error', { skip }, () => {
    const out = issues(room([
        lock({ lockType: 'combination', requires: '12-30-45' }),
        lock({ lockType: 'combination', requires: '12-30' })
    ]));
    assert.equal(out.length, 2);
    for (const line of out) assert.match(line, /ERROR: .* must be three numbers from 0 to 39/);
});

test('a cryptex word of the wrong length or off its wheels is an error', { skip }, () => {
    const out = issues(room([
        lock({ lockType: 'cryptex', requires: 'CIPHERS', cryptexConfig: { wheelCount: 6 } }),
        lock({ lockType: 'cryptex', requires: 'AB', cryptexConfig: { wheelCount: 2, alphabets: ['AB', 'XY'] } })
    ]));
    assert.equal(out.length, 2);
    assert.match(out[0], /7 letters but the cryptex has 6 wheels/);
    assert.match(out[1], /letter that is not on its wheel/);
});

test('no requires is an error that names the old field; an old answer field warns', { skip }, () => {
    const out = issues(room([
        lock({ lockType: 'combination', combination: [1, 2, 3] }),
        lock({ lockType: 'cryptex', requires: 'MAGIC', cryptexConfig: { answer: 'MAGIC' } })
    ]));
    assert.equal(out.length, 3);
    assert.match(out[0], /ERROR: .* combination lock with no 'requires'.*Move the answer from 'combination'/);
    assert.match(out[1], /WARNING: .* still has the answer in 'combination'/);
    assert.match(out[2], /WARNING: .* still has the answer in 'cryptexConfig.answer'/);
});

// Unlock gaps R1: n2 (a string wheelCount) and m2 (an NPC-held container with no id)
function run(fn, scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('R1 n2: a wheelCount written as text is read as a number, and nonsense is an error', { skip }, () => {
    assert.deepEqual(issues(room([lock({ lockType: 'cryptex', requires: 'CIPHER', cryptexConfig: { wheelCount: '6' } })])), []);
    const out = issues(room([lock({ lockType: 'cryptex', requires: 'CIPHER', cryptexConfig: { wheelCount: 'six' } })]));
    assert.ok(out.some(i => i.startsWith('❌') && i.includes('wheelCount must be a whole number')), out.join('\n'));
});

test('R1 m2: a container an NPC carries with no id is an error; with an id it is fine', { skip }, () => {
    const npc = (item) => ({ rooms: { lobby: { npcs: [{ id: 'courier', itemsHeld: [item] }] } } });
    assert.deepEqual(run('check_npc_held_containers', npc({ type: 'bag1', id: 'bag', name: 'Bag', locked: true })), []);
    assert.deepEqual(run('check_npc_held_containers', npc({ type: 'key', name: 'Key' })), [], 'a plain item needs no id');
    for (const item of [{ type: 'bag1', name: 'Bag' }, { type: 'notes', name: 'Folder', contents: [] }, { type: 'safe', name: 'Tin', locked: true }]) {
        const out = run('check_npc_held_containers', npc(item));
        assert.equal(out.length, 1, JSON.stringify(item));
        assert.match(out[0], /^❌ ERROR: 'rooms\/lobby\/npcs\/courier\/itemsHeld\[0\]'.*has no 'id'/);
    }
    const top = run('check_npc_held_containers', { npcs: [{ id: 'mailer', itemsHeld: [{ type: 'briefcase', name: 'Case' }] }] });
    assert.equal(top.length, 1);
});
