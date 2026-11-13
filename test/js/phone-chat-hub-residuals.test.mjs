// Two shared phone/person-chat residuals from the social-engineering lab, both opt-in:
//  - D9: a person-chat closed on a topic's last line resumes mid-knot; the topic's
//    `~ quiet = true -> hub` tail then swallows the hub's line, and the reopen repeated
//    the old topic line. NPC "reopenRefreshesHub": true re-enters the hub once.
//  - R5 F4: a looping hint contact's list preview showed the thread's last line from
//    the previous open (often the preloaded opening). NPC "livePreview": true previews
//    the line a reopen would add now, as a dry run.
// Without the flags both paths return null and change nothing (m01-m10 unchanged).
// Run with: node --test test/js/phone-chat-hub-residuals.test.mjs
//
// The real modules are copied to a temp dir as .mjs (the repo has no "type": "module"),
// as in phone-reopen-and-persistence.test.mjs. ink-engine.js reads the global `inkjs`.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'hub-residuals-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('minigames/person-chat/person-chat-reopen.js', 'person-chat-reopen.mjs');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { refreshHubAfterMidKnotReopen, choiceOwnerKnot, reopenContextLine } =
    await import(pathToFileURL(join(dir, 'person-chat-reopen.mjs')).href);

const fixture = name => JSON.parse(readFileSync(join(here, 'fixtures', name), 'utf8').replace(/^﻿/, ''));
const hubJson = fixture('hub_quiet_reopen.json');
const hintJson = fixture('hint_hub_preview.json');

function resetWindow(globals = {}) {
    globalThis.window = { gameState: { globalVariables: { ...globals } } };
}
const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};
const manager = { getNPC: () => null, getConversationHistory: () => [] };

async function newConversation(json, id = 'ruth') {
    const conv = new PhoneChatConversation(id, manager, new InkEngine(id));
    assert.equal(await conv.loadStory(json), true);
    syncGlobals(conv.engine.story);
    return conv;
}

// ------------------------------------------------------------------ D9

/**
 * Play the person-chat sequence: open, reach the hub, pick the topic, and stop with
 * the topic's last line on screen (the story saved there, before its tail ran).
 */
async function closeOnTopicsLastLine() {
    const conv = await newConversation(hubJson);
    conv.goToKnot('start');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    r = conv.makeChoice(0);                                 // "Tell me about the topic."
    assert.match(r.text, /Topic line one/);
    r = conv.continue();
    assert.match(r.text, /Topic line two, the last one/);
    assert.equal(r.choices.length, 0, 'the topic tail has not run yet');
    return conv.saveState();
}

/** The person-chat reopen up to showCurrentDialogue's first continue. */
async function reopenPersonChat(saved) {
    const conv = await newConversation(hubJson);
    assert.equal(conv.restoreState(saved), true);
    const story = conv.engine.story;
    const resumedMidKnot = story.canContinue && !(story.currentChoices?.length > 0);
    // person-chat-minigame.js re-navigates a choice-point restore before displaying
    const knot = choiceOwnerKnot(story);
    if (knot) story.ChoosePathString(knot);
    syncGlobals(story);
    return { conv, story, resumedMidKnot, first: conv.continue() };
}

test('D9: a mid-knot reopen without the flag shows nothing new (the old topic line comes back)', async () => {
    resetWindow({ stage_two: false });
    const saved = await closeOnTopicsLastLine();
    window.gameState.globalVariables.stage_two = true;      // the player moved on
    const { story, resumedMidKnot, first } = await reopenPersonChat(saved);
    assert.equal(resumedMidKnot, true);
    assert.equal(first.text, '', 'the tail set quiet; the hub consumed it and said nothing');
    assert.ok(first.choices.length > 0);
    const remembered = { text: 'Ruth: Topic line two, the last one.', speaker: 'ruth' };
    assert.deepEqual(reopenContextLine({ isReopen: true, result: first, remembered }), remembered,
        'the reopen repeats the stale topic line (the D9 symptom)');
    for (const optedIn of [undefined, false, 'true', 1]) {
        assert.equal(refreshHubAfterMidKnotReopen({ optedIn, resumedMidKnot, result: first, story }), null,
            `no refresh for reopenRefreshesHub = ${JSON.stringify(optedIn)}`);
    }
    assert.equal(story.canContinue, false, 'story left resting on the same choices');
});

