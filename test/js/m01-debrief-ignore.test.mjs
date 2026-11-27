// m01 debrief: "read the contingency file and did nothing" counts as the ignore outcome.
// The phone knots that used to set kevin_choice = "ignore" are unreachable, so the debrief
// infers it at `start`. Run with: node test/js/m01-debrief-ignore.test.mjs

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

const IGNORE_BEAT = /Kevin Park was arrested this morning/;
const WARN_BEAT = /you warned Kevin about the frame-up/;

// Play the debrief from `start`, taking the first choice each time, and
// return everything HaX said plus the story (for variable checks).
function play(vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString('start');
    let text = '';
    for (let i = 0; i < 60; i++) {
        while (s.canContinue) text += s.Continue();
        if (!s.currentChoices.length) break;
        s.ChooseChoiceIndex(0);
    }
    return { text, s };
}

test('read the contingency file and chose nothing: the ignore beat plays', () => {
    const { text, s } = play({ contingency_file_read: true });
    assert.match(text, IGNORE_BEAT);
    assert.doesNotMatch(text, WARN_BEAT);
    assert.equal(s.variablesState.kevin_choice, 'ignore');
});

test('never read the file: no frame-up beat and kevin_choice stays empty', () => {
    const { text, s } = play({ contingency_file_read: false });
    assert.doesNotMatch(text, IGNORE_BEAT);
    assert.doesNotMatch(text, WARN_BEAT);
    assert.equal(s.variablesState.kevin_choice, '');
});

test('warned Kevin: the warn beat plays, not the ignore beat, and the choice is kept', () => {
    const { text, s } = play({ contingency_file_read: true, kevin_choice: 'warn' });
    assert.match(text, WARN_BEAT);
    assert.doesNotMatch(text, IGNORE_BEAT);
    assert.equal(s.variablesState.kevin_choice, 'warn');
});

test('Kevin was removed: no ignore inferred even with the file read', () => {
    const { text, s } = play({ contingency_file_read: true, kevin_ko: true });
    assert.doesNotMatch(text, IGNORE_BEAT);
    assert.equal(s.variablesState.kevin_choice, '');
});
