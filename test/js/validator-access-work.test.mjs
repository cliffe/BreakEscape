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

test('Work: an aim gate or event condition reading <npcId>_frustration is warned as client-decided (review R2 n2)', { skip }, () => {
    const s = workClean();
    s.objectives = [{ aimId: 'a1', title: 'A', unlockCondition: { globalVariable: 'dana_frustration', equals: 100 }, tasks: [] }];
    s.rooms.office.npcs[0].eventMappings = [{ eventPattern: 'npc_used:dana', condition: 'globalVars.dana_frustration >= 50', setGlobal: { x: true } }];
    const w = warnings(issues(s));
    assertHas(w, "objectives.0.unlockCondition reads 'dana_frustration', which the player's browser writes");
    assertHas(w, "eventMappings.0.condition reads 'dana_frustration'");
    assert.equal(errors(issues(s)).length, 0);
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

test('Work: earliest by a modified browser (review R1 m1, m2): halved park floor, [] route, alternating eases', { skip }, () => {
    // m1: kai is not admitted and his station has an offWhen, so an off fail and an owned-cause
    // fail alternate: half the park floor, 2 x 24 / 2 = 24
    const s = withKai(workClean());
    s.rooms.office.npcs[1].workarounds = [{ at: 50, do: 'writes_down' }];
    s.rooms.office.objects[1].affordance.offWhen = 'kai_pc_off';
    s.globalVariables.kai_pc_off = false;
    assertHas(run(s, 'report_lines'), 'earliest by a modified browser 24 s after');

    // m2: email on a network with no route (a [] route) is owned; no ease place but the station:
    // the park floor, 2 x 24 = 48
    const n = workClean();
    n.networks = { corp: { name: 'Corp' } };
    n.resources.email.network = 'corp';
    n.rooms.office.objects[0].affordance = { satisfies: 'work', useSeconds: 5, restores: 10 };
    n.rooms.office.npcs[0].workarounds = [{ at: 50, do: 'emit', event: 'dana_gave_up' }];
    assertHas(run(n, 'report_lines'), 'earliest by a modified browser 48 s after');
    // review R2 m3: a non-desk place changes nothing, the server refuses every work ease for a
    // [] route as for an unadmitted resource, so still the park floor
    n.rooms.office.objects.push({ id: 'kiosk', type: 'info_kiosk_x', name: 'Kiosk', affordance: { satisfies: 'work', useSeconds: 5 } });
    assertHas(run(n, 'report_lines'), 'earliest by a modified browser 48 s after');
    assert.ok(!run(n, 'report_lines').some(l => l.includes('alternating')));
});

// Sub-slice L (plan 6.6 and 10): a lockout at the NPC's own sign-in PC under maxAttempts
const withJake = s => {
    s.policies = { strict: { autoLockMin: 5, maxAttempts: 3 } };
    s.rooms.office.objects.push(pc('jake_pc', { policy: 'strict', lockChance: 1 }));
    s.rooms.office.npcs.push(worker('jake', { workarounds: [{ at: 50, do: 'emit', event: 'jake_gave_up' }] }));
    return s;
};

test('Work L: a lockout station is a cause: clean with a station_fail line, warned with no line', { skip }, () => {
    const s = withJake(workClean());
    assert.deepEqual(issues(s), []);
    delete s.chatter.station_fail; delete s.chatter.work_fail;
    assertHas(warnings(issues(s)), 'jake can fail for its account being locked out at its station, but no station_fail or work_fail line');
    // no maxAttempts, or a station owned by somebody else: no lockout, so nothing to say
    const t = withJake(workClean());
    delete t.chatter.station_fail; delete t.chatter.work_fail;
    t.policies.strict.maxAttempts = null;
    assert.ok(!has(issues(t), 'jake can fail for'), issues(t).join('\n'));
    t.policies.strict.maxAttempts = 3;
    t.rooms.office.objects.find(o => o.id === 'jake_pc').screenOwner = 'dana';
    assert.ok(!has(issues(t), 'locked out at its station'), issues(t).join('\n'));
});

test('Work L: the report line and the earliest time for a lockout-only NPC', { skip }, () => {
    const s = withJake(workClean());
    let lines = run(s, 'report_lines');
    assertHas(lines, "Work jake: email (admitted, nothing takes it down); locked out at 'jake_pc' after 3 wrong passwords for its username there (a denial of service).");
    // no place but the station: every ease there is refused once locked out, so the park floor, 2 x 24 = 48
    assertHas(lines, 'Workaround jake[0] emit at 50: opens event \'jake_gave_up\'; 3 failed use(s) at perFail 20');
    assert.ok(lines.some(l => l.startsWith('ℹ️ Workaround jake[0]') && l.includes('earliest by a modified browser 48 s after')), lines.join('\n'));
    // a non-desk place: eases there open the gate, so the use floor, 2 x (0.9 x 5 - 3) = 3, by alternating
    s.rooms.office.objects.push({ id: 'kiosk', type: 'info_kiosk_x', name: 'Kiosk', affordance: { satisfies: 'work', useSeconds: 5 } });
    lines = run(s, 'report_lines');
    assert.ok(lines.some(l => l.startsWith('ℹ️ Workaround jake[0]') && l.includes('earliest by a modified browser 3 s (only by alternating eases and fails, once the player has locked it out)')), lines.join('\n'));
    // Dana (an outage she can be re-armed through) keeps the plain use floor
    assert.ok(!lines.some(l => l.startsWith('ℹ️ Workaround dana') && l.includes('alternating')));
});

test('Work: a resource with only a network or observations is not called unused (review R1 m3)', { skip }, () => {
    const s = workClean();
    s.networks = { corp: { name: 'Corp' } };
    s.resources.notes = { name: 'Notes', kind: 'file_share', network: 'corp' };
    s.resources.board = { name: 'Board', kind: 'intranet', observations: 'A notice board.' };
    const list = issues(s);
    assert.ok(!has(list, "resource 'notes'"), list.join('\n'));
    assert.ok(!has(list, "resource 'board'"), list.join('\n'));
});

// ── sub-slice B: workarounds ───────────────────────────────────────────

// Dana (writes_down), Tom (prop_door into a locked rfid store he can open, the prop in the
// office) and Ellis (emit), each with the start pools; the clean fixture raises nothing.
function wkClean() {
    const s = workClean();
    s.chatter.wk_writes_down = ["I'll never remember this one."];
    s.chatter.wk_prop_door = ["I'm not badging in every time."];
    s.globalVariables.store_propped = false;
    s.rooms.office.connections = { north: 'store' };
    s.rooms.office.objects.push(pc('tom_pc', { affordance: { satisfies: 'work', useSeconds: 5, restores: 10, offWhen: 'dana_pc_off' } }),
        { id: 'store_wedge', type: 'fire_extinguisher1', name: 'Extinguisher', revealOnGlobal: 'store_propped' });
    s.rooms.office.npcs[0].workarounds = [{ at: 50, do: 'writes_down' }];
    s.rooms.office.npcs.push(worker('tom', {
        role: ['facilities', 'staff'], creds: { username: 'tom', password: 'pw-tom-long', card: { card_id: 'tom_card', name: 'Badge' } },
        workarounds: [{ at: 50, do: 'prop_door', door: 'store', prop: 'store_wedge', setGlobal: 'store_propped' }]
    }));
    s.rooms.store = {
        type: 'room_office', locked: true, lockType: 'rfid', access: { roles: ['facilities'] },
        connections: { south: 'office' }, objects: [], npcs: []
    };
    return s;
}
const tom = s => s.rooms.office.npcs.find(n => n.id === 'tom');

test('Workarounds: a clean fixture raises nothing', { skip }, () => {
    assert.deepEqual(issues(wkClean()), []);
});

test('Workarounds: bounds, kinds, undeclared setGlobal, references and emit with no event are errors', { skip }, () => {
    const s = wkClean();
    s.rooms.office.npcs[0].workarounds = [{ at: 0, do: 'writes_down' }, { at: 50, do: 'shout' },
        { at: 50, do: 'emit', setGlobal: 'nope' }, { at: 50, do: 'borrow_session', pc: 'no_pc' }];
    tom(s).workarounds[0].prop = 'no_wedge';
    s.roles.staff.workarounds = 'all of them';
    const e = errors(issues(s));
    assertHas(e, 'dana.workarounds[0].at is 0');
    assertHas(e, 'dana.workarounds[1].do is "shout"');
    assertHas(e, 'dana.workarounds[2].setGlobal "nope" is not declared');
    assertHas(e, 'dana.workarounds[2] (emit) has no event');
    assertHas(e, 'dana.workarounds[3].pc "no_pc" names no room object');
    assertHas(e, 'tom.workarounds[0].prop "no_wedge" names no room object');
    assertHas(e, 'roles.staff.workarounds must be a list');
});

test('Workarounds: writes_down needs an account and a sign-in PC; an authored postitNote is warned', { skip }, () => {
    const s = wkClean();
    delete s.rooms.office.npcs[0].creds;
    s.rooms.office.objects[0].lockType = undefined;
    delete s.rooms.office.objects[0].lockType;
    s.rooms.office.objects[0].workstation = true;
    let e = errors(issues(s));
    assertHas(e, "dana's workaround 0 (writes_down): dana has no account");
    assertHas(e, "dana's needsHome is not a sign-in PC");
    const t = wkClean();
    t.rooms.office.objects[0].postitNote = 'Back in 5';
    assertHas(warnings(issues(t)), "'dana_pc' authors its own postitNote");
    const u = wkClean();
    u.rooms.office.objects[0].showPostit = false;
    assertHas(warnings(issues(u)), 'sets showPostit: false');
});

test('Workarounds: prop_door rules: locked, no gate, not the own room, the prop next door and outside', { skip }, () => {
    let s = wkClean();
    s.rooms.store.locked = false;
    assertHas(errors(issues(s)), "room 'store' is not locked");
    s = wkClean();
    s.rooms.office.doors = [{ connectedRoom: 'store', direction: 'north', gate: { openFor: ['tom'] } }];
    assertHas(errors(issues(s)), "room 'store' is behind a gate door");
    s = wkClean();
    tom(s).workarounds[0].door = 'office';
    s.rooms.office.locked = true;
    assertHas(errors(issues(s)), "room 'office' is tom's own room");
    s = wkClean();
    s.rooms.store.objects.push(s.rooms.office.objects.pop());
    assertHas(errors(issues(s)), "prop 'store_wedge' is inside 'store' itself");
    s = wkClean();
    s.rooms.annex = { type: 'room_office', objects: [s.rooms.office.objects.pop()], npcs: [] };
    assertHas(errors(issues(s)), "prop 'store_wedge' is in 'annex', which is not connected to 'store'");
});

test('Workarounds: a prop_door with no door or no prop is an error; a prop not hidden on its setGlobal is warned', { skip }, () => {
    let s = wkClean();
    delete tom(s).workarounds[0].door;
    assertHas(errors(issues(s)), "tom's workaround 0 (prop_door) has no door");
    s = wkClean();
    delete tom(s).workarounds[0].prop;
    assertHas(errors(issues(s)), "tom's workaround 0 (prop_door) has no prop");
    s = wkClean();
    tom(s).workarounds = [{ at: 50, do: 'prop_door' }];
    const e = errors(issues(s));
    assertHas(e, 'has no door');
    assertHas(e, 'has no prop');
    s = wkClean();
    delete tom(s).workarounds[0].setGlobal;
    assertHas(warnings(issues(s)), "tom's workaround 0 (prop_door) has no setGlobal");
    s = wkClean();
    delete s.rooms.office.objects.find(o => o.id === 'store_wedge').revealOnGlobal;
    assertHas(warnings(issues(s)), "prop 'store_wedge' is not hidden with revealOnGlobal \"store_propped\"");
});

test('Workarounds: a setGlobal that a server gate also reads is warned (review 9.2 B R2)', { skip }, () => {
    const frag = "workaround setGlobal 'store_propped' is also read on the server";
    let s = wkClean();
    s.objectives = [{ aimId: 'a1', title: 'Aim', tasks: [{ taskId: 't1', title: 'T', type: 'custom',
        unlockCondition: { globalVariable: 'store_propped' } }] }];
    assertHas(warnings(issues(s)), `${frag} (an unlockCondition)`);
    s = wkClean();
    s.objectives = [{ aimId: 'a1', title: 'Aim', concludeRequires: { globals: ['store_propped'] }, tasks: [] }];
    assertHas(warnings(issues(s)), `${frag} (concludeRequires.globals)`);
    s = wkClean();
    s.exportGlobals = ['store_propped'];
    assertHas(warnings(issues(s)), `${frag} (exportGlobals)`);
    s = wkClean();
    s.resources.finance_share.downIf = 'store_propped';
    assertHas(warnings(issues(s)), `${frag} (resources.finance_share.downIf)`);
    s = wkClean();
    s.rooms.office.objects.find(o => o.id === 'tom_pc').affordance.offWhen = { store_propped: true };
    assertHas(warnings(issues(s)), `${frag} (tom_pc offWhen)`);
    // An event mapping or a reveal reads it in the browser only: no warning
    s = wkClean();
    tom(s).eventMappings = [{ eventPattern: 'global_variable_changed:store_propped', conversationMode: 'none' }];
    assert.ok(!has(warnings(issues(s)), frag));
});

test('Workarounds: writes_down on a PC another NPC owns, or with no password, is an error', { skip }, () => {
    let s = wkClean();
    s.rooms.office.objects[0].screenOwner = 'tom';
    assertHas(errors(issues(s)), "'dana_pc' belongs to \"tom\"");
    s = wkClean();
    s.rooms.office.npcs[0].creds.password = '';
    assertHas(errors(issues(s)), 'dana has no password');
    s = wkClean();
    s.rooms.office.objects[0].screenOwner = 'dana';
    assert.deepEqual(issues(s), []);
});

test('Workarounds: prop_door warnings: a door the NPC cannot open, a flag station behind it, a leash', { skip }, () => {
    let s = wkClean();
    tom(s).role = ['staff'];
    assertHas(warnings(issues(s)), "tom's own card and role do not open 'store'");
    s = wkClean();
    s.rooms.store.objects.push({ id: 'flags', type: 'flag-station', name: 'Flags' });
    assertHas(warnings(issues(s)), "opens room 'store', which holds a flag station or VM launcher");
    s = wkClean();
    tom(s).needsAvoidRooms = ['office'];
    s.rooms.office.npcs = s.rooms.office.npcs.filter(n => n.id !== 'tom');
    s.rooms.lab = { type: 'room_office', connections: { east: 'office' }, objects: [], npcs: [tom(wkClean())] };
    s.rooms.lab.npcs[0].needsAvoidRooms = ['office'];
    assertHas(warnings(issues(s)), "a room tom's leash forbids");
});

test('Workarounds: an NPC that can never be frustrated, a missing start pool, and none under "chatter": false', { skip }, () => {
    let s = wkClean();
    s.rooms.office.objects.push(pc('amy_pc'));
    s.rooms.office.npcs.push(worker('amy', { workarounds: [{ at: 50, do: 'emit', event: 'x' }] }));
    assertHas(warnings(issues(s)), 'amy has workarounds but can never be frustrated');
    s = wkClean();
    delete s.chatter.wk_prop_door;
    assertHas(warnings(issues(s)), "tom's workaround 0 (prop_door) has no wk_prop_door line");
    s.chatter = false;
    assert.ok(!has(issues(s), 'wk_prop_door'));
});

test('Workarounds: a writes_down account that signs in where a flag station is, and the prop_door report line', { skip }, () => {
    const s = wkClean();
    s.rooms.office.objects[0].contents = [{ id: 'f1', type: 'flag-station', name: 'Flags' }];
    assertHas(warnings(issues(s)), "dana's workaround 0 (writes_down) opens dana's account, which signs in at dana_pc");
    assertHas(run(s, 'report_lines'), "Workaround tom[0] prop_door at 50: opens room 'store', which stays open for the mission");
});

// ── sub-slice H: the hot desk and the shared login ─────────────────────

// Ian borrows hot_desk (unowned, authored work affordance) and leaves it open; Sam shares his
// login with Ruth. Both with their start pools and login_aloud; the clean fixture raises nothing.
function hClean() {
    const s = workClean();
    s.chatter.wk_borrow = ["I'll use the spare PC."];
    s.chatter.wk_share_login = ['Ruth, a quick favour?'];
    s.chatter.login_aloud = ["Use mine. It's the usual one."];
    s.rooms.office.objects.push(pc('ian_pc', { affordance: { satisfies: 'work', useSeconds: 5, restores: 10, offWhen: 'dana_pc_off' } }),
        pc('hot_desk'), pc('sam_pc', { affordance: { satisfies: 'work', useSeconds: 5, restores: 10, offWhen: 'dana_pc_off' } }),
        pc('ruth_pc'));
    s.rooms.office.npcs.push(
        worker('ian', { screenHabit: { lockChance: 0 }, workarounds: [{ at: 50, do: 'borrow_session', pc: 'hot_desk' }] }),
        worker('sam', { workarounds: [{ at: 50, do: 'share_login', with: 'ruth' }] }),
        worker('ruth'));
    return s;
}
const npcOf = (s, id) => s.rooms.office.npcs.find(n => n.id === id);
const hotDesk = s => s.rooms.office.objects.find(o => o.id === 'hot_desk');

test('H: a clean fixture raises nothing; the work report no longer says "Not performed"', { skip }, () => {
    const s = hClean();
    assert.deepEqual(issues(s), []);
    const lines = run(s, 'report_lines');
    assertHas(lines, 'Workaround ian[0] borrow_session at 50: opens the session at PC \'hot_desk\'');
    assert.ok(!has(lines, 'Not performed'), lines.join('\n'));
});

test('H: a borrower with no screenHabit is warned (it opens nothing); lockChance 0 or locksScreen never is not', { skip }, () => {
    let s = hClean();
    delete npcOf(s, 'ian').screenHabit;
    assertHas(warnings(issues(s)), "ian's workaround 0 (borrow_session): ian is a careful guest");
    s = hClean();
    npcOf(s, 'ian').screenHabit = { lockChance: 1 };
    assertHas(warnings(issues(s)), 'ian is a careful guest');
    s = hClean();
    delete npcOf(s, 'ian').screenHabit;
    npcOf(s, 'ian').habits = { locksScreen: 'never' };
    assert.ok(!has(issues(s), 'careful guest'), issues(s).join('\n'));
    s = hClean();
    delete npcOf(s, 'ian').screenHabit;
    npcOf(s, 'ian').habits = { locksScreen: 'always' };
    assertHas(warnings(issues(s)), 'ian is a careful guest');
});

test('H: borrow_session errors on each bad hot desk', { skip }, () => {
    const cases = [
        [s => { delete npcOf(s, 'ian').creds; }, 'ian has no account'],
        [s => { delete hotDesk(s).lockType; hotDesk(s).workstation = true; }, "'hot_desk' is not a sign-in PC"],
        [s => { hotDesk(s).screenOwner = 'ruth'; }, "'hot_desk' has an owner (ruth)"],
        [s => { hotDesk(s).affordance.private = true; }, "'hot_desk' is private"],
        [s => { hotDesk(s).headless = true; }, "'hot_desk' is headless"],
        [s => { hotDesk(s).access = { roles: ['finance'] }; }, "'hot_desk's access list does not admit ian"],
        [s => { s.policies = { kiosk: { autoLockMin: 0 } }; hotDesk(s).policy = 'kiosk'; }, 'autoLockMin: 0'],
        [s => { hotDesk(s).affordance = { satisfies: 'caffeine', useSeconds: 5 }; }, "'hot_desk' has no authored affordance that satisfies work"]
    ];
    for (const [edit, frag] of cases) {
        const s = hClean();
        edit(s);
        assertHas(errors(issues(s)), frag);
    }
});

test('q33 review R1 N3: a hot desk that satisfies only one of the needs its borrower can fail is warned', { skip }, () => {
    const social = s => {
        npcOf(s, 'ian').phone = false;
        npcOf(s, 'ian').needs = { ...npcOf(s, 'ian').needs, social_media: { decayPerMin: 60, urgentAt: 40, initial: 50 } };
    };
    let s = hClean(); social(s);
    assertHas(warnings(issues(s)), "'hot_desk' satisfies work but not social_media, which ian can also fail");
    s = hClean(); social(s); hotDesk(s).affordance = { ...hotDesk(s).affordance, satisfies: ['work', 'social_media'] };
    assert.ok(!has(issues(s), 'which ian can also fail'), issues(s).join('\n'));
    s = hClean();
    assert.ok(!has(issues(s), 'which ian can also fail'), issues(s).join('\n'));
});

test('H: lockChance on a hot desk is warned (a guest ignores it); a hot desk holding a flag station is warned', { skip }, () => {
    let s = hClean();
    hotDesk(s).lockChance = 1;
    assertHas(warnings(issues(s)), "'hot_desk' sets lockChance or locksScreenOnLeave, which a guest ignores");
    s = hClean();
    hotDesk(s).contents = [{ type: 'flag-station', id: 'fs', name: 'Flag' }];
    assertHas(warnings(issues(s)), "opens a session at 'hot_desk', which is a flag station or VM launcher");
});

test('H: share_login errors with no account or with itself; a leashed colleague and a missing login_aloud are warned', { skip }, () => {
    let s = hClean();
    delete npcOf(s, 'sam').creds;
    assertHas(errors(issues(s)), "sam's workaround 0 (share_login): sam has no account");
    s = hClean();
    npcOf(s, 'sam').workarounds[0].with = 'sam';
    assertHas(errors(issues(s)), 'with names sam itself');
    s = hClean();
    npcOf(s, 'sam').workarounds[0].with = 'nobody';
    assertHas(errors(issues(s)), 'sam.workarounds[0].with "nobody" names no room NPC');
    s = hClean();
    npcOf(s, 'ruth').needsRooms = ['office'];
    assertHas(warnings(issues(s)), 'ruth has a needsRooms leash (office)');
    s = hClean();
    delete s.chatter.login_aloud;
    assertHas(warnings(issues(s)), 'has no login_aloud line');
});

// Review 9.2 H R1 m5 (q44): only a borrower's sitting signs in at a hot desk
test('q44: a hot desk that serves a need an NPC can use it for without borrowing is warned; a leash or a judged need is not', { skip }, () => {
    const frag = "hot desk 'hot_desk' (a borrow_session names it) satisfies caffeine, which ruth can use it for";
    let s = hClean();
    hotDesk(s).affordance = { ...hotDesk(s).affordance, satisfies: ['work', 'caffeine'] };
    npcOf(s, 'ruth').needs = { ...(npcOf(s, 'ruth').needs || {}), caffeine: { decayPerMin: 1, urgentAt: 10, initial: 80 } };
    assertHas(warnings(issues(s)), frag);
    // the work plan's judged need never takes another NPC's desk
    assert.ok(!has(issues(hClean()), 'without borrowing it'), issues(hClean()).join('\n'));
    // the desk moved to a room Ruth's leash keeps her out of
    s.rooms.annex = { type: 'room_office', objects: [], npcs: [], connections: { south: 'office' } };
    const moved = s.rooms.office.objects.findIndex(o => o.id === 'hot_desk');
    s.rooms.annex.objects.push(...s.rooms.office.objects.splice(moved, 1));
    npcOf(s, 'ruth').needsAvoidRooms = ['annex'];
    assert.ok(!has(issues(s), 'which ruth can use it for'), issues(s).join('\n'));
});
