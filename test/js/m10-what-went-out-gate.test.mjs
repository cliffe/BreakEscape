// m10 wordy R1 m1: HaX's "[What went out?]" hub topic hides once the player
// has stepped into the core, because `arrival` already plays the same lines.
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
const json = readFileSync(join(root, 'scenarios/m10_full_disclosure/ink/m10_phone_agent0x99.json'), 'utf8').replace(/^﻿/, '');

function hubLabels(vars) {
    const s = new Story(json);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString('support_hub');
    while (s.canContinue) s.Continue();
    return s.currentChoices.map((c) => c.text.trim());
}
const WENT_OUT = /What went out\?/;

test('What went out? is offered after the lock opens, before the core', () => {
    const labels = hubLabels({ outer_lock_open: true, hax_jammed: false, core_greeted: false });
    assert.ok(labels.some((l) => WENT_OUT.test(l)), labels.join(' | '));
});

test('What went out? is hidden once arrival has told it (core_greeted)', () => {
    const labels = hubLabels({ outer_lock_open: true, hax_jammed: false, core_greeted: true });
    assert.ok(!labels.some((l) => WENT_OUT.test(l)), labels.join(' | '));
});

test('What went out? stays hidden after the topic itself was heard', () => {
    const labels = hubLabels({ outer_lock_open: true, hax_jammed: false, what_went_out_given: true });
    assert.ok(!labels.some((l) => WENT_OUT.test(l)));
});
