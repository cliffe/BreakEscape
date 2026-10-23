// m05 E6 (user 2026-10-17): player HP survives a reload. It lived only in the
// page, so a reload mid-fight was a free full heal. player-health.js exports
// { hp, maxHP } (state-sync.js playerHealth), game.js restores it from
// savedPlayerHealth, a save at 0 HP comes back as full health, and the KO
// screen's Restart resets it before it syncs and reloads.
// Server side: Game#merge_player_health!, test/controllers/.../reload_persistence_test.rb.
// Run with: node --test test/js/player-health-persistence.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'player-health-persistence-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('config/combat-config.js', 'combat-config.mjs');
copy('events/combat-events.js', 'combat-events.mjs');
copy('systems/player-damage-interrupt.js', 'interrupt.mjs');
copy('systems/player-health.js', 'player-health.mjs', s => s
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'../events/combat-events.js'", "'./combat-events.mjs'")
    .replace("'./player-damage-interrupt.js'", "'./interrupt.mjs'"));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const quiet = fn => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };
const { initPlayerHealth } = await import(pathToFileURL(join(dir, 'player-health.mjs')).href);
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

test('export gives the current HP; a hit lowers it', () => {
    const h = quiet(() => initPlayerHealth());
    assert.deepEqual(h.exportState(), { hp: 100, maxHP: 100 });
    quiet(() => h.damage(36));
    assert.deepEqual(h.exportState(), { hp: 64, maxHP: 100 });
});

test('restore brings back hurt HP', () => {
    const h = quiet(() => initPlayerHealth());
    assert.equal(quiet(() => h.restore({ hp: 48, maxHP: 100 })), true);
    assert.equal(h.getHP(), 48);
    assert.equal(h.isKO(), false);
});

test('a save at 0 HP, a full save or a bad one restores full health', () => {
    for (const saved of [{ hp: 0, maxHP: 100 }, { hp: 100, maxHP: 100 }, { hp: 120, maxHP: 100 },
                         { hp: -3, maxHP: 100 }, { hp: 'x', maxHP: 100 }, { hp: 10, maxHP: 0 }, null, 'yes']) {
        const h = quiet(() => initPlayerHealth());
        assert.equal(quiet(() => h.restore(saved)), false, JSON.stringify(saved));
        assert.equal(h.getHP(), 100);
        assert.equal(h.isKO(), false);
    }
});

test('a save made under a different max HP keeps its fraction', () => {
    const h = quiet(() => initPlayerHealth());
    quiet(() => h.restore({ hp: 30, maxHP: 60 }));
    assert.equal(h.getHP(), 50);
});

test('state-sync sends playerHealth when it changes, not when it does not', () => {
    const h = quiet(() => initPlayerHealth());
    globalThis.window.playerHealth = h;
    const sync = new StateSync();
    const first = sync.buildChanges();
    assert.deepEqual(first.body.playerHealth, { hp: 100, maxHP: 100 });
    sync.confirm(first);
    assert.equal(sync.buildChanges(), null, 'nothing changed');
    quiet(() => h.damage(20));
    assert.deepEqual(sync.buildChanges().body.playerHealth, { hp: 80, maxHP: 100 });
    delete globalThis.window.playerHealth;
});

test('the unload flush keeps playerHealth when it trims an oversized body', () => {
    const src = readFileSync(join(js, 'state-sync.js'), 'utf8');
    const flush = src.slice(src.indexOf('  flush() {'));
    const trims = flush.match(/JSON\.stringify\(\{ globalVariables[^}]*\}\)/g);
    assert.equal(trims.length, 2);
    for (const t of trims) assert.match(t, /playerHealth/);
});

test('game.js restores savedPlayerHealth and shows it in the hearts', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    const initAt = game.indexOf('window.playerHealth = initPlayerHealth()');
    const restoreAt = game.indexOf('window.playerHealth.restore(gameScenario.savedPlayerHealth)');
    const uiAt = game.indexOf('window.healthUI = new HealthUI()');
    const showAt = game.indexOf('window.healthUI.updateHP(window.playerHealth.getHP()');
    assert.ok(initAt > 0 && restoreAt > initAt && uiAt > restoreAt && showAt > uiAt);
});

test('Restart resets HP before it syncs and reloads', () => {
    const screen = readFileSync(join(js, 'ui/game-over-screen.js'), 'utf8');
    const restart = screen.slice(screen.indexOf('async restart() {'), screen.indexOf('mainMenu() {'));
    const resetAt = restart.indexOf('window.playerHealth.reset()');
    const syncAt = restart.indexOf('window.stateSync.sync()');
    const reloadAt = restart.indexOf('window.location.href = url.toString()');
    assert.ok(resetAt > 0 && syncAt > resetAt && reloadAt > syncAt);
    assert.doesNotMatch(restart, /reset\.length && window\.stateSync/, 'the sync runs even when no NPC was reset');
});
