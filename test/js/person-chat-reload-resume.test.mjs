// Person-chat reload resume (2026-11-18, Option B): the ink story position is not saved, so a reload
// restarts the chat at the NPC's start knot. m05 Torres, m03 Danny and m03 Victoria's night
// confrontation set a synced global in their opening choices, and `start` diverts on it to an
// existing knot. Each test plays into the scene, then simulates the server round trip: a fresh story
// with only the synced globals restored, re-entering `start`.
// Run with: node test/js/person-chat-reload-resume.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const load = (m, f) => readFileSync(join(root, 'scenarios', m, 'ink', f), 'utf8').replace(/^﻿/, '');
const erb = m => readFileSync(join(root, 'scenarios', m, 'scenario.json.erb'), 'utf8');

function story(m, f, vars = {}) {
    const s = new inkjs.Story(load(m, f));
    ['player_name'].forEach(n => { try { s.BindExternalFunction(n, () => 'Agent'); } catch (e) { /* not declared */ } });
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    return s;
}
function pump(s) {
    const lines = [];
    while (s.canContinue) { const t = s.Continue().trim(); if (t) lines.push(t); }
    return lines;
}
function pick(s, text) {
    const c = s.currentChoices.find(x => x.text.includes(text));
    assert.ok(c, `choice "${text}" missing; have ${JSON.stringify(s.currentChoices.map(x => x.text))}`);
    s.ChooseChoiceIndex(c.index);
    return pump(s);
}
const enter = (s) => { s.ChoosePathString('start'); return pump(s); };
// What the server would hand back after a reload: only the synced globals.
const synced = (s, names) => Object.fromEntries(names.map(n => [n, s.variablesState[n]]));

const TORRES = ['m05_insider_trading', 'm05_torres_confrontation.json'];
const DANNY = ['m03_ghost_in_the_machine', 'm03_danny_choice.json'];
const VIC = ['m03_ghost_in_the_machine', 'm03_npc_victoria.json'];

test('globals are declared in the scenario globalVariables', () => {
    assert.match(erb('m05_insider_trading'), /"torres_scene_opened": false/);
    assert.match(erb('m03_ghost_in_the_machine'), /"danny_scene_opened": false/);
    assert.match(erb('m03_ghost_in_the_machine'), /"victoria_night_opened": false/);
});

test('m05 Torres: fresh entry plays the opener', () => {
    const s = story(...TORRES);
    const lines = enter(s);
    assert.ok(lines.some(l => l.includes('transfer bar reads')), lines.join('|'));
});

