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
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
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
    assert.match(sync, /payload\.npcHostility = npcHostility/);

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
