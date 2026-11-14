// systems/npc-needs-debug.js: the pure layout helpers behind the need-bar overlay.
// Run with: bin/test-js test/js/npc-needs-debug.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { barColour, barLayout, jobLabel, BAR, NpcNeedsDebug, wrapLabel, LABEL_MAX_CHARS } from '../../public/break_escape/js/systems/npc-needs-debug.js';

test('barColour: green above urgentAt, amber at or below, red once unmet for maxUnmetMin', () => {
    const cfg = { urgentAt: 40, maxUnmetMin: 5 };
    assert.equal(barColour(41, cfg, 0), 'ok');
    assert.equal(barColour(40, cfg, 0), 'urgent');
    assert.equal(barColour(10, cfg, 4 * 60000), 'urgent');
    assert.equal(barColour(10, cfg, 5 * 60000), 'starved');
    assert.equal(barColour(10, { urgentAt: 40 }, 1e9), 'urgent');   // no maxUnmetMin: never starved
});

test('barLayout: one row per need in name order, fill proportional to level, clamped', () => {
    const rows = barLayout({
        needs: { work: { urgentAt: 50 }, caffeine: { urgentAt: 40 } },
        levels: { work: 50, caffeine: 120 },
        lastSatisfiedAt: {}, clockMs: 0
    });
    assert.deepEqual(rows.map(r => r.need), ['caffeine', 'work']);
    assert.deepEqual(rows.map(r => r.letter), ['C', 'W']);
    assert.equal(rows[0].fillW, BAR.w);
    assert.equal(rows[1].fillW, Math.round(BAR.w / 2));
    assert.equal(rows[1].colour, 'urgent');
    assert.equal(rows[1].y - rows[0].y, BAR.h + BAR.gap);
    assert.deepEqual(barLayout({}), []);
});

test('jobLabel: idle, returning, frozen, windup, goto, using with seconds left, suspended', () => {
    assert.equal(jobLabel({ mode: 'idle', clockMs: 0 }, null), 'idle');
    assert.equal(jobLabel({ mode: 'returning', clockMs: 0 }, null), 'returning');
    assert.equal(jobLabel({ mode: 'frozen', clockMs: 0 }, { targetId: 'fridge' }), 'frozen fridge');
    assert.equal(jobLabel({ mode: 'job', clockMs: 100 }, { windupUntil: 500, phase: 'goto', targetId: 'pc' }), 'windup pc');
    assert.equal(jobLabel({ mode: 'job', clockMs: 1000 }, { phase: 'goto', targetId: 'pc' }), 'goto pc');
    assert.equal(jobLabel({ mode: 'job', clockMs: 1000 }, { phase: 'using', useUntil: 4200, targetId: 'pc' }), 'using 4s pc');
    assert.equal(jobLabel({ mode: 'idle', scriptSuspended: true, clockMs: 0 }, null), 'suspended');
});

test('jobLabel: "leashed" on a job the leash shaped, and on an idle NPC the leash left with nothing', () => {
    assert.equal(jobLabel({ mode: 'job', clockMs: 1000 }, { phase: 'goto_target', targetId: 'kitchen_coffee', leashed: true }), 'goto_target kitchen_coffee leashed');
    assert.equal(jobLabel({ mode: 'job', clockMs: 1000 }, { phase: 'using', useUntil: 4200, targetId: 'k', leashed: true }), 'using 4s k leashed');
    assert.equal(jobLabel({ mode: 'idle', clockMs: 0, leashNoted: { thirst: true } }, null), 'idle leashed');
    assert.equal(jobLabel({ mode: 'idle', clockMs: 0, leashNoted: { thirst: false } }, null), 'idle');
    assert.equal(jobLabel({ mode: 'job', clockMs: 0, leashNoted: { thirst: true } }, { phase: 'goto_target', targetId: 'pc' }), 'goto_target pc', 'the job decides once there is one');
    assert.equal(jobLabel({ mode: 'idle', scriptSuspended: true, clockMs: 0, leashNoted: { thirst: true } }, null), 'suspended');
});

test('overlay is off by default and setEnabled(null) returns to the scenario flag', () => {
    globalThis.window = { gameScenario: {} };
    const d = new NpcNeedsDebug();
    assert.equal(d.enabled, false);
    assert.equal(d.setEnabled(true), true);
    assert.equal(d.setEnabled(null), false);
    window.gameScenario.needsDebugOverlay = true;
    assert.equal(d.enabled, true);
    assert.equal(d.setEnabled(false), false);
    d.update();   // disabled, no needs system: a no-op that must not throw
    delete globalThis.window;
});

test('jobLabel: " private" when only other owners\' private objects were passed over; both labels can show', () => {
    assert.equal(jobLabel({ mode: 'job', clockMs: 0 }, { phase: 'goto_target', targetId: 'pc', privateSkipped: true }), 'goto_target pc private');
    assert.equal(jobLabel({ mode: 'job', clockMs: 0 }, { phase: 'goto_target', targetId: 'k', leashed: true, privateSkipped: true }), 'goto_target k leashed private');
    assert.equal(jobLabel({ mode: 'idle', clockMs: 0, privateNoted: { work: true } }, null), 'idle private');
    assert.equal(jobLabel({ mode: 'idle', clockMs: 0, privateNoted: { work: false } }, null), 'idle');
});

