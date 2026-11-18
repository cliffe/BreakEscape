// Drives the REAL PersonChatMinigame methods (no regex-lifted copies, no hand-set flags)
// through the real sequence: handleChoice -> reply timer -> displayAccumulatedDialogue ->
// displayDialogueBlocksSequentially -> cleanup(). m02 Val's "I'll get you something" prints
// a reply, then `#set_global:val_argument_heard:true / #exit_conversation` as a tags-only
// step. Before the fix a close at the reply left that step unread, so the global was set
// seconds later from a closed chat. Also covers B1 (the close-time look-ahead leaked ink
// global writes), M2 (a reload at the reply: the re-talk runs the dropped tags once) and
// #ending_check (never run during teardown).
// Run with: node test/js/person-chat-close-real-sequence.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

if (!process.env.RT_DEBUG) for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(), construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = function () { return anything(); };
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);
const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { default: PhoneChatConversation } = await imp('minigames/phone-chat/phone-chat-conversation.js');
const { default: InkEngine } = await imp('systems/ink/ink-engine.js');
const { default: stateManager } = await imp('systems/npc-conversation-state.js').then(m => ({ default: m.default || m.npcConversationStateManager }));

const inkJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8').replace(/^﻿/, ''));
const val = inkJson('scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.json');

function world() {
    const events = [];
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d?.value]), on: () => () => {}, off: () => {} };
    window.currentConversationNPCId = null;
    window.NPCGameBridge = {};
    window.npcConversationStateManager = stateManager;
    return events;
}

async function chat(json, knot, npcId = 'security_guard_patrol', advance = true) {
    const npc = { id: npcId, currentKnot: knot, lastEnteredKnot: knot };
    const mgr = { getNPC: () => npc, getConversationHistory: () => [] };
    const conv = new PhoneChatConversation(npcId, mgr, new InkEngine(npcId));
    assert.equal(await conv.loadStory(json), true);
    // the real observer, as the game attaches it
    stateManager.observeGlobalVariableChanges(conv.engine.story, npcId);
    conv.goToKnot(knot);
    const shown = [];
    const mg = Object.create(PersonChatMinigame.prototype);
    Object.assign(mg, {
        conversation: conv, inkEngine: conv.engine, npcId, npc, characters: {},
        isConversationActive: true, isClickThroughMode: false, _eventListeners: [], gameState: { isActive: true },
        ui: new Proxy({ showDialogue: (t) => shown.push(t), showChoices: () => {}, hideChoices: () => {} }, {
            get: (t, k) => (k in t ? t[k] : () => {})
        })
    });
    mg._tagOptions = () => ({});
    if (advance) {
        let r;
        do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
        mg.lastResult = r;
    }
    return { mg, conv, shown };
}

test('real sequence: a close at the reply sets the global once, at the close, nothing later', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const events = world();
        const { mg, conv, shown } = await chat(val, 'the_argument');
        const countHeard = () => events.filter(e => e[0] === 'global_variable_changed:val_argument_heard').length;
        mg.handleChoice(0);
        assert.equal(countHeard(), 0, 'nothing yet: the reply waits on its 1.5 s timer');
        mock.timers.tick(1500);               // the reply is displayed
        await Promise.resolve(); await Promise.resolve();
        assert.ok(shown.some(t => /corridor/.test(t)), 'the reply line is on screen');
        assert.equal(conv.engine.story.canContinue, true, 'the tags-only step is still unread');
        assert.equal(countHeard(), 0, 'the display has not reached the tags');
        mg.cleanup();                         // the player closes the chat
        assert.equal(window.gameState.globalVariables.val_argument_heard, true, 'set at the close');
        assert.equal(countHeard(), 1);
        assert.equal(conv.engine.story.canContinue, false, 'the save is past the tags');
        mock.timers.tick(20000);
        for (let i = 0; i < 20; i++) await Promise.resolve();
        assert.equal(countHeard(), 1, 'nothing fires afterwards');
    } finally { mock.timers.reset(); }
});

