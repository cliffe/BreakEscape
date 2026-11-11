// Access slice 9.2 sub-slice C (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3): systems/social-feed.js, the
// browser half of the feed. Asking after met uses, done, the fact merged before npc_posted, the
// toast rule, restore on load, and the install's listeners against a stub window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SocialFeed, cleanPost, cleanFact, installSocialFeed, liveDeps, escapeNoteText } from '../../public/break_escape/js/systems/social-feed.js';
import { renderNoteMarkdown } from '../../public/break_escape/js/utils/note-markdown.js';
import { displayDashes } from '../../public/break_escape/js/utils/display-dashes.js';

const FACT = { id: 'jake_pet_name', entry: { label: 'Pet', subject: 'jake', text: 'Jake Brooks has a dog called Biscuit.' } };
// What the feed stores for FACT: the entry and its notebook text (no escapable characters in it)
const STORED = { ...FACT.entry, noteText: FACT.entry.text };
const answer = (index, id, extra = {}) => ({ npcId: 'jake', index, site: 'friendface', person: 'jake', done: false, post: { id, text: `post ${id}` }, fact: null, ...extra });

function harness({ answers = [], visited = true, toasts = true, hasFeed = true } = {}) {
    const log = [];
    const facts = {};
    const queue = [...answers];
    const feed = new SocialFeed({
        send: (npcId) => { log.push(['send', npcId]); const a = queue.shift(); return a instanceof Error ? Promise.reject(a) : Promise.resolve(a); },
        hasFeed: () => hasFeed,
        mergeFact: (id, entry) => { facts[id] = entry; log.push(['fact', id]); },
        emit: (name, data) => log.push(['emit', name, data, { ...facts }]),
        toast: (message, title) => log.push(['toast', message, title]),
        siteVisited: () => visited,
        toastsOn: () => toasts,
        npcName: () => 'Jake Brooks',
        siteName: () => 'Friendface'
    });
    return { feed, log, facts };
}

test('a met use asks once; a second use while the first is in flight does not ask again', async () => {
    const { feed, log } = harness({ answers: [answer(0, 'p1')] });
    const p = feed.onUse('jake');
    assert.equal(feed.onUse('jake'), null);
    await p;
    assert.deepEqual(log.filter((e) => e[0] === 'send'), [['send', 'jake']]);
    assert.equal(feed.requests, 1);
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
});

test('nothing is asked after done, nor for an NPC with no feed', async () => {
    const { feed, log } = harness({ answers: [answer(0, 'p1', { done: true })] });
    await feed.onUse('jake');
    assert.equal(feed.onUse('jake'), null);
    assert.equal(log.filter((e) => e[0] === 'send').length, 1);
    const none = harness({ hasFeed: false });
    assert.equal(none.feed.onUse('jake'), null);
    assert.equal(none.log.length, 0);
});

test('a too-soon answer adds nothing and the next use asks again', async () => {
    const { feed, log } = harness({ answers: [{ npcId: 'jake', post: null, done: false, tooSoon: true }, answer(0, 'p1')] });
    await feed.onUse('jake');
    assert.deepEqual(feed.revealed(), {});
    await feed.onUse('jake');
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
    assert.equal(log.filter((e) => e[0] === 'send').length, 2);
});

test('a refused or failed request lists nothing and does not stop later asks', async () => {
    const err = Object.assign(new Error('forbidden'), { status: 403 });
    const { feed } = harness({ answers: [err, answer(0, 'p1')] });
    await feed.onUse('jake');
    await feed.onUse('jake');
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
});

test('the fact entry is in intelFacts before npc_posted fires', async () => {
    const { feed, log } = harness({ answers: [answer(0, 'p1', { post: { id: 'p1', text: 'Biscuit!', fact: FACT.id }, fact: FACT })] });
    await feed.onUse('jake');
    const emit = log.find((e) => e[0] === 'emit');
    assert.equal(emit[1], 'npc_posted:jake');
    assert.deepEqual(emit[2], { npcId: 'jake', postId: 'p1', index: 0, site: 'friendface', person: 'jake' });
    assert.deepEqual(emit[3][FACT.id], STORED, 'merged before the event');
    assert.ok(log.findIndex((e) => e[0] === 'fact') < log.findIndex((e) => e[0] === 'emit'));
});

test('a fact entry is merged only for the fact its own post names', () => {
    const { feed, facts } = harness();
    feed.apply('jake', answer(0, 'p1', { post: { id: 'p1', text: 'x', fact: 'other' }, fact: FACT }));
    assert.deepEqual(facts, {});
});

