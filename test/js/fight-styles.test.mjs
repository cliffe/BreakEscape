// Fight styles, blocking and the punch combo (fight-styles.js), and the
// wiring that replaced the three-way mode toggle: click and tap always move
// or interact; F, right-click and the Punch button punch; Q and the Block
// button guard.
// Run with: node --test test/js/fight-styles.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'fight-styles-'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
const {
    resolveFightStyle, npcIsGuarding, blockedDamage, facingCovers, directionToward,
    nextComboStep, PUNCH_COMBO, COMBO_WINDOW_MS, pickFleeHeading, DEFAULT_FIGHT_STYLE
} = await import(pathToFileURL(join(dir, 'fight-styles.mjs')).href);

test('an unknown or missing style is the brawler, which fights as NPCs always did', () => {
    for (const name of [undefined, null, '', 'ninja', 42]) {
        const style = resolveFightStyle(name);
        assert.equal(style.name, DEFAULT_FIGHT_STYLE);
        assert.equal(style.attack, 'cross');
        assert.equal(style.windupMs, 500);
        assert.equal(style.guards, false);
        assert.equal(style.flees, false);
        assert.equal(style.armouredWindup, false);
    }
});

test('the m01 styles: Derek guards, Kevin telegraphs long, Maya jabs and runs', () => {
    const guarded = resolveFightStyle('guarded');
    assert.equal(guarded.guards, true);
    assert.equal(guarded.armouredWindup, true);
    assert.ok(guarded.guardDamageScale < 0.5);
    assert.ok(guarded.recoveryMs > 0, 'it has an opening after each swing');

    const slugger = resolveFightStyle('slugger');
    assert.equal(slugger.guards, false);
    assert.equal(slugger.attack, 'cross');
    assert.ok(slugger.windupMs > resolveFightStyle('brawler').windupMs);

    const cower = resolveFightStyle('cower');
    assert.equal(cower.flees, true);
    assert.equal(cower.attack, 'jab');
    assert.ok(cower.fleeDistance > 0);
});

test('a guard is up only while standing, not swinging, and past the recovery', () => {
    const style = resolveFightStyle('guarded');
    const base = { style, attacking: false, moving: false, now: 1000, openUntil: 0 };
    assert.equal(npcIsGuarding(base), true);
    assert.equal(npcIsGuarding({ ...base, attacking: true }), false);
    assert.equal(npcIsGuarding({ ...base, moving: true }), false);
    assert.equal(npcIsGuarding({ ...base, openUntil: 1500 }), false);
    assert.equal(npcIsGuarding({ ...base, openUntil: 1000 }), true);
    assert.equal(npcIsGuarding({ ...base, style: resolveFightStyle('slugger') }), false);
});

test('blocked damage is the scaled share, at least 1', () => {
    assert.equal(blockedDamage(30, 0.2), 6);
    assert.equal(blockedDamage(25, 0.2), 5);
    assert.equal(blockedDamage(3, 0.2), 1);
    assert.equal(blockedDamage(0, 0.2), 0);
    assert.equal(blockedDamage(10, undefined), 10);
});

test('a block covers the front only', () => {
    // Facing right: an attacker to the right, or 45° off, is covered; behind isn't
    assert.equal(facingCovers('right', 30, 0), true);
    assert.equal(facingCovers('right', 30, 30), true);
    assert.equal(facingCovers('right', -30, 0), false);
    assert.equal(facingCovers('right', 0, 30), false); // 90° off, outside 70°
    assert.equal(facingCovers('down', 0, 30), true);
    assert.equal(facingCovers('up-left', -20, -20), true);
    assert.equal(facingCovers('down', 0, 0), true);
});

test('directionToward picks the eight-way facing', () => {
    assert.equal(directionToward(10, 0), 'right');
    assert.equal(directionToward(-10, 1), 'left');
    assert.equal(directionToward(0, 10), 'down');
    assert.equal(directionToward(1, -10), 'up');
    assert.equal(directionToward(10, 10), 'down-right');
    assert.equal(directionToward(-10, -10), 'up-left');
});

test('three presses in a row give jab, jab, cross; a pause or the cross starts again', () => {
    assert.deepEqual(PUNCH_COMBO, ['jab', 'jab', 'cross']);
    let step = nextComboStep(-1, 0);
    const thrown = [PUNCH_COMBO[step]];
    for (let i = 0; i < 3; i++) {
        step = nextComboStep(step, 100);
        thrown.push(PUNCH_COMBO[step]);
    }
    assert.deepEqual(thrown, ['jab', 'jab', 'cross', 'jab']);
    assert.equal(nextComboStep(0, COMBO_WINDOW_MS + 1), 0, 'too slow: back to a jab');
    assert.equal(nextComboStep(1, COMBO_WINDOW_MS), 2);
});

