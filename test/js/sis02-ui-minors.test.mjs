// sis02 blind playtest UI minors (sweep 8): m1 the historian report has no [CANCEL]; m2 the ESD
// confirm has its own X; m8 the SIS tamper confirm and the cable confirm carry the X and one
// named button; m12 the session-flag confirm reads right for a CLOSED row and names the next
// step; m7 the SIS dialogs are opaque, pixel-font and lock the panel; m17 the credits review log
// drops dash runs.
// Run with: node --max-old-space-size=2048 test/js/sis02-ui-minors.test.mjs
// SIS_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.SIS_JS_ROOT ? join(process.env.SIS_JS_ROOT, '..') : join(here, '../../public/break_escape');
const js = join(root, 'js');
const css = (f) => readFileSync(join(root, 'css', f), 'utf8');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
window.gameState = { globalVariables: {} };
window.eventDispatcher = { on() {}, off() {}, emit() {} };
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const ruleBody = (c, sel) => {
    const i = c.indexOf(sel + ' {');
    return i < 0 ? '' : c.slice(i, c.indexOf('}', i));
};

// ---- m1: the historian report -------------------------------------------------------------
// Drives the real scene in JSDOM (copied to a temp dir so its imports resolve): the question
// and the confirm draw no Cancel of any class or wording, and the scene X stays on screen.
const HSD = {
    racks: [{ id: 'A1', label: 'Rack A1', normalBase: 30.2, noisePeriodMinutes: 3, noiseAmplitude: 0.4 },
        { id: 'A2', label: 'Rack A2', normalBase: 29.9, noisePeriodMinutes: 4, noiseAmplitude: 0.3 }],
    injectionTimestamp: '2026-03-20T23:12:07', injectedValue: 28.0, lastRealTimestamp: '2026-03-20T23:12:06',
    thermalTrendStartTime: '2026-03-20T20:00:00', thermalTrendRate: 0.03,
    historianStartTime: '2026-03-20T18:00:00', historianEndTime: '2026-03-21T06:30:00', sampleIntervalMinutes: 1,
    completionActions: [], progressActions: []
};
test('m1: the historian report and its confirm draw no Cancel, and the scene X stays on screen', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'sis02-hist-'));
    try {
        writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
        for (const rel of ['minigames/framework/base-minigame.js', 'utils/display-dashes.js', 'utils/escape-html.js',
            'minigames/scada-historian/scada-historian-data.js', 'minigames/scada-historian/scada-historian-minigame.js']) {
            mkdirSync(dirname(join(dir, rel)), { recursive: true });
            writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
        }
        window.npcManager = { setGlobalVariable() {} };
        window.objectivesManager = { completeTask() {} };
        const { ScadaHistorianMinigame: H } = await import(pathToFileURL(join(dir, 'minigames/scada-historian/scada-historian-minigame.js')).href);
        document.body.innerHTML = '';
        const container = document.createElement('div');
        container.innerHTML = '<button id="minigame-close"></button>';
        document.body.appendChild(container);
        const scene = new H(container, { sprite: { scenarioData: { minigameData: HSD } } });
        scene.gameContainer = document.createElement('div');
        container.appendChild(scene.gameContainer);
        scene._buildTrendData();
        scene._renderLayout();
        scene._renderChart();
        const hits = [...document.getElementById('sh-chart-area').querySelectorAll('rect')];
        const start = scene._visible.findIndex((p) => p.isInjectionStart);
        const order = scene._visible.map((_, k) => k).filter((k) => k !== start).concat(start >= 0 ? [start] : []);
        const cliff = scene._visible.findIndex((p) => new Date(p.ts).toTimeString().slice(0, 8) === '23:12:07');
        assert.ok(cliff >= 0, 'a reading at the cliff');
        hits[order.indexOf(cliff)].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        document.querySelector('.sh-annotate-btn').click();
        const buttonsText = () => [...document.querySelectorAll('.sh-modal button')].map((b) => b.textContent).join('|');
        assert.ok(document.querySelector('.sh-modal') !== null, 'the report opened');
        assert.ok(!/cancel/i.test(buttonsText()) && !/cancel/i.test(document.querySelector('.sh-modal').textContent), 'no Cancel on the question: ' + buttonsText());
        assert.ok(document.querySelector('.sh-modal-cancel-btn') === null, 'no cancel class on the question');
        assert.ok(document.getElementById('minigame-close').style.visibility !== 'hidden', 'the scene X stays on the question');
        document.querySelector('.sh-choice-btn[data-choice="written"]').click();
        assert.ok(document.querySelector('.sh-modal-confirm-btn') !== null, 'the confirm button is there');
        assert.ok(!/cancel/i.test(buttonsText()) && document.querySelector('.sh-modal-cancel-btn') === null, 'no Cancel on the confirm: ' + buttonsText());
        assert.ok(document.getElementById('minigame-close').style.visibility !== 'hidden', 'the scene X stays on the confirm');
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- m2: the ESD confirm ----------------------------------------------------------------------
test('m2: the ESD confirm has its own X, keeps its wording, no CANCEL, and the X hides it', async () => {
    const { EsdPushbuttonMinigame: E } = await import(pathToFileURL(join(js, 'minigames/esd-pushbutton/esd-pushbutton-minigame.js')).href);
    const gc = document.createElement('div');
    document.body.appendChild(gc);
    const fake = { _sd: {}, gameState: {}, listeners: [], gameContainer: gc, container: document.createElement('div'), state: 'CONFIRM_MODAL',
        addEventListener(el, ev, fn) { el.addEventListener(ev, fn); }, _hideSceneX() {}, _pinConfirmToView() {} };
    fake.hideConfirmModal = E.prototype.hideConfirmModal;
    E.prototype.render.call(fake);
    const bp = Object.getPrototypeOf(E.prototype);   // the framework start() needs a full scene; the wiring is the part under test
    const realStart = bp.start;
    bp.start = () => {};
    try { E.prototype.start.call(fake); } finally { bp.start = realStart; }
    fake.confirmModal.classList.add('active');
    const x = gc.querySelector('#esd-confirm-x');
    assert.ok(x !== null && x.classList.contains('minigame-close-button'), 'the card has its own X');
    assert.ok(gc.querySelector('#esd-cancel') === null, 'no CANCEL button');
    assert.ok(!/CANCEL/i.test(gc.querySelector('.esd-confirm-card').textContent), 'no CANCEL text');
    const named = [...gc.querySelectorAll('.esd-confirm-card button')].filter((b) => b !== x).map((b) => b.textContent.trim());
    assert.ok(named.length === 1 && named[0] === 'CONFIRM - INITIATE SHUTDOWN', 'one named button, wording kept: ' + named.join('|'));
    x.click();
    assert.ok(!fake.confirmModal.classList.contains('active'), 'the X closes the confirm without shutting down');
    assert.ok(fake.state === 'GUARD_OPEN', 'state goes back to the open guard');
    const c = css('esd-pushbutton-minigame.css');
    assert.ok(/\.esd-confirm-card \{[^}]*position: relative/.test(c), 'the card anchors its X');
});

test('m2: the ESD confirm puts focus on its X when it opens and hands it back to the button on close (X and Esc)', async () => {
    const { EsdPushbuttonMinigame: E } = await import(pathToFileURL(join(js, 'minigames/esd-pushbutton/esd-pushbutton-minigame.js')).href);
    for (const how of ['x', 'esc']) {
        document.body.innerHTML = '';
        const gc = document.createElement('div');
        document.body.appendChild(gc);
        const fake = { _sd: {}, gameState: {}, listeners: [], gameContainer: gc, container: document.createElement('div'), state: 'ARMED_GUARD_DOWN',
            authorizationGranted: true, alreadyActivated: false,
            addEventListener(el, ev, fn) { el.addEventListener(ev, fn); }, _hideSceneX() {}, _pinConfirmToView() {},
            statusElement: null };
        for (const m of ['hideConfirmModal', 'handleGuardFlip', 'handleButtonPress', 'handleEscapeKey']) fake[m] = E.prototype[m];
        E.prototype.render.call(fake);
        fake.handleGuardFlip();
        assert.ok(fake.state === 'GUARD_OPEN', 'guard open');
        fake.buttonElement.focus();
        fake.handleButtonPress();
        assert.ok(fake.state === 'CONFIRM_MODAL', 'confirm open');
        assert.ok(document.activeElement === gc.querySelector('#esd-confirm-x'), how + ': focus starts on the X, not the big button');
        if (how === 'x') fake.hideConfirmModal(); else fake.handleEscapeKey();
        assert.ok(fake.state === 'GUARD_OPEN', how + ': back to the open guard');
        assert.ok(document.activeElement === fake.buttonElement, how + ': focus goes back to the button that opened it');
    }
});

// ---- m8: the SIS tamper confirm and the Compare dialog ----------------------------------------
const sis = await import(pathToFileURL(join(js, 'minigames/sis-config-threshold/sis-config-threshold-minigame.js')).href);
const S = sis.SisConfigThresholdMinigame;

function sisFake() {
    const gc = document.createElement('div');
    gc.innerHTML = '<div class="sis-threshold"><div class="sis-threshold-main"><button id="b">Compare</button></div></div>';
    document.body.appendChild(gc);
    const container = document.createElement('div');
    container.innerHTML = '<button id="minigame-close"></button>';
    const fake = { gameContainer: gc, container, overlayEl: document.createElement('div'), rows: [], compareTitle: 'c', confirmLabel: 'x',
        addEventListener(el, ev, fn) { el.addEventListener(ev, fn); } };
    gc.appendChild(fake.overlayEl);
    for (const m of ['showConfirm', 'showCompare', 'closeOverlay', '_hideSceneX', '_lockPanel']) fake[m] = S.prototype[m];
    return fake;
}

test('m8: the SIS tamper confirm has its own X and one named Confirm Tamper Report button, no Cancel; the X closes it', () => {
    const f = sisFake();
    f.showConfirm();
    const x = f.overlayEl.querySelector('#sis-confirm-close');
    assert.ok(x !== null && x.classList.contains('minigame-close-button'), 'its own X');
    const named = [...f.overlayEl.querySelectorAll('button')].filter((b) => b !== x).map((b) => b.textContent.trim());
    assert.ok(named.length === 1 && named[0] === 'Confirm Tamper Report', 'one button, with safety wording: ' + named.join('|'));
    assert.ok(!/cancel/i.test(f.overlayEl.textContent), 'no Cancel text');
    assert.ok(f.container.querySelector('#minigame-close').style.visibility === 'hidden', 'only one X shows');
    x.click();
    assert.ok(!f.overlayEl.classList.contains('show'), 'the X closes the confirm');
    assert.ok(f.container.querySelector('#minigame-close').style.visibility !== 'hidden', 'the scene X is back');
});

test('m2: the SIS Compare dialog focuses its X, and Compare and Confirm hand focus back to their opener on X or Esc', () => {
    for (const open of ['showCompare', 'showConfirm']) {
        for (const how of ['x', 'esc']) {
            const f = sisFake();
            f.rows = [{ parameter: 'A', currentValue: '1', certifiedValue: '2', status: 'AMBER' }];
            f.compareRows = [];
            f.hasCertificationDoc = () => true;
            f.handleEscapeKey = S.prototype.handleEscapeKey;
            const opener = f.gameContainer.querySelector('#b');
            opener.focus();
            assert.ok(document.activeElement === opener, 'the opener has focus to start');
            f._detailOpener = opener;   // what the Compare and Confirm click handlers set
            f[open]();
            const x = f.overlayEl.querySelector('.minigame-close-button');
            assert.ok(x !== null && document.activeElement === x, open + ' ' + how + ': focus starts on the X');
            if (how === 'x') x.click(); else assert.ok(f.handleEscapeKey() === true, 'Esc is taken by the dialog');
            assert.ok(!f.overlayEl.classList.contains('show'), open + ' ' + how + ': dialog closed');
            assert.ok(document.activeElement === opener, open + ' ' + how + ': focus is back on the opener');
        }
    }
    const src = readFileSync(join(js, 'minigames/sis-config-threshold/sis-config-threshold-minigame.js'), 'utf8');
    assert.ok(/this\._detailOpener = compareBtn/.test(src) && /this\._detailOpener = confirmBtn/.test(src), 'both panel buttons record themselves as the opener');
});

// ---- m7: the SIS Compare dialog -----------------------------------------------------------------
test('m7: the SIS overlay is opaque, names the GNF pixel font, has a 2px frame', () => {
    const c = css('sis-config-threshold-minigame.css');
    const ov = ruleBody(c, '.sis-overlay');
    const bg = (ov.match(/background:\s*([^;]+);/) || [])[1] || '';
    assert.ok(/^#[0-9a-f]{6}$/i.test(bg.trim()), 'opaque hex background, got ' + bg);
    assert.ok(/font-family:\s*'GNF'/.test(ov), 'overlay names GNF');
    const modal = ruleBody(c, '.sis-modal');
    assert.ok(/border:\s*2px solid/.test(modal), 'modal has a 2px border');
    assert.ok(/font-family:\s*'GNF'/.test(modal), 'modal names GNF');
    assert.ok(!/border-radius:\s*[1-9]/.test(modal), 'no radius');
});

test('m7: while a SIS dialog is open the panel is inert, and it is released on close', () => {
    for (const open of ['showConfirm', 'showCompare']) {
        const f = sisFake();
        f.rows = [{ parameter: 'A', currentValue: '1', status: 'AMBER' }];
        f.compareRows = [];
        f.hasCertificationDoc = () => true;
        try { f[open](); } catch (e) { /* the compare body needs certification data; the lock is set before any later work */ }
        const main = f.gameContainer.querySelector('.sis-threshold-main');
        assert.ok(main.hasAttribute('inert'), open + ': panel inert while open');
        f.closeOverlay();
        assert.ok(!main.hasAttribute('inert'), open + ': panel released on close');
    }
});

test('m7: sisHelpText never says "select" when no row can be selected', () => {
    const f = sis.sisHelpText;
    assert.ok(typeof f === 'function', 'sisHelpText exported');
    assert.ok(!/select/i.test(f(false, 0)) && !/select/i.test(f(true, 0)), 'no row to select, no "select"');
    assert.ok(/certification document/.test(f(false, 0)), 'locked compare still names the document');
    assert.ok(/Select a highlighted row/.test(f(true, 2)) && /Select a highlighted row/.test(f(false, 2)), 'selectable rows get the instruction');
    assert.ok(!/Select highlighted rows to inspect deviations/.test(f(true, 0)), 'the stale line is gone');
});

// ---- m12: the session flag confirm ----------------------------------------------------------------
const base = dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } start() {} cleanup() {} complete() {} }');
let src = readFileSync(join(js, 'minigames/log-filter/log-filter-minigame.js'), 'utf8');
src = src.split(`'../framework/base-minigame.js'`).join(`'${base}'`)
    .split(`'../../utils/display-dashes.js'`).join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split(`'../../utils/scroll-cue.js'`).join(`'${dataUrl('export const attachScrollCue = () => ({ update() {}, destroy() {}, cue: null });')}'`);
