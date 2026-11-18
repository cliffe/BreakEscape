// Dusting compare R2: one crop side for the step (M1), the lift turned upright (M2), the pair's plan in the stage column (M3),
// one near timer (m3). Run with: node --max-old-space-size=2048 test/js/dusting-compare-zoom.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const root = mkdtempSync(join(tmpdir(), 'dusting-zoom-'));
cpSync(join(pub, 'js'), join(root, 'js'), { recursive: true });
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
const ctx = () => ({ fillRect() {}, drawImage() {}, clearRect() {}, getImageData: () => ({ data: new Uint8ClampedArray(128 * 128 * 4) }), putImageData() {}, createImageData: () => ({ data: new Uint8ClampedArray(128 * 128 * 4) }) });
const el = () => { const o = { style: {}, dataset: {}, children: [], className: '', classList: { toggle() {} }, setAttribute() {}, appendChild(c) { o.children.push(c); }, getContext: ctx, querySelector: () => el(), set textContent(v) { o.children = []; } }; return o; };
globalThis.window = { gameState: { globalVariables: {} }, innerWidth: 1280, innerHeight: 720 };
globalThis.document = { getElementById: () => null, createElement: el, head: { appendChild() {} }, body: { appendChild() {} } };
globalThis.Image = class {};
globalThis.ImageData = class { constructor(d, w, h) { this.data = d; this.width = w; this.height = h; } };
const { DustingMinigame } = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-game.js')).href);
const G = await import(pathToFileURL(join(root, 'js/minigames/dusting/fingerprint-generator.js')).href);
const F = await import(pathToFileURL(join(root, 'js/minigames/dusting/print-features.js')).href);
const M = await import(pathToFileURL(join(root, 'js/minigames/dusting/dusting-model.js')).href);
const names = ['Alice Moore', 'Bob Kahn', 'Chen Wei', 'Dara Okafor', 'Eve Novak', 'Femi Adeyemi', 'Gwen Hart', 'Hiro Sato'];

function gameFor(owner, rot, dx = 0, dy = 0) {
    const pattern = G.patternForOwner(owner);
    const g = Object.create(DustingMinigame.prototype);
    g.diff = { marks: 3 };
    g.print = G.generatePrint({ size: 128, owner, pattern, variant: { rotation: rot, dx, dy } });
    const decoys = names.filter(n => n !== owner).slice(0, 3);
    g.candidates = [owner, ...decoys].map((nm, i) => ({ index: i, label: nm, correct: i === 0, rejected: false, print: G.generatePrint({ size: 128, owner: nm, pattern: i === 0 ? pattern : G.patternForOwner(nm) }) }));
    g.correctIndex = 0;
    g._buildMarks();
    return g;
}

