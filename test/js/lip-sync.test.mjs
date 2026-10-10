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
    textToVisemes, scaleTimeline, timelineDuration, visemeAt, buildVisemeColumnMap, DEFAULT_STEP_MS,
    isBlinking, seedFrom, BLINK_MS, holdTimeline, MIN_HOLD_MS,
    envelopeFromSamples, textToUnits, alignToEnvelope
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

test('column map: blink only when the sheet has it', () => {
    assert.equal(buildVisemeColumnMap(['rest', 'small_open', 'blink']).blink, 2);
    assert.equal(buildVisemeColumnMap(['rest', 'small_open']).blink, undefined);
    // a sheet without 'closed' (Bernie's) rests on m/b/p
    assert.equal(buildVisemeColumnMap(['rest', 'teeth', 'round', 'blink']).closed, 0);
});

test('blinks: one short blink per 4 s slot, 2-6 s apart, varying with the seed', () => {
    const starts = seed => {
        const out = [];
        for (let t = 0; t < 60000; t += 10) {
            if (isBlinking(t, seed) && !isBlinking(t - 10, seed)) out.push(t);
        }
        return out;
    };
    const a = starts(0);
    assert.equal(a.length, 15);
    for (let i = 1; i < a.length; i++) {
        const gap = a[i] - a[i - 1];
        assert.ok(gap >= 2000 - BLINK_MS && gap <= 6000, `gap ${gap}`);
    }
    const b = starts(seedFrom('receptionist'));
    assert.notDeepEqual(a, b);
    assert.equal(isBlinking(NaN), false);
});

test('holdTimeline: no shape shorter than the hold, same total, rests at the ends', () => {
    const line = 'Good evening. Visiting hours are over, so unless you have a pass, I cannot let you through.';
    const raw = scaleTimeline(textToVisemes(line), 5200); // about as long as the TTS takes
    const held = holdTimeline(raw);
    assert.ok(raw.some(s => s.duration < MIN_HOLD_MS));
    assert.ok(held.slice(1, -1).every(s => s.duration >= MIN_HOLD_MS - 1e-9));
    assert.ok(Math.abs(timelineDuration(held) - 5200) < 1e-6);
    assert.equal(held[0].viseme, 'rest');
    assert.equal(held[held.length - 1].viseme, 'rest');
    assert.ok(held.length < raw.length * 0.7, `${held.length} vs ${raw.length}`);
    for (let i = 1; i < held.length; i++) assert.notEqual(held[i].viseme, held[i - 1].viseme);
});

test('holdTimeline: closed lips win a merge over an in-between shape', () => {
    const held = holdTimeline([
        { viseme: 'rest', duration: 90 }, { viseme: 'small_open', duration: 80 },
        { viseme: 'closed', duration: 80 }, { viseme: 'wide_open', duration: 200 },
        { viseme: 'rest', duration: 90 }
    ]);
    assert.deepEqual(held.map(s => s.viseme), ['rest', 'closed', 'wide_open', 'rest']);
    assert.deepEqual(holdTimeline(textToVisemes('Hi'), 0).length, textToVisemes('Hi').length);
});

test('envelopeFromSamples: RMS per frame', () => {
    const sr = 1000; // 20 samples per 20 ms frame
    const samples = new Float32Array(60);
    samples.fill(0.5, 20, 40);
    assert.deepEqual(Array.from(envelopeFromSamples(samples, sr, 20)), [0, 0.5, 0]);
});

test('textToUnits: sounds, word gaps and punctuation pauses', () => {
    const u = textToUnits("Ma, it's -- no.");
    // "Ma" , "it's" -- "no" .   (spaces next to punctuation fold into the pause)
    assert.deepEqual(u.map(x => x.kind), ['sound', 'sound', 'pause', 'sound', 'sound', 'pause', 'sound', 'sound', 'pause']);
    assert.deepEqual(textToUnits('no way').map(x => x.kind), ['sound', 'sound', 'gap', 'sound', 'sound', 'sound']);
    assert.equal(u[2].weight, 2);                       // comma
    assert.equal(u[u.length - 1].weight, 4);            // full stop
    assert.ok(!u.some(x => x.kind === 'gap' && x.weight > 1));
});

test('alignToEnvelope: silences rest, loud stretches talk', () => {
    const env = [...Array(10).fill(0), ...Array(15).fill(0.8), ...Array(20).fill(0), ...Array(15).fill(0.8), ...Array(10).fill(0)];
    const tl = alignToEnvelope('Mama. Mama.', env, 20);
    assert.ok(Math.abs(timelineDuration(tl) - env.length * 20) < 1e-6);
    for (const [ms, want] of [[100, 'rest'], [700, 'rest'], [1300, 'rest']]) assert.equal(visemeAt(tl, ms), want, `${ms} ms`);
    for (const ms of [300, 1000]) assert.notEqual(visemeAt(tl, ms), 'rest', `${ms} ms`);
    assert.equal(alignToEnvelope('Hi', [], 20), null);
    assert.equal(alignToEnvelope('Hi there', new Array(50).fill(0), 20), null);
});

test('alignToEnvelope: an "a" opens wide only on a loud peak', () => {
    // "Ah." loud, then "ah." at half the loudness: the quiet one is medium_open
    const env = [...Array(10).fill(0), ...Array(15).fill(1), ...Array(20).fill(0), ...Array(15).fill(0.5), ...Array(10).fill(0)];
    const tl = alignToEnvelope('Ah. Ah.', env, 20);
    assert.equal(visemeAt(tl, 300), 'wide_open');
    assert.equal(visemeAt(tl, 920), 'medium_open');
});

test('alignToEnvelope on a real TTS line: pauses land on silences', async () => {
    const fx = JSON.parse(readFileSync(join(here, 'fixtures/bernie_line_envelope.json'), 'utf8'));
    const env = fx.envelope;
    const t0 = performance.now();
    const tl = alignToEnvelope(fx.text, env, fx.frameMs);
    assert.ok(performance.now() - t0 < 500, 'fast enough to run per line');
    const peak = Math.max(...env);
    // Silences of 100 ms or more are pauses; shorter dips are consonant closures inside words
    const quiet = env.map(v => v < 0.02 * peak);
    const inPause = quiet.map((q, i) => {
        if (!q) return false;
        let a = i, b = i;
        while (a > 0 && quiet[a - 1]) a--;
        while (b < quiet.length - 1 && quiet[b + 1]) b++;
        return (b - a + 1) * fx.frameMs >= 100;
    });
    let silentFrames = 0, silentResting = 0, loudFrames = 0, loudTalking = 0;
    env.forEach((v, i) => {
        const shape = visemeAt(tl, i * fx.frameMs + fx.frameMs / 2);
        if (inPause[i]) { silentFrames++; if (shape === 'rest') silentResting++; }
        if (v > 0.4 * peak) { loudFrames++; if (shape !== 'rest') loudTalking++; }
    });
    assert.ok(silentResting / silentFrames > 0.9, `silent frames at rest: ${silentResting}/${silentFrames}`);
    assert.ok(loudTalking / loudFrames > 0.95, `loud frames talking: ${loudTalking}/${loudFrames}`);
    const rate = tl.length / (timelineDuration(tl) / 1000);
    assert.ok(rate > 4 && rate < 12, `changes per second ${rate.toFixed(1)}`);
});
