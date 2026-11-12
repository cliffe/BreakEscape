// A1 R1 M1: the two client paths that spoke a call line without its #delivery: note now send it.
//   1. A voiced contact's preloaded opening (PhoneChatConversation.preloadOpening keeps the line's
//      note on the message; _speakPreloadedOpening -> _speakCallLine -> PhoneCallVoice.speak).
//   2. The reopen re-run (reopenWithCurrentGlobals returns the notes; _presentReopened ->
//      _presentOutput -> _showStoryLine gets each line's note).
// Real ink (fixtures/phone_call_notes.json) through the real conversation class; the minigame's own
// methods are lifted from the source and run on stubs for the UI, the voice and the NPC manager.
// Run with: node --test test/js/phone-call-notes-paths.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-notes-paths-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('minigames/phone-chat/phone-call-voice.js', 'phone-call-voice.mjs', s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/tts-delivery.js', 'tts-delivery.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const imp = name => import(pathToFileURL(join(dir, name)).href);
const { default: InkEngine } = await imp('ink-engine.mjs');
const { default: PhoneChatConversation } = await imp('phone-chat-conversation.mjs');
const speaker = await imp('phone-chat-speaker.mjs');
const voice = await imp('phone-call-voice.mjs');
const { deliveryFromTags } = await imp('tts-delivery.mjs');
const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_call_notes.json'), 'utf8').replace(/^﻿/, ''));
console.log = () => {};
console.warn = () => {};

