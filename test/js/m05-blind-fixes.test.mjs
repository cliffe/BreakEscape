// m05 blind-playtest fixes: the debrief "cold" line follows the ending, the vetting objective
// names Patricia, and the transfer log ticks the upload-schedule task.
// Run with: node test/js/m05-blind-fixes.test.mjs

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
const dir = join(root, 'scenarios/m05_insider_trading');
const json = readFileSync(join(dir, 'ink/m05_closing_debrief.json'), 'utf8').replace(/^﻿/, '');
const erb = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');
const COLD = /Cold, maybe/;

function reflection(vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString('final_reflection');
    let out = '';
    for (let i = 0; i < 30; i++) {
        while (s.canContinue) out += s.Continue();
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    return out;
}

test('F5: a hardline opening still gets the cold line when Torres is arrested', () => {
    assert.match(reflection({ confront_stance: 'hardline', final_choice: 'arrest' }), COLD);
});

test('F5: a hardline opening that ends in helping him does not', () => {
    assert.doesNotMatch(reflection({ confront_stance: 'hardline', final_choice: 'turn_double_agent' }), COLD);
});

test('F5: a sympathetic opening never gets it', () => {
    assert.doesNotMatch(reflection({ confront_stance: 'sympathetic', final_choice: 'arrest' }), COLD);
});

test('F3: the vetting objective names Patricia as the source', () => {
    const m = erb.match(/"taskId": "find_vetting_file",[\s\S]*?"title": "([^"]+)"/);
    assert.ok(m, 'find_vetting_file task present');
    assert.match(m[1], /Patricia/);
});

test('F1: the transfer log sets a declared global and a mapping ticks find_upload_schedule', () => {
    const logBlock = erb.slice(erb.indexOf('"name": "transfer_queue.log"'), erb.indexOf('"id": "talentstack_envelope"'));
    assert.match(logBlock, /"onRead": \{ "setVariable": \{ "found_transfer_log": true \} \}/);
    assert.match(erb, /"found_transfer_log": false,/, 'declared in globals');
    const i = erb.indexOf('"eventPattern": "global_variable_changed:found_transfer_log"');
    assert.ok(i > 0, 'mapping present');
    const body = erb.slice(i, erb.indexOf('}', i));
    assert.match(body, /"completeTask": "find_upload_schedule"/);
    assert.match(body, /"onceOnly": true/);
    const j = erb.indexOf('"eventPattern": "global_variable_changed:found_upload_schedule",\n              "condition": "value === true",\n              "onceOnly": true,\n              "completeTask"');
    assert.ok(j > i, 'the schedule itself still ticks the task, appended after the log mapping');
});

test('F1: the task is custom, because the server refuses a collect_items tick without the item', () => {
    const m = erb.match(/"taskId": "find_upload_schedule",[\s\S]*?"type": "(\w+)"/);
    assert.equal(m[1], 'custom');
});

test('F1: found_upload_schedule is not set by the log (it gates the operator-named evidence)', () => {
    const logBlock = erb.slice(erb.indexOf('"name": "transfer_queue.log"'), erb.indexOf('"id": "talentstack_envelope"'));
    assert.doesNotMatch(logBlock, /found_upload_schedule/);
});

test('F6: the HaX Recruiter text says she is on the phone, not that there is a number to find', () => {
    assert.ok(erb.includes('"message": "That TalentStack caller is the Recruiter. Answer or not, she stays on your phone and you can ring her back.'), 'new wording present');
    // The text promises a callback whether she is answered, declined or rung out: keep what makes that true.
    const rings = erb.match(/"targetKnot": "first_call",\s*"ring": \{ "onMissed": "callback" \}/g) || [];
    assert.ok(rings.length >= 2, 'first_call rings (conversation_closed loop and game_loaded twin) leave a callback when missed');
    assert.ok(erb.includes('"call": { "knot": "return_contact", "when": "!globalVars.recruiter_line_dead"'), 'she can be rung back until her line goes dead');
    assert.ok(/"message": "That TalentStack caller[^"]*"[^}]*"skipIfGlobal": "recruiter_contacted_player"/.test(erb), 'text skipped once she has been rung back');
    assert.ok(!erb.includes('That TalentStack number is the Recruiter'), 'old wording gone');
    assert.ok(!erb.includes('Let it ring out and she stays'), 'R1 wording gone');
});
