// m09 blind-playtest "stuck" fixes: the Recruiter's task and a nudge after the ledger, the office
// and salvage keypad hints, the four field-guide links, and the Last Box after Sorensen is talked down.
// Run with: node test/js/m09-stuck-nudges.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'scenarios/m09_digital_archaeology/scenario.json.erb'), 'utf8');

test('ledger read-out unlocks answer_the_offer and schedules a skippable nudge', () => {
    assert.match(src, /global_variable_changed:ledger_read_heard", "condition" => "value === true && globalVars\.cage_opened", "onceOnly" => true, "unlockTask" => "answer_the_offer"/);
    assert.match(src, /"skipIfGlobal" => "recruiter_call_started", "message" => "Nothing more to pull here yet\./);
});

test('the new HaX mappings are appended after the last existing one', () => {
    const last = src.lastIndexOf('hax_maps << text_map("global_variable_changed:case_file_read"');
    const mine = src.indexOf('"unlockTask" => "answer_the_offer"');
    assert.ok(last > 0 && mine > last);
    assert.ok(src.indexOf('<%= jgen(hax_maps) %>') > mine);
});

test('office and salvage keypads carry a password hint', () => {
    assert.match(src, /"door_sign": "Director -- M\. Sorensen",\s*"locked": true,\s*"lockType": "password",\s*"passwordHint": "No code to find\./);
    assert.match(src, /"door_sign": "Salvage -- Bay 12",\s*"locked": true,\s*"lockType": "password",\s*"passwordHint": "[^"]*Vigenere/);
});

test('field-guide links point at published pages, not the missing field-guide-* pages', () => {
    assert.ok(!/m09-digital-archaeology\/field-guide-/.test(src));
    const urls = [...src.matchAll(/"labUrl": "(https:\/\/cliffe\.github\.io\/HacktivityLabSheets\/labs\/safetynet\/m09[^"]+)"/g)].map((m) => m[1]);
    assert.equal(urls.length, 4);
    for (const u of urls) assert.match(u, /\/m09-digital-archaeology(-vm-technical-steps)?\/#[a-z-]+$/);
});

test('Last Box: talked-down variant comes before the clock-run one (first match wins)', () => {
    const a = src.indexOf('"value": "Strips in the bin. The last box is gone." }');
    const b = src.indexOf("globalVars.legacy_clock_run && globalVars.sorensen_fate === 'talked'");
    assert.ok(b > 0 && a > b);
});

test('m09 password hints: both room locks set showHint so the pad shows passwordHint', () => {
    const hints = src.match(/"passwordHint": "[^"]*",\s*"showHint": true,/g) || [];
    assert.equal(hints.length, 2);
});
