// The stacked-text check (validate_scenario.rb check_stacked_timed_texts): two timed texts from one
// event warn when they land less than 4 s apart. A mapping's own delayMs counts toward the gap.
// Run with: node test/js/validator-stacked-texts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function warnings(mappings) {
  const data = { rooms: { r1: { npcs: [{ id: 'hax', eventMappings: mappings }] } } };
  const script = `require ${JSON.stringify(VALIDATOR)}
require 'json'
puts JSON.generate(check_stacked_timed_texts(JSON.parse(${JSON.stringify(JSON.stringify(data))})))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const m = (msg, delayMs, delay = 0) => ({
  eventPattern: 'task_done', onceOnly: true, ...(delayMs === undefined ? {} : { delayMs }),
  sendTimedMessage: { delay, message: msg },
});

test('two texts at 0 ms with no delayMs warn', { skip }, () => {
  const w = warnings([m('first text', undefined), m('second text', undefined)]);
  assert.equal(w.length, 1);
  assert.match(w[0], /less than 4 s apart/);
});

test('delayMs 2000 and 9000 count toward the gap and do not warn', { skip }, () => {
  assert.deepEqual(warnings([m('first text', 2000), m('second text', 9000)]), []);
});

test('delayMs that leaves the texts under 4 s apart still warns', { skip }, () => {
  assert.equal(warnings([m('first text', 2000), m('second text', 3000)]).length, 1);
});
