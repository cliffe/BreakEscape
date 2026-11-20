// Sweep 3 R1: the scroll cue is attached to the element that really scrolls, destroyed on tab
// switch and cleanup, uses the framework's touch-size query and stays visible while the outer pane
// scrolls. Runs the real helper and the real minigames in a jsdom DOM.
// Run with: node --test test/js/scroll-cue-wiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
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

function rect(top, bottom) { return { top, bottom, left: 0, right: 100, width: 100, height: bottom - top }; }

test('with an outer scroller the cue follows the visible top of the table', () => {
    const doc = dom.window.document;
    const outer = doc.createElement('div'), host = doc.createElement('div'), scroller = doc.createElement('div');
    outer.appendChild(host); host.appendChild(scroller);
    const R = { outer: rect(0, 300), host: rect(0, 900), scroller: rect(100, 500) };
    outer.getBoundingClientRect = () => R.outer; host.getBoundingClientRect = () => R.host; scroller.getBoundingClientRect = () => R.scroller;
    for (const [el, w] of [[scroller, 600]]) Object.defineProperty(el, 'scrollWidth', { value: w, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 300, configurable: true });
    const fakeWin = { matchMedia: mq(390, 844), getComputedStyle: () => ({ position: 'relative' }), addEventListener() {}, removeEventListener() {} };
    const h = attachScrollCue(scroller, { window: fakeWin, document: doc, viewport: outer });
    assert.ok(h.cue.style.display === 'block', 'visible at rest');
    assert.ok(h.cue.style.top === '104px', 'sits at the scroller top first');
    // The outer pane scrolls down 150px: scroller top is now above the viewport top
    R.host = rect(-150, 750); R.scroller = rect(-50, 350);
    outer.dispatchEvent(new dom.window.Event('scroll'));
    assert.ok(h.cue.style.display === 'block', 'still visible after the outer pane scrolls');
    assert.ok(h.cue.style.top === '154px', 'pinned to the visible top (viewport top 0 minus host top -150, plus 4)');
    // Scrolled until the table is off screen
    R.scroller = rect(-400, -10);
    outer.dispatchEvent(new dom.window.Event('scroll'));
    assert.ok(h.cue.style.display === 'none', 'hidden once the table is out of view');
    h.destroy();
    assert.ok(count(outer, 'scroll') === 0, 'outer scroll listener removed on destroy');
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
    assert.ok(count(el.querySelector('.lf-body'), 'scroll') === 1, 'the cue watches the vertical scroller (.lf-body)');
    assert.ok(scrollTotal(el) === 2, 'session tab: exactly one cue live');

    mg._switchTab('audit');
    const auditWrap = el.querySelector('.lf-audit-table-wrap');
    assert.ok(!!auditWrap, 'audit wrap rendered');
    assert.ok(count(auditWrap, 'scroll') === 1, 'audit tab: the cue is on .lf-audit-table-wrap');
    assert.ok(count(logWrap, 'scroll') === 0, 'tab switch destroyed the old log cue');
    assert.ok(count(el.querySelector('.lf-body'), 'scroll') === 1, 'the outer scroller holds one listener, not two');

    mg._switchTab('session_log');
    assert.ok(count(auditWrap, 'scroll') === 0, 'back on session log: the audit cue is destroyed');
    assert.ok(count(el.querySelector('.lf-body'), 'scroll') === 1, 'one cue live after switching back');

    const body = el.querySelector('.lf-body');
    mg.cleanup();
    assert.ok(count(body, 'scroll') === 0, 'cleanup leaves no cue listeners on the outer scroller');
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
    assert.ok(count(body, 'scroll') === 0, 'outer scroller listener removed');
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

    mg._switchTab('fleet');
    assert.ok(count(panels[0], 'scroll') === 0 && count(panels[1], 'scroll') === 0, 'tab switch destroyed the diff cues');
    assert.ok(count(window, 'resize') === baseResize + 1, 'only the panel cue is live on the fleet tab');

    mg._switchTab('diff');
    mg.cleanup();
    assert.ok(count(window, 'resize') === baseResize, 'cleanup leaves no cue listeners');
});
