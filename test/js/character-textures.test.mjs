// Character atlases are loaded only for the characters a scenario uses (2026-10-04).
// All 40+ atlases used to be preloaded for every mission: about 7 MB of texture
// memory each once decoded, ~290 MB in all, enough for mobile Safari to kill the
// tab. The server now sends the keys as characterSprites in the bootstrap scenario
// (Game#filtered_scenario_for_bootstrap, test/models/.../filtered_scenario_test.rb);
// standalone mode walks rooms[*].npcs instead. ensureCharacterTexture is the
// runtime fallback and must wait for its own file, not the shared loader's 'complete'.
// Run with: node --test test/js/character-textures.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const warnings = [];
const realWarn = console.warn;
console.warn = (msg) => warnings.push(String(msg));
console.log = () => {};

const src = readFileSync(join(js, 'systems/character-textures.js'), 'utf8')
    .split("'../config.js'").join(`'${dataUrl("export const ASSETS_VERSION = 'test';")}'`);
const {
    collectCharacterSprites, queueCharacterAtlases, ensureCharacterTexture, ensureCharacterTextures
} = await import(dataUrl(src));

const fullScenario = () => ({
    player: { id: 'player', spriteSheet: 'female_hacker_hood_v2' },
    rooms: {
        lobby: {
            npcs: [
                { id: 'guard', npcType: 'person', spriteSheet: 'male_security_guard_v2' },
                { id: 'guard2', npcType: 'person', spriteSheet: 'male_security_guard_v2' },
                { id: 'plain', npcType: 'person' },
                { id: 'handler', npcType: 'phone', spriteSheet: 'male_spy_v2' },
                { id: 'untyped', spriteSheet: 'male_nerd_v2' }
            ]
        },
        office: {
            npcs: [{ id: 'manager', npcType: 'both', spriteSheet: 'female_office_worker_v2' }]
        },
        empty: {},
        hall: null
    }
});

test('walks rooms for person and both NPCs, defaults to hacker, adds the player once', () => {
    assert.deepEqual(collectCharacterSprites(fullScenario()),
        ['male_security_guard_v2', 'hacker', 'female_office_worker_v2', 'female_hacker_hood_v2']);
});

test('phone and untyped NPCs get no world sprite, so their sheets are left out', () => {
    const keys = collectCharacterSprites(fullScenario());
    assert.ok(!keys.includes('male_spy_v2'));
    assert.ok(!keys.includes('male_nerd_v2'));
});

test('the player sheet is not duplicated when an NPC shares it', () => {
    const scenario = fullScenario();
    scenario.rooms.office.npcs.push({ id: 'double', npcType: 'person', spriteSheet: 'female_hacker_hood_v2' });
    const keys = collectCharacterSprites(scenario);
    assert.equal(keys.filter(k => k === 'female_hacker_hood_v2').length, 1);
});

test("prefers the server's characterSprites list (the bootstrap payload has no NPCs)", () => {
    const scenario = { ...fullScenario(), characterSprites: ['bed_ms_chen', 'female_nurse1_v2', 'bed_ms_chen'] };
    assert.deepEqual(collectCharacterSprites(scenario), ['bed_ms_chen', 'female_nurse1_v2']);
    assert.deepEqual(collectCharacterSprites({ characterSprites: [], rooms: fullScenario().rooms }), []);
});

test('copes with no scenario, no rooms and no player', () => {
    assert.deepEqual(collectCharacterSprites(null), []);
    assert.deepEqual(collectCharacterSprites({}), []);
    assert.deepEqual(collectCharacterSprites({ rooms: { a: { npcs: 'bad' } } }), []);
});

// A stand-in for Phaser's scene loader and texture manager, with the 3.60 event names:
// an atlas is an AtlasJSONFile MultiFile of type 'atlasjson', which emits
// 'filecomplete-atlasjson-<key>' once its texture is added; a failed part emits
// 'loaderror' with that part (whose key is the atlas key).
function fakeScene({ loaded = [], loading = false } = {}) {
    const textures = new Set(loaded);
    const handlers = new Map();
    const queued = [];
    let starts = 0;
    let isLoading = loading;
    const load = {
        atlas(key, png, json) { queued.push({ key, png, json }); },
        on(evt, fn) { (handlers.get(evt) || handlers.set(evt, new Set()).get(evt)).add(fn); },
        off(evt, fn) { handlers.get(evt)?.delete(fn); },
        emit(evt, ...args) { [...(handlers.get(evt) || [])].forEach(fn => fn(...args)); },
        isLoading: () => isLoading,
        start() { starts++; isLoading = true; }
    };
    return {
        textures: { exists: (key) => textures.has(key) },
        load,
        queued,
        get starts() { return starts; },
        listenerCount: () => [...handlers.values()].reduce((n, s) => n + s.size, 0),
        finish(key) { textures.add(key); load.emit(`filecomplete-atlasjson-${key}`, key, 'atlasjson'); },
        fail(key) { load.emit('loaderror', { key, src: `characters/${key}.png` }); }
    };
}

