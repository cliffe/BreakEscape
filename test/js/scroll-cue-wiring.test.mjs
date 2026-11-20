// Sweep 3 R1: the scroll cue is attached to the element that really scrolls, destroyed on tab
// switch and cleanup, uses the framework's touch-size query and stays visible while the outer pane
// scrolls (superseded: the cue is now in flow). Runs the real helper and the real minigames in a jsdom DOM.
// Run with: node --test test/js/scroll-cue-wiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

// Count live listeners per target and type, so a missing destroy shows as a leftover
const live = new Map();
const proto = dom.window.EventTarget.prototype;
const origAdd = proto.addEventListener, origRemove = proto.removeEventListener;
proto.addEventListener = function (t, f, o) { const k = t; const m = live.get(this) || {}; m[k] = (m[k] || 0) + 1; live.set(this, m); return origAdd.call(this, t, f, o); };
proto.removeEventListener = function (t, f, o) { const m = live.get(this) || {}; if (m[t]) m[t]--; return origRemove.call(this, t, f, o); };
const count = (el, type) => (live.get(el) || {})[type] || 0;
// All live scroll listeners under a root (each cue holds one on its table, one on its outer scroller)
const scrollTotal = (root) => [root, ...root.querySelectorAll('*')].reduce((n, e) => n + count(e, 'scroll'), 0);

const { attachScrollCue, SCROLL_CUE_PHONE_QUERY } = await imp('utils/scroll-cue.js');
const { LogFilterMinigame } = await imp('minigames/log-filter/log-filter-minigame.js');
const { DrugLibraryIntegrityMinigame } = await imp('minigames/drug-library-integrity/drug-library-integrity-minigame.js');

// Evaluates "(max-width: Npx), (max-height: Npx)" lists for a given viewport
function mq(w, h) {
    return (q) => ({ matches: q.split(',').some(term => {
        const m = /\(\s*max-(width|height)\s*:\s*(\d+)px\s*\)/.exec(term);
        return !!m && (m[1] === 'width' ? w : h) <= Number(m[2]);
    }) });
}

