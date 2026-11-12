// scripts/validate_access_work.rb, sub-slice C2 (ACCESS_MODEL_SLICE_9_2_C2_PLAN.md section 8):
// the reactive feed-post checks. The feed order, the `when` predicate validation, the shared
// when_reachable? dead-post warning, and the leak-cannot-protect warning reaching a reactive
// post and its fact. One fixture per error and warning, and a clean fixture that raises none.
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
const issues = s => run(s, 'check');
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

const pc = (id, extra = {}) => ({
    id, type: 'pc', name: 'PC', lockType: 'login', locked: true,
    affordance: { satisfies: 'work', useSeconds: 5, restores: 10 }, ...extra
});

// dana has a work plan (finance_share, downIf share_down), a social_media need (so she posts), and
// a feed with one ordered post and one reactive vent. Her reactive `cause: down` is reachable.
function reactiveClean() {
    return {
        startRoom: 'office',
        chatter: {
            work_fail: ['Why is nothing working?'], station_fail: ['This PC is useless.'],
            work_fail_no_access: ['Still no access.'], work_fail_file_share: ["Share's down again."],
            work_fail_fed_up: ["That's it."]
        },
        resources: {
            finance_share: { name: 'Finance share', kind: 'file_share', access: { roles: ['finance'] }, downIf: 'share_down' }
        },
        roles: { staff: { workNeeds: [], frustration: { perFail: 20 } }, finance: { workNeeds: ['finance_share'] } },
        globalVariables: { share_down: false, office_party: false },
        social: {
            intelFacts: { dana_backups: { label: 'Backups', subject: 'dana', text: 'Dana keeps the backups on a personal drive.' } },
            osint: { sites: [{ id: 'friendface', type: 'social', name: 'Friendface',
                               profiles: [{ person: 'dana', name: 'Dana Reyes', posts: [] }] }] }
        },
        rooms: {
            office: {
                type: 'room_office',
                objects: [pc('dana_pc')],
                npcs: [{
                    id: 'dana', displayName: 'Dana', npcType: 'person', role: ['finance', 'staff'],
                    needsHome: 'dana_pc', needsDeferMin: 0.5, phone: true,
                    creds: { username: 'dana', password: 'pw-dana-long' },
                    needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 60 },
                             social_media: { decayPerMin: 4, urgentAt: 40 } },
                    feed: {
                        site: 'friendface', person: 'dana', order: 'reactive_first',
                        posts: [
                            { id: 'dana_ordered', text: 'Back from Crete, so many emails waiting.', date: 'Tuesday' },
                            { id: 'dana_vent', text: 'Finance share down again, second time this week.',
                              when: { cause: 'down', need: 'work' }, fact: 'dana_backups', deliberate: true }
                        ]
                    },
                    itemsHeld: [{ type: 'phone_friendface', id: 'dana_phone', name: "Dana's phone", takeable: true, phoneOf: 'dana' }]
                }]
            }
        }
    };
}
const feedLines = list => list.filter(l => l.includes('.feed') || l.includes('.when') || l.includes('reactive'));
const vent = s => s.rooms.office.npcs[0].feed.posts[1];

test('C2: a clean reactive feed raises nothing', { skip }, () => {
    assert.deepEqual(issues(reactiveClean()), []);
});

test('C2: an unknown feed.order value is an error', { skip }, () => {
    const s = reactiveClean();
    s.rooms.office.npcs[0].feed.order = 'newest_first';
    assertHas(errors(issues(s)), "dana.feed.order 'newest_first' is not one of");
});

test('C2: an empty when and an unknown predicate key are errors', { skip }, () => {
    const empty = reactiveClean();
    vent(empty).when = {};
    assertHas(errors(issues(empty)), '.when is empty');
    const unknown = reactiveClean();
    vent(unknown).when = { frustrationAbove: 50 };
    assertHas(errors(issues(unknown)), "unknown predicate 'frustrationAbove'");
});

test('C2: a bad cause why, a bad need and out-of-range frustration are errors', { skip }, () => {
    const s = reactiveClean();
    vent(s).when = { cause: ['down', 'exploded'], need: 'play', frustrationAtLeast: 0 };
    const e = errors(issues(s));
    assertHas(e, "cause names 'exploded'");
    assertHas(e, "when.need 'play' is not");
    assertHas(e, 'frustrationAtLeast must be a number from 1 to 100');
});

test('C2: a workaround naming a kind the NPC lacks is an error', { skip }, () => {
    const s = reactiveClean();
    vent(s).when = { workaround: 'borrow_session' };
    assertHas(errors(issues(s)), "when.workaround 'borrow_session' names no workaround");
});

test('C2: a when that can never hold for the NPC is warned (dead post)', { skip }, () => {
    const s = reactiveClean();
    vent(s).when = { global: 'undeclared_flag' };
    assertHas(warnings(issues(s)), 'can never hold for dana');
});

test('C2: facts_first on a reactive-only feed, and reactive_first on an ordered-only feed, are warned', { skip }, () => {
    const factsOnlyReactive = reactiveClean();
    const f = factsOnlyReactive.rooms.office.npcs[0].feed;
    f.order = 'facts_first';
    f.posts = [f.posts[1]]; // only the reactive vent remains
    assertHas(warnings(issues(factsOnlyReactive)), "order is 'facts_first' but every post is reactive");

    const orderedOnly = reactiveClean();
    const g = orderedOnly.rooms.office.npcs[0].feed;
    g.order = 'reactive_first';
    g.posts = [g.posts[0]]; // only the ordered post remains
    assertHas(warnings(issues(orderedOnly)), "order is 'reactive_first' but no post is reactive");
});

test('C2: a reactive post text too short, or embedded in a shipped string, is warned (leak cannot protect)', { skip }, () => {
    const short = reactiveClean();
    vent(short).text = 'Down again.'; // under 12 characters
    assertHas(warnings(issues(short)), 'is under 12 characters');

    const embedded = reactiveClean();
    const text = vent(embedded).text;
    // ship the vent text inside another string from the start (a room sign)
    embedded.rooms.office.sign = `Notice board: ${text} Please be patient.`;
    assertHas(feedLines(warnings(issues(embedded))), 'occurs inside another string');
});

test('C2: a reactive fact text too short is warned at the fact, not only the post', { skip }, () => {
    const s = reactiveClean();
    s.social.intelFacts.dana_backups.text = 'Backups.';
    assertHas(warnings(issues(s)), 'social.intelFacts.dana_backups.text is under 12 characters');
});

test('C2: the report lines name the order, the count and each reactive post', { skip }, () => {
    const lines = run(reactiveClean(), 'report_lines');
    assert.ok(Array.isArray(lines), 'report returns lines');
    assertHas(lines, 'Reactive feed dana: order reactive_first');
    assertHas(lines, 'dana_vent:');
});
