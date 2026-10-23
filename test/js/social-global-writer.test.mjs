// The shared global writer, systems/global-writer.js (00 S3; plan 0.2, packet P0-D):
//  - emitAlways emits on a same-value write (applyActions set_global, back-compat 1);
//    the default emits only on a change; deferEmit emits nothing and returns events
//    only for changed names;
//  - the broadcast reaches only cached stories that declare the name;
//  - the calling story and the open chat's story are written with the observer
//    detached, and the observer is restored (or deleted when it had none);
//  - a clamped value is written back to the calling story;
//  - an ink assignment followed by a bound external in one Continue() is not lost
//    (spike F1: ink sets 100, the external adds 1, the result is 101).
// Run with: bundle exec node --test test/js/social-global-writer.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in global-sync-declared.test.mjs.
// Fixture: test/js/fixtures/social/global_writer/writer_probe.ink (compiled to .json).

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-global-writer-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('utils/display-dashes.js', 'display-dashes.mjs');
copy('systems/apply-actions.js', 'apply-actions.mjs', s => s
    .replace("'../utils/display-dashes.js'", "'./display-dashes.mjs'")
    .replace("'./global-writer.js'", "'./global-writer.mjs'")
    .replace("'./social-intel.js'", "'./social-intel.mjs'"));
