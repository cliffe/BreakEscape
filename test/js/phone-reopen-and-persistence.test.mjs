// Phone threads across a reopen and a reload, timed texts across a reload, NPC
// re-registration, and the lockpick interrupt gate (pass-3 approval log E4, E9,
// E10/E13, E12, E16, E21).
// Run with: node --test test/js/phone-reopen-and-persistence.test.mjs
//
// The browser modules are copied to a temp dir as .mjs (the repo has no
// "type": "module"), as in npc-manager-triggers.test.mjs. ink-engine.js reads the
// global `inkjs`, so the vendored runtime is loaded first.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-reopen-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'"));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_reopen.json'), 'utf8').replace(/^﻿/, ''));

function makeDispatcher() {
    const listeners = new Map();
    return {
        count(name) { return (listeners.get(name) || []).length; },
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

function resetWindow(globals = {}) {
    globalThis.window = { gameState: { globalVariables: { ...globals } } };
}

// ---------------------------------------------------------------- E10 / E13

// The engine's sync: write gameState's globals into the story (npc-conversation-state.js)
const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

async function openAtHub() {
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(storyJson);
    syncGlobals(conv.engine.story);
    conv.goToKnot('start');
    const seen = [];
    let r;
    do { r = conv.continue(); if (r.text) seen.push(r.text.trim()); } while (!r.choices?.length && !r.hasEnded);
    return { conv, seen, saved: conv.saveState() };
}

async function reopen(saved) {
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(storyJson);
    assert.equal(conv.restoreState(saved), true);
    return { conv, out: conv.reopenWithCurrentGlobals(syncGlobals) };
}

test('reopen with unchanged globals keeps the saved choices and runs nothing', async () => {
    resetWindow({ flag: false, reacted: false, extra_option: false });
    const { seen, saved } = await openAtHub();
    assert.deepEqual(seen, ['Agent: What do you need?']);
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, false);
    assert.deepEqual(conv.engine.currentChoices.map(c => c.text), ['Option A']);
    assert.equal(conv.engine.story.variablesState.hub_visits, 1, 'the knot was not re-run');
});

test('a changed global re-runs the knot but replays none of its leading text or tags', async () => {
    resetWindow({ flag: false, reacted: false, extra_option: false });
    const { saved } = await openAtHub();
    window.gameState.globalVariables.extra_option = true;     // changes choices only
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, true);
    assert.equal(out.knot, 'hub');
    assert.deepEqual(out.messages, [], '"What do you need?" is already in the thread');
    assert.deepEqual(out.tags, [], 'the leading #note tag is not processed again');
    assert.equal(out.replayedSteps, 1);
    assert.deepEqual(out.result.choices.map(c => c.text), ['Option A', 'Extra option']);
    assert.deepEqual(conv.engine.currentChoices.map(c => c.text), ['Option A', 'Extra option']);
});

test('a state re-check at the top of the knot still diverts, and the new branch is shown with its tags', async () => {
    resetWindow({ flag: false, reacted: false, extra_option: false });
    const { saved } = await openAtHub();
    window.gameState.globalVariables.flag = true;
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, true);
    assert.deepEqual(out.messages, ['Agent: You found it.', 'Agent: Good work.']);
    assert.deepEqual(out.tags, ['complete_task:report_find']);
    assert.deepEqual(out.result.choices.map(c => c.text), ['Option A', 'About the find']);
    assert.equal(conv.engine.story.variablesState.reacted, true);
});

test('the baseline run writes no globals through the observer', async () => {
    resetWindow({ flag: false, reacted: false, extra_option: false });
    const { saved } = await openAtHub();
    window.gameState.globalVariables.flag = true;
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(storyJson);
    conv.restoreState(saved);
    const writes = [];
    conv.engine.story.variablesState.variableChangedEvent = (name, value) => writes.push([name, value?.valueObject ?? value]);
    conv.reopenWithCurrentGlobals(syncGlobals);
    // syncGlobals writes each global once (unchanged values included); the real re-run
    // writes hub_visits and reacted = true once each. A leaking baseline would add a
    // second hub_visits write.
    assert.equal(writes.filter(([n]) => n === 'hub_visits').length, 1);
    assert.deepEqual(writes.filter(([n, v]) => n === 'reacted' && v === true), [['reacted', true]]);
    assert.equal(typeof conv.engine.story.variablesState.variableChangedEvent, 'function', 'observer re-attached');
});

