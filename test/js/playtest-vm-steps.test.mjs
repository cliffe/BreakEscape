// The playtest session's VM commands (.claude/skills/playtest-scenario/scripts/vm-steps.js) against
// a stub vm_step (test/js/fixtures/stub-vm-step.js), plus verify-run.rb counting vm-step flags.
// Run with: bin/test-js test/js/playtest-vm-steps.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(import.meta.url);
const { createVmSteps, lastJsonLine } = require(join(root, '.claude/skills/playtest-scenario/scripts/vm-steps.js'));

const stub = join(here, 'fixtures', 'stub-vm-step.js');
function make(extra = {}) {
  const logs = [];
  const vs = createVmSteps({ hacktivityDir: tmpdir(), gameId: 42, command: [process.execPath, stub],
    log: (dir, obj) => logs.push({ dir, ...obj }), ...extra });
  return { vs, logs };
}

test('vm starts a step and returns a job at once; vmwait returns its JSON line', async () => {
  const { vs } = make();
  const t0 = Date.now();
  const started = await vs.vm({ cmd: 'vm', step: 'slow' });
  assert.ok(Date.now() - t0 < 250, 'vm must not wait for the step');
  assert.match(started.job, /^vm-\d+$/);
  const done = await vs.vmwait({ cmd: 'vmwait', job: started.job });
  assert.equal(done.exit, 0);
  assert.equal(done.result.ok, true);
  assert.deepEqual(done.result.flags, ['stub:flag_1', 'stub:flag_2']);
  assert.equal(done.step, 'slow');
});

test('a failed step (exit 1) and a refused one (exit 2) come back with their JSON', async () => {
  const { vs } = make();
  const f = await vs.vmwait({ job: (await vs.vm({ step: 'fail' })).job });
  assert.equal(f.exit, 1);
  assert.equal(f.result.ok, false);
  const r = await vs.vmwait({ job: (await vs.vm({ step: 'refuse' })).job });
  assert.equal(r.exit, 2);
  assert.match(r.result.refused, /requires recon/);
});

test('output before the JSON line (Rails warnings) is ignored', async () => {
  const { vs } = make();
  const n = await vs.vmwait({ job: (await vs.vm({ step: 'noisy' })).job });
  assert.equal(n.result.ok, true);
  assert.deepEqual(lastJsonLine('x\n{bad\n{"a":1}\ntrailing'), { a: 1 });
  assert.equal(lastJsonLine('nothing'), null);
});

test('args go to the runner on stdin, and the log holds names only', async () => {
  const { vs, logs } = make();
  const secret = 'hunter2-not-in-logs';
  const j = await vs.vm({ step: 'echoargs', args: { desktop_pass: secret, desktop_user: 'kali' } });
  const done = await vs.vmwait({ job: j.job });
  assert.deepEqual(done.result.facts_used.sort(), ['desktop_pass', 'desktop_user']);
  assert.ok(!JSON.stringify(logs).includes(secret));
  const red = vs.redact({ cmd: 'vm', step: 's', args: { desktop_pass: secret } });
  assert.deepEqual(red.args, { desktop_pass: '<redacted>' });
});

test('vm list returns the solve steps', async () => {
  const { vs } = make();
  const l = await vs.vm({ cmd: 'vm', list: true });
  assert.deepEqual(l.steps.map(s => s.step), ['recon', 'foothold']);
});

test('bad input is refused before anything runs', async () => {
  const { vs } = make();
  await assert.rejects(vs.vm({ step: 'rm -rf /' }), /vm-bad-step/);
  await assert.rejects(vs.vm({}), /vm-bad-step/);
  await assert.rejects(vs.vm({ step: 'recon', args: [1] }), /vm-bad-args/);
  await assert.rejects(vs.vmwait({ job: 'vm-99' }), /vm-unknown-job/);
  const unset = createVmSteps({ command: [process.execPath, stub] });
  await assert.rejects(unset.vm({ step: 'recon' }), /vm-not-configured/);
});

test('vmwait with timeoutMs reports pending instead of blocking', async () => {
  const { vs } = make();
  const j = await vs.vm({ step: 'slow' });
  const p = await vs.vmwait({ job: j.job, timeoutMs: 20 });
  assert.equal(p.pending, true);
  const d = await vs.vmwait({ job: j.job });
  assert.equal(d.result.ok, true);
});

test('<vmflag:REF> is replaced by the value, logged as vm-step without the value', async () => {
  const { vs, logs } = make();
  const cmd = { cmd: 'mg', action: 'type', args: [0, '<vmflag:stub:flag_1>', { submit: true }] };
  const out = await vs.substituteVmFlags(cmd, 'mg');
  assert.equal(out.args[1], 'flag{stub-one}');
  assert.equal(out.args[2].submit, true);
  const row = logs.find(l => l.dir === 'flag');
  assert.equal(row.source, 'vm-step');
  assert.equal(row.earnedInGame, true);
  assert.equal(row.ref, 'stub:flag_1');
  assert.ok(!JSON.stringify(logs).includes('stub-one'));
  assert.equal((await vs.substituteVmFlags('no tokens here', 'x')), 'no tokens here');
});

test('an unresolvable or malformed flag ref is an error, not a silent pass-through', async () => {
  const { vs } = make();
  await assert.rejects(vs.substituteVmFlags('<vmflag:stub:nope>', 'mg'), /vm-flag-unavailable/);
  await assert.rejects(vs.substituteVmFlags('<vmflag:a;b>', 'mg'), /vm-bad-flag-ref/);
});

// verify-run.rb, with BreakEscape::Game stubbed so no Rails or database is needed.
function verify(logLines, flags) {
  const dir = mkdtempSync(join(tmpdir(), 'verify-run-'));
  const log = join(dir, 'session.jsonl');
  writeFileSync(log, logLines.map(l => JSON.stringify(l)).join('\n') + '\n');
  const r = spawnSync('ruby', ['-r', join(here, 'fixtures', 'verify-run-stub.rb'), join(root, 'tools/playtest/verify-run.rb'), '--log', log, '1'],
    { env: { ...process.env, STUB_FLAGS: flags }, encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
}

test('verify-run.rb counts source vm-step flags as earned in game, --flags as handed over', () => {
  const r = verify([
    { dir: 'flag', token: '<vmflag:stub:flag_1>', ref: 'stub:flag_1', source: 'vm-step', earnedInGame: true },
    { dir: 'flag', token: '<vmflag:stub:flag_1>', ref: 'stub:flag_1', source: 'vm-step', earnedInGame: true },
    { dir: 'flag', token: '<flag:2>', index: 2, source: 'session --flags', earnedInGame: false }
  ], 'flag{a},flag{b}');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /flags earned\s+1 via VM steps \(earned in game\): stub:flag_1/);
  assert.match(r.out, /flags handed\s+1 substitution/);
  assert.match(r.out, /Flags earned in game via VM steps: 1 of 2 submitted/);
});

test('verify-run.rb fails when the log claims more earned flags than the game recorded', () => {
  const r = verify([
    { dir: 'flag', ref: 'stub:flag_1', source: 'vm-step', earnedInGame: true },
    { dir: 'flag', ref: 'stub:flag_2', source: 'vm-step', earnedInGame: true }
  ], 'flag{a}');
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /LOG CLAIMS MORE THAN THE GAME HOLDS/);
});
