// Friendface reactions in the browser feed store (systems/social-feed.js,
// docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md section 6): reactions stored before the post, the
// npc_reacted events and their payload, restore with no event, junk dropped, reactionsFor order,
// no toast, no phone count, and the key set matching AccessWork::REACTION_KEYS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SocialFeed, REACTION_KEYS, REACTION_LABELS } from '../../public/break_escape/js/systems/social-feed.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function harness() {
    const log = [];
    const feed = new SocialFeed({
        send: () => Promise.resolve(null), hasFeed: () => true,
        emit: (name, data) => log.push(['emit', name, data, feed.reactionsFor(data.postId)]),
        toast: (message, title) => log.push(['toast', message, title]),
        siteVisited: () => true, toastsOn: () => true, npcName: () => null, siteName: () => 'Friendface', profileName: () => null
    });
    return { feed, log };
}
const own = (npc, index, seq, id, extra = {}) => ({ index, seq, site: 'friendface', person: npc, post: { id, text: `${id} text` }, done: false, ...extra });
const reply = (npc, index, seq, id, thread, poster, named, extra = {}) => ({
    index, seq, site: 'friendface', person: npc, done: false, post: { id, text: `${id} text`, replyTo: thread },
    replyToNpc: poster, replyToPerson: poster, namedNpc: named, namedPerson: named, ...extra
});
const rx = (postId, npc, key, person = npc) => ({ postId, npc, person, key });

test('the key set matches AccessWork::REACTION_KEYS in lib/break_escape/access_work.rb', () => {
    const src = readFileSync(join(root, 'lib/break_escape/access_work.rb'), 'utf8');
    const m = src.match(/REACTION_KEYS = %w\[([^\]]*)\]/);
    assert.ok(m, 'Ruby constant found');
    assert.deepEqual(REACTION_KEYS, m[1].trim().split(/\s+/));
    assert.deepEqual(Object.keys(REACTION_LABELS), REACTION_KEYS);
});

test('live apply stores reactions before _add, then emits npc_reacted once per new one after npc_posted', () => {
    const { feed, log } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    log.length = 0;
    // Ivy's answer comes with her like on Tomasz's reply and Tomasz's own like on it (same answer)
    feed.apply('ivy', reply('ivy', 1, 3, 'ivy_answer', 'ivy_vent', 'ivy', 'tomasz',
        { reactions: [rx('tom_re', 'ivy', 'like'), rx('ivy_answer', 'sam', 'sad')] }));
    const emits = log.filter((l) => l[0] === 'emit');
    assert.deepEqual(emits.map((l) => l[1]), ['npc_posted:ivy', 'npc_reacted:ivy', 'npc_reacted:sam']);
    // The npc_posted re-render already sees the reaction on the post it carries
    assert.deepEqual(emits[0][3], [{ key: 'sad', label: 'Sad', people: [{ npcId: 'sam', person: 'sam' }] }]);
    assert.deepEqual(emits[1][2], { npcId: 'ivy', postId: 'tom_re', key: 'like', site: 'friendface', targetNpc: 'tomasz',
        targetPerson: 'tomasz', targetReplyToPerson: 'ivy' });
    assert.deepEqual(emits[2][2], { npcId: 'sam', postId: 'ivy_answer', key: 'sad', site: 'friendface', targetNpc: 'ivy',
        targetPerson: 'ivy', targetReplyToPerson: 'ivy' });
    assert.ok(!log.some((l) => l[0] === 'toast' && /react/i.test(l[1])), 'no toast for a reaction');
    assert.equal(log.filter((l) => l[0] === 'toast').length, 1, 'only the post\'s own toast');
});

test('the npc_posted listener sees reactions on the post just served', () => {
    const { feed } = harness();
    let seen = null;
    feed.deps.emit = (name, data) => { if (name === 'npc_posted:tomasz') seen = feed.reactionsFor(data.postId); };
    feed.apply('tomasz', own('tomasz', 0, 2, 'tom_post', { reactions: [rx('tom_post', 'ivy', 'like')] }));
    assert.deepEqual(seen, [{ key: 'like', label: 'Like', people: [{ npcId: 'ivy', person: 'ivy' }] }]);
});

