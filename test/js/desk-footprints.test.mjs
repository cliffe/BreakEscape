// Desk footprint collision boxes (systems/desk-footprints.js; SEAT_BOX_PLAN.md slice 2):
// deskBoxOf, mapProperty, the box mode and the body applyTableBody gives, the rooms.js
// wiring, the shipped data, and the validator's legacy-map line on the same fixture maps.
// Run with: node test/js/desk-footprints.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mapProperty, deskBoxModeFor, deskBoxOf, legacyTableBox, tableBodyBox }
    from '../../public/break_escape/js/systems/desk-footprints.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const fixtures = join(here, 'fixtures/desk_boxes');
const fixture = (name) => JSON.parse(readFileSync(join(fixtures, name), 'utf8'));

const DATA = {
    version: 1,
    sprites: {
        desk1: { foot: 16, source: 'experiment' },
        smalldesk1: { foot: 27, source: 'measured' },
        padded: { foot: 10, floor: 36, x: [4, 60], source: 'hand' },
        racky: { foot: 12 }
    },
    legacyBox: ['racky', 'batrack']
};
const sprite = (key, w, h, extra = {}) => ({ texture: { key }, width: w, height: h, ...extra });

test('deskBoxOf: an entry gives F - foot .. F across the full width', () => {
    assert.deepEqual(deskBoxOf(sprite('desk1', 78, 39), DATA), { x: 0, y: 23, w: 78, h: 16 });
    assert.deepEqual(deskBoxOf(sprite('smalldesk1', 50, 41), DATA), { x: 0, y: 14, w: 50, h: 27 });
});

test('deskBoxOf: no entry, legacyBox, rotation and scale give null (fallback)', () => {
    assert.equal(deskBoxOf(sprite('bookcase', 40, 60), DATA), null);
    assert.equal(deskBoxOf(sprite('racky', 40, 60), DATA), null, 'legacyBox wins over an entry');
    assert.equal(deskBoxOf(sprite('desk1', 78, 39, { rotation: Math.PI / 2 }), DATA), null);
    assert.equal(deskBoxOf(sprite('desk1', 78, 39, { scaleX: 2, scaleY: 2 }), DATA), null);
    assert.equal(deskBoxOf(sprite('desk1', 78, 39, { scaleY: 0.5 }), DATA), null);
    assert.equal(deskBoxOf(sprite('desk1', 78, 39), null), null, 'no data loaded');
    assert.equal(deskBoxOf(sprite('desk1', 78, 39), { sprites: { desk1: { source: 'x' } } }), null, 'no foot');
});

test('deskBoxOf: floor padding and x span, mirrored under flipX', () => {
    assert.deepEqual(deskBoxOf(sprite('padded', 64, 40), DATA), { x: 4, y: 26, w: 56, h: 10 });
    assert.deepEqual(deskBoxOf(sprite('padded', 64, 40, { flipX: true }), DATA), { x: 4, y: 26, w: 56, h: 10 });
    const asym = { sprites: { a: { foot: 10, x: [2, 50] } } };
    assert.deepEqual(deskBoxOf(sprite('a', 64, 40, { flipX: true }), asym), { x: 14, y: 30, w: 48, h: 10 });
    assert.deepEqual(deskBoxOf(sprite('a', 64, 40), asym), { x: 2, y: 30, w: 48, h: 10 });
});

test('mapProperty: Tiled array form, plain object, absent, name absent, another value', () => {
    assert.equal(mapProperty(fixture('map_props_array.json'), 'deskBoxes'), 'footprint');
    assert.equal(mapProperty(fixture('map_props_object.json'), 'deskBoxes'), 'footprint');
    assert.equal(mapProperty(fixture('map_props_none.json'), 'deskBoxes'), null);
    assert.equal(mapProperty(fixture('map_props_other.json'), 'deskBoxes'), null);
    assert.equal(mapProperty(fixture('map_props_other.json'), 'mood'), 'night');
    assert.equal(mapProperty(fixture('map_props_legacy_value.json'), 'deskBoxes'), 'legacy');
    assert.equal(mapProperty(null, 'deskBoxes'), null);
});

test('deskBoxModeFor: footprint only for the footprint value; the override wins both ways', () => {
    assert.equal(deskBoxModeFor(fixture('map_props_array.json')), 'footprint');
    assert.equal(deskBoxModeFor(fixture('map_props_object.json')), 'footprint');
    for (const f of ['map_props_none.json', 'map_props_other.json', 'map_props_legacy_value.json']) {
        assert.equal(deskBoxModeFor(fixture(f)), 'legacy', f);
        assert.equal(deskBoxModeFor(fixture(f), 'footprint'), 'footprint', `${f} + override`);
    }
    assert.equal(deskBoxModeFor(fixture('map_props_array.json'), 'legacy'), 'legacy');
    assert.equal(deskBoxModeFor(fixture('map_props_array.json'), 'bogus'), 'footprint', 'unknown override ignored');
});

