// Run-scoped email_ ink variables and loader order (00 S7, plan item 0.4).
// Run with: bundle exec node --test test/js/social-ink-vars.test.mjs
//
// - email_* VARs never reach recordInkVariables or exportNpcInkVariables; other
//   NPC-local VARs and the global filter behave as before.
// - An engine-written VAR set through applyEngineVariables survives the loader's
//   restore and sync, because the loaders call it last; both chat loaders do.
// Uses the vendored inkjs and the fixture test/js/fixtures/social_ink_vars.ink.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));

globalThis.window = {
    gameScenario: { globalVariables: { door_open: false } },
    gameState: { globalVariables: { door_open: true } }
};

const src = readFileSync(join(js, 'systems/npc-conversation-state.js'), 'utf8');
const manager = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
const freshManager = () => new manager.constructor();

const storyJson = readFileSync(join(here, 'fixtures/social_ink_vars.json'), 'utf8').replace(/^﻿/, '');
const loadStory = () => new inkjs.Story(storyJson);
const v = (story, name) => story.variablesState.$(name);

function storyAfterSend() {
    const story = loadStory();
    story.variablesState.$('met_player', true);
    story.variablesState.$('email_landed', true);
    story.variablesState.$('email_first_fail', 'senderTrust');
    story.variablesState.$('email_fail_count', 2);
    return story;
}

test('isRunScopedVariable matches the email_ prefix only', () => {
    const m = freshManager();
    for (const name of ['email_landed', 'email_slot_document', 'email_']) assert.equal(m.isRunScopedVariable(name), true, name);
    for (const name of ['met_player', 'my_email_seen', 'emailed', 'door_open', null, 3]) assert.equal(m.isRunScopedVariable(name), false, String(name));
});

test('recordInkVariables leaves out email_ VARs and keeps the rest as before', () => {
    const m = freshManager();
    m.recordInkVariables('mira', storyAfterSend());
    assert.deepEqual(m.getNPCState('mira').variables, { met_player: true, engine_turn: 0 });
});

test('exportNpcInkVariables leaves out email_ VARs, even ones saved by saveNPCState', () => {
    const m = freshManager();
    m.saveNPCState('mira', storyAfterSend());
    // saveNPCState keeps them in memory (in-session state)...
    assert.equal(m.getNPCState('mira').variables.email_landed, true);
    // ...but nothing run-scoped goes to the server, and globals still do not
    const exported = JSON.parse(JSON.stringify(m.exportNpcInkVariables()));
    assert.deepEqual(exported, { mira: { met_player: true, engine_turn: 0 } });
});

test('a reload seeds no email_ value back into a story', () => {
    const before = freshManager();
    before.recordInkVariables('mira', storyAfterSend());
    const saved = JSON.parse(JSON.stringify(before.exportNpcInkVariables()));
    const after = freshManager();
    after.importNpcInkVariables(saved);
    const story = loadStory();
    after.applySavedInkVariables('mira', story);
    assert.equal(v(story, 'met_player'), true);
    assert.equal(v(story, 'email_landed'), false);
    assert.equal(v(story, 'email_first_fail'), '');
});

test('applyEngineVariables does nothing with no writers and no values', () => {
    const m = freshManager();
    const story = loadStory();
    assert.equal(m.applyEngineVariables('mira', story, { channel: 'person-chat' }), 0);
    assert.equal(v(story, 'engine_turn'), 0);
    assert.equal(m.applyEngineVariables('mira', null), 0);
});

test('applyEngineVariables sets writer values and caller values, declared VARs only', () => {
    const m = freshManager();
    const seen = [];
    m.registerEngineVariableWriter('turns', ctx => { seen.push([ctx.npcId, ctx.channel]); return { engine_turn: 4, not_declared: 1 }; });
    m.registerEngineVariableWriter('broken', () => { throw new Error('boom'); });
    const story = loadStory();
    const n = m.applyEngineVariables('mira', story, { channel: 'mail', values: { email_landed: true } });
    assert.equal(n, 2);
    assert.deepEqual(seen, [['mira', 'mail']]);
    assert.equal(v(story, 'engine_turn'), 4);
    assert.equal(v(story, 'email_landed'), true);
    m.unregisterEngineVariableWriter('turns');
    m.unregisterEngineVariableWriter('broken');
    assert.equal(m.applyEngineVariables('mira', loadStory()), 0);
});

test('order: an engine-written VAR set after restore and sync survives both', () => {
    const m = freshManager();
    // A saved mid-conversation state that holds an old engine_turn and an old global
    const first = loadStory();
    first.variablesState.$('engine_turn', 1);
    first.ChoosePathString('start');
    while (first.canContinue) first.Continue();
    m.saveNPCState('mira', first);
    assert.ok(m.getNPCState('mira').storyState, 'full state saved (story at a choice)');

    m.registerEngineVariableWriter('turns', () => ({ engine_turn: 7 }));
    const story = loadStory();
    // The person-chat loader's order: restore, sync, (re-navigate), sync again, engine VARs
    assert.equal(m.restoreNPCState('mira', story), true);
    m.syncGlobalVariablesToStory(story);
    m.syncGlobalVariablesToStory(story);
    m.applyEngineVariables('mira', story, { channel: 'person-chat' });
    assert.equal(v(story, 'engine_turn'), 7, 'restore would have left 1');
    assert.equal(v(story, 'door_open'), true, 'the sync still applied');
    // A restore after the engine write would undo it: the reason for the order
    m.restoreNPCState('mira', story);
    assert.equal(v(story, 'engine_turn'), 1);
});

