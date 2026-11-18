// scripts/validate_scenario.rb check_pin_locks: dustable (boolean) and dustHint (string)
// apply to PIN locks only. Run with: node test/js/validator-pin-dust.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function issues(lock) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_pin_locks(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { r: { objects: [{ name: 'safe', locked: true, ...lock }] } } }),
        encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const pin = { lockType: 'pin', requires: '1234' };

test('valid dustable and dustHint on a PIN lock are clean', { skip }, () => {
    assert.deepEqual(issues({ ...pin, dustable: true, dustHint: 'One digit repeats.' }), []);
    assert.deepEqual(issues({ ...pin, dustable: false }), []);
});
test('dustHint without dustable true warns that it is inert', { skip }, () => {
    assert.ok(issues({ ...pin, dustHint: 'One digit repeats.' }).some(s => s.includes('without dustable: true')));
    assert.ok(issues({ ...pin, dustable: false, dustHint: 'x' }).some(s => s.includes('without dustable: true')));
});
test('a dustable PIN of one or two distinct digits warns that dusting reveals it', { skip }, () => {
    assert.ok(issues({ ...pin, requires: '1111', dustable: true }).some(s => s.includes('one or two distinct digits')));
    assert.ok(issues({ ...pin, requires: '3883', dustable: true }).some(s => s.includes('one or two distinct digits')));
    assert.ok(issues({ ...pin, requires: '7337', dustable: true }).some(s => s.includes('one or two distinct digits')));
    assert.deepEqual(issues({ ...pin, requires: '3873', dustable: true }), []);
});
test('dustable must be a boolean', { skip }, () => {
    assert.ok(issues({ ...pin, dustable: 'no' }).some(s => s.includes('dustable must be true or false')));
});
test('dustHint must be a non-empty string', { skip }, () => {
    assert.ok(issues({ ...pin, dustHint: '' }).some(s => s.includes('dustHint must be a non-empty string')));
    assert.ok(issues({ ...pin, dustHint: 5 }).some(s => s.includes('dustHint must be a non-empty string')));
});
test('dustable on a non-PIN lock warns', { skip }, () => {
    const out = issues({ lockType: 'key', requires: 'k', dustable: true });
    assert.ok(out.some(s => s.includes('not a PIN lock')));
});
