// Dusting: how many strokes a real mouse drag needs to unlock Lift (release-gate finding, m09 pass 1).
// The gate harness reported "about 8 sweeps". That came from its click grid: one brush tick per click over a
// small patch in the middle of the print. A real drag goes through brushLine, which lays a tick every
// radius/3 px along the whole stroke. These tests pin the drag cost so a later brush or threshold change
// that makes dusting tedious fails here.
// Run with: node test/js/dusting-sweeps.test.mjs   (no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/dusting');
const load = rel => import('data:text/javascript;base64,' + readFileSync(join(dir, rel)).toString('base64'));
const { generatePrint } = await load('fingerprint-generator.js');
const { DustField, TOOLS, DIFFICULTY, brushFeel } = await load('dusting-model.js');

// The game lays every tool through brushFeel (dusting-model.js: wider and faster, a little by difficulty), so the sweeps use it too.

const print = generatePrint({ owner: 'Margaret Sorensen', pattern: 'whorl', variant: 'panel' });
const b = print.bounds;
let feelDiff = 'medium';
const toolOf = id => brushFeel(TOOLS[id], feelDiff);

/** Horizontal back-and-forth strokes down the print, rows `gap` px apart; returns strokes until coverage >= min. */
function strokesToLift(toolId, diff, gap) {
    feelDiff = diff;
    const tool = toolOf(toolId), min = DIFFICULTY[diff].minCoverage;
    const f = new DustField(print.size, { pfog: DIFFICULTY[diff].pfog });
    let y = b.y, dir = 1, strokes = 0;
    while (strokes < 60) {
        const x0 = b.x - 2, x1 = b.x + b.w + 2;
        if (dir > 0) f.brushLine(x0, y, x1, y, tool, 0); else f.brushLine(x1, y, x0, y, tool, 0);   // carry mode, as the game
        dir = -dir; strokes++;
        y += gap; if (y > b.y + b.h) y = b.y + ((y - b.y) % gap);
        if (f.metrics(print).coverage >= min) return { strokes, rows: Math.ceil(b.h / gap) };
    }
    return { strokes: Infinity, rows: Math.ceil(b.h / gap) };
}

test('a drag zigzag unlocks Lift before it has covered the print once, every tool and difficulty', () => {
    for (const toolId of Object.keys(TOOLS)) {
        for (const diff of Object.keys(DIFFICULTY)) {
            for (const mult of [1, 1.5]) {
                const gap = TOOLS[toolId].radius * 2 * mult;
                const { strokes, rows } = strokesToLift(toolId, diff, gap);
                assert.ok(strokes <= rows, `${toolId}/${diff} gap ${gap}: ${strokes} strokes, one pass is ${rows} rows`);
            }
        }
    }
});

test('absolute cost (D183): about 5 deliberate strokes on medium with the default brush, wand 5 or fewer, feather 3 or fewer', () => {
    const fine = strokesToLift('fine', 'medium', TOOLS.fine.radius * 2).strokes;
    assert.ok(fine >= 2 && fine <= 6, `fine brush medium ${fine} strokes`);
    assert.ok(strokesToLift('wand', 'medium', TOOLS.wand.radius * 2).strokes <= 5);
    assert.ok(strokesToLift('broad', 'medium', TOOLS.broad.radius * 2).strokes <= 3);
});

test('difficulty ordering survives the brush feel: hard needs at least as many strokes as medium, medium as easy', () => {
    for (const toolId of Object.keys(TOOLS)) {
        const at = d => strokesToLift(toolId, d, TOOLS[toolId].radius * 2).strokes;
        assert.ok(at('hard') >= at('medium') && at('medium') >= at('easy'), `${toolId} easy ${at('easy')} medium ${at('medium')} hard ${at('hard')}`);
    }
    assert.ok(strokesToLift('fine', 'hard', TOOLS.fine.radius * 2).strokes > strokesToLift('fine', 'easy', TOOLS.fine.radius * 2).strokes, 'hard fine brush takes more strokes than easy');
});

test('one stroke is a skill moment, not enough on its own', () => {
    for (const toolId of Object.keys(TOOLS)) {
        const { strokes } = strokesToLift(toolId, 'medium', TOOLS[toolId].radius * 2);
        assert.ok(strokes >= 1, `${toolId} needs ${strokes}`);
    }
});

test('click-per-tick input (the gate harness) is far slower than a drag: it is the harness, not the threshold', () => {
    // 4 px click grid over the middle 40 x 32 px of the print, one brushLine-free tick per click.
    const tool = { ...TOOLS.wand, strength: TOOLS.wand.strength * 1.3 }, min = DIFFICULTY.medium.minCoverage;   // the pre-D183 brush the harness used
    const f = new DustField(print.size, { pfog: DIFFICULTY.medium.pfog });
    const cx = Math.round(b.x + b.w / 2), cy = Math.round(b.y + b.h / 2);
    let sweeps = 0, cov = 0;
    while (sweeps < 3 && cov < min) {
        for (let y = cy - 16; y <= cy + 16; y += 4) for (let x = cx - 20; x <= cx + 20; x += 4) f.brush(x, y, tool);
        sweeps++; cov = f.metrics(print).coverage;
    }
    assert.ok(cov < min, `3 click-grid sweeps reached ${cov}`);
    feelDiff = 'medium';
    assert.ok(strokesToLift('wand', 'medium', TOOLS.wand.radius).strokes < 8 * 9, 'a drag needs far fewer inputs than 8 grid sweeps');
});
