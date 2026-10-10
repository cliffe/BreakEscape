// Dusting model: section 4 quality targets, brush coverage, tables.
// Run with: node test/js/dusting-model.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// The modules are ES modules in a package without "type": "module", so load them from a data: URL.
const here = dirname(fileURLToPath(import.meta.url));
const load = rel => import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/minigames/dusting', rel)).toString('base64'));
const { generatePrint } = await load('fingerprint-generator.js');
const {
    SURFACES, POWDERS, TOOLS, DIFFICULTY, surfaceForObject, DustField, TapeGrid,
    contrastFactor, liftQuality, ratingFor, developedDensity, wrongPowderReason
} = await load('dusting-model.js');

const print = generatePrint({ owner: 'Robert Vance', pattern: 'loop', variant: 'panel' });
const N = print.size;

const PFOG = DIFFICULTY.medium.pfog;
const quality = (f, { powder = 'silver', surface = 'glossy_dark', tape = 1 } = {}) =>
    liftQuality({ clarity: f.metrics(print).clarity, contrast: contrastFactor(powder, surface), tapeCoverage: tape });

/** Puff over the whole print on a grid, as a player would sweep the reticle across it. */
const puffAll = f => { for (let y = 0; y < N; y += 16) for (let x = 0; x < N; x += 16) f.puff(x, y); };

test('careful even dusting (P = 3), right powder, full tape: 0.95 or better', () => {
    const f = new DustField(N, { pfog: PFOG }); f.fill(3);
    const q = quality(f);
    assert.ok(q >= 0.95, `q ${q}`);
});

test('ordinary player (random strokes over 85% of the print, P 1.5 to 6, tape 80%): 0.88 or better', () => {
    for (let seed = 1; seed <= 8; seed++) {
        let a = seed * 7919;
        const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
        const f = new DustField(N, { pfog: PFOG });
        const b = print.bounds;
        // serpentine strokes with jittery spacing; one contiguous band is skipped so about 85% is developed
        const skipFrom = b.y + (0.1 + rnd() * 0.6) * b.h, skipTo = skipFrom + 0.12 * b.h;
        for (let y = b.y - 2, dir = 1; y < b.y + b.h + 4; y += 3 + rnd() * 2, dir = -dir) {
            if (y > skipFrom && y < skipTo) continue;
            const x0 = b.x - 4, x1 = b.x + b.w + 4;
            const yy = y + (rnd() - 0.5) * 2;
            if (dir > 0) f.brushLine(x0, yy, x1, yy + (rnd() - 0.5) * 3, TOOLS.fine);
            else f.brushLine(x1, yy, x0, yy + (rnd() - 0.5) * 3, TOOLS.fine);
        }
        const m = f.metrics(print);
        assert.ok(m.coverage > 0.72 && m.coverage < 0.95, `seed ${seed} coverage ${m.coverage}`);
        const ps = []; for (let i = 0; i < N * N; i++) if (print.mask[i] > 0.5 && f.P[i] > 0.5) ps.push(f.P[i]);
        ps.sort((x, y) => x - y);
        const med = ps[ps.length >> 1];
        assert.ok(med >= 1.5 && med <= 6, `seed ${seed} median P ${med}`);
        const q = quality(f, { tape: 0.8 });
        assert.ok(q >= 0.88, `seed ${seed} q ${q} coverage ${m.coverage.toFixed(2)} clarity ${m.clarity.toFixed(2)}`);
    }
});

test('over-brushed (P = 12), no puff: 0.75 to 0.9 at every difficulty', () => {
    for (const [name, d] of Object.entries(DIFFICULTY)) {
        const f = new DustField(N, { pfog: d.pfog }); f.fill(12);
        const q = quality(f);
        assert.ok(q >= 0.75 && q <= 0.9, `${name} q ${q}`);
    }
});

