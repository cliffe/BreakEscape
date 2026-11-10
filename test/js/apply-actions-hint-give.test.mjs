// applyActions (systems/apply-actions.js):
// - give_item names the tray picture by the item's "sprite" first, then its type, as a
//   restored item does (code review R2, E-m3: the line had no test).
// - hint lasts by the length of its text, by the same rule as the refusal hints
//   (utils/locked-hint.js hintToastMs: 300 ms a word, 6 to 12 s). It used to last 5 s
//   whatever its length (lab_physical_pentest playtest N11: a 21 word pointer was gone
//   before it could be read).
// Run with: node test/js/apply-actions-hint-give.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {
    gameState: { globalVariables: {} },
    lockRef: (item) => item?.opens_lock,
    eventDispatcher: { on() {}, off() {}, emit() {} }
};
const { applyActions } = await import(dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`)));

const quietly = async (fn) => {
    const log = console.log; console.log = () => {};
    try { return await fn(); } finally { console.log = log; }
};
const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

test('give_item: the stand-in names the sprite picture first, then the type', async () => {
    const given = [];
    window.addToInventory = (sprite) => { given.push(sprite); return Promise.resolve({ ok: true, reason: 'added' }); };
    await quietly(() => applyActions([
        { type: 'give_item', item: { type: 'usb', sprite: 'charging_cable', name: 'Cable' } },
        { type: 'give_item', item: { type: 'pc', name: 'Remote session' } },
        { type: 'give_item', item: { type: 'pc', sprite: '', name: 'Empty sprite name' } }
    ]));
    assert.deepEqual(given.map(s => s.texture.key), ['charging_cable', 'pc', 'pc']);
    assert.equal(given[0].name, 'usb');
    assert.equal(given[0].scenarioData.name, 'Cable');
});

test('an NPC gift builds its stand-in the same way', () => {
    const src = readFileSync(join(js, 'systems/npc-game-bridge.js'), 'utf8');
    assert.match(src, /sourceNpcId: npcId,[^\n]*\n\s*texture: \{ key: \(typeof item\.sprite === 'string' && item\.sprite\) \|\| item\.type \}/);
});

test('hint: lasts by length when the rule is loaded', async () => {
    const { hintToastMs } = await import(dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')));
    assert.equal(window.hintToastMs, hintToastMs, 'locked-hint.js publishes the rule for apply-actions');
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    const plant = 'Clipped in. Now wait for Chris\'s coffee run: he locks up, and it records his password when he comes back and unlocks.';
    await quietly(() => applyActions([
        { type: 'hint', title: 'Keylogger planted', message: plant },
        { type: 'hint', message: 'Short one.' },
        { type: 'hint', message: words(60) },
        { type: 'hint', message: '' }
    ]));
    assert.equal(alerts.length, 3, 'an empty hint shows nothing');
    assert.deepEqual(alerts[0], [plant, 'info', 'Keylogger planted', 6600]);   // 22 words
    assert.deepEqual(alerts[1], ['Short one.', 'info', 'Intelligence Received', 6000]);
    assert.equal(alerts[2][3], 12000, 'capped');
});

test('hint: without the rule the toast keeps its default duration', async () => {
    const saved = window.hintToastMs;
    delete window.hintToastMs;
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    await quietly(() => applyActions([{ type: 'hint', title: 'T', message: 'Some text here.' }]));
    assert.deepEqual(alerts, [['Some text here.', 'info', 'T']]);
    window.hintToastMs = saved;
});
