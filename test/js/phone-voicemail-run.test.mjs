// A6: the voicemail runner (phone calls plan 2.6): the contact's voicemail knot run silently into its
// thread in the saved story, its voice: lines kept as voice-message lines, its tags applied, the story
// left on the home knot in one save with the ink VARs it set, and the saved state held until then.
// Real NPCManager (harness), real ink, real PhoneChatConversation.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './phone-ring-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'voicemail-run-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    (s) => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const json = JSON.parse(readFileSync(join(here, 'fixtures/phone_voicemail.json'), 'utf8').replace(/^﻿/, ''));

const base = { id: 'caller', displayName: 'Caller One', storyJSON: json, currentKnot: 'start', homeKnot: 'start' };
const texts = (w) => w.nm.getConversationHistory('caller').map((m) => [m.type, m.text]);

/** Run the voicemail the way NPCManager.runVoicemail does, with the tag applier recorded. */
async function run(w, knot, opts = {}) {
    const applied = [];
    const result = await PhoneChatConversation.runVoicemail(w.nm.getNPC('caller'), w.nm, new InkEngine('caller'), knot,
        { ...opts, applyTags: (tags) => applied.push(...tags) });
    return { result, applied };
}
/** What the thread would open on: the saved story, read like the minigame reads it. */
async function reopened(w) {
    const conv = new PhoneChatConversation('caller', w.nm, new InkEngine('caller'));
    await conv.loadStory(json);
    assert.equal(conv.restoreState(w.nm.getNPC('caller').storyState), true);
    return conv;
}

test('the voicemail knot runs silently: a Voicemail row, then its lines (voice: kept, unread), tags handed to the applier', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        const { result, applied } = await run(w, 'ring_vm');
        assert.equal(result.ran, true);
        assert.deepEqual(texts(w), [['call', 'Voicemail'], ['npc', 'voice: You let it ring.'], ['npc', 'voice: Call me when you can.']]);
        assert.deepEqual(w.nm.getConversationHistory('caller').map((m) => m.read), [true, false, false], 'the lines are unread; the row is not a message');
        assert.equal(w.nm.getConversationHistory('caller')[0].callEvent, 'voicemail');
        assert.deepEqual(applied, ['set_global:vm_heard:true']);
    } finally { w.restore(); }
});

test('the story is left on the home knot in one save, carrying the ink VARs the knot set; the contact\'s knot is untouched', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        await run(w, 'ring_vm');
        const npc = w.nm.getNPC('caller');
        assert.equal(npc.currentKnot, 'start');
        assert.ok(npc.storyState, 'a story position was saved');
        const conv = await reopened(w);
        assert.equal(conv.getVariable('heard_vm'), true, 'the ink VAR the knot set persists');
        assert.equal(conv.getVariable('vm_count'), 1);
        // on the home knot: its text is still to come, then its choices (the thread opens on its hub)
        const home = conv.continue();
        assert.equal(home.text.trim(), 'Home line one.');
        assert.equal(home.choices.length, 2);
    } finally { w.restore(); }
});

test('a second voicemail builds on the first one\'s saved story (visit state and VARs carry over)', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        await run(w, 'ring_vm');
        await run(w, 'other_vm');
        const lines = texts(w).filter(([t]) => t === 'npc').map(([, x]) => x);
        assert.equal(lines.at(-1), 'voice: I already left one.', 'other_vm read heard_vm from the saved story');
        const conv = await reopened(w);
        assert.equal(conv.getVariable('vm_count'), 1);
    } finally { w.restore(); }
});

test('the saved story is held until the single save: while the run loads, npc.storyState is still the old position', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        const first = new PhoneChatConversation('caller', w.nm, new InkEngine('caller'));
        await first.loadStory(json);
        first.goToKnot('start');
        first.continue();
        const before = first.saveState();
        w.nm.getNPC('caller').storyState = before;
        const pending = PhoneChatConversation.runVoicemail(w.nm.getNPC('caller'), w.nm, new InkEngine('caller'), 'ring_vm', {});
        assert.equal(w.nm.getNPC('caller').storyState, before, 'nothing saved yet');
        assert.deepEqual(texts(w), [], 'nothing in the thread yet');
        await pending;
        assert.notEqual(w.nm.getNPC('caller').storyState, before);
    } finally { w.restore(); }
});

