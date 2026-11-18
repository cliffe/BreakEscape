// Mission-ending convention for m03 Victoria, m07 HaX bring-me-in, m08 Nightshade:
// the irreversible choice carries #ending_check in its brackets, and a "Not yet"
// choice backs out without starting the ending.
// Run with: node test/js/ending-checks-release.test.mjs

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
const load = (p) => readFileSync(join(root, p), 'utf8').replace(/^﻿/, '');
const M03 = load('scenarios/m03_ghost_in_the_machine/ink/m03_npc_victoria.json');
const M07 = load('scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.json');
const M08 = load('scenarios/m08_the_mole/ink/m08_nightshade_confrontation.json');

function at(json, knot, vars = {}) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
}
function drain(s) {
    const lines = [], tags = [];
    while (s.canContinue) {
        lines.push(s.Continue().trim());
        tags.push(...(s.currentTags || []));
    }
    return { lines, tags };
}
const find = (s, re) => s.currentChoices.findIndex((c) => re.test(c.text));

test('m03: every ending choice carries ending_check, and "Not yet" does not', () => {
    const s = at(M03, 'confrontation_decision', { usb_seen: true });
    drain(s);
    const ending = s.currentChoices.filter((c) => !/Not yet/.test(c.text));
    assert.equal(ending.length, 3, 'recruit, arrest, escape');
    for (const c of ending) assert.ok(c.tags && c.tags.includes('ending_check'), c.text);
    const notYet = s.currentChoices[find(s, /Not yet/)];
    assert.ok(notYet, 'Not yet offered');
    assert.ok(!(notYet.tags || []).includes('ending_check'));
});

test('m03: "Not yet" decides nothing, and the next talk resumes at the decision', () => {
    const s = at(M03, 'confrontation_decision');
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.ok(!tags.some((t) => /^(set_global:victoria_fate|complete_task:victoria_choice_made)/.test(t)));
    assert.equal(s.variablesState.victoria_fate, '');
    assert.equal(s.variablesState.confront_held, true);
    // Talk to her again: straight to the choices, none of the opening speech.
    s.ChoosePathString('nighttime_confrontation');
    const again = drain(s);
    assert.ok(!again.lines.some((l) => /came back after hours/.test(l)));
    assert.ok(find(s, /walking out of here/) >= 0);
    assert.equal(s.variablesState.confront_held, false);
});

test('m03: choosing an ending still sets the fate', () => {
    const s = at(M03, 'confrontation_decision');
    drain(s);
    s.ChooseChoiceIndex(find(s, /walking out of here/));
    const { tags } = drain(s);
    assert.ok(tags.includes('set_global:victoria_fate:arrested'));
    assert.ok(tags.includes('complete_task:victoria_choice_made'));
});

const ALL = { flag1_submitted: true, flag2_submitted: true, flag3_submitted: true, flag4_submitted: true };

test('m07: bring_me_in asks first and does not request the debrief yet', () => {
    const s = at(M07, 'bring_me_in', ALL);
    drain(s);
    assert.equal(s.variablesState.debrief_requested, false);
    const go = s.currentChoices[find(s, /Put him through/)];
    assert.ok(go.tags.includes('ending_check'));
    assert.ok(find(s, /Not yet/) >= 0);
});

test('m07: "Not yet" leaves debrief_requested false and ends the call', () => {
    const s = at(M07, 'bring_me_in', ALL);
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.equal(s.variablesState.debrief_requested, false);
});

test('m07: confirming sets debrief_requested and keeps the voiced hand-off line', () => {
    const s = at(M07, 'bring_me_in', ALL);
    drain(s);
    s.ChooseChoiceIndex(find(s, /Put him through/));
    const { lines, tags } = drain(s);
    assert.equal(s.variablesState.debrief_requested, true);
    assert.ok(lines.includes("Putting you through. He's waiting."));
    assert.ok(tags.includes('exit_conversation'));
});

test('m07: with a flag missing the confirm is tagged too, and still waits for the flags', () => {
    const s = at(M07, 'bring_me_in', { ...ALL, flag4_submitted: false });
    const { lines } = drain(s);
    assert.ok(lines.includes('Not yet. Put the rest of the flags through the relay and he\'s on straight after.'));
    assert.equal(s.variablesState.debrief_requested, false);
    const go = s.currentChoices.find((c) => /Understood/.test(c.text));
    assert.ok(go && go.tags.includes('ending_check'));
    assert.ok(!s.currentChoices.some((c) => /Put him through/.test(c.text)));
});

test('m08: both fate choices carry ending_check; "Not yet" does not', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    const fates = s.currentChoices.filter((c) => !/Not yet/.test(c.text));
    assert.equal(fates.length, 2);
    for (const c of fates) assert.ok(c.tags && c.tags.includes('ending_check'), c.text);
    assert.ok(!(s.currentChoices[find(s, /Not yet/)].tags || []).includes('ending_check'));
});

test('m08: "Not yet" decides nothing and holds the choice', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    s.ChooseChoiceIndex(find(s, /Not yet/));
    const { tags } = drain(s);
    assert.ok(tags.includes('exit_conversation'));
    assert.ok(!tags.includes('complete_task:decide_the_fate'));
    assert.equal(s.variablesState.fate_decided, false);
    // The knot re-enters itself, so the same choices wait for the next talk.
    assert.ok(find(s, /No deals/) >= 0);
});

test('m08: a fate choice still completes the task', () => {
    const s = at(M08, 'the_choice');
    drain(s);
    s.ChooseChoiceIndex(find(s, /No deals/));
    const { tags } = drain(s);
    assert.ok(tags.includes('complete_task:decide_the_fate'));
    assert.equal(s.variablesState.fate_decided, true);
});