test('the toast only for a site already visited, and not with postToasts false', () => {
    const seen = harness();
    seen.feed.apply('jake', answer(0, 'p1'));
    assert.deepEqual(seen.log.filter((e) => e[0] === 'toast'), [['toast', 'Jake Brooks posted on Friendface', 'New post']]);
    const unseen = harness({ visited: false });
    unseen.feed.apply('jake', answer(0, 'p1'));
    assert.equal(unseen.log.filter((e) => e[0] === 'toast').length, 0);
    const off = harness({ toasts: false });
    off.feed.apply('jake', answer(0, 'p1'));
    assert.equal(off.log.filter((e) => e[0] === 'toast').length, 0);
});

test('restore on load: every revealed post and its fact, no event, no toast; done kept', () => {
    const { feed, log, facts } = harness();
    feed.restore({ jake: { site: 'friendface', person: 'jake', done: true, posts: [
        { index: 1, post: { id: 'p2', text: 'two' }, fact: null },
        { index: 0, post: { id: 'p1', text: 'one', fact: FACT.id }, fact: FACT }
    ] } });
    assert.deepEqual(feed.revealed(), { jake: ['p1', 'p2'] });
    assert.deepEqual(feed.postsFor('friendface', 'jake').map((p) => p.id), ['p2', 'p1'], 'newest first');
    assert.deepEqual(facts[FACT.id], STORED);
    assert.equal(log.filter((e) => e[0] === 'emit' || e[0] === 'toast').length, 0);
    assert.equal(feed.onUse('jake'), null, 'done');
    feed.restore({ jake: { site: 'friendface', person: 'jake', posts: [{ index: 0, post: { id: 'p1', text: 'one' } }] } });
    assert.deepEqual(feed.revealed(), { jake: ['p1', 'p2'] }, 'a repeat restore adds nothing');
});

test('cleanPost and cleanFact keep strings only; a post with no id is dropped', () => {
    assert.equal(cleanPost({ text: 'no id' }), null);
    assert.deepEqual(cleanPost({ id: 'p', text: 'ok', date: 5, note: { html: '<b>' }, extra: 'x' }), { id: 'p', text: 'ok' });
    assert.deepEqual(cleanFact({ text: 't', provides: ['a', 'b'], bad: { x: 1 }, n: 3 }), { text: 't', provides: ['a', 'b'] });
    assert.equal(cleanFact(['x']), null);
});

test('installSocialFeed: listens on npc_used (met social_media only) and npc_used_phone; toast is plain text', async () => {
    const handlers = new Map();
    const sent = [];
    const alerts = [];
    globalThis.window = {
        gameScenario: { social: { osint: { sites: [{ id: 'friendface', name: '<b>Friendface</b>' }] } } },
        gameState: { globalVariables: { se_osint_state: { visited: ['friendface'] } } },
        npcManager: { getNPC: (id) => ({ id, hasFeed: id === 'jake', displayName: 'Jake <i>B</i>' }) },
        eventDispatcher: {
            on(name, cb) { handlers.set(name, cb); },
            emit() {}
        },
        gameAlert: (...args) => alerts.push(args)
    };
    const api = { feedPost: (id) => { sent.push(id); return Promise.resolve(answer(0, `p${sent.length}`, { post: { id: `p${sent.length}`, text: 't' } })); } };
    try {
        const feed = installSocialFeed(api, { jake: { site: 'friendface', person: 'jake', posts: [{ index: 0, post: { id: 'p0', text: 'old' } }] } });
        assert.equal(window.socialFeed, feed);
        assert.deepEqual(feed.revealed(), { jake: ['p0'] }, 'restored at install');
        handlers.get('npc_used:*')({ npcId: 'jake', need: 'work', met: true });
        handlers.get('npc_used:*')({ npcId: 'jake', need: 'social_media' });            // a judged use with no met
        handlers.get('npc_used:*')({ npcId: 'lena', need: 'social_media', met: true });   // no feed
        assert.deepEqual(sent, []);
        await handlers.get('npc_used:*')({ npcId: 'jake', need: 'social_media', met: true });
        await new Promise((r) => setTimeout(r, 0));
        handlers.get('npc_used_phone:*')({ npcId: 'jake', need: 'social_media' });
        await new Promise((r) => setTimeout(r, 0));
        assert.deepEqual(sent, ['jake', 'jake']);
        assert.equal(alerts.length >= 1, true);
        assert.deepEqual(alerts[0][4], { plainText: true, verbatim: true });
        assert.equal(alerts[0][0], 'Jake <i>B</i> posted on <b>Friendface</b>', 'the raw names, drawn as text by plainText');
        assert.equal(installSocialFeed(api, null), feed, 'installed once');
    } finally { delete globalThis.window; }
});

