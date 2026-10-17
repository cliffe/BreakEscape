// 7.1b (m04 E2, m08 E11): hostile NPC attacks pause while a conversation or a
// cutscene is open, so a hit no longer closes them. A windup that began before
// one opened doesn't land, and attacks resume a moment after it closes. Other
// minigames are still closed by a hit (player-damage-interrupt.js).
// m07 U12 (2026-10-17): the phone no longer pauses attacks (it was a free
// shield); attacks carry on through it and a hit doesn't close it.
// Run with: node --test test/js/npc-attack-pause.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-attack-pause-'));
writeFileSync(join(dir, 'guard.mjs'), readFileSync(join(sys, 'npc-attack-guard.js'), 'utf8'));
const { attacksPausedByUI, minigameBlocksAttacks, ATTACK_RESUME_GRACE_MS } = await import(pathToFileURL(join(dir, 'guard.mjs')).href);

const open = (sceneType, extra = {}) => ({ framework: { currentMinigame: { _sceneType: sceneType, params: {}, ...extra } } });

test('a conversation and a cutscene pause attacks; the phone does not', () => {
    assert.equal(attacksPausedByUI(open('person-chat')), true);
    assert.equal(attacksPausedByUI(open('container', { params: { cutscene: true } })), true);
    assert.equal(attacksPausedByUI(open('phone-chat', { params: { cutscene: true } })), true);
    assert.equal(attacksPausedByUI(open('phone-chat')), false);
});

test('any minigame but the phone stops new attacks starting', () => {
    assert.equal(minigameBlocksAttacks(open('lockpicking')), true);
    assert.equal(minigameBlocksAttacks(open('person-chat')), true);
    assert.equal(minigameBlocksAttacks(open('phone-chat', { params: { cutscene: true } })), true);
    assert.equal(minigameBlocksAttacks(open('phone-chat')), false);
    assert.equal(minigameBlocksAttacks({ framework: { currentMinigame: null } }), false);
});

test('other minigames, nothing open, or one already closing: not paused', () => {
    assert.equal(attacksPausedByUI(open('lockpicking')), false);
    assert.equal(attacksPausedByUI(open('pin')), false);
    assert.equal(attacksPausedByUI({ framework: { currentMinigame: null } }), false);
    assert.equal(attacksPausedByUI({ framework: null }), false);
    assert.equal(attacksPausedByUI(open('phone-chat', { _ending: true })), false);
});

test('a short grace after a minigame closes', () => {
    assert.ok(ATTACK_RESUME_GRACE_MS >= 500 && ATTACK_RESUME_GRACE_MS <= 1500);
});

test('npc-combat: no windup while open or in the grace; a running windup does not land', () => {
    const combat = readFileSync(join(sys, 'npc-combat.js'), 'utf8');
    assert.match(combat, /import \{[^}]*attacksPausedByUI[^}]*minigameBlocksAttacks[^}]*ATTACK_RESUME_GRACE_MS[^}]*\} from '\.\/npc-attack-guard\.js'/);

    const canAttack = combat.slice(combat.indexOf('canAttack(npcId) {'), combat.indexOf('attemptAttack('));
    assert.match(canAttack, /if \(minigameBlocksAttacks\(\)\) \{\s*this\.lastMinigameOpenAt = Date\.now\(\)/);
    assert.match(canAttack, /Date\.now\(\) - this\.lastMinigameOpenAt < ATTACK_RESUME_GRACE_MS/);

    const start = combat.slice(combat.indexOf('startAttackAnimation(npcId, npcSprite, state) {'),
                               combat.indexOf('applyAttackDamage(npcId, npcSprite, state) {'));
    assert.match(start, /if \(attacksPausedByUI\(\)\) \{[\s\S]*?this\.npcAttacking\.delete\(npcId\);[\s\S]*?return;/);

    const land = combat.slice(combat.indexOf('applyAttackDamage(npcId, npcSprite, state) {'));
    const pauseAt = land.indexOf('attacksPausedByUI()');
    const damageAt = land.indexOf('window.playerHealth.damage(damage)');
    assert.ok(pauseAt > 0 && pauseAt < damageAt, 'checked before the damage is applied');
});
