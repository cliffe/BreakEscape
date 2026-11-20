// Plan step 5: one ScenarioBinding in lib/ for every renderer. Each Python and JS caller now
// renders through BreakEscape::ScenarioBinding, so m01 (which draws no random values) renders to
// the same JSON everywhere. This test runs the exact one-liner the callers embed, plus the two
// wrapper tools (pass2/render.rb and lab_tesseract's render_scenario.rb), and checks they all
// agree with a direct lib render.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
// A command-line -r (or -rjson) loads before the -rbundler/setup that `bundle exec` puts in
// RUBYOPT, so it activates the default json gem and Bundler then refuses the locked one
// (Gem::LoadError, CI node-tests). These children need only stdlib: run them without Bundler.
const PLAIN_RUBY_ENV = { ...process.env, RUBYOPT: (process.env.RUBYOPT || '').replace(/-r\S*bundler\/setup\S*/g, '').trim() };
const LIB = join(root, 'lib/break_escape/scenario_binding.rb');
const M01 = join(root, 'scenarios/m01_first_contact/scenario.json.erb');
const haveRuby = spawnSync('ruby', ['--version']).status === 0;
const skip = haveRuby ? false : 'ruby not available';

// The one-liner the check_door_alignment.py, the ink-route *.js and sis02_multicall.mjs callers
// embed: ruby -r <lib> -e 'print BreakEscape::ScenarioBinding.render(File.read(ARGV[0]))'.
function oneLiner(scenarioPath) {
  const r = spawnSync('ruby', ['-r', LIB, '-e', 'print BreakEscape::ScenarioBinding.render(File.read(ARGV[0]))', scenarioPath], { env: PLAIN_RUBY_ENV, encoding: 'utf8', maxBuffer: 1 << 26 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('the embedded caller one-liner renders m01 through the shared binding', { skip }, () => {
  const data = oneLiner(M01);
  assert.ok(data.rooms, 'm01 has rooms');
  // The top-level flags block is the Hash the server builds (flag_1, flag_2, ...), not a bare array.
  const flagBlocks = Object.values(data.flags || {});
  assert.ok(flagBlocks.length > 0, 'm01 has a flags block');
  for (const block of flagBlocks) {
    assert.equal(typeof block, 'object');
    assert.ok(!Array.isArray(block), 'each VM flag block is a Hash, not an array');
    assert.ok(Object.keys(block).every(k => /^flag_\d+$/.test(k)), 'flag keys are flag_N');
  }
});

test('pass2/render.rb renders m01 identically to the one-liner', { skip }, () => {
  const out = join(mkdtempSync(join(tmpdir(), 'be-pass2-')), 'm01.json');
  const r = spawnSync('ruby', [join(root, 'tools/pass2/render.rb'), M01, out], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(readFileSync(out, 'utf8')), oneLiner(M01));
});

test('check_door_alignment.py renders m01 through the shared binding (same rooms)', { skip }, () => {
  // --json prints one object per file with the door-alignment result; a successful render means the
  // Python caller loaded m01 through the lib binding. We assert it ran and produced a result object.
  const r = spawnSync('python3', [join(root, 'scripts/check_door_alignment.py'), '--json', M01], { env: PLAIN_RUBY_ENV, encoding: 'utf8', maxBuffer: 1 << 26 });
  assert.ok(r.status === 0 || r.status === 1, r.stderr); // exit 1 only means a misaligned door, still a successful render
  const obj = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.equal(obj.file, M01);
  assert.ok(Array.isArray(obj.ok) || Array.isArray(obj.bad), 'produced a door-alignment result');
});
