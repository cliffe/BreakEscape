// Release follow-ups to the held-bark drain (sis01 network isolation, train 34):
//  - item 2: a panel opening over a speaking bubble holds the whole line with its voice, instead of
//    letting the voice run on under the panel and showing a silent toast afterwards;
//  - item 3: a bubble never ends while its voice plays: its last line page waits for the voice; a
//    bubble that loses its place hands the rest to a toast at once (not queued behind its own
//    voice), and that toast stays until the voice ends;
//  - item 4: a clip whose length reads NaN while it plays counts as playing (Infinity), so the
//    next held bark waits for its end instead of talking over it.
// The real modules run against jsdom.
// Run with: bin/test-js test/js/bark-voice-followups.test.mjs
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
const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()), apply: () => inert(), set: () => true });
globalThis.AudioContext = window.AudioContext = function AudioContext() { return inert(); };
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const NPCBarkSystem = (await imp('systems/npc-barks.js')).default;
const { NpcWorldBubbles, pagesText, VOICE_HOLD_CAP_MS } = await imp('systems/npc-world-bubbles.js');
const { BARK_RESUME_MIN_MS } = await imp('systems/bark-lifetime.js');

const LONG = "Badges on at all times past this point, please. If yours has stopped working, reception can print a new one. And don't wedge the fire door open again.";

// ---- a scene whose objects record nothing (the layer only needs the calls to exist) ----
function mk(scene, kind) {
    const o = { kind, x: 0, y: 0, visible: true, data: {}, scene, text: '',
        get width() { return o.kind === 'text' ? Math.max(...String(o.text).split('\n').map(l => l.length), 0) * 7 : 16; },
        get height() { return o.kind === 'text' ? String(o.text).split('\n').length * 16 : 16; },
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture() { return o; }, setText(t) { o.text = t; return o; }, setDepth() { return o; }, setTint() { return o; },
        setFontSize() { return o; }, destroy() { o.destroyed = true; }, setData(k, v) { o.data[k] = v; return o; },
        getData(k) { return o.data[k]; }, setScale() { return o; } };
    for (const m of ['clear', 'fillStyle', 'lineStyle', 'fillRect', 'strokeRect', 'fillTriangle', 'lineBetween']) o[m] = () => o;
    return o;
}

