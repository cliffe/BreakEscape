// Tutorial overlay: the step set and the ready wording agree on what a touch-first
// device is (touch-only pointer, or a mobile user agent). A narrow window with a mouse
// gets the mobile steps but keeps the Enter wording.
// Run with: node --test test/js/tutorial-touch-steps.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

// Minimal DOM: the overlay's innerHTML is parsed for class names only
function el(cls) {
    const classes = new Set(cls ? cls.split(/\s+/) : []);
    return {
        textContent: '', style: {}, listeners: {},
        classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) },
        addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); },
        click() { (this.listeners.click || []).forEach(fn => fn()); },
        blur() { this.blurred = true; }
    };
}
const docListeners = { keydown: [] };
let overlayParts = {};
// Dialogs in the DOM: the real page always has hidden aria-modal panels (game menu,
// session restart confirm), so a hidden one is the default; tests flip `shown`.
const modalSel = '[aria-modal="true"]';
const mkDialog = (sel) => ({ sel, shown: false, checkVisibility() { return this.shown; } });
let hiddenModal = mkDialog(modalSel);
let extraDialogs = [];
globalThis.document = {
    createElement: () => ({
        className: '',
        set innerHTML(html) {
            overlayParts = {};
            for (const [, c] of html.matchAll(/class="([^"]+)"/g)) overlayParts['.' + c.split(' ')[0]] = el(c);
        },
        querySelector: (sel) => overlayParts[sel] || null
    }),
    body: { appendChild(o) { this.last = o; }, removeChild() {} },
    addEventListener: (t, fn) => docListeners[t].push(fn),
    removeEventListener: (t, fn) => { docListeners[t] = docListeners[t].filter(f => f !== fn); },
    querySelectorAll: (s) => {
        const wanted = String(s).split(',').map(x => x.trim());
        return [hiddenModal, ...extraDialogs].filter(d => wanted.includes(d.sel));
    }
};
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true, writable: true });
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { innerWidth: 1280, gameState: { globalVariables: {} }, matchMedia: undefined };
globalThis.confirm = () => true;

// Run timers by hand so the 100 ms completion poll is deterministic
const realSetInterval = globalThis.setInterval;
let ticks = [];
globalThis.setInterval = (fn) => { ticks.push(fn); return ticks.length; };
globalThis.clearInterval = (id) => { ticks[id - 1] = null; };
const tick = () => ticks.slice().forEach(fn => fn && fn());

const { TutorialManager } = await import(dataUrl(readFileSync(join(js, 'systems/tutorial-manager.js'), 'utf8')
    .split("'../ui/hud-lanes.js'").join(`'${dataUrl(readFileSync(join(js, 'ui/hud-lanes.js'), 'utf8'))}'`)));

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36';
const WIN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36';
const PHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1';
const TOUCH_WORDS = 'Done. Tap Continue.';
const ENTER_WORDS = 'Done. Press Continue (or Enter).';

// pointers: { coarse, fine } = (pointer: coarse) and (any-pointer: fine)
async function run({ ua, width, coarse, fine }) {
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: ua }, configurable: true, writable: true });
    window.innerWidth = width;
    window.matchMedia = (q) => ({ matches: q === '(pointer: coarse)' ? coarse : (q === '(any-pointer: fine)' ? fine : false) });
    ticks = [];
    docListeners.keydown = [];
    window.gameMenu = { isOpen: false };
    const t = new TutorialManager();
    t.promptOpen = false;
    await t.start(() => {});
    const first = t.steps[0].instruction;
    t.notifyPlayerMoved(); tick();
    return { mobileSteps: !/W, A, S, D/.test(first), first, words: overlayParts['.tutorial-ready'].textContent };
}

test('touch-only device with a Mac user agent and a wide screen gets mobile steps and Tap wording', async () => {
    const r = await run({ ua: MAC_UA, width: 1024, coarse: true, fine: false });
    assert.ok(r.mobileSteps === true, 'mobile steps, got: ' + r.first);
    assert.ok(r.words === TOUCH_WORDS, 'tap wording, got: ' + r.words);
});