test('over-brushed (P = 12), then a puff pass over the print: 0.9 or better', () => {
    for (const [name, d] of Object.entries(DIFFICULTY)) {
        const f = new DustField(N, { pfog: d.pfog }); f.fill(12);
        puffAll(f);
        const q = quality(f);
        assert.ok(q >= 0.9, `${name} q ${q}`);
    }
});

test('puff lowers fog without lowering coverage, and leaves light powder alone', () => {
    const f = new DustField(N, { pfog: PFOG }); f.fill(12);
    const i = 64 * N + 64;
    const before = { fog: f.fog(i), cov: f.metrics(print).coverage };
    assert.ok(f.puff(64, 64));
    assert.ok(f.fog(i) < before.fog, `fog ${before.fog} -> ${f.fog(i)}`);
    assert.ok(f.metrics(print).coverage >= before.cov);
    assert.equal(f.P[i], 2.5 + (12 - 2.5) / 2);
    const far = 2 * N + 2;
    assert.equal(f.P[far], 12, 'outside the radius is untouched');
    const g = new DustField(N); g.fill(2);
    assert.equal(g.puff(64, 64), false);
    assert.equal(g.P[i], 2);
});

test('careful dusting with the wrong powder: 0.8 or better', () => {
    const f = new DustField(N, { pfog: PFOG }); f.fill(3);
    for (const [powder, surface] of [['black', 'glossy_dark'], ['silver', 'glossy_light'], ['black', 'textured']]) {
        const q = quality(f, { powder, surface });
        assert.ok(q >= 0.8, `${powder} on ${surface}: ${q}`);
    }
});

test('minimum lift (coverage just at the threshold, clean, right powder, full tape): 0.6 or better at every difficulty', () => {
    for (const [name, d] of Object.entries(DIFFICULTY)) {
        const f = new DustField(N, { pfog: d.pfog });
        // develop mask pixels in scattered order until coverage reaches the threshold
        const order = [];
        for (let i = 0; i < N * N; i++) if (print.mask[i] > 0.5) order.push(i);
        const target = Math.ceil(order.length * d.minCoverage) + 1;
        for (let k = 0; k < target; k++) { f.P[order[k]] = 3; f.FP[order[k]] = 3; }
        const m = f.metrics(print);
        assert.ok(m.coverage >= d.minCoverage, `${name} coverage ${m.coverage}`);
        const q = quality(f);
        assert.ok(q >= 0.6, `${name} min lift ${q} (clarity ${m.clarity.toFixed(3)})`);
    }
});

test('wrongPowderReason names both powders and the better one', () => {
    assert.equal(wrongPowderReason('black', 'glossy_light'), null);
    assert.equal(wrongPowderReason('silver', 'glossy_dark'), null);
    assert.equal(wrongPowderReason('magnetic', 'textured'), null);
    const r = wrongPowderReason('silver', 'glossy_light');
    assert.match(r, /^Silver powder on a pale glossy surface: low contrast\. Black powder would show these ridges better\.$/);
    assert.match(wrongPowderReason('black', 'textured'), /Magnetic powder would/);
    assert.match(wrongPowderReason('magnetic', 'glossy_dark'), /Silver powder would/);
    assert.equal(wrongPowderReason('nope', 'glossy_dark'), null);
});

test('brushLine leaves no gaps on a 40 px stroke', () => {
    for (const tool of Object.values(TOOLS)) {
        const f = new DustField(N);
        f.brushLine(40, 64, 80, 64, tool);
        for (let x = 40; x <= 80; x++) assert.ok(f.P[64 * N + x] > 0, `${tool.id} gap at x=${x}`);
        // strokes are even: no pixel on the centre line gets more than 2x another (ends excluded)
        const mid = []; for (let x = 50; x <= 70; x++) mid.push(f.P[64 * N + x]);
        assert.ok(Math.max(...mid) / Math.min(...mid) < 1.5, `${tool.id} uneven`);
    }
});

