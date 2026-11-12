// Access slice 9.2 sub-slice C (ACCESS_MODEL_SLICE_9_2_PLAN.md 8.3): systems/social-feed.js, the
// browser half of the feed. Asking after met uses, done, the fact merged before npc_posted, the
// toast rule, restore on load, and the install's listeners against a stub window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SocialFeed, cleanPost, cleanFact, installSocialFeed, liveDeps, escapeNoteText, MAX_TRIES, MAX_WAIT_S } from '../../public/break_escape/js/systems/social-feed.js';
import { renderNoteMarkdown, noteMatches } from '../../public/break_escape/js/utils/note-markdown.js';
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

test('cleanPost keeps strings only and needs an id; cleanFact keeps the entry as authored (plain JSON data)', () => {
    assert.equal(cleanPost({ text: 'no id' }), null);
    assert.deepEqual(cleanPost({ id: 'p', text: 'ok', date: 5, note: { html: '<b>' }, extra: 'x' }), { id: 'p', text: 'ok' });
    // Review C R1 M1: provides is an array of objects; stale is a boolean; numbers stay
    const provides = [{ type: 'name', value: 'jake_biscuit', label: 'Biscuit', kind: 'pet' }, { type: 'address', rule: 'first.last', n: 2 }];
    const raw = { text: 't', label: 'Pet', provides, stale: false, n: 3, fn: () => 1, inf: Infinity };
    const clean = cleanFact(raw);
    assert.deepEqual(clean, { text: 't', label: 'Pet', provides, stale: false, n: 3 });
    assert.notEqual(clean.provides, provides, 'a copy');
    assert.equal(Object.getPrototypeOf(cleanFact(JSON.parse('{"__proto__": {"polluted": 1}, "text": "t"}'))), Object.prototype);
    assert.equal(cleanFact(['x']), null);
    // Review C R2 nit: a fact text that is not a string is refused (grantFact would hand it to addNote)
    assert.equal(cleanFact({ label: 'Pet', text: { html: '<b>x</b>' } }), null);
    assert.equal(cleanFact({ label: 'Pet', text: 5 }), null);
    assert.deepEqual(cleanFact({ label: 'Pet' }), { label: 'Pet' });
});

test('review C R1 M1: a merged feed fact with provides is read by the mail composer, the intel board and the pretext card', async () => {
    const { heldProvides, heldFactIds } = await import('../../public/break_escape/js/minigames/mail-client/mail-composer.js');
    const { buildBoardModel } = await import('../../public/break_escape/js/minigames/intel-board/board-model.js');
    const { blankSlot } = await import('../../public/break_escape/js/minigames/pretext-prep/pretext-card.js');
    const entry = { label: 'Pet', subject: 'jake', text: 'Jake Brooks has a dog called Biscuit.',
        provides: [{ type: 'name', value: 'jake_brooks', label: 'Jake Brooks' }, { type: 'pet', value: 'biscuit', about: 'jake_pet' }] };
    const { feed, facts } = harness({ answers: [answer(0, 'p1', { post: { id: 'p1', text: 'x', fact: 'jake_pet_name' }, fact: { id: 'jake_pet_name', entry } })] });
    await feed.onUse('jake');
    const globals = { se_intel_jake_pet_name: true };
    assert.deepEqual(heldProvides(heldFactIds(facts, globals), facts).map((p) => p.value), ['jake_brooks', 'biscuit']);
    // subject 'company', so only provides' name can identify Jake on the board
    const social = { intelFacts: { jake_pet_name: { ...facts.jake_pet_name, subject: 'company' } }, people: [{ id: 'jake', name: 'Jake Brooks' }], intelBoard: { people: ['jake'] } };
    const card = buildBoardModel(social, globals).targets.find((t) => t.id === 'jake');
    assert.equal(card.identified, true);
    assert.deepEqual(blankSlot('jake_pet', { knows: { jake_pet: { value: 'biscuit' } } }, facts), { type: 'pet', about: 'jake_pet' });
});

test('review C R1 server m2: a too-soon answer is asked again after retryAfter, so the use yields its post', async () => {
    const timers = [];
    const { feed, log } = harness({ answers: [{ npcId: 'jake', post: null, done: false, tooSoon: true, retryAfter: 12 }, answer(0, 'p1')] });
    feed.deps.later = (fn, ms) => timers.push([fn, ms]);
    await feed.onUse('jake');
    assert.deepEqual(timers.map((t) => t[1]), [13000]);
    assert.equal(feed.onUse('jake'), null, 'a use while the retry waits asks nothing more');
    await timers[0][0]();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
    assert.equal(log.filter((e) => e[0] === 'send').length, 2);
    assert.equal(timers.length, 1, 'a post ends the retries');
});