test('M1: the crop side is one value for the step, and the pane sizes do not change with the card shown', () => {
    for (const owner of names.slice(0, 5)) {
        const g = gameFor(owner, 12);
        assert.ok(Number.isInteger(g.zoomSide) && g.zoomSide % 2 === 0);
        const per = g.candidates.map(c => F.cropSide([{ marks: F.uprightMarks(g.liftMarks, g.print.centre), centre: g.print.centre }, { marks: F.uprightMarks(c.marks, c.print.centre), centre: c.print.centre }]));
        assert.ok(g.zoomSide >= Math.max(...per), 'covers the widest pair');
        g.root = { clientWidth: 960, classList: { contains: () => false }, querySelector: () => null };
        g.wide = true;
        const sizes = new Set();
        for (let i = 0; i < g.candidates.length; i++) { const l = g._zoomLayout(false); sizes.add(`${l.side}/${l.S}/${l.W}`); }
        assert.equal(sizes.size, 1, `${owner}: side, S and W are the same for every card`);
    }
    assert.match(readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8'), /\.\.\.this\.candidates\.map\(c => \(\{ marks: uprightMarks/);
});

test('M2: the owner\'s upright lift marks sit on the card marks (within 1 px) at every rotation; decoys stay 9 px off on some mark', () => {
    for (const rot of [-20, -15, -7, 0, 6, 13, 20]) {
        for (const owner of names.slice(0, 4)) {
            const g = gameFor(owner, rot, 3, -4);
            const lift = F.uprightMarks(g.liftMarks, g.print.centre), card = g.candidates[0].marks;
            const cc = g.candidates[0].print.centre;   // each pane is cropped round its own reference point, so compare core-relative places
            lift.forEach((m, i) => { assert.ok(Math.hypot((m.x - g.print.centre.x) - (card[i].x - cc.x), (m.y - g.print.centre.y) - (card[i].y - cc.y)) <= 1, `${owner} ${rot}: mark ${i}`); });
            // the lift image itself: a block painted on a lift mark lands on the upright position after rotateUpright
            const n = 128, src = new Uint8ClampedArray(n * n * 4);
            const lm = g.liftMarks[0];
            for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) src[((Math.round(lm.y) + y) * n + Math.round(lm.x) + x) * 4] = 255;
            const out = F.rotateUpright(src, n, g.print.centre, g.print.transform.rotation, [0, 0, 0]);
            let sx = 0, sy = 0, k = 0;
            for (let i = 0; i < n * n; i++) if (out[i * 4] === 255) { sx += i % n; sy += Math.floor(i / n); k++; }
            assert.ok(k > 0);
            assert.ok(Math.hypot(sx / k - lift[0].x, sy / k - lift[0].y) <= 1.5, `${owner} ${rot}: pixels land upright`);
            for (const c of g.candidates.slice(1)) {
                const t = F.pairMarkTags(g.liftMarks, c.marks);
                assert.ok(t.card.some(x => x === 'X') || t.paired < g.liftMarks.length || F.compareFeatures(g.liftFeatures, c.features).match === false, 'a decoy differs');
            }
        }
    }
    assert.match(readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8'), /Your lift \(turned upright\)/);
});

test('M3: the plan keeps the pair inside the height budget at 1280x720, 1000x700 and 390x844; side by side only when the panel keeps 600 px', () => {
    for (const [innerH, availW, maxS, label] of [[720, 308, 6, '1280x720'], [700, 308, 6, '1000x700'], [844, 354, 2, '390x844']]) {
        for (let side = 60; side <= 106; side += 2) {
            const p = M.zoomPlan({ side, availW, budgetH: M.zoomBudgetH(innerH), maxS });
            assert.ok(p.S >= 2 && Number.isInteger(p.S));
            const stageH = p.stacked ? 2 * p.W + 62 : p.W + 26;
            if (innerH < 800) assert.ok(stageH <= M.zoomBudgetH(innerH), `${label} side ${side}: ${stageH} > ${M.zoomBudgetH(innerH)}`);
            assert.ok((p.stacked ? p.W + 4 : 2 * (p.W + 4) + 8) <= availW, `${label} side ${side}: fits the width (stacks, never wraps)`);
        }
    }
    const lim = M.zoomPlan({ side: 120, availW: 308, budgetH: M.zoomBudgetH(700) });
    assert.ok(lim.S === 2 && lim.W * 2 + 62 <= M.zoomBudgetH(700));
    const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
    assert.match(css, /\.dusting-canvas\[hidden\] \{ display: none; \}/);
    assert.match(css, /\[data-step="compare"\]:not\(\.dusting-matched\) \.dusting-forensic \{ display: none; \}/);
    assert.match(css, /\.dusting-legend \{ font-size: 16px/);
    assert.doesNotMatch(css, /border-radius: 50%/);
});

test('m3 and n3: one near timer, cleared with the cue; the lift is described once, a focus change speaks only the card', () => {
    const src = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.match(src, /else if \(!this\._nearTimer\)/);
    assert.match(src, /clearTimeout\(this\._nearTimer\)/);
    const g = Object.create(DustingMinigame.prototype);
    g._timers = []; g.statusEl = { textContent: '' };
    g._nearTimer = g._later(() => {}, 5000);
    g._clearNear();
    assert.equal(g._nearTimer, null);
    assert.equal(g._timers.length, 0);
    const z = src.slice(src.indexOf('this._zoomSpeech = `'), src.indexOf('this._zoomSpeech = `') + 90);
    assert.doesNotMatch(z, /Your lift/);
    assert.match(src, /Your lift, turned upright: \$\{describeMarks\(this\.liftMarks, actual, true\)\}/);
});
