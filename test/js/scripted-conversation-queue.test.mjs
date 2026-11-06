// F25: scripted conversations of different kinds due at the same moment. An event
// mapping's person-chat or video call ended whatever minigame was open and opened
// 500 ms later; a timedConversation opened at once. So a phone call and a person-chat
// (or a person-chat and a timedConversation) due together ended each other, and the
// displaced one was lost for good: its onceOnly trigger persisted on the close and its
// deferred globals were already cleared. The phone-call queue (93ed7976e,
// phone-call-queue.test.mjs) now takes every scripted conversation, so they open one
// at a time, in order.
// Run with: node --test test/js/scripted-conversation-queue.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

// The engine logs emoji-heavy lines; quiet them (bin/test-js: runner IPC mis-framing)
console.log = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'scripted-conversation-queue-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

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

// MinigameFramework as the real one where it matters: startMinigame ends whatever is
// running (cleanup only, no complete()) and opens the new one.
function makeFramework(dispatcher) {
    return {
        currentMinigame: null,
        opened: [],      // "<scene>:<npcId>" of each conversation opened, in order
        displaced: [],   // the same for each conversation ended by another opening over it
        startMinigame(type, container, params) {
            if (this.currentMinigame && !this.currentMinigame._ending) {
                const cur = this.currentMinigame;
                if (cur.params?.npcId) this.displaced.push(`${cur.type}:${cur.params.npcId}`);
                this.endMinigame(false, null);
            }
            const mg = { type, params, _ending: false };
            this.currentMinigame = mg;
            if (params?.npcId) this.opened.push(`${type}:${params.npcId}`);
            return mg;
        },
        endMinigame() {
            const m = this.currentMinigame;
            if (!m) return;
            m._ending = true;
            this.currentMinigame = null;
            // person-chat and phone-chat cleanup() emit this (persistOnClose listens)
            if (m.params?.npcId) dispatcher.emit(`conversation_closed:${m.params.npcId}`, { npcId: m.params.npcId });
        },
        close() { this.endMinigame(false, null); }   // the player finishes the conversation
    };
}

function setup() {
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    const dispatcher = makeDispatcher();
    const fw = makeFramework(dispatcher);
    window.MinigameFramework = fw;
    window.gameState = { globalVariables: {} };
    const m = new NPCManager(dispatcher, null);
    m.npcs.set('agent_0x99', { id: 'agent_0x99', npcType: 'phone', displayName: 'Agent HaX', phoneId: 'player_phone', currentKnot: 'start' });
    m.npcs.set('victoria', { id: 'victoria', npcType: 'person', displayName: 'Victoria Sterling', currentKnot: 'start' });
    m.npcs.set('marcus', { id: 'marcus', npcType: 'person', displayName: 'Marcus', currentKnot: 'start' });
    m.npcs.set('ghost', { id: 'ghost', npcType: 'phone', displayName: 'Ghost', phoneId: 'player_phone', currentKnot: 'start' });
    const runDue = () => {
        const due = timers.filter(t => t.live);
        due.forEach(t => { t.live = false; t.cb(); });
        return due.length;
    };
    const runAll = (max = 20) => { for (let i = 0; i < max && runDue(); i++); };
    const restore = () => {
        globalThis.setTimeout = realSet; globalThis.clearTimeout = realClear;
        delete window.MinigameFramework;
    };
    return { m, fw, timers, runDue, runAll, restore };
}

const fire = (m, npcId, mode, knot) => m._handleEventMapping(npcId, 'game_loaded',
    { conversationMode: mode, targetKnot: knot, once: true, cooldown: 0, handlerIndex: knot }, {});

function timed(m, npcId, knot, extra = {}) {
    m.scheduleTimedConversation({ npcId, targetKnot: knot, delay: 0, ...extra });
    const conv = m.timedConversations[m.timedConversations.length - 1];
    conv.delivered = true;
    m._deliverTimedConversation(conv);
    return conv;
}

test('a phone call and a person-chat due together: both delivered, in order, neither displaced', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'phone-chat', 'gallery_call');
        fire(t.m, 'victoria', 'person-chat', 'confront');      // same release, ~150 ms later
        t.runDue();
        assert.deepEqual(t.fw.opened, ['phone-chat:agent_0x99'], 'the call opens first');
        t.runAll(5);
        assert.deepEqual(t.fw.displaced, [], 'nothing opened over the call');
        assert.deepEqual(Object.keys(t.m.exportTriggeredEvents()), [], 'no onceOnly trigger saved before its scene closes');
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['phone-chat:agent_0x99', 'person-chat:victoria']);
        assert.equal(t.fw.currentMinigame.params.startKnot, 'confront');
        t.fw.close();
        assert.deepEqual(t.fw.displaced, []);
        assert.equal(Object.keys(t.m.exportTriggeredEvents()).length, 2, 'both onceOnly triggers saved once played');
    } finally { t.restore(); }
});

