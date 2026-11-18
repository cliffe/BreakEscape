// m02 security guard: a chat reopened at a menu knot after a fight must not offer the
// cover-challenge choices (release audit m02 #3). Run with: node test/js/m02-guard-reopen.test.mjs

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
const json = readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.json'), 'utf8').replace(/^﻿/, '');

function open(knot, vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    let text = '';
    while (s.canContinue) text += s.Continue();
    return { choices: s.currentChoices.map((c) => c.text.trim()), text };
}

const KNOTS = ['cover_challenge_options', 'the_argument', 'reeves_questions'];

for (const knot of KNOTS) {
    test(`${knot}: after a fight only the walk-away choice is offered`, () => {
        const r = open(knot, { attacked_guard: true, guard_knocked_out: false, cover_burned: true });
        assert.deepEqual(r.choices, ['Walk away.']);
        assert.match(r.text, /all in my log/);
    });

    test(`${knot}: without a fight the menu is unchanged`, () => {
        const r = open(knot, { attacked_guard: false, cover_burned: true });
        assert.ok(r.choices.length > 0);
        assert.ok(!r.choices.includes('Walk away.') || r.choices.length > 1);
        assert.doesNotMatch(r.text, /all in my log/);
    });
}

test('a knocked-out guard is not routed to the fight dialogue', () => {
    const r = open('cover_challenge_options', { attacked_guard: true, guard_knocked_out: true, cover_burned: true });
    assert.doesNotMatch(r.text, /all in my log/);
});
