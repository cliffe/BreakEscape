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
const { KeySelection } = await mjs('key-selection.js');
const js = readFileSync(join(root, 'js/minigames/lockpicking/lockpicking-game-phaser.js'), 'utf8');


globalThis.Phaser = { Scale: { FIT: 3, NONE: 0, CENTER_BOTH: 1, NO_CENTER: 0 } };
const H = LockpickingMinigamePhaser.prototype;

function fakeLock(applied) {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container" class="lockpicking-fit lockpicking-zoomed" style="max-width:1200px"></div></div>';
    const calls = [];
    const canvasStyle = { marginLeft: '9px', marginTop: '9px' };
    const scale = {
        scaleMode: 3, autoCenter: 1, zoom: 2, canvas: { style: canvasStyle },
        displaySize: { setMax: (w, h) => calls.push(['max', w, h]), setAspectMode: (m) => calls.push(['aspect', m]), setParent: (p) => calls.push(['parent', p]) },
        parentSize: { width: 400, height: 300 },
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
        _fitLockZoom: (relax) => calls.push(['zoomfit', relax]),
        _applyLockFit: H._applyLockFit,
        _watchLockBox: () => calls.push(['watchbox']),
        _placeKeyPanel: H._placeKeyPanel,
        _scrollKeyPanelIntoView: H._scrollKeyPanelIntoView,
        keySelectionContainer: null
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
    assert.deepEqual(t.calls.find((c) => c[0] === 'aspect'), ['aspect', 0], 'the display Size stops constraining to the parent');
    assert.deepEqual(t.calls.find((c) => c[0] === 'parent'), ['parent', null]);
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
    assert.deepEqual(t.calls.find((c) => c[0] === 'aspect'), ['aspect', 3]);
    assert.equal(t.calls.find((c) => c[0] === 'parent')[1], t.scale.parentSize);
    assert.equal(t.box.classList.contains('lockpicking-fit'), true);
    assert.equal(t.box.classList.contains('lockpicking-zoomed'), false);
    assert.equal(t.box.style.maxWidth, '', 'the zoom width cap is cleared');
    assert.deepEqual(t.calls.find((c) => c[0] === 'max'), ['max', 580, 340], 'short landscape: no upscaling past the crop');
    assert.deepEqual(t.scroll.pop(), [0, 30]);
    assert.ok(t.calls.some((c) => c[0] === 'watchbox'), 'the box observer is started');
});

test('a desktop refit relaxes the strip: the refit pass after a trip through the short layout passes no false (R2 m2)', () => {
    // 1280x720 compact, then 540 tall (fitted), then 900 tall: the immediate resize pass returns
    // while the fit is pending, so this refit is the only relax pass. A sticky pass would keep
    // compact on a window where the full strip fits.
    const t = fakeLock({ fit: true, portrait: false, capped: true });
    at(1280, 900, () => H._refitLock.call(t.fake));
    const z = t.calls.filter((c) => c[0] === 'zoomfit');
    assert.ok(z.length === 1, 'one zoom pass: ' + z.length);
    assert.ok(z[0][1] !== false, 'the pass relaxes (argument ' + z[0][1] + ')');
    // and an unchanged desktop layout relaxes too
    t.calls.length = 0;
    at(1280, 900, () => H._refitLock.call(t.fake));
    assert.ok(t.calls.filter((c) => c[0] === 'zoomfit').every((c) => c[1] !== false), 'a repeat refit relaxes');
});

