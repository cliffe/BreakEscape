// __test.waitForGlobal (test-bridge/wait.js). lab_physical_pentest playtests, finding
// E6: waiting for `expected: false` answered { value: true, elapsedMs: 0 }. The wait
// was right (the global was already false) but `value` was the predicate's result, so
// it read as "the global is true". The reply now carries the global's own value, the
// expected value and whether the condition already held.
// Run with: node test/js/test-bridge-wait-global.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const bridge = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/test-bridge');
const dir = mkdtempSync(join(tmpdir(), 'bridge-wait-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
// one "frame" = 10 ms of the fake clock, and a hook the tests use to change the world
writeFileSync(join(dir, 'input.js'),
    'export async function sleepFrames(n = 1) { for (let i = 0; i < n; i++) { globalThis.__clock += 10; globalThis.__onFrame?.(); await null; } }');
writeFileSync(join(dir, 'wait.js'), readFileSync(join(bridge, 'wait.js'), 'utf8'));
globalThis.__clock = 0;
globalThis.performance = { now: () => globalThis.__clock };
globalThis.window = { gameState: { globalVariables: {} } };
const { waitForGlobal } = await import(pathToFileURL(join(dir, 'wait.js')));
const globals = (g) => { window.gameState.globalVariables = g; globalThis.__onFrame = null; };

test('expected:false, already false: value is false and alreadyMet says no change was seen', async () => {
    globals({ len_at_door: false });
    const r = await waitForGlobal('len_at_door', false, { timeoutMs: 1000 });
    assert.deepEqual(r, { ok: true, label: 'global:len_at_door', value: false, elapsedMs: 0, expected: false, alreadyMet: true });
});

test('expected:false while the global is true: waits for it to turn false', async () => {
    globals({ len_at_door: true });
    let frames = 0;
    globalThis.__onFrame = () => { if (++frames === 5) window.gameState.globalVariables.len_at_door = false; };
    const r = await waitForGlobal('len_at_door', false, { timeoutMs: 1000 });
    assert.equal(r.ok, true);
    assert.equal(r.value, false);
    assert.equal(r.alreadyMet, false);
    assert.equal(r.elapsedMs, 50);
});

test('expected:false never met: a timeout that still reports the current value', async () => {
    globals({ len_at_door: true });
    const r = await waitForGlobal('len_at_door', false, { timeoutMs: 100 });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'timeout');
    assert.equal(r.value, true);
    assert.equal(r.expected, false);
    assert.ok(!('alreadyMet' in r));
});

test('no expected: waits for the global to be set, and reports what it was set to', async () => {
    globals({ kp_stage: false });
    let frames = 0;
    globalThis.__onFrame = () => { if (++frames === 2) window.gameState.globalVariables.kp_stage = 'planted'; };
    const r = await waitForGlobal('kp_stage', undefined, { timeoutMs: 1000 });
    assert.equal(r.ok, true);
    assert.equal(r.value, 'planted');
    assert.ok(!('expected' in r));
    globals({});
    const missing = await waitForGlobal('nope', undefined, { timeoutMs: 50 });
    assert.equal(missing.ok, false);
    assert.equal(missing.value, null);
});

test('the bridge method uses it', () => {
    const index = readFileSync(join(bridge, 'index.js'), 'utf8');
    assert.match(index, /waitForGlobal\(name, expected = undefined, opts = \{\}\) \{\s*return waitForGlobal\(name, expected, opts\);/);
});
