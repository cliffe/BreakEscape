// sis02 blind playtest UI minors (sweep 8): m1 the historian report has no [CANCEL]; m2 the ESD
// confirm has its own X; m8 the SIS tamper confirm and the cable confirm carry the X and one
// named button; m12 the session-flag confirm reads right for a CLOSED row and names the next
// step; m7 the SIS dialogs are opaque, pixel-font and lock the panel; m17 the credits review log
// drops dash runs.
// Run with: node --max-old-space-size=2048 test/js/sis02-ui-minors.test.mjs
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
test('m1: the historian report draws no [CANCEL] and does not hide the scene X', () => {
    const src = readFileSync(join(js, 'minigames/scada-historian/scada-historian-minigame.js'), 'utf8');
    assert.ok(!/\[CANCEL\]/.test(src), 'no [CANCEL] text in the scene');
    assert.ok(!/sh-modal-cancel-btn/.test(src), 'no cancel button class in the scene');
    assert.ok(!/if \(!asking\) this\._hideSceneX\(true\)/.test(src), 'the report keeps the scene X on screen');
    assert.ok(!/sh-modal-cancel-btn/.test(css('scada-historian-minigame.css')), 'no dead cancel CSS');
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

test('m8: the SIS tamper confirm has its own X and one Confirm button, no Cancel; the X closes it', () => {
    const f = sisFake();
    f.showConfirm();
    const x = f.overlayEl.querySelector('#sis-confirm-close');
    assert.ok(x !== null && x.classList.contains('minigame-close-button'), 'its own X');
    const named = [...f.overlayEl.querySelectorAll('button')].filter((b) => b !== x).map((b) => b.textContent.trim());
    assert.ok(named.length === 1 && named[0] === 'Confirm', 'one button, Confirm: ' + named.join('|'));
    assert.ok(!/cancel/i.test(f.overlayEl.textContent), 'no Cancel text');
    assert.ok(f.container.querySelector('#minigame-close').style.visibility === 'hidden', 'only one X shows');
    x.click();
    assert.ok(!f.overlayEl.classList.contains('show'), 'the X closes the confirm');
    assert.ok(f.container.querySelector('#minigame-close').style.visibility !== 'hidden', 'the scene X is back');
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

test('m12: the confirm names the next step, focuses CONFIRM, and the button is 44px', () => {
    const body = lfConfirm('CLOSED');
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
    x.click();
    assert.ok((await p) === false, 'the X resolves false');
    assert.ok(document.querySelector('.game-confirm-overlay') === null, 'dialog removed');
    const p2 = notif.gameConfirm('Again?', 'Do it', 'No', { closeX: true });
    document.querySelector('.game-confirm-ok').click();
    assert.ok((await p2) === true, 'the named button resolves true');
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
