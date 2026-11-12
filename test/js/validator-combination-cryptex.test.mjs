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
    for (const line of out) assert.match(line, /INVALID: .* must be three numbers from 0 to 39/);
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
    assert.match(out[0], /INVALID: .* combination lock with no 'requires'.*Move the answer from 'combination'/);
    assert.match(out[1], /WARNING: .* still has the answer in 'combination'/);
    assert.match(out[2], /WARNING: .* still has the answer in 'cryptexConfig.answer'/);
});
