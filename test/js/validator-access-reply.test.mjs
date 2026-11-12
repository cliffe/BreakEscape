// scripts/validate_access_work.rb, sub-slice C3 (ACCESS_MODEL_SLICE_9_2_C3_PLAN.md section 7):
// replies between NPCs. One fixture per error and warning, the per-piece text rules, the {name}
// substitution through AccessWork.friendface_name, and the report lines.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function run(scenario, fn = 'check') {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(ValidateAccessWork.${fn}(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = s => run(s, 'check').filter(l => !l.includes('Friendface phone'));
const report = s => run(s, 'report_lines');
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

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

// Ivy and Tomasz, a mutual pair with an answer and a second reply: clean
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

test('a clean mutual pair raises no reply issue', { skip }, () => {
    const list = issues(pair());
    assert.deepEqual(list.filter(l => /repl|answer|insteadOf|thread|\{name\}/i.test(l)), []);
});

test('errors: missing fields, bad thread, bad insteadOf, facts', { skip }, () => {
    const s = pair([], [
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
    const list = issues(s);
    assertHas(list, 'no `when`');
    assertHas(list, 'needs exactly one of replyTo and replyToComplaint (it has 2)');
    assertHas(list, 'needs exactly one of replyTo and replyToComplaint (it has 0)');
    assertHas(list, "replyTo 'missing_post' names no post");
    assertHas(list, "replyTo 'ivy_re_tom' names a reply");
    assertHas(list, "replyToComplaint 'no_such' is carried by no own post");
    assertHas(list, 'carries `complaint`');
    assertHas(list, "insteadOf 'ghost' names no post");
    assertHas(list, "insteadOf 'tom_re_ivy' names a reply");
    assertHas(list, "insteadOf 'ordered1' names an ordered post");
    assertHas(list, 'insteadOf names the post its own replyTo names');
    assertHas(list, 'is a reply and carries a fact');
    assertHas(list, "insteadOf 'fact_post' carries a fact");
});

test('a reply on another site is an error', { skip }, () => {
    const s = pair();
    s.rooms.office.npcs.push(npc('olga', [own('olga_vent', 'Olga vents on another site.'),
        reTo('olga_re', '{name}, replying across the sites here.', 'ivy_vent', 'olga_vent')]));
    s.rooms.office.npcs.at(-1).feed.site = 'otherface';
    assertHas(issues(s), "is on 'friendface', not olga's site");
});

test('warnings: unreachable when, dead insteadOf, one-way link, missing complaint reply, no replier, second reply', { skip }, () => {
    const ivy = npc('ivy', [own('ivy_vent', 'Shared drive down again, nothing will save.'),
        own('ivy_still', 'Two hours on and the shared drive is still down.'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still')]);
    const tom = npc('tomasz', [own('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
        reTo('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', 'ivy_vent', 'tom_vent', { when: { global: 'undeclared' } }),
        own('tom_dead', 'A vent that can never fire at all.', { when: { global: 'undeclared' } }),
        reTo('tom_re_dead', 'Same here {name}, a reply for a dead post.', 'ivy_vent', 'tom_dead')]);
    const kim = npc('kim', [own('kim_vent', 'Kim vents into a complaint here.', { complaint: 'c1' })]);
    const list = issues(scenario([tom, ivy, kim]));
    assertHas(list, 'the reply never fires, and its insteadOf post always comes out instead');
    assertHas(list, "insteadOf 'tom_dead' can never fire");
    assertHas(list, 'tomasz replies to ivy but ivy has no reply to tomasz');
    assertHas(list, "kim vents in complaint 'c1' but has no replyToComplaint reply");
    const noAnswer = pair();
    noAnswer.rooms.office.npcs[1].feed.posts.pop();
    assertHas(issues(noAnswer), 'is a second reply that no answer can open');
    const lone = npc('ivy', [own('ivy_vent', 'Shared drive down again, nothing will save.'),
        own('ivy_still', 'Two hours on and the shared drive is still down.'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still')]);
    assertHas(issues(scenario([lone])), 'that no reply can open');
});

test('an answer in a complaint thread opened only by complaint replies raises no warning', { skip }, () => {
    const asha = npc('asha', [own('asha_vent', 'Asha vents about the drive.', { complaint: 'c1' }),
        reC('asha_re', '{name}, mine is down as well here.', 'c1', 'asha_vent'),
        own('asha_later', 'Asha posts again about the drive.'),
        reTo('asha_answer', '{name}, I have rung IT about it now.', 'asha_vent', 'asha_later')]);
    const kofi = npc('kofi', [own('kofi_vent', 'Kofi vents about the drive.', { complaint: 'c1' }),
        reC('kofi_re', '{name}, mine is down as well today.', 'c1', 'kofi_vent')]);
    const list = issues(scenario([asha, kofi]));
    assertNot(list, 'that no reply can open');
    assertNot(list, 'has no replyToComplaint reply');
});

test('order warnings: an answer before its thread post, two replies against their insteadOf order', { skip }, () => {
    const ivy = npc('ivy', [own('ivy_still', 'Two hours on and the shared drive is still down.'),
        own('ivy_vent', 'Shared drive down again, nothing will save.'),
        reTo('ivy_re_tom', 'Not just you {name}, mine has gone as well.', 'tom_vent', 'ivy_vent'),
        reTo('ivy_answer', '{name}, did IT ever ring you back about it?', 'ivy_vent', 'ivy_still')]);
    const tom = npc('tomasz', [own('tom_vent', 'Shared drive is gone. Lovely start to the week.'),
        own('tom_still', 'Still no shared drive. I have given up for today.'),
        reTo('tom_again', '{name}, they told me tomorrow at the earliest.', 'ivy_vent', 'tom_still'),
        reTo('tom_re_ivy', 'Same here {name}, I lost my whole morning to it.', 'ivy_vent', 'tom_vent')]);
    const list = issues(scenario([tom, ivy]));
    assertHas(list, "'ivy_still' comes out first and the answer is spent");
    assertHas(list, 'these come out the other way round');
});

test('text rules: pieces around {name}, a piece inside shipped text, {name} in an own post', { skip }, () => {
    const s = pair([own('ivy_named', 'Hello {name}, an own post with a name.')],
        [reTo('short', '{name}: same here.', 'ivy_vent', 'tom_still')]);
    s.chatter = { lines: [{ text: 'Overheard: Ivy, did IT ever ring you back about it? No idea.' }] };
    const list = issues(s);
    assertHas(list, 'has no piece of 12 characters or more around {name}');
    assertHas(list, 'holds {name} but is not a reply');
});

test('report lines: reply, answer, second reply and per-complaint members, names from forms.first', { skip }, () => {
    const lines = report(pair());
    assertHas(lines, "Reply Tomasz replies to Ivy's 'ivy_vent', in place of 'tom_vent'");
    assertHas(lines, "Reply Ivy answers in 'ivy_vent''s thread, in place of 'ivy_still'");
    assertHas(lines, "Reply Tomasz may reply again in 'ivy_vent''s thread, in place of 'tom_still', only if Ivy has answered there");
    const asha = npc('asha', [own('asha_vent', 'Asha vents about the drive.', { complaint: 'c1' }),
        reC('asha_re', '{name}, mine is down as well here.', 'c1', 'asha_vent')]);
    const kofi = npc('kofi', [own('kofi_vent', 'Kofi vents about the drive.', { complaint: 'c1' }),
        reC('kofi_re', '{name}, mine is down as well today.', 'c1', 'kofi_vent')]);
    assertHas(report(scenario([asha, kofi])), "Complaint 'c1': Asha Fullname, Kofi Fullname, each replying in place of their vent");
});
