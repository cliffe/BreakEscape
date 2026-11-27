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
            const stageH = p.stacked ? 2 * p.W + 80 : p.W + 46;
            if (innerH < 800) assert.ok(stageH <= M.zoomBudgetH(innerH), `${label} side ${side}: ${stageH} > ${M.zoomBudgetH(innerH)}`);
            assert.ok((p.stacked ? p.W + 4 : 2 * (p.W + 4) + 8) <= availW, `${label} side ${side}: fits the width (stacks, never wraps)`);
        }
    }
    const lim = M.zoomPlan({ side: 120, availW: 308, budgetH: M.zoomBudgetH(700) });
    assert.ok(lim.S === 2 && lim.W * 2 + 80 <= M.zoomBudgetH(700));
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

test('B1: the panel keeps one row of cards, so 2, 3 and 4 cards never wrap at 1280x720 and 1000x700 (root 956)', () => {
    assert.equal(M.comparePanelMin(2), 480);   // the panel is never under PANEL_MIN_W (480)
    assert.equal(M.comparePanelMin(3), 3 * 144 + 2 * 10 + 32);
    assert.equal(M.comparePanelMin(4), 600);
    for (const [cards, innerH] of [[2, 720], [2, 700], [3, 720], [3, 700], [4, 720], [4, 700]]) {
        const availW = 956 - 52 - M.comparePanelMin(cards);
        const panel = 956 - 52 - availW;
        assert.ok(panel >= cards * 144 + (cards - 1) * 8, `${cards} cards fit one row in ${panel}`);
        for (let side = 60; side <= 106; side += 2) {
            const p = M.zoomPlan({ side, availW, budgetH: M.zoomBudgetH(innerH), maxS: 6 });
            if (p.limited) continue;
            assert.ok((p.stacked ? p.W + 4 : 2 * (p.W + 4) + 8) <= availW, `${cards} cards side ${side}: pair fits ${availW}`);
            assert.ok((p.stacked ? 2 * p.W + 80 : p.W + 46) <= M.zoomBudgetH(innerH), `${cards} cards side ${side}: height`);
        }
    }
});

test('M1: pane overheads and the status line allowance', () => {
    assert.equal(M.ZOOM_SBS_EXTRA, 46);
    assert.equal(M.ZOOM_STACK_EXTRA, 80);
    assert.ok(M.ZOOM_STATUS_MAX_H >= 65);
    assert.ok(M.zoomBudgetH(720, 150) > M.zoomBudgetH(720), 'a measured chrome feeds the budget');
});

test('M2: at availW 112 with four cards every lift mark (and card mark) lies inside the limited crop', async () => {
    const G = await import(pathToFileURL(join(root, 'js/minigames/dusting/fingerprint-generator.js')).href);
    const PF = await import(pathToFileURL(join(root, 'js/minigames/dusting/print-features.js')).href);
    const names = ['Alice Moore', 'Bob Kahn', 'Chen Wei', 'Dara Okafor', 'Eve Novak', 'Femi Adeyemi', 'Gwen Hart', 'Hiro Sato'];
    for (const owner of names) for (const rot of [-18, 9, 17]) {
        const pattern = G.patternForOwner(owner);
        const print = G.generatePrint({ size: 128, owner, pattern, variant: { rotation: rot, dx: 2, dy: -3 } });
        const decoys = names.filter(n => n !== owner).slice(0, 3);
        const cands = [owner, ...decoys].map((nm, i) => ({ print: G.generatePrint({ size: 128, owner: nm, pattern: i === 0 ? pattern : G.patternForOwner(nm) }) }));
        const { lift, card } = PF.pickLiftMarks(print, cands[0].print, 3);
        cands.forEach((c, i) => { c.marks = i === 0 ? card : PF.pickDecoyMarks(PF.featuresOf(print, lift), c.print, 3); });
        const sets = [{ marks: PF.uprightMarks(lift, print.centre), centre: print.centre }, ...cands.map(c => ({ marks: PF.uprightMarks(c.marks, c.print.centre), centre: c.print.centre }))];
        const side = PF.cropSide(sets);
        const plan = M.zoomPlan({ side, availW: 112, budgetH: M.zoomBudgetH(720), maxS: 6 });
        const fit = PF.fitCropToMarks(sets, plan.limited ? plan.side : side);
        for (const { marks, centre } of sets) {
            const crop = PF.cropAround({ x: centre.x + fit.ox, y: centre.y + fit.oy }, fit.side);
            for (const m of marks) {
                assert.ok(m.x - 3 >= crop.x && m.x + 3 < crop.x + fit.side && m.y - 3 >= crop.y && m.y + 3 < crop.y + fit.side, `${owner} rot ${rot}: mark ${m.x},${m.y} inside crop ${crop.x},${crop.y} side ${fit.side}`);
            }
        }
    }
});