test('withheld: the voicemail row never names the caller; a missing knot or story runs nothing and changes nothing', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        const { result } = await run(w, 'ring_vm', { withheld: true });
        assert.equal(result.ran, true);
        assert.equal(w.nm.getConversationHistory('caller')[0].text, 'Voicemail', 'the voicemail row never names the caller');
        const nothing = makeWorld({ npcs: [{ ...base, storyJSON: undefined }] });
        const r = await PhoneChatConversation.runVoicemail(nothing.nm.getNPC('caller'), nothing.nm, new InkEngine('caller'), 'ring_vm', {});
        assert.equal(r.ran, false);
        assert.deepEqual(nothing.nm.getConversationHistory('caller'), []);
        nothing.restore();
        const noKnot = await PhoneChatConversation.runVoicemail(w.nm.getNPC('caller'), w.nm, new InkEngine('caller'), 'not_a_knot', {});
        assert.equal(noKnot.ran, false);
    } finally { w.restore(); }
});

test('a voicemail row and its lines survive a reload (the callEvent and the voice: text go through the save)', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    let w2;
    try {
        await run(w, 'ring_vm');
        const saved = JSON.parse(JSON.stringify(w.nm.exportPhoneState()));
        w2 = makeWorld({ npcs: [{ ...base }] });
        w2.nm.restorePhoneState(saved);
        assert.deepEqual(texts(w2), texts(w));
        assert.equal(w2.nm.getConversationHistory('caller')[0].callEvent, 'voicemail');
    } finally { w.restore(); w2?.restore(); }
});

// ---- A5 R1 M1: a reload during a call leaves the story on the call's choices ----------------------------

/** The call is open on `ring_talk`, at its choices, and the story is saved as the minigame saves it. */
async function midCall(w) {
    const conv = new PhoneChatConversation('caller', w.nm, new InkEngine('caller'));
    await conv.loadStory(json);
    conv.goToKnot('ring_talk');
    conv.continue();
    assert.deepEqual(conv.engine.story.currentChoices.map((c) => c.text), ['Keep talking.', 'Goodbye.']);
    const npc = w.nm.getNPC('caller');
    npc.storyState = conv.saveState();
    return npc;
}

test('M1: resetToHome moves a story saved on a call\'s choices to the home knot and puts currentKnot back', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        const npc = await midCall(w);
        npc.currentKnot = 'ring_talk';
        const before = npc.storyState;
        assert.equal(await PhoneChatConversation.resetToHome(npc, w.nm, new InkEngine('caller')), true);
        assert.equal(npc.currentKnot, 'start');
        assert.equal(npc.lastEnteredKnot, 'start');
        assert.notEqual(npc.storyState, before);
        const conv = await reopened(w);
        const home = conv.continue();
        assert.equal(home.text.trim(), 'Home line one.', 'the home knot is next, not the call');
        assert.deepEqual(home.choices.map((c) => c.text), ['Anything new?', 'Bye.'], 'no call choices');
    } finally { w.restore(); }
});

test('M1: resetToHome with no saved story or an unloadable one changes nothing and says so', async () => {
    const w = makeWorld({ npcs: [{ ...base, currentKnot: 'ring_talk' }] });
    try {
        const npc = w.nm.getNPC('caller');
        assert.equal(await PhoneChatConversation.resetToHome(npc, w.nm, new InkEngine('caller')), false);
        npc.storyState = '{not json';
        assert.equal(await PhoneChatConversation.resetToHome(npc, w.nm, new InkEngine('caller')), false);
        assert.equal(npc.storyState, '{not json');
    } finally { w.restore(); }
});

test('n2: resetToHome steps aside when the thread moved on while the story loaded', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    try {
        const npc = await midCall(w);
        npc.currentKnot = 'ring_talk';
        const pending = PhoneChatConversation.resetToHome(npc, w.nm, new InkEngine('caller'));
        npc.storyState = '{"moved":"on"}';     // the player's thread saved over it during the load
        assert.equal(await pending, false);
        assert.equal(npc.storyState, '{"moved":"on"}', 'not overwritten');
        assert.equal(npc.currentKnot, 'ring_talk', 'not moved');
    } finally { w.restore(); }
});

test('n4: a #set_global the knot sets is mirrored into the story for the lines after it, and the ink variables are recorded after the save', async () => {
    const w = makeWorld({ npcs: [{ ...base }] });
    const recorded = [];
    const saved = window.npcConversationStateManager;
    window.npcConversationStateManager = { discoverGlobalVariables() {}, syncGlobalVariablesToStory() {}, observeGlobalVariableChanges() {}, recordInkVariables: (id, story) => recorded.push([id, !!story, w.nm.getNPC('caller').storyState]) };
    try {
        await run(w, 'mirror_vm');
        const lines = texts(w).filter(([t]) => t === 'npc').map(([, x]) => x);
        assert.deepEqual(lines, ['voice: First.', 'voice: Saw the flag.'], 'the second line read the global the first one set');
        assert.equal(recorded.length, 1);
        assert.equal(recorded[0][0], 'caller');
        assert.equal(recorded[0][1], true);
        assert.ok(recorded[0][2], 'recorded after the story position was saved');
    } finally { window.npcConversationStateManager = saved; w.restore(); }
});
