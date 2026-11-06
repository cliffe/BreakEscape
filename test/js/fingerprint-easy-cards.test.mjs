// Fingerprint compare step on easy: the reference cards for different people must look different
// by eye (different pattern class, and a clear gap in ridge flow), while the true match still
// lines up with the lift. Backlog item from the m04 playtests, where the two cards looked alike.
// Run with: node --test test/js/fingerprint-easy-cards.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const load = rel => import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/minigames/dusting', rel)).toString('base64'));
const { generatePrint, patternForOwner, hashString, PATTERNS } = await load('fingerprint-generator.js');
const { DIFFICULTY, decoyPatterns } = await load('dusting-model.js');

const OWNERS = ['Robert Vance', 'Security Guard', 'Cipher', 'Relay', 'Voltage', 'Static', 'David Torres', 'Alice', 'Bob'];
const B = 8; // block size for the orientation field

/**
 * Ridge orientation per B x B block, measured from the drawn ridges (structure tensor of the
 * pixel gradient), as doubled-angle unit vectors. Blocks mostly outside the touch are null.
 */
function blockOrientation(p) {
    const N = p.size, nb = N / B, out = [];
    const v = i => p.ridges[i] * p.mask[i];
    for (let by = 0; by < nb; by++) for (let bx = 0; bx < nb; bx++) {
        let gxx = 0, gyy = 0, gxy = 0, inMask = 0;
        for (let y = by * B; y < by * B + B; y++) for (let x = bx * B; x < bx * B + B; x++) {
            if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue;
            const i = y * N + x;
            if (p.mask[i] > 0.5) inMask++;
            const gx = v(i + 1) - v(i - 1), gy = v(i + N) - v(i - N);
            gxx += gx * gx; gyy += gy * gy; gxy += gx * gy;
        }
        if (inMask < B * B * 0.9) { out.push(null); continue; }
        // gradient direction doubled; the ridge runs at right angles, which only flips the sign
        const a = Math.atan2(2 * gxy, gxx - gyy);
        out.push([Math.cos(a), Math.sin(a)]);
    }
    return out;
}

/** Mean sin^2 of the ridge-angle difference over blocks both prints cover: 0 = same flow, 0.5 = unrelated. */
function flowDistance(a, b) {
    const oa = blockOrientation(a), ob = blockOrientation(b);
    let s = 0, n = 0;
    for (let i = 0; i < oa.length; i++) {
        if (!oa[i] || !ob[i]) continue;
        const cos2d = oa[i][0] * ob[i][0] + oa[i][1] * ob[i][1]; // cos of the doubled difference
        s += (1 - cos2d) / 2; n++;
    }
    return s / n;
}

test('easy: every decoy card has a different pattern class from the lift', () => {
    assert.equal(DIFFICULTY.easy.decoySamePattern, 'never');
    for (const lp of PATTERNS) for (let seed = 0; seed < 50; seed++) {
        const d = decoyPatterns(lp, DIFFICULTY.easy.candidates - 1, 'never', seed);
        assert.equal(d.length, DIFFICULTY.easy.candidates - 1);
        for (const p of d) assert.notEqual(p, lp, `lift ${lp} seed ${seed}`);
    }
});

test('a decoy keeps its own class when that already differs, so a person\'s card is the same on every surface', () => {
    assert.deepEqual(decoyPatterns('loop', 1, 'never', 0, ['whorl']), ['whorl']);
    assert.deepEqual(decoyPatterns('loop', 1, 'never', 1, ['whorl']), ['whorl']);
    assert.deepEqual(decoyPatterns('loop', 2, 'never', 0, ['whorl', 'loop']), ['whorl', 'arch']); // own loop clashes, so the seed picks
    // m04: Relay is a whorl in her own right, and is the decoy on both easy surfaces
    assert.equal(patternForOwner('Relay'), 'whorl');
});

test('medium and hard keep their same-class decoys (the minutiae test)', () => {
    for (const lp of PATTERNS) {
        const m = decoyPatterns(lp, DIFFICULTY.medium.candidates - 1, DIFFICULTY.medium.decoySamePattern, 7);
        assert.equal(m[0], lp); assert.notEqual(m[1], lp);
        const h = decoyPatterns(lp, DIFFICULTY.hard.candidates - 1, DIFFICULTY.hard.decoySamePattern, 7);
        assert.deepEqual(h, [lp, lp]);
    }
});

test('m04 surfaces on easy: the decoy class differs from the lift', () => {
    for (const [obj, owner] of [['hall1_round_panel', 'Robert Vance'], ['bms_bypass_module', 'Voltage']]) {
        const lp = patternForOwner(owner);
        const [d] = decoyPatterns(lp, 1, 'never', hashString(`${obj}|${owner}`));
        assert.notEqual(d, lp, `${owner}: ${lp} vs ${d}`);
    }
});

test('cards of different classes differ clearly in ridge flow, for every pair of classes', () => {
    const pairs = [['loop', 'whorl'], ['loop', 'arch'], ['whorl', 'arch']];
    for (const [pa, pb] of pairs) for (const a of OWNERS) for (const b of OWNERS) {
        if (a === b) continue;
        const d = flowDistance(generatePrint({ owner: a, pattern: pa }), generatePrint({ owner: b, pattern: pb }));
        assert.ok(d > 0.12, `${a} ${pa} vs ${b} ${pb}: flow distance ${d.toFixed(3)}`);
    }
});

