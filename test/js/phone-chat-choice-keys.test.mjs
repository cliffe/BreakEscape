// Phone chat: number keys 1-9 pick a choice, and the "more choices" cue shows only
// while part of the list is scrolled out of view (pass 5, approved item 7.3a).
// Run with: node --test test/js/phone-chat-choice-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/phone-chat');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const { choiceIndexFromKey, hasHiddenChoicesBelow, MAX_QUICK_CHOICE } =
    await import(dataUrl(readFileSync(join(dir, 'phone-chat-choices.js'), 'utf8')));

test('keys 1-9 map to choices that exist', () => {
    assert.equal(MAX_QUICK_CHOICE, 9);
    assert.equal(choiceIndexFromKey('1', 3), 0);
    assert.equal(choiceIndexFromKey('3', 3), 2);
    assert.equal(choiceIndexFromKey('6', 9), 5);
    assert.equal(choiceIndexFromKey('9', 9), 8);
});

test('keys beyond the list, 0 and other keys pick nothing', () => {
    assert.equal(choiceIndexFromKey('4', 3), -1);
    assert.equal(choiceIndexFromKey('0', 9), -1);
    assert.equal(choiceIndexFromKey('a', 9), -1);
    assert.equal(choiceIndexFromKey('10', 12), -1);
    assert.equal(choiceIndexFromKey('Enter', 2), -1);
    assert.equal(choiceIndexFromKey(undefined, 2), -1);
});

test('scroll cue shows only while choices sit below the fold', () => {
    assert.equal(hasHiddenChoicesBelow({ scrollTop: 0, clientHeight: 200, scrollHeight: 400 }), true);
    assert.equal(hasHiddenChoicesBelow({ scrollTop: 200, clientHeight: 200, scrollHeight: 400 }), false);
    assert.equal(hasHiddenChoicesBelow({ scrollTop: 199, clientHeight: 200, scrollHeight: 400 }), false, '1px rounding slack');
    assert.equal(hasHiddenChoicesBelow({ scrollTop: 0, clientHeight: 180, scrollHeight: 180 }), false);
    assert.equal(hasHiddenChoicesBelow(null), false);
});

test('the minigame uses the shared key mapping, not a hard-coded 1-5 list', () => {
    const src = readFileSync(join(dir, 'phone-chat-minigame.js'), 'utf8');
    const handler = src.slice(src.indexOf('handleKeyPress(event)'), src.indexOf('async start()'));
    assert.match(handler, /choiceIndexFromKey\(event\.key, choices\.length\)/);
    assert.doesNotMatch(handler, /case '5':/);
});

// Engine regression 2026-10-16 (m05 E2, m06 R3): the phone buttons had no number
// labels, so the keys could not be found from the screen. Same "1." as person-chat.
test('phone choices carry the person-chat number labels for keys 1-9', async () => {
    const { numberedChoiceText } =
        await import(dataUrl(readFileSync(join(dir, 'phone-chat-choices.js'), 'utf8')));
    assert.equal(numberedChoiceText('Hello', 0), '1. Hello');
    assert.equal(numberedChoiceText('Bye', 8), '9. Bye');
    assert.equal(numberedChoiceText('Tenth', 9), 'Tenth');
});

// m08 R4: the cue was sticky inside the list and sat over the fourth choice.
test('the more-choices cue is a row below the list, not inside it', () => {
    const ui = readFileSync(join(dir, 'phone-chat-ui.js'), 'utf8');
    const css = readFileSync(join(here, '../../public/break_escape/css/phone-chat-minigame.css'), 'utf8');
    assert.match(ui, /<\/div>\s*<div class="choices-more-cue" id="choices-more-cue"/);
    assert.doesNotMatch(ui, /choicesContainer\.appendChild\(cue\)/);
    const rule = css.slice(css.indexOf('.choices-more-cue {'), css.indexOf('}', css.indexOf('.choices-more-cue {')));
    assert.doesNotMatch(rule, /sticky/);
});
