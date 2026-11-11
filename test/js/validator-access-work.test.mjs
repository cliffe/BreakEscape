// scripts/validate_access_work.rb (access slice 9.2, ACCESS_MODEL_SLICE_9_2_PLAN.md section 10):
// the USB policy (sub-slice U) and work, outages and frustration (sub-slice A). One fixture per
// error and warning, and a clean fixture that raises none.
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
const clone = o => JSON.parse(JSON.stringify(o));

// ── sub-slice U ────────────────────────────────────────────────────────

function usbClean() {
    return {
        startRoom: 'lobby',
        chatter: { usb_refused: ["USB's disabled. Typical."] },
        policies: { managed: { usb: 'storage_blocked' }, lax: { usb: 'allowed' }, locked_down: { usb: 'blocked' } },
        defaultPolicy: 'managed',
        rooms: {
            lobby: {
                type: 'room_office',
                objects: [
                    { id: 'kit_usb', type: 'usb', name: 'USB stick', needsTag: 'dev_usb', droppable: true, usbClass: 'storage' },
                    { id: 'lena_pc', type: 'pc', name: 'PC', workstation: true, affordance: { accepts: ['dev_usb'] } },
                    { id: 'kiosk_pc', type: 'pc', name: 'Kiosk', workstation: true, policy: 'lax', affordance: { accepts: ['dev_usb'] } },
                    { id: 'priya_dock', type: 'usb_hub', name: 'Dock', policy: 'locked_down', requiresItem: 'usb', triggerOnInteract: [] }
                ],
                npcs: [{ id: 'lena', displayName: 'Lena', npcType: 'person', needsHome: 'lena_pc', interests: { dev_usb: { weight: 2 } } }]
            }
        }
    };
}

test('USB: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(usbClean()), []);
});

test('USB: an unknown usb or social value, and an unknown usbClass, are errors', { skip }, () => {
    const s = usbClean();
    s.policies.managed.usb = 'storage_only';
    s.policies.lax.social = 'sometimes';
    s.rooms.lobby.objects[0].usbClass = 'mouse';
    const e = errors(issues(s));
    assertHas(e, "policies.managed.usb is 'storage_only'");
    assertHas(e, "policies.lax.social is 'sometimes'");
    assertHas(e, "usbClass 'mouse'");
});

test('USB: a blocking policy over objects whose items have no usbClass does nothing', { skip }, () => {
    const s = usbClean();
    delete s.rooms.lobby.objects[0].usbClass;
    const w = warnings(issues(s));
    assertHas(w, 'policies.managed sets usb');
    assertHas(w, 'policies.locked_down sets usb');
});

test('USB: a device accepted by an ungoverned object under a blocking default is warned', { skip }, () => {
    const s = usbClean();
    s.rooms.lobby.objects.push({ id: 'lost_property_tray', type: 'bin', name: 'Tray', affordance: { accepts: ['dev_usb'] } });
    const w = warnings(issues(s));
    assertHas(w, "'lost_property_tray' takes 'kit_usb'");
    // a non-blocking default does not warn
    s.defaultPolicy = 'lax';
    assert.ok(!has(issues(s), 'lost_property_tray'));
});

test('USB: an NPC that can be refused a device needs a usb_refused line, except under "chatter": false', { skip }, () => {
    const s = usbClean();
    delete s.chatter;
    assertHas(warnings(issues(s)), 'lena can be refused a USB device');
    s.rooms.lobby.npcs[0].chatter = { usb_refused: ['Typical.'] };
    assert.ok(!has(issues(s), 'can be refused'));
    const t = usbClean();
    t.chatter = false;
    assert.ok(!has(issues(t), 'can be refused'));
    // nobody can be refused: the PC accepts the class
    const u = usbClean();
    delete u.chatter;
    u.rooms.lobby.objects[0].usbClass = 'hid';
    assert.ok(!has(issues(u), 'can be refused'));
});

// ── sub-slice A ────────────────────────────────────────────────────────

const pc = (id, extra = {}) => ({
    id, type: 'pc', name: 'PC', lockType: 'login', locked: true,
    affordance: { satisfies: 'work', useSeconds: 5, restores: 10 }, ...extra
});
const worker = (id, extra = {}) => ({
    id, displayName: id, npcType: 'person', role: 'staff', needsHome: `${id}_pc`, needsDeferMin: 0.5,
    creds: { username: id, password: `pw-${id}-long` },
    needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 60 } }, ...extra
});
const workIssues = s => issues(s).filter(l => l.includes(' work: ') && !l.includes('USB') && !l.includes('takes '));

