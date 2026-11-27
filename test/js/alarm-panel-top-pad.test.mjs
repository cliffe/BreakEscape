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

test('a lamp with no onClass paints ap-amber when lit', () => {
    window.gameState.globalVariables.a = true;
    const el = build([{ label: 'A', variable: 'a', offClass: 'ap-off', offStatus: 'x', onStatus: 'y' }]);
    const cls = el.querySelector('#ap-lamp-0').getAttribute('class');
    delete window.gameState.globalVariables.a;
    assert.ok(cls === 'ap-amber', 'lit class is ap-amber, got ' + JSON.stringify(cls));
});

test('every lamp class the m10 board uses has a fill rule, and status text is coloured', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(join(here, '../../public/break_escape/css/alarm-panel-minigame.css'), 'utf8');
    for (const c of ['ap-warning', 'ap-critical']) {
        assert.ok(new RegExp('\\.' + c + '\\s*\\{[^}]*fill:\\s*#[0-9a-f]{6}').test(css), c + ' has a fill rule');
    }
    const mg = new AlarmPanelMinigame(document.getElementById('mg'), {});
    assert.ok(mg._colourFor('ap-warning') === '#f59e0b', 'warning status colour');
    assert.ok(mg._colourFor('ap-critical') === '#ef4444', 'critical status colour');
});

test('every onClass and offClass literal in scenarios has a fill rule in the alarm-panel CSS', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const css = readFileSync(join(here, '../../public/break_escape/css/alarm-panel-minigame.css'), 'utf8');
    const root = join(here, '../../scenarios');
    const files = [];
    const walk = d => { for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.json(\.erb)?$/.test(e.name)) files.push(p);
    } };
    walk(root);
    const used = new Map();
    for (const f of files) {
        for (const m of readFileSync(f, 'utf8').matchAll(/"(?:on|off)Class"\s*:\s*"([^"<>%]+)"/g)) {
            if (!used.has(m[1])) used.set(m[1], f);
        }
    }
    assert.ok(used.size >= 4, 'found lamp classes in scenarios, got ' + used.size);
    for (const [c, f] of used) {
        assert.ok(new RegExp('\\.' + c + '\\s*\\{[^}]*fill:\\s*#[0-9a-f]{6}').test(css), c + ' (used in ' + f + ') has no fill rule');
    }
});
