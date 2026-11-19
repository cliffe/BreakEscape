// Dusting D183 items 1, 4 and 6: whorl layouts and decoy rules, the easy Find floor and the faint dust-step outline,
// and the keyboard path (small polyline steps) laying the same powder as a mouse stroke.
// Run with: node --max-old-space-size=2048 test/js/dusting-post-release.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-post-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');

const el = () => ({ setAttribute() {}, appendChild() {}, style: {} });
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
const imp = rel => import(pathToFileURL(join(root, 'js/minigames/dusting', rel)).href);
const gen = await imp('fingerprint-generator.js');
const model = await imp('dusting-model.js');
const { DustingMinigame, decoyWhorlShape } = await imp('dusting-game.js');
const { WHORL_SHAPES, whorlShapeFor, generatePrint } = gen;
const { DIFFICULTY, SURFACES, DustField, TOOLS, brushFeel, findSheen, findGlint, findFloorScale } = model;

// ---------------------------------------------------------------- item 1
test('item 1: the four whorl layouts differ pairwise by at least 5 px (at 128) in some core or delta', () => {
    assert.ok(WHORL_SHAPES.length >= 4, 'four layouts');
    for (let a = 0; a < WHORL_SHAPES.length; a++) for (let b = a + 1; b < WHORL_SHAPES.length; b++) {
        const A = WHORL_SHAPES[a], B = WHORL_SHAPES[b];
        let max = 0;
        for (const key of ['cores', 'deltas']) A[key].forEach((p, i) => { max = Math.max(max, Math.abs(p[0] - B[key][i][0]) * 128, Math.abs(p[1] - B[key][i][1]) * 128); });
        assert.ok(max >= 5, `layouts ${a} and ${b} differ by ${max.toFixed(1)} px`);
    }
});

test('item 1: a whorlShape option changes the generated cores and deltas; the owner default is stable', () => {
    const at = s => generatePrint({ owner: 'Jesse Tran', pattern: 'whorl', whorlShape: s });
    const p0 = at(0), p2 = at(2);
    const moved = Math.abs(p0.cores[0].x - p2.cores[0].x) + Math.abs(p0.deltas[0].x - p2.deltas[0].x);
    assert.ok(moved > 5, `layout moved the points by ${moved.toFixed(1)}`);
    const own = generatePrint({ owner: 'Jesse Tran', pattern: 'whorl' }), again = generatePrint({ owner: 'Jesse Tran', pattern: 'whorl' });
    assert.ok(whorlShapeFor('Jesse Tran') === whorlShapeFor('Jesse Tran'), 'owner layout stable');
    assert.ok(own.cores[0].x === again.cores[0].x && own.cores[0].y === again.cores[0].y, 'default print stable');
});

test('item 1: easy and medium decoys never share the lift layout; hard does', () => {
    const names = ['Jesse Tran', 'Noor Haddad', 'Ana Ruiz', 'Dev Patel', 'Li Wei', 'Sam Okoro', 'Ira Novak', 'Mo Salah'];
    for (const rule of ['never', 'one']) for (const owner of ['Margaret Sorensen', 'Karl Mueller', 'Tess Adeyemi']) {
        const liftShape = whorlShapeFor(owner);
        names.forEach((nm, k) => {
            const s = decoyWhorlShape(nm, 'whorl', 'whorl', owner, rule, k);
            const used = s === null ? whorlShapeFor(nm) : s;
            assert.ok(used !== liftShape, `${rule}: ${nm} vs ${owner} used the lift layout ${liftShape}`);
        });
    }
    for (const owner of ['Margaret Sorensen', 'Karl Mueller']) {
        assert.ok(decoyWhorlShape('Jesse Tran', 'whorl', 'whorl', owner, 'all', 0) === whorlShapeFor(owner), 'hard shares the lift layout');
    }
    assert.ok(decoyWhorlShape('Jesse Tran', 'loop', 'whorl', 'Margaret Sorensen', 'one', 0) === null, 'a loop decoy keeps its own');
});

