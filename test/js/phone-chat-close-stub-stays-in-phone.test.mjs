// A cosmetic "(Close.)" home stub (tagged #exit_conversation) closes the thread card and returns
// to the phone's contact list, instead of closing the whole phone (m05 Patricia after a missed ring).
// A ringer call and a forced call keep their own close paths.
// Run with: node --test test/js/phone-chat-close-stub-stays-in-phone.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
const m = src.match(/\n    _stubExitStaysInPhone\(([^)]*)\) \{\n([\s\S]*?)\n    \}\n/);
assert.ok(m, '_stubExitStaysInPhone found');
const stays = new Function(`return function (${m[1]}) {\n${m[2]}\n};`)();

test('a silent stub on a plain thread stays in the phone', () => {
    assert.equal(stays.call({ params: {} }, true), true);
});
test('a spoken choice, a ringer call and a forced call do not', () => {
    assert.equal(stays.call({ params: {} }, false), false);
    assert.equal(stays.call({ params: { ringerCall: { direction: 'incoming' } } }, true), false);
    assert.equal(stays.call({ params: { disableClose: true } }, true), false);
});
test('the exit branch returns to the contact list for a silent stub, before complete(true)', () => {
    const i = src.indexOf('this._stubExitStaysInPhone(silentChoice)');
    const j = src.indexOf('this.complete(true);', i);
    assert.ok(i > 0 && j > i);
    assert.match(src.slice(i, j), /this\.closeConversation\(\);\s*return;/);
});