// A scenario currentKnot that isn't `start` (m02 HaX: "first_call"), regression from
// the m02 run (games 1334, 1346): after the first call ran to DONE, a reopen restarted
// at `start`, which still had first_contact = true and replayed the call.
const firstCallJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_first_call.json'), 'utf8').replace(/^\uFEFF/, ''));

function drain(conv) {
    const lines = [];
    let r;
    do { r = conv.continue(); if (r.text) lines.push(r.text.trim()); } while (!r.choices?.length && !r.hasEnded);
    return { lines, choices: (r.choices || []).map(c => c.text) };
}

test('a first entry at a non-start knot goes through `start` when that is the same opening, so a restart skips the intro', async () => {
    resetWindow();
    const npc = { id: 'hax', currentKnot: 'first_call' };
    const conv = new PhoneChatConversation('hax', { getNPC: () => npc }, new InkEngine('hax'));
    await conv.loadStory(firstCallJson);
    assert.equal(conv.resolveEntryKnot('first_call'), 'start');
    conv.goToEntryKnot(npc.currentKnot);
    const first = drain(conv);
    assert.deepEqual(first.lines, ['Agent: You\'re in. Good.', 'Agent: Front desk first.']);
    conv.makeChoice(0);                         // Understood -> hub
    assert.deepEqual(drain(conv).choices, ['Got any advice?', "I'm good for now"]);
    conv.makeChoice(1);                         // I'm good for now -> DONE
    drain(conv);
    assert.equal(conv.getCurrentState().hasEnded, true);

    // Reopen: the saved story has ended, so the engine restarts it
    assert.equal(conv.restartAfterEnd(), true);
    const again = drain(conv);
    assert.deepEqual(again.lines, [], 'the intro is not replayed');
    assert.deepEqual(again.choices, ['Got any advice?', "I'm good for now"]);
});

test('entering the intro knot directly (the old behaviour) is what replayed it', async () => {
    resetWindow();
    const npc = { id: 'hax', currentKnot: 'first_call' };
    const conv = new PhoneChatConversation('hax', { getNPC: () => npc }, new InkEngine('hax'));
    await conv.loadStory(firstCallJson);
    conv.goToKnot('first_call');
    drain(conv); conv.makeChoice(0); drain(conv); conv.makeChoice(1); drain(conv);
    conv.restartAfterEnd();
    assert.deepEqual(drain(conv).lines, ['Agent: You\'re in. Good.', 'Agent: Front desk first.']);
});

test('a non-start knot with a different opening from `start` is kept', async () => {
    resetWindow();
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(firstCallJson);
    assert.equal(conv.resolveEntryKnot('other_intro'), 'other_intro');
    assert.equal(conv.resolveEntryKnot('no_such_knot'), 'no_such_knot');
    assert.equal(conv.engine.story.variablesState.first_contact, true, 'the dry runs changed nothing');
});

test('the shared preload records the whole opening in order, writes no globals and defers tags', async () => {
    resetWindow({ hub_visits: 0 });
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'hax', npcType: 'phone', storyJSON: firstCallJson, currentKnot: 'first_call' });
    const n = await PhoneChatConversation.preloadOpening(m.getNPC('hax'), m, new InkEngine('hax'));
    assert.equal(n, 2);
    // Texts arriving before the player first opens the thread come after the intro
    m.addMessage('hax', 'npc', 'Later text', { timed: true });
    assert.deepEqual(m.getConversationHistory('hax').map(x => [x.text, !!x.preloaded]),
        [["Agent: You're in. Good.", true], ['Agent: Front desk first.', true], ['Later text', false]]);
    assert.ok(m.getNPC('hax').storyState, 'position saved at the choices');
    assert.equal(await PhoneChatConversation.preloadOpening(m.getNPC('hax'), m, new InkEngine('hax')), 0,
        'a contact with a thread is not preloaded again');

    const r = new NPCManager(makeDispatcher(), null);
    r.registerNPC({ id: 'hub', npcType: 'phone', storyJSON: storyJson, currentKnot: 'start' });
    await PhoneChatConversation.preloadOpening(r.getNPC('hub'), r, new InkEngine('hub'));
    assert.equal(window.gameState.globalVariables.hub_visits, 0, 'no global written during the preload');
    assert.deepEqual(r.getNPC('hub').deferredGlobals, { hub_visits: 1 });
    assert.deepEqual(r.getNPC('hub').deferredTags, ['note:leading']);
});

