// Pure text helpers for the fingerprint reader overlay and kit panel.
// Run with: node test/js/fingerprint-reader.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { labelForSample, messageForOutcome, headingForOutcome, failureReasonForOutcome, percent, FIELD_NOTES, NO_SAMPLES_MESSAGE } =
    await import('data:text/javascript;base64,' + Buffer.from(readFileSync(
        join(root, 'public/break_escape/js/minigames/biometrics/fingerprint-reader-helpers.js'), 'utf8')).toString('base64'));

test('identified lifts use the display name, others the source surface', () => {
    assert.equal(labelForSample({ identified: true, ownerName: 'Robert Vance', owner: 'robert_vance' }), 'Robert Vance');
    assert.equal(labelForSample({ identified: false, ownerName: 'Robert Vance', owner: 'robert_vance', sourceName: 'Mug' }),
        'Print from Mug');
    assert.equal(labelForSample({ sourceName: 'Mug', pattern: 'loop' }, { withPattern: true }), 'Print from Mug, loop');
    assert.equal(labelForSample({}), 'Print from an unknown surface');
});

test('an unidentified label never contains the raw owner', () => {
    const label = labelForSample({ identified: false, owner: 'david_torres', ownerName: 'David Torres', sourceName: 'Mug' },
        { withPattern: true });
    assert.ok(!/torres/i.test(label));
});

test('outcome messages', () => {
    assert.equal(messageForOutcome('accepted', { sample: { quality: 0.92 }, threshold: 0.85 }),
        'Accepted. The reader read 92% of the ridge detail and needed 85%. Door unlocking.');
    assert.equal(messageForOutcome('no_match'),
        'No match. This reader is enrolled to someone else. Matching a lift against the references in the dusting panel tells you whose it is. Try another lift.');
    assert.equal(messageForOutcome('no_samples'), NO_SAMPLES_MESSAGE);
    assert.equal(messageForOutcome('low_quality', { sample: { quality: 0.64 }, threshold: 0.85 }),
        'Partial read. This reader needs 85%; this lift is 64%. A cleaner lift of the same print will do.');
    assert.equal(messageForOutcome('nonsense'), '');
});

test('failure reasons and percent rounding', () => {
    assert.equal(failureReasonForOutcome('low_quality'), 'biometric_quality');
    assert.equal(failureReasonForOutcome('no_match'), 'biometric_missing');
    assert.equal(failureReasonForOutcome('no_samples'), 'biometric_missing');
    assert.equal(percent(0.845), 85);
    assert.equal(percent(undefined), 0);
});

test('field notes cover the three patterns', () => {
    assert.deepEqual(FIELD_NOTES.map(n => n.pattern), ['loop', 'whorl', 'arch']);
});

test('a wrong-person reply names an identified owner and quotes the door sign', () => {
    const msg = messageForOutcome('no_match', {
        sample: { identified: true, ownerName: 'Robert Vance' }, signText: 'Cryptography Lead Only'
    });
    assert.match(msg, /Robert Vance's print/);
    assert.match(msg, /Cryptography Lead Only/);
    assert.ok(!/dusting panel/.test(msg));
});

test('every answer has a heading and a symbol', () => {
    for (const r of ['accepted', 'low_quality', 'no_match', 'no_samples']) {
        const h = headingForOutcome(r);
        assert.ok(h.title && h.glyph, r);
    }
});
