// sis02 UI fixes: (1) the SIS config table keeps its header and body on one fixed column
// grid, scrolling sideways in its own pane instead of squashing; (2) the gameDisplay modal
// (the NIS form) scrolls its body inside the frame with the shared pixel scrollbar and a 16px
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

test('SIS table: fixed layout, nowrap header, set value and status columns', () => {
    const css = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    const table = ruleBody(css, '.sis-threshold-table');
    assert.match(table, /table-layout:\s*fixed/);
    assert.match(table, /min-width:\s*\d+px/);
    assert.match(ruleBody(css, '.sis-threshold-table th'), /white-space:\s*nowrap/);
    assert.match(ruleBody(css, '.sis-table-wrap'), /overflow-x:\s*auto/);
    assert.ok(css.includes('.sis-threshold-table th:nth-child(2)'), 'column 2 width set');
});

test('SIS table: the minigame puts the table in a scrolling pixel-scroll pane', () => {
    const js = readFileSync(join(root, 'js/minigames/sis-config-threshold/sis-config-threshold-minigame.js'), 'utf8');
    assert.match(js, /class="sis-table-wrap pixel-scroll">\s*<table class="sis-threshold-table"/);
});

test('SIS table: the phone card layout drops the fixed layout and min-width', () => {
    const css = readFileSync(join(root, 'css/sis-config-threshold-minigame.css'), 'utf8');
    const media = css.slice(css.indexOf('@media (max-width: 600px)'));
    assert.match(media, /min-width:\s*0/);
    assert.match(media, /table-layout:\s*auto/);
});

test('gameDisplay: the body is a pixel-scroll pane with a 16px bottom pad and the frame adds none', async () => {
    const { gameDisplay } = await import(pathToFileURL(join(root, 'js/systems/notifications.js')).href);
    gameDisplay('line one\nline two', 'NIS Notification Form');
    const body = document.querySelector('.game-display-dialog .game-display-body');
    assert.ok(body.classList.contains('pixel-scroll'), 'shared pixel scrollbar class');
    assert.ok(body.textContent.includes('line one') && body.textContent.includes('line two'));
    assert.equal(document.querySelectorAll('.game-display-dialog .game-modal-close').length, 1, 'X is the only close');
    document.querySelector('.game-modal-close').click();
    const css = readFileSync(join(root, 'css/notifications.css'), 'utf8');
    assert.match(ruleBody(css, '.game-display-dialog'), /padding-bottom:\s*0\b/);
    const b = ruleBody(css, '.game-display-body');
    assert.match(b, /padding-bottom:\s*16px/);
    assert.match(b, /overflow-y:\s*auto/);
    assert.match(b, /min-height:\s*0/);
});
