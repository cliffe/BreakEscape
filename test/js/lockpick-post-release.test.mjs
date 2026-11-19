// Lockpick post-release fixes: (1) a resize or rotation after the lock opens refits it (the boot
// gate's crop or full size no longer sticks), debounced, with nothing left listening after
// cleanup; (2) the feedback line stays in view when the lock is taller than its frame (1024 to
// 1366 wide desktops).
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


globalThis.Phaser = { Scale: { FIT: 3, NONE: 0, CENTER_BOTH: 1, NO_CENTER: 0 } };
const H = LockpickingMinigamePhaser.prototype;

function fakeLock(applied) {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container" class="lockpicking-fit lockpicking-zoomed" style="max-width:1200px"></div></div>';
    const calls = [];
    const canvasStyle = { marginLeft: '9px', marginTop: '9px' };
    const scale = {
        scaleMode: 3, autoCenter: 1, zoom: 2, canvas: { style: canvasStyle },
        displaySize: { setMax: (w, h) => calls.push(['max', w, h]) },
        setGameSize: (w, h) => calls.push(['size', w, h]),
        getParentBounds: () => true, refresh: () => calls.push(['refresh'])
    };
    const scroll = [];
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale },
        scene: { cameras: { main: { setScroll: (x, y) => scroll.push([x, y]) } } },
        _lockFitApplied: applied,
        _portraitCameraOffset: applied.fit ? { x: 0, y: applied.portrait ? 20 : 30 } : null,
        _syncObsButton: () => {},
        _fitLockZoom: () => calls.push(['zoomfit']),
        _applyLockFit: H._applyLockFit,
        _watchLockBox: () => calls.push(['watchbox'])
    };
    return { fake, calls, scroll, scale, canvasStyle, box: document.querySelector('#phaser-game-container') };
}
const at = (w, h, fn) => {
    const sw = window.innerWidth, sh = window.innerHeight;
    window.innerWidth = w; window.innerHeight = h;
    try { return fn(); } finally { window.innerWidth = sw; window.innerHeight = sh; }
};

test('the boot gate and the refit share one layout rule', () => {
    const S = LockpickingMinigamePhaser.lockFitState;
    assert.deepEqual(S(844, 390), { fit: true, portrait: false, capped: true });
    assert.deepEqual(S(390, 844), { fit: true, portrait: true, capped: false });
    assert.deepEqual(S(700, 900), { fit: true, portrait: true, capped: false });
    assert.deepEqual(S(1280, 720), { fit: false, portrait: false, capped: false });
    assert.equal(S(768, 1024).fit, true);
    assert.equal(S(1280, 560).fit, true);
    assert.match(js, /this\._lockFitApplied = LockpickingMinigamePhaser\.lockFitState\(\)/, 'boot records the layout it chose');
});

test('a phone lock resized to a desktop window drops the crop and the FIT scaling', () => {
    const t = fakeLock({ fit: true, portrait: false, capped: true });
    at(1280, 720, () => H._refitLock.call(t.fake));
    assert.deepEqual(t.calls.filter((c) => c[0] === 'size'), [['size', 600, 400]]);
    assert.equal(t.scale.scaleMode, 0);
    assert.equal(t.scale.autoCenter, 0);
    assert.equal(t.scale.zoom, 1);
    assert.equal(t.box.classList.contains('lockpicking-fit'), false);
    assert.equal(t.fake._portraitCameraOffset, null, 'key selection reads this for its panel');
    assert.deepEqual(t.scroll.pop(), [0, 0], 'camera back to the world origin');
    assert.equal(t.canvasStyle.marginLeft, '');
    assert.deepEqual(t.calls.find((c) => c[0] === 'max'), ['max', Number.MAX_VALUE, Number.MAX_VALUE]);
    assert.ok(t.calls.some((c) => c[0] === 'zoomfit'), 'the whole-number zoom is worked out for the big window');
    assert.deepEqual(t.fake._lockFitApplied, { fit: false, portrait: false, capped: false });
});