test('refitting into the fitted layout clears the compact strip and resyncs the observation button (R2 m1)', () => {
    const t = fakeLock({ fit: false, portrait: false, capped: false });
    t.box.classList.remove('lockpicking-fit');
    const sec = document.createElement('div');
    sec.className = 'lockpicking-item-section lockpicking-compact lockpicking-info-expanded';
    const obs = document.createElement('p');
    const more = document.createElement('span');
    sec.appendChild(obs);
    document.body.appendChild(sec);
    Object.defineProperty(obs, 'scrollHeight', { get: () => 72, configurable: true });
    Object.defineProperty(obs, 'clientHeight', { get: () => 48, configurable: true });
    Object.assign(t.fake, { _itemSection: sec, _obsSection: sec, _obsEl: obs, _obsMore: more, _lockCompact: true, _syncObsButton: H._syncObsButton });
    // 1280x720: compact and expanded, a button
    at(1280, 720, () => H._syncObsButton.call(t.fake));
    assert.equal(obs.getAttribute('role'), 'button', 'compact on 720: a button');
    // narrow to 700x720: the fitted layout
    at(700, 720, () => H._refitLock.call(t.fake));
    assert.equal(t.fake._lockCompact, false, 'the flag is cleared');
    assert.equal(sec.classList.contains('lockpicking-compact'), false, 'the class is cleared');
    assert.equal(obs.getAttribute('role'), null, 'plain text, not a dead expanded button');
    assert.equal(obs.getAttribute('aria-expanded'), null);
    assert.equal(sec.classList.contains('lockpicking-info-expanded'), false);
    assert.ok(js.indexOf("classList?.remove('lockpicking-compact')") > js.indexOf('_applyLockFit(game, box, st) {')
        && js.indexOf("classList?.remove('lockpicking-compact')") < js.indexOf('this._placeKeyPanel();', js.indexOf('_applyLockFit(game, box, st) {')), 'the clear sits in _applyLockFit');
    sec.remove();
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

test('the key panel follows the crop after a refit (desktop panel to phone landscape and back)', () => {
    const t = fakeLock({ fit: false, portrait: false, capped: false });
    t.fake._portraitCameraOffset = null;
    const ys = [];
    t.fake.keySelectionContainer = { panelHeight: 160, y: 230, setY(v) { this.y = v; ys.push(v); } };
    assert.equal(KeySelection.panelY(null, 160), 230);
    at(844, 390, () => H._refitLock.call(t.fake));
    assert.equal(t.fake.keySelectionContainer.y, 206, 'crop y 30: the labels end 4px inside the crop');
    assert.ok(t.fake.keySelectionContainer.y + 160 <= 30 + 340 - 4);
    at(390, 844, () => H._refitLock.call(t.fake));
    assert.equal(t.fake.keySelectionContainer.y, 196, 'crop y 20');
    at(1366, 768, () => H._refitLock.call(t.fake));
    assert.equal(t.fake.keySelectionContainer.y, 230, 'back to the desktop y');
});

test('the builder and the refit share one panel position formula', () => {
    const src = readFileSync(join(root, 'js/minigames/lockpicking/key-selection.js'), 'utf8');
    assert.match(src, /KeySelection\.panelY\(this\.parent\._portraitCameraOffset, containerHeight\)/);
    assert.match(js, /KeySelection\.panelY\(this\._portraitCameraOffset/);
});

test('with the key panel open the game area scrolls to its end so the sticky line cannot cover the labels', () => {
    const area = { scrollTop: 0, scrollHeight: 463 };
    const f = { keySelectionContainer: {}, gameContainer: area };
    H._scrollKeyPanelIntoView.call(f);
    assert.equal(area.scrollTop, 463);
    area.scrollTop = 0;
    H._scrollKeyPanelIntoView.call({ keySelectionContainer: null, gameContainer: area });
    assert.equal(area.scrollTop, 0, 'no panel, no scroll');
});

test('a feedback line re-scrolls the game area to its end while the key panel exists, and only then', async () => {
    const { KeyInsertion } = await mjs('key-insertion.js');
    // scrollTop clamps to scrollHeight - clientHeight, as a browser does
    let top = 0;
    const area = { scrollHeight: 463, clientHeight: 400, get scrollTop() { return top; }, set scrollTop(v) { top = Math.max(0, Math.min(v, this.scrollHeight - this.clientHeight)); } };
    const parent = { feedback: { textContent: '' }, keySelectionContainer: {}, gameContainer: area, _scrollKeyPanelIntoView: H._scrollKeyPanelIntoView };
    KeyInsertion.prototype.updateFeedback.call({ parent }, 'Select a key to use');
    assert.equal(parent.feedback.textContent, 'Select a key to use');
    assert.equal(area.scrollTop, area.scrollHeight - area.clientHeight, 'at the end of the scroll');
    area.scrollTop = 0;
    parent.keySelectionContainer = null;
    KeyInsertion.prototype.updateFeedback.call({ parent }, 'Apply tension first');
    assert.equal(parent.feedback.textContent, 'Apply tension first');
    assert.equal(area.scrollTop, 0, 'no panel, no scroll');
});

test('the key panel builder stores the container before it asks for the scroll', () => {
    const seen = [];
    const parent = {
        scene: anything(), pinCount: 4, pins: [], lockConfig: anything(), keyOps: anything(), tensionWrench: null, keyData: { cuts: [1, 2, 3, 4] },
        _scrollKeyPanelIntoView() { seen.push(this.keySelectionContainer); }
    };
    const keys = [0, 1, 2].map((i) => ({ id: 'k' + i, name: 'Key ' + i, cuts: [1, 2, 3, 4], pinCount: 4 }));
    const savedPhaser = globalThis.Phaser;
    globalThis.Phaser = { ...savedPhaser, Geom: { Rectangle: Object.assign(function () {}, { Contains: () => true }) } };
    try { new KeySelection(parent).createKeySelectionUI(keys, 'k0'); } finally { globalThis.Phaser = savedPhaser; }
    assert.equal(seen.length, 1, 'the scroll is requested once');
    assert.ok(seen[0], 'keySelectionContainer is already set when the scroll runs');
    assert.equal(seen[0], parent.keySelectionContainer);
});

test('the feedback background is solid', () => {
    const rawCss = readFileSync(join(root, 'css/lockpicking.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const m = /(^|\})\s*\.lockpick-feedback\s*\{([^}]*)\}/.exec(rawCss);
    assert.match(m[2], /background\s*:\s*#000\s*;/);
});

test('the zoom listener leaves a game that is in the fitted layout alone', () => {
    const t = fakeLock({ fit: true, portrait: false, capped: true });
    let zoomed = 0;
    t.scale.setZoom = () => { zoomed++; };
    t.fake._lockRoom = () => ({ w: 1900, h: 1000 });
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.equal(zoomed, 0, 'the FIT game is not zoomed while the refit is pending');
    assert.equal(t.box.style.maxWidth, '1200px', 'the box is untouched');
    t.fake._lockFitApplied = { fit: false, portrait: false, capped: false };
    t.fake._lockRoom = () => ({ w: 700, h: 450 });   // zoom 1 against the game's 2
    at(1920, 1080, () => H._fitLockZoom.call(t.fake));
    assert.equal(zoomed, 1, 'a full-size game is zoomed as before');
});

test('lockZoom shrinks the lock below 1 when the window leaves it less than 600x400 and keeps whole zooms otherwise (R6 overflow)', () => {
    const Z = LockpickingMinigamePhaser.lockZoom;
    assert.ok(Z(1280, 258) === 0.64, 'a 258px room (1280x720, three-line observation): ' + Z(1280, 258));
    assert.ok(Z(1280, 400) === 1, 'exactly the lock');
    assert.ok(Z(1280, 399) === 0.99, 'a pixel short still shrinks');
    assert.ok(Z(1280, 799) === 1 && Z(1280, 800) === 2, 'whole zooms above 1 as before');
    assert.ok(Z(300, 800) === 0.5, 'a narrow room stops at the 0.5 floor');
    // f = 0.167 and 0.375 are below the floor: these fail if the Math.max is removed (R7 m2)
    assert.ok(Z(100, 800) === 0.5, 'a very narrow room is held at the floor: ' + Z(100, 800));
    assert.ok(Z(1280, 150) === 0.5, 'a very short room is held at the floor: ' + Z(1280, 150));
    assert.ok(Z(0, 0) === 1 && Z(NaN, 400) === 1, 'no room measured: 1');
});

test('_fitLockZoom sets a fractional zoom and the box width from the room, so the canvas fits the window (R6 overflow)', () => {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div>';
    const zooms = [];
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: (z) => zooms.push(z) } },
        _lockFitApplied: { fit: false, portrait: false, capped: false },
        _lockRoom: () => ({ w: 1200, h: 258 })
    };
    at(1280, 720, () => H._fitLockZoom.call(fake));
    assert.ok(zooms.length === 1 && zooms[0] === 0.64, 'zoom ' + zooms);
    assert.ok(document.querySelector('#phaser-game-container').style.maxWidth === '384px', 'box max-width ' + document.querySelector('#phaser-game-container').style.maxWidth);
    assert.ok(!document.querySelector('#phaser-game-container').classList.contains('lockpicking-zoomed'), 'not the zoomed class below 1');
});

test('the feedback box is observed so the zoom follows its line count, and released on cleanup (R6 overflow)', () => {
    const seen = [];
    const RO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; seen.push(this); } observe(el) { this.el = el; } disconnect() { this.gone = true; } };
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = () => 0;
    try {
        const fb = { id: 'fb' };
        const calls = [];
        const fake = { feedback: fb, _watchLockScroll: () => {}, _watchLockRefit: () => {}, _fitOnFontsReady: () => {}, _fitLockZoom: (relax) => calls.push('fit' + relax) };
        at(1280, 720, () => H._watchLockZoom.call(fake));
        assert.ok(seen.length === 1 && seen[0].el === fb, 'one observer on the feedback box');
        seen[0].cb();
        assert.ok(calls.includes('fitfalse'), 'a change of the box refits the zoom, sticky (relax false): ' + calls);
        assert.ok(!calls.includes('fitundefined') && !calls.includes('fittrue'), 'the feedback observer never relaxes');
        H._releaseLockWatchers.call(fake);
        assert.ok(seen[0].gone === true && fake._lockFeedbackObserver === null, 'disconnected on release');
    } finally {
        globalThis.ResizeObserver = RO;
        globalThis.requestAnimationFrame = raf;
    }
});

test('phones and short windows add no zoom listener and no feedback observer (R7 m3)', () => {
    const seen = [];
    const RO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class { constructor(cb) { this.cb = cb; seen.push(this); } observe() {} disconnect() {} };
    const raf = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = () => 0;
    try {
        for (const [w, h] of [[390, 844], [844, 390], [740, 360], [1280, 560], [768, 900]]) {
            const fake = { feedback: { id: 'fb' }, _watchLockScroll: () => {}, _watchLockRefit: () => {}, _fitLockZoom: () => {} };
            at(w, h, () => H._watchLockZoom.call(fake));
            assert.ok(seen.length === 0, w + 'x' + h + ' attached ' + seen.length + ' observers');
            assert.ok(!fake._lockZoomOnResize, w + 'x' + h + ' added a resize listener');
        }
    } finally {
        globalThis.ResizeObserver = RO;
        globalThis.requestAnimationFrame = raf;
    }
});

test('lockNeedsCompact is true only when the lock would need a zoom under 0.75 (short desktop window)', () => {
    const N = LockpickingMinigamePhaser.lockNeedsCompact;
    assert.ok(N(1200, 156) === true, 'a 156px room (1280x600, one-line feedback): f 0.39');
    assert.ok(N(1200, 258) === true, 'the 1280x720 three-line room (0.64) now goes compact');
    assert.ok(N(1200, 200) === true, 'the old 0.5 floor no longer decides: f 0.5');
    assert.ok(N(1200, 299) === true, 'a pixel under 0.75');
    assert.ok(N(1200, 300) === false, 'exactly 0.75 needs no compaction');
    assert.ok(N(1200, 800) === false, 'whole zooms need none');
    assert.ok(N(100, 800) === true, 'a very narrow room');
    assert.ok(N(0, 0) === false && N(NaN, 400) === false, 'no room measured: no change');
});

test('_fitLockZoom compacts the item strip when the full-size strip leaves too little room, and relaxes when it does not (short desktop window)', () => {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div><div id="sec" class="lockpicking-item-section"></div>';
    const sec = document.getElementById('sec');
    const zooms = [];
    let syncs = 0;
    let room = { full: { w: 1200, h: 156 }, compact: { w: 1200, h: 420 } };
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: (z) => { zooms.push(z); fake.game.scale.zoom = z; } } },
        _lockFitApplied: { fit: false, portrait: false, capped: false },
        _itemSection: sec,
        _syncObsButton: () => { syncs++; },
        _lockRoom: () => (sec.classList.contains('lockpicking-compact') ? room.compact : room.full)
    };
    at(1280, 600, () => H._fitLockZoom.call(fake));
    assert.ok(sec.classList.contains('lockpicking-compact'), 'the strip went compact');
    assert.ok(fake._lockCompact === true && syncs === 1, 'the observation button was resynced once: ' + syncs);
    assert.ok(zooms.length === 0 && fake.game.scale.zoom === 1, 'the compact room fits at 1x, no setZoom: ' + zooms);
    assert.ok(document.querySelector('#phaser-game-container').style.maxWidth === '600px', 'box width for zoom 1');
    // Same state again: stable, no resync
    at(1280, 600, () => H._fitLockZoom.call(fake));
    assert.ok(sec.classList.contains('lockpicking-compact') && syncs === 1, 'stable on a second pass');
    // Room opens up (a taller window): the full strip fits above LOCK_COMPACT_BELOW (0.75), so it relaxes
    room = { full: { w: 1200, h: 330 }, compact: { w: 1200, h: 600 } };
    at(1280, 700, () => H._fitLockZoom.call(fake));
    assert.ok(!sec.classList.contains('lockpicking-compact'), 'the full strip is back');
    assert.ok(fake._lockCompact === false && syncs === 2, 'resynced on the way back');
    assert.ok(zooms[zooms.length - 1] === 0.82, 'zoom follows the full-size room: ' + zooms);
});

