// Person-chat background precedence: explicit background > the conversation
// room's chatBackground (NPC's live room, its assigned room, the player's room)
// > none. Ink Background[...] lines run later and are not resolved here.
// Run with: node --test test/js/person-chat-background.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

// The public/ tree has no "type": "module", so load a .mjs copy (as person-chat-reopen.test.mjs does).
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/minigames/person-chat/person-chat-background.js');
const dir = mkdtempSync(join(tmpdir(), 'person-chat-background-'));
writeFileSync(join(dir, 'conditional-text.mjs'),
    readFileSync(join(here, '../../public/break_escape/js/utils/conditional-text.js'), 'utf8'));
writeFileSync(join(dir, 'background.mjs'), readFileSync(src, 'utf8')
    .replace("'../../utils/conditional-text.js'", "'./conditional-text.mjs'"));
const { resolvePersonChatBackground, conversationRoomIds, personChatBackgroundFor, pickRoomBackground } =
    await import(pathToFileURL(join(dir, 'background.mjs')).href);

const rooms = {
    lobby: { chatBackground: 'assets/backgrounds/rooms/lobby.png' },
    ward: { chatBackground: 'assets/backgrounds/rooms/ward.png' },
    store: {}   // no chatBackground
};

// A fake window: NPC `nurse` assigned to `npcRoom`, behaviour says `liveRoom`.
function fakeWindow({ liveRoom, npcRoom, playerRoom, scenarioRooms = rooms } = {}) {
    return {
        currentPlayerRoom: playerRoom,
        gameScenario: { rooms: scenarioRooms },
        npcManager: { getNPC: id => (id === 'nurse' ? { id, roomId: npcRoom } : null) },
        npcBehaviorManager: { getBehavior: id => (id === 'nurse' && liveRoom ? { roomId: liveRoom } : null) }
    };
}

test('an explicit background beats the room', () => {
    assert.equal(resolvePersonChatBackground({ explicit: 'assets/backgrounds/hq1.png', roomIds: ['lobby'], rooms }),
        'assets/backgrounds/hq1.png');
});

test('explicit "none" means no background, with no room fallback', () => {
    assert.equal(resolvePersonChatBackground({ explicit: 'none', roomIds: ['lobby'], rooms }), null);
    assert.equal(resolvePersonChatBackground({ explicit: ' None ', roomIds: ['lobby'], rooms }), null);
});

test('no explicit background: the first known room decides', () => {
    assert.equal(resolvePersonChatBackground({ roomIds: ['ward', 'lobby'], rooms }), 'assets/backgrounds/rooms/ward.png');
    assert.equal(resolvePersonChatBackground({ explicit: '', roomIds: ['lobby'], rooms }), 'assets/backgrounds/rooms/lobby.png');
    assert.equal(resolvePersonChatBackground({ explicit: null, roomIds: [null, undefined, 'lobby'], rooms }),
        'assets/backgrounds/rooms/lobby.png');
});

test('the NPC\'s room without a chatBackground gives none, not the player\'s room', () => {
    assert.equal(resolvePersonChatBackground({ roomIds: ['store', 'lobby'], rooms }), null);
});

test('unknown and unlisted room ids are skipped', () => {
    assert.equal(resolvePersonChatBackground({ roomIds: ['unknown', 'nowhere', 'lobby'], rooms }),
        'assets/backgrounds/rooms/lobby.png');
});

test('nothing anywhere gives none', () => {
    assert.equal(resolvePersonChatBackground({}), null);
    assert.equal(resolvePersonChatBackground({ roomIds: ['lobby'], rooms: {} }), null);
    assert.equal(resolvePersonChatBackground({ roomIds: ['lobby'], rooms: { lobby: { chatBackground: '  ' } } }), null);
});

test('video calls get no room fallback but keep an explicit background', () => {
    assert.equal(resolvePersonChatBackground({ videoCall: true, roomIds: ['lobby'], rooms }), null);
    assert.equal(resolvePersonChatBackground({ videoCall: true, explicit: 'assets/backgrounds/hq2.png', roomIds: ['lobby'], rooms }),
        'assets/backgrounds/hq2.png');
});