test('n4: no preferStack; the pair stacks only when side by side would need a smaller scale', () => {
    const budgetH = M.zoomBudgetH(844);
    assert.equal(M.zoomPlan({ side: 60, availW: 700, budgetH, maxS: 2 }).stacked, false, 'room for both: side by side');
    const narrow = M.zoomPlan({ side: 60, availW: 200, budgetH, maxS: 2 });
    assert.equal(narrow.stacked, true, 'side by side does not fit, stacked does');
    assert.equal(narrow.limited, false);
    const game = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    const model = readFileSync(join(pub, 'js/minigames/dusting/dusting-model.js'), 'utf8');
    assert.doesNotMatch(game + model, /preferStack/);
});

test('M1: the CSS caps each card at REF_CARD_W so a long label wraps inside the card', () => {
    const css = readFileSync(join(pub, 'css/dusting.css'), 'utf8');
    const m = css.match(/\.dusting-refs:not\(\[data-count="4"\]\) \.dusting-ref-wrap \{([^}]*)\}/);
    assert.ok(m, 'cap rule exists');
    assert.match(m[1], new RegExp(`flex: 0 0 ${M.REF_CARD_W}px`));
    assert.match(m[1], new RegExp(`max-width: ${M.REF_CARD_W}px`));
    assert.match(css, /\.dusting-ref > span \{[^}]*overflow-wrap: anywhere/);
    assert.equal(M.REF_CARD_W, 144);
    // the four-card grid sizes its own columns (minmax(0, 1fr)), so it needs no fixed cap
    assert.match(css, /\.dusting-refs\[data-count="4"\] \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test('m1: a 3x or larger pair never leaves the panel under 420 px (real sides 86 to 102)', () => {
    assert.equal(M.PANEL_COMFORT_W, 420);
    for (const rootW of [956, 940]) for (const innerH of [720, 700]) for (const cards of [2, 3, 4]) for (let side = 72; side <= 106; side += 2) {
        const p = M.zoomPlanBeside({ side, rootW, cards, budgetH: M.zoomBudgetH(innerH) });
        if (p.limited) continue;
        const pairW = p.stacked ? p.W + 4 : 2 * (p.W + 4) + 8;
        const panel = rootW - 52 - pairW;
        assert.ok(panel >= M.comparePanelMin(cards));
        if (p.S > 2) assert.ok(panel >= 420, `${cards} cards side ${side} S ${p.S}: panel ${panel}`);
    }
    const p2 = M.zoomPlanBeside({ side: 86, rootW: 956, cards: 2, budgetH: M.zoomBudgetH(700) });
    assert.equal(p2.S, 2, '2 cards at side 86 would be 3x with a 376 px panel: capped at 2x');
});

test('m2: the 2x2 retry is gone; 600 px stays the four-card minimum', () => {
    const model = readFileSync(join(pub, 'js/minigames/dusting/dusting-model.js'), 'utf8');
    const game = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.doesNotMatch(model + game, /COMPARE_PANEL_MIN_2X2/);
    assert.equal(M.COMPARE_PANEL_MIN_2X2, undefined);
    assert.equal(M.comparePanelMin(4), 600);
});

test('n1/n2/n3: empty Keys line hidden, PANEL_SLACK, V without aria-keyshortcuts on View buttons and with a repeat guard', () => {
    const game = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.match(game, /this\.keysEl\.hidden = keys === 'Keys: '/);
    assert.equal(M.PANEL_SLACK, 32);
    assert.equal(M.PANEL_SIDE_PAD, undefined);
    assert.doesNotMatch(game, /aria-keyshortcuts="V"/);
    assert.match(game, /if \(e\.repeat\) return;   \/\/ holding V/);
});

test('m1/m2/m3/n1/n2/n4: labels, keys line, spoken marks again, held L, fullLift reason, corner colour', () => {
    const game = readFileSync(join(pub, 'js/minigames/dusting/dusting-game.js'), 'utf8');
    assert.match(game, /aria-pressed="\$\{!!this\.fullLift\}" aria-keyshortcuts="L">Whole lift \(L\)<\/button>/);
    assert.match(game, /Peel and mount \(P\)/);
    assert.match(game, /1 to \$\{n\} picks a card, V views it large/);
    assert.match(game, /data-zmarks/);
    assert.match(game, /zm\.textContent = /);
    assert.match(game, /if \(e\.repeat\) return;   \/\/ holding L/);
    assert.match(game, /fullLiftBy = 'view'/);
    assert.match(game, /this\.fullLiftBy === 'view'/);
    assert.match(game, /src\.data\[3\] === 255 \? \[src\.data\[0\]/);
});
