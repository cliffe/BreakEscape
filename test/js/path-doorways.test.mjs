// Doorway waypoints for click-to-move paths (systems/path-doorways.js).
// Run with: node --test test/js/path-doorways.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'path-doorways-'));
writeFileSync(join(dir, 'pd.mjs'), readFileSync(join(js, 'systems/path-doorways.js'), 'utf8'));
const { canonicalDoorway, addDoorway, crossingPoints, insertDoorwayWaypoints, lastPinnedIndex }
    = await import(pathToFileURL(join(dir, 'pd.mjs')).href);

// lab_tesseract_trials: foyer (0,0) 320x320, common room (320,0) to its east,
// corridor (0,-128) to its north. Door sprite centres as doors.js places them.
const FOYER_EAST = { x: 304, y: 80, direction: 'east' };
const COMMON_WEST = { x: 336, y: 80, direction: 'west' };
const FOYER_NORTH = { x: 48, y: 32, direction: 'north' };
const CORRIDOR_SOUTH = { x: 48, y: 32, direction: 'south' };

// The feet collider's gap tolerance: centre within the opening less half the body.
const SIDE_GAP = { min: 80 - 7, max: 80 + 7 };   // 24px gap, 10px-tall body
const NS_GAP = { min: 48 - 7, max: 48 + 7 };     // 32px gap, 18px-wide body

test('both rooms\' doors on one opening give one doorway', () => {
    assert.deepEqual(canonicalDoorway(FOYER_EAST), canonicalDoorway(COMMON_WEST));
    assert.deepEqual(canonicalDoorway(FOYER_NORTH), canonicalDoorway(CORRIDOR_SOUTH));
    const list = [];
    [FOYER_EAST, COMMON_WEST, FOYER_NORTH, CORRIDOR_SOUTH].forEach(d => addDoorway(list, d));
    assert.equal(list.length, 2);
    assert.deepEqual(list[0], { axis: 'x', cx: 320, cy: 80 });
});

test('crossing points sit on the centre line, square to the opening, in travel order', () => {
    const side = canonicalDoorway(FOYER_EAST);
    assert.deepEqual(crossingPoints(side, 1).map(p => [p.x, p.y]), [[276, 80], [320, 80], [364, 80]]);
    assert.deepEqual(crossingPoints(side, -1).map(p => [p.x, p.y]), [[364, 80], [320, 80], [276, 80]]);
    const ns = canonicalDoorway(FOYER_NORTH);
    assert.deepEqual(crossingPoints(ns, -1).map(p => [p.x, p.y]), [[48, 74], [48, 32], [48, -10]]);
    assert.ok(crossingPoints(ns, 1).every(p => p.pinned));
});

// m01 reception -> main office (October 2026 stress run): the raw grid path
// wandered through the two-row doorway off the centre line, (60,52) then
// (68,44), and the body caught the wall strip at x 64-96, y 56-64.
test('a raw path that wanders inside an N/S opening is replaced by the pins', () => {
    const doors = [];
    addDoorway(doors, FOYER_NORTH);
    const raw = [{ x: 76, y: 100 }, { x: 68, y: 76 }, { x: 60, y: 68 }, { x: 52, y: 60 },
        { x: 60, y: 52 }, { x: 68, y: 44 }, { x: 60, y: 36 }, { x: 52, y: 28 }, { x: 52, y: 4 },
        { x: 56, y: -20 }, { x: 120, y: -100 }];
    const out = insertDoorwayWaypoints({ x: 80, y: 128 }, raw, doors);
    assert.deepEqual(out.map(p => [p.x, p.y]),
        [[76, 100], [68, 76], [48, 74], [48, 32], [48, -10], [56, -20], [120, -100]]);
});

test('a path that runs along a doorway without going through keeps its points', () => {
    const doors = [];
    addDoorway(doors, FOYER_EAST);
    const raw = [{ x: 290, y: 70 }, { x: 296, y: 80 }, { x: 290, y: 96 }, { x: 250, y: 120 }];
    assert.deepEqual(insertDoorwayWaypoints({ x: 250, y: 60 }, raw, doors), raw);
});

// A diagonal approach is what clips the frame: before the fix the route ran
// from below the gap straight up through it.
test('a diagonal route through a side door is squared up on the gap', () => {
    const doors = [];
    addDoorway(doors, FOYER_EAST);
    const raw = [];
    for (let x = 272; x <= 400; x += 8) raw.push({ x, y: x < 300 ? 112 : (x < 340 ? 88 : 120) });
    const out = insertDoorwayWaypoints({ x: 263, y: 120 }, raw, doors);
    const pins = out.filter(p => p.pinned);
    assert.equal(pins.length, 3);
    for (const p of pins) assert.ok(p.y >= SIDE_GAP.min && p.y <= SIDE_GAP.max, `pin ${p.x},${p.y} on the gap`);
    // Nothing between the near and far pins except the centre pin.
    const i0 = out.indexOf(pins[0]), i2 = out.indexOf(pins[2]);
    assert.equal(i2 - i0, 2);
    assert.equal(lastPinnedIndex(out), i2);
});

test('a north door crossing is squared up on the gap, both directions', () => {
    const doors = [];
    addDoorway(doors, FOYER_NORTH);
    const up = [];
    for (let y = 120; y >= -40; y -= 8) up.push({ x: y > 40 ? 64 : 44, y });
    const outUp = insertDoorwayWaypoints({ x: 64, y: 128 }, up, doors).filter(p => p.pinned);
    assert.deepEqual(outUp.map(p => p.y), [74, 32, -10]);
    for (const p of outUp) assert.ok(p.x >= NS_GAP.min && p.x <= NS_GAP.max);

    const down = up.slice().reverse();
    const outDown = insertDoorwayWaypoints({ x: 44, y: -48 }, down, doors).filter(p => p.pinned);
    assert.deepEqual(outDown.map(p => p.y), [-10, 32, 74]);
});

test('pins the player is already past are left out', () => {
    const doors = [];
    addDoorway(doors, FOYER_EAST);
    // Standing in the opening, already past the near pin.
    const raw = [{ x: 312, y: 80 }, { x: 328, y: 80 }, { x: 344, y: 80 }, { x: 400, y: 80 }];
    const out = insertDoorwayWaypoints({ x: 300, y: 80 }, raw, doors);
    assert.deepEqual(out.filter(p => p.pinned).map(p => p.x), [320, 364]);
});

test('the far pin is left out when the destination is inside the opening', () => {
    const doors = [];
    addDoorway(doors, FOYER_EAST);
    const raw = [{ x: 280, y: 80 }, { x: 296, y: 80 }, { x: 312, y: 80 }, { x: 328, y: 80 }, { x: 336, y: 80 }];
    const out = insertDoorwayWaypoints({ x: 250, y: 80 }, raw, doors);
    assert.deepEqual(out.filter(p => p.pinned).map(p => p.x), [276, 320]);
    assert.deepEqual(out[out.length - 1], { x: 336, y: 80 });
});

test('a path that never meets a doorway is unchanged', () => {
    const doors = [];
    addDoorway(doors, FOYER_EAST);
    const raw = [{ x: 100, y: 200 }, { x: 150, y: 220 }];
    assert.deepEqual(insertDoorwayWaypoints({ x: 90, y: 190 }, raw, doors), raw);
    assert.deepEqual(insertDoorwayWaypoints({ x: 90, y: 190 }, raw, []), raw);
});
