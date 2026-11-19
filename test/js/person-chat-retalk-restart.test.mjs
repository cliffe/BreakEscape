// Re-talk bug: an in-person NPC whose knot ends `line / #exit_conversation / -> DONE` was
// saved before the tag line was read (Esc, X or a reload right after the reply), so the
// restored story had canContinue true. The next talk continued into the DONE and showed
// "(End of conversation - press ESC to exit)" and nothing else (m01 Fatima, live game 8153).
// A resumed reopen with nothing left but the end now restarts the NPC's knot like any
// other finished story, and the empty result's tags are dropped. The phone path
// (_showRestoredThread) had the same gap.
// Runs the real PersonChatMinigame.showCurrentDialogue and PhoneChatConversation over the
// real compiled ink of m01 Fatima Begum and m02 Nurse Raval.
// Run with: node test/js/person-chat-retalk-restart.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

if (!process.env.RT_DEBUG) for (const k of ["log", "info", "debug", "warn", "error"]) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
const FakeAudio = function () { return anything(); };
globalThis.AudioContext = window.AudioContext = FakeAudio;
globalThis.Audio = window.Audio = FakeAudio;
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { resumedStoryHadOnlyTheEnd } = await imp('minigames/person-chat/person-chat-reopen.js');
const { default: PhoneChatConversation } = await imp('minigames/phone-chat/phone-chat-conversation.js');
const { PhoneChatMinigame } = await imp('minigames/phone-chat/phone-chat-minigame.js');
const { default: InkEngine } = await imp('systems/ink/ink-engine.js');

const inkJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8').replace(/^﻿/, ''));
const fatimaJson = inkJson('scenarios/m01_first_contact/ink/m01_npc_fatima_begum.json');
const raval = inkJson('scenarios/m02_ransomed_trust/ink/m02_npc_roaming_nurse.json');

async function conversation(json, id, npc) {
    const mgr = { getNPC: () => npc, getConversationHistory: () => [] };
    const conv = new PhoneChatConversation(id, mgr, new InkEngine(id));
    assert.equal(await conv.loadStory(json), true);
    return conv;
}

/** Talk, read the first line, pick choice 0, and save before the reply's tag line is read. */
async function savedBeforeTheTagIsRead(json, id, npcRecord, pick = 0) {
    const conv = await conversation(json, id, npcRecord);
    conv.goToKnot('start');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    // handleChoice saves right after makeChoice: the reply's line is read, its tag line and the DONE are not
    const reply = conv.makeChoice(pick);
    assert.ok(reply.text.trim(), 'the reply line was read');
    return conv.saveState();
}

/** A PersonChatMinigame at the point a reopen first calls showCurrentDialogue. */
function reopenedChat({ conv, npc, restartOnRetalk }) {
    const shown = { dialogue: [], choices: [], over: [], ended: 0, accumulated: [] };
    const mg = Object.create(PersonChatMinigame.prototype);
    Object.assign(mg, {
        conversation: conv, inkEngine: conv.engine, npcId: npc.id,
        npc: { ...npc, restartOnRetalk }, isResumedConversation: true, _resumedMidKnot: true,
        characters: {}, isConversationActive: true,
        ui: {
            showChoices: (c) => shown.choices.push(c.map(x => x.text)),
            showDialogue: (t, s) => shown.dialogue.push(t)
        },
        displayAccumulatedDialogue: (r) => shown.accumulated.push(r.text),
        showConversationOverMessage: (m) => shown.over.push(m),
        endConversation: () => { shown.ended++; }
    });
    return { mg, shown };
}

test('helper: only a resumed, empty, ended result with no end_conversation tag restarts', () => {
    const ended = { hasEnded: true, text: '', choices: [], tags: ['exit_conversation'] };
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: ended }), true);
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: false, result: ended }), false, 'a first display');
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: ended, restartOnRetalk: false }), false, 'opted out');
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: { ...ended, text: 'Hi.' } }), false, 'has text');
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: { ...ended, choices: [{ text: 'a' }] } }), false);
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: { ...ended, hasEnded: false } }), false);
    assert.equal(resumedStoryHadOnlyTheEnd({ isReopen: true, result: { ...ended, tags: [' End_Conversation '] } }), false, 'a deliberate close');
});

