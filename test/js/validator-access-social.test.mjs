// scripts/validate_access_work.rb, sub-slice C (ACCESS_MODEL_SLICE_9_2_PLAN.md 8 and 10): social
// media feeds. One fixture per error and warning, a clean fixture that raises none, and the
// posting schedule in the work report.
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
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = s => run(s, 'check');
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const assertHas = (list, frag) => assert.ok(list.some(s => s.includes(frag)), `expected "${frag}" in:\n${list.join('\n')}`);
const assertLacks = (list, frag) => assert.ok(!list.some(s => s.includes(frag)), `did not expect "${frag}" in:\n${list.join('\n')}`);

function clean() {
    return {
        startRoom: 'lobby',
        chatter: { social_blocked: ['Blocked. Of course.'] },
        policies: { no_social: { social: 'blocked' }, lax: { social: 'allowed' } },
        social: {
            intelFacts: {
                jake_office: { label: 'Office', subject: 'jake', text: 'Jake Brooks works in the finance office.' },
                jake_pet_name: { label: 'Pet', subject: 'jake', text: 'Jake Brooks has a dog called Biscuit.' }
            },
            osint: { sites: [
                { id: 'friendface', type: 'social', name: 'Friendface', profiles: [
                    { person: 'jake', name: 'Jake Brooks', posts: [{ id: 'jake_authored', text: 'Finance office, third floor.', fact: 'jake_office' }] }
                ] },
                { id: 'corp', type: 'company-site', pages: [] }
            ] }
        },
        rooms: {
            lobby: {
                type: 'room_office',
                objects: [{ id: 'jake_pc', type: 'pc', name: 'PC', locked: true, lockType: 'login', policy: 'no_social',
                    affordance: { satisfies: 'work', useSeconds: 5 } }],
                npcs: [{
                    id: 'jake', displayName: 'Jake', npcType: 'person', needsHome: 'jake_pc', needsDeferMin: 0.5,
                    creds: { username: 'jbrooks', password: 'Biscuit1998!' },
                    needs: { social_media: { decayPerMin: 60, urgentAt: 40, initial: 50 } },
                    feed: { site: 'friendface', person: 'jake', posts: [
                        { id: 'jake_post_1', text: 'Biscuit turns 5 today! Best boy.', fact: 'jake_pet_name' },
                        { id: 'jake_post_2', text: 'Back from Crete, three hundred emails waiting.' }
                    ] }
                }]
            }
        }
    };
}
const jake = s => s.rooms.lobby.npcs[0];

test('social: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('social: the feed site and person must resolve (a social site, a profile on it); feed.posts must be a list', { skip }, () => {
    let s = clean(); jake(s).feed.site = 'nowhere';
    assertHas(errors(issues(s)), "feed.site 'nowhere' names no social.osint site");
    s = clean(); jake(s).feed.site = 'corp';
    assertHas(errors(issues(s)), 'a feed needs a social site');
    s = clean(); jake(s).feed.person = 'lena';
    assertHas(errors(issues(s)), "feed.person 'lena' is no profile");
    s = clean(); jake(s).feed = [{ id: 'x', text: 'a bare list of posts' }];
    assertHas(errors(issues(s)), 'not a bare list');
});

test('social: post ids must be unique against social.osint and other feeds; a fact must exist; an id is required', { skip }, () => {
    let s = clean(); jake(s).feed.posts[1].id = 'jake_authored';
    assertHas(errors(issues(s)), "id 'jake_authored' is also a post or block id in social.osint");
    s = clean(); jake(s).feed.posts[1].id = 'jake_post_1';
    assertHas(errors(issues(s)), "is also jake's feed post id");
    s = clean(); jake(s).feed.posts[1].fact = 'no_such_fact';
    assertHas(errors(issues(s)), "fact 'no_such_fact' names no social.intelFacts entry");
    s = clean(); delete jake(s).feed.posts[1].id;
    assertHas(errors(issues(s)), 'needs an id');
});

test('social: a feed fact granted anywhere else is an error; a readiness slot holding its id is fine', { skip }, () => {
    let s = clean(); s.social.osint.sites[0].profiles[0].posts.push({ id: 'dup', text: 'Look at my dog, everyone!', fact: 'jake_pet_name' });
    assertHas(errors(issues(s)), "feed fact 'jake_pet_name' is also named at social/osint/sites[0]/profiles[0]/posts[1]/fact");
    s = clean(); s.rooms.lobby.objects.push({ id: 'note', type: 'notes', onRead: [{ type: 'grant_fact', fact: 'jake_pet_name' }] });
    assertHas(errors(issues(s)), "feed fact 'jake_pet_name' is also named at rooms/lobby/objects[1]/onRead[0]/fact");
    s = clean(); s.social.calls = { jake_call: { grants: { intel: ['jake_pet_name'] } } };
    assertHas(errors(issues(s)), 'calls/jake_call/grants/intel');
    s = clean(); s.social.intelBoard = { readinessSlots: [{ target: 'jake', needsIntel: ['jake_pet_name'] }] };
    assert.deepEqual(errors(issues(s)), []);
});

