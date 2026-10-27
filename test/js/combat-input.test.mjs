// 7.1i (m06, m05 M5): interacting with a hostile NPC shows "He's past
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
const { pastTalkingMessage, showPastTalkingToast } =
    await import(pathToFileURL(join(dir, 'combat-input.mjs')).href);

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

test('wiring: interactions.js shows the toast', () => {
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(inter, /import \{ showPastTalkingToast \} from '\.\/combat-input\.js'/);
    assert.equal((inter.match(/showPastTalkingToast\((sprite\.npcId|npcId)\)/g) || []).length, 2,
                 'both hostile paths: a click and the E key');
});
