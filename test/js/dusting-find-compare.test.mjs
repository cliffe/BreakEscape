// m09 blind playtest: the Find step gave no key line or approach cue, and the Compare cards were too small to
// tell apart. Model checks (proximity, hint timing, mark numbering) plus source/CSS structure checks.
// Run with: node --test test/js/dusting-find-compare.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/dusting');
const read = rel => readFileSync(join(dir, rel), 'utf8');
const load = rel => import('data:text/javascript;base64,' + Buffer.from(read(rel)).toString('base64'));
const css = readFileSync(join(here, '../../public/break_escape/css/dusting.css'), 'utf8');
const game = read('dusting-game.js');
const { generatePrint, patternForOwner, hashString } = await load('fingerprint-generator.js');
const M = await load('dusting-model.js');
const F = await load('print-features.js');

test('hint delay and near radius come from the difficulty', () => {
    assert.equal(M.HINT_AFTER_MS, 8000);
    assert.deepEqual(['easy', 'medium', 'hard'].map(d => M.DIFFICULTY[d].hintAfterMs), [8000, 10000, 15000]);
    assert.deepEqual(['easy', 'medium', 'hard'].map(d => M.DIFFICULTY[d].nearRadius), [8, 8, 5]);
    assert.doesNotMatch(game, /const HINT_AFTER_MS/);
    assert.match(game, /this\.diff\.hintAfterMs\);/);
    assert.match(game, /this\.diff\.nearRadius\)/);
});

test('proximity: near only close to the mask, with hysteresis scaled to the radius', () => {
    const n = 128, mask = new Float32Array(n * n);
    for (let y = 60; y < 70; y++) for (let x = 60; x < 70; x++) mask[y * n + x] = 1;
    assert.equal(M.torchNearPrint(mask, n, 65, 65, 8), true);
    assert.equal(M.torchNearPrint(mask, n, 5, 5, 8), false);
    assert.equal(M.torchNearPrint(mask, n, 60 - 8 - 3, 65, 8), false, 'does not reveal the patch from afar');
    const x = 59 - 11;   // 11 px out: not near on approach, still near on leaving (radius 8, leave 14)
    assert.equal(M.nextNearState(false, mask, n, x, 65, 8), false);
    assert.equal(M.nextNearState(true, mask, n, x, 65, 8), true);
    assert.equal(M.nextNearState(true, mask, n, 59 - 16, 65, 8), false);
    // hard: radius 5, leave 11
    assert.equal(M.nextNearState(false, mask, n, 59 - 7, 65, 5), false);
    assert.equal(M.nextNearState(true, mask, n, 59 - 9, 65, 5), true);
    assert.equal(M.nextNearState(true, mask, n, 59 - 13, 65, 5), false);
});

test('proximity: a real print is near at its centre and not at every corner', () => {
    const p = generatePrint({ owner: 'Margaret Sorensen', pattern: patternForOwner('Margaret Sorensen') });
    const b = p.bounds;
    assert.equal(M.torchNearPrint(p.mask, 128, b.x + b.w / 2, b.y + b.h / 2, 5), true);
    assert.ok([[0, 0], [127, 0], [0, 127], [127, 127]].some(([x, y]) => !M.torchNearPrint(p.mask, 128, x, y, 8)));
});

