// Forensic Data Platform: tabs come from the scenario's minigameData (sis03 consistency pass, 2026-10-05).
// The Albion tab set moved out of the engine into scenarios/sis03_cyber_insurance/scenario.json.erb.
// Run with: node --test test/js/forensic-data-platform-tabs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} } };

const base = dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } init() {} start() {} cleanup() {} }');
let src = readFileSync(join(js, 'minigames/forensic-data-platform/forensic-data-platform-minigame.js'), 'utf8');
src = src.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
         .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { ForensicDataPlatformMinigame } = await import(dataUrl(src));

// The sis03 scenario file, rendered just enough to parse: ERB tags out, // comment lines out.
function sis03Scenario() {
    const erb = readFileSync(join(root, 'scenarios/sis03_cyber_insurance/scenario.json.erb'), 'utf8');
    const json = erb
        .replace(/<%#[\s\S]*?%>/g, '')
        .replace(/<%=[\s\S]*?%>/g, '0000')
        .replace(/<%[\s\S]*?%>/g, '')
        .split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    return JSON.parse(json);
}
function fdpObject(scenario) {
    for (const room of Object.values(scenario.rooms)) {
        for (const obj of room.objects || []) if (obj.type === 'forensic_data_platform') return obj;
    }
    return null;
}

const tab = (id, text) => ({ id, label: id.toUpperCase(), heading: `H-${id}`, blocks: [{ type: 'p', html: text }] });

test('scenario-supplied tabs are used as given', () => {
    const tabs = [tab('a', 'alpha'), tab('b', 'beta')];
    assert.deepEqual(ForensicDataPlatformMinigame.resolveTabs({ tabs }), tabs);
});

test('tabs win over a tabSet name', () => {
    const tabs = [tab('a', 'alpha')];
    assert.equal(ForensicDataPlatformMinigame.resolveTabs({ tabs, tabSet: 'anything' }), tabs);
});

test('an unknown tabSet with no tabs renders nothing (and warns)', () => {
    const warn = console.warn; let warned = 0; console.warn = () => { warned++; };
    try {
        assert.deepEqual(ForensicDataPlatformMinigame.resolveTabs({ tabSet: 'albion_sis03' }), []);
        assert.deepEqual(ForensicDataPlatformMinigame.resolveTabs({ tabs: [] }), []);
    } finally { console.warn = warn; }
    assert.equal(warned, 1);
});

test('the constructor renders a scenario tab, honouring showIf', () => {
    const tabs = [{ id: 'x', label: 'X', heading: 'Heading X', blocks: [
        { type: 'p', html: 'always shown' },
        { type: 'p', html: 'only when flag', showIf: 'some_flag' }
    ] }];
    const fdp = new ForensicDataPlatformMinigame({}, { tabs });
    const panel = { innerHTML: '' };
    fdp.gameContainer = { querySelector: () => panel };
    fdp._renderTabContent('x');
    assert.match(panel.innerHTML, /Heading X/);
    assert.match(panel.innerHTML, /always shown/);
    assert.doesNotMatch(panel.innerHTML, /only when flag/);
    window.gameState.globalVariables.some_flag = true;
    fdp._renderTabContent('x');
    assert.match(panel.innerHTML, /only when flag/);
    delete window.gameState.globalVariables.some_flag;
});

test('sis03 supplies its own tabs, including the confirm gate tab, with the story facts', () => {
    const obj = fdpObject(sis03Scenario());
    assert.ok(obj, 'sis03 has a forensic_data_platform object');
    const md = obj.minigameData;
    assert.ok(Array.isArray(md.tabs) && md.tabs.length === 6, 'six tabs in minigameData');
    assert.equal(md.tabSet, undefined, 'no built-in tab set named');
    assert.ok(md.tabs.some(t => t.id === md.confirmGateTab), 'confirmGateTab names a supplied tab');
    const text = JSON.stringify(md.tabs);
    // Facts the old built-in set got wrong (sis03 consistency pass)
    for (const wrong of ['185.220.', 'Romania', 'Mar 17', 'DCSync', 'VOLTAGE_TRIP', '% LEL &rarr;', '06:28', 'showIf']) {
        assert.ok(!text.includes(wrong), `old fact gone: ${wrong}`);
    }
    for (const right of ['10.2.4.12', 'ALB-SRV-02', '198.51.100.45', 'svc.deploy', '03:22', '3.8% by volume', '2.4.1']) {
        assert.ok(text.includes(right), `story fact present: ${right}`);
    }
    const fdp = new ForensicDataPlatformMinigame({}, md);
    assert.equal(fdp._tabs, md.tabs);
});
