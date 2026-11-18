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

test('hint appears after 8 seconds and the game uses the model constant', () => {
    assert.equal(M.HINT_AFTER_MS, 8000);
    assert.doesNotMatch(game, /const HINT_AFTER_MS/);
    assert.match(game, /HINT_AFTER_MS\)/);
});

test('proximity: near only close to the mask, with hysteresis', () => {
    const n = 128, mask = new Float32Array(n * n);
    for (let y = 60; y < 70; y++) for (let x = 60; x < 70; x++) mask[y * n + x] = 1;
    assert.equal(M.torchNearPrint(mask, n, 65, 65, M.FIND_NEAR_RADIUS), true);
    assert.equal(M.torchNearPrint(mask, n, 5, 5, M.FIND_NEAR_RADIUS), false);
    assert.equal(M.torchNearPrint(mask, n, 60 - M.FIND_NEAR_RADIUS - 3, 65, M.FIND_NEAR_RADIUS), false, 'does not reveal the patch from afar');
    // 11 px from the edge: not near on approach, still near on leaving
    const x = 59 - 11;
    assert.equal(M.nextNearState(false, mask, n, x, 65), false);
    assert.equal(M.nextNearState(true, mask, n, x, 65), true);
    assert.equal(M.nextNearState(true, mask, n, 59 - M.FIND_LEAVE_RADIUS - 2, 65), false);
    assert.ok(M.FIND_LEAVE_RADIUS > M.FIND_NEAR_RADIUS);
});

test('proximity: a real print is near at its centre and not at a corner', () => {
    const p = generatePrint({ owner: 'Margaret Sorensen', pattern: patternForOwner('Margaret Sorensen') });
    const b = p.bounds;
    assert.equal(M.torchNearPrint(p.mask, 128, b.x + b.w / 2, b.y + b.h / 2, M.FIND_NEAR_RADIUS), true);
    const far = [[0, 0], [127, 0], [0, 127], [127, 127]].filter(([x, y]) => !M.torchNearPrint(p.mask, 128, x, y, M.FIND_NEAR_RADIUS));
    assert.ok(far.length >= 1);
});

test('find step: key line, near cue wiring and status text', () => {
    assert.match(game, /class="dusting-keys">Move the torch with the mouse or arrow keys\. Look for a dotted patch\./);
    assert.match(game, /data-dyn="near"/);
    assert.match(game, /Faint ridges catch the light here\./);
    assert.match(game, /if \(near\) this\.announce\(NEAR_TEXT\)/);
    assert.match(game, /_updateNear\(\);\s*return;/, 'arrow keys call it');
    assert.match(css, /\.dusting-keys\s*{/);
    assert.match(css, /\.dusting-near\s*{/);
});

test('mark tags: owner card pairs 1..n in order, decoys show X where they differ', () => {
    const owner = 'Margaret Sorensen', pattern = patternForOwner(owner);
    const lift = generatePrint({ owner, pattern, variant: 'sorensen_stamp' });
    const card = generatePrint({ owner, pattern });
    const { lift: lm, card: cm } = F.pickLiftMarks(lift, card, 3);
    assert.ok(lm.length >= 2);
    const own = F.pairMarkTags(lm, cm);
    assert.deepEqual(own.lift, lm.map((_, i) => String(i + 1)));
    assert.deepEqual(own.card, own.lift, 'same numbers on the matching card');
    assert.equal(own.paired, lm.length);
    for (const nm of ['Jesse Tran', 'Noor Haddad', 'Owen Gallagher']) {
        const dp = patternForOwner(nm);
        const decoy = generatePrint({ owner: nm, pattern: dp });
        const liftF = F.featuresOf(lift, lm);
        const dm = F.pickDecoyMarks(liftF, decoy, 3);
        const t = F.pairMarkTags(lm, dm);
        const differs = !F.compareFeatures(liftF, F.featuresOf(decoy, dm)).match;
        if (differs && dp === pattern && decoy.canonical.opens === lift.canonical.opens) {
            assert.ok(t.paired < lm.length || t.card.includes('X'), `${nm}: a mismatch is visible`);
        }
        assert.equal(new Set(t.card.filter(v => v !== 'X')).size, t.card.filter(v => v !== 'X').length, 'a number is used once');
    }
});

test('mark tags: type must agree and each lift mark pairs once', () => {
    const lm = [{ type: 'ending', dx: 10, dy: 0 }, { type: 'bifurcation', dx: -20, dy: 5 }];
    assert.deepEqual(F.pairMarkTags(lm, [{ type: 'bifurcation', dx: 10, dy: 0 }]).card, ['X']);
    assert.deepEqual(F.pairMarkTags(lm, [{ type: 'ending', dx: 12, dy: 1 }, { type: 'ending', dx: 11, dy: 0 }]).card, ['1', 'X']);
    assert.deepEqual(F.pairMarkTags([], []).card, []);
});

test('crop: whole numbers, inside the canvas, same side for both prints', () => {
    const a = [{ x: 30, y: 40 }, { x: 70, y: 60 }], b = [{ x: 100, y: 120 }];
    const side = F.cropSide([a, b]);
    assert.ok(Number.isInteger(side) && side >= 48 && side <= 80);
    for (const pts of [a, b, []]) {
        const c = F.cropAround(pts, side, 128);
        assert.ok(Number.isInteger(c.x) && Number.isInteger(c.y));
        assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.side <= 128 && c.y + c.side <= 128);
    }
    const c = F.cropAround(a, side, 128);
    for (const p of a) assert.ok(p.x >= c.x && p.x <= c.x + side && p.y >= c.y && p.y <= c.y + side);
});

test('compare zoom: structure, crisp scale, text tags, pixel-art CSS', () => {
    assert.match(game, /data-zoom/);
    assert.match(game, /imageSmoothingEnabled = false/);
    assert.match(game, /Math\.max\(2, Math\.min\(6, Math\.floor\(avail \/ side\)\)\)/, 'whole-number scale of at least 2x');
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
    assert.match(game, /c\.rejected = true;[\s\S]{0,400}this\._renderPanel\(\);\s*this\.announce\(this\.message\)/);
    const html = game.slice(game.indexOf('That is ${/^[aeiou]/i'), game.indexOf('/** The marks key'));
    assert.ok(html.indexOf('data-dyn="feedback"') < html.indexOf('data-zoom'), 'feedback sits above the zoom and cards');
    assert.match(game, /if \(!c \|\| c\.rejected\) return;/);
});
