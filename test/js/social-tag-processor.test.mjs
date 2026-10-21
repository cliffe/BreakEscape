// The influence tags in the shared tag processor, minigames/helpers/chat-helpers.js
// processGameActionTags (00 §8 "Influence tags", S5; plan 0.3, packet P0-G).
//  - back-compat 2: m01 Derek's tag sequence still turns him hostile through #hostile, and
//    #influence:-100 still does what it does today (an unknown tag: logged, nothing written);
//  - influence_increased / influence_decreased popups, unspaced and spaced, unchanged;
//  - the hub demos' numeric #influence_gained:N unchanged (unknown tag, nothing written);
//  - #set_global on an imported read-only name still refused;
//  - for a social.characters entry: #influence:N, #influence_gained, #influence_lost and
//    #report write through the service, move the global and fire thresholds;
//  - a non-social NPC with the new tag names gets today's behaviour, service installed or not.
// Run with: bundle exec node --test test/js/social-tag-processor.test.mjs
//
// Browser modules are copied to a temp dir as .mjs, as in social-influence.test.mjs.
// Fixtures: test/js/fixtures/social/tag_processor/ (scenario.json, mara_tags.ink compiled to .json).

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

// Node 18's runner reads each file's results back from the child process; this file's
// console output (the tag processor logs every tag) has broken that read in group runs
// ("Unable to deserialize cloned data", P0-R R-08). Keep the file silent: run() and
// quiet() still capture or drop logs per call, and console.error is left alone.
for (const k of ['log', 'info', 'warn', 'debug']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixtures = join(here, 'fixtures/social/tag_processor');
const dir = mkdtempSync(join(tmpdir(), 'social-tag-processor-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('systems/social-influence.js', 'social-influence.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('utils/global-condition.js', 'global-condition.mjs');
copy('utils/portrait-variants.js', 'portrait-variants.mjs', s => s.replace("'./global-condition.js'", "'./global-condition.mjs'"));
copy('utils/room-display-name.js', 'room-display-name.mjs');
copy('systems/combat-input.js', 'combat-input.mjs');
copy('minigames/helpers/chat-helpers.js', 'chat-helpers.mjs',
    s => s.replace("'../../utils/room-display-name.js'", "'./room-display-name.mjs'")
        .replace("'../../utils/portrait-variants.js'", "'./portrait-variants.mjs'")
        .replace("'../../systems/combat-input.js'", "'./combat-input.mjs'"));

// A minimal DOM: enough for showInfluencePopup to build and remove its nodes.
function makeDocument() {
    const popups = [];
    const el = () => {
        const node = {
            style: {}, children: [], className: '', textContent: '',
            appendChild(c) { node.children.push(c); return c; },
            prepend(c) { node.children.unshift(c); if (c.className.startsWith('influence-popup')) popups.push(c); },
            remove() {}
        };
        return node;
    };
    return { popups, body: el(), createElement: el };
}
globalThis.requestAnimationFrame = (cb) => cb();
globalThis.document = makeDocument();
globalThis.window = { gameState: { globalVariables: {} } };

const inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
globalThis.inkjs = inkjs;
const { default: stateSingleton } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const StateManager = stateSingleton.constructor;
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { installSocialInfluence, uninstallSocialInfluence } =
    await import(pathToFileURL(join(dir, 'social-influence.mjs')).href);
const { processGameActionTags } = await import(pathToFileURL(join(dir, 'chat-helpers.mjs')).href);

const scenarioText = readFileSync(join(fixtures, 'scenario.json'), 'utf8');
const storyText = readFileSync(join(fixtures, 'mara_tags.json'), 'utf8').replace(/^﻿/, '');

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        listeners,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

const NPCS = {
    derek: { id: 'derek', displayName: 'Derek Lawson' },
    kevin_park: { id: 'kevin_park', displayName: 'Kevin Park' },
    npc_chen: { id: 'npc_chen', displayName: 'Dr. Chen' },
    mara_desk: { id: 'mara_desk', displayName: 'Mara Quist' },
    mara_phone: { id: 'mara_phone', displayName: 'Mara Quist' }
};

/**
 * A fresh game with the fixture scenario. social: false strips the `social` key, which is
 * every shipped mission today: then nothing installs. The service, when installed, uses
 * recording hooks.
 */
function setup({ social = true, npcId = null } = {}) {
    const scenario = JSON.parse(scenarioText);
    if (!social) delete scenario.social;
    const manager = new StateManager();
    const dispatcher = makeDispatcher();
    const calls = { hostile: [], toast: [], notify: [], logs: [] };
    // One document for the whole file: showInfluencePopup caches its container.
    document.popups.length = 0;
    globalThis.window = {
        gameScenario: scenario,
        gameState: { globalVariables: { ...scenario.globalVariables } },
        eventDispatcher: dispatcher,
        npcConversationStateManager: manager,
        npcManager: { inkEngineCache: new Map(), getNPC: (id) => NPCS[id] || null },
        npcHostileSystem: { setNPCHostile: (id, on) => calls.hostile.push([id, on]) },
        NPCGameBridge: {},
        currentConversationNPCId: npcId
    };
    manager.setDeclaredGlobals(Object.keys(scenario.globalVariables));
    manager.setReadOnlyGlobals(Object.keys(scenario.importedGlobals || {}));
    const hooks = { now: () => 1000, toast: (text, info) => calls.toast.push({ text, ...info }) };
    const service = quiet(() => installSocialInfluence({ scenario, dispatcher, hooks }));
    const ui = { showNotification: (msg, kind) => calls.notify.push([msg, kind]) };
    return { scenario, manager, dispatcher, calls, service, ui, g: window.gameState.globalVariables };
}

const quiet = (fn) => {
    const { log, warn } = console;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; }
};

/** Run the processor with console captured. */
async function run(tags, ui, logs, options) {
    const { log, warn } = console;
    console.log = (...a) => logs.push(a.join(' '));
    console.warn = (...a) => logs.push(a.join(' '));
    try { return await processGameActionTags(tags, ui, options); } finally { console.log = log; console.warn = warn; }
}

const eventNames = (dispatcher) => dispatcher.emitted.map(([e]) => e);
const settle = () => new Promise(r => setTimeout(r, 0));

test.afterEach(() => uninstallSocialInfluence());

// ------------------------------------------------------------------ back-compat 2 (m01 Derek)

// The tags of m01_derek_confrontation.ink ~303-305, as the person chat hands them over.
const DEREK_TAGS = ['hostile', 'speaker:derek', 'influence:-100', 'add_objective:defeat_derek_hostile'];

for (const social of [false, true]) {
    test(`m01 Derek: #hostile turns him hostile; #influence:-100 is an unknown tag (social key ${social ? 'present' : 'absent'})`, async () => {
        const { calls, dispatcher, ui, g, service } = setup({ social, npcId: 'derek' });
        assert.equal(service === null, !social);
        const before = { ...g };
        const results = await run(DEREK_TAGS, ui, calls.logs);

        assert.deepEqual(calls.hostile, [['derek', true]], 'hostile path called once for derek');
        assert.deepEqual(eventNames(dispatcher), ['npc_became_hostile'], 'only the hostile event');
        assert.deepEqual(dispatcher.emitted[0][1], { npcId: 'derek' });
        assert.equal(calls.notify.length, 1, 'one hostile notification');

        assert.equal(results.length, 3, 'speaker tag filtered out');
        assert.deepEqual(results[1], { action: 'influence', param: '-100', success: false, message: 'ℹ️ Unknown action: influence' });
        assert.ok(calls.logs.includes('ℹ️ Unknown game action tag: influence'), 'logged as today');
        assert.deepEqual(results[2], { action: 'add_objective', param: 'defeat_derek_hostile', success: false, message: 'ℹ️ Unknown action: add_objective' });
        assert.deepEqual(g, before, 'no global written');
        assert.equal(g.influence, undefined);
    });
}

test('m01 Kevin: #hostile:kevin_park targets the named NPC', async () => {
    const { calls, ui } = setup({ social: false, npcId: 'derek' });
    const [r] = await run(['hostile:kevin_park'], ui, calls.logs);
    assert.deepEqual(calls.hostile, [['kevin_park', true]]);
    assert.equal(r.success, true);
});

// ------------------------------------------------------------------ popups, both forms

for (const social of [false, true]) {
    test(`influence_increased / influence_decreased popups, unspaced and spaced (social key ${social ? 'present' : 'absent'})`, async () => {
        const { calls, ui, g, dispatcher } = setup({ social, npcId: 'kevin_park' });
        const before = { ...g };
        const results = await run(['influence_increased', ' influence_increased', 'influence_decreased', ' influence_decreased '], ui, calls.logs);
        assert.deepEqual(results.map(r => [r.action, r.success, r.message]), [
            ['influence_increased', true, '+ Influence: Kevin Park'],
            ['influence_increased', true, '+ Influence: Kevin Park'],
            ['influence_decreased', true, '- Influence: Kevin Park'],
            ['influence_decreased', true, '- Influence: Kevin Park']
        ]);
        // prepend puts the newest first
        assert.deepEqual(document.popups.map(p => [p.className, p.textContent]), [
            ['influence-popup influence-increased', '+ Influence: Kevin Park'],
            ['influence-popup influence-increased', '+ Influence: Kevin Park'],
            ['influence-popup influence-decreased', '- Influence: Kevin Park'],
            ['influence-popup influence-decreased', '- Influence: Kevin Park']
        ]);
        assert.ok(calls.logs.includes('✨ Influence increased with Kevin Park'));
        assert.deepEqual(g, before);
        assert.deepEqual(dispatcher.emitted, []);
    });
}

test('a social character still gets the legacy popup tags exactly as before', async () => {
    const { calls, ui, g, dispatcher } = setup({ npcId: 'mara_desk' });
    const results = await run(['influence_increased'], ui, calls.logs);
    assert.equal(results[0].message, '+ Influence: Mara Quist');
    assert.equal(document.popups.length, 1);
    assert.equal(g.mara_influence, 0, 'the popup tag writes nothing');
    assert.deepEqual(dispatcher.emitted, []);
});

// ------------------------------------------------------------------ hub demos, numeric form

for (const social of [false, true]) {
    test(`hub demo #influence_gained:N / #influence_lost:N stay unknown tags for a non-social NPC (social key ${social ? 'present' : 'absent'})`, async () => {
        const { calls, ui, g, dispatcher } = setup({ social, npcId: 'npc_chen' });
        const before = { ...g };
        const results = await run(['influence_gained:5', 'equipment_repair_started', 'influence_lost:3'], ui, calls.logs);
        assert.deepEqual(results, [
            { action: 'influence_gained', param: '5', success: false, message: 'ℹ️ Unknown action: influence_gained' },
            { action: 'equipment_repair_started', param: '', success: false, message: 'ℹ️ Unknown action: equipment_repair_started' },
            { action: 'influence_lost', param: '3', success: false, message: 'ℹ️ Unknown action: influence_lost' }
        ]);
        assert.ok(calls.logs.includes('ℹ️ Unknown game action tag: influence_gained'));
        assert.deepEqual(g, before);
        assert.deepEqual(dispatcher.emitted, []);
        assert.equal(document.popups.length, 0);
    });
}

test('a non-social NPC with every new tag name gets today\'s behaviour', async () => {
    const tags = ['influence:40', 'influence_gained', 'influence_gained:pushy', 'influence_lost:10:pushy', 'report:maxRefusals', 'report'];
    for (const social of [false, true]) {
        const { calls, ui, g, dispatcher } = setup({ social, npcId: 'kevin_park' });
        const before = { ...g };
        const results = await run(tags, ui, calls.logs);
        assert.deepEqual(results.map(r => [r.success, r.message]),
            results.map(r => [false, `ℹ️ Unknown action: ${r.action}`]));
        assert.deepEqual(g, before);
        assert.deepEqual(dispatcher.emitted, []);
        assert.equal(calls.toast.length, 0);
    }
    // No conversation NPC at all: also today's behaviour
    const { calls, ui, g } = setup({ npcId: null });
    const results = await run(['influence:40', 'report:x'], ui, calls.logs);
    assert.deepEqual(results.map(r => r.message), ['ℹ️ Unknown action: influence', 'ℹ️ Unknown action: report']);
    assert.equal(g.mara_influence, 0);
});

test('#set_global on an imported read-only name is still refused', async () => {
    const { calls, ui, g, dispatcher } = setup({ npcId: 'mara_desk' });
    const [r] = await run(['set_global:old_mission_flag:false'], ui, calls.logs);
    assert.equal(r.success, false);
    assert.match(r.message, /set_global refused: old_mission_flag/);
    assert.equal(g.old_mission_flag, true);
    assert.deepEqual(dispatcher.emitted, []);
});

// ------------------------------------------------------------------ social characters

test('social: #influence:N sets the global absolutely and fires the threshold it crosses', async () => {
    const { calls, ui, g, dispatcher, service } = setup({ npcId: 'mara_desk' });
    const [r] = await run(['influence:-40'], ui, calls.logs);
    assert.equal(r.success, true);
    assert.equal(g.mara_influence, -40);
    assert.equal(g.mara_wary, true, 'wary band flag set');
    assert.deepEqual(service.getLatched('mara'), ['wary']);
    assert.deepEqual(calls.toast.map(t => t.text), ['Mara is wary.']);
    const changed = dispatcher.emitted.filter(([e]) => e === 'npc_influence_changed').map(([, d]) => d);
    assert.equal(changed.length, 1);
    assert.equal(changed[0].character, 'mara');
    assert.equal(changed[0].npcId, 'mara_desk');
    assert.equal(changed[0].delta, -40);
    assert.ok(eventNames(dispatcher).includes('global_variable_changed:mara_influence'));
    assert.equal(document.popups.length, 0, 'no legacy popup');

    // absolute again, from the phone channel: back above the re-arm point clears the band flag
    window.currentConversationNPCId = 'mara_phone';
    const [r2] = await run(['influence:-10:apologised'], ui, calls.logs);
    assert.equal(r2.success, true);
    assert.equal(g.mara_influence, -10);
    assert.equal(g.mara_wary, false, 'cleared at at + rearmMargin');
    assert.deepEqual(service.getLatched('mara'), []);
    assert.equal(service.getLog('mara').at(-1).reason, 'apologised');

    // a non-number is refused for a social character, and writes nothing
    const [r3] = await run(['influence:lots'], ui, calls.logs);
    assert.equal(r3.success, false);
    assert.match(r3.message, /needs a number/);
    assert.equal(g.mara_influence, -10);
});

test('social: #influence_gained / #influence_lost move by N, or by 10 with no number, and keep the reason', async () => {
    const { calls, ui, g, service } = setup({ npcId: 'mara_desk' });
    await run(['influence_lost:15:wrong_name'], ui, calls.logs);
    assert.equal(g.mara_influence, -15);
    await run(['influence_lost'], ui, calls.logs);
    assert.equal(g.mara_influence, -25);
    await run(['influence_lost:urgency'], ui, calls.logs);
    assert.equal(g.mara_influence, -35);
    assert.equal(g.mara_wary, true, 'crossed -30');
    await run(['influence_gained:5'], ui, calls.logs);
    assert.equal(g.mara_influence, -30, 'equality still past the threshold');
    assert.equal(g.mara_wary, true);
    await run(['influence_gained:confirmed_detail'], ui, calls.logs);
    assert.equal(g.mara_influence, -20);
    assert.equal(g.mara_wary, false, 're-armed at -20');
    assert.deepEqual(service.getLog('mara').map(e => [e.delta, e.reason]), [
        [-15, 'wrong_name'], [-10, null], [-10, 'urgency'], [5, null], [10, 'confirmed_detail']
    ]);
    // the sign comes from the tag name, not the number
    await run(['influence_lost:-5'], ui, calls.logs);
    assert.equal(g.mara_influence, -25);
    // clamped at the character's min
    await run(['influence_lost:500'], ui, calls.logs);
    assert.equal(g.mara_influence, -100);
    assert.equal(g.mara_reported, true, 'reports threshold fired on the way down');
});

test('social: #report:<reason> runs the reports effects without changing influence', async () => {
    const { calls, ui, g, dispatcher, service } = setup({ npcId: 'mara_phone' });
    const [r] = await run(['report:maxRefusals'], ui, calls.logs);
    assert.equal(r.success, true);
    assert.equal(g.mara_influence, 0, 'influence unchanged');
    assert.equal(g.mara_reported, true);
    assert.ok(service.getLatched('mara').includes('reports'));
    assert.equal(service.getLastReport('mara').reason, 'maxRefusals');
    const reported = dispatcher.emitted.filter(([e]) => e === 'npc_reported').map(([, d]) => d);
    assert.deepEqual(reported.map(d => [d.character, d.npcId, d.reason]), [['mara', 'mara_phone', 'maxRefusals']]);
    // a second report is latched: effects do not run again
    const [r2] = await run(['report'], ui, calls.logs);
    assert.equal(r2.success, true);
    assert.equal(dispatcher.emitted.filter(([e]) => e === 'npc_reported').length, 1);
});

test('social: the calling engine is passed, so an ink change earlier in the line is the base', async () => {
    const { manager, calls, ui, g, service, dispatcher } = setup({ npcId: 'mara_desk' });
    const engine = new InkEngine('mara_desk');
    quiet(() => engine.loadStory(storyText));
    quiet(() => {
        manager.syncGlobalVariablesToStory(engine.story);
        manager.observeGlobalVariableChanges(engine.story, 'mara_desk');
    });
    engine.goToKnot('ink_then_tag');
    const out = quiet(() => engine.continue());
    assert.equal(out.text.trim(), 'Mara frowns.');
    assert.deepEqual(out.tags, ['influence_lost:10:pushy']);
    await settle();
    // The tag is processed with no options: the open chat's engine for this NPC is found
    window.MinigameFramework = { currentMinigame: { npcId: 'mara_desk', inkEngine: engine } };
    const [r] = await run(out.tags, ui, calls.logs);
    assert.equal(r.success, true);
    assert.equal(g.mara_influence, -30);
    assert.equal(engine.story.variablesState.$('mara_influence'), -30, 'the calling story holds the new value');
    assert.equal(g.mara_wary, true);
    assert.equal(quiet(() => engine.continue()).text.trim(), 'After: -30');
    assert.deepEqual(service.getLog('mara').map(e => [e.delta, e.reason]), [[-20, 'ink'], [-10, 'pushy']]);
    assert.ok(dispatcher.emitted.some(([e]) => e === 'npc_influence_changed'));
});

test('social: an explicit options.engine is used, and the phone engine of another contact is not', async () => {
    const { calls, ui, g, service } = setup({ npcId: 'mara_phone' });
    let seen = null;
    const original = service.addInfluence.bind(service);
    service.addInfluence = (id, d, reason, ctx) => { seen = ctx; return original(id, d, reason, ctx); };

    // The open phone chat belongs to another contact: its engine is not passed
    const other = { story: {} };
    window.MinigameFramework = { currentMinigame: { currentNPCId: 'kevin_park', inkEngine: other } };
    await run(['influence_gained'], ui, calls.logs);
    assert.equal(seen.engine, null);
    assert.equal(seen.npcId, 'mara_phone');
    assert.equal(g.mara_influence, 10);

    // An explicit engine and runId win
    const mine = { story: {} };
    await run(['influence_gained'], ui, calls.logs, { engine: mine, runId: 'run-1' });
    assert.equal(seen.engine, mine);
    assert.equal(seen.runId, 'run-1');
});

// ------------------------------------------------------------------ call sites pass the NPC (R-04)

test('social: options.npcId attributes the tag when currentConversationNPCId is already cleared', async () => {
    const { calls, ui, g } = setup({ npcId: null });
    const [lost] = await run(['influence_gained'], ui, calls.logs);
    assert.equal(lost.success, false, 'with no NPC known the tag falls through (the old loss)');
    assert.equal(g.mara_influence, 0);
    const [r] = await run(['influence_gained'], ui, calls.logs, { npcId: 'mara_phone' });
    assert.equal(r.success, true);
    assert.equal(g.mara_influence, 10);
});

test('a non-social NPC passed as options.npcId gets today\'s behaviour', async () => {
    const { calls, ui, g } = setup({ npcId: null });
    const before = { ...g };
    const [r] = await run(['influence_gained:5'], ui, calls.logs, { npcId: 'kevin_park', engine: null });
    assert.deepEqual(r, { action: 'influence_gained', param: '5', success: false, message: 'ℹ️ Unknown action: influence_gained' });
    assert.deepEqual(g, before);
});

const chatSrc = (p) => readFileSync(join(js, 'minigames', p), 'utf8');
/** Lift a method body from source as a function with the given params, plus extra scope names. */
function lift(src, signature, params, scope = []) {
    const start = src.indexOf(signature);
    assert.ok(start >= 0, `${signature} not found`);
    let i = src.indexOf('{', start), depth = 0, end = -1;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) { end = i; break; }
    }
    const body = src.slice(src.indexOf('{', start) + 1, end);
    return new Function(...scope, `return function (${params.join(', ')}) {${body}};`);
}

