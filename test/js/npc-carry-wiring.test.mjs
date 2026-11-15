// NPC carried items slice B: the live engine world (createEngineWorld) calls the
// new server actions, never the old client-named remove_object. pickUp records the
// item in the NPC's itemsHeld and calls carryObject; consumeHeld calls
// consumeCarried; dropHeld and placeHeld call putDownObject. No carry path calls
// removeItemFromRoom (the call that 422'd). Run: node --test test/js/npc-carry-wiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';

function makeSprite(id, roomId) {
    return {
        objectId: id,
        scenarioData: { id, type: 'dirty_mugs1', name: 'Abandoned Mugs', needsTag: 'dirty_mugs' },
        x: 100, y: 100, displayWidth: 16, displayHeight: 16, visible: true, active: true,
        body: { enable: true, center: { x: 108, y: 108 } },
        roomId,
        setVisible() {}, setInteractive() {}, disableInteractive() {}, setDepth() {}, destroy() { this.destroyed = true; }
    };
}

function makeSlotSprite(id, roomId) {
    const sp = makeSprite(id, roomId);
    sp.scenarioData = { id, type: 'printout', name: 'Copier Output', outputOf: 'copier', revealOnGlobal: 'copier_run', needsTag: 'copier_out' };
    sp.revealOnGlobal = 'copier_run';
    return sp;
}

function setup(opts = {}) {
    const calls = { carry: [], putDown: [], consume: [], remove: [], koDrop: [] };
    const sprite = makeSprite('office_mugs', 'office');
    const slot = makeSlotSprite('copier_out_a', 'office');
    const rec = { id: 'grace', itemsHeld: [] };
    const graceBehaviour = { sprite: { body: { center: { x: 50, y: 60 } }, destroyed: false }, roomId: 'office' };
    const ok = (v) => Promise.resolve(opts.refuse ? false : (v === undefined ? true : v));
    global.window = {
        gameScenario: { officeVisuals: false },
        rooms: { office: { objects: { office_mugs: sprite, copier_out_a: slot } }, kitchen: { objects: {} } },
        npcManager: { getNPC: (id) => (id === 'grace' ? rec : null) },
        npcBehaviorManager: { getBehavior: (id) => (id === 'grace' ? graceBehaviour : null) },
        eventDispatcher: { emit() {} },
        RoomStateSync: {
            carryObject: (npcId, itemId, fromRoom) => { calls.carry.push({ npcId, itemId, fromRoom }); return ok(); },
            putDownObject: (npcId, itemId, toRoom, position) => { calls.putDown.push({ npcId, itemId, toRoom, position }); return ok(); },
            consumeCarried: (npcId, itemId, npcRoom) => { calls.consume.push({ npcId, itemId, npcRoom }); return ok(); },
            koDropObject: (npcId, itemId, koRoom, position) => { calls.koDrop.push({ npcId, itemId, koRoom, position }); return ok(); },
            removeItemFromRoom: (roomId, itemId) => { calls.remove.push({ roomId, itemId }); return Promise.resolve(true); }
        }
    };
    return { world: createEngineWorld(), calls, sprite, slot, rec };
}

const flush = () => new Promise(r => setTimeout(r, 0));

test('pickUp records the item in the NPC itemsHeld, removes it from the origin room, and calls carryObject', () => {
    const { world, calls, rec } = setup();
    const ok = world.pickUp('grace', 'office_mugs');
    assert.equal(ok, true);
    assert.equal(window.rooms.office.objects.office_mugs, undefined, 'sprite left the origin room objects');
    assert.ok(rec.itemsHeld.some(i => i.id === 'office_mugs' && i._needsCarried), 'recorded as a held item');
    assert.deepEqual(calls.carry, [{ npcId: 'grace', itemId: 'office_mugs', fromRoom: 'office' }]);
    assert.equal(calls.remove.length, 0, 'never the old remove_object call');
});

test('consumeHeld calls consumeCarried with the NPC room and never removeItemFromRoom', () => {
    const { world, calls, rec } = setup();
    world.pickUp('grace', 'office_mugs');
    world.consumeHeld('grace', 'office_mugs');
    assert.deepEqual(calls.consume, [{ npcId: 'grace', itemId: 'office_mugs', npcRoom: 'office' }]);
    assert.equal(calls.remove.length, 0, 'the 422 call is gone');
    assert.ok(!rec.itemsHeld.some(i => i.id === 'office_mugs'), 'held record cleared');
    assert.ok(!rec._needsCarried || !rec._needsCarried.office_mugs, 'carry cleared');
});

test('dropHeld calls putDownObject with the NPC, item, room and world position', () => {
    const { world, calls, rec } = setup();
    world.pickUp('grace', 'office_mugs');
    world.dropHeld('grace', 'office_mugs');
    assert.equal(calls.putDown.length, 1);
    const c = calls.putDown[0];
    assert.equal(c.npcId, 'grace');
    assert.equal(c.itemId, 'office_mugs');
    assert.equal(c.toRoom, 'office');
    assert.deepEqual(c.position, { px: 50, py: 60 }, 'the NPC body centre, not a client-named room');
    assert.ok(!rec.itemsHeld.some(i => i.id === 'office_mugs'), 'held record cleared');
});

