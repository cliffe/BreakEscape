// Scenario timer HUD: the opt-in "countdownHours" display (sis01 blind playtest,
// 2026-10-03). sis01's ICO deadline is 45 minutes of play standing for the 63 hours
// left of a 72-hour window, so the HUD shows "<n> h left". Every other timer, in
// every other mission, keeps the plain mm:ss it always had.
// Run with: node --test test/js/scenario-timer-countdown.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };

let src = readFileSync(join(js, 'ui/scenario-timer.js'), 'utf8');
src = src.split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { formatTimerCountdown, ScenarioTimerUI } = await import(dataUrl(src));

test('timers without countdownHours still show mm:ss', () => {
    const timer = { id: 't', delayMs: 2700000 };
    assert.equal(formatTimerCountdown(timer, 2700000), '45:00');
    assert.equal(formatTimerCountdown(timer, 61000), '01:01');
    assert.equal(formatTimerCountdown(timer, 60001), '01:01', 'rounds up to the next second, as before');
    assert.equal(formatTimerCountdown(timer, 0), '00:00');
    assert.equal(formatTimerCountdown(timer, -500), '00:00');
});

test('countdownHours maps the whole delay onto that many hours, rounded up', () => {
    const ico = { id: 'ico_deadline', delayMs: 2700000, countdownHours: 63 };
    assert.equal(formatTimerCountdown(ico, 2700000), '63 h left', 'full window at the start');
    assert.equal(formatTimerCountdown(ico, 1350000), '32 h left', 'half the delay is 31.5 hours, shown as 32');
    assert.equal(formatTimerCountdown(ico, 1), '1 h left', 'never shows 0 while time is left');
    assert.equal(formatTimerCountdown(ico, 0), '0 h left');
    // 45 minutes for 63 hours: an hour passes about every 43 seconds of play
    assert.equal(formatTimerCountdown(ico, 2700000 - 42000), '63 h left');
    assert.equal(formatTimerCountdown(ico, 2700000 - 43000), '62 h left');
});

test('a missing or invalid countdownHours falls back to mm:ss', () => {
    assert.equal(formatTimerCountdown({ delayMs: 600000, countdownHours: 0 }, 300000), '05:00');
    assert.equal(formatTimerCountdown({ delayMs: 600000, countdownHours: 'x' }, 300000), '05:00');
    assert.equal(formatTimerCountdown({ delayMs: 0, countdownHours: 63 }, 300000), '05:00');
});

test('the HUD widget uses the hours display for a countdownHours timer only', () => {
    const made = [];
    globalThis.document = {
        getElementById: () => null,
        createElement: () => {
            const el = { style: {}, textContent: '', classList: { add() {}, remove() {} }, appendChild() {} };
            made.push(el);
            return el;
        },
        body: { appendChild() {} }
    };
    const scenario = {
        timers: [
            { id: 'ico', label: 'ICO deadline', delayMs: 2700000, countdownHours: 63, showCountdown: true }
        ]
    };
    const ui = new ScenarioTimerUI(null, scenario);
    clearInterval(ui.tickInterval);
    ui._tick();
    assert.equal(ui.clockElement.textContent, '63 h left');
    assert.equal(ui.labelElement.textContent, 'ICO deadline');

    const plain = new ScenarioTimerUI(null, { timers: [{ id: 'x', label: 'Next', delayMs: 120000, showCountdown: true }] });
    clearInterval(plain.tickInterval);
    plain._tick();
    assert.match(plain.clockElement.textContent, /^0[12]:\d\d$/, 'an ordinary timer still reads mm:ss');
    delete globalThis.document;
});