test('the inventory and phone-chat preloads both use the shared preload', () => {
    for (const f of ['systems/inventory.js', 'minigames/phone-chat/phone-chat-minigame.js']) {
        assert.ok(readFileSync(join(js, f), 'utf8').includes('PhoneChatConversation.preloadOpening('), f);
    }
});

test('opening a thread updates the HUD phone badge straight away', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.match(src, /this\.history\.markAllRead\(\);\s*\n\s*if \(window\.updatePhoneBadge && this\.phoneId\) window\.updatePhoneBadge\(this\.phoneId\);/);
});

// ---------------------------------------------------------------- E9 / E16

function phoneManager() {
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'hax', npcType: 'phone', storyPath: 'hax.json', currentKnot: 'start' });
    m.registerNPC({ id: 'recruiter', npcType: 'phone', storyPath: 'recruiter.json', currentKnot: 'start' });
    return m;
}

test('a phone thread, its read state and story position survive a reload', () => {
    resetWindow();
    const before = phoneManager();
    before.addMessage('hax', 'npc', 'Intro', { preloaded: true, read: true });
    before.addMessage('hax', 'player', 'Hi');
    before.addMessage('hax', 'npc', 'Timed guidance', { timed: true });          // unread
    before.addMessage('recruiter', 'npc', 'We should talk.', { timed: true });  // not in npcIds
    before.getNPC('hax').storyState = '{"fake":"state"}';
    before.getNPC('hax').deferredTags = ['complete_task:x'];
    const saved = JSON.parse(JSON.stringify(before.exportPhoneState()));
    assert.deepEqual(Object.keys(saved).sort(), ['hax', 'recruiter']);

    // Reload: restored before the NPCs register (game.js), applied as they do
    const after = new NPCManager(makeDispatcher(), null);
    after.restorePhoneState(saved);
    after.registerNPC({ id: 'hax', npcType: 'phone', storyPath: 'hax.json', currentKnot: 'start' });
    after.registerNPC({ id: 'recruiter', npcType: 'phone', storyPath: 'recruiter.json', currentKnot: 'start' });
    assert.deepEqual(after.getConversationHistory('hax').map(m => [m.type, m.text, m.read]),
        [['npc', 'Intro', true], ['player', 'Hi', true], ['npc', 'Timed guidance', false]]);
    assert.equal(after.getNPC('hax').storyState, '{"fake":"state"}');
    assert.deepEqual(after.getNPC('hax').deferredTags, ['complete_task:x']);
    // Badge: hax's unread text, plus the recruiter's, who is listed only by his thread
    assert.equal(after.getTotalUnreadCount('player_phone', ['hax']), 2);
});

test('a saved story position is dropped if the NPC now runs a different story', () => {
    resetWindow();
    const after = new NPCManager(makeDispatcher(), null);
    after.restorePhoneState({ hax: { history: [{ type: 'npc', text: 'x', read: true }], storyState: '{}', storyPath: 'old.json' } });
    after.registerNPC({ id: 'hax', npcType: 'phone', storyPath: 'new.json' });
    assert.equal(after.getNPC('hax').storyState, undefined);
    assert.equal(after.getConversationHistory('hax').length, 1);
});

