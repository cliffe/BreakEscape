// Opt-in los.challengeOnSight: a guard who reacts when the player walks into his
// line of sight (npc-sight-challenge.js), on top of the lockpick catch.
// Run with: node --test test/js/npc-sight-challenge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Just the Phaser maths npc-los.js uses
globalThis.Phaser = {
    Math: {
        Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
        Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
        RadToDeg: (r) => r * 180 / Math.PI
    }
};
globalThis.window = { gameState: { globalVariables: {} } };

const losUrl = dataUrl(readFileSync(join(js, 'systems/npc-los.js'), 'utf8'));
const src = readFileSync(join(js, 'systems/npc-sight-challenge.js'), 'utf8').split("'./npc-los.js'").join(`'${losUrl}'`);
const {
    SightChallengeWatcher, getSightChallengeConfig, DEFAULT_CHALLENGE_COOLDOWN_MS, SIGHT_CHECK_INTERVAL_MS
} = await import(dataUrl(src));

// A guard at (0,0) facing right (0°), range 100, 90° cone, in the lobby
function setup(challengeOnSight, { npcType = 'person', room = 'lobby', extra = {} } = {}) {
    const emitted = [];
    const guard = {
        id: 'guard', npcType, roomId: 'lobby', x: 0, y: 0, facingDirection: 0,
        los: { enabled: true, range: 100, angle: 90, ...(challengeOnSight === undefined ? {} : { challengeOnSight }) },
        ...extra
    };
    window.npcManager = {
        npcs: new Map([['guard', guard]]),
        eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) }
    };
    window.gameState = { globalVariables: {} };
    window.currentPlayerRoom = room;
    window.player = { x: 500, y: 0 };   // out of range to start with
    window.MinigameFramework = { currentMinigame: null };
    return { emitted, guard, watcher: new SightChallengeWatcher() };
}
const inView = () => { window.player = { x: 50, y: 0 }; };
const outOfView = () => { window.player = { x: 500, y: 0 }; };
const behind = () => { window.player = { x: -50, y: 0 }; };

test('default off: no challengeOnSight, nothing emitted even in plain view', () => {
    const { emitted, watcher } = setup(undefined);
    inView();
    assert.deepEqual(watcher.update(1000, { force: true }), []);
    assert.equal(emitted.length, 0);
    assert.equal(getSightChallengeConfig({ id: 'g', los: { challengeOnSight: { enabled: false } } }), null);
    assert.equal(getSightChallengeConfig({ id: 'g', los: { challengeOnSight: false } }), null);
});

test('true means defaults: player_spotted:<id>, 10 s cooldown', () => {
    const cfg = getSightChallengeConfig({ id: 'guard', los: { challengeOnSight: true } });
    assert.equal(cfg.event, 'player_spotted:guard');
    assert.equal(cfg.cooldown, DEFAULT_CHALLENGE_COOLDOWN_MS);
    assert.equal(cfg.rooms, null);
});

test('walking into the cone emits once per sighting, with the payload', () => {
    const { emitted, watcher } = setup(true);
    assert.deepEqual(watcher.update(1000, { force: true }), []);   // out of range
    inView();
    assert.deepEqual(watcher.update(2000, { force: true }), ['guard']);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].name, 'player_spotted:guard');
    assert.equal(emitted[0].data.npcId, 'guard');
    assert.equal(emitted[0].data.roomId, 'lobby');
    assert.deepEqual(emitted[0].data.playerPosition, { x: 50, y: 0 });
    // Standing there long after the cooldown: still the same sighting, no spam
    watcher.update(60000, { force: true });
    assert.equal(emitted.length, 1);
});

test('outside the cone angle (behind him) is not a sighting', () => {
    const { emitted, watcher } = setup(true);
    behind();
    watcher.update(1000, { force: true });
    assert.equal(emitted.length, 0);
});

test('leaving and coming back fires again only after the cooldown', () => {
    const { emitted, watcher } = setup({ cooldown: 5000 });
    inView(); watcher.update(1000, { force: true });
    outOfView(); watcher.update(2000, { force: true });
    inView(); watcher.update(3000, { force: true });           // inside the cooldown
    assert.equal(emitted.length, 1);
    watcher.update(6500, { force: true });                     // cooldown over, same sighting not yet fired
    assert.equal(emitted.length, 2);
});

test('updates are throttled', () => {
    const { emitted, watcher } = setup({ cooldown: 0 });
    inView();
    watcher.update(10000);
    outOfView(); watcher.update(10000 + SIGHT_CHECK_INTERVAL_MS - 1);   // skipped: still "in sight"
    inView(); watcher.update(10000 + SIGHT_CHECK_INTERVAL_MS + 1);
    assert.equal(emitted.length, 1);
});

