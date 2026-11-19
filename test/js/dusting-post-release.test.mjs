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
const { WHORL_SHAPES, whorlShapeFor, generatePrint, singularPoints } = gen;
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

test('m4: after jitter, any two different layouts keep a largest-point gap of at least 5 px over many seeds (easy and medium lift-vs-decoy)', () => {
    // the same singular points generatePrint uses (same seed), so thousands of seeds stay cheap
    const sp = (owner, shape) => { const r = singularPoints('whorl', 128, gen.mulberry32(gen.hashString(`${owner}|whorl`)), shape); return [...r.cores, ...r.deltas]; };
    const probe = generatePrint({ owner: 'Seed 7', pattern: 'whorl', whorlShape: 2 }), want = sp('Seed 7', 2);
    assert.ok([...probe.canonical.cores, ...probe.canonical.deltas].every((p, i) => p.x === want[i].x && p.y === want[i].y), 'helper matches generatePrint');
    const gap = (A, B) => Math.max(...A.map((p, i) => Math.hypot(p.x - B[i].x, p.y - B[i].y)));
    let worst = Infinity, worstPair = '';
    for (let a = 0; a < WHORL_SHAPES.length; a++) for (let b = 0; b < WHORL_SHAPES.length; b++) {
        if (a === b) continue;   // easy and medium decoys never share the lift layout
        for (let i = 0; i < 20000; i++) {
            const g = gap(sp('Lift ' + i, a), sp('Decoy ' + i, b));
            if (g < worst) { worst = g; worstPair = `${a}/${b} seed ${i}`; }
        }
    }
    assert.ok(worst >= 5, `closest jittered pair ${worst.toFixed(2)} px (${worstPair})`);
});

test('m4: the real m09 pair, Sorensen against Tran, differs by at least 8 px after jitter', () => {
    const pts = pr => [...pr.canonical.cores, ...pr.canonical.deltas];
    const A = pts(generatePrint({ owner: 'Margaret Sorensen', pattern: 'whorl', variant: 'panel' })), B = pts(generatePrint({ owner: 'Jesse Tran', pattern: 'whorl' }));
    let m = 0; A.forEach((p, i) => { m = Math.max(m, Math.hypot(p.x - B[i].x, p.y - B[i].y)); });
    assert.ok(m >= 8, `Sorensen vs Tran ${m.toFixed(1)} px`);
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
        let carry = 0;
        while ((end - x) * dir > 0) {
            const nx = x + dir * Math.min(12, Math.abs(end - x));
            carry = f.brushLine(x, y, nx, y, tool, carry);   // what _act(reticle, old) does on each held-Space arrow press
            x = nx;
        }
        rows++; dir = -dir; y += tool.radius * 2;
        if (f.metrics(print).coverage >= min) break;
    }
    assert.ok(f.metrics(print).coverage >= min, `coverage ${f.metrics(print).coverage.toFixed(2)} after ${rows} rows`);
    assert.ok(rows <= 10, `${rows} keyboard rows to unlock Lift`);
});

test('M1: 1, 2, 4 and 12 px pointermove steps with a carried distance lay 0.9x to 1.2x the powder and fog of a one-segment stroke', () => {
    // brushLine(..., carry) lays ticks at fixed radius/3 spacing along the whole stroke, so slow drags (1 to 2 logical px per event
    // at a 2x to 4x display scale) no longer over-lay powder or max out fog.
    for (const id of Object.keys(TOOLS)) for (const d of ['easy', 'medium', 'hard']) {
        const tool = brushFeel(TOOLS[id], d), pfog = DIFFICULTY[d].pfog;
        const sum = f => f.P.reduce((a, v) => a + v, 0), fog = f => { let t = 0; for (let i = 0; i < f.FP.length; i++) t += f.fog(i); return t; };
        const stroke = step => {
            const f = new DustField(128, { pfog });
            f.brush(30, 64, tool);   // the pointerdown tick
            let carry = 0;
            for (let x = 30; x < 90; x += step) carry = f.brushLine(x, 64, Math.min(90, x + step), 64, tool, carry);
            return f;
        };
        const one = stroke(60), baseP = sum(one), baseF = fog(one);
        for (const step of [1, 2, 4, 12]) {
            const f = stroke(step), rp = sum(f) / baseP;
            assert.ok(rp >= 0.9 && rp <= 1.2, `${id}/${d} ${step}px steps lay ${rp.toFixed(3)}x the powder of one segment`);
            if (baseF > 0.5) {
                const rf = fog(f) / baseF;
                assert.ok(rf >= 0.9 && rf <= 1.2, `${id}/${d} ${step}px steps give ${rf.toFixed(3)}x the fog of one segment`);
            } else assert.ok(fog(f) <= baseF + 0.5, `${id}/${d} ${step}px steps fog ${fog(f).toFixed(3)} vs ${baseF.toFixed(3)}`);
        }
        // a slow 1 px drag never maxes the centre pixel's fog on one stroke
        const slow = stroke(1);
        assert.ok(slow.fog(64 * 128 + 60) <= one.fog(64 * 128 + 60) + 0.05, `${id}/${d} slow centre fog ${slow.fog(64 * 128 + 60).toFixed(3)}`);
    }
});

