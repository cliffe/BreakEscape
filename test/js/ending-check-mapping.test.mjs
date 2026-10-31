// The engine-level ending warning on an eventMapping (`endingCheck: true`). A mapping that opens
// the debrief asks systems/ending-check.js first when optional objectives are open, BEFORE running
// any of its side effects. "Keep going" cancels and re-arms (the mapping is not marked triggered,
// so the same trigger fires again later); "End the mission now" runs the mapping once; a second
// trigger after the player agreed never asks again.
// Run with: node --test test/js/ending-check-mapping.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'ending-check-mapping-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter((f) => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach((cb) => cb(data)); }
    };
}

function makeManager() {
    const m = new NPCManager(makeDispatcher(), null);
    m.npcs.set('debrief', { id: 'debrief', npcType: 'person', currentKnot: 'start' });
    return m;
}

// A fake ending-check: needsAnswer until the player agrees; confirm resolves a controllable answer.
function fakeEndingCheck() {
    let open = true;            // an optional objective is open
    let agreed = false;         // the player chose "End the mission now"
    let pending = null;         // resolve() of the current confirm()
    return {
        api: {
            needsAnswer: () => open && !agreed,
            confirm: () => new Promise((resolve) => { pending = resolve; })
        },
        answer(endNow) { if (endNow) agreed = true; const r = pending; pending = null; r(endNow); },
        asking() { return pending !== null; },
        closeObjective() { open = false; }
    };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
// A debrief-opening mapping: sets a global when it runs, so we can see whether it ran.
const mapping = { handlerIndex: 0, once: true, cooldown: 0, endingCheck: true, setGlobal: { start_debrief: true } };

test.beforeEach(() => { window.gameState.globalVariables = {}; delete window.endingCheck; });

test('with an optional objective open, the mapping asks before running any side effect', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    assert.equal(ec.asking(), true, 'the player was asked');
    assert.equal(window.gameState.globalVariables.start_debrief, undefined, 'the debrief global was not set yet');
    assert.deepEqual(m.exportTriggeredEvents(), {}, 'the mapping is not marked triggered while the question is open');
});

test('Keep going cancels and re-arms; the trigger fires again and End now runs it once', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;

    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    ec.answer(false);   // Keep going
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, undefined, 'the debrief did not start');
    assert.deepEqual(m.exportTriggeredEvents(), {}, 'nothing persisted: the mapping can fire again');

    // Player comes back and re-closes the conversation
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    assert.equal(ec.asking(), true, 'asked again on the next trigger');
    ec.answer(true);    // End the mission now
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'the debrief ran once End now was chosen');
    assert.deepEqual(m.exportTriggeredEvents(), { 'debrief:conversation_closed:debrief:0': 1 }, 'now recorded');
});

test('after the player agreed, a later trigger never asks again (no second ask at the credits)', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    ec.answer(true);
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, true);
    // A fresh handler (handlerIndex 1) standing in for a credits-time re-check: needsAnswer is false.
    window.gameState.globalVariables = {};
    const credits = { ...mapping, handlerIndex: 1 };
    m._handleEventMapping('debrief', 'conversation_closed:debrief', credits, {});
    await tick();
    assert.equal(ec.asking(), false, 'no modal: the player already agreed');
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'it ran straight through');
});

test('nothing optional open: the mapping runs synchronously, never calls confirm', async () => {
    const m = makeManager();
    let confirmCalls = 0;
    window.endingCheck = { needsAnswer: () => false, confirm: () => { confirmCalls += 1; return Promise.resolve(true); } };
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    assert.equal(confirmCalls, 0, 'confirm was not called');
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'the debrief ran at once');
});

test('endingCheck mapping with no ending-check module loaded runs normally', () => {
    const m = makeManager();
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    assert.equal(window.gameState.globalVariables.start_debrief, true);
});