test('Fatima: closed before the tag was read, the second talk restarts and plays her return line', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const saved = await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc);
    const conv = await conversation(fatimaJson, npc.id, npc);
    assert.equal(conv.restoreState(saved), true);
    assert.equal(conv.engine.story.canContinue, true, 'the bug precondition: the divert is unread');

    const { mg, shown } = reopenedChat({ conv, npc });
    mg.showCurrentDialogue();
    assert.deepEqual(shown.over, [], 'no "(End of conversation)" message');
    assert.equal(shown.ended, 0);
    assert.equal(shown.accumulated.length, 1, 'the restarted knot is displayed');
    // The state was saved after the greeting (greeted = true), so the restart plays her return line, not the greeting.
    assert.match(shown.accumulated[0], /Back again\? I really am up to my neck in CVs/, 'her return line is shown again');
    assert.deepEqual(conv.engine.story.currentChoices.map(c => c.text), ["Don't let me keep you."], 'and her choice is back');
});

test('without the fix path the same state shows the dead end (guard: the test has teeth)', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const saved = await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc);
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(saved);
    const first = conv.continue();
    assert.equal(first.hasEnded, true);
    assert.equal(first.text.trim(), '');
    assert.deepEqual(first.tags, ['exit_conversation'], 'the unread tag arrives on the empty result');
});

test('restartOnRetalk:false still shows the old end message (one-shot scenes unchanged)', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc));
    const { mg, shown } = reopenedChat({ conv, npc, restartOnRetalk: false });
    mg.showCurrentDialogue();
    assert.deepEqual(shown.over, ['(End of conversation - press ESC to exit)']);
});

test('a first display (not a reopen) of an ended story is left alone', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc));
    const { mg, shown } = reopenedChat({ conv, npc });
    mg.isResumedConversation = false;
    mg.showCurrentDialogue();
    assert.equal(shown.over.length, 1);
});

test('Nurse Raval: the same restart on a second NPC, and a restart that ends again does not loop', async () => {
    const npc = { id: 'roaming_nurse', currentKnot: 'start', lastEnteredKnot: 'start' };
    const saved = await savedBeforeTheTagIsRead(raval, npc.id, npc);
    const conv = await conversation(raval, npc.id, npc);
    conv.restoreState(saved);
    const { mg, shown } = reopenedChat({ conv, npc });
    mg.showCurrentDialogue();
    assert.deepEqual(shown.over, []);
    assert.equal(shown.accumulated.length, 1, 'her start knot is displayed');

    // A knot that ends again on its own after the restart must not recurse
    const quiet = await conversation(fatimaJson, 'fatima_begum', npc);
    quiet.restoreState(await savedBeforeTheTagIsRead(fatimaJson, 'fatima_begum', npc));
    quiet.restartAfterEnd = () => { quiet.storyEnded = false; return true; };   // restart lands on a spent story
    const second = reopenedChat({ conv: quiet, npc });
    second.mg.showCurrentDialogue();
    assert.equal(second.shown.over.length, 1, 'one restart only, then the old message');
});

test('restart does not double-fire the dropped tags (game-action tags are not processed for the empty result)', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc));
    const seen = [];
    const realProcess = conv.processTags.bind(conv);
    conv.processTags = (tags) => { seen.push(...tags); return realProcess(tags); };
    const { mg } = reopenedChat({ conv, npc });
    mg.processGameActionTagsCalled = 0;
    mg.showCurrentDialogue();
    // The empty result's exit tag passed the conversation's own hook once (it acts on
    // end_conversation alone); the restarted knot's tags are its own. Nothing is repeated.
    assert.equal(seen.filter(t => t === 'exit_conversation').length, 1);
    assert.ok(!seen.some(t => /^(give_item|set_global|complete_task)/.test(t)));
});

// ---- phone-chat: the same gap in _showRestoredThread ----

test('phone: restoredStoryHasOnlyTheEnd spots a thread saved before its DONE and leaves others untouched', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const saved = await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc);
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(saved);
    assert.equal(conv.restoredStoryHasOnlyTheEnd(), true);

    // A thread parked with unread lines left is put back exactly as it was
    const midConv = await conversation(fatimaJson, npc.id, npc);
    midConv.goToKnot('start');
    const before = midConv.saveState();
    assert.equal(midConv.restoredStoryHasOnlyTheEnd(), false);
    assert.equal(midConv.saveState(), before, 'the probe left the story as it found it');

    // A thread resting at choices is not probed
    const atChoices = await conversation(fatimaJson, npc.id, npc);
    atChoices.goToKnot('start');
    atChoices.continue();
    assert.equal(atChoices.restoredStoryHasOnlyTheEnd(), false);
});

