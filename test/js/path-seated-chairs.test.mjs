// Seated chairs and the path grid (sims tidy item 1, docs/achitechture/SIMS_TIDY_LOG.md): the live
// world grid leaves seated chairs (and the NPCs on them) out, every path search avoids them while
// they are seated, and a search that then finds nothing runs again without them.
// Run with: node test/js/path-seated-chairs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
// rebuildWorldGrid makes an EasyStar instance (a CDN global in the browser)
globalThis.EasyStar = globalThis.EasyStar || { js: class { setGrid() {} setAcceptableTiles() {} enableDiagonals() {} disableCornerCutting() {} } };
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');
const { seatedAvoidCells } = await import('../../public/break_escape/js/systems/path-avoid.js');

const bounds = { minX: 0, minY: 0, cols: 40, rows: 40, step: 8 };
const open = () => Array.from({ length: 40 }, () => new Array(40).fill(0));
const rect = (l, t, r, b, extra = {}) => ({ enable: true, immovable: true, left: l, top: t, right: r, bottom: b, ...extra });
const has = (cells, cx, cy) => cells.some(c => c.cx === cx && c.cy === cy);

test('seatedAvoidCells pads a seated chair like a solid body and skips blocked cells', () => {
    const g = open(); g[15][14] = 1;
    const cells = seatedAvoidCells([rect(120, 120, 140, 130)], bounds, g, [{ x: 20, y: 20 }, { x: 300, y: 300 }]);
    assert.ok(has(cells, 15, 15) && has(cells, 17, 15), 'the chair\'s own cells');
    assert.ok(has(cells, 18, 15), 'one cell of padding sideways');
    assert.ok(!has(cells, 14, 15), 'a cell already blocked in the grid is not listed');
});

test('seatedAvoidCells skips a chair within a cell of an end, and keeps the padding near an end open', () => {
    const chair = rect(120, 120, 140, 130);
    assert.equal(seatedAvoidCells([chair], bounds, open(), [{ x: 130, y: 126 }, { x: 300, y: 300 }]).length, 0,
        'the walker\'s own chair at the start is not avoided');
    assert.equal(seatedAvoidCells([chair], bounds, open(), [{ x: 20, y: 20 }, { x: 146, y: 126 }]).length, 0,
        'a seat being walked to (goal within one cell of the chair) is not avoided');
    const cells = seatedAvoidCells([chair], bounds, open(), [{ x: 20, y: 20 }, { x: 164, y: 126 }]);
    assert.ok(!has(cells, 18, 15), 'padding within two cells of the goal stays open (a home beside a seated colleague)');
    assert.ok(has(cells, 17, 15), 'the chair\'s own cells are still avoided');
});

function pfm(found = () => true) {
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGrid = open();
    pm.worldGridBounds = { ...bounds };
    pm.avoided = new Set(); pm.searches = [];
    let cb = null;
    pm.worldPathfinder = {
        avoidAdditionalPoint: (cx, cy) => pm.avoided.add(`${cx},${cy}`),
        stopAvoidingAdditionalPoint: (cx, cy) => pm.avoided.delete(`${cx},${cy}`),
        stopAvoidingAllAdditionalPoints: () => pm.avoided.clear(),
        findPath(sx, sy, ex, ey, c) { pm.searches.push([...pm.avoided]); cb = c; },
        // Sync mode: the callback runs inside calculate()
        calculate() { const n = pm.searches.length; cb(found(n) ? [{ x: 1, y: 1 }, { x: 2, y: 2 }] : null); }
    };
    return pm;
}

test('findWorldPath avoids a seated chair, not a loose or a reserved-but-moving one, and clears it after', () => {
    window.chairs = [
        { seatedBy: 'amara', body: rect(216, 118, 238, 129) },
        { seatedBy: null, body: rect(80, 118, 102, 129, { immovable: false }) },
        { seatedBy: 'sanjay', body: rect(80, 200, 102, 211, { immovable: false }) }
    ];
    const pm = pfm(); let got;
    pm.findWorldPath(220, 176, 220, 76, p => { got = p; }, true);
    assert.ok(pm.searches[0].includes('27,15'), 'the seated chair is avoided (the board read, game 5748)');
    assert.ok(!pm.searches[0].includes('11,15') && !pm.searches[0].includes('11,25'), 'loose and moving chairs are not');
    assert.equal(pm.avoided.size, 0, 'nothing is left avoided after the search');
    assert.ok(got && got.length === 2);
    window.chairs = undefined;
});

test('findWorldPath runs again without seated chairs when they leave no way through, after calculate() returns', () => {
    window.chairs = [{ seatedBy: 'marek', body: rect(40, 120, 62, 131) }];
    const pm = pfm(n => n > 1); const got = [];
    pm.findWorldPath(20, 20, 300, 300, p => got.push(p));
    assert.equal(pm.searches.length, 2, 'a second search');
    assert.ok(pm.searches[0].length > 0 && pm.searches[1].length === 0, 'the second has no seated cells');
    assert.equal(got.length, 1, 'the caller hears once, with the path');
    assert.ok(got[0]);
    window.chairs = undefined;
});