// ---------------------------------------------------------------- item 4
const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
const luma = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
function floorDelta(colourHex, floor, hc) {
    const base = hex(colourHex), unlit = base.map(v => v * 0.5);
    const glint = findGlint(luma(base) > 150, hc);
    const s = findSheen({ lit: 0, ridge: 1, mask: 1, res: 1, floor, floorScale: findFloorScale(luma(unlit), glint), dotted: true, hc });
    const out = unlit.map((v, k) => v + (glint[k] - v) * s);
    return Math.abs(luma(out) - luma(unlit));
}

test('item 4: easy Find floor is 0.34 and shows more than the old 0.24 on every surface colour', () => {
    assert.ok(DIFFICULTY.easy.findFloor === 0.34, 'easy floor value');
    assert.ok(DIFFICULTY.medium.findFloor === 0.16 && DIFFICULTY.hard.findFloor === 0, 'medium and hard untouched');
    for (const surf of Object.values(SURFACES)) for (const c of surf.colours) {
        const now = floorDelta(c, DIFFICULTY.easy.findFloor, false), old = floorDelta(c, 0.24, false);
        assert.ok(now > old, `${surf.id} ${c}: ${now.toFixed(1)} vs old ${old.toFixed(1)}`);
        assert.ok(now >= 30, `${surf.id} ${c} easy delta ${now.toFixed(1)} is clearly visible`);
    }
});

test('item 4: High contrast stays at least as strong as default on easy', () => {
    for (const surf of Object.values(SURFACES)) for (const c of surf.colours) {
        assert.ok(floorDelta(c, DIFFICULTY.easy.findFloor, true) >= floorDelta(c, DIFFICULTY.easy.findFloor, false), `${surf.id} ${c}`);
        assert.ok(floorDelta(c, DIFFICULTY.easy.findFloor, true) >= 20, `${surf.id} ${c} HC visible`);
    }
});

/** A dust-step game with a square print mask, to call _outlineMask without a DOM. */
function outlineGame(revealed) {
    const N = 128, mask = new Float32Array(N * N);
    for (let y = 40; y < 90; y++) for (let x = 40; x < 90; x++) mask[y * N + x] = 1;
    const g = Object.create(DustingMinigame.prototype);
    g.print = { mask };
    g.field = { reveal: () => (revealed ? 1 : 0) };
    const d = new Uint8ClampedArray(N * N * 4).fill(120);   // mid grey surface
    return { g, d, N };
}

test('item 4: the dust-step outline is drawn dashed on the print edge and fades once powder has developed', () => {
    const fresh = outlineGame(false);
    fresh.g._outlineMask(fresh.d, null, true);
    let changed = 0, unchangedEdge = 0, interior = 0;
    for (let y = 40; y < 90; y++) for (let x = 40; x < 90; x++) {
        const edge = x === 40 || x === 89 || y === 40 || y === 89, v = fresh.d[(y * fresh.N + x) * 4];
        if (edge) { if (v !== 120) changed++; else unchangedEdge++; } else if (v !== 120) interior++;
    }
    assert.ok(changed > 40, `edge pixels drawn: ${changed}`);
    assert.ok(unchangedEdge > 40, `dashed, not solid: ${unchangedEdge} edge gaps`);
    assert.ok(interior === 0, 'interior untouched');
    const dev = outlineGame(true);
    dev.g._outlineMask(dev.d, null, true);
    assert.ok(dev.d.every(v => v === 120 || v === 255), 'no outline left once developed');
    let drawn = 0; for (let i = 0; i < dev.d.length; i += 4) if (dev.d[i] !== 120) drawn++;
    assert.ok(drawn === 0, `developed print keeps no outline (${drawn})`);
});

