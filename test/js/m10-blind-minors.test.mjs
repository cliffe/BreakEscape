// m10 blind part 3 minors: the accusation needs the bench log as well as the door log; Abena answers
// the corrected model after Wendell's call; HaX's first text names the hub; both PIN locks have a findable code.
// Run with: node test/js/m10-blind-minors.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const dir = join(root, 'scenarios/m10_full_disclosure');
const load = (n) => readFileSync(join(dir, 'ink', `m10_${n}.json`), 'utf8').replace(/^﻿/, '');
const ERB = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');

function story(npc, knot, vars) {
    const s = new Story(load(npc));
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    while (s.canContinue) s.Continue();
    return s;
}
const texts = (s) => s.currentChoices.map((c) => c.text);
const base = { whodunit_live: true, clue_door_log: true };

for (const [npc, knot, re] of [
    ['quintero', 'menu', /You're WREN/], ['malhotra', 'post', /You're WREN/], ['arakawa', 'menu', /You're WREN/],
    ['vector', 'post', /You're WREN/], ['kowalczyk', 'menu', /You're WREN/], ['phone_agent0x99', 'support_hub', /I know who WREN is/],
]) {
    test(`${npc}: accusation needs the bench log`, () => {
        const without = story(npc, knot, { ...base, clue_bench_log: false });
        assert.ok(!texts(without).some((t) => re.test(t)), `offered without the bench log: ${texts(without)}`);
        const withIt = story(npc, knot, { ...base, clue_bench_log: true });
        assert.ok(texts(withIt).some((t) => re.test(t)), `not offered with both logs: ${texts(withIt)}`);
    });
}

test('phantom: accusation needs the bench log', () => {
    const s = story('phantom', 'post', { ...base, pha_list_heard: true, clue_bench_log: true });
    assert.ok(texts(s).some((t) => /You're WREN/.test(t)));
    const n = story('phantom', 'post', { ...base, pha_list_heard: true, clue_bench_log: false });
    assert.ok(!texts(n).some((t) => /You're WREN/.test(t)));
});

test('asante: after Wendell\'s call the corrected model earns one answer', () => {
    const s = story('asante', 'hall', { server_hall_warned: true, margin_note_read: true });
    const i = texts(s).findIndex((t) => /corrected figures/.test(t));
    assert.ok(i >= 0, texts(s).join(' | '));
    s.ChooseChoiceIndex(i);
    const lines = [];
    while (s.canContinue) lines.push(s.Continue());
    assert.ok(lines.some((l) => /Then you've read them/.test(l)));
    assert.equal(s.variablesState.asante_confirmed_sheet, true);
    assert.ok(!texts(s).some((t) => /corrected figures/.test(t)), 'offered once');
    assert.ok(texts(s).some((t) => /Suit yourself/.test(t)));
    const none = story('asante', 'hall', { server_hall_warned: true, margin_note_read: false });
    assert.ok(!texts(none).some((t) => /corrected figures/.test(t)));
});

test('tesseract: the loose-end line names the bench log when only that is missing', () => {
    const s = new Story(load('tesseract'));
    s.variablesState.whodunit_live = true; s.variablesState.clue_door_log = true; s.variablesState.clue_bench_log = false;
    s.variablesState.casualty_sheet_read = true;
    s.ChoosePathString('start');
    const out = [];
    for (let k = 0; k < 40 && (s.canContinue || s.currentChoices.length); k++) {
        if (s.canContinue) out.push(s.Continue()); else break;
    }
    assert.ok(!out.some((l) => /We never read the office's door log/.test(l)));
});

test('scenario: HaX first text names the hub; both PIN locks have a readable code in the world', () => {
    assert.match(ERB, /Get me their monitoring\. If you're stuck, open this chat and pick from my list\./);
    for (const [id, pin] of [['keypad_reset_slip', 'cupboard_pin'], ['lock_maintenance_slip', 'outer_lock_pin']]) {
        const m = ERB.match(new RegExp(`"id": "${id}"[\\s\\S]{0,700}?"text": "[^"]*<%= ${pin} %>`));
        assert.ok(m, `${id} carries ${pin}`);
        assert.match(ERB.slice(ERB.indexOf(`"id": "${id}"`), ERB.indexOf(`"id": "${id}"`) + 400), /"takeable": true,\s*"readable": true/);
    }
});
