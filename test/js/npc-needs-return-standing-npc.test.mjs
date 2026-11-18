// A returning needs NPC steps round a standing NPC that fills an aisle the clearance ring closes
// (m08 game 9155: Agnieszka stalled for over a minute 22 px from Vector). Real EasyStar and the real
// pathfinding manager; the walker's body is stepped along the path against the standing body.
// Run with: node test/js/npc-needs-return-standing-npc.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';

globalThis.window = globalThis.window || {};
vm.runInThisContext(readFileSync(new URL('./vendor/easystar-0.4.4.js', import.meta.url), 'utf8'));
globalThis.EasyStar = globalThis.EasyStar || vm.runInThisContext('EasyStar');
window.gameState = window.gameState || { globalVariables: {} };
const { NPCPathfindingManager } = await import('../../public/break_escape/js/systems/npc-pathfinding.js');

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'npc-needs-standing-'));
writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
writeFileSync(join(dir, 'npc-behavior.mjs'), readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
    .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
    .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
    .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
    .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
    .replace("'./fight-styles.js'", "'./fight-styles.mjs'"));
const quiet = async fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return await fn(); } finally { console.log = l; console.warn = w; }
};
const quietSync = fn => {
    const l = console.log, w = console.warn;
    console.log = () => {}; console.warn = () => {};
    try { return fn(); } finally { console.log = l; console.warn = w; }
};
const { NPCBehavior } = (await quiet(() => import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href))).default;

const N = 60, STEP = 8;
/** An aisle `h` cells tall (rows 20..) from column 2 to 57, walls elsewhere, on real EasyStar. */
function aisle(h) {
    const grid = Array.from({ length: N }, () => new Array(N).fill(1));
    for (let y = 20; y < 20 + h; y++) for (let x = 2; x < 58; x++) grid[y][x] = 0;
    const pm = new NPCPathfindingManager({ time: { delayedCall() {} } });
    pm.worldGrid = grid;
    pm.worldGridBounds = { minX: 0, minY: 0, cols: N, rows: N, step: STEP };
    const pf = new globalThis.EasyStar.js();
    pf.setGrid(grid); pf.setAcceptableTiles([0]); pf.enableDiagonals(); pf.disableCornerCutting();
    pm.worldPathfinder = pf;
    return pm;
}
const body = (x, y) => ({ enable: true, immovable: false, width: 20, height: 10, left: x - 10, right: x + 10, top: y - 5, bottom: y + 5, center: { x, y } });
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Plan a stalled needs walk (reroute) from the walker to home and step a 20x10 body along it. */
async function walkHome(h, { standingY = null } = {}) {
    const pm = aisle(h);
    const cy = (20 + h / 2) * STEP;
    const me = { body: body(45 * STEP, cy) };
    const standing = { body: body(30 * STEP, standingY ?? cy) };
    window.rooms = { r: { npcSprites: [me, standing] } };
    window.player = null;
    window.chairs = [];
    const b = Object.create(NPCBehavior.prototype);
    b.npcId = 'agnieszka';
    b.sprite = me;
    b._moveOwner = 'needs';
    b._moveReroute = true;
    b._moveAvoidRooms = [];
    b.pathfindingManager = pm;
    // EasyStar delivers each answer on a later turn (the game's mode), and the tiers nest
    const path = await new Promise(resolve => {
        quietSync(() => b._planMovePath(pm, me.body.center.x, me.body.center.y, 10 * STEP, cy, resolve));
        setTimeout(() => resolve(null), 1500);
    });
    // Step the walker along the planned path at 2 px per tick; a step into the standing body is a stall.
    const pos = { ...me.body.center };
    let ticks = 0, stalled = false;
    for (const wp of path || []) {
        while (Math.hypot(wp.x - pos.x, wp.y - pos.y) > 1 && ticks < 5000) {
            const d = Math.hypot(wp.x - pos.x, wp.y - pos.y), k = Math.min(2, d) / d;
            const nx = pos.x + (wp.x - pos.x) * k, ny = pos.y + (wp.y - pos.y) * k;
            if (overlaps(body(nx, ny), standing.body)) { stalled = true; break; }
            pos.x = nx; pos.y = ny; ticks++;
        }
        if (stalled) break;
    }
    return { path, pos, ticks, stalled, home: { x: 10 * STEP, y: cy } };
}

test('a standing NPC in a 40 px aisle: the returning walker plans round it and gets home', async () => {
    const r = await walkHome(5);
    assert.ok(r.path && r.path.length > 0, 'a path is planned');
    assert.equal(r.stalled, false, `never steps into the standing body (stopped at ${Math.round(r.pos.x)},${Math.round(r.pos.y)})`);
    assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, 'and reaches home');
    assert.ok(r.ticks < 400, `within the tick budget (${r.ticks})`);
});

test('wider aisles still route round the standing NPC with the clearance ring', async () => {
    for (const h of [7, 8]) {
        const r = await walkHome(h);
        assert.equal(r.stalled, false, `${h} cells`);
        assert.ok(Math.hypot(r.pos.x - r.home.x, r.pos.y - r.home.y) <= 8, `${h} cells: home`);
    }
});

test('an aisle too narrow to pass at all still falls back to the plain path', async () => {
    const r = await walkHome(2);
    assert.ok(r.path && r.path.length > 0, 'the plain path is still planned');
    assert.equal(r.stalled, true, 'and runs into the standing body, as before (nothing can pass)');
});
