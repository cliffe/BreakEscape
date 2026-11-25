// S7 R1-S1 (client half): the server withholds the entry of a revealsFacts / grant_fact fact until it is
// earned and sends it on the answer that earns it. The client merges it into social.intelFacts before
// granting, so the REAL grantFact (social-intel.js, run through the real applyActions) finds it.
// Run with: bin/test-js test/js/earned-fact-entries.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'earned-fact-entries-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel, rewrites = []) => {
    let code = readFileSync(join(js, rel), 'utf8');
    for (const [a, b] of rewrites) code = code.split(a).join(b);
    put(rel, code);
};
put('stubs/rooms.js', 'export const rooms = {};');
put('stubs/ink.js', 'export default class InkEngine {}');
put('stubs/config.js', "export const CSRF_TOKEN = 'x';");
put('stubs/info-label.js', 'export function setHudLabel() {} export function clearHudLabel() {}');
for (const rel of ['systems/forced-minigame-guard.js', 'systems/consumables.js', 'systems/global-writer.js', 'systems/social-intel.js',
    'systems/apply-actions.js', 'utils/display-dashes.js', 'utils/author-html.js', 'utils/escape-html.js']) copy(rel);
copy('systems/inventory.js', [
    ["'../core/rooms.js'", "'../stubs/rooms.js'"], ["'./ink/ink-engine.js'", "'../stubs/ink.js'"],
    ["'../config.js'", "'../stubs/config.js'"], ["'../ui/info-label.js'", "'../stubs/info-label.js'"]]);

const dom = new JSDOM('<!doctype html><div id="inventory-container"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const url = (rel) => pathToFileURL(join(dir, rel)).href;
const inv = await import(url('systems/inventory.js'));
const { applyActions } = await import(url('systems/apply-actions.js'));
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

const ENTRY = { label: 'Dana named her cat', text: 'Dana named her cat Biscuit' };
let answer;
function reset() {
    answer = { success: true };
    globalThis.fetch = async () => ({ json: async () => answer });
    window.breakEscapeConfig = { gameId: 77 };
    window.lockRef = (i) => i?.opens_lock || i?.key_id || null;
    window.gameState = { notes: [], globalVariables: {} };
    window.gameAlert = () => {};
    window.eventDispatcher = { emit() {} };
    // a bootstrap that lacks the unearned fact's entry
    window.gameScenario = { social: { intelFacts: { other: { label: 'Other' } } } };
    window.applyActions = applyActions;
    inv.initializeInventory();
}
const sprite = (data) => ({ name: data.type, objectId: `obj_${data.id}`, scenarioData: data, texture: { key: data.type }, setVisible() { return this; } });
const held = () => window.gameState.globalVariables.se_intel_danaPet === true;

test('a take whose answer carries the entry grants the fact', async () => {
    reset();
    answer = { success: true, facts: { danaPet: ENTRY } };
    const r = await inv.addToInventory(sprite({ type: 'lockpick', id: 'dana_notes', name: 'Dana notes', takeable: true, revealsFacts: ['danaPet'] }));
    assert.equal(r.ok, true);
    assert.deepEqual(window.gameScenario.social.intelFacts.danaPet, ENTRY);
    assert.equal(held(), true);
});

test('without the entry (the bootstrap lacks it) the grant is skipped, as before', async () => {
    reset();
    await inv.addToInventory(sprite({ type: 'lockpick', id: 'dana_notes2', name: 'Dana notes', takeable: true, revealsFacts: ['danaPet'] }));
    assert.equal(held(), false);
});

test('a notes-family item and a key item grant from the answer too', async () => {
    reset();
    answer = { success: true, facts: { danaPet: ENTRY } };
    await inv.addToInventory(sprite({ type: 'notes', id: 'n1', name: 'Notes', takeable: true, revealsFacts: ['danaPet'] }));
    assert.equal(held(), true);
    reset();
    answer = { success: true, facts: { danaPet: ENTRY } };
    await inv.addToInventory(sprite({ type: 'key', id: 'k1', name: 'Key', takeable: true, key_id: 'k1', revealsFacts: ['danaPet'] }));
    assert.equal(held(), true, 'R1-C17: a key that reveals a fact grants it');
});

test('a grant_fact reward carrying its entry grants through the real grantFact', () => {
    reset();
    applyActions([{ type: 'grant_fact', fact: 'danaPet', entry: ENTRY }], { source: 'flag_reward' });
    assert.deepEqual(window.gameScenario.social.intelFacts.danaPet, ENTRY);
    assert.equal(held(), true);
});

test('a give_item reward carrying facts grants them', async () => {
    reset();
    applyActions([{ type: 'give_item', success: true, facts: { danaPet: ENTRY },
        item: { type: 'lockpick', id: 'reward_notes', name: 'Reward notes', takeable: true, revealsFacts: ['danaPet'] } }], { source: 'flag_reward' });
    await settle();
    assert.deepEqual(window.gameScenario.social.intelFacts.danaPet, ENTRY);
    assert.equal(held(), true);
});

test('a listed fact is not overwritten and a hostile id is ignored', () => {
    reset();
    applyActions([{ type: 'grant_fact', fact: 'other', entry: { label: 'Swapped' } }], { source: 'flag_reward' });
    assert.equal(window.gameScenario.social.intelFacts.other.label, 'Other');
    answer = { success: true };
    const facts = JSON.parse('{"__proto__": {"label": "x"}, "constructor": {"label": "y"}}');
    applyActions([{ type: 'give_item', facts, item: { type: 'lockpick', id: 'z', name: 'z' } }], {});
    assert.equal(Object.prototype.hasOwnProperty.call(window.gameScenario.social.intelFacts, 'constructor'), false);
    assert.equal(({}).label, undefined);
});
