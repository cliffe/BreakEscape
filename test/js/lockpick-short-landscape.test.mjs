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
    // the "+ MORE" marker is Press Start 2P at its own 8px; every other size is at least 16px
    assert.doesNotMatch(short.body.replace(/\.lockpicking-obs-more\s*\{[^}]*\}/g, ''), /border-radius\s*:\s*[1-9]|gradient|blur|font-size\s*:\s*(1[0-5]|[0-9])px/);
    assert.match(rule(short.body, '.lockpicking-item-section.lockpicking-obs-overflow .lockpicking-obs-more'), /Press Start 2P[\s\S]*font-size\s*:\s*8px/);
    // the expanded scroller has the frame's pixel scrollbar, both scrollbar properties auto
    assert.match(short.body, /lockpicking-info-expanded \.lockpicking-item-info p::-webkit-scrollbar-thumb \{[^}]*border-radius: 0/);
    assert.match(short.body, /lockpicking-info-expanded \.lockpicking-item-info p \{[^}]*scrollbar-color\s*:\s*auto;[^}]*scrollbar-width\s*:\s*auto/);
    // the instruction line is hidden for a fitted lock
    assert.match(rule(short.body, '.minigame-container:has(#phaser-game-container.lockpicking-fit) .minigame-header p'), /display\s*:\s*none/);
    // the focus ring and the pointer apply wherever the role is present
    assert.match(short.body, /\.lockpicking-item-info p\[role="button"\]:focus-visible/);
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

// The compact block for tall desktop windows (.lockpicking-compact, 561px and taller): a copy of
// the short block's strip rules, scoped to the class
const compact = mediaBlocks.find((b) => /min-height:\s*561px/.test(b.cond) && /lockpicking-compact/.test(b.body));

test('taller windows are untouched: no 561px+ block carries the short-window rules, except the .lockpicking-compact strip block, whose every rule needs that class', () => {
    // Reason for the exception: the compact block is the short strip on purpose, but only for a
    // strip the JS marked .lockpicking-compact, so a window without the class is untouched.
    const tall = mediaBlocks.filter((x) => /561px/.test(x.cond) && x !== compact);
    assert.ok(tall.length >= 2, 'the 561px blocks exist');
    for (const b of tall) {
        assert.doesNotMatch(b.body, /lockpicking-fit|lockpicking-mode-label|lockpicking-info-expanded|object-fit|line-clamp/);
    }
    assert.doesNotMatch(css.slice(0, css.indexOf('@media')), /lockpicking-fit/);
    assert.ok(compact, 'the compact block exists');
    const re = /([^{}]+)\{[^{}]*\}/g;
    let m, n = 0;
    while ((m = re.exec(compact.body))) {
        for (const sel of m[1].split(',').map((x) => x.trim())) {
            n++;
            assert.match(sel, /lockpicking-compact/, 'every compact-block selector needs the class: ' + sel);
        }
    }
    assert.ok(n >= 15, 'found the rules: ' + n);
});

test('the compact block is scoped to wide AND 561px-tall windows, so a window resized short gets the short rules (R1 m1)', () => {
    assert.ok(compact, 'the compact block exists');
    assert.match(compact.cond, /min-width:\s*769px/);
    assert.match(compact.cond, /min-height:\s*561px/);
    assert.ok(mediaBlocks.indexOf(compact) < mediaBlocks.indexOf(short), 'before the short block (the short block is last)');
});

test('the compact block pins the strip rules the desktop fix depends on (R1 M3)', () => {
    const S = '.lockpicking-item-section.lockpicking-compact';
    assert.match(rule(compact.body, S), /flex-direction\s*:\s*row/);
    assert.match(rule(compact.body, S), /flex-wrap\s*:\s*nowrap/);
    const img = rule(compact.body, '.lockpicking-compact .lockpicking-item-image');
    assert.match(img, /(^|[;\s])width\s*:\s*48px/);
    assert.match(img, /(^|[;\s])height\s*:\s*48px/);
    assert.match(img, /object-fit\s*:\s*none/);
    assert.match(rule(compact.body, '.lockpicking-compact .lockpicking-item-info p'), /-webkit-line-clamp\s*:\s*2/);
    assert.match(rule(compact.body, '.lockpicking-compact .lockpicking-item-info h4'), /white-space\s*:\s*nowrap/);
    assert.match(rule(compact.body, '.lockpicking-compact.lockpicking-obs-overflow .lockpicking-obs-more'), /display\s*:\s*block/);
    assert.match(rule(compact.body, '.lockpicking-compact .lockpicking-item-info p[role="button"]:focus-visible'), /outline\s*:\s*2px solid/);
    assert.match(rule(compact.body, '.lockpicking-compact.lockpicking-info-expanded .lockpicking-item-info p'), /line-clamp\s*:\s*unset/);
});