test('a person-chat then a phone call due together: the call waits for the person-chat', () => {
    const t = setup();
    try {
        fire(t.m, 'victoria', 'person-chat', 'confront');
        fire(t.m, 'agent_0x99', 'phone-chat', 'gallery_call');
        t.runAll(5);
        assert.deepEqual(t.fw.opened, ['person-chat:victoria']);
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['person-chat:victoria', 'phone-chat:agent_0x99']);
        assert.deepEqual(t.fw.displaced, []);
    } finally { t.restore(); }
});

test('a person-chat and a timed conversation due together: both delivered, in order', () => {
    const t = setup();
    try {
        fire(t.m, 'victoria', 'person-chat', 'confront');
        timed(t.m, 'marcus', 'briefing', { setGlobalOnStart: 'briefing_played' });
        assert.equal(window.gameState.globalVariables.briefing_played, undefined,
            'the queued briefing has not started, so a reload now still plays it');
        assert.equal(t.m.hasPendingOpeningConversation(), true, 'the brief popup waits for the queued scene');
        t.runAll(5);
        assert.deepEqual(t.fw.opened, ['person-chat:victoria'], 'the timed conversation does not open over it');
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['person-chat:victoria', 'person-chat:marcus']);
        assert.equal(t.m.getNPC('marcus').currentKnot, 'briefing');
        assert.equal(window.gameState.globalVariables.briefing_played, true);
        assert.deepEqual(t.fw.displaced, []);
    } finally { t.restore(); }
});

test('a timed conversation then a person-chat mapping: the mapping waits for it', () => {
    const t = setup();
    try {
        timed(t.m, 'marcus', 'briefing');
        assert.deepEqual(t.fw.opened, ['person-chat:marcus'], 'opens at once, as before');
        fire(t.m, 'victoria', 'person-chat', 'confront');
        t.runAll(5);
        assert.deepEqual(t.fw.opened, ['person-chat:marcus']);
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['person-chat:marcus', 'person-chat:victoria']);
        assert.deepEqual(t.fw.displaced, []);
    } finally { t.restore(); }
});

test('three conversations in a row (phone, person-chat, video call) open one after the other', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'phone-chat', 'a');
        fire(t.m, 'victoria', 'person-chat', 'b');
        fire(t.m, 'ghost', 'video-call', 'c');
        for (let i = 0; i < 3; i++) { t.runAll(5); t.fw.close(); }
        t.runAll();
        assert.deepEqual(t.fw.opened, ['phone-chat:agent_0x99', 'person-chat:victoria', 'person-chat:ghost']);
        assert.deepEqual(t.fw.displaced, []);
    } finally { t.restore(); }
});

test('a queued timed conversation whose skip guard is set meanwhile does not open', () => {
    const t = setup();
    try {
        fire(t.m, 'victoria', 'person-chat', 'confront');
        timed(t.m, 'marcus', 'briefing', { skipIfGlobal: 'briefing_played' });
        t.runDue();
        window.gameState.globalVariables.briefing_played = true;
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['person-chat:victoria']);
        assert.equal(t.m._scriptedCallQueue.length, 0);
    } finally { t.restore(); }
});

test('single person-chat: unchanged, it closes the open minigame and opens after the start delay', () => {
    const t = setup();
    try {
        t.fw.startMinigame('lockpicking', null, {});
        fire(t.m, 'victoria', 'person-chat', 'caught');
        assert.equal(t.fw.currentMinigame, null, 'the lockpick closed at once, as before');
        assert.deepEqual(t.timers.filter(x => x.live).map(x => x.ms), [500]);
        t.runDue();
        assert.deepEqual(t.fw.opened, ['person-chat:victoria']);
        const p = t.fw.currentMinigame.params;
        assert.equal(p.startKnot, 'caught');
        assert.equal(p.disableClose, false);
        assert.equal(p.videoCall, undefined);
        assert.equal(t.timers.filter(x => x.live).length, 0, 'nothing left polling');
    } finally { t.restore(); }
});

test('single video call: unchanged, it closes the open minigame and opens after the start delay', () => {
    const t = setup();
    try {
        t.fw.startMinigame('notes', null, {});
        t.m._handleEventMapping('ghost', 'game_loaded', { conversationMode: 'video-call', targetKnot: 'v', disableClose: true, cooldown: 0, handlerIndex: 0 }, {});
        assert.equal(t.fw.currentMinigame, null);
        assert.deepEqual(t.timers.filter(x => x.live).map(x => x.ms), [500]);
        t.runDue();
        const p = t.fw.currentMinigame.params;
        assert.deepEqual([t.fw.currentMinigame.type, p.npcId, p.startKnot, p.videoCall, p.disableClose],
            ['person-chat', 'ghost', 'v', true, true]);
    } finally { t.restore(); }
});

