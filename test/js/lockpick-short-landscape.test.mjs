// Short landscape windows (667x375, 740x360, 844x390): the lock is usable without scrolling.
// The info strip is one compact row, the mode switch an icon button with a name, the lock's
// frame takes the rest of the window and the canvas scales to it. Taller windows are untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = globalThis.AudioContext;

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../public/break_escape');
const mjs = (f) => import(pathToFileURL(join(here, '../../public/break_escape/js/minigames/lockpicking', f)).href);
const { LockpickingMinigamePhaser } = await mjs('lockpicking-game-phaser.js');
const { ToolManager } = await mjs('tool-manager.js');
const keySel = readFileSync(join(root, 'js/minigames/lockpicking/key-selection.js'), 'utf8');
const css = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = readFileSync(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js'), 'utf8');
const tm = readFileSync(join(root, 'js/minigames/lockpicking/tool-manager.js'), 'utf8');

// The last top-level @media block whose condition is exactly `max-height: 560px`
const mediaBlocks = [];
{
    const re = /@media\s*([^{]*)\{/g;
    let m;
    while ((m = re.exec(css))) {
        let depth = 1, i = re.lastIndex;
        while (depth && i < css.length) { depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0; i++; }
        mediaBlocks.push({ cond: m[1].trim(), body: css.slice(re.lastIndex, i - 1) });
    }
}
const short = mediaBlocks.filter((b) => b.cond === '(max-height: 560px)').pop();

function rule(body, selector) {
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(body))) {
        const sels = m[1].split(',').map((s) => s.trim().replace(/\s+/g, ' '));
        if (sels.includes(selector)) return m[2];
    }
    return null;
}

test('the short-window block is scoped to height only and is the last rule set in the file', () => {
    assert.ok(short, 'a (max-height: 560px) block');
    assert.doesNotMatch(short.cond, /width|min-height|orientation/);
    assert.equal(mediaBlocks[mediaBlocks.length - 1], short, 'last, so it wins');
});

test('the info strip is one nowrap row, 48px picture, clear of the X', () => {
    const strip = rule(short.body, '.lockpicking-item-section');
    assert.match(strip, /flex-direction\s*:\s*row/);
    assert.match(strip, /flex-wrap\s*:\s*nowrap/);
    assert.match(strip, /padding\s*:[^;]*52px/, 'right padding clears the fixed X');
    const img = rule(short.body, '.lockpicking-item-image');
    assert.match(img, /(^|[;\s])height\s*:\s*48px/);
    assert.match(img, /(^|[;\s])width\s*:\s*48px/);
    // no scaling: native pixels, cropped to the box from the top
    assert.match(img, /object-fit\s*:\s*none/);
    assert.match(img, /object-position\s*:\s*center top/);
    assert.match(img, /image-rendering\s*:\s*pixelated/);
    assert.doesNotMatch(img, /transform|zoom|scale/);
});

test('text stays on its pixel-font grid: name on one line, observations on two, no radius or gradient', () => {
    const h4 = rule(short.body, '.lockpicking-item-info h4');
    assert.match(h4, /font-size\s*:\s*16px/);
    assert.match(h4, /line-height\s*:\s*24px/);
    assert.match(h4, /white-space\s*:\s*nowrap/);
    assert.match(h4, /text-overflow\s*:\s*ellipsis/);
    const p = rule(short.body, '.lockpicking-item-info p');
    assert.match(p, /font-size\s*:\s*20px/);
    assert.match(p, /line-height\s*:\s*24px/);
    assert.match(p, /-webkit-line-clamp\s*:\s*2/);
    assert.match(rule(short.body, '.lockpicking-item-section.lockpicking-info-expanded .lockpicking-item-info p'), /line-clamp\s*:\s*unset/);
    assert.doesNotMatch(short.body, /border-radius\s*:\s*[1-9]|gradient|blur|font-size\s*:\s*(1[0-5]|[0-9])px/);
});

test('the mode switch is an icon at its own 32px, 48px target, the caption and label hidden', () => {
    assert.match(rule(short.body, '.lockpicking-mode-row .minigame-button'), /min-width\s*:\s*48px/);
    assert.match(rule(short.body, '.lockpicking-mode-row .minigame-button .icon-large'), /width\s*:\s*32px/);
    const hidden = rule(short.body, '.lockpicking-mode-row .lockpicking-mode-label');
    assert.match(hidden, /display\s*:\s*none/);
    assert.match(rule(short.body, '.lockpicking-mode-row .lockpicking-or-caption'), /display\s*:\s*none/);
});

test('the mode buttons keep a name: label span, aria-label and title, restored after disabling', () => {
    assert.match(tm, /class="lockpicking-mode-label">Switch to Lockpicking</);
    assert.match(tm, /class="lockpicking-mode-label">Switch to Key Mode</);
    assert.match(tm, /setAttribute\('aria-label', label\)/);
    assert.match(tm, /else if \(btn\.modeLabel\) \{\s*btn\.title = btn\.modeLabel/);
});

const FIT = '#phaser-game-container.lockpicking-fit';
const FRAME = `.minigame-game-container:has(> ${FIT})`;

test('the lock frame is a flex share of the window and the canvas box fills and centres it', () => {
    const frame = rule(short.body, FRAME);
    assert.match(frame, /flex\s*:\s*1 1 0/);
    assert.match(frame, /min-height\s*:\s*0/);
    assert.match(frame, /display\s*:\s*flex/);
    assert.match(frame, /flex-direction\s*:\s*column/);
    assert.doesNotMatch(frame, /(^|[;\s])height\s*:/, 'no height: the flex share sizes it');
    const box = rule(short.body, `${FRAME} > ${FIT}`);
    assert.match(box, /flex\s*:\s*1 1 0/);
    assert.match(box, /min-height\s*:\s*0/);
    assert.match(box, /aspect-ratio\s*:\s*auto/);
    assert.match(box, /overflow\s*:\s*hidden/);
    // the canvas has margin:0 !important, so the box centres it (M1)
    assert.match(box, /display\s*:\s*flex/);
    assert.match(box, /align-items\s*:\s*center/);
    assert.match(box, /justify-content\s*:\s*center/);
});

test('the feedback line keeps its space when empty, at least one 24px line plus padding and border', () => {
    const fb = rule(short.body, `${FRAME} > .lockpick-feedback`);
    assert.match(fb, /min-height\s*:\s*36px/);
    assert.match(rule(short.body, `${FRAME} > .lockpick-feedback:empty`), /visibility\s*:\s*hidden/);
});

test('every frame, box and feedback rule in the short block needs .lockpicking-fit (M2)', () => {
    const re = /([^{}]+)\{[^{}]*\}/g;
    let m, n = 0;
    while ((m = re.exec(short.body))) {
        for (const sel of m[1].split(',').map((x) => x.trim())) {
            if (/phaser-game-container|\.lockpick-feedback/.test(sel)) {
                n++;
                assert.match(sel, /lockpicking-fit/, sel);
            }
        }
    }
    assert.ok(n >= 4, 'found the rules');
});

test('taller windows are untouched: no 561px+ block carries the short-window rules', () => {
    const tall = mediaBlocks.filter((x) => /561px/.test(x.cond));
    assert.ok(tall.length >= 2, 'the 561px blocks exist');
    for (const b of tall) {
        assert.doesNotMatch(b.body, /lockpicking-fit|lockpicking-mode-label|lockpicking-info-expanded|object-fit|line-clamp/);
    }
    assert.doesNotMatch(css.slice(0, css.indexOf('@media')), /lockpicking-fit/);
});

test('the JS marks the box, caps FIT at the crop, watches the box and the key panel stays in the crop', () => {
    assert.match(js, /classList\.add\('lockpicking-fit'\)/);
    assert.match(js, /max: \{ width: 580, height: 340 \}/);
    assert.match(js, /this\._watchLockBox\(\)/);
    assert.match(keySel, /crop\.y \+ 340 - containerHeight - 4/);
});

test('the JS scales the cropped canvas with Scale.FIT in any short window, and skips whole zoom there', () => {
    assert.match(js, /window\.innerWidth <= 768 \|\| window\.innerHeight <= 560\) \{\s*const isPortrait/);
    assert.equal((js.match(/window\.innerHeight <= 560/g) || []).length, 3, 'config, _fitLockZoom, _watchLockZoom');
    assert.match(js, /mode: Phaser\.Scale\.FIT/);
});

// ---- behaviour ----
function render(observations) {
    document.body.innerHTML = '<div><div class="game"></div></div>';
    const fake = { params: { itemName: 'Server cage', itemImage: '/door.png', itemObservations: observations }, gameContainer: document.querySelector('.game') };
    LockpickingMinigamePhaser.prototype.createLockableItemDisplay.call(fake);
    return document.querySelector('.lockpicking-item-section');
}

test('the observations carry the full text in a title and toggle open by click, Enter and Space', () => {
    const long = 'A heavy cage door with a standard pin tumbler lock. The brass is scratched around the keyhole and a faint smell of oil hangs about it.';
    const strip = render(long);
    const p = strip.querySelector('.lockpicking-item-info p');
    const h4 = strip.querySelector('.lockpicking-item-info h4');
    assert.equal(p.title, long);
    assert.equal(h4.title, 'Server cage');
    assert.equal(p.tabIndex, 0);
    assert.equal(p.getAttribute('role'), 'button');
    assert.equal(p.getAttribute('aria-expanded'), 'false');
    const open = () => strip.classList.contains('lockpicking-info-expanded');
    p.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(open(), true);
    assert.equal(p.getAttribute('aria-expanded'), 'true');
    p.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(open(), false);
    const ev = new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    p.dispatchEvent(ev);
    assert.equal(open(), true);
    assert.equal(ev.defaultPrevented, true, 'Space does not scroll the page');
    p.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    assert.equal(open(), true, 'other keys do nothing');
});

test('no observations: no button is made', () => {
    const strip = render('');
    assert.equal(strip.querySelector('p'), null);
    assert.equal(strip.querySelector('[role=button]'), null);
});

test('the real mode button: icon alt empty, label span, aria-label and title, restored after disabling', () => {
    const parent = { keyInserting: false, keyInsertTween: null, keyUnlocked: false };
    const tmgr = new ToolManager(parent);
    for (const [row, label] of [[tmgr.buildPickButtonRow(), 'Switch to Lockpicking'], [tmgr.buildKeyButtonRow(), 'Switch to Key Mode']]) {
        const btn = row.querySelector('button');
        assert.equal(btn.getAttribute('aria-label'), label);
        assert.equal(btn.title, label);
        assert.equal(btn.querySelector('img').getAttribute('alt'), '');
        assert.equal(btn.querySelector('.lockpicking-mode-label').textContent, label);
        tmgr.applyDisabled(btn, true);
        assert.equal(btn.disabled, true);
        assert.match(btn.title, /Not while/);
        assert.equal(btn.getAttribute('aria-label'), label, 'the name stays while disabled');
        tmgr.applyDisabled(btn, false);
        assert.equal(btn.disabled, false);
        assert.equal(btn.title, label);
    }
});

test('the box observer refreshes Phaser on a size change and is disconnected on cleanup', () => {
    const made = [];
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; this.observed = []; this.gone = false; made.push(this); } observe(el) { this.observed.push(el); } disconnect() { this.gone = true; } };
    try {
        document.body.innerHTML = '<div class="game"><div id="phaser-game-container" class="lockpicking-fit"></div></div>';
        let refreshed = 0;
        const fake = { gameContainer: document.querySelector('.game'), game: { scale: { refresh: () => { refreshed++; } } } };
        LockpickingMinigamePhaser.prototype._watchLockBox.call(fake);
        assert.equal(made.length, 1);
        assert.equal(made[0].observed[0].id, 'phaser-game-container');
        made[0].cb();
        assert.equal(refreshed, 1);
        // a box without the fit class (desktop boot) is not observed
        document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div>';
        LockpickingMinigamePhaser.prototype._watchLockBox.call({ gameContainer: document.querySelector('.game') });
        assert.equal(made.length, 1);
        // cleanup disconnects it
        assert.match(js, /this\._lockBoxObserver\?\.disconnect\?\.\(\);\s*this\._lockBoxObserver = null;/);
    } finally { delete globalThis.ResizeObserver; }
});
