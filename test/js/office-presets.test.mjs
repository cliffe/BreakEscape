// systems/office-presets.js (OFFICE_LIFE_PLAN 2.1, slice 4): the resolver, the live adapter's
// listObjects/getObject through it, icons, the no-workstation rule, and the sims parity run.
// Run with: bin/test-js test/js/office-presets.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as presets from '../../public/break_escape/js/systems/office-presets.js';
import { resolveAffordance, presetIdFor, setOfficePresetTable, spriteAffordance, spritePreset, loadOfficePresets } from '../../public/break_escape/js/systems/office-presets.js';
import { NPCNeedsSystem, createEngineWorld } from '../../public/break_escape/js/systems/npc-needs.js';
import { targetInfo } from '../../public/break_escape/js/systems/npc-action-icons.js';
import { WorkstationState, isWorkstation } from '../../public/break_escape/js/systems/workstation-state.js';
import { runSimsDay, makeSimsWorld, PRESET_OBJECTS } from './fixtures/needs-sims-world.mjs';

const TABLE = JSON.parse(readFileSync(new URL('../../public/break_escape/js/data/office-presets.json', import.meta.url), 'utf8'));
setOfficePresetTable(TABLE);
const ON = { officePresets: true };
const OFF = {};

// ── the resolver ─────────────────────────────────────────────────────────────

test('exact type match only: pc, coffee_station1, kettle1 get presets; prefixes and near-misses do not', () => {
    assert.equal(presetIdFor({ id: 'a', type: 'pc' }), 'desk_pc');
    assert.equal(presetIdFor({ id: 'a', type: 'laptop' }), 'desk_pc');
    assert.equal(presetIdFor({ id: 'a', type: 'coffee_station1' }), 'coffee');
    assert.equal(presetIdFor({ id: 'a', type: 'kettle1' }), 'coffee');
    assert.equal(presetIdFor({ id: 'a', type: 'water_cooler1' }), 'cooler');
    assert.equal(presetIdFor({ id: 'a', type: 'pc6' }), null);
    assert.equal(presetIdFor({ id: 'a', type: 'laptop6' }), null);
    assert.equal(presetIdFor({ id: 'a', type: 'phone1' }), null);
    const pc = resolveAffordance({ id: 'tom_pc', type: 'pc' }, ON);
    assert.deepEqual(pc, { satisfies: 'work', restores: 60, useSeconds: 10, capacity: 1 });
    const kettle = resolveAffordance({ id: 'k', type: 'kettle1' }, ON);
    assert.deepEqual(kettle.useFrom, { dx: 0, dy: 1 });
    assert.equal(kettle.useSound, 'drink_gulp', 'default use sound comes from the preset');
    assert.equal(resolveAffordance({ id: 'f', type: 'qdc_fridge1' }, ON).useSound, 'eat_snack');
});

test('officeType wins over type; an unknown officeType gets no preset', () => {
    assert.equal(presetIdFor({ id: 'p', type: 'phone1', officeType: 'desk_phone' }), 'desk_phone');
    assert.equal(presetIdFor({ id: 'p', type: 'pc', officeType: 'filing' }), 'filing');
    assert.equal(resolveAffordance({ id: 'f', type: 'filing_cabinet', officeType: 'filing' }, ON).useSound, 'drawer_open');
    assert.equal(presetIdFor({ id: 'p', type: 'pc', officeType: 'nope' }), null);
    assert.equal(resolveAffordance({ id: 'p', type: 'pc', officeType: 'nope' }, ON), null);
});

test('exclusions: takeable, lockType, affordance false, no id, decor', () => {
    assert.equal(resolveAffordance({ id: 'phone', type: 'pc', takeable: true }, ON), null);
    assert.equal(resolveAffordance({ id: 'term', type: 'pc', lockType: 'password' }, ON), null);
    assert.equal(resolveAffordance({ id: 'x', type: 'pc', affordance: false }, ON), null);
    assert.equal(resolveAffordance({ id: 'x', type: 'pc', officeType: 'desk_pc', affordance: false }, ON), null);
    assert.equal(resolveAffordance({ type: 'pc' }, ON), null);
    assert.equal(resolveAffordance({ id: 'cup', type: 'coffee_station1', decor: true }, ON), null);
    // A takeable object keeps its own affordance; only the preset is withheld
    assert.deepEqual(resolveAffordance({ id: 'x', type: 'pc', takeable: true, affordance: { satisfies: 'work' } }, ON), { satisfies: 'work' });
});