// Review C R2 m1, at a mission pace: urgentAt 40, restores 60, decayPerMin 2 gives a 20 min
// period and a floor of about 27 min, so a tempted use at 20 min is told retryAfter 420. The
// retry waits the whole 420 s (no 300 s cap), and the post is revealed by that use.
test('review C R2 m1: a mission-pace retryAfter of 420 s is waited in full and the post is revealed', async () => {
    const timers = [];
    const { feed, log } = harness({ answers: [{ npcId: 'jake', post: null, done: false, tooSoon: true, retryAfter: 420 }, answer(0, 'p1')] });
    feed.deps.later = (fn, ms) => timers.push([fn, ms]);
    await feed.onUse('jake');
    assert.deepEqual(timers.map((t) => t[1]), [421000], 'the retry waits past the floor');
    await timers[0][0]();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
    assert.equal(log.filter((e) => e[0] === 'send').length, 2);
});

test('review C R2 m1: a server that always says tooSoon is asked MAX_TRIES times for one use, then the use stops', async () => {
    const timers = [];
    const soon = { npcId: 'jake', post: null, done: false, tooSoon: true, retryAfter: 1 };
    const { feed, log } = harness({ answers: Array.from({ length: 10 }, () => ({ ...soon })) });
    feed.deps.later = (fn, ms) => timers.push([fn, ms]);
    await feed.onUse('jake');
    for (let i = 0; i < timers.length; i++) {
        await timers[i][0]();
        await new Promise((r) => setImmediate(r));
    }
    assert.equal(MAX_TRIES, 4);
    assert.equal(log.filter((e) => e[0] === 'send').length, MAX_TRIES);
    assert.equal(timers.length, MAX_TRIES - 1);
    assert.equal(feed.retrying.has('jake'), false, 'nothing left waiting');
    feed.onUse('jake');
    await new Promise((r) => setImmediate(r));
    assert.equal(log.filter((e) => e[0] === 'send').length, MAX_TRIES + 1, 'a later honest use asks again');
});

test('review C R1 nit and R3 nit: a network failure is asked again after 5 s, up to MAX_TRIES asks; a 403 is not', async () => {
    const timers = [];
    const { feed } = harness({ answers: [new Error('offline'), answer(0, 'p1')] });
    feed.deps.later = (fn, ms) => timers.push([fn, ms]);
    await feed.onUse('jake');
    assert.equal(timers.length, 1);
    timers[0][0]();
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(feed.revealed(), { jake: ['p1'] });
    const t3 = [];
    const down = harness({ answers: Array.from({ length: 10 }, () => new Error('offline')) });
    down.feed.deps.later = (fn, ms) => t3.push([fn, ms]);
    await down.feed.onUse('jake');
    for (let i = 0; i < t3.length; i++) {
        await t3[i][0]();
        await new Promise((r) => setImmediate(r));
    }
    assert.deepEqual(t3.map((t) => t[1]), [5000, 5000, 5000]);
    assert.equal(down.log.filter((e) => e[0] === 'send').length, MAX_TRIES);
    const t2 = [];
    const h2 = harness({ answers: [Object.assign(new Error('no'), { status: 403 })] });
    h2.feed.deps.later = (fn, ms) => t2.push(ms);
    await h2.feed.onUse('jake');
    assert.deepEqual(t2, []);
});

test('review C R3 nit: a retryAfter beyond setTimeout\'s limit waits the longest delay setTimeout keeps', async () => {
    const timers = [];
    const { feed } = harness({ answers: [{ npcId: 'jake', post: null, done: false, tooSoon: true, retryAfter: 1e12 }] });
    feed.deps.later = (fn, ms) => timers.push(ms);
    await feed.onUse('jake');
    assert.deepEqual(timers, [MAX_WAIT_S * 1000]);
    assert.ok(MAX_WAIT_S * 1000 <= 2 ** 31 - 1);
});

test('review C R3 nit: a lost answer that revealed a post is not followed by a second post for the same use', async () => {
    const timers = [];
    const soon = { npcId: 'jake', post: null, done: false, tooSoon: true, retryAfter: 600, revealed: 1 };
    const { feed, log } = harness({ answers: [new Error('connection dropped'), soon, answer(1, 'p2')] });
    feed.deps.later = (fn, ms) => timers.push([fn, ms]);
    await feed.onUse('jake');
    await timers[0][0]();
    await new Promise((r) => setImmediate(r));
    assert.equal(log.filter((e) => e[0] === 'send').length, 2);
    assert.equal(timers.length, 1, 'the too-soon answer says the lost request revealed a post: no wait for a second');
    assert.equal(feed.retrying.has('jake'), false);
    // Without a lost request the same too-soon answer is waited out (the client holds the post)
    const h = harness({ answers: [answer(0, 'p1'), { ...soon }, answer(1, 'p2')] });
    const t2 = [];
    h.feed.deps.later = (fn, ms) => t2.push(ms);
    await h.feed.onUse('jake');
    await h.feed.onUse('jake');
    assert.deepEqual(t2, [601000]);
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

test('notebook search finds an escaped feed fact by the text as written', () => {
    for (const t of HOSTILE) {
        const note = { title: 'Evidence: a colleague', text: escapeNoteText(`Lena runs. ${t}`) };
        assert.equal(noteMatches(note, t.slice(0, 12)), true, t);
    }
});
