// Combat obeys the same-room / no-wall rule (interaction-walls.js): the player's
// punch, an NPC's attack and the facing turn skip targets in another room or
// behind a wall; roomIdAtFeet agrees with core/rooms.js updatePlayerRoom; an NPC
// that falls in a room other than its home drops its items in the room it fell in.
// Run with: node --test test/js/combat-room-rule.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const quiet = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

// north (0,0) and south (0,256), both 320 wide; south's two wall rows (y 256-320) overlap north's floor
const rooms = {
    north: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 320 }, objects: {} },
    south: { position: { x: 0, y: 256 }, map: { widthInPixels: 320, heightInPixels: 288 }, objects: {} }
};
globalThis.window = { rooms };

const wallsUrl = dataUrl(read('systems/interaction-walls.js'));
const walls = await import(wallsUrl);
const configUrl = dataUrl(read('config/combat-config.js'));
const fightUrl = dataUrl(read('systems/fight-styles.js'));
const swap = (src) => src
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../utils/knockback.js'").join(`'${dataUrl('export function applyKnockback() {}')}'`)
    .split("'./fight-styles.js'").join(`'${fightUrl}'`)
    .split("'./interaction-walls.js'").join(`'${wallsUrl}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl(read('events/combat-events.js'))}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { PlayerCombat } = await import(dataUrl(swap(read('systems/player-combat.js'))));

// The reference: core/rooms.js updatePlayerRoom's own detection, on a Phaser-like body
function updatePlayerRoomDetect(body) {
    const feetY = body.y + body.height, cx = body.x + body.width / 2;
    for (const [id, room] of Object.entries(rooms)) {
        const top = room.position.y + 64, bottom = room.position.y + room.map.heightInPixels;
        if (feetY >= top && feetY <= bottom && cx >= room.position.x && cx <= room.position.x + room.map.widthInPixels) return id;
    }
    return null;
}
const bodyAt = (cx, cy, w, h) => ({
    x: cx - w / 2, y: cy - h / 2, width: w, height: h, halfHeight: h / 2,
    center: { x: cx, y: cy }, left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2
});

test('rooms.js still decides the room from the body bottom edge', () => {
    assert.match(read('core/rooms.js'), /playerFeetY = playerBody\.y \+ playerBody\.height/);
});

test('roomIdAtFeet agrees with updatePlayerRoom for any body height', () => {
    for (const h of [10, 14, 20]) {
        for (let y = 200; y <= 420; y += 1) {
            const body = bodyAt(100, y, 18, h);
            const feet = walls.playerFeet({ body });
            assert.equal(walls.roomIdAtFeet(feet.x, feet.y, rooms, feet.half), updatePlayerRoomDetect(body), `h=${h} y=${y}`);
        }
    }
});

test('feet in a gap use the last room the player was in', () => {
    const panel = { x: 100, y: 270, roomId: 'south', displayWidth: 32, displayHeight: 32, originX: 0, originY: 0, scenarioData: {} };
    window.currentPlayerRoom = 'north';
    assert.equal(walls.sameRoomFrom({ x: 9999, y: 9999 }, panel, rooms), false);
    window.currentPlayerRoom = 'south';
    assert.equal(walls.sameRoomFrom({ x: 9999, y: 9999 }, panel, rooms), true);
    delete window.currentPlayerRoom;
    assert.equal(walls.sameRoomFrom({ x: 9999, y: 9999 }, panel, rooms), true, 'no last room: not blocked');
});

test('an NPC that has changed rooms is measured in the room it stands in (M3)', () => {
    // home room south, now standing on the north room's floor, 20px from the player
    const npc = { _isNPC: true, roomId: 'south', x: 120, y: 150, body: { center: { x: 120, y: 180 } }, displayWidth: 18, displayHeight: 40 };
    const p = walls.interactionTargetPoint(npc, { x: 100, y: 180 });
    assert.deepEqual(p, { x: 120, y: 180 }, 'not clamped into the south room');
    const open = { isWallClearBetween: () => true };
    assert.equal(walls.wallClearFrom({ x: 100, y: 180 }, npc, { occ: open }), true);
});

// ---- M1: the player's punch -----------------------------------------------------------
function punch({ playerAt, npcAt, wallsBetween = false, chairAt = null }) {
    window.npcHostileSystem = {
        isNPCHostile: () => false, isNPCKO: () => false, isNPCKOImmune: () => false,
        setNPCHostile() {}
    };
    window.npcSightOcclusion = { isWallClearBetween: () => !wallsBetween };
    window.player = { x: playerAt.x, y: playerAt.y - 31, isAtlas: true, lastDirection: 'down', body: bodyAt(playerAt.x, playerAt.y, 18, 10) };
    const sprite = { npcId: 'sarah', _isNPC: true, visible: true, roomId: 'south', x: npcAt.x, y: npcAt.y - 31, body: bodyAt(npcAt.x, npcAt.y, 18, 10) };
    rooms.south.npcSprites = [sprite];
    rooms.north.npcSprites = [];
    const hit = [], kicked = [];
    window.chairs = chairAt ? [{ isSwivelChair: true, name: 'chair', x: chairAt.x, y: chairAt.y - 20, body: bodyAt(chairAt.x, chairAt.y, 16, 16), displayWidth: 16, displayHeight: 40 }] : [];
    const fake = {
        getCurrentModeConfig: () => ({ damage: 10 }),
        bodyOverlapsCone: () => true,
        nearBody: PlayerCombat.prototype.nearBody,
        applyDamage: (id) => hit.push(id),
        kickChair: (c) => kicked.push(c.name),
        hitboxGraphics: null
    };
    quiet(() => PlayerCombat.prototype.checkForHits.call(fake));
    return { hit, kicked };
}

test('a punch from behind the south back wall does not hit the south room NPC (M1)', () => {
    // feet y 285: north room's strip behind south's back wall; the NPC stands at y 300 in the strip too
    const r = punch({ playerAt: { x: 100, y: 285 }, npcAt: { x: 100, y: 330 } });
    assert.deepEqual(r.hit, []);
});

test('a punch in the same room still hits, and a wall between stops it', () => {
    assert.deepEqual(punch({ playerAt: { x: 100, y: 330 }, npcAt: { x: 100, y: 345 } }).hit, ['sarah']);
    assert.deepEqual(punch({ playerAt: { x: 100, y: 330 }, npcAt: { x: 100, y: 345 }, wallsBetween: true }).hit, []);
});

test('a kick from another room does not move a chair; in the same room it does (M1)', () => {
    window.chairs = [];
    assert.deepEqual(punch({ playerAt: { x: 100, y: 285 }, npcAt: { x: 500, y: 500 }, chairAt: { x: 100, y: 330 } }).kicked, []);
    assert.deepEqual(punch({ playerAt: { x: 100, y: 330 }, npcAt: { x: 500, y: 500 }, chairAt: { x: 100, y: 345 } }).kicked, ['chair']);
});

test('nearestHostile skips a hostile behind a wall or in another room (m7)', () => {
    window.npcHostileSystem = { isNPCHostile: () => true, isNPCKO: () => false };
    window.player = { x: 100, y: 285 - 31, body: bodyAt(100, 285, 18, 10) };
    const sprite = { npcId: 'sarah', _isNPC: true, visible: true, roomId: 'south', x: 100, y: 300, body: bodyAt(100, 330, 18, 10) };
    rooms.south.npcSprites = [sprite];
    window.npcSightOcclusion = { isWallClearBetween: () => true };
    assert.equal(PlayerCombat.prototype.nearestHostile.call({}, 80), null);
    window.player = { x: 100, y: 330 - 31, body: bodyAt(100, 330, 18, 10) };
    assert.equal(PlayerCombat.prototype.nearestHostile.call({}, 80), sprite);
});

// ---- M2: NPC attacks -----------------------------------------------------------------------
test('feetClear: same room and no wall; another room or a wall refuses (M2)', () => {
    const open = { isWallClearBetween: () => true }, shut = { isWallClearBetween: () => false };
    const strip = { x: 100, y: 285, half: 5 }, floor = { x: 100, y: 330, half: 5 }, floor2 = { x: 120, y: 340, half: 5 };
    assert.equal(walls.feetClear(strip, floor, { occ: open, rooms }), false, 'through the back wall into the south room');
    assert.equal(walls.feetClear(floor, floor2, { occ: open, rooms }), true);
    assert.equal(walls.feetClear(floor, floor2, { occ: shut, rooms }), false);
    assert.equal(walls.feetClear(floor, { x: 9999, y: 9999 }, { occ: open, rooms }), true, 'a gap is left to the wall test');
});

// The NPC attack gates, each exercised alone: in range by distance, player not reachable
const { NPCCombat } = await import(dataUrl(swap(read('systems/npc-combat.js'))
    .split("'./npc-attack-guard.js'").join(`'${dataUrl(read('systems/npc-attack-guard.js'))}'`)));
globalThis.Phaser = { Math: { Distance: { Between: (a, b, c, d) => Math.hypot(c - a, d - b) } } };
const doorRows = {
    south: [{ to: 'north', direction: 'north', x: 48, y: 288 }],
    north: [{ to: 'south', direction: 'south', x: 48, y: 288 }]
};
walls.setDoorwayProvider((id) => doorRows[id] || []);

function npcFixture({ playerX, npcX = 48, doorClosed = false }) {
    // NPC on the south floor (feet 320), player in the strip behind south's back wall (feet 305)
    const dmg = [];
    window.player = { x: playerX, y: 305 - 31, lastDirection: 'down', body: bodyAt(playerX, 305, 18, 10) };
    window.playerHealth = { damage: (a) => dmg.push(a), isKO: () => false };
    window.playerCombat = {};
    window.npcSightOcclusion = { isWallClearBetween: () => true };
    window.npcHostileSystem = {
        getState: () => ({ isHostile: true, isKO: false, attackRange: 32, attackCooldown: 0, attackDamage: 10 }),
        isNPCKO: () => false
    };
    window.npcBehaviorManager = { getBehavior: () => null };
    rooms.south.doorSprites = doorClosed ? { d: { active: true, doorProperties: { connectedRoom: 'north', open: false } } } : {};
    rooms.north.doorSprites = {};
    const sprite = { npcId: 'sarah', x: npcX, y: 320 - 31, roomId: 'south', body: bodyAt(npcX, 320, 18, 10) };
    const combat = new NPCCombat({ time: { delayedCall: () => {} } });
    let swings = 0;
    combat.playAttackAnimation = () => { swings++; };
    combat.playHitAnimation = () => {};
    return { combat, sprite, dmg, swings: () => swings, state: window.npcHostileSystem.getState() };
}

test('an NPC cannot start an attack through the back wall, but can through an open doorway (M2)', () => {
    let f = npcFixture({ playerX: 150, npcX: 150 });
    assert.equal(quiet(() => f.combat.attemptAttack('sarah', f.sprite)), false, 'behind the wall, no door');
    f = npcFixture({ playerX: 48 });
    assert.equal(quiet(() => f.combat.attemptAttack('sarah', f.sprite)), true, 'through the open doorway');
    f = npcFixture({ playerX: 48, doorClosed: true });
    assert.equal(quiet(() => f.combat.attemptAttack('sarah', f.sprite)), false, 'the door is shut');
    assert.equal(quiet(() => f.combat.canReachPlayer(f.sprite)), false);
});

test('a windup does not become a swing through a wall (M2)', () => {
    let f = npcFixture({ playerX: 150, npcX: 150 });
    quiet(() => f.combat.startAttackAnimation('sarah', f.sprite, f.state));
    assert.equal(f.swings(), 0);
    f = npcFixture({ playerX: 48 });
    quiet(() => f.combat.startAttackAnimation('sarah', f.sprite, f.state));
    assert.equal(f.swings(), 1);
});

test('a landing blow does no damage through a wall, and does through an open doorway (M2)', () => {
    let f = npcFixture({ playerX: 150, npcX: 150 });
    quiet(() => f.combat.applyAttackDamage('sarah', f.sprite, f.state));
    assert.deepEqual(f.dmg, []);
    f = npcFixture({ playerX: 48 });
    quiet(() => f.combat.applyAttackDamage('sarah', f.sprite, f.state));
    assert.deepEqual(f.dmg, [10]);
});

test('the player punches an NPC through an open doorway, not through the wall; doors that are shut refuse', () => {
    const run = (px, nx, closed = false) => {
        npcFixture({ playerX: px, npcX: nx, doorClosed: closed });
        window.npcHostileSystem = { isNPCHostile: () => false, isNPCKO: () => false, isNPCKOImmune: () => false, setNPCHostile() {} };
        window.player.y = 305 - 31;
        const sprite = { npcId: 'sarah', _isNPC: true, visible: true, roomId: 'south', x: nx, y: 289, body: bodyAt(nx, 320, 18, 10) };
        rooms.south.npcSprites = [sprite]; rooms.north.npcSprites = [];
        window.chairs = [];
        const hit = [];
        const fake = { getCurrentModeConfig: () => ({ damage: 10 }), bodyOverlapsCone: () => true, nearBody: () => false,
            applyDamage: (id) => hit.push(id), hitboxGraphics: null };
        quiet(() => PlayerCombat.prototype.checkForHits.call(fake));
        return hit;
    };
    assert.deepEqual(run(48, 48), ['sarah']);
    assert.deepEqual(run(150, 150), []);
    assert.deepEqual(run(48, 48, true), []);
});

test('NPC conversation reach follows the doorway rule, object reach stays strict', () => {
    npcFixture({ playerX: 48 });
    const feet = walls.playerFeet(window.player);
    const npc = { _isNPC: true, roomId: 'south', x: 48, y: 289, body: bodyAt(48, 320, 18, 10) };
    assert.equal(walls.wallClearFrom(feet, npc), true);
    const panel = { x: 40, y: 300, roomId: 'south', displayWidth: 32, displayHeight: 32, originX: 0, originY: 0, scenarioData: {} };
    assert.equal(walls.wallClearFrom(feet, panel), false);
});

test('a clicked chair is aimed at and kicked even outside the cone (m6)', () => {
    window.player = { x: 100, y: 330 - 31, lastDirection: 'up', body: bodyAt(100, 330, 18, 10) };
    window.npcSightOcclusion = { isWallClearBetween: () => true };
    window.npcHostileSystem = { isNPCHostile: () => false, isNPCKO: () => false, isNPCKOImmune: () => false };
    rooms.south.npcSprites = []; rooms.north.npcSprites = [];
    const chair = { isSwivelChair: true, name: 'chair', x: 100, y: 330, displayWidth: 16, displayHeight: 40, body: bodyAt(100, 350, 16, 16) };
    window.chairs = [chair];
    const kicked = [];
    const fake = { getCurrentModeConfig: () => ({ damage: 10 }), nearBody: PlayerCombat.prototype.nearBody,
        bodyOverlapsCone: () => false, kickChair: (c) => kicked.push(c.name), hitboxGraphics: null };
    quiet(() => PlayerCombat.prototype.checkForHits.call(fake));
    assert.deepEqual(kicked, [], 'outside the cone: not kicked');
    PlayerCombat.prototype.aimAtChair.call(fake, chair);
    assert.equal(window.player.lastDirection, 'down');
    quiet(() => PlayerCombat.prototype.checkForHits.call(fake));
    assert.deepEqual(kicked, ['chair']);
});

// ---- B1: the drop room -----------------------------------------------------------------------
test('items drop in the room the NPC fell in, and are registered there (B1)', async () => {
    const sprites = [];
    const sprite = () => {
        const s = { x: 0, y: 0, texture: {}, setOrigin() { return s; }, setInteractive() { return s; }, setDepth() { return s; } };
        sprites.push(s);
        return s;
    };
    const synced = [];
    const npcs = new Map([['derek', { id: 'derek', roomId: 'south', itemsHeld: [{ id: 'launch_device', type: 'device', name: 'Launch device' }] }]]);
    const npcSprite = { npcId: 'derek', x: 120, y: 150, body: Object.assign(bodyAt(120, 180, 18, 10), { setVelocity() {}, checkCollision: {} }), once() {}, anims: {}, play() {} };
    npcs.get('derek')._sprite = npcSprite;
    Object.assign(window, {
        game: { textures: { exists: () => true }, add: { sprite } },
        npcManager: { getNPC: (id) => npcs.get(id) || null },
        npcBehaviorManager: { getBehavior: () => null },
        eventDispatcher: { emit() {} },
        gameState: { globalVariables: {} },
        RoomStateSync: { updateNpcState: () => Promise.resolve(), addItemToRoom: (room, item) => { synced.push({ room, item }); return Promise.resolve(); } }
    });
    const { initNPCHostileSystem } = await import(dataUrl(swap(read('systems/npc-hostile.js'))));
    const sys = quiet(() => initNPCHostileSystem());
    quiet(() => { sys.setNPCHostile('derek', true); sys.damageNPC('derek', 10_000); });
    await new Promise(r => setTimeout(r, 20)); // the drop syncs after the KO sync resolves
    assert.equal(rooms.north.objects.launch_device?.roomId, 'north', 'registered in the north room (home room is south)');
    assert.equal(rooms.south.objects.launch_device, undefined);
    assert.equal(synced[0]?.room, 'north', 'synced with the room it fell in');
    assert.equal(walls.sameRoomFrom({ x: 120, y: 180 }, rooms.north.objects.launch_device, rooms), true, 'pickable from where Derek fell');
});

test('a hostile that is in range but cannot reach the player keeps chasing instead of freezing (R2-2a)', () => {
    const src = read('systems/npc-behavior.js');
    assert.match(src, /canReachPlayer\(this\.sprite\)/);
    assert.match(src, /if \(distance <= attackRange && reachable\) \{/);
});
