// Phone chat closed (or switched to another contact) while it is still loading.
// m09/m10 dressing playtests logged two page errors when the handler's thread was
// opened and closed quickly:
//   "Cannot read properties of undefined (reading 'style')": Close during start()'s
//     preloadIntroMessages(); start() then called openConversation() on the torn-down
//     UI (elements = {}) and showConversation() read contactListView.style.
//   "Cannot read properties of null (reading 'storyJson')": Close during
//     openConversation()'s story fetch; cleanup() nulled this.conversation and the
//     voiced-call line after the await read this.conversation.storyJson.
// start() and openConversation() are lifted out of the source and run on stubs.
// Run with: node --test test/js/phone-chat-close-race.test.mjs
// (PHONE_CHAT_MINIGAME=<path> runs it against another copy of phone-chat-minigame.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcPath = process.env.PHONE_CHAT_MINIGAME ||
    join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js');
const src = readFileSync(srcPath, 'utf8');
// The engine logs emoji-heavy lines; quiet them (bin/test-js: runner IPC mis-framing)
console.log = () => {};

const deferred = () => {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
};
const tick = () => new Promise(r => setTimeout(r, 0));

// Module imports the two methods use, passed in as parameters
const INJECT = ['PhoneChatHistory', 'PhoneChatConversation', 'isVoicedCall', 'voicedCallKnots',
    'callStartKnots', 'callHomeKnot', 'attachPretext', 'processGameActionTags'];

function asyncMethod(name, deps) {
    const m = src.match(new RegExp(`\\n    async ${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const body = m[2].replace('super.start();', 'this._superStart();');
    const factory = new Function(...INJECT, `return async function (${m[1]}) {\n${body}\n};`);
    return factory(...INJECT.map(k => deps[k]));
}

function harness({ loadStory }) {
    const conversations = [];
    class PhoneChatConversation {
        constructor(npcId) { this.npcId = npcId; this.engine = { story: {} }; conversations.push(this); }
        static async waitForPreload() {}
        static isPreloadedOpening() { return false; }
        loadStory(source) { this.storyJson = { root: [] }; return loadStory(this, source); }
        goToEntryKnot() {}
        goToKnot() {}
    }
    class PhoneChatHistory {
        loadHistory() { return []; }
        markAllRead() {}
    }
    const deps = {
        PhoneChatHistory, PhoneChatConversation,
        isVoicedCall: () => true,            // the handler's calls in m10 are voiced
        voicedCallKnots: () => ['start'],
        callStartKnots: () => ['start'], callHomeKnot: () => 'start',
        attachPretext: async () => null, processGameActionTags: () => {}
    };
    const ui = {
        elements: { contactListView: { style: {} }, conversationView: { style: {} } },
        // as PhoneChatUI.showConversation / showContactList: touch the views' style
        showConversation() {
            this.elements.contactListView.style.display = 'none';
            this.elements.conversationView.style.display = 'flex';
        },
        showContactList() {
            this.elements.conversationView.style.display = 'none';
            this.elements.contactListView.style.display = 'flex';
        },
        addMessages() {}, showNotification() {},
        cleanup() { this.elements = {}; }    // PhoneChatUI.cleanup() leaves elements = {}
    };
    const npcs = {
        agent_0x99: { id: 'agent_0x99', displayName: 'Agent HaX', storyPath: 'm.json', currentKnot: 'start' },
        other: { id: 'other', displayName: 'Other', storyPath: 'o.json', currentKnot: 'start' }
    };
    const mg = {
        params: { voiced: true },
        gameState: { isActive: false },
        npcManager: { getNPC: id => npcs[id] },
        inkEngine: {},
        ui,
        opens: [],
        continued: [],
        _superStart() { this.gameState.isActive = true; },
        preloadIntroMessages: async () => {},
        _beginSocialRun() {},
        continueStory() { mg.continued.push(this.conversation?.npcId); },
        showCurrentChoices() {},
        saveStoryState() {},
        // as complete(false) + cleanup(): what the Close button does
        close() {
            this.gameState.isActive = false;
            this.ui.cleanup();
            this.isConversationActive = false;
            this.conversation = null;
            this.history = null;
        }
    };
    const open = asyncMethod('openConversation', deps);
    mg.openConversation = function (id) { const p = open.call(this, id); mg.opens.push(p); return p; };
    mg.start = asyncMethod('start', deps);
    return { mg, conversations };
}

test('Close while the intros preload: start() does not open the torn-down thread (was "reading \'style\'")', async () => {
    globalThis.window = { breakEscapeConfig: { gameId: 1 } };
    try {
        const { mg } = harness({ loadStory: async () => true });
        const preload = deferred();
        mg.preloadIntroMessages = () => preload.promise;
        mg.currentNPCId = 'agent_0x99';
        const started = mg.start();
        mg.close();                      // Close clicked during the preload fetches
        preload.resolve();
        await started;
        for (const p of mg.opens) await p;   // was an unhandled rejection
        assert.equal(mg.continued.length, 0);
    } finally {
        delete globalThis.window;
    }
});

test('Close during the story fetch: openConversation() stops quietly (was "reading \'storyJson\'")', async () => {
    globalThis.window = { breakEscapeConfig: { gameId: 1 } };
    try {
        const fetch = deferred();
        const { mg } = harness({ loadStory: () => fetch.promise });
        mg.gameState.isActive = true;
        const opening = mg.openConversation('agent_0x99');
        await tick();
        mg.close();                      // Close clicked while /ink?npc=agent_0x99 is in flight
        fetch.resolve(true);
        await opening;
        assert.equal(mg.isConversationActive, false, 'a closed phone is not made active again');
        assert.equal(mg.continued.length, 0, 'no story run on a closed phone');
    } finally {
        delete globalThis.window;
    }
});

test('Another contact opened during the fetch: the first open does not run on the second\'s thread', async () => {
    globalThis.window = { breakEscapeConfig: { gameId: 1 } };
    try {
        const first = deferred();
        const { mg, conversations } = harness({
            loadStory: (conv) => conv.npcId === 'agent_0x99' ? first.promise : Promise.resolve(true)
        });
        mg.gameState.isActive = true;
        const a = mg.openConversation('agent_0x99');
        await tick();
        const b = mg.openConversation('other');
        await b;
        first.resolve(true);
        await a;
        assert.equal(mg.conversation, conversations[1]);
        assert.deepEqual(mg.continued, ['other'], 'only the open thread runs its story');
    } finally {
        delete globalThis.window;
    }
});
