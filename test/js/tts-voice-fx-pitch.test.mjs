// Voice FX: the 'voice-distortion' preset (Ghost, m07, lab_tesseract_trials) an octave deeper.
// The owner asked for Ghost's voice to be deeper by about an octave (m02 trailer review). The
// preset now blends a delay-line pitch-shifted layer (two modulated delays, crossfaded) under the
// dry voice. It never touches playbackRate or detune, so a clip keeps its duration and the engine
// still advances on the clip's end. The lowpass now follows the drive.
// The real _buildFXChain, _buildPitchShift and pitchShiftCurves run on a fake AudioContext.
// Assertions are plain booleans (no deep diffs of node graphs).
// Run with: node test/js/tts-voice-fx-pitch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/systems/tts-manager.js'), 'utf8');

function method(name) {
    const m = src.match(new RegExp(`\\n    ${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(Boolean(m), `${name} found`);
    return { args: m[1], body: m[2] };
}
const curvesM = src.match(/\nTTSManager\.pitchShiftCurves = function \(([^)]*)\) \{\n([\s\S]*?)\n\};\n/);
assert.ok(Boolean(curvesM), 'pitchShiftCurves found');
const presetsM = src.match(/\nTTSManager\.VOICE_FX_PRESETS = (\{[\s\S]*?\n\});\n/);
assert.ok(Boolean(presetsM), 'VOICE_FX_PRESETS found');

const TTSManager = {};
TTSManager.pitchShiftCurves = new Function(`return function (${curvesM[1]}) {\n${curvesM[2]}\n};`)();
TTSManager.VOICE_FX_PRESETS = new Function(`return ${presetsM[1]};`)();
const build = method('_buildFXChain');
const pitch = method('_buildPitchShift');
const mgr = {
    _makeDistortionCurve: () => new Float32Array(4),
    _buildFXChain: new Function('TTSManager', `return function (${build.args}) {\n${build.body}\n};`)(TTSManager),
    _buildPitchShift: new Function('TTSManager', `return function (${pitch.args}) {\n${pitch.body}\n};`)(TTSManager)
};

/** A fake AudioContext that records every node and every connection. */
function fakeCtx() {
    const nodes = [];
    const edges = [];
    const param = (owner, name, v = 0) => ({ owner, name, value: v, isParam: true });
    const node = (kind, extra = {}) => {
        const n = { kind, id: nodes.length, ...extra,
            connect(to) { edges.push([n, to]); return to; }, disconnect() {} };
        nodes.push(n);
        return n;
    };
    const ctx = {
        sampleRate: 48000, currentTime: 3,
        createGain: () => { const n = node('gain'); n.gain = param(n, 'gain', 1); return n; },
        createBiquadFilter: () => { const n = node('biquad'); n.frequency = param(n, 'frequency'); n.Q = param(n, 'Q'); return n; },
        createWaveShaper: () => node('waveshaper'),
        createDelay: max => { const n = node('delay', { max }); n.delayTime = param(n, 'delayTime'); return n; },
        createOscillator: () => { const n = node('osc', { started: false, start() { n.started = true; }, stop() {} }); n.frequency = param(n, 'frequency'); return n; },
        createBuffer: (ch, len, rate) => { const data = new Float32Array(len); return { length: len, sampleRate: rate, getChannelData: () => data }; },
        createBufferSource: () => { const n = node('buffersrc', { startAt: null, start(t) { n.startAt = t; }, stop() {} }); return n; }
    };
    return { ctx, nodes, edges };
}

/** Kinds of the nodes along the single path from input, following non-param edges, collapsing parallel branches. */
function downstream(edges, from) {
    return edges.filter(([a, b]) => a === from && !b.isParam).map(([, b]) => b);
}

const preset = TTSManager.VOICE_FX_PRESETS['voice-distortion'];

test('voice-distortion is about an octave deeper, soft drive, lowpass after drive, faint ring mod', () => {
    assert.ok(preset.pitchShift.semitones === -12);
    assert.ok(preset.pitchShift.mix >= 0.5 && preset.pitchShift.mix <= 0.7);
    assert.ok(preset.pitchShift.dry > 0);
    assert.ok(preset.drive >= 2 && preset.drive <= 4);
    assert.ok(preset.lowpassAfterDrive === true);
    assert.ok(!preset.ringMod || preset.ringMod.mix <= 0.04);
    // The highpass must not cut the sub-octave (a male voice at ~110 Hz drops to ~55 Hz).
    assert.ok(preset.highpass <= 100);
});

test('the other presets keep their old chain order (no pitch shift, lowpass before drive)', () => {
    for (const name of ['radio', 'robot']) {
        const p = TTSManager.VOICE_FX_PRESETS[name];
        assert.ok(!p.pitchShift && !p.lowpassAfterDrive, name);
    }
    const { ctx, nodes, edges } = fakeCtx();
    mgr._buildFXChain(ctx, TTSManager.VOICE_FX_PRESETS.radio);
    const lp = nodes.find(n => n.kind === 'biquad' && n.type === 'lowpass');
    const ws = nodes.find(n => n.kind === 'waveshaper');
    assert.ok(downstream(edges, lp).includes(ws));
    assert.ok(!nodes.some(n => n.kind === 'delay'));
});

test('pitch curves: an octave down ramps each delay at 0.5 s/s over a 0.2 s period', () => {
    const c = TTSManager.pitchShiftCurves(48000, -12);
    assert.ok(Math.abs(c.ratio - 0.5) < 1e-9);
    assert.ok(Math.abs(c.period - 0.2) < 1e-3);
    const step = c.rampA[1] - c.rampA[0];
    assert.ok(Math.abs(step * 48000 - 0.5) < 1e-3, 'delay grows at 1 - ratio seconds per second');
    assert.ok(c.rampA[0] === 0 && c.rampA[c.rampA.length - 1] < c.maxDelay);
    const max = Math.max(...c.rampA), min = Math.min(...c.rampA);
    assert.ok(max <= c.maxDelay && min >= 0);
});

test('pitch curves: each window is silent where its own delay wraps, and the two sum to 1', () => {
    const c = TTSManager.pitchShiftCurves(48000, -12);
    const n = c.rampA.length;
    // A wraps between the last and first sample; B wraps half a period later.
    assert.ok(c.windowA[0] < 1e-6);
    let bWrap = -1;
    for (let i = 1; i < n; i++) if (c.rampB[i] < c.rampB[i - 1]) bWrap = i;
    assert.ok(bWrap > 0 && Math.abs(bWrap - n / 2) <= 1);
    assert.ok(c.windowB[bWrap] < 1e-4);
    let worst = 0;
    for (let i = 0; i < n; i++) worst = Math.max(worst, Math.abs(c.windowA[i] + c.windowB[i] - 1));
    assert.ok(worst < 1e-5);
});

test('pitch curves: pitching up ramps the delay down instead', () => {
    const c = TTSManager.pitchShiftCurves(48000, 12);
    assert.ok(c.rampA[1] < c.rampA[0]);
    assert.ok(Math.abs(c.period - 0.1) < 1e-3);
});

test('the built chain: dry + two crossfaded delays, then highpass, drive, lowpass, ring mod, makeup', () => {
    const { ctx, nodes, edges } = fakeCtx();
    const chain = mgr._buildFXChain(ctx, preset);
    const delays = nodes.filter(n => n.kind === 'delay');
    assert.ok(delays.length === 2);
    // Each delay's time and its fade gain are driven by looping buffer sources, all started on one tick.
    const srcs = nodes.filter(n => n.kind === 'buffersrc');
    assert.ok(srcs.length === 4 && srcs.every(s => s.loop === true));
    assert.ok(srcs.every(s => s.startAt === srcs[0].startAt) && srcs[0].startAt >= ctx.currentTime);
    for (const d of delays) {
        assert.ok(edges.some(([a, b]) => a.kind === 'buffersrc' && b === d.delayTime));
        assert.ok(d.max > 0.1);
    }
    // The input feeds the dry gain and both delays.
    const fromInput = downstream(edges, chain.input);
    assert.ok(fromInput.length === 3 && fromInput.filter(n => n.kind === 'delay').length === 2);
    // Order after the blend.
    const hp = nodes.find(n => n.kind === 'biquad' && n.type === 'highpass');
    const lp = nodes.find(n => n.kind === 'biquad' && n.type === 'lowpass');
    const ws = nodes.find(n => n.kind === 'waveshaper');
    assert.ok(downstream(edges, hp).includes(ws));
    assert.ok(downstream(edges, ws).includes(lp));
    // Everything the shifter starts is stopped on dispose: the buffer sources ride in oscs.
    assert.ok(srcs.every(s => chain.oscs.includes(s)));
    // Nothing touches playbackRate or detune: the chain has no such params and there is no
    // AudioBufferSourceNode carrying the voice itself (the voice comes in through input).
    assert.ok(!/playbackRate|detune/.test(pitch.body + build.body));
});

test('no pitchShift in a profile builds no delays (custom object profiles unchanged)', () => {
    const { ctx, nodes } = fakeCtx();
    mgr._buildFXChain(ctx, { highpass: 200, lowpass: 3000, drive: 5, makeup: 1 });
    assert.ok(!nodes.some(n => n.kind === 'delay' || n.kind === 'buffersrc'));
});