const { LogFilterMinigame } = await import(dataUrl(src));

function lfConfirm(status) {
    window.gameState = { globalVariables: {}, notes: [] };
    window.npcManager = { setGlobalVariable: () => {} };
    const host = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(host);
    const m = new LogFilterMinigame(host, { sprite: { scenarioData: { minigameData: {
        logType: 'vpn', entryCount: 10, flagConfirmBody: 'Active session since 01:47', flagConfirmBodyClosed: 'The session ran until the cable was pulled.',
        anomaly: { user: 'c.ellison', ip: '10.2.4.12', country: 'RO', mfa: 'NO', result: 'ACCEPT', timestamp: '2025-11-03 08:52', position: 5 }
    } } } });
    m.container = host;
    const body = document.createElement('div');
    host.appendChild(body);
    m._dom = { body };
    m._selectedEntry = { status };
    m._overlayMode = 'flag_confirm';
    m._renderOverlay();
    return body;
}

test('m12: a CLOSED row gets the closed wording and label; an ACTIVE row keeps the old ones', () => {
    const closed = lfConfirm('CLOSED');
    assert.ok(/cable was pulled/.test(closed.textContent), 'closed body used');
    assert.ok(!/Active session since/.test(closed.textContent), 'no "Active session" claim about a CLOSED row');
    assert.ok(closed.textContent.includes('[CONFIRM: FLAG SESSION]'), 'closed label has no ACTIVE');
    assert.ok(!closed.textContent.includes('FLAG ACTIVE SESSION'), 'no ACTIVE label on a closed row');
    const active = lfConfirm('ACTIVE');
    assert.ok(/Active session since 01:47/.test(active.textContent), 'active body kept');
    assert.ok(active.textContent.includes('[CONFIRM: FLAG ACTIVE SESSION]'), 'active label kept');
});

