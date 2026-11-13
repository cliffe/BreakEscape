// gameClock story rate and phase anchors (7.5f, m05 M6): phone timestamps can follow
// the story ("half past four" at the start, after eight by the evening scene) instead
// of running at wall speed. Run with: node --test test/js/game-clock-rate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/systems/game-clock.js'), 'utf8');
globalThis.window = {};
const { GameClock, messageClockText, parseGameClockRate } =
    await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const MIN = 60_000;

test('rate: game minutes per real minute', () => {
    const c = new GameClock({ config: { start: 'Wed 16:30', rate: 6 }, now: 0 });
    assert.equal(c.formatStamp(0), 'Wed 16:30');
    assert.equal(c.formatStamp(10 * MIN), 'Wed 17:30');       // 10 real minutes = 1 game hour
    assert.equal(c.formatStamp(80 * MIN), 'Thu 00:30');       // rolls over the day
    assert.equal(c.formatClock(30_000, true), '16:33:00');
});

test('no rate, a bad rate or a string config keeps 1:1', () => {
    assert.equal(parseGameClockRate({ start: '09:00' }), 1);
    assert.equal(parseGameClockRate({ rate: 0 }), 1);
    assert.equal(parseGameClockRate({ rate: -3 }), 1);
    assert.equal(parseGameClockRate({ rate: 'fast' }), 1);
    assert.equal(parseGameClockRate('Tue 07:30'), 1);
    assert.equal(new GameClock({ config: 'Tue 07:30', now: 0 }).formatStamp(12 * MIN), 'Tue 07:42');
});

test('a preloaded text sent before the game started keeps its written gap at any rate', () => {
    const c = new GameClock({ config: { start: 'Wed 16:30', rate: 6 }, now: 0 });
    assert.equal(c.formatClock(-20 * MIN), '16:10');
});

test('an anchor jumps the clock forward when its condition first holds, and the rate carries on from there', () => {
    const globals = { evening: false };
    const holds = (cond) => cond === 'globalVars.evening === true' && globals.evening === true;
    const T0 = 1_000_000;
    const c = new GameClock({ config: { start: 'Wed 16:30', rate: 6,
        anchors: [{ condition: 'globalVars.evening === true', time: '20:10' }] }, now: T0 });

    assert.equal(c.checkAnchors(holds, T0 + 5 * MIN), false, 'condition false: no jump');
    assert.equal(c.formatStamp(5 * MIN), 'Wed 17:00');

    globals.evening = true;
    assert.equal(c.checkAnchors(holds, T0 + 20 * MIN), true);
    assert.equal(c.formatStamp(20 * MIN), 'Wed 20:10');
    assert.equal(c.formatStamp(25 * MIN), 'Wed 20:40', 'rate 6 from the anchor');
    // A message from before the anchor keeps the time it had
    assert.equal(c.formatStamp(5 * MIN), 'Wed 17:00');
    assert.equal(c.checkAnchors(holds, T0 + 30 * MIN), false, 'an anchor fires once');
});

test('an anchor never winds the clock back', () => {
    const c = new GameClock({ config: { start: 'Wed 19:00', rate: 6,
        anchors: [{ condition: 'globalVars.a', time: '19:30' }] }, now: 0 });
    // 10 real minutes in it is already 20:00
    assert.equal(c.checkAnchors(() => true, 10 * MIN), false);
    assert.equal(c.formatStamp(10 * MIN), 'Wed 20:00');
    assert.equal(c.formatStamp(15 * MIN), 'Wed 20:30');
});

test('an anchor with a day lands on that day', () => {
    const c = new GameClock({ config: { start: 'Wed 22:00',
        anchors: [{ condition: 'globalVars.morning', time: 'Thu 07:00' }] }, now: 0 });
    c.checkAnchors(() => true, MIN);
    assert.equal(c.formatStamp(MIN), 'Thu 07:00');
});

test('reached anchors are exported and restored, so a reload keeps every time', () => {
    const cfg = { start: 'Wed 16:30', rate: 6, anchors: [{ condition: 'globalVars.evening', time: '20:10' }] };
    const before = new GameClock({ config: cfg, now: 0 });
    before.checkAnchors(() => true, 20 * MIN);
    const saved = JSON.parse(JSON.stringify(before.exportState(30 * MIN)));
    assert.deepEqual(saved, { elapsedMs: 30 * MIN, anchors: { 0: { atMs: 20 * MIN, gameSec: 20 * 3600 + 10 * 60 } } });

    const after = new GameClock({ config: cfg, saved, now: 1e9 });
    assert.equal(after.formatStamp(20 * MIN), 'Wed 20:10');
    assert.equal(after.formatStamp(5 * MIN), 'Wed 17:00');
    assert.equal(after.checkAnchors(() => true, 1e9 + MIN), false, 'already reached');
    // Phone message times follow the same mapping
    assert.equal(messageClockText({ gameTime: 25 * MIN }, after), '20:40');
});

test('without anchors exportState is unchanged', () => {
    assert.deepEqual(new GameClock({ config: { start: '09:00', rate: 2 }, now: 0 }).exportState(5000), { elapsedMs: 5000 });
});