test('_fitLockZoom: a 0.64 full-size room goes compact, and the compact strip is kept only when its zoom is bigger', () => {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div><div id="sec" class="lockpicking-item-section"></div>';
    const sec = document.getElementById('sec');
    let room = { full: { w: 1200, h: 258 }, compact: { w: 1200, h: 420 } };
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: (z) => { fake.game.scale.zoom = z; } } },
        _lockFitApplied: { fit: false, portrait: false, capped: false },
        _itemSection: sec, _syncObsButton: () => {},
        _lockRoom: () => (sec.classList.contains('lockpicking-compact') ? room.compact : room.full)
    };
    at(1366, 700, () => H._fitLockZoom.call(fake));
    assert.ok(sec.classList.contains('lockpicking-compact') && fake.game.scale.zoom === 1, 'compact, zoom 1: ' + fake.game.scale.zoom);
    // Compact gives no more than full: the full strip stays
    room = { full: { w: 1200, h: 258 }, compact: { w: 1200, h: 250 } };
    at(1366, 700, () => H._fitLockZoom.call(fake));
    assert.ok(!sec.classList.contains('lockpicking-compact'), 'a compact strip that is not bigger is dropped');
    assert.ok(fake.game.scale.zoom === 0.64, 'zoom from the full room: ' + fake.game.scale.zoom);
});

