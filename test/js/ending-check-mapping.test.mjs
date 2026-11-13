// The engine-level ending warning on an eventMapping (`endingCheck: true`). A mapping that opens
// the debrief asks systems/ending-check.js first when optional objectives are open, BEFORE running
// any of its side effects. "End the mission now" runs the mapping once; "Keep going" does not run
// it but HOLDS the ending (as the credits trigger does), so the objectives panel can end it later
// and it ends by itself once nothing optional is open — no soft-lock, whatever the trigger. The
// mapping is marked triggered when it asks, so a re-emit of the same trigger never asks twice; the
// agreed/held path re-runs it with _endingConfirmed, which bypasses the once/cooldown check.
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

// A fake ending-check: needsAnswer until the player agrees; confirm resolves a controllable answer;
// hold captures the held action so the test can fire it like the panel button / auto-complete would.
function fakeEndingCheck() {
    let open = true;            // an optional objective is open
    let agreed = false;         // the player chose "End the mission now"
    let pending = null;         // resolve() of the current confirm()
    let heldFn = null;          // the action passed to hold()
    return {
        api: {
            needsAnswer: () => open && !agreed,
            confirm: () => new Promise((resolve) => { pending = resolve; }),
            hold: (fn) => { if (!heldFn) heldFn = fn; },
            hasHeld: () => heldFn !== null
        },
        answer(endNow) { if (endNow) agreed = true; const r = pending; pending = null; r(endNow); },
        asking() { return pending !== null; },
        fireHeld() { agreed = true; const f = heldFn; heldFn = null; f && f(); },  // panel button / auto-end
        hasHeld() { return heldFn !== null; }
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
});

test('Keep going does not run the mapping; it holds the ending, and firing the held action runs it once', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;

    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    ec.answer(false);   // Keep going
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, undefined, 'the debrief did not start');
    assert.equal(ec.hasHeld(), true, 'the ending was held for the objectives panel');

    // A re-emit of the same trigger while the ending is held must NOT ask again (marked triggered).
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    assert.equal(ec.asking(), false, 'no second question while held');
    assert.equal(window.gameState.globalVariables.start_debrief, undefined);

    // The panel button / auto-complete fires the held action: the debrief runs, once.
    ec.fireHeld();
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'the held ending ran the mapping');
});

test('a sibling endingCheck mapping does not ask again once an ending is held (m07 OR-triggers)', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;
    // First trigger (one of several OR'd debrief openers) — player keeps going, ending held.
    m._handleEventMapping('debrief', 'room_entered:server_room', { ...mapping, handlerIndex: 0 }, {});
    await tick();
    ec.answer(false);
    await tick();
    assert.equal(ec.hasHeld(), true);
    // A sibling mapping (different trigger/handler) fires on the next room entry: must NOT re-ask.
    m._handleEventMapping('debrief', 'room_entered:scada_control', { ...mapping, handlerIndex: 3 }, {});
    await tick();
    assert.equal(ec.asking(), false, 'no second question from a sibling mapping while held');
    assert.equal(window.gameState.globalVariables.start_debrief, undefined, 'the sibling did not open the debrief');
});

test('End the mission now runs the mapping once, straight away', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    ec.answer(true);    // End the mission now
    await tick();
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'the debrief ran');
    assert.equal(ec.hasHeld(), false, 'nothing held when the player ended now');
});

test('after the player agreed, a later trigger never asks again (no second ask at the credits)', async () => {
    const m = makeManager();
    const ec = fakeEndingCheck();
    window.endingCheck = ec.api;
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    await tick();
    ec.answer(true);
    await tick();
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
    window.endingCheck = { needsAnswer: () => false, confirm: () => { confirmCalls += 1; return Promise.resolve(true); }, hold: () => {} };
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    assert.equal(confirmCalls, 0, 'confirm was not called');
    assert.equal(window.gameState.globalVariables.start_debrief, true, 'the debrief ran at once');
});

test('endingCheck mapping with no ending-check module loaded runs normally', () => {
    const m = makeManager();
    m._handleEventMapping('debrief', 'conversation_closed:debrief', mapping, {});
    assert.equal(window.gameState.globalVariables.start_debrief, true);
});
