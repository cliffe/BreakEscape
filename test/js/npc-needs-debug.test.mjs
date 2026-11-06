// systems/npc-needs-debug.js: the pure layout helpers behind the need-bar overlay.
// Run with: bin/test-js test/js/npc-needs-debug.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { barColour, barLayout, jobLabel, BAR, NpcNeedsDebug } from '../../public/break_escape/js/systems/npc-needs-debug.js';

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
