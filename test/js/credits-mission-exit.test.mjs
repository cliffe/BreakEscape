// Once the mission has concluded and the credits roll, the visualiser is past the
// point of no return: its close control is EXIT MISSION, and nothing closes it
// back into the game.
// Run with: node --test test/js/credits-mission-exit.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const read = (p) => readFileSync(join(js, p), 'utf8');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = {};
const om = await import(dataUrl(read('systems/objectives-manager.js')));

test('a bond_visualiser conclusion opens the visualiser with missionOver, live and on reload', () => {
    const opened = [];
    globalThis.window = { BondVisualiser: { open: (o) => opened.push(o) }, gameScenario: {} };
    const mgr = Object.create(om.ObjectivesManager?.prototype ?? om.default.prototype);
    mgr.eventDispatcher = { emit() {} };
    const aim = { aimId: 'end', conclusionScreen: { type: 'bond_visualiser', bondVisualiserOpts: { missionOver: false } } };
    mgr.handleMissionConcluded(aim);
    mgr.handleMissionConcluded(aim, { replay: true });
    assert.equal(opened.length, 2);
    assert.ok(opened.every(o => o.missionOver === true), 'a scenario cannot switch it off');
});

test('the music event that rolls the credits marks the mission over', () => {
    const src = read('music/scenario-music-events.js');
    const block = src.slice(src.indexOf('const openCredits ='), src.indexOf('concludeMission().then'));
    assert.match(block, /missionOver:\s+true/);
});

test('the visualiser: missionOver blocks every close and turns the control into EXIT MISSION', () => {
    const src = read('music/bond-visualiser.js');
    assert.match(src, /import \{ returnToMissions \} from '\.\.\/ui\/success-screen\.js';/);
    // Esc, toggle() and the end-of-track auto-close all go through _close_overlay.
    assert.match(src, /function _close_overlay\(\) \{\s+if \(_disableClose \|\| _missionOver\) return;/);
    assert.match(src, /if \(opts\.missionOver\) _missionOver = true;/);
    assert.equal(src.match(/_missionOver\s*=\s*false/g).length, 1, 'only the declaration: never reset once set');
    assert.match(src, /_missionOver \? 'EXIT MISSION' : '✕ CLOSE'/);
    const click = src.slice(src.indexOf("getElementById('bv-close-btn').addEventListener"), src.indexOf('// Skip / Pause'));
    assert.match(click, /if \(_missionOver\) returnToMissions\(\);/);
});

test('returnToMissions is exported and goes to the shell debrief when there is one', async () => {
    globalThis.window = { breakEscapeConfig: { shellReturnUrl: '/debrief/7' }, navigator: {}, location: { href: 'https://game.example/break_escape/games/7' } };
    const src = read('ui/success-screen.js')
        .replace("'../utils/display-dashes.js'", `'${new URL('file://' + join(js, 'utils/display-dashes.js')).href}'`)
        .replace("'../utils/desktop-app.js'", `'${new URL('file://' + join(js, 'utils/desktop-app.js')).href}'`);
    const ss = await import(dataUrl(src));
    const went = [];
    ss.returnToMissions({ navigate: (u) => went.push(u) });
    assert.deepEqual(went, ['https://game.example/debrief/7']);
});
