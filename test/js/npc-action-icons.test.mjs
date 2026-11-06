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

test('targetInfo: cached by id after one room scan; dropped when the sprite is destroyed; misses not cached', async () => {
    const { targetInfo } = await import('../../public/break_escape/js/systems/npc-action-icons.js');
    const sp = { scene: {}, scenarioData: { id: 'coffee', type: 'coffee_station1', affordance: { satisfies: ['caffeine', 'x'] } } };
    let scans = 0;
    const objects = { coffee: sp };
    globalThis.window = { rooms: { get office() { scans++; return { objects }; } } };
    try {
        const cache = new Map();
        assert.deepEqual(targetInfo('coffee', cache), { id: 'coffee', type: 'coffee_station1', satisfies: 'caffeine', print: false });
        assert.equal(targetInfo('coffee', cache).satisfies, 'caffeine');
        assert.equal(scans, 1, 'second lookup came from the cache');
        assert.equal(targetInfo('kettle', cache), null);
        assert.equal(cache.has('kettle'), false);
        sp.scene = undefined;                 // Phaser clears scene on destroy
        delete objects.coffee;
        assert.equal(targetInfo('coffee', cache), null);
        assert.equal(cache.has('coffee'), false);
    } finally {
        delete globalThis.window;
    }
});