test('fleeing takes the open way most directly away, and none when cornered', () => {
    // Player to the left: run right
    const open = pickFleeHeading(10, 0, () => true);
    assert.ok(open.x > 0.99 && Math.abs(open.y) < 0.01);
    // Right is walled: slip along the wall (up or down), never back left
    const slide = pickFleeHeading(10, 0, (ux) => ux < 0.5);
    assert.ok(slide && slide.x >= -0.2 && Math.abs(slide.y) > 0.8);
    // Every way that isn't towards the player is blocked: cornered
    assert.equal(pickFleeHeading(10, 0, (ux) => ux < -0.5), null);
});

test('wiring: no mode toggle; right-click, F and the HUD buttons punch; Q and Block guard', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.doesNotMatch(game, /currentMode === 'jab'/, 'click no longer depends on a mode');
    assert.match(game, /pointer\.rightButtonDown\(\)[\s\S]{0,200}playerCombat\.attack\(\{ x: worldX, y: worldY \}\)/);
    assert.match(game, /disableContextMenu\(\)/);

    const player = readFileSync(join(js, 'core/player.js'), 'utf8');
    assert.match(player, /key === 'f'[\s\S]{0,120}playerCombat\.attack\(\)/);
    assert.match(player, /key === 'q'[\s\S]{0,120}playerCombat\.startBlock\(\)/);
    assert.match(player, /=== 'q'\) \{\s*window\.playerCombat\?\.endBlock\(\)/);
    assert.match(player, /playerCombat\?\.isBlocking\) \{\s*player\.body\.setVelocity\(0, 0\)/, 'no walking in guard');

    const hud = readFileSync(join(js, 'ui/hud.js'), 'utf8');
    assert.doesNotMatch(hud, /cycleMode/);
    assert.match(hud, /hud-punch-button/);
    assert.match(hud, /hud-block-button/);
    assert.match(hud, /addEventListener\('touchstart', blockOn, \{ passive: false \}\)/);

    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.doesNotMatch(inter, /setInteractionMode/);
});

test('wiring: NPC combat uses the style and the player block', () => {
    const npc = readFileSync(join(js, 'systems/npc-combat.js'), 'utf8');
    assert.match(npc, /styleFor\(npcId\)\.windupMs/);
    assert.match(npc, /npc-\$\{npcId\}-jab-\$\{direction\}/);
    assert.match(npc, /playerCombat\?\.isBlocking === true/);
    assert.doesNotMatch(npc.slice(npc.indexOf('canAttack(')), /this\.npcAttacking\.delete\(npcId\);/,
        'every attack ends through endAttack, which starts the recovery');

    const pc = readFileSync(join(js, 'systems/player-combat.js'), 'utf8');
    assert.match(pc, /npcCombat\?\.isGuarding\?\.\(npcId\)/);
    assert.match(pc, /!isKO && !armoured\) \{\s*applyKnockback/);
});

test('wiring: a punch waits out the recovery of the one before it, so the cross is reachable', () => {
    const pc = readFileSync(join(js, 'systems/player-combat.js'), 'utf8');
    // The cooldown that gates the next punch is the last punch's own (a jab's
    // short recovery), never the next punch's: the cross's long cooldown used
    // to outlast the combo window, so jab, jab, cross came out jab, jab, jab
    assert.match(pc, /recoveryAfterLastPunch\(\) \{[\s\S]*?interactionModes\[this\.currentPunch\]/);
    assert.match(pc, /canPunch\(\) \{[\s\S]*?this\.recoveryAfterLastPunch\(\)/);
    const cfg = readFileSync(join(js, 'config/combat-config.js'), 'utf8');
    const jabCooldown = Number(cfg.match(/jab: \{[\s\S]*?cooldown: (\d+)/)[1]);
    assert.ok(jabCooldown < COMBO_WINDOW_MS, 'a jab recovers inside the combo window');
    // Fists stay down under the title screen and other minigames
    assert.match(pc, /fightingPaused\(\) \{[\s\S]*?MinigameFramework\?\.currentMinigame/);
});

test('a guarded boss stays open long enough after its swing for the whole combo', () => {
    // Three presses ~0.4 s apart land at about 0, 0.4 and 0.8 s (confirmation playtest)
    assert.ok(resolveFightStyle('guarded').recoveryMs >= 900);
});
