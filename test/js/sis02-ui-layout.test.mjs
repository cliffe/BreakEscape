// sis02 UI fixes: (1) the SIS config table keeps its header and body on one fixed column
// grid, long parameter names breaking inside column 1 instead of spilling into the value
// column; (2) rows reachable from the keyboard, focus moving into and back out of the detail;
// (3) the gameDisplay modal (the NIS form) scrolls its body inside the frame with the shared pixel scrollbar and a 16px
// bottom pad, the frame adding no band of its own under it.
// Run with: node --max-old-space-size=2048 test/js/sis02-ui-layout.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

// The declarations of the rule whose selector list is exactly `selector` (outside @media)
function ruleBody(css, selector) {
    const flat = css.replace(/@media[^{]*\{[\s\S]*?\n\}\n/g, '');
    const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = flat.match(new RegExp('(?:^|[}/])\\s*' + esc + '\\s*\\{([^}]*)\\}'));
    return m ? m[1] : null;
}

test('SIS table: fixed layout, nowrap header, narrow value column, names break in column 1', () => {
    const css = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    const table = ruleBody(css, '.sis-threshold-table');
    assert.match(table, /table-layout:\s*fixed/);
    assert.doesNotMatch(table, /min-width:\s*[1-9]/, 'no min-width: the old 460px wrapper never scrolled');
    assert.match(ruleBody(css, '.sis-threshold-table th'), /white-space:\s*nowrap/);
    assert.match(ruleBody(css, '.sis-threshold-table td:first-child'), /overflow-wrap:\s*anywhere/);
    assert.match(ruleBody(css, '.sis-threshold-table th:nth-child(2),\n.sis-threshold-table td:nth-child(2)'), /width:\s*136px/);
    assert.ok(!css.includes('.sis-table-wrap'), 'the sideways-scroll wrapper is gone');
});

async function renderSis(rows) {
    const { SisConfigThresholdMinigame } = await import(pathToFileURL(join(root, 'js/minigames/sis-config-threshold/sis-config-threshold-minigame.js')).href);
    const gc = document.createElement('div');
    const fake = { rows, gameContainer: gc, container: document.createElement('div'), hasCertificationDoc: () => false, compareTitle: 'c', confirmLabel: 'x', addEventListener(el, ev, fn) { el.addEventListener(ev, fn); }, _hideSceneX() {}, _lockPanel() {} };
    fake.showDetail = (r) => { fake.shown = r; };
    SisConfigThresholdMinigame.prototype.render.call(fake);
    SisConfigThresholdMinigame.prototype.bindEvents.call(fake);
    return { gc, fake };
}

test('SIS table: a 40-character parameter name is breakable at underscores and has no scroll wrapper', async () => {
    const long = "BATTERY_STRING_OVERCURRENT_TRIP_SETPT_X1";
    assert.equal(long.length, 40);
    const { gc } = await renderSis([{ parameter: long, currentValue: '1', status: 'AMBER' }]);
    const cell = gc.querySelector('.sis-threshold-table tbody td:first-child > div');
    assert.ok(cell.innerHTML.includes('_<wbr>'), 'wbr after each underscore');
    assert.equal(cell.textContent, long);
    assert.ok(gc.querySelector('.sis-table-wrap') === null);
});

test('SIS rows: amber and red rows are keyboard reachable and Enter or Space opens the detail', async () => {
    const { gc, fake } = await renderSis([
        { parameter: 'A_B', currentValue: '1', status: 'AMBER' },
        { parameter: 'C_D', currentValue: '1', status: 'RED' },
        { parameter: 'E_F', currentValue: '1', status: 'GREEN' }]);
    const trs = [...gc.querySelectorAll('tbody tr')];
    assert.deepEqual(trs.map((t) => t.getAttribute('tabindex')), ['0', '0', null]);
    const key = (el, k) => el.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key(trs[0], 'Enter');
    assert.equal(fake.shown.parameter, 'A_B');
    key(trs[1], ' ');
    assert.equal(fake.shown.parameter, 'C_D');
    fake.shown = null;
    key(trs[1], 'a');
    assert.equal(fake.shown, null, 'other keys do nothing');
    const css = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    assert.match(ruleBody(css, '.sis-row-clickable:focus-visible'), /outline:\s*2px solid/);
});

test('SIS detail: focus moves to the close button, and back to the row on close', async () => {
    const { SisConfigThresholdMinigame: S } = await import(pathToFileURL(join(root, 'js/minigames/sis-config-threshold/sis-config-threshold-minigame.js')).href);
    const { gc, fake } = await renderSis([{ parameter: 'A_B', currentValue: '1', status: 'AMBER', detailText: 'x' }]);
    document.body.appendChild(gc);
    fake.overlayEl = document.createElement('div');
    gc.appendChild(fake.overlayEl);
    fake.showDetail = S.prototype.showDetail;
    fake.closeOverlay = S.prototype.closeOverlay;
    // rebind so the row's click handler reaches the real showDetail
    const tr = gc.querySelector('tbody tr');
    const fresh = tr.cloneNode(true);
    tr.replaceWith(fresh);
    S.prototype.bindEvents.call(fake);
    fresh.focus();
    fresh.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    const closeBtn = fake.overlayEl.querySelector('#sis-detail-close');
    assert.ok(closeBtn, 'detail open');
    assert.ok(document.activeElement === closeBtn, 'focus is on the detail close button');
    closeBtn.click();
    assert.ok(document.activeElement === fresh, 'focus returns to the row');
    gc.remove();
});

test('SIS table: the phone card layout drops the fixed layout and min-width', () => {
    const css = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    const media = css.slice(css.indexOf('@media (max-width: 600px)'));
    assert.match(media, /min-width:\s*0/);
    assert.match(media, /table-layout:\s*auto/);
});

test('gameDisplay: the body is a pixel-scroll pane with a 16px bottom pad inside a 12px frame inset', async () => {
    const { gameDisplay } = await import(pathToFileURL(join(root, 'js/systems/notifications.js')).href);
    gameDisplay('line one\nline two', 'NIS Notification Form');
    const body = document.querySelector('.game-display-dialog .game-display-body');
    assert.ok(body.classList.contains('pixel-scroll'), 'shared pixel scrollbar class');
    assert.ok(body.textContent.includes('line one') && body.textContent.includes('line two'));
    assert.equal(document.querySelectorAll('.game-display-dialog .game-modal-close').length, 1, 'X is the only close');
    document.querySelector('.game-modal-close').click();
    const css = readFileSync(join(root, 'css/notifications.css'), 'utf8');
    const dlg = ruleBody(css, '.game-display-dialog');
    assert.match(dlg, /padding-bottom:\s*12px/);
    assert.match(dlg, /box-sizing:\s*border-box/);
    assert.match(ruleBody(css, '.game-display-title'), /line-height:\s*20px/);
    const hud = readFileSync(join(root, 'css/hud.css'), 'utf8');
    assert.match(hud, /html \.game-display-dialog\s*\{[^}]*min\([^}]*100vh \/ var\(--hud-zoom, 1\) - 232px/);
    assert.match(css, /\.game-display-dialog\s*\{\s*max-width:\s*700px/);
    assert.match(hud, /\.game-confirm-dialog\.game-display-dialog\s*\{\s*--be-dialog-max:\s*700px/);
    const b = ruleBody(css, '.game-display-body');
    assert.match(b, /padding-bottom:\s*16px/);
    assert.match(b, /overflow-y:\s*auto/);
    assert.match(b, /min-height:\s*0/);
});
