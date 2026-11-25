// S8c unit 22: doors and NPC callers. A door carries `secondStep` and `npcStepOpener` from its
// room; an NPC's door unlock (the bridge, the ink tag, the chat's own tag) runs the real
// lock-step.js and answers from the shared fixture (test/js/helpers/lock-step-answers.mjs).
// door_unlocked_by_npc fires exactly once per open; a cancel shows nothing and emits nothing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { loadAnswer } from './helpers/lock-step-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

globalThis.window = globalThis.window || globalThis;
const lockStep = await imp('systems/lock-step.js');
const { default: bridge, findAllDoorSpritesForRoom } = await imp('systems/npc-game-bridge.js');
const { processGameActionTags } = await imp('minigames/helpers/chat-helpers.js');
const { default: PersonChatConversation } = await imp('minigames/person-chat/person-chat-conversation.js');

const gate = () => loadAnswer('gate_door_npc').body;
const opened = () => loadAnswer('open_door').body;
const ROOM = gate().targetId;
const tick = () => new Promise((r) => setTimeout(r, 0));

// Sets up one world: a fake ApiClient.unlock that behaves as ApiClient does (a secondStep answer
// goes to window.lockStep.run), a pane that ends as told, and one door sprite for the room.
function world(outcome) {
    const events = [];
    const alerts = [];
    const posts = [];
    const sprite = { doorProperties: { connectedRoom: ROOM, locked: true } };
    window.rooms = { hall: { doorSprites: [sprite] } };
    window.eventDispatcher = { emit: (n, d) => events.push([n, d]) };
    window.gameAlert = (...a) => alerts.push(a);
    window.breakEscapeConfig = { gameId: 7 };
    window.unlockDoor = () => {};
    window.currentConversationNPCId = gate().npcId;
    lockStep.reset();
    lockStep.configure({
        mfa: { noteRequired() {} },
        post: async (path, body) => { posts.push([path, body]); return opened(); },
        nextClientTs: () => 1,
        applyServerWrites() {},
        openPane: () => ({ done: Promise.resolve(outcome), close() {} }),
        isClear: () => true,
        isOpenInClient: () => false,
        setTimer: (f) => f(),
        toast() {},
        rejectTone() {},
        writeOpener() {}
    });
    window.lockStep = lockStep;
    window.ApiClient = {
        async unlock(type, id, attempt, method) {
            const request = { targetType: type, targetId: id, attempt, method };
            const answer = gate();
            return window.lockStep.run(answer, request, {});
        }
    };
    return { events, alerts, posts, sprite };
}

test('findAllDoorSpritesForRoom finds the door sprites that lead to a room', () => {
    const w = world('passed');
    assert.deepEqual(findAllDoorSpritesForRoom(ROOM), [w.sprite]);
    assert.deepEqual(findAllDoorSpritesForRoom('nowhere'), []);
});

test('bridge: a passed step opens the door and emits door_unlocked_by_npc once', async () => {
    const w = world('passed');
    const result = await bridge.unlockDoor(ROOM);
    assert.equal(result.success, true);
    assert.equal(w.events.filter(([n]) => n === 'door_unlocked_by_npc').length, 1);
    assert.equal(w.sprite.doorProperties.locked, false);
    assert.equal(w.posts.length, 1);
});

for (const outcome of ['denied', 'expired', 'closed']) {
    test(`bridge: a ${outcome} step returns secondStepCancelled and emits nothing`, async () => {
        const w = world(outcome);
        const result = await bridge.unlockDoor(ROOM);
        assert.deepEqual(result, { success: false, secondStepCancelled: true, roomId: ROOM, npcId: gate().npcId });
        assert.equal(w.events.length, 0);
        assert.equal(w.sprite.doorProperties.locked, true);
    });
}

test('ink #unlock_door: a pass notifies once and fires the event once; a cancel shows nothing', async () => {
    for (const [outcome, notes, fired] of [['passed', 1, 1], ['denied', 0, 0], ['closed', 0, 0]]) {
        const w = world(outcome);
        const shown = [];
        await processGameActionTags([`unlock_door:${ROOM}`], { showNotification: (...a) => shown.push(a) });
        for (let i = 0; i < 5; i++) await tick();
        assert.equal(shown.length, notes, outcome);
        assert.equal(w.events.filter(([n]) => n === 'door_unlocked_by_npc').length, fired, outcome);
    }
});

test('chat handleUnlockDoor: a cancel shows no alert; a pass unlocks each sprite and emits no second event', async () => {
    for (const [outcome, alerts] of [['passed', 1], ['denied', 0], ['expired', 0], ['closed', 0]]) {
        const w = world(outcome);
        const conv = Object.create(PersonChatConversation.prototype);
        conv.npc = { id: gate().npcId };
        const updated = [];
        window.unlockDoor = (s) => updated.push(s);
        await conv.handleUnlockDoor(ROOM);
        assert.equal(w.alerts.length, alerts, outcome);
        assert.equal(updated.length, outcome === 'passed' ? 1 : 0, outcome);
        assert.equal(w.events.filter(([n]) => n === 'door_unlocked_by_npc').length, 0, outcome);
    }
});

test('a real refusal still shows as before', async () => {
    const w = world('passed');
    window.ApiClient = { unlock: async () => { throw new Error('boom'); } };
    const conv = Object.create(PersonChatConversation.prototype);
    conv.npc = { id: 'moira' };
    await conv.handleUnlockDoor(ROOM);
    assert.equal(w.alerts.length, 1);
    const result = await bridge.unlockDoor(ROOM);
    assert.equal(result.success, false);
    assert.equal(result.error, 'boom');
});

test('doorProperties copies secondStep and npcStepOpener from the room data', () => {
    const src = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    assert.match(src, /secondStep: lockProps\.secondStep \?\? connectedRoomData\?\.secondStep \?\? null/);
    assert.match(src, /npcStepOpener: lockProps\.npcStepOpener \?\? connectedRoomData\?\.npcStepOpener \?\? null/);
});
