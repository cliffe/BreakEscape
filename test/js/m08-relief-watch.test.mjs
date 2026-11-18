// m08 office life, slice 5: the relief watch ink (entry knots, once-only exchanges) and the
// closing debrief's night-watch conduct beat. Run with: node test/js/m08-relief-watch.test.mjs

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
const load = (f) => readFileSync(join(root, 'scenarios/m08_the_mole/ink', f), 'utf8').replace(/^﻿/, '');
const WATCH = load('m08_relief_watch.json');
const DEBRIEF = load('m08_closing_debrief.json');

function open(json, knot, vars = {}) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
}
// Run to the next choice point or the end; return the lines and tags.
function run(s) {
    const lines = []; const tags = [];
    while (s.canContinue) { const t = s.Continue().trim(); if (t) lines.push(t); tags.push(...(s.currentTags || [])); }
    return { lines, tags };
}
const labels = (s) => s.currentChoices.map((c) => c.text.trim());

for (const [knot, who] of [['julian_start', 'Julian Sallow'], ['agnieszka_start', 'Agnieszka Duda']]) {
    test(`${knot} runs, speaks as ${who}, offers a way out`, () => {
        const s = open(WATCH, knot);
        const { lines } = run(s);
        assert.ok(lines.length >= 1);
        assert.ok(lines.every((l) => l.startsWith(`${who}:`)), lines.join('|'));
        assert.ok(labels(s).some((l) => /leave you to it/.test(l)));
    });

    test(`${knot}: choices change what is heard, and a re-talk skips the opener`, () => {
        const s = open(WATCH, knot);
        run(s);
        const before = labels(s);
        s.ChooseChoiceIndex(0);
        const first = run(s).lines;
        assert.ok(first.length >= 1);
        const after = labels(s);
        assert.notDeepEqual(after, before, 'the asked question drops out or a follow-up appears');
        const again = open(WATCH, knot);
        run(again);
        assert.ok(labels(again).length >= 2);
    });

    test(`${knot}: trouble gives one short line and exits at once`, () => {
        const s = open(WATCH, knot, { ops_watch_upset: true });
        const { lines, tags } = run(s);
        assert.equal(lines.length, 1);
        assert.ok(tags.includes('exit_conversation'));
    });
}

// A met officer resumes in the hub: trouble must refuse there too (the start knot is skipped on a re-talk).
for (const [knot, hub, met, line] of [
    ['julian_start', 'julian_hub', 'julian_met', 'Not now, Agent.'],
    ['agnieszka_start', 'agnieszka_hub', 'agnieszka_met', "I've nothing to say to you."],
]) {
    test(`${hub}: a met officer with trouble refuses, with the same line as ${knot}`, () => {
        const s = open(WATCH, hub, { [met]: true, ops_watch_upset: true });
        const { lines, tags } = run(s);
        assert.equal(lines.length, 1);
        assert.ok(lines[0].endsWith(line), lines[0]);
        assert.ok(tags.includes('exit_conversation'));
        assert.equal(s.currentChoices.length, 0, 'no choices offered');
        const start = run(open(WATCH, knot, { ops_watch_upset: true })).lines;
        assert.deepEqual(lines, start, 'same spoken line, so no new clip');
    });
    test(`${hub}: without trouble the hub still offers its choices`, () => {
        const s = open(WATCH, hub, { [met]: true });
        run(s);
        assert.ok(labels(s).length >= 2);
    });
}

test('Julian: the rules option only appears after the watch question', () => {
    const s = open(WATCH, 'julian_start');
    run(s);
    assert.ok(!labels(s).some((l) => /anything the watch wants/.test(l)));
    s.ChooseChoiceIndex(labels(s).findIndex((l) => /relief watch actually do/.test(l)));
    run(s);
    assert.ok(labels(s).some((l) => /anything the watch wants/.test(l)));
});

const EXCHANGES = {
    ex_relief_handover: ['Julian Sallow', 'Agnieszka Duda', 'Julian Sallow'],
    ex_lock_it: ['Agnieszka Duda', 'Julian Sallow', 'Agnieszka Duda', 'Julian Sallow'],
    ex_the_suite: ['Julian Sallow', 'Agnieszka Duda', 'Julian Sallow'],
};
for (const [knot, speakers] of Object.entries(EXCHANGES)) {
    test(`${knot}: runs to the end in one pass, each line prefixed, heard flag starts false`, () => {
        const s = open(WATCH, knot);
        assert.equal(s.variablesState[`heard_${knot}`], false);
        const { lines } = run(s);
        assert.equal(s.currentChoices.length, 0, 'no choices in an exchange');
        assert.deepEqual(lines.map((l) => l.split(':')[0]), speakers);
        assert.ok(lines[0].split(':')[1].trim().length > 10, 'first line stands alone');
        assert.ok(lines.every((l) => l.split(/\s+/).length <= 20));
        assert.ok(!lines.some((l) => /\b\d{1,2}(:\d\d)?\s?(am|pm)\b|o'clock|midnight/i.test(l)), 'no clock hour');
    });
}

// ---- Debrief: the night-watch conduct beat ----
const NONE = { julian_ko: false, agnieszka_ko: false };
function hunt(vars) {
    const s = open(DEBRIEF, 'the_hunt', { ...NONE, ...vars });
    return { s, ...run(s) };
}
const ONE = /knocked down one of the night watch/;
const BOTH = /knocked down both of the night watch/;

for (const [name, vars, want] of [
    ['only Julian', { julian_ko: true }, ONE],
    ['only Agnieszka', { agnieszka_ko: true }, ONE],
    ['both', { julian_ko: true, agnieszka_ko: true }, BOTH],
]) {
    test(`debrief, ${name} knocked down: the right line, then the conduct beat`, () => {
        const { s, lines } = hunt(vars);
        const text = lines.join('\n');
        assert.match(text, want);
        assert.equal(ONE.test(text) && BOTH.test(text), false, 'never both variants');
        assert.ok(labels(s).includes('It was wrong, sir.'), 'conduct beat offered: ' + labels(s));
    });
}

test('debrief, no officer knocked down: no night-watch line and no conduct beat', () => {
    const { s, lines } = hunt({});
    const text = lines.join('\n');
    assert.ok(!ONE.test(text) && !BOTH.test(text));
    assert.ok(!labels(s).includes('It was wrong, sir.'));
});

test('debrief, the conduct beat continues into the case after a choice', () => {
    const { s } = hunt({ julian_ko: true });
    s.ChooseChoiceIndex(0);
    const { lines } = run(s);
    assert.match(lines.join('\n'), /Now the case/);
});
