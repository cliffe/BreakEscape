// What the real server sends about a second step, and what the real client does with it (S8c unit 27).
//
// The room data in test/js/fixtures/lock_step_room_payloads.json is a CAPTURE of the real server code
// for scenarios/test_ops_lock_step (GET scenario, GET room/office, POST unlock, GET container, run by a
// throwaway Rails integration test against Game#filtered_scenario_for_bootstrap and #filtered_room_data).
// A gated object carries `secondStep: { kind, owner }` as authored; a gated room carries it in the bootstrap;
// neither carries `contents` or `roomData` before the step is passed. This file runs a gated object and a
// gated door in exactly that shape through the real unlock-system.js, doors.js, api-client.js, lock-step.js,
// the pane and mfa-client.js, with only the network stubbed from the shared answer fixture.
// Run with: bin/test-js test/js/lock-step-room-payload.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAnswer } from './helpers/lock-step-answers.mjs';
import { buildStack, makeNetwork, settle, quickTimers, bootPage, payloads, deep } from './helpers/lock-step-real-stack.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const S = await buildStack();
const net = makeNetwork();
quickTimers();

const GATED_OBJECTS = { moira_pc: ['push', 'moira'], moira_locker: ['push', 'moira'], priya_safe: ['code', 'priya'], dana_cabinet: ['push_number_match', 'dana'] };
const GATED_ROOMS = { records_room: ['push', 'moira'], plant_room: ['push', 'moira'] };

// ---- the shape of what the server sends ------------------------------------------------------
test('the capture: every gated object in the room payload carries secondStep { kind, owner } and no contents', () => {
    const objects = payloads.startRoom.objects;
    for (const [id, [kind, owner]] of Object.entries(GATED_OBJECTS)) {
        const o = objects.find((x) => x.id === id);
        assert.deepEqual(o.secondStep, { kind, owner }, id);
        assert.deepEqual(Object.keys(o.secondStep).sort(), ['kind', 'owner']);
        assert.equal(o.locked, true);
        assert.equal('contents' in o, false, `${id}: contents stay behind the step`);
        assert.equal(o.hasContents, true, `${id}: still treated as a container`);
    }
    const ungated = objects.filter((o) => !GATED_OBJECTS[o.id]);
    assert.ok(ungated.length > 3);
    for (const o of ungated) assert.equal('secondStep' in o, false, `${o.id} is not gated`);
    // a gated object an NPC carries rides on the NPC's held item
    const briefcase = payloads.startRoom.npcs.find((n) => n.id === 'gordon').itemsHeld.find((i) => i.id === 'gordon_briefcase');
    assert.deepEqual(briefcase.secondStep, { kind: 'push', owner: 'gordon' });
});

test('the capture: the bootstrap carries secondStep { kind, owner } on gated rooms only, and no npcStepOpener until an NPC opens one', () => {
    const rooms = payloads.bootstrapRooms;
    for (const [id, [kind, owner]] of Object.entries(GATED_ROOMS)) {
        assert.deepEqual(rooms[id].secondStep, { kind, owner }, id);
        assert.equal(rooms[id].locked, true);
        assert.equal('npcStepOpener' in rooms[id], false);
        assert.equal('roomData' in rooms[id] || 'objects' in rooms[id], false, `${id}: nothing of the room before it opens`);
    }
    assert.equal('secondStep' in rooms.office, false);
    assert.equal(payloads.lockedRoomGet.status, 403, 'GET room/<gated room> is refused until it is open');
});

test('the capture: the gate answer, the open answer and the container answer', () => {
    const gate = payloads.gateMoiraPc;
    assert.deepEqual(Object.keys(gate).sort(), ['kind', 'npcId', 'secondStep', 'success', 'targetId', 'targetType']);
    assert.equal(gate.success, false);
    assert.equal(gate.secondStep, true);
    assert.equal(gate.npcId, 'moira');
    // the same keys as the shared fixture's gate (the fixture is what the client tests run on)
    assert.deepEqual(Object.keys(gate).sort(), Object.keys(loadAnswer('gate_push').body).sort());
    // a gated object nested in a container keeps its step in both the open answer and the container answer
    for (const list of [payloads.openedMoiraPc.contents, payloads.containerMoiraPc.contents]) {
        const zip = list.find((c) => c.id === 'audit_zip');
        assert.deepEqual(zip.secondStep, { kind: 'push_number_match', owner: 'gordon' });
        assert.equal('contents' in zip, false);
    }
});

// ---- a gated object, from the payload, through the real unlock path ---------------------------
test('getLockRequirementsForItem reads secondStep off the payload object; an ungated object gets null', () => {
    const gated = { scenarioData: deep(payloads.startRoom.objects.find((o) => o.id === 'moira_locker')) };
    assert.deepEqual(S.unlockSystem.getLockRequirementsForItem(gated).secondStep, { kind: 'push', owner: 'moira' });
    const plain = { scenarioData: deep(payloads.startRoom.objects.find((o) => o.id === 'courier_box')) };
    assert.equal(S.unlockSystem.getLockRequirementsForItem(plain).secondStep, null);
});

