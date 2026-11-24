// The pane's title in a real page (S8c R1-CLIENT2). The page never puts a room's objects on
// gameScenario.rooms[*].objects: the bootstrap rooms carry none, and core/rooms.js turns the fetched room
// into sprites in window.rooms[room].objects (a map, objectId -> sprite with scenarioData). So the name of an
// object lock comes from (1) the pad that is up (its lockable), (2) those sprites, walking their contents,
// (3) the tray. Here gameScenario holds the bootstrap only, as the page does.
// Run with: bin/test-js test/js/lock-step-pane-title.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStack, makeNetwork, settle, quickTimers, bootPage, payloads, deep } from './helpers/lock-step-real-stack.mjs';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const S = await buildStack();
const net = makeNetwork();
quickTimers();
const nameOf = (type, id) => S.wiring.lockName(window, { targetType: type, targetId: id });

test('the page holds no objects on gameScenario: the harness matches', () => {
    bootPage(S);
    for (const room of Object.values(window.gameScenario.rooms)) assert.equal('objects' in room, false);
    assert.ok(Object.keys(window.rooms.office.objects).includes('moira_pc'));
});

test('a room object is titled by its name from window.rooms, not "this lock"', () => {
    bootPage(S);
    const authored = (id) => payloads.startRoom.objects.find((o) => o.id === id).name;
    for (const id of ['moira_pc', 'moira_locker', 'priya_safe', 'dana_cabinet']) {
        assert.ok(authored(id), `${id} has a name in the payload`);
        assert.equal(nameOf('object', id), authored(id), id);
        assert.notEqual(nameOf('object', id), 'this lock');
    }
});

test('a door is titled by its door sign, and an unknown object is "this lock"', () => {
    bootPage(S);
    assert.equal(nameOf('door', 'records_room'), 'Records room');
    assert.equal(nameOf('object', 'no_such_thing'), 'this lock');
});

test('a nested object is titled by the pad that is up for it (audit_zip is inside moira_pc, in no room list)', () => {
    bootPage(S);
    const zip = loadAnswer('open_object').body.contents?.[0] || { id: 'audit_zip' };
    const lockable = { scenarioData: { id: 'audit_zip', type: 'zip', name: 'Audit archive', locked: true }, objectId: 'audit_zip' };
    window.MinigameFramework.currentMinigame = { params: { lockable } };
    assert.equal(nameOf('object', 'audit_zip'), 'Audit archive');
    window.MinigameFramework.currentMinigame = { params: { lockable: { scenarioData: { id: 'other', name: 'Other' } } } };
    assert.equal(nameOf('object', 'audit_zip'), 'this lock', 'a pad for another lock does not name this one');
    assert.ok(zip);
});

test('a nested object is found by walking the contents of a room sprite', () => {
    bootPage(S);
    const pc = window.rooms.office.objects.moira_pc;
    pc.scenarioData.contents = [{ id: 'inner_box', name: 'Inner box', contents: [{ id: 'deep_zip', name: 'Deep archive' }] }];
    assert.equal(nameOf('object', 'deep_zip'), 'Deep archive');
});

test('a held item is titled by its tray name', () => {
    bootPage(S, { inventory: { items: [{ scenarioData: { id: 'gordon_briefcase', name: "Gordon's briefcase" } }] } });
    assert.equal(nameOf('object', 'gordon_briefcase'), "Gordon's briefcase");
});

test('an object already open in a room is read as open (a queued request for it is dropped, not posted again)', () => {
    bootPage(S);
    assert.equal(S.wiring.isOpenInClient(window, 'object', 'moira_pc'), false);
    window.rooms.office.objects.moira_pc.scenarioData.locked = false;
    assert.equal(S.wiring.isOpenInClient(window, 'object', 'moira_pc'), true);
});

test('the real pane, opened over the real pad, carries the lock name in its title and its dialog label', async () => {
    bootPage(S);
    net.reset({ '/unlock': ['gate_push'], '/mfa/prompt': ['prompt_waiting'] });
    const sprite = { scenarioData: deep(payloads.startRoom.objects.find((o) => o.id === 'moira_locker')), objectId: 'moira_locker', layer: 'L' };
    window.handleUnlock(sprite, 'item');
    await settle();
    for (const d of '4821') window.MinigameFramework.currentMinigame.handleNumberInput(d);
    await settle(10);
    const st = window.__test.lockStep.state();
    assert.equal(st.title, sprite.scenarioData.name);
    assert.match(document.querySelector('.lock-step-layer')?.getAttribute('aria-label') || '', new RegExp(sprite.scenarioData.name));
});