// The loaders are DOM-bound; check where they call applyEngineVariables in the source.
function indexOrFail(text, needle, from = 0) {
    const i = text.indexOf(needle, from);
    assert.ok(i >= 0, `missing: ${needle}`);
    return i;
}

test('person-chat applies engine VARs after the restore and the last sync, before the first dialogue', () => {
    const s = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
    const restore = indexOrFail(s, 'npcConversationStateManager.restoreNPCState(');
    const event = indexOrFail(s, 'startEventConversation({');
    const sync1 = indexOrFail(s, 'npcConversationStateManager.syncGlobalVariablesToStory(this.inkEngine.story)', restore);
    const sync2 = indexOrFail(s, 'npcConversationStateManager.syncGlobalVariablesToStory(this.inkEngine.story)', sync1 + 1);
    const inv2 = indexOrFail(s, 'npcConversationStateManager.syncInventoryVariablesToStory(this.inkEngine.story, this.npc)', sync2);
    const apply = indexOrFail(s, 'npcConversationStateManager.applyEngineVariables(this.npcId, this.inkEngine.story', inv2);
    const show = indexOrFail(s, 'this.showCurrentDialogue();', apply);
    assert.ok(event < sync1 && restore < sync1 && sync2 < apply && apply < show);
    assert.equal(s.split('applyEngineVariables(').length - 1, 1, 'one call, after everything');
});

test('phone-chat applies engine VARs after its sync on both open paths and in the preload', () => {
    const s = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    // Restored thread: inside the reopen callback, after the sync, before any re-run
    const reopen = indexOrFail(s, 'this.conversation.reopenWithCurrentGlobals(story => {');
    const sync = indexOrFail(s, 'syncGlobalVariablesToStory(story);', reopen);
    const apply1 = indexOrFail(s, "applyEngineVariables?.(npcId, story, { channel: 'phone-chat' })", sync);
    assert.ok(apply1 < indexOrFail(s, '});', sync));
    // First open or explicit knot: after the restore-and-sync for the knot, before navigating
    const knotSync = indexOrFail(s, 'syncGlobalVariablesToStory(this.conversation.engine?.story)');
    const apply2 = indexOrFail(s, "applyEngineVariables?.(npcId, this.conversation.engine?.story, { channel: 'phone-chat' })", knotSync);
    const nav = indexOrFail(s, 'this.conversation.goToKnot(targetKnot);', apply2);
    assert.ok(apply2 < nav && apply2 < indexOrFail(s, 'this.conversation.goToEntryKnot(targetKnot);', apply2));

    const c = readFileSync(join(js, 'minigames/phone-chat/phone-chat-conversation.js'), 'utf8');
    const pre = indexOrFail(c, 'static async _preloadOpeningOnce(');
    const saved = indexOrFail(c, 'applySavedInkVariables?.(npc.id, tempConversation.engine?.story)', pre);
    const apply3 = indexOrFail(c, "applyEngineVariables?.(npc.id, tempConversation.engine?.story, { channel: 'phone-preload' })", saved);
    assert.ok(apply3 < indexOrFail(c, 'tempConversation.goToEntryKnot(entryKnot);', apply3));
});

// Behavioural (R-10): the phone preload really runs the story, so the first line it
// produces must read the engine value, not the saved one or the ink default.
test('phone preload: the first line reads the engine-written VAR over the saved one', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { pathToFileURL } = await import('node:url');
    const dir = mkdtempSync(join(tmpdir(), 'social-ink-vars-'));
    const copy = (rel, name, fix = (x) => x) => writeFileSync(join(dir, name), fix(readFileSync(join(js, rel), 'utf8')));
    copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
    copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
        (x) => x.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
    copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
    globalThis.inkjs = inkjs;
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try {
        const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
        const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);

        async function preload(withWriter) {
            const m = freshManager();
            // a reload: the server sent back mira's own ink flags, engine_turn 1 among them
            m.importNpcInkVariables({ mira: { met_player: true, engine_turn: 1 } });
            if (withWriter) m.registerEngineVariableWriter('turns', () => ({ engine_turn: 7 }));
            window.npcConversationStateManager = m;
            const history = [];
            const npc = { id: 'mira', storyJSON: JSON.parse(storyJson) };
            const npcManager = {
                getNPC: (id) => (id === 'mira' ? npc : null),
                getConversationHistory: () => history,
                addMessage: (id, who, text) => history.push(text)
            };
            await PhoneChatConversation._preloadOpeningOnce(npc, npcManager, new InkEngine('mira'));
            return history;
        }
        assert.deepEqual(await preload(false), ['Turn 1.'], 'without a writer the saved value is read');
        assert.deepEqual(await preload(true), ['Turn 7.'], 'the engine value is set after the restore');
    } finally {
        console.log = log; console.warn = warn;
        delete window.npcConversationStateManager;
    }
});