copy('systems/social-intel.js', 'social-intel.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
globalThis.inkjs = inkjs;
const { default: stateSingleton } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const StateManager = stateSingleton.constructor;
const { writeGlobal, readGlobal, emitGlobalEvents, writeStoryDetached, getOpenChat } =
    await import(pathToFileURL(join(dir, 'global-writer.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { applyActions } = await import(pathToFileURL(join(dir, 'apply-actions.mjs')).href);

const probeText = readFileSync(join(here, 'fixtures/social/global_writer/writer_probe.json'), 'utf8').replace(/^﻿/, '');
const otherText = readFileSync(join(here, 'fixtures/global_sync.json'), 'utf8').replace(/^﻿/, '');

const quiet = (fn) => {
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; }
};

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

// trust and briefing_seen are declared scenario globals; local_note is not.
function setup() {
    const manager = new StateManager();
    const dispatcher = makeDispatcher();
    const declared = { trust: 0, briefing_seen: false, mission_phase: 'day' };
    globalThis.window = {
        gameScenario: { globalVariables: { ...declared } },
        gameState: { globalVariables: { ...declared } },
        eventDispatcher: dispatcher,
        npcConversationStateManager: manager,
        npcManager: { inkEngineCache: new Map() }
    };
    manager.setDeclaredGlobals(Object.keys(declared));
    return { manager, dispatcher };
}

const engineFor = (text = probeText) => { const e = new InkEngine('probe'); quiet(() => e.loadStory(text)); return e; };
const changeEvents = (dispatcher, name = 'trust') =>
    dispatcher.emitted.filter(([e]) => e === `global_variable_changed:${name}`);
const ownObserver = (story) => Object.prototype.hasOwnProperty.call(story.variablesState, 'variableChangedEvent');
const line = (story) => quiet(() => story.Continue()).trim();

// A chat as the minigames set one up: synced, then observed (person and phone
// chats both load through PhoneChatConversation.loadStory, which does this)
function chatEngine(manager, npcId) {
    const engine = engineFor();
    quiet(() => {
        manager.syncGlobalVariablesToStory(engine.story);
        manager.observeGlobalVariableChanges(engine.story, npcId);
    });
    return engine;
}

// ------------------------------------------------------------------ emission

test('applyActions set_global: the same value emits again (back-compat 1)', () => {
    const { dispatcher } = setup();
    quiet(() => {
        applyActions([{ type: 'set_global', key: 'trust', value: 3 }]);
        applyActions([{ type: 'set_global', key: 'trust', value: 3 }]);
        applyActions([{ type: 'set_global', key: 'trust', value: 3 }]);
    });
    const events = changeEvents(dispatcher);
    assert.equal(events.length, 3);
    assert.deepEqual(events.map(([, d]) => d), [{ name: 'trust', value: 3 }, { name: 'trust', value: 3 }, { name: 'trust', value: 3 }]);
    assert.equal(window.gameState.globalVariables.trust, 3);
});

test('applyActions set_global: an undeclared key is still written and emitted, as before', () => {
    const { dispatcher } = setup();
    quiet(() => applyActions([{ type: 'set_global', key: 'engine_only', value: 'x' }]));
    assert.equal(window.gameState.globalVariables.engine_only, 'x');
    assert.equal(changeEvents(dispatcher, 'engine_only').length, 1);
});

test('applyActions set_global: broadcast reaches cached stories that declare the name, and leaves the open chat alone', () => {
    const { manager } = setup();
    const cached = engineFor();
    const other = engineFor(otherText); // declares briefing_seen and mission_phase, not trust
    window.npcManager.inkEngineCache.set('cached', cached);
    window.npcManager.inkEngineCache.set('other', other);
    const open = chatEngine(manager, 'sarah');
    window.MinigameFramework = { currentMinigame: { npcId: 'sarah', inkEngine: open } };
    quiet(() => applyActions([{ type: 'set_global', key: 'trust', value: 7 }]));
    assert.equal(cached.story.variablesState.$('trust'), 7);
    assert.equal(other.story.variablesState._defaultGlobalVariables.has('trust'), false);
    assert.equal(open.story.variablesState.$('trust'), 0, 'open chat untouched: the contract adds only the broadcast');
});

test('default write emits only on a change', () => {
    const { dispatcher } = setup();
    const r1 = quiet(() => writeGlobal('trust', 0));
    assert.equal(r1.changed, false);
    assert.equal(changeEvents(dispatcher).length, 0);
    const r2 = quiet(() => writeGlobal('trust', 2));
    assert.equal(r2.changed, true);
    assert.equal(r2.previous, 0);
    assert.deepEqual(changeEvents(dispatcher).map(([, d]) => d), [{ name: 'trust', value: 2 }]);
    quiet(() => writeGlobal('trust', 2));
    assert.equal(changeEvents(dispatcher).length, 1);
    quiet(() => writeGlobal('trust', 2, { emitAlways: true }));
    assert.equal(changeEvents(dispatcher).length, 2, 'emitAlways emits on the same value');
});

test('deferEmit emits nothing and returns events only for changed names', () => {
    const { dispatcher } = setup();
    const results = quiet(() => [
        writeGlobal('trust', 5, { deferEmit: true }),
        writeGlobal('briefing_seen', false, { deferEmit: true }), // unchanged
        writeGlobal('mission_phase', 'night', { deferEmit: true })
    ]);
    assert.equal(dispatcher.emitted.length, 0);
    assert.equal(window.gameState.globalVariables.trust, 5, 'the value is written at once');
    const events = results.flatMap(r => r.events);
    assert.deepEqual(events.map(e => e.event), ['global_variable_changed:trust', 'global_variable_changed:mission_phase']);
    emitGlobalEvents(events);
    assert.deepEqual(dispatcher.emitted, [
        ['global_variable_changed:trust', { name: 'trust', value: 5 }],
        ['global_variable_changed:mission_phase', { name: 'mission_phase', value: 'night' }]
    ]);
});

test('deferEmit with emitAlways returns the event for an unchanged value', () => {
    const { dispatcher } = setup();
    const r = quiet(() => writeGlobal('trust', 0, { deferEmit: true, emitAlways: true }));
    assert.equal(dispatcher.emitted.length, 0);
    assert.equal(r.events.length, 1);
});

// ------------------------------------------------------------------ the observer

test('calling story: written with its observer detached, then the same observer restored', () => {
    const { manager, dispatcher } = setup();
    const engine = chatEngine(manager, 'sarah');
    const observer = engine.story.variablesState.variableChangedEvent;
    assert.equal(ownObserver(engine.story), true);
    // gameState stale on purpose (control B in F1): an attached observer would echo
    let seen = 0;
    engine.story.variablesState.variableChangedEvent = (...a) => { seen++; observer(...a); };
    const wrapped = engine.story.variablesState.variableChangedEvent;
    const r = quiet(() => writeGlobal('trust', 9, { engine }));
    assert.equal(r.storiesWritten, 1);
    assert.equal(engine.story.variablesState.$('trust'), 9);
    assert.equal(seen, 0, 'the observer never ran');
    assert.equal(engine.story.variablesState.variableChangedEvent, wrapped, 'restored');
    assert.equal(engine.story.__beChangedGlobals.size, 0, 'not in the touched set');
    assert.equal(changeEvents(dispatcher).length, 1, 'one emit, from the writer');
});

test('a story with no own observer is restored with delete, not left with an own property', () => {
    setup();
    const engine = engineFor(); // a bark-style engine: nothing attached
    assert.equal(ownObserver(engine.story), false);
    quiet(() => writeGlobal('trust', 4, { engine }));
    assert.equal(engine.story.variablesState.$('trust'), 4);
    assert.equal(ownObserver(engine.story), false);
    assert.equal(typeof engine.story.variablesState.variableChangedEvent, 'function', 'inkjs dispatcher inherited again');
});

test('the observer is restored even when the write throws', () => {
    const { manager } = setup();
    const engine = chatEngine(manager, 'sarah');
    const observer = engine.story.variablesState.variableChangedEvent;
    manager.setDeclaredVariable = () => { throw new Error('boom'); };
    const ok = quiet(() => writeStoryDetached(engine.story, 'trust', 1));
    assert.equal(ok, false);
    assert.equal(engine.story.variablesState.variableChangedEvent, observer);
    const bare = engineFor();
    quiet(() => writeStoryDetached(bare.story, 'trust', 1));
    assert.equal(ownObserver(bare.story), false);
});

test('a story that does not declare the name, or a non-global name, is not written', () => {
    setup();
    const other = engineFor(otherText);
    const probe = engineFor();
    const r1 = quiet(() => writeGlobal('trust', 3, { engine: other }));
    assert.equal(r1.storiesWritten, 0);
    const r2 = quiet(() => writeGlobal('local_note', 3, { engine: probe }));
    assert.equal(r2.storiesWritten, 0, 'local_note is the ink\'s own VAR, not a global');
    assert.equal(probe.story.variablesState.$('local_note'), 0);
    assert.equal(window.gameState.globalVariables.local_note, 3, 'gameState still takes it');
});

// ------------------------------------------------------------------ the open chat

test('open person chat: a write between lines reaches the next line', () => {
    const { manager, dispatcher } = setup();
    const engine = chatEngine(manager, 'sarah');
    window.MinigameFramework = { currentMinigame: { npcId: 'sarah', inkEngine: engine } };
    assert.deepEqual(getOpenChat(), { engine, npcId: 'sarah' });
    engine.goToKnot('start');
    assert.equal(line(engine.story), 'Line one: 0');
    const r = quiet(() => writeGlobal('trust', 5));
    assert.equal(r.storiesWritten, 1);
    assert.equal(line(engine.story), 'Line two: 5');
    assert.equal(line(engine.story), 'Hub reads 5');
    assert.equal(changeEvents(dispatcher).length, 1);
    // ink then adds one: the observer emits once, the writer not again
    quiet(() => engine.story.ChooseChoiceIndex(1));
    assert.equal(line(engine.story), 'Ink added one: 6');
    assert.equal(window.gameState.globalVariables.trust, 6);
    assert.deepEqual(changeEvents(dispatcher).map(([, d]) => d.value), [5, 6]);
});

test('open phone chat: a write at a choice point shows after the choice; the NPC id is checked', () => {
    const { manager } = setup();
    const engine = chatEngine(manager, 'hax');
    window.MinigameFramework = { currentMinigame: { currentNPCId: 'hax', inkEngine: engine } };
    engine.goToKnot('hub');
    assert.equal(line(engine.story), 'Hub reads 0');
    const skipped = quiet(() => writeGlobal('trust', 3, { npcId: 'someone_else' }));
    assert.equal(skipped.storiesWritten, 0, 'the engine holds another contact\'s story');
    assert.equal(engine.story.variablesState.$('trust'), 0);
    const r = quiet(() => writeGlobal('trust', 7, { npcId: 'hax' }));
    assert.equal(r.storiesWritten, 1);
    quiet(() => engine.story.ChooseChoiceIndex(0));
    assert.equal(line(engine.story), 'Again reads 7');
});

test('the calling engine and the open chat are written once each, never twice', () => {
    const { manager } = setup();
    const engine = chatEngine(manager, 'sarah');
    window.MinigameFramework = { currentMinigame: { npcId: 'sarah', inkEngine: engine } };
    const r = quiet(() => writeGlobal('trust', 2, { engine }));
    assert.equal(r.storiesWritten, 1);
    const mail = engineFor(); // a runner's private engine, beside the open chat
    const r2 = quiet(() => writeGlobal('trust', 3, { engine: mail }));
    assert.equal(r2.storiesWritten, 2);
    assert.equal(mail.story.variablesState.$('trust'), 3);
    assert.equal(engine.story.variablesState.$('trust'), 3);
});

// ------------------------------------------------------------------ clamp

test('clamp: the clamped value goes to gameState and back into the calling story', () => {
    const { manager, dispatcher } = setup();
    const engine = chatEngine(manager, 'priya');
    const r = quiet(() => writeGlobal('trust', 150, { engine, clamp: { min: -100, max: 100 } }));
    assert.equal(r.value, 100);
    assert.equal(window.gameState.globalVariables.trust, 100);
    assert.equal(engine.story.variablesState.$('trust'), 100);
    assert.deepEqual(changeEvents(dispatcher).at(-1)[1], { name: 'trust', value: 100 });
});

test('clamp write-back: an ink write out of range is clamped in the story that wrote it', () => {
    const { manager, dispatcher } = setup();
    const engine = chatEngine(manager, 'priya');
    // A watcher like P0-F's: on the change event, write the clamped value back
    dispatcher.on('global_variable_changed:trust', ({ value }) => {
        if (value < -100 || value > 100) writeGlobal('trust', value, { engine, clamp: { min: -100, max: 100 } });
    });
    engine.goToKnot('overshoot');
    assert.equal(line(engine.story), 'Overshoot: -120');
    assert.equal(line(engine.story), 'After write-back: -100');
    assert.equal(window.gameState.globalVariables.trust, -100);
    assert.equal(engine.story.variablesState.$('trust'), -100);
    assert.deepEqual(changeEvents(dispatcher).map(([, d]) => d.value), [-120, -100]);
    // a later ink assignment starts from the engine's value
    quiet(() => { engine.story.ChoosePathString('hub'); });
    assert.equal(line(engine.story), 'Hub reads -100');
});

// ------------------------------------------------------------------ inside Continue() (spike F1)

function bindBump(engine) {
    engine.story.BindExternalFunction('gw_bump', (n) => writeGlobal('trust', v => v + n, { engine }).value);
}

test('a bound external writes the calling story and shows on the same line', () => {
    const { manager, dispatcher } = setup();
    const engine = chatEngine(manager, 'sarah');
    bindBump(engine);
    engine.goToKnot('bump');
    assert.equal(line(engine.story), 'Returned 4, var now 4');
    assert.equal(line(engine.story), 'Next line: 4');
    assert.equal(window.gameState.globalVariables.trust, 4);
    assert.equal(changeEvents(dispatcher).length, 1, 'one emit, from the writer; the observer adds none');
});

test('F1 hazard: ink sets 100 then calls the external with +1 in one Continue(): 101', () => {
    const { manager, dispatcher } = setup();
    window.gameState.globalVariables.trust = 4; // gameState holds an older value
    const engine = chatEngine(manager, 'sarah');
    bindBump(engine);
    engine.goToKnot('assign_then_bump');
    assert.equal(line(engine.story), 'After assign and bump: 101');
    assert.equal(window.gameState.globalVariables.trust, 101);
    assert.equal(engine.story.variablesState.$('trust'), 101);
    const values = changeEvents(dispatcher).map(([, d]) => d.value);
    assert.deepEqual(values, [101], 'one emit; ink\'s held-back 100 is never emitted');
});

test('readGlobal: the calling story\'s value when it declares the name, else gameState', () => {
    setup();
    window.gameState.globalVariables.trust = 1;
    const engine = engineFor();
    quiet(() => engine.story.variablesState.$('trust', 50));
    assert.equal(readGlobal('trust', { engine }), 50);
    assert.equal(readGlobal('trust'), 1);
    assert.equal(readGlobal('trust', { engine: engineFor(otherText) }), 1);
    assert.equal(readGlobal('local_note', { engine }), undefined, 'not a global: gameState, which lacks it');
});

test('no gameState: the writer does nothing and throws nothing', () => {
    globalThis.window = {};
    const r = writeGlobal('trust', 1);
    assert.equal(r.changed, false);
    assert.deepEqual(r.events, []);
});
