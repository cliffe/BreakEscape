// Shredded-document reorder and flip chrome (critique C C-SD1/SD2/SD3). The real module runs
// against jsdom: the strips reorder by an Up/Down button route (keyboard- and touch-usable)
// alongside drag, the controls are named in words (no glyph the font lacks), and reaching the
// correct order completes the puzzle. The CSS checks read the stylesheet text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const js = join(root, 'js');
const css = join(root, 'css');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { ShreddedDocumentMinigame } = await import(
    pathToFileURL(join(js, 'minigames/shredded-document/shredded-document-minigame.js')).href);

function host() {
    document.body.innerHTML = '<div id="mg"></div>';
    return document.getElementById('mg');
}

// Build a scene with a deterministic starting order (init shuffles, so we overwrite it).
function sceneWith(order, { allowRotation = false } = {}) {
    const mg = new ShreddedDocumentMinigame(host(), { strips: order.map((o) => o.text), allowRotation });
    mg.init();
    mg.showSuccess = () => {};           // no timer / DOM success banner in the test
    mg.completed = false;
    mg.currentOrder = order.map((o) => ({ rotated: false, tilt: 0, ...o }));
    mg.render();
    return mg;
}

test('C-SD1 the controls are named in words, no stray glyph the font lacks', () => {
    const mg = sceneWith([{ id: 0, text: 'one' }, { id: 1, text: 'two' }], { allowRotation: true });
    const html = mg.gameContainer.innerHTML;
    assert.ok(!html.includes('↕'), 'no up-down arrow glyph in the strips');
    assert.match(html, />Up</, 'an Up button is drawn');
    assert.match(html, />Down</, 'a Down button is drawn');
    assert.match(html, />Flip</, 'the flip control is named Flip');
    const src = readFileSync(join(js, 'minigames/shredded-document/shredded-document-minigame.js'), 'utf8');
    assert.ok(!src.includes('↕'), 'no up-down arrow glyph in the source');
    assert.match(src, /Up and Down buttons/, 'the instruction names the reorder buttons');
});

test('C-SD2 the Up/Down buttons reorder the strips and can complete the puzzle', () => {
    // Start out of order (ids 1,0,2); the move route must reach 0,1,2.
    const mg = sceneWith([{ id: 1, text: 'b' }, { id: 0, text: 'a' }, { id: 2, text: 'c' }]);
    const down0 = mg.gameContainer.querySelector('.sdm-strip[data-index="0"] .sdm-move-btn[data-move="down"]');
    assert.equal(down0.tagName, 'BUTTON', 'the move control is a focusable button (keyboard route)');
    down0.click();   // move id 1 down one place -> 0,1,2
    assert.deepEqual(mg.currentOrder.map((s) => s.id), [0, 1, 2], 'the strip moved down one place');
    assert.equal(mg.completed, true, 'the correct order completes the puzzle');
});

test('C-SD2 the first strip cannot move up and the last cannot move down', () => {
    const mg = sceneWith([{ id: 0, text: 'a' }, { id: 1, text: 'b' }, { id: 2, text: 'c' }]);
    const up0 = mg.gameContainer.querySelector('.sdm-strip[data-index="0"] .sdm-move-btn[data-move="up"]');
    const downLast = mg.gameContainer.querySelector('.sdm-strip[data-index="2"] .sdm-move-btn[data-move="down"]');
    assert.ok(up0.disabled, 'the first strip has no Up');
    assert.ok(downLast.disabled, 'the last strip has no Down');
});

test('C-SD3 the strip style drops the tilt and soft blur, keeps 2px edges', () => {
    const sheet = readFileSync(join(css, 'shredded-document-minigame.css'), 'utf8');
    const strip = sheet.match(/\.sdm-strip\s*\{[^}]*\}/)[0];
    assert.ok(!/transform:\s*rotate/.test(strip), 'no small-angle tilt on the strip');
    assert.doesNotMatch(strip, /box-shadow:[^;]*\d+px\s+\d+px\s+[1-9]/, 'the shadow is a hard offset, not a soft blur');
    assert.doesNotMatch(strip, /border-(top|bottom|left|right):\s*1px/, 'no 1px edges remain');
    // The flip/move buttons get a 44px touch target without changing the drawn size.
    assert.match(sheet, /pointer:\s*coarse[\s\S]*\.sdm-(move|flip)-btn::after/, 'a touch target is added for coarse pointers');
});

test('C-SD1 the drag handle sits on the Press Start 2P 8px grid (16px, not 14px)', () => {
    const sheet = readFileSync(join(css, 'shredded-document-minigame.css'), 'utf8');
    const handle = sheet.match(/\.sdm-drag-handle\s*\{[^}]*\}/)[0];
    const size = Number((handle.match(/font-size:\s*(\d+)px/) || [])[1]);
    assert.ok(size % 8 === 0, `drag-handle font-size ${size}px must be a multiple of 8 (Press Start 2P grid)`);
});