test('only in the player\'s room, and only in the listed rooms', () => {
    let s = setup(true, { room: 'corridor' });
    inView(); s.watcher.update(1000, { force: true });
    assert.equal(s.emitted.length, 0, 'guard in another room never sees the player');

    s = setup({ rooms: ['vault'] });
    inView(); s.watcher.update(1000, { force: true });
    assert.equal(s.emitted.length, 0, 'lobby is not in rooms');
});

test('requireGlobal and skipIfGlobal gate it; a global set mid-sighting lets it fire', () => {
    const { emitted, watcher } = setup({ requireGlobal: 'alarm_raised', skipIfGlobal: ['badge_shown'] });
    inView(); watcher.update(1000, { force: true });
    assert.equal(emitted.length, 0);
    window.gameState.globalVariables.alarm_raised = true;
    watcher.update(2000, { force: true });
    assert.equal(emitted.length, 1);

    const s2 = setup({ requireGlobal: { alarm_level: 2 } });
    window.gameState.globalVariables.alarm_level = 1;
    inView(); s2.watcher.update(1000, { force: true });
    assert.equal(s2.emitted.length, 0);
    window.gameState.globalVariables.alarm_level = 2;
    s2.watcher.update(2000, { force: true });
    assert.equal(s2.emitted.length, 1);

    const s3 = setup({ skipIfGlobal: 'badge_shown' });
    window.gameState.globalVariables.badge_shown = true;
    inView(); s3.watcher.update(1000, { force: true });
    assert.equal(s3.emitted.length, 0);
});

test('custom event name', () => {
    const { emitted, watcher } = setup({ event: 'lobby_guard_challenge' });
    inView(); watcher.update(1000, { force: true });
    assert.equal(emitted[0].name, 'lobby_guard_challenge');
});

test('nothing while a minigame or conversation is open, and no retrigger when it closes', () => {
    const { emitted, watcher } = setup({ cooldown: 0 });
    inView(); watcher.update(1000, { force: true });
    assert.equal(emitted.length, 1);
    window.MinigameFramework.currentMinigame = { name: 'person-chat' };
    watcher.update(2000, { force: true });
    window.MinigameFramework.currentMinigame = null;
    watcher.update(3000, { force: true });                     // still the same sighting
    assert.equal(emitted.length, 1);

    const s2 = setup(true);
    window.MinigameFramework.currentMinigame = { name: 'lockpicking' };
    inView(); s2.watcher.update(1000, { force: true });
    assert.equal(s2.emitted.length, 0);
});

test('hidden, KO\'d and phone NPCs never challenge', () => {
    let s = setup(true, { extra: { isVisible: false } });
    inView(); s.watcher.update(1000, { force: true });
    assert.equal(s.emitted.length, 0);

    s = setup(true, { npcType: 'phone' });
    inView(); s.watcher.update(1000, { force: true });
    assert.equal(s.emitted.length, 0);

    s = setup(true);
    window.npcHostileSystem = { isNPCKO: (id) => id === 'guard' };
    inView(); s.watcher.update(1000, { force: true });
    assert.equal(s.emitted.length, 0);
    delete window.npcHostileSystem;
});

// End to end with the real NPCManager and event dispatcher: the guard's own mapping
// on player_spotted:<id> runs (here a setGlobal, as a scenario would map it)
const { default: NPCEventDispatcher } = await import(dataUrl(readFileSync(join(js, 'systems/npc-events.js'), 'utf8')));
const { default: NPCManager } = await import(dataUrl(readFileSync(join(js, 'systems/npc-manager.js'), 'utf8')
    .split("'./npc-los.js'").join(`'${losUrl}'`)
    .split("'../minigames/phone-chat/phone-chat-speaker.js'")
    .join(`'${dataUrl(readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'))}'`)));

test('a player_spotted mapping on the guard fires through NPCManager', () => {
    window.gameState = { globalVariables: { guard_challenged: false } };
    window.MinigameFramework = { currentMinigame: null };
    window.currentPlayerRoom = 'lobby';
    const dispatcher = new NPCEventDispatcher();
    const manager = new NPCManager(dispatcher, null);
    window.npcManager = manager;
    manager.registerNPC('guard', {
        npcType: 'person', roomId: 'lobby', x: 0, y: 0, facingDirection: 0,
        los: { enabled: true, range: 100, angle: 90, challengeOnSight: { cooldown: 0 } },
        eventMappings: [{ eventPattern: 'player_spotted:guard', setGlobal: { guard_challenged: true }, cooldown: 0 }]
    });
    // A guard without the attribute, in the same spot, does nothing
    manager.registerNPC('quiet_guard', {
        npcType: 'person', roomId: 'lobby', x: 0, y: 0, facingDirection: 0,
        los: { enabled: true, range: 100, angle: 90 },
        eventMappings: [{ eventPattern: 'player_spotted:quiet_guard', setGlobal: { quiet_fired: true } }]
    });
    window.player = { x: 50, y: 0 };
    const watcher = new SightChallengeWatcher();
    assert.deepEqual(watcher.update(1000, { force: true }), ['guard']);
    assert.equal(window.gameState.globalVariables.guard_challenged, true);
    assert.equal(window.gameState.globalVariables.quiet_fired, undefined);
});

