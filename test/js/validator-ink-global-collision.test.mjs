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

test('collisions are warned with file:line; own-line or directly-above sync notes, read-only and sole-owner VARs are not',
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
      'scenarios/fx/ink/handler.ink:12', // gap_flag: the "Synced" comment is cut off by a blank line
      'scenarios/fx/ink/handler.ink:2', // ext_flag: an EXTERNAL/"engine"/"scenario" comment doesn't acknowledge
      'scenarios/fx/ink/handler.ink:5', // block_flag: the "Synced scenario globals" header is two VARs up
    ]);
    const guard = issues.find(s => s.includes('guard.ink:1'));
    assert.match(guard, /line 5/);
    assert.match(guard, /setGlobal/);
    assert.match(issues.find(s => s.includes('guard.ink:2')), /declared false/);
    assert.match(issues.find(s => s.includes('clerk.ink:2')), /assigned ~ fate = 3/);
    assert.match(issues.find(s => s.includes('handler.ink:5')), /VAR block_flag/);
    // handler's own_line_flag (trailing "Synced" comment) and owned_flag (in the comment run directly
    // above) are acknowledged; guard_hostile there is only read; clerk's ink_owned: the ink is its only
    // setter; read_only: never assigned
  });