test('m12: the confirm names the next step, focuses its X (not CONFIRM), and the button is 44px', () => {
    const body = lfConfirm('CLOSED');
    const xBtn = body.querySelector('.lf-overlay-close');
    assert.ok(xBtn !== null && document.activeElement === xBtn, 'focus starts on the header X, the safe choice');
    assert.ok(document.activeElement !== body.querySelector('.lf-flag-confirm-btn'), 'CONFIRM is not focused');
    const step = body.querySelector('.lf-flag-confirm-step');
    assert.ok(step !== null && /press CONFIRM below to flag this session/.test(step.textContent), 'next-step line present');
    assert.ok(/The X goes back without flagging/.test(step.textContent), 'says what the X does');
    const c = css('log-filter-minigame.css');
    assert.ok(/min-height:\s*44px/.test(ruleBody(c, '.lf-flag-confirm-btn')), 'confirm button 44px');
    assert.ok(/border:\s*2px solid/.test(ruleBody(c, '.lf-flag-confirm-step')), 'step line has a 2px frame');
    const bgRule = ruleBody(c, '.lf-flag-confirm-step');
    assert.ok(!/radius|gradient|blur/.test(bgRule), 'no radius, gradient or blur');
});

// ---- m8: gameConfirm closeX ---------------------------------------------------------------------------
const notif = await import(pathToFileURL(join(js, 'systems/notifications.js')).href);
const tick = () => new Promise((r) => setTimeout(r, 0));

