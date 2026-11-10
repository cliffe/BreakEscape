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
