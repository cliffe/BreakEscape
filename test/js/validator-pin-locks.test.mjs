// scripts/validate_scenario.rb check_pin_locks (backlog batch, 2026-10-22).
// biometric_breach's 5-digit door PIN couldn't be typed: the PIN never reaches the
// client and the pad assumed 4 digits. The server now sends the PIN's length; the
// validator errors on PIN locks the pad still can't open.
// Run with: node --test test/js/validator-pin-locks.test.mjs
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
      puts JSON.generate(check_pin_locks(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const room = (lock, objects = []) => ({ rooms: { closet: { locked: true, lockType: 'pin', ...lock, objects } } });

test('a 4- or 5-digit PIN with no pinLength is fine (the server sends the length)', { skip }, () => {
    assert.deepEqual(issues(room({ requires: '1234' })), []);
    assert.deepEqual(issues(room({ requires: '72958' })), []);
});

test('a matching pinLength is fine', { skip }, () => {
    assert.deepEqual(issues(room({ requires: '204816', pinLength: 6 })), []);
});

test('a pinLength that disagrees with the PIN is an error', { skip }, () => {
    const out = issues(room({ requires: '72958', pinLength: 4 }));
    assert.equal(out.length, 1);
    assert.match(out[0], /INVALID: 'rooms\/closet' has pinLength 4 but its PIN is 5 digits/);
});

test('a PIN with letters is an error, in nested objects too', { skip }, () => {
    const out = issues(room({ requires: '1234' }, [
        { type: 'safe', name: 'Safe', locked: true, lockType: 'pin', requires: '12a4' }
    ]));
    assert.equal(out.length, 1);
    assert.match(out[0], /INVALID: 'rooms\/closet\/objects\[0\]' \(Safe\) PIN '12a4' has characters other than digits/);
});

test('a locked PIN lock with no PIN warns; other lock types are ignored', { skip }, () => {
    const out = issues(room({}, [
        { type: 'pc', name: 'PC', locked: true, lockType: 'password', requires: 'letters!' }
    ]));
    assert.equal(out.length, 1);
    assert.match(out[0], /WARNING: 'rooms\/closet' is a locked PIN lock with no 'requires' PIN/);
});
