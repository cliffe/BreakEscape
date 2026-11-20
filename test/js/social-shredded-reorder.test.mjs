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
    assert.ok(/>Up</.test(html), 'an Up button is drawn');
    assert.ok(/>Down</.test(html), 'a Down button is drawn');
    assert.ok(/>Flip</.test(html), 'the flip control is named Flip');
    const src = readFileSync(join(js, 'minigames/shredded-document/shredded-document-minigame.js'), 'utf8');
    assert.ok(!src.includes('↕'), 'no up-down arrow glyph in the source');
    assert.ok(/Up and Down buttons/.test(src), 'the instruction names the reorder buttons');
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

// D218 (K7): the scene draws in the shared console window.
test('D218 the scene draws in the console window with the title bar and the X in the title bar', () => {
    const mg = sceneWith([{ id: 0, text: 'a' }, { id: 1, text: 'b' }]);
    assert.ok(ShreddedDocumentMinigame.consoleWindow === true, 'consoleWindow opt-in');
    assert.ok(ShreddedDocumentMinigame.consoleWindowFill === true, 'consoleWindowFill opt-in');
    const win = mg.container.querySelector('.console-window.console-window-fill');
    assert.ok(win !== null, 'the shared console window is drawn');
    const title = win.querySelector('.console-titlebar .console-title');
    assert.ok(title.textContent === 'Document Reconstruction', 'default title in the title bar');
    const x = win.querySelector('.console-titlebar > #minigame-close');
    assert.ok(x !== null, 'the X is in the title bar');
    assert.ok(!x.classList.contains('se-overlay-close'), 'no red SE X variant');
    assert.ok(win.querySelector('.console-body .sdm-panel') !== null, 'the puzzle draws in the console body');
    assert.ok(mg.gameContainer.classList.contains('console-body'), 'game container is the console body');
});

test('D218 a scenario title shows in the title bar, and drag, Up/Down moves still work in the window', () => {
    const mg = new ShreddedDocumentMinigame(host(), { title: 'Torn Memo', strips: ['a', 'b', 'c'] });
    mg.init();
    mg.showSuccess = () => {};
    assert.ok(mg.container.querySelector('.console-title').textContent === 'Torn Memo', 'scenario title used');
    mg.completed = false;
    mg.currentOrder = [{ id: 1, text: 'b', tilt: 0 }, { id: 0, text: 'a', tilt: 0 }, { id: 2, text: 'c', tilt: 0 }];
    mg.render();
    mg.gameContainer.querySelector('.sdm-strip[data-index="0"] .sdm-move-btn[data-move="down"]').click();
    assert.ok(mg.completed === true, 'reaching the order still completes');
});

test('D218 the instruction and text are GNF 16px and the old in-scene X placement is gone', () => {
    const sheet = readFileSync(join(css, 'shredded-document-minigame.css'), 'utf8');
    const ins = sheet.match(/\.sdm-instruction\s*\{[^}]*\}/)[0];
    assert.ok(/font-family:\s*'GNF'/.test(ins), 'instruction in GNF');
    assert.ok(/font-size:\s*16px/.test(ins), 'instruction at 16px');
    assert.ok(!/\.sdm-container \.minigame-close-button/.test(sheet), 'no absolute X override fighting the title bar');
    assert.ok(!/font-size:\s*8px;\s*\n\s*color:\s*#8a9bb5/.test(sheet), 'no 8px instruction');
});

// D218 review r1: drag drop index maths, the phone strip layout, the scroller and the colours.
function stubRects(mg) {
    mg.gameContainer.querySelectorAll('.sdm-strip[draggable]').forEach((el, i) => {
        el.getBoundingClientRect = () => ({ top: i * 40, height: 40 });
    });
}