// Every rule in a block as { selector -> merged declarations }
function declMap(body) {
    const out = {};
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(body))) {
        const decls = {};
        for (const d of m[2].split(';')) {
            const i = d.indexOf(':');
            if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim().replace(/\s+/g, ' ');
        }
        for (const sel of m[1].split(',').map((x) => x.trim().replace(/\s+/g, ' '))) out[sel] = Object.assign(out[sel] || {}, decls);
    }
    return out;
}

test('the compact block and the short block keep the same strip declarations (R1 m5); only the observation size differs', () => {
    const a = declMap(short.body), b = declMap(compact.body);
    // short selector -> the compact block's selector for the same thing
    const toCompact = (sel) => sel === '.lockpicking-item-section' ? '.lockpicking-item-section.lockpicking-compact'
        : sel.startsWith('.lockpicking-item-section.') ? sel.replace('.lockpicking-item-section.', '.lockpicking-compact.')
        : '.lockpicking-compact ' + sel;
    const stripSels = Object.keys(a).filter((s) => /^\.lockpicking-item-(section|image|info)/.test(s));
    assert.ok(stripSels.length >= 14, 'strip selectors found: ' + stripSels.length);
    for (const sel of stripSels) {
        const cs = toCompact(sel);
        assert.ok(b[cs], 'the compact block has ' + cs);
        const want = Object.assign({}, a[sel]);
        const got = Object.assign({}, b[cs]);
        if (sel === '.lockpicking-item-info p') { want['font-size'] = '16px'; assert.equal(a[sel]['font-size'], '20px', 'the short block observation is 20px'); }
        for (const k of new Set([...Object.keys(want), ...Object.keys(got)])) {
            assert.ok(want[k] === got[k], cs + ' ' + k + ': short "' + want[k] + '" vs compact "' + got[k] + '"');
        }
    }
});

