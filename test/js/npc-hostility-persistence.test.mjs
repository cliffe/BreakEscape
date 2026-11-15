// E-B (2026-10-05): NPC hostility and KO survive a reload. An NPC that turned
// on the player (setNPCHostile, a #hostile tag, being punched) came back calm
// after a reload; m03 cleared its guard_attacking hint on game_loaded to match.
// npc-hostile.js now records hostility and KO (exportHostility, saved by
// state-sync.js), restores them before any NPC loads (restoreHostility, from
// savedNpcHostility in game.js), and the NPC's behavior announces a restored
// hostile once its sprite exists (takeRestoredHostility / announceRestoredHostile).
// Server side: Game#merge_npc_hostility!, test/controllers/.../reload_persistence_test.rb.
// Run with: node --test test/js/npc-hostility-persistence.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const emitted = [];
globalThis.window = {
    eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) },
    gameState: { globalVariables: {} }
};

const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
const hostileSrc = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8'))}'`);
const { initNPCHostileSystem } = await import(dataUrl(hostileSrc));
const sys = initNPCHostileSystem();

test('nothing is recorded until an NPC turns', () => {
    assert.deepEqual(sys.exportHostility(), {});
});

test('turning hostile, calming down and a KO are recorded for the save', () => {
    sys.setNPCHostile('guard', true);
    sys.setNPCHostile('clerk', true);
    sys.setNPCHostile('clerk', false);
    sys.setNPCHostile('boxer', true);
    sys.damageNPC('boxer', 10_000);

    assert.deepEqual(sys.exportHostility(), {
        guard: { hostile: true, ko: false },
        clerk: { hostile: false, ko: false },
        boxer: { hostile: true, ko: true }
    });
});

test('restore applies saved hostility and KO before NPCs load, without an event', () => {
    emitted.length = 0;
    const n = sys.restoreHostility({
        night_guard: { hostile: true, ko: false },
        victoria: { hostile: true, ko: true },
        calmed: { hostile: false, ko: false },
        guard: { hostile: false, ko: false },   // changed this session: this session wins
        junk: 'yes'
    });

    assert.equal(n, 3);
    assert.equal(sys.isNPCHostile('night_guard'), true);
    assert.equal(sys.isNPCKO('night_guard'), false);
    assert.equal(sys.isNPCKO('victoria'), true, 'a KO stays down (npc-sprites.js reads isNPCKO)');
    assert.equal(sys.getState('victoria').currentHP, 0);
    assert.equal(sys.isNPCHostile('calmed'), false);
    assert.equal(sys.isNPCHostile('guard'), true, 'not overwritten by the save');
    assert.equal(emitted.length, 0, 'no sprite yet, so nothing is announced here');
    assert.deepEqual(sys.exportHostility().night_guard, { hostile: true, ko: false },
                     'restored entries are saved again on the next sync');
});

test('the behavior takes its restored entry once, in place of startHostile', () => {
    assert.deepEqual(sys.takeRestoredHostility('night_guard'), { hostile: true, ko: false });
    assert.equal(sys.takeRestoredHostility('night_guard'), null);
    assert.deepEqual(sys.takeRestoredHostility('calmed'), { hostile: false, ko: false });
    assert.equal(sys.takeRestoredHostility('never_saved'), null);
});

test('a restored hostile is announced with the behavior attack damage; a KO is not', () => {
    emitted.length = 0;
    assert.equal(sys.announceRestoredHostile('night_guard', { attackDamage: 7 }), true);
    assert.equal(sys.getState('night_guard').attackDamage, 7);
    assert.deepEqual(emitted, [{ name: 'npc_hostile_state_changed',
                                 data: { npcId: 'night_guard', isHostile: true, restored: true } }]);

    assert.equal(sys.announceRestoredHostile('victoria', {}), false, 'KO: no health bar, no threat music');
    assert.equal(sys.announceRestoredHostile('calmed', {}), false);
    assert.equal(emitted.length, 1);
});

test('wiring: state sync saves it, game.js restores it, the behavior applies it', () => {
    const sync = readFileSync(join(js, 'state-sync.js'), 'utf8');
    assert.match(sync, /npcHostileSystem\?\.exportHostility\?\.\(\)/);
    assert.match(sync, /out\.npcHostility = npcHostility/); // change-only sync builds `out` (5decddae)

    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    const init = game.indexOf('window.npcHostileSystem = initNPCHostileSystem();');
    const restore = game.indexOf('restoreHostility(gameScenario.savedNpcHostility)');
    const startRoomNpcs = game.indexOf('loadNPCsForRoom(startRoomId');
    assert.ok(init > 0 && restore > init && restore < startRoomNpcs, 'restored after init, before the first room loads');

    const behavior = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8');
    const ctor = behavior.slice(behavior.indexOf('takeRestoredHostility'), behavior.indexOf('parseConfig(config) {'));
    assert.match(ctor, /announceRestoredHostile/);
    assert.match(ctor, /else if \(this\.config\.hostile\.startHostile\)/);
});

// 7.1f (m05 D10): a getState() read before the turn built a default state, and
// setNPCHostile then kept its default 10 damage. Turning hostile now always
// applies the configured numbers.
test('turning hostile applies the configured damage even if a state already exists', () => {
    const saved = window.npcBehaviorManager;
    window.npcBehaviorManager = {
        getBehavior: (id) => (id === 'probe_npc' || id === 'control_npc')
            ? { config: { hostile: { attackDamage: 3, maxHP: 60, attackCooldown: 3000 } } }
            : null
    };
    try {
        assert.equal(sys.getState('probe_npc').attackDamage, 10, 'a read before the turn builds the default');
        sys.setNPCHostile('probe_npc', true);
        const probe = sys.getState('probe_npc');
        assert.equal(probe.attackDamage, 3);
        assert.equal(probe.attackCooldown, 3000);
        assert.equal(probe.maxHP, 60);
        assert.equal(probe.currentHP, 60, 'an unhurt NPC takes the new maximum');

        sys.setNPCHostile('control_npc', true);
        assert.equal(sys.getState('control_npc').attackDamage, 3, 'no prior read: same numbers');

        // A hurt NPC keeps its HP (capped at the new maximum)
        sys.getState('hurt_npc').currentHP = 45;
        window.npcBehaviorManager.getBehavior = () => ({ config: { hostile: { maxHP: 80 } } });
        sys.setNPCHostile('hurt_npc', true);
        assert.equal(sys.getState('hurt_npc').maxHP, 80);
        assert.equal(sys.getState('hurt_npc').currentHP, 45);
    } finally {
        window.npcBehaviorManager = saved;
    }
});

// 7.1g (m08 E12): a hurt hostile NPC came back at full health after a reload.
// Its HP is now saved with the hostility record and restored with it.
test('a hurt NPC saves its HP with its hostility, and a reload restores it', () => {
    sys.setNPCHostile('agent_off_duty', true);
    sys.damageNPC('agent_off_duty', 70);
    assert.deepEqual(sys.exportHostility().agent_off_duty, { hostile: true, ko: false, hp: 30, maxHP: 100 });

    sys.restoreHostility({
        hurt_on_load: { hostile: true, ko: false, hp: 25, maxHP: 60 },
        bad_hp: { hostile: true, ko: false, hp: 90, maxHP: 60 },
        ko_with_hp: { hostile: true, ko: true, hp: 10, maxHP: 100 }
    });
    assert.equal(sys.getState('hurt_on_load').currentHP, 25);
    assert.equal(sys.getState('hurt_on_load').maxHP, 60);
    assert.deepEqual(sys.exportHostility().hurt_on_load, { hostile: true, ko: false, hp: 25, maxHP: 60 });
    assert.equal(sys.getState('bad_hp').currentHP, 100, 'an impossible HP is ignored');
    assert.equal(sys.getState('ko_with_hp').currentHP, 0);
    assert.deepEqual(sys.exportHostility().ko_with_hp, { hostile: true, ko: true });

    // The behavior's numbers don't put a restored NPC back to full health
    sys.takeRestoredHostility('hurt_on_load');
    sys.announceRestoredHostile('hurt_on_load', { attackDamage: 4, maxHP: 60 });
    assert.equal(sys.getState('hurt_on_load').currentHP, 25);
});

// D5 (KO position on reload): a KO now also records the room it fell in and its
// world x,y, so a reload lays the NPC where it dropped, in the room it was knocked
// out in even when that is not its home room. The server does the placement from
// this same record (Game#apply_ko_positions!); the client just saves and restores
// the three fields on the hostility record.
test('a KO records its fall room and x,y for the save', () => {
    const savedMgr = window.npcManager;
    window.npcManager = {
        getNPC: (id) => (id === 'errand_npc'
            ? { _sprite: { x: 412.4, y: 268.6, once: () => {} }, roomId: 'break_room' }
            : null)
    };
    try {
        sys.setNPCHostile('errand_npc', true);
        sys.damageNPC('errand_npc', 10_000);
        assert.deepEqual(sys.exportHostility().errand_npc, {
            hostile: true, ko: true, facing: 'down',
            koRoom: 'break_room', koX: 412, koY: 269
        }, 'room from the sprite feet (falls back to npc.roomId), x,y rounded');
    } finally {
        window.npcManager = savedMgr;
    }
});

test('a saved KO position is restored and re-exported unchanged (round trip)', () => {
    sys.restoreHostility({
        fell_away: { hostile: true, ko: true, facing: 'left', koRoom: 'server_room', koX: 100, koY: 200 }
    });
    const st = sys.getState('fell_away');
    assert.equal(st.isKO, true);
    assert.equal(st.koRoom, 'server_room');
    assert.deepEqual(sys.exportHostility().fell_away, {
        hostile: true, ko: true, facing: 'left', koRoom: 'server_room', koX: 100, koY: 200
    });
});

test('a KO position only rides when all three fields are valid', () => {
    sys.restoreHostility({
        no_pos: { hostile: true, ko: true },
        bad_room: { hostile: true, ko: true, koRoom: '', koX: 10, koY: 10 },
        bad_xy: { hostile: true, ko: true, koRoom: 'lab', koX: 'x', koY: 10 }
    });
    assert.deepEqual(sys.exportHostility().no_pos, { hostile: true, ko: true });
    assert.deepEqual(sys.exportHostility().bad_room, { hostile: true, ko: true });
    assert.deepEqual(sys.exportHostility().bad_xy, { hostile: true, ko: true });
});

test('repeated exports do not grow the KO entry (stable per sync)', () => {
    const savedMgr = window.npcManager;
    window.npcManager = {
        getNPC: (id) => (id === 'stable_npc'
            ? { _sprite: { x: 50, y: 60, once: () => {} }, roomId: 'lobby' }
            : null)
    };
    try {
        sys.setNPCHostile('stable_npc', true);
        sys.damageNPC('stable_npc', 10_000);
        const first = JSON.stringify(sys.exportHostility().stable_npc);
        // Several more "syncs": nothing changed, so the entry is byte-for-byte stable.
        for (let i = 0; i < 5; i++) {
            assert.equal(JSON.stringify(sys.exportHostility().stable_npc), first);
        }
        assert.equal(Object.keys(sys.exportHostility().stable_npc).length, 6);
    } finally {
        window.npcManager = savedMgr;
    }
});
