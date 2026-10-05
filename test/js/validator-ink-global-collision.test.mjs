// scripts/validate_scenario.rb check_ink_global_collisions: an ink VAR named like a scenario global
// (the engine syncs the two) that the ink uses as its own flag. Fixture only.
// Run with: node --test test/js/validator-ink-global-collision.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/ink_global_collision');
const ruby = spawnSync('ruby', ['--version']);

test('collisions are warned with file:line; acknowledged, read-only and sole-owner VARs are not',
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      j = JSON.parse(File.read(${JSON.stringify(join(fx, 'scenarios/fx/scenario.json'))}))
      puts JSON.generate(check_ink_global_collisions(j, ${JSON.stringify(fx)}))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    const where = issues.map(s => s.match(/'([^']+)'/)[1]).sort();
    assert.deepEqual(where, [
      'scenarios/fx/ink/clerk.ink:2',   // fate = 3 into a string global
      'scenarios/fx/ink/guard.ink:1',   // guard_hostile: assigned here, also set by the scenario, no "synced" comment
      'scenarios/fx/ink/guard.ink:2',   // count declared false, global is a number
    ]);
    const guard = issues.find(s => s.includes('guard.ink:1'));
    assert.match(guard, /line 5/);
    assert.match(guard, /setGlobal/);
    assert.match(issues.find(s => s.includes('guard.ink:2')), /declared false/);
    assert.match(issues.find(s => s.includes('clerk.ink:2')), /assigned ~ fate = 3/);
    // handler's owned_flag: also set by the scenario, but acknowledged by the comment above its VAR block;
    // clerk's ink_owned: the ink is its only setter; read_only: never assigned
  });