test('a desktop lock resized short or narrow gets the crop, FIT and the camera offset', () => {
    const t = fakeLock({ fit: false, portrait: false, capped: false });
    t.box.classList.remove('lockpicking-fit');
    at(700, 500, () => H._refitLock.call(t.fake));
    assert.deepEqual(t.calls.filter((c) => c[0] === 'size'), [['size', 580, 340]]);
    assert.equal(t.scale.scaleMode, 3);
    assert.equal(t.scale.autoCenter, 1);
    assert.equal(t.scale.zoom, 1);
    assert.equal(t.box.classList.contains('lockpicking-fit'), true);
    assert.equal(t.box.classList.contains('lockpicking-zoomed'), false);
    assert.equal(t.box.style.maxWidth, '', 'the zoom width cap is cleared');
    assert.deepEqual(t.calls.find((c) => c[0] === 'max'), ['max', 580, 340], 'short landscape: no upscaling past the crop');
    assert.deepEqual(t.scroll.pop(), [0, 30]);
    assert.ok(t.calls.some((c) => c[0] === 'watchbox'), 'the box observer is started');
});

test('rotating a phone moves the crop offset and the cap, and nothing else changes', () => {
    const t = fakeLock({ fit: true, portrait: false, capped: true });
    at(390, 844, () => H._refitLock.call(t.fake));
    assert.deepEqual(t.scroll.pop(), [0, 20]);
    assert.deepEqual(t.calls.find((c) => c[0] === 'max'), ['max', Number.MAX_VALUE, Number.MAX_VALUE], 'the landscape cap is lifted');
    assert.deepEqual(t.fake._lockFitApplied, { fit: true, portrait: true, capped: false });
    // the same layout again: no rebuild, just a Phaser refresh
    t.calls.length = 0;
    at(400, 850, () => H._refitLock.call(t.fake));
    assert.deepEqual(t.calls.map((c) => c[0]), ['refresh']);
});

test('the refit is debounced and cleanup removes its listeners and timer', async () => {
    const added = [], removed = [];
    const ra = window.addEventListener, rr = window.removeEventListener;
    window.addEventListener = (n, f) => added.push([n, f]);
    window.removeEventListener = (n, f) => removed.push([n, f]);
    try {
        const t = fakeLock({ fit: true, portrait: false, capped: true });
        let refits = 0;
        t.fake._refitLock = () => { refits++; };
        H._watchLockRefit.call(t.fake);
        assert.deepEqual(added.map((a) => a[0]).sort(), ['orientationchange', 'resize']);
        const fire = added[0][1];
        fire(); fire(); fire();
        await new Promise((r) => setTimeout(r, 300));
        assert.equal(refits, 1, 'a burst of resize events is one refit');
        fire();
        H._releaseLockWatchers.call(t.fake);
        assert.deepEqual(removed.map((a) => a[0]).sort(), ['orientationchange', 'resize']);
        assert.ok(removed.every((r) => r[1] === fire), 'the same function is removed');
        await new Promise((r) => setTimeout(r, 300));
        assert.equal(refits, 1, 'a pending refit does not run after cleanup');
        assert.equal(t.fake._lockRefitOnResize, null);
    } finally { window.addEventListener = ra; window.removeEventListener = rr; }
});

test('the watchers are started with the game, for every window size', () => {
    const w = js.slice(js.indexOf('_watchLockZoom() {'), js.indexOf('startWithKeySelection'));
    assert.ok(w.indexOf('_watchLockRefit()') > -1 && w.indexOf('_watchLockRefit()') < w.indexOf('innerWidth'), 'before the desktop-only early return');
});

test('the feedback line sticks to the foot of the game area when the lock is taller than it', () => {
    const rawCss = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = /(^|\})\s*\.lockpick-feedback\s*\{([^}]*)\}/.exec(rawCss);
    assert.ok(m, 'base feedback rule');
    assert.match(m[2], /position\s*:\s*sticky/);
    assert.match(m[2], /bottom\s*:\s*\d+px/);
    assert.doesNotMatch(m[2], /border-radius|gradient|blur/);
});
