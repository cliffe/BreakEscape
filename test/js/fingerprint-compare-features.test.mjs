// F26: the dusting compare step marks a few minutiae round the core on the lift and on every
// reference card, so the cards can be told apart by eye. The lift must match exactly one card,
// every decoy must differ in a feature the wrong-pick sentence names, and it is all deterministic.
// m09 blind playtest F1: two whorl cards read as the same print and the pick was a coin flip.
// Run with: node --test test/js/fingerprint-compare-features.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const load = rel => import('data:text/javascript;base64,' + readFileSync(join(here, '../../public/break_escape/js/minigames/dusting', rel)).toString('base64'));
const { generatePrint, patternForOwner, hashString } = await load('fingerprint-generator.js');
const { DIFFICULTY, decoyPatterns } = await load('dusting-model.js');
const F = await load('print-features.js');

const cache = new Map();
const gen = o => {
    const k = JSON.stringify(o);
    if (!cache.has(k)) cache.set(k, generatePrint(o));
    return cache.get(k);
};

/** The compare step as dusting-game.js builds it: lift, owner's card, decoys, marks. */
function compareSet({ owner, objectId, decoyNames, difficulty }) {
    const diff = DIFFICULTY[difficulty];
    const seed = hashString(`${objectId}|${owner}`);
    const partial = diff.partial === 'always' || (diff.partial === 'maybe' && (seed & 1) === 1);
    const pattern = patternForOwner(owner);
    const lift = gen({ owner, pattern, variant: objectId, partial });
    const ownerCard = gen({ owner, pattern });
    const { lift: liftMarks, card: cardMarks } = F.pickLiftMarks(lift, ownerCard, diff.marks);
    const liftF = F.featuresOf(lift, liftMarks);
    const classes = decoyPatterns(pattern, decoyNames.length, diff.decoySamePattern, seed, decoyNames.map(n => patternForOwner(n)));
    const cards = [{ label: owner, correct: true, print: ownerCard, marks: cardMarks }];
    decoyNames.forEach((nm, k) => {
        const p = gen({ owner: nm, pattern: classes[k] });
        cards.push({ label: nm, correct: false, print: p, marks: F.pickDecoyMarks(liftF, p, diff.marks) });
    });
    for (const c of cards) c.features = F.featuresOf(c.print, c.marks);
    return { lift, liftMarks, liftF, cards, diff };
}

const CASES = [
    // m09: Sorensen's print on her rubber stamp, medium, three named suspects
    { owner: 'Margaret Sorensen', objectId: 'sorensen_stamp', decoyNames: ['Jesse Tran', 'Noor Haddad'], difficulty: 'medium' },
    { owner: 'David Torres', objectId: 'mug_1', decoyNames: ['Owen Gallagher'], difficulty: 'easy' },
    { owner: 'Robert Vance', objectId: 'office_pc', decoyNames: ['Voltage', 'Cipher'], difficulty: 'hard' },
    { owner: 'Alice', objectId: 'keypad_2', decoyNames: ['Bob', 'Relay'], difficulty: 'medium' },
    { owner: 'Static', objectId: 'phone', decoyNames: ['Security Guard', 'Bob'], difficulty: 'hard' }
];

test('generator exposes the canonical reference point and which way a loop opens', () => {
    for (const owner of ['A', 'B', 'Robert Vance', 'David Torres']) {
        const l = generatePrint({ owner, pattern: 'loop' });
        assert.ok(['left', 'right'].includes(l.canonical.opens));
        // the loop opens away from its delta
        const d = l.canonical.deltas[0], c = l.canonical.cores[0];
        assert.equal(l.canonical.opens, d.x > c.x ? 'left' : 'right', owner);
        // upright card: the final-frame centre is the canonical one
        assert.deepEqual(l.centre, l.canonical.centre);
        const w = generatePrint({ owner, pattern: 'whorl' });
        assert.equal(w.canonical.opens, null);
        assert.ok(Math.abs(w.canonical.centre.x - (w.canonical.cores[0].x + w.canonical.cores[1].x) / 2) < 1e-6);
        const a = generatePrint({ owner, pattern: 'arch' });
        assert.equal(a.canonical.opens, null);
        assert.ok(a.canonical.centre.x > 50 && a.canonical.centre.x < 78, 'arch summit near the middle');
    }
});

test('every difficulty marks some minutiae', () => {
    for (const [name, d] of Object.entries(DIFFICULTY)) assert.ok(d.marks >= 2, name);
});

test('the lift carries its marks, and the owner card has the same marks at the same canonical points', () => {
    for (const cs of CASES) {
        const { liftMarks, cards, diff } = compareSet(cs);
        assert.equal(liftMarks.length, diff.marks, `${cs.owner}: full set of marks`);
        const own = cards[0].marks;
        assert.equal(own.length, liftMarks.length);
        liftMarks.forEach((m, i) => {
            assert.equal(own[i].type, m.type);
            assert.equal(Math.round(own[i].ux), Math.round(m.ux));
            assert.equal(Math.round(own[i].uy), Math.round(m.uy));
        });
        // marks sit round the core, apart from each other, on both kinds where the ring has both
        for (const m of liftMarks) assert.ok(Math.hypot(m.dx, m.dy) >= 10 && Math.hypot(m.dx, m.dy) <= 50);
        for (let i = 0; i < liftMarks.length; i++) for (let j = i + 1; j < liftMarks.length; j++) {
            assert.ok(Math.hypot(liftMarks[i].dx - liftMarks[j].dx, liftMarks[i].dy - liftMarks[j].dy) >= 14);
        }
    }
});

