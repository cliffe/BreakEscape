// Two event-mapping phone calls 120-160 ms apart (m10 R3 M-1: HaX's gallery call and
// Victoria's, both released when the Mission Brief notes closed after a Restart).
// The second call opened over the first while the first's start() was still awaiting
// preloadIntroMessages(): startMinigame ended the first without complete(), so its
// isActive stayed true, start() went on to openConversation() on the torn-down UI
// ("Cannot read properties of undefined (reading 'style')"), and the first call was
// lost for good. Now the second call waits and opens once the first has closed.
// Run with: node --test test/js/phone-call-queue.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'phone-call-queue-test-'));
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

// A stand-in for MinigameFramework that behaves as the real one where it matters:
// startMinigame ends whatever is running (cleanup only, no complete()) and opens the
// new one, so a phone-chat displaced mid-start is exactly the race in M-1.
function makeFramework() {
    const fw = {
        currentMinigame: null,
        opened: [],          // npcId of each phone-chat opened, in order
        displaced: [],       // npcId of each phone-chat ended by another opening over it
        startMinigame(type, container, params) {
            if (this.currentMinigame && !this.currentMinigame._ending) {
                if (this.currentMinigame.type === 'phone-chat') this.displaced.push(this.currentMinigame.params.npcId);
                this.endMinigame(false, null);
            }
            const mg = { type, params, _ending: false };
            this.currentMinigame = mg;
            if (type === 'phone-chat') this.opened.push(params.npcId);
            return mg;
        },
        endMinigame() {
            const m = this.currentMinigame;
            if (!m) return;
            m._ending = true;
            this.currentMinigame = null;
        },
        // the player finishes the call
        close() { this.endMinigame(false, null); }
    };
    return fw;
}

// Controllable timers, as npc-mapping-delay.test.mjs
function setup() {
    const timers = [];
    const realSet = globalThis.setTimeout, realClear = globalThis.clearTimeout;
    globalThis.setTimeout = (cb, ms) => { const t = { cb, ms, live: true }; timers.push(t); return t; };
    globalThis.clearTimeout = (t) => { if (t) t.live = false; };
    const fw = makeFramework();
    window.MinigameFramework = fw;
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('agent_0x99', { id: 'agent_0x99', npcType: 'phone', displayName: 'Agent HaX', phoneId: 'player_phone', currentKnot: 'start' });
    m.npcs.set('victoria', { id: 'victoria', npcType: 'phone', displayName: 'Victoria Sterling', phoneId: 'player_phone', currentKnot: 'start' });
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

const call = (knot) => ({ conversationMode: 'phone-chat', targetKnot: knot, onceOnly: true, cooldown: 0, voiced: true });
const fire = (m, npcId, knot) => m._handleEventMapping(npcId, `game_loaded`, { ...call(knot), handlerIndex: knot }, {});

test('two calls in quick succession: the second waits for the first and opens after it closes', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'gallery_open_call');
        fire(t.m, 'victoria', 'victoria_call');      // ~120 ms later, inside the first's start delay
        t.runDue();                                  // the first call's start delay is up
        assert.deepEqual(t.fw.opened, ['agent_0x99'], 'HaX\'s call opens');
        t.runAll(5);                                 // a while passes with HaX's call open
        assert.deepEqual(t.fw.opened, ['agent_0x99'], 'Victoria\'s call does not open over it');
        assert.deepEqual(t.fw.displaced, [], 'nothing was opened over the first call');
        t.fw.close();                                // the player finishes HaX's call
        t.runAll();
        assert.deepEqual(t.fw.opened, ['agent_0x99', 'victoria'], 'both calls delivered, in order');
        assert.equal(t.fw.currentMinigame.params.startKnot, 'victoria_call');
    } finally { t.restore(); }
});

test('a queued call waits while a minigame opened from the first call is open (the notepad)', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'gallery_open_call');
        t.runDue();
        fire(t.m, 'victoria', 'victoria_call');
        t.fw.startMinigame('notes', null, {});        // the player opens the notepad from the call
        t.runAll(5);
        assert.deepEqual(t.fw.opened, ['agent_0x99']);
        t.fw.close();
        t.runAll();
        assert.deepEqual(t.fw.opened, ['agent_0x99', 'victoria']);
    } finally { t.restore(); }
});

test('three calls open one after the other, none lost', () => {
    const t = setup();
    try {
        t.m.npcs.set('ghost', { id: 'ghost', npcType: 'phone', displayName: 'Ghost', phoneId: 'player_phone' });
        fire(t.m, 'agent_0x99', 'a');
        fire(t.m, 'victoria', 'b');
        fire(t.m, 'ghost', 'c');
        for (let i = 0; i < 3; i++) { t.runAll(5); t.fw.close(); }
        t.runAll();
        assert.deepEqual(t.fw.opened, ['agent_0x99', 'victoria', 'ghost']);
        assert.deepEqual(t.fw.displaced, []);
    } finally { t.restore(); }
});

