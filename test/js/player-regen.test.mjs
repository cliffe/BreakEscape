// Slow HP regen out of combat (m04 playtest; m07 blind run A "Player HP never
// recovers"): after delayMs with no damage, +hpPerTick every tickMs, capped at
// capFraction of max HP. A scenario's playerRegen overrides or turns it off.
// Run with: node --test test/js/player-regen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'player-regen-'));
writeFileSync(join(dir, 'player-regen.mjs'), readFileSync(join(js, 'systems/player-regen.js'), 'utf8'));
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
const { resolveRegenConfig, regenAmount, startPlayerRegen } =
    await import(pathToFileURL(join(dir, 'player-regen.mjs')).href);
const { COMBAT_CONFIG } = await import(pathToFileURL(join(dir, 'combat-config.mjs')).href);
const DEF = COMBAT_CONFIG.player.regen;

test('defaults are modest: 10 s out of combat, 1 HP every 2 s, up to half HP', () => {
    assert.deepEqual(DEF, { delayMs: 10000, tickMs: 2000, hpPerTick: 1, capFraction: 0.5 });
});

test('a scenario overrides the defaults or turns regen off', () => {
    assert.deepEqual(resolveRegenConfig(undefined, DEF), DEF);
    assert.equal(resolveRegenConfig(false, DEF), null);
    assert.equal(resolveRegenConfig({ enabled: false }, DEF), null);
    assert.equal(resolveRegenConfig({ hpPerTick: 0 }, DEF), null, 'zero heal is off');
    const c = resolveRegenConfig({ delayMs: 5000, capFraction: 0.8, hpPerTick: 'x' }, DEF);
    assert.equal(c.delayMs, 5000);
    assert.equal(c.capFraction, 0.8);
    assert.equal(c.hpPerTick, 1, 'nonsense ignored');
    assert.equal(resolveRegenConfig({ capFraction: 3 }, DEF).capFraction, 1);
});

test('no regen while the last hit is recent, or when KO', () => {
    const base = { hp: 30, maxHP: 100, ko: false, lastHitAt: 1000, config: DEF };
    assert.equal(regenAmount({ ...base, now: 1000 + 9999 }), 0);
    assert.equal(regenAmount({ ...base, now: 1000 + 10000 }), 1);
    assert.equal(regenAmount({ ...base, now: 99999, ko: true }), 0);
    assert.equal(regenAmount({ ...base, now: 99999, hp: 0 }), 0);
});

test('regen stops at the cap, so coffee still matters above it', () => {
    const base = { maxHP: 100, ko: false, lastHitAt: 0, now: 60000 };
    assert.equal(regenAmount({ ...base, hp: 49, config: DEF }), 1);
    assert.equal(regenAmount({ ...base, hp: 50, config: DEF }), 0);
    assert.equal(regenAmount({ ...base, hp: 80, config: DEF }), 0);
    assert.equal(regenAmount({ ...base, hp: 48, config: { ...DEF, hpPerTick: 5 } }), 2, 'never overshoots');
});

test('the timer heals, and a hit restarts the delay', async () => {
    const listeners = {};
    const disp = { on: (e, f) => { listeners[e] = f; }, off: (e) => { delete listeners[e]; } };
    let hp = 20;
    const health = { getHP: () => hp, getMaxHP: () => 100, isKO: () => false, heal: (n) => { hp += n; } };
    const r = startPlayerRegen({ scenario: { playerRegen: { delayMs: 30, tickMs: 10, hpPerTick: 2 } },
        defaults: DEF, eventDispatcher: disp, hpEvent: 'hp', getHealth: () => health });
    await new Promise(res => setTimeout(res, 120));
    assert.ok(hp > 20, `healed to ${hp}`);
    listeners.hp({ delta: -10 });
    const atHit = hp;
    await new Promise(res => setTimeout(res, 15));
    assert.equal(hp, atHit, 'no heal straight after a hit');
    r.stop();
    assert.equal(listeners.hp, undefined, 'listener removed');
});

test('wiring: game.js starts regen after player health with the scenario', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(game, /import \{ startPlayerRegen \} from '\.\.\/systems\/player-regen\.js'/);
    assert.match(game, /startPlayerRegen\(\{ scenario: gameScenario, defaults: COMBAT_CONFIG\.player\.regen/);
});
