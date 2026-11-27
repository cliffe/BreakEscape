// m01 closing debrief: the lore lines stay off (nothing in m01 counts lore fragments), and the
// "two or fewer correct answers" audit line cannot play when Kevin's audit was skipped.
// Run with: node test/js/m01-debrief-lore-audit.test.mjs

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
const json = readFileSync(join(root, 'scenarios/m01_first_contact/ink/m01_closing_debrief.json'), 'utf8').replace(/^﻿/, '');

function run(knot, vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    let text = '';
    for (let i = 0; i < 200 && s.canContinue; i++) text += s.Continue();
    return text;
}

test('mission_end: neither lore line plays while lore is untracked', () => {
    for (const lore of [0, 1, 3, 5]) {
        const t = run('mission_end', { lore_collected: lore });
        assert.ok(!/look for additional intelligence/.test(t), `"next time" line at lore=${lore}`);
        assert.ok(!/several intelligence fragments/.test(t), `fragments line at lore=${lore}`);
        assert.ok(/Get some rest/.test(t), 'the ending itself still plays');
    }
});

test('mission_end: lore lines are reachable once lore is tracked', () => {
    assert.ok(/look for additional intelligence/.test(run('mission_end', { lore_tracked: true, lore_collected: 0 })));
    assert.ok(/several intelligence fragments/.test(run('mission_end', { lore_tracked: true, lore_collected: 3 })));
});

test('security_audit_review: audit skipped never plays the audit lines, whatever the score', () => {
    for (const n of [0, 1, 2, 3, 5]) {
        const t = run('security_audit_review', { security_audit_completed: false, audit_correct_answers: n });
        assert.ok(!/Two or fewer correct answers/.test(t), `rough line with audit skipped, score ${n}`);
        assert.ok(!/security analysis/.test(t), `audit feedback with audit skipped, score ${n}`);
    }
});

test('security_audit_review: the rough line plays only for a completed audit scoring two or fewer', () => {
    assert.ok(/Two or fewer correct answers/.test(run('security_audit_review', { security_audit_completed: true, audit_correct_answers: 2 })));
    assert.ok(!/Two or fewer correct answers/.test(run('security_audit_review', { security_audit_completed: true, audit_correct_answers: 3 })));
});
