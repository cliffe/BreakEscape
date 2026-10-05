// Global variable sync between gameState and the ink stories:
//  1. only the scenario's declared globals (and global_* names) sync; a key an
//     old save still holds after the scenario renamed it away does not;
//  2. #set_global / #set_variable emit global_variable_changed only on a change,
//     as an ink assignment does;
//  3. a phone intro's deferred globals are applied on first open only if nothing
//     has set them since the preload.
// Run with: node --test test/js/global-sync-declared.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in
// phone-reopen-and-persistence.test.mjs. Uses the vendored inkjs and the
// fixture test/js/fixtures/global_sync.ink (compiled to .json).

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'global-sync-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('utils/room-display-name.js', 'room-display-name.mjs');
copy('minigames/helpers/chat-helpers.js', 'chat-helpers.mjs',
    s => s.replace("'../../utils/room-display-name.js'", "'./room-display-name.mjs'"));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');

globalThis.window = { gameState: { globalVariables: {} } };
const inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
globalThis.inkjs = inkjs;
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { processGameActionTags } = await import(pathToFileURL(join(dir, 'chat-helpers.mjs')).href);
const { default: stateSingleton } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const StateManager = stateSingleton.constructor;

const fixtureText = readFileSync(join(here, 'fixtures/global_sync.json'), 'utf8').replace(/^﻿/, '');
const fixtureJson = JSON.parse(fixtureText);

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

// A scenario declaring mission_phase and briefing_seen, resumed from a save that
// still holds guard_hostile (renamed away since) and an engine-only key.
function setup({ declared = { mission_phase: 'day', briefing_seen: false }, saved = {} } = {}) {
    const manager = new StateManager();
    const dispatcher = makeDispatcher();
    globalThis.window = {
        gameScenario: { globalVariables: { ...declared } },
        gameState: { globalVariables: { ...declared } },
        eventDispatcher: dispatcher,
        npcConversationStateManager: manager,
        npcManager: { inkEngineCache: new Map() },
        NPCGameBridge: {} // processGameActionTags skips every tag without it
    };
    // As game.js: record the declared set, then merge the save in
    manager.setDeclaredGlobals(Object.keys(declared));
    Object.assign(window.gameState.globalVariables, saved);
    return { manager, dispatcher };
}

const newStory = () => new inkjs.Story(fixtureText);
const changeEvents = (dispatcher, name) =>
    dispatcher.emitted.filter(([e]) => e === `global_variable_changed:${name}`);

// ------------------------------------------------------------------ item 1

test('isGlobalVariable: declared names and global_* only, not every key gameState holds', () => {
    const { manager } = setup({ saved: { guard_hostile: true, ransomware_deadline_at: 123 } });
    assert.equal(manager.isGlobalVariable('mission_phase'), true);
    assert.equal(manager.isGlobalVariable('global_anything'), true);
    assert.equal(manager.isGlobalVariable('guard_hostile'), false, 'an old save key is not a global');
    assert.equal(manager.isGlobalVariable('ransomware_deadline_at'), false);
    assert.equal(window.gameState.globalVariables.guard_hostile, true, 'the saved key stays in gameState');
});

test('the declared set is fixed at load: a runtime key added to gameState does not join it', () => {
    const { manager } = setup();
    window.gameState.globalVariables.runtime_only = true;
    window.gameScenario.globalVariables.runtime_only = true; // some minigames write here too
    assert.equal(manager.isGlobalVariable('runtime_only'), false);
});

test('without a recorded set it reads the scenario, and with no scenario gameState (unit harnesses)', () => {
    const manager = new StateManager();
    globalThis.window = { gameScenario: { globalVariables: { a: 1 } }, gameState: { globalVariables: { a: 1, b: 2 } } };
    assert.equal(manager.isGlobalVariable('a'), true);
    assert.equal(manager.isGlobalVariable('b'), false);
    globalThis.window = { gameState: { globalVariables: { b: 2 } } };
    assert.equal(manager.isGlobalVariable('b'), true);
});

test('an old save key does not overwrite the ink VAR of the same name; declared ones do', () => {
    const { manager } = setup({ saved: { mission_phase: 'night', guard_hostile: true } });
    const story = newStory();
    manager.syncGlobalVariablesToStory(story);
    assert.equal(story.variablesState.mission_phase, 'night');
    assert.equal(story.variablesState.guard_hostile, false, 'the ink keeps its own guard_hostile');
});

test('an ink assignment to a local VAR sharing an old save key stays local', () => {
    const { manager, dispatcher } = setup({ saved: { guard_hostile: false } });
    const story = newStory();
    manager.syncGlobalVariablesToStory(story);
    manager.observeGlobalVariableChanges(story, 'guard');
    story.ChoosePathString('hub');
    story.Continue();
    story.ChooseChoiceIndex(0);
    story.Continue();
    assert.equal(story.variablesState.guard_hostile, true);
    assert.equal(window.gameState.globalVariables.guard_hostile, false, 'not written to gameState');
    assert.equal(changeEvents(dispatcher, 'guard_hostile').length, 0);
    assert.deepEqual(manager.syncGlobalVariablesFromStory(story), []);

    // ...and it is saved and restored as the NPC's own variable
    manager.recordInkVariables('guard', story);
    assert.equal(manager.exportNpcInkVariables().guard.guard_hostile, true);
    const reloaded = newStory();
    manager.applySavedInkVariables('guard', reloaded);
    assert.equal(reloaded.variablesState.guard_hostile, true);
});

