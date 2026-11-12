// scripts/validate_access_work.rb, Friendface reactions (docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md
// section 8): one fixture per reaction error and warning, the report line forms and endings, and
// post_dead_reasons, checked both ways against C3's check_reply warnings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function rb(scenario, body) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      ${body}`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const run = (s, fn) => rb(s, `puts JSON.generate(ValidateAccessWork.${fn}(data))`);
const issues = s => run(s, 'check').filter(l => !l.includes('Friendface phone'));
const rxIssues = s => issues(s).filter(l => l.includes('.feed.reacts') || l.includes('reactions never come out'));
const report = s => run(s, 'report_lines').filter(l => l.startsWith('ℹ️ Reaction'));
const npcFind = 'npc = ValidateAccessWork.room_npcs(data).map { |e| e[:npc] }.find { |n| n["id"] == ARGV_NPC }';
function deadReasons(s, npcId, postId) {
    return rb(s, `ARGV_NPC = ${JSON.stringify(npcId)}
      ${npcFind}
      post = BreakEscape::AccessWork.feed_posts(npc).find { |p| p["id"] == ${JSON.stringify(postId)} }
      puts JSON.generate(ValidateAccessWork.post_dead_reasons(data, npc, post))`);
}
function feeds(s, npcId) {
    return rb(s, `ARGV_NPC = ${JSON.stringify(npcId)}
      ${npcFind}
      puts JSON.generate([BreakEscape::AccessWork.feeds?(npc)])`)[0];
}
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

// ── Copied from test/js/validator-access-reply.test.mjs on merged main at 33c003230 (C3 merged),
// so C3's test file stays unchanged. Re-check these if the tripwire below fails.
const C3_COMMIT = '33c003230';
const DOWN = { global: 'drive_down' };
const own = (id, text, extra = {}) => ({ id, text, when: DOWN, ...extra });
const reTo = (id, text, replyTo, insteadOf, extra = {}) => ({ id, text, replyTo, insteadOf, when: DOWN, ...extra });
const reC = (id, text, replyToComplaint, insteadOf) => ({ id, text, replyToComplaint, insteadOf, when: DOWN });

function npc(id, posts, extra = {}) {
    return {
        id, displayName: `${id[0].toUpperCase()}${id.slice(1)} Fullname`, npcType: 'person',
        needs: { social_media: { decayPerMin: 60, urgentAt: 40, initial: 60 } },
        feed: { site: 'friendface', person: id, order: 'reactive_first', posts }, ...extra
    };
}

