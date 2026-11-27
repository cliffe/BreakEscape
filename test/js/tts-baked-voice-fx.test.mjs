// Baked voice FX (owner, 2026-11-24): Ghost's and the Architect's clips carry the trailer's
// voice chain baked in (tools/voice_fx/bake.py), and the server says so in X-Voice-FX-Baked.
// ApiClient.getTTS marks such a blob, and TTSManager.play() then plays it without the
// speaker's run-time FX, so a saved game whose scenario copy still names 'voice-distortion'
// never hears the FX twice. A clip without the header keeps the run-time FX.
// The real play(), stop() and getTTS() run against fakes.
// Run with: node test/js/tts-baked-voice-fx.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = rel => readFileSync(join(js, rel), 'utf8');
const mgrSrc = read('systems/tts-manager.js');

function lift(src, indent, name, deps, prefix = '') {
    const m = src.match(new RegExp(`\\n${indent}${prefix}(async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n${indent}\\}\\n`));
    assert.ok(m, `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}

class FakeAudio extends EventTarget {
    constructor() { super(); this._src = ''; this.paused = true; this.duration = 2; this.currentTime = 0; }
    get src() { return this._src; }
    set src(v) { this._src = v; setTimeout(() => this.dispatchEvent(new Event('loadedmetadata')), 0); }
    removeAttribute() { this._src = ''; }
    pause() { this.paused = true; }
    async play() { this.paused = false; }
}

const PROFILE = { pitchShift: { semitones: -12, mix: 0.65 } };

/** A manager built from the real play()/stop(); records the FX profile live when each clip starts. */
function manager(blobs) {
    let n = 0;
    const deps = {
        ApiClient: { getTTS: async (id, text) => blobs[text] },
        URL: { createObjectURL: () => `blob:${++n}`, revokeObjectURL: () => {} },
        MusicController: { context: null },
        console
    };
    const mgr = {
        audio: new FakeAudio(), enabled: true, preloadCache: new Map(), playing: false, _hasSrc: false,
        currentText: null, lipSync: null, playSeq: 0, _activeFXProfile: null, atStart: [],
        _setActiveFXProfile(p) { this._activeFXProfile = p || null; },
        _resolveFXProfile(id) { return id === 'ghost' ? PROFILE : null; },
        _ensureAudioContext() {}, _alignLipSync() {}, setDistanceGain() {}
    };
    const realPlay = lift(mgrSrc, '    ', 'play', deps);
    mgr._cacheKey = lift(mgrSrc, '    ', '_cacheKey', {});
    mgr.stop = lift(mgrSrc, '    ', 'stop', deps);
    mgr.audio.play = async function () { mgr.atStart.push(mgr._activeFXProfile); this.paused = false; };
    mgr.play = realPlay;
    return mgr;
}

test('a baked clip plays with no run-time FX', async () => {
    const mgr = manager({ 'Baked.': Object.assign(new Blob(['x']), { voiceFxBaked: 'entropy-comms' }) });
    assert.equal(await mgr.play('ghost', 'Baked.'), 2000);
    assert.deepEqual(mgr.atStart, [null]);
});

test('an unbaked clip of the same speaker still gets the run-time FX, also after a baked one', async () => {
    const mgr = manager({
        'Baked.': Object.assign(new Blob(['x']), { voiceFxBaked: 'entropy-comms' }),
        'Fresh line.': new Blob(['y'])
    });
    await mgr.play('ghost', 'Baked.');
    await mgr.play('ghost', 'Fresh line.');
    assert.deepEqual(mgr.atStart, [null, PROFILE]);
});

test('a preloaded baked clip keeps its mark', async () => {
    const mgr = manager({});
    const blob = Object.assign(new Blob(['x']), { voiceFxBaked: 'entropy-comms' });
    mgr.preloadCache.set(mgr._cacheKey('ghost', 'Later.'), { url: 'blob:pre', blob });
    await mgr.play('ghost', 'Later.');
    assert.deepEqual(mgr.atStart, [null]);
});

test('getTTS marks a blob served with X-Voice-FX-Baked, and only that one', async () => {
    const apiSrc = read('api-client.js');
    const reply = header => async () => ({
        ok: true,
        headers: new Headers(header ? { 'X-Voice-FX-Baked': header } : {}),
        blob: async () => new Blob(['mp3'])
    });
    const getTTS = h => lift(apiSrc, '  ', 'getTTS', {
        fetch: reply(h), getApiBase: () => '/games/1', getCsrfToken: () => 't', console
    }, 'static ');
    assert.equal((await getTTS('entropy-comms')('ghost', 'Hi.')).voiceFxBaked, 'entropy-comms');
    assert.equal((await getTTS(null)('ghost', 'Hi.')).voiceFxBaked, undefined);
});
