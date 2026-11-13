// UX q100: a person conversation has no End Conversation button. The X and Esc end it, and
// every way a conversation ends (the X, Esc, the ink's end hook, the story's exit tag) runs
// the same teardown: the ink state is saved, conversation_closed:<npc> fires once (the
// scenario music listens for it), the framework's endMinigame runs and onComplete is called.
// The real PersonChatMinigame and MinigameFramework run against jsdom.
// Run with: node test/js/conversation-end-paths.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// The person chat pulls in the music controller, which builds an AudioContext on load
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
const FakeAudioContext = function () { return anything(); };
globalThis.AudioContext = window.AudioContext = FakeAudioContext;
globalThis.Audio = window.Audio = FakeAudioContext;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { default: stateManager } = await imp('systems/npc-conversation-state.js');

const NPC = 'agent_0x99';

// One open conversation, as far as its teardown can tell: an active story, the real
// framework holding it, and recorders on the save, the events and onComplete.
function openConversation() {
    document.body.innerHTML = '<div id="mg"></div>';
    const rec = { saves: [], events: [], completes: [] };
    window.game = {};
    window.gameState = { globalVariables: {} };
    window.npcManager = { getNPC: () => ({ id: NPC, displayName: 'Agent 0x99' }) };
    window.eventDispatcher = { emit: (name, data) => rec.events.push(name), on() {}, off() {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    stateManager.saveNPCState = (id) => rec.saves.push(id);
    const fw = Object.create(MinigameFramework);
    fw.currentMinigame = null;
    window.MinigameFramework = fw;
    const mg = new PersonChatMinigame(document.getElementById('mg'), {
        npcId: NPC, title: 'Agent 0x99',
        onComplete: (success) => rec.completes.push(success)
    });
    try {
        mg.init();
    } catch {
        // The portrait renderer needs a canvas jsdom lacks: past the shell, the chat's own
        // listeners go on over a bare UI, so the ink end hook is the real one
        mg.ui = {
            elements: { choicesContainer: document.createElement('div'), continueButton: null, dialogueText: null },
            getChoiceButtons: () => [], destroy() {}, reset() {}
        };
        mg.setupEventListeners();
    }
    // The base start only: Esc handler and isActive (the chat's own start loads a story)
    MinigameScene.prototype.start.call(mg);
    mg.isConversationActive = true;
    mg.inkEngine = { story: {} };
    fw.currentMinigame = mg;
    return { mg, fw, rec };
}

function assertSameEnd({ mg, fw, rec }, label, success) {
    assert.deepEqual(rec.saves.slice(0, 1), [NPC], `${label}: the ink state is saved`);
    assert.equal(rec.events.filter(e => e === `conversation_closed:${NPC}`).length, 1,
        `${label}: conversation_closed fires once (the music hand-back listens for it)`);
    assert.equal(fw.currentMinigame, null, `${label}: the framework let the chat go`);
    assert.deepEqual(rec.completes, [success], `${label}: onComplete ran once`);
    assert.equal(mg.gameState.isActive, false, `${label}: the chat is no longer active`);
    assert.equal(window.currentConversationNPCId, null, `${label}: the NPC context is cleared`);
}

test('a person conversation draws the X and no End Conversation button', () => {
    const { mg } = openConversation();
    assert.ok(document.getElementById('minigame-close'), 'the X is drawn');
    assert.equal(document.getElementById('minigame-cancel'), null, 'no End Conversation button');
    assert.equal(document.body.textContent.includes('End Conversation'), false);
    assert.equal(PersonChatMinigame.keepsCancelButton, false);
    mg.cleanup();
});

test('the X ends the conversation through the player-close path', () => {
    const c = openConversation();
    document.getElementById('minigame-close').click();
    assert.equal(c.mg.closedByPlayer, true);
    assert.ok(c.rec.events.includes('minigame_failed'), 'a player close is complete(false), as before');
    assertSameEnd(c, 'X', false);
});

test('Esc ends the conversation through the same player-close path', () => {
    const c = openConversation();
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(c.mg.closedByPlayer, true);
    assert.ok(c.rec.events.includes('minigame_failed'));
    assertSameEnd(c, 'Esc', false);
});

test('the ink end hook (npc-conversation-ended) runs the same teardown', () => {
    const c = openConversation();
    window.dispatchEvent(new window.CustomEvent('npc-conversation-ended', { detail: { npcId: NPC } }));
    assertSameEnd(c, 'ink end hook', true);
});

test('the story ending on its own (complete(true)) runs the same teardown', () => {
    const c = openConversation();
    c.mg.complete(true);
    assert.ok(c.rec.events.includes('minigame_completed'));
    assertSameEnd(c, 'story end', true);
});

// UX slice 16 R1 m6: the paths the close shell could break next time it changes

test('a forced close (complete(false), a hit or a knock-out) runs the same teardown, not as the player', () => {
    const c = openConversation();
    c.mg.complete(false);
    assert.notEqual(c.mg.closedByPlayer, true, 'not a player close');
    assertSameEnd(c, 'forced close', false);
});

test('a minigame opened over the chat ends it without complete: saved, event once, inactive', () => {
    const c = openConversation();
    c.fw.endMinigame(false, null);
    assert.deepEqual(c.rec.saves.slice(0, 1), [NPC], 'the ink state is saved');
    assert.equal(c.rec.events.filter(e => e === `conversation_closed:${NPC}`).length, 1, 'conversation_closed once');
    assert.equal(c.mg.gameState.isActive, false);
    assert.equal(c.fw.currentMinigame, null);
    assert.equal(window.currentConversationNPCId, null);
    c.mg.cleanup(); // a second cleanup (the displaced scene torn down again) fires nothing more
    assert.equal(c.rec.events.filter(e => e === `conversation_closed:${NPC}`).length, 1, 'still once');
});

test('disableClose: no X, Esc does nothing, no cancel row', () => {
    document.body.innerHTML = '<div id="mg"></div>';
    const fw = Object.create(MinigameFramework);
    fw.currentMinigame = null;
    window.MinigameFramework = fw;
    window.eventDispatcher = { emit() {}, on() {}, off() {} };
    const mg = new PersonChatMinigame(document.getElementById('mg'), { npcId: NPC, title: 'Agent 0x99', disableClose: true });
    try { mg.init(); } catch { /* no canvas in jsdom: the shell is already built */ }
    MinigameScene.prototype.start.call(mg);
    fw.currentMinigame = mg;
    const x = document.getElementById('minigame-close');
    assert.ok(!x || x.style.display === 'none', 'the X is hidden');
    assert.equal(document.getElementById('minigame-cancel'), null, 'no cancel row');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(fw.currentMinigame, mg, 'Esc leaves the chat open');
    assert.equal(mg.gameState.isActive, true);
    mg.cleanup();
});
