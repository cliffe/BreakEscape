// The ending shows the score the server returns from the conclude request: as the last credit line,
// and in the STATUS row once the credits fade. Real modules run in jsdom; only the audio, art and
// navigation dependencies are stubbed.
// Run with: node test/js/credits-score-line.test.mjs
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const real = (p) => readFileSync(join(js, p), 'utf8');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
const win = dom.window;
for (const k of ['document', 'navigator', 'HTMLElement', 'Node', 'Event', 'CustomEvent']) {
    Object.defineProperty(globalThis, k, { value: win[k], configurable: true, writable: true });
}
globalThis.window = win;
win.breakEscapeConfig = { gameId: 7 };
win.requestAnimationFrame = () => 0;
win.cancelAnimationFrame = () => {};
// The visualiser starts intervals that would keep plain `node` alive after the last test.
globalThis.setInterval = () => 0;
win.setInterval = () => 0;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
const ctx2d = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => ({ width: 0 })), set: (t, k, v) => { t[k] = v; return true; } });
win.HTMLCanvasElement.prototype.getContext = () => ctx2d;

// A temp tree: real visualiser, credits theme, closing sequence, display-dashes, conclude-mission and
// the music-events module; stubs for what needs audio, art or the network.
const dir = mkdtempSync(join(tmpdir(), 'credits-score-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const sub of ['music', 'ui', 'utils']) mkdirSync(join(dir, sub));
const put = (p, src) => writeFileSync(join(dir, p), src);
for (const p of ['music/bond-visualiser.js', 'music/credits-theme.js', 'music/closing-sequence.js',
    'music/conclude-mission.js', 'music/scenario-music-events.js', 'utils/display-dashes.js']) put(p, real(p));
put('music/music-controller.js', 'const base = { isLeader: false, context: null, getState() { return {}; } }; export default new Proxy(base, { get: (t, k) => (k in t ? t[k] : () => false), set: (t, k, v) => { t[k] = v; return true; } });');
put('music/ending-audio.js', 'export const silenceBackgroundForEnding = () => {}; export const AUDIO_HOLD_TEXT = ""; export const playEndingMusic = () => null; export const whenEndingAudible = () => ({ ready: Promise.resolve() });');
put('music/music-config.js', 'export const MUSIC_CONFIG = {};');
put('music/cctv-feeds.js', 'export const cctvFeeds = () => [];');
put('ui/success-screen.js', 'export const returnToMissions = () => {};');
put('config.js', 'export const ASSETS_PATH = "/assets";');
const load = (p) => import(pathToFileURL(join(dir, p)).href);
const cm = await load('music/conclude-mission.js');
const { BondVisualiser } = await load('music/bond-visualiser.js');
const { endingReplayOptions } = await load('music/scenario-music-events.js');

const statusText = () => document.querySelector('#bond-vis-overlay #bv-status-val')?.textContent;
const labelText = () => document.querySelector('#bond-vis-overlay .bv-credits-label, #bond-vis-overlay [id*="credits"]')?.textContent;

// Runs one credits sequence to its last line with fake timers and returns what the STATUS row says.
async function rollCredits(opts) {
    const realSet = globalThis.setTimeout;
    const realSetWin = win.setTimeout;
    const queue = [];
    const fake = (fn) => { queue.push(fn); return queue.length; };
    globalThis.setTimeout = fake; win.setTimeout = fake;
    const shown = [];
    try {
        BondVisualiser.open(opts);
        for (let i = 0; i < 60 && queue.length; i++) {
            queue.shift()();
            const t = document.querySelector('#bond-vis-overlay #bv-credits-label, #bond-vis-overlay .bv-credits-text');
            if (t && t.textContent) shown.push(t.textContent);
        }
    } finally { globalThis.setTimeout = realSet; win.setTimeout = realSetWin; }
    return shown;
}

test('withScoreLine appends "SCORE n / 100", rounded, without touching the input', () => {
    const credits = [{ text: 'MISSION COMPLETE', style: 'title' }];
    const out = cm.withScoreLine(credits, 88.6);
    assert.equal(credits.length, 1);
    assert.deepEqual(out, [...credits, { text: 'SCORE 89 / 100', style: 'entry' }], 'no spacer line');
});

test('withScoreLine puts the score before a closing teaser', () => {
    const out = cm.withScoreLine([{ text: 'END', style: 'entry' }, { text: 'NEXT TIME', style: 'teaser' }], 50);
    assert.deepEqual(out.map(l => l.text), ['END', 'SCORE 50 / 100', 'NEXT TIME']);
});

test('a score of 0 is shown; a missing or non-numeric score is not', () => {
    assert.equal(cm.withScoreLine([], 0)[0].text, 'SCORE 0 / 100');
    assert.equal(cm.scoreStatusNote(0), 'SCORE 0 / 100');
    const credits = [{ text: 'A' }];
    for (const bad of [null, undefined, NaN, Infinity, '89']) {
        assert.equal(cm.withScoreLine(credits, bad), credits);
        assert.equal(cm.scoreStatusNote(bad), undefined);
    }
});

test('the credits and the STATUS row use one format', () => {
    assert.equal(cm.withScoreLine([], 89).at(-1).text, cm.scoreStatusNote(89));
});

test('postConclude returns the score from the server answer, null when absent', async () => {
    const reply = (body) => ({ fetch: async () => ({ ok: true, json: async () => body }), csrf: 'x' });
    assert.equal((await cm.postConclude(1, reply({ success: true, score: 89 }))).score, 89);
    assert.equal((await cm.postConclude(1, reply({ success: true }))).score, null);
    assert.equal((await cm.postConclude(1, reply({ success: true, score: null }))).score, null);
    assert.equal((await cm.postConclude(1, reply({ alreadyConcluded: true, score: 0 }))).score, 0);
});

// ---- the visualiser's finish branch (real module, jsdom) ----

test('the finish branch puts the score in the STATUS row, found by id', async () => {
    await rollCredits({ credits: [{ text: 'THE END', style: 'entry' }, { text: 'SCORE 89 / 100', style: 'entry' }],
        missionOver: true, endNote: 'SCORE 89 / 100' });
    assert.equal(statusText(), 'SCORE 89 / 100');
});

test('a scenario statusText stays and the score is appended', async () => {
    BondVisualiser.close();
    await rollCredits({ credits: [{ text: 'THE END' }], missionOver: true, statusText: 'COMPROMISED', endNote: 'SCORE 40 / 100' });
    assert.equal(statusText(), 'COMPROMISED // SCORE 40 / 100');
});

test('setEndNote replaces a stale PENDING SYNC row on a late success', async () => {
    const w = { BondVisualiser, gameAlert() {} };
    const q = cm.queueConcludeRetry(7, { window: w, every: 1e9, sync: async () => {},
        fetch: async () => ({ ok: true, json: async () => ({ success: true, score: 77 }) }), csrf: 'x' });
    await rollCredits(cm.offlineEndingOptions({ credits: [{ text: 'THE END' }], missionOver: true }));
    assert.equal(statusText(), 'PENDING SYNC');
    await q.attempt();
    assert.equal(statusText(), 'SCORE 77 / 100');
    q.stop();
});

test('the offline path shows no score and no note', async () => {
    const opts = cm.offlineEndingOptions({ credits: cm.withScoreLine([{ text: 'THE END' }], null), endNote: cm.scoreStatusNote(null), missionOver: true });
    assert.equal(opts.endNote, undefined);
    assert.ok(!opts.credits.some(l => /SCORE/.test(l.text)));
    await rollCredits(opts);
    assert.equal(statusText(), 'PENDING SYNC');
});

test('the end note does not leak into the next open', async () => {
    await rollCredits({ credits: [{ text: 'ONE' }], missionOver: true, endNote: 'SCORE 10 / 100' });
    assert.equal(statusText(), 'SCORE 10 / 100');
    // a second set of credits with no score: the old note must not come back.
    // The STATUS row is deliberately not reset by hand, so a stale note would show.
    await rollCredits({ credits: [{ text: 'TWO' }], missionOver: true });
    assert.notEqual(statusText(), 'SCORE 10 / 100');
});

// ---- the replay path ----

test('endingReplayOptions adds the configured score as the last credit and as the end note', () => {
    const scenario = { music: { events: [{ trigger: 'end_now', credits: [{ text: 'END', style: 'entry' }] }] } };
    win.breakEscapeConfig = { missionScore: 83 };
    globalThis.window = win;
    const opts = endingReplayOptions(scenario, {});
    assert.equal(opts.credits.at(-1).text, 'SCORE 83 / 100');
    assert.equal(opts.endNote, 'SCORE 83 / 100');
    win.breakEscapeConfig = { missionScore: 0 };
    assert.equal(endingReplayOptions(scenario, {}).credits.at(-1).text, 'SCORE 0 / 100');
});

test('endingReplayOptions shows no score when a host owns scoring (missionScore null or absent)', () => {
    const scenario = { music: { events: [{ trigger: 'end_now', credits: [{ text: 'END', style: 'entry' }] }] } };
    for (const cfg of [{ missionScore: null }, {}]) {
        win.breakEscapeConfig = cfg;
        const opts = endingReplayOptions(scenario, {});
        assert.deepEqual(opts.credits.map(l => l.text), ['END']);
        assert.equal(opts.endNote, undefined);
    }
});