test('the unload flush sends only threads changed since the last confirmed sync', () => {
    resetWindow();
    const m = phoneManager();
    m.addMessage('hax', 'npc', 'One');
    m.addMessage('recruiter', 'npc', 'Two');
    m.markPhoneStateSynced(m.exportPhoneState());
    assert.deepEqual(m.exportPhoneState({ onlyChanged: true }), {});
    m.addMessage('hax', 'npc', 'Three');
    assert.deepEqual(Object.keys(m.exportPhoneState({ onlyChanged: true })), ['hax']);
});

test('the phone-chat explicit-knot path files history under the NPC id (E16)', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.ok(!src.includes('conversationHistory.set(this.npcId'), 'this.npcId is undefined in the minigame');
    assert.ok(src.includes('conversationHistory.set(npcId, filteredHistory)'));
});

test('a text notification without its own knot reopens the thread rather than jumping to currentKnot', () => {
    const barks = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    assert.ok(!/startKnot:\s*startKnot\s*\|\|\s*\(npcData && npcData\.currentKnot\)/.test(barks));
    resetWindow();
    const shown = [];
    const m = new NPCManager(makeDispatcher(), { showBark: p => shown.push(p) });
    m.registerNPC({ id: 'hax', npcType: 'phone', currentKnot: 'event_call' });
    m.scheduleTimedMessage({ npcId: 'hax', text: 'Plain text', delay: 0 });
    m.scheduleTimedMessage({ npcId: 'hax', text: 'Targeted', delay: 0, targetKnot: 'taunt_t5' });
    m._checkTimedMessages();
    assert.deepEqual(shown.map(p => p.startKnot), [null, 'taunt_t5']);
});

test('a phone opened at an explicit knot uses it once, for its own contact', () => {
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.ok(src.includes('this._startKnotUsed = true'));
    assert.ok(src.includes('delete params.startKnot'), 'the return from the notepad is a plain reopen');
});

// ---------------------------------------------------------------- E12

test('a mapping text still counting down survives a reload, and skipIfGlobal is checked at delivery', () => {
    resetWindow({ done: false });
    const before = new NPCManager(makeDispatcher(), null);
    before.registerNPC({ id: 'hax', npcType: 'phone' });
    const config = { handlerIndex: 0, once: true, cooldown: 0,
        sendTimedMessage: { message: 'Delayed', delay: 8000 } };
    const config2 = { handlerIndex: 1, once: true, cooldown: 0,
        sendTimedMessage: { message: 'Skipped later', delay: 8000, skipIfGlobal: 'done' } };
    before._handleEventMapping('hax', 'item_picked_up:x', config, {});
    before._handleEventMapping('hax', 'item_picked_up:y', config2, {});
    const saved = JSON.parse(JSON.stringify(before.exportTimedMessages()));
    assert.equal(saved.pending.length, 2);
    assert.ok(saved.pending[0].remainingMs > 7000 && saved.pending[0].remainingMs <= 8000);

    const after = new NPCManager(makeDispatcher(), null);
    after.restoreTimedMessages(saved);
    after.registerNPC({ id: 'hax', npcType: 'phone' });
    window.gameState.globalVariables.done = true;
    after.gameStartTime -= 9000;            // let the delay run out
    after._checkTimedMessages();
    assert.deepEqual(after.getConversationHistory('hax').map(m => m.text), ['Delayed']);
    assert.deepEqual(after.exportTimedMessages().pending, []);
});

test('a restored text waits for its NPC to register rather than being dropped', () => {
    resetWindow();
    const after = new NPCManager(makeDispatcher(), null);
    after.restoreTimedMessages({ pending: [{ id: 'map:x', npcId: 'hax', text: 'Hello', remainingMs: 0 }] });
    after._checkTimedMessages();                       // hax not registered yet
    after.registerNPC({ id: 'hax', npcType: 'phone' });
    after._checkTimedMessages();
    assert.deepEqual(after.getConversationHistory('hax').map(m => m.text), ['Hello']);
});