function workClean() {
    return {
        startRoom: 'office',
        chatter: {
            work_fail: ['Why is nothing working?'], station_fail: ['This PC is useless.'],
            work_fail_no_access: ['Still no access.'], work_fail_file_share: ["Share's down again."],
            work_fail_fed_up: ["That's it."]
        },
        resources: {
            email: { name: 'Email', kind: 'email' },
            finance_share: { name: 'Finance share', kind: 'file_share', access: { roles: ['finance'] }, downIf: 'share_down' }
        },
        roles: { staff: { workNeeds: ['email'], frustration: { perFail: 20 } }, finance: { workNeeds: ['finance_share'] } },
        globalVariables: { share_down: false, dana_pc_off: false },
        rooms: {
            office: {
                type: 'room_office',
                objects: [pc('dana_pc', { affordance: { satisfies: 'work', useSeconds: 5, restores: 10, offWhen: 'dana_pc_off' } })],
                npcs: [worker('dana', { role: ['finance', 'staff'] })]
            }
        }
    };
}
const withKai = s => {
    s.rooms.office.objects.push(pc('kai_pc'));
    s.rooms.office.npcs.push(worker('kai', { workNeeds: ['+finance_share'] }));
    return s;
};

test('Work: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(workClean()), []);
});

test('Work: references that resolve to nothing, bounds, reserved globals and non-room records are errors', { skip }, () => {
    const s = workClean();
    s.rooms.office.npcs[0].workNeeds = ['+printer'];
    s.roles.staff.workNeeds.push('-calendar');
    s.resources.email.object = 'no_such_printer';
    s.rooms.office.npcs[0].frustration = { perFail: 0, breakDrain: 60 };
    s.roles.finance.frustration = { easePerSuccess: 'lots' };
    s.globalVariables.dana_frustration = 0;
    s.phoneNPCs = [{ id: 'hq', npcType: 'phone', workNeeds: ['email'], frustration: { perFail: 10 } }];
    const e = errors(issues(s));
    assertHas(e, 'dana.workNeeds entry "+printer" names no resource');
    assertHas(e, 'roles.staff.workNeeds entry "-calendar" names no resource');
    assertHas(e, "resources.email.object 'no_such_printer' names no room object");
    assertHas(e, 'dana.frustration.perFail is 0');
    assertHas(e, 'dana.frustration.breakDrain is 60');
    assertHas(e, 'roles.finance.frustration.easePerSuccess is "lots"');
    assertHas(e, "global 'dana_frustration' ends in '_frustration'");
    assertHas(e, "'phoneNPCs[0]' has 'workNeeds'");
    assertHas(e, "'phoneNPCs[0]' has 'frustration'");
});

test('Work: an NPC with a resource it is not admitted to is warned (Kai, "work never succeeds")', { skip }, () => {
    const w = warnings(workIssues(withKai(workClean())));
    assertHas(w, "kai needs 'finance_share' but its access list does not admit kai: its work never succeeds");
    assert.equal(w.length, 1, w.join('\n'));
});

test('Work: a resource its station can never reach, and an undeclared downIf, are warned', { skip }, () => {
    const s = workClean();
    s.networks = { corp: { name: 'Corp' }, fin: { name: 'Finance' } };
    s.rooms.office.network = 'corp';
    s.resources.finance_share.network = 'fin';
    s.resources.email.downIf = 'mail_down';
    const w = warnings(issues(s));
    assertHas(w, "dana needs 'finance_share' but its station can never reach it");
    assertHas(w, "resources.email.downIf 'mail_down' is not declared");
});

test('Work: needsDeferMin under 0.5 is warned for a work plan and for social media with no phone, not with a phone', { skip }, () => {
    const s = workClean();
    s.rooms.office.npcs[0].needsDeferMin = 0.2;
    assertHas(warnings(issues(s)), 'dana has a work plan and needsDeferMin 0.2');
    const t = workClean();
    t.rooms.office.npcs.push({ id: 'sam', npcType: 'person', needsDeferMin: 0.2, phone: false, needs: { social_media: { decayPerMin: 4, urgentAt: 40 } } });
    assertHas(warnings(issues(t)), 'sam has a social_media need and "phone": false and needsDeferMin 0.2');
    t.rooms.office.npcs[1].phone = true;
    assert.ok(!has(issues(t), 'sam has'));
});