test('brush, reveal and fog behave', () => {
    const f = new DustField(N);
    assert.equal(f.reveal(0), 0);
    assert.equal(f.fog(0), 0);
    f.brush(64, 64, TOOLS.fine);
    const i = 64 * N + 64;
    assert.ok(Math.abs(f.P[i] - 0.35) < 1e-6);
    assert.ok(f.reveal(i) > 0 && f.reveal(i) < 0.35);
    f.fill(30);
    assert.equal(f.fog(0), 0.35);
    const half = new DustField(N, { pfog: 4, fogRate: 0.5 });
    for (let k = 0; k < 40; k++) half.brush(64, 64, TOOLS.fine);
    const full = new DustField(N);
    for (let k = 0; k < 40; k++) full.brush(64, 64, TOOLS.fine);
    assert.ok(half.fog(i) < full.fog(i));
    const d = developedDensity(full, print, i);
    assert.ok(d >= 0 && d <= 1);
});

test('contrastFactor table', () => {
    assert.equal(contrastFactor('black', 'glossy_light'), 1);
    assert.equal(contrastFactor('silver', 'glossy_dark'), 1);
    assert.equal(contrastFactor('magnetic', 'textured'), 1);
    assert.equal(contrastFactor('magnetic', 'glossy_light'), 0.95);
    assert.equal(contrastFactor('magnetic', 'glossy_dark'), 0.95);
    assert.equal(contrastFactor('black', 'glossy_dark'), 0.85);
    assert.equal(contrastFactor('silver', 'glossy_light'), 0.85);
    assert.equal(contrastFactor('black', 'textured'), 0.85);
    assert.equal(contrastFactor('silver', 'textured'), 0.85);
});

test('surfaceForObject', () => {
    assert.equal(surfaceForObject({ type: 'pc' }), 'glossy_dark');
    assert.equal(surfaceForObject({ type: 'office-misc-cup' }), 'glossy_light');
    assert.equal(surfaceForObject({ type: 'keyboard' }), 'textured');
    assert.equal(surfaceForObject({ type: 'phone' }), 'glossy_dark');
    assert.equal(surfaceForObject({ type: 'notes4' }), 'glossy_light');
    assert.equal(surfaceForObject({ type: 'pc', fingerprintSurface: 'textured' }), 'textured');
    assert.equal(surfaceForObject({}), 'glossy_light');
    assert.equal(surfaceForObject(undefined), 'glossy_light');
});

test('tape grid, rating and tables', () => {
    const g = new TapeGrid();
    assert.equal(g.coverage(), 0);
    g.press(50, 50, 10, { x: 0, y: 0, w: 100, h: 100 });
    assert.ok(g.coverage() > 0 && g.coverage() < 1);
    g.press(50, 50, 200, { x: 0, y: 0, w: 100, h: 100 });
    assert.equal(g.coverage(), 1);
    assert.equal(ratingFor(0.95), 'Perfect'); assert.equal(ratingFor(0.9), 'Excellent');
    assert.equal(ratingFor(0.75), 'Good'); assert.equal(ratingFor(0.6), 'Fair');
    assert.equal(ratingFor(0.4), 'Acceptable'); assert.equal(ratingFor(0.39), 'Poor');
    for (const s of Object.values(SURFACES)) { assert.ok(s.description && s.colours.length && POWDERS[s.bestPowder]); }
    for (const p of Object.values(POWDERS)) { assert.ok(p.label && p.kitLabel && p.colour); for (const t of p.tools) assert.ok(TOOLS[t]); }
    for (const d of Object.values(DIFFICULTY)) for (const k of ['pfog', 'minCoverage', 'residueStrength', 'candidates', 'decoySamePattern', 'findHintVisible']) assert.ok(k in d);
    // Easy keeps a same-pattern decoy so the comparison step means looking at ridge detail, not just pattern type
    assert.equal(DIFFICULTY.easy.decoySamePattern, 'one');
});
