// A3 review round 1, m1 (the duplicate hub line): after a ringer call the story is reset to the
// contact's home knot. The next open of the thread must show no new line when the home knot's lines
// are already in the thread, and must still show a home knot nobody has seen. Real ink, real
// PhoneChatConversation (settleOnSeenLines); the minigame's use of it is checked in
// phone-outgoing-call.test.mjs.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'ring-home-hub-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    (s) => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const json = JSON.parse(readFileSync(join(here, 'fixtures/ring_home_hub.json'), 'utf8').replace(/^﻿/, ''));

const CALL_KNOTS = new Set(['ring_call', 'return_contact']);
const npcs = { caller: { id: 'caller', currentKnot: 'start', homeKnot: 'start' } };
const manager = { getNPC: (id) => npcs[id], getConversationHistory: () => [] };

async function conversationAfterCall(homeKnot) {
    const conv = new PhoneChatConversation('caller', manager, new InkEngine('caller'));
    assert.equal(await conv.loadStory(json), true);
    conv.callKnots = CALL_KNOTS;
    conv.goToKnot('ring_call');
    conv.continue();                                  // the call's first line: its choices are showing
    assert.ok(conv.engine.story.currentChoices.length > 0);
    conv.goToKnot(homeKnot);                          // the reset: moves without continuing
    return conv;
}
const msgs = (...texts) => texts.map((text) => ({ type: 'npc', text, preloaded: true }));

test('without the read-ahead, the reset leaves the home knot to print again (the bug)', async () => {
    const conv = await conversationAfterCall('start');
    assert.equal(conv.engine.story.canContinue, true, 'the next open would continue and print the hub line a second time');
});

test('the home knot\'s line is already in the thread: the story settles on its choices and the next open prints nothing', async () => {
    const conv = await conversationAfterCall('start');
    const ok = conv.settleOnSeenLines(msgs('Thread here. This is the home knot.', 'This is the call.'));
    assert.equal(ok, true);
    const story = conv.engine.story;
    assert.equal(story.canContinue, false, 'nothing left to print');
    assert.deepEqual(story.currentChoices.map((c) => c.text), ['Anything new?', 'Tell me more.'], 'the home knot\'s own choices');
    // a save and restore (what the thread's next open does) keeps that position
    const saved = conv.saveState();
    const again = new PhoneChatConversation('caller', manager, new InkEngine('caller'));
    await again.loadStory(json);
    assert.equal(again.restoreState(saved), true);
    assert.equal(again.engine.story.canContinue, false);
    assert.deepEqual(again.engine.story.currentChoices.map((c) => c.text), ['Anything new?', 'Tell me more.']);
    // and picking a choice from there works as on any hub
    again.engine.story.ChooseChoiceIndex(0);
    assert.equal(again.engine.story.Continue().trim(), 'Nothing new on the thread.');
});

test('the line is not in the thread yet (the contact was never opened): the story stays on the knot so a first open shows it', async () => {
    const conv = await conversationAfterCall('start');
    const before = conv.saveState();
    assert.equal(conv.settleOnSeenLines(msgs('Something else')), false);
    assert.equal(conv.engine.story.canContinue, true);
    assert.equal(conv.saveState(), before, 'the story is exactly as the reset left it');
    assert.equal(conv.settleOnSeenLines([]), false);
    assert.equal(conv.engine.story.canContinue, true);
});

test('every line of a multi-line hub must be shown; one missing leaves the whole knot for the next open', async () => {
    const conv = await conversationAfterCall('two_lines');
    const before = conv.saveState();
    assert.equal(conv.settleOnSeenLines(msgs('First hub line.')), false);
    assert.equal(conv.saveState(), before);
    assert.equal(conv.settleOnSeenLines(msgs('First hub line.', 'Second hub line.')), true);
    assert.equal(conv.engine.story.canContinue, false);
});

test('a silent home knot (choices only) settles on its choices: nothing was printed, nothing is lost', async () => {
    const conv = await conversationAfterCall('silent_home');
    assert.equal(conv.settleOnSeenLines([]), true);
    assert.equal(conv.engine.story.canContinue, false);
    assert.deepEqual(conv.engine.story.currentChoices.map((c) => c.text), ['One']);
});