const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
function method(name, deps) {
    const m = src.match(new RegExp(`\\n    (async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const keys = Object.keys(deps);
    return new Function(...keys, `return ${m[1] || ''}function (${m[2]}) {\n${m[3]}\n};`)(...keys.map(k => deps[k]));
}

// ---- 1. preloaded opening -------------------------------------------------------------------

function makeNpcManager(npc) {
    const history = [];
    return {
        history,
        getConversationHistory: () => history,
        getNPC: id => (id === npc.id ? npc : null),
        npcs: new Map([[npc.id, npc]]),
        addMessage(npcId, type, text, meta = {}) { history.push({ type, text, ...meta }); }
    };
}

test('the preload keeps each opening line\'s delivery tag on its message', async () => {
    window.gameState = { globalVariables: { flag: false, seen: false } };
    const npc = { id: 'agent', displayName: 'Agent', voiced: true, storyJSON: storyJson, currentKnot: 'start', voice: { name: 'Zephyr' } };
    const mgr = makeNpcManager(npc);
    const n = await PhoneChatConversation.preloadOpening(npc, mgr, new InkEngine('agent'));
    assert.ok(n > 0);
    const [first, second] = mgr.history;
    assert.equal(first.text, 'Agent: Opening line.');
    assert.equal(deliveryFromTags(first.deliveryTags), 'calm and low');
    assert.equal(second.text, 'Agent: Second line, no note.');
    assert.equal(second.deliveryTags, undefined, 'a line with no note carries none');
});

function minigameForCall(spoken) {
    class FakeVoice { async speak(id, text, fx, opts) { spoken.push({ id, text, delivery: opts?.delivery ?? null }); } skip() {} }
    const deps = {
        phoneLineVoice: voice.phoneLineVoice, displayPhoneLine: speaker.displayPhoneLine,
        PhoneCallVoice: FakeVoice, TTSManager: class {}, whenSessionOverlayClosed: async () => {},
        isVoicedCall: () => true, deliveryFromTags
    };
    const mg = {
        params: { voiced: true }, currentNPCId: 'agent', isConversationActive: true, _typeoutRun: 1,
        _pendingNpcMessages: [], conversation: {}, ui: { elements: { messagesContainer: {} }, setCallSpeaking() {} },
        addEventListener() {}
    };
    mg._speakCallLine = method('_speakCallLine', deps);
    mg._speakPreloadedOpening = method('_speakPreloadedOpening', deps);
    return mg;
}

test('_speakPreloadedOpening speaks the opening with the preloaded note', async () => {
    window.gameState = { globalVariables: { flag: false, seen: false } };
    const npc = { id: 'agent', displayName: 'Agent', voiced: true, storyJSON: storyJson, currentKnot: 'start', voice: { name: 'Zephyr' } };
    const mgr = makeNpcManager(npc);
    await PhoneChatConversation.preloadOpening(npc, mgr, new InkEngine('agent'));
    const spoken = [];
    const mg = minigameForCall(spoken);
    mg.npcManager = mgr;
    await mg._speakPreloadedOpening(mgr.history);
    assert.deepEqual(spoken, [
        { id: 'agent', text: 'Opening line.', delivery: 'calm and low' },
        { id: 'agent', text: 'Second line, no note.', delivery: null }
    ]);
});

// ---- 2. reopen re-run -----------------------------------------------------------------------

const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

async function savedAtCall() {
    window.gameState = { globalVariables: { flag: false, seen: false } };
    const conv = new PhoneChatConversation('agent', { getNPC: () => null }, new InkEngine('agent'));
    await conv.loadStory(storyJson);
    syncGlobals(conv.engine.story);
    conv.goToKnot('call');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    return conv.saveState();
}

test('reopenWithCurrentGlobals returns the note of each fresh line, a tag on an empty step carried forward', async () => {
    const saved = await savedAtCall();
    window.gameState.globalVariables.flag = true;      // the knot now diverts to `fresh`
    const conv = new PhoneChatConversation('agent', { getNPC: () => null }, new InkEngine('agent'));
    await conv.loadStory(storyJson);
    assert.equal(conv.restoreState(saved), true);
    const out = conv.reopenWithCurrentGlobals(syncGlobals);
    assert.equal(out.renavigated, true);
    assert.deepEqual(out.messages, ['Agent: Fresh line one.', 'Agent: Fresh line two.', 'Agent: Fresh line three.']);
    assert.equal(out.messageTags.length, out.messages.length, 'parallel to the messages');
    assert.deepEqual(out.messageTags.map(t => deliveryFromTags(t)), ['firm', 'urgent', null]);
});

test('a reopened voiced call hands each fresh line\'s note to the line it types (_presentReopened -> _presentOutput)', async () => {
    const saved = await savedAtCall();
    window.gameState.globalVariables.flag = true;
    const conv = new PhoneChatConversation('agent', { getNPC: () => null }, new InkEngine('agent'));
    await conv.loadStory(storyJson);
    conv.restoreState(saved);
    const reopen = conv.reopenWithCurrentGlobals(syncGlobals);

    const shown = [];
    const deps = { processGameActionTags() {}, deliveryFromTags };
    const mg = {
        currentNPCId: 'agent', isConversationActive: true, _pendingNpcMessages: [],
        ui: { showNotification() {}, addChoices() {} },
        async _showStoryLine(raw, delay, delivery) { shown.push({ raw, delivery }); return true; },
        _endingKeptGoing: async () => false, _tagOptions: () => ({}), _releaseForcedCall() {}, _finishPretextCall: () => false,
        saveStoryState() {}
    };
    mg._presentOutput = method('_presentOutput', deps);
    mg._presentReopened = method('_presentReopened', deps);
    await mg._presentReopened(reopen);
    assert.deepEqual(shown, [
        { raw: 'Agent: Fresh line one.', delivery: 'firm' },
        { raw: 'Agent: Fresh line two.', delivery: 'urgent' },
        { raw: 'Agent: Fresh line three.', delivery: null }
    ]);
});

test('the minigame\'s reopen branch goes through _presentReopened', () => {
    assert.match(src, /if \(reopen\.renavigated\) \{\s*this\._presentReopened\(reopen\);/);
});

// ---- 3. the typed line: a call speaks it with its note, a silent thread never speaks (m2) ----

function lineMinigame(params) {
    const spoken = [];
    const deps = {
        whenSessionOverlayClosed: async () => {}, classifyPhoneLine: speaker.classifyPhoneLine, isVoicedCall: voice.isVoicedCall
    };
    const mg = {
        params, isConversationActive: true, _typeoutRun: 1, currentNPCId: 'agent',
        ui: { showTypingIndicator() {}, hideTypingIndicator() {}, scrollToBottom() {}, async addMessage() {} },
        history: { addMessage() {} },
        async _speakCallLine(line, raw, opts) { spoken.push({ raw, opts }); }
    };
    mg._showStoryLine = method('_showStoryLine', deps);
    return { mg, spoken };
}

test('_showStoryLine on a voiced call speaks the line with its note', async () => {
    const { mg, spoken } = lineMinigame({ voiced: true });
    assert.equal(await mg._showStoryLine('Agent: Keep your voice down.', 0, 'hushed'), true);
    assert.deepEqual(spoken, [{ raw: 'Agent: Keep your voice down.', opts: { delivery: 'hushed' } }]);
});

test('_showStoryLine in a silent text thread never speaks, whatever its note', async () => {
    const { mg, spoken } = lineMinigame({});
    assert.equal(await mg._showStoryLine('Agent: Keep your voice down.', 0, 'hushed'), true);
    assert.deepEqual(spoken, []);
});