function rig() {
    const scene = { add: {}, textures: { exists: () => true }, load: { image() {}, once() {}, isLoading: () => true, start() {} },
        tweens: { add: () => ({ stop() {} }) } };
    scene.add.text = () => mk(scene, 'text');
    scene.add.image = () => mk(scene, 'image');
    scene.add.graphics = () => mk(scene, 'graphics');
    scene.add.container = () => mk(scene, 'container');
    const s = { npcId: 'ravi', x: 100, y: 100, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
        getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
    window.rooms = { office: { npcSprites: [s] } };
    window.currentPlayerRoom = 'office';
    window.player = { x: 100, y: 140 };
    window.MinigameFramework = { currentMinigame: null };
    window.currentConversationMinigameType = null;
    window.lightingSystem = null;
    window.npcNeedsSystem = null;
    window.npcBehaviorManager = null;
    let t = 0;
    const clock = { now: () => t, advance: (ms) => { t += ms; } };
    const bubbles = new NpcWorldBubbles({ now: clock.now, fontsReady: true });
    window.npcWorldBubbles = bubbles;
    return { bubbles, clock };
}

function barkSystem() {
    document.body.innerHTML = '';
    const sys = new NPCBarkSystem({
        getNPC: (id) => ({ id, displayName: id[0].toUpperCase() + id.slice(1), npcType: 'person' }),
        getConversationHistory: () => []
    });
    sys.init();
    sys.beeps = 0;
    sys.playBarkSound = () => { sys.beeps++; };
    return sys;
}

/**
 * A stand-in TTSManager for one NPC: play() starts its audio and resolves with `duration` (NaN for a
 * clip whose metadata gives no length); end() finishes it; stop() pauses it as the real one does.
 */
function fakeVoice(sys, npcId, { duration = 6000 } = {}) {
    const audio = new EventTarget();
    audio.paused = true; audio.ended = false;
    const m = {
        audio, playing: false, currentText: null, plays: [], stops: 0,
        async play(id, text) {
            m.plays.push(text); m.currentText = text; m.playing = true; audio.paused = false; audio.ended = false;
            return duration > 0 ? Math.ceil(duration) : Math.ceil(duration);   // NaN stays NaN, as tts-manager.js:101
        },
        stop() {
            m.stops++; m.currentText = null;
            if (m.playing) { m.playing = false; audio.paused = true; audio.dispatchEvent(new Event('pause')); }
        },
        end() {
            m.playing = false; audio.paused = true; audio.ended = true;
            audio.dispatchEvent(new Event('pause')); audio.dispatchEvent(new Event('ended'));
        }
    };
    sys.ttsManagers.set(npcId, m);
    return m;
}

const toasts = () => [...document.querySelectorAll('.npc-bark .npc-bark-text')].map(e => e.textContent);
// Real timers for the tests' own waits, even while a test scales the global setTimeout
const realTimer = globalThis.setTimeout;
const tick = () => new Promise((r) => realTimer(r, 0));
const wait = (ms) => new Promise((r) => realTimer(r, ms));

// ---- item 4: a NaN clip length while the clip plays ----

test('item 4: a clip whose length reads NaN while it plays is reported as playing (Infinity), with no beep', async () => {
    const sys = barkSystem();
    const v = fakeVoice(sys, 'ravi', { duration: NaN });
    const ms = await sys._speakBark('ravi', 'The network has gone down.');
    assert.equal(ms, Infinity, 'playing, length unknown');
    assert.equal(sys.beeps, 0, 'no phone beep over a voice that is playing');
    v.end();
    // No voice at all (a 503, no TTS) is still null, with the beep
    const silent = fakeVoice(sys, 'helen', { duration: NaN });
    silent.play = async () => null;
    assert.equal(await sys._speakBark('helen', 'Isolated.'), null);
    assert.equal(sys.beeps, 1);
});

test('item 4: a held bark waits for the end of a NaN-length voice instead of talking over it', async () => {
    rig();
    window.npcWorldBubbles = null;                       // toasts only: the release path on its own
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: NaN });
    const helen = fakeVoice(sys, 'helen', { duration: 40 });
    const realSetTimeout = globalThis.setTimeout;
    // The 2.5 s gap and 0.3 s pause run 100 times faster; the order is what is tested
    globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, Number.isFinite(ms) ? ms / 100 : ms, ...a);
    try {
        window.currentConversationMinigameType = 'person-chat';
        sys.showBark({ npcId: 'ravi', npcName: 'Ravi', text: 'The network has gone down.', useTTS: true });
        sys.showBark({ npcId: 'helen', npcName: 'Helen', text: 'Isolated. Good.', useTTS: true });
        window.currentConversationMinigameType = null;
        const drained = sys.drainDeferredBarks();
        await wait(80);                                   // well past the scaled 2.5 s gap
        assert.deepEqual(ravi.plays, ['The network has gone down.']);
        assert.deepEqual(helen.plays, [], 'Helen waits while Ravi is still speaking');
        ravi.end();
        await wait(20);
        assert.deepEqual(helen.plays, ['Isolated. Good.'], 'Helen speaks once Ravi has finished');
        helen.end();
        await drained;
    } finally { globalThis.setTimeout = realSetTimeout; window.currentConversationMinigameType = null; }
});

// ---- item 3: the bubble lasts as long as its voice ----

test('item 3: a bubble keeps its last line page up while the voice plays, then ends', () => {
    const r = rig();
    let live = true;
    const h = r.bubbles.say('ravi', LONG, { voiceLive: () => live });
    const st = h.state;
    r.bubbles.update();
    const total = st.times.reduce((a, b) => a + b, 0);
    r.clock.advance(total + 5000);                        // every page's time and more
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), true, 'still up while the voice plays');
    assert.equal(st.page, st.pages.length - 1, 'on the last page');
    assert.ok(r.bubbles.log.some(e => e.event === 'voice-hold'));
    live = false;
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), false, 'ends with the voice');
    assert.equal(r.bubbles.log.at(-1).event, 'done');
});

