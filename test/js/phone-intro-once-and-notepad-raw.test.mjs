// E1: a phone's opening shows once when it is picked up with a knot (the inventory
// preload, then a pickup mapping or currentKnot passing the same knot to phone-chat).
// E6: "Add to Notepad" on a text file stores the file's text as it is.
// Run with: node --test test/js/phone-intro-once-and-notepad-raw.test.mjs
//
// The browser modules are copied to a temp dir as .mjs, as in
// phone-reopen-and-persistence.test.mjs.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-intro-once-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(dir, 'base-minigame.mjs'), 'export class MinigameScene {}\n');
copy('utils/display-dashes.js', 'display-dashes.mjs');
copy('minigames/text-file/text-file-minigame.js', 'text-file-minigame.mjs',
    s => s.replace("'../framework/base-minigame.js'", "'./base-minigame.mjs'")
        .replace("'../../utils/display-dashes.js'", "'./display-dashes.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { textFileNotebookEntry } = await import(pathToFileURL(join(dir, 'text-file-minigame.mjs')).href);

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_first_call.json'), 'utf8').replace(/^﻿/, ''));

function makeDispatcher() {
    const listeners = new Map();
    return {
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function phone(currentKnot = 'first_call') {
    globalThis.window = { gameState: { globalVariables: {} } };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'ghost', npcType: 'phone', storyJSON: storyJson, currentKnot });
    return { m, npc: m.getNPC('ghost') };
}

// ---------------------------------------------------------------- E1

test('two preloads at once (inventory pickup, then phone-chat opening) add the opening once', async () => {
    const { m, npc } = phone();
    const [a, b] = await Promise.all([
        PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost')),
        PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'))
    ]);
    assert.equal(a + b, 2, 'one of them preloaded the two opening lines; the other waited');
    assert.deepEqual(m.getConversationHistory('ghost').map(x => x.text),
        ["Agent: You're in. Good.", 'Agent: Front desk first.']);
    assert.equal(npc.preloadedKnot, 'first_call');
});

test('waitForPreload waits for a preload still running', async () => {
    const { m, npc } = phone();
    const run = PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    await PhoneChatConversation.waitForPreload(npc);
    assert.equal(m.getConversationHistory('ghost').length, 2, 'the lines are in the thread once the wait returns');
    await run;
    await PhoneChatConversation.waitForPreload(npc);   // nothing running: returns at once
});

test('a preload whose thread filled while the story loaded adds nothing', async () => {
    const { m, npc } = phone();
    const run = PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    m.addMessage('ghost', 'npc', 'Already shown by phone-chat');
    assert.equal(await run, 0);
    assert.deepEqual(m.getConversationHistory('ghost').map(x => x.text), ['Already shown by phone-chat']);
});

test('an explicit knot equal to the preloaded one, on an unanswered thread, is a first open', async () => {
    const { m, npc } = phone('start');
    await PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    const thread = () => m.getConversationHistory('ghost').filter(x => !x.isBark && !x.timed);
    assert.equal(PhoneChatConversation.isPreloadedOpening(npc, 'start', thread()), true);
    // A different knot is a new call, appended after the intro
    assert.equal(PhoneChatConversation.isPreloadedOpening(npc, 'relay_call', thread()), false);
    assert.equal(PhoneChatConversation.isPreloadedOpening(npc, null, thread()), false);
    // Once the player has answered, the same knot is a real re-run
    m.addMessage('ghost', 'player', 'Hello');
    assert.equal(PhoneChatConversation.isPreloadedOpening(npc, 'start', thread()), false);
});

test('without a saved preload position, the explicit knot still plays', () => {
    const npc = { id: 'x', preloadedKnot: 'start', storyState: null };
    assert.equal(PhoneChatConversation.isPreloadedOpening(npc, 'start', [{ text: 'a', preloaded: true }]), false);
});

test('phone-chat waits for a running preload and checks the preloaded knot before playing an explicit one', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    const wait = src.indexOf('await PhoneChatConversation.waitForPreload(npc)');
    const load = src.indexOf('const history = this.history.loadHistory()');
    assert.ok(wait > 0 && wait < load, 'wait before reading the thread');
    const check = src.indexOf('PhoneChatConversation.isPreloadedOpening(npc, explicitStartKnot, conversationHistory)');
    const restore = src.indexOf('if (explicitStartKnot && npc.storyState)');
    assert.ok(check > 0 && check < restore, 'the check runs before the explicit-knot restore');
});

test('preloadedKnot is kept across a reload with the rest of the phone state', async () => {
    const { m, npc } = phone('start');
    await PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    const saved = JSON.parse(JSON.stringify(m.exportPhoneState()));
    assert.equal(saved.ghost.preloadedKnot, 'start');
    const after = new NPCManager(makeDispatcher(), null);
    after.restorePhoneState(saved);
    after.registerNPC({ id: 'ghost', npcType: 'phone', storyJSON: storyJson, currentKnot: 'start' });
    assert.equal(after.getNPC('ghost').preloadedKnot, 'start');
    assert.ok(NPCManager.CONVERSATION_RUNTIME_FIELDS.includes('preloadedKnot'));
});

// The m02 Ghost case: the intro assigns a synced global (~ ghost_contacted_player = true)
// and branches on it. The preload holds that write back (deferredGlobals). On first open,
// syncing gameState's older value over the restored story looked like a change and re-ran
// the intro. Applying the deferred globals first leaves nothing to re-run.
const reopenJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_reopen.json'), 'utf8').replace(/^﻿/, ''));
const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

async function firstOpenAfterPreload(applyDeferredFirst) {
    globalThis.window = { gameState: { globalVariables: { hub_visits: 0, flag: false, reacted: false, extra_option: false } } };
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'hub', npcType: 'phone', storyJSON: reopenJson, currentKnot: 'start' });
    const npc = m.getNPC('hub');
    await PhoneChatConversation.preloadOpening(npc, m, new InkEngine('hub'));
    assert.deepEqual(npc.deferredGlobals, { hub_visits: 1 });
    const conv = new PhoneChatConversation('hub', m, new InkEngine('hub'));
    await conv.loadStory(reopenJson);
    assert.equal(conv.restoreState(npc.storyState), true);
    if (applyDeferredFirst) Object.assign(window.gameState.globalVariables, npc.deferredGlobals);
    return conv.reopenWithCurrentGlobals(syncGlobals);
}

