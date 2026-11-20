// m01 Graham and Fatima: the first talk gives the greeting then the choices (hub); a re-talk
// gives the voiced return line then the choices, with neither the greeting nor the goodbye
// shown again. Runs the real compiled ink through inkjs.
// Run with: node test/js/m01-retalk-greeting-ink.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { Story } = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const load = (f) => new Story(readFileSync(join(root, 'scenarios/m01_first_contact/ink', f), 'utf8').replace(/^﻿/, ''));

function talk(story) {
    story.ChoosePathString('start');
    const lines = [];
    while (story.canContinue) { const t = story.Continue().trim(); if (t) lines.push(t); }
    return { lines, choices: story.currentChoices.map(c => c.text) };
}
function leave(story, label) {
    const i = story.currentChoices.findIndex(c => c.text === label);
    assert.ok(i >= 0, `choice "${label}" exists`);
    story.ChooseChoiceIndex(i);
    const lines = [];
    while (story.canContinue) { const t = story.Continue().trim(); if (t) lines.push(t); }
    return lines;
}

const cases = [
    { name: 'Graham', file: 'm01_npc_graham_whitfield.json', greeting: /^Graham Whitfield: Graham, finance/, ret: "Graham Whitfield: You again. Still quarter close, I'm afraid.", leave: "I'll leave you to it.", bye: /Only joking/ },
    { name: 'Fatima', file: 'm01_npc_fatima_begum.json', greeting: /^Fatima Begum: Sorry, I'm halfway/, ret: 'Fatima Begum: Back again? I really am up to my neck in CVs.', leave: "Don't let me keep you.", bye: /I only press the buttons/ }
];

for (const c of cases) {
    test(`${c.name}: first talk greets and offers the choices`, () => {
        const r = talk(load(c.file));
        assert.equal(r.lines.length, 1);
        assert.match(r.lines[0], c.greeting);
        assert.deepEqual(r.choices, [c.leave]);
    });
    test(`${c.name}: re-talk gives the return line, no greeting and no goodbye`, () => {
        const s = load(c.file);
        talk(s);
        const bye = leave(s, c.leave);
        assert.ok(bye.some(l => c.bye.test(l)), 'the goodbye was said');
        const r = talk(s);
        assert.deepEqual(r.lines, [c.ret]);
        assert.ok(!r.lines.some(l => c.greeting.test(l) || c.bye.test(l)));
        assert.deepEqual(r.choices, [c.leave]);
    });
}