test('broadcast reaches loaded stories for declared globals only', () => {
    const { manager } = setup({ saved: { guard_hostile: false } });
    const story = newStory();
    window.npcManager.inkEngineCache.set('guard', { story });
    manager.broadcastGlobalVariableChange('guard_hostile', true, null);
    manager.broadcastGlobalVariableChange('mission_phase', 'night', null);
    assert.equal(story.variablesState.guard_hostile, false);
    assert.equal(story.variablesState.mission_phase, 'night');
});

test('game.js records the declared globals before merging the saved ones', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    const record = src.indexOf('setDeclaredGlobals?.(Object.keys(gameScenario.globalVariables');
    const merge = src.indexOf('Object.assign(window.gameState.globalVariables, gameScenario.savedGlobalVariables)');
    assert.ok(record > 0 && merge > 0 && record < merge);
});

// ------------------------------------------------------------------ #set_global writes through (the emit-on-change change was dropped: m02 relied on the repeat emit)

test('an unchanged #set_global still writes the value through to loaded stories', async () => {
    setup({ saved: { briefing_seen: true } });
    const story = newStory(); // holds briefing_seen = false
    window.npcManager.inkEngineCache.set('other', { story });
    await processGameActionTags(['set_global:briefing_seen:true'], null);
    assert.equal(story.variablesState.briefing_seen, true);
});

// ------------------------------------------------------------------ item 3

async function preload(currentKnot = 'intro') {
    const m = new NPCManager(window.eventDispatcher, null);
    m.registerNPC({ id: 'hax', npcType: 'phone', storyJSON: fixtureJson, currentKnot });
    await PhoneChatConversation.preloadOpening(m.getNPC('hax'), m, new InkEngine('hax'));
    return m;
}

test('the preload defers an intro global with its preload-time value', async () => {
    setup({ saved: { guard_hostile: false } });
    const m = await preload();
    const npc = m.getNPC('hax');
    assert.equal(window.gameState.globalVariables.briefing_seen, false, 'nothing written during the preload');
    assert.deepEqual(npc.deferredGlobals, { briefing_seen: true });
    assert.deepEqual(npc.deferredGlobalsBase, { briefing_seen: false });
});

test('first open applies a deferred global nothing has set since', async () => {
    const { dispatcher } = setup();
    const npc = (await preload()).getNPC('hax');
    const out = PhoneChatConversation.applyDeferredGlobals(npc);
    assert.deepEqual(out, { applied: ['briefing_seen'], kept: [] });
    assert.equal(window.gameState.globalVariables.briefing_seen, true);
    assert.equal(changeEvents(dispatcher, 'briefing_seen').length, 1);
    assert.equal(npc.deferredGlobals, null);
    assert.equal(npc.deferredGlobalsBase, null);
});

test('first open keeps a newer value set after the preload', async () => {
    const { dispatcher } = setup({ declared: { mission_phase: 'day', briefing_seen: false } });
    const npc = (await preload()).getNPC('hax');
    // Something else set it since (here to a different value than the intro's)
    npc.deferredGlobals = { briefing_seen: true, mission_phase: 'briefed' };
    npc.deferredGlobalsBase = { briefing_seen: false, mission_phase: 'day' };
    window.gameState.globalVariables.mission_phase = 'night';
    const out = PhoneChatConversation.applyDeferredGlobals(npc);
    assert.deepEqual(out, { applied: ['briefing_seen'], kept: ['mission_phase'] });
    assert.equal(window.gameState.globalVariables.mission_phase, 'night');
    assert.equal(changeEvents(dispatcher, 'mission_phase').length, 0);
});

test('a deferred global already holding its value is not re-emitted; a legacy one without a base still applies', () => {
    const { dispatcher } = setup();
    window.gameState.globalVariables.briefing_seen = true;
    const npc = { id: 'hax', deferredGlobals: { briefing_seen: true, mission_phase: 'night' } };
    const out = PhoneChatConversation.applyDeferredGlobals(npc);
    assert.deepEqual(out, { applied: ['mission_phase'], kept: ['briefing_seen'] });
    assert.equal(changeEvents(dispatcher, 'briefing_seen').length, 0);
    assert.equal(window.gameState.globalVariables.mission_phase, 'night');
});

test('an undeclared deferred global (an older save) is not applied', () => {
    setup({ saved: { guard_hostile: false } });
    const npc = { id: 'hax', deferredGlobals: { guard_hostile: true }, deferredGlobalsBase: { guard_hostile: false } };
    assert.deepEqual(PhoneChatConversation.applyDeferredGlobals(npc), { applied: [], kept: ['guard_hostile'] });
    assert.equal(window.gameState.globalVariables.guard_hostile, false);
});

test('the preload-time values survive a reload with the phone state', async () => {
    setup();
    const before = await preload();
    const saved = JSON.parse(JSON.stringify(before.exportPhoneState()));
    assert.deepEqual(saved.hax.deferredGlobalsBase, { briefing_seen: false });
    const after = new NPCManager(window.eventDispatcher, null);
    after.registerNPC({ id: 'hax', npcType: 'phone', storyJSON: fixtureJson, currentKnot: 'intro' });
    after.restorePhoneState(saved);
    assert.deepEqual(after.getNPC('hax').deferredGlobals, { briefing_seen: true });
    assert.deepEqual(after.getNPC('hax').deferredGlobalsBase, { briefing_seen: false });
});

test('the phone-chat minigame applies deferred globals through the guarded helper', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.ok(src.includes('PhoneChatConversation.applyDeferredGlobals(npc)'));
    assert.ok(!/deferredGlobals\)\.forEach/.test(src), 'no unguarded write loop left');
});