test('M1: a zero-length mid-stroke segment lays nothing and leaves the carry unchanged', () => {
    const tool = brushFeel(TOOLS.fine, 'medium'), f = new DustField(128);
    const c = f.brushLine(40, 40, 40, 40, tool, 1.25);
    assert.ok(c === 1.25, `carry ${c}`);
    assert.ok(f.P.reduce((a, v) => a + v, 0) === 0, 'no powder from a zero-length segment');
    // carry is the distance since the last tick: with step radius/3, a 1 px segment from carry 0 lays none, the tick falls later
    const step = tool.radius / 3, g = new DustField(128);
    let carry = 0, ticksAt = -1;
    for (let i = 1; i <= 40 && ticksAt < 0; i++) {
        carry = g.brushLine(i - 1, 10, i, 10, tool, carry);
        if (g.P.reduce((a, v) => a + v, 0) > 0) ticksAt = i;
    }
    assert.ok(ticksAt === Math.ceil(step), `first tick after ${ticksAt} px, step ${step.toFixed(2)}`);
});

test('M1: the game resets the brush carry on pointerdown, Space and Enter brushing start, and carries it in _act', () => {
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.ok((src.match(/this\._brushCarry = 0/g) || []).length >= 3, 'three reset sites');
    assert.ok(/this\._brushCarry = this\.field\.brushLine\(from\.x, from\.y, pos\.x, pos\.y, tool, this\._brushCarry \|\| 0\)/.test(src), 'carry passed through _act');
});

test('item 6: brush feel scales by difficulty and a held key is gentler than a drag', () => {
    const e = brushFeel(TOOLS.fine, 'easy'), m = brushFeel(TOOLS.fine, 'medium'), h = brushFeel(TOOLS.fine, 'hard');
    assert.ok(e.radius > m.radius && m.radius > h.radius, 'radius easy > medium > hard');
    assert.ok(m.radius === TOOLS.fine.radius * 2, 'medium doubles the radius');
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.ok(/const KEY_HOLD_GENTLE = 0\.4/.test(src) && /if \(keyed\) tool\.strength \*= KEY_HOLD_GENTLE/.test(src), 'held-key gentle factor wired');
});

test('m1 (R2): after a broad-to-fine switch mid-stroke every tick lies on the moved segment (t >= 0)', () => {
    for (const d of ['easy', 'medium', 'hard']) {
        const B = brushFeel(TOOLS.broad, d), F = brushFeel(TOOLS.fine, d), f = new DustField(128, { pfog: DIFFICULTY[d].pfog });
        const carry = f.brushLine(30, 64, 30 + B.radius - 0.01, 64, B, 0);   // ends with a carry just under the broad step
        assert.ok(carry > F.radius / 3, `${d}: carry ${carry.toFixed(2)} above the fine step ${(F.radius / 3).toFixed(2)}`);
        const xs = [], orig = f.brush.bind(f);
        f.brush = (x, y, t) => { xs.push(x); orig(x, y, t); };
        f.brushLine(60, 64, 61, 64, F, carry);
        assert.ok(xs.length >= 1, `${d}: a tick lands`);
        assert.ok(xs.every(x => x >= 60 - 1e-9 && x <= 61 + 1e-9), `${d}: ticks at ${xs.map(x => x.toFixed(2)).join(',')} stay on 60..61`);
    }
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.ok(/_chooseTool\(t\) \{[^}]*this\._brushCarry = 0/s.test(src), '_chooseTool resets the carry');
});

test('m2 (R2): a second pointer neither brushes nor ends the active stroke; only the stroke pointer ends it', () => {
    const proto = DustingMinigame.prototype;
    const acts = [];
    const g = {
        step: 'dust', pointerDown: false, lastPt: null, reticle: null, _touchFind: false, _brushCarry: 0, dirty: false,
        canvas: { setPointerCapture() {}, focus() {} },
        _canvasPos: e => ({ x: e.x, y: e.y }), _countStroke() {}, _updateNear() {}, _saveProgress() {},
        _act(pos, from) { acts.push([pos.x, pos.y, from ? from.x : null]); }
    };
    const ev = (type, pointerId, x, y) => ({ type, pointerId, x, y, pointerType: 'touch', preventDefault() {} });
    proto._onPointerDown.call(g, ev('pointerdown', 1, 10, 10));
    assert.ok(g.pointerDown === true && g._pointerId === 1, 'first finger starts the stroke');
    const n = acts.length;
    proto._onPointerDown.call(g, ev('pointerdown', 2, 100, 100));
    proto._onPointerMove.call(g, ev('pointermove', 2, 101, 101));
    assert.ok(acts.length === n, 'second finger down and move lay nothing');
    assert.ok(g.lastPt.x === 10 && g._pointerId === 1 && g._brushCarry === 0, 'second finger did not move lastPt or take over');
    proto._onPointerMove.call(g, ev('pointermove', 1, 12, 10));
    assert.ok(acts.length === n + 1 && acts[n][2] === 10, 'first finger brushes from its own last point, not from the second finger');
    proto._onPointerUp.call(g, ev('pointerup', 2, 101, 101));
    assert.ok(g.pointerDown === true, 'lifting the second finger leaves the stroke running');
    proto._onPointerMove.call(g, ev('pointermove', 1, 14, 10));
    assert.ok(acts.length === n + 2, 'first finger still brushes');
    proto._onPointerUp.call(g, ev('pointercancel', 1, 14, 10));
    assert.ok(g.pointerDown === false && g.lastPt === null, 'the stroke pointer ends it');
    proto._onPointerDown.call(g, ev('pointerdown', 2, 50, 50));
    assert.ok(g.pointerDown === true && g._pointerId === 2, 'a new stroke can start with another pointer once idle');
});
