// Hostile NPCs stop attacking a knocked-out player (npc-attack-guard.js, m02 CF-D),
// and npc-combat.js consults the guard before a windup and before a windup lands.
// Run with: node --test test/js/npc-attack-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/npc-attack-guard.js');
const dir = mkdtempSync(join(tmpdir(), 'npc-attack-guard-'));
writeFileSync(join(dir, 'guard.mjs'), readFileSync(src, 'utf8'));
const { playerCanBeAttacked } = await import(pathToFileURL(join(dir, 'guard.mjs')).href);

test('a standing player can be attacked', () => {
    assert.equal(playerCanBeAttacked({ playerHealth: { isKO: () => false } }), true);
});

test('a knocked-out player cannot be attacked', () => {
    assert.equal(playerCanBeAttacked({ playerHealth: { isKO: () => true } }), false);
});

test('no health system yet: attacks are not blocked', () => {
    assert.equal(playerCanBeAttacked({ playerHealth: null }), true);
});

test('npc-combat checks the guard before a windup and before it lands', () => {
    const combat = readFileSync(join(here, '../../public/break_escape/js/systems/npc-combat.js'), 'utf8');
    assert.match(combat, /import \{ playerCanBeAttacked \} from '\.\/npc-attack-guard\.js'/);
    const canAttack = combat.slice(combat.indexOf('canAttack(npcId) {'), combat.indexOf('attemptAttack('));
    assert.match(canAttack, /playerCanBeAttacked\(\)/);
    const land = combat.slice(combat.indexOf('startAttackAnimation(npcId, npcSprite, state) {'));
    assert.match(land.slice(0, 1200), /playerCanBeAttacked\(\)/);
});
