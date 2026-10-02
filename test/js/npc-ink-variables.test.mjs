// Round-trip of NPC-local ink variables through npc-conversation-state.js, the
// path that keeps intros from replaying after a page reload.
// Run with: node test/js/npc-ink-variables.test.mjs   (no dependencies; exits non-zero on failure)
//
// Uses the vendored inkjs and real compiled mission ink. The bug this guards:
// Object.entries(story.variablesState) lists the inkjs VariablesState internals
// (patch, _changedVariablesForBatchObs, ...) and never the ink VARs, so every
// saved entry was {"patch":null,...} and nothing was ever restored.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));

// Scenario globals the module consults through window.gameState (m03 declares
// victoria_card_cloned / victoria_fate / night_confrontation_ready as globals).
globalThis.window = {
    gameState: {
        globalVariables: {
            victoria_card_cloned: false, victoria_fate: '', night_confrontation_ready: false,
            player_approach: '', victoria_influence: 0, victoria_trusts_player: false,
            victoria_suspicious: 0, victoria_trust: 0
        }
    }
};

const src = readFileSync(join(root, 'public/break_escape/js/systems/npc-conversation-state.js'), 'utf8');
const manager = (await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'))).default;
const freshManager = () => new manager.constructor();

function loadStory(relPath) {
    const json = readFileSync(join(root, relPath), 'utf8').replace(/^﻿/, '');
    const story = new inkjs.Story(json);
    try { story.BindExternalFunction('player_name', () => 'Agent'); } catch (e) { /* not declared */ }
    return story;
}

function runFrom(story, knot) {
    story.ChoosePathString(knot);
    let text = '';
    while (story.canContinue) text += story.Continue();
    return { text, choices: story.currentChoices.map(c => c.text) };
}

const VICTORIA = 'scenarios/m03_ghost_in_the_machine/ink/m03_npc_victoria.json';
const HAX_M06 = 'scenarios/m06_follow_the_money/ink/m06_phone_agent_0x99.json';

test('saveNPCState captures declared ink VARs, not VariablesState internals', () => {
    const m = freshManager();
    const story = loadStory(VICTORIA);
    story.variablesState.$('recruitment_discussed', true);
    m.saveNPCState('victoria_sterling', story);

    const vars = m.getNPCState('victoria_sterling').variables;
    assert.equal(vars.recruitment_discussed, true);
    for (const internal of ['patch', '_changedVariablesForBatchObs', '_batchObservingVariableChanges']) {
        assert.ok(!(internal in vars), `${internal} leaked into saved variables`);
    }
});

test('Victoria: export, JSON round trip, import, restart at start goes to the hub, not the intro', () => {
    const before = freshManager();
    const story = loadStory(VICTORIA);
    story.variablesState.$('recruitment_discussed', true);
    before.saveNPCState('victoria_sterling', story);

    const exported = JSON.parse(JSON.stringify(before.exportNpcInkVariables()));
    assert.equal(exported.victoria_sterling.recruitment_discussed, true);
    assert.ok(!('victoria_card_cloned' in exported.victoria_sterling), 'scenario globals sync separately');
    assert.ok(!('patch' in exported.victoria_sterling));

    // Page reload: new manager, new story
    const after = freshManager();
    after.importNpcInkVariables(exported);
    const reloaded = loadStory(VICTORIA);
    assert.equal(after.restoreNPCState('victoria_sterling', reloaded), 'variables-only');
    assert.equal(reloaded.variablesState.$('recruitment_discussed'), true);

    const { text, choices } = runFrom(reloaded, 'start');
    assert.match(text, /Back for more conversation\?/);
    assert.doesNotMatch(text, /Welcome to WhiteHat Security/);
    assert.ok(choices.length > 0, 'hub offers choices');
});

test('control: without the import, Victoria plays her intro', () => {
    const { text } = runFrom(loadStory(VICTORIA), 'start');
    assert.match(text, /Welcome to WhiteHat Security/);
});

test('phone path (m06 HaX): recordInkVariables / applySavedInkVariables skip first_call', () => {
    const before = freshManager();
    const story = loadStory(HAX_M06);
    runFrom(story, 'start');                       // plays first_call, sets first_contact = false
    assert.equal(story.variablesState.$('first_contact'), false);
    before.recordInkVariables('agent_0x99_handler', story);

    const exported = JSON.parse(JSON.stringify(before.exportNpcInkVariables()));
    assert.equal(exported.agent_0x99_handler.first_contact, false);

    const after = freshManager();
    after.importNpcInkVariables(exported);
    const reloaded = loadStory(HAX_M06);
    assert.ok(after.applySavedInkVariables('agent_0x99_handler', reloaded) > 0);
    const { text } = runFrom(reloaded, 'start');
    assert.doesNotMatch(text, /you're inside HashChain Exchange/);
});

test('stale or internal names are refused, not written onto VariablesState', () => {
    const m = freshManager();
    m.importNpcInkVariables({ victoria_sterling: { patch: 'x', no_such_var: 1, recruitment_discussed: true } });
    const story = loadStory(VICTORIA);
    const patchBefore = story.variablesState.patch;

    assert.equal(m.applySavedInkVariables('victoria_sterling', story), 1);
    assert.equal(story.variablesState.patch, patchBefore);
    assert.equal(story.variablesState.$('recruitment_discussed'), true);
});

test('syncing gameState globals into an observed story emits nothing; a real change emits once', () => {
    const m = freshManager();
    const emitted = [];
    window.eventDispatcher = { emit: (name, data) => emitted.push([name, data]) };
    const globals = window.gameState.globalVariables;
    const saved = { ...globals };
    try {
        globals.victoria_card_cloned = true;   // differs from the ink default (false)
        const story = loadStory(VICTORIA);
        m.syncGlobalVariablesToStory(story);   // before the observer: never emitted
        m.observeGlobalVariableChanges(story, 'victoria_sterling');

        // Conversation start re-syncs with the observer attached (person-chat, phone-chat,
        // npc-manager). That used to re-emit global_variable_changed for every global.
        m.syncGlobalVariablesToStory(story);
        assert.deepEqual(emitted, []);

        // Ink re-assigning the current value is not a change either
        story.variablesState.$('victoria_card_cloned', true);
        assert.deepEqual(emitted, []);

        // A real change emits once and updates gameState
        story.variablesState.$('victoria_influence', 5);
        assert.deepEqual(emitted.map(e => e[0]), ['global_variable_changed:victoria_influence']);
        assert.equal(globals.victoria_influence, 5);
    } finally {
        Object.keys(globals).forEach(k => delete globals[k]);
        Object.assign(globals, saved);
        delete window.eventDispatcher;
    }
});
