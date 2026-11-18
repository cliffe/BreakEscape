// m01 phone: the debrief waits for the Operation Shatter report (F5), and the closing
// call has a way to carry on after "Keep going" on the ending check (F6).
// Run with: node test/js/m01-debrief-gates.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const json = readFileSync(join(root, 'scenarios/m01_first_contact/ink/m01_phone_agent0x99.json'), 'utf8').replace(/^﻿/, '');
const DEBRIEF = /ready for debrief/;

function story(vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    return s;
}
function hub(vars) {
    const s = story(vars);
    s.ChoosePathString('support_hub');
    while (s.canContinue) s.Continue();
    return s;
}
const labels = (s) => s.currentChoices.map((c) => c.text.trim());

test('F5: no debrief choice until the player has reported what ENTROPY plans', () => {
    const resolved = { entropy_reveal_read: true, player_aborted_attack: true };
    const before = labels(hub({ ...resolved, operation_shatter_reported: false }));
    assert.ok(!before.some((l) => DEBRIEF.test(l)), 'debrief offered before the report');
    assert.ok(before.some((l) => /I discovered what ENTROPY is planning/.test(l)), 'report offered');
    const after = labels(hub({ ...resolved, operation_shatter_reported: true }));
    assert.ok(after.some((l) => DEBRIEF.test(l)), 'debrief offered after the report');
    assert.ok(!after.some((l) => /I discovered what ENTROPY is planning/.test(l)));
});

test('F5: a launched attack is gated the same way', () => {
    const v = { entropy_reveal_read: true, player_launched_attack: true };
    assert.ok(!labels(hub({ ...v, operation_shatter_reported: false })).some((l) => DEBRIEF.test(l)));
    assert.ok(labels(hub({ ...v, operation_shatter_reported: true })).some((l) => DEBRIEF.test(l)));
});

test('F5: the report option still completes the task', () => {
    const s = hub({ entropy_reveal_read: true, operation_shatter_reported: false });
    s.ChooseChoiceIndex(labels(s).findIndex((l) => /I discovered what ENTROPY is planning/.test(l)));
    let tags = [];
    for (let i = 0; i < 20; i++) {
        while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    assert.ok(tags.includes('complete_task:inform_safetynet_operation_shatter'));
});

test('F6: the closing call offers a choice that starts nothing, next to the ending check', () => {
    const s = story({});
    s.ChoosePathString('closing_debrief');
    while (s.canContinue) s.Continue();
    const c = s.currentChoices;
    assert.equal(c.length, 2);
    assert.ok(c[0].tags.includes('ending_check'));
    assert.match(c[1].text, /Not yet/);
    s.ChooseChoiceIndex(1);
    const tags = [];
    while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
    assert.ok(tags.includes('exit_conversation'));
    assert.ok(!tags.some((t) => t.startsWith('set_global:start_debrief_cutscene')));
});

test('F6: the ending-check choice still starts the debrief', () => {
    const s = story({});
    s.ChoosePathString('closing_debrief');
    while (s.canContinue) s.Continue();
    s.ChooseChoiceIndex(0);
    const tags = [];
    while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
    assert.ok(tags.includes('set_global:start_debrief_cutscene:true'));
});

test('F5: a report left half-way (position lost) keeps the report offered and the debrief hidden', () => {
    const resolved = { entropy_reveal_read: true, player_aborted_attack: true, operation_shatter_reported: false };
    const s = hub(resolved);
    s.ChooseChoiceIndex(labels(s).findIndex((l) => /I discovered what ENTROPY is planning/.test(l)));
    while (s.canContinue) s.Continue();
    assert.ok(s.currentChoices.length > 0, 'report stops at its first choice');
    assert.equal(s.variablesState['operation_shatter_reported'], false, 'not reported until the report completes');
    // The saved position is replaced by a ring (callback) that ends in support_hub.
    s.ChoosePathString('support_hub');
    while (s.canContinue) s.Continue();
    const mid = labels(s);
    assert.ok(!mid.some((l) => DEBRIEF.test(l)), 'debrief offered mid-report');
    assert.ok(mid.some((l) => /I discovered what ENTROPY is planning/.test(l)), 'report not offered again');
});

test('F5: finishing the report sets the flag, completes the task and opens the debrief', () => {
    const s = hub({ entropy_reveal_read: true, player_aborted_attack: true, operation_shatter_reported: false });
    s.ChooseChoiceIndex(labels(s).findIndex((l) => /I discovered what ENTROPY is planning/.test(l)));
    const tags = [];
    for (let i = 0; i < 20; i++) {
        while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
        if (!s.currentChoices.length || DEBRIEF.test(labels(s).join('|'))) break;
        s.ChooseChoiceIndex(0);
    }
    assert.ok(tags.includes('complete_task:inform_safetynet_operation_shatter'));
    assert.equal(s.variablesState['operation_shatter_reported'], true);
    s.ChoosePathString('support_hub');
    while (s.canContinue) s.Continue();
    assert.ok(labels(s).some((l) => DEBRIEF.test(l)), 'debrief offered after the report');
});

test('F6: the Not yet reply is a line with a cached clip (reuses "Good. Off you go.")', () => {
    const s = story({});
    s.ChoosePathString('closing_debrief');
    while (s.canContinue) s.Continue();
    s.ChooseChoiceIndex(1);
    const out = [];
    while (s.canContinue) out.push(s.Continue().trim());
    assert.ok(out.includes('Good. Off you go.'));
});

test('abort-call guard: m01_debrief_offered is declared, set on entering closing_debrief, and gates all abort rings', () => {
    const s = story({});
    assert.equal(s.variablesState['m01_debrief_offered'], false);
    s.ChoosePathString('closing_debrief');
    const tags = [];
    while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
    assert.ok(tags.includes('set_global:m01_debrief_offered:true'), 'knot does not set the flag');
    const erb = readFileSync(join(root, 'scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
    assert.match(erb, /"m01_debrief_offered": false/);
    const a = erb.indexOf('"eventPattern": "attack_aborted"');
    const seg = erb.slice(a, erb.indexOf('"id": "closing_debrief_person"'));
    assert.equal(seg.match(/start_debrief_cutscene !== true/g).length, 6);
    assert.equal(seg.match(/start_debrief_cutscene !== true && globalVars\.m01_debrief_offered !== true/g).length, 6);
});