test('find step: key line by difficulty, one visible copy of the cue, queued announce, touch on lift', () => {
    assert.match(game, /Move the torch with the mouse or arrow keys\. \$\{look\}/);
    assert.match(game, /Look for a dotted patch\./);
    assert.match(game, /Look for a small patch of curved ridges in the beam\./);
    assert.match(game, /findFloor === 0/);
    assert.match(game, /H: hint \(after \$\{Math\.round\(this\.diff\.hintAfterMs \/ 1000\)\} seconds\)/);
    assert.doesNotMatch(game, /data-dyn="near"/, 'the status line is the one visible copy');
    assert.match(game, /Faint ridges catch the light here\./);
    assert.match(game, /this\._saidAt/);
    assert.match(game, /_updateNear\(\);\s*return;/, 'arrow keys call it');
    assert.match(game, /pointerType === 'touch' && this\.step === 'find'/);
    assert.match(game, /!from && !this\._touchFind/);
    assert.match(game, /e\.type === 'pointerup'/);
    assert.match(css, /\.dusting-keys\s*{/);
    const find = game.slice(game.indexOf('_htmlFind() {'), game.indexOf('_htmlPowder() {'));
    assert.doesNotMatch(find, /Click on the patch/, 'the key line carries the controls');
});

test('mark tags: owner card pairs 1..n in order (revealed only after a pick)', () => {
    const owner = 'Margaret Sorensen', pattern = patternForOwner(owner);
    const lift = generatePrint({ owner, pattern, variant: 'sorensen_stamp' });
    const card = generatePrint({ owner, pattern });
    const { lift: lm, card: cm } = F.pickLiftMarks(lift, card, 3);
    const own = F.pairMarkTags(lm, cm);
    assert.deepEqual(own.card, own.lift);
    assert.equal(own.paired, lm.length);
});

test('B1: choosing shows no card tags, no counts in the speech; tags only on rejected cards and after the match', () => {
    const z = game.slice(game.indexOf('_drawZoom() {'), game.indexOf('/** A reference card (ink'));
    assert.match(z, /const reveal = cand\.rejected === true \|\| this\.identified === true/);
    assert.match(z, /reveal \? tags\.card : null/, 'the card pane has no labels before a pick');
    assert.match(z, /if \(!labels\) return;/);
    assert.match(z, /zoomTags = \{ lift: tags\.lift, card: reveal \? tags\.card : \[\] \}/);
    const speech = z.slice(z.indexOf('this._zoomSpeech'));
    assert.doesNotMatch(speech.split('\n')[0], /paired|marked X|\.length|of \$\{/, 'no counts or verdict');
    assert.match(speech, /describeMarks/);
    assert.match(game, /c\.rejected = true;\s*this\.zoomIdx = i;/, 'the zoom stays on the rejected card');
    assert.match(game, /if \(this\.identified\) return this\.correctIndex/);
});

test('B1: words for the non-visual path give no count and no verdict', () => {
    const marks = [{ type: 'bifurcation', dx: 10, dy: -10 }, { type: 'ending', dx: 0, dy: 20 }];
    const lift = F.describeMarks(marks, 'whorl', true);
    assert.equal(lift, '1, a fork above and to the right of the centre; 2, an ending below the centre'.replace('an ending', 'a ridge ending'));
    assert.equal(F.describeMarks(marks, 'loop', false), 'a fork above and to the right of the core; a ridge ending below the core');
    assert.doesNotMatch(lift, /match|pair|of 2|\bX\b/);
});

test('B1: every same-class decoy differs from the lift, whatever skip was needed', () => {
    const names = ['Jesse Tran', 'Noor Haddad', 'Owen Gallagher', 'Voltage', 'Cipher', 'Bob', 'Relay', 'Alice', 'Static', 'Security Guard', 'David Torres', 'Robert Vance'];
    let n = 0;
    for (const owner of ['Margaret Sorensen', 'David Torres', 'Alice', 'Static']) {
        const pattern = patternForOwner(owner);
        for (const obj of ['a', 'b', 'c', 'mug_1']) {
            const lift = generatePrint({ owner, pattern, variant: obj });
            const card = generatePrint({ owner, pattern });
            for (const count of [2, 3]) {
                const { lift: lm } = F.pickLiftMarks(lift, card, count);
                const liftF = F.featuresOf(lift, lm);
                for (const nm of names) for (const dp of ['loop', 'whorl', 'arch']) {
                    const d = generatePrint({ owner: nm, pattern: dp });
                    const marks = F.pickDecoyMarks(liftF, d, count);
                    if (dp === pattern && lm.length) { assert.equal(F.compareFeatures(liftF, F.featuresOf(d, marks)).match, false, `${owner}/${obj}/${nm}/${dp}`); n++; }
                }
            }
        }
    }
    assert.ok(n > 50);
});

test('mark tags: type must agree and each lift mark pairs once', () => {
    const lm = [{ type: 'ending', dx: 10, dy: 0 }, { type: 'bifurcation', dx: -20, dy: 5 }];
    assert.deepEqual(F.pairMarkTags(lm, [{ type: 'bifurcation', dx: 10, dy: 0 }]).card, ['X']);
    assert.deepEqual(F.pairMarkTags(lm, [{ type: 'ending', dx: 12, dy: 1 }, { type: 'ending', dx: 11, dy: 0 }]).card, ['1', 'X']);
    assert.deepEqual(F.pairMarkTags([], []).card, []);
});

test('crop: centred on the reference point, whole numbers, every mark inside', () => {
    const sets = [];
    for (const [owner, v] of [['Margaret Sorensen', 'a'], ['Alice', 'b'], ['Static', 'c'], ['David Torres', 'd'], ['Robert Vance', 'e']]) {
        const pattern = patternForOwner(owner);
        const lift = generatePrint({ owner, pattern, variant: v }), card = generatePrint({ owner, pattern });
        const { lift: lm, card: cm } = F.pickLiftMarks(lift, card, 3);
        const side = F.cropSide([{ marks: lm, centre: lift.centre }, { marks: cm, centre: card.centre }]);
        assert.ok(Number.isInteger(side) && side >= 48 && side <= 120 && side % 2 === 0);
        for (const [pr, marks] of [[lift, lm], [card, cm]]) {
            const c = F.cropAround(pr.centre, side);
            assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
            assert.equal(c.x + side / 2, Math.round(pr.centre.x), 'centred on the reference point');
            for (const m of marks) {
                assert.ok(m.x - 4 >= c.x && m.x + 4 <= c.x + side && m.y - 4 >= c.y && m.y + 4 <= c.y + side, `${owner}: mark and glyph inside the crop`);
            }
        }
        sets.push(side);
    }
    assert.ok(sets.length);
});

test('zoom scale: whole number, at least 2x, and within the real bound over the simulated side range (60 to 106)', () => {
    for (let side = 60; side <= 106; side += 2) {
        for (const [availW, maxH] of [[210, M.ZOOM_MAX_H], [180, M.ZOOM_MAX_H], [150, M.ZOOM_MAX_H_SHORT], [60, M.ZOOM_MAX_H_SHORT], [247, M.ZOOM_MAX_H_SHORT]]) {
            const S = M.zoomScale(side, availW, maxH);
            assert.ok(Number.isInteger(S) && S >= 2 && S <= 6, `S ${S}`);
            const W = S * side;
            // above 2x the pane fits both the width and the height cap; 2x is the floor, so only then may it pass the cap
            if (S > 2) assert.ok(W <= maxH && W <= availW, `side ${side} avail ${availW} cap ${maxH}: ${W}`);
            else assert.ok(W <= Math.max(maxH, 2 * side), `side ${side}: ${W}`);
            // the floor is the only way past the cap: at S = 2 a larger S really did not fit
            if (S === 2) assert.ok(3 * side > maxH || 3 * side > availW, `side ${side} avail ${availW} cap ${maxH}: 3x would have fitted`);
        }
    }
    assert.equal(M.zoomScale(100, 210, M.ZOOM_MAX_H), 2);
    assert.ok(M.ZOOM_MAX_H <= 160 && M.ZOOM_MAX_H_SHORT <= 128);
});

test('glyphs are whole pixels (no arcs at the zoom scale)', () => {
    assert.ok(F.markGlyph('ending').length >= 12);
    assert.equal(F.markGlyph('bifurcation').length, 28);
    for (const t of ['ending', 'bifurcation']) for (const [x, y] of F.markGlyph(t)) assert.ok(Number.isInteger(x) && Number.isInteger(y) && Math.abs(x) <= 3 && Math.abs(y) <= 3);
    const z = game.slice(game.indexOf('_drawZoom() {'), game.indexOf('/** A reference card (ink'));
    assert.doesNotMatch(z, /\.arc\(|\.stroke\(/);
});

test('compare zoom: structure, crisp scale, text tags, pixel-art CSS', () => {
    assert.match(game, /data-zoom/);
    assert.match(game, /imageSmoothingEnabled = false/);
    assert.match(game, /zoomScale\(side, avail, ZOOM_MAX_H_SHORT\)/, 'short landscape: whole-number scale of at least 2x, height capped');
    assert.match(game, /zoomPlanBeside\(\{ side, rootW, cards: this\.candidates\.length, budgetH \}\)/, 'beside the panel the plan fits the width and the height left');
    assert.match(game, /zoomPlan\(\{ side, availW: rootW - 16 - 4, budgetH, maxS: 2 \}\)/, 'narrow screens: 2x at most');
    assert.match(game, /Check that each numbered mark on your lift has the same kind of mark in the same place on the card:/);
    assert.match(game, /Math\.max\(0, Math\.min\(W - 24/, 'tag left is clamped');
    assert.match(game, /t\.textContent = labels\[i\]/, 'tags set by textContent');
    assert.match(game, /'pointerover'/);
    assert.match(game, /'focusin'/);
    const block = css.slice(css.indexOf('.dusting-zoom {'), css.indexOf('Compare screen on a desktop'));
    assert.match(block, /image-rendering: pixelated/);
    assert.match(block, /border: 2px solid/);
    assert.doesNotMatch(block, /border-radius|blur|gradient/);
    assert.match(block, /'VT323'/);
    assert.match(block, /font: 20px/);
});

test('wrong pick: card is rejected, feedback shown above the cards, other cards stay pickable', () => {
    assert.match(game, /c\.rejected = true;[\s\S]{0,600}this\._renderPanel\(\);\s*(?:if \(viaKey\)[^\n]*\n\s*)?this\.announce\(this\.message\)/);
    const html = game.slice(game.indexOf('That is ${/^[aeiou]/i'), game.indexOf('/** The magnified lift'));
    assert.ok(html.indexOf('data-dyn="feedback"') < html.indexOf('_zoomHtml()'), 'feedback sits above the zoom and cards');
    assert.match(game, /if \(!c \|\| c\.rejected\) return;/);
});