// A tiny story: line / ~ g = g + 1 / line
async function growStory(extra = '') {
    const dir = mkdtempSync(join(tmpdir(), 'retalk-ink-'));
    writeFileSync(join(dir, 's.ink'), `VAR g = 0\n-> start\n=== start ===\nOne.\n~ g = g + 1\nTwo.${extra}\n-> DONE\n`);
    const r = spawnSync(join(root, 'bin/inklecate'), ['-o', join(dir, 's.json'), join(dir, 's.ink')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return JSON.parse(readFileSync(join(dir, 's.json'), 'utf8').replace(/^\uFEFF/, ''));
}

test('B1: the look-ahead leaks nothing; a re-talk applies the write exactly once', async () => {
    const events = world();
    window.gameState.globalVariables.g = 0;
    const json = await growStory();
    const { mg, conv } = await chat(json, 'start', 'grow_npc', false);
    conv.continue();                                   // One.
    mg._displayInFlight = { tags: [], choices: [], hasEnded: false, text: 'One.' };
    assert.equal(conv.engine.story.canContinue, true);
    const before = conv.engine.story.state.ToJson();
    mg._flushTrailingTags();
    assert.equal(window.gameState.globalVariables.g, 0, 'gameState unchanged');
    assert.deepEqual(events.filter(e => e[0].startsWith('global_variable_changed')), [], 'no event');
    assert.equal(conv.engine.story.variablesState.g, 0);
    assert.equal(conv.engine.story.state.ToJson(), before, 'story put back');
    // the observer is still attached and works for the real step
    const step = conv.continue();
    assert.match(step.text, /Two/);
    assert.equal(window.gameState.globalVariables.g, 1, 'exactly +1 once the player reaches it');
    assert.equal(events.filter(e => e[0] === 'global_variable_changed:g').length, 1);
});

test('B1 phone: restoredStoryHasOnlyTheEnd leaks no global write', async () => {
    const events = world();
    window.gameState.globalVariables.g = 0;
    const { conv } = await chat(await growStory(), 'start', 'grow_npc2', false);
    conv.continue();                                   // One.
    assert.equal(conv.restoredStoryHasOnlyTheEnd(), false);
    assert.equal(window.gameState.globalVariables.g, 0);
    assert.deepEqual(events.filter(e => e[0].startsWith('global_variable_changed')), []);
    conv.continue();
    assert.equal(window.gameState.globalVariables.g, 1);
});

test('M2: a reload at the reply; the re-talk runs the dropped tags once and restarts', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const events = world();
        const first = await chat(val, 'the_argument');
        first.mg.handleChoice(0);                       // saves past the reply, tags unread; then the page goes away
        const saved = first.conv.saveState();
        const second = await chat(val, 'the_argument');
        assert.equal(second.conv.restoreState(saved), true);
        second.mg.isResumedConversation = true;
        second.mg._resumedMidKnot = true;
        second.mg.npc = { ...second.mg.npc, restartOnRetalk: true };
        const accumulated = [];
        second.mg.displayAccumulatedDialogue = (r) => accumulated.push(r.text);
        second.mg.showCurrentDialogue();
        const heard = () => events.filter(e => e[0] === 'global_variable_changed:val_argument_heard').length;
        assert.equal(window.gameState.globalVariables.val_argument_heard, true);
        assert.equal(heard(), 1, 'ran once');
        assert.equal(accumulated.length, 1, 'and the knot restarted');
    } finally { mock.timers.reset(); }
});

test('M2: after a close flush the re-talk finds nothing left to run (no double fire)', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const events = world();
        const first = await chat(val, 'the_argument');
        first.mg.handleChoice(0);
        mock.timers.tick(1500);
        await Promise.resolve(); await Promise.resolve();
        first.mg.cleanup();
        const saved = first.conv.saveState();
        const second = await chat(val, 'the_argument');
        second.conv.restoreState(saved);
        second.mg.isResumedConversation = true;
        second.mg.npc = { ...second.mg.npc, restartOnRetalk: true };
        second.mg.displayAccumulatedDialogue = () => {};
        second.mg.showConversationOverMessage = () => {};
        second.mg.showCurrentDialogue();
        assert.equal(events.filter(e => e[0] === 'global_variable_changed:val_argument_heard').length, 1);
    } finally { mock.timers.reset(); }
});

test('#ending_check in the trailing step is not run during teardown, and the step stays unread', async () => {
    const events = world();
    const json = await growStory('\n#ending_check\n#set_global:g:5');
    const { mg, conv } = await chat(json, 'start', 'gate_npc', false);
    window.gameState.globalVariables.g = 0;
    conv.continue();                                   // One.
    const applied = [];
    window.endingCheck = { confirm: async () => { applied.push('asked'); return false; } };
    mg._displayInFlight = { tags: [], choices: [], hasEnded: false, text: 'x' };
    // step to the line before the gate: Two. carries the tags, so probe from there
    conv.continue();
    mg._displayInFlight = { tags: ['ending_check', 'set_global:g:5'], choices: [], hasEnded: false, text: 'Two.' };
    mg._pendingReply = { tags: ['ending_check', 'set_global:g:5'] };
    mg._flushPendingReply();
    mg._flushTrailingTags();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.deepEqual(applied, [], 'no confirm dialog during teardown');
    assert.equal(window.gameState.globalVariables.g, 1, 'the gated set_global did not run');
    assert.equal(mg._pendingReply === null, true);
    delete window.endingCheck;
});

// ---- R2 minors -------------------------------------------------------------------------

