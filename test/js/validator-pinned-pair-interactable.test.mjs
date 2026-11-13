// scripts/validate_scenario.rb check_recurring_bugs rule 6 (lab wedge review R2 m6): two pinned
// objects inside one interaction range warn, because one click can open the other, except when
// either is interactable: false, which no click or proximity pass can open.
// Run with: node --test test/js/validator-pinned-pair-interactable.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function rangeWarnings(objects) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_recurring_bugs(JSON.parse(STDIN.read), ${JSON.stringify(root)}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { hall: { objects } } }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => s.includes('interaction range'));
}

const at = (id, x, y, extra = {}) => ({ id, name: id, type: 'notes', position: { x, y }, ...extra });

test('two clickable objects pinned on one spot still warn', { skip }, () => {
    const out = rangeWarnings([at('a', 8, 5.3), at('b', 8, 5.3, { interactable: true })]);
    assert.equal(out.length, 1);
    assert.match(out[0], /^⚠️ WARNING: rooms\/hall: objects\[0\] 'a' and objects\[1\] 'b' are pinned 0 px apart/);
});

test('a pair where either object is interactable: false does not warn', { skip }, () => {
    assert.deepEqual(rangeWarnings([at('plain', 8, 5.3, { interactable: false }), at('wedge', 8, 5.3, { interactable: true })]), []);
    assert.deepEqual(rangeWarnings([at('wedge', 8, 5.3), at('plain', 8, 5.3, { interactable: false })]), []);
});

test('a third clickable object near a non-interactable pair still warns against the other clickable one', { skip }, () => {
    const out = rangeWarnings([
        at('plain', 8, 5.3, { interactable: false }),
        at('wedge', 8, 5.3),
        at('sign', 8.5, 5.3)
    ]);
    assert.equal(out.length, 1);
    assert.match(out[0], /'wedge' and objects\[2\] 'sign' are pinned 16 px apart/);
});
