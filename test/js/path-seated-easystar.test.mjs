// Seated chairs against the real EasyStar 0.4.4 (sims tidy R2 m2). path-seated-chairs.test.mjs uses a
// stub pathfinder, so it cannot catch a change in the library's semantics; this runs the vendored copy
// of the file the game loads from the CDN (test/js/vendor/easystar-0.4.4.js).
// Run with: node test/js/path-seated-easystar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

globalThis.window = globalThis.window || {};
// The CDN file is a browser script that declares `var EasyStar`: run it as a script in this realm
// (a separate context breaks its `instanceof Array` checks) and take the global.
vm.runInThisContext(readFileSync(new URL('./vendor/easystar-0.4.4.js', import.meta.url), 'utf8'));
globalThis.EasyStar = globalThis.EasyStar || vm.runInThisContext('EasyStar');
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

const N = 30, STEP = 8;
const rect = (cx, cy) => ({ enable: true, immovable: true, left: cx * STEP, top: cy * STEP, right: (cx + 1) * STEP, bottom: (cy + 1) * STEP });
const centre = (cx, cy) => ({ x: cx * STEP + STEP / 2, y: cy * STEP + STEP / 2 });

/** A manager on a real EasyStar instance, set up as rebuildWorldGrid does, over a grid that is all wall but `open`. */
function realPm(open) {
    const grid = Array.from({ length: N }, () => new Array(N).fill(1));
    for (const [cx, cy] of open) grid[cy][cx] = 0;
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGrid = grid;
    pm.worldGridBounds = { minX: 0, minY: 0, cols: N, rows: N, step: STEP };
    const pf = new globalThis.EasyStar.js();
    pf.setGrid(grid); pf.setAcceptableTiles([0]); pf.enableDiagonals(); pf.disableCornerCutting(); pf.enableSync();
    pm.worldPathfinder = pf;
    return pm;
}
const cellsOf = path => path.map(p => `${Math.floor(p.x / STEP)},${Math.floor(p.y / STEP)}`);

test('real EasyStar: a diagonal-only gap between two seated chairs\' padding still paths (R2 m2)', () => {
    // Chair X body at cell (10,10) pads cells 9..11 x 9..11; chair Y body at (13,13) pads 12..14 x 12..14.
    // The padding cells (11,11) and (12,12) touch at a corner; the only way through is the diagonal
    // (11,12) -> (12,11), between two padded cells. Avoid points are ignored by the corner test.
    const open = [];
    for (let y = 13; y <= 18; y++) open.push([11, y]);   // south approach to (11,12)
    open.push([11, 12], [12, 11]);                        // the two ends of the diagonal
    for (let y = 5; y <= 10; y++) open.push([12, y]);     // north exit from (12,11)
    for (let y = 9; y <= 11; y++) for (let x = 9; x <= 11; x++) if (!(x === 11 && y === 11)) open.push([x, y]);
    open.push([11, 11], [12, 12]);
    for (let y = 12; y <= 14; y++) for (let x = 12; x <= 14; x++) open.push([x, y]);
    const pm = realPm(open.map(([x, y]) => [x, y]));
    window.chairs = [{ seatedBy: 'a', body: rect(10, 10) }, { seatedBy: 'b', body: rect(13, 13) }];
    const s = centre(11, 18), g = centre(12, 5);
    let got;
    pm.findWorldPath(s.x, s.y, g.x, g.y, p => { got = p; });
    window.chairs = undefined;
    assert.ok(got && got.length > 2, 'a path is found');
    const cells = cellsOf(got);
    for (const bad of ['10,10', '13,13', '11,11', '12,12', '9,9', '14,14', '10,11', '13,12']) assert.ok(!cells.includes(bad), `the path stays off ${bad} (the seated chairs and their padding)`);
    assert.ok(cells.includes('11,12') && cells.includes('12,11'), 'and takes the diagonal between the paddings');
    assert.equal(pm.worldPathfinder.removeAllDirectionalConditions(), undefined);
});

test('real EasyStar: a corridor blocked by a seated chair or its padding reruns without it; a failure far from every chair does not', () => {
    // A one-cell-wide corridor along y 10 with a seated chair body in it: nothing can pass, the rerun
    // (chairs ignored) walks straight through it.
    const open = []; for (let x = 2; x <= 20; x++) open.push([x, 10]);
    const pm = realPm(open);
    window.chairs = [{ seatedBy: 'a', body: rect(10, 10) }];
    const s = centre(3, 10), g = centre(19, 10);
    let got;
    pm.findWorldPath(s.x, s.y, g.x, g.y, p => { got = p; });
    assert.ok(got && cellsOf(got).includes('10,10'), 'blocked corridor: the rerun without seated chairs goes through');
    window.chairs = undefined;
});

test('real EasyStar: a failed search far from every seated chair is not run twice; conditions and costs are cleared', () => {
    const open = [[2, 2], [3, 2], [4, 2], [25, 25]]; // the goal is walled off; the chair is elsewhere
    for (let x = 12; x <= 16; x++) open.push([x, 10]);
    const pm = realPm(open);
    let searches = 0;
    const findPath = pm.worldPathfinder.findPath.bind(pm.worldPathfinder);
    pm.worldPathfinder.findPath = (...a) => { searches++; return findPath(...a); };
    window.chairs = [{ seatedBy: 'a', body: rect(14, 10) }];
    const s = centre(2, 2), g = centre(25, 25);
    let got = 'unset';
    pm.findWorldPath(s.x, s.y, g.x, g.y, p => { got = p; });
    window.chairs = undefined;
    assert.equal(got, null);
    assert.equal(searches, 1, 'one search: nothing touched a seated cell');
    // The next search on the same instance is clean: no left-over avoid points, costs or conditions
    const t = centre(4, 2);
    pm.findWorldPath(s.x, s.y, t.x, t.y, p => { got = p; });
    assert.equal(cellsOf(got).join(' '), '0,0'.length ? '2,2 3,2 4,2' : '', 'a plain walk afterwards');
});
