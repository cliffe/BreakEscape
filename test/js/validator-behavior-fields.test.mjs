// scripts/validate_scenario.rb check_unknown_fields: behavior.facePlayerDistance and
// behavior.personalSpace are known fields (npc-behavior.js parseConfig), m08 E8. Inline fixture.
// Run with: node --test test/js/validator-behavior-fields.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

const npc = (id, behavior) => ({ id, npcType: 'person', behavior });
const scenario = {
  rooms: {
    hall: {
      type: 'room_office', connections: {},
      npcs: [
        npc('ok', { facePlayer: true, facePlayerDistance: 64, personalSpace: { enabled: true, distance: 40, backAwaySpeed: 20, backAwayDistance: 4 } }),
        npc('off', { personalSpace: { enabled: false, distance: 40 } }),
        npc('typo', { personalSpace: { enabled: true, distanse: 40 } }),
        npc('noflag', { personalSpace: { distance: 40 } }),
        npc('zero', { facePlayerDistance: 0 }),
        npc('bad', { personalSpace: true, facePlayerDistanceX: 3 })
      ]
    }
  }
};

test('facePlayerDistance and personalSpace are known; their values and sub-fields are checked',
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => s.includes('/behavior'));
    const ids = (frag) => issues.filter(s => s.includes(frag)).map(s => s.match(/\((\w+)\)/)[1]).sort();
    assert.deepEqual(ids('unknown field'), ['bad', 'typo'], issues.join('\n'));
    assert.ok(issues.some(s => s.includes('(bad)') && s.includes("'facePlayerDistanceX'")));
    assert.ok(issues.some(s => s.includes('(typo)') && s.includes("'distanse'")));
    assert.deepEqual(ids('not "enabled"'), ['noflag']);
    assert.deepEqual(ids('positive number'), ['zero']);
    assert.deepEqual(ids('should be an object'), ['bad']);
    assert.equal(ids('(ok)').length, 0);
    assert.equal(ids('(off)').length, 0);
  });