test('first open after a preload: deferred globals applied first, so the intro is not re-run', async () => {
    assert.equal((await firstOpenAfterPreload(true)).renavigated, false);
    assert.equal((await firstOpenAfterPreload(false)).renavigated, true, 'the old order re-ran the knot');
});

test('phone-chat applies deferred globals before the reopen sync', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    const apply = src.indexOf('PhoneChatConversation.applyDeferredGlobals(npc)');
    const reopen = src.indexOf('this.conversation.reopenWithCurrentGlobals(');
    assert.ok(apply > 0 && apply < reopen);
    assert.equal(src.split('PhoneChatConversation.applyDeferredGlobals(npc)').length, 2, 'applied in one place');
});

// ---------------------------------------------------------------- E6

test('a text file goes into the notepad as its own text, with no header or footer', () => {
    const cipher = 'Wkh nhb lv lq wkh oleudub.\nLine two -- with dashes';
    const entry = textFileNotebookEntry({ fileName: 'trial_vii.txt', fileContent: cipher, source: 'Unknown Source' });
    assert.equal(entry.content, cipher);
    assert.equal(entry.title, 'Text File - trial_vii.txt');
    assert.doesNotMatch(entry.content, /FILE CONTENTS|End of File|Text File:/);
});

test('the source, when the scenario gives one, goes in the title', () => {
    assert.equal(textFileNotebookEntry({ fileName: 'notes.txt', fileContent: 'x', source: 'Lab PC' }).title,
        'Text File - notes.txt (Lab PC)');
    assert.equal(textFileNotebookEntry({ fileName: 'notes.txt', fileContent: 'x' }).title, 'Text File - notes.txt');
});

test('the text-file minigame uses the raw entry, and the old wrapper is gone', () => {
    const src = readFileSync(join(js, 'minigames/text-file/text-file-minigame.js'), 'utf8');
    assert.ok(src.includes('textFileNotebookEntry(this.textFileData)'));
    assert.ok(!src.includes('formatContentForNotebook'));
    assert.ok(!src.includes('content += `FILE CONTENTS'));
});
