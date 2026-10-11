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
writeFileSync(join(dir, 'background.mjs'), readFileSync(src, 'utf8'));
const { resolvePersonChatBackground, conversationRoomIds, personChatBackgroundFor } =
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
