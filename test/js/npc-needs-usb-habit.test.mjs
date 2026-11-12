// The USB habit in the needs core (docs/achitechture/USB_HABIT_PLAN.md, user decision q39):
// every work.usb.every-th judged work use at the station copies to a stick; a station whose
// policy refuses storage fails the use with usb_refused. Stub world: fixtures/needs-work-world.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workWorld, dana, baseObjects } from './fixtures/needs-work-world.mjs';

const CHATTER = {
    usb_refused: ['IT blocked my USB. Email it is, then.'],
    work_fail: ['Why is nothing working?']
};

function stepUntil(sys, pred, maxMs = 120000) {
    for (let t = 0; t < maxMs; t += 250) { if (pred()) return true; sys.step(250); }
    return pred();
}

// Dana with one always-up resource, so only the habit can fail her; her PC under `usb`
function habitWorld({ usb = 'storage_blocked', every = 2, setGlobal = 'dana_emailed', chatter = CHATTER, habit = true } = {}) {
    const rec = dana();
    rec.work.needs = [{ id: 'email', kind: 'email', admitted: true }];
    if (habit) rec.work.usb = { every, ...(setGlobal ? { setGlobal } : {}) };
    const objects = baseObjects();
    objects[0].usbPolicy = usb;
    objects[0].affordance.restores = 30;
    return workWorld({ npcs: { dana: { pos: { x: 100, y: 100 }, rec } }, objects, chatter });
}

test('every second use is refused: usb_refused, the event, the global, the mutter and one fail report', () => {
    const { w, sys, evs, reports, log } = habitWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > 0, 60000), 'the first use is met');
    assert.equal(evs('npc_usb_refused:').length, 0);
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 120000), 'the second use fails');
    const failed = evs('npc_use_failed:dana')[0].data;
    assert.deepEqual(failed.missing, [{ id: 'dana_pc', why: 'usb_refused' }]);
    assert.equal(failed.station, false, 'the PC itself works');
    assert.deepEqual(evs('npc_usb_refused:dana').map(e => e.data), [{ npcId: 'dana', objectId: 'dana_pc' }]);
    assert.equal(w.calls.globals.dana_emailed, true, 'the workaround global');
    assert.equal(log('turned_back')[0].grumble, 'usb_refused');
    assert.equal(sys.getState('dana').talking.line, 'IT blocked my USB. Email it is, then.');
    assert.deepEqual(reports.filter(r => r.event === 'fail'),
        [{ npcId: 'dana', event: 'fail', need: 'work', objectId: 'dana_pc', missing: [{ id: 'dana_pc', why: 'usb_refused' }], rearmed: true }]);
});

test('after the refusal the next use is met and eases', () => {
    const { sys, evs, reports } = habitWorld();
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 180000));
    sys.applyFrustration([{ npcId: 'dana', level: 20, previous: 0, tell: 1, settled: false, run: null, pending: [], forEvent: 'fail' }]);
    const used = evs('npc_used:dana_pc').length;
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length > used, 180000), 'the third use is met');
    assert.ok(reports.some(r => r.event === 'ease' && r.objectId === 'dana_pc'));
});

test('every 1: the first use is refused; every 3: only the third', () => {
    const one = habitWorld({ every: 1 });
    one.sys.registerAll();
    assert.ok(stepUntil(one.sys, () => one.evs('npc_use_failed:dana').length > 0 || one.evs('npc_used:dana_pc').length > 0, 60000));
    assert.equal(one.evs('npc_used:dana_pc').length, 0);
    assert.equal(one.evs('npc_usb_refused:dana').length, 1);

    const three = habitWorld({ every: 3 });
    three.sys.registerAll();
    assert.ok(stepUntil(three.sys, () => three.evs('npc_use_failed:dana').length > 0, 400000));
    assert.equal(three.evs('npc_used:dana_pc').length, 2, 'two met uses before the refused one');
});

test('a PC that allows USB: npc_usb_copied, the use is met, nothing reported', () => {
    const { w, sys, evs, reports } = habitWorld({ usb: 'allowed' });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_usb_copied:dana').length > 0, 180000));
    assert.equal(evs('npc_use_failed:').length, 0);
    assert.equal(evs('npc_usb_refused:').length, 0);
    assert.equal(w.calls.globals.dana_emailed, undefined);
    assert.equal(reports.length, 0);
});

test('no usb block in the plan: no attempt at all', () => {
    const { sys, evs } = habitWorld({ habit: false });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => evs('npc_used:dana_pc').length >= 3, 400000));
    assert.equal(evs('npc_usb_refused:').length + evs('npc_usb_copied:').length, 0);
});

test('locked out at the station: the use fails with locked_out alone and the counter does not move', () => {
    const { sys, evs } = habitWorld({ every: 1 });
    sys.registerAll();
    sys.states.get('dana').lockedOut.add('dana_pc');
    assert.ok(stepUntil(sys, () => evs('npc_use_failed:dana').length > 0, 60000));
    assert.deepEqual(evs('npc_use_failed:dana')[0].data.missing, [{ id: 'dana_pc', why: 'locked_out' }]);
    assert.equal(evs('npc_usb_refused:').length, 0);
    assert.equal(sys.states.get('dana').usbUses, 0);
});

test('with no usb_refused line the mutter falls back to work_fail', () => {
    const { sys, log } = habitWorld({ every: 1, chatter: { work_fail: ['Why is nothing working?'] } });
    sys.registerAll();
    assert.ok(stepUntil(sys, () => log('turned_back').length > 0, 60000));
    assert.equal(log('turned_back')[0].grumble, 'work_fail', 'falls back to work_fail when it has a line');
});
