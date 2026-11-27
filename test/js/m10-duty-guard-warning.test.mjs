// m10 duty guard (security office): caught picking the Fitter's Locker, he warns before he fights.
// The photo choice used to turn him hostile at once (blind playtest, game 9370). Ladder now:
// first catch -> a warning with Back off / Pick it anyway; a Back off ends the chat peacefully;
// a second catch turns him with no choice. A click on him after a Back off is not a catch.
// Run with: node --test test/js/m10-duty-guard-warning.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const { Story } = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const json = readFileSync(join(here, '../../scenarios/m10_full_disclosure/ink/m10_guards.json'), 'utf8');
const scenario = readFileSync(join(here, '../../scenarios/m10_full_disclosure/scenario.json.erb'), 'utf8');

const open = (knot, vars = {}) => {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
};
// Read until the next choice point: all text and tags so far.
const run = (s) => {
    let text = '', tags = [];
    while (s.canContinue) { text += s.Continue(); tags = tags.concat(s.currentTags || []); }
    return { text, tags, choices: s.currentChoices.map((c) => c.text) };
};
const pick = (s, label) => { s.ChooseChoiceIndex(s.currentChoices.findIndex((c) => c.text === label)); return run(s); };
const hostile = (r) => r.tags.some((t) => t.startsWith('hostile'));

test('the lockpick catch opens duty_caught, not duty', () => {
    assert.match(scenario, /"lockpick_used_in_view"[^}]*"targetKnot": "duty_caught"/);
});

test('first catch: the photo choice warns, it does not turn him', () => {
    const s = open('duty_caught');
    let r = run(s);
    assert.match(r.text, /off the wall/);
    assert.ok(!hostile(r));
    r = pick(s, 'Read what it says under the photo.');
    assert.match(r.text, /doesn't say let you past/);
    assert.match(r.text, /Last chance/);
    assert.ok(!hostile(r), 'no hostile tag before the warning is answered');
    assert.deepEqual(r.choices, ['(Back off.)', '(Pick it anyway.)']);
});

test('the other opener warns too', () => {
    const s = open('duty_caught');
    run(s);
    const r = pick(s, "You don't want to do this.");
    assert.ok(!hostile(r));
    assert.deepEqual(r.choices, ['(Back off.)', '(Pick it anyway.)']);
});

test('Back off ends the chat without hostility and arms the repeat', () => {
    const s = open('duty_caught');
    run(s);
    pick(s, 'Read what it says under the photo.');
    const r = pick(s, '(Back off.)');
    assert.ok(r.tags.includes('exit_conversation'));
    assert.ok(!hostile(r));
    assert.equal(s.variablesState['duty_warnings'], 1);
});

test('Pick it anyway turns him, after the warning', () => {
    const s = open('duty_caught');
    run(s);
    pick(s, 'Read what it says under the photo.');
    const r = pick(s, '(Pick it anyway.)');
    assert.ok(hostile(r));
    assert.ok(r.tags.includes('exit_conversation'));
});

test('a second catch turns him on the line itself, with no warning beat', () => {
    const s = open('duty_caught', { duty_warnings: 1 });
    const r = run(s);
    assert.match(r.text, /I told you/);
    assert.ok(hostile(r), 'the line carries the hostile tag, so closing with X changes nothing');
});

test('a plain click on him after a Back off is not a catch', () => {
    const s = open('duty', { duty_warnings: 1 });
    const r = run(s);
    assert.ok(!hostile(r));
    assert.match(r.text, /Keep away from that locker/);
});

test('duty_warnings is declared in the scenario globals', () => {
    assert.match(scenario, /"duty_warnings": 0/);
});
