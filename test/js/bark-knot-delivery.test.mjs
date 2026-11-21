// D280 live proof: a knot bark's #delivery: note is part of its clip's key, so the bark must send
// it with the line. Before this fix every caNN_react bark asked for an untagged clip that was never
// made (503 on a keyless server; a paid live clip on a keyed one).
//  - npc-barks passes the note from payload.tags to TTSManager.play as { delivery };
//  - a bark with no tags (event-mapping bark strings) plays with delivery null;
//  - npc-manager's knot bark puts the ink line's tags on the showBark payload.
// Run with: bin/test-js test/js/bark-knot-delivery.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.gameState = { globalVariables: {} };
window.__hudLanesDisabled = true;
const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()), apply: () => inert(), set: () => true });
globalThis.AudioContext = window.AudioContext = function AudioContext() { return inert(); };
const NPCBarkSystem = (await import(pathToFileURL(join(js, 'systems/npc-barks.js')).href)).default;

const tick = () => new Promise((r) => setTimeout(r, 0));

function setup() {
    document.body.innerHTML = '';
    window.MinigameFramework = { currentMinigame: null };
    window.currentConversationMinigameType = null;
    window.npcWorldBubbles = null;
    window.phoneRinger = null;
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id, npcType: 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.playBarkSound = () => {};
    const calls = [];
    const audio = new window.EventTarget();
    audio.paused = true;
    let seq = 0;
    sys.ttsManagers.set('anjali', {
        audio, currentText: null, get playSeq() { return seq; },
        play(id, text, opts = {}) { seq++; calls.push({ text, delivery: opts.delivery ?? null }); return Promise.resolve(3000); },
        stop() {}
    });
    return { sys, calls };
}

test('a knot bark sends its #delivery: note with the line', async () => {
    const { sys, calls } = setup();
    await sys._renderBark({ npcId: 'anjali', npcName: 'Anjali', message: 'Someone clocked that prompt.',
        tags: ['delivery: approving, calm'], useTTS: true });
    await tick();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].delivery, 'approving, calm');
});

test('a bark with no tags plays untagged', async () => {
    const { sys, calls } = setup();
    await sys._renderBark({ npcId: 'anjali', npcName: 'Anjali', message: 'Badges on, please.', useTTS: true });
    await tick();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].delivery, null);
});

test('npc-manager puts the knot line tags on the showBark payload', () => {
    const src = readFileSync(join(js, 'systems/npc-manager.js'), 'utf8');
    const i = src.indexOf('async _showBarkFromKnot');
    assert.ok(i > 0);
    const body = src.slice(i, src.indexOf('this.barkSystem.showBark({', i) + 400);
    assert.match(body, /tags:\s*result\.tags/);
});
