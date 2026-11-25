// scripts/validate_privilege.rb privilege_port_of (privilege plan ruling A, unit 14): the portOf field of
// a USB-governed object that belongs to a sign-in PC.
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/validator-privilege-port.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

const clean = () => ({
    startRoom: 'bay',
    policies: {
        bay_locked: { usb: 'storage_blocked' },
        open_bay: { usb: 'allowed' }
    },
    rooms: {
        bay: {
            type: 'room_office',
            objects: [
                { id: 'bay_pc', type: 'pc', name: 'Bay PC', lockType: 'login', locked: true, policy: 'bay_locked' },
                { id: 'bay_usb_port', type: 'pc', name: 'USB port', locked: false, policy: 'bay_locked', portOf: 'bay_pc' },
                { id: 'other_pc', type: 'pc', name: 'Other PC', lockType: 'login', locked: true, policy: 'bay_locked' }
            ]
        }
    }
});

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_privilege.rb'))}
      require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(check_privilege(data))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = l => l.filter(s => s.startsWith('❌'));
const warnings = l => l.filter(s => s.startsWith('⚠️'));
const has = (l, frag) => l.some(s => s.includes(frag));
const assertHas = (l, frag) => assert.ok(has(l, frag), `expected "${frag}" in:\n${l.join('\n')}`);
const port = sc => sc.rooms.bay.objects.find(o => o.id === 'bay_usb_port');
const grant = pc => ({ type: 'grant_foothold', needsSession: true, pc });

test('the clean port gets no line', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('a scenario with no portOf gets no port line', { skip }, () => {
    const sc = clean();
    delete port(sc).portOf;
    assert.ok(!has(issues(sc), 'portOf'));
});

test('portOf naming an id that is not there is an error', { skip }, () => {
    const sc = clean();
    port(sc).portOf = 'missing_pc';
    assertHas(errors(issues(sc)), "portOf names 'missing_pc', which is not a sign-in PC in a room");
});

test('portOf naming an object that is not a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    sc.rooms.bay.objects.push({ id: 'desk', type: 'desk', name: 'Desk' });
    port(sc).portOf = 'desk';
    assertHas(errors(issues(sc)), "portOf names 'desk', which is not a sign-in PC in a room");
});

test('portOf that is not a string, or is blank, is an error', { skip }, () => {
    for (const bad of [7, '   ', '', ['bay_pc'], null]) {
        const sc = clean();
        port(sc).portOf = bad;
        assertHas(errors(issues(sc)), 'portOf must name a sign-in PC by its id');
    }
});

test('portOf on a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    sc.rooms.bay.objects[0].portOf = 'other_pc';
    assertHas(errors(issues(sc)), 'a sign-in PC is its own port');
});

test('portOf on an object no policy governs is an error', { skip }, () => {
    const sc = clean();
    delete port(sc).policy;
    assertHas(errors(issues(sc)), 'no policy governs this object');
});

test('portOf on an object with a policy that names nothing still counts as governed', { skip }, () => {
    const sc = clean();
    port(sc).policy = 'not_a_policy_name';
    assert.ok(!has(errors(issues(sc)), 'no policy governs'));
});

test('a needsSession grant naming another PC is an error', { skip }, () => {
    const sc = clean();
    port(sc).triggerOnInteract = [grant('other_pc')];
    assertHas(errors(issues(sc)), "needsSession grant names 'other_pc', not the port's PC 'bay_pc'");
});

test('a needsSession grant naming the same PC is clean', { skip }, () => {
    const sc = clean();
    port(sc).triggerOnInteract = [grant('bay_pc')];
    assert.deepEqual(issues(sc), []);
});

test('a grant inside a confirm_action is read too', { skip }, () => {
    const sc = clean();
    port(sc).triggerOnInteract = [{ type: 'confirm_action', onConfirm: [grant('other_pc')] }];
    assertHas(errors(issues(sc)), "needsSession grant names 'other_pc'");
});

test('a port policy that differs from the PC policy is a warning, not an error', { skip }, () => {
    const sc = clean();
    port(sc).policy = 'open_bay';
    const out = issues(sc);
    assertHas(warnings(out), "port's USB policy ('allowed') differs from the policy of 'bay_pc' ('storage_blocked')");
    assert.deepEqual(errors(out), []);
});

test('two policies with the same usb value give no warning', { skip }, () => {
    const sc = clean();
    sc.policies.same_again = { usb: 'storage_blocked' };
    port(sc).policy = 'same_again';
    assert.deepEqual(issues(sc), []);
});
