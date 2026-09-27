// Unit tests for public/break_escape/js/minigames/person-chat/lip-sync.js
// Run with: node test/js/lip-sync.test.mjs   (no dependencies; exits non-zero on failure)
//
// The module is plain ES module source served to the browser, and the repo has no
// "type": "module" package.json, so it is imported via a data: URL (it has no imports).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/person-chat/lip-sync.js'), 'utf8');
const {
    textToVisemes, scaleTimeline, timelineDuration, visemeAt, buildVisemeColumnMap, DEFAULT_STEP_MS
} = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const names = steps => steps.map(s => s.viseme);

test('matches the PixelLab plan for "Hello, I\'m Bernie."', () => {
    assert.deepEqual(names(textToVisemes("Hello, I'm Bernie.")), [
        'rest', 'small_open', 'medium_open', 'small_open', 'round', 'rest',
        'small_open', 'rest', 'closed', 'rest', 'closed', 'medium_open',
        'small_open', 'medium_open', 'rest'
    ]);
});

test('runs of the same viseme collapse into one step', () => {
    assert.deepEqual(names(textToVisemes('ee')), ['rest', 'medium_open', 'rest']);
    assert.deepEqual(names(textToVisemes('oo ow')), ['rest', 'round', 'rest', 'round', 'rest']);
    assert.deepEqual(names(textToVisemes('rnl')), ['rest', 'small_open', 'rest']);
});

test('letter classes', () => {
    assert.deepEqual(names(textToVisemes('m')), ['rest', 'closed', 'rest']);
    assert.deepEqual(names(textToVisemes('f')), ['rest', 'teeth', 'rest']);
    assert.deepEqual(names(textToVisemes('a')), ['rest', 'wide_open', 'rest']);
    assert.deepEqual(names(textToVisemes('ci')), ['rest', 'teeth', 'small_open', 'rest']);
    assert.deepEqual(names(textToVisemes('ca')), ['rest', 'small_open', 'wide_open', 'rest']);
    assert.deepEqual(names(textToVisemes('7')), ['rest', 'small_open', 'rest']);
    assert.deepEqual(names(textToVisemes('café')), ['rest', 'small_open', 'wide_open', 'teeth', 'medium_open', 'rest']);
});

test('punctuation and whitespace become a single rest; sentence ends hold longer', () => {
    const steps = textToVisemes('Hi... ok');
    assert.deepEqual(names(steps), ['rest', 'small_open', 'rest', 'round', 'small_open', 'rest']);
    assert.equal(steps[2].duration, DEFAULT_STEP_MS * 2);
    assert.equal(textToVisemes('a, b')[2].duration, DEFAULT_STEP_MS);
});

test('empty and missing text give a single rest', () => {
    assert.deepEqual(textToVisemes(''), [{ viseme: 'rest', duration: DEFAULT_STEP_MS }]);
    assert.deepEqual(names(textToVisemes(null)), ['rest']);
    assert.deepEqual(names(textToVisemes('  ,  ')), ['rest']);
});

test('steps default to 90 ms and scale to the audio duration', () => {
    const steps = textToVisemes('Hello');
    assert.ok(steps.every(s => s.duration === 90));
    const scaled = scaleTimeline(steps, 1000);
    assert.ok(Math.abs(timelineDuration(scaled) - 1000) < 1e-6);
    assert.equal(scaleTimeline(steps, NaN), steps);
    assert.equal(scaleTimeline(steps, Infinity), steps);
});

test('visemeAt picks the step for the elapsed time and rests outside it', () => {
    const steps = textToVisemes('ma'); // rest, closed, wide_open, rest
    assert.equal(visemeAt(steps, 0), 'rest');
    assert.equal(visemeAt(steps, 100), 'closed');
    assert.equal(visemeAt(steps, 200), 'wide_open');
    assert.equal(visemeAt(steps, 10000), 'rest');
    assert.equal(visemeAt(steps, NaN), 'rest');
});

test('column map: full 7-name set maps directly', () => {
    const map = buildVisemeColumnMap(['rest', 'closed', 'small_open', 'medium_open', 'wide_open', 'round', 'teeth']);
    assert.deepEqual(map, { rest: 0, closed: 1, teeth: 6, round: 5, wide_open: 4, medium_open: 3, small_open: 2 });
});

test('column map: smaller or unfamiliar sets degrade gracefully', () => {
    const three = buildVisemeColumnMap(['rest', 'small_open', 'wide_open']);
    assert.equal(three.closed, 0);       // no closed → rest
    assert.equal(three.round, 1);        // round → small_open
    assert.equal(three.medium_open, 2);  // medium_open → wide_open
    assert.equal(three.teeth, 1);        // teeth → small_open

    const unknown = buildVisemeColumnMap(['neutral', 'mouth_open_a', 'x']);
    assert.equal(unknown.rest, 0);       // no rest → column 0
    assert.equal(unknown.round, 1);      // nearest "*open*" shape
    assert.equal(unknown.closed, 0);

    const blair = buildVisemeColumnMap(['rest', 'MBP', 'FV', 'AI', 'E', 'O']);
    assert.equal(blair.closed, 1);
    assert.equal(blair.teeth, 2);
    assert.equal(blair.wide_open, 3);
    assert.equal(blair.round, 5);
});