for (const opening of ["It's over, David", "I've seen what you've been staging"]) {
    test(`m05 Torres: reload after opening choice (${opening.slice(0, 12)}) resumes at torres_confrontation`, () => {
        const s = story(...TORRES);
        enter(s);
        pick(s, opening);
        assert.equal(s.variablesState.torres_scene_opened, true);
        const s2 = story(...TORRES, synced(s, ['torres_scene_opened', 'confront_stance', 'final_choice']));
        const lines = enter(s2);
        assert.ok(lines.some(l => /bills|Patricia's file|clinical trial costs/.test(l)), lines.join('|'));
        assert.ok(!lines.some(l => l.includes('transfer bar reads')));
        assert.ok(s2.currentChoices.some(c => c.text.includes('They lied to you')));
    });
}

test('m05 Torres: reload after the stance choice resumes at torres_knows_truth', () => {
    const s = story(...TORRES);
    enter(s);
    pick(s, "It's over, David");
    pick(s, 'They lied to you');
    assert.equal(s.variablesState.confront_stance, 'sympathetic');
    const s2 = story(...TORRES, synced(s, ['torres_scene_opened', 'confront_stance', 'final_choice']));
    const lines = enter(s2);
    assert.ok(lines.some(l => l.startsWith('David Torres: At first?')), lines.join('|'));
    assert.ok(s2.currentChoices.some(c => c.text.includes('You knew people would die')));
});

test('m05 Torres: a decided fate still wins over both new diverts', () => {
    const s2 = story(...TORRES, { torres_scene_opened: true, confront_stance: 'hardline', final_choice: 'arrest' });
    const lines = enter(s2);
    assert.ok(lines.some(l => /Still here|Is there something else/.test(l)), lines.join('|'));
});

test('m05 Torres: the shared-ink claim holds, nothing else loads this story', () => {
    const e = erb('m05_insider_trading');
    assert.equal(e.split('m05_torres_confrontation.json').length - 1, 1);
});

test('m03 Danny: fresh entry plays the opener', () => {
    const lines = enter(story(...DANNY));
    assert.ok(lines.some(l => l.includes('Narrator: The office is small')), lines.join('|'));
});

for (const opening of ["SAFETYNET. I'm investigating", "St. Catherine's. Your reconnaissance", "She lied to you"]) {
    test(`m03 Danny: reload after "${opening.slice(0, 14)}" resumes at the question`, () => {
        const s = story(...DANNY);
        enter(s);
        pick(s, opening);
        assert.equal(s.variablesState.danny_scene_opened, true);
        const s2 = story(...DANNY, synced(s, ['danny_scene_opened', 'danny_fate', 'danny_evidence_seen']));
        const lines = enter(s2);
        assert.ok(lines.some(l => l.includes('What happens now?')), lines.join('|'));
        assert.ok(!lines.some(l => l.includes('The office is small')));
        assert.ok(s2.currentChoices.some(c => c.text.includes('Come in and testify')));
    });
}

test('m03 Danny: next_job opening also checkpoints', () => {
    const s = story(...DANNY, { flag_ftp_submitted: true });
    enter(s);
    pick(s, 'Zero Day rehearses');
    assert.equal(s.variablesState.danny_scene_opened, true);
});

test('m03 Danny: a decided fate still goes to after_choice', () => {
    const s2 = story(...DANNY, { danny_scene_opened: true, danny_fate: 'protected' });
    const lines = enter(s2);
    assert.ok(lines.some(l => l.includes("I've made the call")), lines.join('|'));
});

const NIGHT = { night_confrontation_ready: true, recruitment_discussed: true, victoria_test_answer: 'sold', victoria_influence: 20 };
const nightOpenings = [
    ['Sable', { sable_named: true }],
    ["read your approvals", {}],
    ["St. Catherine's Hospital", {}],
    ["I've been through your office", { usb_seen: true }],
];
test('m03 Victoria: fresh night entry plays the confrontation opener', () => {
    const lines = enter(story(...VIC, NIGHT));
    assert.ok(lines.some(l => l.includes('Victoria is standing by the window')), lines.join('|'));
});
for (const [text, extra] of nightOpenings) {
    test(`m03 Victoria: reload after "${text.slice(0, 16)}" resumes at the_reckoning`, () => {
        const s = story(...VIC, { ...NIGHT, ...extra });
        enter(s);
        pick(s, text);
        if (s.currentChoices.some(c => c.text.includes('Forty per cent'))) pick(s, 'Forty per cent');
        assert.equal(s.variablesState.victoria_night_opened, true);
        const s2 = story(...VIC, { ...NIGHT, ...extra, ...synced(s, ['victoria_night_opened', 'victoria_fate', 'came_via_hospital']) });
        const lines = enter(s2);
        assert.ok(lines.some(l => l.includes('You want the confession')), lines.join('|'));
        assert.ok(!lines.some(l => l.includes('standing by the window')));
        assert.ok(s2.currentChoices.some(c => c.text.includes('walked away from that sale')));
    });
}
test('m03 Victoria: a decided fate beats the checkpoint', () => {
    const s2 = story(...VIC, { ...NIGHT, victoria_night_opened: true, victoria_fate: 'arrested' });
    const lines = enter(s2);
    assert.ok(lines.some(l => l.includes('We\'re done here')), lines.join('|'));
});