test('single call: unchanged, it closes the open minigame and opens after the start delay', () => {
    const t = setup();
    try {
        t.fw.startMinigame('lockpicking', null, {});
        fire(t.m, 'agent_0x99', 'gallery_open_call');
        assert.equal(t.fw.currentMinigame, null, 'the lockpick closed at once, as before');
        const delays = t.timers.filter(x => x.live).map(x => x.ms);
        assert.deepEqual(delays, [NPCManager.SCRIPTED_CALL_START_MS]);
        assert.equal(NPCManager.SCRIPTED_CALL_START_MS, 500);
        t.runDue();
        assert.deepEqual(t.fw.opened, ['agent_0x99']);
        assert.equal(t.timers.filter(x => x.live).length, 0, 'nothing left polling');
    } finally { t.restore(); }
});

test('a call after the first has closed goes as a single call (no queue)', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'gallery_open_call');
        t.runDue();
        t.fw.close();
        t.fw.startMinigame('notes', null, {});        // a player-opened minigame
        fire(t.m, 'victoria', 'victoria_call');
        assert.equal(t.fw.currentMinigame, null, 'closes the open minigame, as before');
        t.runDue();
        assert.deepEqual(t.fw.opened, ['agent_0x99', 'victoria']);
    } finally { t.restore(); }
});

test('a queued call waits while the player is knocked out', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'a');
        fire(t.m, 'victoria', 'b');
        t.runDue();
        let ko = true;
        window.playerIsKnockedOut = () => ko;
        t.fw.close();
        t.runAll(5);
        assert.deepEqual(t.fw.opened, ['agent_0x99']);
        ko = false;
        t.runAll();
        assert.deepEqual(t.fw.opened, ['agent_0x99', 'victoria']);
    } finally { delete window.playerIsKnockedOut; t.restore(); }
});

test('destroy() drops the queue and its timer', () => {
    const t = setup();
    try {
        fire(t.m, 'agent_0x99', 'a');
        fire(t.m, 'victoria', 'b');
        t.m.destroy();
        assert.equal(t.m._scriptedCallQueue.length, 0);
        assert.equal(t.m._scriptedCallTimer, null);
    } finally { t.restore(); }
});

// ── The phone-chat side: a phone-chat ended by another minigame opening over it ──
// startMinigame's endMinigame runs cleanup() only, not complete(), so before the fix
// isActive was still true when start()'s preload resolved.

const mgSrc = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js'), 'utf8');

function method(name, isAsync) {
    const re = new RegExp(`\\n    ${isAsync ? 'async ' : ''}${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`);
    const m = mgSrc.match(re);
    assert.ok(m, `${name} found`);
    const body = m[2].replace('super.start();', 'this._superStart();').replace('super.cleanup();', 'this._superCleanup();');
    return new Function(`return ${isAsync ? 'async ' : ''}function (${m[1]}) {\n${body}\n};`)();
}

test('phone-chat ended by another opening over it during the intro preload: start() stops quietly (was "reading \'style\'")', async () => {
    const prevWindow = globalThis.window;
    globalThis.window = {};
    try {
        let resolvePreload;
        const ui = {
            elements: { contactListView: { style: {} }, conversationView: { style: {} } },
            cleanup() { this.elements = {}; }
        };
        const opened = [];
        const mg = {
            params: {}, currentNPCId: 'agent_0x99',
            gameState: { isActive: false },
            ui,
            _superStart() { this.gameState.isActive = true; },
            _superCleanup() {},
            preloadIntroMessages: () => new Promise(r => { resolvePreload = r; }),
            // as the real openConversation's first step: touch the views
            openConversation(id) {
                opened.push(id);
                this.ui.elements.contactListView.style.display = 'none';
            },
            _flushPendingMessages() {}, _emitConversationClosed() {}, _endSocialRun() {}
        };
        mg.start = method('start', true);
        mg.cleanup = method('cleanup', false);
        const started = mg.start();
        // MinigameFramework.startMinigame for the second call: endMinigame -> cleanup()
        mg._ending = true;
        mg.cleanup();
        resolvePreload();
        await started;                       // rejected with the TypeError before the fix
        assert.deepEqual(opened, [], 'no conversation opened on the torn-down phone');
        assert.equal(mg.gameState.isActive, false, 'cleanup leaves the phone inactive');
    } finally {
        globalThis.window = prevWindow;
    }
});
