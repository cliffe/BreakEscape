// m10 blind part 3: every finale path in the compiled Tesseract ink reaches its ending.
// Each irreversible choice carries #ending_check in its brackets, taking it sets `ending`,
// and the conversation then closes (#exit_conversation), which is what opens the closing
// scene (a conversation_closed:tesseract mapping for that ending in scenario.json.erb).
// Run with: node test/js/m10-finale-paths.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const JSON_TEXT = readFileSync(join(root, 'scenarios/m10_full_disclosure/ink/m10_tesseract.json'), 'utf8').replace(/^﻿/, '');
const ERB = readFileSync(join(root, 'scenarios/m10_full_disclosure/scenario.json.erb'), 'utf8');

function at(knot, vars = {}) {
    const s = new Story(JSON_TEXT);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.ChoosePathString(knot);
    return s;
}
function drain(s) {
    const lines = [], tags = [];
    while (s.canContinue) {
        lines.push(s.Continue().trim());
        tags.push(...(s.currentTags || []));
    }
    return { lines, tags };
}
/** Take the one choice matching `re`; fails listing what was on screen. */
function take(s, re) {
    const i = s.currentChoices.findIndex((c) => re.test(c.text));
    assert.ok(i >= 0, `${re} not offered: ${s.currentChoices.map((c) => c.text).join(' | ')}`);
    const choice = s.currentChoices[i];
    s.ChooseChoiceIndex(i);
    return choice;
}
/** Take an ending choice: it asks first, it ends the talk, and `ending` is set. */
function takeEnding(s, re, ending) {
    const c = take(s, re);
    assert.ok((c.tags || []).includes('ending_check'), `"${c.text}" carries #ending_check`);
    const out = drain(s);
    assert.ok(out.tags.includes('exit_conversation'), `"${c.text}" closes the conversation`);
    assert.equal(s.variablesState.ending, ending);
    return out;
}

const SEATED = { exchange_1: 'miss', exchange_2: 'miss', exchange_3: 'miss' };
const STANDING = { exchange_1: 'rebuttal', exchange_2: 'record', exchange_3: 'miss' };

test('every ending value has a closing scene opened by conversation_closed:tesseract', () => {
    const six = ERB.match(/%w\[([a-z ]+)\]\.each do \|ending\| %>\s*\{ "eventPattern": "conversation_closed:tesseract"/);
    assert.ok(six, 'the six_oclock closing mappings');
    const endings = new Set(six[1].trim().split(/\s+/));
    assert.ok(/conversation_closed:tesseract", "condition": "globalVars\.ending === 'joined'/.test(ERB), 'citadel for joined');
    endings.add('joined');
    for (const e of ['arrest', 'surrender', 'lethal', 'executed', 'scorched', 'joined']) assert.ok(endings.has(e), e);
});

test('seated (the reported path): "You\'re under arrest." then Hold fire ends in arrest with the feed held', () => {
    const s = at('his_end', SEATED);
    drain(s);
    const c = take(s, /^You're under arrest\.$/);
    assert.ok(!(c.tags || []).includes('ending_check'), 'the step before the reach does not ask');
    const reach = drain(s);
    assert.ok(reach.lines.some((l) => /hand goes to the console/.test(l)));
    assert.deepEqual(s.currentChoices.map((x) => x.text), ['Fire.', 'Hold fire.']);
    const out = takeEnding(s, /^Hold fire\.$/, 'arrest');
    assert.equal(s.variablesState.fire_held, true);
    assert.ok(out.lines.some((l) => /holds out his wrists/.test(l)));
});

test('seated: "You\'re under arrest." then Fire ends lethal', () => {
    const s = at('his_end', SEATED);
    drain(s);
    take(s, /^You're under arrest\.$/);
    drain(s);
    takeEnding(s, /^Fire\.$/, 'lethal');
});

test('seated: shoot him where he sits, then Do it, ends executed', () => {
    const s = at('his_end', SEATED);
    drain(s);
    take(s, /^Shoot him where he sits\.$/);
    drain(s);
    takeEnding(s, /^Do it\.$/, 'executed');
});

test('seated: lower the weapon goes back to the arrest, which still reaches the ending', () => {
    const s = at('his_end', SEATED);
    drain(s);
    take(s, /^Shoot him where he sits\.$/);
    drain(s);
    take(s, /^Lower the weapon\.$/);
    drain(s);
    assert.ok(!s.currentChoices.some((c) => /Shoot him/.test(c.text)), 'shoot is gone once lowered');
    take(s, /^You're under arrest\.$/);
    drain(s);
    takeEnding(s, /^Hold fire\.$/, 'arrest');
});

test('standing: cooperate ends in surrender; no deal ends in arrest', () => {
    let s = at('his_end', STANDING);
    drain(s);
    takeEnding(s, /^Then cooperate/, 'surrender');
    s = at('his_end', STANDING);
    drain(s);
    takeEnding(s, /^No deal\. You're under arrest\.$/, 'arrest');
});

test('standing: shoot him where he stands, then Do it, ends executed', () => {
    const s = at('his_end', STANDING);
    drain(s);
    take(s, /^Shoot him where he stands\.$/);
    drain(s);
    takeEnding(s, /^Do it\.$/, 'executed');
});

test('a reopen after the opening beat goes straight back to the same choices', () => {
    const s = at('his_end', SEATED);
    drain(s);
    s.ChoosePathString('his_end');
    drain(s);
    take(s, /^You're under arrest\.$/);
    drain(s);
    takeEnding(s, /^Hold fire\.$/, 'arrest');
});

test('the database: wipe both ends scorched', () => {
    const s = at('database_menu', { tess_menu: true });
    drain(s);
    takeEnding(s, /^Wipe both/, 'scorched');
});

test('join: publish it ends joined', () => {
    const s = at('join_3');
    drain(s);
    takeEnding(s, /^Yes\. Publish it\.$/, 'joined');
});
