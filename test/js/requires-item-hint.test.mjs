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
