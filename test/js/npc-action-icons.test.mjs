// systems/npc-action-icons.js pickIcon. The wind-up tell is tested in npc-needs.test.mjs.
// Run with: bin/test-js test/js/npc-action-icons.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { pickIcon, DEFAULT_ICONS, speechCovers, NpcActionIcons } from '../../public/break_escape/js/systems/npc-action-icons.js';

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

test('access slice 9.2: blocked by tell for a judged NPC with no job, pulsing at 2; work on a visit; no bubble for held', async () => {
    const m = await import('../../public/break_escape/js/systems/npc-action-icons.js');
    const judged = { work: true, social_media: false };
    assert.equal(m.stateIconEntry({ job: null, tell: 0, judged }, {}, false), null);
    const one = m.stateIconEntry({ job: null, tell: 1, judged }, {}, false);
    assert.equal(one.key, 'blocked');
    assert.equal(one.pulse, false);
    assert.equal(m.stateIconEntry({ job: null, tell: 2, judged }, {}, false).pulse, true);
    assert.equal(m.stateIconEntry({ job: null, tell: 2, judged: { work: false } }, {}, false), null, 'not judged, not opted in');
    assert.equal(m.pickIconEntry({ kind: 'visit', phase: 'goto_target', need: null }, {}).key, 'work');
    assert.equal(m.thoughtBubble({ parked: [{ need: 'work', reason: 'held' }] }, {}, true), null);
    assert.equal(m.thoughtBubble({ parked: [{ need: 'work', reason: 'failed' }] }, {}, true).kind, 'parked');
});

test('q17: once the cause has cleared the frustration icon fades, with no pulse, and goes at tell 0', async () => {
    const m = await import('../../public/break_escape/js/systems/npc-action-icons.js');
    const judged = { work: true, social_media: false };
    const two = m.stateIconEntry({ job: null, tell: 2, judged, causeCleared: true }, {}, false);
    assert.equal(two.key, 'blocked', 'the same art');
    assert.equal(two.fading, true);
    assert.equal(two.pulse, false);
    assert.equal(two.alpha, m.FADED_ALPHA[2]);
    const one = m.stateIconEntry({ job: null, tell: 1, judged, causeCleared: true }, {}, false);
    assert.ok(one.alpha < two.alpha, 'fainter as the mood eases');
    assert.equal(m.stateIconEntry({ job: null, tell: 0, judged, causeCleared: true }, {}, false), null, 'gone once frustration settles');
    const held = m.stateIconEntry({ job: null, tell: 2, judged, causeCleared: false }, {}, false);
    assert.equal(held.fading, undefined, 'solid while the cause holds');
    assert.equal(held.pulse, true);
});

// SIMS-5 design R2 m8: three markers stacked over one head at the cooler (the chat picture, the
// speech bubble and the rest thought bubble). Any bubble showing over the NPC hides both icons.
test('m8: speechCovers: talking, a bark, or a bubble still showing; hideFor hides the icon and the thought bubble', () => {
    const bubbles = (says, shown) => ({ hasLine: id => says.includes(id), showsBubble: id => shown.includes(id) });
    assert.equal(speechCovers({ talking: { line: 'Hi' } }, null, 'rosa'), true);
    assert.equal(speechCovers({}, null, 'rosa'), false);
    assert.equal(speechCovers({}, bubbles(['rosa'], []), 'rosa'), true, 'a bark');
    assert.equal(speechCovers({}, bubbles([], ['rosa']), 'rosa'), true, 'a bubble left from the last pass');
    assert.equal(speechCovers({}, bubbles([], ['sanjay']), 'rosa'), false, 'another NPC\'s bubble');
    assert.equal(speechCovers({}, { hasLine: () => { throw new Error('x'); } }, 'rosa'), false, 'a throwing layer counts as none');
    const box = () => ({ visible: true, setVisible(v) { this.visible = v; } });
    const icons = new NpcActionIcons();
    icons.icons.set('rosa', { box: box() });
    icons.bubbles.set('rosa', { box: box() });
    icons.icons.set('sanjay', { box: box() });
    icons.hideFor('rosa');
    assert.equal(icons.icons.get('rosa').box.visible, false);
    assert.equal(icons.bubbles.get('rosa').box.visible, false);
    assert.equal(icons.icons.get('sanjay').box.visible, true, 'only the speaker');
    icons.hideFor('nobody');
});