test('access slice 9.2: an F bar for frustration, last, only when given', async () => {
    const { barLayout, FRUSTRATION_COLOUR } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    const needs = { work: { urgentAt: 50 }, caffeine: { urgentAt: 30 } };
    assert.deepEqual(barLayout({ needs, levels: { work: 60, caffeine: 40 } }).map(r => r.letter), ['C', 'W']);
    const rows = barLayout({ needs, levels: { work: 60, caffeine: 40 }, frustration: 40 });
    assert.deepEqual(rows.map(r => r.letter), ['C', 'W', 'F']);
    assert.equal(rows[2].colour, FRUSTRATION_COLOUR);
    assert.equal(rows[2].fillW, Math.round(rows[2].w * 0.4));
});

test('wrapLabel: the job line in short lines at spaces, so it stays over the NPC (UX access R1 finding 8)', () => {
    assert.equal(wrapLabel('dana: using 560s dana_coffee leashed'), 'dana: using 560s\ndana_coffee\nleashed');
    for (const line of wrapLabel('omar: goto omar_pc').split('\n')) assert.ok(line.length <= LABEL_MAX_CHARS);
    assert.equal(wrapLabel('a_very_long_object_identifier'), 'a_very_long_object_identifier', 'a long word keeps its own line');
    assert.equal(wrapLabel(''), '');
});

// Critique S01: the showcase overlay is readable (GNF bitmap font, display names) and the
// panels no longer sit on top of each other.
test('stackOverlayBoxes: the lowest block stays, an overlapping one above it moves clear', async () => {
    const { stackOverlayBoxes } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    const dy = stackOverlayBoxes([
        { id: 'low', x: 0, y: 100, w: 40, h: 30 },
        { id: 'high', x: 10, y: 90, w: 40, h: 30 },
        { id: 'apart', x: 200, y: 95, w: 40, h: 30 }
    ], 2);
    assert.equal(dy.low, 0);
    assert.equal(dy.high, 100 - 2 - 30 - 90, 'moved up to clear the low block by the gap');
    assert.equal(dy.apart, 0, 'no horizontal overlap: stays');
});

test('stackOverlayBoxes: a chain of three overlapping blocks stacks into a column', async () => {
    const { stackOverlayBoxes } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    const dy = stackOverlayBoxes([
        { id: 'a', x: 0, y: 100, w: 40, h: 20 }, { id: 'b', x: 5, y: 98, w: 40, h: 20 }, { id: 'c', x: 2, y: 96, w: 40, h: 20 }
    ], 2);
    const top = (id, y) => y + dy[id];
    assert.ok(top('b', 98) + 20 + 2 <= 100);
    assert.ok(top('c', 96) + 20 + 2 <= top('b', 98));
});

test('stackOverlayBoxes stable: two NPCs passing each other never swap panels', async () => {
    const { stackOverlayBoxes } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    // "ann" sorts first, so she keeps her place whichever block is lower; the other goes up
    for (const [annY, bobY] of [[100, 90], [90, 100], [95, 95]]) {
        const dy = stackOverlayBoxes([
            { id: 'bob', x: 5, y: bobY, w: 40, h: 30 }, { id: 'ann', x: 0, y: annY, w: 40, h: 30 }
        ], 2, true);
        assert.equal(dy.ann, 0, `ann stays when her block is at ${annY} and bob's at ${bobY}`);
        assert.ok(bobY + dy.bob + 30 + 2 <= annY, 'bob clears ann');
    }
    // input order does not matter
    const a = stackOverlayBoxes([{ id: 'x', x: 0, y: 5, w: 9, h: 9 }, { id: 'y', x: 0, y: 5, w: 9, h: 9 }], 2, true);
    const b = stackOverlayBoxes([{ id: 'y', x: 0, y: 5, w: 9, h: 9 }, { id: 'x', x: 0, y: 5, w: 9, h: 9 }], 2, true);
    assert.deepEqual(a, b);
});

test('npcLabelName: the display name when the NPC manager has one, else the id', async () => {
    const { npcLabelName } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    const w = { npcManager: { getNPC: (id) => (id === 'amara' ? { displayName: 'Amara Osei' } : null) } };
    assert.equal(npcLabelName('amara', w), 'Amara Osei');
    assert.equal(npcLabelName('tom', w), 'tom');
    assert.equal(npcLabelName('tom', {}), 'tom');
});

test('the overlay draws with the GNF bitmap font helper, not VT323 canvas text', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../../public/break_escape/js/systems/npc-needs-debug.js', import.meta.url), 'utf8');
    assert.match(src, /from '\.\.\/utils\/pixel-text\.js'/);
    assert.doesNotMatch(src, /VT323/);
    assert.doesNotMatch(src, /scene\.add\.text\(/);
});

test('stackOverlayBoxes minTop: a block that would climb out of the view goes below instead', async () => {
    const { stackOverlayBoxes } = await import('../../public/break_escape/js/systems/npc-needs-debug.js');
    const boxes = [
        { id: 'a', x: 0, y: 40, w: 40, h: 30 },
        { id: 'b', x: 5, y: 38, w: 40, h: 30 },
        { id: 'c', x: 2, y: 36, w: 40, h: 30 }
    ];
    const free = stackOverlayBoxes(boxes, 2, true);
    assert.ok(36 + free.c < 0, 'without a limit the third panel leaves the top of the view');
    const dy = stackOverlayBoxes(boxes, 2, true, 0);
    for (const b of boxes) assert.ok(b.y + dy[b.id] >= 0, `${b.id} stays inside the view`);
    const placed = boxes.map((b) => ({ ...b, y: b.y + dy[b.id] }));
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
        const p = placed[i], q = placed[j];
        assert.ok(p.y + p.h <= q.y || q.y + q.h <= p.y, `${p.id} and ${q.id} do not overlap`);
    }
});