test('item 3: the voice hold is capped (VOICE_HOLD_CAP_MS from the start of the line)', () => {
    const r = rig();
    r.bubbles.say('ravi', 'Short line.', { voiceLive: () => true });
    r.bubbles.update();
    r.clock.advance(VOICE_HOLD_CAP_MS - 1);
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), true);
    r.clock.advance(2);
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), false);
});

test('item 3: _renderBark wires the voice to the bubble: a NaN-length voice holds the last page', async () => {
    const r = rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: NaN });
    await sys._renderBark({ npcId: 'ravi', npcName: 'Ravi', message: LONG, useTTS: true });
    await tick();
    const st = r.bubbles.says.get('ravi');
    assert.equal(st.audioMs, null, 'no length to re-time to');
    r.bubbles.update();
    r.clock.advance(60000 > VOICE_HOLD_CAP_MS ? VOICE_HOLD_CAP_MS - 10 : 60000);
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), true, 'up while he speaks');
    ravi.end();
    r.bubbles.update();
    assert.equal(r.bubbles.hasLine('ravi'), false);
    assert.deepEqual(toasts(), [], 'no toast');
});

test('item 3: a bubble that loses its place mid-release shows the rest at once, not behind its own voice', async () => {
    const r = rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: 6000 });
    sys.isDrainingDeferred = true;                        // Ravi's line is the held bark now playing
    await sys._renderBark({ npcId: 'ravi', npcName: 'Ravi', message: 'The network has gone down.', useTTS: true });
    await tick();
    r.bubbles._hudRects = () => [{ x: -1000, y: -1000, w: 3000, h: 3000, hud: true }];   // the info label
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('ravi'), false);
    assert.ok(r.bubbles.log.some(e => e.event === 'no-room'));
    assert.deepEqual(toasts(), ['Ravi: The network has gone down.'], 'shown while he speaks');
    assert.equal(sys.deferredBarkQueue.length, 0, 'not queued behind his voice');
    assert.equal(document.querySelector('.npc-bark')._voiceHold, true, 'and stays while he speaks');
    ravi.end();
    clearTimeout(document.querySelector('.npc-bark')._autoCloseTimer);
    sys.isDrainingDeferred = false;
});

test('item 3: a continuation toast stays while the voice plays, then keeps the rest of its reading time', async () => {
    rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: 6000 });
    await ravi.play('ravi', 'The network has gone down.');
    sys._toastRemainder({ npcId: 'ravi', npcName: 'Ravi', text: 'The network has gone down.', useTTS: true }, 'The network has gone down.');
    await tick();
    const el = document.querySelector('.npc-bark');
    assert.ok(el, 'toast up');
    assert.equal(el._voiceHold, true, 'held for the voice');
    // Its auto-close timer is not running: past its whole reading time it is still there
    el._shownAt -= 60000;
    sys._resumeAutoClose(el);                             // a hover ending must not restart it either
    await tick();
    assert.ok(el.isConnected && !el._removing, 'still up while the voice plays');
    ravi.end();
    assert.equal(el._voiceHold, false);
    assert.equal(el._autoCloseRemaining, BARK_RESUME_MIN_MS, 'reading time used up: the minimum after the voice');
    clearTimeout(el._autoCloseTimer);
});

test('item 3: a voiced toast is held for its own voice too', async () => {
    rig();
    window.npcWorldBubbles = null;
    const sys = barkSystem();
    const helen = fakeVoice(sys, 'helen', { duration: 3000 });
    await sys._renderBark({ npcId: 'helen', npcName: 'Helen', message: 'Isolated. Good.', useTTS: true });
    await tick();
    const el = document.querySelector('.npc-bark');
    assert.equal(el._voiceHold, true);
    helen.end();
    assert.equal(el._voiceHold, false);
    clearTimeout(el._autoCloseTimer);
});

// ---- item 2: a panel reopened over a speaking bubble ----

