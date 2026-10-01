// eventMapping handler state across a reload, and KO'd NPCs not opening scenes.
// Run with: node test/js/npc-manager-triggers.test.mjs   (no dependencies; exits non-zero on failure)
//
// npc-manager.js is browser ES module source with a relative import, and the repo
// has no "type": "module" package.json, so it and npc-los.js are copied to a temp
// dir as .mjs and imported from there.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-manager-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function makeManager() {
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('val', { id: 'val', npcType: 'person', currentKnot: 'start' });
    return m;
}

function withMinigames(fn) {
    const started = [];
    window.MinigameFramework = { currentMinigame: null, startMinigame: (...a) => started.push(a), endMinigame() {} };
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (cb) => { cb(); return 0; };   // run the 500ms scene delay now
    try { fn(started); } finally {
        globalThis.setTimeout = realSetTimeout;
        delete window.MinigameFramework;
        delete window.npcHostileSystem;
    }
}

const scene = { handlerIndex: 1, once: true, knot: 'server_room_challenge', conversationMode: 'person-chat', cooldown: 0 };

test('a completed onceOnly scene is saved and does not fire again after a reload', () => {
    const before = makeManager();
    withMinigames(started => {
        before._handleEventMapping('val', 'room_entered:server_room', scene, {});
        assert.equal(started.length, 1);
        // In-session dedup is immediate: a second trigger before the close is ignored
        before._handleEventMapping('val', 'room_entered:server_room', scene, {});
        assert.equal(started.length, 1);
    });
    assert.deepEqual(before.exportTriggeredEvents(), {}, 'not saved while the scene is still open');

    before.eventDispatcher.emit('conversation_closed:val', { npcId: 'val' });
    const saved = JSON.parse(JSON.stringify(before.exportTriggeredEvents()));
    assert.deepEqual(saved, { 'val:room_entered:server_room:1': 1 });

    // Page reload: fresh manager, restored before any event
    const after = makeManager();
    after.restoreTriggeredEvents(saved);
    withMinigames(started => {
        after._handleEventMapping('val', 'room_entered:server_room', scene, {});
        assert.equal(started.length, 0, 'the one-shot cutscene must not replay');
    });
});

test('a onceOnly scene interrupted by a reload fires again', () => {
    const before = makeManager();
    withMinigames(() => before._handleEventMapping('val', 'room_entered:server_room', scene, {}));
    // Reload before conversation_closed: whatever was synced has no entry for it
    const saved = JSON.parse(JSON.stringify(before.exportTriggeredEvents()));

    const after = makeManager();
    after.restoreTriggeredEvents(saved);
    withMinigames(started => {
        after._handleEventMapping('val', 'room_entered:server_room', scene, {});
        assert.equal(started.length, 1, 'the scene the player never finished plays again');
    });
});

test('a closing conversation with another NPC does not save the scene', () => {
    const m = makeManager();
    withMinigames(() => m._handleEventMapping('val', 'room_entered:server_room', scene, {}));
    m.eventDispatcher.emit('conversation_closed:someone_else', {});
    assert.deepEqual(m.exportTriggeredEvents(), {});
});

test('a onceOnly handler that opens no conversation is saved as soon as it fires', () => {
    const m = makeManager();
    withMinigames(() => m._handleEventMapping('val', 'item_picked_up:badge',
        { handlerIndex: 2, once: true, cooldown: 0, setGlobal: { badge_seen: true } }, {}));
    assert.deepEqual(m.exportTriggeredEvents(), { 'val:item_picked_up:badge:2': 1 });
});

test('handlers without onceOnly or maxTriggers are not exported', () => {
    const m = makeManager();
    withMinigames(() => {
        m._handleEventMapping('val', 'room_entered:lobby', { handlerIndex: 0, cooldown: 0, setGlobal: { x: 1 } }, {});
    });
    assert.deepEqual(m.exportTriggeredEvents(), {});
});

test('restore keeps the larger count and ignores junk', () => {
    const m = makeManager();
    m.restoreTriggeredEvents({ 'val:a:0': 2, 'val:b:0': 0, 'val:c:0': 'x' });
    m.restoreTriggeredEvents({ 'val:a:0': 1 });
    assert.deepEqual(m.exportTriggeredEvents(), { 'val:a:0': 2 });
});

test('a KO\'d NPC does not open its scene, but the handler\'s other actions run', () => {
    const m = makeManager();
    window.gameState.globalVariables = {};
    withMinigames(started => {
        window.npcHostileSystem = { isNPCKO: id => id === 'val' };
        m._handleEventMapping('val', 'room_entered:server_room',
            { ...scene, setGlobal: { val_scene_seen: true } }, {});
        assert.equal(started.length, 0);
        assert.equal(window.gameState.globalVariables.val_scene_seen, true);
    });
});

test('the NPC\'s own KO event still opens its scene (m01 Derek, m05 Torres)', () => {
    const m = makeManager();
    withMinigames(started => {
        window.npcHostileSystem = { isNPCKO: () => true };
        m._handleEventMapping('val', 'npc_ko:val', { ...scene, knot: 'fight_outcome' }, { npcId: 'val' });
        assert.equal(started.length, 1);
        assert.equal(started[0][2].startKnot, 'fight_outcome');
    });
});

// E11: an eventMapping's sendTimedMessage.delay counts from the event, not from game start.
// Elapsed game time is simulated by moving gameStartTime back rather than waiting.
test('a mapping\'s sendTimedMessage arrives its delay after the event, mid-mission', () => {
    const m = makeManager();
    m.npcs.set('hax', { id: 'hax', npcType: 'phone', phoneId: 'player_phone', currentKnot: 'hub' });
    m.gameStartTime = Date.now() - 600000;              // ten minutes into the mission
    const texts = () => m.getConversationHistory('hax').filter(h => h.timed).map(h => h.text);

    m._handleEventMapping('hax', 'item_picked_up:keycard',
        { handlerIndex: 0, cooldown: 0, sendTimedMessage: { delay: 8000, message: 'Got the card?' } }, {});
    m._checkTimedMessages();
    assert.deepEqual(texts(), [], 'must not fire on the next tick');

    m.gameStartTime -= 7000;                            // 7 s later
    m._checkTimedMessages();
    assert.deepEqual(texts(), []);

    m.gameStartTime -= 1000;                            // 8 s after the event
    m._checkTimedMessages();
    assert.deepEqual(texts(), ['Got the card?']);
});

test('NPC timedMessages with a plain delay still count from game start', () => {
    const m = makeManager();
    m.scheduleTimedMessage({ npcId: 'val', text: 'Welcome.', delay: 3000 });
    assert.equal(m.timedMessages[0].triggerTime, 3000);
});
