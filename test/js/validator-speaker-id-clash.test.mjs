// scripts/validate_scenario.rb check_speaker_id_name_clashes (A1 R1 m1): an NPC id that is another
// NPC's display name (any case) is warned about; same-name records and unrelated ids are not.
// Run with: node --test test/js/validator-speaker-id-clash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function clashes(npcs) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_speaker_id_name_clashes(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { r: { npcs } } }), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('an id equal to another record display name is a warning', { skip }, () => {
    const out = clashes([{ id: 'ghost', displayName: 'Spectre' }, { id: 'y', displayName: 'Ghost' }]);
    assert.equal(out.length, 1);
    assert.match(out[0], /^⚠️ WARNING: .*id 'ghost' is also the display name of 'y'/);
});

test('two records sharing a display name, or unrelated ids, are not', { skip }, () => {
    assert.deepEqual(clashes([{ id: 'hax_post', displayName: 'Agent HaX' }, { id: 'agent_0x99', displayName: 'Agent HaX' }]), []);
    assert.deepEqual(clashes([{ id: 'ghost', displayName: 'Ghost' }]), []);
});