test('hybrid laptop (coarse primary, fine pointer available) with a desktop UA keeps desktop steps and Enter wording', async () => {
    const r = await run({ ua: WIN_UA, width: 1280, coarse: true, fine: true });
    assert.ok(r.mobileSteps === false, 'desktop steps, got: ' + r.first);
    assert.ok(r.words === ENTER_WORDS, 'enter wording, got: ' + r.words);
});

test('plain desktop with a mouse: desktop steps and Enter wording', async () => {
    const r = await run({ ua: WIN_UA, width: 1280, coarse: false, fine: true });
    assert.ok(r.mobileSteps === false, 'desktop steps');
    assert.ok(r.words === ENTER_WORDS, 'enter wording');
});

test('mobile user agent gets mobile steps and Tap wording', async () => {
    const r = await run({ ua: PHONE_UA, width: 390, coarse: true, fine: false });
    assert.ok(r.mobileSteps === true, 'mobile steps');
    assert.ok(r.words === TOUCH_WORDS, 'tap wording, got: ' + r.words);
});

test('narrow desktop window with a mouse gets mobile steps but keeps the Enter wording', async () => {
    const r = await run({ ua: WIN_UA, width: 700, coarse: false, fine: true });
    assert.ok(r.mobileSteps === true, 'mobile steps by width, got: ' + r.first);
    assert.ok(r.words === ENTER_WORDS, 'enter wording, got: ' + r.words);
});

test('without matchMedia the user agent and width rule decide, as before', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: WIN_UA }, configurable: true, writable: true });
    window.innerWidth = 1280; window.matchMedia = undefined; ticks = [];
    let t = new TutorialManager(); t.promptOpen = false; await t.start(() => {});
    assert.ok(/W, A, S, D/.test(t.steps[0].instruction), 'desktop steps');
    window.innerWidth = 600; ticks = [];
    t = new TutorialManager(); t.promptOpen = false; await t.start(() => {});
    assert.ok(!/W, A, S, D/.test(t.steps[0].instruction), 'narrow gives mobile steps');
});

test('Android tablet with a mouse (fine pointer, 1280 wide) gets mobile steps and Tap wording', async () => {
    const r = await run({ ua: ANDROID_UA, width: 1280, coarse: false, fine: true });
    assert.ok(r.mobileSteps === true, 'mobile steps by user agent, got: ' + r.first);
    assert.ok(r.words === TOUCH_WORDS, 'tap wording from the user agent, got: ' + r.words);
});

test('relaunch after the pointer changes re-decides steps and wording together, both ways', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: MAC_UA }, configurable: true, writable: true });
    window.innerWidth = 1280; ticks = []; docListeners.keydown = []; window.gameMenu = { isOpen: false };
    window.matchMedia = (q) => ({ matches: q === '(pointer: coarse)' ? true : false });
    const t = new TutorialManager(); t.promptOpen = false;
    await t.start(() => {});
    assert.ok(!/W, A, S, D/.test(t.steps[0].instruction), 'touch-only gives mobile steps');
    // Keyboard and trackpad attached: fine pointer appears
    window.matchMedia = (q) => ({ matches: q === '(any-pointer: fine)' });
    ticks = [];
    t.relaunch();
    await new Promise(r => setImmediate(r));
    assert.ok(/W, A, S, D/.test(t.steps[0].instruction), 'relaunch gives desktop steps');
    t.notifyPlayerMoved(); tick();
    assert.ok(overlayParts['.tutorial-ready'].textContent === ENTER_WORDS, 'desktop steps pair with Enter wording');
    // Detached again: touch-only
    window.matchMedia = (q) => ({ matches: q === '(pointer: coarse)' });
    ticks = [];
    t.relaunch();
    await new Promise(r => setImmediate(r));
    assert.ok(!/W, A, S, D/.test(t.steps[0].instruction), 'second relaunch gives mobile steps');
    t.notifyPlayerMoved(); tick();
    assert.ok(overlayParts['.tutorial-ready'].textContent === TOUCH_WORDS, 'mobile steps pair with Tap wording');
});
