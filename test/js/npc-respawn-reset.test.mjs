// 7.1d (m05 D5, m07 U11): Restart after a knockout resets hostile NPCs that
// aren't knocked out (calm, full health; back at their posts after the reload).
// A KO'd NPC stays down, so its dropped items stay dropped; an NPC that wasn't
// KO'd keeps its itemsHeld. game-over-screen.js saves the reset before reloading.
// Run with: node --test test/js/npc-respawn-reset.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const emitted = [];
const behaviors = new Map();
const npcs = new Map();
globalThis.window = {
    eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) },
    gameState: { globalVariables: {} },
    npcBehaviorManager: { getBehavior: (id) => behaviors.get(id) || null },
    npcManager: { getNPC: (id) => npcs.get(id) || null }
};
const quiet = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };

const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
const hostileSrc = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { initNPCHostileSystem } = await import(dataUrl(hostileSrc));
const sys = quiet(() => initNPCHostileSystem());

test('a hurt hostile that is not KO is calm and at full health after the reset', () => {
    const hollis = { config: { hostile: {} }, hostile: true };
    behaviors.set('hollis', hollis);
    npcs.set('hollis', { id: 'hollis', itemsHeld: [{ id: 'ops_keycard', type: 'keycard' }] });
    quiet(() => { sys.setNPCHostile('hollis', true); sys.damageNPC('hollis', 40); });

    // Knocked out (its items were dropped at the KO): it must stay down
    npcs.set('park', { id: 'park', itemsHeld: [] });
    quiet(() => { sys.setNPCHostile('park', true); sys.damageNPC('park', 10_000); });

    sys.setNPCHostile('calm_clerk', false);

    emitted.length = 0;
    const reset = quiet(() => sys.resetHostilesForRespawn());

    assert.deepEqual(reset, ['hollis']);
    assert.equal(sys.isNPCHostile('hollis'), false);
    assert.equal(hollis.hostile, false, 'the behavior agrees');
    assert.equal(sys.getState('hollis').currentHP, sys.getState('hollis').maxHP);
    assert.deepEqual(sys.exportHostility().hollis, { hostile: false, ko: false }, 'saved calm, no stale HP');
    assert.deepEqual(npcs.get('hollis').itemsHeld, [{ id: 'ops_keycard', type: 'keycard' }], 'still holds its items');

    assert.equal(sys.isNPCKO('park'), true, 'a KO stays down');
    assert.deepEqual(sys.exportHostility().park, { hostile: true, ko: true });
    assert.deepEqual(emitted, [
        { name: 'npc_hostile_state_changed', data: { npcId: 'hollis', isHostile: false, reset: true } }
    ], 'one calm event for the NPC that was reset; none for the KO or the calm clerk');
});

test('an NPC the scenario starts hostile goes back to hostile, at full health', () => {
    behaviors.set('sentry', { config: { hostile: { startHostile: true } }, hostile: true });
    quiet(() => { sys.setNPCHostile('sentry', true); sys.damageNPC('sentry', 30); });
    emitted.length = 0;
    quiet(() => sys.resetHostilesForRespawn());
    assert.equal(emitted.some((e) => e.data.npcId === 'sentry'), false, 'still hostile: no event');
    assert.equal(sys.isNPCHostile('sentry'), true);
    assert.deepEqual(sys.exportHostility().sentry, { hostile: true, ko: false });
});

test('hostility restored from a save but never loaded is reset too', () => {
    quiet(() => sys.restoreHostility({ vault_guard: { hostile: true, ko: false, hp: 20, maxHP: 100 } }));
    quiet(() => sys.resetHostilesForRespawn());
    assert.deepEqual(sys.exportHostility().vault_guard, { hostile: false, ko: false });
});

test('game-over Restart resets and saves before it reloads', () => {
    const screen = readFileSync(join(js, 'ui/game-over-screen.js'), 'utf8');
    const restart = screen.slice(screen.indexOf('async restart() {'), screen.indexOf('mainMenu() {'));
    const resetAt = restart.indexOf('resetHostilesForRespawn');
    const syncAt = restart.indexOf('window.stateSync.sync()');
    const reloadAt = restart.indexOf('window.location.href = url.toString()');
    assert.ok(resetAt > 0 && syncAt > resetAt && reloadAt > syncAt);
});