test('every chat call of processGameActionTags passes options', () => {
    for (const p of ['phone-chat/phone-chat-minigame.js', 'person-chat/person-chat-minigame.js']) {
        const calls = [...chatSrc(p).matchAll(/processGameActionTags\(([^;]*)\);/g)].map(m => m[1]);
        assert.ok(calls.length >= 4, `${p}: calls found`);
        for (const args of calls) assert.match(args, /_tagOptions\(/, `${p}: ${args}`);
    }
});

test('phone teardown: the batch\'s tags carry the NPC, and no engine (the phone engine is shared)', async () => {
    const src = chatSrc('phone-chat/phone-chat-minigame.js');
    const tagOptions = lift(src, '_tagOptions(npcId, conversation) {', ['npcId', 'conversation'])();
    const seen = [];
    const teardown = lift(src, '_keepOutputAfterTeardown(npcId, conversation, messages, tags) {',
        ['npcId', 'conversation', 'messages', 'tags'], ['processGameActionTags'])(
        (tags, ui, options) => seen.push({ tags, ui, options }));
    const old = { npcId: 'mara_phone', engine: { story: {} } };
    const fake = { conversation: null, npcManager: null, phoneId: null, _saveStoryStateFor() {}, _tagOptions: tagOptions };
    window.currentConversationNPCId = null;
    teardown.call(fake, 'mara_phone', old, [], ['influence_lost:pushy']);
    assert.deepEqual(seen, [{ tags: ['influence_lost:pushy'], ui: null, options: { npcId: 'mara_phone', engine: null } }]);

    // the live conversation for the NPC passes its engine; another contact's does not
    const live = { npcId: 'mara_phone', engine: { story: {} } };
    assert.deepEqual(tagOptions.call({ conversation: live }, 'mara_phone', live), { npcId: 'mara_phone', engine: live.engine });
    assert.deepEqual(tagOptions.call({ conversation: live }, 'kevin_park', live), { npcId: 'kevin_park', engine: null });

    // and the processor then applies it to the social character
    const { calls, ui, g } = setup({ npcId: null });
    await run(seen[0].tags, ui, calls.logs, seen[0].options);
    assert.equal(g.mara_influence, -10);
});

test('person chat: tag options name its own NPC and engine', () => {
    const tagOptions = lift(chatSrc('person-chat/person-chat-minigame.js'), '_tagOptions() {', [])();
    const engine = { story: {} };
    assert.deepEqual(tagOptions.call({ npcId: 'mara_desk', inkEngine: engine }), { npcId: 'mara_desk', engine });
    assert.deepEqual(tagOptions.call({ npcId: 'mara_desk', inkEngine: {} }), { npcId: 'mara_desk', engine: null });
});