test('D9: with reopenRefreshesHub the hub is re-entered once and shows its current line', async () => {
    resetWindow({ stage_two: false });
    const saved = await closeOnTopicsLastLine();
    window.gameState.globalVariables.stage_two = true;
    const { conv, story, resumedMidKnot, first } = await reopenPersonChat(saved);
    const knot = refreshHubAfterMidKnotReopen({ optedIn: true, resumedMidKnot, result: first, story });
    assert.equal(knot, 'hub');
    const second = conv.continue();
    assert.equal(second.text.trim(), 'Ruth: Stage two now. Go to the workstation.');
    assert.deepEqual(second.tags, ['complete_task:stage_one_seen', 'complete_task:stage_two_seen'], 'the hub re-check runs as on any hub pass');
    assert.deepEqual(second.choices.map(c => c.text), ['Tell me about the topic.', 'Bye.']);
    assert.equal(story.variablesState.quiet, false);
    assert.equal(reopenContextLine({ isReopen: true, result: second, remembered: { text: 'x', speaker: 'ruth' } }), null,
        'no context line once the hub has spoken');
});

test('D9: a choice-point reopen is untouched even when opted in (it is already re-navigated)', async () => {
    resetWindow({ stage_two: false });
    const conv = await newConversation(hubJson);
    conv.goToKnot('start');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length);
    r = conv.makeChoice(0);
    do { r = conv.continue(); } while (!r.choices?.length);  // topic read to the end, back at the hub
    const saved = conv.saveState();
    window.gameState.globalVariables.stage_two = true;
    const { story, resumedMidKnot, first } = await reopenPersonChat(saved);
    assert.equal(resumedMidKnot, false);
    assert.equal(first.text.trim(), 'Ruth: Stage two now. Go to the workstation.', 'the existing re-navigation already greets');
    assert.equal(refreshHubAfterMidKnotReopen({ optedIn: true, resumedMidKnot, result: first, story }), null);
});

test('D9: a mid-knot reopen whose tail still has lines to say is untouched', async () => {
    resetWindow({ stage_two: false });
    const conv = await newConversation(hubJson);
    conv.goToKnot('start');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length);
    conv.makeChoice(0);                                     // closed on "Topic line one."
    const { story, resumedMidKnot, first } = await reopenPersonChat(conv.saveState());
    assert.equal(resumedMidKnot, true);
    assert.match(first.text, /Topic line two/, 'the unread line is shown, as before');
    assert.equal(refreshHubAfterMidKnotReopen({ optedIn: true, resumedMidKnot, result: first, story }), null);
});

// ------------------------------------------------------------------ R5 F4

/** Preload the hint contact's opening (as the inventory and phone do) into a thread. */
async function preloadedHintContact(extra = {}) {
    const history = [];
    const npcManager = {
        getNPC: () => null,
        getConversationHistory: () => history,
        addMessage: (id, type, text, meta) => history.push({ type, text, ...meta })
    };
    const npc = { id: 'ruth_phone', storyJSON: hintJson, currentKnot: 'start', ...extra };
    const added = await PhoneChatConversation.preloadOpening(npc, npcManager, new InkEngine('pre'));
    assert.equal(added, 1);
    assert.deepEqual(history.map(m => m.text), ['Ruth: On the sheet still?']);
    return { npc, npcManager, history };
}

