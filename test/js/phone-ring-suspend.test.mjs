import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { makeWorld, jsRoot } from './phone-ring-harness.mjs';

// A3 review round 1, m5 (A2c R3 m1): while an ending's conclude is pending, the ringer is suspended:
// nothing starts ringing and nothing opens, offers stay as they are, and the tick keeps running.
const npc = { id: 'caller', displayName: 'Caller One' };
const cfg = { handlerIndex: 0, knot: 'ring_call', conversationMode: 'phone-chat', ring: true, once: true, cooldown: 0 };
const events = (w, prefix) => w.dispatcher.emitted.filter(([n]) => n.startsWith(prefix)).map(([n]) => n);

test('suspend: a queued offer does not start ringing, and rings once the suspension is lifted', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.ringer.suspend(true);
        w.nm._handleEventMapping('caller', 'room_entered', cfg, {});
        await w.advance(1500);
        assert.equal(w.ringer.stateOf('caller'), 'queued');
        assert.equal(w.banner(), null);
        w.ringer.suspend(false);
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        assert.ok(w.banner());
    } finally { w.restore(); }
});

test('suspend: a ringing offer answered during the suspension is held, does not open, and opens after', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.nm._handleEventMapping('caller', 'room_entered', cfg, {});
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'ringing');
        w.ringer.suspend(true);
        w.click('.incoming-call-answer');
        await w.advance(2000);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        assert.equal(w.calls.started.filter((s) => s.params.ringerCall).length, 0, 'no call over the credits');
        w.ringer.suspend(false);
        await w.advance(1500);
        assert.equal(w.calls.started.filter((s) => s.params.ringerCall).length, 1);
    } finally { w.restore(); }
});

test('suspend: an offer held before the suspension does not open during it', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.fw.currentMinigame = { _sceneType: 'lockpicking', params: {}, _ending: false };   // a minigame: Answer holds
        w.nm._handleEventMapping('caller', 'room_entered', cfg, {});
        await w.advance(300);
        w.click('.incoming-call-answer');
        await w.advance(300);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        w.ringer.suspend(true);
        w.fw.endMinigame(false);                      // the way is clear, but the ending is pending
        await w.advance(2000);
        assert.equal(w.calls.started.filter((s) => s.params.ringerCall).length, 0);
        assert.equal(w.ringer.stateOf('caller'), 'held');
        w.ringer.suspend(false);
        await w.advance(1500);
        assert.equal(w.calls.started.filter((s) => s.params.ringerCall).length, 1);
    } finally { w.restore(); }
});

test('suspend then close (the server agreed): the queued offer is removed with no events', async () => {
    const w = makeWorld({ npcs: [npc] });
    try {
        w.ringer.suspend(true);
        w.nm._handleEventMapping('caller', 'room_entered', cfg, {});
        await w.advance(500);
        w.ringer.close();
        await w.advance(500);
        assert.equal(w.ringer.stateOf('caller'), null);
        assert.deepEqual(events(w, 'phone_call_'), []);
    } finally { w.restore(); }
});

// ---- playEntry: suspend before the conclude request, lift on a refusal, nothing more on agreement ----

function loadMusicEvents() {
    const dir = mkdtempSync(join(tmpdir(), 'music-events-suspend-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    const stub = (name, body) => writeFileSync(join(dir, name), body);
    stub('music-controller.js', 'export default { playTrack() {}, switchPlaylist() {}, stopAfterCurrentTrack() {}, startDefault() {}, getState() { return {}; }, isLeader: false, context: null };');
    stub('closing-sequence.js', 'export const buildEndSequence = () => [{ text: "END" }]; export const replayEndingEntry = () => null;');
    stub('ending-audio.js', 'export const playEndingMusic = () => null; export const whenEndingAudible = () => ({ ready: Promise.resolve() });');
    stub('music-config.js', 'export const MUSIC_CONFIG = {};');
    stub('conclude-mission.js', 'export const concludeWithRetry = (id) => globalThis.__concludeCall(id); export const offlineEndingOptions = (o) => o; export const queueConcludeRetry = () => {};');
    writeFileSync(join(dir, 'scenario-music-events.js'), readFileSync(join(jsRoot, 'music/scenario-music-events.js'), 'utf8'));
    return import(pathToFileURL(join(dir, 'scenario-music-events.js')).href);
}

async function playEnding(result) {
    const { initScenarioMusicEvents } = await loadMusicEvents();
    const log = [];
    let resolve;
    globalThis.__concludeCall = () => { log.push('conclude requested'); return new Promise((r) => { resolve = r; }); };
    const handlers = new Map();
    globalThis.window = Object.assign(globalThis.window || {}, {
        eventDispatcher: { on: (n, f) => handlers.set(n, f), off() {}, emit() {} },
        gameState: { globalVariables: {} },
        breakEscapeConfig: { gameId: 7 },
        stateSync: { sync: async () => {} },
        BondVisualiser: { open: () => log.push('credits'), setAutoOpenSuppressed() {} },
        phoneRinger: { suspend: (on) => log.push(`suspend:${on}`), close: () => log.push('close') },
        addEventListener() {}, removeEventListener() {},
        gameAlert: () => log.push('alert'),
    });
    initScenarioMusicEvents({ music: { events: [{ trigger: 'end_now', playlist: 'victory', credits: [{ text: 'END' }] }] } });
    handlers.get('end_now')({});
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    log.push('(pending)');
    resolve(result);
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    return log;
}

test('playEntry: the ringer is suspended before the conclude request and stays so while it is pending', async () => {
    const log = await playEnding({ concluded: true, missing: [] });
    assert.ok(log.indexOf('suspend:true') >= 0 && log.indexOf('suspend:true') < log.indexOf('conclude requested'), log.join(' | '));
    assert.ok(log.indexOf('conclude requested') < log.indexOf('(pending)'));
    assert.ok(!log.slice(0, log.indexOf('(pending)')).includes('suspend:false'), 'not lifted while pending');
});

test('playEntry: agreement closes the ringer and opens the credits, with no lift', async () => {
    const log = await playEnding({ concluded: true, missing: [] });
    const after = log.slice(log.indexOf('(pending)'));
    assert.deepEqual(after.filter((x) => x === 'close' || x === 'credits'), ['close', 'credits']);
    assert.ok(!log.includes('suspend:false'));
});

test('playEntry: a refusal lifts the suspension so calls ring again, and the ringer is not closed', async () => {
    const log = await playEnding({ concluded: false, missing: ['x'] });
    const after = log.slice(log.indexOf('(pending)'));
    assert.ok(after.includes('suspend:false'), log.join(' | '));
    assert.ok(!log.includes('close') && !log.includes('credits'));
});
