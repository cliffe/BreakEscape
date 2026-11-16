// R2 m1 (POSE_FIXES_REVIEW_R2.md): a chat that hands over to a child minigame (the NPC's inventory)
// and resumes counts as open for the whole of it, so a needs NPC starts no stop mid-conversation.
// Run with: node test/js/npc-chat-resume.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { JSDOM } from 'jsdom';
for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.document = dom.window.document;
globalThis.window = globalThis.window || globalThis;
const { createEngineWorld } = await import('../../public/break_escape/js/systems/npc-needs.js');
const here = dirname(fileURLToPath(import.meta.url));

function withWindow(extra, fn) {
    const saved = {};
    for (const k of Object.keys(extra)) { saved[k] = window[k]; window[k] = extra[k]; }
    try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) window[k] = v; }
}
class PersonChatMinigame { constructor(npcId) { this.npcId = npcId; } }
class ContainerMinigame { constructor(npcId) { this.npcId = npcId; } }

test('guard: inChatWith is true for an open person-chat with that NPC only', () => {
    withWindow({ MinigameFramework: { currentMinigame: new PersonChatMinigame('tom') }, currentConversationMinigameType: 'person-chat', pendingConversationReturn: null }, () => {
        const w = createEngineWorld();
        assert.equal(w.inChatWith('tom'), true);
        assert.equal(w.inChatWith('ana'), false);
    });
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: null }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), false);
    });
});

test('R2 m1: the NPC inventory child of a chat still counts as that chat', () => {
    // person-chat nulls currentConversationMinigameType when it closes to hand over (person-chat-minigame.js)
    withWindow({ MinigameFramework: { currentMinigame: new ContainerMinigame('tom') }, currentConversationMinigameType: null,
        pendingConversationReturn: { npcId: 'tom', type: 'person-chat' } }, () => {
        const w = createEngineWorld();
        assert.equal(w.inChatWith('tom'), true, 'the inventory step is part of the conversation');
        assert.equal(w.inChatWith('ana'), false, 'another NPC is not in a chat');
    });
});

test('guard: a pending phone-chat return is not a face-to-face chat', () => {
    withWindow({ MinigameFramework: { currentMinigame: new ContainerMinigame('tom') }, pendingConversationReturn: { npcId: 'tom', type: 'phone-chat' } }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), false);
    });
});

test('R2 m1: closing the inventory keeps the chat counted until the chat has restarted', async () => {
    const src = readFileSync(join(here, '../../public/break_escape/js/minigames/container/container-minigame.js'), 'utf8');
    const m = src.match(/export function returnToConversationAfterNPCInventory\(\) \{[\s\S]*?\n\}\n/);
    assert.ok(m, 'found the function');
    const run = new Function('window', 'console', m[0].replace('export function', 'function') + '\nreturn returnToConversationAfterNPCInventory;');
    const started = [];
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'person-chat', returning: true };   // complete() flags it
    win.MinigameFramework = { currentMinigame: null, startMinigame(name, _x, opts) { started.push([name, opts.npcId]); win.MinigameFramework.currentMinigame = new PersonChatMinigame(opts.npcId); } };
    win.currentConversationMinigameType = 'person-chat';
    const quiet = { log() {}, warn() {}, error() {} };
    run(win, quiet)();
    // The container is gone, the chat has not restarted yet: still counted
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: win.pendingConversationReturn }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), true, 'the gap before the chat restarts');
    });
    await new Promise(r => setTimeout(r, 120));
    assert.deepEqual(started, [['person-chat', 'tom']], 'the chat restarted once');
    assert.equal(win.pendingConversationReturn, null, 'cleared once the chat is back');
});


// ---- R3 (POSE_FIXES_REVIEW_R3.md): a stale pending return must never freeze the NPC ----
const { MinigameFramework } = await import('../../public/break_escape/js/minigames/framework/minigame-manager.js');
const { ContainerMinigame: RealContainer } = await import('../../public/break_escape/js/minigames/container/container-minigame.js').catch(() => ({}));
const { MinigameScene } = await import('../../public/break_escape/js/minigames/framework/base-minigame.js');

class FakeChild extends MinigameScene {
    constructor(container, params) { super(container, params); this.mode = params?.mode; this.npcId = params?.npcId; }
}
class FakeOther extends MinigameScene {}
function frame() {
    document.body.innerHTML = '';
    const fw = Object.create(MinigameFramework);
    fw.currentMinigame = null;
    fw.registeredScenes = { container: FakeChild, rfid: FakeChild, other: FakeOther, 'person-chat': FakeChild };
    window.MinigameFramework = fw;
    window.pendingConversationReturn = { npcId: 'tom', type: 'person-chat' };
    window.currentConversationMinigameType = null;
    return fw;
}
const free = () => createEngineWorld().inChatWith('tom') === false;

test('R3 M1: a force-closed inventory leaves the NPC free', () => {
    const fw = frame();
    fw.startMinigame('container', null, { mode: 'npc', npcId: 'tom' });
    assert.equal(createEngineWorld().inChatWith('tom'), true, 'in chat while the inventory is open');
    fw.forceCloseMinigame();   // player-damage-interrupt.js: no complete()
    assert.equal(window.pendingConversationReturn, null, 'the stale return is cleared');
    assert.ok(free(), 'NPC free after a force close');
});

test('R3 M1: another minigame displacing the inventory leaves the NPC free', () => {
    const fw = frame();
    fw.startMinigame('container', null, { mode: 'npc', npcId: 'tom' });
    fw.startMinigame('other', null, {});   // a call or scene opening over it
    assert.ok(fw.currentMinigame, 'the displacer is open');
    assert.ok(free(), 'NPC free while the displacer is open');
    fw.forceCloseMinigame();
    assert.ok(free(), 'and after it closes');
});

