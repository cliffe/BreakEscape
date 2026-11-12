// Access slice 9.2 C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md section 4): replies between NPCs in the
// browser feed store (systems/social-feed.js) and the phone counts (systems/friendface-phone.js).
// postsFor leaves answers out, repliesFor orders a thread by seq, the npc_posted payload, the reply
// toast and its name fallbacks, restore with a thread, and unknown item fields.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SocialFeed } from '../../public/break_escape/js/systems/social-feed.js';
import { FriendfacePhones, PHONE_TYPE } from '../../public/break_escape/js/systems/friendface-phone.js';

const NAMES = { ivy: 'Ivy Clarke', tomasz: 'Tomasz Nowak', sam: 'Sam Third' };

function harness({ names = NAMES, profiles = {}, toasts = true, visited = true } = {}) {
    const log = [];
    const feed = new SocialFeed({
        send: () => Promise.resolve(null),
        hasFeed: () => true,
        emit: (name, data) => log.push(['emit', name, data]),
        toast: (message, title) => log.push(['toast', message, title]),
        siteVisited: () => visited,
        toastsOn: () => toasts,
        npcName: (id) => names[id] || null,
        siteName: () => 'Friendface',
        profileName: (_site, person) => profiles[person] || null
    });
    return { feed, log };
}

// An own post, a reply and an answer as /feed_post answers (the route's shape)
const own = (npc, index, seq, id) => ({ index, seq, site: 'friendface', person: npc, post: { id, text: `${id} text` }, done: false });
const reply = (npc, index, seq, id, thread, poster, named) => ({
    index, seq, site: 'friendface', person: npc, done: false,
    post: { id, text: `${id} text`, replyTo: thread },
    replyToNpc: poster, replyToPerson: poster, namedNpc: named, namedPerson: named
});

// Ivy vents (1), Tomasz replies (2), Ivy answers (3), Tomasz replies again (4)
function thread(feed) {
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    feed.apply('ivy', reply('ivy', 1, 3, 'ivy_answer', 'ivy_vent', 'ivy', 'tomasz'));
    feed.apply('tomasz', reply('tomasz', 1, 4, 'tom_again', 'ivy_vent', 'ivy', 'ivy'));
}

test('postsFor lists a reply with its marker, both of an NPC\'s replies, and leaves answers out', () => {
    const { feed } = harness();
    thread(feed);
    assert.deepEqual(feed.postsFor('friendface', 'ivy').map((p) => p.id), ['ivy_vent'], 'the answer is drawn only in its thread');
    const tom = feed.postsFor('friendface', 'tomasz');
    assert.deepEqual(tom.map((p) => p.id), ['tom_again', 'tom_re']);
    assert.ok(tom.every((p) => p.replyTo === 'ivy_vent' && p.replyToPerson === 'ivy'));
});

test('an answer is detected by replyToPerson before its thread post is in the store', () => {
    const { feed } = harness();
    feed.apply('ivy', reply('ivy', 1, 3, 'ivy_answer', 'ivy_vent', 'ivy', 'tomasz'));
    assert.deepEqual(feed.postsFor('friendface', 'ivy'), []);
    assert.deepEqual(feed.repliesFor('ivy_vent').map((r) => r.post.id), ['ivy_answer'], 'kept, drawn once the post arrives');
});

test('repliesFor orders by seq across NPCs, the answer and the second reply included', () => {
    const { feed } = harness();
    // Applied out of order: seq decides, then the poster id
    feed.apply('tomasz', reply('tomasz', 1, 4, 'tom_again', 'ivy_vent', 'ivy', 'ivy'));
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    feed.apply('ivy', reply('ivy', 1, 3, 'ivy_answer', 'ivy_vent', 'ivy', 'tomasz'));
    feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    feed.apply('sam', reply('sam', 0, 2, 'sam_re', 'ivy_vent', 'ivy', 'ivy'));
    assert.deepEqual(feed.repliesFor('ivy_vent').map((r) => r.post.id), ['sam_re', 'tom_re', 'ivy_answer', 'tom_again']);
    assert.deepEqual(feed.repliesFor('nothing'), []);
    assert.deepEqual(feed.repliesFor('__proto__'), []);
});

test('restore with a thread draws the same thread and lists, and emits nothing', () => {
    const { feed, log } = harness();
    feed.restore({
        ivy: { site: 'friendface', person: 'ivy', done: true, posts: [
            { index: 0, seq: 1, post: { id: 'ivy_vent', text: 'v' } },
            { index: 1, seq: 3, post: { id: 'ivy_answer', text: 'a', replyTo: 'ivy_vent' }, replyToNpc: 'ivy', replyToPerson: 'ivy', namedNpc: 'tomasz', namedPerson: 'tomasz' }
        ] },
        tomasz: { site: 'friendface', person: 'tomasz', posts: [
            { index: 0, seq: 2, post: { id: 'tom_re', text: 'r', replyTo: 'ivy_vent' }, replyToNpc: 'ivy', replyToPerson: 'ivy', namedNpc: 'ivy', namedPerson: 'ivy' }
        ] }
    });
    assert.deepEqual(feed.repliesFor('ivy_vent').map((r) => r.post.id), ['tom_re', 'ivy_answer']);
    assert.deepEqual(feed.postsFor('friendface', 'ivy').map((p) => p.id), ['ivy_vent']);
    assert.deepEqual(log, []);
});