test('room order: NPC live room, then assigned room, then player room', () => {
    assert.deepEqual(conversationRoomIds('nurse', fakeWindow({ liveRoom: 'ward', npcRoom: 'lobby', playerRoom: 'store' })),
        ['ward', 'lobby', 'store']);
    assert.deepEqual(conversationRoomIds('ghost', fakeWindow({ playerRoom: 'store' })), [null, null, 'store']);
    assert.deepEqual(conversationRoomIds('nurse', {}), [null, null, null]);
});

test('personChatBackgroundFor reads live state', () => {
    // NPC walked from the lobby into the ward: the ward's image
    assert.equal(personChatBackgroundFor({ npcId: 'nurse' }, fakeWindow({ liveRoom: 'ward', npcRoom: 'lobby', playerRoom: 'lobby' })),
        'assets/backgrounds/rooms/ward.png');
    // No behaviour yet: the assigned room
    assert.equal(personChatBackgroundFor({ npcId: 'nurse' }, fakeWindow({ npcRoom: 'lobby', playerRoom: 'ward' })),
        'assets/backgrounds/rooms/lobby.png');
    // NPC with no room at all: the player's room
    assert.equal(personChatBackgroundFor({ npcId: 'ghost' }, fakeWindow({ playerRoom: 'ward' })),
        'assets/backgrounds/rooms/ward.png');
    // Explicit wins
    assert.equal(personChatBackgroundFor({ npcId: 'nurse', background: 'assets/backgrounds/hq1.png' },
        fakeWindow({ npcRoom: 'lobby' })), 'assets/backgrounds/hq1.png');
    // Video call
    assert.equal(personChatBackgroundFor({ npcId: 'nurse', videoCall: true }, fakeWindow({ npcRoom: 'lobby' })), null);
    // No scenario loaded
    assert.equal(personChatBackgroundFor({ npcId: 'nurse' }, {}), null);
});

test("an NPC's own chatBackground beats the room, loses to explicit", () => {
    const bed = 'assets/backgrounds/rooms/bedside.png';
    assert.equal(resolvePersonChatBackground({ npcBackground: bed, roomIds: ['ward'], rooms }), bed);
    assert.equal(resolvePersonChatBackground({ explicit: 'assets/backgrounds/hq1.png', npcBackground: bed, roomIds: ['ward'], rooms }),
        'assets/backgrounds/hq1.png');
    assert.equal(resolvePersonChatBackground({ explicit: 'none', npcBackground: bed, roomIds: ['ward'], rooms }), null);
    assert.equal(resolvePersonChatBackground({ videoCall: true, npcBackground: bed }), null);
    assert.equal(resolvePersonChatBackground({ npcBackground: '  ', roomIds: ['ward'], rooms }), 'assets/backgrounds/rooms/ward.png');
});

test('personChatBackgroundFor reads the NPC chatBackground', () => {
    const w = fakeWindow({ npcRoom: 'ward' });
    w.npcManager = { getNPC: id => (id === 'patient' ? { id, roomId: 'ward', chatBackground: 'assets/backgrounds/rooms/bedside.png' } : null) };
    assert.equal(personChatBackgroundFor({ npcId: 'patient' }, w), 'assets/backgrounds/rooms/bedside.png');
});

const L = 'assets/backgrounds/rooms/hall_left.png';
const R = 'assets/backgrounds/rooms/hall_right.png';
const views = [{ x: [0, 0.5], image: L }, { x: [0.5, 1], image: R }];