test('R3 M1: a failed container open leaves the NPC free (no minigame open)', () => {
    frame();   // pending set, container never opened
    assert.ok(free(), 'pending alone, with nothing open, is not a chat');
});

test('R3 M1: the card reader child force-closed also clears the return', () => {
    const fw = frame();
    fw.startMinigame('rfid', null, {});
    fw.forceCloseMinigame();
    assert.equal(window.pendingConversationReturn, null);
    assert.ok(free());
});

test('R3 M1: displacing the person-chat while the pending return is set keeps it (RFID opens over the chat)', () => {
    const fw = frame();
    fw.startMinigame('person-chat', null, { npcId: 'tom' });
    window.pendingConversationReturn = { npcId: 'tom', type: 'person-chat' };   // the clone path sets it, then opens the reader
    fw.startMinigame('rfid', null, {});
    assert.ok(window.pendingConversationReturn, 'ending the chat is not ending the child');
    assert.equal(createEngineWorld().inChatWith('tom'), true);
});

test('R3 M1: a normal close still counts as chat through the return gap', () => {
    const rec = { npcId: 'tom', type: 'person-chat', returning: true };
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: rec }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), true);
    });
});

test('R3 M1: container complete() marks the return and the framework keeps it', async () => {
    const fw = frame();
    const mg = fw.startMinigame('container', null, { mode: 'npc', npcId: 'tom' });
    window.returnToConversationAfterNPCInventory = () => {};
    // The real complete() override, run on the fake child
    const complete = RealContainer.prototype.complete;
    complete.call(Object.assign(mg, { mode: 'npc' }), true);
    assert.ok(window.pendingConversationReturn, 'kept for the chat to resume');
    assert.equal(window.pendingConversationReturn.returning, true, 'flagged as returning');
    await new Promise(r => setTimeout(r, 150));
    delete window.returnToConversationAfterNPCInventory;
});

test('R3 M1: a failed open through showNPCInventory clears the pending return', async () => {
    const { NPCGameBridge } = await import('../../public/break_escape/js/systems/npc-game-bridge.js');
    const fw = frame(); window.pendingConversationReturn = null;
    window.npcManager = { getNPC: () => ({ id: 'tom', displayName: 'Tom', itemsHeld: [{ type: 'key', name: 'k' }] }) };
    window.startContainerMinigame = () => {};   // opens nothing
    const bridge = new NPCGameBridge();
    bridge.showNPCInventory('tom');
    assert.equal(window.pendingConversationReturn, null, 'nothing opened, nothing pending');
    window.startContainerMinigame = () => { throw new Error('boom'); };
    try { bridge.showNPCInventory('tom'); } catch (e) { /* may rethrow */ }
    assert.equal(window.pendingConversationReturn, null, 'a throwing open clears it too');
});

// ---- R3 m2 / m4: the return function itself ----
function runReturn(win) {
    const src = readFileSync(join(here, '../../public/break_escape/js/minigames/container/container-minigame.js'), 'utf8');
    const m = src.match(/export function returnToConversationAfterNPCInventory\(\) \{[\s\S]*?\n\}\n/);
    const warns = [];
    const quiet = { log() {}, warn: (...a) => warns.push(a), error() {} };
    const f = new Function('window', 'console', m[0].replace('export function', 'function') + '\nreturn returnToConversationAfterNPCInventory;');
    return { call: f(win, quiet), warns };
}

test('R3 m4: a second call during the delay does not start a second chat', async () => {
    const started = [];
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'person-chat' };
    win.MinigameFramework = { startMinigame: (...a) => started.push(a[0]) };
    const { call } = runReturn(win);
    call(); call();
    await new Promise(r => setTimeout(r, 120));
    assert.deepEqual(started, ['person-chat']);
});

test('R3 m2/m4: a restart that throws is logged, and the NPC is freed', async () => {
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'person-chat' };
    win.MinigameFramework = { startMinigame() { throw new Error('no scene'); } };
    const { call, warns } = runReturn(win);
    call();
    await new Promise(r => setTimeout(r, 120));
    assert.equal(win.pendingConversationReturn, null, 'cleared');
    assert.equal(warns.length, 1, 'one warning, not a silent loss and not an uncaught error');
    assert.match(String(warns[0].join(' ')), /tom|chat|resume/i);
});

test('R3 m4: the phone-chat branch restarts a phone-chat', async () => {
    const started = [];
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'phone-chat' };
    win.MinigameFramework = { startMinigame: (n, _x, o) => started.push([n, o.npcId]) };
    runReturn(win).call();
    await new Promise(r => setTimeout(r, 120));
    assert.deepEqual(started, [['phone-chat', 'tom']]);
    assert.equal(win.pendingConversationReturn, null);
});

test('R3 m3: the card reader return keeps the chat counted until it restarts', async () => {
    const src = readFileSync(join(here, '../../public/break_escape/js/minigames/rfid/rfid-minigame.js'), 'utf8');
    const m = src.match(/export function returnToConversationAfterRFID\(\) \{[\s\S]*?\n\}\n/);
    assert.ok(m);
    const f = new Function('window', 'console', m[0].replace('export function', 'function') + '\nreturn returnToConversationAfterRFID;');
    const started = [];
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'person-chat', returning: true };
    win.MinigameFramework = { currentMinigame: null, startMinigame: (n, _x, o) => started.push([n, o.npcId]) };
    f(win, { log() {}, warn() {}, error() {} })();
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: win.pendingConversationReturn }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), true, 'the 50 ms gap is covered');
    });
    await new Promise(r => setTimeout(r, 120));
    assert.deepEqual(started, [['person-chat', 'tom']]);
    assert.equal(win.pendingConversationReturn, null);
});