test('phone: _showRestoredThread restarts such a thread instead of ending it', async () => {
    const npc = { id: 'fatima_begum', currentKnot: 'start', lastEnteredKnot: 'start' };
    const conv = await conversation(fatimaJson, npc.id, npc);
    conv.restoreState(await savedBeforeTheTagIsRead(fatimaJson, npc.id, npc));
    const calls = [];
    const mg = Object.create(PhoneChatMinigame.prototype);
    Object.assign(mg, {
        conversation: conv,
        continueStory: () => calls.push('continueStory'),
        showCurrentChoices: () => calls.push('showCurrentChoices'),
        _presentReopened: () => calls.push('presented'),
        params: {}, _pretext: null
    });
    mg._showRestoredThread(npc, npc.id, [{ type: 'npc', text: 'Sorry, I am busy.' }], { renavigated: false });
    assert.deepEqual(calls, ['continueStory'], 'restarted at start and read it');
    // A thread that still has lines is shown the old way
    const other = await conversation(fatimaJson, npc.id, npc);
    other.goToKnot('start');
    mg.conversation = other;
    calls.length = 0;
    mg._showRestoredThread(npc, npc.id, [{ type: 'npc', text: 'Sorry, I am busy.' }], { renavigated: false });
    assert.deepEqual(calls, ['showCurrentChoices']);
});

// R3 minors: the probe stubs every bound external except the pure getters, the stubs return a
// number (not void), and a probe that provoked an ink error leaves the story steppable.
test('probe: value-using external is stubbed, errors cleared, real step calls it once', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'retalk-ext-'));
    writeFileSync(join(dir, 's.ink'),
        'EXTERNAL se_influence(n)\nEXTERNAL mystery(n)\nEXTERNAL player_name()\n-> start\n=== start ===\nOne.\n' +
        '{se_influence(1) > 0:\n  Two.\n- else:\n  Three.\n}\nMid.\n{mystery(2)}\nName {player_name()}.\n-> DONE\n');
    const r = spawnSync(join(root, 'bin/inklecate'), ['-o', join(dir, 's.json'), join(dir, 's.ink')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const json = JSON.parse(readFileSync(join(dir, 's.json'), 'utf8').replace(/^﻿/, ''));
    const { default: InkEngine } = await import(pathToFileURL(join(root, 'public/break_escape/js/systems/ink/ink-engine.js')).href);
    const engine = new InkEngine('x');
    await engine.loadStory(json);
    const calls = { se: 0, mystery: 0, name: 0 };
    engine.bindExternalFunction('se_influence', () => { calls.se++; return 5; });
    engine.bindExternalFunction('mystery', () => { calls.mystery++; return 1; });
    engine.bindExternalFunction('player_name', () => { calls.name++; return 'Ann'; });
    engine.story.ChoosePathString('start');
    engine.continue(); // One.
    const saved = engine.story.state.ToJson();
    const probe = engine.withEffectfulExternalsStubbed(() => engine.continue());
    assert.match(probe.text, /Two|Three/);
    assert.equal(calls.se, 0, 'se_influence stubbed during the probe');
    engine.story.state.LoadJson(saved);
    assert.equal(engine.story.hasError, false);
    assert.equal(engine.story.canContinue, true);
    calls.se = 0; calls.mystery = 0; calls.name = 0;
    const real = engine.continue();
    assert.match(real.text, /Two/);
    assert.equal(calls.se, 1, 'real external called exactly once');
    // an unknown newly bound external is stubbed in the probe, pure getter stays bound
    const saved2 = engine.story.state.ToJson();
    let nameLine;
    engine.withEffectfulExternalsStubbed(() => { engine.continue(); engine.continue(); nameLine = engine.continue(); });
    assert.equal(calls.mystery, 0, 'unknown external stubbed');
    assert.match(nameLine.text, /Ann/, 'pure getter stays bound in the probe');
    engine.story.state.LoadJson(saved2);
    engine.story.ResetErrors();
    engine.continue(); engine.continue();
    assert.equal(calls.mystery, 1, 'unknown external called once for real');
});

test('probe: an ink error raised inside the probe is cleared when it ends', async () => {
    const { default: InkEngine } = await import(pathToFileURL(join(root, 'public/break_escape/js/systems/ink/ink-engine.js')).href);
    const dir = mkdtempSync(join(tmpdir(), 'retalk-err-'));
    writeFileSync(join(dir, 's.ink'), 'One.\nTwo.\n-> DONE\n');
    const r = spawnSync(join(root, 'bin/inklecate'), ['-o', join(dir, 's.json'), join(dir, 's.ink')], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const engine = new InkEngine('y');
    await engine.loadStory(JSON.parse(readFileSync(join(dir, 's.json'), 'utf8').replace(/^\uFEFF/, '')));
    engine.continue();
    engine.withEffectfulExternalsStubbed(() => engine.story.state.AddError('void value', false));
    assert.equal(engine.story.hasError, false);
    assert.equal(engine.story.canContinue, true);
});
