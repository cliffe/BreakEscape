// 7.1i (m06, m05 M5): in fists mode a click on open floor walks (it punched
// the air before), and interacting with a hostile NPC shows "He's past
// talking." (gender-neutral when the NPC has no gender information).
// Run with: node --test test/js/combat-input.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'combat-input-'));
writeFileSync(join(dir, 'combat-input.mjs'), readFileSync(join(js, 'systems/combat-input.js'), 'utf8'));
const { fistsClickPunches, pastTalkingMessage, showPastTalkingToast, FISTS_PUNCH_CLICK_RADIUS } =
    await import(pathToFileURL(join(dir, 'combat-input.mjs')).href);

test('fists mode: a click on an NPC or beside the player punches', () => {
    assert.equal(fistsClickPunches({ dx: 300, dy: 0, onNPC: true }), true);
    assert.equal(fistsClickPunches({ dx: 20, dy: 20, onNPC: false }), true);
    assert.equal(fistsClickPunches({ dx: FISTS_PUNCH_CLICK_RADIUS, dy: 0, onNPC: false }), true);
});

test('fists mode: a click on open floor walks', () => {
    assert.equal(fistsClickPunches({ dx: 200, dy: 0, onNPC: false }), false);
    assert.equal(fistsClickPunches({ dx: 50, dy: 50, onNPC: false }), false);
});

test('the toast uses the NPC gender, else the sprite sheet, else is neutral', () => {
    assert.equal(pastTalkingMessage({ gender: 'male' }), "He's past talking.");
    assert.equal(pastTalkingMessage({ gender: 'female', spriteSheet: 'male_spy_v2' }), "She's past talking.");
    assert.equal(pastTalkingMessage({ spriteSheet: 'female_security_guard_v2' }), "She's past talking.");
    assert.equal(pastTalkingMessage({ spriteSheet: 'male_office_worker_v2' }), "He's past talking.");
    assert.equal(pastTalkingMessage({ spriteSheet: 'netherton' }), "They're past talking.");
    assert.equal(pastTalkingMessage({ gender: 'nonbinary' }), "They're past talking.");
    assert.equal(pastTalkingMessage(null), "They're past talking.");
});

test('the toast shows at most once every 3 s', () => {
    const shown = [];
    const notify = (...a) => shown.push(a);
    const npc = { spriteSheet: 'male_spy_v2' };
    assert.equal(showPastTalkingToast('torres', { notify, npc, now: 10_000 }), true);
    assert.equal(showPastTalkingToast('torres', { notify, npc, now: 11_000 }), false);
    assert.equal(showPastTalkingToast('torres', { notify, npc, now: 13_500 }), true);
    assert.equal(shown.length, 2);
    assert.equal(shown[0][0], "He's past talking.");
    assert.equal(shown[0][1], 'warning');
});

test('wiring: game.js walks on an open-floor fists click; interactions.js shows the toast', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    const fists = game.slice(game.indexOf("if (currentMode === 'jab' || currentMode === 'cross') {"));
    const walkAt = fists.indexOf('fistsClickPunches(');
    const punchAt = fists.indexOf('window.playerCombat.punch()');
    assert.ok(walkAt > 0 && walkAt < punchAt, 'the walk check runs before the punch');
    assert.match(fists.slice(walkAt, punchAt), /movePlayerToPoint\(worldX, worldY\);\s*startHoldWalk\(\);/);

    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(inter, /import \{ showPastTalkingToast \} from '\.\/combat-input\.js'/);
    assert.equal((inter.match(/showPastTalkingToast\((sprite\.npcId|npcId)\)/g) || []).length, 2,
                 'both hostile paths: a click and the E key');
});
