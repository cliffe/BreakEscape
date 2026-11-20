// Alarm panel: the SVG top pad is 8 (one TOP_PAD constant for SVG_H and the first lamp's cy),
// and a lamp with no offClass paints ap-off instead of an empty class.
// Run with: node --max-old-space-size=2048 test/js/alarm-panel-top-pad.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const dom = new JSDOM('<!doctype html><body><div id="mg"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
window.gameState = { globalVariables: {} };
window.gameAlert = () => {};
window.playUISound = () => {};
const { AlarmPanelMinigame } = await import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/alarm-panel/alarm-panel-minigame.js')).href);

function build(lamps) {
    document.body.innerHTML = '<div id="mg"></div>';
    const el = document.getElementById('mg');
    const mg = new AlarmPanelMinigame(el, { lockable: { scenarioData: { minigameData: { lamps } } } });
    mg.init();
    mg._updateAllLamps();
    return el;
}

test('top pad is 8: svg height and first lamp row both use it', () => {
    const el = build([{ label: 'A', variable: 'a', offClass: 'ap-red', offStatus: 'x', onClass: 'ap-green', onStatus: 'y' },
                      { label: 'B', variable: 'b', offClass: 'ap-red', offStatus: 'x', onClass: 'ap-green', onStatus: 'y' }]);
    const svg = el.querySelector('.ap-svg');
    assert.ok(svg.getAttribute('height') === String(8 + 2 * 68 + 20), 'svg height uses the 8px pad, got ' + svg.getAttribute('height'));
    const firstSep = el.querySelector('.ap-row-sep');
    assert.ok(firstSep.getAttribute('y1') === String(8 + 68), 'first separator at pad + row height, got ' + firstSep.getAttribute('y1'));
});

test('a lamp with no offClass paints ap-off, not an empty class', () => {
    const el = build([{ label: 'A', variable: 'a', offStatus: 'x', onClass: 'ap-green', onStatus: 'y' }]);
    const cls = el.querySelector('#ap-lamp-0').getAttribute('class');
    assert.ok(cls === 'ap-off', 'class is ap-off, got ' + JSON.stringify(cls));
});
