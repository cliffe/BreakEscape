// 7.1e (m05 D4): maxHP, attackCooldown and attackRange set in a scenario's
// behavior.hostile reach the NPC's combat state, as attackDamage already did.
// npc-behavior.js parseConfig keeps them; npc-hostile.js setNPCHostile builds
// the state from them, falling back to combat-config.js.
// Run with: node --test test/js/npc-hostile-config.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const behaviors = new Map();
globalThis.window = {
    eventDispatcher: { emit: () => {} },
    gameState: { globalVariables: {} },
    npcBehaviorManager: { getBehavior: (id) => behaviors.get(id) || null }
};

const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const eventsUrl = dataUrl(readFileSync(join(js, 'events/combat-events.js'), 'utf8'));
const hostileSrc = readFileSync(join(js, 'systems/npc-hostile.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
    .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down";')}'`);
const { initNPCHostileSystem } = await import(dataUrl(hostileSrc));
const { COMBAT_CONFIG } = await import(configUrl);
const sys = initNPCHostileSystem();

test('behavior.hostile numbers reach the combat state', () => {
    behaviors.set('torres', { config: { hostile: { attackDamage: 3, maxHP: 60, attackCooldown: 3000, attackRange: 40 } } });
    sys.setNPCHostile('torres', true);
    const s = sys.getState('torres');
    assert.equal(s.attackDamage, 3);
    assert.equal(s.maxHP, 60);
    assert.equal(s.currentHP, 60, 'starts at full health');
    assert.equal(s.attackCooldown, 3000);
    assert.equal(s.attackRange, 40);
});

test('missing numbers fall back to combat-config.js', () => {
    behaviors.set('clerk', { config: { hostile: { attackDamage: 7 } } });
    sys.setNPCHostile('clerk', true);
    const s = sys.getState('clerk');
    assert.equal(s.attackDamage, 7);
    assert.equal(s.maxHP, COMBAT_CONFIG.npc.defaultMaxHP);
    assert.equal(s.attackCooldown, COMBAT_CONFIG.npc.defaultAttackCooldown);
    assert.equal(s.attackRange, COMBAT_CONFIG.npc.defaultPunchRange);
});

test('with no behavior, the config passed to setNPCHostile is used', () => {
    sys.setNPCHostile('bridge_npc', true, { maxHP: 40, attackCooldown: 2500 });
    const s = sys.getState('bridge_npc');
    assert.equal(s.maxHP, 40);
    assert.equal(s.attackCooldown, 2500);
});

test('nonsense values are ignored', () => {
    behaviors.set('odd', { config: { hostile: { maxHP: -5, attackCooldown: '3000', attackRange: 0 } } });
    sys.setNPCHostile('odd', true);
    const s = sys.getState('odd');
    assert.equal(s.maxHP, COMBAT_CONFIG.npc.defaultMaxHP);
    assert.equal(s.attackCooldown, COMBAT_CONFIG.npc.defaultAttackCooldown);
    assert.equal(s.attackRange, COMBAT_CONFIG.npc.defaultPunchRange);
});

test('npc-behavior.js parseConfig keeps maxHP, attackCooldown and attackRange', () => {
    const behavior = readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8');
    const hostile = behavior.slice(behavior.indexOf('hostile: {\n                startHostile'));
    const block = hostile.slice(0, hostile.indexOf('}'));
    for (const key of ['maxHP', 'attackCooldown', 'attackRange']) {
        assert.match(block, new RegExp(`${key}: config\\.hostile\\?\\.${key}`));
    }
});
