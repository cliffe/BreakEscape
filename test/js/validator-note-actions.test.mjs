// Step 2b (SCENARIO_FORMAT_HARDENING_PLAN): an author note ("_" property name) is never run by the
// engine. The validator warns when a note parks an action (a Hash with a string "type" at any depth),
// and stays silent for a string note, a typeless note, and a "_" key that the schema reads as an id or
// as free data (where a "_" key is real, not a note). Resolution uses the repository schema.
// Run with: node test/js/validator-note-actions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const env = { ...process.env, LANG: 'C.UTF-8' };
const ruby = spawnSync('ruby', ['--version']);
if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => assert.fail('ruby not found'));
}
const skip = ruby.status !== 0 && 'ruby not found';

// Run check_notes_hold_no_actions over each fixture in one Ruby process.
function run(fixtures) {
  const prog = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
puts JSON.generate(JSON.parse(STDIN.read).map { |d| check_notes_hold_no_actions(d) })`;
  const r = spawnSync('ruby', ['-e', prog], { input: JSON.stringify(fixtures), encoding: 'utf8', env, cwd: root, maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const fixtures = [
  { _draft: { type: 'grant_foothold', pc: 'pc1' } },                       // 0: note holds an action
  { _old: { onConfirm: [{ type: 'give_item', item: {} }] } },              // 1: action nested in a note
  { _comment: 'just a string note' },                                      // 2: string note, silent
  { _note: { reason: 'typeless hash, no action' } },                       // 3: typeless note, silent
  { globalVariables: { _x: { type: 'grant_foothold' } } },                 // 4: "_" key is a free/id value, silent
  { rooms: { _annex: { name: 'Annex', objects: [] } } }                    // 5: "_" room id, silent
];

test('a note holding an action warns, with the note path', { skip }, () => {
  const out = run(fixtures);
  assert.equal(out[0].length, 1);
  assert.match(out[0][0], /^⚠️ WARNING: #\/_draft: this author note holds an action, which the engine never runs$/);
  assert.equal(out[1].length, 1);
  assert.match(out[1][0], /#\/_old: this author note holds an action/);
});

test('a string note, a typeless note, and a "_" id or free-data key never warn', { skip }, () => {
  const out = run(fixtures);
  assert.deepEqual(out[2], []);
  assert.deepEqual(out[3], []);
  assert.deepEqual(out[4], []); // globalVariables._x: an id into free data, not a note
  assert.deepEqual(out[5], []); // rooms._annex: a room id, not a note
});
