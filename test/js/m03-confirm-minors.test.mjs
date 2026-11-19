// m03 confirm minors (19 Nov): Sterling's final choice resumes at the decision after a reload,
// and "Not yet" only shows while something optional is open.
// Run with: node test/js/m03-confirm-minors.test.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const json = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/ink/m03_npc_victoria.json'), 'utf8');
const NOT_YET = 'Not yet.';

function open(vars) {
    const story = new inkjs.Story(json);
    for (const [k, v] of Object.entries(vars)) story.variablesState[k] = v;
    const lines = [];
    while (story.canContinue) lines.push(story.Continue());
    return { lines, choices: story.currentChoices.map((c) => c.text) };
}
const night = { night_confrontation_ready: true, victoria_night_opened: true, usb_seen: true };

test('resume after the decision was reached lands on the choices, not the confession', () => {
    const r = open({ ...night, victoria_decision_reached: true });
    assert.ok(!r.lines.join(' ').includes('You want the confession'), 'confession replayed');
    assert.ok(r.choices.some((c) => c.includes('Phase 2 directive')), 'decision choices missing');
});

test('resume before the decision still starts at the reckoning', () => {
    const r = open({ ...night, victoria_decision_reached: false });
    assert.ok(r.lines.join(' ').includes('You want the confession'), 'reckoning not replayed');
});

test('"Not yet" shows while the whiteboard is undecoded and hides when everything is done', () => {
    const base = { ...night, night_explored: true, exec_wing_night: true, victoria_decision_reached: true, danny_fate: 'protected' };
    const openOne = open({ ...base, whiteboard_decoded: false, roster_decoded: true, directive_decoded: true });
    assert.ok(openOne.choices.some((c) => c.startsWith(NOT_YET)), 'Not yet should show');
    const done = open({ ...base, whiteboard_decoded: true, roster_decoded: true, directive_decoded: true });
    assert.ok(!done.choices.some((c) => c.startsWith(NOT_YET)), 'Not yet should be hidden');
    assert.ok(done.choices.length >= 3, 'the three endings remain');
});

test('an unfound drive does not keep "Not yet" alive by itself', () => {
    const r = open({ night_confrontation_ready: true, victoria_night_opened: true, victoria_decision_reached: true,
        danny_fate: 'protected', whiteboard_decoded: true, roster_decoded: true, directive_decoded: false });
    assert.ok(!r.choices.some((c) => c.startsWith(NOT_YET)), 'locked decode task is not an open objective');
});

test('Danny alone, or an unvisited wing, drives the gate', () => {
    const done = { ...night, night_explored: true, exec_wing_night: true, victoria_decision_reached: true,
        whiteboard_decoded: true, roster_decoded: true, directive_decoded: true };
    assert.ok(open({ ...done, danny_fate: '' }).choices.some((c) => c.startsWith(NOT_YET)), 'Danny open: show');
    assert.ok(!open({ ...done, exec_wing_night: false, roster_decoded: false, danny_fate: '' }).choices.some((c) => c.startsWith(NOT_YET)), 'wing locked: hide');
    assert.ok(open({ ...done, roster_decoded: false }).choices.some((c) => c.startsWith(NOT_YET)), 'roster open: show');
});

test('a settled fate wins over the saved decision flag', () => {
    const r = open({ ...night, victoria_decision_reached: true, victoria_fate: 'ko' });
    assert.ok(!r.choices.some((c) => c.includes('Phase 2 directive')), 'ko must not reopen the decision');
});

test('the new global is declared so it syncs', () => {
    const erb = readFileSync(join(root, 'scenarios/m03_ghost_in_the_machine/scenario.json.erb'), 'utf8');
    assert.ok(/"victoria_decision_reached": false/.test(erb), 'not declared');
});
