// m10 playtest minors: the credits screen's STATUS row looked blank (it blinks to opacity 0
// half the time) and the bridge called the EXIT MISSION overlay "closable".
// Run with: node --test test/js/credits-status-and-exit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape/js');
const vis = readFileSync(join(root, 'music/bond-visualiser.js'), 'utf8');
const stateSrc = readFileSync(join(root, 'systems/test-bridge/state.js'), 'utf8');

test('opening the credits stops the STATUS row blinking', () => {
    const fn = vis.slice(vis.indexOf('function _applyTheme'), vis.indexOf('function _applyScenarioOverlay'));
    assert.match(fn, /creditsStatus\(_statusText, t\?\.status\)/);
    assert.match(fn, /opts\.credits\?\.length \|\| opts\.missionOver\)\) status\.classList\.remove\('bv-blink'\)/);
});

test('the live visualiser still blinks its STATUS row by default', () => {
    assert.match(vis, /<span class="val bv-blink" id="bv-status-val">MONITORING<\/span>/);
});

// Run missionEndState against a minimal DOM.
async function endState(btnClasses) {
    const btn = { style: { display: '' }, classList: { contains: (c) => btnClasses.includes(c) }, getBoundingClientRect: () => ({ width: 80 }) };
    const stage = { innerText: 'OPERATION', closest: () => ({ getBoundingClientRect: () => ({ width: 100 }) }), parentElement: null };
    globalThis.document = {
        querySelector: (s) => (s === '.bv-stage' ? stage : null),
        getElementById: (id) => (id === 'bv-close-btn' ? btn : null),
    };
    const m = stateSrc.match(/function missionEndState\(\) \{[\s\S]*?\n\}\n/);
    const fn = new Function('successScreenState', `${m[0]}; return missionEndState();`);
    return fn(() => null);
}

test('EXIT MISSION is reported as exitMission, not closable', async () => {
    const s = await endState(['bv-exit-btn']);
    assert.equal(s.kind, 'credits');
    assert.equal(s.closable, false);
    assert.equal(s.exitMission, true);
});

test('a plain CLOSE button is still closable', async () => {
    const s = await endState([]);
    assert.equal(s.closable, true);
    assert.equal(s.exitMission, false);
});
