// Phone voice messages: a play() that a later play() supersedes resolves null.
// playVoiceMessage must treat that as "replaced", not as "no voice": the newer
// message keeps its Stop button and speech synthesis is never used.
// The real PhoneChatUI source runs against jsdom with a fake TTS manager.
import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
class FakeAudio { constructor() { this.volume = 1; } addEventListener() {} play() { return Promise.resolve(); } pause() {} removeAttribute() {} }
globalThis.Audio = window.Audio = FakeAudio;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };

const { default: PhoneChatUI } = await import(
    pathToFileURL(join(root, 'public/break_escape/js/minigames/phone-chat/phone-chat-ui.js')).href
);

function fakeTts() {
    return {
        playSeq: 0, pending: [],
        play() { this.playSeq++; let r; const p = new Promise(res => { r = res; }); this.pending.push(r); return p; },
        stop() {}, onEnded() {}, setVoiceFX() {}
    };
}

function mkUi() {
    const ui = Object.create(PhoneChatUI.prototype);
    const spoken = [];
    Object.assign(ui, {
        ttsManager: fakeTts(), isPlaying: false, currentPlayButton: null, currentNPCId: 'n1',
        npcManager: { getNPC: () => ({ voice: { name: 'x' } }) }, speechAvailable: true,
        speechSynthesis: { cancel() {}, speak(u) { spoken.push(u.text); } },
        voiceSettings: { rate: 1, pitch: 1, volume: 1 }
    });
    globalThis.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    return { ui, spoken };
}

const btn = () => document.createElement('button');

test('a superseded message (play resolves null) leaves the newer one playing, with no speech synthesis', async () => {
    const { ui, spoken } = mkUi();
    const a = btn();
    const b = btn();
    const pa = ui.playVoiceMessage('message A', a);
    ui.playVoiceMessage('message A', a); // second click on A: stop
    const pb = ui.playVoiceMessage('message B', b);
    ui.ttsManager.pending[0](null); // A was superseded by B
    await pa;
    assert.deepEqual(spoken, []);
    assert.equal(b.title, 'Stop');
    assert.equal(ui.isPlaying, true);
    assert.equal(ui.currentPlayButton, b);
    ui.ttsManager.pending[1](3000);
    await pb;
    assert.equal(b.title, 'Stop');
    assert.equal(a.title, 'Play');
    assert.deepEqual(spoken, []);
});