test('tableBodyBox: legacy is today\'s box exactly; footprint only with data', () => {
    const d = sprite('desk1', 78, 39);
    assert.deepEqual(legacyTableBox(d), { x: 10, y: 39 - 39 / 4, w: 58, h: 39 / 4 });
    assert.deepEqual(tableBodyBox(d, 'legacy', DATA), { ...legacyTableBox(d), kind: 'legacy' });
    assert.deepEqual(tableBodyBox(d, undefined, DATA), { ...legacyTableBox(d), kind: 'legacy' });
    assert.deepEqual(tableBodyBox(d, 'footprint', DATA), { x: 0, y: 23, w: 78, h: 16, kind: 'footprint' });
    const rack = sprite('batrack', 40, 64);
    assert.deepEqual(tableBodyBox(rack, 'footprint', DATA), { ...legacyTableBox(rack), kind: 'legacy' });
    assert.deepEqual(tableBodyBox(d, 'footprint', undefined), { ...legacyTableBox(d), kind: 'legacy' }, 'JSON failed to load');
});

test('rooms.js: both table body sites go through applyTableBody with the room mode', () => {
    const src = readFileSync(join(root, 'public/break_escape/js/core/rooms.js'), 'utf8');
    assert.match(src, /import \{ deskBoxModeFor, tableBodyBox \} from '\.\.\/systems\/desk-footprints\.js';/);
    assert.equal((src.match(/applyTableBody\((tableSprite|sprite), rooms\[roomId\]\?\.deskBoxes\)/g) || []).length, 2);
    assert.match(src, /deskBoxes: deskBoxModeFor\(map, typeof window !== 'undefined' \? window\.__deskBoxes : undefined\)/);
    assert.doesNotMatch(src, /collisionHeight = tableHeight \/ 4/, 'the old inline box is gone');
    const game = readFileSync(join(root, 'public/break_escape/js/core/game.js'), 'utf8');
    assert.match(game, /this\.load\.json\('tableSurfaces', 'table_surfaces\.json'\)/);
});

test('table_surfaces.json: the experiment desks and the shape the engine reads', () => {
    const data = JSON.parse(readFileSync(join(root, 'public/break_escape/assets/table_surfaces.json'), 'utf8'));
    assert.equal(data.version, 1);
    assert.equal(data.sprites.desk1.foot, 16);
    assert.equal(data.sprites.zds_desk1.foot, 16);
    assert.equal(data.sprites.smalldesk1.foot, 27);
    for (const [k, e] of Object.entries(data.sprites)) {
        assert.ok(Number.isInteger(e.foot) && e.foot > 0, `${k} foot`);
        assert.ok(['experiment', 'measured', 'hand'].includes(e.source), `${k} source`);
        assert.ok(!data.legacyBox.includes(k), `${k} is in sprites and legacyBox`);
    }
    for (const k of ['batrack', 'servers', 'bookcase', 'bed1']) assert.ok(data.legacyBox.includes(k), k);
});

test('no shipped room map opts in except the desk seating test room', () => {
    const dir = join(root, 'public/break_escape/assets/rooms');
    const opted = readdirSync(dir).filter((f) => f.endsWith('.json'))
        .filter((f) => { try { return deskBoxModeFor(JSON.parse(readFileSync(join(dir, f), 'utf8'))) === 'footprint'; } catch { return false; } });
    // A map opts in when its walk audit has passed (SEAT_BOX_PLAN.md slices 2 and 8): add it here then.
    // room_lw_accounts opted in with the slice 7 room half (594226d2c): walk-audit pockets 0, stand-audit clean.
    const allowed = new Set(['room_test_desk_seating.json', 'room_lw_accounts.json']);
    assert.deepEqual(opted.filter((f) => !allowed.has(f)), []);
});

const ruby = spawnSync('ruby', ['--version']);
test('validator reads the same fixture maps as mapProperty', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const names = ['map_props_array.json', 'map_props_object.json', 'map_props_none.json', 'map_props_other.json', 'map_props_legacy_value.json'];
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      names = JSON.parse(STDIN.read)
      puts JSON.generate(names.map { |n| tiled_map_property(JSON.parse(File.read(File.join(${JSON.stringify(fixtures)}, n))), 'deskBoxes') })`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(names), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const rb = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.deepEqual(rb, names.map((n) => mapProperty(fixture(n), 'deskBoxes')));
});

test('validator lists which of a scenario\'s maps are legacy', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const scenario = { rooms: { a: { type: 'room_office' }, b: { type: 'room_test_desk_seating' }, c: { type: 'room_office' } } };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(desk_box_maps(JSON.parse(STDIN.read), ${JSON.stringify(root)}))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.deepEqual(out.legacy, ['room_office']);
    assert.deepEqual(out.footprint, ['room_test_desk_seating']);
});
