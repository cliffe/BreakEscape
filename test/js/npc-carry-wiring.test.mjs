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

function setup() {
    const calls = { carry: [], putDown: [], consume: [], remove: [] };
    const sprite = makeSprite('office_mugs', 'office');
    const rec = { id: 'grace', itemsHeld: [] };
    const graceBehaviour = { sprite: { body: { center: { x: 50, y: 60 } }, destroyed: false }, roomId: 'office' };
    global.window = {
        gameScenario: { officeVisuals: false },
        rooms: { office: { objects: { office_mugs: sprite } }, kitchen: { objects: {} } },
        npcManager: { getNPC: (id) => (id === 'grace' ? rec : null) },
        npcBehaviorManager: { getBehavior: (id) => (id === 'grace' ? graceBehaviour : null) },
        eventDispatcher: { emit() {} },
        RoomStateSync: {
            carryObject: (npcId, itemId, fromRoom) => { calls.carry.push({ npcId, itemId, fromRoom }); return Promise.resolve(true); },
            putDownObject: (npcId, itemId, toRoom, position) => { calls.putDown.push({ npcId, itemId, toRoom, position }); return Promise.resolve(true); },
            consumeCarried: (npcId, itemId, npcRoom) => { calls.consume.push({ npcId, itemId, npcRoom }); return Promise.resolve(true); },
            removeItemFromRoom: (roomId, itemId) => { calls.remove.push({ roomId, itemId }); return Promise.resolve(true); }
        }
    };
    return { world: createEngineWorld(), calls, sprite, rec };
}

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