test('m8: gameConfirm closeX: the X resolves false, one named button, the button resolves true', async () => {
    document.body.innerHTML = '';
    const p = notif.gameConfirm('Disconnect cable?', 'Disconnect', 'Leave it', { closeX: true });
    const dlg = document.querySelector('.game-confirm-dialog');
    assert.ok(dlg.classList.contains('game-confirm-has-x'), 'has-x class');
    const x = dlg.querySelector('.game-modal-close');
    assert.ok(x !== null, 'corner X present');
    const btns = [...dlg.querySelectorAll('.game-confirm-buttons button')].map((b) => b.textContent);
    assert.ok(btns.length === 1 && btns[0] === 'Disconnect', 'one named button: ' + btns.join('|'));
    assert.ok(!/Leave it/.test(dlg.textContent), 'the cancel label is not drawn');
    assert.ok(document.activeElement === x, 'focus starts on the X, the safe choice, not the named button');
    x.click();
    assert.ok((await p) === false, 'the X resolves false');
    assert.ok(document.querySelector('.game-confirm-overlay') === null, 'dialog removed');
    const p2 = notif.gameConfirm('Again?', 'Do it', 'No', { closeX: true });
    document.querySelector('.game-confirm-ok').click();
    assert.ok((await p2) === true, 'the named button resolves true');
    // Esc resolves false (the X's answer) and focus is on the X first, so a stray Enter cannot confirm
    const p3 = notif.gameConfirm('Esc?', 'Do it', 'No', { closeX: true });
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.ok((await p3) === false, 'Esc resolves false');
    assert.ok(document.querySelector('.game-confirm-overlay') === null, 'Esc closed the dialog');
});

