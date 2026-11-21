// Lip-sync timing (m02 trailer review: "a little off for all characters"; video capture measured
// the mouth 30 to 50 ms late). Two fixes:
//  1. the viseme lookup reads ahead of audio.currentTime by the audio output latency
//     (AudioContext baseLatency + outputLatency, else 30 ms); playback is never moved;
//  2. while the line's audio is still decoding for alignment, the mouth follows the live level
//     (neutral open shape while speaking, rest in gaps) instead of the text timeline stretched
//     over the whole clip, which mis-times the first syllables.
// The real lip-sync.js helpers; the real _getCurrentVisemeColumn and _alignLipSync lifted from
// their sources and run on fakes. Assertions are plain booleans.
// Run with: node test/js/lip-sync-latency.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const lip = await import(pathToFileURL(join(js, 'minigames/person-chat/lip-sync.js')).href);
const { outputLeadMs, visemeLookupMs, pendingViseme, DEFAULT_OUTPUT_LEAD_MS, MAX_OUTPUT_LEAD_MS } = lip;

function lift(file, name, deps) {
    const src = readFileSync(join(js, file), 'utf8');
    const m = src.match(new RegExp(`\\n    (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(Boolean(m), `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}

test('output lead: base + output latency when reported, 30 ms when not, capped', () => {
    assert.ok(outputLeadMs({ baseLatency: 0.01, outputLatency: 0.032 }) === 42);
    assert.ok(outputLeadMs({ outputLatency: 0.02 }) === 20);
    assert.ok(outputLeadMs({ baseLatency: 0.01, outputLatency: 0 }) === DEFAULT_OUTPUT_LEAD_MS);
    assert.ok(outputLeadMs({}) === 30 && outputLeadMs(null) === 30);
    assert.ok(outputLeadMs({ outputLatency: 2 }) === MAX_OUTPUT_LEAD_MS);
    assert.ok(outputLeadMs({ outputLatency: NaN }) === 30);
});

test('lookup time is the clip position plus the lead; bad positions count as 0', () => {
    assert.ok(visemeLookupMs(1.5, 30) === 1530);
    assert.ok(visemeLookupMs(0, 30) === 30);
    assert.ok(visemeLookupMs(NaN, 30) === 30);
    assert.ok(visemeLookupMs(2, -5) === 2000);
});

test('the lead moves a shape change earlier by exactly the lead', () => {
    const steps = [{ viseme: 'rest', duration: 200 }, { viseme: 'wide_open', duration: 100 }, { viseme: 'rest', duration: 100 }];
    // At 0.175 s the clip is still in rest; 30 ms ahead the speakers are already on the vowel.
    assert.ok(lip.visemeAt(steps, visemeLookupMs(0.175, 0)) === 'rest');
    assert.ok(lip.visemeAt(steps, visemeLookupMs(0.175, 30)) === 'wide_open');
    assert.ok(lip.visemeAt(steps, visemeLookupMs(0.165, 30)) === 'rest');
});

test('pending shape follows the live level', () => {
    assert.ok(pendingViseme(true) === 'medium_open');
    assert.ok(pendingViseme(false) === 'rest');
});

// ---------------------------------------------------------------- the portrait's lookup

const colFor = { rest: 0, closed: 1, teeth: 2, round: 3, wide_open: 4, medium_open: 5, small_open: 6 };
const getCol = lift('minigames/person-chat/person-chat-portraits.js', '_getCurrentVisemeColumn', {
    visemeAt: lip.visemeAt, visemeLookupMs, pendingViseme,
    textToVisemes: lip.textToVisemes, scaleTimeline: lip.scaleTimeline, holdTimeline: lip.holdTimeline,
    isBlinking: () => false, seedFrom: () => 0
});
function portrait(tts) {
    return { visemeSheet: { columnFor: colFor }, npc: { id: 'x' }, ttsManager: tts, _narratorMode: false, getCol };
}
function fakeTts({ text = 'Hello there.', t = 0.5, speaking = true, aligned = null, pending = null, lead = 30 } = {}) {
    return {
        currentText: text, lipSync: aligned ? { text, timeline: aligned } : null, lipSyncPending: pending,
        audio: { currentTime: t, duration: 2 }, _analyser: {},
        isPlaying: () => true, isSpeaking: () => speaking, lipSyncLeadMs: () => lead
    };
}

test('while the decode is pending the mouth follows the level, not the text timeline', () => {
    const text = 'Hello there.';
    const open = portrait(fakeTts({ text, pending: text, speaking: true }));
    assert.ok(open.getCol() === colFor.medium_open);
    const quiet = portrait(fakeTts({ text, pending: text, speaking: false }));
    assert.ok(quiet.getCol() === colFor.rest);
});

test('once the fitted timeline lands it is used at once, read ahead by the lead', () => {
    const text = 'Hello there.';
    const aligned = [{ viseme: 'rest', duration: 500 }, { viseme: 'round', duration: 300 }, { viseme: 'rest', duration: 1200 }];
    const p = portrait(fakeTts({ text, aligned, t: 0.48, lead: 30 }));
    assert.ok(p.getCol() === colFor.round, 'lead reaches the shape 20 ms before the clip does');
    const p0 = portrait(fakeTts({ text, aligned, t: 0.48, lead: 0 }));
    assert.ok(p0.getCol() === colFor.rest);
});

test('a decode that failed (not pending, nothing fitted) falls back to the text timeline', () => {
    const text = 'Momma.';
    const p = portrait(fakeTts({ text, pending: null, t: 0.05, lead: 0 }));
    const col = p.getCol();
    // The text timeline is not the pending shape: it starts on rest or the first letter's shape.
    assert.ok(Number.isInteger(col));
    const steps = lip.holdTimeline(lip.scaleTimeline(lip.textToVisemes(text), 2000));
    assert.ok(col === colFor[lip.visemeAt(steps, 50)]);
});

test('a pending flag left from another line does not apply', () => {
    const p = portrait(fakeTts({ text: 'New line.', pending: 'Old line.', speaking: true, t: 0.0, lead: 0 }));
    const steps = lip.holdTimeline(lip.scaleTimeline(lip.textToVisemes('New line.'), 2000));
    assert.ok(p.getCol() === colFor[lip.visemeAt(steps, 0)]);
});

test('an older TTS manager without lipSyncLeadMs gets no lead (no throw)', () => {
    const tts = fakeTts({ aligned: [{ viseme: 'round', duration: 5000 }] });
    delete tts.lipSyncLeadMs;
    assert.ok(portrait(tts).getCol() === colFor.round);
});

// ---------------------------------------------------------------- the pending flag

function alignRig({ fail = false, swap = false } = {}) {
    let resolveDecode;
    const ctx = {
        decodeAudioData: () => new Promise((res, rej) => { resolveDecode = () => (fail ? rej(new Error('bad')) : res({ sampleRate: 1000, getChannelData: () => new Float32Array(100) })); })
    };
    const align = lift('systems/tts-manager.js', '_alignLipSync', {
        MusicController: { context: ctx },
        envelopeFromSamples: () => [0, 1, 1, 0],
        alignToEnvelope: () => [{ viseme: 'round', duration: 80 }]
    });
    const mgr = { audio: { src: 'blob:a' }, lipSync: null, lipSyncPending: null };
    const blob = { arrayBuffer: async () => new ArrayBuffer(4) };
    const run = align.call(mgr, blob, 'blob:a', 'Line.');
    return { mgr, run, finish: async () => { await new Promise(r => setTimeout(r, 0)); if (swap) mgr.audio.src = 'blob:b'; resolveDecode(); await run; } };
}

test('the pending flag is set while decoding and cleared when the timeline lands', async () => {
    const r = alignRig();
    assert.ok(r.mgr.lipSyncPending === 'Line.');
    await r.finish();
    assert.ok(r.mgr.lipSyncPending === null && r.mgr.lipSync?.text === 'Line.');
});

test('a failed decode clears the flag, so the portrait falls back to text timing', async () => {
    const r = alignRig({ fail: true });
    await r.finish();
    assert.ok(r.mgr.lipSyncPending === null && r.mgr.lipSync === null);
});

test('a decode that finishes after a newer line started leaves that line alone', async () => {
    const r = alignRig({ swap: true });
    r.mgr.lipSyncPending = 'Next.'; // the newer line set its own flag
    await r.finish();
    assert.ok(r.mgr.lipSyncPending === 'Next.' && r.mgr.lipSync === null);
});

test('no audio context: no flag (nothing will decode)', async () => {
    const align = lift('systems/tts-manager.js', '_alignLipSync', { MusicController: {}, envelopeFromSamples() {}, alignToEnvelope() {} });
    const mgr = { audio: { src: 'blob:a' }, lipSync: null, lipSyncPending: null };
    await align.call(mgr, { arrayBuffer: async () => new ArrayBuffer(1) }, 'blob:a', 'Line.');
    assert.ok(mgr.lipSyncPending === null);
});