test('a decor-shaped sprite (synthetic scenarioData, no id) resolves to no affordance', () => {
    // core/rooms.js gives an unreserved Tiled laptop6.png { name, type: 'laptop', takeable: false }
    const decor = { name: 'laptop', type: 'laptop', takeable: false, readable: false };
    assert.equal(resolveAffordance(decor, ON), null);
    assert.equal(spriteAffordance({ scenarioData: decor }, ON), null);
});

test('own fields win field by field; useFrom is replaced whole; the table is not mutated', () => {
    const a = resolveAffordance({ id: 'c', type: 'water_cooler1', affordance: { useSeconds: 20 } }, ON);
    assert.deepEqual(a, { satisfies: ['thirst', 'social'], restores: 70, useSeconds: 20, capacity: 2, useFrom: { dx: 0, dy: 1 }, useSound: 'drink_gulp', chatter: 'cooler' });
    const b = resolveAffordance({ id: 'k', type: 'kettle1', affordance: { useFrom: { dx: 1, dy: 0 }, useSound: 'page_turn' } }, ON);
    assert.deepEqual(b.useFrom, { dx: 1, dy: 0 });
    assert.equal(b.useSound, 'page_turn');
    a.satisfies.push('x');
    assert.deepEqual(TABLE.presets.cooler.affordance.satisfies, ['thirst', 'social']);
});

test('switch off: the authored affordance is returned as it is (same object), and type-only objects get none', () => {
    const own = { satisfies: 'work', useSeconds: 3 };
    assert.equal(resolveAffordance({ id: 'x', type: 'pc', affordance: own }, OFF), own);
    assert.equal(resolveAffordance({ id: 'x', type: 'pc' }, OFF), null);
    assert.equal(resolveAffordance({ id: 'x', type: 'pc', officeType: 'desk_pc' }, { officePresets: 'yes' }), null);
});

test('no table loaded: nothing gains a preset', () => {
    assert.equal(resolveAffordance({ id: 'x', type: 'pc' }, ON, null), null);
});

test('loadOfficePresets fetches js/data/office-presets.json next to the module', async () => {
    const seen = [];
    setOfficePresetTable(null);
    const t = await loadOfficePresets(async (url) => { seen.push(url); return { ok: true, json: async () => TABLE }; });
    assert.equal(t, TABLE);
    assert.match(seen[0], /\/js\/data\/office-presets\.json$/);
    assert.equal(presetIdFor({ id: 'a', type: 'pc' }), 'desk_pc');
});

test('spriteAffordance caches on the sprite and clears when the switch is off', () => {
    const sp = { scenarioData: { id: 'tom_pc', type: 'pc' } };
    const a = spriteAffordance(sp, ON);
    assert.equal(spriteAffordance(sp, ON), a, 'cached');
    assert.equal(spritePreset(sp, ON), 'desk_pc');
    sp.scenarioData.affordance = { useSeconds: 4 };   // authored field changed (a script)
    assert.equal(spriteAffordance(sp, ON).useSeconds, 4);
    assert.equal(spriteAffordance(sp, OFF).useSeconds, 4, 'off: authored only');
    assert.equal(sp._officeAffordance, null);
    delete sp.scenarioData.affordance;
    assert.equal(spriteAffordance(sp, OFF), null);
});

// ── the live adapter, icons, workstations ────────────────────────────────────

function stubWindow(scenario) {
    const sprite = (sd, x, y) => ({ scenarioData: sd, x, y, width: 32, height: 32, originX: 0, originY: 0, visible: true, active: true, scene: {} });
    const rooms = {
        office: {
            objects: {
                tom_pc: sprite({ id: 'tom_pc', type: 'pc' }, 64, 64),
                laptop6_decor: sprite({ name: 'laptop', type: 'laptop', takeable: false }, 128, 64),
                coffee: sprite({ id: 'coffee', type: 'coffee_station1', affordance: { useFrom: { dx: -1, dy: 0 } } }, 200, 64),
                terminal: sprite({ id: 'terminal', type: 'pc', lockType: 'password' }, 300, 64),
                sofa_out: sprite({ id: 'sofa_out', type: 'leather_sofa1', affordance: false }, 300, 200),
                mugs: sprite({ id: 'mugs', type: 'dirty_mugs1', takeable: true, needsTag: 'dirty_mugs' }, 100, 200)
            }
        }
    };
    globalThis.window = { rooms, gameScenario: scenario, officePresets: presets };
    return rooms;
}

