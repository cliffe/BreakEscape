// q35 (docs/achitechture/FRIENDFACE_PHONE_ITEM_PLAN.md): systems/friendface-phone.js. Unread
// counts per held phone, the blip and its bark hold, open asks the server and clears the count,
// restore never blips, and an NPC whose phone is held becomes phone-less on the client.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FriendfacePhones, openFriendfacePhone, phoneKey, startKey, PHONE_TYPE } from '../../public/break_escape/js/systems/friendface-phone.js';
import { SocialFeed } from '../../public/break_escape/js/systems/social-feed.js';

const OWN = { type: PHONE_TYPE, id: 'mine', name: 'Your phone' };
const JAKE = { type: PHONE_TYPE, id: 'jake_phone', name: "Jake's phone", phoneOf: 'jake' };

function harness(items = [], { held = false } = {}) {
    const log = [];
    const state = { held, items, timers: [] };
    const phones = new FriendfacePhones({
        items: () => state.items,
        held: () => state.held,
        play: () => log.push('play'),
        refresh: () => log.push('refresh'),
        every: (fn) => { state.timers.push(fn); return state.timers.length; },
        stop: (h) => { state.timers[h - 1] = null; },
        setNoPhone: (id) => log.push(['noPhone', id])
    });
    return { phones, log, state };
}

test('keys: an NPC phone is keyed by its owner, the player phone by @own; start keys', () => {
    assert.equal(phoneKey(JAKE), 'jake');
    assert.equal(phoneKey(OWN), '@own');
    assert.equal(startKey({ site: 'friendface', person: 'jake' }), 'friendface.jake');
    assert.equal(startKey({ site: 'friendface', person: null }), 'friendface');
    assert.equal(startKey({}), null);
});

test('no phone held: a post does nothing', () => {
    const { phones, log } = harness([]);
    assert.equal(phones.onPosted({ npcId: 'jake' }), false);
    assert.deepEqual(log, []);
});

test('the player phone counts every post; an NPC phone only its owner; one blip per post', () => {
    const { phones, log } = harness([OWN, JAKE, { type: 'notes' }]);
    phones.onPosted({ npcId: 'lena' });
    assert.equal(phones.badgeFor(OWN), 1);
    assert.equal(phones.badgeFor(JAKE), 0);
    phones.onPosted({ npcId: 'jake' });
    assert.equal(phones.badgeFor(OWN), 2);
    assert.equal(phones.badgeFor(JAKE), 1);
    assert.equal(log.filter((e) => e === 'play').length, 2);
    assert.equal(phones.badgeFor({ type: 'notes' }), 0);
});

test('only Jake\'s phone held: a post by someone else neither counts nor blips', () => {
    const { phones, log } = harness([JAKE]);
    assert.equal(phones.onPosted({ npcId: 'lena' }), false);
    assert.equal(phones.badgeFor(JAKE), 0);
    assert.deepEqual(log, []);
});

test('the bark hold: the sound waits, several posts give one sound when the hold ends; the badge counts at once', () => {
    const { phones, log, state } = harness([OWN], { held: true });
    phones.onPosted({ npcId: 'jake' });
    phones.onPosted({ npcId: 'lena' });
    assert.equal(phones.badgeFor(OWN), 2);
    assert.equal(log.filter((e) => e === 'play').length, 0);
    assert.equal(state.timers.length, 1, 'one poll, not one per post');
    assert.equal(phones.releaseHeld(), false, 'still held');
    state.held = false;
    assert.equal(phones.releaseHeld(), true);
    assert.equal(log.filter((e) => e === 'play').length, 1);
    assert.equal(state.timers[0], null, 'the poll stops');
    assert.equal(phones.releaseHeld(), false);
});

test('opening clears that phone\'s count only', () => {
    const { phones } = harness([OWN, JAKE]);
    phones.onPosted({ npcId: 'jake' });
    phones.clear(JAKE);
    assert.equal(phones.badgeFor(JAKE), 0);
    assert.equal(phones.badgeFor(OWN), 1);
});

test('syncOwners makes each held NPC phone\'s owner phone-less', () => {
    const { phones, log } = harness([OWN, JAKE]);
    phones.syncOwners();
    assert.deepEqual(log, [['noPhone', 'jake']]);
});

test('open: asks the server with the owner, restores its posts, clears, launches at the profile', async () => {
    const calls = [];
    const body = await openFriendfacePhone(JAKE, {
        request: async (npcId) => { calls.push(['request', npcId]); return { npcId, site: 'friendface', person: 'jake', feedPosts: { jake: {} } }; },
        restore: (fp) => calls.push(['restore', fp]),
        clear: (d) => calls.push(['clear', d.id]),
        launch: (p) => calls.push(['launch', p]),
        refused: (m) => calls.push(['refused', m])
    });
    assert.equal(body.site, 'friendface');
    assert.deepEqual(calls, [
        ['request', 'jake'],
        ['restore', { jake: {} }],
        ['clear', 'jake_phone'],
        ['launch', { title: "Jake's phone", siteIds: ['friendface'], start: 'friendface.jake' }]
    ]);
    calls.length = 0;
    await openFriendfacePhone(OWN, {
        request: async (npcId) => { calls.push(['request', npcId]); return { site: 'friendface', person: null, feedPosts: {} }; },
        launch: (p) => calls.push(['launch', p.start])
    });
    assert.deepEqual(calls, [['request', null], ['launch', 'friendface']]);
});

test('open refused by the server: nothing restored, nothing launched, the count stays', async () => {
    const calls = [];
    const err = Object.assign(new Error('no such phone'), { status: 403 });
    const body = await openFriendfacePhone(JAKE, {
        request: async () => { throw err; },
        restore: () => calls.push('restore'),
        clear: () => calls.push('clear'),
        launch: () => calls.push('launch'),
        refused: (m) => calls.push(['refused', m])
    });
    assert.equal(body, null);
    assert.deepEqual(calls, [['refused', 'You do not have that phone.']]);
    assert.equal(await openFriendfacePhone({ type: 'notes' }, {}), null);
});

test('with the real feed: a live post blips, a restore (reload, or an open) never does', () => {
    const { phones, log } = harness([OWN]);
    const feed = new SocialFeed({
        send: () => Promise.resolve(null),
        hasFeed: () => true,
        emit: (name, data) => { if (name.startsWith('npc_posted:')) phones.onPosted(data); },
        siteVisited: () => false
    });
    feed.restore({ jake: { site: 'friendface', person: 'jake', posts: [{ index: 0, post: { id: 'p1', text: 'one' } }], done: false } });
    assert.equal(phones.badgeFor(OWN), 0);
    assert.equal(log.filter((e) => e === 'play').length, 0);
    feed.apply('jake', { npcId: 'jake', index: 1, site: 'friendface', person: 'jake', post: { id: 'p2', text: 'two' } });
    assert.equal(phones.badgeFor(OWN), 1);
    assert.equal(log.filter((e) => e === 'play').length, 1);
    // The same post again (an open's restore of a post already listed) adds nothing
    feed.restore({ jake: { site: 'friendface', person: 'jake', posts: [{ index: 1, post: { id: 'p2', text: 'two' } }] } });
    feed.apply('jake', { npcId: 'jake', index: 1, site: 'friendface', person: 'jake', post: { id: 'p2', text: 'two' } });
    assert.equal(phones.badgeFor(OWN), 1);
});
