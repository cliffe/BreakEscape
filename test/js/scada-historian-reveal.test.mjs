// SCADA historian (sis02, D167): the viewer must not hand over the answer. Before the
// player makes the finding there is no injection line, hovering or COMPARE RACKS unlock
// nothing, and the report asks what the data shows before it shows the written finding.
// The completion actions are the same as before. Drives the real scene on a small fake DOM.
// Run with: node --test test/js/scada-historian-reveal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape/js');

// ── A small fake DOM: enough for the historian's layout, chart and report ──
function makeNode(tag) {
    const node = {
        tagName: tag, children: [], parent: null, style: {}, dataset: {}, attrs: {}, listeners: {},
        _text: '', id: '', tabIndex: -1, disabled: false, clientWidth: 1000, clientHeight: 400,
        get className() { return [...this._cls].join(' '); },
        set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); },
        get textContent() { return this._text + this.children.map(c => c.textContent).join(''); },
        set textContent(v) { this._text = String(v); this.children = []; },
        set innerHTML(v) { this._text = ''; this.children = []; },
        appendChild(c) { c.parent = node; node.children.push(c); return c; },
        insertBefore(c, ref) { c.parent = node; const i = node.children.indexOf(ref); node.children.splice(i < 0 ? node.children.length : i, 0, c); return c; },
        remove() { if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1); node.parent = null; },
        setAttribute(k, v) { node.attrs[k] = String(v); },
        getAttribute(k) { return node.attrs[k] ?? null; },
        addEventListener(t, fn) { (node.listeners[t] ||= []).push(fn); },
        fire(t, e = {}) { for (const fn of node.listeners[t] || []) fn({ clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {}, ...e }); },
        focus() { fakeDoc.activeElement = node; },
        getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 400 }; },
        querySelector(q) { return all(node, q)[0] || null; },
        querySelectorAll(q) { return all(node, q); },
        get offsetWidth() { return 180; }, get offsetHeight() { return 80; },
    };
    node._cls = new Set();
    node.classList = {
        add: (...c) => c.forEach(x => node._cls.add(x)),
        remove: (...c) => c.forEach(x => node._cls.delete(x)),
        toggle: (c, on) => { const v = on === undefined ? !node._cls.has(c) : !!on; v ? node._cls.add(c) : node._cls.delete(c); return v; },
        contains: (c) => node._cls.has(c),
    };
    return node;
}
function walk(n, out = []) { for (const c of n.children) { out.push(c); walk(c, out); } return out; }
function matches(n, q) {
    const m = q.match(/^([a-z]*)(?:#([\w-]+))?(?:\.([\w-]+))?(?:\[data-([\w-]+)="([^"]*)"\])?$/);
    if (!m) return false;
    const [, tag, id, cls, dk, dv] = m;
    if (tag && n.tagName !== tag) return false;
    if (id && n.id !== id) return false;
    if (cls && !n._cls.has(cls)) return false;
    if (dk && n.dataset[dk.replace(/-(\w)/g, (_, c) => c.toUpperCase())] !== dv) return false;
    return true;
}
function all(rootNode, q) { return walk(rootNode).filter(n => matches(n, q)); }

const fakeDoc = {
    body: makeNode('body'), activeElement: null,
    createElement: (t) => makeNode(t),
    createElementNS: (_ns, t) => makeNode(t),
    createTextNode: (t) => { const n = makeNode('#text'); n.textContent = t; return n; },
    getElementById: (id) => walk(fakeDoc.body).find(n => n.id === id) || null,
    querySelector: (q) => all(fakeDoc.body, q)[0] || null,
    querySelectorAll: (q) => all(fakeDoc.body, q),
    addEventListener() {}, removeEventListener() {},
};

const SD = {
    racks: [
        { id: 'A1', label: 'Rack A1', normalBase: 30.2, noisePeriodMinutes: 3, noiseAmplitude: 0.4 },
        { id: 'A2', label: 'Rack A2', normalBase: 29.9, noisePeriodMinutes: 4, noiseAmplitude: 0.3 },
    ],
    injectionTimestamp: '2026-03-20T23:12:07', injectedValue: 28.0, lastRealTimestamp: '2026-03-20T23:12:06',
    thermalTrendStartTime: '2026-03-20T20:00:00', thermalTrendRate: 0.03,
    historianStartTime: '2026-03-20T18:00:00', historianEndTime: '2026-03-21T06:30:00', sampleIntervalMinutes: 1,
    completionActions: [
        { type: 'set_global', key: 'historian_flatline_found', value: true },
        { type: 'complete_task', taskId: 'review_historian' },
    ],
    progressActions: [
        { type: 'set_global', key: 'rate_of_change_viewed', value: true, trigger: 'overlay_enabled' },
        { type: 'set_global', key: 'compare_racks_viewed', value: true, trigger: 'compare_racks_opened' },
    ],
};

let Scene, dir;
const globalsSet = {}, tasksDone = [];

test.before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'scada-reveal-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    for (const rel of ['minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js',
        'minigames/scada-historian/scada-historian-data.js', 'minigames/scada-historian/scada-historian-minigame.js']) {
        mkdirSync(dirname(join(dir, rel)), { recursive: true });
        writeFileSync(join(dir, rel), readFileSync(join(root, rel), 'utf8'));
    }
    globalThis.document = fakeDoc;
    globalThis.window = globalThis;
    globalThis.requestAnimationFrame = () => 0;
    globalThis.npcManager = { setGlobalVariable: (k, v) => { globalsSet[k] = v; } };
    globalThis.objectivesManager = { completeTask: (id) => tasksDone.push(id) };
    const mod = await import(pathToFileURL(join(dir, 'minigames/scada-historian/scada-historian-minigame.js')).href);
    Scene = mod.ScadaHistorianMinigame;
});
test.after(() => rmSync(dir, { recursive: true, force: true }));

