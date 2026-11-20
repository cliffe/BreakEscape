// The USB policy module (systems/pc-policy.js), access slice 9.2 sub-slice U.
// Spec: docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md section 7.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectivePolicy, usbGoverned, usbRefused, usbPolicyFor, plantRefusal, USB_REFUSAL_LINES } from '../../public/break_escape/js/systems/pc-policy.js';
import { usbRefusedBy } from '../../public/break_escape/js/systems/npc-needs.js';

const scenario = {
    defaultPolicy: 'managed',
    policies: {
        managed: { usb: 'storage_blocked', autoLockMin: 5 },
        locked_down: { usb: 'blocked' },
        lax: { usb: 'allowed' },
        quiet: { autoLockMin: 3 }
    }
};

test('the table: allowed or absent accepts both; storage_blocked refuses storage only; blocked refuses both', () => {
    for (const usb of ['allowed', undefined, null]) {
        assert.equal(usbRefused(usb, 'storage'), false);
        assert.equal(usbRefused(usb, 'hid'), false);
    }
    assert.equal(usbRefused('storage_blocked', 'storage'), true);
    assert.equal(usbRefused('storage_blocked', 'hid'), false);
    assert.equal(usbRefused('blocked', 'storage'), true);
    assert.equal(usbRefused('blocked', 'hid'), true);
    // an item with no usbClass is never refused
    assert.equal(usbRefused('blocked', undefined), false);
    assert.equal(usbRefused('blocked', null), false);
});

test('the needs copy of the table agrees with the module', () => {
    for (const usb of ['allowed', 'storage_blocked', 'blocked', null]) {
        for (const cls of ['storage', 'hid', null, 'other']) assert.equal(usbRefusedBy(usb, cls), usbRefused(usb, cls), `${usb}/${cls}`);
    }
});

test('effectivePolicy: the PC\'s own policy, else the default, else null', () => {
    assert.deepEqual(effectivePolicy({ id: 'pc', policy: 'lax' }, scenario), scenario.policies.lax);
    assert.deepEqual(effectivePolicy({ id: 'pc' }, scenario), scenario.policies.managed);
    assert.equal(effectivePolicy({ id: 'pc' }, { policies: scenario.policies }), null);
    assert.equal(effectivePolicy({ id: 'pc', policy: 'nope' }, scenario), null);
});

test('usbGoverned: a workstation by its fields or an object naming a policy; not a tray under a default', () => {
    assert.equal(usbGoverned({ id: 'a', lockType: 'login' }), true);
    assert.equal(usbGoverned({ id: 'a', workstation: true }), true);
    assert.equal(usbGoverned({ id: 'a', lockChance: 0 }), true);
    assert.equal(usbGoverned({ id: 'a', locksScreenOnLeave: true }), true);
    assert.equal(usbGoverned({ id: 'dock', policy: 'locked_down' }), true);
    assert.equal(usbGoverned({ id: 'tray', type: 'bin' }), false);
    assert.equal(usbPolicyFor({ id: 'tray', type: 'bin' }, scenario), null);
    assert.equal(usbPolicyFor({ id: 'pc', lockType: 'login' }, scenario), 'storage_blocked');
    assert.equal(usbPolicyFor({ id: 'pc', lockType: 'login', policy: 'quiet' }, scenario), 'allowed');
    assert.equal(usbPolicyFor({ id: 'dock', policy: 'locked_down' }, scenario), 'blocked');
});

const stick = { scenarioData: { id: 'kit_usb', type: 'usb', usbClass: 'storage' } };
const badusb = { scenarioData: { id: 'kit_badusb', type: 'usb', usbClass: 'hid' } };
const logger = { scenarioData: { id: 'keylogger', type: 'keylogger' } };

test('plantRefusal: the first held item the policy accepts is used', () => {
    const dock = { id: 'dock', policy: 'managed' };
    assert.deepEqual(plantRefusal([stick, badusb], dock, scenario), { item: badusb, refusal: null });
    assert.deepEqual(plantRefusal([badusb, stick], dock, scenario), { item: badusb, refusal: null });
    // an item with no usbClass is never refused
    assert.deepEqual(plantRefusal([logger], { id: 'd', policy: 'locked_down' }, scenario), { item: logger, refusal: null });
});

test('plantRefusal: refused only when every matching item is refused, with the line for the value', () => {
    const r1 = plantRefusal([stick], { id: 'dock', policy: 'managed' }, scenario);
    assert.equal(r1.item, null);
    assert.equal(r1.refusal, 'USB storage is disabled on this PC.');
    assert.equal(r1.usbClass, 'storage');
    const r2 = plantRefusal([stick, badusb], { id: 'dock', policy: 'locked_down' }, scenario);
    assert.equal(r2.item, null);
    assert.equal(r2.refusal, USB_REFUSAL_LINES.blocked);
    assert.equal(r2.refusal, 'USB devices are disabled on this PC.');
});

test('plantRefusal: a non-governed object under a blocking default is not refused; nothing held is no refusal', () => {
    const sc = { ...scenario, defaultPolicy: 'locked_down' };
    assert.deepEqual(plantRefusal([stick], { id: 'tray' }, sc), { item: stick, refusal: null });
    assert.deepEqual(plantRefusal([], { id: 'dock', policy: 'locked_down' }, sc), { item: null, refusal: null });
});
