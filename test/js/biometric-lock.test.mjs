// Threshold resolution and lock evaluation for biometric readers (pure logic).
// Run with: node test/js/biometric-lock.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The engine has no package.json type:module, so load the ES module through a data: URL.
const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const loadModule = name => import('data:text/javascript;base64,' + Buffer.from(
    readFileSync(join(root, 'public/break_escape/js/systems', name + '.js'), 'utf8')).toString('base64'));

globalThis.window = {};
const { resolveBiometricThreshold, evaluateBiometricLock } =
    await loadModule('biometric-lock');

const fp = (id, owner, quality) => ({ id, type: 'fingerprint', owner, quality });

test('threshold prefers door properties, then scenarioData, then legacy, then 0.4', () => {
    assert.equal(resolveBiometricThreshold({
        doorProperties: { biometricMatchThreshold: 0.9 },
        scenarioData: { biometricMatchThreshold: 0.6 }, biometricMatchThreshold: 0.5
    }, 'door'), 0.9);
    assert.equal(resolveBiometricThreshold({
        doorProperties: { biometricMatchThreshold: null },
        scenarioData: { biometricMatchThreshold: 0.6 }, biometricMatchThreshold: 0.5
    }, 'door'), 0.6);
    assert.equal(resolveBiometricThreshold({ scenarioData: {}, biometricMatchThreshold: 0.5 }, 'object'), 0.5);
    assert.equal(resolveBiometricThreshold({ scenarioData: {} }, 'object'), 0.4);
    assert.equal(resolveBiometricThreshold(null, 'door'), 0.4);
});

test('threshold treats values above 1 as percentages and ignores junk', () => {
    assert.equal(resolveBiometricThreshold({ scenarioData: { biometricMatchThreshold: 85 } }), 0.85);
    assert.equal(resolveBiometricThreshold({ scenarioData: { biometricMatchThreshold: 0 } }), 0);
    assert.equal(resolveBiometricThreshold({ scenarioData: { biometricMatchThreshold: 'x' } }), 0.4);
    assert.equal(resolveBiometricThreshold({ scenarioData: { biometricMatchThreshold: 250 } }), 1);
});

test('no fingerprint samples gives no_samples', () => {
    assert.deepEqual(evaluateBiometricLock({ requires: 'A', threshold: 0.4, samples: [] }),
        { result: 'no_samples', sample: null });
    assert.equal(evaluateBiometricLock({ requires: 'A', threshold: 0.4, samples: undefined }).result, 'no_samples');
    assert.equal(evaluateBiometricLock({ requires: 'A', threshold: 0.4, samples: [{ id: 'x', type: 'dna', owner: 'A', quality: 1 }] }).result, 'no_samples');
});

test('chosen sample: accepted, low_quality, no_match', () => {
    const samples = [fp('fp_a', 'Alice', 0.92), fp('fp_b', 'Bob', 0.95), fp('fp_c', 'Alice', 0.5)];
    const ok = evaluateBiometricLock({ requires: 'Alice', threshold: 0.9, samples, chosenSampleId: 'fp_a' });
    assert.equal(ok.result, 'accepted');
    assert.equal(ok.sample.id, 'fp_a');
    assert.equal(evaluateBiometricLock({ requires: 'Alice', threshold: 0.9, samples, chosenSampleId: 'fp_c' }).result, 'low_quality');
    const wrong = evaluateBiometricLock({ requires: 'Alice', threshold: 0.4, samples, chosenSampleId: 'fp_b' });
    assert.equal(wrong.result, 'no_match');
    assert.equal(wrong.sample.id, 'fp_b');
    assert.equal(evaluateBiometricLock({ requires: 'Alice', threshold: 0.4, samples, chosenSampleId: 'missing' }).result, 'no_match');
});

test('a lift exactly at the threshold passes; 0.85 fails a 0.9 reader', () => {
    const samples = [fp('s', 'Alice', 0.85)];
    assert.equal(evaluateBiometricLock({ requires: 'Alice', threshold: 0.85, samples, chosenSampleId: 's' }).result, 'accepted');
    assert.equal(evaluateBiometricLock({ requires: 'Alice', threshold: 0.9, samples, chosenSampleId: 's' }).result, 'low_quality');
});

test('without a chosen sample the best enrolled lift is used', () => {
    const samples = [fp('lo', 'Alice', 0.3), fp('hi', 'Alice', 0.8), fp('bob', 'Bob', 0.99)];
    const r = evaluateBiometricLock({ requires: 'Alice', threshold: 0.4, samples });
    assert.equal(r.result, 'accepted');
    assert.equal(r.sample.id, 'hi');
    assert.equal(evaluateBiometricLock({ requires: 'Carol', threshold: 0.4, samples }).result, 'no_match');
});

test('requires may be a list of owners', () => {
    const samples = [fp('b', 'Bob', 0.7)];
    assert.equal(evaluateBiometricLock({ requires: ['Alice', 'Bob'], threshold: 0.4, samples, chosenSampleId: 'b' }).result, 'accepted');
});