test('liveDeps.mergeFact creates intelFacts as an object when absent and never replaces the block', () => {
    const w = { gameScenario: { social: { intelFacts: { a: { text: 'A' } } } } };
    const d = liveDeps({}, w);
    d.mergeFact('b', { text: 'B' });
    assert.deepEqual(Object.keys(w.gameScenario.social.intelFacts), ['a', 'b']);
    const bare = { gameScenario: {} };
    liveDeps({}, bare).mergeFact('b', { text: 'B' });
    assert.deepEqual(bare.gameScenario.social.intelFacts, { b: { text: 'B' } });
});

test('core/game.js installs the feed statically, right after the scenario is loaded (before any minigame)', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../../public/break_escape/js/core/game.js', import.meta.url), 'utf8');
    assert.match(src, /^import \{ installSocialFeed \} from '\.\.\/systems\/social-feed\.js';/m);
    const at = src.indexOf('gameScenario = window.gameScenario;');
    const install = src.indexOf('installSocialFeed(ApiClient, gameScenario?.feedPosts');
    assert.ok(at > 0 && install > at && install - at < 400, 'installed in the same block as the scenario load');
    assert.doesNotMatch(src.slice(at, install), /await|\.then\(|setTimeout/);
});

// ── Hostile text in the notebook (the 9.2 C live proof; H's R1 M1 approach) ──

// What the notes page shows for a note's text: its renderer, then the HTML read back as text
function shownNote(text) {
    const html = renderNoteMarkdown(displayDashes(text));
    return html.replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}
const HOSTILE = ['<b>Biscuit</b> & <img src=x onerror=alert(1)>', '**Biscuit** _1998_ `x`', '# Heading | a | b',
    'Spring--24 -- x', 'a\\-b\\*c', '- list item', 'tab\there\u0007bell'];

test('escapeNoteText: the notes page shows each hostile text exactly, with no markup of its own', () => {
    for (const t of HOSTILE) {
        assert.equal(shownNote(escapeNoteText(t)), t, t);
        assert.ok(!/<(b|strong|em|code|h\d|li|img)\b/.test(renderNoteMarkdown(displayDashes(escapeNoteText(t)))), `no element for ${t}`);
    }
});

test('a feed fact is stored with its text unchanged and its notebook text escaped', () => {
    const { feed, facts } = harness();
    const text = '**Biscuit** <i>1998</i> -- yes';
    feed.apply('jake', answer(0, 'p1', { post: { id: 'p1', text: 'x', fact: FACT.id }, fact: { id: FACT.id, entry: { ...FACT.entry, text, noteText: 'forged' } } }));
    assert.equal(facts[FACT.id].text, text, 'the text the browser and board show is unchanged');
    assert.equal(facts[FACT.id].noteText, escapeNoteText(text), 'noteText is always the feed\'s own, never the answer\'s');
    assert.equal(shownNote(facts[FACT.id].noteText), text);
});

test('grantFact writes a feed fact\'s noteText to the notebook, and an ordinary fact\'s text as before', async () => {
    const notes = [];
    globalThis.window = {
        gameState: { globalVariables: {} },
        gameScenario: { social: { intelFacts: { plain: { subject: 'company', text: 'Plain *fact*.' } } } },
        addNote: (title, text) => notes.push([title, text])
    };
    try {
        const { grantFact } = await import('../../public/break_escape/js/systems/social-intel.js');
        const deps = liveDeps({}, window);
        const text = '**Biscuit** <b>1998</b>';
        const feed = new SocialFeed({ ...deps, hasFeed: () => true, toast: () => {}, siteVisited: () => false });
        feed.apply('jake', answer(0, 'p1', { post: { id: 'p1', text: 'x', fact: FACT.id }, fact: { id: FACT.id, entry: { ...FACT.entry, text } } }));
        assert.equal(grantFact(FACT.id).granted, true);
        assert.equal(grantFact('plain').granted, true);
        assert.equal(notes[0][1], escapeNoteText(text));
        assert.equal(shownNote(notes[0][1]), text);
        assert.equal(notes[1][1], 'Plain *fact*.', 'an ordinary fact keeps its authored text');
    } finally { delete globalThis.window; }
});