test('the live grid leaves seated chairs and the NPCs on them out; other builds keep them', () => {
    const chairBody = rect(80, 120, 102, 131);
    const npcBody = rect(81, 121, 101, 131, { gameObject: { npcId: 'sanjay' } });
    const desk = rect(80, 150, 140, 160);
    window.chairs = [{ seatedBy: 'sanjay', body: chairBody }];
    const scene = { time: { delayedCall() {} }, physics: { world: {
        bounds: { x: 0, y: 0, width: 320, height: 320 },
        staticBodies: { iterate() {} },
        bodies: { iterate(fn) { [chairBody, npcBody, desk].forEach(fn); } }
    } } };
    const pm = new NPCPathfindingManager(scene);
    const at = (g, x, y) => g.grid[Math.floor(y / 8)][Math.floor(x / 8)];
    const quiet = console.log; console.log = () => {};
    try { pm.rebuildWorldGrid(); } finally { console.log = quiet; }
    assert.equal(pm.worldGrid[15][11], 0, 'seated chair and sitter: walkable in the live grid');
    assert.equal(pm.worldGrid[19][12], 1, 'the desk still blocks');
    assert.equal(at(pm.buildWorldGrid(), 90, 126), 1, 'a plain build (seat stand-up grid) still has the seated chair');
    window.chairs[0].seatedBy = null;
    assert.equal(at(pm.buildWorldGrid({ skipSeated: true }), 90, 126), 1, 'once nobody sits, an immovable chair body is solid as before');
    window.chairs = undefined;
});

// Async mode (EasyStar 0.4.4 default): calculate() runs the whole search, then delivers the
// callback a tick later from a timer. The player's NPC-avoid points (avoidNPCs) stay set until
// that callback; the seated cells come off in the finally, straight after calculate().
function pfmAsync(found = () => true) {
    const pm = pfm(found);
    let cb = null;
    pm.worldPathfinder.findPath = (sx, sy, ex, ey, c) => { cb = c; };
    pm.worldPathfinder.calculate = () => {
        pm.searches.push([...pm.avoided]);
        const n = pm.searches.length, c = cb;
        setTimeout(() => c(found(n) ? [{ x: 1, y: 1 }, { x: 2, y: 2 }] : null), 0);
    };
    return pm;
}
const tick = () => new Promise(r => setTimeout(r, 5));

test('async player search: NPC-avoid and seated cells both apply; a failed search reruns with the NPC cells and without the seated ones', async () => {
    window.chairs = [{ seatedBy: 'amara', body: rect(216, 118, 238, 129) }];
    // A walking (movable) NPC west of the chair; the player's click path must still route round her.
    window.rooms = { office: { npcSprites: [{ body: rect(160, 120, 178, 130, { immovable: false }) }] } };
    const pm = pfmAsync(n => n > 1); const got = [];
    pm.findWorldPath(200, 176, 220, 76, p => got.push(p), true);
    assert.equal(pm.searches.length, 1, 'one search so far: the retry waits for the timer callback');
    assert.ok(pm.searches[0].includes('27,15'), 'first search avoids the seated chair');
    assert.ok(pm.searches[0].includes('20,15'), 'first search avoids the walking NPC');
    assert.ok(!pm.avoided.has('27,15'), 'seated cells come off straight after calculate()');
    assert.ok(pm.avoided.has('20,15'), 'NPC cells stay until the callback (async mode)');
    assert.equal(got.length, 0, 'the caller has not heard yet');
    await tick(); await tick();
    assert.equal(pm.searches.length, 2, 'the failed search ran again');
    assert.ok(pm.searches[1].includes('20,15'), 'the rerun still avoids the walking NPC');
    assert.ok(!pm.searches[1].includes('27,15'), 'the rerun leaves the seated chair out');
    assert.equal(got.length, 1, 'the caller hears once');
    assert.ok(got[0] && got[0].length === 2, 'with the rerun\'s path');
    assert.equal(pm.avoided.size, 0, 'nothing left avoided at the end');
    window.chairs = undefined; window.rooms = undefined;
});

test('async player search that finds a path first time: no rerun, one callback, nothing left avoided', async () => {
    window.chairs = [{ seatedBy: 'amara', body: rect(216, 118, 238, 129) }];
    window.rooms = { office: { npcSprites: [{ body: rect(160, 120, 178, 130, { immovable: false }) }] } };
    const pm = pfmAsync(); const got = [];
    pm.findWorldPath(200, 176, 220, 76, p => got.push(p), true);
    await tick(); await tick();
    assert.equal(pm.searches.length, 1);
    assert.equal(got.length, 1);
    assert.equal(pm.avoided.size, 0);
    window.chairs = undefined; window.rooms = undefined;
});

test('async search with no way through even without seated chairs: one rerun only, the caller hears null once', async () => {
    window.chairs = [{ seatedBy: 'amara', body: rect(216, 118, 238, 129) }];
    const pm = pfmAsync(() => false); const got = [];
    pm.findWorldPath(200, 176, 220, 76, p => got.push(p), true);
    await tick(); await tick(); await tick();
    assert.equal(pm.searches.length, 2, 'no third search');
    assert.deepEqual(got, [null]);
    window.chairs = undefined;
});
