// S5a unit 08: the admin override and the grant walk in systems/pc-policy.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pcPolicy, { plantRefusal, sessionGrantPc, gatedRemove, USB_REFUSAL_LINES } from '../../public/break_escape/js/systems/pc-policy.js';

const scenario = { policies: { locked_down: { usb: 'blocked' }, store: { usb: 'storage_blocked' } } };
const stick = { scenarioData: { usbClass: 'storage' } };
const badusb = { scenarioData: { usbClass: 'hid' } };
const governed = { id: 'pc1', workstation: true, policy: 'locked_down' };

test('plantRefusal without admin keeps today body', () => {
    assert.equal(plantRefusal([stick], governed, scenario).refusal, USB_REFUSAL_LINES.blocked);
    assert.equal(plantRefusal([stick], governed, scenario, {}).item, null);
    assert.equal(plantRefusal([stick], governed, scenario, { admin: false }).refusal, USB_REFUSAL_LINES.blocked);
});

test('plantRefusal with admin true lets the first item through', () => {
    const r = plantRefusal([stick, badusb], governed, scenario, { admin: true });
    assert.equal(r.item, stick);
    assert.equal(r.refusal, null);
});

test('only a strict true overrides', () => {
    for (const admin of ['yes', 1, {}, 'true']) {
        assert.equal(plantRefusal([stick], governed, scenario, { admin }).item, null);
    }
});

test('admin with no items still answers no item and no refusal', () => {
    assert.deepEqual(plantRefusal([], governed, scenario, { admin: true }), { item: null, refusal: null });
});

const grant = (pc, extra = {}) => ({ type: 'grant_foothold', pc, needsSession: true, ...extra });

test('sessionGrantPc finds a grant inside a confirm (sam_dock shape)', () => {
    const obj = { id: 'sam_dock', triggerOnInteract: [{ type: 'confirm_action', onConfirm: [{ type: 'remove_item' }, grant('sam_pc')] }] };
    assert.equal(sessionGrantPc(obj), 'sam_pc');
});

test('sessionGrantPc finds a top level grant and nested confirms', () => {
    assert.equal(sessionGrantPc({ triggerOnInteract: [grant('a')] }), 'a');
    const nested = { triggerOnInteract: [{ type: 'confirm_action', onConfirm: [{ type: 'confirm_action', onConfirm: [grant('deep')] }] }] };
    assert.equal(sessionGrantPc(nested), 'deep');
});

test('sessionGrantPc answers the first of two PCs, depth-first in list order', () => {
    assert.equal(sessionGrantPc({ triggerOnInteract: [grant('first'), grant('second')] }), 'first');
    const o = { triggerOnInteract: [{ type: 'confirm_action', onConfirm: [grant('inner')] }, grant('outer')] };
    assert.equal(sessionGrantPc(o), 'inner');
});

test('a grant with a condition counts', () => {
    assert.equal(sessionGrantPc({ triggerOnInteract: [grant('c', { condition: { hasItem: 'x' } })] }), 'c');
});

test('sessionGrantPc is null with no needsSession grant or odd input', () => {
    assert.equal(sessionGrantPc({ triggerOnInteract: [{ type: 'grant_foothold', pc: 'd' }] }), null);
    assert.equal(sessionGrantPc({ triggerOnInteract: [{ type: 'set_variable' }] }), null);
    assert.equal(sessionGrantPc({}), null);
    assert.equal(sessionGrantPc(null), null);
    assert.equal(sessionGrantPc({ triggerOnInteract: 'x' }), null);
});

test('a needsSession grant with no usable pc is skipped, as the validator skips it', () => {
    assert.equal(sessionGrantPc({ triggerOnInteract: [{ type: 'grant_foothold', needsSession: true }, grant('x')] }), 'x');
    assert.equal(sessionGrantPc({ triggerOnInteract: [grant('  '), grant('y')] }), 'y');
    assert.equal(sessionGrantPc({ triggerOnInteract: [grant(7), grant('z')] }), 'z');
});

test('gatedRemove is true only for a governed object whose policy refuses the class', () => {
    assert.equal(gatedRemove(stick, governed, scenario), true);
    assert.equal(gatedRemove(badusb, governed, scenario), true);
    const store = { id: 'pc2', workstation: true, policy: 'store' };
    assert.equal(gatedRemove(stick, store, scenario), true);
    assert.equal(gatedRemove(badusb, store, scenario), false);
});

test('gatedRemove is false for an ungoverned object and an item with no usbClass', () => {
    assert.equal(gatedRemove(stick, { id: 'wall_port' }, scenario), false);
    assert.equal(gatedRemove({ scenarioData: {} }, governed, scenario), false);
    assert.equal(gatedRemove({ id: 'note' }, governed, scenario), false);
});

test('the frozen export holds the new functions', () => {
    assert.equal(pcPolicy.sessionGrantPc, sessionGrantPc);
    assert.equal(pcPolicy.gatedRemove, gatedRemove);
    assert.ok(Object.isFrozen(pcPolicy));
});