test('an item with an unknown extra field is stored and drawn as without it', () => {
    const a = harness();
    a.feed.apply('ivy', { ...own('ivy', 0, 1, 'ivy_vent'), reactions: { like: 3 }, post: { id: 'ivy_vent', text: 'ivy_vent text', reactions: 'x' } });
    const b = harness();
    b.feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    assert.deepEqual(a.feed.postsFor('friendface', 'ivy'), b.feed.postsFor('friendface', 'ivy'));
    assert.deepEqual(a.feed.posts.get('ivy'), b.feed.posts.get('ivy'));
});

test('the npc_posted payload carries seq and, for a reply, the thread and the four ids', () => {
    const { feed, log } = harness();
    thread(feed);
    const emits = log.filter((e) => e[0] === 'emit');
    assert.deepEqual(emits[0][2], { npcId: 'ivy', postId: 'ivy_vent', index: 0, seq: 1, site: 'friendface', person: 'ivy' });
    assert.deepEqual(emits[1][2], { npcId: 'tomasz', postId: 'tom_re', index: 0, seq: 2, site: 'friendface', person: 'tomasz',
        replyTo: 'ivy_vent', replyToNpc: 'ivy', replyToPerson: 'ivy', namedNpc: 'ivy', namedPerson: 'ivy' });
    assert.equal(emits[1][1], 'npc_posted:tomasz');
});

test('the reply toast names the replier and the named NPC; the postToasts switch and the visit rule hold', () => {
    let h = harness();
    thread(h.feed);
    assert.deepEqual(h.log.filter((e) => e[0] === 'toast').map((e) => [e[1], e[2]]), [
        ['Ivy Clarke posted on Friendface', 'New post'],
        ['Tomasz Nowak replied to Ivy Clarke on Friendface', 'New reply'],
        ['Ivy Clarke replied to Tomasz Nowak on Friendface', 'New reply'],
        ['Tomasz Nowak replied to Ivy Clarke on Friendface', 'New reply']
    ]);
    h = harness({ toasts: false });
    thread(h.feed);
    assert.equal(h.log.filter((e) => e[0] === 'toast').length, 0);
    h = harness({ visited: false });
    thread(h.feed);
    assert.equal(h.log.filter((e) => e[0] === 'toast').length, 0);
});

test('an NPC with no client record is named by its Friendface profile name, then by its id', () => {
    let h = harness({ names: { tomasz: 'Tomasz Nowak' }, profiles: { ivy: 'Ivy Clarke (profile)' } });
    h.feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    assert.equal(h.log.find((e) => e[0] === 'toast')[1], 'Tomasz Nowak replied to Ivy Clarke (profile) on Friendface');
    h = harness({ names: {}, profiles: {} });
    h.feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    assert.equal(h.log.find((e) => e[0] === 'toast')[1], 'tomasz replied to ivy on Friendface');
});

test('a name with markup characters is a plain string in the toast', () => {
    const h = harness({ names: { tomasz: '<b>Tom</b>', ivy: 'Ivy' } });
    h.feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    assert.equal(h.log.find((e) => e[0] === 'toast')[1], '<b>Tom</b> replied to Ivy on Friendface');
});

// ── friendface-phone.js counts ────────────────────────────────────────────────

const phone = (owner) => ({ type: PHONE_TYPE, id: owner ? `${owner}_phone` : 'mine', name: 'p', ...(owner ? { phoneOf: owner } : {}) });
function phones(items) {
    return new FriendfacePhones({ items: () => items, held: () => false, play() {}, refresh() {}, setNoPhone() {} });
}

test('a reply counts on the replier\'s, the thread poster\'s and the player\'s phones, each once; an answer once', () => {
    const p = phones([phone('tomasz'), phone('ivy'), phone(null), phone('sam')]);
    const { feed } = harness();
    const seen = [];
    feed.deps.emit = (_n, data) => seen.push(data);
    thread(feed);
    for (const d of seen) p.onPosted(d);
    // ivy_vent: ivy + own; tom_re: tomasz + ivy + own; ivy_answer: ivy + own; tom_again: tomasz + ivy + own
    assert.equal(p.badgeFor(phone('ivy')), 4);
    assert.equal(p.badgeFor(phone('tomasz')), 2);
    assert.equal(p.badgeFor(phone(null)), 4);
    assert.equal(p.badgeFor(phone('sam')), 0);
});

test('two copies of one NPC\'s phone held count a post once', () => {
    const p = phones([phone('ivy'), phone('ivy')]);
    p.onPosted({ npcId: 'tomasz', postId: 'tom_re', replyTo: 'ivy_vent', replyToNpc: 'ivy' });
    assert.equal(p.badgeFor(phone('ivy')), 1);
});
