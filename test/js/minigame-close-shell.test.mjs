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

test('a plain scene given showCancel: true draws no Cancel, and no empty controls row', () => {
    const mg = track(new MinigameScene(fresh(), { title: 'Box', showCancel: true, cancelText: 'Close' }));
    mg.init();
    assert.equal(document.getElementById('minigame-cancel'), null, 'no Cancel beside the X');
    assert.equal(document.querySelectorAll('.minigame-controls').length, 0, 'no empty controls row');
    // A footer button gets the row on first use, under the message line, made once
    const controls = mg.ensureControlsRow();
    assert.ok(controls?.classList.contains('minigame-controls'), 'the row is made for a footer button');
    assert.equal(mg.ensureControlsRow(), controls, 'and made once');
    assert.equal(controls.previousElementSibling, mg.messageContainer, 'under the message line');
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

// Slice 7 R3 M1: the pump's box scrolls on a swipe, so its buttons act on a tap only
function pumpWithBox(scrollTop = 0) {
    const root = fresh();
    root.innerHTML = '<div class="ip-scroll-frame"><div id="ip-phaser-container"><canvas></canvas></div>'
        + '<button id="ip-more-below" hidden>MORE BELOW</button></div>';
    const mg = Object.create(InfusionPumpMinigame.prototype);
    mg.gameContainer = root;
    const box = root.querySelector('#ip-phaser-container');
    let st = scrollTop;
    Object.defineProperty(box, 'scrollTop', { get: () => st, set: (v) => { st = v; }, configurable: true });
    return { mg, box, root };
}

function fakeButton() {
    const handlers = {};
    return {
        on(type, fn) { (handlers[type] ||= []).push(fn); return this; },
        emit(type, ...args) { for (const fn of handlers[type] || []) fn(...args); return true; }
    };
}

const pointer = (distance) => ({ getDistance: () => distance });

test('the pump shows More below until the box is scrolled to its end', () => {
    const box = (sh, ch, st) => ({ scrollHeight: sh, clientHeight: ch, scrollTop: st });
    assert.equal(InfusionPumpMinigame.hasMoreBelow(box(510, 372, 0)), true);
    assert.equal(InfusionPumpMinigame.hasMoreBelow(box(510, 372, 100)), true);
    assert.equal(InfusionPumpMinigame.hasMoreBelow(box(510, 372, 138)), false, 'at the end');
    assert.equal(InfusionPumpMinigame.hasMoreBelow(box(510, 372, 137)), false, 'within 2px of the end');
    assert.equal(InfusionPumpMinigame.hasMoreBelow(box(510, 600, 0)), false, 'nothing to scroll');
    assert.equal(InfusionPumpMinigame.hasMoreBelow(null), false);
});

test('a pump button acts on a tap, not on a swipe or a press that scrolled the box', () => {
    const { mg, box } = pumpWithBox(0);
    const btn = fakeButton();
    let taps = 0;
    mg._onTap(btn, () => { taps += 1; });

    btn.emit('pointerdown'); btn.emit('pointerup', pointer(3));
    assert.equal(taps, 1, 'a still press and release is a tap');

    btn.emit('pointerdown'); btn.emit('pointerup', pointer(40));
    assert.equal(taps, 1, 'a drag is not a tap');

    btn.emit('pointerdown'); box.scrollTop = 120; btn.emit('pointerup', pointer(0));
    assert.equal(taps, 1, 'the box scrolled between press and release');

    btn.emit('pointerdown'); btn.emit('pointerout'); btn.emit('pointerup', pointer(0));
    assert.equal(taps, 1, 'released after leaving the button');

    btn.emit('pointerup', pointer(0));
    assert.equal(taps, 1, 'a release with no press on this button');

    btn.emit('pointerdown'); btn.emit('pointerup', pointer(0));
    assert.equal(taps, 2);
});

test('the pump keeps presses on More below to itself and scrolls to the end on a click', () => {
    const { mg, box, root } = pumpWithBox(0);
    Object.defineProperty(box, 'scrollHeight', { value: 510, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 372, configurable: true });
    box.scrollTo = ({ top }) => { box.scrollTop = Math.min(top, 138); };
    mg._fitZoom = () => mg._updateMoreBelow();
    const seen = [];
    for (const type of ['mousedown', 'touchstart', 'pointerdown']) window.addEventListener(type, () => seen.push(type));
    mg._watchZoom();
    const cue = root.querySelector('#ip-more-below');
    assert.equal(cue.hidden, false, 'More below shows at the top');
    for (const type of ['mousedown', 'touchstart', 'pointerdown']) cue.dispatchEvent(new window.Event(type, { bubbles: true }));
    assert.deepEqual(seen, [], 'no press on the cue reaches the window, where Phaser listens');
    cue.click();
    assert.equal(box.scrollTop, 138);
    box.dispatchEvent(new window.Event('scroll'));
    assert.equal(cue.hidden, true, 'hidden at the end');
    // Slice 7 R4 n1: a release on the cue goes on to the window, so Phaser ends the press
    const ups = [];
    for (const type of ['mouseup', 'touchend', 'pointerup']) window.addEventListener(type, () => ups.push(type));
    for (const type of ['mouseup', 'touchend', 'pointerup']) cue.dispatchEvent(new window.Event(type, { bubbles: true }));
    assert.deepEqual(ups, ['mouseup', 'touchend', 'pointerup'], 'releases on the cue reach the window');
    mg._unwatchZoom();
});

// Slice 7 R4 B1: cancelling the canvas touchend left every Phaser game's touch pointer held
// down, so the world ignored touch after the pump closed. Touch events now pass untouched;
// the browser's compatibility mouse events after a touch are stopped on the box instead.
test('the pump never cancels a canvas touch, and stops mouse events only within 800ms of a touch', () => {
    const { mg, root } = pumpWithBox(0);
    mg._fitZoom = () => {};
    const canvas = root.querySelector('canvas');
    const seen = [];
    for (const type of ['mousedown', 'mouseup', 'mousemove']) canvas.addEventListener(type, () => seen.push(type));
    const realNow = performance.now;
    let now = 10000;
    performance.now = () => now;
    try {
        mg._watchZoom();
        for (const type of ['touchstart', 'touchend']) {
            const ev = new window.Event(type, { bubbles: true, cancelable: true });
            canvas.dispatchEvent(ev);
            assert.equal(ev.defaultPrevented, false, `${type} on the canvas is not cancelled`);
        }
        now += 50;
        for (const type of ['mousedown', 'mouseup', 'mousemove']) canvas.dispatchEvent(new window.MouseEvent(type, { bubbles: true }));
        assert.deepEqual(seen, [], 'the compatibility mouse events after a tap never reach the canvas');

        now += 800;
        canvas.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
        assert.deepEqual(seen, ['mousedown'], 'a mouse press 800ms after the last touch gets through');

        mg._unwatchZoom();
        canvas.dispatchEvent(new window.Event('touchend', { bubbles: true }));
        now += 10;
        canvas.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
        assert.deepEqual(seen, ['mousedown', 'mousedown'], 'the listeners go with the pump');
        assert.equal(mg._compatMouse, null);
    } finally {
        performance.now = realNow;
    }
    assert.equal(InfusionPumpMinigame.isCompatMouse(100, 100), true);
    assert.equal(InfusionPumpMinigame.isCompatMouse(899, 100), true);
    assert.equal(InfusionPumpMinigame.isCompatMouse(900, 100), false);
    assert.equal(InfusionPumpMinigame.isCompatMouse(100, -Infinity), false, 'no touch yet');
});

test('closing any minigame releases main-game touch pointers still held down', async () => {
    const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
    const mouse = { isDown: true, active: true };
    const held = () => ({ isDown: true, active: true, buttons: 1, identifier: 7, pointerId: 7 });
    const pointers = [mouse, held(), held(), { isDown: false, active: false, identifier: -1 }];
    const mainScene = {
        input: {
            mouse: { enabled: false },
            keyboard: { enabled: false },
            manager: { pointers, mousePointer: mouse }
        }
    };
    const fw = Object.create(MinigameFramework);
    fw.mainGameScene = mainScene;
    fw.gameInputDisabled = true;
    fw.registeredScenes = {};
    fw._updateBarkLayer = () => {};
    window.resumeKeyboardInput = () => {};
    fw.currentMinigame = { cleanup() {}, params: {}, container: null };
    fw.endMinigame(false, null);
    const stillHeld = pointers.slice(1).filter((p) => p.isDown || p.active);
    assert.deepEqual(stillHeld, [], 'no touch pointer is left held after close');
    assert.equal(pointers[1].identifier, -1);
    assert.equal(mouse.isDown, true, 'the mouse pointer is left alone');
    assert.equal(fw.releaseHeldTouchPointers(), 0, 'nothing left to release');
    fw.mainGameScene = null;
    const savedGame = window.game;
    window.game = undefined;
    try {
        assert.equal(fw.releaseHeldTouchPointers(), 0, 'no main scene: no error');
    } finally {
        window.game = savedGame;
    }
});

// Slice 7 R5 m2: nothing called MinigameFramework.init before person-chat from an NPC, so
// mainGameScene was null and the release did nothing
test('with no main scene set, closing a minigame releases the held pointers of window.game', async () => {
    const { MinigameFramework } = await imp('minigames/framework/minigame-manager.js');
    const mouse = { isDown: false, active: false };
    const held = () => ({ isDown: true, active: true, buttons: 1, identifier: 3, pointerId: 3 });
    const savedGame = window.game;
    try {
        for (const shape of ['scene', 'phaser-game']) {
            const pointers = [mouse, held(), held()];
            const manager = { pointers, mousePointer: mouse };
            // window.game is the main scene once create() ran, the Phaser.Game before then
            window.game = shape === 'scene' ? { input: { manager } } : { input: manager };
            const fw = Object.create(MinigameFramework);
            fw.mainGameScene = null;
            fw.gameInputDisabled = false;
            fw.registeredScenes = {};
            fw._updateBarkLayer = () => {};
            window.resumeKeyboardInput = () => {};
            fw.currentMinigame = { cleanup() {}, params: {}, container: null };
            fw.endMinigame(false, null);
            assert.deepEqual(pointers.slice(1).filter((p) => p.isDown || p.active), [], `${shape}: both held pointers released`);
        }
    } finally {
        window.game = savedGame;
    }
});

// Slice 7 R5 m1: a real mouse click right after a tap is no longer dropped
test('the pump stops only compatibility mouse events: sourceCapabilities first, then time and nearness', () => {
    const near = { x: 100, y: 100 };
    const ev = (extra) => ({ clientX: 100, clientY: 100, ...extra });
    assert.equal(InfusionPumpMinigame.isCompatMouse(200, 100, ev({ sourceCapabilities: { firesTouchEvents: false } }), near), false,
        'a real mouse click 100ms after a touch gets through');
    assert.equal(InfusionPumpMinigame.isCompatMouse(200, 100, ev({ sourceCapabilities: { firesTouchEvents: true } }), near), true,
        "the browser's echo of the touch is stopped");
    assert.equal(InfusionPumpMinigame.isCompatMouse(5000, 100, ev({ sourceCapabilities: { firesTouchEvents: true } }), near), true,
        'an echo is stopped whatever the time');
    assert.equal(InfusionPumpMinigame.isCompatMouse(200, 100, ev({ clientX: 140 }), near), false,
        'no sourceCapabilities: a click 40px from the touch gets through');
    assert.equal(InfusionPumpMinigame.isCompatMouse(200, 100, ev({ clientX: 110 }), near), true,
        'no sourceCapabilities: a mouse event 10px from the touch within 800ms is its echo');
    assert.equal(InfusionPumpMinigame.isCompatMouse(1000, 100, ev({ clientX: 100 }), near), false,
        'no sourceCapabilities: after 800ms it is a real click');
});