test('queueCharacterAtlases queues unloaded keys once, with ASSETS_VERSION, and does not start', () => {
    const scene = fakeScene({ loaded: ['hacker'] });
    queueCharacterAtlases(scene, ['female_spy_v2', 'hacker', 'female_spy_v2', undefined]);
    assert.deepEqual(scene.queued, [{
        key: 'female_spy_v2',
        png: 'characters/female_spy_v2.png?v=test',
        json: 'characters/female_spy_v2.json?v=test'
    }]);
    assert.equal(scene.starts, 0);
});

test('ensureCharacterTexture returns at once for a loaded texture, with no warning', async () => {
    warnings.length = 0;
    const scene = fakeScene({ loaded: ['male_spy_v2'] });
    assert.equal(await ensureCharacterTexture(scene, 'male_spy_v2'), true);
    assert.equal(scene.queued.length, 0);
    assert.equal(warnings.length, 0);
});

test('a missed key loads on demand, warns, and concurrent callers share one load', async () => {
    warnings.length = 0;
    const scene = fakeScene();
    const a = ensureCharacterTexture(scene, 'sarah_kim');
    const b = ensureCharacterTexture(scene, 'sarah_kim');
    assert.equal(a, b);
    assert.equal(scene.queued.length, 1);
    assert.equal(scene.starts, 1);
    assert.match(warnings[0], /character atlas "sarah_kim" was not preloaded; loading on demand/);

    // Another file finishing on the shared loader must not resolve this one
    let settled = false;
    a.then(() => { settled = true; });
    scene.load.emit('complete');
    scene.load.emit('filecomplete-atlasjson-other', 'other', 'atlasjson');
    await new Promise(r => setImmediate(r));
    assert.equal(settled, false);

    scene.finish('sarah_kim');
    assert.equal(await a, true);
    assert.equal(scene.listenerCount(), 0, 'listeners are removed once the file completes');
});

test('does not restart a loader that is already running', async () => {
    const scene = fakeScene({ loading: true });
    const p = ensureCharacterTexture(scene, 'ravi_anand');
    assert.equal(scene.starts, 0);
    scene.finish('ravi_anand');
    assert.equal(await p, true);
});

test("a failed load resolves false, ignoring other files' errors", async () => {
    warnings.length = 0;
    const scene = fakeScene();
    const p = ensureCharacterTexture(scene, 'no_such_key');
    scene.fail('someone_else');
    scene.fail('no_such_key');
    assert.equal(await p, false);
    assert.ok(warnings.some(w => /"no_such_key" failed to load/.test(w)));
    assert.equal(scene.listenerCount(), 0);
});

test('the player sprite switch is an expected load, not a missed preload', async () => {
    warnings.length = 0;
    const scene = fakeScene();
    const p = ensureCharacterTexture(scene, 'male_nerd_v2', { expected: true });
    scene.finish('male_nerd_v2');
    assert.equal(await p, true);
    assert.equal(warnings.length, 0);
});

test('ensureCharacterTextures waits for every key', async () => {
    const scene = fakeScene({ loaded: ['hacker'] });
    const p = ensureCharacterTextures(scene, ['hacker', 'amy_clarke', 'helen_carver', 'amy_clarke']);
    assert.equal(scene.queued.length, 2);
    scene.finish('amy_clarke');
    scene.finish('helen_carver');
    assert.deepEqual(await p, [true, true, true]);
});

test('game.js preloads no character atlases but keeps the frame-based sheets', () => {
    const game = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.doesNotMatch(game, /this\.load\.atlas\(/);
    for (const key of ['hacker', 'hacker-red', 'bed2', 'bed_mr_pryce', 'bed_ms_chen']) {
        assert.match(game, new RegExp(`this\\.load\\.spritesheet\\('${key}'`), key);
    }
    // The scenario hook must be registered before the scenario JSON is queued
    assert.ok(game.indexOf("'filecomplete-json-gameScenarioJSON'") < game.indexOf("this.load.json('gameScenarioJSON'"));
});

test.after(() => { console.warn = realWarn; });
