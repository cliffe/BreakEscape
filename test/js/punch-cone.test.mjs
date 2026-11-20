// 7.1h (m07): the punch cone missed an attacker a little off the facing axis
// (±30°). Widened to ±40° (combat-config.js player.punchConeHalfAngle); the
// debug overlay draws the same cone.
// Run with: node --test test/js/punch-cone.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const configUrl = dataUrl(readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const src = readFileSync(join(js, 'systems/player-combat.js'), 'utf8')
    .split("'../config/combat-config.js'").join(`'${configUrl}'`)
    .split("'../utils/knockback.js'").join(`'${dataUrl('export function applyKnockback() {}')}'`)
    .split("'./fight-styles.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'))}'`)
    .split("'./interaction-walls.js'").join(`'${dataUrl(readFileSync(join(js, 'systems/interaction-walls.js'), 'utf8'))}'`);
const { PlayerCombat, punchConeHalfAngle } = await import(dataUrl(src));
const { COMBAT_CONFIG } = await import(configUrl);

const cone = PlayerCombat.prototype.isInCone;
// A target 30 px away at `deg` degrees off the facing direction 'right'
const at = (deg) => [Math.cos(deg * Math.PI / 180) * 30, Math.sin(deg * Math.PI / 180) * 30];

test('the cone is ±40° by default', () => {
    assert.equal(COMBAT_CONFIG.player.punchConeHalfAngle, 40);
    assert.equal(punchConeHalfAngle(), 40);
});

test('a target 35-40° off-axis is now hit; one at 45° still misses', () => {
    for (const deg of [0, 20, 35, 39, -39]) {
        assert.equal(cone(0, 0, ...at(deg), 'right', 32), true, `${deg}° should hit`);
    }
    for (const deg of [45, -45, 90, 180]) {
        assert.equal(cone(0, 0, ...at(deg), 'right', 32), false, `${deg}° should miss`);
    }
});

test('range still applies', () => {
    assert.equal(cone(0, 0, 40, 0, 'right', 32), false);
});

test('the debug overlay draws the same cone', () => {
    const combat = readFileSync(join(js, 'systems/player-combat.js'), 'utf8');
    assert.doesNotMatch(combat, /diff <= 30\b/);
    assert.match(combat, /const halfAngle = punchConeHalfAngle\(\)/);
});
