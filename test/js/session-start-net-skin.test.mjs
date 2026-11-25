// tools/playtest/lib/session-args.sh: the --net-skin option of session-start.sh. The script is
// run with bash and no browser. The tag must not change with the option; the URL gains
// net_skin=<value> with the right separator; a bad value fails.
// Run with: bin/test-js test/js/session-start-net-skin.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(root, 'tools/playtest/lib/session-args.sh');

// Runs session_args_parse and prints the tag, then one handed-on argument a line.
function run(...args) {
  const script = '. "$LIB"; session_args_parse "$@"; rc=$?; printf "%s\\n" "$TAG"; printf "%s\\n" "${SESSION_ARGS[@]}"; exit $rc';
  const r = spawnSync('bash', ['-c', script, 'x', ...args], { env: { ...process.env, LIB }, encoding: 'utf8' });
  const lines = r.stdout.split('\n');
  lines.pop();
  return { status: r.status, stderr: r.stderr, tag: lines[0], args: lines.slice(1) };
}

const BASE = 'http://127.0.0.1:3401/break_escape/games/1047';

test('without the option the URL gets net_skin=gui and the tag is as before', () => {
  const r = run('--url', BASE, '--speed', 'human');
  assert.equal(r.status, 0);
  assert.equal(r.tag, '1047');
  assert.deepEqual(r.args, ['--url', `${BASE}?net_skin=gui`, '--speed', 'human']);
  assert.deepEqual(run('--url', `${BASE}?lang=en`).args, ['--url', `${BASE}?lang=en&net_skin=gui`]);
  assert.deepEqual(run(`--url=${BASE}`).args, [`--url=${BASE}?net_skin=gui`]);
  assert.deepEqual(run(`--url=${BASE}?lang=en`).args, [`--url=${BASE}?lang=en&net_skin=gui`]);
});

test('a URL that already has net_skin is handed on unchanged', () => {
  const u = `${BASE}?net_skin=cli`;
  assert.deepEqual(run('--url', u).args, ['--url', u]);
  assert.deepEqual(run(`--url=${u}`).args, [`--url=${u}`]);
  const v = `${BASE}?lang=en&net_skin=cli`;
  assert.deepEqual(run('--url', v).args, ['--url', v]);
});

test('--net-skin default hands the URL on unchanged, removes the option, keeps the tag', () => {
  for (const url of [BASE, `${BASE}?lang=en`]) {
    const r = run('--url', url, '--net-skin', 'default');
    assert.equal(r.status, 0);
    assert.deepEqual(r.args, ['--url', url]);
    assert.equal(r.tag, run('--url', url).tag);
    assert.deepEqual(run(`--url=${url}`, '--net-skin=default').args, [`--url=${url}`]);
  }
});

test('the tag is the same with and without the option, with and without a query', () => {
  for (const url of [BASE, `${BASE}/`, `${BASE}?lang=en`]) {
    const plain = run('--url', url);
    for (const skin of ['gui', 'cli', 'default']) {
      assert.equal(run('--url', url, '--net-skin', skin).tag, plain.tag);
      assert.equal(run('--net-skin', skin, '--url', url).tag, plain.tag);
      assert.equal(run(`--url=${url}`, `--net-skin=${skin}`).tag, plain.tag);
    }
  }
});

test('the URL gains net_skin with a question mark when it has no query', () => {
  const r = run('--url', BASE, '--net-skin', 'cli', '--speed', 'human');
  assert.deepEqual(r.args, ['--url', `${BASE}?net_skin=cli`, '--speed', 'human']);
});

test('the URL gains net_skin with an ampersand when it has a query', () => {
  const r = run('--net-skin', 'gui', '--url', `${BASE}?lang=en`);
  assert.deepEqual(r.args, ['--url', `${BASE}?lang=en&net_skin=gui`]);
  assert.equal(r.tag, run('--url', `${BASE}?lang=en`).tag);
});

test('the equals forms work and the option is removed', () => {
  const r = run(`--url=${BASE}`, '--net-skin=cli');
  assert.deepEqual(r.args, [`--url=${BASE}?net_skin=cli`]);
  assert.ok(!r.args.some((a) => a.includes('--net-skin')));
});

test('a bad value, or none, is an error', () => {
  for (const args of [['--url', BASE, '--net-skin', 'both'], ['--url', BASE, '--net-skin='], ['--url', BASE, '--net-skin']]) {
    const r = run(...args);
    assert.notEqual(r.status, 0, args.join(' '));
    assert.match(r.stderr, /net-skin/);
  }
});
