// A4 review round 1 m4: a thread row (`type: 'call'`) is not a conversation. A contact whose only
// history is a missed call still gets its opening preloaded and its story started fresh. These
// check behaviour of the three filters (phone-chat-conversation.js `_preloadOpeningOnce` twice,
// phone-chat-minigame.js `openConversation`); phone-call-log.test.mjs keeps a source-text guard too.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

console.log = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-rows-not-conv-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_first_call.json'), 'utf8').replace(/^﻿/, ''));
const dispatcher = { on() {}, off() {}, emit() {} };

function phone() {
    globalThis.window = { gameState: { globalVariables: {} } };
    const m = new NPCManager(dispatcher, null);
    m.registerNPC({ id: 'ghost', npcType: 'phone', storyJSON: storyJson, currentKnot: 'first_call' });
    return { m, npc: m.getNPC('ghost') };
}

test('m4: a contact whose only history is a missed-call row still preloads its opening', async () => {
    const { m, npc } = phone();
    m.addCallRow('ghost', 'missed');
    const n = await PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    assert.equal(n, 2, 'the opening is preloaded');
    assert.deepEqual(m.getConversationHistory('ghost').filter(x => x.type !== 'call').map(x => x.text),
        ["Agent: You're in. Good.", 'Agent: Front desk first.']);
    assert.equal(npc.preloadedKnot, 'first_call');
    assert.equal(m.getConversationHistory('ghost').filter(x => x.type === 'call').length, 1, 'the row stays');
});

test('m4: a row that arrives while the story loads does not cancel the preload (second check)', async () => {
    const { m, npc } = phone();
    const run = PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    m.addCallRow('ghost', 'missed');
    assert.equal(await run, 2);
    assert.equal(m.getConversationHistory('ghost').filter(x => x.type === 'npc').length, 2);
});

test('m4: a real line that arrives while the story loads still cancels it (the check is not dropped)', async () => {
    const { m, npc } = phone();
    const run = PhoneChatConversation.preloadOpening(npc, m, new InkEngine('ghost'));
    m.addMessage('ghost', 'npc', 'Already shown');
    assert.equal(await run, 0);
});

// ---- phone-chat-minigame.js openConversation (lifted out of the source, as in phone-chat-close-race) ----

const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
const INJECT = ['PhoneChatHistory', 'PhoneChatConversation', 'isVoicedCall', 'voicedCallKnots',
    'callStartKnots', 'callHomeKnot', 'attachPretext', 'processGameActionTags'];
function lifted(deps) {
    const mm = src.match(/\n    async openConversation\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
    assert.ok(mm, 'openConversation found');
    const factory = new Function(...INJECT, `return async function (${mm[1]}) {\n${mm[2]}\n};`);
    return factory(...INJECT.map(k => deps[k]));
}

async function openWith(history) {
    const seen = { restore: 0, entry: [], knot: [], continued: 0, preloadedFirstOpenArgs: null };
    class Conv {
        constructor() { this.engine = { story: {} }; }
        static async waitForPreload() {}
        static isPreloadedOpening(npc, knot, hist) { seen.preloadedFirstOpenArgs = hist.length; return false; }
        async loadStory() { this.storyJson = { root: [] }; return true; }
        restoreState() { seen.restore += 1; return true; }
        goToEntryKnot(k) { seen.entry.push(k); }
        goToKnot(k) { seen.knot.push(k); }
        reopenWithCurrentGlobals() { return null; }
    }
    class Hist { loadHistory() { return history; } markAllRead() {} }
    const npc = { id: 'caller', displayName: 'Caller', storyPath: 'x.json', currentKnot: 'start', storyState: 'saved-state' };
    const mg = {
        params: {}, gameState: { isActive: true }, phoneId: 'player_phone',
        npcManager: { getNPC: () => npc }, inkEngine: {},
        ui: { showConversation() {}, addMessages() {}, showNotification() {} },
        _refreshCallButton() {}, _beginSocialRun() {}, _showRestoredThread() {}, saveStoryState() {},
        continueStory() { seen.continued += 1; },
    };
    mg.openConversation = lifted({
        PhoneChatHistory: Hist, PhoneChatConversation: Conv, isVoicedCall: () => false, voicedCallKnots: () => [],
        callStartKnots: () => new Set(), callHomeKnot: () => 'start', attachPretext: async () => null, processGameActionTags() {},
    });
    globalThis.window = { breakEscapeConfig: { gameId: 1 } };
    await mg.openConversation('caller');
    return seen;
}

test('m4: opening a thread whose only history is a call row starts the story fresh (no restore)', async () => {
    const seen = await openWith([{ type: 'call', callEvent: 'missed', text: 'Missed call', read: false }]);
    assert.equal(seen.restore, 0, 'the saved story state is not restored for a rows-only thread');
    assert.deepEqual(seen.entry, ['start'], 'the story starts at its knot');
    assert.equal(seen.continued, 1);
    assert.equal(seen.preloadedFirstOpenArgs, 0, 'rows are not passed on as conversation history');
});

test('m4: a thread with a real line and a row is restored as before', async () => {
    const seen = await openWith([{ type: 'npc', text: 'Hi', read: true }, { type: 'call', callEvent: 'missed', text: 'Missed call', read: false }]);
    assert.equal(seen.restore, 1);
    assert.deepEqual(seen.entry, []);
});