test('D218 dropping a strip lands in the right slot (before, after, and after the last strip)', () => {
    const order = () => [{ id: 0, text: 'a' }, { id: 1, text: 'b' }, { id: 2, text: 'c' }];
    const drop = (from, to, clientY) => {
        const mg = sceneWith(order());
        stubRects(mg);
        mg.draggedIndex = from;
        mg._handleDrop({ preventDefault() {}, clientY }, to);
        return mg.currentOrder.map((s) => s.id).join(',');
    };
    assert.ok(drop(0, 2, 110) === '1,2,0', 'first strip dropped on the lower half of the last strip goes last');
    assert.ok(drop(0, 2, 118) === '1,2,0', 'bottom edge of the last strip');
    assert.ok(drop(0, 2, 101) === '1,2,0', 'just past the middle of the last strip');
    assert.ok(drop(0, 2, 99) === '1,0,2', 'upper half of the last strip drops before it');
    assert.ok(drop(2, 0, 5) === '2,0,1', 'last strip dropped on the upper half of the first goes first');
    assert.ok(drop(2, 0, 30) === '0,2,1', 'lower half of the first strip drops after it');
    assert.ok(drop(1, 1, 50) === '0,1,2', 'dropping on itself changes nothing');
});

test('D218 phone width gives each strip text at least main\'s 116px (controls on their own row)', () => {
    const sheet = readFileSync(join(css, 'shredded-document-minigame.css'), 'utf8');
    const m = sheet.match(/@media \(max-width: 600px\) \{([\s\S]*?)\n\}\n/);
    assert.ok(m !== null, 'a plain max-width 600px block exists');
    const block = m[1];
    const rule = (sel) => (block.match(new RegExp(sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}')) || [])[1] || '';
    const px = (decl, prop) => Number((decl.match(new RegExp(prop + ':\\s*(\\d+)px')) || [])[1] || 0);
    const scrollPad = px(rule('.sdm-scroll'), 'padding');
    const areaPad = rule('.sdm-strips-area').includes('padding: 0') ? 0 : -1;
    assert.ok(scrollPad > 0 && scrollPad <= 8, 'scroll padding is 8px or less');
    assert.ok(areaPad === 0, 'strips-area padding is 0');
    assert.ok(/flex-wrap:\s*wrap/.test(rule('.sdm-strip')), 'the strip wraps');
    assert.ok(/flex:\s*1 0 100%/.test(rule('.sdm-strip-controls')), 'controls take their own row');
    // Body at 390 is 338px in the general theme, 318px in a 28px-frame theme.
    const text = (body) => body - 2 * scrollPad - 2 * areaPad - 24 - 32 - 8;
    assert.ok(text(338) >= 116, `general theme text column ${text(338)}px is at least 116px`);
    assert.ok(text(318) >= 116, `cyberpunk text column ${text(318)}px is at least 116px`);
});

test('D218 the strip scroller uses the shared pixel scrollbar in both templates', () => {
    const src = readFileSync(join(js, 'minigames/shredded-document/shredded-document-minigame.js'), 'utf8');
    const n = (src.match(/class="sdm-scroll pixel-scroll"/g) || []).length;
    assert.ok(n === 2, `both templates use pixel-scroll (found ${n})`);
    assert.ok(!/class="sdm-scroll"/.test(src), 'no plain sdm-scroll left');
});

test('D218 the doc title and empty state meet 4.5:1 on the window surface and no dead rule remains', () => {
    const sheet = readFileSync(join(css, 'shredded-document-minigame.css'), 'utf8');
    for (const sel of ['.sdm-doc-title', '.sdm-empty-state']) {
        const rule = sheet.match(new RegExp(sel.replace('.', '\\.') + '\\s*\\{[^}]*\\}'))[0];
        assert.ok(!/#4a6090/i.test(rule), sel + ' no longer uses the 2.6:1 #4a6090');
        assert.ok(/color:\s*var\(--ui-text-dim, #a8b2c8\)/.test(rule), sel + ' uses the dim text token');
    }
    const lum = (hex) => {
        const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    assert.ok(ratio('#a8b2c8', '#181e30') >= 4.5, 'fallback colour on the general surface is at least 4.5:1');
    assert.ok(!/\.sdm-game-container\s*\{/.test(sheet), 'the dead .sdm-game-container rule is gone');
});