function pair(ivyExtra = [], tomExtra = []) {
    const ivy = npc('ivy', [
        own('ivy_vent', 'Shared drive down again, nothing will save.'),
        reTo('ivy_re_tom', 'Not just you {name}, mine has gone as well.', 'tom_vent', 'ivy_vent'),
        own('ivy_still', 'Two hours on and the shared drive is still down.'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still'),
        ...ivyExtra
    ]);
    const tom = npc('tomasz', [
        own('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
        reTo('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', 'ivy_vent', 'tom_vent'),
        own('tom_still', 'Still no shared drive. I have given up for today.'),
        reTo('tom_again', '{name}, they told me tomorrow at the earliest.', 'ivy_vent', 'tom_still'),
        ...tomExtra
    ]);
    return scenario([tom, ivy]);
}

function scenario(npcs, extra = {}) {
    return {
        startRoom: 'office',
        globalVariables: { drive_down: true },
        social: {
            intelFacts: { f1: { label: 'F', subject: 'ivy', text: 'Ivy has a fact somewhere.' } },
            people: [{ id: 'ivy', forms: { first: 'Ivy' } }, { id: 'tomasz', forms: { first: 'Tomasz' } }],
            osint: {
                sites: [{
                    id: 'friendface', type: 'social', name: 'Friendface',
                    profiles: npcs.map(n => ({ person: n.id, name: n.displayName, posts: [] }))
                }, { id: 'otherface', type: 'social', name: 'Otherface', profiles: [{ person: 'olga', name: 'Olga', posts: [] }] }]
            }
        },
        rooms: { office: { type: 'room_office', connections: {}, objects: [], npcs } },
        ...extra
    };
}

function warningsFixture() {
    const ivy = npc('ivy', [own('ivy_vent', 'Shared drive down again, nothing will save.'),
        own('ivy_still', 'Two hours on and the shared drive is still down.'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still')]);
    const tom = npc('tomasz', [own('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
        reTo('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', 'ivy_vent', 'tom_vent', { when: { global: 'undeclared' } }),
        own('tom_dead', 'A vent that can never fire at all.', { when: { global: 'undeclared' } }),
        reTo('tom_re_dead', 'Same here {name}, a reply for a dead post.', 'ivy_vent', 'tom_dead')]);
    const kim = npc('kim', [own('kim_vent', 'Kim vents into a complaint here.', { complaint: 'c1' })]);
    return scenario([tom, ivy, kim]);
}
function noAnswerFixture() {
    const s = pair();
    s.rooms.office.npcs[1].feed.posts.pop();
    return s;
}
function loneFixture() {
    return scenario([npc('ivy', [own('ivy_vent', 'Shared drive down again, nothing will save.'),
        own('ivy_still', 'Two hours on and the shared drive is still down.'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still')])]);
}
function threadNeverOpensFixture() {
    const s = pair();
    s.rooms.office.npcs[1].feed.posts[0].when = { global: 'undeclared' };
    return s;
}
function errorsFixture() {
    return pair([], [
        { id: 'no_when', text: 'Reply with no when long enough.', replyTo: 'ivy_vent', insteadOf: 'tom_vent' },
        reTo('both', 'Reply naming both threads here.', 'ivy_vent', 'tom_vent', { replyToComplaint: 'x' }),
        { id: 'stray', text: 'Reply with only insteadOf set.', insteadOf: 'tom_vent', when: DOWN },
        reTo('nowhere', 'Reply to a post that is not there.', 'missing_post', 'tom_vent'),
        reTo('to_reply', 'Reply to a reply, never allowed.', 'ivy_re_tom', 'tom_vent'),
        reC('bad_c', 'Reply to a complaint nobody has.', 'no_such', 'tom_vent'),
        reTo('tagged', 'Reply that is tagged as a vent.', 'ivy_vent', 'tom_vent', { complaint: 'c1' }),
        reTo('inst_none', 'Reply standing in for nothing here.', 'ivy_vent', 'ghost'),
        reTo('inst_reply', 'Reply standing in for a reply.', 'ivy_vent', 'tom_re_ivy'),
        { id: 'ordered1', text: 'An ordered post of Tomasz here.' },
        reTo('inst_ordered', 'Reply standing in for an ordered post.', 'ivy_vent', 'ordered1'),
        reTo('inst_self', 'Reply standing in for its own target.', 'tom_vent', 'tom_vent'),
        reTo('with_fact', 'Reply wrongly carrying a fact.', 'ivy_vent', 'tom_vent', { fact: 'f1' }),
        own('fact_post', 'A vent of Tomasz carrying a fact.', { fact: 'f1' }),
        reTo('inst_fact', 'Reply in place of a fact post.', 'ivy_vent', 'fact_post')
    ]);
}
// ── end of the copies ──

const NEVER = { global: 'undeclared' };
// This file's own: one reply with all three never-fires reasons
function threeReasonFixture() {
    const ivy = npc('ivy', [own('ivy_vent', 'Ivy vents about a drive that never fails.', { when: NEVER })]);
    const tom = npc('tomasz', [own('tom_dead', 'A vent of Tomasz that can never fire.', { when: NEVER }),
        reTo('tom_re', 'Same here {name}, a reply that never fires.', 'ivy_vent', 'tom_dead', { when: NEVER }),
        own('tom_ok', 'Tomasz posts an ordinary vent about the drive.')]);
    return scenario([tom, ivy]);
}
function nonFeedingFixture() {
    const s = pair();
    delete s.rooms.office.npcs[0].needs;
    return s;
}
function otherInsteadOfFixture() {
    const s = pair();
    s.rooms.office.npcs[1].feed.posts.push(own('ivy_dead', 'Ivy has a vent that never fires.', { when: NEVER }));
    s.rooms.office.npcs[0].feed.posts.push(reTo('tom_x', 'Hello {name}, a reply in place of another NPC post.', 'ivy_vent', 'ivy_dead'));
    return s;
}

const FRAG = {
    when_unreachable: ': the reply never fires, and its insteadOf post always comes out instead',
    instead_of_dead: 'can never fire: the reply cannot fire either',
    answer_unopenable: 'that no reply can open: no other NPC replies to it',
    thread_never_opens: "'s thread can never open"
};
const KNOWN = ['has no reply to', 'whose insteadOf comes before its thread post', 'is a second reply that no answer can open'];
const PREFIX = '⚠️ WARNING: work: ';

function belongs(w, tag) {
    if (!w.startsWith(PREFIX + tag)) return false;
    const next = w[PREFIX.length + tag.length];
    return ['.', "'", ':', ' '].includes(next);
}
function knownOther(w, tag) {
    const rest = w.slice(PREFIX.length + tag.length);
    if (KNOWN.some(k => w.includes(k))) return true;
    if (rest.startsWith('.text')) return true;
    if (rest.startsWith('.when.cause') || rest.startsWith('.when is only frustrationBelow')) return true;
    return rest.startsWith('.when can never hold') && !w.includes(FRAG.when_unreachable);
}

const AGREEMENT = {
    pair: pair(), warnings: warningsFixture(), lone: loneFixture(), noAnswer: noAnswerFixture(),
    threadNeverOpens: threadNeverOpensFixture(), errors: errorsFixture(), threeReason: threeReasonFixture(),
    nonFeeding: nonFeedingFixture(), otherInsteadOf: otherInsteadOfFixture()
};

test('post_dead_reasons agrees with check_reply both ways, per reply, over every fixture', { skip }, () => {
    for (const [fname, s] of Object.entries(AGREEMENT)) {
        const warns = issues(s).filter(l => l.startsWith(PREFIX));
        for (const n of s.rooms.office.npcs) {
            const isFeed = feeds(s, n.id);
            n.feed.posts.forEach((p, i) => {
                if (!(p.replyTo != null || p.replyToComplaint != null || p.insteadOf != null)) return;
                const tag = `${n.id}.feed.posts[${i}]`;
                const mine = warns.filter(w => belongs(w, tag));
                const codes = deadReasons(s, n.id, p.id);
                assert.equal(codes.includes('never_posts'), !isFeed, `${fname} ${tag}: never_posts vs feeds?`);
                const want = Object.keys(FRAG).filter(c => mine.some(w => w.includes(FRAG[c]))).sort();
                assert.deepEqual(codes.filter(c => c !== 'never_posts').sort(), want, `${fname} ${tag}`);
                for (const w of mine) {
                    const mapped = Object.values(FRAG).some(f => w.includes(f)) || knownOther(w, tag);
                    assert.ok(mapped, `unmapped check_reply warning: add a reason code or list it (${fname}): ${w}`);
                }
            });
        }
    }
});

test('post_dead_reasons: three reasons, answer codes, second reply, own post, non-feeding NPC', { skip }, () => {
    const three = threeReasonFixture();
    assert.deepEqual(deadReasons(three, 'tomasz', 'tom_re').sort(), ['instead_of_dead', 'thread_never_opens', 'when_unreachable']);
    const list = issues(three);
    for (const f of Object.values(FRAG).filter(f => f !== FRAG.answer_unopenable)) assertHas(list, f);
    assert.deepEqual(deadReasons(loneFixture(), 'ivy', 'ivy_answer'), ['answer_unopenable']);
    assert.deepEqual(deadReasons(noAnswerFixture(), 'tomasz', 'tom_again'), []);
    assert.deepEqual(deadReasons(three, 'ivy', 'ivy_vent'), ['when_unreachable']);
    assert.deepEqual(deadReasons(nonFeedingFixture(), 'tomasz', 'tom_vent'), ['never_posts']);
    const other = otherInsteadOfFixture();
    assert.deepEqual(deadReasons(other, 'tomasz', 'tom_x'), []);
    assertHas(issues(other), "insteadOf 'ivy_dead' names no post of tomasz");
});

test("C3's reply tests are the ones the fixtures were copied from", { skip }, () => {
    const recorded = [
    "a clean mutual pair raises no reply issue",
    "errors: missing fields, bad thread, bad insteadOf, facts",
    "a reply on another site is an error",
    "warnings: unreachable when, dead insteadOf, one-way link, missing complaint reply, no replier, second reply",
    "an answer in a complaint thread opened only by complaint replies raises no warning",
    "order warnings: an answer before its thread post, two replies against their insteadOf order",
    "text rules: pieces around {name}, a piece inside shipped text, {name} in an own post",
    "text rules: a reply piece inside a chatter line raises the unique-text warning",
    "a name with backslash sequences is filled as typed in the validator",
    "an empty replyTo beside a valid replyToComplaint is an error",
    "a reply piece inside the ink of a mail-reply record or an object raises the unique-text warning",
    "a reply whose every thread post can never fire warns that its thread can never open",
    "report lines: reply, answer, second reply and per-complaint members, names from forms.first",
    "report lines: a second answer and a complaint second reply",
    "report lines: a reply and its thread post with no shared cause or need get a note",
    "report lines: Feed and Reactive feed count replies apart and time own posts only",
    "a reply piece inside an ink line raises the unique-text warning; the filled text does not",
    "report lines: the Feed estimate takes breakDrain off an NPC whose work resource starts down",
    "a feed post or reply holding a resource or network name warns"
];
    const src = readFileSync(join(root, 'test/js/validator-access-reply.test.mjs'), 'utf8');
    const now = [...src.matchAll(/^test\('((?:[^'\\]|\\.)*)'/gm)].map(m => m[1]);
    assert.deepEqual(now, recorded, `C3's reply tests changed since the copy at ${C3_COMMIT}: re-check the copied fixtures`);
});

// ── reaction fixtures ──

const withReacts = (s, npcId, reacts) => {
    s.rooms.office.npcs.find(n => n.id === npcId).feed.reacts = reacts;
    return s;
};

test('a clean pair with reactions raises no reaction issue', { skip }, () => {
    const s = withReacts(withReacts(pair(), 'ivy', [{ to: 'tom_re_ivy', key: 'like' }]), 'tomasz', [
        { to: 'ivy_answer', key: 'sad', alongside: 'tom_again' },
        { to: 'ivy_vent', key: 'angry', alongside: 'tom_still' }
    ]);
    assert.deepEqual(rxIssues(s), []);
});

test('errors: shape, empty fields, both or neither target, key, bad to, bad toComplaint, bad alongside', { skip }, () => {
    const s = pair();
    s.rooms.office.npcs.push(npc('olga', [own('olga_vent', 'Olga vents on another site.')]));
    s.rooms.office.npcs.at(-1).feed.site = 'otherface';
    withReacts(s, 'ivy', [
        'nope',
        { to: 'tom_vent', toComplaint: '', key: 'like' },
        { key: 'like' },
        { to: 'tom_vent', toComplaint: 'c9', key: 'like' },
        { to: 'tom_vent' },
        { to: 'tom_vent', key: 'love' },
        { to: 'missing', key: 'like' },
        { to: 'ivy_vent', key: 'like' },
        { to: 'olga_vent', key: 'like' },
        { toComplaint: 'nobody', key: 'sad' },
        { to: 'tom_vent', key: 'like', alongside: 'ghost' }
    ]);
    const list = rxIssues(s);
    assertHas(list, 'ivy.feed.reacts[0] is not an object');
    assertHas(list, 'ivy.feed.reacts[1].toComplaint is present but not a non-empty string');
    assertHas(list, 'reacts[2] needs exactly one of to and toComplaint (it has 0)');
    assertHas(list, 'reacts[3] needs exactly one of to and toComplaint (it has 2)');
    assertHas(list, 'reacts[4] has no key');
    assertHas(list, "reacts[5].key 'love' is not a reaction key (like, laugh, sad, angry)");
    assertHas(list, "reacts[6].to 'missing' names no post");
    assertHas(list, "reacts[7].to 'ivy_vent' names a post of ivy's own");
    assertHas(list, "reacts[8].to 'olga_vent' is on 'otherface'");
    assertHas(list, "reacts[9].toComplaint 'nobody' is carried by no own post");
    assertHas(list, "reacts[10].alongside 'ghost' names no post or reply of ivy");
    assert.deepEqual(withReacts(pair(), 'ivy', 'x') && rxIssues(withReacts(pair(), 'ivy', 'x')).length, 1);
});

test('warnings: unknown field, dead reactor (one warning), never-served target, dead and never-following alongside', { skip }, () => {
    let list = rxIssues(withReacts(pair(), 'ivy', [{ to: 'tom_vent', key: 'like', alongSide: 'ivy_still' }]));
    assertHas(list, "'alongSide' is not a reaction field; did you mean 'alongside'?");
    const dead = withReacts(nonFeedingFixture(), 'tomasz', [
        { to: 'ivy_vent', key: 'sad', alongside: 'tom_re_ivy' }, { to: 'ivy_answer', key: 'like', alongside: 'tom_again' }]);
    list = rxIssues(dead);
    assert.equal(list.length, 1, list.join('\n'));
    assertHas(list, 'is on an NPC that never posts');
    assert.ok(report(dead).every(l => l.endsWith('(never comes out).')));
    const never = scenario([npc('ivy', [own('ivy_vent', 'Ivy vents here at length.')]),
        npc('kim', [own('kim_v', 'Kim never posts anything.', { when: NEVER })], { feed: { site: 'friendface', person: 'kim', posts: [own('kim_v', 'Kim never posts anything.', { when: NEVER })], reacts: [{ to: 'ivy_vent', key: 'sad', alongside: 'kim_v' }, { to: 'ivy_vent', key: 'like', alongside: 'kim_v' }] } })]);
    list = rxIssues(never);
    assert.equal(list.filter(l => l.includes('can never post') || l.includes('never comes out (')).length, 1, list.join('\n'));
    assertHas(list, 'kim can never post');
    assert.ok(report(never).every(l => l.endsWith('(never comes out).')));
    // A target reply whose thread can never open; a target answer no reply can open
    list = rxIssues(withReacts(threadNeverOpensFixture(), 'ivy', [{ to: 'tom_re_ivy', key: 'like' }]));
    assertHas(list, "'tom_re_ivy' never comes out (its thread can never open)");
    const lone = loneFixture();
    lone.rooms.office.npcs.push(npc('kim', [own('kim_v', 'Kim vents here at length.')], {}));
    withReacts(lone, 'kim', [{ to: 'ivy_answer', key: 'like' }]);
    assertHas(rxIssues(lone), "'ivy_answer' never comes out (no reply can open it)");
    // An alongside that can never fire
    list = rxIssues(withReacts(warningsFixture(), 'tomasz', [{ to: 'ivy_vent', key: 'sad', alongside: 'tom_dead' }]));
    assertHas(list, "'tom_dead' never comes out (its when can never hold)");
    // Certainly served before: Ivy's reply in a thread on Tomasz's only post, his vent as alongside
    const one = scenario([npc('tomasz', [own('tom_vent', 'Tomasz vents at length here.')]),
        npc('ivy', [own('ivy_v', 'Ivy vents at length here.'), reTo('ivy_re', 'Yes {name}, same here today.', 'tom_vent', 'ivy_v')])]);
    withReacts(one, 'tomasz', [{ to: 'ivy_re', key: 'like', alongside: 'tom_vent' }]);
    assertHas(rxIssues(one), "'tom_vent' always comes out before 'ivy_re'");
    // Certainly spent: the alongside is another member of the required post's set
    const sp = scenario([npc('tomasz', [own('tom_vent', 'Tomasz vents at length here.'),
        reTo('tom_re', 'Me too {name}, a reply of his.', 'ivy_v', 'tom_vent')]),
    npc('ivy', [own('ivy_v', 'Ivy vents at length here.'), reTo('ivy_re', 'Yes {name}, same here today.', 'tom_vent', 'ivy_v')])]);
    withReacts(sp, 'tomasz', [{ to: 'ivy_re', key: 'like', alongside: 'tom_re' }]);
    assertHas(rxIssues(sp), "'tom_re' always comes out before 'ivy_re'");
});

test('no warning: an alongside set member, a to naming a reply, a second reply with no answer', { skip }, () => {
    const s = withReacts(noAnswerFixture(), 'ivy', [{ to: 'tom_again', key: 'like' }, { to: 'tom_re_ivy', key: 'laugh' }]);
    withReacts(s, 'tomasz', [{ to: 'ivy_vent', key: 'sad', alongside: 'tom_still' }]);
    assert.deepEqual(rxIssues(s), []);
    assert.ok(report(s).every(l => !l.includes('never comes out')));
});

test('clashes: same to, a to on a vent of a named complaint, two toComplaint; the alternative-set exception', { skip }, () => {
    let list = rxIssues(withReacts(pair(), 'ivy', [{ to: 'tom_vent', key: 'like' }, { to: 'tom_vent', key: 'sad' }]));
    assertHas(list, 'ivy.feed.reacts[0] and ivy.feed.reacts[1] can land on the same post: only the first to come out shows');
    const asha = npc('asha', [own('asha_vent', 'Asha vents about the drive.', { complaint: 'c1' }), reC('asha_re', '{name}, mine as well.', 'c1', 'asha_vent')]);
    const kofi = npc('kofi', [own('kofi_vent', 'Kofi vents about the drive.', { complaint: 'c1' }), reC('kofi_re', '{name}, mine too today.', 'c1', 'kofi_vent'),
        own('kofi_a', 'Kofi posts once more here.'), own('kofi_b', 'Kofi posts yet again here.', { when: DOWN })]);
    const mk = reacts => { const s = scenario([JSON.parse(JSON.stringify(asha)), JSON.parse(JSON.stringify(kofi))]); return withReacts(s, 'kofi', reacts); };
    assertHas(rxIssues(mk([{ to: 'asha_vent', key: 'like' }, { toComplaint: 'c1', key: 'sad' }])), 'can land on the same post');
    assertHas(rxIssues(mk([{ toComplaint: 'c1', key: 'like' }, { toComplaint: 'c1', key: 'sad' }])), 'can land on the same post');
    assert.deepEqual(rxIssues(mk([{ toComplaint: 'c1', key: 'like', alongside: 'kofi_vent' }, { toComplaint: 'c1', key: 'sad', alongside: 'kofi_re' }])), []);
    const ev = withReacts(pair(), 'tomasz', [{ to: 'ivy_vent', key: 'sad', alongside: 'tom_re_ivy' }, { to: 'ivy_vent', key: 'angry', alongside: 'tom_vent' }]);
    assert.deepEqual(rxIssues(ev), []);
    assertHas(report(ev), "'tom_re_ivy' is the member served");
});

test('report lines: every main form and ending', { skip }, () => {
    const s = withReacts(withReacts(pair(), 'ivy', [{ to: 'tom_re_ivy', key: 'like' }]), 'tomasz', [
        { to: 'ivy_answer', key: 'sad', alongside: 'tom_again' },
        { to: 'ivy_vent', key: 'angry', alongside: 'tom_still' }
    ]);
    const lines = report(s);
    assertHas(lines, "ℹ️ Reaction Ivy reacts like to Tomasz's 'tom_re_ivy', with Ivy's first post after it, or with it if Ivy has finished posting by then.");
    assertHas(lines, "ℹ️ Reaction Tomasz reacts sad to Ivy's 'ivy_answer', alongside 'tom_again', if it is out by then (only if 'tom_again' is the member served).");
    assertHas(lines, "ℹ️ Reaction Tomasz reacts angry to Ivy's 'ivy_vent', alongside 'tom_still', if it is out by then (only if 'ivy_vent' comes out, not a reply in its place and 'tom_still' is the member served).");
    // Alone: the to ending only
    assertHas(report(withReacts(pair(), 'tomasz', [{ to: 'ivy_vent', key: 'sad' }])), "(only if 'ivy_vent' comes out, not a reply in its place).");
    // "with it, since": a reactor with one vent, its thread drawing a replyTo reply
    const one = scenario([npc('tomasz', [own('tom_vent', 'Tomasz vents at length here.')]),
        npc('ivy', [own('ivy_v', 'Ivy vents at length here.'), reTo('ivy_re', 'Yes {name}, same here today.', 'tom_vent', 'ivy_v')])]);
    withReacts(one, 'tomasz', [{ to: 'ivy_re', key: 'like' }]);
    assertHas(report(one), "ℹ️ Reaction Tomasz reacts like to Ivy's 'ivy_re', with it, since Tomasz has finished posting by then.");
    const comp = scenario([npc('asha', [own('asha_vent', 'Asha vents about the drive.', { complaint: 'c1' })]),
        npc('kofi', [own('kofi_a', 'Kofi posts at length here.')])]);
    withReacts(comp, 'kofi', [{ toComplaint: 'c1', key: 'sad' }]);
    assertHas(report(comp), "ℹ️ Reaction Kofi Fullname reacts sad to the oldest 'c1' vent, with Kofi Fullname's first post after it, or with it if Kofi Fullname has finished posting by then.");
});

test('the schema documents reacts with a plain-string key and no enum (no fourth copy of the key set)', () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    const find = (o) => {
        if (!o || typeof o !== 'object') return null;
        if (o.feed?.properties?.reacts) return o.feed.properties.reacts;
        for (const v of Object.values(o)) { const r = find(v); if (r) return r; }
        return null;
    };
    const reacts = find(schema);
    assert.ok(reacts, 'feed.reacts is in the schema');
    const key = reacts.items.properties.key;
    assert.equal(key.type, 'string');
    assert.equal(key.enum, undefined);
    assert.deepEqual(Object.keys(reacts.items.properties).sort(), ['alongside', 'key', 'to', 'toComplaint']);
});