test("an NPC's own timed texts are neither repeated nor lost across a reload", () => {
    resetWindow();
    const def = () => ({ id: 'hax', npcType: 'phone', timedMessages: [
        { message: 'At start', delay: 0 },
        { message: 'After event', delay: 20000, waitForEvent: 'global_variable_changed:go' }
    ] });
    const before = new NPCManager(makeDispatcher(), null);
    before.registerNPC(def());
    before._checkTimedMessages();                                      // "At start" delivered
    before.eventDispatcher.emit('global_variable_changed:go', {});      // second one counting down
    const saved = JSON.parse(JSON.stringify(before.exportTimedMessages()));
    assert.deepEqual(saved.delivered, ['npc:hax:0']);
    assert.deepEqual(saved.pending.map(p => p.id), ['npc:hax:1']);

    const after = new NPCManager(makeDispatcher(), null);
    after.restoreTimedMessages(saved);
    after.registerNPC(def());
    after._checkTimedMessages();
    assert.deepEqual(after.getConversationHistory('hax').map(m => m.text), [], 'nothing repeats');
    after.gameStartTime -= 21000;
    after._checkTimedMessages();
    assert.deepEqual(after.getConversationHistory('hax').map(m => m.text), ['After event']);
});

// ---------------------------------------------------------------- E21

test('re-registering an NPC keeps one set of listeners, one set of timed texts and its chat state', () => {
    resetWindow();
    const d = makeDispatcher();
    window.eventDispatcher = d;
    const m = new NPCManager(d, null);
    const def = () => ({ id: 'guard', npcType: 'person', roomId: 'checkpoint',
        eventMappings: [{ eventPattern: 'lockpick_used_in_view', cooldown: 0, setGlobal: { caught: true } }],
        timedMessages: [{ message: 'Hi', delay: 0 }] });
    m.registerNPC(def());
    m.getNPC('guard').storyState = 'saved';
    m.registerNPC(def());
    assert.equal(d.count('lockpick_used_in_view'), 1);
    assert.equal(m.timedMessages.length, 1);
    assert.equal(m.getNPC('guard').storyState, 'saved');
    let fired = 0;
    d.on('global_variable_changed:caught', () => fired++);
    window.gameState.globalVariables.caught = false;
    d.emit('lockpick_used_in_view', {});
    assert.equal(fired, 1, 'a cooldown-0 mapping fires once per event');
});

// ---------------------------------------------------------------- E4

function gateManager(mapping) {
    const m = new NPCManager(makeDispatcher(), null);
    m.registerNPC({ id: 'guard', npcType: 'person', roomId: 'corridor', eventMappings: [
        { eventPattern: 'lockpick_used_in_view', conversationMode: 'person-chat', targetKnot: 'caught', ...mapping }
    ] });
    return m;
}

test('the lockpick gate interrupts when the mapping would fire', () => {
    resetWindow();
    const m = gateManager({ cooldown: 3000 });
    assert.equal(m.shouldInterruptLockpickingWithPersonChat('corridor')?.id, 'guard');
});

test('the lockpick gate lets the pick go ahead while the mapping is on cooldown', () => {
    resetWindow();
    const m = gateManager({ cooldown: 30000 });
    m.triggeredEvents.set('guard:lockpick_used_in_view:0', { count: 1, lastTime: Date.now() - 1000 });
    assert.equal(m.shouldInterruptLockpickingWithPersonChat('corridor'), null);
    m.triggeredEvents.set('guard:lockpick_used_in_view:0', { count: 1, lastTime: Date.now() - 31000 });
    assert.equal(m.shouldInterruptLockpickingWithPersonChat('corridor')?.id, 'guard');
});

test('the lockpick gate honours the condition and onceOnly', () => {
    resetWindow({ guard_on_break: true });
    const m = gateManager({ condition: '!globalVars.guard_on_break' });
    assert.equal(m.shouldInterruptLockpickingWithPersonChat('corridor'), null);
    window.gameState.globalVariables.guard_on_break = false;
    assert.equal(m.shouldInterruptLockpickingWithPersonChat('corridor')?.id, 'guard');

    const once = gateManager({ onceOnly: true });
    once.triggeredEvents.set('guard:lockpick_used_in_view:0', { count: 1, lastTime: 0 });
    assert.equal(once.shouldInterruptLockpickingWithPersonChat('corridor'), null);
});
