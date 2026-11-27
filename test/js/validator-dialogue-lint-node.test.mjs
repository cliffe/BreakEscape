// The validator's DIALOGUE LINT step (validate_scenario.rb dialogue_lint_node): dialoguelint.mjs is an
// ES module, so the step must skip a node older than DIALOGUE_LINT_MIN_NODE (Ubuntu 20.04's
// /usr/bin/node is 10.19) and use $BE_NODE, a newer node on PATH, or ~/.local/node/bin/node instead.
// Run with: node test/js/validator-dialogue-lint-node.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

// A fake node that prints the given version.
function fakeNode(dir, version) {
  mkdirSync(dir, { recursive: true });
  const f = join(dir, 'node');
  writeFileSync(f, `#!/bin/sh\necho ${version}\n`);
  chmodSync(f, 0o755);
  return f;
}

function pick(env, home) {
  const script = `require ${JSON.stringify(VALIDATOR)}
require 'json'
puts JSON.generate(dialogue_lint_node(JSON.parse(${JSON.stringify(JSON.stringify(env))}), ${home ? JSON.stringify(home) : 'nil'}))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('an old node on PATH is skipped for the user-local node', { skip }, (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'lint-node-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  fakeNode(join(tmp, 'sys'), 'v10.19.0');
  const local = fakeNode(join(tmp, 'home/.local/node/bin'), 'v22.11.0');
  assert.deepEqual(pick({ PATH: join(tmp, 'sys') }, join(tmp, 'home')), [local, null]);
});

test('BE_NODE wins over PATH', { skip }, (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'lint-node-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  fakeNode(join(tmp, 'sys'), 'v20.1.0');
  const be = fakeNode(join(tmp, 'be'), 'v18.0.0');
  assert.deepEqual(pick({ PATH: join(tmp, 'sys'), BE_NODE: be }, null), [be, null]);
});

test('only an old node: no path, and the reason names it', { skip }, (t) => {
  const tmp = mkdtempSync(join(tmpdir(), 'lint-node-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const old = fakeNode(join(tmp, 'sys'), 'v10.19.0');
  const [path, why] = pick({ PATH: join(tmp, 'sys') }, join(tmp, 'nohome'));
  assert.equal(path, null);
  assert.match(why, /node 16\+ needed/);
  assert.ok(why.includes(`${old} (v10)`), why);
});