test('a room with views by x picks the one under the NPC, else the first', () => {
    const rooms2 = { hall: { chatBackground: views } };
    assert.equal(resolvePersonChatBackground({ roomIds: ['hall'], rooms: rooms2, npcX: { hall: 0.2 } }), L);
    assert.equal(resolvePersonChatBackground({ roomIds: ['hall'], rooms: rooms2, npcX: { hall: 0.8 } }), R);
    assert.equal(resolvePersonChatBackground({ roomIds: ['hall'], rooms: rooms2 }), L);
    assert.equal(resolvePersonChatBackground({ roomIds: ['hall'], rooms: { hall: { chatBackground: [{ x: [0.6, 1], image: R }, { image: L }] } }, npcX: { hall: 0.1 } }), R);
    assert.equal(resolvePersonChatBackground({ roomIds: ['hall'], rooms: { hall: { chatBackground: [] } } }), null);
});

test('personChatBackgroundFor uses the live sprite, then the placed position', () => {
    const w = {
        gameScenario: { rooms: { hall: { chatBackground: views } } },
        rooms: { hall: { position: { x: 1000 }, map: { widthInPixels: 320, tileWidth: 32 }, npcSprites: [] } },
        npcManager: { getNPC: id => (id === 'guard' ? { id, roomId: 'hall', position: { x: 2, y: 3 } } : null) }
    };
    // not drawn yet: placed at tile 2 of 10 -> left
    assert.equal(personChatBackgroundFor({ npcId: 'guard' }, w), L);
    // drawn and walked to the right-hand side
    w.rooms.hall.npcSprites.push({ npcId: 'guard', x: 1000 + 250, active: true });
    assert.equal(personChatBackgroundFor({ npcId: 'guard' }, w), R);
});

// Views with a condition (m03's day/night rooms): skipped while the condition is false.
const NIGHT = 'globalVars.clone_call_done === true';
const dayNight = [
    { condition: NIGHT, image: 'night.png' },
    { image: 'day.png' }
];

test('a view whose condition holds wins; otherwise the next view', () => {
    assert.equal(pickRoomBackground(dayNight, 0.5, { clone_call_done: true }), 'night.png');
    assert.equal(pickRoomBackground(dayNight, 0.5, { clone_call_done: false }), 'day.png');
    assert.equal(pickRoomBackground(dayNight, 0.5, {}), 'day.png');
    assert.equal(pickRoomBackground(dayNight, undefined), 'day.png');
});

test('conditions combine with views by x', () => {
    const views = [
        { condition: NIGHT, x: [0, 0.5], image: 'night_left.png' },
        { condition: NIGHT, x: [0.5, 1], image: 'night_right.png' },
        { x: [0, 0.5], image: 'day_left.png' },
        { x: [0.5, 1], image: 'day_right.png' }
    ];
    assert.equal(pickRoomBackground(views, 0.3, { clone_call_done: true }), 'night_left.png');
    assert.equal(pickRoomBackground(views, 0.8, { clone_call_done: true }), 'night_right.png');
    assert.equal(pickRoomBackground(views, 0.3, {}), 'day_left.png');
    assert.equal(pickRoomBackground(views, 0.8, {}), 'day_right.png');
    // No x known: the first view whose condition holds
    assert.equal(pickRoomBackground(views, undefined, {}), 'day_left.png');
});

test('views without conditions behave as before', () => {
    const views = [{ x: [0, 0.5], image: 'left.png' }, { x: [0.5, 1], image: 'right.png' }];
    assert.equal(pickRoomBackground(views, 0.2, { anything: true }), 'left.png');
    assert.equal(pickRoomBackground(views, 0.9), 'right.png');
    assert.equal(pickRoomBackground('plain.png', 0.9, {}), 'plain.png');
});

test('every view false: no background from the room', () => {
    assert.equal(pickRoomBackground([{ condition: NIGHT, image: 'night.png' }], 0.5, {}), null);
});

test('personChatBackgroundFor reads the live global variables', () => {
    const scenarioRooms = { lobby: { chatBackground: dayNight } };
    const w = fakeWindow({ npcRoom: 'lobby', scenarioRooms });
    assert.equal(personChatBackgroundFor({ npcId: 'nurse' }, w), 'day.png');
    w.gameState = { globalVariables: { clone_call_done: true } };
    assert.equal(personChatBackgroundFor({ npcId: 'nurse' }, w), 'night.png');
});
