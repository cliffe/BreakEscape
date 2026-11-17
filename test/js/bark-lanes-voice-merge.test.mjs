// Train 46 merge into build/ui-hud: the bark voice follow-ups (train 41) and the HUD lanes
// (build/ui-hud) both changed npc-barks.js _renderBark. These pin how the two sets work together:
//  - a voiced line from someone in the building that cannot have a bubble goes to the speech
//    lane (#npc-speech-container) and still stays up until its voice ends;
//  - a phone text held for its voice that steps aside in its lane (lane yield) does not start
//    its countdown when the voice ends while it is hidden, only when it shows again;
//  - a bubble that loses its place while a dialog is open (not a minigame) is held with its voice
//    and the dialog watch releases it, first in line, when the dialog closes.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/bark-lanes-voice-merge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
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
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const NPCBarkSystem = (await imp('systems/npc-barks.js')).default;
const { BARK_RESUME_MIN_MS } = await imp('systems/bark-lifetime.js');

const realTimer = globalThis.setTimeout;
const tick = () => new Promise((r) => realTimer(r, 0));
const wait = (ms) => new Promise((r) => realTimer(r, ms));

function reset() {
    document.body.innerHTML = '';
    window.MinigameFramework = { currentMinigame: null };
    window.currentConversationMinigameType = null;
    window.npcWorldBubbles = null;
    window.getTutorialManager = undefined;
    window.phoneRinger = null;
}

function barkSystem() {
    reset();
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id, npcType: id === 'agent' ? 'phone' : 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.playBarkSound = () => {};
    return sys;
}

// A stand-in TTSManager: play() starts the audio and resolves with its length; end() finishes it
function fakeVoice(sys, npcId, { duration = 4000 } = {}) {
    const audio = new window.EventTarget();
    audio.paused = true; audio.ended = false;
    let seq = 0;
    const m = {
        audio, playing: false, currentText: null, plays: [], stops: 0,
        get playSeq() { return seq; },
        play(id, text) {
            seq++;
            m.plays.push(text); m.currentText = text; m.playing = true; audio.paused = false; audio.ended = false;
            return Promise.resolve(duration);
        },
        stop() {
            m.stops++; m.currentText = null;
            if (m.playing) { m.playing = false; audio.paused = true; audio.dispatchEvent(new window.Event('pause')); }
        },
        end() {
            m.playing = false; audio.paused = true; audio.ended = true;
            audio.dispatchEvent(new window.Event('pause')); audio.dispatchEvent(new window.Event('ended'));
        }
    };
    sys.ttsManagers.set(npcId, m);
    return m;
}

test('a voiced line with no bubble goes to the speech lane and stays up until its voice ends', async () => {
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi');
    await sys._renderBark({ npcId: 'ravi', npcName: 'Ravi', message: 'Badges on, please.', useTTS: true });
    await tick();
    const el = document.querySelector('#npc-speech-container .npc-bark');
    assert.ok(el, 'in the speech lane');
    assert.equal(el.dataset.source, 'speech');
    assert.equal(document.querySelectorAll('#npc-bark-container .npc-bark').length, 0, 'not a phone text');
    assert.equal(el._voiceHold, true, 'held for its voice');
    assert.equal(el._onLaneYield, undefined, 'speech has no lane-yield hook (not clickable)');
    ravi.end();
    assert.equal(el._voiceHold, false);
    assert.ok(el._autoCloseTimer, 'its countdown starts when the voice ends');
    clearTimeout(el._autoCloseTimer);
});

test('a phone text held for its voice that is stepped aside starts its countdown only when it shows again', async () => {
    const sys = barkSystem();
    const agent = fakeVoice(sys, 'agent');
    await sys._renderBark({ npcId: 'agent', npcName: 'Agent', message: 'Check your inbox.', useTTS: true });
    await tick();
    const el = document.querySelector('#npc-bark-container .npc-bark');
    assert.ok(el, 'a phone text');
    assert.equal(el._voiceHold, true);
    el._onLaneYield(true);                         // the lanes step it aside on a short screen
    agent.end();
    assert.equal(el._voiceHold, false);
    await wait(5);
    assert.ok(el.isConnected && !el._removing, 'still there, paused');
    assert.equal(el._autoClosePaused, true, 'no countdown while hidden');
    el._onLaneYield(false);
    assert.equal(el._autoClosePaused, false);
    assert.ok(el._autoCloseRemaining >= BARK_RESUME_MIN_MS, 'the rest of its time, at least the minimum');
    clearTimeout(el._autoCloseTimer);
});

test('a bubble that loses its place under a dialog is held with its voice and the dialog watch releases it first', async () => {
    const sys = barkSystem();
    const prevPoll = NPCBarkSystem.DIALOG_HOLD_POLL_MS;
    NPCBarkSystem.DIALOG_HOLD_POLL_MS = 5;
    const ravi = fakeVoice(sys, 'ravi', { duration: 10 });
    const helen = fakeVoice(sys, 'helen', { duration: 10 });
    const payload = { npcId: 'ravi', npcName: 'Ravi', message: 'The fire door is open again.', useTTS: true };
    try {
        // His voice is playing when a dialog opens and the bubble loses its place
        const started = ravi.play('ravi', payload.message);
        const voice = sys._voiceTracker('ravi', started, payload.message);
        await tick();
        let dialogOpen = true;
        window.getTutorialManager = () => ({ isPromptOpen: () => dialogOpen });
        sys._bubbleLeft(payload, payload.message, { why: 'left-view', page: 0 }, voice);
        assert.equal(ravi.stops, 1, 'his voice stops');
        assert.ok(sys._dialogHoldTimer, 'holding his line arms the dialog watch (nothing else is queued)');
        // Helen's line arrives under the dialog and waits behind his
        assert.equal(sys.showBark({ npcId: 'helen', npcName: 'Helen', message: 'Already waiting.', useTTS: true }), null);
        assert.equal(sys.deferredBarkQueue[0], payload, 'his whole line first in line');
        assert.equal(sys.deferredBarkQueue.length, 2);
        assert.equal(document.querySelectorAll('.npc-bark').length, 0, 'nothing over the dialog');
        // The dialog closes: the watch drains, his line plays again before Helen's
        dialogOpen = false;
        await wait(30);
        assert.deepEqual(ravi.plays, [payload.message, payload.message], 'voiced again after the dialog');
        assert.deepEqual(helen.plays, [], 'Helen waits for him');
        ravi.end();
        for (let i = 0; i < 200 && helen.plays.length === 0; i++) await wait(20);
        assert.deepEqual(helen.plays, ['Already waiting.'], 'then Helen');
        helen.end();
        const shown = [...document.querySelectorAll('.npc-bark .npc-bark-text')].map(e => e.textContent);
        assert.equal(shown.filter(t => t.includes('fire door')).length, 1, 'his line shows once');
    } finally {
        NPCBarkSystem.DIALOG_HOLD_POLL_MS = prevPoll;
        clearInterval(sys._dialogHoldTimer);
        for (const el of document.querySelectorAll('.npc-bark')) clearTimeout(el._autoCloseTimer);
    }
});