test('the compact block holds only the mapped strip selectors plus a named exemption list (R2 m3)', () => {
    const a = declMap(short.body), b = declMap(compact.body);
    const toCompact = (sel) => sel === '.lockpicking-item-section' ? '.lockpicking-item-section.lockpicking-compact'
        : sel.startsWith('.lockpicking-item-section.') ? sel.replace('.lockpicking-item-section.', '.lockpicking-compact.')
        : '.lockpicking-compact ' + sel;
    // Compact-only selectors, each with its reason. A new compact-only rule fails here until it is
    // named, so it cannot drift from the short block unnoticed.
    const EXEMPT = {
        '.lockpicking-compact .lockpicking-mode-row': 'the desktop mode row keeps its caption (AC1 decision), the short block hides it'
    };
    const mapped = new Set(Object.keys(a).filter((s) => /^\.lockpicking-item-(section|image|info)/.test(s)).map(toCompact));
    for (const sel of Object.keys(b)) {
        assert.ok(mapped.has(sel) || EXEMPT[sel], 'compact-only selector without a stated exemption: ' + sel);
    }
    for (const sel of Object.keys(EXEMPT)) assert.ok(b[sel], 'the exemption still names a real selector: ' + sel);
    // Every short-block selector the mapping above does not cover must be on a named list of
    // non-strip rules (the fitted box, header and mode row). A strip rule written in any other
    // form (bare `p[role="button"]`, `.lockpicking-info-expanded ...`) is unlisted, so it fails
    // here instead of going uncompared with the compact block (lockshort R3 m1).
    const NON_STRIP = [
        /^\.minigame-container:has\(#phaser-game-container\.lockpicking-fit\) \.minigame-header( p)?$/,
        /^\.lockpicking-mode-row( |$)/,
        /^\.minigame-game-container:has\(> #phaser-game-container\.lockpicking-fit\)( > |$)/
    ];
    const strayShort = Object.keys(a).filter((s) => !/^\.lockpicking-item-(section|image|info)/.test(s) && !NON_STRIP.some((re) => re.test(s)));
    assert.ok(strayShort.length === 0, 'short-block rules the mapping and the non-strip list do not cover: ' + strayShort.join(' | '));
});

test('the JS marks the box, caps FIT at the crop, watches the box and the key panel stays in the crop', () => {
    assert.match(js, /classList\.add\('lockpicking-fit'\)/);
    assert.match(js, /if \(!isPortrait && window\.innerHeight <= 560\) \{\s*config\.scale\.maxWidth = 580;\s*config\.scale\.maxHeight = 340;/);
    assert.doesNotMatch(js, /max: \{ width/, 'Phaser 3.60 ignores a nested scale.max');
    assert.match(js, /this\._watchLockBox\(\)/);
    assert.match(keySel, /crop\.y \+ 340 - containerHeight - 4/);
});

test('the JS scales the cropped canvas with Scale.FIT in any short window, and skips whole zoom there', () => {
    assert.match(js, /window\.innerWidth <= 768 \|\| window\.innerHeight <= 560\) \{\s*const isPortrait/);
    assert.equal((js.match(/window\.innerHeight <= 560/g) || []).length, 5, 'config, its max cap, _fitLockZoom, _watchLockZoom, the observations');
    assert.match(js, /mode: Phaser\.Scale\.FIT/);
});

// ---- behaviour ----
let lastFake = null;
function render(observations) {
    document.body.innerHTML = '<div><div class="game"></div></div>';
    const fake = { params: { itemName: 'Server cage', itemImage: '/door.png', itemObservations: observations }, gameContainer: document.querySelector('.game'), _syncObsButton: LockpickingMinigamePhaser.prototype._syncObsButton };
    LockpickingMinigamePhaser.prototype.createLockableItemDisplay.call(fake);
    lastFake = fake;
    return document.querySelector('.lockpicking-item-section');
}

test('the observations are a button only while they overflow or are open, named for what they do', () => {
    const long = 'A heavy cage door with a standard pin tumbler lock. The brass is scratched around the keyhole and a faint smell of oil hangs about it.';
    const strip = render(long);
    const fake = lastFake;
    const p = strip.querySelector('.lockpicking-item-info p');
    const h4 = strip.querySelector('.lockpicking-item-info h4');
    const open = () => strip.classList.contains('lockpicking-info-expanded');
    const sync = () => LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
    let sh = 24;
    Object.defineProperty(p, 'scrollHeight', { get: () => sh, configurable: true });
    Object.defineProperty(p, 'clientHeight', { get: () => 48, configurable: true });
    assert.equal(p.title, long);
    assert.equal(h4.title, 'Server cage');
    const savedH = window.innerHeight;
    try {
        window.innerHeight = 390;
        // fits: plain text, no role, no tab stop, no marker, clicking does nothing
        sync();
        assert.equal(p.getAttribute('role'), null);
        assert.equal(p.getAttribute('tabindex'), null);
        assert.equal(strip.classList.contains('lockpicking-obs-overflow'), false);
        p.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        assert.equal(open(), false);
        // overflows: a button whose name is its own text (no aria-label, no aria-describedby),
                sh = 72; sync();
        assert.equal(p.getAttribute('role'), 'button');
        assert.equal(p.tabIndex, 0);
        assert.equal(p.getAttribute('aria-expanded'), 'false');
        assert.equal(p.hasAttribute('aria-label'), false, 'aria-label would replace the text as the name');
        assert.equal(p.hasAttribute('aria-describedby'), false);
        assert.equal(p.textContent, long, 'the name is the text itself');
        assert.equal(strip.querySelector('.lockpicking-obs-more').textContent, '+ MORE');
        assert.equal(strip.classList.contains('lockpicking-obs-overflow'), true);
        p.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        assert.equal(open(), true);
        assert.equal(p.getAttribute('aria-expanded'), 'true');
        assert.equal(p.hasAttribute('aria-label'), false);
        assert.equal(p.textContent, long);
        assert.equal(strip.querySelector('.lockpicking-obs-more').textContent, '- LESS');
        p.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        assert.equal(open(), false);
        const ev = new window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        p.dispatchEvent(ev);
        assert.equal(open(), true);
        assert.equal(ev.defaultPrevented, true, 'Space does not scroll the page');
        p.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        assert.equal(open(), true, 'other keys do nothing');
        // open and now fitting (a wider window): stays a button so it can be closed
        sh = 24; sync();
        assert.equal(p.getAttribute('role'), 'button');
        // the window grows tall: plain text again, and the open state is reset
        window.innerHeight = 800; sync();
        assert.equal(open(), false);
        assert.equal(p.getAttribute('role'), null);
        // cleanup removes the listeners
        sh = 72; window.innerHeight = 390; sync();
        LockpickingMinigamePhaser.prototype._releaseLockWatchers.call(fake);
        p.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        assert.equal(open(), false, 'the click listener is gone');
    } finally { window.innerHeight = savedH; }
});

test('on a tall desktop window the observations are a button only while the strip is compact (R1 M3)', () => {
    const long = 'A heavy cage door with a standard pin tumbler lock. The brass is scratched around the keyhole and a faint smell of oil hangs about it.';
    const strip = render(long);
    const fake = lastFake;
    const p = strip.querySelector('.lockpicking-item-info p');
    Object.defineProperty(p, 'scrollHeight', { get: () => 72, configurable: true });
    Object.defineProperty(p, 'clientHeight', { get: () => 48, configurable: true });
    const savedH = window.innerHeight;
    try {
        window.innerHeight = 720;
        fake._lockCompact = true;
        LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
        assert.equal(p.getAttribute('role'), 'button', 'compact on a 720px window: a button');
        assert.equal(p.tabIndex, 0);
        assert.equal(strip.querySelector('.lockpicking-obs-more').textContent, '+ MORE');
        fake._lockCompact = false;
        LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
        assert.equal(p.getAttribute('role'), null, 'full strip on a 720px window: plain text');
    } finally { window.innerHeight = savedH; }
});

test('the "+ MORE" toggle refits the lock without letting the strip go back to full size (R1 M2)', () => {
    const long = 'A heavy cage door with a standard pin tumbler lock. The brass is scratched around the keyhole and a faint smell of oil hangs about it.';
    const strip = render(long);
    const fake = lastFake;
    const calls = [];
    fake._fitLockZoom = (relax) => calls.push(relax);
    const p = strip.querySelector('.lockpicking-item-info p');
    Object.defineProperty(p, 'scrollHeight', { get: () => 72, configurable: true });
    Object.defineProperty(p, 'clientHeight', { get: () => 48, configurable: true });
    const savedH = window.innerHeight;
    try {
        window.innerHeight = 562;
        fake._lockCompact = true;
        LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
        p.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
        assert.ok(calls.length === 1 && calls[0] === false, 'one sticky refit after the toggle: ' + calls);
        p.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        assert.ok(calls.length === 2 && calls[1] === false, 'and again on the way back');
    } finally { window.innerHeight = savedH; }
});

test('no observations: no button is made', () => {
    const strip = render('');
    assert.ok(strip.querySelector('p') === null);
    assert.ok(strip.querySelector('[role=button]') === null);
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
        const order = [];
        const fake = { _syncObsButton: () => {}, gameContainer: document.querySelector('.game'), game: { scale: { getParentBounds: () => { order.push('bounds'); return true; }, refresh: () => { order.push('refresh'); refreshed++; } } } };
        LockpickingMinigamePhaser.prototype._watchLockBox.call(fake);
        assert.equal(made.length, 1);
        assert.equal(made[0].observed[0].id, 'phaser-game-container');
        made[0].cb();
        assert.equal(refreshed, 1);
        assert.deepEqual(order, ['bounds', 'refresh'], 'Phaser 3.60 refresh() is one change behind unless the parent bounds are read first');
        // bounds unchanged: no refresh
        fake.game.scale.getParentBounds = () => false;
        made[0].cb();
        assert.equal(refreshed, 1);
        // a box without the fit class (desktop boot) is not observed
        document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div>';
        LockpickingMinigamePhaser.prototype._watchLockBox.call({ gameContainer: document.querySelector('.game') });
        assert.equal(made.length, 1);
        // cleanup() (the path endMinigame and displacement take, without complete()) disconnects
        // the observer, removes the window listeners and destroys the game
        let destroyed = 0, superCleaned = 0, removed = [];
        const realRemove = window.removeEventListener;
        window.removeEventListener = (n, f) => removed.push(n);
        try {
            const dying = { _lockBoxObserver: made[0], _lockZoomOnResize: () => {}, _obsOnResize: () => {}, game: { destroy: () => { destroyed++; } } };
            dying._releaseLockWatchers = LockpickingMinigamePhaser.prototype._releaseLockWatchers;
            const base = Object.getPrototypeOf(LockpickingMinigamePhaser.prototype);
            const realBase = base.cleanup;
            base.cleanup = function () { superCleaned++; };
            try { LockpickingMinigamePhaser.prototype.cleanup.call(dying); } finally { base.cleanup = realBase; }
            assert.equal(made[0].gone, true);
            assert.equal(dying._lockBoxObserver, null);
            assert.deepEqual(removed, ['resize', 'resize']);
            assert.equal(destroyed, 1);
            assert.equal(dying.game, null);
            assert.equal(superCleaned, 1);
        } finally { window.removeEventListener = realRemove; }
    } finally { delete globalThis.ResizeObserver; }
});

test('the "+ MORE" plate covers the whole 24px line', () => {
    const more = rule(short.body, '.lockpicking-item-section.lockpicking-obs-overflow .lockpicking-obs-more');
    assert.match(more, /line-height\s*:\s*24px/);
    assert.match(more, /(^|[;\s])height\s*:\s*24px/);
    assert.match(more, /background\s*:\s*#000/);
});

test('removing the role while the observations hold focus moves focus to the mode button, else the X', () => {
    const long = 'A heavy cage door with a standard pin tumbler lock. The brass is scratched around the keyhole.';
    const savedH = window.innerHeight;
    try {
        window.innerHeight = 390;
        for (const withMode of [true, false]) {
            const strip = render(long);
            const fake = lastFake;
            const p = strip.querySelector('.lockpicking-item-info p');
            Object.defineProperty(p, 'scrollHeight', { get: () => 72, configurable: true });
            Object.defineProperty(p, 'clientHeight', { get: () => 48, configurable: true });
            const x = document.createElement('button');
            x.id = 'minigame-close';
            document.body.appendChild(x);
            let mode = null;
            if (withMode) {
                const row = document.createElement('div');
                row.className = 'lockpicking-mode-row';
                mode = document.createElement('button');
                row.appendChild(mode);
                strip.appendChild(row);
            }
            document.body.appendChild(strip);
            LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
            p.focus();
            assert.ok(document.activeElement === p);
            window.innerHeight = 800;
            LockpickingMinigamePhaser.prototype._syncObsButton.call(fake);
            assert.equal(p.getAttribute('role'), null);
            assert.ok(document.activeElement === (withMode ? mode : x), withMode ? 'the mode button' : 'the X');
            window.innerHeight = 390;
        }
    } finally { window.innerHeight = savedH; }
});

test('a lock that ends before its scene exists leaves no poll or insertion timer running', async () => {
    const fake = { keySelectionMode: false, scene: null, _doStartWithKeySelection: () => { throw new Error('ran on a dead lock'); } };
    const h = LockpickingMinigamePhaser.prototype;
    h.startWithKeySelection.call(fake, [], 'k');
    assert.ok(fake._keySelPoll, 'the poll handle is stored');
    fake._keyInsertTimer = setTimeout(() => { throw new Error('insertion timer fired'); }, 20);
    h._releaseLockWatchers.call(fake);
    assert.equal(fake._keySelPoll, null);
    assert.equal(fake._keyInsertTimer, null);
    await new Promise((r) => setTimeout(r, 120));
    // the key-selection path stores its 300ms timer on the lock, so release can clear it
    assert.match(readFileSync(join(root, 'js/minigames/lockpicking/key-operations.js'), 'utf8'), /this\.parent\._keyInsertTimer = setTimeout/);
});
