// scripts/validate_scenario.rb check_minigame_data: an object read by more than one layer
// (a locked 'pc' with lockType ransomware_display: the type's requiresGlobal gate in
// interactions.js and the ransom screen's fields in ransomware-display-minigame.js) knows the
// fields of every matching schema. It used to check the type's schema only, so m02's ransom
// screens reported 63 undeclared fields. Inline fixture.
// Run with: node --test test/js/validator-minigame-data-layers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

const ransom = { organisation: 'Org', ransomAmount: '1', groupName: 'G', walletAddress: 'w', extraLines: ['x'] };
const pc = (id, lockType, minigameData) => ({ type: 'pc', id, name: id, takeable: false, locked: !!lockType, ...(lockType && { lockType }), minigameData });
const scenario = {
  rooms: {
    hall: {
      type: 'room_office', connections: {},
      objects: [
        pc('ransom_ok', 'ransomware_display', ransom),
        pc('ransom_gated', 'ransomware_display', { ...ransom, requiresGlobal: 'g', lockedMessage: 'm' }),
        pc('ransom_typo', 'ransomware_display', { ...ransom, ransomAmmount: '2' }),
        pc('ransom_short', 'ransomware_display', { organisation: 'Org', groupName: 'G' }),
        pc('plain_pc', null, { requiresGlobal: 'g', organisation: 'Org' })
      ]
    }
  }
};

test('minigameData is checked against every schema that matches the object',
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => s.includes('minigameData'));
    const of = (id) => issues.filter(s => s.includes(`(${id})`));
    assert.deepEqual(of('ransom_ok'), [], issues.join('\n'));
    assert.deepEqual(of('ransom_gated'), [], issues.join('\n'));
    assert.equal(of('ransom_typo').length, 1, issues.join('\n'));
    assert.match(of('ransom_typo')[0], /undeclared field 'ransomAmmount'.*'pc' or 'ransomware_display'/);
    assert.equal(of('ransom_short').length, 1, issues.join('\n'));
    assert.match(of('ransom_short')[0], /missing required field 'ransomAmount'/);
    // A pc with no ransom lock still has only the pc schema
    assert.equal(of('plain_pc').length, 1, issues.join('\n'));
    assert.match(of('plain_pc')[0], /undeclared field 'organisation'.*schema for 'pc'\./);
  });