test('item 4: High contrast keeps its solid grey outline', () => {
    const { g, d, N } = outlineGame(false);
    g._outlineMask(d, [0, 0, 0], false);
    let grey = 0;
    for (let y = 40; y < 90; y++) for (let x = 40; x < 90; x++) {
        const edge = x === 40 || x === 89 || y === 40 || y === 89;
        if (edge && d[(y * N + x) * 4] === 128 && d[(y * N + x) * 4 + 1] === 128) grey++;
    }
    assert.ok(grey > 40, `grey edge pixels ${grey}`);
});

test('item 4: only the dust step (holes === null) and not High contrast use the faint outline', () => {
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.ok(/if \(hc\) this\._outlineMask\(d, hcInk\);\s*\n\s*else if \(holes === null\) this\._outlineMask\(d, null, true\)/.test(src), 'call sites');
});

// ---------------------------------------------------------------- item 6
const print = generatePrint({ owner: 'Margaret Sorensen', pattern: 'whorl', variant: 'panel' });
const b = print.bounds;

test('item 6: keyboard path (12 px arrow steps, the Shift size) lays a polyline that reaches Lift in a few strokes on medium', () => {
    const tool = brushFeel(TOOLS.fine, 'medium'), min = DIFFICULTY.medium.minCoverage;
    const f = new DustField(print.size, { pfog: DIFFICULTY.medium.pfog });
    let y = b.y + 2, dir = 1, rows = 0;
    while (rows < 14) {
        let x = dir > 0 ? b.x - 2 : b.x + b.w + 2;
        const end = dir > 0 ? b.x + b.w + 2 : b.x - 2;
        while ((end - x) * dir > 0) {
            const nx = x + dir * Math.min(12, Math.abs(end - x));
            f.brushLine(x, y, nx, y, tool);   // what _act(reticle, old) does on each held-Space arrow press
            x = nx;
        }
        rows++; dir = -dir; y += tool.radius * 2;
        if (f.metrics(print).coverage >= min) break;
    }
    assert.ok(f.metrics(print).coverage >= min, `coverage ${f.metrics(print).coverage.toFixed(2)} after ${rows} rows`);
    assert.ok(rows <= 10, `${rows} keyboard rows to unlock Lift`);
});

test('item 6: short polyline steps (arrow keys) never lay less powder than one mouse stroke, and stay within 2.1x of it', () => {
    // brushLine lays at least one tick per segment, so segments shorter than radius/3 over-lay a little (about 1.1x to 1.9x
    // measured). Never below 1x (keys are never harder than the mouse), never past 2.1x (no runaway fog from a held arrow).
    for (const id of Object.keys(TOOLS)) for (const d of ['easy', 'medium', 'hard']) {
        const tool = brushFeel(TOOLS[id], d), sum = f => f.P.reduce((a, v) => a + v, 0);
        const straight = new DustField(128); straight.brushLine(20, 64, 100, 64, tool);
        const base = sum(straight);
        for (const step of [4, 12]) {
            const f = new DustField(128);
            for (let x = 20; x < 100; x += step) f.brushLine(x, 64, Math.min(100, x + step), 64, tool);
            const ratio = sum(f) / base;
            assert.ok(ratio >= 0.97 && ratio <= 2.1, `${id}/${d} ${step}px steps lay ${ratio.toFixed(2)}x a straight stroke`);
        }
    }
});

test('item 6: brush feel scales by difficulty and a held key is gentler than a drag', () => {
    const e = brushFeel(TOOLS.fine, 'easy'), m = brushFeel(TOOLS.fine, 'medium'), h = brushFeel(TOOLS.fine, 'hard');
    assert.ok(e.radius > m.radius && m.radius > h.radius, 'radius easy > medium > hard');
    assert.ok(m.radius === TOOLS.fine.radius * 2, 'medium doubles the radius');
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.ok(/const KEY_HOLD_GENTLE = 0\.4/.test(src) && /if \(keyed\) tool\.strength \*= KEY_HOLD_GENTLE/.test(src), 'held-key gentle factor wired');
});
