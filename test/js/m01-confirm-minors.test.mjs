// m01 confirm minors: HaX pointer, task wording, drop-site description and the
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

test('HaX points at the manager office only until it has been entered', () => {
    assert.ok(erb.includes('"message": "Patricia kept her things in the manager\'s office, so start there."'), 'pointer text exists');
    assert.ok(erb.includes("data.connectedRoom === 'derek_office' && globalVars.manager_office_seen !== true"), 'pointer is gated on the office not yet seen');
    assert.ok(erb.includes('"eventPattern": "room_entered:manager_office"'), 'office entry sets the flag');
    assert.ok(/"manager_office_seen":\s*false/.test(erb), 'flag declared');
});

test('precondition guard: ready_for_debrief is declared and set by the abort', () => {
    assert.ok(/"ready_for_debrief":\s*false/.test(erb), 'declared in globalVariables');
    assert.ok(/"onAbort"[\s\S]{0,400}"ready_for_debrief":\s*true/.test(erb), 'onAbort sets it');
});

test('drop-site task titles and terminal description say where the keys go', () => {
    assert.ok(erb.includes('"title": "Enter the decryption key at the ENTROPY archive"'), 'archive title');
    assert.ok(erb.includes('"title": "Enter the launch authorisation code on the ENTROPY Launch Device"'), 'launch title');
    assert.ok(erb.includes('those go into the archive and the launch device'), 'terminal description');
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
    assert.ok(after.some(c => c.includes('Thanks')), 'other choices remain');
});

test('the Derek-door pointer fires through the real mapping check only before the office is seen', async () => {
    const { mkdtempSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { pathToFileURL } = await import('node:url');
    const sys = join(root, 'public/break_escape/js/systems');
    const d = mkdtempSync(join(tmpdir(), 'm01cm-'));
    writeFileSync(join(d, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
    writeFileSync(join(d, 'phone-chat-speaker.mjs'), readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
    writeFileSync(join(d, 'npc-manager.mjs'), readFileSync(join(sys, 'npc-manager.js'), 'utf8')
        .replace("'./npc-los.js'", "'./npc-los.mjs'").replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
    globalThis.window = { gameState: { globalVariables: {} } };
    const { default: NPCManager } = await import(pathToFileURL(join(d, 'npc-manager.mjs')).href);
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    const cfg = { eventPattern: 'door_unlock_attempt', onceOnly: true, once: true, cooldown: 0, handlerIndex: 61,
        condition: "data.connectedRoom === 'derek_office' && globalVars.manager_office_seen !== true" };
    const fire = (room) => m._mappingWouldFire('agent_0x99', 'door_unlock_attempt', cfg, { connectedRoom: room }).fire === true;
    assert.ok(fire('derek_office') === true, 'fires before the office is seen');
    assert.ok(fire('server_room') === false, 'not for another door');
    window.gameState.globalVariables.manager_office_seen = true;
    assert.ok(fire('derek_office') === false, 'silent once the office is seen');
    delete globalThis.window;
});