function open() {
    fakeDoc.body.children = [];
    for (const k of Object.keys(globalsSet)) delete globalsSet[k];
    tasksDone.length = 0;
    const container = makeNode('div');
    fakeDoc.body.appendChild(container);
    const scene = new Scene(container, { sprite: { scenarioData: { minigameData: SD } } });
    scene.gameContainer = makeNode('div');
    container.appendChild(scene.gameContainer);
    scene._buildTrendData();
    scene._renderLayout();
    scene._renderChart();
    return scene;
}
const svgLines = () => all(fakeDoc.getElementById('sh-chart-area'), 'line');
const redLines = () => svgLines().filter(l => l.attrs.stroke === '#ff4040');
const hits = () => all(fakeDoc.getElementById('sh-chart-area'), 'rect');
const hitAt = (scene, clock) => {
    const i = scene._visible.findIndex(p => new Date(p.ts).toTimeString().slice(0, 8) === clock);
    assert.ok(i >= 0, `a reading at ${clock}`);
    // Hit rects are appended in point order, except the injection start, which goes last
    const start = scene._visible.findIndex(p => p.isInjectionStart);
    const order = scene._visible.map((_, k) => k).filter(k => k !== start).concat(start >= 0 ? [start] : []);
    return hits()[order.indexOf(i)];
};
const annotateBtn = () => fakeDoc.querySelector('.sh-annotate-btn');
const hint = () => fakeDoc.querySelector('.sh-hint-text').textContent;

test('on open: no injection line, the flat part in the rack colour, ANNOTATE locked', () => {
    const scene = open();
    assert.equal(redLines().length, 0, 'no red injection line before the finding');
    const polys = all(fakeDoc.getElementById('sh-chart-area'), 'polyline');
    assert.ok(polys.length >= 2);
    assert.ok(polys.every(p => p.attrs.stroke === '#f5a623'), 'one colour for the whole rack A1 trace');
    assert.equal(annotateBtn().disabled, true);
    assert.equal(scene._annotateUnlocked, false);
});

test('hovering or clicking a flat reading far from the start, or pressing COMPARE RACKS, unlocks nothing', () => {
    const scene = open();
    hitAt(scene, '04:00:00').fire('mouseenter');
    const tip = fakeDoc.querySelector('.sh-tooltip').textContent;
    assert.match(tip, /Temperature: 28\.0°C/);
    assert.doesNotMatch(tip, /ANOMALY|INJECTION|Flat since|impossible/);
    hitAt(scene, '23:12:07').fire('mouseenter');
    assert.doesNotMatch(fakeDoc.querySelector('.sh-tooltip').textContent, /INJECTION START|DISCONTINUITY/);
    assert.equal(scene._annotateUnlocked, false, 'hover alone unlocks nothing');

    hitAt(scene, '04:00:00').fire('click');
    assert.equal(scene._annotateUnlocked, false, 'a mark far into the flat part is not accepted');
    assert.match(hint(), /Find where it starts/);
    hitAt(scene, '21:00:00').fire('click');
    assert.equal(scene._annotateUnlocked, false);
    assert.match(hint(), /Still moving like a real sensor reading/);

    fakeDoc.getElementById('sh-compare-toggle').fire('click');
    assert.equal(globalsSet.compare_racks_viewed, true, 'compare progress action still fires');
    assert.equal(scene._annotateUnlocked, false, 'COMPARE RACKS does not unlock the finding');
    const banner = fakeDoc.querySelector('.sh-banner').textContent;
    assert.doesNotMatch(banner, /INJECTION|23:12|identical/);
    assert.equal(redLines().length, 0);
});

