// Scenario timers are one-shot by design (firedTimers in ui/scenario-timer-dispatcher.js),
// so a timer needs no onceOnly flag. m02 (bed2_ambient_drift, bed4_slow_path_window,
// bed4_death_window) and m04 (trigger_race and four more) carried an ignored onceOnly;
// it was removed. This pins the behaviour that made it redundant: a timer runs its
// setGlobal once however many ticks follow, and a startOnGlobal timer too.
// Run with: node test/js/timer-one-shot.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {
    gameState: { globalVariables: {} },
    eventDispatcher: { on() {}, off() {}, emit() {} }
};
const applyUrl = dataUrl('export function applyActions() { globalThis.__actionRuns = (globalThis.__actionRuns || 0) + 1; return []; }');
const src = readFileSync(join(js, 'ui/scenario-timer-dispatcher.js'), 'utf8')
    .split("'../systems/apply-actions.js'").join(`'${applyUrl}'`);
const { ScenarioTimerDispatcher } = await import(dataUrl(src));
await import(join(js, 'utils/global-condition.js'));

const quiet = (fn) => { const s = [console.log, console.warn]; console.log = console.warn = () => {}; try { return fn(); } finally { [console.log, console.warn] = s; } };

test('a timer fires once however many ticks follow, with or without onceOnly', () => {
    for (const extra of [{}, { onceOnly: true }]) {
        let sets = 0;
        window.gameState.globalVariables = {};
        const d = quiet(() => new ScenarioTimerDispatcher({ timers: [{ id: 't', delayMs: 1000, setGlobal: { x: true }, ...extra }] }));
        d._executeSetGlobal = () => { sets++; };
        quiet(() => { for (let i = 1; i <= 20; i++) d.update(d.startTime + 1000 + i * 500); });
        assert.equal(sets, 1, `fired once (${JSON.stringify(extra)})`);
        assert.ok(d.firedTimers.has('t'));
    }
});

test('a startOnGlobal timer with a condition fires once, and a failed condition does not retry', () => {
    let sets = 0;
    window.gameState.globalVariables = { go: true, blocked: true };
    const d = quiet(() => new ScenarioTimerDispatcher({ timers: [
        { id: 'a', delayMs: 100, startOnGlobal: 'go', condition: '!globalVars.blocked', setGlobal: { a: true } },
        { id: 'b', delayMs: 100, startOnGlobal: 'go', setGlobal: { b: true } }
    ] }));
    d._executeSetGlobal = (g) => { sets += Object.keys(g).join(''); };
    quiet(() => { for (let i = 1; i <= 20; i++) d.update(Date.now() + i * 1000); });
    assert.equal(String(sets).replace(/^0/, ''), 'b', 'only b ran, once; a was blocked by its condition and never retried');
});