async function inkFrom(source) {
    const dir = mkdtempSync(join(tmpdir(), 'retalk-ink-'));
    writeFileSync(join(dir, 's.ink'), source);
    const r = spawnSync(join(root, 'bin/inklecate'), ['-o', join(dir, 's.json'), join(dir, 's.ink')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return JSON.parse(readFileSync(join(dir, 's.json'), 'utf8').replace(/^\uFEFF/, ''));
}

test('m1: two reloads at the reply run the dropped tags once (the first re-talk saves past them)', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const events = world();
        stateManager.conversationStates.delete('security_guard_patrol');
        const first = await chat(val, 'the_argument');
        first.mg.handleChoice(0);                       // saves with the tag line unread, then the page goes away
        const heard = () => events.filter(e => e[0] === 'global_variable_changed:val_argument_heard').length;
        for (let reload = 0; reload < 2; reload++) {
            const next = await chat(val, 'the_argument', 'security_guard_patrol', false);
            const restored = stateManager.restoreNPCState('security_guard_patrol', next.conv.engine.story);
            assert.ok(restored, `reload ${reload + 1} restores`);
            if (restored === 'variables-only') next.conv.goToKnot('the_argument');
            next.mg.isResumedConversation = true;
            next.mg._resumedMidKnot = restored !== 'variables-only';
            next.mg.npc = { ...next.mg.npc, restartOnRetalk: true };
            next.mg.displayAccumulatedDialogue = () => {};
            next.mg.showConversationOverMessage = () => {};
            next.mg.showCurrentDialogue();                 // the player closes before the restarted line is read
        }
        assert.equal(heard(), 1, 'one event over two reloads');
    } finally { mock.timers.reset(); }
});

test('m2: a restartOnRetalk:false NPC still runs the dropped tags on a reload, and is not restarted', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        const events = world();
        const first = await chat(val, 'the_argument');
        first.mg.handleChoice(0);
        const saved = first.conv.saveState();
        const second = await chat(val, 'the_argument');
        assert.equal(second.conv.restoreState(saved), true);
        second.mg.isResumedConversation = true;
        second.mg._resumedMidKnot = true;
        second.mg.npc = { ...second.mg.npc, restartOnRetalk: false };
        const accumulated = [];
        second.mg.displayAccumulatedDialogue = (r) => accumulated.push(r.text);
        second.mg.showConversationOverMessage = () => {};
        second.mg.showCurrentDialogue();
        assert.equal(window.gameState.globalVariables.val_argument_heard, true, 'the tag ran');
        assert.equal(events.filter(e => e[0] === 'global_variable_changed:val_argument_heard').length, 1);
        assert.equal(accumulated.length, 0, 'no restart for a one-shot NPC');
    } finally { mock.timers.reset(); }
});

const EXTERNAL_INK = `EXTERNAL se_influence(x)
VAR g = 0
-> start
=== start ===
One.
~ se_influence(1)
~ g = 1
-> DONE
`;

test('m3: an effectful external between two lines fires once (the real step), not also in the probe', async () => {
    world();
    const json = await inkFrom(EXTERNAL_INK);
    const { mg, conv } = await chat(json, 'start', 'ext_npc', false);
    let calls = 0;
    conv.engine.bindExternalFunction('se_influence', () => { calls++; return null; });
    conv.continue();                                   // One.
    mg._displayInFlight = { tags: [], choices: [], hasEnded: false, text: 'One.' };
    mg._flushTrailingTags();                           // probe (stubbed), then the empty step runs for real
    assert.equal(calls, 1, 'one call over probe plus the real step');
    assert.equal(conv.engine.story.canContinue, false, 'the step was run for real');
});

test('m3 phone: restoredStoryHasOnlyTheEnd does not call an effectful external in its probe', async () => {
    world();
    const json = await inkFrom(EXTERNAL_INK);
    const { conv } = await chat(json, 'start', 'ext_npc2', false);
    let calls = 0;
    conv.engine.bindExternalFunction('se_influence', () => { calls++; return null; });
    conv.continue();                                   // One.
    assert.equal(conv.restoredStoryHasOnlyTheEnd(), true, 'the rest is spent');
    assert.equal(calls, 1, 'once, at the commit, not also in the probe');
});

test('m4: #ending_check in a genuine tags-only trailing step leaves the step unread', async () => {
    const events = world();
    window.gameState.globalVariables.g = 0;
    const json = await inkFrom(`VAR g = 0
-> start
=== start ===
One.
* [Go]
  {g == 0:
    Two.
  - else:
    Three.
  }
  #ending_check
  #set_global:g:5
  -> DONE
`);
    const { mg, conv } = await chat(json, 'start', 'gate_npc2', false);
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    const shown = conv.makeChoice(0);
    assert.match(shown.text, /Two/);
    mg._displayInFlight = shown;
    window.endingCheck = { confirm: async () => { throw new Error('asked during teardown'); } };
    assert.equal(conv.engine.story.canContinue, true, 'the tags-only step is pending');
    mg._flushTrailingTags();
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.equal(conv.engine.story.canContinue, true, 'the gated step stays unread for the re-talk');
    assert.equal(window.gameState.globalVariables.g, 0, 'its tags did not run');
    assert.deepEqual(events.filter(e => e[0].startsWith('global_variable_changed')), []);
    delete window.endingCheck;
});