test('a payload object that is gated holds its success wording back until the final answer', async () => {
    // a key lock takes the key route, whose starter would toast "unlocked" the moment the key turns
    const log = bootPage(S);
    net.reset({ '/unlock': ['gate_push', 'open_object'], '/mfa/prompt': ['prompt_waiting'] });
    const o = { scenarioData: deep(payloads.startRoom.objects.find((x) => x.id === 'moira_locker')), objectId: 'moira_locker', layer: 'L' };
    window.handleUnlock(o, 'item');
    await settle();
    for (const d of '1234') window.MinigameFramework.currentMinigame.handleNumberInput(d);
    await settle(20);
    assert.equal(paneState().open, true);
    assert.deepEqual(log.toasts, [], 'nothing toasts while the second step is pending');
    assert.equal(log.events.length, 0);
});
const paneState = () => window.__test.lockStep.state();

// ---- gated doors, from the bootstrap, through the real doors.js --------------------------------
const fakeSprite = (x, y) => {
    const s = {
        x, y, active: true, destroyed: false,
        setFrame() { return s; }, setFlipX() { return s; }, setOrigin() { return s; }, setDepth() { return s; },
        setAlpha() { return s; }, setVisible() { return s; }, setActive(v) { s.active = v; return s; },
        play() { return s; }, setPosition() { return s; }, fillStyle() { return s; }, fillRect() { return s; },
        on() { return s; }, once() { return s; },
        destroy() { s.destroyed = true; }
    };
    return s;
};
function installPhaser() {
    globalThis.Phaser = { Math: { Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) } } };
    const game = {
        add: {
            sprite: (x, y) => fakeSprite(x, y),
            graphics: () => fakeSprite(0, 0),
            zone: (x, y) => Object.assign(fakeSprite(x, y), { setInteractive() { return this; } })
        },
        physics: { add: { existing: (s) => { s.body = { enable: true, setSize() {}, setOffset() {}, setImmovable() {} }; }, collider() {} } },
        cache: { tilemap: { get: () => null } }
    };
    window.game = { scene: { isActive: () => true } };
    // the room loader: the connected room exists, with no doors of its own to swap
    window.loadRoom = async (id) => { window.rooms[id] = { doorSprites: [] }; };
    window.roomPositions = { office: { x: 0, y: 0 }, records_room: { x: 0, y: -288 }, plant_room: { x: 320, y: 0 } };
    const dim = { widthTiles: 10, heightTiles: 9, widthPx: 320, heightPx: 288 };
    window.roomDimensions = { office: dim, records_room: dim, plant_room: dim };
    S.doors.initializeDoors(game, window.rooms);
    return game;
}
function officeDoors(npcStepOpener = null) {
    const log = bootPage(S);
    installPhaser();
    if (npcStepOpener) window.gameScenario.rooms.plant_room.npcStepOpener = npcStepOpener;
    const sprites = S.doors.createDoorSpritesForRoom('office', window.roomPositions.office);
    window.rooms.office = { doorSprites: sprites };
    const byRoom = (id) => sprites.find((s) => s.doorProperties.connectedRoom === id);
    return { log, sprites, byRoom };
}
const nearPlayerAt = (s) => { window.player = { x: s.x, y: s.y }; };

test('doors.js copies secondStep from the bootstrap room onto the door, and npcStepOpener only when the room carries it', () => {
    const { sprites, byRoom } = officeDoors();
    assert.equal(sprites.length, 2);
    for (const [id, [kind, owner]] of Object.entries(GATED_ROOMS)) {
        const p = byRoom(id).doorProperties;
        assert.deepEqual(p.secondStep, { kind, owner }, id);
        assert.equal(p.npcStepOpener, null);
        assert.equal(p.locked, true);
    }
    assert.deepEqual(byRoom('records_room').doorProperties.requires, ['RECORDS-01']);
    // the door back from a gated room carries nothing
    const back = S.doors.createDoorSpritesForRoom('plant_room', window.roomPositions.plant_room);
    assert.equal(back[0].doorProperties.secondStep, null);
    // and the opener rides in when an NPC has opened it
    const withOpener = officeDoors('moira');
    assert.equal(withOpener.byRoom('plant_room').doorProperties.npcStepOpener, 'moira');
    assert.equal(withOpener.byRoom('records_room').doorProperties.npcStepOpener, null);
});

