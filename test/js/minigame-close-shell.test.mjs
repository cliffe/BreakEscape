// The minigame shell's close behaviour (UX slice 7): no Cancel beside the X unless a scene
// keeps one (MinigameScene.keepsCancelButton), the X placed inside the frame
// (closeInsideFrame, placeCloseButton) and the frame watcher removed on cleanup. Also the
// infusion pump's whole-number zoom (slice 7 R2 M2). The real modules run against jsdom.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
const FakeAudioContext = function () { return anything(); };
globalThis.AudioContext = window.AudioContext = FakeAudioContext;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
const { InfusionPumpMinigame } = await imp('minigames/infusion-pump/infusion-pump-minigame.js');

function fresh() {
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = undefined;
    return document.getElementById('mg');
}

// complete() is recorded rather than run: these tests are about which path a click takes
function track(mg) {
    mg.calls = [];
    mg.complete = (success) => mg.calls.push({ success, byPlayer: mg.closedByPlayer === true });
    return mg;
}

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });

test('a plain scene given showCancel: true draws no Cancel, and its controls row is empty', () => {
    const mg = track(new MinigameScene(fresh(), { title: 'Box', showCancel: true, cancelText: 'Close' }));
    mg.init();
    assert.equal(document.getElementById('minigame-cancel'), null, 'no Cancel beside the X');
    const controls = document.querySelector('.minigame-controls');
    assert.ok(controls, 'the controls row is still there for footer buttons');
    assert.equal(controls.children.length, 0, 'and it is empty');
    assert.equal(controls.textContent.trim(), '', 'with no text, so :empty hides it');
    document.getElementById('minigame-close').click();
    assert.deepEqual(mg.calls, [{ success: false, byPlayer: true }], 'the X closes as the player');
});

test('a scene that keeps its button draws Cancel, and it closes as the player once', () => {
    class Keeps extends MinigameScene { static keepsCancelButton = true; }
    const mg = track(new Keeps(fresh(), { title: 'Sign in', cancelText: 'Continue' }));
    mg.init();
    const cancel = document.getElementById('minigame-cancel');
    assert.ok(cancel, 'Cancel is drawn');
    assert.equal(cancel.textContent, 'Continue');
    cancel.click();
    assert.deepEqual(mg.calls, [{ success: false, byPlayer: true }]);
});

test('a scene that keeps its button still draws none when the caller says showCancel: false or disableClose', () => {
    class Keeps extends MinigameScene { static keepsCancelButton = true; }
    let mg = new Keeps(fresh(), { showCancel: false });
    mg.init();
    assert.equal(document.getElementById('minigame-cancel'), null);
    mg = new Keeps(fresh(), { disableClose: true });
    mg.init();
    assert.equal(document.getElementById('minigame-cancel'), null);
    assert.equal(document.getElementById('minigame-close').style.display, 'none', 'the X is hidden too');
});

test('placeCloseButton puts the X 4px inside the frame border, measured from the container', () => {
    const mg = new MinigameScene(fresh(), { title: 'Box' });
    mg.init();
    mg.container.getBoundingClientRect = () => rect(0, 0, 800, 600);
    mg.gameContainer.getBoundingClientRect = () => rect(100, 50, 500, 400);
    mg.gameContainer.style.borderTopWidth = '2px';
    mg.gameContainer.style.borderRightWidth = '2px';
    mg.gameContainer.style.borderLeftWidth = '2px';
    mg.gameContainer.style.borderStyle = 'solid';
    mg.placeCloseButton();
    const x = document.getElementById('minigame-close');
    assert.equal(x.style.top, '56px', 'frame top 50 + border 2 + gap 4');
    assert.equal(x.style.right, '206px', 'container right 800 - frame right 600 + border 2 + gap 4');
    assert.ok(x.classList.contains('minigame-close-in-frame'));
});

test('placeCloseButton keeps the X on screen for a frame larger than the window, and clear of a scrollbar', () => {
    const mg = new MinigameScene(fresh(), { title: 'Box' });
    mg.init();
    mg.container.getBoundingClientRect = () => rect(0, 0, 800, 600);
    mg.gameContainer.getBoundingClientRect = () => rect(-20, -40, 900, 800);
    Object.defineProperty(mg.gameContainer, 'offsetWidth', { value: 900 });
    Object.defineProperty(mg.gameContainer, 'clientWidth', { value: 888 });
    mg.placeCloseButton();
    const x = document.getElementById('minigame-close');
    assert.equal(x.style.top, '4px', 'held at the window top');
    assert.equal(x.style.right, '16px', 'held at the window right, 12px scrollbar + 4px gap');
});

test('placeCloseButton leaves a hidden X and an unmeasured frame alone', () => {
    const mg = new MinigameScene(fresh(), { disableClose: true });
    mg.init();
    mg.gameContainer.getBoundingClientRect = () => rect(0, 0, 100, 100);
    mg.placeCloseButton();
    assert.equal(document.getElementById('minigame-close').style.top, '');
    const mg2 = new MinigameScene(fresh(), {});
    mg2.init();
    mg2.gameContainer.getBoundingClientRect = () => rect(0, 0, 0, 0);
    mg2.placeCloseButton();
    assert.equal(document.getElementById('minigame-close').style.top, '');
});

test('a closeInsideFrame scene watches its frame on start, and cleanup disconnects the watcher', () => {
    const observed = [];
    let disconnected = 0;
    window.ResizeObserver = class {
        constructor(cb) { this.cb = cb; }
        observe(el) { observed.push(el); }
        disconnect() { disconnected++; }
    };
    window.requestAnimationFrame = (f) => f();
    class Framed extends MinigameScene { static closeInsideFrame = true; }
    const mg = new Framed(fresh(), {});
    mg.init();
    let placed = 0;
    mg.placeCloseButton = () => { placed++; };
    mg.start();
    assert.deepEqual(observed, [mg.gameContainer], 'the frame (closeAnchor) is observed');
    assert.ok(placed >= 1, 'the X is placed on start');
    window.dispatchEvent(new window.Event('resize'));
    const afterResize = placed;
    assert.ok(afterResize >= 2, 'and again on a window resize');
    mg.cleanup();
    assert.equal(disconnected, 1, 'cleanup disconnects the observer');
    assert.equal(mg._closeObserver, null);
    window.dispatchEvent(new window.Event('resize'));
    assert.equal(placed, afterResize, 'the resize listener is gone too');
    delete window.ResizeObserver;
});

test('a scene without closeInsideFrame does not watch or move the X', () => {
    let made = 0;
    window.ResizeObserver = class { constructor() { made++; } observe() {} disconnect() {} };
    const mg = new MinigameScene(fresh(), {});
    mg.init();
    mg.start();
    assert.equal(made, 0);
    assert.equal(document.getElementById('minigame-close').style.top, '');
    mg.cleanup();
    delete window.ResizeObserver;
});

test('the pump zooms its pixel canvas by the largest whole number that fits, never below 1', () => {
    const z = (w, h) => InfusionPumpMinigame.wholeZoom(w, h, 784, 510);
    assert.equal(z(1400, 960), 1, '1.78 rounds down to 1');
    assert.equal(z(1700, 1100), 2);
    assert.equal(z(2400, 1600), 3);
    assert.equal(z(800, 560), 1);
    assert.equal(z(915, 372), 1, 'too small for 1: stays 1 and scrolls');
    assert.equal(z(0, 0), 1);
    assert.equal(z(NaN, 500), 1);
});