test('m8: gameConfirm without closeX is unchanged: two buttons, no X; closeX is ignored for html mode', async () => {
    document.body.innerHTML = '';
    const p = notif.gameConfirm('Plain?', 'Yes', 'No');
    const dlg = document.querySelector('.game-confirm-dialog');
    assert.ok(dlg.querySelector('.game-modal-close') === null, 'no X by default');
    assert.ok(dlg.querySelectorAll('.game-confirm-buttons button').length === 2, 'two buttons');
    dlg.querySelector('.game-confirm-cancel').click();
    assert.ok((await p) === false, 'cancel resolves false');
    const p2 = notif.gameConfirm('Html?', 'Yes', 'No', { html: true, closeX: true });
    const d2 = document.querySelector('.game-confirm-dialog');
    assert.ok(d2.querySelector('.game-modal-close') === null && d2.querySelectorAll('button').length === 2, 'html mode keeps two buttons');
    d2.querySelector('.game-confirm-cancel').click();
    await p2;
    await tick();
    const c = css('notifications.css');
    assert.ok(/\.game-confirm-has-x \{[^}]*position: relative/.test(c), 'dialog anchors its X');
    assert.ok(/\n\.game-modal-close::after \{[^}]*inset: -14px/.test(c), 'one shared hit area for the dialog X');
    assert.ok(!/has-x[^{]*::after/.test(c), 'no per-dialog hit-area override');
});

test('m8: confirm_action passes closeX only when the action sets it; the scenario cable action does', async () => {
    const { applyActions } = await import(dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
        .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
        .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
        .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
        .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
        .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`)));
    const calls = [];
    window.gameConfirm = (...a) => { calls.push(a); return Promise.resolve(false); };
    await applyActions([
        { type: 'confirm_action', text: 'Cable?', confirmLabel: 'Disconnect', closeX: true, onConfirm: [] },
        { type: 'confirm_action', text: 'Plain?', onConfirm: [] }
    ]);
    delete window.gameConfirm;
    assert.ok(calls.length === 2, 'both ran');
    assert.ok(calls[0].length === 4 && calls[0][3] && calls[0][3].closeX === true, 'closeX action passes { closeX: true }');
    assert.ok(calls[1].length === 3, 'a plain confirm passes three arguments');
    const scen = readFileSync(join(root, '../../scenarios/sis02_energy/scenario.json.erb'), 'utf8');
    assert.ok(/"closeX": true/.test(scen), 'the sis02 cable confirm sets closeX');
    assert.ok(/"flagConfirmBodyClosed":/.test(scen), 'the sis02 flag confirm has a closed body');
    assert.ok(!/"cancelLabel": "Leave it"/.test(scen), 'the cable confirm names no cancel');
});

// ---- m17: credits review log -----------------------------------------------------------------------------
const ct = await import(pathToFileURL(join(js, 'music/credits-theme.js')).href);
test('m17: creditsLogLine strips the dash runs from a section header and leaves other lines alone', () => {
    const f = ct.creditsLogLine;
    assert.ok(typeof f === 'function', 'creditsLogLine exported');
    assert.ok(f({ style: 'section-header', text: '── NETWORK CONTAINMENT ──' }) === '> NETWORK CONTAINMENT', f({ style: 'section-header', text: '── NETWORK CONTAINMENT ──' }));
    assert.ok(f({ style: 'section-header', text: '-- A --' }) === '> A', 'ASCII dashes too');
    assert.ok(f({ style: 'section-header', text: 'NHS ENGLAND' }) === '> NHS ENGLAND', 'a plain header is kept');
    assert.ok(f({ style: 'line', text: 'Written by -- someone' }) === '> Written by -- someone', 'body lines are untouched');
    assert.ok(f({}) === '> ', 'an empty item does not throw');
    const j = readFileSync(join(js, 'music/bond-visualiser.js'), 'utf8');
    assert.ok(/addLog\(displayDashes\(creditsLogLine\(item\)\)\)/.test(j), 'the review log uses it');
});

// ---- m12 / M1 (844x390): the body scrolls, the button is a fixed footer, a cue shows the cut ------------
test('M1: the flag confirm body is the scroller, the button a footer outside it, with a more-below cue', () => {
    const body = lfConfirm('CLOSED');
    const panel = body.querySelector('.lf-overlay-panel');
    assert.ok(panel.classList.contains('lf-overlay-panel-flag'), 'flag-confirm panel class');
    const scroller = panel.querySelector('.lf-flag-confirm-scroll');
    assert.ok(scroller !== null && scroller.querySelector('.lf-flag-confirm-body') !== null, 'the text is inside the scroller');
    const actions = panel.querySelector('.lf-flag-confirm-actions');
    assert.ok(actions !== null && !scroller.contains(actions) && actions.parentElement === panel, 'the button footer is outside the scroller');
    assert.ok(panel.querySelector('.lf-more-cue') !== null, 'a more-below cue line exists');
    const c = css('log-filter-minigame.css');
    assert.ok(/overflow:\s*hidden/.test(ruleBody(c, '.lf-overlay-panel-flag')), 'the panel does not scroll in this mode');
    const sc = ruleBody(c, '.lf-overlay-panel-flag .lf-flag-confirm-scroll');
    assert.ok(/overflow-y:\s*auto/.test(sc) && /min-height:\s*0/.test(sc), 'the body is what scrolls');
    const r = ruleBody(c, '.lf-flag-confirm-actions');
    assert.ok(/border-top:\s*2px solid/.test(r), '2px rule above the footer');
    assert.ok(!/position:\s*sticky/.test(r), 'no sticky bar over the text any more');
    assert.ok(/background:\s*#111122/.test(r), 'opaque footer');
    assert.ok(/border-top:\s*2px solid/.test(ruleBody(c, '.lf-more-cue')), 'cue has a 2px frame line');
});

test('M1: the more-below cue shows while text is cut, hides at the end, and takes no space when nothing is cut', () => {
    const body = lfConfirm('CLOSED');
    const scroller = body.querySelector('.lf-flag-confirm-scroll');
    const cue = body.querySelector('.lf-more-cue');
    const set = (h, c, t) => { for (const [k, v] of [['scrollHeight', h], ['clientHeight', c], ['scrollTop', t]]) Object.defineProperty(scroller, k, { value: v, configurable: true }); };
    set(300, 100, 0);
    scroller.dispatchEvent(new window.Event('scroll'));
    assert.ok(cue.style.display === 'block' && cue.style.visibility === 'visible', 'cut: cue visible');
    set(300, 100, 200);
    scroller.dispatchEvent(new window.Event('scroll'));
    assert.ok(cue.style.display === 'block' && cue.style.visibility === 'hidden', 'at the end: cue hidden, keeps its line');
    set(100, 100, 0);
    scroller.dispatchEvent(new window.Event('scroll'));
    assert.ok(cue.style.display === 'none', 'no overflow: no cue');
});

// ---- B1: the shared dialog X hit area must not cover the interaction menu -------------------------
test('B1: the interaction menu X is its own containing block, so the shared ::after stays on the X', () => {
    const menu = readFileSync(join(js, 'ui/interaction-menu.js'), 'utf8');
    const rule = menu.slice(menu.indexOf('#be-interaction-menu .be-im-close {'));
    const body = rule.slice(0, rule.indexOf('}'));
    assert.ok(/position:\s*relative/.test(body), 'the menu X is position: relative, not static');
    assert.ok(!/position:\s*static/.test(body), 'not static');
    const after = (menu.match(/#be-interaction-menu \.be-im-close::after \{[^}]*inset:\s*calc\(-(\d+)px - var\(--ui-small-button-px, 4px\)\)/) || [])[1];
    assert.ok(after === '6', 'the menu X reach is 6px past its border (32px X, 44px target, inside the head): ' + after);
    // Every user of the shared class sits in a positioned box
    const n = css('notifications.css');
    assert.ok(/\n\.game-modal-close \{[^}]*position:\s*absolute/.test(n), 'the shared X is absolute');
    assert.ok(/\.game-confirm-has-x \{[^}]*position: relative/.test(n), 'confirm dialog anchors it');
    assert.ok(/\.game-confirm-dialog \{[^}]*position:\s*relative/.test(n), 'every game-confirm-dialog (display, ending check) anchors it');
});