test('item 2: a panel opening over a speaking bubble stops the voice and holds the whole line, voiced, first in line', async () => {
    const r = rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: 6000 });
    const payload = { npcId: 'ravi', npcName: 'Ravi', message: LONG, useTTS: true };
    sys.deferredBarkQueue.push({ npcId: 'helen', npcName: 'Helen', text: 'Already waiting.', useTTS: true });
    await sys._renderBark(payload);
    await tick();
    r.bubbles.update();
    const map = { _sceneType: 'network-segmentation-map' };
    window.MinigameFramework.currentMinigame = map;       // the player reopens the map
    window.MinigameFramework.holdsBarks = () => true;
    r.bubbles.update();
    await tick();
    assert.equal(r.bubbles.hasLine('ravi'), false);
    assert.equal(ravi.stops, 1, 'his voice stops with the bubble');
    assert.equal(ravi.audio.paused, true);
    assert.deepEqual(toasts(), [], 'nothing over the panel');
    assert.equal(sys.deferredBarkQueue[0], payload, 'the whole line, as it was, first in line');
    assert.equal(sys.deferredBarkQueue[0].useTTS, true, 'with its voice');
    assert.equal(sys.deferredBarkQueue[0].forceToast, undefined);
    assert.equal(sys.deferredBarkQueue.length, 2);
    // The panel closes: his line plays again, voiced, before Helen's
    window.MinigameFramework.currentMinigame = null;
    delete window.MinigameFramework.holdsBarks;
    const helen = fakeVoice(sys, 'helen', { duration: 10 });
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, Number.isFinite(ms) ? ms / 100 : ms, ...a);
    try {
        const drained = sys.drainDeferredBarks();
        await tick();
        assert.deepEqual(ravi.plays, [LONG, LONG], 'voiced again');
        assert.equal(r.bubbles.hasLine('ravi'), true, 'in his bubble');
        assert.deepEqual(helen.plays, [], 'Helen waits for him');
        ravi.end();
        await wait(60);
        assert.deepEqual(helen.plays, ['Already waiting.'], 'then Helen');
        helen.end();
        await drained;
    } finally { globalThis.setTimeout = realSetTimeout; }
});

test('item 2: a voice still loading when the panel opens is stopped as soon as it starts', async () => {
    const r = rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: 6000 });
    let start;
    const realPlay = ravi.play;
    ravi.play = (id, text) => new Promise(res => { start = () => res(realPlay(id, text)); });
    const payload = { npcId: 'ravi', npcName: 'Ravi', message: 'The network has gone down.', useTTS: true };
    const rendered = sys._renderBark(payload);
    r.bubbles.update();
    window.MinigameFramework.currentMinigame = { _sceneType: 'network-segmentation-map' };
    window.MinigameFramework.holdsBarks = () => true;
    r.bubbles.update();
    assert.equal(sys.deferredBarkQueue[0], payload);
    start();
    await rendered;
    await tick();
    assert.equal(ravi.audio.paused, true, 'stopped once it started');
    assert.equal(ravi.stops, 1);
    window.MinigameFramework.currentMinigame = null;
    delete window.MinigameFramework.holdsBarks;
    sys.deferredBarkQueue.length = 0;
});

test('item 2: a panel opening after the voice has ended still holds the silent rest of the bubble (unchanged)', async () => {
    const r = rig();
    const sys = barkSystem();
    const ravi = fakeVoice(sys, 'ravi', { duration: 3000 });
    await sys._renderBark({ npcId: 'ravi', npcName: 'Ravi', message: LONG, useTTS: true });
    await tick();
    r.bubbles.update();
    ravi.end();
    window.MinigameFramework.currentMinigame = { _sceneType: 'pin' };
    window.MinigameFramework.holdsBarks = () => true;
    r.bubbles.update();
    assert.equal(ravi.stops, 0);
    assert.equal(sys.deferredBarkQueue.length, 1);
    assert.equal(sys.deferredBarkQueue[0].forceToast, true);
    assert.equal(sys.deferredBarkQueue[0].useTTS, false, 'the rest is not voiced again');
    assert.equal(ravi.plays.length, 1);
    window.MinigameFramework.currentMinigame = null;
    delete window.MinigameFramework.holdsBarks;
});

test('onRemainder is told why the bubble ended (left-view, no-room, pushed)', () => {
    const r = rig();
    const got = [];
    r.bubbles.say('ravi', LONG, { onRemainder: (rest, info) => got.push(info) });
    r.bubbles.update();
    window.currentPlayerRoom = 'lobby';
    r.bubbles.update();
    assert.deepEqual(got, [{ why: 'left-view', page: 0 }]);
    assert.equal(pagesText(['a']), 'a');
});