/**
 * Flow distance between a reference card and a lift of the same finger: each card block is
 * mapped into the lift with the lift's own transform, and the lift's angle there is turned back.
 */
function flowDistanceToLift(ref, lift) {
    const N = ref.size, nb = N / B, or = blockOrientation(ref), ol = blockOrientation(lift);
    const { rotation, dx, dy } = lift.transform;
    const cs = Math.cos(rotation), sn = Math.sin(rotation), c2 = Math.cos(2 * rotation), s2 = Math.sin(2 * rotation);
    let s = 0, n = 0;
    for (let by = 0; by < nb; by++) for (let bx = 0; bx < nb; bx++) {
        const r = or[by * nb + bx];
        if (!r) continue;
        const ux = bx * B + B / 2 - N / 2, uy = by * B + B / 2 - N / 2;
        const lx = Math.floor((cs * ux - sn * uy + N / 2 + dx) / B), ly = Math.floor((sn * ux + cs * uy + N / 2 + dy) / B);
        if (lx < 0 || ly < 0 || lx >= nb || ly >= nb) continue;
        const l = ol[ly * nb + lx];
        if (!l) continue;
        const back = [l[0] * c2 + l[1] * s2, l[1] * c2 - l[0] * s2]; // turn the doubled angle back by 2 * rotation
        s += (1 - (r[0] * back[0] + r[1] * back[1])) / 2; n++;
    }
    return s / n;
}

test('the true match lines up with a real (turned, moved) lift; a card of another class does not', () => {
    for (const owner of OWNERS) for (const pattern of PATTERNS) {
        const ref = generatePrint({ owner, pattern });
        const lift = generatePrint({ owner, pattern, variant: 'surface:' + owner });
        const same = flowDistanceToLift(ref, lift);
        assert.ok(same < 0.06, `${owner} ${pattern}: match distance ${same.toFixed(3)}`);
        const otherClass = PATTERNS.find(p => p !== pattern);
        const wrong = flowDistanceToLift(generatePrint({ owner: owner + ' (other)', pattern: otherClass }), lift);
        assert.ok(wrong > same + 0.08, `${owner} ${pattern} vs ${otherClass}: ${wrong.toFixed(3)} against match ${same.toFixed(3)}`);
    }
});

test('loops have their delta inside the touch, below the core', () => {
    for (const owner of OWNERS) {
        const p = generatePrint({ owner, pattern: 'loop' });
        const [d] = p.deltas, [c] = p.cores;
        assert.ok(p.mask[Math.round(d.y) * p.size + Math.round(d.x)] > 0.3, `${owner} delta at ${d.x},${d.y}`);
        assert.ok(d.y > c.y + 0.15 * p.size, `${owner} delta below the core`);
    }
});

// Shape checks that follow what the eye sees on a card. The old generator passed the class and
// distance checks above but failed these: its loops were a fan of ridges out of the core (recurve
// 0.23 to 0.31) and its arches were steepest at the rim, so loop and arch cards looked alike.

/** Ridge angle (radians, mod pi) at (cx, cy) from the drawn ridges, over a 9 x 9 window. */
function angleAt(p, cx, cy) {
    const N = p.size;
    let gxx = 0, gyy = 0, gxy = 0;
    const v = j => p.ridges[j] * p.mask[j];
    for (let y = Math.round(cy) - 4; y <= Math.round(cy) + 4; y++) for (let x = Math.round(cx) - 4; x <= Math.round(cx) + 4; x++) {
        if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue;
        const i = y * N + x, gx = v(i + 1) - v(i - 1), gy = v(i + N) - v(i - N);
        gxx += gx * gx; gyy += gy * gy; gxy += gx * gy;
    }
    return 0.5 * Math.atan2(2 * gxy, gxx - gyy) + Math.PI / 2; // the ridge runs across the gradient
}
const angleGap = (a, b) => { const d = Math.abs(a - b) % Math.PI; return Math.min(d, Math.PI - d); };

test('loop cards show a clear recurve: ridges run round the core over most of a ring about it', () => {
    for (const owner of OWNERS) {
        const p = generatePrint({ owner, pattern: 'loop' });
        const c = p.cores[0], r = 0.14 * p.size;
        let round = 0, n = 0;
        for (let k = 0; k < 48; k++) {
            const a = k / 48 * 2 * Math.PI, x = c.x + r * Math.cos(a), y = c.y + r * Math.sin(a);
            if (p.mask[Math.round(y) * p.size + Math.round(x)] < 0.6) continue;
            n++;
            if (angleGap(angleAt(p, x, y), a + Math.PI / 2) < Math.PI / 6) round++;
        }
        assert.ok(round / n > 0.5, `${owner}: recurve ${(round / n).toFixed(2)}`);
    }
});

test('arch cards show a hump: steep on the flanks of the middle, flatter towards the rim', () => {
    const N = 128, deg = r => r * 180 / Math.PI;
    for (const owner of OWNERS) {
        const p = generatePrint({ owner, pattern: 'arch', size: N });
        let flank = 0, rim = 0;
        for (const y of [0.5, 0.55, 0.6].map(f => f * N)) for (const s of [-1, 1]) {
            flank += deg(angleGap(angleAt(p, 0.5 * N + s * 0.12 * N, y), 0)) / 6;
            rim += deg(angleGap(angleAt(p, 0.5 * N + s * 0.26 * N, y), 0)) / 6;
        }
        assert.ok(flank > 40 && flank > rim, `${owner}: flank ${flank.toFixed(0)} deg, rim ${rim.toFixed(0)} deg`);
    }
});
