// The generated key pins used when a key lock has no authored keyPins.
// The seed used to be a const that the generator incremented, so every such
// lock threw "Assignment to constant variable".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../../public/break_escape/js/systems/key-lock-system.js', import.meta.url), 'utf8');
const body = src.match(/function generatePinHeightsForLock\(roomId, keyId\) \{[\s\S]*?\n\}\n/);
assert.ok(body, 'generatePinHeightsForLock found');
const generatePinHeightsForLock = new Function(`${body[0]}; return generatePinHeightsForLock;`)();

test('generates four pins in range without throwing', () => {
    const pins = generatePinHeightsForLock('office', 'office_key');
    assert.equal(pins.length, 4);
    for (const p of pins) assert.ok(p >= 25 && p <= 62, `pin ${p} in range`);
});

test('is deterministic for the same room and key', () => {
    assert.deepEqual(generatePinHeightsForLock('vault', 'k1'), generatePinHeightsForLock('vault', 'k1'));
});

test('pins vary within one lock (the seed advances)', () => {
    const pins = generatePinHeightsForLock('archive', 'archive_key');
    assert.ok(new Set(pins).size > 1, `pins ${pins} not all equal`);
});