test('a mark at the cliff unlocks ANNOTATE; the report asks before it tells; a wrong choice retries', () => {
    const scene = open();
    hitAt(scene, '23:13:00').fire('click');
    assert.equal(scene._annotateUnlocked, true);
    assert.equal(annotateBtn().disabled, false);
    assert.equal(redLines().length, 0, 'still no injection line after the mark');
    assert.ok(svgLines().some(l => l._cls.has('sh-mark-line')), 'the player\'s mark is drawn');

    annotateBtn().fire('click');
    const modal = fakeDoc.querySelector('.sh-modal');
    assert.ok(modal);
    assert.equal(fakeDoc.querySelector('.sh-modal-confirm-btn'), null, 'no confirm before the finding');
    assert.doesNotMatch(modal.textContent, /physically impossible|Injection timestamp|Zero-variance/);
    assert.match(modal.textContent, /Marked:2026-03-20 23:13:00/);
    const choices = all(modal, '.sh-choice-btn');
    assert.equal(choices.length, 3);

    choices.find(c => c.dataset.choice === 'dropout').fire('click');
    assert.match(fakeDoc.querySelector('.sh-choice-feedback').textContent, /last real reading/);
    assert.equal(fakeDoc.querySelector('.sh-modal-confirm-btn'), null);
    assert.equal(scene._revealed, false);
    assert.deepEqual(globalsSet, {}, 'nothing set on a wrong choice');
});

test('the right choice reveals the finding and the line; confirm fires the same completion actions', async () => {
    const scene = open();
    hitAt(scene, '23:12:07').fire('click');
    annotateBtn().fire('click');
    fakeDoc.querySelector('.sh-choice-btn[data-choice="written"]').fire('click');
    assert.equal(scene._revealed, true);
    assert.equal(redLines().length, 1, 'injection line drawn once the player has the finding');
    const modal = fakeDoc.querySelector('.sh-modal');
    assert.match(modal.textContent, /physically impossible/);
    assert.match(modal.textContent, /Injection timestamp: 23:12:07/);
    const confirm = fakeDoc.querySelector('.sh-modal-confirm-btn');
    assert.equal(confirm.textContent, '[CONFIRM: MARK AS INJECTION EVENT AT 23:12]');
    assert.equal(fakeDoc.activeElement, confirm, 'focus moves to confirm for keyboard players');
    scene.complete = () => {};
    confirm.fire('click');
    assert.deepEqual(globalsSet, { historian_flatline_found: true });
    assert.deepEqual(tasksDone, ['review_historian']);
    hitAt(scene, '04:00:00').fire('mouseenter');
    assert.match(fakeDoc.querySelector('.sh-tooltip').textContent, /ANOMALY/, 'anomaly tooltip after the finding');
});

test('keyboard: arrows move a reading cursor and Enter marks it', () => {
    const scene = open();
    const area = fakeDoc.getElementById('sh-chart-area');
    assert.equal(area.tabIndex, 0, 'the chart is focusable');
    area.fire('keydown', { key: 'ArrowRight' });
    assert.equal(scene._cursorIdx, 0);
    const target = scene._visible.findIndex(p => p.isInjectionStart);
    area.fire('keydown', { key: 'End' });
    assert.equal(scene._cursorIdx, scene._visible.length - 1);
    area.fire('keydown', { key: 'Enter' });
    assert.equal(scene._annotateUnlocked, false, 'the last reading is far into the flat part');
    area.fire('keydown', { key: 'Home' });
    for (let i = 0; i < Math.floor(target / 60); i++) area.fire('keydown', { key: 'PageDown' });
    while (scene._cursorIdx < target) area.fire('keydown', { key: 'ArrowRight' });
    assert.ok(svgLines().some(l => l._cls.has('sh-cursor-line')), 'the cursor is drawn');
    area.fire('keydown', { key: ' ' });
    assert.equal(scene._annotateUnlocked, true);
});
