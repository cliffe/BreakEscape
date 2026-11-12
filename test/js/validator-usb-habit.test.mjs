// scripts/validate_access_work.rb, the USB habit (docs/achitechture/USB_HABIT_PLAN.md, q39):
// usbHabit's shape and global, the no-plan warning, the usb_refused mutter, the work report line
// and a reactive post keyed on cause usb_refused.
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
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

function clean() {
    return {
        startRoom: 'office',
        chatter: { usb_refused: ['IT blocked my USB. Email it is, then.'] },
        policies: { locked: { usb: 'storage_blocked' }, lax: { usb: 'allowed' } },
        globalVariables: { kim_emailed: false },
        resources: { reports: { kind: 'file_share', name: 'Reports' } },
        rooms: {
            office: {
                type: 'room_office',
                objects: [{ id: 'kim_pc', type: 'pc', name: 'PC', lockType: 'login', policy: 'locked',
                    affordance: { satisfies: 'work', useSeconds: 5, restores: 10 } }],
                npcs: [{ id: 'kim', displayName: 'Kim', npcType: 'person', needsHome: 'kim_pc', needsDeferMin: 0.5,
                    workNeeds: ['reports'], usbHabit: { every: 2, setGlobal: 'kim_emailed' },
                    needs: { work: { decayPerMin: 40, urgentAt: 50 } } }]
            }
        }
    };
}
const kim = s => s.rooms.office.npcs[0];

test('USB habit: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('USB habit: a bad every, an undeclared setGlobal and a non-object are errors', { skip }, () => {
    const s = clean();
    kim(s).usbHabit = { every: 0, setGlobal: 'nope' };
    const list = issues(s);
    assertHas(list, 'kim.usbHabit.every is 0');
    assertHas(list, 'kim.usbHabit.setGlobal "nope" is not declared');
    kim(s).usbHabit = true;
    assertHas(issues(s), 'kim.usbHabit must be an object');
});

test('USB habit: no work plan is warned', { skip }, () => {
    const s = clean();
    kim(s).workNeeds = [];
    assertHas(issues(s), 'kim has a usbHabit but no work plan');
});

test('USB habit: a refusing PC needs a usb_refused (or work_fail) line', { skip }, () => {
    const s = clean();
    delete s.chatter;
    assertHas(issues(s), 'kim can fail for its PC refusing its USB stick');
    s.chatter = { work_fail: ['Why is nothing working?'] };
    assert.ok(!has(issues(s), 'refusing its USB stick'));
    const t = clean();
    delete t.chatter;
    t.rooms.office.objects[0].policy = 'lax';
    assert.ok(!has(issues(t), 'refusing its USB stick'), 'an allowing PC refuses nothing');
});

test('USB habit: only room NPCs may carry it', { skip }, () => {
    const s = clean();
    s.npcs = [{ id: 'phone_kim', usbHabit: { every: 2 } }];
    assertHas(issues(s), "has 'usbHabit', which is allowed only on room NPCs");
});

test('USB habit: the work report names it, refused or allowed', { skip }, () => {
    const s = clean();
    assertHas(run(s, 'report_lines'), "every 2nd use at 'kim_pc' copies to a USB stick, which its policy refuses (cause usb_refused)");
    s.rooms.office.objects[0].policy = 'lax';
    assertHas(run(s, 'report_lines'), 'which its policy allows');
});

test('USB habit: a reactive post on cause usb_refused is accepted where it can fire', { skip }, () => {
    const s = clean();
    s.social = { osint: { sites: [{ id: 'ff', type: 'social', name: 'FF', profiles: [{ person: 'kim', name: 'Kim', posts: [] }] }] } };
    kim(s).needs.social_media = { decayPerMin: 60, urgentAt: 40 };
    kim(s).feed = { site: 'ff', person: 'kim', order: 'reactive_first',
        posts: [{ id: 'vent', text: 'IT blocked my USB again.', when: { cause: 'usb_refused', need: 'work' } }] };
    const list = issues(s);
    assert.ok(!has(list, 'not one of'), list.join('\n'));
    assertHas(run(s, 'report_lines'), 'vent: fires when a cause with why usb_refused for work is live');
    s.rooms.office.objects[0].policy = 'lax';
    assertHas(issues(s), 'kim.feed.posts[0].when can never hold for kim');
});