function fresh() {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameState = { globalVariables: {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.npcManager = { setGlobalVariable() {} };
    return document.getElementById('mg');
}

test('the cue query covers phones in landscape as well as portrait', () => {
    const q = SCROLL_CUE_PHONE_QUERY;
    assert.ok(mq(844, 390)(q).matches === true, '844x390 landscape phone shows the cue');
    assert.ok(mq(390, 844)(q).matches === true, '390x844 portrait phone shows the cue');
    assert.ok(mq(1280, 720)(q).matches === false, '1280x720 desktop does not');
});

function sized(el, sw, cw) {
    Object.defineProperty(el, 'scrollWidth', { value: sw, configurable: true });
    Object.defineProperty(el, 'clientWidth', { value: cw, configurable: true });
}

test('the cue is an in-flow sibling before the scroller, never absolutely placed, and keeps its height at the end', () => {
    const doc = dom.window.document;
    const host = doc.createElement('div'), scroller = doc.createElement('div');
    host.appendChild(scroller);
    sized(scroller, 600, 300);
    const win = { matchMedia: mq(390, 844), addEventListener() {}, removeEventListener() {} };
    const h = attachScrollCue(scroller, { window: win, document: doc });
    assert.ok(h.cue.nextElementSibling === scroller, 'cue sits directly before the scroller');
    assert.ok(h.cue.parentElement === scroller.parentElement, 'same parent as the scroller');
    assert.ok(h.cue.style.position === '', 'not positioned');
    assert.ok(host.style.position === '', 'host is not made relative');
    assert.ok(h.cue.style.display === 'block' && h.cue.style.visibility === 'visible', 'visible while more columns exist');
    scroller.scrollLeft = 300; h.update();
    assert.ok(h.cue.style.display === 'block' && h.cue.style.visibility === 'hidden', 'end: hidden but keeps its space');
    sized(scroller, 300, 300); h.update();
    assert.ok(h.cue.style.display === 'none', 'no overflow: takes no space');
    const desktop = attachScrollCue(scroller, { window: { ...win, matchMedia: mq(1280, 720) }, document: doc });
    sized(scroller, 600, 300); desktop.update();
    assert.ok(desktop.cue.style.display === 'none', '1280x720: no space');
    h.destroy(); desktop.destroy();
});

function logParams() {
    return { sprite: { scenarioData: { minigameData: {
        logType: 'vpn', entryCount: 12,
        anomaly: { user: 'm.blake', account: 'm.blake', ip: '185.220.101.47', country: 'RO', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:52', position: 8 },
        noise: [{ user: 'w.price', ip: '91.108.14.4', country: 'UK', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:44' }],
        threatIntel: { ip: '185.220.101.47', asn: 'AS1', type: 'Tor', location: 'B', lastFlagged: 'x', knownBad: true },
        accountHistory: { account: 'm.blake', fullName: 'M B', contractor: 'N', role: 'E', accessLevel: 'C', status: 'ACTIVE', lastLegitimateSession: 'a', currentSession: 'b', anomalyBadge: 'X' },
        flagConfirmBody: 'Flag it?',
        additionalTabs: [{ id: 'audit', type: 'audit_log', label: 'AUDIT', title: 'AUDIT', subtitle: 's',
            auditEntries: [{ timestamp: 't', operator: 'a', command: 'c', parameter: 'p', result: 'OK' }] }]
    } } } };
}

test('log filter: cues sit on the scrolling wraps, follow tab switches and are gone after cleanup', () => {
    const el = fresh();
    const mg = new LogFilterMinigame(el, logParams());
    mg.init();
    mg.start();
    const logWrap = el.querySelector('.lf-log-table-wrap');
    assert.ok(!!logWrap, 'log table wrap rendered');
    assert.ok(count(logWrap, 'scroll') === 1, 'session tab: the cue is on the log table wrap');
    assert.ok(scrollTotal(el) === 1, 'session tab: exactly one cue live');
    assert.ok(logWrap.previousElementSibling.classList.contains('scroll-cue'), 'the cue is the line directly above the table wrap');

    mg._switchTab('audit');
    const auditWrap = el.querySelector('.lf-audit-table-wrap');
    assert.ok(!!auditWrap, 'audit wrap rendered');
    assert.ok(count(auditWrap, 'scroll') === 1, 'audit tab: the cue is on .lf-audit-table-wrap');
    assert.ok(count(logWrap, 'scroll') === 0, 'tab switch destroyed the old log cue');
    assert.ok(scrollTotal(el) === 1, 'one cue live on the audit tab');
    assert.ok(auditWrap.previousElementSibling.classList.contains('scroll-cue'), 'audit cue sits directly above its wrap');

    mg._switchTab('session_log');
    assert.ok(count(auditWrap, 'scroll') === 0, 'back on session log: the audit cue is destroyed');
    assert.ok(scrollTotal(el) === 1, 'one cue live after switching back');

    const body = el.querySelector('.lf-body');
    mg.cleanup();
    assert.ok(scrollTotal(el) === 0, 'cleanup leaves no cue listeners');
    assert.ok(count(el.querySelector('.lf-log-table-wrap'), 'scroll') === 0, 'cleanup leaves none on the table');
});

test('log filter: cleanup on the audit tab destroys the audit cue', () => {
    const el = fresh();
    const mg = new LogFilterMinigame(el, logParams());
    mg.init();
    mg.start();
    mg._switchTab('audit');
    const auditWrap = el.querySelector('.lf-audit-table-wrap');
    const body = el.querySelector('.lf-body');
    assert.ok(count(auditWrap, 'scroll') === 1, 'audit cue live before cleanup');
    mg.cleanup();
    assert.ok(count(auditWrap, 'scroll') === 0, 'audit wrap listener removed');
});

function dliParams() {
    return { sprite: { scenarioData: { minigameData: {
        libraryFile: 'lib.csv', backupFile: 'lib.bak', hashFile: 'lib.sha',
        drugLibrary: [
            { name: 'A', concMgPerMl: '1', doseMin: '1', doseMax: '2', unit: 'mg', rateMaxMlHr: '5' },
            { name: 'B', concMgPerMl: '1', doseMin: '1', doseMax: '2', unit: 'mg', rateMaxMlHr: '5' }
        ],
        tamperedEntry: { drug: 'A', field: 'DOSE_MAX', tamperedValue: '9', correctValue: '2', modifiedAt: 't', backupDate: 'd' },
        verificationSources: [],
        fleetReport: { affectedPumps: [], closingLines: [], activePumpGlobals: {}, outcomeText: {} }
    } } } };
}

test('drug library: each diff panel carries its own cue, dropped on tab switch and cleanup', () => {
    const el = fresh();
    const mg = new DrugLibraryIntegrityMinigame(el, dliParams());
    const baseResize = count(window, 'resize');
    mg.init();
    mg._phase = 'failed';
    mg._switchTab('diff');
    const panels = Array.from(el.querySelectorAll('.dli-diff-panel'));
    assert.ok(panels.length === 2, 'two diff panels rendered');
    assert.ok(count(panels[0], 'scroll') === 1 && count(panels[1], 'scroll') === 1, 'a cue on each scrolling diff panel');
    assert.ok(el.querySelectorAll('.dli-diff-split .scroll-cue').length === 2, 'both cues live beside their panels');
    assert.ok(el.querySelectorAll('.scroll-cue').length === 2, 'exactly one cue per table on the diff tab');
    assert.ok(panels.every(p => p.previousElementSibling && p.previousElementSibling.classList.contains('scroll-cue')), 'each cue is the line directly above its panel');
    assert.ok(panels.every(p => p.querySelector('.dli-diff-panel-file') && !p.querySelector('.scroll-cue')), 'no cue inside a panel, so the file names stay uncovered');

    mg._switchTab('fleet');
    assert.ok(count(panels[0], 'scroll') === 0 && count(panels[1], 'scroll') === 0, 'tab switch destroyed the diff cues');
    assert.ok(count(window, 'resize') === baseResize + 1, 'only the panel cue is live on the fleet tab');
    assert.ok(el.querySelectorAll('.scroll-cue').length === 1, 'one cue on the fleet tab');

    mg._switchTab('diff');
    mg.cleanup();
    assert.ok(count(window, 'resize') === baseResize, 'cleanup leaves no cue listeners');
});

test('log filter: re-applying a filter leaves exactly one cue and one live cue listener set', () => {
    const el = fresh();
    const mg = new LogFilterMinigame(el, logParams());
    mg.init();
    mg.start();
    assert.ok(el.querySelectorAll('.scroll-cue').length === 1, 'one cue after the first render');
    for (let i = 0; i < 2; i++) mg._onFiltersChanged();
    assert.ok(el.querySelectorAll('.scroll-cue').length === 1, 'one cue after two filter re-renders');
    assert.ok(scrollTotal(el) === 1, 'one cue worth of scroll listeners after re-render');
    mg._switchTab('audit');
    assert.ok(el.querySelectorAll('.scroll-cue').length === 1, 'one cue on the audit tab');
    mg._switchTab('session_log');
    assert.ok(el.querySelectorAll('.scroll-cue').length === 1, 'one cue after switching back');
    mg.cleanup();
    assert.ok(el.querySelectorAll('.scroll-cue').length === 0, 'no cue left after cleanup');
});

function frameWin(frames, cancelled) {
    return { matchMedia: mq(390, 844), getComputedStyle: () => ({ position: 'relative' }), addEventListener() {}, removeEventListener() {},
        requestAnimationFrame: (cb) => { frames.push(cb); return frames.length; },
        cancelAnimationFrame: (id) => { cancelled.push(id); } };
}

test('scroll events are coalesced to one update per animation frame and cancelled on destroy', () => {
    const doc = dom.window.document;
    const host = doc.createElement('div'), scroller = doc.createElement('div');
    host.appendChild(scroller);
    Object.defineProperty(scroller, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 300, configurable: true });
    const frames = [], cancelled = [];
    const h = attachScrollCue(scroller, { window: frameWin(frames, cancelled), document: doc });
    assert.ok(h.cue.style.display === 'block', 'shown at rest');
    scroller.scrollLeft = 300;
    for (let i = 0; i < 5; i++) scroller.dispatchEvent(new dom.window.Event('scroll'));
    assert.ok(frames.length === 1, 'five scroll events queue one frame');
    assert.ok(h.cue.style.visibility === 'visible', 'no measuring until the frame runs');
    frames.shift()();
    assert.ok(h.cue.style.visibility === 'hidden', 'the frame hides the cue at the scroll end');
    scroller.dispatchEvent(new dom.window.Event('scroll'));
    assert.ok(frames.length === 1, 'a new scroll queues a new frame');
    h.destroy();
    assert.ok(cancelled.length === 1, 'destroy cancels the pending frame');
});

test('drug library wiring: diff cues share one group and the panel cue insets to padding', () => {
    const src = readFileSync(new URL('../../public/break_escape/js/minigames/drug-library-integrity/drug-library-integrity-minigame.js', import.meta.url), 'utf8');
    assert.ok(/attachScrollCue\(el, \{ group \}\)/.test(src), 'diff panels share a group');
    assert.ok(/attachScrollCue\(panel, \{ insetToPadding: true \}\)/.test(src), 'non-diff cue insets to the panel padding');
});
