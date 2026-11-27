// m01 deploy-gate finding: after the ENTROPY archive was read, the first talk with Derek
// showed the stale "come back with evidence" hub, and confront_derek completed on opening
// the confrontation rather than on a branch outcome. The engine reads ahead past an
// #exit_conversation tag and saves the story after the first line of insufficient_evidence;
// a reopen resumes there, so the knot must recheck the flag after that line.
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
const src = readFileSync(join(root, 'scenarios/m01_first_contact/ink/m01_derek_confrontation.json'), 'utf8').replace(/^﻿/, '');

const BUSY = "I'm kind of busy. Maybe check back later?";
const OPENING = 'Working late on the security audit?';

test('Derek: saved after the first stale-hub line, a reopen with the archive read opens the confrontation', () => {
    const s = new Story(src);
    s.variablesState.entropy_reveal_read = false;
    s.ChoosePathString('insufficient_evidence');
    assert.equal(s.Continue().trim(), 'Oh, you must be the IT contractor. Security audit, right?');
    // Save here (what the engine does), restore, then the archive is read before the reopen.
    const saved = s.state.toJson();
    const r = new Story(src);
    r.state.LoadJson(saved);
    r.variablesState.entropy_reveal_read = true;
    const lines = [];
    while (r.canContinue) lines.push(r.Continue().trim());
    assert.ok(lines.includes(OPENING), lines.join(' | '));
    assert.ok(!lines.includes(BUSY), lines.join(' | '));
    assert.equal(r.currentChoices.length, 3); // the fourth needs found_casualty_projections
});

test('Derek: with the archive still unread the stale hub is unchanged', () => {
    const s = new Story(src);
    s.variablesState.entropy_reveal_read = false;
    s.ChoosePathString('insufficient_evidence');
    const lines = [];
    while (s.canContinue) lines.push(s.Continue().trim());
    assert.ok(lines.includes(BUSY));
    assert.equal(s.currentChoices.length, 3);
});

test('Derek: opening the confrontation does not complete confront_derek; each outcome sets derek_confronted', () => {
    const s = new Story(src);
    s.variablesState.entropy_reveal_read = true;
    s.ChoosePathString('start');
    const tags = [];
    while (s.canContinue) { s.Continue(); tags.push(...(s.currentTags || [])); }
    assert.ok(!tags.some(t => /complete_task:confront_derek/.test(t)), tags.join(' | '));
    const ink = readFileSync(join(root, 'scenarios/m01_first_contact/ink/m01_derek_confrontation.ink'), 'utf8');
    assert.ok(!/#complete_task:confront_derek/.test(ink));
    for (const knot of ['arrest_outcome', 'recruit_outcome', 'expose_outcome', 'surrender_outcome']) {
        const body = ink.split('=== ' + knot + ' ===')[1].split('\n===')[0];
        assert.match(body, /#set_global:derek_confronted:true/, knot);
    }
    assert.match(ink.split('=== fight_outcome ===')[1].split('\n===')[0], /derek_confronted = true/);
});