test('Work: the station warnings (no work affordance, a coordinate with a screenOwner PC, no restores)', { skip }, () => {
    const s = workClean();
    s.rooms.office.objects[0].affordance = { useSeconds: 5 };
    assertHas(warnings(issues(s)), "dana has a work plan, but its needsHome is 'dana_pc', which satisfies no work");
    const t = workClean();
    t.rooms.office.objects[0].screenOwner = 'dana';
    t.rooms.office.npcs[0].needsHome = { x: 3, y: 4 };
    const w = warnings(issues(t));
    assertHas(w, 'its needsHome is a coordinate');
    assertHas(w, "It owns 'dana_pc' through screenOwner");
    const u = workClean();
    delete u.rooms.office.objects[0].affordance.restores;
    assertHas(warnings(issues(u)), "dana's station 'dana_pc' satisfies work but has no affordance.restores");
    // an account holder with the role and no work need has no plan, so no warning
    const v = workClean();
    v.rooms.office.objects.push(pc('pat_pc', { affordance: undefined, screenOwner: 'pat' }));
    v.rooms.office.npcs.push({ id: 'pat', npcType: 'person', role: 'staff', creds: { username: 'pat', password: 'pw-pat-long' } });
    v.resources.email.downIf = undefined;
    assert.ok(!has(issues(v), 'pat'), issues(v).join('\n'));
});

test('Work: the mutter warning per cause, the work_fail fallback, and none under "chatter": false', { skip }, () => {
    // an unadmitted resource with only a fed-up line is warned
    const s = withKai(workClean());
    s.chatter = { work_fail_fed_up: ["That's it."], station_fail: ['Useless.'], work_fail_file_share: ['Down.'] };
    assertHas(warnings(issues(s)), "kai can fail for no access to 'finance_share', but no work_fail_no_access or work_fail line");
    // an empty work_fail_file_share pool with a work_fail line is not
    const t = workClean();
    t.chatter.work_fail_file_share = [];
    assert.ok(!has(issues(t), 'can fail for'), issues(t).join('\n'));
    // no station_fail and no work_fail: the station's offWhen is warned
    const u = workClean();
    delete u.chatter.station_fail; delete u.chatter.work_fail;
    assertHas(warnings(issues(u)), 'dana can fail for its station going off, but no station_fail or work_fail line');
    // the NPC's own chatter counts
    u.rooms.office.npcs[0].chatter = { work_fail: ['Not again.'] };
    assert.ok(!has(issues(u), 'can fail for'));
    // nothing under "chatter": false
    const v = withKai(workClean());
    v.chatter = false;
    assert.ok(!has(issues(v), 'can fail for'));
});

test('Work: a resource no NPC needs, with no contents and no host, is warned', { skip }, () => {
    const s = workClean();
    s.resources.intranet = { name: 'Intranet', kind: 'intranet' };
    assertHas(warnings(issues(s)), "resource 'intranet' is in no NPC's work list");
    s.resources.intranet.host = 'intranet.local';
    assert.ok(!has(issues(s), "resource 'intranet'"));
});

test('Work: a workaround at or below perFail is "no warning" unless marked', { skip }, () => {
    const s = workClean();
    s.rooms.office.npcs[0].workarounds = [{ at: 20, do: 'emit', event: 'dana_gave_up' }];
    assertHas(warnings(issues(s)), "dana's workaround 0 (emit) is at 20, at or below perFail 20");
    s.rooms.office.npcs[0].workarounds[0].noWarning = true;
    assert.ok(!has(issues(s), "workaround 0"));
});

test('Work: the report lines (resources, honest time, earliest by the park floor or the use floor)', { skip }, () => {
    const s = withKai(workClean());
    s.rooms.office.npcs[0].workarounds = [{ at: 50, do: 'emit', event: 'dana_gave_up' }];
    s.rooms.office.npcs[1].workarounds = [{ at: 50, do: 'writes_down' }];
    const lines = run(s, 'report_lines');
    assertHas(lines, 'Work dana: finance_share (admitted, down while share_down); email (admitted, nothing takes it down); station \'dana_pc\' off while dana_pc_off.');
    assertHas(lines, 'Work kai: email (admitted, nothing takes it down); finance_share (NOT admitted, down while share_down).');
    // dana: n = ceil(50/20) = 3; honest 5 + 2 x (30 + 5) = 75; earliest 2 x (0.9 x 5 - 3) = 3
    assertHas(lines, 'Workaround dana[0] emit at 50: opens event \'dana_gave_up\'; 3 failed use(s) at perFail 20; tell 1, tell 2, then the workaround; about 75 s of outage; earliest by a modified browser 3 s');
    // kai, not admitted: earliest by the park floor, 2 x (0.9 x 0.5 x 60 - 3) = 48
    assertHas(lines, 'Workaround kai[0] writes_down at 50: opens the account of kai');
    assertHas(lines, 'earliest by a modified browser 48 s');
    // n = 1 is "at once"
    s.rooms.office.npcs[0].workarounds[0].at = 10;
    assertHas(run(s, 'report_lines'), 'earliest by a modified browser at once');
    assert.deepEqual(run({ rooms: {} }, 'report_lines'), []);
});