test('a gated rfid door with the card held: the click posts, the pane opens, the owner approves, the door opens once with one "Access Granted"', async () => {
    const { log, byRoom } = officeDoors();
    window.inventory.items.push({ scenarioData: deep(payloads.startRoom.objects.find((o) => o.id === 'records_card')) });
    const door = byRoom('records_room');
    nearPlayerAt(door);
    net.reset({
        '/unlock': [{ name: 'gate_door_npc', patch: (b) => { delete b.opener; } }, 'open_door'],
        '/mfa/prompt': ['prompt_passed']
    });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    const unlocks = net.posted('/unlock');
    assert.equal(unlocks.length, 2);
    assert.equal(unlocks[0].body.targetType, 'door');
    assert.equal(unlocks[0].body.targetId, 'records_room');
    assert.equal(unlocks[0].body.method, 'rfid');
    assert.deepEqual(unlocks[1].body, unlocks[0].body);
    assert.deepEqual(net.posted('/mfa/prompt').map((p) => p.body), [{ target_type: 'door', target_id: 'records_room' }]);
    assert.equal(door.doorProperties.locked, false);
    assert.equal(door.destroyed, true, 'the door opened');
    assert.equal(log.toasts.filter((t) => t[2] === 'Access Granted').length, 1);
    assert.equal(log.events.filter(([n]) => n === 'door_unlocked').length, 1);
    assert.equal(log.toasts.some((t) => t[0] === 'Not approved.'), false);
});

test('a gated rfid door: a denied step opens nothing and says nothing but "Not approved."; no sound of release, no "Access Granted"', async () => {
    const { log, byRoom } = officeDoors();
    window.inventory.items.push({ scenarioData: deep(payloads.startRoom.objects.find((o) => o.id === 'records_card')) });
    const door = byRoom('records_room');
    nearPlayerAt(door);
    net.reset({ '/unlock': [{ name: 'gate_door_npc', patch: (b) => { delete b.opener; } }], '/mfa/prompt': ['prompt_expired'] });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    assert.equal(door.doorProperties.locked, true);
    assert.equal(door.destroyed, false);
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
    assert.equal(log.toasts.some((t) => t[2] === 'Access Granted'), false);
    assert.equal(log.sounds.includes('door_release'), false);
    assert.equal(log.events.some(([n]) => n === 'door_unlocked'), false);
});

test('a door an NPC opened (npcStepOpener on the room): the click retries with the npc method, the pane opens, the pass opens the door', async () => {
    const { log, byRoom } = officeDoors('moira');
    const door = byRoom('plant_room');
    nearPlayerAt(door);
    net.reset({
        '/unlock': [{ name: 'gate_door_npc', patch: (b) => { b.targetId = 'plant_room'; } }, 'open_door'],
        '/mfa/prompt': ['prompt_passed']
    });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    const unlocks = net.posted('/unlock');
    assert.equal(unlocks.length, 2);
    assert.deepEqual(unlocks[0].body, { targetType: 'door', targetId: 'plant_room', attempt: 'moira', method: 'npc' });
    assert.deepEqual(unlocks[1].body, unlocks[0].body);
    assert.equal(door.doorProperties.locked, false);
    assert.equal(log.events.filter(([n]) => n === 'door_unlocked_by_npc').length, 1);
    assert.deepEqual(log.events.find(([n]) => n === 'door_unlocked_by_npc')[1], { roomId: 'plant_room', npcId: 'moira', source: 'npc', retry: true });
});

test('a door an NPC opened, denied: one "Not approved." and the door stays locked', async () => {
    const { log, byRoom } = officeDoors('moira');
    const door = byRoom('plant_room');
    nearPlayerAt(door);
    net.reset({ '/unlock': [{ name: 'gate_door_npc', patch: (b) => { b.targetId = 'plant_room'; } }], '/mfa/prompt': ['prompt_expired'] });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    assert.equal(door.doorProperties.locked, true);
    assert.equal(log.toasts.filter((t) => t[0] === 'Not approved.').length, 1);
    assert.equal(log.toasts.some((t) => t[0] === 'Access denied'), false);
});

// S8c playtest 12d: after a reload the door opens at once from an approval the server kept (no gate, no pane):
// the client says what happened instead of opening silently
test('a door an NPC opened, approved earlier (the server answers open at once, no pane): one toast says so', async () => {
    const { log, byRoom } = officeDoors('moira');
    const door = byRoom('plant_room');
    nearPlayerAt(door);
    net.reset({ '/unlock': ['open_door'] });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    assert.equal(net.posted('/unlock').length, 1);
    assert.equal(door.doorProperties.locked, false);
    const said = log.toasts.filter((t) => /approved earlier/i.test(t[0]));
    assert.equal(said.length, 1);
    assert.equal(window.__test.lockStep.state().open, false, 'no pane');
});

test('a door an NPC opened and approved in a pane this click: no "approved earlier" toast', async () => {
    const { log, byRoom } = officeDoors('moira');
    const door = byRoom('plant_room');
    nearPlayerAt(door);
    net.reset({
        '/unlock': [{ name: 'gate_door_npc', patch: (b) => { b.targetId = 'plant_room'; } }, 'open_door'],
        '/mfa/prompt': ['prompt_passed']
    });
    await S.doors.handleDoorInteraction(door);
    await settle(20);
    assert.equal(door.doorProperties.locked, false);
    assert.equal(log.toasts.some((t) => /approved earlier/i.test(t[0])), false);
});
