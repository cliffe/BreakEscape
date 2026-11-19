// m01 confirm minors: post-it, HaX pointer, task wording, drop-site description and the
// post-mission hub gates on Maya and Sarah. Boolean asserts only. Runs the real compiled ink.
// Run with: node test/js/m01-confirm-minors.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const dir = join(root, 'scenarios/m01_first_contact');
const erb = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');
const { Story } = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const load = (f) => new Story(readFileSync(join(dir, 'ink', f), 'utf8').replace(/^﻿/, ''));

test('Derek post-it points at the break room bin', () => {
    const m = erb.match(/"postitNote":\s*"(Anniversary[^"]*)"/);
    assert.ok(m !== null, 'post-it note exists');
    assert.ok(m[1].includes('break room'), 'post-it mentions the break room');
    assert.ok(m[1].includes("Lisa's card"), 'post-it mentions the card');
});

test('HaX first Derek-door text points at the manager office', () => {
    const m = erb.match(/"message":\s*"That door's locked\.[^"]*"/);
    assert.ok(m !== null, 'HaX locked-door text exists');
    assert.ok(m[0].includes("manager's office"), 'text names the manager office');
});

test('drop-site task titles and terminal description say where the keys go', () => {
    assert.ok(erb.includes('"title": "Unlock the ENTROPY encrypted archive (enter the decryption key at the archive)"'), 'archive title');
    assert.ok(erb.includes('"title": "Enter the launch authorisation code on Derek\'s launch device"'), 'launch title');
    assert.ok(erb.includes('the archive key and the launch code are recognised here but entered at the archive and the launch device'), 'terminal description');
});

function hubChoices(file, hubKnot, ready, vars) {
    const s = load(file);
    for (const [k, v] of Object.entries(vars)) s.variablesState[k] = v;
    s.variablesState['ready_for_debrief'] = ready;
    s.ChoosePathString(hubKnot);
    while (s.canContinue) s.Continue();
    return s.currentChoices.map(c => c.text);
}

test('Maya hides "What should I do first?" once ready_for_debrief', () => {
    const q = 'What should I do first?';
    const before = hubChoices('m01_npc_maya.json', 'hub', false, { revealed_informant: true });
    const after = hubChoices('m01_npc_maya.json', 'hub', true, { revealed_informant: true });
    assert.ok(before.includes(q), 'offered before the abort');
    assert.ok(!after.includes(q), 'hidden after the abort');
    assert.ok(after.includes('I need to keep investigating'), 'exit still offered');
});

test('Sarah hides "Where exactly is the IT room?" once ready_for_debrief', () => {
    const q = 'Where exactly is the IT room?';
    const before = hubChoices('m01_npc_sarah.json', 'hub', false, {});
    const after = hubChoices('m01_npc_sarah.json', 'hub', true, {});
    assert.ok(before.includes(q), 'offered before the abort');
    assert.ok(!after.includes(q), 'hidden after the abort');
    assert.ok(after.length > 0, 'other choices remain');
});