test('the lift matches exactly one card, and it is the owner\'s', () => {
    for (const cs of CASES) {
        const { liftF, cards } = compareSet(cs);
        const matching = cards.filter(c => F.compareFeatures(liftF, c.features).match);
        assert.equal(matching.length, 1, `${cs.owner} on ${cs.objectId}`);
        assert.equal(matching[0].correct, true);
    }
});

test('decoys that share the pattern differ in a named feature, and the reason names it', () => {
    let samePattern = 0;
    for (const cs of CASES) {
        const { liftF, cards } = compareSet(cs);
        for (const c of cards.filter(x => !x.correct)) {
            const d = F.compareFeatures(liftF, c.features);
            const why = F.mismatchReason(d, liftF, c.features);
            assert.match(why, /^No match: /);
            if (c.features.pattern === liftF.pattern) {
                samePattern++;
                assert.ok(['opens', 'minutia'].includes(d.feature));
                if (d.feature === 'minutia') assert.match(why, /(a ridge ending|a fork) (to the|above|below)/);
                else assert.match(why, /opens to the (left|right)/);
            } else {
                assert.equal(d.feature, 'pattern');
                assert.match(why, new RegExp(`that card is an? ${c.features.pattern}`));
            }
        }
    }
    assert.ok(samePattern >= 4, `medium and hard put same-pattern decoys in front of the player (${samePattern})`);
});

test('m09: Sorensen\'s stamp shows one whorl decoy that differs by its minutiae', () => {
    const { liftF, cards } = compareSet(CASES[0]);
    assert.equal(liftF.pattern, 'whorl');
    const whorls = cards.filter(c => !c.correct && c.features.pattern === 'whorl');
    assert.equal(whorls.length, 1);
    const d = F.compareFeatures(liftF, whorls[0].features);
    assert.equal(d.feature, 'minutia');
    // the difference is a visible one: the decoy has no same-type mark within SAME_SPOT of that lift mark
    assert.ok(!whorls[0].marks.some(m => m.type === d.mark.type && Math.hypot(m.dx - d.mark.dx, m.dy - d.mark.dy) < F.SAME_SPOT));
});

test('feature choice is deterministic', () => {
    const a = compareSet(CASES[3]), b = compareSet(CASES[3]);
    const strip = s => s.cards.map(c => c.marks.map(m => [m.type, Math.round(m.dx), Math.round(m.dy)]));
    assert.deepEqual(strip(a), strip(b));
});

test('compareFeatures: class first, then minutiae', () => {
    const m = (type, dx, dy) => ({ type, dx, dy });
    const lift = { pattern: 'loop', opens: 'left', marks: [m('ending', 10, 0), m('bifurcation', -12, 8)] };
    assert.equal(F.compareFeatures(lift, { pattern: 'whorl', opens: null, marks: lift.marks }).feature, 'pattern');
    assert.equal(F.compareFeatures(lift, { pattern: 'loop', opens: 'right', marks: lift.marks }).feature, 'opens');
    assert.equal(F.compareFeatures(lift, { pattern: 'loop', opens: 'left', marks: [m('ending', 12, 2), m('bifurcation', -10, 9)] }).match, true);
    const d = F.compareFeatures(lift, { pattern: 'loop', opens: 'left', marks: [m('bifurcation', 11, 1), m('bifurcation', -12, 8)] });
    assert.equal(d.feature, 'minutia');
    assert.equal(F.mismatchReason(d, lift, { pattern: 'loop' }),
        'No match: same pattern, but the minutiae differ. Your lift has a ridge ending to the right of the core; that card has a fork there.');
    const e = F.compareFeatures(lift, { pattern: 'loop', opens: 'left', marks: [m('ending', 10, 0)] });
    assert.match(F.mismatchReason(e, lift, { pattern: 'loop' }), /a fork below and to the left of the core; that card has no marked detail there\.$/);
    assert.equal(F.mismatchReason(F.compareFeatures(lift, { pattern: 'loop', opens: 'right', marks: [] }), lift, { pattern: 'loop', opens: 'right' }),
        "No match: both are loops, but that card's loop opens to the right and your lift's opens to the left. Which way a loop opens is a class characteristic, like the pattern type.");
});

test('spotWords reads directions in the upright card frame (y down)', () => {
    assert.equal(F.spotWords(10, 0), 'to the right of');
    assert.equal(F.spotWords(0, -10), 'above');
    assert.equal(F.spotWords(-10, 10), 'below and to the left of');
    assert.equal(F.spotWords(8, -9), 'above and to the right of');
});