test('_fitLockZoom is sticky: a feedback pass (relax false) never drops compact, a resize pass (relax true) does (R1 M1)', () => {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div><div id="sec" class="lockpicking-item-section"></div>';
    const sec = document.getElementById('sec');
    let room = { full: { w: 1200, h: 156 }, compact: { w: 1200, h: 420 } };
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: (z) => { fake.game.scale.zoom = z; } } },
        _lockFitApplied: { fit: false, portrait: false, capped: false },
        _itemSection: sec, _syncObsButton: () => {},
        _lockRoom: () => (sec.classList.contains('lockpicking-compact') ? room.compact : room.full)
    };
    at(1366, 768, () => H._fitLockZoom.call(fake, false));
    assert.ok(sec.classList.contains('lockpicking-compact'), 'a feedback pass can add compact');
    // the feedback shrinks to one line: the full strip would now fit at 0.81, but the strip stays
    room = { full: { w: 1200, h: 330 }, compact: { w: 1200, h: 600 } };
    at(1366, 768, () => H._fitLockZoom.call(fake, false));
    assert.ok(sec.classList.contains('lockpicking-compact') && fake._lockCompact === true, 'sticky across a feedback pass');
    at(1366, 768, () => H._fitLockZoom.call(fake, false));
    assert.ok(sec.classList.contains('lockpicking-compact'), 'and again');
    assert.ok(fake.game.scale.zoom === 1, 'the lock did not change size: ' + fake.game.scale.zoom);
    // a window resize relaxes
    at(1366, 800, () => H._fitLockZoom.call(fake, true));
    assert.ok(!sec.classList.contains('lockpicking-compact') && fake._lockCompact === false, 'relax true drops it');
    // a fresh attempt starts from the full strip: no compact until a pass adds it
    const fresh = Object.assign({}, fake, { _lockCompact: undefined });
    sec.classList.add('lockpicking-compact');
    room = { full: { w: 1200, h: 330 }, compact: { w: 1200, h: 600 } };
    at(1366, 768, () => H._fitLockZoom.call(fresh, false));
    assert.ok(!sec.classList.contains('lockpicking-compact'), 'a new attempt does not inherit compact');
});