test('placeHeld calls putDownObject into the target room and clears the held record', () => {
    const { world, calls, rec } = setup();
    world.pickUp('grace', 'office_mugs');
    const target = { id: 'tray', roomId: 'kitchen', x: 200, y: 200, affordance: { placeAt: { dx: 0, dy: 0 } } };
    const placed = world.placeHeld('grace', 'office_mugs', target);
    assert.equal(placed, true);
    assert.equal(calls.putDown.length, 1);
    assert.equal(calls.putDown[0].toRoom, 'kitchen');
    assert.equal(calls.putDown[0].itemId, 'office_mugs');
    assert.ok(!rec.itemsHeld.some(i => i.id === 'office_mugs'), 'held record cleared');
});

test('the NPC holds nothing: consumeHeld and dropHeld are no-ops with no server call', () => {
    const { world, calls } = setup();
    world.consumeHeld('grace', 'office_mugs');
    world.dropHeld('grace', 'office_mugs');
    assert.equal(calls.consume.length, 0);
    assert.equal(calls.putDown.length, 0);
    assert.equal(calls.remove.length, 0);
});

// review R1 m5: a reveal slot (copier output) keeps its client-only flow. pickUp must
// not mirror it into itemsHeld nor send a server carry, so no 422 is logged for it.
test('pickUp of a reveal slot does not mirror itemsHeld and sends no server carry', () => {
    const { world, calls, rec } = setup();
    const ok = world.pickUp('grace', 'copier_out_a');
    assert.equal(ok, true, 'the slot is still carried client-side');
    assert.equal(window.rooms.office.objects.copier_out_a, undefined, 'slot left the origin room objects');
    assert.ok(!rec.itemsHeld.some(i => i.id === 'copier_out_a'), 'slot not mirrored into itemsHeld');
    assert.equal(calls.carry.length, 0, 'no server carry_object for a reveal slot');
    assert.ok(rec._needsCarried && rec._needsCarried.copier_out_a, 'still tracked for a later place/stow');
});

// review R1 m2: on a server refusal the client must reconcile, not diverge. A refused
// carry restores the object to its origin room; a refused consume reinstates the held record.
test('a refused carry restores the object to its origin room', async () => {
    const { world, calls, rec } = setup({ refuse: true });
    world.pickUp('grace', 'office_mugs');
    assert.equal(calls.carry.length, 1);
    await flush();
    assert.ok(window.rooms.office.objects.office_mugs, 'object restored to the origin room');
    assert.ok(!rec.itemsHeld.some(i => i.id === 'office_mugs'), 'held record cleared');
    assert.ok(!rec._needsCarried || !rec._needsCarried.office_mugs, 'carry state cleared');
});

test('a refused consume reinstates the held record', async () => {
    const { world, rec } = setup({ refuse: true });
    // pickUp's carry is refused too, but drive consume directly after seeding a carry record.
    rec._needsCarried = { office_mugs: { sprite: { scenarioData: { type: 'dirty_mugs1', name: 'Mug' }, destroy() {} }, roomId: 'office', key: 'office_mugs' } };
    rec.itemsHeld = [{ id: 'office_mugs', type: 'dirty_mugs1', name: 'Mug', _needsCarried: true }];
    world.consumeHeld('grace', 'office_mugs');
    await flush();
    assert.ok(rec.itemsHeld.some(i => i.id === 'office_mugs'), 'held record reinstated after a refused consume');
});

// review R1 M1: KO while carrying drops the carried item into the KO room once and
// clears the carry (calls ko_drop_carried, not the generic npc_defeated add).
test('koDropCarried drops the carried item into the KO room and clears the hand', async () => {
    const { world, calls, rec, sprite } = setup();
    world.pickUp('grace', 'office_mugs');
    assert.ok(rec.itemsHeld.some(i => i.id === 'office_mugs'), 'carried before KO');
    const dropped = world.koDropCarried('grace', 'kitchen', { x: 40, y: 50 });
    assert.deepEqual(dropped, ['office_mugs']);
    assert.ok(!rec.itemsHeld.some(i => i.id === 'office_mugs'), 'no longer held after KO');
    assert.ok(!rec._needsCarried.office_mugs, 'carry state cleared');
    assert.equal(window.rooms.kitchen.objects.office_mugs, sprite, 'sprite registered in the KO room');
    await flush();
    assert.deepEqual(calls.koDrop, [{ npcId: 'grace', itemId: 'office_mugs', koRoom: 'kitchen', position: { px: 40, py: 50 } }]);
    assert.equal(calls.putDown.length, 0, 'not the put-down path');
});