test('F4: without livePreview there is no preview run (the thread\'s last line stands)', async () => {
    resetWindow({ stage_one_done: false, stage_two_done: false });
    const { npc, npcManager } = await preloadedHintContact();
    window.gameState.globalVariables.stage_one_done = true;
    assert.equal(await PhoneChatConversation.previewReopen(npc, npcManager, new InkEngine('p'), { syncGlobals }), null);
    npc.livePreview = false;
    assert.equal(await PhoneChatConversation.previewReopen(npc, npcManager, new InkEngine('p'), { syncGlobals }), null);
});

test('F4: livePreview shows the line a reopen would add, as a dry run', async () => {
    resetWindow({ stage_one_done: false, stage_two_done: false });
    const { npc, npcManager, history } = await preloadedHintContact({ livePreview: true });
    const savedState = npc.storyState;

    // Nothing changed since the preload: opening would add nothing
    assert.equal(await PhoneChatConversation.previewReopen(npc, npcManager, new InkEngine('p'), { syncGlobals }), null);

    window.gameState.globalVariables.stage_one_done = true;
    const writes = [];
    const preview = await PhoneChatConversation.previewReopen(npc, npcManager, new InkEngine('p'), {
        syncGlobals: story => {
            syncGlobals(story);
            const prev = story.variablesState.variableChangedEvent;
            story.variablesState.variableChangedEvent = (n, v) => { writes.push(n); prev?.(n, v); };
        }
    });
    assert.equal(preview, "Ruth: Recon's next.");
    assert.deepEqual(history.map(m => m.text), ['Ruth: On the sheet still?'], 'thread untouched');
    assert.equal(npc.storyState, savedState, 'saved story untouched');
    assert.deepEqual(window.gameState.globalVariables, { stage_one_done: true, stage_two_done: false }, 'no global written');

    // The real reopen (phone-chat-minigame.js openConversation) adds that same line
    const conv = await newConversation(hintJson, 'ruth_phone');
    conv.restoreState(npc.storyState);
    const reopen = conv.reopenWithCurrentGlobals(syncGlobals);
    assert.equal(reopen.renavigated, true);
    assert.equal(reopen.messages.at(-1), preview);
    assert.deepEqual(reopen.tags, ['note:stage2'], 'tags run on the real open, not in the preview');
});

test('F4: livePreview skips a contact with no saved story and a pretext call contact', async () => {
    resetWindow({ stage_one_done: true });
    const npc = { id: 'x', livePreview: true, storyJSON: hintJson };
    assert.equal(await PhoneChatConversation.previewReopen(npc, manager, new InkEngine('p'), { syncGlobals }), null);
    const { npc: hint, npcManager } = await preloadedHintContact({ livePreview: true });
    window.gameState.globalVariables.stage_one_done = true;
    hint.callId = 'some_call';
    assert.equal(await PhoneChatConversation.previewReopen(hint, npcManager, new InkEngine('p'), { syncGlobals }), null);
});

test('F4: an intro\'s deferred global counts as applied, as on a real open', async () => {
    resetWindow({ stage_one_done: false, stage_two_done: false });
    const { npc, npcManager } = await preloadedHintContact({ livePreview: true });
    // As if the intro had set stage_one_done and the preload deferred it
    npc.deferredGlobals = { stage_one_done: true };
    npc.deferredGlobalsBase = { stage_one_done: false };
    assert.equal(await PhoneChatConversation.previewReopen(npc, npcManager, new InkEngine('p'), { syncGlobals }),
        "Ruth: Recon's next.");
    assert.deepEqual(npc.deferredGlobals, { stage_one_done: true }, 'deferral left for the real open');
});

test('wiring: both flags are read where the minigames decide (opt-in only)', () => {
    const person = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
    assert.match(person, /optedIn: this\.npc\?\.reopenRefreshesHub/);
    const ui = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
    assert.match(ui, /if \(npc\.livePreview === true\) this\.refreshLivePreview\(npc, contactItem\)/);
});