test('a home router that diverts into one of the call\'s own knots is left alone (its call choices must not become texts)', async () => {
    window.gameState.globalVariables.deal = true;
    try {
        const conv = new PhoneChatConversation('caller', manager, new InkEngine('caller'));
        await conv.loadStory(json);
        conv.callKnots = CALL_KNOTS;
        conv.engine.story.variablesState.deal = true;
        conv.goToKnot('ring_call');
        conv.continue();
        conv.goToKnot('router');
        const before = conv.saveState();
        assert.equal(conv.settleOnSeenLines(msgs('The call again.', 'This is the call.', 'Router hub line.')), false);
        assert.equal(conv.saveState(), before, 'left as the reset left it');
    } finally { window.gameState.globalVariables = {}; }
});

test('a home router that does not divert into a call knot settles on its own hub', async () => {
    const conv = await conversationAfterCall('router');
    assert.equal(conv.settleOnSeenLines(msgs('Router hub line.')), true);
    assert.deepEqual(conv.engine.story.currentChoices.map((c) => c.text), ['Hello']);
});

test('a home knot that ends the story is left alone', async () => {
    const conv = await conversationAfterCall('ends');
    const before = conv.saveState();
    assert.equal(conv.settleOnSeenLines(msgs('Last word.')), false);
    assert.equal(conv.saveState(), before);
});

test('the read-ahead writes no global and fires no change event', async () => {
    const conv = await conversationAfterCall('start');
    let fired = 0;
    conv.engine.story.variablesState.variableChangedEvent = () => { fired++; };
    conv.settleOnSeenLines(msgs('Thread here. This is the home knot.'));
    assert.equal(fired, 0);
    assert.equal(typeof conv.engine.story.variablesState.variableChangedEvent, 'function', 'the observer is put back');
});

// ---- A3 R2 m3: the observer guard and the prefix-stripped match ----

test('A3 R2 m3: an unseen read-ahead that assigns a synced global fires no event and leaves the game value alone', async () => {
    window.gameState.globalVariables = { hub_seen: false };
    try {
        const conv = await conversationAfterCall('synced_home');
        const vars = conv.engine.story.variablesState;
        const realObserver = vars.variableChangedEvent;
        let fired = 0;
        const probe = () => { fired++; };
        vars.variableChangedEvent = probe;
        const before = conv.saveState();
        assert.equal(conv.settleOnSeenLines(msgs('Some other line')), false, 'unseen: the read-ahead is undone');
        assert.equal(fired, 0, 'the assignment did not reach the observer');
        assert.equal(window.gameState.globalVariables.hub_seen, false, 'no write to the game');
        assert.equal(vars.variableChangedEvent, probe, 'the observer is put back');
        assert.equal(conv.saveState(), before);
        // the same with the lines seen (the settle keeps the new value in the story, not in the game)
        fired = 0;
        assert.equal(conv.settleOnSeenLines(msgs('Synced hub line.')), true);
        assert.equal(fired, 0);
        assert.equal(window.gameState.globalVariables.hub_seen, false, 'the next open applies it (n2)');
        assert.equal(vars.variableChangedEvent, probe);
        void realObserver;
    } finally { window.gameState.globalVariables = {}; }
});

test('A3 R2 m3: the real observer of a loaded story is not called by the read-ahead either', async () => {
    window.gameState.globalVariables = { hub_seen: false };
    try {
        const conv = await conversationAfterCall('synced_home');
        const vars = conv.engine.story.variablesState;
        const real = vars.variableChangedEvent;
        const calls = [];
        // wrap whatever the engine installed (or install one) so a leak is visible
        vars.variableChangedEvent = (...a) => { calls.push(a); return real?.(...a); };
        conv.settleOnSeenLines(msgs('Synced hub line.'));
        assert.equal(calls.length, 0);
        assert.equal(window.gameState.globalVariables.hub_seen, false);
    } finally { window.gameState.globalVariables = {}; }
});

test('A3 R2 m3: a "Narrator:" home line stored stripped (type narrator) counts as shown', async () => {
    const conv = await conversationAfterCall('narrated_home');
    const before = conv.saveState();
    // as the thread holds it: the prefix stripped, stored as narration (m07 dead_air)
    const stripped = [{ type: 'narrator', text: 'A carrier tone hums on the line.' }];
    assert.equal(conv.settleOnSeenLines(stripped), true, 'the prefix-stripped text matches the raw home line');
    assert.equal(conv.engine.story.canContinue, false);
    assert.notEqual(conv.saveState(), before);
});

test('A3 R2 m3: a narrated home line that is not in the thread stays for the next open', async () => {
    const conv = await conversationAfterCall('narrated_home');
    assert.equal(conv.settleOnSeenLines([{ type: 'narrator', text: 'A different tone.' }]), false);
    assert.equal(conv.engine.story.canContinue, true);
});
