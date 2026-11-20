// TTSManager.play() superseded while it loads (bark follow-ups review R2 n2).
// A replay of a line can start while the first, cancelled play() is still fetching its clip.
// The late first fetch must not set audio.src (that fires 'emptied' on the replay's clip, which
// settles the bark's _voiceEnd early) or play its line again over the replay: the superseded
// call resolves null and leaves the element alone. The bark and phone-message callers read a
// superseded null as "not mine", not as "no voice" (no beep, no speech-synthesis fallback).
// The real play() and stop() run on a fake <audio>; nothing else is stubbed out of them.
// Run with: node --test test/js/tts-superseded-play.test.mjs
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

// Lift a class method out of its source and bind its free names to stubs.
function method(src, name, deps) {
    const m = src.match(new RegExp(`\\n    (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}

/** Enough of an HTMLAudioElement: setting src fires 'emptied' (if one was loaded) then 'loadedmetadata'. */
class FakeAudio extends EventTarget {
    constructor() { super(); this._src = ''; this.paused = true; this.ended = false; this.duration = 2; this.currentTime = 0; this.log = []; }
    get src() { return this._src; }
    set src(v) {
        if (this._src) { this.log.push('emptied'); this.dispatchEvent(new Event('emptied')); }
        this._src = v;
        this.paused = true;
        this.log.push(`src ${v}`);
        setTimeout(() => this.dispatchEvent(new Event('loadedmetadata')), 0);
    }
    removeAttribute(name) { if (name === 'src') { this._src = ''; this.log.push('removed'); } }
    pause() { this.paused = true; }
    async play() { this.paused = false; this.log.push(`play ${this._src}`); }
}

function deferred() { let resolve; const p = new Promise(r => { resolve = r; }); return { p, resolve }; }

/** A manager built from the real play()/stop(); getTTS answers each request from `fetches`. */
function manager(fetches) {
    let n = 0;
    const deps = {
        ApiClient: { getTTS: (id, text) => fetches[text]() },
        URL: { createObjectURL: () => `blob:${++n}`, revokeObjectURL: () => {} },
        MusicController: { context: null },
        console
    };
    const mgr = {
        audio: new FakeAudio(), enabled: true, preloadCache: new Map(), playing: false, _hasSrc: false,
        currentText: null, lipSync: null, playSeq: 0,
        _setActiveFXProfile() {}, _resolveFXProfile() { return null; }, _ensureAudioContext() {}, _alignLipSync() {}, setDistanceGain() {}
    };
    mgr._cacheKey = method(mgrSrc, '_cacheKey', {});
    mgr.stop = method(mgrSrc, 'stop', deps);
    mgr.play = method(mgrSrc, 'play', deps);
    return mgr;
}

test('a late first fetch neither empties nor replaces the replay of the same line', async () => {
    const first = deferred();
    let calls = 0;
    const mgr = manager({ 'Morning.': () => (++calls === 1 ? first.p : Promise.resolve({ size: 1 })) });

    const p1 = mgr.play('kevin_park', 'Morning.');    // cancelled bark: its clip is still loading
    mgr.stop();
    const p2 = mgr.play('kevin_park', 'Morning.');    // the replay
    assert.equal(await p2, 2000);
    const replaySrc = mgr.audio.src;
    let emptied = 0;
    mgr.audio.addEventListener('emptied', () => { emptied++; });
    const logAtReplay = mgr.audio.log.length;

    first.resolve({ size: 1 });                       // the first fetch lands late
    assert.equal(await p1, null);
    await new Promise(r => setTimeout(r, 5));

    assert.equal(emptied, 0, "no 'emptied' on the replay's clip");
    assert.equal(mgr.audio.src, replaySrc, 'the replay keeps the element');
    assert.deepEqual(mgr.audio.log.slice(logAtReplay), [], 'the superseded play never touches the element');
    assert.equal(mgr.playing, true);
    assert.equal(mgr.currentText, 'Morning.');
    assert.equal(mgr.audio.paused, false);
});

test('a play superseded while its clip loads leaves the newer line playing', async () => {
    const mgr = manager({ 'One.': () => Promise.resolve({ size: 1 }), 'Two.': () => Promise.resolve({ size: 1 }) });
    const p1 = mgr.play('kevin_park', 'One.');
    await Promise.resolve();                          // the first fetch is in, src set, metadata pending
    await Promise.resolve();
    const p2 = mgr.play('kevin_park', 'Two.');
    assert.equal(await p1, null);
    assert.equal(await p2, 2000);
    assert.equal(mgr.currentText, 'Two.');
    assert.equal(mgr.playing, true);
    assert.equal(mgr.audio.log.filter(e => e.startsWith('play ')).length, 1, 'only the newer line plays');
});

test('an unsuperseded play is unchanged: duration, currentText, playing', async () => {
    const mgr = manager({ 'Fine.': () => Promise.resolve({ size: 1 }) });
    assert.equal(await mgr.play('kevin_park', 'Fine.'), 2000);
    assert.equal(mgr.currentText, 'Fine.');
    assert.equal(mgr.playing, true);
    assert.equal(mgr.playSeq, 1);
});

// npc-barks.js methods sit at a two-space indent
function barkMethod(name, deps) {
    const src = read('systems/npc-barks.js');
    const m = src.match(new RegExp(`\\n  (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n  \\}\\n`));
    assert.ok(m, `${name} found`);
    const head = m[1] ? 'async function' : 'function';
    return new Function(...Object.keys(deps), `return ${head} (${m[2]}) {\n${m[3]}\n};`)(...Object.values(deps));
}

test('a superseded bark voice is not "no voice": no beep, and not the replay\'s Infinity', async () => {
    const first = deferred();
    let calls = 0;
    const mgr = manager({ 'Morning.': () => (++calls === 1 ? first.p : Promise.resolve({ size: 1 })) });
    let beeps = 0;
    const barks = { ttsManagers: new Map([['kevin_park', mgr]]), playBarkSound() { beeps++; } };
    barks._voicePlaying = barkMethod('_voicePlaying', {});
    barks._speakBark = barkMethod('_speakBark', { TTSManager: function () { throw new Error('unused'); } });

    const b1 = barks._speakBark('kevin_park', 'Morning.');
    mgr.stop();
    const b2 = barks._speakBark('kevin_park', 'Morning.');
    assert.equal(await b2, 2000);
    first.resolve({ size: 1 });
    assert.equal(await b1, null);
    assert.equal(beeps, 0);
});

test('phone voice messages: a superseded play leaves the newer one\'s button and skips speech synthesis', () => {
    const phone = read('minigames/phone-chat/phone-chat-ui.js');
    assert.match(phone, /const playing = this\.ttsManager\.play\(npcId, text\);\n\s+const seq = this\.ttsManager\.playSeq;\n\s+const duration = await playing;\n[\s\S]{0,250}if \(this\.ttsManager\.playSeq !== seq\) return;/);
});
