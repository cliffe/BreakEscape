// scripts/validate_npc_needs.rb: dead icon config while "npcThoughts" is false (D77, review R1 m4).
// Run with: bin/test-js test/js/validator-npc-thoughts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const dead = (issues) => issues.some(s => s.includes('while npcThoughts is false'));
const base = { rooms: { office: { type: 'room_office', objects: [] } } };

test('npcThoughts false with showPressingNeeds true warns', { skip }, () => {
    assert.ok(dead(check({ ...base, npcThoughts: false, showPressingNeeds: true })));
});
test('npcThoughts false with an actionIcons table warns', { skip }, () => {
    assert.ok(dead(check({ ...base, npcThoughts: false, actionIcons: {} })));
});
test('no warning when the flag is false alone, true, or absent', { skip }, () => {
    assert.ok(!dead(check({ ...base, npcThoughts: false })));
    assert.ok(!dead(check({ ...base, npcThoughts: false, showPressingNeeds: false })));
    assert.ok(!dead(check({ ...base, npcThoughts: true, showPressingNeeds: true })));
    assert.ok(!dead(check({ ...base, showPressingNeeds: true })));
});