test('live adapter: listObjects includes a preset-only object, never decor, locked or opted-out ones', () => {
    stubWindow({ officePresets: true });
    const world = createEngineWorld();
    const ids = world.listObjects().map(o => o.id).sort();
    assert.deepEqual(ids, ['coffee', 'mugs', 'tom_pc']);
    const pc = world.getObject('tom_pc');
    assert.equal(pc.affordance.satisfies, 'work');
    const coffee = world.getObject('coffee');
    assert.deepEqual(coffee.affordance.useFrom, { dx: -1, dy: 0 }, 'own useFrom wins');
    assert.equal(coffee.affordance.useSound, 'drink_gulp', 'preset default sound reaches getObject (office visuals read it there)');
    delete globalThis.window;
});

test('live adapter with presets off (or no resolver installed): unchanged', () => {
    stubWindow({});
    let world = createEngineWorld();
    assert.deepEqual(world.listObjects().map(o => o.id).sort(), ['coffee', 'mugs']);
    assert.equal(world.getObject('tom_pc').affordance, null);
    globalThis.window.officePresets = null;
    globalThis.window.gameScenario = { officePresets: true };
    world = createEngineWorld();
    assert.deepEqual(world.listObjects().map(o => o.id).sort(), ['coffee', 'mugs']);
    delete globalThis.window;
});

test('action icons: targetInfo sees a preset satisfies', () => {
    stubWindow({ officePresets: true });
    assert.equal(targetInfo('tom_pc').satisfies, 'work');
    assert.equal(targetInfo('coffee').satisfies, 'caffeine');
    globalThis.window.gameScenario = {};
    globalThis.window.rooms.office.objects.tom_pc._officeAffordance = null;
    assert.equal(targetInfo('tom_pc').satisfies, undefined);
    delete globalThis.window;
});

test('a preset pc is not a workstation: no _owner_away global after its owner leaves', () => {
    const sd = { id: 'tom_pc', type: 'pc' };
    assert.equal(isWorkstation(sd), false);
    // even with the resolved affordance merged in, nothing makes it one
    assert.equal(isWorkstation({ ...sd, affordance: resolveAffordance(sd, ON) }), false);
    const globals = {}; const handlers = {};
    new WorkstationState({
        objects: () => [sd],
        npcs: () => [{ id: 'tom', needsHome: 'tom_pc' }],
        on: (p, cb) => { handlers[p] = cb; },
        emit: () => {},
        setGlobal: (k, v) => { globals[k] = v; },
        roll: () => 0
    }).install();
    handlers['npc_left_post:*']?.({ npcId: 'tom' });
    assert.equal(globals.tom_pc_owner_away, undefined);
    assert.equal(globals.tom_pc_screen_locked, undefined);
});

// ── parity on the sims fixture ───────────────────────────────────────────────

const countFields = objs => objs.reduce((n, o) => n + (o.affordance && typeof o.affordance === 'object' ? Object.keys(o.affordance).length : 0), 0);

test('parity: the sims day with presets plus the listed overrides makes the same decisions', () => {
    const resolve = o => resolveAffordance(o, ON, TABLE);
    const a = runSimsDay(NPCNeedsSystem, { minutes: 15 });
    const b = runSimsDay(NPCNeedsSystem, { minutes: 15, presets: { resolve } });
    assert.equal(JSON.stringify(b.sys.getLog()), JSON.stringify(a.sys.getLog()));
    // 15 minutes: 43 uses at nine objects (the fridge and kitchen coffee are chosen against, not
    // used, in this script; the memo beat that sends Tom to the kitchen is not in it)
    const used = a.sys.getLog().filter(e => e.ev === 'used');
    assert.ok(used.length >= 40, `uses ${used.length}`);
    assert.equal(new Set(used.map(e => e.target)).size, 9);
    // The preset copy is authored with fewer fields (guard against overrides creeping back)
    const orig = makeSimsWorld().objs;
    const pre = makeSimsWorld({ presets: { resolve } }).objs;
    assert.ok(countFields(pre) < countFields(orig) / 2, `fields ${countFields(orig)} -> ${countFields(pre)}`);
    // The remaining overrides are exactly the plan's list (plus slice 2a's private PCs and the kettle)
    const withOwn = Object.entries(PRESET_OBJECTS).filter(([, p]) => 'affordance' in p).map(([id]) => id).sort();
    assert.deepEqual(withOwn, ['amara_pc', 'grace_laptop', 'kitchen_coffee', 'lounge_kettle', 'office_coffee', 'rosa_laptop', 'sanjay_pc', 'tom_pc', 'washing_up_tray']);
    // Each resolved affordance carries every authored field of the original
    const origById = Object.fromEntries(orig.map(o => [o.id, o]));
    for (const o of pre) {
        const want = origById[o.id].affordance || null;
        const got = resolve(o);
        if (!want) { assert.equal(got, null, o.id); continue; }
        for (const [k, v] of Object.entries(want)) assert.deepEqual(got[k], v, `${o.id}.${k}`);
    }
});
