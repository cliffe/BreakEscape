// Fingerprint generator: determinism, identity, structure, proportions, speed.
// Run with: node test/js/fingerprint-generator.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// The modules are ES modules in a package without "type": "module", so load them from a data: URL.
const here = dirname(fileURLToPath(import.meta.url));
const load = rel => import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/minigames/dusting', rel)).toString('base64'));
const { generatePrint, patternForOwner, hashString, mulberry32, PATTERNS } = await load('fingerprint-generator.js');

const inMask = (p, f) => { let n = 0, s = 0; for (let i = 0; i < p.mask.length; i++) if (p.mask[i] > 0.5) { n++; s += f(i); } return { n, s }; };

test('same inputs give identical ridges', () => {
    const a = generatePrint({ owner: 'Robert Vance', pattern: 'loop', variant: 'x' });
    const b = generatePrint({ owner: 'Robert Vance', pattern: 'loop', variant: 'x' });
    assert.deepEqual(Array.from(a.ridges), Array.from(b.ridges));
    assert.deepEqual(a.minutiae, b.minutiae);
});

test('different owners differ (correlation below 0.5 inside the mask)', () => {
    for (const pattern of PATTERNS) {
        const a = generatePrint({ owner: 'Alice', pattern });
        const b = generatePrint({ owner: 'Bob', pattern });
        let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
        for (let i = 0; i < a.mask.length; i++) {
            if (a.mask[i] <= 0.5 || b.mask[i] <= 0.5) continue;
            n++; sa += a.ridges[i]; sb += b.ridges[i];
            saa += a.ridges[i] ** 2; sbb += b.ridges[i] ** 2; sab += a.ridges[i] * b.ridges[i];
        }
        const corr = (sab / n - (sa / n) * (sb / n)) / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2));
        assert.ok(Math.abs(corr) < 0.5, `${pattern} correlation ${corr}`);
    }
});

test('singular points per pattern', () => {
    for (const owner of ['A', 'B', 'C', 'Robert Vance', 'David Torres']) {
        const l = generatePrint({ owner, pattern: 'loop' });
        assert.equal(l.cores.length, 1); assert.equal(l.deltas.length, 1);
        const w = generatePrint({ owner, pattern: 'whorl' });
        assert.equal(w.cores.length, 2); assert.equal(w.deltas.length, 2);
        const a = generatePrint({ owner, pattern: 'arch' });
        assert.equal(a.cores.length, 0); assert.equal(a.deltas.length, 0);
    }
});

test('ridge share inside the mask is 0.35 to 0.65, with at least 8 minutiae', () => {
    for (const pattern of PATTERNS) for (const owner of ['Alice', 'Robert Vance', 'Zed']) {
        const p = generatePrint({ owner, pattern });
        const { n, s } = inMask(p, i => (p.ridges[i] > 0.5 ? 1 : 0));
        assert.ok(s / n > 0.35 && s / n < 0.65, `${pattern}/${owner} share ${s / n}`);
        const m = p.minutiae.filter(q => p.mask[Math.round(q.y) * p.size + Math.round(q.x)] > 0.5);
        assert.ok(m.length >= 8, `${pattern}/${owner} minutiae ${m.length}`);
        for (const q of p.minutiae) assert.ok(q.type === 'ending' || q.type === 'bifurcation');
    }
});

test('variants are touches of the same finger (shared canonical minutiae) and may be partial', () => {
    const ref = generatePrint({ owner: 'Robert Vance', pattern: 'loop' });
    const v = generatePrint({ owner: 'Robert Vance', pattern: 'loop', variant: 'panel', partial: true });
    const key = m => `${m.ux},${m.uy}`;
    const refKeys = new Set(ref.minutiae.map(key));
    const shared = v.minutiae.filter(m => refKeys.has(key(m)));
    assert.ok(shared.length >= 5, `shared ${shared.length}`);
    const full = inMask(ref, () => 0).n, part = inMask(v, () => 0).n;
    assert.ok(part < full * 0.9, 'partial print has less mask');
    assert.ok(v.bounds.w > 0 && v.bounds.h > 0);
});

test('patternForOwner proportions land near 60/32/8 over 2,000 names', () => {
    const rng = mulberry32(12345);
    const c = { loop: 0, whorl: 0, arch: 0 };
    for (let i = 0; i < 2000; i++) {
        const name = 'n' + Math.floor(rng() * 1e9).toString(36) + ' ' + i;
        c[patternForOwner(name)]++;
    }
    assert.ok(Math.abs(c.loop / 20 - 60) <= 8, JSON.stringify(c));
    assert.ok(Math.abs(c.whorl / 20 - 32) <= 8, JSON.stringify(c));
    assert.ok(Math.abs(c.arch / 20 - 8) <= 8, JSON.stringify(c));
    assert.equal(patternForOwner('Robert Vance'), patternForOwner('Robert Vance'));
    assert.equal(typeof hashString('x'), 'number');
});

test('generatePrint at 128 runs in under 150 ms', () => {
    generatePrint({ owner: 'warm', pattern: 'loop' });
    const worst = Math.max(...PATTERNS.map(pattern => {
        const t = performance.now();
        generatePrint({ owner: 'timing ' + pattern, pattern, variant: 'v', partial: true });
        return performance.now() - t;
    }));
    assert.ok(worst < 150, `worst ${worst.toFixed(0)} ms`);
});
