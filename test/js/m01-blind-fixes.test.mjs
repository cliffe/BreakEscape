// m01 blind-playtest fixes: Derek's "heard my reasoning" gate, the Kevin gear and
// Derek approach debrief echoes, and no repeated line inside the ink output itself
// (the blind tester's "repeats" were a harness artefact: the last line is reported
// again when its choices attach; one TTS request per line, one #dialogue-text value).
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
const load = (n) => readFileSync(join(root, 'scenarios/m01_first_contact/ink', n), 'utf8').replace(/^﻿/, '');

function play(file, knot, vars, picks) {
    const s = new Story(load(file));
    for (const [k, v] of Object.entries(vars || {})) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    const lines = [];
    let pi = 0;
    for (let i = 0; i < 80; i++) {
        while (s.canContinue) lines.push(s.Continue().trim());
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(picks && pi < picks.length ? picks[pi++] : 0);
    }
    return lines.filter(Boolean);
}

const REASONING = "So. Here we are. You've heard my reasoning. You've seen the evidence.";
// The voiced release line no longer mentions "reasoning", so the heard_reasoning gate was dropped (Train 216).
const NO_REASONING = "So. Here we are. What happens now is up to you.";

test('Derek: skipping the monologue still gets the voiced line, never "heard my reasoning"', () => {
    // start -> option 4 (I have everything) goes straight to confrontation_choice
    const lines = play('m01_derek_confrontation.json', 'start', { entropy_reveal_read: true, found_casualty_projections: true }, [3, 0]);
    assert.ok(lines.includes(NO_REASONING), lines.join(' | '));
    assert.ok(!lines.includes(REASONING));
});

test('Derek: after the monologue the same voiced line plays', () => {
    // I know what you're planning -> ... -> "Why?" (evil_monologue_part1 sets heard_reasoning)
    const lines = play('m01_derek_confrontation.json', 'start', { entropy_reveal_read: true }, [0, 0, 0]);
    assert.ok(lines.includes(NO_REASONING), lines.join(' | '));
    assert.ok(!lines.includes(REASONING));
});

test('debrief: Kevin gear echo only when he took everything and Kevin is still around', () => {
    const base = { player_name: 'Agent' };
    const yes = play('m01_closing_debrief.json', 'security_audit_review', { ...base, kevin_gear_all: true });
    assert.ok(yes.some(l => /lockpicks and the keycard in one go/.test(l)));
    assert.ok(!play('m01_closing_debrief.json', 'security_audit_review', { ...base, kevin_gear_all: false }).some(l => /in one go/.test(l)));
    assert.ok(!play('m01_closing_debrief.json', 'security_audit_review', { ...base, kevin_gear_all: true, kevin_ko: true }).some(l => /in one go/.test(l)));
});

test('debrief: Derek approach echo is gated on evidence_based', () => {
    const ev = play('m01_closing_debrief.json', 'derek_discussion', { confrontation_approach: 'evidence_based', final_choice: 'arrest' });
    assert.ok(ev.some(l => /evidence in front of him/.test(l)));
    const ag = play('m01_closing_debrief.json', 'derek_discussion', { confrontation_approach: 'aggressive', final_choice: 'arrest' });
    assert.ok(!ag.some(l => /evidence in front of him/.test(l)));
});

test('briefing: no ink knot prints the same line twice in a row', () => {
    const s = new Story(load('m01_opening_briefing.json'));
    const lines = [];
    for (let i = 0; i < 60; i++) {
        while (s.canContinue) lines.push(s.Continue().trim());
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    for (let i = 1; i < lines.length; i++) assert.notEqual(lines[i], lines[i - 1], `repeat: ${lines[i]}`);
});

test('scenario: kevin_gear_all is a declared global and the Derek task names the break room', () => {
    const erb = readFileSync(join(root, 'scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
    assert.match(erb, /"kevin_gear_all": false/);
    assert.match(erb, /"title": "Confront Derek Lawson in the break room"/);
    assert.match(erb, /Then find Derek in the break room, west of the main office\./);
    assert.match(erb, /You missed my call\. Call me back when you can/);
});