// ---- near: only while the player is close to a door / object / tile ----
function nearSetup(near, extraCfg = {}) {
    const s = setup({ event: 'player_in_view_near:guard', cooldown: 0, near, ...extraCfg });
    // A door between lobby and vault at (60,0); a desk object at (60,40)
    window.rooms = {
        lobby: {
            position: { x: -32, y: -32 },
            doorSprites: [{ x: 60, y: 0, active: true, doorProperties: { roomId: 'lobby', connectedRoom: 'vault' } }],
            objects: { desk1: { x: 60, y: 40, active: true, scenarioData: { id: 'desk_main' } } }
        },
        vault: { position: { x: 0, y: -200 }, doorSprites: [] }
    };
    return s;
}

test('near door: no event while in sight but far from the door, one event once near', () => {
    const { emitted, watcher } = nearSetup({ door: 'vault', radius: 20 });
    window.player = { x: 20, y: 0 };            // in the cone, 40px from the door
    assert.deepEqual(watcher.update(1000, { force: true }), []);
    window.player = { x: 50, y: 0 };            // 10px from the door
    assert.deepEqual(watcher.update(2000, { force: true }), ['guard']);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].name, 'player_in_view_near:guard');
    assert.equal(emitted[0].data.targetId, 'vault');
    assert.equal(emitted[0].data.targetType, 'door');
    // Moving away and back counts as a new sighting (cooldown 0)
    window.player = { x: 20, y: 0 };
    watcher.update(3000, { force: true });
    window.player = { x: 50, y: 0 };
    assert.deepEqual(watcher.update(4000, { force: true }), ['guard']);
});

test('near: skipIfGlobal and out-of-cone still stop it', () => {
    const { emitted, watcher } = nearSetup({ door: 'vault', radius: 64 }, { skipIfGlobal: 'disguised' });
    window.gameState.globalVariables.disguised = true;
    window.player = { x: 50, y: 0 };
    assert.deepEqual(watcher.update(1000, { force: true }), []);
    window.gameState.globalVariables.disguised = false;
    behind();                                   // near-ish the guard, but behind him
    assert.deepEqual(watcher.update(2000, { force: true }), []);
    assert.equal(emitted.length, 0);
});

test('near object and near tile resolve their points', () => {
    let s = nearSetup({ object: 'desk_main', radius: 15 });
    window.player = { x: 55, y: 35 };
    assert.deepEqual(s.watcher.update(1000, { force: true }), ['guard']);
    assert.equal(s.emitted[0].data.targetType, 'object');
    // tile (2,1) of lobby = (-32 + 80, -32 + 48) = (48, 16)
    s = nearSetup({ x: 2, y: 1, room: 'lobby', radius: 10 });
    window.player = { x: 50, y: 15 };
    assert.deepEqual(s.watcher.update(1000, { force: true }), ['guard']);
    assert.equal(s.emitted[0].data.targetId, 'lobby:2,1');
});

test('near with rooms: the player may be across the boundary from the guard', () => {
    const { watcher } = nearSetup({ door: 'vault', radius: 64 }, { rooms: ['lobby', 'vault'] });
    window.currentPlayerRoom = 'vault';
    window.player = { x: 50, y: 0 };
    assert.deepEqual(watcher.update(1000, { force: true }), ['guard']);
    // Without near, a player in another room is never challenged
    const plain = setup({ cooldown: 0, rooms: ['lobby', 'vault'] });
    window.currentPlayerRoom = 'vault';
    inView();
    assert.deepEqual(plain.watcher.update(1000, { force: true }), []);
});

test('near target missing (room not loaded): no event', () => {
    const { watcher } = nearSetup({ door: 'nowhere', radius: 64 });
    window.player = { x: 50, y: 0 };
    assert.deepEqual(watcher.update(1000, { force: true }), []);
});

test('access 9.2 C (8.2): no challenge while the NPC is distracted on its phone; once it puts it away it fires', () => {
    const { emitted, watcher } = setup({ event: 'player_in_view_near:guard' });
    let distracted = true;
    window.npcNeedsSystem = { isDistracted: (id) => id === 'guard' && distracted };
    try {
        inView();
        assert.deepEqual(watcher.update(1000, { force: true }), []);
        assert.deepEqual(watcher.update(2000, { force: true }), []);
        assert.equal(emitted.length, 0);
        distracted = false;
        assert.deepEqual(watcher.update(3000, { force: true }), ['guard']);
        assert.equal(emitted[0].name, 'player_in_view_near:guard');
    } finally { delete window.npcNeedsSystem; }
});
