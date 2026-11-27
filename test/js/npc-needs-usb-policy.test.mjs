// The USB policy in the needs system (access slice 9.2 sub-slice U): an NPC carrying a device to
// a PC whose policy refuses its class. Spec: ACCESS_MODEL_SLICE_9_2_PLAN.md section 7.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NPCNeedsSystem } from '../../public/break_escape/js/systems/npc-needs.js';
import { makeWorld } from './fixtures/needs-stub-world.mjs';

// dropHeld puts the item back where the NPC stands (the live adapter does the same)
function world(cfg) {
    const w = makeWorld(cfg);
    w.world.dropHeld = (npcId, itemId) => {
        w.calls.dropped.push({ npcId, itemId });
        const o = w.objs.find(x => x.id === itemId);
        const p = w.pos[npcId];
        if (o) { o.roomId = 'office'; o.x = p.x; o.y = p.y; }
    };
    return w;
}

function setup({ lenaPolicy = 'storage_blocked', kiosk = true, usbClass = 'storage', chatter } = {}) {
    const cfg = {
        npcs: {
            lena: { pos: { x: 100, y: 100 }, rec: { id: 'lena', needsHome: 'lena_pc', interests: { dev_usb: { weight: 2 } }, ...(chatter ? {} : {}) } }
        },
        objects: [
            { id: 'lena_pc', x: 100, y: 68, affordance: { accepts: ['dev_usb'], useSeconds: 5 }, usbPolicy: lenaPolicy },
            ...(kiosk ? [{ id: 'kiosk_pc', x: 300, y: 68, affordance: { accepts: ['dev_usb'], useSeconds: 5 }, usbPolicy: 'allowed' }] : [])
        ]
    };
    const w = world(cfg);
    if (chatter) w.world.chatterConfig = () => chatter;
    const sys = new NPCNeedsSystem(w.world, { seed: 'usb', manualClock: true });
    w.attach(sys);
    sys.registerAll();
    sys.step(2000);
    const item = { id: 'kit_usb', x: 150, y: 150, roomId: 'office', pickable: true, needsTag: 'dev_usb' };
    if (usbClass) item.usbClass = usbClass;
    w.objs.push(item);
    return { sys, w };
}

const named = (w, prefix) => w.calls.emits.filter(e => e.name.startsWith(prefix));

test('storage refused at a managed PC (no npc_used), then delivered to a permitted one', () => {
    const { sys, w } = setup();
    sys.step(30000);
    const refused = named(w, 'npc_use_refused:');
    assert.equal(refused.length, 1);
    assert.equal(refused[0].name, 'npc_use_refused:lena_pc');
    assert.deepEqual(refused[0].data, { npcId: 'lena', objectId: 'lena_pc', itemId: 'kit_usb', tag: 'dev_usb', usbClass: 'storage' });
    assert.equal(named(w, 'npc_used:lena_pc').length, 0);
    const used = named(w, 'npc_used:kiosk_pc');
    assert.equal(used.length, 1);
    assert.equal(used[0].data.itemId, 'kit_usb');
    assert.deepEqual(w.calls.consumed, [{ npcId: 'lena', itemId: 'kit_usb' }]);
    const log = sys.getLog().filter(e => e.npc === 'lena').map(e => e.ev);
    assert.ok(log.indexOf('use_refused') < log.indexOf('retarget'));
    assert.ok(log.indexOf('retarget') < log.indexOf('used'));
    // she left her post for the kiosk (a real leave) and came back
    assert.ok(named(w, 'npc_left_post:lena').some(e => e.data.targetId === 'kiosk_pc'));
});

test('with nowhere else, the device is put down and not picked up again', () => {
    const { sys, w } = setup({ lenaPolicy: 'blocked', kiosk: false });
    sys.step(60000);
    assert.equal(named(w, 'npc_use_refused:lena_pc').length, 1);
    assert.deepEqual(w.calls.dropped, [{ npcId: 'lena', itemId: 'kit_usb' }]);
    assert.equal(w.calls.consumed.length, 0);
    assert.equal(named(w, 'npc_used:').length, 0);
    const item = w.objs.find(o => o.id === 'kit_usb');
    assert.equal(item.roomId, 'office');
    assert.equal(sys.getLog().filter(e => e.npc === 'lena' && e.ev === 'picked_up').length, 1, 'picked up once only');
    assert.equal(sys.getState('lena').job, null);
});

test('a hid item is accepted under storage_blocked and refused under blocked', () => {
    let { sys, w } = setup({ usbClass: 'hid' });
    sys.step(30000);
    assert.equal(named(w, 'npc_use_refused:').length, 0);
    assert.equal(named(w, 'npc_used:lena_pc').length, 1);
    ({ sys, w } = setup({ usbClass: 'hid', lenaPolicy: 'blocked' }));
    sys.step(30000);
    assert.equal(named(w, 'npc_use_refused:lena_pc').length, 1);
    assert.equal(named(w, 'npc_used:kiosk_pc').length, 1);
});

test('an item with no usbClass is never refused', () => {
    const { sys, w } = setup({ usbClass: null, lenaPolicy: 'blocked' });
    sys.step(30000);
    assert.equal(named(w, 'npc_use_refused:').length, 0);
    assert.equal(named(w, 'npc_used:lena_pc').length, 1);
});

test('an ungoverned tray (usbPolicy null) under a blocking default accepts', () => {
    const { sys, w } = setup({ lenaPolicy: null, kiosk: false });
    sys.step(30000);
    assert.equal(named(w, 'npc_use_refused:').length, 0);
    assert.equal(named(w, 'npc_used:lena_pc').length, 1);
});

test('the mutter: a usb_refused line for its time, seeded; the picture without one', () => {
    const chatter = { usb_refused: ["USB's disabled. Typical.", 'Not this again.'] };
    const runOnce = () => {
        const { sys, w } = setup({ chatter });
        let seen = null;
        for (let i = 0; i < 120 && !seen; i++) { sys.step(250); const t = sys.getState('lena').talking; if (t && t.topic === 'usb_refused') seen = { ...t, at: sys.clockMs }; }
        return seen;
    };
    const a = runOnce(), b = runOnce();
    assert.ok(a, 'the mutter shows');
    assert.ok(chatter.usb_refused.includes(a.line));
    assert.equal(a.line, b.line, 'seeded');
    // no line: the barrier picture (user decision q27)
    const { sys } = setup();
    let pic = null;
    for (let i = 0; i < 120 && !pic; i++) { sys.step(250); const t = sys.getState('lena').talking; if (t && t.topic === 'usb_refused') pic = t; }
    assert.ok(pic);
    assert.equal(pic.picture, 'barrier');
});

test('mutter(npcId, topic) is public and ignores the chatter cooldown', () => {
    const chatter = { usb_refused: ['One.'], work_fail: ['Two.'] };
    const { sys } = setup({ chatter, kiosk: false, lenaPolicy: null });
    assert.equal(sys.mutter('lena', 'work_fail'), true);
    assert.equal(sys.getState('lena').talking.line, 'Two.');
    sys.step(6500);   // past the first line's bubble (a mutter stays up at least MUTTER_BUBBLE_MS)
    assert.equal(sys.mutter('lena', 'usb_refused'), true);
    assert.equal(sys.getState('lena').talking.line, 'One.');
    assert.equal(sys.mutter('nobody', 'work_fail'), false);
});
