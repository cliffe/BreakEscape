// m03 blind pass 2: Terry's offer choice is signposted; the Phase 2 drive is signed.
// Run with: node test/js/m03-blind2.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dir = 'scenarios/m03_ghost_in_the_machine';

test('Terry: both bribe entry choices say they are an offer', () => {
    const ink = readFileSync(join(root, dir, 'ink/m03_npc_terry_mott.ink'), 'utf8');
    const lines = ink.split('\n').filter((l) => l.includes('Maybe we can work something out'));
    assert.equal(lines.length, 2);
    for (const l of lines) assert.match(l, /\[\(Offer him something\.\) Maybe we can work something out/);
    const json = readFileSync(join(root, dir, 'ink/m03_npc_terry_mott.json'), 'utf8');
    assert.equal((json.match(/\(Offer him something\.\) Maybe we can work something out/g) || []).length, 2);
});

test('Hidden USB directive ends with a clear signature, not a bare letter', () => {
    const erb = readFileSync(join(root, dir, 'scenario.json.erb'), 'utf8');
    const m = erb.match(/^architect_directive = "(.*)"$/m);
    assert.ok(m);
    assert.ok(m[1].endsWith('\\n-- The Architect'));
});
