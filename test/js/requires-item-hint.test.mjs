// requiresItemHintVariants: an object with requiresItem gives one refusal hint per
// state, resolved like observationVariants and textVariants (first match wins), with
// requiresItemHint as the fallback and the engine default after that. The toast lasts
// by length: 300 ms per word, at least 6 s and at most 12 s.
// Run with: node --test test/js/requires-item-hint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const { requiresItemHint, DEFAULT_REQUIRES_ITEM_HINT } =
    await import(join(js, 'systems/requires-item-hint.js'));
// The one duration rule of every hint toast; interactions.js imports it directly.
const { hintToastMs } = await import(join(js, 'utils/locked-hint.js'));

const pc = {
    id: 'staff_pc', type: 'pc', requiresItem: 'keylogger',
    requiresItemHint: 'Collect the keylogger first.',
    requiresItemHintVariants: [
        { condition: 'globalVars.captured', value: 'It has a capture.' },
        { condition: 'globalVars.planted && globalVars.staff_pc_screen_locked', value: 'Planted, screen locked.' },
        { condition: 'globalVars.planted', value: 'Planted.' },
        { condition: 'globalVars.staff_pc_screen_locked', value: 'Screen locked.' }
    ]
};

test('variants resolve in order and the first match wins', () => {
    assert.equal(requiresItemHint(pc, { captured: true, planted: true, staff_pc_screen_locked: true }), 'It has a capture.');
    assert.equal(requiresItemHint(pc, { planted: true, staff_pc_screen_locked: true }), 'Planted, screen locked.');
    assert.equal(requiresItemHint(pc, { planted: true, staff_pc_screen_locked: false }), 'Planted.');
    assert.equal(requiresItemHint(pc, { staff_pc_screen_locked: true }), 'Screen locked.');
});

test('no matching variant falls back to requiresItemHint', () => {
    assert.equal(requiresItemHint(pc, {}), 'Collect the keylogger first.');
    assert.equal(requiresItemHint({ requiresItem: 'x', requiresItemHint: 'Base.' }, { planted: true }), 'Base.');
});

test('no hint at all falls back to the default, with or without variants', () => {
    assert.equal(requiresItemHint({ requiresItem: 'x' }, {}), DEFAULT_REQUIRES_ITEM_HINT);
    assert.equal(requiresItemHint({ requiresItem: 'x', requiresItemHint: '' }, {}), DEFAULT_REQUIRES_ITEM_HINT);
    const onlyVariants = { requiresItem: 'x', requiresItemHintVariants: [{ condition: 'globalVars.a', value: 'A.' }] };
    assert.equal(requiresItemHint(onlyVariants, {}), DEFAULT_REQUIRES_ITEM_HINT);
    assert.equal(requiresItemHint(onlyVariants, { a: true }), 'A.');
});

test('the live globals are read when none are passed', () => {
    globalThis.window = { gameState: { globalVariables: { planted: true } } };
    try {
        assert.equal(requiresItemHint(pc), 'Planted.');
    } finally {
        delete globalThis.window;
    }
});

test('the toast lasts 300 ms per word, at least 6 s and at most 12 s', () => {
    const words = n => Array.from({ length: n }, () => 'word').join(' ');
    assert.equal(hintToastMs(''), 6000);
    assert.equal(hintToastMs(undefined), 6000);
    assert.equal(hintToastMs(DEFAULT_REQUIRES_ITEM_HINT), 6000);
    assert.equal(hintToastMs(words(20)), 6000);
    assert.equal(hintToastMs(words(21)), 6300);
    assert.equal(hintToastMs(words(30)), 9000);
    assert.equal(hintToastMs(words(40)), 12000);
    assert.equal(hintToastMs(words(80)), 12000);
    // runs of spaces and line breaks are not words
    assert.equal(hintToastMs(`  ${words(15)}  \n\n ${words(15)}  `), 9000);
});

test('interactions.js shows the resolved hint for its own duration', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    // (the branch itself is run in examine-minigame.test.mjs)
    assert.match(src, /const hint = requiresItemHint\(sprite\.scenarioData\);\s+window\.gameAlert\?\.\(hint, 'info', '', hintToastMs\(hint\)\)/);
    assert.match(src, /import \{ hintToastMs \} from '\.\.\/utils\/locked-hint\.js'/);
    assert.doesNotMatch(src, /scenarioData\.requiresItemHint\b/);
});

// requiresItemCondition (lab blind playtest finding 6): the keylogger is planted only while
// Chris is away from her desk, as the hint says.
test('requiresItemCondition: no condition, or a condition that holds, lets the use go ahead', async () => {
    const { requiresItemConditionRefusal } = await import(join(js, 'systems/requires-item-hint.js'));
    assert.equal(requiresItemConditionRefusal(pc, {}), null);
    const gated = { ...pc, requiresItemCondition: 'globalVars.staff_pc_owner_away',
                    requiresItemConditionHint: 'Wait until she is away.' };
    assert.equal(requiresItemConditionRefusal(gated, { staff_pc_owner_away: true }), null);
});

test('requiresItemCondition: a condition that fails gives the hint, its variants, or the default', async () => {
    const { requiresItemConditionRefusal, DEFAULT_REQUIRES_ITEM_CONDITION_HINT } =
        await import(join(js, 'systems/requires-item-hint.js'));
    const gated = { ...pc, requiresItemCondition: 'globalVars.staff_pc_owner_away',
                    requiresItemConditionHint: 'Wait until she is away.',
                    requiresItemConditionHintVariants: [{ condition: 'globalVars.warned', value: 'Still at her desk.' }] };
    assert.equal(requiresItemConditionRefusal(gated, { staff_pc_owner_away: false }), 'Wait until she is away.');
    assert.equal(requiresItemConditionRefusal(gated, { warned: true }), 'Still at her desk.');
    assert.equal(requiresItemConditionRefusal({ requiresItemCondition: 'globalVars.x' }, {}), DEFAULT_REQUIRES_ITEM_CONDITION_HINT);
});

test('interactions.js checks the condition after the item is found and before the actions fire or the item is consumed', () => {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const held = src.indexOf('if (!held) {');
    const gate = src.indexOf('requiresItemModule.requiresItemConditionRefusal?.(sprite.scenarioData)');
    const fire = src.indexOf("applyActions(sprite.scenarioData.triggerOnInteract, { source: 'object_interact'", gate);
    const consume = src.indexOf('window.removeFromInventory?.(held)', gate);
    assert.ok(held > 0 && gate > held, 'gate after the held check');
    assert.ok(fire > gate && consume > fire, 'gate before firing and consuming');
    assert.match(src.slice(gate, fire), /return;/);
});

test('the lab keylogger plant is gated on Chris being away from her desk', () => {
    const erb = readFileSync(join(js, '../../../scenarios/lab_physical_pentest/scenario.json.erb'), 'utf8');
    const at = erb.indexOf('"id": "staff_pc"');
    const block = erb.slice(at, erb.indexOf('"triggerOnInteract"', at));
    assert.match(block, /"requiresItemCondition": "globalVars\.staff_pc_owner_away"/);
    assert.match(block, /"requiresItemConditionHint": "[^"]+"/);
});