test('the window resize listener relaxes (relax true), the font load refits and resyncs, and the desktop path hooks both (R1 M1, m2)', async () => {
    const calls = [];
    const seen = [];
    const RO = globalThis.ResizeObserver;
    const raf = globalThis.requestAnimationFrame;
    globalThis.ResizeObserver = class { constructor(cb) { seen.push(cb); } observe() {} disconnect() {} };
    globalThis.requestAnimationFrame = () => 0;
    const fonts = Object.getOwnPropertyDescriptor(document, 'fonts');
    Object.defineProperty(document, 'fonts', { value: { ready: Promise.resolve() }, configurable: true });
    try {
        const fake = { feedback: {}, _watchLockScroll: () => {}, _watchLockRefit: () => {},
            _fitLockZoom: (r) => calls.push('fit:' + r), _syncObsButton: () => calls.push('sync'),
            _fitOnFontsReady: H._fitOnFontsReady };
        at(1280, 720, () => H._watchLockZoom.call(fake));
        await Promise.resolve(); await Promise.resolve();
        assert.ok(calls.includes('fit:undefined') && calls.includes('sync'), 'fonts ready: refit then resync: ' + calls);
        calls.length = 0;
        fake._lockZoomOnResize();
        assert.ok(calls.length === 1 && calls[0] === 'fit:undefined', 'resize passes no relax=false: ' + calls);
        calls.length = 0;
        seen[0]();
        assert.ok(calls[0] === 'fit:false', 'the observer is sticky: ' + calls);
        H._releaseLockWatchers.call(fake);
    } finally {
        globalThis.ResizeObserver = RO;
        globalThis.requestAnimationFrame = raf;
        if (fonts) Object.defineProperty(document, 'fonts', fonts); else delete document.fonts;
    }
});

test('the compact strip is never used by the fitted (phone or short) layout, which returns first', () => {
    document.body.innerHTML = '<div class="game"><div id="phaser-game-container"></div></div><div id="sec" class="lockpicking-item-section"></div>';
    const sec = document.getElementById('sec');
    const fake = {
        gameContainer: document.querySelector('.game'),
        game: { scale: { zoom: 1, setZoom: () => {} } },
        _lockFitApplied: { fit: true, portrait: false, capped: true },
        _itemSection: sec, _syncObsButton: () => {}, _lockRoom: () => ({ w: 1200, h: 100 })
    };
    at(1280, 600, () => H._fitLockZoom.call(fake));
    assert.ok(!sec.classList.contains('lockpicking-compact'), 'no class added in the fitted layout');
    at(844, 390, () => H._fitLockZoom.call(fake));
    assert.ok(!sec.classList.contains('lockpicking-compact'), 'no class added on a phone window');
});
