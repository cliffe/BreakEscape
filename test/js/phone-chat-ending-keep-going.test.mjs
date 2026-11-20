// A phone line tagged #ending_check answered "Keep going" prints nothing (lab_tesseract_trials
// "I'm clear. Debrief me." printed "On my way to you." with no debrief). The gate is
// _endingKeptGoing; handleChoice and _presentOutput drop the batch's text when it is true.
// Run with: node --test test/js/phone-chat-ending-keep-going.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
const m = src.match(/\n    async _endingKeptGoing\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, '_endingKeptGoing found');
const gate = new Function(`return async function (${m[1]}) {\n${m[2]}\n};`)();

test('no ending_check tag: never asks', async () => {
    let asked = 0;
    globalThis.window = { endingCheck: { confirm: async () => { asked++; return false; } } };
    assert.equal(await gate(['speaker:agent_0x99', 'set_global:x:true']), false);
    assert.equal(asked, 0);
});
test('ending_check, End: not kept going', async () => {
    globalThis.window = { endingCheck: { confirm: async () => true } };
    assert.equal(await gate(['ending_check', 'set_global:a:true']), false);
});
test('ending_check, Keep going: kept going', async () => {
    globalThis.window = { endingCheck: { confirm: async () => false } };
    assert.equal(await gate(['speaker:x', 'ending_check']), true);
});
test('ending_check without the module: not kept going', async () => {
    globalThis.window = {};
    assert.equal(await gate(['ending_check']), false);
});
test('both display paths call the gate before typing', () => {
    assert.equal((src.match(/await this\._endingKeptGoing\?\.\(/g) || []).length, 2);
});
