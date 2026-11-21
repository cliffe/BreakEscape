// sis sweep 8 items: (1) sis02 Confirm SIS Tamper waits for the certification record and says
// why; it enables live when sis_certification_seen is set. (4) sis01's ransom screen counts
// down at the story rate of the HUD clock (timerRate), not in real time.
// Run with: node --max-old-space-size=2048 test/js/sis-gate-items.test.mjs
// SIS_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SIS_JS_ROOT ? join(process.env.SIS_JS_ROOT, '..') : join(here, '../../public/break_escape');
const js = join(root, 'js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.gameState = { globalVariables: {} };
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// ---- item 1: sis02 tamper gate ---------------------------------------------------------------
const sis = await import(pathToFileURL(join(js, 'minigames/sis-config-threshold/sis-config-threshold-minigame.js')).href);
const S = sis.SisConfigThresholdMinigame;

function panel() {
    const gc = document.createElement('div');
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(gc);
    const f = { gameContainer: gc, container, rows: [{ parameter: 'A', currentValue: '1', status: 'AMBER' }],
        compareTitle: 'Compare', confirmLabel: 'Confirm SIS Tamper - Report to Security',
        addEventListener(el, ev, fn) { el.addEventListener(ev, fn); }, shown: 0 };
    for (const m of ['render', 'bindEvents', 'hasCertificationDoc', 'refreshCertificationGate', 'subscribeCertificationGate', 'cleanup']) f[m] = S.prototype[m];
    f.showDetail = () => {};
    f.showCompare = () => {};
    f.showConfirm = () => { f.shown += 1; };
    return f;
}

test('item 1: Confirm is disabled and the panel says why before the certification record is seen', () => {
    window.gameState.globalVariables = {};
    window.objectivesManager = undefined;
    const f = panel();
    f.render(); f.bindEvents();
    const btn = f.gameContainer.querySelector('#sis-confirm-btn');
    assert.ok(btn.disabled === true, 'Confirm is disabled');
    const reason = f.gameContainer.querySelector('#sis-confirm-reason');
    assert.ok(reason !== null && /Certification record needed to confirm tampering/.test(reason.textContent), 'reason line is in the panel');
    assert.ok(btn.getAttribute('aria-describedby') === 'sis-confirm-reason', 'button points at the reason');
    btn.click();
    assert.ok(f.shown === 0, 'a click does nothing while locked');
});

test('item 1: the panel itself is not locked (rows and Compare label still render)', () => {
    window.gameState.globalVariables = {};
    const f = panel();
    f.render();
    assert.ok(f.gameContainer.querySelector('tr[data-clickable="true"]') !== null, 'the flagged row is still clickable');
    assert.ok(f.gameContainer.querySelector('.sis-threshold-main').hasAttribute('inert') === false, 'panel not inert');
});

test('item 1: Confirm is enabled when the global is already set on open', () => {
    window.gameState.globalVariables = { sis_certification_seen: true };
    const f = panel();
    f.render(); f.bindEvents();
    const btn = f.gameContainer.querySelector('#sis-confirm-btn');
    assert.ok(btn.disabled === false, 'enabled');
    assert.ok(f.gameContainer.querySelector('#sis-confirm-reason').textContent === '', 'no reason line');
    btn.click();
    assert.ok(f.shown === 1, 'the click opens the confirm');
});

test('item 1: Confirm enables live when the global becomes set while the panel is open', () => {
    window.gameState.globalVariables = {};
    const handlers = {};
    window.eventDispatcher = { on(e, h) { handlers[e] = h; }, off(e) { delete handlers[e]; }, emit() {} };
    const f = panel();
    f.render(); f.bindEvents(); f.subscribeCertificationGate();
    const h = handlers['global_variable_changed:sis_certification_seen'];
    assert.ok(typeof h === 'function', 'subscribed to the global');
    assert.ok(f.gameContainer.querySelector('#sis-confirm-btn').disabled === true, 'locked first');
    window.gameState.globalVariables.sis_certification_seen = true;
    h();
    assert.ok(f.gameContainer.querySelector('#sis-confirm-btn').disabled === false, 'enabled live');
    assert.ok(f.gameContainer.querySelector('#sis-confirm-reason').textContent === '', 'reason cleared');
    assert.ok(f.gameContainer.querySelector('#sis-compare-btn').disabled === false, 'Compare enabled too');
});

test('item 1: the reason line is pixel-font text with a non-colour marker', () => {
    const c = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    assert.ok(/\.sis-confirm-reason:not\(:empty\)::before/.test(c), 'a text marker precedes the reason');
    assert.ok(/\.sis-btn-confirm\[disabled\]/.test(c), 'a disabled style for Confirm');
    assert.ok(!/border-radius:\s*[1-9]/.test(c.slice(c.indexOf('.sis-confirm-reason'), c.indexOf('.sis-confirm-reason') + 200)), 'no radius');
});

test('item 1: the scenario sets sis_certification_seen from a readable item', () => {
    const erb = readFileSync(join(here, '../../scenarios/sis02_energy/scenario.json.erb'), 'utf8');
    assert.ok(/"onRead":\s*\{\s*"setVariable":\s*\{\s*"sis_certification_seen":\s*true/.test(erb), 'a document sets the global on read');
});

// ---- item 4: sis01 ransom countdown ---------------------------------------------------------------
const ransomPath = join(js, 'minigames/ransomware-display/ransomware-display-minigame.js');
let rsrc = readFileSync(ransomPath, 'utf8');
const base = dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } init() {} start() {} cleanup() {} }');
rsrc = rsrc.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
    .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split(`'../../config.js'`).join(`'${dataUrl("export const ASSETS_PATH = '/a'; export const ASSETS_VERSION = '1';")}'`)
    .split(`'../../utils/escape-html.js'`).join(`'${dataUrl('export const escapeHtml = (s) => String(s);')}'`);
const R = await import(dataUrl(rsrc));

function ransomFake(minigameData, start) {
    window.gameState = { globalVariables: { ransomware_deployed: true }, startTime: start };
    const gc = document.createElement('div');
    gc.innerHTML = '<span id="ransomware-timer-value"></span><span id="ransomware-timer-label"></span>';
    const f = { gameContainer: gc, params: { lockable: { scenarioData: { minigameData } } } };
    for (const m of ['getScenarioStartTimestamp', 'ensureDeadlineTimestamp', 'updateTimerDisplay']) f[m] = R.RansomwareDisplayMinigame.prototype[m];
    f.ensureDeadlineTimestamp();
    return f;
}

test('item 4: timerRate 84 counts 62 h down at the HUD rate (63 h in 45 minutes)', () => {
    assert.ok(typeof R.ransomTimerRate === 'function', 'ransomTimerRate exported');
    const realNow = Date.now;
    const t0 = 1_700_000_000_000;
    try {
        Date.now = () => t0 + 60_000;
        const f = ransomFake({ timerHours: 62, timerRate: 84 }, t0);
        f.updateTimerDisplay();
        const txt = f.gameContainer.querySelector('#ransomware-timer-value').textContent;
        // 62 h minus 60 s at 84x (1h24m) = 60:36:00
        assert.ok(txt === '60:36:00', 'one minute of play is 84 story minutes, got ' + txt);
        Date.now = () => t0 + 45 * 60_000;
        f.updateTimerDisplay();
        assert.ok(f.gameContainer.querySelector('#ransomware-timer-value').textContent === '00:00:00', 'expired by the end of the 45-minute window');
    } finally { Date.now = realNow; }
});

test('item 4: without timerRate the countdown is real time as before (m02)', () => {
    const realNow = Date.now;
    const t0 = 1_700_000_000_000;
    try {
        Date.now = () => t0 + 60_000;
        const f = ransomFake({ timerHours: 12 }, t0);
        f.updateTimerDisplay();
        const txt = f.gameContainer.querySelector('#ransomware-timer-value').textContent;
        assert.ok(txt === '11:59:00', 'real time, got ' + txt);
    } finally { Date.now = realNow; }
});

test('item 4: sis01 data sets timerRate to the ICO timer rate; the validator schema lists it', () => {
    const erb = readFileSync(join(here, '../../scenarios/sis01_healthcare/scenario.json.erb'), 'utf8');
    const n = (erb.match(/"timerRate": 84/g) || []).length;
    assert.ok(n === 2, 'both ransom screens carry timerRate 84, got ' + n);
    const schema = readFileSync(join(here, '../../scripts/minigame-data-schemas.json'), 'utf8');
    assert.ok(/"timerRate"/.test(schema), 'schema declares timerRate');
});