test('single timed conversation: unchanged, it opens at once over a player-opened minigame', () => {
    const t = setup();
    try {
        t.fw.startMinigame('notes', null, {});
        timed(t.m, 'marcus', 'briefing', { setGlobalOnStart: 'briefing_played', disableClose: true, background: 'bg.png' });
        assert.deepEqual(t.fw.opened, ['person-chat:marcus']);
        assert.equal(t.timers.filter(x => x.live).length, 0, 'no delay, no polling');
        const p = t.fw.currentMinigame.params;
        assert.deepEqual([p.disableClose, p.background, p.title], [true, 'bg.png', 'Marcus']);
        assert.equal(window.gameState.globalVariables.briefing_played, true);
        assert.equal(t.m.getNPC('marcus').currentKnot, 'briefing');
    } finally { t.restore(); }
});

test('a scripted conversation after the last one closed goes as a single one (no queue)', () => {
    const t = setup();
    try {
        fire(t.m, 'victoria', 'person-chat', 'a');
        t.runDue();
        t.fw.close();
        t.fw.startMinigame('notes', null, {});        // a player-opened minigame
        fire(t.m, 'agent_0x99', 'phone-chat', 'b');
        assert.equal(t.fw.currentMinigame, null, 'closes the open minigame, as before');
        t.runDue();
        assert.deepEqual(t.fw.opened, ['person-chat:victoria', 'phone-chat:agent_0x99']);
    } finally { t.restore(); }
});

// ── The person-chat side: displaced while its story was still loading ──
// startMinigame's endMinigame runs cleanup() only, not complete(). Before the fix
// isActive stayed true and startConversation() went on after `await loadStory`:
// it began a social run cleanup had already ended, set isConversationActive and drew
// the first line on the torn-down UI.

const pcSrc = readFileSync(join(here, '../../public/break_escape/js/minigames/person-chat/person-chat-minigame.js'), 'utf8');

function pcMethod(name, isAsync, freeNames) {
    const re = new RegExp(`\\n    ${isAsync ? 'async ' : ''}${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`);
    const m = pcSrc.match(re);
    assert.ok(m, `${name} found`);
    const body = m[2].replace('super.cleanup();', 'this._superCleanup();');
    return new Function(...freeNames, `return ${isAsync ? 'async ' : ''}function (${m[1]}) {\n${body}\n};`);
}

test('person-chat displaced while its story loads: startConversation stops, nothing drawn on the torn-down UI', async () => {
    const prevWindow = globalThis.window;
    globalThis.window = {};
    try {
        let resolveLoad;
        const calls = [];
        class FakeConversation {
            constructor() { this.storyEnded = false; }
            loadStory() { return new Promise(r => { resolveLoad = r; }); }
            goToKnot(k) { calls.push(`goToKnot:${k}`); return true; }
        }
        const stateManager = {
            restoreNPCState() { return false; }, syncGlobalVariablesToStory() {}, syncInventoryVariablesToStory() {},
            applyEngineVariables() {}, saveNPCState() { calls.push('save'); }
        };
        const startConversation = pcMethod('startConversation', true,
            ['PhoneChatConversation', 'startEventConversation', 'npcConversationStateManager', 'attachPretext'])(
            FakeConversation, () => calls.push('startEvent'), stateManager, async () => {});
        const cleanup = pcMethod('cleanup', false, ['npcConversationStateManager'])(stateManager);
        const mg = {
            npcId: 'victoria', npc: { storyJSON: {} }, startKnot: 'confront', params: {},
            inkEngine: { story: { currentChoices: [] } },
            gameState: { isActive: true },          // start() ran: super.start() set it
            ui: {
                hideChoices() { calls.push('hideChoices'); },
                destroy() { calls.push('ui.destroy'); }
            },
            _beginSocialRun() { calls.push('beginSocialRun'); },
            _endSocialRun() { calls.push('endSocialRun'); },
            _flushPendingReply() {}, _dropPageHideHook() {},
            _superCleanup() {},
            showCurrentDialogue() { calls.push('showCurrentDialogue'); },
            showError(msg) { calls.push(`showError:${msg}`); }
        };
        const started = startConversation.call(mg);
        // MinigameFramework.startMinigame for the next scene: endMinigame -> cleanup()
        mg._ending = true;
        cleanup.call(mg);
        assert.equal(mg.gameState.isActive, false, 'cleanup leaves the conversation inactive');
        resolveLoad(true);
        await started;
        const after = calls.slice(calls.indexOf('ui.destroy') + 1);
        assert.deepEqual(after, [], `nothing ran after the teardown (got ${after.join(', ')})`);
        assert.notEqual(mg.isConversationActive, true);
    } finally {
        globalThis.window = prevWindow;
    }
});