test('social: a password in a feed post, a feed fact or a chatter line is an error', { skip }, () => {
    let s = clean(); jake(s).feed.posts[1].text = 'My password is Biscuit1998! do not tell';
    assertHas(errors(issues(s)), "jake.feed.posts[1].text contains jake's password");
    s = clean(); s.social.intelFacts.jake_pet_name.text = 'He logs in with Biscuit1998! every day.';
    assertHas(errors(issues(s)), "social.intelFacts.jake_pet_name.text contains jake's password");
    s = clean(); s.chatter.social_blocked = ['Blocked. Biscuit1998! does not even work here.'];
    assertHas(errors(issues(s)), "chatter.social_blocked contains jake's password");
});

test('social: no phone, no workstation home and no source is an error; a workstation home is enough', { skip }, () => {
    const s = clean();
    jake(s).phone = false;
    jake(s).needsHome = { room: 'lobby', x: 2, y: 2 };
    assertHas(errors(issues(s)), 'no workstation for a home and no object whose affordance.satisfies social_media');
    jake(s).needsHome = 'jake_pc';
    assert.deepEqual(errors(issues(s)), []);
});

test('social: needsDeferMin under 0.5 warns with "phone": false and not with a phone', { skip }, () => {
    const s = clean();
    jake(s).needsDeferMin = 0.2;
    assertLacks(warnings(issues(s)), 'needsDeferMin');
    jake(s).phone = false;
    assertHas(warnings(issues(s)), 'needsDeferMin 0.2');
});

test('social: a blocking policy with no phone wants a social_blocked line', { skip }, () => {
    const s = clean();
    jake(s).phone = false;
    s.chatter = {};
    assertHas(warnings(issues(s)), 'no social_blocked line');
    s.chatter = { social_blocked: ['Blocked. Of course.'] };
    assertLacks(warnings(issues(s)), 'no social_blocked line');
});

test('social: short text and text inside another shipped string warn; a feed with no need warns', { skip }, () => {
    let s = clean(); jake(s).feed.posts[1].text = 'Crete!';
    assertHas(warnings(issues(s)), 'jake.feed.posts[1].text is under 12 characters');
    s = clean(); s.social.intelFacts.jake_pet_name.text = 'Has a dog.';
    assertHas(warnings(issues(s)), 'social.intelFacts.jake_pet_name.text is under 12 characters');
    s = clean(); s.rooms.lobby.objects.push({ id: 'card', type: 'notes', text: 'Pinned up: Biscuit turns 5 today! Best boy. (from his feed)' });
    assertHas(warnings(issues(s)), 'jake.feed.posts[0].text occurs inside another string that ships');
    s = clean(); s.rooms.lobby.objects.push({ id: 'card', type: 'notes', text: 'Back from Crete, three hundred emails waiting.' });
    assertHas(warnings(issues(s)), 'jake.feed.posts[1].text occurs inside another string that ships');
    s = clean(); delete jake(s).needs;
    assertHas(warnings(issues(s)), 'has a feed but no social_media need');
});

test('social: a high-awareness poster warns unless the post is deliberate', { skip }, () => {
    const s = clean();
    jake(s).awareness = 'high';
    assertHas(warnings(issues(s)), "carries the fact 'jake_pet_name' but jake's awareness is high");
    jake(s).feed.posts[0].deliberate = true;
    assertLacks(warnings(issues(s)), 'awareness is high');
});

test('social: a guard with challengeOnSight, the need and a phone is walkable once a period', { skip }, () => {
    const s = clean();
    jake(s).los = { enabled: true, challengeOnSight: { event: 'player_in_view_near:jake' } };
    assertHas(warnings(issues(s)), 'can be walked past once every period of the need (about every 60 s)');
    jake(s).phone = false;
    assertLacks(warnings(issues(s)), 'walked past');
});

test('social: the report gives each feed its posting schedule and the server floor', { skip }, () => {
    const lines = run(clean(), 'report_lines');
    const line = lines.find(l => l.startsWith('ℹ️ Feed jake'));
    assert.ok(line, lines.join('\n'));
    assert.match(line, /2 posts; first urgent at 10 s, then about every 80 s; posts expected at about 0:30, 1:50/);
    assert.match(line, /Server floor 51 s/);
});

test('social: the needs validator counts the own workstation as a social_media source with "phone": false', { skip }, () => {
    const s = clean();
    jake(s).phone = false;
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(s), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const list = JSON.parse(r.stdout.trim().split('\n').pop());
    assertLacks(list, "need 'social_media' has no object");
    jake(s).needsHome = { room: 'lobby', x: 2, y: 2 };
    const r2 = spawnSync('ruby', ['-e', script], { input: JSON.stringify(s), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assertHas(JSON.parse(r2.stdout.trim().split('\n').pop()), "need 'social_media' has no object");
});
