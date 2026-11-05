// systems/npc-action-icons.js pickIcon. The wind-up tell is tested in npc-needs.test.mjs.
// Run with: bin/test-js test/js/npc-action-icons.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickIcon, DEFAULT_ICONS } from '../../public/break_escape/js/systems/npc-action-icons.js';

test('pickIcon: no job -> null; pickup job -> curiosity; object id beats satisfies beats type; fallback', () => {
    const icons = { coffee_machine: 'C', caffeine: 'K', pc: 'P' };
    assert.equal(pickIcon(null, icons, null), null);
    assert.equal(pickIcon({ kind: 'carry', itemId: 'x' }, icons, { id: 'coffee_machine' }), DEFAULT_ICONS.curiosity);
    assert.equal(pickIcon({ kind: 'need' }, icons, { id: 'coffee_machine', satisfies: 'caffeine', type: 'pc' }), 'C');
    assert.equal(pickIcon({ kind: 'need' }, icons, { id: 'other', satisfies: 'caffeine', type: 'pc' }), 'K');
    assert.equal(pickIcon({ kind: 'need' }, icons, { id: 'other', type: 'pc' }), 'P');
    assert.equal(pickIcon({ kind: 'need' }, icons, { id: 'zzz', type: 'chair' }), DEFAULT_ICONS.fallback);
    assert.equal(pickIcon({ kind: 'need' }, { fallback: 'F' }, null), 'F');
});