test('reactions are kept when _add returns false; a body with no post ignores them', () => {
    const { feed } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    assert.equal(feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent', { reactions: [rx('ivy_vent', 'kofi', 'sad')] })), false);
    assert.equal(feed.reactionsFor('ivy_vent').length, 1);
    feed.apply('ivy', { post: null, done: true, reactions: [rx('ivy_vent', 'mei', 'sad')] });
    assert.deepEqual(feed.reactionsFor('ivy_vent')[0].people.map((p) => p.npcId), ['kofi']);
});

test('restore stores reactions and emits nothing; live then restored gives the same list', () => {
    const { feed, log } = harness();
    feed.restore({
        ivy: { site: 'friendface', person: 'ivy', done: true, posts: [
            { index: 0, seq: 1, post: { id: 'ivy_vent', text: 't' }, reactions: [{ npc: 'mei', person: 'mei', key: 'sad' }, { npc: 'kofi', person: 'kofi', key: 'sad' }] }
        ] }
    });
    assert.deepEqual(log, []);
    const restored = feed.reactionsFor('ivy_vent');
    const { feed: live } = harness();
    live.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    live.apply('mei', own('mei', 0, 3, 'mei_x', { reactions: [rx('ivy_vent', 'mei', 'sad')] }));
    live.apply('kofi', own('kofi', 0, 2, 'kofi_x', { reactions: [rx('ivy_vent', 'kofi', 'sad')] }));
    assert.deepEqual(live.reactionsFor('ivy_vent'), restored);
    assert.deepEqual(restored, [{ key: 'sad', label: 'Sad', people: [{ npcId: 'kofi', person: 'kofi' }, { npcId: 'mei', person: 'mei' }] }]);
});

test('junk is dropped: unknown key, non-string ids, a second reaction by one NPC on one post', () => {
    const { feed, log } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent', { reactions: [
        rx('ivy_vent', 'kofi', 'love'), rx(7, 'kofi', 'like'), rx('ivy_vent', null, 'like'), 'nope', null,
        rx('ivy_vent', 'kofi', 'laugh'), rx('ivy_vent', 'kofi', 'angry'), rx('__proto__', 'x', 'like')
    ] }));
    assert.deepEqual(feed.reactionsFor('ivy_vent'), [{ key: 'laugh', label: 'Laugh', people: [{ npcId: 'kofi', person: 'kofi' }] }]);
    assert.equal(log.filter((l) => l[1].startsWith('npc_reacted')).length, 2, 'kofi laugh and the __proto__ one');
    assert.deepEqual(feed.reactionsFor('__proto__')[0].people[0].npcId, 'x');
    assert.equal({}.like, undefined);
});

test('a reaction before its post is kept and drawn once the post arrives; reactionsFor groups in key order', () => {
    const { feed } = harness();
    feed.apply('kofi', own('kofi', 0, 2, 'kofi_x', { reactions: [rx('ivy_vent', 'kofi', 'angry')] }));
    feed.apply('mei', own('mei', 0, 3, 'mei_x', { reactions: [rx('ivy_vent', 'mei', 'like')] }));
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    assert.deepEqual(feed.reactionsFor('ivy_vent').map((g) => g.key), ['like', 'angry']);
});

test('the Friendface phone listens to npc_posted only: no listener matches npc_reacted', () => {
    const src = readFileSync(join(root, 'public/break_escape/js/systems/friendface-phone.js'), 'utf8');
    assert.ok(!src.includes('npc_reacted'));
    const names = [...src.matchAll(/['"`](npc_[a-z_]*)[:*'"`]/g)].map((m) => m[1]);
    assert.ok(names.every((n) => !'npc_reacted'.startsWith(n) || n === ''), names.join(','));
});
